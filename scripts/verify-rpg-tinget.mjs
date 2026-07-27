// Fører en drapssak på tinget, gjennom en ekte nettleser.
//
//   npm run dev                          # i et annet skall
//   node scripts/verify-rpg-tinget.mjs
//
// Sakens fire trinn (blueprint §7.2), og det som gjør hver av dem til fagstoff:
//
//   1. **Lysingen.** Innen ett døgn er det drap. Etterpå er det mord, og mord
//      kan ikke bøtes. Spillet varsler ikke - fristen står på steinen ved
//      tingbålet, og Torgeir sier den.
//   2. **Vitnene.** Kåre står i lista og kan ikke velges, fordi han er ufri.
//      Det er den hardeste setningen i kapittelet, og den skal *stå der* -
//      ikke være utelatt.
//   3. **Hjemmelen.** Feil hjemmel taper saken selv om hun har rett i sak.
//   4. **Dommen.** Tre poeng frikjenner, og regnestykket står framme mens hun
//      velger.

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

/** Gaute er felt, og saken står. `dag` avgjør om fristen er ute. */
const SAK = (skjeddeDag) => ({
    id: 'sak-gaute',
    gjerning: 'drap',
    gjerningsmann: 'Åsa Torsteinsdotter',
    offer: 'Gaute Gråkappe',
    offersAett: 'hovda',
    offersStand: 'hauld',
    lyst: false,
    skjeddeDag,
    vitner: [],
    anfort: null,
    dom: 'ubehandlet',
});

async function okt({ dag = 66, skjeddeDag = 65, aere = 55, saebo = 0 } = {}) {
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
                                steg: [
                                    'k2-noklene',
                                    'k2-vaaronn',
                                    'k2-kornet',
                                    'k2-hosten',
                                    'k2-angrepet',
                                    'k2-sak-reist',
                                ],
                                klokke: { aar: 872, dag },
                                saker: [SAK(skjeddeDag)],
                                aetter: { saebo: { velvilje: saebo, uoppgjort: 0 } },
                                flagg: { 'k2-drepte-gaute': true },
                            },
                            kapittelState: { aere, forrad: { korn: 40, kjott: 4, dyr: 6, aaker: 0 } },
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
            ? { saker: s.saker, aere: s.aere, fredlos: s.fredlos, forrad: s.forrad, begreper: s.begreper }
            : null;
    });

const klikk = async (page, tekst) => {
    await page.getByRole('button', { name: tekst, exact: false }).first().click();
    await page.waitForTimeout(420);
};

/** Går til tingbålet og fram på vollen. */
async function tilTinget(page) {
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const mal = scene?.samhandling?.mal('landemerke', 'tingvollen-872');
        if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
    });
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(150);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
    await klikk(page, 'Gå fram på vollen');
    await page.waitForTimeout(600);
}

