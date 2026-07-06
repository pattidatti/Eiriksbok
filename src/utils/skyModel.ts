// Ren logikk for Stjernehimmelen - ingen React, ingen store-imports.
// Bygger et deterministisk SkyWorld fra fagbegreper + repetisjonskøen.
// Samme himmel hver gang: alle posisjoner er seeded, aldri tilfeldige per render.

import type { ReviewItem } from '../types/review';
import type { Star, StarStatus, Constellation, SkyRegion, SkyWorld } from '../types/sky';
import { BOX_INTERVALS, djb2Hash, mulberry32, slugifyTerm } from './reviewScheduler';

export const SKY_WIDTH = 2400;
export const SKY_HEIGHT = 1350;

// Gullvinkelen gir jevn, organisk spredning (phyllotaxis)
const GOLDEN_ANGLE = 2.399963229728653;

const UNLIT_BRIGHTNESS = 0.12;

export interface SkyConceptInput {
    id: string;
    term: string;
    definition: string;
    subjectId?: string;
    topicId?: string;
}

export interface SkyTitles {
    subjects: Record<string, string>;
    // Nøkkel: `${subjectId}/${topicId}`
    topics: Record<string, string>;
}

export interface StarLight {
    status: StarStatus;
    brightness: number;
    box: number | null;
    dueInDays: number | null;
}

// Dager fra a til b (positivt når b er senere). Middag lokal tid - DST-trygt.
export const daysBetween = (a: string, b: string): number => {
    const [ay, am, ad] = a.split('-').map(Number);
    const [by, bm, bd] = b.split('-').map(Number);
    const ta = new Date(ay, am - 1, ad, 12).getTime();
    const tb = new Date(by, bm - 1, bd, 12).getTime();
    return Math.round((tb - ta) / 86_400_000);
};

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

// Lysstyrkemodellen: diskret Leitner-tilstand -> kontinuerlig glød.
// Blafring = forfalt men reddbar, døende = lenge forbi fristen (aldri helt slukket).
export const starLight = (item: ReviewItem | undefined, today: string): StarLight => {
    if (!item) {
        return { status: 'unlit', brightness: UNLIT_BRIGHTNESS, box: null, dueInDays: null };
    }
    const strength = 0.45 + 0.11 * item.box;
    const dueInDays = daysBetween(today, item.dueDate);
    if (dueInDays > 0) {
        return { status: 'lit', brightness: strength, box: item.box, dueInDays };
    }
    // Lagt til i dag, aldri øvd: nytent stjerne, ikke «forfalt»
    if (dueInDays === 0 && item.lastReviewedAt === null) {
        return { status: 'lit', brightness: strength, box: item.box, dueInDays };
    }
    const overdue = -dueInDays;
    const interval = BOX_INTERVALS[item.box];
    const decay = clamp(1 - overdue / (2 * interval), 0.25, 1);
    return {
        status: overdue <= interval ? 'flickering' : 'fading',
        brightness: strength * decay,
        box: item.box,
        dueInDays,
    };
};

