// Opplæringen i prologen (blueprint §6: «Opplæring i å gå, ro og snakke»): ett hint om gangen
// nederst i bildet, til eleven har gjort det. Svarene i en samtale (1-3) står allerede med tall i
// panelet, så de trenger ikke eget hint. Det eleven har lært, huskes som flagg (`laert:<id>`,
// oppdrag.ts), så hintene kommer ikke igjen. Begynner etter filmen «ankomst» (filmer.ts).
import type { SpillKontekst, Spillsystem } from './system';

interface Hint {
    id: string;
    tekst: string;
    /** Skal hintet vises nå? (Ellers hoppes det over til det passer.) */
    naar?: () => boolean;
    /** Har eleven gjort det? Kalles hvert steg mens hintet står. */
    gjort: (dt: number) => boolean;
}

export class Opplaering implements Spillsystem {
    readonly navn = 'opplaering';
    private readonly k: SpillKontekst;
    private readonly hint: Hint[];
    private naa: Hint | null = null;
    /** Holdes igjen mens en film går. */
    holdt: () => boolean = () => false;

    constructor(k: SpillKontekst) {
        this.k = k;
        const start = k.player.pos.clone();
        let yaw0 = k.cam.yaw;
        let dreid = 0;
        let baat = 0;
        this.hint = [
            {
                id: 'gaa',
                tekst: 'Gå med W, A, S og D. Hold Shift for å løpe.',
                gjort: () => k.player.pos.distanceTo(start) > 3,
            },
            {
                id: 'kamera',
                tekst: 'Se deg rundt med musa eller piltastene.',
                gjort: () => {
                    dreid += Math.abs(Math.atan2(Math.sin(k.cam.yaw - yaw0), Math.cos(k.cam.yaw - yaw0)));
                    yaw0 = k.cam.yaw;
                    return dreid > 1.2;
                },
            },
            {
                id: 'snakk',
                tekst: 'Gå inn i bua og still deg ved husbonden. Trykk E for å snakke.',
                gjort: () => k.folk.laast,
            },
            {
                id: 'ro',
                tekst: 'W ror framover, S bakker, A og D svinger. E går i land.',
                naar: () => k.modus() === 'boat',
                gjort: (dt) => (baat += dt) > 8 || k.modus() !== 'boat',
            },
        ];
    }

    private ferdig(id: string): boolean {
        return this.k.folk.oppdrag.flagg.has(`laert:${id}`);
    }

    steg(dt: number): void {
        const o = this.k.folk.oppdrag;
        if (this.holdt() || !o.flagg.has('film:ankomst')) return;
        const forrige = this.naa;
        // Gå, se og snakk læres i rekkefølge. Svar og ro kommer når det passer, og går foran.
        let iRekke: Hint | null = null;
        let naa: Hint | null = null;
        for (const h of this.hint) {
            if (this.ferdig(h.id)) continue;
            if (h.naar ? !h.naar() : iRekke) continue;
            if (h.gjort(dt)) {
                o.settFlagg(`laert:${h.id}`);
                continue;
            }
            if (!h.naar) iRekke = h;
            else {
                naa = h;
                break;
            }
        }
        this.naa = naa ?? iRekke;
        if (this.naa !== forrige) this.k.hudSnart();
    }

    hud(): { tekst: string } | null {
        if (this.holdt() || !this.naa) return null;
        return { tekst: this.naa.tekst };
    }
}
