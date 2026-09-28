import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Check, ChevronDown, GraduationCap, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DeepDiveV3, LearningPathTask } from '../../../types';
import { TaskList } from './TaskList';
import { CopyTasksButton } from '../CopyTasksButton';

function Node({ done, children }: { done: boolean; children: React.ReactNode }) {
    return (
        <div className="absolute left-0 top-3 z-10">
            <div
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 ${
                    done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-violet-50 border-violet-300 text-violet-600'
                }`}
            >
                {done ? <Check className="w-5 h-5 sm:w-6 sm:h-6" /> : children}
            </div>
        </div>
    );
}

interface DeepDiveCardProps {
    phaseNumber: number;
    deepDive: DeepDiveV3;
    ready: boolean; // stasjonene i delen er klarert
    done: boolean;
    readUrls: string[];
    onRead: (url: string) => void;
    onToggleDone: () => void;
}

// Dypdykket er stedet artiklene hører hjemme: eleven leser fordi oppgavene krever det.
export function DeepDiveCard({
    phaseNumber,
    deepDive,
    ready,
    done,
    readUrls,
    onRead,
    onToggleDone,
}: DeepDiveCardProps) {
    const [open, setOpen] = useState(false);
    const readCount = deepDive.articles.filter((a) => readUrls.includes(a.url)).length;

    return (
        <div className="relative pl-11 sm:pl-16">
            <Node done={done}>
                <Library className="w-5 h-5" />
            </Node>
            <div
                className={`rounded-2xl border bg-gradient-to-br from-violet-50/80 to-white ${
                    open
                        ? 'shadow-xl shadow-violet-100 border-violet-200'
                        : 'border-violet-200 shadow-sm'
                }`}
            >
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className="w-full text-left flex items-center gap-3 p-3 sm:p-4 group"
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black uppercase tracking-widest text-violet-600">
                            Dypdykk etter del {phaseNumber}
                        </p>
                        <h3 className="font-display text-lg sm:text-xl font-black text-slate-900 leading-tight group-hover:text-violet-700">
                            Les og skriv
                        </h3>
                        <p className="text-sm text-slate-500">
                            {deepDive.articles.length} artikler · {deepDive.tasks.length} oppgaver
                            til skriveboka
                            {!ready && !done && ' · best når stegene over er klarert'}
                        </p>
                    </div>
                    {done ? (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
                            Ferdig
                        </span>
                    ) : (
                        <ChevronDown
                            className={`w-6 h-6 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                        />
                    )}
                </button>

                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="border-t border-violet-100 px-3 sm:px-6 py-5 space-y-6">
                                <p className="text-slate-700 leading-relaxed">{deepDive.intro}</p>

                                <section>
                                    <p className="font-display font-black text-slate-900 mb-2">
                                        1. Les{' '}
                                        <span className="text-sm font-semibold text-slate-400">
                                            ({readCount} av {deepDive.articles.length} åpnet)
                                        </span>
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                        {deepDive.articles.map((a) => {
                                            const read = readUrls.includes(a.url);
                                            return (
                                                <Link
                                                    key={a.url}
                                                    to={a.url}
                                                    onClick={() => onRead(a.url)}
                                                    className={`flex items-center gap-3 rounded-xl border-2 px-3 py-3 font-semibold transition ${
                                                        read
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                                            : 'border-violet-200 bg-white text-violet-800 hover:border-violet-400 hover:shadow-md'
                                                    }`}
                                                >
                                                    {read ? (
                                                        <Check className="w-5 h-5 flex-shrink-0" />
                                                    ) : (
                                                        <BookOpen className="w-5 h-5 flex-shrink-0" />
                                                    )}
                                                    <span className="text-sm leading-snug">
                                                        {a.title}
                                                    </span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </section>

                                <section>
                                    <p className="font-display font-black text-slate-900 mb-2">
                                        2. Skriv i skriveboka
                                    </p>
                                    <TaskList
                                        tasks={deepDive.tasks}
                                        copyHeading={`Dypdykk etter del ${phaseNumber}`}
                                    />
                                </section>

                                <button
                                    type="button"
                                    onClick={onToggleDone}
                                    className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-black ${
                                        done
                                            ? 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                                            : 'bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700'
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    {done ? 'Marker som ikke ferdig' : 'Jeg har skrevet svarene'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

interface ProjectCardProps {
    intro: string;
    choices: LearningPathTask[];
    chosen: string | null;
    onChoose: (id: string) => void;
}

// Fordypningen til slutt: eleven velger én oppgave å jobbe videre med.
export function ProjectCard({ intro, choices, chosen, onChoose }: ProjectCardProps) {
    const selected = choices.find((c) => c.id === chosen);
    return (
        <div className="relative pl-11 sm:pl-16">
            <Node done={!!selected}>
                <GraduationCap className="w-5 h-5" />
            </Node>
            <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-white p-4 sm:p-6 shadow-sm">
                <p className="text-[11px] font-black uppercase tracking-widest text-violet-600">
                    Fordypning
                </p>
                <h3 className="font-display text-lg sm:text-xl font-black text-slate-900 leading-tight">
                    Velg én oppgave
                </h3>
                <p className="text-sm text-slate-600 mt-1 mb-4">{intro}</p>
                <div className="grid gap-2">
                    {choices.map((c) => {
                        const on = c.id === chosen;
                        return (
                            <motion.button
                                key={c.id}
                                type="button"
                                onClick={() => onChoose(c.id)}
                                whileTap={{ scale: 0.99 }}
                                className={`text-left rounded-xl border-2 px-4 py-3 transition ${
                                    on
                                        ? 'border-violet-500 bg-violet-50 shadow-md'
                                        : 'border-slate-200 bg-white hover:border-violet-300'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <span
                                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                            on
                                                ? 'border-violet-600 bg-violet-600 text-white'
                                                : 'border-slate-300'
                                        }`}
                                    >
                                        {on && <Check className="w-3 h-3" />}
                                    </span>
                                    <span className="text-sm text-slate-800 leading-relaxed">
                                        {c.text}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
                {selected && (
                    <div className="mt-4">
                        <CopyTasksButton tasks={[selected]} />
                    </div>
                )}
            </div>
        </div>
    );
}
