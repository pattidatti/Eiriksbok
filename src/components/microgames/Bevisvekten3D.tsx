import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    SceneBanner,
    SceneBadge,
    DragHint,
    WinScreen,
    StepTracker,
    damp,
    CameraRig,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// «Bevisvekten» - mikrospill for oversikten «Historiens store gåter».
// Lyspære: historikere veier bevis, de teller dem ikke. Eleven får én påstand
// og drar bevis-brikker ut på skålvekta: bevis som STYRKER påstanden til høyre,
// bevis som SÅR TVIL til venstre. Vekta tipper etter samlet VEKT (ikke antall),
// og en sikkerhetsmåler viser at selv en godt underbygd påstand aldri når 100 %.
// Poenget: sikkerhet er gradert.

type Side = 'styrker' | 'tvil';
type Placement = 'bord' | Side;

interface Brikke {
    id: string;
    tekst: string;
    side: Side; // hvilken skål beviset egentlig hører til
    vekt: number; // bevisets styrke
    start: [number, number, number];
}

const CLAIM = 'Vikingene nådde Amerika ca. 500 år før Columbus.';

const BRIKKER: Brikke[] = [
    {
        id: 'lanse',
        tekst: 'Utgravd vikinglandsby på Newfoundland (L’Anse aux Meadows)',
        side: 'styrker',
        vekt: 30,
        start: [-3.5, 0, 4.5],
    },
    {
        id: 'karbon',
        tekst: 'Karbondatering av funnene peker på ca. år 1000',
        side: 'styrker',
        vekt: 26,
        start: [-1.8, 0, 5],
    },
    {
        id: 'saga',
        tekst: 'Sagaene forteller om Leiv Eiriksson og Vinland',
        side: 'styrker',
        vekt: 15,
        start: [0, 0, 5.2],
    },
    {
        id: 'varig',
        tekst: 'Bosetningen ble aldri varig - vikingene ble ikke værende',
        side: 'tvil',
        vekt: 12,
        start: [1.8, 0, 5],
    },
    {
        id: 'sent',
        tekst: 'Sagaene ble skrevet ned over 200 år etter reisene',
        side: 'tvil',
        vekt: 9,
        start: [3.5, 0, 4.5],
    },
];

const TOTAL = BRIKKER.length;

