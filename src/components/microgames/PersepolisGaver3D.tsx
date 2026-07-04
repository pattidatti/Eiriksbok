import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Column,
    Person,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    DataReadout,
    DragHint,
    Burst,
    Particles,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til "Perserriket: Det første verdensriket".
//
// Lyspaere: Perserriket var det foerste verdensriket. Det holdt dusinvis av ulike
// folkeslag sammen ved aa la hvert folk beholde sin egen drakt og sine egne skikker,
// mens ALLE boeyde seg for EN konge. Relieffene paa Apadana-trappa i Persepolis viser
// nettopp dette: utsendinger fra hele riket, hver i sin nasjonaldrakt og med sin egen
// gave, i prosesjon fram til storkongen.
//
// Mekanikk: Draggable (transport + plassering). Eleven drar hvert folk sin delegasjon
// fram til tronen. Hver har ulik drakt og ulik gave fra sitt land. Naar alle fem har
// boeyd seg, er riket "samlet" - ett rike, mange folk, en konge.

type GiftKind = 'vessel' | 'amphora' | 'basket' | 'cloth' | 'tusk';

interface Delegation {
    id: string;
    folk: string; // navnet paa folket
    gaveKort: string; // kort gavenavn til banner
    fakta: string; // faktakort under vinduet
    robe: string; // draktfarge (poenget: hvert folk beholder sin egen)
    skin: string;
    gift: GiftKind;
    giftColor: string;
}

const DELEGATIONS: Delegation[] = [
    {
        id: 'lyderne',
        folk: 'Lyderne',
        gaveKort: 'gullkar',
        fakta: 'Lyderne kom fra Lydia, langt vest i dagens Tyrkia. De var kjent som rike handelsfolk, og ga storkongen fine kar og armbaand av gull.',
        robe: '#6d3b8f',
        skin: '#d9a878',
        gift: 'vessel',
        giftColor: '#f3c64b',
    },
    {
        id: 'armenerne',
        folk: 'Armenerne',
        gaveKort: 'en vinkrukke',
        fakta: 'Armenerne bodde nord i riket, i fjellene rundt Kaukasus. De ga kongen en vakker krukke med vin fra landet sitt.',
        robe: '#2f6f86',
        skin: '#d9a878',
        gift: 'amphora',
        giftColor: '#b5623a',
    },
    {
        id: 'inderne',
        folk: 'Inderne',
        gaveKort: 'gullstoev',
        fakta: 'Fra Indusdalen heilt oest i riket kom inderne med kurver fulle av gullstoev. India var rikets rikeste hjoerne paa gull.',
        robe: '#d68a2e',
        skin: '#a9713f',
        gift: 'basket',
        giftColor: '#ffd34d',
    },
    {
        id: 'babylonerne',
        folk: 'Babylonerne',
        gaveKort: 'fint vevd toey',
        fakta: 'Babylon laa ved elvene i dagens Irak og var en av verdens eldste storbyer. Babylonerne ga kongen fint vevd toey og stoff.',
        robe: '#9c2b3a',
        skin: '#d9a878',
        gift: 'cloth',
        giftColor: '#3f7f7a',
    },
    {
        id: 'nubierne',
        folk: 'Nubierne',
        gaveKort: 'elfenbein',
        fakta: 'Nubierne kom heilt fra soer, ved Nilen soer for Egypt. De baar en stoetann av elfenbein, en sjelden skatt fra Afrika.',
        robe: '#4a3626',
        skin: '#6b4326',
        gift: 'tusk',
        giftColor: '#efe8d6',
    },
];

// Ruten: eleven drar fra basen (naer kamera) fram til tronen (bak).
const BASE_Z = 5.5;
const PLACED_Z = -3.0;
const THRONE_Z = -6.2;
const BASE_X = [-4.4, -2.2, 0, 2.2, 4.4];
const PLACED_X = [-3.4, -1.7, 0, 1.7, 3.4];
const SNAP_RADIUS = 3.2;

const START_BANNER =
    'Utsendinger fra hele riket venter. Dra det foerste folket fram til storkongen og la dem boeye seg.';

