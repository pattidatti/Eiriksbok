// Driver Mellomspill II - «Én kilde er ikke to» - gjennom en ekte nettleser.
//
//   npm run dev                                 # i et annet skall
//   node scripts/verify-rpg-mellomspill2.mjs
//
// Det som måles er ikke at kortene rendrer, men de fire tingene bordet i 872
// står og faller på:
//
//   1. Bordet kommer *etter* vinteren, ikke oppå den. Kapittel 2 ender i et
//      fullskjerms oppgjør, og to skjermbilder over hverandre er ett eleven
//      ikke leser.
//   2. Kortene viser at Snorre siterer diktet. Det er hele tittelen: to kilder
//      som ser ut som to, er én.
//   3. Feltet blir stående tomt der årstallet skulle vært - det året hun
//      nettopp har levd et helt liv i. Linja om kornet til Harald står bare for
//      den som ga det.
//   4. Går hun fra bordet før det tomme feltet, er ingenting ført.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

/**
 * Året spilt fram til slakten. Alt som gjenstår er å la vinteren komme.
 *
 * Forrådet er satt så gården berger seg: sultevinteren er målt et annet sted
 * (`verify-rpg-aaret.mjs`), og en gård som sulter ville lagt en annen tekst på
 * skjermen enn den dette skriptet klikker seg forbi.
 */
const FOR_VINTEREN = {
    steg: ['k2-noklene', 'k2-vaaronn', 'k2-kornet', 'k2-hosten', 'k2-angrepet'],
    klokke: { aar: 872, dag: 85 },
};

const browser = await chromium.launch();

/** Åpner spillet på gården i 872, rett før vinteren. */
async function forVinteren(flagg = {}) {
    const page = await browser.newPage({
        viewport: { width: 1366, height: 768 },
        reducedMotion: 'no-preference',
    });
    const konsollfeil = [];
    page.on('pageerror', (e) => konsollfeil.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    await stengHmr(page);
    await page.addInitScript(
        ([nokkel, verdi]) => localStorage.setItem(nokkel, verdi),
        [
            'rpg-minnevokteren-v1',
            JSON.stringify({
                version: 4,
                state: {
                    version: 4,
                    spiller: {
                        character: {
                            name: 'Elev',
                            classId: 'vokter',
                            appearance: { skin: 1, hair: 2, hairColor: 1, face: 0 },
                        },
                    },
                    sisteEpoke: 'vikingtiden',
                    epoker: {
                        vikingtiden: {
                            kapittel: 2,
                            sisteSted: 'nordvik-872',
                            kampanje: {
                                sette: ['opptakt:k2'],
                                ...FOR_VINTEREN,
                                flagg,
                            },
                            kapittelState: {
                                forrad: { korn: 40, kjott: 0, dyr: 8, aaker: 0 },
                            },
                        },
                    },
                },
            }),
        ]
    );
    await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForTimeout(3200);
    return { page, konsollfeil };
}

const tilstand = (page) =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { steg: s.steg, begreper: s.begreper, kilder: s.kilder } : null;
    });

const laast = (page) =>
    page.evaluate(() => window.__rpg?.scene.getScene('verden')?.laast ?? null);

const trykkE = async (page) => {
    await page.keyboard.down('e');
    await page.waitForTimeout(150);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
};

const klikk = async (page, tekst) => {
    await page.getByRole('button', { name: tekst, exact: false }).first().click();
    await page.waitForTimeout(420);
};

/** Låser opp bua og lar året gå videre. Det er vinteren, og kapittelslutten. */
async function laVinterenKomme(page) {
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const mal = scene?.samhandling?.mal('landemerke', 'bua-872');
        if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
    });
    await page.waitForTimeout(400);
    await trykkE(page);
    await klikk(page, 'Lås opp bua');
    await page.waitForTimeout(500);
    await klikk(page, 'La året gå videre');
    await page.waitForTimeout(1400);
}

