// Driver blotet ved horgen, begge kveldene.
//
//   npm run dev                         # i et annet skall
//   node scripts/verify-rpg-blotet.mjs
//
// Det som måles er reglene rundt puzzlet, ikke at det finnes en knapp:
//
//   1. Knappen står ikke framme før kongens mann har sagt hva fristen er.
//      Et blot uten et krav å svare på, er en seremoni uten innsats.
//   2. Ingen retter henne underveis. Blotet blir holdt slik hun valgte.
//   3. Gaven som ikke passer gir steget, men ikke begrepet - og bygda går hjem.
//   4. Hun kan blote igjen. Horgen står der hele året.
//   5. Gaven som passer gir `[Blot]` som forstått og ære.
//   6. Esc er ikke et blot. Går hun ut av skjermen, har ingenting skjedd.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreEpoke, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, {
    kapittel: 3,
    sisteSted: 'nordvik-995',
    // Opptakten er sett, så prøven begynner i verden og ikke på en skjerm.
    kampanje: { steg: ['kapittel:2'], sette: ['opptakt:k3'] },
});
await page.waitForTimeout(3200);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { aere: s.aere, begreper: s.begreper, steg: s.steg } : null;
    });

const klikk = async (tekst) => {
    await page.getByRole('button', { name: tekst }).first().click();
    await page.waitForTimeout(320);
};

const gaaTil = async (type, id) => {
    await page.evaluate(
        ([t, i]) => {
            const scene = window.__rpg?.scene.getScene('verden');
            const mal = scene?.samhandling?.mal(t, i);
            if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
        },
        [type, id]
    );
    await page.waitForTimeout(430);
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
};

/** Går gjennom de tre spørsmålene med de oppgitte svarene. */
const blot = async (hvem, hva, naar) => {
    await gaaTil('landemerke', 'hovet-995');
    await klikk('Hold blot');
    await page.waitForTimeout(500);
    await klikk(hvem);
    await klikk(hva);
    await klikk(naar);
    // Riten spiller i 3,4 sekunder før kvelden gjøres opp.
    await page.waitForTimeout(4200);
};

// ── 1. Knappen er gatet på fristen ──────────────────────────────────────────
await gaaTil('landemerke', 'hovet-995');
sjekk(
    'blot-knappen står ikke framme før fristen er sagt',
    (await page.getByRole('button', { name: 'Hold blot' }).count()) === 0
);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// Handlingsknappen lukker samtalen selv. Et Esc-trykk her ville åpnet
// pausemenyen i stedet, og da tar ingenting E-tasten videre.
await gaaTil('npc', 'ragnvald');
await klikk('Hva vil dere?');
await page.waitForTimeout(500);

// ── 2-3. Kvelden som gikk dårlig ────────────────────────────────────────────
await blot('Odin', 'En hane', 'Vent til våren');
sjekk('kvelden gjøres opp', (await page.locator('[data-prove="blot-passet-ikke"]').count()) === 1);
const feiltekst = (await page.textContent('[data-prove="blotet"]')) ?? '';
sjekk('ingen sier hva som var galt', !feiltekst.includes('Frøy gir avling'));
sjekk('folk gikk tidlig', feiltekst.includes('Folk gikk tidlig'));
sjekk('kongens menn så på', feiltekst.includes('De skrev ingenting ned'));
await page.screenshot({ path: `${UT}/rpg-k3-blot-galt.png` });
await klikk('Gå hjem');
await page.waitForTimeout(700);

const etterGalt = await tilstand();
sjekk('steget er gjort - blotet ble holdt', etterGalt?.steg?.includes('k3-blotet'));
sjekk(
    'begrepet står på hørt, ikke forstått',
    etterGalt?.begreper?.blot === 'hort',
    String(etterGalt?.begreper?.blot)
);
sjekk('ingen ære for kvelden', etterGalt?.aere === 50, String(etterGalt?.aere));

// ── 4-5. Hun kan blote igjen ────────────────────────────────────────────────
await blot('Frøy', 'Hesten', 'Nå, i vinternettene');
sjekk('kvelden holdt', (await page.locator('[data-prove="blot-passet"]').count()) === 1);
const rett = (await page.textContent('[data-prove="blotet"]')) ?? '';
sjekk('begrene går til Njord og Frøy', rett.includes('Njord og Frøy'));
sjekk('minnebegrene går til haugene', rett.includes('minnebegrene'));
sjekk('ingen spurte hva han trodde', rett.includes('De spurte om du kom'));
await page.screenshot({ path: `${UT}/rpg-k3-blot-rett.png` });
await klikk('Gå hjem');
await page.waitForTimeout(700);

const etterRett = await tilstand();
sjekk(
    'blotet er forstått',
    etterRett?.begreper?.blot === 'forstatt',
    String(etterRett?.begreper?.blot)
);
sjekk('bygda ga ære', (etterRett?.aere ?? 0) > 50, String(etterRett?.aere));

// ── 6. Esc er ikke et blot ──────────────────────────────────────────────────
const forEsc = await tilstand();
await gaaTil('landemerke', 'hovet-995');
await klikk('Hold blot');
await page.waitForTimeout(500);
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
const etterEsc = await tilstand();
sjekk('skjermen er borte', (await page.locator('[data-prove="blotet"]').count()) === 0);
sjekk('ingenting skjedde', etterEsc?.aere === forEsc?.aere, `${forEsc?.aere} → ${etterEsc?.aere}`);
// Og verden skal gå igjen etterpå. En lås som blir stående er den dyreste
// feilen i denne kodebasen.
await page.keyboard.down('d');
await page.waitForTimeout(600);
await page.keyboard.up('d');
const gikk = await page.evaluate(() => {
    const s = window.__rpg?.scene.getScene('verden');
    return { x: s?.helt?.sprite?.x ?? 0, laast: s?.laast ?? null };
});
sjekk('låsen er av etterpå', gikk.laast === false, JSON.stringify(gikk));

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
