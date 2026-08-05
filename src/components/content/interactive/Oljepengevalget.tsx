import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PiggyBank, Play, RotateCcw } from 'lucide-react';

// Lyspære: etter denne interaksjonen skal eleven forstå hvorfor Norge sparer
// oljepengene i et fond og bare bruker en liten del hvert år - og hva som
// skjer med rikdommen hvis staten bruker alt med en gang.

interface OljepengevalgetProps {
    title?: string;
}

type Fase = 'idle' | 'ferdig';

const AAR = 50;
const OLJEAAR = 30;
const AVKASTNING = 0.04;

// Oljeinntekten faller jevnt gjennom de 30 oljeårene og stopper helt etterpå.
// Summen av alle inntektene brukes som målestokk, slik at eleven slipper
// kronebeløp og i stedet ser "hvor mange ganger alle oljeinntektene".
function inntektIAar(aar: number) {
    if (aar > OLJEAAR) return 0;
    return 8 - (6 * (aar - 1)) / (OLJEAAR - 1);
}

const SUM_OLJE = Array.from({ length: OLJEAAR }, (_, i) => inntektIAar(i + 1)).reduce(
    (a, b) => a + b,
    0
);

interface Resultat {
    serie: number[];
    fond: number;
    brukt: number;
    topp: number;
}

function kjorModell(prosent: number): Resultat {
    let fond = 0;
    let brukt = 0;
    const serie: number[] = [];
    for (let aar = 1; aar <= AAR; aar++) {
        const uttak = (fond * prosent) / 100;
        fond = fond + inntektIAar(aar) + fond * AVKASTNING - uttak;
        brukt += uttak;
        serie.push(fond);
    }
    return { serie, fond, brukt, topp: Math.max(...serie, 1) };
}

type DomKode = 'hamstret' | 'regel' | 'taering' | 'tomt';

interface Dom {
    kode: DomKode;
    tittel: string;
    tekst: string;
    klasse: string;
    stolpe: string;
}

function finnDom(prosent: number): Dom {
    if (prosent <= 1) {
        return {
            kode: 'hamstret',
            tittel: 'Du sparte nesten alt.',
            tekst: 'Fondet ble enormt, men nesten ingenting gikk til skoler, sykehus og veier underveis. Rikdommen ble aldri til velferd for dem som levde mens oljen ble pumpet opp.',
            klasse: 'bg-blue-50 border-blue-200 text-blue-800',
            stolpe: 'bg-blue-400',
        };
    }
    if (prosent <= 4) {
        return {
            kode: 'regel',
            tittel: 'Dette ligner handlingsregelen.',
            tekst: 'Du brukte omtrent like mye som fondet tjener, og fondet vokste likevel. Selv 20 år etter at oljen tok slutt, har staten fortsatt penger å bruke hvert eneste år. Dette er valget Norge tok i 2001.',
            klasse: 'bg-emerald-50 border-emerald-200 text-emerald-800',
            stolpe: 'bg-emerald-500',
        };
    }
    if (prosent <= 7) {
        return {
            kode: 'taering',
            tittel: 'Du brukte mer enn fondet tjener.',
            tekst: 'Så lenge oljen strømmet, merket ingen det. Men da inntektene stoppet, begynte fondet å krympe. Barnebarna dine arver et mindre fond enn du fikk.',
            klasse: 'bg-amber-50 border-amber-200 text-amber-800',
            stolpe: 'bg-amber-500',
        };
    }
    return {
        kode: 'tomt',
        tittel: 'Fondet er nesten tomt.',
        tekst: 'Legg merke til at du ikke fikk brukt særlig mye mer til sammen enn med handlingsregelen. Du brukte bare pengene raskere - og satt igjen uten noe som kunne betale for velferd etter oljen.',
        klasse: 'bg-rose-50 border-rose-200 text-rose-700',
        stolpe: 'bg-rose-500',
    };
}

function ganger(v: number) {
    return `${(v / SUM_OLJE).toFixed(2).replace('.', ',')} x`;
}

