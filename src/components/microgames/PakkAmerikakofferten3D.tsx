import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Interactive } from './kit/Interactive';
import { Burst } from './kit/Burst';
import { SceneBanner, SceneBadge, DataReadout, WinScreen } from './kit/overlays';
import { damp } from './kit/damp';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Lyspære-øyeblikk: Du kunne bare ta med EN koffert til Amerika. Alt annet - og
// alle du var glad i - måtte bli igjen. Eleven kjenner på kroppen hvor lite plass
// det var, og hvor vondt det var å velge.
//
// Mekanikk (sorter-i-3D / velg-under-knapphet): Åtte eiendeler ligger rundt en
// åpen amerikakoffert i ei norsk stue på 1880-tallet. Kofferten har plass til
// bare fem. Eleven klikker en gjenstand for å pakke den (den glir ned i
// kofferten), og klikker igjen for å ta den opp. Når fem er pakket, kan kofferten
// lukkes - og resten blir stående igjen.

const CAPACITY = 5;

interface Item {
    id: string;
    name: string;
    why: string;
    color: string;
    // Plass på bordet rundt kofferten.
    shelf: [number, number, number];
    // Form på gjenstanden.
    shape: 'book' | 'frame' | 'brooch' | 'tools' | 'blanket' | 'sack' | 'wheel' | 'toy';
}

const ITEMS: Item[] = [
    { id: 'bibel', name: 'Bibelen', why: 'Troen og trøsten på den lange reisa.', color: '#5b3a29', shelf: [-4.2, 1.05, -0.6], shape: 'book' },
    { id: 'bilde', name: 'Familiebildet', why: 'Det eneste minnet om dem du forlater.', color: '#8a6d3b', shelf: [-2.9, 1.05, -1.4], shape: 'frame' },
    { id: 'solje', name: 'Sølvsølja', why: 'Bestemors arvesølv - litt Norge å ha på seg.', color: '#cfd4d8', shelf: [-1.4, 1.05, -1.7], shape: 'brooch' },
    { id: 'verktoy', name: 'Verktøykassa', why: 'For å bygge et nytt hus på prærien.', color: '#6b4a2a', shelf: [0.1, 1.05, -1.8], shape: 'tools' },
    { id: 'teppe', name: 'Ullteppet', why: 'Varme på det kalde mellomdekket over Atlanteren.', color: '#9c3f3f', shelf: [1.6, 1.05, -1.6], shape: 'blanket' },
    { id: 'mat', name: 'Matsekken', why: 'Flatbrød og spekemat til ukene på sjøen.', color: '#b59a6a', shelf: [3.0, 1.05, -1.2], shape: 'sack' },
    { id: 'rokk', name: 'Rokken', why: 'Å spinne ull var levebrød og håndverk.', color: '#7a5535', shelf: [4.2, 1.05, -0.4], shape: 'wheel' },
    { id: 'leke', name: 'Treleka', why: 'Barnas eneste leke i det nye landet.', color: '#c98b3a', shelf: [-3.6, 1.05, 0.4], shape: 'toy' },
];

