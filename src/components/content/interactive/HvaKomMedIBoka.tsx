import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Library, Check, Split, Ban, ScrollText, RotateCcw, Sparkles } from 'lucide-react';

interface HvaKomMedIBokaProps {
    title?: string;
}

type ShelfId = 'alle' | 'noen' | 'ingen';

interface Skrift {
    id: string;
    label: string;
    shelf: ShelfId;
    note: string;
}

interface Shelf {
    id: ShelfId;
    label: string;
    hint: string;
    Icon: typeof Check;
    ring: string;
    tone: string;
    text: string;
}

const SKRIFTER: Skrift[] = [
    {
        id: 'markus',
        label: 'Markusevangeliet',
        shelf: 'alle',
        note: 'Forskere daterer de fire evangeliene til mellom år 60 og 95. I andre halvdel av 100-tallet var de godt etablert som hellige skrifter i menighetene.',
    },
    {
        id: 'romerbrevet',
        label: 'Romerbrevet',
        shelf: 'alle',
        note: 'Brevene til Paulus er de eldste kristne skriftene vi har, skrevet omkring år 50 til 60. De var også de første som ble samlet, og like etter år 100 finnes det spor av en slik samling.',
    },
    {
        id: 'aapenbaringen',
        label: "Johannes' åpenbaring",
        shelf: 'alle',
        note: 'Den kom med, men ikke uten strid. Åpenbaringen ble tidlig anerkjent i vestkirken, mens mange i østkirken var skeptiske til den.',
    },
    {
        id: 'sirak',
        label: 'Sirak',
        shelf: 'noen',
        note: 'Sirak er en av de gammeltestamentlige apokryfene. Den står i katolske og ortodokse bibler, men er utelatt i de fleste nyere protestantiske.',
    },
    {
        id: 'makkabeer',
        label: '1. Makkabeerbok',
        shelf: 'noen',
        note: 'Trientkonsilet slo i 1546 fast at den latinske bibelen Vulgata var kirkens bibel. Makkabeerbøkene står på den listen. Nyere protestantiske bibler har dem vanligvis ikke.',
    },
    {
        id: 'tomas',
        label: 'Tomasevangeliet',
        shelf: 'ingen',
        note: 'Et økende antall forskere daterer den til omkring år 150. Den er en samling på 114 utsagn tillagt Jesus, om hemmelig kunnskap for de utvalgte. Kirkefedrene omtalte den gjennomgående negativt.',
    },
    {
        id: 'hermas',
        label: 'Hyrden av Hermas',
        shelf: 'ingen',
        note: 'Den var populær og ble anbefalt lest. Men Muratori-fragmentet, trolig fra før år 200, sier at den ikke skulle leses i gudstjenesten. Begrunnelsen var at skriftet var blitt til etter apostlenes tid.',
    },
];

const SHELVES: Shelf[] = [
    {
        id: 'alle',
        label: 'I alle kristne bibler',
        hint: 'Ingen kirke er i tvil',
        Icon: Check,
        ring: 'border-emerald-200 bg-emerald-50/60',
        tone: 'bg-emerald-100 text-emerald-700',
        text: 'text-emerald-900',
    },
    {
        id: 'noen',
        label: 'Bare i noen bibler',
        hint: 'Kirkene lander ulikt',
        Icon: Split,
        ring: 'border-amber-200 bg-amber-50/60',
        tone: 'bg-amber-100 text-amber-700',
        text: 'text-amber-900',
    },
    {
        id: 'ingen',
        label: 'Ble ikke med',
        hint: 'Utenfor grensa',
        Icon: Ban,
        ring: 'border-slate-200 bg-slate-50',
        tone: 'bg-slate-200 text-slate-700',
        text: 'text-slate-800',
    },
];

type FeedbackKind = 'idle' | 'success' | 'error' | 'complete';

interface Feedback {
    kind: FeedbackKind;
    text: string;
}

const IDLE_FEEDBACK: Feedback = {
    kind: 'idle',
    text: 'Velg et skrift øverst, og klikk deretter på hylla du tror det havnet på.',
};

const FEEDBACK_STYLE: Record<FeedbackKind, string> = {
    idle: 'bg-slate-50 border-slate-200 text-slate-500',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    complete: 'bg-amber-50 border-amber-200 text-amber-800',
};

