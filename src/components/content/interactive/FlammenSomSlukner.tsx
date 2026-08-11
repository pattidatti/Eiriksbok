import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, HelpCircle, RotateCcw, Sparkles } from 'lucide-react';

interface FlammenSomSluknerProps {
    title?: string;
}

type LampeStatus = 'brenner' | 'slukner' | 'slukket';

interface Lampe {
    id: string;
    navn: string;
    naering: string;
    kvittering: string;
}

const LAMPER: Lampe[] = [
    {
        id: 'begjaer',
        navn: 'Begjær',
        naering: 'Tørsten etter nytelse og etter mer liv',
        kvittering:
            'Uten påfyll av tørst har begjærets ild ingenting å brenne på. Den brenner ned av seg selv.',
    },
    {
        id: 'hat',
        navn: 'Hat',
        naering: 'Motviljen mot alt du vil skyve bort',
        kvittering:
            'Hatets ild lever av at du hele tiden dytter noe fra deg. Slutter dyttingen, slutter brannen.',
    },
    {
        id: 'uvitenhet',
        navn: 'Uvitenhet',
        naering: 'Troen på at det finnes et evig jeg',
        kvittering:
            'Uvitenhetens ild lever av innbilningen om et evig jeg. Ser du at den ikke stemmer, faller næringen bort.',
    },
];

const SVAR = [
    'Han finnes etterpå',
    'Han finnes ikke etterpå',
    'Han både finnes og finnes ikke',
    'Han verken finnes eller finnes ikke',
];