const PakkAmerikakofferten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [packed, setPacked] = useState<string[]>([]);
    const [hovered, setHovered] = useState<string | null>(null);
    const [closed, setClosed] = useState(false);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const full = packed.length >= CAPACITY;

    const toggle = (item: Item) => {
        if (closed) return;
        setPacked((cur) => {
            if (cur.includes(item.id)) {
                sounds.play('pick');
                return cur.filter((id) => id !== item.id);
            }
            if (cur.length >= CAPACITY) {
                sounds.play('incorrect');
                return cur; // ingen plass igjen
            }
            sounds.play('drop');
            return [...cur, item.id];
        });
    };

    const sendOff = () => {
        if (!full || closed) return;
        setClosed(true);
        sounds.play('sceneChange');
        setTimeout(() => {
            setDone(true);
            setBurst((b) => b + 1);
            sounds.play('complete');
            onComplete({ score: 1, completed: true, artifact: { packed } });
        }, 1700);
    };

    const reset = () => {
        setPacked([]);
        setClosed(false);
        setDone(false);
        setHovered(null);
    };

    const banner = closed
        ? 'Lokket er igjen. Resten blir stående.'
        : hovered
          ? `${ITEMS.find((i) => i.id === hovered)?.name}: ${ITEMS.find((i) => i.id === hovered)?.why}`
          : full
            ? 'Kofferten er full. Lukk den og reis - eller bytt ut noe.'
            : 'Klikk det du vil ta med. Det er plass til bare fem ting.';

    return (
        <MicroGameScaffold
            title="Pakk amerikakofferten"
            subtitle="Velg de fem viktigste tingene å ta med til det nye landet"
            estimatedSeconds={140}
            onRetry={packed.length > 0 || done ? reset : undefined}
            scene={
                <PackScene
                    packed={packed}
                    closed={closed}
                    hovered={hovered}
                    onHover={setHovered}
                    onPick={toggle}
                    burst={burst}
                />
            }
            canvas={{
                idle: packed.length === 0 && !done,
                camera: { position: [0, 5.4, 8.2], fov: 42 },
                background: '#e8dcc2',
                fog: { color: '#e3d4b8', near: 16, far: 30 },
                target: [0, 0.8, 0.6],
            }}
            containerClassName="bg-gradient-to-b from-[#efe2c6] via-[#e8dcc2] to-[#d8c39a]"
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Pakket', value: packed.length, unit: `/ ${CAPACITY}` },
                            { label: 'Blir igjen', value: ITEMS.length - packed.length },
                        ]}
                    />
                    <SceneBadge corner="br">1880-tallet</SceneBadge>
                </>
            }
        >
            {done ? (
                <WinScreen title="Kofferten er pakket - og båten venter." onReplay={reset}>
                    Du fikk plass til fem ting. Tre måtte bli igjen, og det samme måtte
                    foreldrene, vennene og hjembygda di. Det var prisen utvandrerne betalte: en
                    koffert med seg, et helt liv lagt igjen.
                </WinScreen>
            ) : (
                <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-600 leading-snug">
                        {full
                            ? 'Du har valgt fem. Klikk en pakket ting for å bytte, eller lukk kofferten.'
                            : `Velg ${CAPACITY - packed.length} ting til. Klikk en gjenstand i scenen.`}
                    </p>
                    <button
                        onClick={sendOff}
                        disabled={!full || closed}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                            full && !closed
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        Lukk kofferten og reis
                    </button>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function PackScene({
    packed,
    closed,
    hovered,
    onHover,
    onPick,
    burst,
}: {
    packed: string[];
    closed: boolean;
    hovered: string | null;
    onHover: (id: string | null) => void;
    onPick: (item: Item) => void;
    burst: number;
}) {
    return (
        <group>
            <Room />
            <Table />
            <Trunk closed={closed} fill={packed.length} />
            {ITEMS.map((item) => {
                const packIndex = packed.indexOf(item.id);
                return (
                    <PackItem
                        key={item.id}
                        item={item}
                        packIndex={packIndex}
                        hovered={hovered === item.id}
                        onHover={onHover}
                        onPick={onPick}
                    />
                );
            })}
            <Parents />
            <Burst position={[0, 1.6, 0.6]} trigger={burst} color="#d8b24a" count={28} spread={3.2} />
        </group>
    );
}

// Stuegulv og bakvegg i tømmer.
function Room() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[26, 22]} />
                <meshStandardMaterial color="#9c7b4e" roughness={1} />
            </mesh>
            <mesh position={[0, 3, -4.2]} receiveShadow>
                <boxGeometry args={[26, 7, 0.4]} />
                <meshStandardMaterial color="#b8966a" roughness={0.95} />
            </mesh>
            {/* Tømmerstokk-striper på veggen */}
            {[0.7, 1.7, 2.7, 3.7, 4.7].map((y) => (
                <mesh key={y} position={[0, y, -4.0]}>
                    <boxGeometry args={[26, 0.05, 0.05]} />
                    <meshStandardMaterial color="#8a6c45" roughness={1} />
                </mesh>
            ))}
            {/* Vindu med kveldslys */}
            <mesh position={[-7, 3.2, -3.95]}>
                <planeGeometry args={[2.6, 2.2]} />
                <meshStandardMaterial color="#f3d79b" emissive="#e8b85a" emissiveIntensity={0.5} roughness={0.6} />
            </mesh>
        </group>
    );
}

