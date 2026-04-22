// Procedurally generates a stained-oak wood texture at runtime using a canvas.
// Creates visible grain rings + knots so the table reads as a polished wooden
// surface under warm lighting, matching the reference parlour-table look.

import * as THREE from 'three';

let cached: THREE.CanvasTexture | null = null;

export function getWoodTexture(size = 1024): THREE.CanvasTexture {
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  // Base color — warm dark stained oak.
  const base = ctx.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#3a2410');
  base.addColorStop(0.5, '#4a2e15');
  base.addColorStop(1, '#2e1a0a');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  // Grain rings — nested ellipses offset toward the top-left. Each ring is a
  // very thin darker line that reads as the wood's growth rings. Rotate the
  // coordinate system a bit so grain runs diagonally for visual interest.
  ctx.save();
  ctx.translate(size * 0.5, size * 0.5);
  ctx.rotate(0.12);
  ctx.translate(-size * 0.5, -size * 0.5);

  const ringOriginX = -size * 0.4;
  const ringOriginY = size * 0.45;
  for (let i = 0; i < 140; i++) {
    const radius = 20 + i * 14 + Math.random() * 6;
    ctx.beginPath();
    ctx.ellipse(
      ringOriginX,
      ringOriginY,
      radius,
      radius * 1.08,
      0,
      0,
      Math.PI * 2,
    );
    const shade = 0.04 + Math.random() * 0.06;
    ctx.strokeStyle = `rgba(20, 10, 4, ${shade})`;
    ctx.lineWidth = 1 + Math.random() * 2.2;
    ctx.stroke();
  }
  ctx.restore();

  // Long grain streaks — thin horizontal lines with sinusoidal displacement,
  // suggesting the wood's fibrous direction.
  for (let i = 0; i < 180; i++) {
    const y = Math.random() * size;
    const amp = 4 + Math.random() * 10;
    const period = 140 + Math.random() * 180;
    const shade = 0.02 + Math.random() * 0.05;
    ctx.strokeStyle = `rgba(12, 6, 2, ${shade})`;
    ctx.lineWidth = 0.8 + Math.random() * 1.4;
    ctx.beginPath();
    for (let x = 0; x <= size; x += 6) {
      const yy = y + Math.sin((x / period) * Math.PI * 2 + i) * amp;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  // A couple of small knots for character — dark round spots with rings around them.
  for (let k = 0; k < 3; k++) {
    const kx = size * (0.15 + Math.random() * 0.7);
    const ky = size * (0.15 + Math.random() * 0.7);
    const kr = 8 + Math.random() * 10;
    const g = ctx.createRadialGradient(kx, ky, 0, kx, ky, kr * 2.5);
    g.addColorStop(0, 'rgba(10, 4, 2, 0.7)');
    g.addColorStop(0.5, 'rgba(20, 10, 4, 0.35)');
    g.addColorStop(1, 'rgba(20, 10, 4, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(kx, ky, kr * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle pixel noise for tactile roughness.
  const img = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] = clamp255(img.data[i]! + n);
    img.data[i + 1] = clamp255(img.data[i + 1]! + n * 0.8);
    img.data[i + 2] = clamp255(img.data[i + 2]! + n * 0.6);
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  cached = tex;
  return tex;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}
