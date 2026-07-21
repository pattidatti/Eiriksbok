import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { MicroGameScaffold } from './kit/MicroGameScaffold';
import { Rotatable, Gear, Burst } from './kit';
import { SceneBanner, SceneBadge, DragHint, DataReadout, WinScreen } from './kit/overlays';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Antikythera-mekanismen: vri sveiva og spå en formørkelse.
//
// Lyspæren: ett tak på sveiva driver HELE maskinen. Fordi tannhjulene har
// ulik størrelse, går måneviseren mye fortere enn solviseren. Vri fram til
// begge viserne møtes i formørkelses-porten øverst - da har du spådd en
// solformørkelse, akkurat slik den 2000 år gamle bronsemaskinen gjorde.
//
// Mekanikken ER pedagogikken: du kjenner på kroppen at én bevegelse setter
// mange hjul i gang, og at det er farten på hjulene som lar maskinen spå.

function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

const TWO_PI = Math.PI * 2;
const MOON_RATE = 13; // månen går 13 runder mens sola går 1
const TARGET = TWO_PI; // ett helt år - da står begge viserne rett opp i porten

type Phase = 'winding' | 'done';

export default function Antikythera3D({ onComplete }: MicroGameProps) {
    const sounds = useStepSounds();
    const [crank, setCrank] = useState(0);
    const [phase, setPhase] = useState<Phase>('winding');
    const [banner, setBanner] = useState<string | null>(null);
    const [burst, setBurst] = useState(0);
    const [resetKey, setResetKey] = useState(0);
    const [newMoons, setNewMoons] = useState(0);
    const passedNewMoon = useRef(0);

    const onCrank = (angle: number) => {
        setCrank(angle);
        // Tell nymånene: hver gang måneviseren tar igjen solviseren.
        const nm = Math.floor((angle * (MOON_RATE - 1)) / TWO_PI);
        if (nm > passedNewMoon.current && phase === 'winding') {
            passedNewMoon.current = nm;
            setNewMoons(Math.min(12, nm));
            if (nm < 12) setBanner(`Nymåne nr. ${nm} - men sola står ikke i porten ennå`);
        }
    };

    const onWin = () => {
        if (phase === 'done') return;
        setPhase('done');
        setCrank(TARGET);
        setBanner('Solformørkelse spådd! Sol og måne møtes i porten.');
        setBurst((b) => b + 1);
        sounds.play('complete');
        onComplete({ score: 1, completed: true, artifact: { formorkelse: true } });
    };

    const reset = () => {
        setCrank(0);
        setPhase('winding');
        setBanner(null);
        passedNewMoon.current = 0;
        setNewMoons(0);
        setResetKey((k) => k + 1);
    };

    const idle = crank < 0.05 && phase === 'winding';
    const months = (crank / TWO_PI) * 12;
    const era = phase === 'done' ? 'Formørkelse spådd' : 'Antikythera · ~100 fvt';

    return (
        <MicroGameScaffold
            title="Vri sveiva på Antikythera-mekanismen"
            subtitle="Dra sveiva rundt og spol tiden framover, til sol- og måneviseren møtes i formørkelses-porten øverst"
            estimatedSeconds={130}
            onRetry={crank > 0.05 || phase !== 'winding' ? reset : undefined}
            canvas={{
                idle,
                camera: { position: [0, 1.6, 9], fov: 42 },
                background: '#e7dcc6',
                fog: { color: '#e7dcc6', near: 22, far: 46 },
                target: [0, 1.4, 0],
                light: 'golden',
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <SceneBadge corner="br">{era}</SceneBadge>
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Måneder', value: months.toFixed(1) },
                            { label: 'Nymåner', value: String(newMoons) },
                        ]}
                    />
                    <DragHint show={idle} corner="bc">
                        Dra sveiva nede til høyre rundt og rundt
                    </DragHint>
                </>
            }
            scene={
                <MechanismScene
                    key={resetKey}
                    crank={crank}
                    phase={phase}
                    burst={burst}
                    onCrank={onCrank}
                    onWin={onWin}
                />
            }
        >
            {/* Status + payoff under vinduet */}
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                {phase === 'done' ? 'Du spådde en solformørkelse' : 'Vri sveiva mot porten øverst'}
            </p>

            <AnimatePresence mode="wait">
                {phase === 'done' ? (
                    <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <WinScreen title="Maskinen spår himmelen." onReplay={reset}>
                            Ett tak på sveiva satte alle tannhjulene i gang. Måneviseren spant 13 ganger
                            mens solviseren så vidt gikk én runde - fordi hjulene har ulik størrelse.
                            Nettopp slik kunne Antikythera-mekanismen regne ut når sol og måne ville møtes,
                            og spå formørkelser år fram i tid.
                        </WinScreen>
                    </motion.div>
                ) : (
                    <motion.div
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-xl border border-amber-200 bg-white p-3"
                    >
                        <p className="text-xs leading-relaxed text-slate-600">
                            Solviseren (gull) beveger seg sakte, måneviseren (sølv) fort. En solformørkelse
                            skjer bare når begge peker mot porten øverst samtidig. Vri sveiva til de møtes
                            der.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </MicroGameScaffold>
    );
}

// ============================================================
//  3D-SCENEN
// ============================================================

function MechanismScene({
    crank,
    phase,
    burst,
    onCrank,
    onWin,
}: {
    crank: number;
    phase: Phase;
    burst: number;
    onCrank: (a: number) => void;
    onWin: () => void;
}) {
    return (
        <group position={[0, 0.2, 0]}>
            {/* Bronsekasse bak urskiva */}
            <mesh position={[0, 1.4, -0.35]} castShadow receiveShadow>
                <boxGeometry args={[4.6, 3.4, 0.6]} />
                <meshStandardMaterial color="#8a6a2f" metalness={0.55} roughness={0.5} />
            </mesh>
            {/* ramme rundt skiva */}
            <mesh position={[0, 1.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <torusGeometry args={[1.85, 0.12, 16, 48]} />
                <meshStandardMaterial color="#b98f3e" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Koblede tannhjul - drives av sveiva */}
            <group position={[0, 1.7, 0.02]}>
                <group rotation={[0, 0, crank]}>
                    <Gear position={[0, 0, 0]} radius={0.5} teeth={14} color="#c9a24e" />
                </group>
                <group rotation={[0, 0, -crank * 2.1]}>
                    <Gear position={[1.15, -0.9, 0]} radius={0.32} teeth={9} color="#a9822f" />
                </group>
                <group rotation={[0, 0, crank * 3.2]}>
                    <Gear position={[-1.2, -0.8, 0]} radius={0.28} teeth={8} color="#a9822f" />
                </group>
            </group>

            <ZodiacFace y={1.7} />

            {/* Sol- og måneviser: drevet av sveiva */}
            <group position={[0, 1.7, 0.55]}>
                <Pointer angle={-crank} length={1.35} color="#e8b93a" kind="sun" />
                <Pointer angle={-crank * MOON_RATE} length={1.05} color="#d8dbe0" kind="moon" />
                {/* nav */}
                <mesh>
                    <cylinderGeometry args={[0.16, 0.16, 0.14, 16]} />
                    <meshStandardMaterial color="#5a4423" metalness={0.5} roughness={0.5} />
                </mesh>
            </group>

            {/* Formørkelses-port øverst */}
            <EclipseGate y={1.7} lit={phase === 'done'} />

            {/* Sveiva nede til høyre */}
            <CrankHandle crank={crank} onCrank={onCrank} onWin={onWin} />

            {/* sokkel */}
            <mesh position={[0, -0.15, 0]} receiveShadow>
                <boxGeometry args={[5.2, 0.3, 2.2]} />
                <meshStandardMaterial color="#6f5a3a" roughness={0.9} />
            </mesh>

            <Burst position={[0, 3.05, 0.6]} trigger={burst} color="#ffd873" count={26} spread={2.6} />
        </group>
    );
}

// Urskive med 12 stjernetegn-hakk.
function ZodiacFace({ y }: { y: number }) {
    const ticks = [];
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ticks.push(
            <mesh key={i} position={[Math.sin(a) * 1.62, Math.cos(a) * 1.62 + y, 0.5]}>
                <boxGeometry args={[0.08, 0.22, 0.06]} />
                <meshStandardMaterial color="#efe3c4" emissive="#3a2e12" emissiveIntensity={0.2} />
            </mesh>
        );
    }
    return (
        <group>
            {/* skive */}
            <mesh position={[0, y, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.72, 1.72, 0.1, 40]} />
                <meshStandardMaterial color="#efe7d0" roughness={0.7} />
            </mesh>
            {ticks}
        </group>
    );
}

// En viser: en tynn arm med en skive (sol eller måne) i tuppen.
function Pointer({
    angle,
    length,
    color,
    kind,
}: {
    angle: number;
    length: number;
    color: string;
    kind: 'sun' | 'moon';
}) {
    const ref = useRef<THREE.Group>(null);
    // Myk demping mot målvinkelen, så viserne glir i stedet for å hoppe.
    useFrame((_, dt) => {
        if (ref.current) ref.current.rotation.z = damp(ref.current.rotation.z, angle, dt, 10);
    });
    return (
        <group ref={ref}>
            <mesh position={[0, length / 2, 0.06]} castShadow>
                <boxGeometry args={[kind === 'sun' ? 0.1 : 0.07, length, 0.05]} />
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, length, 0.1]}>
                <sphereGeometry args={[kind === 'sun' ? 0.24 : 0.18, 18, 18]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={kind === 'sun' ? 0.5 : 0.2}
                    roughness={0.4}
                />
            </mesh>
        </group>
    );
}

