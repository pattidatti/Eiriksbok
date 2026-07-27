// Spiller et helt år på Nordvik i 872, gjennom en ekte nettleser.
//
//   npm run dev                          # i et annet skall
//   node scripts/verify-rpg-aaret.mjs
//
// Det som måles er at årshjulet henger sammen som årsak og virkning, ikke at
// skjermene rendrer:
//
//   1. Bua viser regnestykket for vinteren *før* hun velger, og det er det
//      samme regnestykket som gjør opp til slutt.
//   2. Såkornet forsvinner fra bingen og dukker opp på åkeren. Tidlig sådd korn
//      gir mer enn sent sådd - det er årstidene, ikke en terning.
//   3. Kongsmennene står på tunet bare om sommeren, og forsvinner når hun har
//      svart. Kornet finnes bare én gang: gir hun til den ene, er den andre
//      forbi.
//   4. Innhøstingen kommer når høsten kommer, og bare det som sto på rot.
//   5. Vinteren gjør opp etter tallet hun fikk se.
//   6. Gaven som kommer tilbake: ga hun til naboætta i sommer, kommer de over
//      isen når det knep. Det er hele forsikringen i et samfunn uten stat.

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

const browser = await chromium.launch();

/** Åpner spillet på gården i 872, med opptakten alt sett. */
async function gaarden(kampanje = {}, kapittelState = {}) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
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
                                steg: ['k2-noklene'],
                                klokke: { aar: 872, dag: 1 },
                                ...kampanje,
                            },
                            kapittelState: { ...kapittelState },
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
        return s
            ? {
                  forrad: s.forrad,
                  klokke: s.klokke,
                  steg: s.steg,
                  flagg: s.flagg,
                  aere: s.aere,
                  aetter: s.aetter,
                  begreper: s.begreper,
              }
            : null;
    });

const trykkE = async (page) => {
    await page.keyboard.down('e');
    await page.waitForTimeout(150);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
};

const stillDegVed = (page, type, id) =>
    page.evaluate(
        ([type, id]) => {
            const scene = window.__rpg?.scene.getScene('verden');
            const mal = scene?.samhandling?.mal(type, id);
            if (!mal) return null;
            scene.helt.sprite.setPosition(mal.x, mal.y + 10);
            return mal.navn;
        },
        [type, id]
    );

/**
 * Klikker knappen med denne teksten.
 *
 * Bevisst avgrenset til `button`: oppgavekortet i HUD-en sier ofte det samme
 * som knappen eleven skal trykke på («Lås opp bua»), og et rent tekstsøk traff
 * kortet - som ligger under overlegget og ikke tar klikk.
 */
const klikk = async (page, tekst) => {
    await page.getByRole('button', { name: tekst, exact: false }).first().click();
    await page.waitForTimeout(420);
};

/** Åpner bua ved å gå bort til den og trykke E. */
async function apneBua(page) {
    await stillDegVed(page, 'landemerke', 'bua-872');
    await page.waitForTimeout(400);
    await trykkE(page);
    await klikk(page, 'Lås opp bua');
    await page.waitForTimeout(500);
}

