// Måker over Bryggen: de sirkler over kaia, daler ned og lander på kaidekket eller på vannet,
// og letter i flokk når gutten kommer løpende.
//
// Alle måkene er én InstancedMesh (ett tegnekall). Vingene slår i vertex-shaderen: hver
// hjørnepunkt vet om det hører til kroppen, den indre eller den ytre vingedelen, og hver måke
// sender sin egen vingevinkel og hvor mye vingene er foldet. Ingen skjelett, ingen klipp.
import * as THREE from 'three';
import type { Physics } from './physics';

/** Hvor måkene kan være: et rektangel langs sjøen, og vannflata. */
export interface MaakeOmraade {
    x0: number;
    x1: number;
    /** Kaidekket (der de kan lande på land), og hvor langt ut på Vågen de flyr. */
    kaiZ0: number;
    kaiZ1: number;
    sjoZ: number;
    vannY: number;
}

type Tilstand = 'sirkler' | 'daler' | 'staar' | 'letter';

interface Maake {
    tilstand: Tilstand;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    yaw: number;
    bank: number;
    /** Sirkelen den flyr i. */
    senter: THREE.Vector3;
    radius: number;
    retning: number;
    vinkel: number;
    /** Hvor den skal lande. */
    maal: THREE.Vector3;
    paaVann: boolean;
    tid: number;
    /** Vingefasen og hvor hardt den slår (0 glir, 1 full slag). */
    fase: number;
    slag: number;
    fold: number;
    /** Neste gang den gjør noe på bakken (snur seg, hopper). */
    neste: number;
    hopp: number;
}

const ANTALL = 16;
const SKREMT_R = 4.5; // gutten nærmere enn dette, i fart: flokken letter
const SKREMT_R_GAA = 2.2; // også når han går rolig

export class Maaker {
    readonly mesh: THREE.InstancedMesh;
    private readonly flap: THREE.InstancedBufferAttribute;
    readonly fugler: Maake[] = [];
    private readonly dummy = new THREE.Object3D();
    private readonly rng: () => number;
    private skremtTid = 0;
    /** Kalles når en flokk letter (lyden bruker det): hvor, og hvor mange. */
    onLetter?: (pos: THREE.Vector3, antall: number) => void;

    private readonly omr: MaakeOmraade;
    private readonly phys: Physics;

    constructor(omr: MaakeOmraade, phys: Physics, seed = 7) {
        this.omr = omr;
        this.phys = phys;
        let s = seed;
        this.rng = () => {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
        const geo = lagMaakeGeometri();
        this.flap = new THREE.InstancedBufferAttribute(new Float32Array(ANTALL * 2), 2);
        geo.setAttribute('iFlap', this.flap);
        const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 });
        mat.onBeforeCompile = (sh) => {
            sh.vertexShader = sh.vertexShader
                .replace('#include <common>', `#include <common>\n${VINGE_GLSL}`)
                .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nobjectNormal = vingeNormal(objectNormal);')
                .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = vinge(transformed);');
        };
        mat.customProgramCacheKey = () => 'bryggen-maake';
        this.mesh = new THREE.InstancedMesh(geo, mat, ANTALL);
        this.mesh.name = 'maaker';
        this.mesh.castShadow = true;
        this.mesh.frustumCulled = false; // de flyr over hele byen; ett tegnekall uansett

