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
//   CHROMEBOOK en runde med prosessoren strupet 4x (som en billig Chromebook): JS-tid per
//              bilde, draw calls og trekanter må holde seg innenfor budsjettet
//   SPILLFØLELSE (nye spill) nok valg per minutt, presset stiger gjennom runden, en
//              «middels» robot havner mellom taperne og vinneren (ferdighetstak), og en
//              «tilfeldig» knappemoser taper. Tallene gis også til den uavhengige vurderingen.
//   BRIEF      (nye spill) `kunst` i registry og docs/microgames/briefer/<id>.md finnes
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
// Maks 4: løkka klemmer hvert steg til 0,05 s, så ×4 gir 0,2 spillsekunder per bilde -
// nøyaktig ett robotgrep per bilde. Høyere fart gir robotene færre grep per spillsekund
// enn i simuleringen, og målingen blir feil (28.09: vinneren tapte bare i nettleseren).
const fart = Math.max(1, Math.min(4, Number(opt('fart', 4))));
if (Number(opt('fart', 4)) > 4) console.log('--fart er begrenset til 4 (robotene må få like mange grep per spillsekund som i simuleringen)');
const onlyBots = opt('bots') ? opt('bots').split(',') : null;
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
const LEGACY = new Set(['havet-kommer', 'stavkirken-3d', 'lop-med-lonna-3d', 'plottebordet-3d']);
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

function staticChecks(id) {
    const f = [];
    const e = registryEntry(id);
    if (!e) return [`finnes ikke i registry.ts`];
    if (!e.sjanger) f.push(`registry-oppføringen mangler \`sjanger\``);
    if (!e.tone) f.push(`registry-oppføringen mangler \`tone\` ('lett' | 'alvorlig')`);
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

async function playRoundOnce(page, id, bot, variant, maksSekunder, shotsDir, shotPlan = null) {
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
    const cover = { midRun: 0, allRun: 0, midWorst: 0, allWorst: 0, samples: 0, midWorstText: '' };
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
            const c = await page.evaluate(measureTextCover);
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
            }
            // Plakaten til startkortet: et bilde midt i god spilling, uten tekstlaget
            // og uten HUD (lapper, poeng og knapper hører til spillet, ikke til plakaten).
            if (shotPlan?.cover && !shotPlan.coverDone && startMs !== null && (Date.now() - t0 - startMs) / 1000 >= coverAt) {
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
                const t = (Date.now() - t0 - startMs) / 1000;
                const due = shotPlan.times[shots.length];
                if (due !== undefined && t >= due) {
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
    return { lessons, takt, arsak: snap?.årsak ?? null, feel: feelStats(feel), coach: { beats: [...coach.beats], pins: [...coach.pins], longPins: [...coach.longPins], longBanners: [...coach.longBanners] }, tempo, bot: bot ?? 'passiv', variant, fase: done ? snap.fase : 'tidsavbrudd', poeng: snap?.poeng ?? 0, framdrift: snap?.framdrift ?? 0, secs, startMs, cover, botErr, shots };
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
        const isFull = () => page.evaluate(() => !!document.fullscreenElement || !!document.querySelector('.mg-pseudo-fs'));
        if (!(await isFull())) {
            await page.click('button[aria-label="Spill i fullskjerm"]', { timeout: 3000 }).catch(() => {});
            await page.waitForTimeout(800);
        }
        rep.notes.push((await isFull()) ? 'spilt i fullskjerm' : 'IKKE i fullskjerm - nettleseren avviste det, spilt i spalten');
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
            // 'middels' vurderes på poeng (ferdighetstak) under, ikke på vunnet/tapt.
            let won = false;
            const film = b.forventer === 'vinner' && !rep.rounds.some((r) => r.forventer === 'vinner');
            for (let t = 0; t < tries && !won; t++) {
                const plan = film && t === 0 ? { prefix: 'film', times: [3, 10, 20, 35, 55, 80, 110, 150], cover: makeCover } : null;
                const r = await playRound(page, id, b.navn, b.variant, info.maks, t === 0 ? dir : null, plan);
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
            if (cb.frames > 10 && cb.p95 > CB_LIMITS.jsP95)
                rep.findings.push(
                    `for tungt for Chromebook: ${cb.p95.toFixed(1)} ms JS per bilde (p95, CPU ×${CB_THROTTLE}) - maks ${CB_LIMITS.jsP95}. Se «Chromebook først» i guiden`
                );
            if (draw.calls > CB_LIMITS.calls)
                rep.findings.push(`${draw.calls} draw calls - maks ${CB_LIMITS.calls} for en Chromebook-GPU (slå sammen mesher, bruk InstancedMesh)`);
            if (draw.triangles > CB_LIMITS.triangles)
                rep.findings.push(`${Math.round(draw.triangles / 1000)}k trekanter - maks ${CB_LIMITS.triangles / 1000}k for en Chromebook-GPU`);
            // Tilbake til en ren runde-tilstand for resten av sjekkene.
            await page.evaluate((id) => window.__mgPlaytest[id].start(), id);
        }

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
        const mid = rep.rounds.filter((r) => r.forventer === 'middels').map((r) => r.poeng);
        if (mid.length) {
            const bestV = Math.max(0, ...rep.rounds.filter((r) => r.forventer === 'vinner').map((r) => r.poeng));
            const bestT = Math.max(0, ...rep.rounds.filter((r) => r.forventer === 'taper' || r.bot === 'passiv').map((r) => r.poeng));
            const m = Math.max(...mid);
            rep.notes.push(`ferdighetstrapp: taper ${bestT} < middels ${m} < vinner ${bestV}`);
            if (!(m > bestT && m < bestV * 0.95))
                feelFind(`ferdighetstrappen holder ikke (taper ${bestT}, middels ${m}, vinner ${bestV}) - den halvgode skal havne mellom, og god spilling skal gi merkbart mer`);
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
const md = ['## Selvspill-port', ''];
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
