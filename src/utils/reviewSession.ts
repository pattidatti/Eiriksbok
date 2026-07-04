// Ren øktbygger for «Dagens økt». Gitt samme input og samme dag returnerer
// den alltid nøyaktig samme øvelser i samme rekkefølge (seeded PRNG).

import type { ConceptItem } from '../hooks/useConcepts';
import type { HistoryItem } from '../hooks/useUserHistory';
import type { GlobalTimelineEvent } from '../types';
import type { ExerciseKind, OrderOption, ReviewItem, SessionExercise } from '../types/review';
import { djb2Hash, mulberry32, shuffleWith, slugifyTerm } from './reviewScheduler';

export const SESSION_MIN = 8;
export const SESSION_MAX = 10;
const MAX_PER_TYPE = 6;

// Bildekilder for bilde-oppgaver - bygges av siden fra manifest + tidslinjebilder.
// Valgfri: uten assets bygges økta uten bilde-varianter (samme som før).
export interface SessionAssets {
    lessonImageByLessonId: Map<string, string>;
    topicImageByTopicId: Map<string, string>;
    timelineImageByEventId: Record<string, string>;
}

// Dramaturgi: oppvarming (flashcard) -> kjerne -> tyngste oppgaver til slutt
const KIND_WEIGHT: Record<ExerciseKind, number> = {
    flashcard: 0,
    mcq: 1,
    'image-mcq': 1,
    'match-pairs': 2,
    'year-pick': 2,
    'timeline-order': 3,
};

const formatYear = (year: number): string => (year < 0 ? `${-year} f.Kr.` : `${year}`);

// Lag et ferskt (ennå ulagret) item - siden legger det i store når det besvares
const virtualItem = (partial: Pick<ReviewItem, 'id' | 'type' | 'term' | 'eventId'>): ReviewItem => ({
    ...partial,
    box: 1,
    dueDate: '',
    lapses: 0,
    reps: 0,
    addedAt: 0,
    lastReviewedAt: null,
});

// Finn et bilde for begrepet: leksjonens hero-bilde, ellers temabildet
const resolveConceptImage = (
    concept: ConceptItem,
    assets: SessionAssets | undefined
): string | undefined => {
    if (!assets) return undefined;
    if (concept.lessonId) {
        const lessonImage = assets.lessonImageByLessonId.get(concept.lessonId);
        if (lessonImage) return lessonImage;
    }
    if (concept.topicId) {
        return assets.topicImageByTopicId.get(concept.topicId);
    }
    return undefined;
};

