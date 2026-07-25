// Visuell revisjon av alle mikrospill i skala.
//
// Rendrer hvert registrerte mikrospill isolert på /mikrospill/<id>, tar
// skjermbilder (front + én orbit-vinkel) og fanger konsoll-advarsler/-feil per
// spill - inkludert DEV-vakthunden i kit/Boat ("båt på land / flyter"). Ut kommer
// .screenshots/microgames/<id>/{front,angle}.png og en _audit-summary.json som
// rangerer spillene etter hvor mange advarsler/feil de ga.
//
// Poenget: finne de "wacky" geometri-/plasseringsfeilene på tvers av HELE
// biblioteket uten å måtte åpne hvert spill manuelt. Skjermbildene vurderes
// etterpå (av et menneske eller en Claude-vurderingsrunde) mot en fast rubrikk.
//
// Bruk:
//   node scripts/audit-microgames.mjs                 # alle spill (starter vite selv)
//   node scripts/audit-microgames.mjs --ids fimreite-3d,hansakoggen-3d
//   node scripts/audit-microgames.mjs --limit 10
//   node scripts/audit-microgames.mjs --url http://localhost:5173   # bruk kjørende server
//
// Forutsetter en kjørende (eller auto-startet) Vite dev-server. Playwright må
// være installert: npm i -D playwright && npx playwright install chromium

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : def;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, '.screenshots', 'microgames');
const settleMs = Number(opt('settle', 2600));
const gapMs = Number(opt('gap', 1400));
const providedUrl = opt('url');
const port = Number(opt('port', 5173));

// --- Hent alle spill-ID-er fra registeret ---
const regSrc = readFileSync(path.join(root, 'src/components/microgames/registry.ts'), 'utf8');
let ids = [...regSrc.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
const only = opt('ids');
if (only) ids = only.split(',').map((s) => s.trim());
const limit = opt('limit');
if (limit) ids = ids.slice(0, Number(limit));
console.log(`Reviderer ${ids.length} mikrospill.`);

// --- Server (start vite selv hvis ingen --url er gitt) ---
let serverProc = null;
let baseUrl = providedUrl;

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
    // Kjør vite direkte (hopper over scan:content - mikrospill trenger det ikke).
    // detached: true → vite blir gruppeleder, så vi kan drepe HELE treet
    // (npx + vite) med process.kill(-pid). Uten dette overlever vite-barnet.
    serverProc = spawn('npx', ['vite', '--port', String(port)], {
        cwd: root,
        stdio: 'ignore',
        env: process.env,
        detached: true,
    });
    const up = await waitForServer(baseUrl);
    if (!up) {
        console.error('Dev-serveren kom ikke opp innen 120s.');
        serverProc.kill('SIGTERM');
        process.exit(1);
    }
    console.log(`Dev-server oppe på ${baseUrl}`);
}

// --- Render + skjermbilde per spill ---
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const summary = [];

// Varm opp dev-serveren FØR løkka. waitForServer sjekker bare at Vite svarer på
// «/», men på en kald kjøring (CI, tomt node_modules/.vite) må Vite transformere
// hele modultreet ved første sidelast. Uten oppvarming betaler det FØRSTE spillet
// i lista den regningen og ryker på 30s-timeouten - uansett hvilket spill det er.
try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 180000 });
} catch {
    /* oppvarming er best effort - la spill-løkka rapportere ekte feil */
}

