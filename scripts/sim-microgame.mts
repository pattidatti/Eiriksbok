// Simuleringsporten for mikrospill: spiller hundrevis av runder per robot mot spillreglene
// (game.ts + bots.ts) uten nettleser, og avgjør balansen på sekunder i stedet for en
// halvtime i headless Chromium. Kontrakten er src/components/microgames/sim.ts.
//
//   SPILLBART  vinnerroboten vinner minst 80 % av rundene
//   UTFORDRING passiv og knappemoseren vinner høyst 5 %, taperne høyst 10 %
//   FERDIGHET  vinnerens median slår 90-persentilen til hver taper
//   TRAPP      middels (median) havner over alle taperne og under vinneren
//   SPILLFØLELSE (nye spill) minst 6 valg per minutt, og presset stiger med minst 0,15
//   STABILT    ingen unntak, ingen runde som aldri blir ferdig
//
// Tallene er andeler og medianer over mange seedede runder, ikke myntkast: samme kode gir
// samme svar hver gang. Før (28.09) avgjorde nettleseren trappen med én eller to runder
// og ga ~8-20 % falske røde.
//
// Bruk:
//   npx tsx scripts/sim-microgame.mts --ids inn-mot-stranda
//   npx tsx scripts/sim-microgame.mts --ids inn-mot-stranda --runder 500 --bots seende,halvgod
//
// Exit 0 = grønn, 1 = funn i spillet, 2 = simuleringen kunne ikke kjøre.
// Rapport: .screenshots/playtest/_sim.md, og .screenshots/playtest/<id>/sim.json som
// nettleser-selvspillet sammenligner seg mot.

import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import { simRound, type SimRound, type SimSpec } from '../src/components/microgames/sim';

