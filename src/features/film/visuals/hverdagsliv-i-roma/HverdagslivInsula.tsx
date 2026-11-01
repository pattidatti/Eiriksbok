import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'framer-motion';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';

/**
 * En romersk leiegård (insula) i 3D. «gate»: en trang gate mellom høye hus, og en bøtte med
 * kloakk fra et vindu. «domus»: et rikmannshus med atrium og søylegård ved siden av en insula.
 * «etasjer»: leiegården med forveggen tatt bort, butikker nederst og trangest øverst.
 * «brann»: samme snitt, med en brann som sprer seg oppover og røyk i trappa.
 */

type Modus = 'gate' | 'domus' | 'etasjer' | 'brann';

const ETASJE = 3;
const ETASJER = 5;
const TOPP = ETASJE * ETASJER;
/** Leiegården: x fra -7 til 7, z fra -5 til 5. Gata ligger foran (z 5 til 11). */
const BX = 7;
const BZ = 5;
/** Trappesjakta inne i huset, langs høyre vegg. */
const TRAPP_X0 = 4.6;
const TRAPP_X1 = 6.8;

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function damp(a: number, b: number, l: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-l * dt));
}

function kameraFor(modus: Modus, beat: number, t: number) {
    if (modus === 'gate') {
        switch (beat) {
            case 0:
                return { pos: v(-20 + t * 0.5, 1.8, 8), se: v(8, 4, 8) };
            case 1:
                return { pos: v(-7, 1.8, 9), se: v(1, 11, 4) };
            case 2:
                return { pos: v(-4, 2, 10), se: v(1, 11.5, 5) };
            default:
                return { pos: v(7, 12.5, 10.4), se: v(1, 13, 5) };
        }
    }
    if (modus === 'domus') {
        switch (beat) {
            case 0:
                return { pos: v(-16 + t * 0.3, 20, 24), se: v(-16, 1, 0) };
            case 1:
                return { pos: v(-15, 17, 13), se: v(-16, 1, -1) };
            case 2:
                return { pos: v(-6, 9, 36), se: v(0, 7, 0) };
            default:
                return { pos: v(18 - t * 0.2, 7, 28), se: v(8, 8, 0) };
        }
    }
    if (modus === 'etasjer') {
        switch (beat) {
            case 0:
                return { pos: v(12 - t * 0.3, 9, 32), se: v(0, 7.5, 0) };
            case 1:
                return { pos: v(3, 4, 15), se: v(-0.5, 1.6, 0) };
            case 2:
                return { pos: v(16, 9, 20), se: v(5, 7.5, 0) };
            case 3:
                return { pos: v(3, 12, 30), se: v(0, 8.5, 0) };
            default:
                return { pos: v(-10, 11, 27), se: v(0, 10, 0) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(0, 17, 44), se: v(0, 7, 0) };
        case 1:
            return { pos: v(9, 8, 27), se: v(0, 7, 0) };
        case 2:
            return { pos: v(16, 9, 20), se: v(5, 7.5, 0) };
        default:
            return { pos: v(2, 15.5, 18), se: v(-0.5, 13.4, 0) };
    }
}

/** Merkelapper som DOM over lerretet, festet til et punkt i 3D. */
interface Merke {
    tekst: string;
    pos: THREE.Vector3;
    farge?: string;
}
const MERKER: Record<Modus, Merke[][]> = {
    gate: [
        [],
        [],
        [{ tekst: 'Kloakk!', pos: v(-1.6, 9.5, 6), farge: '#7c2d12' }],
        [{ tekst: 'Billigst øverst', pos: v(1, 14.6, 5.2), farge: '#b91c1c' }],
    ],
    domus: [
        [{ tekst: 'Domus', pos: v(-16, 6, 0) }],
        [
            { tekst: 'Atrium', pos: v(-16, 5, 2.8) },
            { tekst: 'Søylegård', pos: v(-16, 5, -3.4) },
        ],
        [
            { tekst: 'Domus', pos: v(-16, 6, 0) },
            { tekst: 'Insula', pos: v(8, TOPP + 2, 0) },
        ],
        [{ tekst: 'Mange leiligheter', pos: v(8, TOPP + 1.8, 0) }],
    ],
    etasjer: [
        [{ tekst: 'Murstein og betong', pos: v(-7.5, 9, 3) }],
        [
            { tekst: 'Butikk', pos: v(-4.5, 2.3, 3.4) },
            { tekst: 'Verksted', pos: v(1.2, 2.3, 3.4) },
        ],
        [
            { tekst: 'Felles trapp', pos: v(5.7, 10.2, 5) },
            { tekst: 'Lys fra gata', pos: v(0, 7.6, 7) },
        ],
        [{ tekst: 'Billigst og dårligst', pos: v(-1, 14.4, 4.5), farge: '#b91c1c' }],
        [{ tekst: 'I dag: ofte den dyreste', pos: v(-1, 14.4, 4.5), farge: '#0f766e' }],
    ],
    brann: [
        [{ tekst: 'Tett i tett', pos: v(7.4, TOPP + 1.5, 0) }],
        [],
        [{ tekst: 'Lang vei ned', pos: v(5.7, 11, 5), farge: '#1d4ed8' }],
        [{ tekst: 'Verst øverst', pos: v(-1, 14.4, 4.5), farge: '#b91c1c' }],
    ],
};

const OVERSKRIFT: Record<Modus, string[]> = {
    gate: [
        'En gate i Roma',
        'Høye hus på begge sider',
        'Se opp!',
        'Øverst: de billigste leilighetene',
    ],
    domus: [
        'Domus: et hus for én familie',
        'Atrium og søylegård',
        'Insula betyr «øy»',
        'Insula: en leiegård',
    ],
    etasjer: [
        'Fem etasjer eller mer',
        'Gatenivå: butikker og verksteder',
        'Felles trapp',
        'Billigst øverst',
        'I dag er det omvendt',
    ],
    brann: ['Tett bygd, dårlig bygd', 'Farlig å komme seg ut', 'Ingen heis', 'Verst øverst'],
};

/** Naboblokker: [x, z, bredde, dybde, høyde, farge]. Fasaden vender mot gata (+z eller -z). */
type Blokk = [number, number, number, number, number, string];
const NORD: Blokk[] = [
    [-15.5, 0, 15, 10, 13, '#c98b5a'],
    [15.5, 0, 15, 10, 16, '#b8754a'],
    [-31, 0, 15, 10, 12, '#d29a6a'],
    [31, 0, 15, 10, 14, '#bf7f52'],
];
const SOR: Blokk[] = [
    [-24, 16, 15, 10, 14, '#c4865a'],
    [-8, 16, 15, 10, 15, '#b97a4e'],
    [8, 16, 15, 10, 12, '#cf9566'],
    [24, 16, 15, 10, 16, '#bc7c50'],
];

function vindusMatriser(blokker: Blokk[], mot: 1 | -1) {
    const m: THREE.Matrix4[] = [];
    for (const [x, z, b, d, h] of blokker) {
        const fz = z + (mot * d) / 2 + mot * 0.06;
        for (let y = ETASJE + 1.5; y < h - 0.5; y += ETASJE) {
            for (let i = 0; i < 4; i++) {
                const wx = x - b / 2 + (b / 4) * (i + 0.5);
                m.push(
                    new THREE.Matrix4().compose(
                        v(wx, y, fz),
                        new THREE.Quaternion(),
                        v(1.1, 1.5, 0.12)
                    )
                );
            }
        }
        // Butikkåpninger på gatenivå
        for (let i = 0; i < 3; i++) {
            const wx = x - b / 2 + (b / 3) * (i + 0.5);
            m.push(
                new THREE.Matrix4().compose(
                    v(wx, 1.2, fz),
                    new THREE.Quaternion(),
                    v(2.6, 2.4, 0.12)
                )
            );
        }
    }
    return m;
}

function Instanser({ matriser, farge }: { matriser: THREE.Matrix4[]; farge: string }) {
    const ref = useRef<THREE.InstancedMesh>(null);
    useEffect(() => {
        const im = ref.current;
        if (!im) return;
        matriser.forEach((m, i) => im.setMatrixAt(i, m));
        im.instanceMatrix.needsUpdate = true;
    }, [matriser]);
    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, matriser.length]}
            frustumCulled={false}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshLambertMaterial color={farge} />
        </instancedMesh>
    );
}

