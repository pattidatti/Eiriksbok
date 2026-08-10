import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareQuote, RotateCcw, Sparkles, Moon, Check, X } from 'lucide-react';

interface SkapelseVedOrdProps {
    title?: string;
}

type Phase = 'dager' | 'sjuende' | 'ferdig';

interface Dag {
    nummer: number;
    kort: string;
    utsagn: string;
    valg: string[];
}

const DAGER: Dag[] = [
    {
        nummer: 1,
        kort: 'Lys',
        utsagn: 'Det bli lys!',
        valg: [
            'La vannet vrimle av levende skapninger!',
            'Det bli lys!',
            'La jorda bli grønn av planter!',
        ],
    },
    {
        nummer: 2,
        kort: 'Himmel',
        utsagn: 'La en hvelving skille vann fra vann!',
        valg: [
            'La en hvelving skille vann fra vann!',
            'La oss lage mennesker i vårt bilde!',
            'Det bli lys!',
        ],
    },
    {
        nummer: 3,
        kort: 'Land og planter',
        utsagn: 'Vannet skal samle seg, så tørt land kommer fram!',
        valg: [
            'La lys på himmelen skille dag fra natt!',
            'La vannet vrimle av levende skapninger!',
            'Vannet skal samle seg, så tørt land kommer fram!',
        ],
    },
    {
        nummer: 4,
        kort: 'Sol og stjerner',
        utsagn: 'La lys på himmelen skille dag fra natt!',
        valg: [
            'La lys på himmelen skille dag fra natt!',
            'La jorda bære fram alle slags dyr!',
            'Det bli lys!',
        ],
    },
    {
        nummer: 5,
        kort: 'Fisk og fugler',
        utsagn: 'La vannet vrimle av levende skapninger!',
        valg: [
            'La jorda bære fram alle slags dyr!',
            'La en hvelving skille vann fra vann!',
            'La vannet vrimle av levende skapninger!',
        ],
    },
    {
        nummer: 6,
        kort: 'Dyr og mennesker',
        utsagn: 'La oss lage mennesker i vårt bilde!',
        valg: [
            'Vannet skal samle seg, så tørt land kommer fram!',
            'La oss lage mennesker i vårt bilde!',
            'La jorda bli grønn av planter!',
        ],
    },
];

const SJUENDE_VALG: { tekst: string; riktig: boolean }[] = [
    { tekst: 'Gud sier enda et ord, og havet blir større.', riktig: false },
    { tekst: 'Ingenting. Gud stopper, hviler og gjør dagen hellig.', riktig: true },
    { tekst: 'Gud sier at menneskene skal arbeide videre.', riktig: false },
];

interface Melding {
    tone: 'ok' | 'feil';
    tekst: string;
}

