// Sekvensverktøyet: filmscener spilt av i samme løkke som spillet (blueprint §6 og §9.6). Ingen video.
//
// En filmscene (`Film`, skrevet som data i bygg/filmer.ts) er en tidslinje av steg:
//   - kamera:  et skudd (posisjon, blikk, fov). `glid` sekunder glir kameraet dit fra der det var
//              (0 = kutt), og `til` kjører det sakte videre mens skuddet varer.
//   - figur:   spill et klipp på en figur, flytt den langs et lite løp, sett den et sted, vis/skjul.
//   - si:      en replikk i boble over hodet (samme bobler som folkene ellers, hoder.ts).
//   - tekst:   en linje nederst i bildet (tittelkort), eller null for å ta den bort.
//   - gjor:    noe som skjer i spillet: stille klokka, ta et oppdrag, flytte gutten.
// Figurene en film trenger, lages når den starter og kastes når den slutter. Gutten og tyven kan
// skjules (`skjul`) mens filmen viser en dobbeltgjenger.
//
// Gutten står stille mens filmen går. Mellomrom, E eller Esc hopper over: da kjøres alle `gjor` som
// gjenstår, i rekkefølge, og så `slutt`. Sluttilstanden blir den samme om man ser filmen eller ikke.
import * as THREE from 'three';
import type { InputFrame } from '../motor/input';
import type { Animator } from '../motor/animator';
import { lagFigur, type FigurNavn } from '../bygg/folk';
import type { Hode } from './hoder';
import type { SpillKontekst, Spillsystem } from './system';

export type P3 = readonly [number, number, number];
/** Et punkt i verden, eller en figur i filmen (hodet). `[id, dy]` ser `dy` meter over føttene. */
export type Mal = P3 | string | readonly [string, number];

export interface Skudd {
    pos: P3 | { folg: string; off: P3 };
    blikk: Mal;
    fov?: number;
    /** Sekunder kameraet glir hit fra forrige bilde. Utelatt eller 0: kutt. */
    glid?: number;
    /** Kjør sakte hit mens skuddet varer (til neste kamerasteg eller slutten). */
    til?: { pos: P3; blikk?: P3 };
}

export type FilmSteg =
    | { t: number; kamera: Skudd }
    | {
          t: number;
          figur: string;
          /** Et helkroppsklipp. `null` slipper klippet (tilbake til stå/gå). */
          klipp?: string | null;
          loop?: boolean;
          /** Gå (eller seil) langs disse punktene, i `fart` m/s. */
          lop?: P3[];
          fart?: number;
          /** Sett figuren her med en gang. */
          plass?: P3;
          /** Snu mot denne retningen (yaw) eller dette punktet. */
          snu?: number | P3;
          synlig?: boolean;
          /** Rekvisitter: sett seilet (true) eller beslå det (false). */
          seil?: boolean;
          /** Overkroppsklipp (bære noe), eller null. */
          over?: string | null;
      }
    | { t: number; si: string; tekst: string; sek?: number }
    | { t: number; tekst: string | null }
    | { t: number; gjor: (k: SpillKontekst) => void };

/** En ting i filmen som ikke er en figur (koggen). Lages av `rekvisitt` i filmdataene. */
export interface Rekvisitt {
    root: THREE.Object3D;
    seil?: (satt: boolean) => void;
    /** Hvert bilde: gynge med bølgene. */
    oppdater?: (t: number) => void;
    dispose: () => void;
}

export interface FigurDef {
    drakt?: FigurNavn;
    rekvisitt?: (k: SpillKontekst) => Rekvisitt;
    pos: P3 | ((k: SpillKontekst) => THREE.Vector3);
    yaw?: number | ((k: SpillKontekst) => number);
    synlig?: boolean;
}

export interface Film {
    id: string;
    lengde: number;
    figurer?: Record<string, FigurDef>;
    /** Skjules mens filmen går: `gutt`, `tyv`, eller navnet på noe i scenen (`kogge`). */
    skjul?: string[];
    steg: FilmSteg[];
    /** Kjøres alltid når filmen er ferdig eller hoppet over. */
    slutt?: (k: SpillKontekst) => void;
}

