import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * Stormaktene som åser i et landskap. «stafett»: kronen går fra Nederland til
 * Storbritannia til USA, og en grå ås vokser fram. «faser»: én stor bue med sju
 * stolper, og en kule som ruller gjennom fasene. «fall»: kula ruller ned mens boblene
 * sprekker. «utfordrer»: en ny ås vokser, den gamle synker, og kronen bytter eier.
 * Alt styres av (beat, beatTid), så bildet tåler at eleven hopper.
 */

type Modus = 'stafett' | 'faser' | 'fall' | 'utfordrer';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const OVERSKRIFT: Record<Modus, string[]> = {
    stafett: [
        'Nederland på 1600-tallet',
        'Storbritannia tar over',
        'Ro i det britiske riket',
        'USAs tur',
        'En ny utfordrer?',
    ],
    faser: [
        'Den store buen',
        'Fase 1: fred og arbeid',
        'Fase 2: lån og bobler',
        'Fase 3 og 4: krise og pengetrykking',
        'Fase 5, 6 og 7: strid, gjeld og krig',
    ],
    fall: ['Boblene sprekker', 'Finanskrise', 'Prisene stiger', 'Fare for borgerkrig'],
    utfordrer: [
        'En ny utfordrer vokser',
        'Det farligste punktet',
        'Vestromerrikets fall',
        'Syklusen begynner på nytt',
    ],
};

/** Ås-profil: en jevn bue med høyde h og bredde b. */
function bue(x: number, h: number, b: number) {
    return h * Math.exp(-((x / b) ** 2));
}

/** Den store buen i «faser» og «fall». Halvbredde i x. */
const STOR_H = 15;
const STOR_B = 17;
const STOR_X = 34;

/** Hvor fasene ligger langs den store buen (x). */
const FASE_X = [-15, -3, 5, 10, 15, 21, 27];

/** Hvor kula skal være ved slutten av hver beat, og hvor den starter. */
function kulaFor(modus: Modus, beat: number): [number, number] {
    if (modus === 'faser') {
        switch (beat) {
            case 0:
                return [-30, -30];
            case 1:
                return [-30, FASE_X[0]];
            case 2:
                return [FASE_X[0], FASE_X[1]];
            case 3:
                return [FASE_X[1], FASE_X[3]];
            default:
                return [FASE_X[3], FASE_X[6]];
        }
    }
    switch (beat) {
        case 0:
            return [FASE_X[1], FASE_X[2]];
        case 1:
            return [FASE_X[2], FASE_X[3]];
        case 2:
            return [FASE_X[3], FASE_X[4]];
        default:
            return [FASE_X[4], FASE_X[5]];
    }
}

const mat = {
    bakke: new THREE.MeshStandardMaterial({ color: '#d9e6c3', emissive: '#55603f', emissiveIntensity: 0.25, roughness: 1 }),
    nl: new THREE.MeshStandardMaterial({ color: '#f97316', emissive: '#7c2d12', emissiveIntensity: 0.25, flatShading: true }),
    uk: new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.25, flatShading: true }),
    us: new THREE.MeshStandardMaterial({ color: '#2563eb', emissive: '#1e3a8a', emissiveIntensity: 0.25, flatShading: true }),
    ny: new THREE.MeshStandardMaterial({ color: '#94a3b8', emissive: '#334155', emissiveIntensity: 0.25, flatShading: true }),
    stor: new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#713f12', emissiveIntensity: 0.3, flatShading: true }),
    hvit: new THREE.MeshStandardMaterial({ color: '#f8fafc', flatShading: true }),
    tre: new THREE.MeshStandardMaterial({ color: '#7c4a21', flatShading: true }),
    murstein: new THREE.MeshStandardMaterial({ color: '#7f1d1d', flatShading: true }),
    glass: new THREE.MeshStandardMaterial({ color: '#bfdbfe', emissive: '#1e40af', emissiveIntensity: 0.25, flatShading: true }),
    gull: new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#a16207', emissiveIntensity: 0.6, metalness: 0.3, roughness: 0.3, flatShading: true }),
    stolpe: new THREE.MeshStandardMaterial({ color: '#334155', flatShading: true }),
    flagg: new THREE.MeshStandardMaterial({ color: '#f8fafc', side: THREE.DoubleSide, flatShading: true }),
    flaggAktiv: new THREE.MeshStandardMaterial({ color: '#dc2626', side: THREE.DoubleSide, flatShading: true }),
    boble: new THREE.MeshStandardMaterial({ color: '#f9a8d4', emissive: '#9d174d', emissiveIntensity: 0.3, transparent: true, opacity: 0.75 }),
};