// ── Økt 1: ført godt ───────────────────────────────────────────────────────
{
    const { page, konsollfeil } = await okt({ saebo: 45 });

    // Steinen ved bålet skal si fristen, uten at spillet varsler om den.
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const mal = scene?.samhandling?.mal('landemerke', 'tingvollen-872');
        if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
    });
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(150);
    await page.keyboard.up('e');
    await page.waitForTimeout(700);
    const steinen = (await page.textContent('body')) ?? '';
    sjekk('fristen står på steinen ved bålet', steinen.includes('Drap skal lysast same døgn'));
    await klikk(page, 'Gå fram på vollen');
    await page.waitForTimeout(600);

    sjekk('tinget er satt', (await page.locator('[data-prove="tingsak"]').count()) === 1);

    // 1. Lysingen
    await klikk(page, 'Jeg drepte Gaute Gråkappe');
    await page.waitForTimeout(500);
    sjekk('drapet er lyst', (await tilstand(page))?.saker?.[0]?.lyst === true);

    // 2. Vitnene
    const kaare = await page.getAttribute('[data-prove="vitne-kaare"]', 'data-kan');
    sjekk('trellen står i lista, men kan ikke vitne', kaare === 'false');
    const kaareTekst = await page.textContent('[data-prove="vitne-kaare"]');
    sjekk('og grunnen står der', kaareTekst.includes('Ufri'), kaareTekst.replace(/\s+/g, ' ').trim().slice(0, 80));
    sjekk(
        'naboen kom fordi hun skylder deg noe',
        (await page.getAttribute('[data-prove="vitne-vigdis"]', 'data-kan')) === 'true'
    );
    await page.screenshot({ path: `${UT}/rpg-ting-vitner.png` });
    await page.click('[data-prove="vitne-torgeir"]');
    await page.waitForTimeout(300);
    await klikk(page, 'Kall vitnet');
    await page.waitForTimeout(400);

    // 3. Hjemmelen
    await klikk(page, 'Han kom med våpen på min gård');
    await page.waitForTimeout(500);
    const fasit = (await page.textContent('[data-prove="tingsak"]')) ?? '';
    sjekk('lovsigemannen forklarer hjemmelen', fasit.includes('Det er hjemmelen'));
    // Hjemmel (2) + vitne (1) + et navn folk kjenner (1). Tre frikjenner.
    const poeng = Number(await page.getAttribute('[data-prove="sakspoeng"]', 'data-poeng'));
    sjekk('saken bærer', poeng >= 3, `${poeng} poeng`);

    // 4. Dommen
    await klikk(page, 'La tinget dømme');
    await klikk(page, 'Hør dommen');
    await page.waitForTimeout(900);
    const s = await tilstand(page);
    sjekk('hun blir frikjent', s?.saker?.[0]?.dom === 'frikjent', s?.saker?.[0]?.dom);
    sjekk('æren steg', (s?.aere ?? 0) > 55, `ære ${s?.aere}`);
    sjekk('mannebot er forstått', s?.begreper?.mannebot === 'forstatt');
    sjekk('kornet er urørt', s?.forrad?.korn === 40, `korn ${s?.forrad?.korn}`);
    const dom = (await page.textContent('body')) ?? '';
    sjekk('dommen sies fram', dom.includes('vernet ditt eget hus'));
    await page.screenshot({ path: `${UT}/rpg-ting-dom.png` });
    sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));
    await page.close();
}

// ── Økt 2: rett i sak, feil hjemmel ────────────────────────────────────────
{
    const { page } = await okt({ aere: 40 });
    await tilTinget(page);
    await klikk(page, 'Jeg drepte Gaute Gråkappe');
    await klikk(page, 'Før saken uten vitner');
    await klikk(page, 'Gaute Gråkappe var en dårlig mann');
    await page.waitForTimeout(400);
    const fasit = (await page.textContent('[data-prove="tingsak"]')) ?? '';
    sjekk(
        'feil hjemmel forklares, ikke bare avvises',
        fasit.includes('Loven spør ikke hva slags mann han var')
    );
    await klikk(page, 'La tinget dømme');
    await klikk(page, 'Hør dommen');
    await page.waitForTimeout(900);
    const s = await tilstand(page);
    sjekk('saken bar ikke, og boten settes', s?.saker?.[0]?.dom === 'bot', s?.saker?.[0]?.dom);
    sjekk('boten går fra bua', s?.forrad?.korn === 28, `korn ${s?.forrad?.korn}`);
    sjekk('men hun er ikke fredløs', s?.fredlos !== true);
    await page.close();
}

// ── Økt 3: døgnet er ute ───────────────────────────────────────────────────
{
    const { page } = await okt({ dag: 70, skjeddeDag: 65 });
    await tilTinget(page);
    sjekk('fristen er ute', (await page.locator('[data-prove="for-sent"]').count()) === 1);
    const tekst = (await page.textContent('[data-prove="tingsak"]')) ?? '';
    sjekk('og det sies rett ut hva det er nå', tekst.includes('Det er et mord'));
    await klikk(page, 'Gå fram på vollen likevel');
    await klikk(page, 'Hør dommen');
    await page.waitForTimeout(900);
    const s = await tilstand(page);
    sjekk('mord kan ikke bøtes', s?.saker?.[0]?.dom === 'fredlos', s?.saker?.[0]?.dom);
    sjekk('hun er fredløs', s?.fredlos === true);
    sjekk('og det er ikke game over', (await page.locator('canvas').count()) === 1);
    await page.screenshot({ path: `${UT}/rpg-ting-fredlos.png` });
    await page.close();
}

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
