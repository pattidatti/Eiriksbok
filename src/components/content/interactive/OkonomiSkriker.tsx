import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, Truck, TrendingDown, Newspaper, Siren, RotateCcw } from 'lucide-react';

interface OkonomiSkrikerProps {
    title?: string;
}

interface Lever {
    id: string;
    icon: typeof Ban;
    label: string;
    detail: string;
    weight: number; // hvor mye trykk dette legger på økonomien
}

const LEVERS: Lever[] = [
    {
        id: 'loans',
        icon: Ban,
        label: 'Stopp alle lån',
        detail: 'USA blokkerer lån fra banker og Verdensbanken. Chile får ikke kjøpt deler og varer.',
        weight: 30,
    },
    {
        id: 'strikes',
        icon: Truck,
        label: 'Finansier streikene',
        detail: 'CIA betaler lastebilsjåførene for å streike. Varer råtner, butikkene går tomme.',
        weight: 25,
    },
    {
        id: 'copper',
        icon: TrendingDown,
        label: 'Press ned kobberprisen',
        detail: 'Kobber er Chiles viktigste inntekt. Lav pris betyr tom statskasse.',
        weight: 25,
    },
    {
        id: 'press',
        icon: Newspaper,
        label: 'Støtt opposisjonsavisene',
        detail: 'USA betaler aviser for å spre frykt og uro mot president Allende.',
        weight: 15,
    },
];

const COUP_THRESHOLD = 80;

export function OkonomiSkriker({
    title = 'Få økonomien til å skrike',
}: OkonomiSkrikerProps) {
    const [active, setActive] = useState<Set<string>>(new Set());

    const pressure = LEVERS.filter((l) => active.has(l.id)).reduce((s, l) => s + l.weight, 0);
    const economy = Math.max(0, 100 - pressure);
    const coup = pressure >= COUP_THRESHOLD;

    const toggle = (id: string) => {
        if (coup) return;
        setActive((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const reset = () => setActive(new Set());

    const status = coup
        ? 'Økonomien har kollapset.'
        : economy > 70
          ? 'Økonomien holder stand - foreløpig.'
          : economy > 40
            ? 'Økonomien begynner å skrike...'
            : 'Økonomien er i fritt fall.';

    return (
        <div className="my-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="mb-1 text-lg font-bold text-slate-900">{title}</h3>
            <p className="mb-5 text-sm text-slate-500">
                Du er USA i 1973. Du vil ikke invadere Chile - du vil kvele økonomien til militæret
                griper inn. Skru på trykket.
            </p>

            {/* Måler: økonomiens helse */}
            <div className="mb-5 rounded-lg bg-slate-50 p-3">
                <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Chiles økonomi
                    </span>
                    <motion.span
                        key={economy}
                        initial={{ scale: 1.25 }}
                        animate={{ scale: 1 }}
                        className={`text-sm font-bold ${
                            economy > 70 ? 'text-emerald-600' : economy > 40 ? 'text-amber-600' : 'text-rose-600'
                        }`}
                    >
                        {economy}%
                    </motion.span>
                </div>
                <div className="relative h-4 overflow-hidden rounded-full bg-slate-200">
                    <motion.div
                        className={`h-full rounded-full ${
                            economy > 70 ? 'bg-emerald-500' : economy > 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        initial={false}
                        animate={{ width: `${economy}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                    />
                    {/* Kupp-terskel */}
                    <div
                        className="absolute top-0 h-full border-l-2 border-dashed border-slate-900/40"
                        style={{ left: `${100 - COUP_THRESHOLD}%` }}
                    />
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">{status}</p>
            </div>

            <AnimatePresence mode="wait">
                {!coup ? (
                    <motion.div
                        key="levers"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid gap-2.5 sm:grid-cols-2"
                    >
                        {LEVERS.map((l) => {
                            const on = active.has(l.id);
                            const Icon = l.icon;
                            return (
                                <button
                                    key={l.id}
                                    onClick={() => toggle(l.id)}
                                    className={`flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                                        on
                                            ? 'border-rose-400 bg-rose-50'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <div
                                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                            on ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-bold text-slate-800">
                                                {l.label}
                                            </span>
                                            <span
                                                className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors ${
                                                    on ? 'justify-end bg-rose-500' : 'justify-start bg-slate-300'
                                                }`}
                                            >
                                                <span className="h-4 w-4 rounded-full bg-white" />
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs leading-snug text-slate-600">
                                            {l.detail}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                ) : (
                    <motion.div
                        key="coup"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 140, damping: 15 }}
                        className="rounded-lg bg-slate-900 p-4 text-white"
                    >
                        <div className="mb-2 flex items-center gap-2 text-rose-300">
                            <Siren className="h-5 w-5" />
                            <span className="text-base font-bold">11. september 1973: kuppet</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-200">
                            Da økonomien lå i ruiner, slo militæret til. President Allende døde i
                            presidentpalasset mens det ble bombet. General Augusto Pinochet tok makten
                            og styrte som diktator i 17 år. USA avfyrte aldri et skudd - de bare skrudde
                            opp trykket til noen andre gjorde jobben.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-5 flex items-center justify-between">
                <button
                    onClick={reset}
                    className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="h-4 w-4" /> Start på nytt
                </button>
                <span className="text-xs text-slate-400">
                    {coup
                        ? 'Kuppet er et faktum.'
                        : `Trykk: ${pressure} / ${COUP_THRESHOLD} for kupp`}
                </span>
            </div>
        </div>
    );
}