export function FlammenSomSlukner({ title = 'Flammen som slukner' }: FlammenSomSluknerProps) {
    const [status, setStatus] = useState<Record<string, LampeStatus>>({});
    const [melding, setMelding] = useState<string | null>(null);
    const [proevde, setProevde] = useState<string[]>([]);
    const timers = useRef<number[]>([]);

    useEffect(() => {
        return () => {
            timers.current.forEach((t) => window.clearTimeout(t));
        };
    }, []);

    const hent = (id: string): LampeStatus => status[id] ?? 'brenner';
    const antallSlukket = LAMPER.filter((l) => hent(l.id) === 'slukket').length;
    const alleSlukket = antallSlukket === LAMPER.length;
    const ferdig = proevde.length === SVAR.length;

    const handleSlukk = (lampe: Lampe) => {
        if (hent(lampe.id) !== 'brenner') return;
        setStatus((s) => ({ ...s, [lampe.id]: 'slukner' }));
        setMelding(lampe.kvittering);
        const t = window.setTimeout(() => {
            setStatus((s) => ({ ...s, [lampe.id]: 'slukket' }));
        }, 1150);
        timers.current.push(t);
    };

    const handleSvar = (svar: string) => {
        if (proevde.includes(svar)) return;
        setProevde((p) => [...p, svar]);
        setMelding('Buddha svarte: «Det gjelder ikke.»');
    };

    const handleReset = () => {
        timers.current.forEach((t) => window.clearTimeout(t));
        timers.current = [];
        setStatus({});
        setProevde([]);
        setMelding(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Flame className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Tre ilder brenner. Slutt å fylle på oljen, og se hva som skjer.
                    </p>
                </div>
            </div>

            <div className="px-5 py-4 bg-slate-50">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {LAMPER.map((lampe) => {
                        const s = hent(lampe.id);
                        return (
                            <motion.div
                                key={lampe.id}
                                animate={s === 'slukket' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                transition={{ duration: 0.35 }}
                                className={`rounded-xl border p-2 sm:p-3 flex flex-col items-center text-center ${
                                    s === 'slukket'
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : 'bg-white border-slate-200'
                                }`}
                            >
                                <div className="relative h-[92px] w-16 flex flex-col items-center justify-end">
                                    <AnimatePresence>
                                        {s === 'slukket' && (
                                            <motion.div
                                                key="roek"
                                                initial={{ opacity: 0.5, y: 0, scale: 0.6 }}
                                                animate={{ opacity: 0, y: -34, scale: 1.4 }}
                                                transition={{ duration: 1.4, ease: 'easeOut' }}
                                                className="absolute top-2 w-4 h-4 rounded-full bg-slate-300"
                                            />
                                        )}
                                    </AnimatePresence>

                                    <AnimatePresence>
                                        {s !== 'slukket' && (
                                            <motion.div
                                                key="flamme"
                                                className="absolute bottom-[46px]"
                                                style={{ transformOrigin: 'bottom center' }}
                                                initial={{ scale: 1, opacity: 1 }}
                                                animate={
                                                    s === 'slukner'
                                                        ? { scale: 0.05, opacity: 0 }
                                                        : {
                                                              scale: [1, 1.12, 0.96, 1],
                                                              opacity: 1,
                                                          }
                                                }
                                                exit={{ opacity: 0 }}
                                                transition={
                                                    s === 'slukner'
                                                        ? { duration: 0.55, delay: 0.55 }
                                                        : {
                                                              duration: 1.6,
                                                              repeat: Infinity,
                                                              ease: 'easeInOut',
                                                          }
                                                }
                                            >
                                                <svg
                                                    width="26"
                                                    height="36"
                                                    viewBox="0 0 26 36"
                                                    aria-hidden="true"
                                                >
                                                    <path
                                                        d="M13 1 C 20 11, 24 18, 13 34 C 2 18, 6 11, 13 1 Z"
                                                        fill="#f59e0b"
                                                    />
                                                    <path
                                                        d="M13 13 C 17 19, 18 22, 13 31 C 8 22, 9 19, 13 13 Z"
                                                        fill="#fef08a"
                                                    />
                                                </svg>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="w-1 h-3 rounded-full bg-slate-400" />

                                    <div className="w-14 h-8 rounded-b-2xl rounded-t-sm border border-amber-200 bg-amber-50 overflow-hidden flex items-end">
                                        <motion.div
                                            className="w-full bg-amber-300"
                                            style={{ height: '70%' }}
                                            initial={false}
                                            animate={{ height: s === 'brenner' ? '70%' : '0%' }}
                                            transition={{ duration: 1, ease: 'easeIn' }}
                                        />
                                    </div>
                                </div>

                                <p className="mt-2 font-semibold text-slate-800 text-sm">
                                    {lampe.navn}
                                </p>
                                <p className="text-[11px] leading-snug text-slate-500 mt-0.5 min-h-[28px]">
                                    {lampe.naering}
                                </p>

                                {s === 'slukket' ? (
                                    <span className="mt-2 text-[11px] font-medium text-emerald-700 px-3 py-1 rounded-full bg-emerald-100">
                                        Slukket
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleSlukk(lampe)}
                                        disabled={s === 'slukner'}
                                        className="mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-3 py-1 text-[11px] font-medium transition-colors"
                                    >
                                        {s === 'slukner' ? 'Brenner ned' : 'Slutt å fylle på'}
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <AnimatePresence>
                {alleSlukket && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                        className="px-5 pt-4 border-t border-slate-100"
                    >
                        <div className="flex items-start gap-2 mb-3">
                            <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-700">
                                En mann som het Vaccha spurte Buddha: finnes den opplyste etter
                                døden? Prøv alle fire svarene.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {SVAR.map((svar) => {
                                const brukt = proevde.includes(svar);
                                return (
                                    <motion.button
                                        key={svar}
                                        onClick={() => handleSvar(svar)}
                                        whileTap={brukt ? undefined : { scale: 0.97 }}
                                        animate={brukt ? { x: [0, -4, 4, 0] } : { x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className={`text-left text-sm rounded-xl border px-3 py-2 transition-colors ${
                                            brukt
                                                ? 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        {svar}
                                        {brukt && (
                                            <span className="block text-[11px] no-underline text-rose-500">
                                                Det gjelder ikke
                                            </span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <span className="flex items-center gap-2 font-semibold">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 14 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.span>
                                Du gikk tom for svar
                            </span>
                            <p className="mt-1">
                                Buddha avviste alle fire. I stedet spurte han hvilken retning en
                                slukket flamme hadde dratt: nord, sør, øst eller vest. Vaccha måtte
                                svare at spørsmålet ikke passer. Flammen brant så lenge den hadde
                                noe å brenne på, og da det tok slutt, sluttet den å brenne. Slik er
                                det også med den opplyste, mener buddhismen. Det er ikke svaret som
                                mangler. Det er spørsmålet som ikke griper.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={melding ?? 'tom'}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm border ${
                                melding
                                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                        >
                            {melding ??
                                'Ingen blåser ut disse flammene. Klikk på en lampe og ta bort næringen i stedet.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {alleSlukket
                        ? `${proevde.length} av ${SVAR.length} svar prøvd`
                        : `${antallSlukket} av ${LAMPER.length} ilder slukket`}
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
