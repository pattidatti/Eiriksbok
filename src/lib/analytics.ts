// Ett sted for all bruksmåling.
//
// Før lå målingene spredt: useAnalytics telte visninger, useReadingTime skrev
// lesetid, usePresence skrev tilstedeværelse, og SearchOverlay hadde sin egen
// firebase-import. Ingen av dem visste om hverandre, og ingen av dem hadde en
// tidsakse - `analytics/views` er bare et tall, så det gikk ikke an å se om
// bruken steg eller falt, bare hva totalen var.
//
// Denne modulen samler skrivingen og legger på dagsbøtter. Alt er
// «best effort»: en måling som ikke går gjennom (ingen nett, blokkert av
// regler på localhost) skal aldri gi feil i konsollen eller stoppe eleven.
//
// Firebase hentes lazy (se firebaseLazy.ts) slik at ingen måling ligger i
// pakken som blokkerer første tegning.
//
// Stiene som skrives - alle under `analytics/` - er dokumentert i
// docs/STATISTIKK.md. Nye stier må også åpnes i database.rules.json.

import { getFirebase } from './firebaseLazy';

const ANON_ID_KEY = 'gravity_anon_id';
const BESOK_DAG_KEY = 'gravity_besok_dag';

/** Firebase-nøkler tåler ikke `.`, `#`, `$`, `[`, `]` eller `/`. */
export const safeKey = (raw: string): string =>
    raw.replace(/^\//, '').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 200);

/** 'YYYY-MM-DD' i lokal tid - samme dagsbegrep som progresjonssystemet. */
export const dagsnokkel = (d: Date = new Date()): string => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const generateUUID = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });

/** Anonym, lokal id. Samme nøkkel som usePresence har brukt hele tiden. */
export const getAnonId = (): string => {
    try {
        let id = localStorage.getItem(ANON_ID_KEY);
        if (!id) {
            id = generateUUID();
            localStorage.setItem(ANON_ID_KEY, id);
        }
        return id;
    } catch {
        return 'ukjent';
    }
};

export type Enhetsklasse = 'mobil' | 'nettbrett' | 'chromebook' | 'datamaskin';

/**
 * Grovsortering av enhet. Chromebook sjekkes før datamaskin, for det er den
 * viktigste gruppen her: layouten skal tåle 1366x768, og da vil vi vite hvor
 * mange som faktisk sitter på en.
 */
export const enhetsklasse = (ua: string): Enhetsklasse => {
    const s = ua.toLowerCase();
    if (s.includes('cros')) return 'chromebook';
    if (/ipad|tablet|playbook|silk/.test(s)) return 'nettbrett';
    if (s.includes('android') && !s.includes('mobile')) return 'nettbrett';
    if (/mobi|iphone|ipod|android|phone/.test(s)) return 'mobil';
    return 'datamaskin';
};

/** Nettleserfamilie, grovt. Brukes bare til å se hva klasserommet kjører. */
export const nettleser = (ua: string): string => {
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\/|Opera/.test(ua)) return 'Opera';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Chrome\//.test(ua)) return 'Chrome';
    if (/Safari\//.test(ua)) return 'Safari';
    return 'Annet';
};

/**
 * Fag-id ut av en sti: '/historie/vikingtiden/rikssamlingen' -> 'historie'.
 * Ruter som ikke er fag ('/oving/quiz', '/tidslinje') samles under 'verktoy',
 * slik at fagfordelingen ikke later som en øvingsside er et fag.
 */
