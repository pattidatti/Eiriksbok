import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Baby, Lightbulb, RotateCcw, Trophy, User, Users } from 'lucide-react';

// FireToEn: eleven velger hvor mange barn hvert par får (1, 2 eller 3) og ser tre generasjoner
// i en slekt vokse fram: fire besteforeldre, foreldregenerasjonen og barnebarna. Når alle tre
// valgene er prøvd, vises de virkelige tallene for hvor stor del av Kinas befolkning som er 60
// år eller eldre.
//
// Lyspære-øyeblikket: Når hvert par bare får ett barn, blir hver generasjon halvparten så stor
// som den forrige. Ett barnebarn står igjen med to foreldre og fire besteforeldre over seg
// (4-2-1), og et helt land blir raskt eldre.
//
// Modellen er forenklet: alle par får like mange barn, og alle gifter seg. Tallene for Kina er
// hentet fra National Bureau of Statistics of China (2021, 2026).

interface FireToEnProps {
    title?: string;
}

type Phase = 'idle' | 'active' | 'complete';

interface Valg {
    barn: number;
    tekst: string;
}

const VALG: Valg[] = [
    {
        barn: 1,
        tekst: 'Dette er 4-2-1-familien. Ett barnebarn har seks eldre over seg i slekta, og ingen søsken å dele på ansvaret med. Generasjonen krymper for hver runde.',
    },
    {
        barn: 2,
        tekst: 'Med to barn per par blir generasjonene omtrent like store. Hvert barnebarn deler på to eldre i slekta.',
    },
    {
        barn: 3,
        tekst: 'Med tre barn per par blir hver generasjon større enn den forrige. Da vokser befolkningen raskt. Det var nettopp det Kinas ledere var redde for rundt 1980.',
    },
];

const KINA = [
    { aar: '2010', andel: 13.3 },
    { aar: '2020', andel: 18.7 },
    { aar: '2025', andel: 23.0 },
];

function Rad({
    navn,
    antall,
    farge,
    ikon: Ikon,
}: {
    navn: string;
    antall: number;
    farge: string;
    ikon: typeof User;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-right">
                <div className="text-xs font-medium text-slate-600">{navn}</div>
                <motion.div
                    key={antall}
                    initial={{ scale: 1.3, color: '#4f46e5' }}
                    animate={{ scale: 1, color: '#1e293b' }}
                    className="font-display text-lg font-bold"
                >
                    {antall}
                </motion.div>
            </div>
            <div className="flex flex-wrap gap-1.5 min-h-[2.25rem] items-center">
                <AnimatePresence>
                    {Array.from({ length: antall }).map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 18, delay: i * 0.04 }}
                            className={`w-8 h-8 rounded-full border flex items-center justify-center ${farge}`}
                        >
                            <Ikon className="w-4 h-4" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export function FireToEn({ title = 'Fire, to, én' }: FireToEnProps) {
    const [barn, setBarn] = useState<number | null>(null);
    const [provd, setProvd] = useState<number[]>([]);
    const [phase, setPhase] = useState<Phase>('idle');

    const besteforeldre = 4;
    const foreldre = barn ? 2 * barn : 0;
    const barnebarn = barn ? barn * barn : 0;
    const eldrePerBarn = barn ? (besteforeldre + foreldre) / barnebarn : 0;
    const valg = VALG.find((v) => v.barn === barn) ?? null;

    const velg = (n: number) => {
        setBarn(n);
        const nye = provd.includes(n) ? provd : [...provd, n];
        setProvd(nye);
        setPhase(nye.length === VALG.length ? 'complete' : 'active');
    };

    const handleReset = () => {
        setBarn(null);
        setProvd([]);
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Users className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Velg hvor mange barn hvert par får, og se hva som skjer med slekta over tre
                        generasjoner. Prøv alle tre.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 grid gap-5 md:grid-cols-[1fr_14rem]">
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {VALG.map((v) => {
                            const er = v.barn === barn;
                            return (
                                <motion.button
                                    key={v.barn}
                                    type="button"
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() => velg(v.barn)}
                                    className={`rounded-full border px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${
                                        er
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <Baby className="w-4 h-4" />
                                    {v.barn} barn per par
                                    {provd.includes(v.barn) && !er && (
                                        <span className="text-emerald-600 text-xs">✓</span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
                        <Rad
                            navn="Besteforeldre"
                            antall={barn ? besteforeldre : 0}
                            farge="bg-amber-50 border-amber-200 text-amber-700"
                            ikon={User}
                        />
                        <Rad
                            navn="Foreldre, tanter og onkler"
                            antall={foreldre}
                            farge="bg-blue-50 border-blue-200 text-blue-700"
                            ikon={User}
                        />
                        <Rad
                            navn="Barnebarn"
                            antall={barnebarn}
                            farge="bg-emerald-50 border-emerald-200 text-emerald-700"
                            ikon={Baby}
                        />
                        {!barn && (
                            <p className="text-sm text-slate-500 text-center">
                                Velg et antall barn over for å bygge slekta.
                            </p>
                        )}
                    </div>
                </div>

                {/* Nøkkeltall og Kina */}
                <div className="self-start space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center">
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            Eldre i slekta per barnebarn
                        </div>
                        <motion.div
                            key={eldrePerBarn}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            className={`font-display text-3xl font-bold ${
                                eldrePerBarn >= 4 ? 'text-rose-600' : 'text-slate-800'
                            }`}
                        >
                            {barn ? eldrePerBarn.toLocaleString('nb-NO', { maximumFractionDigits: 1 }) : '-'}
                        </motion.div>
                        <div className="text-xs text-slate-500">{provd.length} av 3 valg prøvd</div>
                    </div>

                    <AnimatePresence>
                        {phase === 'complete' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-xl border border-indigo-200 bg-indigo-50 p-3"
                            >
                                <div className="text-[11px] uppercase tracking-wide text-indigo-700 mb-2">
                                    Kina i virkeligheten: andel som er 60 år eller eldre
                                </div>
                                <div className="space-y-1.5">
                                    {KINA.map((k, i) => (
                                        <div key={k.aar} className="flex items-center gap-2 text-xs">
                                            <span className="w-9 text-slate-600">{k.aar}</span>
                                            <div className="flex-1 h-3 rounded-full bg-white">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(k.andel / 25) * 100}%` }}
                                                    transition={{ delay: 0.2 + i * 0.25, duration: 0.6 }}
                                                    className="h-3 rounded-full bg-indigo-500"
                                                />
                                            </div>
                                            <span className="w-10 text-right font-semibold text-slate-700">
                                                {k.andel.toLocaleString('nb-NO', { minimumFractionDigits: 1 })} %
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feedback-sone - alltid synlig */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key={`ferdig-${barn}`}
                            initial={{ opacity: 0, scale: 0.95, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                {valg ? `${valg.tekst} ` : ''}
                                <span className="font-semibold">Du har prøvd alle tre. </span>
                                Ettbarnspolitikken stoppet den raske veksten, men den gjorde også
                                barnebarnsgenerasjonen liten. Derfor blir Kina nå eldre i høy fart.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={barn ?? 'start'}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm flex gap-3 ${
                                barn === 1
                                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                            }`}
                        >
                            <Lightbulb className="w-5 h-5 shrink-0" />
                            <span>
                                {valg
                                    ? valg.tekst
                                    : 'Start med å velge 1 barn per par. Det var regelen for de fleste i byene i Kina.'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                    Forenklet modell: alle par får like mange barn, og alle gifter seg.
                </span>
                <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5 shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
