import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Quote, Sparkles } from 'lucide-react';

// Gyllen regel-veven: den gylne regel i ekte formuleringer fra flere tradisjoner,
// vevd sammen over tre baner - «ikke gjør», «gjør» og «en annen vei».
//
// Lyspære-øyeblikket: eleven leser setningene uten avsender og kjenner igjen den
// samme kjernen. Først når hun trykker «avslør», ser hun hvem som sa hva, og at
// tradisjoner som ellers er svært ulike lander på nesten samme setning.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface RegelForm {
    id: string;
    label: string;
    description?: string;
}

interface RegelGruppe {
    id: string;
    label: string;
    note?: string;
}

interface RegelTrad {
    id: string;
    name: string;
    color: string;
    group: string;
    form: string;
    quote: string;
    source: string;
    note?: string;
}

interface GyllenRegelVevenProps {
    title?: string;
    intro?: string;
    forms?: RegelForm[];
    groups?: RegelGruppe[];
    threads?: RegelTrad[];
    defaultGroup?: string;
    hiddenLabel?: string;
    revealLabel?: string;
    hideLabel?: string;
    coreTitle?: string;
    core?: string;
    note?: string;
}

const BAND_START = 150;
const BAND_SLUTT = 660;
const BAND_HOYDE = 34;
const TOPP = 30;
const AVSTAND = 58;
const SKJULT_FARGE = '#94a3b8';

export function GyllenRegelVeven({
    title = 'Den gylne regel-veven',
    intro = 'Les setningene uten å vite hvem som sa dem. Hva er felles?',
    forms = [],
    groups = [],
    threads = [],
    defaultGroup,
    hiddenLabel = 'Hvem sa dette?',
    revealLabel = 'Avslør hvem som sa det',
    hideLabel = 'Skjul avsenderne igjen',
    coreTitle = 'Den felles kjernen',
    core,
    note,
}: GyllenRegelVevenProps) {
    const grupper = useMemo<RegelGruppe[]>(() => {
        if (groups.length) return groups;
        const sett: string[] = [];
        threads.forEach((t) => {
            if (t.group && !sett.includes(t.group)) sett.push(t.group);
        });
        return sett.map((id) => ({ id, label: id }));
    }, [groups, threads]);

    const [aktivGruppe, setAktivGruppe] = useState<string>(defaultGroup ?? grupper[0]?.id ?? '');
    const [avslort, setAvslort] = useState(false);

    const synlige = useMemo(
        () => threads.filter((t) => t.group === aktivGruppe),
        [threads, aktivGruppe]
    );

    const gruppe = grupper.find((g) => g.id === aktivGruppe);

    if (!forms.length || !threads.length || !synlige.length) return null;

    const bandY = (formId: string) => {
        const i = forms.findIndex((f) => f.id === formId);
        return TOPP + (i < 0 ? 0 : i) * AVSTAND;
    };

    const traadX = (i: number) =>
        BAND_START + ((i + 0.5) * (BAND_SLUTT - BAND_START)) / synlige.length;

    const hoyde = TOPP + (forms.length - 1) * AVSTAND + BAND_HOYDE + 24;

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <figcaption className="mb-4">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {grupper.map((g) => {
                    const valgt = g.id === aktivGruppe;
                    return (
                        <button
                            key={g.id}
                            type="button"
                            onClick={() => setAktivGruppe(g.id)}
                            aria-pressed={valgt}
                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors ${
                                valgt
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                            }`}
                        >
                            {g.label}
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() => setAvslort((v) => !v)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                >
                    {avslort ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                    {avslort ? hideLabel : revealLabel}
                </button>
            </div>

            <div className="overflow-hidden rounded-lg bg-slate-50 p-2">
                <svg
                    viewBox={`0 0 700 ${hoyde}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={`Vev med ${synlige.length} formuleringer fordelt på ${forms.length} former`}
                >
                    {forms.map((f) => {
                        const y = bandY(f.id);
                        return (
                            <g key={f.id}>
                                <rect
                                    x={BAND_START}
                                    y={y}
                                    width={BAND_SLUTT - BAND_START}
                                    height={BAND_HOYDE}
                                    rx={12}
                                    fill="#e2e8f0"
                                />
                                <text
                                    x={BAND_START - 12}
                                    y={y + BAND_HOYDE / 2 + 5}
                                    textAnchor="end"
                                    fontSize="14"
                                    fontWeight="700"
                                    fill="#334155"
                                >
                                    {f.label}
                                </text>
                            </g>
                        );
                    })}

                    <AnimatePresence mode="wait">
                        <motion.g
                            key={aktivGruppe}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            {synlige.map((t, i) => {
                                const x = traadX(i);
                                const y = bandY(t.form) + BAND_HOYDE / 2;
                                const farge = avslort ? t.color : SKJULT_FARGE;
                                return (
                                    <g key={t.id}>
                                        <motion.line
                                            x1={x}
                                            y1={14}
                                            x2={x}
                                            y2={hoyde - 10}
                                            stroke={farge}
                                            strokeWidth={3}
                                            strokeLinecap="round"
                                            opacity={0.4}
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1, stroke: farge }}
                                            transition={{ duration: 0.5, delay: i * 0.08 }}
                                        />
                                        <motion.circle
                                            cx={x}
                                            cy={y}
                                            r={15}
                                            fill={farge}
                                            animate={{ fill: farge, scale: 1 }}
                                            initial={{ scale: 0.4 }}
                                            transition={{ duration: 0.35, delay: i * 0.08 }}
                                        />
                                        <text
                                            x={x}
                                            y={y + 5}
                                            textAnchor="middle"
                                            fontSize="14"
                                            fontWeight="700"
                                            fill="#ffffff"
                                        >
                                            {i + 1}
                                        </text>
                                    </g>
                                );
                            })}
                        </motion.g>
                    </AnimatePresence>
                </svg>
            </div>

            {forms.some((f) => f.description) && (
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                    {forms.map((f) => (
                        <li key={f.id}>
                            <span className="font-semibold text-slate-800">{f.label}:</span>{' '}
                            {f.description}
                        </li>
                    ))}
                </ul>
            )}

            <AnimatePresence mode="wait">
                <motion.div
                    key={aktivGruppe}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {synlige.map((t, i) => (
                        <div
                            key={t.id}
                            className="flex flex-col rounded-xl border bg-white p-3 shadow-sm"
                            style={{
                                borderColor: avslort ? t.color : '#e2e8f0',
                                borderLeftWidth: 4,
                            }}
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <span
                                    className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: avslort ? t.color : SKJULT_FARGE }}
                                >
                                    {i + 1}
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    {avslort ? t.name : hiddenLabel}
                                </span>
                            </div>
                            <p className="flex-1 text-sm leading-relaxed text-slate-800">
                                <Quote
                                    className="mr-1 inline h-3.5 w-3.5 text-slate-400"
                                    aria-hidden="true"
                                />
                                {t.quote}
                            </p>
                            <AnimatePresence initial={false}>
                                {avslort && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">
                                            {t.source}
                                        </p>
                                        {t.note && (
                                            <p className="mt-1 text-xs text-slate-600">{t.note}</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {gruppe?.note && <p className="mt-3 text-xs text-slate-500">{gruppe.note}</p>}

            {core && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                        {coreTitle}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-amber-900">{core}</p>
                </div>
            )}

            {note && <p className="mt-3 text-xs italic text-slate-500">{note}</p>}
        </figure>
    );
}