/** En ås av en profil som er trukket ut i dybden. */
function useAs(h: number, b: number, halv: number) {
    return useMemo(() => {
        const s = new THREE.Shape();
        const n = 64;
        s.moveTo(-halv, 0);
        for (let i = 0; i <= n; i++) {
            const x = -halv + (2 * halv * i) / n;
            s.lineTo(x, bue(x, h, b));
        }
        s.lineTo(halv, 0);
        s.closePath();
        const g = new THREE.ExtrudeGeometry(s, { depth: 8, bevelEnabled: false, steps: 1 });
        g.translate(0, 0, -4);
        return g;
    }, [h, b, halv]);
}

/** En ås som kan vokse og synke (høyden skaleres mot et mål). */
function As({ x, h, b, halv, materiale, skala }: { x: number; h: number; b: number; halv: number; materiale: THREE.Material; skala: number }) {
    const g = useAs(h, b, halv);
    const ref = useRef<THREE.Mesh>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        if (forste.current) {
            m.scale.y = skala;
            forste.current = false;
        }
        m.scale.y = damp(m.scale.y, skala, 1.2, Math.min(rawDt, 0.05));
    });
    return <mesh ref={ref} geometry={g} material={materiale} position={[x, 0, 0]} />;
}

function Vindmolle({ x, y }: { x: number; y: number }) {
    const vinger = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (vinger.current) vinger.current.rotation.z -= Math.min(dt, 0.05) * 0.8;
    });
    return (
        <group position={[x, y, 0]}>
            <mesh material={mat.hvit} position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.7, 1.1, 3.2, 8]} />
            </mesh>
            <mesh material={mat.tre} position={[0, 3.6, 0]}>
                <coneGeometry args={[0.95, 1.2, 8]} />
            </mesh>
            <group ref={vinger} position={[0, 3, 1.15]}>
                {[0, 1, 2, 3].map((i) => (
                    <mesh key={i} material={mat.tre} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]}>
                        <boxGeometry args={[0.35, 5, 0.08]} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

function Fabrikk({ x, y }: { x: number; y: number }) {
    return (
        <group position={[x, y, 0]}>
            <mesh material={mat.murstein} position={[0, 1, 0]}>
                <boxGeometry args={[4, 2, 2.4]} />
            </mesh>
            {[-1.1, 0.4].map((cx) => (
                <mesh key={cx} material={mat.murstein} position={[cx, 3, -0.4]}>
                    <cylinderGeometry args={[0.32, 0.4, 4, 8]} />
                </mesh>
            ))}
        </group>
    );
}

function Skyskraper({ x, y }: { x: number; y: number }) {
    return (
        <group position={[x, y, 0]}>
            <mesh material={mat.glass} position={[0, 3, 0]}>
                <boxGeometry args={[1.8, 6, 1.8]} />
            </mesh>
            <mesh material={mat.glass} position={[-1.7, 1.8, 0.3]}>
                <boxGeometry args={[1.4, 3.6, 1.4]} />
            </mesh>
            <mesh material={mat.glass} position={[1.6, 2.2, -0.2]}>
                <boxGeometry args={[1.2, 4.4, 1.2]} />
            </mesh>
            <mesh material={mat.stolpe} position={[0, 6.8, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 1.6, 4]} />
            </mesh>
        </group>
    );
}

/** Kronen: hvem som står på toppen. Glir mot målet og snurrer sakte. */
function Krone({ mal, playing }: { mal: THREE.Vector3; playing: boolean }) {
    const g = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame(({ clock }, rawDt) => {
        const gr = g.current;
        if (!gr) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (forste.current) {
            gr.position.copy(mal);
            forste.current = false;
        }
        gr.position.x = damp(gr.position.x, mal.x, 1.6, dt);
        gr.position.z = damp(gr.position.z, mal.z, 1.6, dt);
        // Hopper i en bue mellom åsene.
        const avstand = Math.abs(gr.position.x - mal.x);
        gr.position.y = damp(gr.position.y, mal.y + Math.min(avstand, 12) * 0.5, 3, dt);
        gr.rotation.y = clock.elapsedTime * 0.6;
    });
    return (
        <group ref={g}>
            <mesh material={mat.gull}>
                <cylinderGeometry args={[1.5, 1.3, 0.9, 12, 1, true]} />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI * 2;
                return (
                    <mesh key={i} material={mat.gull} position={[Math.cos(a) * 1.4, 1, Math.sin(a) * 1.4]}>
                        <coneGeometry args={[0.32, 1.2, 5]} />
                    </mesh>
                );
            })}
        </group>
    );
}

