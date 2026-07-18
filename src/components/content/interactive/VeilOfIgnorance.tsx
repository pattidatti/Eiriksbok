import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EyeOff, Sparkles, RotateCcw, Crown, Users, HandHeart } from 'lucide-react';

interface Society {
    id: string;
    name: string;
    tagline: string;
    topp: number;
    midten: number;
    bunnen: number;
}

interface VeilOfIgnoranceProps {
    title?: string;
    societies?: Society[];
}

type Tier = 'topp' | 'midten' | 'bunnen';
type Phase = 'idle' | 'chosen' | 'revealed';

const DEFAULT_SOCIETIES: Society[] = [
    {
        id: 'vinner',
        name: 'Vinneren tar alt',
        tagline: 'Noen få lever i luksus. Resten klarer seg så vidt.',
        topp: 10,
        midten: 4,
        bunnen: 1,
    },
    {
        id: 'likt',
        name: 'Alt helt likt',
        tagline: 'Alle får nøyaktig det samme, uansett innsats.',
        topp: 5,
        midten: 5,
        bunnen: 5,
    },
    {
        id: 'rawls',
        name: 'Løft de svakeste',
        tagline: 'Litt forskjell er lov, men bare hvis den også løfter de nederst.',
        topp: 8,
        midten: 6,
        bunnen: 4,
    },
];

const TIERS: { id: Tier; label: string; icon: typeof Crown }[] = [
    { id: 'topp', label: 'på toppen', icon: Crown },
    { id: 'midten', label: 'i midten', icon: Users },
    { id: 'bunnen', label: 'nederst', icon: HandHeart },
];

const scoreColor = (v: number) =>
    v >= 7 ? 'bg-emerald-500' : v >= 4 ? 'bg-amber-500' : 'bg-rose-500';

export function VeilOfIgnorance({
    title = 'Uvitenhetens slør',
    societies = DEFAULT_SOCIETIES,
}: VeilOfIgnoranceProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [chosenId, setChosenId] = useState<string | null>(null);
    const [tier, setTier] = useState<Tier | null>(null);
    const [rounds, setRounds] = useState(0);

    const chosen = societies.find((s) => s.id === chosenId) ?? null;

    // Samfunnet der den dårligst stilte har det best mulig (Rawls sitt valg).
    const fairestId = useMemo(() => {
        let best = societies[0];
        for (const s of societies) if (s.bunnen > best.bunnen) best = s;
        return best.id;
    }, [societies]);

    const myScore = chosen && tier ? chosen[tier] : 0;

    const handleChoose = (id: string) => {
        if (phase === 'revealed') return;
        setChosenId(id);
        setPhase('chosen');
        setTier(null);
    };

    const handleReveal = () => {
        if (!chosen) return;
        const roll = TIERS[Math.floor(Math.random() * TIERS.length)].id;
        setTier(roll);
        setPhase('revealed');
        setRounds((r) => r + 1);
    };

    const handleReset = () => {
        setPhase('idle');
        setChosenId(null);
        setTier(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <EyeOff className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg samfunnet du vil leve i. Men du vet ikke hvem du blir.
                    </p>
                </div>
            </div>

            {/* Samfunnskort */}
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {societies.map((s) => {
                    const active = s.id === chosenId;
                    return (
                        <button
                            key={s.id}
                            onClick={() => handleChoose(s.id)}
                            disabled={phase === 'revealed'}
                            className={`text-left rounded-xl border p-3 transition-shadow ${
                                active
                                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                                    : 'border-slate-200 bg-slate-50 hover:shadow-sm'
                            } ${phase === 'revealed' ? 'cursor-default opacity-90' : 'cursor-pointer'}`}
                        >
                            <div className="font-semibold text-slate-800 text-sm">{s.name}</div>
                            <p className="text-[11px] text-slate-500 mt-1 leading-snug min-h-[30px]">
                                {s.tagline}
                            </p>
                            <div className="mt-3 space-y-1.5">
                                {TIERS.map((t) => (
                                    <div key={t.id} className="flex items-center gap-2">
                                        <span className="w-14 text-[10px] text-slate-500">
                                            {t.label}
                                        </span>
                                        <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${scoreColor(s[t.id])}`}
                                                initial={false}
                                                animate={{ width: `${s[t.id] * 10}%` }}
                                                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                                            />
                                        </div>
                                        <span className="w-4 text-[10px] font-semibold text-slate-600 text-right">
                                            {s[t.id]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="mx-4 sm:mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Klikk et samfunn for å velge det. Fargene viser hvor godt livet er for de
                            på toppen, i midten og nederst.
                        </motion.div>
                    )}

                    {phase === 'chosen' && chosen && (
                        <motion.div
                            key="chosen"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm"
                        >
                            Du valgte <strong>{chosen.name}</strong>. Bak sløret vet du ikke om du
                            blir født på toppen eller nederst. Tør du trekke sløret til side?
                        </motion.div>
                    )}

                    {phase === 'revealed' && chosen && tier && (
                        <motion.div
                            key="revealed"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                myScore >= 4
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <Sparkles className="w-4 h-4" />
                                Sløret er borte. Du havnet{' '}
                                {TIERS.find((t) => t.id === tier)?.label} i «{chosen.name}».
                            </div>
                            <p className="mt-1 leading-snug">
                                Livskvaliteten din ble {myScore} av 10.{' '}
                                {chosen.id === fairestId
                                    ? 'Du valgte samfunnet der selv den dårligst stilte har det best mulig. Det er akkurat slik Rawls mente en klok person ville valgt bak sløret.'
                                    : 'Merk deg samfunnet «Løft de svakeste»: der er den nederste plassen best mulig. Rawls mente det er det tryggeste valget når du ikke vet hvem du blir.'}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={handleReveal}
                    disabled={phase !== 'chosen'}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        phase === 'chosen'
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    Trekk sløret til side
                </button>
                <div className="flex items-center gap-3">
                    {rounds > 0 && (
                        <span className="text-[11px] text-slate-400">
                            {rounds} {rounds === 1 ? 'liv levd' : 'liv levd'}
                        </span>
                    )}
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
}