function Blokker({ blokker, mot }: { blokker: Blokk[]; mot: 1 | -1 }) {
    const vinduer = useMemo(() => vindusMatriser(blokker, mot), [blokker, mot]);
    return (
        <group>
            {blokker.map(([x, z, b, d, h, farge]) => (
                <group key={`${x},${z}`}>
                    <mesh position={[x, h / 2, z]}>
                        <boxGeometry args={[b - 0.3, h, d]} />
                        <meshLambertMaterial
                            color={farge}
                            emissive="#3a2414"
                            emissiveIntensity={0.25}
                        />
                    </mesh>
                    <mesh position={[x, h + 0.25, z]}>
                        <boxGeometry args={[b - 0.1, 0.5, d + 0.2]} />
                        <meshLambertMaterial color="#9a4a2a" />
                    </mesh>
                </group>
            ))}
            <Instanser matriser={vinduer} farge="#3b2a20" />
        </group>
    );
}

/** Leiegården sett utenfra, med vinduer mot gata. */
function InsulaHel({
    x = 0,
    vindu,
}: {
    x?: number;
    vindu?: React.RefObject<THREE.MeshLambertMaterial | null>;
}) {
    const vinduer = useMemo(() => {
        const m: THREE.Matrix4[] = [];
        for (let k = 1; k < ETASJER; k++) {
            for (let i = 0; i < 5; i++) {
                const wx = x - BX + (14 / 5) * (i + 0.5);
                if (k === ETASJER - 1 && i === 2) continue;
                m.push(
                    new THREE.Matrix4().compose(
                        v(wx, k * ETASJE + 1.5, BZ + 0.06),
                        new THREE.Quaternion(),
                        v(1.1, 1.5, 0.12)
                    )
                );
            }
        }
        for (let i = 0; i < 3; i++) {
            const wx = x - BX + (14 / 3) * (i + 0.5);
            m.push(
                new THREE.Matrix4().compose(
                    v(wx, 1.2, BZ + 0.06),
                    new THREE.Quaternion(),
                    v(3, 2.4, 0.12)
                )
            );
        }
        return m;
    }, [x]);
    return (
        <group>
            <mesh position={[x, TOPP / 2, 0]}>
                <boxGeometry args={[BX * 2, TOPP, BZ * 2]} />
                <meshLambertMaterial color="#c47a48" emissive="#3a2414" emissiveIntensity={0.25} />
            </mesh>
            {Array.from({ length: ETASJER - 1 }, (_, k) => (
                <mesh key={k} position={[x, (k + 1) * ETASJE, BZ + 0.1]}>
                    <boxGeometry args={[BX * 2 + 0.2, 0.25, 0.3]} />
                    <meshLambertMaterial color="#e2d6bc" />
                </mesh>
            ))}
            <mesh position={[x, TOPP + 0.3, 0]}>
                <boxGeometry args={[BX * 2 + 0.3, 0.6, BZ * 2 + 0.3]} />
                <meshLambertMaterial color="#9a4a2a" />
            </mesh>
            <Instanser matriser={vinduer} farge="#3b2a20" />
            {/* Vinduet øverst som åpnes */}
            <mesh position={[x + 1.4, (ETASJER - 1) * ETASJE + 1.5, BZ + 0.08]}>
                <boxGeometry args={[1.1, 1.5, 0.12]} />
                <meshLambertMaterial
                    ref={vindu}
                    color="#3b2a20"
                    emissive="#f59e0b"
                    emissiveIntensity={0}
                />
            </mesh>
        </group>
    );
}

