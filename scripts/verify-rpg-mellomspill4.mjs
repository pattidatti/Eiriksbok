// Driver slutten på 1030: året etter slaget, og bordet «Hvordan en taper blir
// en helgen».
//
//   npm run dev                                # i et annet skall
//   node scripts/verify-rpg-mellomspill4.mjs
//
// Det som måles:
//
//   1. Året etter kommer *etter* beskjeden fra sletta, ikke oppå den - og
//      bordet venter til også den er lest. Tre skjermbilder, i rekkefølge.
//   2. Kapittelet er over først når året etter er meldt.
//   3. Begge kortene ligger der, med henvisning en lærer kan slå opp.
//   4. Fasiten står også når eleven bommer.
//   5. Det tomme feltet er de tolv månedene, og linja om rekka som holdt står
//      bare for den som holdt den.
//   6. Bordet fullført gir `[Helgenkåring]` og `[Fortellingen vokser]`.

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

/** Kapittel 4 fram til rekka. Slaget spilles i prøven. */
const FOR_SLAGET = {
    steg: ['kapittel:3', 'k4-budstikka', 'k4-hvem-drar', 'k4-veien', 'k4-linja'],
    sette: ['opptakt:k4'],
    flagg: { 'k4-sonnen-med': true },
    begreper: { bondehaeren: 'forstatt' },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, { kapittel: 4, sisteSted: 'stiklestad', kampanje: FOR_SLAGET });
await page.waitForTimeout(3400);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { kapittel: s.kapittel, begreper: s.begreper, steg: s.steg } : null;
    });

const klikk = async (tekst) => {
    await page.getByRole('button', { name: tekst }).first().click();
    await page.waitForTimeout(340);
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

/** Velger alternativ n i veiingen og går videre. */
const vei = async (n, videre) => {
    const valg = await page.$$('[data-prove="veiing"] button');
    if (!valg[n]) throw new Error(`veiingen hadde ikke alternativ ${n}`);
    await valg[n].click();
    await page.waitForTimeout(340);
    await klikk(videre);
};

/** Legger ut begge kortene og svarer seg fram til det tomme feltet. */
const gjennomKortene = async () => {
    await klikk('Legg ut diktet');
    await page.waitForTimeout(400);
    await vei(0, 'Neste spørsmål');
    await vei(1, 'Neste spørsmål');
    await vei(1, 'Legg ut sagaen');
    await page.waitForTimeout(400);
    await vei(1, 'Neste spørsmål');
    await vei(1, 'Neste spørsmål');
    await vei(1, 'Se etter året imellom');
};

// ── 1-2. Slaget, året etter, og så bordet ───────────────────────────────────
await gaaTil('landemerke', 'rekka-stiklestad');
await klikk('Still deg i rekka');
await page.waitForTimeout(1000);
// Klokka skrus fram: tiden er reglen, og den er prøvd i verify-rpg-skjoldborg.
await page.evaluate(() => {
    const s = window.__rpg?.scene.getScene('verden');
    window.__rpgStore.setState({ hp: 999 });
    s.skjoldborg.gaatt = 89_500;
});
await page.waitForTimeout(3000);

const etterSlaget = (await page.textContent('body')) ?? '';
sjekk('beskjeden fra sletta kommer først', etterSlaget.includes('Rekka holdt'));
sjekk('året etter ligger ikke oppå den', !etterSlaget.includes('Året etter'));
sjekk('bordet ligger ikke oppå den', (await page.locator('[data-prove="mellomspill"]').count()) === 0);
const midt = await tilstand();
sjekk('kapittelet er ikke over ennå', !midt?.steg?.includes('kapittel:4'));

await klikk('Se deg om');
await page.waitForTimeout(1200);
const aaret = (await page.textContent('body')) ?? '';
sjekk('året etter melder seg', aaret.includes('Året etter'));
sjekk('helgenkåringen er datert', aaret.includes('3. august 1031'));
sjekk('og hva de vant ble til', aaret.includes('drepte en helgen'));
sjekk('bordet venter fortsatt', (await page.locator('[data-prove="mellomspill"]').count()) === 0);
await page.screenshot({ path: `${UT}/rpg-k4-aaret-etter.png` });
const etterAaret = await tilstand();
sjekk('kapittelet er over nå', etterAaret?.steg?.includes('kapittel:4'));

await klikk('Videre');
await page.waitForTimeout(1400);
sjekk('bordet åpner seg til slutt', (await page.locator('[data-prove="mellomspill"]').count()) === 1);
await page.screenshot({ path: `${UT}/rpg-k4-bordet.png` });

// ── 3-4. Kortene, henvisningene og fasiten ──────────────────────────────────
await klikk('Legg ut diktet');
await page.waitForTimeout(400);
const diktet = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('diktet er lagt ut', diktet.includes('sol ei varmet stridsmenn'));
sjekk('læreren kan slå det opp', diktet.includes('Erfidrápa'));
sjekk('og se at han ikke var der', diktet.includes('pilegrimsferd til Roma'));

// Første veiing besvares galt med vilje: fasiten skal stå uansett.
await page.$$('[data-prove="veiing"] button').then((b) => b[1].click());
await page.waitForTimeout(400);
const bom = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('fasiten står også når hun bommer', bom.includes('Nærhet gjør ikke en kilde nøytral'));
await klikk('Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(1, 'Legg ut sagaen');
await page.waitForTimeout(400);
const sagaen = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('sagaen er lagt ut', sagaen.includes('en rød sky over himmelen'));
sjekk('målformbyttet står oppgitt', sagaen.includes('overført til bokmål'));
await vei(1, 'Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(1, 'Se etter året imellom');

// ── 5. Det tomme feltet ─────────────────────────────────────────────────────
await klikk('Se etter året imellom');
await page.waitForTimeout(2600);
const tomt = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('feltet er de tolv månedene', tomt.includes('Ingen skrev det ned'));
sjekk('hun sto der selv, og ingen spurte', tomt.includes('Ingen har spurt deg om noe'));
sjekk('linja for den som holdt rekka står', tomt.includes('Rekka di holdt'));
await page.screenshot({ path: `${UT}/rpg-k4-tomtfelt.png` });

// Fasiten leses før det klikkes videre: «Se på bordet» tar den av skjermen.
await page.$$('[data-prove="veiing"] button').then((b) => b[1].click());
await page.waitForTimeout(400);
const fasit = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('det eldste vitnesbyrdet navngis', fasit.includes('Glælognskviða'));
sjekk('og hvem det var stilet til', fasit.includes('Knuts sønn Svein'));
await klikk('Se på bordet');
await page.waitForTimeout(400);
await klikk('Legg fra deg kildene');
await page.waitForTimeout(1400);

// ── 6. Regnskapet ───────────────────────────────────────────────────────────
const etter = await tilstand();
sjekk('bordet er fullført', etter?.steg?.includes('mellomspill:mellomspill-4'));
sjekk('helgenkåring er forstått', etter?.begreper?.helgenkaaring === 'forstatt');
sjekk('fortellingen vokser er forstått', etter?.begreper?.['fortellingen-vokser'] === 'forstatt');
// Kapittel 5 er ikke bygget. Da skal hun bli stående, ikke sendes til et tomt kart.
sjekk('hun blir stående i 1030', etter?.kapittel === 4, String(etter?.kapittel));

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
