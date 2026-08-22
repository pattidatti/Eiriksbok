// Berikar global-timeline.json med bilde-stier per event ved å lese heroImage fra
// hver lenket artikkel-JSON. Output: public/content/global-timeline-images.json,
// en flat { [eventId]: imagePath } map. Brukes av useTimelineImage som første ledd
// i fallback-kjeden (artikkel-hero → topic-hero → epoke-stemning).

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../public/content');
const TIMELINE_PATH = path.join(CONTENT_DIR, 'global-timeline.json');
const TOPICS_IMAGE_DIR = path.join(__dirname, '../public/images/topics');
const OUTPUT_PATH = path.join(CONTENT_DIR, 'global-timeline-images.json');

// Speiler isPendingImage() i src/utils/imageAvailability.ts. Artikler som venter på
// bildegenerering har heroImage = "/images/placeholder.webp" - en fil som med vilje
// ikke finnes. Slike stier skal aldri inn i bilde-mapsen: da faller eventet videre
// til topic-hero, og til slutt til epoke-fargestripen som er laget nettopp for
// events uten bilde.
const PENDING_IMAGE_PATTERN = /(^|\/)placeholder(-\w+)?\.(webp|png|jpe?g|avif)$/i;

function isPendingImage(src) {
    if (typeof src !== 'string') return true;
    const trimmed = src.trim();
    if (!trimmed) return true;
    return PENDING_IMAGE_PATTERN.test(trimmed.split(/[?#]/)[0]);
}

function resolveArticlePath(link) {
    // link forms: "/historie/vikingtiden/rikssamlingen" or
    // "/historie/vikingtiden/sub/lesson" or "/norsk/bibliotek?text=..."
    if (!link || !link.startsWith('/')) return null;
    const cleanPath = link.split('?')[0].split('#')[0];
    const parts = cleanPath.split('/').filter(Boolean);
    if (parts.length < 3) return null;
    // Try direct path: public/content/<a>/<b>/<c>.json (and deeper variants)
    const candidates = [];
    if (parts.length === 3) {
        candidates.push(path.join(CONTENT_DIR, parts[0], parts[1], `${parts[2]}.json`));
    } else if (parts.length === 4) {
        // subTopic-style
        candidates.push(path.join(CONTENT_DIR, parts[0], parts[1], parts[2], `${parts[3]}.json`));
        candidates.push(path.join(CONTENT_DIR, parts[0], parts[1], `${parts[3]}.json`));
    }
    return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function readHeroImage(filePath) {
    try {
        const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!isPendingImage(json.heroImage)) {
            return json.heroImage;
        }
        if (!isPendingImage(json.image)) {
            return json.image;
        }
    } catch {
        // ignore
    }
    return null;
}

function findTopicHero(topicId) {
    if (!topicId) return null;
    const underscored = topicId.replace(/-/g, '_');
    const candidates = [
        `${topicId}_hero.webp`,
        `${underscored}_hero.webp`,
        `${topicId}.webp`,
        `${underscored}.webp`,
    ];
    for (const c of candidates) {
        if (fs.existsSync(path.join(TOPICS_IMAGE_DIR, c))) {
            return `/images/topics/${c}`;
        }
    }
    return null;
}

function loadTimelineEvents() {
    if (!fs.existsSync(TIMELINE_PATH)) {
        console.error('[timeline-images] global-timeline.json mangler. Kjør generate-timeline.js først.');
        process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(TIMELINE_PATH, 'utf-8'));
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.events)) return raw.events;
    return [];
}

export function generate() {
    const events = loadTimelineEvents();
    const result = {};
    const stats = { hero: 0, topicHero: 0, none: 0 };

    // Cache topic-hero per topicId for ytelse + så vi kan rapportere tomme topics
    const topicHeroCache = new Map();

    // Pre-pass: bygg cache av article-hero per resolved-link slik at sub-events
    // arver fra forelder uten ekstra disk-lesninger.
    const heroByLink = new Map();
    const resolveArticleHero = (link) => {
        if (heroByLink.has(link)) return heroByLink.get(link);
        const articlePath = resolveArticlePath(link);
        const hero = articlePath ? readHeroImage(articlePath) : null;
        heroByLink.set(link, hero);
        return hero;
    };

    for (const event of events) {
        // 0) Explicit event image override
        if (!isPendingImage(event.image)) {
            result[event.id] = event.image;
            stats.hero += 1;
            continue;
        }

        // 1) Article heroImage (sub-events deler link med forelder, så de arver gratis)
        if (event.link) {
            const hero = resolveArticleHero(event.link);
            if (hero) {
                result[event.id] = hero;
                stats.hero += 1;
                continue;
            }
        }

        // 2) Topic-hero fallback
        const topicKey = event.topicId ?? '';
        if (!topicHeroCache.has(topicKey)) {
            topicHeroCache.set(topicKey, findTopicHero(event.topicId));
        }
        const topicHero = topicHeroCache.get(topicKey);
        if (topicHero) {
            result[event.id] = topicHero;
            stats.topicHero += 1;
            continue;
        }

        stats.none += 1;
    }

    const total = events.length;
    const covered = stats.hero + stats.topicHero;
    const pct = total > 0 ? Math.round((covered / total) * 100) : 0;

    const tmpPath = `${OUTPUT_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(result, null, 2) + '\n');
    fs.renameSync(tmpPath, OUTPUT_PATH);

    console.log(
        `[timeline-images] Wrote ${Object.keys(result).length} mappings ` +
            `(article-hero=${stats.hero}, topic-hero=${stats.topicHero}, none=${stats.none}, ` +
            `coverage=${pct}%) → ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    generate();
}
