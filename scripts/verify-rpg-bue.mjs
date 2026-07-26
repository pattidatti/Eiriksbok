// Sjekker at bua er et ekte skytevåpen, ikke en sving med annet navn.
//
//   npm run dev                     # i et annet skall
//   node scripts/verify-rpg-bue.mjs
//
// Angrepsformen er data (blueprint R3): en øks svinges, en bue skytes. Dette
// skriptet utruster jaktbua, skyter, og følger pila. Går den ikke ut i verden,
// er formen ikke koblet - og da er et gevær i 1916 like langt unna som før.

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

const sidefeil = [];
page.on('pageerror', (e) => sidefeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));

const feil = [];
const sjekk = (ok, melding) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'} ${melding}`);
    if (!ok) feil.push(melding);
};

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(4000);

// ── Utrust bua ──────────────────────────────────────────────────────────────
const utrustet = await page.evaluate(() => {
    const store = window.__rpgStore;
    store.getState().leggISekk('jaktbue');
    store.getState().utrust('jaktbue');
    window.__rpg.scene.getScene('verden').oppdaterUtseende();
    return store.getState().utstyr.vapen;
});
sjekk(utrustet === 'jaktbue', `bua er i hånda (${utrustet})`);

/** Prosjektilene som er i lufta akkurat nå, med posisjon. */
const skudd = () =>
    page.evaluate(() => {
        const scene = window.__rpg.scene.getScene('verden');
        return scene.skudd.liste.map((p) => ({
            x: Math.round(p.sprite.x),
            y: Math.round(p.sprite.y),
            tekstur: p.sprite.texture.key,
        }));
    });

const spillerPos = () =>
    page.evaluate(() => {
        const s = window.__rpg.scene.getScene('verden').helt.sprite;
        return { x: Math.round(s.x), y: Math.round(s.y) };
    });

// Rydd brettet, ellers kan et fiendeskudd bli forvekslet med pila.
await page.evaluate(() => {
    const scene = window.__rpg.scene.getScene('verden');
    for (const f of scene.fiendeSystem.alle()) {
        if (f.def.kind !== 'boss') f.sprite.setPosition(-9999, -9999);
    }
    scene.skudd.liste.length = 0;
});
await page.waitForTimeout(400);

// ── Skyt ────────────────────────────────────────────────────────────────────
// Vend mot høyre først, så vi vet hvilken vei pila skal.
await page.keyboard.down('d');
await page.waitForTimeout(160);
await page.keyboard.up('d');
const start = await spillerPos();

// Tasten må holdes over 100 ms for at Phaser skal se den (se lib/-kommentaren
// i kampskriptet), og ladetiden er 260 ms. Prøven på «strengen trekkes ennå»
// må derfor tas rett etter at tasten slippes - venter vi 120 ms til, er pila
// alt ute, og sjekken sier ingenting.
await page.keyboard.down('Space');
await page.waitForTimeout(110);
await page.keyboard.up('Space');
const underLading = await skudd();
sjekk(
    underLading.length === 0,
    `strengen trekkes før pila slippes (${underLading.length} i lufta)`
);

// Etter ladetiden skal pila være ute.
await page.waitForTimeout(420);
const iLufta = await skudd();
sjekk(iLufta.length >= 1, `pila forlot buen (${iLufta.length} i lufta)`);
sjekk(iLufta[0]?.tekstur === 'fx-pil', `pila tegnes med sin egen tekstur (${iLufta[0]?.tekstur})`);
sjekk(
    (iLufta[0]?.x ?? 0) > start.x,
    `pila fløy den veien hun vendte (spiller x=${start.x}, pil x=${iLufta[0]?.x})`
);

await page.waitForTimeout(350);
const senere = await skudd();
if (senere.length > 0) {
    sjekk(senere[0].x > iLufta[0].x, `pila er i bevegelse (${iLufta[0].x} -> ${senere[0].x})`);
} else {
    console.log('     (pila var alt ute av verden - levetiden er kort med vilje)');
}

// ── Rekkevidden tar slutt ───────────────────────────────────────────────────
// 300 piksler på 320 piksler i sekundet er drøyt 900 ms. Etter to sekunder
// skal ingenting av det ligge igjen.
await page.waitForTimeout(2000);
const etterpa = await skudd();
sjekk(etterpa.length === 0, `pila ryddes når rekkevidden er brukt opp (${etterpa.length} igjen)`);

console.log('\nsidefeil:', sidefeil.length ? sidefeil.slice(0, 3).join(' | ') : 'ingen');
await browser.close();

if (feil.length || sidefeil.length) {
    console.error(`\nFEIL i ${feil.length} sjekk${feil.length === 1 ? '' : 'er'}.`);
    process.exit(1);
}
console.log('\nBua virker.');
