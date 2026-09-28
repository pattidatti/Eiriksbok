// Likhetsvakt for mikrospill: stopper et nytt spill som ser ut som et spill vi allerede har.
//
// Eieren er redd for at alle spillene ender med å se like ut. «Unikt» i den uavhengige
// vurderingen er en mening; denne vakten er et tall. Den sammenligner plakaten til spillet
// (public/images/microgames/<id>.webp, laget av selvspillet med --cover) med plakaten til
// hvert annet spill i samme mappe, på to måter:
//
//   FARGE      histogram over fargene (4 trinn per kanal) - samme palett og stemning?
//   FORM       dHash av gråtonebildet - samme komposisjon, horisont og kameravinkel?
//
// Likhet = 0,6 × farge + 0,4 × form. Over GRENSE mot et annet spill = rødt.
// Kalibrert 2026-09-28: de fire første arkadespillene ligger 0,09-0,29 fra hverandre, mens
// samme plakat med ny fargetone, speilvendt eller beskåret gir 0,72-0,78. Grensen 0,5 ligger
// midt imellom, så «samme diorama i nye farger» blir stoppet.
//
// Bruk:
//   node scripts/likhet-microgame.mjs --ids plottebordet-3d
//   node scripts/likhet-microgame.mjs --alle              (matrise over hele biblioteket)
//
// Exit 0 = ulik nok, 1 = for lik et annet spill (eller mangler plakat), 2 = kunne ikke kjøre.
// Rapport: .screenshots/likhet/_likhet.md

import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : def;
};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coverDir = path.join(root, 'public/images/microgames');
const outDir = path.join(root, '.screenshots/likhet');
const GRENSE = Number(opt('grense', 0.5));
const alle = args.includes('--alle');

if (!existsSync(coverDir)) {
    console.error(`Fant ikke ${coverDir}`);
    process.exit(2);
}
const covers = readdirSync(coverDir)
    .filter((f) => f.endsWith('.webp'))
    .map((f) => f.replace(/\.webp$/, ''));
const ids = alle ? covers : (opt('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!ids.length) {
    console.error('Bruk: node scripts/likhet-microgame.mjs --ids <id>[,<id>] | --alle');
    process.exit(2);
}

/** Fargehistogram (64 kasser) og 64-bits dHash for ett bilde. */
async function fingerprint(id) {
    const file = path.join(coverDir, `${id}.webp`);
    const { data } = await sharp(file).resize(64, 36, { fit: 'fill' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const hist = new Float64Array(64);
    for (let i = 0; i < data.length; i += 3) hist[((data[i] >> 6) << 4) | ((data[i + 1] >> 6) << 2) | (data[i + 2] >> 6)]++;
    const n = data.length / 3;
    for (let k = 0; k < 64; k++) hist[k] /= n;
    const g = await sharp(file).resize(9, 8, { fit: 'fill' }).grayscale().raw().toBuffer();
    const bits = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits.push(g[y * 9 + x] < g[y * 9 + x + 1] ? 1 : 0);
    return { hist, bits };
}

function likhet(a, b) {
    let farge = 0;
    for (let k = 0; k < 64; k++) farge += Math.min(a.hist[k], b.hist[k]);
    let lik = 0;
    for (let k = 0; k < 64; k++) if (a.bits[k] === b.bits[k]) lik++;
    // Tilfeldige bilder deler ~50 % av bitene, så form skaleres fra 0,5-1 til 0-1.
    const form = Math.max(0, (lik / 64 - 0.5) * 2);
    return { farge, form, sum: 0.6 * farge + 0.4 * form };
}

const prints = new Map();
for (const id of covers) {
    try {
        prints.set(id, await fingerprint(id));
    } catch (e) {
        console.error(`Kunne ikke lese plakaten til ${id}: ${e.message}`);
    }
}

mkdirSync(outDir, { recursive: true });
const md = ['## Likhetsvakt', '', `Grense: ${GRENSE.toFixed(2)} (0,6 × farge + 0,4 × form mot hver annen plakat)`, ''];
let fail = false;
for (const id of ids) {
    const me = prints.get(id);
    if (!me) {
        md.push(`- ❌ \`${id}\`: mangler plakat (public/images/microgames/${id}.webp) - kjør selvspillet med --cover`);
        console.log(`✗ ${id}: mangler plakat`);
        fail = true;
        continue;
    }
    const rows = [...prints.entries()]
        .filter(([other]) => other !== id)
        .map(([other, p]) => ({ other, ...likhet(me, p) }))
        .sort((a, b) => b.sum - a.sum);
    const worst = rows[0];
    const bad = rows.filter((r) => r.sum >= GRENSE);
    md.push(`### ${bad.length ? '❌' : '✅'} \`${id}\``, '', '| Mot | Farge | Form | Likhet |', '|---|---:|---:|---:|');
    for (const r of rows.slice(0, 5)) md.push(`| ${r.other} | ${r.farge.toFixed(2)} | ${r.form.toFixed(2)} | ${r.sum.toFixed(2)} |`);
    md.push('');
    if (bad.length) {
        fail = true;
        for (const r of bad)
            md.push(
                `- ❌ for lik \`${r.other}\` (${r.sum.toFixed(2)}): ${r.farge >= r.form ? 'samme palett og lys - hent fargene fra kunstretningen i briefen, ikke fra forrige spill' : 'samme komposisjon - bytt kameravinkel, horisont eller perspektiv'}`
            );
        md.push('');
    }
    console.log(`${bad.length ? '✗' : '✓'} ${id}: nærmest ${worst ? `${worst.other} (${worst.sum.toFixed(2)})` : 'ingen andre plakater'}`);
}
writeFileSync(path.join(outDir, '_likhet.md'), md.join('\n'));
process.exit(fail ? 1 : 0);