export function HvaKomMedIBoka({ title = 'Hva kom med i boka?' }: HvaKomMedIBokaProps) {
    const [placed, setPlaced] = useState<Record<string, ShelfId>>({});
    const [selected, setSelected] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback>(IDLE_FEEDBACK);
    const [shakeShelf, setShakeShelf] = useState<ShelfId | null>(null);

    const antallPlassert = Object.keys(placed).length;
    const ferdig = antallPlassert === SKRIFTER.length;

    const handleReset = () => {
        setPlaced({});
        setSelected(null);
        setFeedback(IDLE_FEEDBACK);
        setShakeShelf(null);
    };

    const handleSkriftClick = (skrift: Skrift) => {
        if (selected === skrift.id) {
            setSelected(null);
            setFeedback(IDLE_FEEDBACK);
            return;
        }
        setSelected(skrift.id);
        setFeedback({
            kind: 'idle',
            text: `${skrift.label} er valgt. Hvilken hylle hører den hjemme på?`,
        });
    };

    const handleShelfClick = (shelf: Shelf) => {
        if (!selected) {
            setFeedback({ kind: 'idle', text: 'Velg et skrift øverst først.' });
            return;
        }

        const skrift = SKRIFTER.find((s) => s.id === selected);
        if (!skrift) return;

        if (skrift.shelf !== shelf.id) {
            setShakeShelf(shelf.id);
            setSelected(null);
            window.setTimeout(() => setShakeShelf(null), 500);
            setFeedback({
                kind: 'error',
                text: `${skrift.label} hører ikke hjemme der. Les hyllene en gang til, og prøv på nytt.`,
            });
            return;
        }

        const nye = { ...placed, [skrift.id]: shelf.id };
        setPlaced(nye);
        setSelected(null);

        if (Object.keys(nye).length === SKRIFTER.length) {
            setFeedback({
                kind: 'complete',
                text: 'Alle sju er plassert. Se på hylla i midten.',
            });
        } else {
            setFeedback({ kind: 'success', text: skrift.note });
        }
    };

    const igjen = SKRIFTER.filter((s) => !placed[s.id]);

    return (
        <div className="my-8 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
                <Library className="h-5 w-5 shrink-0 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Sju skrifter som var i bruk i tidlig kristen tid. Hvor endte de opp?
                    </p>
                </div>
            </div>

            <div className="px-5 pt-4">
                <div className="flex min-h-[44px] flex-wrap gap-2">
                    {igjen.map((skrift) => {
                        const aktiv = selected === skrift.id;
                        return (
                            <motion.button
                                key={skrift.id}
                                layout
                                layoutId={`skrift-${skrift.id}`}
                                onClick={() => handleSkriftClick(skrift)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                                    aktiv
                                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-md'
                                        : 'border-slate-200 bg-slate-50 text-slate-700 shadow-sm hover:bg-slate-100'
                                }`}
                            >
                                <ScrollText className="h-4 w-4" />
                                {skrift.label}
                            </motion.button>
                        );
                    })}
                    {ferdig && (
                        <span className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                            <Check className="h-4 w-4" />
                            Bordet er tomt
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
                {SHELVES.map((shelf) => {
                    const iHylla = SKRIFTER.filter((s) => placed[s.id] === shelf.id);
                    return (
                        <motion.button
                            key={shelf.id}
                            onClick={() => handleShelfClick(shelf)}
                            animate={
                                shakeShelf === shelf.id ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }
                            }
                            transition={{ duration: 0.45 }}
                            className={`flex min-h-[168px] flex-col rounded-xl border p-3 text-left ${shelf.ring} hover:border-indigo-300`}
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full ${shelf.tone}`}
                                >
                                    <shelf.Icon className="h-3.5 w-3.5" />
                                </span>
                                <span className={`text-sm font-semibold ${shelf.text}`}>
                                    {shelf.label}
                                </span>
                            </span>
                            <span className="mt-1 text-xs text-slate-500">{shelf.hint}</span>

                            <span className="mt-3 flex flex-1 flex-wrap content-start gap-2">
                                {iHylla.length === 0 ? (
                                    <span className="inline-block rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-400">
                                        Tom hylle
                                    </span>
                                ) : (
                                    iHylla.map((skrift) => (
                                        <motion.span
                                            key={skrift.id}
                                            layoutId={`skrift-${skrift.id}`}
                                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm"
                                        >
                                            <ScrollText className="h-3.5 w-3.5" />
                                            {skrift.label}
                                        </motion.span>
                                    ))
                                )}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            <div className="px-5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={feedback.kind + feedback.text}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`rounded-lg border px-4 py-3 text-sm ${FEEDBACK_STYLE[feedback.kind]}`}
                    >
                        {feedback.text}
                    </motion.div>
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {ferdig && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                        className="mx-5 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                        <div className="flex items-start gap-3">
                            <motion.span
                                initial={{ rotate: -20, scale: 0.6 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                            >
                                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                            </motion.span>
                            <p className="text-sm leading-relaxed text-amber-900">
                                Verken en enkeltperson eller et kirkemøte bestemte hva som skulle
                                med. Skriftene ble anerkjent litt etter litt. Først i et påskebrev
                                fra biskop Athanasius i år 367 finner vi en liste med nøyaktig de
                                skriftene som står i Det nye testamentet i dag. Og hylla i midten
                                står der fortsatt: kirkene er enige om kjernen, men ikke om kantene.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between px-5 pb-5 pt-4">
                <span className="text-sm text-slate-500">
                    {antallPlassert} av {SKRIFTER.length} skrifter plassert
                </span>
                <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200"
                >
                    <RotateCcw className="h-4 w-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
