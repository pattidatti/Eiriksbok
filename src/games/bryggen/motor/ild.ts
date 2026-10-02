// Åpen ild: flammetunger, glør og røyk som stiger mot ljoren.
//
// Flammene og røyken er hver sin InstancedMesh av to kryssede plan (ett tegnekall hver), så et
// ildsted koster tre tegnekall uansett hvor mange tunger det har. Lyset er ikke her: verdenen
// har ett felles ildlys som flyttes til nærmeste ildsted (se bryggen.ts), fordi et lys som kommer
// og går med cellene tvinger Three til å bygge alle shaderne på nytt.
import * as THREE from 'three';

/** Flakkingen i lyset og glørne, felles så lys og flammer følger hverandre. */
export function flakk(t: number): number {
    return 0.86 + 0.08 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 13.1 + 1.3) + 0.04 * Math.sin(t * 23.7 + 0.4);
}

/** Tegner en myk dråpe eller en rund sky på et lite lerret. */
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d');
    if (g) draw(g);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

let flameTex: THREE.CanvasTexture | null = null;
let smokeTex: THREE.CanvasTexture | null = null;

function textures(): { flame: THREE.CanvasTexture; smoke: THREE.CanvasTexture } {
    flameTex ??= canvasTex(64, 128, (g) => {
        // Dråpe: bred og hvit nederst, smal og rød i tuppen.
        const grad = g.createRadialGradient(32, 96, 2, 32, 80, 60);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.35, 'rgba(255,220,150,0.8)');
        grad.addColorStop(1, 'rgba(255,120,40,0)');
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(32, 4);
        g.bezierCurveTo(52, 50, 60, 90, 32, 124);
        g.bezierCurveTo(4, 90, 12, 50, 32, 4);
        g.fill();
    });
    smokeTex ??= canvasTex(64, 64, (g) => {
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,0.55)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
    });
    return { flame: flameTex, smoke: smokeTex };
}

/** To plan i kryss, med foten i y = 0. */
function crossGeo(w: number, h: number): THREE.BufferGeometry {
    const a = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0);
    const b = a.clone().rotateY(Math.PI / 2);
    const pos = [...a.getAttribute('position').array, ...b.getAttribute('position').array];
    const uv = [...a.getAttribute('uv').array, ...b.getAttribute('uv').array];
    const idxA = [...(a.getIndex()?.array ?? [])];
    const idx = [...idxA, ...idxA.map((i) => i + 4)];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    a.dispose();
    b.dispose();
    return g;
}

interface Partikkel {
    age: number;
    life: number;
    x: number;
    z: number;
    spin: number;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const _c = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

export interface IldOpts {
    /** Hvor høyt røyken stiger før den er borte (til ljoren). */
    smokeTop: number;
    /** Bredden på bålet. */
    spread?: number;
}

/** Ett bål. Legg `group` i cella der flammene skal stå, og kall `update` hvert bilde. */
export class Ild {
    readonly group = new THREE.Group();
    private readonly flames: THREE.InstancedMesh;
    private readonly smoke: THREE.InstancedMesh;
    private readonly glow: THREE.Mesh;
    private readonly glowMat: THREE.MeshBasicMaterial;
    private readonly fp: Partikkel[] = [];
    private readonly sp: Partikkel[] = [];
    private readonly opts: IldOpts;
    private seed = 1;

