import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, PenLine, RotateCcw, Users } from 'lucide-react';

interface VitnenesUnderskrifterProps {
    title?: string;
}

interface WitnessGroup {
    key: 'tre' | 'atte';
    label: string;
    when: string;
    names: string[];
    claim: string;
    after: string;
    columns: string;
}

const GROUPS: WitnessGroup[] = [
    {
        key: 'tre',
        label: 'De tre vitnene',
        when: 'Juni 1829, i nærheten av hjemmet til Peter Whitmer sen. i Fayette i delstaten New York',
        names: ['Oliver Cowdery', 'David Whitmer', 'Martin Harris'],
        claim: 'En engel viste oss platene, og vi hørte Guds stemme si at Joseph Smith hadde oversatt dem ved Guds gave og kraft.',
        after: 'Alle tre kom senere ut av kirken. Harris ble ekskludert i 1837, Cowdery i 1838, og Whitmer forlot den i 1838. Ifølge kirkens historieframstilling trakk ingen av dem vitnesbyrdet tilbake.',
        columns: 'grid-cols-1',
    },
    {
        key: 'atte',
        label: 'De åtte vitnene',
        when: 'Sommeren 1829, kort tid etter de tre. Alle åtte tilhørte familiene Whitmer og Smith',
        names: [
            'Christian Whitmer',
            'Jacob Whitmer',
            'Peter Whitmer jr.',
            'John Whitmer',
            'Hiram Page',
            'Joseph Smith sen.',
            'Hyrum Smith',
            'Samuel H. Smith',
        ],
        claim: 'Joseph Smith viste oss selv platene. Vi løftet på dem med hendene og så inngraveringene, som så ut som gammelt arbeid.',
        after: 'Noen av de åtte tok senere avstand fra kirken. Ifølge kirkens historieframstilling trakk ingen av dem vitnesbyrdet tilbake.',
        columns: 'grid-cols-1 sm:grid-cols-2',
    },
];

const TOTAL = 11;

function Signature() {
    return (
        <motion.svg
            viewBox="0 0 72 20"
            className="h-5 w-[72px] shrink-0"
            initial={{ clipPath: 'inset(0 100% 0 0)' }}
            animate={{ clipPath: 'inset(0 0% 0 0)' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
        >
            <path
                d="M2 15 C7 4, 11 19, 16 10 S24 2, 29 13 S37 18, 42 7 S51 3, 56 14 L70 8"
                fill="none"
                stroke="#4f46e5"
                strokeWidth="1.8"
                strokeLinecap="round"
            />
        </motion.svg>
    );
}

export function VitnenesUnderskrifter({
    title = 'Vitnenes underskrifter',
}: VitnenesUnderskrifterProps) {
    const [signed, setSigned] = useState<string[]>([]);
    const timers = useRef<number[]>([]);

    const clearTimers = () => {
        timers.current.forEach((id) => window.clearTimeout(id));
        timers.current = [];
    };

    useEffect(() => clearTimers, []);

    const sign = (name: string) => {
        setSigned((prev) => (prev.includes(name) ? prev : [...prev, name]));
    };

    const signAll = () => {
        clearTimers();
        const remaining = GROUPS.flatMap((g) => g.names).filter((n) => !signed.includes(n));
        remaining.forEach((name, i) => {
            const id = window.setTimeout(() => sign(name), i * 160);
            timers.current.push(id);
        });
    };

    const handleReset = () => {
        clearTimers();
        setSigned([]);
    };

    const done = signed.length === TOTAL;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <PenLine className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Klikk på hvert navn for å skrive under. Se hva de to gruppene faktisk gikk
                        god for.
                    </p>
                </div>
            </div>

            <div className="p-5 grid gap-4 md:grid-cols-2">
                {GROUPS.map((group) => {
                    const count = group.names.filter((n) => signed.includes(n)).length;
                    const complete = count === group.names.length;
                    return (
                        <div
                            key={group.key}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-slate-800 text-sm">
                                    {group.label}
                                </h4>
                                <span className="text-xs font-medium text-slate-500 shrink-0">
                                    {count}/{group.names.length}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mb-3">{group.when}</p>

                            <div className={`grid ${group.columns} gap-2`}>
                                {group.names.map((name) => {
                                    const isSigned = signed.includes(name);
                                    return (
                                        <motion.button
                                            key={name}
                                            type="button"
                                            onClick={() => sign(name)}
                                            whileTap={{ scale: 0.97 }}
                                            animate={{
                                                backgroundColor: isSigned ? '#eef2ff' : '#ffffff',
                                                borderColor: isSigned ? '#c7d2fe' : '#e2e8f0',
                                            }}
                                            transition={{ duration: 0.25 }}
                                            className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left shadow-sm hover:shadow-md"
                                        >
                                            <span className="text-xs font-medium text-slate-700 truncate">
                                                {name}
                                            </span>
                                            {isSigned ? (
                                                <Signature />
                                            ) : (
                                                <span className="h-5 w-[72px] shrink-0 border-b border-dashed border-slate-300" />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="mt-3 min-h-[86px]">
                                <AnimatePresence mode="wait">
                                    {complete ? (
                                        <motion.div
                                            key="claim"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2"
                                        >
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-500">
                                                Dette skrev de under på
                                            </p>
                                            <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                                                {group.claim}
                                            </p>
                                            <p className="mt-2 text-[11px] text-blue-600">
                                                {group.after}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.p
                                            key="hint"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="text-xs text-slate-400 px-1"
                                        >
                                            Skriv under alle navnene for å se hva denne gruppen gikk
                                            god for.
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mx-5 mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full bg-indigo-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${(signed.length / TOTAL) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
                        />
                    </div>
                    <span className="text-xs font-medium text-slate-600 shrink-0">
                        {signed.length} av {TOTAL} underskrifter
                    </span>
                </div>

                <AnimatePresence mode="wait">
                    {done && (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
                            className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3"
                        >
                            <div className="flex items-center gap-2">
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 320, damping: 14 }}
                                    className="inline-flex"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </motion.span>
                                <p className="text-sm font-semibold text-emerald-800">
                                    Elleve underskrifter, ingen kjent tilbaketrekning.
                                </p>
                            </div>
                            <p className="mt-2 text-xs text-emerald-800 leading-relaxed">
                                De to gruppene skrev ikke under på det samme. De tre forteller om en
                                engel og en stemme fra himmelen. De åtte forteller om noe helt
                                jordnært: at de fikk se og løfte på plater. Åtte av de elleve
                                tilhørte to familier, fem het Whitmer og tre het Smith. Ingen kan
                                undersøke platene i dag, så disse navnene er alt som står igjen.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="px-5 pb-5 flex items-center justify-between">
                <button
                    type="button"
                    onClick={signAll}
                    disabled={done}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full px-6 py-2 text-sm font-medium transition-colors"
                >
                    Skriv under alle
                </button>
                <button
                    type="button"
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