export function SkapelseVedOrd({ title = 'Skapt med ord' }: SkapelseVedOrdProps) {
    const [phase, setPhase] = useState<Phase>('dager');
    const [steg, setSteg] = useState(0);
    const [feilValg, setFeilValg] = useState<string | null>(null);
    const [melding, setMelding] = useState<Melding | null>(null);

    const ferdigeDager = phase === 'ferdig' ? 7 : phase === 'sjuende' ? 6 : steg;
    const aktivDag = DAGER[Math.min(steg, DAGER.length - 1)];

    const handleReset = () => {
        setPhase('dager');
        setSteg(0);
        setFeilValg(null);
        setMelding(null);
    };

    const velgUtsagn = (tekst: string) => {
        if (tekst !== aktivDag.utsagn) {
            setFeilValg(tekst);
            setMelding({
                tone: 'feil',
                tekst: 'Det ordet hører til en annen dag. Prøv igjen.',
            });
            return;
        }
        setFeilValg(null);
        setMelding({
            tone: 'ok',
            tekst: `Dag ${aktivDag.nummer}: ${aktivDag.kort}. Gud sa det, og det ble slik.`,
        });
        if (steg === DAGER.length - 1) {
            setPhase('sjuende');
        } else {
            setSteg(steg + 1);
        }
    };

    const velgSjuende = (valg: { tekst: string; riktig: boolean }) => {
        if (!valg.riktig) {
            setFeilValg(valg.tekst);
            setMelding({
                tone: 'feil',
                tekst: 'Nei. Den sjuende dagen står det ikke ett eneste "Gud sa".',
            });
            return;
        }
        setFeilValg(null);
        setMelding(null);
        setPhase('ferdig');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <MessageSquareQuote className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hva Gud sier på hver dag. Følg med på hva som skjer til slutt.
                    </p>
                </div>
            </div>

            {/* Uke-raden */}
            <div className="px-5 pt-5">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {[...DAGER.map((d) => d.kort), 'Hvile'].map((kort, i) => {
                        const gjort = i < ferdigeDager;
                        const aktiv = i === ferdigeDager && phase !== 'ferdig';
                        const erSjuende = i === 6;
                        return (
                            <motion.div
                                key={kort}
                                animate={
                                    gjort && erSjuende ? { scale: [1, 1.08, 1] } : { scale: 1 }
                                }
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className={`rounded-xl border px-2 py-2 text-center ${
                                    gjort && erSjuende
                                        ? 'bg-amber-50 border-amber-300'
                                        : gjort
                                          ? 'bg-emerald-50 border-emerald-200'
                                          : aktiv
                                            ? 'bg-indigo-50 border-indigo-300'
                                            : 'bg-slate-50 border-slate-200'
                                }`}
                            >
                                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    {erSjuende ? (
                                        <Moon className="w-3 h-3" />
                                    ) : (
                                        <span>Dag {i + 1}</span>
                                    )}
                                    {erSjuende && <span>Dag 7</span>}
                                </div>
                                <div
                                    className={`mt-1 text-xs font-medium leading-tight ${
                                        gjort ? 'text-slate-800' : 'text-slate-400'
                                    }`}
                                >
                                    {gjort ? kort : '?'}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="px-5 pt-5">
                <AnimatePresence mode="wait">
                    {phase === 'dager' && (
                        <motion.div
                            key={`dag-${aktivDag.nummer}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-sm text-slate-600 mb-3">
                                <span className="font-semibold text-slate-800">
                                    Dag {aktivDag.nummer}.
                                </span>{' '}
                                Hva sier Gud?
                            </p>
                            <div className="space-y-2">
                                {aktivDag.valg.map((v) => (
                                    <motion.button
                                        key={v}
                                        onClick={() => velgUtsagn(v)}
                                        animate={
                                            feilValg === v ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }
                                        }
                                        transition={{ duration: 0.4 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                                            feilValg === v
                                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                        }`}
                                    >
                                        <span className="text-slate-400">Gud sa: </span>
                                        {v}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'sjuende' && (
                        <motion.div
                            key="sjuende"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <p className="text-sm text-slate-600 mb-3">
                                <span className="font-semibold text-slate-800">
                                    Den sjuende dagen.
                                </span>{' '}
                                Verden er ferdig. Hva skjer nå?
                            </p>
                            <div className="space-y-2">
                                {SJUENDE_VALG.map((v) => (
                                    <motion.button
                                        key={v.tekst}
                                        onClick={() => velgSjuende(v)}
                                        animate={
                                            feilValg === v.tekst
                                                ? { x: [0, -8, 8, -5, 5, 0] }
                                                : { x: 0 }
                                        }
                                        transition={{ duration: 0.4 }}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors ${
                                            feilValg === v.tekst
                                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:shadow-md'
                                        }`}
                                    >
                                        {v.tekst}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {phase === 'ferdig' && (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4"
                        >
                            <div className="flex items-center gap-2 text-amber-700">
                                <motion.span
                                    initial={{ rotate: -30, scale: 0.5 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 200,
                                        damping: 12,
                                        delay: 0.1,
                                    }}
                                >
                                    <Moon className="w-5 h-5" />
                                </motion.span>
                                <span className="font-semibold">Uka er hel</span>
                                <motion.span
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.35 }}
                                >
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                </motion.span>
                            </div>
                            <p className="mt-2 text-sm text-amber-800 leading-relaxed">
                                Seks dager sier Gud noe, og det blir til. Den sjuende dagen sier Gud
                                ingenting. Gud stopper, velsigner dagen og kaller den hellig. Det er
                                den eneste dagen i fortellingen som får det ordet, og det er her
                                sabbaten kommer fra.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pt-3">
                <AnimatePresence mode="wait">
                    {phase !== 'ferdig' && (
                        <motion.div
                            key={melding ? `${melding.tone}-${melding.tekst}` : 'tom'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            className={`flex items-start gap-2 rounded-lg border px-4 py-2.5 text-sm ${
                                melding?.tone === 'ok'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : melding?.tone === 'feil'
                                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                                      : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            {melding?.tone === 'ok' && (
                                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            {melding?.tone === 'feil' && <X className="w-4 h-4 mt-0.5 shrink-0" />}
                            <span>
                                {melding
                                    ? melding.tekst
                                    : 'I 1. Mosebok skaper Gud ved å si noe. Finn riktig ord for hver dag.'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{ferdigeDager} av 7 dager på plass</span>
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
