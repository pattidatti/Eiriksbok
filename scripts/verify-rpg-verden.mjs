// Teller det verden faktisk består av, i en ekte nettleser.
//
//   npm run dev                          # i et annet skall
//   node scripts/verify-rpg-verden.mjs
//
// Kampskriptene (verify-rpg-kamp.mjs, verify-rpg-drap.mjs) leser tall fra HUD-en
// og fanger regler. De ser ikke om bakken tegnes, om tåka finnes eller om en
// kollisjonsboks er blitt borte. Dette skriptet gjør det, ved å spørre Phaser-
// scenen direkte gjennom `window.__rpg` (som boot.ts eksponerer i dev).
//
// Bruk under refaktorering: kjør før og etter, og sammenlign linjene. De skal
// være identiske. Tallene er ikke magiske - de er «like mange som i går».

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const FORVENTET_MINST = {
    taake: 14,
    glo: 1,
    renderTextures: 5,
    props: 200,
    vegger: 100,
    propKropper: 150,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

const sidefeil = [];
page.on('pageerror', (e) => sidefeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(4000);

const tall = await page.evaluate(() => {
    const spill = window.__rpg;
    if (!spill) return { feil: 'window.__rpg mangler - kjører du i dev?' };
    const scene = spill.scene.getScene('verden');
    if (!scene) return { feil: 'fant ikke scenen «verden»' };
    const liste = scene.children.list;
    const medTekstur = (n) => liste.filter((o) => o.texture?.key === n).length;
    return {
        taake: medTekstur('fx-taake'),
        glo: medTekstur('fx-glo'),
        renderTextures: liste.filter((o) => o.type === 'RenderTexture').length,
        props: liste.filter((o) => o.texture?.key?.startsWith?.('prop-')).length,
        vegger: scene.data.get('vegger')?.getChildren?.().length ?? -1,
        propKropper: scene.data.get('propKropper')?.getChildren?.().length ?? -1,
        npcer: liste.filter((o) => o.texture?.key?.startsWith?.('npc-')).length,
        // Merk: dette tallet lever. Fiender spawner og dør mens vi teller, så
        // det svinger med et titalls. Det er linjene over som skal stå stille.
        barn: liste.length,
    };
});

await browser.close();

if (tall.feil) {
    console.error('FEIL:', tall.feil);
    process.exit(1);
}

for (const [navn, verdi] of Object.entries(tall)) console.log(`${navn.padEnd(16)} ${verdi}`);

const mangler = Object.entries(FORVENTET_MINST).filter(([k, v]) => tall[k] < v);
console.log('sidefeil:', sidefeil.length ? sidefeil.join(' | ') : 'ingen');

if (mangler.length) {
    console.error(
        '\nFEIL - for få av:',
        mangler.map(([k, v]) => `${k} (${tall[k]} < ${v})`).join(', ')
    );
    process.exit(1);
}
if (sidefeil.length) {
    console.error('\nFEIL - sidefeil i konsollen');
    process.exit(1);
}
console.log('\nVerden bygget.');
