import { useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { guessTier } from '../../../../components/microgames/kit/quality';
import type { VisualProps } from '../../types';
import {
    BeatKamera,
    FigurKropp,
    Merker,
    type KameraMaal,
    type MerkeData,
    type MerkeHandle,
} from './NavFigur';
import { damp, tilSkjerm, useBeatTid, v3 } from './navFelles3d';
import { NavMerke, NavOverskrift } from './NavFelles';

/**
 * Nav-kontoret i 3D.
 * - ko: tre mennesker kommer inn og stiller seg i samme kø: mannen som mistet jobben, den
 *   unge moren og gutten på 22.
 * - luker: fire luker for fire ordninger. Folk går til den luka som passer for dem. Gutten
 *   blir stående igjen (han hører til en annen scene).
 * - kontor: utenfor. Aetat og trygdeetaten blir til Nav i 2006, og sosialhjelpen kommer til.
 */

type Modus = 'ko' | 'luker' | 'kontor';

const FARGE = {
    mann: '#1e3a8a',
    mor: '#b45309',
    gutt: '#15803d',
    syk: '#7c3aed',
    ufor: '#64748b',
};

const OVERSKRIFT: Record<Modus, string[]> = {
    ko: [
        'Mandag morgen på Nav-kontoret',
        'Mannen i femtiårene',
        'Den unge moren',
        'Gutten på 22',
        'Tre ulike problemer. Samme kø.',
    ],
    luker: [
        'Mange ordninger, ulike problemer',
        'Mistet jobben: dagpenger',
        'Fått barn: foreldrepenger',
        'For syk til å jobbe: sykepenger',
        'Kan ikke jobbe fullt igjen: uføretrygd',
        'Uføretrygd: først behandling og tiltak',
    ],
    kontor: [
        'En etat: en del av staten med en bestemt jobb',
        '1. juli 2006: Nav',
        'Sosialhjelpen kommer til',
        'Alt på ett sted',
    ],
};

/* ---------- Innendørs: kontoret ---------- */

const LUKER = [
    { x: -9, navn: 'Dagpenger', farge: '#0d9488' },
    { x: -3, navn: 'Foreldrepenger', farge: '#db2777' },
    { x: 3, navn: 'Sykepenger', farge: '#2563eb' },
    { x: 9, navn: 'Uføretrygd', farge: '#475569' },
];

const DOR = { x: -11, z: 4 };
const KO = [
    { x: 1.2, z: 2.4 },
    { x: -0.4, z: 2.4 },
    { x: -2.0, z: 2.4 },
];

interface Maal {
    x: number;
    z: number;
    synlig: boolean;
}

/** Hvor hver figur skal stå: mann, mor, gutt, syk, ufør. */
function maalInne(modus: 'ko' | 'luker', beat: number, t: number): Maal[] {
    const luke = (i: number) => ({ x: LUKER[i].x, z: -2.3, synlig: true });
    const ute = { x: DOR.x, z: DOR.z, synlig: false };
    if (modus === 'ko') {
        // Beat 0: de kommer inn fra døra, én etter én.
        const inn = (i: number): Maal =>
            beat === 0 && t < 0.4 + i * 0.6
                ? { x: DOR.x, z: DOR.z, synlig: true }
                : { ...KO[i], synlig: true };
        return [inn(0), inn(1), inn(2), ute, ute];
    }
    const m: Maal[] = [
        beat >= 1 ? luke(0) : { ...KO[0], synlig: true },
        beat >= 2 ? luke(1) : { ...KO[1], synlig: true },
        { ...KO[2], synlig: true },
        beat >= 3 ? luke(2) : ute,
        beat >= 4 ? luke(3) : ute,
    ];
    return m;
}

function kameraInne(modus: 'ko' | 'luker') {
    return (beat: number, t: number): KameraMaal => {
        if (modus === 'ko') {
            switch (beat) {
                case 0:
                    return { pos: v3(4 - t * 0.2, 6, 14), se: v3(-2, 1, 1) };
                case 1:
                    return { pos: v3(3.4, 2.6, 6.6), se: v3(1.2, 1.4, 2.4) };
                case 2:
                    return { pos: v3(1.6, 2.6, 6.8), se: v3(-0.4, 1.3, 2.4) };
                case 3:
                    return { pos: v3(0, 2.6, 7), se: v3(-2, 1.3, 2.4) };
                default:
                    return { pos: v3(7, 7, 13), se: v3(-0.5, 0.8, 1) };
            }
        }
        if (beat === 0) return { pos: v3(0, 6.5, 15.5), se: v3(0, 1.6, -1) };
        const fokus = beat >= 5 ? 3 : Math.min(beat, 4) - 1;
        const x = LUKER[fokus].x * 0.3;
        return { pos: v3(x, 6, 15), se: v3(x, 1.4, -1.5) };
    };
}

function Rom() {
    return (
        <>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[34, 22]} />
                <meshStandardMaterial color="#d6d3d1" emissive="#78716c" emissiveIntensity={0.08} />
            </mesh>
            <mesh position={[0, 3, -5]}>
                <boxGeometry args={[34, 6, 0.3]} />
                <meshStandardMaterial color="#f5f5f4" />
            </mesh>
            <mesh position={[-13, 3, 3]}>
                <boxGeometry args={[0.3, 6, 16]} />
                <meshStandardMaterial color="#e7e5e4" />
            </mesh>
            {/* Døra i venstre vegg */}
            <mesh position={[-12.8, 1.4, DOR.z]}>
                <boxGeometry args={[0.1, 2.8, 2]} />
                <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.3} />
            </mesh>
            {/* Rød stripe langs bakveggen */}
            <mesh position={[0, 4.8, -4.8]}>
                <boxGeometry args={[34, 0.4, 0.1]} />
                <meshStandardMaterial color="#c30000" />
            </mesh>
            {/* Kølappautomaten */}
            <group position={[-8.5, 0, 2.6]}>
                <mesh position={[0, 0.7, 0]}>
                    <boxGeometry args={[0.7, 1.4, 0.5]} />
                    <meshStandardMaterial color="#c30000" />
                </mesh>
                <mesh position={[0, 1.55, 0]}>
                    <boxGeometry args={[0.8, 0.3, 0.6]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
            </group>
            {/* Luker: pult og skillevegg */}
            {LUKER.map((l) => (
                <group key={l.navn} position={[l.x, 0, -3.6]}>
                    <mesh position={[0, 0.55, 0]}>
                        <boxGeometry args={[3, 1.1, 1]} />
                        <meshStandardMaterial color="#e2e8f0" />
                    </mesh>
                    <mesh position={[0, 1.12, 0]}>
                        <boxGeometry args={[3.1, 0.06, 1.1]} />
                        <meshStandardMaterial color={l.farge} />
                    </mesh>
                    <mesh position={[1.75, 1.3, -0.2]}>
                        <boxGeometry args={[0.1, 2.6, 1.4]} />
                        <meshStandardMaterial color="#cbd5e1" />
                    </mesh>
                    <mesh position={[0, 3.2, -1.2]}>
                        <boxGeometry args={[2.6, 0.7, 0.1]} />
                        <meshStandardMaterial color={l.farge} />
                    </mesh>
                </group>
            ))}
        </>
    );
}

