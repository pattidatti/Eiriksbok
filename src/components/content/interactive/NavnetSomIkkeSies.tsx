import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, RotateCcw, Sparkles, Volume2 } from 'lucide-react';

interface NavnetSomIkkeSiesProps {
    title?: string;
}

interface Ord {
    tekst: string;
    navn?: boolean;
}

interface Valg {
    id: string;
    etikett: string;
    under: string;
    godtatt: boolean;
    svar: string;
}

const VERS: Ord[] = [
    { tekst: 'Hør,' },
    { tekst: 'Israel!' },
    { tekst: 'JHVH', navn: true },
    { tekst: 'er' },
    { tekst: 'vår' },
    { tekst: 'Gud,' },
    { tekst: 'JHVH', navn: true },
    { tekst: 'er' },
    { tekst: 'én.' },
];

const VALG: Valg[] = [
    {
        id: 'jahve',
        etikett: 'Jahve',
        under: 'en gjetning på uttalen',
        godtatt: false,
        svar: 'Jahve er forskernes forsøk på å gjette hvordan navnet en gang lød. I synagogen sier ingen det høyt. Velg et av de to andre ordene.',
    },
    {
        id: 'adonai',
        etikett: 'Adonai',
        under: 'Herren',
        godtatt: true,
        svar: 'Adonai betyr Herren. Det er ordet som sies når teksten leses høyt, og har vært brukt slik i over to tusen år.',
    },
    {
        id: 'hashem',
        etikett: 'HaShem',
        under: 'Navnet',
        godtatt: true,
        svar: 'HaShem betyr rett og slett Navnet. Mange bruker det når de snakker om Gud utenfor bønn og opplesning.',
    },
];

const JEHOVA = [
    { bokstav: 'J', vokal: 'e' },
    { bokstav: 'H', vokal: 'o' },
    { bokstav: 'V', vokal: 'a' },
    { bokstav: 'H', vokal: '' },
];

export function NavnetSomIkkeSies({ title = 'Navnet som ikke sies' }: NavnetSomIkkeSiesProps) {
    const [startet, setStartet] = useState(false);
    const [index, setIndex] = useState(-1);
    const [sagt, setSagt] = useState<Record<number, string>>({});
    const [svar, setSvar] = useState<{ ok: boolean; tekst: string } | null>(null);

    const ferdig = startet && index >= VERS.length;
    const venter =
        startet && index >= 0 && index < VERS.length && !!VERS[index].navn && !sagt[index];

    useEffect(() => {
        if (!startet || index >= VERS.length || venter) return;
        const t = setTimeout(() => setIndex((i) => i + 1), index < 0 ? 200 : 620);
        return () => clearTimeout(t);
    }, [startet, index, venter]);

    const velg = (valg: Valg) => {
        if (!valg.godtatt) {
            setSvar({ ok: false, tekst: valg.svar });
            return;
        }
        setSagt((prev) => ({ ...prev, [index]: valg.etikett }));
        setSvar({ ok: true, tekst: valg.svar });
    };

    const tilbakestill = () => {
        setStartet(false);
        setIndex(-1);
        setSagt({});
        setSvar(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les verset høyt. Når lesingen stopper ved de fire bokstavene, velger du hva
                        du sier i stedet.
                    </p>
                </div>
            </div>

            <div className="p-5">
                <div className="rounded-xl bg-amber-50/70 border border-amber-200 px-4 py-5">
                    <div className="flex flex-wrap items-end justify-center gap-2">
                        {VERS.map((ord, i) => {
                            const aktiv = i === index;
                            const lest = i < index || !!sagt[i];
                            if (ord.navn) {
                                const valgt = sagt[i];
                                return (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: aktiv && !valgt ? 1.06 : 1,
                                            y: aktiv ? -2 : 0,
                                        }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                        className={`px-3 py-1.5 rounded-lg border text-center ${
                                            valgt
                                                ? 'bg-emerald-50 border-emerald-300'
                                                : aktiv
                                                  ? 'bg-white border-amber-400 shadow-md'
                                                  : 'bg-white border-amber-300'
                                        }`}
                                    >
                                        <span className="block text-[11px] tracking-widest text-slate-400">
                                            JHVH
                                        </span>
                                        <span
                                            className={`block text-lg font-semibold ${
                                                valgt ? 'text-emerald-700' : 'text-amber-700'
                                            }`}
                                        >
                                            {valgt ?? '?'}
                                        </span>
                                    </motion.div>
                                );
                            }
                            return (
                                <motion.span
                                    key={i}
                                    animate={{ y: aktiv ? -2 : 0 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                                    className={`px-3 py-2 rounded-lg text-lg ${
                                        aktiv
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : lest
                                              ? 'text-slate-700'
                                              : 'text-slate-400'
                                    }`}
                                >
                                    {ord.tekst}
                                </motion.span>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-4 min-h-[104px]">
                    <AnimatePresence>
                        {!startet && (
                            <motion.p
                                key="start"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-slate-500 text-center pt-6"
                            >
                                Verset er de første ordene i Sjema, den jødiske bekjennelsen.
                            </motion.p>
                        )}

                        {venter && (
                            <motion.div
                                key="valg"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                            >
                                {VALG.map((valg) => (
                                    <motion.button
                                        key={valg.id}
                                        onClick={() => velg(valg)}
                                        whileTap={{ scale: 0.96 }}
                                        className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md px-4 py-3 text-left"
                                    >
                                        <span className="flex items-center gap-2 font-semibold text-slate-800">
                                            <Volume2 className="w-4 h-4 text-indigo-500" />
                                            {valg.etikett}
                                        </span>
                                        <span className="block text-xs text-slate-500 mt-0.5">
                                            {valg.under}
                                        </span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}

                        {ferdig && (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.94 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3"
                            >
                                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                                    <Sparkles className="w-4 h-4" />
                                    Du leste hele verset uten å si navnet én eneste gang.
                                </p>
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <div className="flex items-end gap-1">
                                        {JEHOVA.map((tegn, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.15 + i * 0.1 }}
                                                className="w-9 rounded-lg bg-white border border-emerald-200 py-1 text-center"
                                            >
                                                <span className="block text-lg font-semibold text-slate-800">
                                                    {tegn.bokstav}
                                                </span>
                                                <span className="block h-4 text-xs font-semibold text-indigo-500">
                                                    {tegn.vokal}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <p className="text-sm text-emerald-800 flex-1 min-w-[220px]">
                                        Bokstavene i teksten er JHVH, men vokaltegnene under dem
                                        hører til ordet Adonai. Leser du de to lagene sammen, får du
                                        Jehova. Slik oppsto det navnet i middelalderen.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {!venter && !ferdig && startet && svar && (
                            <motion.div
                                key={`svar-${svar.tekst}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800"
                            >
                                {svar.tekst}
                            </motion.div>
                        )}

                        {venter && svar && !svar.ok && (
                            <motion.p
                                key="feil"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="mt-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
                            >
                                {svar.tekst}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                <button
                    onClick={() => setStartet(true)}
                    disabled={startet}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {ferdig ? 'Lest ferdig' : 'Les høyt'}
                </button>
                <button
                    onClick={tilbakestill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