const buildConceptExercise = (
    item: ReviewItem,
    concept: ConceptItem,
    pool: ConceptItem[],
    today: string,
    assets?: SessionAssets
): SessionExercise => {
    const rng = mulberry32(djb2Hash(today + item.id));
    const sourceLink =
        concept.lessonId && concept.subjectId && concept.topicId
            ? `/${concept.subjectId}/${concept.topicId}/${concept.lessonId}`
            : undefined;
    const base = {
        item,
        sourceLink,
        subjectId: concept.subjectId,
        topicId: concept.topicId,
    };

    const lowerTerm = concept.term.toLowerCase();
    const sameSubject = pool.filter(
        (c) =>
            c.term.toLowerCase() !== lowerTerm &&
            !!concept.subjectId &&
            c.subjectId === concept.subjectId
    );
    const anyOther = pool.filter((c) => c.term.toLowerCase() !== lowerTerm);

    // Variasjonsrotasjon per item: flervalg -> flashcard -> koble par.
    // Første møte (reps 0) trekkes tilfeldig (seeded) så også en fersk økt
    // får blanding - ellers ville dag én vært bare flervalg.
    const variant = item.reps === 0 ? Math.floor(rng() * 3) : item.reps % 3;

    if (variant === 2) {
        // Koble par: begrepet + 2 distraktorer fra samme fag (unike termer)
        const candidates = sameSubject.length >= 2 ? sameSubject : anyOther;
        const uniqueByTerm = new Map<string, ConceptItem>();
        for (const c of candidates) {
            const key = c.term.toLowerCase();
            if (!uniqueByTerm.has(key)) uniqueByTerm.set(key, c);
        }
        const distractors = shuffleWith(Array.from(uniqueByTerm.values()), rng).slice(0, 2);
        if (distractors.length === 2) {
            const pairs = shuffleWith(
                [concept, ...distractors].map((c) => ({ term: c.term, definition: c.definition })),
                rng
            );
            return {
                ...base,
                kind: 'match-pairs',
                prompt: 'Koble hvert begrep til riktig forklaring',
                pairs,
                shuffledDefinitions: shuffleWith(
                    pairs.map((p) => p.definition),
                    rng
                ),
            };
        }
        // For få par - fall igjennom til flashcard
    } else if (variant === 0) {
        const candidates = sameSubject.length >= 3 ? sameSubject : anyOther;
        const distractorTerms = Array.from(new Set(candidates.map((c) => c.term)));
        if (distractorTerms.length >= 3) {
            const distractors = shuffleWith(distractorTerms, rng).slice(0, 3);
            const options = shuffleWith([concept.term, ...distractors], rng);
            const imageSrc = resolveConceptImage(concept, assets);
            // Med bilde tilgjengelig: ca. 40 % av flervalgene blir bildeoppgaver
            if (imageSrc && rng() < 0.4) {
                return {
                    ...base,
                    kind: 'image-mcq',
                    prompt: 'Hvilket begrep hører bildet til?',
                    imageSrc,
                    options,
                    answer: concept.term,
                };
            }
            return {
                ...base,
                kind: 'mcq',
                prompt: concept.definition,
                options,
                answer: concept.term,
            };
        }
    }
    return {
        ...base,
        kind: 'flashcard',
        prompt: concept.term,
        definition: concept.definition,
    };
};

const buildTimelineExercise = (
    item: ReviewItem,
    event: GlobalTimelineEvent,
    allEvents: GlobalTimelineEvent[],
    today: string,
    assets?: SessionAssets
): SessionExercise | null => {
    const rng = mulberry32(djb2Hash(today + item.id));

    // Annenhver repetisjon: tidslinje-sortering i stedet for årstall-valg
    if (item.reps % 2 === 1) {
        const ordered = buildTimelineOrderExercise(item, event, allEvents, rng);
        if (ordered) return ordered;
    }

    const correct = formatYear(event.startDate);
    const distractorYears = Array.from(
        new Set(
            allEvents
                .filter((e) => e.id !== event.id && typeof e.startDate === 'number')
                .map((e) => formatYear(e.startDate))
        )
    ).filter((y) => y !== correct);
    if (distractorYears.length < 3) return null;
    const distractors = shuffleWith(distractorYears, rng).slice(0, 3);
    // Årstall sorteres stigende - det gjør oppgaven lesbar uten å røpe svaret
    const options = [correct, ...distractors].sort((a, b) => {
        const parse = (s: string) => (s.endsWith('f.Kr.') ? -parseInt(s) : parseInt(s));
        return parse(a) - parse(b);
    });
    return {
        item,
        kind: 'year-pick',
        prompt: event.title,
        options,
        answer: correct,
        sourceLink: event.link,
        imageSrc: assets?.timelineImageByEventId[event.id],
        subjectId: event.subjectId,
        topicId: event.topicId,
    };
};

