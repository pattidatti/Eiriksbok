import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { damp, useBeatKamera, useMerkelapper, v, type KameraMal, type Merkelapp } from './felles3d';

/**
 * Sjøslaget ved Actium i 3D. Odden ligger i nord, flåten til Antonius og Kleopatra langs
 * kysten, flåten til Octavius og Agrippa ute på havet. «for»: flåtene ligger klare. «slag»:
 * de går mot hverandre. «flukt»: Kleopatra flykter, Antonius følger etter, resten overgir seg.
 * Ingen mennesker i bildet, bare skip.
 */

type Modus = 'for' | 'slag' | 'flukt';
type Side = 'octavius' | 'antonius' | 'kleopatra';

interface Skip {
    side: Side;
    x: number;
    z: number;
    flagg?: boolean;
}

const SEIL: Record<Side, string> = {
    octavius: '#b91c1c',
    antonius: '#1d4ed8',
    kleopatra: '#7e22ce',
};
const HVIT = new THREE.Color('#f8fafc');

const FLATEN: Skip[] = [
    ...[-15, -10.5, -6, -1.5, 3, 7.5, 12, 16.5].map((x, i) => ({
        side: 'octavius' as const,
        x,
        z: 13,
        flagg: i === 4,
    })),
    ...[-13, -8.5, -4, 0.5, 5, 9.5].map((x, i) => ({
        side: 'antonius' as const,
        x,
        z: -11,
        flagg: i === 3,
    })),
    ...[-2, 2.5, 7, 11.5].map((x) => ({ side: 'kleopatra' as const, x, z: -18 })),
];

/** Hvor skipet skal være på denne beaten. `t` er sekunder i beaten. */
function malFor(s: Skip, modus: Modus, beat: number, t: number): [number, number, number] {
    // [x, z, kurs] - kurs i radianer rundt y.
    // Kurs 0 = baugen mot øst (+x). Octavius peker nordover mot fienden, Antonius sørover.
    const mot = s.side === 'octavius' ? Math.PI / 2 : -Math.PI / 2;
    if (modus === 'for') return [s.x, s.z, mot];
    if (modus === 'slag') {
        const naer = beat >= 2 ? 1 : beat >= 1 ? 0.55 : Math.min(t / 8, 0.4);
        // På beat 2 glir rekkene inn i hverandre: rød baug mellom blå skrog.
        if (s.side === 'octavius')
            return [
                s.x + 2.2 * naer,
                13 - 13.5 * naer,
                mot + (beat >= 2 ? Math.sin(s.x) * 0.5 : 0),
            ];
        if (s.side === 'antonius')
            return [s.x, -11 + 10 * naer, mot + (beat >= 2 ? Math.cos(s.x) * 0.4 : 0)];
        return [s.x, -18 + 5 * naer, mot];
    }
    // flukt: alt starter i slaget
    if (s.side === 'octavius') return [s.x + 1.2, 4, mot];
    if (s.side === 'antonius') {
        if (s.flagg && beat >= 1) return [kleoX(99) - 7, -11, 0];
        return [s.x, -3, mot];
    }
    return [s.x + kleoX(beat === 0 ? t : 99), s.x % 2 === 0 ? -13 : -15.5, 0];
}

/** Kleopatras skip seiler østover. Kameraet følger med samme funksjon. */
function kleoX(t: number) {
    return Math.min(t, 14) * 2.6;
}

