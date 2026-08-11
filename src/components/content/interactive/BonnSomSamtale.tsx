import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MessageCircle, RotateCcw, Sparkles, X } from 'lucide-react';

interface BonnSomSamtaleProps {
    title?: string;
}

type Phase = 'building' | 'sending' | 'answered';

interface Kort {
    id: string;
    text: string;
    step: number | null;
    why: string;
}

const SLOTS = [
    { label: 'Tiltale', hint: 'Hvem snakker du til?' },
    { label: 'Takk', hint: 'Hva er du takknemlig for?' },
    { label: 'Be om', hint: 'Hva vil du spørre om?' },
    { label: 'Avslutning', hint: 'Hvordan slutter bønnen?' },
];

const KORT: Kort[] = [
    {
        id: 'takk',
        text: 'Takk for familien min og for dagen i dag.',
        step: 1,
        why: 'Takken kommer etter tiltalen.',
    },
    {
        id: 'moroni',
        text: 'Kjære engelen Moroni, hør på meg.',
        step: null,
        why: 'Kirkens veiledning sier at man ber til Gud, og ikke til noen annen.',
    },
    {
        id: 'tiltale',
        text: 'Kjære himmelske Fader.',
        step: 0,
        why: 'Bønnen begynner med å tiltale den himmelske Faderen.',
    },
    {
        id: 'egenvilje',
        text: 'La min vilje skje, uansett hva du mener.',
        step: null,
        why: 'Veiledningen sier at man ber om at Guds vilje skal skje.',
    },
    {
        id: 'avslutning',
        text: 'I Jesu Kristi navn. Amen.',
        step: 3,
        why: 'Alle bønner avsluttes i Jesu Kristi navn.',
    },
    {
        id: 'utenat',
        text: 'Jeg leser opp en ferdig tekst, ord for ord.',
        step: null,
        why: 'Veiledningen råder mot meningsløse ord og setninger. Bønnen er dine egne ord.',
    },
    {
        id: 'beom',
        text: 'Er det jeg leser i Mormons bok sant? Jeg spør deg oppriktig.',
        step: 2,
        why: 'Her stiller du spørsmålet ditt og ber om det du trenger.',
    },
];

const SVAR = [
    {
        ord: 'Ja',
        tekst: 'Svaret kan være ja.',
        farge: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    },
    {
        ord: 'Nei',
        tekst: 'Svaret kan være nei.',
        farge: 'bg-rose-50 border-rose-200 text-rose-800',
    },
    {
        ord: 'Vent',
        tekst: 'Eller: ikke nå. Vent.',
        farge: 'bg-amber-50 border-amber-200 text-amber-800',
    },
];

