import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Swords, ShieldCheck, RotateCcw, Users } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal forstå at det er ANTALLET mennesker med lovlig
// krav på kronen som avgjør om landet får krig eller fred. Stram inn arveregelen,
// og krigsgrunnen forsvinner av seg selv.

interface Heir {
    id: string;
    name: string;
    role: string;
    legitimate: boolean;
    birthOrder: number;
}

interface TronfolgevelgerenProps {
    title?: string;
    heirs?: Heir[];
}

type InheritanceRule = 'alle' | 'ektefodte' | 'eldste';

const DEFAULT_HEIRS: Heir[] = [
    { id: 'magnus', name: 'Magnus', role: 'Eldste sønn, født i ekteskap', legitimate: true, birthOrder: 1 },
    { id: 'inge', name: 'Inge', role: 'Sønn født i ekteskap', legitimate: true, birthOrder: 2 },
    { id: 'sigurd', name: 'Sigurd', role: 'Sønn født i ekteskap', legitimate: true, birthOrder: 3 },
    { id: 'haakon', name: 'Håkon', role: 'Sønn født utenfor ekteskap', legitimate: false, birthOrder: 4 },
    { id: 'oystein', name: 'Øystein', role: 'Sønn født utenfor ekteskap', legitimate: false, birthOrder: 5 },
    { id: 'eirik', name: 'Eirik', role: 'Sønn født utenfor ekteskap', legitimate: false, birthOrder: 6 },
];

const RULES: { id: InheritanceRule; label: string; note: string }[] = [
    { id: 'alle', label: 'Alle sønnene til kongen', note: 'Slik var det før 1163' },
    { id: 'ektefodte', label: 'Bare sønner født i ekteskap', note: 'Halve veien' },
    { id: 'eldste', label: 'Bare den eldste sønnen født i ekteskap', note: 'Loven fra 1163 og 1260' },
];

function qualifies(heir: Heir, rule: InheritanceRule): boolean {
    if (rule === 'alle') return true;
    if (rule === 'ektefodte') return heir.legitimate;
    return heir.legitimate && heir.birthOrder === 1;
}

