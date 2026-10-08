#!/usr/bin/env node
// Skjermbilder av en artikkelfilm: ett bilde per replikk (scene x beat), kontaktark per
// scene, og en kort ekte avspilling fra startskjermen. Feiler ved sidefeil, konsollfeil
// eller visualer som mangler.
//
// Krever en Vite-dev-server (låsen ?scene=&beat= finnes bare i dev).
//
// Bruk:
//   node scripts/shots-film.mjs historie/industriell-revolusjon/titanic
//   node scripts/shots-film.mjs <sti> --port 5173 --scener 0,5   # bare noen scener
//
// Ut: .screenshots/film/<leksjon>/sNN-bM.png og .screenshots/film/<leksjon>/ark-sNN.png
// Les arkene (ett bilde per scene), ikke enkeltbildene.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const sti = args.find((a) => !a.startsWith('--') && !/^\d/.test(a));
const opt = (n, d) => {
    const i = args.indexOf(`--${n}`);
    return i >= 0 ? args[i + 1] : d;
};
if (!sti) {
    console.error('Bruk: node scripts/shots-film.mjs <fag>/<emne>/<leksjon> [--port 5173] [--scener 0,3]');
    process.exit(2);
}
const port = opt('port', '5173');
const kunScener = opt('scener', null)?.split(',').map(Number);
const ROT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manus = JSON.parse(fs.readFileSync(path.join(ROT, 'src/features/film/manus', `${sti}.json`), 'utf8'));
const ut = path.join(ROT, '.screenshots/film', path.basename(sti));
fs.rmSync(ut, { recursive: true, force: true });
fs.mkdirSync(ut, { recursive: true });

const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const feil = [];
page.on('pageerror', (e) => feil.push(`sidefeil: ${e.message.slice(0, 200)}`));
page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    // Firebase/nett i sandkassen er ikke filmens feil.
    if (/firebase|ERR_CERT|net::|Failed to load resource|WebSocket/i.test(t)) return;
    feil.push(`konsoll: ${t.slice(0, 200)}`);
});

const base = `http://localhost:${port}/film/${sti}`;
// Varm opp Vite (første transform av three tar tid).
await page.goto(base, { timeout: 120000 }).catch(() => {});
await page.waitForTimeout(3000);

for (const [si, sc] of manus.scener.entries()) {
    if (kunScener && !kunScener.includes(si)) continue;
    const tre = /Havet|3D|Scene/i.test(sc.visual.type) || !['Tittelkort', 'Prikkfelt', 'Livbater', 'Andeler', 'Punktkort', 'Dypet', 'Sluttkort'].includes(sc.visual.type);
    for (let b = 0; b < sc.replikker.length; b++) {
        await page.goto(`${base}?scene=${si}&beat=${b}`);
        await page.waitForTimeout(tre ? 6500 : 4000);
        if (await page.getByText('Mangler visual').count()) feil.push(`scene ${si}: Mangler visual ${sc.visual.type}`);
        if (await page.getByText(/Noe gikk galt/).count()) feil.push(`scene ${si} beat ${b}: ErrorBoundary slo inn`);
        await page.screenshot({ path: path.join(ut, `s${String(si).padStart(2, '0')}-b${b}.png`) });
    }
    const filer = fs
        .readdirSync(ut)
        .filter((f) => f.startsWith(`s${String(si).padStart(2, '0')}-`))
        .map((f) => path.join(ut, f));
    try {
        execFileSync('node', [path.join(ROT, 'scripts/kontaktark-microgame.mjs'), '--filer', ...filer, '--out', path.join(ut, `ark-s${String(si).padStart(2, '0')}.png`)], { stdio: 'ignore' });
    } catch {
        feil.push(`scene ${si}: kontaktark feilet`);
    }
    console.log(`scene ${si} (${sc.id}, ${sc.visual.type}): ${sc.replikker.length} bilder`);
}

// Ekte avspilling: startskjerm -> spill av -> tekstingen skal gå videre av seg selv.
if (!kunScener) {
    await page.goto(base);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(ut, 'start.png') });
    await page.getByLabel('Spill av').first().click();
    await page.waitForTimeout(1500);
    const forste = await page.locator('p.line-clamp-3').first().textContent().catch(() => '');
    await page.waitForTimeout(14000);
    const senere = await page.locator('p.line-clamp-3').first().textContent().catch(() => '');
    await page.screenshot({ path: path.join(ut, 'avspilling.png') });
    if (!forste || forste === senere) feil.push('avspilling: tekstingen gikk ikke videre av seg selv på 14 sekunder');
    else console.log('avspilling: ok (tekstingen går videre)');
}

await browser.close();
console.log(`\nBilder: ${path.relative(ROT, ut)}/ (les ark-sNN.png)`);
if (feil.length) {
    console.log(`\n${feil.length} feil:\n` + [...new Set(feil)].map((f) => `  ${f}`).join('\n'));
    process.exit(1);
}
console.log('Ingen feil.');
