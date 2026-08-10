#!/usr/bin/env node
// Validerer at innholds-JSON under public/content/ faktisk RENDRER slik den er
// ment. Sjekken speiler logikken i renderWithMarkdown (ArticleContent.tsx:85-160),
// som deler en text-blokk på DOBBELT linjeskift og så ser på første linje i hver
// bit for å avgjøre om biten er overskrift, liste eller avsnitt.
//
// Det er nettopp den «første linje avgjør»-regelen som gjør at små feil i
// kildeteksten blir usynlige for forfatteren, men stygge for eleven. De fire
// feilene under er alle observert i produksjon.
//
// Bruk:
//   node scripts/validate-content-structure.cjs           # rapport
//   node scripts/validate-content-structure.cjs --json    # maskinlesbar
//
// Exit-kode 1 hvis minst én FEIL (ikke ved advarsler), så den kan gate CI.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public', 'content');
const REPO = path.join(__dirname, '..');
const JSON_MODE = process.argv.includes('--json');

const UL = /^\s*[*-]\s+\S/;
const OL = /^\s*\d+\.\s+\S/;
const UL_FIRST = /^(\*|-)\s/; // slik renderen faktisk tester (uten trim)
const OL_FIRST = /^\d+\.\s/;
const WHOLE_LINE_BOLD = /^\s*(?:[*-]\s+|\d+\.\s+)?\*\*[^*\n]+\*\*:?\s*$/;
const INLINE_BOLD = /\*\*[^*\n]+\*\*/;

const errors = [];
const warnings = [];

function checkTextBlock(content, file, where) {
    for (const [si, seg] of content.split(/\n\n+/).entries()) {
        const lines = seg.split('\n');
        const first = lines[0];
        const loc = `${where} seg${si}`;

        // 1. Overskrift som sluker brødtekst.
        //    Renderen stripper bare '#' og legger HELE biten i <h*>, så et
        //    avsnitt med enkelt linjeskift etter overskrifta blir fet tittel.
        if (first.trimStart().startsWith('#')) {
            if (lines.length > 1 && lines.slice(1).some((l) => l.trim())) {
                errors.push({
                    file,
                    loc,
                    kind: 'overskrift-sluker-tekst',
                    detail: `«${first.trim().slice(0, 54)}» etterfølges av brødtekst med enkelt linjeskift`,
                    fix: 'Sett inn blank linje etter overskrifta, eller bruk en header-blokk.',
                });
            }
            continue;
        }

        // 2. Listemarkør som ikke starter biten -> renderen ser ingen liste,
        //    og '*' / '1.' vises som synlig tekst midt i avsnittet.
        const firstIsList = UL_FIRST.test(first) || OL_FIRST.test(first);
        const laterIsList = lines.slice(1).some((l) => UL.test(l) || OL.test(l));
        if (laterIsList && !firstIsList) {
            errors.push({
                file,
                loc,
                kind: 'lekkende-listemarkor',
                detail: `«${first.trim().slice(0, 54)}» følges av listepunkter uten blank linje`,
                fix: 'Gjør listepunktene til en egen list-blokk (se CLAUDE.md).',
            });
        }

        // 3. Hele-linje-bold = underoverskrift som ikke er en egen blokk.
        //    Den overlever så lenge stjernene står, men er skjør: neste kjøring
        //    av en bold-fjerner gjør den til usynlig brødtekst.
        for (const l of lines) {
            if (WHOLE_LINE_BOLD.test(l) && INLINE_BOLD.test(l)) {
                warnings.push({
                    file,
                    loc,
                    kind: 'bold-som-overskrift',
                    detail: l.trim().slice(0, 60),
                    fix: 'Løft ut til en header-/subheader-blokk.',
                });
            }
        }
    }
}

function walkBlocks(arr, file, prefix) {
    if (!Array.isArray(arr)) return;
    arr.forEach((b, i) => {
        if (!b || typeof b !== 'object') return;
        const where = `${prefix}[${i}]`;
        if ((b.type === 'text' || b.type === 'paragraph') && typeof b.content === 'string') {
            checkTextBlock(b.content, file, where);
        } else if (b.type === 'section' && Array.isArray(b.content)) {
            walkBlocks(b.content, file, `${where}.content`);
        }
    });
}

function walkDir(dir, cb) {
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) walkDir(p, cb);
        else if (p.endsWith('.json')) cb(p);
    }
}

walkDir(ROOT, (filePath) => {
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        errors.push({
            file: path.relative(REPO, filePath),
            loc: '-',
            kind: 'ugyldig-json',
            detail: String(e.message).slice(0, 80),
            fix: 'Rett JSON-syntaksen.',
        });
        return;
    }
    if (!Array.isArray(data.content)) return;
    const rel = path.relative(REPO, filePath);
    walkBlocks(data.content, rel, 'content');

    // 4. Duplisert title. Oppstår når en text-blokk splittes i flere og
    //    metadata blir med på hver del - da vises overskrifta to ganger.
    const titles = data.content
        .filter((b) => b && typeof b === 'object' && typeof b.title === 'string')
        .map((b) => b.title);
    const seen = new Set();
    for (const t of titles) {
        if (seen.has(t)) {
            errors.push({
                file: rel,
                loc: 'content',
                kind: 'duplisert-title',
                detail: `«${t.slice(0, 54)}» står på flere blokker`,
                fix: 'Behold title kun på den første blokken.',
            });
        }
        seen.add(t);
    }
});

if (JSON_MODE) {
    console.log(JSON.stringify({ errors, warnings }, null, 2));
} else {
    const group = (rows) => {
        const byFile = {};
        for (const r of rows) (byFile[r.file] ||= []).push(r);
        return byFile;
    };
    if (errors.length === 0) {
        console.log('✅ Ingen strukturfeil i innholdet.');
    } else {
        console.log(`❌ ${errors.length} strukturfeil:\n`);
        for (const [file, rows] of Object.entries(group(errors))) {
            console.log(`  ${file}`);
            for (const r of rows) {
                console.log(`    [${r.kind}] ${r.loc}`);
                console.log(`      ${r.detail}`);
                console.log(`      → ${r.fix}`);
            }
            console.log('');
        }
    }
    if (warnings.length > 0) {
        console.log(`⚠️  ${warnings.length} advarsel(er) - skjør struktur, ikke ødelagt:\n`);
        for (const [file, rows] of Object.entries(group(warnings))) {
            console.log(`  ${file}`);
            for (const r of rows.slice(0, 5)) console.log(`    [${r.kind}] ${r.detail}`);
            if (rows.length > 5) console.log(`    ... +${rows.length - 5} flere`);
        }
        console.log('');
    }
}

process.exit(errors.length > 0 ? 1 : 0);
