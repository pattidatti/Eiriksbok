import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import { Flate } from '../shared';
import type { VisualProps } from '../../types';
import { Overskrift, Vis } from './felles';
import { damp, overskriftFor, useKamera, v } from './hjelp';

/**
 * 3D. Fire moduser:
 * - bygg: setet svever, de tre beina (søylene) kommer ett og ett, og setet legger seg på dem.
 * - sag: krakken står, ett bein sages av og den velter, så lyser beina opp ett og ett.
 * - bord: arbeidere og arbeidsgivere langt fra hverandre, så rundt samme bord, så staten.
 * - frontfag: en rad bedrifter. Eksportindustrien får lønna først, de andre følger etter.
 * Alt har et fast mål per beat, så scenen tåler at eleven hopper rett inn.
 */

type Modus = 'bygg' | 'sag' | 'bord' | 'frontfag';

const BEIN = [
    { navn: 'Velferd for alle', farge: '#0d9488', x: -1.5, z: 0.9 },
    { navn: 'Organisert arbeidsliv', farge: '#2563eb', x: 1.5, z: 0.9 },
    { navn: 'Stabil økonomi', farge: '#ca8a04', x: 0, z: -1.7 },
];
const BEIN_HOYDE = 3.2;
const SETE_Y = BEIN_HOYDE + 0.2;

const OVERSKRIFT: Record<Modus, (string | null)[]> = {
    bygg: ['Tre søyler', 'Søyle 1', 'Søyle 2', 'Søyle 3', 'Samspillet holder det oppe'],
    sag: [
        'En krakk med tre bein',
        'Ett bein borte: den velter',
        'Velferden',
        'Arbeidslivet',
        'Økonomien',
    ],
    bord: [
        'Mellom de to verdenskrigene',
        '1930-årene: «Det store kompromisset»',
        'Uenige, men de trenger hverandre',
        'Trepartssamarbeidet',
        '1962: Kontaktutvalget',
        '1967: Felles tall',
    ],
    frontfag: [
        'Ikke bedrift for bedrift',
        'Eksportindustrien først',
        'Frontfagmodellen',
        'Varene må kunne selges i utlandet',
    ],
};

const INFO: Record<Modus, (string | null)[]> = {
    bygg: [null, null, null, null, null],
    sag: [
        null,
        null,
        'Velferd: tryggere å bytte jobb',
        'Samarbeid: lønn bedriftene tåler',
        'Stabil økonomi: skattepenger til velferden',
    ],
    bord: [
        'Mye konflikt og harde kriser i Norden',
        'Faste regler for å forhandle og løse uenighet',
        'Fortsatt uenige om mye',
        'Arbeidstakerne, arbeidsgiverne og staten',
        'Et fast møtested med regjeringen',
        'Et utvalg regner ut tallene før lønnsoppgjørene',
    ],
    frontfag: [
        'Lønna avtales ikke i hver bedrift for seg',
        'Industrien som selger varer til utlandet, forhandler først',
        'Resten av arbeidslivet følger etter',
        'Lønna skal ikke gjøre norske varer for dyre',
    ],
};

/** En liten DOM-merkelapp over 3D. */
function Merke({
    pos,
    tekst,
    farge = '#ffffff',
    tekstfarge = '#0f172a',
}: {
    pos: [number, number, number];
    tekst: string;
    farge?: string;
    tekstfarge?: string;
}) {
    return (
        <Html center position={pos} zIndexRange={[10, 0]}>
            <div
                className="px-3 py-1 rounded-xl font-black text-2xl whitespace-nowrap shadow-xl"
                style={{ background: farge, color: tekstfarge }}
            >
                {tekst}
            </div>
        </Html>
    );
}

// ---------- krakken ----------

