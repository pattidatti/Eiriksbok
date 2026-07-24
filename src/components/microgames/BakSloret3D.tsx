import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    Building,
    Person,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    Burst,
    KitOutline,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Bak uvitenhetens slør. En liten landsby med tre livsstasjoner
// (topp, midten, bunnen) står bak et frostet slør. Eleven velger EN samfunnsregel
// ved å klikke en av tre steintavler foran sløret - husene vokser og krymper etter
// regelen. Så trekker eleven sløret til side, og et søkelys faller på en TILFELDIG
// figur: "dette ble deg". Fordi du ikke kan styre hvem du blir, lønner det seg å
// velge regelen der selv den nederste plassen er best mulig.
// Lyspære: bak sløret vet du ikke hvem du blir, så du velger reglene som gjør livet
// trygt selv for den som får minst (Rawls sitt differanseprinsipp).

type Phase = 'idle' | 'ruled' | 'revealed';
type TierId = 'topp' | 'midten' | 'bunnen';

interface Rule {
    id: string;
    label: string;
    blurb: string;
    color: string;
    dist: Record<TierId, number>; // livskvalitet 1-10 per stasjon
}

const RULES: Rule[] = [
    {
        id: 'vinner',
        label: 'Vinneren tar alt',
        blurb: 'Fri konkurranse, ingen deling',
        color: '#ef4444',
        dist: { topp: 10, midten: 4, bunnen: 1 },
    },
    {
        id: 'likt',
        label: 'Alt helt likt',
        blurb: 'Alle får akkurat det samme',
        color: '#3b82f6',
        dist: { topp: 5, midten: 5, bunnen: 5 },
    },
    {
        id: 'rawls',
        label: 'Løft de svakeste',
        blurb: 'Forskjell er lov om den løfter de nederste',
        color: '#10b981',
        dist: { topp: 8, midten: 6, bunnen: 4 },
    },
];

const STATIONS: { id: TierId; label: string; x: number; house: string; roof: string }[] = [
    { id: 'bunnen', label: 'Nederst', x: -4.4, house: '#8a7b6a', roof: '#5c5044' },
    { id: 'midten', label: 'I midten', x: 0, house: '#c08a4a', roof: '#7a5630' },
    { id: 'topp', label: 'På toppen', x: 4.4, house: '#d9b25a', roof: '#8a6f2e' },
];

const valueToHeight = (v: number) => 0.5 + v * 0.14;

