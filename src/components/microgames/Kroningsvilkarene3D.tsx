import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Column,
    Person,
    Torch,
    Particles,
    SceneBanner,
    SceneBadge,
    DragHint,
    DataReadout,
    WinScreen,
    LoseScreen,
    Burst,
    Impact,
    GlowHalo,
    damp,
    THEMES,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Kroningsvilkårene, Whitehall i februar 1689.
//
// Pedagogisk kjerne (ÉN innsikt): parlamentet ga ikke bort kronen gratis.
// Vilhelm og Maria fikk den mot at fire krav ble lagt inn i gulvet foran
// tronen. For hvert krav som kommer på plass, synker tronen et trinn, til
// kongen står på samme nivå som salen. Det er hele Bill of Rights i ett bilde.
//
// Konsekvens: to av tavlene på gulvet er krav som IKKE sto i Bill of Rights.
// Legger eleven en av dem i en ramme, spretter den tilbake og tronen står like
// høyt. Tre bomturer, og forhandlingen ryker (LoseScreen).

const t = THEMES.enlightenment;

type Fase = 'legg' | 'vunnet' | 'tapt';

interface Tavle {
    id: string;
    kort: string;
    krav: string;
    iBillOfRights: boolean;
    farge: string;
    start: [number, number];
    // Forklaring som vises når eleven legger en tavle som ikke hører hjemme.
    avvist?: string;
}

const TAVLER: Tavle[] = [
    {
        id: 'lover',
        kort: 'Lovene',
        krav: 'Kongen kan ikke sette lover til side på egen hånd.',
        iBillOfRights: true,
        farge: '#bfa878',
        start: [-4.75, 5],
    },
    {
        id: 'kongevalg',
        kort: 'Kongen velges',
        krav: 'Folket skal velge hvem som blir konge.',
        iBillOfRights: false,
        farge: '#bfa878',
        start: [-2.85, 5],
        avvist: 'Dette sto ikke i Bill of Rights. Parlamentet ga kronen til Vilhelm og Maria, og etter dem til Marias søster Anna. Kongemakten gikk fortsatt i arv.',
    },
    {
        id: 'skatt',
        kort: 'Skatten',
        krav: 'Ingen ny skatt uten at parlamentet sier ja.',
        iBillOfRights: true,
        farge: '#bfa878',
        start: [-0.95, 5],
    },
    {
        id: 'haer',
        kort: 'Hæren',
        krav: 'Ingen hær i fredstid uten parlamentets ja.',
        iBillOfRights: true,
        farge: '#bfa878',
        start: [0.95, 5],
    },
    {
        id: 'stemmerett',
        kort: 'Alle stemmer',
        krav: 'Alle voksne skal få stemme ved valgene.',
        iBillOfRights: false,
        farge: '#bfa878',
        start: [2.85, 5],
        avvist: 'Dette sto ikke i Bill of Rights. Kravet var at valgene skulle være frie, ikke at alle skulle få stemme. Stemmerett for alle kom mer enn to hundre år senere.',
    },
    {
        id: 'valg',
        kort: 'Valgene',
        krav: 'Valgene til parlamentet skal være frie.',
        iBillOfRights: true,
        farge: '#bfa878',
        start: [4.75, 5],
    },
];

const RAMME_X = [-3.3, -1.1, 1.1, 3.3];
const RAMME_Z = 0.8;
const RAMME_PUNKTER: [number, number][] = RAMME_X.map((x) => [x, RAMME_Z]);
const TAVLE_Y = 0.1;
const MAKS_BOM = 3;
const KRAV_I_ALT = TAVLER.filter((v) => v.iBillOfRights).length;

