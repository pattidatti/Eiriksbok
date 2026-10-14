import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, Crown, RotateCcw, Scale, Sparkles, Users, X } from 'lucide-react';

// Toleransebarometeret: eleven følger hugenottenes rettigheter i Frankrike fra
// Bartolomeusnatten i 1572 til revolusjonen i 1789. Ved hvert vendepunkt gjetter
// eleven om rettighetene går opp eller ned, og barometeret viser svaret.
//
// Lyspære-øyeblikket: rettigheter som en konge gir, kan en ny konge ta tilbake.
// Først da religionsfrihet ble en rettighet for alle, sto den på egne bein.
//
// Hendelsene bygger på SNL (Brégaint: Blodbryllupet i Paris, Holmboe og Brégaint:
// Ediktet i Nantes) og Musée protestant (dragonadene, utvandringen, toleranseediktet).

interface ToleransebarometeretProps {
    title?: string;
}

type Phase = 'gjett' | 'svart' | 'ferdig';
type Retning = 'opp' | 'ned';

interface Vendepunkt {
    aar: string;
    hendelse: string;
    hvem: 'konge' | 'alle';
    besluttet: string;
    niva: number;
    retning: Retning;
    forklaring: string;
}

const START_NIVA = 1;
const MAKS_NIVA = 5;

const NIVA_TEKST = [
    'Forbudt og forfulgt',
    'Forfulgt, men tåles noen steder',
    'Tålt, men holdt nede',
    'Kan tro, men har ingen makt',
    'Beskyttet av kongen',
    'Religionsfrihet for alle',
];

const VENDEPUNKTER: Vendepunkt[] = [
    {
        aar: '1572',
        hendelse: 'Bryllupet i Paris ender med Bartolomeusnatten.',
        hvem: 'konge',
        besluttet: 'Kong Karl 9. ga ordren',
        niva: 0,
        retning: 'ned',
        forklaring:
            'Rundt 3000 hugenotter ble drept i Paris, og rundt 7000 i hele Frankrike. Tusener ble tvunget til å bli katolikker.',
    },
    {
        aar: '1598',
        hendelse: 'Henrik 4. skriver under ediktet i Nantes.',
        hvem: 'konge',
        besluttet: 'Kong Henrik 4. bestemte',
        niva: 4,
        retning: 'opp',
        forklaring:
            'Hugenottene fikk tro fritt, holde gudstjenester på bestemte steder og ha jobber i staten. De fikk også beholde rundt 100 byer med murer.',
    },
    {
        aar: '1629',
        hendelse: 'Kardinal Richelieu tar byene med murer fra hugenottene.',
        hvem: 'konge',
        besluttet: 'Kongens minister bestemte',
        niva: 3,
        retning: 'ned',
        forklaring:
            'Hugenottene fikk fortsatt tro og gå til gudstjeneste. Men nå hadde de ingen byer og ingen makt til å forsvare seg selv.',
    },
    {
        aar: '1681',
        hendelse: 'Soldater blir sendt for å bo hjemme hos hugenotter.',
        hvem: 'konge',
        besluttet: 'Kongens folk bestemte',
        niva: 2,
        retning: 'ned',
        forklaring:
            'Soldatene spiste maten og ødela møblene til familien ga opp troen sin. I Poitou meldte prestene om 38 000 nye katolikker på noen måneder.',
    },
    {
        aar: '1685',
        hendelse: 'Ludvig 14. opphever ediktet i Nantes.',
        hvem: 'konge',
        besluttet: 'Kong Ludvig 14. bestemte',
        niva: 0,
        retning: 'ned',
        forklaring:
            'All protestantisk gudstjeneste ble forbudt. Prestene måtte reise, men vanlige folk fikk ikke lov til å flykte. Likevel flyktet opptil 200 000.',
    },
    {
        aar: '1787',
        hendelse: 'Ludvig 16. skriver under toleranseediktet.',
        hvem: 'konge',
        besluttet: 'Kong Ludvig 16. bestemte',
        niva: 2,
        retning: 'opp',
        forklaring:
            'Nå kunne protestanter gifte seg lovlig og få barna sine registrert. Men de fikk ikke holde gudstjeneste åpent eller ha jobber i staten.',
    },
    {
        aar: '1789',
        hendelse: 'Revolusjonen skriver ned rettigheter for alle mennesker.',
        hvem: 'alle',
        besluttet: 'Ingen konge bestemte alene',
        niva: 5,
        retning: 'opp',
        forklaring:
            'Med revolusjonen fikk hugenottene fulle rettigheter. Friheten var ikke lenger en gave fra kongen, men noe alle hadde krav på.',
    },
];

