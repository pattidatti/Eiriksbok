// Driver ferden vestover og raidet mot Lindisfarne i en ekte nettleser.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-lindisfarne.mjs
//
// Det som måles er kjeden gjennom andre halvdel av kapittel 1, og særlig det
// som er lett å ødelegge uten at noe krasjer:
//
//   - at navigasjonen bare slipper henne fram når hun holdt breddegraden
//   - at hun faktisk kommer til et *annet kart*, med klosteret på
//   - at forsvarerne settes ut, og at han som fører dem har navnestolpe
//   - at andre halvdel slår inn når siste mann faller: de som er igjen
//     flykter, og de er `stille` - ingen XP, ingen loot, ingen skadetall
//   - at valgene setter flaggene sine, og at bøkene ikke gir sølv
//   - at hun kan reise hjem og avslutte kapittelet

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
        return s
            ? {
                  steg: s.steg,
                  begreper: s.begreper,
                  flagg: s.flagg,
                  solv: s.solv,
                  sisteSted: s.sisteSted,
              }
            : null;
    });

const fiender = () =>
    page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        return (scene?.fiendeSystem?.alle() ?? [])
            .filter((f) => !f.dodd)
            .map((f) => ({
                id: f.def.id,
                navn: f.navn ?? null,
                topp: Boolean(f.toppstolpe),
                stille: Boolean(f.stille),
                flykter: Boolean(f.flykter),
            }));
    });

// Stegene fram til ferden er alt målt av de to andre skriptene. Her sås de, så
// prøven kan begynne der den faktisk hører hjemme.
await page.evaluate(() =>
    window.__rpgStore?.setState({ steg: ['k1-ravn', 'k1-skroget', 'k1-sjosettingen'] })
);
await page.waitForTimeout(300);

// ── Ferden vestover ─────────────────────────────────────────────────────────
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.flyttHelt(9 * 16 + 8, 37 * 16 + 8);
});
await page.waitForTimeout(400);
await page.keyboard.down('e');
await page.waitForTimeout(160);
await page.keyboard.up('e');
await page.waitForTimeout(700);

const ferdknapp = await page.$('text=Jeg blir med vestover');
sjekk('Orm tilbyr ferden når skroget flyter og Ravn er ferdig', Boolean(ferdknapp));
if (ferdknapp) await ferdknapp.click();
await page.waitForTimeout(700);
sjekk('Navigasjonen åpner', Boolean(await page.$('[data-prove="navigasjonen"]')));
await page.screenshot({ path: `${UT}/rpg-navigasjonen.png` });

/** Ett døgn: velg kurs, les hva den betydde, gå videre. */
const seil = async (kurs) => {
    const knapp = await page.$(`[data-prove="navigasjonen"] >> text=${kurs}`);
    if (!knapp) throw new Error(`fant ikke kursen «${kurs}»`);
    await knapp.click();
    await page.waitForTimeout(260);
    const videre =
        (await page.$('[data-prove="navigasjonen"] >> text=Neste dag')) ??
        (await page.$('[data-prove="navigasjonen"] >> text=Se etter land'));
    if (videre) await videre.click();
    await page.waitForTimeout(260);
};

// Feil kurs to dager på rad: hun skal møte ingenting.
await seil('Legg sørover');
await seil('Legg sørover');
await seil('Legg nordover');
await seil('Hold kursen');
sjekk('To bom gir ingen kyst', Boolean(await page.$('text=Ingenting.')));
const paaNytt = await page.$('text=Finn høyden på nytt');
if (paaNytt) await paaNytt.click();
await page.waitForTimeout(400);

// Og riktig kurs hele veien.
await seil('Legg nordover');
await seil('Hold kursen');
await seil('Legg nordover');
await seil('Hold kursen');
sjekk('Riktig breddegrad gir land', Boolean(await page.$('text=Land.')));

const inn = await page.$('[data-prove="navigasjonen"] >> text=Sett kursen inn');
if (inn) await inn.click();
// Reisen toner ut, scenen bygges på nytt, og `stranda` spilles.
await page.waitForTimeout(3000);

const etterReise = await store();
sjekk('Breddegradseiling er forstått', etterReise?.begreper?.breddegradseiling === 'forstatt');
sjekk('Hun står på Lindisfarne', etterReise?.sisteSted === 'lindisfarne', etterReise?.sisteSted);

// ── Cutscenen «stranda», og så motstanden ──────────────────────────────────
for (let i = 0; i < 30; i++) {
    const gaar = await page.evaluate(() =>
        Boolean(document.querySelector('[class*="klippBjelke"]'))
    );
    if (!gaar) break;
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
}
await page.waitForTimeout(1400);
await page.screenshot({ path: `${UT}/rpg-lindisfarne.png` });

