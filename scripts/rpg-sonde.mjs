// Sonde: spør den kjørende scenen hva den faktisk har bygget.
//
// Et skjermbilde sier at noe ikke er synlig. Det sier ikke om det mangler, om
// det står utenfor bildet, eller om det er tegnet med feil dybde. Denne henter
// tallene rett ut av Phaser i stedet for at vi gjetter.

import { chromium } from 'playwright';

const BASE = process.env.RPG_BASE ?? 'http://localhost:5199';

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
await page.waitForTimeout(6000);

const rapport = await page.evaluate(() => {
    const game = window.__rpg;
    const scene = game.scene.getScene('verden');
    const cam = scene.cameras.main;
    const syn = cam.worldView;
    const alle = scene.children.list;

    const iBildet = (o) =>
        o.getBounds &&
        Phaser.Geom.Rectangle.Overlaps(o.getBounds(), new Phaser.Geom.Rectangle(syn.x, syn.y, syn.width, syn.height));

    const tell = (tekstur) =>
        alle.filter((o) => o.texture && o.texture.key && o.texture.key.startsWith(tekstur));

    const oppsummer = (navn, tekstur) => {
        const liste = tell(tekstur);
        const synlige = liste.filter(iBildet);
        return {
            navn,
            antall: liste.length,
            iBildet: synlige.length,
            eksempel: liste[0]
                ? {
                      x: Math.round(liste[0].x),
                      y: Math.round(liste[0].y),
                      skalaX: +liste[0].scaleX.toFixed(2),
                      bredde: Math.round(liste[0].displayWidth),
                      alfa: +liste[0].alpha.toFixed(3),
                      dybde: liste[0].depth,
                  }
                : null,
        };
    };

    return {
        renderer: game.renderer.type === Phaser.WEBGL ? 'webgl' : 'canvas',
        postFX: cam.postPipelines.map((p) => p.name),
        kamera: {
            zoom: cam.zoom,
            syn: [Math.round(syn.x), Math.round(syn.y), Math.round(syn.width), Math.round(syn.height)],
        },
        visningsliste: alle.length,
        lag: [
            oppsummer('skyskygge', 'fx-skyskygge'),
            oppsummer('høysky', 'fx-hoysky'),
            oppsummer('tåke', 'fx-taake'),
            oppsummer('glitter', 'fx-glimt'),
        ],
        partikler: alle.filter((o) => o.type === 'ParticleEmitter').length,
    };
});

console.log(JSON.stringify(rapport, null, 2));
await browser.close();