/** Klikker en knapp inne i bordet. */
async function iBordet(page, tekst) {
    const knapp = await page.$(`[data-prove="mellomspill"] >> text=${tekst}`);
    if (!knapp) throw new Error(`fant ikke knappen «${tekst}»`);
    await knapp.click();
    await page.waitForTimeout(340);
}

/**
 * Svarer på ett veiespørsmål med alternativ `n`, og går videre.
 *
 * Som i Mellomspill I velges det galt med vilje én gang: fasiten skal stå
 * uansett svar, og det er den regelen som ryker først den dagen noen vil legge
 * poeng på bordet.
 */
async function vei(page, n, videre) {
    await svar(page, n);
    await iBordet(page, videre);
}

/**
 * Svarer, og blir stående på fasiten.
 *
 * Skilt fra `vei` fordi fasiten er selve fagstoffet, og et skript som svarer og
 * går videre i samme kall aldri kan måle at den sto der. De fire viktigste
 * setningene på bordet leses gjennom denne.
 */
async function svar(page, n) {
    const valg = await page.$$('[data-prove="veiing"] button');
    if (!valg[n]) throw new Error(`veiingen hadde ikke alternativ ${n}`);
    await valg[n].click();
    await page.waitForTimeout(360);
}

// ── Økt 1: hun ga korn til Haralds mann ────────────────────────────────────

