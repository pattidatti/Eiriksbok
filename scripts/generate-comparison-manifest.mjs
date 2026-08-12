// Genererer public/data/comparison-manifest.json - kilden til sannhet for
// sammenligningssidene (/krle/sammenlign og /krle/filosofi/sammenlign).
//
// Scanner:
//  - public/data/religion/*.json      -> religions[] (med dimensjonsdekning)
//  - public/data/philosophy/*.json    -> philosophers[] (med epokegruppe)
//  - public/content/krle/filosofi/*.json -> filosofer med artikkel (hasDimensions-flagg)
//  - public/content/krle/religion/*/*/artikkel.json -> topics[] fra comparison_tags
//
// Tema-slugs normaliseres (ø/æ/å -> o/ae/a, _ -> -) slik at «bønn» og «hellige_tekster»
// treffer mappene bonn/ og hellige-tekster/. Tema med færre enn 2 religioner utelates.
// Kjøres som del av `npm run scan:content`.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OUT_FILE = path.join(PUBLIC, 'data', 'comparison-manifest.json');

// Tag-aliaser: varianter i innholdet som skal peke på samme tema
const TAG_ALIASES = {
    'frelse-og-mal': 'frelse',
    skapelsesmyte: 'skapelse',
    ritualer: 'ritual',
    fortellinger: 'narrative',
};

// De 7 dimensjonsnøklene brukes også som tags på artikler; de dekkes av
// dimensjonsvisningen og skal ikke bli egne tema-chips.
const DIMENSION_KEYS = new Set([
    'ritual',
    'narrative',
    'experiential',
    'social',
    'ethical',
    'doctrinal',
    'material',
]);

const TOPIC_LABELS = {
    'sentrale-trekk': 'Sentrale trekk',
    'hellige-tekster': 'Hellige tekster',
    gudsbilde: 'Gudsbilde',
    overgangsriter: 'Overgangsriter',
    bonn: 'Bønn',
    doden: 'Døden',
    frelse: 'Frelse og mål',
    grunnleggere: 'Grunnleggere',
    skapelse: 'Skapelsen',
    dagligliv: 'Dagligliv',
    opprinnelse: 'Opprinnelse',
    'den-attedelte-vei': 'Den åttedelte veien',
};

// Epokegrupper for filosofer (brukes av velgeren på /krle/filosofi/sammenlign)
const PHILOSOPHER_GROUPS = {
    sokrates: 'Antikken',
    platon: 'Antikken',
    aristoteles: 'Antikken',
    augustin: 'Middelalderen',
    aquinas: 'Middelalderen',
    descartes: 'Opplysningstiden',
    locke: 'Opplysningstiden',
    hume: 'Opplysningstiden',
    montesquieu: 'Opplysningstiden',
    rousseau: 'Opplysningstiden',
    kant: 'Opplysningstiden',
    kierkegaard: 'Moderne',
    marx: 'Moderne',
    nietzsche: 'Moderne',
    heidegger: 'Moderne',
    arendt: 'Moderne',
    beauvoir: 'Moderne',
    mises: 'Moderne',
    rothbard: 'Moderne',
};

export function normalizeTagSlug(tag) {
    const slug = String(tag)
        .trim()
        .toLowerCase()
        .replace(/æ/g, 'ae')
        .replace(/ø/g, 'o')
        .replace(/å/g, 'a')
        .replace(/[_\s]+/g, '-');
    return TAG_ALIASES[slug] || slug;
}

