#!/usr/bin/env node
// Removes `**bold**` markdown markers from `content` fields of `text` and
// `paragraph` blocks across all JSON files in public/content/.
//
// Why: Bold-parsing in markdownUtils.tsx converts `**word**` to a <strong>
// React element. This breaks the concepts/glossary system (markdownUtils.tsx
// line 86), which only matches concept terms against plain strings — so any
// concept that happens to be bolded loses its tooltip.
//
// We deliberately do NOT touch:
//   - list-blocks (definition lists use `**Title**:` syntax — see
//     ArticleContent.tsx:336-340)
//   - comparison.before/after.content and other nested rich structures
//   - any field other than `content` on text/paragraph blocks
//   - section-blocks are traversed so we still process text/paragraph nested
//     inside `section.content`
//   - a line that is NOTHING BUT bold, e.g. `**1.1 Komsakulturen**`. Se under.
//
// VIKTIG — hvorfor hele-linje-bold står urørt:
// Når `**...**` utgjør hele linja er det i praksis alltid en underoverskrift,
// ikke uthevet brødtekst. Slike overskrifter står typisk med ENKELT linjeskift
// foran avsnittet sitt, og renderInlineMarkdown/renderWithMarkdown deler bare
// på DOBBELT linjeskift (ArticleContent.tsx:89). Stripper vi stjernene, blir
// overskrifta vanlig tekst som renner rett inn i avsnittet under og forsvinner
// for eleven. Det skjedde med norge-for-vikingene.json (28 overskrifter) før
// dette vernet kom på plass.
//
// Slike linjer rapporteres i stedet under «MÅ FIKSES MANUELT», og skal løftes
// ut til egne `header`- eller `subheader`-blokker — se CLAUDE.md.
//
// Usage:
//   node scripts/fix-bold-markdown.cjs            # dry-run
//   node scripts/fix-bold-markdown.cjs --apply    # write changes

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public', 'content');
const APPLY = process.argv.includes('--apply');

// Match **anything**, where anything is non-empty and doesn't span newlines
// or contain other asterisks. Non-greedy.
const BOLD_RE = /\*\*([^*\n]+?)\*\*/g;

// En linje som i sin helhet er `**...**` (evt. med kolon eller en listemarkør
// rundt) bærer struktur, ikke uthevelse. Den skal ikke strippes.
const WHOLE_LINE_BOLD = /^\s*(?:[*-]\s+|\d+\.\s+)?\*\*[^*\n]+\*\*:?\s*$/;

function stripBold(s) {
    const hits = [];
    const skipped = [];
    const out = s
        .split('\n')
        .map((line) => {
            if (WHOLE_LINE_BOLD.test(line)) {
                if (BOLD_RE.test(line)) skipped.push(line.trim());
                BOLD_RE.lastIndex = 0;
                return line;
            }
            return line.replace(BOLD_RE, (_, inner) => {
                hits.push(inner);
                return inner;
            });
        })
        .join('\n');
    return { out, hits, skipped };
}

// Process a content[] array, descending into section.content (which is itself
// a content[] array of blocks).
function processContentArray(arr, fileHits, fileSkipped) {
    for (const block of arr) {
        if (!block || typeof block !== 'object') continue;
        if (block.type === 'text' || block.type === 'paragraph') {
            if (typeof block.content === 'string') {
                const { out, hits, skipped } = stripBold(block.content);
                fileSkipped.push(...skipped);
                if (hits.length > 0) {
                    fileHits.push(...hits);
                    block.content = out;
                }
            }
        } else if (block.type === 'section' && Array.isArray(block.content)) {
            processContentArray(block.content, fileHits, fileSkipped);
        }
    }
}

function walkDir(dir, cb) {
    for (const name of fs.readdirSync(dir)) {
        const p = path.join(dir, name);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) walkDir(p, cb);
        else if (p.endsWith('.json')) cb(p);
    }
}

let filesChanged = 0;
let totalHits = 0;
const manualQueue = [];

walkDir(ROOT, (filePath) => {
    const raw = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return;
    }
    if (!Array.isArray(data.content)) return;

    const fileHits = [];
    const fileSkipped = [];
    processContentArray(data.content, fileHits, fileSkipped);
    const rel = path.relative(path.join(__dirname, '..'), filePath);
    if (fileSkipped.length > 0) manualQueue.push({ rel, lines: fileSkipped });
    if (fileHits.length === 0) return;

    filesChanged++;
    totalHits += fileHits.length;
    console.log(`\n${rel}  (${fileHits.length} bold removed)`);
    for (const h of fileHits.slice(0, 6)) console.log(`  **${h}**`);
    if (fileHits.length > 6) console.log(`  ... +${fileHits.length - 6} more`);

    if (APPLY) {
        // Detect original indent
        const m = raw.match(/^\{\n( +)/);
        const indent = m ? m[1].length : 4;
        const trailingNL = raw.endsWith('\n') ? '\n' : '';
        fs.writeFileSync(filePath, JSON.stringify(data, null, indent) + trailingNL, 'utf8');
    }
});

console.log(`\n${'-'.repeat(40)}`);
console.log(`Files ${APPLY ? 'changed' : 'that would change'}: ${filesChanged}`);
console.log(`Total **bold** instances removed: ${totalHits}`);

if (manualQueue.length > 0) {
    const n = manualQueue.reduce((sum, f) => sum + f.lines.length, 0);
    console.log(`\n${'-'.repeat(40)}`);
    console.log(`MÅ FIKSES MANUELT: ${n} hele-linje-bold i ${manualQueue.length} fil(er).`);
    console.log('Dette er underoverskrifter. Å strippe stjernene ville gjort dem');
    console.log('til brødtekst. Løft dem ut til egne header-/subheader-blokker.');
    for (const f of manualQueue) {
        console.log(`\n  ${f.rel}`);
        for (const l of f.lines.slice(0, 6)) console.log(`    ${l}`);
        if (f.lines.length > 6) console.log(`    ... +${f.lines.length - 6} flere`);
    }
}

if (!APPLY) console.log('\nDry run. Re-run with --apply to write changes.');
