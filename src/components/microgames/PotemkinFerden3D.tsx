import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
    MicroGameScaffold,
    PovCamera,
    Interactive,
    Shoreline,
    Building,
    Tree,
    Smoke,
    Person,
    Hill,
    FlatRing,
    SceneBanner,
    SceneBadge,
    DataReadout,
    WinScreen,
    LoseScreen,
    ScreenFlash,
    microSfx,
} from './kit';
import type { MicroGameProps } from './types';

// Legenden om potemkinkulissene: Katarina 2. seiler nedover Dnepr i 1787, og
// landsby etter landsby glir forbi på bredden. Noen er ekte. Noen er bare
// malte plater som er reist for å bli sett fra elva.
//
// Lyspære-øyeblikket: en fasade holder bare fra ÉN vinkel. Eleven må vente til
// landsbyen kommer nær nok til at synsvinkelen åpner seg, og bestemme seg før
// den glir forbi. Å dømme noe ut fra ett eneste ståsted er å la seg lure.

// Landsbyene kommer i denne rekkefølgen. fake = kulisser.
const VILLAGES: { fake: boolean }[] = [
    { fake: false },
    { fake: true },
    { fake: false },
    { fake: true },
    { fake: true },
];
const FAKE_COUNT = VILLAGES.filter((v) => v.fake).length;

const SLOTS = 3;
const START_Z = -31;
const EXIT_Z = 2;
const SPACING = (EXIT_Z - START_Z) / SLOTS; // holder avstanden lik ved gjenbruk
const SPEED = 1.35; // enheter per sekund - rolig elvefart
const BANK_X = -6; // landsbyenes x på vestbredden
const JUDGE_FROM = -13; // først her er du nær nok til å se dybden
const MAX_MISTAKES = 2;

const HOUSE_Z = [-2.6, 0, 2.6];
const BODY_COLORS = ['#c9b28a', '#d8c39b', '#bfa87e'];
const ROOF_COLOR = '#7c4a33';

// Startoppsett: alle tre slotene er fylt, så elva ser bebodd ut fra første
// bilde. Slotten nærmest båten viser den første landsbyen i rekka.
const INITIAL_VILLAGE = [2, 1, 0];
const INITIAL_NEXT = 3;

// Ett hus sett fra elva. Et ekte hus har dybde. En kulisse er en malt plate med
// samme front og samme tak, men ingenting bak - bare to skråstivere.
function House({ fake, index }: { fake: boolean; index: number }) {
    const body = BODY_COLORS[index % BODY_COLORS.length];
    if (!fake) {
        return (
            <Building
                position={[0, 0, HOUSE_Z[index]]}
                body={body}
                roof={ROOF_COLOR}
                w={2.6}
                h={1.6}
                d={2.2}
            />
        );
    }
    return (
        <group position={[0, 0, HOUSE_Z[index]]}>
            {/* Selve plata: tynn i x, full front mot elva */}
            <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.18, 1.6, 2.2]} />
                <meshStandardMaterial color={body} roughness={0.9} />
            </mesh>
            {/* Samme tak som et ekte hus - derfor ser fronten helt riktig ut */}
            <mesh position={[0, 1.92, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <coneGeometry args={[2.13, 0.64, 4]} />
                <meshStandardMaterial color={ROOF_COLOR} roughness={0.9} />
            </mesh>
            {/* Stillaset bak plata - synes først når vinkelen åpner seg */}
            {[-0.75, 0.75].map((z) => (
                <mesh key={z} position={[-0.72, 0.8, z]} rotation={[0, 0, 0.62]} castShadow>
                    <cylinderGeometry args={[0.1, 0.1, 2.1, 6]} />
                    <meshStandardMaterial color="#4a3722" roughness={1} />
                </mesh>
            ))}
            {/* Tverrbjelke som holder plata oppe */}
            <mesh position={[-0.5, 1.25, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 2.1, 6]} />
                <meshStandardMaterial color="#4a3722" roughness={1} />
            </mesh>
        </group>
    );
}

