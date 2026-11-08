import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, Receipt, RotateCcw, Trophy } from 'lucide-react';

// DenGlemteFakturaen: eleven følger én glemt faktura på 200 kroner gjennom purring,
// inkassovarsel og inkasso. På hvert trinn kan eleven velge å betale nå eller vente to uker til.
// Regningen vokser for hvert trinn, mens varen koster det samme.
//
// Lyspære-øyeblikket: Det er ikke varen som blir dyr, det er ventingen. En liten regning kan
// bli tre ganger så stor bare av gebyrer, og jo tidligere du betaler, jo mindre koster det.
//
// Gebyrene er satsene for 2026 fra Finanstilsynet: purring 38 kr, inkassovarsel 38 kr,
// lett salær 187,50 kr og tungt salær 375 kr for krav til og med 500 kr. Frister på 14 dager
// kommer fra Finanstilsynet og Store norske leksikon (inkasso). Forsinkelsesrente er ikke tatt med,
// og dagene er omtrentlige. Hele eksemplet er tenkt.

interface DenGlemteFakturaenProps {
    title?: string;
    vare?: string;
    belop?: number;
}

interface Trinn {
    id: string;
    dag: string;
    navn: string;
    tekst: string;
    gebyr: { navn: string; belop: number }[];
}

const TRINN: Trinn[] = [
    {
        id: 'faktura',
        dag: 'Dag 0',
        navn: 'Fakturaen kommer',
        tekst: 'Du har kjøpt varen og fått 14 dager på deg til å betale.',
        gebyr: [],
    },
    {
        id: 'purring',
        dag: 'Ca. dag 28',
        navn: 'Purring',
        tekst: 'Fristen har gått ut. Du får en påminnelse med gebyr og 14 nye dager.',
        gebyr: [{ navn: 'Purregebyr', belop: 38 }],
    },
    {
        id: 'varsel',
        dag: 'Ca. dag 42',
        navn: 'Inkassovarsel',
        tekst: 'Butikken varsler at saken går til inkasso hvis du ikke betaler innen 14 dager.',
        gebyr: [{ navn: 'Gebyr for inkassovarsel', belop: 38 }],
    },
    {
        id: 'inkasso',
        dag: 'Ca. dag 56',
        navn: 'Inkasso',
        tekst: 'Et inkassoselskap har tatt over kravet og sender deg en betalingsoppfordring.',
        gebyr: [{ navn: 'Inkassosalær', belop: 187.5 }],
    },
    {
        id: 'tungt',
        dag: 'Ca. dag 100',
        navn: 'Tungt salær',
        tekst: 'Du har ventet over fire uker etter fristen. Salæret dobles. Neste steg kan være forliksrådet.',
        gebyr: [{ navn: 'Salæret dobles', belop: 187.5 }],
    },
];

const kr = (n: number) =>
    `${n.toLocaleString('nb-NO', {
        minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
        maximumFractionDigits: 2,
    })} kr`;

type Fase = 'aktiv' | 'betalt';

