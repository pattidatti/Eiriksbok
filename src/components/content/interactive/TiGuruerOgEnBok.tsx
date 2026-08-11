import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, RotateCcw, Check, X, Flame, Sparkles } from 'lucide-react';

interface TiGuruerOgEnBokProps {
    title?: string;
}

interface Paastand {
    id: number;
    text: string;
    kort: string;
    baererTittelen: boolean;
    hint: string;
}

const PAASTANDER: Paastand[] = [
    {
        id: 1,
        text: 'Ti mennesker etter hverandre, fra Guru Nanak til Guru Gobind Singh.',
        kort: 'De ti guruene',
        baererTittelen: true,
        hint: 'Riktig. Gurutittelen brukes om de ti guruene, fra Guru Nanak (1469-1539) til Guru Gobind Singh, som døde i 1708.',
    },
    {
        id: 2,
        text: 'Guruene var Gud selv, kommet ned i menneskeskikkelse.',
        kort: 'Gud i menneskeskikkelse',
        baererTittelen: false,
        hint: 'Nei. Guru Gobind Singh skrev om seg selv at han bare var Guds tjener, og advarte skarpt mot dem som kalte ham Gud.',
    },
    {
        id: 3,
        text: 'Boka Guru Granth Sahib.',
        kort: 'Boka Guru Granth Sahib',
        baererTittelen: true,
        hint: 'Riktig. I 1708 erklærte Guru Gobind Singh at boka skulle overta rollen som guru. Da fikk den navnet Guru Granth Sahib.',
    },
    {
        id: 4,
        text: 'En levende åndelig leder som sikher følger i dag.',
        kort: 'En levende leder i dag',
        baererTittelen: false,
        hint: 'Nei. Sikher aksepterer ingen levende menneskelige guruer, bare boka.',
    },
    {
        id: 5,
        text: 'En prest som har enerett på å lede gudstjenesten.',
        kort: 'En prest med enerett',
        baererTittelen: false,
        hint: 'Nei. Sikhismen har ikke presteskap. Menn og kvinner deltar sammen, og gudstjenesten er lesing og sang fra boka.',
    },
    {
        id: 6,
        text: 'Ordet guru brukes også som navn på Gud: Vaheguru betyr den vidunderlige guruen.',
        kort: 'Vaheguru, Guds navn',
        baererTittelen: true,
        hint: 'Riktig. Det vanligste navnet sikher bruker på Gud, er Vaheguru, som betyr den vidunderlige guruen.',
    },
];

const LAMPER = Array.from({ length: 10 }, (_, i) => i);

