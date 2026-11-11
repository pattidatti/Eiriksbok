import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * En by i 3D, bygd av enkle klosser. Fire moduser:
 * «buss»: to ungdommer på bussen hjem fra skolen, og en voksen som nesten skjønner.
 * «torg»: hus i mange farger rundt et torg. Folk fra hvert hus møtes i midten.
 * «hvem»: en gjeng på torget der alle snakker likt, uansett bakgrunn.
 * «bytte»: samme elev i friminuttet og på et jobbintervju.
 */

type Modus = 'buss' | 'torg' | 'hvem' | 'bytte';
type V3 = [number, number, number];

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}

const LILLA = '#7c3aed';
const ORANSJE = '#ea580c';
const KLAER = [
    '#2563eb',
    '#16a34a',
    '#db2777',
    '#ca8a04',
    '#0891b2',
    '#9333ea',
    '#dc2626',
    '#475569',
];
const HUD = [
    '#f1c9a5',
    '#c68e65',
    '#8d5a3b',
    '#e8b796',
    '#5c3a26',
    '#d9a47e',
    '#a8714f',
    '#f3d2b8',
];
const HUS_FARGER = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea', '#0891b2'];

/* ---------- kamera ---------- */

function kameraFor(modus: Modus, beat: number, t: number) {
    const sakte = t * 0.12;
    switch (modus) {
        case 'buss':
            if (beat === 0) return { pos: v(9 - sakte, 6, 17), se: v(0, 1.6, 0) };
            if (beat === 1) return { pos: v(-2.2, 3, 6.4), se: v(-1.2, 2.2, 0) };
            if (beat === 2) return { pos: v(1.2, 3, 6.4), se: v(0.2, 2.2, 0) };
            if (beat === 3) return { pos: v(4.4, 3, 7), se: v(2.6, 1.8, 0) };
            return { pos: v(0.4, 3.4, 9.5), se: v(0.4, 2, 0) };
        case 'torg':
            if (beat <= 1) return { pos: v(0 + sakte, 17, 24), se: v(0, 0, 0) };
            if (beat === 2) return { pos: v(4, 12, 17), se: v(0, 0.5, 0) };
            return { pos: v(0, 9, 12), se: v(0, 1, 0) };
        case 'hvem':
            if (beat === 0) return { pos: v(0, 7, 13), se: v(0, 1, 0) };
            if (beat === 1) return { pos: v(-3 + sakte, 5, 9), se: v(0, 1.4, 0) };
            if (beat === 2) return { pos: v(3, 5, 9), se: v(0, 1.4, 0) };
            return { pos: v(0, 10, 11), se: v(0, 0.5, 0) };
        default:
            if (beat === 0) return { pos: v(0, 6, 13.5), se: v(0, 1.2, 0) };
            if (beat === 1) return { pos: v(-5.5, 4.5, 9), se: v(-6, 1.4, 0) };
            if (beat === 2) return { pos: v(5.5, 4.5, 9), se: v(6, 1.4, 0) };
            return { pos: v(0, 5.5, 12.5), se: v(0, 1.4, 0) };
    }
}

function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
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
        forste.current = false;
        camera.position.lerp(m.pos, k);
        se.current.lerp(m.se, k);
        camera.lookAt(se.current);
    });
    return null;
}

/* ---------- byggeklosser ---------- */

/** Et menneske: kropp og hode. Glir til `mal` når filmen spiller, står rett der på pause. */
function Person({
    mal,
    klaer,
    hud,
    s = 1,
    playing,
    sitter = false,
    glod = false,
}: {
    mal: V3;
    klaer: string;
    hud: string;
    s?: number;
    playing: boolean;
    sitter?: boolean;
    glod?: boolean;
}) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (!playing) {
            g.position.set(mal[0], mal[1], mal[2]);
            return;
        }
        g.position.x = damp(g.position.x, mal[0], 1.6, dt);
        g.position.y = damp(g.position.y, mal[1], 1.6, dt);
        g.position.z = damp(g.position.z, mal[2], 1.6, dt);
    });
    // Startplassen settes én gang. Senere mål tas av useFrame, ellers hopper figuren.
    const [start] = useState(mal);
    const kropp = sitter ? 0.75 : 1.2;
    return (
        <group ref={ref} position={start} scale={s}>
            <mesh position={[0, kropp / 2, 0]}>
                <cylinderGeometry args={[0.3, 0.36, kropp, 12]} />
                <meshStandardMaterial
                    color={klaer}
                    emissive={glod ? klaer : '#000000'}
                    emissiveIntensity={glod ? 0.5 : 0}
                    flatShading
                />
            </mesh>
            <mesh position={[0, kropp + 0.32, 0]}>
                <sphereGeometry args={[0.27, 14, 10]} />
                <meshStandardMaterial color={hud} flatShading />
            </mesh>
        </group>
    );
}

