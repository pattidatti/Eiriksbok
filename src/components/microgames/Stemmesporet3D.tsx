import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { MicroGameProps } from './types';
import {
    MicroGameScaffold,
    GroundPlane,
    Building,
    Tree,
    MarketStall,
    Person,
    Mover,
    Interactive,
    Burst,
    useShake,
    useGameClock,
    useMeter,
    microSfx,
    THEMES,
    SceneBanner,
    DataReadout,
    DragHint,
    WinScreen,
    LoseScreen,
    TimerPill,
    MeterBar,
    ScreenFlash,
    DangerVignette,
    StepTracker,
} from './kit';

// Stemmesporet: rettslingvistikk som spill.
// Lyspære: ETT språktrekk deler mange. Det er KOMBINASJONEN av flere trekk som
// peker ut én bestemt person. Derfor er idiolekten din et slags fingeravtrykk.

const T = THEMES.modern;

interface Folk {
    id: string;
    setning: string;
    trekk: string[];
}

interface Runde {
    mal: string[];
    folk: Folk[];
}

const TREKK_FORKLARING: Record<string, string> = {
    æ: 'jeg',
    eg: 'jeg',
    ikkje: 'ikke',
    sjø: 'ja visst',
    atte: 'at',
    serr: 'seriøst',
    lissom: 'fyllord',
    dokker: 'dere',
};

const RUNDER: Runde[] = [
    {
        mal: ['æ', 'ikkje', 'lissom'],
        folk: [
            { id: 'r1a', setning: 'Æ veit ikkje, lissom.', trekk: ['æ', 'ikkje', 'lissom'] },
            { id: 'r1b', setning: 'Æ trur det, serr.', trekk: ['æ', 'serr'] },
            { id: 'r1c', setning: 'Eg veit ikkje heilt.', trekk: ['eg', 'ikkje'] },
            { id: 'r1d', setning: 'Det var lissom greit.', trekk: ['lissom'] },
            { id: 'r1e', setning: 'Æ kjem ikkje i dag.', trekk: ['æ', 'ikkje'] },
            { id: 'r1f', setning: 'Dokker må komme, sjø.', trekk: ['dokker', 'sjø'] },
        ],
    },
    {
        mal: ['eg', 'ikkje', 'sjø'],
        folk: [
            { id: 'r2a', setning: 'Eg veit ikkje, sjø.', trekk: ['eg', 'ikkje', 'sjø'] },
            { id: 'r2b', setning: 'Eg trur ikkje det, serr.', trekk: ['eg', 'ikkje', 'serr'] },
            { id: 'r2c', setning: 'Han kjem ikkje, sjø.', trekk: ['ikkje', 'sjø'] },
            { id: 'r2d', setning: 'Eg må gå no, sjø.', trekk: ['eg', 'sjø'] },
            { id: 'r2e', setning: 'Æ veit ikkje, lissom.', trekk: ['æ', 'ikkje', 'lissom'] },
            { id: 'r2g', setning: 'Dokker er tidleg, lissom.', trekk: ['dokker', 'lissom'] },
        ],
    },
    {
        mal: ['æ', 'serr', 'atte'],
        folk: [
            { id: 'r3a', setning: 'Æ trudde serr atte du kom.', trekk: ['æ', 'serr', 'atte'] },
            { id: 'r3b', setning: 'Æ sa atte det var greit.', trekk: ['æ', 'atte'] },
            { id: 'r3c', setning: 'Han sa serr atte han kom.', trekk: ['serr', 'atte'] },
            { id: 'r3d', setning: 'Æ trur det, serr.', trekk: ['æ', 'serr'] },
            { id: 'r3g', setning: 'Det var serr rart, lissom.', trekk: ['serr', 'lissom'] },
            { id: 'r3h', setning: 'Dokker må vente, sjø.', trekk: ['dokker', 'sjø'] },
        ],
    },
];

const KROPPSFARGER = [
    '#2f6f8f',
    '#8a4b2a',
    '#4a6b3a',
    '#7a3b5a',
    '#5a5a8a',
    '#8a7a2a',
    '#3a7a6a',
    '#8a3a3a',
];
const HUDFARGER = ['#e0b98c', '#c98d5e', '#8a5a3a', '#f0d0ab'];

const treffer = (f: Folk, mal: string[]) => mal.every((m) => f.trekk.includes(m));

