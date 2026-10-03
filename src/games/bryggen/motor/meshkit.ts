// Geometri-settet bygningene lages av.
//
// Alt legges i én «bøtte» per materiale. Til slutt blir hver bøtte én BufferGeometry, så et
// helt hus koster ett tegnekall per materiale (laft, bord, tak, råtre), uansett hvor mange
// stokker, stolper og trinn det har.
//
// UV-ene er i meter (u langs flaten, v oppover eller langs fibrene). Materialet bestemmer hvor
// mange meter én tekstur dekker. Da får en stokk samme tykkelse på en lang vegg som på en kort,
// og teksturene trenger aldri strekkes for hånd.
//
// Hvert hjørne har også en fargefaktor (vertex-farge). Den gir variasjon mellom husene, mørkere
// dører og en mørk kant nederst på veggene, uten ekstra materialer.
import * as THREE from 'three';
import type { Aapning } from './portal';

export type MatKey = 'laft' | 'bordvegg' | 'bordtak' | 'torv' | 'dekke' | 'gardsrom' | 'gjorme' | 'raatre' | 'stein' | 'mork';

const _p = new THREE.Vector3();
const _n = new THREE.Vector3();
const _nm = new THREE.Matrix3();

export class Bucket {
    readonly pos: number[] = [];
    readonly nor: number[] = [];
    readonly uv: number[] = [];
    readonly col: number[] = [];
    readonly idx: number[] = [];

    get vertexCount(): number {
        return this.pos.length / 3;
    }

    toGeometry(): THREE.BufferGeometry {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
        g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
        g.setIndex(this.idx);
        g.computeBoundingSphere();
        g.computeBoundingBox();
        return g;
    }
}

export interface Tint {
    /** Fargefaktor øverst og nederst på flaten (gir mørk fot på veggene). */
    top: number;
    bottom: number;
    /** Farge-skjær (r, g, b) som ganges inn, f.eks. litt varmere eller kaldere tre. */
    hue?: [number, number, number];
}

const PLAIN: Tint = { top: 1, bottom: 1 };

/** Bygger geometri i bøtter. `matrix` er gjeldende transformasjon (lokalt hus-rom → verden). */
export class MeshKit {
    readonly buckets = new Map<MatKey, Bucket>();
    matrix = new THREE.Matrix4();
    tint: Tint = PLAIN;
    /** Takskjegg i verdensrom, to punkter per skjegg: der dryppet faller fra (drypp.ts). */
    readonly skjegg: THREE.Vector3[] = [];
    /** Ganges med alle UV-er (`withUv`). */
    private uvScale = 1;
    private readonly stack: THREE.Matrix4[] = [];

    bucket(key: MatKey): Bucket {
        let b = this.buckets.get(key);
        if (!b) {
            b = new Bucket();
            this.buckets.set(key, b);
        }
        return b;
    }

    push(m: THREE.Matrix4): void {
        this.stack.push(this.matrix.clone());
        this.matrix = this.matrix.clone().multiply(m);
    }

    pop(): void {
        const m = this.stack.pop();
        if (m) this.matrix = m;
    }

    /**
     * Kjør `fn` med en ekstra flytting/rotasjon. Lager `fn` kollidere, send med `c`: da flyttes
     * de på samme måte. Ellers havner de i rommet utenfor (og står feil).
     */
    at(x: number, y: number, z: number, rotY: number, fn: () => void, c?: ColliderKit): void {
        const m = new THREE.Matrix4().makeRotationY(rotY).setPosition(x, y, z);
        this.push(m);
        const old = c?.matrix;
        if (c) c.matrix = c.matrix.clone().multiply(m);
        fn();
        if (c && old) c.matrix = old;
        this.pop();
    }

    /**
     * Hull man kan se inn i et hus gjennom (åpne dører, glugger, ljoren), i verdensrom. Innredningen
     * bak tegnes bare når den kan synes gjennom ett av dem (portal.ts).
     */
    readonly aapninger: Aapning[] = [];