export function Tronfolgevelgeren({
    title = 'Tronfølgevelgeren',
    heirs = DEFAULT_HEIRS,
}: TronfolgevelgerenProps) {
    const [rule, setRule] = useState<InheritanceRule>('alle');
    const [samkongedomme, setSamkongedomme] = useState(true);

    const claimants = heirs.filter((h) => qualifies(h, rule));
    const count = claimants.length;
    const atPeace = count === 1 && !samkongedomme;

    // Risikonivået følger antallet med lovlig krav, pluss rivaliseringen mellom samkonger.
    const riskRatio = Math.min(1, (count - 1) / (heirs.length - 1) + (samkongedomme ? 0.18 : 0));

    let verdict: { tone: 'peace' | 'warn' | 'war'; heading: string; body: string };
    if (atPeace) {
        verdict = {
            tone: 'peace',
            heading: 'Én arving. Ingen har lovlig grunn til å reise hær.',
            body: 'Dette er regelen Norge endte på. Tronfølgeloven av 1163 slo fast at den eldste sønnen født i ekteskap skulle bli konge, og loven fra 1260 gjorde Norge til et rent arvekongedømme. Da forsvant selve krigsgrunnen.',
        };
    } else if (count === 1 && samkongedomme) {
        verdict = {
            tone: 'warn',
            heading: 'Én arving, men flere kan dele makten.',
            body: 'Så lenge landet kan ha flere konger samtidig, kan en ny mann alltid kreve sin del. Samkongene var sjelden gode venner, og rivaliseringen mellom dem var nesten alltid der.',
        };
    } else if (count <= 3) {
        verdict = {
            tone: 'warn',
            heading: `${count} menn med lovlig krav på kronen.`,
            body: 'Du har luket bort dem som ble født utenfor ekteskap. Men brødre kan fortsatt slåss om den samme kronen, og hver av dem kan samle sin egen hær.',
        };
    } else {
        verdict = {
            tone: 'war',
            heading: `${count} menn med lovlig krav på kronen.`,
            body: 'Dette var virkeligheten i Norge før 1163. Alle sønnene til en konge kunne kreve makten, også de som var født utenfor ekteskap. Hver gang en konge døde, sto det klart flere menn med like god rett.',
        };
    }

    const toneStyles = {
        peace: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warn: 'bg-amber-50 border-amber-200 text-amber-800',
        war: 'bg-rose-50 border-rose-200 text-rose-800',
    } as const;

    const barColor = atPeace ? 'bg-emerald-500' : count <= 3 ? 'bg-amber-500' : 'bg-rose-500';

    const handleReset = () => {
        setRule('alle');
        setSamkongedomme(true);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Crown className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Kongen er død. Velg arvereglene, og se hvor mange som får lovlig krav på kronen.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                {/* Reglene */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Hvem kan arve tronen?
                    </p>
                    <div className="flex flex-col gap-2">
                        {RULES.map((r) => {
                            const active = rule === r.id;
                            return (
                                <motion.button
                                    key={r.id}
                                    onClick={() => setRule(r.id)}
                                    whileTap={{ scale: 0.98 }}
                                    animate={{
                                        borderColor: active ? '#6366f1' : '#e2e8f0',
                                        backgroundColor: active ? '#eef2ff' : '#ffffff',
                                    }}
                                    className="text-left border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <span
                                        className={`block text-sm font-medium ${
                                            active ? 'text-indigo-800' : 'text-slate-700'
                                        }`}
                                    >
                                        {r.label}
                                    </span>
                                    <span className="block text-xs text-slate-500 mt-0.5">{r.note}</span>
                                </motion.button>
                            );
                        })}
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mt-5 mb-2">
                        Hvor mange konger?
                    </p>
                    <motion.button
                        onClick={() => setSamkongedomme((s) => !s)}
                        whileTap={{ scale: 0.98 }}
                        animate={{
                            borderColor: samkongedomme ? '#f59e0b' : '#e2e8f0',
                            backgroundColor: samkongedomme ? '#fffbeb' : '#ffffff',
                        }}
                        className="w-full text-left border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
                    >
                        <Users
                            className={`w-4 h-4 shrink-0 ${
                                samkongedomme ? 'text-amber-500' : 'text-slate-400'
                            }`}
                        />
                        <span>
                            <span className="block text-sm font-medium text-slate-700">
                                Flere kan være konge samtidig
                            </span>
                            <span className="block text-xs text-slate-500 mt-0.5">
                                {samkongedomme
                                    ? 'På: brødre deler landet mellom seg'
                                    : 'Av: bare én konge om gangen'}
                            </span>
                        </span>
                    </motion.button>
                </div>

                {/* Arvingene */}
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                        Kongens sønner
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {heirs.map((h) => {
                            const isClaimant = qualifies(h, rule);
                            return (
                                <motion.div
                                    key={h.id}
                                    animate={{
                                        opacity: isClaimant ? 1 : 0.4,
                                        scale: isClaimant ? 1 : 0.96,
                                        backgroundColor: isClaimant ? '#fff7ed' : '#f8fafc',
                                        borderColor: isClaimant ? '#fdba74' : '#e2e8f0',
                                    }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                    className="border rounded-xl px-3 py-2.5"
                                >
                                    <div className="flex items-center gap-1.5">
                                        <motion.span
                                            animate={{
                                                opacity: isClaimant ? 1 : 0,
                                                rotate: isClaimant ? 0 : -25,
                                            }}
                                        >
                                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                                        </motion.span>
                                        <span className="text-sm font-semibold text-slate-800">{h.name}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{h.role}</p>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Teller + risikolinje */}
                    <div className="mt-4">
                        <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-sm text-slate-600">Kongsemner med lovlig krav</span>
                            <motion.span
                                key={count}
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                                className="text-2xl font-bold text-slate-800 tabular-nums"
                            >
                                {count}
                            </motion.span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${barColor}`}
                                animate={{ width: `${Math.max(6, riskRatio * 100)}%` }}
                                transition={{ type: 'spring', stiffness: 200, damping: 28 }}
                            />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                            <span>Fred</span>
                            <span>Borgerkrig</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="px-6 pb-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={verdict.heading}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${toneStyles[verdict.tone]}`}
                    >
                        <div className="flex items-start gap-2">
                            {atPeace ? (
                                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <Swords className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <div>
                                <p className="font-semibold">{verdict.heading}</p>
                                <p className="mt-1 leading-relaxed">{verdict.body}</p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-4 flex items-center justify-between">
                <AnimatePresence>
                    {atPeace ? (
                        <motion.span
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 18 }}
                            className="inline-flex items-center gap-2 bg-emerald-600 text-white rounded-full px-5 py-2 text-sm font-medium"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Du fant regelen som ga fred
                        </motion.span>
                    ) : (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-slate-500"
                        >
                            Stram inn reglene til bare én mann har krav på kronen.
                        </motion.span>
                    )}
                </AnimatePresence>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors shrink-0 ml-3"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
