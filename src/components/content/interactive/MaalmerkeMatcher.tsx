import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ear, RotateCcw, Check, Sparkles, MapPin } from 'lucide-react';

interface MerkePar {
    id: string;
    // Et lite eksempel som viser målmerket i bruk.
    eksempel: string;
    // Navnet på målmerket (fasit).
    merke: string;
    // Hvor i landet trekket er typisk.
    omraade: string;
    // Kort forklaring som vises når paret er riktig.
    forklaring: string;
}

interface MaalmerkeMatcherProps {
    title?: string;
    intro?: string;
    pairs?: MerkePar[];
}

type Phase = 'spiller' | 'ferdig';

const DEFAULT_PAIRS: MerkePar[] = [
    {
        id: 'tjukk-l',
        eksempel: '«sol» blir «såL», «bord» blir «boL»',
        merke: 'Tjukk l',
        omraade: 'Østlandet og Trøndelag',
        forklaring: 'Tunga bøyes bakover og gir et lite slag. Tjukk l finnes ikke på Vestlandet.',
    },
    {
        id: 'palatalisering',
        eksempel: '«mann» blir «mannj», «kveld» blir «kvellj»',
        merke: 'Palatalisering',
        omraade: 'Nord-Norge og Trøndelag',
        forklaring: 'En myk j-lyd smyger seg inn etter konsonanten. «Mannj med hannjhonnj i bannj».',
    },
    {
        id: 'apokope',
        eksempel: '«å kaste» blir «å kast», «å kjøpe» blir «å kjøp»',
        merke: 'Apokope',
        omraade: 'Trøndelag og Nord-Norge',
        forklaring: 'Den siste vokalen faller bort. Ordet ender på en konsonant.',
    },
    {
        id: 'jamvekt',
        eksempel: '«å værra», men «å skrive»',
        merke: 'Jamvekt',
        omraade: 'Østlandet og Trøndelag',
        forklaring: 'Korte og lange ord fra norrønt får ulik ending. Dette kalles kløyvd infinitiv.',
    },
    {
        id: 'pronomen',
        eksempel: '«jeg» blir «eg», «æ», «i» eller «je»',
        merke: 'Pronomenformer',
        omraade: 'Varierer i hele landet',
        forklaring: 'Ordet for «jeg» er kanskje det trekket som raskest røper hvor du kommer fra.',
    },
];

// Enkel stokking uten Math.random (stabil rekkefølge basert på id).
function stableShuffle<T extends { id: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

export function MaalmerkeMatcher({
    title = 'Kjenn igjen målmerket',
    intro = 'Klikk et eksempel, og klikk så målmerket som passer.',
    pairs = DEFAULT_PAIRS,
}: MaalmerkeMatcherProps) {
    const merker = useMemo(() => stableShuffle(pairs), [pairs]);

    const [valgtEksempel, setValgtEksempel] = useState<string | null>(null);
    const [treff, setTreff] = useState<Record<string, boolean>>({});
    const [bom, setBom] = useState<string | null>(null);
    const [sisteForklaring, setSisteForklaring] = useState<MerkePar | null>(null);

    const antallRiktige = Object.keys(treff).length;
    const phase: Phase = antallRiktige === pairs.length ? 'ferdig' : 'spiller';

    const handleMerke = (merkeId: string) => {
        if (!valgtEksempel || treff[valgtEksempel]) return;
        if (valgtEksempel === merkeId) {
            const par = pairs.find((p) => p.id === merkeId)!;
            setTreff((t) => ({ ...t, [merkeId]: true }));
            setSisteForklaring(par);
            setValgtEksempel(null);
            setBom(null);
        } else {
            setBom(merkeId);
            setTimeout(() => setBom(null), 500);
        }
    };

    const handleReset = () => {
        setValgtEksempel(null);
        setTreff({});
        setBom(null);
        setSisteForklaring(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Ear className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
                <div className="ml-auto text-sm font-medium text-slate-400">
                    {antallRiktige}/{pairs.length}
                </div>
            </div>

            {/* Interaksjonsflate */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Venstre: eksempler */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Slik høres det ut
                    </p>
                    {merker.map((p) => {
                        const løst = treff[p.id];
                        const valgt = valgtEksempel === p.id;
                        return (
                            <motion.button
                                key={p.id}
                                type="button"
                                disabled={løst}
                                onClick={() => setValgtEksempel(valgt ? null : p.id)}
                                animate={{ scale: valgt ? 1.02 : 1 }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                                    løst
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : valgt
                                          ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm'
                                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-white'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {løst && <Check className="w-4 h-4 shrink-0" />}
                                    <span>{p.eksempel}</span>
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Høyre: målmerker */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                        Hvilket målmerke?
                    </p>
                    {pairs.map((p) => {
                        const løst = treff[p.id];
                        const rister = bom === p.id;
                        return (
                            <motion.button
                                key={p.id}
                                type="button"
                                disabled={løst || !valgtEksempel}
                                onClick={() => handleMerke(p.id)}
                                animate={rister ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                                transition={{ duration: 0.4 }}
                                className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                                    løst
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : rister
                                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                                          : valgtEksempel
                                            ? 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
                                            : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                            >
                                <span className="flex items-center justify-between gap-2">
                                    <span>{p.merke}</span>
                                    {løst && (
                                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {p.omraade}
                                        </span>
                                    )}
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Feedback-sone (alltid til stede) */}
            <div className="mx-5 mb-4 min-h-[3rem]">
                <AnimatePresence mode="wait">
                    {phase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm flex items-center gap-2"
                        >
                            <Sparkles className="w-5 h-5 shrink-0 text-indigo-500" />
                            <span>
                                Ferdig! Nå kjenner du {pairs.length} målmerker. Målmerkene er sporene
                                som avslører hvor i landet en dialekt hører hjemme.
                            </span>
                        </motion.div>
                    ) : sisteForklaring ? (
                        <motion.div
                            key={sisteForklaring.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
                        >
                            <span className="font-semibold">{sisteForklaring.merke}:</span>{' '}
                            {sisteForklaring.forklaring}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Velg et eksempel til venstre for å starte.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 pb-4 flex items-center justify-end">
                <button
                    type="button"
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
