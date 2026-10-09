// Selvspill-port for mikrospill: spiller hvert spill headless med robotene spillet
// selv har registrert (src/components/microgames/playtest.ts), og sjekker det som
// trenger en ekte nettleser.
//
// Balansen (vinner/taper, ferdighetstrapp, spillfølelse) avgjøres IKKE her lenger, men i
// simuleringen: scripts/sim-microgame.mts spiller hundrevis av seedede runder på sekunder.
// Før (til 29.09) spilte denne porten 8-10 hele runder i swiftshader - 35 minutter i CI,
// 15-20 minutter per runde i sky-miljøet - og avgjorde trappen med ett eller to myntkast
// (~8-20 % falske røde). Standard er nå en røyktest: en kort passiv runde, én hel runde
// med vinnerroboten (filmen vurdereren ser) og Chromebook-målingen.
//
//   SAMSVAR    vinnerrunden i nettleseren oppfører seg som i simuleringen (sim.json):
//              taper den der simuleringen nesten aldri taper, er nettleserveien feil
//   ROBOTER    samme robotnavn og forventninger som i sim.ts
//   RASKT I GANG en synlig knapp i spillvinduet, og start -> spill på under 6 s
//   LIV        bildet endrer seg av seg selv de første sekundene
//   LESBART    tekst dekker ikke midten av spillet i mer enn 4 s i strekk
//   SKRIFT     ingen synlig tekst i spillvinduet under 13 px (1366×768)
//   STABILT    ingen konsollfeil, ingen unntak i robotene
//   MERKET     registry-oppføringen har sjanger og tone; arkadeskallet får eget tema
//   CHROMEBOOK en runde med prosessoren strupet 4x (som en billig Chromebook): JS-tid per
//              bilde, draw calls og trekanter må holde seg innenfor budsjettet
//   SPILLFØLELSE (nye spill) nok valg per minutt, presset stiger gjennom runden, en
//              «middels» robot havner mellom taperne og vinneren (ferdighetstak), og en
//              «tilfeldig» knappemoser taper. Tallene gis også til den uavhengige vurderingen.
//   BRIEF      (nye spill) `kunst` i registry og docs/microgames/briefer/<id>.md finnes
//
// --full kjører den gamle porten (alle roboter, hele runder, trapp og spillfølelse i
// nettleseren). Bare til feilsøking når nettleser og simulering er uenige.
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
import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
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
// Maks 4: løkka klemmer hvert steg til 0,05 s, så ×4 gir 0,2 spillsekunder per bilde -
// nøyaktig ett robotgrep per bilde. Høyere fart gir robotene færre grep per spillsekund
// enn i simuleringen, og målingen blir feil (28.09: vinneren tapte bare i nettleseren).
const fart = Math.max(1, Math.min(4, Number(opt('fart', 4))));
if (Number(opt('fart', 4)) > 4) console.log('--fart er begrenset til 4 (robotene må få like mange grep per spillsekund som i simuleringen)');
const onlyBots = opt('bots') ? opt('bots').split(',') : null;
const full = args.includes('--full');
// Røyktest: den passive runden trenger bare liv-sjekken (bilder ved 2/7/12 s).
const SMOKE_PASSIV_TID = 20;
// --maks-tid N: stopp vinnerrunden etter N spillsekunder. CI bruker det (CI-maskinen gir 3D-spill
// rundt 7 bilder/s, og en hel runde tok opp til 7 minutter). Nattsporet kjører hele runden, fordi
// filmstripen er det vurdereren ser.
const maksTid = opt('maks-tid') ? Number(opt('maks-tid')) : null;
// --cover: lagre et skjermbilde fra vinnerrunden som startkortets plakat
// (public/images/microgames/<id>.webp). --cover-at N velger sekundet (standard 20).
const makeCover = args.includes('--cover');
// Chromebook-porten: struping og grenser. En billig Chromebook (Celeron/Intel UHD) er
// rundt 4-6x tregere enn en utviklermaskin på JavaScript, og GPU-en tåler få draw calls.
const CB_THROTTLE = Number(opt('cpu-throttle', 4));
const CB_LIMITS = { jsP95: 22, calls: 350, triangles: 700e3 };
// Spillfølelse: minst ett nytt valg hvert 10. sekund, og presset i siste tredjedel av runden
// skal ligge klart over første tredjedel.
const FEEL = { valgPerMin: 6, pressLift: 0.15 };
// Spill bygget før generatoren (2026-09-28). De har ikke brief, `kunst` eller tall for
// spillfølelse; for dem rapporteres tallene bare. Alle nye spill må ha dem.
// Minste skrift i spillvinduet (eier 2026-09-30). Gjelder all DOM-tekst i spillvinduet.
const MIN_FONT_PX = 13;

const LEGACY = new Set(['havet-kommer', 'stavkirken-3d', 'lop-med-lonna-3d', 'plottebordet-3d']);
// Spill bygget før kodeformen (2026-09-30). Nye spill skal ha KART.md og tuning.ts i mappa og
// ingen fil over KODEFORM_MAKS_LINJER, så en fersk agent finner fram uten å lese hele spillet.
const KODEFORM_FOR = new Set([
    'guddommelig-vind', 'inn-mot-stranda', 'petisjonen-3d', 'seinen-snur', 'kurs-for-gronland',
    'thermopylae', 'frisk-puss', 'lopegravene-1718', 'hammer-og-ambolt',
]);
const KODEFORM_MAKS_LINJER = 800;
const coverAt = Number(opt('cover-at', 20));
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