function Boks({ pos, str, farge, rot = 0 }: { pos: V3; str: V3; farge: string; rot?: number }) {
    return (
        <mesh position={pos} rotation={[0, rot, 0]}>
            <boxGeometry args={str} />
            <meshStandardMaterial color={farge} flatShading />
        </mesh>
    );
}

/** Snakkeboble som DOM over et punkt i 3D. */
function Boble({
    pos,
    children,
    farge = '#ffffff',
}: {
    pos: V3;
    children: ReactNode;
    farge?: string;
}) {
    return (
        <Html position={pos} center zIndexRange={[20, 0]}>
            <div
                className="px-5 py-3 rounded-3xl shadow-xl font-black text-3xl text-slate-900 whitespace-nowrap border-4 border-slate-800"
                style={{ background: farge }}
            >
                {children}
            </div>
        </Html>
    );
}

/* ---------- buss ---------- */

const BUSS_ROD = '#c62828';

function Buss({ beat, playing }: { beat: number; playing: boolean }) {
    const hjul = useRef<THREE.Group>(null);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        hjul.current?.children.forEach((c) => {
            c.rotation.z -= dt * 3;
        });
    });
    return (
        <group>
            {/* Gata og husene bak */}
            <Boks pos={[0, -0.05, 0]} str={[60, 0.1, 9]} farge="#57534e" />
            <Boks pos={[0, -0.04, 0]} str={[60, 0.11, 0.25]} farge="#e7e5e4" />
            <Boks pos={[0, 0, -9]} str={[60, 0.2, 9]} farge="#a8a29e" />
            {[-16, -9, -2, 5, 12, 19].map((x, i) => (
                <Boks
                    key={x}
                    pos={[x, 4 + (i % 3), -10]}
                    str={[6, 8 + (i % 3) * 2, 4]}
                    farge={['#d6b48a', '#e7d3b1', '#b8836b', '#cbd5e1', '#d4a373', '#e2c79b'][i]}
                />
            ))}
            {/* Bussen: et snitt der langsiden mot kameraet bare har den nedre delen */}
            <Boks pos={[0, 0.55, 0]} str={[11, 0.15, 2.6]} farge="#334155" />
            <Boks pos={[0, 3.35, 0]} str={[11, 0.2, 2.6]} farge={BUSS_ROD} />
            <Boks pos={[0, 1.95, -1.25]} str={[11, 2.8, 0.1]} farge={BUSS_ROD} />
            <Boks pos={[0, 2.4, -1.18]} str={[10.2, 1, 0.06]} farge="#bfdbfe" />
            <Boks pos={[0, 0.95, 1.25]} str={[11, 0.8, 0.1]} farge={BUSS_ROD} />
            <Boks pos={[-5.45, 1.95, 0]} str={[0.1, 2.8, 2.6]} farge={BUSS_ROD} />
            <Boks pos={[5.45, 1.95, 0]} str={[0.1, 2.8, 2.6]} farge={BUSS_ROD} />
            {[-5.4, -2.7, 0, 2.7, 5.4].map((x) => (
                <Boks key={x} pos={[x, 2.4, 1.25]} str={[0.18, 2, 0.1]} farge={BUSS_ROD} />
            ))}
            {/* Stang og seter */}
            <mesh position={[-0.4, 2, 0.5]}>
                <cylinderGeometry args={[0.04, 0.04, 2.7, 6]} />
                <meshStandardMaterial color="#facc15" />
            </mesh>
            {[2.6, 4.2, -3.6].map((x) => (
                <group key={x}>
                    <Boks pos={[x, 0.95, -0.6]} str={[0.9, 0.7, 0.9]} farge="#1e3a8a" />
                    <Boks pos={[x + 0.4, 1.6, -0.6]} str={[0.15, 1, 0.9]} farge="#1e3a8a" />
                </group>
            ))}
            <group ref={hjul}>
                {[
                    [-3.6, 1.35],
                    [3.6, 1.35],
                    [-3.6, -1.35],
                    [3.6, -1.35],
                ].map(([x, z]) => (
                    <mesh key={`${x}${z}`} position={[x, 0.45, z]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.5, 0.5, 0.3, 14]} />
                        <meshStandardMaterial color="#111827" />
                    </mesh>
                ))}
            </group>
            <Person
                mal={[-1.2, 0.62, 0.2]}
                klaer={KLAER[0]}
                hud={HUD[2]}
                playing={playing}
                glod={beat >= 4}
            />
            <Person
                mal={[0.2, 0.62, 0.3]}
                klaer={KLAER[2]}
                hud={HUD[0]}
                playing={playing}
                glod={beat >= 4}
            />
            <Person
                mal={[2.6, 1.3, -0.6]}
                klaer="#78716c"
                hud={HUD[3]}
                playing={playing}
                sitter
                s={1.05}
            />
            {beat === 1 && <Boble pos={[-1.2, 2.95, 0.2]}>«Jalla, baja, vi er sent ute!»</Boble>}
            {beat === 2 && <Boble pos={[0.2, 2.95, 0.3]}>«Slapp av, den bussen er tært.»</Boble>}
            {beat === 3 && (
                <Boble pos={[2.6, 2.75, -0.6]} farge="#fef3c7">
                    ?
                </Boble>
            )}
        </group>
    );
}

