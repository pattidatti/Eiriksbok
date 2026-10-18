import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Map as MapIcon, RotateCcw, Ship, Sparkles, Shuffle, X } from 'lucide-react';

// EgedesPlan: eleven får se planene Hans Egede hadde da han dro fra Bergen i 1721,
// og gjetter for hver plan om den gikk som tenkt eller helt annerledes.
//
// Lyspære-øyeblikket: nesten ingenting gikk som Egede planla - folket han lette
// etter, var borte, og pengene tok slutt. Likevel ble det han bygde stående, og
// en reise for å finne de forsvunne nordboerne ble starten på over 200 år som
// dansk koloni.
//
// Kortene bygger på SNL (Jørgensen & Weihe: Hans Egede; Barr mfl.: Grønlands
// historie), Dansk Biografisk Leksikon (Lidegaard & Ostermann) og lex.dk (Hansen:
// Grønlands forfatningsretslige historie).

interface EgedesPlanProps {
    title?: string;
}

type Phase = 'gjett' | 'svart' | 'ferdig';
type Utfall = 'plan' | 'annerledes';

interface Kort {
    plan: string;
    svar: Utfall;
    virkelighet: string;
}

const KORT: Kort[] = [
    {
        plan: 'Finne etterkommerne etter nordboerne og gi dem luthersk kristendom.',
        svar: 'annerledes',
        virkelighet:
            'Nordboerne var borte. De siste spor av dem er fra rundt 1450, nesten 300 år før Egede kom. Han fant bare ruiner av gårdene deres, og inuitter som bodde der.',
    },
    {
        plan: 'Handelen med spekk og skinn skal betale for hele kolonien.',
        svar: 'annerledes',
        virkelighet:
            'Handelskompaniet fra Bergen som betalte reisen, gikk konkurs i 1727. Handelen ga aldri nok penger.',
    },
    {
        plan: 'Lære språket til folket, slik at han kan preke for dem selv.',
        svar: 'annerledes',
        virkelighet:
            'Egede lærte aldri grønlandsk godt. Det var sønnene hans, særlig Poul, som lærte språket og hjalp ham.',
    },
    {
        plan: 'Kongen i København står bak misjonen hele veien.',
        svar: 'annerledes',
        virkelighet:
            'Kongen Frederik 4. døde i 1730. Den nye kongen ville nesten legge ned kolonien, og snudde først da Egede ba ham fortsette.',
    },
    {
        plan: 'Familien skal få et trygt nytt hjem på Grønland.',
        svar: 'annerledes',
        virkelighet:
            'I 1733 kom kopper, en dødelig smittsom sykdom, med en grønlender som hadde vært i Danmark. Kanskje halvparten av folket døde. Kona Gertrud døde i 1735 etter å ha stelt de syke.',
    },
    {
        plan: 'Bygge en fast stasjon på Grønland som blir værende.',
        svar: 'plan',
        virkelighet:
            'Dette gikk som planlagt. I 1728 flyttet kolonien til Godthåb. Den ble aldri lagt ned, og i dag heter byen Nuuk og er hovedstaden på Grønland.',
    },
];

const ARV = [
    { aar: '1721', tekst: 'Egede kommer' },
    { aar: '1814', tekst: 'Danmark beholder Grønland' },
    { aar: '1953', tekst: 'Slutt på kolonien' },
    { aar: '1979', tekst: 'Hjemmestyre' },
    { aar: '2009', tekst: 'Selvstyre' },
];

