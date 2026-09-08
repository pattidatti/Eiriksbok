import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Handshake, Check, X, RotateCcw } from 'lucide-react';

// Lyspære-øyeblikket:
// Etter denne interaksjonen skal eleven forstå at Island ikke ble erobret. Øya
// ble en del av Norgesveldet gjennom en avtale der begge sider ga noe - og da
// kongen sluttet å holde sin del, hadde islendingene ingenting igjen å binde
// seg til.
//
// Derfor er halvparten av kortene lokkemat: hær, borg, språkforbud. Eleven må
// selv oppdage at ingen av dem sto i avtalen.

type Side = 'island' | 'konge';

interface AvtaleTerm {
    /** Kort tekst på kortet. */
    text: string;
    /** Hvilken side leddet hører til, eller null hvis det aldri sto i avtalen. */
    side: Side | null;
    /** Forklaring som vises når eleven velger et ledd som ikke sto der. */
    why?: string;
}

interface SamveldetsAvtaleProps {
    title?: string;
    prompt?: string;
    leftLabel?: string;
    rightLabel?: string;
    terms?: AvtaleTerm[];
    reveal?: string;
}

type Phase = 'idle' | 'active' | 'complete';

const DEFAULT_TERMS: AvtaleTerm[] = [
    { text: 'Islendingene betaler skatt til kongen hvert år', side: 'island' },
    { text: 'Islendingene sverger troskap til kongen', side: 'island' },
    { text: 'Island blir et skattland under den norske kongen', side: 'island' },
    { text: 'Kongen lar Island beholde sine egne lover', side: 'konge' },
    { text: 'Kongen sender seks skip med forsyninger til øya hvert år', side: 'konge' },
    {
        text: 'Kongen sender en hær som tar over øya',
        side: null,
        why: 'Nei. Island ble aldri erobret. Islendingene sa ja til kongen i en avtale.',
    },
    {
        text: 'Kongen bygger en borg på Island',
        side: null,
        why: 'Nei. Kongen hadde verken borg eller soldater på Island.',
    },
    {
        text: 'Islendingene må slutte å bruke sitt eget språk',
        side: null,
        why: 'Nei. Island beholdt både språket sitt og lovene sine.',
    },
    {
        text: 'Alle rettssaker fra Island skal dømmes i Bergen',
        side: null,
        why: 'Nei. Island dømte i sine egne saker, etter sine egne lover.',
    },
    {
        text: 'Kongen betaler Island for å bli med i riket',
        side: null,
        why: 'Nei. Det gikk motsatt vei: Island betalte skatt til kongen.',
    },
];

const DEFAULT_REVEAL =
    'Dette er avtalen som kalles Gamli sáttmáli, altså «den gamle avtalen», fra 1262. ' +
    'Begge sider ga noe. Da kornskipene fra kongen etter hvert sluttet å komme, mente ' +
    'islendingene at kongen hadde brutt sin del - og båndet til Norge ble tynnere for hvert år.';

export function SamveldetsAvtale({
    title = 'Avtalen fra 1262',
    prompt = 'Klikk de fem leddene som faktisk sto i avtalen mellom islendingene og kong Håkon.',
    leftLabel = 'Islendingene lover',
    rightLabel = 'Kongen lover',
    terms = DEFAULT_TERMS,
    reveal = DEFAULT_REVEAL,
}: SamveldetsAvtaleProps) {
    const [found, setFound] = useState<number[]>([]);
    const [rejected, setRejected] = useState<number[]>([]);
    const [shake, setShake] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const realCount = useMemo(() => terms.filter((t) => t.side !== null).length, [terms]);
    const phase: Phase =
        found.length === realCount ? 'complete' : found.length + rejected.length > 0 ? 'active' : 'idle';

    const pick = (index: number) => {
        if (found.includes(index) || rejected.includes(index)) return;
        const term = terms[index];
        if (term.side) {
            setFound((f) => [...f, index]);
            setMessage(null);
        } else {
            setRejected((r) => [...r, index]);
            setShake(index);
            setMessage(term.why ?? 'Dette sto ikke i avtalen.');
            window.setTimeout(() => setShake(null), 420);
        }
    };

    const handleReset = () => {
        setFound([]);
        setRejected([]);
        setShake(null);
        setMessage(null);
    };

    const column = (side: Side) =>
        found.filter((i) => terms[i].side === side).map((i) => ({ i, text: terms[i].text }));

    const pool = terms
        .map((t, i) => ({ ...t, i }))
        .filter((t) => !found.includes(t.i) && !rejected.includes(t.i));

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden my-8">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <Handshake className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{prompt}</p>
                </div>
            </div>

            {/* De to sidene av avtalen */}
            <div className="px-5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['island', 'konge'] as Side[]).map((side) => (
                    <div
                        key={side}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[132px]"
                    >
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                            {side === 'island' ? leftLabel : rightLabel}
                        </p>
                        <div className="space-y-2">
                            <AnimatePresence initial={false}>
                                {column(side).map((c) => (
                                    <motion.div
                                        key={c.i}
                                        initial={{ opacity: 0, y: 10, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 420, damping: 26 }}
                                        className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800"
                                    >
                                        <Check className="w-4 h-4 shrink-0 mt-0.5" />
                                        <span>{c.text}</span>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {column(side).length === 0 && (
                                <p className="text-xs text-slate-400 italic">Ingen ledd ennå</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Kortstokken eleven velger fra */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                <AnimatePresence initial={false}>
                    {pool.map((t) => (
                        <motion.button
                            key={t.i}
                            layout
                            onClick={() => pick(t.i)}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={
                                shake === t.i
                                    ? { opacity: 1, scale: 1, x: [0, -7, 7, -4, 0] }
                                    : { opacity: 1, scale: 1, x: 0 }
                            }
                            exit={{ opacity: 0, scale: 0.85 }}
                            transition={{ duration: 0.32 }}
                            className="text-left text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 transition-shadow max-w-full"
                        >
                            {t.text}
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {/* Kort som ble prøvd og ikke hørte hjemme */}
            {rejected.length > 0 && (
                <div className="px-5 pt-3 flex flex-wrap gap-2">
                    {rejected.map((i) => (
                        <span
                            key={i}
                            className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 line-through"
                        >
                            <X className="w-3.5 h-3.5" />
                            {terms[i].text}
                        </span>
                    ))}
                </div>
            )}

            {/* Feedback-sone: alltid til stede */}
            <div className="px-5 pt-4">
                <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 10, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm leading-relaxed"
                        >
                            <span className="font-semibold">Avtalen er hel.</span> {reveal}
                        </motion.div>
                    ) : message ? (
                        <motion.div
                            key={message}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm"
                        >
                            {message}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm"
                        >
                            Fem av leddene sto i avtalen. Fem gjorde det ikke. Funnet{' '}
                            {found.length} av {realCount}.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 py-4 flex items-center justify-end">
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
