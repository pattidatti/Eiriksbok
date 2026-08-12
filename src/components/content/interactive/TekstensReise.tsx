import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Check, Contrast, Minus, Plus, RotateCcw } from 'lucide-react';

// TekstensReise: fra muntlig til nedskrevet til lukket til oversatt.
//
// Lyspaere-oyeblikket: eleven ser at de ni tradisjonene ikke reiser den samme
// ruta. Noen starter ikke i det muntlige i det hele tatt, noen lukker samlingen
// paa dagen, andre lukker den aldri, og for noen er siste stopp umulig fordi
// ordlyden selv er hellig. Stopp som ikke skjedde er ikke hull i kunnskapen.
// De er svaret.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

type StoppStatus = 'gjort' | 'delvis' | 'ikke' | 'apen';

interface Steg {
    id: string;
    label: string;
}

interface Stopp {
    status?: StoppStatus;
    when?: string;
    spanYears?: number;
    spanLabel?: string;
    text: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
    textName?: string;
    stops?: Record<string, Stopp | undefined>;
}

interface TekstensReiseProps {
    title?: string;
    intro?: string;
    steps?: Steg[];
    traditions?: Tradisjon[];
    defaultSelection?: string[];
    maxVisible?: number;
    note?: string;
    statusLabels?: Partial<Record<StoppStatus, string>>;
}

const STANDARD_STATUS: Record<StoppStatus, string> = {
    gjort: 'Skjedde',
    delvis: 'Bare delvis',
    ikke: 'Skjedde ikke',
    apen: 'Fortsatt åpent',
};

const IKON: Record<StoppStatus, typeof Check> = {
    gjort: Check,
    delvis: Contrast,
    ikke: Minus,
    apen: Plus,
};

