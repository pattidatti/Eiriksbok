import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Oversiktskart } from '../../kart/Oversiktskart';
import { AteismeOverskrift, AteismeSkilt, type SkiltTone } from './felles';

/**
 * 3D: Athen og platået ved tåka.
 * «athen»: Athen i 399 fvt., tempelet på høyden og domstolen der Sokrates står.
 * «grense»: platået der vi kan måle (månen, en stein, husene i Norge), med tåka bak kanten.
 * «taake»: spørsmålene i tåka, målebåndet som stopper ved kanten, agnostikeren.
 * «samtale»: to som tror ulikt, en mur mellom dem, så de to spørsmålene og kanten.
 */

type Modus = 'athen' | 'grense' | 'taake' | 'samtale';

function damp(a: number, b: number, lambda: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-lambda * dt));
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Kanten av platået (z). Alt bak er tåke. */
const KANT = -8;
const MAANE = v(-20, 15, 2);
const STEIN = v(7, 0, 22);
const HUS = v(17, 0, 12);
const BAAND_START = 34;

function kameraFor(modus: Modus, beat: number, t: number) {
    const s = Math.min(t, 12);
    if (modus === 'athen') {
        switch (beat) {
            case 0:
                return { pos: v(-4 + s * 0.4, 13, 52), se: v(0, 6, -14) };
            case 1:
                return { pos: v(5, 4.2, 21), se: v(0, 1.8, 8) };
            case 2:
                return { pos: v(-6.5, 5, 19.5), se: v(0, 1.6, 7) };
            default:
                return { pos: v(-3 + s * 0.2, 8, 25), se: v(0, 3, -2) };
        }
    }
    if (modus === 'grense') {
        switch (beat) {
            case 0:
                return { pos: v(s * 0.3, 24, 62), se: v(0, 0, 0) };
            case 1:
                return { pos: v(7, 4.5, 42), se: v(0, 0.5, 24) };
            case 2:
                return { pos: v(0, 11, 50), se: v(-2, 6, 10) };
            default:
                return { pos: v(-6, 13, 52), se: v(-1, 5, 10) };
        }
    }
    if (modus === 'taake') {
        switch (beat) {
            case 0:
                return { pos: v(0, 6, 16), se: v(0, 2.5, -14) };
            case 1:
                return { pos: v(0, 4.5, 5), se: v(0, 4.5, -20) };
            case 2:
                return { pos: v(0.5, 4, 3), se: v(1, 3.5, -16) };
            case 3:
                return { pos: v(14, 7, 12), se: v(0, 0, -4) };
            default:
                return { pos: v(0, 7, 22), se: v(0, 2.5, -10) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 3, 14), se: v(0, 1.6, 4) };
        case 1:
            return { pos: v(7, 4, 12.5), se: v(0, 1.6, 4) };
        case 2:
            return { pos: v(0, 3.4, 13), se: v(0, 2.4, 4) };
        case 3:
            return { pos: v(0, 4, 3), se: v(0, 2, -12) };
        default:
            return { pos: v(0, 9, 27), se: v(0, 1.5, -4) };
    }
}