/** Kula som ruller langs den store buen fra start til mål i løpet av beaten. */
function Kule({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const x = useRef<number | null>(null);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const [fra, til] = kulaFor(modus, beat);
        const p = THREE.MathUtils.smoothstep(tid.current, 0.3, 4.5);
        const mal = fra + (til - fra) * p;
        if (x.current === null) x.current = mal;
        x.current = damp(x.current, mal, 3, Math.max(dt, 0.001));
        m.position.set(x.current, bue(x.current, STOR_H, STOR_B) + 1.1, 2.2);
        m.rotation.z = -x.current / 1.1;
    });
    return (
        <mesh ref={ref} material={mat.gull}>
            <icosahedronGeometry args={[1.1, 1]} />
        </mesh>
    );
}

/** Stolpene med fasenummer. Den aktive har rødt flagg. */
function Stolper({ aktive }: { aktive: number[] }) {
    return (
        <>
            {FASE_X.map((x, i) => {
                const y = bue(x, STOR_H, STOR_B);
                const pa = aktive.includes(i);
                return (
                    <group key={i} position={[x, y, -1.5]}>
                        <mesh material={mat.stolpe} position={[0, 2, 0]}>
                            <cylinderGeometry args={[0.1, 0.1, 4, 5]} />
                        </mesh>
                        <mesh material={pa ? mat.flaggAktiv : mat.flagg} position={[0.8, 3.4, 0]}>
                            <planeGeometry args={[1.6, 1.1]} />
                        </mesh>
                        <Html position={[0, 5.4, 0]} center zIndexRange={[10, 0]}>
                            <div
                                className={`rounded-full font-black text-xl flex items-center justify-center shadow ${pa ? 'bg-red-600 text-white' : 'bg-white/90 text-slate-700'}`}
                                style={{ width: 38, height: 38 }}
                            >
                                {i + 1}
                            </div>
                        </Html>
                    </group>
                );
            })}
        </>
    );
}

/** Bobler som blåses opp og sprekker rundt kula (modus «fall», beat 0). */
function Bobler({ beat, playing }: { beat: number; playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const PLASS: [number, number, number][] = [
        [1, 19, 3],
        [8, 18, 2],
        [12, 14, 3],
        [4, 23, 1],
        [10, 22, 2],
    ];
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        refs.current.forEach((m, i) => {
            if (!m) return;
            if (beat > 0) {
                m.visible = false;
                return;
            }
            // Hver boble vokser, og sprekker på sitt eget tidspunkt.
            const sprekk = 3 + i * 1.1;
            const t = tid.current;
            m.visible = t < sprekk;
            m.scale.setScalar(0.4 + Math.min(t / sprekk, 1) * 1.6);
        });
    });
    return (
        <>
            {PLASS.map(([x, y, z], i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                    material={mat.boble}
                    position={[x, y, z]}
                >
                    <sphereGeometry args={[1.2, 14, 10]} />
                </mesh>
            ))}
        </>
    );
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