/** Kodeformen (guiden, steg 3a): kart, tall i tuning.ts, små filer. */
function kodeform(file) {
    const f = [];
    const src = readFileSync(file, 'utf8');
    const counts = {};
    for (const m of src.matchAll(/from '\.\/([\w-]+)\//g)) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
    const mappe = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!mappe) return ['fant ikke spillmappa (ingen import fra ./<mappe>/) - spillreglene skal bo i en egen mappe'];
    const dir = path.join(mgDir, mappe);
    for (const need of ['KART.md', 'tuning.ts'])
        if (!existsSync(path.join(dir, need))) f.push(`${mappe}/${need} mangler (se «Kodeformen» i guiden)`);
    const files = [file, ...readdirSync(dir).filter((n) => /\.tsx?$/.test(n)).map((n) => path.join(dir, n))];
    for (const p of files) {
        const n = readFileSync(p, 'utf8').split('\n').length;
        if (n > KODEFORM_MAKS_LINJER) f.push(`${path.relative(mgDir, p)} har ${n} linjer - maks ${KODEFORM_MAKS_LINJER}, del den etter ansvar`);
    }
    return f;
}

function staticChecks(id) {
    const f = [];
    const e = registryEntry(id);
    if (!e) return [`finnes ikke i registry.ts`];
    if (!e.sjanger) f.push(`registry-oppføringen mangler \`sjanger\``);
    if (!e.tone) f.push(`registry-oppføringen mangler \`tone\` ('lett' | 'alvorlig' | 'grusom')`);
    if (!/hook:\s*'/.test(e.block)) f.push('registry-oppføringen mangler `hook` - én setning i du-form til startkortet');
    const cover = e.block.match(/cover:\s*'([^']+)'/)?.[1];
    if (!cover) f.push('registry-oppføringen mangler `cover` - kjør selvspillet med --cover');
    else if (!existsSync(path.join(root, 'public', cover)) && !makeCover) f.push(`coverbildet ${cover} finnes ikke - kjør selvspillet med --cover`);
    if (!LEGACY.has(id)) {
        if (!/kunst:\s*'/.test(e.block)) f.push('registry-oppføringen mangler `kunst` - kunstretningen fra epoken (se «Kunstbriefen» i guiden)');
        const brief = path.join(root, 'docs/microgames/briefer', `${id}.md`);
        if (!existsSync(brief)) f.push(`mangler briefen docs/microgames/briefer/${id}.md (konseptturnering + designbrief + kunstbrief)`);
        else {
            const b = readFileSync(brief, 'utf8');
            for (const h of ['Konseptturnering', 'Designbrief', 'Kunstbrief'])
                if (!new RegExp(`^##\\s+${h}`, 'mi').test(b)) f.push(`briefen mangler seksjonen «## ${h}»`);
        }
    }
    if (!LEGACY.has(id) && !KODEFORM_FOR.has(id) && e.file && existsSync(e.file)) f.push(...kodeform(e.file));
    if (e.file && existsSync(e.file)) {
        const src = readFileSync(e.file, 'utf8');
        if (!src.includes('usePlaytest(')) f.push('spillet registrerer ikke selvspill (usePlaytest)');
        if (/<ArcadeStage\b/.test(src) && !/<ArcadeStage[^>]*\btheme=/.test(src))
            f.push('ArcadeStage uten eget `theme` - hvert spill skal ha sin egen look');
        if (/DEFAULT_THEME/.test(src)) f.push('bruker DEFAULT_THEME - lag et eget tema');
        if (/<ArcadeStage\b/.test(src) && !src.includes('useArcadeText('))
            f.push('arkadespill uten useArcadeText - tekst skal stå der blikket er (lapper, lærings-øyeblikk, «Dette skjedde»)');
        if (/<ArcadeStage[^>]*\bbelow=/.test(src)) f.push('tekst under spillvinduet (below=) blir ikke lest - bruk lapper eller «Dette skjedde»');
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
function measureTextCover(minPx) {
    const stage = document.querySelector('[data-mg-stage]');
    if (!stage) return null;
    const R = stage.getBoundingClientRect();
    if (R.width < 10 || R.height < 10) return null;
    const GX = 48;
    const GY = 27;
    const cells = new Uint8Array(GX * GY);
    const midTexts = [];
    const small = [];
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
        // Lærings-øyeblikk: spillet går i sakte film mens kortet står - det skal dekke.
        if (el.closest('[data-coach-beat]')) continue;
        // Lapper er små per konstruksjon (maks 7 ord) og står ved tingen de gjelder -
        // ordgrensen deres sjekkes for seg.
        if (el.closest('[data-coach-pin]')) continue;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!hasText) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (opacityOf(el) < 0.3) continue;
        // Skriftstørrelsen eleven faktisk ser: CSS-størrelsen ganget med en eventuell transform-skala.
        const px = parseFloat(getComputedStyle(el).fontSize) * (el.offsetHeight > 0 ? r.height / el.offsetHeight : 1);
        if (px < minPx - 0.25) small.push(`${px.toFixed(1)} px «${el.textContent.trim().slice(0, 40)}»`);
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
    return { all: all / (GX * GY), mid: mid / midN, midText: midTexts.join(' / ').slice(0, 120), small };
}

/** Tekstlaget akkurat nå: lapper, banner og et eventuelt lærings-øyeblikk. */
function readCoach() {
    const stage = document.querySelector('[data-mg-stage]');
    if (!stage) return null;
    const pins = [...stage.querySelectorAll('[data-coach-pin]')]
        .filter((e) => getComputedStyle(e).opacity !== '0')
        .map((e) => e.textContent.trim());
    const banner = stage.querySelector('.arc-banner h4')?.textContent.trim() ?? null;
    const beat = stage.querySelector('[data-coach-beat]')?.getAttribute('data-coach-beat') ?? null;
    return { pins, banner, beat };
}
// Ord = tegngrupper med bokstaver eller tall («-», «→» og emoji teller ikke).
const wordCount = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

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
/** Valg per spilt minutt og presskurven (snitt per tredjedel av spilletiden) fra én runde. */
function feelStats(samples) {
    if (samples.length < 4) return null;
    const t0 = samples[0].tid;
    const t1 = samples[samples.length - 1].tid;
    const span = t1 - t0;
    if (span < 10) return null;
    const vs = samples.filter((x) => typeof x.valg === 'number');
    const valgPerMin = vs.length >= 2 ? ((vs[vs.length - 1].valg - vs[0].valg) / (vs[vs.length - 1].tid - vs[0].tid || 1)) * 60 : null;
    const ps = samples.filter((x) => typeof x.press === 'number');
    const third = (k) => {
        const xs = ps.filter((x) => x.tid >= t0 + (span * k) / 3 && x.tid <= t0 + (span * (k + 1)) / 3).map((x) => x.press);
        return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
    };
    const [pressFirst, pressMid, pressLast] = ps.length >= 3 ? [third(0), third(1), third(2)] : [null, null, null];
    return { valgPerMin, pressFirst, pressMid: pressMid ?? pressFirst, pressLast: pressLast ?? pressFirst };
}

/**
 * Skjermbilde av spillvinduet via CDP. Playwrights elementHandle.screenshot() venter på at
 * fonter er lastet og at elementet står stille; med et canvas som tegner hvert bilde og
 * fonter som ikke finnes på CI-maskinen, kan den ventingen aldri bli ferdig (28.09: tidsavbrudd
 * i CI for inn-mot-stranda, mens spillet selv var i orden).
 */
async function stageShot(page) {
    const el = await page.$('[data-mg-stage]');
    const box = el && (await el.boundingBox());
    const cdp = await page.context().newCDPSession(page);
    try {
        const r = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            ...(box ? { clip: { x: box.x, y: box.y, width: box.width, height: box.height, scale: 1 } } : {}),
        });
        return Buffer.from(r.data, 'base64');
    } finally {
        await cdp.detach().catch(() => {});
    }
}

async function playRound(...a) {
    for (let i = 0; i < 3; i++) {
        let r;
        try {
            r = await playRoundOnce(...a);
        } catch (e) {
            // Vite lastet siden på nytt midt i et evaluate-kall (filendring, eller ny
            // dependency-optimalisering ved kaldstart): samme som en avbrutt runde.
            if (!/Execution context was destroyed|navigation/i.test(String(e?.message || e))) throw e;
            r = { avbrutt: true, bot: a[2] ?? 'passiv' };
        }
        if (!r.avbrutt) return r;
        console.log(`   ↻ siden ble lastet på nytt midt i runden (${r.bot}) - kjører den på nytt`);
        await a[0].waitForFunction((id) => window.__mgPlaytest && window.__mgPlaytest[id], a[1], { timeout: 150000 });
    }
    throw new Error('siden ble lastet på nytt tre ganger - noe endrer filer i repoet under selvspillet');
}

async function playRoundOnce(page, id, bot, variant, maksSekunder, shotsDir, shotPlan = null, maxTid = null) {
    // Hold spillet i syne - løkkene pauser når spillvinduet er utenfor skjermen.
    await page.evaluate(() => document.querySelector('[data-mg-stage]')?.scrollIntoView({ block: 'center' }));
    await page.evaluate(
        ({ id, bot, variant }) => {
            const api = window.__mgPlaytest[id];
            window.__mgBotErr = null;
            clearInterval(window.__mgBotTimer);
            api.start(variant ?? undefined);
            // Robotene tar ett grep per 0,2 s SPILLTID (BOT_EVERY i playtest.ts) - samme takt
            // som i simuleringen med npx tsx. Tidligere tikket de hvert 200. ms i ekte tid, og
            // med treg headless-GPU og ?mgfart fikk de da halvparten så mange grep per
            // spillsekund som i simuleringen: balanse som stemte der, feilet her (28.09).
            // Spill uten `tid` i snapshot faller tilbake til ekte tid.
            const st = (window.__mgBotStats = { ticks: 0, t0: null, t1: null });
            let next = null;
            let n = 0;
            if (bot)
                window.__mgBotTimer = setInterval(() => {
                    try {
                        const snap = api.snapshot();
                        if (snap.fase !== 'spiller') return;
                        let go;
                        if (typeof snap.tid === 'number') {
                            if (st.t0 === null) st.t0 = snap.tid;
                            st.t1 = snap.tid;
                            // Neste grep er planlagt på 0,2 s-rutenettet, så et bilde som flytter
                            // spillet litt under 0,2 s ikke koster et helt ekstra bilde (snitt 5/s).
                            if (next === null) next = snap.tid;
                            go = snap.tid >= next - 1e-6;
                            if (go) next = Math.max(next + 0.2, snap.tid - 0.1);
                        } else go = ++n % 8 === 0;
                        if (go) {
                            st.ticks++;
                            api.bots[bot].tick();
                        }
                    } catch (e) {
                        window.__mgBotErr = String(e && e.stack ? e.stack : e);
                    }
                }, 25);
        },
        { id, bot, variant }
    );
    const t0 = Date.now();
    let startMs = null;
    // Tidstak: headless-GPU-er er svært ulike (3-17 bilder/s), så et fast tak ga
    // «tidsavbrudd» for runder som var godt i gang. Runden får gå så lenge
    // framdriften øker; den avbrytes når den står stille i 90 s, og uansett etter
    // et romslig absolutt tak.
    const capMs = Math.max(20 * 60, maksSekunder * 8) * 1000;
    let lastProgress = { v: -1, at: Date.now() };
    const cover = { midRun: 0, allRun: 0, midWorst: 0, allWorst: 0, samples: 0, midWorstText: '', small: [] };
    const coach = { beats: new Set(), beatSince: 0, longPins: new Set(), longBanners: new Set(), pins: new Set() };
    let lastSample = Date.now();
    const shots = [];
    let snap = null;
    let first = null; // { real, tid } ved første «spiller»-snapshot, for spilltempo
    const feel = []; // { tid, valg, press } per måling, for spillfølelsen
    while (Date.now() - t0 < capMs) {
        // Vent på API-et hvis siden ble lastet på nytt (HMR) midt i runden.
        snap = await page.evaluate((id) => window.__mgPlaytest?.[id]?.snapshot() ?? null, id);
        if (!snap) {
            await page.waitForTimeout(500);
            continue;
        }
        // Siden ble lastet på nytt midt i runden (Vite laster om ved ENHVER filendring
        // i repoet): runden er ødelagt. Meld fra, så kalleren kjører den på nytt.
        if (startMs !== null && snap.fase === 'meny') {
            await page.evaluate(() => clearInterval(window.__mgBotTimer));
            return { avbrutt: true, lessons: 0, coach: { beats: [], pins: [], longPins: [], longBanners: [] }, bot: bot ?? 'passiv', variant, fase: 'avbrutt', poeng: 0, framdrift: 0, secs: 0, startMs, cover, shots };
        }
        if (startMs === null && snap.fase === 'spiller') startMs = Date.now() - t0;
        if (!first && snap.fase === 'spiller' && typeof snap.tid === 'number') first = { real: Date.now(), tid: snap.tid };
        if (snap.fase === 'vunnet' || snap.fase === 'tapt') break;
        if (maxTid !== null && first && snap.tid - first.tid >= maxTid) break;
        if (snap.framdrift > lastProgress.v + 1e-4 || (typeof snap.tid === 'number' && snap.tid > (lastProgress.tid ?? -1) + 0.5))
            lastProgress = { v: snap.framdrift, tid: snap.tid, at: Date.now() };
        else if (snap.fase === 'spiller' && Date.now() - lastProgress.at > 90000) break;
        if (snap.fase === 'spiller') {
            if (typeof snap.tid === 'number') feel.push({ tid: snap.tid, valg: snap.valg ?? null, press: snap.press ?? null });
            const now = Date.now();
            // Maks 1,2 s per måling: et skjermbilde eller en treg frame mellom to
            // målinger skal ikke få to korte bannere til å se ut som én lang dekning.
            const dt = Math.min(1.2, (now - lastSample) / 1000);
            lastSample = now;
            const c = await page.evaluate(measureTextCover, MIN_FONT_PX);
            const co = await page.evaluate(readCoach);
            if (co) {
                for (const t of co.pins) {
                    coach.pins.add(t);
                    if (wordCount(t) > 7) coach.longPins.add(t);
                }
                if (co.banner && wordCount(co.banner) > 5) coach.longBanners.add(co.banner);
                if (co.beat) {
                    if (!coach.beats.has(co.beat)) {
                        coach.beats.add(co.beat);
                        coach.beatSince = Date.now();
                    }
                    // En elev leser kortet og trykker «Skjønner». Roboten venter litt og gjør det samme.
                    if (Date.now() - coach.beatSince > 1500)
                        await page.click('[data-coach-continue]', { timeout: 2000 }).catch(() => {});
                }
            }
            if (c) {
                cover.samples++;
                cover.midRun = c.mid > 0.1 ? cover.midRun + dt : 0;
                cover.allRun = c.all > 0.35 ? cover.allRun + dt : 0;
                if (cover.midRun > cover.midWorst) {
                    cover.midWorst = cover.midRun;
                    cover.midWorstText = c.midText;
                }
                cover.allWorst = Math.max(cover.allWorst, cover.allRun);
                for (const t of c.small ?? []) if (!cover.small.includes(t) && cover.small.length < 40) cover.small.push(t);
            }
            // Plakaten til startkortet: et bilde midt i god spilling, uten tekstlaget
            // og uten HUD (lapper, poeng og knapper hører til spillet, ikke til plakaten).
            // Bilder tas på spilltid når spillet har `tid`: med ?mgfart går en runde fortere enn
            // ekte tid, og filmstripen skal dekke hele runden - ikke bare de første sekundene.
            const tNow = first && typeof snap.tid === 'number' ? snap.tid - first.tid : (Date.now() - t0 - (startMs ?? 0)) / 1000;
            if (shotPlan?.cover && !shotPlan.coverDone && startMs !== null && tNow >= coverAt) {
                shotPlan.coverDone = true;
                const style = await page.addStyleTag({ content: '[data-mg-stage] *:not(canvas):not(:has(canvas)){visibility:hidden!important}' });
                await page.waitForTimeout(120);
                const buf = await stageShot(page);
                await style.evaluate((el) => el.remove());
                const dir = path.join(root, 'public/images/microgames');
                mkdirSync(dir, { recursive: true });
                await sharp(buf).resize({ width: 1280, withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(dir, `${id}.webp`));
                console.log(`   ▣ plakat lagret: public/images/microgames/${id}.webp`);
            }
            // Bilder underveis: passiv runde ved 2/7/12 s (liv-sjekken), vinnerroboten
            // som filmstripe (det den uavhengige vurderingen ser).
            if (shotsDir && shotPlan && startMs !== null) {
                const due = shotPlan.times[shots.length];
                if (due !== undefined && tNow >= due) {
                    const buf = await stageShot(page);
                    writeFileSync(path.join(shotsDir, `${shotPlan.prefix}-${String(shots.length + 1).padStart(2, '0')}-${due}s.png`), buf);
                    shots.push(buf);
                }
            }
        } else lastSample = Date.now();
        await page.waitForTimeout(400);
    }
    const { botErr, botStats } = await page.evaluate(() => {
        clearInterval(window.__mgBotTimer);
        return { botErr: window.__mgBotErr, botStats: window.__mgBotStats };
    });
    // Grep per spillsekund. Målet er 5 (ett per 0,2 s). Blir det færre, går spillet fortere
    // per bilde enn robotene rekker å svare - da er runden ikke en gyldig måling.
    const takt = bot && botStats?.t0 !== null && botStats.t1 - botStats.t0 > 5 ? botStats.ticks / (botStats.t1 - botStats.t0) : null;
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
    let lessons = 0;
    if (done) {
        await page.waitForTimeout(1200);
        lessons = await page.evaluate(() => document.querySelectorAll('[data-coach-lessons] li').length);
    }
    if (done && shotsDir) {
        const stage = await page.$('[data-mg-stage]');
        if (stage) writeFileSync(path.join(shotsDir, `${bot ?? 'passiv'}-slutt.png`), await stageShot(page));
    }
    const stoppet = !done && maxTid !== null && first && snap?.tid - first.tid >= maxTid;
    return { lessons, takt, arsak: snap?.årsak ?? null, feel: feelStats(feel), coach: { beats: [...coach.beats], pins: [...coach.pins], longPins: [...coach.longPins], longBanners: [...coach.longBanners] }, tempo, tid: snap?.tid ?? null, bot: bot ?? 'passiv', variant, fase: done ? snap.fase : stoppet ? 'stoppet' : 'tidsavbrudd', poeng: snap?.poeng ?? 0, framdrift: snap?.framdrift ?? 0, secs, startMs, cover, botErr, shots };
}

/**
 * SAMSVAR: vinnerrunden i nettleseren mot simuleringens bånd (sim.json). Bare et tap der
 * simuleringen nesten aldri taper, er et funn - resten er tilfeldighet og rapporteres.
 */
function checkAgainstSim(rep, sim, r, lav) {
    if (!r) return;
    if (r.botErr) return; // meldt som funn allerede
    const band = sim?.vinner?.bånd;
    if (!band || sim.vinner.navn !== r.bot) {
        if (r.fase === 'tapt') rep.notes.push(`«${r.bot}» tapte i nettleseren${r.arsak ? ` (${r.arsak})` : ''} - uten sim.json kan det ikke sammenlignes`);
        return;
    }
    const s = Math.max(0, Math.min(band.length - 1, Math.floor(r.tid ?? 0)));
    const b = band[s];
    if (r.fase === 'tapt') {
        const msg = `«${r.bot}» tapte i nettleseren etter ${Math.round(r.tid ?? 0)} spillsekunder${r.arsak ? ` (${r.arsak})` : ''}, men i simuleringen taper den så tidlig i bare ${(b.tapt * 100).toFixed(1)} % av rundene`;
        // 1 %: taper nettleseren sjeldnere enn det i simuleringen, er sjansen for et falskt
        // funn høyst 1 % når de to spiller samme spill. (3 % ga rødt for lonna 29.09, der
        // vinneren taper 3 % av alle runder - nesten alle helt på slutten.)
        if (b.tapt >= 0.01) rep.notes.push(`«${r.bot}» tapte i nettleseren${r.arsak ? ` (${r.arsak})` : ''} - skjer i ${(b.tapt * 100).toFixed(0)} % av de simulerte rundene, ikke et funn`);
        else if (lav) rep.infra = `${msg} - men målingen er ugyldig (${lav.takt.toFixed(1)} grep per spillsekund). Senk --fart, ikke endre spillet`;
        else rep.findings.push(`${msg}. Nettleseren spiller ikke samme spill som simuleringen: finn forskjellen i koden (tidssteg, input-vei, tilstand utenfor game.ts), ikke skru på reglene`);
        return;
    }
    const st = sim.bots.find((x) => x.navn === r.bot);
    if (r.fase === 'vunnet' && st) {
        rep.notes.push(`samsvar: «${r.bot}» vant med ${r.poeng} poeng - simuleringen vinner ${Math.round(st.vinn * 100)} % med median ${st.median} (p10-p90 ${st.p10}-${st.p90})`);
        return;
    }
    if (b.poeng) {
        const [lo, hi] = b.poeng;
        const inne = r.poeng >= lo * 0.8 && r.poeng <= hi * 1.2;
        rep.notes.push(`samsvar: «${r.bot}» ${r.fase} med ${r.poeng} poeng ved ${Math.round(r.tid ?? 0)} s - simuleringen ${lo}-${hi} (p2-p98)${inne ? '' : ' ⚠️ utenfor båndet'}`);
    } else rep.notes.push(`samsvar: «${r.bot}» ${r.fase} med ${r.poeng} poeng`);
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
    // Mål JS-arbeidet per bilde: summen av alle requestAnimationFrame-kall i samme bilde
    // (spillogikk, three.js-oppsett av draw calls, React-arbeid som skjer i løkka).
    await page.addInitScript(() => {
        const raf = window.requestAnimationFrame.bind(window);
        window.__rafWork = [];
        window.requestAnimationFrame = (cb) =>
            raf((t) => {
                const s0 = performance.now();
                try {
                    cb(t);
                } finally {
                    if (window.__rafRec) {
                        const d = performance.now() - s0;
                        if (t !== window.__rafLastT) {
                            window.__rafWork.push(d);
                            window.__rafLastT = t;
                        } else window.__rafWork[window.__rafWork.length - 1] += d;
                    }
                }
            });
    });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && !NOISE.test(m.text()) && errors.push(m.text()));
    page.on('pageerror', (e) => !NOISE.test(String(e)) && errors.push(String(e)));
    try {
        const t0 = Date.now();
        await page.goto(`${baseUrl}/mikrospill/${id}?mgfart=${fart}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
        try {
            await page.locator('.mg-launcher').first().click({ timeout: 4000 });
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
        // Innflygingen fra startkortet (MicroGameIntro) ligger over spillet til det er klart.
        await page.waitForSelector('[data-mg-intro]', { state: 'detached', timeout: 20000 }).catch(() => {});
        // Fullskjerm-først: eleven møter spillet i fullskjerm, så robotene og
        // skjermbildene skal også gjøre det.
        // Startkortet («Spill») ber selv om fullskjerm; ellers trykker vi knappen i rammen.
        const isFull = () => page.evaluate(() => !!document.querySelector('.mg-pseudo-fs, .mg-frame--fill'));
        if (!(await isFull())) {
            await page.click('button[aria-label="Spill i fullskjerm"]', { timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(800);
        }
        rep.notes.push((await isFull()) ? 'spilt i fullskjerm' : 'IKKE i fullskjerm - spilt i spalten');
        await page.evaluate(() => document.querySelector('[data-mg-stage]')?.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(1500);
        writeFileSync(path.join(dir, 'meny.png'), await stageShot(page));

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
                bots: Object.entries(api.bots).map(([k, b]) => ({ navn: k, forventer: b.forventer, tilfeldig: !!b.tilfeldig, beskrivelse: b.beskrivelse, variant: b.variant ?? null })),
            };
        }, id);
        if (!info.bots.some((b) => b.forventer === 'vinner')) rep.findings.push('ingen robot med forventer: vinner');
        if (!info.bots.some((b) => b.forventer === 'taper')) rep.findings.push('ingen robot med forventer: taper');
        const strict = !LEGACY.has(id);
        const feelFind = (msg) => (strict ? rep.findings : rep.notes).push(strict ? msg : `(spillfølelse, rapporteres bare for eldre spill) ${msg}`);
        if (!info.bots.some((b) => b.forventer === 'middels')) feelFind('ingen robot med forventer: middels - den viser at det lønner seg å bli bedre');
        if (!info.bots.some((b) => b.tilfeldig)) feelFind('ingen robot med tilfeldig: true - knappemoseren som skal tape');
        const badTilfeldig = info.bots.filter((b) => b.tilfeldig && b.forventer !== 'taper');
        for (const b of badTilfeldig) rep.findings.push(`«${b.navn}» er tilfeldig, men forventer ikke å tape`);

        // ROBOTER: simuleringen og nettleseren skal ha samme roboter, ellers måler de to ulike ting.
        const simFile = path.join(outDir, id, 'sim.json');
        const sim = existsSync(simFile) ? JSON.parse(readFileSync(simFile, 'utf8')) : null;
        if (!sim && !full) rep.notes.push('ingen sim.json - kjør `npx tsx scripts/sim-microgame.mts --ids ' + id + '` først, ellers sjekkes ikke samsvaret');
        if (sim) {
            const simBots = new Map(sim.bots.filter((b) => b.navn !== 'passiv').map((b) => [b.navn, b.forventer]));
            for (const b of info.bots)
                if (!simBots.has(b.navn)) rep.findings.push(`roboten «${b.navn}» finnes i spillet, men ikke i sim.ts`);
                else if (simBots.get(b.navn) !== b.forventer)
                    rep.findings.push(`«${b.navn}» forventer ${b.forventer} i spillet, men ${simBots.get(b.navn)} i sim.ts`);
            for (const n of simBots.keys())
                if (!info.bots.some((b) => b.navn === n)) rep.findings.push(`roboten «${n}» finnes i sim.ts, men ikke i spillet (usePlaytest)`);
        }

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
        const passiv = await playRound(page, id, null, null, info.maks, dir, { prefix: 'passiv', times: [2, 7, 12] }, full ? null : SMOKE_PASSIV_TID);
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
        const smokeBot = info.bots.find((b) => b.forventer === 'vinner');
        for (const b of info.bots) {
            if (onlyBots && !onlyBots.includes(b.navn)) continue;
            if (!full && b !== smokeBot) continue;
            const tries = b.forventer === 'vinner' && full ? 2 : 1;
            // 'middels' vurderes på poeng (ferdighetstak) under, ikke på vunnet/tapt.
            let won = false;
            const film = b.forventer === 'vinner' && !rep.rounds.some((r) => r.forventer === 'vinner');
            for (let t = 0; t < tries && !won; t++) {
                const plan = film && t === 0 ? { prefix: 'film', times: [3, 10, 20, 35, 55, 80, 110, 150], cover: makeCover } : null;
                const r = await playRound(page, id, b.navn, b.variant, info.maks, t === 0 ? dir : null, plan, full ? null : maksTid);
                r.forventer = b.forventer;
                r.tilfeldig = b.tilfeldig;
                rep.rounds.push(r);
                if (r.botErr) rep.findings.push(`roboten «${b.navn}» kastet unntak: ${r.botErr.split('\n')[0]}`);
                if (r.fase === 'vunnet') won = true;
                if (r.fase === 'tidsavbrudd') rep.notes.push(`«${b.navn}» nådde ikke slutten innen tidstaket (${r.secs} s)`);
            }
            const mine = rep.rounds.filter((r) => r.bot === b.navn);
            const lav = mine.find((r) => r.takt !== null && r.takt < 4);
            if (lav)
                rep.notes.push(`«${b.navn}» fikk bare ${lav.takt.toFixed(1)} grep per spillsekund (mål 5) - spillet går fortere per bilde enn roboten rekker å svare`);
            if (!full && b.forventer === 'vinner') {
                checkAgainstSim(rep, sim, mine[0], lav);
                continue;
            }
            if (b.forventer === 'vinner' && !won) {
                const why = mine.map((r) => r.arsak).filter(Boolean);
                const msg = `«${b.navn}» skal vinne, men vant ingen av ${tries} runder${why.length ? ` (tapte på: ${[...new Set(why)].join('; ')})` : ''}`;
                // Ugyldig måling er ikke en spillfeil: ikke send agenten på jakt etter den.
                if (lav) rep.infra = `${msg} - men målingen er ugyldig (${lav.takt.toFixed(1)} grep per spillsekund). Kjør med lavere --fart, ikke endre spillet`;
                else rep.findings.push(msg + ' - sammenlign med simuleringen (samme dt og BOT_EVERY som i playtest.ts)');
            }
            if (b.forventer === 'taper' && won)
                rep.findings.push(
                    b.tilfeldig
                        ? `knappemoseren «${b.navn}» (tilfeldige grep) VANT - det lønner seg ikke å tenke. Gjør fagregelen avgjørende`
                        : `«${b.navn}» skal tape, men VANT`
                );
        }

        // CHROMEBOOK: én vinnerrunde med strupet prosessor. Nivået (kit/quality.ts) gjettes
        // av spillet selv - headless-GPU-en er programvare, så det blir «lav», akkurat som
        // på en svak Chromebook.
        const vinner = info.bots.find((b) => b.forventer === 'vinner');
        if (vinner) {
            const cdp = await page.context().newCDPSession(page);
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: CB_THROTTLE });
            await page.evaluate(
                ({ id, bot, variant }) => {
                    const api = window.__mgPlaytest[id];
                    clearInterval(window.__mgBotTimer);
                    api.start(variant ?? undefined);
                    window.__mgBotTimer = setInterval(() => {
                        try {
                            if (api.snapshot().fase === 'spiller') api.bots[bot].tick();
                        } catch {
                            /* målt i vanlige runder */
                        }
                    }, 200);
                },
                { id, bot: vinner.navn, variant: vinner.variant }
            );
            await page.waitForTimeout(3000); // forbi innflyging og første shader-kompilering
            await page.evaluate(() => {
                window.__rafWork = [];
                window.__rafRec = true;
            });
            const draw = { calls: 0, triangles: 0 };
            const tEnd = Date.now() + 10000;
            while (Date.now() < tEnd) {
                const ri = await page.evaluate(() => (window.__mgRenderInfo ? window.__mgRenderInfo() : null)).catch(() => null);
                if (ri) {
                    draw.calls = Math.max(draw.calls, ri.calls);
                    draw.triangles = Math.max(draw.triangles, ri.triangles);
                }
                await page.waitForTimeout(500);
            }
            const cb = await page.evaluate(() => {
                window.__rafRec = false;
                clearInterval(window.__mgBotTimer);
                const w = window.__rafWork.slice().sort((a, b) => a - b);
                const q = (x) => w[Math.min(w.length - 1, Math.floor(w.length * x))] ?? 0;
                return { frames: w.length, p50: q(0.5), p95: q(0.95), tier: window.__mgQuality?.tier ?? null };
            });
            await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
            await cdp.detach().catch(() => {});
            rep.chromebook = { ...cb, ...draw };
            rep.notes.push(
                `Chromebook (CPU ×${CB_THROTTLE}${cb.tier ? `, nivå ${cb.tier}` : ''}): JS per bilde p50 ${cb.p50.toFixed(1)} ms / p95 ${cb.p95.toFixed(1)} ms` +
                    (draw.calls ? `, ${draw.calls} draw calls, ${Math.round(draw.triangles / 1000)}k trekanter` : '')
            );
            // Spill fra før Chromebook-porten (26.09) får tallene som notat - de er allerede ute.
            const cbFind = LEGACY.has(id) ? rep.notes : rep.findings;
            if (cb.frames > 10 && cb.p95 > CB_LIMITS.jsP95)
                cbFind.push(`${LEGACY.has(id) ? '(eldre spill, bare rapport) ' : ''}` +
                    `for tungt for Chromebook: ${cb.p95.toFixed(1)} ms JS per bilde (p95, CPU ×${CB_THROTTLE}) - maks ${CB_LIMITS.jsP95}. Se «Chromebook først» i guiden`
                );
            if (draw.calls > CB_LIMITS.calls)
                cbFind.push(`${draw.calls} draw calls - maks ${CB_LIMITS.calls} for en Chromebook-GPU (slå sammen mesher, bruk InstancedMesh)`);
            if (draw.triangles > CB_LIMITS.triangles)
                cbFind.push(`${Math.round(draw.triangles / 1000)}k trekanter - maks ${CB_LIMITS.triangles / 1000}k for en Chromebook-GPU`);
            // Tilbake til en ren runde-tilstand for resten av sjekkene.
            await page.evaluate((id) => window.__mgPlaytest[id].start(), id);
        }

        // FERDIGHET, SPILLFØLELSE og trappen: i røyktesten er det simuleringens jobb.
        if (full) {
        // FERDIGHET: beste vinnerrunde over alle taperrunder
        const vinn = rep.rounds.filter((r) => r.forventer === 'vinner' && r.fase === 'vunnet').map((r) => r.poeng);
        const tap = rep.rounds.filter((r) => r.forventer === 'taper' || r.bot === 'passiv').map((r) => r.poeng);
        if (vinn.length && tap.length && Math.max(...vinn) <= Math.max(...tap))
            rep.findings.push(`dyktig spill gir ikke flere poeng (vinner ${Math.max(...vinn)} <= taper ${Math.max(...tap)})`);

        // SPILLFØLELSE: valg per minutt og eskalering (fra beste vinnerrunde), ferdighetstak.
        const vRound = rep.rounds.find((r) => r.forventer === 'vinner' && r.fase === 'vunnet') ?? rep.rounds.find((r) => r.forventer === 'vinner');
        const f = vRound?.feel;
        rep.feel = f ?? null;
        if (!f || f.valgPerMin === null) feelFind('snapshot() har ikke `valg` (beslutningspunkter) - valg per minutt kan ikke måles');
        else {
            rep.notes.push(`spillfølelse: ${f.valgPerMin.toFixed(1)} valg per minutt (runde «${vRound.bot}»)`);
            if (f.valgPerMin < FEEL.valgPerMin)
                feelFind(`bare ${f.valgPerMin.toFixed(1)} valg per minutt (min ${FEEL.valgPerMin}) - eleven venter mer enn de velger. Gi flere synlige valg: nye trusler, tilbud, avveiinger`);
        }
        if (!f || f.pressFirst === null) feelFind('snapshot() har ikke `press` (0-1) - eskaleringen kan ikke måles');
        else {
            rep.notes.push(`presskurve: ${f.pressFirst.toFixed(2)} i første tredjedel -> ${f.pressMid.toFixed(2)} -> ${f.pressLast.toFixed(2)} i siste`);
            if (f.pressLast < f.pressFirst + FEEL.pressLift)
                feelFind(`presset stiger ikke (${f.pressFirst.toFixed(2)} -> ${f.pressLast.toFixed(2)}, krever +${FEEL.pressLift}) - spillet må eskalere mot slutten`);
        }
        // Trappen sammenligner enkeltrunder, og i et spill med mye tilfeldighet er én runde et
        // myntkast (28.09: ~20 % falske røde for inn-mot-stranda i simuleringen). Er den på
        // kanten, spilles én runde til for middels og vinner, og snittet for middels teller.
        // En trapp som virkelig er ødelagt, feiler begge gangene.
        const ladder = () => {
            const mid = rep.rounds.filter((r) => r.forventer === 'middels').map((r) => r.poeng);
            if (!mid.length) return null;
            const bestV = Math.max(0, ...rep.rounds.filter((r) => r.forventer === 'vinner').map((r) => r.poeng));
            const bestT = Math.max(0, ...rep.rounds.filter((r) => r.forventer === 'taper' || r.bot === 'passiv').map((r) => r.poeng));
            const m = Math.round(mid.reduce((a, b) => a + b, 0) / mid.length);
            return { bestV, bestT, m, n: mid.length, ok: m > bestT && m < bestV * 0.95 };
        };
        let L = ladder();
        if (L && !L.ok) {
            rep.notes.push(`ferdighetstrappen var på kanten (taper ${L.bestT}, middels ${L.m}, vinner ${L.bestV}) - én runde til for middels og vinner`);
            for (const want of ['middels', 'vinner']) {
                const b = info.bots.find((x) => x.forventer === want);
                if (!b) continue;
                const r = await playRound(page, id, b.navn, b.variant, info.maks, null, null);
                r.forventer = b.forventer;
                rep.rounds.push(r);
            }
            L = ladder();
        }
        if (L) {
            rep.notes.push(`ferdighetstrapp: taper ${L.bestT} < middels ${L.m}${L.n > 1 ? ` (snitt av ${L.n})` : ''} < vinner ${L.bestV}`);
            if (!L.ok)
                feelFind(`ferdighetstrappen holder ikke (taper ${L.bestT}, middels ${L.m}, vinner ${L.bestV}) - den halvgode skal havne mellom, og god spilling skal gi merkbart mer`);
        }
        } else {
            const f = rep.rounds.find((r) => r.forventer === 'vinner')?.feel;
            rep.feel = f ?? null;
            if (f?.valgPerMin != null) rep.notes.push(`spillfølelse i nettleseren: ${f.valgPerMin.toFixed(1)} valg per minutt (tallene som teller, står i simuleringen)`);
        }

        // TEKST DER BLIKKET ER (eier 2026-09-26: tekst under spillet blir ikke lest)
        const all = (k) => [...new Set(rep.rounds.flatMap((r) => r.coach?.[k] ?? []))];
        for (const t of all('longPins')) rep.findings.push(`lappen «${t}» har ${wordCount(t)} ord - maks 7, det er et skilt`);
        for (const t of all('longBanners')) rep.findings.push(`banneret «${t}» har ${wordCount(t)} ord - maks 5`);
        const maxBeats = Math.max(0, ...rep.rounds.map((r) => r.coach?.beats.length ?? 0));
        if (maxBeats > 3) rep.findings.push(`${maxBeats} lærings-øyeblikk i én runde - maks 3`);
        rep.notes.push(`tekstlag: ${all('beats').length} lærings-øyeblikk (${all('beats').join(', ') || 'ingen'}), ${all('pins').length} ulike lapper`);
        const ended = rep.rounds.filter((r) => r.fase === 'vunnet' || r.fase === 'tapt');
        if (ended.length && !ended.some((r) => r.lessons > 0))
            rep.findings.push('slutt-skjermen har ingen «Dette skjedde» (text.lesson + ArcadeLessons) - der skal fagstoffet stå');
        if (!ended.length) rep.notes.push('ingen runde ble ferdig - slutt-skjermen ble ikke sjekket');

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
                `tekst dekker midten av spillet i ${midWorst.toFixed(1)} s i strekk (maks 4, runde «${worstRound.bot}», tekst: «${worstRound.cover.midWorstText}») - kort ned banneret, eller fest teksten til tingen med en lapp (text.point)`
            );
        if (allWorst > 4) rep.findings.push(`tekst dekker over 35 % av spillvinduet i ${allWorst.toFixed(1)} s i strekk (maks 4)`);
        // STOR NOK SKRIFT (eier 2026-09-30 om Hammer og ambolt: «generelt for liten skrift»)
        const small = [...new Set(rep.rounds.flatMap((r) => r.cover.small ?? []))];
        if (small.length)
            rep.findings.push(`${small.length} tekster under ${MIN_FONT_PX} px i spillvinduet ved 1366×768, f.eks. ${small.slice(0, 4).join(', ')} - minste skrift er ${MIN_FONT_PX} px`);
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
        console.log(`   ${x.bot.padEnd(14)} ${x.fase.padEnd(11)} ${String(x.poeng).padStart(7)} p  framdrift ${(x.framdrift * 100).toFixed(0)} %  ${x.secs} s${x.takt ? `  ${x.takt.toFixed(1)} grep/spill-s` : ''}${x.arsak ? `  (${x.arsak})` : ''}`);
    for (const n of r.notes) console.log(`   · ${n}`);
    for (const f of r.findings) console.log(`   ✗ ${f}`);
    if (r.infra) console.log(`   ⚠ infrastruktur: ${r.infra}`);
    if (!r.findings.length && !r.infra) console.log('   ✓ alle porter grønne');
    reports.push(r);
}
await browser.close();
stopServer();

// Rapport
const md = [full ? '## Selvspill-port (full)' : '## Selvspill-port (røyktest i nettleser - balansen står under «Simulering»)', ''];
for (const r of reports) {
    const ok = !r.findings.length && !r.infra;
    md.push(`### ${ok ? '✅' : r.infra ? '⚠️' : '❌'} \`${r.id}\``, '');
    md.push('| Robot | Forventer | Resultat | Poeng | Framdrift | Tid | Grep/spill-s | Årsak |', '|---|---|---|---:|---:|---:|---:|---|');
    for (const x of r.rounds)
        md.push(`| ${x.bot}${x.variant ? ` (${x.variant})` : ''}${x.tilfeldig ? ' 🎲' : ''} | ${x.forventer ?? 'taper'} | ${x.fase} | ${x.poeng} | ${(x.framdrift * 100).toFixed(0)} % | ${x.secs} s | ${x.takt ? x.takt.toFixed(1) : '-'} | ${x.arsak ?? ''} |`);
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
