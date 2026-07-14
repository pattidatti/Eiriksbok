import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    RotateCcw,
    Ship,
    Gem,
    Landmark,
    MapPin,
    Package,
    Lock,
    CheckCircle2,
} from 'lucide-react';

// Signaturkomponent for artikkelen "Merovingertiden: De stille århundrene".
// Lyspære: når skriftlige kilder mangler, leser vi historien ut av bakken.
// Eleven graver fram fem arkeologiske spor og ser de stille århundrene ta form.

interface Clue {
    id: string;
    Icon: React.ComponentType<{ className?: string }>;
    question: string; // spørsmålet vi vil ha svar på
    find: string; // hva arkeologene faktisk fant
    insight: string; // hva funnet forteller oss
}

const CLUES: Clue[] = [
    {
        id: 'batgrav',
        Icon: Ship,
        question: 'Bodde det fortsatt folk her?',
        find: 'Rike båtgraver, blant annet ved Myklebostad og Åker.',
        insight: 'Folk overlevde katastrofen i 536. Mektige slekter fikk staselige begravelser gjennom hele perioden.',
    },
    {
        id: 'spenne',
        Icon: Gem,
        question: 'Hva slags håndverk mestret de?',
        find: 'Forgylte spenner dekket av sammenflettede dyr.',
        insight: 'Smedene laget fint metallarbeid. Den flettede dyrestilen ble et felles formspråk i hele Norden.',
    },
    {
        id: 'hall',
        Icon: Landmark,
        question: 'Hvem hadde makt?',
        find: 'Stolpehull etter store haller, som på Borg i Lofoten.',
        insight: 'Færre, men mektigere høvdinger samlet makt. Den store hallen var stedet der lederen holdt fest og styrte.',
    },
    {
        id: 'stedsnavn',
        Icon: MapPin,
        question: 'Hvor slo folk seg ned?',
        find: 'Gårdsnavn som ender på -heim, -land og -vin.',
        insight: 'Navnene viser hvilke gårder som ble ryddet og bosatt. Bygdene vokste fram igjen etter nedgangstiden.',
    },
    {
        id: 'handel',
        Icon: Package,
        question: 'Drev de handel?',
        find: 'Kleberkar og importvarer fra kysten og kontinentet.',
        insight: 'Handelen langs kysten tok seg opp igjen. Båter, varer og ideer flyttet seg raskere - grunnlaget for vikingferdene.',
    },
];

export function StilleKilder({ title = 'Grav fram de stille århundrene' }: { title?: string }) {
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    const [last, setLast] = useState<Clue | null>(null);

    const allDone = revealed.size === CLUES.length;

    const dig = (clue: Clue) => {
        if (revealed.has(clue.id)) return;
        const next = new Set(revealed);
        next.add(clue.id);
        setRevealed(next);
        setLast(clue);
    };

    const reset = () => {
        setRevealed(new Set());
        setLast(null);
    };

    const pct = Math.round((revealed.size / CLUES.length) * 100);

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Search className="w-5 h-5 text-amber-600" />
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-800 leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Nesten ingen skrev noe ned. Klikk hvert funn og les historien ut av bakken.
                    </p>
                </div>
                {revealed.size > 0 && (
                    <button
                        onClick={reset}
                        className="flex-shrink-0 inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Tilbakestill
                    </button>
                )}
            </div>

            {/* Funn-kort */}
            <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {CLUES.map((clue) => {
                        const open = revealed.has(clue.id);
                        const Icon = clue.Icon;
                        return (
                            <button
                                key={clue.id}
                                onClick={() => dig(clue)}
                                disabled={open}
                                className={`relative text-left rounded-xl border-2 p-3 min-h-[7.5rem] transition-colors ${
                                    open
                                        ? 'bg-emerald-50 border-emerald-300 cursor-default'
                                        : 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-400 cursor-pointer'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                            open
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-amber-200 text-amber-700'
                                        }`}
                                    >
                                        {open ? (
                                            <Icon className="w-4 h-4" />
                                        ) : (
                                            <Lock className="w-4 h-4" />
                                        )}
                                    </span>
                                </div>
                                <AnimatePresence mode="wait">
                                    {open ? (
                                        <motion.div
                                            key="open"
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 260,
                                                damping: 20,
                                            }}
                                            className="mt-2"
                                        >
                                            <p className="text-xs font-bold text-emerald-900 leading-snug">
                                                {clue.find}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            key="closed"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="mt-2 text-xs font-semibold text-amber-800 leading-snug"
                                        >
                                            {clue.question}
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}
                </div>

                {/* Fremdrift */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">
                            Bildet av de stille århundrene
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                            {revealed.size} / {CLUES.length}
                        </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                            animate={{ width: `${pct}%` }}
                            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                        />
                    </div>
                </div>
            </div>

            {/* Feedback-sone (alltid i DOM) */}
            <div className="mx-5 mb-5">
                <AnimatePresence mode="wait">
                    {allDone ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
                            className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800"
                        >
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                            <p className="text-sm leading-relaxed">
                                Uten en eneste bok leste du de stille århundrene ut av bakken. Graver,
                                kunst, haller, stedsnavn og handelsvarer viser et samfunn som reiste seg
                                igjen - og gjorde seg klart for vikingtiden.
                            </p>
                        </motion.div>
                    ) : last ? (
                        <motion.div
                            key={last.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm leading-relaxed"
                        >
                            {last.insight}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-sm"
                        >
                            Klikk et funn over for å grave det fram.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
