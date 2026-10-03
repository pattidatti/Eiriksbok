// Merkene på bakken der gutten skal gjøre noe: en gyllen ring akkurat så stor som området der
// «E: …» dukker opp, og en svak lyssøyle over den som synes på avstand.
//
// Før måtte eleven lete seg fram til den ene halvannen meteren ved bismeren der E virket, og det
// samme gjaldt stedene oppdragene peker på. Nå tegnes det et merke for:
//   - stedet bunten skal legges (baering.ts), mens gutten bærer en,
//   - stedene de aktive oppdragene trenger (`Oppdrag.stederSomTrengs`, `sted:<id>`),
//   - det systemene melder med `maal()` (system.ts).
// Ringen pulserer på stedet (den glir aldri), og fylles når gutten står innenfor. Søyla toner bort
// når han er nær, så den ikke står i veien for det han skal se på.
import * as THREE from 'three';
import type { SpillKontekst, Spillsystem } from './system';
import { NAER } from './baering';

/** Flest merker om gangen. */
const MAKS = 6;
/** Merker lenger unna enn dette tegnes ikke (m). */
const SYNS_R = 110;
/** Hvor ofte kildene spørres (s). */
const SPOR_HVER = 0.25;
const GULL = new THREE.Color('#f2b33d');

interface Punkt {
    pos: THREE.Vector3;
    r: number;
}

interface Merke {
    gruppe: THREE.Group;
    ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
    fyll: THREE.Mesh<THREE.CircleGeometry, THREE.MeshBasicMaterial>;
    soyle: THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>;
    /** 0-1: toner inn og ut når merket kommer og går. */
    syn: number;
    maal: number;
    r: number;
    /** Nøkkelen (posisjonen) så bakkehøyden bare finnes én gang. */
    nokkel: string;
}

const SOYLE_VS = /* glsl */ `
varying float vH;
void main() {
    vH = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const SOYLE_FS = /* glsl */ `
