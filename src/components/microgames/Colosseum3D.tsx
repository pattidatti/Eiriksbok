import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import * as THREE from 'three';
import { MicroGameScaffold, Interactive, Burst, DragHint, SceneFact, WinScreen } from './kit';
import { useStepSounds } from '../../hooks/useStepSounds';
import type { MicroGameProps } from './types';

// Roter Colosseum og klikk de fire etasjene i riktig byggerekkefølge.
// Lærer arkitektur-rekkefølgen: dorisk (bunn) → jonisk → korintisk → attika.
//
// Bygd på interaksjons-toolkitet: MicroGameScaffold (full-bredde-vindu, kontroller
// under), Interactive (klikkbare etasjer), Burst (feiring ved fullført rekkefølge).

interface Level {
    order: number;
    name: string;
    columnStyle: string;
    fact: string;
    y: number;
    radiusOuter: number;
    radiusInner: number;
    height: number;
}

const LEVELS: Level[] = [
    {
        order: 1,
        name: '1. etasje',
        columnStyle: 'Dorisk',
        fact: 'Tyngste søylestil - enkle, kraftige søyler. Begynt under keiser Vespasian rundt år 70 e.Kr.',
        y: 0,
        radiusOuter: 3.0,
        radiusInner: 2.5,
        height: 1.6,
    },
    {
        order: 2,
        name: '2. etasje',
        columnStyle: 'Jonisk',
        fact: 'Slankere søyler med voluttkapiteler. Bygd under Vespasians sønn Titus.',
        y: 1.6,
        radiusOuter: 2.85,
        radiusInner: 2.35,
        height: 1.5,
    },
    {
        order: 3,
        name: '3. etasje',
        columnStyle: 'Korintisk',
        fact: 'Mest dekorerte søyler - akantusblader. Ferdig under Domitian rundt år 80 e.Kr.',
        y: 3.1,
        radiusOuter: 2.7,
        radiusInner: 2.2,
        height: 1.4,
    },
    {
        order: 4,
        name: '4. etasje (attika)',
        columnStyle: 'Pilaster',
        fact: 'Solid topp uten åpne bueganger. Her ble velariet (soltaket) festet med master.',
        y: 4.5,
        radiusOuter: 2.6,
        radiusInner: 2.1,
        height: 1.0,
    },
];

