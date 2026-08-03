import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    BookOpen,
    Map,
    Hourglass,
    Search,
    Gamepad2,
    ExternalLink,
    ChevronDown,
    GraduationCap,
    Wrench,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

type ContentItem = {
    tittel: string;
    link: string;
    begrunnelse?: string;
};

type Goal = {
    id: string;
    nummer: number;
    kortNavn: string;
    tekst: string;
    merknad?: string;
    innhold: {
        artikler?: ContentItem[];
        stier?: ContentItem[];
        tidsreise?: ContentItem[];
        detektiv?: ContentItem[];
        spill?: ContentItem[];
        verktoy?: ContentItem[];
    };
};

type KjennetegnRow = {
    kategori: string;
    k2: string;
    k4: string;
    k6: string;
};

type KjennetegnNivaa = {
    id: 'k2' | 'k4' | 'k6';
    karakter: number;
    label: string;
    beskrivelse: string;
};

type Kjennetegn = {
    innledning: string;
    nivaaer: KjennetegnNivaa[];
    kategorier: KjennetegnRow[];
};

type CompetencyData = {
    subject: string;
    subjectLabel: string;
    lkCode: string;
    lkTitel: string;
    trinn: string;
    trinnLabel: string;
    merknad: string;
    kilde: { kompetansemaal: string; kjennetegn: string };
    goals: Goal[];
    kjennetegn: Kjennetegn;
};