// Tidslinje-sortering: eventet + 2 naboer i tid med distinkte årstall
const buildTimelineOrderExercise = (
    item: ReviewItem,
    event: GlobalTimelineEvent,
    allEvents: GlobalTimelineEvent[],
    rng: () => number
): SessionExercise | null => {
    const valid = allEvents.filter(
        (e) =>
            e.id !== event.id &&
            typeof e.startDate === 'number' &&
            e.startDate !== event.startDate &&
            e.title !== event.title
    );
    const sameSubject = valid.filter((e) => e.subjectId === event.subjectId);
    const pool = sameSubject.length >= 2 ? sameSubject : valid;
    // Nære hendelser i tid gir en reell utfordring - fjerne er gratispoeng
    const nearest = [...pool]
        .sort(
            (a, b) =>
                Math.abs(a.startDate - event.startDate) - Math.abs(b.startDate - event.startDate)
        )
        .slice(0, 6);
    const distractors: GlobalTimelineEvent[] = [];
    for (const e of shuffleWith(nearest, rng)) {
        if (distractors.length >= 2) break;
        if (distractors.some((d) => d.startDate === e.startDate)) continue;
        distractors.push(e);
    }
    if (distractors.length < 2) return null;

    let shuffled = shuffleWith([event, ...distractors], rng);
    // Ferdig sortert rekkefølge røper svaret - roter deterministisk
    const isSorted = shuffled.every((e, i) => i === 0 || shuffled[i - 1].startDate <= e.startDate);
    if (isSorted) shuffled = [shuffled[1], shuffled[2], shuffled[0]];

    const orderOptions: OrderOption[] = shuffled.map((e) => ({
        id: e.id,
        title: e.title,
        year: e.startDate,
        displayDate: e.displayDate || formatYear(e.startDate),
    }));
    return {
        item,
        kind: 'timeline-order',
        prompt: 'Dra hendelsene i riktig rekkefølge - eldst øverst',
        orderOptions,
        sourceLink: event.link,
        subjectId: event.subjectId,
        topicId: event.topicId,
    };
};

