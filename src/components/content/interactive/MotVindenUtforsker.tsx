import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Ship, Compass, RotateCcw, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

// Lyspære-øyeblikket: eleven skal forstå at polynesierne lette etter nye øyer
// MOT vinden, fordi det var den eneste veien som ga dem en sikker vei hjem.
// Derfor kan ikke spredningen østover i Stillehavet ha vært en ulykke.

interface MotVindenUtforskerProps {
    title?: string;
    question?: string;
}

type Retning = 'vest' | 'ost';
type Phase = 'idle' | 'seiler' | 'resultat' | 'complete';

const UTFALL: Record<
    Retning,
    { etikett: string; tid: number; tittel: string; tekst: string; god: boolean }
> = {
    vest: {
        etikett: 'Vestover, med vinden',
        tid: 1700,
        tittel: 'Dere fór fort. Men veien hjem ble stengt.',
        tekst:
            'Vinden dyttet dere av gårde i full fart. Så fant dere bare åpent hav. Nå ligger ' +
            'hjemmet rett opp i vinden, og dere må slite dere tilbake med lite vann igjen. ' +
            'Mange som seilte denne veien, kom aldri hjem.',
        god: false,
    },
    ost: {
        etikett: 'Østover, mot vinden',
        tid: 2700,
        tittel: 'Det gikk sakte. Men dere kom hjem.',
        tekst:
            'Dere krysset mot vinden, dag etter dag. Da halve vannet var brukt opp, snudde ' +
            'dere. Nå hadde dere vinden i ryggen, og turen hjem tok bare noen få dager. ' +
            'Neste gang kan dere reise enda lenger ut.',
        god: true,
    },
};

