#!/usr/bin/env node
/**
 * Generates the planned assets in one Screen Package with GPT Image.
 *
 * The API key is read only from the process environment. It is never bundled
 * into Vite, saved in a task package or written to an output file.
 *
 * Usage:
 *   OPENAI_API_KEY=… npm run screen:assets -- projects-workshop
 *   OPENAI_API_KEY=… npm run screen:assets -- projects-workshop --force
 */
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, option] = process.argv.slice(2);
const force = option === '--force';
if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  throw new Error('Usage: npm run screen:assets -- <kebab-case-id> [--force]');
}
const packageDir = join(root, 'tasks', id);
const manifest = JSON.parse(await readFile(join(packageDir, 'assets-manifest.json'), 'utf8'));
if (manifest.schema !== 'algebaran.screen-assets.v1')
  throw new Error('Unsupported asset manifest.');

const planned = manifest.assets.filter((asset) => asset.status === 'planned');
if (planned.length === 0) {
  console.log(`No planned assets in tasks/${id}.`);
  process.exit(0);
}
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required. Put it in your shell, never in VITE_ variables.');
}

for (const asset of planned) {
  const output = join(packageDir, 'assets', `${asset.id}.png`);
  if (!force) {
    try {
      await access(output);
      console.log(`Skipped ${asset.id} (already generated)`);
      continue;
    } catch {
      // The first generation should proceed.
    }
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt: asset.prompt,
      size: asset.size ?? '1024x1024',
      quality: asset.quality ?? 'low',
      background: asset.transparent ? 'transparent' : 'opaque',
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.data?.[0]?.b64_json) {
    throw new Error(
      `Generation failed for ${asset.id}: ${payload.error?.message ?? response.statusText}`,
    );
  }

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, Buffer.from(payload.data[0].b64_json, 'base64'));
  console.log(`Generated tasks/${id}/assets/${asset.id}.png`);
}
