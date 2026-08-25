/**
 * generate-glossary-articles.js
 *
 * Bygger `public/data/glossary-articles.json`: reversindeksen «hvilke artikler
 * nevner dette begrepet?».
 *
 * Personer har allerede en slik indeks (`mentionedIn` i people.json), men
 * begrepene har ikke hatt noen. Kryssordet trenger den for modusen «det du har
 * lest», som bare bruker ord eleven faktisk har møtt i en artikkel.
 *
 * Formatet er bevisst kompakt: artikkelstiene står én gang i en liste, og hvert
 * begrep peker på indekser inn i den. Fullstendige stier per begrep ville
 * tredoblet fila, og den lastes ned av eleven.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildCorpus, needleRegex } from './lib/article-corpus.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../public/content');
const GLOSSARY_FILE = path.join(__dirname, '../public/data/glossary.json');
const OUT_FILE = path.join(__dirname, '../public/data/glossary-articles.json');

if (!fs.existsSync(GLOSSARY_FILE)) {
    console.log('Ingen glossary.json - hopper over reversindeksen for begreper.');
    process.exit(0);
}

console.log('Bygger reversindeks for begreper...');

const glossary = JSON.parse(fs.readFileSync(GLOSSARY_FILE, 'utf-8'));
const corpus = buildCorpus(CONTENT_DIR);
console.log(`  ${glossary.length} begreper mot ${corpus.length} artikler.`);

const articles = corpus.map((article) => article.url.replace(/^\//, ''));
const terms = {};
let withoutHits = 0;

for (const entry of glossary) {
    const term = String(entry.term || '').trim();
    if (term.length < 3) continue;

    // Aliasene fanger bøyningsformer artiklene faktisk bruker
    // («abrahamittiske» for «Abrahamittiske religioner»).
    const needles = Array.from(
        new Set([term, ...(entry.aliases || [])].map((n) => String(n).toLowerCase().trim()))
    ).filter((n) => n.length >= 3);

    const patterns = needles.map((needle) => ({ needle, re: needleRegex(needle) }));
    const hits = [];

    for (let i = 0; i < corpus.length; i++) {
        const text = corpus[i].text;
        // includes() først: den er billig, og de aller fleste artikler har
        // ingenting med begrepet å gjøre. Regexen kjører bare på treff.
        if (!patterns.some(({ needle, re }) => text.includes(needle) && re.test(text))) continue;
        hits.push(i);
    }

    if (hits.length === 0) {
        withoutHits++;
        continue;
    }
    terms[term] = hits;
}

const output = { articles, terms };
fs.writeFileSync(OUT_FILE, JSON.stringify(output));

const size = (fs.statSync(OUT_FILE).size / 1024).toFixed(0);
console.log(`  ${Object.keys(terms).length} begreper koblet til artikler.`);
console.log(`  ${withoutHits} begreper nevnes ikke i noen artikkel.`);
console.log(`Skrev ${OUT_FILE} (${size} kB)`);
