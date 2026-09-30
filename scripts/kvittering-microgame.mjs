// Kvittering for hva et mikrospill kostet å lage: tokens, steg, leseandel og ombygginger.
//
// Leser Claude Code-loggene på denne maskinen (~/.claude/projects/<prosjekt>/*.jsonl, med
// underagentene i <økt>/subagents/) og git-historikken til spillet. En økt regnes til det spillet
// den rører oftest (filstier i verktøykallene). Nattrutinen kjører i skyen og har ingen logger
// her - kvitteringen dekker spill laget i chat på denne maskinen.
//
// Hvorfor: uten tall gjetter vi om en ny arbeidsmåte virker. Sammenlign nye spill med de gamle.
//
// Bruk:
//   node scripts/kvittering-microgame.mjs --ids hammer-og-ambolt
//   node scripts/kvittering-microgame.mjs --alle              # alle arkadespill med selvspill
//   node scripts/kvittering-microgame.mjs --alle --skriv      # også til docs/microgames/kvitteringer.md

import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from 'fs';
import { execFileSync } from 'child_process';
import path from 'path';
import os from 'os';

const root = process.cwd();
const mgDir = path.join(root, 'src/components/microgames');
const arg = (k) => {
    const i = process.argv.indexOf(k);
    return i > -1 ? process.argv[i + 1] : null;
};
const logDir =
    arg('--logger') ?? path.join(os.homedir(), '.claude/projects', root.replace(/[/.]/g, '-'));

// ---------------------------------------------------------------------------
// Spillene: id -> komponentfil og mappe
// ---------------------------------------------------------------------------

const regSrc = readFileSync(path.join(mgDir, 'registry.ts'), 'utf8');
function game(id) {
    const start = regSrc.indexOf(`id: '${id}'`);
    if (start < 0) return null;
    const block = regSrc.slice(start, regSrc.indexOf('\n    },', start));
    const comp = block.match(/import\('\.\/([^']+)'\)/)?.[1];
    if (!comp || !existsSync(path.join(mgDir, comp + '.tsx'))) return null;
    const src = readFileSync(path.join(mgDir, comp + '.tsx'), 'utf8');
    const counts = {};
    for (const m of src.matchAll(/from '\.\/([\w-]+)\//g)) counts[m[1]] = (counts[m[1]] ?? 0) + 1;
    const mappe = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const title = block.match(/title:\s*'([^']+)'/)?.[1] ?? id;
    return { id, comp, mappe, title, playtest: src.includes('usePlaytest(') };
}
const allIds = [...regSrc.matchAll(/^\s{8}id: '([^']+)'/gm)].map((m) => m[1]);
const games = allIds.map(game).filter(Boolean);

let ids = arg('--ids')?.split(',') ?? null;
if (process.argv.includes('--alle')) ids = games.filter((g) => g.playtest && g.mappe).map((g) => g.id);
if (!ids?.length) {
    console.error('Bruk: --ids <id>[,<id>] | --alle  [--skriv] [--logger <mappe>]');
    process.exit(1);
}

// Nøkler en økt kan røre et spill med. Mappa er sikrest; komponentnavnet fanger resten.
const keysOf = (g) => [g.mappe && `microgames/${g.mappe}/`, `${g.comp}.tsx`].filter(Boolean);

// ---------------------------------------------------------------------------
// Loggene
// ---------------------------------------------------------------------------

const WRITE_CMD = /python3 - <<|sed -i|cat > |tee |apply_patch|> [\w./-]+\.(ts|tsx)\b/;
const READ_CMD = /^\s*(cd [^;&]+(;|&&)\s*)?(sed|cat|grep|head|tail|rg|awk|wc|ls|find)\b/;

function parse(file) {
    const s = { steg: 0, lest: 0, cacheSkriv: 0, ut: 0, maksKontekst: 0, lesesteg: 0, verktoy: 0, bilder: 0, eier: 0, start: null, slutt: null, tekst: [] };
    for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!line) continue;
        let d;
        try {
            d = JSON.parse(line);
        } catch {
            continue;
        }
        if (d.timestamp) {
            s.start ??= d.timestamp;
            s.slutt = d.timestamp;
        }
        const m = d.message ?? {};
        if (d.type === 'user') {
            if (typeof m.content === 'string' && !m.content.startsWith('<') && !m.content.startsWith('Another Claude session'))
                s.eier++;
            if (Array.isArray(m.content))
                for (const c of m.content)
                    if (c.type === 'tool_result' && Array.isArray(c.content))
                        s.bilder += c.content.filter((x) => x.type === 'image').length;
        }
        if (d.type !== 'assistant') continue;
        const u = m.usage ?? {};
        const ctx = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
        s.steg++;
        s.lest += ctx;
        s.cacheSkriv += u.cache_creation_input_tokens ?? 0;
        s.ut += u.output_tokens ?? 0;
        s.maksKontekst = Math.max(s.maksKontekst, ctx);
        for (const c of m.content ?? []) {
            if (c.type !== 'tool_use') continue;
            s.verktoy++;
            if (c.name === 'Read' || c.name === 'Grep' || c.name === 'Glob' || (c.name === 'Bash' && READ_CMD.test(c.input?.command ?? '')))
                s.lesesteg++;
            // Bare skrivende kall teller når økta skal knyttes til et spill: en økt som leser
            // mange spill (som en gjennomgang av alle), eier ingen av dem.
            if (c.name === 'Write' || c.name === 'Edit') s.tekst.push(c.input?.file_path ?? '');
            else if (c.name === 'Bash' && WRITE_CMD.test(c.input?.command ?? '') && !c.input.command.includes('.claude/projects'))
                s.tekst.push(c.input.command); // (skript som analyserer loggene, skriver ikke i spillet)
        }
    }
    return s;
}

