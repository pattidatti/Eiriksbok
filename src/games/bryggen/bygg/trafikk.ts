// Trafikken i Vågen: skip som kommer inn fra havet og ankrer, og færinger som ror fram og tilbake.
//
// Kogger inn og ut av Vågen og jekter med tørrfisk er blueprint §8.9 [V/U]. At Vågen var havna, og
// at folk ble rodd over til Stranden og varene losset med småbåter fra skip som lå for anker, er
// [S]: det er slik havner uten dypvannskai fungerte, men vi har ikke en kilde på Vågen i 1420-årene
// [K]. Rutene, tidene og hvem som ror, er valgt for spillet [S].
//
// Skipene seiler inn med seilet satt, ankrer, beslår seilet (rullet sammen på råa), ligger en stund og
// snur sakte (i havn ble skip ofte varpet eller slept rundt) før de seiler ut igjen og blir borte i
// tåka. Ute i tåka hopper de tilbake til start. Hvert skip er én MeshKit som i skip.ts, pluss råa med
// seilet satt og beslått som to små deler som byttes. Kolliderne flyttes med (færingen stopper mot dem).
//
// Færingene har én roer som sitter med ryggen forut, slik man ror, i takt med åretakene. De venter på
// hverandre og på skipene: ligger noe foran dem, holder de igjen og svinger unna. Vannet tegnes ikke
// inne i skrogene (vann.ts).
import * as THREE from 'three';
import type { Physics } from '../motor/physics';
import type { Materials } from '../motor/materials';
import { ColliderKit, MeshKit } from '../motor/meshkit';
import { WATER_Y } from '../motor/boat';
import { vannHoyde, type SkrogFot } from '../motor/vann';
import { KOGGE, lagKogge, type SkipInfo } from '../motor/kogge-modell';
import { jektSpec, lagJekt } from '../motor/jekt-modell';
import { raa, seilSatt, skrogKollider, vannlinje, type SkrogSpec } from '../motor/skrog';
import { lagFaeringSkrog } from '../motor/faering-modell';
import { Animator, loadRig } from '../motor/animator';
import { kleFigur, RIG_URL } from '../motor/figur';
import { cullFigur, FigurLod } from '../motor/figurlod';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DRAKTER, HOYDE, type FigurNavn } from './folk';
import { toGroup, tonne } from './gard';

const V2 = (x: number, z: number) => new THREE.Vector2(x, z);

/** Et punkt på kursen. `vent`: ligg stille så lenge. `anker`: seilet beslås mens skipet ligger. */
interface Punkt {
    p: THREE.Vector2;
    vent?: number;
    anker?: boolean;
    /** Hopp rett til neste punkt etter ventetiden (ute i tåka, der ingen ser det). */
    hopp?: boolean;
    /** Lasten kommer om bord (true) eller går i land (false) her. */
    last?: boolean;
    /** Retningen å ligge i mens hen venter (ellers den hen kom i). */
    se?: number;
}

export interface Trafikk {
    group: THREE.Group;
    /** Kalles hvert bilde. `spiller` er færingen gutten ror (de andre holder unna den). */
    update: (t: number, dt: number, kamera: THREE.Vector3, spiller: THREE.Object3D | null) => void;
    /** Omrisset av skrogene som er i vannet nå. */
    skrog: SkrogFot[];
    dispose: () => void;
}

const _v = new THREE.Vector2();

/** Noe som flytter seg på vannet etter en kurs. */
class Farkost {
    readonly pos: THREE.Vector2;
    yaw: number;
    speed = 0;
    i: number;
    vent = 0;
    holdt = 0;
    readonly kurs: Punkt[];
    readonly vmax: number;
    /** Hvor fort den svinger (rad/s) i full fart og stillestående. */
    readonly sving: [number, number];
    readonly aks: number;
    /** Halv lengde: hvor langt foran den ser etter noe i veien, og hvor stor den er for andre. */
    readonly r: number;
    readonly stor: boolean;
    paaAnker = false;
    lastet = false;

