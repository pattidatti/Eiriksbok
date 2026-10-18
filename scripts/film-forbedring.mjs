#!/usr/bin/env node
// Køen til forbedringskjøringen i filmrutina (kl. 22 UTC): hvilken eksisterende film som
// bør løftes først.
//
// 1. Filmer uten `vurdering` i manuset, de som bryter variasjonsreglene mest først
//    (samme visual i over 4 scener, mer enn ett Punktkort). De er laget før vurderingen ble
//    lagret, og før vurdereren fikk se artikkelen og hele settet med kontaktark.
// 2. Filmer med vurdering under 22/25, lavest først.
//
// Bruk:
//   node scripts/film-forbedring.mjs            # hele køen
//   node scripts/film-forbedring.mjs --antall 3

import fs from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MANUS = path.join(ROT, 'src/features/film/manus');
const GODT_NOK = 22;

function alle(dir = MANUS, ut = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) alle(p, ut);
        else if (e.name.endsWith('.json')) ut.push(p);
    }
    return ut;
}

const rader = alle().map((fil) => {
    const m = JSON.parse(fs.readFileSync(fil, 'utf8'));
    const antall = new Map();
    for (const s of m.scener) antall.set(s.visual.type, (antall.get(s.visual.type) ?? 0) + 1);
    let brudd = 0;
    for (const [type, n] of antall) {
        if (type === 'Tittelkort' || type === 'Sluttkort') continue;
        if (type === 'Punktkort') brudd += Math.max(0, n - 1);
        else brudd += Math.max(0, n - 4);
    }
    return {
        sti: path.relative(MANUS, fil).replace(/\.json$/, ''),
        tittel: m.tittel,
        sum: m.vurdering?.sum ?? null,
        brudd,
    };
});

const uten = rader.filter((r) => r.sum === null).sort((a, b) => b.brudd - a.brudd);
const svake = rader
    .filter((r) => r.sum !== null && r.sum < GODT_NOK)
    .sort((a, b) => a.sum - b.sum);
const ko = [...uten, ...svake];

const i = process.argv.indexOf('--antall');
const n = i >= 0 ? Number(process.argv[i + 1]) : ko.length;
for (const r of ko.slice(0, n)) {
    const hvorfor = r.sum === null ? `ikke vurdert, ${r.brudd} brudd på variasjonsreglene` : `vurdert ${r.sum}/25`;
    console.log(`${r.sti}\t${hvorfor}\t${r.tittel}`);
}
if (!ko.length) console.log('(ingen filmer å forbedre)');
