// Bygger en mapping fra mikrospill-id til fag/tema ved å skanne alle
// innholds-JSON-filer for "gameId" (MicroGame-komponent) og "microGameId"
// (læringssti-steg). Output: public/content/microgame-map.json, en flat
// { [gameId]: { subjectId, topicId } } map. Brukes av «Dagens økt» til å
// velge et dagens-spill som matcher temaene eleven repeterer.

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../public/content');
const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
const OUTPUT_PATH = path.join(CONTENT_DIR, 'microgame-map.json');

const GAME_ID_RE = /"(?:gameId|microGameId)"\s*:\s*"([^"]+)"/g;

function loadValidSubjectIds() {
    try {
        const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
        return new Set((manifest.subjects ?? []).map((s) => s.id));
    } catch {
        return new Set();
    }
}

function* walkJsonFiles(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkJsonFiles(full);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            yield full;
        }
    }
}

export function generate() {
    const validSubjects = loadValidSubjectIds();
    const result = {};
    const stats = { mapped: 0, duplicates: 0, outsideSubjects: 0 };

    for (const filePath of walkJsonFiles(CONTENT_DIR)) {
        const rel = path.relative(CONTENT_DIR, filePath);
        const parts = rel.split(path.sep);
        // Forventet form: <subject>/<topic>/[<subtopic>/]<fil>.json
        const inSubject = parts.length >= 3 && validSubjects.has(parts[0]);

        let text;
        try {
            text = fs.readFileSync(filePath, 'utf-8');
        } catch {
            continue;
        }

        for (const match of text.matchAll(GAME_ID_RE)) {
            const gameId = match[1];
            if (!inSubject) {
                stats.outsideSubjects += 1;
                continue;
            }
            if (result[gameId]) {
                stats.duplicates += 1;
                continue; // første treff vinner
            }
            result[gameId] = { subjectId: parts[0], topicId: parts[1] };
            stats.mapped += 1;
        }
    }

    const tmpPath = `${OUTPUT_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(result, null, 2) + '\n');
    fs.renameSync(tmpPath, OUTPUT_PATH);

    console.log(
        `[microgame-map] Wrote ${stats.mapped} mappings ` +
            `(duplicates=${stats.duplicates}, outside-subjects=${stats.outsideSubjects}) ` +
            `→ ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    generate();
}
