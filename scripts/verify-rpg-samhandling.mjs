// Sjekker at eleven fortsatt kan gå bort til folk og ting og trykke E.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-samhandling.mjs
//
// Kampskriptene ser bare på tall i HUD-en, og verify-rpg-verden.mjs teller det
// som står stille. Ingen av dem merker om hintet slutter å komme eller E slutter
// å åpne en samtale - som er nettopp det samhandlingslaget gjør.
//
// Eleven flyttes rett bort til målet i stedet for å gå dit. Å navigere en
// fjordbygd med piltaster er upålitelig, og det er ikke bevegelsen som testes.

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

/** Flytter eleven inntil et mål, og returnerer navnet målet oppgir. */
const stillDegVed = async (type, id) =>
    page.evaluate(
        ([type, id]) => {
            const scene = window.__rpg?.scene.getScene('nordvik');
            const mal = scene?.samhandling?.mal(type, id);
            if (!mal) return null;
            scene.spiller.setPosition(mal.x, mal.y + 10);
            return mal.navn;
        },
        [type, id]
    );

// Hintboblen i Hud.tsx. Klassene er selektoren vi har - `.text-amber-200`
// alene traff sølvtelleren i stedet, og ga «0 sølv» som hint.
const hint = async () =>
    (await page.textContent('div.absolute.bottom-20.rounded-full').catch(() => null))?.trim() ??
    null;

const feil = [];
const sjekk = (ok, melding) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'} ${melding}`);
    if (!ok) feil.push(melding);
};

// ── NPC ─────────────────────────────────────────────────────────────────────
const navn = await stillDegVed('npc', 'gudrun');
sjekk(navn === 'Gudrun Husfrue', `målet kjenner navnet sitt (fikk ${JSON.stringify(navn)})`);
await page.waitForTimeout(600);
const npcHint = await hint();
sjekk(npcHint === 'E - snakk med Gudrun Husfrue', `hint ved NPC: ${JSON.stringify(npcHint)}`);

await page.keyboard.press('e');
await page.waitForTimeout(900);
const dialogTittel = await page.textContent('h2.font-display').catch(() => null);
sjekk(
    dialogTittel?.includes('Gudrun') ?? false,
    `E åpnet samtalen (${JSON.stringify(dialogTittel)})`
);

// Lukk igjen, ellers er bevegelsen låst når neste mål skal prøves.
await page.keyboard.press('Escape');
await page.waitForTimeout(700);

// ── Landemerke ──────────────────────────────────────────────────────────────
await stillDegVed('landemerke', 'runestein-navnet');
await page.waitForTimeout(600);
const lmHint = await hint();
sjekk(
    (lmHint?.startsWith('E - les ') ?? false) && !lmHint.includes('undefined'),
    `hint ved landemerke: ${JSON.stringify(lmHint)}`
);

await page.keyboard.press('e');
await page.waitForTimeout(900);
const lmTittel = await page.textContent('h2.font-display').catch(() => null);
sjekk(Boolean(lmTittel), `E åpnet landemerket (${JSON.stringify(lmTittel)})`);
await page.keyboard.press('Escape');
await page.waitForTimeout(700);

// ── Utropstegn ──────────────────────────────────────────────────────────────
// Markørene skal finnes og minst én skal være synlig - ellers vet ikke eleven
// hvem som har et oppdrag til henne.
const markorer = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('nordvik');
    const kart = scene?.samhandling?.npcMarkorer;
    if (!kart) return null;
    const alle = [...kart.values()];
    return { antall: alle.length, synlige: alle.filter((m) => m.visible).length };
});
sjekk(
    (markorer?.antall ?? 0) >= 6 && (markorer?.synlige ?? 0) >= 1,
    `utropstegn: ${JSON.stringify(markorer)}`
);

// Kompasset er dekket indirekte: det slår opp posisjonen med samme `mal()` som
// `stillDegVed` bruker over, så et brudd der ville slått ut på hint-sjekkene.

console.log('\nsidefeil:', sidefeil.length ? sidefeil.slice(0, 3).join(' | ') : 'ingen');
await browser.close();

if (feil.length || sidefeil.length) {
    console.error(`\nFEIL i ${feil.length} sjekk${feil.length === 1 ? '' : 'er'}.`);
    process.exit(1);
}
console.log('\nSamhandling virker.');
