
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const CONTENT_DIR = path.join(__dirname, '../public/content');
export const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
export const TEXT_ENTRIES_DIR = path.join(__dirname, '../src/data/texts/entries');
export const MANUAL_PATH = path.join(CONTENT_DIR, 'global-timeline.manual.json');
export const OUTPUT_PATH = path.join(CONTENT_DIR, 'global-timeline.json');
// Stedordboken er et bygge-verktøy, ikke innhold: den bor i scripts/data/ og
// sendes ikke til elevene. Se generate-place-coordinates.js.
export const PLACE_COORDS_PATH = path.join(__dirname, 'data', 'place-coordinates.json');

// Geografisk beriking: gir hvert event lat/lng + land-id ut fra stedordboken.
// Mest presise tag vinner: by (3) > land/imperium (2) > region (1). Ved likhet
// vinner første tag i events tag-liste. Events uten geo-tag faller tilbake på
// fag (subjectFallback) og merkes geoConfidence:'guess'.
const KIND_RANK = { by: 3, by_: 3, land: 2, imperium: 2, region: 1 };

export function loadPlaceCoords() {
    if (!fs.existsSync(PLACE_COORDS_PATH)) {
        console.warn(`[timeline] place-coordinates.json mangler (${PLACE_COORDS_PATH}) — hopper over geo-beriking.`);
        return null;
    }
    return JSON.parse(fs.readFileSync(PLACE_COORDS_PATH, 'utf-8'));
}

export function enrichEventsWithGeo(events, placeData) {
    if (!placeData) return;
    const { places = {}, aliases = {}, subjectFallback = {} } = placeData;
    const canonical = (tag) => aliases[tag] || tag;

    for (const ev of events) {
        let best = null;
        for (const rawTag of ev.tags || []) {
            const place = places[canonical(rawTag)];
            if (!place) continue;
            const rank = KIND_RANK[place.kind] ?? 1;
            if (!best || rank > best.rank) best = { place, rank };
        }

        if (best) {
            ev.lat = best.place.lat;
            ev.lng = best.place.lng;
            ev.placeLabel = best.place.label;
            if (best.place.countryId != null) ev.placeCountryId = best.place.countryId;
            ev.geoConfidence = 'tag';
            continue;
        }

        // Fallback: gjett sted fra fag.
        const fallbackTag = subjectFallback[ev.subjectId];
        const fallback = fallbackTag ? places[fallbackTag] : null;
        if (fallback) {
            ev.lat = fallback.lat;
            ev.lng = fallback.lng;
            ev.placeLabel = fallback.label;
            if (fallback.countryId != null) ev.placeCountryId = fallback.countryId;
            ev.geoConfidence = 'guess';
        }
    }
}

// Minimum antall tekstbibliotek-events vi forventer å finne. Faller den under dette
// uten en bevisst sletting av tekster, har sannsynligvis filformatet eller stien
// endret seg — vi vil heller hard-feile enn å publisere en stille tom tidslinje.
const TEXT_LIBRARY_MIN_EXPECTED = 5;

