import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Draggable,
    GroundPlane,
    Hill,
    Animal,
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

// Mikrospill til "Mansa Musa og Mali-riket".
//
// Lyspære: Mali lå midt på veien mellom salt i nord og gull i sør. I sør var
// salt så sjeldent at det ble byttet mot like mye gull. Eleven drar en saltlast
// sørover over Sahara til gullfeltene (der den blir til gull), og drar så gullet
// nordover. Hver gang en last passerer Timbuktu, fylles Malis skattkammer. Mekanikken
// ER poenget: den som kontrollerte veien mellom salt og gull, ble styrtrik.
//
// Mekanikk: Draggable (transport + forvandling). Eleven drar en last langs orkenen og
// slipper den i målsonen; lasten forvandles og Malis skatt vokser.

// Sonene langs ruten (z-akse: nord = negativ, sør = positiv).
const NORTH_Z = -7;
const SOUTH_Z = 7;
const SNAP_RADIUS = 3.2;

const START_BANNER =
    'Karavanen starter i nord med salt fra Sahara. Dra saltlasten sørover til gullfeltene.';

const KaravanenOverSahara3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [saltDelivered, setSaltDelivered] = useState(false);
    const [goldDelivered, setGoldDelivered] = useState(false);
    const [banner, setBanner] = useState<string | null>(START_BANNER);
    const [fact, setFact] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [burstPos, setBurstPos] = useState<[number, number, number]>([0, 0.8, SOUTH_Z]);

    const deliveries = (saltDelivered ? 1 : 0) + (goldDelivered ? 1 : 0);
    const done = saltDelivered && goldDelivered;

    const reset = () => {
        setSaltDelivered(false);
        setGoldDelivered(false);
        setBanner(START_BANNER);
        setFact(null);
    };

    const handleSaltDrop = () => {
        setSaltDelivered(true);
        sounds.play('advance');
        setBurstPos([0, 0.9, SOUTH_Z]);
        setBurst((b) => b + 1);
        setFact(
            'I sør finnes nesten ingen salt, men folk må ha det for å leve i heten. Derfor byttes salt mot like mye gull, vekt mot vekt.'
        );
        setBanner('Salt verdt sin vekt i gull! Dra nå gullet nordover for å selge det dyrt der.');
    };

    const handleGoldDrop = () => {
        setGoldDelivered(true);
        sounds.play('complete');
        setBurstPos([0, 0.9, NORTH_Z]);
        setBurst((b) => b + 1);
        setBanner(null);
        setFact(null);
        window.setTimeout(() => onComplete({ score: 1, completed: true }), 450);
    };

    return (
        <MicroGameScaffold
            title="Karavanen over Sahara"
            subtitle="Bær salt sør til gullfeltene og gull nord igjen – og se Mali bli rikt på veien"
            estimatedSeconds={150}
            onRetry={deliveries > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [11, 9, 13], fov: 42 },
                target: [0, 0, 0],
                background: '#e9d9b0',
                fog: { near: 34, far: 70 },
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{done ? 'Mali blomstrer' : 'Mali, 1300-tallet'}</SceneBadge>
                    {!done && (
                        <DataReadout
                            corner="bl"
                            items={[
                                { label: 'Laster fraktet', value: `${deliveries} / 2` },
                                { label: 'Malis skattkammer', value: deliveries === 0 ? 'Tomt' : deliveries === 1 ? 'Fylles' : 'Fullt' },
                            ]}
                        />
                    )}
                    <DragHint show={deliveries === 0} corner="bc">
                        Dra den hvite saltlasten sørover til de gylne gullfeltene
                    </DragHint>
                </>
            }
            scene={
                <SaharaScene
                    saltDelivered={saltDelivered}
                    goldDelivered={goldDelivered}
                    deliveries={deliveries}
                    burst={burst}
                    burstPos={burstPos}
                    onSaltDrop={handleSaltDrop}
                    onGoldDrop={handleGoldDrop}
                    onPick={() => sounds.play('pick')}
                />
            }
        >
            <div className="flex flex-col gap-3">
                {!done ? (
                    <>
                        <p className="text-sm text-slate-600 leading-snug">
                            Mali ligger mellom saltgruvene i{' '}
                            <span className="font-bold text-slate-700">nord</span> og gullfeltene i{' '}
                            <span className="font-bold text-amber-700">sør</span>. Dra lasten langs ruten
                            og slipp den i målsonen. Pass på: alt går gjennom byen{' '}
                            <span className="font-bold">Timbuktu</span> i midten.
                        </p>
                        {fact && <SceneFact>{fact}</SceneFact>}
                    </>
                ) : (
                    <WinScreen title="Mali ble rikt på å eie veien!" onReplay={reset}>
                        Salt og gull byttet plass: salt var billig i nord, men verdt sin vekt i gull i
                        sør. Gull var vanlig i sør, men dyrt i nord. Mali lå akkurat midt på veien mellom
                        dem, og krevde toll av hver eneste karavane. Slik ble et rike i Vest-Afrika et av
                        de rikeste i hele middelalderens verden, lenge før europeerne kom.
                    </WinScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function SaharaScene({
    saltDelivered,
    goldDelivered,
    deliveries,
    burst,
    burstPos,
    onSaltDrop,
    onGoldDrop,
    onPick,
}: {
    saltDelivered: boolean;
    goldDelivered: boolean;
    deliveries: number;
    burst: number;
    burstPos: [number, number, number];
    onSaltDrop: () => void;
    onGoldDrop: () => void;
    onPick: () => void;
}) {
    return (
        <group>
            {/* Orkengrunn */}
            <GroundPlane size={46} depth={40} color="#dcc789" />

            {/* Sanddyner spredt utover */}
            <Hill position={[-9, -0.6, -4]} radius={5} height={1.8} color="#cdb574" seed={3} />
            <Hill position={[10, -0.6, -2]} radius={6} height={2.2} color="#d3bd7e" seed={7} />
            <Hill position={[-11, -0.6, 6]} radius={5.5} height={1.6} color="#cab26f" seed={5} />
            <Hill position={[12, -0.6, 8]} radius={5} height={2.0} color="#d6c084" seed={9} />

            {/* Niger-elva ved Timbuktu (blå stripe gjennom midten) */}
            <mesh position={[0, 0.02, 2.2]} rotation={[-Math.PI / 2, 0, 0.06]} receiveShadow>
                <planeGeometry args={[30, 2.4]} />
                <meshStandardMaterial color="#3f88a8" roughness={0.3} metalness={0.15} emissive="#1e4d6b" emissiveIntensity={0.18} />
            </mesh>

            {/* NORD: saltgruven (Taghaza) */}
            <SaltMine />

            {/* SOER: gullfeltene (Wangara) */}
            <GoldField glow={saltDelivered} />

            {/* MIDTEN: Timbuktu + Malis skattkammer som vokser */}
            <Timbuktu deliveries={deliveries} />

            {/* Kamel ved Timbuktu for stemning */}
            <Animal position={[3, 0, 1]} rotation={[0, -0.6, 0]} kind="ox" color="#b9935a" />
            <Person position={[2.2, 0, 0.4]} rotation={[0, -0.5, 0]} scale={0.9} pose="idle" skin="#8a5a33" body="#e8e0cf" legs="#5a4632" hat="hood" />

            {/* LAST 1: saltet (dras sørover) */}
            {!saltDelivered && (
                <Draggable
                    position={[0, 0.45, NORTH_Z]}
                    bounds={{ minX: -12, maxX: 12, minZ: NORTH_Z - 1, maxZ: SOUTH_Z + 1 }}
                    snapPoints={[[0, SOUTH_Z]]}
                    snapRadius={SNAP_RADIUS}
                    liftY={0.5}
                    dropFx="dustPuff"
                    onDragStart={onPick}
                    onSnap={onSaltDrop}
                >
                    {/* Romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh>
                        <boxGeometry args={[2.4, 2.4, 2.4]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <SaltLoad />
                </Draggable>
            )}

            {/* LAST 2: gullet (dras nordover) */}
            {saltDelivered && !goldDelivered && (
                <Draggable
                    position={[0, 0.45, SOUTH_Z]}
                    bounds={{ minX: -12, maxX: 12, minZ: NORTH_Z - 1, maxZ: SOUTH_Z + 1 }}
                    snapPoints={[[0, NORTH_Z]]}
                    snapRadius={SNAP_RADIUS}
                    liftY={0.5}
                    dropFx="dustPuff"
                    onDragStart={onPick}
                    onSnap={onGoldDrop}
                >
                    <mesh>
                        <boxGeometry args={[2.4, 2.4, 2.4]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    <GoldLoad />
                </Draggable>
            )}

            {/* Feiringspartikler ved levering */}
            <Burst position={burstPos} trigger={burst} color="#ffd34d" count={26} spread={3.0} />

            {/* Lett orkenstøv i lufta */}
            <Particles preset="dust" />
        </group>
    );
}

// Saltgruven i nord: stablede hvite saltblokker + skilt.
function SaltMine() {
    return (
        <group position={[0, 0, NORTH_Z]}>
            {[-1.4, 0, 1.4].map((dx, i) => (
                <mesh key={i} position={[dx, 0.35 + (i % 2) * 0.2, -1.6]} castShadow>
                    <boxGeometry args={[1.0, 0.7 + (i % 2) * 0.4, 1.0]} />
                    <meshStandardMaterial color="#f4f1e8" roughness={0.85} />
                </mesh>
            ))}
            <mesh position={[0, 1.6, -1.6]}>
                <boxGeometry args={[0.06, 1.4, 0.06]} />
                <meshStandardMaterial color="#7a5a3a" />
            </mesh>
        </group>
    );
}

// Gullfeltene i sør: gyllen flekk som gløder sterkere etter levering + gullknuter.
function GoldField({ glow }: { glow: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (mat.current) {
            mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, glow ? 0.7 : 0.3, dt, 2);
        }
    });
    return (
        <group position={[0, 0, SOUTH_Z]}>
            <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[3.4, 28]} />
                <meshStandardMaterial ref={mat} color="#e6b73c" emissive="#c98a14" emissiveIntensity={0.3} roughness={0.5} metalness={0.4} />
            </mesh>
            {[[-1.2, 0.6], [1.0, -0.8], [0.2, 1.2]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.18, z]} castShadow>
                    <dodecahedronGeometry args={[0.32, 0]} />
                    <meshStandardMaterial color="#f3c64b" emissive="#a86f12" emissiveIntensity={0.4} roughness={0.35} metalness={0.6} />
                </mesh>
            ))}
        </group>
    );
}

