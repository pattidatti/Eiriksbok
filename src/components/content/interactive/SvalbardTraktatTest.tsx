import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Check, X, Trophy, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket: Norge eier Svalbard fullt og helt, men fikk øyene på
// betingelser. Eleven avgjør sak for sak hva Norge kan og ikke kan gjøre, og
// oppdager de tre betingelsene i Svalbardtraktaten gjennom å bruke dem.

interface TraktatSak {
    id: string;
    tekst: string;
    lov: boolean;
    regel: string;
    forklaring: string;
}

interface SvalbardTraktatTestProps {
    title?: string;
    saker?: TraktatSak[];
}

const STANDARD_SAKER: TraktatSak[] = [
    {
        id: 'russisk-gruve',
        tekst: 'Et russisk selskap vil åpne en kullgruve på Svalbard.',
        lov: true,
        regel: 'Lik rett for alle traktatland',
        forklaring:
            'Traktaten sier at borgere og selskaper fra alle land som har skrevet under, skal behandles likt. Derfor kan Russland drive gruve i Barentsburg den dag i dag.',
    },
    {
        id: 'marinebase',
        tekst: 'Norge vil bygge en marinebase med kanoner i Longyearbyen.',
        lov: false,
        regel: 'Ingen krigsbruk',
        forklaring:
            'Traktaten forbyr festningsverk og at øyene brukes til krigsformål. Norge kan ikke gjøre Svalbard om til en militærbase.',
    },
    {
        id: 'skatt-til-tromso',
        tekst: 'Norge krever inn skatt på Svalbard og bruker pengene på nye veier i Tromsø.',
        lov: false,
        regel: 'Skatten blir på Svalbard',
        forklaring:
            'Norge kan bare kreve inn skatt som kommer Svalbard selv til gode. Pengene kan ikke flyttes til fastlandet.',
    },
    {
        id: 'norsk-lov',
        tekst: 'Norge bestemmer at norsk lov gjelder på Svalbard, og at sysselmesteren er øverste politimyndighet.',
        lov: true,
        regel: 'Norsk suverenitet',
        forklaring:
            'Svalbard er en del av Norge. Norge styrer øyene, lager lovene og har politimyndighet der.',
    },
    {
        id: 'bare-nordmenn',
        tekst: 'Norge vedtar at bare norske statsborgere får lov til å jobbe i gruvene.',
        lov: false,
        regel: 'Lik rett for alle traktatland',
        forklaring:
            'Det ville vært forskjellsbehandling. Traktaten gir borgere fra alle traktatland samme rett til å drive næring på Svalbard.',
    },
    {
        id: 'polsk-forskning',
        tekst: 'En polsk forskergruppe vil starte en forskningsstasjon i Ny-Ålesund.',
        lov: true,
        regel: 'Lik rett for alle traktatland',
        forklaring:
            'Forskning er fredelig virksomhet, og Polen har skrevet under traktaten. Derfor forsker mange land side om side på Svalbard.',
    },
];

type Phase = 'spor' | 'svart' | 'ferdig';

export function SvalbardTraktatTest({
    title = 'Traktat-testen: hva er lov på Svalbard?',
    saker = STANDARD_SAKER,
}: SvalbardTraktatTestProps) {
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('spor');
    const [valg, setValg] = useState<boolean | null>(null);
    const [riktige, setRiktige] = useState(0);

    const sak = saker[Math.min(index, saker.length - 1)];
    const riktig = valg !== null && valg === sak.lov;

    const svar = (svarLov: boolean) => {
        if (phase !== 'spor') return;
        setValg(svarLov);
        if (svarLov === sak.lov) setRiktige((r) => r + 1);
        setPhase('svart');
    };

    const neste = () => {
        if (index + 1 >= saker.length) {
            setPhase('ferdig');
            return;
        }
        setIndex((i) => i + 1);
        setValg(null);
        setPhase('spor');
    };

    const handleReset = () => {
        setIndex(0);
        setPhase('spor');
        setValg(null);
        setRiktige(0);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Du er sysselmester. Avgjør om saken er lov etter Svalbardtraktaten.
                    </p>
                </div>
            </div>

            {/* Framdrift */}
            <div className="px-6 pt-4 flex items-center gap-1.5">
                {saker.map((s, i) => (
                    <div
                        key={s.id}
                        className={`h-1.5 flex-1 rounded-full ${
                            i < index || phase === 'ferdig'
                                ? 'bg-indigo-500'
                                : i === index
                                  ? 'bg-indigo-300'
                                  : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>

            {/* Interaksjonsflate */}
            <div className="p-6 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'ferdig' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center"
                        >
                            <motion.div
                                initial={{ rotate: -12, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                                className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 mb-3"
                            >
                                <Trophy className="w-6 h-6 text-white" />
                            </motion.div>
                            <p className="font-semibold text-emerald-900">
                                {riktige} av {saker.length} riktige
                            </p>
                            <p className="text-sm text-emerald-800 mt-2 leading-relaxed">
                                Svalbard er norsk. Men Norge fikk øyene på tre betingelser: alle
                                traktatland skal behandles likt, skatten skal brukes på Svalbard, og
                                øyene kan ikke brukes til krig. Derfor ligger det en russisk gruveby
                                og forskere fra hele verden på norsk jord.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={sak.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.18 }}
                        >
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                    Sak {index + 1} av {saker.length}
                                </p>
                                <p className="text-slate-800 leading-relaxed">{sak.tekst}</p>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => svar(true)}
                                    disabled={phase !== 'spor'}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold border transition-colors ${
                                        phase === 'svart' && sak.lov
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    Lov
                                </button>
                                <button
                                    onClick={() => svar(false)}
                                    disabled={phase !== 'spor'}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold border transition-colors ${
                                        phase === 'svart' && !sak.lov
                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50'
                                    }`}
                                >
                                    <X className="w-4 h-4" />
                                    Ikke lov
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="px-6 pb-4">
                <AnimatePresence mode="wait">
                    {phase === 'svart' ? (
                        <motion.div
                            key={`fb-${sak.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg border text-sm ${
                                riktig
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <span className="inline-block mb-1 px-2 py-0.5 rounded-full bg-white/70 text-xs font-bold">
                                {sak.regel}
                            </span>
                            <p className="leading-relaxed">{sak.forklaring}</p>
                        </motion.div>
                    ) : (
                        <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                            {phase === 'ferdig'
                                ? 'Trykk «Start på nytt» for å prøve alle sakene en gang til.'
                                : 'Velg «Lov» eller «Ikke lov». Du får svaret med en gang.'}
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
                {phase === 'svart' ? (
                    <button
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {index + 1 >= saker.length ? 'Se resultatet' : 'Neste sak'}
                    </button>
                ) : (
                    <span className="text-sm text-slate-400">
                        Riktige: {riktige} av {saker.length}
                    </span>
                )}
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
