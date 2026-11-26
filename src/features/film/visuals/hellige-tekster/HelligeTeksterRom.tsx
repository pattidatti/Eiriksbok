import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { HtBrikke } from './HtBrikke';

/**
 * Bøker og reglene rundt dem, i 3D.
 *
 * «kveld»: en stor bok i et forsamlingshus blir lukket, båret på hodet og lagt i en seng i
 *          sitt eget rom. Så en bibel med gule tusjstreker ved en ryggsekk et annet sted.
 * «guru»: boka på plattformen. Ark samles inn i den (1604), plattformen løftes (1708),
 *         og folk sitter foran den. Guruene vises ikke som personer.
 * «regler»: Durkheims forklaring: Koranen på et stativ, torarullene i et skap på veggen og
 *           boka i sengen, hver med en ring rundt seg (satt til side).
 *
 * Stedene: plattformen ved origo, soverommet ved x = 7.5, ryggsekken ved x = -11,
 * stativet ved (-4, -6) og skapet på veggen ved (2, -8.5).
 */

type Modus = 'kveld' | 'guru' | 'regler';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function damp(a: number, b: number, k: number, dt: number) {
    return THREE.MathUtils.lerp(a, b, 1 - Math.exp(-k * dt));
}

const TEKST: Record<Modus, string[]> = {
    kveld: [
        'Kveld i et forsamlingshus',
        'Lukket, og båret på hodet',
        'Til sengs i sitt eget rom',
        'Et annet sted: en bibel med gul tusj',
        'Begge er hellige, men behandles ulikt',
    ],
    guru: [
        'Sikhismen: en bok som behandles som en person',
        '1604: Guru Arjan samler tekstene',
        '1708: boka skal lede sikhene',
        'Guru Granth Sahib',
        'Ingen kan overkjøre det som står i den',
    ],
    regler: [
        'Émile Durkheim, fransk forsker',
        'Satt til side, med regler rundt',
        'Koranen løftet opp på et stativ',
        'Torarullene i et skap på veggen mot Jerusalem',
        'Boka i sitt eget soverom',
    ],
};

const PLATTFORM = v(0, 0, 0);
const SENG = v(7.6, 0, -1.8);
const SEKK = v(-11, 0, 0);
const STATIV = v(-4, 0, -6);
const SKAP = v(2, 0, -8.5);

/** Personens vei fra plattformen inn i soverommet. */
const START = v(-1.5, 0, 1.3);
const VEI = [START, v(3.2, 0, 1.9), v(6.2, 0, 1.4), v(6.6, 0, -0.6)];

function langsVei(s: number) {
    const k = THREE.MathUtils.clamp(s, 0, 1) * (VEI.length - 1);
    const i = Math.min(Math.floor(k), VEI.length - 2);
    return VEI[i].clone().lerp(VEI[i + 1], k - i);
}