/** Åsene i «stafett»: x-plassering og toppen. */
const STAFETT = {
    nl: { x: -33, h: 9 },
    uk: { x: -11, h: 12 },
    us: { x: 11, h: 14 },
    ny: { x: 32, h: 11 },
};

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'stafett') {
        switch (beat) {
            case 0:
                return { pos: v(-24 - t * 0.3, 12, 36), se: v(-31, 9, 0) };
            case 1:
                return { pos: v(-20, 16, 48), se: v(-20, 9, 0) };
            case 2:
                return { pos: v(-6 - t * 0.3, 13, 38), se: v(-11, 9, 0) };
            case 3:
                return { pos: v(2, 17, 52), se: v(2, 10, 0) };
            default:
                return { pos: v(0, 20 + t * 0.2, 66), se: v(0, 7, 0) };
        }
    }
    if (modus === 'utfordrer') {
        switch (beat) {
            case 0:
                return { pos: v(10, 16, 54), se: v(8, 7, 0) };
            case 1:
                return { pos: v(6 - t * 0.3, 14, 40), se: v(6, 9, 0) };
            case 2:
                return { pos: v(4, 14, 56), se: v(4, 5, 0) };
            default:
                return { pos: v(8 + t * 0.3, 15, 54), se: v(8, 6, 0) };
        }
    }
    if (modus === 'faser') {
        switch (beat) {
            case 0:
                return { pos: v(-4 + t * 0.3, 18, 68), se: v(0, 7, 0) };
            case 1:
                return { pos: v(-12, 12, 52), se: v(-8, 8, 0) };
            case 2:
                return { pos: v(-2, 14, 54), se: v(-1, 9, 0) };
            case 3:
                return { pos: v(8, 13, 54), se: v(8, 8, 0) };
            default:
                return { pos: v(10, 17, 58), se: v(10, 6, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(4, 16, 54), se: v(5, 11, 0) };
        case 1:
            return { pos: v(8, 14, 54), se: v(8, 8, 0) };
        case 2:
            return { pos: v(12, 13, 54), se: v(12, 7, 0) };
        default:
            return { pos: v(14 + t * 0.3, 12, 56), se: v(14, 6, 0) };
    }
}

function KameraStyring({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kameraFor(modus, beat, beatTid.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.3 * dt);
        if (forste.current) se.current.copy(m.se);
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

/** Navn under hver ås i «stafett». */
function Navn({ x, tekst, farge }: { x: number; tekst: string; farge: string }) {
    return (
        <Html position={[x, -0.5, 4.5]} center zIndexRange={[10, 0]}>
            <div className="px-3 py-1 rounded-xl bg-white/95 shadow-lg font-black text-xl whitespace-nowrap" style={{ color: farge, borderBottom: `4px solid ${farge}` }}>
                {tekst}
            </div>
        </Html>
    );
}

function StafettScene({ beat, playing }: { beat: number; playing: boolean }) {
    const { nl, uk, us, ny } = STAFETT;
    const krone = beat === 0 ? v(nl.x, nl.h + 6.5, 0) : beat <= 2 ? v(uk.x, uk.h + 6, 0) : v(us.x, us.h + 8.5, 0);
    return (
        <>
            <As x={nl.x} h={nl.h} b={7} halv={11} materiale={mat.nl} skala={1} />
            <As x={uk.x} h={uk.h} b={7} halv={11} materiale={mat.uk} skala={beat >= 1 ? 1 : 0.35} />
            <As x={us.x} h={us.h} b={7} halv={11} materiale={mat.us} skala={beat >= 3 ? 1 : 0.3} />
            <As x={ny.x} h={ny.h} b={7} halv={11} materiale={mat.ny} skala={beat >= 4 ? 1 : 0.15} />
            <Vindmolle x={nl.x - 1} y={nl.h - 0.4} />
            {beat >= 1 && <Fabrikk x={uk.x} y={uk.h - 0.3} />}
            {beat >= 3 && <Skyskraper x={us.x} y={us.h - 0.3} />}
            <Krone mal={krone} playing={playing} />
            {(beat === 0 || beat === 4) && <Navn x={nl.x} tekst="Nederland" farge="#c2410c" />}
            {beat >= 1 && beat !== 3 && <Navn x={uk.x} tekst="Storbritannia" farge="#b91c1c" />}
            {beat >= 3 && <Navn x={us.x} tekst="USA" farge="#1d4ed8" />}
            {beat >= 4 && <Navn x={ny.x} tekst="?" farge="#475569" />}
        </>
    );
}

function StorBue({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const aktive =
        modus === 'faser'
            ? beat === 0
                ? []
                : beat === 1
                  ? [0]
                  : beat === 2
                    ? [1]
                    : beat === 3
                      ? [2, 3]
                      : [4, 5, 6]
            : beat === 0
              ? [2]
              : beat === 1
                ? [2]
                : beat === 2
                  ? [3]
                  : [4];
    return (
        <>
            <As x={0} h={STOR_H} b={STOR_B} halv={STOR_X} materiale={modus === 'fall' ? mat.us : mat.stor} skala={1} />
            <Stolper aktive={aktive} />
            <Kule modus={modus} beat={beat} playing={playing} />
            {modus === 'fall' && <Bobler beat={beat} playing={playing} />}
        </>
    );
}

function UtfordrerScene({ beat, playing }: { beat: number; playing: boolean }) {
    const krone = beat === 0 ? v(-10, 12.5, 0) : beat <= 2 ? v(4, 13, 0) : v(18, 15.5, 0);
    return (
        <>
            <As x={-10} h={13} b={8} halv={14} materiale={mat.us} skala={beat >= 2 ? 0.45 : 0.75} />
            <As x={18} h={13} b={8} halv={14} materiale={mat.ny} skala={beat === 0 ? 0.7 : 1} />
            <Krone mal={krone} playing={playing} />
            {beat === 1 && <Kollisjon playing={playing} />}
            {beat === 1 && (
                <Html position={[4, 3, 2]} center zIndexRange={[10, 0]}>
                    <div className="px-3 py-1 rounded-xl bg-red-600 text-white shadow-lg font-black text-xl whitespace-nowrap">Hvem setter reglene?</div>
                </Html>
            )}
            <Navn x={-10} tekst={beat === 2 ? 'Vestromerriket' : 'Den gamle stormakten'} farge="#1d4ed8" />
            <Navn x={18} tekst={beat === 2 ? 'Nye krefter' : 'Utfordreren'} farge="#475569" />
        </>
    );
}

/** Et rødt, pulserende lys der åsene møtes. */
function Kollisjon({ playing }: { playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const t = useRef(0);
    useFrame((_, rawDt) => {
        t.current += playing ? Math.min(rawDt, 0.05) : 0;
        if (ref.current) ref.current.scale.setScalar(1 + 0.35 * Math.sin(t.current * 5));
    });
    return (
        <mesh ref={ref} position={[4, 6, 1]}>
            <icosahedronGeometry args={[1.6, 0]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
        </mesh>
    );
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const morkt = modus === 'fall';
    return (
        <>
            <color attach="background" args={[morkt ? '#94a3b8' : '#cfe6f5']} />
            <fog attach="fog" args={[morkt ? '#a3afbf' : '#e3f0f8', 70, 170]} />
            <hemisphereLight args={['#ffffff', '#8a9a6a', morkt ? 0.9 : 1.15]} />
            <directionalLight position={[20, 40, 30]} intensity={1.4} />
            <mesh material={mat.bakke} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[300, 160]} />
            </mesh>
            {modus === 'stafett' && <StafettScene beat={beat} playing={playing} />}
            {(modus === 'faser' || modus === 'fall') && <StorBue modus={modus} beat={beat} playing={playing} />}
            {modus === 'utfordrer' && <UtfordrerScene beat={beat} playing={playing} />}
            <KameraStyring modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function StoreSykluserBakken({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'stafett';
    const dpr = useMemo<[number, number]>(() => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]), []);
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas resize={{ offsetSize: true }} dpr={dpr} camera={{ fov: 42, position: [0, 18, 60] }}>
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
