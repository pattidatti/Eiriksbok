import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Check, X, HelpCircle, Minus, RotateCcw } from 'lucide-react';

// Matbordets regler: et dekket bord der hver matvare merkes for de tradisjonene
// eleven har valgt.
//
// Lyspære-øyeblikket: den samme biffen kan være tillatt ett sted, forbudt et
// annet og omdiskutert et tredje. Kategorien «omdiskutert» er poenget - den
// viser at reglene ikke alltid er entydige, og at folk innenfor samme tradisjon
// er uenige.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface Gruppe {
    id: string;
    label: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
}

interface Dom {
    status: string;
    why?: string;
}

interface Rett {
    id: string;
    name: string;
    hint?: string;
    verdicts?: Record<string, Dom>;
}

interface StatusOppsett {
    label?: string;
}

interface MatbordetsReglerProps {
    title?: string;
    intro?: string;
    note?: string;
    tableLabel?: string;
    groups?: Gruppe[];
    traditions?: Tradisjon[];
    dishes?: Rett[];
    statuses?: Record<string, StatusOppsett>;
    defaultSelection?: string[];
    defaultDish?: string;
    maxVisible?: number;
}

// Rent visuelle valg. Ingen religionsdata her.
const STIL: Record<string, { boks: string; merke: string; glyf: typeof Check }> = {
    tillatt: {
        boks: 'border-emerald-200 bg-emerald-50',
        merke: 'bg-emerald-100 text-emerald-800',
        glyf: Check,
    },
    forbudt: {
        boks: 'border-rose-200 bg-rose-50',
        merke: 'bg-rose-100 text-rose-800',
        glyf: X,
    },
    omdiskutert: {
        boks: 'border-amber-200 bg-amber-50',
        merke: 'bg-amber-100 text-amber-900',
        glyf: HelpCircle,
    },
};

const NOYTRAL = {
    boks: 'border-slate-200 bg-slate-50',
    merke: 'bg-slate-200 text-slate-700',
    glyf: Minus,
};

function stilFor(status: string | undefined) {
    return (status && STIL[status]) || NOYTRAL;
}