interface Kamera {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

function kameraFor(modus: Modus, beat: number, t: number): Kamera {
    if (modus === 'kveld') {
        switch (beat) {
            case 0:
                return { pos: v(-4 + t * 0.15, 3.2, 6.5), se: v(0, 0.8, 0) };
            case 1:
                return { pos: v(0.9, 2.5, 4.8), se: v(-0.7, 1.4, 0.6) };
            case 2:
                return { pos: v(3.4, 4.4, 8.6), se: v(5.6, 0.9, -0.6) };
            case 3:
                return { pos: v(-12.6 + t * 0.1, 2.9, 3.4), se: v(-10.8, 0.9, 0.1) };
            default:
                return { pos: v(-1.5, 10, 15), se: v(-1.5, 0.4, -1) };
        }
    }
    if (modus === 'guru') {
        switch (beat) {
            case 0:
                return { pos: v(-3.2, 2.8, 4.8), se: v(0, 0.9, 0) };
            case 1:
                return { pos: v(-2.2, 2.4, 3.8), se: v(0, 1.1, 0) };
            case 2:
                return { pos: v(2.8, 2.2, 4.4), se: v(0, 1.2, 0) };
            case 3:
                return { pos: v(0.4, 1.9, 3.4), se: v(0, 1.3, 0) };
            default:
                return { pos: v(2.8, 6, 11), se: v(3.6, 0.8, -0.6) };
        }
    }
    switch (beat) {
        case 0:
            return { pos: v(1.5 + t * 0.1, 6.5, 8.5), se: v(1.8, 0.8, -4.5) };
        case 1:
            return { pos: v(1.5, 7, 8), se: v(1.8, 0.6, -4.5) };
        case 2:
            return { pos: v(-4.2, 2.3, -2.8), se: v(-4, 0.8, -6) };
        case 3:
            return { pos: v(2.2, 2.2, -4.6), se: v(2, 1.6, -8.4) };
        default:
            return { pos: v(7.6, 2.8, 2.4), se: v(7.6, 0.5, -1.8) };
    }
}

/* ---------- Ting ---------- */

const HALV = 0.55;
const TYKK = 0.09;

/** En bok med lokk som kan lukkes. `lokkRef` roteres rundt ryggen (0 = åpen, -PI = lukket). */
function Bok({
    farge,
    gul = false,
    lokkRef,
    skala = 1,
}: {
    farge: string;
    gul?: boolean;
    lokkRef?: React.RefObject<THREE.Group | null>;
    skala?: number;
}) {
    const halvdel = (tusj: boolean) => (
        <group>
            <mesh position={[0, -TYKK * 0.35, 0]}>
                <boxGeometry args={[HALV, TYKK * 0.3, 0.8]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, TYKK * 0.15, 0]}>
                <boxGeometry args={[HALV * 0.96, TYKK * 0.7, 0.76]} />
                <meshStandardMaterial color="#fbf7ec" />
            </mesh>
            {tusj &&
                [-0.22, -0.06, 0.12].map((z) => (
                    <mesh key={z} position={[0, TYKK * 0.52, z]}>
                        <boxGeometry args={[HALV * 0.7, 0.012, 0.06]} />
                        <meshStandardMaterial
                            color="#facc15"
                            emissive="#facc15"
                            emissiveIntensity={0.3}
                        />
                    </mesh>
                ))}
        </group>
    );
    return (
        <group scale={skala}>
            <group position={[HALV / 2, TYKK / 2, 0]}>{halvdel(gul)}</group>
            <group ref={lokkRef} position={[0, TYKK, 0]}>
                <group position={[-HALV / 2, -TYKK / 2, 0]}>{halvdel(gul)}</group>
            </group>
        </group>
    );
}

/** En enkel person. Armene peker opp når `armer` er 1, ned når 0. */
function Person({
    farge,
    sitter = false,
    armRefs,
}: {
    farge: string;
    sitter?: boolean;
    armRefs?: React.RefObject<(THREE.Group | null)[]>;
}) {
    const kropp = sitter ? 0.7 : 1.15;
    const hode = sitter ? 1.15 : 1.78;
    return (
        <group>
            <mesh position={[0, kropp / 2 + (sitter ? 0 : 0.02), 0]}>
                <cylinderGeometry args={[0.24, 0.3, kropp, 20]} />
                <meshStandardMaterial color={farge} />
            </mesh>
            <mesh position={[0, hode - 0.2, 0]}>
                <sphereGeometry args={[0.2, 32, 24]} />
                <meshStandardMaterial color="#c08457" />
            </mesh>
            {!sitter &&
                [-1, 1].map((side, i) => (
                    <group
                        key={side}
                        position={[side * 0.3, 1.38, 0]}
                        ref={(g) => {
                            if (armRefs?.current) armRefs.current[i] = g;
                        }}
                    >
                        <mesh position={[0, -0.32, 0]}>
                            <cylinderGeometry args={[0.07, 0.07, 0.64, 12]} />
                            <meshStandardMaterial color={farge} />
                        </mesh>
                    </group>
                ))}
        </group>
    );
}

function Plattform({ hoydeRef }: { hoydeRef: React.RefObject<THREE.Group | null> }) {
    return (
        <group position={PLATTFORM.toArray()}>
            <mesh position={[0, -0.01, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6, 5]} />
                <meshStandardMaterial color="#7f1d1d" />
            </mesh>
            <group ref={hoydeRef}>
                <mesh position={[0, 0.3, 0]}>
                    <boxGeometry args={[2.4, 0.6, 1.7]} />
                    <meshStandardMaterial color="#e2c290" />
                </mesh>
                <mesh position={[0, 0.62, 0]}>
                    <boxGeometry args={[2.6, 0.05, 1.9]} />
                    <meshStandardMaterial color="#ea580c" />
                </mesh>
            </group>
        </group>
    );
}

