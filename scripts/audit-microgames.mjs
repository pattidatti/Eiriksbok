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
// NB: vent til nettverket er stille før løkka. Navigerer vi videre mens
// main.tsx fortsatt henter manifest/registry, avbrytes de kallene, og
// «Failed to fetch» blir feilaktig bokført på det første spillet.
try {
    await page.goto(baseUrl, { waitUntil: 'load', timeout: 180000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
} catch {
    /* oppvarming er best effort - la spill-løkka rapportere ekte feil */
}

// Feil som IKKE er spillets skyld: kald Vite-transform, avbrutte bootstrap-fetch,
// død dev-server. Historikk: PR #246 ble flagget to ganger på slike - først
// «page.goto: Timeout», så «Failed to fetch» på manifest/registry - og
// bot-kommentaren meldte begge som «feil i dette spillet». De skal retryes og,
// hvis de vedvarer, rapporteres som «auditen kunne ikke kjøre» (exit 2) - ikke
// som en geometrifeil eleven ville sett.
// Mønsteret er bevisst SMALT. Feiler det, skal det feile mot å flagge: en falsk
// positiv koster en ny kjøring, en falsk negativ slipper et ødelagt spill ut til
// elevene. Derfor:
// - «page.goto: Timeout», ikke generell «Timeout Nms exceeded» - sistnevnte ville
//   også dekket en canvas som aldri kommer, og det ER en ekte spillfeil.
// - «Failed to fetch» kun sammen med bootstrap-kontekst (contentLoader/manifest/
//   registry). Et spill som ikke får lastet SINE egne data skal flagges.
const INFRA_RE =
    /page\.goto: (Timeout|net::ERR_)|net::ERR_CONNECTION|ECONNREFUSED|Error loading (manifest|registry)|ContentRegistry\].*Failed to fetch|contentLoader\.ts|Target (page|closed)|browser has been closed/i;

const isInfra = (t) => INFRA_RE.test(String(t));

async function auditGame(id) {
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
    } catch (e) {
        entry.error = String(e.message || e);
    } finally {
        // Filtrer bort kjent, spill-uavhengig støy (Firebase-presence o.l.).
        const noise =
            /firebase|permission_denied|websocket|Download the React DevTools|GL Driver Message|ReadPixels|GPU stall/i;
        entry.warnings = warnings.filter((w) => !noise.test(w));
        entry.errors = errors.filter((w) => !noise.test(w));
        page.off('console', onConsole);
        page.off('pageerror', onPageError);
    }

    // Del funnene i infrastruktur (ikke spillets skyld) og ekte spillfunn.
    entry.infraFindings = [entry.error, ...entry.errors].filter(Boolean).filter(isInfra);
    entry.errors = entry.errors.filter((e) => !isInfra(e));
    if (entry.error && isInfra(entry.error)) delete entry.error;
    entry.gameFindings =
        (entry.error ? 1 : 0) +
        entry.errors.length +
        entry.warnings.length +
        (entry.sceneWarnings?.length ?? 0);
    return entry;
}

for (const id of ids) {
    // Retry én gang når FØRSTE forsøk bare ga infrastruktur-funn. En kald runner
    // skal ikke få se ut som et ødelagt spill (PR #246). Vedvarer det, rapporteres
    // det som infrastruktur - ikke som spillfeil.
    let entry = await auditGame(id);
    if (entry.infraFindings.length && entry.gameFindings === 0) {
        console.log(`… ${id}  infrastruktur-funn på forsøk 1 - prøver én gang til`);
        entry = await auditGame(id);
    }

    // NB: logg de FILTRERTE tallene. Tidligere ble de ufiltrerte brukt her, så et
    // reint spill kunne stå som «✓ vesterled-3d (4 advarsler)» der alle fire var
    // Firebase-støy - og et menneske jaktet på et problem som ikke fantes.
    const nScene = (entry.sceneWarnings ?? []).length;
    if (entry.error) console.log(`✗ ${entry.id}  ${entry.error}`);
    else if (entry.infraFindings.length && entry.gameFindings === 0)
        console.log(`⚠ ${entry.id}  auditen kunne ikke kjøre (infrastruktur, ikke spillet)`);
    else
        console.log(
            `${entry.gameFindings ? '✗' : '✓'} ${entry.id}  (${entry.warnings.length} advarsler, ${
                entry.errors.length
            } feil, ${nScene} scene-funn)`
        );
    summary.push(entry);
}