interface SceneProps {
    modus: Modus;
    beat: number;
    playing: boolean;
    merker: RefObject<MerkeHandle | null>;
}

const FIGURER = [FARGE.mann, FARGE.mor, FARGE.gutt, FARGE.syk, FARGE.ufor];

function FolkInne({ modus, beat, playing, merker }: SceneProps & { modus: 'ko' | 'luker' }) {
    const tid = useBeatTid(beat, playing);
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const [start] = useState(() => maalInne(modus, beat, 0));
    const forste = useRef(true);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const maal = maalInne(modus, beat, tid.current);
        maal.forEach((m, i) => {
            const g = grupper.current[i];
            if (!g) return;
            if (forste.current) {
                g.position.set(m.x, 0, m.z);
            } else {
                g.position.x = damp(g.position.x, m.x, 1.6, dt);
                g.position.z = damp(g.position.z, m.z, 1.6, dt);
            }
            const s = damp(g.scale.x, m.synlig ? 1 : 0.001, 4, forste.current ? 10 : dt);
            g.scale.setScalar(s);
            g.visible = s > 0.02;
            // Snu figuren mot retningen den går, ellers mot lukene.
            const dx = m.x - g.position.x;
            const dz = m.z - g.position.z;
            const mot = Math.hypot(dx, dz) > 0.2 ? Math.atan2(dx, dz) : Math.PI;
            g.rotation.y = damp(g.rotation.y, mot, 5, forste.current ? 10 : dt);
            if (modus === 'ko') {
                const synlig = beat >= 1 && beat <= 3 && i === beat - 1 && g.visible;
                p.set(g.position.x, 2.25, g.position.z);
                const s2 = tilSkjerm(p, camera);
                merker.current?.sett(i, s2.x, s2.y, synlig && s2.foran);
            }
        });
        if (modus === 'luker') {
            LUKER.forEach((l, i) => {
                p.set(l.x, 3.65, -4.8);
                const s2 = tilSkjerm(p, camera);
                merker.current?.sett(i, s2.x, s2.y, s2.foran);
            });
        }
        forste.current = false;
    });
    return (
        <>
            {FIGURER.map((farge, i) => (
                <group
                    key={i}
                    ref={(g) => {
                        grupper.current[i] = g;
                        if (g && forste.current) g.position.set(start[i].x, 0, start[i].z);
                    }}
                >
                    <FigurKropp
                        farge={farge}
                        hode={i === 1 ? '#c68863' : '#f1c7a1'}
                        gravid={i === 1}
                    />
                </group>
            ))}
            {/* Ring under den som snakkes om */}
            <Ring modus={modus} beat={beat} grupper={grupper} />
        </>
    );
}