const BakSloret3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('idle');
    const [ruleId, setRuleId] = useState<string | null>(null);
    const [assigned, setAssigned] = useState<TierId | null>(null);
    const [banner, setBanner] = useState<string | null>(
        'Klikk en steintavle for å velge samfunnsregelen.'
    );
    const [burst, setBurst] = useState(0);

    const rule = RULES.find((r) => r.id === ruleId) ?? null;
    const fairestId = useMemo(() => {
        let best = RULES[0];
        for (const r of RULES) if (r.dist.bunnen > best.dist.bunnen) best = r;
        return best.id;
    }, []);

    const myScore = rule && assigned ? rule.dist[assigned] : 0;

    const pickRule = (id: string) => {
        if (phase === 'revealed') return;
        sounds.play('pick');
        setRuleId(id);
        setPhase('ruled');
        setBanner('Reglene er satt. Trekk nå sløret til side og se hvem du ble.');
    };

    const lift = () => {
        if (!rule) return;
        const roll = STATIONS[Math.floor(Math.random() * STATIONS.length)].id;
        setAssigned(roll);
        setPhase('revealed');
        setBurst((b) => b + 1);
        sounds.play('complete');
        const st = STATIONS.find((s) => s.id === roll)!;
        setBanner(`Sløret er borte. Du ble: ${st.label}.`);
        onComplete({ score: 1, completed: true, artifact: { ruleId: rule.id, assigned: roll } });
    };

    const reset = () => {
        setPhase('idle');
        setRuleId(null);
        setAssigned(null);
        setBanner('Klikk en steintavle for å velge samfunnsregelen.');
    };

    return (
        <MicroGameScaffold
            title="Bak uvitenhetens slør"
            subtitle="Velg en regel for samfunnet mens sløret skjuler hvem du blir. Trekk det så til side."
            estimatedSeconds={120}
            onRetry={phase !== 'idle' ? reset : undefined}
            canvas={{
                idle: phase === 'idle',
                camera: { position: [0, 5.2, 12.5], fov: 42 },
                background: '#e7ecf5',
                target: [0, 1.4, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'revealed' ? 'Dette ble deg' : 'Uvitenhetens slør'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Regel', value: rule ? rule.label : 'ikke valgt' },
                            {
                                label: 'Din livskvalitet',
                                value: phase === 'revealed' ? `${myScore}/10` : 'skjult',
                            },
                        ]}
                    />
                </>
            }
            scene={
                <VillageScene
                    rule={rule}
                    phase={phase}
                    assigned={assigned}
                    burst={burst}
                    onPickRule={pickRule}
                />
            }
        >
            {/* Kontroller under vinduet: regelvalg + trekk sløret */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {RULES.map((r) => {
                    const on = r.id === ruleId;
                    return (
                        <button
                            key={r.id}
                            onClick={() => pickRule(r.id)}
                            disabled={phase === 'revealed'}
                            className={`text-left rounded-xl border p-2.5 transition ${
                                on ? 'bg-white shadow-sm' : 'bg-slate-50 border-slate-200'
                            } ${phase === 'revealed' ? 'cursor-default' : 'cursor-pointer hover:shadow-sm'}`}
                            style={on ? { borderColor: r.color } : undefined}
                        >
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{
                                        backgroundColor: on ? r.color : '#cbd5e1',
                                        boxShadow: on ? `0 0 8px ${r.color}` : 'none',
                                    }}
                                />
                                <span className="text-xs font-bold text-slate-700">{r.label}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 leading-snug">{r.blurb}</p>
                        </button>
                    );
                })}
            </div>

            <button
                onClick={lift}
                disabled={phase !== 'ruled'}
                className={`mt-3 w-full rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                    phase === 'ruled'
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
                Trekk sløret til side
            </button>

            {phase === 'revealed' && rule && assigned && (
                <div className="mt-3">
                    <WinScreen title={`Du ble ${STATIONS.find((s) => s.id === assigned)!.label.toLowerCase()}!`} onReplay={reset}>
                        Livskvaliteten din ble {myScore} av 10.{' '}
                        {rule.id === fairestId
                            ? 'Du valgte regelen der selv den nederste plassen er best mulig. Det er nettopp slik Rawls mente en klok person ville valgt bak sløret.'
                            : 'Legg merke til regelen «Løft de svakeste»: der er den nederste plassen best mulig. Når du ikke vet hvem du blir, er det det tryggeste valget. Prøv igjen og kjenn på forskjellen.'}
                    </WinScreen>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function VillageScene({
    rule,
    phase,
    assigned,
    burst,
    onPickRule,
}: {
    rule: Rule | null;
    phase: Phase;
    assigned: TierId | null;
    burst: number;
    onPickRule: (id: string) => void;
}) {
    return (
        <group>
            <GroundPlane color="#8fae63" />

            {/* Livsstasjoner */}
            {STATIONS.map((st) => (
                <Station
                    key={st.id}
                    station={st}
                    value={rule ? rule.dist[st.id] : 3}
                    isMe={phase === 'revealed' && assigned === st.id}
                    revealed={phase === 'revealed'}
                />
            ))}

            {/* Søkelys som faller på "deg" */}
            <Spotlight assigned={assigned} revealed={phase === 'revealed'} />

            {/* Frostet slør foran landsbyen */}
            <Veil phase={phase} />

            {/* Regel-tavler foran sløret (alltid klikkbare) */}
            {RULES.map((r, i) => (
                <RuleStone
                    key={r.id}
                    rule={r}
                    x={(i - 1) * 3.1}
                    on={rule?.id === r.id}
                    onSelect={() => onPickRule(r.id)}
                />
            ))}

            <Burst position={[0, 2.4, 0]} trigger={burst} color="#fde68a" count={34} spread={4} />
        </group>
    );
}

// En livsstasjon: et hus som damper mot en høyde utledet av livskvaliteten,
// pluss en figur ved siden av. Lyser gyllent når den er "deg".
function Station({
    station,
    value,
    isMe,
    revealed,
}: {
    station: (typeof STATIONS)[number];
    value: number;
    isMe: boolean;
    revealed: boolean;
}) {
    const houseGrp = useRef<THREE.Group>(null);
    const ringMat = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((_, dt) => {
        const targetH = valueToHeight(value);
        if (houseGrp.current) {
            houseGrp.current.scale.y = damp(houseGrp.current.scale.y, targetH, dt, 4);
        }
        if (ringMat.current) {
            ringMat.current.emissiveIntensity = damp(
                ringMat.current.emissiveIntensity,
                isMe ? 1 : 0.02,
                dt,
                5
            );
        }
    });

    return (
        <group position={[station.x, 0, -3]}>
            {/* markørring på bakken som lyser når dette er deg */}
            <mesh position={[0, 0.03, 1.6]} rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.05, 0.09, 10, 40]} />
                <meshStandardMaterial
                    ref={ringMat}
                    color="#f59e0b"
                    emissive="#f59e0b"
                    emissiveIntensity={0.02}
                    roughness={0.5}
                />
            </mesh>

            {/* huset - scale.y dampes for å vokse/krympe */}
            <group ref={houseGrp} scale={[1, 1, 1]}>
                <Building
                    position={[0, 0, 0]}
                    body={station.house}
                    roof={station.roof}
                    w={1.9}
                    h={1.2}
                    d={1.7}
                />
            </group>

            {/* innbyggeren */}
            <Person
                position={[1.5, 0, 1.5]}
                rotation={[0, -0.5, 0]}
                pose={isMe ? 'raise' : 'idle'}
                body={isMe ? '#b45309' : '#5a4632'}
                hat="cap"
                hatColor={station.roof}
            />

            {isMe && revealed && (
                <mesh position={[1.5, 2.5, 1.5]}>
                    <octahedronGeometry args={[0.28, 0]} />
                    <meshStandardMaterial
                        color="#fde68a"
                        emissive="#f59e0b"
                        emissiveIntensity={1}
                        toneMapped={false}
                    />
                    <KitOutline />
                </mesh>
            )}
        </group>
    );
}

// Søkelys: en myk lyskjegle + punktlys som glir bort til den tildelte stasjonen.
function Spotlight({ assigned, revealed }: { assigned: TierId | null; revealed: boolean }) {
    const grp = useRef<THREE.Group>(null);
    const coneMat = useRef<THREE.MeshBasicMaterial>(null);
    const targetX = assigned ? (STATIONS.find((s) => s.id === assigned)?.x ?? 0) : 0;

    useFrame((_, dt) => {
        if (grp.current) {
            grp.current.position.x = damp(grp.current.position.x, targetX, dt, 3);
        }
        if (coneMat.current) {
            coneMat.current.opacity = damp(coneMat.current.opacity, revealed ? 0.28 : 0, dt, 3);
        }
    });

    return (
        <group ref={grp} position={[0, 0, -1.4]}>
            <mesh position={[0, 3.2, 0]}>
                <coneGeometry args={[1.5, 6.4, 24, 1, true]} />
                <meshBasicMaterial
                    ref={coneMat}
                    color="#fff4c2"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    );
}

// Det frostede sløret: et halvgjennomsiktig plan som henger foran landsbyen.
// Når eleven trekker det, damper det oppover og blir gjennomsiktig. Raycast er
// slått av så klikk går rett gjennom til regel-tavlene.
function Veil({ phase }: { phase: Phase }) {
    const grp = useRef<THREE.Group>(null);
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const lifted = phase === 'revealed';

    useFrame((_, dt) => {
        if (grp.current) {
            grp.current.position.y = damp(grp.current.position.y, lifted ? 9.5 : 3, dt, 2.2);
        }
        if (mat.current) {
            mat.current.opacity = damp(mat.current.opacity, lifted ? 0 : 0.82, dt, 2.4);
        }
    });

    return (
        <group ref={grp} position={[0, 3, 1.6]}>
            <mesh raycast={() => null}>
                <planeGeometry args={[15, 8, 1, 1]} />
                <meshStandardMaterial
                    ref={mat}
                    color="#eef2fb"
                    transparent
                    opacity={0.82}
                    roughness={0.4}
                    metalness={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

// En klikkbar steintavle som setter samfunnsregelen. Står foran sløret.
function RuleStone({
    rule,
    x,
    on,
    onSelect,
}: {
    rule: Rule;
    x: number;
    on: boolean;
    onSelect: () => void;
}) {
    const cap = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((_, dt) => {
        if (cap.current) {
            cap.current.emissiveIntensity = damp(cap.current.emissiveIntensity, on ? 0.85 : 0.12, dt, 5);
        }
    });

    // z=4.6: nærmere landsbyen enn før (6.4) så tavlene ikke kuttes av nederst i bildet
    return (
        <group position={[x, 0, 4.6]}>
            <Interactive onSelect={onSelect} state={on ? 'selected' : 'idle'} hitArea={[1.9, 2, 1.4]}>
                {(s) => (
                    <group>
                        {/* sokkel */}
                        <mesh position={[0, 0.2, 0]} castShadow>
                            <boxGeometry args={[1.3, 0.4, 0.5]} />
                            <meshStandardMaterial color="#94a3b8" roughness={0.9} />
                        </mesh>
                        {/* tavle */}
                        <mesh position={[0, 1, 0]} rotation={[-0.32, 0, 0]} castShadow>
                            <boxGeometry args={[1.25, 1.4, 0.16]} />
                            <meshStandardMaterial
                                ref={cap}
                                color={on ? rule.color : '#cbd5e1'}
                                emissive={rule.color}
                                emissiveIntensity={on ? 0.85 : s === 'hover' ? 0.45 : 0.12}
                                roughness={0.5}
                            />
                            {(on || s === 'hover') && <KitOutline />}
                        </mesh>
                    </group>
                )}
            </Interactive>
        </group>
    );
}

export default BakSloret3D;
