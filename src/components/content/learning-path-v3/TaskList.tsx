import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';
import type { LearningPathTask } from '../../../types';
import { renderInlineMarkdown } from '../../markdownUtils';
import { useGlossary } from '../../../context/GlossaryContext';

// Nivået sier eleven hva slags svar som ventes. «Finn» er med vilje først og enklest:
// svaret står ordrett i teksten, så alle kommer i gang.
const LEVELS: Record<string, { label: string; chip: string; num: string }> = {
    finn: {
        label: 'Finn i teksten',
        chip: 'bg-emerald-100 text-emerald-800',
        num: 'bg-emerald-500 text-white',
    },
    tenk: { label: 'Tenk over', chip: 'bg-sky-100 text-sky-800', num: 'bg-sky-500 text-white' },
    drøft: {
        label: 'Drøft',
        chip: 'bg-violet-100 text-violet-800',
        num: 'bg-violet-500 text-white',
    },
};
const DEFAULT_NUM = 'bg-slate-700 text-white';

function kmLabel(id: string): string {
    const n = id.match(/(\d+)$/)?.[1];
    return n ? `KM ${n}` : id;
}

interface TaskListProps {
    tasks: (string | LearningPathTask)[];
    numberPrefix?: string; // «3» gir 3.1, 3.2 ...
    copyHeading?: string; // første linje i det som kopieres, f.eks. «Steg 3: Hannibal over Alpene»
}

export function TaskList({ tasks, numberPrefix, copyHeading }: TaskListProps) {
    const { entries } = useGlossary();
    const [copied, setCopied] = useState(false);
    const numberOf = (i: number) => (numberPrefix ? `${numberPrefix}.${i + 1}` : `${i + 1}`);
    const textOf = (t: string | LearningPathTask) => (typeof t === 'string' ? t : t.text);

    const copy = async () => {
        const lines = tasks.map((t, i) => `${numberOf(i)} ${textOf(t)}`);
        const text = (copyHeading ? [copyHeading, '', ...lines] : lines).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            // Utklippstavla er ikke tilgjengelig (f.eks. uten https) - knappen gjør ingenting.
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-bold text-slate-500">
                    {tasks.length} {tasks.length === 1 ? 'oppgave' : 'oppgaver'}
                </p>
                <motion.button
                    type="button"
                    onClick={copy}
                    whileTap={{ scale: 0.96 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-bold transition-colors ${
                        copied
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
                    }`}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={copied ? 'ok' : 'copy'}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </motion.span>
                    </AnimatePresence>
                    {copied ? 'Kopiert!' : 'Kopier oppgavene'}
                </motion.button>
            </div>

            <ol className="space-y-3">
                {tasks.map((t, i) => {
                    const task = typeof t === 'string' ? null : t;
                    const level = task ? LEVELS[task.type] : undefined;
                    return (
                        <li
                            key={i}
                            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                            <span
                                className={`min-w-12 h-12 px-2 rounded-xl flex items-center justify-center font-display text-lg font-black flex-shrink-0 ${level?.num ?? DEFAULT_NUM}`}
                            >
                                {numberOf(i)}
                            </span>
                            <div className="min-w-0 pt-0.5">
                                {(level || task?.km?.length || task?.kjennetegn) && (
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                        {level && (
                                            <span
                                                className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${level.chip}`}
                                            >
                                                {level.label}
                                            </span>
                                        )}
                                        {task?.km?.map((k) => (
                                            <span
                                                key={k}
                                                title="Kompetansemål i samfunnsfag etter 10. trinn"
                                                className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"
                                            >
                                                {kmLabel(k)}
                                            </span>
                                        ))}
                                        {task?.kjennetegn && (
                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                                                {task.kjennetegn}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <p className="text-base sm:text-[17px] leading-relaxed text-slate-800">
                                    {renderInlineMarkdown(textOf(t), entries)}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
