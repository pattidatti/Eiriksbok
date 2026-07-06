#!/usr/bin/env node
/**
 * insert-oppgaver.mjs
 *
 * Setter inn en Oppgaver-komponentblokk i en artikkels content[]-array, rett FØR
 * Quiz-blokken hvis den finnes, ellers til slutt. Kirurgisk tekst-innsetting:
 * kun den nye blokken legges til, resten av fila forblir byte-identisk (bevarer
 * kompakt enkeltlinje-formatering i eksisterende blokker).
 *
 * Props hentes fra en scratchpad-fil per artikkel, navngitt etter full sti:
 *   <OPPGAVER_DIR>/<relpath med '/' -> '__' og '.json' -> '.props.json'>
 * Props-fila kan enten være { "props": {...} } eller propsen direkte {...}.
 *
 * Idempotent: hopper over filer som allerede har en Oppgaver-komponent.
 *
 * Bruk:
 *   node scripts/insert-oppgaver.mjs <artikkel1.json> [artikkel2.json ...]
 *   node scripts/insert-oppgaver.mjs --subject samfunnskunnskap   (alle content[]-artikler i faget)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const OPPGAVER_DIR =
    process.env.OPPGAVER_DIR ||
    '/tmp/claude-1000/-home-irik-eiriksbok/0c7e6ac3-eaad-4cb5-9c3f-d5b3c894ad4a/scratchpad/oppgaver';

const CONTENT_ROOT = 'public/content';

function propsPathFor(articlePath) {
    const rel = articlePath.replace(/\\/g, '/');
    const key = rel.replace(/\//g, '__').replace(/\.json$/, '.props.json');
    return join(OPPGAVER_DIR, key);
}

/** Enumerer top-level elementer i et JSON-array gitt tekst + offset til '['. String-bevisst. */
function scanArrayElements(src, openBracket) {
    const elements = [];
    let i = openBracket + 1;
    let depth = 0;
    let inStr = false;
    let esc = false;
    let elemStart = -1;
    for (; i < src.length; i++) {
        const ch = src[i];
        if (inStr) {
            if (esc) esc = false;
            else if (ch === '\\') esc = true;
            else if (ch === '"') inStr = false;
            continue;
        }
        if (ch === '"') {
            inStr = true;
            continue;
        }
        if (ch === '{' || ch === '[') {
            if (depth === 0 && elemStart === -1) elemStart = i;
            depth++;
        } else if (ch === '}' || ch === ']') {
            if (depth === 0 && ch === ']') {
                // slutten av content-arrayet
                return { elements, closeBracket: i };
            }
            depth--;
            if (depth === 0 && elemStart !== -1) {
                elements.push({ start: elemStart, end: i + 1 });
                elemStart = -1;
            }
        }
    }
    throw new Error('Fant ikke slutten av content-arrayet');
}

