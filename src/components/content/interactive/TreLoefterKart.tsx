import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, RefreshCw } from 'lucide-react';

interface TreLoefterKartProps {
    title?: string;
}

const PROMISES = [
    {
        id: 'husain',
        label: 'Husain-McMahon (1915-16)',
        color: 'bg-blue-500',
        lightBg: 'bg-blue-50 border-blue-200',
        text: 'blue',
        territory: 'Arabisk stat fra Syria til Arabia',
        recipient: 'Araberne',
        promise: 'Kjemp mot osmanerne, fa selvstyre og egne stater etter krigen.',
        conflict: 'Dekker Syria, Libanon, Irak og Palestina - noyaktig det Frankrike og Storbritannia ville dele.',
        overlapsHeight: '85%',
    },
    {
        id: 'sykes',
        label: 'Sykes-Picot (1916)',
        color: 'bg-rose-500',
        lightBg: 'bg-rose-50 border-rose-200',
        text: 'rose',
        territory: 'Britisk og fransk mandatsone',
        recipient: 'Frankrike + Storbritannia',
        promise: 'Frankrike far Syria/Libanon. Storbritannia far Irak/Palestina.',
        conflict: 'Hemmelig - aldri fortalt til araberne som kjempet. Overstyrer Husain-McMahon fullstendig.',
        overlapsHeight: '85%',
    },
    {
        id: 'balfour',
        label: 'Balfour-erklæringen (1917)',
        color: 'bg-amber-500',
        lightBg: 'bg-amber-50 border-amber-200',
        text: 'amber',
        territory: 'Jødisk nasjonalt hjemsted i Palestina',
        recipient: 'Den sionistiske bevegelsen',
        promise: 'Storbritannia støtter opprettelsen av et nasjonalt hjemsted for det jødiske folk i Palestina.',
        conflict: 'Palestina er allerede lovet til araberne (Husain) og gitt til Storbritannia (Sykes-Picot). Na loves det ogsa bort en tredje gang.',
        overlapsHeight: '35%',
    },
];

export function TreLoefterKart({ title = 'Tre løfter - ett territorium' }: TreLoefterKartProps) {
    const [active, setActive] = useState<Set<string>>(new Set());
    const [selected, setSelected] = useState<string | null>(null);

    const toggle = (id: string) => {
        setActive((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        setSelected(id === selected ? null : id);
    };

    const allActive = active.size === PROMISES.length;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden not-prose my-6">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Klikk et løfte for a se hva Storbritannia faktisk lovte bort</p>
                </div>
            </div>

            <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                    {/* Territory visualization */}
                    <div className="flex flex-col">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Territoriet</div>
                        <div className="relative h-48 rounded-lg border-2 border-slate-200 bg-slate-50 overflow-hidden">
                            {/* Base map - simplified rectangle representing Mandate Palestine/Syria */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-slate-300 font-medium">Det tidligere osmanske riket</span>
                            </div>

                            {/* Promise overlays */}
                            <AnimatePresence>
                                {PROMISES.map((p) =>
                                    active.has(p.id) ? (
                                        <motion.div
                                            key={p.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 0.45 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            style={{ height: p.overlapsHeight }}
                                            className={`absolute inset-x-0 bottom-0 ${p.color}`}
                                        />
                                    ) : null
                                )}
                            </AnimatePresence>

                            {/* Labels when active */}
                            <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1 flex-wrap px-1">
                                {PROMISES.filter((p) => active.has(p.id)).map((p) => (
                                    <span key={p.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${p.color}`}>
                                        {p.recipient.split(' ')[0]}
                                    </span>
                                ))}
                            </div>

                            {/* Overlap warning */}
                            <AnimatePresence>
                                {allActive && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute top-2 inset-x-2 rounded bg-rose-600 text-white text-[10px] font-bold text-center py-1"
                                    >
                                        ALLE TRE LOVER DET SAMME!
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Promise toggles */}
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-0">Løftene</div>
                        {PROMISES.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => toggle(p.id)}
                                className={`rounded-lg border-2 px-3 py-2 text-left transition-all ${
                                    active.has(p.id) ? p.lightBg + ' shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${active.has(p.id) ? p.color : 'bg-slate-200'}`} />
                                    <span className="text-[10px] font-semibold text-slate-700 leading-tight">{p.label}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 pl-4">{p.recipient}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detail panel */}
                <AnimatePresence mode="wait">
                    {selected && !allActive && (
                        <motion.div
                            key={selected}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`mt-3 rounded-lg border px-3 py-2.5 ${PROMISES.find((p) => p.id === selected)?.lightBg}`}
                        >
                            {(() => {
                                const p = PROMISES.find((x) => x.id === selected)!;
                                return (
                                    <>
                                        <div className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mb-1">
                                            Løftet til {p.recipient}
                                        </div>
                                        <p className="text-xs text-slate-700 leading-relaxed mb-1.5">{p.promise}</p>
                                        <div className="text-[10px] font-semibold text-rose-600">Problemet: {p.conflict}</div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    )}

                    {allActive && (
                        <motion.div
                            key="overlap"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-3 rounded-lg border-2 border-rose-300 bg-rose-50 px-3 py-3"
                        >
                            <div className="text-xs font-bold text-rose-700 mb-1">Det geometrisk umulige</div>
                            <p className="text-xs text-rose-800 leading-relaxed">
                                Tre løfter. Samme territorium. Ingen av dem kan holdes uten a bryte de to andre. Storbritannia visste det - og valgte a holde Sykes-Picot fordi det tjente britiske interesser best. Araberne og jødene fikk presentert regningen 1 hundre ar med konflikt.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 pb-4 flex items-center justify-between">
                <span className="text-xs text-slate-400">{active.size} av 3 løfter aktive</span>
                <button
                    onClick={() => { setActive(new Set()); setSelected(null); }}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                >
                    <RefreshCw className="w-3 h-3" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
