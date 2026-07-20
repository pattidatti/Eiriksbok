import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    SceneSlider,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Broen til Europa. Eleven drar en spak fra "Stå alene" til "Fullt
// EU-medlem". Scenen morfer: en bro vokser ut mot EU, varer begynner å strømme,
// EU-regler daler ned over Norge, og en norsk stol ved EUs bord står tom helt
// til fullt medlemskap. Tre live-tall (Markedstilgang, Innflytelse, Selvstyre)
// endrer seg mens eleven drar.
// Lyspære: ved EØS-punktet er markedet nesten helt åpent og reglene daler ned,
// men stolen ved bordet er tom. Norge følger reglene uten å være med å bestemme.

const NORGE_X = -5.4;
const EU_X = 5.2;
const BRIDGE_START = -3.7;
const BRIDGE_END = 3.5;
const BRIDGE_Y = 0.5;
const SPAN = BRIDGE_END - BRIDGE_START;

// Smooth (smoothstep) mellom a og b.
function smooth(x: number, a: number, b: number): number {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
}

const marked = (c: number) => Math.round(25 + 75 * smooth(c, 0.18, 0.45));
const innflytelse = (c: number) => Math.round(12 * smooth(c, 0.3, 0.55) + 80 * smooth(c, 0.78, 1));
const selvstyre = (c: number) => Math.round(100 - 72 * c);
const connection = (c: number) => smooth(c, 0.18, 0.42);

type ZoneId = 'alene' | 'eos' | 'medlem';
function zoneOf(c: number): ZoneId | null {
    if (c <= 0.12) return 'alene';
    if (c >= 0.45 && c <= 0.68) return 'eos';
    if (c >= 0.9) return 'medlem';
    return null;
}

const ZONE_BANNER: Record<ZoneId, string> = {
    alene: 'Norge står alene. Markedet er nesten stengt, men landet bestemmer alt selv.',
    eos: 'EØS: varene strømmer fritt, men stolen ved EUs bord står tom. Norge følger reglene uten å stemme over dem.',
    medlem: 'Fullt medlem: Norge får en stol ved bordet, men gir fra seg mest selvstyre.',
};

const MODELL_NAVN = (c: number): string => {
    const z = zoneOf(c);
    if (z === 'alene') return 'Stå alene';
    if (z === 'eos') return 'EØS-avtalen';
    if (z === 'medlem') return 'Fullt medlem';
    return c < 0.45 ? 'Løsere bånd' : 'Tettere bånd';
};

