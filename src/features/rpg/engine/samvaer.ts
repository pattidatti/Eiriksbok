// Samværet: benkene ved bålet, og følelsen over eget hode.
//
// Dette er det elevene faktisk kommer til å bruke hallen til (blueprint §4.5).
// Alt annet vi kunne bygd - kappløp, skjoldvegg-lek, beretningsvegg - står som
// mulig senere, og skal ikke bygges nå.
//
// Laget er formet som `farkost.ts` og `portal.ts`: det eier hintlinja og
// E-tasten når eleven står nær nok, og sier fra så de andre lagene kan hvile.
// Ellers kjemper de om linja hvert bilde og eleven ser den blinke.
//
// Å sitte er ikke en ny positur. Figuren settes ned i idle-ramma, nøyaktig som
// hun står stille om bord i færingen - og av samme grunn: en `sitte`-positur
// ville tvunget hele rammetabellen i `spriteforge.ts` til å endres i samme
// åndedrag, for tre bilder ingen har tegnet.

import Phaser from 'phaser';
import { FOLELSE_MS } from '../data/folelser';
import type { SitteplassDef } from '../types';
import { fraSpill } from './bridge';
import { TILE, type Dir } from './spriteforge';

/** Hvor nær benken hun må stå for at den skal svare. */
const NAER = 22;

export interface SamvaerKroker {
    spiller: () => { x: number; y: number };
    /** Sett henne ned, eller reis henne opp igjen. */
    settSitter: (plass: { x: number; y: number; dir: Dir } | null) => void;
    /** Styreutslaget. Rører hun på seg mens hun sitter, reiser hun seg. */
    akse: () => { utslag: number };
}

interface Plass {
    def: SitteplassDef;
    x: number;
    y: number;
}

export class Samvaer {
    private scene: Phaser.Scene;
    private plasser: Plass[];
    private kroker: SamvaerKroker;

    private sitterPaa: Plass | null = null;
    private sisteHint: string | null = null;
    /** Sperre rett etter at hun satte seg, så samme trykk ikke reiser henne. */
    private sperre = 0;

    private boble: Phaser.GameObjects.Text | null = null;
    private bobleIgjen = 0;
    private bobleTegn: string | null = null;

    constructor(scene: Phaser.Scene, defs: SitteplassDef[], kroker: SamvaerKroker) {
        this.scene = scene;
        this.kroker = kroker;
        this.plasser = defs.map((def) => ({
            def,
            // Ett hakk opp fra rutas midte: hun sitter på benken, ikke foran den.
            x: def.tile[0] * TILE + 8,
            y: def.tile[1] * TILE + 6,
        }));
    }

    /** Sitter eleven? Det er den ene biten de andre i rommet ser. */
    get sitter(): boolean {
        return this.sitterPaa !== null;
    }

    /** Følelsen hun viser nå, eller null. Prøveskriptene leser den herfra. */
    get folelse(): string | null {
        return this.bobleTegn;
    }

    /**
     * Ett bilde. Returnerer `true` når laget eier hintet og E-tasten.
     *
     * `aktiv` er falsk når et lag over eier linja. Da gjør vi ingenting - men
     * sitter hun, holder vi henne sittende: en dialog som åpner seg skal ikke
     * skyte henne opp av benken.
     */
    sjekk(delta: number, brukTrykk: boolean, aktiv = true): boolean {
        this.tikkBoble(delta);
        if (this.plasser.length === 0) return false;
        this.sperre = Math.max(0, this.sperre - delta);

        if (this.sitterPaa) {
            // Rører hun på styringen, reiser hun seg. Det er den eneste veien ut
            // som ikke krever at eleven husker hvilken tast hun trykket.
            if (this.kroker.akse().utslag > 0.3) {
                this.reisDeg();
                return false;
            }
            if (!aktiv) return true;
            this.hint('E - reis deg');
            if (brukTrykk && this.sperre <= 0) {
                this.reisDeg();
                return true;
            }
            return true;
        }

        if (!aktiv) {
            // Hintlinja glemmes, ikke bare ties. Uten dette husker laget at det
            // sist skrev «E - sett deg», og neste gang eleven kommer bort til
            // benken skriver det ingenting - fordi teksten «ikke har endret
            // seg». Samme fella som `Interaksjon` løser med `naermest`.
            this.sisteHint = null;
            return false;
        }

        const s = this.kroker.spiller();
        let best: Plass | null = null;
        let bestD = NAER;
        for (const p of this.plasser) {
            const d = Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y);
            if (d < bestD) {
                best = p;
                bestD = d;
            }
        }
        if (!best) {
            this.hint(null);
            return false;
        }

        this.hint('E - sett deg');
        if (brukTrykk) {
            this.settDeg(best);
            return true;
        }
        return true;
    }

    private settDeg(p: Plass): void {
        this.sitterPaa = p;
        this.sperre = 260;
        this.kroker.settSitter({ x: p.x, y: p.y, dir: p.def.ser });
    }

    private reisDeg(): void {
        if (!this.sitterPaa) return;
        this.sitterPaa = null;
        this.hint(null);
        this.kroker.settSitter(null);
    }

    /**
     * Følelsen over eget hode.
     *
     * Eleven skal se det hun sender. Uten det blir hjulet en knapp som ikke
     * gjør noe synlig når hun er alene i hallen - og alene er hun ofte.
     */
    visFolelse(emoji: string | null): void {
        this.boble?.destroy();
        this.boble = null;
        this.bobleIgjen = 0;
        this.bobleTegn = null;
        if (!emoji) return;

        const s = this.kroker.spiller();
        const tekst = this.scene.add.text(s.x, s.y - 32, emoji, {
            fontSize: '32px',
            padding: { x: 4, y: 4 },
        });
        tekst.setOrigin(0.5, 0.5).setScale(0.34).setDepth(30001);
        this.boble = tekst;
        this.bobleTegn = emoji;
        this.bobleIgjen = FOLELSE_MS;
    }

    private tikkBoble(delta: number): void {
        if (!this.boble) return;
        const s = this.kroker.spiller();
        this.boble.setPosition(s.x, s.y - 32);
        this.bobleIgjen -= delta;
        if (this.bobleIgjen <= 0) {
            this.boble.destroy();
            this.boble = null;
            this.bobleTegn = null;
        } else if (this.bobleIgjen < 500) {
            this.boble.setAlpha(this.bobleIgjen / 500);
        }
    }

    private hint(tekst: string | null): void {
        if (tekst === this.sisteHint) return;
        this.sisteHint = tekst;
        fraSpill.emit('hint', { tekst });
    }
}
