import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Banknote,
    RotateCcw,
    ArrowRight,
    Sparkles,
    FileSignature,
    Wallet,
    Home,
    Building2,
} from 'lucide-react';

// Signaturkomponent for artikkelen «Hvordan penger blir til».
// Lyspæren: banken flytter ikke penger fra en annen konto. Den skriver to nye tall
// i samme sekund - innskuddet (bankens gjeld til deg) og gjeldsbrevet (din gjeld til
// banken) - og når lånet nedbetales, viskes begge ut igjen.
//
// Fire faser med én knapp om gangen. Balansen er alltid i likevekt: venstre side
// (bankens eiendeler) og høyre side (bankens gjeld) er alltid like høye.

type Phase = 'start' | 'skapt' | 'brukt' | 'slettet';

interface PengeskaperenProps {
    title?: string;
}

const BELOP = 2_000_000;

const nok = (n: number) => n.toLocaleString('nb-NO');

export function Pengeskaperen({ title = 'Slik lager banken penger' }: PengeskaperenProps) {
    const [phase, setPhase] = useState<Phase>('start');

    const reset = () => setPhase('start');

    const next: Record<Phase, Phase | null> = {
        start: 'skapt',
        skapt: 'brukt',
        brukt: 'slettet',
        slettet: null,
    };

    const ctaLabel: Record<Phase, string> = {
        start: `Innvilg lånet på ${nok(BELOP)} kr`,
        skapt: 'Amina kjøper leiligheten',
        brukt: 'Amina nedbetaler lånet',
        slettet: '',
    };

    // Hvor mye som står på hver side av bankens balanse i hver fase.
    const harLan = phase === 'skapt' || phase === 'brukt';
    const gjeldsbrev = harLan ? BELOP : 0;
    const innskudd = phase === 'skapt' ? BELOP : 0;
    // Når Amina betaler selgeren, bytter innskuddet bank. Vår bank må sende
    // sentralbankreserver med, og de teller som en negativ eiendel her.
    const reserverUt = phase === 'brukt' ? BELOP : 0;

    // Pengemengden i samfunnet: innskuddet finnes uansett hvilken bank det står i.
    const pengemengde = harLan ? BELOP : 0;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Banknote className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Amina skal kjøpe leilighet. Trykk deg gjennom og se hva som skjer i bankens
                        regnskap.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {/* Teller: penger i samfunnet */}
                <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Nye penger i Norge
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <motion.span
                            key={pengemengde}
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                            className={`text-2xl font-black tabular-nums ${
                                pengemengde > 0 ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                        >
                            {nok(pengemengde)}
                        </motion.span>
                        <span className="text-sm text-slate-500">kr</span>
                    </div>
                </div>

                {/* Bankens balanse: to sider som alltid er like høye */}
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
                            Bankens regnskap
                        </span>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-slate-200">
                        <BalanceSide
                            heading="Banken eier"
                            align="left"
                            rows={[
                                {
                                    key: 'gjeldsbrev',
                                    icon: <FileSignature className="w-4 h-4 text-indigo-600" />,
                                    label: 'Aminas gjeldsbrev',
                                    sub: 'Hun lover å betale tilbake',
                                    value: gjeldsbrev,
                                    tone: 'indigo',
                                },
                                {
                                    key: 'reserver',
                                    icon: <Building2 className="w-4 h-4 text-amber-600" />,
                                    label: 'Reserver sendt bort',
                                    sub: 'Til selgerens bank',
                                    value: reserverUt,
                                    tone: 'amber',
                                    negative: true,
                                },
                            ]}
                        />
                        <BalanceSide
                            heading="Banken skylder"
                            align="right"
                            rows={[
                                {
                                    key: 'innskudd',
                                    icon: <Wallet className="w-4 h-4 text-emerald-600" />,
                                    label: 'Aminas innskudd',
                                    sub: 'Pengene på kontoen hennes',
                                    value: innskudd,
                                    tone: 'emerald',
                                },
                                {
                                    key: 'flyttet',
                                    icon: <Home className="w-4 h-4 text-slate-500" />,
                                    label: 'Innskuddet er borte herfra',
                                    sub: 'Det står nå i selgerens bank. Pengene finnes fortsatt.',
                                    value: 0,
                                    tone: 'slate',
                                    noteOnly: phase === 'brukt',
                                },
                            ]}
                        />
                    </div>
                </div>

                {/* Feedback-sone. Alltid i DOM-et. */}
                <div className="mt-5 min-h-[76px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={phase}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="text-sm leading-relaxed"
                        >
                            {phase === 'start' && (
                                <p className="text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                                    Regnskapet er tomt. Amina spør banken om to millioner til
                                    leilighet. Banken har ingen sparepenger fra andre kunder
                                    liggende. Kan den likevel gi henne lånet?
                                </p>
                            )}
                            {phase === 'skapt' && (
                                <div className="text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex gap-2">
                                    <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                                    <p>
                                        Ja. Banken skrev to nye tall i samme sekund: innskuddet
                                        Amina kan bruke, og gjeldsbrevet hun må betale tilbake. De
                                        er like store, så regnskapet går opp. Ingen andres konto ble
                                        tømt, og det finnes nå to millioner kroner mer i Norge enn
                                        for ett sekund siden.
                                    </p>
                                </div>
                            )}
                            {phase === 'brukt' && (
                                <div className="text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-2">
                                    <Building2 className="w-5 h-5 flex-shrink-0 text-blue-500" />
                                    <p>
                                        Amina betaler selgeren, og innskuddet flytter til selgerens
                                        bank. Nå må banken vår sende ekte sentralbankreserver dit,
                                        og dem kan den ikke lage selv. Legg merke til telleren:
                                        pengene ble flyttet, ikke laget. Det er derfor en bank ikke
                                        kan låne ut i det uendelige.
                                    </p>
                                </div>
                            )}
                            {phase === 'slettet' && (
                                <div className="text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex gap-2">
                                    <Sparkles className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                                    <p>
                                        Amina betaler ned lånet. Gjeldsbrevet og innskuddet stryker
                                        hverandre ut, og de to millionene forsvinner ut av
                                        økonomien. Penger blir laget når vi låner, og slettet når vi
                                        betaler tilbake.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {next[phase] ? (
                    <button
                        onClick={() => setPhase(next[phase]!)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                        {ctaLabel[phase]}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-sm">
                        <Sparkles className="w-4 h-4" />
                        Pengene ble laget, brukt og slettet igjen
                    </div>
                )}
                <button
                    onClick={reset}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors inline-flex items-center gap-1 flex-shrink-0"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}

type Tone = 'indigo' | 'emerald' | 'amber' | 'slate';

interface BalanceRow {
    key: string;
    icon: React.ReactNode;
    label: string;
    sub: string;
    value: number;
    tone: Tone;
    negative?: boolean;
    // Nøytral merknad uten beløp: raden forklarer noe, men er ikke en post
    // på balansen (f.eks. innskuddet som nettopp forlot banken).
    noteOnly?: boolean;
}

const BAR: Record<Tone, string> = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400',
};

const TEXT: Record<Tone, string> = {
    indigo: 'text-indigo-700',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    slate: 'text-slate-600',
};

function BalanceSide({
    heading,
    align,
    rows,
}: {
    heading: string;
    align: 'left' | 'right';
    rows: BalanceRow[];
}) {
    const active = rows.filter((r) => r.value > 0 || r.noteOnly);
    return (
        <div className="p-4 bg-white">
            <p
                className={`text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-3 ${
                    align === 'right' ? 'text-right' : ''
                }`}
            >
                {heading}
            </p>
            <div className="space-y-2.5 min-h-[132px]">
                <AnimatePresence mode="popLayout">
                    {active.map((row) => (
                        <motion.div
                            key={row.key}
                            layout
                            initial={{ opacity: 0, scaleY: 0.2, y: 6 }}
                            animate={{ opacity: 1, scaleY: 1, y: 0 }}
                            exit={{ opacity: 0, scaleY: 0.2, y: -6 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                            style={{ originY: 0.5 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                {row.icon}
                                <span className="text-xs font-semibold text-slate-700 leading-tight">
                                    {row.label}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">{row.sub}</p>
                            {!row.noteOnly && (
                                <>
                                    <div
                                        className={`mt-1.5 text-sm font-black tabular-nums ${TEXT[row.tone]}`}
                                    >
                                        {row.negative ? '-' : ''}
                                        {nok(row.value)} kr
                                    </div>
                                    <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            className={`h-full rounded-full ${BAR[row.tone]}`}
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 110,
                                                damping: 20,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
                {active.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400">
                        Tomt
                    </div>
                )}
            </div>
        </div>
    );
}
