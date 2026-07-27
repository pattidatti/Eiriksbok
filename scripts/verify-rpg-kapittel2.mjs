// Driver overgangen fra 793 til 872, og gården hun kommer til.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-kapittel2.mjs
//
// Det som måles er kapittelskiftet som helhet, ikke at et kart finnes:
//
//   1. Bordet er ryddet, og spillet tar henne videre selv. Blir hun stående i
//      793 etterpå, finnes det ingen vei inn i 872 - Orm har ikke mer å si.
//   2. Opptakten står stille først, og den kan ikke lukkes med Esc.
//   3. Kapitteltilstanden er ny (nivå, sølv, sekk), kampanjen er den samme
//      (begreper, kilder, flagg) - blueprint §12.1.
//   4. Æren begynner på arven, ikke på null.
//   5. Gården kjenner igjen 793: haugen, den tomme fjorden, og steinen som
//      sier hva hun tok med hjem.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

/** Kapittel 1 spilt til ende, med skrinet i sekken og skriptoriet urørt. */
const HJEMME = {
    steg: [
        'k1-ravn',
        'k1-skroget',
        'k1-sjosettingen',
        'k1-navigasjonen',
        'k1-stranda',
        'k1-motstanden',
        'k1-byttet',
    ],
    begreper: { klinkbygging: 'forstatt', breddegradseiling: 'forstatt' },
    flagg: { 'k1-tok-skrinet': true },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
await entreNordvik(page, 'Torstein', HJEMME);
await page.waitForTimeout(3000);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s
            ? {
                  kapittel: s.kapittel,
                  sisteSted: s.sisteSted,
                  aere: s.aere,
                  aettAere: s.aettAere,
                  xp: s.xp,
                  solv: s.solv,
                  klokke: s.klokke,
                  begreper: s.begreper,
                  flagg: s.flagg,
                  steg: s.steg,
              }
            : null;
    });

const klikk = async (tekst) => {
    const knapp = await page.$(`text=${tekst}`);
    if (!knapp) throw new Error(`fant ikke knappen «${tekst}»`);
    await knapp.click();
    await page.waitForTimeout(340);
};

const vei = async (n, videre) => {
    const valg = await page.$$('[data-prove="veiing"] button');
    if (!valg[n]) throw new Error(`veiingen hadde ikke alternativ ${n}`);
    await valg[n].click();
    await page.waitForTimeout(340);
    await klikk(videre);
};

// ── Gjennom bordet ──────────────────────────────────────────────────────────
// Eleven gir Orm svaret på hva hun tok med, og kildebordet åpner seg.
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.flyttHelt(9 * 16 + 8, 37 * 16 + 8);
});
await page.waitForTimeout(400);
await page.keyboard.down('e');
await page.waitForTimeout(160);
await page.keyboard.up('e');
await page.waitForTimeout(700);
await klikk('Fortell hva du tok med');
await page.waitForTimeout(900);
sjekk('bordet åpner seg', Boolean(await page.$('[data-prove="mellomspill"]')));

const forSkiftet = await tilstand();

