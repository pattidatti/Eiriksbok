import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Check, X, RotateCcw, Sparkles, ArrowRight } from 'lucide-react';

interface SporsmaalUtenSvarProps {
    title?: string;
}

interface Kort {
    id: string;
    sporsmal: string;
    besvart: boolean;
    forklaring: string;
}

const KORT: Kort[] = [
    {
        id: 'evig',
        sporsmal: 'Er verden evig, eller har den ikke vart bestandig?',
        besvart: false,
        forklaring:
            'Dette er det første av de ti spørsmålene Malunkyaputta krevde svar på. Buddha lot det stå.',
    },
    {
        id: 'lidelse',
        sporsmal: 'Hva er lidelse?',
        besvart: true,
        forklaring: 'Dette er den første av de fire edle sannhetene. Buddha svarte tydelig på den.',
    },
    {
        id: 'grense',
        sporsmal: 'Har verden en ytterkant, eller fortsetter den uendelig?',
        besvart: false,
        forklaring:
            'Også dette står på lista over de ti. Buddha mente svaret ikke ville gjøre noen fri fra lidelse.',
    },
    {
        id: 'aarsak',
        sporsmal: 'Hvorfor oppstår lidelsen?',
        besvart: true,
        forklaring:
            'Den andre edle sannheten. Buddha pekte på tørsten, altså begjæret etter å få og å være.',
    },
    {
        id: 'sjel',
        sporsmal: 'Er sjelen og kroppen det samme, eller to ulike ting?',
        besvart: false,
        forklaring: 'Et av de ti. Buddha lot spørsmålet ligge og snakket om lidelsen i stedet.',
    },
    {
        id: 'slutt',
        sporsmal: 'Kan lidelsen ta helt slutt?',
        besvart: true,
        forklaring: 'Den tredje edle sannheten. Svaret var ja, og det er hele poenget med læren.',
    },
    {
        id: 'etter-doden',
        sporsmal: 'Finnes den opplyste videre etter døden?',
        besvart: false,
        forklaring:
            'Det siste av de ti. Buddha svarte verken ja eller nei, uansett hvor mye han ble presset.',
    },
    {
        id: 'vei',
        sporsmal: 'Hvilken vei fører ut av lidelsen?',
        besvart: true,
        forklaring: 'Den fjerde edle sannheten: den åttedelte veien. Her var Buddha helt konkret.',
    },
];

type Fase = 'spiller' | 'ferdig';