const sectionMeta: Record<
    keyof Goal['innhold'],
    { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
    artikler: { label: 'Artikler', icon: BookOpen, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    stier: { label: 'Læringsstier', icon: Map, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    tidsreise: { label: 'Tidsreiser', icon: Hourglass, color: 'bg-rose-50 text-rose-700 border-rose-100' },
    detektiv: { label: 'Detektivsaker', icon: Search, color: 'bg-amber-50 text-amber-700 border-amber-100' },
    spill: { label: 'Mini-spill', icon: Gamepad2, color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
    verktoy: { label: 'Verktøy', icon: Wrench, color: 'bg-purple-50 text-purple-700 border-purple-100' },
};

const countContent = (goal: Goal): number =>
    Object.values(goal.innhold).reduce((sum, list) => sum + (list?.length ?? 0), 0);

const GoalCard: React.FC<{ goal: Goal; defaultOpen?: boolean }> = ({ goal, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    const total = countContent(goal);

    return (
        <motion.article
            layout
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full text-left p-5 flex items-start gap-4 hover:bg-slate-50/60 transition-colors"
                aria-expanded={open}
            >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-display font-bold text-lg shadow-md">
                    {goal.nummer}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-display font-bold text-slate-900">
                            {goal.kortNavn}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {total} {total === 1 ? 'ressurs' : 'ressurser'}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{goal.tekst}</p>
                </div>
                <ChevronDown
                    className={`flex-shrink-0 w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-100"
                    >
                        <div className="p-5 space-y-5 bg-slate-50/40">
                            {goal.merknad && (
                                <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                    <strong className="font-semibold">Merk:</strong> {goal.merknad}
                                </div>
                            )}

                            {(Object.keys(sectionMeta) as Array<keyof Goal['innhold']>).map((key) => {
                                const items = goal.innhold[key];
                                if (!items || items.length === 0) return null;
                                const meta = sectionMeta[key];
                                const Icon = meta.icon;
                                return (
                                    <section key={key}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {meta.label}
                                            </span>
                                            <span className="text-xs text-slate-500">{items.length}</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {items.map((item) => (
                                                <li key={`${key}-${item.link}-${item.tittel}`}>
                                                    <Link
                                                        to={item.link}
                                                        className="block group rounded-xl px-3 py-2 bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
                                                    >
                                                        <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-700">
                                                            {item.tittel}
                                                        </div>
                                                        {item.begrunnelse && (
                                                            <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                                                                {item.begrunnelse}
                                                            </div>
                                                        )}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                );
                            })}

                            {total === 0 && (
                                <p className="text-sm text-slate-500 italic">
                                    Ingen tilknyttet innhold ennå.
                                </p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.article>
    );
};

const KjennetegnTabell: React.FC<{ data: Kjennetegn }> = ({ data }) => {
    if (data.kategorier.length === 0) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-600 max-w-3xl">{data.innledning}</p>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600 max-w-3xl">{data.innledning}</p>

            {/* Desktop: tabell */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 font-display font-semibold text-slate-700 w-44">
                                Kategori
                            </th>
                            {data.nivaaer.map((n) => (
                                <th
                                    key={n.id}
                                    className="text-left px-4 py-3 font-display font-semibold text-slate-700"
                                >
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-base">{n.label}</span>
                                        <span className="text-xs font-normal text-slate-500">
                                            {n.beskrivelse}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.kategorier.map((row, i) => (
                            <tr
                                key={row.kategori}
                                className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                            >
                                <td className="px-4 py-3 font-semibold text-slate-800 align-top">
                                    {row.kategori}
                                </td>
                                <td className="px-4 py-3 text-slate-700 leading-relaxed align-top">
                                    {row.k2}
                                </td>
                                <td className="px-4 py-3 text-slate-700 leading-relaxed align-top">
                                    {row.k4}
                                </td>
                                <td className="px-4 py-3 text-slate-700 leading-relaxed align-top">
                                    {row.k6}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobil: stables i kort */}
            <div className="md:hidden space-y-3">
                {data.kategorier.map((row) => (
                    <div
                        key={row.kategori}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
                    >
                        <h4 className="font-display font-bold text-slate-900 mb-3">{row.kategori}</h4>
                        <div className="space-y-3">
                            {data.nivaaer.map((n) => {
                                const text = (row as Record<string, string>)[n.id];
                                return (
                                    <div key={n.id}>
                                        <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">
                                            {n.label} <span className="text-slate-500 font-normal normal-case">— {n.beskrivelse}</span>
                                        </div>
                                        <div className="text-sm text-slate-700 leading-relaxed">{text}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SUBJECTS: Array<{ id: string; label: string }> = [
    { id: 'samfunnsfag', label: 'Samfunnsfag' },
    { id: 'norsk', label: 'Norsk' },
    { id: 'krle', label: 'KRLE' },
    { id: 'musikk', label: 'Musikk' },
];

export const CompetencyGoalsPage: React.FC = () => {
    const [subject, setSubject] = useState<string>('samfunnsfag');
    const [data, setData] = useState<CompetencyData | null>(null);
    const [error, setError] = useState<string | null>(null);

    usePageTitle(data ? `Kompetansemål — ${data.subjectLabel}` : 'Kompetansemål');

    // Bytter eleven fag, tømmes forrige fags mål med en gang. Justeres under
    // render i stedet for i effecten, så det nye faget aldri vises et øyeblikk
    // med det forrige sitt innhold mens hentingen pågår.
    const [prevSubject, setPrevSubject] = useState(subject);
    if (subject !== prevSubject) {
        setPrevSubject(subject);
        setData(null);
        setError(null);
    }

    useEffect(() => {
        let cancelled = false;
        fetch(`${import.meta.env.BASE_URL}content/kompetansemal/${subject}-10-trinn.json`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json: CompetencyData) => {
                if (!cancelled) setData(json);
            })
            .catch((err) => {
                if (!cancelled) setError(err.message ?? 'Ukjent feil');
            });
        return () => {
            cancelled = true;
        };
    }, [subject]);

    const tabs = (
        <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SUBJECTS.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    onClick={() => setSubject(s.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        subject === s.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                    aria-pressed={subject === s.id}
                >
                    {s.label}
                </button>
            ))}
        </div>
    );

    if (error) {
        return (
            <div className="min-h-screen pt-4 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-3">
                        Kompetansemål
                    </h1>
                    {tabs}
                    <p className="text-red-600 mt-8">Kunne ikke laste kompetansemål: {error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen pt-4 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900 mb-3">
                        Kompetansemål
                    </h1>
                    {tabs}
                    <p className="text-slate-500 mt-8">Laster kompetansemål …</p>
                </div>
            </div>
        );
    }

    const totalContent = data.goals.reduce((sum, g) => sum + countContent(g), 0);

    return (
        <div className="min-h-screen pt-4 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.header
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-display font-bold text-slate-900">
                            Kompetansemål
                        </h1>
                    </div>
                    <p className="text-center text-base md:text-lg text-slate-600 max-w-3xl mx-auto">
                        {data.subjectLabel} — {data.trinnLabel}. Se hvilke mål fra LK20 hver
                        artikkel, læringssti, tidsreise, detektivsak og mini-spill underbygger.
                    </p>

                    {tabs}

                    <div className="mt-4 mx-auto max-w-3xl text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <strong className="font-semibold text-amber-900">Om faget: </strong>
                        {data.merknad}
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                        <a
                            href={data.kilde.kompetansemaal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Udir: {data.lkCode}
                        </a>
                        <a
                            href={data.kilde.kjennetegn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Kjennetegn på måloppnåelse
                        </a>
                    </div>
                </motion.header>

                <section className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-2xl font-display font-bold text-slate-900">
                            Kompetansemål etter 10. trinn
                        </h2>
                    </div>
                    <p className="text-sm text-slate-600 mb-5">
                        Klikk på et mål for å se hvilket innhold i Eiriksbok som dekker det.
                    </p>

                    {totalContent === 0 && (
                        <div className="mb-5 mx-auto max-w-3xl text-sm text-slate-700 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
                            Innhold til disse målene blir mappet i en senere runde. Inntil videre
                            ser du de offisielle LK20-målene og kjennetegnene fra Udir.
                        </div>
                    )}

                    <div className="space-y-3">
                        {data.goals.map((goal, idx) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <GoalCard goal={goal} />
                            </motion.div>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-2xl font-display font-bold text-slate-900">
                            Kjennetegn på måloppnåelse
                        </h2>
                    </div>
                    <KjennetegnTabell data={data.kjennetegn} />
                </section>
            </div>
        </div>
    );
};

export default CompetencyGoalsPage;