// Folk står spredt i to rader og småvandrer på sin egen lille plass. Da holder
// snakkeboblene seg fra hverandre og er lette å lese, samtidig som torget lever.
const KOLONNER = 3;

function bane(i: number, antall: number) {
    const rader = Math.max(1, Math.ceil(antall / KOLONNER));
    const kol = i % KOLONNER;
    const rad = Math.floor(i / KOLONNER);
    // Fast x-plass per kolonne: da holder snakkeboblene sin vannrette plass og
    // legger seg aldri oppå hverandre. Bevegelsen går i dybden i stedet.
    const x = -5 + kol * 5;
    const z = (rad - (rader - 1) / 2) * 4.4 - 0.5;
    const amp = 0.9;
    const motsatt = i % 2 === 1;
    const a: [number, number, number] = [x, 0, motsatt ? z + amp : z - amp];
    const b: [number, number, number] = [x, 0, motsatt ? z - amp : z + amp];
    return { a, b, fart: 0.34 + (i % 4) * 0.1 };
}

export default function Stemmesporet3D({ onComplete, onRetry }: MicroGameProps) {
    const [runde, setRunde] = useState(0);
    const [fase, setFase] = useState<'spiller' | 'vunnet' | 'tapt'>('spiller');
    const [funnet, setFunnet] = useState<string | null>(null);
    const [feilId, setFeilId] = useState<string | null>(null);
    const [treff, setTreff] = useState(0);
    const [forsok, setForsok] = useState(0);
    const [rist, setRist] = useState(0);
    const [glimt, setGlimt] = useState(0);
    const [jubel, setJubel] = useState(0);
    const [banner, setBanner] = useState<string | null>(
        'Finn den ene som bruker alle tre trekkene.'
    );
    const [rort, setRort] = useState(false);

    const timers = useRef<number[]>([]);
    const senere = useCallback((fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms);
        timers.current.push(id);
    }, []);
    useEffect(() => {
        const liste = timers.current;
        return () => {
            liste.forEach((t) => window.clearTimeout(t));
        };
    }, []);

    const klokke = useGameClock({
        seconds: 110,
        running: fase === 'spiller',
        onExpire: () => setFase('tapt'),
    });
    // Ingen drenering: måleren er en ren feiltellger. Tre bom = saken er tapt.
    const feilspor = useMeter({
        drainPerSecond: 0,
        overloadAt: 1,
        recoverTo: 0,
        onOverload: () => setFase('tapt'),
    });

    const aktiv = RUNDER[runde];

    const nullstill = useCallback(() => {
        timers.current.forEach((t) => window.clearTimeout(t));
        timers.current = [];
        setRunde(0);
        setFase('spiller');
        setFunnet(null);
        setFeilId(null);
        setTreff(0);
        setRort(false);
        setBanner('Finn den ene som bruker alle tre trekkene.');
        feilspor.reset();
        klokke.restart();
        setForsok((a) => a + 1);
        onRetry?.();
    }, [feilspor, klokke, onRetry]);

    const velg = (f: Folk) => {
        if (fase !== 'spiller' || funnet) return;
        setRort(true);
        if (treffer(f, aktiv.mal)) {
            setFunnet(f.id);
            setTreff((t) => t + 1);
            setJubel((j) => j + 1);
            microSfx.play('correct');
            setBanner('Riktig. Alle tre trekkene satt i samme munn.');
            senere(() => {
                if (runde >= RUNDER.length - 1) {
                    setFase('vunnet');
                    setBanner(null);
                    onComplete({ score: 1, completed: true });
                } else {
                    setRunde((r) => r + 1);
                    setFunnet(null);
                    setBanner('Nytt spor. Se etter alle tre trekkene igjen.');
                }
            }, 1400);
        } else {
            setFeilId(f.id);
            setRist((s) => s + 1);
            setGlimt((g) => g + 1);
            feilspor.add(0.34);
            microSfx.play('incorrect');
            setBanner('Feil spor. Den har ikke alle tre trekkene.');
            senere(() => setFeilId(null), 700);
        }
    };

    return (
        <MicroGameScaffold
            title="Stemmesporet"
            subtitle="Én stemme i mengden bruker akkurat de tre trekkene du leter etter. Finn den."
            estimatedSeconds={150}
            onRetry={nullstill}
            scene={
                <Torget
                    key={`${forsok}-${runde}`}
                    folk={aktiv.folk}
                    funnet={funnet}
                    feilId={feilId}
                    laast={fase !== 'spiller' || funnet !== null}
                    onVelg={velg}
                    rist={rist}
                    jubel={jubel}
                />
            }
            canvas={{
                camera: { position: [0, 8.5, 13.5], fov: 44 },
                target: [0, 1.8, -0.8],
                background: '#dce6ec',
                fog: { color: '#dce6ec', near: 26, far: 46 },
                light: 'day',
                idle: false,
            }}
            overlays={
                <>
                    <SceneBanner message={banner} wide />
                    <DataReadout
                        corner="bl"
                        items={[{ label: 'Spor funnet', value: `${treff}/${RUNDER.length}` }]}
                    />
                    <TimerPill
                        seconds={klokke.remaining}
                        label="Tid"
                        warnBelow={20}
                        corner="br"
                    />
                    <DragHint show={!rort && fase === 'spiller'} corner="bc">
                        Klikk personen som sier alle tre
                    </DragHint>
                    <ScreenFlash trigger={glimt} preset="damage" durationMs={160} />
                    <DangerVignette level={feilspor.value} />
                </>
            }
        >
            <div className="space-y-3">
                <div className="bg-white border border-amber-200 rounded-xl p-3">
                    <div className="flex items-start gap-2 mb-2">
                        <Search className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-slate-700">
                            Du leter etter en som bruker alle disse tre:
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {aktiv.mal.map((m) => (
                            <motion.span
                                key={m}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-sm font-bold"
                            >
                                «{m}»
                                <span className="ml-1.5 font-normal text-amber-700 text-xs">
                                    = {TREKK_FORKLARING[m]}
                                </span>
                            </motion.span>
                        ))}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <MeterBar
                        value={feilspor.value}
                        label="Feilspor"
                        hint="Tre feil pekefingre, og saken er tapt."
                        warnAt={0.6}
                        dangerAt={0.9}
                        labels={{ normal: 'Rolig', warn: 'Usikkert', danger: 'SAKEN RYKER!' }}
                    />
                    <StepTracker current={runde + 1} total={RUNDER.length} />
                </div>

                {fase === 'vunnet' && (
                    <WinScreen title="Alle tre sporene funnet." onReplay={nullstill}>
                        Ett trekk alene deler tusenvis av folk. Det var først da tre trekk møttes i
                        samme munn at du kunne peke ut én person. Slik virker idiolekten din også:
                        summen av alle småvalgene er ditt eget språklige fingeravtrykk.
                    </WinScreen>
                )}
                {fase === 'tapt' && (
                    <LoseScreen title="Sporet forsvant i mengden." onRetry={nullstill}>
                        {klokke.remaining <= 0
                            ? 'Tiden gikk ut. Les hele setningen før du peker, og let etter alle tre trekkene samtidig.'
                            : 'Du pekte ut noen som bare hadde ett eller to av trekkene. Ett trekk alene deler mange. Bare kombinasjonen peker på én person.'}
                    </LoseScreen>
                )}
            </div>
        </MicroGameScaffold>
    );
}