const Kroningsvilkarene3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();

    const [fase, setFase] = useState<Fase>('legg');
    const [lagt, setLagt] = useState<string[]>([]);
    const [bom, setBom] = useState(0);
    const [dunk, setDunk] = useState<Record<string, number>>({});
    const [burst, setBurst] = useState(0);
    const [runId, setRunId] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Dra kravene ned i de tomme rammene foran tronen.'
    );

    const reset = () => {
        setFase('legg');
        setLagt([]);
        setBom(0);
        setDunk({});
        setBurst(0);
        setRunId((r) => r + 1);
        setBanner('Dra kravene ned i de tomme rammene foran tronen.');
    };

    const handleSnap = (tavle: Tavle, rammeIndeks: number) => {
        if (fase !== 'legg') return;
        const opptatt = lagt.length > rammeIndeks;

        if (tavle.iBillOfRights && !opptatt) {
            sounds.play('correct');
            setBurst((b) => b + 1);
            const neste = [...lagt, tavle.id];
            setLagt(neste);
            if (neste.length === KRAV_I_ALT) {
                sounds.play('complete');
                setFase('vunnet');
                setBanner(null);
                onComplete({ score: bom === 0 ? 1 : 0.7, completed: true });
            } else {
                setBanner(
                    `${tavle.kort} ligger i gulvet. Tronen synker et trinn. ${KRAV_I_ALT - neste.length} krav igjen.`
                );
            }
            return;
        }

        // Feil tavle, eller en ramme som allerede er fylt: tavla spretter tilbake.
        sounds.play('incorrect');
        setDunk((d) => ({ ...d, [tavle.id]: (d[tavle.id] ?? 0) + 1 }));
        const b = bom + 1;
        setBom(b);
        if (b >= MAKS_BOM) {
            setFase('tapt');
            setBanner(null);
            return;
        }
        setBanner(
            tavle.iBillOfRights
                ? `Rammen er opptatt. Bruk en tom ramme. ${MAKS_BOM - b} forsøk igjen.`
                : `${tavle.kort} hører ikke hjemme her. ${MAKS_BOM - b} forsøk igjen.`
        );
    };

    const sisteAvvisning = useMemo(() => {
        const avvist = TAVLER.filter((v) => !v.iBillOfRights && (dunk[v.id] ?? 0) > 0);
        return avvist.length ? avvist[avvist.length - 1].avvist : null;
    }, [dunk]);

    return (
        <MicroGameScaffold
            title="Kroningsvilkårene"
            subtitle="Whitehall, februar 1689. Legg parlamentets krav i gulvet før kronen kan gis bort"
            estimatedSeconds={150}
            onRetry={fase !== 'legg' || lagt.length > 0 || bom > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 8, 18], fov: 38 },
                background: t.sky,
                fog: { color: t.fog, near: 30, far: 62 },
                light: 'golden',
                target: [0, 1.5, 0],
            }}
            containerClassName="bg-gradient-to-b from-[#f2e3c4] via-[#efe4cf] to-[#e3d6bd]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">Whitehall, 1689</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Krav i gulvet', value: `${lagt.length}/${KRAV_I_ALT}` },
                            { label: 'Bomturer', value: `${bom}/${MAKS_BOM}` },
                        ]}
                    />
                    <DragHint show={fase === 'legg' && lagt.length === 0} corner="bc">
                        Dra en tavle ned i en ramme
                    </DragHint>
                </>
            }
            scene={
                <Tronsalen
                    key={runId}
                    fase={fase}
                    lagt={lagt}
                    dunk={dunk}
                    burst={burst}
                    onSnap={handleSnap}
                />
            }
        >
            <div className="grid gap-2 sm:grid-cols-2 mb-3">
                {TAVLER.map((v) => {
                    const erLagt = lagt.includes(v.id);
                    return (
                        <div
                            key={v.id}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                                erLagt
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-slate-200 bg-white text-slate-600'
                            }`}
                        >
                            <span
                                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ background: v.farge }}
                            />
                            <span>
                                <strong className="font-semibold">{v.kort}:</strong> {v.krav}
                            </span>
                        </div>
                    );
                })}
            </div>

            {fase === 'legg' && (
                <p className="text-sm text-slate-600">
                    Parlamentet har avsatt Jakob 2. og tilbyr kronen til Vilhelm og Maria. Men den
                    følger med vilkår. Seks krav ligger på gulvet i salen. Fire av dem sto i Bill of
                    Rights. To gjorde det ikke. Dra de fire riktige ned i rammene, og se hva som
                    skjer med tronen.
                    {sisteAvvisning ? ` ${sisteAvvisning}` : ''}
                </p>
            )}

            {fase === 'vunnet' && (
                <WinScreen title="Kronen ble gitt bort på vilkår." onReplay={reset}>
                    Fire krav ligger i gulvet, og tronen står nesten på samme nivå som salen. Etter
                    dette kunne ingen engelsk konge sette lover til side, kreve inn skatt, holde en
                    hær i fredstid eller styre valgene uten at parlamentet sa ja. Det er derfor
                    eneveldet ble umulig i England.
                    {bom > 0 && ' Denne gangen kostet det noen forsøk å finne de riktige kravene.'}
                </WinScreen>
            )}

            {fase === 'tapt' && (
                <LoseScreen title="Forhandlingen røk." onRetry={reset}>
                    Parlamentet krevde fire helt bestemte ting i 1689: lovene, skatten, hæren og frie
                    valg. Krav om at folket skulle velge konge, eller at alle skulle få stemme, sto
                    ikke der. De kom mye senere. Prøv igjen, og legg bare de fire kravene som
                    faktisk sto i Bill of Rights.
                </LoseScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function Tronsalen({
    fase,
    lagt,
    dunk,
    burst,
    onSnap,
}: {
    fase: Fase;
    lagt: string[];
    dunk: Record<string, number>;
    burst: number;
    onSnap: (tavle: Tavle, ramme: number) => void;
}) {
    // Fem trinn i starten, ett igjen når alle fire kravene ligger i gulvet.
    const trinn = 5 - lagt.length;
    const troneTopp = trinn * 0.45;
    const vunnet = fase === 'vunnet';

    return (
        <group>
            {/* Salen rundt: vegg, søyler, benker og folk. Dekor, ikke modellen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                <Bakvegg />
                <Column position={[-5.6, 0, -6.4]} height={5.4} color="#e6dcc6" />
                <Column position={[5.6, 0, -6.4]} height={5.4} color="#e6dcc6" />
                <Torch position={[-5.6, 0, -5.4]} />
                <Torch position={[5.6, 0, -5.4]} />
                <Benkerad side={-1} />
                <Benkerad side={1} />
                <Particles preset="motes" center={[0, 3, 0]} area={[18, 16]} height={6} />
            </group>

            <GroundPlane color="#ded2b8" />

            {/* Rammene i gulvet foran tronen */}
            {RAMME_X.map((x, i) => (
                <Ramme key={x} x={x} fylt={i < lagt.length} />
            ))}

            {/* Kravene som allerede ligger i gulvet */}
            {lagt.map((id, i) => {
                const tavle = TAVLER.find((v) => v.id === id);
                if (!tavle) return null;
                return (
                    <group key={id} position={[RAMME_X[i], TAVLE_Y - 0.03, RAMME_Z]}>
                        <TavleMesh farge="#2f7d5c" />
                        <TavleEtikett tekst={tavle.kort} lagt />
                    </group>
                );
            })}

            {/* Kravene eleven kan dra */}
            {fase === 'legg' &&
                TAVLER.filter((v) => !lagt.includes(v.id)).map((tavle) => (
                    <Draggable
                        key={`${tavle.id}-${dunk[tavle.id] ?? 0}`}
                        position={[tavle.start[0], TAVLE_Y, tavle.start[1]]}
                        planeY={TAVLE_Y}
                        bounds={{ minX: -6, maxX: 6, minZ: -0.4, maxZ: 6 }}
                        snapPoints={RAMME_PUNKTER}
                        snapRadius={1.05}
                        onSnap={(i) => onSnap(tavle, i)}
                        liftY={0.4}
                        dropFx="dustPuff"
                    >
                        {/* Romslig usynlig gripeflate - trygg på trackpad */}
                        <mesh position={[0, 0.3, 0]}>
                            <boxGeometry args={[2.1, 1.2, 1.6]} />
                            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                        </mesh>
                        <TavleMesh farge={tavle.farge} />
                        <TavleEtikett tekst={tavle.kort} />
                    </Draggable>
                ))}

            {/* Tronen på trappen som synker */}
            <Trapp trinn={trinn} />
            <Trone toppY={troneTopp} vunnet={vunnet} />
            <Krone toppY={troneTopp} vunnet={vunnet} />

            {/* Vilhelm og Maria trer fram når kronen er gitt */}
            <Regentpar synlig={vunnet} y={troneTopp} />

            <Burst position={[0, 0.5, RAMME_Z]} trigger={burst} color="#f4e3b4" count={20} spread={2.6} />
            <Impact preset="dustPuff" trigger={lagt.length} position={[0, 0.1, -3.4]} />
        </group>
    );
}

// ── Bakveggen i salen ────────────────────────────────────────────────────────
function Bakvegg() {
    return (
        <group position={[0, 0, -7.6]}>
            <mesh position={[0, 3.2, 0]} receiveShadow>
                <boxGeometry args={[16, 6.4, 0.5]} />
                <meshStandardMaterial color="#e9dfc8" roughness={0.95} />
            </mesh>
            {/* Høye vinduer som slipper inn vinterlyset */}
            {[-4.4, 0, 4.4].map((x) => (
                <mesh key={x} position={[x, 3.5, 0.28]}>
                    <boxGeometry args={[1.9, 3.4, 0.08]} />
                    <meshStandardMaterial
                        color="#f8f0d8"
                        emissive="#f5e6bb"
                        emissiveIntensity={0.5}
                        roughness={0.6}
                    />
                </mesh>
            ))}
        </group>
    );
}

// ── Benkeradene med parlamentsmedlemmer ──────────────────────────────────────
const BENK_Z = [-2.2, -0.6, 1];

function Benkerad({ side }: { side: number }) {
    const x = 7.2 * side;
    return (
        <group>
            {BENK_Z.map((z, i) => (
                <group key={z}>
                    <mesh position={[x, 0.42, z]} castShadow receiveShadow>
                        <boxGeometry args={[2.6, 0.28, 1.1]} />
                        <meshStandardMaterial color="#7a5a38" roughness={0.9} />
                    </mesh>
                    <mesh position={[x + 0.9 * side, 0.86, z]} castShadow>
                        <boxGeometry args={[0.22, 0.9, 1.1]} />
                        <meshStandardMaterial color="#6d5030" roughness={0.9} />
                    </mesh>
                    <Person
                        position={[x - 0.4 * side, 0.56, z]}
                        pose="sit"
                        hat="hood"
                        body={i % 2 === 0 ? '#3f4a63' : '#4b3f5c'}
                    />
                </group>
            ))}
        </group>
    );
}

// ── En tom ramme i gulvet ────────────────────────────────────────────────────
function Ramme({ x, fylt }: { x: number; fylt: boolean }) {
    return (
        <group position={[x, 0, RAMME_Z]}>
            <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1.9, 1.35]} />
                <meshStandardMaterial color={fylt ? '#b9c9b4' : '#c3b596'} roughness={1} />
            </mesh>
            <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.78, 0.94, 4, 1, Math.PI / 4]} />
                <meshBasicMaterial
                    color={fylt ? '#10b981' : '#c9922e'}
                    transparent
                    opacity={fylt ? 0.45 : 0.85}
                />
            </mesh>
        </group>
    );
}

// ── En steintavle med et krav ────────────────────────────────────────────────
function TavleMesh({ farge }: { farge: string }) {
    return (
        <group>
            <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.18, 1.05]} />
                <meshStandardMaterial color={farge} roughness={0.7} metalness={0.15} />
            </mesh>
            {/* Innfelt felt på oversiden, så tavla leser som en plate med tekst */}
            <mesh position={[0, 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.28, 0.76]} />
                <meshStandardMaterial color="#f6efdd" roughness={0.85} />
            </mesh>
        </group>
    );
}

function TavleEtikett({ tekst, lagt = false }: { tekst: string; lagt?: boolean }) {
    return (
        <Html center position={[0, 0.95, 0]} pointerEvents="none" zIndexRange={[20, 10]}>
            <div
                className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm ${
                    lagt ? 'bg-emerald-600 text-white' : 'bg-white/95 text-slate-700'
                }`}
            >
                {tekst}
            </div>
        </Html>
    );
}