const EuropaBroen3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [coop, setCoop] = useState(0);
    const [visited, setVisited] = useState<ZoneId[]>([]);
    const [banner, setBanner] = useState<string | null>(
        'Dra spaken og bestem hvor tett Norge skal knytte seg til Europa.'
    );
    const [won, setWon] = useState(false);
    const [burst, setBurst] = useState(0);

    const reset = () => {
        setCoop(0);
        setVisited([]);
        setBanner('Dra spaken og bestem hvor tett Norge skal knytte seg til Europa.');
        setWon(false);
    };

    const onSlide = (v: number) => {
        const c = v / 100;
        setCoop(c);
        const z = zoneOf(c);
        if (z) {
            setBanner(ZONE_BANNER[z]);
            if (!visited.includes(z)) {
                const next = [...visited, z];
                setVisited(next);
                sounds.play(z === 'eos' ? 'correct' : 'advance');
                if (next.length === 3 && !won) {
                    setWon(true);
                    setBurst((b) => b + 1);
                    sounds.play('complete');
                    onComplete({ score: 1, completed: true, artifact: { visited: next } });
                }
            }
        }
    };

    return (
        <MicroGameScaffold
            title="Broen til Europa"
            subtitle="Dra spaken fra 'Stå alene' til 'Fullt EU-medlem'. Se hva Norge får og gir fra seg på veien."
            estimatedSeconds={150}
            onRetry={coop > 0 || won ? reset : undefined}
            canvas={{
                idle: coop === 0,
                camera: { position: [0, 7.5, 13], fov: 42 },
                background: '#cfe6f5',
                target: [0, 0.8, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{MODELL_NAVN(coop)}</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Marked', value: marked(coop), unit: '%' },
                            { label: 'Innflytelse', value: innflytelse(coop), unit: '%' },
                            { label: 'Selvstyre', value: selvstyre(coop), unit: '%' },
                        ]}
                    />
                </>
            }
            scene={<BroScene coop={coop} burst={burst} />}
        >
            <SceneSlider
                label="Hvor tett skal Norge samarbeide med Europa?"
                min={0}
                max={100}
                step={1}
                value={Math.round(coop * 100)}
                onChange={onSlide}
                valueLabel={() => MODELL_NAVN(coop)}
            />

            <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[11px]">
                {(['alene', 'eos', 'medlem'] as ZoneId[]).map((z) => {
                    const sett = visited.includes(z);
                    const navn = z === 'alene' ? 'Stå alene' : z === 'eos' ? 'EØS' : 'Fullt medlem';
                    return (
                        <div
                            key={z}
                            className={`rounded-lg border px-2 py-1.5 font-semibold transition ${
                                sett
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                        >
                            {sett ? '✓ ' : ''}
                            {navn}
                        </div>
                    );
                })}
            </div>

            {won && (
                <div className="mt-3">
                    <WinScreen title="Du har sett hele skalaen!" onReplay={reset}>
                        Jo lenger ut mot EU du dro spaken, jo mer marked og innflytelse fikk Norge,
                        men jo mindre selvstyre. Ved EØS-punktet var markedet nesten åpent og reglene
                        daler ned over Norge, mens stolen ved bordet stod tom. Det er kjernen i EØS:
                        Norge følger EUs regler uten å være med og stemme over dem.
                    </WinScreen>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function BroScene({ coop, burst }: { coop: number; burst: number }) {
    return (
        <group>
            {/* Hav */}
            <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[40, 24]} />
                <meshStandardMaterial color="#7cb6d8" roughness={0.85} />
            </mesh>

            <NorgeOya coop={coop} />
            <EUmarked coop={coop} />
            <Bro coop={coop} />
            <GodsBox phase={0} coop={coop} />
            <GodsBox phase={0.33} coop={coop} />
            <GodsBox phase={0.66} coop={coop} />
            <ReglerStabel coop={coop} />

            <Burst position={[EU_X - 1.4, 1.8, 0]} trigger={burst} color="#bfdbfe" count={30} spread={4} />
        </group>
    );
}

// Norge: en liten øy med to hus og et flagg. Flagget blekner litt når selvstyret faller.
function NorgeOya({ coop }: { coop: number }) {
    const flag = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (!flag.current) return;
        const liv = 0.35 + 0.65 * (selvstyre(coop) / 100);
        flag.current.opacity = damp(flag.current.opacity, liv, dt, 4);
    });
    return (
        <group position={[NORGE_X, 0, 0]}>
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[2.4, 2.7, 0.7, 24]} />
                <meshStandardMaterial color="#8fbf6b" roughness={1} />
            </mesh>
            {/* hus */}
            <House x={-0.6} z={-0.7} color="#c0563f" />
            <House x={0.7} z={0.4} color="#d68a4a" />
            {/* flaggstang + flagg */}
            <mesh position={[-1.3, 1.1, 0.9]} castShadow>
                <cylinderGeometry args={[0.05, 0.05, 1.8, 6]} />
                <meshStandardMaterial color="#cbd5e1" />
            </mesh>
            <mesh position={[-0.9, 1.5, 0.9]}>
                <planeGeometry args={[0.8, 0.5]} />
                <meshStandardMaterial
                    ref={flag}
                    color="#d4322a"
                    transparent
                    opacity={1}
                    side={THREE.DoubleSide}
                    roughness={0.8}
                />
            </mesh>
        </group>
    );
}

function House({ x, z, color }: { x: number; z: number; color: string }) {
    return (
        <group position={[x, 0.35, z]}>
            <mesh castShadow>
                <boxGeometry args={[0.7, 0.6, 0.7]} />
                <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[0.62, 0.45, 4]} />
                <meshStandardMaterial color="#6b4a3a" roughness={0.9} />
            </mesh>
        </group>
    );
}

// EU: en større øy, en ring av blå bygg, og et rundt bord med flaggpinner. Én
// pinne (Norges stol) står tom og grå til fullt medlemskap, da blir den rød.
function EUmarked({ coop }: { coop: number }) {
    const ring = Array.from({ length: 7 }, (_, i) => (i / 7) * Math.PI * 2);
    return (
        <group position={[EU_X, 0, 0]}>
            <mesh castShadow receiveShadow>
                <cylinderGeometry args={[3.1, 3.4, 0.7, 28]} />
                <meshStandardMaterial color="#7c93c8" roughness={1} />
            </mesh>
            {/* ring av indre-marked-bygg */}
            {ring.map((a, i) => (
                <mesh
                    key={i}
                    position={[Math.cos(a) * 2.1, 0.7 + (i % 3) * 0.25, Math.sin(a) * 2.1]}
                    castShadow
                >
                    <boxGeometry args={[0.6, 1 + (i % 3) * 0.5, 0.6]} />
                    <meshStandardMaterial color="#3b5bb5" roughness={0.7} />
                </mesh>
            ))}
            {/* EUs bord */}
            <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[1.05, 1.05, 0.12, 24]} />
                <meshStandardMaterial color="#f4d35e" emissive="#f59e0b" emissiveIntensity={0.2} roughness={0.5} />
            </mesh>
            {/* andre medlemmers stoler (blå) */}
            {Array.from({ length: 6 }, (_, i) => ((i + 0.5) / 7) * Math.PI * 2).map((a, i) => (
                <mesh key={i} position={[Math.cos(a) * 1.3, 0.75, Math.sin(a) * 1.3]} castShadow>
                    <boxGeometry args={[0.22, 0.4, 0.22]} />
                    <meshStandardMaterial color="#1d3a8a" />
                </mesh>
            ))}
            {/* Norges stol */}
            <NorskStol coop={coop} />
        </group>
    );
}

function NorskStol({ coop }: { coop: number }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const grp = useRef<THREE.Group>(null);
    // bak ved bordet, "tom" plass
    const a = (6.5 / 7) * Math.PI * 2;
    useFrame((_, dt) => {
        const med = smooth(coop, 0.82, 0.95); // 0 = tom, 1 = norsk flagg
        if (mat.current) {
            mat.current.color.lerp(new THREE.Color(med > 0.5 ? '#d4322a' : '#9aa6bd'), 1 - Math.exp(-5 * dt));
            mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, med * 0.6, dt, 5);
        }
        if (grp.current) {
            const y = damp(grp.current.position.y, 0.75 + med * 0.25, dt, 5);
            grp.current.position.set(Math.cos(a) * 1.3, y, Math.sin(a) * 1.3);
            const s = damp(grp.current.scale.x, 0.8 + med * 0.6, dt, 5);
            grp.current.scale.setScalar(s);
        }
    });
    return (
        <group ref={grp} position={[Math.cos(a) * 1.3, 0.75, Math.sin(a) * 1.3]}>
            <mesh castShadow>
                <boxGeometry args={[0.24, 0.42, 0.24]} />
                <meshStandardMaterial ref={mat} color="#9aa6bd" emissive="#d4322a" emissiveIntensity={0} />
            </mesh>
        </group>
    );
}

// Broen: et dekk som vokser ut fra Norge mot EU når samarbeidet øker.
function Bro({ coop }: { coop: number }) {
    const deck = useRef<THREE.Mesh>(null);
    const len = useRef(0.0001);
    useFrame((_, dt) => {
        const target = connection(coop) * SPAN;
        len.current = damp(len.current, target, dt, 5);
        if (deck.current) {
            deck.current.scale.x = Math.max(0.0001, len.current);
            deck.current.position.x = BRIDGE_START + len.current / 2;
            deck.current.visible = len.current > 0.05;
        }
    });
    return (
        <group>
            <mesh ref={deck} position={[BRIDGE_START, BRIDGE_Y, 0]} castShadow>
                <boxGeometry args={[1, 0.16, 1.5]} />
                <meshStandardMaterial color="#caa472" roughness={0.9} />
            </mesh>
            {/* pilarer */}
            {[-2, 0.6, 3].map((x, i) => (
                <BroPilar key={i} x={x} coop={coop} />
            ))}
        </group>
    );
}

function BroPilar({ x, coop }: { x: number; coop: number }) {
    const m = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (!m.current) return;
        const reach = BRIDGE_START + connection(coop) * SPAN;
        const vis = x < reach ? 1 : 0;
        const s = damp(m.current.scale.y, vis, dt, 6);
        m.current.scale.y = Math.max(0.0001, s);
        m.current.visible = s > 0.05;
    });
    return (
        <mesh ref={m} position={[x, 0.0, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 1, 8]} />
            <meshStandardMaterial color="#8a6f4a" />
        </mesh>
    );
}

// En vare som krysser broen når den er koblet. Står stille (usynlig) ellers.
function GodsBox({ phase, coop }: { phase: number; coop: number }) {
    const m = useRef<THREE.Mesh>(null);
    useFrame((state, dt) => {
        if (!m.current) return;
        const flow = connection(coop);
        const reach = BRIDGE_START + flow * SPAN;
        const t = (state.clock.elapsedTime * 0.18 * (0.4 + flow) + phase) % 1;
        const x = BRIDGE_START + t * (reach - BRIDGE_START);
        m.current.position.x = x;
        m.current.position.y = BRIDGE_Y + 0.22 + Math.sin(t * Math.PI) * 0.12;
        const mat = m.current.material as THREE.MeshStandardMaterial;
        mat.opacity = damp(mat.opacity, flow > 0.1 ? 0.95 : 0, dt, 6);
        m.current.visible = flow > 0.12;
    });
    return (
        <mesh ref={m} position={[BRIDGE_START, BRIDGE_Y + 0.22, 0]} castShadow>
            <boxGeometry args={[0.32, 0.32, 0.32]} />
            <meshStandardMaterial color="#e0a44a" transparent opacity={0} roughness={0.7} />
        </mesh>
    );
}

// EU-regler som daler ned over Norge når samarbeidet øker. Tre blå tavler.
function ReglerStabel({ coop }: { coop: number }) {
    return (
        <group position={[NORGE_X, 0, 0]}>
            {[0, 1, 2].map((i) => (
                <RegelTavle key={i} index={i} coop={coop} />
            ))}
        </group>
    );
}

function RegelTavle({ index, coop }: { index: number; coop: number }) {
    const m = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!m.current) return;
        // hver tavle daler ned etter hvert som samarbeidet stiger
        const trigger = 0.35 + index * 0.18;
        const ned = smooth(coop, trigger, trigger + 0.12);
        const y = damp(m.current.position.y, 2.8 - ned * 1.4, dt, 4);
        m.current.position.y = y;
        const mat = (m.current.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = damp(mat.opacity, ned > 0.05 ? 0.95 : 0, dt, 5);
        m.current.visible = ned > 0.04;
    });
    return (
        <group ref={m} position={[0.2 + index * 0.05, 2.8, 0.4 - index * 0.45]}>
            <mesh castShadow>
                <boxGeometry args={[0.9, 0.12, 0.6]} />
                <meshStandardMaterial color="#2547a8" emissive="#1d3a8a" emissiveIntensity={0.25} transparent opacity={0} />
            </mesh>
        </group>
    );
}

export default EuropaBroen3D;
