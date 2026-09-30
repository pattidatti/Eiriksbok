// Skriver ut de delene av .agent/workflows/build_microgame.md som én rolle i nattrutinen trenger.
//
// Guiden er fasit for alle rollene, men designeren trenger ikke kit-vedleggene, og byggmesteren
// trenger ikke konseptturneringen. Utdraget velges på overskrift, ikke linjenummer, så det
// følger med når guiden endres.
//
// Bruk:
//   node scripts/guide-microgame.mjs --rolle designer|bygg|forbedrer|dirigent

import { readFileSync } from 'fs';

const ROLLER = {
    designer: ['INNLEDNING', 'Steg 1', 'Steg 2a', 'Steg 2b', 'Steg 2c', 'Vedlegg 0'],
    bygg: [
        'INNLEDNING',
        'Steg 3a',
        'Steg 3b',
        'Steg 4',
        'Steg 6',
        'Sjekkliste',
        'Vedlegg 0',
        'Vedlegg A',
        'Vedlegg B',
        'Vedlegg C',
        'Vedlegg D',
    ],
    forbedrer: ['INNLEDNING', 'Steg 3a', 'Steg 3b', 'Steg 4', 'Steg 5', 'Vedlegg B', 'Vedlegg C', 'Vedlegg D'],
    dirigent: ['Steg 1', 'Steg 5', 'Steg 6', 'Sjekkliste', 'Vedlegg E'],
};

const i = process.argv.indexOf('--rolle');
const rolle = i > -1 ? process.argv[i + 1] : null;
if (!ROLLER[rolle]) {
    console.error(`Bruk: --rolle ${Object.keys(ROLLER).join('|')}`);
    process.exit(1);
}

const text = readFileSync('.agent/workflows/build_microgame.md', 'utf8').replace(
    /^---\n[\s\S]*?\n---\n/,
    ''
);
// Del på «## »-overskrifter. Alt før første «## Steg» er innledningen.
const parts = text.split(/^(?=## )/m);
const sections = parts.map((p, n) => ({
    key: n === 0 ? 'INNLEDNING' : p.slice(3, p.indexOf('\n')).trim(),
    body: p,
}));

const wanted = ROLLER[rolle];
const out = sections.filter((s) =>
    wanted.some((w) => (w === 'INNLEDNING' ? s.key === w : s.key.startsWith(w)))
);
const missing = wanted.filter(
    (w) => !out.some((s) => (w === 'INNLEDNING' ? s.key === w : s.key.startsWith(w)))
);
if (missing.length) console.error(`Advarsel: fant ikke seksjonene ${missing.join(', ')} i guiden`);

process.stdout.write(
    `<!-- Utdrag av build_microgame.md for rollen «${rolle}». Hele guiden er fasit; les resten ved behov. -->\n\n` +
        out.map((s) => s.body.trimEnd()).join('\n\n') +
        '\n'
);
