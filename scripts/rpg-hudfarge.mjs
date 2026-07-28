// Leser hudpikslene ut av den ferdige helt-teksturen i et kjørende spill.
//
// `ramp()` dreier skyggen mot blått, og korteste vei fra en varm hudtone går
// baklengs gjennom rødt. Resultatet var en tomatrød stripe over halsen på hver
// eneste figur, i hver eneste ramme. Denne prøven fanger tilbakefall: den
// henter teksturen fra Phasers teksturbank og ser etter piksler som er rene
// røde - høy metning, lav hue - der det skal være hud.
//
//   node scripts/rpg-hudfarge.mjs

import { chromium } from 'playwright';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4000);

const funn = await page.evaluate(() => {
    const spill = window.__rpg;
    const scene = spill?.scene?.getScenes?.(true)?.[0];
    if (!scene) return { feil: 'fant ingen kjørende scene' };
    const tex = scene.textures.get('helt');
    const kilde = tex?.getSourceImage?.();
    if (!kilde) return { feil: 'fant ingen helt-tekstur' };

    const c = document.createElement('canvas');
    c.width = kilde.width;
    c.height = kilde.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(kilde, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;

    const rode = [];
    const talt = {};
    for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 200) continue;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        // «Ren rød»: rødt dominerer kraftig over begge de andre, og fargen er
        // mørk nok til å lese som blod i stedet for som en lys hudtone.
        const dominans = r - Math.max(g, b);
        if (dominans > 90 && r > 120 && Math.max(g, b) < 90) {
            const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
            talt[hex] = (talt[hex] ?? 0) + 1;
            if (rode.length < 6) rode.push({ px: (i / 4) % c.width, py: Math.floor(i / 4 / c.width), hex });
        }
    }
    return { bredde: c.width, hoyde: c.height, antall: Object.values(talt).reduce((a, b) => a + b, 0), farger: talt, eksempler: rode };
});

if (funn.feil) {
    console.error('FEIL:', funn.feil);
    process.exit(2);
}

console.log(`helt-tekstur ${funn.bredde}x${funn.hoyde}`);
console.log(`rene røde piksler: ${funn.antall}`);
for (const [hex, n] of Object.entries(funn.farger)) console.log(`  ${hex} x${n}`);
for (const e of funn.eksempler) console.log(`  eksempel (${e.px},${e.py}) ${e.hex}`);

await browser.close();
console.log(funn.antall === 0 ? '\nOK - ingen rød stripe' : '\nRØD STRIPE ER TILBAKE');
process.exit(funn.antall === 0 ? 0 : 1);
