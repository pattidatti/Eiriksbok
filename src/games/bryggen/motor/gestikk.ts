// Gester: det folk gjør med kroppen mens de snakker.
//
// UAL-pakken har ett klipp der en figur snakker med hendene (`Idle_Talking_Loop`, også sittende)
// og ett der armen strekkes fram med åpen hånd (`Spell_Simple_Shoot`). Resten lages her i kode:
// armer og hode dreies i figurens eget rom oppå det klippet figuren ellers spiller
// (`Animator.figurDrei`). Da kan en som står og rører i gryta, vifte gutten unna med den ene
// hånda uten å slutte å stå.
//
// Gesten velges fra det som blir sagt (`gestFra`), eller settes direkte i samtalene.
import * as THREE from 'three';
import type { Animator } from './animator';

export type Gest =
    /** Prater med hendene (klipp). */
    | 'snakk'
    /** Vifter gutten til side med hånda: «Flytt deg!» */
    | 'vift'
    /** Vinker: hei, eller farvel. */
    | 'vinke'
    /** Vinker gutten til seg: «Kom hit.» */
    | 'kom'
    /** Peker fram med strak arm: «Der borte», eller «Stopp!». */
    | 'peke'
    /** Nikker. */
    | 'nikk'
    /** Rister på hodet. */
    | 'riste'
    /** Trekker på skuldrene, håndflatene opp. */
    | 'skuldre'
    /** Bukker litt. */
    | 'bukk'
    /** Roper: armen ut og hodet litt bakover (selgerne i bodene). */
    | 'rop';

const X = new THREE.Vector3(1, 0, 0); // mot figurens venstre
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1); // fram

/** Hvor lenge en gest varer om ingen sier noe annet (s). `snakk` varer så lenge replikken står. */
const LENGDE: Record<Gest, number> = {
    snakk: 4,
    vift: 1.6,
    vinke: 1.8,
    kom: 1.8,
    peke: 1.7,
    nikk: 1.1,
    riste: 1.2,
    skuldre: 1.5,
    bukk: 1.6,
    rop: 1.6,
};

/** Myk inn- og uttoning over `inn` og `ut` sekunder av en gest som varer `len`. */
function konvolutt(t: number, len: number, inn = 0.3, ut = 0.35): number {
    const a = THREE.MathUtils.smoothstep(t, 0, inn);
    const b = 1 - THREE.MathUtils.smoothstep(t, len - ut, len);
    return Math.min(a, b);
}

/**
 * Legger gesten oppå animasjonen ved tiden `t` (sekunder siden den startet). `side` er 1 for
 * høyre hånd, -1 for venstre. Kalles hvert bilde før `Animator.update`.
 */
export function leggPaaGest(a: Animator, g: Gest, t: number, len: number, side = 1): void {
    const k = konvolutt(t, len);
    if (k <= 0) return;
    const S = side > 0 ? 'R' : 'L';
    // Speiling: rotasjoner rundt y og z skifter fortegn for venstre side.
    const m = side > 0 ? 1 : -1;
    const arm = `DEF-upper_arm.${S}`;
    const under = `DEF-forearm.${S}`;
    const haand = `DEF-hand.${S}`;
    switch (g) {
        case 'vift': {
            // Armen fram og ned, så feies den utover mot siden, to-tre ganger.
            const sveip = Math.sin(t * 9) * 0.5 + 0.25;
            a.figurDrei(arm, X, -0.95 * k);
            a.figurDrei(arm, Y, -m * sveip * k);
            a.figurDrei(under, X, -0.35 * k);
            a.figurDrei(haand, Y, -m * Math.sin(t * 9 - 0.6) * 0.5 * k);
            break;
        }
        case 'vinke': {
            a.figurDrei(arm, Z, -m * 1.25 * k);
            a.figurDrei(arm, X, -0.35 * k);
            a.figurDrei(under, Z, (-m * 1.35 + m * Math.sin(t * 10) * 0.35) * k);
            break;
        }
        case 'kom': {
            a.figurDrei(arm, X, -1.05 * k);
            a.figurDrei(under, X, (-0.4 - (0.5 + 0.5 * Math.sin(t * 8)) * 1.0) * k);
            a.figurDrei(haand, X, -0.4 * k);
            break;
        }
        case 'peke': {
            a.figurDrei(arm, X, -1.4 * k);
            a.figurDrei(arm, Y, m * 0.15 * k);
            a.figurDrei(under, X, -0.1 * k);
            break;
        }
        case 'rop': {
            a.figurDrei(arm, X, -0.9 * k);
            a.figurDrei(arm, Z, -m * 0.5 * k);
            a.figurDrei(under, X, -0.5 * k);
            a.figurDrei('DEF-head', X, -0.18 * k);
            break;
        }
        case 'nikk': {
            a.figurDrei('DEF-head', X, Math.max(0, Math.sin(t * 9)) * 0.32 * k);
            break;
        }
        case 'riste': {
            a.figurDrei('DEF-head', Y, Math.sin(t * 11) * 0.32 * k);
            break;
        }
        case 'skuldre': {
            a.figurDrei('DEF-upper_arm.R', Z, -0.25 * k);
            a.figurDrei('DEF-upper_arm.L', Z, 0.25 * k);
            a.figurDrei('DEF-forearm.R', X, -1.0 * k);
            a.figurDrei('DEF-forearm.L', X, -1.0 * k);
            a.figurDrei('DEF-forearm.R', Z, -0.35 * k);
            a.figurDrei('DEF-forearm.L', Z, 0.35 * k);
            a.figurDrei('DEF-head', Z, 0.12 * k);
            break;
        }
        case 'bukk': {
            a.figurDrei('DEF-spine.001', X, 0.35 * k);
            a.figurDrei('DEF-head', X, 0.25 * k);
            break;
        }
        case 'snakk':
            // Klippet gjør jobben (Gestikk spiller det); hodet nikker litt i takt med ordene.
            a.figurDrei('DEF-head', X, Math.sin(t * 5.3) * 0.05 * k);
            break;
    }
}

