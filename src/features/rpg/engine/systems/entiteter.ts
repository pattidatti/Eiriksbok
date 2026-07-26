// Formene som lever i verden mens den kjører. Ren type-fil - ingen logikk.
//
// Disse lå inne i WorldScene, og da kunne ingen annen modul røre en fiende uten
// å importere hele scenen. De ligger her i stedet, så fiendesystemet,
// prosjektilsystemet og kampgeometrien kan dele dem uten å dra scenen med seg.

import type Phaser from 'phaser';
import type { EnemyDef } from '../../types';

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