const Colosseum3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const sounds = useStepSounds();
    // Etasjer valgt riktig, i rekkefølge (erstatter tidsstempel-sortering).
    const [correctOrder, setCorrectOrder] = useState<number[]>([]);
    const [wrongOrder, setWrongOrder] = useState<number | null>(null);
    const [hoveredOrder, setHoveredOrder] = useState<number | null>(null);
    const [done, setDone] = useState(false);
    const [burst, setBurst] = useState(0);

    const nextExpected = correctOrder.length + 1;

    const handleSelect = (order: number) => {
        if (done) return;
        if (correctOrder.includes(order)) return;

        if (order === nextExpected) {
            const next = [...correctOrder, order];
            setCorrectOrder(next);
            sounds.play('correct');
            if (next.length === LEVELS.length) {
                setTimeout(() => {
                    sounds.play('complete');
                    setDone(true);
                    setBurst((b) => b + 1);
                    onComplete({ score: 1, completed: true, artifact: { perfectOrder: true } });
                }, 600);
            }
        } else {
            sounds.play('incorrect');
            setWrongOrder(order);
            setTimeout(() => setWrongOrder(null), 800);
        }
    };

    const handleRetry = () => {
        setCorrectOrder([]);
        setWrongOrder(null);
        setDone(false);
    };

    const handleFinish = () => {
        onComplete({
            score: correctOrder.length / LEVELS.length,
            completed: true,
            artifact: { perfectOrder: done },
        });
    };

    const currentLevel = LEVELS.find((l) => l.order === nextExpected);
    const lastOrder = correctOrder[correctOrder.length - 1];
    const lastCorrectLevel = lastOrder ? LEVELS.find((l) => l.order === lastOrder) ?? null : null;
    const idle = correctOrder.length === 0 && !done;

    return (
        <MicroGameScaffold
            title="Roter Colosseum"
            subtitle="Klikk etasjene i byggerekkefølge - nederst først"
            estimatedSeconds={120}
            onRetry={correctOrder.length > 0 ? handleRetry : undefined}
            // 16/10, ikke standard 16/12: på en Chromebook (1366x768) blir et
            // 16/12-vindu her ca. 788 px høyt inkludert topplinjen, så bunnen av
            // modellen havner under skjermkanten.
            aspectRatio="16/10"
            canvas={{
                idle,
                // Bygget er 5,5 høyt pluss velarium-master. Rammen er regnet ut
                // så silhuetten fyller ca. 70 % av høyden: nærmere gjør at buene
                // og kapitélene faktisk kan leses, uten å kutte toppen eller bunnen.
                camera: { position: [7.8, 5.6, 7.8], fov: 40 },
                background: '#f8eed7',
                fog: { near: 20, far: 44 },
                target: [0, 2.6, 0],
                // Standard 0.45 gir nesten umerkelig bevegelse på et bygg av denne
                // størrelsen, så scenen leses som et stillbilde.
                autoRotateSpeed: 0.95,
            }}
            containerClassName="bg-gradient-to-b from-[#fef9ee] to-[#e8d8b8]"
            overlays={<DragHint show={idle}>Dra for å rotere - klikk nederste etasje først</DragHint>}
            scene={
                <>
                    {/* Grunn */}
                    <mesh receiveShadow position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[5.6, 64]} />
                        <meshStandardMaterial color="#d4be8f" roughness={0.95} />
                    </mesh>

                    {/* Tribuner: tre trinn som skråner ned mot arenaen. Uten disse
                        var innsiden helt hul, og bygget leste som et tomt skall. */}
                    {[
                        { r: 2.45, y: 1.15, c: '#c3a675' },
                        { r: 1.95, y: 0.75, c: '#b99b6b' },
                        { r: 1.5, y: 0.4, c: '#af9162' },
                    ].map((t, i) => (
                        <mesh key={i} position={[0, t.y, 0]} receiveShadow>
                            <cylinderGeometry args={[t.r, t.r, 0.16, 40, 1, false]} />
                            <meshStandardMaterial color={t.c} roughness={0.95} />
                        </mesh>
                    ))}

                    {/* Arenagulv med den ovale sanden */}
                    <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <circleGeometry args={[1.4, 48]} />
                        <meshStandardMaterial color="#e3cf9f" roughness={1.0} />
                    </mesh>
                    {/* Hypogeum-gangene under arenaen, antydet som mørke striper */}
                    {[0, 1, 2].map((i) => (
                        <mesh
                            key={i}
                            position={[0, 0.43, 0]}
                            rotation={[-Math.PI / 2, 0, (i / 3) * Math.PI]}
                        >
                            <planeGeometry args={[2.5, 0.11]} />
                            <meshStandardMaterial color="#8d7145" roughness={1.0} />
                        </mesh>
                    ))}

                    {LEVELS.map((level) => (
                        <ColosseumLevel
                            key={level.order}
                            level={level}
                            state={
                                wrongOrder === level.order
                                    ? 'wrong'
                                    : correctOrder.includes(level.order)
                                      ? 'correct'
                                      : hoveredOrder === level.order
                                        ? 'hover'
                                        : 'idle'
                            }
                            onSelect={() => handleSelect(level.order)}
                            onHover={(h) => setHoveredOrder(h ? level.order : null)}
                        />
                    ))}

                    <Burst position={[0, 6, 0]} trigger={burst} color="#e0b54a" count={34} spread={3.5} />
                </>
            }
        >
            {/* Etasjeknapper som rad (også for trackpad) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LEVELS.map((level) => {
                    const isDone = correctOrder.includes(level.order);
                    const isExpected = level.order === nextExpected && !done;
                    const isWrong = wrongOrder === level.order;
                    return (
                        <button
                            key={level.order}
                            onClick={() => handleSelect(level.order)}
                            onMouseEnter={() => setHoveredOrder(level.order)}
                            onMouseLeave={() => setHoveredOrder(null)}
                            disabled={done || isDone}
                            className={`relative rounded-xl border-2 p-2.5 text-left transition group ${
                                isDone
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : isWrong
                                      ? 'bg-rose-50 border-rose-300 animate-pulse'
                                      : isExpected
                                        ? 'bg-amber-50 border-amber-300 hover:bg-amber-100'
                                        : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <span
                                    className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                        isDone
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-200 text-slate-600 group-hover:bg-amber-200'
                                    }`}
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : isWrong ? (
                                        <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    ) : (
                                        '?'
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800">{level.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500">
                                        {level.columnStyle}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Status og fakta */}
            <div className="mt-3">
                <AnimatePresence mode="wait">
                    {done ? (
                        <WinScreen
                            key="done"
                            title="Perfekt! Du har Colosseums hele byggrekkefølge."
                            onReplay={handleRetry}
                            onNext={handleFinish}
                        >
                            Hele monumentet sto ferdig i år 80 e.Kr - 50 000 tilskuere kunne ta plass.
                        </WinScreen>
                    ) : lastCorrectLevel ? (
                        <SceneFact key={lastCorrectLevel.order}>
                            <span className="font-bold text-amber-700">
                                {lastCorrectLevel.name} · {lastCorrectLevel.columnStyle}.
                            </span>{' '}
                            {lastCorrectLevel.fact}
                        </SceneFact>
                    ) : currentLevel ? (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/70 border border-amber-200 rounded-xl p-3 text-center text-xs text-slate-600 italic"
                        >
                            Hvilken etasje ble bygd{' '}
                            {nextExpected === 1 ? 'som den første' : `som nummer ${nextExpected}`}? Klikk
                            etasjen direkte på modellen eller i listen.
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </MicroGameScaffold>
    );
};

