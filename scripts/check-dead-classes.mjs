#!/usr/bin/env node
/**
 * Vakthund mot Tailwind-klasser som ikke finnes i bygget CSS.
 *
 * Prosjektet kjører Tailwind v4, og `src/index.css` inneholder bare
 * `@import "tailwindcss"` - ingen `@theme`, ingen `@config`. Da lastes ikke
 * `tailwind.config.js`, og fargetokenene der (`bg-card`, `text-main`,
 * `text-muted`, `neon-accent`) blir aldri til klasser. `border-main`,
 * `bg-subtle` og `surface-card` har aldri vært definert noe sted, og
 * `prose` krever @tailwindcss/typography, som ikke er installert.
 *
 * Klasser som `bg-bg-card` og `border-border-main` gir derfor kort helt uten
 * bakgrunn og ramme. Feilen er usynlig i koden og tydelig på skjermen, så den
 * fortjener en maskin som ser etter den.
 *
 * WATCHED er bevisst en liste over kataloger, ikke hele `src/`. Resten av
 * appen har den samme gjelden (bl.a. ~400 `font-display`, som bare betyr at
 * Outfit aldri tas i bruk), og den ryddes fag for fag. Utvid lista når et
 * område er vasket.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

const WATCHED = [
    'src/features/comparison',
    'src/components/religion',
    'src/pages/ReligionPage.tsx',
    'src/pages/ReligionHubPage.tsx',
    'src/pages/ReligionComparisonPage.tsx',
    'src/pages/TopicComparisonPage.tsx',
    'src/pages/TopicPage.tsx',
    'src/components/views/TopicView.tsx',
];

/** Klasser som ser ekte ut, men som aldri havner i CSS-en. */
const DEAD = [
    /\bbg-bg-[a-z-]+/g,
    /\bbg-surface-[a-z-]+/g,
    /\btext-text-[a-z-]+/g,
    /\bborder-border-[a-z-]+/g,
    /\b(?:bg|text|border|from|to|via)-neon-accent(?:\/\d+)?/g,
    /\bfont-display\b/g,
    /\bprose(?:-[a-z]+)?\b/g,
];

function walk(path) {
    let stat;
    try {
        stat = statSync(path);
    } catch {
        return []; // Filer i lista som ennå ikke finnes er greit
    }
    if (stat.isFile()) return /\.tsx?$/.test(path) ? [path] : [];
    return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

const hits = [];
for (const target of WATCHED) {
    for (const file of walk(join(ROOT, target))) {
        const lines = readFileSync(file, 'utf-8').split('\n');
        lines.forEach((line, index) => {
            // Kommentarer får lov: de forklarer som regel nettopp dette problemet
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
            for (const pattern of DEAD) {
                for (const match of line.match(pattern) ?? []) {
                    hits.push({ file: relative(ROOT, file), line: index + 1, match });
                }
            }
        });
    }
}

if (hits.length === 0) {
    console.log('check-dead-classes: ingen døde klasser i de vaktede filene.');
    process.exit(0);
}

console.error(`\ncheck-dead-classes: ${hits.length} døde Tailwind-klasser.\n`);
console.error('Disse gir ingen CSS. Bruk rå slate/white/indigo-klasser, eller');
console.error('konstantene i src/components/religion/surfaces.ts.\n');
for (const hit of hits) console.error(`  ${hit.file}:${hit.line}  ${hit.match}`);
console.error('');
process.exit(1);
