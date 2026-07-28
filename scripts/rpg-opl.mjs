// Driver Ravns opplæring gjennom alle fire øktene, og logger skjoldhelsen.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('pageerror', (e) => console.log('[sidefeil]', String(e).slice(0, 160)));
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4000);

await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    const s = sc.samhandling.npcSprites.get('ravn');
    sc.helt.sprite.setPosition(s.x, s.y + 18);
});
await page.waitForTimeout(400);
await page.keyboard.down('KeyE');
await page.waitForTimeout(160);
await page.keyboard.up('KeyE');
await page.waitForTimeout(1200);
const knapp = page.locator('button:has-text("Vis meg")');
console.log('«Vis meg» finnes:', await knapp.count());
await knapp.first().click();
await page.waitForTimeout(2500);

const status = () =>
    page.evaluate(() => {
        const sc = window.__rpg.scene.getScene('verden');
        const o = sc.opplaering;
        const snap = sc.helt.kamp.snapshot();
        const st = window.__rpgStore.getState();
        return {
            gaar: o?.gaar,
            okt: o?.okt,
            teller: o?.teller,
            skjold: `${snap.vernHelse}/${snap.vernMaks}`,
            harVern: sc.helt.kamp.harVern,
            gardOppe: snap.gardOppe,
            pust: Math.round(snap.ressurs),
            hp: st.hp,
            ravnHp: o?.ravn?.hp,
            kort: document.querySelector('[data-prove="oppgavekort"]')?.innerText?.replace(/\n/g, ' / ') ?? null,
        };
    });

console.log('START:', JSON.stringify(await status()));

// Spiller alle fire øktene med en enkel strategi per økt.
let forrigeOkt = -1;
const logg = [];
for (let steg = 0; steg < 700; steg++) {
    const s = await status();
    if (!s.gaar) {
        console.log('OPPLÆRINGEN ER SLUTT etter', steg, 'steg');
        break;
    }
    if (s.okt !== forrigeOkt) {
        console.log(`\n### ØKT ${s.okt + 1}`, JSON.stringify(s));
        forrigeOkt = s.okt;
    }
    if (steg % 25 === 0) console.log(`  [${steg}]`, JSON.stringify(s));
    logg.push(s);

    if (s.okt === 0 || s.okt === 3) {
        // Slå, men bare når det er pust igjen.
        if (s.pust > 20) {
            await page.keyboard.down('Space');
            await page.waitForTimeout(120);
            await page.keyboard.up('Space');
            await page.waitForTimeout(420);
        } else {
            await page.waitForTimeout(900);
        }
    } else if (s.okt === 1) {
        // Hold garden. Slipp når pusten er lav, så den tar seg opp.
        if (s.pust > 25) {
            await page.keyboard.down('ShiftLeft');
            await page.waitForTimeout(700);
        } else {
            await page.keyboard.up('ShiftLeft');
            await page.waitForTimeout(1400);
        }
    } else if (s.okt === 2) {
        await page.keyboard.up('ShiftLeft');
        // Parade: reis garden kort, gjentatte ganger.
        await page.keyboard.down('ShiftLeft');
        await page.waitForTimeout(260);
        await page.keyboard.up('ShiftLeft');
        await page.waitForTimeout(420);
    }
}
await page.keyboard.up('ShiftLeft');
const sist = await status();
console.log('\nSLUTT:', JSON.stringify(sist));
const minSkjold = Math.min(...logg.map((l) => Number(l.skjold.split('/')[0])));
const minHp = Math.min(...logg.map((l) => l.hp));
console.log('laveste skjold underveis:', minSkjold, ' laveste liv:', minHp);
console.log('nådde økt:', Math.max(...logg.map((l) => l.okt)) + 1, 'av 4');
await page.screenshot({ path: '.screenshots/opl-slutt.png' });
await browser.close();
