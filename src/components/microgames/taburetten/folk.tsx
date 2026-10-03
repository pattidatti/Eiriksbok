// Folket i scenen: mengden av hender (instanser), stolen med statsråden, livgarden,
// den som kastes av ved bytte, og kongens øyer (gull-stiplet vernlinje).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useQuality } from '../kit';
import { flate, helning, løft, påØy } from './crowd';
import { FARGE } from './farger';
import { nå, type Fx } from './fx';
import { FLERTALL, SETER, type Game } from './state';
import { hattFor, teksturer } from './teksturer';
import { TUNING } from './tuning';

type GRef = React.MutableRefObject<Game>;
type FxRef = React.MutableRefObject<Fx>;

const AVSTAND = 0.36;
const KOLONNER = 100;
/** Skuldrene i mengden: her begynner ermene. */
const SKULDER = 0.8;
const RAD_Z = [-0.35, -1.05, -1.75, -2.45, -3.15, -3.85];
const MENGDE_B = 12;

const rød = new THREE.Color(FARGE.rød);
const blå = new THREE.Color(FARGE.blå);
const gull = new THREE.Color(FARGE.gull);
const tmp = new THREE.Color();
const m4 = new THREE.Matrix4();
const q = new THREE.Quaternion();
const s3 = new THREE.Vector3();
const p3 = new THREE.Vector3();
const zAkse = new THREE.Vector3(0, 0, 1);

/** Fast «tilfeldig» tall per kolonne, så fargene ikke flimrer når mengden ruller. */
const hash = (i: number) => {
    const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
};