// 3D-MESH PR. ETASJE - Interactive håndterer klikk/hover/cursor; ringRef beholder
// puls (korrekt) og risting (feil).

interface ColosseumLevelProps {
    level: Level;
    state: 'idle' | 'hover' | 'correct' | 'wrong';
    onSelect: () => void;
    onHover: (hovering: boolean) => void;
}

// Antall buegang-fag per etasje. Ekte Colosseum har 80; 14 gir lesbare buer på
// 1366x768 uten å drukne scenen i mesh.
const BAYS = 14;

// Ett buegang-fag som ETT ekstrudert panel med hull. Poenget: hullet er en ekte
// åpning, så eleven ser gjennom buene og kjenner igjen Colosseum. Tidligere var
// «buegangene» massive bokser klistret på en heltett sylinder, og bygget leste
// som en tønne med ribber.
function makeArchBay(radius: number, height: number, thickness: number) {
    const w = 2 * radius * Math.sin(Math.PI / BAYS); // kordelengde for ett fag
    const pier = w * 0.26; // pilarbredde på hver side
    const plinth = height * 0.07; // sokkel under åpningen
    const entabl = height * 0.2; // gesims/bjelkelag over buen
    const openW = Math.max(w - 2 * pier, w * 0.3);
    let archR = openW / 2;
    const avail = height - plinth - entabl;
    // Buen må få plass under gesimsen. Er den for høy, senk radien.
    if (archR > avail * 0.75) archR = avail * 0.75;
    const springY = plinth + Math.max(avail - archR, height * 0.06);

    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0);
    shape.lineTo(w / 2, 0);
    shape.lineTo(w / 2, height);
    shape.lineTo(-w / 2, height);
    shape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-archR, plinth);
    hole.lineTo(-archR, springY);
    hole.absarc(0, springY, archR, Math.PI, 0, true); // over buetoppen
    hole.lineTo(archR, plinth);
    hole.closePath();
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: false,
        curveSegments: 10,
    });
    // Ekstruderingen går langs +Z fra z=0; sentrer den om panelets plan.
    geo.translate(0, 0, -thickness / 2);
    return { geo, w, pier };
}

