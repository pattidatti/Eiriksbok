import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Mail, RotateCcw, Send, Sparkles } from 'lucide-react';

interface AdressenPaaBonnenProps {
    title?: string;
}

type SlotId = 'til' | 'gjennom' | 'ord';

type Phase = 'idle' | 'active' | 'complete';

interface Valg {
    id: string;
    label: string;
    riktig: boolean;
    feedback: string;
}

interface Rad {
    id: SlotId;
    etikett: string;
    hjelp: string;
    valg: Valg[];
}

const RADER: Rad[] = [
    {
        id: 'til',
        etikett: 'Til',
        hjelp: 'Hvem er bønnen stilet til?',
        valg: [
            {
                id: 'jehova',
                label: 'Jehova',
                riktig: true,
                feedback:
                    'Riktig. Jehovas vitner mener at bønn bare skal gå til Gud, som de kaller Jehova.',
            },
            {
                id: 'jesus',
                label: 'Jesus',
                riktig: false,
                feedback:
                    'Mange kristne ber til Jesus. Jehovas vitner gjør det ikke. De mener Jesus er skapt av Gud, og at bare Gud selv skal ha bønnen.',
            },
            {
                id: 'maria',
                label: 'Maria',
                riktig: false,
                feedback:
                    'Mange katolikker ber Maria om forbønn. Jehovas vitner mener bønnen ikke skal gå til noe menneske.',
            },
            {
                id: 'helgen',
                label: 'En helgen',
                riktig: false,
                feedback:
                    'Katolikker og ortodokse ber helgener om hjelp. Jehovas vitner avviser dette og går rett til Jehova.',
            },
        ],
    },
    {
        id: 'gjennom',
        etikett: 'Gjennom',
        hjelp: 'Hvem går bønnen via?',
        valg: [
            {
                id: 'jesus',
                label: 'Jesus',
                riktig: true,
                feedback:
                    'Riktig. Bønnen går til Jehova, men i Jesu navn. Jehovas vitner viser til at Jesus sa at ingen kommer til Faderen uten gjennom ham.',
            },
            {
                id: 'ingen',
                label: 'Ingen, rett fram',
                riktig: false,
                feedback:
                    'Nesten. Adressen er riktig, men Jehovas vitner mener bønnen må gå i Jesu navn for å bli hørt.',
            },
            {
                id: 'eldste',
                label: 'En eldste i menigheten',
                riktig: false,
                feedback:
                    'De eldste leder menigheten, men de er ikke mellomledd i bønn. Det er bare Jesus.',
            },
        ],
    },
    {
        id: 'ord',
        etikett: 'Ordene',
        hjelp: 'Hva sier du?',
        valg: [
            {
                id: 'egne',
                label: 'Mine egne ord',
                riktig: true,
                feedback:
                    'Riktig. Jehovas vitner ber med egne ord, om det som betyr noe for dem akkurat da.',
            },
            {
                id: 'fadervar',
                label: 'Fadervår ordrett, hver gang',
                riktig: false,
                feedback:
                    'Jehovas vitner leser Fadervår som et mønster å lære av, ikke som en tekst du skal gjenta ord for ord.',
            },
            {
                id: 'ramse',
                label: 'Den samme ramsa om igjen',
                riktig: false,
                feedback:
                    'De viser til at Jesus advarte mot å si de samme tingene om og om igjen. Bønnen skal komme fra hjertet.',
            },
        ],
    },
];

export function AdressenPaaBonnen({ title = 'Adressen på bønnen' }: AdressenPaaBonnenProps) {
    const [valgt, setValgt] = useState<Record<SlotId, string | null>>({
        til: null,
        gjennom: null,
        ord: null,
    });
    const [sist, setSist] = useState<{ slot: SlotId; valg: Valg } | null>(null);
    const [phase, setPhase] = useState<Phase>('idle');

    const alleFylt = RADER.every((rad) => valgt[rad.id] !== null);
    const alleRiktige = RADER.every((rad) => {
        const id = valgt[rad.id];
        return rad.valg.some((v) => v.id === id && v.riktig);
    });

    const velg = (rad: Rad, v: Valg) => {
        setValgt((forrige) => ({ ...forrige, [rad.id]: v.id }));
        setSist({ slot: rad.id, valg: v });
        setPhase('active');
    };

    const tilbakestill = () => {
        setValgt({ til: null, gjennom: null, ord: null });
        setSist(null);
        setPhase('idle');
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Fyll ut de tre feltene slik en Jehovas vitne ville gjort det.
                    </p>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                <motion.div
                    animate={
                        phase === 'complete'
                            ? { y: [0, -10, 0], boxShadow: '0 10px 30px rgba(16,185,129,0.25)' }
                            : { y: 0, boxShadow: '0 0 0 rgba(0,0,0,0)' }
                    }
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`rounded-xl border p-4 sm:p-5 ${
                        phase === 'complete'
                            ? 'border-emerald-200 bg-emerald-50/60'
                            : 'border-slate-200 bg-slate-50'
                    }`}
                >
                    <div className="space-y-4">
                        {RADER.map((rad) => {
                            const valgtId = valgt[rad.id];
                            return (
                                <div
                                    key={rad.id}
                                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                                >
                                    <div className="sm:w-40 shrink-0">
                                        <p className="text-sm font-semibold text-slate-700">
                                            {rad.etikett}
                                        </p>
                                        <p className="text-xs text-slate-500">{rad.hjelp}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {rad.valg.map((v) => {
                                            const erValgt = valgtId === v.id;
                                            const stil = !erValgt
                                                ? 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md'
                                                : v.riktig
                                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                  : 'bg-rose-50 border-rose-300 text-rose-800';
                                            return (
                                                <motion.button
                                                    key={v.id}
                                                    type="button"
                                                    onClick={() => velg(rad, v)}
                                                    whileHover={{ scale: 1.04 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    animate={
                                                        erValgt
                                                            ? { scale: [1, 1.08, 1] }
                                                            : { scale: 1 }
                                                    }
                                                    transition={{ duration: 0.25 }}
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm shadow-sm ${stil}`}
                                                >
                                                    {erValgt && v.riktig && (
                                                        <Check className="w-3.5 h-3.5" />
                                                    )}
                                                    {v.label}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            <div className="px-4 sm:px-6 pb-2 min-h-[64px]">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                        >
                            <motion.span
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="w-4 h-4 mt-0.5" />
                            </motion.span>
                            <span>
                                Bønnen er sendt. Til Jehova, gjennom Jesus, med dine egne ord. Det er
                                hele adressen Jehovas vitner holder fast på.
                            </span>
                        </motion.div>
                    ) : sist ? (
                        <motion.div
                            key={`${sist.slot}-${sist.valg.id}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`rounded-lg border px-4 py-3 text-sm ${
                                sist.valg.riktig
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                    : 'border-amber-200 bg-amber-50 text-amber-800'
                            }`}
                        >
                            {sist.valg.feedback}
                        </motion.div>
                    ) : (
                        <motion.p
                            key="tom"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700"
                        >
                            Trykk på et av alternativene. Du får svar med en gang.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-4 sm:px-6 pb-5 pt-2 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setPhase('complete')}
                    disabled={!alleFylt || !alleRiktige || phase === 'complete'}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                    <Send className="w-4 h-4" />
                    {alleFylt && !alleRiktige ? 'Rett opp adressen' : 'Send bønnen'}
                </button>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
