import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Factory,
    Flame,
    Hammer,
    Users,
    Ship,
    Coins,
    Scale,
    RotateCcw,
    Check,
    X,
} from 'lucide-react';

const ICONS = {
    flame: Flame,
    hammer: Hammer,
    users: Users,
    ship: Ship,
    coins: Coins,
    scale: Scale,
} as const;

type IconKey = keyof typeof ICONS;

interface Ingrediens {
    id: string;
    navn: string;
    icon: IconKey;
    /** Kort forklaring av hva Storbritannia faktisk hadde. */
    hadde: string;
    /** Hva som stopper opp hvis denne mangler. */
    mangler: string;
}

interface RevolusjonsOppskriftenProps {
    title?: string;
    ingredienser?: Ingrediens[];
}

const STANDARD: Ingrediens[] = [
    {
        id: 'kull',
        navn: 'Kull i bakken',
        icon: 'flame',
        hadde: 'Kullet lå grunt og tett ved havner og elver.',
        mangler: 'Uten billig kull blir det for dyrt å fyre dampmaskinene. Maskinene står stille.',
    },
    {
        id: 'jern',
        navn: 'Billig jern',
        icon: 'hammer',
        hadde: 'Fra 1783 kunne jern smeltes med kull i stedet for trekull.',
        mangler: 'Uten billig jern kan ingen bygge maskiner, skinner og fabrikkhaller.',
    },
    {
        id: 'hender',
        navn: 'Ledige hender',
        icon: 'users',
        hadde: 'Småbønder mistet allmenningene og måtte finne arbeid andre steder.',
        mangler: 'Uten folk som trenger lønnsarbeid står fabrikkene tomme.',
    },
    {
        id: 'marked',
        navn: 'Marked og kolonier',
        icon: 'ship',
        hadde: 'Skip og kolonier ga råvarer inn og kjøpere til varene ut.',
        mangler: 'Uten kjøpere er det ingen vits i å lage tusen ganger mer enn før.',
    },
    {
        id: 'penger',
        navn: 'Penger å satse',
        icon: 'coins',
        hadde: 'Handelsmenn hadde formuer de kunne risikere på maskiner.',
        mangler: 'Uten penger å satse blir en god idé aldri til en fabrikk.',
    },
    {
        id: 'lover',
        navn: 'Stabile lover',
        icon: 'scale',
        hadde: 'Parlamentet styrte skatter og lover, og patenter ble beskyttet.',
        mangler: 'Uten trygge lover tør ingen bygge noe kongen kan ta fra dem.',
    },
];

export function RevolusjonsOppskriften({
    title = 'Oppskriften på en revolusjon',
    ingredienser = STANDARD,
}: RevolusjonsOppskriftenProps) {
    const [av, setAv] = useState<string[]>([]);

    const toggle = (id: string) =>
        setAv((forrige) =>
            forrige.includes(id) ? forrige.filter((x) => x !== id) : [...forrige, id]
        );

    const handleReset = () => setAv([]);

    const paaPlass = ingredienser.length - av.length;
    const komplett = av.length === 0;
    const manglende = ingredienser.filter((i) => av.includes(i.id));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Factory className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk bort en forutsetning og se om revolusjonen fortsatt starter.
                    </p>
                </div>
            </div>

            {/* Primaer interaksjonsflate */}
            <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ingredienser.map((ing) => {
                    const Ikon = ICONS[ing.icon] ?? Flame;
                    const erAv = av.includes(ing.id);
                    return (
                        <motion.button
                            key={ing.id}
                            onClick={() => toggle(ing.id)}
                            animate={erAv ? { scale: 0.97 } : { scale: 1 }}
                            whileHover={{ scale: erAv ? 0.99 : 1.02 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                            aria-pressed={!erAv}
                            className={`text-left rounded-xl border p-4 transition-colors ${
                                erAv
                                    ? 'bg-slate-50 border-slate-200'
                                    : 'bg-white border-indigo-200 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                        erAv ? 'bg-slate-200' : 'bg-indigo-50'
                                    }`}
                                >
                                    <Ikon
                                        className={`h-5 w-5 ${erAv ? 'text-slate-400' : 'text-indigo-600'}`}
                                    />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`font-semibold ${
                                                erAv
                                                    ? 'text-slate-400 line-through'
                                                    : 'text-slate-800'
                                            }`}
                                        >
                                            {ing.navn}
                                        </span>
                                        {erAv ? (
                                            <X className="h-4 w-4 text-slate-400 shrink-0" />
                                        ) : (
                                            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                                        )}
                                    </div>
                                    <p
                                        className={`mt-1 text-sm ${
                                            erAv ? 'text-slate-400' : 'text-slate-600'
                                        }`}
                                    >
                                        {erAv ? ing.mangler : ing.hadde}
                                    </p>
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {komplett ? (
                        <motion.div
                            key="komplett"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <motion.span
                                    initial={{ scale: 0.4, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 320,
                                        damping: 12,
                                    }}
                                    className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100"
                                >
                                    <Factory className="h-5 w-5 text-emerald-600" />
                                </motion.span>
                                <div>
                                    <p className="font-semibold text-emerald-800">
                                        Alt ligger på plass. Revolusjonen starter.
                                    </p>
                                    <p className="text-sm text-emerald-700">
                                        Storbritannia, rundt 1760. Ingen andre steder hadde alle
                                        seks samtidig.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-1">
                                {ingredienser.map((ing, i) => (
                                    <motion.span
                                        key={ing.id}
                                        initial={{ scaleY: 0.2, opacity: 0 }}
                                        animate={{ scaleY: 1, opacity: 1 }}
                                        transition={{ delay: i * 0.06 }}
                                        className="h-2 flex-1 origin-bottom rounded-full bg-emerald-400"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`mangler-${av.join('-')}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3"
                        >
                            <p className="font-semibold text-rose-800">
                                Revolusjonen stopper opp.
                            </p>
                            <ul className="mt-1 space-y-1">
                                {manglende.map((ing) => (
                                    <li key={ing.id} className="text-sm text-rose-700">
                                        {ing.mangler}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-slate-600">
                    {paaPlass} av {ingredienser.length} forutsetninger på plass
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