function Ring({
    modus,
    beat,
    grupper,
}: {
    modus: Modus;
    beat: number;
    grupper: RefObject<(THREE.Group | null)[]>;
}) {
    const ref = useRef<THREE.Mesh>(null);
    useFrame(() => {
        const r = ref.current;
        if (!r) return;
        let i = -1;
        if (modus === 'ko' && beat >= 1 && beat <= 3) i = beat - 1;
        if (modus === 'luker' && beat >= 1 && beat <= 4) i = [0, 1, 3, 4][beat - 1];
        if (modus === 'luker' && beat === 5) i = 4;
        const g = i >= 0 ? grupper.current?.[i] : null;
        r.visible = !!g && g.visible;
        if (g) r.position.set(g.position.x, 0.03, g.position.z);
    });
    return (
        <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.72, 32]} />
            <meshBasicMaterial color="#facc15" />
        </mesh>
    );
}

/* ---------- Utendørs: etatene blir Nav ---------- */

const BYGG = [
    { navn: 'Aetat', farge: '#3b82f6', fra: v3(-9, 0, 0), til: v3(-2.6, 0, 0) },
    { navn: 'Trygdeetaten', farge: '#16a34a', fra: v3(9, 0, 0), til: v3(2.6, 0, 0) },
    { navn: 'Sosialkontoret', farge: '#f97316', fra: v3(14, 0, -8), til: v3(7.8, 0, 0) },
];

function byggMaal(i: number, beat: number, t: number) {
    const b = BYGG[i];
    if (i < 2) {
        const samlet = beat >= 2 || (beat === 1 && t > 0.8);
        return { pos: samlet ? b.til : b.fra, synlig: true };
    }
    if (beat < 2) return { pos: b.fra, synlig: false };
    return { pos: t > 0.6 || beat > 2 ? b.til : b.fra, synlig: true };
}

function kameraUte(beat: number, t: number): KameraMaal {
    if (beat === 0) return { pos: v3(0, 9, 22), se: v3(0, 1.5, 0) };
    if (beat === 1) return { pos: v3(-1 + t * 0.2, 5, 22), se: v3(0, 3, 0) };
    if (beat === 2) return { pos: v3(3, 5, 26), se: v3(2.6, 3, 0) };
    return { pos: v3(2.6, 4, 22), se: v3(2.6, 3, 0) };
}

const BYGG_MERKER: MerkeData[] = [
    { tekst: 'Aetat: hjalp folk i jobb', farge: '#1d4ed8' },
    { tekst: 'Trygdeetaten: trygd', farge: '#15803d' },
    { tekst: 'Sosialhjelp', farge: '#c2410c' },
    { tekst: 'NAV', farge: '#c30000' },
];

const BYGG_MERKER_SAMMEN: MerkeData[] = [
    { tekst: 'Aetat', farge: '#1d4ed8', liten: true },
    { tekst: 'Trygdeetaten', farge: '#15803d', liten: true },
    { tekst: 'Sosialhjelp', farge: '#c2410c', liten: true },
    { tekst: 'NAV', farge: '#c30000' },
];

