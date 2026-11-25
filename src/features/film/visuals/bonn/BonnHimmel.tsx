import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import { Brikke } from './Brikke';
import { QIBLA_GRADER } from './data';

/**
 * To mennesker ute en morgen. Den ene står på et bønneteppe og vender seg mot Mekka
 * (sørøst sett fra Norge). Den andre sitter i meditasjon og vender seg ikke mot noe.
 *
 * «aapning»: morgenen, kompasset og nåla mot Mekka, og buddhisten uten nål.
 * «sol»: sola går over himmelen, og de fem bønnetidene i islam står langs buen.
 * «kropp»: wudu, så stå, bøye seg og knele med pannen mot bakken, så sitte, og qibla.
 * «innover»: de to igjen. Nåla hos den ene, ingen nål hos den andre, og ringer som går innover.
 *
 * Nord er -z og øst er +x. Solbuen er en tegning av døgnet, ikke en målt solbane.
 */

type Modus = 'aapning' | 'sol' | 'kropp' | 'innover';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const RAD = Math.PI / 180;

/** Retningen mot Mekka fra Norge, som enhetsvektor i bakkeplanet. */
const QIBLA = v(Math.sin(QIBLA_GRADER * RAD), 0, -Math.cos(QIBLA_GRADER * RAD));
const QIBLA_Y = Math.atan2(QIBLA.x, QIBLA.z);

/** Buddhisten sitter her, med ansiktet mot vest-sørvest. */
const BUDDHIST = v(3.4, 0, -3.2);
/** Buddhisten vender seg mot kameraet i det vide bildet (ikke mot noe sted). */
const B_ROT = -1.78;
const B_FRAM = v(Math.sin(B_ROT), 0, Math.cos(B_ROT));
const B_SIDE = v(B_FRAM.z, 0, -B_FRAM.x);

function damp(a: number, b: number, k: number) {
    return a + (b - a) * k;
}

/* ---------- Kroppen ---------- */

interface Positur {
    hofte: number;
    torso: number;
    lar: number;
    kne: number;
    arm: number;
    spre: number;
}

const POSITUR: Record<string, Positur> = {
    sta: { hofte: 1.72, torso: 0, lar: 0, kne: 0, arm: -8 * RAD, spre: 0 },
    vask: { hofte: 1.72, torso: 18 * RAD, lar: 0, kne: 0, arm: -62 * RAD, spre: 0 },
    hender: { hofte: 1.72, torso: 0, lar: 0, kne: 0, arm: -32 * RAD, spre: 0 },
    buk: { hofte: 1.72, torso: 90 * RAD, lar: 0, kne: 0, arm: -70 * RAD, spre: 0 },
    sujud: {
        hofte: 0.95,
        torso: 122 * RAD,
        lar: -15 * RAD,
        kne: 105 * RAD,
        arm: -185 * RAD,
        spre: 0,
    },
    sitte: { hofte: 0.5, torso: 0, lar: -62 * RAD, kne: 152 * RAD, arm: -35 * RAD, spre: 0 },
    meditere: {
        hofte: 0.34,
        torso: 0,
        lar: -82 * RAD,
        kne: 150 * RAD,
        arm: -28 * RAD,
        spre: 38 * RAD,
    },
};

/** Rekkefølgen stå, bøye seg, knele. Den ender i knestående og blir der. */
function syklus(t: number): Positur {
    if (t < 1.2) return POSITUR.sta;
    if (t < 2.4) return POSITUR.buk;
    return POSITUR.sujud;
}