/* ---------- torg ---------- */

const N_HUS = 6;
const HUS_R = 11;

function husPos(i: number): V3 {
    const a = (i / N_HUS) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * HUS_R, 0, Math.sin(a) * HUS_R];
}

function Torgplass({ glod }: { glod: boolean }) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <circleGeometry args={[40, 40]} />
                <meshStandardMaterial color="#a3b18a" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <circleGeometry args={[7, 40]} />
                <meshStandardMaterial color="#d6d3d1" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[3.4, 3.9, 48]} />
                <meshStandardMaterial
                    color={glod ? ORANSJE : '#a8a29e'}
                    emissive={glod ? ORANSJE : '#000000'}
                    emissiveIntensity={glod ? 0.6 : 0}
                />
            </mesh>
        </group>
    );
}

function Torg({ beat, playing }: { beat: number; playing: boolean }) {
    const folk = useMemo(() => {
        const ut: { hus: number; ute: V3; inne: V3 }[] = [];
        for (let h = 0; h < N_HUS; h++) {
            const [hx, , hz] = husPos(h);
            const inn = new THREE.Vector3(-hx, 0, -hz).normalize();
            const side = new THREE.Vector3(-inn.z, 0, inn.x);
            for (let k = 0; k < 3; k++) {
                const o = (k - 1) * 1.1;
                ut.push({
                    hus: h,
                    ute: [hx + inn.x * 3.2 + side.x * o, 0, hz + inn.z * 3.2 + side.z * o],
                    inne: [0, 0, 0],
                });
            }
        }
        ut.forEach((f, i) => {
            const a = (i / ut.length) * Math.PI * 2;
            const r = i % 2 ? 2.2 : 3.0;
            f.inne = [Math.cos(a) * r, 0, Math.sin(a) * r];
        });
        return ut;
    }, []);
    const samlet = beat >= 2;
    return (
        <group>
            <Torgplass glod={beat >= 3} />
            {Array.from({ length: N_HUS }, (_, i) => {
                const [x, , z] = husPos(i);
                const rot = -Math.atan2(z, x) + Math.PI / 2;
                const farge = HUS_FARGER[i];
                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, rot, 0]}>
                        <Boks pos={[0, 2, 0]} str={[4, 4, 3]} farge="#f5f5f4" />
                        <mesh position={[0, 4.7, 0]} rotation={[0, Math.PI / 4, 0]}>
                            <coneGeometry args={[3.1, 1.6, 4]} />
                            <meshStandardMaterial
                                color={farge}
                                emissive={farge}
                                emissiveIntensity={beat >= 1 ? 0.45 : 0.05}
                                flatShading
                            />
                        </mesh>
                        <Boks pos={[0, 1, 1.52]} str={[1, 2, 0.05]} farge={farge} />
                    </group>
                );
            })}
            {folk.map((f, i) => (
                <Person
                    key={i}
                    mal={samlet ? f.inne : f.ute}
                    klaer={HUS_FARGER[f.hus]}
                    hud={HUD[i % HUD.length]}
                    playing={playing}
                    glod={beat >= 3}
                />
            ))}
        </group>
    );
}

