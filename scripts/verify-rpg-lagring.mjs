// Prøver lagringen i Minnevokteren (/oving/rpg) i en ekte nettleser.
//
//   npm run dev                            # i et annet skall
//   node scripts/verify-rpg-lagring.mjs
//
// Dette er den ene delen av spillet der en feil ikke synes: en migrering som
// mister et felt gir ikke en krasj, den gir en elev som logger inn og finner at
// nivået, sølvet og de tolv oppdragene hun gjorde i går er borte. Og det er for
// sent å oppdage når hun sier fra.
//
// Derfor sås ekte lagrede spill i localStorage før siden lastes, og det som
// ligger igjen etterpå leses tilbake - både det flate i storen og det som
// faktisk står på disken.

import { chromium } from 'playwright';

const BASE = process.env.RPG_BASE ?? 'http://localhost:5173';
const NOKKEL = 'rpg-minnevokteren-v1';

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const ANSIKT = { skin: 1, hair: 2, hairColor: 1, face: 0 };
const KARAKTER = { name: 'Torstein', classId: 'vokter', appearance: ANSIKT };

const browser = await chromium.launch();

/**
 * Åpner spillet med et ferdig lagret spill i localStorage, og venter til
 * verden står. En lagring med karakter går rett forbi karakterskaperen.
 */
async function medLagring(blob) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();
    const sidefeil = [];
    page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));
    page.on('pageerror', (e) => sidefeil.push(String(e)));

    await page.addInitScript(
        ([nokkel, verdi]) => localStorage.setItem(nokkel, verdi),
        [NOKKEL, JSON.stringify(blob)]
    );
    await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
    await page.waitForSelector('canvas', { timeout: 30000 });
    await page.waitForFunction(() => Boolean(window.__rpgStore), null, { timeout: 30000 });
    return { page, ctx, sidefeil };
}

/** Det storen har i hendene nå. */
const les = (page) =>
    page.evaluate(() => {
        const s = window.__rpgStore.getState();
        return {
            navn: s.character?.name ?? null,
            epokeId: s.epokeId,
            kapittel: s.kapittel,
            sisteSted: s.sisteSted,
            xp: s.xp,
            solv: s.solv,
            riktigeSvar: s.riktigeSvar,
            quester: s.quester,
            lest: s.lest,
            bosser: s.bosser,
            spells: s.spells,
            andreEpoker: s.andreEpoker,
        };
    });

/**
 * Det som står på disken.
 *
 * `setState({})` først: zustand skriver ikke den migrerte formen tilbake av
 * seg selv, den skriver ved neste endring. Her fremtvinges den endringen uten
 * å røre en eneste verdi, så det vi leser er nøyaktig det spillet ville lagret.
 */
const lesDisk = (page) =>
    page.evaluate((nokkel) => {
        window.__rpgStore.setState({});
        return JSON.parse(localStorage.getItem(nokkel));
    }, NOKKEL);

// ── 1. Gammelt flatt spill (v3) løftes inn i epoke-navnerommet ──────────────

{
    const { page, ctx, sidefeil } = await medLagring({
        version: 3,
        state: {
            character: KARAKTER,
            xp: 120,
            hp: 44,
            mana: 12,
            solv: 37,
            sekk: ['helsedrikk'],
            utstyr: { vapen: 'jernsverd', rustning: null, amulett: null },
            spells: ['gnist'],
            quester: { 'nordvik-h1': 'ferdig' },
            questForsok: { 'nordvik-h1': 1 },
            riktigeSvar: 3,
            galeSvar: 1,
            lest: ['langhuset'],
            bosser: ['den-store-glemselen'],
            sisteSone: 'nordvik',
        },
    });

    const s = await les(page);
    sjekk('v3: karakteren følger med', s.navn === 'Torstein', s.navn);
    sjekk('v3: xp beholdes', s.xp === 120, s.xp);
    sjekk('v3: sølv beholdes', s.solv === 37, s.solv);
    sjekk('v3: oppdrag beholdes', s.quester['nordvik-h1'] === 'ferdig');
    sjekk('v3: lest landemerke beholdes', s.lest.includes('langhuset'));
    sjekk('v3: felt boss beholdes', s.bosser.includes('den-store-glemselen'));
    sjekk('v3: havner i vikingtiden', s.epokeId === 'vikingtiden', s.epokeId);
    sjekk('v3: stedet blir med', s.sisteSted === 'nordvik', s.sisteSted);

    const disk = await lesDisk(page);
    const epoke = disk.state.epoker?.vikingtiden;
    sjekk('v3: disken er versjon 4', disk.version === 4 && disk.state.version === 4);
    sjekk('v3: spilleren ligger globalt', disk.state.spiller?.character?.name === 'Torstein');
    sjekk('v3: xp ligger i kapittelState', epoke?.kapittelState?.xp === 120);
    sjekk('v3: oppdrag ligger i kampanje', epoke?.kampanje?.quester['nordvik-h1'] === 'ferdig');
    sjekk('v3: ingenting ligger flatt igjen', disk.state.xp === undefined);
    sjekk('v3: ingen feil i konsollen', sidefeil.length === 0, sidefeil[0]);
    await ctx.close();
}

// ── 2. Enda eldre spill (v1): bankoppdragene vaskes, resten står ────────────

