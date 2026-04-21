/**
 * Render the PWA icon set from the source SVGs in assets/icon/.
 * Outputs go to public/ so they are served at site root.
 *
 * Run: npm run icons
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconDir = path.join(root, 'assets', 'icon');
const publicDir = path.join(root, 'public');

type Job = { src: string; out: string; size: number };

const jobs: Job[] = [
  { src: 'industropoly-icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'industropoly-icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'industropoly-icon-maskable.svg', out: 'icon-maskable-512.png', size: 512 },
  { src: 'industropoly-icon.svg', out: 'apple-touch-icon.png', size: 180 },
];

async function run() {
  await mkdir(publicDir, { recursive: true });

  for (const job of jobs) {
    const svgPath = path.join(iconDir, job.src);
    const outPath = path.join(publicDir, job.out);
    const svg = await readFile(svgPath);
    const png = await sharp(svg, { density: 384 })
      .resize(job.size, job.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    await writeFile(outPath, png);
    console.log(`wrote ${path.relative(root, outPath)} (${job.size}×${job.size})`);
  }

  // Also copy the favicon SVG to public/ for direct <link rel="icon"> use.
  const faviconSvg = await readFile(path.join(iconDir, 'industropoly-favicon.svg'));
  await writeFile(path.join(publicDir, 'favicon.svg'), faviconSvg);
  console.log('wrote public/favicon.svg');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
