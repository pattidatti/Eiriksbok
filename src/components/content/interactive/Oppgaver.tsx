import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, Compass, ClipboardList } from 'lucide-react';
import { renderInlineMarkdown } from '../../markdownUtils';
import { CopyTasksButton } from '../CopyTasksButton';

interface OppgaverProps {
    /** Overskrift over oppgavesettet. Standard: "Oppgaver". */
    title?: string;
    /** Forstå: hent fakta rett ut av teksten (gjenkalle). */
    forstaa?: string[];
    /** Reflekter: analyser, forklar mekanismer, vurder. */
    reflekter?: string[];
    /** Gå videre: diskusjon, skriveoppgave eller koble til nåtid (det ekstra). */
    gaaVidere?: string[];
}

type Level = {
    key: keyof Pick<OppgaverProps, 'forstaa' | 'reflekter' | 'gaaVidere'>;
    label: string;
    Icon: typeof BookOpen;
    chip: string;
    iconColor: string;
    badge: string;
    /** True = fremhevet spor (det "ekstra"). */
    highlight?: boolean;
};

const LEVELS: Level[] = [
    {
        key: 'forstaa',
        label: 'Forstå',
        Icon: BookOpen,
        chip: 'bg-sky-100 text-sky-800',
        iconColor: 'text-sky-600',
        badge: 'bg-slate-100 text-slate-600',
    },
    {
        key: 'reflekter',
        label: 'Reflekter',
        Icon: Lightbulb,
        chip: 'bg-amber-100 text-amber-800',
        iconColor: 'text-amber-600',
        badge: 'bg-slate-100 text-slate-600',
    },
    {
        key: 'gaaVidere',
        label: 'Gå videre',
        Icon: Compass,
        chip: 'bg-emerald-100 text-emerald-800',
        iconColor: 'text-emerald-600',
        badge: 'bg-emerald-600 text-white',
        highlight: true,
    },
];

export const Oppgaver = ({ title = 'Oppgaver', forstaa, reflekter, gaaVidere }: OppgaverProps) => {
    const props: OppgaverProps = { forstaa, reflekter, gaaVidere };

    const groups = LEVELS.map((level) => ({
        level,
        tasks: (props[level.key] || []).filter((t) => t && t.trim().length > 0),
    })).filter((g) => g.tasks.length > 0);

    if (groups.length === 0) return null;

    // Alle oppgaver i visningsrekkefølge — for "kopier"-knappen (flat 1..N-nummerering).
    const allTasks = groups.flatMap((g) => g.tasks);

    // Fortløpende nummerering 1..N på tvers av kategoriene. Startnummeret per gruppe
    // regnes ut på forhånd, slik at ingen teller muteres inne i render-callbackene.
    const groupStart: number[] = [];
    let running = 0;
    for (const g of groups) {
        groupStart.push(running);
        running += g.tasks.length;
    }

    return (
        <motion.section
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
            }}
            className="my-8 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm sm:p-5"
        >
            <header className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <ClipboardList size={18} className="text-slate-700" />
                    <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
                </div>
                <CopyTasksButton tasks={allTasks} />
            </header>

            <div className="space-y-4">
                {groups.map((group, gi) => {
                    const { level } = group;
                    return (
                        <div
                            key={level.key}
                            className={
                                level.highlight
                                    ? 'rounded-lg border border-emerald-200 bg-emerald-50/60 p-3'
                                    : ''
                            }
                        >
                            <span
                                className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${level.chip}`}
                            >
                                <level.Icon size={13} className={level.iconColor} />
                                {level.label}
                            </span>

                            <ol className="space-y-1.5">
                                {group.tasks.map((task, ti) => {
                                    const n = groupStart[gi] + ti + 1;
                                    return (
                                        <motion.li
                                            key={ti}
                                            variants={{
                                                hidden: { opacity: 0, x: -6 },
                                                show: {
                                                    opacity: 1,
                                                    x: 0,
                                                    transition: {
                                                        duration: 0.3,
                                                        delay: Math.min(0.03 * n, 0.4),
                                                    },
                                                },
                                            }}
                                            className="flex gap-2.5"
                                        >
                                            <span
                                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${level.badge}`}
                                            >
                                                {n}
                                            </span>
                                            <span className="text-[15px] leading-snug text-slate-700">
                                                {renderInlineMarkdown(task)}
                                            </span>
                                        </motion.li>
                                    );
                                })}
                            </ol>
                        </div>
                    );
                })}
            </div>
        </motion.section>
    );
};