const prettifyId = (id: string): string => {
    const text = id.replace(/-/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
};

interface TopicGroup {
    topicId: string;
    concepts: SkyConceptInput[];
}

interface SubjectGroup {
    subjectId: string;
    topics: TopicGroup[];
    starCount: number;
}

// Grupper begreper fag -> emne, deterministisk sortert
const groupConcepts = (concepts: SkyConceptInput[]): SubjectGroup[] => {
    // Dedupliser på review-slug; foretrekk innslag som har emne
    const bySlug = new Map<string, SkyConceptInput>();
    for (const c of concepts) {
        if (!c.term || !c.definition || !c.subjectId) continue;
        const slug = slugifyTerm(c.term);
        if (!slug) continue;
        const existing = bySlug.get(slug);
        if (!existing || (!existing.topicId && c.topicId)) bySlug.set(slug, c);
    }

    const subjects = new Map<string, Map<string, SkyConceptInput[]>>();
    for (const c of bySlug.values()) {
        const subjectId = c.subjectId as string;
        const topicId = c.topicId || 'annet';
        let topics = subjects.get(subjectId);
        if (!topics) {
            topics = new Map();
            subjects.set(subjectId, topics);
        }
        const list = topics.get(topicId);
        if (list) list.push(c);
        else topics.set(topicId, [c]);
    }

    const groups: SubjectGroup[] = [];
    for (const [subjectId, topics] of subjects) {
        const topicGroups: TopicGroup[] = [];
        for (const [topicId, list] of topics) {
            list.sort((a, b) => a.term.localeCompare(b.term, 'nb'));
            topicGroups.push({ topicId, concepts: list });
        }
        topicGroups.sort(
            (a, b) =>
                b.concepts.length - a.concepts.length || a.topicId.localeCompare(b.topicId)
        );
        groups.push({
            subjectId,
            topics: topicGroups,
            starCount: topicGroups.reduce((sum, t) => sum + t.concepts.length, 0),
        });
    }
    groups.sort((a, b) => b.starCount - a.starCount || a.subjectId.localeCompare(b.subjectId));
    return groups;
};

// Størst fag i midten, resten vekselvis til høyre og venstre
const centerOutOrder = <T>(sorted: T[]): T[] => {
    const left: T[] = [];
    const right: T[] = [];
    sorted.forEach((item, i) => {
        if (i === 0) return;
        if (i % 2 === 1) right.push(item);
        else left.push(item);
    });
    return [...left.reverse(), sorted[0], ...right];
};

// Grådig nærmeste-nabo-kjede: enkle, deterministiske konstellasjonslinjer
const chainLines = (indices: number[], stars: Star[]): Array<[number, number]> => {
    if (indices.length < 2) return [];
    const lines: Array<[number, number]> = [];
    const remaining = new Set(indices.slice(1));
    let current = indices[0];
    while (remaining.size > 0) {
        let best = -1;
        let bestDist = Infinity;
        for (const idx of remaining) {
            const dx = stars[idx].x - stars[current].x;
            const dy = stars[idx].y - stars[current].y;
            const dist = dx * dx + dy * dy;
            if (dist < bestDist) {
                bestDist = dist;
                best = idx;
            }
        }
        lines.push([current, best]);
        remaining.delete(best);
        current = best;
    }
    return lines;
};

export const buildSkyWorld = (
    concepts: SkyConceptInput[],
    items: Record<string, ReviewItem>,
    today: string,
    titles: SkyTitles
): SkyWorld => {
    const groups = groupConcepts(concepts);
    const stars: Star[] = [];
    const constellations: Constellation[] = [];
    const regions: SkyRegion[] = [];

    if (groups.length === 0) {
        return {
            width: SKY_WIDTH,
            height: SKY_HEIGHT,
            stars,
            constellations,
            regions,
            litCount: 0,
            dueCount: 0,
        };
    }

    // Fag -> vertikale striper, bredde ~ antall stjerner (dempet så små fag synes)
    const ordered = centerOutOrder(groups);
    const weights = ordered.map((g) => Math.pow(g.starCount, 0.6));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let cursorX = 0;
    for (let s = 0; s < ordered.length; s++) {
        const group = ordered[s];
        const stripWidth = (weights[s] / totalWeight) * SKY_WIDTH;
        const cx = cursorX + stripWidth / 2;
        const cy = SKY_HEIGHT / 2;
        cursorX += stripWidth;

        const rx = (stripWidth / 2) * 0.84;
        const ry = (SKY_HEIGHT / 2) * 0.8;
        const subjectRng = mulberry32(djb2Hash(group.subjectId));
        const subjectRotation = subjectRng() * Math.PI * 2;

        const topicCount = group.topics.length;
        const maxConstellationRadius = clamp(
            (Math.sqrt(rx * ry) / Math.sqrt(topicCount)) * 0.66,
            40,
            170
        );

        let regionLit = 0;

        for (let t = 0; t < topicCount; t++) {
            const topic = group.topics[t];
            // Phyllotaxis i regionens ellipse
            const dist = topicCount === 1 ? 0 : Math.sqrt((t + 0.5) / topicCount);
            const angle = t * GOLDEN_ANGLE + subjectRotation;
            const ccx = cx + Math.cos(angle) * dist * rx;
            const ccy = cy + Math.sin(angle) * dist * ry;
            const starCount = topic.concepts.length;
            const radius = Math.min(
                maxConstellationRadius,
                16 + 14 * Math.sqrt(starCount)
            );

            const topicRng = mulberry32(djb2Hash(`${group.subjectId}/${topic.topicId}`));
            const topicRotation = topicRng() * Math.PI * 2;
            const starIndices: number[] = [];
            let litCount = 0;

            for (let k = 0; k < starCount; k++) {
                const concept = topic.concepts[k];
                const slug = slugifyTerm(concept.term);
                const reviewId = `concept:${slug}`;
                const light = starLight(items[reviewId], today);
                const rng = mulberry32(djb2Hash(concept.id || slug));

                const starDist = starCount === 1 ? 0 : Math.sqrt((k + 0.5) / starCount);
                const starAngle = k * GOLDEN_ANGLE + topicRotation;
                const jitter = radius * 0.22;
                const x = clamp(
                    ccx + Math.cos(starAngle) * starDist * radius + (rng() - 0.5) * jitter,
                    24,
                    SKY_WIDTH - 24
                );
                const y = clamp(
                    ccy + Math.sin(starAngle) * starDist * radius + (rng() - 0.5) * jitter,
                    24,
                    SKY_HEIGHT - 24
                );

                if (light.status !== 'unlit') litCount++;
                starIndices.push(stars.length);
                stars.push({
                    conceptId: concept.id,
                    reviewId,
                    term: concept.term,
                    definition: concept.definition,
                    subjectId: group.subjectId,
                    topicId: topic.topicId,
                    x,
                    y,
                    size: 1 + rng() * 2,
                    status: light.status,
                    brightness: light.brightness,
                    box: light.box,
                    dueInDays: light.dueInDays,
                });
            }

            regionLit += litCount;
            constellations.push({
                id: `${group.subjectId}/${topic.topicId}`,
                subjectId: group.subjectId,
                topicId: topic.topicId,
                title:
                    topic.topicId === 'annet'
                        ? 'Løse stjerner'
                        : titles.topics[`${group.subjectId}/${topic.topicId}`] ||
                          prettifyId(topic.topicId),
                cx: ccx,
                cy: ccy,
                radius,
                starIndices,
                lines: chainLines(starIndices, stars),
                litCount,
            });
        }

        regions.push({
            subjectId: group.subjectId,
            title: titles.subjects[group.subjectId] || prettifyId(group.subjectId),
            cx,
            cy,
            radius: Math.min(stripWidth / 2, SKY_HEIGHT / 2) * 0.95,
            starCount: group.starCount,
            litCount: regionLit,
        });
    }

    let litCount = 0;
    let dueCount = 0;
    for (const star of stars) {
        if (star.status !== 'unlit') litCount++;
        if (star.status === 'flickering' || star.status === 'fading') dueCount++;
    }

    return { width: SKY_WIDTH, height: SKY_HEIGHT, stars, constellations, regions, litCount, dueCount };
};

// Statuslinje for tooltip og recall-kort
export const skyStatusText = (star: Star): string => {
    if (star.status === 'unlit') return 'Utent - du har ikke øvd på denne ennå';
    if (star.status === 'lit') return `Lyser klart - boks ${star.box} av 5`;
    const overdue = -(star.dueInDays ?? 0);
    if (overdue <= 0) return 'Blafrer - forfaller i dag';
    const days = overdue === 1 ? '1 dag' : `${overdue} dager`;
    return star.status === 'flickering'
        ? `Blafrer - ${days} på overtid`
        : `Døende - ${days} på overtid`;
};

// Neste stjerne å redde: mest på overtid først, deretter laveste boks
export const nextDueStarIndex = (stars: Star[], subjectFilter: string | null): number | null => {
    let best: number | null = null;
    let bestKey = Infinity;
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (star.status !== 'flickering' && star.status !== 'fading') continue;
        if (subjectFilter && star.subjectId !== subjectFilter) continue;
        const key = (star.dueInDays ?? 0) * 10 + (star.box ?? 1);
        if (key < bestKey) {
            bestKey = key;
            best = i;
        }
    }
    return best;
};

// Neste stjerne å oppdage: foretrekk stjernebilder som allerede har liv i seg
// (relatert stoff = bedre læring), deretter hele himmelen. Seedet for variasjon.
export const nextUnlitStarIndex = (
    world: SkyWorld,
    subjectFilter: string | null,
    seed: string
): number | null => {
    const inLivingConstellation: number[] = [];
    const anywhere: number[] = [];
    for (const constellation of world.constellations) {
        if (subjectFilter && constellation.subjectId !== subjectFilter) continue;
        for (const index of constellation.starIndices) {
            if (world.stars[index].status !== 'unlit') continue;
            anywhere.push(index);
            if (constellation.litCount > 0) inLivingConstellation.push(index);
        }
    }
    const pool = inLivingConstellation.length > 0 ? inLivingConstellation : anywhere;
    if (pool.length === 0) return null;
    const rng = mulberry32(djb2Hash(seed));
    return pool[Math.floor(rng() * pool.length)];
};
