// Driver skrog-puzzlet i Nordvik gjennom en ekte nettleser.
//
//   npm run dev                           # i et annet skall
//   node scripts/verify-rpg-skroget.mjs
//
// Det som måles er ikke at komponenten rendrer, men at kjeden holder:
// Orm tilbyr det, feil skrog synker og rettes av *ham*, riktig skrog gir
// begrepet og steget, og sjøsettingen kommer med én gang etterpå. Går én lenke
// av, blir kapittelet stående uten at noe krasjer.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'no-preference',
});

const konsollfeil = [];
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
page.on('pageerror', (e) => konsollfeil.push(String(e)));

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(2600);

const store = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { steg: s.steg, begreper: s.begreper, flagg: s.flagg, sette: s.sette } : null;
    });

/** Åpner naustet: setter eleven ned hos Orm og trykker E. */
const apneSkroget = async () => {
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        scene?.flyttHelt(9 * 16 + 8, 37 * 16 + 8);
    });
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(700);
    const knapp = await page.$('text=Jeg legger bordene');
    if (knapp) await knapp.click();
    await page.waitForTimeout(600);
};

await apneSkroget();
sjekk('Orm tilbyr skroget', Boolean(await page.$('[data-prove="skroget"]')));

/** Velger et alternativ på teksten sin. */
const velg = async (tekst) => {
    const knapp = await page.$(`[data-prove="skroget"] >> text=${tekst}`);
    if (!knapp) throw new Error(`fant ikke valget «${tekst}»`);
    await knapp.click();
    await page.waitForTimeout(260);
};

// ── Første forsøk: kant i kant. Det skal synke. ─────────────────────────────
await velg('Kjølen');
await velg('Kant i kant, glatt utenpå');
await velg('Jernnagler gjennom overlappet, klinket på baksiden');
await velg('Til slutt, ned i kjølsvinet');
await page.waitForTimeout(2800);

sjekk('Feil skrog siger', Boolean(await page.$('text=Det siger.')));
const rettelse = await page.$('text=Legg dem over hverandre');
sjekk('Orm sier hva som var galt', Boolean(rettelse));
await page.screenshot({ path: `${UT}/rpg-skroget-synker.png` });

const midt = await store();
sjekk('Ingen belønning for et skrog som sank', !midt?.steg?.includes('k1-skroget'));

// ── Andre forsøk: riktig. ──────────────────────────────────────────────────
const igjen = await page.$('text=Dra det opp igjen');
if (igjen) await igjen.click();
await page.waitForTimeout(400);

await velg('Kjølen');
await velg('Over hverandre, som takstein');
await velg('Jernnagler gjennom overlappet, klinket på baksiden');
await velg('Til slutt, ned i kjølsvinet');
await page.waitForTimeout(2800);

sjekk('Riktig skrog flyter', Boolean(await page.$('text=Det flyter.')));
await page.screenshot({ path: `${UT}/rpg-skroget-flyter.png` });

const videre = await page.$('[data-prove="skroget"] >> text=Videre');
if (videre) await videre.click();
await page.waitForTimeout(900);

const etter = await store();
sjekk('Steget er ført', etter?.steg?.includes('k1-skroget'), JSON.stringify(etter?.steg));
sjekk('Puzzlet er kontert', etter?.steg?.includes('puzzle:skroget'));
sjekk(
    'Klinkbygging er forstått',
    etter?.begreper?.klinkbygging === 'forstatt',
    JSON.stringify(etter?.begreper)
);
sjekk(
    'Orm husker at hun bommet første gang',
    etter?.flagg?.['k1-skroget-helt-fint'] !== true,
    JSON.stringify(etter?.flagg)
);

// ── Sjøsettingen skal komme med én gang ────────────────────────────────────
const bjelker = await page.evaluate(() =>
    Boolean(document.querySelector('[class*="klippBjelke"]'))
);
sjekk('Sjøsettingen begynner med én gang', bjelker);
await page.screenshot({ path: `${UT}/rpg-sjosettingen.png` });

// Klippet kjøres til ende. Hopp over er ikke lov første gang, så vi trykker oss
// gjennom replikkene i stedet - nøyaktig som en elev ville gjort.
for (let i = 0; i < 26; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(320);
    const gaar = await page.evaluate(() =>
        Boolean(document.querySelector('[class*="klippBjelke"]'))
    );
    if (!gaar) break;
}
await page.waitForTimeout(1200);

const slutt = await store();
sjekk('Sjøsettingen er sett', slutt?.sette?.includes('sjosettingen'), JSON.stringify(slutt?.sette));
sjekk('Sjøsettings-steget er ført', slutt?.steg?.includes('k1-sjosettingen'));

const laast = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    return scene?.laast ?? null;
});
sjekk('Verden er ikke låst etterpå', laast === false, `laast=${laast}`);

sjekk('Ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
