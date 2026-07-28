// Driver leiren ved Riccall: morgenen før Stanford bru, og valget om brynja.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-kapittel5.mjs
//
// Det som måles:
//
//   1. Kapittelet finnes som noe spillet kan gå til. Har k5 ingen steg, tar
//      `gaaVidereTilNesteKapittel` henne aldri hit, og bordet i 1030 blir en
//      blindvei.
//   2. Opptakten står stille først, og sier hvem han er, hvorfor han er i
//      England, og at det ikke skal stå noe slag i dag.
//   3. Leiren er en leir: telt, flåte og en vei østover. Ingen ærestolpe og
//      ingen årshjul - kapittelet varer én dag, og Orm kan ikke flytte æren
//      sin i en fremmed konges hær.
//   4. Kista leser 1030. Var faren femten i rekka på Stiklestad, eller ble
//      han hjemme i høyet? Gården husker det, og brynja kommer fra ham.
//   5. Tostig gir dagen, og med den `[Tronkravet i 1066]`.
//   6. Brynja kan ikke avgjøres før dagen er kjent, begge svarene setter hvert
//      sitt flagg, og begge gir `[Etterpåklokskap]` som *hørt* - ikke forstått.
//      Det siste er regelen som ryker først: hun har ikke sett hva valget ble
//      til ennå.
//   7. Porten hjem virker, og hun kommer tilbake til 1066 og ikke til 1030.

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

/** Kapittel 1-4 spilt til ende, med alle fire bordene lagt fra seg. */
const ETTER_1030 = {
    steg: [
        'k1-hjem',
        'kapittel:1',
        'mellomspill:mellomspill-1',
        'k2-vinteren',
        'kapittel:2',
        'mellomspill:mellomspill-2',
        'k3-valget',
        'kapittel:3',
        'mellomspill:mellomspill-3',
        'k4-slaget',
        'kapittel:4',
        'mellomspill:mellomspill-4',
    ],
    begreper: { skjoldborg: 'forstatt', helgenkaaring: 'forstatt' },
    // Sønnen sto i rekka den gangen. Kista skal si det.
    flagg: { 'k4-sonnen-med': true },
    klokke: { aar: 1066, dag: 1 },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, {
    navn: 'Torstein',
    kapittel: 5,
    sisteSted: 'riccall',
    kampanje: ETTER_1030,
});
await page.waitForTimeout(3200);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s
            ? {
                  kapittel: s.kapittel,
                  sisteSted: s.sisteSted,
                  begreper: s.begreper,
                  flagg: s.flagg,
                  steg: s.steg,
              }
            : null;
    });

const klikk = async (tekst) => {
    const knapp = page.getByRole('button', { name: tekst });
    await knapp.first().click();
    await page.waitForTimeout(340);
};

/** Stiller eleven inntil noe på kartet og trykker E. */
const gaaTil = async (type, id) => {
    await page.evaluate(
        ([t, i]) => {
            const scene = window.__rpg?.scene.getScene('verden');
            const mal = scene?.samhandling?.mal(t, i);
            if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
        },
        [type, id]
    );
    await page.waitForTimeout(450);
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(800);
};

// ── 1. Kapittelet er noe spillet kan gå til ─────────────────────────────────
const veien = await page.evaluate(() => {
    const steder = window.__rpgSteder?.STEDER ?? [];
    const i1066 = steder.find((s) => s.epokeId === 'vikingtiden' && s.kapittel === 5);
    return { stedId: i1066?.id ?? null };
});
sjekk('epoken har et sted i kapittel 5', veien.stedId === 'riccall', String(veien.stedId));

// ── 2. Opptakten ────────────────────────────────────────────────────────────
sjekk('opptakten står på skjermen', (await page.locator('[data-prove="opptakt"]').count()) === 1);
const opptakt = (await page.textContent('[data-prove="opptakt"]')) ?? '';
sjekk('opptakten sier hvem han er', opptakt.includes('Orm den yngre'), opptakt.slice(0, 60));
sjekk('opptakten sier hvorfor han er i England', opptakt.includes('leidangsbudet'));
sjekk('opptakten navngir kongen', opptakt.includes('Harald Sigurdsson'));
sjekk('opptakten sier at det ikke skal stå noe slag', opptakt.includes('gisler'));
await page.screenshot({ path: `${UT}/rpg-k5-opptakt.png` });

await klikk('Ved Ouse, 25. september 1066');
await page.waitForTimeout(1000);
sjekk('opptakten er borte etterpå', (await page.locator('[data-prove="opptakt"]').count()) === 0);

const start = await tilstand();
sjekk('kapittelet er nummer fem', start?.kapittel === 5, String(start?.kapittel));
sjekk('ærestolpen står ikke i HUD-en', (await page.locator('[data-prove="aere"]').count()) === 0);
sjekk('årshjulet står ikke i HUD-en', (await page.locator('[data-prove="aarshjul"]').count()) === 0);

