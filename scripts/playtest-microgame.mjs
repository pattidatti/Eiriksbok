// Selvspill-port for mikrospill: spiller hvert spill headless med robotene spillet
// selv har registrert (src/components/microgames/playtest.ts), og sjekker det et
// menneske ellers må prøve seg fram til:
//
//   SPILLBART  en robot som spiller fornuftig vinner (minst 1 av 2 runder)
//   UTFORDRING passiv (ingen input) og alle «taper»-roboter vinner aldri
//   FERDIGHET  beste vinnerrunde gir flere poeng enn alle taperrunder
//   RASKT I GANG en synlig knapp i spillvinduet, og start -> spill på under 6 s
//   LIV        bildet endrer seg av seg selv de første sekundene
//   LESBART    tekst dekker ikke midten av spillet i mer enn 4 s i strekk
//   STABILT    ingen konsollfeil, ingen unntak i robotene
//   MERKET     registry-oppføringen har sjanger og tone; arkadeskallet får eget tema
//
// Bruk:
//   node scripts/playtest-microgame.mjs --ids stavkirken-3d,havet-kommer
//   node scripts/playtest-microgame.mjs --ids havet-kommer --url http://localhost:5173
//   node scripts/playtest-microgame.mjs --ids stavkirken-3d --fart 4 --bots seende
//
// Exit 0 = alle porter grønne, 1 = funn i spillet, 2 = harnessen kunne ikke kjøre.
// Rapport: .screenshots/playtest/_playtest.md (+ skjermbilder per spill).

import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : def;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.screenshots', 'playtest');
const fart = Math.max(1, Math.min(8, Number(opt('fart', 4))));
const onlyBots = opt('bots') ? opt('bots').split(',') : null;
const port = Number(opt('port', 5174));
const ids = (opt('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
if (!ids.length) {
    console.error('Bruk: node scripts/playtest-microgame.mjs --ids <id>[,<id>]');
    process.exit(2);
}
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// Statiske sjekker (registry + kildefil)
// ---------------------------------------------------------------------------
const mgDir = path.join(root, 'src/components/microgames');
const regSrc = readFileSync(path.join(mgDir, 'registry.ts'), 'utf8');

function registryEntry(id) {
    const start = regSrc.indexOf(`id: '${id}'`);
    if (start < 0) return null;
    const end = regSrc.indexOf('\n    },', start);
    const block = regSrc.slice(start, end);
    const file = block.match(/loader:\s*\(\)\s*=>\s*import\('\.\/([^']+)'\)/)?.[1] ?? null;
    return {
        block,
        sjanger: block.match(/sjanger:\s*'([^']+)'/)?.[1] ?? null,
        tone: block.match(/tone:\s*'([^']+)'/)?.[1] ?? null,
        file: file ? path.join(mgDir, file + '.tsx') : null,
    };
}

