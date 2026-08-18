// Genererer public/data/comparison-manifest.json - kilden til sannhet for
// sammenligningssidene (/krle/sammenlign og /krle/filosofi/sammenlign).
//
// Scanner:
//  - public/data/religion/*.json      -> religions[] (med dimensjonsdekning)
//  - public/data/philosophy/*.json    -> philosophers[] (med epokegruppe)
//  - public/content/krle/filosofi/*.json -> filosofer med artikkel (hasDimensions-flagg)
//  - public/content/krle/religion/*/<tema>/artikkel.json -> topics[] fra comparison_tags
//  - public/content/krle/religion/*/<tema>.json          -> samme, flat lagring
//
// Begge lagringsformene teller. Flat <id>.json er formen nye artikler får, mens
// eldre artikler ligger i mappe med artikkel.json; leser vi bare den ene, blir
// halve innholdet usynlig for krysslenkene.
//
// Tema-slugs normaliseres (ø/æ/å -> o/ae/a, _ -> -) slik at «bønn» og «hellige_tekster»
// treffer mappene bonn/ og hellige-tekster/. Tema med færre enn 2 religioner utelates,
// og tema som bare er et annet navn på et annet tema slås sammen (se mergeSubsetTopics).
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
    // «Døden» er slått sammen hit (samme artikler), men er elevens ord og
    // skal stå i etiketten
    overgangsriter: 'Overgangsriter og døden',
    bonn: 'Bønn',
    doden: 'Døden',
    frelse: 'Frelse og mål',
    grunnleggere: 'Grunnleggere',
    skapelse: 'Skapelsen',
    dagligliv: 'Dagligliv',
    opprinnelse: 'Opprinnelse',
    'den-attedelte-vei': 'Den åttedelte veien',
};

