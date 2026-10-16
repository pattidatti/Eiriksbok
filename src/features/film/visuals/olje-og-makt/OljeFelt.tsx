import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Oljefeltet i 3D: boretårn og pumper i ørkenen, et rør som går til kaia, og et tankskip.
 * Midt på røret sitter en stor ventil. Oljen er lysende dråper som renner i røret.
 *
 * «ventil»: oktober 1973. Pumpene går, oljen renner til skipet, ventilen skrus igjen,
 *   røret tømmes, og pumpene står stille. Oljen er der fortsatt.
 * «eiere»: tidlig 1900-tall. Arbeidere ved pumpene, et britisk skip ved kaia. Kassene med
 *   gull lastes om bord, og skipet seiler av gårde.
 * «klima»: røyk fra et kraftverk, himmelen blir varmere, dammen tørker inn, og
 *   solcellepaneler stiger opp av sanden.
 */

type Modus = 'ventil' | 'eiere' | 'klima';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const damp = (a: number, b: number, l: number, dt: number) =>
    THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));

const TARN: [number, number][] = [
    [22, -6],
    [29, 3],
    [17, 8],
];
const ROR_START = 18;
const ROR_SLUTT = -31;
const VENTIL_X = 0;
const SKIP_X = -44;

function kamera(modus: Modus, beat: number, t: number) {
    if (modus === 'ventil') {
        switch (beat) {
            case 0:
                return { pos: v(44 - t * 0.5, 10, 28), se: v(22, 4, 0) };
            case 1:
                return { pos: v(8 - t * 0.9, 7, 17), se: v(-26, 1, 0) };
            case 2:
                return { pos: v(5.5, 5.5, 7.5), se: v(0, 2.4, 0) };
            case 3:
                return { pos: v(-8, 24, 34), se: v(-12, 0, 0) };
            default:
                return { pos: v(34, 3.2, 24), se: v(22, 3, -1) };
        }
    }
    if (modus === 'eiere') {
        switch (beat) {
            case 0:
                return { pos: v(40, 13, 32), se: v(8, 2, 0) };
            case 1:
                return { pos: v(2 - t * 0.4, 11, 24), se: v(8, 1, 0) };
            case 2:
                return { pos: v(-30, 7, 15), se: v(-44, 2, 0) };
            default:
                return t < 3.5
                    ? { pos: v(30, 4.5, 20), se: v(21, 1.5, 9) }
                    : { pos: v(-24, 13, 34), se: v(-62, 2, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(36, 11, 30), se: v(10, 5, -6) };
        case 1:
            return { pos: v(20, 3, 30), se: v(-10, 18, -60) };
        case 2:
            return { pos: v(14, 16, 34), se: v(-2, 0, 6) };
        case 3:
            return { pos: v(4, 11, 24), se: v(6, 9, -12) };
        default:
            return { pos: v(6, 17, 16), se: v(-18, 2, -12) };
    }
}

/** Et rør (eller en bjelke) mellom to punkter. */
function Ror({
    a,
    b,
    r = 0.55,
    farge = '#94a3b8',
    glass = false,
}: {
    a: THREE.Vector3;
    b: THREE.Vector3;
    r?: number;
    farge?: string;
    glass?: boolean;
}) {
    const { midt, lengde, q } = useMemo(() => {
        const midt = a.clone().add(b).multiplyScalar(0.5);
        const q = new THREE.Quaternion().setFromUnitVectors(
            v(0, 1, 0),
            b.clone().sub(a).normalize()
        );
        return { midt, lengde: a.distanceTo(b), q };
    }, [a, b]);
    return (
        <mesh position={midt} quaternion={q}>
            <cylinderGeometry args={[r, r, lengde, 14, 1, glass]} />
            <meshStandardMaterial
                color={farge}
                emissive="#334155"
                emissiveIntensity={glass ? 0.3 : 0.15}
                transparent={glass}
                opacity={glass ? 0.38 : 1}
                side={glass ? THREE.DoubleSide : THREE.FrontSide}
                depthWrite={!glass}
            />
        </mesh>
    );
}

/** Boretårn i gitterverk med en nikkende pumpe ved foten. */
function Boretarn({
    x,
    z,
    pumper,
    playing,
    gammel,
}: {
    x: number;
    z: number;
    pumper: boolean;
    playing: boolean;
    gammel: boolean;
}) {
    const bom = useRef<THREE.Group>(null);
    const tid = useRef(x);
    const fart = useRef(pumper ? 1 : 0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        fart.current = damp(fart.current, pumper ? 1 : 0, 1.5, dt);
        tid.current += dt * 2.2 * fart.current;
        if (bom.current) bom.current.rotation.z = Math.sin(tid.current) * 0.32 * fart.current;
    });
    const tre = gammel ? '#7c4a1e' : '#475569';
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 5, 0]} rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[0.35, 1.9, 10, 4, 6, true]} />
                <meshBasicMaterial color={tre} wireframe />
            </mesh>
            <mesh position={[0, 10.2, 0]}>
                <boxGeometry args={[0.9, 0.4, 0.9]} />
                <meshStandardMaterial color={tre} />
            </mesh>
            {/* Pumpa */}
            <group position={[3.2, 0, 0]}>
                <mesh position={[0, 0.25, 0]}>
                    <boxGeometry args={[3.4, 0.5, 1.2]} />
                    <meshStandardMaterial color="#57534e" />
                </mesh>
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[0.35, 2.4, 0.35]} />
                    <meshStandardMaterial color="#57534e" />
                </mesh>
                <group ref={bom} position={[0, 2.7, 0]}>
                    <mesh>
                        <boxGeometry args={[4, 0.35, 0.35]} />
                        <meshStandardMaterial color="#b45309" />
                    </mesh>
                    <mesh position={[-2.1, -0.35, 0]}>
                        <boxGeometry args={[0.5, 1.1, 0.45]} />
                        <meshStandardMaterial color="#b45309" />
                    </mesh>
                </group>
            </group>
        </group>
    );
}