function Soverom() {
    const [x, , z] = SENG.toArray();
    return (
        <group>
            <mesh position={[x, 0.005, z + 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[5, 4.2]} />
                <meshStandardMaterial color="#d6c4a8" />
            </mesh>
            <mesh position={[x, 1.5, z - 1.3]}>
                <boxGeometry args={[5, 3, 0.15]} />
                <meshStandardMaterial color="#f1e4cf" />
            </mesh>
            <mesh position={[x - 2.5, 1.5, z + 0.8]}>
                <boxGeometry args={[0.15, 3, 4.2]} />
                <meshStandardMaterial color="#e9dac0" />
            </mesh>
            <mesh position={[x + 2.5, 1.5, z + 0.8]}>
                <boxGeometry args={[0.15, 3, 4.2]} />
                <meshStandardMaterial color="#e9dac0" />
            </mesh>
            {/* Sengen */}
            <mesh position={[x, 0.22, z]}>
                <boxGeometry args={[1.5, 0.44, 2.1]} />
                <meshStandardMaterial color="#92400e" />
            </mesh>
            <mesh position={[x, 0.5, z]}>
                <boxGeometry args={[1.36, 0.14, 1.96]} />
                <meshStandardMaterial color="#fff7ed" />
            </mesh>
            <mesh position={[x, 0.62, z - 0.72]}>
                <boxGeometry args={[0.9, 0.14, 0.4]} />
                <meshStandardMaterial color="#fde68a" />
            </mesh>
        </group>
    );
}

function Sekk() {
    const [x, , z] = SEKK.toArray();
    return (
        <group>
            <mesh position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[5, 4]} />
                <meshStandardMaterial color="#64748b" />
            </mesh>
            <mesh position={[x, 0.45, z]}>
                <boxGeometry args={[2.2, 0.9, 1.2]} />
                <meshStandardMaterial color="#a16207" />
            </mesh>
            {/* Ryggsekken ligger åpen på pulten, med bibelen i åpningen */}
            <group position={[x, 0.9, z]} rotation={[0, 0.2, 0]}>
                <mesh position={[0, 0.2, 0]}>
                    <boxGeometry args={[1.5, 0.4, 0.95]} />
                    <meshStandardMaterial color="#15803d" />
                </mesh>
                <mesh position={[-0.95, 0.12, 0]} rotation={[0, 0, 0.5]}>
                    <boxGeometry args={[0.5, 0.06, 0.92]} />
                    <meshStandardMaterial color="#166534" />
                </mesh>
                <mesh position={[0.35, 0.41, 0]}>
                    <boxGeometry args={[0.7, 0.02, 0.8]} />
                    <meshStandardMaterial color="#052e16" />
                </mesh>
                <group position={[0.3, 0.46, 0.02]} rotation={[0, 0, 0.12]}>
                    <Bok farge="#111827" gul skala={0.95} />
                </group>
            </group>
        </group>
    );
}

