// Beviser (eller avkrefter) to påstander i nettleseren:
//   1. Særslag (ublokkerbart/hak) når aldri fram til forsvaret.
//   2. Opplæringen låser seg fordi treningsskjoldet brister i økt 2.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

mkdirSync('.screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4000);

// ── 1. Særslag ──────────────────────────────────────────────────────────────
const sar = await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    const kroker = sc.fiendeSystem?.kroker;
    if (!kroker) return { feil: 'fant ikke fiendeSystem.kroker' };
    return {
        antallArgs: kroker.nerkampTreff.length,
        kilde: String(kroker.nerkampTreff).slice(0, 160),
    };
});
console.log('SÆRSLAG-KROK:', JSON.stringify(sar, null, 1));

// Faktisk prøve: kall kroken med og uten sar og se om skjoldet hakkes ulikt.
const proveSar = await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    const helt = sc.helt;
    const kamp = helt.kamp;
    // Reis garden og pek mot en fiktiv angriper rett foran.
    helt.retning = 'ned';
    kamp.settGardOnsket(true);
    for (let i = 0; i < 40; i++) kamp.tikk(16.7);
    const fake = {
        sprite: { x: helt.sprite.x, y: helt.sprite.y + 20 },
        def: { skade: 9, id: 'prove' },
    };
    const for1 = kamp.snapshot().vern;
    // gjennom motorens egen krok (slik fiendesystemet gjør det)
    sc.fiendeSystem.kroker.nerkampTreff(fake, { hak: true });
    const etterKrok = kamp.snapshot().vern;
    // direkte, med sar
    helt.nerkampTreff(fake, { hak: true });
    const etterDirekte = kamp.snapshot().vern;
    return { for1, etterKrok, etterDirekte };
});
console.log('SKJOLD hak-prøve:', JSON.stringify(proveSar));

// ── 2. Opplæringen ──────────────────────────────────────────────────────────
const page2 = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(page2);
await entreEpoke(page2, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page2.waitForTimeout(4000);

// Flytt til Ravn og start opplæringen gjennom scenen.
await page2.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    const s = sc.samhandling.npcSprites.get('ravn');
    sc.helt.sprite.setPosition(s.x, s.y + 20);
});
await page2.waitForTimeout(400);
await page2.keyboard.down('KeyE');
await page2.waitForTimeout(160);
await page2.keyboard.up('KeyE');
await page2.waitForTimeout(1000);
await page2.locator('button:has-text("Vis meg")').click().catch((e) => console.log('klikk:', e.message.slice(0, 80)));
await page2.waitForTimeout(2000);

const status = () =>
    page2.evaluate(() => {
        const sc = window.__rpg.scene.getScene('verden');
        const o = sc.opplaering;
        return {
            okt: o?.okt ?? o?.gjeldende ?? null,
            felt: o ? Object.keys(o) : null,
            vern: sc.helt.kamp.snapshot().vern,
            vernMaks: sc.helt.kamp.snapshot().vernMaks,
            harVern: sc.helt.kamp.harVern,
            hp: sc.helt.kamp.snapshot?.().liv ?? null,
            kort: document.querySelector('[data-prove="oppgavekort"]')?.innerText ?? null,
        };
    });
console.log('OPPLÆRING start:', JSON.stringify(await status()));

// Økt 1: slå Ravn tre ganger.
for (let i = 0; i < 14; i++) {
    await page2.keyboard.down('Space');
    await page2.waitForTimeout(130);
    await page2.keyboard.up('Space');
    await page2.waitForTimeout(300);
}
await page2.waitForTimeout(1500);
console.log('etter slag:', JSON.stringify(await status()));
await page2.screenshot({ path: '.screenshots/bevis-okt1.png' });

// Økt 2: hold garden i 20 sekunder og la ham slå.
await page2.keyboard.down('ShiftLeft');
for (let t = 0; t < 12; t++) {
    await page2.waitForTimeout(2000);
    const s = await status();
    console.log(`  gard t=${(t + 1) * 2}s`, JSON.stringify(s));
    if (s.vern === 0) {
        await page2.screenshot({ path: '.screenshots/bevis-skjold-brast.png' });
        break;
    }
}
await page2.keyboard.up('ShiftLeft');
await page2.waitForTimeout(1500);
console.log('SLUTT:', JSON.stringify(await status()));
await page2.screenshot({ path: '.screenshots/bevis-slutt.png' });

await browser.close();