function staticChecks(id) {
    const f = [];
    const e = registryEntry(id);
    if (!e) return [`finnes ikke i registry.ts`];
    if (!e.sjanger) f.push(`registry-oppføringen mangler \`sjanger\``);
    if (!e.tone) f.push(`registry-oppføringen mangler \`tone\` ('lett' | 'alvorlig')`);
    if (e.file && existsSync(e.file)) {
        const src = readFileSync(e.file, 'utf8');
        if (!src.includes('usePlaytest(')) f.push('spillet registrerer ikke selvspill (usePlaytest)');
        if (/<ArcadeStage\b/.test(src) && !/<ArcadeStage[^>]*\btheme=/.test(src))
            f.push('ArcadeStage uten eget `theme` - hvert spill skal ha sin egen look');
        if (/DEFAULT_THEME/.test(src)) f.push('bruker DEFAULT_THEME - lag et eget tema');
    }
    return f;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
let serverProc = null;
let baseUrl = opt('url');
async function waitForServer(url) {
    for (let i = 0; i < 120; i++) {
        try {
            const r = await fetch(url);
            if (r.status < 500) return true;
        } catch {
            /* ikke oppe ennå */
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
}
if (!baseUrl) {
    baseUrl = `http://localhost:${port}`;
    console.log('Starter Vite dev-server...');
    serverProc = spawn('npx', ['vite', '--port', String(port), '--strictPort'], {
        cwd: root,
        stdio: 'ignore',
        detached: true,
    });
    if (!(await waitForServer(baseUrl))) {
        console.error('Dev-serveren kom ikke opp innen 120 s.');
        process.kill(-serverProc.pid, 'SIGTERM');
        process.exit(2);
    }
}
const stopServer = () => {
    if (serverProc) {
        try {
            process.kill(-serverProc.pid, 'SIGTERM');
        } catch {
            /* allerede borte */
        }
    }
};

// ---------------------------------------------------------------------------
// I nettleseren
// ---------------------------------------------------------------------------

/** Andel av spillvinduet (og av midten) som dekkes av synlig tekst akkurat nå. */
function measureTextCover() {
    const stage = document.querySelector('[data-mg-stage]');
    if (!stage) return null;
    const R = stage.getBoundingClientRect();
    if (R.width < 10 || R.height < 10) return null;
    const GX = 48;
    const GY = 27;
    const cells = new Uint8Array(GX * GY);
    const midTexts = [];
    const opacityOf = (el) => {
        let o = 1;
        for (let n = el; n && n !== stage.parentElement; n = n.parentElement) {
            const cs = getComputedStyle(n);
            if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
            o *= Number(cs.opacity);
        }
        return o;
    };
    for (const el of stage.querySelectorAll('*')) {
        if (el.tagName === 'CANVAS' || el.tagName === 'svg' || el.closest('svg')) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!hasText) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (opacityOf(el) < 0.3) continue;
        const x0 = Math.max(0, Math.floor(((r.left - R.left) / R.width) * GX));
        const x1 = Math.min(GX - 1, Math.floor(((r.right - R.left) / R.width) * GX));
        const y0 = Math.max(0, Math.floor(((r.top - R.top) / R.height) * GY));
        const y1 = Math.min(GY - 1, Math.floor(((r.bottom - R.top) / R.height) * GY));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[y * GX + x] = 1;
        if (x1 >= GX * 0.25 && x0 < GX * 0.75 && y1 >= GY * 0.25 && y0 < GY * 0.8)
            midTexts.push(el.textContent.trim().slice(0, 50));
    }
    let all = 0;
    let mid = 0;
    let midN = 0;
    for (let y = 0; y < GY; y++)
        for (let x = 0; x < GX; x++) {
            const c = cells[y * GX + x];
            all += c;
            if (x >= GX * 0.25 && x < GX * 0.75 && y >= GY * 0.25 && y < GY * 0.8) {
                mid += c;
                midN++;
            }
        }
    return { all: all / (GX * GY), mid: mid / midN, midText: midTexts.join(' / ').slice(0, 120) };
}

/** Grå 64x36-miniatyr av et PNG-bilde, for å måle om bildet endrer seg. */
async function thumb(buf) {
    return sharp(buf).greyscale().resize(64, 36, { fit: 'fill' }).raw().toBuffer();
}
function meanDiff(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
}

// ---------------------------------------------------------------------------
// Én runde
// ---------------------------------------------------------------------------
async function playRound(page, id, bot, variant, maksSekunder, shotsDir, shotPlan = null) {
    // Hold spillet i syne - løkkene pauser når spillvinduet er utenfor skjermen.
    await page.evaluate(() => document.querySelector('[data-mg-stage]')?.scrollIntoView({ block: 'center' }));
    await page.evaluate(
        ({ id, bot, variant }) => {
            const api = window.__mgPlaytest[id];
            window.__mgBotErr = null;
            clearInterval(window.__mgBotTimer);
            api.start(variant ?? undefined);
            if (bot)
                window.__mgBotTimer = setInterval(() => {
                    try {
                        if (api.snapshot().fase === 'spiller') api.bots[bot].tick();
                    } catch (e) {
                        window.__mgBotErr = String(e && e.stack ? e.stack : e);
                    }
                }, 200);
        },
        { id, bot, variant }
    );
    const t0 = Date.now();
    let startMs = null;
    // Sanntidstak: rikelig for en treg headless-GPU, men endelig.
    const capMs = (maksSekunder * 1.6 * (4 / fart) + 40) * 1000;
    const cover = { midRun: 0, allRun: 0, midWorst: 0, allWorst: 0, samples: 0, midWorstText: '' };
    let lastSample = Date.now();
    const shots = [];
    let snap = null;
    let first = null; // { real, tid } ved første «spiller»-snapshot, for spilltempo
    while (Date.now() - t0 < capMs) {
        // Vent på API-et hvis siden ble lastet på nytt (HMR) midt i runden.
        snap = await page.evaluate((id) => window.__mgPlaytest?.[id]?.snapshot() ?? null, id);
        if (!snap) {
            await page.waitForTimeout(500);
            continue;
        }
        if (startMs === null && snap.fase === 'spiller') startMs = Date.now() - t0;
        if (!first && snap.fase === 'spiller' && typeof snap.tid === 'number') first = { real: Date.now(), tid: snap.tid };
        if (snap.fase === 'vunnet' || snap.fase === 'tapt') break;
        if (snap.fase === 'spiller') {
            const now = Date.now();
            // Maks 1,2 s per måling: et skjermbilde eller en treg frame mellom to
            // målinger skal ikke få to korte bannere til å se ut som én lang dekning.
            const dt = Math.min(1.2, (now - lastSample) / 1000);
            lastSample = now;
            const c = await page.evaluate(measureTextCover);
            if (c) {
                cover.samples++;
                cover.midRun = c.mid > 0.1 ? cover.midRun + dt : 0;
                cover.allRun = c.all > 0.35 ? cover.allRun + dt : 0;
                if (cover.midRun > cover.midWorst) {
                    cover.midWorst = cover.midRun;
                    cover.midWorstText = c.midText;
                }
                cover.allWorst = Math.max(cover.allWorst, cover.allRun);
            }
            // Bilder underveis: passiv runde ved 2/7/12 s (liv-sjekken), vinnerroboten
            // som filmstripe (det den uavhengige vurderingen ser).
            if (shotsDir && shotPlan && startMs !== null) {
                const t = (Date.now() - t0 - startMs) / 1000;
                const due = shotPlan.times[shots.length];
                if (due !== undefined && t >= due) {
                    const stage = await page.$('[data-mg-stage]');
                    const buf = await stage.screenshot();
                    writeFileSync(path.join(shotsDir, `${shotPlan.prefix}-${String(shots.length + 1).padStart(2, '0')}-${due}s.png`), buf);
                    shots.push(buf);
                }
            }
        } else lastSample = Date.now();
        await page.waitForTimeout(400);
    }
    const botErr = await page.evaluate(() => {
        clearInterval(window.__mgBotTimer);
        return window.__mgBotErr;
    });
    const secs = Math.round((Date.now() - t0) / 1000);
    // Spilltempo: spill-sekunder per ekte sekund. Med ?mgfart går spillet fortere enn
    // lesetiden (som alltid er ekte tid), så hendelser - og meldinger - kommer tettere
    // enn for eleven. Tekstdekningen deles derfor på tempoet før den vurderes.
    const tempo = first && snap?.tid > first.tid ? (snap.tid - first.tid) / Math.max(1, (Date.now() - first.real) / 1000) : null;
    if (tempo && tempo > 1) {
        cover.midWorst /= tempo;
        cover.allWorst /= tempo;
    }
    const done = snap && (snap.fase === 'vunnet' || snap.fase === 'tapt');
    // La slutt-skjermen rendre før neste runde, og ta et bilde av den.
    if (done && shotsDir) {
        await page.waitForTimeout(1200);
        const stage = await page.$('[data-mg-stage]');
        if (stage) writeFileSync(path.join(shotsDir, `${bot ?? 'passiv'}-slutt.png`), await stage.screenshot());
    }
    return { tempo, bot: bot ?? 'passiv', variant, fase: done ? snap.fase : 'tidsavbrudd', poeng: snap?.poeng ?? 0, framdrift: snap?.framdrift ?? 0, secs, startMs, cover, botErr, shots };
}

// ---------------------------------------------------------------------------
// Ett spill
// Nettverksfeil mot eksterne tjenester (Firebase o.l.) i sandkasser med egen proxy er
// ikke spillets skyld - sky-miljøet til nattrutinen gir ERR_CERT_AUTHORITY_INVALID.
// ---------------------------------------------------------------------------
const NOISE = /firebase|permission_denied|websocket|Download the React DevTools|GL Driver Message|ReadPixels|GPU stall|AudioContext|net::ERR_CERT_|net::ERR_NAME_NOT_RESOLVED|net::ERR_INTERNET_DISCONNECTED/i;
const INFRA = /page\.goto: (Timeout|net::ERR_)|net::ERR_CONNECTION|ECONNREFUSED|Target (page|closed)|browser has been closed/i;

async function playtestGame(browser, id) {
    const rep = { id, findings: [], notes: [], rounds: [], infra: null };
    rep.findings.push(...staticChecks(id));
    const dir = path.join(outDir, id);
    mkdirSync(dir, { recursive: true });

    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && !NOISE.test(m.text()) && errors.push(m.text()));
    page.on('pageerror', (e) => !NOISE.test(String(e)) && errors.push(String(e)));
    try {
        const t0 = Date.now();
        await page.goto(`${baseUrl}/mikrospill/${id}?mgfart=${fart}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        try {
            await page.getByText('Spill', { exact: true }).first().click({ timeout: 4000 });
        } catch {
            /* allerede åpen */
        }
        try {
            await page.waitForFunction((id) => window.__mgPlaytest && window.__mgPlaytest[id], id, { timeout: 150000 });
        } catch {
            rep.findings.push('spillet registrerte aldri selvspill-API-et (usePlaytest) - kan ikke testes');
            return rep;
        }
        rep.notes.push(`lastet på ${((Date.now() - t0) / 1000).toFixed(1)} s (dev-server, kald)`);
        await page.evaluate(() => document.querySelector('[data-mg-stage]')?.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(1500);
        writeFileSync(path.join(dir, 'meny.png'), await (await page.$('[data-mg-stage]')).screenshot());

        // RASKT I GANG: en synlig knapp i spillvinduet på startskjermen.
        const knapper = await page.$$eval('[data-mg-stage] button', (bs) =>
            bs.filter((b) => {
                const r = b.getBoundingClientRect();
                return r.width > 40 && r.height > 20 && getComputedStyle(b).visibility !== 'hidden';
            }).length
        );
        if (!knapper) rep.findings.push('ingen synlig knapp i spillvinduet på startskjermen');
        const fs = await page.$('button[aria-label*="fullskjerm" i]');
        if (!fs) rep.findings.push('mangler fullskjermsknapp (MicroGameFrame)');

        const info = await page.evaluate((id) => {
            const api = window.__mgPlaytest[id];
            return {
                maks: api.maksSekunder,
                bots: Object.entries(api.bots).map(([k, b]) => ({ navn: k, forventer: b.forventer, beskrivelse: b.beskrivelse, variant: b.variant ?? null })),
            };
        }, id);
        if (!info.bots.some((b) => b.forventer === 'vinner')) rep.findings.push('ingen robot med forventer: vinner');
        if (!info.bots.some((b) => b.forventer === 'taper')) rep.findings.push('ingen robot med forventer: taper');

        // FPS (bare rapport - headless-GPU er treg og sier lite om Chromebooken)
        const fps = await page.evaluate(
            () =>
                new Promise((res) => {
                    let n = 0;
                    const t0 = performance.now();
                    const f = () => {
                        n++;
                        if (performance.now() - t0 < 2000) requestAnimationFrame(f);
                        else res(Math.round(n / 2));
                    };
                    requestAnimationFrame(f);
                })
        );
        rep.notes.push(`${fps} bilder/s headless (fart ×${fart})`);

        // 1) Passiv runde
        const passiv = await playRound(page, id, null, null, info.maks, dir, { prefix: 'passiv', times: [2, 7, 12] });
        rep.rounds.push(passiv);
        if (passiv.fase === 'vunnet') rep.findings.push('passiv spiller (ingen input) VANT - valgene betyr ingenting');
        if (passiv.startMs === null || passiv.startMs > 6000)
            rep.findings.push(`start() ga ikke fase «spiller» innen 6 s (${passiv.startMs ?? 'aldri'} ms)`);
        if (passiv.shots.length >= 2) {
            const [a, b] = await Promise.all([thumb(passiv.shots[0]), thumb(passiv.shots[passiv.shots.length - 1])]);
            const d = meanDiff(a, b);
            rep.notes.push(`bildeendring passiv 2 s -> ${passiv.shots.length === 3 ? 12 : 7} s: ${d.toFixed(1)}`);
            if (d < 2) rep.findings.push(`bildet står nesten stille uten input (endring ${d.toFixed(1)} < 2) - verden skal leve`);
        } else if (passiv.fase !== 'tidsavbrudd') rep.notes.push('passiv runde endte før liv-sjekken rakk to bilder');

        // 2) Robotene
        for (const b of info.bots) {
            if (onlyBots && !onlyBots.includes(b.navn)) continue;
            const tries = b.forventer === 'vinner' ? 2 : 1;
            let won = false;
            const film = b.forventer === 'vinner' && !rep.rounds.some((r) => r.forventer === 'vinner');
            for (let t = 0; t < tries && !won; t++) {
                const plan = film && t === 0 ? { prefix: 'film', times: [3, 10, 20, 35, 55, 80, 110, 150] } : null;
                const r = await playRound(page, id, b.navn, b.variant, info.maks, t === 0 ? dir : null, plan);
                r.forventer = b.forventer;
                rep.rounds.push(r);
                if (r.botErr) rep.findings.push(`roboten «${b.navn}» kastet unntak: ${r.botErr.split('\n')[0]}`);
                if (r.fase === 'vunnet') won = true;
                if (r.fase === 'tidsavbrudd') rep.notes.push(`«${b.navn}» nådde ikke slutten innen tidstaket (${r.secs} s)`);
            }
            if (b.forventer === 'vinner' && !won) rep.findings.push(`«${b.navn}» skal vinne, men vant ingen av ${tries} runder`);
            if (b.forventer === 'taper' && won) rep.findings.push(`«${b.navn}» skal tape, men VANT`);
        }

        // FERDIGHET: beste vinnerrunde over alle taperrunder
        const vinn = rep.rounds.filter((r) => r.forventer === 'vinner' && r.fase === 'vunnet').map((r) => r.poeng);
        const tap = rep.rounds.filter((r) => r.forventer === 'taper' || r.bot === 'passiv').map((r) => r.poeng);
        if (vinn.length && tap.length && Math.max(...vinn) <= Math.max(...tap))
            rep.findings.push(`dyktig spill gir ikke flere poeng (vinner ${Math.max(...vinn)} <= taper ${Math.max(...tap)})`);

        // LESBART
        const worstRound = rep.rounds.reduce((a, r) => (r.cover.midWorst > a.cover.midWorst ? r : a));
        const midWorst = worstRound.cover.midWorst;
        const allWorst = Math.max(...rep.rounds.map((r) => r.cover.allWorst));
        const tempi = rep.rounds.map((r) => r.tempo).filter(Boolean);
        if (tempi.length) rep.notes.push(`spilltempo ${Math.min(...tempi).toFixed(1)}-${Math.max(...tempi).toFixed(1)}× ekte tid (tekstdekning er normalisert)`);
        else rep.notes.push('snapshot() har ikke `tid` - tekstdekningen er ikke normalisert for spilltempo');
        rep.notes.push(`lengste tekstdekning av midten: ${midWorst.toFixed(1)} s, av over 35 %: ${allWorst.toFixed(1)} s`);
        if (midWorst > 4)
            rep.findings.push(
                `tekst dekker midten av spillet i ${midWorst.toFixed(1)} s i strekk (maks 4, runde «${worstRound.bot}», tekst: «${worstRound.cover.midWorstText}») - flytt lesetekst under spillet (feed)`
            );
        if (allWorst > 4) rep.findings.push(`tekst dekker over 35 % av spillvinduet i ${allWorst.toFixed(1)} s i strekk (maks 4)`);
    } catch (e) {
        const msg = String(e?.message || e);
        if (INFRA.test(msg)) rep.infra = msg;
        else rep.findings.push(`harness-feil: ${msg.split('\n')[0]}`);
    } finally {
        const real = errors.filter((e) => !INFRA.test(e));
        if (real.length) rep.findings.push(`${real.length} konsollfeil, første: ${real[0].slice(0, 200)}`);
        await page.close();
    }
    return rep;
}

// ---------------------------------------------------------------------------
const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {}),
});
// Varm opp Vite (første transform av three/postprocessing tar lang tid).
try {
    const p = await browser.newPage();
    await p.goto(baseUrl, { waitUntil: 'load', timeout: 180000 });
    await p.close();
} catch {
    /* best effort */
}

const reports = [];
for (const id of ids) {
    console.log(`▶ ${id}`);
    const r = await playtestGame(browser, id);
    for (const x of r.rounds)
        console.log(`   ${x.bot.padEnd(14)} ${x.fase.padEnd(11)} ${String(x.poeng).padStart(7)} p  framdrift ${(x.framdrift * 100).toFixed(0)} %  ${x.secs} s`);
    for (const n of r.notes) console.log(`   · ${n}`);
    for (const f of r.findings) console.log(`   ✗ ${f}`);
    if (r.infra) console.log(`   ⚠ infrastruktur: ${r.infra}`);
    if (!r.findings.length && !r.infra) console.log('   ✓ alle porter grønne');
    reports.push(r);
}
await browser.close();
stopServer();

// Rapport
const md = ['## Selvspill-port', ''];
for (const r of reports) {
    const ok = !r.findings.length && !r.infra;
    md.push(`### ${ok ? '✅' : r.infra ? '⚠️' : '❌'} \`${r.id}\``, '');
    md.push('| Robot | Forventer | Resultat | Poeng | Framdrift | Tid |', '|---|---|---|---:|---:|---:|');
    for (const x of r.rounds)
        md.push(`| ${x.bot}${x.variant ? ` (${x.variant})` : ''} | ${x.forventer ?? 'taper'} | ${x.fase} | ${x.poeng} | ${(x.framdrift * 100).toFixed(0)} % | ${x.secs} s |`);
    md.push('');
    for (const f of r.findings) md.push(`- ❌ ${f}`);
    if (r.infra) md.push(`- ⚠️ Harnessen kunne ikke kjøre: ${r.infra}`);
    for (const n of r.notes) md.push(`- ${n}`);
    md.push('');
}
writeFileSync(path.join(outDir, '_playtest.md'), md.join('\n'));
writeFileSync(
    path.join(outDir, '_playtest.json'),
    JSON.stringify(reports.map((r) => ({ ...r, rounds: r.rounds.map(({ shots, ...x }) => x) })), null, 2)
);

const gameFail = reports.some((r) => r.findings.length);
const infraFail = reports.some((r) => r.infra);
process.exit(gameFail ? 1 : infraFail ? 2 : 0);