const DRAPER = 70;

/** Oljedråper som renner fra feltet mot kaia. Bak en stengt ventil renner de ut og blir borte. */
function Olje({ apen, flyter, playing }: { apen: boolean; flyter: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const lengde = ROR_START - ROR_SLUTT;
    const draper = useMemo(
        () => Array.from({ length: DRAPER }, (_, i) => ({ s: (i / DRAPER) * lengde, aktiv: true })),
        [lengde]
    );
    const forrigeApen = useRef(apen);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const m = ref.current;
        if (!m) return;
        if (apen && !forrigeApen.current) draper.forEach((d) => (d.aktiv = true));
        forrigeApen.current = apen;
        draper.forEach((d, i) => {
            const xFor = ROR_START - d.s;
            const nedstroms = xFor < VENTIL_X;
            // Oppstrøms står oljen stille når ventilen er stengt. Nedstrøms renner den ut.
            const fart = !flyter ? 0 : apen || nedstroms ? 4 : 0;
            d.s += fart * dt;
            if (d.s > lengde) {
                d.s -= lengde;
                if (!apen) d.aktiv = false;
            }
            const x = ROR_START - d.s;
            const synlig = d.aktiv && (apen || x > VENTIL_X || flyter);
            o.position.set(x, 1 + Math.sin(i * 2.3) * 0.18, Math.cos(i * 1.7) * 0.18);
            o.scale.setScalar(synlig ? 0.32 : 0.0001);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, DRAPER]}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshStandardMaterial color="#92400e" emissive="#f59e0b" emissiveIntensity={0.7} />
        </instancedMesh>
    );
}