export function DenGlemteFakturaen({
    title = 'Den glemte fakturaen',
    vare = 'T-skjorte fra nettbutikk',
    belop = 200,
}: DenGlemteFakturaenProps) {
    const [steg, setSteg] = useState(0);
    const [fase, setFase] = useState<Fase>('aktiv');

    const gebyrer = TRINN.slice(0, steg + 1).flatMap((t) => t.gebyr);
    const sumGebyr = gebyrer.reduce((s, g) => s + g.belop, 0);
    const totalt = belop + sumGebyr;
    const maksTotalt = belop + TRINN.flatMap((t) => t.gebyr).reduce((s, g) => s + g.belop, 0);
    const sisteSteg = steg === TRINN.length - 1;
    const naa = TRINN[steg];

    const vent = () => {
        if (!sisteSteg) setSteg((s) => s + 1);
    };
    const betal = () => setFase('betalt');
    const nullstill = () => {
        setSteg(0);
        setFase('aktiv');
    };

    const ganger = totalt / belop;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Receipt className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du kjøpte en {vare.toLowerCase()} til {kr(belop)} med «betal senere».
                        Betal nå, eller vent to uker til og se hva som skjer.
                    </p>
                </div>
            </div>

            {/* Tidslinje */}
            <div className="px-6 pt-5">
                <div className="grid grid-cols-5 gap-1.5">
                    {TRINN.map((t, i) => {
                        const passert = i <= steg;
                        const aktivt = i === steg;
                        return (
                            <div key={t.id} className="flex flex-col items-center text-center">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: aktivt ? 1.15 : 1,
                                        backgroundColor: passert
                                            ? i === 0
                                                ? '#6366f1'
                                                : '#f43f5e'
                                            : '#e2e8f0',
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                >
                                    {i + 1}
                                </motion.div>
                                <span
                                    className={`mt-1 text-[11px] leading-tight ${
                                        passert ? 'text-slate-700 font-medium' : 'text-slate-400'
                                    }`}
                                >
                                    {t.navn}
                                </span>
                                <span className="text-[10px] text-slate-400">{t.dag}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Regningen */}
            <div className="px-6 pt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                        Dette skylder du nå
                    </div>
                    <div className="flex justify-between text-sm text-slate-700">
                        <span>{vare}</span>
                        <span>{kr(belop)}</span>
                    </div>
                    <AnimatePresence initial={false}>
                        {gebyrer.map((g, i) => (
                            <motion.div
                                key={`${g.navn}-${i}`}
                                initial={{ opacity: 0, x: -12, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex justify-between text-sm text-rose-600"
                            >
                                <span>+ {g.navn}</span>
                                <span className="whitespace-nowrap">{kr(g.belop)}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-800">
                        <span>Totalt</span>
                        <motion.span
                            key={totalt}
                            initial={{ scale: 1.3, color: '#e11d48' }}
                            animate={{ scale: 1, color: '#1e293b' }}
                            transition={{ duration: 0.4 }}
                        >
                            {kr(totalt)}
                        </motion.span>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                            <Clock className="w-4 h-4 text-slate-400" /> {naa.dag}: {naa.navn}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{naa.tekst}</p>
                    </div>
                    <div className="mt-3">
                        <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
                            <motion.div
                                className="h-full bg-indigo-400"
                                initial={false}
                                animate={{ width: `${(belop / maksTotalt) * 100}%` }}
                            />
                            <motion.div
                                className="h-full bg-rose-400"
                                initial={false}
                                animate={{ width: `${(sumGebyr / maksTotalt) * 100}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="flex gap-4 text-[11px] text-slate-500 pt-1">
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400" /> Varen
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Gebyrer
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 my-4 min-h-[4.5rem]">
                <AnimatePresence mode="wait">
                    {fase === 'betalt' ? (
                        <motion.div
                            key="betalt"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-3 ${
                                steg === 0
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {steg === 0 ? (
                                    <Trophy className="w-5 h-5 shrink-0" />
                                ) : (
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                )}
                            </motion.span>
                            <span>
                                {steg === 0
                                    ? `Betalt i tide! Varen kostet akkurat ${kr(belop)}. «Betal senere» var gratis fordi du husket fristen.`
                                    : `Betalt. Du betalte ${kr(totalt)} for en vare til ${kr(belop)}. ${kr(sumGebyr)} gikk bare til gebyrer. ${
                                          sisteSteg
                                              ? ''
                                              : 'Prøv igjen og se hvor dyrt det blir hvis du venter enda lenger, eller hvor billig det blir hvis du betaler med en gang.'
                                      }`}
                            </span>
                        </motion.div>
                    ) : sisteSteg ? (
                        <motion.div
                            key="siste"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            Regningen er nå {ganger.toLocaleString('nb-NO', { maximumFractionDigits: 1 })}{' '}
                            ganger så stor som prisen på varen, og da er ikke renter tatt med. Betaler
                            du fortsatt ikke, kan saken gå til forliksrådet. Til slutt kan du få en
                            betalingsanmerkning.
                        </motion.div>
                    ) : steg > 0 ? (
                        <motion.div
                            key={`steg-${steg}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            Varen koster fortsatt {kr(belop)}, men regningen er nå {kr(totalt)}. Det
                            eneste som har endret seg, er at tiden har gått.
                        </motion.div>
                    ) : (
                        <motion.div
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Fakturaen ligger i appen. Velger du å vente, hopper du fram til neste
                            brev.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <motion.button
                        type="button"
                        onClick={betal}
                        disabled={fase === 'betalt'}
                        whileTap={{ scale: 0.95 }}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        Betal nå ({kr(totalt)})
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={vent}
                        disabled={fase === 'betalt' || sisteSteg}
                        whileTap={{ scale: 0.95 }}
                        className="bg-rose-100 hover:bg-rose-200 disabled:opacity-40 text-rose-700 rounded-full px-4 py-2 text-sm font-medium"
                    >
                        Vent to uker til
                    </motion.button>
                </div>
                <button
                    type="button"
                    onClick={nullstill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
            <p className="px-6 pb-4 -mt-2 text-[11px] text-slate-400">
                Tenkt eksempel med gebyrsatsene for 2026. Forsinkelsesrente er ikke tatt med.
            </p>
        </div>
    );
}
