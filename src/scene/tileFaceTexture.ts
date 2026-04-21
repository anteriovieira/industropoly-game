// Bakes a tile's face (name + price + icon + sector band) into a CanvasTexture.
// Icons are drawn with simple vector shapes so no external SVGs are needed.

import * as THREE from 'three';
import type { Tile } from '@/engine/types';
import { sectorPalette } from '@/ui/theme';

const CACHE = new Map<number, THREE.CanvasTexture>();

export function tileFaceTexture(tile: Tile): THREE.CanvasTexture {
  const cached = CACHE.get(tile.id);
  if (cached) return cached;

  const W = 256;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D ctx unavailable');

  // Parchment-ish base per-face
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f0dca9');
  grad.addColorStop(1, '#d7b373');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Sector color band along the top for industries; for others, a role color.
  const bandColor = getBandColor(tile);
  if (bandColor) {
    ctx.fillStyle = bandColor;
    ctx.fillRect(0, 0, W, 38);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, W, 38);
  }

  // Icon area
  ctx.save();
  ctx.translate(W / 2, 110);
  drawIcon(ctx, tile);
  ctx.restore();

  // Name
  ctx.fillStyle = '#2c1b0a';
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, tile.name, W / 2, 172, W - 24, 20);

  // Price for purchasables
  if ('price' in tile) {
    ctx.font = 'italic 20px "IM Fell English", Georgia, serif';
    ctx.fillStyle = '#4a2b10';
    ctx.fillText(`£${tile.price}`, W / 2, H - 16);
  } else if (tile.role === 'tax') {
    ctx.font = 'italic 18px "IM Fell English", Georgia, serif';
    ctx.fillStyle = '#6a2a1b';
    ctx.fillText(`Pay £${tile.amount}`, W / 2, H - 16);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  CACHE.set(tile.id, tex);
  return tex;
}

function getBandColor(tile: Tile): string | null {
  if (tile.role === 'industry') return sectorPalette[tile.sector].base;
  if (tile.role === 'transport') return '#3a2a1a';
  if (tile.role === 'utility') return '#5a6b2e';
  if (tile.role === 'tax') return '#6a2a1b';
  if (tile.role === 'card') return tile.deck === 'invention' ? '#b8882a' : '#2f5a3a';
  if (tile.role === 'corner') return '#2c1b0a';
  return null;
}

function drawIcon(ctx: CanvasRenderingContext2D, tile: Tile): void {
  ctx.strokeStyle = '#2c1b0a';
  ctx.fillStyle = '#2c1b0a';
  ctx.lineWidth = 2;

  if (tile.role === 'industry') {
    drawChimney(ctx);
  } else if (tile.role === 'transport') {
    drawLocomotive(ctx);
  } else if (tile.role === 'utility') {
    drawCog(ctx);
  } else if (tile.role === 'tax') {
    drawCoin(ctx);
  } else if (tile.role === 'card') {
    if (tile.deck === 'invention') drawLightbulb(ctx);
    else drawScroll(ctx);
  } else if (tile.role === 'corner') {
    if (tile.corner === 'start') drawStar(ctx);
    else if (tile.corner === 'prison') drawBars(ctx);
    else if (tile.corner === 'public-square') drawCompass(ctx);
    else drawHelmet(ctx);
  }
}

function drawChimney(ctx: CanvasRenderingContext2D): void {
  ctx.strokeRect(-18, -32, 36, 56);
  ctx.beginPath();
  ctx.arc(-2, -40, 10, 0, Math.PI * 2);
  ctx.arc(14, -46, 8, 0, Math.PI * 2);
  ctx.stroke();
}
function drawLocomotive(ctx: CanvasRenderingContext2D): void {
  ctx.strokeRect(-32, -14, 50, 26);
  ctx.strokeRect(18, -4, 14, 16);
  ctx.beginPath();
  ctx.arc(-20, 18, 8, 0, Math.PI * 2);
  ctx.arc(2, 18, 8, 0, Math.PI * 2);
  ctx.arc(24, 18, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-28, -14);
  ctx.lineTo(-28, -28);
  ctx.lineTo(-16, -28);
  ctx.lineTo(-16, -14);
  ctx.stroke();
}
function drawCog(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = Math.cos(a) * 24;
    const y = Math.sin(a) * 24;
    ctx.lineTo(x, y);
    const a2 = a + Math.PI / 8;
    ctx.lineTo(Math.cos(a2) * 18, Math.sin(a2) * 18);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.stroke();
}
function drawCoin(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = '700 22px "IM Fell English", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('£', 0, 2);
}
function drawLightbulb(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.arc(0, -6, 16, Math.PI, 0);
  ctx.lineTo(12, 14);
  ctx.lineTo(-12, 14);
  ctx.closePath();
  ctx.stroke();
  ctx.strokeRect(-9, 14, 18, 8);
}
function drawScroll(ctx: CanvasRenderingContext2D): void {
  ctx.strokeRect(-22, -14, 44, 28);
  ctx.beginPath();
  ctx.moveTo(-14, -6);
  ctx.lineTo(14, -6);
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.moveTo(-14, 6);
  ctx.lineTo(6, 6);
  ctx.stroke();
}
function drawStar(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? 22 : 10;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.stroke();
}
function drawBars(ctx: CanvasRenderingContext2D): void {
  ctx.strokeRect(-22, -22, 44, 44);
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10, -22);
    ctx.lineTo(i * 10, 22);
    ctx.stroke();
  }
}
function drawCompass(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(5, 0);
  ctx.lineTo(0, 20);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.stroke();
}
function drawHelmet(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.arc(0, 0, 22, Math.PI, 0);
  ctx.lineTo(22, 6);
  ctx.lineTo(-22, 6);
  ctx.closePath();
  ctx.stroke();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];
  for (const w of words) {
    const testLine = line ? `${line} ${w}` : w;
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(line);
      line = w;
    } else {
      line = testLine;
    }
  }
  if (line) lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, x, startY + i * lineHeight);
  }
}