const PersepolisGaver3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [delivered, setDelivered] = useState(0);
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);

    const done = delivered >= DELEGATIONS.length;

    const reset = () => {
        setDelivered(0);
        setBanner(START_BANNER);
        setFact(null);
    };

    const handleDeliver = () => {
        const d = DELEGATIONS[delivered];
        const next = delivered + 1;
        setDelivered(next);
        setBurst((b) => b + 1);
        setFact(d.fakta);
        if (next >= DELEGATIONS.length) {
            sounds.play('complete');
            setBanner(null);
            window.setTimeout(() => onComplete({ score: 1, completed: true }), 500);
        } else {
            sounds.play('advance');
            setBanner(
                `${d.folk} ga ${d.gaveKort} til storkongen. Ett folk til, men samme konge. Dra det neste fram.`
            );
        }
    };

    return (
        <MicroGameScaffold
            title="Persepolis: gavene til storkongen"
            subtitle="Dra hvert folk fram til tronen. Ulik drakt, ulik gave, men EN konge for alle."
            estimatedSeconds={150}
            onRetry={delivered > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 7.8, 12.5], fov: 42 },
                target: [0, 1.2, -3],
                background: '#e8d5a2',
                fog: { near: 30, far: 66 },
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {done ? 'Ett rike, mange folk' : 'Persepolis, ca. 500 fvt'}
                    </SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Folk som har boeyd seg', value: `${delivered} / 5` },
                                {
                                    label: 'Riket',
                                    value: delivered === 0 ? 'Splittet' : 'Vokser',
                                },
                            ]}
                        />
                    )}
                    <DragHint show={delivered === 0} corner="bc">
                        Dra den naermeste utsendingen fram til kongen paa tronen
                    </DragHint>
                </>
            }
            scene={
                <PersepolisScene
                    delivered={delivered}
                    burst={burst}
                    onDeliver={handleDeliver}
                    onPick={() => sounds.play('pick')}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            I Persepolis moettes utsendinger fra hele det store riket for aa gi
                            gaver til kongen. Legg merke til at hvert folk har sin{' '}
                            <span className="font-bold text-slate-700">egen drakt</span> og sin{' '}
                            <span className="font-bold text-amber-700">egen gave</span>. Dra dem
                            fram til tronen, en om gangen.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Det foerste verdensriket: ett rike, mange folk" onReplay={reset}>
                        Alle fem folkene boeyde seg for samme konge, men fikk beholde sin egen drakt,
                        sitt eget spraak og sine egne skikker. Det var nettopp slik Perserriket klarte
                        aa holde saa mange ulike folk samlet i ett rike. Toleranse og respekt for de
                        erobrede var like viktig som haeren. Derfor kaller vi det verdens foerste
                        virkelige verdensrike.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function PersepolisScene({
    delivered,
    burst,
    onDeliver,
    onPick,
}: {
    delivered: number;
    burst: number;
    onDeliver: () => void;
    onPick: () => void;
}) {
    const active = delivered < DELEGATIONS.length ? DELEGATIONS[delivered] : null;

    return (
        <group>
            {/* Steingrunn i lys sandstein */}
            <GroundPlane size={44} depth={40} color="#cdb887" />

            {/* Selve palass-plattformen (en stor lav stein-terrasse bak) */}
            <mesh position={[0, 0.02, -3]} receiveShadow>
                <boxGeometry args={[20, 0.2, 12]} />
                <meshStandardMaterial color="#d8c79b" roughness={0.9} />
            </mesh>

            {/* Trappa opp mot tronen (Apadana-trappa, forenklet) */}
            {[0, 1, 2].map((i) => (
                <mesh key={i} position={[0, 0.12 + i * 0.14, -4.6 - i * 0.5]} receiveShadow castShadow>
                    <boxGeometry args={[8 - i * 0.8, 0.16, 1]} />
                    <meshStandardMaterial color="#cbb583" roughness={0.9} />
                </mesh>
            ))}

            {/* Persepolis-soeyler som flankerer prosesjonen */}
            {[-6.5, 6.5].map((x) =>
                [-5.5, -2.5, 0.5, 3.5].map((z) => (
                    <PersianColumn key={`${x}-${z}`} position={[x, 0, z]} />
                ))
            )}

            {/* Relieff-vegg bak tronen */}
            <mesh position={[0, 1.6, THRONE_Z - 1.4]} castShadow receiveShadow>
                <boxGeometry args={[12, 3.2, 0.5]} />
                <meshStandardMaterial color="#c9b483" roughness={0.95} />
            </mesh>

            {/* Storkongen paa tronen */}
            <GreatKing delivered={delivered} />

            {/* Allerede leverte delegasjoner: staar og boeyer seg for kongen */}
            {DELEGATIONS.slice(0, delivered).map((d, i) => (
                <group key={d.id} position={[PLACED_X[i], 0, PLACED_Z]}>
                    <group rotation={[0, Math.PI, 0]}>
                        <group rotation={[0.32, 0, 0]}>
                            <Person
                                pose="idle"
                                body={d.robe}
                                skin={d.skin}
                                legs={shade(d.robe)}
                                scale={0.95}
                            />
                            <Gift kind={d.gift} color={d.giftColor} />
                        </group>
                    </group>
                </group>
            ))}

            {/* Delegasjoner som fortsatt venter ved basen (utenom den aktive) */}
            {DELEGATIONS.map((d, i) =>
                i > delivered ? (
                    <group key={d.id} position={[BASE_X[i], 0, BASE_Z]}>
                        <Person
                            pose="idle"
                            body={d.robe}
                            skin={d.skin}
                            legs={shade(d.robe)}
                            scale={0.95}
                        />
                        <Gift kind={d.gift} color={d.giftColor} />
                    </group>
                ) : null
            )}

            {/* Den aktive delegasjonen: dras fram til tronen */}
            {active && (
                <Draggable
                    key={active.id}
                    position={[BASE_X[delivered], 0, BASE_Z]}
                    bounds={{ minX: -8, maxX: 8, minZ: -3.4, maxZ: BASE_Z + 1 }}
                    snapPoints={[[0, PLACED_Z]]}
                    snapRadius={SNAP_RADIUS}
                    liftY={0.4}
                    dropFx="dustPuff"
                    onDragStart={onPick}
                    onSnap={onDeliver}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh position={[0, 0.7, 0]}>
                        <boxGeometry args={[2.2, 2.4, 2.2]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <Person
                        pose="idle"
                        body={active.robe}
                        skin={active.skin}
                        legs={shade(active.robe)}
                        scale={0.95}
                    />
                    <Gift kind={active.gift} color={active.giftColor} />
                    {/* Gult gulvmerke som viser at dette folket kan dras */}
                    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.55, 0.72, 24]} />
                        <meshBasicMaterial color="#e3b23c" transparent opacity={0.8} />
                    </mesh>
                </Draggable>
            )}

            {/* Feiring naar et folk har levert */}
            <Burst position={[0, 1.6, PLACED_Z]} trigger={burst} color="#ffd34d" count={24} spread={2.6} />

            {/* Lett stoev i den varme palassluften */}
            <Particles preset="dust" />
        </group>
    );
}

