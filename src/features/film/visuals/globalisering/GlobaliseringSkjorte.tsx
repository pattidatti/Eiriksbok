import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Overskrift, Skilt } from './felles';
import { damp, tekstFor, useKamera, v } from './felles3d';

/**
 * T-skjorta i 3D, i fire moduser.
 *
 * «lapp»: skjorta snur seg, og vi ser lappen i nakken (beat 1). Beat 2: kameraet trekker seg
 * ut, og en prikkete bue viser reisen fra fabrikken. Beat 3: en prislapp henger på ermet.
 *
 * «pris»: prislappen viser dollar (beat 0) og kroner (beat 1). Beat 2: to søyler, prisen for
 * 25 år siden og i dag, der dagens er omtrent halvparten.
 *
 * «deling»: skjorta deles i felt etter hvem som får pengene. Syerskene får en bitteliten
 * flik ytterst på ermet (beat 2), butikken det meste (beat 3), resten midt på (beat 4).
 * Beat 5: fliken til syerskene blir bredere, og resten av skjorta er nesten lik.
 *
 * «press»: en presse senker seg over skjorta (beat 0), og fliken til syerskene krymper (beat 1).
 */

type Modus = 'lapp' | 'pris' | 'deling' | 'press';

const DYBDE = 0.35;
/** Skjorta går fra x = -BREDDE/2 til x = BREDDE/2 (med kanten rundt). */
const BREDDE = 5.52;
const VENSTRE = -BREDDE / 2;

const GRA = '#cbd5e1';
const ROD = '#dc2626';
const BLA = '#2563eb';
const GUL = '#f59e0b';

function skjorteForm() {
    const s = new THREE.Shape();
    s.moveTo(-0.55, 2.0);
    s.lineTo(-1.6, 1.75);
    s.lineTo(-2.7, 0.9);
    s.lineTo(-2.15, 0.25);
    s.lineTo(-1.5, 0.75);
    s.lineTo(-1.5, -2.0);
    s.lineTo(1.5, -2.0);
    s.lineTo(1.5, 0.75);
    s.lineTo(2.15, 0.25);
    s.lineTo(2.7, 0.9);
    s.lineTo(1.6, 1.75);
    s.lineTo(0.55, 2.0);
    s.quadraticCurveTo(0, 1.4, -0.55, 2.0);
    const g = new THREE.ExtrudeGeometry(s, {
        depth: DYBDE,
        bevelEnabled: true,
        bevelThickness: 0.07,
        bevelSize: 0.06,
        bevelSegments: 2,
    });
    g.translate(0, 0, -DYBDE / 2);
    return g;
}

/** Tekst på en liten flate (lappen og prislappen), tegnet på et lerret. */
function tekstFlate(linjer: { tekst: string; px: number }[], bakgrunn: string, farge: string) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 320;
    const ctx = c.getContext('2d');
    if (ctx) {
        ctx.fillStyle = bakgrunn;
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = farge;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const sum = linjer.reduce((m, l) => m + l.px * 1.2, 0);
        let y = (c.height - sum) / 2;
        for (const l of linjer) {
            ctx.font = `900 ${l.px}px Inter, Arial, sans-serif`;
            y += (l.px * 1.2) / 2;
            ctx.fillText(l.tekst, c.width / 2, y);
            y += (l.px * 1.2) / 2;
        }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'lapp') {
        if (beat === 0) return { pos: v(1.5 - t * 0.1, 0.8, 10.5), se: v(0, 0.2, 0) };
        if (beat === 1) return { pos: v(0.4, 2.0, 3.6), se: v(0, 1.45, 0) };
        if (beat === 2) return { pos: v(-4, 4, 22), se: v(-5, 0.5, 0) };
        return { pos: v(1.2, 0.4, 10), se: v(0.6, 0, 0) };
    }
    if (modus === 'pris') {
        if (beat <= 1) return { pos: v(1.4, 0.3, 10), se: v(0.8, 0, 0) };
        return { pos: v(0, 0, 15), se: v(0, -0.6, 0) };
    }
    if (modus === 'press') return { pos: v(0, 0.8, 12.5), se: v(0, 0.3, 0) };
    // deling
    if (beat === 2) return { pos: v(-2.2, 1.1, 4.6), se: v(-2.2, 0.9, 0) };
    return { pos: v(0, 0.3, 10.5 + t * 0.05), se: v(0, 0, 0) };
}

/** Bredden på feltene som andel av skjorta: [syerskene, resten, butikken]. */
function andelerFor(modus: Modus, beat: number): [number, number, number] {
    if (modus === 'press') return beat >= 1 ? [0.004, 0.396, 0.6] : [0.01, 0.39, 0.6];
    if (beat >= 5) return [0.035, 0.365, 0.6];
    return [0.01, 0.39, 0.6];
}

