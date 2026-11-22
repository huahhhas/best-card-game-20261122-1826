// Emberfall — the entry's handoff program (Node 22, standard library only).
// The game itself is plain static files under game/ (index.html plus ES
// modules, no library, no network request), and the screenshots are real
// browser renders under screenshots/. This program hands both in: it copies
// game/ and screenshots/ from beside this file into the output directory
// (/output in the grader, MAKEFUN_OUTPUT_DIR anywhere else) and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library in vendor/makefun-game.ts.
//
// Run it outside the grader with:
//   MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps, from the kit's gate: at most 4 screenshots of 256 KiB
// each, at most 993 files / 48 MiB under game/, paths under 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