function labelFromSlug(slug) {
    if (TOPIC_LABELS[slug]) return TOPIC_LABELS[slug];
    const text = slug.replace(/-/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function readJson(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (err) {
        console.warn(`[comparison-manifest] Klarte ikke å lese ${file}: ${err.message}`);
        return null;
    }
}

// Trekker ut ren tekst fra Tina rich-text-noder (root > children > text).
// Løftede dimensjoner er et kort med teksten i `body` og ekstra felter rundt.
function extractText(node) {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join(' ');
    if (typeof node === 'object') {
        if (typeof node.text === 'string') return node.text;
        if (node.children) return extractText(node.children);
        if ('body' in node || 'summary' in node) {
            return [extractText(node.summary), extractText(node.body)].join(' ').trim();
        }
    }
    return '';
}

function scanEntities(dir, groups) {
    const entities = [];
    if (!fs.existsSync(dir)) return entities;
    for (const file of fs.readdirSync(dir).sort()) {
        if (!file.endsWith('.json')) continue;
        const id = file.replace(/\.json$/, '');
        const data = readJson(path.join(dir, file));
        if (!data || !data.dimensions) continue;
        const dimensionLengths = {};
        for (const [key, value] of Object.entries(data.dimensions)) {
            const text = extractText(value).trim();
            if (text) dimensionLengths[key] = text.length;
        }
        const entity = {
            id,
            name: data.name || id.charAt(0).toUpperCase() + id.slice(1),
            color: data.color || null,
            dimensions: dimensionLengths,
        };
        if (groups) entity.group = data.group || groups[id] || 'Moderne';
        entities.push(entity);
    }
    return entities;
}

function buildManifest() {
    const religions = scanEntities(path.join(PUBLIC, 'data', 'religion'), null);
    const philosophers = scanEntities(path.join(PUBLIC, 'data', 'philosophy'), PHILOSOPHER_GROUPS);

    // Filosofer som har full artikkel i content/krle/filosofi/
    const philosophyContentDir = path.join(PUBLIC, 'content', 'krle', 'filosofi');
    const philosopherArticles = new Set();
    if (fs.existsSync(philosophyContentDir)) {
        for (const file of fs.readdirSync(philosophyContentDir)) {
            if (!file.endsWith('.json') || file === 'intro.json') continue;
            philosopherArticles.add(file.replace(/\.json$/, ''));
        }
    }
    for (const p of philosophers) {
        p.hasArticle = philosopherArticles.has(p.id);
        p.hasDimensions = Object.keys(p.dimensions).length > 0;
    }
    const missingDimensions = [...philosopherArticles].filter(
        (id) => !philosophers.some((p) => p.id === id)
    );

    // Tema-indeks fra religionsartiklenes comparison_tags + artikkel-liste
    // per religion/dimensjon (brukes til «Fordypning»-lenker i sammenligningen)
    const religionContentDir = path.join(PUBLIC, 'content', 'krle', 'religion');
    const topicMap = new Map();
    const religionArticles = [];
    if (fs.existsSync(religionContentDir)) {
        for (const religion of fs.readdirSync(religionContentDir).sort()) {
            const religionDir = path.join(religionContentDir, religion);
            if (!fs.statSync(religionDir).isDirectory()) continue;
            for (const folder of fs.readdirSync(religionDir).sort()) {
                const articleFile = path.join(religionDir, folder, 'artikkel.json');
                if (!fs.existsSync(articleFile)) continue;
                const article = readJson(articleFile);
                if (!article) continue;
                religionArticles.push({
                    religion,
                    title: article.title || folder,
                    link: `/krle/religion/${religion}/${folder}`,
                    dimension: article.dimension || null,
                    tags: (article.comparison_tags || []).map(normalizeTagSlug),
                });
                const tags = article.comparison_tags || [];
                for (const tag of tags) {
                    const slug = normalizeTagSlug(tag);
                    if (DIMENSION_KEYS.has(slug)) continue;
                    if (!topicMap.has(slug)) {
                        topicMap.set(slug, { slug, label: labelFromSlug(slug), entries: [] });
                    }
                    const topic = topicMap.get(slug);
                    if (topic.entries.some((e) => e.religion === religion)) continue;
                    topic.entries.push({
                        religion,
                        title: article.title || folder,
                        // Fetch-sti relativt til BASE_URL + rute-lenke (4 segmenter)
                        file: `content/krle/religion/${religion}/${folder}/artikkel.json`,
                        link: `/krle/religion/${religion}/${folder}`,
                    });
                }
            }
        }
    }

    const totalReligions = religions.length;
    const topics = [...topicMap.values()]
        .map((t) => ({ ...t, count: t.entries.length, total: totalReligions }))
        .filter((t) => t.count >= 2)
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'nb'));

    return {
        // Ingen tidsstempel her. Det ble skrevet ved hver build og ga fila en
        // diff selv når ingenting var endret; ingen leser det, og fila ligger
        // i git der commit-datoen alt sier når den ble laget.
        religions,
        philosophers,
        topics,
        religionArticles,
        _warnings: {
            philosophersMissingDimensions: missingDimensions.sort(),
            thinReligionDimensions: religions
                .flatMap((r) =>
                    Object.entries(r.dimensions)
                        .filter(([, len]) => len < 150)
                        .map(([dim]) => `${r.id}/${dim}`)
                )
                .sort(),
        },
    };
}

const manifest = buildManifest();
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

console.log(
    `[comparison-manifest] ${manifest.religions.length} religioner, ` +
        `${manifest.philosophers.length} filosofer, ${manifest.topics.length} tema -> ${path.relative(ROOT, OUT_FILE)}`
);
if (manifest._warnings.philosophersMissingDimensions.length > 0) {
    console.log(
        `[comparison-manifest] Filosofer med artikkel uten dimensjonsdata: ` +
            manifest._warnings.philosophersMissingDimensions.join(', ')
    );
}
if (manifest._warnings.thinReligionDimensions.length > 0) {
    console.log(
        `[comparison-manifest] Tynne religionsdimensjoner (under 150 tegn): ` +
            manifest._warnings.thinReligionDimensions.length +
            ' stk'
    );
}
