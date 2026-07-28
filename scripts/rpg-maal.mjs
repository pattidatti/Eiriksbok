// Måler to ting som et skjermbilde ikke kan svare på:
//
//  1. **Hvor lyst bildet er over tid.** Skyene driver, så ett bilde forteller
//     bare om det tilfeldigvis var sol eller skygge akkurat da. Her tas 24
//     prøver over et halvt minutt, og vi ser på snittet, bunnen og toppen.
//     Bunnen er den som betyr noe: er den for lav, sitter eleven i mørket.
//  2. **Bildefrekvensen.** Alt dette er lagt oppå en Chromebook-baseline.
//
//   node scripts/rpg-maal.mjs [rute-x,rute-y]

import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.env.RPG_BASE ?? 'http://localhost:5199';
const sikte = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
const PROVER = 24;

/**
 * Er dette bildet farget av en kamphendelse?
 *
 * `KampFx` legger et rødt slør over hele skjermen når eleven tar skade, og et
 * hvitt blink ved nivåstigning. Uten denne sperren plukker «det mørkeste
 * bildet» opp et skadeblink i stedet for en skyskygge - og da måler vi kampen,
 * ikke været. Grønt dominerer i Nordvik; er rødt sterkere enn grønt, er det
 * ikke landskapet vi ser på.
 */
function kampfarget(mR, mG) {
    return mR > mG * 1.02;
}

const LAGRING = {
    state: {
        character: {
            name: 'Åsa',
            classId: 'vokter',
            appearance: { skin: 1, hair: 1, hairColor: 0, face: 1 },
        },
        xp: 260,
        hp: 120,
        mana: 60,
        solv: 40,
        sekk: ['ovingssverd'],
        utstyr: { vapen: 'ovingssverd', rustning: null, amulett: null },
        spells: ['minnesglimt'],
        quester: {},
        questForsok: {},
        riktigeSvar: 3,
        galeSvar: 0,
        lest: [],
        bosser: [],
        sisteSone: 'nordvik',
    },
    version: 3,
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('pageerror', (e) => console.log('[sidefeil]', String(e).slice(0, 300)));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate((s) => localStorage.setItem('rpg-minnevokteren-v1', JSON.stringify(s)), LAGRING);
await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas');
await page.waitForTimeout(5000);

if (sikte) {
    await page.evaluate(([tx, ty]) => {
        const cam = window.__rpg.scene.getScene('verden').cameras.main;
        cam.stopFollow();
        cam.centerOn(tx * 16 + 8, ty * 16 + 8);
    }, sikte);
    await page.waitForTimeout(1000);
}

const lysstyrker = [];
const fps = [];
const fugler = [];

for (let i = 0; i < PROVER; i++) {
    // Lysstyrken måles på et skjermbilde, ikke på lerretet inne i sida.
    // `drawImage` av et WebGL-lerret gir svart med mindre konteksten er laget
    // med `preserveDrawingBuffer`, og den innstillingen koster ytelse i selve
    // spillet. Playwright leser det ferdig sammensatte bildet i stedet.
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: 1366, height: 700 } });
    const { data, info } = await sharp(png)
        .resize(64, 36, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });
    let sum = 0;
    let sR = 0;
    let sG = 0;
    for (let p = 0; p < data.length; p += info.channels) {
        sum += 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
        sR += data[p];
        sG += data[p + 1];
    }
    const piksler = data.length / info.channels;

    const prove = await page.evaluate(() => {
        const game = window.__rpg;
        const scene = game.scene.getScene('verden');
        return {
            fps: game.loop.actualFps,
            fugler: scene.children.list.filter((o) => o.texture?.key === 'fx-fugl').length,
        };
    });
    if (!kampfarget(sR / piksler, sG / piksler)) lysstyrker.push(sum / piksler / 255);
    fps.push(prove.fps);
    fugler.push(prove.fugler);
    await page.waitForTimeout(1300);
}

const snitt = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const rund = (v) => Math.round(v * 1000) / 1000;

console.log(
    JSON.stringify(
        {
            lysstyrke: {
                snitt: rund(snitt(lysstyrker)),
                bunn: rund(Math.min(...lysstyrker)),
                topp: rund(Math.max(...lysstyrker)),
                // Spennet er selve poenget: uten variasjon driver ingen skyer.
                spenn: rund(Math.max(...lysstyrker) - Math.min(...lysstyrker)),
            },
            fps: { snitt: Math.round(snitt(fps)), bunn: Math.round(Math.min(...fps)) },
            fugler: { maks: Math.max(...fugler), proverMedFugl: fugler.filter((f) => f > 0).length },
        },
        null,
        2
    )
);

await browser.close();
