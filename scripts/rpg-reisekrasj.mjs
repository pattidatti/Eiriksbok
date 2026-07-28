// Prøver påstanden: partikkel-poolene overlever scene.restart(), så første
// effekt etter en reise kaster og dreper bildeløkka.
//
// Kjøres gjennom den ekte veien: gå inn i porten til hallen og tilbake igjen.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const feil = [];
page.on('pageerror', (e) => feil.push(String(e).slice(0, 220)));
page.on('console', (m) => m.type() === 'error' && feil.push(m.text().slice(0, 220)));
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4500);

const puls = () =>
    page.evaluate(() => {
        const sc = window.__rpg.scene.getScene('verden');
        return {
            sted: sc.sted?.id,
            efxPool: sc.efx?.pool?.length ?? null,
            fxPool: sc.fx?.pool?.length ?? null,
            forsteHarScene: sc.efx?.pool?.[0] ? Boolean(sc.efx.pool[0].scene) : null,
        };
    });

console.log('FØR REISE:', JSON.stringify(await puls()));

// Lag noen effekter først, så poolen fylles.
await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    for (let i = 0; i < 12; i++)
        sc.efx.flytTekst(sc.helt.sprite.x, sc.helt.sprite.y - 20, '-7', '#ff6666');
});
await page.waitForTimeout(2000);
console.log('ETTER 12 SKADETALL:', JSON.stringify(await puls()));

// Reis - gjennom scenens egen bestilling, som porten bruker.
await page.evaluate(() => window.__rpg.scene.getScene('verden').utforReise('hub', []));
await page.waitForTimeout(4000);
console.log('ETTER REISE:', JSON.stringify(await puls()));

// Første effekt etter reisen.
const utfall = await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    try {
        sc.efx.flytTekst(sc.helt.sprite.x, sc.helt.sprite.y - 20, '-7', '#ff6666');
        return 'OK - ingen feil';
    } catch (e) {
        return 'KASTET: ' + String(e).slice(0, 200);
    }
});
console.log('FØRSTE SKADETALL ETTER REISE:', utfall);

// Og gjennom den ekte veien: ta skade.
const utfall2 = await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    try {
        sc.helt.skad(5);
        return 'OK';
    } catch (e) {
        return 'KASTET: ' + String(e).slice(0, 200);
    }
});
console.log('helt.skad(5) ETTER REISE:', utfall2);

await page.waitForTimeout(1500);
await page.screenshot({ path: '.screenshots/reise-etterpaa.png' });
console.log('SIDEFEIL:', [...new Set(feil)].slice(0, 10));
await browser.close();
