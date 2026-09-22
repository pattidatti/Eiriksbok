// Prøver Prøvebanen (portalen «Test meg» i hallen) i en ekte nettleser.
//
//   npm run dev                          # i et annet skall
//   node scripts/verify-rpg-testbanen.mjs
//
// Sandkassen er verktøyet vi bygger basissystemene i. Går den i stykker, får
// vi ikke vite det av at noe annet slutter å virke - ingen elev går hit, og
// ingen annen prøve rører den. Derfor måles den for seg:
//
//   1. portalen i hallen fører hit
//   2. epokenavnerommet er sitt eget, så sandkasse-XP ikke lekker inn i
//      vikingtidskampanjen
//   3. hver stasjon på tunet svarer når eleven står foran den
//   4. tunet er fritt for fiender, og feltet i øst er det ikke
//   5. porten hjem virker, og kampanjen står urørt etterpå

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE, entreHallen, stengHmr } from './lib/rpg-testside.mjs';

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

const sidefeil = [];
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));
page.on('pageerror', (e) => sidefeil.push(String(e)));

await stengHmr(page);
await entreHallen(page);
await page.waitForFunction(() => Boolean(window.__rpgStore), null, { timeout: 30000 });
await page.waitForTimeout(2600);

const les = () =>
    page.evaluate(() => {
        const scene = window.__rpg.scene.getScene('verden');
        const s = window.__rpgStore.getState();
        return {
            portaler: scene.portalOversikt(),
            sted: s.sisteSted,
            epokeId: s.epokeId,
            xp: s.xp,
            solv: s.solv,
            sekk: s.sekk,
            lest: s.lest,
            begreper: s.begreper,
            quester: s.quester,
            andreEpoker: Object.keys(s.andreEpoker),
        };
    });

const ventPaaSted = async (stedId) => {
    await page.waitForFunction(
        (id) => {
            const scene = window.__rpg.scene.getScene('verden');
            return (
                window.__rpgStore.getState().sisteSted === id &&
                !scene.cameras.main.fadeEffect.isRunning
            );
        },
        stedId,
        { timeout: 20000, polling: 200 }
    );
};

const hold = async (tast, ms) => {
    await page.keyboard.down(tast);
    await page.waitForTimeout(ms);
    await page.keyboard.up(tast);
    await page.waitForTimeout(220);
};

/**
 * Lukker et åpent landemerkepanel - og bare da.
 *
 * Et valg lukker panelet selv. Et blindt Escape etterpå treffer derfor ikke
 * panelet, men pausemenyen, og da står verden stille mens prøven tror den
 * måler et spill som går. Det kostet én feilsøking; derfor spør vi først.
 */
const lukkPanel = async () => {
    const apent = await page.locator('button:has-text("Lukk (Esc)")').count();
    if (apent === 0) return;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
};

/** Setter eleven ned på en rute og leser hintlinja der. */
const staaPaa = async (tx, ty) => {
    await page.evaluate(
        ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x * 16 + 8, y * 16 + 8),
        [tx, ty]
    );
    await page.waitForTimeout(500);
    return (await page.evaluate(() => document.body.innerText)).match(/E - [^\n]*/)?.[0] ?? '';
};

// ── 1. Inn gjennom «Test meg» ───────────────────────────────────────────────

const hall = await les();
const sandkassen = hall.portaler.find((p) => p.tittel === 'TEST MEG');
sjekk('portalen står i hallen', Boolean(sandkassen));

await page.evaluate(
    ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x, y + 10),
    [sandkassen.x, sandkassen.y]
);
await page.waitForTimeout(700);
const vedPortal = (await page.evaluate(() => document.body.innerText)).match(/E - [^\n]*/)?.[0];
sjekk('portalen svarer', Boolean(vedPortal?.includes('TEST MEG')), vedPortal);

await hold('e', 160);
await ventPaaSted('testbanen');
const inne = await les();
sjekk('eleven kom til Prøvebanen', inne.sted === 'testbanen', inne.sted);

// ── 2. Eget navnerom ────────────────────────────────────────────────────────
//
// Dette er hele grunnen til at sandkassen har en egen epoke-id. Gjør vi noe
// her, skal vikingtidskampanjen ligge urørt i `andreEpoker` og hentes hel fram
// igjen når eleven går hjem.
sjekk('epoken er sandkassens egen', inne.epokeId === 'testbanen', inne.epokeId);
sjekk(
    'vikingtiden ble lagt til side hel',
    inne.andreEpoker.includes('vikingtiden'),
    inne.andreEpoker.join(', ')
);
sjekk('hun begynner på null her', inne.xp === 0 && inne.solv === 0, `${inne.xp} xp, ${inne.solv} s`);

await page.screenshot({ path: `${UT}/testbanen-1-tunet.png` });

// ── 3. Stasjonene på tunet ──────────────────────────────────────────────────