    constructor(kurs: Punkt[], start: number, o: { vmax: number; sving: [number, number]; aks: number; r: number; stor: boolean }) {
        this.kurs = kurs;
        this.vmax = o.vmax;
        this.sving = o.sving;
        this.aks = o.aks;
        this.r = o.r;
        this.stor = o.stor;
        const s = kurs[start % kurs.length];
        this.pos = s.p.clone();
        this.i = (start + 1) % kurs.length;
        const n = kurs[this.i].p;
        this.yaw = Math.atan2(n.x - s.p.x, n.y - s.p.y);
        if (s.vent) {
            this.vent = s.vent * 0.5;
            this.i = start % kurs.length;
            this.paaAnker = !!s.anker;
            if (s.se !== undefined) this.yaw = s.se;
        }
    }

    /** Hvor mye noe ligger i veien foran (0 fritt, 1 stopp). */
    private iVeien(andre: { pos: THREE.Vector2; r: number; stor: boolean }[]): number {
        const fx = Math.sin(this.yaw);
        const fz = Math.cos(this.yaw);
        let verst = 0;
        for (const o of andre) {
            if (o.pos === this.pos) continue;
            // De store skipene viker bare for gutten; færingene viker for alle.
            if (this.stor && o.stor) continue;
            const dx = o.pos.x - this.pos.x;
            const dz = o.pos.y - this.pos.y;
            const foran = dx * fx + dz * fz;
            const side = Math.abs(dx * fz - dz * fx);
            const lang = this.r + o.r + (this.stor ? 14 : 7);
            if (foran < 0 || foran > lang || side > this.r * 0.4 + o.r * 0.6 + 1.6) continue;
            verst = Math.max(verst, 1 - Math.max(0, foran - this.r - o.r) / (lang - this.r - o.r));
        }
        return verst;
    }

    step(dt: number, andre: { pos: THREE.Vector2; r: number; stor: boolean }[]): void {
        const st = this.kurs[this.i];
        if (this.vent > 0) {
            this.vent -= dt;
            this.speed = Math.max(0, this.speed - this.aks * dt);
            if (st.se !== undefined) this.snu(st.se, dt, 0.25);
            if (this.vent <= 0) {
                this.paaAnker = false;
                if (st.last !== undefined) this.lastet = st.last;
                if (st.hopp) {
                    this.i = (this.i + 1) % this.kurs.length;
                    this.pos.copy(this.kurs[this.i].p);
                    const n = this.kurs[(this.i + 1) % this.kurs.length].p;
                    this.yaw = Math.atan2(n.x - this.pos.x, n.y - this.pos.y);
                    this.speed = this.vmax * 0.7;
                }
                this.i = (this.i + 1) % this.kurs.length;
            }
        } else {
            _v.subVectors(st.p, this.pos);
            const d = _v.length();
            const stopper = st.vent !== undefined;
            if (d < (stopper ? Math.max(0.6, this.r * 0.15) : this.r * 0.8 + 2)) {
                if (stopper) {
                    this.vent = st.vent ?? 0;
                    this.paaAnker = !!st.anker;
                } else this.i = (this.i + 1) % this.kurs.length;
            } else {
                const veien = this.iVeien(andre);
                this.holdt = veien > 0.5 ? this.holdt + dt : 0;
                // Holder noe den igjen lenge, svinger den unna (styrbord).
                const unna = this.holdt > 4 ? 0.7 : 0;
                const diff = this.snu(Math.atan2(_v.x, _v.y) + unna, dt, 1);
                let maal = this.vmax * Math.max(0.15, Math.cos(diff));
                if (stopper) maal = Math.min(maal, Math.sqrt(2 * this.aks * 0.5 * d) + 0.1);
                maal *= 1 - Math.min(1, veien) * (unna > 0 ? 0.7 : 1);
                this.speed += THREE.MathUtils.clamp(maal - this.speed, -this.aks * 1.5 * dt, this.aks * dt);
            }
        }
        this.speed = Math.max(0, this.speed);
        this.pos.x += Math.sin(this.yaw) * this.speed * dt;
        this.pos.y += Math.cos(this.yaw) * this.speed * dt;
    }

