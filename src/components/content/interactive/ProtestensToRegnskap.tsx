import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal se at Alta-aksjonen tapte det den kjempet for,
// og samtidig vant noe den ikke hadde bedt om. To regnskap som beveger seg motsatt
// vei gjennom de samme hendelsene gjør det synlig på én skjerm.

interface RegnskapSteg {
    year: string;
    title: string;
    text: string;
    // Verdien de to målerne står på ETTER at denne hendelsen har skjedd (0-100).
    venstre: number;
    hoyre: number;
}

interface ProtestensToRegnskapProps {
    title?: string;
    instruction?: string;
    venstreLabel?: string;
    hoyreLabel?: string;
    steps?: RegnskapSteg[];
    conclusion?: string;
}

const STANDARD_STEG: RegnskapSteg[] = [
    {
        year: '1978',
        title: 'Folkeaksjonen samler underskrifter',
        text: 'Rundt 15 000 mennesker skriver under mot utbyggingen. Elva kan fortsatt reddes, men ingen snakker ennå om samiske rettigheter.',
        venstre: 90,
        hoyre: 10,
    },
    {
        year: '1979',
        title: 'Telt og sultestreik foran Stortinget',
        text: 'Samiske aktivister slår opp telt i Oslo og slutter å spise. Nå ser hele landet, og utlandet, at dette handler om mer enn en elv.',
        venstre: 75,
        hoyre: 30,
    },
    {
        year: '1980',
        title: 'Staten setter ned Samerettsutvalget',
        text: 'Regjeringen må svare på et spørsmål den har unngått: har samene egne rettigheter i Norge? Et utvalg får i oppdrag å finne ut av det.',
        venstre: 70,
        hoyre: 48,
    },
    {
        year: '1982',
        title: 'Høyesterett: utbyggingen er lovlig',
        text: 'Aksjonistene taper i landets øverste domstol. Folkeaksjonen legger ned arbeidet. Elva er tapt.',
        venstre: 15,
        hoyre: 50,
    },
    {
        year: '1987',
        title: 'Sameloven og dammen samme år',
        text: 'Alta-dammen åpner. Samme år vedtar Stortinget sameloven, som slår fast at samene skal ha et eget folkevalgt organ.',
        venstre: 0,
        hoyre: 68,
    },
    {
        year: '1988-1989',
        title: 'Grunnloven og Sametinget',
        text: 'Samene får sin egen paragraf i Grunnloven, og Sametinget åpner i Karasjok. Det staten avviste i 1979, er nå norsk lov.',
        venstre: 0,
        hoyre: 86,
    },
    {
        year: '2005-2021',
        title: 'Finnmarksloven og Fosen-dommen',
        text: 'Grunnen i Finnmark får nye eiere, og Høyesterett stopper en vindkraftutbygging fordi den tar for mye reinbeite.',
        venstre: 0,
        hoyre: 100,
    },
];

type Phase = 'idle' | 'active' | 'complete';

export function ProtestensToRegnskap({
    title = 'Protestens to regnskap',
    instruction = 'Klikk deg gjennom hendelsene. Følg med på begge målerne samtidig.',
    venstreLabel = 'Sjansen for å redde elva',
    hoyreLabel = 'Samiske rettigheter i loven',
    steps = STANDARD_STEG,
    conclusion = 'Se på de to målerne. Aksjonen tapte alt den kjempet for, og fikk likevel gjennomslag for noe den ikke hadde bedt om. Det er derfor Alta-saken regnes som det viktigste vendepunktet i norsk samepolitikk.',
}: ProtestensToRegnskapProps) {
    const [index, setIndex] = useState(-1);

    const phase: Phase = index < 0 ? 'idle' : index >= steps.length - 1 ? 'complete' : 'active';
    const aktiv = index >= 0 ? steps[index] : null;
    const venstre = aktiv ? aktiv.venstre : 100;
    const hoyre = aktiv ? aktiv.hoyre : 0;

    const handleNext = () => {
        if (index < steps.length - 1) setIndex(index + 1);
    };

    const handleReset = () => setIndex(-1);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{instruction}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 space-y-5">
                {/* De to målerne */}
                <div className="grid gap-4 sm:grid-cols-2">
                    <Maaler
                        label={venstreLabel}
                        value={venstre}
                        barClass="bg-sky-500"
                        trackClass="bg-sky-100"
                        textClass="text-sky-700"
                    />
                    <Maaler
                        label={hoyreLabel}
                        value={hoyre}
                        barClass="bg-emerald-500"
                        trackClass="bg-emerald-100"
                        textClass="text-emerald-700"
                    />
                </div>

                {/* Hendelseskort */}
                <div className="min-h-[7.5rem] rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                        >
                            {aktiv ? (
                                <>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-sm font-bold text-indigo-600 tabular-nums">
                                            {aktiv.year}
                                        </span>
                                        <span className="font-semibold text-slate-800">
                                            {aktiv.title}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                                        {aktiv.text}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Elva er urørt, og samiske rettigheter står ikke i noen norsk
                                    lov. Trykk på knappen under for å starte i 1978.
                                </p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Stegprikker */}
                <div className="flex items-center justify-center gap-2">
                    {steps.map((s, i) => (
                        <button
                            key={s.year + s.title}
                            type="button"
                            aria-label={`Hendelse ${i + 1}: ${s.year}`}
                            onClick={() => setIndex(i)}
                            className={`h-2.5 rounded-full transition-all ${
                                i === index
                                    ? 'w-7 bg-indigo-600'
                                    : i < index
                                      ? 'w-2.5 bg-indigo-300'
                                      : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                            className="flex gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                        >
                            <motion.span
                                initial={{ rotate: -25, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="w-5 h-5 shrink-0 text-emerald-500" />
                            </motion.span>
                            <span>{conclusion}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="underveis"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            {phase === 'idle'
                                ? 'To målere, sju hendelser. Legg merke til hvilken vei hver av dem beveger seg.'
                                : `Hendelse ${index + 1} av ${steps.length}. Fortsett, og se hva som skjer med den grønne måleren.`}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleNext}
                    disabled={phase === 'complete'}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    {index < 0 ? 'Start i 1978' : 'Neste hendelse'}
                    <ArrowRight className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}

function Maaler({
    label,
    value,
    barClass,
    trackClass,
    textClass,
}: {
    label: string;
    value: number;
    barClass: string;
    trackClass: string;
    textClass: string;
}) {
    return (
        <div>
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {label}
                </span>
                <motion.span
                    key={value}
                    initial={{ scale: 1.25 }}
                    animate={{ scale: 1 }}
                    className={`text-sm font-bold tabular-nums ${textClass}`}
                >
                    {value} %
                </motion.span>
            </div>
            <div className={`h-3 w-full rounded-full overflow-hidden ${trackClass}`}>
                <motion.div
                    className={`h-full rounded-full ${barClass}`}
                    initial={false}
                    animate={{ width: `${value}%` }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                />
            </div>
        </div>
    );
}