// Religionsfargene fra props er laget for flater, ikke for smaa bokstaver.
// Amber og oransje blir uleselige som tekst paa lys bakgrunn og som bunnfarge
// bak hvitt. Her mørknes tonen til den holder WCAG AA mot hvitt. Fargen kommer
// fortsatt fra props - bare lysheten justeres.
function lesbar(hex: string): string {
    const treff = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!treff) return hex;
    const kanaler = [0, 2, 4].map((i) => parseInt(treff[1].slice(i, i + 2), 16));
    const lin = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const kontrast = () =>
        1.05 /
        (0.2126 * lin(kanaler[0]) + 0.7152 * lin(kanaler[1]) + 0.0722 * lin(kanaler[2]) + 0.05);
    for (let i = 0; i < 30 && kontrast() < 4.5; i++) {
        for (let k = 0; k < 3; k++) kanaler[k] = Math.round(kanaler[k] * 0.92);
    }
    return `#${kanaler.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function TekstensReise({
    title = 'Tekstens reise',
    intro = 'Velg inntil tre tradisjoner, og klikk deg gjennom de fire stoppene.',
    steps = [],
    traditions = [],
    defaultSelection = [],
    maxVisible = 3,
    note,
    statusLabels,
}: TekstensReiseProps) {
    const etiketter = { ...STANDARD_STATUS, ...statusLabels };
    const startvalg = defaultSelection.length
        ? defaultSelection.slice(0, maxVisible)
        : traditions.slice(0, maxVisible).map((t) => t.id);

    const [valgte, setValgte] = useState<string[]>(startvalg);
    const [steg, setSteg] = useState(0);

    const synlige = useMemo(
        () =>
            valgte.map((id) => traditions.find((t) => t.id === id)).filter(Boolean) as Tradisjon[],
        [valgte, traditions]
    );

    const aktivtSteg = steps[steg];

    // Lengste kjente tidsspenn blant de valgte. Alle sokylene males mot denne.
    const lengsteSpenn = useMemo(() => {
        let m = 0;
        synlige.forEach((t) => {
            steps.forEach((s) => {
                const v = t.stops?.[s.id]?.spanYears;
                if (typeof v === 'number' && v > m) m = v;
            });
        });
        return m;
    }, [synlige, steps]);

    const velg = (id: string) => {
        setValgte((v) => {
            if (v.includes(id)) return v.length > 1 ? v.filter((x) => x !== id) : v;
            return v.length >= maxVisible ? [...v.slice(1), id] : [...v, id];
        });
    };

    if (!steps.length || !traditions.length) return null;

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Velger for tradisjoner */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 py-3">
                {traditions.map((t) => {
                    const paa = valgte.includes(t.id);
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => velg(t.id)}
                            aria-pressed={paa}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                paa
                                    ? 'font-semibold'
                                    : 'border-slate-200 bg-white font-medium text-slate-600 hover:border-slate-300'
                            }`}
                            style={
                                paa
                                    ? {
                                          backgroundColor: `${t.color}22`,
                                          borderColor: t.color,
                                          color: lesbar(t.color),
                                      }
                                    : undefined
                            }
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            {/* Stoppene, som ogsa er kolonneoverskrifter */}
            <div className="grid grid-cols-4 gap-1.5 px-5 pt-4">
                {steps.map((s, i) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => setSteg(i)}
                        aria-current={i === steg}
                        className={`rounded-lg px-2 py-1.5 text-center text-xs font-semibold transition-colors sm:text-sm ${
                            i === steg
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {i + 1}. {s.label}
                    </button>
                ))}
            </div>

            {/* En reise per valgt tradisjon */}
            <div className="space-y-3 p-5">
                {synlige.map((t) => {
                    const tekstfarge = lesbar(t.color);
                    const stopp = t.stops?.[aktivtSteg.id];
                    const status: StoppStatus = stopp?.status ?? (stopp ? 'gjort' : 'ikke');
                    const spenn = stopp?.spanYears;
                    const bredde =
                        typeof spenn === 'number' && lengsteSpenn > 0
                            ? Math.max(2, (spenn / lengsteSpenn) * 100)
                            : 0;

                    return (
                        <div
                            key={t.id}
                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                            style={{ borderLeftWidth: '3px', borderLeftColor: t.color }}
                        >
                            <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                                <span className="text-sm font-bold" style={{ color: tekstfarge }}>
                                    {t.name}
                                </span>
                                {t.textName && (
                                    <span className="text-xs text-slate-500">{t.textName}</span>
                                )}
                            </div>

                            {/* Sporet med de fire stoppene */}
                            <div className="grid grid-cols-4">
                                {steps.map((s, i) => {
                                    const st = t.stops?.[s.id];
                                    const stStatus: StoppStatus =
                                        st?.status ?? (st ? 'gjort' : 'ikke');
                                    const Ikon = IKON[stStatus];
                                    const aktiv = i === steg;
                                    const fylt = stStatus === 'gjort';
                                    const grei = stStatus !== 'ikke';
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSteg(i)}
                                            aria-current={aktiv}
                                            aria-label={`${t.name}, ${s.label}: ${etiketter[stStatus]}`}
                                            className="group flex flex-col items-center gap-1 text-center"
                                        >
                                            <span className="flex w-full items-center">
                                                <span
                                                    className={`h-px flex-1 ${i === 0 ? 'bg-transparent' : 'bg-slate-300'}`}
                                                />
                                                <motion.span
                                                    animate={{ scale: aktiv ? 1.15 : 1 }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 320,
                                                        damping: 20,
                                                    }}
                                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                                                        grei ? '' : 'border-dashed'
                                                    } ${aktiv ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}
                                                    style={{
                                                        backgroundColor: fylt
                                                            ? tekstfarge
                                                            : '#ffffff',
                                                        borderColor: grei ? tekstfarge : '#cbd5e1',
                                                        color: fylt
                                                            ? '#ffffff'
                                                            : grei
                                                              ? tekstfarge
                                                              : '#94a3b8',
                                                    }}
                                                >
                                                    <Ikon
                                                        className="h-3.5 w-3.5"
                                                        aria-hidden="true"
                                                    />
                                                </motion.span>
                                                <span
                                                    className={`h-px flex-1 ${
                                                        i === steps.length - 1
                                                            ? 'bg-transparent'
                                                            : 'bg-slate-300'
                                                    }`}
                                                />
                                            </span>
                                            <span
                                                className={`px-1 text-[11px] leading-tight ${
                                                    aktiv
                                                        ? 'font-semibold text-slate-800'
                                                        : 'text-slate-500'
                                                }`}
                                            >
                                                {st?.when ?? '-'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Detaljen for det aktive stoppet */}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${t.id}-${aktivtSteg.id}`}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="mt-3 rounded-md border border-slate-200 bg-white p-3"
                                >
                                    <span
                                        className="mb-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold"
                                        style={{
                                            backgroundColor: `${t.color}1a`,
                                            color: tekstfarge,
                                        }}
                                    >
                                        {etiketter[status]}
                                    </span>
                                    <p className="text-sm text-slate-700">
                                        {stopp?.text ??
                                            'Denne tradisjonen går ikke gjennom dette stoppet i det hele tatt.'}
                                    </p>

                                    {(typeof spenn === 'number' || stopp?.spanLabel) && (
                                        <div className="mt-2.5">
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                {typeof spenn === 'number' ? (
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${bredde}%`,
                                                            backgroundColor: t.color,
                                                        }}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${bredde}%` }}
                                                        transition={{ duration: 0.4 }}
                                                    />
                                                ) : (
                                                    <div className="h-full w-full rounded-full border border-dashed border-slate-300 bg-slate-50" />
                                                )}
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {stopp?.spanLabel ?? `Omtrent ${spenn} år`}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>

            {/* Tegnforklaring */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200 bg-slate-50 px-5 py-3">
                {(Object.keys(STANDARD_STATUS) as StoppStatus[]).map((s) => {
                    const Ikon = IKON[s];
                    return (
                        <span key={s} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                                    s === 'ikke'
                                        ? 'border-dashed border-slate-300 text-slate-400'
                                        : 'border-slate-400 text-slate-600'
                                }`}
                            >
                                <Ikon className="h-2.5 w-2.5" aria-hidden="true" />
                            </span>
                            {etiketter[s]}
                        </span>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {note ?? `Stopp ${steg + 1} av ${steps.length}`} · {valgte.length} av maks{' '}
                    {maxVisible} tradisjoner
                </span>
                <button
                    type="button"
                    onClick={() => {
                        setValgte(startvalg);
                        setSteg(0);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