// ── Økt 1: et år spilt godt ────────────────────────────────────────────────
{
    const { page, konsollfeil } = await gaarden();

    await apneBua(page);
    sjekk('bua åpner seg', (await page.locator('[data-prove="forradet"]').count()) === 1);

    const margin = () =>
        page.getAttribute('[data-prove="margin"]', 'data-margin').then(Number);
    const forMargin = await margin();
    sjekk('vinteren er underskudd før hun sår', forMargin < 0, `margin ${forMargin}`);
    await page.screenshot({ path: `${UT}/rpg-bua-vaar.png` });

    // ── Såkornet ───────────────────────────────────────────────────────────
    await klikk(page, 'Så åtte sekker');
    await page.waitForTimeout(700);
    const etterSaaing = await tilstand(page);
    sjekk(
        'såkornet forsvinner fra bingen',
        etterSaaing?.forrad.korn === 14,
        `korn ${etterSaaing?.forrad.korn}`
    );
    sjekk(
        'og står på åkeren, tredoblet fordi hun sådde tidlig',
        etterSaaing?.forrad.aaker === 24,
        `åker ${etterSaaing?.forrad.aaker}`
    );
    sjekk('våronna kostet dager', etterSaaing?.klokke.dag === 11, `dag ${etterSaaing?.klokke.dag}`);
    sjekk('tidlig såing er ført som flagg', etterSaaing?.flagg['k2-saadde-tidlig'] === true);
    sjekk('årshjulet er forstått', etterSaaing?.begreper?.aarshjulet === 'forstatt');

    // ── Sommeren ───────────────────────────────────────────────────────────
    await klikk(page, 'La året gå videre');
    await page.waitForTimeout(900);
    const iSommer = await tilstand(page);
    sjekk('året er i sommeren', iSommer?.klokke.dag === 31, `dag ${iSommer?.klokke.dag}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    const synlig = (id) =>
        page.evaluate(
            (id) =>
                window.__rpg
                    ?.scene.getScene('verden')
                    ?.samhandling?.npcSprites?.get(id)?.visible ?? null,
            id
        );
    sjekk('kongens mann står på tunet i sommer', (await synlig('torolv')) === true);
    sjekk('motstandernes mann også', (await synlig('eystein')) === true);

    // Naboen først: seks sekker over vika.
    await stillDegVed(page, 'npc', 'vigdis');
    await trykkE(page);
    await klikk(page, 'Seks sekker over vika');
    await page.waitForTimeout(700);
    const etterGave = await tilstand(page);
    sjekk('naboen fikk kornet', etterGave?.forrad.korn === 8, `korn ${etterGave?.forrad.korn}`);
    sjekk(
        'og Sæbø-ætta står i gjeld',
        (etterGave?.aetter?.saebo?.velvilje ?? 0) >= 45,
        JSON.stringify(etterGave?.aetter?.saebo)
    );

    // Så kongens mann. Da er spørsmålet lukket.
    await stillDegVed(page, 'npc', 'torolv');
    await trykkE(page);
    await klikk(page, 'Åtte sekker til kongen');
    await page.waitForTimeout(800);
    const etterHarald = await tilstand(page);
    sjekk('kongen fikk sitt', etterHarald?.forrad.korn === 0, `korn ${etterHarald?.forrad.korn}`);
    sjekk('spørsmålet er lukket', etterHarald?.steg.includes('k2-kornet'));
    sjekk('kongens krav er forstått', etterHarald?.begreper?.leidang === 'forstatt');
    await page.waitForTimeout(400);
    sjekk('kongsmennene er borte etterpå', (await synlig('torolv')) === false);

    // ── Høsten ─────────────────────────────────────────────────────────────
    await apneBua(page);
    await klikk(page, 'La året gå videre');
    await page.waitForTimeout(900);
    const iHost = await tilstand(page);
    sjekk('kornet er høstet inn', iHost?.forrad.korn === 24, `korn ${iHost?.forrad.korn}`);
    sjekk('åkeren står tom etterpå', iHost?.forrad.aaker === 0);
    sjekk('innhøstingen kostet dager', iHost?.klokke.dag === 73, `dag ${iHost?.klokke.dag}`);

    await klikk(page, 'Slakt to dyr');
    await page.waitForTimeout(700);
    const etterSlakt = await tilstand(page);
    sjekk(
        'slakten gir kjøtt og færre munner å fø',
        etterSlakt?.forrad.dyr === 6 && etterSlakt?.forrad.kjott === 5,
        `dyr ${etterSlakt?.forrad.dyr}, kjøtt ${etterSlakt?.forrad.kjott}`
    );
    await page.screenshot({ path: `${UT}/rpg-bua-host.png` });

    // ── Vinteren ───────────────────────────────────────────────────────────
    await klikk(page, 'La året gå videre');
    await page.waitForTimeout(1200);
    const slutt = await tilstand(page);
    sjekk('gården sto vinteren av', slutt?.flagg['k2-stod-vinteren'] === true, JSON.stringify(slutt?.flagg));
    sjekk('kapittelet er ført', slutt?.steg.includes('kapittel:2'));
    sjekk('husfrua er forstått', slutt?.begreper?.husfrue === 'forstatt');
    const sluttskjerm = (await page.textContent('body')) ?? '';
    sjekk('vinteren får sitt eget skjermbilde', sluttskjerm.includes('Gården sto'));
    await page.screenshot({ path: `${UT}/rpg-vinteren.png` });
    sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));
    await page.close();
}

// ── Økt 2: gaven som kommer tilbake ────────────────────────────────────────
// Hun ga til naboætta, og hun kommer til kort. Da kommer Vigdis over isen.
{
    const { page } = await gaarden(
        {
            steg: ['k2-noklene', 'k2-vaaronn', 'k2-kornet', 'k2-hosten', 'k2-gave-saebo'],
            klokke: { aar: 872, dag: 85 },
            aetter: { saebo: { velvilje: 45, uoppgjort: 0 } },
            flagg: { 'k2-matet-saebo': true },
        },
        // Ti sekker for lite: nær nok til at gjengaven avgjør. Den er tolv
        // sekker og ikke tolv mirakler - en gård som er tjue sekker bak, redder
        // ingen nabo, og det skal den heller ikke.
        { forrad: { korn: 20, kjott: 0, dyr: 6, aaker: 0 } }
    );

    await apneBua(page);
    await klikk(page, 'La året gå videre');
    await page.waitForTimeout(1200);
    const s = await tilstand(page);
    sjekk('naboætta betaler tilbake', s?.flagg['k2-saebo-betalte-tilbake'] === true);
    sjekk('med mer enn de fikk', s?.forrad.korn === 32, `korn ${s?.forrad.korn}`);
    sjekk('gjengaven er forstått', s?.begreper?.gjengave === 'forstatt');
    sjekk('og det var gaven som berget vinteren', s?.flagg['k2-stod-vinteren'] === true);
    await page.close();
}

// ── Økt 3: sent sådd er ikke det samme ─────────────────────────────────────
{
    const { page } = await gaarden({ klokke: { aar: 872, dag: 22 } });
    await apneBua(page);
    await klikk(page, 'Så åtte sekker');
    await page.waitForTimeout(700);
    const s = await tilstand(page);
    sjekk(
        'sent sådd korn rekker ikke å modne',
        s?.forrad.aaker === 12,
        `åker ${s?.forrad.aaker} etter såing på dag 22`
    );
    sjekk('og det er ført som sent', s?.flagg['k2-saadde-tidlig'] === false);
    await page.close();
}

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