// Helper to parse year strings like "1918–1939", "1885", "550 fvt", "-500-476"
export function parseYearString(yearStr) {
    if (!yearStr) return null;

    // Clean string (replace en-dash with hyphen, trim)
    let cleanStr = yearStr.toString().replace(/–/g, '-').trim();

    // «f.Kr» må gjenkjennes, ikke bare «fvt»/«bc».
    const BC_RE = /\bfvt\b|\bbc\b|f\.?\s*kr/;
    const AD_RE = /\bevt\b|\bad\b|e\.?\s*kr/;

    // Les tallet og eventuell egen epokemarkør, uten å bestemme fortegn ennå.
    const rawPart = (str) => {
        const s = str.trim().toLowerCase();
        const match = s.match(/-?\d+/);
        if (!match) return { num: NaN, bc: false, ad: false };
        return { num: parseInt(match[0]), bc: BC_RE.test(s), ad: AD_RE.test(s) };
    };

    const applySign = (p, inheritBC) => {
        if (isNaN(p.num)) return NaN;
        if (p.bc || (inheritBC && !p.ad)) return -Math.abs(p.num);
        return p.num;
    };

    const parsePart = (str) => applySign(rawPart(str), false);

    // Check for range with specific separator (space-hyphen-space or just hyphen if clear)
    // We try to split by " - " first to avoid splitting negative numbers
    let parts = cleanStr.split(/\s+-\s+/);

    // If no space-hyphen-space, try just hyphen but be careful about negative start
    if (parts.length === 1 && cleanStr.includes('-')) {
        // If it starts with -, we need to be careful. 
        // e.g. "-500-476" -> split at index 4? 
        // Let's try a regex for range instead
        const rangeMatch = cleanStr.match(/^(-?\d+(?:\s*\D+)?)\s*-\s*(-?\d+(?:\s*\D+)?)$/);
        if (rangeMatch) {
            parts = [rangeMatch[1], rangeMatch[2]];
        }
    }

    if (parts.length === 2) {
        const a = rawPart(parts[0]);
        const b = rawPart(parts[1]);

        // Retningen på epokemarkøren avgjør. Står den bakerst, gjelder den hele
        // spennet: «5000-500 fvt» er 5000 fvt til 500 fvt. Står den først,
        // gjelder den bare sitt eget ledd: «221 fvt - 1912» er 221 fvt til 1912.
        const start = applySign(a, b.bc && !a.ad);
        let end = applySign(b, false);

        // «1971-73» betyr 1971-1973: et forkortet sluttår arver århundret fra
        // startåret. Gjelder kun rene e.Kr.-spenn, så fvt-spenn (der sluttåret
        // med rette er nærmere null) ikke røres.
        if (!isNaN(start) && !isNaN(end) && start > 0 && end > 0 && end < start
            && String(end).length < String(start).length) {
            const s = String(start);
            end = parseInt(s.slice(0, s.length - String(end).length) + String(end));
        }

        if (!isNaN(start)) {
            return {
                startDate: start,
                endDate: isNaN(end) ? null : end,
                displayDate: yearStr
            };
        }
    }

    // Check for single year
    const year = parsePart(cleanStr);
    if (!isNaN(year)) {
        // Et blankt negativt årstall i kilden («year": "-70000"») ble vist rått
        // som «-70000» på tidslinjen. Skriv det om til norsk form; andre
        // formater beholder sin egen formulering.
        const bareNegative = /^-\d+$/.test(cleanStr);
        return {
            startDate: year,
            endDate: null,
            displayDate: bareNegative
                ? `${Math.abs(year).toLocaleString('no-NB')} fvt`
                : yearStr
        };
    }

    return null;
}