        for (let i = 0; i < ANTALL; i++) {
            const senter = this.nyttSenter();
            const m: Maake = {
                tilstand: 'sirkler',
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
                yaw: 0,
                bank: 0,
                senter,
                radius: 7 + this.rng() * 12,
                retning: this.rng() < 0.5 ? 1 : -1,
                vinkel: this.rng() * Math.PI * 2,
                maal: new THREE.Vector3(),
                paaVann: false,
                tid: this.rng() * 20,
                fase: this.rng() * 6,
                slag: 0.3,
                fold: 0,
                neste: 0,
                hopp: 0,
            };
            m.pos.set(senter.x + Math.cos(m.vinkel) * m.radius, senter.y, senter.z + Math.sin(m.vinkel) * m.radius);
            this.fugler.push(m);
        }
    }

    private nyttSenter(naer?: THREE.Vector3): THREE.Vector3 {
        const o = this.omr;
        const x = naer ? naer.x + (this.rng() - 0.5) * 40 : o.x0 + this.rng() * (o.x1 - o.x0);
        return new THREE.Vector3(
            THREE.MathUtils.clamp(x, o.x0, o.x1),
            9 + this.rng() * 10,
            o.sjoZ * (0.15 + this.rng() * 0.6) + o.kaiZ1 * this.rng()
        );
    }

    /** Finn et sted å lande nær `naer`: kaidekket (flatt, ingen tønne der) eller vannet. */
    private finnLandingssted(m: Maake, naer: THREE.Vector3): boolean {
        const o = this.omr;
        for (let forsok = 0; forsok < 4; forsok++) {
            const vann = this.rng() < 0.4;
            const x = THREE.MathUtils.clamp(naer.x + (this.rng() - 0.5) * 36, o.x0 + 2, o.x1 - 2);
            const z = vann ? -3 - this.rng() * 22 : o.kaiZ0 + 0.4 + this.rng() * (o.kaiZ1 - o.kaiZ0 - 0.8);
            if (vann) {
                m.maal.set(x, o.vannY + 0.03, z);
                m.paaVann = true;
                return true;
            }
            const hit = this.phys.rayWorld(new THREE.Vector3(x, 6, z), new THREE.Vector3(0, -1, 0), 10, true);
            if (!hit || hit.normal.y < 0.9 || hit.point.y > 0.6 || hit.point.y < -0.2) continue;
            m.maal.copy(hit.point);
            m.paaVann = false;
            return true;
        }
        return false;
    }

    /** `spiller`: der gutten er, og hvor fort han beveger seg. */
    update(dt: number, t: number, spiller: THREE.Vector3, spillerFart: number): void {
        if (dt <= 0) return;
        this.skremtTid -= dt;
        for (let i = 0; i < this.fugler.length; i++) {
            const m = this.fugler[i];
            m.tid += dt;
            switch (m.tilstand) {
                case 'sirkler':
                    this.sirkle(m, dt, spiller);
                    break;
                case 'daler':
                    this.dal(m, dt);
                    break;
                case 'staar':
                    this.staa(m, dt, t, spiller, spillerFart);
                    break;
                case 'letter':
                    this.lett(m, dt);
                    break;
            }
            this.skriv(i, m, dt);
        }
        this.mesh.instanceMatrix.needsUpdate = true;
        this.flap.needsUpdate = true;
    }

    private sirkle(m: Maake, dt: number, spiller: THREE.Vector3): void {
        // Måker glir mest, og slår et par tak når de mister høyde.
        const fart = 6.5;
        m.vinkel += (m.retning * fart * dt) / m.radius;
        const mx = m.senter.x + Math.cos(m.vinkel) * m.radius;
        const mz = m.senter.z + Math.sin(m.vinkel) * m.radius;
        const my = m.senter.y + Math.sin(m.tid * 0.4) * 1.5;
        const target = new THREE.Vector3(mx, my, mz);
        this.styrMot(m, target, fart, dt, 1.4);
        // Bank inn i svingen, slå med vingene når den stiger.
        m.bank = THREE.MathUtils.lerp(m.bank, -m.retning * 0.45, dt * 2);
        const stiger = m.vel.y > 0.4;
        m.slag = THREE.MathUtils.lerp(m.slag, stiger || Math.sin(m.tid * 0.7 + m.radius) > 0.75 ? 1 : 0.08, dt * 3);
        m.fold = THREE.MathUtils.lerp(m.fold, 0, dt * 4);
        // Sentrum driver mot der gutten er, så det alltid er måker rundt ham.
        if (Math.abs(m.senter.x - spiller.x) > 45) m.senter.copy(this.nyttSenter(spiller));
        if (m.tid > 14 + (m.radius % 7) * 2 && this.skremtTid <= 0 && this.finnLandingssted(m, spiller)) {
            m.tilstand = 'daler';
            m.tid = 0;
        }
    }

    private dal(m: Maake, dt: number): void {
        const til = new THREE.Vector3().subVectors(m.maal, m.pos);
        const d = til.length();
        // Ned i en slak bue: kom inn litt over målet og brems med vingene på slutten.
        const fart = THREE.MathUtils.clamp(d * 0.9, 1.2, 7);
        const sikte = m.maal.clone();
        sikte.y += Math.min(3, d * 0.15);
        this.styrMot(m, sikte, fart, dt, 2.2);
        m.bank = THREE.MathUtils.lerp(m.bank, 0, dt * 3);
        m.slag = THREE.MathUtils.lerp(m.slag, d < 3 ? 1 : 0.05, dt * 5);
        if (d < 0.35 || m.tid > 12) {
            m.pos.copy(m.maal);
            m.vel.set(0, 0, 0);
            m.tilstand = 'staar';
            m.tid = 0;
            m.neste = 1 + this.rng() * 3;
        }
    }

    private staa(m: Maake, dt: number, t: number, spiller: THREE.Vector3, spillerFart: number): void {
        m.slag = THREE.MathUtils.lerp(m.slag, 0, dt * 6);
        m.fold = THREE.MathUtils.lerp(m.fold, 1, dt * 5);
        m.bank = 0;
        if (m.paaVann) {
            // Gynger med krusningen og driver sakte.
            m.pos.y = m.maal.y + Math.sin(t * 1.3 + m.pos.x * 0.3) * 0.04 + Math.sin(t * 0.7 + m.pos.z * 0.2) * 0.03;
            m.pos.x += Math.sin(m.yaw) * 0.05 * dt;
            m.pos.z += Math.cos(m.yaw) * 0.05 * dt;
        } else {
            // Snur seg og hopper et skritt nå og da.
            m.hopp = Math.max(0, m.hopp - dt * 4);
            m.pos.y = m.maal.y + Math.sin(m.hopp * Math.PI) * 0.12;
        }
        m.neste -= dt;
        if (m.neste <= 0) {
            m.neste = 1.5 + this.rng() * 4;
            m.yaw += (this.rng() - 0.5) * 2.2;
            if (!m.paaVann && this.rng() < 0.5) m.hopp = 1;
        }
        const d = Math.hypot(spiller.x - m.pos.x, spiller.z - m.pos.z);
        const naer = Math.abs(spiller.y - m.pos.y) < 3 && (d < SKREMT_R_GAA || (d < SKREMT_R && spillerFart > 3.5));
        if (naer) {
            // Én skremt måke tar med seg naboene.
            this.skremtTid = 6;
            this.skremFra(m.pos, spiller);
        } else if (m.tid > 25 + this.rng() * 30) {
            this.lettFra(m, new THREE.Vector3(this.rng() - 0.5, 0, this.rng() - 0.5));
        }
    }

    private skremFra(sted: THREE.Vector3, spiller: THREE.Vector3): void {
        let antall = 0;
        for (const m of this.fugler) {
            if (m.tilstand !== 'staar' || m.pos.distanceTo(sted) > 7) continue;
            antall++;
            const bort = new THREE.Vector3(m.pos.x - spiller.x, 0, m.pos.z - spiller.z);
            this.lettFra(m, bort);
            // Ikke alle på samme bildet: noen reagerer litt senere.
            m.tid = -this.rng() * 0.35;
        }
        if (antall) this.onLetter?.(sted.clone(), antall);
    }

    private lettFra(m: Maake, bort: THREE.Vector3): void {
        bort.y = 0;
        if (bort.lengthSq() < 0.01) bort.set(0, 0, -1);
        bort.normalize();
        m.tilstand = 'letter';
        m.tid = 0;
        m.vel.copy(bort).multiplyScalar(2.5);
        m.vel.y = 0.5;
        m.senter.copy(this.nyttSenter(m.pos));
        m.yaw = Math.atan2(bort.x, bort.z);
    }

    private lett(m: Maake, dt: number): void {
        if (m.tid < 0) return; // venter på tur
        // Kraftige slag rett opp og bort, så inn i sirkelen.
        m.slag = 1;
        m.fold = THREE.MathUtils.lerp(m.fold, 0, dt * 10);
        m.vel.y = THREE.MathUtils.lerp(m.vel.y, 4.5, dt * 3);
        const flat = new THREE.Vector3(m.vel.x, 0, m.vel.z);
        if (flat.length() < 6) flat.multiplyScalar(1 + dt * 1.5);
        m.vel.x = flat.x;
        m.vel.z = flat.z;
        m.pos.addScaledVector(m.vel, dt);
        this.vendMot(m, dt, 6);
        if (m.pos.y > m.senter.y - 2 || m.tid > 5) {
            m.tilstand = 'sirkler';
            m.tid = 0;
            m.vinkel = Math.atan2(m.pos.z - m.senter.z, m.pos.x - m.senter.x);
        }
    }

    private styrMot(m: Maake, target: THREE.Vector3, fart: number, dt: number, smidig: number): void {
        const onsket = new THREE.Vector3().subVectors(target, m.pos);
        const d = onsket.length();
        if (d > 0.001) onsket.multiplyScalar(Math.min(fart, d / Math.max(dt, 0.001)) / d);
        m.vel.lerp(onsket, Math.min(1, dt * smidig));
        m.pos.addScaledVector(m.vel, dt);
        this.vendMot(m, dt, 4);
    }

    private vendMot(m: Maake, dt: number, rask: number): void {
        if (m.vel.x * m.vel.x + m.vel.z * m.vel.z < 0.04) return;
        const maal = Math.atan2(m.vel.x, m.vel.z);
        let d = maal - m.yaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        m.yaw += d * Math.min(1, dt * rask);
    }

    private skriv(i: number, m: Maake, dt: number): void {
        // Vingeslag: rask når den slår, nesten stille når den glir (vingene litt opp i en V).
        m.fase += (5 + m.slag * 7) * dt * (m.slag > 0.1 ? 1 : 0.3);
        const glid = 0.12;
        const vinkel = glid * (1 - m.slag) + Math.sin(m.fase) * 0.85 * m.slag;
        const stigning = m.tilstand === 'staar' ? 0 : THREE.MathUtils.clamp(-m.vel.y * 0.08, -0.4, 0.4);
        this.dummy.position.copy(m.pos);
        // På land står den på beina (kroppen 0,1 m over dekket). På vannet ligger den i det.
        if (!m.paaVann || m.tilstand !== 'staar') this.dummy.position.y += 0.1 * m.fold;
        this.dummy.rotation.set(stigning, m.yaw, m.bank, 'YXZ');
        // Små variasjoner i størrelse: ikke alle måkene er like store.
        const s = 0.92 + ((i * 37) % 11) / 60;
        this.dummy.scale.setScalar(s);
        this.dummy.updateMatrix();
        this.mesh.setMatrixAt(i, this.dummy.matrix);
        this.flap.setXY(i, vinkel, m.fold);
    }

    dispose(): void {
        this.mesh.geometry.dispose();
        (this.mesh.material as THREE.Material).dispose();
    }
}