/** Leiegården med forveggen tatt bort: etasjeskiller, rom, senger, butikker og trapp. */
function InsulaSnitt() {
    const trinn = useMemo(() => {
        const m: THREE.Matrix4[] = [];
        for (let k = 0; k < ETASJER - 1; k++) {
            const fram = k % 2 === 0;
            for (let s = 0; s < 6; s++) {
                const z = fram ? 3.6 - s * 1.2 : -3.6 + s * 1.2;
                m.push(
                    new THREE.Matrix4().compose(
                        v((TRAPP_X0 + TRAPP_X1) / 2, k * ETASJE + (s + 1) * 0.5 - 0.25, z),
                        new THREE.Quaternion(),
                        v(2.1, 0.5, 1.2)
                    )
                );
            }
        }
        return m;
    }, []);
    const krukker = useMemo(() => {
        const m: THREE.Matrix4[] = [];
        [-5.6, -4.8, -4].forEach((x) =>
            m.push(
                new THREE.Matrix4().compose(
                    v(x, 0.6, -3.6),
                    new THREE.Quaternion(),
                    v(0.6, 1.2, 0.6)
                )
            )
        );
        [-1.8, -1.1, 3.2].forEach((x) =>
            m.push(
                new THREE.Matrix4().compose(v(x, 0.5, -3.8), new THREE.Quaternion(), v(0.5, 1, 0.5))
            )
        );
        return m;
    }, []);
    const rom = 4.4 + 6.8;
    return (
        <group>
            {/* Bakvegg og sidevegger */}
            <mesh position={[0, TOPP / 2, -BZ + 0.2]}>
                <boxGeometry args={[BX * 2, TOPP, 0.4]} />
                <meshLambertMaterial color="#d9a77c" emissive="#3a2414" emissiveIntensity={0.2} />
            </mesh>
            {[-BX + 0.2, BX - 0.2].map((x) => (
                <mesh key={x} position={[x, TOPP / 2, 0]}>
                    <boxGeometry args={[0.4, TOPP, BZ * 2]} />
                    <meshLambertMaterial
                        color="#c47a48"
                        emissive="#3a2414"
                        emissiveIntensity={0.25}
                    />
                </mesh>
            ))}
            {/* Kanten av den bortskårne forveggen: murstein med betong utenpå */}
            {[-BX + 0.3, BX - 0.3].map((x) => (
                <mesh key={`k${x}`} position={[x, TOPP / 2, BZ - 0.2]}>
                    <boxGeometry args={[0.6, TOPP, 0.4]} />
                    <meshLambertMaterial color="#e2d6bc" />
                </mesh>
            ))}
            {/* Vegg mellom rommene og trapperommet */}
            <mesh position={[TRAPP_X0 - 0.2, TOPP / 2, -1]}>
                <boxGeometry args={[0.25, TOPP, 7.6]} />
                <meshLambertMaterial color="#e8d3b5" />
            </mesh>
            {/* Etasjeskiller */}
            {Array.from({ length: ETASJER + 1 }, (_, k) => (
                <mesh key={k} position={[0, k * ETASJE, 0]}>
                    <boxGeometry args={[BX * 2, k === 0 ? 0.1 : 0.3, BZ * 2]} />
                    <meshLambertMaterial color={k === ETASJER ? '#9a4a2a' : '#cdbb9b'} />
                </mesh>
            ))}
            {/* Rom: jo høyere opp, jo flere og trangere */}
            {Array.from({ length: ETASJER }, (_, k) => {
                const n = k === 0 ? 3 : k + 1;
                const bredde = rom / n;
                return Array.from({ length: n }, (_, i) => {
                    const x0 = -6.8 + bredde * i;
                    return (
                        <group key={`${k}-${i}`}>
                            {i > 0 && (
                                <mesh position={[x0, k * ETASJE + 1.5, -1]}>
                                    <boxGeometry args={[0.2, ETASJE - 0.3, 7.6]} />
                                    <meshLambertMaterial color="#e8d3b5" />
                                </mesh>
                            )}
                            {k === 0 ? (
                                <mesh position={[x0 + bredde / 2, 0.55, 3.2]}>
                                    <boxGeometry args={[bredde - 1, 1.1, 0.9]} />
                                    <meshLambertMaterial color="#8b5a2b" />
                                </mesh>
                            ) : (
                                <mesh position={[x0 + bredde / 2, k * ETASJE + 0.4, -3]}>
                                    <boxGeometry args={[Math.min(1.8, bredde - 0.6), 0.5, 1.6]} />
                                    <meshLambertMaterial color={k >= 3 ? '#7c6a58' : '#a0522d'} />
                                </mesh>
                            )}
                        </group>
                    );
                });
            })}
            <Instanser matriser={trinn} farge="#a1866a" />
            <Instanser matriser={krukker} farge="#b45f30" />
        </group>
    );
}

