import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Sparkles, RotateCcw, TrendingUp } from 'lucide-react';

// Lyspaere-oyeblikket: jo lenger unna hendelsen en kilde er skrevet, jo mer
// "vet" den om kong Arthur. Eleven klikker seg gjennom kildene i tidsrekkefolge
// og ser de to kurvene gaa hver sin vei: avstanden vokser, og detaljene vokser
// med den. Ekte kunnskap blir tynnere med avstand. Her blir den fetere.

interface LegendKilde {
    year: number;
    yearLabel: string;
    name: string;
    what: string;
    adds: string[];
}

interface LegendensVekstProps {
    title?: string;
    prompt?: string;
    baseYear?: number;
    baseLabel?: string;
    sources?: LegendKilde[];
    verdict?: string;
    verdictNote?: string;
}

const DEFAULT_SOURCES: LegendKilde[] = [
    {
        year: 540,
        yearLabel: 'ca. 540',
        name: 'Gildas',
        what: 'Gildas skriver om slaget ved Mons Badonicus rundt år 500. Han nevner ikke Arthur med ett ord.',
        adds: [],
    },
    {
        year: 830,
        yearLabel: 'ca. 830',
        name: 'Historia Brittonum',
        what: 'Her dukker navnet Arthur opp for aller første gang. Han er en hærfører som vinner tolv slag mot sakserne.',
        adds: ['Navnet Arthur', 'Tolv slag', 'Hærfører, ikke konge'],
    },
    {
        year: 970,
        yearLabel: 'ca. 970',
        name: 'Annales Cambriae',
        what: 'Den walisiske årboka setter årstall på Arthur: Badon i 516 og Camlann i 537, der Arthur og Medraut falt.',
        adds: ['Årstall: 516 og 537', 'Fienden Medraut', 'Arthurs død'],
    },
    {
        year: 1135,
        yearLabel: 'ca. 1135',
        name: 'Geoffrey of Monmouth',
        what: 'Geoffrey gjør Arthur til en mektig konge og fyller en hel bok med ham. Trollmannen Merlin kommer inn her.',
        adds: ['Arthur blir konge', 'Trollmannen Merlin', 'Et helt rike å styre'],
    },
    {
        year: 1180,
        yearLabel: 'ca. 1180',
        name: 'Chrétien de Troyes',
        what: 'De franske dikterne gjør Arthur til midtpunkt i høviske ridderfortellinger. Gralen dukker opp for første gang.',
        adds: ['Den hellige gral', 'Høviske riddere', 'Kjærlighet og æreskodeks'],
    },
    {
        year: 1485,
        yearLabel: '1485',
        name: 'Thomas Malory',
        what: 'Malory samler alt til den versjonen vi kjenner i dag. Det er denne Arthur filmer og spill henter fra.',
        adds: ['Én samlet fortelling', 'Versjonen vi kjenner i dag'],
    },
];

// Løpende sum av detaljer per kilde. Ren funksjon på modulnivå, slik at ingen
// variabel muteres under render.
function cumulative(sources: LegendKilde[]): number[] {
    return sources.map((_, i) =>
        sources.slice(0, i + 1).reduce((sum, s) => sum + s.adds.length, 0)
    );
}