// aDel: 0 kropp, 1 indre vinge, 2 ytre vinge. aSide: -1/1 (venstre/høyre vinge).
const VINGE_GLSL = /* glsl */ `
attribute vec2 iFlap; // vingevinkel, fold
attribute vec2 aVinge; // del, side
vec2 vRot(vec2 p, vec2 piv, float a) {
    float c = cos(a), s = sin(a);
    p -= piv;
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y) + piv;
}
vec3 vingeFold(vec3 p) {
    // Foldet: vingene legges som en grå sal over ryggen, med spissene bak over halen.
    float side = aVinge.y;
    float ut = max(abs(p.x) - 0.05, 0.0);
    vec3 f;
    f.x = side * (0.03 + ut * 0.06);
    f.y = 0.062 - ut * 0.025;
    f.z = (p.z + 0.1) * 0.35 - ut * 0.55 + 0.03;
    return mix(p, f, iFlap.y);
}
vec3 vinge(vec3 p) {
    if (aVinge.x < 0.5) return p;
    float side = aVinge.y;
    float a = iFlap.x * (1.0 - iFlap.y);
    vec3 q = p;
    if (aVinge.x > 1.5) q.xy = vRot(q.xy, vec2(side * 0.32, 0.0), side * a * 0.7);
    q.xy = vRot(q.xy, vec2(side * 0.05, 0.0), side * a);
    return vingeFold(q);
}
vec3 vingeNormal(vec3 n) {
    if (aVinge.x < 0.5) return n;
    float side = aVinge.y;
    float a = iFlap.x * (1.0 - iFlap.y);
    float tot = aVinge.x > 1.5 ? a * 1.7 : a;
    n.xy = vRot(n.xy, vec2(0.0), side * tot);
    return n;
}
`;