/** Rikmannshuset: lave vegger, tak rundt to åpninger (atrium foran, søylegård bak). */
const cx = -16;

function Domus() {
    const søyler = useMemo(() => {
        const p: [number, number][] = [];
        for (let i = 0; i < 5; i++) {
            p.push([cx - 4 + i * 2, -1.4], [cx - 4 + i * 2, -5.2]);
        }
        p.push([cx - 4, -3.3], [cx + 4, -3.3]);
        return p;
    }, []);
    const tak = '#b4532a';
    return (
        <group>
            {/* Yttervegger */}
            <mesh position={[cx, 1.8, 6]}>
                <boxGeometry args={[16, 3.6, 0.4]} />
                <meshLambertMaterial color="#efe3cc" emissive="#4a3f30" emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[cx, 1.8, -6]}>
                <boxGeometry args={[16, 3.6, 0.4]} />
                <meshLambertMaterial color="#efe3cc" emissive="#4a3f30" emissiveIntensity={0.2} />
            </mesh>
            {[cx - 8, cx + 8].map((x) => (
                <mesh key={x} position={[x, 1.8, 0]}>
                    <boxGeometry args={[0.4, 3.6, 12]} />
                    <meshLambertMaterial
                        color="#efe3cc"
                        emissive="#4a3f30"
                        emissiveIntensity={0.2}
                    />
                </mesh>
            ))}
            {/* Takflater rundt atriet (foran) og søylegården (bak) */}
            <mesh position={[cx, 3.8, 5]}>
                <boxGeometry args={[16.4, 0.4, 2.4]} />
                <meshLambertMaterial color={tak} />
            </mesh>
            <mesh position={[cx, 3.8, 0.2]}>
                <boxGeometry args={[16.4, 0.4, 1.6]} />
                <meshLambertMaterial color={tak} />
            </mesh>
            <mesh position={[cx, 3.8, -6.1]}>
                <boxGeometry args={[16.4, 0.4, 0.6]} />
                <meshLambertMaterial color={tak} />
            </mesh>
            {[-1, 1].map((s) => (
                <group key={s}>
                    <mesh position={[cx + s * 5.6, 3.8, 2.4]}>
                        <boxGeometry args={[5.2, 0.4, 2.8]} />
                        <meshLambertMaterial color={tak} />
                    </mesh>
                    <mesh position={[cx + s * 6.6, 3.8, -3.3]}>
                        <boxGeometry args={[3.2, 0.4, 5]} />
                        <meshLambertMaterial color={tak} />
                    </mesh>
                </group>
            ))}
            {/* Atriet: gulv og vannbasseng */}
            <mesh position={[cx, 0.06, 2.4]}>
                <boxGeometry args={[6, 0.12, 2.8]} />
                <meshLambertMaterial color="#e7dcc4" />
            </mesh>
            <mesh position={[cx, 0.14, 2.4]}>
                <boxGeometry args={[2.6, 0.1, 1.4]} />
                <meshLambertMaterial color="#3d7fa8" emissive="#1d4a68" emissiveIntensity={0.5} />
            </mesh>
            {/* Søylegården: hage og søyler */}
            <mesh position={[cx, 0.06, -3.3]}>
                <boxGeometry args={[10, 0.12, 5]} />
                <meshLambertMaterial color="#5f8f3a" emissive="#1c2a10" emissiveIntensity={0.3} />
            </mesh>
            {søyler.map(([x, z]) => (
                <mesh key={`${x},${z}`} position={[x, 1.8, z]}>
                    <cylinderGeometry args={[0.22, 0.26, 3.6, 8]} />
                    <meshLambertMaterial color="#f8f5ec" />
                </mesh>
            ))}
        </group>
    );
}