export function Oljepengevalget({
    title = 'Hvor fort skal Norge bruke oljepengene?',
}: OljepengevalgetProps) {
    const [prosent, setProsent] = useState(6);
    const [fase, setFase] = useState<Fase>('idle');
    const [vist, setVist] = useState(0);

    const resultat = useMemo(() => kjorModell(prosent), [prosent]);
    const dom = useMemo(() => finnDom(prosent), [prosent]);

    const kjor = useCallback(() => {
        setFase('ferdig');
        setVist((v) => v + 1);
    }, []);

    const handleReset = useCallback(() => {
        setFase('idle');
        setProsent(6);
    }, []);

    const endreProsent = useCallback((v: number) => {
        setProsent(v);
        setFase('idle');
    }, []);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <PiggyBank className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Dra i spaken og kjør 50 år. De 30 første årene kommer det oljepenger inn.
                    </p>
                </div>
            </div>

            {/* Primær interaksjonsflate: spaken */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="flex items-baseline justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">
                        Staten bruker hvert år
                    </span>
                    <span className="text-2xl font-bold text-indigo-600 tabular-nums">
                        {prosent} %
                    </span>
                </div>
                <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={prosent}
                    onChange={(e) => endreProsent(Number(e.target.value))}
                    aria-label="Hvor mange prosent av fondet staten bruker hvert år"
                    className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0 % - sparer alt</span>
                    <span>12 % - bruker alt</span>
                </div>
            </div>

            {/* Grafen: fondet år for år */}
            <div className="px-5 sm:px-6 pt-5">
                <div className="relative rounded-lg bg-slate-50 border border-slate-200 px-3 pt-3 pb-2">
                    <div className="flex items-end gap-[2px] h-32 sm:h-40">
                        {resultat.serie.map((v, i) => {
                            const h = Math.max(2, (v / resultat.topp) * 100);
                            const etterOljen = i + 1 > OLJEAAR;
                            return (
                                <motion.div
                                    key={i}
                                    className={`flex-1 rounded-t-sm origin-bottom ${
                                        fase === 'ferdig'
                                            ? dom.stolpe
                                            : etterOljen
                                              ? 'bg-slate-300'
                                              : 'bg-slate-400'
                                    } ${etterOljen ? 'opacity-70' : ''}`}
                                    style={{ height: `${h}%` }}
                                    initial={false}
                                    animate={
                                        fase === 'ferdig'
                                            ? { scaleY: [0, 1], opacity: 1 }
                                            : { scaleY: 1, opacity: 0.55 }
                                    }
                                    transition={{
                                        duration: 0.35,
                                        delay: fase === 'ferdig' ? i * 0.022 : 0,
                                    }}
                                />
                            );
                        })}
                    </div>
                    {/* Skillet der oljen tar slutt */}
                    <div
                        className="absolute top-3 bottom-8 border-l-2 border-dashed border-slate-400"
                        style={{ left: `calc(0.75rem + ${(OLJEAAR / AAR) * 100}%)` }}
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                        <span>År 1</span>
                        <span className="font-medium">Oljen tar slutt (år 30)</span>
                        <span>År 50</span>
                    </div>
                </div>
            </div>

            {/* Tallene */}
            <div className="px-5 sm:px-6 pt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                        Fondet etter 50 år
                    </p>
                    <p className="text-lg font-bold text-slate-800 tabular-nums">
                        {fase === 'ferdig' ? ganger(resultat.fond) : '-'}
                    </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                        Brukt underveis
                    </p>
                    <p className="text-lg font-bold text-slate-800 tabular-nums">
                        {fase === 'ferdig' ? ganger(resultat.brukt) : '-'}
                    </p>
                </div>
                <p className="col-span-2 text-[11px] text-slate-400 leading-snug">
                    Tallene er målt mot alle oljeinntektene til sammen. 1,00 x betyr like mye som
                    hele oljeformuen. Forenklet modell med fire prosent avkastning i året.
                </p>
            </div>

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 sm:px-6 pt-3">
                <AnimatePresence mode="wait">
                    {fase === 'ferdig' ? (
                        <motion.div
                            key={dom.kode}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`rounded-lg border px-4 py-3 text-sm ${dom.klasse}`}
                        >
                            <motion.p
                                className="font-semibold"
                                initial={
                                    dom.kode === 'regel' ? { scale: 0.9 } : { scale: 1 }
                                }
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 14 }}
                            >
                                {dom.tittel}
                            </motion.p>
                            <p className="mt-1 leading-relaxed">{dom.tekst}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                        >
                            Velg en prosent og trykk «Kjør 50 år» for å se hvordan det går med
                            fondet.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-5 sm:px-6 py-5 flex items-center justify-between">
                <button
                    onClick={kjor}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    <Play className="w-4 h-4" />
                    {vist === 0 ? 'Kjør 50 år' : 'Kjør på nytt'}
                </button>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
