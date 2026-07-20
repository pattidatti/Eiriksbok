import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Rotatable,
    Interactive,
    SceneBanner,
    SceneBadge,
    WinScreen,
    DataReadout,
    Burst,
    damp,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: Radarvakten. England, 1940. Tyske bombefly nærmer seg kysten,
// skjult i skodde og halvmørke. Eleven dreier radarantennen og sveiper en
// stråle ut over havet. Når strålen treffer et fly, lyser det svakt opp og blir
// klikkbart. Eleven klikker for å sende en puls: en ring av radiobølger farer ut,
// studser mot flyet og kommer tilbake som et ekko. Avstanden leses av med en gang.
// Finn alle fire bombeflyene før de når kysten.
//
// Lyspære: radar lar deg "se" i mørke og tåke ved å sende usynlige radiobølger
// som studser tilbake. Ekkoet forteller hvor langt unna flyet er, og derfor kunne
// britene møte de tyske bombeflyene i tide.

interface BomberDef {
    id: string;
    bearing: number; // retning ut fra stasjonen (radianer, 0 = rett ut mot havet)
    startDist: number; // startavstand i scene-enheter
    speed: number; // hvor fort det driver mot kysten
}

const BOMBERS: BomberDef[] = [
    { id: 'b1', bearing: -0.72, startDist: 15.5, speed: 0.18 },
    { id: 'b2', bearing: -0.24, startDist: 12.5, speed: 0.26 },
    { id: 'b3', bearing: 0.26, startDist: 16.5, speed: 0.15 },
    { id: 'b4', bearing: 0.66, startDist: 13.5, speed: 0.22 },
];

const BEAM_HALF = 0.2; // halv bredde på strålen (radianer, ~11 grader)
const KM_PER_UNIT = 8; // omregning fra scene-enhet til "km" på skjermen
const FLY_HEIGHT = 2.6;

// Korteste vinkelavstand mellom to retninger.
function angleDist(a: number, b: number): number {
    let d = (a - b) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
}

