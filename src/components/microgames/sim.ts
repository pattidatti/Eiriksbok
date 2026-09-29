// Simuleringskontrakten for mikrospill: spillreglene og robotene uten nettleser.
//
// Hvert nytt spill har en `<mappe>/sim.ts` med `export default` en SimSpec. Da kan
// scripts/sim-microgame.mts spille hundrevis av runder per robot på sekunder, og
// avgjøre det nettleseren før brukte en halvtime og to myntkast på:
//
//   - at vinnerroboten vinner nesten alltid, og at taperne, knappemoseren og den
//     passive nesten aldri gjør det,
//   - at dyktig spill gir flere poeng (ferdighetstrappen: taper < middels < vinner),
//   - spillfølelsen: valg per minutt og presset som stiger gjennom runden.
//
// Nettleser-selvspillet (scripts/playtest-microgame.mjs) sjekker bare det som trenger
// en nettleser: lasting, liv, tekst, Chromebook-ytelse, skjermbilder - og at nettleseren
// oppfører seg som simuleringen.
//
// Regel: simuleringen kjører SAMME kode som eleven får (game.ts + bots.ts), med samme
// tidssteg (PLAYTEST_DT) og samme robottakt (BOT_EVERY). Adapteren skal være tynn:
// lag spillet, ta ett steg, les av tilstanden. Ingen egne spillregler her.
//
// Referanse: stranda/sim.ts (seed i spillet), plottebordet/sim.ts (win/lose via IO).

import { BOT_EVERY, PLAYTEST_DT, type PlaytestBot, type PlaytestSnapshot } from './playtest';

export type Rng = () => number;

export interface SimBot<W> {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    variant?: string;
    /** Lager robotens grep for én runde. rng er seedet - bruk den i stedet for Math.random. */
    make: (rng: Rng) => (w: W) => void;
}

export interface SimSpec<W> {
    /** Samme id som i registry.ts. */
    id: string;
    /** Lengste mulige runde i spillsekunder. En runde som går lenger, er en feil. */
    maksSekunder: number;
    create: (seed: number, variant?: string) => W;
    /** Ett tidssteg (dt = PLAYTEST_DT) - det samme løkka i nettleseren gjør per steg. */
    step: (w: W, dt: number) => void;
    /** Samme felt som usePlaytest-snapshotet. fase er 'spiller' til runden er avgjort. */
    snapshot: (w: W) => PlaytestSnapshot;
    /** Samme navn og forventning som robotene i usePlaytest. Passiv testes alltid i tillegg. */
    bots: Record<string, SimBot<W>>;
}

/** Deterministisk tilfeldighet (mulberry32). */
export function seeded(seed: number): Rng {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export interface SimRound {
    bot: string;
    seed: number;
    fase: 'vunnet' | 'tapt' | 'tidsavbrudd';
    poeng: number;
    tid: number;
    årsak?: string;
    /** Valg per spilt minutt (null om spillet ikke teller valg). */
    valgPerMin: number | null;
    /** Snittpress i første, midterste og siste tredjedel (null om spillet ikke måler press). */
    press: [number, number, number] | null;
    /** Framdrift og poeng hvert hele spillsekund - nettleseren sammenlignes mot disse. */
    spor: { tid: number; framdrift: number; poeng: number }[];
    feil?: string;
}

/**
 * Spiller én runde. Math.random byttes mot en seedet generator mens runden går, så
 * spill som bruker Math.random direkte også blir gjentakbare.
 */
export function simRound<W>(spec: SimSpec<W>, botName: string | null, seed: number): SimRound {
    const orig = Math.random;
    Math.random = seeded(seed ^ 0x9e3779b9);
    try {
        const bot = botName ? spec.bots[botName] : null;
        const w = spec.create(seed, bot?.variant);
        const act = bot ? bot.make(seeded(seed + 1)) : null;
        const spor: SimRound['spor'] = [];
        const press: { tid: number; p: number }[] = [];
        let snap = spec.snapshot(w);
        let tid = 0;
        let next = 0;
        let nextSec = 0;
        const t0 = snap.tid ?? 0;
        const v0 = snap.valg ?? null;
        while (snap.fase === 'spiller' && tid <= spec.maksSekunder) {
            if (act && tid >= next - 1e-9) {
                act(w);
                next += BOT_EVERY;
            }
            spec.step(w, PLAYTEST_DT);
            tid += PLAYTEST_DT;
            snap = spec.snapshot(w);
            if (tid >= nextSec) {
                spor.push({ tid: nextSec, framdrift: snap.framdrift, poeng: snap.poeng });
                if (typeof snap.press === 'number') press.push({ tid, p: snap.press });
                nextSec += 1;
            }
        }
        const span = (snap.tid ?? tid) - t0;
        const valgPerMin =
            v0 !== null && typeof snap.valg === 'number' && span > 10
                ? ((snap.valg - v0) / span) * 60
                : null;
        let thirds: SimRound['press'] = null;
        if (press.length >= 6) {
            const T = press[press.length - 1].tid;
            const avg = (k: number) => {
                const xs = press
                    .filter((x) => x.tid >= (T * k) / 3 && x.tid <= (T * (k + 1)) / 3)
                    .map((x) => x.p);
                return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
            };
            thirds = [avg(0), avg(1), avg(2)];
        }
        return {
            bot: botName ?? 'passiv',
            seed,
            fase: snap.fase === 'spiller' || snap.fase === 'meny' ? 'tidsavbrudd' : snap.fase,
            poeng: snap.poeng,
            tid: Math.round(tid * 10) / 10,
            årsak: snap.årsak,
            valgPerMin,
            press: thirds,
            spor,
        };
    } catch (e) {
        return {
            bot: botName ?? 'passiv',
            seed,
            fase: 'tidsavbrudd',
            poeng: 0,
            tid: 0,
            valgPerMin: null,
            press: null,
            spor: [],
            feil: String(e instanceof Error ? e.stack : e),
        };
    } finally {
        Math.random = orig;
    }
}

/**
 * Stille lyd: et objekt der hvert felt er en funksjon som ikke gjør noe (sfx.win(),
 * sfx.turn(2) ...). Kall returnerer undefined, så bruk den bare for lyd og effekter -
 * aldri for noe spillreglene leser av, som timeScale.
 */
export function silent<T>(): T {
    const fn = () => undefined;
    return new Proxy({}, { get: () => fn }) as T;
}
