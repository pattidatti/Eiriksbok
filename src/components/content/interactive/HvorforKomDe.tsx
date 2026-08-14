import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoorOpen, Briefcase, Home, LifeBuoy, Check, X, RotateCcw, Sparkles } from 'lucide-react';

type Grunn = 'arbeid' | 'familie' | 'flukt';

interface Bolge {
    aar: string;
    scene: string;
    fasit: Grunn;
    forklaring: string;
}

interface HvorforKomDeProps {
    title?: string;
    bolger?: Bolge[];
}

type Phase = 'spor' | 'svart' | 'ferdig';

const DORER: { id: Grunn; label: string; ikon: typeof Briefcase; farge: string }[] = [
    { id: 'arbeid', label: 'Arbeid', ikon: Briefcase, farge: 'amber' },
    { id: 'familie', label: 'Familie', ikon: Home, farge: 'violet' },
    { id: 'flukt', label: 'Flukt', ikon: LifeBuoy, farge: 'sky' },
];

const STANDARD_BOLGER: Bolge[] = [
    {
        aar: '1967-1975',
        scene: 'Norske fabrikker mangler folk. Unge menn fra Pakistan, Tyrkia og Jugoslavia tar jobbene ingen andre vil ha.',
        fasit: 'arbeid',
        forklaring:
            'Norge hadde full sysselsetting og trengte hender. De ble kalt fremmedarbeidere, og de fleste var menn som kom alene.',
    },
    {
        aar: '1975-1985',
        scene: 'Stortinget har stengt for nye arbeidstillatelser. Likevel vokser tallet på nye innbyggere.',
        fasit: 'familie',
        forklaring:
            'Innvandringsstoppen gjaldt arbeid. De som allerede bodde her, kunne fortsatt hente kone og barn. Da ble menn som kom alene til familier som ble.',
    },
    {
        aar: '1993 og 1999',
        scene: 'Jugoslavia faller fra hverandre. Byer blir beleiret, og folk må ut av landet på dagen.',
        fasit: 'flukt',
        forklaring:
            'Krigene på Balkan sendte to store flyktninggrupper til Norge: bosniere i 1993 og kosovoalbanere i 1999.',
    },
    {
        aar: '2004 og utover',
        scene: 'EU utvider seg østover. Snart står det polsk på byggeplasser fra Kristiansand til Tromsø.',
        fasit: 'arbeid',
        forklaring:
            'Da Polen og Litauen ble EU-land, fikk borgerne deres rett til å jobbe i Norge. Dette ble den største arbeidsinnvandringen i norsk historie.',
    },
    {
        aar: '2015',
        scene: 'Krigen i Syria er inne i sitt femte år. Denne sommeren kommer det flere asylsøkere til Europa enn på svært lenge.',
        fasit: 'flukt',
        forklaring:
            'Syrere og afghanere søkte asyl i rekordtall sommeren 2015. Etterpå strammet Norge inn grensekontrollen.',
    },
    {
        aar: '2022',
        scene: 'Russland angriper Ukraina. Tog fulle av kvinner og barn ruller vestover.',
        fasit: 'flukt',
        forklaring:
            'Ukrainerne fikk kollektiv beskyttelse, altså opphold uten vanlig asylbehandling. På to år ble de en av de største gruppene i landet.',
    },
];

const DOR_STIL: Record<string, { hvile: string; hover: string }> = {
    amber: {
        hvile: 'border-amber-200 bg-amber-50 text-amber-800',
        hover: 'hover:border-amber-400 hover:bg-amber-100',
    },
    violet: {
        hvile: 'border-violet-200 bg-violet-50 text-violet-800',
        hover: 'hover:border-violet-400 hover:bg-violet-100',
    },
    sky: {
        hvile: 'border-sky-200 bg-sky-50 text-sky-800',
        hover: 'hover:border-sky-400 hover:bg-sky-100',
    },
};

