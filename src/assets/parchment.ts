// Procedurally generates a parchment texture at runtime using a canvas.
// Avoids shipping a binary asset while still producing a sepia, weathered-paper look
// that matches the reference image: mottled cream, darker edges, subtle fibers.

import * as THREE from 'three';

let cached: THREE.CanvasTexture | null = null;

export function getParchmentTexture(size = 1024): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  // Base wash.
  const grad = ctx.createRadialGradient(
    size * 0.35,
    size * 0.3,
    size * 0.1,
    size * 0.5,
    size * 0.5,
    size * 0.75,
  );
  grad.addColorStop(0, '#f5e3b6');
  grad.addColorStop(0.55, '#e3cf9c');
  grad.addColorStop(1, '#b08a4d');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Mottled staining.
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 80;
    const a = 0.02 + Math.random() * 0.06;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(120, 80, 30, ${a})`);
    g.addColorStop(1, 'rgba(120, 80, 30, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle fiber noise.
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    img.data[i] = clamp255(img.data[i]! + n);
    img.data[i + 1] = clamp255(img.data[i + 1]! + n * 0.9);
    img.data[i + 2] = clamp255(img.data[i + 2]! + n * 0.7);
  }
  ctx.putImageData(img, 0, 0);

  // Vignette + darker edges to match the aged-paper reference.
  const v = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.35,
    size / 2,
    size / 2,
    size * 0.75,
  );
  v.addColorStop(0, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(80, 50, 20, 0.55)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  cached = tex;
  return tex;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
