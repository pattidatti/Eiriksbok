// Frø-styrt tilfeldighet for anbefalingsmotoren. Poenget er *stabil variasjon*:
// samme frø gir alltid samme rekkefølge (så en montert side ikke stokker om på
// hver render), men frøet byttes ved neste sidevisning slik at feeden føles
// levende i stedet for identisk hver gang. Rene funksjoner - `makeVisitSeed`
// er det eneste unntaket (leser en teller i localStorage) og kalles kun fra
// hooken, aldri inne i motoren.

// Liten, rask PRNG (mulberry32). Deterministisk: gitt samme frø får du samme
// sekvens med tall i [0, 1).
export const mulberry32 = (seed: number): (() => number) => {
    let a = seed >>> 0;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

// Enkel streng-hash (FNV-1a-aktig) - brukes til å blande dagsstrengen inn i
// frøet, så feeden også roterer over døgn.
export const hashString = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
};

const VISIT_KEY = 'gravity_rec_visit';

// Lager et frø som er stabilt innenfor én sidevisning, men roterer mellom
// besøk: en teller i localStorage økes for hvert kall, og blandes med dagens
// dato. Kalles fra en useState-initialiser (kjøres nøyaktig én gang per mount).
export const makeVisitSeed = (day: string = new Date().toISOString().slice(0, 10)): number => {
    let visit = 0;
    try {
        const raw = localStorage.getItem(VISIT_KEY);
        visit = raw ? (parseInt(raw, 10) || 0) : 0;
        localStorage.setItem(VISIT_KEY, String(visit + 1));
    } catch {
        // localStorage utilgjengelig (privat modus e.l.) - fall tilbake til
        // et tidsbasert frø. Da roterer feeden fortsatt mellom sidevisninger.
        visit = Date.now();
    }
    return (hashString(day) ^ (visit * 0x9e3779b1)) >>> 0;
};

// Trekker inntil `k` elementer uten tilbakelegging, vektet etter `w`
// (høyere vekt = større sjanse). Bevarer variasjon: sterke treff vinner
// oftest, men ikke alltid, så feeden føles ny uten å bli tilfeldig rot.
export const weightedSample = <T>(
    items: { v: T; w: number }[],
    k: number,
    rng: () => number
): T[] => {
    const pool = items.filter((it) => it.w > 0).map((it) => ({ ...it }));
    const out: T[] = [];
    while (out.length < k && pool.length > 0) {
        const total = pool.reduce((sum, it) => sum + it.w, 0);
        let r = rng() * total;
        let idx = 0;
        for (let i = 0; i < pool.length; i++) {
            r -= pool[i].w;
            if (r <= 0) {
                idx = i;
                break;
            }
            idx = i;
        }
        out.push(pool[idx].v);
        pool.splice(idx, 1);
    }
    return out;
};

// Stokker om innenfor «nivåer»: elementer med tilnærmet lik nøkkel (innenfor
// `eps`) kan bytte plass, men et element kan aldri hoppe forbi et med en klart
// høyere nøkkel. Slik roterer jevnbyrdige kort mellom besøk uten at et sterkt
// kort synker langt ned. `items` trenger ikke være forhåndssortert.
export const shuffleWithinTiers = <T>(
    items: T[],
    key: (t: T) => number,
    eps: number,
    rng: () => number
): T[] =>
    items
        .map((v) => ({ v, k: key(v) + (rng() - 0.5) * eps }))
        .sort((a, b) => b.k - a.k)
        .map((x) => x.v);
