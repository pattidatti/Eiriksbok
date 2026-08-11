import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Check, KeyRound, Lock, Unlock, Plus } from 'lucide-react';

interface KanonenSomIkkeErLukketProps {
    title?: string;
}

type Phase = 'idle' | 'blocked' | 'open';

interface Nokkel {
    id: string;
    label: string;
    hint: string;
    mangler: string;
}

const NOKLER: Nokkel[] = [
    {
        id: 'president',
        label: 'Åpenbaring til kirkens president',
        hint: 'Kirken lærer at Gud fortsatt taler, og at presidenten er profeten som tar imot.',
        mangler: 'Ingen åpenbaring til kirkens president. Da finnes det ikke noe å legge fram.',
    },
    {
        id: 'apostler',
        label: 'De tolv apostlers quorum slutter seg til',
        hint: 'Presidenten legger saken fram for rådgiverne sine og for de tolv apostlene.',
        mangler: 'De tolv apostlene har ikke sluttet seg til. Presidenten avgjør ikke alene.',
    },
    {
        id: 'samtykke',
        label: 'Medlemmene stemmer: felles samtykke',
        hint: 'Teksten legges fram på en generalkonferanse, og medlemmene rekker opp hånden.',
        mangler: 'Medlemmene har ikke stemt. Uten felles samtykke blir teksten stående utenfor.',
    },
];

const STANDARDVERK = ['Bibelen', 'Mormons bok', 'Lære og pakter', 'Den kostelige perle'];

export function KanonenSomIkkeErLukket({
    title = 'Hva må til for at en ny tekst kommer inn?',
}: KanonenSomIkkeErLukketProps) {
    const [aktive, setAktive] = useState<Record<string, boolean>>({});
    const [phase, setPhase] = useState<Phase>('idle');
    const [ristTeller, setRistTeller] = useState(0);

    const antall = NOKLER.filter((n) => aktive[n.id]).length;
    const alle = antall === NOKLER.length;
    const apen = phase === 'open';

    const veksle = (id: string) => {
        if (apen) return;
        setAktive((forrige) => ({ ...forrige, [id]: !forrige[id] }));
        setPhase('idle');
    };

    const provAApne = () => {
        if (alle) {
            setPhase('open');
        } else {
            setPhase('blocked');
            setRistTeller((n) => n + 1);
        }
    };

    const tilbakestill = () => {
        setAktive({});
        setPhase('idle');
        setRistTeller(0);
    };

    const manglende = NOKLER.filter((n) => !aktive[n.id]);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Skru på nøklene du tror trengs, og trykk «Prøv å åpne».
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                    {NOKLER.map((n) => {
                        const på = Boolean(aktive[n.id]);
                        return (
                            <motion.button
                                key={n.id}
                                type="button"
                                onClick={() => veksle(n.id)}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full text-left rounded-xl border p-3 transition-colors ${
                                    på
                                        ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className="flex items-start gap-3">
                                    <motion.span
                                        animate={{ rotate: på ? 0 : -20, scale: på ? 1.05 : 1 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                            på
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white text-slate-400 border border-slate-200'
                                        }`}
                                    >
                                        {på ? (
                                            <Check className="w-4 h-4" />
                                        ) : (
                                            <KeyRound className="w-4 h-4" />
                                        )}
                                    </motion.span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-medium text-slate-800">
                                            {n.label}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-slate-500">
                                            {n.hint}
                                        </span>
                                    </span>
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Standardverkene
                        </span>
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                alle
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                            {antall} av 3 nøkler
                        </span>
                    </div>

                    <motion.div
                        key={ristTeller}
                        animate={ristTeller > 0 ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                        transition={{ duration: 0.4 }}
                        className="relative"
                        style={{ perspective: 900 }}
                    >
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-white p-3">
                            {STANDARDVERK.map((bok) => (
                                <div
                                    key={bok}
                                    className="rounded-md border border-indigo-100 bg-indigo-50 px-2 py-3 text-center text-xs font-medium text-indigo-700"
                                >
                                    {bok}
                                </div>
                            ))}
                            <div className="col-span-2 rounded-md border border-dashed border-slate-300 px-2 py-3 text-center">
                                <AnimatePresence mode="wait" initial={false}>
                                    {apen ? (
                                        <motion.span
                                            key="fylt"
                                            initial={{ opacity: 0, scale: 0.85 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 16,
                                            }}
                                            className="block text-xs font-semibold text-emerald-700"
                                        >
                                            Offisiell erklæring 2, tatt inn i Lære og pakter i 1978
                                        </motion.span>
                                    ) : (
                                        <motion.span
                                            key="tom"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex items-center justify-center gap-1 text-xs text-slate-400"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Plass til mer
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <motion.div
                            initial={false}
                            animate={{ rotateY: apen ? -108 : 0, opacity: apen ? 0.12 : 1 }}
                            transition={{ type: 'spring', stiffness: 110, damping: 17 }}
                            style={{ transformOrigin: 'left center' }}
                            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-100/95"
                        >
                            {apen ? (
                                <Unlock className="h-6 w-6 text-indigo-600" />
                            ) : (
                                <Lock className="h-6 w-6 text-indigo-500" />
                            )}
                            <span className="text-xs font-medium text-indigo-700">
                                Samlingen er ikke lukket
                            </span>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <div className="mx-5 mb-4">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={phase + antall}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            phase === 'open'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : phase === 'blocked'
                                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {phase === 'open' && (
                            <span>
                                Alle tre trinnene er på plass. Slik gikk det til i 1978: kirkens
                                president Spencer W. Kimball kunngjorde en åpenbaring om at alle
                                verdige mannlige medlemmer kunne ordineres til prestedømmet uten
                                hensyn til rase eller farge. De tolv apostlene sluttet seg til, og
                                30. september 1978 stemte medlemmene over teksten på en
                                generalkonferanse. Den står i dag i Lære og pakter som Offisiell
                                erklæring 2.
                            </span>
                        )}
                        {phase === 'blocked' && (
                            <span>
                                Skapet holder seg lukket.{' '}
                                {manglende.map((n) => n.mangler).join(' ')}
                            </span>
                        )}
                        {phase === 'idle' && (
                            <span>
                                De fire bøkene på hylla kalles standardverkene. Kirken lærer at det
                                kan komme mer. Hva må til før en ny tekst får plass?
                            </span>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center justify-between px-5 pb-5">
                <button
                    type="button"
                    onClick={provAApne}
                    disabled={apen}
                    className="rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-emerald-600"
                >
                    {apen ? 'Åpnet' : 'Prøv å åpne'}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
