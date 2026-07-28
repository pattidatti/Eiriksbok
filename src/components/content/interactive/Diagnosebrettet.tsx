import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, HelpCircle, Lock, RotateCcw, Sparkles, Stethoscope, X } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal forstå at ingen av forklaringene på
// Aleksanders død klarer å forklare ALLE sporene - og at ett spor blir liggende
// rødt uansett hva man velger, fordi ingen av kildene er skrevet av noen som var
// i rommet. Det er derfor gåten fortsatt er en gåte.

interface DiagnoseSpor {
    id: string;
    label: string;
    note: string;
    // Et spor ingen forklaring kan løse (kildeproblemet). Vises låst.
    ulost?: boolean;
}

interface DiagnoseForklaring {
    id: string;
    navn: string;
    kilde?: string;
    note: string;
    // Spor-ID-er forklaringen dekker godt.
    passer?: string[];
    // Spor-ID-er forklaringen kanskje kan dekke.
    usikker?: string[];
}

interface DiagnosebrettetProps {
    title?: string;
    subtitle?: string;
    spor: DiagnoseSpor[];
    forklaringer: DiagnoseForklaring[];
    konklusjon?: string;
}

type Dom = 'ja' | 'kanskje' | 'nei' | 'ulost';

const DOM_STIL: Record<Dom, { boks: string; merke: string; ord: string }> = {
    ja: {
        boks: 'bg-emerald-50 border-emerald-300',
        merke: 'bg-emerald-500 text-white',
        ord: 'Passer',
    },
    kanskje: {
        boks: 'bg-amber-50 border-amber-300',
        merke: 'bg-amber-500 text-white',
        ord: 'Usikkert',
    },
    nei: {
        boks: 'bg-rose-50 border-rose-300',
        merke: 'bg-rose-500 text-white',
        ord: 'Passer dårlig',
    },
    ulost: {
        boks: 'bg-slate-100 border-slate-300',
        merke: 'bg-slate-500 text-white',
        ord: 'Ingen kan forklare',
    },
};

function DomIkon({ dom }: { dom: Dom }) {
    if (dom === 'ja') return <Check className="w-3.5 h-3.5" />;
    if (dom === 'kanskje') return <HelpCircle className="w-3.5 h-3.5" />;
    if (dom === 'ulost') return <Lock className="w-3.5 h-3.5" />;
    return <X className="w-3.5 h-3.5" />;
}

export function Diagnosebrettet({
    title = 'Diagnosebrettet',
    subtitle = 'Velg en forklaring, og se hvilke spor den klarer å forklare.',
    spor,
    forklaringer,
    konklusjon,
}: DiagnosebrettetProps) {
    const [valgt, setValgt] = useState<string | null>(null);
    const [testet, setTestet] = useState<string[]>([]);

    const aktiv = useMemo(
        () => forklaringer.find((f) => f.id === valgt) ?? null,
        [forklaringer, valgt]
    );

    const dommer = useMemo(() => {
        const ut: Record<string, Dom> = {};
        for (const s of spor) {
            if (s.ulost) {
                ut[s.id] = 'ulost';
            } else if (!aktiv) {
                ut[s.id] = 'nei';
            } else if (aktiv.passer?.includes(s.id)) {
                ut[s.id] = 'ja';
            } else if (aktiv.usikker?.includes(s.id)) {
                ut[s.id] = 'kanskje';
            } else {
                ut[s.id] = 'nei';
            }
        }
        return ut;
    }, [spor, aktiv]);

    const antall = useMemo(() => {
        const verdier = Object.values(dommer);
        return {
            ja: verdier.filter((d) => d === 'ja').length,
            kanskje: verdier.filter((d) => d === 'kanskje').length,
            nei: verdier.filter((d) => d === 'nei' || d === 'ulost').length,
        };
    }, [dommer]);

    const ferdig = testet.length === forklaringer.length;

    const velg = (id: string) => {
        setValgt(id);
        setTestet((t) => (t.includes(id) ? t : [...t, id]));
    };

    const nullstill = () => {
        setValgt(null);
        setTestet([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Stethoscope className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </div>

            {/* Forklaringene */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {forklaringer.map((f) => {
                    const er = f.id === valgt;
                    const prøvd = testet.includes(f.id);
                    return (
                        <motion.button
                            key={f.id}
                            onClick={() => velg(f.id)}
                            whileTap={{ scale: 0.96 }}
                            className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                er
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                            {f.navn}
                            {prøvd && !er && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5" />
                                </span>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Sporene */}
            <div className="p-5 grid gap-2.5 sm:grid-cols-2">
                {spor.map((s) => {
                    const dom = valgt ? dommer[s.id] : 'nei';
                    const stil = valgt ? DOM_STIL[dom] : null;
                    return (
                        <motion.div
                            key={s.id}
                            layout
                            className={`rounded-xl border p-3 transition-colors ${
                                stil ? stil.boks : 'bg-slate-50 border-slate-200'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-slate-800 leading-snug">
                                    {s.label}
                                </p>
                                <AnimatePresence mode="wait">
                                    {valgt && stil && (
                                        <motion.span
                                            key={`${valgt}-${s.id}-${dom}`}
                                            initial={{ scale: 0, rotate: -25 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 420,
                                                damping: 18,
                                            }}
                                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${stil.merke}`}
                                        >
                                            <DomIkon dom={dom} />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{s.note}</p>
                            {valgt && stil && (
                                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mt-2">
                                    {stil.ord}
                                </p>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Feedback-sone - alltid i DOM-et */}
            <div className="mx-5 mb-4 px-4 py-3 rounded-xl border bg-slate-50 border-slate-200">
                <AnimatePresence mode="wait">
                    {aktiv ? (
                        <motion.div
                            key={aktiv.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold">
                                <span className="text-emerald-700">Passer: {antall.ja}</span>
                                <span className="text-amber-700">Usikkert: {antall.kanskje}</span>
                                <span className="text-rose-700">Passer dårlig: {antall.nei}</span>
                            </div>
                            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                                {aktiv.note}
                            </p>
                            {aktiv.kilde && (
                                <p className="text-xs text-slate-500 mt-1">Kilde: {aktiv.kilde}</p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-slate-500"
                        >
                            Trykk på en forklaring over. Da ser du hvilke av sporene fra Babylon den
                            klarer å forklare.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Suksess-tilstand */}
            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                        className="mx-5 mb-4 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                {konklusjon ??
                                    'Du har testet alle forklaringene. Ingen av dem forklarer alt.'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 pb-5 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    Testet {testet.length} av {forklaringer.length} forklaringer
                </p>
                <button
                    onClick={nullstill}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
