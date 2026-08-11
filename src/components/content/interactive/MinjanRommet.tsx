import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, RotateCcw, Sparkles, User, Users } from 'lucide-react';

interface MinjanRommetProps {
    title?: string;
}

type Slag = 'mann' | 'kvinne' | 'barn';
type Retning = 'ortodoks' | 'likestilt';

interface Person {
    id: number;
    slag: Slag;
}

const PERSONER: Person[] = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: i, slag: 'mann' as Slag })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: 10 + i, slag: 'kvinne' as Slag })),
    { id: 13, slag: 'barn' as Slag },
];

const ETIKETT: Record<Slag, string> = {
    mann: 'Mann',
    kvinne: 'Kvinne',
    barn: 'Barn',
};

const RETNINGER: { id: Retning; navn: string; under: string }[] = [
    { id: 'ortodoks', navn: 'Ortodoks tradisjon', under: 'Ti voksne menn' },
    {
        id: 'likestilt',
        navn: 'Reform og rekonstruksjonisme',
        under: 'Ti voksne, kvinner teller med',
    },
];

const KRAV = 10;

function tellerMed(slag: Slag, retning: Retning): boolean {
    return retning === 'ortodoks' ? slag === 'mann' : slag !== 'barn';
}

export function MinjanRommet({ title = 'Minjanrommet' }: MinjanRommetProps) {
    const [retning, setRetning] = useState<Retning>('ortodoks');
    const [inne, setInne] = useState<number[]>([]);

    const personerInne = PERSONER.filter((p) => inne.includes(p.id));
    const antall = personerInne.filter((p) => tellerMed(p.slag, retning)).length;
    const utenfor = PERSONER.filter((p) => !inne.includes(p.id));
    const fullMinjan = antall >= KRAV;

    const kvinnerUtenomTelling =
        retning === 'ortodoks' && personerInne.some((p) => p.slag === 'kvinne');
    const barnInne = personerInne.some((p) => p.slag === 'barn');

    const veksle = (id: number) => {
        setInne((forrige) =>
            forrige.includes(id) ? forrige.filter((x) => x !== id) : [...forrige, id]
        );
    };

    const slippInnNeste = () => {
        const neste = utenfor[0];
        if (neste) setInne((forrige) => [...forrige, neste.id]);
    };

    const nullstill = () => {
        setInne([]);
        setRetning('ortodoks');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk folk inn i synagogen. Hva skjer når den tiende teller med?
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                    {RETNINGER.map((r) => {
                        const aktiv = r.id === retning;
                        return (
                            <motion.button
                                key={r.id}
                                type="button"
                                onClick={() => setRetning(r.id)}
                                whileTap={{ scale: 0.98 }}
                                className={`rounded-xl border px-4 py-2.5 text-left transition-colors ${
                                    aktiv
                                        ? 'bg-indigo-50 border-indigo-300 shadow-md'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                                }`}
                            >
                                <span
                                    className={`block text-sm font-medium ${
                                        aktiv ? 'text-indigo-900' : 'text-slate-700'
                                    }`}
                                >
                                    {r.navn}
                                </span>
                                <span className="block text-xs text-slate-500">{r.under}</span>
                            </motion.button>
                        );
                    })}
                </div>
                <p className="mt-2 text-xs text-slate-500">
                    Konservativ jødedom lar hver menighet bestemme selv om kvinner skal telle med.
                </p>
            </div>

            <div className="px-5 pt-4 flex flex-wrap items-center gap-3">
                <div className="flex gap-1.5">
                    {Array.from({ length: KRAV }, (_, i) => {
                        const fylt = i < antall;
                        return (
                            <motion.span
                                key={i}
                                animate={
                                    fullMinjan
                                        ? { scale: [1, 1.35, 1] }
                                        : { scale: fylt ? 1 : 0.85 }
                                }
                                transition={
                                    fullMinjan
                                        ? { duration: 0.4, delay: i * 0.05 }
                                        : { type: 'spring', stiffness: 400, damping: 16 }
                                }
                                className={`w-6 h-6 rounded-full border-2 ${
                                    fylt
                                        ? 'bg-emerald-400 border-emerald-500'
                                        : 'bg-slate-100 border-slate-300'
                                }`}
                            />
                        );
                    })}
                </div>
                <AnimatePresence mode="wait">
                    <motion.span
                        key={fullMinjan ? 'offentlig' : 'privat'}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            fullMinjan
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {fullMinjan ? 'Offentlig gudstjeneste' : 'Privat bønn'}
                    </motion.span>
                </AnimatePresence>
            </div>

            <div className="px-5 pt-4 grid grid-cols-5 sm:grid-cols-7 gap-2">
                {PERSONER.map((p) => {
                    const erInne = inne.includes(p.id);
                    const teller = erInne && tellerMed(p.slag, retning);
                    const Ikon = p.slag === 'barn' ? Baby : User;
                    return (
                        <motion.button
                            key={p.id}
                            type="button"
                            onClick={() => veksle(p.id)}
                            whileTap={{ scale: 0.92 }}
                            animate={{ y: erInne ? -4 : 0 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                            className={`rounded-xl border px-1 py-2 flex flex-col items-center gap-1 ${
                                teller
                                    ? 'bg-emerald-50 border-emerald-300 shadow-md'
                                    : erInne
                                      ? 'bg-amber-50 border-amber-300 shadow-md'
                                      : 'bg-slate-50 border-slate-200 hover:bg-white shadow-sm'
                            }`}
                        >
                            <Ikon
                                className={`w-5 h-5 ${
                                    teller
                                        ? 'text-emerald-600'
                                        : erInne
                                          ? 'text-amber-600'
                                          : 'text-slate-400'
                                }`}
                            />
                            <span
                                className={`text-[11px] leading-none ${
                                    erInne ? 'text-slate-700' : 'text-slate-500'
                                }`}
                            >
                                {ETIKETT[p.slag]}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={fullMinjan ? 'ferdig' : antall === 0 ? 'tom' : 'underveis'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            fullMinjan
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        {fullMinjan ? (
                            <span className="flex items-start gap-2">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                    className="mt-0.5 shrink-0"
                                >
                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                </motion.span>
                                <span>
                                    Ti voksne teller med. Nå regnes samlingen ikke lenger som privat
                                    bønn, men som offentlig gudstjeneste. Ingen nye ord er sagt. Det
                                    eneste som er annerledes, er hvor mange som er der.
                                </span>
                            </span>
                        ) : antall === 0 ? (
                            <span>
                                Ingen som teller med er inne ennå. Alle kan be alene, men ti voksne
                                skal til før samlingen regnes som offentlig gudstjeneste.
                            </span>
                        ) : (
                            <span>
                                {antall} av {KRAV} teller med. De som er inne kan be, men samlingen
                                regnes fortsatt som privat bønn.
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {(kvinnerUtenomTelling || barnInne) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pt-2"
                    >
                        <p className="text-xs text-amber-700">
                            {kvinnerUtenomTelling
                                ? 'De gule er til stede og ber, men telles ikke med. I ortodoks tradisjon er det ti voksne menn som utgjør en minjan. '
                                : ''}
                            {barnInne
                                ? 'Barn som ikke er religiøst myndige ennå, teller ikke med i noen av retningene.'
                                : ''}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={slippInnNeste}
                    disabled={utenfor.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Slipp inn neste
                </button>
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
