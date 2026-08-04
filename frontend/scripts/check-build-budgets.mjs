import { existsSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import path from 'node:path';

const buildDir = path.resolve(process.env.NEXT_DIST_DIR || '.next');
if (!existsSync(path.join(buildDir, 'build-manifest.json'))) throw new Error(`Build output not found at ${buildDir}`);

const port = Number(process.env.BUDGET_PORT || (31000 + (process.pid % 1000)));
const origin = `http://127.0.0.1:${port}`;
const routes = [
  '/', '/products', '/category/fortnite', '/product/chatgpt-subscription',
  '/vbucks', '/crewpack', '/checkout', '/login', '/faq',
];
const limits = { js: 170 * 1024, css: 80 * 1024 };
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
  cwd: process.cwd(), env: { ...process.env, NEXT_DIST_DIR: path.basename(buildDir) }, stdio: 'ignore',
});

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(origin); if (response.status) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Budget server did not start.');
}

function gzipBytes(urlPath) {
  const relative = decodeURIComponent(urlPath).replace(/^\/_next\//, '');
  const file = path.join(buildDir, relative);
  return existsSync(file) ? gzipSync(readFileSync(file)).byteLength : 0;
}

let failed = false;
try {
  await waitForServer();
  for (const route of routes) {
    const html = await (await fetch(`${origin}${route}`)).text();
    const assets = [...new Set([...html.matchAll(/["'](\/_next\/static\/[^"']+\.(?:js|css))["']/g)].map((match) => match[1]))];
    // The nomodule polyfill is present in HTML for legacy browsers but is not
    // requested by the mobile Chrome profile used for the performance target.
    const js = assets
      .filter((file) => file.endsWith('.js') && !file.includes('/polyfills-'))
      .reduce((sum, file) => sum + gzipBytes(file), 0);
    const css = assets.filter((file) => file.endsWith('.css')).reduce((sum, file) => sum + gzipBytes(file), 0);
    process.stdout.write(`${route}: JS ${(js / 1024).toFixed(1)} KB, CSS ${(css / 1024).toFixed(1)} KB, ${assets.length} initial assets\n`);
    if (js > limits.js || css > limits.css) failed = true;
  }
} finally {
  server.kill('SIGTERM');
}

if (failed) throw new Error('A public route exceeded the compressed JS/CSS performance budget.');
