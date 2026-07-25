// Bygger spørsmålsbanken som rollespillet «Minnevokteren» (/oving/rpg) henter
// questene sine fra. Skanner alle innholds-JSON-filer for Quiz-komponenter og
// samler spørsmålene i public/data/rpg/quest-bank.json, gruppert per sone.
//
// En «sone» i spillet er en epoke eller et fagområde. Sone-tilhørigheten
// utledes av fag + emne (subjectId/topicId) via ZONE_RULES nedenfor. Emner som
// ikke treffer en regel havner i fagets standardsone, slik at nytt fagstoff
// dukker opp i spillet automatisk uten at noen må vedlikeholde en liste.
//
// Output-formatet er bevisst tynt: spillet trenger spørsmål, svar, forklaring
// og en lenke tilbake til artikkelen svaret står i - det siste er selve
// poenget, for eleven skal kunne finne svaret i verden (og i boka).

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../public/content');
const MANIFEST_PATH = path.join(CONTENT_DIR, 'manifest.json');
const OUTPUT_DIR = path.join(__dirname, '../public/data/rpg');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'quest-bank.json');

// Sonene i spillverdenen. Rekkefølgen er spillerens reise gjennom verden.
// `topics` matcher topicId eksakt; `subjects` er fallback for hele faget.
const ZONE_RULES = [
    {
        id: 'nordvik',
        title: 'Nordvik',
        era: 'Vikingtiden',
        subjects: [],
        topics: ['vikingtiden'],
    },
    {
        id: 'gryet',
        title: 'Gryet',
        era: 'Steinalder og de første byene',
        subjects: [],
        topics: ['menneskets-tidlige-historie', 'jordbruk-og-sivilisasjoner', 'historiens-store-gater'],
    },
    {
        id: 'marmortorget',
        title: 'Marmortorget',
        era: 'Antikken',
        subjects: [],
        topics: ['antikkens-hellas', 'romerriket', 'perserriket', 'midtoesten', 'kinas-historie'],
    },
    {
        id: 'steinborg',
        title: 'Steinborg',
        era: 'Middelalderen',
        subjects: [],
        topics: [
            'middelalderen',
            'norsk-middelalder',
            'dansketiden',
            'osmanske-riket',
            'afrikanske-riker',
            'lov-og-rett',
        ],
    },
    {
        id: 'lysbyen',
        title: 'Lysbyen',
        era: 'Renessanse og revolusjoner',
        subjects: [],
        topics: [
            'renessansen',
            'reformasjonen',
            'den-amerikanske-revolusjonen',
            'den-franske-revolusjon',
            'nasjonalstatenes-tid',
            'kolonialisering',
        ],
    },
    {
        id: 'dampbyen',
        title: 'Dampbyen',
        era: 'Industrialiseringen',
        subjects: [],
        topics: ['industriell-revolusjon', 'teknologi-og-hverdagsliv'],
    },
    {
        id: 'skyggeaaret',
        title: 'Skyggeåret',
        era: 'Krig og kald krig',
        subjects: [],
        topics: [
            'forste-verdenskrig',
            'mellomkrigstiden',
            'andre-verdenskrig',
            'etterkrigstiden',
            'den-kalde-krigen',
            'dekolonisering',
            'norge-i-moderne-tid',
            'sveriges-historie',
            'japans-historie',
        ],
    },
    {
        id: 'ordheimen',
        title: 'Ordheimen',
        era: 'Språk og litteratur',
        subjects: ['norsk'],
        topics: [],
    },
    {
        id: 'tempelhagen',
        title: 'Tempelhagen',
        era: 'Tro og tanke',
        subjects: ['krle'],
        topics: [],
    },
    {
        id: 'radhusplassen',
        title: 'Rådhusplassen',
        era: 'Samfunn og demokrati',
        subjects: ['samfunnskunnskap', 'samfunnsfag'],
        topics: [],
    },
    {
        id: 'klangdalen',
        title: 'Klangdalen',
        era: 'Musikk',
        subjects: ['musikk'],
        topics: [],
    },
];

