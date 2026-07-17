// Anbefalingsmotoren bak «Min læring». Ren logikk - ingen React. Den scorer
// og rangerer kandidater fra alle innholdstyper (artikler, læringsstier,
// quizer, 3D-spill, detektivsaker, tidsreiser og repetisjon) ut fra elevens
// mestring, hva som er påbegynt, og hva som er svakt. Resultatet er en kort,
// variert liste med begrunnelser på norsk.

import type { Manifest, ManifestLesson, ManifestTopic, TopicTool } from '../../../types';
import type { PathProgress } from '../../../stores/useLearningPathProfile';
import type { HistoryItem } from '../../../hooks/useUserHistory';
import type { SubjectMastery } from '../mastery';
import type { ActivityEvent } from '../types';
import { GAME_CATALOG, SCENARIO_CATALOG } from './catalog';
import type { DetectiveCatalogEntry } from './catalog';
import { findTopicImage } from './images';
import {
    MIN_PROFILE_MASS,
    scoreLessonInterest,
    type InterestProfile,
    type LessonTagIndex,
} from './interest';
import { mulberry32, shuffleWithinTiers, weightedSample } from './rng';

export type RecommendationType =
    | 'path'
    | 'article'
    | 'finish'
    | 'quiz'
    | 'game'
    | 'detective'
    | 'scenario'
    | 'review'
    | 'discovery'
    | 'recent'
    | 'started';

export interface Recommendation {
    id: string;
    type: RecommendationType;
    title: string;
    // Begrunnelse på norsk - hvorfor akkurat dette, akkurat nå.
    reason: string;
    link: string;
    // For fargelegging i UI (kan mangle for fag-uavhengig innhold).
    subjectId?: string;
    // Thumbnail/hero-bilde til kortet (kan mangle, f.eks. for repetisjon).
    image?: string;
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
    // Interesse-drevet oppdagelse (valgfritt - motoren fungerer uten, men da
    // uten «oppdag»-kort). Settes av useRecommendations.
    lessonIndex?: LessonTagIndex;
    interestProfile?: InterestProfile;
    history?: HistoryItem[];
    // Frø for dynamisk rotasjon av rutenettet mellom sidevisninger. Uten det
    // faller motoren tilbake til fast rekkefølge.
    rotationSeed?: number;
}

