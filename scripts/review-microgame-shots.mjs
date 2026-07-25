// Visuell vurdering av mikrospill-skjermbilder mot sug-rubrikken - BULK-VERKTØY.
//
// Bruk dette når du skal gå gjennom MANGE spill på én gang (en storrevisjon av
// hele biblioteket), der ingen realistisk kan se på 145 x 4 skjermbilder.
//
// For ETT nytt spill: ikke bruk dette. Se på rammene selv - se «Visuell
// egenrevisjon» i .agent/workflows/build_microgame.md. Bygger du spillet som en
// Claude Code-agent, har du allerede bildene og synet, og et API-kall er da bare
// en ekstra regning for noe du kan gjøre gratis.
//
// Bevisst IKKE koblet til CI, av samme grunn: en vurdering per natt i GitHub
// Actions ville kostet API-kreditt selv om abonnementet allerede er betalt.
//
// Autentisering, i prioritert rekkefølge:
//   1. `claude`-CLI-en (--via cli) - går på abonnementet ditt, ingen ekstra kostnad
//   2. ANTHROPIC_API_KEY - fakturert per kall, kun hvis du ber om det
//
// Bruk:
//   node scripts/review-microgame-shots.mjs                       # alle spill med skjermbilder
//   node scripts/review-microgame-shots.mjs --ids atlantis-ringbyen
//   node scripts/review-microgame-shots.mjs --via api             # tving API-nøkkel
//   node scripts/review-microgame-shots.mjs --out kommentar.md

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const args = process.argv.slice(2);
const opt = (name, def = null) => {
    const i = args.indexOf('--' + name);
    return i >= 0 ? args[i + 1] : def;
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotsDir = path.join(root, '.screenshots', 'microgames');
const outFile = opt('out', path.join(shotsDir, '_review.md'));
// Opus. Å vurdere om en scene har sug og matcher emnet er en skjønnsvurdering,
// ikke enkel bildegjenkjenning - en for streng dom sender bygge-agenten ut på
// ombygging av noe som var greit. Overstyr med --model / --model-cli.
const MODEL = opt('model', 'claude-opus-5');
const MODEL_CLI = opt('model-cli', 'opus');
// Overstyrbar for å kunne teste bilde-/JSON-håndteringen mot en mock uten å
// bruke en ekte nøkkel.
const API_URL = process.env.ANTHROPIC_BASE_URL
    ? `${process.env.ANTHROPIC_BASE_URL.replace(/\/$/, '')}/v1/messages`
    : 'https://api.anthropic.com/v1/messages';

// --- Velg backend: CLI (abonnement, gratis) foran API (fakturert per kall) ---
const apiKey = process.env.ANTHROPIC_API_KEY;
const via = opt('via');

function claudeCliAvailable() {
    try {
        execFileSync('claude', ['--version'], { stdio: 'ignore', timeout: 15000 });
        return true;
    } catch {
        return false;
    }
}

let backend;
if (via === 'api') backend = apiKey ? 'api' : null;
else if (via === 'cli') backend = claudeCliAvailable() ? 'cli' : null;
else if (claudeCliAvailable()) backend = 'cli';
else if (apiKey) backend = 'api';
else backend = null;

if (!backend) {
    console.log(
        'Visuell vurdering hoppet over: fant verken `claude`-CLI-en eller ANTHROPIC_API_KEY.\n' +
            'CLI-en går på abonnementet ditt og er gratis - foretrekk den.\n'
    );
    writeFileSync(outFile, '');
    process.exit(0);
}
if (backend === 'api')
    console.log('MERK: bruker ANTHROPIC_API_KEY - dette faktureres per kall, utenom abonnementet.');

if (!existsSync(shotsDir)) {
    console.log(`Ingen skjermbilder i ${shotsDir} - ingenting å vurdere.`);
    writeFileSync(outFile, '');
    process.exit(0);
}

// --- Hvilke spill skal vurderes ---
const only = opt('ids');
let ids = only
    ? only.split(',').map((s) => s.trim())
    : readdirSync(shotsDir, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);
ids = ids.filter((id) => existsSync(path.join(shotsDir, id)));
if (!ids.length) {
    console.log('Ingen spillmapper med skjermbilder - ingenting å vurdere.');
    writeFileSync(outFile, '');
    process.exit(0);
}

// --- Rubrikken hentes fra guiden, så den ikke driver fra hverandre ---
function loadRubric() {
    const guide = path.join(root, '.agent/workflows/build_microgame.md');
    try {
        const src = readFileSync(guide, 'utf8');
        const start = src.indexOf('## Sug-rubrikken');
        if (start === -1) return null;
        const after = src.indexOf('\n## ', start + 4);
        return src.slice(start, after === -1 ? undefined : after).trim();
    } catch {
        return null;
    }
}
const rubric = loadRubric();
if (!rubric) {
    console.error('Fant ikke sug-rubrikken i .agent/workflows/build_microgame.md - avbryter.');
    writeFileSync(outFile, '');
    process.exit(0);
}

// --- Registry-tittel/beskrivelse gir modellen emnet spillet skal iscenesette ---
const regSrc = readFileSync(path.join(root, 'src/components/microgames/registry.ts'), 'utf8');
function metaFor(id) {
    const i = regSrc.indexOf(`'${id}': {`);
    if (i === -1) return {};
    const block = regSrc.slice(i, i + 900);
    const grab = (key) => {
        const m = block.match(new RegExp(`${key}:\\s*'([^']*)'`));
        return m ? m[1] : undefined;
    };
    return { title: grab('title'), description: grab('description') };
}

const SYSTEM = `Du vurderer skjermbilder av 3D-mikrospill i en norsk digital lærebok for 14-åringer.

Rammene er tatt fra samme spill på ulike tidspunkt i en auto-rotasjon, så du ser scenen fra flere vinkler. Vurder SCENEN, ikke bildekvaliteten.

Score 0-2 per akse etter denne rubrikken:

${rubric}

Viktig om hva du KAN og IKKE KAN se på stillbilder:
- Du ser iscenesettelse, komposisjon, om modellen fyller utsnittet, om noe er åpenbart galt plassert (svevende, begravd, utenfor), og om scenen matcher emnet.
- Du kan IKKE bedømme puls, konsekvens eller ferdighet pålitelig fra stillbilder. Sett dem til null og si «kan ikke vurderes fra stillbilde» framfor å gjette.
- Ikke straff et spill for å være midt i en animasjon.

Svar med JSON, ingen annen tekst:
{"id": "...", "innlevelse": 0-2, "unikhet": 0-2, "iscenesettelse_matcher_emnet": true|false, "funn": ["kort, konkret observasjon", ...], "dom": "en setning"}

«funn» skal bare inneholde ting du faktisk ser og som er verdt å fikse. Tom liste hvis scenen ser bra ut. Skriv på norsk bokmål med å, ø, æ. Ikke bruk tankestrek.`;

function framesFor(id) {
    const dir = path.join(shotsDir, id);
    return readdirSync(dir)
        .filter((f) => /^frame-\d+\.png$/.test(f) || /^(front|angle)\.png$/.test(f))
        .sort()
        .slice(0, 4)
        .map((f) => path.join(dir, f));
}

function briefFor(id, frames) {
    const meta = metaFor(id);
    return `Spill-id: ${id}\nTittel: ${meta.title ?? '(ukjent)'}\nEmne/beskrivelse: ${
        meta.description ?? '(ukjent)'
    }\n\n${frames.length} rammer følger.`;
}

// Backend 1: `claude`-CLI-en. Går på abonnementet. Headless-modus har ingen eget
// bilde-flagg, så bildene sendes som filstier og Claude leser dem med Read-verktøyet.
function reviewViaCli(id) {
    const frames = framesFor(id);
    if (!frames.length) return null;

    const prompt = [
        SYSTEM,
        '',
        '---',
        '',
        briefFor(id, frames),
        '',
        'Les disse bildefilene med Read-verktøyet og vurder dem:',
        ...frames.map((f) => `- ${f}`),
        '',
        'Svar KUN med JSON-objektet. Ingen forklaring rundt.',
    ].join('\n');

    let out;
    try {
        out = execFileSync(
            'claude',
            ['-p', prompt, '--allowedTools', 'Read', '--model', MODEL_CLI],
            { encoding: 'utf8', timeout: 240000, maxBuffer: 8 * 1024 * 1024 }
        );
    } catch (e) {
        console.error(`${id}: claude-CLI feilet - ${String(e.message).slice(0, 200)}`);
        return null;
    }
    return parseJson(out, id, 'CLI-en');
}

// Felles JSON-uttrekk. Modellen svarer av og til med prosa rundt objektet, eller
// pakker det i en ```json-blokk. Et grådig /\{[\s\S]*\}/ knakk på begge, og ga
// bare «fikk ikke JSON» uten å vise hva som faktisk kom - ubrukelig å feilsøke.
function parseJson(raw, id, kilde) {
    const text = String(raw ?? '').trim();
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidates = [];
    if (fenced) candidates.push(fenced[1].trim());
    // Skann etter det første balanserte {...}-objektet.
    const start = text.indexOf('{');
    if (start !== -1) {
        let depth = 0;
        for (let i = start; i < text.length; i++) {
            if (text[i] === '{') depth++;
            else if (text[i] === '}' && --depth === 0) {
                candidates.push(text.slice(start, i + 1));
                break;
            }
        }
    }
    for (const c of candidates) {
        try {
            const o = JSON.parse(c);
            if (o && typeof o === 'object') return { ...o, id };
        } catch {
            /* prøv neste kandidat */
        }
    }
    console.error(
        `${id}: fant ikke gyldig JSON fra ${kilde}. Rå-svar (første 300 tegn):\n  ${
            text.slice(0, 300).replace(/\n/g, '\n  ') || '(tomt)'
        }`
    );
    return null;
}

// Backend 2: messages-API. Fakturert per kall - kun når du eksplisitt ber om det.
async function reviewViaApi(id) {
    const frames = framesFor(id);
    if (!frames.length) return null;

    const content = [{ type: 'text', text: briefFor(id, frames) }];
    for (const f of frames) {
        content.push({
            type: 'image',
            source: {
                type: 'base64',
                media_type: 'image/png',
                data: readFileSync(f).toString('base64'),
            },
        });
    }

    const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: MODEL,
            max_tokens: 1024,
            system: SYSTEM,
            messages: [{ role: 'user', content }],
        }),
    });
    if (!res.ok) {
        console.error(`${id}: API-feil ${res.status} ${(await res.text()).slice(0, 200)}`);
        return null;
    }
    const data = await res.json();
    return parseJson((data.content ?? []).map((b) => b.text ?? '').join(''), id, 'API-et');
}

