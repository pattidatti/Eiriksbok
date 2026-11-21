import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, CheckCircle2, Droplets, Landmark, PiggyBank, RotateCcw } from 'lucide-react';

// PensjonsBotta: pensjonen er en bøtte som fylles fra tre kraner så lenge du jobber: folketrygden,
// tjenestepensjonen fra arbeidsgiveren og din egen sparing. Eleven skrur kranene av og på og
// velger når bøtta skal tappes. Jo senere du tar ut pensjonen, jo lenger har bøtta fått fylles,
// og jo færre år skal den deles på.
//
// Lyspære-øyeblikket: Pensjonen bygges opp bit for bit gjennom hele arbeidslivet, og den samme
// bøtta gir mye mer hver måned hvis du fyller lenger og deler på færre år.
//
// Regnestykket er bevisst forenklet: fast lønn, ingen lønnsvekst og ingen avkastning, og vi later
// som om alle lever til de er 85. Satsene (18,1 prosent til folketrygden og 2 prosent til
// tjenestepensjon) er de virkelige minstesatsene.

type KranId = 'folketrygd' | 'tjeneste' | 'sparing';

interface Kran {
    id: KranId;
    navn: string;
    forklaring: string;
    /** Kroner per år inn i bøtta. */
    perAr: number;
    farge: string;
    lys: string;
}

interface PensjonsBottaProps {
    title?: string;
    /** Årslønn i eksempelet. */
    lonn?: number;
    /** Alderen du begynner å jobbe fast. */
    startAlder?: number;
    /** Alderen vi later som alle lever til. */
    levertil?: number;
}

const UTTAKSALDRE = [62, 67, 70, 75];

const kr = (n: number) => `${Math.round(n).toLocaleString('nb-NO')} kr`;

