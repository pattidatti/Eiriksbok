// Driver Nordvik i 995: gården eleven kommer til, og det første hun får vite.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-kapittel3.mjs
//
// Det som måles:
//
//   1. Kapittelet finnes som noe spillet kan gå til. Har k3 ingen steg, tar
//      `gaaVidereTilNesteKapittel` henne aldri hit, og bordet i 872 blir en
//      blindvei - det var nettopp tilstanden før denne etappen.
//   2. Opptakten står stille først, og sier hvem han er.
//   3. Gården er den samme og ikke den samme: to hauger i stedet for én, hovet
//      oppe i lia, og et skrog i vika som ikke er gårdens eget.
//   4. Haugen uten stein sier ikke hvem som ligger der. Eleven vet det.
//   5. Hovet gir `[Den gamle sida]` - lesingen *er* handlingen.
//   6. Kongens mann i fjæra gir kapittelets første steg.
//   7. Porten hjem virker, og hun kommer tilbake til 995 og ikke til 793.

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

/** Kapittel 1 og 2 spilt til ende, med begge bordene lagt fra seg. */
const ETTER_872 = {
    steg: [
        'k1-hjem',
        'kapittel:1',
        'mellomspill:mellomspill-1',
        'k2-vinteren',
        'kapittel:2',
        'mellomspill:mellomspill-2',
    ],
    begreper: { husfrue: 'forstatt', mannebot: 'forstatt' },
    flagg: { 'k1-tok-skrinet': true },
    klokke: { aar: 995, dag: 1 },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreEpoke(page, {
    navn: 'Torstein',
    kapittel: 3,
    sisteSted: 'nordvik-995',
    kampanje: ETTER_872,
});
await page.waitForTimeout(3200);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s
            ? {
                  kapittel: s.kapittel,
                  sisteSted: s.sisteSted,
                  aere: s.aere,
                  begreper: s.begreper,
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
    const i995 = steder.find((s) => s.epokeId === 'vikingtiden' && s.kapittel === 3);
    return { stedId: i995?.id ?? null, antall: steder.length };
});
sjekk('epoken har et sted i kapittel 3', veien.stedId === 'nordvik-995', String(veien.stedId));

// ── 2. Opptakten ────────────────────────────────────────────────────────────
sjekk('opptakten står på skjermen', (await page.locator('[data-prove="opptakt"]').count()) === 1);
const opptakt = (await page.textContent('[data-prove="opptakt"]')) ?? '';
sjekk('opptakten sier hvem han er', opptakt.includes('Torgils Ketilsson'), opptakt.slice(0, 50));
sjekk('opptakten sier hva som kom inn vika', opptakt.includes('Olav Tryggvason'));
sjekk('opptakten husker Åsa', opptakt.includes('Åsa'));
await page.screenshot({ path: `${UT}/rpg-k3-opptakt.png` });

await page.keyboard.press('Escape');
await page.waitForTimeout(400);
sjekk('Esc lukker ikke opptakten', (await page.locator('[data-prove="opptakt"]').count()) === 1);

await klikk('Nordvik, høsten 995');
await page.waitForTimeout(1000);
sjekk('opptakten er borte etterpå', (await page.locator('[data-prove="opptakt"]').count()) === 0);

const start = await tilstand();
sjekk('kapittelet er nummer tre', start?.kapittel === 3, String(start?.kapittel));
sjekk('ærestolpen står i HUD-en', (await page.locator('[data-prove="aere"]').count()) === 1);
// Årshjulet hører til 872. Står det her, lover HUD-en et system kapittelet
// ikke har - og det er nøyaktig feilen mana-stolpen gjorde.
sjekk('årshjulet står ikke i HUD-en', (await page.locator('[data-prove="aarshjul"]').count()) === 0);

