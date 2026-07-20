import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CloudRain } from 'lucide-react';
import {
    MicroGameScaffold,
    Interactive,
    GroundPlane,
    SceneBanner,
    SceneBadge,
    SceneFact,
    WinScreen,
    StepTracker,
    DataReadout,
    THEMES,
    damp,
    ease,
    useShake,
    Burst,
} from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Mikrospill: bygg den romerske skilpadda (testudo). Eleven kjenner kjernen på
// kroppen: en legionær alene er sårbar for pilregn, men når hver mann setter
// skjoldet sitt på rett plass - de ytterste som vegger som vender utover, de
// indre som et flatt tak over hodet - blir tropppen en bevegelig festning av
// jern og tre. Disiplin og samarbeid, ikke den enkelte soldaten, er hemmeligheten.
//
// Mekanikk: klikk legionærene. Først reiser ytterringen veggene, så legger de
// fire i midten taket. Når skilpadda er lukket, slipper du pilregnet løs og ser
// pilene klatre av skallet. Fyrer du for tidlig, finner pilene hullene.

type Phase = 'walls' | 'roof' | 'test' | 'won';

const T = THEMES.roman;
const SPACING = 1.08;
const COLS = 4;
const ROWS = 4;

interface Sol {
    i: number;
    x: number;
    z: number;
    role: 'wall' | 'roof';
    dirX: number;
    dirZ: number;
    rotY: number;
}

// Bygg formasjonen som en ren konstant på modulnivå (ingen state-avhengighet).
const SOLDIERS: Sol[] = (() => {
    const out: Sol[] = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const i = r * COLS + c;
            const x = (c - (COLS - 1) / 2) * SPACING;
            const z = (r - (ROWS - 1) / 2) * SPACING;
            const isOuter = c === 0 || c === COLS - 1 || r === 0 || r === ROWS - 1;
            const fx = c === 0 ? -1 : c === COLS - 1 ? 1 : 0;
            const fz = r === 0 ? -1 : r === ROWS - 1 ? 1 : 0;
            const len = Math.hypot(fx, fz) || 1;
            out.push({
                i,
                x,
                z,
                role: isOuter ? 'wall' : 'roof',
                dirX: fx / len,
                dirZ: fz / len,
                rotY: Math.atan2(fx, fz),
            });
        }
    }
    return out;
})();

const WALL_IDS = SOLDIERS.filter((s) => s.role === 'wall').map((s) => s.i);
const ROOF_IDS = SOLDIERS.filter((s) => s.role === 'roof').map((s) => s.i);

// Liten ren RNG på modulnivå (ingen muterte let i useMemo).
function rng(seed: number) {
    const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
}