/* ---------- hvem ---------- */

function Hvem({ beat, playing }: { beat: number; playing: boolean }) {
    const gjeng = useMemo(
        () =>
            Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2 + 0.3;
                return [Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4] as V3;
            }),
        []
    );
    return (
        <group>
            <Torgplass glod={beat >= 3} />
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const [x, , z] = husPos(i);
                const rot = -Math.atan2(z, x) + Math.PI / 2;
                return (
                    <group key={i} position={[x, 0, z]} rotation={[0, rot, 0]}>
                        <Boks pos={[0, 2, 0]} str={[4, 4, 3]} farge="#e7e5e4" />
                        <mesh position={[0, 4.7, 0]} rotation={[0, Math.PI / 4, 0]}>
                            <coneGeometry args={[3.1, 1.6, 4]} />
                            <meshStandardMaterial color="#78716c" flatShading />
                        </mesh>
                    </group>
                );
            })}
            {gjeng.map((p, i) => (
                <group key={i}>
                    <Person
                        mal={p}
                        klaer={KLAER[i]}
                        hud={HUD[i]}
                        playing={playing}
                        glod={beat >= 3}
                    />
                    {beat >= 1 && beat <= 2 && <Pratboble pos={[p[0], 2.35, p[2]]} />}
                </group>
            ))}
        </group>
    );
}

/** En liten snakkeboble i 3D, lik for alle: samme måte å snakke på. */
function Pratboble({ pos }: { pos: V3 }) {
    return (
        <group position={pos}>
            <mesh>
                <sphereGeometry args={[0.36, 14, 10]} />
                <meshStandardMaterial color={ORANSJE} emissive={ORANSJE} emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0, -0.36, 0]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.13, 0.25, 6]} />
                <meshStandardMaterial color={ORANSJE} emissive={ORANSJE} emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

/* ---------- bytte ---------- */

function Bytte({ beat, playing }: { beat: number; playing: boolean }) {
    const elevMal: V3 = beat === 1 ? [-5, 0, 1.2] : beat === 2 ? [5.4, 0, 1.4] : [0, 0, 1];
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#a3b18a" />
            </mesh>
            {/* Skolegården */}
            <Boks pos={[-6, 0.01, 0]} str={[9, 0.04, 8]} farge="#d6d3d1" />
            <Boks pos={[-6, 2.5, -4.5]} str={[10, 5, 1]} farge="#e2c79b" />
            <Person mal={[-7, 0, 0]} klaer={KLAER[1]} hud={HUD[4]} playing={playing} />
            <Person mal={[-6.6, 0, 2.2]} klaer={KLAER[3]} hud={HUD[0]} playing={playing} />
            <Person mal={[-3.8, 0, -0.6]} klaer={KLAER[4]} hud={HUD[5]} playing={playing} />
            {/* Kontoret */}
            <Boks pos={[6, 0.01, 0]} str={[8, 0.04, 7]} farge="#cbd5e1" />
            <Boks pos={[6, 2.5, -3.6]} str={[8, 5, 0.3]} farge="#f1f5f9" />
            <Boks pos={[6, 3, -3.4]} str={[2.4, 1.4, 0.1]} farge="#93c5fd" />
            <Boks pos={[6.4, 0.9, -0.6]} str={[3, 0.15, 1.6]} farge="#78350f" />
            <Boks pos={[6.4, 0.42, -0.6]} str={[2.8, 0.84, 1.4]} farge="#92400e" />
            <Person mal={[6.6, 0, -2]} klaer="#334155" hud={HUD[3]} playing={playing} s={1.08} />
            <Person mal={elevMal} klaer={LILLA} hud={HUD[2]} playing={playing} glod={beat === 3} />
            {beat === 1 && <Boble pos={[-5, 2.4, 1.2]}>«Jalla, baja!»</Boble>}
            {(beat === 0 || beat === 3) && (
                <>
                    <Boble pos={[-6, 4, -2]} farge="#fef3c7">
                        Friminuttet
                    </Boble>
                    <Boble pos={[6, 4, -2]} farge="#e0f2fe">
                        Jobbintervjuet
                    </Boble>
                </>
            )}
            {beat === 3 && (
                <Boble pos={[0, 2.5, 1]} farge="#ede9fe">
                    ⇄
                </Boble>
            )}
        </group>
    );
}