// Bordet gjenstandene ligger på.
function Table() {
    return (
        <group position={[0, 0, -1.1]}>
            <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
                <boxGeometry args={[11, 0.18, 2.4]} />
                <meshStandardMaterial color="#7a5535" roughness={0.85} />
            </mesh>
            {[[-5.2, -0.9], [5.2, -0.9], [-5.2, 0.9], [5.2, 0.9]].map((p, i) => (
                <mesh key={i} position={[p[0], 0.45, p[1]]} castShadow>
                    <boxGeometry args={[0.22, 0.9, 0.22]} />
                    <meshStandardMaterial color="#5c3f26" roughness={0.9} />
                </mesh>
            ))}
        </group>
    );
}

// Amerikakofferten - åpen kasse med lokk som lukkes når reisen starter.
function Trunk({ closed, fill }: { closed: boolean; fill: number }) {
    const lid = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!lid.current) return;
        // Åpent lokk står bakover (~ -2.0 rad), lukket lokk ligger flatt (0).
        const target = closed ? 0 : -2.0;
        lid.current.rotation.x = damp(lid.current.rotation.x, target, dt, 4);
    });
    return (
        <group position={[0, 0, 1.4]}>
            {/* Bunnkasse */}
            <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.4, 1.1, 2.2]} />
                <meshStandardMaterial color="#6b4326" roughness={0.85} />
            </mesh>
            {/* Innside (mørkere) */}
            <mesh position={[0, 0.75, 0]}>
                <boxGeometry args={[3.0, 0.9, 1.8]} />
                <meshStandardMaterial color="#3a2616" roughness={1} />
            </mesh>
            {/* Jernbeslag */}
            {[-1.5, 1.5].map((x) => (
                <mesh key={x} position={[x, 0.55, 0]}>
                    <boxGeometry args={[0.12, 1.12, 2.24]} />
                    <meshStandardMaterial color="#3b3b3b" metalness={0.5} roughness={0.5} />
                </mesh>
            ))}
            {/* Lokk - hengslet bak (z = -1.1) */}
            <group ref={lid} position={[0, 1.1, -1.1]}>
                <mesh position={[0, 0, 1.1]} castShadow>
                    <boxGeometry args={[3.4, 0.22, 2.2]} />
                    <meshStandardMaterial color="#5c3a22" roughness={0.85} />
                </mesh>
            </group>
            {/* Liten merkelapp foran når noe er pakket */}
            {fill > 0 && (
                <mesh position={[0, 0.55, 1.13]}>
                    <planeGeometry args={[0.8, 0.5]} />
                    <meshStandardMaterial color="#f3ece0" roughness={0.9} />
                </mesh>
            )}
        </group>
    );
}

// En gjenstand som glir mellom bordplass og koffert.
function PackItem({
    item,
    packIndex,
    hovered,
    onHover,
    onPick,
}: {
    item: Item;
    packIndex: number;
    hovered: boolean;
    onHover: (id: string | null) => void;
    onPick: (item: Item) => void;
}) {
    const group = useRef<THREE.Group>(null);
    const isPacked = packIndex >= 0;

    // Mål: enten bordplassen, eller en stableposisjon inne i kofferten.
    // Utledet rent fra packIndex, så vi aldri muterer en ref under render.
    const target = useMemo<[number, number, number]>(() => {
        if (packIndex < 0) return item.shelf;
        const col = packIndex % 3;
        const row = Math.floor(packIndex / 3);
        return [-0.9 + col * 0.9, 0.6 + row * 0.34, 1.4 + (packIndex % 2 ? 0.2 : -0.2)];
    }, [packIndex, item.shelf]);

    useFrame((_, dt) => {
        if (!group.current) return;
        const p = group.current.position;
        // Gjenstanden glir mykt mot målet (raskere demping = snappy).
        p.x = damp(p.x, target[0], dt, 6);
        p.y = damp(p.y, target[1], dt, 6);
        p.z = damp(p.z, target[2], dt, 6);
    });

    return (
        <group ref={group} position={item.shelf}>
            <Interactive
                onSelect={() => onPick(item)}
                onHover={(h) => onHover(h ? item.id : null)}
                state={isPacked ? 'selected' : hovered ? 'hover' : 'idle'}
                hitArea={[1.2, 1.2, 1.2]}
            >
                <ItemMesh shape={item.shape} color={item.color} highlight={hovered || isPacked} />
            </Interactive>
        </group>
    );
}

