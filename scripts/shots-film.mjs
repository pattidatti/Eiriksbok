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
//
// Med --scener tas bare de scenene på nytt. Bildene og arkene for de andre scenene blir
// liggende, så vurdereren alltid kan få hele settet.
//
// Hvert bilde sjekkes også for tekst som overlapper annen tekst, er kuttet i bildekanten,
// står kloss inntil en annen SVG-merkelapp eller ligger under en HTML-boks (målt i DOM, også
// merkelapper over 3D-lerretet). Funnene står i
// overlapp.txt og stopper skriptet. Tekst tegnet inne i WebGL ser sjekken ikke.

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
if (kunScener) {
    // Bare scenene som tas på nytt. Resten av settet beholdes til vurderingen.
    fs.mkdirSync(ut, { recursive: true });
    const nr = new Set(kunScener.map((n) => String(n).padStart(2, '0')));
    for (const f of fs.readdirSync(ut)) {
        const m = f.match(/^(?:ark-)?s(\d{2})/);
        if (m && nr.has(m[1])) fs.rmSync(path.join(ut, f));
    }
} else {
    fs.rmSync(ut, { recursive: true, force: true });
    fs.mkdirSync(ut, { recursive: true });
}

/**
 * Tekst som overlapper annen tekst, eller som går ut over bildekanten. Kjøres i siden.
 * Hver tekstnode måles med Range (den faktiske teksten, ikke boksen rundt). Tekst som
 * nesten er usynlig (opacity < 0,35) teller ikke, for det er bevisst dempet bakgrunn.
 */
function finnOverlapp() {
    const rot = document.querySelector('.aspect-video');
    if (!rot) return [];
    const R = rot.getBoundingClientRect();
    const bokser = [];
    const gaa = document.createTreeWalker(rot, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = gaa.nextNode())) {
        const tekst = n.textContent.replace(/\s+/g, ' ').trim();
        if (!tekst) continue;
        let o = 1;
        let skjult = false;
        for (let e = n.parentElement; e && e !== rot.parentElement; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.display === 'none' || cs.visibility === 'hidden') skjult = true;
            o *= parseFloat(cs.opacity || '1');
        }
        if (skjult || o < 0.35) continue;
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const b of r.getClientRects()) {
            if (b.width < 3 || b.height < 3) continue;
            // Helt utenfor bildet (et sted kartet har zoomet forbi) er ikke synlig og ikke en feil.
            if (b.right <= R.left || b.left >= R.right || b.bottom <= R.top || b.top >= R.bottom) continue;
            bokser.push({ tekst, node: n, b });
        }
    }
    const funn = [];
    for (const { tekst, b } of bokser) {
        const ut = Math.max(R.left - b.left, b.right - R.right, R.top - b.top, b.bottom - R.bottom);
        if (ut > 4) funn.push(`«${tekst.slice(0, 50)}» er kuttet i bildekanten`);
    }
    for (let i = 0; i < bokser.length; i++) {
        for (let j = i + 1; j < bokser.length; j++) {
            const a = bokser[i];
            const c = bokser[j];
            if (a.node === c.node) continue;
            // Linjeboksen er høyere enn bokstavene (plass til Å og g). Tett stablet tekst, et
            // stort tall over etiketten sin, har boksene oppå hverandre uten at bokstavene
            // rører. Sammenlign derfor bare det midterste av hver boks.
            const kutt = (b) => ({ top: b.top + b.height * 0.18, bottom: b.bottom - b.height * 0.18 });
            const ka = kutt(a.b);
            const kc = kutt(c.b);
            const w = Math.min(a.b.right, c.b.right) - Math.max(a.b.left, c.b.left);
            const h = Math.min(ka.bottom, kc.bottom) - Math.max(ka.top, kc.top);
            // To SVG-merkelapper på samme linje som står kloss inntil hverandre, leses som én
            // tekst («Hvalfett» + «To ganger om dagen»), selv om de ikke overlapper.
            const tA = a.node.parentElement?.closest('text');
            const tC = c.node.parentElement?.closest('text');
            if (tA && tC && tA !== tC && h > 4 && w <= 2 && -w < 10) {
                funn.push(`«${a.tekst.slice(0, 50)}» står kloss inntil «${c.tekst.slice(0, 50)}»`);
                continue;
            }
            if (w <= 2 || h <= 4) continue;
            // To merkelapper på samme linje som går inn i hverandre (en tidslinje der «...ned en
            // kommisjon» møter «rapporten kommer») er en feil selv om overlappet er smalt.
            // Linjer over hverandre (et stort tall over etiketten sin) er det ikke, selv om
            // linjeboksene deres overlapper: da ligger midtpunktene for langt fra hverandre.
            const midtA = (a.b.top + a.b.bottom) / 2;
            const midtC = (c.b.top + c.b.bottom) / 2;
            const sammeLinje = Math.abs(midtA - midtC) < Math.min(a.b.height, c.b.height) / 2;
            const minste = Math.min(a.b.width * a.b.height, c.b.width * c.b.height) * 0.64;
            if (!sammeLinje && (w * h) / minste < 0.15) continue;
            funn.push(`«${a.tekst.slice(0, 50)}» overlapper «${c.tekst.slice(0, 50)}»`);
        }
    }
    // SVG-tekst som ligger under en HTML-boks med bakgrunn (et faktakort over kartet). Tekst
    // mot tekst fanger ikke det, for boksen kan ha annen tekst eller ingen.
    for (const { tekst, node, b } of bokser) {
        const svg = node.parentElement?.closest('svg');
        if (!svg) continue;
        const x = (b.left + b.right) / 2;
        const y = (b.top + b.bottom) / 2;
        if (x < R.left || x > R.right || y < R.top || y > R.bottom) continue;
        const topp = document.elementFromPoint(x, y);
        if (!topp || topp instanceof SVGElement || topp.tagName === 'CANVAS' || topp.contains(svg) || topp.contains(node)) continue;
        for (let e = topp; e && !e.contains(svg); e = e.parentElement) {
            const cs = getComputedStyle(e);
            const alfa = cs.backgroundColor.match(/[\d.]+/g)?.[3];
            const dekker = cs.backgroundColor !== 'transparent' && (alfa === undefined || parseFloat(alfa) > 0.5);
            if (dekker && parseFloat(cs.opacity) > 0.5) {
                funn.push(`«${tekst.slice(0, 50)}» ligger under en boks («${(e.textContent ?? '').trim().slice(0, 30)}»)`);
                break;
            }
        }
    }
    return [...new Set(funn)];
}
const overlapp = [];

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
        for (const o of await page.evaluate(finnOverlapp)) overlapp.push(`scene ${si} (${sc.visual.type}) beat ${b}: ${o}`);
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
fs.writeFileSync(path.join(ut, 'overlapp.txt'), overlapp.join('\n') + (overlapp.length ? '\n' : ''));
if (overlapp.length) {
    console.log(`\nTekst som overlapper eller er kuttet (${overlapp.length}, også i overlapp.txt):`);
    for (const o of overlapp) console.log(`  ${o}`);
    feil.push(`${overlapp.length} tekstoverlapp - flytt merkelappene og ta scenene på nytt med --scener`);
}
if (feil.length) {
    console.log(`\n${feil.length} feil:\n` + [...new Set(feil)].map((f) => `  ${f}`).join('\n'));
    process.exit(1);
}
console.log('Ingen feil.');
