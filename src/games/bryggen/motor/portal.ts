// Portaler: innredningen i et hus synes bare gjennom dørene og gluggene som står åpne (blueprint §9.5).
//
// Bua alene er ca. 75k trekanter. Fra gårdsrommet ser man bare et smalt stykke av den gjennom døra,
// men Three tegnet alt som var i bildet, også det som står bak veggene. Her deles innredningen i små
// biter (`CELLE`), og hver bit tegnes bare når den kan synes gjennom en åpning fra kameraet: biten må
// ligge innenfor pyramiden fra kameraet gjennom åpningen, og på innsiden av den. Står kameraet inne
// i huset (eller i døråpningen), tegnes alt.
//
// Bitene ligger i én `BatchedMesh` per materiale: ett tegnekall som før, uansett hvor mange biter som
// synes. Testen kjøres rett før tegningen med det kameraet som faktisk tegner, så det henger ikke
// etter når kameraet svinger forbi døra.
//
// Åpningene registreres av byggekoden der hullene lages (`MeshKit.aapning`, i `vegg` i inne.ts og i
// ljoren). Et hull som ikke registreres, blir et sted der innredningen kan mangle.
import * as THREE from 'three';

/** Et hull i veggen eller taket: fire hjørner i verdensrom (rundt kanten) og normalen ut. */
export interface Aapning {
    p: THREE.Vector3[];
    n: THREE.Vector3;
}

/** Bitene er så store (meter, i x og z; y i etasjehøyder på 2 m). */
const CELLE = 1.5;
const CELLE_Y = 2;
/** Så langt utenfor rommene og åpningene regnes kameraet som inne (det står i døra). */
const INNE_MARG = 0.5;

const _c = new THREE.Vector3();
const _d = new THREE.Vector3();
const _e = new THREE.Vector3();
const _q = new THREE.Vector3();

interface Plan {
    n: THREE.Vector3;
    d: number;
}

/** Åpningene og rommene i ett hus, og testen «kan kameraet se dette gjennom en åpning?». */
export class Portaler {
    readonly aapninger: Aapning[];
    private readonly rom: THREE.Box3[];
    private readonly sist = new THREE.Vector3(Infinity, 0, 0);
    /** Pyramidene fra kameraet gjennom hver åpning (`null`: kameraet er inne og ser alt). */
    private pyr: Plan[][] | null = [];

    constructor(aapninger: Aapning[], rom: THREE.Box3[]) {
        this.aapninger = aapninger;
        this.rom = rom.map((b) => b.clone().expandByScalar(INNE_MARG));
        // Døråpningen selv: står kameraet i den, er det inne.
        for (const a of aapninger) {
            const b = new THREE.Box3().setFromPoints(a.p);
            this.rom.push(b.expandByScalar(INNE_MARG));
        }
    }

    /** Er kameraet inne i huset (eller i en åpning)? */
    inne(kamera: THREE.Vector3): boolean {
        return this.rom.some((b) => b.containsPoint(kamera));
    }

    private bygg(kamera: THREE.Vector3): void {
        if (this.sist.equals(kamera)) return;
        this.sist.copy(kamera);
        if (this.inne(kamera)) {
            this.pyr = null;
            return;
        }
        this.pyr = [];
        for (const a of this.aapninger) {
            // Kameraet må stå på utsiden av åpningen.
            if (_d.subVectors(kamera, a.p[0]).dot(a.n) <= 0.02) continue;
            _c.set(0, 0, 0);
            for (const p of a.p) _c.addScaledVector(p, 1 / a.p.length);
            const plan: Plan[] = [];
            for (let i = 0; i < a.p.length; i++) {
                const p = a.p[i];
                const q = a.p[(i + 1) % a.p.length];
                const n = new THREE.Vector3().crossVectors(_d.subVectors(p, kamera), _e.subVectors(q, kamera)).normalize();
                if (_q.subVectors(_c, kamera).dot(n) < 0) n.negate();
                plan.push({ n, d: -n.dot(kamera) });
            }
            // Bare det som ligger bak åpningen (inne).
            const inn = a.n.clone().negate();
            plan.push({ n: inn, d: -inn.dot(a.p[0]) });
            this.pyr.push(plan);
        }
    }