const FLAMMER: [number, number, number, number][] = [
    // x, y, z, etasje
    [-4.6, 0.9, 1.5, 0],
    [-2.6, 0.9, 0.5, 0],
    [1.3, 0.9, 1.4, 0],
    [-4.8, 3.9, 0.5, 1],
    [-0.8, 3.9, 1.2, 1],
    [2.6, 3.9, 0, 1],
    [-3.5, 6.9, 0.8, 2],
    [0.6, 6.9, 0.2, 2],
];

function Brann({ beat, tid }: { beat: number; tid: React.RefObject<number> }) {
    const flammer = useRef<(THREE.Mesh | null)[]>([]);
    const røyk = useRef<THREE.InstancedMesh>(null);
    const lys = useRef<THREE.PointLight>(null);
    const nivå = beat === 0 ? 0 : beat === 1 ? 1 : 2;
    const tetthet = useRef(0);
    const ANTALL = 40;
    const tmp = useMemo(() => new THREE.Object3D(), []);
    useFrame((_, rawDt) => {
        const t = tid.current;
        const dt = Math.min(rawDt, 0.05);
        flammer.current.forEach((m, i) => {
            if (!m) return;
            const [, , , etasje] = FLAMMER[i];
            const på = etasje <= nivå && (beat > 0 || i === 0);
            const mål = på ? 1 + 0.18 * Math.sin(t * 9 + i * 1.7) : 0.001;
            const s = damp(m.scale.x, mål, 3, dt);
            m.scale.set(s, s * (1 + 0.25 * Math.sin(t * 7 + i)), s);
        });
        tetthet.current = damp(tetthet.current, beat === 0 ? 0.25 : 1, 1.5, dt);
        if (lys.current)
            lys.current.intensity = (6 + 2 * Math.sin(t * 11)) * (0.3 + tetthet.current);
        const im = røyk.current;
        if (im) {
            for (let i = 0; i < ANTALL; i++) {
                const iTrapp = i % 2 === 0;
                const fart = 1.3 + (i % 5) * 0.15;
                const høyde = TOPP + 4;
                const y = (t * fart + i * 1.37) % høyde;
                const x = iTrapp ? 5.7 + Math.sin(i * 3.1 + t) * 0.5 : -5 + ((i * 2.3) % 9);
                const z = iTrapp ? Math.cos(i * 1.9) * 2 : -3 + ((i * 1.1) % 4);
                const skala =
                    (0.5 + (y / høyde) * 1.6) * (i < ANTALL * tetthet.current ? 1 : 0.001);
                tmp.position.set(x, y + 0.5, z);
                tmp.scale.setScalar(skala);
                tmp.updateMatrix();
                im.setMatrixAt(i, tmp.matrix);
            }
            im.instanceMatrix.needsUpdate = true;
        }
    });
    return (
        <group>
            {FLAMMER.map(([x, y, z], i) => (
                <mesh
                    key={i}
                    position={[x, y, z]}
                    ref={(m) => {
                        flammer.current[i] = m;
                    }}
                    scale={0.001}
                >
                    <coneGeometry args={[0.9, 1.8, 7]} />
                    <meshBasicMaterial color={i % 2 ? '#f97316' : '#facc15'} />
                </mesh>
            ))}
            <pointLight
                ref={lys}
                position={[-1, 2, 3]}
                color="#fb923c"
                distance={22}
                intensity={6}
            />
            <instancedMesh ref={røyk} args={[undefined, undefined, ANTALL]} frustumCulled={false}>
                <sphereGeometry args={[0.7, 10, 8]} />
                <meshLambertMaterial color="#57534e" transparent opacity={0.4} />
            </instancedMesh>
        </group>
    );
}

