// Prøver utstyrssystemet i Prøvebanen, i en ekte nettleser.
//
//   npm run dev                          # i et annet skall
//   node scripts/verify-rpg-utstyr.mjs
//
// Det som måles er det eleven gjør, i den rekkefølgen hun gjør det:
//
//   1. kjøper hos Bergljot, og varen havner i sekken
//   2. tar på med høyreklikk, og med å dra til plassen på figuren
//   3. spiser fra hurtigbaren med tast 1
//   4. sliter et våpen i stykker, og får det reparert hos kremmeren
//   5. selger med høyreklikk i boden
//   6. et lagret spill fra før utstyrssystemet lastes uten å miste noe

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
    reducedMotion: 'reduce',
});
const sidefeil = [];
page.on('console', (m) => m.type() === 'error' && sidefeil.push(m.text()));
page.on('pageerror', (e) => sidefeil.push(String(e)));

await stengHmr(page);
await entreHallen(page);
await page.waitForFunction(() => Boolean(window.__rpgStore), null, { timeout: 30000 });
await page.waitForTimeout(2600);

const tilstand = () =>
    page.evaluate(() => {
        const s = window.__rpgStore.getState();
        return { sekk: s.sekk, utstyr: s.utstyr, hurtigbar: s.hurtigbar, hp: s.hp, solv: s.solv };
    });
const trykkE = async () => {
    await page.keyboard.down('e');
    await page.waitForTimeout(160);
    await page.keyboard.up('e');
    await page.waitForTimeout(700);
};
const staaPaa = async (tx, ty) => {
    await page.evaluate(
        ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x * 16 + 8, y * 16 + 8),
        [tx, ty]
    );
    await page.waitForTimeout(500);
};
const rute = (i) => page.locator(`[data-rute="sekk:${i}"]`);
const finnRute = async (id) => (await tilstand()).sekk.findIndex((g) => g?.id === id);

// ── Inn i Prøvebanen ────────────────────────────────────────────────────────
const portal = (
    await page.evaluate(() => window.__rpg.scene.getScene('verden').portalOversikt())
).find((p) => p.tittel === 'TEST MEG');
await page.evaluate(
    ([x, y]) => window.__rpg.scene.getScene('verden').flyttHelt(x, y + 10),
    [portal.x, portal.y]
);
await page.waitForTimeout(700);
await trykkE();
await page.waitForFunction(
    () =>
        window.__rpgStore.getState().sisteSted === 'testbanen' &&
        !window.__rpg.scene.getScene('verden').cameras.main.fadeEffect.isRunning,
    null,
    { timeout: 20000 }
);
await page.evaluate(() => window.__rpgStore.getState().giSolv(2000));

const start = await tilstand();
sjekk(
    'hun begynner med sverd og skjold på',
    start.utstyr.vapen?.id === 'ovingssverd' && start.utstyr.skjold?.id === 'treningsskjold',
    `${start.utstyr.vapen?.id}, ${start.utstyr.skjold?.id}`
);
sjekk('sekken har tjue ruter', start.sekk.length === 20, String(start.sekk.length));

