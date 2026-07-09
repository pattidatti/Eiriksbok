// Bygger SessionExercise-objekter for Kunnskapsløypa fra eksisterende
// innholdsbanker (quiz-spørsmål, begreper, tidslinjehendelser), slik at
// Exercise*-komponentene fra «Dagens økt» kan rendres uendret. Distraktor-
// logikken følger utils/reviewSession.ts.

import type { ConceptItem } from '../../../hooks/useConcepts';
import type { GlobalTimelineEvent } from '../../../types';
import type { OrderOption, ReviewItem, SessionExercise } from '../../../types/review';
import { shuffleWith } from '../../../utils/reviewScheduler';
import type { ChallengeKind, SubjectChoice } from './types';

export interface LoypeQuizQuestion {
    id: string;
    question: string;
    options: string[];
    answer: string;
    sourceUrl?: string;
    subjectId: string;
    topicId?: string;
}

export interface RunContent {
    quiz: LoypeQuizQuestion[];
    concepts: ConceptItem[];
    events: GlobalTimelineEvent[];
}

// Ferskt (ulagret) item - Exercise-komponentene krever feltet, men løypa
// skriver aldri til repetisjonskøen. Samme triks som reviewSession.ts.
const virtualItem = (
    id: string,
    type: ReviewItem['type'],
    extra?: Pick<ReviewItem, 'term' | 'eventId'>
): ReviewItem => ({
    id,
    type,
    box: 1,
    dueDate: '',
    lapses: 0,
    reps: 0,
    addedAt: 0,
    lastReviewedAt: null,
    ...extra,
});

const formatYear = (year: number): string => (year < 0 ? `${-year} f.Kr.` : `${year}`);

export const filterConcepts = (concepts: ConceptItem[], subject: SubjectChoice): ConceptItem[] => {
    const valid = concepts.filter((c) => !!c.term && !!c.definition);
    if (subject === 'blandet') return valid;
    return valid.filter((c) => c.subjectId === subject);
};

export const filterEvents = (
    events: GlobalTimelineEvent[],
    subject: SubjectChoice
): GlobalTimelineEvent[] => {
    const valid = events.filter((e) => typeof e.startDate === 'number' && !!e.title);
    if (subject === 'blandet') return valid;
    return valid.filter((e) => e.subjectId === subject);
};

// Pool-guards: en utfordringstype tilbys bare når banken er stor nok til å
// gi reelle distraktorer. Ellers faller vi tilbake til quiz.
export const availableKinds = (content: RunContent): ChallengeKind[] => {
    const kinds: ChallengeKind[] = [];
    if (content.quiz.length >= 5) kinds.push('quiz');
    if (content.concepts.length >= 4) kinds.push('concept-mcq');
    if (content.concepts.length >= 8) kinds.push('concept-match');
    const distinctYears = new Set(content.events.map((e) => e.startDate)).size;
    if (distinctYears >= 12) kinds.push('chrono');
    return kinds;
};

const KIND_WEIGHT: Record<ChallengeKind, number> = {
    quiz: 4,
    'concept-mcq': 3,
    chrono: 3,
    'concept-match': 2,
};

export const pickKind = (kinds: ChallengeKind[], rng: () => number): ChallengeKind => {
    if (kinds.length === 0) return 'quiz';
    const total = kinds.reduce((sum, k) => sum + KIND_WEIGHT[k], 0);
    let roll = rng() * total;
    for (const kind of kinds) {
        roll -= KIND_WEIGHT[kind];
        if (roll <= 0) return kind;
    }
    return kinds[kinds.length - 1];
};

const pickUnused = <T extends { id: string }>(
    pool: T[],
    used: Set<string>,
    rng: () => number
): T | null => {
    const fresh = pool.filter((item) => !used.has(item.id));
    const source = fresh.length > 0 ? fresh : pool; // tomt for ferske - resirkuler
    if (source.length === 0) return null;
    const picked = source[Math.floor(rng() * source.length)];
    used.add(picked.id);
    return picked;
};

const buildQuizExercise = (
    content: RunContent,
    rng: () => number,
    used: Set<string>
): SessionExercise | null => {
    const q = pickUnused(content.quiz, used, rng);
    if (!q) return null;
    return {
        item: virtualItem(q.id, 'quiz'),
        kind: 'mcq',
        prompt: q.question,
        options: shuffleWith(q.options, rng),
        answer: q.answer,
        sourceLink: q.sourceUrl,
        subjectId: q.subjectId,
        topicId: q.topicId,
    };
};

const buildConceptMcq = (
    content: RunContent,
    rng: () => number,
    used: Set<string>
): SessionExercise | null => {
    const concept = pickUnused(content.concepts, used, rng);
    if (!concept) return null;
    const lowerTerm = concept.term.toLowerCase();
    const sameSubject = content.concepts.filter(
        (c) => c.term.toLowerCase() !== lowerTerm && !!concept.subjectId && c.subjectId === concept.subjectId
    );
    const anyOther = content.concepts.filter((c) => c.term.toLowerCase() !== lowerTerm);
    const candidates = sameSubject.length >= 3 ? sameSubject : anyOther;
    const distractorTerms = Array.from(new Set(candidates.map((c) => c.term)));
    if (distractorTerms.length < 3) return null;
    const distractors = shuffleWith(distractorTerms, rng).slice(0, 3);
    const sourceLink =
        concept.lessonId && concept.subjectId && concept.topicId
            ? `/${concept.subjectId}/${concept.topicId}/${concept.lessonId}`
            : undefined;
    return {
        item: virtualItem(`concept:${lowerTerm}`, 'concept', { term: concept.term }),
        kind: 'mcq',
        prompt: concept.definition,
        options: shuffleWith([concept.term, ...distractors], rng),
        answer: concept.term,
        sourceLink,
        subjectId: concept.subjectId,
        topicId: concept.topicId,
    };
};

