import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    HelpCircle,
    Scale,
    ShieldAlert,
    Flame,
    CheckCircle2,
    ArrowRight,
    Users,
    Target,
} from 'lucide-react';

// Signaturkomponent for oversikten «Historiens store gåter».
// Lyspære: historie er ikke én fasit. Eleven ser gåtene plassert på en
// epokeinndelt tidslinje, filtrerer på HVILKEN SLAGS strid det er (uløst
// mysterium, faglig uenighet, ekte-vs-uekte, betent), og klikker seg inn på
// hver gåte. Komponenten er både det interaktive elementet OG navigasjonen
// videre til hver enkelt gåte-artikkel.

type GaateType = 'ulost' | 'faglig' | 'pseudo' | 'betent' | 'lost';

interface Gaate {
    id: string;
    title: string;
    epoch: string;
    year: number;
    displayYear: string;
    type: GaateType;
    hook: string;
    stake: string;
    disagree: string;
    href: string;
}

interface GaatekartProps {
    title?: string;
    intro?: string;
    mysteries: Gaate[];
}

const TYPE_META: Record<
    GaateType,
    { label: string; Icon: typeof HelpCircle; dot: string; chip: string; panel: string; text: string }
> = {
    ulost: {
        label: 'Uløst mysterium',
        Icon: HelpCircle,
        dot: 'bg-amber-500 ring-amber-200',
        chip: 'bg-amber-100 text-amber-800 border-amber-200',
        panel: 'border-amber-200 bg-amber-50',
        text: 'text-amber-700',
    },
    faglig: {
        label: 'Faglig uenighet',
        Icon: Scale,
        dot: 'bg-sky-500 ring-sky-200',
        chip: 'bg-sky-100 text-sky-800 border-sky-200',
        panel: 'border-sky-200 bg-sky-50',
        text: 'text-sky-700',
    },
    pseudo: {
        label: 'Ekte eller uekte?',
        Icon: ShieldAlert,
        dot: 'bg-rose-500 ring-rose-200',
        chip: 'bg-rose-100 text-rose-800 border-rose-200',
        panel: 'border-rose-200 bg-rose-50',
        text: 'text-rose-700',
    },
    betent: {
        label: 'Betent strid',
        Icon: Flame,
        dot: 'bg-violet-500 ring-violet-200',
        chip: 'bg-violet-100 text-violet-800 border-violet-200',
        panel: 'border-violet-200 bg-violet-50',
        text: 'text-violet-700',
    },
    lost: {
        label: 'Gåten som ble løst',
        Icon: CheckCircle2,
        dot: 'bg-emerald-500 ring-emerald-200',
        chip: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        panel: 'border-emerald-200 bg-emerald-50',
        text: 'text-emerald-700',
    },
};

const EPOCH_ORDER = ['Oldtid', 'Antikken', 'Middelalder', 'Nyere tid'];

