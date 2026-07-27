// Farkoster: båter, og senere hester og skip. Besittelse og styring.
//
// Modellen er minimal med vilje (blueprint §7): ingen fysikk, ingen kropp i
// Arcade, bare en posisjon som beveges og en maske som sier hvor den får være.
//
// To valg som er verdt å vite om:
//
//  1. **Figuren står stille om bord, og det er farkosten som beveger seg.**
//     Alternativet er en `ritt`-positur, og den ville tvunget `KOLONNER`,
//     `START`, `POSITUR_LENGDE` og hele positurlista i `forgeHumanoid` til å
//     endres i samme åndedrag - for tre rammer ingen har tegnet. Hesten kan få
//     sin positur den dagen hesten kommer.
//
//  2. **Farkosten har sin egen kollisjonsmaske.** `kart.farbart`, ikke
//     `kart.blokkert`. De to er nesten motsatte, men ikke helt: brygga er gåbar
//     og usjøbar. Gjenbruker man spillerens maske, går båten på land - og det
//     er den fella blueprintens fallgruve 6 peker på.

import Phaser from 'phaser';
import type { FarkostDef } from '../types';
import { sfx } from './audio';
import { fraSpill } from './bridge';
import { TILE } from './spriteforge';
import type { WorldMap } from './worldgen';

/** Hvor nær eleven må stå for å kunne gå om bord. */
const OMBORD_AVSTAND = 42;

/**
 * Halve skroglengden. Masken prøves i midten og ved baugen - altså det punktet
 * som ligger fremst i den retningen båten er på vei.
 *
 * Hekken prøves med vilje ikke. Den ligger der båten allerede er, og den er
 * per definisjon lovlig; tar man den med, kan en båt som ligger fortøyd inntil
 * en brygge aldri legge fra, fordi dens egen hekk står over plankene. Det var
 * ikke en teori - færingen i Nordvik satt bom fast i det den ble prøvd.
 *
 * En hel kollisjonsboks ville dessuten satt båten fast i hvert eneste nes.
 */
const SKROG_HALV = 11;

/** Der eleven står når hun er om bord - litt akter for midten. */
const DEKK_DY = -5;

interface Ombordvarende {
    /** Setet hun sitter i. Bare 0 er i bruk nå; typen tåler N. */
    sete: number;
}

interface Fartoy {
    def: FarkostDef;
    bilde: Phaser.GameObjects.Image;
    /** Piksler i sekundet, glattet mot ønsket fart av tregheten. */
    vx: number;
    vy: number;
    ombord: Ombordvarende[];
}

export interface FarkostKroker {
    spiller: () => { x: number; y: number };
    /**
     * Skru spillerens egen bevegelse og kollisjon av mens hun er om bord. Ved
     * ilandstigning følger ruta hun settes ned på med - farkosten vet hvor det
     * er grunt, spilleren gjør ikke det.
     */
    settOmBord: (pa: boolean, plass?: { x: number; y: number }) => void;
    /** Styrestikka, slik spilleren allerede leser den. -1..1 og lengden på utslaget. */
    akse: () => { x: number; y: number; utslag: number };
}

export class Farkoster {
    private kart: WorldMap;
    private kroker: FarkostKroker;
    /** Kan eleven gå om bord i det hele tatt? Kommer fra epokens regelsett. */
    private tillatt: boolean;

    private fartoyer: Fartoy[] = [];
    /** Den hun står i nå, eller null. */
    private aktiv: Fartoy | null = null;
    /** Hva hintet nederst sa sist, så vi ikke sender det samme hvert bilde. */
    private sisteHint: string | null = null;

    constructor(
        scene: Phaser.Scene,
        kart: WorldMap,
        defs: FarkostDef[],
        tillatt: boolean,
        kroker: FarkostKroker
    ) {
        this.kart = kart;
        this.kroker = kroker;
        this.tillatt = tillatt;
        this.fartoyer = defs.map((def) => ({
            def,
            bilde: scene.add.image(0, 0, 'prop-baat'),
            vx: 0,
            vy: 0,
            ombord: [],
        }));
    }

    bygg(): void {
        for (const f of this.fartoyer) {
            const [tx, ty] = f.def.tile;
            f.bilde
                .setPosition(tx * TILE + TILE / 2, ty * TILE + TILE / 2)
                // Skroget står i vannet, ikke oppå det. Origo lavt gjør at
                // dybdesorteringen legger båten riktig mot brygga.
                .setOrigin(0.5, 0.7)
                .setDepth(f.bilde.y);
        }
    }

    /** Er eleven om bord i noe akkurat nå? */
    get seiler(): boolean {
        return this.aktiv !== null;
    }

    /**
     * Ett bilde. Returnerer `true` når farkost-laget eier hintet og E-tasten
     * dette bildet - altså når eleven seiler, eller står ved noe hun kan gå om
     * bord i.
     *
     * Scenen lar da samhandlingslaget hvile. Uten det ville de to kjempet om
     * hintlinja hvert eneste bilde: den ene skriver «E - gå om bord», den andre
     * skriver null i samme åndedrag, og eleven ser ingenting.
     */
    sjekk(dt: number, brukTrykk: boolean): boolean {
        if (this.fartoyer.length === 0) return false;

        if (this.aktiv) {
            this.styr(this.aktiv, dt);
            if (brukTrykk) this.gaaIland(this.aktiv);
            return true;
        }

        const naer = this.naermeste();
        if (!naer) {
            this.hint(null);
            return false;
        }
        this.hint(`E - gå om bord i ${naer.def.navn}`);
        if (brukTrykk) this.gaaOmBord(naer);
        return true;
    }

