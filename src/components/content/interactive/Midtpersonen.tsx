import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lightbulb, RotateCcw, Trophy, User, Users } from 'lucide-react';

// Midtpersonen: eleven gjetter medianalderen i fire land (Niger, Nigeria, Norge og Japan) med en
// glidebryter. Når gjetningen er sendt, stiller 21 personer seg opp i en rekke fra yngst til
// eldst, fordelt etter hvor mange som er barn, voksne og eldre i landet. Personen i midten er
// «midtpersonen», og alderen hennes er medianalderen.
//
// Lyspære-øyeblikket: Medianalderen er alderen til personen i midten av køen. I Niger er
// halvparten av innbyggerne yngre enn 16 år, mens midtpersonen i Norge er nesten 40 og i Japan
// nesten 50. Ordet «befolkning» betyr helt ulike ting i ulike land.
//
// Tallene er for 2023 og kommer fra FNs World Population Prospects 2024 (hentet via Our World
// in Data 04.11.2026).

interface Land {
    navn: string;
    median: number;
    barn: number; // andel under 15 år, i prosent
    eldre: number; // andel 65 år eller eldre, i prosent
    fruktbarhet: number;
    tekst: string;
}

interface MidtpersonenProps {
    title?: string;
    land?: Land[];
}

type Phase = 'idle' | 'active' | 'complete';

const STANDARD_LAND: Land[] = [
    {
        navn: 'Niger',
        median: 15.3,
        barn: 47,
        eldre: 2.6,
        fruktbarhet: 6.1,
        tekst: 'Nesten halvparten av køen er barn. Midtpersonen er bare 15 år, altså en ungdomsskoleelev.',
    },
    {
        navn: 'Nigeria',
        median: 17.8,
        barn: 41.5,
        eldre: 3,
        fruktbarhet: 4.5,
        tekst: 'Nigeria er Afrikas mest folkerike land. Også her er midtpersonen en tenåring.',
    },
    {
        navn: 'Norge',
        median: 39.5,
        barn: 16.5,
        eldre: 18.5,
        fruktbarhet: 1.4,
        tekst: 'I Norge er det flere eldre enn barn i køen. Midtpersonen er nesten 40 år, like gammel som mange foreldre.',
    },
    {
        navn: 'Japan',
        median: 49,
        barn: 11.6,
        eldre: 29.5,
        fruktbarhet: 1.2,
        tekst: 'Japan er et av de eldste landene i verden. Nesten hver tredje person i køen er 65 år eller eldre.',
    },
];

const ANTALL = 21;
const MIDTEN = Math.floor(ANTALL / 2);

// Fordeler 21 personer på barn, voksne og eldre etter andelene (største rest-metoden),
// slik at summen alltid blir 21.
function fordel(land: Land): ('barn' | 'voksen' | 'eldre')[] {
    const andeler = [land.barn, 100 - land.barn - land.eldre, land.eldre];
    const raa = andeler.map((a) => (a / 100) * ANTALL);
    const hele = raa.map(Math.floor);
    let rest = ANTALL - hele.reduce((s, n) => s + n, 0);
    const rekkefolge = raa
        .map((r, i) => ({ i, rest: r - Math.floor(r) }))
        .sort((a, b) => b.rest - a.rest);
    for (const { i } of rekkefolge) {
        if (rest <= 0) break;
        hele[i] += 1;
        rest -= 1;
    }
    return [
        ...Array<'barn'>(hele[0]).fill('barn'),
        ...Array<'voksen'>(hele[1]).fill('voksen'),
        ...Array<'eldre'>(hele[2]).fill('eldre'),
    ];
}

const FARGE = {
    barn: 'bg-sky-50 border-sky-200 text-sky-600',
    voksen: 'bg-slate-50 border-slate-200 text-slate-500',
    eldre: 'bg-amber-50 border-amber-200 text-amber-600',
};

const tall = (n: number) => n.toLocaleString('nb-NO', { maximumFractionDigits: 1 });

