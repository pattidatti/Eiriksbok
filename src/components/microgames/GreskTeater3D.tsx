import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Volume2 } from 'lucide-react';
import {
    MicroGameScaffold,
    GroundPlane,
    Figure,
    Hotspot,
    Burst,
    SceneBanner,
    SceneBadge,
    SceneFact,
    StepTracker,
    WinScreen,
    damp,
    useStage,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: bygg et gresk teater inn i en ås, ett trinn av gangen. Eleven
// legger ned orkhestra (dansegulvet), reiser tilskuerplassene i en halvsirkel
// og setter opp skene (scenehuset). Når alt står, går en skuespiller ut på
// gulvet og lyden ringer som bølger helt opp til øverste rad. Lyspæra:
// formen på teateret - en halvsirkel skåret inn i en ås - var selve grunnen
// til at EN stemme kunne nå tusenvis av tilskuere.

const TIERS = 7;

const GreskTeater3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const { stage, advance, reset, atEnd } = useStage(3);
    const burst = useRef(0);

    useEffect(() => {
        if (atEnd) {
            burst.current += 1;
            sounds.play('complete');
            onComplete({ score: 1, completed: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atEnd]);

    const place = () => {
        sounds.play(stage === 2 ? 'advance' : 'drop');
        advance();
    };

    const handleReset = () => {
        reset();
    };

    const banner = atEnd
        ? null
        : stage === 0
        ? 'Trykk på den gule markøren for å legge ned orkhestra - det runde dansegulvet.'
        : stage === 1
        ? 'Bra! Trykk på markøren oppe i bakken for å bygge tilskuerplassene.'
        : 'Til slutt: trykk på markøren bak orkhestra for å reise skene - scenehuset.';

    return (
        <MicroGameScaffold
            title="Bygg det greske teateret"
            subtitle="Sett sammen de tre delene, og oppdag hvorfor formen bærer lyden"
            estimatedSeconds={150}
            onRetry={stage > 0 ? handleReset : undefined}
            canvas={{
                idle: stage === 0,
                camera: { position: [11, 9, 11], fov: 42 },
                target: [0, 1.6, 1],
                background: '#cfe3ef',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {atEnd ? 'Dionysos-teateret' : 'Athen, 400-tallet fvt'}
                    </SceneBadge>
                </>
            }
            scene={<TheatreScene stage={stage} burst={burst.current} onPlace={place} />}
        >
            {!atEnd && (
                <div className="flex flex-col gap-3">
                    <StepTracker current={stage} total={3} />
                    <SceneFact>
                        Et gresk teater hadde tre faste deler: orkhestra (dansegulvet for koret),
                        theatron (tilskuerplassene) og skene (scenehuset bak). Klikk markøren for å
                        bygge neste del.
                    </SceneFact>
                </div>
            )}

            {atEnd && (
                <WinScreen title="Teateret står - og lyden bærer!" onReplay={handleReset}>
                    <span className="inline-flex items-center gap-1 align-middle">
                        <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                    </span>{' '}
                    Se hvordan lyden ringer som bølger helt opp til øverste rad. Grekerne bygde
                    teatrene inn i en ås og formet plassene som en halvsirkel. Da kunne en eneste
                    skuespiller høres av over ti tusen tilskuere - helt uten mikrofon. Formen var
                    selve hemmeligheten.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function TheatreScene({
    stage,
    burst,
    onPlace,
}: {
    stage: number;
    burst: number;
    onPlace: () => void;
}) {
    return (
        <group>
            <GroundPlane size={46} depth={34} color="#9bb36a" />

            {/* Orkhestra - det runde dansegulvet (del 1) */}
            <Placeable shown={stage >= 1}>
                <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                    <circleGeometry args={[2.6, 40]} />
                    <meshStandardMaterial color="#d8c089" roughness={1} />
                </mesh>
                <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[2.45, 2.6, 40]} />
                    <meshStandardMaterial color="#bb9a55" roughness={1} />
                </mesh>
                {/* Alteret (thymele) midt på gulvet */}
                <mesh position={[0, 0.35, 0]} castShadow>
                    <cylinderGeometry args={[0.28, 0.34, 0.6, 12]} />
                    <meshStandardMaterial color="#efe6cf" roughness={0.9} />
                </mesh>
            </Placeable>

            {/* Theatron - tilskuerplassene i en stigende halvsirkel (del 2) */}
            <Placeable shown={stage >= 2}>
                {Array.from({ length: TIERS }).map((_, i) => {
                    const r = 3.5 + i * 0.78;
                    const y = 0.4 + i * 0.62;
                    return (
                        <mesh
                            key={i}
                            position={[0, y, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            castShadow
                            receiveShadow
                        >
                            <torusGeometry args={[r, 0.3, 8, 44, Math.PI]} />
                            <meshStandardMaterial color="#ded2b6" roughness={0.95} />
                        </mesh>
                    );
                })}
            </Placeable>

            {/* Skene - scenehuset bak orkhestra (del 3) */}
            <Placeable shown={stage >= 3}>
                <Skene position={[0, 0, 4.3]} />
            </Placeable>

            {/* Skuespilleren går ut når alt står */}
            <Placeable shown={stage >= 3}>
                <Figure position={[0, 0.06, 0.6]} body="#b8742e" skin="#e6c39a" />
            </Placeable>

            {/* Lyd-bølger som ringer ut over plassene */}
            {stage >= 3 && <SoundRings />}

            {/* Byggemarkører - kun for det aktive trinnet */}
            {stage === 0 && (
                <Hotspot
                    position={[0, 0.9, 0]}
                    radius={0.7}
                    label="Legg ned orkhestra"
                    onSelect={onPlace}
                />
            )}
            {stage === 1 && (
                <Hotspot
                    position={[0, 3.6, -3.6]}
                    radius={0.7}
                    label="Bygg tilskuerplassene"
                    onSelect={onPlace}
                />
            )}
            {stage === 2 && (
                <Hotspot
                    position={[0, 1.7, 4.3]}
                    radius={0.7}
                    label="Reis skene"
                    onSelect={onPlace}
                />
            )}

            <Burst position={[0, 1, 0]} trigger={burst} color="#f0c64a" count={30} spread={4} />
        </group>
    );
}

// Mykt skalerer barna inn fra null når shown blir sann. All animasjon i refs.
function Placeable({ shown, children }: { shown: boolean; children: React.ReactNode }) {
    const ref = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (!ref.current) return;
        const target = shown ? 1 : 0.0001;
        const s = damp(ref.current.scale.x, target, dt, 5);
        ref.current.scale.setScalar(s);
    });
    return (
        <group ref={ref} scale={0.0001}>
            {children}
        </group>
    );
}

// Skene - et lavt scenehus med søyler, vendt mot tilskuerne.
function Skene({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
                <boxGeometry args={[7, 2.2, 1]} />
                <meshStandardMaterial color="#e7ddc4" roughness={0.9} />
            </mesh>
            {/* Tak */}
            <mesh position={[0, 2.35, 0]} castShadow>
                <boxGeometry args={[7.4, 0.35, 1.4]} />
                <meshStandardMaterial color="#d4c7a4" roughness={0.9} />
            </mesh>
            {/* Søyler foran */}
            {[-2.6, -1.3, 0, 1.3, 2.6].map((x) => (
                <mesh key={x} position={[x, 1.05, -0.65]} castShadow>
                    <cylinderGeometry args={[0.22, 0.26, 2.1, 12]} />
                    <meshStandardMaterial color="#f1e9d4" roughness={0.85} />
                </mesh>
            ))}
            {/* Døråpning (paraskenion) */}
            <mesh position={[0, 0.85, -0.52]}>
                <boxGeometry args={[1, 1.7, 0.05]} />
                <meshStandardMaterial color="#7c6a4a" roughness={0.95} />
            </mesh>
        </group>
    );
}

// Tre konsentriske ringer som vokser utover fra dansegulvet og toner ut igjen,
// som lyd som ruller opp over tilskuerplassene. Lever helt i refs.
const RING_COUNT = 3;

function SoundRings() {
    const group = useRef<THREE.Group>(null);
    const t = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        t.current += dt * 0.6;
        group.current.children.forEach((child, i) => {
            const phase = (t.current + i / RING_COUNT) % 1;
            const scale = 0.4 + phase * 9;
            child.scale.set(scale, scale, scale);
            const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
            mat.opacity = 0.5 * (1 - phase);
        });
    });
    return (
        <group ref={group} position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            {Array.from({ length: RING_COUNT }).map((_, i) => (
                <mesh key={i}>
                    <ringGeometry args={[0.92, 1, 48, 1, 0, Math.PI]} />
                    <meshBasicMaterial
                        color="#f0c64a"
                        transparent
                        opacity={0.4}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

export default GreskTeater3D;
