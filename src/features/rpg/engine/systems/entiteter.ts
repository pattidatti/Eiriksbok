// Formene som lever i verden mens den kjører. Ren type-fil - ingen logikk.
//
// Disse lå inne i WorldScene, og da kunne ingen annen modul røre en fiende uten
// å importere hele scenen. De ligger her i stedet, så fiendesystemet,
// prosjektilsystemet og kampgeometrien kan dele dem uten å dra scenen med seg.

import type Phaser from 'phaser';
import type { EnemyDef } from '../../types';
import type { PikselTekst } from '../spriteforge';

export type Sprite = Phaser.Physics.Arcade.Sprite;

export type FiendeTilstand =
    | 'sover'
    | 'jager'
    | 'varsler'
    | 'slar'
    | 'henter-seg'
    /** Treffet kaster den bakover, og AI-en holder fingrene av fatet så lenge. */
    | 'stotet';

export interface Fiende {
    sprite: Sprite;
    def: EnemyDef;
    hp: number;
    maksHp: number;
    tilstand: FiendeTilstand;
    timer: number;
    frame: number;
    frameTimer: number;
    /** Bossen er udødelig til eleven svarer riktig. */
    skjold: number;
    dodd: boolean;
    /** Har den mistet en bit alt? Skal bare skje én gang per fiende. */
    lemlestet: boolean;
    /** Colliderne må fjernes eksplisitt når fienden dør, ellers lekker de. */
    collidere: Phaser.Physics.Arcade.Collider[];
    /** Livsstolpen over hodet. Vises først når fienden har tatt skade. */
    stolpe: Phaser.GameObjects.Graphics | null;
    /** Hvor lenge stolpen blir stående etter siste treff. */
    stolpeTid: number;
    /** Fargen fienden skal ha når treff-blinket er over (varsel-rødt eller ingen). */
    onsketTint: number | null;
    /** Hvor mange slag den har forsøkt. Avgjør når særslaget kommer. */
    slagTeller: number;
    /**
     * Overstyrer telegraferingen fra `def.varsel`.
     *
     * Ravn begynner på 700 ms og går ned til 450 gjennom opplæringen. Eleven
     * merker at hun blir bedre, men det er Ravn som er blitt raskere. Det er en
     * løgn vi tar med glede (blueprint §5.8).
     */
    varsel?: number;
    /**
     * Kan ikke dø. Brukes av opplæringen: en huskarl som blir slått i hjel av
     * en sytten år gammel gutt i første økt er ikke en lærer, og en øvingsdukke
     * som faller om, avslutter timen midt i.
     */
    udodelig?: boolean;
    /**
     * Følger etter, men slår ikke.
     *
     * Ravn står slik i den første økta: eleven skal få kjenne på svinget uten
     * at noe kommer imot. En «øvingsdukke» som ikke rører seg lærer henne
     * ingenting om avstand, og en som slår tilbake med én gang lærer henne å
     * gjemme seg.
     */
    fredelig?: boolean;
    /**
     * Løper vekk i stedet for mot.
     *
     * Andre halvdel av Lindisfarne. De som er igjen på øya kan ikke slåss, og
     * de gjør det eneste folk gjør: de kommer seg unna.
     */
    flykter?: boolean;
    /**
     * Spillet slutter å juble.
     *
     * Ingen livsstolpe, ingen skadetall, ingen XP, ingen loot, ingen fanfare.
     * Reglene er de samme - angrepet virker likt, blodet ser likt ut. Det er
     * kontrasten som bærer, ikke en regelendring (blueprint §3).
     */
    stille?: boolean;
    /** Navn over hodet. Folk fra bygda har det; fremmede har det ikke (§5.7). */
    navn?: string;
    /** Skiltet som tegner navnet. Lages første bilde `navn` er satt. */
    navnskilt?: PikselTekst;
    /**
     * Navnestolpe øverst på skjermen, som en boss.
     *
     * Den som fører øyas menn har den (blueprint §3). Poenget er ikke at han er
     * sterkere - det er at eleven skal vite hvem hun slåss mot mens hun gjør
     * det, og at det er noen. Skiltet over hodet forsvinner i et slagsmål med
     * sju mann; en stolpe øverst gjør ikke det.
     */
    toppstolpe?: boolean;
}

/**
 * Særtrekkene ved ett bestemt slag, på vei fra fienden til garden. Formen
 * matcher det `Kamp.vurderTreff()` alltid har tatt imot - den satt bare aldri
 * koblet til noe før.
 */
export interface Sarslag {
    /** Går gjennom garden. */
    ublokkerbart?: boolean;
    /** Blokkeres det, ryker hele skjoldet. Paraden er fortsatt trygg. */
    hak?: boolean;
}

export interface Prosjektil {
    sprite: Phaser.GameObjects.Image;
    /** Fysisk skudd: peker dit det flyr, og pulserer ikke. */
    fysisk: boolean;
    vx: number;
    vy: number;
    skade: number;
    levetid: number;
    fraFiende: boolean;
    piercing: boolean;
    /** Gjennomborende skudd skal ikke treffe samme fiende to ganger. */
    truffet: Set<Fiende>;
}

export interface LootBit {
    sprite: Phaser.GameObjects.Image;
    itemId: string | null;
    solv: number;
    levetid: number;
}