const FAG = ['historie', 'norsk', 'krle', 'samfunnskunnskap', 'samfunnsfag', 'musikk'];
export const fagFraSti = (sti: string): string => {
    const forste = sti.replace(/^\//, '').split('/')[0] ?? '';
    return FAG.includes(forste) ? forste : 'verktoy';
};

// Én samleskriving per hendelse i stedet for fire enkeltskrivinger: RTDB tar
// et objekt med relative stier, og alt går i én runde. Feiler én sti på
// regler, ryker hele oppdateringen - derfor må alle stiene som brukes her ha
// skrivetilgang i database.rules.json.
//
// `increment` bor i firebase/database og kan ikke kalles synkront på kallstedet
// uten å dra modulen inn i den eager pakken igjen. Derfor legger kallstedene
// igjen en markør, og `skriv` bytter den ut i det øyeblikket modulen er lastet.
const INCR = Symbol('increment');
type Markor = { [INCR]: number };
type Verdi = Markor | string | number;

const incr = (n: number): Markor => ({ [INCR]: n });
const erMarkor = (v: Verdi): v is Markor => typeof v === 'object' && v !== null && INCR in v;

const skriv = (oppdatering: Record<string, Verdi>): void => {
    if (Object.keys(oppdatering).length === 0) return;
    void getFirebase()
        .then(({ db, ref, update, increment }) => {
            const ferdig: Record<string, unknown> = {};
            for (const [sti, verdi] of Object.entries(oppdatering)) {
                ferdig[sti] = erMarkor(verdi) ? increment(verdi[INCR]) : verdi;
            }
            return update(ref(db, 'analytics'), ferdig);
        })
        .catch(() => {
            /* måling er alltid valgfri */
        });
};

/** Sidevisning. `id` er stien uten ledende skråstrek, slik useAnalytics har brukt. */
export const sporVisning = (id: string, sti: string): void => {
    const dag = dagsnokkel();
    const naa = new Date();
    skriv({
        [`views/${safeKey(id)}`]: incr(1),
        [`daily/${dag}/views`]: incr(1),
        [`daily/${dag}/subjects/${fagFraSti(sti)}`]: incr(1),
        [`clock/${naa.getDay()}/${naa.getHours()}`]: incr(1),
    });
};

/** Lesetid i millisekunder for én side. Kalles av useReadingTime. */
export const sporLesetid = (sti: string, varighet: number): void => {
    const dag = dagsnokkel();
    void getFirebase()
        .then(({ db, ref, push, update, serverTimestamp, increment }) =>
            Promise.all([
                push(ref(db, `analytics/reading_time/${safeKey(sti)}`), {
                    duration: varighet,
                    timestamp: serverTimestamp(),
                    path: sti,
                }),
                update(ref(db, 'analytics'), {
                    [`daily/${dag}/readMs`]: increment(varighet),
                    [`daily/${dag}/readSessions`]: increment(1),
                }),
            ])
        )
        .catch(() => {});
};

/** Én gang per døgn per enhet: dagens unike besøkende + enhetsfordeling. */
export const sporDagensBesok = (): void => {
    const dag = dagsnokkel();
    let sisteDag: string | null = null;
    try {
        sisteDag = localStorage.getItem(BESOK_DAG_KEY);
    } catch {
        /* privat modus - da teller vi heller én gang for mye enn ingen */
    }
    if (sisteDag === dag) return;
    try {
        localStorage.setItem(BESOK_DAG_KEY, dag);
    } catch {
        /* ignorer */
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    skriv({
        [`daily/${dag}/besok/${safeKey(getAnonId())}`]: 1,
        [`devices/${enhetsklasse(ua)}`]: incr(1),
        [`browsers/${safeKey(nettleser(ua))}`]: incr(1),
    });
};

/** Fullført aktivitet fra progresjonssystemet (quiz, sti-steg, spill, ...). */
export const sporAktivitet = (kind: string, fag: string | undefined, xp: number): void => {
    const dag = dagsnokkel();
    const oppdatering: Record<string, Verdi> = {
        [`activity/${safeKey(kind)}`]: incr(1),
        [`daily/${dag}/activities`]: incr(1),
        [`daily/${dag}/kinds/${safeKey(kind)}`]: incr(1),
    };
    if (xp > 0) oppdatering[`daily/${dag}/xp`] = incr(xp);
    if (fag) oppdatering[`daily/${dag}/fagAktivitet/${safeKey(fag)}`] = incr(1);
    skriv(oppdatering);
};

/**
 * Quizresultat per artikkel. Vi lagrer summen av poengene, ikke snittet: da
 * kan snittet regnes ut i ettertid uten at rekkefølgen på rundene påvirker
 * tallet. Poengene lagres som heltall 0-100 fordi RTDB-increment er tryggest
 * med heltall.
 */
export const sporQuiz = (quizId: string, score: number): void => {
    const noekkel = safeKey(quizId);
    if (!noekkel) return;
    const oppdatering: Record<string, Verdi> = {
        [`quiz/${noekkel}/forsok`]: incr(1),
        [`quiz/${noekkel}/poengSum`]: incr(Math.round(score * 100)),
    };
    if (score === 1) oppdatering[`quiz/${noekkel}/perfekte`] = incr(1);
    skriv(oppdatering);
};

/**
 * Søk. Treffløse søk får en egen teller - det er den mest direkte listen over
 * innhold som mangler, sortert etter hvor mange som lette etter det.
 */
export const sporSok = (query: string, resultsCount: number, type: 'text' | 'tag'): void => {
    const rensket = query.trim().slice(0, 200);
    if (rensket.length < 3) return;
    const dag = dagsnokkel();

    void getFirebase()
        .then(({ db, ref, push, update, serverTimestamp, increment }) => {
            const oppdatering: Record<string, unknown> = {
                [`daily/${dag}/searches`]: increment(1),
            };
            if (resultsCount === 0) {
                const n = safeKey(rensket.toLowerCase().replace(/\s+/g, '_'));
                if (n) {
                    oppdatering[`zero_hits/${n}/antall`] = increment(1);
                    oppdatering[`zero_hits/${n}/query`] = rensket;
                    oppdatering[`zero_hits/${n}/sist`] = serverTimestamp();
                }
            }
            return Promise.all([
                push(ref(db, 'analytics/searches'), {
                    query: rensket,
                    type,
                    timestamp: serverTimestamp(),
                    resultsCount,
                }),
                update(ref(db, 'analytics'), oppdatering),
            ]);
        })
        .catch(() => {});
};
