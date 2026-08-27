import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Crown, Users, RotateCcw } from 'lucide-react';

// Lyspære: makt i et land ligger ikke fast. Eleven gjetter hvor makta lå ved fem
// tidspunkt i svensk historie, ser fasiten gli inn, og oppdager at pila svinger
// helt over til riksdagen i 1720 - og hele veien tilbake igjen i 1772.

interface MaktpendelenRunde {
    // Tidspunktet runden handler om, f.eks. "1720".
    year: string;
    // Kort situasjonsbeskrivelse eleven skal vurdere.
    situation: string;
    // Fasit: 0 = kongen bestemmer alt, 100 = riksdagen bestemmer alt.
    truth: number;
    // Én til to setninger som forklarer fasiten.
    explanation: string;
}

interface MaktpendelenProps {
    title?: string;
    lead?: string;
    leftLabel?: string;
    rightLabel?: string;
    rounds: MaktpendelenRunde[];
    summary?: string;
}

type Phase = 'gjetter' | 'fasit' | 'ferdig';

// Hvor godt traff eleven? Brukes til farge og ordvalg i tilbakemeldingen.
function treffNivaa(avvik: number): 'blink' | 'naer' | 'bom' {
    if (avvik <= 10) return 'blink';
    if (avvik <= 25) return 'naer';
    return 'bom';
}