    /** Svinger mot `mot`; et skip svinger fortere jo fortere det går. */
    private snu(mot: number, dt: number, f: number): number {
        const diff = Math.atan2(Math.sin(mot - this.yaw), Math.cos(mot - this.yaw));
        const w = (this.sving[1] + (this.sving[0] - this.sving[1]) * Math.min(1, this.speed / this.vmax)) * f;
        this.yaw += THREE.MathUtils.clamp(diff, -w * dt, w * dt);
        return diff;
    }
}

/** Et skip som seiler: skroget, råa med seilet satt og beslått, og kollideren. */
class Seiler {
    readonly f: Farkost;
    readonly root = new THREE.Group();
    private readonly satt: THREE.Object3D;
    private readonly beslatt: THREE.Object3D;
    private readonly sp: SkrogSpec;
    private readonly fot: SkrogFot;
    private readonly vl: { L: number; B: number; fyldig: number; forut: number };
    private readonly kol: ReturnType<Physics['addMovingHull']>;
    /** Sikt-skjermer (kastellene, og seilet når det er satt) for navneskiltene. */
    private readonly skjerm: NonNullable<ReturnType<Physics['addMovingHull']>>[] = [];
    private seilSkjerm: ReturnType<Physics['addMovingHull']> = null;
    private heling = 0;
    private seilet = 1;

    constructor(phys: Physics, mats: Materials, navn: string, f: Farkost, bygg: (k: MeshKit) => { info: SkipInfo; sp: SkrogSpec }) {
        this.f = f;
        const k = new MeshKit();
        const { info, sp } = bygg(k);
        this.sp = sp;
        this.root.add(toGroup(k, mats, navn));
        const ra = info.raa;
        const tint = { top: 0.8, bottom: 0.8, hue: [1.04, 0.98, 0.9] as [number, number, number] };
        const ks = new MeshKit();
        seilSatt(ks, ra.z, ra.y, ra.halv, ra.bunn, ra.halv * 0.16, tint);
        const kb = new MeshKit();
        raa(kb, ra.z, ra.y - 0.4, ra.halv, tint, ra.seilR);
        this.satt = toGroup(ks, mats, `${navn}:seil`);
        this.beslatt = toGroup(kb, mats, `${navn}:beslatt`);
        this.root.add(this.satt, this.beslatt);
        this.root.rotation.order = 'YXZ';
        this.vl = vannlinje(sp, 0.3);
        this.fot = { x: 0, z: 0, yaw: 0, L: this.vl.L, B: this.vl.B, fyldig: this.vl.fyldig };
        const c = new ColliderKit();
        skrogKollider(c, sp);
        const pts = c.specs.flatMap((s) => (s.kind === 'hull' ? s.points : []));
        this.kol = phys.addMovingHull(pts);
        for (const sk of info.skjerm ?? []) {
            const h = phys.addMovingHull(sk, true);
            if (h) this.skjerm.push(h);
        }
        const seil: THREE.Vector3[] = [];
        for (const x of [-ra.halv, ra.halv]) for (const y of [ra.bunn, ra.y]) for (const dz of [-0.15, ra.halv * 0.16]) seil.push(new THREE.Vector3(x, y, ra.z + dz));
        this.seilSkjerm = phys.addMovingHull(seil, true);
    }

