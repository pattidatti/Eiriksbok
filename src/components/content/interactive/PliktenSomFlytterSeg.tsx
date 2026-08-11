import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Anchor, ArrowRightLeft, Check, RotateCcw, Sparkles, X } from 'lucide-react';

interface PliktenSomFlytterSegProps {
    title?: string;
}

type Bucket = 'fraFor' | 'flyttes';
type Kjonn = 'gutt' | 'jente';

interface Kort {
    id: string;
    label: string;
    fasit: Bucket;
    forklaring: string;
}

interface Plassert {
    kort: Kort;
    valgt: Bucket;
    riktig: boolean;
}

const FELLESKORT: Kort[] = [
    {
        id: 'folket',
        label: 'Å høre til det jødiske folket',
        fasit: 'fraFor',
        forklaring:
            'Dette lå der fra før. Seremonien gjør ingen til jøde. Den gjør en jøde ansvarlig.',
    },
    {
        id: 'livet',
        label: 'Å få bryte et bud for å redde et liv',
        fasit: 'fraFor',
        forklaring:
            'Regelen pikuah nefesh gjelder i alle aldre. Nesten alle bud kan brytes for å redde et menneskeliv.',
    },
];

const KORT: Record<Kjonn, Kort[]> = {
    gutt: [
        {
            id: 'budene',
            label: 'Ansvaret for at de jødiske budene blir holdt',
            fasit: 'flyttes',
            forklaring:
                'Fram til myndighetsdagen er det foreldrene som svarer for dette. Fra dagen etter svarer gutten selv.',
        },
        FELLESKORT[0],
        {
            id: 'minyan',
            label: 'Å bli talt med i en bønnegruppe',
            fasit: 'flyttes',
            forklaring:
                'En bønnegruppe krever ti myndige. Først nå teller gutten med i det tallet.',
        },
        FELLESKORT[1],
        {
            id: 'tora',
            label: 'Å lese ukens toraavsnitt høyt for menigheten',
            fasit: 'flyttes',
            forklaring:
                'Den første sabbaten etter bursdagen leser gutten fra Toraen foran menigheten for første gang.',
        },
        {
            id: 'navn',
            label: 'Navnet du bærer',
            fasit: 'fraFor',
            forklaring:
                'Gutter får navnet sitt allerede ved brit mila, på den åttende dagen etter fødselen.',
        },
    ],
    jente: [
        {
            id: 'budene-jente',
            label: 'Ansvaret for de budene som gjelder jenter og kvinner',
            fasit: 'flyttes',
            forklaring:
                'Fra tolvårsdagen svarer jenta selv for de religiøse forpliktelsene som er lagt på jenter og kvinner.',
        },
        FELLESKORT[0],
        {
            id: 'voksen',
            label: 'Å bli regnet som voksen i religiøs sammenheng',
            fasit: 'flyttes',
            forklaring: 'Dette er nettopp det bat mitzva betyr: hun regnes nå som voksen.',
        },
        FELLESKORT[1],
        {
            id: 'tora-jente',
            label: 'Å lese fra torarullene under gudstjenesten',
            fasit: 'fraFor',
            forklaring:
                'I ortodoks tradisjon leser ikke kvinner fra torarullene under gudstjenesten, verken før eller etter denne dagen. I konservativ jødedom, reformjødedom og rekonstruksjonisme gjør jenter det på lik linje med guttene.',
        },
        {
            id: 'minyan-jente',
            label: 'Å bli talt med i en bønnegruppe',
            fasit: 'fraFor',
            forklaring:
                'I ortodoks tradisjon telles ikke kvinner med i en bønnegruppe. I flere nyere retninger kan de det, og da gjelder det uansett alder over myndighetsdagen.',
        },
    ],
};

const TERSKEL: Record<Kjonn, string> = {
    gutt: '13 år og én dag',
    jente: '12 år',
};

const BUCKETS: { id: Bucket; tittel: string; undertekst: string }[] = [
    { id: 'fraFor', tittel: 'Lå der fra før', undertekst: 'Ingenting nytt skjer denne dagen' },
    {
        id: 'flyttes',
        tittel: 'Flytter seg denne dagen',
        undertekst: 'Fra foreldrene til ungdommen',
    },
];

