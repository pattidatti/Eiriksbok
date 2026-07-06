// Anbefalingsmotoren bak «Min læring». Ren logikk - ingen React. Den scorer
// og rangerer kandidater fra alle innholdstyper (artikler, læringsstier,
// quizer, 3D-spill, detektivsaker, tidsreiser og repetisjon) ut fra elevens
// mestring, hva som er påbegynt, og hva som er svakt. Resultatet er en kort,
// variert liste med begrunnelser på norsk.

import type { Manifest, ManifestTopic, TopicTool } from '../../../types';
import type { PathProgress } from '../../../stores/useLearningPathProfile';
import type { SubjectMastery } from '../mastery';
import type { ActivityEvent } from '../types';
import { GAME_CATALOG, SCENARIO_CATALOG } from './catalog';
import type { DetectiveCatalogEntry } from './catalog';

export type RecommendationType =
    | 'path'
    | 'article'
    | 'quiz'
    | 'game'
    | 'detective'
    | 'scenario'
    | 'review';

export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    // Begrunnelse på norsk - hvorfor akkurat dette, akkurat nå.
    reason: string;
    link: string;
    // For fargelegging i UI (kan mangle for fag-uavhengig innhold).
    subjectId?: string;
    score: number;
}

export interface RecommendationContext {
    manifest: Manifest;
    mastery: SubjectMastery[];
    firstCompletions: Record<string, number>;
    events: ActivityEvent[];
    paths: Record<string, PathProgress>;
    dueCount: number;
    detectiveCases: DetectiveCatalogEntry[];
}

// Læringssti-verktøyet + faget det hører til, funnet fra pathId i manifestet.
const findPathContext = (
    manifest: Manifest,
    pathId: string
): { tool: TopicTool; subjectId: string } | null => {
    for (const subject of manifest.subjects) {
        for (const tool of subject.tools ?? []) {
            if (tool.id === pathId) return { tool, subjectId: subject.id };
        }
        for (const topic of subject.topics) {
            for (const tool of topic.tools ?? []) {
                if (tool.id === pathId) return { tool, subjectId: subject.id };
            }
            for (const sub of topic.subTopics ?? []) {
                for (const tool of sub.tools ?? []) {
                    if (tool.id === pathId) return { tool, subjectId: subject.id };
                }
            }
        }
    }
    return null;
};

// Bare hjelpe-utgaven som andre moduler (dagens mål) også trenger.
export const findPathTool = (manifest: Manifest, pathId: string): TopicTool | null =>
    findPathContext(manifest, pathId)?.tool ?? null;

const topicById = (
    manifest: Manifest,
    subjectId: string,
    topicId: string
): ManifestTopic | null => {
    const subject = manifest.subjects.find((s) => s.id === subjectId);
    return subject?.topics.find((t) => t.id === topicId) ?? null;
};

// Første uleste artikkel i et emne (hopper over stier/verktøy via layout).
export const findNextArticle = (
    manifest: Manifest,
    subjectId: string,
    topicId: string,
    isRead: (path: string) => boolean
): { title: string; link: string } | null => {
    const topic = topicById(manifest, subjectId, topicId);
    if (!topic) return null;
    for (const lesson of topic.lessons ?? []) {
        const path = `${subjectId}/${topicId}/${lesson.id}`;
        if (!isRead(path)) return { title: lesson.title, link: `/${path}` };
    }
    for (const sub of topic.subTopics ?? []) {
        for (const lesson of sub.lessons) {
            const path = `${subjectId}/${topicId}/${sub.id}/${lesson.id}`;
            if (!isRead(path)) return { title: lesson.title, link: `/${path}` };
        }
    }
    return null;
};

// Første alt-leste artikkel i et emne - dit sender vi eleven for å ta quizen
// på nytt når emnet er svakt.
const findReadLesson = (
    manifest: Manifest,
    subjectId: string,
    topicId: string,
    isRead: (path: string) => boolean
): { title: string; link: string } | null => {
    const topic = topicById(manifest, subjectId, topicId);
    if (!topic) return null;
    for (const lesson of topic.lessons ?? []) {
        const path = `${subjectId}/${topicId}/${lesson.id}`;
        if (isRead(path)) return { title: lesson.title, link: `/${path}` };
    }
    for (const sub of topic.subTopics ?? []) {
        for (const lesson of sub.lessons) {
            const path = `${subjectId}/${topicId}/${sub.id}/${lesson.id}`;
            if (isRead(path)) return { title: lesson.title, link: `/${path}` };
        }
    }
    return null;
};

const pct = (part: number, whole: number): number =>
    whole > 0 ? Math.round((part / whole) * 100) : 0;

