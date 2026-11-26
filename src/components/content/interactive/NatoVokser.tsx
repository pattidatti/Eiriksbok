import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import { Shield, Play, RotateCcw, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react';
import { useAtlasWorld } from '../../atlas/useAtlasWorld';

interface NatoVokserProps {
    title?: string;
}

interface Wave {
    year: number;
    // Navn slik de står i public/data/world/countries-110m.json
    countries: string[];
    // Norske navn som vises for eleven
    labels: string[];
    note: string;
}

// Utvidelsene følger tabellen i Store norske leksikon (Hilde & Cooper, 2026).
const WAVES: Wave[] = [
    {
        year: 1949,
        countries: [
            'Belgium',
            'Canada',
            'Denmark',
            'Greenland',
            'France',
            'Iceland',
            'Italy',
            'Luxembourg',
            'Netherlands',
            'Norway',
            'Portugal',
            'United Kingdom',
            'United States of America',
        ],
        labels: [
            'Belgia',
            'Canada',
            'Danmark',
            'Frankrike',
            'Island',
            'Italia',
            'Luxembourg',
            'Nederland',
            'Norge',
            'Portugal',
            'Storbritannia',
            'USA',
        ],
        note: '12 land starter NATO 4. april 1949. Norge er ett av dem.',
    },
    {
        year: 1952,
        countries: ['Greece', 'Turkey'],
        labels: ['Hellas', 'Tyrkia'],
        note: 'NATO vokser mot sørøst.',
    },
    {
        year: 1955,
        countries: ['Germany'],
        labels: ['Vest-Tyskland'],
        note: 'Vest-Tyskland blir med. Etter 1990 er hele Tyskland med som ett land.',
    },
    {
        year: 1982,
        countries: ['Spain'],
        labels: ['Spania'],
        note: 'Spania blir medlem.',
    },
    {
        year: 1999,
        countries: ['Poland', 'Czechia', 'Hungary'],
        labels: ['Polen', 'Tsjekkia', 'Ungarn'],
        note: 'Tre land i Øst-Europa blir med.',
    },
    {
        year: 2004,
        countries: ['Bulgaria', 'Estonia', 'Latvia', 'Lithuania', 'Romania', 'Slovakia', 'Slovenia'],
        labels: ['Bulgaria', 'Estland', 'Latvia', 'Litauen', 'Romania', 'Slovakia', 'Slovenia'],
        note: 'Den største utvidelsen: sju land på én gang.',
    },
    {
        year: 2009,
        countries: ['Albania', 'Croatia'],
        labels: ['Albania', 'Kroatia'],
        note: 'To land på Balkan blir med.',
    },
    {
        year: 2017,
        countries: ['Montenegro'],
        labels: ['Montenegro'],
        note: 'Montenegro blir medlem.',
    },
    {
        year: 2020,
        countries: ['Macedonia'],
        labels: ['Nord-Makedonia'],
        note: 'Nord-Makedonia blir medlem nummer 30.',
    },
    {
        year: 2023,
        countries: ['Finland'],
        labels: ['Finland'],
        note: 'Finland søker etter at Russland angriper Ukraina i 2022, og blir medlem nummer 31.',
    },
    {
        year: 2024,
        countries: ['Sweden'],
        labels: ['Sverige'],
        note: 'Sverige gir opp over 200 år med nøytralitet. Nå er alle de fem nordiske landene med.',
    },
];

const NORDEN: { id: string; label: string }[] = [
    { id: 'Norway', label: 'Norge' },
    { id: 'Denmark', label: 'Danmark' },
    { id: 'Iceland', label: 'Island' },
    { id: 'Finland', label: 'Finland' },
    { id: 'Sweden', label: 'Sverige' },
];

const WIDTH = 800;
const HEIGHT = 460;
const LAST = WAVES.length - 1;

export function NatoVokser({ title = 'NATO vokser: fra 12 til 32 land' }: NatoVokserProps) {
    const { geographies, loading } = useAtlasWorld();
    const [step, setStep] = useState(0);
    const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
    const [playing, setPlaying] = useState(false);
    const timer = useRef<number | null>(null);

    const stopTimer = () => {
        if (timer.current !== null) window.clearTimeout(timer.current);
        timer.current = null;
    };
    useEffect(() => stopTimer, []);

    const wave = WAVES[step];
    const done = visited.size === WAVES.length;

    // Hvilket år ble hvert land med?
    const joinYear = useMemo(() => {
        const map = new Map<string, number>();
        WAVES.forEach((w) => w.countries.forEach((c) => map.set(c, w.year)));
        return map;
    }, []);

    const memberCount = useMemo(
        () => WAVES.slice(0, step + 1).reduce((sum, w) => sum + w.labels.length, 0),
        [step]
    );

    // Kartet er sentrert over Nord-Atlanteren, så både USA, Canada og Europa synes.
    const projection = useMemo(
        () =>
            geoAzimuthalEqualArea()
                .rotate([22, -54])
                .scale(470)
                .translate([WIDTH / 2, HEIGHT / 2 + 10]),
        []
    );
    const pathGen = useMemo(() => geoPath(projection), [projection]);

    const goTo = (i: number) => {
        const next = Math.max(0, Math.min(LAST, i));
        setStep(next);
        setVisited((prev) => {
            const s = new Set(prev);
            for (let k = 0; k <= next; k++) s.add(k);
            return s;
        });
    };

    const playAll = () => {
        if (playing) return;
        setPlaying(true);
        let i = step >= LAST ? 0 : step;
        goTo(i);
        const tick = () => {
            i += 1;
            if (i > LAST) {
                setPlaying(false);
                return;
            }
            goTo(i);
            timer.current = window.setTimeout(tick, 900);
        };
        timer.current = window.setTimeout(tick, 900);
    };

    const reset = () => {
        stopTimer();
        setPlaying(false);
        setStep(0);
        setVisited(new Set([0]));
    };

    const fillFor = (name: string) => {
        const y = joinYear.get(name);
        if (y === undefined) return name === 'Russia' ? '#cbd5e1' : '#e2e8f0';
        if (y > wave.year) return '#e2e8f0';
        if (y === wave.year) return '#f59e0b';
        return name === 'Norway' ? '#2563eb' : '#93c5fd';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk på årstallene eller «Spill av» og se hvem som blir med.
                    </p>
                </div>
            </div>

            {/* Årstall-knapper */}
            <div className="px-5 pt-3 flex flex-wrap gap-1.5">
                {WAVES.map((w, i) => {
                    const active = i === step;
                    const seen = visited.has(i);
                    return (
                        <motion.button
                            key={w.year}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => goTo(i)}
                            disabled={playing}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                active
                                    ? 'bg-amber-500 border-amber-500 text-white'
                                    : seen
                                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {w.year}
                        </motion.button>
                    );
                })}
            </div>

            {/* Kart + sidepanel */}
            <div className="p-5 grid gap-4 md:grid-cols-[1fr_220px]">
                <div className="relative rounded-xl border border-slate-200 bg-sky-50 overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                            Laster kart ...
                        </div>
                    )}
                    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto block">
                        {geographies.map((g, i) => {
                            const name = g.properties?.name ?? '';
                            const d = pathGen(g as never);
                            if (!d) return null;
                            return (
                                <motion.path
                                    key={`${name}-${i}`}
                                    d={d}
                                    initial={false}
                                    animate={{ fill: fillFor(name) }}
                                    transition={{ duration: 0.5 }}
                                    stroke="#ffffff"
                                    strokeWidth={0.6}
                                />
                            );
                        })}
                        {(() => {
                            const p = projection([10.75, 59.91]);
                            if (!p) return null;
                            return (
                                <g>
                                    <circle cx={p[0]} cy={p[1]} r={4} fill="#1e3a8a" />
                                    <text
                                        x={p[0] - 8}
                                        y={p[1] - 8}
                                        fontSize={13}
                                        fontWeight={700}
                                        fill="#1e3a8a"
                                        textAnchor="end"
                                        stroke="#ffffff"
                                        strokeWidth={3}
                                        paintOrder="stroke"
                                    >
                                        Norge
                                    </text>
                                </g>
                            );
                        })()}
                        {(() => {
                            const p = projection([38, 63]);
                            if (!p) return null;
                            return (
                                <text x={p[0]} y={p[1]} fontSize={14} fill="#64748b" fontWeight={600}>
                                    Russland
                                </text>
                            );
                        })()}
                    </svg>
                    <div className="absolute bottom-2 left-2 flex gap-3 bg-white/90 rounded-lg px-2 py-1 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Nye i år
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-sm bg-blue-300" /> Medlem
                        </span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                        <div className="text-xs text-slate-500">Medlemsland i {wave.year}</div>
                        <motion.div
                            key={memberCount}
                            initial={{ scale: 1.4, color: '#f59e0b' }}
                            animate={{ scale: 1, color: '#1e293b' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="text-4xl font-bold"
                        >
                            {memberCount}
                        </motion.div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-3">
                        <div className="text-xs font-semibold text-slate-500 mb-2">Norden i NATO</div>
                        <div className="flex flex-wrap gap-1.5">
                            {NORDEN.map((n) => {
                                const member = (joinYear.get(n.id) ?? 9999) <= wave.year;
                                return (
                                    <motion.span
                                        key={n.id}
                                        initial={false}
                                        animate={{ scale: member ? 1 : 0.95, opacity: member ? 1 : 0.55 }}
                                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                            member
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-dashed border-slate-300 text-slate-400'
                                        }`}
                                    >
                                        {n.label}
                                    </motion.span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid synlig */}
            <div className="px-5 pb-3">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={done && step === LAST ? 'done' : step}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            done && step === LAST
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {done && step === LAST ? (
                            <span className="flex items-start gap-2">
                                <motion.span
                                    initial={{ rotate: -20, scale: 0 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                                >
                                    <PartyPopper className="w-5 h-5" />
                                </motion.span>
                                <span>
                                    Du har sett hele veien: fra 12 land i 1949 til 32 i dag. Legg
                                    merke til de to siste hoppene. Finland og Sverige var utenfor i
                                    mange tiår, men søkte samme år som Russland angrep Ukraina.
                                    Når land føler seg truet, søker de sammen.
                                </span>
                            </span>
                        ) : (
                            <span>
                                <strong className="font-semibold">{wave.year}:</strong>{' '}
                                {wave.labels.join(', ')}. {wave.note}
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={playAll}
                        disabled={playing}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-full px-5 py-2 text-sm font-medium flex items-center gap-1.5"
                    >
                        <Play className="w-4 h-4" /> Spill av
                    </button>
                    <button
                        onClick={() => goTo(step - 1)}
                        disabled={playing || step === 0}
                        aria-label="Forrige år"
                        className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-full p-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => goTo(step + 1)}
                        disabled={playing || step === LAST}
                        aria-label="Neste år"
                        className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-full p-2"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <button
                    onClick={reset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
