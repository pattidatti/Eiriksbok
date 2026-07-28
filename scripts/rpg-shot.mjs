// Skjermbilder av rollespillet, uten å klikke seg gjennom karakterskaperen.
//
//   node scripts/rpg-shot.mjs <merkelapp> [stedId]
//
// Seeder localStorage med en ferdig karakter, laster /oving/rpg, og lar spillet
// gå noen sekunder så tåka rekker å drive og vannet å skvulpe. Bildene havner i
// .screenshots/ og skal aldri committes.

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const merkelapp = process.argv[2] ?? 'rpg';
const stedId = process.argv[3] ?? 'nordvik';
// Valgfritt: «rute-x,rute-y». Slipper kameraet fra spilleren og sikter det mot
// et bestemt sted på kartet, så tingplassen og fjorden kan revideres uten at
// noen må gå dit for hånd.
const sikte = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
if (sikte && (sikte.length !== 2 || sikte.some(Number.isNaN))) {
    console.error(`ugyldig sikte: «${process.argv[4]}». Ventet «rute-x,rute-y».`);
    process.exit(1);
}
const BASE = process.env.RPG_BASE ?? 'http://localhost:5199';
const UT = '.screenshots';

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
// Chromebook-oppløsningen er fasiten, ikke full-HD.
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

page.on('console', (m) => {
    if (m.type() === 'error') console.log('  [konsoll]', m.text().slice(0, 300));
});
page.on('pageerror', (e) => console.log('  [sidefeil]', String(e).slice(0, 300)));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate((s) => {
    localStorage.setItem('rpg-minnevokteren-v1', JSON.stringify(s));
}, LAGRING);

await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas', { timeout: 30000 });
// La verden bygge seg ferdig og kamerainntoningen gå ut.
await page.waitForTimeout(5000);

if (sikte) {
    await page.evaluate(([tx, ty]) => {
        const cam = window.__rpg.scene.getScene('verden').cameras.main;
        cam.stopFollow();
        cam.centerOn(tx * 16 + 8, ty * 16 + 8);
    }, sikte);
    await page.waitForTimeout(1200);
}

// Flere bilder med mellomrom. Ett enkelt bilde lyver om et landskap der skyene
// driver: det fanger enten en solflekk eller en skygge, og sier ingenting om
// hvordan det ser ut resten av tiden.
for (let i = 1; i <= 3; i++) {
    const fil = `${UT}/${merkelapp}-${i}.png`;
    await page.screenshot({ path: fil });
    console.log('skrev', fil);
    if (i < 3) await page.waitForTimeout(7000);
}

await browser.close();
