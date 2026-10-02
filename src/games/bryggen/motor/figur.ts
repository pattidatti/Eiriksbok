// Figurer med klær, laget av UAL-riggen (mannequin.glb).
//
// Mannequinen er glatt og naken. Her blir den en person: hvert hjørne får en farge etter hvilket
// bein det følger (hud, kjortel, hoser, sko, hette), klærne blåses litt ut fra beinet, og noen
// ting legges til: skjørtet på kjortelen, kappa og tuten på hetta og en pung i beltet. Alt blir én
// geometri og ett materiale med hjørnefarger, så hver figur er én tegning (og én skygge).
//
// Kroppen formes også her: mage, smalere kropp for en gutt, litt større hode. Mannequinen er
// en bodybuilder, så musklene jevnes ut: armene mot en jevn radius, overkroppen mot en ellipse.
// Kappa på hetta er et eget skall over skuldrene, og kroppen under den trekkes inn. Hodet og
// ansiktet byttes ut (hode.ts). Alt gjøres i hvilestillingen (T-stilling), før skinningen, så
// animasjonene virker som før.
//
// Formen bestemmes av en `Drakt`. Drakter med samme navn deler geometri.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { RigTemplate } from './animator';
import { ansikt, hodet, type Kropp } from './hode';

export const RIG_URL = '/games/bryggen/models/mannequin.glb';

export interface Drakt {
    navn: string;
    hud: number;
    haar: number;
    /** Skjegg på nedre del av ansiktet. Utelates for glatte ansikter. */
    skjegg?: number;
    kjortel: number;
    /** Hvor langt kjortelen går: meter under kneet (negativt = over kneet). */
    kjortelNed: number;
    belte: number;
    hoser: number;
    sko: number;
    hette: number;
    /** Hetta oppe på hodet, eller nede som en krage rundt halsen. */
    hetteOppe: boolean;
    /** Lengden på tuten bak på hetta (m). */
    tut: number;
    /** Hvor langt kappa på hetta går ned over skuldrene (m). */
    kappe: number;
    /** 0-1: mage. */
    mage?: number;
    /** 0-1: smalere kropp og lemmer. */
    slank?: number;
    /** Hodet skalert rundt halsen (1 = som riggen). */
    hode?: number;
    pung?: number;
}

const cache = new Map<string, RigTemplate>();

