// Driver Mellomspill I - bordet med kildene - gjennom en ekte nettleser.
//
//   npm run dev                                # i et annet skall
//   node scripts/verify-rpg-mellomspill.mjs
//
// Det som måles er ikke at komponenten rendrer, men at kjeden holder hele veien
// fra Orm til regnskapet:
//
//   1. Orm åpner bordet i det kapittelet er over.
//   2. Kildene legges ut, og veiingene gir fasit også når hun bommer.
//   3. Det tredje feltet blir stående tomt, og linja om skriptoriet står bare
//      for den som brente det. Det er hele grunnen til at eleven utførte raidet
//      selv, og den linja skal ikke kunne bli hengende for alle.
//   4. Går hun fra bordet før det tomme feltet, er ingenting fullført.
//   5. Bordet ligger framme i pausemenyen etterpå.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE, entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const UT = '.screenshots';
mkdirSync(UT, { recursive: true });

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

/** Kapittel 1 spilt fram til hjemkomsten. Orm venter på svaret. */
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
};

const browser = await chromium.launch();

/** Én økt, med eller uten brent skriptorium. */
async function okt(brente) {
    const page = await browser.newPage({
        viewport: { width: 1366, height: 768 },
        reducedMotion: 'no-preference',
    });
    const konsollfeil = [];
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    page.on('pageerror', (e) => konsollfeil.push(String(e)));

    await stengHmr(page);
    await entreNordvik(page, 'Torstein', {
        ...HJEMME,
        flagg: brente ? { 'k1-brente-skriptoriet': true, 'k1-tok-skrinet': true } : {},
    });
    await page.waitForTimeout(2600);
    return { page, konsollfeil };
}

const store = (page) =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { steg: s.steg, begreper: s.begreper, kilder: s.kilder } : null;
    });

const laast = (page) =>
    page.evaluate(() => window.__rpg?.scene.getScene('verden')?.laast ?? null);

/** Går bort til Orm i naustet og velger hjemkomsten. */
async function snakkMedOrm(page) {
    await page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        scene?.flyttHelt(9 * 16 + 8, 37 * 16 + 8);
    });
    await page.waitForTimeout(400);
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(700);
    const knapp = await page.$('text=Fortell hva du tok med');
    if (knapp) await knapp.click();
    await page.waitForTimeout(900);
}

/** Klikker knappen med denne teksten inne i bordet. */
async function klikk(page, tekst) {
    const knapp = await page.$(`[data-prove="mellomspill"] >> text=${tekst}`);
    if (!knapp) throw new Error(`fant ikke knappen «${tekst}»`);
    await knapp.click();
    await page.waitForTimeout(320);
}

/**
 * Svarer på ett veiespørsmål ved å velge alternativ nummer `n`, og går videre.
 *
 * Alternativene leses som knapper i rekkefølge. Skriptet velger med vilje feil
 * en gang: fasiten skal stå uansett, og det er den regelen som er lettest å
 * miste den dagen noen legger inn poeng på bordet.
 */
async function vei(page, n, videreTekst) {
    const valg = await page.$$('[data-prove="veiing"] button');
    if (!valg[n]) throw new Error(`veiingen hadde ikke alternativ ${n}`);
    await valg[n].click();
    await page.waitForTimeout(360);
    await klikk(page, videreTekst);
}

// ── Økt 1: hun brente skriptoriet ──────────────────────────────────────────