/** Kameraet glir mot målet for beaten. Første bilde hopper rett dit. */
function Kamera({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    useFrame(({ camera }, raw) => {
        const dt = playing ? Math.min(raw, 0.05) : 0;
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

function Merke({
    pos,
    tekst,
    tone = 'vanlig',
}: {
    pos: [number, number, number];
    tekst: string;
    tone?: SkiltTone;
}) {
    return (
        <Html position={pos} center zIndexRange={[10, 0]}>
            <AteismeSkilt tekst={tekst} tone={tone} />
        </Html>
    );
}

/** Enkel figur: kjortel (kjegle), hode og armer langs siden. */
function Figur({
    pos,
    farge,
    retning = 0,
    hoyde = 1,
}: {
    pos: [number, number, number];
    farge: string;
    retning?: number;
    hoyde?: number;
}) {
    return (
        <group position={pos} rotation={[0, retning, 0]} scale={hoyde}>
            <mesh position={[0, 0.85, 0]}>
                <cylinderGeometry args={[0.32, 0.55, 1.7, 10]} />
                <meshStandardMaterial color={farge} flatShading />
            </mesh>
            <mesh position={[0, 1.98, 0]}>
                <sphereGeometry args={[0.32, 14, 12]} />
                <meshStandardMaterial color="#f2c9a0" />
            </mesh>
            <mesh position={[0, 1.95, 0.27]}>
                <boxGeometry args={[0.16, 0.08, 0.08]} />
                <meshStandardMaterial color="#7c5a3c" />
            </mesh>
        </group>
    );
}

/* ------------------------------------------------------------------ Athen */

function Tempel() {
    const gavl = useMemo(() => {
        const f = new THREE.Shape();
        f.moveTo(-7.3, 0);
        f.lineTo(7.3, 0);
        f.lineTo(0, 2);
        f.closePath();
        const g = new THREE.ExtrudeGeometry(f, { depth: 8.6, bevelEnabled: false });
        g.translate(0, 0, -4.3);
        return g;
    }, []);
    const soyler: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
        soyler.push([-5.5 + i * 2.2, 3.4]);
        soyler.push([-5.5 + i * 2.2, -3.4]);
    }
    return (
        <group position={[0, 8, -30]}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[14.6, 1, 8.6]} />
                <meshStandardMaterial color="#e7e2d6" flatShading />
            </mesh>
            {soyler.map(([x, z]) => (
                <mesh key={`${x}${z}`} position={[x, 3, z]}>
                    <cylinderGeometry args={[0.42, 0.48, 4, 12]} />
                    <meshStandardMaterial color="#f5f1e8" />
                </mesh>
            ))}
            <mesh position={[0, 5.3, 0]}>
                <boxGeometry args={[14.6, 0.6, 8.6]} />
                <meshStandardMaterial color="#e7e2d6" flatShading />
            </mesh>
            <mesh geometry={gavl} position={[0, 5.6, 0]}>
                <meshStandardMaterial color="#d6cfc0" flatShading />
            </mesh>
        </group>
    );
}

const DOMMERE = Array.from({ length: 22 }, (_, i) => {
    const vinkel = Math.PI * 0.08 + (i / 21) * Math.PI * 0.84;
    const rad = i % 2 === 0 ? 7.5 : 9.3;
    return [Math.cos(vinkel) * rad, -Math.sin(vinkel) * rad] as [number, number];
});

function Domstol({ beat }: { beat: number }) {
    const farger = ['#7c2d12', '#57534e', '#1e3a8a', '#713f12', '#3f6212', '#44403c'];
    return (
        <group position={[0, 0, 8]}>
            {/* Steinbenker i en halvsirkel */}
            {[7.5, 9.3].map((r) => (
                <mesh key={r} position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry
                        args={[r - 0.5, r + 0.5, 32, 1, Math.PI * 0.04, Math.PI * 0.92]}
                    />
                    <meshStandardMaterial color="#d6cfc0" side={THREE.DoubleSide} />
                </mesh>
            ))}
            {DOMMERE.map(([x, z], i) => (
                <Figur
                    key={i}
                    pos={[x, 0.2, z]}
                    farge={farger[i % farger.length]}
                    retning={Math.atan2(-x, -z)}
                    hoyde={0.8}
                />
            ))}
            {/* Sokrates midt på plassen */}
            <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[1.3, 1.4, 0.24, 24]} />
                <meshStandardMaterial color="#e7e2d6" />
            </mesh>
            <Figur pos={[0, 0.24, 0]} farge="#f5f5f4" retning={0} hoyde={1.05} />
            <mesh position={[0, 2.12, 0.27]}>
                <boxGeometry args={[0.36, 0.3, 0.14]} />
                <meshStandardMaterial color="#e5e7eb" />
            </mesh>
            {beat === 1 && <Merke pos={[0, 3.3, 0]} tekst="Sokrates" />}
            {beat === 2 && <Merke pos={[0, 3.3, 0]} tekst="Nekter, men blir dømt" tone="rod" />}
            {beat === 3 && (
                <Merke pos={[0, 3.3, 0]} tekst="Å ikke tro: en forbrytelse" tone="rod" />
            )}
        </group>
    );
}

function Athen({ beat }: { beat: number }) {
    return (
        <>
            <color attach="background" args={['#f6c48b']} />
            <fog attach="fog" args={['#f6c48b', 70, 170]} />
            <ambientLight intensity={0.75} />
            <hemisphereLight args={['#fde68a', '#78350f', 0.5]} />
            <directionalLight position={[-20, 25, 15]} intensity={1.4} color="#fff1d6" />
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[320, 320]} />
                <meshStandardMaterial color="#c9a46c" />
            </mesh>
            <mesh position={[0, 4, -30]}>
                <cylinderGeometry args={[14, 22, 8, 10]} />
                <meshStandardMaterial color="#a8835a" flatShading />
            </mesh>
            <Tempel />
            {/* Hus i byen rundt */}
            {[
                [-26, -12],
                [-20, 2],
                [-30, 10],
                [22, -6],
                [28, 6],
                [20, 18],
                [-18, 22],
            ].map(([x, z]) => (
                <group key={`${x}${z}`} position={[x, 0, z]}>
                    <mesh position={[0, 1.5, 0]}>
                        <boxGeometry args={[4, 3, 3.4]} />
                        <meshStandardMaterial color="#efe6d2" />
                    </mesh>
                    <mesh position={[0, 3.2, 0]}>
                        <boxGeometry args={[4.4, 0.4, 3.8]} />
                        <meshStandardMaterial color="#b45309" />
                    </mesh>
                </group>
            ))}
            <Domstol beat={beat} />
            {beat === 0 && <Merke pos={[0, 17.5, -30]} tekst="Athen" tone="mork" />}
        </>
    );
}

