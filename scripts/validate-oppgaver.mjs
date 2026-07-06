#!/usr/bin/env node
/**
 * validate-oppgaver.mjs
 *
 * QA-sjekk for artikler som har fått Oppgaver-komponenten. Per fil:
 *  - JSON parser
 *  - Oppgaver-komponent finnes
 *  - Oppgaver ligger FØR Quiz (hvis Quiz finnes)
 *  - forstaa / reflekter / gaaVidere er alle til stede og ikke-tomme
 *  - ingen forbudte tegn i oppgavetekst: '**' (bold), '—' (em-dash), '–' (tankestrek)
 *  - ingen mojibake (Ã¦/Ã¸/Ã¥)
 *
 * Bruk:
 *   node scripts/validate-oppgaver.mjs --subject samfunnskunnskap
 *   node scripts/validate-oppgaver.mjs <fil1.json> [fil2.json ...]
 *   (default uten args: rapporter kun filer som HAR Oppgaver i gitt fag)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CONTENT_ROOT = 'public/content';

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

function checkStrings(arr, level, errors, file) {
    for (const t of arr || []) {
        if (typeof t !== 'string' || !t.trim()) {
            errors.push(`${file}: tom oppgave i ${level}`);
            continue;
        }
        if (t.includes('**')) errors.push(`${file}: bold (**) i ${level}: "${t.slice(0, 40)}…"`);
        if (t.includes('—'))
            errors.push(`${file}: em-dash (—) i ${level}: "${t.slice(0, 40)}…"`);
        if (t.includes('–'))
            errors.push(`${file}: tankestrek (–) i ${level}: "${t.slice(0, 40)}…"`);
        if (/Ã[¦¸¥]/.test(t)) errors.push(`${file}: mojibake i ${level}: "${t.slice(0, 40)}…"`);
    }
}

function validate(file) {
    const errors = [];
    let data;
    try {
        data = JSON.parse(readFileSync(file, 'utf-8'));
    } catch (e) {
        return { hasOppgaver: false, errors: [`${file}: JSON-feil: ${e.message}`] };
    }
    if (!data || !Array.isArray(data.content)) return { hasOppgaver: false, errors };

    const comps = data.content.filter((b) => b && b.type === 'component');
    const names = comps.map((b) => b.name);
    if (!names.includes('Oppgaver')) return { hasOppgaver: false, errors };

    const oi = names.indexOf('Oppgaver');
    const qi = names.indexOf('Quiz');
    if (qi !== -1 && oi > qi) errors.push(`${file}: Oppgaver ligger ETTER Quiz`);

    const opp = comps[oi];
    const p = opp.props || {};
    for (const key of ['forstaa', 'reflekter', 'gaaVidere']) {
        if (!Array.isArray(p[key]) || p[key].length === 0) {
            errors.push(`${file}: mangler/tom ${key}`);
        }
    }
    checkStrings(p.forstaa, 'forstaa', errors, file);
    checkStrings(p.reflekter, 'reflekter', errors, file);
    checkStrings(p.gaaVidere, 'gaaVidere', errors, file);

    return { hasOppgaver: true, errors };
}

const args = process.argv.slice(2);
let files;
if (args[0] === '--subject') files = collectSubject(args[1]);
else if (args.length) files = args;
else {
    console.error('Bruk: --subject <fag> eller liste med filer');
    process.exit(2);
}

let withOpp = 0;
const allErrors = [];
for (const f of files) {
    const { hasOppgaver, errors } = validate(f);
    if (hasOppgaver) withOpp++;
    allErrors.push(...errors);
}

console.log(`Sjekket ${files.length} filer, ${withOpp} har Oppgaver.`);
if (allErrors.length) {
    console.log(`\n${allErrors.length} feil:`);
    for (const e of allErrors) console.log('  ✗ ' + relative('.', e));
    process.exit(1);
} else {
    console.log('Ingen feil. ✓');
}
