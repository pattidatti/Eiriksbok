/**
 * generate-concepts.js
 *
 * Aggregerer `public/content/concepts/*.json` til `public/data/concepts.json`,
 * som er begrepsbanken bak Flashcards, Dagens økt, Kunnskapsløypa og
 * Stjernehimmelen.
 *
 * Scriptet lå lenge utenfor alle npm-script, og da drev artefakten fra kilden:
 * 656 kildefiler mot 390 oppføringer i den innsjekkede JSON-en. Nå kjører den
 * som del av `scan:content`, og validerer i tillegg hver fil slik at hull blir
 * synlige i byggeloggen i stedet for å bli stille droppet i UI-et.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONCEPTS_DIR = path.join(__dirname, '../public/content/concepts');
const OUTPUT_FILE = path.join(__dirname, '../public/data/concepts.json');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Bygger begrepsbanken...');

if (!fs.existsSync(CONCEPTS_DIR)) {
    console.log('  Ingen concepts-mappe funnet. Skriver tom fil.');
    fs.writeFileSync(OUTPUT_FILE, '[]');
    process.exit(0);
}

// UTF-8 lest som latin1 gir «Ã¦/Ã¸/Ã¥» i stedet for æ/ø/å. Det har oppstått
// systematisk før i auto-genererte filer, så vi ser etter det hver gang.
const MOJIBAKE = /Ã[¦¸¥]/;

const files = fs.readdirSync(CONCEPTS_DIR).filter((file) => file.endsWith('.json'));
const concepts = [];
const broken = [];
const incomplete = [];
const mojibake = [];
const seenTerms = new Map();

for (const file of files) {
    const filePath = path.join(CONCEPTS_DIR, file);
    let raw;
    let data;
    try {
        raw = fs.readFileSync(filePath, 'utf-8');
        data = JSON.parse(raw);
    } catch (e) {
        broken.push(`${file}: ${e.message}`);
        continue;
    }

    if (MOJIBAKE.test(raw)) mojibake.push(file);

    // Uten term og definition kan begrepet verken vises som flashcard eller
    // brukes i Dagens økt. Før ble slike filer tatt med og stille filtrert bort
    // i `useConcepts`; nå sier vi fra her i stedet.
    if (!data.term || !data.definition) {
        incomplete.push(file);
        continue;
    }

    const key = String(data.term).toLowerCase().trim();
    if (seenTerms.has(key)) {
        seenTerms.get(key).push(file);
    } else {
        seenTerms.set(key, [file]);
    }

    // Filnavnet eier id-en. Derfor kommer den etter spreaden.
    concepts.push({ ...data, id: path.basename(file, '.json') });
}

const duplicates = [...seenTerms.entries()].filter(([, v]) => v.length > 1);

const report = (label, list) => {
    if (list.length === 0) return;
    console.log(`\n  [!] ${list.length} ${label}:`);
    for (const line of list.slice(0, 10)) console.log(`      ${line}`);
    if (list.length > 10) console.log(`      ... (+${list.length - 10})`);
};

report('filer med ugyldig JSON', broken);
report('filer uten term eller definition (utelatt)', incomplete);
report('filer med brutte norske tegn', mojibake);
report(
    'duplikate termer',
    duplicates.map(([term, list]) => `${term}: ${list.join(', ')}`)
);

const subjects = {};
for (const c of concepts) subjects[c.subject ?? 'uten fag'] = (subjects[c.subject ?? 'uten fag'] ?? 0) + 1;

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(concepts, null, 2));

console.log(`\n  ${concepts.length} begreper av ${files.length} filer.`);
console.log(`  Fordeling: ${JSON.stringify(subjects)}`);
console.log(`Skrev ${OUTPUT_FILE}`);