function Torget({
    folk,
    funnet,
    feilId,
    laast,
    onVelg,
    rist,
    jubel,
}: {
    folk: Folk[];
    funnet: string | null;
    feilId: string | null;
    laast: boolean;
    onVelg: (f: Folk) => void;
    rist: number;
    jubel: number;
}) {
    const { ref, shake } = useShake(0.18, 0.035, 2.4);
    useEffect(() => {
        if (rist > 0) shake(0.7);
    }, [rist, shake]);

    return (
        <group ref={ref}>
            <GroundPlane size={34} depth={28} color="#b4ae9e" />
            {/* Husrekke i bakkant */}
            {[-9, -5.4, -1.8, 1.8, 5.4, 9].map((x, i) => (
                <Building
                    key={`hus-${x}`}
                    position={[x, 0, -8.2]}
                    w={2.6}
                    h={2.4}
                    d={2.2}
                    seed={i + 3}
                    body={i % 2 === 0 ? '#c9b394' : '#b08d72'}
                    roof="#6b4230"
                />
            ))}
            {/* Trær og boder langs kantene, utenfor gangbanene */}
            <Tree position={[-9.4, 0, -0.4]} leaf={T.leaf} seed={1} />
            <Tree position={[9.4, 0, -1.2]} leaf={T.leaf} seed={5} />
            <Tree position={[-8.6, 0, -5.4]} leaf={T.leaf} seed={9} />
            <Tree position={[8.6, 0, -5.4]} leaf={T.leaf} seed={12} />
            <MarketStall position={[-5.4, 0, 5.2]} rotation={[0, 0.4, 0]} />
            <MarketStall position={[5.4, 0, 5.2]} rotation={[0, -0.4, 0]} />

            {folk.map((f, i) => {
                const erFunnet = funnet === f.id;
                const erFeil = feilId === f.id;
                return (
                    <Gaaende key={f.id} indeks={i} antall={folk.length} frossen={erFunnet}>
                        <Interactive
                            onSelect={() => onVelg(f)}
                            disabled={laast && !erFunnet}
                            state={erFunnet ? 'correct' : erFeil ? 'wrong' : undefined}
                            sound={null}
                        >
                            <group>
                                {/* Romslig, usynlig gripeflate - trygg å treffe med styreflate */}
                                <mesh position={[0, 0.8, 0]}>
                                    <boxGeometry args={[1.4, 1.9, 1.1]} />
                                    <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                                </mesh>
                                <Person
                                    pose={erFunnet ? 'raise' : 'walk'}
                                    body={
                                        erFunnet
                                            ? '#10b981'
                                            : erFeil
                                              ? '#f43f5e'
                                              : KROPPSFARGER[i % KROPPSFARGER.length]
                                    }
                                    skin={HUDFARGER[i % HUDFARGER.length]}
                                    legs="#3a3630"
                                    scale={1.35}
                                    hat={i % 3 === 0 ? 'cap' : 'none'}
                                    hatColor={KROPPSFARGER[(i + 2) % KROPPSFARGER.length]}
                                />
                            </group>
                        </Interactive>
                        {/* Snakkeboblen hører til denne figuren og er selv et klikkmål */}
                        <Boble
                            tekst={f.setning}
                            tilstand={erFunnet ? 'riktig' : erFeil ? 'feil' : 'ro'}
                            laast={laast && !erFunnet}
                            onVelg={() => onVelg(f)}
                        />
                    </Gaaende>
                );
            })}

            <Burst position={[0, 2.2, 0]} trigger={jubel} color="#34d399" count={30} />
        </group>
    );
}