/** Det FilmVisning.tsx får (`HudState.system.film`). */
export interface FilmHud {
    tekst: string | null;
    svart: boolean;
    hopp: string;
}

interface Aktor {
    root: THREE.Object3D;
    anim?: Animator;
    rek?: Rekvisitt;
    hoyde: number;
    lop: THREE.Vector3[];
    fart: number;
    v: number;
    hode: Hode;
    snakk: number;
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const smooth = (x: number) => x * x * (3 - 2 * x);
const V = (p: P3) => new THREE.Vector3(p[0], p[1], p[2]);
/** Ingen hopp over de første tidelene: E-en som startet filmen skal ikke stoppe den. */
const HOPP_SPERRE = 0.6;
const SVART_S = 0.4;

class Avspilling {
    t = 0;
    i = 0;
    readonly aktorer = new Map<string, Aktor>();
    readonly skjult: [THREE.Object3D, boolean][] = [];
    tekst: string | null = null;
    /** Kameraet: der det er nå, skuddet det går mot, og hvor glidningen startet. */
    readonly pos = new THREE.Vector3();
    readonly blikk = new THREE.Vector3();
    fov = 60;
    skudd: Skudd | null = null;
    skuddT = 0;
    skuddLengde = 1;
    readonly fraPos = new THREE.Vector3();
    readonly fraBlikk = new THREE.Vector3();
    fraFov = 60;
    readonly film: Film;
    constructor(film: Film) {
        this.film = film;
    }
}

export class Sekvens implements Spillsystem {
    readonly navn = 'film';
    private readonly k: SpillKontekst;
    private ko: Film[] = [];
    private a: Avspilling | null = null;
    private laster = false;
    /** Svart overgang: >0 mens det tones til svart før filmen slutter. */
    private ut = 0;
    private svart = 0;
    private esc = false;
    /** Filmen som venter på at spilleren skal begynne (første tast eller klikk). */
    private venter: Film | null = null;
    private klokke = 0;
    /** Kalles når en film er ferdig (id). */
    readonly ferdig: ((id: string) => void)[] = [];

    constructor(k: SpillKontekst) {
        this.k = k;
        window.addEventListener('keydown', this.onKey);
        window.addEventListener('pointerdown', this.onStart);
    }

    /** Går en film nå, eller venter en (på å starte eller i køen)? */
    get spiller(): boolean {
        return !!this.a || this.laster || !!this.venter || this.ko.length > 0;
    }

    /** Går en film akkurat nå (bildet er filmens)? */
    get aktiv(): boolean {
        return !!this.a || this.laster;
    }

    /** Legg en film i køen. Den starter når samtaler og veiing er ferdige. */
    spill(film: Film): void {
        if (this.a?.film.id === film.id || this.ko.some((f) => f.id === film.id)) return;
        this.ko.push(film);
    }

    /** Vis første skudd med en gang, og start filmen ved første tast eller klikk (startskjermen). */
    vedStart(film: Film): void {
        this.venter = film;
        void this.begynn(film, true);
    }

    private onStart = () => {
        if (!this.venter) return;
        this.venter = null;
        if (this.a) this.a.t = 0;
        this.k.hudSnart();
    };

    private onKey = (e: KeyboardEvent) => {
        if (this.venter) {
            this.onStart();
            return;
        }
        if (e.code === 'Escape' && this.a) this.esc = true;
    };