function ItemMesh({
    shape,
    color,
    highlight,
}: {
    shape: Item['shape'];
    color: string;
    highlight: boolean;
}) {
    const emissive = highlight ? '#facc15' : '#000000';
    const ei = highlight ? 0.28 : 0;
    const mat = (c: string = color) => (
        <meshStandardMaterial color={c} emissive={emissive} emissiveIntensity={ei} roughness={0.8} />
    );
    switch (shape) {
        case 'book':
            return (
                <mesh castShadow>
                    <boxGeometry args={[0.5, 0.7, 0.16]} />
                    {mat()}
                </mesh>
            );
        case 'frame':
            return (
                <group>
                    <mesh castShadow>
                        <boxGeometry args={[0.6, 0.46, 0.08]} />
                        {mat()}
                    </mesh>
                    <mesh position={[0, 0, 0.05]}>
                        <planeGeometry args={[0.42, 0.3]} />
                        <meshStandardMaterial color="#d9c7a6" roughness={0.9} />
                    </mesh>
                </group>
            );
        case 'brooch':
            return (
                <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.22, 0.07, 8, 16]} />
                    <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} metalness={0.6} roughness={0.3} />
                </mesh>
            );
        case 'tools':
            return (
                <group>
                    <mesh castShadow>
                        <boxGeometry args={[0.7, 0.4, 0.45]} />
                        {mat()}
                    </mesh>
                    <mesh position={[0, 0.32, 0]}>
                        <torusGeometry args={[0.18, 0.03, 6, 14, Math.PI]} />
                        <meshStandardMaterial color="#3b3b3b" metalness={0.4} roughness={0.6} />
                    </mesh>
                </group>
            );
        case 'blanket':
            return (
                <mesh castShadow>
                    <boxGeometry args={[0.7, 0.34, 0.5]} />
                    {mat()}
                </mesh>
            );
        case 'sack':
            return (
                <mesh castShadow>
                    <sphereGeometry args={[0.36, 10, 10]} />
                    {mat()}
                </mesh>
            );
        case 'wheel':
            return (
                <group>
                    <mesh castShadow rotation={[0, 0, 0]}>
                        <torusGeometry args={[0.34, 0.05, 8, 18]} />
                        {mat()}
                    </mesh>
                    {[0, 1, 2, 3].map((i) => (
                        <mesh key={i} rotation={[0, 0, (i * Math.PI) / 4]}>
                            <boxGeometry args={[0.62, 0.04, 0.04]} />
                            {mat()}
                        </mesh>
                    ))}
                </group>
            );
        case 'toy':
            return (
                <group>
                    <mesh castShadow>
                        <boxGeometry args={[0.5, 0.26, 0.24]} />
                        {mat()}
                    </mesh>
                    {[[-0.16, -0.18], [0.16, -0.18]].map((p, i) => (
                        <mesh key={i} position={[p[0], p[1], 0.13]} rotation={[Math.PI / 2, 0, 0]}>
                            <cylinderGeometry args={[0.09, 0.09, 0.06, 12]} />
                            <meshStandardMaterial color="#3b2a1a" roughness={0.8} />
                        </mesh>
                    ))}
                </group>
            );
    }
}

// Foreldrene som blir igjen - to figurer ved døråpningen i bakgrunnen.
function Parents() {
    const group = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (!group.current) return;
        // En liten, sorgmodig vugging.
        group.current.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.02;
    });
    return (
        <group ref={group} position={[6.4, 0, -3.2]}>
            <Figure x={-0.5} body="#5a4632" />
            <Figure x={0.5} body="#6b5a48" />
        </group>
    );
}

function Figure({ x, body }: { x: number; body: string }) {
    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, 0.7, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.3, 1.2, 8]} />
                <meshStandardMaterial color={body} roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.5, 0]} castShadow>
                <sphereGeometry args={[0.22, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.85} />
            </mesh>
        </group>
    );
}

export default PakkAmerikakofferten3D;