    /** Registrerer et hull: hjørnene rundt kanten og retningen ut, i det lokale rommet. */
    aapning(hjorner: THREE.Vector3[], ut: THREE.Vector3): void {
        _nm.getNormalMatrix(this.matrix);
        this.aapninger.push({ p: hjorner.map((h) => h.clone().applyMatrix4(this.matrix)), n: ut.clone().applyMatrix3(_nm).normalize() });
    }

    /** Legger til et takskjegg fra `a` til `b` (i det lokale rommet). */
    takskjegg(a: THREE.Vector3, b: THREE.Vector3): void {
        this.skjegg.push(a.clone().applyMatrix4(this.matrix), b.clone().applyMatrix4(this.matrix));
    }

    withTint(t: Tint, fn: () => void): void {
        const old = this.tint;
        this.tint = t;
        fn();
        this.tint = old;
    }

    /**
     * Kjør `fn` med UV-ene krympet: en liten skala gir flaten nesten én farge fra teksturen, uten
     * årer (tørrfisk av treteksturen). Ikke 0: normalkartet trenger UV-er som endrer seg.
     */
    withUv(scale: number, fn: () => void): void {
        const old = this.uvScale;
        this.uvScale = scale;
        fn();
        this.uvScale = old;
    }

    private vert(b: Bucket, p: THREE.Vector3, n: THREE.Vector3, u: number, v: number, shade: number): void {
        _p.copy(p).applyMatrix4(this.matrix);
        _nm.getNormalMatrix(this.matrix);
        _n.copy(n).applyMatrix3(_nm).normalize();
        b.pos.push(_p.x, _p.y, _p.z);
        b.nor.push(_n.x, _n.y, _n.z);
        b.uv.push(u * this.uvScale, v * this.uvScale);
        const h = this.tint.hue ?? [1, 1, 1];
        b.col.push(shade * h[0], shade * h[1], shade * h[2]);
    }