export function Midtpersonen({ title = 'Midtpersonen', land = STANDARD_LAND }: MidtpersonenProps) {
    const [valgt, setValgt] = useState(0);
    const [gjett, setGjett] = useState(30);
    const [svar, setSvar] = useState<Record<string, number>>({});
    const [phase, setPhase] = useState<Phase>('idle');

    const aktivt = land[valgt];
    const sendt = svar[aktivt.navn] !== undefined;
    const ko = fordel(aktivt);
    const bom = sendt ? Math.abs(svar[aktivt.navn] - aktivt.median) : 0;
    const maksMedian = Math.max(...land.map((l) => l.median));

    const velgLand = (i: number) => {
        setValgt(i);
        setGjett(svar[land[i].navn] ?? 30);
    };

    const send = () => {
        const nye = { ...svar, [aktivt.navn]: gjett };
        setSvar(nye);
        setPhase(Object.keys(nye).length === land.length ? 'complete' : 'active');
    };

    const neste = () => {
        const i = land.findIndex((l) => svar[l.navn] === undefined);
        if (i >= 0) velgLand(i);
    };

    const handleReset = () => {
        setValgt(0);
        setGjett(30);
        setSvar({});
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
                        Still opp hele landet i kø fra yngst til eldst. Hvor gammel er personen i
                        midten? Gjett for alle fire land.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6 space-y-5">
                {/* Landvalg */}
                <div className="flex flex-wrap gap-2">
                    {land.map((l, i) => {
                        const er = i === valgt;
                        const ferdig = svar[l.navn] !== undefined;
                        return (
                            <motion.button
                                key={l.navn}
                                type="button"
                                whileTap={{ scale: 0.94 }}
                                onClick={() => velgLand(i)}
                                className={`rounded-full border px-4 py-2 text-sm font-medium flex items-center gap-1.5 ${
                                    er
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-white border-slate-200 text-slate-700 shadow-sm hover:shadow-md'
                                }`}
                            >
                                {l.navn}
                                {ferdig && (
                                    <Check
                                        className={`w-4 h-4 ${er ? 'text-white' : 'text-emerald-600'}`}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Køen */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-end justify-between gap-0.5 sm:gap-1 min-h-[4.5rem]">
                        {ko.map((gruppe, i) => {
                            const midt = i === MIDTEN;
                            return (
                                <motion.div
                                    key={`${aktivt.navn}-${i}-${sendt}`}
                                    initial={{ opacity: 0, y: -12 }}
                                    animate={{ opacity: 1, y: 0, scale: sendt && midt ? 1.25 : 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 18,
                                        delay: i * 0.025,
                                    }}
                                    className="flex flex-col items-center gap-1 flex-1"
                                >
                                    <div
                                        className={`w-full max-w-[2rem] aspect-square rounded-full border flex items-center justify-center ${
                                            sendt
                                                ? midt
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                    : FARGE[gruppe]
                                                : midt
                                                  ? 'bg-white border-indigo-300 border-dashed text-indigo-400'
                                                  : 'bg-white border-slate-200 text-slate-300'
                                        }`}
                                    >
                                        <User className="w-3/5 h-3/5" />
                                    </div>
                                    {midt && (
                                        <span className="text-[10px] font-semibold text-indigo-600 whitespace-nowrap">
                                            {sendt ? `${tall(aktivt.median)} år` : '?'}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <span>Yngst</span>
                        {sendt ? (
                            <span className="flex flex-wrap gap-3">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-sky-100 border border-sky-300" />
                                    Barn under 15: {tall(aktivt.barn)} %
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 rounded-full bg-amber-100 border border-amber-300" />
                                    65 år og eldre: {tall(aktivt.eldre)} %
                                </span>
                            </span>
                        ) : (
                            <span>Personen i midten har like mange yngre som eldre bak seg.</span>
                        )}
                        <span>Eldst</span>
                    </div>
                </div>

                {/* Gjetting */}
                {!sendt ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="flex-1">
                            <span className="text-sm text-slate-600">
                                Min gjetning for {aktivt.navn}:{' '}
                                <motion.span
                                    key={gjett}
                                    initial={{ scale: 1.25 }}
                                    animate={{ scale: 1 }}
                                    className="inline-block font-display text-xl font-bold text-slate-800"
                                >
                                    {gjett} år
                                </motion.span>
                            </span>
                            <input
                                type="range"
                                min={5}
                                max={60}
                                value={gjett}
                                onChange={(e) => {
                                    setGjett(Number(e.target.value));
                                    if (phase === 'idle') setPhase('active');
                                }}
                                className="w-full accent-indigo-600 mt-1"
                                aria-label={`Gjett medianalderen i ${aktivt.navn}`}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={send}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium shrink-0"
                        >
                            Still opp køen
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-3 text-center">
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                                Din gjetning
                            </div>
                            <div className="font-display text-2xl font-bold text-slate-800">
                                {svar[aktivt.navn]} år
                            </div>
                        </div>
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 shadow-sm">
                            <div className="text-[11px] uppercase tracking-wide text-indigo-700">
                                Medianalder
                            </div>
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                                className="font-display text-2xl font-bold text-indigo-700"
                            >
                                {tall(aktivt.median)} år
                            </motion.div>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                                Barn per kvinne
                            </div>
                            <div className="font-display text-2xl font-bold text-slate-800">
                                {tall(aktivt.fruktbarhet)}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sammenligning når alt er ferdig */}
                <AnimatePresence>
                    {phase === 'complete' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
                        >
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">
                                Midtpersonen i de fire landene (2023)
                            </div>
                            {land.map((l, i) => (
                                <div key={l.navn} className="flex items-center gap-2 text-sm">
                                    <span className="w-16 text-slate-600">{l.navn}</span>
                                    <div className="flex-1 h-3 rounded-full bg-slate-100">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(l.median / maksMedian) * 100}%` }}
                                            transition={{ delay: 0.2 + i * 0.2, duration: 0.6 }}
                                            className={`h-3 rounded-full ${
                                                l.median < 20 ? 'bg-sky-500' : 'bg-amber-500'
                                            }`}
                                        />
                                    </div>
                                    <span className="w-14 text-right font-semibold text-slate-700">
                                        {tall(l.median)} år
                                    </span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone - alltid synlig */}
            <div className="mx-6 mb-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
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
                                <span className="font-semibold">Du har stilt opp alle fire land. </span>
                                Midtpersonen i Japan er over tre ganger så gammel som midtpersonen i
                                Niger. Der kvinner får mange barn, blir køen full av barn, og da blir
                                medianalderen lav.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`${aktivt.navn}-${sendt}`}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm flex gap-3 ${
                                sendt && bom <= 5
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                            }`}
                        >
                            <Lightbulb className="w-5 h-5 shrink-0" />
                            <span>
                                {sendt
                                    ? `${bom <= 5 ? 'Godt gjettet! ' : `Du bommet med ${tall(bom)} år. `}${aktivt.tekst}`
                                    : 'Dra glidebryteren til alderen du tror personen i midten har, og trykk «Still opp køen».'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {sendt && phase !== 'complete' ? (
                    <button
                        type="button"
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Neste land
                    </button>
                ) : (
                    <span className="text-xs text-slate-400">
                        Kilde: FN, World Population Prospects 2024. Hver figur er omtrent 1/21 av
                        landet.
                    </span>
                )}
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
