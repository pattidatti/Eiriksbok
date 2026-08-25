// Seiersskjermen. Den skal føles som en premie, ikke som en kvittering.

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Check,
    Clipboard,
    Clock,
    Eye,
    Lightbulb,
    RotateCcw,
    Sparkles,
    Trophy,
} from 'lucide-react';
import type { PlacedWord } from './types';
import { useCountUp } from '../progress/components/useCountUp';

interface VictoryProps {
    elapsed: number;
    hintsUsed: number;
    mistakes: number;
    // Ord eleven fikk avslørt med «Vis ordet»
    revealed: number;
    xp: number;
    // XP-en er 0 fordi eleven alt har fått uttelling for kryssord i dag
    alreadyEarnedToday: boolean;
    words: PlacedWord[];
    isDaily: boolean;
    // Lenken som gjenskaper akkurat dette brettet
    shareUrl: string;
    onNew: () => void;
}

// Reversindeksen begrep -> artikler (public/data/glossary-articles.json).
// Artikkelstiene står én gang, og hvert begrep peker på indekser inn i lista.
interface GlossaryArticles {
    articles: string[];
    terms: Record<string, number[]>;
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
    <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-4 py-3">
        <span className="mb-1 text-indigo-500">{icon}</span>
        <span className="text-xl font-black text-slate-800">{value}</span>
        <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {label}
        </span>
    </div>
);

// Tailwind må se hele klassenavnet, så kolonnene slås opp i stedet for å
// settes sammen av strenger.
const GRID_COLS: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
};

// Kopier tekst til utklippstavla. Nettleseren kan nekte clipboard-API-et
// (usikker tilknytning, skoleoppsett), så vi har en gammeldags reserveløsning
// med et skjult tekstfelt. Returnerer false hvis begge veier feiler - da får
// eleven lenken til å merke selv.
const copyText = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        // Faller videre til reserveløsningen
    }
    try {
        const field = document.createElement('textarea');
        field.value = text;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(field);
        return ok;
    } catch {
        return false;
    }
};