export function PliktenSomFlytterSeg({
    title = 'Plikten som flytter seg',
}: PliktenSomFlytterSegProps) {
    const [kjonn, setKjonn] = useState<Kjonn>('gutt');
    const [index, setIndex] = useState(0);
    const [plassert, setPlassert] = useState<Plassert[]>([]);

    const kortstokk = KORT[kjonn];
    const ferdig = index >= kortstokk.length;
    const aktivt = ferdig ? null : kortstokk[index];
    const siste = plassert.length > 0 ? plassert[plassert.length - 1] : null;
    const riktige = plassert.filter((p) => p.riktig).length;

    const byttKjonn = (nytt: Kjonn) => {
        if (nytt === kjonn) return;
        setKjonn(nytt);
        setIndex(0);
        setPlassert([]);
    };

    const velg = (bucket: Bucket) => {
        if (!aktivt) return;
        setPlassert((forrige) => [
            ...forrige,
            { kort: aktivt, valgt: bucket, riktig: bucket === aktivt.fasit },
        ]);
        setIndex((i) => i + 1);
    };

    const tilbakestill = () => {
        setIndex(0);
        setPlassert([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk hvor hvert kort hører hjemme på myndighetsdagen.
                    </p>
                </div>
            </div>

            <div className="px-6 pt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full bg-slate-100 p-1">
                    {(['gutt', 'jente'] as Kjonn[]).map((k) => (
                        <button
                            key={k}
                            onClick={() => byttKjonn(k)}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                                kjonn === k
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {k === 'gutt' ? 'Gutt' : 'Jente'}
                        </button>
                    ))}
                </div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={kjonn}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-slate-600"
                    >
                        Myndighetsdagen inntreffer ved{' '}
                        <span className="font-semibold text-slate-800">{TERSKEL[kjonn]}</span> i
                        ortodoks tradisjon.
                    </motion.p>
                </AnimatePresence>
            </div>

            <div className="px-6 pt-4">
                <div className="min-h-[112px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        {aktivt ? (
                            <motion.div
                                key={aktivt.id}
                                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -14, scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                className="w-full max-w-xl rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center shadow-sm"
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Kort {index + 1} av {kortstokk.length}
                                </p>
                                <p className="mt-1 text-lg font-semibold text-slate-800">
                                    {aktivt.label}
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className="w-full max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center"
                            >
                                <motion.div
                                    initial={{ rotate: -20, scale: 0.6 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                    className="mx-auto mb-1 w-fit"
                                >
                                    <Sparkles className="w-6 h-6 text-emerald-600" />
                                </motion.div>
                                <p className="text-lg font-semibold text-emerald-800">
                                    {riktige} av {kortstokk.length} riktig plassert
                                </p>
                                <p className="mt-1 text-sm text-emerald-700">
                                    {kjonn === 'gutt'
                                        ? 'Bar mitzva betyr forpliktelsens sønn.'
                                        : 'Bat mitzva betyr forpliktelsens datter.'}{' '}
                                    Festen er ikke selve saken. Selve saken er at ansvaret har
                                    byttet eier.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="px-6 pt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {BUCKETS.map((bucket) => {
                    const iBoks = plassert.filter((p) => p.kort.fasit === bucket.id);
                    const erFlytt = bucket.id === 'flyttes';
                    return (
                        <button
                            key={bucket.id}
                            onClick={() => velg(bucket.id)}
                            disabled={ferdig}
                            className={`rounded-xl border p-4 text-left transition-shadow ${
                                erFlytt
                                    ? 'border-indigo-200 bg-indigo-50'
                                    : 'border-slate-200 bg-slate-50'
                            } ${ferdig ? 'cursor-default opacity-90' : 'shadow-sm hover:shadow-md'}`}
                        >
                            <span className="flex items-center gap-2">
                                {erFlytt ? (
                                    <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                                ) : (
                                    <Anchor className="w-4 h-4 text-slate-500" />
                                )}
                                <span
                                    className={`font-semibold ${
                                        erFlytt ? 'text-indigo-800' : 'text-slate-700'
                                    }`}
                                >
                                    {bucket.tittel}
                                </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                                {bucket.undertekst}
                            </span>
                            <span className="mt-3 flex min-h-[64px] flex-wrap content-start gap-1.5">
                                <AnimatePresence>
                                    {iBoks.map((p) => (
                                        <motion.span
                                            key={p.kort.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.7, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.7 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 24,
                                            }}
                                            className={`inline-flex items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-xs ${
                                                p.riktig
                                                    ? 'border-emerald-200 text-emerald-700'
                                                    : 'border-rose-200 text-rose-700'
                                            }`}
                                        >
                                            {p.riktig ? (
                                                <Check className="w-3 h-3" />
                                            ) : (
                                                <X className="w-3 h-3" />
                                            )}
                                            {p.kort.label}
                                        </motion.span>
                                    ))}
                                </AnimatePresence>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={siste ? siste.kort.id : 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            !siste
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : siste.riktig
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                  : 'border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                    >
                        {!siste
                            ? 'Velg en av de to boksene over for kortet som vises.'
                            : `${siste.riktig ? 'Riktig.' : 'Ikke helt.'} ${siste.kort.forklaring}`}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-6 py-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                    {kortstokk.map((kort, i) => (
                        <motion.span
                            key={kort.id}
                            animate={{ scale: i === index ? 1.25 : 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className={`block h-2 w-2 rounded-full ${
                                i < index
                                    ? 'bg-indigo-500'
                                    : i === index
                                      ? 'bg-indigo-300'
                                      : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </span>
                <button
                    onClick={tilbakestill}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