const BYGG_MERKER_SLUTT: MerkeData[] = [
    { tekst: 'jobb', farge: '#1d4ed8', liten: true },
    { tekst: 'trygd', farge: '#15803d', liten: true },
    { tekst: 'sosialhjelp', farge: '#c2410c', liten: true },
    { tekst: 'NAV', farge: '#c30000' },
];

function Bygg({ beat, playing, merker }: Omit<SceneProps, 'modus'>) {
    const tid = useBeatTid(beat, playing);
    const grupper = useRef<(THREE.Group | null)[]>([]);
    const banner = useRef<THREE.Mesh>(null);
    const figur = useRef<THREE.Group>(null);
    const forste = useRef(true);
    const p = useMemo(() => new THREE.Vector3(), []);
    useFrame(({ camera }, rawDt) => {
        const dt = playing ? Math.min(rawDt, 0.05) : 0;
        const t = tid.current;
        BYGG.forEach((_, i) => {
            const g = grupper.current[i];
            if (!g) return;
            const m = byggMaal(i, beat, t);
            if (forste.current) g.position.copy(m.pos);
            else {
                g.position.x = damp(g.position.x, m.pos.x, 1.8, dt);
                g.position.z = damp(g.position.z, m.pos.z, 1.8, dt);
            }
            const s = forste.current
                ? m.synlig
                    ? 1
                    : 0.001
                : damp(g.scale.x, m.synlig ? 1 : 0.001, 3, dt);
            g.scale.setScalar(s);
            g.visible = s > 0.02;
            // Før sammenslåingen over taket, etterpå midt på fasaden (taket deles med NAV-skiltet).
            if (beat === 0) p.set(g.position.x, 5.6, g.position.z);
            else p.set(g.position.x, 3.6, g.position.z + 2.6);
            const sk = tilSkjerm(p, camera);
            const vis = g.visible && (beat === 0 ? i < 2 : beat === 1 ? i < 2 && t > 1.6 : true);
            merker.current?.sett(i, sk.x, sk.y, vis && sk.foran);
        });
        // NAV-banneret over byggene som er slått sammen.
        const b = banner.current;
        if (b) {
            const bred = beat >= 2 ? 15.6 : 10.4;
            const midt = beat >= 2 ? 2.6 : 0;
            const vis = beat >= 2 || (beat === 1 && t > 1.6);
            const sx = forste.current ? bred : damp(b.scale.x, vis ? bred : 0.01, 2.5, dt);
            b.scale.x = sx;
            b.position.x = forste.current ? midt : damp(b.position.x, midt, 2.5, dt);
            b.visible = vis || sx > 0.2;
            p.set(midt, 6.75, 2.6);
            const sk = tilSkjerm(p, camera);
            merker.current?.sett(3, sk.x, sk.y, vis);
        }
        // En person går inn døra i siste beat.
        const f = figur.current;
        if (f) {
            const inne = beat >= 3;
            const mal = inne ? Math.min(1, t / 3) : 0;
            f.visible = inne && mal < 0.98;
            f.position.set(2.6, 0, 7 - mal * 4.6);
            f.rotation.y = Math.PI;
        }
        forste.current = false;
    });
    return (
        <>
            {BYGG.map((b, i) => (
                <group
                    key={b.navn}
                    ref={(g) => {
                        grupper.current[i] = g;
                    }}
                >
                    <mesh position={[0, 2.5, 0]}>
                        <boxGeometry args={[5.2, 5, 5]} />
                        <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh position={[0, 5.15, 0]}>
                        <boxGeometry args={[5.4, 0.3, 5.2]} />
                        <meshStandardMaterial color={b.farge} />
                    </mesh>
                    {[1.2, 3.2].map((y) =>
                        [-1.6, 0, 1.6].map((x) => (
                            <mesh key={`${x}-${y}`} position={[x, y + 0.4, 2.52]}>
                                <planeGeometry args={[1, 1.1]} />
                                <meshStandardMaterial
                                    color="#93c5fd"
                                    emissive="#3b82f6"
                                    emissiveIntensity={0.25}
                                />
                            </mesh>
                        ))
                    )}
                </group>
            ))}
            <mesh ref={banner} position={[0, 6.1, 2.4]} scale={[0.01, 1, 1]}>
                <boxGeometry args={[1, 1.2, 0.3]} />
                <meshStandardMaterial color="#c30000" />
            </mesh>
            {/* Døra midt i Nav-bygget */}
            {beat >= 1 && (
                <mesh position={[beat >= 2 ? 2.6 : 0, 1.1, 2.55]}>
                    <planeGeometry args={[1.4, 2.2]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>
            )}
            <group ref={figur}>
                <FigurKropp farge={FARGE.gutt} />
            </group>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 60]} />
                <meshStandardMaterial color="#cbd5e1" emissive="#64748b" emissiveIntensity={0.1} />
            </mesh>
            {/* Trær langs plassen */}
            {[-14, -11, 12, 15].map((x) => (
                <group key={x} position={[x, 0, 5]}>
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 2, 6]} />
                        <meshStandardMaterial color="#78350f" />
                    </mesh>
                    <mesh position={[0, 2.6, 0]}>
                        <icosahedronGeometry args={[1.1, 0]} />
                        <meshStandardMaterial color="#d97706" flatShading />
                    </mesh>
                </group>
            ))}
        </>
    );
}