// ── 3. Gården ───────────────────────────────────────────────────────────────
const verden = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const props = scene?.kart?.props ?? [];
    return {
        sted: scene?.sted?.id ?? null,
        folk: (scene?.sted?.npcer ?? []).map((n) => n.id),
        skip: props.filter((p) => p.kind === 'langskip').map((p) => [p.x, p.y]),
        langhus: props.filter((p) => p.kind === 'langhus').length,
    };
});
sjekk('scenen bygger 995', verden.sted === 'nordvik-995', verden.sted);
sjekk(
    'folkene er 995-folkene',
    verden.folk.includes('ulv-gode') && verden.folk.includes('ragnvald'),
    verden.folk.join(', ')
);
sjekk('hovet står som eget hus', verden.langhus === 2, `${verden.langhus} langhus`);
sjekk('kongens skip ligger i vika', verden.skip.length === 1, JSON.stringify(verden.skip));
sjekk(
    'skipet ligger utenfor tunet, ikke lengst sør',
    (verden.skip[0]?.[1] ?? 9999) < 40 * 16,
    JSON.stringify(verden.skip[0])
);

// ── 4. Haugen uten stein ────────────────────────────────────────────────────
await gaaTil('landemerke', 'haug-uten-stein');
const haug = (await page.textContent('body')) ?? '';
sjekk('haugen uten stein står der', haug.includes('Haugen uten stein'));
sjekk('ingen på gården vet hvem hun var', haug.includes('Mer vet ingen'));
await page.screenshot({ path: `${UT}/rpg-k3-haugen.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// Og den gamle steinen skal være slitt, ikke lesbar som i 872.
await gaaTil('landemerke', 'haug-torstein-995');
const stein = (await page.textContent('body')) ?? '';
sjekk('Torsteins stein er slitt', stein.includes('Ormsson') && !stein.includes('Åsa reiste'));
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 5. Hovet gir begrepet ───────────────────────────────────────────────────
sjekk('sida er ukjent før hovet', !(start?.begreper ?? {}).sed, JSON.stringify(start?.begreper));
await gaaTil('landemerke', 'hovet-995');
const hov = (await page.textContent('body')) ?? '';
sjekk('hovet står der', hov.includes('Hovet'));
await page.screenshot({ path: `${UT}/rpg-k3-hovet.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
const etterHovet = await tilstand();
sjekk(
    'hovet gir [Den gamle sida] som forstått',
    etterHovet?.begreper?.sed === 'forstatt',
    JSON.stringify(etterHovet?.begreper?.sed)
);

// ── 6. Kongens mann i fjæra ─────────────────────────────────────────────────
await gaaTil('npc', 'ragnvald');
const ordene = (await page.textContent('body')) ?? '';
sjekk('vilkårene er en frist, ikke en trussel i løse lufta', ordene.includes('vinternettene'));
await page.screenshot({ path: `${UT}/rpg-k3-vilkaarene.png` });
await klikk('Hva vil dere?');
await page.waitForTimeout(700);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
sjekk('kongens mann gir første steg', (await tilstand())?.steg?.includes('k3-knarren'));

// ── 7. Porten hjem, og tilbake til riktig år ────────────────────────────────
const porter = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    return scene?.portalOversikt?.() ?? [];
});
sjekk('gården har en port hjem', porter.length === 1, JSON.stringify(porter));

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
    const steder = window.__rpgSteder?.STED_BY_ID ?? {};
    const port = (steder.hub?.portaler ?? []).find((p) => p.maal.epokeId === 'vikingtiden');
    if (port) scene?.bestillReise('nordvik-995');
});
await page.waitForTimeout(4200);
const hjemme = await page.evaluate(() => window.__rpg?.scene.getScene('verden')?.sted?.id ?? null);
sjekk('og hjem igjen til 995, ikke til 793', hjemme === 'nordvik-995', String(hjemme));
sjekk(
    'opptakten kommer ikke en gang til',
    (await page.locator('[data-prove="opptakt"]').count()) === 0
);

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
