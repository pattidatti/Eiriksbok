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
    /** Når den skraper: hvor lavt den sikter (px over bakken, inne i nær-båndet). */
    skrapMål?: number;
    /** Av og til skraper den likevel: andel av tida, og margin da (bytter hvert 2. sekund). */
    skrap?: { andel: number; margin: number; bytt: number };
    /** Hvor langt fram (s) den ser etter bakken når den skraper. Kort = følger kammen tett. */
    horisont?: number;
    /** Handler bare hvert n-te tick (treg elev). */
    hver: number;
    /** Hvor ofte den tør den lave åpningen under knausen (0-1, når den kommer lavt inn).
     * Ellers tar den kongeveien. */
    under: number;
}

/** Neste knaus innen rekkevidde. */
function nesteKnaus(g: Game, rekke: number): Knaus | null {
    for (const k of g.ter.knauser)
        if (k.x1 > g.x - TUNING.ballong.halvBredde && k.x0 < g.x + rekke) return k;
    return null;
}

/**
 * Piloten spår: «Hvis jeg slipper nå og først fyrer neste gang jeg rekker det - går det bra?»
 * Går det ikke, holder den. Slik fyrer den før ryggen og slipper så fort det er trygt.
 */
function pilot(p: Pilot): (rng: Rng) => Grep {
    return (rng) => {
        let n = 0;
        let margin = p.margin;
        let bytt = 0;
        const vei = new Map<Knaus, boolean>();
        return (g) => {
            if (n++ % p.hver !== 0) return;
            if (p.skrap && g.t >= bytt) {
                bytt = g.t + p.skrap.bytt;
                margin = rng() < p.skrap.andel ? p.skrap.margin : p.margin;
            }
            const B = TUNING.ballong;
            const l = TUNING.løft;
            const knaus = nesteKnaus(g, fartVed(g.t) * 2);
            // Første gang den ser knausen: under bare hvis den tør og allerede ligger lavt.
            if (knaus && !vei.has(knaus)) vei.set(knaus, rng() < p.under && g.y > knaus.bunn + 20);
            const under = knaus ? vei.get(knaus)! : false;
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
                const maks = (mål > vy && vy >= 0 ? l.akselerasjonNed : l.akselerasjon) * dt;
                vy += Math.max(-maks, Math.min(maks, mål - vy));
                y = Math.max(B.tak + B.høyde, y + vy * dt);
                const x = veiVed(g.t + τ);
                for (const dx of [-B.halvBredde, 0, B.halvBredde]) {
                    let bunn = fastTopp(g.ter, x + dx);
                    let m = margin;
                    const iKnaus = knaus && x + dx > knaus.x0 - 150 && x + dx < knaus.x1 + 20;
                    if (iKnaus && !under) bunn = Math.min(bunn, knaus.topp);
                    if (iKnaus && under) {
                        // Under knausen: trangt, så lavere margin - og taket må ikke treffes.
                        m = 4;
                        if (x + dx > knaus.x0 - 20 && y - B.høyde < knaus.bunn + 2) tak = true;
                    }
                    if (y > bunn - m) fare = true;
                }
            }
            // Skrapegrepet: når den skraper, tapper den lett for å ligge i nær-båndet i stedet for å
            // falle til siste øyeblikk (som en elev som har lært å «fjære» knappen).
            let skrape = false;
            if (margin < TUNING.ganger.nær) {
                // Ser litt fram: hvor er bakken og ballongen om et øyeblikk?
                const h = p.horisont ?? 0.5;
                let foran = 540;
                for (let dx = -B.kurvHalv; dx <= fartVed(g.t) * h; dx += 8)
                    foran = Math.min(foran, fastTopp(g.ter, g.x + dx));
                skrape = foran - g.y - h * g.vy < (p.skrapMål ?? margin);
                if (
                    knaus &&
                    under &&
                    g.x > knaus.x0 - 60 &&
                    g.y - B.høyde - 0.15 * Math.min(0, g.vy) < knaus.bunn + 4
                )
                    skrape = false;
            }
            hold(g, (fare || skrape) && !tak);
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
            'Fyrer før hver rygg og skraper i nær-båndet for Ueland-gangeren. Tar den lave åpningen under knausen når den kommer lavt inn.',
        make: pilot({ margin: 4, skrapMål: 10, horisont: 0.2, hver: 1, under: 1 }),
    },
    nybegynner: {
        forventer: 'middels',
        beskrivelse:
            'Fyrer før ryggene med god margin. Skraper i strekk på 4 s (70 % av tida) og tør den lave åpningen under knausen bare hver tredje gang - ellers kongeveien.',
        make: pilot({
            margin: 50,
            skrap: { andel: 0.7, margin: 12, bytt: 4 },
            skrapMål: 10,
            horisont: 0.3,
            hver: 1,
            under: 0.3,
        }),
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
