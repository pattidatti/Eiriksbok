import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    Person,
    Tent,
    WaterPlane,
    ToonMaterial,
    GlowMaterial,
    GlowHalo,
    SceneSlider,
    StepTracker,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen "Menneskets tidlige historie".
//
// Lyspæra eleven skal kjenne på kroppen: alle mennesker stammer fra Afrika, og
// vi spredte oss over HELE kloden i løpet av mange titusen år. Norge kom aller
// sist - først da isen trakk seg tilbake, for rundt 11 000 år siden. Når eleven
// drar tids-spaken framover, ser hun menneskene vandre ut fra Afrika, og hun må
// klikke hver verdensdel etter hvert som den nås for å slå seg ned. De to siste
// verdensdelene (Amerika og Norge) nås først helt på slutten av spaken - så
// eleven føler hvor kort Norges historie er mot menneskets 300 000 år.

// ── Tid ──────────────────────────────────────────────────────────────────────
const START_AGO = 300000; // Homo sapiens oppstår i Afrika
const END_AGO = 9000; // spakens høyre ende
const SPAN = START_AGO - END_AGO;

// f (0..1, framover i tid) -> hvor mange år siden det er nå.
function agoFromF(f: number) {
    return START_AGO - SPAN * f;
}
function formatNum(n: number) {
    return Math.round(n / 1000) * 1000 >= 1000
        ? String(Math.round(n / 1000) * 1000).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
        : String(Math.round(n));
}

// ── Verdenskart (flatt, stilisert) ───────────────────────────────────────────
// Posisjoner i XZ-planet: x = øst/vest, z = nord (negativ) / sør (positiv).
type Region = {
    id: string;
    name: string;
    pos: [number, number]; // [x, z]
    arrivalAgo: number;
    land: string;
    // Stiliserte landmasse-klatter (relativ posisjon, skala) rundt sentrum.
    blobs: { dx: number; dz: number; sx: number; sz: number }[];
};

const REGIONS: Region[] = [
    {
        id: 'afrika',
        name: 'Afrika',
        pos: [-1, 1.6],
        arrivalAgo: 300000,
        land: '#c9a15a',
        blobs: [
            { dx: 0, dz: 0, sx: 2.1, sz: 2.6 },
            { dx: 0.3, dz: -1.6, sx: 1.7, sz: 1.3 },
        ],
    },
    {
        id: 'asia',
        name: 'Asia',
        pos: [4.4, -0.8],
        arrivalAgo: 70000,
        land: '#b7c56a',
        blobs: [
            { dx: 0, dz: 0, sx: 2.8, sz: 2.0 },
            { dx: -1.8, dz: 0.4, sx: 1.4, sz: 1.1 },
        ],
    },
    {
        id: 'europa',
        name: 'Europa',
        pos: [0.4, -2.7],
        arrivalAgo: 45000,
        land: '#9cc47a',
        blobs: [{ dx: 0, dz: 0, sx: 2.0, sz: 1.4 }],
    },
    {
        id: 'amerika',
        name: 'Amerika',
        pos: [-6.6, -0.6],
        arrivalAgo: 14000,
        land: '#8fbf86',
        blobs: [
            { dx: 0, dz: 0, sx: 1.7, sz: 2.2 },
            { dx: 0.2, dz: 2.0, sx: 1.4, sz: 1.9 },
        ],
    },
    {
        id: 'norge',
        name: 'Norge',
        pos: [-0.6, -4.5],
        arrivalAgo: 11000,
        land: '#7fb0a0',
        blobs: [{ dx: 0, dz: 0, sx: 1.0, sz: 1.5 }],
    },
];

const REGION_BY_ID: Record<string, Region> = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

// Vandringsruter mellom verdensdelene. Hver rute har et kontrollpunkt så den
// buer som en ekte vandringsbue (Amerika-ruten buer langt nord = Beringstredet).
type Edge = { from: string; to: string; ctrl: [number, number] };
const EDGES: Edge[] = [
    { from: 'afrika', to: 'asia', ctrl: [2.4, 2.0] },
    { from: 'asia', to: 'europa', ctrl: [2.8, -2.4] },
    { from: 'asia', to: 'amerika', ctrl: [-0.5, -7.2] },
    { from: 'europa', to: 'norge', ctrl: [-1.4, -3.8] },
];

