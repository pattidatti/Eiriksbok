// Rådata fra Firebase -> tall en voksen kan lese.
//
// Alt her er rene funksjoner uten React, slik at de kan leses (og rettes) uten
// å åpne dashbordet. Selve abonnementet ligger i useStatsData.ts.

import type { Manifest } from '../../../types';
import { getSubjectLabel } from '../../../utils/subjectColors';

// --- Rå former fra RTDB ---------------------------------------------------

export interface LesetidMaling {
    duration: number;
    timestamp?: number;
    path?: string;
}

export interface DagRad {
    views?: number;
    activities?: number;
    searches?: number;
    readMs?: number;
    readSessions?: number;
    xp?: number;
    besok?: Record<string, number>;
    subjects?: Record<string, number>;
    kinds?: Record<string, number>;
    fagAktivitet?: Record<string, number>;
}

export interface UniqueUser {
    firstSeen?: number;
    lastSeen?: number;
    device?: string;
}

export interface AktivLeser {
    path?: string;
    lastActive?: number;
}

export interface SokLogg {
    query: string;
    timestamp: number;
    resultsCount: number;
    type: 'text' | 'tag';
}

export interface QuizRad {
    forsok?: number;
    poengSum?: number;
    perfekte?: number;
}

export interface NullTreff {
    query?: string;
    antall?: number;
    sist?: number;
}

export interface RaaStats {
    views: Record<string, number>;
    readingTime: Record<string, Record<string, LesetidMaling>>;
    daily: Record<string, DagRad>;
    clock: Record<string, Record<string, number>>;
    devices: Record<string, number>;
    browsers: Record<string, number>;
    activity: Record<string, number>;
    quiz: Record<string, QuizRad>;
    zeroHits: Record<string, NullTreff>;
    uniqueUsers: Record<string, UniqueUser>;
    activeUsers: Record<string, AktivLeser>;
    searches: Record<string, SokLogg>;
    hangman: Record<string, { outcome: 'won' | 'lost'; timestamp: number }>;
}

export const tomStats = (): RaaStats => ({
    views: {},
    readingTime: {},
    daily: {},
    clock: {},
    devices: {},
    browsers: {},
    activity: {},
    quiz: {},
    zeroHits: {},
    uniqueUsers: {},
    activeUsers: {},
    searches: {},
    hangman: {},
});

// --- Datoer ---------------------------------------------------------------

const p2 = (n: number) => String(n).padStart(2, '0');

