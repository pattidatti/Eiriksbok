import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { Train, Tractor, Ship, Trophy, RotateCcw, Hand, ArrowRight } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameFrame } from './MicroGameFrame';
import { MicroCanvas, Burst } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Det store hamskiftet — et fritt 3D-mikrospill. Dette er IKKE et objekt å
// inspisere, men en levende bygd som eleven forvandler. Tre valg driver Norge
// fra selvbergingsbonde til markedsøkonomi. Hvert valg spiller av en synlig
// 3D-forvandling, og lyspæra kommer i siste steg: de samme maskinene som gjorde
// gården rik, gjorde husmennene overflødige - så de dro til Amerika og byen.
//
// Mekanikken: eleven trykker tre reformkort i rekkefølge (Chromebook-vennlig,
// ingen fikkel-klikk i 3D). Scenen leser bare `stage` (0-3) og demper alt mykt
// mot mål utledet av stage. Slik blir hele bygda animert når stage øker.

// --- liten dempe-hjelper: cur glir mot target ---
function damp(cur: number, target: number, dt: number, speed: number) {
    return cur + (target - cur) * Math.min(1, dt * speed);
}

interface Reform {
    id: string;
    stage: number; // stage-verdien etter at dette kortet er valgt
    title: string;
    blurb: string;
    Icon: React.ComponentType<{ className?: string }>;
    banner: string;
    fact: string;
}

const REFORMS: Reform[] = [
    {
        id: 'jernbane',
        stage: 1,
        title: 'Bygg jernbanen (1854)',
        blurb: 'Knytt bygda til byen. Nå kan fersk melk og kjøtt selges på markedet.',
        Icon: Train,
        banner: 'Toget kommer! Åkrene legges om fra selvberging til salgsjordbruk.',
        fact: 'Med jernbanen sluttet bonden å dyrke alt selv. Han spesialiserte seg, solgte melk og kjøtt i byen, og kjøpte resten for penger. Selvberging ble til salgsjordbruk.',
    },
    {
        id: 'maskin',
        stage: 2,
        title: 'Kjøp slåmaskinen',
        blurb: 'Én mann med hest gjør jobben til ti med ljå. Men hva med de ti?',
        Icon: Tractor,
        banner: 'Slåmaskinen meier åkeren på minutter. Husmennene blir stående uten arbeid.',
        fact: 'Slåmaskinen og hesteriva erstattet titalls slåttekarer. Gården ble mer effektiv, men plutselig trengtes ikke husmennene lenger. Arbeidskraften ble fri - og overflødig.',
    },
    {
        id: 'utvandring',
        stage: 3,
        title: 'Fullfør hamskiftet',
        blurb: 'Følg menneskene som ikke lenger trengs på gården.',
        Icon: Ship,
        banner: 'Bygda har skiftet ham. Husmennene drar - mot Amerika og fabrikkbyen.',
        fact: 'Over 800 000 nordmenn reiste til Amerika. Andre flyttet til fabrikkene langs Akerselva. Den moderne gården skapte rikdom, men tømte bygda for folk.',
    },
];

