import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tags, RotateCcw, Sparkles, AlertTriangle } from 'lucide-react';

// Lyspære-øyeblikket: de samme menneskene kan sorteres på mange måter. Krigen kom
// ikke fordi forskjellene fantes, men fordi noen bestemte at ÉN merkelapp skulle
// telle mer enn alle de andre.

interface MerkelappKategori {
    id: string;
    label: string;
    note: string;
    /** Merkelappen som ble gjort avgjørende. Får rød ramme og sterkere feedback. */
    avgjorende?: boolean;
}

interface MerkelappPerson {
    name: string;
    /** Nøkkel = kategori-id, verdi = hvilken gruppe personen havner i. */
    labels: Record<string, string>;
}

interface MerkelappMaskinenProps {
    title?: string;
    intro?: string;
    categories: MerkelappKategori[];
    people: MerkelappPerson[];
    /** Teksten eleven får når alle merkelappene er prøvd. */
    conclusion?: string;
}

const GROUP_STYLES = [
    'bg-sky-50 border-sky-200 text-sky-800',
    'bg-amber-50 border-amber-200 text-amber-800',
    'bg-emerald-50 border-emerald-200 text-emerald-800',
    'bg-violet-50 border-violet-200 text-violet-800',
];

export function MerkelappMaskinen({
    title = 'Merkelapp-maskinen',
    intro = 'Tolv naboer i samme gate. Velg en merkelapp, og se hvordan gata deler seg.',
    categories,
    people,
    conclusion = 'Du sorterte de samme tolv menneskene på flere måter. Menneskene endret seg aldri. Det eneste som endret seg, var hvilken merkelapp som fikk lov til å telle mest.',
}: MerkelappMaskinenProps) {
    const [active, setActive] = useState<string | null>(null);
    const [tried, setTried] = useState<string[]>([]);

    const activeCategory = categories.find((c) => c.id === active) ?? null;
    const allTried = tried.length === categories.length && categories.length > 0;

    const groups = useMemo(() => {
        if (!active) return [];
        const map = new Map<string, MerkelappPerson[]>();
        for (const p of people) {
            const key = p.labels[active] ?? 'Uten merkelapp';
            const list = map.get(key);
            if (list) list.push(p);
            else map.set(key, [p]);
        }
        return Array.from(map.entries()).map(([label, members]) => ({ label, members }));
    }, [active, people]);

    const choose = (id: string) => {
        setActive(id);
        setTried((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    const handleReset = () => {
        setActive(null);
        setTried([]);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
                <Tags className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">{intro}</p>
                </div>
            </div>

            {/* Valg av merkelapp */}
            <div className="px-5 pt-4 flex flex-wrap gap-2">
                {categories.map((c) => {
                    const isActive = c.id === active;
                    const isTried = tried.includes(c.id);
                    return (
                        <button
                            key={c.id}
                            onClick={() => choose(c.id)}
                            className={`rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                                isActive
                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                    : isTried
                                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            {c.label}
                        </button>
                    );
                })}
            </div>

            {/* Primær interaksjonsflate: gata som sorterer seg */}
            <div className="p-5">
                {!active ? (
                    <motion.div
                        layout
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2"
                    >
                        {people.map((p) => (
                            <motion.div
                                layout
                                key={p.name}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                            >
                                {p.name}
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div layout className="flex flex-wrap gap-3">
                        {groups.map((g, gi) => (
                            <motion.div
                                layout
                                key={g.label}
                                className={`flex-1 min-w-[150px] rounded-xl border p-3 ${
                                    activeCategory?.avgjorende
                                        ? 'bg-rose-50 border-rose-200'
                                        : GROUP_STYLES[gi % GROUP_STYLES.length]
                                }`}
                            >
                                <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-80">
                                    {g.label}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {g.members.map((p) => (
                                        <motion.div
                                            layout
                                            key={p.name}
                                            className="rounded-md bg-white/80 border border-white px-2.5 py-1.5 text-sm text-slate-700"
                                        >
                                            {p.name}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Feedback-sone */}
            <div className="px-5 pb-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={active ?? 'tom'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`px-4 py-3 rounded-lg border text-sm ${
                            !activeCategory
                                ? 'bg-slate-50 border-slate-200 text-slate-500'
                                : activeCategory.avgjorende
                                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                                  : 'bg-blue-50 border-blue-200 text-blue-800'
                        }`}
                    >
                        <span className="flex items-start gap-2">
                            {activeCategory?.avgjorende && (
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                            )}
                            <span>
                                {activeCategory
                                    ? activeCategory.note
                                    : 'Trykk på en merkelapp over for å sortere gata.'}
                            </span>
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Suksess-tilstand */}
            <AnimatePresence>
                {allTried && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="mx-5 mt-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2"
                    >
                        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
                        <span>{conclusion}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Kontrollrad */}
            <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Prøvd {tried.length} av {categories.length} merkelapper
                </span>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-4 h-4" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
