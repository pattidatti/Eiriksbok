// Prøver Minnevokterens hall (/oving/rpg) i en ekte nettleser.
//
//   npm run dev                        # i et annet skall
//   node scripts/verify-rpg-hub.mjs
//
// Hubben har én jobb: å være døra inn i epokene, og døra ut igjen. Går en av de
// to i stykker, står eleven fast - enten i en hall uten utgang, eller i en
// epoke uten vei hjem. Begge retninger måles derfor her.
//
// I tillegg måles tidslinjen selv: at portalene ligger i kronologisk rekkefølge
// langs veien, at bare den ferdige epoken er åpen, og at sporene fra forrige
// besøk faktisk ligger der.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { entreHallen, stengHmr } from './lib/rpg-testside.mjs';

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

const sidefeil = [];
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));
page.on('pageerror', (e) => sidefeil.push(String(e)));

await stengHmr(page);
// Tre besøk i vikingtiden og fem steiner fra før: sporene skal ligge der når
// hun kommer tilbake, ellers er de ikke spor.
await entreHallen(page, { besokt: { vikingtiden: 3 }, steiner: 5 });
await page.waitForTimeout(2600);

const les = () =>
    page.evaluate(() => {
        const scene = window.__rpg.scene.getScene('verden');
        const s = window.__rpgStore.getState();
        return {
            portaler: scene.portalOversikt(),
            sted: s.sisteSted,
            epokeId: s.epokeId,
            xp: s.xp,
            hub: s.hub,
        };
    });

// ── 1. Tidslinjeveien ───────────────────────────────────────────────────────

const hall = await les();
sjekk('hallen er stedet eleven står på', hall.sted === 'hub', hall.sted);
sjekk('epoken byttes ikke av å gå i hallen', hall.epokeId === 'vikingtiden', hall.epokeId);

const paaVeien = hall.portaler.filter((p) => p.y < 400);
const lunden = hall.portaler.filter((p) => p.y >= 400);
sjekk('sju epoker står på tidslinjeveien', paaVeien.length === 7, paaVeien.length);
sjekk('fire epoker står i lunden', lunden.length === 4, lunden.length);
sjekk(
    'veien går i kronologisk rekkefølge',
    paaVeien.every((p, i) => i === 0 || p.x > paaVeien[i - 1].x),
    paaVeien.map((p) => p.tittel).join(' → ')
);
sjekk(
    'bare den ferdige epoken er åpen',
    hall.portaler.filter((p) => p.apen).length === 1 &&
        hall.portaler.find((p) => p.apen)?.tittel === 'Vikingtiden'
);

// Avstanden mellom de eldste portalene skal være større enn mellom de yngste.
// Det er hele poenget med veien: eleven kjenner på beina at det er lengre fra
// steinalderen til antikken enn fra industrialiseringen til krigen.
const gap = paaVeien.slice(1).map((p, i) => p.x - paaVeien[i].x);
sjekk('eldre tid ligger glisnere enn nyere', gap[0] > gap[gap.length - 1], gap.join(', '));

sjekk(
    'sporene fra forrige besøk ligger ved portalen',
    hall.portaler.find((p) => p.tittel === 'Vikingtiden')?.spor === 3
);

await page.screenshot({ path: `${UT}/hub-1-hallen.png` });

// ── 2. Varden tar imot en stein ─────────────────────────────────────────────
//
// Eleven starter noen skritt fra varden. Hun går dit, trykker E, og steinen
// skal telles. Et tastetrykk må holdes i over 100 ms for å bli sett.

/**
 * Venter til eleven står i det nye stedet og bildet er tonet inn.
 *
 * Ikke en fast pause. Headless Chromium struper requestAnimationFrame når
 * ingenting skjer på siden, og da fryser kameraets fade-in midt i - spillet
 * går som det skal, men skjermbildet blir kullsvart og målingen leser en verden
 * som ikke er ferdig bygget. Å spørre siden gjentatte ganger holder både løkka
 * og prøven i gang.
 */
const ventPaaSted = async (stedId) => {
    await page.waitForFunction(
        (id) => {
            const scene = window.__rpg.scene.getScene('verden');
            return (
                window.__rpgStore.getState().sisteSted === id &&
                !scene.cameras.main.fadeEffect.isRunning
            );
        },
        stedId,
        { timeout: 20000, polling: 200 }
    );
};

const hold = async (tast, ms) => {
    await page.keyboard.down(tast);
    await page.waitForTimeout(ms);
    await page.keyboard.up(tast);
    await page.waitForTimeout(220);
};

await hold('ArrowDown', 480);
await hold('ArrowRight', 380);
await page.waitForTimeout(400);
const hint = await page.evaluate(() => document.body.innerText);
sjekk('varden ber om en stein', hint.includes('legg en stein'), hint.match(/E - [^\n]*/)?.[0]);
await hold('e', 160);
await page.waitForTimeout(500);
const etterStein = await les();
sjekk('steinen ble lagt', etterStein.hub.steiner === 6, etterStein.hub.steiner);

// ── 3. Gjennom portalen til Nordvik ─────────────────────────────────────────

const viking = hall.portaler.find((p) => p.tittel === 'Vikingtiden');
await page.evaluate(
    ([x, y]) => {
        // Eleven flyttes til foten av portalen i stedet for at skriptet går
        // hele veien. Åtte sekunder gange langs veien er en fin opplevelse for
        // en elev og bortkastet tid for en prøve.
        const scene = window.__rpg.scene.getScene('verden');
        scene.flyttHelt(x, y + 10);
    },
    [viking.x, viking.y]
);
await page.waitForTimeout(700);
const vedPortal = await page.evaluate(() => document.body.innerText);
sjekk(
    'portalen svarer når eleven står i den',
    vedPortal.includes('gå inn i Vikingtiden'),
    vedPortal.match(/E - [^\n]*/)?.[0]
);

await hold('e', 160);
await ventPaaSted('nordvik');
const iNordvik = await les();
sjekk('eleven kom til Nordvik', iNordvik.sted === 'nordvik', iNordvik.sted);
sjekk('epoken er fortsatt vikingtiden', iNordvik.epokeId === 'vikingtiden');
sjekk('portalen ble talt', iNordvik.hub.besokt.vikingtiden === 4, iNordvik.hub.besokt.vikingtiden);
sjekk('Nordvik har én port hjem', iNordvik.portaler.length === 1, iNordvik.portaler.length);
await page.screenshot({ path: `${UT}/hub-2-nordvik.png` });

// ── 4. Og hjem igjen ────────────────────────────────────────────────────────

const hjem = iNordvik.portaler[0];
await page.evaluate(
    ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x, y + 10),
    [hjem.x, hjem.y]
);
await page.waitForTimeout(700);
await hold('e', 160);
await ventPaaSted('hub');
const tilbake = await les();
sjekk('eleven kom hjem til hallen', tilbake.sted === 'hub', tilbake.sted);
sjekk('nivået fulgte med hjem', tilbake.epokeId === 'vikingtiden' && tilbake.xp === iNordvik.xp);
sjekk(
    'den fjerde steinen ligger ved portalen nå',
    tilbake.portaler.find((p) => p.tittel === 'Vikingtiden')?.spor === 4
);
sjekk('steinene på varden overlevde reisen', tilbake.hub.steiner === 6, tilbake.hub.steiner);
await page.screenshot({ path: `${UT}/hub-3-hjemme.png` });

sjekk('ingen feil i konsollen', sidefeil.length === 0, sidefeil[0]);

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nHallen står.');
process.exit(feil.length ? 1 : 0);
