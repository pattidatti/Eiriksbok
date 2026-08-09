import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, RefreshCw, GitMerge } from 'lucide-react';

interface KaldKrigBlowbackChainProps {
    title?: string;
}

interface ChainStep {
    year: string;
    label: string;
    text: string;
    variant: 'decision' | 'consequence' | 'legacy';
}

interface Chain {
    id: string;
    headerYear: string;
    headerTitle: string;
    steps: [ChainStep, ChainStep, ChainStep];
}

const CHAINS: Chain[] = [
    {
        id: 'kupp',
        headerYear: '1953',
        headerTitle: 'CIA-kuppet i Iran',
        steps: [
            {
                year: '1953',
                label: 'Beslutningen',
                text: 'CIA og britisk etterretning styrtet Irans demokratisk valgte statsminister Mosaddegh for å beholde vestlig kontroll over olja.',
                variant: 'decision',
            },
            {
                year: '1979',
                label: '26 år senere',
                text: 'Et folk som husket kuppet reiste seg. Folkelig revolusjon styrtet sjahen og erstattet ham med et dypt anti-vestlig regime.',
                variant: 'consequence',
            },
            {
                year: 'I dag',
                label: 'Arven',
                text: 'Iran er fortsatt USA sitt viktigste motstanderland i Midtøsten. Fiendskapet begynte ikke i 1979 - det begynte i 1953.',
                variant: 'legacy',
            },
        ],
    },
    {
        id: 'mujahedin',
        headerYear: '1979-89',
        headerTitle: 'CIA finansierte mujahedin',
        steps: [
            {
                year: '1979-89',
                label: 'Beslutningen',
                text: 'CIA pumpet milliarder til islamske krigere i Afghanistan for a gi Sovjet sitt eget Vietnam. Saudi-Arabia bidro med like mye.',
                variant: 'decision',
            },
            {
                year: '1989',
                label: 'Da Sovjet dro hjem',
                text: 'Det fungerte - Sovjet trakk seg ut, svekket og ydmyket. Men USA glemte Afghanistan. Tusenvis av bevapnede, radikaliserte krigere ble staende uten jobb i et land i aske.',
                variant: 'consequence',
            },
            {
                year: '2001',
                label: 'Arven',
                text: 'Nettverkene CIA bygde ble grunnlaget for al-Qaida. Angrepene 11. september 2001 ble planlagt av menn som en gang fikk trening og vapen finansiert av USA.',
                variant: 'legacy',
            },
        ],
    },
    {
        id: 'saddam',
        headerYear: '1980-88',
        headerTitle: 'Stotten til Saddam Hussein',
        steps: [
            {
                year: '1980-88',
                label: 'Beslutningen',
                text: 'Da Saddam Hussein angrep Iran valgte USA a stotte ham med etterretning og tilgang til kjemiske stoffer - mot en ellers erklart fiende.',
                variant: 'decision',
            },
            {
                year: '1990-2003',
                label: 'Klienten snudde seg',
                text: 'Saddam invaderte Kuwait i 1990. USA matte bekjempe sin tidligere klient. I 2003 invaderte USA Irak og styrtet Saddam - men ingen hadde en plan for hva som kom etter.',
                variant: 'consequence',
            },
            {
                year: '2014',
                label: 'Arven',
                text: 'Maktvakuumet skapte IS. Mange av IS sine ledere var tidligere offiserer i Saddams har - menn som ble arbeidsledige da USA opplosste det irakiske militaret i 2003.',
                variant: 'legacy',
            },
        ],
    },
];

const stepStyles: Record<ChainStep['variant'], string> = {
    decision: 'bg-amber-50 border-amber-200 text-amber-900',
    consequence: 'bg-orange-50 border-orange-200 text-orange-900',
    legacy: 'bg-rose-50 border-rose-200 text-rose-900',
};

const dotStyles: Record<ChainStep['variant'], string> = {
    decision: 'bg-amber-400',
    consequence: 'bg-orange-500',
    legacy: 'bg-rose-600',
};

const stepLabelStyles: Record<ChainStep['variant'], string> = {
    decision: 'text-amber-700',
    consequence: 'text-orange-700',
    legacy: 'text-rose-700',
};

export function KaldKrigBlowbackChain({ title = 'Kaldkrigets blowback-kjede' }: KaldKrigBlowbackChainProps) {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const isComplete = expanded.size === CHAINS.length;

    const toggle = (id: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    const handleReset = () => setExpanded(new Set());

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose my-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <GitMerge className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Klikk pa en beslutning for a se hva den egentlig skapte
                    </p>
                </div>
            </div>

            {/* Chain accordion */}
            <div className="divide-y divide-slate-100">
                {CHAINS.map((chain) => {
                    const isOpen = expanded.has(chain.id);
                    const isDone = expanded.has(chain.id);

                    return (
                        <div key={chain.id}>
                            <button
                                onClick={() => toggle(chain.id)}
                                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                                        {chain.headerYear}
                                    </span>
                                    <span className="font-medium text-slate-800 text-sm">{chain.headerTitle}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    {isDone && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        </motion.div>
                                    )}
                                    <motion.div
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    </motion.div>
                                </div>
                            </button>

                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-4 pt-1">
                                            <div className="relative pl-5">
                                                {/* Vertical connector line */}
                                                <div className="absolute left-[8px] top-3 bottom-3 w-px bg-slate-200" />

                                                {chain.steps.map((step, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -6 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1, duration: 0.2 }}
                                                        className="relative mb-2.5 last:mb-0"
                                                    >
                                                        {/* Timeline dot */}
                                                        <div
                                                            className={`absolute left-[-13px] top-3 w-2.5 h-2.5 rounded-full border-2 border-white ${dotStyles[step.variant]}`}
                                                        />

                                                        <div className={`rounded-lg border px-3 py-2.5 ${stepStyles[step.variant]}`}>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span
                                                                    className={`text-[10px] font-bold uppercase tracking-wide ${stepLabelStyles[step.variant]}`}
                                                                >
                                                                    {step.label}
                                                                </span>
                                                                <span className="text-[10px] opacity-50 font-mono">
                                                                    {step.year}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs leading-relaxed">{step.text}</p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Completion insight */}
            <AnimatePresence>
                {isComplete && (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mx-5 mt-3 mb-1 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200"
                    >
                        <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                            Det er et mønster her. USA tok tre kortsiktige gevinster og skapte tre av sine storste motstandere.
                            Det er det som kalles blowback - tilbakeslagene fra kortsiktig tenkning.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    {expanded.size} av {CHAINS.length} kjeder utforsket
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                >
                    <RefreshCw className="w-3 h-3" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