uniform vec3 farge;
uniform float styrke;
varying float vH;
void main() {
    float a = pow(1.0 - vH, 1.6) * styrke;
    gl_FragColor = vec4(farge, a);
}`;

export class MaalMerker implements Spillsystem {
    readonly navn = 'maalmerker';
    private readonly k: SpillKontekst;
    private readonly systemer: Spillsystem[];
    private readonly merker: Merke[] = [];
    private readonly hoyde = new Map<string, number>();
    private spor = 0;
    private t = 0;
    private punkter: Punkt[] = [];

    constructor(k: SpillKontekst, systemer: Spillsystem[]) {
        this.k = k;
        this.systemer = systemer;
        const ringGeo = new THREE.RingGeometry(0.9, 1, 64).rotateX(-Math.PI / 2);
        const fyllGeo = new THREE.CircleGeometry(0.9, 48).rotateX(-Math.PI / 2);
        const soyleGeo = new THREE.CylinderGeometry(0.16, 0.3, 4.5, 16, 1, true).translate(0, 2.25, 0);
        for (let i = 0; i < MAKS; i++) {
            const felles = { color: GULL, transparent: true, depthWrite: false, toneMapped: false, fog: false };
            const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ ...felles, side: THREE.DoubleSide }));
            const fyll = new THREE.Mesh(fyllGeo, new THREE.MeshBasicMaterial({ ...felles, opacity: 0 }));
            const soyle = new THREE.Mesh(
                soyleGeo,
                new THREE.ShaderMaterial({
                    vertexShader: SOYLE_VS,
                    fragmentShader: SOYLE_FS,
                    uniforms: { farge: { value: GULL }, styrke: { value: 0 } },
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    blending: THREE.AdditiveBlending,
                })
            );
            // Over bakken og pyttene, men under figurene (de tegnes før det gjennomsiktige uansett).
            ring.renderOrder = fyll.renderOrder = soyle.renderOrder = 5;
            const gruppe = new THREE.Group();
            gruppe.add(fyll, ring, soyle);
            gruppe.visible = false;
            gruppe.name = 'maalmerke';
            for (const m of [ring, fyll, soyle]) {
                m.frustumCulled = false;
                m.castShadow = m.receiveShadow = false;
            }
            k.scene.add(gruppe);
            this.merker.push({ gruppe, ring, fyll, soyle, syn: 0, maal: 0, r: 1, nokkel: '' });
        }
    }

    /** Alle punktene gutten skal til nå. */
    private finn(): Punkt[] {
        const { world, folk, baering, player } = this.k;
        const ut: Punkt[] = [];
        if (baering.baerer) for (const b of world.streamer.bunter()) ut.push({ pos: b.lever, r: NAER });
        const trengs = folk.oppdrag.stederSomTrengs();
        if (trengs.size) {
            for (const s of world.streamer.steder()) if (trengs.has(s.id)) ut.push({ pos: s.pos, r: s.r ?? 1.6 });
        }
        for (const s of this.systemer) {
            if (s === this) continue;
            const m = s.maal?.();
            if (m) for (const p of m) ut.push(p);
        }
        const g = player.pos;
        return ut
            .filter((p) => p.pos.distanceTo(g) < SYNS_R)
            .sort((a, b) => a.pos.distanceToSquared(g) - b.pos.distanceToSquared(g))
            .slice(0, MAKS);
    }

    /** Bakken under punktet (gjørma har hauger, golvet inne ligger høyere): én stråle per sted. */
    private bakke(p: THREE.Vector3, nokkel: string): number {
        const kjent = this.hoyde.get(nokkel);
        if (kjent !== undefined) return kjent;
        const hit = this.k.phys.rayWorld(_o.set(p.x, p.y + 0.7, p.z), NED, 2.5);
        const y = hit ? hit.point.y : p.y;
        if (this.hoyde.size > 200) this.hoyde.clear();
        this.hoyde.set(nokkel, y);
        return y;
    }

    bilde(dt: number, kamera: THREE.PerspectiveCamera): void {
        this.t += dt;
        this.spor -= dt;
        if (this.spor <= 0) {
            this.spor = SPOR_HVER;
            this.punkter = this.k.modus() === 'foot' ? this.finn() : [];
        }
        const g = this.k.player.pos;
        // Pulsen er lik for alle merkene og står på stedet: lysere og mørkere, aldri større og mindre.
        const puls = 0.5 + 0.5 * Math.sin(this.t * 3.2);
        for (let i = 0; i < MAKS; i++) {
            const m = this.merker[i];
            const p = this.punkter[i];
            if (p) {
                const nokkel = `${p.pos.x.toFixed(1)},${p.pos.y.toFixed(1)},${p.pos.z.toFixed(1)}`;
                if (nokkel !== m.nokkel) {
                    // Nytt sted: start usynlig der, så merket aldri glir fra et sted til et annet.
                    if (m.syn > 0.05 && m.nokkel) m.maal = 0;
                    else {
                        m.nokkel = nokkel;
                        m.r = p.r;
                        m.gruppe.position.set(p.pos.x, this.bakke(p.pos, nokkel) + 0.04, p.pos.z);
                        m.gruppe.scale.set(p.r, 1, p.r);
                        m.maal = 1;
                    }
                } else m.maal = 1;
            } else m.maal = 0;
            m.syn += (m.maal - m.syn) * Math.min(1, dt * 5);
            if (m.syn < 0.01 && m.maal === 0) {
                m.gruppe.visible = false;
                m.nokkel = '';
                continue;
            }
            m.gruppe.visible = true;
            const pos = m.gruppe.position;
            const inne = Math.hypot(pos.x - g.x, pos.z - g.z) < m.r && Math.abs(pos.y - g.y) < 1.3;
            const dKam = pos.distanceTo(kamera.position);
            m.ring.material.opacity = m.syn * (inne ? 0.95 : 0.55 + 0.4 * puls);
            m.fyll.material.opacity = m.syn * (inne ? 0.28 : 0.06 + 0.06 * puls);
            // Søyla: tydelig på avstand, borte når gutten nesten er der. Søyla i stua synes ikke gjennom
            // veggene (dybden testes), men ringen og døra er nok når han er nær.
            const fjern = THREE.MathUtils.smoothstep(dKam, 3.5, 12);
            m.soyle.material.uniforms.styrke.value = m.syn * fjern * (0.32 + 0.12 * puls);
            // Bredere lenger unna, så den ikke krymper til en strek i tåka.
            const bredde = THREE.MathUtils.clamp(dKam / 20, 1, 3.5);
            m.soyle.scale.set(bredde / m.r, 1, bredde / m.r);
            m.soyle.visible = fjern > 0.01;
        }
    }

    dispose(): void {
        for (const m of this.merker) {
            this.k.scene.remove(m.gruppe);
            m.ring.material.dispose();
            m.fyll.material.dispose();
            m.soyle.material.dispose();
        }
        this.merker[0]?.ring.geometry.dispose();
        this.merker[0]?.fyll.geometry.dispose();
        this.merker[0]?.soyle.geometry.dispose();
    }
}

const NED = new THREE.Vector3(0, -1, 0);
const _o = new THREE.Vector3();

export function lagMaalMerker(k: SpillKontekst, systemer: Spillsystem[]): Spillsystem {
    return new MaalMerker(k, systemer);
}