const KO_MERKER: MerkeData[] = [
    { tekst: 'mistet jobben', farge: FARGE.mann },
    { tekst: 'skal snart føde', farge: FARGE.mor },
    { tekst: 'mangler husleie', farge: FARGE.gutt },
];

const LUKE_MERKER: MerkeData[] = LUKER.map((l) => ({ tekst: l.navn, farge: l.farge, liten: true }));

export function NavKontoret({ beat, playing, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'ko';
    const dpr = useMemo<[number, number]>(
        () => (guessTier().tier === 'lav' ? [1, 1] : [1, 1.5]),
        []
    );
    const merker = useRef<MerkeHandle>(null);
    const liste = OVERSKRIFT[modus];
    const inne = modus !== 'kontor';
    const kamera = useMemo(() => (modus === 'kontor' ? kameraUte : kameraInne(modus)), [modus]);
    const merkeData =
        modus === 'ko'
            ? KO_MERKER
            : modus === 'luker'
              ? LUKE_MERKER
              : beat >= 3
                ? BYGG_MERKER_SLUTT
                : beat >= 1
                  ? BYGG_MERKER_SAMMEN
                  : BYGG_MERKER;
    const himmel = inne ? '#e7e5e4' : '#dbeafe';
    return (
        <div className="absolute inset-0 overflow-hidden">
            <Canvas
                resize={{ offsetSize: true }}
                dpr={dpr}
                camera={{ fov: 42, position: [0, 8, 18] }}
            >
                <color attach="background" args={[himmel]} />
                <fog attach="fog" args={[himmel, 30, 80]} />
                <hemisphereLight args={['#ffffff', '#a8a29e', 1.2]} />
                <directionalLight position={[8, 20, 12]} intensity={1.3} />
                {inne && <Rom />}
                {inne && <FolkInne modus={modus} beat={beat} playing={playing} merker={merker} />}
                {!inne && <Bygg beat={beat} playing={playing} merker={merker} />}
                <BeatKamera beat={beat} playing={playing} kameraFor={kamera} />
            </Canvas>
            <Merker ref={merker} merker={merkeData} />
            <NavOverskriftOver tekst={liste[Math.min(beat, liste.length - 1)]} />
            {modus === 'luker' && beat === 5 && (
                <NavMerke
                    synlig
                    style={{ right: '4%', bottom: '8%' }}
                    farge="#475569"
                    forsinkelse={0.6}
                >
                    <span style={{ fontSize: 26 }}>Først: prøve behandling og tiltak</span>
                </NavMerke>
            )}
            {modus === 'kontor' && beat === 1 && (
                <NavMerke
                    synlig
                    style={{ left: '4%', bottom: '8%' }}
                    farge="#c30000"
                    forsinkelse={1.8}
                >
                    <span style={{ fontSize: 26 }}>1. juli 2006</span>
                </NavMerke>
            )}
        </div>
    );
}

/** Overskriften oppå lerretet (ikke i Flate, for lerretet har sin egen størrelse). */
function NavOverskriftOver({ tekst }: { tekst: string }) {
    return (
        <div className="absolute inset-0 pointer-events-none" style={{ top: '1%' }}>
            <NavOverskrift tekst={tekst} />
        </div>
    );
}