function kameraFor(modus: Modus, beat: number, t: number): KameraMal {
    if (modus === 'for') {
        switch (beat) {
            case 0:
                return { pos: v(34 - t * 0.5, 14, 38), se: v(0, 0, -2) };
            case 1:
                return {
                    pos: v(-26 + Math.min(t, 10) * 1.8, 3.2, 4),
                    se: v(-8 + Math.min(t, 10) * 1.8, 1, 0),
                };
            case 2:
                return { pos: v(16, 5, -1), se: v(0, 1, -14) };
            case 3:
                return { pos: v(-14, 5, 27), se: v(2, 1, 13) };
            default:
                return { pos: v(0, 44, 30), se: v(0, 0, -1) };
        }
    }
    if (modus === 'slag') {
        switch (beat) {
            case 0:
                return { pos: v(-36, 12, 18), se: v(0, 0, 0) };
            case 1:
                return { pos: v(18, 5, 18), se: v(4, 1.5, 7) };
            default:
                return { pos: v(-14 + t * 0.5, 4, 10), se: v(2, 0.8, -1) };
        }
    }
    switch (beat) {
        case 0: {
            const x = kleoX(t) + 4;
            return { pos: v(x - 18, 9, 8), se: v(x, 0.5, -13) };
        }
        case 1: {
            const x = kleoX(99);
            return { pos: v(x - 26, 10, 10), se: v(x - 2, 0.5, -12) };
        }
        case 2:
            return { pos: v(-8, 9, 22), se: v(0, 0.5, -2) };
        default:
            return { pos: v(-27, 6, -12), se: v(-22, 2, -25) };
    }
}

function Galei({
    s,
    modus,
    beat,
    playing,
    gruppe,
}: {
    s: Skip;
    modus: Modus;
    beat: number;
    playing: boolean;
    gruppe: (g: THREE.Group | null) => void;
}) {
    const ref = useRef<THREE.Group | null>(null);
    const seil = useRef<THREE.MeshStandardMaterial>(null);
    const t = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const grunnfarge = useMemo(() => new THREE.Color(SEIL[s.side]), [s.side]);
    const fase = useMemo(() => s.x * 1.7 + s.z, [s.x, s.z]);
    useFrame((state, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            t.current = 0;
        }
        t.current += dt;
        const [x, z, kurs] = malFor(s, modus, beat, t.current);
        const k = forste.current ? 1 : 1 - Math.exp(-1.6 * dt);
        forste.current = false;
        g.position.x = THREE.MathUtils.lerp(g.position.x, x, k);
        g.position.z = THREE.MathUtils.lerp(g.position.z, z, k);
        g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, kurs, k);
        const tid = state.clock.elapsedTime;
        g.position.y = Math.sin(tid * 1.1 + fase) * 0.08;
        const krenger = modus === 'slag' && beat >= 2 ? 0.12 : 0.03;
        g.rotation.z = Math.sin(tid * 0.9 + fase) * krenger;
        // De som overgir seg, får hvite seil.
        const gir =
            modus === 'flukt' && beat >= 2 && s.side === 'antonius' && !(s.flagg && beat >= 1);
        if (seil.current) {
            seil.current.color.lerp(
                gir ? HVIT : grunnfarge,
                forste.current ? 1 : 1 - Math.exp(-2 * dt)
            );
        }
    });
    return (
        <group
            ref={(g) => {
                ref.current = g;
                gruppe(g);
            }}
            position={[s.x, 0, s.z]}
        >
            {/* Skroget peker langs x; baugen i +x */}
            <group rotation={[0, Math.PI / 2, 0]}>
                <mesh position={[0, 0.35, 0]}>
                    <boxGeometry args={[1.1, 0.7, 4.6]} />
                    <meshStandardMaterial color="#7c4a26" flatShading />
                </mesh>
                <mesh position={[0, 0.45, 2.75]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[0.55, 1.4, 4]} />
                    <meshStandardMaterial color="#5b3417" flatShading />
                </mesh>
                <mesh position={[0, 1, -2.2]}>
                    <boxGeometry args={[0.9, 0.7, 0.5]} />
                    <meshStandardMaterial color="#5b3417" flatShading />
                </mesh>
                {/* Årene som to lange plater */}
                {[-1, 1].map((side) => (
                    <mesh
                        key={side}
                        position={[side * 0.75, 0.25, 0]}
                        rotation={[0, 0, side * 0.6]}
                    >
                        <boxGeometry args={[0.5, 0.04, 3.6]} />
                        <meshStandardMaterial color="#6b4423" />
                    </mesh>
                ))}
                <mesh position={[0, 2.2, 0.3]}>
                    <cylinderGeometry args={[0.07, 0.07, 3.4, 6]} />
                    <meshStandardMaterial color="#3f2a14" />
                </mesh>
                <mesh position={[0, 2.5, 0.42]}>
                    <boxGeometry args={[2.6, 2.1, 0.06]} />
                    <meshStandardMaterial
                        ref={seil}
                        color={SEIL[s.side]}
                        emissive={SEIL[s.side]}
                        emissiveIntensity={0.15}
                    />
                </mesh>
            </group>
        </group>
    );
}

