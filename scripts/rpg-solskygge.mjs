// Fanger det samme stedet i sol og i skygge.
//
// Skydekket driver, så to bilder tatt tilfeldig kan begge treffe sola eller
// begge treffe skyggen. Her tas mange bilder på rad, og de to ytterpunktene
// beholdes: det lyseste og det mørkeste. Det er den eneste ærlige måten å vise
// hva et drivende skydekke faktisk gjør med et stillestående landskap.
//
// Argumentene er de samme som `rpg-shot.mjs`, med vilje: to verktøy som gjør
// nesten det samme og tar argumentene i ulik rekkefølge er en felle, og den gikk
// jeg selv i - «nordvik» ble tolket som koordinater, kameraet fikk NaN, og
// resultatet var et tomt lerret uten en eneste feilmelding.
//
//   node scripts/rpg-solskygge.mjs <merkelapp> [stedId] [rute-x,rute-y]

import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const merkelapp = process.argv[2] ?? 'solskygge';
const stedId = process.argv[3] ?? 'nordvik';
const sikte = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
if (sikte && (sikte.length !== 2 || sikte.some(Number.isNaN))) {
    console.error(`ugyldig sikte: «${process.argv[4]}». Ventet «rute-x,rute-y».`);
    process.exit(1);
}
const BASE = process.env.RPG_BASE ?? 'http://localhost:5199';
const UT = '.screenshots';
const PROVER = 34;

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
        sisteSone: stedId,
    },
    version: 3,
};

await mkdir(UT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('pageerror', (e) => console.log('[sidefeil]', String(e).slice(0, 400)));
page.on('console', (m) => {
    if (m.type() === 'error') console.log('[konsoll]', m.text().slice(0, 400));
});

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

let lysest = { lys: -1, png: null };
let morkest = { lys: 2, png: null };
let forkastet = 0;

for (let i = 0; i < PROVER; i++) {
    const png = await page.screenshot();
    const { data, info } = await sharp(png)
        .resize(48, 27, { fit: 'fill' })
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
    const n = data.length / info.channels;
    if (!kampfarget(sR / n, sG / n)) {
        const lys = sum / n / 255;
        if (lys > lysest.lys) lysest = { lys, png };
        if (lys < morkest.lys) morkest = { lys, png };
    } else {
        forkastet += 1;
    }
    await page.waitForTimeout(1100);
}

await writeFile(`${UT}/${merkelapp}-sol.png`, lysest.png);
await writeFile(`${UT}/${merkelapp}-skygge.png`, morkest.png);
console.log(
    `sol ${lysest.lys.toFixed(3)}  skygge ${morkest.lys.toFixed(3)}  ` +
        `spenn ${(lysest.lys - morkest.lys).toFixed(3)}  ` +
        `(${forkastet} bilder forkastet som kampfarget)`
);

await browser.close();