    constructor(opts: IldOpts) {
        this.opts = opts;
        this.group.name = 'ild';
        const tex = textures();
        const fMat = new THREE.MeshBasicMaterial({
            map: tex.flame, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide, toneMapped: false, fog: false,
        });
        this.flames = new THREE.InstancedMesh(crossGeo(0.32, 0.55), fMat, 16);
        // Røyken: gjennomsiktigheten følger instansfargen, så hver dott kan tone inn og ut.
        const sMat = new THREE.MeshBasicMaterial({ map: tex.smoke, color: 0x6e6862, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        sMat.onBeforeCompile = (sh) => {
            sh.fragmentShader = sh.fragmentShader.replace(
                '#include <color_fragment>',
                '#include <color_fragment>\n#ifdef USE_INSTANCING_COLOR\n diffuseColor.a *= vColor.r;\n diffuseColor.rgb /= max(vColor.r, 0.001);\n#endif'
            );
        };
        this.smoke = new THREE.InstancedMesh(crossGeo(0.9, 0.9), sMat, 10);
        for (const m of [this.flames, this.smoke]) {
            m.frustumCulled = false; // partiklene flytter seg ut av den opprinnelige boksen
            m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            m.setColorAt(0, _c.setRGB(0, 0, 0));
            m.renderOrder = 2;
        }
        // Glørne: en flat, lysende flekk under flammene.
        this.glowMat = new THREE.MeshBasicMaterial({ color: 0xff6a1a, toneMapped: false });
        const spread = opts.spread ?? 0.5;
        this.glow = new THREE.Mesh(new THREE.CircleGeometry(spread * 0.8, 12).rotateX(-Math.PI / 2), this.glowMat);
        this.glow.position.y = 0.02;
        this.group.add(this.glow, this.flames, this.smoke);
        for (let i = 0; i < this.flames.count; i++) this.fp.push(this.spawn(Math.random() * 0.7, 0.5 + Math.random() * 0.35, spread * 0.6));
        for (let i = 0; i < this.smoke.count; i++) this.sp.push(this.spawn(Math.random() * 4, 3.5 + Math.random() * 1.5, spread * 0.4));
    }

    private rand(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed / 2147483647;
    }

    private spawn(age: number, life: number, r: number): Partikkel {
        const a = this.rand() * Math.PI * 2;
        const d = Math.sqrt(this.rand()) * r;
        return { age, life, x: Math.cos(a) * d, z: Math.sin(a) * d, spin: this.rand() * Math.PI };
    }

    update(t: number, dt: number): void {
        const f = flakk(t);
        this.glowMat.color.setRGB(1.6 * f, 0.55 * f, 0.12 * f);
        const spread = this.opts.spread ?? 0.5;
        this.fp.forEach((p, i) => {
            p.age += dt;
            if (p.age > p.life) Object.assign(p, this.spawn(0, 0.45 + this.rand() * 0.4, spread * 0.6));
            const k = p.age / p.life;
            // Tunga vokser fort, blir smal og forsvinner i tuppen. Midten er høyere enn kanten.
            const centre = 1 - Math.hypot(p.x, p.z) / (spread * 0.6 + 0.001);
            const h = (0.7 + centre * 0.8) * (k < 0.25 ? k / 0.25 : 1 - (k - 0.25) / 0.75 * 0.6);
            _s.set(1 - k * 0.6, h, 1 - k * 0.6);
            _p.set(p.x * (1 - k * 0.5), 0.03 + k * 0.28, p.z * (1 - k * 0.5));
            _q.setFromAxisAngle(UP, p.spin + k * 0.8);
            this.flames.setMatrixAt(i, _m.compose(_p, _q, _s));
            const fade = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * f;
            this.flames.setColorAt(i, _c.setRGB(1.0 * fade, (0.62 - k * 0.3) * fade, (0.28 - k * 0.2) * fade));
        });
        const top = this.opts.smokeTop;
        this.sp.forEach((p, i) => {
            p.age += dt;
            if (p.age > p.life) Object.assign(p, this.spawn(0, 3.5 + this.rand() * 1.5, spread * 0.4));
            const k = p.age / p.life;
            // Røyken stiger, vider seg ut og driver litt, og samler seg mot hullet i taket.
            const y = 0.6 + k * (top - 0.6);
            const pull = k * k;
            _p.set(p.x * (1 - pull) + Math.sin(t * 0.4 + p.spin) * 0.15 * k, y, p.z * (1 - pull) + Math.cos(t * 0.3 + p.spin) * 0.12 * k);
            const sc = 0.5 + k * 1.3;
            _s.set(sc, sc, sc);
            _q.setFromAxisAngle(UP, p.spin + k);
            this.smoke.setMatrixAt(i, _m.compose(_p, _q, _s));
            const a = (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8) * 0.55;
            this.smoke.setColorAt(i, _c.setRGB(a, a, a));
        });
        for (const m of [this.flames, this.smoke]) {
            m.instanceMatrix.needsUpdate = true;
            if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
    }

    dispose(): void {
        for (const m of [this.flames, this.smoke, this.glow]) {
            m.geometry.dispose();
            (m.material as THREE.Material).dispose();
        }
    }
}