{
    const { page, ctx } = await medLagring({
        version: 1,
        state: {
            character: KARAKTER,
            xp: 40,
            hp: 60,
            mana: 20,
            solv: 5,
            sekk: [],
            utstyr: { vapen: null, rustning: null, amulett: null },
            spells: [],
            quester: { 'nordvik-b3': 'ferdig', 'nordvik-h1': 'ferdig' },
            questForsok: { 'nordvik-b3': 1 },
            riktigeSvar: 2,
            galeSvar: 0,
            lest: [],
            bosser: [],
            sisteSone: 'nordvik',
        },
    });

    const s = await les(page);
    sjekk('v1: stokket bankoppdrag kastes', s.quester['nordvik-b3'] === undefined);
    sjekk('v1: håndskrevet oppdrag beholdes', s.quester['nordvik-h1'] === 'ferdig');
    sjekk('v1: xp overlever to migreringer', s.xp === 40, s.xp);
    await ctx.close();
}

// ── 3. En epoke eleven ikke står i skal ikke røres ──────────────────────────

{
    const gryet = {
        kapittel: 1,
        sisteSted: 'nordvik',
        kampanje: {
            quester: { 'gryet-h1': 'ferdig' },
            questForsok: {},
            riktigeSvar: 9,
            galeSvar: 0,
            lest: [],
            bosser: [],
        },
        kapittelState: {
            hp: 50,
            mana: 10,
            xp: 999,
            solv: 77,
            sekk: [],
            utstyr: { vapen: null, rustning: null, amulett: null },
            spells: [],
        },
    };
    const { page, ctx } = await medLagring({
        version: 4,
        state: {
            version: 4,
            spiller: { character: KARAKTER },
            sisteEpoke: 'vikingtiden',
            epoker: {
                vikingtiden: {
                    kapittel: 1,
                    sisteSted: 'nordvik',
                    kampanje: {
                        quester: {},
                        questForsok: {},
                        riktigeSvar: 1,
                        galeSvar: 0,
                        lest: [],
                        bosser: [],
                    },
                    kapittelState: {
                        hp: 70,
                        mana: 30,
                        xp: 120,
                        solv: 12,
                        sekk: [],
                        utstyr: { vapen: null, rustning: null, amulett: null },
                        spells: [],
                    },
                },
                gryet,
            },
        },
    });

    const s = await les(page);
    sjekk('v4: den aktive epoken pakkes ut flatt', s.xp === 120 && s.epokeId === 'vikingtiden');
    sjekk('v4: den andre epoken ligger til side', s.andreEpoker.gryet?.kapittelState.xp === 999);

    const disk = await lesDisk(page);
    sjekk(
        'v4: den andre epoken skrives tilbake urørt',
        JSON.stringify(disk.state.epoker.gryet) === JSON.stringify(gryet)
    );

    // Epokebytte: den ene legges bort hel, den andre hentes fram hel.
    const byttet = await page.evaluate(() => {
        const store = window.__rpgStore;
        store.getState().ankomSted('nordvik', 'gryet');
        const inne = store.getState();
        const ute = {
            epokeId: inne.epokeId,
            xp: inne.xp,
            solv: inne.solv,
            riktigeSvar: inne.riktigeSvar,
            lagret: inne.andreEpoker.vikingtiden?.kapittelState.xp,
        };
        store.getState().ankomSted('nordvik', 'vikingtiden');
        const tilbake = store.getState();
        return { ute, tilbake: { epokeId: tilbake.epokeId, xp: tilbake.xp } };
    });
    sjekk('bytte: den nye epoken hentes fram', byttet.ute.xp === 999 && byttet.ute.solv === 77);
    sjekk('bytte: epoke-id følger med', byttet.ute.epokeId === 'gryet', byttet.ute.epokeId);
    sjekk('bytte: den forlatte epoken legges bort hel', byttet.ute.lagret === 120);
    sjekk(
        'bytte: tilbake igjen er alt som før',
        byttet.tilbake.epokeId === 'vikingtiden' && byttet.tilbake.xp === 120
    );
    await ctx.close();
}

// ── 4. Hull i lagringen fylles i stedet for å krasje ────────────────────────
//
// Dette er fallgruven fra blueprintens §12.2: et nytt felt som bare får verdi i
// create(), blir undefined for en elev med et gammelt spill, og første .length
// krasjer det.

{
    const { page, ctx, sidefeil } = await medLagring({
        version: 4,
        state: {
            version: 4,
            spiller: { character: KARAKTER },
            sisteEpoke: 'vikingtiden',
            epoker: {
                vikingtiden: {
                    kapittel: 1,
                    sisteSted: 'nordvik',
                    kampanje: { riktigeSvar: 4 },
                    kapittelState: { xp: 88 },
                },
            },
        },
    });

    const s = await les(page);
    sjekk('hull: det som fantes står', s.xp === 88 && s.riktigeSvar === 4);
    sjekk('hull: lister blir tomme lister', Array.isArray(s.lest) && Array.isArray(s.bosser));
    sjekk('hull: besvergelser blir tom liste', Array.isArray(s.spells));
    sjekk('hull: spillet står likevel', sidefeil.length === 0, sidefeil[0]);
    await ctx.close();
}

await browser.close();

console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt i orden.');
process.exit(feil.length ? 1 : 0);
