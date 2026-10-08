// Kringkastingsplanen: hva som går i hver sal akkurat nå. Ingen server.
//
// Alle i samme sal skal være på samme sted i samme forelesning. Det får vi gratis ved
// å regne alt ut fra klokka: spillelisten er fast for en uke (stokket med uka som
// frø), og plassen i den er (nå - ukestart) mod lengden av lista. Hver forelesning
// følges av et friminutt. Varighetene kommer fra program.json, som regnes med de
// samme funksjonene som avspilleren bruker (tid.ts).
//
// Uka starter mandag 00:00 UTC for alle, uansett tidssone, så to elever på hver sin
// maskin alltid får samme plan.

import { FRIMINUTT_MS } from './tid';

export interface ProgramPost {
    /** Stien under fag, f.eks. 'historie/vikingtiden/rikssamlingen'. */
    sti: string;
    tittel: string;
    emneTittel: string;
    /** URL til artikkelen. */
    kilde: string;
    /** URL til manuset (skrevet eller automatisk). */
    fil: string;
    /** URL til artikkelens JSON, for spørsmålene etter forelesningen. */
    artikkel: string;
    /** Forelesningens lengde i ms, uten friminuttet etter. */
    varighet: number;
    type: 'manus' | 'auto';
}

export interface Program {
    generert: string;
    saler: Record<string, ProgramPost[]>;
}

export interface Sending {
    post: ProgramPost;
    /** Når forelesningen startet / slutter (epoch ms). */
    start: number;
    slutt: number;
    /** Når friminuttet etter den er over, og neste forelesning starter. */
    nesteStart: number;
    neste: ProgramPost;
    /** Sant når forelesningen er ferdig og salen har friminutt. */
    friminutt: boolean;
}

const UKE_MS = 7 * 24 * 3600 * 1000;
/** En mandag 00:00 UTC. Alle uker telles fra denne. */
const EPOKE = Date.UTC(2026, 0, 5);

function frøHash(s: string) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function stokk<T>(liste: T[], frø: number): T[] {
    const ut = liste.slice();
    let s = frø || 1;
    for (let i = ut.length - 1; i > 0; i--) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const j = s % (i + 1);
        [ut[i], ut[j]] = [ut[j], ut[i]];
    }
    return ut;
}

interface Ukeplan {
    uke: number;
    ukestart: number;
    rekkefolge: ProgramPost[];
    /** Starttid for hver post i ms fra ukestart, innenfor én runde. */
    starter: number[];
    runde: number;
}

const cache = new Map<string, Ukeplan>();

function ukeplan(salId: string, poster: ProgramPost[], naa: number): Ukeplan {
    const uke = Math.floor((naa - EPOKE) / UKE_MS);
    const nokkel = `${salId}:${uke}:${poster.length}`;
    const lagret = cache.get(nokkel);
    if (lagret) return lagret;
    const rekkefolge = stokk(poster, frøHash(`${salId}:${uke}`));
    const starter: number[] = [];
    let t = 0;
    for (const p of rekkefolge) {
        starter.push(t);
        t += p.varighet + FRIMINUTT_MS;
    }
    const plan = { uke, ukestart: EPOKE + uke * UKE_MS, rekkefolge, starter, runde: t };
    cache.set(nokkel, plan);
    return plan;
}

/** Hva som går i salen ved tidspunktet `naa`. */
export function sendingNaa(salId: string, poster: ProgramPost[], naa = Date.now()): Sending | null {
    if (!poster.length) return null;
    const plan = ukeplan(salId, poster, naa);
    const sidenStart = naa - plan.ukestart;
    const rundeStart = plan.ukestart + Math.floor(sidenStart / plan.runde) * plan.runde;
    const iRunden = sidenStart % plan.runde;

    // Binærsøk etter siste post som har startet.
    let lo = 0;
    let hi = plan.starter.length - 1;
    while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (plan.starter[mid] <= iRunden) lo = mid;
        else hi = mid - 1;
    }
    const post = plan.rekkefolge[lo];
    const start = rundeStart + plan.starter[lo];
    const slutt = start + post.varighet;
    const nesteStart = slutt + FRIMINUTT_MS;
    const neste = plan.rekkefolge[(lo + 1) % plan.rekkefolge.length];
    return { post, start, slutt, nesteStart, neste, friminutt: naa >= slutt };
}

/** «12 min igjen», «1 min igjen», «snart ferdig». */
export function tidIgjen(ms: number): string {
    const min = Math.ceil(ms / 60000);
    if (ms < 45000) return 'snart ferdig';
    return `${min} min igjen`;
}

export function klokkeslett(ms: number): string {
    return new Date(ms).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
}

let programLaster: Promise<Program> | null = null;

/** program.json lages av scripts/generate-forelesninger.mts i scan:content. */
export function hentProgram(): Promise<Program> {
    if (!programLaster) {
        programLaster = fetch('/data/forelesninger/program.json').then((r) => {
            if (!r.ok) throw new Error('Fant ikke forelesningsprogrammet.');
            return r.json();
        });
        programLaster.catch(() => (programLaster = null));
    }
    return programLaster;
}