    update(t: number, dt: number, kamera: THREE.Vector3): SkrogFot {
        const f = this.f;
        // Seilet beslås når skipet ligger for anker, og settes når det skal ut igjen.
        const vil = f.paaAnker || (f.vent > 0 && f.speed < 0.3) ? 0 : 1;
        this.seilet += THREE.MathUtils.clamp(vil - this.seilet, -dt * 0.5, dt * 0.5);
        this.satt.visible = this.seilet > 0.5;
        this.beslatt.visible = !this.satt.visible;
        // Duken buker mindre mens den heises og fires (skalert i høyden fra råa).
        this.satt.scale.set(1, 1, Math.max(0.2, this.seilet));
        const x = f.pos.x;
        const z = f.pos.y;
        const fx = Math.sin(f.yaw);
        const fz = Math.cos(f.yaw);
        const l = this.sp.L * 0.7;
        const b = this.sp.B;
        const hF = vannHoyde(x + fx * l, z + fz * l, t);
        const hA = vannHoyde(x - fx * l, z - fz * l, t);
        const hB = vannHoyde(x + fz * b, z - fx * b, t);
        const hS = vannHoyde(x - fz * b, z + fx * b, t);
        // Under seil heller skipet litt for vinden.
        this.heling += ((this.seilet > 0.5 ? 0.035 : 0) * Math.min(1, f.speed / f.vmax) - this.heling) * Math.min(1, dt * 0.4);
        this.root.position.set(x, WATER_Y - 0.15 + (hF + hA + hB + hS) / 4 + Math.sin(t * 0.55 + x) * 0.035, z);
        this.root.rotation.y = f.yaw;
        this.root.rotation.x = -(hF - hA) / (2 * l) + Math.sin(t * 0.41 + 1.3) * 0.004;
        this.root.rotation.z = (hB - hS) / (2 * b) + Math.sin(t * 0.83) * 0.012 + this.heling;
        this.root.visible = this.root.position.distanceTo(kamera) < 190;
        this.kol?.flytt(x, WATER_Y, z, f.yaw);
        for (const sk of this.skjerm) sk.flytt(x, WATER_Y, z, f.yaw);
        this.seilSkjerm?.flytt(x, this.satt.visible ? WATER_Y : -100, z, f.yaw);
        const fot = this.fot;
        fot.x = x + fx * this.vl.forut;
        fot.z = z + fz * this.vl.forut;
        fot.yaw = f.yaw;
        return fot;
    }

    dispose(): void {
        this.kol?.fjern();
        for (const sk of this.skjerm) sk.fjern();
        this.seilSkjerm?.fjern();
        this.root.traverse((o) => {
            if (o instanceof THREE.Mesh) o.geometry.dispose();
        });
    }
}

/** Færingens mål (som i boat.ts): taket tar 1,25 s, bladene er i vannet den første delen. */
const TAK_S = 1.35;
const DRIVE = 0.42;
const ease = (x: number) => x * x * (3 - 2 * x);

interface Sittende {
    a: Animator;
    h: number;
}

/** En færing med en roer, og kanskje en passasjer og last. */
class Robaat {
    readonly f: Farkost;
    readonly root = new THREE.Group();
    private readonly aarer: THREE.Group[] = [];
    private readonly roer: Animator;
    private readonly folk: Animator[] = [];
    private readonly last: THREE.Object3D | null;
    private fase = Math.random();
    private ror = 0;
    private readonly kol: ReturnType<Physics['addMovingHull']>;
    private readonly fot: SkrogFot = { x: 0, z: 0, yaw: 0, L: 2.85, B: 0.72, fyldig: 2 };
    private readonly lean = new THREE.Euler();
    private acc = 0;
    private readonly meshes: THREE.Mesh[] = [];
    /** Roeren og passasjeren: grove og uten skygge bak `GROV_R` (figurlod.ts). */
    private readonly lod: FigurLod[] = [];