export function MatbordetsRegler({
    title = 'Matbordets regler',
    intro = 'Velg tradisjoner, og se hvordan maten på bordet merkes.',
    note,
    tableLabel = 'Bordet',
    groups = [],
    traditions = [],
    dishes = [],
    statuses = {},
    defaultSelection = [],
    defaultDish,
    maxVisible = 3,
}: MatbordetsReglerProps) {
    const start = defaultSelection.length
        ? defaultSelection.slice(0, maxVisible)
        : traditions.slice(0, maxVisible).map((t) => t.id);
    const startRett = defaultDish ?? dishes[0]?.id ?? '';

    const [valgte, setValgte] = useState<string[]>(start);
    const [aktivRett, setAktivRett] = useState<string>(startRett);

    const synlige = useMemo(
        () =>
            valgte.map((id) => traditions.find((t) => t.id === id)).filter(Boolean) as Tradisjon[],
        [valgte, traditions]
    );

    const grupper = useMemo<Gruppe[]>(() => {
        if (groups.length) return groups;
        const sett: string[] = [];
        traditions.forEach((t) => {
            if (t.group && !sett.includes(t.group)) sett.push(t.group);
        });
        return sett.map((id) => ({ id, label: id }));
    }, [groups, traditions]);

    const rett = useMemo(
        () => dishes.find((d) => d.id === aktivRett) ?? dishes[0],
        [dishes, aktivRett]
    );

    if (!dishes.length || !traditions.length || !rett) return null;

    const merkelapp = (status: string | undefined) => {
        if (!status) return 'Ingen egen regel';
        return statuses[status]?.label ?? status;
    };

    const veksle = (id: string) => {
        setValgte((v) => {
            if (v.includes(id)) return v.length > 1 ? v.filter((x) => x !== id) : v;
            return v.length >= maxVisible ? [...v.slice(1), id] : [...v, id];
        });
    };

    const tilbakestill = () => {
        setValgte(start);
        setAktivRett(startRett);
    };

    const brukteStatuser = Object.keys(statuses);

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-amber-100 p-2 text-amber-700">
                    <Utensils className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            {/* Velger, gruppert slik at ulike størrelser ikke blir ni like kolonner */}
            <div className="space-y-2 border-b border-slate-200 px-5 py-3">
                {grupper.map((g) => (
                    <div key={g.id} className="flex flex-wrap items-center gap-2">
                        <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-40">
                            {g.label}
                        </span>
                        {traditions
                            .filter((t) => t.group === g.id)
                            .map((t) => {
                                const med = valgte.includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => veksle(t.id)}
                                        aria-pressed={med}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                            med
                                                ? 'border-transparent text-white'
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                        }`}
                                        style={med ? { backgroundColor: t.color } : undefined}
                                    >
                                        {t.name}
                                    </button>
                                );
                            })}
                    </div>
                ))}
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_300px]">
                {/* Bordet */}
                <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-3">
                    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800/80">
                        {tableLabel}
                    </p>
                    <div className="grid items-start gap-2 sm:grid-cols-2">
                        {dishes.map((d) => {
                            const erValgt = d.id === rett.id;
                            return (
                                <button
                                    key={d.id}
                                    type="button"
                                    onClick={() => setAktivRett(d.id)}
                                    aria-pressed={erValgt}
                                    className={`rounded-lg border bg-white p-2 text-left transition-shadow ${
                                        erValgt
                                            ? 'border-slate-400 shadow-sm'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="block text-sm font-semibold text-slate-900">
                                        {d.name}
                                    </span>
                                    {d.hint && (
                                        <span className="block text-[11px] text-slate-500">
                                            {d.hint}
                                        </span>
                                    )}
                                    <span className="mt-1.5 flex flex-wrap gap-1">
                                        {synlige.map((t) => {
                                            const dom = d.verdicts?.[t.id];
                                            const stil = stilFor(dom?.status);
                                            const Glyf = stil.glyf;
                                            return (
                                                <motion.span
                                                    key={`${d.id}-${t.id}-${dom?.status ?? 'na'}`}
                                                    initial={{ opacity: 0, scale: 0.85 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 320,
                                                        damping: 22,
                                                    }}
                                                    title={`${t.name}: ${merkelapp(dom?.status)}`}
                                                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${stil.boks}`}
                                                    style={{ color: t.color }}
                                                >
                                                    <Glyf
                                                        className="h-3 w-3 shrink-0"
                                                        aria-hidden="true"
                                                    />
                                                    {t.name}
                                                </motion.span>
                                            );
                                        })}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Begrunnelsene for den valgte matvaren */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {rett.name}
                    </p>
                    <div className="space-y-2">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={rett.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="space-y-2"
                            >
                                {synlige.map((t) => {
                                    const dom = rett.verdicts?.[t.id];
                                    const stil = stilFor(dom?.status);
                                    const Glyf = stil.glyf;
                                    return (
                                        <div
                                            key={t.id}
                                            className={`rounded-lg border p-3 ${stil.boks}`}
                                            style={{
                                                borderLeftWidth: '4px',
                                                borderLeftColor: t.color,
                                            }}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="text-xs font-bold"
                                                    style={{ color: t.color }}
                                                >
                                                    {t.name}
                                                </span>
                                                <span
                                                    className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stil.merke}`}
                                                >
                                                    <Glyf className="h-3 w-3" aria-hidden="true" />
                                                    {merkelapp(dom?.status)}
                                                </span>
                                            </span>
                                            <p className="mt-1 text-sm leading-snug text-slate-700">
                                                {dom?.why ?? 'Ingen egen regel om denne maten.'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {brukteStatuser.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50 px-5 py-2.5">
                    {brukteStatuser.map((s) => {
                        const stil = stilFor(s);
                        const Glyf = stil.glyf;
                        return (
                            <span
                                key={s}
                                className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"
                            >
                                <span
                                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${stil.merke}`}
                                >
                                    <Glyf className="h-2.5 w-2.5" aria-hidden="true" />
                                </span>
                                {statuses[s]?.label ?? s}
                            </span>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-2.5">
                <span className="text-xs text-slate-500">
                    {note ?? `Velg inntil ${maxVisible} tradisjoner om gangen.`}
                </span>
                <button
                    type="button"
                    onClick={tilbakestill}
                    className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
