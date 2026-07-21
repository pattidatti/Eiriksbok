import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scale,
    Snowflake,
    Coins,
    Ship,
    Users,
    CheckCircle2,
    RotateCcw,
    type LucideIcon,
} from 'lucide-react';

interface Cause {
    id: string;
    title: string;
    evidence: string;
    icon: LucideIcon;
}

interface ForklaringsVektProps {
    title?: string;
}

// Lyspære-øyeblikk: Etter denne interaksjonen skal eleven forstå at nordboerne
// ikke forsvant av EN grunn - det var flere årsaker som virket sammen. Ingen
// enkelt kort fyller forklaringen; bare når eleven legger flere på vekta,
// tipper den over til "helhetlig forklaring".

const CAUSES: Cause[] = [
    {
        id: 'klima',
        title: 'Klimaet ble kaldere',
        evidence:
            'Fra 1300-tallet ble det kaldere (den lille istid). Kortere somrer ga mindre høy til dyra, og mer havis stengte kysten.',
        icon: Snowflake,
    },
    {
        id: 'handel',
        title: 'Handelen med hvalrosstann kollapset',
        evidence:
            'Hvalrosstann var den viktigste eksportvaren. Da billig elefanttann fra Afrika kom til Europa på 1200-tallet, falt verdien.',
        icon: Coins,
    },
    {
        id: 'skip',
        title: 'Skipene fra Norge sluttet å komme',
        evidence:
            'Svartedauden på midten av 1300-tallet halverte folketallet i Norge. Den årlige handelsferden til Grønland stoppet, og nordboerne ble isolert.',
        icon: Ship,
    },
    {
        id: 'tilpasning',
        title: 'De tok ikke etter inuittene',
        evidence:
            'Inuittene jaktet sel med kajakk og harpun. Nordboerne holdt fast på gårdsdrift og lærte lite av naboene sine.',
        icon: Users,
    },
];

// Vekta tipper først når flere årsaker ligger på. Én alene rekker aldri opp til
// "helhetlig forklaring" (streken ved 80 %).
const METER = [0, 32, 58, 82, 100];
const THRESHOLD = 80;

export function ForklaringsVekt({ title = 'Vei årsakene' }: ForklaringsVektProps) {
    const [active, setActive] = useState<Set<string>>(new Set());
    const [lastPicked, setLastPicked] = useState<Cause | null>(null);

    const count = active.size;
    const pct = METER[count];
    const complete = count >= 3;

    const toggle = (cause: Cause) => {
        setActive((prev) => {
            const next = new Set(prev);
            if (next.has(cause.id)) {
                next.delete(cause.id);
            } else {
                next.add(cause.id);
            }
            return next;
        });
        setLastPicked(cause);
    };

    const reset = () => {
        setActive(new Set());
        setLastPicked(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk på årsakene du tror gjorde ende på nordboerne. Se hvor mye de forklarer.
                    </p>
                </div>
            </div>

            {/* Årsakskort */}
            <div className="p-6 grid gap-3 sm:grid-cols-2">
                {CAUSES.map((cause) => {
                    const on = active.has(cause.id);
                    const Icon = cause.icon;
                    return (
                        <motion.button
                            key={cause.id}
                            onClick={() => toggle(cause)}
                            whileTap={{ scale: 0.97 }}
                            className={`flex items-center gap-3 text-left rounded-xl border px-4 py-3 transition-colors ${
                                on
                                    ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <span
                                className={`flex-shrink-0 grid place-items-center w-9 h-9 rounded-lg ${
                                    on ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                            </span>
                            <span
                                className={`text-sm font-medium ${
                                    on ? 'text-indigo-900' : 'text-slate-600'
                                }`}
                            >
                                {cause.title}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Forklarings-vekt */}
            <div className="px-6">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Hvor mye er forklart?
                    </span>
                    <span className="text-sm font-bold text-indigo-700 tabular-nums">{pct} %</span>
                </div>
                <div className="relative h-4 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${complete ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                    />
                    {/* Terskel-strek: helhetlig forklaring */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                        style={{ left: `${THRESHOLD}%` }}
                    />
                </div>
                <div className="flex justify-end mt-1">
                    <span className="text-[11px] text-slate-400" style={{ marginRight: `${100 - THRESHOLD}%` }}>
                        Helhetlig forklaring
                    </span>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pt-4 pb-2 min-h-[3.5rem]">
                <AnimatePresence mode="wait">
                    {complete ? (
                        <motion.div
                            key="verdict"
                            initial={{ opacity: 0, scale: 0.96, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                            className="flex items-start gap-2 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                        >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                            <span>
                                Slik ser historikerne det: ingen enkelt årsak forklarer alt. Det var
                                summen av flere som virket sammen og gjorde ende på nordboerne.
                            </span>
                        </motion.div>
                    ) : lastPicked ? (
                        <motion.div
                            key={lastPicked.id + (active.has(lastPicked.id) ? '-on' : '-off')}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm"
                        >
                            {active.has(lastPicked.id)
                                ? lastPicked.evidence
                                : 'Du tok denne av vekta. Prøv å legge flere årsaker på samtidig.'}
                        </motion.div>
                    ) : (
                        <p className="px-4 py-3 text-sm text-slate-400">
                            Én årsak er sjelden nok. Legg flere på vekta og se hva som skjer.
                        </p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
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
