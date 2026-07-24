import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    Hotspot,
    SceneBanner,
    SceneBadge,
    DragHint,
    SceneFact,
    WinScreen,
    SceneSlider,
    StepTracker,
    damp,
    Burst,
    useIdleMotion,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill til artikkelen om Den åttedelte vei. Lyspæren eleven skal kjenne på
// kroppen: hjulet (dharmachakra) trenger ALLE åtte eikene OG en middelvei i
// balanse for å rulle. Veien er ikke åtte løsrevne trinn man tar etter
// hverandre - den er ett hjul som bare ruller når alt øves samtidig og i balanse.
//
// Iscenesettelse: et lysende dharmahjul som svever i et lyst kosmos (ikke et
// diorama på en åker - jf. TidensFormer3D). Eleven tenner hver eike ved å klikke,
// og justerer så middelveien med en spak til hjulet slutter å vakle og ruller.

type Training = 'visdom' | 'etikk' | 'fordypning';
type Phase = 'lighting' | 'balancing' | 'rolling' | 'won';

interface Spoke {
    id: number;
    name: string;
    training: Training;
}

// De åtte eikene, gruppert i de tre treningene (samme inndeling som artikkelen).
const SPOKES: Spoke[] = [
    { id: 0, name: 'Rett forståelse', training: 'visdom' },
    { id: 1, name: 'Rett tanke', training: 'visdom' },
    { id: 2, name: 'Rett tale', training: 'etikk' },
    { id: 3, name: 'Rett handling', training: 'etikk' },
    { id: 4, name: 'Rett levevei', training: 'etikk' },
    { id: 5, name: 'Rett innsats', training: 'fordypning' },
    { id: 6, name: 'Rett oppmerksomhet', training: 'fordypning' },
    { id: 7, name: 'Rett konsentrasjon', training: 'fordypning' },
];

const TRAINING_COLOR: Record<Training, string> = {
    visdom: '#f59e0b',
    etikk: '#3b82f6',
    fordypning: '#a855f7',
};

const WHEEL_R = 2.5; // ytre radius på hjulet
const HUB_R = 0.5;
const BALANCE_CENTER = 0.5;
const BALANCE_TOL = 0.06; // hvor nær midten man må være