// En landsby på bredden. Røyk og folk står utenfor BÅDE de ekte og de falske,
// akkurat som i legenden, der Potemkin flyttet folk og fe langs elva. Det
// eneste som skiller dem, er om husene har noe bak fasaden.
function Village({
    fake,
    accused,
    active,
}: {
    fake: boolean;
    accused: boolean;
    active: boolean;
}) {
    return (
        <group>
            {HOUSE_Z.map((z, i) => (
                <House key={z} fake={fake} index={i} />
            ))}
            {HOUSE_Z.map((z) => (
                <Smoke key={z} origin={[0, 2.5, z]} count={3} color="#c8c2b6" />
            ))}
            <Person
                position={[1.9, 0, -1.3]}
                rotation={[0, Math.PI / 2, 0]}
                body="#8a6a4a"
                pose="idle"
            />
            <Person
                position={[2.2, 0, 1.2]}
                rotation={[0, Math.PI / 2, 0]}
                body="#6d7a55"
                pose="idle"
                hat="cap"
            />
            <Tree position={[-2.0, 0, -4.2]} seed={1} />
            <Tree position={[-2.6, 0, 4.2]} seed={5} />
            {/* Markør i graset: amber = landsbyen du bedømmer nå, rød = ropt ut */}
            {(accused || active) && (
                <FlatRing
                    position={[1.2, 0.05, 0]}
                    radius={2.6}
                    tube={accused ? 0.14 : 0.09}
                    color={accused ? '#e11d48' : '#f59e0b'}
                />
            )}
        </group>
    );
}

interface SlotState {
    village: number; // indeks i VILLAGES, -1 = tom
    accused: boolean;
}

const makeSlots = (): SlotState[] =>
    INITIAL_VILLAGE.map((v) => ({ village: v, accused: false }));

function RiverScene({
    playing,
    slots,
    activeSlot,
    onAccuse,
    onPassed,
    onActive,
}: {
    playing: boolean;
    slots: SlotState[];
    activeSlot: number | null;
    onAccuse: (slot: number) => void;
    onPassed: (slot: number) => void;
    onActive: (slot: number | null) => void;
}) {
    const groups = useRef<(THREE.Group | null)[]>([]);
    const zRef = useRef<number[]>(Array.from({ length: SLOTS }, (_, i) => START_Z + i * SPACING));
    const activeRef = useRef<number | null>(null);

    useFrame((_, dt) => {
        const step = playing ? SPEED * Math.min(dt, 0.05) : 0;
        let best: number | null = null;
        let bestZ = -Infinity;
        for (let i = 0; i < SLOTS; i++) {
            let z = zRef.current[i] + step;
            if (z > EXIT_Z) {
                z -= SLOTS * SPACING;
                onPassed(i);
            }
            zRef.current[i] = z;
            const g = groups.current[i];
            if (g) g.position.z = z;
            const live = slots[i] && slots[i].village >= 0;
            if (live && z >= JUDGE_FROM && z <= EXIT_Z && z > bestZ) {
                bestZ = z;
                best = i;
            }
        }
        if (best !== activeRef.current) {
            activeRef.current = best;
            onActive(best);
            // DEV-luke for selvspill/balansetesting - samme fasit som eleven
            // kan lese ut av scenen hvis hen ser godt etter.
            if (import.meta.env.DEV) {
                const v = best !== null ? slots[best].village : -1;
                (window as unknown as Record<string, unknown>).__potemkinDebug = {
                    activeSlot: best,
                    activeVillage: v,
                    fake: v >= 0 ? VILLAGES[v].fake : null,
                };
            }
        }
    });

    return (
        <>
            <PovCamera position={[2.5, 2.2, 7]} lookAt={[-5, 1.2, -3]} sway={0.035} />
            <Shoreline
                splitX={-3}
                size={[44, 74]}
                waterY={0.04}
                landColor="#7f9a55"
                seaColor="#4b86a8"
            />
            {/* Åser i det fjerne. Ren bakgrunnsdekor - holdes utenfor scene-revisjonen. */}
            <group userData={{ sceneAuditIgnore: true }}>
                {[-30, -16, -2, 12].map((z, i) => (
                    <Hill
                        key={z}
                        position={[-17 - (i % 2) * 3, -0.6, z]}
                        radius={7}
                        height={3.4}
                        color={i % 2 ? '#6d854c' : '#78905a'}
                        seed={i + 2}
                    />
                ))}
            </group>
            {slots.map((s, i) => (
                <group
                    key={i}
                    ref={(el) => {
                        groups.current[i] = el;
                    }}
                    position={[BANK_X, 0, START_Z + i * SPACING]}
                    visible={s.village >= 0}
                >
                    <Interactive
                        disabled={!playing || s.village < 0 || s.accused}
                        onSelect={() => onAccuse(i)}
                        hitArea={[5, 4, 9]}
                        hoverScale={1.02}
                        sound={null}
                    >
                        <Village
                            fake={s.village >= 0 ? VILLAGES[s.village].fake : false}
                            accused={s.accused}
                            active={playing && activeSlot === i}
                        />
                    </Interactive>
                </group>
            ))}
        </>
    );
}

