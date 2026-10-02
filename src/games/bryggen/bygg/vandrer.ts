// Folk som går faste ruter: skutedrengen som bærer fisk fra kaia inn i bua, svennen som rusler
// ned til kaia og ser ut over Vågen, folk som går langs kaia i nabogårdene.
//
// Ingen veifinning: ruta er en liste med punkter lagt der det er fritt (midt i gårdsrommet, et
// stykke inn fra kaikanten). Figuren går mot neste punkt, svinger med begrenset vinkelfart og
// bremser før punkter der hen skal stoppe. Står gutten i veien, stopper hen og sier fra.
// Kollisjon mot gutten får de nærmeste av en felles pool i verdenen (bryggen.ts).
import * as THREE from 'three';
import type { Animator } from '../motor/animator';
import type { CellCtx } from '../motor/streaming';
import type { FigurNavn } from './folk';
import { NAVN, trekk, VEI } from './samtaler';

export interface Stopp {
    /** Føttene, i verdensrom. */
    p: THREE.Vector3;
    /** Står så mange sekunder her. Uten: går rett videre (et hjørne på ruta). */
    vent?: number;
    /** Retningen hen ser mens hen står (0 = +z). */
    se?: number;
    /** Tar opp (true) eller legger fra seg (false) en bunt her. */
    last?: boolean;
}

export interface Rute {
    figur: FigurNavn;
    stopp: Stopp[];
    /** Gangfart i m/s. */
    fart?: number;
    /** Hvilket punkt hen starter ved. */
    start?: number;
}

const SVING = 3.2; // rad/s
const AKS = 2.2; // m/s²
const HANDLING = 1.4; // s: bøye seg, ta opp eller legge fra seg

const _d = new THREE.Vector3();

export class Vandrer {
    readonly pos: THREE.Vector3;
    yaw: number;
    speed = 0;
    private i: number;
    private vent = 0;
    private handling = 0;
    private nyLast: boolean | null = null;
    baerer = false;
    private blokkert = 0;
    private sistSagt = -99;
    private snudd: THREE.Vector3 | null = null;
    private readonly fart: number;
    readonly a: Animator;
    readonly rute: Rute;
    private readonly bunt: THREE.Object3D;

    constructor(a: Animator, rute: Rute, bunt: THREE.Object3D, seed: number) {
        this.a = a;
        this.rute = rute;
        this.bunt = bunt;
        const n = rute.stopp.length;
        const s0 = (rute.start ?? 0) % n;
        this.pos = rute.stopp[s0].p.clone();
        this.i = (s0 + 1) % n;
        const nxt = rute.stopp[this.i].p;
        this.yaw = Math.atan2(nxt.x - this.pos.x, nxt.z - this.pos.z);
        this.fart = (rute.fart ?? 1.15) * (0.92 + ((seed * 0.618) % 1) * 0.16);
        // Startet ruta etter et punkt der hen tok opp lasten, bærer hen allerede.
        for (let k = 0; k < n; k++) {
            const st = rute.stopp[(s0 - k + n) % n];
            if (st.last !== undefined) {
                this.baerer = st.last;
                break;
            }
        }
        this.visLast();
        this.a.root.position.copy(this.pos);
        this.a.root.rotation.y = this.yaw;
    }

    /** Snu seg mot noen og bli stående (samtale). `null`: gå videre. */
    vend(mot: THREE.Vector3 | null): void {
        this.snudd = mot ? mot.clone() : null;
    }

    private visLast(): void {
        this.bunt.visible = this.baerer;
        this.a.overlay(this.baerer ? 'Baere_Over' : null, 0.35);
    }

    private snu(mot: number, dt: number): number {
        const diff = Math.atan2(Math.sin(mot - this.yaw), Math.cos(mot - this.yaw));
        this.yaw += THREE.MathUtils.clamp(diff, -SVING * dt, SVING * dt);
        return diff;
    }

    /** Logikken (hvert bilde). Animasjonen oppdateres av eieren, som kan gjøre det sjeldnere langt unna. */
    step(dt: number, t: number, ctx: CellCtx): void {
        let maal = 0;
        if (this.snudd) {
            this.snu(Math.atan2(this.snudd.x - this.pos.x, this.snudd.z - this.pos.z), dt);
        } else if (this.handling > 0) {
            this.handling -= dt;
            if (this.nyLast !== null && this.handling < HANDLING * 0.45) {
                this.baerer = this.nyLast;
                this.nyLast = null;
                this.visLast();
            }
            if (this.handling <= 0) this.a.release(0.35);
        } else if (this.vent > 0) {
            this.vent -= dt;
            const se = this.rute.stopp[(this.i - 1 + this.rute.stopp.length) % this.rute.stopp.length].se;
            if (se !== undefined) this.snu(se, dt);
        } else {
            const st = this.rute.stopp[this.i];
            _d.subVectors(st.p, this.pos).setY(0);
            const dist = _d.length();
            const stopper = st.vent !== undefined || st.last !== undefined;
            if (dist < (stopper ? 0.1 : 0.45)) {
                this.i = (this.i + 1) % this.rute.stopp.length;
                this.vent = st.vent ?? 0;
                if (st.last !== undefined && st.last !== this.baerer) {
                    this.handling = HANDLING;
                    this.nyLast = st.last;
                    this.a.play('Interact', { fade: 0.25, timeScale: 1.15 });
                }
            } else {
                const diff = this.snu(Math.atan2(_d.x, _d.z), dt);
                const c = Math.max(0, Math.cos(diff));
                maal = this.fart * c * c;
                if (stopper) maal = Math.min(maal, dist * 1.3 + 0.12);
                // Gutten i veien: stopp, og si fra hvis han blir stående.
                const px = ctx.spiller.x - this.pos.x;
                const pz = ctx.spiller.z - this.pos.z;
                const pd = Math.hypot(px, pz);
                const foran = pd > 0.01 ? (px * Math.sin(this.yaw) + pz * Math.cos(this.yaw)) / pd : 1;
                if (Math.abs(ctx.spiller.y - this.pos.y) < 1.5 && (pd < 0.7 || (pd < 1.4 && foran > 0.3))) {
                    maal = 0;
                    this.blokkert += dt;
                    if (this.blokkert > 1.1 && t - this.sistSagt > 9) {
                        this.sistSagt = t;
                        ctx.si(NAVN[this.rute.figur], trekk(VEI[this.rute.figur], t));
                    }
                } else this.blokkert = 0;
                this.pos.y += (st.p.y - this.pos.y) * Math.min(1, dt * 5);
            }
        }
        this.speed += THREE.MathUtils.clamp(maal - this.speed, -AKS * 1.6 * dt, AKS * dt);
        if (this.speed < 0.01) this.speed = 0;
        this.pos.x += Math.sin(this.yaw) * this.speed * dt;
        this.pos.z += Math.cos(this.yaw) * this.speed * dt;
        this.a.root.position.copy(this.pos);
        this.a.root.rotation.y = this.yaw;
    }
}
