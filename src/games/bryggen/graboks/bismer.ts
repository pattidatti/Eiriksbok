// Veie på bismer (blueprint §7.1): gutten flytter hanken langs stanga til den ligger vannrett, og
// leser av vekta på merkene.
//
// Den nordiske bismeren: en trestang med en krok i den ene enden der varen henger, og en tung
// ende (kolle) i den andre. Hanken man holder i, flyttes langs stanga til den står i balanse, og
// vekta leses av merket ved hanken. Loddet flytter seg ikke; det gjør den romerske bismeren [V SNL
// «bismer», Hofstad]. Merkene er i bismerpund (ca. 5,1 kg etter bylova av 1276) [V]; hvor tung
// stanga og kolla var, og hvor merkene satt, er valgt for spillet [S].
//
// Fysikken: kroken er i 0, hanken i `p` (0-1 langs stanga). Stanga og kolla veier `STANG` og har
// tyngdepunktet i `TP`. Balanse når varen × p = STANG × (TP - p), altså p = STANG·TP / (vare + STANG).

const STANG = 4;
const TP = 0.72;
const FART = 0.16; // hanken, del av stanga per sekund

/** Hvor hanken står når stanga er i balanse med `m` bismerpund i kroken. */
export const balanse = (m: number): number => (STANG * TP) / (m + STANG);

/** Hva merket ved hanken viser (bismerpund). */
export const avlest = (p: number): number => (STANG * (TP - p)) / p;

export interface BismerHud {
    /** Hanken langs stanga, 0-1. */
    p: number;
    /** Stanga sin vinkel (radianer, positiv: kolla ned). */
    vinkel: number;
    /** Merkene: posisjon langs stanga og hva de viser. */
    merker: { p: number; tekst: string; hel: boolean }[];
}

export class BismerSpill {
    p = 0.62;
    vinkel = 0.3;
    private fart = 0;
    readonly sann: number;
    readonly merker: BismerHud['merker'];

    constructor(sann: number) {
        this.sann = sann;
        this.merker = [];
        for (let m = 0; m <= 6; m += 0.5) {
            this.merker.push({ p: balanse(m), tekst: Number.isInteger(m) ? String(m) : '', hel: Number.isInteger(m) });
        }
    }

    /** `styr` -1..1 flytter hanken mot kroken (-) eller kolla (+). */
    step(dt: number, styr: number): void {
        this.p = Math.min(0.68, Math.max(0.3, this.p + styr * FART * dt));
        // Dreiemomentet rundt hanken: kolla drar ned på sin side, varen på sin.
        const moment = STANG * (TP - this.p) - this.sann * this.p;
        const maal = Math.max(-0.3, Math.min(0.3, moment * 0.9));
        // En fjær med litt for lite demping: stanga vipper og svinger seg til ro.
        this.fart += ((maal - this.vinkel) * 38 - this.fart * 4.2) * dt;
        this.vinkel += this.fart * dt;
    }

    get hud(): BismerHud {
        return { p: this.p, vinkel: this.vinkel, merker: this.merker };
    }

    /** Leser av der hanken står, rundet til en tidel. */
    lesAv(): number {
        return Math.round(avlest(this.p) * 10) / 10;
    }
}