function fargerFor(modus: Modus, beat: number): [string, string, string] {
    if (modus === 'press') return [ROD, GUL, BLA];
    return [beat >= 2 ? ROD : GRA, beat >= 4 ? GUL : GRA, beat >= 3 ? BLA : GRA];
}

function Scene({
    modus,
    beat,
    playing,
    merker,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    merker: string[];
}) {
    useKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    const geo = useMemo(() => skjorteForm(), []);
    const lappTekst = useMemo(
        () =>
            tekstFlate(
                [
                    { tekst: 'MADE IN', px: 56 },
                    { tekst: 'BANGLADESH', px: 64 },
                ],
                '#ffffff',
                '#0f172a'
            ),
        []
    );
    const prisTekster = useMemo(
        () => [
            tekstFlate([{ tekst: 'kr', px: 180 }], '#fde68a', '#0f172a'),
            tekstFlate(
                [
                    { tekst: '2,06', px: 150 },
                    { tekst: 'dollar', px: 70 },
                ],
                '#fde68a',
                '#0f172a'
            ),
            tekstFlate(
                [
                    { tekst: 'ca. 20', px: 140 },
                    { tekst: 'kroner', px: 70 },
                ],
                '#fde68a',
                '#0f172a'
            ),
        ],
        []
    );

    const skjorte = useRef<THREE.Group>(null);
    const spokelse = useRef<THREE.Group>(null);
    const lapp = useRef<THREE.Mesh>(null);
    const prislapp = useRef<THREE.Group>(null);
    const prisMat = useRef<THREE.MeshBasicMaterial>(null);
    const presse = useRef<THREE.Mesh>(null);
    const soyler = useRef<(THREE.Mesh | null)[]>([]);
    const prikker = useRef<THREE.InstancedMesh>(null);
    const feltMat = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
    // Klippeplanene som deler skjorta i felt: [nedre, øvre] per felt.
    const plan = useRef(
        Array.from({ length: 3 }, () => [
            new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
            new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
        ])
    );
    const kant = useRef<[number, number]>([0.01, 0.4]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const o = useMemo(() => new THREE.Object3D(), []);
    const farge = useMemo(() => new THREE.Color(), []);

    const ANTALL_PRIKKER = 46;
    const bue = useMemo(
        () => new THREE.QuadraticBezierCurve3(v(-14, -1.5, -3), v(-7, 7, -2), v(-0.5, 0.2, 0)),
        []
    );

    const delt = modus === 'deling' || modus === 'press';

    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const t = tid.current;
        const k = forste.current;
        const glid = (x: number, mål: number, l = 3) => (k ? mål : damp(x, mål, l, dt));

        const s = skjorte.current;
        if (s) {
            let rot = 0;
            let x = 0;
            let y = 0;
            let skala = 1;
            let skalaY = 1;
            if (modus === 'lapp') {
                rot = beat === 0 ? -0.35 + Math.sin(t * 0.5) * 0.3 : beat === 1 ? Math.PI : 0;
            } else if (modus === 'pris') {
                rot = -0.15;
                if (beat >= 2) {
                    x = 3.4;
                    y = 1.6;
                    skala = 0.62;
                    rot = 0;
                }
            } else if (modus === 'press') {
                skalaY = beat >= 1 ? 0.7 : 0.86;
                y = -0.25;
            }
            s.rotation.y = glid(s.rotation.y, rot, 2.2);
            s.position.x = glid(s.position.x, x, 2.5);
            s.position.y = glid(s.position.y, y, 2.5);
            const sk = glid(s.scale.x, skala, 2.5);
            s.scale.set(sk, glid(s.scale.y, skala * skalaY, 2.5), sk);
        }

        if (spokelse.current) {
            const vis = modus === 'pris' && beat >= 2;
            const sk = glid(spokelse.current.scale.x, vis ? 0.62 : 0.001, 3);
            spokelse.current.scale.setScalar(Math.max(sk, 0.001));
            spokelse.current.visible = sk > 0.02;
        }

        if (lapp.current) lapp.current.visible = modus === 'lapp';

        if (prislapp.current) {
            const vis =
                (modus === 'lapp' && beat === 3) ||
                (modus === 'pris' && beat <= 1) ||
                (modus === 'deling' && beat <= 1);
            const sk = glid(prislapp.current.scale.x, vis ? 1 : 0.001, 4);
            prislapp.current.scale.setScalar(Math.max(sk, 0.001));
            prislapp.current.visible = sk > 0.02;
            prislapp.current.rotation.z = Math.sin(t * 1.4) * 0.06;
        }
        if (prisMat.current) {
            const i = modus === 'pris' ? (beat === 0 ? 1 : 2) : 0;
            if (prisMat.current.map !== prisTekster[i]) {
                prisMat.current.map = prisTekster[i];
                prisMat.current.needsUpdate = true;
            }
        }

        if (presse.current) {
            const ned = modus === 'press';
            // Pressen ligger rett over skjorta, som klemmes flatere i beat 1.
            const mål = ned ? (beat >= 1 ? 1.5 : 1.82) + Math.sin(t * 1.2) * 0.03 : 9;
            presse.current.position.y = glid(presse.current.position.y, mål, 1.6);
            presse.current.visible = ned;
        }

        const hoyder = [2.4, 1.2];
        soyler.current.forEach((m, i) => {
            if (!m) return;
            const vis = modus === 'pris' && beat >= 2;
            const h = glid(m.scale.y, vis ? hoyder[i] : 0.001, i === 1 ? 2 : 2.6);
            m.scale.y = Math.max(h, 0.001);
            m.position.y = -3.6 + m.scale.y / 2;
            m.visible = m.scale.y > 0.02;
        });

        const p = prikker.current;
        if (p) {
            const vis = modus === 'lapp' && beat === 2;
            const antall = vis
                ? Math.min(ANTALL_PRIKKER, Math.floor(t * 14) + (k ? ANTALL_PRIKKER : 0))
                : 0;
            for (let i = 0; i < ANTALL_PRIKKER; i++) {
                const pt = bue.getPoint(i / (ANTALL_PRIKKER - 1));
                o.position.copy(pt);
                o.scale.setScalar(i < antall ? 1 : 0.001);
                o.updateMatrix();
                p.setMatrixAt(i, o.matrix);
            }
            p.instanceMatrix.needsUpdate = true;
            p.visible = vis;
        }

        if (delt) {
            const [a, b] = andelerFor(modus, beat);
            kant.current[0] = glid(kant.current[0], a, 2);
            kant.current[1] = glid(kant.current[1], a + b, 2);
            const x1 = VENSTRE + kant.current[0] * BREDDE;
            const x2 = VENSTRE + kant.current[1] * BREDDE;
            const grenser = [
                [VENSTRE - 1, x1],
                [x1, x2],
                [x2, -VENSTRE + 1],
            ];
            grenser.forEach(([lo, hi], i) => {
                plan.current[i][0].constant = -lo;
                plan.current[i][1].constant = hi;
            });
            const farger = fargerFor(modus, beat);
            feltMat.current.forEach((m, i) => {
                if (!m) return;
                farge.set(farger[i]);
                if (k) m.color.copy(farge);
                else m.color.lerp(farge, 1 - Math.exp(-4 * dt));
                m.emissive.copy(m.color);
                m.emissiveIntensity =
                    i === 0 && (modus === 'press' || beat >= 2)
                        ? 0.35 + Math.sin(t * 4) * 0.25
                        : 0.05;
            });
        }
        forste.current = false;
    });

    const syerskeX = VENSTRE + 0.1;
    return (
        <>
            <color attach="background" args={['#efe9df']} />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#ffffff', '#a8a29e', 0.6]} />
            <directionalLight position={[4, 6, 10]} intensity={1.4} />
            <directionalLight position={[-6, 3, -8]} intensity={0.6} />

            <group ref={skjorte}>
                {delt ? (
                    [0, 1, 2].map((i) => (
                        <mesh key={i} geometry={geo}>
                            <meshStandardMaterial
                                ref={(m) => {
                                    feltMat.current[i] = m;
                                    // Planene settes her, ikke som prop: refs leses ikke under render.
                                    if (m) m.clippingPlanes = plan.current[i];
                                }}
                                color={GRA}
                                flatShading
                            />
                        </mesh>
                    ))
                ) : (
                    <mesh geometry={geo}>
                        <meshStandardMaterial color="#0ea5e9" flatShading />
                    </mesh>
                )}
                {/* Lappen i nakken, på baksiden av skjorta. */}
                <mesh ref={lapp} position={[0, 1.45, -DYBDE / 2 - 0.09]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[0.8, 0.5]} />
                    <meshBasicMaterial map={lappTekst} />
                </mesh>
                {/* Prislappen henger i ermet. */}
                <group ref={prislapp} position={[2.25, 0.35, 0.3]} scale={0.001}>
                    <mesh position={[0.15, 0.45, 0]} rotation={[0, 0, 0.5]}>
                        <cylinderGeometry args={[0.015, 0.015, 0.7, 4]} />
                        <meshBasicMaterial color="#0f172a" />
                    </mesh>
                    <mesh position={[0.55, -0.35, 0.05]}>
                        <planeGeometry args={[1.6, 1.0]} />
                        <meshBasicMaterial ref={prisMat} map={prisTekster[0]} />
                    </mesh>
                </group>
            </group>

            {/* Samme skjorte for 25 år siden, blek. */}
            <group ref={spokelse} position={[-3.4, 1.6, 0]} scale={0.001}>
                <mesh geometry={geo}>
                    <meshStandardMaterial color="#94a3b8" transparent opacity={0.55} flatShading />
                </mesh>
            </group>
            {[-3.4, 3.4].map((x, i) => (
                <mesh
                    key={x}
                    ref={(m) => {
                        soyler.current[i] = m;
                    }}
                    position={[x, -3.6, 0]}
                    scale={[1, 0.001, 1]}
                >
                    <boxGeometry args={[1.8, 1, 0.8]} />
                    <meshStandardMaterial color={i === 0 ? '#64748b' : '#0ea5e9'} />
                </mesh>
            ))}

            {delt && (modus === 'press' || beat >= 2) && (
                <mesh
                    position={[
                        VENSTRE + 0.08,
                        modus === 'press' ? (beat >= 1 ? 0.38 : 0.52) : 0.9,
                        DYBDE / 2 + 0.15,
                    ]}
                >
                    <torusGeometry args={[0.38, 0.05, 8, 32]} />
                    <meshBasicMaterial color={ROD} />
                </mesh>
            )}
            <mesh ref={presse} position={[0, 9, 0]}>
                <boxGeometry args={[7.5, 0.6, 2.2]} />
                <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.5} />
            </mesh>

            <instancedMesh
                ref={prikker}
                args={[undefined, undefined, ANTALL_PRIKKER]}
                frustumCulled={false}
            >
                <sphereGeometry args={[0.16, 10, 8]} />
                <meshStandardMaterial color="#f97316" emissive="#f97316" emissiveIntensity={0.4} />
            </instancedMesh>
            {modus === 'lapp' && beat === 2 && (
                <>
                    <mesh position={[-14, -2.2, -3]}>
                        <boxGeometry args={[2.4, 1.4, 1.6]} />
                        <meshStandardMaterial color="#78716c" flatShading />
                    </mesh>
                    <Html position={[-14, -3.6, -3]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Fabrikken i Bangladesh" />
                    </Html>
                    <Html position={[0, -3.2, 0]} center zIndexRange={[10, 0]}>
                        <Skilt tekst="Butikken i Norge" />
                    </Html>
                </>
            )}

            {modus === 'pris' && beat >= 2 && (
                <>
                    <Html position={[-3.4, -4.25, 0]} center zIndexRange={[10, 0]}>
                        <Skilt tekst={merker[0] ?? ''} farge="#475569" />
                    </Html>
                    <Html position={[3.4, -4.25, 0]} center zIndexRange={[10, 0]}>
                        <Skilt tekst={merker[1] ?? ''} farge="#0369a1" />
                    </Html>
                </>
            )}

            {modus === 'deling' && beat >= 2 && (
                <Html position={[syerskeX, 1.75, 0.3]} center zIndexRange={[10, 0]}>
                    <Skilt tekst={`${merker[0] ?? ''} ▼`} farge={ROD} />
                </Html>
            )}
            {modus === 'deling' && beat >= 3 && (
                <Html position={[1.1, -1.2, 0.4]} center zIndexRange={[10, 0]}>
                    <Skilt tekst={merker[1] ?? ''} farge={BLA} />
                </Html>
            )}
            {modus === 'deling' && beat >= 4 && (
                <Html position={[-1.0, -1.2, 0.4]} center zIndexRange={[10, 0]}>
                    <Skilt tekst={merker[2] ?? ''} farge="#b45309" />
                </Html>
            )}
            {modus === 'deling' && beat === 1 && (
                <Html position={[-2.2, 1.6, 0.3]} center zIndexRange={[10, 0]}>
                    <div className="text-7xl font-black text-red-600">?</div>
                </Html>
            )}
            {modus === 'press' && beat >= 1 && (
                <Html position={[syerskeX, -0.5, 0.3]} center zIndexRange={[10, 0]}>
                    <Skilt tekst={`${merker[0] ?? ''} ▲`} farge={ROD} />
                </Html>
            )}
        </>
    );
}

export function GlobaliseringSkjorte({
    beat,
    playing,
    props,
}: VisualProps<{ modus?: Modus; tekster?: string[]; merker?: string[] }>) {
    const modus: Modus = props?.modus ?? 'lapp';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const tekst = tekstFor(props?.tekster, beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 40, near: 0.1, far: 120, position: [0, 0.5, 10] }}
                onCreated={({ gl }) => {
                    gl.localClippingEnabled = true;
                }}
            >
                <Scene modus={modus} beat={beat} playing={playing} merker={props?.merker ?? []} />
            </Canvas>
            <AnimatePresence mode="wait">
                {tekst && (
                    <Overskrift
                        key={`${modus}-${beat}`}
                        tekst={tekst}
                        tone={modus === 'deling' && beat === 2 ? 'rod' : 'lys'}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
