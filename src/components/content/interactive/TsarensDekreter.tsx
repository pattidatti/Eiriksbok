import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stamp, Crown, Users, Check } from 'lucide-react';

// Lyspære-øyeblikket: hver reform Peter signerte gjorde Russland sterkere utad,
// og samtidig tyngre å bære for vanlige folk. Eleven ser de to stripene vokse
// side om side og oppdager at den ene aldri kom uten den andre.

interface Dekret {
    id: string;
    year: string;
    title: string;
    // Hva reformen ga Russland utad.
    gain: string;
    // Hvem som betalte for den.
    cost: string;
    // Pedagogisk vekt, ikke måletall: hvor mye dekretet flyttet hver stripe.
    power: number;
    burden: number;
}

interface TsarensDekreterProps {
    title?: string;
    lead?: string;
    decrees?: Dekret[];
    // Hvor høy stormakt-stripa må bli før Russland regnes som stormakt.
    target?: number;
    conclusion?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const DEFAULT_DECREES: Dekret[] = [
    {
        id: 'haer',
        year: '1698',
        title: 'Ny hær etter vestlig mønster',
        gain: 'Russland får en fast, øvd hær i stedet for gardemusketerer.',
        cost: 'Bøndene må stille sønnene sine som soldater på livstid.',
        power: 18,
        burden: 15,
    },
    {
        id: 'krig',
        year: '1700',
        title: 'Krig om Østersjøen',
        gain: 'Russland kjemper seg fram til havet og en vei til Europa.',
        cost: 'Krigen varer i 21 år og koster titusener av liv.',
        power: 22,
        burden: 20,
    },
    {
        id: 'by',
        year: '1703',
        title: 'Ny hovedstad i myra',
        gain: 'Sankt Petersburg blir Russlands vindu mot vest.',
        cost: 'Rundt 40 000 tvangsarbeidere graver byen fram av sumpen.',
        power: 18,
        burden: 24,
    },
    {
        id: 'stat',
        year: '1711',
        title: 'Senat og nye kontorer',
        gain: 'Staten får et styringsapparat som virker uten tsaren til stede.',
        cost: 'Flere embetsmenn må lønnes, og skattene stiger.',
        power: 14,
        burden: 9,
    },
    {
        id: 'kirke',
        year: '1721',
        title: 'Kirken under staten',
        gain: 'Ingen kirkeleder kan lenger si nei til tsaren.',
        cost: 'Kirken mister sin egen stemme i samfunnet.',
        power: 12,
        burden: 10,
    },
    {
        id: 'rang',
        year: '1722',
        title: 'Rangtabellen',
        gain: 'Du klatrer på tjenesten din, ikke på familienavnet ditt.',
        cost: 'Adelen får tvungen tjenesteplikt, og bøndene får ingen stige.',
        power: 16,
        burden: 18,
    },
];

export function TsarensDekreter({
    title = 'Tsarens dekreter',
    lead = 'Klikk et dekret for å signere det. Se hva som skjer med begge stripene.',
    decrees = DEFAULT_DECREES,
    target = 70,
    conclusion = 'Russland ble en stormakt. Legg merke til den nederste stripa: den steg like fort. Peter fikk aldri det ene uten det andre.',
}: TsarensDekreterProps) {
    const [signed, setSigned] = useState<string[]>([]);
    const [last, setLast] = useState<Dekret | null>(null);

    const list = decrees.length > 0 ? decrees : DEFAULT_DECREES;
    const signedSet = new Set(signed);
    const power = Math.min(
        100,
        list.filter((d) => signedSet.has(d.id)).reduce((sum, d) => sum + d.power, 0)
    );
    const burden = Math.min(
        100,
        list.filter((d) => signedSet.has(d.id)).reduce((sum, d) => sum + d.burden, 0)
    );
    const phase: Phase = power >= target ? 'complete' : signed.length > 0 ? 'active' : 'idle';

    const sign = (d: Dekret) => {
        if (signedSet.has(d.id)) return;
        setSigned((prev) => [...prev, d.id]);
        setLast(d);
    };

    const handleReset = () => {
        setSigned([]);
        setLast(null);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Stamp className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{lead}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: dekretene */}
            <div className="p-4 sm:p-5 grid gap-2.5 grid-cols-1 sm:grid-cols-2">
                {list.map((d) => {
                    const isSigned = signedSet.has(d.id);
                    return (
                        <motion.button
                            key={d.id}
                            onClick={() => sign(d)}
                            whileHover={isSigned ? undefined : { y: -2 }}
                            whileTap={isSigned ? undefined : { scale: 0.97 }}
                            animate={isSigned ? { rotate: [0, -1.4, 0] } : { rotate: 0 }}
                            transition={{ duration: 0.35 }}
                            aria-pressed={isSigned}
                            className={`relative text-left rounded-xl border p-3 min-h-[132px] transition-colors ${
                                isSigned
                                    ? 'bg-emerald-50 border-emerald-200 cursor-default'
                                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:shadow-md cursor-pointer'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span
                                    className={`text-[11px] font-bold tracking-wide ${
                                        isSigned ? 'text-emerald-700' : 'text-indigo-600'
                                    }`}
                                >
                                    {d.year}
                                </span>
                                {isSigned && (
                                    <motion.span
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 rounded-full px-1.5 py-0.5"
                                    >
                                        <Check className="w-3 h-3" />
                                        Signert
                                    </motion.span>
                                )}
                            </div>
                            <p className="mt-1 text-sm font-semibold text-slate-800 leading-snug">
                                {d.title}
                            </p>
                            <AnimatePresence initial={false}>
                                {isSigned ? (
                                    <motion.div
                                        key="revealed"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-2 space-y-1"
                                    >
                                        <p className="text-[11px] leading-snug text-indigo-800">
                                            <Crown className="inline w-3 h-3 mr-1 -mt-0.5" />
                                            {d.gain}
                                        </p>
                                        <p className="text-[11px] leading-snug text-amber-800">
                                            <Users className="inline w-3 h-3 mr-1 -mt-0.5" />
                                            {d.cost}
                                        </p>
                                    </motion.div>
                                ) : (
                                    <motion.p
                                        key="unsigned"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-2 text-[11px] text-slate-400"
                                    >
                                        Klikk for å signere
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* To striper som vokser side om side */}
            <div className="px-4 sm:px-5 pb-1 space-y-3">
                <Stripe
                    label="Russland som stormakt"
                    value={power}
                    target={target}
                    barClass="bg-indigo-500"
                    trackClass="bg-indigo-100"
                />
                <Stripe
                    label="Byrden på vanlige folk"
                    value={burden}
                    barClass="bg-amber-500"
                    trackClass="bg-amber-100"
                />
            </div>

            {/* Feedback-sone: alltid i DOM-et */}
            <div className="px-4 sm:px-5 pt-3 pb-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase === 'complete' ? 'done' : (last?.id ?? 'tom')}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg text-sm border ${
                            phase === 'complete'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : phase === 'active'
                                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                    >
                        {phase === 'complete'
                            ? conclusion
                            : (last?.title ?? 'Ingen dekreter er signert ennå.')}
                        {phase === 'active' && last ? ` ${last.gain} Men: ${last.cost}` : ''}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-5 py-4 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                    {signed.length} av {list.length} dekreter signert
                </span>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

function Stripe({
    label,
    value,
    target,
    barClass,
    trackClass,
}: {
    label: string;
    value: number;
    target?: number;
    barClass: string;
    trackClass: string;
}) {
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{label}</span>
                {target !== undefined && (
                    <span className="text-[10px] text-slate-400">Mål: stormakt</span>
                )}
            </div>
            <div className={`relative h-3 rounded-full overflow-hidden ${trackClass}`}>
                <motion.div
                    className={`h-full rounded-full ${barClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
                {target !== undefined && (
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-500/60"
                        style={{ left: `${target}%` }}
                    />
                )}
            </div>
        </div>
    );
}
