import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Play } from 'lucide-react';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Building,
    Tree,
    Person,
    FlatRing,
    GlowMaterial,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    SceneFact,
    WinScreen,
    LoseScreen,
    Burst,
    ChoiceRow,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Hvor er jobbene? Eleven drar arbeidslaget rundt på et stilisert Norgeskart og
// fyller jobber som lyser opp og slukner igjen. I 1970 dukker nesten alt opp
// rundt Oslo, og laget står nesten stille. Etter 2004 popper jobbene opp fra
// Rogaland til Finnmark, og eleven må dra kryss og tvers - og mister noen.
// Lyspæra: arbeidsinnvandrerne etter 2004 spredte seg over hele landet fordi
// JOBBENE gjorde det. Det var ikke lenger nok å komme til hovedstaden.

const LAND_Y = 0.5;
const MAAL = 6; // jobber som må fylles per runde
const MAKS_MISS = 3;
const LEVETID_MS = 6200;
const TREFF_RADIUS = 2.3;

interface Region {
    id: string;
    navn: string;
    x: number;
    z: number;
    r: number;
}

const REGIONER: Region[] = [
    { id: 'ostlandet', navn: 'Østlandet', x: 3.0, z: 6.4, r: 2.7 },
    { id: 'rogaland', navn: 'Rogaland', x: -3.4, z: 5.0, r: 2.2 },
    { id: 'vestland', navn: 'Vestland', x: -3.1, z: 0.6, r: 2.3 },
    { id: 'trondelag', navn: 'Trøndelag', x: 0.8, z: -4.0, r: 2.3 },
    { id: 'nord', navn: 'Nord-Norge', x: 4.9, z: -8.4, r: 2.5 },
];

// Fyll-øyer som binder regionene sammen til én sammenhengende landmasse.
const BINDELEDD: { x: number; z: number; r: number }[] = [
    { x: -0.2, z: 5.8, r: 1.9 },
    { x: -3.3, z: 2.8, r: 1.9 },
    { x: -1.3, z: -1.7, r: 1.9 },
    { x: 2.9, z: -6.3, r: 2.0 },
    { x: 1.4, z: 2.6, r: 1.6 },
];

// Vekting av hvor jobbene dukker opp. 1970: nesten alt rundt hovedstaden.
// Etter 2004: hele landet, med tyngde i vest og nord der byggeplassene lå.
const VEKTER: Record<number, number[]> = {
    1: [7, 1, 1, 1, 1],
    2: [2, 2, 2, 2, 2],
};

const RUNDE_INFO: Record<number, { epoke: string; fakta: string }> = {
    1: {
        epoke: '1970',
        fakta: 'Fremmedarbeiderne på 1960- og 70-tallet havnet stort sett i Oslo-området. Der lå fabrikkene som manglet folk.',
    },
    2: {
        epoke: 'Etter 2004',
        fakta: 'Etter EU-utvidelsen kom jobbene over hele landet. Bare 3 av 10 polakker bosatte seg i Oslo og Akershus.',
    },
};

interface Jobb {
    key: number;
    x: number;
    z: number;
    regionNavn: string;
}

interface Fylt {
    key: number;
    x: number;
    z: number;
    seed: number;
}

type Tilstand = 'klar' | 'spiller' | 'runde-ferdig' | 'tapt' | 'vunnet';

function velgRegion(vekter: number[]): Region {
    const sum = vekter.reduce((a, b) => a + b, 0);
    let t = Math.random() * sum;
    for (let i = 0; i < vekter.length; i++) {
        t -= vekter[i];
        if (t <= 0) return REGIONER[i];
    }
    return REGIONER[REGIONER.length - 1];
}

