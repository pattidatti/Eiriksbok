// Sjekker bossdysten mot Den store Glemselen.
//
//   npm run dev                       # i et annet skall
//   node scripts/verify-rpg-boss.mjs
//
// Bossen er den ene delen av kampen ingen andre skript rører: skjoldet som bare
// kunnskap river ned, kunnskapsdysten som åpner seg av seg selv når eleven slår
// på en beskyttet boss, og vakten som må slippes igjen etterpå.
//
// Eleven flyttes rett til gravhaugen. Å gå dit tar for lang tid og går sjelden
// bra - hun møter halve bygdas fiender på veien.

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

const sidefeil = [];
page.on('pageerror', (e) => sidefeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(4000);

const feil = [];
const sjekk = (ok, melding) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'} ${melding}`);
    if (!ok) feil.push(melding);
};

/** Bossens tilstand, lest rett ut av scenen. */
const boss = async () =>
    page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const b = scene?.fiendeSystem?.bossen;
        return b ? { skjold: b.skjold, hp: b.hp, tilstand: b.tilstand } : null;
    });

const fore = await boss();
sjekk((fore?.skjold ?? 0) > 0, `bossen står med skjold: ${JSON.stringify(fore)}`);

// Still deg inntil den og slå. Et slag på en beskyttet boss skal åpne dysten.
const stillDegVedBossen = () =>
    page.evaluate(() => {
        const scene = window.__rpg.scene.getScene('verden');
        const b = scene.fiendeSystem.bossen;
        // Rett under den, så «opp» er riktig vei. Slagsektoren er smal, og et
        // slag i feil retning treffer ingenting.
        scene.helt.sprite.setPosition(b.sprite.x, b.sprite.y + 14);
    });

/** Slår til dysten åpner seg. Returnerer om den kom. */
const apneDysten = async () => {
    for (let i = 0; i < 10 && !(await page.$('text=Kunnskapsdyst')); i++) {
        // Bossen dytter henne unna mellom slagene, så still henne tilbake hver gang.
        await stillDegVedBossen();
        await page.keyboard.down('w');
        await page.waitForTimeout(80);
        await page.keyboard.up('w');
        await page.keyboard.down('Space');
        await page.waitForTimeout(150);
        await page.keyboard.up('Space');
        await page.waitForTimeout(450);
    }
    return Boolean(await page.$('text=Kunnskapsdyst'));
};

await stillDegVedBossen();
await page.waitForTimeout(600);
const dystApen = await apneDysten();
sjekk(dystApen, 'slag mot beskyttet boss åpnet kunnskapsdysten');

/**
 * Fasiten for det spørsmålet som står oppe nå.
 *
 * `QuizChallenge` stokker alternativene per forsøk (`QuizChallenge.tsx:44`), så
 * å gjette på indeks kan aldri bli pålitelig - en kjøring brukte opp alle fire
 * forsøkene uten å treffe. Derfor leses spørsmålsbanken rett fra kilden gjennom
 * Vites dev-server, og svaret velges på tekst.
 */
const fasit = () =>
    page.evaluate(async () => {
        const { NORDVIK_BOSS_QUESTIONS } = await import('/src/features/rpg/data/nordvik.ts');
        // Spørsmålet står i h2-en i QuizChallenge.
        const stilt = [...document.querySelectorAll('h2')].map((e) => e.textContent?.trim());
        const spm = NORDVIK_BOSS_QUESTIONS.find((q) => stilt.includes(q.question));
        if (!spm) return null;
        return {
            riktig: spm.options[spm.correct],
            galt: spm.options.find((_, i) => i !== spm.correct),
        };
    });

/** Klikker alternativet med denne teksten. Returnerer om det fantes. */
const svar = async (tekst) => {
    const knapp = page.locator('button.flex.w-full.items-start', { hasText: tekst }).first();
    if (!(await knapp.count())) return false;
    await knapp.click();
    await page.waitForTimeout(500);
    return true;
};

/** Lukker tilbakemeldingen etter et svar. */
const lukkSvar = async () => {
    await page.click('button.bg-amber-400');
    await page.waitForTimeout(1400);
};

if (dystApen) {
    const svarene = await fasit();
    sjekk(svarene !== null, `fasiten ble funnet for spørsmålet som står oppe`);

    // ── Galt svar først: dysten skal lukke seg, vakten slippes, skjoldet stå ──
    const forGalt = (await boss())?.skjold ?? -1;
    sjekk(await svar(svarene.galt), `galt alternativ fantes (${JSON.stringify(svarene.galt)})`);
    // Første bom avslører ikke fasiten: «Ikke helt.», og «Ikke denne heller.»
    // hvis den allerede er avslørt (QuizChallenge.tsx:130).
    const bomTekst = await page.textContent('p.font-display').catch(() => null);
    sjekk(
        bomTekst?.startsWith('Ikke') ?? false,
        `galt svar ble meldt som bom (${JSON.stringify(bomTekst)})`
    );
    await lukkSvar();
    sjekk(!(await page.$('text=Kunnskapsdyst')), 'dysten lukket seg etter svar');
    const vakt = await page.evaluate(
        () => window.__rpg.scene.getScene('verden').fiendeSystem.bossVakt
    );
    sjekk(vakt === false, `bossvakten ble sluppet igjen (bossVakt=${vakt})`);
    const etterGalt = (await boss())?.skjold ?? -1;
    sjekk(etterGalt === forGalt, `galt svar rev ikke ned skjold (${forGalt} -> ${etterGalt})`);

    // ── Riktig svar: og bare det skal rive ned et skjold ─────────────────────
    if (await apneDysten()) {
        const nyFasit = (await fasit()) ?? svarene;
        const forRiktig = (await boss())?.skjold ?? -1;
        sjekk(await svar(nyFasit.riktig), `riktig alternativ fantes (${JSON.stringify(nyFasit.riktig)})`);
        sjekk(Boolean(await page.$('text=Riktig!')), 'riktig svar ble meldt som riktig');
        await lukkSvar();
        const etterRiktig = (await boss())?.skjold ?? -1;
        sjekk(
            etterRiktig === forRiktig - 1,
            `riktig svar rev ned et skjold (${forRiktig} -> ${etterRiktig})`
        );
    } else {
        sjekk(false, 'fikk ikke åpnet dysten på nytt for det riktige svaret');
    }
}

const etter = await boss();
sjekk(etter !== null, `bossen lever fortsatt: ${JSON.stringify(etter)}`);

console.log('\nsidefeil:', sidefeil.length ? sidefeil.slice(0, 3).join(' | ') : 'ingen');
await browser.close();

if (feil.length || sidefeil.length) {
    console.error(`\nFEIL i ${feil.length} sjekk${feil.length === 1 ? '' : 'er'}.`);
    process.exit(1);
}
console.log('\nBossdysten virker.');