/**
 * Hvilken gest som passer til det som blir sagt. Enkle regler først: «Flytt deg» vifter, et
 * spørsmål trekker på skuldrene eller snakker med hendene, utrop roper.
 */
export function gestFra(tekst: string, rolig = false): Gest {
    const t = tekst.toLowerCase();
    if (/til side|flytt deg|av veien|pass deg|ikke dytt|gå videre|unna/.test(t)) return 'vift';
    if (/^(hei|god dag|vel møtt|farvel|ha det)/.test(t)) return 'vinke';
    if (/kom hit|følg meg|bli med/.test(t)) return 'kom';
    if (/der borte|der oppe|der nede|oppe på|se der|gå ned|gå opp|gå til/.test(t)) return 'peke';
    if (/^(ja|godt|bra|takk)\b/.test(t)) return 'nikk';
    if (/^(nei|aldri)\b|ikke høyt/.test(t)) return 'riste';
    if (/hvem vet|hvem skulle|det er slik det går|vet ikke/.test(t)) return 'skuldre';
    if (!rolig && /!\s*$/.test(tekst) && t.length < 60) return 'rop';
    return 'snakk';
}

/**
 * Styrer gestene til én figur: hvilken som går, og klippet `Idle_Talking_Loop` når hen prater.
 * Eieren kaller `tick` hvert bilde og `gjor` når noe blir sagt.
 */
export class Gestikk {
    private g: Gest | null = null;
    private t = 0;
    private len = 0;
    private side = 1;
    /** Hvor lenge hen skal fortsette å prate etter gesten. */
    private rest = 0;
    /** Klippet figuren skal tilbake til etter pratingen (null: bevegelseslaget). */
    private snakker = false;
    private readonly a: Animator;
    /** Sitter figuren? Da prater den med `Sitting_Talking_Loop` og bruker ikke armene til store gester. */
    sitter = false;
    /** Kalles når pratingen er ferdig, så eieren kan sette på igjen sitt eget klipp. */
    onFerdig: () => void = () => undefined;

    constructor(a: Animator) {
        this.a = a;
        // Gesten legges oppå rett før animatoren oppdateres, så den aldri legges på to ganger
        // når figuren langt unna bare oppdateres 15 ganger i sekundet.
        a.foer(() => {
            if (this.g) leggPaaGest(this.a, this.g, this.t, this.len, this.side);
        });
    }

    get aktiv(): boolean {
        return this.g !== null;
    }

    /** Start en gest. `snakk` spiller prateklippet så lenge `varighet` sier. */
    gjor(g: Gest, varighet?: number): void {
        if (this.sitter && g !== 'nikk' && g !== 'riste') g = 'snakk';
        this.g = g;
        this.t = 0;
        // En kort gest i en lang replikk: gesten først, så prater hen med hendene resten av tiden.
        this.len = g === 'snakk' ? (varighet ?? LENGDE.snakk) : LENGDE[g];
        this.rest = g === 'snakk' || varighet === undefined ? 0 : varighet - this.len;
        this.side = g === 'vift' && Math.random() < 0.3 ? -1 : 1;
        if (g === 'snakk') {
            this.a.play(this.sitter ? 'Sitting_Talking_Loop' : 'Idle_Talking_Loop', { loop: true, fade: 0.35, startAt: Math.random() * 2 });
            this.snakker = true;
        } else if (this.snakker) {
            this.a.release(0.3);
            this.snakker = false;
        }
    }

    /** Avbryt (figuren begynner å gå, kampen starter). */
    stopp(): void {
        if (this.snakker) this.onFerdig();
        this.snakker = false;
        this.g = null;
    }

    tick(dt: number): void {
        if (!this.g) return;
        this.t += dt;
        if (this.t >= this.len) {
            const varSnakk = this.snakker;
            this.g = null;
            this.snakker = false;
            if (this.rest > 0.8) this.gjor('snakk', this.rest);
            else if (varSnakk) this.onFerdig();
        }
    }
}
