#!/usr/bin/env node
/** Validates the small, intentionally stable Screen Package contract. */
import { access, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2];
if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  throw new Error('Usage: npm run screen:validate -- <kebab-case-id>');
}

const folder = join(root, 'tasks', id);
const required = [
  'screen-spec.md',
  'layout.md',
  'assets-manifest.json',
  'animations.md',
  'acceptance-tests.md',
  'review.md',
];
await Promise.all(required.map((file) => access(join(folder, file))));

const manifest = JSON.parse(await readFile(join(folder, 'assets-manifest.json'), 'utf8'));
if (manifest.schema !== 'algebaran.screen-assets.v1') {
  throw new Error('assets-manifest.json must use schema algebaran.screen-assets.v1');
}
if (manifest.screen?.id !== id) throw new Error('manifest screen.id must match the package folder');
if (!Array.isArray(manifest.assets)) throw new Error('manifest assets must be an array');

const ids = new Set();
for (const asset of manifest.assets) {
  if (!asset.id || !asset.destination || !asset.prompt) {
    throw new Error('Every asset needs id, destination and prompt');
  }
  if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
  ids.add(asset.id);
}

console.log(`Screen package '${id}' is valid (${manifest.assets.length} assets).`);
