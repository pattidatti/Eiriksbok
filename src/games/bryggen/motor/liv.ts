// Livet i en figur som ellers bare spiller et klipp: hodet ser seg rundt, ser på gutten når han
// kommer nær, vekten flyttes fra fot til fot, brystet puster, og hver figur har sin egen holdning
// (en gammel kone som er krokete i ryggen, en fyllik som henger med hodet, en prest som står rak).
//
// Alt er dreiinger i figurens rom oppå klippet (`Animator.figurDrei`), lagt på rett før mixeren
// (`Animator.foer`), så det koster nesten ingenting og virker på alle klipp. Tallene trekkes per
// figur, så to som står ved siden av hverandre aldri gjør det samme samtidig.
import * as THREE from 'three';
import type { Animator } from './animator';

const X = new THREE.Vector3(1, 0, 0); // mot figurens venstre: positiv vinkel bøyer fram
const Y = new THREE.Vector3(0, 1, 0); // positiv vinkel snur mot venstre
const Z = new THREE.Vector3(0, 0, 1);

/** Fast holdning: rygg (fram +), hode (ned +), skuldre (sigende +) og hvor nysgjerrig hen er (0-1). */
export interface Holdning {
    rygg?: number;
    hode?: number;
    skuldre?: number;
    nysgjerrig?: number;
    /** Hvor mye hen ser seg rundt (0: står i sine egne tanker, 1: følger med på alt). */
    urolig?: number;
}

/** Hvor langt unna gutten kan være før folk legger merke til ham. */
const SER_GUTTEN = 5.5;

/** En myk fjær mot et mål: kritisk dempet, så hodet ikke slår over. */
function fjaer(x: number, v: number, maal: number, k: number, dt: number): [number, number] {
    const a = k * k * (maal - x) - 2 * k * v;
    v += a * dt;
    return [x + v * dt, v];
}

export class Liv {
    private readonly a: Animator;
    private readonly h: Required<Holdning>;
    private r: number;
    private t = 0;
    /** Hodet nå (yaw, pitch) og farten. */
    private hy = 0;
    private hp = 0;
    private vy = 0;
    private vp = 0;
    private maalY = 0;
    private maalP = 0;
    private nesteBlikk: number;
    private holdTil = 0;
    /** Gutten i nærheten: ser på ham til `kjedTil`, så tilbake til sitt. */
    private serGutten = false;
    private kjedTil = 0;
    private readonly pustT: number;
    private readonly vektT: number;
    private readonly fase: number;
    /** Går hen? Da blir blikket roligere og vekta står stille. */
    gaar = false;
    /** Holder på med noe med hendene (skriver, hamrer): ser mest ned på arbeidet. */
    arbeid = false;
    /** Av mens gester eller samtaler styrer hodet selv. */
    av = false;
    private styrke = 1;

    constructor(a: Animator, seed: number, holdning: Holdning = {}) {
        this.a = a;
        this.r = Math.floor(seed * 9301 + 49297) % 233280 || 1;
        this.h = { rygg: 0, hode: 0, skuldre: 0, nysgjerrig: 0.35 + this.rnd() * 0.55, urolig: 0.4 + this.rnd() * 0.6, ...holdning };
        this.pustT = 3.4 + this.rnd() * 1.6;
        this.vektT = 5 + this.rnd() * 5;
        this.fase = this.rnd() * 100;
        this.nesteBlikk = 1 + this.rnd() * 5;
        a.foer(() => this.legg());
    }

    private rnd(): number {
        this.r = (this.r * 16807) % 2147483647;
        return this.r / 2147483647;
    }

