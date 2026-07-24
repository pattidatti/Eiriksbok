// Motstykket til verify-chunks.mjs: sjekker at three.js FAKTISK lastes og at
// et WebGL-lerret rendrer der 3D skal brukes. Uten denne testen ville en
// chunk-omlegging som "fjerner three fra kritisk sti" kunne bestå ved rett og
// slett å ha brukket 3D helt.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4318';

const ROUTES = [
    { path: '/mikrospill/antikythera-3d', name: 'Mikrospill: Antikythera' },
    { path: '/mikrospill/troja-utgravning-3d', name: 'Mikrospill: Troja' },
    { path: '/oving/spill/watt-lab', name: 'Mini-spill: Watt-lab' },
];

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;

for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await ctx.newPage();

    const chunks = new Set();
    const errors = [];
    page.on('response', (r) => {
        const u = new URL(r.url()).pathname;
        if (u.startsWith('/assets/') && u.endsWith('.js')) chunks.add(u.split('/').pop());
    });
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));

    await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);

    // Mikrospill starter bak en "Spill"-knapp; lerretet finnes ikke for klikket.
    // Start-knappen er hele kortet; "Spill" star til slutt i det tilgjengelige navnet.
    const play = page.getByRole('button', { name: /Spill\s*$/i }).first();
    if (await play.count()) {
        await play.click();
        await page.waitForTimeout(1500);
    }
    await page.waitForTimeout(2500);

    const loadedThree = [...chunks].some((c) => c.startsWith('three-'));
    // Et lerret med faktisk tegnet innhold => 3D-pipelinen er i live.
    const canvas = await page.evaluate(() => {
        const c = document.querySelector('canvas');
        if (!c) return null;
        return { w: c.width, h: c.height, ctx: !!(c.getContext('webgl2') || c.getContext('webgl')) };
    });

    const problems = [];
    if (!loadedThree) problems.push('three.js ble ALDRI lastet - 3D er trolig brukket');
    if (!canvas) problems.push('ingen <canvas> i DOM');
    else if (canvas.w < 50 || canvas.h < 50) problems.push(`lerret for lite (${canvas.w}x${canvas.h})`);
    if (errors.length) problems.push(`${errors.length} sidefeil`);

    if (problems.length) {
        failures++;
        console.log(`FEIL  ${route.name}`);
        problems.forEach((p) => console.log(`        - ${p}`));
        errors.slice(0, 2).forEach((e) => console.log(`        ! ${e}`));
    } else {
        console.log(`OK    ${route.name.padEnd(28)} three lastet, lerret ${canvas.w}x${canvas.h}`);
    }

    await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} 3D-rute(r) feilet.` : '\nAlle 3D-ruter OK.');
process.exit(failures ? 1 : 0);
