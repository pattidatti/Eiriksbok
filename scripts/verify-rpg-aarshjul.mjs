// Driver årshjulet og æren gjennom en ekte nettleser.
//
//   npm run dev                            # i et annet skall
//   node scripts/verify-rpg-aarshjul.mjs
//
// Det som måles:
//
//   1. Kapittel 1 viser verken ærestolpe eller årshjul. Et grensesnitt som
//      lover et system kapittelet ikke har, er nøyaktig feilen mana-stolpen
//      gjorde før besvergelsene ble pensjonert (§15).
//   2. Kapittel 2 viser begge.
//   3. Dager går, og årstiden skifter når de tretti er brukt opp. Året skal
//      stå på ringen, ikke bare i en variabel.
//   4. Æren flytter seg med en grunn eleven kan lese, og den slår ut i
//      prisene hos Bera. Femti ære gir samme pris som før systemet fantes.

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const browser = await chromium.launch();

/** Åpner spillet i Nordvik, i det kapittelet skriptet ber om. */
async function okt(kapittel) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const konsollfeil = [];
    page.on('pageerror', (e) => konsollfeil.push(String(e)));
    page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
    await stengHmr(page);
    await entreNordvik(page, 'Åsa');
    // Kapittelet settes etter innlasting: `entreNordvik` sår alltid kapittel 1,
    // og lagringsformen skal ikke måtte kjenne til hvert enkelt prøveskript.
    if (kapittel !== 1) {
        await page.evaluate((k) => window.__rpgStore.setState({ kapittel: k }), kapittel);
    }
    await page.waitForTimeout(3200);
    return { page, konsollfeil };
}

// ── 1. Kapittel 1: ingen av delene ──────────────────────────────────────────
{
    const { page } = await okt(1);
    sjekk('kapittel 1 viser ingen ærestolpe', (await page.locator('[data-prove="aere"]').count()) === 0);
    sjekk('kapittel 1 viser intet årshjul', (await page.locator('[data-prove="aarshjul"]').count()) === 0);
    await page.close();
}

// ── 2-4. Kapittel 2 ─────────────────────────────────────────────────────────
const { page, konsollfeil } = await okt(2);

sjekk('kapittel 2 viser ærestolpen', (await page.locator('[data-prove="aere"]').count()) === 1);
sjekk('kapittel 2 viser årshjulet', (await page.locator('[data-prove="aarshjul"]').count()) === 1);

const hjul = () =>
    page.evaluate(() => {
        const el = document.querySelector('[data-prove="aarshjul"]');
        return el ? { aarstid: el.dataset.aarstid, tekst: el.textContent.replace(/\s+/g, ' ') } : null;
    });

// Klokken settes til 872, vår, dag 1.
await page.evaluate(() => window.__rpgStore.getState().settKlokke({ aar: 872, dag: 1 }));
await page.waitForTimeout(300);
sjekk('året står på ringen', (await hjul())?.tekst.includes('872'), (await hjul())?.tekst);
sjekk('våren er årstiden på dag 1', (await hjul())?.aarstid === 'vaar');

// 29 dager fram: fortsatt vår, siste dag.
await page.evaluate(() => window.__rpgStore.getState().gaaDager(29, 'Våronna'));
await page.waitForTimeout(300);
sjekk('29 dager holder seg i våren', (await hjul())?.aarstid === 'vaar', (await hjul())?.tekst);

// Én til, og hun er over i sommeren.
await page.evaluate(() => window.__rpgStore.getState().gaaDager(1));
await page.waitForTimeout(400);
sjekk('dag 31 er sommer', (await hjul())?.aarstid === 'sommer', (await hjul())?.tekst);

// Hele året rundt: 872 blir 873, og våren er tilbake.
await page.evaluate(() => window.__rpgStore.getState().gaaDager(90));
await page.waitForTimeout(400);
const nyttAar = await hjul();
sjekk('året rundt gir nytt år og ny vår', nyttAar?.aarstid === 'vaar' && nyttAar.tekst.includes('873'), nyttAar?.tekst);

// ── Æren ────────────────────────────────────────────────────────────────────
const aere = () => page.evaluate(() => window.__rpgStore.getState().aere);
sjekk('æren begynner på femti', (await aere()) === 50);

// Prisen leses gjennom butikkpanelet i stedet for en egen krok: det er den
// eleven faktisk ser. Vi åpner boden hos Bera og leser knappen.
await page.evaluate(() => window.__rpgStore.setState({ aere: 50, solv: 999 }));
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    const mal = scene?.samhandling?.mal('npc', 'bera');
    if (mal) scene.helt.sprite.setPosition(mal.x, mal.y + 10);
});
await page.waitForTimeout(500);
await page.keyboard.down('e');
await page.waitForTimeout(140);
await page.keyboard.up('e');
await page.waitForTimeout(800);

const knappetekst = async () =>
    (await page.locator('li button', { hasText: 'sølv' }).first().textContent())?.trim();
const femti = await knappetekst();
await page.evaluate(() => window.__rpgStore.setState({ aere: 10 }));
await page.waitForTimeout(300);
const lav = await knappetekst();
await page.evaluate(() => window.__rpgStore.setState({ aere: 95 }));
await page.waitForTimeout(300);
const hoy = await knappetekst();

const tall = (t) => Number((t ?? '').replace(/\D/g, ''));
sjekk('lav ære er dyrere enn femti', tall(lav) > tall(femti), `${lav} mot ${femti}`);
sjekk('høy ære er billigere enn femti', tall(hoy) < tall(femti), `${hoy} mot ${femti}`);
await page.keyboard.press('Escape');
await page.waitForTimeout(500);

// Grunnen skal stå i klartekst når æren flytter seg.
await page.evaluate(() => window.__rpgStore.getState().endreAere('gjorde-opp'));
await page.waitForTimeout(500);
const varsel = await page.textContent('body');
sjekk('æren flytter seg med en grunn eleven kan lese', varsel.includes('Du gjorde opp for deg'));

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
