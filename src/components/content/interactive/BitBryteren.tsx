import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ToggleLeft, Check, Sparkles } from 'lucide-react';

// BitBryteren
//
// Lyspære-øyeblikket: Etter denne interaksjonen skal eleven forstå at åtte av/på-
// brytere er ALT en datamaskin har. Den samme raden av nuller og enere er et tall,
// en bokstav og en farge på én gang. Det er bare måten maskinen leser dem på som
// skiller. Derfor kunne én maskin brukes til regnestykker, tekst, bilder og lyd.

interface BitBryterenProps {
    title?: string;
}

interface Runde {
    ledetekst: string;
    mal: number;
    fasit: string;
}

const PLASSVERDIER = [128, 64, 32, 16, 8, 4, 2, 1];

const RUNDER: Runde[] = [
    {
        ledetekst: 'Skru på bryterne til tallet blir 65.',
        mal: 65,
        fasit: 'Se på bokstavruta: 65 er også bokstaven A. Maskinen lagret aldri en A. Den lagret tallet 65.',
    },
    {
        ledetekst: 'Lag bokstaven K.',
        mal: 75,
        fasit: 'K er nummer 75 i tegntabellen. Du skrudde på 64, 8, 2 og 1, og maskinen kalte det en K.',
    },
    {
        ledetekst: 'Lag bokstaven Ø.',
        mal: 216,
        fasit: 'Ø ligger helt oppe på plass 216. Den første tegntabellen hadde bare 128 plasser, så de norske bokstavene måtte vente på en større tabell.',
    },
];

const NORSKE_TEGN: Record<number, string> = {
    197: 'Å',
    198: 'Æ',
    216: 'Ø',
    229: 'å',
    230: 'æ',
    248: 'ø',
};

function tilTegn(n: number): string {
    if ((n >= 65 && n <= 90) || (n >= 97 && n <= 122) || (n >= 48 && n <= 57)) {
        return String.fromCharCode(n);
    }
    if (n === 32) return 'mellomrom';
    return NORSKE_TEGN[n] ?? 'ingen bokstav';
}

export function BitBryteren({ title = 'Bitbryteren' }: BitBryterenProps) {
    const [bits, setBits] = useState<boolean[]>(() => Array(8).fill(false));
    const [runde, setRunde] = useState(0);
    const [lost, setLost] = useState<boolean[]>(() => Array(RUNDER.length).fill(false));

    const verdi = useMemo(
        () => bits.reduce((sum, pa, i) => (pa ? sum + PLASSVERDIER[i] : sum), 0),
        [bits]
    );

    const aktiv = RUNDER[runde];
    const ferdig = lost.every(Boolean);
    const treff = !ferdig && verdi === aktiv.mal;
    const tegn = tilTegn(verdi);

    const vipp = (i: number) => {
        const neste = bits.map((b, j) => (j === i ? !b : b));
        setBits(neste);
        const sum = neste.reduce((s, pa, j) => (pa ? s + PLASSVERDIER[j] : s), 0);
        if (sum === aktiv.mal && !lost[runde]) {
            setLost(lost.map((l, j) => (j === runde ? true : l)));
        }
    };

    const nesteRunde = () => {
        setBits(Array(8).fill(false));
        setRunde((r) => Math.min(r + 1, RUNDER.length - 1));
    };

    const nullstill = () => {
        setBits(Array(8).fill(false));
        setRunde(0);
        setLost(Array(RUNDER.length).fill(false));
    };

    const sisteRunde = runde === RUNDER.length - 1;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ToggleLeft className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk bryterne av og på. Se hva de åtte tallene blir til.
                    </p>
                </div>
            </div>

            {/* Oppgaven */}
            <div className="px-6 pt-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-semibold text-slate-700">
                        Oppgave {runde + 1} av {RUNDER.length}: {aktiv.ledetekst}
                    </p>
                    <div className="flex gap-1.5">
                        {RUNDER.map((_, i) => (
                            <span
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${
                                    lost[i]
                                        ? 'bg-emerald-500'
                                        : i === runde
                                          ? 'bg-indigo-500'
                                          : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bryterraden */}
            <div className="px-6 pt-4">
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                    {bits.map((pa, i) => (
                        <button
                            key={i}
                            onClick={() => vipp(i)}
                            aria-pressed={pa}
                            aria-label={`Bryter for plassverdi ${PLASSVERDIER[i]}`}
                            className="group flex flex-col items-center gap-1 focus:outline-none"
                        >
                            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 tabular-nums">
                                {PLASSVERDIER[i]}
                            </span>
                            <motion.span
                                animate={{
                                    backgroundColor: pa ? '#4f46e5' : '#f1f5f9',
                                    color: pa ? '#ffffff' : '#94a3b8',
                                    y: pa ? -3 : 0,
                                }}
                                whileTap={{ scale: 0.92 }}
                                transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                className="w-full aspect-square rounded-xl border border-slate-200 flex items-center justify-center text-base sm:text-xl font-bold shadow-sm group-hover:shadow-md"
                            >
                                {pa ? 1 : 0}
                            </motion.span>
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Åtte brytere er én byte. Hver bryter er enten av (0) eller på (1).
                </p>
            </div>

            {/* De tre avlesningene av den samme raden */}
            <div className="px-6 pt-4 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                        Som tall
                    </p>
                    <motion.p
                        key={`tall-${verdi}`}
                        initial={{ scale: 0.85, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                        className="text-2xl sm:text-3xl font-bold text-blue-800 tabular-nums"
                    >
                        {verdi}
                    </motion.p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                        Som bokstav
                    </p>
                    <motion.p
                        key={`tegn-${verdi}`}
                        initial={{ scale: 0.85, opacity: 0.4 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                        className={`font-bold text-blue-800 ${
                            tegn.length > 2 ? 'text-xs pt-2' : 'text-2xl sm:text-3xl'
                        }`}
                    >
                        {tegn}
                    </motion.p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">
                        Som bildepunkt
                    </p>
                    <motion.span
                        animate={{ backgroundColor: `rgb(${verdi}, ${verdi}, ${verdi})` }}
                        transition={{ duration: 0.18 }}
                        className="mt-1 inline-block w-9 h-9 rounded-lg border border-blue-300 shadow-inner"
                    />
                </div>
            </div>

            {/* Feedback-sone - alltid til stede */}
            <div className="px-6 pt-4">
                <AnimatePresence mode="wait">
                    {ferdig ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                            <span>
                                Åtte brytere. Ett tall. Tre helt ulike ting. Datamaskinen forstår
                                ikke bokstaver, bilder eller lyd. Den teller. Alt annet er avtaler om
                                hvordan tallene skal leses.
                            </span>
                        </motion.div>
                    ) : treff ? (
                        <motion.div
                            key={`treff-${runde}`}
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
                            <span>{aktiv.fasit}</span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`jakt-${runde}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Legg sammen plassverdiene over bryterne du skrur på. Akkurat nå står
                            raden på {verdi}.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Kontrollrad */}
            <div className="px-6 py-5 flex items-center justify-between gap-3">
                <button
                    onClick={nesteRunde}
                    disabled={!treff || sisteRunde}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Neste oppgave
                </button>
                <button
                    onClick={nullstill}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