const MAX_RECOMMENDATIONS = 6;
const MAX_PER_TYPE = 2;

// Bygg en rangert, variert liste med anbefalinger. Kandidatene får en score;
// vi sorterer, fjerner duplikater på lenke og begrenser antall per type slik
// at lista blir bredt sammensatt i stedet for seks artikler på rad.
export const buildRecommendations = (ctx: RecommendationContext): Recommendation[] => {
    const { manifest, mastery, firstCompletions, events, paths, dueCount, detectiveCases } = ctx;
    const isRead = (path: string): boolean =>
        Boolean(firstCompletions[`article-read:${path}`]);

    const subjectTitle = (id: string): string =>
        manifest.subjects.find((s) => s.id === id)?.title ?? id;

    // Fag eleven allerede er i gang med (har fullført noe i).
    const activeSubjects = new Set(
        mastery.filter((s) => s.completedUnits > 0).map((s) => s.subjectId)
    );

    // Alle emner flatet ut, med faget de hører til.
    const topics = mastery.flatMap((s) =>
        s.topics.map((topic) => ({ subjectId: s.subjectId, topic }))
    );

    const recs: Recommendation[] = [];

    // 1. Fortsett en påbegynt læringssti (det sterkeste signalet på hva neste steg er).
    const activePaths = Object.values(paths)
        .filter((p) => p.finishedAt === null)
        .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);
    activePaths.slice(0, 2).forEach((p, i) => {
        const found = findPathContext(manifest, p.pathId);
        if (!found) return;
        recs.push({
            id: `path-${p.pathId}`,
            type: 'path',
            title: found.tool.title,
            reason: 'Læringsstien din venter. Fortsett der du slapp.',
            link: found.tool.link,
            subjectId: found.subjectId,
            score: 100 - i * 3,
        });
    });

    // 2. Dagens repetisjon, hvis noe er forfalt.
    if (dueCount > 0) {
        recs.push({
            id: 'review',
            type: 'review',
            title: 'Dagens økt',
            reason: `${dueCount} kort er klare for repetisjon. Fem minutter fester det du har lært.`,
            link: '/oving/dagens-okt',
            score: 92,
        });
    }

    // 3. Neste artikkel i et emne eleven er midt i.
    const ongoing = topics
        .filter(({ topic }) => topic.completedLessons > 0 && topic.completedLessons < topic.totalLessons)
        .sort(
            (a, b) =>
                b.topic.completedLessons / b.topic.totalLessons -
                a.topic.completedLessons / a.topic.totalLessons
        );
    ongoing.slice(0, 2).forEach(({ subjectId, topic }, i) => {
        const next = findNextArticle(manifest, subjectId, topic.topicId, isRead);
        if (!next) return;
        recs.push({
            id: `article-${subjectId}-${topic.topicId}`,
            type: 'article',
            title: next.title,
            reason: `Neste steg i ${topic.title}. Du er ${pct(topic.completedLessons, topic.totalLessons)} % ferdig med emnet.`,
            link: next.link,
            subjectId,
            score: 82 - i * 3,
        });
    });

    // 4. Ta en quiz i et svakt emne - der resultatene sitter dårligst eller synker.
    const weak = topics
        .filter(({ topic }) => topic.qualityLevel === 'red' || topic.qualityLevel === 'yellow')
        .sort((a, b) => (a.topic.quality ?? 0) - (b.topic.quality ?? 0));
    weak.slice(0, 2).forEach(({ subjectId, topic }, i) => {
        const read = findReadLesson(manifest, subjectId, topic.topicId, isRead);
        const link = read ? read.link : `/${subjectId}/${topic.topicId}`;
        const isRed = topic.qualityLevel === 'red';
        const falling = topic.trend === 'down';
        const reason = isRed
            ? 'Dette emnet trenger litt kjærlighet. Ta quizen på nytt og løft resultatet.'
            : falling
              ? 'Resultatene her har gått litt ned. En quiz til får det til å sitte igjen.'
              : `Du er på god vei i ${topic.title}. En quiz til gjør deg trygg.`;
        recs.push({
            id: `quiz-${subjectId}-${topic.topicId}`,
            type: 'quiz',
            title: `Quiz: ${topic.title}`,
            reason,
            link,
            subjectId,
            score: (isRed ? 76 : 60) + (falling ? 8 : 0) - i * 3,
        });
    });

    // 5. Et 3D-spill eleven ikke har spilt - helst i et fag hen jobber med.
    const unplayedGames = GAME_CATALOG.filter(
        (g) => !firstCompletions[`minigame-played:spill/${g.id}`]
    );
    const gameRanked = unplayedGames
        .map((g) => ({ g, active: activeSubjects.has(g.subjectId) }))
        .sort((a, b) => Number(b.active) - Number(a.active));
    gameRanked.slice(0, 2).forEach(({ g, active }, i) => {
        recs.push({
            id: `game-${g.id}`,
            type: 'game',
            title: g.title,
            reason: active
                ? `Et 3D-spill fra ${subjectTitle(g.subjectId)}. Opplev ${g.blurb} på innsiden.`
                : `Lyst på noe annet? Opplev ${g.blurb} i dette 3D-spillet.`,
            link: `/oving/spill/${g.id}`,
            subjectId: g.subjectId,
            score: (active ? 58 : 34) - i * 2,
        });
    });

    // 6. En tidsreise eleven ikke har fullført.
    const activeHistory = activeSubjects.has('historie');
    const unfinishedScenario = SCENARIO_CATALOG.filter(
        (s) => !firstCompletions[`scenario-completed:tidsreise/${s.id}`]
    )[0];
    if (unfinishedScenario) {
        recs.push({
            id: `scenario-${unfinishedScenario.id}`,
            type: 'scenario',
            title: unfinishedScenario.title,
            reason: `Tidsreise til ${unfinishedScenario.era}. Ta valgene som former historien, og se hvordan det går.`,
            link: `/oving/tidsreise/${unfinishedScenario.id}`,
            subjectId: unfinishedScenario.subjectId,
            score: activeHistory ? 55 : 30,
        });
    }

    // 7. En detektivsak eleven ikke har løst (matches på tittel i loggen, siden
    //    rute-id og intern id kan avvike).
    const solvedTitles = new Set(
        events.filter((e) => e.kind === 'detective-solved').map((e) => e.title)
    );
    const unsolvedCase = detectiveCases.filter((c) => !solvedTitles.has(c.title))[0];
    if (unsolvedCase) {
        recs.push({
            id: `detective-${unsolvedCase.id}`,
            type: 'detective',
            title: unsolvedCase.title,
            reason: unsolvedCase.difficulty
                ? `Løs mysteriet (${unsolvedCase.difficulty.toLowerCase()}). Følg sporene og tenk som en historiker.`
                : 'Løs mysteriet. Følg sporene og tenk som en historiker.',
            link: `/oving/detektiv/${unsolvedCase.id}`,
            subjectId: unsolvedCase.subjectId,
            score: activeHistory ? 54 : 29,
        });
    }

    // 8. Start et helt nytt emne i et fag eleven allerede er aktiv i.
    const freshTopic = topics.find(
        ({ subjectId, topic }) =>
            topic.completedLessons === 0 &&
            topic.totalLessons > 0 &&
            activeSubjects.has(subjectId)
    );
    if (freshTopic) {
        const next = findNextArticle(manifest, freshTopic.subjectId, freshTopic.topic.topicId, isRead);
        if (next) {
            recs.push({
                id: `fresh-${freshTopic.subjectId}-${freshTopic.topic.topicId}`,
                type: 'article',
                title: next.title,
                reason: `Nytt emne i ${subjectTitle(freshTopic.subjectId)}: ${freshTopic.topic.title}. Bygg videre på det du kan.`,
                link: next.link,
                subjectId: freshTopic.subjectId,
                score: 42,
            });
        }
    }

    // 9. Oppfordre til å utforske et fag eleven ikke har rørt ennå.
    const newSubject = mastery.find((s) => s.completedUnits === 0 && s.totalUnits > 0);
    if (newSubject) {
        recs.push({
            id: `explore-${newSubject.subjectId}`,
            type: 'article',
            title: newSubject.title,
            reason: `Du har ikke utforsket ${newSubject.title} ennå. Ta en titt og se hva som venter.`,
            link: `/${newSubject.subjectId}`,
            subjectId: newSubject.subjectId,
            score: 28,
        });
    }

    // Sorter, fjern duplikate lenker, og begrens per type for variasjon.
    const sorted = recs.sort((a, b) => b.score - a.score);
    const seenLinks = new Set<string>();
    const typeCount: Record<string, number> = {};
    const out: Recommendation[] = [];
    for (const rec of sorted) {
        if (seenLinks.has(rec.link)) continue;
        if ((typeCount[rec.type] ?? 0) >= MAX_PER_TYPE) continue;
        seenLinks.add(rec.link);
        typeCount[rec.type] = (typeCount[rec.type] ?? 0) + 1;
        out.push(rec);
        if (out.length >= MAX_RECOMMENDATIONS) break;
    }
    return out;
};
