// Driver kampsystemet i Minnevokteren (/oving/rpg) gjennom en ekte nettleser.
//
//   npm run dev                        # i et annet skall
//   node scripts/verify-rpg-kamp.mjs
//
// Skjermbildene havner i .screenshots/, som ikke committes.
//
// Pust- og livsstolpene i HUD-en har aria-valuenow, så tilstanden er lesbar fra
// DOM-en. Da kan vi sjekke oppførsel, ikke bare at ingenting krasjet.
//
// To ting testen må ta hensyn til: verden lever (fiender spawner og slår), og et
// tastetrykk må holdes i over 100 ms for å bli sett hvis spillet står i en
// hitstop. Derfor leses livet rundt hver prøve - endrer det seg, var ikke prøven
// et rent tilfelle, og den hoppes over i stedet for å slå noe fast.

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

const browser = await chromium.launch();
const page = await browser.newPage({
    viewport: { width: 1366, height: 768 },
    reducedMotion: 'no-preference',
});

const konsollfeil = [];
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));
page.on('pageerror', (e) => konsollfeil.push(String(e)));

const tall = async (merkelapp) => {
    const el = await page.$(`[aria-label="${merkelapp}"]`);
    return el ? Number(await el.getAttribute('aria-valuenow')) : null;
};
const pust = () => tall('Pust');
const liv = () => tall('Liv');
const ventFullPust = async () => {
    for (let i = 0; i < 30 && (await pust()) < 99; i++) await page.waitForTimeout(200);
};

/** Et tastetrykk som er langt nok til å bli sett selv under en hitstop. */
const trykk = async (tast, ms = 140) => {
    await page.keyboard.down(tast);
    await page.waitForTimeout(ms);
    await page.keyboard.up(tast);
};

/** Utfør en handling og mål pustkostnaden, med livet som forstyrrelsesvakt. */
const maal = async (navn, forventet, handling) => {
    await ventFullPust();
    const pFor = await pust();
    const lFor = await liv();
    await handling();
    await page.waitForTimeout(200);
    const pEtter = await pust();
    if ((await liv()) !== lFor) {
        console.log(`HOPP  ${navn} - avbrutt av kamp`);
        return;
    }
    const brukt = pFor - pEtter;
    sjekk(
        `${navn} koster ~${forventet} pust`,
        brukt >= forventet - 4 && brukt <= forventet + 6,
        `brukte ${brukt} (${pFor} -> ${pEtter})`
    );
};

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(3500);
await page.screenshot({ path: `${UT}/kamp-1-start.png` });

sjekk('bare én Phaser-scene kjører', (await page.$$eval('canvas', (c) => c.length)) === 1);
sjekk('pustestolpen finnes og er full', (await pust()) >= 99, `pust=${await pust()}`);
sjekk(
    'skjoldet vises som ruter i HUD',
    (await page.$$eval('[title] span[style*="background"]', (e) => e.length)) >= 5
);

// ── Garden: Shift holdt i ro reiser skjoldet og drenerer 6 pust i sekundet ──
const pFor = await pust();
await page.keyboard.down('Shift');
await page.waitForTimeout(2000);
const pGard = await pust();
await page.screenshot({ path: `${UT}/kamp-2-gard.png` });
sjekk(
    'garden drenerer ~6 pust i sekundet',
    pGard <= pFor - 9 && pGard >= pFor - 18,
    `${pFor} -> ${pGard}`
);
await page.keyboard.up('Shift');

// ── Gjenvinning: skal ta seg opp igjen etter hvilepausen ───────────────────
await page.waitForTimeout(2600);
sjekk('pusten tar seg opp igjen i ro', (await pust()) > pGard + 10, `${pGard} -> ${await pust()}`);

// ── Kostnadene ─────────────────────────────────────────────────────────────
await maal('slaget', 12, () => trykk('Space'));
await maal('rullen', 15, async () => {
    await page.keyboard.down('d');
    await page.waitForTimeout(120);
    await trykk('Shift', 60);
    await page.keyboard.up('d');
});
await maal('manøveren', 22, async () => {
    await page.keyboard.down('Shift');
    await page.waitForTimeout(250);
    await trykk('Space');
    await page.keyboard.up('Shift');
});

// ── Skjoldgang: garden skal kunne holdes mens hun går ─────────────────────
await ventFullPust();
await page.keyboard.down('Shift');
await page.waitForTimeout(400);
await page.keyboard.down('s');
await page.waitForTimeout(900);
await page.screenshot({ path: `${UT}/kamp-3-skjoldgang.png` });
await page.keyboard.up('s');
await page.keyboard.up('Shift');

// ── Langt hold: pusten går bare nedover, og aldri under null ──────────────
await ventFullPust();
const pHoldFor = await pust();
const lHoldFor = await liv();
await page.keyboard.down('Shift');
await page.waitForTimeout(8000);
const pHold = await pust();
await page.screenshot({ path: `${UT}/kamp-4-langt-hold.png` });
if ((await liv()) === lHoldFor) {
    sjekk('garden drenerer jevnt gjennom 8 sekunder', pHold <= pHoldFor - 40, `${pHoldFor} -> ${pHold}`);
} else {
    console.log('HOPP  langt hold - avbrutt av kamp');
}
sjekk('pusten går aldri under null', pHold >= 0, `pust=${pHold}`);
await page.keyboard.up('Shift');

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feilet: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