// Læringssti-verktøyet + faget (og ev. emnet) det hører til, funnet fra
// pathId i manifestet. Emnet brukes til bildeoppslag - stier har ikke egne
// bilder, så stien låner emnets hero-bilde.
const findPathContext = (
    manifest: Manifest,
    pathId: string
): { tool: TopicTool; subjectId: string; topicId?: string } | null => {
    for (const subject of manifest.subjects) {
        for (const tool of subject.tools ?? []) {
            if (tool.id === pathId) return { tool, subjectId: subject.id };
        }
        for (const topic of subject.topics) {
            for (const tool of topic.tools ?? []) {
                if (tool.id === pathId)
                    return { tool, subjectId: subject.id, topicId: topic.id };
            }
            for (const sub of topic.subTopics ?? []) {
                for (const tool of sub.tools ?? []) {
                    if (tool.id === pathId)
                        return { tool, subjectId: subject.id, topicId: topic.id };
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
): { title: string; link: string; image?: string } | null => {
    const topic = topicById(manifest, subjectId, topicId);
    if (!topic) return null;
    for (const lesson of topic.lessons ?? []) {
        const path = `${subjectId}/${topicId}/${lesson.id}`;
        if (!isRead(path))
            return { title: lesson.title, link: `/${path}`, image: lesson.image || topic.image };
    }
    for (const sub of topic.subTopics ?? []) {
        for (const lesson of sub.lessons) {
            const path = `${subjectId}/${topicId}/${sub.id}/${lesson.id}`;
            if (!isRead(path))
                return {
                    title: lesson.title,
                    link: `/${path}`,
                    image: lesson.image || sub.image || topic.image,
                };
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
): { title: string; link: string; image?: string } | null => {
    const topic = topicById(manifest, subjectId, topicId);
    if (!topic) return null;
    for (const lesson of topic.lessons ?? []) {
        const path = `${subjectId}/${topicId}/${lesson.id}`;
        if (isRead(path))
            return { title: lesson.title, link: `/${path}`, image: lesson.image || topic.image };
    }
    for (const sub of topic.subTopics ?? []) {
        for (const lesson of sub.lessons) {
            const path = `${subjectId}/${topicId}/${sub.id}/${lesson.id}`;
            if (isRead(path))
                return {
                    title: lesson.title,
                    link: `/${path}`,
                    image: lesson.image || sub.image || topic.image,
                };
        }
    }
    return null;
};

// Slår opp en spesifikk, kjent leksjon (i motsetning til findNextArticle/
// findReadLesson, som finner "første uleste/leste" - her vet vi allerede
// hvilken leksjon vi vil ha, f.eks. fra en historikk-logg).
export const findManifestLesson = (
    manifest: Manifest,
    subjectId: string,
    topicId: string,
    lessonId: string,
    subTopicId?: string
): ManifestLesson | null => {
    const topic = topicById(manifest, subjectId, topicId);
    if (!topic) return null;
    if (subTopicId) {
        const sub = topic.subTopics?.find((s) => s.id === subTopicId);
        return sub?.lessons.find((l) => l.id === lessonId) ?? null;
    }
    return topic.lessons?.find((l) => l.id === lessonId) ?? null;
};

const pct = (part: number, whole: number): number =>
    whole > 0 ? Math.round((part / whole) * 100) : 0;

const MAX_RECOMMENDATIONS = 8;
const MAX_PER_TYPE = 2;
// Antall «oppdag»-kort som holdes av plass til (av 8), så interesse-kort ikke
// blir presset ut av pliktkortene. Justeres ned når noe haster (se under).
const DISCOVERY_SLOTS = 3;
// Hvor mange kandidater vi vurderer før vi trekker ut oppdag-slottene.
const DISCOVERY_POOL = 12;
// Nivå-bredde for rotasjon: kort med score innenfor dette kan bytte plass.
const TIER_EPS = 6;

// Kuraterte startanbefalinger for en helt ny elev: første artikkel i første
// emne med bilde, ett kort per fag. Ingen mestring å score på ennå - målet er
// å vise bredden og gjøre det fristende å begynne.
export const buildWelcomeRecommendations = (manifest: Manifest): Recommendation[] => {
    const recs: Recommendation[] = [];
    manifest.subjects.forEach((subject, i) => {
        const isRead = () => false;
        for (const topic of subject.topics) {
            const next = findNextArticle(manifest, subject.id, topic.id, isRead);
            if (!next) continue;
            recs.push({
                id: `welcome-${subject.id}`,
                type: 'article',
                title: next.title,
                reason: `Bli kjent med ${subject.title}. En fin første artikkel å starte med.`,
                link: next.link,
                subjectId: subject.id,
                image: next.image ?? findTopicImage(manifest, subject.id, topic.id),
                score: 100 - i,
            });
            break;
        }
    });
    return recs;
};

// Bygg en rangert, variert liste med anbefalinger. Kandidatene får en score;
// vi sorterer, fjerner duplikater på lenke og begrenser antall per type slik
// at lista blir bredt sammensatt i stedet for seks artikler på rad.
export const buildRecommendations = (ctx: RecommendationContext): Recommendation[] => {
    const {
        manifest,
        mastery,
        firstCompletions,
        events,
        paths,
        dueCount,
        detectiveCases,
        lessonIndex,
        interestProfile,
        history,
        rotationSeed,
    } = ctx;

    // Helt ny elev: ingen fullføringer, ingen påbegynte stier - da er den
    // kuraterte velkomstlista bedre enn score-motoren.
    if (Object.keys(firstCompletions).length === 0 && Object.keys(paths).length === 0) {
        return buildWelcomeRecommendations(manifest);
    }

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
            image: found.topicId
                ? findTopicImage(manifest, found.subjectId, found.topicId)
                : undefined,
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

    // 2b. «Fullfør emnet!» - emner eleven nesten er ferdig med. Uavsluttede
    // ting gnager; et nesten-fullt emne er den enkleste seieren som finnes.
    const almostDone = topics
        .filter(({ topic }) => {
            const ratio = topic.totalLessons > 0 ? topic.completedLessons / topic.totalLessons : 0;
            return ratio >= 0.65 && ratio < 1;
        })
        .sort(
            (a, b) =>
                b.topic.completedLessons / b.topic.totalLessons -
                a.topic.completedLessons / a.topic.totalLessons
        );
    almostDone.slice(0, 1).forEach(({ subjectId, topic }) => {
        const next = findNextArticle(manifest, subjectId, topic.topicId, isRead);
        if (!next) return;
        const rest = topic.totalLessons - topic.completedLessons;
        recs.push({
            id: `finish-${subjectId}-${topic.topicId}`,
            type: 'finish',
            title: next.title,
            reason:
                rest === 1
                    ? `Bare én artikkel igjen - fullfør ${topic.title}!`
                    : `Bare ${rest} artikler igjen - fullfør ${topic.title}!`,
            link: next.link,
            subjectId,
            image: next.image ?? findTopicImage(manifest, subjectId, topic.topicId),
            score: 90,
        });
    });

    // 3. Neste artikkel i et emne eleven er midt i.
    const ongoing = topics
        .filter(({ topic }) => topic.completedLessons > 0 && topic.completedLessons < topic.totalLessons)
        .sort(
            (a, b) =>
                b.topic.completedLessons / b.topic.totalLessons -
                a.topic.completedLessons / a.topic.totalLessons
        );
    // Kun de to beste vinner over MAX_PER_TYPE-taket (scoren er strengt
    // synkende), men de neste tre finnes som reelt reservemateriale for
    // fyll-steget lenger ned - slik fylles rutenett-hull heller med en
    // artikkel enn med en ekstra tidsreise/detektivsak.
    ongoing.slice(0, 5).forEach(({ subjectId, topic }, i) => {
        const next = findNextArticle(manifest, subjectId, topic.topicId, isRead);
        if (!next) return;
        recs.push({
            id: `article-${subjectId}-${topic.topicId}`,
            type: 'article',
            title: next.title,
            reason: `Neste steg i ${topic.title}. Du er ${pct(topic.completedLessons, topic.totalLessons)} % ferdig med emnet.`,
            link: next.link,
            subjectId,
            image: next.image,
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
            image: read?.image ?? findTopicImage(manifest, subjectId, topic.topicId),
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
            image: g.image,
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
            image: unfinishedScenario.image,
            score: activeHistory ? 55 : 30,
        });
    }

    // 7. En detektivsak eleven ikke har løst. DetectiveEngine logger sakens
    //    interne id (caseId), som avviker fra filslugen/ruten - match derfor
    //    på caseId, med tittel som fallback for gamle hendelser.
    const detectiveEvents = events.filter((e) => e.kind === 'detective-solved');
    const isSolved = (c: DetectiveCatalogEntry): boolean =>
        detectiveEvents.some(
            (e) =>
                (c.caseId && e.activityId === `detektiv/${c.caseId}`) ||
                (e.title !== undefined && e.title === c.title)
        );
    const unsolvedCase = detectiveCases.filter((c) => !isSolved(c))[0];
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
            image: unsolvedCase.image,
            score: activeHistory ? 54 : 29,
        });
    }

    // 8. Start et helt nytt emne i et fag eleven allerede er aktiv i.
    const freshTopics = topics.filter(
        ({ subjectId, topic }) =>
            topic.completedLessons === 0 &&
            topic.totalLessons > 0 &&
            activeSubjects.has(subjectId)
    );
    freshTopics.slice(0, 2).forEach((freshTopic, i) => {
        const next = findNextArticle(manifest, freshTopic.subjectId, freshTopic.topic.topicId, isRead);
        if (!next) return;
        recs.push({
            id: `fresh-${freshTopic.subjectId}-${freshTopic.topic.topicId}`,
            type: 'article',
            title: next.title,
            reason: `Nytt emne i ${subjectTitle(freshTopic.subjectId)}: ${freshTopic.topic.title}. Bygg videre på det du kan.`,
            link: next.link,
            subjectId: freshTopic.subjectId,
            image: next.image,
            score: 42 - i * 2,
        });
    });

    // 9. Oppfordre til å utforske et fag eleven ikke har rørt ennå.
    const newSubjects = mastery.filter((s) => s.completedUnits === 0 && s.totalUnits > 0);
    newSubjects.slice(0, 2).forEach((newSubject, i) => {
        recs.push({
            id: `explore-${newSubject.subjectId}`,
            type: 'article',
            title: newSubject.title,
            reason: `Du har ikke utforsket ${newSubject.title} ennå. Ta en titt og se hva som venter.`,
            link: `/${newSubject.subjectId}`,
            subjectId: newSubject.subjectId,
            image: manifest.subjects
                .find((s) => s.id === newSubject.subjectId)
                ?.topics.map((t) => findTopicImage(manifest, newSubject.subjectId, t.id))
                .find(Boolean),
            score: 28 - i * 2,
        });
    });

    // 10. «Oppdag» - nytt innhold som treffer interessene dine. Scorer uleste
    //     artikler etter tagg-overlapp med interesse-profilen, så feeden viser
    //     noe fristende, ikke bare neste steg i rekka. Krever nok engasjement
    //     til at profilen er meningsfull (ellers dekker sekvens-kortene den).
    const discoveryRecs: Recommendation[] = [];
    if (
        interestProfile &&
        lessonIndex &&
        interestProfile.magnitude > MIN_PROFILE_MASS
    ) {
        // Artikler eleven alt har åpnet vises i «Påbegynte»/«Nylig lest» - hold
        // dem ute av oppdag så feeden ikke gjentar seg selv.
        const browsed = new Set(
            (history ?? [])
                .filter((h) => h.type === 'lesson' && h.topicId)
                .map(
                    (h) =>
                        `${h.subjectId}/${h.topicId}${h.subTopicId ? `/${h.subTopicId}` : ''}/${h.id}`
                )
        );
        const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
        lessonIndex.all
            .filter(
                (e) => e.tags.length > 0 && !isRead(e.path) && !browsed.has(e.path)
            )
            .map((e) => ({ e, cos: scoreLessonInterest(interestProfile, e, lessonIndex.idf) }))
            .filter((x) => x.cos > 0)
            .sort((a, b) => b.cos - a.cos)
            .slice(0, DISCOVERY_POOL)
            .forEach(({ e, cos }) => {
                const matched =
                    e.tags.find((t) => interestProfile.topTags.includes(t)) ?? e.tags[0];
                discoveryRecs.push({
                    id: `discovery-${e.path}`,
                    type: 'discovery',
                    title: e.title,
                    reason: `Fordi du liker ${capitalize(matched)}. Noe nytt å utforske.`,
                    link: `/${e.path}`,
                    subjectId: e.subjectId,
                    image: e.image ?? findTopicImage(manifest, e.subjectId, e.topicId),
                    score: 63 + cos * 22,
                });
            });
    }

    // Sett sammen den endelige lista. Målet er balanse + variasjon:
    //   - Kort 0 (heroen) er det sterkeste pliktkortet, valgt deterministisk,
    //     så forsiden og «Min læring» er enige om samme neste steg.
    //   - Noen faste plasser reserveres til «oppdag» så interesse-kort ikke
    //     drukner. Færre når noe haster (forfalt repetisjon + aktiv sti).
    //   - Resten fylles av pliktkort, nivå-stokket så jevnbyrdige kort roterer
    //     mellom besøk (frø-styrt, stabilt innenfor én sidevisning).
    const rng = mulberry32((rotationSeed ?? 1) >>> 0);

    const dutySorted = [...recs].sort((a, b) => b.score - a.score);
    const hero = dutySorted[0];
    const restDuty = shuffleWithinTiers(dutySorted.slice(1), (r) => r.score, TIER_EPS, rng);

    // Færre oppdag-slott når eleven har presserende ting å gjøre.
    let discoverySlots = DISCOVERY_SLOTS;
    if (dueCount > 0) discoverySlots -= 1;
    if (activePaths.length > 0) discoverySlots -= 1;
    discoverySlots = Math.max(1, discoverySlots);

    const sampledDiscovery = weightedSample(
        discoveryRecs.map((r) => ({ v: r, w: Math.pow(Math.max(0.01, r.score - 63), 2) })),
        discoverySlots,
        rng
    );

    const seenLinks = new Set<string>();
    const typeCount: Record<string, number> = {};
    const out: Recommendation[] = [];
    const tryAdd = (rec: Recommendation | undefined, ignoreTypeCap = false): boolean => {
        if (!rec || out.length >= MAX_RECOMMENDATIONS) return false;
        if (seenLinks.has(rec.link)) return false;
        if (!ignoreTypeCap && rec.type !== 'discovery' && (typeCount[rec.type] ?? 0) >= MAX_PER_TYPE)
            return false;
        seenLinks.add(rec.link);
        typeCount[rec.type] = (typeCount[rec.type] ?? 0) + 1;
        out.push(rec);
        return true;
    };

    tryAdd(hero); // deterministisk hero først
    sampledDiscovery.forEach((d) => tryAdd(d)); // reserverte oppdag-plasser
    restDuty.forEach((r) => tryAdd(r)); // pliktkort, nivå-stokket
    discoveryRecs.forEach((d) => tryAdd(d)); // fyll opp med flere oppdag ved behov

    // Bevar sorted-navnet til fyll-logikken under (leftover-kandidater).
    const sorted = [...dutySorted, ...discoveryRecs];

    // MyLearningPage kutter av out[0] til HeroCard, og RecommendationsSection
    // plukker selv items[0] som sitt eget store featured-kort - så rutenettet
    // (SmallCard-gridet) har out.length - 2 kort. Et oddetall out.length gir
    // dermed et oddetall rutenett-kort, som etterlater et tomt hull i siste
    // rad. Fyll det med én ekstra artikkel hvis mulig (ser bort fra
    // type-taket, men aldri duplikate lenker); fall tilbake til hvilken som
    // helst type bare hvis ingen artikkel finnes til overs.
    if (out.length > 0 && out.length % 2 !== 0) {
        const filler =
            sorted.find(
                (rec) =>
                    !seenLinks.has(rec.link) &&
                    (rec.type === 'article' || rec.type === 'discovery')
            ) ?? sorted.find((rec) => !seenLinks.has(rec.link));
        if (filler) {
            seenLinks.add(filler.link);
            out.push(filler);
        }
    }

    return out;
};