/** Ventilen: et stort hjul på toppen av en stamme. Hjulet snurrer når det skrus igjen. */
function Ventil({ stengt, playing }: { stengt: boolean; playing: boolean }) {
    const hjul = useRef<THREE.Group>(null);
    const vinkel = useRef(stengt ? Math.PI * 4 : 0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        vinkel.current = damp(vinkel.current, stengt ? Math.PI * 4 : 0, 0.9, dt);
        if (hjul.current) hjul.current.rotation.y = vinkel.current;
    });
    return (
        <group position={[VENTIL_X, 0, 0]}>
            <mesh position={[0, 1, 0]}>
                <sphereGeometry args={[1.05, 16, 12]} />
                <meshStandardMaterial color={stengt ? '#b91c1c' : '#64748b'} />
            </mesh>
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 2, 8]} />
                <meshStandardMaterial color="#334155" />
            </mesh>
            <group ref={hjul} position={[0, 3, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[1.1, 0.13, 8, 28]} />
                    <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.4} />
                </mesh>
                {[0, 1, 2].map((i) => (
                    <mesh key={i} rotation={[0, (i * Math.PI) / 3, 0]}>
                        <boxGeometry args={[2.2, 0.1, 0.1]} />
                        <meshStandardMaterial color="#dc2626" />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

function Tankskip({ seiler, playing, gull }: { seiler: boolean; playing: boolean; gull: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const kasser = useRef<THREE.Group>(null);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        g.position.x = damp(g.position.x, seiler ? -95 : SKIP_X, 0.35, dt);
        if (kasser.current) {
            const s = damp(kasser.current.scale.y, gull ? 1 : 0.001, 3, dt);
            kasser.current.scale.set(1, s, 1);
            kasser.current.visible = s > 0.02;
        }
    });
    return (
        <group ref={ref} position={[SKIP_X, 0, 0]}>
            <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[16, 2.4, 4]} />
                <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            <mesh position={[0, 2.2, 0]}>
                <boxGeometry args={[15, 0.3, 3.6]} />
                <meshStandardMaterial color="#44403c" />
            </mesh>
            <mesh position={[-6, 3.6, 0]}>
                <boxGeometry args={[2.6, 2.6, 3.2]} />
                <meshStandardMaterial color="#f1f5f9" />
            </mesh>
            <mesh position={[-6.6, 5.6, 0]}>
                <cylinderGeometry args={[0.45, 0.55, 1.6, 10]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <group ref={kasser} position={[2, 2.4, 0]}>
                {[-3, -1, 1, 3].map((x) =>
                    [-0.9, 0.9].map((z) => (
                        <mesh key={`${x}${z}`} position={[x, 0.55, z]}>
                            <boxGeometry args={[1.5, 1.1, 1.4]} />
                            <meshStandardMaterial
                                color="#facc15"
                                emissive="#a16207"
                                emissiveIntensity={0.5}
                                metalness={0.4}
                            />
                        </mesh>
                    ))
                )}
            </group>
        </group>
    );
}

const ARBEIDERE: [number, number][] = [
    [19, 10.5],
    [21.5, 11],
    [24, 9.5],
    [26, 7.2],
    [18.4, 12.6],
];

function Arbeidere({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, raw) => {
        tid.current += playing ? Math.min(raw, 0.05) : 0;
        ref.current?.children.forEach((c, i) => {
            c.rotation.x = Math.sin(tid.current * 3 + i * 1.3) * 0.25;
        });
    });
    return (
        <group ref={ref}>
            {ARBEIDERE.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    <mesh position={[0, 0.8, 0]}>
                        <capsuleGeometry args={[0.32, 0.9, 4, 8]} />
                        <meshStandardMaterial color="#1e3a8a" />
                    </mesh>
                    <mesh position={[0, 1.75, 0]}>
                        <sphereGeometry args={[0.28, 10, 8]} />
                        <meshStandardMaterial color="#a16207" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

const ROYK = 40;

function Kraftverk({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const deler = useMemo(
        () => Array.from({ length: ROYK }, (_, i) => ({ alder: (i / ROYK) * 8, pipe: i % 2 })),
        []
    );
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const m = ref.current;
        if (!m) return;
        deler.forEach((d, i) => {
            d.alder = (d.alder + dt) % 8;
            const a = d.alder;
            o.position.set(4 + d.pipe * 4 + a * 0.6, 12 + a * 1.3, -12 + Math.sin(i) * a * 0.3);
            o.scale.setScalar(0.7 + a * 0.45);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <group>
            <mesh position={[6, 2.5, -12]}>
                <boxGeometry args={[10, 5, 6]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            {[4, 8].map((x) => (
                <mesh key={x} position={[x, 7, -12]}>
                    <cylinderGeometry args={[0.7, 1, 10, 12]} />
                    <meshStandardMaterial color="#e2e8f0" />
                </mesh>
            ))}
            <instancedMesh ref={ref} args={[undefined, undefined, ROYK]}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color="#57534e"
                    transparent
                    opacity={0.5}
                    roughness={1}
                    depthWrite={false}
                />
            </instancedMesh>
        </group>
    );
}

/** Dammen som tørker inn, og åkeren som blir brun. */
function Dam({ torr, playing }: { torr: boolean; playing: boolean }) {
    const vann = useRef<THREE.Mesh>(null);
    const aker = useRef<THREE.MeshStandardMaterial>(null);
    const gronn = useMemo(() => new THREE.Color('#4d7c0f'), []);
    const brun = useMemo(() => new THREE.Color('#a16207'), []);
    const s = useRef(torr ? 0.3 : 1);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        s.current = damp(s.current, torr ? 0.3 : 1, 0.6, dt);
        vann.current?.scale.set(s.current, s.current, 1);
        aker.current?.color.copy(brun).lerp(gronn, (s.current - 0.3) / 0.7);
    });
    return (
        <group position={[-9, 0.06, 9]}>
            <mesh ref={vann} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[5, 32]} />
                <meshStandardMaterial color="#0ea5e9" emissive="#0369a1" emissiveIntensity={0.4} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, -0.02, 2]}>
                <planeGeometry args={[9, 12]} />
                <meshStandardMaterial ref={aker} color="#4d7c0f" />
            </mesh>
        </group>
    );
}

const PANELER = 24;

function Solceller({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const h = useRef(synlig ? 1 : 0);
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const m = ref.current;
        if (!m) return;
        h.current = damp(h.current, synlig ? 1 : 0, 2.2, dt);
        for (let i = 0; i < PANELER; i++) {
            const rad = Math.floor(i / 6);
            const kol = i % 6;
            const forsink = Math.min(1, Math.max(0, h.current * 2 - kol * 0.08));
            o.position.set(-22 + kol * 3.2, 0.2 + forsink * 1.1, -6 - rad * 3.6);
            o.rotation.set(0.6, 0, 0);
            o.scale.setScalar(Math.max(0.0001, forsink));
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        }
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh ref={ref} args={[undefined, undefined, PANELER]}>
            <boxGeometry args={[3, 0.18, 2.8]} />
            <meshStandardMaterial color="#1e3a8a" emissive="#1d4ed8" emissiveIntensity={0.45} metalness={0.5} />
        </instancedMesh>
    );
}

/** Kjøletårnet til et kjernekraftverk, som vokser opp sammen med solcellene. */
function Kjernekraft({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const profil = useMemo(
        () =>
            Array.from({ length: 12 }, (_, i) => {
                const y = (i / 11) * 9;
                const r = 3.2 - Math.sin((i / 11) * Math.PI) * 1.2 - (i / 11) * 0.4;
                return new THREE.Vector2(r, y);
            }),
        []
    );
    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 1.6, dt);
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[-32, 0, -12]} scale={[1, synlig ? 1 : 0.001, 1]}>
            <mesh>
                <latheGeometry args={[profil, 24]} />
                <meshStandardMaterial color="#e5e7eb" side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[5, 1.5, 0]}>
                <boxGeometry args={[4, 3, 4]} />
                <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[5, 3.4, 0]}>
                <sphereGeometry args={[1.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
        </group>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const { camera } = useThree();
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const kamSe = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const himmel = useRef<THREE.Color>(null);
    const fogRef = useRef<THREE.Fog>(null);
    const sol = useRef<THREE.MeshBasicMaterial>(null);

    const farger = useMemo(() => {
        if (modus === 'eiere') return { fra: '#e9dcc0', til: '#e9dcc0' };
        if (modus === 'ventil') return { fra: '#f3c48d', til: '#f3c48d' };
        return { fra: '#f2dcae', til: '#f08a5d' };
    }, [modus]);
    const fra = useMemo(() => new THREE.Color(farger.fra), [farger]);
    const til = useMemo(() => new THREE.Color(farger.til), [farger]);
    const varme = useRef(0);

    useFrame((_, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const t = beatTid.current;

        varme.current = damp(varme.current, modus === 'klima' && beat >= 1 ? 1 : 0, 0.8, dt);
        himmel.current?.copy(fra).lerp(til, varme.current);
        fogRef.current?.color.copy(fra).lerp(til, varme.current);
        sol.current?.color.set('#fde68a').lerp(new THREE.Color('#ef4444'), varme.current);

        const mål = kamera(modus, beat, t);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        forste.current = false;
        camera.position.lerp(mål.pos, k);
        kamSe.current.lerp(mål.se, k);
        camera.lookAt(kamSe.current);
    });

    const pumper =
        modus === 'eiere' || modus === 'klima' || (modus === 'ventil' && beat <= 2);
    const apen = modus !== 'ventil' || beat < 2;
    const harRor = modus !== 'klima';
    const harSkip = modus !== 'klima';

    return (
        <>
            <color ref={himmel} attach="background" args={[farger.fra]} />
            <fog ref={fogRef} attach="fog" args={[farger.fra, 90, 260]} />
            <ambientLight intensity={0.75} />
            <directionalLight position={[40, 60, 30]} intensity={1.5} color="#fff3d6" />
            <hemisphereLight args={['#fef3c7', '#78350f', 0.4]} />

            <mesh position={[-40, 38, -160]}>
                <sphereGeometry args={[11, 24, 16]} />
                <meshBasicMaterial ref={sol} color="#fde68a" fog={false} />
            </mesh>

            {/* Sand og sanddyner */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[170, 0, 0]}>
                <planeGeometry args={[400, 600]} />
                <meshStandardMaterial color="#e0be82" emissive="#5b3a12" emissiveIntensity={0.12} />
            </mesh>
            {[
                [45, -30, 14],
                [60, 20, 18],
                [10, -45, 16],
                [-10, 40, 12],
            ].map(([x, z, r]) => (
                <mesh key={`${x}${z}`} position={[x, -r * 0.82, z]} scale={[1.6, 1, 1]}>
                    <sphereGeometry args={[r, 20, 12]} />
                    <meshStandardMaterial color="#d6ad6c" />
                </mesh>
            ))}
            {/* Havet ved kaia */}
            {harSkip && (
                <>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-130, -0.05, 0]}>
                        <planeGeometry args={[200, 600]} />
                        <meshStandardMaterial color="#1d6fa5" emissive="#0c4a6e" emissiveIntensity={0.35} />
                    </mesh>
                    <mesh position={[-33.5, 0.5, 0]}>
                        <boxGeometry args={[5, 1, 3.4]} />
                        <meshStandardMaterial color="#78716c" />
                    </mesh>
                    <Tankskip
                        seiler={modus === 'eiere' && beat >= 3}
                        playing={playing}
                        gull={modus === 'eiere' && beat >= 2}
                    />
                </>
            )}

            {TARN.map(([x, z]) => (
                <Boretarn
                    key={x}
                    x={x}
                    z={z}
                    pumper={pumper}
                    playing={playing}
                    gammel={modus === 'eiere'}
                />
            ))}

            {harRor && (
                <>
                    {TARN.map(([x, z]) => (
                        <Ror key={x} a={v(x + 3.2, 0.6, z)} b={v(ROR_START + 0.6, 1, 0)} r={0.3} />
                    ))}
                    <Ror a={v(ROR_START + 0.6, 1, 0)} b={v(ROR_SLUTT, 1, 0)} glass />
                    {[-14, 8].map((x) => (
                        <mesh key={x} position={[x, 0.3, 0]}>
                            <boxGeometry args={[0.5, 0.6, 1.4]} />
                            <meshStandardMaterial color="#57534e" />
                        </mesh>
                    ))}
                    <Olje apen={apen} flyter={modus !== 'ventil' || beat <= 3} playing={playing} />
                    {modus === 'ventil' && <Ventil stengt={!apen} playing={playing} />}
                </>
            )}

            {modus === 'eiere' && <Arbeidere playing={playing} />}
            {modus === 'klima' && (
                <>
                    <Kraftverk playing={playing} />
                    <Dam torr={beat >= 2} playing={playing} />
                    <Solceller synlig={beat >= 4} playing={playing} />
                    <Kjernekraft synlig={beat >= 4} playing={playing} />
                </>
            )}
        </>
    );
}