for (const id of ids) {
    const warnings = [];
    const errors = [];
    const onConsole = (m) => {
        const t = m.type();
        if (t === 'warning') warnings.push(m.text());
        else if (t === 'error') errors.push(m.text());
    };
    const onPageError = (e) => errors.push(String(e));
    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const dir = path.join(outDir, id);
    mkdirSync(dir, { recursive: true });
    const entry = { id, ok: false, warnings: [], errors: [] };
    try {
        await page.goto(`${baseUrl}/mikrospill/${id}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });
        // MicroGameFrame starter kollapset - uten dette klikket avbildes bare det
        // lukkede kortet, og hele den visuelle revisjonen er blind.
        try {
            await page.getByText('Spill', { exact: true }).first().click({ timeout: 4000 });
        } catch {
            /* allerede ekspandert / annen ramme */
        }
        // Noen mikrospill er 2D (MicroGameFrame, ingen canvas). Manglende canvas er
        // derfor ikke nødvendigvis en feil - vi tar skjermbilde uansett (DOM-en
        // rendrer). Et 3D-spill som krasjer har også ingen canvas, men da fanges
        // konsollfeilen og spillet havner øverst i rangeringen.
        let hasCanvas = true;
        try {
            await page.waitForSelector('canvas', { timeout: 12000 });
        } catch {
            hasCanvas = false;
        }
        entry.twoD = !hasCanvas;
        await page.waitForTimeout(settleMs);

        // Nesten alle mikrospill auto-roterer (OrbitControls autoRotate). Ett bilde
        // fanger derfor en tilfeldig vinkel - en ås eller et objekt kan skjule
        // resten akkurat da. Sample i stedet flere bilder utover rotasjonen, så
        // vurderingen ser spillet fra flere sider.
        const FRAMES = Number(opt('frames', 4));
        for (let f = 0; f < FRAMES; f++) {
            await page.screenshot({ path: path.join(dir, `frame-${f + 1}.png`) });
            if (f < FRAMES - 1) await page.waitForTimeout(gapMs);
        }

        // Mekanisk selvrevisjon fra kit/MicroCanvas (modell utenfor utsnittet,
        // begravd geometri). Finnes bare når spillet har en MicroCanvas.
        entry.sceneWarnings = await page
            .evaluate(() => (window.__microSceneAudit ? window.__microSceneAudit() : []))
            .catch(() => []);

        entry.ok = true;
        console.log(
            `✓ ${id}  (${warnings.length} advarsler, ${errors.length} feil, ${
                (entry.sceneWarnings ?? []).length
            } scene-funn)`
        );
    } catch (e) {
        entry.error = String(e.message || e);
        console.log(`✗ ${id}  ${entry.error}`);
    } finally {
        // Filtrer bort kjent, spill-uavhengig støy (Firebase-presence o.l.).
        const noise =
            /firebase|permission_denied|websocket|Download the React DevTools|GL Driver Message|ReadPixels|GPU stall/i;
        entry.warnings = warnings.filter((w) => !noise.test(w));
        entry.errors = errors.filter((w) => !noise.test(w));
        page.off('console', onConsole);
        page.off('pageerror', onPageError);
    }
    summary.push(entry);
}

// Ranger etter mistanke: flest (feil, så advarsler) øverst, deretter render-feil.
summary.sort((a, b) => {
    const score = (x) =>
        (x.ok ? 0 : 1000) +
        x.errors.length * 10 +
        x.warnings.length +
        (x.sceneWarnings?.length ?? 0) * 5;
    return score(b) - score(a);
});
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, '_audit-summary.json'), JSON.stringify(summary, null, 2));

await browser.close();
if (serverProc) {
    try {
        process.kill(-serverProc.pid, 'SIGTERM'); // hele prosessgruppen (npx + vite)
    } catch {
        serverProc.kill('SIGTERM');
    }
}

const flagged = summary.filter(
    (s) => !s.ok || s.errors.length || s.warnings.length || (s.sceneWarnings?.length ?? 0)
);
console.log(`\nFerdig. Skjermbilder i ${outDir}`);
console.log(
    `${flagged.length}/${summary.length} spill flagget (render-feil, konsoll-varsler eller scene-funn).`
);
console.log('Se _audit-summary.json (rangert) og gå gjennom skjermbildene for de øverste.');
for (const s of flagged) {
    for (const w of s.sceneWarnings ?? []) console.log(`  ${s.id}: ${w}`);
    for (const w of s.warnings) console.log(`  ${s.id}: ${w}`);
    for (const e of s.errors) console.log(`  ${s.id}: FEIL ${e}`);
}

// --strict: brukes av CI-porten (.github/workflows/microgame-audit.yml). Et
// flagget spill skal STOPPE auto-merge - det er hele poenget med porten.
if (args.includes('--strict') && flagged.length) {
    console.error(`\n--strict: ${flagged.length} spill flagget - feiler.`);
    process.exit(1);
}