export function LegendensVekst({
    title = 'Legenden vokser',
    prompt = 'Klikk kildene i rekkefølge og se hva hver av dem legger til.',
    baseYear = 500,
    baseLabel = 'Arthur skal ha levd rundt år 500',
    sources = DEFAULT_SOURCES,
    verdict = 'Jo lenger bort fra år 500 vi kommer, jo mer «vet» kildene.',
    verdictNote = 'Slik virker ikke ekte kunnskap. Et vitne som var der, vet mest. Her er det motsatt: den som er lengst unna, forteller mest. Det er kjennetegnet på en legende som vokser, ikke på ny kunnskap.',
}: LegendensVekstProps) {
    const [revealed, setRevealed] = useState(0);

    const totals = useMemo(() => cumulative(sources), [sources]);

    const maxDetails = totals[totals.length - 1] || 1;
    const lastYear = sources[sources.length - 1].year;
    const done = revealed >= sources.length;
    const current = revealed > 0 ? sources[revealed - 1] : null;
    const details = revealed > 0 ? totals[revealed - 1] : 0;
    const distance = current ? current.year - baseYear : 0;

    const chips = sources.slice(0, revealed).flatMap((s) => s.adds.map((a) => ({ a, y: s.year })));

    const px = (year: number) => 26 + ((year - baseYear) / (lastYear - baseYear)) * 282;
    const py = (n: number) => 104 - (n / maxDetails) * 84;

    const linePoints = sources
        .slice(0, revealed)
        .map((s, i) => `${px(s.year)},${py(totals[i])}`)
        .join(' ');

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{prompt}</p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {/* Venstre: kildene + kurven */}
                <div>
                    <div className="grid grid-cols-3 gap-2">
                        {sources.map((s, i) => {
                            const open = i < revealed;
                            const next = i === revealed;
                            return (
                                <motion.button
                                    key={s.name}
                                    onClick={() => next && setRevealed(i + 1)}
                                    disabled={!next}
                                    whileTap={next ? { scale: 0.95 } : undefined}
                                    animate={next ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                    transition={
                                        next
                                            ? { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
                                            : { duration: 0.2 }
                                    }
                                    className={`rounded-xl border px-2 py-2 text-left transition-colors ${
                                        open
                                            ? 'bg-indigo-50 border-indigo-200'
                                            : next
                                              ? 'bg-white border-indigo-300 shadow-sm cursor-pointer'
                                              : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="block text-[11px] font-bold text-indigo-600">
                                        {s.yearLabel}
                                    </span>
                                    <span className="block text-xs font-medium text-slate-700 leading-tight">
                                        {s.name}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-semibold text-slate-600">
                                Detaljer i fortellingen, år for år
                            </span>
                        </div>
                        <svg viewBox="0 0 320 120" className="w-full h-auto" role="img">
                            <title>Kurve over hvor mange detaljer kildene gir om Arthur</title>
                            <line
                                x1="26"
                                y1="104"
                                x2="308"
                                y2="104"
                                stroke="#cbd5e1"
                                strokeWidth="1.5"
                            />
                            <line
                                x1="26"
                                y1="104"
                                x2="26"
                                y2="16"
                                stroke="#cbd5e1"
                                strokeWidth="1.5"
                            />
                            <text x="26" y="117" fontSize="9" fill="#64748b" textAnchor="middle">
                                {baseYear}
                            </text>
                            <text x="308" y="117" fontSize="9" fill="#64748b" textAnchor="end">
                                {lastYear}
                            </text>
                            {revealed > 1 && (
                                <motion.polyline
                                    key={revealed}
                                    points={linePoints}
                                    fill="none"
                                    stroke="#f43f5e"
                                    strokeWidth="2.5"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5 }}
                                />
                            )}
                            {sources.slice(0, revealed).map((s, i) => (
                                <motion.circle
                                    key={s.name}
                                    cx={px(s.year)}
                                    cy={py(totals[i])}
                                    r="4.5"
                                    fill="#f43f5e"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 16 }}
                                />
                            ))}
                        </svg>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5">
                                <span className="block text-[10px] uppercase tracking-wide text-slate-400">
                                    År etter Arthur
                                </span>
                                <span className="text-base font-bold text-slate-800">
                                    {distance}
                                </span>
                            </div>
                            <div className="rounded-lg bg-white border border-slate-200 px-2 py-1.5">
                                <span className="block text-[10px] uppercase tracking-wide text-slate-400">
                                    Detaljer
                                </span>
                                <span className="text-base font-bold text-rose-600">{details}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Høyre: det vi "vet" */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-slate-600">
                            Det vi «vet» om Arthur
                        </span>
                    </div>
                    {chips.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">
                            {baseLabel}. Foreløpig vet vi ingenting om ham.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5 content-start">
                            <AnimatePresence>
                                {chips.map((c) => (
                                    <motion.span
                                        key={c.a}
                                        initial={{ opacity: 0, scale: 0.7, y: 6 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                                        className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
                                    >
                                        {c.a}
                                    </motion.span>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <p className="font-semibold mb-1">{verdict}</p>
                            <p className="text-emerald-700 leading-relaxed">{verdictNote}</p>
                        </motion.div>
                    ) : current ? (
                        <motion.div
                            key={current.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm leading-relaxed"
                        >
                            <span className="font-semibold">
                                {current.yearLabel}, {current.name}:{' '}
                            </span>
                            {current.what}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Start med den eldste kilden til venstre.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Kilde {Math.min(revealed, sources.length)} av {sources.length}
                </span>
                <button
                    onClick={() => setRevealed(0)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
