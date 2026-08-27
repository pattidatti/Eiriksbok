/**
 * Prioritert bildekø for bildegenereringen (.agent/workflows/generate_article_images.md).
 *
 * Hvorfor: Gemini-kvoten tar slutt lenge før køen gjør det. Skanner vi artikkel for
 * artikkel, brenner vi kvoten på inline-bilde nr. 3 i den første artikkelen mens sytti
 * andre artikler står uten hero-bilde i det hele tatt. Hero-bildet er det eneste bildet
 * som vises to steder - i toppen av artikkelen og på leksjonskortet - så et manglende
 * hero er et hull eleven ser i navigasjonen, ikke bare inne i teksten.
 *
 * Derfor sorterer denne skanneren alle bildehull i én global kø:
 *   1. hero, brutt referanse   (sti i JSON, fil mangler på disk)
 *   2. hero, plassholder       (placeholder.webp)
 *   3. inline, brutt referanse
 *   4. inline, plassholder
 *   5. annet (komponent-props, scenario-noder), brutt før plassholder
 *
 * Bruk:
 *   node scripts/scan-image-queue.js              # lesbar kø, gruppert per prioritet
 *   node scripts/scan-image-queue.js --json       # maskinlesbar kø (samme rekkefølge)
 *   node scripts/scan-image-queue.js --limit 20   # bare de 20 øverste
 *   node scripts/scan-image-queue.js --kun hero   # bare hero-nivået (1-2)
 */

import fs from 'fs';
import path from 'path';

const CONTENT_DIR = 'public/content';
const PUBLIC_DIR = 'public';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const limitArg = args.indexOf('--limit');
const limit = limitArg !== -1 ? Number(args[limitArg + 1]) : Infinity;
const kunArg = args.indexOf('--kun');
const kun = kunArg !== -1 ? args[kunArg + 1] : null;

const PRIORITY = {
    'hero:brutt': 1,
    'hero:plassholder': 2,
    'inline:brutt': 3,
    'inline:plassholder': 4,
    'annet:brutt': 5,
    'annet:plassholder': 6,
};

const PRIORITY_LABEL = {
    1: 'Hero - brutt referanse (fil mangler på disk)',
    2: 'Hero - plassholder',
    3: 'Inline - brutt referanse (fil mangler på disk)',
    4: 'Inline - plassholder',
    5: 'Annet bilde (komponent/scenario) - brutt referanse',
    6: 'Annet bilde (komponent/scenario) - plassholder',
};

function getAllJsonFiles(dir, files = []) {
    for (const entry of fs.readdirSync(dir)) {
        const filePath = path.join(dir, entry);
        if (fs.statSync(filePath).isDirectory()) {
            getAllJsonFiles(filePath, files);
        } else if (entry.endsWith('.json')) {
            files.push(filePath);
        }
    }
    return files;
}

const isPlaceholder = (value) => typeof value === 'string' && value.includes('placeholder');
const isImagePath = (value) => typeof value === 'string' && value.startsWith('/images/');
const existsOnDisk = (value) => fs.existsSync(path.join(PUBLIC_DIR, value));

/** Manglende fil? Enten plassholder-markør eller ekte sti uten fil bak seg. */
function stateOf(value) {
    if (isPlaceholder(value)) return 'plassholder';
    if (isImagePath(value) && !existsOnDisk(value)) return 'brutt';
    return null;
}

/**
 * Finn emne-mappe og filnavn-stamme for et innholdsfil.
 *
 *   historie/vikingtiden/rikssamlingen.json     -> emne vikingtiden, stamme rikssamlingen
 *   krle/religion/islam/bonn/artikkel.json      -> emne islam,       stamme bonn
 *
 * Den siste formen er grunnen til at stammen ikke bare kan være `data.id`: alle
 * religions-temaene heter `bonn`, `frelse`, `skapelse` ... på tvers av religionene,
 * så id + nærmeste mappe ville sendt islams og hinduismens skapelsesbilde til
 * nøyaktig samme fil.
 */
function slotsOf(file) {
    const rel = path.relative(CONTENT_DIR, file);
    const parts = rel.split(path.sep);
    const subject = parts[0];
    const dirs = parts.slice(1, -1);
    const base = path.basename(rel, '.json');

    if (base === 'artikkel') {
        return {
            subject,
            emne: dirs.length > 1 ? dirs[dirs.length - 2] : subject,
            stamme: dirs.length ? dirs[dirs.length - 1] : base,
        };
    }
    return {
        subject,
        emne: dirs.length ? dirs[dirs.length - 1] : subject,
        stamme: base,
    };
}

/**
 * Foreslått filnavn, slik at agenten ikke finner på sitt eget navnemønster.
 * `taken` holder styr på navn som allerede er delt ut i denne kjøringen, slik at
 * to artikler aldri får beskjed om å skrive til samme fil.
 */