export const VictoryOverlay = ({
    elapsed,
    hintsUsed,
    mistakes,
    revealed,
    xp,
    alreadyEarnedToday,
    words,
    isDaily,
    shareUrl,
    onNew,
}: VictoryProps) => {
    const xpShown = useCountUp(xp, 900, 350);

    // Begrepene skal ha et sted å gå. Reversindeksen gir oss artikkelen der
    // begrepet faktisk blir forklart.
    const [conceptLinks, setConceptLinks] = useState<Record<string, string>>({});
    useEffect(() => {
        let alive = true;
        fetch('/data/glossary-articles.json')
            .then((res) => (res.ok ? (res.json() as Promise<GlossaryArticles>) : null))
            .then((data) => {
                if (!alive || !data) return;
                const map: Record<string, string> = {};
                for (const word of words) {
                    if (word.kind !== 'begrep') continue;
                    const first = data.terms[word.display]?.[0];
                    const path = first === undefined ? undefined : data.articles[first];
                    if (path) map[word.id] = `/${path}`;
                }
                setConceptLinks(map);
            })
            .catch(() => {
                // Uten indeksen blir begrepene bare uklikkbare, som før
            });
        return () => {
            alive = false;
        };
    }, [words]);

    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
    const copyTimer = useRef<number>(0);
    useEffect(() => () => window.clearTimeout(copyTimer.current), []);

    const handleCopy = async () => {
        const ok = await copyText(shareUrl);
        setCopyState(ok ? 'copied' : 'failed');
        window.clearTimeout(copyTimer.current);
        if (ok) copyTimer.current = window.setTimeout(() => setCopyState('idle'), 2200);
    };

    const stats = [
        { key: 'tid', icon: <Clock size={18} />, value: formatTime(elapsed), label: 'Tid' },
        {
            key: 'hint',
            icon: <Lightbulb size={18} />,
            value: String(hintsUsed),
            label: 'Hint brukt',
        },
    ];
    if (revealed > 0) {
        stats.push({
            key: 'avslort',
            icon: <Eye size={18} />,
            value: String(revealed),
            label: 'Ord du åpnet',
        });
    }
    if (!alreadyEarnedToday) {
        stats.push({
            key: 'xp',
            icon: <Sparkles size={18} />,
            value: `+${xpShown}`,
            label: 'XP',
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.85, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/60 bg-white p-6 shadow-2xl"
            >
                <div className="mb-4 text-center">
                    <motion.span
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.15, type: 'spring', stiffness: 300, damping: 12 }}
                        className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/40"
                    >
                        <Trophy size={30} />
                    </motion.span>
                    {isDaily && (
                        <p className="mb-1">
                            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold tracking-wide text-amber-700 uppercase">
                                Dagens kryssord
                            </span>
                        </p>
                    )}
                    <h2 className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-3xl font-black text-transparent">
                        Alle rutene fylt!
                    </h2>
                    <p className="mt-1 text-slate-500">
                        {isDaily
                            ? `Du løste dagens brett på ${words.length} ord.`
                            : `Du klarte ${words.length} ord.`}
                    </p>
                </div>

                <div className={`mb-4 grid gap-2 ${GRID_COLS[stats.length] ?? 'grid-cols-3'}`}>
                    {stats.map((stat) => (
                        <Stat
                            key={stat.key}
                            icon={stat.icon}
                            value={stat.value}
                            label={stat.label}
                        />
                    ))}
                </div>

                {alreadyEarnedToday && (
                    <p className="mb-4 rounded-2xl bg-indigo-50 px-4 py-3 text-center text-sm font-semibold text-indigo-700">
                        XP-en for kryssord er alt hentet i dag. Denne runden gir ingen nye poeng,
                        men ordene sitter like godt.
                    </p>
                )}

                {revealed > 0 && (
                    <p className="mb-2 text-center text-xs font-semibold text-slate-400">
                        Du åpnet {revealed} ord underveis. Å hente fram et ord du står fast på er
                        en helt vanlig måte å komme videre på.
                    </p>
                )}

                {mistakes > 0 && (
                    <p className="mb-4 text-center text-xs font-semibold text-slate-400">
                        {mistakes} bom underveis. Det er sånn man lærer.
                    </p>
                )}

                <h3 className="mb-1 text-sm font-bold tracking-wide text-slate-500 uppercase">
                    Ordene du løste
                </h3>
                <p className="mb-2 text-xs text-slate-400">Trykk på et ord for å lese mer om det.</p>
                <div className="mb-6 flex flex-wrap gap-1.5">
                    {words.map((word, index) => {
                        const href = word.link ?? conceptLinks[word.id];
                        const chip = (
                            <motion.span
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.25 + index * 0.03 }}
                                className={`inline-block rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                    href
                                        ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {word.display}
                            </motion.span>
                        );
                        return href ? (
                            <Link key={word.id} to={href} title={`Les mer om ${word.display}`}>
                                {chip}
                            </Link>
                        ) : (
                            <span key={word.id}>{chip}</span>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <motion.button
                        type="button"
                        onClick={onNew}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-indigo-500/30"
                    >
                        <RotateCcw size={18} />
                        Nytt kryssord
                    </motion.button>
                    <motion.button
                        type="button"
                        onClick={handleCopy}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        title="Kopier lenken til dette brettet"
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-3 font-bold transition-colors ${
                            copyState === 'copied'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {copyState === 'copied' ? <Check size={18} /> : <Clipboard size={18} />}
                        {copyState === 'copied' ? 'Kopiert!' : 'Kopier lenke'}
                    </motion.button>
                </div>

                <p className="mt-2 text-center text-xs text-slate-400">
                    Send lenken til en venn, så får hen nøyaktig samme brett.
                </p>

                {copyState === 'failed' && (
                    <div className="mt-2">
                        <p className="mb-1 text-center text-xs font-semibold text-slate-500">
                            Nettleseren ville ikke kopiere. Merk lenken og kopier den selv:
                        </p>
                        <input
                            readOnly
                            value={shareUrl}
                            onFocus={(e) => e.currentTarget.select()}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                        />
                    </div>
                )}

                <div className="mt-3 text-center">
                    <Link
                        to="/oving"
                        className="text-sm font-semibold text-slate-500 transition-colors hover:text-indigo-600"
                    >
                        Tilbake til øving
                    </Link>
                </div>
            </motion.div>
        </motion.div>
    );
};
