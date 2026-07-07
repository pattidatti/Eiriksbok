import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TreePine, Play, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react';

interface RessurskollapsSimulatorProps {
    title?: string;
}

type Phase = 'idle' | 'running' | 'done';

// Ett år i modellen. Skogen fornyer seg selv, men bare i takt med hvor mye som
// står igjen: jo færre trær, jo færre frø. Hogger du mer enn skogen rekker å
// fornye, tømmes den - og forbi et vippepunkt kan den ikke redde seg selv.
interface YearState {
    year: number;
    forest: number; // 0-100, skogtetthet
    moai: number; // reiste statuer
    people: number; // folketall (proxy for hvor mange øya kan livnære)
}

const REGROWTH = 0.08; // skogen fornyer 8 % av det som står igjen, hvert år
const START_FOREST = 100;

function simulate(felling: number): YearState[] {
    const series: YearState[] = [];
    let forest = START_FOREST;
    let felledTotal = 0;
    for (let year = 0; year <= 100; year++) {
        const moai = Math.floor(felledTotal / 12);
        // Folketall følger skogen: uten trær blir det ingen kanoer, fisk eller ved.
        const people = Math.round(180 + 7.2 * forest);
        series.push({ year, forest: Math.max(0, forest), moai, people });
        // Neste år: fornying minus hogst. Kan bare hogge det som faktisk står.
        const regrowth = REGROWTH * forest;
        const actualFell = Math.min(felling, forest + regrowth);
        felledTotal += actualFell;
        forest = Math.min(100, Math.max(0, forest + regrowth - felling));
    }
    return series;
}

type Verdict = 'baerekraftig' | 'presset' | 'kollaps';

function verdictOf(finalForest: number): Verdict {
    if (finalForest >= 60) return 'baerekraftig';
    if (finalForest > 0) return 'presset';
    return 'kollaps';
}

export function RessurskollapsSimulator({
    title = 'Skogen på Påskeøya',
}: RessurskollapsSimulatorProps) {
    const [felling, setFelling] = useState(6);
    const [phase, setPhase] = useState<Phase>('idle');
    const [frame, setFrame] = useState<YearState>({
        year: 0,
        forest: START_FOREST,
        moai: 0,
        people: 900,
    });
    const [verdict, setVerdict] = useState<Verdict | null>(null);
    const timer = useRef<ReturnType<typeof setInterval> | null>(null);

    const stop = () => {
        if (timer.current) {
            clearInterval(timer.current);
            timer.current = null;
        }
    };

    useEffect(() => stop, []);

    const run = () => {
        stop();
        const series = simulate(felling);
        setPhase('running');
        setVerdict(null);
        let i = 0;
        timer.current = setInterval(() => {
            setFrame(series[i]);
            i++;
            if (i >= series.length) {
                stop();
                const last = series[series.length - 1];
                setVerdict(verdictOf(last.forest));
                setPhase('done');
            }
        }, 32);
    };

    const reset = () => {
        stop();
        setPhase('idle');
        setVerdict(null);
        setFrame({ year: 0, forest: START_FOREST, moai: 0, people: 900 });
    };

    // Fargen på skogsøylen speiler helsen: grønn -> gul -> brun.
    const forestColor =
        frame.forest >= 60 ? '#16a34a' : frame.forest >= 25 ? '#ca8a04' : '#b45309';

    // Live-forhåndsvisning av hva valget betyr, før eleven kjører.
    const preview =
        felling <= 8
            ? { label: 'Skogen rekker å fornye seg', tone: 'ok' as const }
            : felling <= 12
              ? { label: 'Du tar mer enn skogen klarer', tone: 'warn' as const }
              : { label: 'Langt over det skogen tåler', tone: 'bad' as const };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <TreePine className="w-5 h-5 text-emerald-600" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hvor mange trær øya hogger hvert år, og se hva som skjer på 100 år.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {/* Skogsøyle + tall */}
                <div className="flex items-end gap-5">
                    <div className="flex flex-col items-center">
                        <div className="relative w-20 h-44 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                            <motion.div
                                className="absolute bottom-0 left-0 right-0"
                                animate={{
                                    height: `${frame.forest}%`,
                                    backgroundColor: forestColor,
                                }}
                                transition={{ duration: 0.12, ease: 'linear' }}
                            />
                            {/* Vippepunkt-strek: der fornyingen ikke lenger holder tritt */}
                            <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-rose-400/70"
                                style={{ bottom: '25%' }}
                            />
                        </div>
                        <span className="mt-2 text-xs font-semibold text-slate-500">Skog</span>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                                År
                            </p>
                            <p className="text-2xl font-bold text-slate-800 tabular-nums">
                                {frame.year}
                            </p>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-amber-500 font-semibold">
                                Moai reist
                            </p>
                            <p className="text-2xl font-bold text-amber-700 tabular-nums">
                                {frame.moai}
                            </p>
                        </div>
                        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                            <p className="text-[11px] uppercase tracking-wide text-blue-500 font-semibold">
                                Folketall
                            </p>
                            <p className="text-2xl font-bold text-blue-700 tabular-nums">
                                {frame.people}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Slider */}
                <div className="mt-6">
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            Trær hogget hvert år
                        </label>
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                            {felling}
                        </span>
                    </div>
                    <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={felling}
                        disabled={phase === 'running'}
                        onChange={(e) => {
                            setFelling(Number(e.target.value));
                            if (phase === 'done') reset();
                        }}
                        className="w-full accent-emerald-600 disabled:opacity-50"
                    />
                    <div
                        className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                            preview.tone === 'ok'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : preview.tone === 'warn'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                    >
                        {preview.tone !== 'ok' && <TriangleAlert className="w-3.5 h-3.5" />}
                        {preview.label}
                    </div>
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-6 mb-4 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {verdict ? (
                        <motion.div
                            key={verdict}
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                verdict === 'baerekraftig'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : verdict === 'presset'
                                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                                      : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {verdict === 'baerekraftig' ? (
                                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                                ) : (
                                    <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                )}
                                <p className="leading-snug">
                                    {verdict === 'baerekraftig'
                                        ? 'Bærekraftig. Skogen holdt seg frisk i hundre år, og øya kunne livnære folket sitt. Men dere rakk å reise ganske få moai.'
                                        : verdict === 'presset'
                                          ? 'Presset. Skogen krympet år for år. Dere reiste flere moai, men øya er på vei mot stupet.'
                                          : 'Kollaps. Skogen er borte. Uten trær finnes det ingen kanoer til fiske, ingen ved og ingen tømmer. Folketallet stuper, og de mange moaiene står igjen på en naken øy.'}
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-400 italic px-1 pt-3"
                        >
                            Den røde streken er vippepunktet. Kommer skogen under den, klarer den
                            ikke lenger å hente seg inn.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={run}
                    disabled={phase === 'running'}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    <Play className="w-4 h-4" />
                    {phase === 'running' ? 'Kjører ...' : 'Kjør 100 år'}
                </button>
                <button
                    onClick={reset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
