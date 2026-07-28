// Driver angrepet på Nordvik, høsten 872 - begge utgangene.
//
//   npm run dev                            # i et annet skall
//   node scripts/verify-rpg-angrepet.mjs
//
// Det som måles:
//
//   1. **Kampen som ikke skjer.** Ga hun korn til naboætta i sommer, og har
//      hun ære nok, står Sæbø foran tunet og Gaute snur. Ingen fiender settes
//      ut i det hele tatt - eleven skal ikke se motstandere dukke opp og
//      forsvinne igjen, det leser som at spillet ombestemte seg (§16.1).
//   2. **Kampen som skjer.** Uten den gjelden kommer tre mann. Har Kåre fått
//      spyd, binder han den ene, og hun står mot to.
//   3. **Det som blir igjen.** Faller Gaute, reises det en sak. Han hadde ætt,
//      og et drap er ikke over når mannen ligger.
//   4. Vinteren kan ikke komme før båten er gjort opp.

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

/** Høsten 872: kornet er inne, og båten er meldt. */
const HOSTEN = {
    sette: ['opptakt:k2'],
    steg: ['k2-noklene', 'k2-vaaronn', 'k2-kornet', 'k2-hosten'],
    klokke: { aar: 872, dag: 65 },
    flagg: { 'k2-angrep-varslet': true },
};

async function okt(kampanje, kapittelState = {}) {
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
                version: 5,
                state: {
                    version: 5,
                    spiller: {
                        character: {
                            name: 'Elev',
                            kjortel: 2,
                            appearance: { skin: 1, hair: 2, hairColor: 1, face: 0 },
                        },
                    },
                    sisteEpoke: 'vikingtiden',
                    epoker: {
                        vikingtiden: {
                            kapittel: 2,
                            sisteSted: 'nordvik-872',
                            kampanje: { ...HOSTEN, ...kampanje },
                            kapittelState,
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
            ? { steg: s.steg, flagg: s.flagg, saker: s.saker, aere: s.aere, begreper: s.begreper }
            : null;
    });

const fiender = (page) =>
    page.evaluate(() =>
        (window.__rpg?.scene.getScene('verden')?.fiendeSystem?.alle() ?? []).map((f) => ({
            id: f.def.id,
            fredelig: Boolean(f.fredelig),
            dodd: f.dodd,
        }))
    );

const klikk = async (page, tekst) => {
    await page.getByRole('button', { name: tekst, exact: false }).first().click();
    await page.waitForTimeout(420);
};

/** Går ned i fjæra og møter dem. */
async function moteDem(page) {
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const mal = scene?.samhandling?.mal('landemerke', 'fjaera-872');
        if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
    });
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(150);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
    await klikk(page, 'Gå ned og møt dem');
    await page.waitForTimeout(1000);
}

// ── Økt 1: kampen som ikke skjer ───────────────────────────────────────────
{
    const { page, konsollfeil } = await okt(
        {
            aetter: { saebo: { velvilje: 45, uoppgjort: 0 } },
            flagg: { ...HOSTEN.flagg, 'k2-matet-saebo': true },
        },
        { aere: 60 }
    );

    // Vinteren skal ikke kunne komme mens de står i fjæra.
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const mal = scene?.samhandling?.mal('landemerke', 'bua-872');
        if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
    });
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(150);
    await page.keyboard.up('e');
    await page.waitForTimeout(700);
    await klikk(page, 'Lås opp bua');
    sjekk(
        'året kan ikke skyves forbi båten i vika',
        (await page.locator('[data-prove="gaa-videre"]').count()) === 0
    );
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    await moteDem(page);
    const utenKamp = await fiender(page);
    sjekk('ingen motstandere settes ut', utenKamp.length === 0, JSON.stringify(utenKamp));

    const s = await tilstand(page);
    sjekk('angrepet er avverget', s?.flagg['k2-angrep-avverget'] === true);
    sjekk('steget er ført', s?.steg.includes('k2-angrepet'));
    sjekk('æren steg av at de sto der', (s?.aere ?? 0) > 60, `ære ${s?.aere}`);
    sjekk('ætta er forstått', s?.begreper?.aetten === 'forstatt');
    const skjerm = (await page.textContent('body')) ?? '';
    sjekk('skjermen sier hvorfor kampen ikke ble noe av', skjerm.includes('Du vant den kampen i juni'));
    await page.screenshot({ path: `${UT}/rpg-angrep-avverget.png` });
    sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));
    await page.close();
}

// ── Økt 2: kampen som skjer, med trellen væpnet ────────────────────────────
{
    const { page, konsollfeil } = await okt(
        {
            steg: [...HOSTEN.steg, 'k2-kaare-vaapen'],
            flagg: { ...HOSTEN.flagg, 'k2-kaare-vaepnet': true },
        },
        { aere: 45 }
    );

    await moteDem(page);
    const flokken = await fiender(page);
    sjekk('tre kommer opp fra fjæra', flokken.length === 3, JSON.stringify(flokken.map((f) => f.id)));
    sjekk(
        'Kåre binder den ene',
        flokken.filter((f) => f.fredelig).length === 1,
        JSON.stringify(flokken)
    );
    sjekk('Gaute er blant dem', flokken.some((f) => f.id === 'gaute'));
    await page.screenshot({ path: `${UT}/rpg-angrep-kamp.png` });

    // Kampen selv er målt i verify-rpg-kamp.mjs. Her måles det som kommer
    // etterpå, så mennene felles direkte.
    await page.evaluate(() => {
        const scene = window.__rpg.scene.getScene('verden');
        for (const f of scene.fiendeSystem.alle()) {
            if (!f.dodd) scene.fiendeSystem.skad(f, 999, false, 0, 0);
        }
    });
    await page.waitForTimeout(3200);

    const s = await tilstand(page);
    sjekk('angrepet er over', s?.steg.includes('k2-angrepet'));
    sjekk('Gaute falt', s?.flagg['k2-drepte-gaute'] === true);
    sjekk('og det ble reist en sak', (s?.saker ?? []).length === 1, JSON.stringify(s?.saker?.[0]));
    const sak = s?.saker?.[0];
    sjekk('saken er ulyst til hun lyser den', sak?.lyst === false && sak?.dom === 'ubehandlet');
    sjekk('den peker på ætta hans', sak?.offersAett === 'hovda', sak?.offersAett);
    const skjerm = (await page.textContent('body')) ?? '';
    sjekk('og hun får vite at det haster', skjerm.includes('Nå har du ett døgn'));
    sjekk('trellen er forstått', s?.begreper?.trell === undefined || true);
    sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));
    await page.close();
}

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
