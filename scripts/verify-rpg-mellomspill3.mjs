// Driver bordet etter 995: «Hvem gagner denne fortellingen?»
//
//   npm run dev                                # i et annet skall
//   node scripts/verify-rpg-mellomspill3.mjs
//
// Det som måles:
//
//   1. Bordet kommer etter beskjeden om vinteren, ikke oppå den.
//   2. Begge kortene ligger der, med henvisning en lærer kan slå opp.
//   3. Fasiten står også når eleven bommer. Bordet har ingenting å straffe.
//   4. Det tomme feltet er dem som sa nei - og linja om at hun selv sa nei
//      står bare for den som gjorde det.
//   5. Går hun fra bordet før det tomme feltet, er ingenting fullført.
//   6. Bordet fullført gir `[Hvem gagner fortellingen?]` og `[Vinnerens penn]`.

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

/** Kapittel 3 til og med holmgangen. Vinternettene spilles i prøven. */
const FOR_VINTEREN = {
    steg: ['kapittel:2', 'k3-knarren', 'k3-blotet', 'k3-utfordret', 'k3-holmgangen'],
    sette: ['opptakt:k3'],
    begreper: { blot: 'forstatt', holmgang: 'forstatt' },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, { kapittel: 3, sisteSted: 'nordvik-995', kampanje: FOR_VINTEREN });
await page.waitForTimeout(3200);

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

// ── 1. Bordet kommer etter beskjeden ────────────────────────────────────────
await gaaTil('landemerke', 'langhuset-995');
await klikk('Kall folkene sammen');
await page.waitForTimeout(600);
await klikk('Svar dem');
await klikk('Nei');
await page.waitForTimeout(500);
await klikk('Gå ut');
await page.waitForTimeout(900);

sjekk('vinteren melder seg først', ((await page.textContent('body')) ?? '').includes('Vinteren 995'));
sjekk('bordet ligger ikke oppå den', (await page.locator('[data-prove="mellomspill"]').count()) === 0);
await klikk('Videre');
await page.waitForTimeout(1200);
sjekk('bordet åpner seg etterpå', (await page.locator('[data-prove="mellomspill"]').count()) === 1);
await page.screenshot({ path: `${UT}/rpg-k3-bordet.png` });

// ── 2-3. Kortene, henvisningene og fasiten ──────────────────────────────────
await klikk('Legg ut steinen');
await page.waitForTimeout(400);
const steinen = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('steinen er lagt ut', steinen.includes('Tolv vintre hadde kristendommen'));
sjekk('læreren kan slå den opp', steinen.includes('Kulisteinen (N 449)'));

// Første veiing besvares galt med vilje: fasiten skal stå uansett.
await page.$$('[data-prove="veiing"] button').then((b) => b[0].click());
await page.waitForTimeout(400);
const bom = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('fasiten står også når hun bommer', bom.includes('et monument noen har bekostet'));
await klikk('Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(0, 'Legg ut sagaen');
await page.waitForTimeout(400);
const sagaen = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('sagaen er lagt ut', sagaen.includes('noen lot han lemleste'));
sjekk('oversetteren står oppgitt', sagaen.includes('Gustav Storm'));
await vei(0, 'Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(1, 'Se etter dem som sa nei');

// ── 5. Går hun fra bordet nå, er ingenting fullført ─────────────────────────
await page.keyboard.press('Escape');
await page.waitForTimeout(700);
const forTidlig = await tilstand();
sjekk(
    'ingenting er fullført før det tomme feltet',
    !forTidlig?.steg?.includes('mellomspill:mellomspill-3'),
    JSON.stringify(forTidlig?.steg?.slice(-2))
);
sjekk('og ingen begreper er delt ut', !forTidlig?.begreper?.partiskhet);

// Tilbake til bordet gjennom pausemenyen.
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
await klikk('Hvem gagner denne fortellingen?');
await page.waitForTimeout(900);
sjekk('bordet ligger framme i menyen', (await page.locator('[data-prove="mellomspill"]').count()) === 1);

// ── 4. Det tomme feltet ─────────────────────────────────────────────────────
await klikk('Legg ut steinen');
await vei(1, 'Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(0, 'Legg ut sagaen');
await vei(0, 'Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(1, 'Se etter dem som sa nei');
await klikk('Se etter dem som sa nei');
await page.waitForTimeout(2600);
const tomt = (await page.textContent('[data-prove="mellomspill"]')) ?? '';
sjekk('feltet er dem som sa nei', tomt.includes('Ingen av dem har skrevet en eneste setning'));
sjekk('blotet hennes står ingen steder', tomt.includes('Du holdt et blot'));
sjekk('linja for den som nektet står', tomt.includes('Du sa nei, høyt'));
await page.screenshot({ path: `${UT}/rpg-k3-tomtfelt.png` });

await vei(1, 'Se på bordet');
await klikk('Legg fra deg kildene');
await page.waitForTimeout(1200);

// ── 6. Regnskapet ───────────────────────────────────────────────────────────
const etter = await tilstand();
sjekk('bordet er fullført', etter?.steg?.includes('mellomspill:mellomspill-3'));
sjekk('partiskhet er forstått', etter?.begreper?.partiskhet === 'forstatt');
sjekk('vinnerens penn er forstått', etter?.begreper?.['vinnerens-penn'] === 'forstatt');
// Kapittel 4 er ikke bygget. Da skal hun bli stående, ikke sendes til et tomt kart.
sjekk('hun blir stående i 995', etter?.kapittel === 3, String(etter?.kapittel));

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