export function Maktpendelen({
    title = 'Maktmåleren',
    lead = 'Dra merket dit du tror makta lå. Trykk så på Sett merket.',
    leftLabel = 'Kongen bestemmer alt',
    rightLabel = 'Riksdagen bestemmer alt',
    rounds,
    summary = 'Makta flyttet seg. Den lå ikke fast et eneste av disse årene.',
}: MaktpendelenProps) {
    const [runde, setRunde] = useState(0);
    const [gjett, setGjett] = useState(50);
    const [phase, setPhase] = useState<Phase>('gjetter');
    const [avvikListe, setAvvikListe] = useState<number[]>([]);
    const sporet = useRef<HTMLDivElement>(null);
    const drar = useRef(false);

    const aktiv = rounds[Math.min(runde, rounds.length - 1)];
    const avvik = Math.abs(gjett - aktiv.truth);
    const nivaa = treffNivaa(avvik);

    // Regner om en peker-posisjon til en verdi mellom 0 og 100.
    const settFraPeker = (klientX: number) => {
        const boks = sporet.current?.getBoundingClientRect();
        if (!boks || boks.width === 0) return;
        const andel = (klientX - boks.left) / boks.width;
        setGjett(Math.round(Math.min(1, Math.max(0, andel)) * 100));
    };

    const pekerNed = (e: React.PointerEvent<HTMLDivElement>) => {
        if (phase !== 'gjetter') return;
        drar.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        settFraPeker(e.clientX);
    };

    const pekerFlytt = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!drar.current || phase !== 'gjetter') return;
        settFraPeker(e.clientX);
    };

    const pekerOpp = () => {
        drar.current = false;
    };

    const settMerket = () => {
        setAvvikListe((liste) => [...liste, avvik]);
        setPhase('fasit');
    };

    const neste = () => {
        if (runde + 1 >= rounds.length) {
            setPhase('ferdig');
            return;
        }
        setRunde((r) => r + 1);
        setGjett(50);
        setPhase('gjetter');
    };

    const nullstill = () => {
        setRunde(0);
        setGjett(50);
        setPhase('gjetter');
        setAvvikListe([]);
    };

    const snittAvvik = avvikListe.length
        ? Math.round(avvikListe.reduce((a, b) => a + b, 0) / avvikListe.length)
        : 0;

    const feedbackFarge =
        phase === 'gjetter'
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : nivaa === 'bom'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Scale className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{lead}</p>
                </div>
            </div>

            {/* Primær interaksjonsflate */}
            <div className="p-6">
                {phase === 'ferdig' ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className="text-center py-6"
                    >
                        <motion.div
                            initial={{ rotate: -18, scale: 0.7 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.1 }}
                            className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mb-4"
                        >
                            <Scale className="w-7 h-7 text-indigo-600" />
                        </motion.div>
                        <p className="text-lg font-semibold text-slate-800">
                            Du bommet med {snittAvvik} poeng i snitt
                        </p>
                        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                            {summary}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        {/* Situasjonen */}
                        <div className="flex items-start gap-3 mb-6">
                            <span className="inline-flex items-center justify-center min-w-[4.5rem] px-3 py-1 rounded-full bg-slate-900 text-white text-sm font-semibold">
                                {aktiv.year}
                            </span>
                            <p className="text-slate-700 leading-relaxed text-[0.95rem]">
                                {aktiv.situation}
                            </p>
                        </div>

                        {/* Selve måleren */}
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                            <span className="flex items-center gap-1.5">
                                <Crown className="w-4 h-4 text-amber-500" />
                                {leftLabel}
                            </span>
                            <span className="flex items-center gap-1.5 text-right">
                                {rightLabel}
                                <Users className="w-4 h-4 text-indigo-500" />
                            </span>
                        </div>

                        <div
                            ref={sporet}
                            onPointerDown={pekerNed}
                            onPointerMove={pekerFlytt}
                            onPointerUp={pekerOpp}
                            onPointerCancel={pekerOpp}
                            className={`relative h-16 rounded-xl border border-slate-200 bg-gradient-to-r from-amber-50 via-slate-50 to-indigo-50 ${
                                phase === 'gjetter' ? 'cursor-pointer' : 'cursor-default'
                            }`}
                        >
                            {/* Midtstrek */}
                            <div className="absolute left-1/2 top-3 bottom-3 w-px bg-slate-200" />

                            {/* Elevens merke */}
                            <motion.div
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                                animate={{ left: `${gjett}%` }}
                                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                            >
                                <div className="w-7 h-7 rounded-full bg-slate-800 border-4 border-white shadow-md" />
                                <span className="block text-[10px] font-semibold text-slate-500 text-center mt-1">
                                    ditt svar
                                </span>
                            </motion.div>

                            {/* Fasit */}
                            <AnimatePresence>
                                {phase === 'fasit' && (
                                    <motion.div
                                        key={`fasit-${runde}`}
                                        initial={{ left: '50%', opacity: 0, scale: 0.5 }}
                                        animate={{ left: `${aktiv.truth}%`, opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 180,
                                            damping: 16,
                                            delay: 0.12,
                                        }}
                                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                                    >
                                        <div className="w-7 h-7 rounded-full bg-emerald-500 border-4 border-white shadow-md" />
                                        <span className="block text-[10px] font-semibold text-emerald-600 text-center mt-1">
                                            fasit
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Tastaturvei - samme verdi som draget */}
                        <label className="sr-only" htmlFor={`maktpendel-${runde}`}>
                            Hvor lå makta i {aktiv.year}?
                        </label>
                        <input
                            id={`maktpendel-${runde}`}
                            type="range"
                            min={0}
                            max={100}
                            value={gjett}
                            disabled={phase !== 'gjetter'}
                            onChange={(e) => setGjett(Number(e.target.value))}
                            className="w-full mt-4 accent-slate-800"
                        />
                    </>
                )}
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className={`mx-6 mb-4 px-4 py-3 rounded-lg border text-sm ${feedbackFarge}`}>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={`${runde}-${phase}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="leading-relaxed"
                    >
                        {phase === 'gjetter' &&
                            'Ingen fasit ennå. Plasser merket, så får du svaret.'}
                        {phase === 'fasit' && (
                            <>
                                <span className="font-semibold">
                                    {nivaa === 'blink'
                                        ? 'Blink! '
                                        : nivaa === 'naer'
                                          ? 'Nesten. '
                                          : 'Bom. '}
                                    Du bommet med {avvik} poeng.{' '}
                                </span>
                                {aktiv.explanation}
                            </>
                        )}
                        {phase === 'ferdig' &&
                            'Se hvor langt merket måtte flytte seg mellom 1720 og 1772. Det er hele poenget.'}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between gap-4">
                {phase === 'gjetter' && (
                    <button
                        onClick={settMerket}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        Sett merket
                    </button>
                )}
                {phase === 'fasit' && (
                    <button
                        onClick={neste}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                    >
                        {runde + 1 >= rounds.length ? 'Se resultatet' : 'Neste årstall'}
                    </button>
                )}
                {phase === 'ferdig' && <span className="text-sm text-slate-400">Ferdig</span>}

                <div className="flex items-center gap-3 text-sm text-slate-400">
                    {phase !== 'ferdig' && (
                        <span>
                            {runde + 1} av {rounds.length}
                        </span>
                    )}
                    <button
                        onClick={nullstill}
                        className="inline-flex items-center gap-1.5 hover:text-slate-600 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tilbakestill
                    </button>
                </div>
            </div>
        </div>
    );
}