// Timbuktu i midten: leirmoske med utstikkende trebjelker + Malis skattkammer
// (gull-kuppel som vokser med antall leveringer).
function Timbuktu({ deliveries }: { deliveries: number }) {
    const treasury = useRef<THREE.Group>(null);
    useFrame((_, dt) => {
        if (treasury.current) {
            const target = 0.25 + deliveries * 0.55;
            const s = damp(treasury.current.scale.x, target, dt, 3);
            treasury.current.scale.setScalar(s);
        }
    });
    return (
        <group position={[0, 0, 0]}>
            {/* Moskeen (Djinguereber-stil: leirbygg med trebjelker) */}
            <group position={[-2.6, 0, -0.6]}>
                <mesh position={[0, 1.0, 0]} castShadow>
                    <boxGeometry args={[2.2, 2.0, 2.2]} />
                    <meshStandardMaterial color="#c98f54" roughness={1} />
                </mesh>
                {/* Tårn */}
                <mesh position={[0, 2.6, 0]} castShadow>
                    <coneGeometry args={[0.7, 1.4, 4]} />
                    <meshStandardMaterial color="#bb7f46" roughness={1} />
                </mesh>
                {/* Utstikkende trebjelker */}
                {[0.4, 1.0, 1.6].map((y, i) => (
                    <mesh key={i} position={[1.15, y, 0.5]} castShadow>
                        <boxGeometry args={[0.5, 0.08, 0.08]} />
                        <meshStandardMaterial color="#5a4124" />
                    </mesh>
                ))}
            </group>

            {/* Malis skattkammer: gull-kuppel + mynter, vokser med handelen */}
            <group ref={treasury} position={[2.4, 0.1, -1.4]} scale={0.25}>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <sphereGeometry args={[0.7, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color="#f3c64b" emissive="#a86f12" emissiveIntensity={0.45} roughness={0.3} metalness={0.7} />
                </mesh>
                <mesh position={[0, 0.05, 0]} castShadow>
                    <cylinderGeometry args={[0.8, 0.8, 0.18, 16]} />
                    <meshStandardMaterial color="#d9a635" roughness={0.4} metalness={0.6} />
                </mesh>
            </group>
        </group>
    );
}

// Saltlasten: en hvit blokk med tau, båret av en liten kamel-silhuett.
function SaltLoad() {
    return (
        <group>
            <mesh position={[0, 0.5, 0]} castShadow>
                <boxGeometry args={[1.1, 0.9, 1.1]} />
                <meshStandardMaterial color="#f6f3ec" roughness={0.85} />
            </mesh>
            {/* Tau over lasten */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[1.16, 0.1, 0.16]} />
                <meshStandardMaterial color="#8a6a3a" />
            </mesh>
        </group>
    );
}

// Gull-lasten: en haug gyldne klumper.
function GoldLoad() {
    return (
        <group>
            <mesh position={[0, 0.35, 0]} castShadow>
                <cylinderGeometry args={[0.7, 0.8, 0.4, 14]} />
                <meshStandardMaterial color="#d9a635" roughness={0.4} metalness={0.6} />
            </mesh>
            {[[-0.25, 0.55, 0.1], [0.3, 0.6, -0.15], [0, 0.75, 0.2]].map(([x, y, z], i) => (
                <mesh key={i} position={[x, y, z]} castShadow>
                    <dodecahedronGeometry args={[0.28, 0]} />
                    <meshStandardMaterial color="#f3c64b" emissive="#a86f12" emissiveIntensity={0.5} roughness={0.3} metalness={0.7} />
                </mesh>
            ))}
        </group>
    );
}

export default KaravanenOverSahara3D;