function Stativ() {
    const [x, , z] = STATIV.toArray();
    return (
        <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
            <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[3.2, 3]} />
                <meshStandardMaterial color="#166534" />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[1.4, 0.5, 1.0]} />
                <meshStandardMaterial color="#78350f" />
            </mesh>
            {/* Et X-formet stativ, sett fra siden */}
            {[-1, 1].map((s) => (
                <mesh key={s} position={[0, 0.82, s * 0.16]} rotation={[s * 0.75, 0, 0]}>
                    <boxGeometry args={[0.9, 0.05, 0.75]} />
                    <meshStandardMaterial color="#b45309" />
                </mesh>
            ))}
            {[-1, 1].map((s) => (
                <group key={s} position={[0, 1.07, s * 0.26]} rotation={[s * 0.75, 0, 0]}>
                    <mesh>
                        <boxGeometry args={[0.8, 0.07, 0.5]} />
                        <meshStandardMaterial color="#fbf7ec" />
                    </mesh>
                    <mesh position={[0, -0.05, 0]}>
                        <boxGeometry args={[0.84, 0.03, 0.54]} />
                        <meshStandardMaterial color="#065f46" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

function Skap({ dorRefs }: { dorRefs: React.RefObject<(THREE.Group | null)[]> }) {
    const [x, , z] = SKAP.toArray();
    return (
        <group position={[x, 0, z]}>
            <mesh position={[0, 1.8, -0.2]}>
                <boxGeometry args={[6, 3.6, 0.2]} />
                <meshStandardMaterial color="#e7dcc8" />
            </mesh>
            <mesh position={[0, 1.7, 0.15]}>
                <boxGeometry args={[1.7, 1.9, 0.5]} />
                <meshStandardMaterial color="#5b3a1e" />
            </mesh>
            <mesh position={[0, 1.7, 0.41]}>
                <boxGeometry args={[1.45, 1.65, 0.02]} />
                <meshStandardMaterial color="#1e3a8a" />
            </mesh>
            {[-0.3, 0.3].map((sx) => (
                <group key={sx} position={[sx, 1.65, 0.55]}>
                    <mesh>
                        <cylinderGeometry args={[0.16, 0.16, 1.15, 20]} />
                        <meshStandardMaterial color="#f5deb3" />
                    </mesh>
                    {[-0.66, 0.66].map((y) => (
                        <mesh key={y} position={[0, y, 0]}>
                            <cylinderGeometry args={[0.05, 0.05, 0.2, 10]} />
                            <meshStandardMaterial color="#d4a017" />
                        </mesh>
                    ))}
                </group>
            ))}
            {/* Dørene, hengslet i ytterkanten */}
            {[-1, 1].map((s, i) => (
                <group
                    key={s}
                    position={[s * 0.85, 1.7, 0.42]}
                    ref={(g) => {
                        dorRefs.current[i] = g;
                    }}
                >
                    <mesh position={[-s * 0.42, 0, 0.04]}>
                        <boxGeometry args={[0.84, 1.86, 0.06]} />
                        <meshStandardMaterial color="#7c4a21" />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

/** En gyllen ring på gulvet rundt noe som er satt til side. */
function Ring({ pos, r, synlig }: { pos: THREE.Vector3; r: number; synlig: boolean }) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame((_, delta) => {
        const m = ref.current;
        if (!m) return;
        const s = damp(m.scale.x, synlig ? 1 : 0.001, 4, Math.min(delta, 0.05));
        m.scale.set(s, s, 1);
        m.visible = s > 0.02;
    });
    return (
        <mesh
            ref={ref}
            position={[pos.x, 0.03, pos.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[0.001, 0.001, 1]}
        >
            <ringGeometry args={[r, r + 0.14, 48]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.9} />
        </mesh>
    );
}

const ARK = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2;
    return v(Math.cos(a) * 2.6, 1.6 + (i % 3) * 0.45, Math.sin(a) * 2.0 + 0.4);
});

/* ---------- Scenen ---------- */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const forste = useRef(true);
    const lokk = useRef<THREE.Group>(null);
    const bok = useRef<THREE.Group>(null);
    const person = useRef<THREE.Group>(null);
    const armer = useRef<(THREE.Group | null)[]>([]);
    const hoyde = useRef<THREE.Group>(null);
    const dorer = useRef<(THREE.Group | null)[]>([]);
    const ark = useRef<(THREE.Mesh | null)[]>([]);
    const glod = useRef<THREE.Mesh>(null);
    const mal = useMemo(() => ({ pos: v(0, 0, 0), se: v(0, 0, 0) }), []);
    const se = useRef(v(0, 0, 0));

    useFrame(({ camera }, delta) => {
        const dt = playing ? Math.min(delta, 0.05) : 0;
        if (forrige.current !== beat) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        // På pause står bildet i nøkkelstillingen for beaten (guiden §3c punkt 49).
        const t = playing
            ? beatTid.current
            : modus === 'guru' && beat === 1
              ? 0.9
              : modus === 'guru' && beat === 4
                ? 2.6
                : 99;

        // Kamera
        const k = kameraFor(modus, beat, playing ? beatTid.current : 2);
        mal.pos.copy(k.pos);
        mal.se.copy(k.se);
        if (forste.current) {
            camera.position.copy(mal.pos);
            se.current.copy(mal.se);
            forste.current = false;
        } else {
            const kk = playing ? 1 - Math.exp(-1.3 * dt) : 1;
            camera.position.lerp(mal.pos, kk);
            se.current.lerp(mal.se, kk);
        }
        camera.lookAt(se.current);

        // Plattformen løftes i guru-modus fra 1708.
        const loft = modus === 'guru' && beat >= 2 ? 1.6 : 1;
        if (hoyde.current) {
            const s = hoyde.current.scale.y;
            hoyde.current.scale.y = playing ? damp(s, loft, 3, dt) : loft;
        }
        const topp = 0.65 * (hoyde.current?.scale.y ?? 1);

        // Boka: åpen på plattformen, lukket på hodet, eller lukket i sengen.
        let lukket = 0;
        const bokPos = v(PLATTFORM.x, topp, PLATTFORM.z);
        const personPos = START.clone();
        let armOpp = 0;
        const baerer = (modus === 'kveld' && beat >= 2) || (modus === 'guru' && beat === 4);
        if (modus === 'kveld' && beat === 1) {
            {
                lukket = THREE.MathUtils.clamp(t / 1.4, 0, 1);
                const l = THREE.MathUtils.clamp((t - 1.6) / 1.4, 0, 1);
                personPos.lerp(v(-1.0, 0, 1.0), Math.min(t / 1.2, 1));
                const hode = personPos.clone().add(v(0, 2.02, 0));
                bokPos.lerp(hode, l);
                armOpp = l;
            }
        } else if (baerer) {
            {
                lukket = 1;
                const gaar = beat === 2 || modus === 'guru';
                const gaa = THREE.MathUtils.clamp(t / 4, 0, 1);
                personPos.copy(gaar ? langsVei(gaa) : VEI[VEI.length - 1]);
                const legg = gaar ? THREE.MathUtils.clamp((t - 4.2) / 1.2, 0, 1) : 1;
                const hode = personPos.clone().add(v(0, 2.02, 0));
                bokPos.copy(hode).lerp(v(SENG.x, 0.62, SENG.z + 0.25), legg);
                armOpp = 1 - legg;
            }
        } else if (modus === 'regler') {
            lukket = 1;
            bokPos.set(SENG.x, 0.62, SENG.z + 0.25);
            personPos.set(-30, 0, 0);
        } else if (modus !== 'kveld') {
            personPos.set(-30, 0, 0);
        }
        if (lokk.current) lokk.current.rotation.z = -Math.PI * lukket;
        bok.current?.position.copy(bokPos);
        if (person.current) {
            person.current.position.copy(personPos);
            person.current.visible = personPos.x > -20;
            // Snu personen i gåretningen.
            if (baerer && (beat === 2 || modus === 'guru') && t < 4) {
                const nest = langsVei(Math.min(t / 4 + 0.02, 1));
                person.current.rotation.y = Math.atan2(nest.x - personPos.x, nest.z - personPos.z);
            } else if (baerer) {
                person.current.rotation.y = Math.PI;
            } else {
                person.current.rotation.y = 2.3;
            }
        }
        armer.current.forEach((a, i) => {
            if (!a) return;
            a.rotation.z = (i === 0 ? -1 : 1) * Math.PI * 0.82 * armOpp;
        });

        // Ark som samles inn i boka (1604).
        ark.current.forEach((m, i) => {
            if (!m) return;
            const vis = modus === 'guru' && beat === 1;
            const f = THREE.MathUtils.clamp(((((t - i * 0.12) % 2.6) + 2.6) % 2.6) / 1.8, 0, 1);
            m.visible = vis && f < 1;
            m.position.copy(ARK[i]).lerp(v(0, topp + 0.1, 0), f);
            m.rotation.set(-1.2 + f, i, 0.3);
        });

        // Glød rundt boka når den blir leder.
        if (glod.current) {
            const vis = modus === 'guru' && beat >= 2;
            glod.current.visible = vis;
            glod.current.position.set(0, topp + 0.02, 0);
        }

        // Skapdørene åpnes.
        const apen = modus === 'regler' && beat === 3 ? 1 : 0;
        dorer.current.forEach((d, i) => {
            if (!d) return;
            const mal2 = (i === 0 ? -1 : 1) * 1.9 * apen;
            d.rotation.y = playing ? damp(d.rotation.y, mal2, 3, dt) : mal2;
        });
    });

    const ringer = modus === 'regler' && beat >= 1;
    return (
        <>
            <color attach="background" args={['#2a2138']} />
            <fog attach="fog" args={['#2a2138', 20, 48]} />
            <ambientLight intensity={0.75} color="#fff1dc" />
            <hemisphereLight args={['#fde7c4', '#3b2a1e', 0.6]} />
            <directionalLight position={[6, 12, 8]} intensity={1.5} />
            <pointLight position={[0, 3.2, 1.5]} intensity={14} distance={9} color="#ffd59a" />
            <pointLight position={[7.6, 2.6, -0.5]} intensity={10} distance={7} color="#ffe2b0" />
            <pointLight position={[-11, 2.6, 1.2]} intensity={10} distance={7} color="#fff3d6" />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -2]}>
                <planeGeometry args={[46, 34]} />
                <meshStandardMaterial color="#6b4f36" />
            </mesh>

            <group visible={modus !== 'regler'}>
                <Plattform hoydeRef={hoyde} />
            </group>
            <Soverom />
            {modus === 'kveld' && <Sekk />}
            <group visible={modus === 'regler'}>
                <Stativ />
                <Skap dorRefs={dorer} />
            </group>

            <group ref={bok}>
                <Bok farge="#9a3412" lokkRef={lokk} skala={1.25} />
            </group>
            <mesh ref={glod} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <ringGeometry args={[1.05, 1.25, 48]} />
                <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={1} />
            </mesh>

            <group ref={person}>
                <Person farge="#1e40af" armRefs={armer} />
            </group>

            {modus === 'guru' &&
                beat >= 4 &&
                [-1.5, -0.5, 0.5, 1.5].map((x) => (
                    <group key={x} position={[x, 0, 2.5]} rotation={[0, Math.PI, 0]}>
                        <Person farge={x < 0 ? '#0f766e' : '#7c2d12'} sitter />
                    </group>
                ))}

            {ARK.map((_, i) => (
                <mesh
                    key={i}
                    ref={(m) => {
                        ark.current[i] = m;
                    }}
                    visible={false}
                >
                    <planeGeometry args={[0.36, 0.48]} />
                    <meshStandardMaterial color="#fffbeb" side={THREE.DoubleSide} />
                </mesh>
            ))}

            <Ring pos={STATIV} r={1.25} synlig={ringer} />
            <Ring pos={v(SKAP.x, 0, SKAP.z + 0.9)} r={1.2} synlig={ringer} />
            <Ring pos={SENG} r={1.6} synlig={ringer} />
        </>
    );
}

/** Små kort nederst i bildet, der et ord trenger et merke. */
function kort(modus: Modus, beat: number): { tekst: string; side: 'v' | 'h' }[] {
    if (modus === 'kveld' && beat === 4)
        return [
            { tekst: 'Bibel i ryggsekken', side: 'v' },
            { tekst: 'Bok i sin egen seng', side: 'h' },
        ];
    if (modus === 'guru' && beat === 2)
        return [{ tekst: 'Ingen flere guruer av kjøtt og blod', side: 'v' }];
    if (modus === 'regler' && beat === 3)
        return [{ tekst: 'Veggen vender mot Jerusalem', side: 'v' }];
    if (modus === 'regler' && beat === 0)
        return [
            { tekst: 'Stativet', side: 'v' },
            { tekst: 'Skapet og sengen', side: 'h' },
        ];
    return [];
}

export function HelligeTeksterRom({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kveld';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [-4, 3, 6] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <HtBrikke tekst={tekst} tone="mork" nokkel={`${modus}-${beat}`} />
            {kort(modus, beat).map((k) => (
                <div
                    key={k.tekst}
                    className="absolute bottom-[6%] px-4 py-2 rounded-xl bg-white/95 text-slate-900 font-bold text-2xl shadow-lg pointer-events-none"
                    style={k.side === 'v' ? { left: '4%' } : { right: '4%' }}
                >
                    {k.tekst}
                </div>
            ))}
        </div>
    );
}
