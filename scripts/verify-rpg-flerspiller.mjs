// Prøver flerspilleren i Minnevokterens hall (/oving/rpg) i en ekte nettleser.
//
//   npm run dev                                 # i et annet skall
//   node scripts/verify-rpg-flerspiller.mjs
//
// Fire ting måles, og de er valgt fordi de er de fire som gjør vondt når de
// ryker:
//
//  1. **Navnevakten.** Den er det eneste som står mellom et åpent klasserom og
//     et navn ingen skal måtte lese. Ryker den, ryker den stille.
//  2. **At de andre tegnes, og at de glir.** Rå posisjoner ti ganger i sekundet
//     gir figurer som teleporterer (blueprint, fallgruve 7). Prøven måler at
//     figuren ligger *mellom* to prøver rett etter at den andre kom inn - ikke
//     at den har hoppet til den siste.
//  3. **Skjul-knappen.** Uten den har eleven ingen vei ut av noe hun ikke vil
//     se, og rommene er åpne.
//  4. **Benken og følelsen.** Det er dette de faktisk kommer til å bruke.
//
// Medelevene settes inn gjennom `window.__rpgHub.settGjester`, som er nøyaktig
// det kallet Firebase gjør. Alt etter det punktet - filtrering, navnevakt på
// det som kommer inn, broen, interpolering, tegning - er den ekte veien. To
// nettlesere mot produksjonsbasen ville målt det samme og ødelagt en hall for
// en klasse mens den gjorde det.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { BASE, entreHallen, stengHmr } from './lib/rpg-testside.mjs';

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

// Prøven skal ikke skrive en oppdiktet elev inn i et ekte klasserom. Flagget
// leses av `useHubRom` og virker bare i utviklingsmodus: hallen bygges, men
// transporten kobler ikke opp. Medelevene settes inn gjennom `__rpgHub` i
// stedet, i det samme kallet Firebase ville gjort.
await page.addInitScript(() => localStorage.setItem('rpg-uten-nett', '1'));

// ── 1. Navnevakten ──────────────────────────────────────────────────────────
//
// Måles gjennom grensesnittet, ikke mot funksjonen. Det er knappen og
// feilmeldingen eleven møter, og det er de som må virke.

await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
await page.waitForSelector('input#rpg-navn', { timeout: 30000 });

// Fast id, ikke tekst: teksten på knappen bytter med navnevakten.
const startKnapp = () => page.locator('button#rpg-start');
const skrivNavn = async (tekst) => {
    await page.fill('input#rpg-navn', '');
    await page.fill('input#rpg-navn', tekst);
};

await skrivNavn('T');
sjekk('ett tegn er ikke et navn', await startKnapp().isDisabled());

await skrivNavn('www.et-sted.no');
sjekk(
    'en nettadresse slipper ikke gjennom',
    await startKnapp().isDisabled(),
    await page.locator('#rpg-navn-hjelp').innerText()
);

await skrivNavn('Fitte');
sjekk('blokklista tar det åpenbare', await startKnapp().isDisabled());

await skrivNavn('Torstein 123');
sjekk('tall slipper ikke gjennom', await startKnapp().isDisabled());

await skrivNavn('Ragnhild Håkonsdatter');
const kuttet = await page.inputValue('input#rpg-navn');
sjekk('navnet kuttes på seksten tegn', kuttet.length === 16, `${kuttet.length}: «${kuttet}»`);

await skrivNavn('Åse-Marie');
sjekk('norske tegn og bindestrek går fint', await startKnapp().isEnabled());

// ── 2. Inn i hallen ─────────────────────────────────────────────────────────

await entreHallen(page);
await page.waitForFunction(
    () => Boolean(window.__rpg) && Boolean(window.__rpgHub),
    null,
    { timeout: 30000 }
);
// Vent til scenen faktisk er bygget og kamerafaden er ferdig. Headless Chromium
// struper `requestAnimationFrame` når ingenting skjer, så en klokke er ikke nok
// - vi venter på ekte tilstand.
await page.waitForFunction(
    () => {
        const scene = window.__rpg.scene.getScene('verden');
        return Boolean(scene?.scene.isActive()) && window.__rpgStore.getState().sisteSted === 'hub';
    },
    null,
    { timeout: 30000 }
);
await page.waitForTimeout(1600);

// ── 2b. Én scene lytter, ikke to ────────────────────────────────────────────
//
// React kjører oppstartseffekten to ganger under StrictMode: den bygger
// Phaser-spillet, river det, og bygger det på nytt. Ryddet ikke den første
// scenen opp etter seg, blir den liggende igjen som lytter på broen - og neste
// medelev som kommer inn ber en revet renderer om å smi en figur.
//
// Feilen var usynlig fra utsiden: hallen var bare tom, og unntaket pekte på
// Phaser. Derfor telles lytterne her. Er de to, er en scene død og lytter
// fortsatt.
const lyttere = await page.evaluate(
    () => window.__rpgBro.tilSpill.handlers.get('gjester')?.size ?? 0
);
sjekk('nøyaktig én scene lytter på hallen', lyttere === 1, `${lyttere}`);

