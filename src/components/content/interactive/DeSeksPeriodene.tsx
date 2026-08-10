import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hourglass, RotateCcw, Sparkles } from 'lucide-react';

interface DeSeksPeriodeneProps {
    title?: string;
}

type StoppId = 'dogn' | 'tusen' | 'lang';

interface Stopp {
    id: StoppId;
    knapp: string;
    bredde: string;
    sum: string;
    tittel: string;
    tekst: string;
    merke?: string;
}

const STOPP: Stopp[] = [
    {
        id: 'dogn',
        knapp: '24 timer',
        bredde: '22%',
        sum: 'Hele skapelsen på under en uke',
        tittel: 'Seks døgn',
        tekst:
            'Noen kristne leser dag som et døgn på 24 timer. Da tar hele skapelsen mindre enn en ' +
            'uke. Jehovas vitner mener denne lesemåten ikke stemmer med hva ordet dag kan bety i ' +
            'Bibelen.',
    },
    {
        id: 'tusen',
        knapp: 'Tusen år',
        bredde: '58%',
        sum: 'Én dag kan bety tusen år',
        tittel: 'Seks lange bolker',
        tekst:
            'I Bibelen kan ordet dag stå for mye mer enn et døgn. Ett sted sammenlignes tusen år ' +
            'med en dag. Jehovas vitner bruker slike steder for å vise at dag ikke må bety 24 ' +
            'timer. De mener ikke at hver skapelsesdag varte akkurat tusen år.',
    },
    {
        id: 'lang',
        knapp: 'Ukjent lengde',
        bredde: '100%',
        sum: 'Bibelen oppgir ingen lengde',
        tittel: 'Seks lange tidsperioder',
        tekst:
            'Jehovas vitner mener de seks dagene er lange tidsperioder. Hvor lange, sier Bibelen ' +
            'ingenting om. De peker blant annet på at teksten like etterpå kaller alle seks dagene ' +
            'til sammen for én dag.',
        merke: 'Jehovas vitners lesemåte',
    },
];

const BAR_FARGER = [
    'bg-amber-300',
    'bg-amber-400',
    'bg-orange-400',
    'bg-emerald-400',
    'bg-emerald-500',
    'bg-teal-500',
];

export function DeSeksPeriodene({ title = 'Hvor lang er en skapelsesdag?' }: DeSeksPeriodeneProps) {
    const [valgt, setValgt] = useState(0);
    const [besokt, setBesokt] = useState<StoppId[]>([STOPP[0].id]);

    const aktiv = STOPP[valgt];
    const ferdig = besokt.length === STOPP.length;

    const velg = (indeks: number) => {
        setValgt(indeks);
        setBesokt((forrige) =>
            forrige.includes(STOPP[indeks].id) ? forrige : [...forrige, STOPP[indeks].id]
        );
    };

    const nullstill = () => {
        setValgt(0);
        setBesokt([STOPP[0].id]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Hourglass className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk deg gjennom de tre lesemåtene og se hva som skjer med skapelsesuka.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5">
                <div className="relative">
                    <div className="absolute left-[16.66%] right-[16.66%] top-5 h-1 rounded-full bg-slate-200" />
                    <motion.div
                        className="absolute left-[16.66%] top-5 h-1 rounded-full bg-indigo-400"
                        animate={{ width: `${(valgt / (STOPP.length - 1)) * 66.66}%` }}
                        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                    />
                    <div className="relative grid grid-cols-3">
                        {STOPP.map((stopp, i) => {
                            const erAktiv = i === valgt;
                            const erBesokt = besokt.includes(stopp.id);
                            return (
                                <button
                                    key={stopp.id}
                                    onClick={() => velg(i)}
                                    className="flex flex-col items-center gap-2 focus:outline-none"
                                >
                                    <motion.span
                                        animate={{ scale: erAktiv ? 1.15 : 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 ${
                                            erAktiv
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                : erBesokt
                                                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                                                  : 'bg-white border-slate-300 text-slate-400'
                                        }`}
                                    >
                                        {i + 1}
                                    </motion.span>
                                    <span
                                        className={`text-xs sm:text-sm font-medium text-center leading-tight ${
                                            erAktiv ? 'text-slate-800' : 'text-slate-500'
                                        }`}
                                    >
                                        {stopp.knapp}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="px-6 pt-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <motion.div
                        className="flex gap-1"
                        animate={{ width: aktiv.bredde }}
                        transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                    >
                        {BAR_FARGER.map((farge, i) => (
                            <div
                                key={i}
                                className={`h-12 flex-1 rounded-md ${farge} flex items-end justify-center pb-1`}
                            >
                                <span className="text-[10px] font-bold text-white/90">{i + 1}</span>
                            </div>
                        ))}
                    </motion.div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">Skapelsesdag 1 til 6</span>
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={aktiv.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1"
                            >
                                {aktiv.sum}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={aktiv.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-blue-900 text-sm">{aktiv.tittel}</h4>
                            {aktiv.merke && (
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
                                    {aktiv.merke}
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-sm text-blue-800 leading-snug">{aktiv.tekst}</p>
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="mx-6 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3"
                    >
                        <div className="flex items-start gap-2">
                            <motion.span
                                initial={{ rotate: -25, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 12,
                                    delay: 0.1,
                                }}
                            >
                                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                            </motion.span>
                            <p className="text-sm text-emerald-800 leading-snug">
                                Du har sett alle tre lesemåtene. Fordi Jehovas vitner mener jorda og
                                universet fantes lenge før dag én, har de ingen innvending mot at
                                forskere sier jorda er milliarder av år gammel.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-6 py-5 flex items-center justify-between gap-3">
                <button
                    onClick={() => velg((valgt + 1) % STOPP.length)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Neste lesemåte
                </button>
                <button
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
