import { useEffect, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import {
    Baby,
    CheckCircle2,
    FastForward,
    Gift,
    GraduationCap,
    Receipt,
    RotateCcw,
    School,
    Users,
} from 'lucide-react';

// RegningenDin: eleven spoler fram sitt eget liv fra fødselen til slutten av ungdomsskolen, ett år
// om gangen. For hvert år vokser en kvittering som viser hva fellesskapet har betalt for barnet
// (barnetrygd, barnehage, grunnskole), og hva familien selv har betalt.
//
// Lyspære-øyeblikket: Fra du ble født til du går ut av ungdomsskolen har fellesskapet betalt
// millioner av kroner for deg, mens familien din bare har betalt en liten bit. Og nesten alle barn
// får det samme, uansett hva foreldrene tjener.

type IkonNavn = 'gave' | 'barnehage' | 'skole' | 'utdanning' | 'baby';

interface Post {
    id: string;
    navn: string;
    ikon: IkonNavn;
    /** Første leveår posten gjelder (0 = første år etter fødselen). */
    fraAlder: number;
    /** Posten gjelder til (men ikke med) denne alderen. */
    tilAlder: number;
    /** Hva fellesskapet betaler per år. */
    perAar: number;
    /** Hva familien selv betaler per år (høyst). */
    familienPerAar?: number;
    forklaring: string;
}

interface RegningenDinProps {
    title?: string;
    sluttAlder?: number;
    poster?: Post[];
    kildenotat?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const STANDARD_POSTER: Post[] = [
    {
        id: 'barnetrygd',
        navn: 'Barnetrygd',
        ikon: 'gave',
        fraAlder: 0,
        tilAlder: 18,
        perAar: 24144,
        forklaring: '2 012 kroner i måneden til alle barn, uansett hva foreldrene tjener.',
    },
    {
        id: 'barnehage',
        navn: 'Barnehageplass',
        ikon: 'barnehage',
        fraAlder: 1,
        tilAlder: 6,
        perAar: 296000,
        familienPerAar: 14400,
        forklaring: 'Kommunen betaler nesten hele plassen. Foreldrene betaler høyst 1 200 kroner i måneden.',
    },
    {
        id: 'grunnskole',
        navn: 'Grunnskole',
        ikon: 'skole',
        fraAlder: 6,
        tilAlder: 16,
        perAar: 165000,
        forklaring: 'Lærere, klasserom, bøker og PC-er. Skolen er gratis for deg.',
    },
];

const IKONER = {
    gave: Gift,
    barnehage: Baby,
    skole: School,
    utdanning: GraduationCap,
    baby: Baby,
};

function kroner(n: number) {
    return `${Math.round(n).toLocaleString('nb-NO')} kr`;
}

function aarIPost(post: Post, alder: number) {
    // Antall hele år av posten som er gått når barnet har fylt `alder` år.
    return Math.max(0, Math.min(alder, post.tilAlder) - post.fraAlder);
}

function TelleTall({ verdi, className }: { verdi: number; className?: string }) {
    const mv = useMotionValue(verdi);
    const tekst = useTransform(mv, (v) => kroner(v));
    useEffect(() => {
        const kontroll = animate(mv, verdi, { duration: 0.6, ease: 'easeOut' });
        return () => kontroll.stop();
    }, [mv, verdi]);
    return <motion.span className={`whitespace-nowrap ${className ?? ''}`}>{tekst}</motion.span>;
}

function hint(alder: number, slutt: number) {
    if (alder === 0) return 'Du er nettopp født. Trykk på knappen og se hva det første året koster.';
    if (alder < 6) return `Du er ${alder} år. Barnehagen er den største posten nå. Se hvor lite familien betaler.`;
    if (alder < slutt) return `Du er ${alder} år og går på skolen. Hvert skoleår legger til en stor sum.`;
    return '';
}

export function RegningenDin({
    title = 'Regningen din',
    sluttAlder = 16,
    poster = STANDARD_POSTER,
    kildenotat = 'Tallene er avrundede snitt fra SSB og NAV. Barnetrygden er regnet med satsen fra 2026.',
}: RegningenDinProps) {
    const [alder, setAlder] = useState(0);
    const phase: Phase = alder === 0 ? 'idle' : alder >= sluttAlder ? 'complete' : 'active';

    const rader = poster.map((p) => {
        const aar = aarIPost(p, alder);
        return {
            ...p,
            aar,
            fellesskapet: aar * p.perAar,
            familien: aar * (p.familienPerAar ?? 0),
            aktivNaa: alder >= p.fraAlder && alder < p.tilAlder,
        };
    });
    const sumFellesskapet = rader.reduce((s, r) => s + r.fellesskapet, 0);
    const sumFamilien = rader.reduce((s, r) => s + r.familien, 0);
    const maks = Math.max(sumFellesskapet, 1);

    const spolFram = () => setAlder((a) => Math.min(sluttAlder, a + 1));
    const tilSlutten = () => setAlder(sluttAlder);
    const tilbakestill = () => setAlder(0);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Receipt className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Spol fram livet ditt, ett år om gangen. Hva har fellesskapet betalt for deg?
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6 grid gap-5 md:grid-cols-[1fr_1.3fr]">
                {/* Alder og knapper */}
                <div className="flex flex-col gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                        <div className="text-xs uppercase tracking-wide text-slate-500">Alderen din</div>
                        <motion.div
                            key={alder}
                            initial={{ scale: 1.3, opacity: 0.4 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="font-display text-5xl font-bold text-indigo-600"
                        >
                            {alder} år
                        </motion.div>
                        <div className="mt-3 flex gap-1" aria-hidden>
                            {Array.from({ length: sluttAlder }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="h-2 flex-1 rounded-full"
                                    animate={{
                                        backgroundColor: i < alder ? '#6366f1' : '#e2e8f0',
                                    }}
                                />
                            ))}
                        </div>
                        <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                            <span>Født</span>
                            <span>Barnehage</span>
                            <span>Skole</span>
                            <span>{sluttAlder} år</span>
                        </div>
                    </div>

                    {/* Sammenligning */}
                    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                        <div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="flex items-center gap-1.5 text-slate-700 whitespace-nowrap">
                                    <Users className="w-4 h-4 text-indigo-500" /> Fellesskapet betalte
                                </span>
                                <TelleTall verdi={sumFellesskapet} className="font-semibold text-indigo-700 tabular-nums" />
                            </div>
                            <div className="mt-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className="h-full bg-indigo-500 rounded-full"
                                    animate={{ width: `${(sumFellesskapet / maks) * 100}%` }}
                                    transition={{ duration: 0.6 }}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                                <span className="flex items-center gap-1.5 text-slate-700 whitespace-nowrap">
                                    <Baby className="w-4 h-4 text-amber-500" /> Familien din betalte
                                </span>
                                <TelleTall verdi={sumFamilien} className="font-semibold text-amber-700 tabular-nums" />
                            </div>
                            <div className="mt-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                <motion.div
                                    className="h-full bg-amber-400 rounded-full"
                                    animate={{ width: `${(sumFamilien / maks) * 100}%` }}
                                    transition={{ duration: 0.6 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kvitteringen */}
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4">
                    <div className="text-center text-xs font-mono uppercase tracking-widest text-slate-500 pb-2 border-b border-dashed border-slate-300">
                        Kvittering fra fellesskapet
                    </div>
                    <ul className="divide-y divide-dashed divide-slate-200">
                        {rader.map((r) => {
                            const Ikon = IKONER[r.ikon] ?? Gift;
                            const startet = r.aar > 0;
                            return (
                                <motion.li
                                    key={r.id}
                                    className="py-3 flex gap-3"
                                    animate={{ opacity: startet || r.aktivNaa ? 1 : 0.45 }}
                                >
                                    <motion.div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                        animate={{
                                            backgroundColor: r.aktivNaa ? '#e0e7ff' : '#f1f5f9',
                                            scale: r.aktivNaa && alder > 0 ? [1, 1.12, 1] : 1,
                                        }}
                                        transition={{ duration: 0.4 }}
                                        key={`${r.id}-${alder}`}
                                    >
                                        <Ikon className="w-5 h-5 text-indigo-600" />
                                    </motion.div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                                            <span className="font-medium text-slate-800 text-sm">
                                                {r.navn}
                                                {startet && (
                                                    <span className="text-slate-400 font-normal whitespace-nowrap">
                                                        {' '}
                                                        x {r.aar} år
                                                    </span>
                                                )}
                                            </span>
                                            <TelleTall
                                                verdi={r.fellesskapet}
                                                className="font-mono text-sm text-slate-800 tabular-nums"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 leading-snug">
                                            {startet || r.aktivNaa
                                                ? r.forklaring
                                                : `Starter når du er ${r.fraAlder} år.`}
                                        </p>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </ul>
                    <div className="pt-2 border-t-2 border-slate-300 flex items-baseline justify-between">
                        <span className="font-mono text-xs uppercase tracking-wide text-slate-600">Sum</span>
                        <TelleTall
                            verdi={sumFellesskapet}
                            className="font-mono text-lg font-bold text-indigo-700 tabular-nums"
                        />
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-4 sm:px-6 pb-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex gap-3"
                        >
                            <motion.div
                                initial={{ rotate: -90, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                            >
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                            </motion.div>
                            <p>
                                Du er {sluttAlder} år. Fellesskapet har betalt rundt{' '}
                                <strong>{kroner(sumFellesskapet)}</strong> for deg. Familien din har selv betalt{' '}
                                <strong>{kroner(sumFamilien)}</strong> for barnehagen. Nesten alle barn i Norge får
                                det samme, uansett hva foreldrene tjener. Regningen betales med skatt fra alle
                                som jobber og handler.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.p
                            key={`hint-${alder}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {hint(alder, sluttAlder)}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-4 sm:px-6 pb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={spolFram}
                        disabled={phase === 'complete'}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full px-6 py-2 text-sm font-medium flex items-center gap-2"
                    >
                        <FastForward className="w-4 h-4" /> Ett år eldre
                    </motion.button>
                    {phase !== 'complete' && (
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={tilSlutten}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm"
                        >
                            Hopp til {sluttAlder} år
                        </motion.button>
                    )}
                </div>
                <button
                    onClick={tilbakestill}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
            <p className="px-4 sm:px-6 pb-4 text-[11px] text-slate-400">{kildenotat}</p>
        </div>
    );
}
