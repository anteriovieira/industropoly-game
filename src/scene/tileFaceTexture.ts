// Bakes a tile's face (name + price + icon + sector band) into a CanvasTexture.
// Icons are drawn as filled silhouettes with shading so they read clearly
// from a distance while still feeling like Victorian engravings.

import * as THREE from 'three';
import type { Tile } from '@/engine/types';
import { sectorPalette } from '@/ui/theme';

const CACHE = new Map<number, THREE.CanvasTexture>();

const INK = '#1f1208';
const INK_SOFT = '#3a2210';
const SHADE = 'rgba(20, 12, 4, 0.4)';

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

  // Parchment-ish base per-face — vertical gradient + tiny grain so faces
  // don't look perfectly uniform.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f0dca9');
  grad.addColorStop(1, '#d7b373');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  // Grain
  for (let i = 0; i < 60; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = `rgba(80, 50, 20, ${0.02 + Math.random() * 0.04})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Sector color band along the top with a thin brass underline.
  const bandColor = getBandColor(tile);
  if (bandColor) {
    const bg = ctx.createLinearGradient(0, 0, 0, 38);
    bg.addColorStop(0, shadeColor(bandColor, -8));
    bg.addColorStop(1, bandColor);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, 38);
    // Brass underline
    ctx.fillStyle = '#c9943a';
    ctx.fillRect(0, 38, W, 2);
    ctx.fillStyle = 'rgba(255, 247, 214, 0.4)';
    ctx.fillRect(0, 38, W, 1);
  }

  // Icon area
  ctx.save();
  ctx.translate(W / 2, 110);
  drawIcon(ctx, tile);
  ctx.restore();

  // Name
  ctx.fillStyle = INK;
  ctx.font = '600 16px "Inter", sans-serif';
  ctx.textAlign = 'center';
  wrapText(ctx, tile.name, W / 2, 178, W - 24, 19);

  // Price for purchasables
  if ('price' in tile) {
    ctx.font = 'italic 22px "IM Fell English", Georgia, serif';
    ctx.fillStyle = '#8a4a1c';
    ctx.fillText(`R$${tile.price}`, W / 2, H - 16);
  } else if (tile.role === 'tax') {
    ctx.font = 'italic 18px "IM Fell English", Georgia, serif';
    ctx.fillStyle = '#6a2a1b';
    ctx.fillText(`Pagar R$${tile.amount}`, W / 2, H - 16);
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
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';

  if (tile.role === 'industry') {
    drawFactory(ctx, tile.sector);
  } else if (tile.role === 'transport') {
    drawLocomotive(ctx);
  } else if (tile.role === 'utility') {
    drawCog(ctx);
  } else if (tile.role === 'tax') {
    drawCoinStack(ctx);
  } else if (tile.role === 'card') {
    if (tile.deck === 'invention') drawLightbulb(ctx);
    else drawSealedScroll(ctx);
  } else if (tile.role === 'corner') {
    if (tile.corner === 'start') drawSunburst(ctx);
    else if (tile.corner === 'prison') drawWindowBars(ctx);
    else if (tile.corner === 'public-square') drawTopHat(ctx);
    else drawConstable(ctx);
  }
}

// ── Industry: factory with chimney + sector-tinted detail ─────────────────
function drawFactory(ctx: CanvasRenderingContext2D, sector: string): void {
  // Building body
  ctx.fillStyle = INK_SOFT;
  ctx.fillRect(-26, -8, 52, 32);
  // Sawtooth roof — three triangles
  ctx.beginPath();
  for (let i = -3; i <= 2; i++) {
    ctx.moveTo(i * 11, -8);
    ctx.lineTo(i * 11 + 5.5, -22);
    ctx.lineTo(i * 11 + 11, -8);
  }
  ctx.fillStyle = INK;
  ctx.fill();
  // Windows on body
  ctx.fillStyle = '#e8d2a0';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-22 + i * 18, 4, 10, 10);
  }
  // Chimney on right
  ctx.fillStyle = INK;
  ctx.fillRect(20, -42, 8, 28);
  ctx.fillRect(18, -44, 12, 4);
  // Smoke puffs
  ctx.fillStyle = SHADE;
  ctx.beginPath();
  ctx.arc(28, -50, 5, 0, Math.PI * 2);
  ctx.arc(34, -56, 6, 0, Math.PI * 2);
  ctx.arc(40, -62, 7, 0, Math.PI * 2);
  ctx.fill();
  // Sector dot bottom-left as identifier
  ctx.fillStyle = sectorPalette[sector as keyof typeof sectorPalette]?.base ?? INK;
  ctx.beginPath();
  ctx.arc(-30, 22, 4, 0, Math.PI * 2);
  ctx.fill();
}

// ── Transport: side-view steam locomotive ─────────────────────────────────
function drawLocomotive(ctx: CanvasRenderingContext2D): void {
  // Boiler (cylinder body)
  ctx.fillStyle = INK_SOFT;
  ctx.fillRect(-30, -10, 38, 18);
  // Boiler dome
  ctx.beginPath();
  ctx.arc(-12, -10, 5, Math.PI, 0);
  ctx.fillStyle = INK;
  ctx.fill();
  // Cab
  ctx.fillStyle = INK_SOFT;
  ctx.fillRect(8, -16, 16, 24);
  // Cab roof
  ctx.fillStyle = INK;
  ctx.fillRect(6, -18, 20, 4);
  // Cab window
  ctx.fillStyle = '#e8d2a0';
  ctx.fillRect(11, -10, 8, 6);
  // Smokestack
  ctx.fillStyle = INK;
  ctx.fillRect(-26, -22, 8, 12);
  ctx.fillRect(-28, -24, 12, 4);
  // Smoke
  ctx.fillStyle = SHADE;
  ctx.beginPath();
  ctx.arc(-22, -32, 5, 0, Math.PI * 2);
  ctx.arc(-16, -38, 6, 0, Math.PI * 2);
  ctx.arc(-10, -44, 5, 0, Math.PI * 2);
  ctx.fill();
  // Big drive wheel + smaller wheels
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-2, 12, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7b373';
  ctx.beginPath();
  ctx.arc(-2, 12, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(-22, 14, 6, 0, Math.PI * 2);
  ctx.arc(18, 14, 6, 0, Math.PI * 2);
  ctx.fill();
  // Rail
  ctx.fillRect(-36, 22, 64, 2);
}

// ── Utility: detailed gear with center bolt ───────────────────────────────
function drawCog(ctx: CanvasRenderingContext2D): void {
  const teeth = 12;
  const outer = 26;
  const inner = 20;
  ctx.fillStyle = INK_SOFT;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Center hub
  ctx.fillStyle = '#d7b373';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  // Hex bolt in the middle
  ctx.fillStyle = INK;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(a) * 6;
    const y = Math.sin(a) * 6;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // Bolt highlight
  ctx.fillStyle = 'rgba(255, 247, 214, 0.3)';
  ctx.beginPath();
  ctx.arc(-2, -2, 2, 0, Math.PI * 2);
  ctx.fill();
}

// ── Tax: stack of three coins ─────────────────────────────────────────────
function drawCoinStack(ctx: CanvasRenderingContext2D): void {
  for (let i = 2; i >= 0; i--) {
    const y = i * 6;
    // Coin face
    ctx.fillStyle = '#c9943a';
    ctx.beginPath();
    ctx.ellipse(0, y, 22, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Edge band
    if (i === 0) {
      // top coin — visible top face
      ctx.fillStyle = '#fae2a0';
      ctx.beginPath();
      ctx.ellipse(0, y, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Side stripe under (the visible band of the coin under)
    if (i > 0) {
      ctx.fillStyle = '#8a6422';
      ctx.fillRect(-22, y - 1, 44, 6);
      ctx.fillStyle = '#c9943a';
      ctx.beginPath();
      ctx.ellipse(0, y - 1, 22, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Currency mark on top coin
  ctx.fillStyle = INK;
  ctx.font = '700 16px "IM Fell English", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('£', 0, 0);
}

// ── Invention card: edison-style lightbulb with filament ─────────────────
function drawLightbulb(ctx: CanvasRenderingContext2D): void {
  // Glass bulb
  ctx.fillStyle = '#f0dca9';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -8, 18, Math.PI * 0.85, Math.PI * 0.15, false);
  ctx.lineTo(10, 14);
  ctx.lineTo(-10, 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Filament — zigzag inside
  ctx.strokeStyle = '#b85d22';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-7, 4);
  ctx.lineTo(-3, -10);
  ctx.lineTo(3, 4);
  ctx.lineTo(7, -10);
  ctx.lineTo(11, 4);
  ctx.stroke();
  // Glow halo
  ctx.fillStyle = 'rgba(255, 200, 100, 0.25)';
  ctx.beginPath();
  ctx.arc(0, -4, 22, 0, Math.PI * 2);
  ctx.fill();
  // Brass screw base
  ctx.fillStyle = '#c9943a';
  ctx.fillRect(-9, 14, 18, 5);
  ctx.fillRect(-7, 19, 14, 4);
  ctx.fillRect(-5, 23, 10, 3);
  // Bolt at very bottom
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0, 28, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// ── Edict card: rolled scroll with red wax seal ───────────────────────────
function drawSealedScroll(ctx: CanvasRenderingContext2D): void {
  // Scroll body
  ctx.fillStyle = '#f0dca9';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(-26, -16, 52, 32);
  ctx.strokeRect(-26, -16, 52, 32);
  // Rolled ends
  ctx.fillStyle = '#d7b373';
  ctx.beginPath();
  ctx.ellipse(-26, 0, 5, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(26, 0, 5, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1.2;
  // Text lines
  for (let i = -1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-18, i * 6 - 4);
    ctx.lineTo(18, i * 6 - 4);
    ctx.stroke();
  }
  // Wax seal
  ctx.fillStyle = '#8a1a14';
  ctx.beginPath();
  ctx.arc(0, 16, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a0a08';
  ctx.beginPath();
  ctx.arc(0, 16, 5, 0, Math.PI * 2);
  ctx.fill();
  // Seal highlight
  ctx.fillStyle = 'rgba(255, 200, 200, 0.3)';
  ctx.beginPath();
  ctx.arc(-1.5, 14, 1.8, 0, Math.PI * 2);
  ctx.fill();
}

// ── Start corner: sunburst (rays radiating from sun) ──────────────────────
function drawSunburst(ctx: CanvasRenderingContext2D): void {
  // Rays
  ctx.strokeStyle = '#c9943a';
  ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * 26, Math.sin(a) * 26);
    ctx.stroke();
  }
  // Sun disk
  const sunGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 14);
  sunGrad.addColorStop(0, '#fae2a0');
  sunGrad.addColorStop(1, '#c9943a');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ── Prison corner: prison window (4 bars + brick frame) ───────────────────
function drawWindowBars(ctx: CanvasRenderingContext2D): void {
  // Stone frame
  ctx.fillStyle = INK_SOFT;
  ctx.fillRect(-26, -26, 52, 52);
  // Window opening
  ctx.fillStyle = '#1a0d04';
  ctx.fillRect(-20, -20, 40, 40);
  // Bars
  ctx.fillStyle = '#c9943a';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * 12 - 1.5, -22, 3, 44);
  }
  ctx.fillRect(-22, -2, 44, 3);
  // Brick lines on frame
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-26, i * 10 - 4);
    ctx.lineTo(26, i * 10 - 4);
    ctx.stroke();
  }
}

// ── Public square corner: top hat ─────────────────────────────────────────
function drawTopHat(ctx: CanvasRenderingContext2D): void {
  // Brim
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.ellipse(0, 14, 28, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hat body
  ctx.fillRect(-16, -22, 32, 36);
  // Top edge
  ctx.fillStyle = INK_SOFT;
  ctx.beginPath();
  ctx.ellipse(0, -22, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Ribbon band
  ctx.fillStyle = '#8a1a14';
  ctx.fillRect(-16, 6, 32, 5);
  // Highlight on hat body
  ctx.fillStyle = 'rgba(255, 247, 214, 0.12)';
  ctx.fillRect(-14, -20, 4, 30);
}

// ── Go-to-prison corner: constable helmet (Victorian bobby) ───────────────
function drawConstable(ctx: CanvasRenderingContext2D): void {
  // Dome
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(0, 0, 22, Math.PI, 0);
  ctx.lineTo(22, 8);
  ctx.lineTo(-22, 8);
  ctx.closePath();
  ctx.fill();
  // Dome highlight
  ctx.fillStyle = 'rgba(255, 247, 214, 0.15)';
  ctx.beginPath();
  ctx.ellipse(-8, -10, 4, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  // Brass badge
  ctx.fillStyle = '#c9943a';
  ctx.beginPath();
  ctx.arc(0, -4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fae2a0';
  ctx.beginPath();
  ctx.arc(-1.5, -5.5, 2, 0, Math.PI * 2);
  ctx.fill();
  // Chinstrap
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, 6);
  ctx.lineTo(0, 14);
  ctx.lineTo(22, 6);
  ctx.stroke();
  // Top knob
  ctx.fillStyle = '#c9943a';
  ctx.beginPath();
  ctx.arc(0, -22, 3, 0, Math.PI * 2);
  ctx.fill();
}

// ── Helpers ───────────────────────────────────────────────────────────────
function shadeColor(hex: string, amount: number): string {
  // Quick lighten/darken — amount in -100..100. Used for the band gradient top.
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  const r = clamp255(parseInt(m[1]!, 16) + amount);
  const g = clamp255(parseInt(m[2]!, 16) + amount);
  const b = clamp255(parseInt(m[3]!, 16) + amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
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