    private async begynn(film: Film, holdt = false): Promise<void> {
        this.laster = true;
        const a = new Avspilling(film);
        const k = this.k;
        for (const [id, d] of Object.entries(film.figurer ?? {})) {
            let root: THREE.Object3D;
            let anim: Animator | undefined;
            let rek: Rekvisitt | undefined;
            let hoyde = 1.7;
            if (d.rekvisitt) {
                rek = d.rekvisitt(k);
                root = rek.root;
            } else {
                anim = await lagFigur(d.drakt ?? 'svenn');
                root = anim.root;
                hoyde = d.drakt === 'junge' ? 1.58 : 1.75;
            }
            root.position.copy(typeof d.pos === 'function' ? d.pos(k) : V(d.pos));
            root.rotation.y = typeof d.yaw === 'function' ? d.yaw(k) : d.yaw ?? 0;
            root.visible = d.synlig ?? true;
            k.scene.add(root);
            const akt: Aktor = {
                root, anim, rek, hoyde, lop: [], fart: 1.2, v: 0, snakk: 0,
                hode: {
                    hode: (ut) => {
                        const b = anim?.bein('DEF-head');
                        return b ? b.getWorldPosition(ut).setY(ut.y + 0.22) : ut.copy(root.position).setY(root.position.y + hoyde + 0.1);
                    },
                    synlig: () => root.visible,
                },
            };
            a.aktorer.set(id, akt);
            if (anim) k.folk.ekstra.push({ h: akt.hode, info: () => ({ navn: '', tittel: '', merke: null, giver: false }) });
        }
        for (const navn of film.skjul ?? []) {
            const o = navn === 'gutt' ? k.player.anim.root : navn === 'tyv' ? k.enemy.anim.root : k.scene.getObjectByName(navn);
            if (o) {
                a.skjult.push([o, o.visible]);
                o.visible = false;
            }
        }
        const cam = k.cam.camera;
        a.pos.copy(cam.position);
        cam.getWorldDirection(_a);
        a.blikk.copy(cam.position).addScaledVector(_a, 10);
        a.fov = cam.fov;
        k.folk.slutt();
        k.folk.film = true;
        this.a = a;
        this.laster = false;
        this.esc = false;
        // Første steg kjøres med en gang, så startskjermen viser første skudd.
        this.kjor(0);
        if (holdt) this.oppdaterKamera(0);
        k.hudSnart();
    }

    /** Hvor et mål er nå: et punkt, eller hodet til en figur i filmen. */
    private mal(m: Mal, ut: THREE.Vector3): THREE.Vector3 {
        if (typeof m === 'string' || typeof m[0] === 'string') {
            const id = (typeof m === 'string' ? m : m[0]) as string;
            const dy = typeof m === 'string' ? undefined : (m[1] as number);
            const akt = this.a?.aktorer.get(id);
            if (id === 'gutt' && !akt) return ut.copy(this.k.player.pos).setY(this.k.player.pos.y + (dy ?? 1.4));
            if (!akt) return ut;
            if (dy !== undefined) return ut.copy(akt.root.position).setY(akt.root.position.y + dy);
            return akt.hode.hode(ut);
        }
        const p = m as P3;
        return ut.set(p[0], p[1], p[2]);
    }

    private skuddPos(s: Skudd, ut: THREE.Vector3): THREE.Vector3 {
        if ('folg' in s.pos) {
            const akt = this.a?.aktorer.get(s.pos.folg);
            const o = s.pos.off;
            return ut.copy(akt?.root.position ?? this.k.player.pos).add(_b.set(o[0], o[1], o[2]));
        }
        return ut.set(s.pos[0], s.pos[1], s.pos[2]);
    }

    /** Kjør alle steg fram til tiden nå. */
    private kjor(t: number): void {
        const a = this.a;
        if (!a) return;
        const steg = a.film.steg;
        while (a.i < steg.length && steg[a.i].t <= t) {
            this.utfor(steg[a.i]);
            a.i++;
        }
    }

