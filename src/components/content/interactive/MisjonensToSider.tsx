import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, Flame, RotateCcw, Scale, Sparkles, X } from 'lucide-react';

// MisjonensToSider: eleven sorterer handlinger fra samemisjonen på 1700-tallet.
// Presset handlingen den samiske troen bort, ga den samisk språk plass, eller
// gjorde den begge deler?
//
// Lyspære-øyeblikket: den samme misjonen både undertrykte og løftet fram det
// samiske. Det meste vi vet om den gamle samiske troen i dag, vet vi fordi
// misjonærene skrev det ned mens de prøvde å få den til å forsvinne.
//
// Kortene bygger på SNL (Grankvist mfl.: Thomas von Westen, Løøv mfl.: Samisk
// religion, Kraft mfl.: Runebomme, Løøv: Noaide) og Skjelmo (2017).

interface MisjonensToSiderProps {
    title?: string;
}

type Phase = 'sorter' | 'svart' | 'ferdig';
type Kurv = 'bort' | 'begge' | 'sprak';

interface Kort {
    aar: string;
    tekst: string;
    svar: Kurv;
    forklaring: string;
}

const KURVER: { id: Kurv; navn: string; stil: string; aktiv: string }[] = [
    {
        id: 'bort',
        navn: 'Presset samisk tro bort',
        stil: 'bg-rose-50 border-rose-200 text-rose-700',
        aktiv: 'hover:border-rose-300',
    },
    {
        id: 'begge',
        navn: 'Begge deler',
        stil: 'bg-amber-50 border-amber-200 text-amber-800',
        aktiv: 'hover:border-amber-300',
    },
    {
        id: 'sprak',
        navn: 'Ga samisk språk plass',
        stil: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        aktiv: 'hover:border-emerald-300',
    },
];

const KORT: Kort[] = [
    {
        aar: '1716',
        tekst: 'Thomas von Westen preker på samisk når han reiser rundt i Finnmark.',
        svar: 'sprak',
        forklaring:
            'Biskopen i Trondheim ville at samene skulle høre prekenen på dansk. Von Westen prekte på samisk, og det var nytt.',
    },
    {
        aar: '1717',
        tekst: 'Et seminar i Trondheim lærer opp prester og lærere som skal undervise på samisk.',
        svar: 'sprak',
        forklaring:
            'Seminaret skulle også lage bøker på samisk. Samene fikk skoler før de fleste andre i Norge.',
    },
    {
        aar: '1700-tallet',
        tekst: 'Folk som holder på den gamle troen, kan bli straffet. Alle må gå i kirken.',
        svar: 'bort',
        forklaring:
            'Kirkeplikt betydde at alle måtte gå i kirken. Den som fortsatte med de gamle ritualene, kunne bli straffet.',
    },
    {
        aar: '1719',
        tekst: 'Ni samiske gutter blir tatt med til Trondheim for å utdanne seg.',
        svar: 'begge',
        forklaring:
            'Guttene fikk utdanning, og misjonen trengte folk som kunne samisk. Men de skulle jobbe for misjonen og lære bort den nye troen.',
    },
    {
        aar: '1722',
        tekst: 'Samene i Rana må levere fra seg trommene sine til misjonæren.',
        svar: 'bort',
        forklaring:
            'Trommen var et hellig redskap. Uten den ble det vanskelig å holde de gamle ritualene i live.',
    },
    {
        aar: 'Misjonstiden',
        tekst: 'Misjonærene ødelegger hellige steiner og offerplasser ute i naturen.',
        svar: 'bort',
        forklaring:
            'En sieidi er en hellig stein eller et hellig sted. Mange slike steder ble ødelagt under misjonen.',
    },
    {
        aar: '1723',
        tekst: 'Misjonærene skriver ned alt de finner ut om samisk tro, og tegner av trommene.',
        svar: 'begge',
        forklaring:
            'De skrev det ned for å kunne bekjempe troen. Men i dag er disse notatene den viktigste skriftlige kilden vi har til den gamle samiske troen.',
    },
    {
        aar: '1728',
        tekst: 'Rundt 100 trommer som er sendt til København, brenner opp i en bybrann.',
        svar: 'bort',
        forklaring:
            'Trommene lå hos Misjonskollegiet i København. Brannen tok dem, og mange av brevene von Westen hadde skrevet.',
    },
];

