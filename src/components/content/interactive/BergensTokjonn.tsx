import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Sparkles, RotateCcw, Lightbulb } from 'lucide-react';

// Signaturkomponent 1 for artikkelen «Bergensk».
//
// Lyspære-øyeblikket: «Bergensk har ikke hunkjønn. Der resten av landet sier
// sola og boka, sier bergenseren solen og boken.» Eleven vipper én bryter fra
// «vanlig dialekt (tre kjønn)» til «bergensk (to kjønn)» og ser hele ordlista
// forvandle seg på én gang: alle ei-ordene mister hunkjønnet sitt. Når eleven
// har sett forvandlingen, låses innsikten om hansaveldet opp.

interface OrdPar {
    // Grunnordet uten artikkel
    grunnord: string;
    // Bestemt form i vanlig dialekt (hunkjønn)
    hunkjonn: string;
    // Bestemt form i bergensk (felleskjønn)
    felles: string;
}

const ORD: OrdPar[] = [
    { grunnord: 'sol', hunkjonn: 'sola', felles: 'solen' },
    { grunnord: 'bok', hunkjonn: 'boka', felles: 'boken' },
    { grunnord: 'jente', hunkjonn: 'jenta', felles: 'jenten' },
    { grunnord: 'klokke', hunkjonn: 'klokka', felles: 'klokken' },
    { grunnord: 'dør', hunkjonn: 'døra', felles: 'døren' },
    { grunnord: 'avis', hunkjonn: 'avisa', felles: 'avisen' },
];

type Modus = 'vanlig' | 'bergensk';

interface BergensTokjonnProps {
    title?: string;
}

export function BergensTokjonn({ title = 'Tokjønns-veksleren' }: BergensTokjonnProps) {
    const [modus, setModus] = useState<Modus>('vanlig');
    const [utforsket, setUtforsket] = useState(false);

    const erBergensk = modus === 'bergensk';

    const vipp = () => {
        setModus((m) => (m === 'vanlig' ? 'bergensk' : 'vanlig'));
        if (modus === 'vanlig') setUtforsket(true);
    };

    const reset = () => {
        setModus('vanlig');
        setUtforsket(false);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <ArrowLeftRight className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Vipp bryteren og se hva som skjer med ordene i Bergen.
                    </p>
                </div>
            </div>

            {/* Bryter + teller */}
            <div className="px-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                    onClick={vipp}
                    className="relative flex items-center gap-3 select-none"
                    aria-pressed={erBergensk}
                >
                    <span
                        className={`text-sm font-semibold transition-colors ${
                            erBergensk ? 'text-slate-400' : 'text-indigo-600'
                        }`}
                    >
                        Vanlig dialekt
                    </span>
                    <span
                        className={`relative w-16 h-8 rounded-full transition-colors ${
                            erBergensk ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                    >
                        <motion.span
                            layout
                            transition={{ type: 'spring', stiffness: 600, damping: 32 }}
                            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow ${
                                erBergensk ? 'right-1' : 'left-1'
                            }`}
                        />
                    </span>
                    <span
                        className={`text-sm font-semibold transition-colors ${
                            erBergensk ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                    >
                        Bergensk
                    </span>
                </button>

                <motion.div
                    key={erBergensk ? 'to' : 'tre'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
                        erBergensk
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                >
                    {erBergensk ? '2 kjønn' : '3 kjønn'}
                </motion.div>
            </div>

            {/* Ordkort */}
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ORD.map((ord) => {
                    const artikkel = erBergensk ? 'en' : 'ei';
                    const bestemt = erBergensk ? ord.felles : ord.hunkjonn;
                    return (
                        <div
                            key={ord.grunnord}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center"
                        >
                            <div className="text-xs text-slate-400 mb-1">
                                <span
                                    className={
                                        erBergensk ? 'text-emerald-600 font-semibold' : ''
                                    }
                                >
                                    {artikkel}
                                </span>{' '}
                                {ord.grunnord}
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={bestemt}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -10, opacity: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className={`text-lg font-bold ${
                                        erBergensk ? 'text-emerald-700' : 'text-slate-800'
                                    }`}
                                >
                                    {bestemt}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Feedback-sone */}
            <AnimatePresence mode="wait">
                {utforsket ? (
                    <motion.div
                        key="innsikt"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mx-6 mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2"
                    >
                        <Lightbulb className="w-5 h-5 flex-shrink-0 text-amber-500" />
                        <span>
                            La du merke til det? I bergensk finnes ikke hunkjønn. Alle ei-ordene
                            blir en-ord. Dette er kanskje det mest kjente kjennetegnet på
                            bergensk, og forskerne tror det kom fra de tysktalende
                            hansakjøpmennene på Bryggen. Når to språk møtes, pleier grammatisk
                            kjønn å forsvinne.
                        </span>
                    </motion.div>
                ) : (
                    <div className="mx-6 mb-4 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex gap-2">
                        <Sparkles className="w-5 h-5 flex-shrink-0 text-blue-400" />
                        <span>Vipp bryteren over på «Bergensk» og se hva som skjer.</span>
                    </div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-end">
                <button
                    onClick={reset}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full px-4 py-2 text-sm font-medium transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
