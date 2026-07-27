// Driver minnetreet gjennom en ekte nettleser.
//
//   npm run dev                            # i et annet skall
//   node scripts/verify-rpg-minnetre.mjs
//
// Det som måles er ikke at skjermen rendrer, men at de tre tilstandene er tre
// forskjellige ting - og at verden faktisk løfter dem:
//
//   1. M åpner treet, og telleren stemmer med det som ligger i lagringen.
//   2. Et ukjent begrep viser verken navn eller hva som skal til. En node som
//      røper oppskriften sin, gjør treet til en huskeliste.
//   3. Å lese runesteinen ved veien gir `[Nordvegen]` som forstått - lesingen
//      *er* handlingen bak begrepet.
//   4. Å spørre Ravn ut gir `[Hærferd]` som hørt, og ikke mer. En NPC skal
//      aldri kunne dele ut forståelse (blueprint §7.4).

import { chromium } from 'playwright';
import { entreNordvik, stengHmr } from './lib/rpg-testside.mjs';

const feil = [];
const sjekk = (navn, ok, detalj) => {
    console.log(`${ok ? 'OK  ' : 'FEIL'}  ${navn}${detalj ? `  (${detalj})` : ''}`);
    if (!ok) feil.push(navn);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

const konsollfeil = [];
page.on('pageerror', (e) => konsollfeil.push(String(e)));
page.on('console', (m) => m.type() === 'error' && konsollfeil.push(m.text()));

await stengHmr(page);
// Hun har bygget skroget og holdt breddegraden. Resten står i tåka.
await entreNordvik(page, 'Torstein', {
    steg: ['k1-ravn', 'k1-skroget', 'k1-sjosettingen', 'k1-navigasjonen'],
    begreper: { klinkbygging: 'forstatt', breddegradseiling: 'forstatt' },
});
await page.waitForTimeout(3800);

const begreper = () =>
    page.evaluate(() => window.__rpgStore?.getState()?.begreper ?? null);

const niva = (id) =>
    page.getAttribute(`[data-prove="begrep-${id}"]`, 'data-niva').catch(() => null);

const trykkE = async () => {
    await page.keyboard.down('e');
    await page.waitForTimeout(140);
    await page.keyboard.up('e');
};

const stillDegVed = async (type, id) =>
    page.evaluate(
        ([type, id]) => {
            const scene = window.__rpg?.scene.getScene('verden');
            const mal = scene?.samhandling?.mal(type, id);
            if (!mal) return null;
            scene.helt.sprite.setPosition(mal.x, mal.y + 10);
            return mal.navn;
        },
        [type, id]
    );

// ── 1. M åpner treet ────────────────────────────────────────────────────────
await page.keyboard.press('m');
await page.waitForTimeout(700);
const apent = await page.locator('[data-prove="minnetre"]').count();
sjekk('M åpner minnetreet', apent === 1);

const teller = (await page.textContent('[data-prove="minnetre-teller"]').catch(() => ''))?.trim();
sjekk('telleren stemmer med lagringen', teller === '2 av 6 forstått', teller);

// ── 2. Tåka røper ingenting ─────────────────────────────────────────────────
sjekk('bygget skrog gir forstått', (await niva('klinkbygging')) === 'forstatt');
sjekk('kildetaushet ligger i tåka', (await niva('kildetaushet')) === 'ukjent');

const tak = await page.textContent('[data-prove="begrep-kildetaushet"]');
sjekk(
    'et ukjent begrep viser verken navn eller oppskrift',
    !tak.includes('Kildetaushet') && !tak.includes('Let etter'),
    tak.replace(/\s+/g, ' ').trim()
);

await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// ── 3. Runesteinen gir Nordvegen ────────────────────────────────────────────
sjekk('Nordvegen er ukjent før steinen er lest', (await begreper())?.nordvegen === undefined);
await stillDegVed('landemerke', 'runestein-navnet');
await page.waitForTimeout(500);
await trykkE();
await page.waitForTimeout(900);
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
sjekk(
    'å lese steinen gir Nordvegen som forstått',
    (await begreper())?.nordvegen === 'forstatt',
    JSON.stringify((await begreper())?.nordvegen)
);

// ── 4. Ravn gir hørt, ikke forstått ─────────────────────────────────────────
await stillDegVed('npc', 'ravn');
await page.waitForTimeout(500);
await trykkE();
await page.waitForTimeout(900);
await page.getByRole('button', { name: /Spør Ravn ut/i }).click();
await page.waitForTimeout(500);
sjekk(
    'å spørre Ravn ut gir Hærferd som hørt',
    (await begreper())?.haerferd === 'hort',
    JSON.stringify((await begreper())?.haerferd)
);
await page.keyboard.press('Escape');
await page.waitForTimeout(600);

// Og hørt skal se ut som noe annet enn forstått: navnet står, forklaringen ikke.
await page.keyboard.press('m');
await page.waitForTimeout(700);
sjekk('Hærferd står som hørt i treet', (await niva('haerferd')) === 'hort');
const hort = await page.textContent('[data-prove="begrep-haerferd"]');
sjekk(
    'en hørt node viser navnet og veien videre, ikke forklaringen',
    hort.includes('Hærferd') &&
        hort.includes('Gjør ferden vestover') &&
        !hort.includes('sommeryrke'),
    hort.replace(/\s+/g, ' ').trim().slice(0, 120)
);
sjekk('telleren har vokst med steinen', (await page.textContent('[data-prove="minnetre-teller"]')).trim() === '3 av 6 forstått');

await page.screenshot({ path: '.screenshots/rpg-minnetre.png' });

sjekk('ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
