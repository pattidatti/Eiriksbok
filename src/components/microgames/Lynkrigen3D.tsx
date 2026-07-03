import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    SceneBanner,
    SceneBadge,
    DataReadout,
    DragHint,
    WinScreen,
    GroundPlane,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Lynkrigen - samle stotet (Schwerpunkt).
// Emne: Blitzkrieg, andre verdenskrig. Eleven har seks stridsvogner og en lang
// forsvarslinje med fem bunkere. Sprer du vognene likt langs hele fronten,
// bryter du ingen steder og angrepet stanser. Samler du minst fire vogner paa
// ETT punkt, slaar du hull, kjorer dypt inn bak linja og hele forsvaret faller.
// Lyspaere: lynkrigen vant ikke ved aa presse likt overalt, men ved aa samle all
// panserkraft paa ett punkt, slaa hull og kjore raskt gjennom.

const SECTOR_X = [-8, -4, 0, 4, 8]; // fem bunkere langs fronten
const LINE_Z = -2.4; // forsvarslinjas dybde
const BREAK_NEEDED = 4; // vogner som maa samles for aa bryte ett punkt
const TANK_COUNT = 6;

// Startoppstilling for de seks stridsvognene, i reserven bak (sor).
const STAGING: [number, number][] = [
    [-7.5, 6],
    [-4.5, 6.4],
    [-1.5, 6],
    [1.5, 6.4],
    [4.5, 6],
    [7.5, 6.4],
];

// Finn hvilket bunker-punkt en vogn horer til ut fra hvor den ble sluppet.
// Bare vogner som er dratt helt fram mot fronten teller (z <= 2.4), og de maa
// ligge naer en av de fem bunkerne (|dx| < 2.8). Ellers regnes de som reserve.
function sectorForDrop(x: number, z: number): number | null {
    if (z > 2.4) return null;
    let best: number | null = null;
    let bestDx = 2.8;
    for (let i = 0; i < SECTOR_X.length; i++) {
        const dx = Math.abs(x - SECTOR_X[i]);
        if (dx < bestDx) {
            bestDx = dx;
            best = i;
        }
    }
    return best;
}