{
    const { page, konsollfeil } = await okt(true);

    // Går fra bordet med én gang: ingenting skal være ført.
    await snakkMedOrm(page);
    sjekk('Orm åpner bordet', Boolean(await page.$('[data-prove="mellomspill"]')));
    sjekk('Verden står låst bak bordet', (await laast(page)) === true);
    await page.screenshot({ path: `${UT}/rpg-mellomspill-apning.png` });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const avbrutt = await store(page);
    sjekk('Ingen bord uten det tomme feltet', !avbrutt?.steg?.includes('mellomspill:mellomspill-1'));
    sjekk('Låsen er av når hun går fra bordet', (await laast(page)) === false);

    // Tilbake til bordet gjennom pausemenyen.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    const igjen = await page.$('text=Kildene fra kapittel 1');
    sjekk('Bordet ligger framme i pausemenyen', Boolean(igjen));
    if (igjen) await igjen.click();
    await page.waitForTimeout(700);
    sjekk('Bordet åpnes fra pausemenyen', Boolean(await page.$('[data-prove="mellomspill"]')));

    // ── Alkuins brev ───────────────────────────────────────────────────────
    await klikk(page, 'Legg ut brevet');
    sjekk('Brevet ligger på bordet', Boolean(await page.$('text=Alkuins brev til kong Æthelred')));
    sjekk(
        'Kortet sier hvor han satt',
        Boolean(await page.$('text=Ved Karl den stores hoff i Frankerriket'))
    );
    await page.screenshot({ path: `${UT}/rpg-mellomspill-alkuin.png` });

    // Første spørsmål besvares galt med vilje. Fasiten skal stå likevel.
    await page.$$('[data-prove="veiing"] button').then((b) => b[0].click());
    await page.waitForTimeout(360);
    sjekk(
        'Fasiten står også når hun bommer',
        Boolean(await page.$('text=over tusen kilometer unna'))
    );
    await klikk(page, 'Neste spørsmål');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Legg ut krøniken');

    // ── Den angelsaksiske krøniken ─────────────────────────────────────────
    sjekk('Krøniken ligger på bordet', Boolean(await page.$('text=ildsprutende drager')));
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Se etter en norrøn kilde');

    const kilderNaa = await store(page);
    sjekk(
        'Begge kildene er ført som lagt ut',
        kilderNaa?.kilder?.length === 2,
        JSON.stringify(kilderNaa?.kilder)
    );

    // ── Det tomme feltet ───────────────────────────────────────────────────
    await klikk(page, 'Se etter en norrøn kilde');
    await page.waitForTimeout(2600);
    sjekk('Feltet blir stående tomt', Boolean(await page.$('[data-prove="tomt-felt"]')));
    sjekk(
        'Bordet sier at det ikke finnes noen',
        Boolean(await page.$('text=Norrøne kilder om Lindisfarne: ingen.'))
    );
    sjekk(
        'Den som brente skriptoriet får linja si',
        Boolean(await page.$('text=Og du var der da det ble avgjort hvem som fikk fortelle.'))
    );
    await page.screenshot({ path: `${UT}/rpg-mellomspill-tomt.png` });

    await vei(page, 1, 'Se på bordet');
    await klikk(page, 'Legg fra deg kildene');
    await page.waitForTimeout(700);

    const slutt = await store(page);
    sjekk(
        'Mellomspillet er kontert',
        slutt?.steg?.includes('mellomspill:mellomspill-1'),
        JSON.stringify(slutt?.steg?.slice(-3))
    );
    sjekk('Samtidig kilde er forstått', slutt?.begreper?.['samtidig-kilde'] === 'forstatt');
    sjekk('Kildetaushet er forstått', slutt?.begreper?.['kildetaushet'] === 'forstatt');
    // Bordet slipper ikke eleven tilbake til 793 - det tar henne videre til
    // 872. Låsen står derfor, og den tilhører opptakten til kapittel 2
    // (se scripts/verify-rpg-kapittel2.mjs). Et ubundet «låst = false» her
    // ville krevd at kampanjen stoppet opp etter kapittel 1.
    await page.waitForTimeout(4200);
    sjekk('Kapittel 2 begynner der bordet slutter', (await page.locator('[data-prove="opptakt"]').count()) === 1);
    sjekk('Verden står låst bak opptakten', (await laast(page)) === true);
    sjekk('Ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

    await page.close();
}

// ── Økt 2: hun lot skriptoriet stå ─────────────────────────────────────────

{
    const { page, konsollfeil } = await okt(false);
    await snakkMedOrm(page);

    await klikk(page, 'Legg ut brevet');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Legg ut krøniken');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Neste spørsmål');
    await vei(page, 1, 'Se etter en norrøn kilde');
    await klikk(page, 'Se etter en norrøn kilde');
    await page.waitForTimeout(2600);

    sjekk(
        'Feltet er tomt for henne også',
        Boolean(await page.$('text=Norrøne kilder om Lindisfarne: ingen.'))
    );
    sjekk(
        'Linja om skriptoriet står ikke for den som lot det stå',
        !(await page.$('text=Og du var der da det ble avgjort hvem som fikk fortelle.'))
    );
    sjekk('Ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

    await page.close();
}

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