const reviewGame = (id) =>
    backend === 'cli' ? Promise.resolve(reviewViaCli(id)) : reviewViaApi(id);

console.log(
    `Vurderer ${ids.length} spill visuelt via ${backend === 'cli' ? `claude-CLI (${MODEL_CLI}, abonnement)` : `API (${MODEL}, fakturert)`}.`
);
const results = [];
for (const id of ids) {
    const r = await reviewGame(id).catch((e) => {
        console.error(`${id}: ${e.message}`);
        return null;
    });
    if (r) {
        results.push(r);
        console.log(
            `  ${r.id}: innlevelse ${r.innlevelse}, unikhet ${r.unikhet}, ${
                r.funn?.length ?? 0
            } funn`
        );
    }
}

if (!results.length) {
    writeFileSync(outFile, '');
    console.log('Ingen vurderinger å rapportere.');
    process.exit(0);
}

// --- PR-kommentar ---
const flagged = results.filter(
    (r) => r.funn?.length || r.iscenesettelse_matcher_emnet === false || r.innlevelse <= 1
);
const md = [
    '## Visuell vurdering av mikrospill',
    '',
    '_Claude har sett på rammene fra auditen og scoret dem mot sug-rubrikken. Dette blokkerer ikke merge - det er en observasjon, ikke en port._',
    '',
    '| Spill | Innlevelse | Unikhet | Matcher emnet | Dom |',
    '|---|---|---|---|---|',
    ...results.map(
        (r) =>
            `| \`${r.id}\` | ${r.innlevelse}/2 | ${r.unikhet}/2 | ${
                r.iscenesettelse_matcher_emnet ? 'ja' : 'nei'
            } | ${(r.dom ?? '').replace(/\|/g, '/')} |`
    ),
];
if (flagged.length) {
    md.push('', '### Konkrete funn', '');
    for (const r of flagged) {
        if (!r.funn?.length) continue;
        md.push(`**\`${r.id}\`**`);
        for (const f of r.funn) md.push(`- ${f}`);
        md.push('');
    }
}
writeFileSync(outFile, md.join('\n') + '\n');
console.log(`Skrev vurdering til ${outFile}`);
