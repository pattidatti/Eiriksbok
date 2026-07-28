// Spiller kapittel 1 fra begynnelsen: Ravn, opplæringen, dialog og quiz.
// Skriver skjermbilder og logger hva eleven faktisk ser.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const feil = [];
page.on('pageerror', (e) => feil.push(String(e).slice(0, 200)));
page.on('console', (m) => m.type() === 'error' && feil.push(m.text().slice(0, 200)));
await stengHmr(page);
await entreEpoke(page, { navn: 'Torstein', kapittel: 1, sisteSted: 'nordvik' });
await page.waitForTimeout(4500);

const skudd = async (n) => {
    await page.screenshot({ path: `${UT}/spill-${n}.png` });
    console.log('  →', n);
};
const tekst = async () => (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ');

// Hvor står NPC-ene, og hvor står jeg?
const kart = await page.evaluate(() => {
    const sc = window.__rpg.scene.getScene('verden');
    const p = sc.helt.sprite;
    const ns = sc.samhandling?.npcSprites ?? sc.interaksjon?.npcSprites;
    return {
        spiller: { x: Math.round(p.x), y: Math.round(p.y) },
        npcer: ns ? [...ns.keys()] : null,
        felt: Object.keys(sc).slice(0, 60),
    };
});
console.log('SCENE:', JSON.stringify(kart).slice(0, 900));

// Finn Ravn og teleportér dit, så vi slipper å gå.
const flytt = async (id) =>
    page.evaluate((npcId) => {
        const sc = window.__rpg.scene.getScene('verden');
        const ns = sc.samhandling?.npcSprites ?? sc.interaksjon?.npcSprites;
        const s = ns?.get(npcId);
        if (!s) return { fant: false, tilgjengelige: ns ? [...ns.keys()] : null };
        sc.helt.sprite.setPosition(s.x, s.y + 20);
        return { fant: true, x: s.x, y: s.y };
    }, id);

console.log('flytt til ravn:', JSON.stringify(await flytt('ravn')).slice(0, 400));
await page.waitForTimeout(900);
await skudd('01-ved-ravn');

// E
await page.keyboard.down('KeyE');
await page.waitForTimeout(160);
await page.keyboard.up('KeyE');
await page.waitForTimeout(1200);
await skudd('02-dialog');
console.log('DIALOG:', (await tekst()).slice(0, 700));

// Klikk gjennom dialogen
for (let i = 0; i < 6; i++) {
    const kn = page.locator('button:visible');
    const n = await kn.count();
    if (!n) break;
    const merker = [];
    for (let j = 0; j < n; j++) merker.push((await kn.nth(j).innerText()).trim().slice(0, 50));
    console.log(`  valg ${i}:`, JSON.stringify(merker));
    // velg det første som ikke er lukk
    const idx = merker.findIndex((m) => !/lukk|esc|avslutt/i.test(m));
    await kn.nth(idx < 0 ? 0 : idx).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1300);
    await skudd(`03-dialog-${i}`);
}

await page.waitForTimeout(2500);
await skudd('04-etter-dialog');
console.log('ETTER:', (await tekst()).slice(0, 700));

// Slå 8 ganger og se på pust/hitstop
for (let i = 0; i < 8; i++) {
    await page.keyboard.down('Space');
    await page.waitForTimeout(130);
    await page.keyboard.up('Space');
    await page.waitForTimeout(200);
    if (i === 2) await skudd('05-midt-i-kombo');
}
await skudd('06-etter-slag');
console.log('ETTER SLAG:', (await tekst()).slice(0, 400));

console.log('\nFEIL:', [...new Set(feil)].slice(0, 15));
await browser.close();
