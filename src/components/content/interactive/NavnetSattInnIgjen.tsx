import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, RotateCcw, Sparkles } from 'lucide-react';

interface NavnetSattInnIgjenProps {
    title?: string;
    subtitle?: string;
}

type ValgId = 'herren' | 'jahve' | 'jehova';

interface Valg {
    id: ValgId;
    ord: string;
    merkelapp: string;
    forklaring: string;
}

const VALG: Valg[] = [
    {
        id: 'herren',
        ord: 'Herren',
        merkelapp: 'Vanligst i norske bibler',
        forklaring:
            'Norske bibeloversettelser gjengir som oftest JHVH med Herren. Da blir navnet byttet ut med en tittel, og du ser ikke uten videre at det sto fire navnebokstaver i den hebraiske teksten.',
    },
    {
        id: 'jahve',
        ord: 'Jahve',
        merkelapp: 'Formen forskerne bruker',
        forklaring:
            'Jahve er en mulig uttale av JHVH, og den formen fagbøkene bruker. Uttalen er likevel omstridt, for ingen vet sikkert hvilke vokaler som hørte til. Formen brukes aldri i jødisk tradisjon, der man heller sier Adonaj eller ha-Shem, som betyr navnet.',
    },
    {
        id: 'jehova',
        ord: 'Jehova',
        merkelapp: 'Jehovas vitners valg',
        forklaring:
            'Formen oppsto blant kristne teologer i middelalderen, fordi vokalene fra ordet Adonaj var markert sammen med konsonantene JHVH. Jehovas vitner mener denne uttalen er like god som enhver annen etablert uttale, og de viser selv til at gudsnavnet står omkring 7000 ganger i den hebraiske teksten. Flere trossamfunn bruker fremdeles formen Jehova.',
    },
];

export function NavnetSattInnIgjen({
    title = 'Du er oversetteren',
    subtitle = 'Fire hebraiske bokstaver skal bli norsk. Velg ett ord, og se hva som skjer med verset.',
}: NavnetSattInnIgjenProps) {
    const [valgt, setValgt] = useState<ValgId | null>(null);
    const [provd, setProvd] = useState<ValgId[]>([]);

    const aktiv = useMemo(() => VALG.find((v) => v.id === valgt) ?? null, [valgt]);
    const ferdig = provd.length === VALG.length;

    const velg = (id: ValgId) => {
        setValgt(id);
        setProvd((f) => (f.includes(id) ? f : [...f, id]));
    };

    const tilbakestill = () => {
        setValgt(null);
        setProvd([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                            Grunnteksten
                        </p>
                        <p className="text-sm text-slate-600">
                            Fire konsonanter, ingen vokaler: J H V H
                        </p>
                    </div>
                    <span
                        lang="he"
                        dir="rtl"
                        className="text-3xl sm:text-4xl font-serif text-slate-800 select-none"
                    >
                        יהוה
                    </span>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold mb-2">
                        Slik ville verset sett ut med ditt valg
                    </p>
                    <p className="text-lg sm:text-xl text-slate-800 leading-snug">
                        Dere er mine vitner, sier{' '}
                        <span className="inline-block align-baseline">
                            <AnimatePresence mode="wait" initial={false}>
                                {aktiv ? (
                                    <motion.span
                                        key={aktiv.id}
                                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                        className="inline-block rounded-md bg-white border border-amber-300 px-2 py-0.5 font-semibold text-amber-700"
                                    >
                                        {aktiv.ord}
                                    </motion.span>
                                ) : (
                                    <motion.span
                                        key="tom"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="inline-block rounded-md border border-dashed border-amber-300 px-6 py-0.5 text-amber-400"
                                    >
                                        ?
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </span>
                        .
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Jesaja 43,10</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {VALG.map((v) => {
                        const erValgt = valgt === v.id;
                        const erProvd = provd.includes(v.id);
                        return (
                            <motion.button
                                key={v.id}
                                type="button"
                                onClick={() => velg(v.id)}
                                whileTap={{ scale: 0.96 }}
                                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                                    erValgt
                                        ? 'border-indigo-400 bg-indigo-50 shadow-md'
                                        : 'border-slate-200 bg-white hover:bg-slate-50 shadow-sm'
                                }`}
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <span
                                        className={`font-semibold ${
                                            erValgt ? 'text-indigo-700' : 'text-slate-800'
                                        }`}
                                    >
                                        {v.ord}
                                    </span>
                                    {erProvd && (
                                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                    )}
                                </span>
                                <span className="block text-xs text-slate-500 mt-1">
                                    {v.merkelapp}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="min-h-[92px]">
                    <AnimatePresence mode="wait" initial={false}>
                        {aktiv ? (
                            <motion.div
                                key={aktiv.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.22 }}
                                className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800"
                            >
                                {aktiv.forklaring}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hvile"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-500"
                            >
                                Trykk på et av de tre ordene. Alle tre finnes i virkelige
                                oversettelser eller fagbøker.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {ferdig && (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-start gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                            >
                                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
                            </motion.span>
                            <span>
                                Du har prøvd alle tre. Ingen av dem er en ren avskrift av den
                                hebraiske teksten, for der står bare konsonantene. Alle tre er valg,
                                tatt av mennesker. Det er derfor to bibler kan si to ulike ting i
                                det samme verset.
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Prøvd {provd.length} av {VALG.length}
                </span>
                <button
                    type="button"
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