    constructor(phys: Physics, mat: THREE.Material, mork: THREE.Material, f: Farkost, roerF: Sittende, passasjerF: Sittende | null, last: THREE.Object3D | null) {
        const roer = roerF.a;
        const passasjer = passasjerF?.a ?? null;
        this.f = f;
        const skrog = lagFaeringSkrog(mat, mork);
        this.root.add(skrog);
        for (const side of [1, -1]) {
            const pivot = new THREE.Group();
            pivot.position.set(side * 0.74, 0.4, -0.25);
            const blade = new THREE.BoxGeometry(0.7, 0.02, 0.13).translate(side * 1.0, 0, 0);
            const shaft = new THREE.Mesh(mergeGeometries([new THREE.BoxGeometry(2.6, 0.05, 0.05), blade]), mat);
            shaft.position.x = side * 0.9;
            pivot.add(shaft);
            this.root.add(pivot);
            this.aarer.push(pivot);
        }
        // Roeren sitter på tofta med ryggen forut (som gutten i boat.ts / game.ts).
        this.roer = roer;
        roer.root.position.set(0, 0.22 - 0.5 * (roerF.h / 1.58), -0.25);
        roer.root.rotation.y = Math.PI;
        roer.play('Row', { fade: 0.01, loop: true });
        this.root.add(roer.root);
        this.folk.push(roer);
        if (passasjer) {
            // Passasjeren sitter akter og ser forut.
            passasjer.root.position.set(0, 0.2 - 0.5 * ((passasjerF?.h ?? 1.6) / 1.58), -1.55);
            passasjer.play('Sitting_Idle_Loop', { fade: 0.01, loop: true, startAt: Math.random() });
            this.root.add(passasjer.root);
            this.folk.push(passasjer);
        }
        this.last = last;
        if (last) this.root.add(last);
        // Ytelse: alt i båten er frustum-culled (også i skyggen). Med `frustumCulled = false` ble
        // båtene og roerne tegnet bak kameraet og kastet skygge langt utenfor skyggekameraet.
        for (const a of this.folk) {
            a.update(0.02, 0);
            cullFigur(a.model);
            this.lod.push(new FigurLod(a.model));
        }
        this.root.traverse((o) => {
            if ((o as THREE.Mesh).isMesh && !(o as THREE.SkinnedMesh).isSkinnedMesh) {
                const m = o as THREE.Mesh;
                m.castShadow = true;
                m.frustumCulled = true;
                this.meshes.push(m);
            }
        });
        const pts: THREE.Vector3[] = [];
        for (const x of [-0.7, 0.7]) for (const y of [-0.2, 0.7]) for (const z of [-2.8, 2.8]) pts.push(new THREE.Vector3(x * (Math.abs(z) > 2 ? 0.5 : 1), y, z));
        pts.push(new THREE.Vector3(0.75, 0.4, 0), new THREE.Vector3(-0.75, 0.4, 0));
        this.kol = phys.addMovingHull(pts);
    }

