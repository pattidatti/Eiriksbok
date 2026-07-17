// Interessemodell for anbefalingsmotoren. Bygger en vektet interesse-profil ut
// fra taggene på det eleven faktisk har engasjert seg i - både fullførte
// artikler/quizer og artikler hen bare har åpnet av nysgjerrighet - og scorer
// nye artikler etter hvor godt taggene deres treffer profilen. Rene funksjoner,
// ingen React, injisert `now` (fullt testbar).
//
// Datavirkelighet: tags ligger på leksjoner, ikke på emner, så både profilen og
// «oppdag»-kandidatene er leksjonsbaserte.

import type { Manifest } from '../../../types';
import type { HistoryItem } from '../../../hooks/useUserHistory';
import type { ActivityEvent } from '../types';

// Layout-typer som ikke er «ekte» artikler (stier/verktøy). Holdes i synk med
// samme filter i mastery.ts og history.ts.
const NON_ARTICLE_LAYOUTS = new Set(['tool', 'learning-path', 'learning-path-v2']);
const isArticleLayout = (layout?: string): boolean =>
    !layout || !NON_ARTICLE_LAYOUTS.has(layout);

export interface LessonEntry {
    // 'subjectId/topicId[/subTopicId]/lessonId' - samme form som halen i
    // firstCompletions-nøkkelen (article-read:{path}) og i ActivityEvent.activityId.
    path: string;
    subjectId: string;
    topicId: string;
    subTopicId?: string;
    title: string;
    tags: string[];
    image?: string;
}

export interface LessonTagIndex {
    // Oppslag på sti - brukes til å finne taggene til noe eleven har engasjert seg i.
    byPath: Map<string, LessonEntry>;
    // Alle artikkel-leksjoner - itereres når vi leter etter «oppdag»-kandidater.
    all: LessonEntry[];
    // Invers dokumentfrekvens per tag: log(totalt / antall med taggen). Demper
    // altfor vanlige tags (som «historie») så de ikke drukner de spesifikke.
    idf: Record<string, number>;
}

// Går gjennom manifestet én gang og bygger et flatt indeks over alle
// artikkel-leksjoner + idf per tag. Memoiseres på manifest i hooken.
export const buildLessonTagIndex = (manifest: Manifest): LessonTagIndex => {
    const byPath = new Map<string, LessonEntry>();
    const all: LessonEntry[] = [];
    const docFreq: Record<string, number> = {};

    const addLesson = (entry: LessonEntry) => {
        byPath.set(entry.path, entry);
        all.push(entry);
        // Unike tags per leksjon teller én gang mot dokumentfrekvensen.
        for (const tag of new Set(entry.tags)) {
            docFreq[tag] = (docFreq[tag] ?? 0) + 1;
        }
    };

    for (const subject of manifest.subjects) {
        for (const topic of subject.topics) {
            for (const lesson of topic.lessons ?? []) {
                if (!isArticleLayout(lesson.layout)) continue;
                addLesson({
                    path: `${subject.id}/${topic.id}/${lesson.id}`,
                    subjectId: subject.id,
                    topicId: topic.id,
                    title: lesson.title,
                    tags: lesson.tags ?? [],
                    image: lesson.image ?? topic.image,
                });
            }
            for (const sub of topic.subTopics ?? []) {
                for (const lesson of sub.lessons) {
                    if (!isArticleLayout(lesson.layout)) continue;
                    addLesson({
                        path: `${subject.id}/${topic.id}/${sub.id}/${lesson.id}`,
                        subjectId: subject.id,
                        topicId: topic.id,
                        subTopicId: sub.id,
                        title: lesson.title,
                        tags: lesson.tags ?? [],
                        image: lesson.image ?? sub.image ?? topic.image,
                    });
                }
            }
        }
    }

    const total = all.length || 1;
    const idf: Record<string, number> = {};
    for (const [tag, freq] of Object.entries(docFreq)) {
        // +1 så en tag som finnes på alt fortsatt får en liten positiv vekt.
        idf[tag] = Math.log(total / freq) + 0.1;
    }

    return { byPath, all, idf };
};

export interface InterestProfile {
    // Rå akkumulert engasjements-vekt per tag (uten idf; idf påføres i scoringen).
    tags: Record<string, number>;
    // Engasjements-vekt per fag - gir et lite «hjemmebane»-tillegg i scoringen.
    subjects: Record<string, number>;
    // L2-norm av tag-vektoren (for cosinus-lignende likhet).
    magnitude: number;
    // Tags sortert etter vekt, synkende - brukes til begrunnelsen på kortet.
    topTags: string[];
}