export const dagsnokkel = (d: Date): string =>
    `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

/** De siste `antall` dagene, eldst først, som 'YYYY-MM-DD'. */
export const sisteDager = (antall: number, slutt: Date = new Date()): string[] => {
    const ut: string[] = [];
    for (let i = antall - 1; i >= 0; i--) {
        const d = new Date(slutt);
        d.setDate(d.getDate() - i);
        ut.push(dagsnokkel(d));
    }
    return ut;
};

export const UKEDAGER = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];

// --- Formatering ----------------------------------------------------------

export const formatTid = (ms: number): string => {
    if (!ms || ms < 1000) return '–';
    const sek = Math.round(ms / 1000);
    if (sek < 60) return `${sek}s`;
    const min = Math.floor(sek / 60);
    if (min < 60) return `${min}m ${sek % 60}s`;
    return `${Math.floor(min / 60)}t ${min % 60}m`;
};

export const formatTall = (n: number): string =>
    n >= 10000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('nb-NO');

export const formatDagKort = (dag: string): string => {
    const [, m, d] = dag.split('-');
    return `${Number(d)}.${Number(m)}.`;
};

// --- Innholdsregister -----------------------------------------------------

export interface SideInfo {
    tittel: string;
    fagId: string;
    fagTittel: string;
    emne: string;
    sti: string;
    type: 'leksjon' | 'emne' | 'verktøy';
}

/**
 * Nøkkelen i Firebase er stien med understrek ('historie_vikingtiden_...').
 * Manifestet vet hva den faktisk heter. Uten dette registeret viste dashbordet
 * bare understreker, og ingen kunne se hvilken artikkel som faktisk ble lest.
 */
export const byggSideregister = (manifest: Manifest | undefined): Record<string, SideInfo> => {
    const reg: Record<string, SideInfo> = {};
    if (!manifest) return reg;

    const noekkel = (sti: string) => sti.replace(/^\//, '').replace(/[^a-zA-Z0-9-_]/g, '_');

    for (const fag of manifest.subjects) {
        const fagTittel = fag.title ?? getSubjectLabel(fag.id);

        for (const emne of fag.topics) {
            const emneSti = `/${fag.id}/${emne.id}`;
            reg[noekkel(emneSti)] = {
                tittel: emne.title,
                fagId: fag.id,
                fagTittel,
                emne: emne.title,
                sti: emneSti,
                type: 'emne',
            };

            for (const leksjon of emne.lessons ?? []) {
                const sti = `${emneSti}/${leksjon.id}`;
                reg[noekkel(sti)] = {
                    tittel: leksjon.title,
                    fagId: fag.id,
                    fagTittel,
                    emne: emne.title,
                    sti,
                    type: 'leksjon',
                };
            }

            for (const under of emne.subTopics ?? []) {
                for (const leksjon of under.lessons ?? []) {
                    const sti = `${emneSti}/${under.id}/${leksjon.id}`;
                    reg[noekkel(sti)] = {
                        tittel: leksjon.title,
                        fagId: fag.id,
                        fagTittel,
                        emne: `${emne.title} › ${under.title}`,
                        sti,
                        type: 'leksjon',
                    };
                }
            }

            for (const verktoy of emne.tools ?? []) {
                if (!verktoy.link) continue;
                reg[noekkel(verktoy.link)] = {
                    tittel: verktoy.title,
                    fagId: fag.id,
                    fagTittel,
                    emne: emne.title,
                    sti: verktoy.link,
                    type: 'verktøy',
                };
            }
        }

        for (const verktoy of fag.tools ?? []) {
            if (!verktoy.link) continue;
            reg[noekkel(verktoy.link)] = {
                tittel: verktoy.title,
                fagId: fag.id,
                fagTittel,
                emne: '–',
                sti: verktoy.link,
                type: 'verktøy',
            };
        }
    }

    return reg;
};

/** Faller tilbake på en lesbar utgave av nøkkelen når manifestet ikke kjenner den. */
export const slaOppSide = (noekkel: string, reg: Record<string, SideInfo>): SideInfo => {
    const treff = reg[noekkel];
    if (treff) return treff;

    const deler = noekkel.split('_').filter(Boolean);
    const fagId = deler[0] ?? 'ukjent';
    return {
        tittel: deler.map((d) => d.replace(/-/g, ' ')).join(' / ') || noekkel,
        fagId,
        fagTittel: getSubjectLabel(fagId),
        emne: '–',
        sti: `/${deler.join('/')}`,
        type: 'verktøy',
    };
};

// --- Avledede tall --------------------------------------------------------

export interface SideRad extends SideInfo {
    noekkel: string;
    visninger: number;
    snittTid: number;
    totalTid: number;
    okter: number;
    quizForsok: number;
    quizSnitt: number | null;
}

export const byggSiderader = (
    raa: RaaStats,
    reg: Record<string, SideInfo>
): SideRad[] => {
    const noekler = new Set([...Object.keys(raa.views), ...Object.keys(raa.readingTime)]);

    return [...noekler].map((noekkel) => {
        const info = slaOppSide(noekkel, reg);

        // Målinger fra før august 2026 ligger under en nøkkel med ledende
        // understrek (pathname hadde skråstrek foran). Vi leser begge, så
        // historikken teller med.
        const malinger = raa.readingTime[noekkel] ?? raa.readingTime[`_${noekkel}`];
        const okter = malinger ? Object.values(malinger) : [];
        const totalTid = okter.reduce((sum, m) => sum + (m.duration ?? 0), 0);

        const quiz = raa.quiz[noekkel];
        const forsok = quiz?.forsok ?? 0;

        return {
            ...info,
            noekkel,
            visninger: raa.views[noekkel] ?? 0,
            okter: okter.length,
            totalTid,
            snittTid: okter.length ? totalTid / okter.length : 0,
            quizForsok: forsok,
            quizSnitt: forsok > 0 ? (quiz?.poengSum ?? 0) / 100 / forsok : null,
        };
    });
};

export interface DagPunkt {
    dag: string;
    visninger: number;
    besok: number;
    aktiviteter: number;
    sok: number;
    lesetid: number;
    lesokter: number;
    xp: number;
}

export const byggDagsserie = (raa: RaaStats, dager: string[]): DagPunkt[] =>
    dager.map((dag) => {
        const rad = raa.daily[dag] ?? {};
        return {
            dag,
            visninger: rad.views ?? 0,
            besok: rad.besok ? Object.keys(rad.besok).length : 0,
            aktiviteter: rad.activities ?? 0,
            sok: rad.searches ?? 0,
            lesetid: rad.readMs ?? 0,
            lesokter: rad.readSessions ?? 0,
            xp: rad.xp ?? 0,
        };
    });

/** Summerer et undertre (fag, aktivitetstyper) over et sett dager. */
export const summerDagsfelt = (
    raa: RaaStats,
    dager: string[],
    felt: 'subjects' | 'kinds' | 'fagAktivitet'
): Record<string, number> => {
    const ut: Record<string, number> = {};
    for (const dag of dager) {
        const bøtte = raa.daily[dag]?.[felt];
        if (!bøtte) continue;
        for (const [k, v] of Object.entries(bøtte)) ut[k] = (ut[k] ?? 0) + v;
    }
    return ut;
};

/** Unike besøkende over et sett dager - samme enhet på to dager teller én gang. */
export const unikeIPeriode = (raa: RaaStats, dager: string[]): number => {
    const sett = new Set<string>();
    for (const dag of dager) {
        for (const id of Object.keys(raa.daily[dag]?.besok ?? {})) sett.add(id);
    }
    return sett.size;
};

/**
 * Prosentvis endring mellom to like lange perioder. `null` når forrige periode
 * var tom - da sier «+100 %» ingenting fornuftig.
 */
export const endring = (naa: number, for_: number): number | null =>
    for_ > 0 ? Math.round(((naa - for_) / for_) * 100) : null;

export interface KlokkeCelle {
    ukedag: number;
    time: number;
    antall: number;
}

export const byggKlokkegrid = (clock: Record<string, Record<string, number>>): KlokkeCelle[] => {
    const celler: KlokkeCelle[] = [];
    for (let d = 0; d < 7; d++) {
        for (let t = 0; t < 24; t++) {
            celler.push({ ukedag: d, time: t, antall: clock[String(d)]?.[String(t)] ?? 0 });
        }
    }
    return celler;
};

// Norske navn på aktivitetstypene fra progresjonssystemet.
export const AKTIVITET_NAVN: Record<string, string> = {
    'article-read': 'Artikkel lest',
    'quiz-completed': 'Quiz fullført',
    'path-step-completed': 'Steg i læringssti',
    'path-completed': 'Læringssti fullført',
    'review-session': 'Repetisjonsøkt',
    'flashcard-session': 'Flashcards',
    'minigame-played': 'Mini-spill',
    'detective-solved': 'Detektivsak løst',
    'scenario-completed': 'Tidsreise fullført',
    'practice-game': 'Øvingsspill',
    'virkemiddel-exercise': 'Virkemiddel-oppgave',
    'microgame-played': 'Mikrospill',
    'philosophy-quest': 'Filosofi-oppdrag',
    'comparison-task': 'Sammenligning',
};

export const aktivitetNavn = (kind: string): string => AKTIVITET_NAVN[kind] ?? kind;

export interface BrukerSegment {
    nye: number;
    tilbakevendende: number;
    aktiveSiste7: number;
    aktiveSiste30: number;
    totalt: number;
}

const DAG_MS = 24 * 60 * 60 * 1000;

export const byggBrukersegment = (
    brukere: Record<string, UniqueUser>,
    naa: number = Date.now()
): BrukerSegment => {
    let nye = 0;
    let tilbakevendende = 0;
    let aktiveSiste7 = 0;
    let aktiveSiste30 = 0;

    for (const b of Object.values(brukere)) {
        const forste = b.firstSeen ?? 0;
        const sist = b.lastSeen ?? forste;
        // «Tilbakevendende» = har vært innom minst ett døgn etter første besøk.
        if (sist - forste > DAG_MS) tilbakevendende++;
        else nye++;
        if (naa - sist < 7 * DAG_MS) aktiveSiste7++;
        if (naa - sist < 30 * DAG_MS) aktiveSiste30++;
    }

    return {
        nye,
        tilbakevendende,
        aktiveSiste7,
        aktiveSiste30,
        totalt: Object.keys(brukere).length,
    };
};
