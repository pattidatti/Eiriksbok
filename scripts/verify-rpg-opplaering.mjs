// Driver kampopplæringen mot Ravn i en ekte nettleser.
//
//   npm run dev                              # i et annet skall
//   node scripts/verify-rpg-opplaering.mjs
//
// Skriptet måler det som er lett å ødelegge uten at noe krasjer:
//
//   - at Ravn i det hele tatt reiser seg, med navn over hodet
//   - at NPC-en hans forsvinner mens kamp-Ravn står der (ellers kan eleven
//     starte timen på nytt midt i den)
//   - at han ikke slår i første økt (`fredelig`)
//   - at han ikke kan drepes, og at eleven ikke kan dø
//   - at oppgavekortet teller riktig, og at det forsvinner til slutt
//   - at steget og «Min læring»-konteringen bare skjer én gang
//
// Kampen står ikke stille mens vi måler: pusten går, og Ravn slår fra og med
// andre økt. Prøvene leser derfor tilstand fra scenen, ikke fra klokka.

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

await stengHmr(page);
await entreNordvik(page);
await page.waitForTimeout(2600);

/** Alt vi trenger å vite om Ravn, lest rett fra scenen. */
const ravn = () =>
    page.evaluate(() => {
        const scene = window.__rpg?.scene.getScene('verden');
        const f = scene?.fiendeSystem?.alle().find((e) => e.navn === 'Ravn' && !e.dodd);
        if (!f) return null;
        return {
            hp: f.hp,
            maksHp: f.maksHp,
            udodelig: Boolean(f.udodelig),
            fredelig: Boolean(f.fredelig),
            varsel: f.varsel ?? f.def.varsel,
            tilstand: f.tilstand,
            x: f.sprite.x,
            y: f.sprite.y,
        };
    });

const store = () =>
    page.evaluate(() => {
        const s = window.__rpgStore?.getState();
        return s ? { steg: s.steg, hp: s.hp } : null;
    });

// Kortet leses i små bokstaver. Tittelen er versalisert i CSS, så `innerText`
// gir «ØKT 1 AV 4» - en prøve som leter etter «økt 1» ville alltid slått ut.
const oppgavekort = async () => {
    const el = await page.$('[data-prove="oppgave"]');
    return el ? (await el.innerText()).replace(/\s+/g, ' ').trim().toLowerCase() : null;
};

// ── Timen begynner ──────────────────────────────────────────────────────────
//
// Eleven settes ned ved siden av Ravn i stedet for å gå dit. Åtte sekunder
// gange er en fin opplevelse for en elev og bortkastet tid for en måling.
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.flyttHelt(20 * 16 + 8, 32 * 16 + 8);
});
await page.waitForTimeout(400);
await page.keyboard.down('e');
await page.waitForTimeout(160);
await page.keyboard.up('e');
await page.waitForTimeout(600);

const dialogApen = await page.$('text=Vis meg');
sjekk('Ravn tilbyr opplæringen', Boolean(dialogApen));
if (dialogApen) await dialogApen.click();
await page.waitForTimeout(900);

const r1 = await ravn();
sjekk('Ravn står på tunet', Boolean(r1), r1 ? `hp ${r1.hp}/${r1.maksHp}` : 'ingen Ravn');
sjekk('Ravn kan ikke dø', Boolean(r1?.udodelig));
sjekk('Første økt: han slår ikke', Boolean(r1?.fredelig));
sjekk('Første økt: 700 ms varsel', r1?.varsel === 700, `varsel ${r1?.varsel}`);

const npcSkjult = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    return scene?.samhandling?.sprite('ravn')?.visible === false;
});
sjekk('NPC-Ravn er borte mens kamp-Ravn står der', npcSkjult);

sjekk('Oppgavekortet står', (await oppgavekort())?.includes('økt 1'), await oppgavekort());

// ── Første økt: tre slag ────────────────────────────────────────────────────
//
// Retningen må settes først. Ravn står nord for eleven, og figuren slår i den
// retningen hun vender - står hun med ryggen til, treffer ingenting, og
// telleren står stille uten at noe er galt med opplæringen.
// Mellom slagene settes hun ned rett sør for Ravn og vendes mot ham.
//
// Det er en måling, ikke en spilleøkt: går hun selv, kaster tilbakestøtet ham
// bakover og hun går forbi ham, og da svinger hun i lufta nordover mens han
// står i sør. En elev retter det opp på et halvt sekund. En prøve som gjør det
// samme, måler tilfeldigheter.
for (let i = 0; i < 12; i++) {
    const r = await ravn();
    if (!r) break;
    await page.evaluate(([x, y]) => {
        const scene = window.__rpg?.scene.getScene('verden');
        scene?.flyttHelt(x, y);
    }, [r.x, r.y + 18]);
    await page.keyboard.down('w');
    await page.waitForTimeout(120);
    await page.keyboard.up('w');
    await page.keyboard.down(' ');
    await page.waitForTimeout(130);
    await page.keyboard.up(' ');
    await page.waitForTimeout(380);
    const kort = await oppgavekort();
    if (kort && !kort.includes('økt 1')) break;
}
await page.waitForTimeout(400);
const r2 = await ravn();
sjekk('Ravn overlevde økt 1', Boolean(r2) && (r2?.hp ?? 0) >= 1, `hp ${r2?.hp}`);
sjekk('Økta gikk videre', !(await oppgavekort())?.includes('økt 1'), await oppgavekort());

await page.screenshot({ path: `${UT}/rpg-opplaering.png` });

// ── Eleven kan ikke dø under timen ──────────────────────────────────────────
await page.evaluate(() => window.__rpgStore?.setState({ hp: 4 }));
await page.waitForTimeout(6000);
const s = await store();
sjekk('Eleven bunner ut på ett liv, hun dør ikke', (s?.hp ?? 0) >= 1, `liv ${s?.hp}`);
const dodsskjerm = await page.$('text=Tåka tok deg');
sjekk('Ingen dødsskjerm under opplæringen', !dodsskjerm);

// ── Timen avsluttes ─────────────────────────────────────────────────────────
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.opplaering?.avslutt();
});
await page.waitForTimeout(600);

sjekk('Ravn er hentet inn', !(await ravn()));
sjekk('Oppgavekortet er borte', (await oppgavekort()) === null);
const npcTilbake = await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    return scene?.samhandling?.sprite('ravn')?.visible === true;
});
sjekk('NPC-Ravn står der igjen', npcTilbake);

const etter = await store();
sjekk('Steget er ført', etter?.steg?.includes('k1-ravn'), JSON.stringify(etter?.steg));
sjekk(
    'Puzzlet er kontert én gang',
    etter?.steg?.filter((x) => x === 'puzzle:kampopplaering').length === 1
);

// Å avslutte to ganger skal ikke kontere to ganger.
await page.evaluate(() => {
    const scene = window.__rpg?.scene.getScene('verden');
    scene?.opplaering?.avslutt();
});
await page.waitForTimeout(300);
const igjen = await store();
sjekk(
    'Andre avslutning konterer ikke på nytt',
    igjen?.steg?.filter((x) => x === 'puzzle:kampopplaering').length === 1
);

sjekk('Ingen konsollfeil', konsollfeil.length === 0, konsollfeil.slice(0, 2).join(' | '));

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