// Formørkelses-porten øverst på skiva. Lyser opp når formørkelsen er spådd.
function EclipseGate({ y, lit }: { y: number; lit: boolean }) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame((_, dt) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity = damp(
                matRef.current.emissiveIntensity,
                lit ? 1.4 : 0.35,
                dt,
                3
            );
        }
    });
    return (
        <group position={[0, y + 1.62, 0.56]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.28, 0.06, 12, 24]} />
                <meshStandardMaterial
                    ref={matRef}
                    color="#7c6cff"
                    emissive="#7c6cff"
                    emissiveIntensity={0.35}
                />
            </mesh>
        </group>
    );
}

// Sveiva: en knott med et håndtak eleven drar rundt. Roterer om z.
function CrankHandle({
    crank,
    onCrank,
    onWin,
}: {
    crank: number;
    onCrank: (a: number) => void;
    onWin: () => void;
}) {
    return (
        <group position={[2.55, 0.75, 0.4]}>
            {/* aksel-plate */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.12, 24]} />
                <meshStandardMaterial color="#8a6a2f" metalness={0.5} roughness={0.5} />
            </mesh>
            <Rotatable
                axis="z"
                position={[0, 0, 0.12]}
                initial={0}
                min={0}
                max={TWO_PI * 1.2}
                target={TWO_PI}
                tolerance={0.4}
                sensitivity={0.02}
                onChange={onCrank}
                onAlign={onWin}
            >
                {/* romslig usynlig gripeflate for trackpad */}
                <mesh>
                    <boxGeometry args={[1.3, 1.3, 0.6]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>
                {/* nav */}
                <mesh>
                    <cylinderGeometry args={[0.14, 0.14, 0.24, 16]} />
                    <meshStandardMaterial color="#b98f3e" metalness={0.6} roughness={0.4} />
                </mesh>
                {/* arm */}
                <mesh position={[0, 0.28, 0.12]} castShadow>
                    <boxGeometry args={[0.1, 0.56, 0.1]} />
                    <meshStandardMaterial color="#c9a24e" metalness={0.55} roughness={0.45} />
                </mesh>
                {/* håndtak */}
                <mesh position={[0, 0.52, 0.2]} castShadow>
                    <cylinderGeometry args={[0.09, 0.09, 0.24, 14]} />
                    <meshStandardMaterial color="#5a4423" roughness={0.6} />
                </mesh>
            </Rotatable>
            {/* liten indikator på gripe-cursor */}
            <mesh position={[0, 0, -0.08]}>
                <ringGeometry args={[0.52, 0.6, 24]} />
                <meshBasicMaterial color={crank > 0.05 ? '#c9a24e' : '#9a7c3a'} />
            </mesh>
        </group>
    );
}