export function PensjonsBotta({
    title = 'Pensjonsbøtta',
    lonn = 500000,
    startAlder = 22,
    levertil = 85,
}: PensjonsBottaProps) {
    const kraner: Kran[] = useMemo(
        () => [
            {
                id: 'folketrygd',
                navn: 'Folketrygden',
                forklaring: '18,1 prosent av lønna di, betalt gjennom skatten',
                perAr: lonn * 0.181,
                farge: 'bg-indigo-500',
                lys: 'bg-indigo-50 border-indigo-200 text-indigo-700',
            },
            {
                id: 'tjeneste',
                navn: 'Tjenestepensjon',
                forklaring: 'Minst 2 prosent av lønna, betalt av arbeidsgiveren',
                perAr: lonn * 0.02,
                farge: 'bg-amber-400',
                lys: 'bg-amber-50 border-amber-200 text-amber-700',
            },
            {
                id: 'sparing',
                navn: 'Egen sparing',
                forklaring: '1 000 kroner i måneden som du setter av selv',
                perAr: 12000,
                farge: 'bg-emerald-500',
                lys: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            },
        ],
        [lonn]
    );

    const [apne, setApne] = useState<Record<KranId, boolean>>({
        folketrygd: true,
        tjeneste: true,
        sparing: false,
    });
    const [uttak, setUttak] = useState<number>(67);
    const [provd, setProvd] = useState<number[]>([67]);

    const arJobbet = uttak - startAlder;
    const arMedPensjon = levertil - uttak;
    const deler = kraner.map((k) => ({ ...k, sum: apne[k.id] ? k.perAr * arJobbet : 0 }));
    const total = deler.reduce((s, d) => s + d.sum, 0);
    const perManed = total / (arMedPensjon * 12);

    // Største mulige bøtte: alle kraner åpne, uttak ved høyeste alder. Brukes til å skalere høyden.
    const maksTotal = kraner.reduce((s, k) => s + k.perAr, 0) * (UTTAKSALDRE[3] - startAlder);

    const ferdig = provd.includes(62) && provd.includes(75);

    const velgAlder = (a: number) => {
        setUttak(a);
        setProvd((p) => (p.includes(a) ? p : [...p, a]));
    };

    const nullstill = () => {
        setApne({ folketrygd: true, tjeneste: true, sparing: false });
        setUttak(67);
        setProvd([67]);
    };

    // Månedsbeløp ved 62 og 75 med dagens kraner, til sammenligningen når eleven er ferdig.
    const perAr = kraner.reduce((s, k) => s + (apne[k.id] ? k.perAr : 0), 0);
    const maned = (a: number) => (perAr * (a - startAlder)) / ((levertil - a) * 12);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Droplets className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Skru kranene av og på, og velg når du vil begynne å tappe pensjonen.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-[1fr_200px_1fr] items-start">
                {/* Kranene */}
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Tre kraner
                    </p>
                    {kraner.map((k) => {
                        const Ikon =
                            k.id === 'folketrygd' ? Landmark : k.id === 'tjeneste' ? Briefcase : PiggyBank;
                        const pa = apne[k.id];
                        return (
                            <motion.button
                                key={k.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setApne((s) => ({ ...s, [k.id]: !s[k.id] }))}
                                className={`w-full text-left rounded-xl border px-3 py-2 flex items-start gap-3 ${
                                    pa ? k.lys : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                            >
                                <Ikon className="w-5 h-5 mt-0.5 shrink-0" />
                                <span className="flex-1">
                                    <span className="block text-sm font-semibold">
                                        {k.navn} {pa ? '(på)' : '(av)'}
                                    </span>
                                    <span className="block text-xs">{k.forklaring}</span>
                                </span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Bøtta */}
                <div className="flex flex-col items-center">
                    <div className="relative w-36 h-48 rounded-b-3xl border-4 border-t-0 border-slate-300 bg-slate-50 overflow-hidden flex flex-col-reverse">
                        {deler.map((d) => (
                            <motion.div
                                key={d.id}
                                className={d.farge}
                                initial={false}
                                animate={{ height: `${(d.sum / maksTotal) * 100}%` }}
                                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                            />
                        ))}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 text-center">
                        {arJobbet} år med jobb
                    </p>
                    <motion.p
                        key={total}
                        initial={{ scale: 0.9, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-base font-bold text-slate-800"
                    >
                        {kr(total)}
                    </motion.p>
                </div>

                {/* Uttak */}
                <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Når vil du ta ut pensjon?
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {UTTAKSALDRE.map((a) => (
                            <motion.button
                                key={a}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => velgAlder(a)}
                                className={`rounded-full py-2 text-xs sm:text-sm font-semibold border whitespace-nowrap ${
                                    uttak === a
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                {a} år
                            </motion.button>
                        ))}
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
                        <p className="text-sm">Bøtta skal deles på {arMedPensjon} år.</p>
                        <p className="text-xs text-blue-600">Hver måned får du:</p>
                        <motion.p
                            key={`${uttak}-${total}`}
                            initial={{ y: 6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-2xl font-bold"
                        >
                            {kr(perManed)}
                        </motion.p>
                    </div>
                </div>
            </div>

            {/* Feedback-sone */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm flex gap-2"
                        >
                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                            <span>
                                Med de samme kranene gir 62 år {kr(maned(62))} i måneden, mens 75 år
                                gir {kr(maned(75))}. Jo lenger du fyller bøtta, og jo færre år den
                                skal deles på, jo mer får du hver måned. Det er tanken bak
                                levealdersjusteringen.
                            </span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-slate-50 border border-slate-200 text-slate-600 px-4 py-3 text-sm"
                        >
                            Prøv både 62 og 75 år. Hva skjer med beløpet du får hver måned?
                        </motion.p>
                    )}
                </AnimatePresence>
                <p className="mt-2 text-xs text-slate-400">
                    Tenkt eksempel: lønn på {kr(lonn)} i året fra du er {startAlder}, ingen
                    lønnsvekst eller rente. Vi later som om du slutter å jobbe når du tar ut pensjon, og at
                    alle lever til de er {levertil}.
                </p>
            </div>

            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={nullstill}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