const gjest = (id, navn, x, y, ekstra = {}) => ({
    id,
    navn,
    x,
    y,
    dir: 'ned',
    positur: 'idle',
    sitter: false,
    emoji: null,
    classId: 'skald',
    appearance: { skin: 0, hair: 0, hairColor: 0, face: 0 },
    rustning: 0,
    sist: Date.now(),
    ...ekstra,
});

const settGjester = (liste) =>
    page.evaluate((l) => window.__rpgHub.settGjester(l), liste);

const oversikt = () =>
    page.evaluate(() => window.__rpg.scene.getScene('verden').gjesteOversikt());

// Hvor eleven selv står, så medelevene kan settes inn i nærheten av kameraet.
const meg = await page.evaluate(() => {
    const s = window.__rpg.scene.getScene('verden');
    return { x: s.helt?.sprite?.x ?? 0, y: s.helt?.sprite?.y ?? 0 };
});

await settGjester([
    gjest('a', 'Gudrun', 200, 260),
    gjest('b', 'Sigurd', 240, 260),
]);
await page.waitForTimeout(300);

let g = await oversikt();
sjekk('to medelever kom inn i hallen', g.length === 2, `${g.length}`);
sjekk(
    'navnene deres følger med',
    g.map((x) => x.navn).sort().join(',') === 'Gudrun,Sigurd',
    g.map((x) => x.navn).join(',')
);

// Et navn som ikke ville passert navnevakten skal ikke kunne komme inn bakveien
// heller. En klient som går utenom grensesnittet kan skrive hva som helst
// reglene godtar, og hallen er ikke stedet det skal vises.
await settGjester([gjest('a', 'Gudrun', 200, 260), gjest('c', 'www.fitte.no', 300, 260)]);
await page.waitForTimeout(300);
g = await oversikt();
const stygg = g.find((x) => x.id === 'c');
sjekk('et ulovlig navn utenfra byttes ut', stygg?.navn === 'Ukjent', stygg?.navn);

// ── 3. Glidningen ───────────────────────────────────────────────────────────
//
// To prøver 200 piksler fra hverandre. Tegnes de rått, står figuren på 500 med
// én gang. Tegnes de med etterslep, ligger den mellom - og det er hele
// forskjellen mellom en medelev og en som blinker.

await settGjester([gjest('d', 'Halldis', 300, 300)]);
await page.waitForTimeout(400);
await settGjester([gjest('d', 'Halldis', 500, 300)]);
// Kort nok til at etterslepet ikke er innhentet ennå.
await page.waitForTimeout(60);

g = await oversikt();
const under = g.find((x) => x.id === 'd');
sjekk(
    'figuren glir, den hopper ikke',
    under !== undefined && under.x > 295 && under.x < 500,
    `x=${under?.x}`
);

// Og den kommer fram. Uten dette ville en prøve på «ligger mellom» også bli
// grønn av en figur som aldri beveger seg.
await page.waitForTimeout(700);
g = await oversikt();
const framme = g.find((x) => x.id === 'd');
sjekk(
    'og den kommer fram dit den skal',
    framme !== undefined && Math.abs(framme.x - 500) < 12,
    `x=${framme?.x}`
);

// Slutter meldingene å komme, skal hun stanse - ikke gli videre ut i skogen.
await page.waitForTimeout(1200);
g = await oversikt();
const stoppet = g.find((x) => x.id === 'd');
sjekk(
    'uten flere meldinger står hun stille',
    stoppet !== undefined && Math.abs(stoppet.x - 500) < 12,
    `x=${stoppet?.x}`
);

// ── 4. Skjul-knappen ────────────────────────────────────────────────────────

await settGjester([gjest('a', 'Gudrun', meg.x + 24, meg.y), gjest('b', 'Sigurd', meg.x - 24, meg.y)]);
// Navnelista i grensesnittet friskes opp én gang i sekundet.
await page.waitForTimeout(1400);

await page.click('button[aria-expanded]');
await page.waitForSelector('button[aria-label="Skjul Gudrun"]', { timeout: 5000 });
await page.click('button[aria-label="Skjul Gudrun"]');
await page.waitForTimeout(300);

g = await oversikt();
sjekk(
    'skjult elev forsvinner fra hallen',
    g.length === 1 && g[0].navn === 'Sigurd',
    g.map((x) => x.navn).join(',')
);

// Nye meldinger skal ikke hente henne tilbake. Det var den feilen som gjorde
// skjul-knappen til en knapp som virket i ett sekund.
await settGjester([gjest('a', 'Gudrun', meg.x + 24, meg.y), gjest('b', 'Sigurd', meg.x - 24, meg.y)]);
await page.waitForTimeout(400);
g = await oversikt();
sjekk('og hun kommer ikke tilbake ved neste melding', g.length === 1, `${g.length}`);