function Bein({
    i,
    synlig,
    lys,
    avsaget,
    playing,
}: {
    i: number;
    synlig: boolean;
    lys: boolean;
    avsaget: boolean;
    playing: boolean;
}) {
    const b = BEIN[i];
    const ref = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const malY = synlig ? 0 : -BEIN_HOYDE - 1;
        const malX = avsaget ? b.x + 3.2 : b.x;
        const malRot = avsaget ? Math.PI / 2 : 0;
        if (forste.current) {
            g.position.set(malX, malY, b.z);
            g.rotation.z = malRot;
        } else {
            g.position.y = damp(g.position.y, malY, 3, dt);
            g.position.x = damp(g.position.x, malX, 3, dt);
            g.rotation.z = damp(g.rotation.z, malRot, 3, dt);
        }
        if (mat.current) mat.current.emissiveIntensity = lys ? 0.9 : 0.05;
        forste.current = false;
    });
    return (
        <group ref={ref}>
            <mesh position={[0, BEIN_HOYDE / 2, 0]}>
                <cylinderGeometry args={[0.24, 0.3, BEIN_HOYDE, 14]} />
                <meshStandardMaterial
                    ref={mat}
                    color={b.farge}
                    emissive={b.farge}
                    emissiveIntensity={0.08}
                    flatShading
                />
            </mesh>
        </group>
    );
}

function Krakk({
    modus,
    beat,
    playing,
}: {
    modus: 'bygg' | 'sag';
    beat: number;
    playing: boolean;
}) {
    const sete = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const velt = modus === 'sag' && beat === 1;
    const svever = modus === 'bygg' && beat < 4;
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = sete.current;
        if (!g) return;
        const malY = velt ? 1.2 : svever ? SETE_Y + 1.4 : SETE_Y;
        const malRot = velt ? -0.75 : 0;
        if (forste.current) {
            g.position.y = malY;
            g.rotation.z = malRot;
        } else {
            g.position.y = damp(g.position.y, malY, 3, dt);
            g.rotation.z = damp(g.rotation.z, malRot, 3, dt);
        }
        forste.current = false;
    });
    const beinSynlig = (i: number) => (modus === 'bygg' ? beat >= i + 1 : true);
    const lys = (i: number) =>
        (modus === 'bygg' && (beat === i + 1 || beat >= 4)) || (modus === 'sag' && beat === i + 2);
    return (
        <>
            {/* Setet. Når krakken velter, velter de to beina som står igjen med setet. */}
            <group ref={sete} position={[0, SETE_Y, 0]}>
                <mesh position={[0, 0.25, 0]}>
                    <cylinderGeometry args={[2.4, 2.4, 0.5, 32]} />
                    <meshStandardMaterial
                        color="#a16207"
                        emissive="#713f12"
                        emissiveIntensity={0.25}
                        flatShading
                    />
                </mesh>
                {velt &&
                    [0, 2].map((i) => (
                        <mesh key={i} position={[BEIN[i].x, -BEIN_HOYDE / 2, BEIN[i].z]}>
                            <cylinderGeometry args={[0.24, 0.3, BEIN_HOYDE, 14]} />
                            <meshStandardMaterial color={BEIN[i].farge} flatShading />
                        </mesh>
                    ))}
            </group>
            {BEIN.map((_, i) =>
                velt && i !== 1 ? null : (
                    <Bein
                        key={i}
                        i={i}
                        synlig={beinSynlig(i)}
                        lys={lys(i)}
                        avsaget={modus === 'sag' && beat === 1 && i === 1}
                        playing={playing}
                    />
                )
            )}
            {modus === 'bygg' && beat >= 1 && beat <= 3 && (
                <Merke
                    pos={
                        beat === 3 ? [0, 0.6, 1.2] : [BEIN[beat - 1].x * 2.2, 1.4, BEIN[beat - 1].z]
                    }
                    tekst={BEIN[beat - 1].navn}
                    farge={BEIN[beat - 1].farge}
                    tekstfarge="#ffffff"
                />
            )}
            {BEIN.map((b, i) =>
                lys(i) && !(modus === 'bygg' && beat >= 4) ? (
                    <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[b.x, 0.03, b.z]}>
                        <ringGeometry args={[0.55, 0.85, 32]} />
                        <meshBasicMaterial color={b.farge} transparent opacity={0.9} />
                    </mesh>
                ) : null
            )}
            {modus === 'bygg' && beat >= 4 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                    <ringGeometry args={[3, 3.4, 48]} />
                    <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
                </mesh>
            )}
            {modus === 'sag' && beat === 1 && (
                <Merke pos={[3.2, 1.1, 1.6]} tekst="Avsaget" farge="#dc2626" tekstfarge="#ffffff" />
            )}
        </>
    );
}