// Kortform der etiketten er for lang, f.eks. kolonneoverskriftene i innholdskartet
const TOPIC_SHORT_LABELS = {
    overgangsriter: 'Overgangsriter',
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

/**
 * Navnene slik eleven skal lese dem. Datafilene skriver «Bahai» fordi filnavnet
 * er bahai.json, mens manifest.json har «Bahá'í» - det er den som er fasit, og
 * den som står i bytteren og i brødsmulene.
 */
function manifestReligionNames() {
    const manifest = readJson(path.join(PUBLIC, 'content', 'manifest.json'));
    const names = {};
    const subTopics =
        manifest?.subjects
            ?.find((s) => s.id === 'krle')
            ?.topics?.find((t) => t.id === 'religion')?.subTopics ?? [];
    for (const st of subTopics) if (st.id && st.title) names[st.id] = st.title;
    return names;
}

function scanEntities(dir, groups, nameOverrides = {}) {
    const entities = [];
    if (!fs.existsSync(dir)) return entities;
    for (const file of fs.readdirSync(dir).sort()) {
        if (!file.endsWith('.json')) continue;
        const id = file.replace(/\.json$/, '');
        const data = readJson(path.join(dir, file));
        if (!data || !data.dimensions) continue;
        const dimensionLengths = {};
        const summaries = {};
        for (const [key, value] of Object.entries(data.dimensions)) {
            const text = extractText(value).trim();
            if (text) dimensionLengths[key] = text.length;
            // Ingressen tas med i manifestet slik at oversiktsflater kan vise
            // *svaret* uten å laste hele profilfila. Religionshuben bruker den
            // til å la alle kortene snu innhold når eleven bytter linse.
            const summary = typeof value?.summary === 'string' ? value.summary.trim() : '';
            if (summary) summaries[key] = summary;
        }
        const entity = {
            id,
            name: nameOverrides[id] || data.name || id.charAt(0).toUpperCase() + id.slice(1),
            color: data.color || null,
            dimensions: dimensionLengths,
        };
        if (Object.keys(summaries).length > 0) entity.summaries = summaries;
        if (groups) entity.group = data.group || groups[id] || 'Moderne';
        entities.push(entity);
    }
    return entities;
}

/**
 * Er et temas artikler en delmengde av et annet temas, er det ikke et eget
 * tema - det er et annet navn på det samme. «Døden» og «Overgangsriter» peker
 * på nøyaktig de samme ni artiklene, og «Dagligliv» på to av bønn-artiklene.
 * Det minste temaet blir et alias for det største, slik at gamle lenker lever
 * videre uten at eleven møter to like kolonner i innholdskartet.
 *
 * Regelen holder seg selv i orden: får «Dagligliv» en egen artikkel i en tredje
 * religion, er den ikke lenger en delmengde og dukker opp som eget tema igjen.
 */
/**
 * Læringsstiene i public/content/krle/sammenligning/*-sti.json er registrert
 * som `tools` i manifest.json, og har derfor bare vært synlige på sin egen
 * emneside. De dekker nøyaktig de samme artiklene som temaene og profilene,
 * så de hører hjemme i krysslenkevevet.
 *
 * Her plukkes artikkellenkene ut av stegenes markdown («Les artikkelen
 * [Tittel](/krle/religion/islam/bonn)»), slik at en artikkel kan si hvilket
 * steg den er i, og et tema kan si at det finnes en sti om det.
 */
function scanLearningPaths(religionIds) {
    const dir = path.join(PUBLIC, 'content', 'krle', 'sammenligning');
    if (!fs.existsSync(dir)) return [];

    const paths = [];
    for (const file of fs.readdirSync(dir).sort()) {
        if (!file.endsWith('-sti.json')) continue;
        const data = readJson(path.join(dir, file));
        if (!data) continue;
        const steps = data.learningPathData?.steps ?? [];

        // Artikkellenkene ligger som markdown i oppgavetekst og brødtekst
        const seen = new Set();
        const articleLinks = [];
        for (const [index, step] of steps.entries()) {
            const haystack = [step.content, ...(step.tasks ?? [])]
                .map((t) => (typeof t === 'string' ? t : (t?.text ?? t?.task ?? '')))
                .join('\n');
            for (const match of haystack.matchAll(/\]\((\/krle\/religion\/[^)\s]+)\)/g)) {
                const link = match[1];
                if (seen.has(link)) continue;
                // Bare artikler (fire segmenter), ikke profil-lenker
                if (link.split('/').filter(Boolean).length !== 4) continue;
                if (!religionIds.has(link.split('/')[3])) continue;
                seen.add(link);
                articleLinks.push({ link, step: index + 1, stepTitle: step.title ?? null });
            }
        }

        paths.push({
            id: data.id ?? file.replace(/\.json$/, ''),
            title: data.learningPathData?.title ?? data.title ?? data.id,
            description: data.description ?? null,
            link: `/krle/sammenligning/${data.id ?? file.replace(/\.json$/, '')}`,
            // Settes på toppnivå i sti-fila; styrer hvilken linse stien åpner i
            dimension: data.dimension ?? null,
            topics: (data.comparison_tags ?? []).map(normalizeTagSlug),
            steps: steps.length,
            articleLinks,
        });
    }
    return paths;
}

function mergeSubsetTopics(topics) {
    // Hvor mange av temaets artikler ligger i en mappe som heter det samme?
    // Det skiller temaets egne artikler fra dem som bare nevner det i en tag.
    const selfNamed = (topic) =>
        topic.entries.filter((e) => normalizeTagSlug(e.link.split('/').pop()) === topic.slug)
            .length;

    const ranked = [...topics].sort(
        (a, b) =>
            b.count - a.count ||
            selfNamed(b) - selfNamed(a) ||
            a.slug.localeCompare(b.slug, 'nb')
    );

    const kept = [];
    for (const topic of ranked) {
        const links = new Set(topic.entries.map((e) => e.link));
        const host = kept.find((k) => {
            const hostLinks = new Set(k.entries.map((e) => e.link));
            return [...links].every((link) => hostLinks.has(link));
        });
        if (host) {
            host.aliases = [...(host.aliases || []), topic.slug].sort();
        } else {
            kept.push(topic);
        }
    }
    return kept.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'nb'));
}