const lagret = await page.evaluate(() => localStorage.getItem('rpg-skjulte'));
sjekk('valget overlever en ny økt', lagret?.includes('"a"') === true, lagret);

await page.click('button[aria-label="Vis Gudrun igjen"]');
await page.waitForTimeout(300);
g = await oversikt();
sjekk('og hun kan hentes fram igjen', g.length === 2, `${g.length}`);

// ── 5. Følelsen ─────────────────────────────────────────────────────────────

await page.click('button[aria-label="Send Hei"]');
await page.waitForTimeout(200);
const folelse = await page.evaluate(() =>
    window.__rpg.scene.getScene('verden').folelseNaa()
);
sjekk('følelsen vises over eget hode', folelse === '👋', String(folelse));

await settGjester([gjest('a', 'Gudrun', meg.x + 24, meg.y, { emoji: '🔥' })]);
await page.waitForTimeout(300);
g = await oversikt();
sjekk('og over de andres', g[0]?.emoji === '🔥', String(g[0]?.emoji));

// Et ikon som ikke er ett av våre skal ikke tegnes. Hjulet er hele
// ytringsfriheten i rommet, og det er med vilje.
await settGjester([gjest('a', 'Gudrun', meg.x + 24, meg.y, { emoji: '🖕' })]);
await page.waitForTimeout(300);
g = await oversikt();
sjekk('et ikon utenfor hjulet slipper ikke gjennom', g[0]?.emoji !== '🖕', String(g[0]?.emoji));

// ── 6. Benken ved bålet ─────────────────────────────────────────────────────
//
// Eleven flyttes med `flyttHelt` i stedet for å gå: å gå tilbake langs
// tidslinjeveien til bålet er en fin opplevelse for en elev og bortkastet tid
// for en måling.

const benk = await page.evaluate(() => {
    const sted = window.__rpgSteder.STED_BY_ID.hub;
    const p = sted.sitteplasser[0];
    return { x: p.tile[0] * 16 + 8, y: p.tile[1] * 16 + 6 };
});

await page.evaluate(
    ({ x, y }) => window.__rpg.scene.getScene('verden').flyttHelt(x, y + 10),
    benk
);
await page.waitForTimeout(400);

const hint = await page.locator('text=E - sett deg').count();
sjekk('benken tilbyr seg', hint > 0);

// Tastetrykket må holdes i over 100 ms. Phasers `Key.onUp` nullstiller
// `_justDown`, så `page.keyboard.press()` blir aldri sett.
const trykkE = async () => {
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(320);
};

await trykkE();
sjekk(
    'eleven setter seg',
    await page.evaluate(() => window.__rpg.scene.getScene('verden').sitterNaa())
);

const sittendeStilling = await page.evaluate(
    () => new Promise((ok) => {
        window.__rpgBro.fraSpill.on('minStilling', ok);
    })
);
sjekk('og de andre får vite det', sittendeStilling.sitter === true, JSON.stringify(sittendeStilling));

await trykkE();
sjekk(
    'og reiser seg igjen',
    (await page.evaluate(() => window.__rpg.scene.getScene('verden').sitterNaa())) === false
);

await page.screenshot({ path: `${UT}/rpg-flerspiller.png` });

// ── 7. Epokene er alene ─────────────────────────────────────────────────────
//
// Den viktigste prøven i fila. Ryker den, kan en klassekamerat spretter rundt i
// bildet midt i det øyeblikket kapittelet er bygget for - og det er ikke en
// feil noen oppdager før den har ødelagt noe.

const nordvik = await page.evaluate(async () => {
    const scene = window.__rpg.scene.getScene('verden');
    scene.bestillReise('nordvik');
    await new Promise((r) => setTimeout(r, 4000));
    const ny = window.__rpg.scene.getScene('verden');
    return {
        sted: window.__rpgStore.getState().sisteSted,
        gjester: ny.gjesteOversikt().length,
        somNa: ny.sitterNaa(),
        hubSom: Boolean(window.__rpgHub),
    };
});
sjekk('eleven kom fram til Nordvik', nordvik.sted === 'nordvik', nordvik.sted);
sjekk('ingen medelever fulgte med inn i epoken', nordvik.gjester === 0, `${nordvik.gjester}`);
sjekk('og det finnes ingen benk å sette seg på', nordvik.somNa === false);
sjekk('nettlaget koblet fra da hun reiste inn', nordvik.hubSom === false);

// ── Oppsummering ────────────────────────────────────────────────────────────

const ekteFeil = sidefeil.filter((t) => !t.includes('favicon') && !t.includes('firebase'));
sjekk('ingen feil i konsollen', ekteFeil.length === 0, ekteFeil.slice(0, 2).join(' | '));

await browser.close();

console.log(feil.length === 0 ? '\nAlt grønt.' : `\n${feil.length} feil: ${feil.join(', ')}`);
process.exit(feil.length === 0 ? 0 : 1);
