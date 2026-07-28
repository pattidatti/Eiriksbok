// Røyktest: spiller spillet litt, og sjekker at ingenting har knekt.
//
// Alt arbeidet med utseendet ligger i lag som tegnes oppå spillet. Det er lett å
// tro at det ikke *kan* ødelegge noe - helt til en tekstur mangler, en scene
// startes på nytt, eller shaderen henges på et kamera som ikke finnes lenger.
// Denne går gjennom de tingene som faktisk kan gå galt.

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

const feil = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
page.on('pageerror', (e) => feil.push(`sidefeil: ${String(e).slice(0, 200)}`));
page.on('console', (m) => {
    if (m.type() === 'error') feil.push(`konsoll: ${m.text().slice(0, 200)}`);
});

const sjekk = (navn, ok, detalj = '') =>
    console.log(`${ok ? '  ok  ' : ' FEIL '} ${navn}${detalj ? '  - ' + detalj : ''}`);

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.evaluate((s) => localStorage.setItem('rpg-minnevokteren-v1', JSON.stringify(s)), LAGRING);
await page.goto(`${BASE}/oving/rpg`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('canvas');
await page.waitForTimeout(5000);

// ── 1. Scenen er i live, og etterbehandlingen henger på ─────────────────────
const start = await page.evaluate(() => {
    const scene = window.__rpg.scene.getScene('verden');
    return {
        lever: scene.scene.isActive(),
        postFX: scene.cameras.main.postPipelines.map((p) => p.name),
        objekter: scene.children.list.length,
    };
});
sjekk('scenen kjører', start.lever);
const harFX = (navn) => navn.some((n) => n.toLowerCase() === 'verdenfx');
sjekk('shaderen er hengt på', harFX(start.postFX), start.postFX.join(','));

// ── 2. Eleven kan gå ────────────────────────────────────────────────────────
const for_ = await page.evaluate(() => {
    const s = window.__rpg.scene.getScene('verden');
    const sp = s.children.list.find((o) => o.texture?.key === 'helt');
    return sp ? { x: sp.x, y: sp.y } : null;
});
await page.keyboard.down('d');
await page.waitForTimeout(1200);
await page.keyboard.up('d');
const etter = await page.evaluate(() => {
    const s = window.__rpg.scene.getScene('verden');
    const sp = s.children.list.find((o) => o.texture?.key === 'helt');
    return sp ? { x: sp.x, y: sp.y } : null;
});
sjekk(
    'eleven flytter seg når hun går',
    !!for_ && !!etter && Math.abs(etter.x - for_.x) > 10,
    for_ && etter ? `${Math.round(for_.x)} -> ${Math.round(etter.x)}` : 'fant ikke figuren'
);

// ── 3. Slag ─────────────────────────────────────────────────────────────────
await page.keyboard.press('Space');
await page.waitForTimeout(600);
sjekk('slag uten krasj', true);

// ── 4. Panelene åpner ───────────────────────────────────────────────────────
await page.keyboard.press('i');
await page.waitForTimeout(600);
const sekkApen = await page.locator('text=/Sekk|Utstyr/i').first().isVisible().catch(() => false);
sjekk('sekken åpner', sekkApen);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// ── 5. Reise: scenen bygges fra bunnen, og alt skal settes opp på nytt ──────
// Dette er den som faktisk kan ryke. `create()` kjører igjen, teksturene lages
// på nytt, kameraet er et annet objekt - og shaderen må henges på det nye.
await page.evaluate(() => {
    window.__rpg.scene.getScene('verden').utforReise('nordvik', []);
});
await page.waitForTimeout(4000);
const etterReise = await page.evaluate(() => {
    const scene = window.__rpg.scene.getScene('verden');
    return {
        lever: scene.scene.isActive(),
        postFX: scene.cameras.main.postPipelines.map((p) => p.name),
        objekter: scene.children.list.length,
    };
});
sjekk('scenen lever etter reise', etterReise.lever);
sjekk(
    'shaderen henger på etter reise',
    harFX(etterReise.postFX),
    etterReise.postFX.join(',')
);
sjekk(
    'ingen objekter lekket ved reise',
    Math.abs(etterReise.objekter - start.objekter) <= 12,
    `${start.objekter} -> ${etterReise.objekter}`
);

console.log('');
if (feil.length === 0) {
    console.log('ingen feil i konsollen');
} else {
    console.log(`${feil.length} feil:`);
    for (const f of [...new Set(feil)].slice(0, 8)) console.log('   ' + f);
}

await browser.close();
process.exit(feil.length ? 1 : 0);