// ---------- bordet ----------

const GRUPPER = [
    { navn: 'Arbeidstakerne', kort: 'LO', farge: '#dc2626', vinkel: Math.PI },
    { navn: 'Arbeidsgiverne', kort: 'NHO', farge: '#2563eb', vinkel: 0 },
    { navn: 'Staten', kort: 'Staten', farge: '#ca8a04', vinkel: Math.PI / 2 },
];

function Figur({
    gruppe,
    nr,
    beat,
    playing,
}: {
    gruppe: number;
    nr: number;
    beat: number;
    playing: boolean;
}) {
    const g = GRUPPER[gruppe];
    const ref = useRef<THREE.Group>(null);
    const mal = () => {
        const naer = beat >= 1;
        const r = naer ? 3.6 : 7.2;
        const a = g.vinkel + (nr - 1) * (naer ? 0.42 : 0.2);
        // Staten kommer inn bakfra fra beat 3.
        const borte = gruppe === 2 && beat < 3;
        const rr = borte ? 14 : r;
        return new THREE.Vector3(
            Math.cos(a) * rr,
            0,
            -Math.sin(a) * rr * (gruppe === 2 ? 1 : 0.55)
        );
    };
    const [start] = useState(mal);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const o = ref.current;
        if (!o) return;
        const m = mal();
        // Staten er ikke med før beat 3.
        o.visible = !(gruppe === 2 && beat < 3);
        if (forste.current) o.position.copy(m);
        else {
            o.position.x = damp(o.position.x, m.x, 2.2, dt);
            o.position.z = damp(o.position.z, m.z, 2.2, dt);
        }
        // Ved bordet ser de inn mot midten. Ved konflikt snur de ryggen til hverandre.
        const mot = Math.atan2(-o.position.x, -o.position.z);
        o.rotation.y = beat >= 1 ? mot : mot + Math.PI;
        forste.current = false;
    });
    return (
        <group ref={ref} position={start}>
            <mesh position={[0, 0.9, 0]}>
                <capsuleGeometry args={[0.42, 1, 4, 12]} />
                <meshStandardMaterial color={g.farge} flatShading />
            </mesh>
            <mesh position={[0, 2.05, 0]}>
                <sphereGeometry args={[0.36, 16, 12]} />
                <meshStandardMaterial color="#f1c9a5" flatShading />
            </mesh>
            <mesh position={[0, 1.95, 0.32]}>
                <boxGeometry args={[0.3, 0.08, 0.1]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
        </group>
    );
}

function Bord({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            <mesh position={[0, 1.2, 0]}>
                <cylinderGeometry args={[2.6, 2.6, 0.22, 40]} />
                <meshStandardMaterial
                    color="#e7d3a8"
                    emissive="#78350f"
                    emissiveIntensity={0.1}
                    flatShading
                />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.3, 0.5, 1.2, 12]} />
                <meshStandardMaterial color="#78716c" />
            </mesh>
            {/* Reglene på bordet */}
            {beat >= 1 && (
                <mesh position={[0, 1.33, 0.6]} rotation={[0, 0.3, 0]}>
                    <boxGeometry args={[1.1, 0.04, 1.4]} />
                    <meshStandardMaterial
                        color="#ffffff"
                        emissive="#ffffff"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            )}
            {/* Felles tall fra 1967: en bunke ark som lyser */}
            {beat >= 5 &&
                [0, 1, 2, 3].map((i) => (
                    <mesh
                        key={i}
                        position={[0.2, 1.36 + i * 0.07, -0.8]}
                        rotation={[0, -0.2 + i * 0.08, 0]}
                    >
                        <boxGeometry args={[1, 0.05, 1.3]} />
                        <meshStandardMaterial
                            color="#fef3c7"
                            emissive="#f59e0b"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                ))}
            {/* Kontaktutvalget: et lys over bordet fra 1962 */}
            {beat >= 4 && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                    <ringGeometry args={[4.6, 5, 56]} />
                    <meshBasicMaterial color="#f59e0b" transparent opacity={0.85} />
                </mesh>
            )}
            {GRUPPER.map((_, gi) =>
                [0, 1, 2].map((nr) => (
                    <Figur key={`${gi}-${nr}`} gruppe={gi} nr={nr} beat={beat} playing={playing} />
                ))
            )}
            {beat <= 2 && (
                <Merke
                    pos={[beat >= 1 ? -4.2 : -7.4, 3.3, 0]}
                    tekst="Arbeidere"
                    farge="#dc2626"
                    tekstfarge="#fff"
                />
            )}
            {beat <= 2 && (
                <Merke
                    pos={[beat >= 1 ? 4.2 : 7.4, 3.3, 0]}
                    tekst="Arbeidsgivere"
                    farge="#2563eb"
                    tekstfarge="#fff"
                />
            )}
            {beat >= 3 && (
                <Merke
                    pos={[-4.2, 3.3, 0]}
                    tekst="Arbeidstakerne: LO"
                    farge="#dc2626"
                    tekstfarge="#fff"
                />
            )}
            {beat >= 3 && (
                <Merke
                    pos={[4.2, 3.3, 0]}
                    tekst="Arbeidsgiverne: NHO"
                    farge="#2563eb"
                    tekstfarge="#fff"
                />
            )}
            {beat >= 3 && (
                <Merke pos={[0, 3.4, -3.8]} tekst="Staten" farge="#ca8a04" tekstfarge="#fff" />
            )}
        </>
    );
}

