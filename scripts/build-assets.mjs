#!/usr/bin/env node
/**
 * Turns the raw art in `assets/` into the WebP the app actually ships.
 *
 * The originals are mostly PNGs straight out of the image tool — a single
 * lesson-node medallion is 430 KB, and this app is opened on phones over mobile
 * data. WebP at the size it is displayed brings the whole set down by roughly
 * 10×. Art that already arrives as WebP still passes through, because it is the
 * resizing that does most of the work.
 *
 * `assets/` is the source of truth: drop a new PNG in, re-run `npm run assets`,
 * and the WebP under `src/assets/` is regenerated. Nothing reads the PNGs at
 * runtime, so they never reach the bundle.
 *
 * Usage: npm run assets
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = (p) => join(root, 'assets', p);
const to = (p) => join(root, 'src/assets', p);

/**
 * Each group names its output width. Sizes are ~2× the largest size the art is
 * drawn at, which covers retina without paying for pixels nobody sees. `null`
 * keeps the source size (it is already small enough).
 */
const GROUPS = [
  // The backdrop is the one full-bleed image, so it gets the most pixels and the
  // lowest quality — noise in a starfield is invisible, and it is downloaded on
  // every first paint. `sizes` overrides the group width for the odd file that
  // is nothing like the others.
  {
    dir: '.',
    out: '.',
    width: 1600,
    quality: 72,
    sizes: { 'currency.png': 128, 'good_job_star.webp': 380 },
  },
  { dir: 'professor', out: 'professorson', width: 320, quality: 82 },
  { dir: 'planets', out: 'planets', width: 240, quality: 80 },
  { dir: 'lesson_nodes', out: 'nodes', width: 240, quality: 82 },
  { dir: 'project', out: 'rocket', width: 420, quality: 84 },
];

/** Files whose name would be awkward as an import; renamed on the way through. */
const RENAME = {
  'planet_1 (1).png': 'planet_9.png',
  'full_size.png': 'full.png',
};

async function convertGroup({ dir, out, width, quality, sizes = {} }) {
  const srcDir = from(dir);
  const outDir = to(out);
  await mkdir(outDir, { recursive: true });

  const files = (await readdir(srcDir)).filter((f) => /\.(png|webp)$/i.test(f)).sort();
  let before = 0;
  let after = 0;

  for (const file of files) {
    const name = (RENAME[file] ?? file).replace(/\.(png|webp)$/i, '.webp');
    const input = join(srcDir, file);
    before += (await stat(input)).size;

    const image = sharp(input);
    const meta = await image.metadata();
    const target = sizes[file] ?? width;
    // Never upscale: some of the art is already smaller than the target.
    const resized = meta.width > target ? image.resize({ width: target }) : image;
    // `alphaQuality: 100` matters more than it looks: lossy alpha smears the
    // transparent margin of a cut-out, and a CSS drop-shadow then traces a faint
    // rectangle around the whole image instead of the artwork.
    const buffer = await resized.webp({ quality, alphaQuality: 100, effort: 6 }).toBuffer();

    await writeFile(join(outDir, name), buffer);
    after += buffer.length;
  }

  const kb = (n) => `${Math.round(n / 1024)} KB`;
  console.log(`${dir} → src/assets/${out}: ${files.length} files, ${kb(before)} → ${kb(after)}`);
}

for (const group of GROUPS) await convertGroup(group);