    private utfor(s: FilmSteg): void {
        const a = this.a!;
        const k = this.k;
        if ('kamera' in s) {
            a.skudd = s.kamera;
            a.skuddT = s.t;
            const neste = a.film.steg.find((x) => x.t > s.t && 'kamera' in x);
            a.skuddLengde = Math.max(0.1, (neste?.t ?? a.film.lengde) - s.t);
            a.fraPos.copy(a.pos);
            a.fraBlikk.copy(a.blikk);
            a.fraFov = a.fov;
        } else if ('figur' in s) {
            const akt = a.aktorer.get(s.figur);
            if (!akt) return;
            if (s.plass) akt.root.position.copy(V(s.plass));
            if (s.synlig !== undefined) akt.root.visible = s.synlig;
            if (s.snu !== undefined) {
                if (typeof s.snu === 'number') akt.root.rotation.y = s.snu;
                else akt.root.rotation.y = Math.atan2(s.snu[0] - akt.root.position.x, s.snu[2] - akt.root.position.z);
            }
            if (s.lop) {
                akt.lop = s.lop.map(V);
                akt.fart = s.fart ?? 1.2;
            }
            if (s.seil !== undefined) akt.rek?.seil?.(s.seil);
            if (s.over !== undefined) akt.anim?.overlay(s.over);
            if (s.klipp === null) akt.anim?.release(0.3);
            else if (s.klipp) akt.anim?.play(s.klipp, { fade: 0.25, loop: s.loop });
        } else if ('si' in s) {
            const akt = a.aktorer.get(s.si);
            const hode = akt?.hode ?? (s.si === 'gutt' ? k.folk.ekstra[0]?.h : undefined);
            if (!hode) return;
            const sek = s.sek ?? Math.min(6, 1.6 + s.tekst.length / 18);
            k.folk.hoder.si(hode, s.tekst, sek);
            if (akt?.anim && !akt.lop.length && !akt.anim.current) {
                akt.anim.play('Idle_Talking_Loop', { fade: 0.3, loop: true });
                akt.snakk = sek;
            }
        } else if ('gjor' in s) {
            s.gjor(k);
        } else {
            a.tekst = s.tekst;
            k.hudSnart();
        }
    }

    steg(_dt: number, inp: InputFrame): boolean {
        void _dt;
        if (this.venter || this.laster) return true;
        const a = this.a;
        if (!a) {
            // Neste film i køen venter til samtalen og veiingen er ferdig.
            if (this.ko.length && !this.k.folk.laast && !this.k.baering.veier) void this.begynn(this.ko.shift()!);
            return false;
        }
        if (a.t > HOPP_SPERRE && this.ut === 0 && (inp.jumpPressed || inp.interactPressed || this.esc)) this.hoppOver();
        this.esc = false;
        return true;
    }

    /** Hopp over resten: alle `gjor` som gjenstår, i rekkefølge, og så slutten. */
    private hoppOver(): void {
        const a = this.a;
        if (!a) return;
        for (; a.i < a.film.steg.length; a.i++) {
            const s = a.film.steg[a.i];
            if ('gjor' in s) s.gjor(this.k);
        }
        this.ut = SVART_S;
        this.k.hudSnart();
    }

    private avslutt(): void {
        const a = this.a;
        if (!a) return;
        const k = this.k;
        this.a = null;
        k.folk.film = false;
        for (const [o, v] of a.skjult) o.visible = v;
        for (const akt of a.aktorer.values()) {
            k.scene.remove(akt.root);
            const i = k.folk.ekstra.findIndex((e) => e.h === akt.hode);
            if (i >= 0) k.folk.ekstra.splice(i, 1);
            k.folk.hoder.taus(akt.hode);
            akt.anim?.mixer.stopAllAction();
            if (akt.anim) akt.anim.mixer.uncacheRoot(akt.anim.model);
            akt.rek?.dispose();
        }
        k.folk.oppdrag.flagg.add(`film:${a.film.id}`);
        a.film.slutt?.(k);
        k.folk.oppdrag.lagreNaa();
        // Kameraet bak gutten igjen.
        k.cam.yaw = k.player.yaw + Math.PI;
        k.cam.pitch = -0.18;
        this.svart = SVART_S;
        for (const f of this.ferdig) f(a.film.id);
        k.hudSnart();
    }

