// Finner hvilke mikrospill selvspill-porten skal kjøre i en PR:
//
//   node scripts/playtest-ids.mjs <base-ref>     -> skriver "ids=a,b" (GitHub Actions-format)
//
// - Spill hvis fil (eller modulmappe) er endret, OG som enten er nye i PR-en eller har
//   `sjanger` i registry (ny standard). Gamle spill uten selvspill-API testes ikke her -
//   de dekkes av scene-auditen.
// - Nye spill tas ALLTID med: mangler de sjanger/tone/usePlaytest, er det nettopp det
//   porten skal stoppe.
// - Endres selve kontrakten (playtest.ts) eller arkadeskallet, kjøres referansespillene
//   som røyktest.

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const base = process.argv[2];
if (!base) {
    console.error('Bruk: node scripts/playtest-ids.mjs <base-ref>');
    process.exit(2);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mg = 'src/components/microgames/';
const REFERANSER = ['havet-kommer', 'stavkirken-3d'];

const regNow = readFileSync(path.join(root, mg, 'registry.ts'), 'utf8');
let regBase = '';
try {
    regBase = execSync(`git show ${base}:${mg}registry.ts`, { cwd: root, encoding: 'utf8' });
} catch {
    /* registry fantes ikke på base */
}
const idsIn = (src) => new Set([...src.matchAll(/^\s+id:\s*'([^']+)'/gm)].map((m) => m[1]));
const nowIds = idsIn(regNow);
const baseIds = idsIn(regBase);

// id -> { file, block }
const entries = new Map();
for (const id of nowIds) {
    const start = regNow.indexOf(`id: '${id}'`);
    const block = regNow.slice(start, regNow.indexOf('\n    },', start));
    const file = block.match(/loader:\s*\(\)\s*=>\s*import\('\.\/([^']+)'\)/)?.[1];
    entries.set(id, { file, block });
}

const diff = execSync(`git diff --name-only ${base}...HEAD`, { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.startsWith(mg));

const picked = new Set();
const srcOf = (file) => {
    const p = path.join(root, mg, file + '.tsx');
    return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
for (const f of diff) {
    const rel = f.slice(mg.length);
    if (rel === 'playtest.ts' || rel.startsWith('arcade/')) {
        REFERANSER.forEach((id) => picked.add(id));
        continue;
    }
    const parts = rel.split('/');
    if (parts.length === 1) {
        const name = parts[0].replace(/\.tsx?$/, '');
        for (const [id, e] of entries) if (e.file === name) picked.add(id);
    } else if (parts[0] !== 'kit') {
        // Modulmappe (f.eks. stavkirken/): spillene som importerer fra den.
        for (const [id, e] of entries) if (e.file && srcOf(e.file).includes(`'./${parts[0]}/`)) picked.add(id);
    }
}
// Nye id-er er alltid med, også om bare registry ble endret.
for (const id of nowIds) if (!baseIds.has(id)) picked.add(id);

const ids = [...picked].filter((id) => {
    const e = entries.get(id);
    return e && (!baseIds.has(id) || /sjanger:\s*'/.test(e.block));
});
console.log(`ids=${ids.join(',')}`);