    /**
     * Hvert bilde (logikken). `gutt` er føttene til gutten, `pos`/`yaw` figurens egne.
     */
    tick(dt: number, pos: THREE.Vector3, yaw: number, gutt: THREE.Vector3): void {
        this.t += dt;
        this.styrke += ((this.av ? 0 : 1) - this.styrke) * Math.min(1, dt * 4);
        const dx = gutt.x - pos.x;
        const dz = gutt.z - pos.z;
        const d = Math.hypot(dx, dz);
        // Gutten i figurens rom: x mot venstre, z fram.
        const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
        const vinkel = Math.atan2(lx, lz);
        const naer = d < SER_GUTTEN && Math.abs(vinkel) < 1.9 && Math.abs(gutt.y - pos.y) < 2.5;
        if (naer && !this.serGutten && this.t > this.kjedTil) {
            // Legger merke til ham, eller ikke.
            if (this.rnd() < this.h.nysgjerrig * (this.arbeid ? 0.5 : 1)) {
                this.serGutten = true;
                this.kjedTil = this.t + 2.5 + this.rnd() * 5;
            } else this.kjedTil = this.t + 3 + this.rnd() * 4;
        }
        if (this.serGutten && (!naer || this.t > this.kjedTil)) {
            this.serGutten = false;
            this.kjedTil = this.t + 4 + this.rnd() * 6;
            this.nesteBlikk = this.t + 0.6;
        }
        if (this.serGutten) {
            this.maalY = THREE.MathUtils.clamp(vinkel, -1.15, 1.15);
            // Ser opp mot ansiktet hans: gutten er lavere enn de voksne.
            this.maalP = THREE.MathUtils.clamp(0.12 - 0.5 / Math.max(1, d), -0.25, 0.35);
        } else if (this.t > this.nesteBlikk) {
            // Et nytt blikk: rundt seg, ned på arbeidet, eller rett fram.
            const u = this.h.urolig * (this.gaar ? 0.45 : 1);
            const valg = this.rnd();
            if (this.arbeid && valg < 0.6) {
                this.maalY = (this.rnd() - 0.5) * 0.3;
                this.maalP = 0.3 + this.rnd() * 0.15;
            } else if (valg < 0.35 + u * 0.4) {
                this.maalY = (this.rnd() - 0.5) * 2 * (0.4 + u * 0.6);
                this.maalP = (this.rnd() - 0.6) * 0.25;
            } else {
                this.maalY = 0;
                this.maalP = 0;
            }
            this.holdTil = 1 + this.rnd() * 3;
            this.nesteBlikk = this.t + this.holdTil + 1.5 + this.rnd() * (6 - u * 3);
        }
        [this.hy, this.vy] = fjaer(this.hy, this.vy, this.maalY, this.serGutten ? 5.5 : 3.6, dt);
        [this.hp, this.vp] = fjaer(this.hp, this.vp, this.maalP, 4, dt);
    }

    /** Legges på rett før mixeren (via `Animator.foer`). */
    private legg(): void {
        const s = this.styrke;
        const a = this.a;
        const t = this.t + this.fase;
        const h = this.h;
        // Foreldre før barn (se `figurDrei`): ryggen nedenfra, så skuldrene, nakken og hodet.
        const pust = Math.sin((t / this.pustT) * Math.PI * 2);
        const vekt = this.gaar ? 0 : Math.sin((t / this.vektT) * Math.PI * 2) + 0.35 * Math.sin((t / this.vektT) * 5.1);
        const y = this.hy * s;
        const p = this.hp * s + h.hode;
        // Holdningen (ryggen bøyd fram) og vekta som flyttes fra fot til fot når hen står.
        a.figurDrei('DEF-spine.001', X, h.rygg * 0.45);
        a.figurDrei('DEF-spine.001', Z, 0.03 * vekt);
        a.figurDrei('DEF-spine.002', X, h.rygg * 0.35);
        a.figurDrei('DEF-spine.002', Z, -0.022 * vekt);
        // Pusten løfter brystet litt, og noe av snuingen tas i brystet.
        a.figurDrei('DEF-spine.003', X, h.rygg * 0.2 - 0.018 * pust);
        a.figurDrei('DEF-spine.003', Y, y * 0.2);
        if (h.skuldre) {
            for (const S of ['L', 'R'] as const) a.figurDrei(`DEF-shoulder.${S}`, Z, (S === 'L' ? -1 : 1) * h.skuldre * 0.25);
        }
        // Hodet: nakken tar en del av snuingen, hodet resten.
        a.figurDrei('DEF-neck', Y, y * 0.35);
        a.figurDrei('DEF-neck', X, p * 0.4);
        a.figurDrei('DEF-head', Y, y * 0.45);
        a.figurDrei('DEF-head', X, p * 0.6);
        // Hodet heller litt når hen ser til siden.
        a.figurDrei('DEF-head', Z, -y * 0.08);
    }
}

/** Holdningen til draktene som skiller seg ut. De andre trekker sin egen (nysgjerrig, urolig). */
export const HOLDNING: Partial<Record<string, Holdning>> = {
    gammelkone: { rygg: 0.24, hode: 0.1, skuldre: 0.25, urolig: 0.3 },
    fyllik: { rygg: 0.2, hode: 0.38, skuldre: 0.45, nysgjerrig: 0.15, urolig: 0.15 },
    prest: { rygg: -0.04, hode: 0.05, nysgjerrig: 0.6, urolig: 0.25 },
    hovedsmann: { rygg: -0.06, hode: -0.04, nysgjerrig: 0.5, urolig: 0.35 },
    oldermann: { rygg: -0.05, hode: -0.03, nysgjerrig: 0.4, urolig: 0.2 },
    vakt: { rygg: -0.04, nysgjerrig: 0.95, urolig: 0.85 },
    husmann: { rygg: 0.1, skuldre: 0.15 },
    fisker: { rygg: 0.08, skuldre: 0.1 },
    gutt: { nysgjerrig: 0.95, urolig: 1 },
    jente: { nysgjerrig: 0.95, urolig: 0.9 },
    skriver: { rygg: 0.12, hode: 0.1, urolig: 0.3 },
};

/** De som går med fine, avmålte skritt (`Walk_Formal_Loop`). */
export const FIN_GANG = new Set(['prest', 'hovedsmann', 'oldermann', 'gjaldker', 'borger', 'skriver', 'husbonde']);
