// Browser-only helpers for the signup avatar picker: preset avatars
// (rendered to a PNG client-side) and automatic compression of an
// uploaded photo before it's sent to POST /api/me/avatar.

export const PRESET_AVATARS = [
  { id: "blue-hoodie-boy", label: "هودی آبی", src: "/avatars/01-blue-hoodie-boy.webp", gradient: ["#1d4ed8", "#38bdf8"] },
  { id: "purple-beanie-girl", label: "بینی بنفش", src: "/avatars/02-purple-beanie-girl.webp", gradient: ["#7c3aed", "#d946ef"] },
  { id: "green-hoodie-boy", label: "هودی سبز", src: "/avatars/03-green-hoodie-boy.webp", gradient: ["#166534", "#22c55e"] },
  { id: "yellow-hoodie-girl", label: "هودی طلایی", src: "/avatars/04-yellow-hoodie-girl.webp", gradient: ["#d97706", "#facc15"] },
  { id: "corgi", label: "کورگی گیمر", src: "/avatars/05-corgi.webp", gradient: ["#f59e0b", "#f97316"] },
  { id: "baby-dino", label: "داینو کوچولو", src: "/avatars/06-baby-dino.webp", gradient: ["#059669", "#5eead4"] },
  { id: "winter-penguin", label: "پنگوئن زمستانی", src: "/avatars/07-winter-penguin.webp", gradient: ["#0f172a", "#ef4444"] },
  { id: "gray-cat", label: "گربه خاکستری", src: "/avatars/08-gray-cat.webp", gradient: ["#475569", "#a78bfa"] },
  { id: "glasses-boy", label: "عینکی باهوش", src: "/avatars/09-glasses-boy.webp", gradient: ["#365314", "#f59e0b"] },
  { id: "blonde-girl", label: "بلوند فانتزی", src: "/avatars/10-blonde-girl.webp", gradient: ["#f59e0b", "#f0abfc"] },
  { id: "teal-cap-boy", label: "کپ فیروزه‌ای", src: "/avatars/11-teal-cap-boy.webp", gradient: ["#0f766e", "#06b6d4"] },
  { id: "black-hair-girl", label: "مو مشکی", src: "/avatars/12-black-hair-girl.webp", gradient: ["#111827", "#fbbf24"] },
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

  if (preset.src) {
    const img = await loadImage(preset.src);
    const sourceSize = Math.min(img.width, img.height);
    const sx = Math.max(0, Math.floor((img.width - sourceSize) / 2));
    const sy = Math.max(0, Math.floor((img.height - sourceSize) / 2));
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
    return canvasToBlob(canvas, "image/webp", 0.9);
  }

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, preset.gradient[0]);
  gradient.addColorStop(1, preset.gradient[1]);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const shine = ctx.createRadialGradient(size * 0.28, size * 0.22, 0, size * 0.28, size * 0.22, size * 0.75);
  shine.addColorStop(0, "rgba(255,255,255,0.5)");
  shine.addColorStop(0.36, "rgba(255,255,255,0.12)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "rgba(15,23,42,0.45)";
  ctx.shadowBlur = size * 0.08;
  ctx.shadowOffsetY = size * 0.035;
  ctx.font = `${Math.round(size * 0.55)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(preset.emoji, size / 2, size / 2 + size * 0.04);

  return canvasToBlob(canvas, "image/png", 0.92);
}
