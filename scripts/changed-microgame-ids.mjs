// Finner hvilke mikrospill-id-er som er berørt av endringene siden en git-ref.
// Brukes av CI-porten (.github/workflows/microgame-audit.yml):
//
//   node scripts/changed-microgame-ids.mjs <base-ref>
//
// Skriver "ids=a,b,c" (GitHub Actions output-format) til stdout.
// - Endret spillfil (src/components/microgames/X.tsx) -> spillets id via registry-loader.
// - Endret delt fil (kit/, registry.ts, MicroGameFrame/Block) -> et fast røyk-utvalg
//   av spill, siden alt kan være berørt uten at 144 spill kan kjøres i CI.

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const base = process.argv[2];
if (!base) {
    console.error('Bruk: node scripts/changed-microgame-ids.mjs <base-ref>');
    process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const regSrc = readFileSync(path.join(root, 'src/components/microgames/registry.ts'), 'utf8');

// Kart fra komponent-filnavn (uten .tsx) til spill-id, via registry-oppføringene:
//   id: 'x', ... loader: () => import('./Fil')
const fileToId = new Map();
const entryRe = /id:\s*'([^']+)'[\s\S]*?loader:\s*\(\)\s*=>\s*import\('\.\/([^']+)'\)/g;
let m;
while ((m = entryRe.exec(regSrc))) fileToId.set(m[2], m[1]);

const diff = execSync(`git diff --name-only ${base}...HEAD`, { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

const ids = new Set();
let sharedChanged = false;
for (const f of diff) {
    if (!f.startsWith('src/components/microgames/')) continue;
    const rest = f.slice('src/components/microgames/'.length);
    if (rest.startsWith('kit/') || rest === 'registry.ts' || rest.startsWith('MicroGame')) {
        sharedChanged = true;
        continue;
    }
    const baseName = rest.replace(/\.tsx?$/, '');
    const id = fileToId.get(baseName);
    if (id) ids.add(id);
}

if (sharedChanged) {
    // Røyk-utvalg med bredde: sjøscener (Boat/Seascape), drag, klikk, slider, quiz.
    const SMOKE = [
        'vesterled-3d',
        'hansakoggen-3d',
        'fimreite-1184',
        'colosseum-3d',
        'teodosianmuren',
        'hundreaarskrigen-3d',
        'kanalbyggeren-3d',
        'datasporet-3d',
    ];
    for (const id of SMOKE) if (fileToId.size === 0 || regSrc.includes(`'${id}'`)) ids.add(id);
}

console.log(`ids=${[...ids].join(',')}`);