// Emner som ikke traff en epoke- eller fag-regel havner her.
const FALLBACK_ZONE = { id: 'gryet', title: 'Gryet', era: 'Steinalder og de første byene' };

// Historieartikler plasseres etter årstallet sitt, ikke etter emnemappa. Et
// emne som «norgeshistorie» spenner over tusen år, og da havner artiklene i
// helt feil epoke hvis vi går på mappenavnet.
const ERA_BY_YEAR = [
    { until: -1000, zone: 'gryet' },
    { until: 499, zone: 'marmortorget' },
    { until: 1099, zone: 'nordvik' },
    { until: 1499, zone: 'steinborg' },
    { until: 1799, zone: 'lysbyen' },
    { until: 1913, zone: 'dampbyen' },
    { until: Infinity, zone: 'skyggeaaret' },
];

/**
 * Leser årstallsfeltet i artikkelen. Formatet er fritekst («776 fvt»,
 * «ca. 300-1240», «1940-1945»), så vi tar første tall og snur fortegnet hvis
 * det står fvt/f.Kr. Returnerer null når feltet ikke lar seg tolke.
 */
function parseYear(raw) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const text = String(raw);
    const match = text.match(/-?\d{1,4}/);
    if (!match) return null;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) return null;
    const isBce = /\b(fvt|f\.?\s*kr|bce|f\.kr\.)/i.test(text);
    return isBce ? -Math.abs(value) : value;
}

function zoneByYear(year) {
    const hit = ERA_BY_YEAR.find((e) => year <= e.until);
    return ZONE_RULES.find((z) => z.id === (hit?.zone ?? FALLBACK_ZONE.id)) ?? FALLBACK_ZONE;
}

// Emner som holdes utenfor spillet. Innholdet står uendret i boka - det hører
// bare ikke hjemme i en ramme der du slår ned monstre og plukker opp loot.
const EXCLUDED_LESSONS = new Set([
    'historie/norgeshistorie/22-juli-2011',
    'historie/midtoesten/krigen-mot-terror',
    'samfunnskunnskap/styringsformer/km-8-terror-folkemord',
]);

function zoneFor(subjectId, topicId, year) {
    for (const zone of ZONE_RULES) {
        if (zone.topics.includes(topicId)) return zone;
    }
    // Historie sorteres på årstall når emnet ikke er en tydelig epoke.
    if (subjectId === 'historie' && year !== null) return zoneByYear(year);
    for (const zone of ZONE_RULES) {
        if (zone.subjects.includes(subjectId)) return zone;
    }
    return FALLBACK_ZONE;
}

function* walkJsonFiles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            yield* walkJsonFiles(full);
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            yield full;
        }
    }
}

// Bygger { 'subject/topic/lesson': { title, link } } fra manifestet, så hvert
// spørsmål kan peke tilbake til leksjonen det kom fra.
function loadLessonIndex() {
    const index = new Map();
    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    } catch {
        return index;
    }
    for (const subject of manifest.subjects ?? []) {
        for (const topic of subject.topics ?? []) {
            const visit = (lessons, prefix) => {
                for (const lesson of lessons ?? []) {
                    if (lesson.lessons) visit(lesson.lessons, `${prefix}/${lesson.id}`);
                    index.set(`${prefix}/${lesson.id}`, {
                        lessonTitle: lesson.title ?? lesson.id,
                        topicTitle: topic.title ?? topic.id,
                        subjectTitle: subject.title ?? subject.id,
                    });
                }
            };
            visit(topic.lessons, `${subject.id}/${topic.id}`);
        }
    }
    return index;
}