export function Toleransebarometeret({
    title = 'Toleransebarometeret: Hugenottenes frihet 1572-1789',
}: ToleransebarometeretProps) {
    const [steg, setSteg] = useState(0);
    const [phase, setPhase] = useState<Phase>('gjett');
    const [gjetning, setGjetning] = useState<Retning | null>(null);
    const [treff, setTreff] = useState(0);

    const punkt = VENDEPUNKTER[Math.min(steg, VENDEPUNKTER.length - 1)];
    const antallVist = phase === 'gjett' ? steg : steg + 1;
    const niva = antallVist === 0 ? START_NIVA : VENDEPUNKTER[antallVist - 1].niva;

    const gjett = (r: Retning) => {
        if (phase !== 'gjett') return;
        setGjetning(r);
        setPhase('svart');
        if (r === punkt.retning) setTreff((t) => t + 1);
    };

    const neste = () => {
        if (steg >= VENDEPUNKTER.length - 1) {
            setPhase('ferdig');
            return;
        }
        setSteg(steg + 1);
        setGjetning(null);
        setPhase('gjett');
    };

    const reset = () => {
        setSteg(0);
        setPhase('gjett');
        setGjetning(null);
        setTreff(0);
    };

    const riktig = gjetning === punkt.retning;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Gjett om friheten til hugenottene går opp eller ned ved hvert vendepunkt.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-5 grid md:grid-cols-[minmax(0,1fr)_220px] gap-5">
                <div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {VENDEPUNKTER.map((v, i) => (
                            <motion.div
                                key={v.aar}
                                animate={{ scale: i === steg && phase !== 'ferdig' ? 1.08 : 1 }}
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1 ${
                                    i < antallVist
                                        ? v.retning === 'opp'
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-rose-50 border-rose-200 text-rose-700'
                                        : i === steg
                                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                          : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                            >
                                {i < antallVist &&
                                    (v.hvem === 'konge' ? (
                                        <Crown className="w-3 h-3" />
                                    ) : (
                                        <Users className="w-3 h-3" />
                                    ))}
                                {v.aar}
                            </motion.div>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {phase === 'ferdig' ? (
                            <motion.div
                                key="ferdig"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800"
                            >
                                <div className="flex items-center gap-2 font-semibold mb-1">
                                    <motion.span
                                        animate={{ rotate: [0, 15, -15, 0] }}
                                        transition={{ duration: 0.8, repeat: 2 }}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                    </motion.span>
                                    Du traff {treff} av {VENDEPUNKTER.length}
                                </div>
                                <p className="text-sm">
                                    Se på kronene: Seks ganger bestemte en konge eller kongens folk
                                    hvor fri hugenottene skulle være. Det en konge ga, kunne neste
                                    konge ta tilbake. Først i 1789 ble friheten en rettighet for
                                    alle, og ikke en gave fra kongen.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={punkt.aar}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                                    Vendepunkt {steg + 1} av {VENDEPUNKTER.length}: {punkt.aar}
                                </p>
                                <p className="font-medium text-slate-800 mb-3">{punkt.hendelse}</p>
                                <p className="text-sm text-slate-500 mb-2">
                                    Blir hugenottene friere eller mindre frie?
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(['opp', 'ned'] as Retning[]).map((r) => {
                                        const vist = phase === 'svart';
                                        const erSvar = r === punkt.retning;
                                        const stil = !vist
                                            ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md text-slate-700'
                                            : erSvar
                                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                              : r === gjetning
                                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-400';
                                        const Pil = r === 'opp' ? ArrowUp : ArrowDown;
                                        return (
                                            <motion.button
                                                key={r}
                                                onClick={() => gjett(r)}
                                                disabled={vist}
                                                whileTap={!vist ? { scale: 0.96 } : undefined}
                                                animate={
                                                    vist && r === gjetning && !erSvar
                                                        ? { x: [0, -6, 6, -4, 0] }
                                                        : { x: 0 }
                                                }
                                                className={`rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${stil}`}
                                            >
                                                <Pil className="w-4 h-4" />
                                                {r === 'opp' ? 'Friere' : 'Mindre frie'}
                                                {vist && erSvar && <Check className="w-4 h-4" />}
                                                {vist && r === gjetning && !erSvar && (
                                                    <X className="w-4 h-4" />
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <AnimatePresence>
                                    {phase === 'svart' && (
                                        <motion.p
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-3 text-sm text-slate-600 flex items-center gap-1.5"
                                        >
                                            {punkt.hvem === 'konge' ? (
                                                <Crown className="w-4 h-4 text-amber-500" />
                                            ) : (
                                                <Users className="w-4 h-4 text-indigo-500" />
                                            )}
                                            {punkt.besluttet}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                        Hvor fri er hugenottene?
                    </p>
                    <div className="flex gap-3">
                        <div className="relative w-8 h-48 rounded-full bg-white border border-slate-200 overflow-hidden">
                            <motion.div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-400 via-amber-300 to-emerald-400"
                                animate={{ height: `${Math.max(6, (niva / MAKS_NIVA) * 100)}%` }}
                                transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                            />
                        </div>
                        <ul className="flex flex-col-reverse justify-between h-48 py-0.5">
                            {NIVA_TEKST.map((t, i) => (
                                <motion.li
                                    key={t}
                                    animate={{
                                        opacity: i === niva ? 1 : 0.45,
                                        scale: i === niva ? 1.04 : 1,
                                    }}
                                    className={`text-[11px] leading-tight origin-left ${
                                        i === niva ? 'font-semibold text-slate-800' : 'text-slate-500'
                                    }`}
                                >
                                    {t}
                                </motion.li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mx-6 mb-4 min-h-[60px]">
                <AnimatePresence mode="wait">
                    {phase === 'svart' ? (
                        <motion.div
                            key={`svar-${steg}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                riktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                            }`}
                        >
                            {riktig ? 'Riktig! ' : 'Ikke helt. '}
                            {punkt.forklaring}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`info-${steg}-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            {phase === 'ferdig'
                                ? 'Tolerere betyr å tåle. Å bli tålt er noe annet enn å ha en rettighet.'
                                : 'Velg «Friere» eller «Mindre frie».'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 flex items-center justify-between">
                {phase === 'svart' ? (
                    <button
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium"
                    >
                        {steg >= VENDEPUNKTER.length - 1 ? 'Se resultatet' : 'Neste vendepunkt'}
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {phase === 'ferdig' ? 'Ferdig!' : `Startpunkt: ${NIVA_TEKST[START_NIVA]}`}
                    </span>
                )}
                <button
                    onClick={reset}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" /> Tilbakestill
                </button>
            </div>
        </div>
    );
}