export interface InterestInput {
    index: LessonTagIndex;
    firstCompletions: Record<string, number>;
    events: ActivityEvent[];
    history: HistoryItem[];
    now: number;
}

const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000; // 14 dager

// Nyere engasjement veier tyngre: halvparten så mye etter 14 dager.
const recencyWeight = (ts: number, now: number): number =>
    Math.pow(0.5, Math.max(0, now - ts) / HALF_LIFE_MS);

// Rekonstruer leksjonsstien til et history-element (samme form som byPath-nøkkelen).
const historyPath = (item: HistoryItem): string | null => {
    if (item.type !== 'lesson' || !item.topicId) return null;
    return `${item.subjectId}/${item.topicId}${item.subTopicId ? `/${item.subTopicId}` : ''}/${item.id}`;
};

// Bygger interesse-profilen. Tre kilder, fallende vekt:
//   fullført artikkel (1.0) > fullført quiz (0.8·resultat) > kun åpnet (0.4).
// Hvert element fordeler vekten sin jevnt utover taggene sine, så en leksjon
// med ti tags ikke overdøver en med to.
export const buildInterestProfile = (input: InterestInput): InterestProfile => {
    const { index, firstCompletions, events, history, now } = input;
    const tags: Record<string, number> = {};
    const subjects: Record<string, number> = {};

    const addTags = (entry: LessonEntry | undefined, w: number) => {
        if (!entry) return;
        subjects[entry.subjectId] = (subjects[entry.subjectId] ?? 0) + w;
        if (entry.tags.length === 0) return;
        const per = w / entry.tags.length;
        for (const tag of entry.tags) {
            tags[tag] = (tags[tag] ?? 0) + per;
        }
    };

    // 1. Fullførte artikler (sterkeste signal). firstCompletions-verdien er
    //    tidsstempelet for første fullføring (epoch ms).
    for (const [key, ts] of Object.entries(firstCompletions)) {
        if (!key.startsWith('article-read:')) continue;
        const path = key.slice('article-read:'.length);
        addTags(index.byPath.get(path), 1.0 * recencyWeight(ts, now));
    }

    // 2. Fullførte quizer (gode resultat = ekte interesse for emnet) og
    //    sti-fullføringer (bare fag-signal, ingen tags på activityId).
    for (const e of events) {
        if (e.kind === 'quiz-completed') {
            const w = 0.8 * (0.5 + 0.5 * (e.score ?? 0.5)) * recencyWeight(e.at, now);
            addTags(index.byPath.get(e.activityId), w);
        } else if (e.kind === 'path-completed' || e.kind === 'path-step-completed') {
            if (e.subjectId) {
                subjects[e.subjectId] =
                    (subjects[e.subjectId] ?? 0) + 0.6 * recencyWeight(e.at, now);
            }
        }
    }

    // 3. Åpnet, men ikke fullført - ren nysgjerrighet. Hopp over det som alt er
    //    fullført (talt i steg 1).
    for (const item of history) {
        const path = historyPath(item);
        if (!path) continue;
        if (firstCompletions[`article-read:${path}`]) continue;
        addTags(index.byPath.get(path), 0.4 * recencyWeight(item.timestamp, now));
    }

    const magnitude = Math.sqrt(
        Object.values(tags).reduce((sum, v) => sum + v * v, 0)
    );
    const topTags = Object.entries(tags)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag);

    return { tags, subjects, magnitude, topTags };
};

// Under denne massen er profilen for tynn til å score «oppdag»-kort på en
// meningsfull måte (velkomstlista/sekvens-kortene dekker den nye eleven).
export const MIN_PROFILE_MASS = 0.2;

// Cosinus-lignende likhet i [0, 1] mellom profilen og en leksjons tags, med
// idf-demping av vanlige tags. Et lite fag-tillegg holder treffene relevante
// uten å blokkere overraskelser på tvers av fag.
export const scoreLessonInterest = (
    profile: InterestProfile,
    entry: LessonEntry,
    idf: Record<string, number>
): number => {
    if (profile.magnitude === 0 || entry.tags.length === 0) return 0;
    let raw = 0;
    for (const tag of entry.tags) {
        const w = profile.tags[tag];
        if (w) raw += w * (idf[tag] ?? 1);
    }
    if (raw === 0) return 0;
    const cos = raw / (Math.sqrt(entry.tags.length) * profile.magnitude);
    const subjectBonus = (profile.subjects[entry.subjectId] ?? 0) > 0 ? 0.05 : 0;
    return Math.min(1, cos + subjectBonus);
};