// Hent tekstbibliotek-events ved å scanne hver fil under src/data/texts/entries/.
// Hver fil er én TextEntry; vi plukker id, title, author og publishedYear via regex.
// Tekster uten publishedYear hoppes stille over (de har ingen plass i tidslinja).
export function extractTextLibraryData() {
    const events = [];
    if (!fs.existsSync(TEXT_ENTRIES_DIR)) {
        console.warn(`[timeline] Text entries dir not found: ${TEXT_ENTRIES_DIR}`);
        return events;
    }

    const files = fs.readdirSync(TEXT_ENTRIES_DIR).filter((f) => f.endsWith('.ts'));

    const extract = (content, key) => {
        // Tolerer både enkle og doble fnutter, og raw numbers for publishedYear.
        const re = new RegExp(`${key}\\s*:\\s*(?:'([^']+)'|"([^"]+)"|(\\d+))`);
        const m = content.match(re);
        if (!m) return null;
        return m[1] ?? m[2] ?? m[3] ?? null;
    };

    for (const file of files) {
        const filePath = path.join(TEXT_ENTRIES_DIR, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const id = extract(content, 'id');
        const title = extract(content, 'title');
        const author = extract(content, 'author');
        const yearStr = extract(content, 'publishedYear');
        if (!id || !title || !yearStr) continue;
        const year = parseInt(yearStr, 10);
        if (!Number.isFinite(year)) continue;
        events.push({
            id,
            title,
            description: author ? `Utgitt av ${author}` : '',
            startDate: year,
            endDate: null,
            displayDate: String(year),
            type: 'text',
            subjectId: 'norsk',
            link: `/norsk/bibliotek?text=${id}`,
            tags: [],
        });
    }

    console.error(`[timeline] Found ${events.length} text library entries (scanned ${files.length} files).`);
    return events;
}

// Les hand-kuraterte events fra manual-fila. Returnerer tom liste hvis fila mangler.
export function extractManualEvents() {
    if (!fs.existsSync(MANUAL_PATH)) {
        return [];
    }
    const raw = JSON.parse(fs.readFileSync(MANUAL_PATH, 'utf-8'));
    const events = Array.isArray(raw) ? raw : Array.isArray(raw?.events) ? raw.events : [];
    console.error(`[timeline] Loaded ${events.length} manual events from global-timeline.manual.json`);
    return events;
}

// Recursive function to traverse manifest
export function traverseManifest(node, subjectId = null, topicId = null, events = []) {
    // Set context
    if (node.id && ['norsk', 'samfunnskunnskap', 'historie', 'krle'].includes(node.id)) {
        subjectId = node.id;
    }

    // If it's a lesson (has id and isn't a container subject/topic)
    // We assume leaf nodes with 'tags' or 'year' are lessons, or if it's in a 'lessons' array
    if (node.id) {
        let timelineData = null;
        let subEvents = [];

        // Try to read content file for more metadata
        if (subjectId && topicId) {
            try {
                // Try subject/topic/id.json
                let filePath = path.join(CONTENT_DIR, subjectId, topicId, `${node.id}.json`);

                // If not found, try subject/topic/subtopic/id.json (if we had subtopic passed down, but we don't track it perfectly here yet)
                // For now, let's just try the direct path.

                if (fs.existsSync(filePath)) {
                    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                    // 1. Extract main timeline data
                    if (fileContent.year) {
                        timelineData = parseYearString(fileContent.year);
                    } else if (fileContent.date) {
                        const year = new Date(fileContent.date).getFullYear();
                        if (!isNaN(year)) {
                            timelineData = {
                                startDate: year,
                                endDate: null,
                                displayDate: year.toString()
                            };
                        }
                    }

                    // 2. Extract sub-events from 'timeline' array
                    if (fileContent.timeline && Array.isArray(fileContent.timeline)) {
                        fileContent.timeline.forEach((item, index) => {
                            if (item.year) {
                                const subTimelineData = parseYearString(item.year);
                                if (subTimelineData) {
                                    subEvents.push({
                                        id: `${node.id}-sub-${index}`,
                                        title: item.title || node.title,
                                        description: item.description,
                                        ...subTimelineData,
                                        type: 'sub-event',
                                        subjectId: subjectId || 'other',
                                        topicId: topicId,
                                        link: `/${subjectId}/${topicId}/${node.id}`, // Link to parent article
                                        tags: node.tags || []
                                    });
                                }
                            }
                        });
                    }
                }
            } catch (e) {
                // Ignore missing files or parse errors
            }
        }

        // Fallback to manifest data if file didn't yield timeline data
        if (!timelineData) {
            // 1. Check explicit year field
            if (node.year) {
                timelineData = parseYearString(node.year);
            }
            // 2. Check date field (often used for historical events in this schema)
            else if (node.date) {
                const year = new Date(node.date).getFullYear();
                if (!isNaN(year)) {
                    timelineData = {
                        startDate: year,
                        endDate: null,
                        displayDate: year.toString()
                    };
                }
            }
        }

        if (timelineData) {
            // Determine link
            let link = '';
            if (subjectId && topicId) {
                link = `/${subjectId}/${topicId}/${node.id}`;
            }

            events.push({
                id: node.id,
                title: node.title,
                description: node.description,
                ...timelineData,
                type: 'lesson',
                subjectId: subjectId || 'other',
                topicId: topicId,
                link: link,
                tags: node.tags || []
            });
        }

        // Add sub-events
        if (subEvents.length > 0) {
            events.push(...subEvents);
        }
    }

    // Recurse
    if (node.subjects) node.subjects.forEach(child => traverseManifest(child, subjectId, topicId, events));
    if (node.topics) node.topics.forEach(child => traverseManifest(child, subjectId, child.id, events)); // Update topicId
    if (node.subTopics) node.subTopics.forEach(child => traverseManifest(child, subjectId, topicId, events));
    if (node.lessons) node.lessons.forEach(child => traverseManifest(child, subjectId, topicId, events));

    return events;
}

export async function generate() {
    console.log('[timeline] Starting generation...');

    const eventMap = new Map();
    const counts = { manual: 0, lessons: 0, subEvents: 0, texts: 0, duplicateIds: 0 };

    // addEvent gir manual events forrang: hvis en id allerede finnes, hopper vi
    // over senere innslag. Manual går derfor først i pipelinen.
    const addEvent = (event, category) => {
        if (eventMap.has(event.id)) {
            counts.duplicateIds += 1;
            // Merge tags konservativt — vi vil ikke miste manuelle tags ved kollisjon
            const existing = eventMap.get(event.id);
            if (event.tags && event.tags.length > 0) {
                const combined = new Set([...(existing.tags || []), ...event.tags]);
                existing.tags = Array.from(combined);
            }
            return;
        }
        eventMap.set(event.id, event);
        counts[category] = (counts[category] || 0) + 1;
    };

    // 1. Manual events (vinner ved id-kollisjon)
    const manualEvents = extractManualEvents();
    for (const ev of manualEvents) {
        addEvent(ev, 'manual');
    }

    // 2. Manifest + per-lesson timeline[] sub-events
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const lessonEvents = traverseManifest(manifest);
    for (const ev of lessonEvents) {
        addEvent(ev, ev.type === 'sub-event' ? 'subEvents' : 'lessons');
    }

    // 3. Text library
    const textEvents = extractTextLibraryData();
    if (textEvents.length < TEXT_LIBRARY_MIN_EXPECTED) {
        console.error(
            `[timeline] FATAL: fant kun ${textEvents.length} tekstbibliotek-events ` +
                `(forventet minst ${TEXT_LIBRARY_MIN_EXPECTED}). Har formatet på src/data/texts/entries/*.ts endret seg?`
        );
        process.exit(1);
    }
    for (const ev of textEvents) {
        addEvent(ev, 'texts');
    }

    const allEvents = Array.from(eventMap.values()).sort((a, b) => a.startDate - b.startDate);

    // Geografisk beriking for verdensatlaset (/atlas).
    const placeData = loadPlaceCoords();
    enrichEventsWithGeo(allEvents, placeData);
    const geoTagged = allEvents.filter((e) => e.geoConfidence === 'tag').length;
    const geoGuessed = allEvents.filter((e) => e.geoConfidence === 'guess').length;
    console.log(
        `[timeline] geo: ${geoTagged} via tag, ${geoGuessed} via fag-gjetning, ` +
            `${allEvents.length - geoTagged - geoGuessed} uten sted.`
    );

    const output = {
        id: 'global-timeline',
        events: allEvents,
    };

    // Atomisk skriving: tmp -> rename. Aldri etterlat en halvskrevet fil.
    const tmpPath = `${OUTPUT_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(output, null, 2) + '\n');
    fs.renameSync(tmpPath, OUTPUT_PATH);

    console.log(
        `[timeline] Wrote ${allEvents.length} events ` +
            `(manual=${counts.manual}, lessons=${counts.lessons}, sub-events=${counts.subEvents}, ` +
            `texts=${counts.texts}, dedupe-skipped=${counts.duplicateIds}) → ${path.relative(process.cwd(), OUTPUT_PATH)}`
    );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    generate();
}
