import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, CreditCard, RotateCcw, Trophy } from 'lucide-react';

// Minstebelopsfellen: en gaming-PC til 15 000 kroner er kjøpt på kredittkort. Eleven velger
// hvordan gjelden skal betales ned: bare minstebeløpet, eller et fast beløp hver måned. For hvert
// valg ser eleven hvor mange måneder det tar, og hvor mye PC-en til slutt kostet.
//
// Lyspære-øyeblikket: Betaler du bare minstebeløpet, går nesten alt til renter. Gjelden varer i
// årevis, og PC-en blir mye dyrere enn prislappen. Et fast, høyere beløp gjør lånet kort og billig.
//
// At kredittkort ofte har en effektiv rente på rundt 20 prosent, kommer fra Forbrukerrådet
// (ung.no, 2025). Minstebeløpet (3 prosent av gjelden, men minst 300 kroner) og alle kronebeløp
// er et tenkt eksempel.

interface MinstebelopsfellenProps {
    title?: string;
    pris?: number;
    effektivRente?: number;
}

type ValgId = 'minste' | 'fast700' | 'fast1500';

interface Valg {
    id: ValgId;
    navn: string;
    hint: string;
    betaling: (saldo: number) => number;
}

const VALG: Valg[] = [
    {
        id: 'minste',
        navn: 'Bare minstebeløpet',
        hint: '3 % av gjelden, minst 300 kr',
        betaling: (saldo) => Math.max(saldo * 0.03, 300),
    },
    { id: 'fast700', navn: '700 kr i måneden', hint: 'Samme beløp hver måned', betaling: () => 700 },
    {
        id: 'fast1500',
        navn: '1 500 kr i måneden',
        hint: 'Samme beløp hver måned',
        betaling: () => 1500,
    },
];

function simuler(pris: number, aarsrente: number, betaling: (saldo: number) => number) {
    const maanedsrente = Math.pow(1 + aarsrente, 1 / 12) - 1;
    let saldo = pris;
    let totalt = 0;
    let maaneder = 0;
    while (saldo > 0.005 && maaneder < 600) {
        saldo += saldo * maanedsrente;
        const betalt = Math.min(saldo, betaling(saldo));
        saldo -= betalt;
        totalt += betalt;
        maaneder += 1;
    }
    return { maaneder, totalt: Math.round(totalt), renter: Math.round(totalt - pris) };
}

const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`;

function varighet(maaneder: number) {
    const aar = Math.floor(maaneder / 12);
    const rest = maaneder % 12;
    if (aar === 0) return `${rest} måneder`;
    const aarTekst = aar === 1 ? '1 år' : `${aar} år`;
    return rest === 0 ? aarTekst : `${aarTekst} og ${rest} mnd`;
}

export function Minstebelopsfellen({
    title = 'Minstebeløpsfellen',
    pris = 15000,
    effektivRente = 0.2,
}: MinstebelopsfellenProps) {
    const [valgt, setValgt] = useState<ValgId | null>(null);
    const [provd, setProvd] = useState<ValgId[]>([]);

    const resultater = useMemo(() => {
        const r = {} as Record<ValgId, ReturnType<typeof simuler>>;
        for (const v of VALG) r[v.id] = simuler(pris, effektivRente, v.betaling);
        return r;
    }, [pris, effektivRente]);

    const maksTotalt = Math.max(...VALG.map((v) => resultater[v.id].totalt));
    const ferdig = provd.length === VALG.length;

    const velg = (id: ValgId) => {
        setValgt(id);
        setProvd((p) => (p.includes(id) ? p : [...p, id]));
    };

    const nullstill = () => {
        setValgt(null);
        setProvd([]);
    };

    const aktiv = valgt ? resultater[valgt] : null;
    const minste = resultater.minste;
    const raskest = resultater.fast1500;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du har kjøpt en gaming-PC til {kr(pris)} på kredittkort med{' '}
                        {Math.round(effektivRente * 100)} % effektiv rente. Velg hvordan du betaler
                        den ned.
                    </p>
                </div>
            </div>

            {/* Valg */}
            <div className="p-6 grid gap-3 sm:grid-cols-3">
                {VALG.map((v) => {
                    const erValgt = valgt === v.id;
                    const erProvd = provd.includes(v.id);
                    return (
                        <motion.button
                            key={v.id}
                            type="button"
                            onClick={() => velg(v.id)}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            className={`text-left rounded-xl border px-4 py-3 shadow-sm ${
                                erValgt
                                    ? 'border-indigo-400 bg-indigo-50 shadow-md'
                                    : 'border-slate-200 bg-slate-50 hover:shadow-md'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-slate-800 text-sm">
                                    {v.navn}
                                </span>
                                {erProvd && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2.5 h-2.5 rounded-full bg-emerald-400"
                                    />
                                )}
                            </div>
                            <span className="text-xs text-slate-500">{v.hint}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Søyler */}
            <div className="px-6 pb-2 space-y-3">
                {VALG.map((v) => {
                    const res = resultater[v.id];
                    const vis = provd.includes(v.id);
                    const prisAndel = (pris / maksTotalt) * 100;
                    const renteAndel = (res.renter / maksTotalt) * 100;
                    return (
                        <div key={v.id} className="flex items-center gap-3">
                            <span className="w-32 shrink-0 text-xs text-slate-600">{v.navn}</span>
                            <div className="flex-1 h-6 rounded-full bg-slate-100 overflow-hidden flex">
                                <motion.div
                                    className="h-full bg-indigo-400"
                                    initial={false}
                                    animate={{ width: vis ? `${prisAndel}%` : '0%' }}
                                    transition={{ duration: 0.5 }}
                                />
                                <motion.div
                                    className="h-full bg-rose-400"
                                    initial={false}
                                    animate={{ width: vis ? `${renteAndel}%` : '0%' }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                />
                            </div>
                            <span className="w-20 shrink-0 text-right text-xs font-semibold text-slate-700">
                                {vis ? kr(res.totalt) : '?'}
                            </span>
                        </div>
                    );
                })}
                <div className="flex gap-4 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-indigo-400" /> Prisen på PC-en
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-sm bg-rose-400" /> Renter
                    </span>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="mx-6 my-4 min-h-[5.5rem]">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex gap-3"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <Trophy className="w-5 h-5 shrink-0" />
                            </motion.span>
                            <span>
                                Du har sett alle tre. Med bare minstebeløpet tar det{' '}
                                {varighet(minste.maaneder)} og koster {kr(minste.renter)} i renter.
                                Med 1 500 kr i måneden er du ferdig på {varighet(raskest.maaneder)}{' '}
                                og betaler {kr(raskest.renter)} i renter. Samme PC, helt ulik pris.
                            </span>
                        </motion.div>
                    ) : aktiv && valgt ? (
                        <motion.div
                            key={valgt}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm flex gap-3 ${
                                valgt === 'minste'
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            <CalendarClock className="w-5 h-5 shrink-0" />
                            <span>
                                Du betaler i {varighet(aktiv.maaneder)}. PC-en koster deg til
                                sammen {kr(aktiv.totalt)}, og {kr(aktiv.renter)} av det er renter.
                                {valgt === 'minste' &&
                                    ' Minstebeløpet blir mindre når gjelden krymper, så gjelden krymper sakte.'}{' '}
                                Prøv de andre valgene også.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Trykk på et av de tre valgene for å se hva PC-en egentlig koster.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                    Tenkt eksempel. {provd.length} av {VALG.length} valg prøvd.
                </span>
                <button
                    type="button"
                    onClick={nullstill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-2"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
