#!/usr/bin/env node
/**
 * Starts the hand-off folder used by the Algebaran design-to-code pipeline.
 *
 * Usage:
 *   npm run screen:package -- projects-workshop "Projects workshop"
 *
 * It intentionally writes only the contract, never product code. A Director
 * (human or AI) fills the documents; Codex implements against them.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [id, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();

if (!id || !title || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  throw new Error('Usage: npm run screen:package -- <kebab-case-id> "Screen title"');
}

const folder = join(root, 'tasks', id);
await mkdir(join(folder, 'assets'), { recursive: true });

const files = {
  'screen-spec.md': `# ${title}\n\n## Purpose\n\n<!-- What learner problem does this screen solve? -->\n\n## User flow\n\n<!-- Entry → primary action → exit -->\n\n## Components\n\n<!-- Component name, responsibility, states. -->\n\n## Responsive rules\n\n<!-- Mobile first; then tablet/desktop behaviour. -->\n`,
  'layout.md': `# ${title} — layout\n\n## Mobile (390 × 844)\n\n<!-- Describe hierarchy, spacing and touch targets. -->\n\n## Larger viewports\n\n<!-- Describe how hierarchy is preserved, not merely scaled. -->\n`,
  'animations.md': `# ${title} — motion\n\n<!-- Trigger, duration, easing, reduced-motion behaviour. -->\n`,
  'acceptance-tests.md':
    `# ${title} — acceptance\n\n- [ ] Works at 390 × 844 and a desktop viewport.\n- [ ] Keyboard and touch interactions are usable.\n- [ ] Empty, loading, locked and completed states have intentional UI.\n- [ ] ` +
    '`npm run typecheck && npm run lint && npm test && npm run build`' +
    ` passes.\n- [ ] Screenshot review is recorded in review.md.\n`,
  'review.md': `# ${title} — visual review\n\n## Revision 00\n\nStatus: PENDING\n\n<!-- The reviewer writes precise, prioritised patch requests here. -->\n`,
  'assets/README.md':
    `# Asset drop\n\nPlace approved source PNG/WebP files here. The manifest declares each file's\ncanonical destination in the repository's raw ` +
    '`assets/`' +
    ` directory.\nDo not put UI text inside generated artwork.\n`,
};

for (const [name, body] of Object.entries(files)) {
  await writeFile(join(folder, name), body, { encoding: 'utf8', flag: 'wx' });
}

await writeFile(
  join(folder, 'assets-manifest.json'),
  `${JSON.stringify(
    {
      schema: 'algebaran.screen-assets.v1',
      screen: { id, title },
      assetStyle: {
        visualLanguage: 'Algebaran cosmic game UI; clean silhouettes; no embedded UI text',
        references: ['src/content/art.ts', 'src/styles/index.css'],
      },
      assets: [
        {
          id: 'replace-me',
          role: 'hero | character-pose | node | background | decoration',
          destination: 'assets/<group>/replace-me.png',
          prompt: 'Write a complete, production-oriented prompt here.',
          size: '1024x1024',
          quality: 'low',
          transparent: true,
          status: 'planned',
        },
      ],
    },
    null,
    2,
  )}\n`,
  { encoding: 'utf8', flag: 'wx' },
);

console.log(`Created tasks/${id}`);
