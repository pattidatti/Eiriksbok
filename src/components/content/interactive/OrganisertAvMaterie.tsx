import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Boxes,
    Check,
    Droplets,
    Mountain,
    RotateCcw,
    Sparkles,
    Sprout,
    Sun,
    Wind,
} from 'lucide-react';

interface OrganisertAvMaterieProps {
    title?: string;
}

type Modus = 'intet' | 'organisere';

const ELEMENTER = [
    { id: 'lys', navn: 'Lys', Ikon: Sun },
    { id: 'vann', navn: 'Vann', Ikon: Droplets },
    { id: 'jord', navn: 'Jord', Ikon: Mountain },
    { id: 'luft', navn: 'Luft', Ikon: Wind },
    { id: 'liv', navn: 'Liv', Ikon: Sprout },
    { id: 'aand', navn: 'Ånd', Ikon: Sparkles },
];

const MODUSER: { id: Modus; etikett: string; undertekst: string }[] = [
    {
        id: 'intet',
        etikett: 'Skapt av intet',
        undertekst: 'Slik de fleste kristne kirker forklarer det. Ingenting finnes på forhånd.',
    },
    {
        id: 'organisere',
        etikett: 'Organisert av materie',
        undertekst: 'Slik siste dagers hellige forklarer det. Elementene finnes fra evighet.',
    },
];

export function OrganisertAvMaterie({
    title = 'Skape av intet, eller organisere?',
}: OrganisertAvMaterieProps) {
    const [modus, setModus] = useState<Modus>('organisere');
    const [plassert, setPlassert] = useState<string[]>([]);

    const ferdig = plassert.length === ELEMENTER.length;
    const valgtModus = MODUSER.find((m) => m.id === modus) ?? MODUSER[1];
    const materieTotalt = modus === 'organisere' ? ELEMENTER.length : plassert.length;

    const byttModus = (ny: Modus) => {
        setModus(ny);
        setPlassert([]);
    };

    const plasser = (id: string) => {
        setPlassert((forrige) => (forrige.includes(id) ? forrige : [...forrige, id]));
    };

    const fullfoer = () => {
        setPlassert(ELEMENTER.map((e) => e.id));
    };

    const tilbakestill = () => {
        setPlassert([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Boxes className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg forklaring, bygg jorda, og følg med på telleren nederst.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5">
                <div className="flex flex-wrap gap-2">
                    {MODUSER.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => byttModus(m.id)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                modus === m.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {m.etikett}
                        </button>
                    ))}
                </div>
                <p className="mt-2 text-sm text-slate-500">{valgtModus.undertekst}</p>
            </div>

            <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Før skapelsen
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        {modus === 'organisere'
                            ? 'Elementene ligger her og har alltid gjort det. Klikk for å sette dem på plass.'
                            : 'Her er det tomt. Klikk på en tom plass, så blir elementet til av ingenting.'}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {ELEMENTER.map(({ id, navn, Ikon }) => {
                            const erPlassert = plassert.includes(id);
                            if (erPlassert) {
                                return (
                                    <div
                                        key={id}
                                        className="h-20 rounded-xl border border-dashed border-slate-200"
                                    />
                                );
                            }
                            if (modus === 'intet') {
                                return (
                                    <button
                                        key={id}
                                        onClick={() => plasser(id)}
                                        className="h-20 rounded-xl border border-dashed border-slate-300 bg-white/60 flex flex-col items-center justify-center gap-1 text-slate-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors"
                                    >
                                        <Ikon className="w-5 h-5" />
                                        <span className="text-xs font-medium">finnes ikke</span>
                                    </button>
                                );
                            }
                            return (
                                <motion.button
                                    key={id}
                                    layoutId={`materie-${id}`}
                                    onClick={() => plasser(id)}
                                    whileHover={{ y: -3 }}
                                    whileTap={{ scale: 0.94 }}
                                    className="h-20 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 text-slate-700"
                                >
                                    <Ikon className="w-5 h-5 text-indigo-500" />
                                    <span className="text-xs font-medium">{navn}</span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                <motion.div
                    animate={ferdig ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-xl border p-4 ${
                        ferdig ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
                    }`}
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Jorda
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                        {ferdig
                            ? 'Ferdig ordnet. Alt har fått sin plass.'
                            : 'Her settes elementene sammen til en verden.'}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                        {ELEMENTER.map(({ id, navn, Ikon }) => {
                            if (!plassert.includes(id)) {
                                return (
                                    <div
                                        key={id}
                                        className="h-20 rounded-xl border border-dashed border-slate-200"
                                    />
                                );
                            }
                            return (
                                <motion.div
                                    key={id}
                                    layoutId={modus === 'organisere' ? `materie-${id}` : undefined}
                                    initial={modus === 'intet' ? { scale: 0, opacity: 0 } : false}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                                    className="h-20 rounded-xl border border-indigo-200 bg-indigo-50 flex flex-col items-center justify-center gap-1 text-indigo-700"
                                >
                                    <Ikon className="w-5 h-5" />
                                    <span className="text-xs font-medium">{navn}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            <div className="px-6">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-blue-700">
                        Mengde materie i universet
                    </span>
                    <div className="flex items-baseline gap-2">
                        <AnimatePresence mode="popLayout">
                            <motion.span
                                key={materieTotalt}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="text-2xl font-bold text-blue-700 tabular-nums"
                            >
                                {materieTotalt}
                            </motion.span>
                        </AnimatePresence>
                        <span className="text-sm text-blue-600">av 6</span>
                    </div>
                </div>
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key={`ferdig-${modus}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3"
                        >
                            <Check className="w-5 h-5 shrink-0" />
                            <span>
                                {modus === 'organisere'
                                    ? 'Jorda er ferdig, og telleren har stått på 6 hele veien. Ingenting nytt kom til. Elementene fantes fra før, og Gud ordnet dem. Slik forklarer siste dagers hellige skapelsen.'
                                    : 'Jorda er ferdig, og telleren gikk fra 0 til 6. Alt du ser ble til av ingenting. Dette er creatio ex nihilo, læren de fleste andre kristne kirker holder fast ved.'}
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`igang-${modus}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            {plassert.length === 0
                                ? 'Klikk på et element til venstre for å begynne.'
                                : `${plassert.length} av 6 er på plass. Se hva telleren gjør underveis.`}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 py-5 flex items-center justify-between">
                <button
                    onClick={fullfoer}
                    disabled={ferdig}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Fullfør jorda
                </button>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1.5 transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
