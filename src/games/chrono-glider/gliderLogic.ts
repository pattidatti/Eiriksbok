// Spillogikk for Chrono Glider: hendelsesutvalg, årstall-porter og
// forsterkningskø (feilede hendelser kommer tilbake til de sitter).

export type Lane = 0 | 1 | 2;

export interface GliderEvent {
    id: string;
    title: string;
    year: number;
    subjectId: string;
    link?: string;
    isEra: boolean; // periode med varighet - spør «Når startet dette?»
}

export interface Gate {
    label: string;
    year: number;
    isCorrect: boolean;
}

export interface QueueItem {
    event: GliderEvent;
    gates: Gate[]; // alltid 3, én per bane
    correctLane: Lane;
    attempt: number; // 1 = første forsøk
}

export interface RoundResult {
    event: GliderEvent;
    firstTry: boolean;
}

export const SUBJECT_FILTERS = [
    { id: 'alle', label: 'Alle fag' },
    { id: 'historie', label: 'Historie' },
    { id: 'norsk', label: 'Norsk' },
    { id: 'krle', label: 'KRLE' },
    { id: 'samfunnskunnskap', label: 'Samfunnskunnskap' },
] as const;

export const ROUND_SIZE = 8;

export const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} f.Kr.` : `${year}`);

const shuffle = <T>(arr: T[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Hendelser som egner seg som «gjett årstallet»: konkrete år, ikke epoker
type RawEvent = {
    id?: string;
    title?: string;
    startDate?: number;
    endDate?: number;
    subjectId?: string;
    link?: string;
};

export const parseEvents = (raw: unknown): GliderEvent[] => {
    const list: RawEvent[] = Array.isArray(raw)
        ? (raw as RawEvent[])
        : ((raw as { events?: RawEvent[] })?.events ?? []);
    const seen = new Set<string>();
    return list
        .filter((e) => {
            if (e.startDate === undefined || !e.title || !e.id) return false;
            if (e.startDate < -800 || e.startDate > 2030) return false;
            if (e.title.length > 70) return false;
            if (seen.has(e.id)) return false;
            seen.add(e.id);
            return true;
        })
        .map((e) => ({
            id: e.id!,
            title: e.title!,
            year: Math.round(e.startDate!),
            subjectId: e.subjectId === 'samfunnsfag' ? 'samfunnskunnskap' : (e.subjectId ?? ''),
            link: e.link,
            // Perioder (vikingtiden, middelalderen …) spørres som startår
            isEra: e.endDate !== undefined && Math.abs(e.endDate - e.startDate!) > 5,
        }));
};

// Tre porter: riktig år + to plausible distraktører. Ekte år fra andre
// hendelser i nærheten foretrekkes; syntetiske avvik som reserve.
export const buildQueueItem = (
    event: GliderEvent,
    pool: GliderEvent[],
    attempt: number
): QueueItem => {
    const y = event.year;
    // Eldre hendelser får videre vindu - ingen kan skille 44 f.Kr. fra 46 f.Kr.
    const span = Math.max(12, Math.round(Math.abs(2026 - y) * 0.12));

    const labels = new Set([formatYear(y)]);
    const years = [y];

    const realCandidates = shuffle(
        pool
            .map((e) => e.year)
            .filter((v) => v !== y && Math.abs(v - y) >= 2 && Math.abs(v - y) <= span)
    );
    for (const v of realCandidates) {
        if (years.length >= 3) break;
        const label = formatYear(v);
        if (!labels.has(label)) {
            labels.add(label);
            years.push(v);
        }
    }

    let guard = 0;
    while (years.length < 3 && guard++ < 60) {
        const offset = (2 + Math.floor(Math.random() * span)) * (Math.random() < 0.5 ? -1 : 1);
        const v = y + offset;
        if (v > 2026) continue;
        const label = formatYear(v);
        if (!labels.has(label)) {
            labels.add(label);
            years.push(v);
        }
    }

    const order = shuffle(years);
    const gates: Gate[] = order.map((v) => ({
        label: formatYear(v),
        year: v,
        isCorrect: v === y,
    }));
    return {
        event,
        gates,
        correctLane: order.indexOf(y) as Lane,
        attempt,
    };
};

export const buildRound = (pool: GliderEvent[], size = ROUND_SIZE): QueueItem[] => {
    const picked = shuffle(pool).slice(0, size);
    return picked.map((e) => buildQueueItem(e, pool, 1));
};

// Forsterkning: legg hendelsen tilbake litt lenger frem i køen med nye porter
export const requeueMissed = (
    queue: QueueItem[],
    idx: number,
    pool: GliderEvent[]
): QueueItem[] => {
    const missed = queue[idx];
    const retry = buildQueueItem(missed.event, pool, missed.attempt + 1);
    const insertAt = Math.min(idx + 3, queue.length);
    const next = [...queue];
    next.splice(insertAt, 0, retry);
    return next;
};

const bestKey = (subject: string) => `chrono-glider-best-${subject}`;

export const readBest = (subject: string) => {
    try {
        return Number(localStorage.getItem(bestKey(subject))) || 0;
    } catch {
        return 0;
    }
};

export const writeBest = (subject: string, score: number) => {
    try {
        localStorage.setItem(bestKey(subject), String(score));
    } catch {
        // best-effort
    }
};