sjekk('skiltet svarer', (await staaPaa(10, 23)).includes('Oppslagstavla'));
sjekk('bålet svarer', (await staaPaa(6, 22)).includes('Prøvebålet'));
sjekk('kremmeren svarer', (await staaPaa(15, 23)).includes('Bergljot'));
sjekk('prøvemesteren svarer', (await staaPaa(11, 15)).includes('Prøvemesteren'));
sjekk('båten svarer', (await staaPaa(34, 23)).includes('prøvebåten'));

// Runesteinen skal løfte begrepet helt til forstått - den ene stasjonen som
// måler minnetreet uten at noe annet må skje først.
sjekk('runesteinen svarer', (await staaPaa(16, 15)).includes('Prøvesteinen'));
await hold('e', 160);
await page.waitForTimeout(600);
await lukkPanel();
const etterStein = await les();
sjekk(
    'runesteinen ga begrepet',
    etterStein.begreper['samtidig-kilde'] === 'forstatt',
    etterStein.begreper['samtidig-kilde']
);

// Kista måler valgsystemet: knapp, flagg, sølv.
sjekk('kista svarer', (await staaPaa(20, 23)).includes('Prøvekista'));
await hold('e', 160);
await page.waitForTimeout(600);
await page.click('button:has-text("Ta sølvet")');
await page.waitForTimeout(500);
await lukkPanel();
const etterKiste = await les();
sjekk('kista ga sølvet', etterKiste.solv === 200, `${etterKiste.solv} sølv`);

// ── 4. Tunet er trygt, feltet er det ikke ───────────────────────────────────
//
// Avstanden mellom de to sonene er regnet ut i `data/testbanen.ts`. Her måles
// det som faktisk teller: at ingen kommer mens eleven står på tunet, og at de
// kommer når hun går østover.
const levende = () =>
    page.evaluate(
        () =>
            window.__rpg.scene
                .getScene('verden')
                .fiendeSystem.alle()
                .filter((f) => !f.dodd && f.def.kind !== 'boss').length
    );

await staaPaa(11, 18);
await page.waitForTimeout(9000);
const paaTunet = await levende();
sjekk('ingen fiender på tunet', paaTunet === 0, `${paaTunet} levende`);

await staaPaa(40, 18);
await page.waitForTimeout(12000);
const iFeltet = await levende();
sjekk('fiender kommer i feltet', iFeltet > 0, `${iFeltet} levende`);
await page.screenshot({ path: `${UT}/testbanen-2-feltet.png` });

// ── 5. Hjem igjen, og videre inn i den ekte kampanjen ───────────────────────
//
// Hallen ligger utenfor alle epoker, og bytter derfor ingenting: står eleven i
// sandkassen når hun går ut porten, er det sandkassens tall som står i HUD-en
// i hallen. Det er den samme regelen som gjelder når hun kommer hjem fra
// Nordvik, og den skal ikke ha et unntak for sandkassen.
//
// Løftet er et annet, og det er det som måles her: i det hun går inn i
// Vikingtiden igjen, skal kampanjen hennes komme hel tilbake - uten et eneste
// sølvstykke og uten et eneste begrep fra sandkassen.

const hjem = (await les()).portaler[0];
await page.evaluate(
    ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x, y + 10),
    [hjem.x, hjem.y]
);
await page.waitForTimeout(700);
await hold('e', 160);
await ventPaaSted('hub');
const tilbake = await les();
sjekk('eleven kom hjem til hallen', tilbake.sted === 'hub', tilbake.sted);
sjekk(
    'sandkassen ble lagt til side hel',
    tilbake.andreEpoker.includes('vikingtiden') || tilbake.epokeId === 'testbanen',
    `aktiv: ${tilbake.epokeId}`
);

const viking = tilbake.portaler.find((p) => p.tittel === 'Vikingtiden');
await page.evaluate(
    ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x, y + 10),
    [viking.x, viking.y]
);
await page.waitForTimeout(700);
await hold('e', 160);
await ventPaaSted('nordvik');
const kampanjen = await les();
sjekk('epoken er vikingtiden igjen', kampanjen.epokeId === 'vikingtiden', kampanjen.epokeId);
sjekk('sandkassens sølv lekket ikke inn', kampanjen.solv === 0, `${kampanjen.solv} sølv`);
sjekk('sandkassens xp lekket ikke inn', kampanjen.xp === 0, `${kampanjen.xp} xp`);
sjekk(
    'sandkassens begrep lekket ikke inn',
    kampanjen.begreper['samtidig-kilde'] === undefined,
    kampanjen.begreper['samtidig-kilde']
);
sjekk(
    'sandkassen ligger lagret for seg',
    kampanjen.andreEpoker.includes('testbanen'),
    kampanjen.andreEpoker.join(', ')
);

sjekk('ingen feil i konsollen', sidefeil.length === 0, sidefeil[0]);

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nPrøvebanen står.');
process.exit(feil.length ? 1 : 0);