export function HvorforKomDe({
    title = 'Hvorfor kom de?',
    bolger = STANDARD_BOLGER,
}: HvorforKomDeProps) {
    const [indeks, setIndeks] = useState(0);
    const [valg, setValg] = useState<Grunn | null>(null);
    const [phase, setPhase] = useState<Phase>('spor');
    const [riktige, setRiktige] = useState(0);

    const bolge = bolger[Math.min(indeks, bolger.length - 1)];
    const traff = valg === bolge.fasit;

    const velg = (grunn: Grunn) => {
        if (phase !== 'spor') return;
        setValg(grunn);
        setPhase('svart');
        if (grunn === bolge.fasit) setRiktige((r) => r + 1);
    };

    const neste = () => {
        if (indeks + 1 >= bolger.length) {
            setPhase('ferdig');
            return;
        }
        setIndeks((i) => i + 1);
        setValg(null);
        setPhase('spor');
    };

    const handleReset = () => {
        setIndeks(0);
        setValg(null);
        setRiktige(0);
        setPhase('spor');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <DoorOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les året, og klikk døra folk kom gjennom.
                    </p>
                </div>
                <div className="ml-auto hidden sm:flex items-center gap-1.5">
                    {bolger.map((b, i) => (
                        <span
                            key={b.aar}
                            className={`h-2 w-2 rounded-full ${
                                i < indeks || phase === 'ferdig'
                                    ? 'bg-indigo-500'
                                    : i === indeks
                                      ? 'bg-indigo-300'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {phase === 'ferdig' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    className="p-6 text-center"
                >
                    <motion.div
                        initial={{ rotate: -12, scale: 0.6 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 12 }}
                        className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3"
                    >
                        <Sparkles className="w-7 h-7 text-emerald-600" />
                    </motion.div>
                    <p className="text-lg font-semibold text-slate-800">
                        {riktige} av {bolger.length} riktige
                    </p>
                    <p className="mt-2 text-slate-600 max-w-lg mx-auto">
                        Seks bølger, tre dører. Legg merke til at Norge sjelden bestemte
                        rekkefølgen selv: hver gang var det noe som skjedde ute i verden som
                        avgjorde hvem som banket på.
                    </p>
                    <button
                        onClick={handleReset}
                        className="mt-5 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> Prøv igjen
                    </button>
                </motion.div>
            ) : (
                <>
                    {/* Primær interaksjonsflate */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={bolge.aar}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.22 }}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-5"
                            >
                                <span className="inline-block text-xs font-semibold tracking-wide uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                                    {bolge.aar}
                                </span>
                                <p className="mt-3 text-slate-700 leading-relaxed">
                                    {bolge.scene}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {DORER.map((dor) => {
                                const Ikon = dor.ikon;
                                const stil = DOR_STIL[dor.farge];
                                const erValgt = valg === dor.id;
                                const erFasit = bolge.fasit === dor.id;
                                const vist = phase === 'svart';

                                let klasser = `${stil.hvile} ${phase === 'spor' ? stil.hover : ''}`;
                                if (vist && erFasit)
                                    klasser = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                                else if (vist && erValgt)
                                    klasser = 'border-rose-300 bg-rose-50 text-rose-800';
                                else if (vist) klasser = 'border-slate-200 bg-white text-slate-400';

                                return (
                                    <motion.button
                                        key={dor.id}
                                        onClick={() => velg(dor.id)}
                                        disabled={phase !== 'spor'}
                                        whileHover={phase === 'spor' ? { y: -3 } : undefined}
                                        whileTap={phase === 'spor' ? { scale: 0.97 } : undefined}
                                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 font-semibold transition-colors ${klasser} ${
                                            phase === 'spor' ? 'cursor-pointer' : 'cursor-default'
                                        }`}
                                    >
                                        <Ikon className="w-6 h-6" />
                                        <span>{dor.label}</span>
                                        {vist && erFasit && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{
                                                    type: 'spring',
                                                    stiffness: 320,
                                                    damping: 14,
                                                }}
                                                className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1"
                                            >
                                                <Check className="w-3.5 h-3.5" />
                                            </motion.span>
                                        )}
                                        {vist && erValgt && !erFasit && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </motion.span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback-sone */}
                    <div className="mx-6 mb-4">
                        <AnimatePresence mode="wait">
                            {phase === 'svart' ? (
                                <motion.div
                                    key={`svar-${bolge.aar}`}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`px-4 py-3 rounded-lg border text-sm leading-relaxed ${
                                        traff
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                            : 'bg-rose-50 border-rose-200 text-rose-800'
                                    }`}
                                >
                                    <strong className="font-semibold">
                                        {traff ? 'Riktig. ' : `Nei, det var ${bolge.fasit}. `}
                                    </strong>
                                    {bolge.forklaring}
                                </motion.div>
                            ) : (
                                <motion.p
                                    key="tom"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                                >
                                    Velg en dør, så får du vite hva som faktisk skjedde.
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Kontrollrad */}
                    <div className="px-6 pb-5 flex items-center justify-between gap-3">
                        <button
                            onClick={neste}
                            disabled={phase !== 'svart'}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                        >
                            {indeks + 1 >= bolger.length ? 'Se resultatet' : 'Neste bølge'}
                        </button>
                        <button
                            onClick={handleReset}
                            className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                        >
                            Tilbakestill
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