// ---------- frontfaget ----------

const BEDRIFTER = [
    { x: -7.5, h: 2.6, farge: '#475569', eksport: true },
    { x: -3.6, h: 2, farge: '#0d9488', eksport: false },
    { x: 0, h: 3, farge: '#7c3aed', eksport: false },
    { x: 3.6, h: 1.8, farge: '#db2777', eksport: false },
    { x: 7.2, h: 2.4, farge: '#0891b2', eksport: false },
];
const LONN = 2.6;

function Stolpe({ i, beat, playing }: { i: number; beat: number; playing: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    const tid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            tid.current = 0;
        }
        tid.current += dt;
        const m = ref.current;
        if (!m) return;
        const klar = i === 0 ? beat >= 1 : beat >= 2;
        // De andre følger etter en etter en, men et hopp rett inn gir ferdig bilde på pause.
        const venter = beat === 2 && i > 0 && playing && tid.current < 0.5 * i;
        const malH = klar && !venter ? LONN : 0.01;
        const h = forste.current ? malH : damp(m.scale.y, malH, 3, dt);
        m.scale.y = h;
        m.position.y = h / 2;
        forste.current = false;
    });
    return (
        <mesh ref={ref} position={[BEDRIFTER[i].x + 1.35, 0, 0.6]}>
            <boxGeometry args={[0.45, 1, 0.45]} />
            <meshStandardMaterial color="#16a34a" emissive="#16a34a" emissiveIntensity={0.35} />
        </mesh>
    );
}

function Skip({ beat, playing }: { beat: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const g = ref.current;
        if (!g) return;
        const malX = beat >= 3 ? 3 : -7.5;
        g.position.x = forste.current ? malX : damp(g.position.x, malX, 0.9, dt);
        forste.current = false;
    });
    return (
        <group ref={ref} position={[-7.5, 0, 4.4]}>
            <mesh position={[0, 0.35, 0]}>
                <boxGeometry args={[3.4, 0.7, 1.1]} />
                <meshStandardMaterial color="#1e3a8a" flatShading />
            </mesh>
            {[-1, 0, 1].map((k) => (
                <mesh key={k} position={[k * 0.95, 0.95, 0]}>
                    <boxGeometry args={[0.85, 0.5, 0.8]} />
                    <meshStandardMaterial
                        color={['#ea580c', '#16a34a', '#eab308'][k + 1]}
                        flatShading
                    />
                </mesh>
            ))}
        </group>
    );
}