    update(t: number, dt: number, kamera: THREE.Vector3): SkrogFot {
        const f = this.f;
        // Åretakene: farten kommer i dytt mens bladene er i vannet. Farkosten regner jevn fart, så
        // her legges bare et lite rykk oppå.
        const vil = f.speed > 0.15 ? 1 : 0;
        this.ror += (vil - this.ror) * Math.min(1, dt * 3);
        if (this.ror > 0.05 || this.fase > 0.02) this.fase = (this.fase + dt / TAK_S) % 1;
        if (this.ror < 0.05 && this.fase < 0.03) this.fase = 0;
        const p = this.fase;
        const x = f.pos.x;
        const z = f.pos.y;
        const bob = Math.sin(t * 1.3 + x * 0.3) * 0.04 + Math.sin(t * 0.7 + z * 0.2) * 0.03;
        const surge = p < DRIVE ? Math.sin((p / DRIVE) * Math.PI) * 0.025 * this.ror : 0;
        this.root.position.set(x, WATER_Y + bob, z);
        this.root.rotation.set(Math.sin(t * 1.1 + x) * 0.02 - surge, f.yaw, Math.sin(t * 0.9 + 1 + z) * 0.03);
        const d = this.root.position.distanceTo(kamera);
        this.root.visible = d < 110;
        for (const m of this.meshes) m.castShadow = d < 30;
        for (const l of this.lod) l.sett(d);
        this.kol?.flytt(x, WATER_Y, z, f.yaw);
        if (this.root.visible) {
            const sweep = p < DRIVE ? THREE.MathUtils.lerp(-0.55, 0.55, ease(p / DRIVE)) : THREE.MathUtils.lerp(0.55, -0.55, ease((p - DRIVE) / (1 - DRIVE)));
            const lift = p < DRIVE ? -0.12 : 0.1 + Math.sin(((p - DRIVE) / (1 - DRIVE)) * Math.PI) * 0.08;
            this.aarer.forEach((a, i) => {
                const side = i === 0 ? 1 : -1;
                a.rotation.set(0, side * sweep * this.ror, side * lift * this.ror + side * (1 - this.ror) * 0.35);
            });
            const lean = p < DRIVE ? THREE.MathUtils.lerp(0.45, -0.3, ease(p / DRIVE)) : THREE.MathUtils.lerp(-0.3, 0.45, ease((p - DRIVE) / (1 - DRIVE)));
            this.lean.set(lean * 0.5 * this.ror, 0, 0);
            this.roer.setBoneOffset('DEF-spine.001', this.lean);
            this.roer.setBoneOffset('DEF-spine.002', this.lean);
            // Nær: animasjonen hvert bilde; lenger unna sjeldnere.
            this.acc += dt;
            if (d < 20 || this.acc > 1 / 12) {
                for (const a of this.folk) a.update(this.acc, 0);
                this.acc = 0;
            }
        }
        if (this.last) this.last.visible = f.lastet;
        const fot = this.fot;
        fot.x = x;
        fot.z = z;
        fot.yaw = f.yaw;
        return fot;
    }

    dispose(): void {
        this.kol?.fjern();
        for (const a of this.folk) {
            a.mixer.stopAllAction();
            a.mixer.uncacheRoot(a.model);
        }
        for (const o of this.aarer) o.traverse((m) => (m instanceof THREE.Mesh ? m.geometry.dispose() : null));
    }
}

export interface TrafikkOppsett {
    /** Bryggefronten langs x (gårdene), og kaifronten (z) ved x. */
    xw: number;
    xe: number;
    kaiFront: (x: number) => number;
    /** Den innerste enden av Vågen (Vågsbunnen), der fiskeren legger til. */
    bunnX: number;
    /** Bryggetrappene i Vågsbunnen (x): fiskeren legger til ved den ene, og båter ligger fortøyd ved de andre. */
    brygger: number[];
    /** Jekta som ligger for anker: lekteren losser den. */
    anker: { x: number; z: number; yaw: number };
}