export function Gaatekart({ title, intro, mysteries }: GaatekartProps) {
    const [filter, setFilter] = useState<GaateType | 'alle'>('alle');
    const [selectedId, setSelectedId] = useState<string>(mysteries[0]?.id ?? '');

    const types = useMemo(
        () => Array.from(new Set(mysteries.map((m) => m.type))) as GaateType[],
        [mysteries]
    );

    const epochs = useMemo(() => {
        const groups: Record<string, Gaate[]> = {};
        for (const m of mysteries) {
            (groups[m.epoch] ??= []).push(m);
        }
        for (const key of Object.keys(groups)) {
            groups[key].sort((a, b) => a.year - b.year);
        }
        return EPOCH_ORDER.filter((e) => groups[e]).map((e) => ({ epoch: e, items: groups[e] }));
    }, [mysteries]);

    const selected = mysteries.find((m) => m.id === selectedId) ?? mysteries[0];
    const isDimmed = (m: Gaate) => filter !== 'alle' && m.type !== filter;

    return (
        <div className="my-8 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm sm:p-6">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Interaktivt gåtekart
            </div>
            <h3 className="text-xl font-bold text-slate-800 sm:text-2xl">
                {title ?? 'Historiens store gåter'}
            </h3>
            {intro && <p className="mt-1 max-w-2xl text-sm text-slate-600">{intro}</p>}

            {/* Filter-chips */}
            <div className="mt-4 flex flex-wrap gap-2">
                <FilterChip active={filter === 'alle'} onClick={() => setFilter('alle')}>
                    Vis alle
                </FilterChip>
                {(['ulost', 'faglig', 'pseudo', 'betent', 'lost'] as GaateType[])
                    .filter((t) => types.includes(t))
                    .map((t) => {
                        const meta = TYPE_META[t];
                        const Icon = meta.Icon;
                        return (
                            <FilterChip
                                key={t}
                                active={filter === t}
                                onClick={() => setFilter(filter === t ? 'alle' : t)}
                                className={filter === t ? meta.chip : ''}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {meta.label}
                            </FilterChip>
                        );
                    })}
            </div>

            {/* Epoke-baner med gåte-prikker */}
            <div className="mt-5 space-y-4">
                {epochs.map(({ epoch, items }) => (
                    <div key={epoch} className="flex items-center gap-3">
                        <div className="w-20 shrink-0 text-right text-xs font-bold uppercase tracking-wide text-slate-500 sm:w-24 sm:text-sm">
                            {epoch}
                        </div>
                        <div className="relative flex flex-1 items-center gap-2 sm:gap-3">
                            <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
                            {items.map((m) => {
                                const meta = TYPE_META[m.type];
                                const active = m.id === selectedId;
                                return (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedId(m.id)}
                                        title={m.title}
                                        className="group relative z-10 flex flex-col items-center focus:outline-none"
                                        style={{ opacity: isDimmed(m) ? 0.28 : 1 }}
                                    >
                                        <motion.span
                                            layout
                                            animate={{ scale: active ? 1.5 : 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                            className={`block h-3.5 w-3.5 rounded-full ring-4 ${meta.dot} ${
                                                active ? 'ring-offset-1' : ''
                                            }`}
                                        />
                                        <span className="mt-1 hidden text-[10px] leading-none text-slate-400 sm:block">
                                            {m.displayYear}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Detaljpanel for valgt gåte */}
            <AnimatePresence mode="wait">
                {selected && (
                    <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className={`mt-5 rounded-xl border p-4 sm:p-5 ${TYPE_META[selected.type].panel}`}
                    >
                        <div className="flex flex-wrap items-center gap-2">
                            <TypeBadge type={selected.type} />
                            <span className="text-xs font-semibold text-slate-500">
                                {selected.displayYear}
                            </span>
                        </div>
                        <h4 className="mt-2 text-lg font-bold text-slate-800">{selected.title}</h4>
                        <p className="mt-1 text-sm italic text-slate-600">{selected.hook}</p>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-lg bg-white/70 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <Target className="h-3.5 w-3.5" /> Hva står på spill
                                </div>
                                <p className="mt-1 text-sm text-slate-700">{selected.stake}</p>
                            </div>
                            <div className="rounded-lg bg-white/70 p-3">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                                    <Users className="h-3.5 w-3.5" /> Hvem er uenige
                                </div>
                                <p className="mt-1 text-sm text-slate-700">{selected.disagree}</p>
                            </div>
                        </div>

                        <Link
                            to={selected.href}
                            className={`mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-900`}
                        >
                            Utforsk gåten
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FilterChip({
    active,
    onClick,
    children,
    className = '',
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                    ? className || 'border-slate-800 bg-slate-800 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
        >
            {children}
        </button>
    );
}

function TypeBadge({ type }: { type: GaateType }) {
    const meta = TYPE_META[type];
    const Icon = meta.Icon;
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${meta.chip}`}
        >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
        </span>
    );
}

export default Gaatekart;