export function SporsmaalUtenSvar({ title = 'Buddhas to bunker' }: SporsmaalUtenSvarProps) {
    const [indeks, setIndeks] = useState(0);
    const [valg, setValg] = useState<boolean | null>(null);
    const [riktige, setRiktige] = useState(0);
    const [fase, setFase] = useState<Fase>('spiller');

    const kort = KORT[indeks];
    const harValgt = valg !== null;
    const riktig = harValgt && valg === kort.besvart;

    const velg = (svar: boolean) => {
        if (harValgt) return;
        setValg(svar);
        if (svar === kort.besvart) setRiktige((r) => r + 1);
    };

    const neste = () => {
        if (indeks === KORT.length - 1) {
            setFase('ferdig');
            return;
        }
        setIndeks((i) => i + 1);
        setValg(null);
    };

    const nullstill = () => {
        setIndeks(0);
        setValg(null);
        setRiktige(0);
        setFase('spiller');
    };

    const kortFarge = !harValgt
        ? { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }
        : riktig
          ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
          : { backgroundColor: '#fff1f2', borderColor: '#fecdd3' };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Legg hvert spørsmål i riktig bunke: svarte Buddha på det, eller lot han det
                        stå?
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 pt-1">
                    {KORT.map((k, i) => (
                        <motion.span
                            key={k.id}
                            animate={{
                                scale: i === indeks && fase === 'spiller' ? 1.4 : 1,
                                opacity: i <= indeks ? 1 : 0.35,
                            }}
                            className={`block w-2 h-2 rounded-full ${
                                i < indeks || fase === 'ferdig' ? 'bg-indigo-500' : 'bg-slate-300'
                            }`}
                        />
                    ))}
                </div>
            </div>

            <div className="p-5">
                <AnimatePresence mode="wait">
                    {fase === 'spiller' ? (
                        <motion.div
                            key="spill"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
                                Spørsmål {indeks + 1} av {KORT.length}
                            </p>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={kort.id}
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0, ...kortFarge }}
                                    exit={{ opacity: 0, x: -28 }}
                                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                    className="border rounded-xl px-5 py-6 text-center shadow-sm"
                                >
                                    <p className="text-lg sm:text-xl font-display text-slate-800">
                                        {kort.sporsmal}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                <motion.button
                                    whileHover={harValgt ? {} : { scale: 1.02 }}
                                    whileTap={harValgt ? {} : { scale: 0.97 }}
                                    onClick={() => velg(true)}
                                    disabled={harValgt}
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium text-left ${
                                        harValgt && kort.besvart
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 disabled:opacity-60'
                                    }`}
                                >
                                    Buddha svarte
                                    <span className="block text-xs font-normal text-slate-500">
                                        Det fører mot at lidelsen slutter
                                    </span>
                                </motion.button>
                                <motion.button
                                    whileHover={harValgt ? {} : { scale: 1.02 }}
                                    whileTap={harValgt ? {} : { scale: 0.97 }}
                                    onClick={() => velg(false)}
                                    disabled={harValgt}
                                    className={`rounded-xl border px-4 py-3 text-sm font-medium text-left ${
                                        harValgt && !kort.besvart
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                            : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 disabled:opacity-60'
                                    }`}
                                >
                                    Buddha lot det stå
                                    <span className="block text-xs font-normal text-slate-500">
                                        Det fører ikke dit
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                            className="bg-white border border-emerald-200 rounded-xl px-5 py-6 text-center shadow-sm"
                        >
                            <motion.div
                                initial={{ rotate: -30, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 12,
                                    delay: 0.1,
                                }}
                                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3"
                            >
                                <Sparkles className="w-6 h-6 text-emerald-600" />
                            </motion.div>
                            <p className="text-lg font-display text-slate-800">
                                {riktige} av {KORT.length} riktig sortert
                            </p>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm text-slate-600 mt-2 max-w-lg mx-auto"
                            >
                                Se mønsteret: alle spørsmålene Buddha svarte på, handler om lidelsen
                                og hvordan den kan ta slutt. Alle han lot stå, handler om hvor stor
                                verden er, hvor lenge den har vart og hva som skjer helt til slutt.
                                Han sorterte ikke etter hva som var vanskelig, men etter hva som
                                hjalp.
                            </motion.p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={harValgt ? `svar-${kort.id}` : `venter-${indeks}-${fase}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg px-4 py-3 text-sm flex items-start gap-2 min-h-[62px] ${
                            !harValgt || fase === 'ferdig'
                                ? 'bg-blue-50 border border-blue-200 text-blue-700'
                                : riktig
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                  : 'bg-rose-50 border border-rose-200 text-rose-700'
                        }`}
                    >
                        {fase === 'ferdig' ? (
                            <span>
                                Spørsmålene Buddha lot stå, kalte han spørsmål som ikke fører til
                                målet.
                            </span>
                        ) : !harValgt ? (
                            <span>Velg en bunke for å se hva Buddha faktisk gjorde.</span>
                        ) : (
                            <>
                                {riktig ? (
                                    <Check className="w-4 h-4 mt-0.5 shrink-0" />
                                ) : (
                                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                                )}
                                <span>{kort.forklaring}</span>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between gap-3">
                {fase === 'spiller' ? (
                    <button
                        onClick={neste}
                        disabled={!harValgt}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium inline-flex items-center gap-2"
                    >
                        {indeks === KORT.length - 1 ? 'Se mønsteret' : 'Neste spørsmål'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">Du er gjennom alle åtte kortene.</span>
                )}
                <button
                    onClick={nullstill}
                    className="text-slate-400 hover:text-slate-600 text-sm inline-flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
