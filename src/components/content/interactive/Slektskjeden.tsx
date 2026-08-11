import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Link2, RotateCcw, Search, Sparkles, UserRound } from 'lucide-react';

interface SlektskjedenProps {
    title?: string;
}

type Status = 'apen' | 'venter' | 'beseglet';

interface Ledd {
    id: string;
    par: string;
    tid: string;
    lever: boolean;
    knappTekst: string;
    mellomtekst?: string;
    mellomKnapp?: string;
    kvittering: string;
}

const LEDD: Ledd[] = [
    {
        id: 'anders',
        par: 'Anders og Maren',
        tid: 'Levde på 1800-tallet',
        lever: false,
        knappTekst: 'Finn navnene',
        mellomtekst:
            'Anders og Maren er døde. De kan ikke gå inn i tempelet selv. En levende slektning må stå i deres sted.',
        mellomKnapp: 'Stå som stedfortreder',
        kvittering:
            'Ordinansen er utført på vegne av Anders og Maren. Om de tar imot den, bestemmer de selv.',
    },
    {
        id: 'johan',
        par: 'Johan og Gerda',
        tid: 'Levde på 1900-tallet',
        lever: false,
        knappTekst: 'Finn navnene',
        mellomtekst:
            'Johan og Gerda er også døde. Navnene deres må finnes i kirkebøkene før noe kan gjøres.',
        mellomKnapp: 'Stå som stedfortreder',
        kvittering:
            'Ordinansen er utført på vegne av Johan og Gerda. Også de velger selv om de tar imot.',
    },
    {
        id: 'kari',
        par: 'Kari og Per',
        tid: 'Besteforeldre, lever',
        lever: true,
        knappTekst: 'Reis til tempelet',
        kvittering:
            'Kari og Per er beseglet for tid og all evighet. De gjorde det selv, mens de lever.',
    },
    {
        id: 'nora',
        par: 'Nora og Elias',
        tid: 'Gifter seg i år',
        lever: true,
        knappTekst: 'Reis til tempelet',
        kvittering:
            'Nora og Elias er beseglet. Barn de får senere, regnes automatisk som beseglet til dem.',
    },
];

export function Slektskjeden({ title = 'Slektskjeden' }: SlektskjedenProps) {
    const [status, setStatus] = useState<Record<string, Status>>({});
    const [melding, setMelding] = useState<string | null>(null);

    const hent = (id: string): Status => status[id] ?? 'apen';
    const antallFerdig = LEDD.filter((l) => hent(l.id) === 'beseglet').length;
    const ferdig = antallFerdig === LEDD.length;

    const handleKlikk = (ledd: Ledd) => {
        const naa = hent(ledd.id);
        if (naa === 'beseglet') return;
        if (naa === 'apen' && !ledd.lever) {
            setStatus((s) => ({ ...s, [ledd.id]: 'venter' }));
            setMelding(ledd.mellomtekst ?? null);
            return;
        }
        setStatus((s) => ({ ...s, [ledd.id]: 'beseglet' }));
        setMelding(ledd.kvittering);
    };

    const handleReset = () => {
        setStatus({});
        setMelding(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Link2 className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Bind fire generasjoner sammen. To av dem kan ikke gjøre det selv.
                    </p>
                </div>
            </div>

            <div className="px-5 py-4 bg-slate-50">
                {LEDD.map((ledd, i) => {
                    const s = hent(ledd.id);
                    const nesteFerdig = i < LEDD.length - 1 && hent(LEDD[i + 1].id) === 'beseglet';
                    const koblet = s === 'beseglet' && nesteFerdig;
                    return (
                        <div key={ledd.id}>
                            <motion.div
                                animate={s === 'beseglet' ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                                transition={{ duration: 0.35 }}
                                className={`flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5 ${
                                    s === 'beseglet'
                                        ? 'bg-emerald-50 border-emerald-200'
                                        : s === 'venter'
                                          ? 'bg-blue-50 border-blue-200'
                                          : 'bg-white border-slate-200'
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                        s === 'beseglet'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : 'bg-slate-100 text-slate-500'
                                    }`}
                                >
                                    {s === 'beseglet' ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <UserRound className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-800 text-sm">
                                        {ledd.par}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {ledd.tid} · {ledd.lever ? 'Lever' : 'Død'}
                                    </p>
                                </div>
                                {s === 'beseglet' ? (
                                    <span className="text-xs font-medium text-emerald-700 px-3 py-1.5 rounded-full bg-emerald-100">
                                        Beseglet
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleKlikk(ledd)}
                                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
                                    >
                                        {s === 'venter' ? (
                                            <Link2 className="w-3.5 h-3.5" />
                                        ) : ledd.lever ? (
                                            <Sparkles className="w-3.5 h-3.5" />
                                        ) : (
                                            <Search className="w-3.5 h-3.5" />
                                        )}
                                        {s === 'venter'
                                            ? (ledd.mellomKnapp ?? 'Fortsett')
                                            : ledd.knappTekst}
                                    </button>
                                )}
                            </motion.div>

                            {i < LEDD.length - 1 && (
                                <div className="flex justify-center py-1">
                                    <motion.div
                                        className="w-1 rounded-full"
                                        style={{ height: 22, backgroundColor: '#e2e8f0' }}
                                        initial={false}
                                        animate={{
                                            height: koblet ? 26 : 22,
                                            backgroundColor: koblet ? '#4f46e5' : '#e2e8f0',
                                        }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

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
                                Kjeden er hel
                            </span>
                            <p className="mt-1">
                                Fire generasjoner er bundet sammen uten et eneste brudd. Slik ser
                                kirken på ritene sine: ikke som fire markeringer i ett liv, men som
                                ledd i en kjede som skal holde også etter døden. De to øverste fikk
                                tilbudet gjennom en levende stedfortreder, og de bestemmer selv om
                                de tar imot det.
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
                            {melding ?? 'Klikk på et ledd for å begynne nederst eller øverst.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {antallFerdig} av {LEDD.length} ledd beseglet
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
