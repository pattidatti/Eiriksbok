// Robotene i Brevnettet. De bruker samme grep som eleven (bind i game.ts) og ser bare det
// eleven ser: hvilke stuer som lyser, trådene, ringene, lensmannen og nøstene.

import type { PlaytestBot } from '../playtest';
import type { Rng } from '../sim';
import { bind, kanBinde, mørke, tente, type Game } from './game';
import { HAUGE, avstand, iFare, tenteNaboer, type Stue } from './net';

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => (g: Game) => void;
}

/** Bind stua til nærmeste tente stue den kan nå (helst en annen som også er i fare). */
function bindTilNabo(g: Game, s: Stue, ikke: number[] = []) {
    const kandidater = tente(g)
        .filter((o) => o.id !== s.id && !ikke.includes(o.id) && kanBinde(g, s.id, o.id))
        .sort((a, b) => avstand(a, s) - avstand(b, s));
    const fare = new Set(iFare(g.stuer, g.tråder).map((x) => x.id));
    const o = kandidater.find((k) => fare.has(k.id) && avstand(k, s) < 4) ?? kandidater[0];
    return o ? bind(g, s.id, o.id) : false;
}

/** Den mørke stua som haster mest: fullest ring, så nærmest en tent stue. */
function viktigsteMørke(g: Game) {
    const lys = tente(g);
    const nærTent = (s: Stue) => Math.min(99, ...lys.map((o) => avstand(o, s)));
    return mørke(g)
        .filter((s) => kanBinde(g, HAUGE, s.id))
        .sort((a, b) => b.ring - a.ring || nærTent(a) - nærTent(b))[0];
}

interface Vett {
    /** Gjør et grep bare hvert n-te tick. */
    hver: number;
    /** Binder stuer som bare henger på Hauge, til en tent nabo (fagregelen). */
    binder: boolean;
    /** Gir stuer med bare én tent nabo en tråd til (ringer, ikke rekker). */
    dobbel: boolean;
    /** Svarer på en rød tråd i fengselsårene (omvei eller knyt om). */
    knytt: boolean;
    /** Holder så mange nøster i reserve før den tenner en ny stue. */
    reserve: number;
}

function klok(v: Vett) {
    return () => {
        let n = 0;
        return (g: Game) => {
            if (++n % v.hver) return;
            const fare = iFare(g.stuer, g.tråder);
            // 1) Redd stuer som bare henger på Hauge (eller mistet naboen sin).
            if (v.binder && fare.length && g.nøster >= 1) {
                const s = fare.sort((a, b) => avstand(a, g.hauge) - avstand(b, g.hauge))[0];
                if (bindTilNabo(g, s)) return;
            }
            // 2) Tråd under kniven: gi endepunktene en ekstra tråd.
            if (v.knytt) {
                // Bare tråder der klippet faktisk får en stue til å rakne.
                const t = g.tråder.find(
                    (x) =>
                        x.kutt > 0 &&
                        [x.a, x.b].some(
                            (id) =>
                                g.stuer.get(id)?.lys &&
                                tenteNaboer(g.stuer, g.tråder, id) <= 1
                        )
                );
                if (t) {
                    for (const id of [t.a, t.b]) {
                        const s = g.stuer.get(id);
                        if (s?.lys && tenteNaboer(g.stuer, g.tråder, id) <= 1)
                            if (bindTilNabo(g, s, [t.a, t.b])) return;
                    }
                    // Ingen omvei: knyt om den merkede tråden.
                    if (bind(g, t.a, t.b)) return;
                }
            }
            // 3) Tenn en mørk stue via Hauge.
            const m = viktigsteMørke(g);
            const reserve = v.binder && tente(g).length > 0 ? v.reserve : 0;
            if (m && g.nøster >= 1 + reserve) {
                if (bind(g, HAUGE, m.id)) return;
            }
            // 4) Overskudd: gjør nettet tettere (en stue med to tråder tåler ett klipp).
            // Ekstra tråder trengs først når lensmannen klipper (fra 1803 holder den av garnet).
            const fritt = g.klipper ? 0 : g.brett >= 3 ? 2 : 6;
            if (v.dobbel && g.nøster > fritt) {
                const svak = tente(g)
                    .filter((s) => tenteNaboer(g.stuer, g.tråder, s.id) === 1)
                    .sort((a, b) => avstand(a, g.hauge) - avstand(b, g.hauge))[0];
                if (svak) {
                    const nabo = tente(g).find(
                        (o) =>
                            o.id !== svak.id &&
                            g.tråder.some(
                                (t) =>
                                    (t.a === svak.id && t.b === o.id) ||
                                    (t.b === svak.id && t.a === o.id)
                            )
                    );
                    bindTilNabo(g, svak, nabo ? [nabo.id] : []);
                }
            }
        };
    };
}

export const BOTS: Record<string, BotDef> = {
    binder: {
        forventer: 'vinner',
        beskrivelse:
            'Tenner stuer via Hauge, binder hver ny stue til en tent nabo med en gang og gir svake stuer en tråd til (ringer, ikke rekker).',
        make: klok({ hver: 1, binder: true, dobbel: true, knytt: true, reserve: 1 }),
    },
    halvgod: {
        forventer: 'middels',
        beskrivelse:
            'Følger regelen og binder stuene sammen, svarer på røde tråder, men er treg (ett grep i sekundet) og lager aldri ekstra tråder på forhånd.',
        make: klok({ hver: 5, binder: true, dobbel: false, knytt: true, reserve: 1 }),
    },
    'bare-hauge': {
        forventer: 'taper',
        beskrivelse: 'Binder alt bare til Hauge og bryr seg ikke om tråder mellom stuene.',
        make: klok({ hver: 1, binder: false, dobbel: false, knytt: false, reserve: 0 }),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Drar tråder mellom tilfeldige prikker uten plan.',
        make: (rng) => (g) => {
            if (rng() < 0.5) return;
            const ids = [HAUGE, ...g.stuer.keys()];
            const a = ids[Math.floor(rng() * ids.length)];
            const b = ids[Math.floor(rng() * ids.length)];
            bind(g, a, b);
        },
    },
};