export function TiGuruerOgEnBok({ title = 'Hvem bærer guru-tittelen?' }: TiGuruerOgEnBokProps) {
    const [index, setIndex] = useState(0);
    const [svar, setSvar] = useState<Record<number, boolean>>({});
    const [feil, setFeil] = useState<string | null>(null);
    const [riktig, setRiktig] = useState<string | null>(null);
    const [rist, setRist] = useState(0);

    const ferdig = index >= PAASTANDER.length;
    const kort = ferdig ? null : PAASTANDER[index];

    const velg = (valg: boolean) => {
        if (!kort) return;
        if (valg === kort.baererTittelen) {
            setSvar((forrige) => ({ ...forrige, [kort.id]: kort.baererTittelen }));
            setRiktig(kort.hint);
            setFeil(null);
            setIndex((forrige) => forrige + 1);
        } else {
            setFeil(kort.hint);
            setRiktig(null);
            setRist((forrige) => forrige + 1);
        }
    };

    const handleReset = () => {
        setIndex(0);
        setSvar({});
        setFeil(null);
        setRiktig(null);
        setRist(0);
    };

    const iListen = PAASTANDER.filter((p) => svar[p.id] === true);
    const utenfor = PAASTANDER.filter((p) => svar[p.id] === false);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les påstanden, og avgjør om den bærer guru-tittelen i sikhismen.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-4 md:grid-cols-2">
                <div>
                    <AnimatePresence mode="wait">
                        {kort ? (
                            <motion.div
                                key={`kort-${kort.id}-${rist}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, x: feil ? [0, -8, 8, -5, 5, 0] : 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.28 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 min-h-[7.5rem]"
                            >
                                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                    Påstand {index + 1} av {PAASTANDER.length}
                                </p>
                                <p className="mt-1 text-base sm:text-lg text-slate-800 leading-snug">
                                    {kort.text}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 min-h-[7.5rem]"
                            >
                                <div className="flex items-center gap-2">
                                    <motion.span
                                        initial={{ scale: 0, rotate: -30 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            delay: 1.5,
                                            type: 'spring',
                                            stiffness: 260,
                                        }}
                                        className="text-emerald-600"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </motion.span>
                                    <p className="font-semibold text-emerald-800">
                                        Ti flammer, så en bok.
                                    </p>
                                </div>

                                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                                    {LAMPER.map((i) => (
                                        <motion.span
                                            key={i}
                                            initial={{ opacity: 0.25, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                delay: 0.1 * i,
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 18,
                                            }}
                                            className="w-6 h-6 rounded-full bg-white border border-amber-300 grid place-items-center shadow-sm"
                                        >
                                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                                        </motion.span>
                                    ))}
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 1.2 }}
                                        className="text-amber-500 text-sm font-semibold px-1"
                                    >
                                        →
                                    </motion.span>
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            boxShadow: [
                                                '0 0 0 0 rgba(245,158,11,0)',
                                                '0 0 0 8px rgba(245,158,11,0.18)',
                                                '0 0 0 0 rgba(245,158,11,0)',
                                            ],
                                        }}
                                        transition={{
                                            delay: 1.35,
                                            duration: 0.9,
                                            type: 'tween',
                                        }}
                                        className="w-9 h-9 rounded-lg bg-amber-500 text-white grid place-items-center"
                                    >
                                        <BookOpen className="w-5 h-5" />
                                    </motion.span>
                                </div>

                                <p className="mt-3 text-sm text-emerald-700 leading-snug">
                                    Guru Gobind Singh pekte ikke ut en ellevte person. Han lot boka
                                    overta rollen i 1708. Siden da har sikher ingen levende
                                    menneskelig guru.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <motion.button
                            type="button"
                            onClick={() => velg(true)}
                            disabled={ferdig}
                            whileHover={ferdig ? undefined : { y: -2 }}
                            whileTap={ferdig ? undefined : { scale: 0.97 }}
                            className="rounded-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-default"
                        >
                            Bærer tittelen
                        </motion.button>
                        <motion.button
                            type="button"
                            onClick={() => velg(false)}
                            disabled={ferdig}
                            whileHover={ferdig ? undefined : { y: -2 }}
                            whileTap={ferdig ? undefined : { scale: 0.97 }}
                            className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-default"
                        >
                            Bærer den ikke
                        </motion.button>
                    </div>
                </div>

                <div className="grid gap-3">
                    <div className="rounded-xl rounded-t-[2rem] border-2 border-amber-200 bg-amber-50 px-4 pt-4 pb-3 min-h-[8.5rem]">
                        <p className="text-sm font-semibold text-amber-800 leading-tight">
                            Bærer guru-tittelen
                        </p>
                        <div className="mt-2 space-y-1.5">
                            <AnimatePresence>
                                {iListen.map((p) => (
                                    <motion.p
                                        key={p.id}
                                        initial={{ opacity: 0, y: -8, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                        className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-xs leading-tight text-amber-800"
                                    >
                                        {p.kort}
                                    </motion.p>
                                ))}
                            </AnimatePresence>
                            {iListen.length === 0 && (
                                <p className="text-xs text-amber-700/70 leading-snug">
                                    Tre av de seks hører hjemme her.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 min-h-[7rem]">
                        <p className="text-sm font-semibold text-slate-600 leading-tight">
                            Bærer den ikke
                        </p>
                        <div className="mt-2 space-y-1.5">
                            <AnimatePresence>
                                {utenfor.map((p) => (
                                    <motion.p
                                        key={p.id}
                                        initial={{ opacity: 0, y: -8, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs leading-tight text-slate-600"
                                    >
                                        {p.kort}
                                    </motion.p>
                                ))}
                            </AnimatePresence>
                            {utenfor.length === 0 && (
                                <p className="text-xs text-slate-400 leading-snug">
                                    Her havner det sikher ikke kaller guru.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feil ? `feil-${rist}` : riktig ? `riktig-${index}` : 'tom'}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                            feil
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : riktig
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {feil ? (
                            <X className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : riktig ? (
                            <Check className="w-4 h-4 mt-0.5 shrink-0" />
                        ) : (
                            <BookOpen className="w-4 h-4 mt-0.5 shrink-0" />
                        )}
                        <span>
                            {feil ??
                                riktig ??
                                'Guru betyr lærer. I sikhismen er det ikke bare mennesker som kan bære tittelen.'}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {Object.keys(svar).length} av {PAASTANDER.length} avgjort
                </p>
                <button
                    type="button"
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