    /** Kan kameraet se boksen gjennom en åpning (eller står det inne)? */
    ser(kamera: THREE.Vector3, box: THREE.Box3): boolean {
        this.bygg(kamera);
        if (!this.pyr) return true;
        for (const plan of this.pyr) {
            let ute = false;
            for (const { n, d } of plan) {
                // Hjørnet av boksen lengst langs normalen: ligger det bak planet, er hele boksen ute.
                const x = n.x > 0 ? box.max.x : box.min.x;
                const y = n.y > 0 ? box.max.y : box.min.y;
                const z = n.z > 0 ? box.max.z : box.min.z;
                if (n.x * x + n.y * y + n.z * z + d < 0) {
                    ute = true;
                    break;
                }
            }
            if (!ute) return true;
        }
        return false;
    }
}

const _kam = new THREE.Vector3();

/** En `BatchedMesh` der hver bit bare tegnes når den kan synes gjennom portalene. */
class PortalBatch extends THREE.BatchedMesh {
    readonly portaler: Portaler;
    readonly bokser: THREE.Box3[] = [];

    constructor(geos: THREE.BufferGeometry[], mat: THREE.Material, portaler: Portaler) {
        const nv = geos.reduce((s, g) => s + g.getAttribute('position').count, 0);
        const ni = geos.reduce((s, g) => s + (g.index?.count ?? 0), 0);
        super(geos.length, nv, ni, mat);
        this.portaler = portaler;
        for (const g of geos) {
            const id = this.addGeometry(g);
            this.addInstance(id);
            g.computeBoundingBox();
            this.bokser.push(g.boundingBox!.clone());
        }
    }

    override onBeforeRender(
        renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group
    ): void {
        _kam.setFromMatrixPosition(camera.matrixWorld);
        this.bokser.forEach((b, i) => this.setVisibleAt(i, this.portaler.ser(_kam, b)));
        super.onBeforeRender(renderer, scene, camera, geometry, material, group);
    }
}

/** Deler en geometri i biter etter hvor midten av hver trekant ligger. */
function delOpp(g: THREE.BufferGeometry): THREE.BufferGeometry[] {
    const idx = g.index!;
    const pos = g.getAttribute('position');
    const biter = new Map<string, number[]>();
    for (let t = 0; t < idx.count; t += 3) {
        let x = 0;
        let y = 0;
        let z = 0;
        for (let k = 0; k < 3; k++) {
            const i = idx.getX(t + k);
            x += pos.getX(i);
            y += pos.getY(i);
            z += pos.getZ(i);
        }
        const key = `${Math.floor(x / 3 / CELLE)},${Math.floor(y / 3 / CELLE_Y)},${Math.floor(z / 3 / CELLE)}`;
        let l = biter.get(key);
        if (!l) biter.set(key, (l = []));
        l.push(idx.getX(t), idx.getX(t + 1), idx.getX(t + 2));
    }
    const ut: THREE.BufferGeometry[] = [];
    for (const tris of biter.values()) {
        // Bare hjørnene biten bruker, nummerert på nytt.
        const map = new Map<number, number>();
        const nyIdx: number[] = [];
        for (const i of tris) {
            let j = map.get(i);
            if (j === undefined) map.set(i, (j = map.size));
            nyIdx.push(j);
        }
        const b = new THREE.BufferGeometry();
        for (const [navn, attr] of Object.entries(g.attributes)) {
            const a = attr as THREE.BufferAttribute;
            const arr = new Float32Array(map.size * a.itemSize);
            for (const [gammel, ny] of map) for (let c = 0; c < a.itemSize; c++) arr[ny * a.itemSize + c] = a.array[gammel * a.itemSize + c];
            b.setAttribute(navn, new THREE.BufferAttribute(arr, a.itemSize));
        }
        b.setIndex(nyIdx);
        ut.push(b);
    }
    return ut;
}

/**
 * Gjør innredningen (en gruppe med én mesh per materiale, fra `toGroup`) om til biter bak
 * portalene. Det som ikke er vanlige mesher (flammer, lys), blir stående som før.
 */
export function bakPortaler(g: THREE.Group, portaler: Portaler): THREE.Group {
    if (portaler.aapninger.length === 0) return g;
    for (const o of [...g.children]) {
        const m = o as THREE.Mesh;
        if (!m.isMesh || (m as THREE.InstancedMesh).isInstancedMesh || !m.geometry.index || Array.isArray(m.material)) continue;
        const geos = delOpp(m.geometry);
        const b = new PortalBatch(geos, m.material, portaler);
        b.name = m.name;
        b.castShadow = m.castShadow;
        b.receiveShadow = m.receiveShadow;
        for (const x of geos) x.dispose();
        m.geometry.dispose();
        g.remove(m);
        g.add(b);
    }
    return g;
}