function buildManifest() {
    const religions = scanEntities(path.join(PUBLIC, 'data', 'religion'), null, manifestReligionNames());
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
    // Tema-indeksen holder seg til religionene som har en sju-dimensjonsprofil,
    // slik at «x av y religioner» teller det samme overalt. Artikler fra de
    // andre (historiske religioner, samisk) blir med i religionArticles, men
    // ikke i tema-sidene.
    const profileReligions = new Set(religions.map((r) => r.id));
    const articlesOutsideProfiles = [];
    if (fs.existsSync(religionContentDir)) {
        for (const religion of fs.readdirSync(religionContentDir).sort()) {
            const religionDir = path.join(religionContentDir, religion);
            if (!fs.statSync(religionDir).isDirectory()) continue;
            for (const name of fs.readdirSync(religionDir).sort()) {
                // Begge lagringsformene: <tema>/artikkel.json og <tema>.json
                const entryPath = path.join(religionDir, name);
                const isFolder = fs.statSync(entryPath).isDirectory();
                if (!isFolder && !name.endsWith('.json')) continue;
                const slug = isFolder ? name : name.replace(/\.json$/, '');
                const relativeFile = isFolder
                    ? `content/krle/religion/${religion}/${slug}/artikkel.json`
                    : `content/krle/religion/${religion}/${slug}.json`;
                const articleFile = path.join(PUBLIC, relativeFile);
                if (!fs.existsSync(articleFile)) continue;
                const article = readJson(articleFile);
                if (!article) continue;

                const title = article.title || slug;
                const link = `/krle/religion/${religion}/${slug}`;
                religionArticles.push({
                    religion,
                    title,
                    link,
                    dimension: article.dimension || null,
                    tags: (article.comparison_tags || []).map(normalizeTagSlug),
                });
                if (!profileReligions.has(religion)) {
                    articlesOutsideProfiles.push(link);
                    continue;
                }

                const ownSlug = normalizeTagSlug(slug);
                for (const tag of article.comparison_tags || []) {
                    const tagSlug = normalizeTagSlug(tag);
                    if (DIMENSION_KEYS.has(tagSlug)) continue;
                    if (!topicMap.has(tagSlug)) {
                        topicMap.set(tagSlug, {
                            slug: tagSlug,
                            label: labelFromSlug(tagSlug),
                            entries: [],
                        });
                    }
                    const topic = topicMap.get(tagSlug);
                    // Fetch-sti relativt til BASE_URL + rute-lenke (4 segmenter)
                    const entry = { religion, title, file: relativeFile, link };
                    const existing = topic.entries.findIndex((e) => e.religion === religion);
                    if (existing < 0) {
                        topic.entries.push(entry);
                    } else if (ownSlug === tagSlug) {
                        // Artikkelen som heter det samme som temaet er temaets
                        // egen artikkel, og slår en som bare nevner det i en tag
                        topic.entries[existing] = entry;
                    }
                }
            }
        }
    }

    const totalReligions = religions.length;
    const allTopics = [...topicMap.values()]
        .map((t) => ({
            ...t,
            label: TOPIC_LABELS[t.slug] || t.label,
            short: TOPIC_SHORT_LABELS[t.slug],
            count: t.entries.length,
            total: totalReligions,
        }))
        .filter((t) => t.count >= 2);
    const topics = mergeSubsetTopics(allTopics);

    const learningPaths = scanLearningPaths(new Set(religions.map((r) => r.id)));

    return {
        // Ingen tidsstempel her. Det ble skrevet ved hver build og ga fila en
        // diff selv når ingenting var endret; ingen leser det, og fila ligger
        // i git der commit-datoen alt sier når den ble laget.
        religions,
        philosophers,
        topics,
        religionArticles,
        learningPaths,
        _warnings: {
            philosophersMissingDimensions: missingDimensions.sort(),
            // Artikler om religioner uten sju-dimensjonsprofil. De vises ikke i
            // tema-sidene i dag; skal de med, må «x av y religioner»-tellingen
            // endres samtidig.
            articlesOutsideProfiles: articlesOutsideProfiles.sort(),
            mergedTopics: topics
                .filter((t) => t.aliases)
                .map((t) => `${t.aliases.join(', ')} -> ${t.slug}`)
                .sort(),
            // Stier uten `dimension`/`comparison_tags` på toppnivå havner
            // ikke i krysslenkene, bare i sin egen emneside
            unwiredLearningPaths: learningPaths
                .filter((p) => !p.dimension || p.topics.length === 0)
                .map((p) => p.id)
                .sort(),
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
        `${manifest.philosophers.length} filosofer, ${manifest.topics.length} tema, ` +
        `${manifest.learningPaths.length} stier -> ${path.relative(ROOT, OUT_FILE)}`
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
