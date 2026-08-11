import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Baby, Ear, HeartPulse, RotateCcw, Sparkles } from 'lucide-react';

interface FoersteOgSisteOrdProps {
    title?: string;
}

interface Brikke {
    id: string;
    tekst: string;
    riktig: boolean;
    forklaring: string;
}

type Side = 'foerste' | 'siste';

const BRIKKER: Brikke[] = [
    {
        id: 'ingen-gud',
        tekst: 'Det finnes ingen gud uten Gud',
        riktig: true,
        forklaring: 'Første halvdel av trosbekjennelsen.',
    },
    {
        id: 'sendebud',
        tekst: 'Muhammad er Guds sendebud',
        riktig: true,
        forklaring: 'Andre halvdel av trosbekjennelsen.',
    },
    {
        id: 'kom-til-bonn',
        tekst: 'Kom til bønnen',
        riktig: false,
        forklaring:
            'Dette ropes ut fem ganger om dagen i bønneropet. Det er ikke trosbekjennelsen.',
    },
    {
        id: 'mahr',
        tekst: 'Jeg gifter meg med deg for denne gaven',
        riktig: false,
        forklaring: 'Dette er ekteskapsformelen. Den hører hjemme i bryllupet.',
    },
    {
        id: 'storst',
        tekst: 'Gud er størst',
        riktig: false,
        forklaring:
            'Dette sies blant annet fire ganger i gravferdsbønnen, men det er en annen setning.',
    },
];

const ANTALL_SLOTS = 2;

export function FoersteOgSisteOrd({ title = 'Første og siste ord' }: FoersteOgSisteOrdProps) {
    const [foerste, setFoerste] = useState<string[]>([]);
    const [siste, setSiste] = useState<string[]>([]);
    const [feilId, setFeilId] = useState<string | null>(null);
    const [melding, setMelding] = useState<string | null>(null);

    const aktivSide: Side = foerste.length < ANTALL_SLOTS ? 'foerste' : 'siste';
    const ferdig = foerste.length === ANTALL_SLOTS && siste.length === ANTALL_SLOTS;

    const velg = (brikke: Brikke) => {
        if (ferdig) return;
        const liste = aktivSide === 'foerste' ? foerste : siste;

        if (liste.includes(brikke.id)) {
            setFeilId(brikke.id);
            setMelding('Denne ligger allerede i øret. Velg den andre halvdelen.');
            return;
        }

        if (!brikke.riktig) {
            setFeilId(brikke.id);
            setMelding(brikke.forklaring);
            return;
        }

        setFeilId(null);
        setMelding(null);
        if (aktivSide === 'foerste') {
            setFoerste([...foerste, brikke.id]);
        } else {
            setSiste([...siste, brikke.id]);
        }
    };

    const nullstill = () => {
        setFoerste([]);
        setSiste([]);
        setFeilId(null);
        setMelding(null);
    };

    const tekstFor = (id: string) => BRIKKER.find((b) => b.id === id)?.tekst ?? '';

    const panel = (side: Side) => {
        const liste = side === 'foerste' ? foerste : siste;
        const erAktiv = !ferdig && aktivSide === side;
        const fylt = liste.length === ANTALL_SLOTS;

        return (
            <motion.div
                animate={erAktiv ? { scale: 1 } : { scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`rounded-xl border p-4 ${
                    fylt
                        ? 'bg-emerald-50 border-emerald-200'
                        : erAktiv
                          ? 'bg-white border-indigo-300 shadow-md'
                          : 'bg-slate-50 border-slate-200'
                }`}
            >
                <div className="flex items-center gap-2">
                    {side === 'foerste' ? (
                        <Baby className="w-4 h-4 text-indigo-500 shrink-0" />
                    ) : (
                        <HeartPulse className="w-4 h-4 text-indigo-500 shrink-0" />
                    )}
                    <p className="text-sm font-semibold text-slate-800">
                        {side === 'foerste' ? 'Det nyfødte barnets øre' : 'Den døendes øre'}
                    </p>
                    {erAktiv && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-auto text-xs font-medium text-indigo-600"
                        >
                            Din tur
                        </motion.span>
                    )}
                </div>
                <p className="mt-1 text-xs text-slate-500 leading-snug">
                    {side === 'foerste'
                        ? 'Faren eller en annen voksen lener seg ned og hvisker.'
                        : 'Familien sier setningen sakte, så den døende kan si den etter.'}
                </p>

                <div className="mt-3 space-y-2">
                    {Array.from({ length: ANTALL_SLOTS }).map((_, i) => {
                        const id = liste[i];
                        return (
                            <div key={i} className="min-h-[44px]">
                                <AnimatePresence mode="wait">
                                    {id ? (
                                        <motion.div
                                            key={id}
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 22,
                                            }}
                                            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2"
                                        >
                                            <Ear className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span className="text-sm text-slate-800 leading-snug">
                                                {tekstFor(id)}
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={`tom-${i}`}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-400"
                                        >
                                            Tom plass
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <Ear className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk ordbrikkene og fyll begge ørene. Brikkene kan brukes om igjen.
                    </p>
                </div>
            </div>

            <div className="px-5 pt-5 grid gap-3 sm:grid-cols-2">
                {panel('foerste')}
                {panel('siste')}
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pt-3"
                    >
                        <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.7, ease: 'easeOut' }}
                                style={{ originX: 0 }}
                                className="h-full rounded-full bg-emerald-400"
                            />
                        </div>
                        <p className="mt-1 text-center text-xs font-medium text-emerald-700">
                            Et helt liv, fra første til siste ord
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="px-5 pt-4 grid gap-2 sm:grid-cols-2">
                {BRIKKER.map((brikke) => {
                    const feiler = feilId === brikke.id;
                    return (
                        <motion.button
                            key={brikke.id}
                            type="button"
                            onClick={() => velg(brikke)}
                            whileTap={{ scale: 0.97 }}
                            animate={feiler ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`text-left rounded-xl border px-3 py-2.5 text-sm shadow-sm transition-colors ${
                                feiler
                                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md'
                            }`}
                        >
                            {brikke.tekst}
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={ferdig ? 'ferdig' : (melding ?? 'tom')}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${
                            ferdig
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : melding
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                        }`}
                    >
                        {ferdig ? (
                            <span className="flex items-start gap-2">
                                <motion.span
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                                    className="mt-0.5 shrink-0"
                                >
                                    <Sparkles className="w-4 h-4 text-emerald-600" />
                                </motion.span>
                                <span>
                                    Du brukte de samme to brikkene begge ganger. Det er poenget:
                                    trosbekjennelsen er både det første et muslimsk barn får høre og
                                    det siste mange muslimer ønsker å si.
                                </span>
                            </span>
                        ) : (
                            (melding ??
                            'Velg de to setningene som til sammen utgjør trosbekjennelsen. Start med barnets øre.')
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    {foerste.length + siste.length} av {ANTALL_SLOTS * 2} plasser fylt
                </p>
                <button
                    type="button"
                    onClick={nullstill}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
