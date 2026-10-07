// Robotene. De bruker det samme grepet som eleven (hold i rules.ts) - ingen snarveier.
// Én kilde: sim.ts og usePlaytest i komponenten leser begge herfra.

import type { Rng } from '../sim';
import type { PlaytestBot } from '../playtest';
import { BOT_EVERY } from '../playtest';
import { fly, hold, ror, rorMål, synk } from './rules';
import { fartVed, fastTopp, knausVed, veiVed, type Knaus } from './terrain';
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
    /** Hvor lenge (s) den regner med at det kan gå før neste grep. Lenger enn robottakten, så
     * et sent grep (en ujevn tommel) ikke betyr krasj: roboten ser på tilstanden, ikke klokka. */
    vent?: number;
    /** Ekstra margin per px/s fart nedover (s): jo fortere den faller, jo tidligere fyrer den. */
    fartMargin?: number;
    /** Hvor ofte den tør den lave åpningen under knausene i 1882-1883 (0-1, når den kommer
     * lavt inn). Ellers flyr den over. */
    under: number;
    /** Etter riksretten: hvor langt foran (px) porten må være før den styrer ned. 0 = aldri. */
    ror?: number;
}

/** Neste knaus innen rekkevidde. */
function nesteKnaus(g: Game, rekke: number): Knaus | null {
    for (const k of g.ter.knauser)
        if (k.x1 > g.x - TUNING.ballong.halvBredde && k.x0 < g.x + rekke) return k;
    return null;
}

type Styring = 'opp' | 'ned' | 'rett';

/**
 * Rorstrekket: velg det første grepet som er trygt selv om neste grep kommer sent (`vent`).
 * Er en port nær, vil den ned under fjellet; ellers rett fram, og opp når bakken kommer.
 */
function rorValg(g: Game, rekke: number, vent: number): Styring {
    const B = TUNING.ballong;
    const port = g.ter.knauser.find((k) => k.port && k.x1 + B.halvBredde > g.x);
    const etter: Styring[] = ['rett', 'opp', 'ned'];
    const trygg = (s: Styring) => etter.some((s2) => plan(s, s2));
    const plan = (s: Styring, s2: Styring) => {
        const f = { y: g.y, vy: g.vy, varme: g.varme };
        for (let τ = 0; τ < vent + 0.8; τ += 0.05) {
            const a = τ < vent ? s : s2;
            const x = veiVed(g.t + τ);
            fly(f, a === 'opp', a === 'ned', true, 0, 0.05, rorMål(g.ter, x));
            for (const dx of [-B.kurvHalv, 0, B.kurvHalv]) if (f.y > fastTopp(g.ter, x + dx) - 8) return false;
            for (const dx of [-B.halvBredde, 0, B.halvBredde]) {
                const k = knausVed(g.ter, x + dx);
                if (k && f.y > k.topp && f.y - B.høyde < k.bunn + 6) return false;
            }
        }
        return true;
    };
    const mål = TUNING.ror.dalY - 24;
    const ned = port && port.x0 - g.x < rekke && g.y < mål - 12;
    const rekkefølge: Styring[] = ned ? ['ned', 'rett', 'opp'] : ['rett', 'opp', 'ned'];
    return rekkefølge.find(trygg) ?? (port && g.x > port.x0 - B.halvBredde ? 'rett' : 'opp');
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
        let sist = -1;
        return (g) => {
            // Ny sjanse: tida er spolt tilbake. Roboten bestemmer seg på nytt, som en elev.
            if (g.t < sist) {
                bytt = 0;
                vei.clear();
            }
            sist = g.t;
            if (n++ % p.hver !== 0) return;
            if (p.skrap && g.t >= bytt) {
                bytt = g.t + p.skrap.bytt;
                margin = rng() < p.skrap.andel ? p.skrap.margin : p.margin;
            }
            const B = TUNING.ballong;
            const knaus = nesteKnaus(g, fartVed(g.t) * 2);
            // Første gang den ser knausen: under bare hvis den tør og allerede ligger lavt.
            if (knaus && !vei.has(knaus)) vei.set(knaus, rng() < p.under && g.y > knaus.bunn + 20);
            const under = knaus ? vei.get(knaus)! : false;
            const vent = Math.max(BOT_EVERY * p.hver, p.vent ?? 0.75);
            const dt = 0.05;
            const sy = synk(g);
            /** Spår: slipp til neste trykk, så fyr. Går det bra? */
            const spå = (medRor = false) => {
                const f = { y: g.y, vy: g.vy, varme: g.varme };
                let fare = false;
                let tak = false;
                for (let τ = 0; τ < vent + 1.6 && !fare; τ += dt) {
                    const på = τ >= vent;
                    fly(f, på, medRor && !på, g.harRor, sy, dt);
                    const y = f.y;
                    const x = veiVed(g.t + τ);
                    const bredde = medRor ? B.kurvHalv : B.halvBredde;
                    for (const dx of [-bredde, 0, bredde]) {
                        let bunn = fastTopp(g.ter, x + dx);
                        let m = margin;
                        const iKnaus = knaus && x + dx > knaus.x0 - 150 && x + dx < knaus.x1 + 20;
                        if (iKnaus && !under) bunn = Math.min(bunn, knaus.topp);
                        if (iKnaus && under) {
                            // Under knausen: trangt, så lavere margin - og taket må ikke treffes.
                            m = 4;
                            if (x + dx > knaus.x0 - 20 && y - B.høyde < knaus.bunn + 2) tak = true;
                        }
                        // Faller den fort, trengs mer luft: et sent trykk rekker ikke å bremse.
                        if (y > bunn - m - (p.fartMargin ?? 0.2) * Math.max(0, f.vy)) fare = true;
                    }
                }
                return { fare, tak };
            };
            // Etter riksretten styrer den helt: dykk under fjellene, rett fram, opp over kammen.
            if (g.harRor) {
                const valg = rorValg(g, p.ror ?? 0, vent);
                hold(g, valg === 'opp');
                ror(g, valg === 'ned');
                return;
            }
            const { fare, tak } = spå();
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
            // Et nytt trykk i båndet koster et trinn: skrapegrepet holder bare et trykk som er i gang.
            hold(g, (fare || (skrape && g.hold)) && !tak);
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
            'Fyrer før hver rygg og regner med at neste grep kan komme sent. Skraper i nær-båndet for Ueland-gangeren og dykker under fjellene med roret i 1884.',
        make: pilot({ margin: 4, skrapMål: 10, horisont: 0.2, hver: 1, under: 1, ror: 260 }),
    },
    nybegynner: {
        forventer: 'middels',
        beskrivelse:
            'Fyrer før ryggene med god margin. Skraper i strekk på 4 s (70 % av tida) og styrer seint ned mot portene med roret.',
        make: pilot({
            margin: 50,
            skrap: { andel: 0.7, margin: 12, bytt: 4 },
            skrapMål: 10,
            horisont: 0.3,
            hver: 1,
            under: 0.3,
            ror: 200,
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