const add = (a, b) => {
    for (const k of ['steg', 'lest', 'cacheSkriv', 'ut', 'lesesteg', 'verktoy', 'bilder', 'eier']) a[k] += b[k];
    a.maksKontekst = Math.max(a.maksKontekst, b.maksKontekst);
};

if (!existsSync(logDir)) {
    console.error(`Fant ikke loggene i ${logDir} (bruk --logger <mappe>)`);
    process.exit(2);
}
const sessions = readdirSync(logDir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => {
        const main = parse(path.join(logDir, f));
        const total = { ...main, tekst: undefined, underagenter: 0 };
        const edits = [...main.tekst];
        const subDir = path.join(logDir, f.replace(/\.jsonl$/, ''), 'subagents');
        if (existsSync(subDir) && statSync(subDir).isDirectory())
            for (const sf of readdirSync(subDir).filter((x) => x.endsWith('.jsonl'))) {
                const sub = parse(path.join(subDir, sf));
                add(total, sub);
                edits.push(...sub.tekst);
                total.underagenter++;
            }
        total.eier = main.eier; // underagentenes «brukermeldinger» er oppdrag, ikke eieren
        // Hvilket spill skriver økta (med underagenter) mest i? Tell på tvers av alle spill.
        const hay = edits.join('\n');
        let best = null;
        let bestN = 0;
        for (const g of games) {
            const n = keysOf(g).reduce((sum, k) => sum + hay.split(k).length - 1, 0);
            if (n > bestN) [best, bestN] = [g.id, n];
        }
        return { id: f.slice(0, 8), spill: bestN >= 3 ? best : null, ...total };
    });

// ---------------------------------------------------------------------------
// Git: første commit er leveringen, resten er rettelser
// ---------------------------------------------------------------------------

function commits(g) {
    const paths = [`src/components/microgames/${g.comp}.tsx`, g.mappe && `src/components/microgames/${g.mappe}`].filter(Boolean);
    const out = execFileSync('git', ['log', '--reverse', '--format=%h|%ad|%s', '--date=short', '--', ...paths], { encoding: 'utf8' });
    const all = out.trim().split('\n').filter(Boolean).map((l) => {
        const [h, dato, ...rest] = l.split('|');
        return { h, dato, msg: rest.join('|') };
    });
    // Felles opprydding (kit, skall, tegn-vask) rører mange spill; bare commits som nevner
    // spillet ved navn er levering eller rettelse av akkurat dette spillet.
    const navn = [g.title, g.id].map((x) => x.toLowerCase());
    const own = all.filter((c) => navn.some((n) => c.msg.toLowerCase().includes(n)));
    return own.length ? own : all;
}

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------

const M = (n) => (n / 1e6).toFixed(0) + 'M';
const K = (n) => Math.round(n / 1e3) + 'k';
const rows = [];
for (const id of ids) {
    const g = games.find((x) => x.id === id);
    if (!g) {
        console.error(`ukjent spill: ${id}`);
        continue;
    }
    const mine = sessions.filter((s) => s.spill === id);
    const sum = { steg: 0, lest: 0, cacheSkriv: 0, ut: 0, maksKontekst: 0, lesesteg: 0, verktoy: 0, bilder: 0, eier: 0 };
    let under = 0;
    for (const s of mine) {
        add(sum, s);
        under += s.underagenter;
    }
    const c = commits(g);
    rows.push({
        id,
        okter: mine.length,
        under,
        steg: sum.steg,
        lest: sum.lest,
        ut: sum.ut,
        maks: sum.maksKontekst,
        lesing: sum.verktoy ? Math.round((100 * sum.lesesteg) / sum.verktoy) : 0,
        bilder: sum.bilder,
        eier: sum.eier,
        levert: c[0]?.dato ?? '-',
        rettelser: Math.max(0, c.length - 1),
        okterListe: mine.map((s) => s.id).join(' '),
    });
}

const header =
    '| Spill | Økter (+underagenter) | Steg | Tokens lest | Tokens skrevet | Største kontekst | Lesesteg | Bilder | Eiermeldinger | Levert | Rettelses-commits |\n' +
    '|---|---|---|---|---|---|---|---|---|---|---|';
const table = rows
    .map((r) => `| ${r.id} | ${r.okter} (+${r.under}) | ${r.steg} | ${M(r.lest)} | ${K(r.ut)} | ${K(r.maks)} | ${r.lesing} % | ${r.bilder} | ${r.eier} | ${r.levert} | ${r.rettelser} |`)
    .join('\n');
const md = `${header}\n${table}\n`;
console.log(md);
for (const r of rows) if (r.okterListe) console.log(`${r.id}: økter ${r.okterListe}`);
const tomme = rows.filter((r) => !r.okter).map((r) => r.id);
if (tomme.length) console.log(`\nIngen lokale logger for: ${tomme.join(', ')} (laget av nattrutinen i skyen, eller loggene er slettet)`);

if (process.argv.includes('--skriv')) {
    const file = path.join(root, 'docs/microgames/kvitteringer.md');
    const intro =
        '# Kvitteringer for mikrospill\n\n' +
        'Generert av `node scripts/kvittering-microgame.mjs --alle --skriv`. «Tokens lest» er hele\n' +
        'konteksten lest inn på nytt ved hvert steg (hovedøkt + underagenter) - det er den som koster.\n' +
        '«Lesesteg» er andelen verktøykall som bare leser kode. «Rettelses-commits» er commits etter\n' +
        'den første, altså ombygginger etter levering.\n\n';
    writeFileSync(file, `${intro}Sist oppdatert ${new Date().toISOString().slice(0, 10)}.\n\n${md}`);
    console.log(`\nSkrevet til ${path.relative(root, file)}`);
}
