// Browser-only helpers for the signup avatar picker: preset avatars
// (rendered to a PNG client-side) and automatic compression of an
// uploaded photo before it's sent to POST /api/me/avatar.

export const PRESET_AVATARS = [
  { id: "fox", emoji: "🦊", gradient: ["#8B5CF6", "#EC4899"] },
  { id: "robot", emoji: "🤖", gradient: ["#0ea5e9", "#6366f1"] },
  { id: "ghost", emoji: "👻", gradient: ["#64748b", "#1e293b"] },
  { id: "alien", emoji: "👽", gradient: ["#10B981", "#059669"] },
  { id: "ninja", emoji: "🥷", gradient: ["#111827", "#4b5563"] },
  { id: "dragon", emoji: "🐉", gradient: ["#f97316", "#f59e0b"] },
  { id: "wizard", emoji: "🧙", gradient: ["#2563eb", "#7c3aed"] },
  { id: "cat", emoji: "🐱", gradient: ["#f59e0b", "#ef4444"] },
];

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas, type = "image/jpeg", quality = 0.85) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), type, quality);
  });
}

// Resizes/compresses an uploaded photo so it comfortably fits under the
// backend's 2MB cap, regardless of the original resolution/format.
export async function compressImageFile(file, { maxDim = 512, quality = 0.85 } = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    return await canvasToBlob(canvas, "image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// Rasterizes a preset (gradient circle + emoji) into a PNG blob so it can
// be uploaded through the same /api/me/avatar endpoint as a real photo.
export async function renderPresetAvatarBlob(preset, { size = 256 } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, preset.gradient[0]);
  gradient.addColorStop(1, preset.gradient[1]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `${Math.round(size * 0.55)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(preset.emoji, size / 2, size / 2 + size * 0.04);

  return canvasToBlob(canvas, "image/png", 0.92);
}