/** Finn offset til content-arrayets '['. */
function findContentBracket(src) {
    const m = /"content"\s*:\s*\[/.exec(src);
    if (!m) throw new Error('Fant ikke "content"-array');
    return m.index + m[0].length - 1; // peker på '['
}

/** Indent (whitespace) på linjen der offset ligger. */
function lineIndentAt(src, offset) {
    let ls = src.lastIndexOf('\n', offset - 1) + 1;
    let j = ls;
    while (j < src.length && (src[j] === ' ' || src[j] === '\t')) j++;
    return src.slice(ls, j);
}

function buildBlockText(props, indent) {
    const block = { type: 'component', name: 'Oppgaver', props };
    const raw = JSON.stringify(block, null, 4);
    return raw
        .split('\n')
        .map((line, idx) => (idx === 0 ? line : indent + line))
        .join('\n');
}

function loadProps(articlePath) {
    const pp = propsPathFor(articlePath);
    if (!existsSync(pp)) return null;
    const parsed = JSON.parse(readFileSync(pp, 'utf-8'));
    // Godta både { props: {...} } og propsen direkte.
    if (parsed && typeof parsed === 'object' && parsed.props && !parsed.forstaa) {
        return parsed.props;
    }
    return parsed;
}

function processFile(articlePath) {
    const src = readFileSync(articlePath, 'utf-8');
    const data = JSON.parse(src); // validerer at fila parser
    if (!data || !Array.isArray(data.content)) {
        return { path: articlePath, status: 'skip', reason: 'ingen content[]' };
    }
    const already = data.content.some(
        (b) => b && b.type === 'component' && b.name === 'Oppgaver'
    );
    if (already) return { path: articlePath, status: 'skip', reason: 'har Oppgaver' };

    const props = loadProps(articlePath);
    if (!props) return { path: articlePath, status: 'skip', reason: 'mangler props-fil' };
    if (!props.forstaa && !props.reflekter && !props.gaaVidere) {
        return { path: articlePath, status: 'skip', reason: 'tomme props' };
    }

    const bracket = findContentBracket(src);
    const { elements } = scanArrayElements(src, bracket);
    if (elements.length === 0) {
        return { path: articlePath, status: 'skip', reason: 'tomt content[]' };
    }

    // Finn Quiz-elementet (parse hvert element for name).
    let quizStart = -1;
    for (const el of elements) {
        try {
            const obj = JSON.parse(src.slice(el.start, el.end));
            if (obj && obj.type === 'component' && obj.name === 'Quiz') {
                quizStart = el.start;
                break;
            }
        } catch {
            /* ignorer uparsebare biter */
        }
    }

    let result;
    if (quizStart !== -1) {
        const indent = lineIndentAt(src, quizStart);
        const body = buildBlockText(props, indent);
        result = src.slice(0, quizStart) + body + ',\n' + indent + src.slice(quizStart);
    } else {
        const last = elements[elements.length - 1];
        const indent = lineIndentAt(src, last.start);
        const body = buildBlockText(props, indent);
        result = src.slice(0, last.end) + ',\n' + indent + body + src.slice(last.end);
    }

    // Valider at resultatet fortsatt er gyldig JSON og at Oppgaver havnet før Quiz.
    const check = JSON.parse(result);
    const names = check.content
        .filter((b) => b && b.type === 'component')
        .map((b) => b.name);
    const oi = names.indexOf('Oppgaver');
    const qi = names.indexOf('Quiz');
    if (oi === -1) throw new Error('Oppgaver ikke funnet etter innsetting');
    if (qi !== -1 && oi > qi) throw new Error('Oppgaver havnet etter Quiz');

    writeFileSync(articlePath, result, 'utf-8');
    return {
        path: articlePath,
        status: 'ok',
        placed: quizStart !== -1 ? 'før Quiz' : 'til slutt',
    };
}

function collectSubject(subject) {
    const root = join(CONTENT_ROOT, subject);
    const out = [];
    const walk = (dir) => {
        for (const name of readdirSync(dir)) {
            const p = join(dir, name);
            if (statSync(p).isDirectory()) walk(p);
            else if (name.endsWith('.json')) out.push(p);
        }
    };
    walk(root);
    return out;
}

// --- main ---
const args = process.argv.slice(2);
let files = [];
if (args[0] === '--subject') {
    files = collectSubject(args[1]).filter((f) => {
        try {
            const d = JSON.parse(readFileSync(f, 'utf-8'));
            return d && Array.isArray(d.content);
        } catch {
            return false;
        }
    });
} else {
    files = args;
}

let ok = 0,
    skip = 0,
    err = 0;
for (const f of files) {
    try {
        const r = processFile(f);
        if (r.status === 'ok') {
            ok++;
            console.log(`✓ ${relative('.', f)} (${r.placed})`);
        } else {
            skip++;
            console.log(`- ${relative('.', f)} [${r.reason}]`);
        }
    } catch (e) {
        err++;
        console.error(`✗ ${relative('.', f)}: ${e.message}`);
    }
}
console.log(`\nFerdig: ${ok} satt inn, ${skip} hoppet over, ${err} feil.`);
process.exit(err > 0 ? 1 : 0);