// Kvadratisk bezier i XZ-planet.
function bezier(p0: [number, number], c: [number, number], p1: [number, number], t: number) {
    const u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0];
    const z = u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1];
    return [x, z] as [number, number];
}

// ── Hovedkomponent ───────────────────────────────────────────────────────────
const UtvandringenFraAfrika3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [f, setF] = useState(0);
    const [settled, setSettled] = useState<string[]>([]);
    const [banner, setBanner] = useState<string | null>(
        'Menneskene oppstår i Afrika. Klikk den lysende ringen for å slå deg ned.'
    );
    const [burst, setBurst] = useState(0);
    const [burstAt, setBurstAt] = useState<[number, number, number]>([-1, 0.4, 1.6]);
    const [won, setWon] = useState(false);
    const [touched, setTouched] = useState(false);
    const doneRef = useRef(false);

    const nowAgo = agoFromF(f);

    const reset = () => {
        setF(0);
        setSettled([]);
        setBanner('Menneskene oppstår i Afrika. Klikk den lysende ringen for å slå deg ned.');
        setBurst(0);
        setWon(false);
        setTouched(false);
        doneRef.current = false;
    };

    const settle = (id: string) => {
        if (settled.includes(id)) return;
        const r = REGION_BY_ID[id];
        setBurstAt([r.pos[0], 0.5, r.pos[1]]);
        setBurst((b) => b + 1);
        const next = [...settled, id];
        setSettled(next);
        if (id === 'afrika') {
            setBanner('Dra tids-spaken framover og følg menneskene ut i verden.');
        } else if (id === 'norge') {
            setBanner('Norge nås aller sist, for rundt 11 000 år siden.');
        } else {
            setBanner(`Menneskene har slått seg ned i ${r.name}.`);
        }
        if (next.length === REGIONS.length) {
            sounds.play('complete');
            setWon(true);
            if (!doneRef.current) {
                doneRef.current = true;
                onComplete({ score: 1, completed: true, artifact: { settled: next } });
            }
        } else {
            sounds.play('advance');
        }
    };

    const onSlide = (v: number) => {
        setTouched(true);
        setF(v);
    };

    const idle = !touched && settled.length === 0;

    return (
        <MicroGameScaffold
            title="Ut av Afrika"
            subtitle="Følg menneskene fra Afrika og ut i hele verden - og se hvor sent Norge kom med"
            estimatedSeconds={140}
            onRetry={touched || settled.length > 0 ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#bcdcef] via-[#d8e8ef] to-[#e9dcbf]"
            canvas={{
                idle,
                autoRotateSpeed: 0.25,
                camera: { position: [0.5, 12.5, 12], fov: 40 },
                background: '#bfe0f2',
                fog: { color: '#cfe4f0', near: 26, far: 70 },
                target: [-0.5, 0, -1],
                maxPolarAngle: Math.PI / 2.15,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{formatNum(nowAgo)} år siden</SceneBadge>
                    <DragHint show={idle} corner="bc">
                        Klikk verdensdelene og dra spaken framover
                    </DragHint>
                </>
            }
            scene={
                <WorldScene
                    nowAgo={nowAgo}
                    settled={settled}
                    onSettle={settle}
                    burst={burst}
                    burstAt={burstAt}
                />
            }
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                    <StepTracker current={settled.length} total={REGIONS.length} />
                    <span className="text-xs font-semibold text-slate-500">
                        {settled.length < REGIONS.length
                            ? 'Slå deg ned i alle verdensdelene'
                            : 'Hele kloden er befolket'}
                    </span>
                </div>

                <SceneSlider
                    label="Tid"
                    min={0}
                    max={1}
                    step={0.002}
                    value={f}
                    onChange={onSlide}
                    valueLabel={() => `for ${formatNum(nowAgo)} år siden`}
                />

                {won ? (
                    <WinScreen title="Du fulgte menneskene ut i hele verden!" onReplay={reset}>
                        Alle mennesker stammer fra Afrika. Derfra spredte vi oss over titusener av
                        år: til Asia for rundt 70 000 år siden, Europa for 45 000, Amerika for 14
                        000, og til slutt Norge for rundt 11 000 år siden, etter at isen trakk seg
                        tilbake. Norges historie er altså svært ung mot menneskets 300 000 år.
                    </WinScreen>
                ) : (
                    <SceneFact>
                        <span className="font-bold text-slate-800">Én vandring, hele kloden:</span>{' '}
                        Homo sapiens oppsto i Afrika for minst 300 000 år siden. I titusenvis av år
                        levde vi som nomader og fulgte dyr og planter. Dra spaken framover, så ser du
                        hvor lenge Norge lå tomt under isen mens resten av verden ble befolket.
                    </SceneFact>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ── 3D-scenen ────────────────────────────────────────────────────────────────
interface SceneProps {
    nowAgo: number;
    settled: string[];
    onSettle: (id: string) => void;
    burst: number;
    burstAt: [number, number, number];
}

function WorldScene({ nowAgo, settled, onSettle, burst, burstAt }: SceneProps) {
    return (
        <group>
            <SkyDome />
            <Clouds />

            {/* Havet */}
            <WaterPlane position={[-0.5, 0, -1]} size={[30, 24]} color={'#3f83ab'} />

            {/* Verdensdelene */}
            {REGIONS.map((r) => (
                <Landmass key={r.id} region={r} />
            ))}

            {/* Retreterende innlandsis i nord (smelter fram mot i dag) */}
            <IceSheet nowAgo={nowAgo} />

            {/* Vandringsruter + vandrende front */}
            {EDGES.map((e) => (
                <MigrationEdge key={`${e.from}-${e.to}`} edge={e} nowAgo={nowAgo} />
            ))}

            {/* Bosetninger + klikkbare punkter per verdensdel */}
            {REGIONS.map((r) => {
                const isSettled = settled.includes(r.id);
                const reached = nowAgo <= r.arrivalAgo;
                return (
                    // y=0.15 = landskivens topp, så bosetninger står PÅ landet
                    <group key={r.id} position={[r.pos[0], 0.15, r.pos[1]]}>
                        <RegionLabel name={r.name} reached={reached} settled={isSettled} />
                        {isSettled ? (
                            <Settlement />
                        ) : reached ? (
                            <Hotspot
                                position={[0, 0.9, 0]}
                                onSelect={() => onSettle(r.id)}
                                label={`Slå deg ned i ${r.name}`}
                                radius={0.55}
                            />
                        ) : null}
                    </group>
                );
            })}

            <Burst position={burstAt} trigger={burst} color="#ffe08a" count={30} spread={2.4} />
        </group>
    );
}

// Stilisert landmasse: noen flate lavpoly-klatter i en land-farge.
function Landmass({ region }: { region: Region }) {
    return (
        <group position={[region.pos[0], 0.04, region.pos[1]]}>
            {/* Flate skiver: sylinderens Y-akse peker alt opp - ingen rotasjon,
                ellers står landmassen på høykant som en mynt. */}
            {region.blobs.map((b, i) => (
                <mesh key={i} position={[b.dx, 0, b.dz]} scale={[b.sx, 1, b.sz]} receiveShadow>
                    <cylinderGeometry args={[1, 1, 0.22, 9]} />
                    <ToonMaterial color={region.land} />
                </mesh>
            ))}
        </group>
    );
}

// Innlandsis over Norge/nord. Dekker landet når det er lenge siden, og trekker
// seg tilbake (mindre + gjennomsiktig) fram mot i dag. Rent deklarativt: styrt av
// nowAgo, så den følger spaken uten egen animasjons-loop.
function IceSheet({ nowAgo }: { nowAgo: number }) {
    // 1 = full is (>= 20 000 år siden), 0 = smeltet (<= 10 000 år siden).
    const cover = THREE.MathUtils.clamp((nowAgo - 10000) / 10000, 0, 1);
    if (cover <= 0.02) return null;
    return (
        <mesh
            position={[-0.6, 0.16, -4.6 + (1 - cover) * 1.4]}
            scale={[3.2, 1, 1.4 + cover * 1.2]}
        >
            <cylinderGeometry args={[1, 1, 0.3, 10]} />
            <meshStandardMaterial
                color="#eaf3fb"
                transparent
                opacity={0.55 + cover * 0.4}
                roughness={0.6}
                emissive="#dbeaf7"
                emissiveIntensity={0.2}
            />
        </mesh>
    );
}

// En vandringsrute med lysende front-punkt som beveger seg langs bua i takt med tida.
function MigrationEdge({ edge, nowAgo }: { edge: Edge; nowAgo: number }) {
    const from = REGION_BY_ID[edge.from];
    const to = REGION_BY_ID[edge.to];

    // Punkter langs bua (til den svake, prikkete ruta).
    const dots = useMemo(() => {
        const out: [number, number, number][] = [];
        for (let i = 0; i <= 16; i++) {
            const [x, z] = bezier(from.pos, edge.ctrl, to.pos, i / 16);
            out.push([x, 0.12, z]);
        }
        return out;
    }, [from.pos, to.pos, edge.ctrl]);

    // Migrasjon pågår når tida er mellom kilde- og målankomst.
    const active = nowAgo <= from.arrivalAgo && nowAgo > to.arrivalAgo;
    const progress = active
        ? THREE.MathUtils.clamp(
              (from.arrivalAgo - nowAgo) / (from.arrivalAgo - to.arrivalAgo),
              0,
              1
          )
        : nowAgo <= to.arrivalAgo
          ? 1
          : 0;
    const reachedSource = nowAgo <= from.arrivalAgo;
    const [fx, fz] = bezier(from.pos, edge.ctrl, to.pos, progress);

    return (
        <group>
            {/* Svak, prikkete rute (synlig når kilden er nådd) */}
            {reachedSource &&
                dots.map((p, i) => (
                    <mesh key={i} position={p}>
                        <sphereGeometry args={[0.055, 6, 6]} />
                        <meshBasicMaterial
                            color="#b06a2c"
                            transparent
                            opacity={i / 16 <= progress ? 0.85 : 0.28}
                        />
                    </mesh>
                ))}
            {/* Vandrende front */}
            {active && (
                <group position={[fx, 0.35, fz]}>
                    <mesh>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <GlowMaterial color="#ffb638" intensity={1.8} />
                    </mesh>
                    <GlowHalo color="#ffd27a" size={0.7} />
                </group>
            )}
        </group>
    );
}

// Liten bosetning: et par mennesker, et telt og et glødende bål.
function Settlement() {
    return (
        <group>
            <Tent position={[0.35, 0, -0.1]} scale={0.42} color="#b8925c" />
            <Person position={[-0.35, 0, 0.2]} scale={0.42} pose="idle" body="#6b4a30" />
            <Person position={[-0.05, 0, -0.35]} scale={0.42} pose="raise" body="#7a5638" />
            <mesh position={[0.05, 0.14, 0.25]}>
                <sphereGeometry args={[0.12, 10, 10]} />
                <GlowMaterial color="#ff8a3a" intensity={1.6} />
            </mesh>
        </group>
    );
}

// Navnelapp over hver verdensdel.
function RegionLabel({
    name,
    reached,
    settled,
}: {
    name: string;
    reached: boolean;
    settled: boolean;
}) {
    return (
        <Html center position={[0, settled ? 1.5 : 1.7, 0]} pointerEvents="none">
            <div
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow ${
                    settled
                        ? 'bg-emerald-600 text-white'
                        : reached
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/80 text-slate-500'
                }`}
            >
                {name}
            </div>
        </Html>
    );
}

// Lysende himmelkuppel (kjølig topp -> varm horisont).
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#9fc4ea');
            g.addColorStop(0.5, '#c4dcef');
            g.addColorStop(0.8, '#e7e6db');
            g.addColorStop(1, '#f2e6cd');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 16, 256);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }, []);
    return (
        <mesh scale={[-1, 1, 1]}>
            <sphereGeometry args={[60, 24, 24]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
        </mesh>
    );
}

// Myke skybanker som driver sakte (dybde + liv).
function Clouds() {
    const grp = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (grp.current) grp.current.rotation.y = clock.getElapsedTime() * 0.01;
    });
    const clouds = useMemo(
        () => [
            { p: [-13, 6, -10] as [number, number, number], s: 5 },
            { p: [14, 7, -8] as [number, number, number], s: 6 },
            { p: [-8, 5, -15] as [number, number, number], s: 6.5 },
            { p: [10, 6, -16] as [number, number, number], s: 6 },
        ],
        []
    );
    return (
        <group ref={grp}>
            {clouds.map((c, i) => (
                <mesh key={i} position={c.p} scale={[c.s, c.s * 0.4, c.s]}>
                    <sphereGeometry args={[1, 12, 10]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.3}
                        depthWrite={false}
                        fog={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default UtvandringenFraAfrika3D;