/* ------------------------------------------------------------------ platået */

/** Tynn stav mellom to punkter (avstanden til månen). */
function Stav({ fra, til, farge }: { fra: THREE.Vector3; til: THREE.Vector3; farge: string }) {
    const { pos, quat, lengde } = useMemo(() => {
        const d = til.clone().sub(fra);
        const q = new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), d.clone().normalize());
        return { pos: fra.clone().add(til).multiplyScalar(0.5), quat: q, lengde: d.length() };
    }, [fra, til]);
    return (
        <mesh position={pos} quaternion={quat}>
            <cylinderGeometry args={[0.12, 0.12, lengde, 6]} />
            <meshBasicMaterial color={farge} />
        </mesh>
    );
}

const TAAKE = [
    [-22, 2, -16, 9],
    [-10, 0, -14, 8],
    [2, 1, -15, 9],
    [14, 0, -14, 8],
    [25, 2, -17, 9],
    [-16, 7, -26, 11],
    [0, 8, -28, 12],
    [17, 7, -26, 11],
    [-6, 3, -22, 9],
    [9, 4, -22, 9],
    [-28, 5, -24, 10],
    [29, 5, -24, 10],
] as const;

/** Målebåndet: et gult bånd fra kassa og innover mot kanten. */
function Maalebaand({ ende, playing }: { ende: number; playing: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const forste = useRef(true);
    useFrame((_, raw) => {
        const g = ref.current;
        if (!g) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        const mal = Math.max(0.01, BAAND_START - ende);
        g.scale.z = forste.current ? mal : damp(g.scale.z, mal, 2.2, dt);
        forste.current = false;
    });
    return (
        <>
            <mesh position={[0, 0.5, BAAND_START + 0.6]}>
                <boxGeometry args={[1.6, 1, 1.4]} />
                <meshStandardMaterial color="#facc15" />
            </mesh>
            <mesh position={[0, 0.5, BAAND_START + 0.6]} scale={[0.5, 0.5, 1.02]}>
                <cylinderGeometry args={[0.6, 0.6, 1.5, 16]} />
                <meshStandardMaterial color="#1f2937" />
            </mesh>
            <group ref={ref} position={[0, 0.06, BAAND_START]}>
                <mesh position={[0, 0, -0.5]}>
                    <boxGeometry args={[0.9, 0.08, 1]} />
                    <meshStandardMaterial
                        color="#fde047"
                        emissive="#ca8a04"
                        emissiveIntensity={0.3}
                    />
                </mesh>
            </group>
        </>
    );
}

function Plataa({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const visTing = (modus === 'grense' && beat >= 2) || modus === 'taake';
    const maalt = modus === 'grense' && beat >= 3;
    const baandEnde =
        modus === 'grense'
            ? beat >= 1
                ? 16
                : BAAND_START
            : modus === 'taake'
              ? beat >= 3
                  ? KANT
                  : 16
              : BAAND_START;
    const visBaand = modus !== 'samtale';
    const muren = modus === 'samtale' && beat === 1;
    const murRef = useRef<THREE.Mesh>(null);
    useFrame((_, raw) => {
        const m = murRef.current;
        if (!m) return;
        const dt = playing ? Math.min(raw, 0.05) : 0;
        m.scale.y = damp(m.scale.y, muren ? 1 : 0.001, 3, dt);
        if (!playing) m.scale.y = muren ? 1 : 0.001;
        m.visible = m.scale.y > 0.01;
    });

    const fig = useMemo(() => {
        if (modus !== 'samtale') return null;
        if (beat === 3) {
            return {
                a: [-1.2, 0, KANT + 3.5] as [number, number, number],
                b: [1.2, 0, KANT + 3.5] as [number, number, number],
                ra: Math.PI,
                rb: Math.PI,
            };
        }
        if (beat === 4) {
            return {
                a: [-1.2, 0, KANT + 3.5] as [number, number, number],
                b: [1.2, 0, KANT + 3.5] as [number, number, number],
                ra: Math.PI,
                rb: Math.PI,
            };
        }
        return {
            a: [-2.3, 0, 4] as [number, number, number],
            b: [2.3, 0, 4] as [number, number, number],
            ra: Math.PI / 2,
            rb: -Math.PI / 2,
        };
    }, [modus, beat]);

    return (
        <>
            <color attach="background" args={['#b4c9de']} />
            <fog
                attach="fog"
                args={['#d5dee8', modus === 'grense' ? 55 : 30, modus === 'grense' ? 150 : 90]}
            />
            <ambientLight intensity={0.8} />
            <hemisphereLight args={['#f8fafc', '#475569', 0.5]} />
            <directionalLight position={[15, 25, 20]} intensity={1.2} />

            {/* Platået */}
            <mesh position={[0, -5, (KANT + 46) / 2]}>
                <boxGeometry args={[64, 10, 46 - KANT]} />
                <meshStandardMaterial color="#8da577" flatShading />
            </mesh>
            {/* Kanten markert med en lys stripe */}
            <mesh position={[0, 0.03, KANT + 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[64, 0.6]} />
                <meshBasicMaterial color="#f1f5f9" />
            </mesh>
            {/* Tåkebunnen bak kanten */}
            <mesh position={[0, -2.5, -60]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[260, 100]} />
                <meshBasicMaterial color="#f1f5f9" />
            </mesh>
            {TAAKE.map(([x, y, z, r]) => (
                <mesh key={`${x}${z}`} position={[x, y, z]}>
                    <sphereGeometry args={[r, 18, 14]} />
                    <meshBasicMaterial
                        color="#f8fafc"
                        transparent
                        opacity={0.55}
                        depthWrite={false}
                    />
                </mesh>
            ))}

            {visBaand && <Maalebaand ende={baandEnde} playing={playing} />}
            {modus === 'taake' && beat >= 3 && (
                <mesh position={[0, 0.5, KANT + 0.5]}>
                    <boxGeometry args={[1.4, 1, 0.3]} />
                    <meshStandardMaterial color="#dc2626" />
                </mesh>
            )}

            {/* Ting vi kan måle */}
            {visTing && (
                <>
                    <mesh position={MAANE}>
                        <sphereGeometry args={[3, 24, 18]} />
                        <meshBasicMaterial color="#fef9c3" fog={false} />
                    </mesh>
                    <Stav fra={v(-12, 0.2, 20)} til={MAANE} farge="#ca8a04" />
                    <mesh position={[STEIN.x, 1, STEIN.z]}>
                        <dodecahedronGeometry args={[1.2, 0]} />
                        <meshStandardMaterial color="#78716c" flatShading />
                    </mesh>
                    <mesh position={[STEIN.x + 2, 1, STEIN.z]}>
                        <boxGeometry args={[0.25, 2, 0.25]} />
                        <meshStandardMaterial color="#facc15" />
                    </mesh>
                    {[
                        [0, 0],
                        [3, 1],
                        [-2.5, 2.5],
                        [1, 4],
                        [4, -2.5],
                    ].map(([x, z]) => (
                        <group key={`${x}${z}`} position={[HUS.x + x, 0, HUS.z + z]}>
                            <mesh position={[0, 0.7, 0]}>
                                <boxGeometry args={[1.8, 1.4, 1.4]} />
                                <meshStandardMaterial color="#b91c1c" />
                            </mesh>
                            <mesh position={[0, 1.6, 0]}>
                                <coneGeometry args={[1.3, 0.8, 4]} />
                                <meshStandardMaterial color="#1f2937" flatShading />
                            </mesh>
                        </group>
                    ))}
                </>
            )}

            {modus === 'grense' && beat >= 2 && (
                <>
                    <Merke
                        pos={[MAANE.x + 1, MAANE.y - 5, MAANE.z]}
                        tekst="Avstand til månen"
                        tone={maalt ? 'gronn' : 'vanlig'}
                    />
                    <Merke
                        pos={[STEIN.x, 3.6, STEIN.z]}
                        tekst="Alder på en stein"
                        tone={maalt ? 'gronn' : 'vanlig'}
                    />
                    <Merke
                        pos={[HUS.x - 2, 4.4, HUS.z + 1]}
                        tekst="Folketall i Norge"
                        tone={maalt ? 'gronn' : 'vanlig'}
                    />
                </>
            )}
            {modus === 'grense' && beat === 0 && (
                <>
                    <Merke pos={[0, 2, 24]} tekst="Det vi kan måle" tone="gronn" />
                    <Merke pos={[0, 8, -24]} tekst="Det fornuften ikke kan avgjøre" tone="mork" />
                </>
            )}
            {modus === 'grense' && beat === 1 && (
                <Merke pos={[0, 2.2, 22]} tekst="Målebåndet: her kan vi måle" />
            )}

            {/* Spørsmålene i tåka */}
            {modus === 'taake' && (beat === 1 || beat === 2) && (
                <>
                    <Merke
                        pos={[-9, 5.5, -18]}
                        tekst="Finnes det en gud?"
                        tone={beat === 2 ? 'vanlig' : 'mork'}
                    />
                    <Merke
                        pos={[8, 7.5, -24]}
                        tekst="Hva skjer etter døden?"
                        tone={beat === 2 ? 'vanlig' : 'mork'}
                    />
                    <Merke
                        pos={[2, 2.6, -14]}
                        tekst="Er det galt å lyve?"
                        tone={beat === 2 ? 'gull' : 'mork'}
                    />
                </>
            )}
            {modus === 'taake' && beat === 0 && (
                <Merke pos={[0, 1.5, KANT]} tekst="Kanten: her slutter målingene" />
            )}
            {modus === 'taake' && beat === 3 && (
                <Merke pos={[0, 2.4, KANT + 1]} tekst="Målebåndet rekker ikke lenger" tone="rod" />
            )}
            {modus === 'taake' && beat === 4 && (
                <>
                    <Figur pos={[0, 0, KANT + 1.6]} farge="#b45309" retning={Math.PI} hoyde={1.3} />
                    <Merke
                        pos={[0, 3.4, KANT + 1.6]}
                        tekst="Agnostiker: utenfor rekkevidde, ikke dumt"
                        tone="gull"
                    />
                </>
            )}

            {/* Samtalen */}
            {fig && (
                <>
                    <Figur pos={fig.a} farge="#0f766e" retning={fig.ra} hoyde={1.15} />
                    <Figur pos={fig.b} farge="#b45309" retning={fig.rb} hoyde={1.15} />
                </>
            )}
            {modus === 'samtale' && (
                <mesh ref={murRef} position={[0, 1.6, 4]} scale={[1, 0.001, 1]}>
                    <boxGeometry args={[0.5, 3.2, 3.2]} />
                    <meshStandardMaterial color="#64748b" flatShading />
                </mesh>
            )}
            {modus === 'samtale' && beat === 0 && (
                <>
                    <Merke pos={[-2.3, 3.4, 4]} tekst="Tror" tone="gronn" />
                    <Merke pos={[2.3, 3.4, 4]} tekst="Tror ikke" tone="gull" />
                </>
            )}
            {modus === 'samtale' && beat === 1 && (
                <Merke
                    pos={[0, 3.5, 4]}
                    tekst="Ingen kan bevise det, verken for eller mot"
                    tone="rod"
                />
            )}
            {modus === 'samtale' && beat === 2 && (
                <>
                    <Merke pos={[0, 4.3, 4]} tekst="1. Hva tror du?" />
                    <Merke pos={[0, 3.4, 4]} tekst="2. Kan man vite det?" />
                </>
            )}
            {modus === 'samtale' && beat === 3 && (
                <Merke pos={[0, 3.4, KANT + 1]} tekst="Mange svarer likt her" tone="gronn" />
            )}
            {modus === 'samtale' && beat === 4 && (
                <>
                    <Merke
                        pos={[0, 2, 7]}
                        tekst="Sammenligne gudsbilder: kan undersøkes"
                        tone="gronn"
                    />
                    <Merke pos={[0, 7, -20]} tekst="Finnes Gud? I tåka" tone="mork" />
                </>
            )}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    athen: [
        'Athen, 399 før vår tidsregning',
        'En gammel mann foran domstolen',
        'Anklaget for å ikke godta byens guder',
        'Å la være å tro var en forbrytelse',
    ],
    grense: [
        'Kant: noen spørsmål kan fornuften ikke avgjøre',
        'Et platå der vi kan måle',
        'Spørsmål vi kan måle oss fram til',
        'Alle som måler riktig, får samme svar',
    ],
    taake: [
        'Bak kanten ligger tåka',
        'Ingen måling kan avgjøre dem',
        'Også spørsmålet om rett og galt',
        'Ikke uviktig, bare utenfor målebåndet',
        'Ikke dumt, men utenfor rekkevidde',
    ],
    samtale: [
        'Når dere tror ulikt',
        'Der stopper samtalen',
        'Skill de to spørsmålene',
        'Et felles utgangspunkt',
        'Kan undersøkes, eller ligger i tåka?',
    ],
};

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    return (
        <>
            {modus === 'athen' ? (
                <Athen beat={beat} />
            ) : (
                <Plataa modus={modus} beat={beat} playing={playing} />
            )}
            <Kamera modus={modus} beat={beat} playing={playing} />
        </>
    );
}

export function AteismeTaake({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'grense';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 12, 50] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <AteismeOverskrift tekst={tekst} />
            {modus === 'athen' && beat === 0 && (
                <Oversiktskart
                    utsnitt={[
                        [22.6, 37.4],
                        [24.6, 38.6],
                    ]}
                    omrade={[
                        [12, 33],
                        [36, 46],
                    ]}
                    etikett="Athen i Hellas"
                    plassering="nede-venstre"
                />
            )}
        </div>
    );
}