const ColosseumLevel: React.FC<ColosseumLevelProps> = ({ level, state, onSelect, onHover }) => {
    const ringRef = useRef<THREE.Group>(null);

    // Travertin-toner: mørkere nedover, som på originalen der de nederste
    // etasjene er mest værbitt. Gir også etasjeskille eleven kan se.
    const baseColor =
        level.order === 1
            ? '#cdb083'
            : level.order === 2
              ? '#d6bb90'
              : level.order === 3
                ? '#dfc79d'
                : '#c9a875';

    const color =
        state === 'correct'
            ? '#34d399'
            : state === 'wrong'
              ? '#fb7185'
              : state === 'hover'
                ? '#fcd34d'
                : baseColor;

    const emissive = state === 'correct' ? '#10b981' : state === 'hover' ? '#f59e0b' : '#000000';
    const emissiveIntensity = state === 'correct' ? 0.25 : state === 'hover' ? 0.15 : 0;

    useFrame(({ clock }) => {
        if (!ringRef.current) return;
        const t = clock.getElapsedTime();
        if (state === 'correct') {
            const scale = 1 + Math.sin(t * 6) * 0.012;
            ringRef.current.scale.set(scale, 1, scale);
            ringRef.current.position.x = 0;
        } else if (state === 'wrong') {
            ringRef.current.position.x = Math.sin(t * 30) * 0.04;
            ringRef.current.scale.set(1, 1, 1);
        } else {
            ringRef.current.position.x = 0;
            ringRef.current.scale.set(1, 1, 1);
        }
    });

    const isAttic = level.order === 4;
    const thickness = level.radiusOuter - level.radiusInner;
    // Apotem: avstand fra sentrum til fagets midtplan, slik at nabofag møtes
    // kant i kant på sirkelen.
    const apothem = level.radiusOuter * Math.cos(Math.PI / BAYS);

    const bay = React.useMemo(
        () => (isAttic ? null : makeArchBay(level.radiusOuter, level.height, thickness)),
        [isAttic, level.radiusOuter, level.height, thickness]
    );

    const angles = React.useMemo(
        () => Array.from({ length: BAYS }, (_, i) => (i / BAYS) * Math.PI * 2),
        []
    );

    return (
        <Interactive
            onSelect={onSelect}
            onHover={onHover}
            state={state}
            hoverScale={1}
            // level.y er etasjens BUNN, og geometrien nedenfor har bunn i y=0.
            // Tidligere ble en sentrert cylinderGeometry plassert her, så hele
            // bygget sto en halv etasjehøyde nedsunket i bakken.
            position={[0, level.y, 0]}
        >
            <group ref={ringRef}>
                {/* Usynlig klikkflate. Med ekte åpninger i buegangene ville
                    stråler ellers gå tvers gjennom etasjen og klikket miste. */}
                <mesh
                    position={[0, level.height / 2, 0]}
                    onPointerOver={undefined}
                    renderOrder={-1}
                >
                    <cylinderGeometry
                        args={[
                            level.radiusOuter + 0.06,
                            level.radiusOuter + 0.06,
                            level.height * 0.96,
                            20,
                            1,
                            true,
                        ]}
                    />
                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                </mesh>

                {isAttic ? (
                    <>
                        {/* Attika: massiv vegg uten åpne bueganger. */}
                        <mesh castShadow receiveShadow position={[0, level.height / 2, 0]}>
                            <cylinderGeometry
                                args={[
                                    level.radiusOuter,
                                    level.radiusOuter,
                                    level.height,
                                    BAYS * 2,
                                    1,
                                    true,
                                ]}
                            />
                            <meshStandardMaterial
                                color={color}
                                roughness={0.85}
                                emissive={emissive}
                                emissiveIntensity={emissiveIntensity}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                        {/* Pilastre, blindfelt og festebraketter for velariet
                            (soltaket). Uten blindfeltene leste attikaen som en
                            glatt sylinder med pinner, tydelig grovere enn
                            etasjene under. */}
                        {angles.map((a, i) => (
                            <group key={i} rotation={[0, -a, 0]}>
                                {/* Pilaster - attikaens flate motsvar til søylene under */}
                                <mesh position={[apothem + 0.03, level.height / 2, 0]} castShadow>
                                    <boxGeometry args={[0.1, level.height * 0.78, 0.2]} />
                                    <meshStandardMaterial color="#e8d5ab" roughness={0.85} />
                                </mesh>
                                {/* Blindfelt/vindusåpning midt mellom pilastrene */}
                                <mesh
                                    position={[
                                        apothem + 0.02,
                                        level.height * 0.56,
                                        (2 * apothem * Math.tan(Math.PI / BAYS)) / 2,
                                    ]}
                                >
                                    <boxGeometry args={[0.05, level.height * 0.34, 0.34]} />
                                    <meshStandardMaterial color="#9c7e51" roughness={0.95} />
                                </mesh>
                                <mesh position={[apothem, level.height + 0.16, 0]} castShadow>
                                    <boxGeometry args={[0.07, 0.32, 0.07]} />
                                    <meshStandardMaterial color="#8d7145" roughness={0.8} />
                                </mesh>
                            </group>
                        ))}
                    </>
                ) : (
                    angles.map((a, i) => (
                        <group key={i} rotation={[0, -a, 0]}>
                            {/* Buegang-fag. Panelet står i XY, så det må roteres
                                90° om Y for å vende utover fra sentrum. */}
                            <mesh
                                geometry={bay!.geo}
                                position={[apothem, 0, 0]}
                                rotation={[0, Math.PI / 2, 0]}
                                castShadow
                                receiveShadow
                            >
                                <meshStandardMaterial
                                    color={color}
                                    roughness={0.85}
                                    emissive={emissive}
                                    emissiveIntensity={emissiveIntensity}
                                    side={THREE.DoubleSide}
                                />
                            </mesh>
                            {/* Halvsøyle med etasjens EGEN søylestil. Dette er
                                læringsinnholdet - før var alle etasjer like bokser,
                                så dorisk/jonisk/korintisk fantes bare i teksten. */}
                            <ColumnOrder
                                order={level.order}
                                height={level.height}
                                x={apothem + thickness / 2}
                                z={bay!.w / 2}
                            />
                        </group>
                    ))
                )}

                {/* Gesims mellom etasjene. Torus ligger i XY-planet, må roteres
                    om X for å ligge vannrett. */}
                <mesh position={[0, level.height - 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[level.radiusOuter + 0.05, 0.07, 6, BAYS * 3]} />
                    <meshStandardMaterial color="#9c7e51" roughness={0.7} />
                </mesh>
            </group>
        </Interactive>
    );
};

// Halvsøyle + kapitél. Hver etasje får sin ekte søyleorden, så eleven kan SE
// forskjellen som spillet spør om - ikke bare lese den i knappeteksten.
//
// Kapitélene er bevisst OVERDREVET store. Ved 1366x768 og kamera på ~14 enheters
// avstand blir en arkeologisk korrekt volutt 10 px og forsvinner; da er hele
// poenget med spillet borte. Dette er et læringsobjekt, ikke en oppmålingstegning.
const ColumnOrder: React.FC<{ order: number; height: number; x: number; z: number }> = ({
    order,
    height,
    x,
    z,
}) => {
    const shaftH = height * 0.66;
    // Dorisk er kraftigst, korintisk slankest - slik ordenene faktisk utvikler seg.
    const r = order === 1 ? 0.13 : order === 2 ? 0.105 : 0.088;
    const capY = shaftH + 0.02;
    // Lysere enn veggen, så kapitél-silhuetten leses mot travertinen.
    const stone = '#f3e6c8';
    return (
        <group position={[x, 0, z]}>
            {/* Base (dorisk hadde ingen - det er en av kjennetegnene) */}
            {order > 1 && (
                <mesh position={[0, 0.05, 0]} castShadow>
                    <cylinderGeometry args={[r * 1.5, r * 1.7, 0.1, 10]} />
                    <meshStandardMaterial color={stone} roughness={0.8} />
                </mesh>
            )}
            <mesh position={[0, shaftH / 2, 0]} castShadow>
                <cylinderGeometry args={[r * 0.88, r, shaftH, 12]} />
                <meshStandardMaterial color={stone} roughness={0.8} />
            </mesh>
            {order === 1 && (
                /* Dorisk: naken, bred firkantet abakus. Ingen base, ingen pynt. */
                <>
                    <mesh position={[0, capY + 0.03, 0]} castShadow>
                        <cylinderGeometry args={[r * 1.7, r * 1.05, 0.1, 12]} />
                        <meshStandardMaterial color={stone} roughness={0.85} />
                    </mesh>
                    <mesh position={[0, capY + 0.13, 0]} castShadow>
                        <boxGeometry args={[r * 3.6, 0.1, r * 3.6]} />
                        <meshStandardMaterial color={stone} roughness={0.85} />
                    </mesh>
                </>
            )}
            {order === 2 && (
                /* Jonisk: to store voluttruller som stikker tydelig ut til sidene. */
                <group position={[0, capY + 0.08, 0]}>
                    {[-1, 1].map((s) => (
                        <mesh
                            key={s}
                            position={[0, 0, s * r * 1.5]}
                            rotation={[0, 0, Math.PI / 2]}
                            castShadow
                        >
                            <torusGeometry args={[0.095, 0.042, 8, 14]} />
                            <meshStandardMaterial color={stone} roughness={0.8} />
                        </mesh>
                    ))}
                    <mesh position={[0, 0.09, 0]} castShadow>
                        <boxGeometry args={[r * 2.2, 0.06, r * 4.2]} />
                        <meshStandardMaterial color={stone} roughness={0.85} />
                    </mesh>
                </group>
            )}
            {order === 3 && (
                /* Korintisk: høy, kraftig utoverflarende akantuskurv. */
                <>
                    <mesh position={[0, capY + 0.12, 0]} castShadow>
                        <cylinderGeometry args={[r * 3.0, r * 0.95, 0.26, 12]} />
                        <meshStandardMaterial color={stone} roughness={0.75} />
                    </mesh>
                    <mesh position={[0, capY + 0.27, 0]} castShadow>
                        <boxGeometry args={[r * 3.4, 0.06, r * 3.4]} />
                        <meshStandardMaterial color={stone} roughness={0.85} />
                    </mesh>
                </>
            )}
        </group>
    );
};

export default Colosseum3D;