/** Mengden: rader med hoder, og hender som rekker opp til bølgene. */
export function Mengde({ gRef }: { gRef: GRef }) {
    const kv = useQuality();
    const rader = kv.tier === 'lav' ? 4 : kv.tier === 'middels' ? 5 : 6;
    const n = rader * KOLONNER;
    const t = teksturer();
    const hender = useRef<THREE.InstancedMesh>(null);
    const ermer = useRef<THREE.InstancedMesh>(null);
    const hoder = useRef<(THREE.Mesh | null)[]>([]);
    useFrame(({ clock }) => {
        const g = gRef.current;
        const h = hender.current;
        const e = ermer.current;
        if (!h || !e) return;
        const k0 = Math.floor((g.x - 13) / AVSTAND);
        const andelRød = g.rødt / SETER;
        const tid = clock.elapsedTime;
        let i = 0;
        for (let r = 0; r < rader; r++) {
            // Bakre rader står bare litt høyere, så alle hender holder seg under konturlinja.
            const løft = r * 0.06;
            for (let k = 0; k < KOLONNER; k++) {
                const kol = k0 + k;
                const x = kol * AVSTAND + (r % 2) * 0.17;
                const u = hash(kol * 7 + r);
                const erRød = u < andelRød;
                const flertall = erRød === g.rødt >= FLERTALL;
                const vern = r === 0 && g.vern && påØy(g, x);
                // Flertallet bærer bølgen, mindretallet holder hendene lavere.
                const vink = Math.sin(tid * 3 + kol) * 0.06;
                let y = flate(g, x) + løft - 0.3 + vink;
                if (!flertall && !vern) y = Math.min(y, SKULDER + 0.5 + u * 0.4 + løft);
                y = Math.max(SKULDER + løft * 0.6, y);
                const z = RAD_Z[r];
                const vri = Math.sin(kol * 1.7) * 0.18 + (vern ? 0 : helning(g, x) * -0.3);
                q.setFromAxisAngle(zAkse, vri);
                const skala = 1 - r * 0.06;
                m4.compose(p3.set(x, y, z), q, s3.set(0.42 * skala, 0.56 * skala, 1));
                h.setMatrixAt(i, m4);
                const lengde = Math.max(0.01, y - 0.2 - SKULDER - løft * 0.6);
                m4.compose(
                    p3.set(x, SKULDER + løft * 0.6 + lengde / 2, z - 0.01),
                    q.identity(),
                    s3.set(0.16 * skala, lengde, 1)
                );
                e.setMatrixAt(i, m4);
                tmp.copy(vern ? gull : erRød ? rød : blå).multiplyScalar(1 - r * 0.09);
                h.setColorAt(i, tmp);
                e.setColorAt(i, tmp);
                i++;
            }
        }
        h.count = e.count = i;
        h.instanceMatrix.needsUpdate = e.instanceMatrix.needsUpdate = true;
        if (h.instanceColor) h.instanceColor.needsUpdate = true;
        if (e.instanceColor) e.instanceColor.needsUpdate = true;
        // Hoderadene står fast i gata: flytt bare planet en flis om gangen.
        hoder.current.forEach((m, r) => {
            if (m) m.position.x = Math.floor(g.x / MENGDE_B) * MENGDE_B + 4 + r * 1.3;
        });
    });
    return (
        <>
            <instancedMesh ref={ermer} args={[undefined, undefined, n]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={t.erme} transparent alphaTest={0.3} />
            </instancedMesh>
            <instancedMesh ref={hender} args={[undefined, undefined, n]} frustumCulled={false}>
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={t.hånd} transparent alphaTest={0.3} />
            </instancedMesh>
            {RAD_Z.slice(0, rader).map((z, r) => (
                <mesh
                    key={r}
                    ref={(el) => void (hoder.current[r] = el)}
                    position={[0, 0.55 + r * 0.19, z + 0.02]}
                >
                    <planeGeometry args={[MENGDE_B * 4, 1.15 + r * 0.05]} />
                    <MengdeMat r={r} />
                </mesh>
            ))}
        </>
    );
}

function MengdeMat({ r }: { r: number }) {
    const map = useMemo(() => {
        const t = teksturer().mengde[r % 3].clone();
        t.repeat.set(4, 1);
        t.needsUpdate = true;
        return t;
    }, [r]);
    return <meshBasicMaterial map={map} transparent alphaTest={0.2} color={'#fff'} />;
}

const STOL_B = 1.4;
const FIG_B = 1.25;
const FIG_H = FIG_B * 1.25;

/** Stolen med statsråden, hatten, livgarden og glorien ved perfekt bytte. */
export function Stol({ gRef, fxRef }: { gRef: GRef; fxRef: FxRef }) {
    const t = teksturer();
    const stol = useRef<THREE.Group>(null);
    const figur = useRef<THREE.MeshBasicMaterial>(null);
    const figurMesh = useRef<THREE.Mesh>(null);
    const hatt = useRef<THREE.Mesh>(null);
    const hattMat = useRef<THREE.MeshBasicMaterial>(null);
    const vakt = useRef<THREE.Group>(null);
    const kastet = useRef<THREE.Mesh>(null);
    const kastetMat = useRef<THREE.MeshBasicMaterial>(null);
    const glorie = useRef<THREE.Mesh>(null);
    const glorieMat = useRef<THREE.MeshBasicMaterial>(null);
    const fart = useRef<THREE.Mesh>(null);
    const fartMat = useRef<THREE.MeshBasicMaterial>(null);
    const hattY = useRef(0);
    const helnTil = useRef(0);
    useFrame((_, raw) => {
        const g = gRef.current;
        const fx = fxRef.current;
        const dt = Math.min(0.05, raw);
        const T = nå();
        if (!stol.current) return;
        // Stolen: tilter med bølgen på hendene, i lufta etter farten. Lener fram når du holder.
        const mål = g.luft
            ? Math.atan2(g.vy, g.vx) * 0.45
            : Math.atan(helning(g, g.x)) + (g.hold ? -0.12 : 0);
        helnTil.current += (mål - helnTil.current) * Math.min(1, dt * 10);
        const tapt = g.mode === 'lost' && g.årsak === 'hindring';
        const smell = tapt ? Math.min(1, (T - fx.smell) * 1.5) : 0;
        stol.current.position.set(g.x, g.y + smell * -0.3, 0);
        stol.current.rotation.z = helnTil.current - smell * 1.4;
        // Landing: stolen klemmes litt sammen og spretter.
        const sp = Math.max(0, 1 - (T - Math.max(fx.fin, fx.dunk)) * 5);
        stol.current.scale.set(1 + sp * 0.12, 1 - sp * 0.14, 1);
        // Statsråden
        if (figur.current && figurMesh.current) {
            const tex = t.figur[g.stol.figur];
            if (figur.current.map !== tex) figur.current.map = tex;
            const hopp = Math.max(0, 1 - (T - fx.bytte) * 3);
            figurMesh.current.position.y = 1.22 + Math.sin(hopp * Math.PI) * 0.5;
            figurMesh.current.visible = !tapt;
        }
        // Hatten letter på toppen av hoppet og spretter av ved dunk.
        if (hatt.current && hattMat.current) {
            const tex = t.hatt[hattFor(g.stol.figur)];
            if (hattMat.current.map !== tex) hattMat.current.map = tex;
            const topp = g.luft ? Math.max(0, 1 - Math.abs(g.vy) / 3) * 0.28 : 0;
            const dunk = Math.max(0, 1 - (T - fx.dunk) * 2.5);
            hattY.current += (topp - hattY.current) * Math.min(1, dt * 12);
            hatt.current.position.set(
                0.02,
                2.1 + hattY.current + Math.sin(dunk * Math.PI) * 0.6,
                0.02
            );
            hatt.current.rotation.z = dunk * 0.8;
            hatt.current.visible = !tapt;
        }
        // Livgarden løper under stolbena på kongens øyer.
        if (vakt.current) {
            const vis = løft(g) === 'vern';
            vakt.current.visible = vis;
            vakt.current.position.set(g.x, 0, 0.25);
            vakt.current.children.forEach((ch, i) => {
                const x = (i - 1.5) * 0.42;
                const top = flate(g, g.x + x);
                ch.position.set(x, top - 0.55 + Math.abs(Math.sin(T * 9 + i * 1.6)) * 0.06, 0);
            });
        }
        // Den som ble kastet av, flyr i en bue med frakkeskjøtene flagrende.
        if (kastet.current && kastetMat.current) {
            const s = T - fx.bytte;
            const vis = !!fx.kastet && s < 1.4;
            kastet.current.visible = vis;
            if (vis && fx.kastet) {
                const tex = t.figur[fx.kastet.figur];
                if (kastetMat.current.map !== tex) kastetMat.current.map = tex;
                // Relativt til stolen, som har kjørt videre: buen går bakover og ned.
                kastet.current.position.set(g.x - s * 3.2, fx.kastY + 1.2 + s * 6 - s * s * 9, 0.3);
                kastet.current.rotation.z = s * 5;
            }
        }
        // Fartsstreker bak stolen når hendene kaster den fort.
        if (fart.current && fartMat.current) {
            const k = Math.max(0, Math.min(1, (g.vx - 6) / 5));
            fart.current.position.set(g.x - 1.6, g.y + 1.1, -0.1);
            fart.current.rotation.z = helnTil.current * 0.6;
            fart.current.scale.set(1 + k * 1.5, 1, 1);
            fartMat.current.opacity = k * 0.9;
            fart.current.visible = k > 0.02 && !tapt;
        }
        // Glorie ved perfekt bytte.
        if (glorie.current && glorieMat.current) {
            const s = T - fx.perfekt;
            const vis = s < 1.2;
            glorie.current.visible = vis;
            if (vis) {
                const k = 1 + Math.min(1, s * 4) * 2.4;
                glorie.current.scale.set(k, k, 1);
                glorie.current.rotation.z = s * 0.8;
                glorieMat.current.opacity = Math.max(0, 1 - s / 1.2);
            }
        }
    });
    return (
        <>
            <mesh ref={glorie} position={[0, 0, -0.2]} visible={false}>
                <planeGeometry args={[2, 2]} />
                <meshBasicMaterial ref={glorieMat} map={t.stråler} transparent depthWrite={false} />
            </mesh>
            <mesh ref={fart} visible={false}>
                <planeGeometry args={[2.2, 1.1]} />
                <meshBasicMaterial ref={fartMat} map={t.sky} transparent depthWrite={false} />
            </mesh>
            <group ref={stol}>
                <mesh position={[0, STOL_B * 0.375, 0]}>
                    <planeGeometry args={[STOL_B, STOL_B * 0.75]} />
                    <meshBasicMaterial map={t.stol} transparent alphaTest={0.3} />
                </mesh>
                <mesh ref={figurMesh} position={[-0.05, 1.22, 0.01]}>
                    <planeGeometry args={[FIG_B, FIG_H]} />
                    <meshBasicMaterial
                        ref={figur}
                        map={t.figur.selmer}
                        transparent
                        alphaTest={0.3}
                    />
                </mesh>
                <mesh ref={hatt} position={[0.02, 2.1, 0.02]}>
                    <planeGeometry args={[0.75, 0.75]} />
                    <meshBasicMaterial
                        ref={hattMat}
                        map={t.hatt.floss}
                        transparent
                        alphaTest={0.3}
                    />
                </mesh>
            </group>
            <group ref={vakt}>
                {[0, 1, 2, 3].map((i) => (
                    <mesh key={i}>
                        <planeGeometry args={[0.55, 1.1]} />
                        <meshBasicMaterial map={t.gardist} transparent alphaTest={0.3} />
                    </mesh>
                ))}
            </group>
            <mesh ref={kastet} visible={false}>
                <planeGeometry args={[FIG_B, FIG_H]} />
                <meshBasicMaterial
                    ref={kastetMat}
                    map={t.figur.selmer}
                    transparent
                    alphaTest={0.3}
                />
            </mesh>
        </>
    );
}

/** Kongens øyer: gull-stiplet vernlinje over mengden der livgarden bærer. */
export function Vernlinjer({ gRef }: { gRef: GRef }) {
    const t = teksturer();
    const linjer = useRef<(THREE.Mesh | null)[]>([]);
    const kart = useMemo(
        () =>
            Array.from({ length: 6 }, () => {
                const m = t.gullstrek.clone();
                m.needsUpdate = true;
                return m;
            }),
        [t]
    );
    useFrame(() => {
        const g = gRef.current;
        linjer.current.forEach((m, i) => {
            if (!m) return;
            const ø = g.vern ? g.øyer[g.øyer.length - 1 - i] : undefined;
            m.visible = !!ø;
            if (!ø) return;
            const b = ø.x1 - ø.x0;
            m.position.set((ø.x0 + ø.x1) / 2, TUNING.hender.vernHøyde - 0.75, 0.15);
            m.scale.set(b, 1, 1);
            kart[i].repeat.set(b * 2, 1);
        });
    });
    return (
        <>
            {kart.map((map, i) => (
                <mesh key={i} ref={(el) => void (linjer.current[i] = el)} visible={false}>
                    <planeGeometry args={[1, 0.09]} />
                    <meshBasicMaterial map={map} transparent />
                </mesh>
            ))}
        </>
    );
}
