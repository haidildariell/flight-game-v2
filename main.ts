// main.ts — hand in Banda Sea Rescue (Node 22, standard library only).
// The game lives in game/ as plain static files and its screenshots
// in screenshots/. This program copies both into the output directory
// and writes /output/dossier.json with the kit's buildDossier, so the
// judge can read the game from the dossier alone.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Directory of this file: the repository root, read-only in the grader.
const rootDir: string = dirname(fileURLToPath(import.meta.url));
const outDir: string = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The scorer's own caps: only text_max_bytes shapes the bytes, the
// rest refuse an entry the scorer would refuse, so pass them all.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
};

function fail(message: string): never {
  throw new Error(message);
}

function copyFolder(name: string): void {
  const from: string = join(rootDir, name);
  const to: string = join(outDir, name);
  if (!existsSync(from)) fail(name + '/ is missing from the repository');
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyFolder('game');
copyFolder('screenshots');

const dossier: Uint8Array = buildDossier(outDir, dossierCaps);
writeFileSync(join(outDir, 'dossier.json'), dossier);