const args = process.argv.slice(2);
const opt = (name: string, def: string | null = null) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : def;
};
const ids = (opt('ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const RUNDER = Math.max(20, Number(opt('runder', '200')));
const onlyBots = opt('bots')?.split(',') ?? null;
if (!ids.length) {
    console.error('Bruk: npx tsx scripts/sim-microgame.mts --ids <id>[,<id>] [--runder 200]');
    process.exit(2);
}

// En taper som ignorerer fagregelen kan være heldig av og til; passiv og knappemoser nesten aldri.
const GATE = { vinner: 0.8, taper: 0.1, blind: 0.05, valgPerMin: 6, pressLift: 0.15 };
// Samme liste som i playtest-microgame.mjs: spill fra før generatoren (28.09) får
// spillfølelsen rapportert, ikke krevd.
const LEGACY = new Set(['havet-kommer', 'stavkirken-3d', 'lop-med-lonna-3d', 'plottebordet-3d']);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mgDir = path.join(root, 'src/components/microgames');
const outDir = path.join(root, '.screenshots', 'playtest');
mkdirSync(outDir, { recursive: true });

// id -> sim-fil. Hver mappe med sim.ts sier selv hvilket spill den er (spec.id).
const specs = new Map<string, SimSpec<unknown>>();
for (const d of readdirSync(mgDir, { withFileTypes: true })) {
    const f = path.join(mgDir, d.name, 'sim.ts');
    if (!d.isDirectory() || !existsSync(f)) continue;
    const mod = await import(pathToFileURL(f).href);
    const spec = mod.default as SimSpec<unknown>;
    if (spec?.id) specs.set(spec.id, spec);
}
const regSrc = readFileSync(path.join(mgDir, 'registry.ts'), 'utf8');

const q = (xs: number[], p: number) => {
    if (!xs.length) return 0;
    const s = [...xs].sort((a, b) => a - b);
    return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const median = (xs: number[]) => q(xs, 0.5);
const pct = (x: number) => `${Math.round(x * 100)} %`;

interface BotStats {
    navn: string;
    forventer: string;
    tilfeldig: boolean;
    runder: SimRound[];
    vinn: number;
    median: number;
    p10: number;
    p90: number;
    tid: number;
    årsaker: [string, number][];
}

function stats(navn: string, forventer: string, tilfeldig: boolean, runder: SimRound[]): BotStats {
    const poeng = runder.map((r) => r.poeng);
    const tap = new Map<string, number>();
    for (const r of runder)
        if (r.fase === 'tapt' && r.årsak) tap.set(r.årsak, (tap.get(r.årsak) ?? 0) + 1);
    return {
        navn,
        forventer,
        tilfeldig,
        runder,
        vinn: runder.filter((r) => r.fase === 'vunnet').length / runder.length,
        median: median(poeng),
        p10: q(poeng, 0.1),
        p90: q(poeng, 0.9),
        tid: median(runder.map((r) => r.tid)),
        årsaker: [...tap].sort((a, b) => b[1] - a[1]),
    };
}

/** Bånd per spillsekund for vinnerroboten: nettleseren sjekkes mot dette. */
function bands(runder: SimRound[]) {
    const maxT = Math.max(0, ...runder.map((r) => r.spor.length));
    const out = [];
    for (let s = 0; s < maxT; s++) {
        const alive = runder.filter((r) => r.spor.length > s);
        const ended = runder.filter((r) => r.spor.length <= s);
        out.push({
            tid: s,
            ferdig: ended.length / runder.length,
            tapt: ended.filter((r) => r.fase === 'tapt').length / runder.length,
            poeng: alive.length
                ? [
                      q(
                          alive.map((r) => r.spor[s].poeng),
                          0.02
                      ),
                      q(
                          alive.map((r) => r.spor[s].poeng),
                          0.98
                      ),
                  ]
                : null,
        });
    }
    return out;
}

interface Report {
    id: string;
    findings: string[];
    notes: string[];
    bots: BotStats[];
    infra: string | null;
    ms: number;
}

function simulate(id: string): Report {
    const rep: Report = { id, findings: [], notes: [], bots: [], infra: null, ms: 0 };
    const spec = specs.get(id);
    if (!spec) {
        if (LEGACY.has(id) || !regSrc.includes(`id: '${id}'`))
            rep.notes.push('ingen sim.ts - balansen er ikke simulert (eldre spill)');
        else
            rep.findings.push(
                'mangler simulering: lag `<mappe>/sim.ts` med `export default` en SimSpec (se src/components/microgames/sim.ts og stranda/sim.ts)'
            );
        return rep;
    }
    const t0 = Date.now();
    const strict = !LEGACY.has(id);
    const feel = (msg: string) =>
        (strict ? rep.findings : rep.notes).push(
            strict ? msg : `(spillfølelse, rapporteres bare for eldre spill) ${msg}`
        );

    const plan: [string | null, { forventer: string; tilfeldig?: boolean }][] = [
        [null, { forventer: 'taper' }],
        ...Object.entries(spec.bots).filter(([n]) => !onlyBots || onlyBots.includes(n)),
    ];
    for (const [navn, b] of plan) {
        const runder: SimRound[] = [];
        for (let i = 0; i < RUNDER; i++) runder.push(simRound(spec, navn, 1000 + i));
        const s = stats(navn ?? 'passiv', b.forventer, !!b.tilfeldig, runder);
        rep.bots.push(s);
        const feil = runder.find((r) => r.feil);
        if (feil)
            rep.findings.push(
                `«${s.navn}» kastet unntak (seed ${feil.seed}): ${feil.feil!.split('\n')[0]}`
            );
        const evig = runder.filter((r) => r.fase === 'tidsavbrudd' && !r.feil).length;
        if (evig)
            rep.findings.push(
                `«${s.navn}»: ${evig} av ${RUNDER} runder ble aldri ferdige innen maksSekunder (${spec.maksSekunder} s)`
            );
    }

    const vinnere = rep.bots.filter((b) => b.forventer === 'vinner');
    const tapere = rep.bots.filter((b) => b.forventer === 'taper');
    const middels = rep.bots.filter((b) => b.forventer === 'middels');
    if (!vinnere.length) rep.findings.push('ingen robot med forventer: vinner');
    if (tapere.length < 2) rep.findings.push('ingen robot med forventer: taper (utenom passiv)');
    if (!middels.length)
        feel('ingen robot med forventer: middels - den viser at det lønner seg å bli bedre');
    if (!rep.bots.some((b) => b.tilfeldig))
        feel('ingen robot med tilfeldig: true - knappemoseren som skal tape');
    for (const b of rep.bots.filter((b) => b.tilfeldig && b.forventer !== 'taper'))
        rep.findings.push(`«${b.navn}» er tilfeldig, men forventer ikke å tape`);

    // SPILLBART og UTFORDRING
    for (const v of vinnere) {
        if (v.vinn < GATE.vinner) {
            const why = v.årsaker
                .slice(0, 2)
                .map(([a, n]) => `${a} (${n})`)
                .join('; ');
            rep.findings.push(
                `«${v.navn}» skal vinne, men vant bare ${pct(v.vinn)} (krav ${pct(GATE.vinner)})${why ? ` - tapte på: ${why}` : ''}`
            );
        }
    }
    for (const t of tapere) {
        const maks = t.navn === 'passiv' || t.tilfeldig ? GATE.blind : GATE.taper;
        if (t.vinn > maks)
            rep.findings.push(
                t.navn === 'passiv'
                    ? `passiv spiller (ingen input) vant ${pct(t.vinn)} - valgene betyr for lite`
                    : t.tilfeldig
                      ? `knappemoseren «${t.navn}» vant ${pct(t.vinn)} - det lønner seg ikke å tenke. Gjør fagregelen avgjørende`
                      : `«${t.navn}» skal tape, men vant ${pct(t.vinn)} (maks ${pct(maks)})`
            );
    }

    // FERDIGHET og TRAPP
    const best = vinnere.reduce<BotStats | null>(
        (a, b) => (!a || b.median > a.median ? b : a),
        null
    );
    if (best) {
        for (const t of tapere)
            if (best.median <= t.p90)
                rep.findings.push(
                    `dyktig spill gir ikke nok flere poeng: «${best.navn}» median ${best.median} <= «${t.navn}» p90 ${t.p90}`
                );
        const taperTopp = Math.max(0, ...tapere.map((t) => t.median));
        for (const m of middels) {
            const ok = m.median > taperTopp && m.median < best.median * 0.95;
            rep.notes.push(
                `ferdighetstrapp (medianer): taper ${taperTopp} < middels ${m.median} < vinner ${best.median}`
            );
            if (!ok)
                feel(
                    `ferdighetstrappen holder ikke (medianer: taper ${taperTopp}, middels «${m.navn}» ${m.median}, vinner ${best.median}) - den halvgode skal havne mellom, og god spilling skal gi merkbart mer`
                );
        }

        // SPILLFØLELSE fra vinnerrundene
        const vpm = best.runder.map((r) => r.valgPerMin).filter((x): x is number => x !== null);
        if (!vpm.length)
            feel(
                'snapshot() har ikke `valg` (beslutningspunkter) - valg per minutt kan ikke måles'
            );
        else {
            const v = median(vpm);
            rep.notes.push(
                `spillfølelse: ${v.toFixed(1)} valg per minutt (median, «${best.navn}»)`
            );
            if (v < GATE.valgPerMin)
                feel(
                    `bare ${v.toFixed(1)} valg per minutt (min ${GATE.valgPerMin}) - eleven venter mer enn de velger. Gi flere synlige valg: nye trusler, tilbud, avveiinger`
                );
        }
        const pr = best.runder
            .map((r) => r.press)
            .filter((x): x is [number, number, number] => x !== null);
        if (!pr.length) feel('snapshot() har ikke `press` (0-1) - eskaleringen kan ikke måles');
        else {
            const [a, b, c] = [0, 1, 2].map((k) => median(pr.map((p) => p[k])));
            rep.notes.push(
                `presskurve (median): ${a.toFixed(2)} i første tredjedel -> ${b.toFixed(2)} -> ${c.toFixed(2)} i siste`
            );
            if (c < a + GATE.pressLift)
                feel(
                    `presset stiger ikke (${a.toFixed(2)} -> ${c.toFixed(2)}, krever +${GATE.pressLift}) - spillet må eskalere mot slutten`
                );
        }

        // Gjentakbarhet: samme seed skal gi samme runde. Gjør den ikke det, har spillet
        // tilstand utenfor G (en modul-rng, en teller) - da er simuleringstallene fortsatt
        // gyldige som statistikk, men en rød runde kan ikke spilles av på nytt.
        const again = simRound(spec, best.navn, 1000);
        if (again.poeng !== best.runder[0].poeng || again.fase !== best.runder[0].fase)
            rep.notes.push(
                'samme seed ga ulik runde - spillet har tilstand utenfor create() (f.eks. en rng på modulnivå)'
            );

        const dir = path.join(outDir, id);
        mkdirSync(dir, { recursive: true });
        writeFileSync(
            path.join(dir, 'sim.json'),
            JSON.stringify(
                {
                    id,
                    runder: RUNDER,
                    bots: rep.bots.map(({ runder: _r, ...b }) => b),
                    vinner: { navn: best.navn, bånd: bands(best.runder) },
                },
                null,
                1
            )
        );
    }
    rep.ms = Date.now() - t0;
    return rep;
}

const reports: Report[] = [];
for (const id of ids) {
    let r: Report;
    try {
        r = simulate(id);
    } catch (e) {
        r = {
            id,
            findings: [],
            notes: [],
            bots: [],
            infra: String(e instanceof Error ? e.stack : e),
            ms: 0,
        };
    }
    reports.push(r);
    const ok = !r.findings.length && !r.infra;
    console.log(
        `\n${ok ? '✓' : '✗'} ${id} (${RUNDER} runder per robot, ${(r.ms / 1000).toFixed(1)} s)`
    );
    for (const b of r.bots)
        console.log(
            `   ${b.navn.padEnd(20)} ${b.forventer.padEnd(8)} vinner ${pct(b.vinn).padStart(5)}  median ${b.median}  (p10 ${b.p10}, p90 ${b.p90})`
        );
    for (const n of r.notes) console.log(`   · ${n}`);
    for (const f of r.findings) console.log(`   ✗ ${f}`);
    if (r.infra) console.log(`   ! kunne ikke kjøre: ${r.infra.split('\n')[0]}`);
}

const md = [
    '## Simulering',
    '',
    `${RUNDER} seedede runder per robot, uten nettleser. Krav: vinner ≥ ${pct(GATE.vinner)}, tapere ≤ ${pct(GATE.taper)}, passiv og knappemoser ≤ ${pct(GATE.blind)}.`,
    '',
];
for (const r of reports) {
    const ok = !r.findings.length && !r.infra;
    md.push(
        `### ${ok ? '✅' : '❌'} \`${r.id}\`${r.ms ? ` (${(r.ms / 1000).toFixed(1)} s)` : ''}`,
        ''
    );
    if (r.bots.length) {
        md.push(
            '| Robot | Forventer | Vant | Median | p10-p90 | Tid (median) | Vanligste tap |',
            '|---|---|---:|---:|---:|---:|---|'
        );
        for (const b of r.bots)
            md.push(
                `| ${b.navn}${b.tilfeldig ? ' 🎲' : ''} | ${b.forventer} | ${pct(b.vinn)} | ${b.median} | ${b.p10}-${b.p90} | ${Math.round(b.tid)} s | ${b.årsaker[0] ? `${b.årsaker[0][0]} (${b.årsaker[0][1]})` : ''} |`
            );
        md.push('');
    }
    for (const f of r.findings) md.push(`- ❌ ${f}`);
    if (r.infra) md.push(`- ⚠️ simuleringen kunne ikke kjøre: ${r.infra.split('\n')[0]}`);
    for (const n of r.notes) md.push(`- ${n}`);
    md.push('');
}
writeFileSync(path.join(outDir, '_sim.md'), md.join('\n'));
console.log(`\nRapport: ${path.relative(root, path.join(outDir, '_sim.md'))}`);
process.exit(reports.some((r) => r.findings.length) ? 1 : reports.some((r) => r.infra) ? 2 : 0);