{
    const { page, konsollfeil } = await forVinteren({ 'k2-matet-harald': true });

    await laVinterenKomme(page);
    const etterVinteren = await tilstand(page);
    sjekk('kapittelet er ført', Boolean(etterVinteren?.steg.includes('kapittel:2')));
    sjekk(
        'bordet legger seg ikke oppå vinteren',
        (await page.locator('[data-prove="mellomspill"]').count()) === 0
    );
    sjekk('vinteren står alene på skjermen', ((await page.textContent('body')) ?? '').includes('Gården sto'));

    // Beskjeden leses, og *da* kommer bordet.
    await klikk(page, 'Videre');
    await page.waitForTimeout(900);
    sjekk('bordet kommer når vinteren er lest', (await page.locator('[data-prove="mellomspill"]').count()) === 1);
    sjekk('verden står låst bak bordet', (await laast(page)) === true);
    await page.screenshot({ path: `${UT}/rpg-mellomspill2-apning.png` });

    // Går fra bordet med én gang: ingenting skal være ført.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const avbrutt = await tilstand(page);
    sjekk('ingen bord uten det tomme feltet', !avbrutt?.steg?.includes('mellomspill:mellomspill-2'));
    sjekk('låsen er av når hun går fra bordet', (await laast(page)) === false);

    // Tilbake gjennom pausemenyen.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const igjen = await page.$('text=Kildene fra kapittel 2');
    sjekk('bordet ligger framme i pausemenyen', Boolean(igjen));
    if (igjen) await igjen.click();
    await page.waitForTimeout(800);

    // ── Diktet ─────────────────────────────────────────────────────────────
    await iBordet(page, 'Legg ut diktet');
    sjekk('diktet ligger på bordet', Boolean(await page.$('text=Kjøtve den rike')));
    sjekk(
        'kortet sier at skalden var kongens mann',
        Boolean(await page.$('text=Hos kongen selv'))
    );
    await page.screenshot({ path: `${UT}/rpg-mellomspill2-kvadet.png` });

    // Første spørsmål besvares galt med vilje.
    await page.$$('[data-prove="veiing"] button').then((b) => b[0].click());
    await page.waitForTimeout(360);
    sjekk(
        'fasiten står også når hun bommer',
        Boolean(await page.$('text=bygget for å huskes'))
    );
    await iBordet(page, 'Neste spørsmål');
    await svar(page, 1);
    sjekk('diktet navngir ikke Harald', Boolean(await page.$('text=Luva betyr omtrent')));
    await iBordet(page, 'Neste spørsmål');
    await vei(page, 1, 'Legg ut boka');

    // ── Snorre ─────────────────────────────────────────────────────────────
    sjekk('boka ligger på bordet', Boolean(await page.$('text=Så sier Hornklove')));
    await vei(page, 1, 'Neste spørsmål');
    await svar(page, 1);
    sjekk(
        'fire navn har kommet til hos Snorre',
        Boolean(await page.$('text=Roald Rygg og Hadd den harde står hos Snorre'))
    );
    await iBordet(page, 'Neste spørsmål');
    await svar(page, 1);
    sjekk(
        'bordet sier at det er én kilde sagt to ganger',
        Boolean(await page.$('text=Tre bøker på bordet, og fortsatt én kilde.'))
    );
    await page.screenshot({ path: `${UT}/rpg-mellomspill2-snorre.png` });
    await iBordet(page, 'Se etter årstallet');

    const kilderNaa = await tilstand(page);
    sjekk(
        'begge kildene er ført som lagt ut',
        kilderNaa?.kilder?.includes('haraldskvadet-hafrsfjord') &&
            kilderNaa?.kilder?.includes('heimskringla-hafrsfjord'),
        JSON.stringify(kilderNaa?.kilder)
    );

    // ── Det tomme feltet ───────────────────────────────────────────────────
    await iBordet(page, 'Se etter årstallet');
    await page.waitForTimeout(2600);
    sjekk('feltet blir stående tomt', Boolean(await page.$('[data-prove="tomt-felt"]')));
    sjekk(
        'årstallet står ikke i noen av kildene',
        Boolean(await page.$('text=Årstallet 872 står ikke i noen av dem.'))
    );
    sjekk(
        'den som ga korn til Harald får linja si',
        Boolean(await page.$('text=Du vet ikke sikkert hvilket år du gjorde det.'))
    );
    await page.screenshot({ path: `${UT}/rpg-mellomspill2-tomt.png` });

    await svar(page, 1);
    sjekk('regnestykket bak 872 står fram', Boolean(await page.$('text=Rudolf Keyser')));
    await iBordet(page, 'Se på bordet');
    await iBordet(page, 'Legg fra deg kildene');
    await page.waitForTimeout(900);

    const slutt = await tilstand(page);
    sjekk(
        'mellomspillet er kontert',
        slutt?.steg?.includes('mellomspill:mellomspill-2'),
        JSON.stringify(slutt?.steg?.slice(-3))
    );
    sjekk('uavhengige kilder er forstått', slutt?.begreper?.['uavhengige-kilder'] === 'forstatt');
    sjekk('datering er forstått', slutt?.begreper?.['datering'] === 'forstatt');
    // Kapittel 3 har ingen steg ennå, så hun blir stående i 872 med verden
    // åpen. Den dagen kapittelet finnes, tar `gaaVidereTilNesteKapittel` over -
    // og da er det `verify-rpg-kapittel3.mjs` som eier den overgangen.
    sjekk('verden er hennes igjen etterpå', (await laast(page)) === false);
    sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

    await page.close();
}

// ── Økt 2: hun ga ikke korn til Harald ─────────────────────────────────────

{
    const { page, konsollfeil } = await forVinteren();

    await laVinterenKomme(page);
    await klikk(page, 'Videre');
    await page.waitForTimeout(900);

    await iBordet(page, 'Legg ut diktet');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Legg ut boka');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Se etter årstallet');
    await iBordet(page, 'Se etter årstallet');
    await page.waitForTimeout(2600);

    sjekk(
        'feltet er tomt for henne også',
        Boolean(await page.$('text=Årstallet 872 står ikke i noen av dem.'))
    );
    sjekk(
        'linja om kornet står ikke for den som ikke ga',
        !(await page.$('text=Du vet ikke sikkert hvilket år du gjorde det.'))
    );
    sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

    await page.close();
}

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
