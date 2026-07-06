import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, RotateCcw, Check } from 'lucide-react';

interface Pillar {
    id: string;
    arabic: string;
    name: string;
    short: string;
    detail: string;
    color: string;
    bar: string;
}

const PILLARS: Pillar[] = [
    {
        id: 'shahada',
        arabic: 'Shahada',
        name: 'Trosbekjennelsen',
        short: 'Det finnes bare én Gud',
        detail: 'Sier du høyt og oppriktig at det bare finnes én Gud, og at Muhammad er profeten hans, blir du muslim. Dette er grunnsteinen alt annet hviler på.',
        color: 'text-emerald-700',
        bar: 'from-emerald-400 to-emerald-600',
    },
    {
        id: 'salah',
        arabic: 'Salah',
        name: 'Bønnen',
        short: 'Fem bønner hver dag',
        detail: 'En muslim ber fem faste ganger hver dag, alltid vendt mot byen Mekka. Bønnen minner om Gud gjennom hele dagen.',
        color: 'text-sky-700',
        bar: 'from-sky-400 to-sky-600',
    },
    {
        id: 'zakat',
        arabic: 'Zakat',
        name: 'Almissen',
        short: 'Gi til dem som trenger det',
        detail: 'Alle som har råd, gir hvert år en fast del av det de eier til fattige. Å dele er en plikt, ikke bare noe fint.',
        color: 'text-amber-700',
        bar: 'from-amber-400 to-amber-600',
    },
    {
        id: 'sawm',
        arabic: 'Sawm',
        name: 'Fasten',
        short: 'Faste i måneden ramadan',
        detail: 'I måneden ramadan spiser og drikker ikke muslimer fra soloppgang til solnedgang. Det lærer dem tålmodighet og å tenke på dem som har lite.',
        color: 'text-violet-700',
        bar: 'from-violet-400 to-violet-600',
    },
    {
        id: 'hajj',
        arabic: 'Hajj',
        name: 'Pilegrimsreisen',
        short: 'Reis til Mekka én gang',
        detail: 'Minst én gang i livet reiser alle som kan, til Mekka. Der samles millioner av muslimer fra hele verden på samme sted, i samme klær.',
        color: 'text-rose-700',
        bar: 'from-rose-400 to-rose-600',
    },
];

export function IslamsFemSoyler({ title = 'Islams fem søyler' }: { title?: string }) {
    const [raised, setRaised] = useState<Set<string>>(new Set());
    const [active, setActive] = useState<string | null>(null);

    const allUp = raised.size === PILLARS.length;
    const activePillar = PILLARS.find((p) => p.id === active) ?? null;

    const handleClick = (id: string) => {
        setActive(id);
        setRaised((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const handleReset = () => {
        setRaised(new Set());
        setActive(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Star className="w-5 h-5 text-emerald-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk hver søyle for å reise den, og se hva som bærer et muslimsk liv.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate: taket + de fem søylene */}
            <div className="px-6 pt-6">
                <div className="relative mx-auto max-w-xl">
                    {/* Taket / kuppelen */}
                    <div className="relative h-14 flex items-end justify-center">
                        <AnimatePresence>
                            {allUp && (
                                <motion.div
                                    key="dome"
                                    initial={{ scale: 0, opacity: 0, y: 10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                                    className="absolute -top-1 z-10 flex flex-col items-center"
                                >
                                    <div className="w-10 h-10 rounded-t-full bg-gradient-to-b from-amber-300 to-amber-500 shadow-md" />
                                    <div className="w-1.5 h-3 -mt-0.5 bg-amber-500 rounded-full" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <motion.div
                            className="h-3 w-full rounded-full bg-slate-300 origin-center"
                            animate={{
                                rotate: allUp ? 0 : -4,
                                backgroundColor: allUp ? '#34d399' : '#cbd5e1',
                            }}
                            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                        />
                    </div>

                    {/* Søylene */}
                    <div className="flex items-end justify-between gap-2 sm:gap-3 h-56">
                        {PILLARS.map((p, i) => {
                            const up = raised.has(p.id);
                            const isActive = active === p.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => handleClick(p.id)}
                                    className="group relative flex-1 flex flex-col items-center justify-end h-full focus:outline-none"
                                    aria-label={`Reis søyle: ${p.name}`}
                                >
                                    <motion.div
                                        className={`w-full rounded-t-lg bg-gradient-to-b ${p.bar} shadow-sm flex items-start justify-center pt-2 ${
                                            isActive ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                        }`}
                                        initial={false}
                                        animate={{ height: up ? '100%' : '18%' }}
                                        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                                    >
                                        <span className="text-[11px] font-bold text-white/90">{i + 1}</span>
                                    </motion.div>
                                    <span className="mt-2 text-[11px] sm:text-xs font-medium text-slate-600 text-center leading-tight">
                                        {p.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-6 pt-2 pb-4">
                <AnimatePresence mode="wait">
                    {allUp ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
                            <span>
                                Alle fem søylene står. Til sammen bærer de et helt muslimsk liv: de forteller
                                <span className="font-semibold"> hva</span> du tror, og
                                <span className="font-semibold"> hvordan</span> du lever det ut hver dag.
                            </span>
                        </motion.div>
                    ) : activePillar ? (
                        <motion.div
                            key={activePillar.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className={`font-semibold ${activePillar.color}`}>
                                    {activePillar.arabic}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="font-semibold text-slate-700">{activePillar.name}</span>
                            </div>
                            <p className="mt-1 text-slate-600">{activePillar.detail}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Reis alle fem søylene. Da får taket støtte, og du ser hva islam bygger på.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-sm text-slate-500">
                    {raised.size} av {PILLARS.length} søyler reist
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
