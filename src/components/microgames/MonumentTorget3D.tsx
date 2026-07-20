import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    Interactive,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    StepTracker,
    Building,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: et monument er en fysisk historieframstilling. Det sier "denne er
// verdt å huske". Eleven kuraterer et by-torg med tre sokler og bestemmer hvem
// byen hedrer. Lyspære: det du reiser i det offentlige rommet blir "historia" -
// og de du lar stå igjen, blir usynlige. Reiser du bare makt (eller bare
// vanlige folk), forteller torget en ensidig historie, og de glemte dukker opp
// som svake skygger i kantene. Et torg som blander flere slags historier lar
// flere kjenne seg igjen.

type CandType = 'makt' | 'folk';
type Phase = 'build' | 'ensidig' | 'won';

interface Candidate {
    id: string;
    name: string;
    blurb: string;
    type: CandType;
    color: string;
}

const CANDIDATES: Candidate[] = [
    { id: 'konge', name: 'Kongen', blurb: 'Samlet riket', type: 'makt', color: '#b8902f' },
    {
        id: 'general',
        name: 'Krigshelten',
        blurb: 'Vant slag for landet',
        type: 'makt',
        color: '#9a6b3f',
    },
    {
        id: 'oppdager',
        name: 'Oppdageren',
        blurb: 'Seilte mot ukjente kyster',
        type: 'makt',
        color: '#7c8a47',
    },
    {
        id: 'arbeider',
        name: 'Arbeideren',
        blurb: 'Bygde landet med hendene',
        type: 'folk',
        color: '#4f7cac',
    },
    {
        id: 'samisk',
        name: 'Den samiske lederen',
        blurb: 'Kjempet for sitt folks rett',
        type: 'folk',
        color: '#3f8f6b',
    },
    {
        id: 'forsker',
        name: 'Forskeren',
        blurb: 'Endret livene våre med ny kunnskap',
        type: 'folk',
        color: '#8a5fa8',
    },
];

const byId = (id: string) => CANDIDATES.find((c) => c.id === id)!;

const N = 3;
const PEDESTAL_X = [-3.2, 0, 3.2];