const buildConceptMatch = (
    content: RunContent,
    rng: () => number,
    used: Set<string>
): SessionExercise | null => {
    const concept = pickUnused(content.concepts, used, rng);
    if (!concept) return null;
    const lowerTerm = concept.term.toLowerCase();
    const sameSubject = content.concepts.filter(
        (c) => c.term.toLowerCase() !== lowerTerm && !!concept.subjectId && c.subjectId === concept.subjectId
    );
    const anyOther = content.concepts.filter((c) => c.term.toLowerCase() !== lowerTerm);
    const candidates = sameSubject.length >= 2 ? sameSubject : anyOther;
    // Distraktorene må være unike på både term OG forklaring - to par med
    // identisk forklaring gjør kortet uløselig (se reviewSession.ts)
    const uniqueByTerm = new Map<string, ConceptItem>();
    const seenDefs = new Set<string>([concept.definition.trim().toLowerCase()]);
    for (const c of candidates) {
        const termKey = c.term.toLowerCase();
        const defKey = c.definition.trim().toLowerCase();
        if (uniqueByTerm.has(termKey) || seenDefs.has(defKey)) continue;
        uniqueByTerm.set(termKey, c);
        seenDefs.add(defKey);
    }
    const distractors = shuffleWith(Array.from(uniqueByTerm.values()), rng).slice(0, 2);
    if (distractors.length < 2) return null;
    const pairs = shuffleWith(
        [concept, ...distractors].map((c) => ({ term: c.term, definition: c.definition })),
        rng
    );
    return {
        item: virtualItem(`concept:${lowerTerm}`, 'concept', { term: concept.term }),
        kind: 'match-pairs',
        prompt: 'Koble hvert begrep til riktig forklaring',
        pairs,
        shuffledDefinitions: shuffleWith(
            pairs.map((p) => p.definition),
            rng
        ),
        subjectId: concept.subjectId,
        topicId: concept.topicId,
    };
};

const buildChronoExercise = (
    content: RunContent,
    rng: () => number,
    used: Set<string>,
    count: number
): SessionExercise | null => {
    const event = pickUnused(content.events, used, rng);
    if (!event) return null;
    const valid = content.events.filter(
        (e) => e.id !== event.id && e.startDate !== event.startDate && e.title !== event.title
    );
    // Nære hendelser i tid gir en reell utfordring - fjerne er gratispoeng
    const nearest = [...valid]
        .sort(
            (a, b) =>
                Math.abs(a.startDate - event.startDate) - Math.abs(b.startDate - event.startDate)
        )
        .slice(0, 8);
    const distractors: GlobalTimelineEvent[] = [];
    for (const e of shuffleWith(nearest, rng)) {
        if (distractors.length >= count - 1) break;
        if (distractors.some((d) => d.startDate === e.startDate)) continue;
        distractors.push(e);
    }
    if (distractors.length < 2) return null;

    let shuffled = shuffleWith([event, ...distractors], rng);
    // Ferdig sortert rekkefølge røper svaret - roter deterministisk
    const isSorted = shuffled.every((e, i) => i === 0 || shuffled[i - 1].startDate <= e.startDate);
    if (isSorted) shuffled = [...shuffled.slice(1), shuffled[0]];

    const orderOptions: OrderOption[] = shuffled.map((e) => ({
        id: e.id,
        title: e.title,
        year: e.startDate,
        displayDate: e.displayDate || formatYear(e.startDate),
    }));
    return {
        item: virtualItem(`timeline:${event.id}`, 'timeline', { eventId: event.id }),
        kind: 'timeline-order',
        prompt: 'Dra hendelsene i riktig rekkefølge - eldst øverst',
        orderOptions,
        sourceLink: event.link,
        subjectId: event.subjectId,
        topicId: event.topicId,
    };
};

// Bygg én utfordring av ønsket type, med quiz som siste skanse
export const buildExercise = (
    kind: ChallengeKind,
    content: RunContent,
    rng: () => number,
    used: Set<string>,
    chronoCount: number
): SessionExercise | null => {
    const byKind: Record<ChallengeKind, () => SessionExercise | null> = {
        quiz: () => buildQuizExercise(content, rng, used),
        'concept-mcq': () => buildConceptMcq(content, rng, used),
        'concept-match': () => buildConceptMatch(content, rng, used),
        chrono: () => buildChronoExercise(content, rng, used, chronoCount),
    };
    const primary = byKind[kind]();
    if (primary) return primary;
    if (kind !== 'quiz') return byKind.quiz();
    return byKind['concept-mcq']();
};

// Bossen kjører kun quiz-mcq - den mest robuste poolen
export const buildBossQueue = (
    content: RunContent,
    rng: () => number,
    used: Set<string>,
    count: number
): SessionExercise[] => {
    const queue: SessionExercise[] = [];
    for (let i = 0; i < count; i++) {
        const exercise =
            buildQuizExercise(content, rng, used) ?? buildConceptMcq(content, rng, used);
        if (!exercise) break;
        queue.push(exercise);
    }
    return queue;
};
