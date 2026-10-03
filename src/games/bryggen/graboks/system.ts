// Krokene i løkka: nye systemer (oppdrag med egne regler, aktiviteter, filmscener, menyer) hektes på
// game.ts herfra, ikke ved å skrive mer i game.ts. Et system får konteksten (`SpillKontekst`) når det
// lages i `systemer.ts`, og løkka kaller krokene det har.
import type * as THREE from 'three';
import type { InputFrame } from '../motor/input';
import type { Physics } from '../motor/physics';
import type { Character } from '../motor/character';
import type { SpringArmCamera } from '../motor/camera';
import type { EnemyAI } from '../motor/combat';
import type { Lyssetting } from '../motor/stemning';
import type { LydKobling } from '../motor/lydkobling';
import type { BryggenWorld } from '../bygg/bryggen';
import type { FolkStyring } from './folkstyring';
import type { Baering } from './baering';
import type { Tyv } from './tyv';

/** Det et system kan nå i spillet. Bare Bryggen-scenen (ikke gråboksen) har systemer. */
export interface SpillKontekst {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    phys: Physics;
    world: BryggenWorld;
    player: Character;
    /** Figuren kampen bruker (tyven). */
    enemy: Character;
    ai: EnemyAI;
    /** Tyven i gården (kapittel 1, tyv.ts). */
    tyv: Tyv;
    cam: SpringArmCamera;
    folk: FolkStyring;
    baering: Baering;
    lys: Lyssetting;
    lyd: LydKobling | null;
    /** Laget for HTML over spillet (navneskilt, tall). */
    floatLayer: HTMLElement;
    /** En melding midt på skjermen i `sek` sekunder. */
    flash: (tekst: string, sek: number) => void;
    /** Be HUD-en oppdatere seg snart (React). */
    hudSnart: () => void;
    /** Gutten går eller ror. */
    modus: () => 'foot' | 'boat';
}

export interface Spillsystem {
    /** Nøkkelen systemets HUD-data står under i `HudState.system`. */
    navn: string;
    /** Hvert fysikksteg, før gutten flyttes. Returner true for å holde gutten stille (systemet bruker inputen). */
    steg?(dt: number, inp: InputFrame): boolean | void;
    /** Hvert bilde, etter at kameraet har fulgt gutten. */
    bilde?(dt: number, kamera: THREE.PerspectiveCamera): void;
    /** Rett før tegning: returner true når systemet har plassert kameraet selv (filmscener). */
    kamera?(kamera: THREE.PerspectiveCamera, dt: number): boolean;
    /** «E: …»-teksten systemet vil vise der gutten står, eller null. Spørres når ingen andre har en. */
    prompt?(gutt: THREE.Vector3): string | null;
    /** E ble trykket mens systemets prompt sto. Kan gi en melding midt på skjermen. */
    trykk?(): string | null | void;
    /** Data til React-HUD-en (`HudState.system[navn]`). Kalles når HUD-en oppdateres. */
    hud?(): unknown;
    dispose?(): void;
}
