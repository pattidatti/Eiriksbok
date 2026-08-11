import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, RotateCcw, Sparkles, Hourglass, Footprints } from 'lucide-react';

interface GudeneSomIkkeFrelserProps {
    title?: string;
}

type Phase = 'klatrer' | 'deva' | 'falt' | 'ute';

interface Plan {
    navn: string;
    tekst: string;
}

const PLAN: Plan[] = [
    {
        navn: 'Gudene (devaene)',
        tekst: 'Lange liv, mye nytelse, nesten ingen smerte. Men livet har en slutt her også.',
    },
    {
        navn: 'Menneskene',
        tekst: 'Kort liv og mye strev. Likevel regnes en menneskefødsel som sjelden og verdifull.',
    },
    {
        navn: 'Asuraene',
        tekst: 'Mektige vesener som ligger i stadig strid med hverandre.',
    },
    {
        navn: 'Sultne ånder',
        tekst: 'Vesener som leter og leter etter noe som aldri metter dem.',
    },
    {
        navn: 'Dyrene',
        tekst: 'Alt levende du ser rundt deg som ikke er mennesker.',
    },
    {
        navn: 'Helvetesplanene',
        tekst: 'Enorm lidelse. Men heller ikke dette varer evig.',
    },
];

const START = 4;
const TOPP = 0;
const MENNESKE = 1;

export function GudeneSomIkkeFrelser({
    title = 'Kom deg ut av kretsløpet',
}: GudeneSomIkkeFrelserProps) {
    const [pos, setPos] = useState<number>(START);
    const [phase, setPhase] = useState<Phase>('klatrer');
    const [harFalt, setHarFalt] = useState(false);

    const klatre = () => {
        const neste = pos - 1;
        setPos(neste);
        if (neste === TOPP) setPhase('deva');
        else setPhase('klatrer');
    };

    const vaakne = () => setPhase('ute');

    const nullstill = () => {
        setPos(START);
        setPhase('klatrer');
        setHarFalt(false);
    };

    const kanKlatre = phase !== 'deva' && phase !== 'ute' && pos > TOPP;
    const kanVaakne = harFalt && phase !== 'ute' && pos === MENNESKE;

    const beskjed = (): { tekst: string; farge: string } => {
        if (phase === 'ute')
            return {
                tekst: 'Ute. Ingen gud løftet deg hit. Du gikk selv, og du gikk ut fra menneskeplanet.',
                farge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
            };
        if (phase === 'deva')
            return {
                tekst: 'Du er en deva. Livet er langt og godt. Se på stripen: det renner likevel ut.',
                farge: 'bg-amber-50 border-amber-200 text-amber-700',
            };
        if (phase === 'falt')
            return {
                tekst: 'Livet som gud tok slutt, og du ble født på nytt lenger nede. Toppen var ingen utgang.',
                farge: 'bg-rose-50 border-rose-200 text-rose-700',
            };
        if (harFalt)
            return {
                tekst: 'Utgangen ligger ikke øverst. Kom deg til menneskeplanet og prøv å våkne.',
                farge: 'bg-blue-50 border-blue-200 text-blue-700',
            };
        return {
            tekst: 'Du står på et av planene i kretsløpet. Samle god karma og se hvor høyt du kommer.',
            farge: 'bg-slate-50 border-slate-200 text-slate-600',
        };
    };

    const info = beskjed();

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Footprints className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk deg oppover planene. Målet er ikke å komme høyt, men å komme ut.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-4 md:grid-cols-5">
                <div className="md:col-span-3 space-y-1.5">
                    {PLAN.map((plan, i) => {
                        const aktiv = i === pos && phase !== 'ute';
                        const erTopp = i === TOPP;
                        return (
                            <div
                                key={plan.navn}
                                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                                    aktiv
                                        ? erTopp
                                            ? 'border-amber-300 bg-amber-50'
                                            : 'border-indigo-300 bg-indigo-50'
                                        : 'border-slate-200 bg-white'
                                }`}
                            >
                                <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                                    {aktiv && (
                                        <motion.div
                                            layoutId="vandrer"
                                            transition={{
                                                type: 'spring',
                                                stiffness: 320,
                                                damping: 26,
                                            }}
                                            className={`w-7 h-7 rounded-full shadow-sm ${
                                                erTopp ? 'bg-amber-400' : 'bg-indigo-600'
                                            }`}
                                        />
                                    )}
                                </div>
                                <span
                                    className={`text-sm ${
                                        aktiv ? 'font-semibold text-slate-800' : 'text-slate-500'
                                    }`}
                                >
                                    {plan.navn}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="md:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
                    <AnimatePresence mode="wait">
                        {phase === 'ute' ? (
                            <motion.div
                                key="ute"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                className="flex flex-col items-center text-center gap-2 py-2"
                            >
                                <motion.div
                                    layoutId="vandrer"
                                    className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center"
                                >
                                    <Sparkles className="w-5 h-5 text-white" />
                                </motion.div>
                                <p className="font-semibold text-emerald-700">Ut av kretsløpet</p>
                                <p className="text-sm text-slate-600">
                                    Buddhismen kaller dette nirvana. Det er ikke en høyere etasje.
                                    Det er å forlate bygningen.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key={PLAN[pos].navn}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="space-y-1"
                            >
                                <p className="text-xs uppercase tracking-wide text-slate-400">
                                    Du er her
                                </p>
                                <p className="font-semibold text-slate-800">{PLAN[pos].navn}</p>
                                <p className="text-sm text-slate-600">{PLAN[pos].tekst}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {phase === 'deva' && (
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-amber-700">
                                <Hourglass className="w-3.5 h-3.5" />
                                <span>Livet som gud</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-amber-100 overflow-hidden">
                                <motion.div
                                    key="livslinje"
                                    className="h-full rounded-full bg-amber-400"
                                    initial={{ width: '100%' }}
                                    animate={{ width: '0%' }}
                                    transition={{ duration: 4, ease: 'linear' }}
                                    onAnimationComplete={() => {
                                        setPos(START);
                                        setHarFalt(true);
                                        setPhase('falt');
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <motion.div
                key={info.tekst}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mx-5 mb-4 px-4 py-3 rounded-lg border text-sm ${info.farge}`}
            >
                {info.tekst}
            </motion.div>

            <div className="px-5 pb-5 flex flex-wrap items-center gap-3">
                <button
                    onClick={klatre}
                    disabled={!kanKlatre}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                >
                    <ArrowUp className="w-4 h-4" />
                    Samle god karma
                </button>

                <AnimatePresence>
                    {harFalt && phase !== 'ute' && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={vaakne}
                            disabled={!kanVaakne}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-5 py-2 text-sm font-medium inline-flex items-center gap-2 transition-colors"
                        >
                            <Sparkles className="w-4 h-4" />
                            Våkne
                        </motion.button>
                    )}
                </AnimatePresence>

                {harFalt && phase !== 'ute' && pos !== MENNESKE && (
                    <span className="text-xs text-slate-400">Virker bare fra menneskeplanet</span>
                )}

                <button
                    onClick={nullstill}
                    className="ml-auto text-slate-400 hover:text-slate-600 text-sm inline-flex items-center gap-1.5 transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