function Figur({
    positur,
    playing,
    syklusFra = null,
    klaer,
    hode,
    lue,
}: {
    positur: Positur;
    playing: boolean;
    /** Når satt: spill syklusen stå, bøye, knele (nøkkelstilling på pause). Nullstilles når verdien endres. */
    syklusFra?: number | null;
    klaer: string;
    hode: string;
    lue?: string;
}) {
    const rot = useRef<THREE.Group>(null);
    const torso = useRef<THREE.Group>(null);
    const armer = useRef<(THREE.Group | null)[]>([]);
    const lar = useRef<(THREE.Group | null)[]>([]);
    const kne = useRef<(THREE.Group | null)[]>([]);
    const na = useRef<Positur>({ ...positur });
    const tid = useRef(0);
    const sist = useRef<number | null>(null);
    useFrame((_, rawDt) => {
        const dt = Math.min(rawDt, 0.05);
        if (syklusFra !== sist.current) {
            sist.current = syklusFra;
            tid.current = 0;
        }
        tid.current += playing ? dt : 0;
        const mal = syklusFra !== null && playing ? syklus(tid.current) : positur;
        const k = playing ? 1 - Math.exp(-5 * dt) : 1;
        const p = na.current;
        (Object.keys(p) as (keyof Positur)[]).forEach((n) => {
            p[n] = damp(p[n], mal[n], k);
        });
        if (rot.current) rot.current.position.y = p.hofte;
        if (torso.current) torso.current.rotation.x = p.torso;
        armer.current.forEach((a) => {
            if (a) a.rotation.x = p.arm;
        });
        lar.current.forEach((l, i) => {
            if (!l) return;
            l.rotation.x = p.lar;
            l.rotation.y = (i === 0 ? 1 : -1) * p.spre;
        });
        kne.current.forEach((n) => {
            if (n) n.rotation.x = p.kne;
        });
    });
    return (
        <group ref={rot} position={[0, positur.hofte, 0]}>
            <group ref={torso}>
                <mesh position={[0, 0.5, 0]}>
                    <capsuleGeometry args={[0.26, 0.6, 8, 16]} />
                    <meshStandardMaterial color={klaer} />
                </mesh>
                <mesh position={[0, 1.3, 0]}>
                    <sphereGeometry args={[0.24, 32, 24]} />
                    <meshStandardMaterial color={hode} />
                </mesh>
                {lue && (
                    <mesh position={[0, 1.42, 0]}>
                        <sphereGeometry args={[0.245, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
                        <meshStandardMaterial color={lue} />
                    </mesh>
                )}
                {[-1, 1].map((s, i) => (
                    <group
                        key={s}
                        position={[s * 0.33, 0.92, 0]}
                        ref={(g) => {
                            armer.current[i] = g;
                        }}
                    >
                        <mesh position={[0, -0.4, 0]}>
                            <capsuleGeometry args={[0.085, 0.65, 6, 12]} />
                            <meshStandardMaterial color={klaer} />
                        </mesh>
                    </group>
                ))}
            </group>
            {[-1, 1].map((s, i) => (
                <group
                    key={s}
                    position={[s * 0.14, 0, 0]}
                    rotation-order="YXZ"
                    ref={(g) => {
                        lar.current[i] = g;
                    }}
                >
                    <mesh position={[0, -0.42, 0]}>
                        <capsuleGeometry args={[0.12, 0.6, 6, 12]} />
                        <meshStandardMaterial color={klaer} />
                    </mesh>
                    <group
                        position={[0, -0.85, 0]}
                        ref={(g) => {
                            kne.current[i] = g;
                        }}
                    >
                        <mesh position={[0, -0.42, 0]}>
                            <capsuleGeometry args={[0.1, 0.62, 6, 12]} />
                            <meshStandardMaterial color={klaer} />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    );
}

/* ---------- Kompasset på bakken ---------- */

function Kompass({ nal, lys, lang = false }: { nal: boolean; lys: boolean; lang?: boolean }) {
    return (
        <group>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
                <torusGeometry args={[2.4, 0.06, 8, 96]} />
                <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.4} />
            </mesh>
            {/* Nord */}
            <mesh position={[0, 0.05, -2.75]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.26, 3, Math.PI / 2]} />
                <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.4} />
            </mesh>
            {nal && (
                <group rotation={[0, QIBLA_Y, 0]}>
                    <mesh position={[0, 0.07, lang ? 3.4 : 1.6]}>
                        <boxGeometry args={[0.14, 0.05, lang ? 4.8 : 1.6]} />
                        <meshStandardMaterial
                            color="#dc2626"
                            emissive="#dc2626"
                            emissiveIntensity={lys ? 0.8 : 0.3}
                        />
                    </mesh>
                    <mesh position={[0, 0.07, lang ? 6.0 : 2.6]} rotation={[Math.PI / 2, 0, 0]}>
                        <coneGeometry args={[0.32, 0.6, 12]} />
                        <meshStandardMaterial
                            color="#dc2626"
                            emissive="#dc2626"
                            emissiveIntensity={lys ? 0.8 : 0.3}
                        />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/** Ringer som trekker seg inn mot den som mediterer. */
function Innover({ playing }: { playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const f = playing ? (tid.current * 0.4 + i / 3) % 1 : [0.15, 0.45, 0.75][i];
            const s = 2.4 * (1 - f) + 0.2;
            m.scale.set(s, s, 1);
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.opacity = Math.sin(f * Math.PI) * 0.9;
        });
    });
    return (
        <group position={[0, 0.9, 0]}>
            {[0, 1, 2].map((i) => (
                <mesh
                    key={i}
                    rotation={[Math.PI / 2, 0, 0]}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <torusGeometry args={[1, 0.04, 8, 64]} />
                    <meshStandardMaterial
                        color="#f59e0b"
                        emissive="#f59e0b"
                        emissiveIntensity={1}
                        transparent
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ---------- Sola og døgnet ---------- */

const SOL_R = 60;

/** Et punkt på solbuen. s = 0 i øst, 0,5 høyest i sør, 1 i vest. */
function solPunkt(s: number, vinter = false) {
    const h = vinter ? 20 : 34;
    const r = vinter ? 46 : SOL_R;
    return v(
        Math.cos(Math.PI * s) * r,
        Math.sin(Math.PI * s) * h + 2,
        Math.sin(Math.PI * s) * 22 + 6
    );
}

const TIDER = [
    { navn: 'Daggry', s: 0.02 },
    { navn: 'Midt på dagen', s: 0.5 },
    { navn: 'Ettermiddag', s: 0.73 },
    { navn: 'Solnedgang', s: 0.98 },
];
const NATT = v(-44, 24, -20);

function himmelFor(s: number) {
    const morgen = new THREE.Color('#f6b98b');
    const dag = new THREE.Color('#9fd0f0');
    const natt = new THREE.Color('#1e293b');
    if (s < 0) return natt;
    if (s > 1.04) return natt;
    const kant = Math.min(s, 1 - s);
    return morgen.clone().lerp(dag, Math.min(1, kant / 0.18));
}

function solFor(modus: Modus, beat: number, t: number, playing: boolean) {
    if (modus === 'sol') {
        if (beat === 2) return playing ? Math.min(0.5, t * 0.2) : 0.5;
        if (beat === 0) return 0.25;
        return 0.5;
    }
    if (modus === 'kropp') return 0.3;
    if (modus === 'innover') return 0.08;
    return 0.04;
}

/* ---------- Kamera ---------- */

interface Mal {
    pos: THREE.Vector3;
    se: THREE.Vector3;
}

const SIDE = v(QIBLA.z, 0, -QIBLA.x); // vinkelrett på qibla

function kamera(modus: Modus, beat: number, t: number): Mal {
    const vid = { pos: v(-7.5 - t * 0.1, 3.2, -5.5), se: v(2.2, 1.3, 0.8) };
    if (modus === 'aapning' || modus === 'innover') {
        if (beat === 0) return vid;
        if (beat === 1)
            return {
                pos: QIBLA.clone()
                    .multiplyScalar(-5.5)
                    .add(v(0, 4.4, 0))
                    .addScaledVector(SIDE, -2),
                se: QIBLA.clone()
                    .multiplyScalar(2)
                    .add(v(0, 0.4, 0)),
            };
        if (beat === 2 && modus === 'aapning')
            return {
                pos: QIBLA.clone()
                    .multiplyScalar(-4.5)
                    .add(v(0, 5.5, 0))
                    .addScaledVector(SIDE, 2.5),
                se: QIBLA.clone().multiplyScalar(3.6),
            };
        return {
            pos: BUDDHIST.clone()
                .addScaledVector(B_FRAM, 5.2)
                .add(v(0, 2.6 + t * 0.02, 0))
                .addScaledVector(B_SIDE, 1.2),
            se: BUDDHIST.clone().add(v(0, 0.6, 0)),
        };
    }
    if (modus === 'sol') {
        if (beat === 0) return { pos: v(-4, 2.6, -8 - t * 0.08), se: v(0, 1.4, 0) };
        return { pos: v(0, 9, -98), se: v(0, 17, 10) };
    }
    // kropp
    if (beat === 3)
        return {
            pos: QIBLA.clone()
                .multiplyScalar(-4)
                .add(v(0, 6.5, 0))
                .addScaledVector(SIDE, 3),
            se: QIBLA.clone().multiplyScalar(2.2),
        };
    return {
        pos: SIDE.clone()
            .multiplyScalar(-7)
            .add(v(0, 2.2, 0))
            .addScaledVector(QIBLA, 0.6),
        se: QIBLA.clone()
            .multiplyScalar(0.55)
            .add(v(0, 1.0, 0)),
    };
}

/* ---------- Scenen ---------- */

function Scene({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const beatTid = useRef(0);
    const forrige = useRef(-1);
    const se = useRef(new THREE.Vector3());
    const forste = useRef(true);
    const sol = useRef<THREE.Mesh>(null);
    const lys = useRef<THREE.DirectionalLight>(null);
    const bakgrunn = useRef<THREE.Color>(null);
    const take = useRef<THREE.Fog>(null);

    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        if (beat !== forrige.current) {
            forrige.current = beat;
            beatTid.current = 0;
        }
        beatTid.current += dt;
        const m = kamera(modus, beat, beatTid.current);
        if (forste.current || !playing) {
            camera.position.copy(m.pos);
            se.current.copy(m.se);
            forste.current = false;
        } else {
            const k = 1 - Math.exp(-1.3 * dt);
            camera.position.lerp(m.pos, k);
            se.current.lerp(m.se, k);
        }
        camera.lookAt(se.current);

        const s = solFor(modus, beat, beatTid.current, playing);
        const p = solPunkt(Math.min(Math.max(s, -0.05), 1.05));
        sol.current?.position.copy(p);
        lys.current?.position.copy(p);
        const farge = himmelFor(s);
        bakgrunn.current?.copy(farge);
        take.current?.color.copy(farge);
    });

    let positurA = POSITUR.sta;
    if (modus === 'kropp') {
        positurA =
            beat === 0
                ? POSITUR.vask
                : beat === 1
                  ? POSITUR.sujud
                  : beat === 2
                    ? POSITUR.sitte
                    : POSITUR.hender;
    } else if (modus === 'innover' || modus === 'aapning') {
        positurA = POSITUR.hender;
    }

    const visKompassA =
        (modus === 'aapning' && beat >= 1 && beat <= 2) ||
        (modus === 'innover' && beat <= 1) ||
        (modus === 'kropp' && beat === 3);
    const visKompassB = (modus === 'aapning' && beat === 3) || (modus === 'innover' && beat >= 2);
    const visTider = modus === 'sol' && beat >= 1;
    const visNavn = modus === 'sol' && beat === 3;
    const vinter = modus === 'sol' && beat === 4;

    const sommerBue = useMemo(() => Array.from({ length: 41 }, (_, i) => solPunkt(i / 40)), []);
    const vinterBue = useMemo(
        () => Array.from({ length: 41 }, (_, i) => solPunkt(i / 40, true)),
        []
    );

    return (
        <>
            <color ref={bakgrunn} attach="background" args={['#f6b98b']} />
            <fog ref={take} attach="fog" args={['#f6b98b', 90, 260]} />
            <hemisphereLight args={['#fff7ed', '#6b7d4f', 1.1]} />
            <directionalLight ref={lys} intensity={1.3} position={[40, 30, 10]} />
            <mesh ref={sol} position={[60, 2, 6]}>
                <sphereGeometry args={[4, 32, 24]} />
                <meshBasicMaterial color="#fbbf24" fog={false} />
            </mesh>
            {/* Bakken og noen åser */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[600, 600]} />
                <meshStandardMaterial color="#9aae73" />
            </mesh>
            {[
                [-80, -120, 40, 22],
                [30, -150, 55, 26],
                [140, -60, 45, 18],
                [-150, 20, 50, 20],
                [120, 160, 60, 10],
                [-90, 170, 50, 9],
            ].map(([x, z, r, h]) => (
                <mesh key={`${x}-${z}`} position={[x, h / 2 - 1, z]}>
                    <coneGeometry args={[r, h, 24]} />
                    <meshStandardMaterial color="#7f9161" flatShading />
                </mesh>
            ))}

            {/* Den som ber mot Mekka */}
            <group rotation={[0, QIBLA_Y, 0]}>
                <mesh position={[0, 0.02, 0.5]}>
                    <boxGeometry args={[1.2, 0.04, 2.6]} />
                    <meshStandardMaterial color="#166534" />
                </mesh>
                <mesh position={[0, 0.045, 0.5]}>
                    <boxGeometry args={[0.9, 0.02, 2.2]} />
                    <meshStandardMaterial color="#b91c1c" />
                </mesh>
                <Figur
                    positur={positurA}
                    playing={playing}
                    syklusFra={modus === 'kropp' && beat === 1 ? beat : null}
                    klaer="#f1f5f9"
                    hode="#a16207"
                    lue="#ffffff"
                />
                {modus === 'kropp' && beat === 0 && <Vask playing={playing} />}
            </group>
            {visKompassA && (
                <Kompass
                    nal
                    lys={(modus === 'innover' && beat === 1) || (modus === 'aapning' && beat >= 1)}
                    lang={(modus === 'kropp' && beat === 3) || (modus === 'aapning' && beat === 2)}
                />
            )}

            {/* Den som mediterer */}
            <group position={BUDDHIST} rotation={[0, B_ROT, 0]} visible={modus !== 'kropp'}>
                <mesh position={[0, 0.12, 0]}>
                    <cylinderGeometry args={[0.55, 0.6, 0.24, 24]} />
                    <meshStandardMaterial color="#7c2d12" />
                </mesh>
                <group position={[0, 0.0, 0]}>
                    <Figur
                        positur={POSITUR.meditere}
                        playing={playing}
                        klaer="#ea580c"
                        hode="#d4a373"
                    />
                </group>
                {visKompassB && <Kompass nal={false} lys={false} />}
                {modus === 'innover' && beat === 3 && <Innover playing={playing} />}
            </group>

            {modus === 'sol' && beat >= 1 && (
                <Line
                    points={sommerBue}
                    color="#fef3c7"
                    lineWidth={3}
                    transparent
                    opacity={vinter ? 0.5 : 0.9}
                />
            )}
            {vinter && (
                <Line
                    points={vinterBue}
                    color="#e0f2fe"
                    lineWidth={3}
                    dashed
                    dashSize={2}
                    gapSize={1.4}
                />
            )}
            {visTider &&
                TIDER.map((tt) => (
                    <mesh key={tt.navn} position={solPunkt(tt.s, vinter)}>
                        <sphereGeometry args={[1.3, 16, 12]} />
                        <meshBasicMaterial color="#f59e0b" fog={false} />
                    </mesh>
                ))}
            {visTider && (
                <mesh position={NATT}>
                    <sphereGeometry args={[1.6, 16, 12]} />
                    <meshBasicMaterial color="#e2e8f0" fog={false} />
                </mesh>
            )}
            {visTider &&
                modus === 'sol' &&
                (beat === 1 || beat === 2) &&
                [...TIDER.map((t) => solPunkt(t.s)), NATT].map((p, i) => (
                    <Html key={i} position={[p.x, p.y - 4.5, p.z]} center>
                        <Nummer n={i === 4 ? 5 : i + 1} />
                    </Html>
                ))}
            {visNavn &&
                [
                    ...TIDER.map((t) => ({ navn: t.navn, p: solPunkt(t.s) })),
                    { navn: 'Natt', p: NATT },
                ].map((m) => (
                    <Html key={m.navn} position={[m.p.x, m.p.y - 5, m.p.z]} center>
                        <Merke tekst={m.navn} />
                    </Html>
                ))}
            {vinter && (
                <>
                    <Html position={solPunkt(0.3).add(v(0, -4, 0))} center>
                        <Merke tekst="Sommer" />
                    </Html>
                    <Html position={solPunkt(0.5, true).add(v(0, -4.5, 0))} center>
                        <Merke tekst="Vinter" />
                    </Html>
                </>
            )}

            {modus === 'aapning' && beat === 2 && (
                <Html
                    position={QIBLA.clone()
                        .multiplyScalar(6.6)
                        .add(v(0, 0.3, 0))
                        .addScaledVector(SIDE, 1.6)}
                    center
                >
                    <Merke tekst="Mot Kaba i Mekka" gull />
                </Html>
            )}
            {modus === 'kropp' && beat === 3 && (
                <Html
                    position={QIBLA.clone()
                        .multiplyScalar(4.2)
                        .add(v(0, 0.4, 0))
                        .addScaledVector(SIDE, 0.9)}
                    center
                >
                    <Merke tekst="Qibla" gull />
                </Html>
            )}
            {modus === 'kropp' && beat === 0 && (
                <Html
                    position={QIBLA.clone()
                        .multiplyScalar(1.4)
                        .add(v(0, -0.3, 0))
                        .addScaledVector(SIDE, 0.2)}
                    center
                >
                    <Merke tekst="Wudu: vask først" />
                </Html>
            )}
            {((modus === 'aapning' && beat === 3) || (modus === 'innover' && beat === 2)) && (
                <Html
                    position={BUDDHIST.clone()
                        .addScaledVector(B_SIDE, -2.2)
                        .add(v(0, 0.4, 0))}
                    center
                >
                    <Merke tekst="Ingen nål" />
                </Html>
            )}
            {modus === 'innover' && beat === 1 && (
                <Html
                    position={QIBLA.clone()
                        .multiplyScalar(3.4)
                        .add(v(0, 0.5, 0))}
                    center
                >
                    <Merke tekst="Fra Norge: sørøst, mot Mekka" gull />
                </Html>
            )}
            {modus === 'innover' && beat === 3 && (
                <Html
                    position={BUDDHIST.clone()
                        .addScaledVector(B_SIDE, -2.2)
                        .add(v(0, 0.4, 0))}
                    center
                >
                    <Merke tekst="Innover" gull />
                </Html>
            )}
        </>
    );
}

/** Vannkrukke og dråper ved teppet. */
function Vask({ playing }: { playing: boolean }) {
    const refs = useRef<(THREE.Mesh | null)[]>([]);
    const tid = useRef(0);
    useFrame((_, rawDt) => {
        tid.current += playing ? Math.min(rawDt, 0.05) : 0;
        refs.current.forEach((m, i) => {
            if (!m) return;
            const f = playing ? (tid.current * 1.2 + i / 4) % 1 : [0.2, 0.45, 0.7, 0.9][i];
            m.position.set(0, 0.95 - f * 0.6, 1.15);
        });
    });
    return (
        <group>
            <mesh position={[0, 0.18, 1.15]}>
                <cylinderGeometry args={[0.32, 0.22, 0.32, 24]} />
                <meshStandardMaterial color="#475569" />
            </mesh>
            <mesh position={[0, 0.33, 1.15]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.3, 0.03, 8, 32]} />
                <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={0.4} />
            </mesh>
            {[0, 1, 2, 3].map((i) => (
                <mesh
                    key={i}
                    position={[0, 0.8, 1.15]}
                    ref={(m) => {
                        refs.current[i] = m;
                    }}
                >
                    <sphereGeometry args={[0.05, 12, 8]} />
                    <meshStandardMaterial
                        color="#38bdf8"
                        emissive="#0ea5e9"
                        emissiveIntensity={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

function Nummer({ n }: { n: number }) {
    return (
        <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center font-display font-black text-2xl text-amber-700">
            {n}
        </div>
    );
}

function Merke({ tekst, gull = false }: { tekst: string; gull?: boolean }) {
    return (
        <div
            className={`px-3 py-1 rounded-xl shadow-lg font-display font-bold text-2xl whitespace-nowrap ${
                gull ? 'bg-amber-500 text-slate-950' : 'bg-white/95 text-slate-900'
            }`}
        >
            {tekst}
        </div>
    );
}

const TEKST: Record<Modus, (string | null)[]> = {
    aapning: ['Tidlig morgen', 'Fem ganger i døgnet', 'Kaba i Mekka', 'En buddhist som mediterer'],
    sol: [
        'Jødedom, kristendom og islam: én Gud',
        'Islam: salah, fem ganger i døgnet',
        'Tidene står på himmelen',
        'Fem bønnetider',
        'Tidene følger sola, ikke klokka',
    ],
    kropp: [
        'Wudu',
        'Stå, bøye seg, knele',
        'Koranen på arabisk, og egne ord: dua',
        'Qibla: retningen mot Kaba',
    ],
    innover: [
        'To mennesker som ber',
        'Nåla mot Mekka',
        'Buddhisten: ingen nål',
        'Handlingen virker innover',
    ],
};

export function BonnHimmel({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'aapning';
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
                camera={{ fov: 42, near: 0.2, far: 800, position: [-7.5, 3.2, -5.5] }}
            >
                <Scene modus={modus} beat={beat} playing={playing} />
            </Canvas>
            <Brikke
                tekst={tekst}
                nokkel={`${modus}-${beat}`}
                tone={modus === 'innover' && beat === 3 ? 'gull' : 'lys'}
            />
        </div>
    );
}