    /**
     * Firkant fra hjørnet `o`, utspent av `ua` (u-retning, full lengde) og `va` (v-retning).
     * UV i meter, forskjøvet med `uv0` så tilstøtende flater kan fortsette mønsteret.
     * `vShade` = [nederst, øverst] fargefaktor langs v.
     */
    quad(key: MatKey, o: THREE.Vector3, ua: THREE.Vector3, va: THREE.Vector3, uv0: [number, number] = [0, 0], vShade?: [number, number]): void {
        const b = this.bucket(key);
        const n = new THREE.Vector3().crossVectors(ua, va).normalize();
        const lu = ua.length();
        const lv = va.length();
        const base = b.vertexCount;
        const [s0, s1] = vShade ?? [1, 1];
        const p = new THREE.Vector3();
        this.vert(b, p.copy(o), n, uv0[0], uv0[1], s0);
        this.vert(b, p.copy(o).add(ua), n, uv0[0] + lu, uv0[1], s0);
        this.vert(b, p.copy(o).add(ua).add(va), n, uv0[0] + lu, uv0[1] + lv, s1);
        this.vert(b, p.copy(o).add(va), n, uv0[0], uv0[1] + lv, s1);
        b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    /** Trekant (gavlspiss). UV i meter i flatens plan. */
    tri(key: MatKey, a: THREE.Vector3, b2: THREE.Vector3, c: THREE.Vector3, uvA: [number, number], uvB: [number, number], uvC: [number, number], shade: [number, number, number] = [1, 1, 1]): void {
        const b = this.bucket(key);
        const n = new THREE.Vector3().crossVectors(new THREE.Vector3().subVectors(b2, a), new THREE.Vector3().subVectors(c, a)).normalize();
        const base = b.vertexCount;
        this.vert(b, a, n, uvA[0], uvA[1], shade[0]);
        this.vert(b, b2, n, uvB[0], uvB[1], shade[1]);
        this.vert(b, c, n, uvC[0], uvC[1], shade[2]);
        b.idx.push(base, base + 1, base + 2);
    }

    /**
     * Akse-justert boks i gjeldende rom. Sideflatene har v oppover; topp og bunn har v langs z.
     * `grain: 'x'` legger fibrene på toppen langs x i stedet (planker på tvers).
     * `skip` utelater flater som aldri synes (f.eks. bunnen mot bakken).
     */
    box(
        key: MatKey,
        cx: number, cy: number, cz: number,
        sx: number, sy: number, sz: number,
        opts: { grain?: 'x' | 'z'; skip?: ('top' | 'bottom' | 'px' | 'nx' | 'pz' | 'nz')[]; shadeFoot?: boolean } = {}
    ): void {
        const x0 = cx - sx / 2, x1 = cx + sx / 2;
        const y0 = cy - sy / 2, y1 = cy + sy / 2;
        const z0 = cz - sz / 2, z1 = cz + sz / 2;
        const skip = new Set(opts.skip ?? []);
        const t = this.tint;
        // Sideflater: u følger flaten rundt, så laftestokkene fortsetter rundt hjørnet.
        const vs: [number, number] = opts.shadeFoot ? [t.bottom, t.top] : [t.top, t.top];
        const v0 = y0;
        if (!skip.has('nz')) this.quad(key, new THREE.Vector3(x1, y0, z0), new THREE.Vector3(-sx, 0, 0), new THREE.Vector3(0, sy, 0), [x0, v0], vs);
        if (!skip.has('pz')) this.quad(key, new THREE.Vector3(x0, y0, z1), new THREE.Vector3(sx, 0, 0), new THREE.Vector3(0, sy, 0), [x0, v0], vs);
        if (!skip.has('px')) this.quad(key, new THREE.Vector3(x1, y0, z1), new THREE.Vector3(0, 0, -sz), new THREE.Vector3(0, sy, 0), [z0, v0], vs);
        if (!skip.has('nx')) this.quad(key, new THREE.Vector3(x0, y0, z0), new THREE.Vector3(0, 0, sz), new THREE.Vector3(0, sy, 0), [z0, v0], vs);
        const topShade: [number, number] = [t.top, t.top];
        // `grain` er retningen v (fibrene i teksturen) går på topp og bunn.
        if (opts.grain === 'x') {
            if (!skip.has('top')) this.quad(key, new THREE.Vector3(x0, y1, z0), new THREE.Vector3(0, 0, sz), new THREE.Vector3(sx, 0, 0), [z0, x0], topShade);
            if (!skip.has('bottom')) this.quad(key, new THREE.Vector3(x0, y0, z1), new THREE.Vector3(0, 0, -sz), new THREE.Vector3(sx, 0, 0), [z0, x0], topShade);
        } else {
            if (!skip.has('top')) this.quad(key, new THREE.Vector3(x1, y1, z0), new THREE.Vector3(-sx, 0, 0), new THREE.Vector3(0, 0, sz), [x0, z0], topShade);
            if (!skip.has('bottom')) this.quad(key, new THREE.Vector3(x0, y0, z0), new THREE.Vector3(sx, 0, 0), new THREE.Vector3(0, 0, sz), [x0, z0], topShade);
        }
    }

    /**
     * Rund stokk fra `a` til `b`. u går rundt stokken, v langs den (fibrene følger stokken).
     * `caps` lukker endene (endeveden synes på laftehoder og bolverk).
     */
    log(key: MatKey, a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 7, caps = true, rEnd = r): void {
        const bk = this.bucket(key);
        const axis = new THREE.Vector3().subVectors(b, a);
        const len = axis.length();
        axis.normalize();
        const ref = Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
        const s1 = new THREE.Vector3().crossVectors(axis, ref).normalize();
        const s2 = new THREE.Vector3().crossVectors(axis, s1).normalize();
        const base = bk.vertexCount;
        const circ = Math.PI * 2 * r;
        const t = this.tint;
        const p = new THREE.Vector3();
        const n = new THREE.Vector3();
        for (let i = 0; i <= seg; i++) {
            const ang = (i / seg) * Math.PI * 2;
            n.copy(s1).multiplyScalar(Math.cos(ang)).addScaledVector(s2, Math.sin(ang));
            // Litt mørkere på undersiden: stokker i skygge under hverandre.
            const shade = t.top * (0.82 + 0.18 * Math.max(0, n.y * 0.5 + 0.5));
            this.vert(bk, p.copy(a).addScaledVector(n, r), n, (i / seg) * circ, 0, shade);
            this.vert(bk, p.copy(b).addScaledVector(n, rEnd), n, (i / seg) * circ, len, shade);
        }
        for (let i = 0; i < seg; i++) {
            const k = base + i * 2;
            bk.idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
        }
        if (!caps) return;
        for (const [c, dir, rad] of [[a, -1, r], [b, 1, rEnd]] as const) {
            const cb = bk.vertexCount;
            const cn = axis.clone().multiplyScalar(dir);
            // Endeved: litt lysere (fersk ved) og v mot sentrum gir ringene i teksturen.
            this.vert(bk, c, cn, 0.5, 0.5, t.top * 1.08);
            for (let i = 0; i <= seg; i++) {
                const ang = (i / seg) * Math.PI * 2;
                n.copy(s1).multiplyScalar(Math.cos(ang)).addScaledVector(s2, Math.sin(ang));
                this.vert(bk, p.copy(c).addScaledVector(n, rad), cn, 0.5 + Math.cos(ang) * rad, 0.5 + Math.sin(ang) * rad, t.top * 0.95);
            }
            for (let i = 0; i < seg; i++) {
                if (dir > 0) bk.idx.push(cb, cb + 1 + i, cb + 2 + i);
                else bk.idx.push(cb, cb + 2 + i, cb + 1 + i);
            }
        }
    }

    /** Skrå plate (tak, trapperampe): en boks rotert om x (helling langs z) eller om z. */
    slab(key: MatKey, m: THREE.Matrix4, sx: number, sy: number, sz: number, opts: { grain?: 'x' | 'z'; skip?: ('top' | 'bottom' | 'px' | 'nx' | 'pz' | 'nz')[] } = {}): void {
        this.push(m);
        this.box(key, 0, 0, 0, sx, sy, sz, opts);
        this.pop();
    }
}

/**
 * Slår sammen flere MeshKit til én: bøttene med samme materiale legges etter hverandre. Til
 * avstandsnivået der en celle er delt i halvdeler (`CellContent.samlet`).
 */
export function slaSammen(kits: MeshKit[]): MeshKit {
    const ut = new MeshKit();
    for (const k of kits) {
        for (const [key, b] of k.buckets) {
            const t = ut.bucket(key);
            const base = t.vertexCount;
            for (const v of b.pos) t.pos.push(v);
            for (const v of b.nor) t.nor.push(v);
            for (const v of b.uv) t.uv.push(v);
            for (const v of b.col) t.col.push(v);
            for (const i of b.idx) t.idx.push(base + i);
        }
    }
    return ut;
}

/** Kollider-beskrivelse. Strømmingen lager Rapier-kroppene når cellen lastes, og fjerner dem igjen. */
export type ColliderSpec =
    | { kind: 'box'; center: THREE.Vector3; half: THREE.Vector3; rot?: THREE.Euler; prop?: boolean }
    | { kind: 'hull'; points: THREE.Vector3[]; prop?: boolean };

/** Samler kollidere i hus-rom og gjør dem om til verdensrom med samme matrise som geometrien. */
export class ColliderKit {
    readonly specs: ColliderSpec[] = [];
    matrix = new THREE.Matrix4();

    /** Akse-justert boks i gjeldende rom (rotasjon om y følger matrisen). */
    box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, prop = false, localRot?: THREE.Euler): void {
        const c = new THREE.Vector3(cx, cy, cz).applyMatrix4(this.matrix);
        const q = new THREE.Quaternion().setFromRotationMatrix(this.matrix);
        if (localRot) q.multiply(new THREE.Quaternion().setFromEuler(localRot));
        this.specs.push({ kind: 'box', center: c, half: new THREE.Vector3(sx / 2, sy / 2, sz / 2), rot: new THREE.Euler().setFromQuaternion(q), prop });
    }

    hull(points: THREE.Vector3[], prop = false): void {
        this.specs.push({ kind: 'hull', points: points.map((p) => p.clone().applyMatrix4(this.matrix)), prop });
    }
}
