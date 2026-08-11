import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link2, RotateCcw, Scissors, Sparkles } from 'lucide-react';

interface TreenighetensKnuteProps {
    title?: string;
}

type TraadId = 'en-gud' | 'hver-er-gud' | 'ikke-samme';

interface Traad {
    id: TraadId;
    kort: string;
    lang: string;
}

interface Forslag {
    id: string;
    label: string;
    brytes: TraadId[];
    forklaring: string;
}

const TRAADER: Traad[] = [
    {
        id: 'en-gud',
        kort: 'Det finnes bare én Gud',
        lang: 'Arven fra jødedommen. Kristne teller ikke guder.',
    },
    {
        id: 'hver-er-gud',
        kort: 'Faderen, Sønnen og Ånden er hver fullt ut Gud',
        lang: 'Ingen av de tre er en billigere utgave av de andre.',
    },
    {
        id: 'ikke-samme',
        kort: 'De tre er ikke bare tre navn på det samme',
        lang: 'Jesus ber til Faderen. Da kan de ikke være samme person.',
    },
];

const FORSLAG: Forslag[] = [
    {
        id: 'tre-guder',
        label: 'Da får vi tre guder.',
        brytes: ['en-gud'],
        forklaring:
            'Nå går regnestykket opp, men du har mistet det de første kristne aldri ville gi slipp på: at Gud er én.',
    },
    {
        id: 'bare-menneske',
        label: 'Jesus var bare et klokt menneske.',
        brytes: ['hver-er-gud'],
        forklaring:
            'Ryddig og enkelt. Men da ba de første kristne til et menneske, og påstanden om at Gud selv kom til jorda faller bort.',
    },
    {
        id: 'arius',
        label: 'Sønnen er skapt av Faderen og står under ham.',
        brytes: ['hver-er-gud'],
        forklaring:
            'Dette var løsningen til Arius. Athanasius svarte at en skapning ikke kan frelse andre skapninger, og at kristne da tilber noe som er skapt.',
    },
    {
        id: 'maske',
        label: 'Gud er én person som skifter maske.',
        brytes: ['ikke-samme'],
        forklaring:
            'Da er Faderen, Sønnen og Ånden bare tre roller. Men hvem ba Jesus til i Getsemane, hvis han snakket med seg selv?',
    },
    {
        id: 'nikea',
        label: 'Én Gud, tre personer, av samme vesen.',
        brytes: [],
        forklaring:
            'Alle tre trådene holder. Dette er formuleringen kirken landet på i Nikea i 325 og Konstantinopel i 381. Den er ikke enklere enn de andre. Den er bare den eneste som ikke ryker.',
    },
];

export function TreenighetensKnute({ title = 'Treenighetens knute' }: TreenighetensKnuteProps) {
    const [valgtId, setValgtId] = useState<string | null>(null);
    const [proevd, setProevd] = useState<string[]>([]);

    const valgt = FORSLAG.find((f) => f.id === valgtId) ?? null;
    const loest = valgt !== null && valgt.brytes.length === 0;

    const velg = (id: string) => {
        setValgtId(id);
        setProevd((tidligere) => (tidligere.includes(id) ? tidligere : [...tidligere, id]));
    };

    const nullstill = () => {
        setValgtId(null);
        setProevd([]);
    };

    const statusFor = (traadId: TraadId): 'nøytral' | 'ryker' | 'holder' => {
        if (!valgt) return 'nøytral';
        return valgt.brytes.includes(traadId) ? 'ryker' : 'holder';
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Link2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Tre tråder må holde samtidig. Klikk en løsning og se hvilken som ryker.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5 grid gap-3 sm:grid-cols-3">
                {TRAADER.map((traad) => {
                    const status = statusFor(traad.id);
                    const ryker = status === 'ryker';
                    const holder = status === 'holder';
                    return (
                        <motion.div
                            key={traad.id}
                            animate={ryker ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`rounded-xl border p-3 ${
                                ryker
                                    ? 'bg-rose-50 border-rose-200'
                                    : holder
                                      ? 'bg-emerald-50 border-emerald-200'
                                      : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                <motion.span
                                    key={status}
                                    initial={{ scale: 0.6, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                                    className="mt-0.5 shrink-0"
                                >
                                    {ryker ? (
                                        <Scissors className="w-4 h-4 text-rose-600" />
                                    ) : holder ? (
                                        <Check className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                        <Link2 className="w-4 h-4 text-slate-400" />
                                    )}
                                </motion.span>
                                <p
                                    className={`text-sm font-medium leading-snug ${
                                        ryker
                                            ? 'text-rose-800 line-through decoration-rose-400'
                                            : holder
                                              ? 'text-emerald-800'
                                              : 'text-slate-700'
                                    }`}
                                >
                                    {traad.kort}
                                </p>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 leading-snug">{traad.lang}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="px-5 pt-4 space-y-2">
                {FORSLAG.map((forslag) => {
                    const erValgt = forslag.id === valgtId;
                    const erProevd = proevd.includes(forslag.id);
                    return (
                        <motion.button
                            key={forslag.id}
                            type="button"
                            onClick={() => velg(forslag.id)}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full text-left rounded-xl border px-4 py-2.5 text-sm transition-colors ${
                                erValgt
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-md'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md shadow-sm'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        erProevd ? 'bg-indigo-400' : 'bg-slate-300'
                                    }`}
                                />
                                {forslag.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={valgtId ?? 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            !valgt
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : loest
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                    >
                        {!valgt ? (
                            'Velg en løsning over. Alle er lettere å forstå enn treenigheten, men bare én av dem lar alle tre trådene stå.'
                        ) : loest ? (
                            <span className="flex items-start gap-2">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                    className="mt-0.5 shrink-0"
                                >
                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                </motion.span>
                                <span>{valgt.forklaring}</span>
                            </span>
                        ) : (
                            valgt.forklaring
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {loest && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pt-3"
                    >
                        <div className="flex items-center justify-center gap-2 py-2">
                            {TRAADER.map((traad, i) => (
                                <motion.span
                                    key={traad.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        delay: 0.12 * i,
                                        type: 'spring',
                                        stiffness: 320,
                                        damping: 14,
                                    }}
                                    className="w-8 h-8 rounded-full border-2 border-emerald-400 bg-emerald-50"
                                />
                            ))}
                        </div>
                        <p className="text-center text-xs text-emerald-700 font-medium pb-1">
                            Knuten holder. Tre tråder, én sammenknytning.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Prøvd {proevd.length} av {FORSLAG.length} løsninger
                </p>
                <button
                    type="button"
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
