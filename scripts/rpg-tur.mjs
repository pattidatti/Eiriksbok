// Fotorunde gjennom hele vikingtiden, for kritisk revisjon.
//
//   RPG_BASE=http://localhost:5199 node scripts/rpg-tur.mjs
//
// Bildene havner i .screenshots/tur-*.png og skal aldri committes.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, entreHallen, stengHmr, BASE } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const browser = await chromium.launch();
const feillogg = [];

async function nySide() {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', (e) => feillogg.push(`[sidefeil] ${String(e).slice(0, 220)}`));
    page.on('console', (m) => {
        if (m.type() === 'error') feillogg.push(`[konsoll] ${m.text().slice(0, 220)}`);
    });
    await stengHmr(page);
    return page;
}

async function skudd(page, navn, ventMs = 0) {
    if (ventMs) await page.waitForTimeout(ventMs);
    await page.screenshot({ path: `${UT}/tur-${navn}.png` });
    console.log('  →', `tur-${navn}.png`);
}

const ETTER_1 = {
    steg: ['k1-hjem', 'kapittel:1', 'mellomspill:mellomspill-1'],
    begreper: { klinkbygging: 'forstatt', breddegradseiling: 'forstatt' },
};
const ETTER_2 = {
    steg: [...ETTER_1.steg, 'k2-vinteren', 'kapittel:2', 'mellomspill:mellomspill-2'],
    begreper: { ...ETTER_1.begreper, aett: 'forstatt', tinget: 'forstatt' },
    klokke: { aar: 995, dag: 1 },
};
const ETTER_3 = {
    steg: [...ETTER_2.steg, 'k3-valget', 'kapittel:3', 'mellomspill:mellomspill-3'],
    begreper: { ...ETTER_2.begreper, sed: 'forstatt', holmgang: 'forstatt', kristningen: 'forstatt' },
    flagg: { 'k3-nektet': true },
    klokke: { aar: 1030, dag: 1 },
};
const ETTER_4 = {
    steg: [...ETTER_3.steg, 'k4-slaget', 'kapittel:4', 'mellomspill:mellomspill-4'],
    begreper: { ...ETTER_3.begreper, bondehaeren: 'forstatt' },
    klokke: { aar: 1066, dag: 1 },
};

// ---------------------------------------------------------------- 1. helt ny
{
    const page = await nySide();
    await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    await skudd(page, '01-forstegangs');
    // Prøv å komme videre i karakterskaperen for å se stegene.
    for (let i = 0; i < 3; i++) {
        const knapp = page.locator('button:visible').last();
        if ((await knapp.count()) > 0) {
            await knapp.click({ timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(900);
            await skudd(page, `02-skaper-${i}`);
        }
    }
    await page.close();
}

// ------------------------------------------------------------------ 2. hallen
{
    const page = await nySide();
    await entreHallen(page, { besok: { vikingtiden: 4 }, hjem: 3 });
    await skudd(page, '03-hallen', 5000);
    await page.keyboard.down('KeyD');
    await page.waitForTimeout(2500);
    await page.keyboard.up('KeyD');
    await skudd(page, '04-hallen-ostover', 600);
    await page.close();
}

// ------------------------------------------------- 3. Nordvik 793 + grensesnitt
{
    const page = await nySide();
    await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
    await skudd(page, '05-nordvik793', 5000);

    for (const [tast, navn] of [
        ['KeyI', '06-sekk'],
        ['KeyL', '07-oppdrag'],
        ['KeyM', '08-minnetre'],
        ['Escape', '09-meny'],
    ]) {
        await page.keyboard.press(tast);
        await page.waitForTimeout(900);
        await skudd(page, navn);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(600);
    }

    // Gå litt rundt og se om noe dukker opp
    for (const [tast, ms] of [
        ['KeyW', 2000],
        ['KeyA', 1500],
        ['KeyS', 1500],
    ]) {
        await page.keyboard.down(tast);
        await page.waitForTimeout(ms);
        await page.keyboard.up(tast);
    }
    await skudd(page, '10-nordvik-gaatt', 800);

    // Slå litt - se kampfeedback
    for (let i = 0; i < 3; i++) {
        await page.keyboard.down('Space');
        await page.waitForTimeout(140);
        await page.keyboard.up('Space');
        await page.waitForTimeout(120);
    }
    await skudd(page, '11-slag');

    // Gard
    await page.keyboard.down('ShiftLeft');
    await page.waitForTimeout(700);
    await skudd(page, '12-gard');
    await page.keyboard.up('ShiftLeft');
    await page.close();
}

// ------------------------------------------------------- 4. senere kapitler
for (const [merke, kapittel, sted, kampanje] of [
    ['13-nordvik872', 2, 'nordvik-872', ETTER_1],
    ['14-nordvik995', 3, 'nordvik-995', ETTER_2],
    ['15-nordvik1030', 4, 'nordvik-1030', ETTER_3],
    ['16-stiklestad', 4, 'stiklestad', ETTER_3],
    ['17-riccall', 5, 'riccall', ETTER_4],
    ['18-lindisfarne', 1, 'lindisfarne', undefined],
]) {
    const page = await nySide();
    try {
        await entreEpoke(page, { navn: 'Torstein', kapittel, sisteSted: sted, kampanje });
        await skudd(page, merke, 5500);
        await page.keyboard.press('KeyL');
        await page.waitForTimeout(800);
        await skudd(page, `${merke}-oppdrag`);
    } catch (e) {
        console.log(`  FEIL ${merke}:`, String(e).slice(0, 160));
    }
    await page.close();
}

await browser.close();

console.log('\n=== FEIL FANGET ===');
const unike = [...new Set(feillogg)];
if (!unike.length) console.log('(ingen)');
unike.slice(0, 40).forEach((f) => console.log(' -', f));
console.log(`(${feillogg.length} totalt, ${unike.length} unike)`);
