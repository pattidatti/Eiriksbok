// Oppdragsmeldingene i kø: «Nytt oppdrag», et mål som er nådd, og «Oppdrag fullført».
//
// Før sto bare den siste meldingen, og den kom med en gang: midt i en samtale, oppå boblen til den
// som snakket, og to meldinger tett på hverandre (fullført + neste oppdrag) slettet den første.
// Nå venter meldingene på tur, én om gangen, og de venter til samtalen er over og ingen boble står
// midt i bildet (`opptatt`), men aldri lenger enn `MAKS_VENT`. Lyden spilles når meldingen vises,
// så klokkene til «Oppdrag fullført» følger seglet (Melding.tsx).
import type { OppdragMelding } from './oppdrag';

/** Hvor lenge oppdragsmeldingen står (ms). «Oppdrag fullført» får tid til seremonien (Melding.tsx). */
export const meldingTid = (m: OppdragMelding): number => (m.type === 'maal' ? 2800 : m.type === 'ferdig' ? 6400 : 5200);

/** Lengste ventetid før en melding vises likevel (s). */
const MAKS_VENT = 8;
/** Pause mellom to meldinger (s), så den neste ikke smelter sammen med den som toner ut. */
const MELLOM = 0.35;

export class MeldingKo {
    private ko: OppdragMelding[] = [];
    private n = 0;
    private igjen = 0;
    private ventet = 0;
    /** Meldingen som vises nå, med et tall som skifter for hver ny (HUD-en ser på det). */
    naa: (OppdragMelding & { n: number }) | null = null;
    /** Kalles når en melding vises (lyden). */
    onVis: (m: OppdragMelding) => void = () => undefined;

    legg(m: OppdragMelding): void {
        this.ko.push(m);
    }

    /**
     * Hvert bilde. `opptatt`: en samtale pågår eller en boble står der meldingen ville stått (venter
     * høyst `MAKS_VENT`). `stengt`: en film går (HUD-en viser bare filmen). Gir true når en ny vises.
     */
    tick(dt: number, opptatt: () => boolean, stengt: () => boolean): boolean {
        if (this.igjen > 0) {
            this.igjen -= dt;
            if (this.igjen <= 0) this.naa = null;
            return false;
        }
        if (this.ko.length === 0 || stengt()) return false;
        this.ventet += dt;
        if (this.ventet < MAKS_VENT && opptatt()) return false;
        const m = this.ko.shift()!;
        this.ventet = 0;
        this.naa = { ...m, n: ++this.n };
        this.igjen = meldingTid(m) / 1000 + MELLOM;
        this.onVis(m);
        return true;
    }
}