    private hint(tekst: string | null): void {
        if (tekst === this.sisteHint) return;
        this.sisteHint = tekst;
        fraSpill.emit('hint', { tekst });
    }

    private naermeste(): Fartoy | null {
        if (!this.tillatt) return null;
        const s = this.kroker.spiller();
        let best: Fartoy | null = null;
        let bestD = OMBORD_AVSTAND;
        for (const f of this.fartoyer) {
            if (f.ombord.length >= f.def.seter) continue;
            const d = Phaser.Math.Distance.Between(f.bilde.x, f.bilde.y, s.x, s.y);
            if (d < bestD) {
                best = f;
                bestD = d;
            }
        }
        return best;
    }

    private gaaOmBord(f: Fartoy): void {
        f.ombord.push({ sete: f.ombord.length });
        this.aktiv = f;
        f.vx = 0;
        f.vy = 0;
        sfx.dialog();
        this.hint('E - gå i land');
        this.kroker.settOmBord(true);
    }

    /**
     * Av båten. Eleven settes på nærmeste rute hun kan stå på - er det ingen
     * innen rekkevidde, blir hun stående om bord og får vite hvorfor. Uten den
     * sperren kunne hun gå i land midt i fjorden og bli stående på vannet, og
     * det er en tilstand ingenting i spillet vet hvordan den kommer seg ut av.
     */
    private gaaIland(f: Fartoy): void {
        const rute = this.landgang(f);
        if (!rute) {
            fraSpill.emit('hint', { tekst: 'For dypt her. Ro nærmere land.' });
            this.sisteHint = 'For dypt her. Ro nærmere land.';
            sfx.galt();
            return;
        }
        f.ombord.pop();
        this.aktiv = null;
        f.vx = 0;
        f.vy = 0;
        sfx.dialog();
        this.kroker.settOmBord(false, rute);
        this.hint(null);
    }

    /** Nærmeste rute rundt båten som eleven kan stå på. */
    private landgang(f: Fartoy): { x: number; y: number } | null {
        const { bredde, hoyde, blokkert } = this.kart;
        const cx = Math.floor(f.bilde.x / TILE);
        const cy = Math.floor(f.bilde.y / TILE);
        let best: { x: number; y: number; d: number } | null = null;
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const tx = cx + dx;
                const ty = cy + dy;
                if (tx < 1 || ty < 1 || tx >= bredde - 1 || ty >= hoyde - 1) continue;
                if (blokkert[ty][tx]) continue;
                const d = Math.hypot(dx, dy);
                if (!best || d < best.d) {
                    best = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, d };
                }
            }
        }
        return best ? { x: best.x, y: best.y } : null;
    }

    /**
     * Styringen. Ønsket fart settes av stikka, men farkosten kommer dit
     * gradvis: `treghet` er millisekundene den bruker på å ta igjen ønsket.
     * Det er hele forskjellen på å gå og å ro, og det koster én lerp.
     */
    private styr(f: Fartoy, dt: number): void {
        const { x: ax, y: ay, utslag } = this.kroker.akse();
        const onsketX = utslag > 0.001 ? ax * f.def.fart : 0;
        const onsketY = utslag > 0.001 ? ay * f.def.fart : 0;

        // Eksponentiell glatting, uavhengig av bildefrekvens. En rå faktor per
        // bilde ville gjort båten treg på 30 fps og rapp på 144.
        const k = 1 - Math.exp(-dt / Math.max(1, f.def.treghet));
        f.vx += (onsketX - f.vx) * k;
        f.vy += (onsketY - f.vy) * k;

        // Aksene prøves hver for seg, så båten glir langs land i stedet for å
        // stoppe død i det baugen streifer et nes.
        const steg = dt / 1000;
        const nyX = f.bilde.x + f.vx * steg;
        if (this.skrogetKlarer(nyX, f.bilde.y, f.vx, f.vy)) f.bilde.x = nyX;
        else f.vx = 0;

        const nyY = f.bilde.y + f.vy * steg;
        if (this.skrogetKlarer(f.bilde.x, nyY, f.vx, f.vy)) f.bilde.y = nyY;
        else f.vy = 0;

        // Baugen peker den veien hun ror. Bare øst/vest - båten er tegnet fra
        // siden, og en speiling er all rotasjonen en pikselbåt tåler.
        if (Math.abs(f.vx) > 4) f.bilde.setFlipX(f.vx < 0);
        f.bilde.setDepth(f.bilde.y);
    }

    /** Får skroget plass her? Midten, og baugen i den retningen båten går. */
    private skrogetKlarer(x: number, y: number, vx: number, vy: number): boolean {
        const lengde = Math.hypot(vx, vy);
        if (lengde < 1) return this.farbartPunkt(x, y);
        const ex = vx / lengde;
        const ey = vy / lengde;
        return (
            this.farbartPunkt(x, y) && this.farbartPunkt(x + ex * SKROG_HALV, y + ey * SKROG_HALV)
        );
    }

    private farbartPunkt(x: number, y: number): boolean {
        const tx = Math.floor(x / TILE);
        const ty = Math.floor(y / TILE);
        if (tx < 0 || ty < 0 || tx >= this.kart.bredde || ty >= this.kart.hoyde) return false;
        return this.kart.farbart[ty][tx];
    }

    /** Der eleven skal stå dette bildet, eller null når hun går selv. */
    dekksplass(): { x: number; y: number } | null {
        if (!this.aktiv) return null;
        return { x: this.aktiv.bilde.x, y: this.aktiv.bilde.y + DEKK_DY };
    }
}