    bilde(dt: number, kamera: THREE.PerspectiveCamera): void {
        this.klokke += dt;
        if (this.svart > 0) {
            this.svart -= dt;
            if (this.svart <= 0) this.k.hudSnart();
        }
        const a = this.a;
        if (!a) return;
        if (this.ut > 0) {
            this.ut -= dt;
            if (this.ut <= 0) {
                this.ut = 0;
                this.avslutt();
                return;
            }
        } else if (!this.venter) {
            a.t += dt;
            this.kjor(a.t);
            if (a.t >= a.film.lengde) {
                this.ut = SVART_S;
                this.k.hudSnart();
            }
        }
        this.flyttFigurer(dt);
        this.oppdaterKamera(dt);
        kamera.position.copy(a.pos);
        kamera.lookAt(a.blikk);
        if (Math.abs(kamera.fov - a.fov) > 0.01) {
            kamera.fov = a.fov;
            kamera.updateProjectionMatrix();
        }
    }

    kamera(kamera: THREE.PerspectiveCamera): boolean {
        const a = this.a;
        if (!a) return false;
        kamera.position.copy(a.pos);
        kamera.lookAt(a.blikk);
        return true;
    }

    private flyttFigurer(dt: number): void {
        const a = this.a!;
        for (const akt of a.aktorer.values()) {
            let maal = 0;
            if (akt.lop.length) {
                const p = akt.root.position;
                const n = akt.lop[0];
                _a.subVectors(n, p);
                const d = _a.length();
                if (d < 0.05) akt.lop.shift();
                else {
                    maal = akt.fart;
                    // Bremse inn mot siste punkt.
                    if (akt.lop.length === 1) maal = Math.min(maal, Math.max(0.25, d * 1.6));
                    const steg = Math.min(d, akt.v * dt);
                    p.addScaledVector(_a.normalize(), steg);
                    if (Math.hypot(_a.x, _a.z) > 0.01) {
                        const yaw = Math.atan2(_a.x, _a.z);
                        const diff = Math.atan2(Math.sin(yaw - akt.root.rotation.y), Math.cos(yaw - akt.root.rotation.y));
                        akt.root.rotation.y += diff * Math.min(1, dt * (akt.rek ? 0.8 : 8));
                    }
                }
            }
            akt.v += (maal - akt.v) * Math.min(1, dt * (akt.rek ? 0.6 : 5));
            if (akt.snakk > 0) {
                akt.snakk -= dt;
                if (akt.snakk <= 0 && akt.anim?.current === 'Idle_Talking_Loop') akt.anim.release(0.4);
            }
            akt.anim?.update(dt, akt.v);
            akt.rek?.oppdater?.(this.klokke);
        }
    }

    private oppdaterKamera(dt: number): void {
        void dt;
        const a = this.a!;
        const s = a.skudd;
        if (!s) return;
        const tid = a.t - a.skuddT;
        this.skuddPos(s, _a);
        this.mal(s.blikk, _b);
        if (s.til) {
            const u = smooth(Math.min(1, tid / a.skuddLengde));
            _a.lerp(V(s.til.pos), u);
            if (s.til.blikk) _b.lerp(V(s.til.blikk), u);
        }
        const fov = s.fov ?? 55;
        const g = s.glid ? smooth(Math.min(1, tid / s.glid)) : 1;
        a.pos.lerpVectors(a.fraPos, _a, g);
        a.blikk.lerpVectors(a.fraBlikk, _b, g);
        a.fov = a.fraFov + (fov - a.fraFov) * g;
    }

    hud(): FilmHud | null {
        if (!this.a && !this.laster && this.svart <= 0) return null;
        if (this.venter) return null;
        return {
            tekst: this.a?.tekst ?? null,
            svart: this.ut > 0 || this.laster || (!this.a && this.svart > 0),
            hopp: 'Mellomrom, E eller Esc: hopp over',
        };
    }

    dispose(): void {
        window.removeEventListener('keydown', this.onKey);
        window.removeEventListener('pointerdown', this.onStart);
        if (this.a) this.avslutt();
    }
}