/** Lysende markering av en etasje eller trappa. */
function Markering({
    mål,
    pos,
    str,
    farge,
}: {
    mål: number;
    pos: [number, number, number];
    str: [number, number, number];
    farge: string;
}) {
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((_, rawDt) => {
        if (mat.current)
            mat.current.opacity = damp(mat.current.opacity, mål, 3, Math.min(rawDt, 0.05));
    });
    return (
        <mesh position={pos}>
            <boxGeometry args={str} />
            <meshBasicMaterial ref={mat} color={farge} transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}

function Kloakk({ beat, tid }: { beat: number; tid: React.RefObject<number> }) {
    const gruppe = useRef<THREE.Group>(null);
    const start = useRef(0);
    const forrige = useRef(-1);
    useFrame(() => {
        const g = gruppe.current;
        if (!g) return;
        if (beat !== forrige.current) {
            forrige.current = beat;
            start.current = tid.current;
        }
        const t = (tid.current - start.current + 1) % 2.6;
        const synlig = beat === 2 && t > 0.6;
        g.visible = synlig;
        const ft = Math.max(0, t - 0.6);
        const y = Math.max(0.2, 12.6 - 4.9 * ft * ft * 1.4);
        g.position.set(1.4, y, BZ + 0.6 + ft * 0.5);
        g.scale.setScalar(y <= 0.2 ? 2.6 : 1.6);
    });
    return (
        <>
            {beat === 2 && (
                /* Bøtta som tømmes ut av vinduet */
                <mesh position={[1.4, 13.1, BZ + 0.7]} rotation={[0.9, 0, 0]}>
                    <cylinderGeometry args={[0.5, 0.38, 0.8, 10]} />
                    <meshLambertMaterial color="#8b5a2b" />
                </mesh>
            )}
            <group ref={gruppe} visible={false}>
                {[0, 1, 2, 3, 4].map((i) => (
                    <mesh
                        key={i}
                        position={[Math.sin(i * 2) * 0.3, i * 0.25, Math.cos(i * 2) * 0.2]}
                    >
                        <sphereGeometry args={[0.45 - i * 0.05, 7, 6]} />
                        <meshBasicMaterial color={i % 2 ? '#65a30d' : '#4d3a12'} />
                    </mesh>
                ))}
            </group>
        </>
    );
}

function Merkelapper({
    merker,
    refs,
}: {
    merker: Merke[];
    refs: React.RefObject<(HTMLDivElement | null)[]>;
}) {
    const { camera, size } = useThree();
    const tmp = useMemo(() => new THREE.Vector3(), []);
    useFrame(() => {
        merker.forEach((m, i) => {
            const el = refs.current[i];
            if (!el) return;
            tmp.copy(m.pos).project(camera);
            const bak = tmp.z > 1;
            const x = (tmp.x * 0.5 + 0.5) * size.width;
            const y = (-tmp.y * 0.5 + 0.5) * size.height;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
            el.style.visibility = bak ? 'hidden' : 'visible';
        });
    });
    return null;
}

function Scene({
    modus,
    beat,
    playing,
    merker,
    refs,
}: {
    modus: Modus;
    beat: number;
    playing: boolean;
    merker: Merke[];
    refs: React.RefObject<(HTMLDivElement | null)[]>;
}) {
    const tid = useRef(0);
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const vindu = useRef<THREE.MeshLambertMaterial>(null);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        tid.current += dt;
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
        if (vindu.current)
            vindu.current.emissiveIntensity = damp(
                vindu.current.emissiveIntensity,
                beat >= 2 ? 0.9 : 0,
                3,
                Math.max(dt, 0.016)
            );
    });
    const snitt = modus === 'etasjer' || modus === 'brann';
    const himmel = modus === 'brann' ? '#e8c9a8' : '#d8e6ee';
    const toppFarge = modus === 'etasjer' && beat >= 4 ? '#14b8a6' : '#ef4444';
    const toppPå = (modus === 'etasjer' && beat >= 3) || (modus === 'brann' && beat >= 3);
    const trappPå = beat === 2 && snitt;
    return (
        <>
            <color attach="background" args={[himmel]} />
            <fog attach="fog" args={[himmel, 60, 170]} />
            <ambientLight intensity={0.7} color="#f4ede0" />
            <directionalLight position={[30, 50, 40]} intensity={1.2} color="#fff1dc" />
            <hemisphereLight args={['#e6eef2', '#6b5a40', 0.5]} />
            <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[220, 0.1, 220]} />
                <meshLambertMaterial color="#cbb894" />
            </mesh>
            {modus !== 'domus' && (
                <mesh position={[0, 0.02, 8]}>
                    <boxGeometry args={[220, 0.06, 6]} />
                    <meshLambertMaterial color="#9a9081" />
                </mesh>
            )}
            {modus === 'domus' ? (
                <>
                    <Domus />
                    <group position={[8, 0, 0]}>
                        <InsulaHel />
                    </group>
                </>
            ) : (
                <>
                    {snitt ? <InsulaSnitt /> : <InsulaHel vindu={vindu} />}
                    <Blokker blokker={NORD} mot={1} />
                    {modus === 'gate' && <Blokker blokker={SOR} mot={-1} />}
                </>
            )}
            {modus === 'gate' && <Kloakk beat={beat} tid={tid} />}
            {modus === 'brann' && <Brann beat={beat} tid={tid} />}
            {modus === 'etasjer' && (
                <Markering
                    mål={beat === 1 ? 0.28 : 0}
                    pos={[-1.1, 1.5, 0]}
                    str={[11.2, 2.8, 9.6]}
                    farge="#facc15"
                />
            )}
            {snitt && (
                <>
                    <Markering
                        mål={trappPå ? 0.3 : 0}
                        pos={[5.7, TOPP / 2, 0]}
                        str={[2.3, TOPP - 0.4, 9.6]}
                        farge="#3b82f6"
                    />
                    <Markering
                        mål={toppPå ? 0.3 : 0}
                        pos={[-1.1, 13.5, 0]}
                        str={[11.2, 2.8, 9.6]}
                        farge={toppFarge}
                    />
                </>
            )}
            <Merkelapper merker={merker} refs={refs} />
        </>
    );
}

export function HverdagslivInsula({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'gate';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    const merker = MERKER[modus][Math.min(beat, MERKER[modus].length - 1)];
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 50, near: 0.3, far: 400, position: [-20, 2, 8] }}
                gl={{ antialias: true }}
            >
                <Scene modus={modus} beat={beat} playing={playing} merker={merker} refs={refs} />
            </Canvas>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {merker.map((m, i) => (
                    <div
                        key={`${beat}-${m.tekst}`}
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        className="absolute left-0 top-0 px-3 py-1 rounded-xl bg-white/95 font-bold text-xl shadow-lg whitespace-nowrap"
                        style={{ color: m.farge ?? '#0f172a', visibility: 'hidden' }}
                    >
                        {m.tekst}
                    </div>
                ))}
            </div>
            <div className="absolute top-[6%] inset-x-0 flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/90 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