function Frontfag({ beat, playing }: { beat: number; playing: boolean }) {
    return (
        <>
            {/* Vannet foran */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 4.6]}>
                <planeGeometry args={[40, 3]} />
                <meshStandardMaterial color="#60a5fa" emissive="#1d4ed8" emissiveIntensity={0.25} />
            </mesh>
            {BEDRIFTER.map((b, i) => (
                <group key={i} position={[b.x, 0, 0]}>
                    <mesh position={[0, b.h / 2, 0]}>
                        <boxGeometry args={[2.2, b.h, 1.8]} />
                        <meshStandardMaterial
                            color={b.farge}
                            emissive={b.farge}
                            emissiveIntensity={beat === 1 && i === 0 ? 0.5 : 0.08}
                            flatShading
                        />
                    </mesh>
                    {b.eksport && (
                        <mesh position={[0.6, b.h + 0.8, 0]}>
                            <cylinderGeometry args={[0.22, 0.28, 1.6, 10]} />
                            <meshStandardMaterial color="#334155" />
                        </mesh>
                    )}
                </group>
            ))}
            {BEDRIFTER.map((_, i) => (
                <Stolpe key={i} i={i} beat={beat} playing={playing} />
            ))}
            <Skip beat={beat} playing={playing} />
            {beat === 0 &&
                BEDRIFTER.map((b, i) => <Merke key={i} pos={[b.x, b.h + 1, 0]} tekst="?" />)}
            {beat >= 1 && (
                <Merke
                    pos={[-7.5, 4.6, 0]}
                    tekst="Eksportindustrien"
                    farge="#0f172a"
                    tekstfarge="#ffffff"
                />
            )}
            {beat >= 1 && beat <= 2 && (
                <Merke pos={[-6.15, 3.3, 0.6]} tekst="Lønn" farge="#16a34a" tekstfarge="#ffffff" />
            )}
            {beat >= 3 && (
                <Merke
                    pos={[5.5, 2.2, 4.4]}
                    tekst="Til utlandet"
                    farge="#1e3a8a"
                    tekstfarge="#ffffff"
                />
            )}
        </>
    );
}

// ---------- scene og kamera ----------

function kameraFor(modus: Modus) {
    return (beat: number, t: number) => {
        const sakte = Math.sin(t * 0.15) * 0.6;
        if (modus === 'bygg' || modus === 'sag') {
            const naer = modus === 'sag' && beat >= 2;
            return {
                pos: v(sakte + (naer ? 1.5 : 0), naer ? 5.5 : 5, naer ? 10.5 : 12),
                se: v(0, 2.3, 0),
            };
        }
        if (modus === 'bord') {
            if (beat === 0) return { pos: v(sakte, 10, 17), se: v(0, 1, 0) };
            return { pos: v(sakte, 8.5, 12.5), se: v(0, 1.2, -0.6) };
        }
        return { pos: v(sakte, 7.5, 17.5), se: v(0, 1.4, 1) };
    };
}

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const kamera = useMemo(() => kameraFor(modus), [modus]);
    useKamera(kamera, beat, playing);
    return (
        <>
            <color attach="background" args={['#e8eef5']} />
            <fog attach="fog" args={['#e8eef5', 30, 70]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#ffffff', '#94a3b8', 0.7]} />
            <directionalLight position={[-6, 14, 10]} intensity={1.4} />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 60]} />
                <meshStandardMaterial color="#cbd5e1" emissive="#64748b" emissiveIntensity={0.15} />
            </mesh>
            {(modus === 'bygg' || modus === 'sag') && (
                <Krakk modus={modus} beat={beat} playing={playing} />
            )}
            {modus === 'bord' && <Bord beat={beat} playing={playing} />}
            {modus === 'frontfag' && <Frontfag beat={beat} playing={playing} />}
        </>
    );
}

export function NordiskModellKrakk({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'bygg';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const info = overskriftFor(INFO[modus], beat);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, near: 0.3, far: 200, position: [0, 5, 12] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Flate>
                <Vis
                    nar={!!info}
                    key={`${modus}-${beat}`}
                    className="absolute inset-x-0 flex justify-center"
                    style={{ bottom: 18 }}
                >
                    <div
                        className="rounded-2xl bg-slate-900/90 px-5 py-2 text-white font-black shadow-xl"
                        style={{ fontSize: 22 }}
                    >
                        {info}
                    </div>
                </Vis>
                <Overskrift tekst={overskriftFor(OVERSKRIFT[modus], beat)} />
            </Flate>
        </div>
    );
}