// Går fram og tilbake i sin egen bane. Snur ved endepunktet, så torget er
// levende hele tiden - eleven leter i en mengde som beveger seg.
function Gaaende({
    indeks,
    antall,
    frossen,
    children,
}: {
    indeks: number;
    antall: number;
    frossen: boolean;
    children: React.ReactNode;
}) {
    const b = useMemo(() => bane(indeks, antall), [indeks, antall]);
    const [snudd, setSnudd] = useState(false);
    return (
        <Mover
            from={snudd ? b.b : b.a}
            to={snudd ? b.a : b.b}
            speed={b.fart}
            state={frossen ? 'frozen' : 'moving'}
            phase={indeks}
            bob={0.06}
            onArrive={() => setSnudd((s) => !s)}
        >
            {children}
        </Mover>
    );
}

function Boble({
    tekst,
    tilstand,
    laast,
    onVelg,
}: {
    tekst: string;
    tilstand: 'ro' | 'riktig' | 'feil';
    laast: boolean;
    onVelg: () => void;
}) {
    const stil =
        tilstand === 'riktig'
            ? 'bg-emerald-500 text-white border-emerald-600'
            : tilstand === 'feil'
              ? 'bg-rose-500 text-white border-rose-600'
              : laast
              ? 'bg-white/95 text-slate-800 border-slate-300 opacity-75'
              : 'bg-white/95 text-slate-800 border-slate-300 hover:bg-amber-100 hover:border-amber-400';
    const kant =
        tilstand === 'riktig' ? '#059669' : tilstand === 'feil' ? '#e11d48' : 'rgba(203,213,225,1)';
    return (
        <Html center position={[0, 1.62, 0]} zIndexRange={[20, 0]}>
            <button
                type="button"
                disabled={laast}
                onClick={(e) => {
                    e.stopPropagation();
                    onVelg();
                }}
                className={`relative px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold whitespace-nowrap shadow select-none transition-colors ${
                    laast ? 'cursor-default' : 'cursor-pointer'
                } ${stil}`}
            >
                {tekst}
                {/* Liten hale ned mot figuren som sier det */}
                <span
                    className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-0 h-0"
                    style={{
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: `6px solid ${kant}`,
                    }}
                />
            </button>
        </Html>
    );
}
