// Engangs-verifisering av chunk-omleggingen i vite.config.ts.
// Driver appen i en ekte nettleser og sjekker to ting per rute:
//   1. at siden faktisk rendrer uten konsoll-feil
//   2. hvilke JS-chunks som lastes - three.js skal IKKE lastes på tekstsider,
//      men SKAL lastes når et 3D-mikrospill åpnes.
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://localhost:4318';

const ROUTES = [
    { path: '/', name: 'Forside', three: false },
    { path: '/historie', name: 'Fag: Historie', three: false },
    { path: '/historie/vikingtiden', name: 'Emne: Vikingtiden', three: false },
    { path: '/tidslinje', name: 'Tidslinje', three: false },
    { path: '/min-laering', name: 'Min laering', three: false },
    { path: '/oving/flashcards', name: 'Flashcards', three: false },
    { path: '/sok', name: 'Sok', three: false },
];

const browser = await chromium.launch();
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
    page.on('console', (m) => {
        // GitHub Pages serverer 404.html med status 404 for alle SPA-dyplenker
        // (copy-404.js-monsteret). Siden rendrer normalt; konsoll-stoyen fra
        // selve dokumentforespørselen er forventet og skal ikke telle som feil.
        const isSpaFallback404 =
            m.text().includes('status of 404') && route.path !== '/';
        if (m.type() === 'error' && !isSpaFallback404) errors.push(m.text().slice(0, 160));
    });
    page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.slice(0, 160)));

    await page.goto(BASE + route.path, { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200);

    const text = (await page.locator('body').innerText()).trim();
    const loadedThree = [...chunks].some((c) => c.startsWith('three-'));

    const problems = [];
    if (text.length < 80) problems.push(`tom side (${text.length} tegn tekst)`);
    if (loadedThree !== route.three)
        problems.push(loadedThree ? 'three.js lastet unodig' : 'three.js manglet');
    if (errors.length) problems.push(`${errors.length} konsoll-feil`);

    if (problems.length) {
        failures++;
        console.log(`FEIL  ${route.name.padEnd(22)} ${route.path}`);
        problems.forEach((p) => console.log(`        - ${p}`));
        errors.slice(0, 3).forEach((e) => console.log(`        ! ${e}`));
    } else {
        console.log(
            `OK    ${route.name.padEnd(22)} ${String(chunks.size).padStart(3)} chunks, ${text.length} tegn tekst`
        );
    }

    await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} rute(r) feilet.` : '\nAlle ruter OK.');
process.exit(failures ? 1 : 0);