const PotemkinFerden3D: React.FC<MicroGameProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
    const [attempt, setAttempt] = useState(0);
    const [slots, setSlots] = useState<SlotState[]>(makeSlots);
    const [hits, setHits] = useState(0);
    const [mistakes, setMistakes] = useState(0);
    const [active, setActive] = useState<number | null>(null);
    const [banner, setBanner] = useState<string | null>(null);
    const [flash, setFlash] = useState(0);

    // Fasit-tilstanden lever i refs, så useFrame-callbackene alltid leser noe
    // ferskt og aldri dobbelt-teller under Reacts strict-mode-dobbeltkjøring.
    const slotsRef = useRef<SlotState[]>(makeSlots());
    const nextRef = useRef(INITIAL_NEXT);
    const judgedRef = useRef(0);
    const missRef = useRef(0);
    const hitRef = useRef(0);

    const start = useCallback(() => {
        slotsRef.current = makeSlots();
        nextRef.current = INITIAL_NEXT;
        judgedRef.current = 0;
        missRef.current = 0;
        hitRef.current = 0;
        setSlots(slotsRef.current);
        setHits(0);
        setMistakes(0);
        setActive(null);
        setFlash(0);
        setBanner('Se etter husene som ikke har noe bak seg. Klikk landsbyen for å rope ut kulissene.');
        setAttempt((a) => a + 1);
        setPhase('playing');
    }, []);

    const accuse = useCallback((slot: number) => {
        const s = slotsRef.current[slot];
        if (!s || s.village < 0 || s.accused) return;
        slotsRef.current = slotsRef.current.map((v, i) =>
            i === slot ? { ...v, accused: true } : v
        );
        setSlots(slotsRef.current);
        microSfx.play('select');
    }, []);

    // En landsby har glidd forbi kameraet: nå gjøres regnskapet opp, og slotten
    // fylles med neste landsby i rekka.
    const passed = useCallback((slot: number) => {
        const s = slotsRef.current[slot];
        if (!s) return;
        if (s.village >= 0) {
            const wasFake = VILLAGES[s.village].fake;
            if (wasFake === s.accused) {
                if (wasFake) {
                    hitRef.current += 1;
                    setHits(hitRef.current);
                }
                setBanner(
                    wasFake
                        ? 'Riktig. Bak plankene var det bare skråstivere og gress.'
                        : 'Riktig. Den landsbyen var ekte.'
                );
                microSfx.play('correct');
            } else {
                missRef.current += 1;
                setMistakes(missRef.current);
                setFlash((f) => f + 1);
                setBanner(
                    wasFake
                        ? 'Du seilte forbi en kulisse. Keiserinnen så det hun ville se.'
                        : 'Du ropte ut en ekte landsby. Her bodde det folk.'
                );
                microSfx.play('incorrect');
            }
            judgedRef.current += 1;
        }
        const nv = nextRef.current;
        nextRef.current += 1;
        slotsRef.current = slotsRef.current.map((v, i) =>
            i === slot ? { village: nv % VILLAGES.length, accused: false } : v
        );
        setSlots(slotsRef.current);

        if (missRef.current >= MAX_MISTAKES) setPhase('lost');
        else if (judgedRef.current >= VILLAGES.length) setPhase('won');
    }, []);

    const score = Math.max(0.4, 1 - mistakes * 0.25);

    const overlays = useMemo(
        () => (
            <>
                <SceneBanner message={banner} wide />
                <ScreenFlash trigger={flash} preset="damage" durationMs={220} />
                {phase === 'playing' && (
                    <DataReadout
                        corner="bl"
                        items={[
                            { label: 'Avslørt', value: `${hits}/${FAKE_COUNT}` },
                            { label: 'Bomma', value: `${mistakes}/${MAX_MISTAKES}` },
                        ]}
                    />
                )}
                <SceneBadge corner="br">Dnepr, 1787</SceneBadge>
                {/* Rekka på keiserinnens lystbåt - du står om bord */}
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0"
                    style={{
                        height: '12%',
                        background:
                            'linear-gradient(to top, rgba(92,63,38,0.96) 0%, rgba(92,63,38,0.88) 60%, rgba(92,63,38,0) 100%)',
                    }}
                />
            </>
        ),
        [banner, flash, phase, hits, mistakes]
    );

    return (
        <MicroGameScaffold
            title="Ferden nedover Dnepr"
            subtitle="Legenden sier at Potemkin stilte opp falske landsbyer langs elva. Klarer du å se hvilke som bare er kulisser?"
            estimatedSeconds={120}
            onRetry={phase !== 'idle' ? start : undefined}
            canvas={{
                controls: false,
                camera: { position: [2.5, 2.2, 7] as [number, number, number], fov: 58 },
                background: '#cfe4f0',
                fog: { color: '#cfe4f0', near: 30, far: 74 },
                light: 'golden',
            }}
            containerClassName="bg-gradient-to-b from-[#cfe4f0] via-[#e2ecec] to-[#dfd6b8]"
            overlays={overlays}
            scene={
                <RiverScene
                    key={attempt}
                    playing={phase === 'playing'}
                    slots={slots}
                    activeSlot={active}
                    onAccuse={accuse}
                    onPassed={passed}
                    onActive={setActive}
                />
            }
        >
            {phase === 'idle' && (
                <div className="text-center py-1">
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed max-w-xl mx-auto">
                        Du står på dekket av keiserinnens båt. Fem landsbyer glir forbi på
                        vestbredden. Tre av dem er bare malte plater som er reist for å bli sett fra
                        elva. Vent til en landsby kommer nær nok til at du ser den fra siden, og
                        klikk på den hvis du mener det er kulisser.
                    </p>
                    <button
                        onClick={start}
                        className="px-5 py-2.5 bg-amber-700 text-white rounded-xl text-sm font-bold hover:bg-amber-800 transition shadow"
                    >
                        Legg fra land
                    </button>
                </div>
            )}

            {phase === 'playing' && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => {
                            if (active !== null) accuse(active);
                        }}
                        disabled={active === null}
                        className="px-5 py-2.5 bg-rose-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold hover:bg-rose-700 transition shadow"
                    >
                        Rop ut: dette er kulisser!
                    </button>
                    <p className="text-xs text-slate-500 max-w-sm text-center leading-relaxed">
                        Du kan også klikke rett på landsbyen i bildet. Sier du ingenting, seiler du
                        videre og godtar det du så.
                    </p>
                </div>
            )}

            {phase === 'lost' && (
                <LoseScreen title="Keiserinnen så det hun ville se" onRetry={start}>
                    Du bomma to ganger. Det er slik en fasade virker: den er laget for å bli sett fra
                    ett bestemt sted, i ett bestemt øyeblikk. Prøv igjen, og vent til landsbyen er så
                    nær at du ser den fra siden.
                </LoseScreen>
            )}

            {phase === 'won' && (
                <WinScreen
                    title={
                        mistakes === 0 ? 'Du avslørte alle kulissene!' : 'Du kom deg gjennom ferden'
                    }
                    onReplay={start}
                    onNext={() => onComplete({ score, completed: true })}
                >
                    Historikerne tror ikke at Potemkin faktisk bygde falske landsbyer. Historien ble
                    spredt av folk som ville sverte ham, og området var allerede bygd ut. Men
                    uttrykket potemkinkulisser lever videre, fordi det treffer noe sant om Katarinas
                    Russland: en praktfull fasade utenpå, og livegne bønder innenfor.
                </WinScreen>
            )}
        </MicroGameScaffold>
    );
};

export default PotemkinFerden3D;