export async function lagTrafikk(phys: Physics, mats: Materials, o: TrafikkOppsett): Promise<Trafikk> {
    const group = new THREE.Group();
    group.name = 'trafikk';
    const ut = o.xe + 115; // ute i tåka, forbi Holmen

    // ── Skipene ──
    const kogge = new Farkost([
        { p: V2(ut, -80) },
        { p: V2(o.xe - 20, -66) },
        { p: V2(48, -50), vent: 170, anker: true },
        { p: V2(70, -74) },
        { p: V2(ut, -92), vent: 50, hopp: true },
    ], 2, { vmax: 2.4, sving: [0.07, 0.035], aks: 0.12, r: KOGGE.L, stor: true });
    const jekt = new Farkost([
        { p: V2(ut, -98) },
        { p: V2(20, -84) },
        { p: V2(-62, -60), vent: 210, anker: true },
        { p: V2(-30, -88) },
        { p: V2(ut, -104), vent: 90, hopp: true },
    ], 0, { vmax: 2.8, sving: [0.09, 0.045], aks: 0.16, r: 7.6, stor: true });
    jekt.pos.x -= 60; // er allerede på vei inn
    const seilere = [
        new Seiler(phys, mats, 'kogge-seil', kogge, (k) => ({ info: lagKogge(k, false), sp: KOGGE })),
        new Seiler(phys, mats, 'jekt-seil', jekt, (k) => {
            const sp = jektSpec(1.05);
            return { info: lagJekt(k, sp, 0.9, 11, false), sp };
        }),
    ];
    for (const s of seilere) group.add(s.root);

    // ── Færingene ──
    const rig = await loadRig(RIG_URL);
    const figur = (navn: FigurNavn, sitter: boolean): Sittende => ({
        a: new Animator(kleFigur(rig, sitter ? { ...DRAKTER[navn], navn: `${navn}:sitt`, sitter: true } : DRAKTER[navn]), HOYDE[navn]),
        h: HOYDE[navn],
    });
    const mat = new THREE.MeshStandardMaterial({ map: mats.get('raatre').map, color: 0xa88e76, roughness: 0.8 });
    const mork = mat.clone();
    mork.side = THREE.BackSide;
    mork.color.multiplyScalar(0.5);

    const kai = (x: number) => o.kaiFront(x) - 3.4; // baugen et stykke fra bolverket
    const SJO = Math.PI;
    // Ferja til Stranden: legger til ved kaia foran den første gården, med en passasjer.
    const ferje = new Farkost([
        { p: V2(6.5, kai(6.5)), vent: 22, se: 0 },
        { p: V2(4, -14) },
        { p: V2(-6, -62) },
        { p: V2(-9, -113), vent: 28, se: SJO },
        { p: V2(-4, -62) },
        { p: V2(3, -15) },
    ], 1, { vmax: 1.5, sving: [0.9, 0.7], aks: 0.6, r: 2.9, stor: false });
    // Lekteren: henter tørrfisk fra jekta som ligger for anker og ror den inn til kaia.
    const a = o.anker;
    const side = new THREE.Vector2(Math.cos(a.yaw), -Math.sin(a.yaw));
    const vedJekt = V2(a.x - side.x * 3.4, a.z - side.y * 3.4);
    const lx = a.x + 3;
    const lekter = new Farkost([
        { p: vedJekt, vent: 18, se: a.yaw, last: true },
        { p: V2(lx, -9) },
        { p: V2(lx, kai(lx)), vent: 20, se: 0, last: false },
        { p: V2(lx - 1, -9) },
    ], 2, { vmax: 1.1, sving: [0.8, 0.6], aks: 0.5, r: 2.9, stor: false });
    // Fiskeren legger til ved flåten nederst i den vestligste bryggetrappa.
    const fx = o.brygger.length ? Math.min(...o.brygger) : o.bunnX + 10;
    // Fiskeren: ror inn fra havet med fangsten, legger til innerst i Vågen og ror ut igjen.
    const fisker = new Farkost([
        { p: V2(ut - 30, -34), vent: 40, hopp: true },
        { p: V2(o.xe - 10, -30) },
        { p: V2(-20, -34) },
        { p: V2(-55, -32) },
        { p: V2(fx + 6, -14) },
        { p: V2(fx, o.kaiFront(fx) - 3.8), vent: 45, se: -Math.PI / 2, last: false },
        { p: V2(fx + 8, -16) },
        { p: V2(-55, -40) },
        { p: V2(o.xe - 10, -40) },
        { p: V2(ut - 30, -40), vent: 30, hopp: true, last: true },
    ], 1, { vmax: 1.3, sving: [0.8, 0.6], aks: 0.5, r: 2.9, stor: false });
    fisker.lastet = true;
    lekter.lastet = true;

    // Bunter tørrfisk surret med tau, som buntene i bua, alle i én del (ett tegnekall).
    const lastBunter = () => {
        const k = new MeshKit();
        for (const [x, z, y] of [[-0.25, 0.7, 0], [0.25, 0.7, 0], [0, 1.15, 0], [0, 0.9, 0.27]] as const) {
            k.at(x, 0.18 + y, z, 0, () => {
                k.withUv(0.04, () => k.withTint({ top: 1.45, bottom: 1.1, hue: [1.02, 0.98, 0.86] }, () => k.box('raatre', 0, 0, 0, 0.5, 0.26, 0.3, { grain: 'x' })));
                k.withTint({ top: 1.1, bottom: 0.9, hue: [1.12, 1.02, 0.8] }, () => {
                    for (const dx of [-0.13, 0.13]) k.box('raatre', dx, 0, 0, 0.035, 0.27, 0.31);
                });
            });
        }
        return toGroup(k, mats, 'lekterlast');
    };
    const lastFisk = () => {
        const k = new MeshKit();
        tonne(k, new ColliderKit(), 0.2, 0.9, 0.7);
        k.withTint({ top: 0.75, bottom: 0.75, hue: [1.05, 0.98, 0.9] }, () => k.log('raatre', new THREE.Vector3(-0.25, 0, 1.25), new THREE.Vector3(-0.25, 0.32, 1.25), 0.26, 10, false, 0.3));
        k.withTint({ top: 1.4, bottom: 1.4, hue: [0.82, 0.88, 0.95] }, () => k.withUv(0.04, () => k.log('raatre', new THREE.Vector3(-0.25, 0.05, 1.25), new THREE.Vector3(-0.25, 0.28, 1.25), 0.24, 10, true, 0.28)));
        const g = toGroup(k, mats, 'fiskelast');
        g.position.y = -0.12;
        return g;
    };
    const baater = [
        new Robaat(phys, mat, mork, ferje, figur('fisker', true), figur('kjopekone', true), null),
        new Robaat(phys, mat, mork, lekter, figur('dreng', true), null, lastBunter()),
        new Robaat(phys, mat, mork, fisker, figur('fisker', true), null, lastFisk()),
    ];
    for (const b of baater) group.add(b.root);
    // Færinger som ligger fortøyd ved bryggene i Vågsbunnen: bare skroget, som gynger [S].
    const fortoyd: { g: THREE.Group; x: number; z: number; yaw: number; fot: SkrogFot }[] = [];
    o.brygger.forEach((bx, i) => {
        const x = bx + 4.2;
        const yaw = i % 2 ? Math.PI / 2 : -Math.PI / 2;
        const z = o.kaiFront(x) - 1.35;
        const g = new THREE.Group();
        g.add(lagFaeringSkrog(mat, mork));
        g.traverse((m) => {
            if ((m as THREE.Mesh).isMesh) m.castShadow = true;
        });
        group.add(g);
        fortoyd.push({ g, x, z, yaw, fot: { x, z, yaw, L: 2.85, B: 0.72, fyldig: 2 } });
    });

    const alle = [...seilere.map((s) => s.f), ...baater.map((b) => b.f)];
    const gutt = { pos: new THREE.Vector2(0, 9999), r: 2.9, stor: false };
    const andre: { pos: THREE.Vector2; r: number; stor: boolean }[] = [...alle, gutt];
    const skrog: SkrogFot[] = [];
    return {
        group,
        skrog,
        update: (t, dt, kamera, spiller) => {
            if (spiller) gutt.pos.set(spiller.position.x, spiller.position.z);
            dt = Math.min(dt, 0.1);
            for (const f of alle) f.step(dt, andre);
            skrog.length = 0;
            for (const s of seilere) skrog.push(s.update(t, dt, kamera));
            for (const b of baater) skrog.push(b.update(t, dt, kamera));
            for (const f of fortoyd) {
                f.g.position.set(f.x, WATER_Y + vannHoyde(f.x, f.z, t) * 0.8, f.z);
                f.g.rotation.set(Math.sin(t * 0.9 + f.x) * 0.02, f.yaw, Math.sin(t * 1.1 + f.x) * 0.035);
                f.g.visible = f.g.position.distanceTo(kamera) < 90;
                skrog.push(f.fot);
            }
        },
        dispose: () => {
            for (const s of seilere) s.dispose();
            for (const b of baater) b.dispose();
            mat.dispose();
            mork.dispose();
        },
    };
}