export function EgedesPlan({ title = 'Egedes plan: Gikk det som han tenkte?' }: EgedesPlanProps) {
    const [steg, setSteg] = useState(0);
    const [phase, setPhase] = useState<Phase>('gjett');
    const [valg, setValg] = useState<Utfall | null>(null);
    const [treff, setTreff] = useState(0);
    const [utfall, setUtfall] = useState<Utfall[]>([]);

    const kort = KORT[Math.min(steg, KORT.length - 1)];
    const riktig = valg === kort.svar;
    const progresjon = phase === 'ferdig' ? 1 : (steg + (phase === 'svart' ? 1 : 0)) / KORT.length;

    const velg = (u: Utfall) => {
        if (phase !== 'gjett') return;
        setValg(u);
        setPhase('svart');
        setUtfall((liste) => [...liste, kort.svar]);
        if (u === kort.svar) setTreff((t) => t + 1);
    };

    const neste = () => {
        if (steg >= KORT.length - 1) {
            setPhase('ferdig');
            return;
        }
        setSteg(steg + 1);
        setValg(null);
        setPhase('gjett');
    };

    const reset = () => {
        setSteg(0);
        setPhase('gjett');
        setValg(null);
        setTreff(0);
        setUtfall([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <MapIcon className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Les planen Egede hadde i 1721, og gjett hvordan det gikk.
                    </p>
                </div>
            </div>

            <div className="p-4 md:p-5">
                {/* Reiselinja: skipet seiler videre for hvert kort */}
                <div className="relative h-10 mb-4">
                    <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-100" />
                    <motion.div
                        className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-indigo-300"
                        animate={{ width: `${progresjon * 100}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-1">
                        {KORT.map((_, i) => {
                            const u = utfall[i];
                            return (
                                <motion.span
                                    key={i}
                                    animate={u ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                                    className={`relative z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        u === 'plan'
                                            ? 'bg-emerald-100 border-emerald-400'
                                            : u === 'annerledes'
                                              ? 'bg-amber-100 border-amber-400'
                                              : 'bg-white border-slate-200'
                                    }`}
                                />
                            );
                        })}
                    </div>
                    <motion.div
                        className="absolute top-0 -translate-x-1/2 text-indigo-600"
                        animate={{ left: `${Math.min(progresjon, 0.97) * 100}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    >
                        <Ship className="w-5 h-5 -mt-1" />
                    </motion.div>
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
                                Du traff {treff} av {KORT.length}
                            </div>
                            <p className="text-sm mb-3">
                                Fem av seks planer gikk helt annerledes. Folket Egede lette etter,
                                fantes ikke, og pengene tok slutt. Men stasjonen han bygde, ble
                                stående. Og det han startet, varte mye lenger enn han selv:
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                                {ARV.map((a, i) => (
                                    <motion.div
                                        key={a.aar}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 + i * 0.2 }}
                                        className="rounded-lg bg-white border border-emerald-200 px-1.5 py-2 text-center"
                                    >
                                        <p className="text-sm font-bold">{a.aar}</p>
                                        <p className="text-[11px] leading-tight text-emerald-700">
                                            {a.tekst}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`kort-${steg}`}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3"
                        >
                            <p className="text-xs uppercase tracking-wide text-indigo-400 mb-1">
                                Egedes plan {steg + 1} av {KORT.length}
                            </p>
                            <p className="font-medium text-slate-800 mb-3">«{kort.plan}»</p>
                            <div className="grid grid-cols-2 gap-2">
                                {(['plan', 'annerledes'] as Utfall[]).map((u) => {
                                    const vist = phase === 'svart';
                                    const erSvar = u === kort.svar;
                                    const ramme =
                                        vist && erSvar
                                            ? 'ring-2 ring-emerald-400'
                                            : vist && u === valg
                                              ? 'ring-2 ring-rose-300'
                                              : '';
                                    return (
                                        <motion.button
                                            key={u}
                                            onClick={() => velg(u)}
                                            disabled={phase !== 'gjett'}
                                            whileTap={phase === 'gjett' ? { scale: 0.96 } : undefined}
                                            animate={
                                                vist && u === valg && !erSvar
                                                    ? { x: [0, -6, 6, -4, 0] }
                                                    : { x: 0 }
                                            }
                                            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold flex items-center gap-2 ${
                                                u === 'plan'
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                    : 'bg-amber-50 border-amber-200 text-amber-800'
                                            } ${phase === 'gjett' ? 'hover:shadow-md' : ''} ${ramme}`}
                                        >
                                            {u === 'plan' ? (
                                                <Check className="w-4 h-4 shrink-0" />
                                            ) : (
                                                <Shuffle className="w-4 h-4 shrink-0" />
                                            )}
                                            {u === 'plan' ? 'Gikk som planlagt' : 'Gikk helt annerledes'}
                                            {vist && u === valg && !erSvar && (
                                                <X className="w-4 h-4 ml-auto" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="mx-6 mb-4 min-h-[72px]">
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
                            {kort.virkelighet}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`info-${steg}-${phase}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-sm"
                        >
                            {phase === 'ferdig'
                                ? 'En reise for å finne et folk som var borte, ble starten på dansk styre over Grønland.'
                                : 'Trykk på det du tror skjedde.'}
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
                        {steg >= KORT.length - 1 ? 'Se resultatet' : 'Neste plan'}
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