/** Én måke i meter: ca. 0,5 m lang, 1,2 m vingespenn. Nebbet peker mot +z. */
function lagMaakeGeometri(): THREE.BufferGeometry {
    const pos: number[] = [];
    const col: number[] = [];
    const vinge: number[] = [];
    const hvit = new THREE.Color(0xeef0f0);
    const graa = new THREE.Color(0x9aa5ab);
    const lys = new THREE.Color(0xdfe3e4);
    const svart = new THREE.Color(0x1b1d1f);
    const gul = new THREE.Color(0xe0b53a);
    const tri = (a: number[], b: number[], c: number[], farge: THREE.Color, del = 0, side = 0) => {
        pos.push(...a, ...b, ...c);
        for (let k = 0; k < 3; k++) {
            col.push(farge.r, farge.g, farge.b);
            vinge.push(del, side);
        }
    };
    const quad = (a: number[], b: number[], c: number[], d: number[], f: THREE.Color, del = 0, side = 0) => {
        tri(a, b, c, f, del, side);
        tri(a, c, d, f, del, side);
    };
    // Kroppen: en spindel med seks sider fra halen (-z) til hodet (+z).
    const ring = (z: number, r: number, y = 0) => {
        const out: number[][] = [];
        for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2;
            out.push([Math.cos(a) * r, y + Math.sin(a) * r * 0.85, z]);
        }
        return out;
    };
    const rings = [ring(-0.24, 0.015, 0.01), ring(-0.1, 0.055), ring(0.06, 0.065), ring(0.16, 0.04, 0.03), ring(0.21, 0.045, 0.06)];
    for (let r = 0; r < rings.length - 1; r++) {
        for (let k = 0; k < 6; k++) {
            const a = rings[r][k];
            const b = rings[r][(k + 1) % 6];
            const c = rings[r + 1][(k + 1) % 6];
            const d = rings[r + 1][k];
            // Grå rygg på kroppen, hvit buk og hode.
            const rygg = r === 1 && (k === 1 || k === 2);
            quad(a, d, c, b, rygg ? graa : hvit);
        }
    }
    // Hodet lukkes, og nebbet stikker fram.
    const hode = rings[rings.length - 1];
    const tupp = [0, 0.06, 0.3];
    for (let k = 0; k < 6; k++) tri(hode[k], tupp, hode[(k + 1) % 6], k === 4 || k === 5 || k === 0 ? gul : hvit);
    // Beina: to tynne streker ned til dekket (synes bare når den står; i lufta er de under kroppen).
    const bein = new THREE.Color(0xc98e74);
    for (const side of [-1, 1]) {
        const x = side * 0.025;
        quad([x - 0.008, -0.04, 0.0], [x + 0.008, -0.04, 0.0], [x + 0.008, -0.1, 0.01], [x - 0.008, -0.1, 0.01], bein);
        quad([x + 0.008, -0.04, 0.0], [x - 0.008, -0.04, 0.0], [x - 0.008, -0.1, 0.01], [x + 0.008, -0.1, 0.01], bein);
        tri([x, -0.1, 0.05], [x - 0.02, -0.1, -0.005], [x + 0.02, -0.1, -0.005], bein);
    }
    // Halen: en flat vifte.
    tri([-0.06, 0.02, -0.12], [0.06, 0.02, -0.12], [0, 0.02, -0.3], hvit);
    tri([0.06, 0.02, -0.12], [-0.06, 0.02, -0.12], [0, 0.02, -0.3], hvit);
    // Vingene: indre del grå, ytre del med svarte spisser. Begge sider av flata.
    for (const side of [-1, 1]) {
        const s = side;
        const inner = [[s * 0.05, 0.03, 0.08], [s * 0.32, 0.03, 0.05], [s * 0.32, 0.03, -0.1], [s * 0.05, 0.03, -0.08]];
        const outer = [[s * 0.32, 0.03, 0.05], [s * 0.58, 0.03, -0.02], [s * 0.62, 0.03, -0.1], [s * 0.32, 0.03, -0.1]];
        const tip = [[s * 0.58, 0.03, -0.02], [s * 0.66, 0.03, -0.09], [s * 0.62, 0.03, -0.1]];
        // Oversida grå, undersida lys, slik måkevinger er.
        const both = (q: number[][], f: THREE.Color, del: number) => {
            const under = f === graa ? lys : f;
            if (s > 0) {
                quad(q[0], q[1], q[2], q[3], f, del, s);
                quad(q[3], q[2], q[1], q[0], under, del, s);
            } else {
                quad(q[3], q[2], q[1], q[0], f, del, s);
                quad(q[0], q[1], q[2], q[3], under, del, s);
            }
        };
        both(inner, graa, 1);
        both(outer, graa, 2);
        tri(tip[0], tip[1], tip[2], svart, 2, s);
        tri(tip[2], tip[1], tip[0], svart, 2, s);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('aVinge', new THREE.Float32BufferAttribute(vinge, 2));
    geo.computeVertexNormals();
    return geo;
}