await klikk('Legg ut brevet');
await vei(1, 'Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(1, 'Legg ut krøniken');
await vei(1, 'Neste spørsmål');
await vei(1, 'Neste spørsmål');
await vei(1, 'Se etter en norrøn kilde');
await klikk('Se etter en norrøn kilde');
await page.waitForTimeout(2600);
await vei(1, 'Se på bordet');
await klikk('Legg fra deg kildene');

// Reisen tar noen sekunder: toning ut, ny scene, toning inn.
await page.waitForTimeout(4200);

// ── 1-2. Opptakten ──────────────────────────────────────────────────────────
sjekk('opptakten står på skjermen', (await page.locator('[data-prove="opptakt"]').count()) === 1);
const opptaktTekst = (await page.textContent('[data-prove="opptakt"]')) ?? '';
sjekk('opptakten sier hvem hun er', opptaktTekst.includes('Åsa Torsteinsdotter'), opptaktTekst.slice(0, 60));
sjekk('opptakten sier hva hun er', opptaktTekst.includes('odelsbonde'));
await page.screenshot({ path: `${UT}/rpg-k2-opptakt.png` });

await page.keyboard.press('Escape');
await page.waitForTimeout(500);
sjekk('Esc lukker ikke opptakten', (await page.locator('[data-prove="opptakt"]').count()) === 1);

// Kildebordet ga nettopp XP, og den feiringen skal ikke stå oppå kapittelets
// første setning. Køen holdes, den kastes ikke.
sjekk('ingen feiring oppå opptakten', (await page.locator('text=/Nivå \\d+!/').count()) === 0);
sjekk('ingen XP-toast oppå opptakten', (await page.locator('text=/\\+\\d+ XP/').count()) === 0);

// ── 3-4. Tilstanden etter skiftet ───────────────────────────────────────────
const etter = await tilstand();
sjekk('kapittelet er nummer to', etter?.kapittel === 2, JSON.stringify(etter?.kapittel));
sjekk('hun står i Nordvik 872', etter?.sisteSted === 'nordvik-872', etter?.sisteSted);
sjekk('året er 872', etter?.klokke?.aar === 872, JSON.stringify(etter?.klokke));
sjekk('kapitteltilstanden er ny', etter?.xp === 0 && etter?.solv === 0, `xp ${etter?.xp}, sølv ${etter?.solv}`);
sjekk(
    'kampanjen er den samme',
    etter?.begreper?.klinkbygging === 'forstatt' && etter?.flagg?.['k1-tok-skrinet'] === true
);
sjekk('ætt-æren er arvet fra Torstein', (etter?.aettAere ?? 0) > 0, String(etter?.aettAere));
sjekk(
    'æren begynner på arven, ikke på null',
    etter?.aere === Math.round(30 + (etter?.aettAere ?? 0) / 2),
    `ære ${etter?.aere} av ætt-ære ${etter?.aettAere}`
);
sjekk('forrige kapittel hadde egen ære', forSkiftet?.aere === 50, String(forSkiftet?.aere));

// Videre inn i året.
await klikk('Nordvik, 872');
await page.waitForTimeout(900);
sjekk('opptakten er borte etterpå', (await page.locator('[data-prove="opptakt"]').count()) === 0);
sjekk(
    'feiringen kommer når hun er ute av øyeblikket',
    (await page.locator('text=/Nivå \\d+!/').count()) === 1
);
// Og så skal den få gå av seg selv, som ellers i appen.
await page.waitForTimeout(3600);
sjekk('årshjulet står i HUD-en', (await page.locator('[data-prove="aarshjul"]').count()) === 1);
sjekk('ærestolpen står i HUD-en', (await page.locator('[data-prove="aere"]').count()) === 1);

// ── 5. Gården ───────────────────────────────────────────────────────────────
const verden = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    return {
        sted: scene?.sted?.id ?? null,
        folk: (scene?.sted?.npcer ?? []).map((n) => n.id),
        langskip: (scene?.kart?.props ?? []).filter((p) => p.kind === 'langskip').length,
    };
});
sjekk('scenen bygger 872', verden.sted === 'nordvik-872', verden.sted);
sjekk('folkene er de som ble igjen', verden.folk.includes('torgeir') && verden.folk.includes('kaare'), verden.folk.join(', '));
sjekk('langskipet er borte fra fjorden', verden.langskip === 0, String(verden.langskip));

// Steinen på haugen skal si hva hun tok med hjem i 793.
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const mal = scene?.samhandling?.mal('landemerke', 'haug-torstein');
    if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
});
await page.waitForTimeout(500);
await page.keyboard.down('e');
await page.waitForTimeout(150);
await page.keyboard.up('e');
await page.waitForTimeout(800);
const stein = (await page.textContent('body')) ?? '';
sjekk('steinen over Torstein står på haugen', stein.includes('Åsa reiste denne steinen'));
sjekk(
    'gården husker skrinet fra Lindisfarne',
    (await page.locator('[data-prove="landemerke-tillegg"]').count()) === 1
);
await page.screenshot({ path: `${UT}/rpg-k2-steinen.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// Torgeir gir det første steget.
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const mal = scene?.samhandling?.mal('npc', 'torgeir');
    if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
});
await page.waitForTimeout(500);
await page.keyboard.down('e');
await page.waitForTimeout(150);
await page.keyboard.up('e');
await page.waitForTimeout(800);
await klikk('Året er mitt');
await page.waitForTimeout(700);
sjekk('Torgeir gir første steg', (await tilstand())?.steg?.includes('k2-noklene'));

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 3).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