function suggestPath(emne, stamme, suffix, taken) {
    const build = (n) => `/images/${emne}/${stamme}-${n}.webp`;
    let candidate = build(suffix);

    if (suffix === 'hero') {
        let dup = 2;
        while (taken.has(candidate)) candidate = `/images/${emne}/${stamme}-hero-${dup++}.webp`;
        taken.add(candidate);
        return candidate;
    }

    // Inline-nummeret følger blokkens plass i artikkelen, så det holder å vike
    // for navn som allerede er delt ut i denne kjøringen.
    let n = Number(suffix);
    while (taken.has(candidate)) {
        n += 1;
        candidate = build(String(n).padStart(2, '0'));
    }
    taken.add(candidate);
    return candidate;
}

/** Dypskann etter bildestier vi ikke allerede har fanget som hero/inline. */
function deepImagePaths(node, seen = new Set(), out = []) {
    if (typeof node === 'string') {
        if ((isImagePath(node) || isPlaceholder(node)) && !seen.has(node)) out.push(node);
    } else if (Array.isArray(node)) {
        for (const item of node) deepImagePaths(item, seen, out);
    } else if (node && typeof node === 'object') {
        for (const value of Object.values(node)) deepImagePaths(value, seen, out);
    }
    return out;
}

function collect() {
    const queue = [];
    const taken = new Set();

    for (const file of getAllJsonFiles(CONTENT_DIR).sort()) {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch {
            continue;
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) continue;

        // Artikler og scenarier - ikke manifest, indekser og annen infrastruktur.
        const isArticle = data.id && (Array.isArray(data.content) || Array.isArray(data.nodes));
        if (!isArticle) continue;

        const { subject, emne, stamme } = slotsOf(file);
        const id = data.id;
        const handled = new Set();

        const push = (kind, field, current, suggested) => {
            const state = stateOf(current);
            if (!state) return;
            handled.add(current);
            queue.push({
                prioritet: PRIORITY[`${kind}:${state}`],
                type: kind,
                tilstand: state,
                fil: file,
                artikkel: id,
                tittel: data.title || id,
                fag: subject,
                emne,
                felt: field,
                naavaerende: current,
                // Brutt referanse: filnavnet står allerede i JSON-en, ikke rør den.
                lagreTil: state === 'brutt' ? current : suggested,
                maaOppdatereJson: state === 'plassholder',
            });
        };

        push('hero', 'heroImage', data.heroImage, suggestPath(emne, stamme, 'hero', taken));

        const imageBlocks = (data.content || []).filter((b) => b && b.type === 'image');
        imageBlocks.forEach((block, i) => {
            const index = String(i + 1).padStart(2, '0');
            push(
                'inline',
                `content[type=image] #${i + 1}`,
                block.src,
                suggestPath(emne, stamme, index, taken)
            );
        });

        for (const found of deepImagePaths(data)) {
            if (handled.has(found)) continue;
            handled.add(found);
            push('annet', 'nested', found, null);
        }
    }

    queue.sort(
        (a, b) =>
            a.prioritet - b.prioritet ||
            a.fag.localeCompare(b.fag, 'nb') ||
            a.fil.localeCompare(b.fil, 'nb') ||
            a.felt.localeCompare(b.felt, 'nb')
    );

    return queue;
}

const KJENTE_TYPER = ['hero', 'inline', 'annet'];

function run() {
    if (kun && !KJENTE_TYPER.includes(kun)) {
        console.error(`Ukjent --kun-verdi: ${kun}. Gyldige verdier: ${KJENTE_TYPER.join(', ')}.`);
        process.exit(1);
    }

    const alle = collect();
    const queue = kun ? alle.filter((item) => item.type === kun) : alle;
    const shown = queue.slice(0, limit);

    if (asJson) {
        console.log(JSON.stringify(shown, null, 2));
        return;
    }

    if (!queue.length) {
        // Skill mellom "ingenting igjen" og "filteret traff ingenting" - en agent som
        // leser dette skal aldri avslutte i den tro at køen er tom når den ikke er det.
        console.log(
            alle.length
                ? `Ingen hull av typen ${kun} - men ${alle.length} andre bildehull står igjen. Kjør uten --kun.`
                : 'Ingen bildehull igjen - alle hero- og inline-bilder finnes på disk.'
        );
        return;
    }

    const heroCount = queue.filter((i) => i.type === 'hero').length;
    console.log(`Bildekø: ${queue.length} hull, ${heroCount} av dem er hero-bilder.`);
    console.log('Ta køen ovenfra og ned. ALLE hero-bilder før første inline-bilde.\n');

    let current = null;
    for (const item of shown) {
        if (item.prioritet !== current) {
            current = item.prioritet;
            const n = queue.filter((i) => i.prioritet === current).length;
            console.log(`\n── Prioritet ${current}: ${PRIORITY_LABEL[current]} (${n}) ──`);
        }
        console.log(`${item.fag}/${item.emne}/${item.artikkel}  [${item.felt}]`);
        console.log(`   fil:      ${item.fil}`);
        console.log(`   lagre til: public${item.lagreTil ?? '(ukjent - se JSON-en)'}`);
        if (item.maaOppdatereJson) console.log('   husk:     oppdater JSON + manifest etterpå');
    }

    if (shown.length < queue.length) {
        console.log(`\n… ${queue.length - shown.length} flere hull ikke vist (--limit).`);
    }
}

run();