export function MisjonensToSider({
    title = 'Misjonens to sider: Hva gjorde misjonen med det samiske?',
}: MisjonensToSiderProps) {
    const [steg, setSteg] = useState(0);
    const [phase, setPhase] = useState<Phase>('sorter');
    const [valg, setValg] = useState<Kurv | null>(null);
    const [treff, setTreff] = useState(0);

    const kort = KORT[Math.min(steg, KORT.length - 1)];
    const ferdigeKort = KORT.slice(0, phase === 'sorter' ? steg : steg + 1);
    const riktig = valg === kort.svar;

    const velg = (k: Kurv) => {
        if (phase !== 'sorter') return;
        setValg(k);
        setPhase('svart');
        if (k === kort.svar) setTreff((t) => t + 1);
    };

    const neste = () => {
        if (steg >= KORT.length - 1) {
            setPhase('ferdig');
            return;
        }
        setSteg(steg + 1);
        setValg(null);
        setPhase('sorter');
    };

    const reset = () => {
        setSteg(0);
        setPhase('sorter');
        setValg(null);
        setTreff(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les hva misjonen gjorde, og velg hvilken kurv det hører hjemme i.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-5">
                <AnimatePresence mode="wait">
                    {phase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 mb-4"
                        >
                            <div className="flex items-center gap-2 font-semibold mb-1">
                                <motion.span
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 0.8, repeat: 2 }}
                                >
                                    <Sparkles className="w-5 h-5" />
                                </motion.span>
                                Du traff {treff} av {KORT.length}
                            </div>
                            <p className="text-sm">
                                Se på kurvene: Misjonen var ikke enten god eller ond. Den samme
                                mannen som prekte på samisk, tok trommene fra folk. Og det meste vi
                                vet om den gamle samiske troen i dag, vet vi fordi misjonærene skrev
                                det ned mens de prøvde å få den til å forsvinne.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={kort.aar + steg}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3 mb-4"
                        >
                            <p className="text-xs uppercase tracking-wide text-indigo-400 mb-1">
                                Kort {steg + 1} av {KORT.length}: {kort.aar}
                            </p>
                            <p className="font-medium text-slate-800">{kort.tekst}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-2 md:gap-3">
                    {KURVER.map((kurv) => {
                        const vist = phase === 'svart';
                        const erSvar = kurv.id === kort.svar;
                        const iKurven = ferdigeKort.filter((k) => k.svar === kurv.id);
                        const ramme =
                            vist && erSvar
                                ? 'ring-2 ring-emerald-400'
                                : vist && kurv.id === valg
                                  ? 'ring-2 ring-rose-300'
                                  : '';
                        return (
                            <motion.button
                                key={kurv.id}
                                onClick={() => velg(kurv.id)}
                                disabled={phase !== 'sorter'}
                                whileTap={phase === 'sorter' ? { scale: 0.96 } : undefined}
                                animate={
                                    vist && kurv.id === valg && !erSvar
                                        ? { x: [0, -6, 6, -4, 0] }
                                        : { x: 0 }
                                }
                                className={`rounded-xl border p-2.5 md:p-3 text-left flex flex-col min-h-[150px] ${kurv.stil} ${
                                    phase === 'sorter' ? `${kurv.aktiv} hover:shadow-md` : ''
                                } ${ramme}`}
                            >
                                <span className="text-xs md:text-sm font-semibold flex items-center gap-1.5 mb-2">
                                    {kurv.id === 'bort' && <Flame className="w-4 h-4 shrink-0" />}
                                    {kurv.id === 'begge' && <Scale className="w-4 h-4 shrink-0" />}
                                    {kurv.id === 'sprak' && <BookOpen className="w-4 h-4 shrink-0" />}
                                    {kurv.navn}
                                    {vist && erSvar && <Check className="w-4 h-4 ml-auto" />}
                                    {vist && kurv.id === valg && !erSvar && (
                                        <X className="w-4 h-4 ml-auto" />
                                    )}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                    <AnimatePresence>
                                        {iKurven.map((k) => (
                                            <motion.span
                                                key={k.tekst}
                                                initial={{ opacity: 0, scale: 0.4, y: -20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                                className="px-2 py-0.5 rounded-full bg-white/80 border border-current/20 text-[11px] font-medium"
                                            >
                                                {k.aar}
                                            </motion.span>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.button>
                        );
                    })}
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
                            {riktig
                                ? 'Riktig! '
                                : `Ikke helt. Det hører hjemme i «${KURVER.find((k) => k.id === kort.svar)?.navn}». `}
                            {kort.forklaring}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`info-${steg}-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            {phase === 'ferdig'
                                ? 'Historien om misjonen har to sider. Begge er sanne på samme tid.'
                                : 'Trykk på en av de tre kurvene.'}
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
                        {steg >= KORT.length - 1 ? 'Se resultatet' : 'Neste kort'}
                    </button>
                ) : (
                    <span className="text-sm text-slate-500">
                        {phase === 'ferdig' ? 'Ferdig!' : `${treff} riktige så langt`}
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