const Testudo3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [phase, setPhase] = useState<Phase>('walls');
    const [raised, setRaised] = useState<boolean[]>(() => Array(COLS * ROWS).fill(false));
    const [banner, setBanner] = useState<string | null>(
        'Klikk legionærene i ytterkanten. Hver reiser skjoldet til en vegg som vender utover.'
    );
    const [fact, setFact] = useState<string | null>(null);
    const [volley, setVolley] = useState(0);
    const [outcome, setOutcome] = useState<'idle' | 'through' | 'bounced'>('idle');
    const [burst, setBurst] = useState(0);

    const wallsUp = WALL_IDS.filter((i) => raised[i]).length;
    const roofUp = ROOF_IDS.filter((i) => raised[i]).length;
    const wallsDone = wallsUp === WALL_IDS.length;
    const roofDone = roofUp === ROOF_IDS.length;
    const totalUp = wallsUp + roofUp;

    const reset = () => {
        setPhase('walls');
        setRaised(Array(COLS * ROWS).fill(false));
        setBanner(
            'Klikk legionærene i ytterkanten. Hver reiser skjoldet til en vegg som vender utover.'
        );
        setFact(null);
        setVolley(0);
        setOutcome('idle');
    };

    const raise = (i: number) => {
        if (raised[i]) return;
        const next = raised.slice();
        next[i] = true;
        setRaised(next);

        const nextWalls = WALL_IDS.filter((k) => next[k]).length;
        const nextRoof = ROOF_IDS.filter((k) => next[k]).length;

        if (nextWalls === WALL_IDS.length && phase === 'walls') {
            sounds.play('advance');
            setPhase('roof');
            setBanner(
                'Veggene står. Klikk nå de fire i midten. De legger skjoldene flatt over hodet.'
            );
            setFact(
                'Bak frontmuren løfter mennene skjoldene vannrett over hodet, kant i kant som takstein. Da er hele troppen pakket inn - foran, på sidene og oppe.'
            );
        } else if (nextRoof === ROOF_IDS.length && phase === 'roof') {
            sounds.play('advance');
            setPhase('test');
            setBanner('Skilpadda er lukket! Slipp pilregnet løs og se skjoldene ta imot.');
            setFact(
                'Nå ser fienden bare en kompakt boks av skjold. Formasjonen het testudo - latin for skilpadde - fordi den krøp fram under sitt eget skall.'
            );
        } else {
            sounds.play('correct');
            if (phase === 'walls') {
                setFact(
                    'Et romersk skjold (scutum) er en stor, buet rektangel av tre og lær. Side om side blir de en sammenhengende mur.'
                );
            }
        }
    };

    const fire = () => {
        if (roofDone) {
            setOutcome('bounced');
            setVolley((v) => v + 1);
            setBanner(null);
            sounds.play('complete');
            setTimeout(() => {
                setBurst((b) => b + 1);
                setPhase('won');
                onComplete({ score: 1, completed: true, artifact: { raised: totalUp } });
            }, 1200);
        } else {
            setOutcome('through');
            setVolley((v) => v + 1);
            sounds.play('incorrect');
            setBanner('Pilene fant hull i taket! Legg de siste skjoldene over hodet før du fyrer.');
            setTimeout(() => setOutcome('idle'), 1700);
        }
    };

    return (
        <MicroGameScaffold
            title="Bygg skilpadda (testudo)"
            subtitle="Reis skjoldveggene, legg taket over hodet, og la pilregnet klatre av skallet"
            estimatedSeconds={150}
            onRetry={totalUp > 0 ? reset : undefined}
            canvas={{
                idle: false,
                camera: { position: [0, 6.2, 11.5], fov: 42 },
                background: T.sky,
                fog: { near: 24, far: 48 },
                target: [0, 1.2, 0],
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">
                        {phase === 'won' ? 'Skallet holdt' : 'Romersk legion, ca. 100 evt'}
                    </SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Vegger', value: `${wallsUp}/${WALL_IDS.length}` },
                            { label: 'Tak', value: `${roofUp}/${ROOF_IDS.length}` },
                        ]}
                    />
                </>
            }
            scene={
                <TestudoScene
                    raised={raised}
                    phase={phase}
                    volley={volley}
                    outcome={outcome}
                    burst={burst}
                    onRaise={raise}
                />
            }
        >
            {phase !== 'won' && (
                <div className="flex flex-col gap-2.5">
                    <StepTracker
                        current={wallsDone ? (roofDone ? 2 : 1) : 0}
                        total={2}
                    />
                    {phase === 'walls' && (
                        <p className="text-sm text-slate-600">
                            Klikk de markerte legionærene i ytterringen. Hver reiser skjoldet til en
                            vegg som vender utover.
                        </p>
                    )}
                    {phase !== 'walls' && (
                        <div className="rounded-xl border border-amber-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
                            <p className="text-xs text-slate-600 leading-relaxed min-w-0 flex-1">
                                {roofDone
                                    ? 'Skilpadda er tett, foran, på sidene og oppe. Slipp pilregnet løs.'
                                    : 'Veggene står, men taket er åpent. Klikk de fire i midten før du fyrer.'}
                            </p>
                            <button
                                onClick={fire}
                                className="mt-2.5 sm:mt-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 transition flex-shrink-0"
                            >
                                <CloudRain className="w-4 h-4" />
                                Slipp pilregnet løs
                            </button>
                        </div>
                    )}
                    {fact && <SceneFact>{fact}</SceneFact>}
                </div>
            )}

            {phase === 'won' && (
                <WinScreen title="Skilpadda holdt pilregnet ute!" onReplay={reset}>
                    Pilene klatret av skjoldskallet uten å nå en eneste mann. Det var hele
                    poenget med testudo: en legionær alene er sårbar, men når hver mann setter
                    skjoldet sitt på rett plass, blir troppen en bevegelig festning. Disiplinen og
                    samarbeidet, ikke den enkelte soldaten, gjorde den romerske legionen så
                    fryktet.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

// ============================================================
//  3D-SCENEN
// ============================================================

function TestudoScene({
    raised,
    phase,
    volley,
    outcome,
    burst,
    onRaise,
}: {
    raised: boolean[];
    phase: Phase;
    volley: number;
    outcome: 'idle' | 'through' | 'bounced';
    burst: number;
    onRaise: (i: number) => void;
}) {
    const { ref, shake } = useShake(0.18, 0.04, 2.2);
    const lastVolley = useRef(0);
    useFrame(() => {
        if (volley !== lastVolley.current) {
            lastVolley.current = volley;
            shake(outcome === 'through' ? 0.7 : 0.35);
        }
    });

    return (
        <group ref={ref}>
            <GroundPlane size={42} depth={34} color={T.ground} />

            {/* Bueskyttere bak en lav voll - de som sender pilregnet */}
            <Archers />

            {SOLDIERS.map((s) => {
                const isUp = raised[s.i];
                const clickable =
                    !isUp &&
                    ((phase === 'walls' && s.role === 'wall') ||
                        (phase === 'roof' && s.role === 'roof'));
                return (
                    <Interactive
                        key={s.i}
                        position={[s.x, 0, s.z]}
                        onSelect={() => onRaise(s.i)}
                        disabled={!clickable}
                        hitArea={[1, 2.4, 1]}
                        hoverScale={1.05}
                    >
                        {(state) => (
                            <Legionary sol={s} up={isUp} highlight={clickable && state === 'idle'} />
                        )}
                    </Interactive>
                );
            })}

            <ArrowRain volley={volley} outcome={outcome} />

            <Burst position={[0, 2.6, 0]} trigger={burst} color="#f1e0b0" count={28} spread={4} />
        </group>
    );
}

// En legionær: rød tunika, segmentert panser, hjelm og et stort rektangulært
// scutum. Skjoldet damper fra hvileposisjon mot vegg- eller takposisjon.
function Legionary({ sol, up, highlight }: { sol: Sol; up: boolean; highlight: boolean }) {
    const shield = useRef<THREE.Group>(null);
    const glow = useRef<THREE.Mesh>(null);
    const t = useRef(0);

    useFrame((_, dt) => {
        t.current = damp(t.current, up ? 1 : 0, dt, 6);
        const e = ease.outCubic(t.current);
        const g = shield.current;
        if (g) {
            if (sol.role === 'wall') {
                // Hvile: holdt lavt foran kroppen. Reist: vegg som vender utover.
                g.position.x = sol.dirX * 0.55 * e;
                g.position.y = 0.55 + e * 0.55;
                g.position.z = sol.dirZ * 0.55 * e + (1 - e) * 0.34;
                g.rotation.x = (1 - e) * 0.32;
                g.rotation.y = sol.rotY * e;
            } else {
                // Hvile: holdt lavt. Reist: flatt tak rett over hodet.
                g.position.x = 0;
                g.position.y = 0.55 + e * 1.45;
                g.position.z = (1 - e) * 0.34;
                g.rotation.x = (1 - e) * 0.32 + e * (Math.PI / 2);
                g.rotation.y = 0;
            }
        }
        if (glow.current) {
            const m = glow.current.material as THREE.MeshBasicMaterial;
            m.opacity = damp(m.opacity, highlight ? 0.5 : 0, dt, 8);
        }
    });

    return (
        <group>
            {/* markeringsring når mannen er klar til å klikkes */}
            <mesh ref={glow} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.42, 0.6, 28]} />
                <meshBasicMaterial color="#f59e0b" transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* bein */}
            <mesh position={[0, 0.28, 0]} castShadow>
                <cylinderGeometry args={[0.18, 0.22, 0.55, 8]} />
                <meshStandardMaterial color="#7a5535" roughness={0.9} />
            </mesh>
            {/* overkropp i rød tunika */}
            <mesh position={[0, 0.78, 0]} castShadow>
                <cylinderGeometry args={[0.22, 0.26, 0.55, 8]} />
                <meshStandardMaterial color={T.accent} roughness={0.85} />
            </mesh>
            {/* segmentert brystpanser */}
            <mesh position={[0, 0.84, 0]} castShadow>
                <cylinderGeometry args={[0.27, 0.27, 0.34, 10]} />
                <meshStandardMaterial color="#b9bcc2" metalness={0.55} roughness={0.4} />
            </mesh>
            {/* hode */}
            <mesh position={[0, 1.22, 0]} castShadow>
                <sphereGeometry args={[0.16, 12, 12]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
            {/* hjelm (galea) */}
            <mesh position={[0, 1.3, 0]} castShadow>
                <sphereGeometry args={[0.19, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
                <meshStandardMaterial color="#c79a3a" metalness={0.55} roughness={0.4} />
            </mesh>

            {/* scutum - stort rektangulært skjold */}
            <group ref={shield} position={[0, 0.55, 0.34]} rotation={[0.32, 0, 0]}>
                <mesh castShadow>
                    <boxGeometry args={[0.92, 1.32, 0.1]} />
                    <meshStandardMaterial color="#8a2420" roughness={0.7} />
                </mesh>
                {/* gyllen boss i midten */}
                <mesh position={[0, 0, 0.07]}>
                    <cylinderGeometry args={[0.12, 0.12, 0.06, 14]} />
                    <meshStandardMaterial color="#c79a3a" metalness={0.5} roughness={0.4} />
                </mesh>
                {/* gyllent vingemotiv */}
                <mesh position={[0, 0.34, 0.06]}>
                    <boxGeometry args={[0.62, 0.1, 0.04]} />
                    <meshStandardMaterial color="#d8b352" metalness={0.4} roughness={0.5} />
                </mesh>
                <mesh position={[0, -0.34, 0.06]}>
                    <boxGeometry args={[0.62, 0.1, 0.04]} />
                    <meshStandardMaterial color="#d8b352" metalness={0.4} roughness={0.5} />
                </mesh>
            </group>
        </group>
    );
}

// Bueskytter-linje bak en lav voll. Rent dekorativ kontekst for pilregnet.
function Archers() {
    return (
        <group position={[0, 0, -7.5]}>
            <mesh position={[0, 0.4, -0.4]} castShadow>
                <boxGeometry args={[9, 0.8, 0.7]} />
                <meshStandardMaterial color={T.stone} roughness={0.9} />
            </mesh>
            {[-3, -1.5, 0, 1.5, 3].map((x) => (
                <group key={x} position={[x, 0, 0]}>
                    <mesh position={[0, 0.7, 0]} castShadow>
                        <cylinderGeometry args={[0.16, 0.2, 0.7, 7]} />
                        <meshStandardMaterial color="#4a5063" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 1.15, 0]} castShadow>
                        <sphereGeometry args={[0.14, 10, 10]} />
                        <meshStandardMaterial color="#cda884" roughness={0.85} />
                    </mesh>
                    {/* bue */}
                    <mesh position={[0.16, 0.85, 0.2]} rotation={[0, 0, 0.2]}>
                        <torusGeometry args={[0.32, 0.03, 6, 12, Math.PI]} />
                        <meshStandardMaterial color="#5c3f26" roughness={0.8} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

const ARROW_COUNT = 18;
// Faste, men spredte nedslagspunkter over formasjonen (ren RNG på modulnivå).
const ARROW_SPOTS = Array.from({ length: ARROW_COUNT }, (_, i) => ({
    x: (rng(i + 1) * 2 - 1) * 2.4,
    z: (rng(i + 11) * 2 - 1) * 2.4,
    delay: rng(i + 21) * 0.35,
    spin: rng(i + 31) * 0.5 - 0.25,
}));

// Pilregnet. Pilene faller fra himmelen. Er taket lukket, stopper de på skallet
// (y ca 2.5) og tipper over. Er det åpent, fortsetter de helt ned blant mennene.
function ArrowRain({
    volley,
    outcome,
}: {
    volley: number;
    outcome: 'idle' | 'through' | 'bounced';
}) {
    const group = useRef<THREE.Group>(null);
    const fall = useRef(0);
    const lastVolley = useRef(0);

    useFrame((_, dt) => {
        const g = group.current;
        if (!g) return;
        if (volley !== lastVolley.current) {
            lastVolley.current = volley;
            fall.current = 0;
        }
        const active = volley > 0 && outcome !== 'idle';
        fall.current = damp(fall.current, active ? 1 : 0, dt, 1.9);
        const f = fall.current;

        g.children.forEach((child, idx) => {
            const spot = ARROW_SPOTS[idx];
            if (!spot) return;
            const local = Math.max(0, Math.min(1, (f - spot.delay) / (1 - spot.delay || 1)));
            const e = ease.outCubic(local);
            const endY = outcome === 'bounced' ? 2.45 : 0.3;
            const startY = 8.5;
            child.position.x = spot.x + (outcome === 'bounced' ? e * spot.spin : 0);
            child.position.y = startY + (endY - startY) * e;
            child.position.z = spot.z;
            // Stupende pil; tipper over når den treffer skallet.
            const tip = outcome === 'bounced' ? e * spot.spin * 2 : 0;
            child.rotation.set(Math.PI + tip, 0, spot.spin * (outcome === 'bounced' ? e : 0));
            child.visible = volley > 0 && local > 0.001;
        });
    });

    return (
        <group ref={group}>
            {ARROW_SPOTS.map((_, i) => (
                <group key={i} visible={false}>
                    {/* skaft */}
                    <mesh>
                        <cylinderGeometry args={[0.03, 0.03, 0.8, 5]} />
                        <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                    </mesh>
                    {/* spiss */}
                    <mesh position={[0, -0.46, 0]}>
                        <coneGeometry args={[0.06, 0.18, 6]} />
                        <meshStandardMaterial color="#9aa0a8" metalness={0.5} roughness={0.4} />
                    </mesh>
                    {/* fjær */}
                    <mesh position={[0, 0.42, 0]}>
                        <coneGeometry args={[0.07, 0.16, 6]} />
                        <meshStandardMaterial color="#e8e2d2" roughness={0.85} />
                    </mesh>
                </group>
            ))}
        </group>
    );
}

export default Testudo3D;