export function BonnSomSamtale({
    title = 'Bygg bønnen, og se hva som kommer tilbake',
}: BonnSomSamtaleProps) {
    const [placed, setPlaced] = useState<string[]>([]);
    const [phase, setPhase] = useState<Phase>('building');
    const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
    const [shake, setShake] = useState<string | null>(null);

    const nextStep = placed.length;

    const handleReset = () => {
        setPlaced([]);
        setPhase('building');
        setFeedback(null);
        setShake(null);
    };

    const handlePick = (kort: Kort) => {
        if (phase !== 'building') return;

        if (kort.step === nextStep) {
            const neste = [...placed, kort.id];
            setPlaced(neste);
            setFeedback({ ok: true, text: kort.why });
            if (neste.length === SLOTS.length) {
                setPhase('sending');
                window.setTimeout(() => setPhase('answered'), 900);
            }
            return;
        }

        setShake(kort.id);
        window.setTimeout(() => setShake(null), 400);
        if (kort.step === null) {
            setFeedback({ ok: false, text: kort.why });
        } else {
            setFeedback({
                ok: false,
                text: `Dette hører hjemme i bønnen, men ikke her. Neste del er «${SLOTS[nextStep].label}».`,
            });
        }
    };

    const igjen = KORT.filter((k) => !placed.includes(k.id));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk setningene i riktig rekkefølge. Tre av dem hører ikke hjemme.
                    </p>
                </div>
            </div>

            <div className="p-6 grid gap-6 md:grid-cols-2">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                        Bønnen
                    </p>
                    <motion.div
                        className="space-y-2"
                        animate={
                            phase === 'sending' || phase === 'answered'
                                ? { y: -4, opacity: 1 }
                                : { y: 0, opacity: 1 }
                        }
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    >
                        {SLOTS.map((slot, i) => {
                            const kort = KORT.find((k) => k.id === placed[i]);
                            const aktiv = phase === 'building' && i === nextStep;
                            return (
                                <div
                                    key={slot.label}
                                    className={`rounded-xl border px-3 py-2.5 flex items-start gap-3 ${
                                        kort
                                            ? 'bg-indigo-50 border-indigo-200'
                                            : aktiv
                                              ? 'bg-white border-indigo-300 border-dashed'
                                              : 'bg-slate-50 border-slate-200 border-dashed'
                                    }`}
                                >
                                    <span
                                        className={`mt-0.5 w-6 h-6 shrink-0 rounded-full text-xs font-semibold flex items-center justify-center ${
                                            kort
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-200 text-slate-500'
                                        }`}
                                    >
                                        {i + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-500">
                                            {slot.label}
                                        </p>
                                        <AnimatePresence mode="wait">
                                            {kort ? (
                                                <motion.p
                                                    key="fylt"
                                                    initial={{ opacity: 0, x: 12 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 300,
                                                        damping: 20,
                                                    }}
                                                    className="text-sm text-slate-800"
                                                >
                                                    {kort.text}
                                                </motion.p>
                                            ) : (
                                                <motion.p
                                                    key="tom"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="text-sm text-slate-400"
                                                >
                                                    {slot.hint}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                        {phase === 'answered'
                            ? 'Og så? Slik beskriver kirken svaret'
                            : 'Velg neste setning'}
                    </p>

                    {phase === 'answered' ? (
                        <div className="space-y-2">
                            {SVAR.map((svar, i) => (
                                <motion.div
                                    key={svar.ord}
                                    initial={{ opacity: 0, y: 14, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{
                                        delay: i * 0.18,
                                        type: 'spring',
                                        stiffness: 260,
                                        damping: 18,
                                    }}
                                    className={`rounded-xl border px-3 py-2.5 ${svar.farge}`}
                                >
                                    <p className="text-sm font-semibold">{svar.ord}</p>
                                    <p className="text-sm">{svar.tekst}</p>
                                </motion.div>
                            ))}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7 }}
                                className="text-sm text-slate-600 pt-1"
                            >
                                Kirkens egen veiledning sier at svaret ofte kommer gjennom andre
                                mennesker, eller som kraft til å klare saken selv.
                            </motion.p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {igjen.map((kort) => (
                                <motion.button
                                    key={kort.id}
                                    layout
                                    onClick={() => handlePick(kort)}
                                    animate={
                                        shake === kort.id ? { x: [0, -8, 8, -5, 0] } : { x: 0 }
                                    }
                                    transition={{ duration: 0.35 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md px-3 py-2.5 text-sm text-slate-700"
                                >
                                    {kort.text}
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-6 pb-2 min-h-[3.25rem]">
                <AnimatePresence mode="wait">
                    {phase === 'answered' ? (
                        <motion.div
                            key="ferdig"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 16 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                        >
                            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>
                                Bønnen er hel. Legg merke til at den er en samtale: du sier noe, og
                                noe kommer tilbake. Det er også slik denne kirken mener man kan
                                finne ut om noe er sant.
                            </span>
                        </motion.div>
                    ) : feedback ? (
                        <motion.div
                            key={feedback.text}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`px-4 py-3 rounded-lg text-sm flex items-start gap-2 border ${
                                feedback.ok
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                        >
                            {feedback.ok ? (
                                <Check className="w-4 h-4 mt-0.5 shrink-0" />
                            ) : (
                                <X className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>{feedback.text}</span>
                        </motion.div>
                    ) : (
                        <motion.p
                            key="start"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Begynn med den setningen du tror en bønn starter med.
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-6 pb-5 pt-2 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {placed.length} av {SLOTS.length} deler på plass
                </p>
                <button
                    onClick={handleReset}
                    className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1.5"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
