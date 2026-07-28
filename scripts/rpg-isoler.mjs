// Isolerer hva hvert lag av pynten koster, i én og samme fane.
//
// Å sammenligne to nettlesere mot hverandre gir for mye støy: maskinen er ulikt
// belastet, og de to utgavene rekker aldri å måles under like forhold. Her slås
// lagene av og på om hverandre i den *samme* økta, flere ganger, og medianen tas
// til slutt. Da er alt annet likt per definisjon.
//
// Tallene er fra headless Chromium, som rasteriserer på CPU-en. Forholdet mellom
// dem er det som betyr noe - ikke tallene i seg selv.

import { chromium } from 'playwright';

const BASE = process.env.RPG_BASE ?? 'http://localhost:5199';
const RUNDER = 3;

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
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate((s) => localStorage.setItem('rpg-minnevokteren-v1', JSON.stringify(s)), LAGRING);
await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas');
await page.waitForTimeout(9000);

/** Slår lagene av og på. `pa` gjelder både shaderen og atmosfære-spritene. */
async function still(shader, atmosfare) {
    await page.evaluate(
        ([medShader, medAtmosfare]) => {
            const scene = window.__rpg.scene.getScene('verden');
            const cam = scene.cameras.main;
            cam.resetPostPipeline();
            if (medShader) cam.setPostPipeline('verdenfx');
            for (const o of scene.children.list) {
                const k = o.texture?.key ?? '';
                if (k === 'fx-taake' || k === 'fx-glimt' || k === 'fx-glo' || k === 'fx-prikk') {
                    o.setVisible(medAtmosfare);
                }
            }
        },
        [shader, atmosfare]
    );
}

async function fps() {
    await page.waitForTimeout(3500);
    const p = [];
    for (let i = 0; i < 8; i++) {
        p.push(await page.evaluate(() => window.__rpg.loop.actualFps));
        await page.waitForTimeout(450);
    }
    return p.sort((a, b) => a - b)[4];
}

const oppsett = [
    ['alt av', false, false],
    ['bare atmosfære', false, true],
    ['bare shader', true, false],
    ['alt på', true, true],
];
const resultat = new Map(oppsett.map(([navn]) => [navn, []]));

for (let r = 0; r < RUNDER; r++) {
    for (const [navn, shader, atmosfare] of oppsett) {
        await still(shader, atmosfare);
        resultat.get(navn).push(await fps());
    }
    console.log(`runde ${r + 1} ferdig`);
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
console.log('');
const grunn = median(resultat.get('alt av'));
for (const [navn] of oppsett) {
    const v = median(resultat.get(navn));
    console.log(
        `${navn.padEnd(18)} ${v.toFixed(1).padStart(6)} fps   ${Math.round((v / grunn) * 100)} %`
    );
}

await browser.close();