const Radarvakten3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [beamAngle, setBeamAngle] = useState(0);
    const [found, setFound] = useState<string[]>([]);
    const [won, setWon] = useState(false);
    const [banner, setBanner] = useState<string | null>(
        'Dra radarskåla for å sveipe strålen ut over havet. Klikk et fly som lyser opp.'
    );
    const [lastKm, setLastKm] = useState<number | null>(null);
    const [pulse, setPulse] = useState<{ trigger: number; bearing: number; dist: number }>({
        trigger: 0,
        bearing: 0,
        dist: 0,
    });
    const [burst, setBurst] = useState(0);

    const reset = () => {
        setFound([]);
        setWon(false);
        setLastKm(null);
        setPulse({ trigger: 0, bearing: 0, dist: 0 });
        setBanner('Dra radarskåla for å sveipe strålen ut over havet. Klikk et fly som lyser opp.');
    };

    const handleBeam = (a: number) => {
        // Bare oppdater når strålen faktisk har flyttet seg litt (mindre churn).
        setBeamAngle((prev) => (Math.abs(prev - a) > 0.01 ? a : prev));
    };

    const ping = (b: BomberDef, dist: number) => {
        if (won || found.includes(b.id)) return;
        const km = Math.round(dist * KM_PER_UNIT);
        setLastKm(km);
        setPulse((p) => ({ trigger: p.trigger + 1, bearing: b.bearing, dist }));
        setBurst((n) => n + 1);
        sounds.play('correct');
        const next = [...found, b.id];
        setFound(next);
        if (next.length >= BOMBERS.length) {
            setBanner(null);
            sounds.play('complete');
            setWon(true);
            onComplete({ score: 1, completed: true, artifact: { found: next } });
        } else {
            setBanner(
                `Ekko mottatt. Bombefly på ${km} km. ${BOMBERS.length - next.length} fly er ennå skjult.`
            );
        }
    };

    const count = found.length;

    return (
        <MicroGameScaffold
            title="Radarvakten: se det usynlige"
            subtitle="Tyske bombefly nærmer seg kysten, skjult i skodde. Sveip radaren, fang ekkoet og finn dem alle."
            estimatedSeconds={150}
            onRetry={count > 0 || won ? reset : undefined}
            canvas={{
                idle: !won && count === 0,
                camera: { position: [0, 7.5, 13], fov: 44 },
                background: '#84a2c4',
                target: [0, 1.6, -3],
                light: 'twilight',
                fog: { color: '#9fb6d2', near: 18, far: 46 },
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {won ? 'Kysten er trygg' : 'Slaget om Storbritannia, 1940'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Fly funnet', value: `${count}/${BOMBERS.length}` },
                            {
                                label: 'Siste ekko',
                                value: lastKm === null ? '-' : lastKm,
                                unit: lastKm === null ? undefined : 'km',
                            },
                        ]}
                    />
                </>
            }
            scene={
                <RadarScene
                    beamAngle={beamAngle}
                    found={found}
                    pulse={pulse}
                    burst={burst}
                    onBeam={handleBeam}
                    onPing={ping}
                />
            }
        >
            {/* Forklaring under vinduet */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-xs font-bold text-slate-700">1. Sveip</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Dra radarskåla rundt. Den sender ut en usynlig radiostråle.
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-xs font-bold text-slate-700">2. Treff</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Når strålen treffer et fly, lyser det svakt opp. Klikk på det.
                    </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                    <p className="text-xs font-bold text-slate-700">3. Ekko</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        Pulsen studser tilbake. Tiden den bruker forteller avstanden.
                    </p>
                </div>
            </div>

            {won && (
                <div className="mt-3">
                    <WinScreen title="Alle flyene er sporet!" onReplay={reset}>
                        Du sendte ut radiobølger og fanget ekkoet som kom tilbake. Tiden bølgen brukte
                        ut og hjem forteller nøyaktig hvor langt unna flyet er. Slik kunne britene
                        "se" de tyske bombeflyene lenge før de nådde kysten, og sende opp jagerfly i
                        tide. Radar gjorde det usynlige synlig, og det var en av grunnene til at
                        Storbritannia vant luftslaget i 1940.
                    </WinScreen>
                </div>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function RadarScene({
    beamAngle,
    found,
    pulse,
    burst,
    onBeam,
    onPing,
}: {
    beamAngle: number;
    found: string[];
    pulse: { trigger: number; bearing: number; dist: number };
    burst: number;
    onBeam: (a: number) => void;
    onPing: (b: BomberDef, dist: number) => void;
}) {
    return (
        <group>
            <Sea />
            <Coast />
            <RadarStation onBeam={onBeam} />
            <EchoRing pulse={pulse} />
            {/* flyene pivoterer rundt stasjonen (z=4), samme dreiepunkt som strålen */}
            <group position={[0, 0, 4]}>
                {BOMBERS.map((b) => (
                    <Bomber
                        key={b.id}
                        def={b}
                        beamAngle={beamAngle}
                        detected={found.includes(b.id)}
                        onPing={onPing}
                    />
                ))}
            </group>
            <Burst position={[0, 2.4, -1]} trigger={burst} color="#fca5a5" count={26} spread={3.5} />
        </group>
    );
}

// Havet brer seg ut mot horisonten der flyene kommer fra.
function Sea() {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((state) => {
        if (mat.current) {
            // svak puls i havet, holder scenen levende
            mat.current.opacity = 0.96 + Math.sin(state.clock.elapsedTime * 0.6) * 0.02;
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -8]} receiveShadow>
            <planeGeometry args={[60, 50]} />
            <meshStandardMaterial
                ref={mat}
                color="#3f6488"
                roughness={0.85}
                metalness={0.1}
                transparent
            />
        </mesh>
    );
}

// Kyststripa med radarstasjonen står på, nærmest eleven.
function Coast() {
    return (
        <group position={[0, 0, 4.5]}>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[60, 12]} />
                <meshStandardMaterial color="#6f8a5a" roughness={1} />
            </mesh>
            {/* lav klippekant mot havet */}
            <mesh position={[0, -0.3, -6]} castShadow receiveShadow>
                <boxGeometry args={[60, 0.8, 1.2]} />
                <meshStandardMaterial color="#8a7a63" roughness={1} flatShading />
            </mesh>
        </group>
    );
}

// Radartårnet med den dreibare skåla og den sveipende strålen.
function RadarStation({ onBeam }: { onBeam: (a: number) => void }) {
    return (
        <group position={[0, 0, 4]}>
            {/* gittermast */}
            <mesh position={[0, 1.3, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.32, 2.6, 8]} />
                <meshStandardMaterial color="#5b6470" roughness={0.7} flatShading />
            </mesh>
            <mesh position={[0, 0.05, 0]} receiveShadow>
                <cylinderGeometry args={[0.7, 0.9, 0.3, 12]} />
                <meshStandardMaterial color="#737d88" roughness={0.8} />
            </mesh>

            {/* dreibar skål + stråle: dra for å sveipe */}
            <group position={[0, 2.7, 0]}>
                <Rotatable axis="y" sensitivity={0.01} onChange={onBeam}>
                    {/* romslig usynlig gripeflate for trygg trackpad-treffing */}
                    <mesh>
                        <boxGeometry args={[2.4, 1.8, 2.4]} />
                        <meshBasicMaterial transparent opacity={0} />
                    </mesh>
                    {/* selve skåla */}
                    <mesh position={[0, 0.15, -0.5]} rotation={[Math.PI / 2.4, 0, 0]} castShadow>
                        <sphereGeometry
                            args={[0.7, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]}
                        />
                        <meshStandardMaterial
                            color="#cdd7e2"
                            side={THREE.DoubleSide}
                            roughness={0.5}
                            metalness={0.2}
                            flatShading
                        />
                    </mesh>
                    {/* føler-arm */}
                    <mesh position={[0, 0.15, -0.95]} castShadow>
                        <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
                        <meshStandardMaterial color="#9aa4b0" roughness={0.6} />
                    </mesh>
                    <BeamFan />
                </Rotatable>
            </group>
        </group>
    );
}

// Den glødende vifteformede strålen som sveiper langs havflaten.
function BeamFan() {
    const mat = useRef<THREE.MeshBasicMaterial>(null);
    useFrame((state) => {
        if (mat.current) {
            mat.current.opacity = 0.22 + Math.sin(state.clock.elapsedTime * 3) * 0.06;
        }
    });
    const R = 22;
    return (
        // strålen ligger flatt og peker rett ut (mot -z) ved vinkel 0
        <group position={[0, -2.55, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry
                    args={[R, 28, Math.PI / 2 - BEAM_HALF, BEAM_HALF * 2]}
                />
                <meshBasicMaterial
                    ref={mat}
                    color="#9bf6c4"
                    transparent
                    opacity={0.24}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* skarp ledekant for å se retningen tydelig */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[R - 0.25, R, 40, 1, Math.PI / 2 - BEAM_HALF, BEAM_HALF * 2]} />
                <meshBasicMaterial
                    color="#d7fff0"
                    transparent
                    opacity={0.5}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

// Et bombefly. Skjult og halvgjennomsiktig (et "spøkelse") til radaren finner det.
// Når strålen treffer: lyser opp og blir klikkbart. Når det er sporet: blir et
// fast, rødt mål som slutter å nærme seg.
function Bomber({
    def,
    beamAngle,
    detected,
    onPing,
}: {
    def: BomberDef;
    beamAngle: number;
    detected: boolean;
    onPing: (b: BomberDef, dist: number) => void;
}) {
    const inner = useRef<THREE.Group>(null);
    const distRef = useRef(def.startDist);
    const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
    const wingMat = useRef<THREE.MeshStandardMaterial>(null);
    const blip = useRef<THREE.Mesh>(null);

    // Lyser strålen på flyet akkurat nå?
    const lit = !detected && angleDist(beamAngle, def.bearing) < BEAM_HALF + 0.04;

    useFrame((state, dt) => {
        // driv mot kysten til det er sporet, så stopper det
        if (!detected && distRef.current > 5.5) {
            distRef.current -= def.speed * dt;
        }
        if (inner.current) {
            inner.current.position.z = -distRef.current;
            inner.current.position.y =
                FLY_HEIGHT + Math.sin(state.clock.elapsedTime * 1.1 + def.bearing * 5) * 0.12;
        }

        const ghost = new THREE.Color('#cfd9e6');
        const litCol = new THREE.Color('#fde68a');
        const foundCol = new THREE.Color('#ef4444');
        const target = detected ? foundCol : lit ? litCol : ghost;

        if (bodyMat.current) {
            bodyMat.current.color.lerp(target, 1 - Math.exp(-7 * dt));
            bodyMat.current.opacity = damp(
                bodyMat.current.opacity,
                detected ? 1 : lit ? 0.85 : 0.32,
                dt,
                6
            );
            bodyMat.current.emissive.lerp(
                detected ? foundCol : lit ? litCol : new THREE.Color('#000000'),
                1 - Math.exp(-7 * dt)
            );
            bodyMat.current.emissiveIntensity = damp(
                bodyMat.current.emissiveIntensity,
                detected ? 0.5 : lit ? 0.7 : 0,
                dt,
                6
            );
        }
        if (wingMat.current) {
            wingMat.current.color.lerp(target, 1 - Math.exp(-7 * dt));
            wingMat.current.opacity = damp(
                wingMat.current.opacity,
                detected ? 1 : lit ? 0.85 : 0.3,
                dt,
                6
            );
        }
        if (blip.current) {
            const bm = blip.current.material as THREE.MeshBasicMaterial;
            bm.opacity = damp(bm.opacity, detected ? 0.55 : 0, dt, 5);
            const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
            blip.current.scale.setScalar(detected ? pulseScale : 1);
        }
    });

    return (
        <group rotation={[0, def.bearing, 0]}>
            <group ref={inner} position={[0, FLY_HEIGHT, -def.startDist]}>
                <Interactive
                    onSelect={() => onPing(def, distRef.current)}
                    disabled={detected || !lit}
                    state={detected ? 'correct' : lit ? 'idle' : 'disabled'}
                    hitArea={[2.4, 1.6, 2.4]}
                    sound={null}
                >
                    {(s) => (
                        <group scale={1}>
                            {/* skrog */}
                            <mesh castShadow>
                                <boxGeometry args={[0.5, 0.4, 2.1]} />
                                <meshStandardMaterial
                                    ref={bodyMat}
                                    color="#cfd9e6"
                                    transparent
                                    opacity={0.32}
                                    emissive="#000000"
                                    emissiveIntensity={0}
                                    roughness={0.5}
                                    flatShading
                                />
                            </mesh>
                            {/* vinger */}
                            <mesh position={[0, 0, 0.1]} castShadow>
                                <boxGeometry args={[3.0, 0.12, 0.6]} />
                                <meshStandardMaterial
                                    ref={wingMat}
                                    color="#cfd9e6"
                                    transparent
                                    opacity={0.3}
                                    roughness={0.6}
                                    flatShading
                                />
                            </mesh>
                            {/* halefinne */}
                            <mesh position={[0, 0.25, 0.95]}>
                                <boxGeometry args={[0.1, 0.5, 0.4]} />
                                <meshStandardMaterial
                                    color="#cfd9e6"
                                    transparent
                                    opacity={detected ? 1 : 0.3}
                                    roughness={0.6}
                                    flatShading
                                />
                            </mesh>
                            {/* hint-ring når strålen lyser på flyet */}
                            {lit && (
                                <mesh
                                    position={[0, 0, 0]}
                                    rotation={[-Math.PI / 2, 0, 0]}
                                    scale={s === 'hover' ? 1.15 : 1}
                                >
                                    <ringGeometry args={[1.4, 1.7, 28]} />
                                    <meshBasicMaterial
                                        color="#fde68a"
                                        transparent
                                        opacity={0.7}
                                        depthWrite={false}
                                        blending={THREE.AdditiveBlending}
                                        side={THREE.DoubleSide}
                                    />
                                </mesh>
                            )}
                            {/* fast rød kontakt-markør når sporet */}
                            <mesh ref={blip} position={[0, 1.0, 0]}>
                                <sphereGeometry args={[0.32, 16, 16]} />
                                <meshBasicMaterial
                                    color="#ef4444"
                                    transparent
                                    opacity={0}
                                    depthWrite={false}
                                    blending={THREE.AdditiveBlending}
                                />
                            </mesh>
                        </group>
                    )}
                </Interactive>
            </group>
        </group>
    );
}

// Ekkoringen: når eleven sender en puls, vokser en ring av radiobølger ut fra
// stasjonen, treffer flyet og kommer tilbake. Selve "se ekkoet"-øyeblikket.
function EchoRing({ pulse }: { pulse: { trigger: number; bearing: number; dist: number } }) {
    const out = useRef<THREE.Mesh>(null);
    const back = useRef<THREE.Mesh>(null);
    const last = useRef(0);
    const t = useRef(0);
    const active = useRef(false);

    useFrame((_, dt) => {
        if (pulse.trigger !== last.current) {
            last.current = pulse.trigger;
            t.current = 0;
            active.current = true;
        }
        if (!active.current) return;
        t.current += dt;
        const dur = 1.4; // sekunder ut + hjem
        const p = Math.min(t.current / dur, 1);
        const reach = pulse.dist;

        // ut: 0 -> reach i første halvdel
        const outP = Math.min(p / 0.5, 1);
        if (out.current) {
            const r = outP * reach;
            out.current.scale.setScalar(Math.max(r, 0.001));
            const om = out.current.material as THREE.MeshBasicMaterial;
            om.opacity = (1 - outP) * 0.8;
        }
        // hjem: reach -> 0 i andre halvdel
        const backP = Math.max((p - 0.5) / 0.5, 0);
        if (back.current) {
            const r = (1 - backP) * reach;
            back.current.scale.setScalar(Math.max(r, 0.001));
            const bm = back.current.material as THREE.MeshBasicMaterial;
            bm.opacity = p > 0.5 ? backP * 0.9 : 0;
        }
        if (p >= 1) active.current = false;
    });

    // ringene ligger flatt ved stasjonen og pekes langs flyets retning
    return (
        <group position={[0, 0.12, 4]} rotation={[0, pulse.bearing, 0]}>
            <mesh ref={out} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.0, 40]} />
                <meshBasicMaterial
                    color="#bff5d6"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh ref={back} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.9, 1.0, 40]} />
                <meshBasicMaterial
                    color="#fca5a5"
                    transparent
                    opacity={0}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}

export default Radarvakten3D;
