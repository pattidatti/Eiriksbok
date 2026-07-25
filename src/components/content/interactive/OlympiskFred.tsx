import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Swords, RotateCcw } from 'lucide-react';

// Signaturkomponent for artikkelen om de olympiske lekene i antikken.
// Lyspære-øyeblikk: den hellige våpenhvilen stoppet ikke krigene mellom
// bystatene, men den fredet Olympia og ga utøvere og tilskuere trygg ferdsel
// gjennom alle bystatene. Eleven tenner den hellige ilden og ser de trygge
// veiene åpne seg fram til Olympia, mens rivaliseringen fortsetter rundt dem.

interface OlympiskFredProps {
    title?: string;
}

type Phase = 'krig' | 'fred';

// Bystater plassert rundt Olympia (prosent-koordinater i ruta).
const CITIES = [
    { id: 'athen', name: 'Athen', x: 78, y: 30 },
    { id: 'theben', name: 'Theben', x: 30, y: 24 },
    { id: 'korint', name: 'Korint', x: 33, y: 70 },
    { id: 'sparta', name: 'Sparta', x: 64, y: 82 },
    { id: 'argos', name: 'Argos', x: 82, y: 62 },
];

// Rivaliserende par som ligger i krig (rode linjer i krig-fasen).
const RIVALRIES: [string, string][] = [
    ['athen', 'sparta'],
    ['athen', 'theben'],
    ['sparta', 'argos'],
    ['korint', 'theben'],
    ['sparta', 'korint'],
];

const OLYMPIA = { x: 52, y: 50 };
const cityById = (id: string) => CITIES.find((c) => c.id === id)!;

export function OlympiskFred({ title = 'Den hellige våpenhvilen' }: OlympiskFredProps) {
    const [phase, setPhase] = useState<Phase>('krig');

    const handleReset = () => setPhase('krig');

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Tenn den hellige ilden og se hva som skjer med veiene til Olympia.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate: kart over bystatene rundt Olympia */}
            <div className="p-4 sm:p-6">
                <div className="relative w-full mx-auto max-w-xl aspect-[5/4] rounded-xl bg-gradient-to-b from-sky-50 to-emerald-50 border border-slate-200 overflow-hidden">
                    {/* Linjer mellom byene */}
                    <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="absolute inset-0 w-full h-full"
                    >
                        {/* Krig: rode linjer mellom rivaler */}
                        {phase === 'krig' &&
                            RIVALRIES.map(([a, b]) => {
                                const ca = cityById(a);
                                const cb = cityById(b);
                                return (
                                    <motion.line
                                        key={`${a}-${b}`}
                                        x1={ca.x}
                                        y1={ca.y}
                                        x2={cb.x}
                                        y2={cb.y}
                                        stroke="#f43f5e"
                                        strokeWidth={0.6}
                                        strokeDasharray="2 1.5"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: [0.35, 0.9, 0.35] }}
                                        transition={{ duration: 1.8, repeat: Infinity }}
                                    />
                                );
                            })}

                        {/* Fred: gronne veier fra hver by inn til Olympia */}
                        {phase === 'fred' &&
                            CITIES.map((c) => (
                                <motion.line
                                    key={`road-${c.id}`}
                                    x1={c.x}
                                    y1={c.y}
                                    x2={OLYMPIA.x}
                                    y2={OLYMPIA.y}
                                    stroke="#10b981"
                                    strokeWidth={0.7}
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 0.8 }}
                                    transition={{ duration: 0.8 }}
                                />
                            ))}
                    </svg>

                    {/* Utovere som reiser til Olympia i fred-fasen */}
                    <AnimatePresence>
                        {phase === 'fred' &&
                            CITIES.map((c, i) => (
                                <motion.div
                                    key={`runner-${c.id}`}
                                    className="absolute w-3 h-3 rounded-full bg-amber-400 border border-amber-600 shadow"
                                    style={{ left: `${c.x}%`, top: `${c.y}%`, marginLeft: -6, marginTop: -6 }}
                                    initial={{ left: `${c.x}%`, top: `${c.y}%`, opacity: 0 }}
                                    animate={{
                                        left: `${OLYMPIA.x}%`,
                                        top: `${OLYMPIA.y}%`,
                                        opacity: [0, 1, 1, 0],
                                    }}
                                    transition={{ duration: 1.6, delay: 0.4 + i * 0.18 }}
                                />
                            ))}
                    </AnimatePresence>

                    {/* Olympia i midten */}
                    <div
                        className="absolute flex flex-col items-center"
                        style={{ left: `${OLYMPIA.x}%`, top: `${OLYMPIA.y}%`, transform: 'translate(-50%,-50%)' }}
                    >
                        <motion.div
                            className={`flex items-center justify-center rounded-full border-2 ${
                                phase === 'fred'
                                    ? 'bg-amber-100 border-amber-400'
                                    : 'bg-slate-100 border-slate-300'
                            }`}
                            animate={{
                                width: phase === 'fred' ? 52 : 42,
                                height: phase === 'fred' ? 52 : 42,
                            }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                        >
                            <Flame
                                className={`w-5 h-5 ${
                                    phase === 'fred' ? 'text-amber-500' : 'text-slate-400'
                                }`}
                            />
                        </motion.div>
                        <span className="mt-1 text-[11px] font-semibold text-slate-600 bg-white/70 rounded px-1">
                            Olympia
                        </span>
                    </div>

                    {/* Bystatene */}
                    {CITIES.map((c) => (
                        <div
                            key={c.id}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%,-50%)' }}
                        >
                            <motion.div
                                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-sm ${
                                    phase === 'krig'
                                        ? 'bg-rose-50 border-rose-300'
                                        : 'bg-emerald-50 border-emerald-300'
                                }`}
                                animate={{ scale: phase === 'krig' ? [1, 1.06, 1] : 1 }}
                                transition={{ duration: 1.6, repeat: phase === 'krig' ? Infinity : 0 }}
                            >
                                {phase === 'krig' ? (
                                    <Swords className="w-4 h-4 text-rose-500" />
                                ) : (
                                    <Flame className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                            </motion.div>
                            <span className="mt-0.5 text-[11px] font-semibold text-slate-700 bg-white/70 rounded px-1">
                                {c.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback-sone (alltid i DOM-et) */}
            <div className="mx-4 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'krig' ? (
                        <motion.div
                            key="krig"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            Bystatene ligger i krig med hverandre. Det er farlig å reise mellom dem.
                            Hvordan kan alle samles trygt til lekene?
                        </motion.div>
                    ) : (
                        <motion.div
                            key="fred"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                        >
                            Ekecheiria: den hellige våpenhvilen. Krigene mellom bystatene tok ikke
                            slutt, men Olympia var fredet, og utøvere og tilskuere fikk trygg
                            ferdsel gjennom alle bystatene. Fiender feiret den samme festen side om
                            side.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={() => setPhase('fred')}
                    disabled={phase === 'fred'}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors disabled:opacity-40"
                >
                    <Flame className="w-4 h-4" />
                    Tenn den hellige ilden
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