// ── 1. Kjøp ─────────────────────────────────────────────────────────────────
await staaPaa(15, 23);
await trykkE();
sjekk('boden åpner', (await page.getByText(/Reparer alt|Alt er helt/).count()) > 0);
await page.locator('li button', { hasText: 'Jernhjelm' }).click();
await page.locator('li button', { hasText: 'Bjørnepels' }).click();
await page.locator('li button', { hasText: 'Høye lærstøvler' }).click();
await page.getByRole('button', { name: 'Kjøp fem Flatbrød' }).click();
await page.waitForTimeout(300);
const kjopt = await tilstand();
sjekk(
    'varene ligger i sekken',
    ['jernhjelm', 'bjornepels', 'larstovler'].every((id) => kjopt.sekk.some((g) => g?.id === id)),
    kjopt.sekk
        .filter(Boolean)
        .map((g) => g.id)
        .join(', ')
);
const brod = kjopt.sekk.find((g) => g?.id === 'flatbrod');
sjekk('fem flatbrød i én stabel', brod?.antall === 5, JSON.stringify(brod));
sjekk(
    'flatbrødet la seg på hurtigbaren',
    kjopt.hurtigbar[0] === 'flatbrod',
    kjopt.hurtigbar.join(',')
);
sjekk('sølvet ble trukket', kjopt.solv < 2000, `${kjopt.solv}`);
await page.screenshot({ path: `${UT}/utstyr-1-boden.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 2. Ta på ────────────────────────────────────────────────────────────────
await page.keyboard.press('i');
await page.waitForTimeout(600);
await rute(await finnRute('jernhjelm')).click({ button: 'right' });
await page.waitForTimeout(300);
sjekk('høyreklikk tok på hjelmen', (await tilstand()).utstyr.hode?.id === 'jernhjelm');

// Dra pelsen til kappeplassen. Musa beveger seg i små steg, ellers ser
// dnd-kit aldri at det er et drag.
const fra = await rute(await finnRute('bjornepels')).boundingBox();
const til = await page.locator('[data-rute="slot:kappe"]').boundingBox();
await page.mouse.move(fra.x + fra.width / 2, fra.y + fra.height / 2);
await page.mouse.down();
for (let i = 1; i <= 12; i++) {
    await page.mouse.move(
        fra.x + fra.width / 2 + ((til.x - fra.x) * i) / 12,
        fra.y + fra.height / 2 + ((til.y - fra.y) * i) / 12
    );
    await page.waitForTimeout(16);
}
// Selve ruta, ikke hjørnet av den.
for (const [x, y] of [[til.x + til.width / 2, til.y + til.height / 2]]) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(16);
}
await page.mouse.up();
await page.waitForTimeout(400);
sjekk('pelsen ble dratt på', (await tilstand()).utstyr.kappe?.id === 'bjornepels');

await rute(await finnRute('larstovler')).click({ button: 'right' });
await page.waitForTimeout(300);

// Verktøytipset med sammenligning.
await rute(await finnRute('flatbrod')).hover();
await page.waitForTimeout(300);
sjekk(
    'verktøytipset viser hva maten gir',
    (await page.locator('[role=tooltip]').textContent())?.includes('liv tilbake')
);
await page.screenshot({ path: `${UT}/utstyr-2-figuren.png` });

// Skjoldet i kampen følger skjoldplassen.
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.evaluate(() => {
    const s = window.__rpgStore.getState();
    s.leggISekk('jernskodd-rundskjold', 1, true);
    s.utrust(window.__rpgStore.getState().sekk.findIndex((g) => g?.id === 'jernskodd-rundskjold'));
});
await page.waitForTimeout(300);
const vern = await page.evaluate(() => window.__rpg.scene.getScene('verden').helt.kamp.vern.id);
sjekk('kampen bruker skjoldet hun har på', vern === 'jernskodd-rundskjold', vern);

// ── 3. Hurtigbaren ──────────────────────────────────────────────────────────
await page.evaluate(() => window.__rpgStore.getState().settHp(10));
await page.keyboard.press('1');
await page.waitForTimeout(300);
const spist = await tilstand();
sjekk('tast 1 spiste et flatbrød', spist.hp === 25, `${spist.hp} liv`);
sjekk(
    'stabelen ble mindre',
    spist.sekk.find((g) => g?.id === 'flatbrod')?.antall === 4,
    JSON.stringify(spist.sekk.find((g) => g?.id === 'flatbrod'))
);
sjekk('hurtigbaren står i HUD-en', (await page.locator('[data-prove="hurtigbar"]').count()) === 1);

// Figuren i verden, nær nok til å se delene.
await page.evaluate(() => window.__rpg.scene.getScene('verden').cameras.main.setZoom(6));
await page.waitForTimeout(400);
await page.screenshot({ path: `${UT}/utstyr-3-figuren-i-verden.png` });
await page.evaluate(() => window.__rpg.scene.getScene('verden').cameras.main.setZoom(3));

// ── 4. Slitasje og reparasjon ───────────────────────────────────────────────
await page.evaluate(() => {
    const s = window.__rpgStore.getState();
    window.__rpgStore.setState({
        utstyr: { ...s.utstyr, vapen: { ...s.utstyr.vapen, holdbarhet: 1 } },
    });
    window.__rpgStore.getState().slit('vapen');
});
const slitt = await tilstand();
sjekk('våpenet er ødelagt', slitt.utstyr.vapen?.holdbarhet === 0);
const hel = await page.evaluate(() => window.__rpgStore.getState().utstyr.hode);
sjekk('hjelmen er fortsatt hel', hel?.holdbarhet === undefined);

await page.evaluate(() => window.__rpgStore.getState().dodsslitasje());
const etterDod = await tilstand();
sjekk(
    'døden slet på hjelmen',
    typeof etterDod.utstyr.hode?.holdbarhet === 'number' && etterDod.utstyr.hode.holdbarhet < 68,
    JSON.stringify(etterDod.utstyr.hode)
);

await staaPaa(15, 23);
await trykkE();
const forReparasjon = (await tilstand()).solv;
await page.locator('button', { hasText: 'Reparer alt' }).click();
await page.waitForTimeout(300);
const reparert = await tilstand();
sjekk(
    'reparert',
    reparert.utstyr.vapen?.holdbarhet === undefined &&
        reparert.utstyr.hode?.holdbarhet === undefined
);
sjekk('reparasjonen kostet', reparert.solv < forReparasjon, `${forReparasjon} -> ${reparert.solv}`);

// ── 5. Salg ─────────────────────────────────────────────────────────────────
const selgRute = reparert.sekk.findIndex((g) => g?.id === 'treningsskjold');
await rute(selgRute).click({ button: 'right' });
await page.waitForTimeout(300);
const solgt = await tilstand();
sjekk(
    'høyreklikk i boden solgte skjoldet',
    solgt.sekk[selgRute] === null && solgt.solv > reparert.solv
);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);

sjekk('ingen konsollfeil', sidefeil.length === 0, sidefeil.slice(0, 2).join(' | '));

// ── 6. Et gammelt lagret spill ──────────────────────────────────────────────
//
// Før utstyrssystemet var sekken en liste med id-er og utstyret én id per
// plass. Slik står det hos alle som har spilt. Ingenting skal forsvinne.
const gammel = await browser.newPage({ viewport: { width: 1366, height: 768 } });
await stengHmr(gammel);
await gammel.addInitScript(() =>
    localStorage.setItem(
        'rpg-minnevokteren-v1',
        JSON.stringify({
            version: 5,
            state: {
                version: 5,
                spiller: {
                    character: {
                        name: 'Gammel',
                        kjortel: 1,
                        appearance: { skin: 0, hair: 0, hairColor: 0, face: 0 },
                    },
                },
                sisteEpoke: 'vikingtiden',
                epoker: {
                    vikingtiden: {
                        kapittel: 1,
                        sisteSted: 'hub',
                        kapittelState: {
                            hp: 50,
                            xp: 0,
                            solv: 7,
                            sekk: ['sagasverd', 'sagasverd', 'kvernstein'],
                            utstyr: { vapen: 'ovingssverd', rustning: 'lerbrynje', amulett: null },
                        },
                    },
                },
            },
        })
    )
);
await gammel.goto(`${BASE}/oving/rpg`, { waitUntil: 'networkidle' });
await gammel.waitForFunction(() => Boolean(window.__rpgStore), null, { timeout: 30000 });
const lastet = await gammel.evaluate(() => {
    const s = window.__rpgStore.getState();
    return { sekk: s.sekk, utstyr: s.utstyr };
});
sjekk(
    'den gamle sekken ble ruter',
    lastet.sekk.length === 20 &&
        lastet.sekk
            .filter(Boolean)
            .map((g) => g.id)
            .join(',') === 'sagasverd,sagasverd,kvernstein'
);
sjekk(
    'det gamle utstyret sitter på',
    lastet.utstyr.vapen?.id === 'ovingssverd' &&
        lastet.utstyr.rustning?.id === 'lerbrynje' &&
        lastet.utstyr.hode === null
);

await browser.close();
console.log(feil.length ? `\n${feil.length} feil: ${feil.join(', ')}` : '\nAlt grønt.');
process.exit(feil.length ? 1 : 0);
