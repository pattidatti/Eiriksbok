// Sammenligner bildefrekvensen på to kjørende utgaver av spillet, vekselvis.
//
// Målingen kjøres i headless Chromium, som rasteriserer på CPU-en. De absolutte
// tallene betyr derfor ingenting - en Chromebook har en ekte, om enn svak, GPU.
// Det som betyr noe er *forholdet*, og for at det skal være til å stole på må de
// to utgavene måles om hverandre: maskinen er ulikt belastet fra minutt til
// minutt, og to målinger etter hverandre sammenligner like mye maskinlast som
// kode.
//
//   node scripts/rpg-sammenlign.mjs <port-A> <port-B> [runder]

import { chromium } from 'playwright';

const portA = process.argv[2] ?? '5198';
const portB = process.argv[3] ?? '5199';
const RUNDER = Number(process.argv[4] ?? 4);

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

async function maal(port) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const base = `http://localhost:${port}`;
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.evaluate((s) => localStorage.setItem('rpg-minnevokteren-v1', JSON.stringify(s)), LAGRING);
    await page.goto(`${base}/oving/rpg`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    // La spillet finne rytmen sin før vi begynner å telle.
    await page.waitForTimeout(9000);

    const prover = [];
    const tegnekall = [];
    for (let i = 0; i < 10; i++) {
        const p = await page.evaluate(() => ({
            fps: window.__rpg.loop.actualFps,
            objekter: window.__rpg.scene.getScene('verden').children.list.length,
        }));
        prover.push(p.fps);
        tegnekall.push(p.objekter);
        await page.waitForTimeout(600);
    }
    await page.close();
    // Median, ikke snitt: en enkelt hikke i operativsystemet skal ikke få lov
    // til å avgjøre hvilken utgave som er raskest.
    const sortert = [...prover].sort((a, b) => a - b);
    return { fps: sortert[Math.floor(sortert.length / 2)], objekter: tegnekall[0] };
}

const a = [];
const b = [];
for (let r = 0; r < RUNDER; r++) {
    a.push(await maal(portA));
    b.push(await maal(portB));
    console.log(`runde ${r + 1}: ${portA} = ${a[r].fps} fps   ${portB} = ${b[r].fps} fps`);
}

const median = (xs) => [...xs].sort((x, y) => x - y)[Math.floor(xs.length / 2)];
const fa = median(a.map((x) => x.fps));
const fb = median(b.map((x) => x.fps));
console.log('');
console.log(`${portA}: ${fa} fps, ${a[0].objekter} objekter i scenen`);
console.log(`${portB}: ${fb} fps, ${b[0].objekter} objekter i scenen`);
console.log(`forhold: ${Math.round((fb / fa) * 100)} % av utgangspunktet`);

await browser.close();