const Lynkrigen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // Hver vogns sluppposisjon (xz) og hvilket punkt den er samlet paa.
    const [placed, setPlaced] = useState<[number, number][]>(() =>
        STAGING.map((p) => [p[0], p[1]])
    );
    const [sector, setSector] = useState<(number | null)[]>(() =>
        Array(TANK_COUNT).fill(null)
    );
    const [phase, setPhase] = useState<'place' | 'launch'>('place');
    const [result, setResult] = useState<'win' | 'stall' | null>(null);
    const [winSector, setWinSector] = useState<number | null>(null);
    const [burst, setBurst] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra stridsvognene fram mot fronten. Samle nok av dem på ett punkt.'
    );

    // Tell vogner per bunker-punkt.
    const counts = useMemo(() => {
        const c = [0, 0, 0, 0, 0];
        sector.forEach((s) => {
            if (s !== null) c[s] += 1;
        });
        return c;
    }, [sector]);

    const atFront = sector.filter((s) => s !== null).length;
    const maxConc = counts.reduce((a, b) => Math.max(a, b), 0);
    const ready = maxConc >= BREAK_NEEDED;

    const reset = () => {
        setPlaced(STAGING.map((p) => [p[0], p[1]]));
        setSector(Array(TANK_COUNT).fill(null));
        setPhase('place');
        setResult(null);
        setWinSector(null);
        setBanner('Dra stridsvognene fram mot fronten. Samle nok av dem på ett punkt.');
    };

    const onDrop = (i: number, p: THREE.Vector3) => {
        const nextPlaced = placed.map((q) => [q[0], q[1]] as [number, number]);
        nextPlaced[i] = [p.x, p.z];
        const s = sectorForDrop(p.x, p.z);
        const nextSector = [...sector];
        nextSector[i] = s;
        setPlaced(nextPlaced);
        setSector(nextSector);

        const c = [0, 0, 0, 0, 0];
        nextSector.forEach((v) => {
            if (v !== null) c[v] += 1;
        });
        const mx = c.reduce((a, b) => Math.max(a, b), 0);
        if (mx >= BREAK_NEEDED) {
            setBanner('Sterkt punkt! Sett i gang lynangrepet når du er klar.');
        } else if (s !== null) {
            setBanner(`Punktet har ${c[s]} vogner. Du trenger ${BREAK_NEEDED} for å bryte gjennom.`);
        } else {
            setBanner('Denne vognen står for langt bak. Dra den helt fram til en bunker.');
        }
    };

    const launch = () => {
        if (phase === 'launch') return;
        // Finn punktet med flest vogner.
        let best = 0;
        for (let i = 1; i < counts.length; i++) if (counts[i] > counts[best]) best = i;
        if (counts[best] >= BREAK_NEEDED) {
            setWinSector(best);
            setResult('win');
            setPhase('launch');
            setBanner(null);
            sounds.play('complete');
            setBurst((b) => b + 1);
            onComplete({ score: 1, completed: true });
        } else {
            setResult('stall');
            setPhase('launch');
            setBanner('Angrepet stanset. Du spredte stridsvognene for tynt langs hele fronten.');
            sounds.play('incorrect');
        }
    };

    return (
        <MicroGameScaffold
            title="Lynkrigen: samle støtet"
            subtitle="Blitzkrieg vant ved å samle all panserkraft på ett punkt - ikke ved å presse likt overalt"
            estimatedSeconds={140}
            onRetry={atFront > 0 || result ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 15, 16], fov: 42 },
                target: [0, 0, 1],
                background: '#aeb6a0',
                light: 'overcast',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Sterkeste punkt', value: maxConc, unit: `/${BREAK_NEEDED}` },
                            { label: 'Ved fronten', value: atFront, unit: `/${TANK_COUNT}` },
                        ]}
                    />
                    <SceneBadge corner="br">
                        {result === 'win' ? 'Gjennombrudd' : 'Vestfronten 1940'}
                    </SceneBadge>
                    {phase === 'place' && (
                        <DragHint show={atFront === 0} corner="bc">
                            Dra en stridsvogn fram mot en bunker
                        </DragHint>
                    )}
                </>
            }
            scene={
                <BlitzScene
                    placed={placed}
                    sector={sector}
                    counts={counts}
                    phase={phase}
                    result={result}
                    winSector={winSector}
                    burst={burst}
                    onDrop={onDrop}
                />
            }
        >
            {result === 'win' ? (
                <WinScreen title="Gjennombrudd! Fronten faller." onReplay={reset}>
                    Du samlet stridsvognene på ett punkt, slo hull i linja og kjørte dypt inn bak
                    fienden. Da smuldret hele forsvaret. Det var dette som var lynkrigen: ikke å
                    presse likt langs hele fronten, men å samle all panserkraft på ett sted, slå
                    hull og kjøre raskt gjennom. Slik falt Polen og Frankrike på få uker.
                </WinScreen>
            ) : (
                <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-3 px-1">
                        <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
                            Sterkeste punkt:
                        </span>
                        <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${ready ? 'bg-emerald-600' : 'bg-amber-700'}`}
                                animate={{ width: `${Math.min(1, maxConc / BREAK_NEEDED) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                            />
                        </div>
                        <span className="text-sm text-slate-500 whitespace-nowrap tabular-nums">
                            {maxConc}/{BREAK_NEEDED}
                        </span>
                    </div>
                    <button
                        onClick={launch}
                        className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                            ready
                                ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                        }`}
                    >
                        {result === 'stall' ? 'Prøv igjen - samle vognene' : 'Sett i gang lynangrepet'}
                    </button>
                    <p className="text-xs text-slate-500 leading-relaxed px-1">
                        Du har seks stridsvogner og fem bunkere. Deler du dem likt, blir ingen punkt
                        sterkt nok. Samle minst {BREAK_NEEDED} på samme bunker for å bryte gjennom.
                    </p>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function BlitzScene({
    placed,
    sector,
    counts,
    phase,
    result,
    winSector,
    burst,
    onDrop,
}: {
    placed: [number, number][];
    sector: (number | null)[];
    counts: number[];
    phase: 'place' | 'launch';
    result: 'win' | 'stall' | null;
    winSector: number | null;
    burst: number;
    onDrop: (i: number, p: THREE.Vector3) => void;
}) {
    const gapX = winSector !== null ? SECTOR_X[winSector] : 0;
    return (
        <group>
            <GroundPlane size={46} depth={40} color="#6f7658" />

            {/* Bruntflekker/skarrer i terrenget for liv */}
            <ScorchField />

            {/* Fiendens forsvarslinje - fem bunkere */}
            {SECTOR_X.map((x, i) => (
                <Bunker
                    key={i}
                    x={x}
                    broken={result === 'win'}
                    isGap={winSector === i}
                    count={counts[i]}
                    threat={counts[i] >= BREAK_NEEDED}
                    delay={result === 'win' ? Math.abs(x - gapX) * 0.09 : 0}
                />
            ))}

            {/* Reserve-etikett-stolpe bak (sor) */}
            <mesh position={[0, 0.02, 6.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[20, 0.12]} />
                <meshStandardMaterial color="#8a8f78" />
            </mesh>

            {/* Stridsvognene */}
            {phase === 'place'
                ? placed.map((p, i) => (
                      <Draggable
                          key={i}
                          position={[p[0], 0, p[1]]}
                          bounds={{ minX: -10, maxX: 10, minZ: -1.4, maxZ: 6.6 }}
                          dropFx="dustPuff"
                          onDrop={(v) => onDrop(i, v)}
                      >
                          {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                          <mesh position={[0, 0.8, 0]}>
                              <boxGeometry args={[2.4, 1.8, 3]} />
                              <meshBasicMaterial transparent opacity={0} />
                          </mesh>
                          <Tank assigned={sector[i] !== null} />
                      </Draggable>
                  ))
                : placed.map((p, i) => (
                      <LaunchTank
                          key={i}
                          index={i}
                          start={p}
                          sector={sector[i]}
                          result={result}
                          gapX={gapX}
                      />
                  ))}

            {result === 'win' && (
                <Burst position={[gapX, 1.6, LINE_Z]} trigger={burst} color="#ffcf6b" count={30} spread={5} />
            )}
        </group>
    );
}

// En bunker/skyttergrav-seksjon. Synker og tipper naar den brytes.
function Bunker({
    x,
    broken,
    isGap,
    count,
    threat,
    delay,
}: {
    x: number;
    broken: boolean;
    isGap: boolean;
    count: number;
    threat: boolean;
    delay: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const yRef = useRef(0);
    const tiltRef = useRef(0);
    const glowRef = useRef<THREE.MeshStandardMaterial>(null);
    const tRef = useRef(0);

    useFrame((_, dt) => {
        tRef.current += dt;
        // Gjennombruddshullet synker forst; de andre faller som en bolge utover.
        const active = broken && tRef.current > (isGap ? 0 : delay + 0.15);
        const targetY = active ? -2.4 : 0;
        const targetTilt = active ? (x < 0 ? 0.5 : -0.5) : 0;
        const speed = isGap ? 4 : 2.2;
        yRef.current = damp(yRef.current, targetY, dt, speed);
        tiltRef.current = damp(tiltRef.current, targetTilt, dt, speed);
        if (grp.current) {
            grp.current.position.y = yRef.current;
            grp.current.rotation.z = tiltRef.current;
        }
        if (glowRef.current) {
            const want = threat && !broken ? 0.55 : 0;
            glowRef.current.emissiveIntensity = damp(
                glowRef.current.emissiveIntensity,
                want,
                dt,
                6
            );
        }
    });

    return (
        <group ref={grp} position={[x, 0, LINE_Z]}>
            {/* Skyttergrav-voll */}
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.4, 0.7, 1.1]} />
                <meshStandardMaterial ref={glowRef} color="#4a5570" emissive="#34d399" emissiveIntensity={0} roughness={0.95} />
            </mesh>
            {/* Bunker-kloss med skyteskaar */}
            <mesh position={[0, 0.75, -0.1]} castShadow>
                <boxGeometry args={[1.5, 0.9, 0.9]} />
                <meshStandardMaterial color="#5b6478" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.85, 0.36]}>
                <boxGeometry args={[1.0, 0.22, 0.1]} />
                <meshStandardMaterial color="#20242e" />
            </mesh>
            {/* Sandsekker */}
            {[-1.3, 1.3].map((sx) => (
                <mesh key={sx} position={[sx, 0.28, 0.45]} castShadow>
                    <boxGeometry args={[0.7, 0.45, 0.45]} />
                    <meshStandardMaterial color="#7a6f4a" roughness={1} />
                </mesh>
            ))}
            {/* Liten flagg-markor som viser trykket paa dette punktet */}
            <TankStack count={count} />
        </group>
    );
}

// Viser hvor mange vogner som presser paa dette punktet, som smaa merker.
function TankStack({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <group position={[0, 1.4, 0.2]}>
            {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                <mesh key={i} position={[-0.9 + i * 0.36, 0, 0]}>
                    <boxGeometry args={[0.26, 0.26, 0.26]} />
                    <meshStandardMaterial color="#b23b2e" emissive="#b23b2e" emissiveIntensity={0.25} />
                </mesh>
            ))}
        </group>
    );
}

// En lowpoly stridsvogn.
function Tank({ assigned }: { assigned: boolean }) {
    const hull = assigned ? '#525a3e' : '#4a4f3a';
    return (
        <group>
            {/* Belter */}
            <mesh position={[-0.62, 0.25, 0]} castShadow>
                <boxGeometry args={[0.34, 0.5, 2.1]} />
                <meshStandardMaterial color="#2a2c24" roughness={1} />
            </mesh>
            <mesh position={[0.62, 0.25, 0]} castShadow>
                <boxGeometry args={[0.34, 0.5, 2.1]} />
                <meshStandardMaterial color="#2a2c24" roughness={1} />
            </mesh>
            {/* Skrog */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.55, 1.9]} />
                <meshStandardMaterial color={hull} roughness={0.7} metalness={0.25} />
            </mesh>
            {/* Taarn */}
            <mesh position={[0, 1.02, -0.1]} castShadow>
                <boxGeometry args={[0.95, 0.5, 1.0]} />
                <meshStandardMaterial color={hull} roughness={0.6} metalness={0.3} />
            </mesh>
            {/* Kanon */}
            <mesh position={[0, 1.05, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 1.4, 8]} />
                <meshStandardMaterial color="#33362c" roughness={0.8} metalness={0.3} />
            </mesh>
        </group>
    );
}

// Stridsvogn i angrepsfasen: kjorer mot maal med myk demping. Ved seier ruter den
// forst fram til hullet, saa dypt inn bak fienden og vifter ut (omringing).
function LaunchTank({
    index,
    start,
    sector,
    result,
    gapX,
}: {
    index: number;
    start: [number, number];
    sector: number | null;
    result: 'win' | 'stall' | null;
    gapX: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const pos = useRef(new THREE.Vector3(start[0], 0, start[1]));
    const legRef = useRef(0); // 0 = fram til hullet, 1 = ut bak linja
    const yaw = useRef(0);

    // Sluttoppstilling bak fienden: viften som omringer.
    const fanX = gapX + (index - (TANK_COUNT - 1) / 2) * 2.4;
    const fanZ = -13 - (index % 3) * 1.6;

    useFrame((_, dt) => {
        if (!grp.current) return;
        let tx = pos.current.x;
        let tz = pos.current.z;
        if (result === 'stall') {
            // Stanser rett sor for linja - bumper borti forsvaret.
            tx = start[0];
            tz = sector !== null ? LINE_Z + 1.0 : Math.min(start[1], 3.2);
        } else if (result === 'win') {
            if (legRef.current === 0) {
                // Trekk mot hullet i linja.
                tx = gapX;
                tz = LINE_Z + 0.6;
                const d = Math.hypot(pos.current.x - gapX, pos.current.z - (LINE_Z + 0.6));
                if (d < 0.7) legRef.current = 1;
            } else {
                tx = fanX;
                tz = fanZ;
            }
        }
        const speed = result === 'win' ? 3.2 : 2.4;
        pos.current.x = damp(pos.current.x, tx, dt, speed);
        pos.current.z = damp(pos.current.z, tz, dt, speed);
        grp.current.position.set(pos.current.x, 0, pos.current.z);
        // Pek i kjoreretningen.
        const wantYaw = Math.atan2(tx - pos.current.x, -(tz - pos.current.z));
        if (Math.abs(tx - pos.current.x) + Math.abs(tz - pos.current.z) > 0.05) {
            yaw.current = damp(yaw.current, wantYaw, dt, 5);
            grp.current.rotation.y = yaw.current;
        }
    });

    return (
        <group ref={grp} position={[start[0], 0, start[1]]}>
            <Tank assigned={sector !== null} />
        </group>
    );
}

// Spredte, mork terreng-flekker for at bakken ikke skal se helt flat ut.
function ScorchField() {
    const spots = useMemo(() => {
        // Enkel deterministisk pseudo-random paa modulnivaa-fri maate.
        const out: { x: number; z: number; r: number }[] = [];
        let seed = 1337;
        const rnd = () => {
            seed = (seed * 1664525 + 1013904223) % 4294967296;
            return seed / 4294967296;
        };
        for (let i = 0; i < 14; i++) {
            out.push({ x: (rnd() - 0.5) * 34, z: (rnd() - 0.5) * 30, r: 0.6 + rnd() * 1.3 });
        }
        return out;
    }, []);
    return (
        <group>
            {spots.map((s, i) => (
                <mesh key={i} position={[s.x, 0.015, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[s.r, 10]} />
                    <meshStandardMaterial color="#5a5c44" roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

export default Lynkrigen3D;