/* ---------- scene og DOM ---------- */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const himmel = modus === 'buss' ? '#dbe7f3' : '#e0ecf5';
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 30, 80]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#a3b18a', 0.6]} />
            <directionalLight position={[8, 14, 10]} intensity={1.2} />
            <Kamera modus={modus} beat={beat} playing={playing} />
            {modus === 'buss' && <Buss beat={beat} playing={playing} />}
            {modus === 'torg' && <Torg beat={beat} playing={playing} />}
            {modus === 'hvem' && <Hvem beat={beat} playing={playing} />}
            {modus === 'bytte' && <Bytte beat={beat} playing={playing} />}
        </>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    buss: ['Oslo, på vei hjem', 'Den ene', 'Den andre', 'En voksen', 'De forstår hverandre'],
    torg: ['En by, mange bakgrunner', 'Multi = flere', 'Ungdom møtes', 'Et nytt språk, sammen'],
    hvem: ['Hvem snakker slik?', 'Med og uten innvandrerbakgrunn', 'Ikke dette', 'Men dette'],
    bytte: ['Én elev, to talemål', 'Friminuttet', 'Jobbintervjuet', 'Velg talemål'],
};

const KORT: Record<Modus, (string | null)[]> = {
    buss: [
        null,
        null,
        null,
        '«jalla», «baja», «tært»: ikke i skolebøkene',
        'Måten de snakker på viser hvem de henger med',
    ],
    torg: [
        null,
        'Trekk fra mange ulike språk',
        'Ikke én gruppe, men mange bakgrunner',
        'Snakker et nytt språk sammen',
    ],
    hvem: [null, 'Samme talemål', null, 'Det sosiale miljøet du hører til'],
    bytte: [
        null,
        'Multietnolekt med kompisene',
        'Mer skriftnært: nærmere slik vi skriver',
        'Flere talemål er en styrke',
    ],
};

export function EtnolektBuss({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'buss';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [9, 6, 17] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-4xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {kort && (
                    <motion.div
                        key={kort}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute inset-x-0 bottom-[5%] flex justify-center pointer-events-none"
                    >
                        <div className="px-6 py-3 rounded-2xl bg-amber-50 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap">
                            {kort}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {modus === 'hvem' && beat === 0 && (
                <Avkreft tekst="Bare ungdom med innvandrerbakgrunn?" svar="Stemmer ikke" />
            )}
            {modus === 'hvem' && beat === 2 && <IkkeListe />}
        </div>
    );
}

function Avkreft({ tekst, svar }: { tekst: string; svar: string }) {
    return (
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center pointer-events-none">
            <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl flex items-center gap-4">
                <span className="text-3xl font-black text-slate-900">{tekst}</span>
                <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2 }}
                    className="px-4 py-1 rounded-xl bg-red-600 text-white text-3xl font-black"
                >
                    ✗ {svar}
                </motion.span>
            </div>
        </div>
    );
}

function IkkeListe() {
    const punkter = ['hudfarge', 'hvor foreldrene er født'];
    return (
        <div className="absolute inset-x-0 bottom-[6%] flex justify-center gap-5 pointer-events-none">
            {punkter.map((p, i) => (
                <motion.div
                    key={p}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.6 }}
                    className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl flex items-center gap-3"
                >
                    <span className="text-3xl font-black text-slate-900">{p}</span>
                    <span
                        className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-2xl font-black"
                        style={{ width: 40, height: 40 }}
                    >
                        ✗
                    </span>
                </motion.div>
            ))}
        </div>
    );
}