const AttedeltVei3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [lit, setLit] = useState<Set<number>>(new Set());
    const [phase, setPhase] = useState<Phase>('lighting');
    const [balance, setBalance] = useState(0.16); // starter ute av balanse
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const rolledRef = useRef(false);

    const reset = () => {
        setLit(new Set());
        setPhase('lighting');
        setBalance(0.16);
        setBanner(null);
        rolledRef.current = false;
    };

    const lightSpoke = (id: number) => {
        if (lit.has(id)) return;
        const next = new Set([...lit, id]);
        setLit(next);
        const spoke = SPOKES[id];
        setBanner(`${spoke.name} lyser opp.`);
        if (next.size >= 8) {
            sounds.play('advance');
            setPhase('balancing');
            setBanner('Alle åtte eikene lyser - men hjulet vakler. Finn middelveien.');
        } else {
            sounds.play('correct');
        }
    };

    const changeBalance = (v: number) => {
        setBalance(v);
        if (phase === 'balancing' && Math.abs(v - BALANCE_CENTER) < BALANCE_TOL) {
            setPhase('rolling');
            setBanner('I balanse! Hjulet ruller.');
            sounds.play('sceneChange');
        }
    };

    // Hjulet har rullet ferdig (rapportert fra scenen).
    const onRolled = () => {
        if (rolledRef.current) return;
        rolledRef.current = true;
        setBurst((b) => b + 1);
        setPhase('won');
        setBanner(null);
        sounds.play('complete');
        setTimeout(() => onComplete({ score: 1, completed: true }), 250);
    };

    const balanceLabel =
        balance < 0.34
            ? 'For mye nytelse'
            : balance > 0.66
              ? 'For mye selvpining'
              : Math.abs(balance - BALANCE_CENTER) < BALANCE_TOL
                ? 'Middelveien'
                : 'Nesten i balanse';

    const idle = phase === 'lighting' && lit.size === 0;

    return (
        <MicroGameScaffold
            title="Sett dharmahjulet i gang"
            subtitle="Tenn de åtte eikene, finn middelveien, og se hjulet rulle"
            estimatedSeconds={140}
            onRetry={lit.size > 0 || phase !== 'lighting' ? reset : undefined}
            containerClassName="bg-gradient-to-b from-[#aebfe6] via-[#cdd8f0] to-[#f0e7d0]"
            canvas={{
                idle,
                autoRotateSpeed: 0.25,
                // NB: uten controls ser kameraet mot origo - hjulet må derfor
                // ligge sentrert rundt y=0 for å fylle utsnittet.
                camera: { position: [0, 1.6, 12], fov: 40 },
                background: '#c2d0ee',
                fog: { color: '#d4ddf0', near: 24, far: 80 },
                target: [0, 0, 0],
                contactShadows: false,
                controls: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'lighting'
                            ? `${lit.size} / 8 eiker`
                            : phase === 'won'
                              ? 'Hjulet ruller'
                              : 'Middelveien'}
                    </SceneBadge>
                    <DragHint show={idle}>Klikk en eike for å tenne den</DragHint>
                </>
            }
            scene={
                <WheelScene
                    lit={lit}
                    phase={phase}
                    balance={balance}
                    burst={burst}
                    onLight={lightSpoke}
                    onRolled={onRolled}
                />
            }
        >
            {phase === 'lighting' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker current={lit.size} total={8} />
                    <p className="text-sm text-slate-600">
                        Klikk de glødende punktene på hjulet for å tenne hver av de åtte eikene.
                        Fargene viser de tre treningene: gul er visdom, blå er etikk, lilla er
                        fordypning.
                    </p>
                </div>
            )}

            {(phase === 'balancing' || phase === 'rolling') && (
                <div className="flex flex-col gap-3">
                    <SceneSlider
                        label="Middelveien: nytelse ↔ selvpining"
                        min={0}
                        max={1}
                        step={0.01}
                        value={balance}
                        onChange={changeBalance}
                        valueLabel={() => balanceLabel}
                    />
                    <SceneFact>
                        Buddha prøvde begge ytterpunktene: et liv i luksus og et liv med hard
                        askese. Ingen av dem virket. Først da han fant middelveien - verken for
                        mye eller for lite - begynte hjulet å rulle.
                    </SceneFact>
                </div>
            )}

            {phase === 'won' && (
                <WinScreen title="Hjulet ruller!" onReplay={reset}>
                    Hjulet trengte alle åtte eikene for ikke å knekke, og en middelvei i balanse
                    for å rulle. Slik er Den åttedelte veien: ikke åtte trinn du tar etter
                    hverandre, men én vei der visdom, etikk og fordypning øves samtidig - og holdes
                    i balanse mellom ytterpunktene.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN - et lysende dharmahjul i et lyst kosmos
// ============================================================

interface SceneProps {
    lit: Set<number>;
    phase: Phase;
    balance: number;
    burst: number;
    onLight: (id: number) => void;
    onRolled: () => void;
}

function WheelScene({ lit, phase, balance, burst, onLight, onRolled }: SceneProps) {
    const wheel = useRef<THREE.Group>(null);
    const spin = useRef(0); // hjulets egen rotasjon (rulling)
    const roll = useRef(0); // hvor langt det har rullet
    const float = useIdleMotion({ bob: 0.1, sway: 0.02, speed: 0.7 });

    useFrame((state, dt) => {
        if (!wheel.current) return;
        const t = state.clock.getElapsedTime();

        // Hvor mye hjulet vakler: stort utslag når balansen er langt fra midten,
        // null når den treffer middelveien.
        const off = Math.min(1, Math.abs(balance - BALANCE_CENTER) * 2.4);
        const wobbleTarget = phase === 'balancing' ? off : 0;
        // Vugging fram og tilbake (rotasjon om z) + lett tilt.
        const wob = wobbleTarget * Math.sin(t * 6) * 0.28;

        if (phase === 'rolling' || phase === 'won') {
            // Hjulet ruller: jevn spinn + forflytning langs bakken.
            spin.current += dt * 1.7;
            roll.current += dt;
            wheel.current.position.x = damp(wheel.current.position.x, -1.6, dt, 0.7);
            // Ruller mot venstre (-x) => positiv z-rotasjon, ellers spinner
            // hjulet «baklengs» i forhold til bevegelsen.
            wheel.current.rotation.z = spin.current;
            if (roll.current > 1.3) onRolled();
        } else {
            wheel.current.rotation.z = damp(wheel.current.rotation.z, wob, dt, 8);
            wheel.current.position.x = damp(wheel.current.position.x, 0, dt, 2);
        }
    });

    return (
        <group>
            <SkyDome />
            <StarMotes />

            {/* Svevende hjul - sentrert rundt origo (dit kameraet faktisk ser) */}
            <group ref={float} position={[0, 0, 0]}>
                <group ref={wheel}>
                    <DharmaWheel lit={lit} />
                    <Burst position={[0, 0, 0.4]} trigger={burst} color="#fff0c4" count={40} spread={3.6} />
                </group>
            </group>

            {/* Klikkbare punkter på hver eike (kun mens vi tenner) */}
            {phase === 'lighting' &&
                SPOKES.map((s) => {
                    if (lit.has(s.id)) return null;
                    const a = (s.id / 8) * Math.PI * 2 + Math.PI / 2;
                    const r = WHEEL_R * 0.66;
                    return (
                        <Hotspot
                            key={s.id}
                            position={[Math.cos(a) * r, Math.sin(a) * r, 0.3]}
                            onSelect={() => onLight(s.id)}
                            label={s.name}
                            radius={0.34}
                            color={TRAINING_COLOR[s.training]}
                        />
                    );
                })}
        </group>
    );
}

// Selve dharmahjulet: nav, ytre ring og åtte eiker som lyser når de tennes.
function DharmaWheel({ lit }: { lit: Set<number> }) {
    return (
        <group>
            {/* Ytre ring */}
            <mesh>
                <torusGeometry args={[WHEEL_R, 0.16, 18, 64]} />
                <meshStandardMaterial color="#e8d49a" roughness={0.5} metalness={0.1} />
            </mesh>
            {/* Indre ring (nav-ring) */}
            <mesh>
                <torusGeometry args={[HUB_R + 0.12, 0.07, 14, 40]} />
                <meshStandardMaterial color="#e8d49a" roughness={0.5} />
            </mesh>
            {/* Nav - sirkelflaten vendt mot kameraet (langs Z) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[HUB_R, HUB_R, 0.22, 28]} />
                <meshStandardMaterial color="#cdae6a" roughness={0.45} />
            </mesh>

            {SPOKES.map((s) => (
                <SpokeMesh key={s.id} spoke={s} on={lit.has(s.id)} />
            ))}
        </group>
    );
}

// Én eike. Dempes mykt mot lys/farge når den tennes.
function SpokeMesh({ spoke, on }: { spoke: Spoke; on: boolean }) {
    const mat = useRef<THREE.MeshStandardMaterial>(null);
    const cap = useRef<THREE.MeshStandardMaterial>(null);
    const litColor = useMemo(() => new THREE.Color(TRAINING_COLOR[spoke.training]), [spoke.training]);
    const dim = useMemo(() => new THREE.Color('#9aa3b2'), []);

    useFrame((_, dt) => {
        const target = on ? litColor : dim;
        if (mat.current) {
            mat.current.color.lerp(target, Math.min(1, dt * 6));
            mat.current.emissive.lerp(on ? litColor : new THREE.Color('#000000'), Math.min(1, dt * 6));
            mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, on ? 0.9 : 0, dt, 4);
        }
        if (cap.current) {
            cap.current.color.lerp(target, Math.min(1, dt * 6));
            cap.current.emissive.lerp(on ? litColor : new THREE.Color('#000000'), Math.min(1, dt * 6));
            cap.current.emissiveIntensity = damp(cap.current.emissiveIntensity, on ? 1.4 : 0.1, dt, 4);
        }
    });

    const a = (spoke.id / 8) * Math.PI * 2 + Math.PI / 2;
    const len = WHEEL_R - HUB_R - 0.1;
    const mid = HUB_R + len / 2;
    return (
        <group rotation={[0, 0, a - Math.PI / 2]}>
            {/* selve eika (peker langs +Y i lokal ramme) */}
            <mesh position={[0, mid, 0]}>
                <boxGeometry args={[0.12, len, 0.12]} />
                <meshStandardMaterial ref={mat} color="#9aa3b2" roughness={0.6} />
            </mesh>
            {/* lysende knott ytterst (klikkmålet ble truffet her) */}
            <mesh position={[0, HUB_R + len * 0.66, 0.06]}>
                <sphereGeometry args={[0.16, 16, 16]} />
                <meshStandardMaterial
                    ref={cap}
                    color="#9aa3b2"
                    emissive="#000000"
                    emissiveIntensity={0.1}
                    toneMapped={false}
                />
            </mesh>
        </group>
    );
}

// Lysende himmelkuppel (kjølig blå topp -> varm horisont). Holder kosmos lyst.
function SkyDome() {
    const texture = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 16;
        c.height = 256;
        const ctx = c.getContext('2d');
        if (ctx) {
            const g = ctx.createLinearGradient(0, 0, 0, 256);
            g.addColorStop(0, '#9fb1e0');
            g.addColorStop(0.5, '#c2d0ee');
            g.addColorStop(0.8, '#e6e2d8');
            g.addColorStop(1, '#f3ead0');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 16, 256);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }, []);
    return (
        <mesh scale={[-1, 1, 1]}>
            <sphereGeometry args={[60, 24, 24]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} />
        </mesh>
    );
}

// Deterministisk pseudo-random på modulnivå (ingen mutasjon under render).
function makeRng(seed: number) {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
    };
}

// Svake lyspartikler i lufta - atmosfære uten å bli mørkt.
function StarMotes() {
    const data = useMemo(() => {
        const rand = makeRng(821);
        return Array.from({ length: 44 }, () => {
            const r = 8 + rand() * 24;
            const theta = rand() * Math.PI * 2;
            const phi = (rand() - 0.5) * Math.PI;
            return [
                Math.cos(theta) * Math.cos(phi) * r,
                2 + rand() * 11,
                Math.sin(theta) * Math.cos(phi) * r - 8,
            ] as [number, number, number];
        });
    }, []);
    const grp = useRef<THREE.Group>(null);
    useFrame(({ clock }) => {
        if (grp.current) grp.current.position.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.3;
    });
    return (
        <group ref={grp}>
            {data.map((p, i) => (
                <mesh key={i} position={p}>
                    <sphereGeometry args={[0.05, 6, 6]} />
                    <meshBasicMaterial color="#fff6da" transparent opacity={0.7} fog={false} />
                </mesh>
            ))}
        </group>
    );
}

export default AttedeltVei3D;