// ── Trappen tronen står på. Ett trinn forsvinner per krav. ───────────────────
function Trapp({ trinn }: { trinn: number }) {
    return (
        <group position={[0, 0, -4.2]}>
            {[0, 1, 2, 3, 4].map((i) => (
                <mesh
                    key={i}
                    position={[0, i * 0.45 + 0.225, 0]}
                    visible={i < trinn}
                    castShadow
                    receiveShadow
                >
                    <boxGeometry args={[6.4 - i * 0.62, 0.45, 4.2 - i * 0.44]} />
                    <meshStandardMaterial color={i % 2 === 0 ? '#d9cbae' : '#cfc09f'} roughness={0.95} />
                </mesh>
            ))}
        </group>
    );
}

// ── Tronen. Synker mykt ned mot salens nivå. ─────────────────────────────────
function Trone({ toppY, vunnet }: { toppY: number; vunnet: boolean }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        ref.current.position.y = damp(ref.current.position.y, toppY, dt, 2.6);
    });
    return (
        <group ref={ref} position={[0, 2.25, -4.2]}>
            {/* Sete */}
            <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 0.24, 1.3]} />
                <meshStandardMaterial color="#8a6a3a" roughness={0.7} metalness={0.2} />
            </mesh>
            {/* Bein */}
            {[
                [-0.58, -0.5],
                [0.58, -0.5],
                [-0.58, 0.5],
                [0.58, 0.5],
            ].map(([x, z]) => (
                <mesh key={`${x}-${z}`} position={[x, 0.2, z]} castShadow>
                    <boxGeometry args={[0.16, 0.4, 0.16]} />
                    <meshStandardMaterial color="#6f5430" roughness={0.85} />
                </mesh>
            ))}
            {/* Rygg */}
            <mesh position={[0, 1.32, -0.55]} castShadow>
                <boxGeometry args={[1.5, 1.6, 0.18]} />
                <meshStandardMaterial
                    color={vunnet ? '#9c6f3c' : '#8a6a3a'}
                    roughness={0.65}
                    metalness={0.25}
                />
            </mesh>
            {/* Rødt trekk */}
            <mesh position={[0, 1.28, -0.44]}>
                <boxGeometry args={[1.16, 1.24, 0.06]} />
                <meshStandardMaterial color="#8f2f36" roughness={0.9} />
            </mesh>
            {/* Armlener */}
            {[-0.72, 0.72].map((x) => (
                <mesh key={x} position={[x, 0.8, 0]} castShadow>
                    <boxGeometry args={[0.14, 0.14, 1.3]} />
                    <meshStandardMaterial color="#7d5c33" roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}

// ── Kronen. Svever over tronen til vilkårene er godtatt. ─────────────────────
function Krone({ toppY, vunnet }: { toppY: number; vunnet: boolean }) {
    const ref = useRef<THREE.Group>(null);
    const tid = useRef(0);
    useFrame((_, dt) => {
        if (!ref.current) return;
        tid.current += dt;
        const svev = vunnet ? 0 : Math.sin(tid.current * 1.4) * 0.12;
        const mal = toppY + (vunnet ? 2.05 : 2.7) + svev;
        ref.current.position.y = damp(ref.current.position.y, mal, dt, vunnet ? 1.6 : 3);
        ref.current.rotation.y += dt * (vunnet ? 0.12 : 0.45);
    });
    return (
        <group ref={ref} position={[0, 4.95, -4.75]}>
            {/* Ring */}
            <mesh castShadow>
                <cylinderGeometry args={[0.42, 0.42, 0.24, 20, 1, true]} />
                <meshStandardMaterial
                    color="#e6c15a"
                    roughness={0.3}
                    metalness={0.85}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* Takker */}
            {[0, 1, 2, 3, 4, 5].map((i) => {
                const a = (i / 6) * Math.PI * 2;
                return (
                    <mesh
                        key={i}
                        position={[Math.cos(a) * 0.42, 0.26, Math.sin(a) * 0.42]}
                        castShadow
                    >
                        <coneGeometry args={[0.1, 0.3, 8]} />
                        <meshStandardMaterial color="#e6c15a" roughness={0.3} metalness={0.85} />
                    </mesh>
                );
            })}
            {/* Bøyle over */}
            <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
                <torusGeometry args={[0.42, 0.045, 8, 20, Math.PI]} />
                <meshStandardMaterial color="#e6c15a" roughness={0.3} metalness={0.85} />
            </mesh>
            <GlowHalo color="#ffd980" size={1.5} />
        </group>
    );
}

// ── Vilhelm og Maria. Trer fram ved siden av tronen når kronen er gitt. ──────
function Regentpar({ synlig, y }: { synlig: boolean; y: number }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const s = damp(ref.current.scale.x, synlig ? 1 : 0.001, dt, 3);
        ref.current.scale.setScalar(s);
        ref.current.visible = synlig && s > 0.02;
        ref.current.position.y = damp(ref.current.position.y, y, dt, 2.6);
    });
    return (
        <group ref={ref} position={[0, y, -4.2]} scale={0.001} visible={false}>
            <Person position={[-1.35, 0, 0.5]} pose="raise" hat="crown" body="#3b4a7a" />
            <Person position={[1.35, 0, 0.5]} pose="raise" hat="crown" body="#7a3b53" />
        </group>
    );
}

export default Kroningsvilkarene3D;