const Hamskiftet3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    const [stage, setStage] = useState(0);
    const [banner, setBanner] = useState<string | null>(null);
    const [fact, setFact] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextReform = REFORMS[stage]; // reformen som kan velges nå (undefined når ferdig)

    const choose = (reform: Reform) => {
        if (reform.stage !== stage + 1 || done) return;
        sounds.play(reform.stage === 3 ? 'sceneChange' : 'advance');
        setStage(reform.stage);
        setBanner(reform.banner);
        setFact(reform.fact);
        if (reform.stage === 3) {
            // La forvandlingen spille seg ferdig før vinn-skjermen.
            setTimeout(() => {
                sounds.play('complete');
                setDone(true);
                setBurst((b) => b + 1);
                onComplete({ score: 1, completed: true, artifact: { stage: 3 } });
            }, 4200);
        } else {
            sounds.play('correct');
        }
    };

    const reset = () => {
        setStage(0);
        setBanner(null);
        setFact(null);
        setDone(false);
    };

    const idle = stage === 0;

    return (
        <MicroGameFrame
            title="Det store hamskiftet"
            subtitle="Forvandle bygda fra selvbergingsbonde til markedsøkonomi"
            estimatedSeconds={150}
            onRetry={stage > 0 ? reset : undefined}
            bleed
        >
            {/* Vinduet inn i verden får hele bredden; kontrollene bor under det,
                aldri oppå scenen. Slik mister vi ikke dyrebar visuell flate. */}
            <div className="flex flex-col">
                {/* --- 3D-scenen (full bredde) --- */}
                <div
                    className="relative w-full bg-gradient-to-b from-[#bfe0f2] via-[#dceaf0] to-[#e9ddc4] overflow-hidden"
                    style={{ aspectRatio: '16 / 10.8', minHeight: 360 }}
                >
                    <MicroCanvas
                        idle={idle}
                        camera={{ position: [13, 9.5, 13], fov: 38 }}
                        background="#bfe0f2"
                        fog={{ color: '#cfe4ee', near: 26, far: 50 }}
                        target={[0, 0.5, 0]}
                    >
                        <Valley stage={stage} />
                        {/* Feiring når bygda har skiftet ham */}
                        <Burst position={[3, 3, -1]} trigger={burst} color="#d8b24a" count={30} spread={3.4} />
                    </MicroCanvas>
                    {/* Vignette for samme fokuserte look som de andre spillene */}
                    <div
                        className="pointer-events-none absolute inset-0"
                        style={{ boxShadow: 'inset 0 0 90px 10px rgba(15,23,42,0.18)' }}
                    />

                    {idle && (
                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-semibold text-amber-800 shadow"
                        >
                            <Hand className="w-3.5 h-3.5" />
                            Dra for å se bygda - velg en reform under
                        </motion.div>
                    )}

                    {/* Era-merke nede til høyre */}
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/85 backdrop-blur-sm rounded-full text-xs font-bold text-slate-700 shadow">
                        {stage === 0
                            ? '~1840 · Bondesamfunnet'
                            : stage === 1
                              ? 'Salgsjordbruket'
                              : stage === 2
                                ? 'Maskinene tar over'
                                : '~1900 · Det nye Norge'}
                    </div>

                    {/* Banner over scenen */}
                    <AnimatePresence>
                        {banner && !done && (
                            <motion.div
                                key={banner}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-3 left-3 right-3 mx-auto max-w-md rounded-xl bg-amber-900/85 text-amber-50 px-4 py-2.5 text-sm font-semibold shadow-lg text-center"
                            >
                                {banner}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- Kontrollpanel UNDER vinduet: reformkort på rad + fakta --- */}
                <div className="p-3 sm:p-4 bg-white/50 border-t border-amber-200">
                    <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-amber-700">
                        {done ? 'Hamskiftet er fullført' : `Reform ${stage + 1} av 3`}
                    </p>

                    {/* De tre reformene som en vannrett sekvens */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {REFORMS.map((reform) => {
                            const isDone = stage >= reform.stage;
                            const isNext = nextReform?.id === reform.id && !done;
                            const Icon = reform.Icon;
                            return (
                                <button
                                    key={reform.id}
                                    onClick={() => choose(reform)}
                                    disabled={!isNext}
                                    className={`relative text-left rounded-xl border-2 p-3 transition ${
                                        isDone
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : isNext
                                              ? 'bg-amber-100 border-amber-400 hover:bg-amber-200 hover:border-amber-500 shadow-sm cursor-pointer'
                                              : 'bg-slate-50 border-slate-200 opacity-55 cursor-not-allowed'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                                                isDone
                                                    ? 'bg-emerald-500 text-white'
                                                    : isNext
                                                      ? 'bg-amber-500 text-white'
                                                      : 'bg-slate-200 text-slate-400'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-800 leading-tight">
                                                {reform.title}
                                            </p>
                                        </div>
                                        {isNext && (
                                            <ArrowRight className="w-4 h-4 text-amber-600 flex-shrink-0 animate-pulse" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-snug">
                                        {reform.blurb}
                                    </p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Fakta etter hvert valg (full bredde under kortene) */}
                    <AnimatePresence mode="wait">
                        {done ? (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
                                className="mt-3 bg-emerald-50 border border-emerald-300 rounded-xl p-3 sm:flex sm:items-center sm:gap-4"
                            >
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-start gap-2">
                                        <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-bold text-emerald-900 leading-snug">
                                            Norge skiftet ham.
                                        </p>
                                    </div>
                                    <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                        De samme maskinene som gjorde gården rik, gjorde husmennene
                                        overflødige. Velstanden og folkeflukten var to sider av
                                        samme sak.
                                    </p>
                                </div>
                                <button
                                    onClick={reset}
                                    className="mt-2.5 sm:mt-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition flex-shrink-0"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Spill igjen
                                </button>
                            </motion.div>
                        ) : fact ? (
                            <motion.div
                                key={fact}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="mt-3 bg-white border border-amber-200 rounded-xl p-3"
                            >
                                <p className="text-xs text-slate-600 leading-relaxed">{fact}</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 text-center text-xs text-slate-500 italic px-2"
                            >
                                Velg reformene i rekkefølge og se bygda forvandle seg.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </MicroGameFrame>
    );
};

// ============================================================
//  3D-SCENEN — alt utledes av `stage` og dempes mykt mot mål.
// ============================================================

function Valley({ stage }: { stage: number }) {
    return (
        <group>
            <Ground />
            <Fjord />
            <Farm />
            <Field stage={stage} />
            <Husmenn stage={stage} />
            <Mower stage={stage} />
            <Railway stage={stage} />
            <Town stage={stage} />
            <SailShip stage={stage} />
            <Trees />
        </group>
    );
}

// --- Bakke ---
function Ground() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[44, 34]} />
            <meshStandardMaterial color="#7aa84f" roughness={1} />
        </mesh>
    );
}

// --- Fjorden (langs -X), med skimrende vannflate ---
function Fjord() {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    useFrame(({ clock }) => {
        if (matRef.current) {
            matRef.current.emissiveIntensity = 0.12 + Math.sin(clock.getElapsedTime() * 1.2) * 0.05;
        }
    });
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.02, 2]}>
            <planeGeometry args={[16, 30]} />
            <meshStandardMaterial
                ref={matRef}
                color="#3d7fa6"
                roughness={0.3}
                metalness={0.15}
                emissive="#1e4d6b"
                emissiveIntensity={0.14}
            />
        </mesh>
    );
}

// --- Et lite hus med saltak ---
function Cottage({
    position,
    body,
    roof,
    w = 1.6,
    h = 1.1,
    d = 1.3,
}: {
    position: [number, number, number];
    body: string;
    roof: string;
    w?: number;
    h?: number;
    d?: number;
}) {
    return (
        <group position={position}>
            <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={body} roughness={0.85} />
            </mesh>
            {/* Saltak som en flattrykt firkant-pyramide */}
            <mesh position={[0, h + 0.32, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[w * 0.82, 0.64, 4]} />
                <meshStandardMaterial color={roof} roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Gårdstunet ---
function Farm() {
    return (
        <group position={[-6, 0, 6]}>
            <Cottage position={[0, 0, 0]} body="#a8412f" roof="#5c3326" w={2} h={1.3} d={1.5} />
            <Cottage position={[2.4, 0, 0.6]} body="#7a5535" roof="#4a3322" w={2.2} h={1.1} d={1.4} />
        </group>
    );
}

// --- Åkeren: rutenett av teiger som glir fra lappeteppe (selvberging)
//     til ensartet gyllent salgskorn etter jernbanen ---
function Field({ stage }: { stage: number }) {
    const tiles = useMemo(() => {
        const sub = ['#6b8f3a', '#8a9a44', '#9c7b3e', '#7d8f48', '#a98b4a'];
        const out: { pos: [number, number, number]; base: THREE.Color }[] = [];
        const cols = 6;
        const rows = 5;
        let i = 0;
        for (let cx = 0; cx < cols; cx++) {
            for (let cz = 0; cz < rows; cz++) {
                out.push({
                    pos: [cx * 1.55 - 3.0, 0.03, cz * 1.55 - 3.0],
                    base: new THREE.Color(sub[i++ % sub.length]),
                });
            }
        }
        return out;
    }, []);

    return (
        <group position={[3, 0, -1]}>
            {tiles.map((t, i) => (
                <FieldTile key={i} pos={t.pos} base={t.base} stage={stage} index={i} />
            ))}
        </group>
    );
}

const GOLD = new THREE.Color('#d8b24a');
const CUT = new THREE.Color('#c9a86a'); // meiet stubb-farge

function FieldTile({
    pos,
    base,
    stage,
    index,
}: {
    pos: [number, number, number];
    base: THREE.Color;
    stage: number;
    index: number;
}) {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);
    const yRef = useRef<THREE.Mesh>(null);
    useFrame((_, dt) => {
        if (matRef.current) {
            // Mål: stage>=2 meiet stubb, stage>=1 gyllent korn, ellers lappeteppe
            const target = stage >= 2 ? CUT : stage >= 1 ? GOLD : base;
            matRef.current.color.lerp(target, Math.min(1, dt * 2.2));
        }
        if (yRef.current) {
            // Kornet "vokser" litt opp ved salgsjordbruk, og trykkes flatt når det meies
            const targetH = stage >= 2 ? 0.05 : stage >= 1 ? 0.26 : 0.14;
            yRef.current.scale.y = damp(yRef.current.scale.y, targetH / 0.2, dt, 3);
            yRef.current.position.y = (0.2 * yRef.current.scale.y) / 2;
        }
    });
    void index;
    return (
        <mesh ref={yRef} position={[pos[0], 0.1, pos[2]]} castShadow receiveShadow>
            <boxGeometry args={[1.4, 0.2, 1.4]} />
            <meshStandardMaterial ref={matRef} color={base} roughness={1} />
        </mesh>
    );
}

// --- Husmenn: små figurer. Slår med ljå (stage 0-1), står stille når
//     maskinen kommer (stage 2), og vandrer bort (stage 3) ---
const HUSMENN = [
    { home: [1, -1.5] as [number, number], dest: 'ship' as const },
    { home: [3.2, 0.5] as [number, number], dest: 'ship' as const },
    { home: [0.2, 1.8] as [number, number], dest: 'town' as const },
    { home: [2.4, 2.6] as [number, number], dest: 'town' as const },
    { home: [4.0, -1.0] as [number, number], dest: 'town' as const },
];

const DEST_SHIP: [number, number] = [-9, 5.5];
const DEST_TOWN: [number, number] = [11, -4];

function Husmenn({ stage }: { stage: number }) {
    return (
        <group position={[3, 0, -1]}>
            {HUSMENN.map((h, i) => (
                <Husmann key={i} home={h.home} dest={h.dest} stage={stage} phase={i * 0.9} />
            ))}
        </group>
    );
}

function Husmann({
    home,
    dest,
    stage,
    phase,
}: {
    home: [number, number];
    dest: 'ship' | 'town';
    stage: number;
    phase: number;
}) {
    const group = useRef<THREE.Group>(null);
    const scythe = useRef<THREE.Group>(null);
    const walk = useRef(0); // 0 = på åkeren, 1 = framme ved mål
    const destXZ = dest === 'ship' ? DEST_SHIP : DEST_TOWN;
    // Mål er relativt til Husmenn-gruppa (position [3,0,-1]), så trekk fra.
    const target: [number, number] = [destXZ[0] - 3, destXZ[1] + 1];

    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        const t = clock.getElapsedTime();

        // Vandring først ved stage 3
        walk.current = damp(walk.current, stage >= 3 ? 1 : 0, dt, 0.55);
        const w = walk.current;
        const x = home[0] + (target[0] - home[0]) * w;
        const z = home[1] + (target[1] - home[1]) * w;
        group.current.position.x = x;
        group.current.position.z = z;
        // Liten gå-vugging når de er underveis
        const moving = stage >= 3 && w < 0.99;
        group.current.position.y = moving ? Math.abs(Math.sin(t * 6 + phase)) * 0.12 : 0;
        // Snu mot målet
        if (w > 0.001) group.current.rotation.y = Math.atan2(target[0] - home[0], target[1] - home[1]);
        // Forsvinn når de er framme (gått om bord / inn i byen)
        const vis = !(stage >= 3 && w > 0.97);
        group.current.visible = vis;

        // Ljå-sving kun mens de jobber (stage < 2)
        if (scythe.current) {
            if (stage < 2) {
                scythe.current.rotation.x = -0.5 + Math.sin(t * 4 + phase) * 0.6;
            } else {
                scythe.current.rotation.x = damp(scythe.current.rotation.x, -1.4, dt, 4);
            }
        }
    });

    const bodyColor = dest === 'ship' ? '#3b5a78' : '#5a4632';

    return (
        <group ref={group} position={[home[0], 0, home[1]]}>
            {/* kropp */}
            <mesh position={[0, 0.32, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.18, 0.5, 7]} />
                <meshStandardMaterial color={bodyColor} roughness={0.9} />
            </mesh>
            {/* hode */}
            <mesh position={[0, 0.66, 0]} castShadow>
                <sphereGeometry args={[0.13, 10, 10]} />
                <meshStandardMaterial color="#e0b98c" roughness={0.8} />
            </mesh>
            {/* ljå (slått-redskap) */}
            <group ref={scythe} position={[0.12, 0.42, 0]}>
                <mesh position={[0, 0.18, 0.16]} rotation={[Math.PI / 3, 0, 0]}>
                    <cylinderGeometry args={[0.02, 0.02, 0.7, 5]} />
                    <meshStandardMaterial color="#6b4a2a" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.02, 0.42]} rotation={[0, 0, Math.PI / 2]}>
                    <boxGeometry args={[0.02, 0.34, 0.04]} />
                    <meshStandardMaterial color="#cfd4d8" metalness={0.4} roughness={0.4} />
                </mesh>
            </group>
        </group>
    );
}

// --- Slåmaskinen: hest + meieapparat som sveiper over åkeren ved stage 2 ---
function Mower({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const wheelL = useRef<THREE.Mesh>(null);
    const wheelR = useRef<THREE.Mesh>(null);
    const progress = useRef(0);
    const startZ = -6;
    const endZ = 5;

    useFrame((_, dt) => {
        if (!group.current) return;
        // Kjør over åkeren ved stage 2, og bli stående etterpå
        const active = stage >= 2;
        progress.current = damp(progress.current, active ? 1 : 0, dt, active ? 0.5 : 2);
        const p = progress.current;
        group.current.visible = stage >= 2;
        const z = startZ + (endZ - startZ) * p;
        group.current.position.set(3.2, 0, z - 1);
        const spin = active && p < 0.99;
        if (spin) {
            if (wheelL.current) wheelL.current.rotation.x += dt * 6;
            if (wheelR.current) wheelR.current.rotation.x += dt * 6;
        }
    });

    return (
        <group ref={group} visible={false}>
            {/* hest */}
            <group position={[0, 0, 1.1]}>
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.45, 1.1]} />
                    <meshStandardMaterial color="#6b4226" roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.78, 0.6]} castShadow>
                    <boxGeometry args={[0.3, 0.5, 0.35]} />
                    <meshStandardMaterial color="#5a3620" roughness={0.9} />
                </mesh>
                {[[-0.13, 0.45], [0.13, 0.45], [-0.13, -0.45], [0.13, -0.45]].map((p, i) => (
                    <mesh key={i} position={[p[0], 0.18, p[1]]} castShadow>
                        <boxGeometry args={[0.1, 0.36, 0.1]} />
                        <meshStandardMaterial color="#4a2c19" roughness={0.9} />
                    </mesh>
                ))}
            </group>
            {/* slåmaskin-kasse */}
            <mesh position={[0, 0.5, -0.3]} castShadow>
                <boxGeometry args={[0.7, 0.4, 0.7]} />
                <meshStandardMaterial color="#7a1f1f" roughness={0.7} metalness={0.2} />
            </mesh>
            {/* hjul */}
            <mesh ref={wheelL} position={[-0.5, 0.35, -0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.36, 0.36, 0.08, 14]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
            </mesh>
            <mesh ref={wheelR} position={[0.5, 0.35, -0.35]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.36, 0.36, 0.08, 14]} />
                <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
            </mesh>
            {/* skjærebjelke */}
            <mesh position={[-0.7, 0.18, -0.35]}>
                <boxGeometry args={[0.8, 0.06, 0.1]} />
                <meshStandardMaterial color="#cfd4d8" metalness={0.5} roughness={0.4} />
            </mesh>
        </group>
    );
}

// --- Jernbanen: skinnegang + lokomotiv som kommer kjørende ved stage 1 ---
function Railway({ stage }: { stage: number }) {
    const train = useRef<THREE.Group>(null);
    const progress = useRef(0);
    const railZ = -8.5;

    useFrame((_, dt) => {
        if (!train.current) return;
        progress.current = damp(progress.current, stage >= 1 ? 1 : 0, dt, stage >= 1 ? 0.45 : 2.5);
        const p = progress.current;
        // Toget kjører inn fra høyre (+X) og blir stående midt på
        train.current.position.x = 16 - 14 * p;
        train.current.visible = stage >= 1;
    });

    return (
        <group position={[0, 0, railZ]}>
            {/* skinner (vises alltid fra stage 1 via tre-effekt — men enkelt: alltid synlige, lavmælte) */}
            {stage >= 1 && (
                <>
                    <mesh position={[0, 0.06, -0.35]} receiveShadow>
                        <boxGeometry args={[34, 0.08, 0.1]} />
                        <meshStandardMaterial color="#52606b" metalness={0.5} roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0.06, 0.35]} receiveShadow>
                        <boxGeometry args={[34, 0.08, 0.1]} />
                        <meshStandardMaterial color="#52606b" metalness={0.5} roughness={0.5} />
                    </mesh>
                </>
            )}

            <group ref={train} visible={false}>
                {/* lokomotiv */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <boxGeometry args={[1.6, 0.7, 0.8]} />
                    <meshStandardMaterial color="#2f3b2c" roughness={0.6} metalness={0.2} />
                </mesh>
                <mesh position={[0.55, 0.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.32, 0.32, 0.9, 14]} />
                    <meshStandardMaterial color="#3a2a22" roughness={0.6} metalness={0.2} />
                </mesh>
                {/* skorstein */}
                <mesh position={[0.75, 1.05, 0]} castShadow>
                    <cylinderGeometry args={[0.1, 0.14, 0.4, 10]} />
                    <meshStandardMaterial color="#1c1c1c" roughness={0.8} />
                </mesh>
                {/* vogn med melkespann */}
                <mesh position={[-1.5, 0.5, 0]} castShadow>
                    <boxGeometry args={[1.2, 0.55, 0.8]} />
                    <meshStandardMaterial color="#8a6a3a" roughness={0.8} />
                </mesh>
                {[-1.8, -1.5, -1.2].map((x, i) => (
                    <mesh key={i} position={[x, 0.92, 0]} castShadow>
                        <cylinderGeometry args={[0.13, 0.13, 0.3, 10]} />
                        <meshStandardMaterial color="#c9ccce" metalness={0.5} roughness={0.4} />
                    </mesh>
                ))}
            </group>
        </group>
    );
}

// --- Byen: vokser og får fabrikkrøyk ved stage 3 ---
function Town({ stage }: { stage: number }) {
    return (
        <group position={[11, 0, -4]}>
            {/* kirke (alltid der) */}
            <group position={[0, 0, 0]}>
                <mesh position={[0, 0.9, 0]} castShadow>
                    <boxGeometry args={[1, 1.8, 1.3]} />
                    <meshStandardMaterial color="#e8e2d4" roughness={0.9} />
                </mesh>
                <mesh position={[0, 2.4, 0]} castShadow>
                    <coneGeometry args={[0.55, 1.4, 4]} />
                    <meshStandardMaterial color="#3a3026" roughness={0.9} />
                </mesh>
            </group>
            {/* små hus (alltid) */}
            <Cottage position={[-1.8, 0, 1]} body="#cdbb96" roof="#6b4a2f" w={1.2} h={0.9} d={1.1} />
            <Cottage position={[1.6, 0, 1.4]} body="#c0a87f" roof="#5c3a26" w={1.3} h={0.9} d={1.1} />

            {/* nye hus som reiser seg ved stage 3 */}
            <RisingCottage position={[-2.6, 0, -1.2]} body="#b59a72" roof="#54382a" show={stage >= 3} />
            <RisingCottage position={[2.4, 0, -1.4]} body="#c7b487" roof="#4f3526" show={stage >= 3} delay={0.3} />
            <RisingCottage position={[0.2, 0, 2.6]} body="#bda680" roof="#5c3a26" show={stage >= 3} delay={0.6} />

            {/* fabrikk med pipe + røyk ved stage 3 */}
            <Factory show={stage >= 3} />
        </group>
    );
}

function RisingCottage({
    position,
    body,
    roof,
    show,
    delay = 0,
}: {
    position: [number, number, number];
    body: string;
    roof: string;
    show: boolean;
    delay?: number;
}) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    const wait = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        if (show) wait.current += dt;
        const active = show && wait.current > delay;
        rise.current = damp(rise.current, active ? 1 : 0, dt, 3);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={position} scale={[1, 0, 1]} visible={false}>
            <Cottage position={[0, 0, 0]} body={body} roof={roof} w={1.2} h={1} d={1.1} />
        </group>
    );
}

function Factory({ show }: { show: boolean }) {
    const group = useRef<THREE.Group>(null);
    const rise = useRef(0);
    useFrame((_, dt) => {
        if (!group.current) return;
        rise.current = damp(rise.current, show ? 1 : 0, dt, 2.4);
        group.current.scale.y = rise.current;
        group.current.visible = rise.current > 0.02;
    });
    return (
        <group ref={group} position={[3.4, 0, 0.4]} scale={[1, 0, 1]} visible={false}>
            <mesh position={[0, 0.7, 0]} castShadow>
                <boxGeometry args={[1.6, 1.4, 1.2]} />
                <meshStandardMaterial color="#7a3b2a" roughness={0.85} />
            </mesh>
            <mesh position={[0.5, 1.9, 0]} castShadow>
                <cylinderGeometry args={[0.16, 0.2, 1.4, 10]} />
                <meshStandardMaterial color="#4a2a20" roughness={0.9} />
            </mesh>
            <Smoke origin={[0.5, 2.7, 0]} show={show} />
        </group>
    );
}

// --- Fabrikkrøyk: puffer som stiger og toner ut ---
function Smoke({ origin, show }: { origin: [number, number, number]; show: boolean }) {
    const puffs = useRef<THREE.Mesh[]>([]);
    const COUNT = 5;
    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        for (let i = 0; i < COUNT; i++) {
            const m = puffs.current[i];
            if (!m) continue;
            const cycle = ((t * 0.5 + i / COUNT) % 1); // 0..1
            const y = origin[1] + cycle * 2.2;
            const spread = cycle * 0.6;
            m.position.set(origin[0] + Math.sin(t + i) * spread, y, origin[2] + Math.cos(t * 0.7 + i) * spread * 0.5);
            const s = 0.18 + cycle * 0.45;
            m.scale.setScalar(s);
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.opacity = show ? (1 - cycle) * 0.6 : 0;
            m.visible = show;
        }
    });
    return (
        <group>
            {Array.from({ length: COUNT }).map((_, i) => (
                <mesh
                    key={i}
                    ref={(el) => {
                        if (el) puffs.current[i] = el;
                    }}
                >
                    <sphereGeometry args={[1, 8, 8]} />
                    <meshStandardMaterial color="#6b6b6b" transparent opacity={0} roughness={1} />
                </mesh>
            ))}
        </group>
    );
}

// --- Utvandrerskipet: ligger ved kaia, og seiler ut fjorden ved stage 3 ---
function SailShip({ stage }: { stage: number }) {
    const group = useRef<THREE.Group>(null);
    const sail = useRef(0);
    const wait = useRef(0);
    const start: [number, number] = [-9, 6.5];
    const out: [number, number] = [-22, 1];

    useFrame(({ clock }, dt) => {
        if (!group.current) return;
        // Vent til husmennene er om bord før skipet legger fra kai
        if (stage >= 3) wait.current += dt;
        const active = stage >= 3 && wait.current > 1.8;
        sail.current = damp(sail.current, active ? 1 : 0, dt, 0.4);
        const p = sail.current;
        group.current.position.x = start[0] + (out[0] - start[0]) * p;
        group.current.position.z = start[1] + (out[1] - start[1]) * p;
        // bølge-vugg
        group.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.5) * 0.04;
        group.current.visible = stage >= 3 || p > 0.01;
    });

    return (
        <group ref={group} position={[start[0], 0.15, start[1]]} visible={false}>
            {/* skrog */}
            <mesh position={[0, 0.25, 0]} castShadow>
                <boxGeometry args={[2.2, 0.5, 0.8]} />
                <meshStandardMaterial color="#5a3a22" roughness={0.85} />
            </mesh>
            <mesh position={[1.2, 0.3, 0]} rotation={[0, Math.PI / 4, -Math.PI / 2]} castShadow>
                <coneGeometry args={[0.4, 0.9, 4]} />
                <meshStandardMaterial color="#4a2f1c" roughness={0.85} />
            </mesh>
            {/* mast + seil */}
            <mesh position={[0, 1.1, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 1.6, 6]} />
                <meshStandardMaterial color="#3a2a1a" />
            </mesh>
            <mesh position={[0, 1.2, 0]}>
                <planeGeometry args={[1.1, 1.1]} />
                <meshStandardMaterial color="#f3ece0" side={THREE.DoubleSide} roughness={0.9} />
            </mesh>
        </group>
    );
}

// --- Litt natur ---
function Tree({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.1, 0.14, 0.8, 6]} />
                <meshStandardMaterial color="#5c3f26" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.1, 0]} castShadow>
                <coneGeometry args={[0.6, 1.4, 8]} />
                <meshStandardMaterial color="#3f6b39" roughness={0.9} />
            </mesh>
        </group>
    );
}

function Trees() {
    const spots: [number, number, number][] = [
        [-3, 0, 9],
        [-9, 0, 9.5],
        [9, 0, 7],
        [7.5, 0, -8.5],
        [-2, 0, -9],
    ];
    return (
        <>
            {spots.map((p, i) => (
                <Tree key={i} position={p} />
            ))}
        </>
    );
}

export default Hamskiftet3D;
