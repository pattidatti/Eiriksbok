#!/usr/bin/env node
/**
 * Genererer public/content/interactive/detective/_index.json
 * fra alle saks-JSON-filer i samme mappe. Indeksen brukes av
 * DetectiveHubPage til å vise saker uten å hardkode metadata.
 *
 * Kjøres som del av scan:content.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'public/content/interactive/detective');
const OUT_FILE = join(SRC_DIR, '_index.json');

function deriveEpochFromPeriod(period) {
    if (!period) return undefined;
    const firstYear = parseInt(period.match(/-?\d{3,4}/)?.[0] ?? '', 10);
    if (Number.isNaN(firstYear)) return undefined;
    if (firstYear < 500) return 'oldtid';
    if (firstYear < 1500) return 'middelalder';
    if (firstYear < 1800) return 'tidlig-moderne';
    if (firstYear < 1945) return 'moderne';
    return 'samtid';
}

async function main() {
    const files = await readdir(SRC_DIR);
    const cases = [];

    for (const file of files) {
        if (!file.endsWith('.json') || file === '_index.json') continue;
        const fullPath = join(SRC_DIR, file);
        try {
            const raw = await readFile(fullPath, 'utf-8');
            const data = JSON.parse(raw);
            if (data.engine !== 'historical-detective') continue;

            const slug = file.replace(/\.json$/, '');
            cases.push({
                id: slug,
                // Sakens interne id - DetectiveEngine logger fullføringer med
                // denne, og den kan avvike fra filslugen.
                caseId: data.id,
                title: data.title,
                description: data.description,
                image: data.briefing?.image || data.image,
                period: data.period,
                location: data.location,
                difficulty: data.difficulty || 'Middels',
                estimatedTime: data.estimatedTime || '20 min',
                theme: data.theme || 'modern-investigation',
                epoch: data.epoch || deriveEpochFromPeriod(data.period),
                totalEvidence: data.status?.totalEvidence ?? 0,
                schemaVersion: data.schemaVersion || 1,
                kompetansemaal: data.kompetansemaal || [],
            });
        } catch (err) {
            console.warn(`[detective-index] Klarte ikke å lese ${file}: ${err.message}`);
        }
    }

    cases.sort((a, b) => a.title.localeCompare(b.title, 'no'));

    await writeFile(OUT_FILE, JSON.stringify({ cases }, null, 2) + '\n', 'utf-8');
    console.log(`[detective-index] Skrev ${cases.length} saker til _index.json`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