/** Hvitt sprut mellom skipene når flåtene møtes. */
function Sprut({ synlig, playing }: { synlig: boolean; playing: boolean }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    const o = useMemo(() => new THREE.Object3D(), []);
    const punkter = useMemo(
        () =>
            Array.from(
                { length: 24 },
                (_, i) => [-14 + (i % 12) * 2.6, i < 12 ? -1.6 : 0.6, i * 0.37] as const
            ),
        []
    );
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        const m = ref.current;
        if (!m) return;
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        punkter.forEach(([x, z, f], i) => {
            const fase = (tid.current * 0.9 + f) % 1;
            o.position.set(x, fase * 1.6, z);
            o.scale.setScalar(synlig ? 0.25 + fase * 0.5 : 0.0001);
            o.updateMatrix();
            m.setMatrixAt(i, o.matrix);
        });
        m.instanceMatrix.needsUpdate = true;
    });
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, punkter.length]}
            frustumCulled={false}
        >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
                color="#ffffff"
                emissive="#dbeafe"
                emissiveIntensity={0.5}
                transparent
                opacity={0.8}
            />
        </instancedMesh>
    );
}

function Odden() {
    // Lave åser langs nordkysten, og odden Actium som stikker ut.
    const aaser = useMemo(
        () =>
            [
                { p: [-40, -1.2, -34], s: [26, 5, 10] },
                { p: [-14, -1.4, -36], s: [20, 4, 8] },
                { p: [10, -1.4, -38], s: [24, 4.5, 9] },
                { p: [34, -1.2, -36], s: [22, 5, 10] },
                { p: [-24, -1.6, -27], s: [10, 3, 6] },
            ] as const,
        []
    );
    return (
        <group>
            {aaser.map((a, i) => (
                <mesh
                    key={i}
                    position={a.p as unknown as [number, number, number]}
                    scale={a.s as unknown as [number, number, number]}
                >
                    <sphereGeometry args={[1, 10, 6]} />
                    <meshStandardMaterial color={i % 2 ? '#8a9a5b' : '#a3a46a'} flatShading />
                </mesh>
            ))}
            {/* Leiren til hæren på land */}
            {[-26, -23.5, -21, -18.5].map((x, i) => (
                <mesh
                    key={x}
                    position={[x, 1.3, -25.5 + (i % 2) * 1.2]}
                    rotation={[0, Math.PI / 4, 0]}
                >
                    <coneGeometry args={[0.9, 1.3, 4]} />
                    <meshStandardMaterial color="#e7dcc3" flatShading />
                </mesh>
            ))}
        </group>
    );
}

function Hvitflagg({ synlig }: { synlig: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        const g = ref.current;
        if (!g) return;
        const s = damp(g.scale.y, synlig ? 1 : 0.001, 3, Math.min(dt, 0.05));
        g.scale.set(1, s, 1);
        g.visible = s > 0.02;
    });
    return (
        <group ref={ref} position={[-22, 1.4, -24]}>
            <mesh position={[0, 1.6, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 3.2, 6]} />
                <meshStandardMaterial color="#3f2a14" />
            </mesh>
            <mesh position={[0.8, 2.8, 0]}>
                <boxGeometry args={[1.6, 0.9, 0.05]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
            </mesh>
        </group>
    );
}

