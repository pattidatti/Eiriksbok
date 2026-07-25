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

// NB på rekkefølge: det ENDREDE spillet skal ikke stå først. Første spill i lista
// betaler oppstartskostnaden på en kald runner (Vite-transform av modultreet), og
// da blir nettopp spillet som er under revisjon falskt flagget - slik PR #246 ble.
// Oppvarmingen i audit-harnessen dekker det meste, retry dekker resten; dette er
// tredje lag: legg røyk-utvalget først, det endrede spillet sist.
const changedIds = new Set();
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
    if (id) changedIds.add(id);
}

const ids = new Set();
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

// Endrede spill sist (se kommentaren over). Er det ingen røyk-runde, står de
// alene - da tar harnessens oppvarming + retry jobben.
for (const id of changedIds) ids.add(id);

console.log(`ids=${[...ids].join(',')}`);
// Egen liste med BARE de endrede spillene. Den mekaniske auditen kjører på hele
// røyk-utvalget (en kit-endring kan ødelegge et gammelt spill), men den visuelle
// egenrevisjonen gjelder bare det du faktisk har laget - det er ingen vits i å
// vurdere estetikken på uendrede spill på nytt.
console.log(`changed=${[...changedIds].join(',')}`);