const MERKER: Record<Modus, (string | null)[]> = {
    ventil: [
        'Oktober 1973',
        'Olje til Europa og USA',
        'Ventilen skrus igjen',
        'Eksport til USA og Nederland: stanset',
        'Oljen er der fortsatt',
    ],
    eiere: [
        'Hvem eier oljen?',
        'Britiske og amerikanske selskaper bestemmer',
        'Anglo-Persian Oil Company → BP',
        null,
    ],
    klima: [
        'Klimaendringer',
        null,
        'Tørke og mangel på vann',
        'Saudi-Arabia: all strøm fra olje og gass',
        'Planer: sol og kjernekraft',
    ],
};

export function OljeFelt({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ventil';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = MERKER[modus];
    const merke = merker[Math.min(beat, merker.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.5, far: 600, position: [44, 10, 28] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                {merke && (
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`absolute top-[8%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl font-display font-bold text-3xl shadow-xl whitespace-nowrap ${
                            (modus === 'ventil' && beat >= 2 && beat <= 3)
                                ? 'bg-red-600/95 text-white'
                                : 'bg-white/90 text-slate-900'
                        }`}
                    >
                        {merke}
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'eiere' && beat >= 3 && (
                <div className="absolute top-[8%] inset-x-0 flex justify-center gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-2xl shadow-xl"
                    >
                        Arbeidet: iranske arbeidere
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.5 }}
                        className="px-5 py-2 rounded-2xl bg-amber-400/95 text-slate-900 font-display font-bold text-2xl shadow-xl"
                    >
                        Pengene: til den britiske staten
                    </motion.div>
                </div>
            )}
            {modus === 'klima' && beat === 1 && <Termometer />}
        </div>
    );
}

function Termometer() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-[6%] top-[12%] bottom-[12%] w-24 flex flex-col items-center"
        >
            <div className="relative flex-1 w-8 rounded-full bg-white/90 shadow-xl overflow-hidden border-4 border-white">
                <motion.div
                    initial={{ height: '45%' }}
                    animate={{ height: '92%' }}
                    transition={{ duration: 4, ease: 'easeInOut' }}
                    className="absolute bottom-0 inset-x-0 bg-red-600"
                />
            </div>
            <div className="mt-2 w-14 h-14 -translate-y-4 rounded-full bg-red-600 border-4 border-white shadow-xl" />
            <div className="px-3 py-1 rounded-xl bg-white/90 font-display font-bold text-lg text-slate-900 text-center">
                Varmere
            </div>
        </motion.div>
    );
}