// ── 3. Leiren er en leir ────────────────────────────────────────────────────
const verden = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const props = scene?.kart?.props ?? [];
    return {
        sted: scene?.sted?.id ?? null,
        folk: (scene?.sted?.npcer ?? []).map((n) => n.id),
        telt: props.filter((p) => p.kind === 'telt').length,
        skip: props.filter((p) => p.kind === 'langskip').length,
        harTekstur: Boolean(scene?.textures?.exists('prop-telt')),
    };
});
sjekk('scenen bygger leiren', verden.sted === 'riccall', verden.sted);
sjekk(
    'folkene er 1066-folkene',
    verden.folk.includes('tostig') && verden.folk.includes('oystein-orre'),
    verden.folk.join(', ')
);
sjekk('teltene står på kartet', verden.telt >= 12, `${verden.telt}`);
sjekk('teltet har en tekstur å tegnes med', verden.harTekstur);
sjekk('flåten ligger langs stranda', verden.skip >= 10, `${verden.skip}`);
await page.screenshot({ path: `${UT}/rpg-k5-leiren.png` });

await gaaTil('landemerke', 'veien-ost-riccall');
const veienOst = (await page.textContent('body')) ?? '';
sjekk('veien sier hvor langt det er', veienOst.includes('Fem timers gange'));
sjekk(
    'og hvorfor avstanden betyr noe',
    veienOst.includes('ingen snur for noe de har glemt igjen')
);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 4. Kista, og det den husker fra 1030 ────────────────────────────────────
await gaaTil('landemerke', 'kista-riccall');
const kista = (await page.textContent('body')) ?? '';
sjekk('kista har brynja i seg', kista.includes('Tjue tusen ringer'));
sjekk('andre legger sin igjen', kista.includes('legger brynja ned'));
sjekk('kista husker Stiklestad', kista.includes('femten da han sto i rekka'));
sjekk('og ikke det motsatte', !kista.includes('ble hjemme i høyet'));
await page.screenshot({ path: `${UT}/rpg-k5-kista.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 5. Tostig gir dagen ─────────────────────────────────────────────────────
sjekk(
    'tronkravet er ukjent før Tostig',
    !(start?.begreper ?? {}).tronkravet,
    JSON.stringify(start?.begreper?.tronkravet)
);
await gaaTil('npc', 'tostig');
const tostig = (await page.textContent('body')) ?? '';
sjekk('dagen er en avtale, ikke et slag', tostig.includes('ingenting som skal skje'));
await klikk('Spør Tostig ut');
const utspurt = (await page.textContent('body')) ?? '';
sjekk('han sier hvorfor tre menn krevde England', utspurt.includes('Vilhelm av Normandie'));
sjekk(
    'og det gir [Tronkravet i 1066] som hørt',
    (await tilstand())?.begreper?.tronkravet === 'hort',
    JSON.stringify((await tilstand())?.begreper?.tronkravet)
);
await page.screenshot({ path: `${UT}/rpg-k5-tostig.png` });
await klikk('Hva skal skje i dag?');
await page.waitForTimeout(700);
const etterTostig = await tilstand();
sjekk('dagen gir første steg', etterTostig?.steg?.includes('k5-leiren'));

// ── 6. Brynja ───────────────────────────────────────────────────────────────
await gaaTil('npc', 'oystein-orre');
const oystein = (await page.textContent('body')) ?? '';
sjekk('ordren kommer fra kongen', oystein.includes('Kongen har sagt det samme'));
sjekk(
    'begge svarene står åpne',
    oystein.includes('Jeg tar den med') && oystein.includes('Den blir liggende')
);
await page.screenshot({ path: `${UT}/rpg-k5-brynja.png` });
await klikk('Den blir liggende');
await page.waitForTimeout(700);
const etterBrynja = await tilstand();
sjekk('valget er tatt', etterBrynja?.steg?.includes('k5-brynja'));
sjekk('flagget står', etterBrynja?.flagg?.['k5-brynja-igjen'] === true);
sjekk('og det motsatte står ikke', !etterBrynja?.flagg?.['k5-brynja-med']);
sjekk(
    'etterpåklokskap er hørt, ikke forstått',
    etterBrynja?.begreper?.etterpaaklokskap === 'hort',
    JSON.stringify(etterBrynja?.begreper?.etterpaaklokskap)
);

// Og valget kan ikke tas om igjen.
await gaaTil('npc', 'oystein-orre');
const igjen = (await page.textContent('body')) ?? '';
sjekk('valget kan ikke tas om igjen', !igjen.includes('Jeg tar den med'));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// ── 7. Porten hjem, og tilbake til riktig år ────────────────────────────────
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.bestillReise('hub');
});
await page.waitForTimeout(4400);
const iHallen = await page.evaluate(
    () => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null
);
sjekk('hun kommer til hallen', iHallen === 'hub', String(iHallen));

await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.bestillReise('riccall');
});
await page.waitForTimeout(4400);
const tilbake = await page.evaluate(() => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null);
sjekk('og tilbake til leiren', tilbake === 'riccall', String(tilbake));
sjekk(
    'opptakten kommer ikke en gang til',
    (await page.locator('[data-prove="opptakt"]').count()) === 0
);
await page.screenshot({ path: `${UT}/rpg-k5-tilbake.png` });

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