const Bevisvekten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [placements, setPlacements] = useState<Record<string, Placement>>(
        Object.fromEntries(BRIKKER.map((b) => [b.id, 'bord'])) as Record<string, Placement>
    );
    const [banner, setBanner] = useState<string | null>(
        'Dra bevisene ut på vekta. Styrker de påstanden? Legg dem til høyre. Sår de tvil? Til venstre.'
    );
    const [introDone, setIntroDone] = useState(false);
    const [done, setDone] = useState(false);

    const placedCount = BRIKKER.filter((b) => placements[b.id] !== 'bord').length;

    const { styrkerVekt, tvilVekt } = useMemo(() => {
        let s = 0;
        let t = 0;
        for (const b of BRIKKER) {
            if (placements[b.id] === 'styrker') s += b.vekt;
            else if (placements[b.id] === 'tvil') t += b.vekt;
        }
        return { styrkerVekt: s, tvilVekt: t };
    }, [placements]);

    const totalVekt = styrkerVekt + tvilVekt;
    const sikkerhet = totalVekt > 0 ? Math.round((styrkerVekt / totalVekt) * 100) : 50;

    const place = (b: Brikke, pos: THREE.Vector3) => {
        // Slipp på bordet eller midt mellom skålene teller ikke som plassering.
        if (pos.z > 2.8 || Math.abs(pos.x) < 0.8) {
            setBanner('Legg beviset på en av skålene: venstre for tvil, høyre for styrker.');
            return;
        }
        const side: Side = pos.x < 0 ? 'tvil' : 'styrker';
        sounds.play('drop');
        setPlacements((p) => {
            const next = { ...p, [b.id]: side };
            const nowPlaced = BRIKKER.filter((x) => next[x.id] !== 'bord').length;
            if (nowPlaced >= TOTAL && !done) {
                setDone(true);
                setBanner(null);
                sounds.play('complete');
                setTimeout(() => onComplete({ score: 1, completed: true }), 300);
            } else {
                setBanner(
                    side === 'styrker'
                        ? 'La på styrker-siden. Legg merke til hvor mye skålen tipper.'
                        : 'La på tvil-siden. Selv gode påstander har mot-argumenter.'
                );
                sounds.play('correct');
            }
            return next;
        });
    };

    const reset = () => {
        setPlacements(Object.fromEntries(BRIKKER.map((b) => [b.id, 'bord'])) as Record<string, Placement>);
        setDone(false);
        setBanner('Dra bevisene ut på vekta igjen.');
    };

    const dom =
        sikkerhet >= 75
            ? 'Svært sannsynlig - men aldri helt sikkert'
            : sikkerhet >= 55
            ? 'Mer for enn mot'
            : sikkerhet >= 45
            ? 'Uavklart'
            : 'Mer tvil enn støtte';

    return (
        <MicroGameScaffold
            title="Bevisvekten"
            subtitle="Vei bevisene for og mot påstanden - og se at sikkerhet er gradert"
            estimatedSeconds={120}
            onRetry={placedCount > 0 ? reset : undefined}
            canvas={{
                idle: false,
                controls: introDone,
                camera: { position: [0, 8, 16], fov: 42 },
                background: '#eef3fa',
                target: [0, 2, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    {/* br så påstanden ikke ligger oppå den brede banneren øverst */}
                    <SceneBadge corner="br">{CLAIM}</SceneBadge>
                    <DragHint show={placedCount === 0 && introDone}>
                        Dra et bevis mot venstre (tvil) eller høyre (styrker)
                    </DragHint>
                </>
            }
            scene={
                <>
                    <CameraRig
                        to={[0, 6, 12]}
                        lookAt={[0, 2, 0]}
                        active={!introDone}
                        onArrive={() => setIntroDone(true)}
                    />
                    <ScaleScene
                        styrkerVekt={styrkerVekt}
                        tvilVekt={tvilVekt}
                        placements={placements}
                    />
                    {BRIKKER.map((b) =>
                        placements[b.id] === 'bord' ? (
                            <Draggable
                                key={b.id}
                                position={b.start}
                                planeY={0}
                                bounds={{ minX: -6, maxX: 6, minZ: -1, maxZ: 6 }}
                                liftY={0.6}
                                onDrop={(pos) => place(b, pos)}
                            >
                                <EvidenceTile brikke={b} />
                            </Draggable>
                        ) : null
                    )}
                </>
            }
        >
            {/* Sikkerhetsmåler + status under vinduet */}
            <div className="flex flex-col gap-3">
                <StepTracker current={placedCount} total={TOTAL} />

                {placedCount > 0 && (
                    <div>
                        <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-500">
                            <span>Tvil</span>
                            <span className="text-slate-700">Sikkerhet: {sikkerhet}%</span>
                            <span>Styrker</span>
                        </div>
                        <div className="relative h-3 overflow-hidden rounded-full bg-amber-200">
                            <div
                                className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${sikkerhet}%` }}
                            />
                        </div>
                        <p className="mt-1 text-center text-sm font-bold text-slate-700">{dom}</p>
                    </div>
                )}

                {done && (
                    <WinScreen title="Vekta har talt" onReplay={reset}>
                        Se på måleren: påstanden lander tungt på styrker-siden, men treffer aldri
                        100 %. Sånn jobber historikere - de veier bevisene mot hverandre i stedet for
                        å telle dem. Noen bevis (en utgravd landsby) veier tungt, andre (en saga
                        skrevet 200 år senere) veier lett. Svaret blir «svært sannsynlig», ikke
                        «helt sikkert». Å tåle den graderte sikkerheten er selve kjernen i faget.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN: skålvekt som tipper etter samlet vekt
// ============================================================

const PAN_X = 3.4;
const BEAM_Y = 4.2;

function ScaleScene({
    styrkerVekt,
    tvilVekt,
    placements,
}: {
    styrkerVekt: number;
    tvilVekt: number;
    placements: Record<string, Placement>;
}) {
    const beam = useRef<THREE.Group>(null);
    const leftPan = useRef<THREE.Group>(null);
    const rightPan = useRef<THREE.Group>(null);

    useFrame((_, dt) => {
        // Tipp: positiv vinkel = høyre (styrker) synker. Skaler og klem.
        const diff = styrkerVekt - tvilVekt;
        const target = THREE.MathUtils.clamp(diff * 0.006, -0.32, 0.32);
        if (beam.current) {
            beam.current.rotation.z = damp(beam.current.rotation.z, -target, dt, 3);
        }
        // Skålene henger loddrett og senkes/heves visuelt.
        if (leftPan.current) {
            leftPan.current.position.y = damp(leftPan.current.position.y, BEAM_Y - 1.6 + target * PAN_X, dt, 3);
        }
        if (rightPan.current) {
            rightPan.current.position.y = damp(rightPan.current.position.y, BEAM_Y - 1.6 - target * PAN_X, dt, 3);
        }
    });

    const onPan = (side: Side) =>
        BRIKKER.filter((b) => placements[b.id] === side);

    return (
        <group>
            <GroundPlane size={30} depth={24} color="#c9d6e5" />

            {/* Bord der bevisene ligger */}
            <mesh position={[0, -0.05, 4.5]} receiveShadow>
                <boxGeometry args={[13, 0.3, 3.5]} />
                <meshStandardMaterial color="#b08968" roughness={0.9} />
            </mesh>

            {/* Søyle */}
            <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.28, 0.42, 4, 12]} />
                <meshStandardMaterial color="#7a8899" roughness={0.6} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.15, 0]} receiveShadow>
                <cylinderGeometry args={[1.1, 1.1, 0.3, 20]} />
                <meshStandardMaterial color="#5f6b7a" roughness={0.7} metalness={0.3} />
            </mesh>

            {/* Bjelke som tipper */}
            <group ref={beam} position={[0, BEAM_Y, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[2 * PAN_X + 0.6, 0.22, 0.22]} />
                    <meshStandardMaterial color="#95a3b3" roughness={0.5} metalness={0.4} />
                </mesh>
                <mesh position={[0, 0.25, 0]}>
                    <coneGeometry args={[0.22, 0.4, 4]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.4} />
                </mesh>
                {/* opphengssnorer */}
                {[-PAN_X, PAN_X].map((x) => (
                    <mesh key={x} position={[x, -0.8, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
                        <meshStandardMaterial color="#6b7280" />
                    </mesh>
                ))}
            </group>

            {/* Venstre skål (tvil, gul) */}
            <group ref={leftPan} position={[-PAN_X, BEAM_Y - 1.6, 0]}>
                <Pan color="#f59e0b" label="Tvil" />
                <StackedTiles brikker={onPan('tvil')} side="tvil" />
            </group>

            {/* Høyre skål (styrker, grønn) */}
            <group ref={rightPan} position={[PAN_X, BEAM_Y - 1.6, 0]}>
                <Pan color="#10b981" label="Styrker" />
                <StackedTiles brikker={onPan('styrker')} side="styrker" />
            </group>
        </group>
    );
}

function Pan({ color, label }: { color: string; label: string }) {
    return (
        <group>
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[1.3, 1.05, 0.18, 24]} />
                <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[1.3, 1.3, 0.06, 24, 1, true]} />
                <meshStandardMaterial color={color} roughness={0.5} side={THREE.DoubleSide} />
            </mesh>
            {/* skål-etikett så eleven ser hvilken side som er hva */}
            <Html center position={[0, -0.45, 0.9]} style={{ pointerEvents: 'none' }}>
                <span
                    style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: '#334155',
                        background: 'rgba(255,255,255,0.85)',
                        borderRadius: '6px',
                        padding: '1px 8px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
            </Html>
        </group>
    );
}

// Tykkelsen på en brikke speiler vekta: tunge bevis er tykke plater.
function tileHeight(vekt: number) {
    return 0.14 + vekt * 0.009;
}

function StackedTiles({ brikker, side }: { brikker: Brikke[]; side: Side }) {
    // Regn ut senterhøyden for hver brikke i stabelen (start rett over skålbunnen).
    const centers: number[] = [];
    brikker.reduce((y, b) => {
        const h = tileHeight(b.vekt);
        centers.push(y + h / 2);
        return y + h + 0.04;
    }, 0.12);
    return (
        <>
            {brikker.map((b, i) => (
                <mesh key={b.id} position={[0, centers[i], 0]} castShadow>
                    <boxGeometry args={[1.1, tileHeight(b.vekt), 1.1]} />
                    <meshStandardMaterial
                        color={side === 'styrker' ? '#34d399' : '#fbbf24'}
                        roughness={0.7}
                    />
                </mesh>
            ))}
        </>
    );
}

// Bevis-brikke på bordet (før plassering). Nøytral farge - det er ELEVEN som
// skal avgjøre hvilken side beviset hører til, så fargen røper ingenting.
function EvidenceTile({ brikke }: { brikke: Brikke }) {
    const h = tileHeight(brikke.vekt);
    return (
        <group>
            {/* usynlig, romslig gripeflate for trackpad */}
            <mesh position={[0, 0.4, 0]}>
                <boxGeometry args={[1.6, 1.2, 1.6]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <mesh position={[0, 0.1 + h / 2, 0]} castShadow>
                <boxGeometry args={[1.2, h, 1.2]} />
                <meshStandardMaterial color="#e7ddc4" roughness={0.6} />
            </mesh>
            {/* bevis-teksten på et lite kort over brikka */}
            <Html center position={[0, 1.15, 0]} style={{ pointerEvents: 'none' }}>
                <div
                    style={{
                        width: '124px',
                        fontSize: '10px',
                        lineHeight: 1.25,
                        fontWeight: 600,
                        textAlign: 'center',
                        color: '#1e293b',
                        background: 'rgba(255,255,255,0.92)',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '4px 6px',
                        boxShadow: '0 2px 6px rgba(15,23,42,0.15)',
                    }}
                >
                    {brikke.tekst}
                </div>
            </Html>
        </group>
    );
}

export default Bevisvekten3D;