// Ranger etter mistanke: ekte render-feil øverst, så feil, scene-funn, advarsler.
// Infrastruktur-funn teller IKKE - de sier ingenting om spillet.
summary.sort((a, b) => {
    const score = (x) =>
        (x.error ? 1000 : 0) +
        x.errors.length * 10 +
        (x.sceneWarnings?.length ?? 0) * 5 +
        x.warnings.length;
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

const flagged = summary.filter((s) => s.gameFindings > 0);
const infraOnly = summary.filter((s) => s.gameFindings === 0 && s.infraFindings.length);
console.log(`\nFerdig. Skjermbilder i ${outDir}`);
console.log(
    `${flagged.length}/${summary.length} spill flagget (render-feil, konsoll-varsler eller scene-funn).`
);
if (infraOnly.length)
    console.log(
        `${infraOnly.length}/${summary.length} spill kunne ikke revideres (infrastruktur, ikke spillet).`
    );
console.log('Se _audit-summary.json (rangert) og gå gjennom skjermbildene for de øverste.');

// Bygg funnlista én gang, både til stdout og til PR-kommentaren. Porten skal
// SITERE funnene sine - tidligere påsto bot-kommentaren «fant feil i dette
// spillet» uten å vise noe, og tok feil to ganger på rad (PR #246).
const lines = [];
for (const s of flagged) {
    if (s.error) lines.push(`- \`${s.id}\`: rendret ikke - ${s.error}`);
    for (const w of s.sceneWarnings ?? []) lines.push(`- \`${s.id}\`: ${w}`);
    for (const w of s.warnings) lines.push(`- \`${s.id}\`: ${w}`);
    for (const e of s.errors) lines.push(`- \`${s.id}\`: FEIL ${e}`);
}
for (const l of lines) console.log('  ' + l.replace(/^- /, '').replace(/`/g, ''));

const md = flagged.length
    ? [
          `**Mikrospill-audit: ${flagged.length} av ${summary.length} spill flagget.**`,
          '',
          ...lines,
          '',
          'Skjermbilder ligger som artifact på kjøringen. Fiks funnene og push til branchen - da merges PR-en automatisk når sjekken er grønn.',
      ].join('\n')
    : infraOnly.length
      ? [
            `**Mikrospill-audit kunne ikke fullføres** for ${infraOnly.length} av ${summary.length} spill. Dette er harness-/infrastruktur-feil, ikke funn i spillet:`,
            '',
            ...infraOnly.flatMap((s) =>
                s.infraFindings.map((f) => `- \`${s.id}\`: ${f.split('\n')[0]}`)
            ),
            '',
            'Kjør sjekken på nytt. Går den igjen, er det harnessen som må fikses - ikke spillet.',
        ].join('\n')
      : `**Mikrospill-audit grønn** - ${summary.length} spill revidert, ingen funn.`;
writeFileSync(path.join(outDir, '_findings.md'), md + '\n');

// --strict: brukes av CI-porten (.github/workflows/microgame-audit.yml).
// Exit 1 = spillet har feil (fiks spillet). Exit 2 = auditen kunne ikke kjøre
// (fiks harnessen/kjør på nytt). Begge holder porten rød, for et urevidert spill
// skal ikke merges - men de skal ikke meldes med samme diagnose.
if (args.includes('--strict')) {
    if (flagged.length) {
        console.error(`\n--strict: ${flagged.length} spill flagget - feiler.`);
        process.exit(1);
    }
    if (infraOnly.length) {
        console.error(
            `\n--strict: ${infraOnly.length} spill kunne ikke revideres (infrastruktur) - feiler med exit 2.`
        );
        process.exit(2);
    }
}