// Et brukbart spørsmål har minst to svaralternativer og en gyldig fasit.
// Innholdet bruker to formater om hverandre: `correctAnswer` som indeks, og
// `answer` som selve svarteksten. Begge må støttes - halve banken forsvinner
// ellers.
function normalizeQuestion(raw, source) {
    if (!raw || typeof raw.question !== 'string') return null;
    const options = Array.isArray(raw.options) ? raw.options.filter((o) => typeof o === 'string') : [];
    if (options.length < 2) return null;

    let correct = -1;
    if (typeof raw.correctAnswer === 'number') {
        correct = raw.correctAnswer;
    } else if (typeof raw.correctAnswer === 'string') {
        correct = options.indexOf(raw.correctAnswer);
    } else if (typeof raw.answer === 'string') {
        correct = options.indexOf(raw.answer);
    } else if (typeof raw.answer === 'number') {
        correct = raw.answer;
    }
    if (correct < 0 || correct >= options.length) return null;
    return {
        id: `${source.activityId}#${source.index}`,
        question: raw.question.trim(),
        options,
        correct,
        explanation: typeof raw.explanation === 'string' ? raw.explanation.trim() : '',
        subjectId: source.subjectId,
        topicId: source.topicId,
        lessonId: source.lessonId,
        lessonTitle: source.lessonTitle,
        link: `/${source.activityId}`,
    };
}

export function generate() {
    const lessonIndex = loadLessonIndex();
    const zones = new Map();
    for (const zone of ZONE_RULES) {
        zones.set(zone.id, { id: zone.id, title: zone.title, era: zone.era, questions: [] });
    }

    let files = 0;
    let skipped = 0;
    let excluded = 0;

    for (const filePath of walkJsonFiles(CONTENT_DIR)) {
        const relative = path.relative(CONTENT_DIR, filePath).replace(/\\/g, '/');
        const parts = relative.replace(/\.json$/, '').split('/');
        if (parts.length < 2) continue;

        let doc;
        try {
            doc = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch {
            skipped += 1;
            continue;
        }
        if (!doc || !Array.isArray(doc.content)) continue;

        const subjectId = parts[0];
        const lessonId = parts[parts.length - 1];
        const topicId = parts.length >= 3 ? parts[1] : lessonId;
        const activityId = parts.join('/');
        if (EXCLUDED_LESSONS.has(activityId)) {
            excluded += 1;
            continue;
        }
        const meta = lessonIndex.get(activityId);
        const zone = zoneFor(subjectId, topicId, parseYear(doc.year ?? doc.date));
        const bucket = zones.get(zone.id);
        if (!bucket) continue;

        let found = 0;
        for (const block of doc.content) {
            if (!block || block.type !== 'component' || block.name !== 'Quiz') continue;
            const questions = block.props?.questions;
            if (!Array.isArray(questions)) continue;
            questions.forEach((raw, index) => {
                const q = normalizeQuestion(raw, {
                    activityId,
                    index: found + index,
                    subjectId,
                    topicId,
                    lessonId,
                    lessonTitle: meta?.lessonTitle ?? doc.title ?? lessonId,
                });
                if (q) bucket.questions.push(q);
            });
            found += questions.length;
        }
        if (found > 0) files += 1;
    }

    const bank = {
        generatedFrom: 'public/content/**/*.json (Quiz-komponenter)',
        zones: [...zones.values()].filter((z) => z.questions.length > 0),
    };
    const total = bank.zones.reduce((sum, z) => sum + z.questions.length, 0);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const tmpPath = `${OUTPUT_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(bank) + '\n');
    fs.renameSync(tmpPath, OUTPUT_PATH);

    const summary = bank.zones.map((z) => `${z.id}=${z.questions.length}`).join(' ');
    console.log(
        `[quest-bank] ${total} spørsmål fra ${files} filer ` +
            `(ulesbare=${skipped}, holdt utenfor=${excluded}) → ` +
            `${path.relative(process.cwd(), OUTPUT_PATH)}\n[quest-bank] ${summary}`
    );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    generate();
}