function Scene({
    modus,
    beat,
    playing,
    merker,
    finn,
    skip,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    merker: Merkelapp[];
    finn: (id: string) => HTMLDivElement | null | undefined;
    skip: { liste: (THREE.Group | null)[] };
}) {
    useBeatKamera((b, t) => kameraFor(modus, b, t), beat, playing);
    useMerkelapper(merker, finn);
    return (
        <>
            <color attach="background" args={['#f3d9b1']} />
            <fog attach="fog" args={['#f1d7b4', 50, 140]} />
            <hemisphereLight args={['#fff4e0', '#5b7f99', 1.1]} />
            <directionalLight position={[30, 30, 10]} intensity={1.4} color="#ffe2b0" />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[400, 400]} />
                <meshStandardMaterial
                    color="#2f6f8f"
                    emissive="#1e4f6a"
                    emissiveIntensity={0.45}
                    roughness={0.6}
                />
            </mesh>
            <Odden />
            <Hvitflagg synlig={modus === 'flukt' && beat >= 3} />
            <Sprut synlig={modus === 'slag' && beat >= 2} playing={playing} />
            {FLATEN.map((s, i) => (
                <Galei
                    key={i}
                    s={s}
                    modus={modus}
                    beat={beat}
                    playing={playing}
                    gruppe={(g) => {
                        skip.liste[i] = g;
                    }}
                />
            ))}
        </>
    );
}

export function AugustusHavet({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'for';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const refs = useRef<Record<string, HTMLDivElement | null>>({});
    // Et vanlig objekt (ikke ref), så merkene kan lese skipenes plass i bildeløkka.
    const [skip] = useState<{ liste: (THREE.Group | null)[] }>(() => ({ liste: [] }));
    /** Punktet over et skip der det faktisk er nå, så merket følger skipet (også på pause). */
    const over = (i: number, hoyde = 5.5) => {
        const g = skip.liste[i];
        return g ? v(g.position.x, hoyde, g.position.z) : v(FLATEN[i].x, hoyde, FLATEN[i].z);
    };
    const iOct = FLATEN.findIndex((s) => s.side === 'octavius' && s.flagg);
    const iAnt = FLATEN.findIndex((s) => s.side === 'antonius' && s.flagg);
    const iKleo = FLATEN.findIndex((s) => s.side === 'kleopatra') + 1;
    const merker: Merkelapp[] = [
        {
            id: 'odden',
            tekst: 'Actium',
            farge: '#365314',
            synlig: modus === 'for' && beat === 0,
            punkt: () => v(-24, 4, -27),
        },
        {
            id: 'antonius',
            tekst: modus === 'flukt' ? 'Antonius' : 'Antonius og Kleopatra',
            farge: SEIL.antonius,
            synlig:
                (modus === 'for' && (beat === 2 || beat === 4)) ||
                (modus === 'flukt' && beat === 1),
            punkt: () => over(iAnt),
        },
        {
            id: 'kleopatra',
            tekst: 'Kleopatra',
            farge: SEIL.kleopatra,
            synlig: modus === 'flukt' && beat === 0,
            punkt: () => over(iKleo),
        },
        {
            id: 'octavius',
            tekst: modus === 'slag' ? 'Agrippa' : 'Octavius og Agrippa',
            farge: SEIL.octavius,
            synlig:
                (modus === 'for' && (beat === 3 || beat === 4)) || (modus === 'slag' && beat === 1),
            punkt: () => over(iOct),
        },
        {
            id: 'overgir',
            tekst: 'Overgir seg',
            farge: '#334155',
            synlig: modus === 'flukt' && beat === 2,
            punkt: () => v(0, 5.5, -3),
        },
        {
            id: 'land',
            tekst: 'Hæren på land gir opp',
            farge: '#334155',
            synlig: modus === 'flukt' && beat === 3,
            punkt: () => v(-22, 6.5, -24),
        },
    ];

    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [30, 14, 38] }}
            >
                <Scene
                    modus={modus}
                    beat={beat}
                    playing={playing}
                    merker={merker}
                    finn={(id) => refs.current[id]}
                    skip={skip}
                />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {merker.map((m) => (
                    <div
                        key={m.id}
                        ref={(el) => {
                            refs.current[m.id] = el;
                        }}
                        className="absolute"
                        style={{ opacity: 0, transition: 'opacity 0.6s' }}
                    >
                        <div
                            className="px-4 py-1.5 rounded-xl bg-white/95 shadow-lg font-black text-2xl whitespace-nowrap border-b-4"
                            style={{
                                transform: 'translate(-50%, -100%)',
                                color: m.farge,
                                borderColor: m.farge,
                            }}
                        >
                            {m.tekst}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