// --- Landmassen: flate skiver som overlapper til ett stilisert Norge ---
function Landmasse() {
    const skiver = useMemo(
        () => [
            ...REGIONER.map((r) => ({ x: r.x, z: r.z, r: r.r })),
            ...BINDELEDD,
        ],
        []
    );
    return (
        <group>
            {skiver.map((s, i) => (
                <mesh key={i} position={[s.x, LAND_Y / 2, s.z]} receiveShadow castShadow>
                    <cylinderGeometry args={[s.r, s.r * 0.96, LAND_Y, 22]} />
                    <meshStandardMaterial color="#8fae62" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// Fast pynt så kartet ser bebodd ut fra start. Alt står PÅ platået (y = LAND_Y).
function Pynt() {
    const trer = useMemo(
        () => [
            [-4.4, 1.4],
            [-2.2, 2.6],
            [0.2, -2.4],
            [1.9, -5.4],
            [4.2, -9.6],
            [5.9, -7.6],
            [-4.1, 4.1],
            [2.1, 4.6],
        ],
        []
    );
    return (
        <group>
            {trer.map(([x, z], i) => (
                <Tree key={i} position={[x, LAND_Y, z]} seed={i + 3} leaf="#3f6b39" />
            ))}
            {/* Pynt-hus ligger langt unna startplassen til arbeidslaget, slik at
                det FØRSTE eleven skal ta tak i aldri er gjemt bak geometri. */}
            <Building
                position={[5.6, LAND_Y, -9.3]}
                body="#b8523c"
                roof="#5c3326"
                seed={2}
                w={1}
                h={0.7}
                d={0.9}
            />
            <Building
                position={[-4.2, LAND_Y, 5.6]}
                body="#c9a277"
                roof="#5c3326"
                seed={5}
                w={1}
                h={0.7}
                d={0.9}
            />
            <Building
                position={[0.2, LAND_Y, -4.9]}
                body="#9aa7b0"
                roof="#5c3326"
                seed={8}
                w={1}
                h={0.7}
                d={0.9}
            />
        </group>
    );
}

// Et ledig jobb-punkt: lysende bål på kartet med en ring rundt, som pulserer
// raskere jo nærmere det er å slukne.
function JobbMarkor({ jobb }: { jobb: Jobb }) {
    const kule = useRef<THREE.Mesh>(null);
    const ring = useRef<THREE.Group>(null);
    const t = useRef(0);
    useFrame((_, dt) => {
        t.current += dt;
        const puls = 1 + Math.sin(t.current * 6) * 0.14;
        if (kule.current) kule.current.scale.setScalar(puls);
        if (ring.current) {
            const krymp = Math.max(0.35, 1 - t.current / (LEVETID_MS / 1000));
            const s = damp(ring.current.scale.x, krymp, dt, 6);
            ring.current.scale.setScalar(s);
        }
    });
    return (
        <group position={[jobb.x, 0, jobb.z]}>
            <group ref={ring}>
                <FlatRing
                    position={[0, LAND_Y + 0.03, 0]}
                    radius={1.5}
                    tube={0.12}
                    color="#f59e0b"
                />
            </group>
            <mesh ref={kule} position={[0, LAND_Y + 0.75, 0]}>
                <sphereGeometry args={[0.36, 16, 12]} />
                <GlowMaterial color="#fbbf24" intensity={1.5} />
            </mesh>
            <mesh position={[0, LAND_Y + 0.25, 0]}>
                <cylinderGeometry args={[0.09, 0.11, 0.5, 8]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.9} />
            </mesh>
        </group>
    );
}

interface SceneProps {
    runde: number;
    tilstand: Tilstand;
    jobber: Jobb[];
    fylte: Fylt[];
    forsok: number;
    burst: number;
    burstPos: [number, number, number];
    onSlipp: (x: number, z: number) => void;
}

function KartScene({
    runde,
    tilstand,
    jobber,
    fylte,
    forsok,
    burst,
    burstPos,
    onSlipp,
}: SceneProps) {
    void runde;
    return (
        <>
            {/* Havet. Bredere enn 26 enheter, så scene-revisjonen holder det
                utenfor modellboksen - det er underlag, ikke spillinnhold. */}
            <GroundPlane size={46} depth={44} color="#8ec6de" position={[0, 0, -1]} />

            <Landmasse />
            <Pynt />

            {fylte.map((f) => (
                <group key={f.key} position={[f.x, 0, f.z]}>
                    <Building
                        position={[0, LAND_Y, 0]}
                        body="#e2c489"
                        roof="#8a5a3b"
                        seed={f.seed}
                        w={1.2}
                        h={0.95}
                        d={1.1}
                    />
                    <Person position={[0.95, LAND_Y, 0.5]} pose="raise" body="#3f6b9c" />
                </group>
            ))}

            {tilstand === 'spiller' &&
                jobber.map((j) => <JobbMarkor key={j.key} jobb={j} />)}

            {/* Arbeidslaget eleven drar rundt. Remountes per forsøk/runde. */}
            <Draggable
                key={`lag-${runde}-${forsok}`}
                position={[2.6, LAND_Y, 5.9]}
                planeY={LAND_Y}
                bounds={{ minX: -7, maxX: 8, minZ: -12, maxZ: 10 }}
                liftY={0.5}
                dropFx="dustPuff"
                onDrop={(p) => onSlipp(p.x, p.z)}
            >
                {/* Romslig usynlig gripeflate - trygg å ta tak i på trackpad. */}
                <mesh position={[0, 0.9, 0]}>
                    <boxGeometry args={[2.2, 2.2, 2.2]} />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>
                <mesh position={[0, 0.09, 0]}>
                    <cylinderGeometry args={[1.05, 1.15, 0.18, 20]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.55} />
                </mesh>
                <FlatRing position={[0, 0.2, 0]} radius={1.05} tube={0.09} color="#0ea5e9" />
                <Person position={[-0.35, 0.18, 0]} pose="walk" body="#c2410c" hat="cap" />
                <Person position={[0.38, 0.18, 0.22]} pose="idle" body="#1d4ed8" hat="cap" />
            </Draggable>

            <Burst position={burstPos} trigger={burst} />
        </>
    );
}

export default function HvorErJobbene3D({ onComplete }: MicroGameProps) {
    const { play } = useStepSounds();
    const [runde, setRunde] = useState(1);
    const [tilstand, setTilstand] = useState<Tilstand>('klar');
    const [jobber, setJobber] = useState<Jobb[]>([]);
    const [fylte, setFylte] = useState<Fylt[]>([]);
    const [fylt, setFylt] = useState(0);
    const [mistet, setMistet] = useState(0);
    const [forsok, setForsok] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([3, 1.4, 6.4]);

    const nokkel = useRef(1);
    const spawnet = useRef(0);
    const fyltRef = useRef(new Set<number>());
    const fyltAntall = useRef(0);
    const mistetAntall = useRef(0);
    const rundeRef = useRef(1);
    const timere = useRef<ReturnType<typeof setTimeout>[]>([]);
    const onCompleteRef = useRef(onComplete);
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    const ryddTimere = useCallback(() => {
        timere.current.forEach(clearTimeout);
        timere.current = [];
    }, []);

    useEffect(() => () => ryddTimere(), [ryddTimere]);

    // Ny jobb dukker opp, og slukner igjen om eleven ikke rekker fram.
    const spawn = useCallback(() => {
        const reg = velgRegion(VEKTER[runde] ?? VEKTER[2]);
        const vinkel = Math.random() * Math.PI * 2;
        const avstand = Math.random() * (reg.r - 0.9);
        const j: Jobb = {
            key: nokkel.current++,
            x: reg.x + Math.cos(vinkel) * avstand,
            z: reg.z + Math.sin(vinkel) * avstand,
            regionNavn: reg.navn,
        };
        spawnet.current += 1;
        setJobber((js) => [...js, j]);
        const t = setTimeout(() => {
            if (fyltRef.current.has(j.key)) return;
            mistetAntall.current += 1;
            setJobber((js) => js.filter((x) => x.key !== j.key));
            setMistet(mistetAntall.current);
            if (mistetAntall.current >= MAKS_MISS) {
                ryddTimere();
                setJobber([]);
                setTilstand('tapt');
                setBanner(null);
                play('incorrect');
            } else {
                setBanner(`Jobben i ${j.regionNavn} gikk til noen andre.`);
            }
        }, LEVETID_MS);
        timere.current.push(t);
    }, [runde, ryddTimere, play]);

    // Jobbene kommer i egen takt - verden venter ikke på eleven.
    useEffect(() => {
        if (tilstand !== 'spiller') return;
        let id: ReturnType<typeof setTimeout>;
        const puls = () => {
            if (spawnet.current < MAAL + MAKS_MISS + 2) spawn();
            id = setTimeout(puls, 1300 + Math.random() * 900);
        };
        id = setTimeout(puls, 500);
        return () => clearTimeout(id);
    }, [tilstand, spawn]);

    useEffect(() => {
        if (!banner) return;
        const t = setTimeout(() => setBanner(null), 2600);
        return () => clearTimeout(t);
    }, [banner]);

    const startRunde = useCallback(
        (r: number) => {
            ryddTimere();
            fyltRef.current = new Set();
            spawnet.current = 0;
            fyltAntall.current = 0;
            mistetAntall.current = 0;
            rundeRef.current = r;
            setRunde(r);
            setJobber([]);
            setFylte([]);
            setFylt(0);
            setMistet(0);
            setForsok((f) => f + 1);
            setTilstand('spiller');
            setBanner(
                r === 1
                    ? 'Dra arbeidslaget til jobben som lyser.'
                    : 'Nå lyser det over hele landet. Rekker du fram?'
            );
        },
        [ryddTimere]
    );

    // Slipp av arbeidslaget: traff vi en ledig jobb?
    const onSlipp = useCallback(
        (x: number, z: number) => {
            if (tilstand !== 'spiller') return;
            let truffet: Jobb | null = null;
            let best = TREFF_RADIUS;
            for (const j of jobber) {
                const d = Math.hypot(j.x - x, j.z - z);
                if (d < best) {
                    best = d;
                    truffet = j;
                }
            }
            if (!truffet) return;
            const j = truffet;
            fyltRef.current.add(j.key);
            fyltAntall.current += 1;
            setJobber((js) => js.filter((q) => q.key !== j.key));
            setFylte((f) => [...f, { key: j.key, x: j.x, z: j.z, seed: j.key }]);
            setFylt(fyltAntall.current);
            setBurstPos([j.x, LAND_Y + 1, j.z]);
            setBurst((b) => b + 1);

            if (fyltAntall.current >= MAAL) {
                // Runden er i havn: enten videre til neste epoke, eller seier.
                ryddTimere();
                setJobber([]);
                if (rundeRef.current >= 2) {
                    setTilstand('vunnet');
                    setBanner(null);
                    play('complete');
                    onCompleteRef.current({ score: 1, completed: true });
                } else {
                    setTilstand('runde-ferdig');
                    setBanner('1970 er i boks. Nå hopper vi fram til etter 2004.');
                    play('advance');
                }
                return;
            }

            setBanner(`Jobb fylt i ${j.regionNavn}.`);
            play('correct');
        },
        [jobber, tilstand, play, ryddTimere]
    );

    const info = RUNDE_INFO[runde] ?? RUNDE_INFO[2];

    return (
        <MicroGameScaffold
            title="Hvor er jobbene?"
            subtitle="Dra arbeidslaget dit jobben lyser. Rekker du ikke fram, går jobben til noen andre."
            estimatedSeconds={150}
            onRetry={() => startRunde(1)}
            scene={
                <KartScene
                    runde={runde}
                    tilstand={tilstand}
                    jobber={jobber}
                    fylte={fylte}
                    forsok={forsok}
                    burst={burst}
                    burstPos={burstPos}
                    onSlipp={onSlipp}
                />
            }
            canvas={{
                idle: tilstand === 'klar',
                camera: { position: [2, 18, 19], fov: 42 },
                target: [0.4, 0, -0.8],
                background: '#cfe6f2',
                light: 'overcast',
                fog: { color: '#cfe6f2', near: 26, far: 62 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Fylt', value: `${fylt}/${MAAL}` },
                            { label: 'Mistet', value: `${mistet}/${MAKS_MISS}` },
                        ]}
                    />
                    <SceneBadge corner="br">{info.epoke}</SceneBadge>
                    <DragHint show={tilstand === 'spiller' && fylt === 0} corner="bc">
                        Dra det hvite laget bort til ringen som lyser
                    </DragHint>
                </>
            }
        >
            <div className="space-y-3">
                {tilstand === 'klar' && (
                    <ChoiceRow
                        items={[
                            {
                                id: 'start',
                                title: 'Start i 1970',
                                blurb: 'Seks jobber skal fylles',
                                icon: Play,
                                status: 'active' as const,
                            },
                        ]}
                        onSelect={() => startRunde(1)}
                    />
                )}

                {tilstand === 'runde-ferdig' && (
                    <ChoiceRow
                        items={[
                            {
                                id: 'neste',
                                title: 'Gå til tiden etter 2004',
                                blurb: 'Nå kommer jobbene overalt',
                                icon: Play,
                                status: 'active' as const,
                            },
                        ]}
                        onSelect={() => startRunde(2)}
                    />
                )}

                {tilstand === 'tapt' && (
                    <LoseScreen
                        title="For mange jobber gikk tapt"
                        onRetry={() => startRunde(runde)}
                    >
                        Arbeid venter ikke. Kom du ikke dit jobben var, tok noen andre den.
                        Det var nettopp derfor folk flyttet etter arbeidet.
                    </LoseScreen>
                )}

                {tilstand === 'vunnet' && (
                    <WinScreen title="Hele landet er bemannet" onReplay={() => startRunde(1)}>
                        Kjente du forskjellen? I 1970 sto laget nesten stille i Oslo-området.
                        Etter 2004 måtte du dra kryss og tvers gjennom landet. Slik gikk det
                        med arbeidsinnvandrerne også: de fulgte jobbene ut av hovedstaden.
                    </WinScreen>
                )}

                <SceneFact>{info.fakta}</SceneFact>
            </div>
        </MicroGameScaffold>
    );
}