/** Kler på riggen. Klippene deles med originalen; bare figuren er ny. */
export function kleFigur(rig: RigTemplate, d: Drakt): RigTemplate {
    const hit = cache.get(d.navn);
    if (hit) return hit;
    const scene = cloneSkinned(rig.scene) as THREE.Group;
    scene.updateMatrixWorld(true);
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((o) => {
        if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh);
    });
    const first = meshes[0];
    const geo = new Kledd(first, meshes, d).build();
    const mat = new THREE.MeshStandardMaterial({ name: 'M_Main', vertexColors: true, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
    const mesh = new THREE.SkinnedMesh(geo, mat);
    mesh.name = `figur:${d.navn}`;
    mesh.bind(first.skeleton, first.bindMatrix);
    first.parent!.add(mesh);
    for (const m of meshes) m.parent!.remove(m);
    const t: RigTemplate = { scene, clips: rig.clips, height: rig.height };
    cache.set(d.navn, t);
    return t;
}

// ── Byggingen ──

export type Del = 'hud' | 'haar' | 'skjegg' | 'kjortel' | 'belte' | 'hoser' | 'sko' | 'hette';

const smooth = THREE.MathUtils.smoothstep;
const gauss = (x: number) => Math.exp(-x * x);

class Kledd implements Kropp {
    readonly d: Drakt;
    private readonly meshes: THREE.SkinnedMesh[];
    private readonly bones: THREE.Bone[];
    private readonly boneIx = new Map<string, number>();
    private readonly toLocal: THREE.Matrix4;
    // Landemerker i hvilestillingen (meshens rom: y opp, ansiktet mot +z, venstre er +x).
    private readonly at = new Map<string, THREE.Vector3>();
    headC = new THREE.Vector3();
    headR = 0.12;
    /** Mannequinhodets mål (etter formingen): bredde og dybde for det nye hodet. */
    headBox = new THREE.Box3();
    private waistY = 0;
    private kneeY = 0;
    private hemY = 0;
    private shoulderY = 0;
    /** Snittradien til armbeina (etter formingen), så musklene kan jevnes ut. */
    private readonly snitt = new Map<string, number>();
    /** Tverrsnittet av overkroppen per 2 cm i høyden: halve bredden, og dybden foran og bak. */
    private bandX: number[] = [];
    private bandZ0: number[] = [];
    private bandZ1: number[] = [];
    private bandY0 = 0;
    snittHals = 0;

    pos: number[] = [];
    private col: number[] = [];
    private skinI: number[] = [];
    private skinW: number[] = [];
    index: number[] = [];

    constructor(first: THREE.SkinnedMesh, meshes: THREE.SkinnedMesh[], d: Drakt) {
        this.d = d;
        this.meshes = meshes;
        this.bones = first.skeleton.bones;
        this.bones.forEach((b, i) => this.boneIx.set(b.name, i));
        this.toLocal = first.matrixWorld.clone().invert();
        for (const b of this.bones) this.at.set(b.name, b.getWorldPosition(new THREE.Vector3()).applyMatrix4(this.toLocal));
    }

    bone(name: string): number {
        return this.boneIx.get(THREE.PropertyBinding.sanitizeNodeName(name)) ?? 0;
    }

    p(name: string): THREE.Vector3 {
        return this.at.get(THREE.PropertyBinding.sanitizeNodeName(name)) ?? new THREE.Vector3();
    }

    build(): THREE.BufferGeometry {
        const d = this.d;
        // Hodet: midten og radien fra hjørnene som følger hodebeinet.
        const head = this.bone('DEF-head');
        const hb = new THREE.Box3();
        this.eachVertex((v, b) => {
            if (b !== head) return;
            this.forme(v, this.bones[b].name);
            hb.expandByPoint(v);
        });
        hb.getCenter(this.headC);
        this.headR = (hb.max.y - hb.min.y) / 2;
        this.headBox = hb;
        const hips = this.p('DEF-hips');
        const chest = this.p('DEF-spine.003');
        this.waistY = hips.y + (chest.y - hips.y) * 0.32;
        this.kneeY = this.p('DEF-shin.L').y;
        this.hemY = this.kneeY - d.kjortelNed;
        this.shoulderY = this.p('DEF-upper_arm.L').y;

        this.maalLemmer();
        for (const m of this.meshes) this.addMesh(m);
        this.forenkle(0.02);
        // Det som legges til etter forenklingen: småting i ansiktet ville ellers smeltet sammen
        // på 2 cm-rutenettet (øynene ble streker).
        this.skjort();
        this.kappe();
        this.tut();
        if (d.pung) this.pungen();
        ansikt(this, hodet(this));

        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
        g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(this.skinI, 4));
        g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(this.skinW, 4));
        g.setIndex(this.index);
        g.computeVertexNormals();
        g.computeBoundingSphere();
        return g;
    }

    /**
     * Slår sammen hjørner som ligger i samme rute på `cell` meter, har samme farge og følger
     * samme bein. Mannequinen har kuler i hvert ledd og ti fingre med tre ledd hver; under klærne
     * og på avstand synes ikke de detaljene, og figuren går fra ca. 14k til en brøkdel.
     * Trekanter som faller sammen, kastes.
     */
    private forenkle(cell: number): void {
        const n = this.pos.length / 3;
        const map = new Int32Array(n);
        const keys = new Map<string, number>();
        const sum: number[] = [];
        const cnt: number[] = [];
        const keep: number[] = [];
        for (let i = 0; i < n; i++) {
            const x = this.pos[i * 3];
            const y = this.pos[i * 3 + 1];
            const z = this.pos[i * 3 + 2];
            let bone = 0;
            for (let c = 1; c < 4; c++) if (this.skinW[i * 4 + c] > this.skinW[i * 4 + bone]) bone = c;
            const key = `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)},${this.skinI[i * 4 + bone]},${this.col[i * 3].toFixed(3)},${this.col[i * 3 + 2].toFixed(3)}`;
            let k = keys.get(key);
            if (k === undefined) {
                k = keep.length;
                keys.set(key, k);
                keep.push(i);
                sum.push(0, 0, 0);
                cnt.push(0);
            }
            map[i] = k;
            sum[k * 3] += x;
            sum[k * 3 + 1] += y;
            sum[k * 3 + 2] += z;
            cnt[k]++;
        }
        const pos: number[] = [];
        const col: number[] = [];
        const si: number[] = [];
        const sw: number[] = [];
        keep.forEach((i, k) => {
            pos.push(sum[k * 3] / cnt[k], sum[k * 3 + 1] / cnt[k], sum[k * 3 + 2] / cnt[k]);
            col.push(this.col[i * 3], this.col[i * 3 + 1], this.col[i * 3 + 2]);
            for (let c = 0; c < 4; c++) {
                si.push(this.skinI[i * 4 + c]);
                sw.push(this.skinW[i * 4 + c]);
            }
        });
        const index: number[] = [];
        const seen = new Set<string>();
        for (let t = 0; t < this.index.length; t += 3) {
            const a = map[this.index[t]];
            const b = map[this.index[t + 1]];
            const c = map[this.index[t + 2]];
            if (a === b || b === c || a === c) continue;
            const key = [a, b, c].sort((p, q) => p - q).join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            index.push(a, b, c);
        }
        this.pos = pos;
        this.col = col;
        this.skinI = si;
        this.skinW = sw;
        this.index = index;
    }

    private eachVertex(fn: (v: THREE.Vector3, bone: number) => void): void {
        const v = new THREE.Vector3();
        for (const m of this.meshes) {
            const pa = m.geometry.getAttribute('position');
            const si = m.geometry.getAttribute('skinIndex');
            const sw = m.geometry.getAttribute('skinWeight');
            for (let i = 0; i < pa.count; i++) {
                v.fromBufferAttribute(pa, i);
                fn(v, dominant(si, sw, i));
            }
        }
    }

    // ── Kroppen ──

    private addMesh(m: THREE.SkinnedMesh): void {
        const g = m.geometry;
        const pa = g.getAttribute('position');
        const si = g.getAttribute('skinIndex');
        const sw = g.getAttribute('skinWeight');
        const v = new THREE.Vector3();
        const c = new THREE.Color();
        // Hodet til mannequinen er et grovt egg uten ansikt. Det byttes ut (`hodet`).
        const ny = new Int32Array(pa.count).fill(-1);
        for (let i = 0; i < pa.count; i++) {
            v.fromBufferAttribute(pa, i);
            const b = dominant(si, sw, i);
            const name = this.bones[b].name;
            if (/head/.test(name)) continue;
            ny[i] = this.pos.length / 3;
            this.forme(v, name);
            this.glatt(v, name);
            const [del, ut, shade] = this.region(v, name);
            if (ut > 0) v.addScaledVector(this.outward(v, name), ut);
            this.color(del, c).multiplyScalar(shade);
            this.pos.push(v.x, v.y, v.z);
            this.col.push(c.r, c.g, c.b);
            this.skinI.push(si.getX(i), si.getY(i), si.getZ(i), si.getW(i));
            this.skinW.push(sw.getX(i), sw.getY(i), sw.getZ(i), sw.getW(i));
        }
        const idx = g.getIndex();
        const n = idx ? idx.count : pa.count;
        for (let t = 0; t < n; t += 3) {
            const tri = [0, 1, 2].map((k) => ny[idx ? idx.getX(t + k) : t + k]);
            if (tri.every((x) => x >= 0)) this.index.push(...tri);
        }
    }

    /** Kroppsfasongen: mage, slankere kropp, hodestørrelse. */
    private forme(v: THREE.Vector3, bone: string): void {
        const d = this.d;
        const torso = /hips|spine/.test(bone);
        if (d.mage && torso) {
            const g = gauss((v.y - (this.waistY + 0.04)) / 0.16);
            const front = smooth(v.z, -0.02, 0.1);
            v.z += d.mage * 0.1 * g * front;
            v.x *= 1 + d.mage * 0.14 * g;
            if (v.z < 0) v.z -= d.mage * 0.02 * g;
        }
        // Mannequinen har brystmuskler; kjortelen henger rett ned over dem.
        if (/spine00[23]/.test(bone) && v.z > 0) v.z *= 0.72;
        if (d.slank) {
            const k = 1 - d.slank * 0.12;
            if (torso) {
                v.x *= k;
                v.z = v.z * k;
            } else if (/arm|thigh|shin|neck/.test(bone)) {
                const o = this.outward(v, bone);
                const r = this.radius(v, bone);
                v.addScaledVector(o, -r * (1 - k));
            }
        }
        if (d.hode && d.hode !== 1 && /head/.test(bone)) {
            const n = this.p('DEF-neck');
            v.sub(n).multiplyScalar(d.hode).add(n);
        }
    }

    private maalLemmer(): void {
        const sum = new Map<string, [number, number]>();
        this.eachVertex((v, b) => {
            const name = this.bones[b].name;
            if (!/arm|shoulder|neck/.test(name)) return;
            this.forme(v, name);
            const [s, n] = sum.get(name) ?? [0, 0];
            sum.set(name, [s + this.radius(v, name), n + 1]);
        });
        for (const [name, [s, n]] of sum) this.snitt.set(name, s / n);
        this.snittHals = this.snitt.get('DEF-neck') ?? 0.05;

        // Overkroppen: mål tverrsnittet i 2 cm-skiver og jevn det ut over fem skiver.
        const BIN = 0.02;
        this.bandY0 = this.waistY - 0.1;
        const nb = Math.ceil((this.shoulderY + 0.1 - this.bandY0) / BIN);
        const bx = new Array(nb).fill(0);
        const z0 = new Array(nb).fill(0);
        const z1 = new Array(nb).fill(0);
        this.eachVertex((v, b) => {
            const name = this.bones[b].name;
            if (!/spine|hips/.test(name)) return;
            this.forme(v, name);
            const i = Math.floor((v.y - this.bandY0) / BIN);
            if (i < 0 || i >= nb) return;
            bx[i] = Math.max(bx[i], Math.abs(v.x));
            z0[i] = Math.min(z0[i], v.z);
            z1[i] = Math.max(z1[i], v.z);
        });
        const jevn = (a: number[]) => a.map((_, i) => {
            const w = a.slice(Math.max(0, i - 2), i + 3).filter((x) => x !== 0);
            return w.length ? w.reduce((s, x) => s + x, 0) / w.length : 0;
        });
        this.bandX = jevn(bx);
        this.bandZ0 = jevn(z0);
        this.bandZ1 = jevn(z1);
    }

    /**
     * Mannequinen er en bodybuilder: runde skuldre, store overarmer, brede lats. Klær i vadmel
     * henger rett over det. Armene trekkes mot en jevn radius rundt beinet (litt smalere mot
     * håndleddet), og brystkassa smalner mot skuldrene, så ermene blir rør og ikke muskler.
     */
    private glatt(v: THREE.Vector3, bone: string): void {
        const arm = /upper_arm|forearm/.test(bone);
        if (arm || /shoulder/.test(bone)) {
            const [a, b] = this.segment(bone);
            const q = closest(v, a, b);
            const o = v.clone().sub(q);
            const r = o.length();
            if (r < 1e-5) return;
            const mean = this.snitt.get(bone) ?? r;
            const t = a.distanceTo(q) / Math.max(1e-5, a.distanceTo(b));
            const target = arm ? mean * (/upper/.test(bone) ? 0.7 + 0.08 * t : 0.9 - 0.12 * t) : mean * 0.8;
            const keep = arm ? 0.2 : 0.35;
            v.copy(q).addScaledVector(o, (target + (r - target) * keep) / r);
            return;
        }
        if (/spine/.test(bone) && v.y > this.waistY - 0.06) {
            // Brystmuskler, magerutene og lats: legg overkroppen inn mot en jevn ellipse for
            // hver høyde, så kjortelen ser ut som stoff over en tønne, ikke en hud over muskler.
            // V-fasongen tas ned: brystkassa smalner mot skuldrene, og ryggen flates ut.
            const i = Math.floor((v.y - this.bandY0) / 0.02);
            const rx = this.bandX[i];
            if (rx) {
                const cz = (this.bandZ0[i] + this.bandZ1[i]) / 2;
                const rz = (this.bandZ1[i] - this.bandZ0[i]) / 2;
                const x = v.x;
                const z = v.z - cz;
                const r = Math.hypot(x, z);
                if (r > 1e-5) {
                    const e = 1 / Math.hypot(x / r / rx, z / r / rz);
                    const k = 0.75 * smooth(v.y, this.waistY - 0.06, this.waistY + 0.02);
                    const nr = r + (e * 0.96 - r) * k;
                    v.x = (x / r) * nr;
                    v.z = cz + (z / r) * nr;
                }
            }
            const t = smooth(v.y, this.waistY, this.shoulderY - 0.04);
            v.x *= 1 - 0.12 * t;
            if (v.z < 0) v.z *= 1 - 0.15 * t;
        }
    }

    /** Hvilken del av drakten hjørnet hører til, hvor mye det blåses ut, og skygge. */
    private region(v: THREE.Vector3, bone: string): [Del, number, number] {
        const d = this.d;
        if (/hand|f_|thumb/.test(bone)) return ['hud', 0, 1];
        // Nederst på halsbeinet (mot brystet) er det kjortelen som synes i halsåpningen på kappa.
        if (/neck/.test(bone)) {
            if (v.y < this.p('DEF-neck').y + 0.01 || Math.abs(v.x) > this.snittHals * 0.9) return ['kjortel', -0.01, 0.8];
            return d.hetteOppe ? ['hette', 0.02, 0.95] : ['hud', 0, 0.92];
        }
        // Under kappa (`kappe`): trekk kroppen inn, så den ikke stikker gjennom kappa. Det er
        // kappa som gir formen. Riggen står i T-stilling, så på overarmen måles det langs armen.
        const hem = this.shoulderY - d.kappe;
        const ledd = Math.abs(this.p('DEF-upper_arm.L').x);
        if (/upper_arm/.test(bone) && Math.abs(v.x) - ledd < d.kappe - 0.01) {
            return ['hette', -0.03 * smooth(d.kappe - 0.01 - (Math.abs(v.x) - ledd), 0, 0.04), 0.8];
        }
        if ((/shoulder/.test(bone) || /spine003/.test(bone)) && v.y > hem) return ['hette', -0.035 * smooth(v.y - hem, 0, 0.04), 0.8];
        if (/hips|spine/.test(bone)) {
            if (Math.abs(v.y - this.waistY) < 0.028) return ['belte', 0.024, 1];
            return ['kjortel', 0.016, v.y < this.waistY ? 0.92 : 1];
        }
        if (/arm/.test(bone)) {
            const wrist = this.p(v.x > 0 ? 'DEF-hand.L' : 'DEF-hand.R');
            const cuff = Math.abs(v.x - wrist.x) < 0.05;
            return ['kjortel', 0.014, cuff ? 0.82 : 1];
        }
        if (/thigh/.test(bone)) return v.y > this.hemY ? ['kjortel', 0.012, 0.9] : ['hoser', 0.006, 1];
        if (/shin/.test(bone)) return v.y > this.hemY ? ['kjortel', 0.012, 0.9] : ['hoser', 0.006, 1];
        if (/foot|toe/.test(bone)) return ['sko', 0.012, 1];
        return ['kjortel', 0.01, 1];
    }

    color(del: Del, c: THREE.Color): THREE.Color {
        const d = this.d;
        const hex = { hud: d.hud, haar: d.haar, skjegg: d.skjegg ?? d.haar, kjortel: d.kjortel, belte: d.belte, hoser: d.hoser, sko: d.sko, hette: d.hette }[del];
        return c.setHex(hex);
    }

    /** Utover fra beinet: fra nærmeste punkt på beinet (eller midten av hodet). */
    private outward(v: THREE.Vector3, bone: string): THREE.Vector3 {
        const [a, b] = this.segment(bone);
        const q = closest(v, a, b);
        const o = v.clone().sub(q);
        if (o.lengthSq() < 1e-8) return new THREE.Vector3(0, 0, 1);
        return o.normalize();
    }

    private radius(v: THREE.Vector3, bone: string): number {
        const [a, b] = this.segment(bone);
        return v.distanceTo(closest(v, a, b));
    }

    private segment(bone: string): [THREE.Vector3, THREE.Vector3] {
        if (/head/.test(bone)) return [this.headC, this.headC];
        if (/hips|spine/.test(bone)) return [this.p('DEF-hips'), this.p('DEF-neck')];
        const b = this.bones[this.boneIx.get(bone) ?? 0];
        const a = this.at.get(bone)!;
        const child = b.children.find((x) => (x as THREE.Bone).isBone);
        if (child) return [a, this.at.get(child.name)!];
        // Endebein (tær): forleng i samme retning som foreldrebeinet.
        const pa = this.at.get(b.parent!.name) ?? a;
        return [a, a.clone().add(a.clone().sub(pa).multiplyScalar(0.6))];
    }

    // ── Det som legges til ──

    vert(v: THREE.Vector3, c: THREE.Color, bones: [number, number][]): number {
        const i = this.pos.length / 3;
        this.pos.push(v.x, v.y, v.z);
        this.col.push(c.r, c.g, c.b);
        const w = bones.slice(0, 4);
        while (w.length < 4) w.push([0, 0]);
        const sum = w.reduce((s, x) => s + x[1], 0) || 1;
        this.skinI.push(...w.map((x) => x[0]));
        this.skinW.push(...w.map((x) => x[1] / sum));
        return i;
    }

    /** Ringer av hjørner (samme antall i hver) knyttet sammen til et rør. */
    tube(rings: number[][], closed: boolean): void {
        for (let r = 0; r < rings.length - 1; r++) {
            const A = rings[r];
            const B = rings[r + 1];
            const n = A.length;
            for (let i = 0; i < (closed ? n : n - 1); i++) {
                const j = (i + 1) % n;
                this.index.push(A[i], B[i], A[j], A[j], B[i], B[j]);
            }
        }
    }

    /**
     * Skjørtet på kjortelen: en kjegle fra beltet og ned, litt utsvingt. Sidene følger hvert
     * sitt lår, foran og bak følger det begge, så det svinger med skrittene uten å rives i to.
     */
    private skjort(): void {
        const hipsI = this.bone('DEF-hips');
        const spineI = this.bone('DEF-spine.001');
        const tL = this.bone('DEF-thigh.L');
        const tR = this.bone('DEF-thigh.R');
        // Tverrsnittet av kroppen ved beltet og hoftene, målt etter at kroppen er formet.
        const band = (y: number) => {
            let rx = 0.08;
            let z0 = 0;
            let z1 = 0;
            for (let i = 0; i < this.pos.length; i += 3) {
                const py = this.pos[i + 1];
                if (Math.abs(py - y) > 0.04 || Math.abs(this.pos[i]) > 0.3) continue;
                rx = Math.max(rx, Math.abs(this.pos[i]));
                z0 = Math.min(z0, this.pos[i + 2]);
                z1 = Math.max(z1, this.pos[i + 2]);
            }
            return { rx, cz: (z0 + z1) / 2, rz: Math.max(0.08, (z1 - z0) / 2) };
        };
        const top = this.waistY - 0.02;
        const hipY = this.p('DEF-thigh.L').y - 0.04;
        const w0 = band(top);
        const w1 = band(hipY);
        const legX = Math.abs(this.p('DEF-shin.L').x) + 0.09;
        const levels = [top, hipY, (hipY + this.hemY) / 2 + 0.05, this.hemY + 0.06, this.hemY];
        const N = 20;
        const c = new THREE.Color();
        const rings = levels.map((y, li) => {
            const t = THREE.MathUtils.clamp((top - y) / (top - this.hemY), 0, 1);
            const rx = li === 0 ? w0.rx + 0.025 : Math.max(w1.rx + 0.035 + t * 0.06, legX * (0.6 + 0.5 * t));
            const rz = li === 0 ? w0.rz + 0.025 : w1.rz + 0.045 + t * 0.07;
            const cz = li === 0 ? w0.cz : w1.cz + t * 0.01;
            const shade = li === levels.length - 1 ? 0.7 : 0.94 - t * 0.12;
            const ring: number[] = [];
            for (let i = 0; i < N; i++) {
                const a = (i / N) * Math.PI * 2;
                const x = Math.sin(a) * rx;
                const z = cz + Math.cos(a) * rz;
                // Fold: små bølger nedover skjørtet.
                const fold = 1 + Math.sin(a * 7) * 0.025 * t;
                const v = new THREE.Vector3(x * fold, y, z * fold + cz * (1 - fold));
                const side = smooth(x / rx, -0.55, 0.55);
                const leg = 0.85 * smooth(t, 0, 0.9);
                this.color('kjortel', c).multiplyScalar(shade);
                ring.push(this.vert(v, c, [
                    [li === 0 ? spineI : hipsI, 1 - leg],
                    [tL, leg * side],
                    [tR, leg * (1 - side)],
                ]));
            }
            return ring;
        });
        this.tube(rings, true);
    }

    /**
     * Kappa på hetta: et glatt skall fra halsen og ut over skuldrene. Blåst ut fra kroppen ble
     * den til brystmuskler og skuldre som på en bodybuilder; som eget skall henger den som stoff.
     * Sidene følger overarmene litt, så den løfter seg når armene gjør det.
     */
    private kappe(): void {
        const d = this.d;
        const neck = this.p('DEF-neck');
        const neckI = this.bone('DEF-neck');
        const chestI = this.bone('DEF-spine.003');
        // Riggen står i T-stilling, så kappa måles mot overkroppen og skulderleddet, ikke armene.
        // Når armene henger, ligger skulderen ytterst ved leddet pluss overarmen.
        const band = (y: number) => {
            const i = THREE.MathUtils.clamp(Math.floor((y - this.bandY0) / 0.02), 0, this.bandX.length - 1);
            return { rx: this.bandX[i] || 0.12, cz: (this.bandZ0[i] + this.bandZ1[i]) / 2, rz: (this.bandZ1[i] - this.bandZ0[i]) / 2 || 0.1 };
        };
        const ledd = this.p('DEF-upper_arm.L');
        const arm = (this.snitt.get('DEF-upper_armL') ?? 0.06) * 0.74;
        const skulder = Math.abs(ledd.x) + arm + 0.025;
        const hem = this.shoulderY - d.kappe;
        const sk = band(this.shoulderY - 0.03);
        const lav = band(hem + 0.03);
        const rN = (this.snittHals || 0.06) * 0.95;
        const bakZ = Math.min(sk.cz - sk.rz, ledd.z - arm) - 0.025;
        // Foran faller kappa rett ned fra brystet, den buer ikke inn igjen under.
        const foran = Math.max(sk.cz + sk.rz, lav.cz + lav.rz) + 0.022;
        // Med hetta oppe er kappa og hetta ett plagg: kappa starter oppe under haka. Nede ligger
        // hetta som en krage tett rundt halsen.
        const topY = neck.y + (d.hetteOppe ? 0.07 : 0.06);
        // [y, rx, foran, bak, skygge]
        const levels: [number, number, number, number, number][] = [
            [topY, rN * 1.12, neck.z + rN * 1.15, neck.z - rN * 1.12, 0.8],
            [neck.y + 0.025, rN * 1.35, neck.z + rN * 1.35, neck.z - rN * 1.3, 0.9],
            [neck.y - 0.005, rN * 1.7, neck.z + rN * 1.65, neck.z - rN * 1.55, 0.94],
            [this.shoulderY + 0.03, skulder * 0.78, foran - 0.03, bakZ + 0.02, 1],
            [this.shoulderY - 0.035, skulder, foran - 0.005, bakZ, 0.97],
            [hem + 0.025, skulder + 0.012, foran, bakZ - 0.006, 0.9],
            [hem, skulder + 0.015, foran + 0.002, bakZ - 0.008, 0.7],
        ];
        this.underKappa(levels);
        const N = 24;
        const c = new THREE.Color();
        const rings = levels.map(([y, rx, z1, z0, shade], li) => {
            const ring: number[] = [];
            const cz = (z0 + z1) / 2;
            const rz = (z1 - z0) / 2;
            for (let i = 0; i < N; i++) {
                const a = (i / N) * Math.PI * 2;
                // Litt firkantet: kappa ligger flatt over skuldrene og faller rett ned.
                const sx = Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.9);
                const cz2 = Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), 0.9);
                const v = new THREE.Vector3(sx * rx, y, cz + cz2 * rz);
                this.color('hette', c).multiplyScalar(shade);
                ring.push(this.vert(v, c, li < 2 ? [[neckI, 0.6], [chestI, 0.4]] : [[chestI, 1]]));
            }
            return ring;
        });
        this.tube(rings, true);
    }

    /**
     * Kroppen som ligger under kappa, flyttes inn under den (brystet, skulderbladene, skuldrene),
     * så ingenting stikker gjennom stoffet. Armene står ut i T-stillingen og tas i `region`.
     */
    private underKappa(levels: [number, number, number, number, number][]): void {
        const n = this.pos.length / 3;
        for (let i = 0; i < n; i++) {
            let k = 0;
            for (let c = 1; c < 4; c++) if (this.skinW[i * 4 + c] > this.skinW[i * 4 + k]) k = c;
            if (!/spine|shoulder/.test(this.bones[this.skinI[i * 4 + k]].name)) continue;
            const y = this.pos[i * 3 + 1];
            let j = 0;
            while (j < levels.length - 1 && levels[j + 1][0] > y) j++;
            if (j >= levels.length - 1 || y > levels[0][0]) continue;
            const [ya, rxa, fa, ba] = levels[j];
            const [yb, rxb, fb, bb] = levels[j + 1];
            const t = (ya - y) / (ya - yb);
            const rx = rxa + (rxb - rxa) * t;
            const z1 = fa + (fb - fa) * t;
            const z0 = ba + (bb - ba) * t;
            const cz = (z0 + z1) / 2;
            const rz = (z1 - z0) / 2;
            const x = this.pos[i * 3];
            const z = this.pos[i * 3 + 2] - cz;
            const e = Math.hypot(x / rx, z / rz);
            if (e <= 0.86) continue;
            this.pos[i * 3] = (x * 0.86) / e;
            this.pos[i * 3 + 2] = cz + (z * 0.86) / e;
        }
    }

    /** Tuten på hetta: et smalt rør som henger ned bak. Hetta nede: fra kragen. */
    private tut(): void {
        const d = this.d;
        if (d.tut <= 0) return;
        const headI = this.bone('DEF-head');
        const neckI = this.bone('DEF-neck');
        const chestI = this.bone('DEF-spine.003');
        const start = d.hetteOppe
            ? this.headC.clone().add(new THREE.Vector3(0, this.headR * 0.55, -this.headR * 0.75))
            : this.p('DEF-neck').clone().add(new THREE.Vector3(0, 0.02, -0.09));
        const N = 6;
        const steps = 5;
        const c = new THREE.Color();
        const rings: number[][] = [];
        for (let s = 0; s <= steps; s++) {
            const t = s / steps;
            const p = start.clone().add(new THREE.Vector3(0, -d.tut * t, -0.05 * Math.sin(t * Math.PI) - 0.02 * t));
            const r = 0.04 * (1 - t) + 0.01;
            const top: [number, number][] = d.hetteOppe ? [[headI, 1 - t], [neckI, t * 0.5], [chestI, t * 0.5]] : [[neckI, 1 - t], [chestI, t]];
            this.color('hette', c).multiplyScalar(0.9);
            const ring: number[] = [];
            for (let i = 0; i < N; i++) {
                const a = (i / N) * Math.PI * 2;
                ring.push(this.vert(p.clone().add(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)), c, top));
            }
            rings.push(ring);
        }
        this.tube(rings, true);
    }

    /** Pung av lær i beltet, på venstre hofte. */
    private pungen(): void {
        const hipsI = this.bone('DEF-hips');
        const c = new THREE.Color();
        this.color('belte', c).multiplyScalar(this.d.pung ?? 1);
        const cx = 0.13;
        const y0 = this.waistY - 0.02;
        let front = 0;
        for (let i = 0; i < this.pos.length; i += 3) {
            if (Math.abs(this.pos[i + 1] - y0) < 0.03 && Math.abs(this.pos[i] - cx) < 0.04) front = Math.max(front, this.pos[i + 2]);
        }
        const z = front + 0.03;
        const pts = [
            [-0.05, 0, -0.025], [0.05, 0, -0.025], [0.05, 0, 0.025], [-0.05, 0, 0.025],
            [-0.06, -0.12, -0.03], [0.06, -0.12, -0.03], [0.06, -0.12, 0.03], [-0.06, -0.12, 0.03],
        ].map(([x, y, zz]) => this.vert(new THREE.Vector3(cx + x, y0 + y, z + zz), c, [[hipsI, 1]]));
        const q = (a: number, b: number, cc: number, dd: number) => this.index.push(pts[a], pts[b], pts[cc], pts[a], pts[cc], pts[dd]);
        q(0, 1, 5, 4);
        q(1, 2, 6, 5);
        q(2, 3, 7, 6);
        q(3, 0, 4, 7);
        q(4, 5, 6, 7);
    }
}

function dominant(si: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, sw: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, i: number): number {
    let best = 0;
    let bw = -1;
    for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(i, k);
        if (w > bw) {
            bw = w;
            best = si.getComponent(i, k);
        }
    }
    return best;
}

function closest(v: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
    const ab = b.clone().sub(a);
    const l2 = ab.lengthSq();
    if (l2 < 1e-10) return a.clone();
    const t = THREE.MathUtils.clamp(v.clone().sub(a).dot(ab) / l2, 0, 1);
    return a.clone().addScaledVector(ab, t);
}
