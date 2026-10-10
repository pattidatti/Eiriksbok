import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Stamp,
    Landmark,
    Home,
    Hammer,
    Flag,
    RotateCcw,
    Lightbulb,
    XCircle,
    CheckCircle2,
    FileText,
} from 'lucide-react';

interface PapirlosProps {
    title?: string;
    navn?: string;
}

type Phase = 'uten' | 'med' | 'complete';

interface Luke {
    id: string;
    sted: string;
    sporsmal: string;
    uten: string;
    med: string;
    Icon: typeof Landmark;
}

// Svarene bygger på hva Nansenkontoret faktisk hjalp flyktningene med:
// innreise og visum, lov til å bo, lov til å arbeide og etter hvert nytt statsborgerskap.
const LUKER: Luke[] = [
    {
        id: 'grensen',
        sted: 'Grensen',
        sporsmal: 'Kan jeg reise inn i landet?',
        uten: 'Hvem er du? Uten pass slipper du ikke over grensen.',
        med: 'Passet viser hvem du er. Nå kan du søke om å reise inn.',
        Icon: Landmark,
    },
    {
        id: 'politiet',
        sted: 'Politiet',
        sporsmal: 'Kan jeg få lov til å bo her?',
        uten: 'Du har ingen papirer. Du kan bli sendt ut når som helst.',
        med: 'Med papirer kan du søke om lov til å bo her.',
        Icon: Home,
    },
    {
        id: 'arbeid',
        sted: 'Fabrikken',
        sporsmal: 'Kan jeg få jobb?',
        uten: 'Vi kan ikke ansette noen som ikke finnes på papiret.',
        med: 'Nå kan du søke om arbeidstillatelse og få lønn.',
        Icon: Hammer,
    },
    {
        id: 'framtid',
        sted: 'Framtida',
        sporsmal: 'Kan jeg bli borger et sted?',
        uten: 'Ingen stat regner deg som sin borger. Du hører ikke til noe sted.',
        med: 'Etter hvert kan du søke om å bli borger av et nytt land.',
        Icon: Flag,
    },
];

export function Papirlos({ title = 'Et papir som åpner dører', navn = 'Sergej' }: PapirlosProps) {
    const [phase, setPhase] = useState<Phase>('uten');
    const [besokt, setBesokt] = useState<string[]>([]);
    const [sist, setSist] = useState<string | null>(null);

    const harPass = phase !== 'uten';
    const alleBesokt = besokt.length === LUKER.length;

    const handleKlikk = (id: string) => {
        if (phase === 'complete') return;
        setSist(id);
        if (!besokt.includes(id)) {
            const neste = [...besokt, id];
            setBesokt(neste);
            if (phase === 'med' && neste.length === LUKER.length) {
                setTimeout(() => setPhase('complete'), 700);
            }
        }
    };

    const giPass = () => {
        setPhase('med');
        setBesokt([]);
        setSist(null);
    };

    const handleReset = () => {
        setPhase('uten');
        setBesokt([]);
        setSist(null);
    };

    const sisteLuke = LUKER.find((l) => l.id === sist);

    let feedback: { tekst: string; tone: 'noytral' | 'feil' | 'ok' };
    if (phase === 'complete') {
        feedback = {
            tekst: `${navn} fikk ikke et nytt land. Men han fikk noe han manglet: et papir som viser hvem han er. Det var nok til å åpne dørene.`,
            tone: 'ok',
        };
    } else if (sisteLuke) {
        feedback = {
            tekst: harPass ? sisteLuke.med : sisteLuke.uten,
            tone: harPass ? 'ok' : 'feil',
        };
    } else {
        feedback = {
            tekst: harPass
                ? `Nå har ${navn} et Nansenpass. Prøv de samme lukene en gang til.`
                : `${navn} har flyktet fra Russland og mistet statsborgerskapet sitt. Klikk på en luke.`,
            tone: 'noytral',
        };
    }

    const toneKlasser = {
        noytral: 'bg-blue-50 border-blue-200 text-blue-700',
        feil: 'bg-rose-50 border-rose-200 text-rose-700',
        ok: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    }[feedback.tone];

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på alle fire lukene og se hva {navn} får til svar.
                    </p>
                </div>
                <motion.div
                    key={harPass ? 'pass' : 'ingen'}
                    initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                    className={`hidden sm:flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                        harPass
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                >
                    <Stamp className="w-3.5 h-3.5" />
                    {harPass ? 'Nansenpass' : 'Ingen papirer'}
                </motion.div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                {LUKER.map((luke) => {
                    const sett = besokt.includes(luke.id);
                    const aktiv = sist === luke.id;
                    const status = !sett ? 'ukjent' : harPass ? 'ja' : 'nei';
                    return (
                        <motion.button
                            key={`${phase === 'uten' ? 'u' : 'm'}-${luke.id}`}
                            type="button"
                            onClick={() => handleKlikk(luke.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            animate={
                                status === 'nei' && aktiv
                                    ? { x: [0, -6, 6, -4, 4, 0] }
                                    : { x: 0 }
                            }
                            transition={{ duration: 0.4 }}
                            className={`relative text-left rounded-xl border p-3 sm:p-4 transition-shadow ${
                                aktiv ? 'shadow-md' : 'shadow-sm'
                            } ${
                                status === 'nei'
                                    ? 'bg-rose-50 border-rose-200'
                                    : status === 'ja'
                                      ? 'bg-emerald-50 border-emerald-200'
                                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <luke.Icon
                                    className={`w-5 h-5 ${
                                        status === 'nei'
                                            ? 'text-rose-500'
                                            : status === 'ja'
                                              ? 'text-emerald-600'
                                              : 'text-indigo-500'
                                    }`}
                                />
                                <AnimatePresence>
                                    {status === 'nei' && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <XCircle className="w-5 h-5 text-rose-500" />
                                        </motion.span>
                                    )}
                                    {status === 'ja' && (
                                        <motion.span
                                            initial={{ scale: 0, rotate: -90 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                        >
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="font-semibold text-slate-800 text-sm">{luke.sted}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{luke.sporsmal}</div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <div className="px-4 sm:px-6 pb-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${phase}-${sist ?? 'start'}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm min-h-[3rem] flex items-start gap-2 ${toneKlasser}`}
                    >
                        {phase === 'complete' && <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" />}
                        <span>{feedback.tekst}</span>
                    </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                    {phase === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
                            className="mt-3 flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm"
                        >
                            <motion.span
                                animate={{ rotate: [0, -15, 15, 0] }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Stamp className="w-5 h-5" />
                            </motion.span>
                            Alle fire dørene er åpne!
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'uten' ? (
                    <motion.button
                        type="button"
                        onClick={giPass}
                        disabled={!alleBesokt}
                        animate={alleBesokt ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className={`rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2 ${
                            alleBesokt
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Stamp className="w-4 h-4" />
                        {alleBesokt
                            ? `Gi ${navn} et Nansenpass`
                            : `Prøv alle lukene først (${besokt.length}/${LUKER.length})`}
                    </motion.button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {phase === 'complete'
                            ? 'Ferdig'
                            : `Med pass: ${besokt.length}/${LUKER.length} luker`}
                    </span>
                )}
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