const forsvarere = await fiender();
sjekk('Øyas menn står der', forsvarere.length >= 6, `${forsvarere.length} stk`);
sjekk(
    'Han som fører dem har navnestolpe',
    forsvarere.some((f) => f.topp && f.navn === 'Mannen med hjelmen'),
    JSON.stringify(forsvarere.find((f) => f.topp) ?? null)
);
sjekk('Ingen av dem flykter ennå', forsvarere.every((f) => !f.flykter));
sjekk('Navnestolpen står øverst', Boolean(await page.$('[data-prove="motstander"]')));

// ── Motstanden felles, og spillet slutter å juble ──────────────────────────
//
// Vi dreper dem fra scenen i stedet for å slåss oss gjennom sju mann. Prøven
// måler hva som skjer *etterpå*, ikke om kampen er vinnbar - det siste er en
// balansejobb, ikke en regressjon.
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    for (const f of scene?.fiendeSystem?.alle() ?? []) {
        if (!f.dodd) scene.fiendeSystem.skad(f, 9999, false, 0);
    }
});
await page.waitForTimeout(4200);

const igjen = await fiender();
sjekk('De som er igjen, flykter', igjen.length > 0 && igjen.every((f) => f.flykter), `${igjen.length} stk`);
sjekk('De er stille - ingen tall, ingen loot, ingen XP', igjen.every((f) => f.stille));
sjekk('Navnestolpen er borte', !(await page.$('[data-prove="motstander"]')));

const etterKamp = await store();
sjekk('Motstands-steget er ført', etterKamp?.steg?.includes('k1-motstanden'));
await page.screenshot({ path: `${UT}/rpg-stillheten.png` });

// XP-en fra en flyktende skal være null. Vi dreper én og ser at sølvet står.
const solvFor = etterKamp?.solv ?? 0;
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const f = (scene?.fiendeSystem?.alle() ?? []).find((x) => !x.dodd);
    if (f) scene.fiendeSystem.skad(f, 9999, false, 0);
});
await page.waitForTimeout(1600);
sjekk('Ingen loot faller i andre halvdel', (await store())?.solv === solvFor);

// ── Valgene ────────────────────────────────────────────────────────────────
const taValg = async (rute, knapp) => {
    await page.evaluate(([x, y]) => {
        const scene = window.__rpg?.scene.getScene('verden');
        scene?.flyttHelt(x * 16 + 8, y * 16 + 8 + 14);
    }, rute);
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(600);
    const k = await page.$(`text=${knapp}`);
    if (k) await k.click();
    await page.waitForTimeout(500);
    return Boolean(k);
};

sjekk('Skrinet kan tas', await taValg([32, 18], 'Ta skrinet'));
const etterSkrin = await store();
sjekk('Skrinet gir sølv', (etterSkrin?.solv ?? 0) > solvFor, `${etterSkrin?.solv} sølv`);
sjekk('Flagget er satt', etterSkrin?.flagg?.['k1-tok-skrinet'] === true);

const solvForBoker = etterSkrin?.solv ?? 0;
sjekk('Bøkene kan tas', await taValg([28, 12], 'Ta bøkene'));
const etterBoker = await store();
sjekk(
    'Bøkene gir ingenting - de er verdiløse for henne',
    etterBoker?.solv === solvForBoker,
    `${etterBoker?.solv} sølv`
);
sjekk('Bokflagget er satt', etterBoker?.flagg?.['k1-tok-bokene'] === true);

// ── Hjem, og kapittelet er over ────────────────────────────────────────────
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.bestillReise('nordvik');
});
await page.waitForTimeout(3400);

const hjemme = await store();
sjekk('Hun er hjemme', hjemme?.sisteSted === 'nordvik', hjemme?.sisteSted);
sjekk('Bytte-steget er ført', hjemme?.steg?.includes('k1-byttet'));
sjekk('Oppgavekortet fulgte ikke med hjem', (await page.$('[data-prove="oppgave"]')) === null);

await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.flyttHelt(9 * 16 + 8, 37 * 16 + 8);
});
await page.waitForTimeout(400);
await page.keyboard.down('e');
await page.waitForTimeout(160);
await page.keyboard.up('e');
await page.waitForTimeout(700);
const fortell = await page.$('text=Fortell hva du tok med');
sjekk('Orm spør hva du tok med', Boolean(fortell));
if (fortell) await fortell.click();
await page.waitForTimeout(800);

const slutt = await store();
sjekk('Kapittelet er ført', slutt?.steg?.includes('kapittel:1'), JSON.stringify(slutt?.steg));

sjekk('Ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
