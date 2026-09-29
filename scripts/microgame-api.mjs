// API-kort for mikrospill - generert fra koden, så det aldri blir utdatert.
//
// Byggmesteren i nattrutinen (.agent/workflows/daily_microgame_routine.md) leser dette i
// stedet for å lese tre hele referansespill for å finne ut hvordan kit, arkadeskall og
// sim-kontrakten ser ut. Kortet viser hver eksport med første JSDoc-linje og signaturen:
// hele props-interfaces og typer, funksjoner uten kropp, konstanter uten verdi.
//
// Bruk:
//   node scripts/microgame-api.mjs                 # skriver til stdout
//   node scripts/microgame-api.mjs --out /tmp/api.md

import { readdirSync, writeFileSync } from 'fs';
import path from 'path';
import ts from 'typescript';

const ROOT = 'src/components/microgames';
const GROUPS = [
    ['Kontrakten (typer, sim, selvspill)', ['types.ts', 'sim.ts', 'playtest.ts']],
    ['Arkadeskallet (arcade/)', listDir('arcade')],
    ['Kit (kit/)', listDir('kit')],
];

function listDir(dir) {
    return readdirSync(path.join(ROOT, dir))
        .filter((f) => /\.(ts|tsx)$/.test(f) && f !== 'index.ts')
        .sort()
        .map((f) => `${dir}/${f}`);
}

const isExported = (node) =>
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

function jsdocLine(node, src) {
    // Kommentarblokken rett over eksporten: en /** */ eller flere // på rad. Første linje
    // i blokken er den som sier hva tingen er.
    const ranges = ts.getLeadingCommentRanges(src.text, node.getFullStart()) ?? [];
    if (!ranges.length) return '';
    let start = ranges.length - 1;
    if (ranges[start].kind === ts.SyntaxKind.SingleLineCommentTrivia) {
        while (
            start > 0 &&
            ranges[start - 1].kind === ts.SyntaxKind.SingleLineCommentTrivia &&
            !/\n\s*\n/.test(src.text.slice(ranges[start - 1].end, ranges[start].pos))
        ) {
            start--;
        }
    }
    const text = ranges
        .slice(start)
        .map((r) => src.text.slice(r.pos, r.end))
        .join('\n')
        .replace(/^\/\*\*?|\*\/$/g, '')
        .split('\n')
        .map((l) => l.replace(/^\s*(\*|\/\/)\s?/, '').trim())
        .filter(Boolean);
    return text[0] ? `// ${text[0]}` : '';
}

const MAX_TYPE_LINES = 40;

function clip(text) {
    const lines = text.split('\n');
    if (lines.length <= MAX_TYPE_LINES) return text;
    return [
        ...lines.slice(0, MAX_TYPE_LINES),
        `    // ... ${lines.length - MAX_TYPE_LINES} linjer til`,
    ].join('\n');
}

function signature(node, src) {
    const text = node.getText(src);
    if (
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)
    ) {
        return clip(text);
    }
    if (ts.isFunctionDeclaration(node) && node.body) {
        return (
            text.slice(0, node.body.getStart(src) - node.getStart(src)).trim() +
            inferredReturn(node)
        );
    }
    if (ts.isClassDeclaration(node)) {
        return text.slice(0, text.indexOf('{')).trim() + ' { ... }';
    }
    if (ts.isVariableStatement(node)) {
        return node.declarationList.declarations
            .map((d) => {
                const name = d.name.getText(src);
                const type = d.type ? `: ${d.type.getText(src)}` : '';
                const init = d.initializer;
                if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
                    const head = init
                        .getText(src)
                        .slice(0, init.body.getStart(src) - init.getStart(src));
                    return `export const ${name} = ${head.trim()} ...${inferredReturn(init)}`;
                }
                return `export const ${name}${type}`;
            })
            .join('\n');
    }
    if (ts.isExportDeclaration(node)) return text;
    return null;
}

// Returtyper som ikke står i koden (hooks som returnerer objekter), hentes fra typesjekkeren -
// det er der feil som tone: 'warn' i stedet for 'fare' ellers oppstår.
const allFiles = GROUPS.flatMap(([, files]) => files.map((f) => path.join(ROOT, f)));
const program = ts.createProgram(allFiles, {
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    module: ts.ModuleKind.ESNext,
    skipLibCheck: true,
    noEmit: true,
});
const checker = program.getTypeChecker();
const MAX_RETURN = 600;

function inferredReturn(fn) {
    if (fn.type) return '';
    const sig = checker.getSignatureFromDeclaration(fn);
    if (!sig) return '';
    const t = checker.typeToString(
        checker.getReturnTypeOfSignature(sig),
        undefined,
        ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType
    );
    if (t === 'void' || t.startsWith('Element') || t === 'JSX.Element') return '';
    return `  // returnerer: ${t.length > MAX_RETURN ? t.slice(0, MAX_RETURN) + ' ...' : t}`;
}

const out = [
    '# API-kort for mikrospill (generert av scripts/microgame-api.mjs)',
    '',
    'Signaturene under er fasit. Trenger du oppførselen, les den ene fila du bruker - ikke hele mappa.',
    '',
];

for (const [title, files] of GROUPS) {
    out.push(`## ${title}`, '');
    for (const rel of files) {
        const file = path.join(ROOT, rel);
        const src = program.getSourceFile(file);
        const entries = [];
        for (const node of src.statements) {
            if (!isExported(node) && !ts.isExportDeclaration(node)) continue;
            const sig = signature(node, src);
            if (!sig) continue;
            const doc = jsdocLine(node, src);
            entries.push(doc ? `${doc}\n${sig}` : sig);
        }
        if (!entries.length) continue;
        out.push(`### ${rel}`, '```ts', entries.join('\n\n'), '```', '');
    }
}

const text = out.join('\n');
const outIdx = process.argv.indexOf('--out');
if (outIdx > -1) {
    writeFileSync(process.argv[outIdx + 1], text);
    console.log(
        `API-kort: ${process.argv[outIdx + 1]} (${Math.round(text.length / 3.8 / 1000)}k tokens)`
    );
} else {
    process.stdout.write(text);
}