export function MotVindenUtforsker({
    title = 'Hvilken vei seiler du når du leter etter land?',
    question = 'Passatvinden blåser fra øst mot vest. Du har vann til noen uker. Velg kurs.',
}: MotVindenUtforskerProps) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [valg, setValg] = useState<Retning | null>(null);
    const [provd, setProvd] = useState<Record<Retning, boolean>>({ vest: false, ost: false });

    useEffect(() => {
        if (phase !== 'seiler' || !valg) return;
        const t = setTimeout(() => setPhase('resultat'), UTFALL[valg].tid);
        return () => clearTimeout(t);
    }, [phase, valg]);

    const velg = (r: Retning) => {
        if (phase === 'seiler') return;
        setValg(r);
        setPhase('seiler');
        setProvd((p) => ({ ...p, [r]: true }));
    };

    const handleReset = () => {
        setPhase('idle');
        setValg(null);
        setProvd({ vest: false, ost: false });
    };

    const beggeProvd = provd.vest && provd.ost;
    const utfall = valg ? UTFALL[valg] : null;

    // Kanoens posisjon i prosent av havstripa. Hjemøya står i midten (50 %).
    // Vestover: kanoen driver ut og blir liggende der. Østover: den krysser ut,
    // snur, og vinden bærer den hjem igjen - selve poenget i interaksjonen.
    let kanoX = 50;
    let kanoDur = 0.4;
    if (valg === 'vest' && phase !== 'idle') {
        kanoX = 8;
        kanoDur = phase === 'seiler' ? 1.7 : 0.3;
    } else if (valg === 'ost' && phase !== 'idle') {
        kanoX = phase === 'seiler' ? 88 : 57;
        kanoDur = phase === 'seiler' ? 2.7 : 1.1;
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <Compass className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-800 leading-snug">{title}</h3>
                    <p className="text-sm text-slate-500 mt-0.5">{question}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate: havstripa */}
            <div className="px-5 pt-5">
                <div className="relative h-40 sm:h-44 rounded-xl overflow-hidden bg-gradient-to-b from-sky-200 via-sky-300 to-blue-400 border border-slate-200">
                    {/* Passatvind: piler som driver fra øst (høyre) mot vest (venstre) */}
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="absolute flex items-center gap-1 text-white/70"
                            style={{ top: 10 + i * 15 }}
                            animate={{ x: ['104%', '-14%'] }}
                            transition={{
                                duration: 5 + i,
                                repeat: Infinity,
                                ease: 'linear',
                                delay: i * 1.2,
                            }}
                        >
                            <Wind className="w-4 h-4" />
                            <span className="h-px w-10 bg-white/60" />
                        </motion.div>
                    ))}

                    {/* Kompassrose langs bunnen */}
                    <div className="absolute bottom-1.5 left-0 right-0 flex justify-between px-3 text-[11px] font-semibold text-white/80">
                        <span>Vest</span>
                        <span>Øst</span>
                    </div>

                    {/* Hjemøya */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-500 border-2 border-emerald-100 shadow-md" />
                        <span className="block mt-1 text-[11px] font-bold text-white drop-shadow">
                            Hjemøya
                        </span>
                    </div>

                    {/* Kanoen */}
                    <motion.div
                        className="absolute top-[38%] -translate-y-1/2"
                        animate={{ left: `${kanoX}%` }}
                        transition={{
                            duration: kanoDur,
                            ease: valg === 'ost' ? 'easeInOut' : 'easeOut',
                        }}
                    >
                        <motion.div
                            animate={
                                phase === 'seiler' && valg === 'ost'
                                    ? { y: [0, -7, 0, 7, 0] }
                                    : { y: [0, -3, 0] }
                            }
                            transition={{
                                duration: phase === 'seiler' && valg === 'ost' ? 1.1 : 2.4,
                                repeat: Infinity,
                            }}
                            className="w-9 h-9 -ml-4 rounded-full bg-white shadow-md flex items-center justify-center"
                        >
                            <Ship className="w-5 h-5 text-amber-700" />
                        </motion.div>
                    </motion.div>

                    {/* Etikett på seilas i gang */}
                    <AnimatePresence>
                        {phase === 'seiler' && utfall && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 text-white text-xs font-semibold px-3 py-1"
                            >
                                {utfall.etikett} ...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Valgkort */}
            <div className="px-5 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    onClick={() => velg('vest')}
                    disabled={phase === 'seiler'}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-shadow shadow-sm hover:shadow-md disabled:opacity-60 ${
                        valg === 'vest'
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                >
                    <ArrowLeft className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <span>
                        <span className="block font-semibold text-slate-800 text-sm">
                            Seil vestover
                        </span>
                        <span className="block text-xs text-slate-500">
                            Med vinden i ryggen. Det går fort.
                        </span>
                    </span>
                </button>
                <button
                    onClick={() => velg('ost')}
                    disabled={phase === 'seiler'}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-shadow shadow-sm hover:shadow-md disabled:opacity-60 ${
                        valg === 'ost'
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-slate-50 border-slate-200 hover:bg-white'
                    }`}
                >
                    <ArrowRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
                    <span>
                        <span className="block font-semibold text-slate-800 text-sm">
                            Seil østover
                        </span>
                        <span className="block text-xs text-slate-500">
                            Rett mot vinden. Det går tregt.
                        </span>
                    </span>
                </button>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="fasit"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                            className="rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3"
                        >
                            <div className="flex items-start gap-2">
                                <motion.span
                                    animate={{ rotate: [0, 14, -10, 0], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.9 }}
                                >
                                    <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                </motion.span>
                                <div className="text-sm text-indigo-900">
                                    <p className="font-bold">
                                        Menneskene spredte seg østover i Stillehavet. Mot vinden.
                                    </p>
                                    <p className="mt-1 text-indigo-800 leading-relaxed">
                                        Først Samoa og Tonga, så Selskapsøyene, og til slutt Hawaii,
                                        Påskeøya og New Zealand. Hver ny øy lå lenger øst enn den
                                        forrige. Med vinden i ansiktet kommer du ingen vei ved et
                                        uhell. At de likevel kom fram, betyr at de dro med vilje.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : phase === 'resultat' && utfall ? (
                        <motion.div
                            key={valg ?? 'r'}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg px-4 py-3 text-sm border ${
                                utfall.god
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <p className="font-bold">{utfall.tittel}</p>
                            <p className="mt-1 leading-relaxed">{utfall.tekst}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700"
                        >
                            {phase === 'seiler'
                                ? 'Kanoen er ute på havet ...'
                                : 'Velg en kurs over. Prøv begge to, så ser du forskjellen.'}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
                <button
                    onClick={() => setPhase('complete')}
                    disabled={!beggeProvd || phase === 'seiler' || phase === 'complete'}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors"
                >
                    {beggeProvd ? 'Så hva valgte de egentlig?' : 'Prøv begge kursene først'}
                </button>
                <button
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
