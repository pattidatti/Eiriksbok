// Driver Nordvik i 1030: gården som er kristen fra før, og budstikka.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-kapittel4.mjs
//
// Det som måles:
//
//   1. Kapittelet finnes som noe spillet kan gå til. Har k4 ingen steg, tar
//      `gaaVidereTilNesteKapittel` henne aldri hit, og bordet i 995 blir en
//      blindvei.
//   2. Opptakten står stille først, og sier hvem han er - og at han er født
//      etter kirken.
//   3. Kirken står der hovet sto, på samme rute, med tak og kors.
//   4. Steinen på haugen er nesten borte. Tredje gang eleven ser den.
//   5. Bård gir budstikka, og budstikka gir `[Bondehæren]` som forstått.
//   6. Sønnen kan ikke svares før budstikka er tatt imot, og begge svarene
//      setter hvert sitt flagg.
//   7. Naustet fører hæren ut: knappen står framme når valget er tatt, og
//      reisen ender på sletta.
//   8. Porten hjem virker, og hun kommer tilbake til 1030 og ikke til 995.

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

/** Kapittel 1-3 spilt til ende, med alle tre bordene lagt fra seg. */
const ETTER_995 = {
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
    ],
    begreper: { sed: 'forstatt', holmgang: 'forstatt', kristningen: 'forstatt' },
    // Faren sa nei den gangen. Kirken skal si det på veggen sin.
    flagg: { 'k3-nektet': true },
    klokke: { aar: 1030, dag: 1 },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, {
    navn: 'Torstein',
    kapittel: 4,
    sisteSted: 'nordvik-1030',
    kampanje: ETTER_995,
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
    const i1030 = steder.find((s) => s.epokeId === 'vikingtiden' && s.kapittel === 4);
    return { stedId: i1030?.id ?? null };
});
sjekk('epoken har et sted i kapittel 4', veien.stedId === 'nordvik-1030', String(veien.stedId));

// ── 2. Opptakten ────────────────────────────────────────────────────────────
sjekk('opptakten står på skjermen', (await page.locator('[data-prove="opptakt"]').count()) === 1);
const opptakt = (await page.textContent('[data-prove="opptakt"]')) ?? '';
sjekk('opptakten sier hvem han er', opptakt.includes('Halvard'), opptakt.slice(0, 60));
sjekk('opptakten sier at han er født etter kirken', opptakt.includes('året etter at kirken'));
sjekk('opptakten navngir kongen', opptakt.includes('Olav Haraldsson'));
await page.screenshot({ path: `${UT}/rpg-k4-opptakt.png` });

await klikk('Nordvik, juli 1030');
await page.waitForTimeout(1000);
sjekk('opptakten er borte etterpå', (await page.locator('[data-prove="opptakt"]').count()) === 0);

const start = await tilstand();
sjekk('kapittelet er nummer fire', start?.kapittel === 4, String(start?.kapittel));
sjekk('ærestolpen står i HUD-en', (await page.locator('[data-prove="aere"]').count()) === 1);
sjekk('årshjulet står ikke i HUD-en', (await page.locator('[data-prove="aarshjul"]').count()) === 0);

// ── 3. Gården: kirken på hovets grunn ───────────────────────────────────────
const verden = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const props = scene?.kart?.props ?? [];
    return {
        sted: scene?.sted?.id ?? null,
        folk: (scene?.sted?.npcer ?? []).map((n) => n.id),
        kirker: props.filter((p) => p.kind === 'kirke').map((p) => [p.x / 16, p.y / 16]),
        langhus: props.filter((p) => p.kind === 'langhus').length,
        harTekstur: Boolean(scene?.textures?.exists('prop-kirke')),
    };
});
sjekk('scenen bygger 1030', verden.sted === 'nordvik-1030', verden.sted);
sjekk(
    'folkene er 1030-folkene',
    verden.folk.includes('baard-saebo') && verden.folk.includes('skofte'),
    verden.folk.join(', ')
);
sjekk('kirken står på kartet', verden.kirker.length === 1, JSON.stringify(verden.kirker));
sjekk(
    'kirken står der hovet sto',
    Math.floor(verden.kirker[0]?.[0] ?? -1) === 30 && Math.floor(verden.kirker[0]?.[1] ?? -1) === 14,
    JSON.stringify(verden.kirker[0])
);
sjekk('hovet er borte - bare gårdens eget langhus står', verden.langhus === 1, `${verden.langhus}`);
sjekk('kirken har en tekstur å tegnes med', verden.harTekstur);