// Storkongen: sitter paa en opphoeyd trone under en baldakin, med krone. Dais-en
// gloeder sterkere for hvert folk som har boeyd seg (riket vokser).
function GreatKing({ delivered }: { delivered: number }) {
    const glow = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (glow.current) {
            const target = 0.15 + (delivered / DELEGATIONS.length) * 0.6;
            glow.current.emissiveIntensity = damp(glow.current.emissiveIntensity, target, dt, 2);
        }
    });
    return (
        <group position={[0, 0, THRONE_Z]}>
            {/* Dais (opphoeyd plattform) */}
            <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
                <boxGeometry args={[3.4, 0.7, 2.6]} />
                <meshStandardMaterial ref={glow} color="#cbb076" emissive="#e3b23c" emissiveIntensity={0.15} roughness={0.7} metalness={0.2} />
            </mesh>
            {/* Trone */}
            <mesh position={[0, 1.0, -0.5]} castShadow>
                <boxGeometry args={[1.4, 0.6, 0.9]} />
                <meshStandardMaterial color="#b98a2f" roughness={0.5} metalness={0.4} />
            </mesh>
            <mesh position={[0, 1.7, -0.9]} castShadow>
                <boxGeometry args={[1.4, 1.2, 0.2]} />
                <meshStandardMaterial color="#c99a3a" roughness={0.5} metalness={0.4} />
            </mesh>
            {/* Kongen sittende, med krone */}
            <group position={[0, 0.9, -0.3]}>
                <Person pose="sit" body="#7a1f7a" skin="#d9a878" legs="#5a184f" hat="crown" scale={1.15} />
            </group>
            {/* Baldakin over tronen */}
            {[-1.2, 1.2].map((x) => (
                <mesh key={x} position={[x, 1.8, -0.5]} castShadow>
                    <cylinderGeometry args={[0.09, 0.09, 3.4, 8]} />
                    <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
                </mesh>
            ))}
            <mesh position={[0, 3.5, -0.5]} castShadow>
                <boxGeometry args={[3.0, 0.16, 1.6]} />
                <meshStandardMaterial color="#9c2b3a" roughness={0.85} />
            </mesh>
        </group>
    );
}