const MonumentTorget3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [placed, setPlaced] = useState<(string | null)[]>([null, null, null]);
    const [selected, setSelected] = useState<number | null>(null);
    const [phase, setPhase] = useState<Phase>('build');
    const [banner, setBanner] = useState<string | null>(
        'Klikk en sokkel, og velg hvem byen skal hedre. Du har tre plasser.'
    );
    const [burst, setBurst] = useState(0);

    const filledCount = placed.filter(Boolean).length;
    const placedTypes = placed.filter(Boolean).map((id) => byId(id!).type);
    const hasMakt = placedTypes.includes('makt');
    const hasFolk = placedTypes.includes('folk');
    const usedIds = new Set(placed.filter(Boolean) as string[]);

    const reset = () => {
        setPlaced([null, null, null]);
        setSelected(null);
        setPhase('build');
        setBanner('Klikk en sokkel, og velg hvem byen skal hedre. Du har tre plasser.');
    };

    // Velg sokkel via Hotspot i 3D.
    const pickPedestal = (i: number) => {
        if (phase === 'won') return;
        if (phase === 'ensidig') setPhase('build');
        setSelected(i);
        sounds.play('pick');
    };

    // Plasser en kandidat på valgt (eller første ledige) sokkel.
    const placeCandidate = (id: string) => {
        if (phase === 'won' || usedIds.has(id)) return;
        if (phase === 'ensidig') setPhase('build');
        const target =
            selected !== null && placed[selected] === null ? selected : placed.indexOf(null);
        if (target === -1) return;
        const next = [...placed];
        next[target] = id;
        setPlaced(next);
        setSelected(null);
        sounds.play('correct');
        if (next.every(Boolean)) {
            setBanner('Torget er fullt. Avduk det og se hvilken historie det forteller.');
        }
    };

    // Klikk en statue for å fjerne den igjen.
    const removeStatue = (i: number) => {
        if (phase === 'won' || placed[i] === null) return;
        if (phase === 'ensidig') setPhase('build');
        const next = [...placed];
        next[i] = null;
        setPlaced(next);
        setSelected(i);
        sounds.play('drop');
        setBanner('Plassen er ledig igjen. Velg hvem som skal stå her.');
    };

    const unveil = () => {
        if (filledCount < N) return;
        if (hasMakt && hasFolk) {
            setBurst((b) => b + 1);
            sounds.play('complete');
            setBanner(null);
            setPhase('won');
            onComplete({ score: 1, completed: true, artifact: { placed } });
        } else {
            sounds.play('incorrect');
            setPhase('ensidig');
            setBanner(
                hasMakt
                    ? 'Torget hedrer bare makt og helter. En arbeider, en same, en forsker - alle som gikk forbi her, ser ingen som likner dem selv. Bytt ut en statue.'
                    : 'Et fint torg - men det hedrer bare vanlige folk. Også kongene og lederne formet historia. En ensidig historie i begge retninger skjuler noe. Bytt ut en statue.'
            );
        }
    };

    // De glemte: kandidatene som ikke ble valgt, vises som skygger ved ensidig torg.
    const forgotten = phase === 'ensidig' ? CANDIDATES.filter((c) => !usedIds.has(c.id)) : [];

    return (
        <MicroGameScaffold
            title="Hvem får stå på sokkelen?"
            subtitle="Bestem hvem byen hedrer med en statue - og se hvilken historie torget forteller"
            estimatedSeconds={150}
            onRetry={filledCount > 0 || phase !== 'build' ? reset : undefined}
            canvas={{
                idle: phase === 'build',
                camera: { position: [0, 4.6, 12], fov: 42 },
                background: '#cfe0ee',
                target: [0, 1.1, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'won' ? 'En bredere historie' : 'Byens minne'}
                    </SceneBadge>
                </>
            }
            scene={
                <TorgScene
                    placed={placed}
                    selected={selected}
                    phase={phase}
                    forgotten={forgotten}
                    burst={burst}
                    onPickPedestal={pickPedestal}
                    onRemove={removeStatue}
                />
            }
        >
            {phase !== 'won' && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                        <StepTracker current={filledCount} total={N} />
                        {/* Hvem byen hedrer - live oppsummering */}
                        <div className="flex items-center gap-1.5">
                            {placed.map((id, i) => (
                                <span
                                    key={i}
                                    className={`h-2.5 w-7 rounded-full ${
                                        id === null
                                            ? 'bg-slate-200'
                                            : byId(id).type === 'makt'
                                            ? 'bg-amber-500'
                                            : 'bg-sky-500'
                                    }`}
                                    title={id ? byId(id).name : 'Tom sokkel'}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Kandidat-galleri */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CANDIDATES.map((c) => {
                            const used = usedIds.has(c.id);
                            return (
                                <button
                                    key={c.id}
                                    onClick={() => placeCandidate(c.id)}
                                    disabled={used}
                                    className={`text-left rounded-xl border-2 p-2.5 transition ${
                                        used
                                            ? 'bg-emerald-50 border-emerald-300 opacity-70 cursor-not-allowed'
                                            : 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50 cursor-pointer shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-7 w-7 flex-shrink-0 rounded-md"
                                            style={{ backgroundColor: c.color }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">
                                                {c.name}
                                            </p>
                                            <p className="text-[11px] text-slate-500 truncate">
                                                {c.blurb}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {filledCount === N ? (
                        <button
                            onClick={unveil}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition"
                        >
                            Avduk torget
                        </button>
                    ) : (
                        <SceneFact>
                            Et monument er en fysisk historieframstilling. Det sier: «denne er verdt
                            å huske». Den du lar stå igjen, blir usynlig i det offentlige rommet.
                        </SceneFact>
                    )}
                </div>
            )}

            {phase === 'won' && (
                <WinScreen title="Et torg som forteller en bredere historie!" onReplay={reset}>
                    Du blandet flere slags historier - makt og vanlige folk side om side. Nå kan
                    flere som går over torget, se noen som likner dem selv. Et monument er aldri
                    nøytralt: det du reiser, blir det byen husker, og det du utelater, blir glemt.
                    Derfor er det et spørsmål om makt hvem som får stå på sokkelen.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN: et by-torg
// ============================================================

function TorgScene({
    placed,
    selected,
    phase,
    forgotten,
    burst,
    onPickPedestal,
    onRemove,
}: {
    placed: (string | null)[];
    selected: number | null;
    phase: Phase;
    forgotten: Candidate[];
    burst: number;
    onPickPedestal: (i: number) => void;
    onRemove: (i: number) => void;
}) {
    return (
        <group>
            {/* Torgets brostein */}
            <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[26, 22]} />
                <meshStandardMaterial color="#c8bfa8" roughness={1} />
            </mesh>
            {/* Et midtfelt i en varmere stein under soklene */}
            <mesh position={[0, -0.04, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[11, 5]} />
                <meshStandardMaterial color="#d8cdb2" roughness={1} />
            </mesh>

            {/* Bygninger i bakgrunnen - signaliserer offentlig rom */}
            <Building
                position={[-6.5, 0, -6]}
                body="#b08a6a"
                roof="#6f4a36"
                w={3}
                h={2.4}
                d={2.2}
            />
            <Building
                position={[-2.7, 0, -7]}
                body="#c2a07e"
                roof="#7a5640"
                w={2.4}
                h={3.1}
                d={2}
            />
            <Building position={[1.6, 0, -7]} body="#a98a64" roof="#6b4a34" w={2.6} h={2.7} d={2} />
            <Building position={[5.6, 0, -6]} body="#bd9a74" roof="#74503a" w={3} h={2.3} d={2.2} />

            {/* De tre soklene */}
            {PEDESTAL_X.map((x, i) => (
                <Pedestal
                    key={i}
                    x={x}
                    candId={placed[i]}
                    selected={selected === i}
                    won={phase === 'won'}
                    onPick={() => onPickPedestal(i)}
                    onRemove={() => onRemove(i)}
                />
            ))}

            {/* De glemte - svake skygger i kantene ved ensidig torg */}
            {forgotten.map((c, i) => (
                <ForgottenFigure key={c.id} candidate={c} index={i} total={forgotten.length} />
            ))}

            <Burst position={[0, 3, 0]} trigger={burst} color="#ffe9a8" count={36} spread={5} />
        </group>
    );
}

// En sokkel. Tom => Hotspot for å velge. Fylt => statue eleven kan klikke for å
// fjerne. Den valgte tomme sokkelen gløder svakt.
function Pedestal({
    x,
    candId,
    selected,
    won,
    onPick,
    onRemove,
}: {
    x: number;
    candId: string | null;
    selected: boolean;
    won: boolean;
    onPick: () => void;
    onRemove: () => void;
}) {
    const cand = candId ? byId(candId) : null;
    return (
        <group position={[x, 0, 0]}>
            {/* Sokkel-blokk */}
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.5, 1.6, 1.5]} />
                <meshStandardMaterial
                    color={selected && !cand ? '#e9d9a6' : '#b6ad97'}
                    roughness={0.9}
                    emissive={selected && !cand ? '#d9b85a' : '#000000'}
                    emissiveIntensity={selected && !cand ? 0.35 : 0}
                />
            </mesh>
            {/* Topp-plate */}
            <mesh position={[0, 1.64, 0]} castShadow>
                <boxGeometry args={[1.7, 0.16, 1.7]} />
                <meshStandardMaterial color="#9c9482" roughness={0.95} />
            </mesh>

            {cand ? (
                <Interactive onSelect={onRemove} hitArea={[1.4, 2.2, 1.4]}>
                    {(s) => <Statue color={cand.color} hovered={s === 'hover'} won={won} />}
                </Interactive>
            ) : (
                <Hotspot
                    position={[0, 2.5, 0]}
                    onSelect={onPick}
                    label="Reis en statue her"
                    state={selected ? 'selected' : 'idle'}
                    radius={0.45}
                />
            )}
        </group>
    );
}

// En bronse-aktig statue som reiser seg på sokkelen.
function Statue({ color, hovered, won }: { color: string; hovered: boolean; won: boolean }) {
    const grp = useRef<THREE.Group>(null);
    const t = useRef(0);
    useFrame((_, dt) => {
        if (!grp.current) return;
        t.current = damp(t.current, 1, dt, 6);
        grp.current.scale.setScalar(t.current);
        grp.current.position.y = 1.72 + (1 - t.current) * -1.2;
        const lift = hovered ? 0.08 : 0;
        grp.current.position.y += lift;
    });
    return (
        <group ref={grp} position={[0, 1.72, 0]}>
            {/* kropp */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.26, 0.34, 1.1, 10]} />
                <meshStandardMaterial
                    color={color}
                    roughness={0.45}
                    metalness={0.45}
                    emissive={won ? color : '#000000'}
                    emissiveIntensity={won ? 0.25 : 0}
                />
            </mesh>
            {/* hode */}
            <mesh position={[0, 1.32, 0]} castShadow>
                <sphereGeometry args={[0.24, 14, 14]} />
                <meshStandardMaterial color={color} roughness={0.45} metalness={0.45} />
            </mesh>
            {/* en hevet arm - typisk monument-positur */}
            <mesh position={[0.32, 0.95, 0]} rotation={[0, 0, -0.9]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.7, 8]} />
                <meshStandardMaterial color={color} roughness={0.45} metalness={0.45} />
            </mesh>
        </group>
    );
}

// En glemt figur: en svak, gjennomsiktig skygge i kanten av torget som svever.
function ForgottenFigure({
    candidate,
    index,
    total,
}: {
    candidate: Candidate;
    index: number;
    total: number;
}) {
    const grp = useRef<THREE.Group>(null);
    const appear = useRef(0);
    // Spre dem langs en bue i forgrunnen/kantene.
    const spread = (index - (total - 1) / 2) * 3.1;
    const baseX = spread;
    const baseZ = 4.2;
    useFrame(({ clock }, dt) => {
        if (!grp.current) return;
        appear.current = damp(appear.current, 1, dt, 2.5);
        const float = Math.sin(clock.getElapsedTime() * 1.2 + index) * 0.08;
        grp.current.position.set(baseX, 0.1 + float * appear.current, baseZ);
        grp.current.scale.setScalar(0.8 + appear.current * 0.25);
    });
    return (
        <group ref={grp} position={[baseX, 0.1, baseZ]}>
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[0.2, 0.28, 0.95, 8]} />
                <meshStandardMaterial
                    color={candidate.color}
                    transparent
                    opacity={0.22}
                    depthWrite={false}
                />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshStandardMaterial
                    color={candidate.color}
                    transparent
                    opacity={0.22}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

export default MonumentTorget3D;