export const buildSession = (
    storeItems: Record<string, ReviewItem>,
    allConcepts: ConceptItem[],
    timelineEvents: GlobalTimelineEvent[],
    readingHistory: HistoryItem[],
    today: string,
    assets?: SessionAssets
): SessionExercise[] => {
    // Datavask: enkelte kilder (manifest-definisjoner, concepts.json) kan ha
    // hull - uten term/definisjon kan begrepet verken vises eller matches
    const concepts = allConcepts.filter((c) => !!c.term && !!c.definition);
    const conceptByTerm = new Map<string, ConceptItem>();
    for (const c of concepts) {
        const key = c.term.toLowerCase();
        if (!conceptByTerm.has(key)) conceptByTerm.set(key, c);
    }
    const eventById = new Map(timelineEvents.map((e) => [e.id, e]));

    // 1. Resolvbare items: uresolvbare hoppes over (slettes ikke - de kan
    //    resolve senere når concepts.json vokser)
    const resolvable = Object.values(storeItems).filter((item) => {
        if (item.type === 'concept') return !!item.term && conceptByTerm.has(item.term.toLowerCase());
        if (item.type === 'timeline') return !!item.eventId && eventById.has(item.eventId);
        return !!item.quiz;
    });

    // 2. Due-liste, deterministisk sortert
    const byPriority = (a: ReviewItem, b: ReviewItem) => {
        if (a.box !== b.box) return a.box - b.box;
        if (a.dueDate !== b.dueDate) return a.dueDate < b.dueDate ? -1 : 1;
        return a.id < b.id ? -1 : 1;
    };
    const due = resolvable.filter((i) => i.dueDate <= today).sort(byPriority);
    const notDue = resolvable.filter((i) => i.dueDate > today).sort(byPriority);

    // 3. Ta opptil 10, maks 6 av én type
    const picked: ReviewItem[] = [];
    const typeCount: Record<string, number> = {};
    const tryPick = (item: ReviewItem) => {
        if (picked.length >= SESSION_MAX) return;
        if ((typeCount[item.type] ?? 0) >= MAX_PER_TYPE) return;
        picked.push(item);
        typeCount[item.type] = (typeCount[item.type] ?? 0) + 1;
    };
    due.forEach(tryPick);

    // 4a. Under minimum? Fyll med nesten-due items
    if (picked.length < SESSION_MIN) {
        notDue.forEach(tryPick);
    }

    // 4b. Fortsatt under? Seed nye begreper fra fagene eleven har lest om
    if (picked.length < SESSION_MIN) {
        const usedIds = new Set([
            ...Object.keys(storeItems),
            ...picked.map((i) => i.id),
        ]);
        const historySubjects = Array.from(
            new Set(readingHistory.map((h) => h.subjectId).filter(Boolean))
        );
        const seedRng = mulberry32(djb2Hash(today + ':seed'));
        let candidates: ConceptItem[];
        if (historySubjects.length > 0) {
            const fromHistory = concepts.filter(
                (c) => c.subjectId && historySubjects.includes(c.subjectId)
            );
            candidates = shuffleWith(fromHistory.length > 0 ? fromHistory : concepts, seedRng);
        } else {
            // Tom historikk: round-robin ett begrep per fag, sortert på id
            const bySubject = new Map<string, ConceptItem[]>();
            for (const c of [...concepts].sort((a, b) => (a.id < b.id ? -1 : 1))) {
                const key = c.subjectId ?? 'ukjent';
                const list = bySubject.get(key) ?? [];
                list.push(c);
                bySubject.set(key, list);
            }
            candidates = interleaveConcepts(bySubject);
        }
        for (const concept of candidates) {
            if (picked.length >= SESSION_MIN) break;
            const id = `concept:${slugifyTerm(concept.term)}`;
            if (usedIds.has(id)) continue;
            usedIds.add(id);
            picked.push(virtualItem({ id, type: 'concept', term: concept.term }));
        }
    }

    // 5. Fortsatt under? 1-2 årstall-oppgaver fra tidslinjen som filler
    if (picked.length < SESSION_MIN && timelineEvents.length >= 4) {
        const usedIds = new Set(picked.map((i) => i.id));
        const historySubjects = new Set(readingHistory.map((h) => h.subjectId).filter(Boolean));
        const preferred = timelineEvents.filter(
            (e) => historySubjects.size === 0 || historySubjects.has(e.subjectId)
        );
        const fillRng = mulberry32(djb2Hash(today + ':timeline'));
        const pool = shuffleWith(preferred.length >= 4 ? preferred : timelineEvents, fillRng);
        for (const event of pool) {
            if (picked.length >= SESSION_MIN) break;
            const id = `timeline:${event.id}`;
            if (usedIds.has(id) || storeItems[id]) continue;
            usedIds.add(id);
            picked.push(virtualItem({ id, type: 'timeline', eventId: event.id }));
        }
    }

    // 6. Bygg øvelser med deterministiske alternativer
    const exercises: SessionExercise[] = [];
    for (const item of picked) {
        if (item.type === 'concept') {
            const concept = conceptByTerm.get(item.term!.toLowerCase());
            if (concept)
                exercises.push(buildConceptExercise(item, concept, concepts, today, assets));
        } else if (item.type === 'quiz') {
            const rng = mulberry32(djb2Hash(today + item.id));
            exercises.push({
                item,
                kind: 'mcq',
                prompt: item.quiz!.question,
                options: shuffleWith(item.quiz!.options, rng),
                answer: item.quiz!.answer,
                sourceLink: item.quiz!.sourceUrl,
            });
        } else if (item.type === 'timeline') {
            const event = eventById.get(item.eventId!);
            if (event) {
                const exercise = buildTimelineExercise(item, event, timelineEvents, today, assets);
                if (exercise) exercises.push(exercise);
            }
        }
    }

    // 7. Dramaturgi: oppvarming -> kjerne -> tyngst. Seeded shuffle som
    //    tie-break gir variasjon innenfor hvert nivå (stabil sort bevarer den).
    const orderRng = mulberry32(djb2Hash(today + ':order'));
    return shuffleWith(exercises, orderRng).sort(
        (a, b) => KIND_WEIGHT[a.kind] - KIND_WEIGHT[b.kind]
    );
};

// Round-robin over fag: ett begrep fra hvert fag om gangen
const interleaveConcepts = (bySubject: Map<string, ConceptItem[]>): ConceptItem[] => {
    const keys = Array.from(bySubject.keys()).sort();
    const out: ConceptItem[] = [];
    let added = true;
    while (added) {
        added = false;
        for (const key of keys) {
            const next = bySubject.get(key)!.shift();
            if (next) {
                out.push(next);
                added = true;
            }
        }
    }
    return out;
};