// Persepolis-soeyle: hoey, slank skaft med et enkelt dyre-kapitel paa toppen.
function PersianColumn({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <Column height={4.6} radius={0.3} color="#e0cf9f" />
            {/* Kapitel-antydning: to liggende blokker paa toppen */}
            <mesh position={[0, 4.8, 0]} castShadow>
                <boxGeometry args={[0.9, 0.28, 0.4]} />
                <meshStandardMaterial color="#cdb87f" roughness={0.85} />
            </mesh>
        </group>
    );
}

// Gaven som utsendingen baerer, holdt foran kroppen i armhoeyde.
function Gift({ kind, color }: { kind: GiftKind; color: string }) {
    return (
        <group position={[0, 0.62, 0.24]}>
            {kind === 'vessel' && (
                <group>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.14, 0.1, 0.2, 14]} />
                        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} emissive="#7a5a12" emissiveIntensity={0.2} />
                    </mesh>
                    <mesh position={[0, 0.13, 0]}>
                        <torusGeometry args={[0.13, 0.02, 8, 16]} />
                        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} />
                    </mesh>
                </group>
            )}
            {kind === 'amphora' && (
                <group>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.1, 0.13, 0.26, 14]} />
                        <meshStandardMaterial color={color} roughness={0.7} />
                    </mesh>
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 0.14, 10]} />
                        <meshStandardMaterial color={color} roughness={0.7} />
                    </mesh>
                </group>
            )}
            {kind === 'basket' && (
                <group>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.16, 0.12, 0.18, 14]} />
                        <meshStandardMaterial color="#9c6b3a" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 0.11, 0]}>
                        <sphereGeometry args={[0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                        <meshStandardMaterial color={color} emissive="#a86f12" emissiveIntensity={0.4} metalness={0.5} roughness={0.4} />
                    </mesh>
                </group>
            )}
            {kind === 'cloth' && (
                <group>
                    {[0, 1, 2].map((i) => (
                        <mesh key={i} position={[0, i * 0.08, 0]} castShadow>
                            <boxGeometry args={[0.34, 0.07, 0.24]} />
                            <meshStandardMaterial color={i === 1 ? '#e0c96a' : color} roughness={0.85} />
                        </mesh>
                    ))}
                </group>
            )}
            {kind === 'tusk' && (
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <torusGeometry args={[0.22, 0.045, 8, 16, Math.PI * 0.8]} />
                    <meshStandardMaterial color={color} roughness={0.6} />
                </mesh>
            )}
        </group>
    );
}

// Litt moerkere variant av en farge (til bein/underdrakt), uten aa lese ref-er.
function shade(hex: string): string {
    const c = new THREE.Color(hex);
    c.multiplyScalar(0.7);
    return `#${c.getHexString()}`;
}

export default PersepolisGaver3D;