await gaaTil('landemerke', 'kirken-1030');
const kirke = (await page.textContent('body')) ?? '';
sjekk('kirken sier at den står på hovets grunn', kirke.includes('der hovet sto'));
sjekk('gården husker hva faren svarte i 995', kirke.includes('sa nei den gangen'));
await page.screenshot({ path: `${UT}/rpg-k4-kirken.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 4. Steinen, tredje gang ─────────────────────────────────────────────────
await gaaTil('landemerke', 'haug-torstein-1030');
const stein = (await page.textContent('body')) ?? '';
sjekk(
    'steinen er nesten borte',
    stein.includes('denne st') && !stein.includes('Ormsson. Han bygde'),
    stein.slice(0, 40)
);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 5. Budstikka ────────────────────────────────────────────────────────────
sjekk(
    'bondehæren er ukjent før Bård',
    !(start?.begreper ?? {}).bondehaeren,
    JSON.stringify(start?.begreper?.bondehaeren)
);
await gaaTil('npc', 'baard-saebo');
const bard = (await page.textContent('body')) ?? '';
sjekk('budstikka er et krav, ikke en nyhet', bard.includes('Du skal møte der'));
await page.screenshot({ path: `${UT}/rpg-k4-budstikka.png` });
await klikk('Ta imot budstikka');
await page.waitForTimeout(700);
const etterBard = await tilstand();
sjekk('budstikka gir første steg', etterBard?.steg?.includes('k4-budstikka'));
sjekk(
    'og [Bondehæren] som forstått',
    etterBard?.begreper?.bondehaeren === 'forstatt',
    JSON.stringify(etterBard?.begreper?.bondehaeren)
);

// ── 6. Sønnen ───────────────────────────────────────────────────────────────
await gaaTil('npc', 'aasmund');
const gutten = (await page.textContent('body')) ?? '';
sjekk('sønnen ber om å få bli med', gutten.includes('Jeg går ikke fra deg'));
sjekk('begge svarene står åpne', gutten.includes('Han blir med') && gutten.includes('Han blir hjemme'));
await page.screenshot({ path: `${UT}/rpg-k4-sonnen.png` });
await klikk('Han blir med');
await page.waitForTimeout(700);
const etterSonnen = await tilstand();
sjekk('valget er tatt', etterSonnen?.steg?.includes('k4-hvem-drar'));
sjekk('flagget står', etterSonnen?.flagg?.['k4-sonnen-med'] === true);
sjekk('og det motsatte står ikke', !etterSonnen?.flagg?.['k4-sonnen-hjemme']);

// Og valget kan ikke tas om igjen.
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await gaaTil('npc', 'aasmund');
const igjen = (await page.textContent('body')) ?? '';
sjekk('valget kan ikke tas om igjen', !igjen.includes('Han blir hjemme'));
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

// ── 7. Veien ut: naustet fører til sletta ───────────────────────────────────
await gaaTil('landemerke', 'naustet-1030');
const naustet = (await page.textContent('body')) ?? '';
sjekk('naustet sier hva reisen er', naustet.includes('To dager'));
sjekk(
    'knappen står framme når valget er tatt',
    (await page.getByRole('button', { name: 'Ro ut med de andre' }).count()) === 1
);
await klikk('Ro ut med de andre');
await page.waitForTimeout(4600);
const paaSletta = await page.evaluate(
    () => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null
);
sjekk('hun kommer til Stiklestad', paaSletta === 'stiklestad', String(paaSletta));
sjekk('og å komme fram er steget', (await tilstand())?.steg?.includes('k4-veien'));
await page.screenshot({ path: `${UT}/rpg-k4-stiklestad.png` });

// ── 8. Porten hjem, og tilbake til riktig år ────────────────────────────────
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.bestillReise('nordvik-1030');
});
await page.waitForTimeout(4600);
sjekk(
    'og hun kommer hjem igjen til gården',
    (await page.evaluate(() => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null)) ===
        'nordvik-1030'
);

await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.bestillReise('hub');
});
await page.waitForTimeout(4200);
const iHallen = await page.evaluate(
    () => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null
);
sjekk('hun kommer til hallen', iHallen === 'hub', String(iHallen));

await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.bestillReise('nordvik-1030');
});
await page.waitForTimeout(4200);
const hjemme = await page.evaluate(() => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null);
sjekk('og hjem igjen til 1030', hjemme === 'nordvik-1030', String(hjemme));
sjekk(
    'opptakten kommer ikke en gang til',
    (await page.locator('[data-prove="opptakt"]').count()) === 0
);
await page.screenshot({ path: `${UT}/rpg-k4-gaarden.png` });

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
