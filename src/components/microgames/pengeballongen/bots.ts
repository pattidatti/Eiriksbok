// Robotene. De bruker det samme grepet som eleven (hold i rules.ts) - ingen snarveier.
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import type { PlaytestBot } from '../playtest';
import { BOT_EVERY } from '../playtest';
import { hold, stig, synk } from './rules';
import { fartVed, fastTopp, veiVed, type Knaus } from './terrain';
import type { Game } from './state';
import { TUNING } from './tuning';

type Grep = (g: Game) => void;

interface Pilot {
    /** Hvor mange px over bakken roboten vil ligge. */
    margin: number;
    /** Handler bare hvert n-te tick (treg elev). */
    hver: number;
    /** Ved åpne veiskiller: under knausen (billig) eller over (dyrt). */
    under: boolean;
}

/** Neste knaus uten bom innen rekkevidde. */
function åpenKnaus(g: Game, rekke: number): Knaus | null {
    for (const k of g.ter.knauser)
        if (!k.bom && k.x1 > g.x - TUNING.ballong.halvBredde && k.x0 < g.x + rekke) return k;
    return null;
}

/**
 * Piloten spår: «Hvis jeg slipper nå og først fyrer neste gang jeg rekker det - går det bra?»
 * Går det ikke, holder den. Slik fyrer den før ryggen og slipper så fort det er trygt.
 */
function pilot(p: Pilot): () => Grep {
    return () => {
        let n = 0;
        return (g) => {
            if (n++ % p.hver !== 0) return;
            const B = TUNING.ballong;
            const l = TUNING.løft;
            const knaus = åpenKnaus(g, fartVed(g.t) * 2);
            const vent = BOT_EVERY * p.hver;
            const dt = 0.05;
            const sy = synk(g);
            let y = g.y;
            let vy = g.vy;
            let varme = g.varme;
            let fare = false;
            let tak = false;
            for (let τ = 0; τ < vent + 1.6 && !fare; τ += dt) {
                const på = τ >= vent;
                varme += ((på ? 1 : 0) - varme) * (1 - Math.exp(-dt / l.varmeTau));
                const mål = -stig(y) * varme + sy * (1 - varme);
                const maks = l.akselerasjon * dt;
                vy += Math.max(-maks, Math.min(maks, mål - vy));
                y = Math.max(B.tak + B.høyde, y + vy * dt);
                const x = veiVed(g.t + τ);
                for (const dx of [-B.halvBredde, 0, B.halvBredde]) {
                    let bunn = fastTopp(g.ter, x + dx);
                    let margin = p.margin;
                    const iKnaus = knaus && x + dx > knaus.x0 - 20 && x + dx < knaus.x1 + 20;
                    if (iKnaus && !p.under) bunn = Math.min(bunn, knaus.topp);
                    if (iKnaus && p.under) {
                        // Under knausen: trangt, så lavere margin - og taket må ikke treffes.
                        margin = 4;
                        if (y - B.høyde < knaus.bunn + 2) tak = true;
                    }
                    if (y > bunn - margin) fare = true;
                }
            }
            hold(g, fare && !tak);
        };
    };
}

export interface BotDef {
    forventer: PlaytestBot['forventer'];
    tilfeldig?: boolean;
    beskrivelse: string;
    make: (rng: Rng) => Grep;
}

export const BOTS: Record<string, BotDef> = {
    flink: {
        forventer: 'vinner',
        beskrivelse:
            'Fyrer før hver rygg og skraper tett over kammene for Ueland-gangeren. Tar den billige dalen i 1884.',
        make: pilot({ margin: 16, hver: 1, under: true }),
    },
    nybegynner: {
        forventer: 'middels',
        beskrivelse: 'Fyrer før ryggene, men med god margin og treg hånd (hvert tredje tick).',
        make: pilot({ margin: 48, hver: 3, under: false }),
    },
    sløseren: {
        forventer: 'taper',
        beskrivelse: 'Flyr høyt hele tida for å være trygg - bryr seg ikke om hva bøndene betaler.',
        make: () => (g) => hold(g, g.y > 150),
    },
    gniten: {
        forventer: 'taper',
        beskrivelse: 'Holder aldri - vil ikke gi regjeringen penger, heller ikke til fjellet.',
        make: () => (g) => hold(g, false),
    },
    tilfeldig: {
        forventer: 'taper',
        tilfeldig: true,
        beskrivelse: 'Trykker og slipper tilfeldig uten å se på fjellene eller stabelen.',
        make: (rng) => (g) => {
            if (rng() < 0.35) hold(g, !g.hold);
        },
    },
};
