import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale,
    Camera,
    FileText,
    MessageSquare,
    ShieldAlert,
    Check,
    RotateCcw,
    Sparkles,
} from 'lucide-react';

// SamstemteKilder: eleven legger kilder i vektskåla og ser hvor sikker
// historien blir. Poenget er ikke ANTALL kilder, men om de er uavhengige av
// hverandre. To kilder som bygger på samme opphav teller nesten som én. To som
// aldri har hørt om hverandre, men forteller det samme, teller dobbelt.
// Lyspære-øyeblikket: vi kan vite noe sikkert om fortiden selv når en part
// nekter for det - hvis nok uavhengige kilder peker samme vei.

type KildeType = 'vitne' | 'dokument' | 'ettertid' | 'motstemme';

interface Kilde {
    id: string;
    label: string;
    detail: string;
    year: string;
    // Hva slags kilde det er. 'motstemme' er en part som er anklaget, ikke et vitne.
    kind: KildeType;
    // Uavhengighetsgruppe. To kilder i samme gruppe bygger på det samme, og den
    // andre du velger teller derfor bare halvt.
    group: string;
    // Hvor mye kilden løfter sikkerheten (0-100) når den står alene.
    weight: number;
    // Forklaringen eleven får når kilden legges i skåla.
    note: string;
}

interface SamstemteKilderProps {
    title?: string;
    prompt?: string;
    claim: string;
    sources: Kilde[];
    threshold?: number;
    verdict: string;
    verdictNote?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const KIND_ICON: Record<KildeType, typeof Camera> = {
    vitne: Camera,
    dokument: FileText,
    ettertid: MessageSquare,
    motstemme: ShieldAlert,
};

const KIND_LABEL: Record<KildeType, string> = {
    vitne: 'Så det selv',
    dokument: 'Papir fra den tiden',
    ettertid: 'Fortalt senere',
    motstemme: 'Anklaget part',
};

export function SamstemteKilder({
    title = 'Hvor sikkert vet vi det?',
    prompt = 'Legg kilder i vektskåla. Se hvor mye hver enkelt faktisk er verdt.',
    claim,
    sources,
    threshold = 70,
    verdict,
    verdictNote,
}: SamstemteKilderProps) {
    const [picked, setPicked] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('idle');
    const [lastId, setLastId] = useState<string | null>(null);

    // Regn ut sikkerheten. Rekkefølgen teller: den FØRSTE kilden i en gruppe
    // gir full uttelling, den neste i samme gruppe bare halv.
    const { score, contributions } = useMemo(() => {
        const seenGroups = new Set<string>();
        const contrib: Record<string, number> = {};
        let sum = 0;
        for (const id of picked) {
            const s = sources.find((k) => k.id === id);
            if (!s) continue;
            if (s.kind === 'motstemme') {
                contrib[id] = 0;
                continue;
            }
            const repeat = seenGroups.has(s.group);
            const value = repeat ? Math.round(s.weight / 2) : s.weight;
            seenGroups.add(s.group);
            contrib[id] = value;
            sum += value;
        }
        return { score: Math.min(100, sum), contributions: contrib };
    }, [picked, sources]);

    const ready = score >= threshold;
    const last = lastId ? sources.find((k) => k.id === lastId) : undefined;
    const lastGain = lastId ? contributions[lastId] : undefined;
    const lastWasHalved =
        last && last.kind !== 'motstemme' && lastGain !== undefined && lastGain < last.weight;

    const toggle = (id: string) => {
        setPhase('active');
        setPicked((prev) => {
            if (prev.includes(id)) {
                setLastId(null);
                return prev.filter((p) => p !== id);
            }
            setLastId(id);
            return [...prev, id];
        });
    };

    const reset = () => {
        setPicked([]);
        setLastId(null);
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start gap-3">
                <Scale className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{prompt}</p>
                </div>
            </div>

            {/* Påstanden som skal prøves */}
            <div className="mx-6 mt-5 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                    Påstanden vi prøver
                </p>
                <p className="text-sm text-blue-800 mt-1">{claim}</p>
            </div>

            {/* Kildekortene */}
            <div className="px-6 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((s) => {
                    const on = picked.includes(s.id);
                    const Icon = KIND_ICON[s.kind];
                    const motstemme = s.kind === 'motstemme';
                    return (
                        <motion.button
                            key={s.id}
                            type="button"
                            onClick={() => toggle(s.id)}
                            whileTap={{ scale: 0.97 }}
                            animate={on ? { y: -3 } : { y: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                            className={`text-left rounded-xl border p-3 transition-colors ${
                                on
                                    ? motstemme
                                        ? 'bg-amber-50 border-amber-300 shadow-md'
                                        : 'bg-emerald-50 border-emerald-300 shadow-md'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <Icon
                                    className={`w-4 h-4 shrink-0 ${
                                        on
                                            ? motstemme
                                                ? 'text-amber-600'
                                                : 'text-emerald-600'
                                            : 'text-slate-400'
                                    }`}
                                />
                                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    {KIND_LABEL[s.kind]}
                                </span>
                                <span className="ml-auto text-[11px] font-mono text-slate-400">
                                    {s.year}
                                </span>
                                {on && (
                                    <Check
                                        className={`w-4 h-4 ${
                                            motstemme ? 'text-amber-600' : 'text-emerald-600'
                                        }`}
                                    />
                                )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 leading-snug">
                                {s.label}
                            </p>
                            <p className="text-xs text-slate-500 leading-snug mt-1">{s.detail}</p>
                        </motion.button>
                    );
                })}
            </div>

            {/* Vektstanga */}
            <div className="px-6 pt-5">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Hvor sikker er historien nå?
                    </span>
                    <span className="text-sm font-bold text-slate-700">{score} av 100</span>
                </div>
                <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${
                            ready ? 'bg-emerald-500' : 'bg-indigo-400'
                        }`}
                        animate={{ width: `${score}%` }}
                        transition={{ type: 'spring', stiffness: 160, damping: 24 }}
                    />
                    <div
                        className="absolute top-0 bottom-0 w-px bg-slate-400"
                        style={{ left: `${threshold}%` }}
                    />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                    Streken viser hvor historikere mener saken er godt nok belagt.
                </p>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={lastId ?? phase}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            last
                                ? last.kind === 'motstemme'
                                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                    >
                        {last ? (
                            <>
                                <span className="font-semibold">
                                    {last.kind === 'motstemme'
                                        ? 'Ingen poeng: '
                                        : `+${lastGain} poeng${lastWasHalved ? ' (halv verdi): ' : ': '}`}
                                </span>
                                {last.note}
                            </>
                        ) : (
                            'Trykk på et kildekort for å legge det i vektskåla.'
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Konklusjonen */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                        className="mx-6 mt-4 px-4 py-4 rounded-xl bg-emerald-50 border border-emerald-200"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-800">{verdict}</span>
                        </div>
                        {verdictNote && (
                            <p className="text-sm text-emerald-700 leading-snug">{verdictNote}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between gap-3">
                <button
                    type="button"
                    disabled={!ready || phase === 'complete'}
                    onClick={() => setPhase('complete')}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        ready && phase !== 'complete'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    {phase === 'complete' ? 'Konklusjon vist' : 'Trekk konklusjon'}
                </button>
                <button
                    type="button"
                    onClick={reset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
