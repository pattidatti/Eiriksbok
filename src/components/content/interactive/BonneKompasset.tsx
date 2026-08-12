import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, RotateCcw } from 'lucide-react';

// Bønnekompasset: fire konsentriske ringer - retning, tid, kropp, ord.
//
// Lyspære-øyeblikket: bønn ser lik ut overalt, men de fire ringene viser hvor
// ulikt den er bygget. En heltrukket ring betyr at formen ligger fast for alle,
// en stiplet ring betyr at den enkelte velger selv. Når eleven bytter tradisjon,
// stiller ringene seg inn på nytt, og nåla på ytterringen snur seg.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface Ring {
    id: string;
    label: string;
    question?: string;
}

interface Gruppe {
    id: string;
    label: string;
}

interface Tradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
    // 'fast' | 'begge' | 'fri' per ring-id
    fast?: Record<string, string>;
    retningVinkel?: number;
    retningKort?: string;
    tidAntall?: number;
    [key: string]: unknown;
}

interface BonneKompassetProps {
    title?: string;
    intro?: string;
    rings?: Ring[];
    groups?: Gruppe[];
    traditions?: Tradisjon[];
    defaultSelection?: string[];
    maxVisible?: number;
    legend?: { fast?: string; begge?: string; fri?: string };
    note?: string;
}

const SENTER = 110;
const YTRE_RADIUS = 96;
const SPENN = 66;

function strekFor(tilstand: string | undefined): string | undefined {
    if (tilstand === 'fast') return undefined;
    if (tilstand === 'begge') return '14 8';
    return '2 7';
}

function merkeFor(
    tilstand: string | undefined,
    legend: Required<BonneKompassetProps>['legend']
): string {
    if (tilstand === 'fast') return legend.fast ?? 'Fast form';
    if (tilstand === 'begge') return legend.begge ?? 'Litt av begge';
    return legend.fri ?? 'Fri form';
}

export function BonneKompasset({
    title = 'Bønnekompasset',
    intro = 'Velg en tradisjon, og se hvordan de fire ringene stiller seg inn.',
    rings = [],
    groups = [],
    traditions = [],
    defaultSelection = [],
    maxVisible = 3,
    legend = {},
    note,
}: BonneKompassetProps) {
    const start = defaultSelection.length
        ? defaultSelection.slice(0, maxVisible)
        : traditions.slice(0, maxVisible).map((t) => t.id);

    const [valgte, setValgte] = useState<string[]>(start);
    const [aktivId, setAktivId] = useState<string>(start[0] ?? '');
    const [aktivRing, setAktivRing] = useState<string>(rings[0]?.id ?? '');

    const aktiv = useMemo(
        () => traditions.find((t) => t.id === aktivId) ?? traditions[0],
        [traditions, aktivId]
    );

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

    if (!rings.length || !traditions.length || !aktiv) return null;

    const velg = (id: string) => {
        setAktivId(id);
        setValgte((v) => {
            if (v.includes(id)) return v;
            return v.length >= maxVisible ? [...v.slice(1), id] : [...v, id];
        });
    };

    const tilbakestill = () => {
        setValgte(start);
        setAktivId(start[0] ?? '');
        setAktivRing(rings[0]?.id ?? '');
    };

    const tekstFor = (t: Tradisjon, ringId: string): string => {
        const verdi = t[ringId];
        return typeof verdi === 'string' ? verdi : '';
    };

    const valgtRing = rings.find((r) => r.id === aktivRing) ?? rings[0];
    const antallRinger = rings.length;
    const vinkel = typeof aktiv.retningVinkel === 'number' ? aktiv.retningVinkel : null;
    const tidIndeks = rings.findIndex((r) => r.id === 'tid');
    const prikker =
        tidIndeks >= 0 && typeof aktiv.tidAntall === 'number' ? Math.min(aktiv.tidAntall, 12) : 0;
    const tidRadius =
        YTRE_RADIUS - Math.max(tidIndeks, 0) * (antallRinger > 1 ? SPENN / (antallRinger - 1) : 0);

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-sky-100 p-2 text-sky-700">
                    <Compass className="h-4 w-4" aria-hidden="true" />
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
                        <span className="w-full text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:w-36">
                            {g.label}
                        </span>
                        {traditions
                            .filter((t) => t.group === g.id)
                            .map((t) => {
                                const erValgt = t.id === aktiv.id;
                                const med = valgte.includes(t.id);
                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => velg(t.id)}
                                        aria-pressed={erValgt}
                                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                            erValgt
                                                ? 'border-transparent text-white'
                                                : med
                                                  ? 'bg-white text-slate-700'
                                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                        }`}
                                        style={
                                            erValgt
                                                ? { backgroundColor: t.color }
                                                : med
                                                  ? { borderColor: t.color }
                                                  : undefined
                                        }
                                    >
                                        {t.name}
                                    </button>
                                );
                            })}
                    </div>
                ))}
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-[220px_1fr]">
                {/* Kompasset */}
                <div>
                    <svg viewBox="0 0 220 220" role="img" className="w-full max-w-[220px]">
                        <title>
                            {`Kompass for ${aktiv.name}: ${rings.map((r) => r.label).join(', ')}`}
                        </title>
                        {rings.map((r, i) => {
                            const radius =
                                YTRE_RADIUS -
                                i * (antallRinger > 1 ? SPENN / (antallRinger - 1) : 0);
                            const erValgt = r.id === valgtRing.id;
                            const tilstand = aktiv.fast?.[r.id];
                            return (
                                <g key={r.id}>
                                    <motion.circle
                                        cx={SENTER}
                                        cy={SENTER}
                                        r={radius}
                                        fill="none"
                                        stroke={aktiv.color}
                                        strokeLinecap="round"
                                        strokeDasharray={strekFor(tilstand)}
                                        // Attributtet settes direkte i tillegg til animate, slik at
                                        // ringene har riktig tykkelse allerede før første animasjon.
                                        strokeWidth={erValgt ? 9 : 5}
                                        opacity={erValgt ? 1 : 0.4}
                                        initial={false}
                                        animate={{
                                            strokeWidth: erValgt ? 9 : 5,
                                            opacity: erValgt ? 1 : 0.4,
                                        }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                                    />
                                    <rect
                                        x={SENTER - (r.label.length * 5.2 + 10) / 2}
                                        y={SENTER - radius - 7}
                                        width={r.label.length * 5.2 + 10}
                                        height={14}
                                        rx={7}
                                        fill="#ffffff"
                                    />
                                    <text
                                        x={SENTER}
                                        y={SENTER - radius + 3}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fontWeight={erValgt ? 700 : 500}
                                        fill={erValgt ? aktiv.color : '#64748b'}
                                    >
                                        {r.label}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Faste tider som punkter på tid-ringen. Et halvt steg forskyvning gjør
                            at ingen prikk legger seg oppå «Tid»-etiketten rett over sentrum. */}
                        {Array.from({ length: prikker }).map((_, i) => {
                            const steg = 360 / Math.max(prikker, 1);
                            const grad = -90 + steg / 2 + i * steg;
                            const rad = (grad * Math.PI) / 180;
                            const cx = SENTER + tidRadius * Math.cos(rad);
                            const cy = SENTER + tidRadius * Math.sin(rad);
                            return (
                                <motion.circle
                                    key={`tid-${aktiv.id}-${i}`}
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill={aktiv.color}
                                    initial={{ opacity: 0, scale: 0.4 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: 0.05 * i,
                                        type: 'spring',
                                        stiffness: 320,
                                        damping: 20,
                                    }}
                                />
                            );
                        })}

                        {/* Nåla på ytterringen */}
                        {vinkel !== null && (
                            <motion.g
                                initial={false}
                                animate={{ rotate: vinkel }}
                                transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                                style={{ transformOrigin: '110px 110px', transformBox: 'view-box' }}
                            >
                                <line
                                    x1={SENTER}
                                    y1={SENTER}
                                    x2={SENTER}
                                    y2={SENTER - YTRE_RADIUS}
                                    stroke={aktiv.color}
                                    strokeWidth={3}
                                    strokeLinecap="round"
                                />
                                <circle
                                    cx={SENTER}
                                    cy={SENTER - YTRE_RADIUS}
                                    r={6}
                                    fill={aktiv.color}
                                />
                            </motion.g>
                        )}

                        <circle cx={SENTER} cy={SENTER} r={5} fill={aktiv.color} />
                    </svg>

                    <p
                        className="mt-2 text-center text-xs font-semibold"
                        style={{ color: aktiv.color }}
                    >
                        {aktiv.name}
                    </p>
                    <p className="mt-1 text-center text-xs text-slate-500">
                        {vinkel !== null
                            ? (aktiv.retningKort ?? 'Fast retning')
                            : 'Ingen retning på kartet'}
                    </p>

                    <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
                        <li className="flex items-center gap-2">
                            <span
                                className="h-0 w-6 border-t-[3px] border-slate-400"
                                aria-hidden="true"
                            />
                            {legend.fast ?? 'Fast form'}
                        </li>
                        <li className="flex items-center gap-2">
                            <span
                                className="h-0 w-6 border-t-[3px] border-dashed border-slate-400"
                                aria-hidden="true"
                            />
                            {legend.begge ?? 'Litt av begge'}
                        </li>
                        <li className="flex items-center gap-2">
                            <span
                                className="h-0 w-6 border-t-[3px] border-dotted border-slate-400"
                                aria-hidden="true"
                            />
                            {legend.fri ?? 'Fri form'}
                        </li>
                    </ul>
                </div>

                {/* De fire ringene i tekst - lesbare uten at noen klikker */}
                <div className="space-y-2">
                    {rings.map((r) => {
                        const erValgt = r.id === valgtRing.id;
                        return (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setAktivRing(r.id)}
                                aria-current={erValgt}
                                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                    erValgt
                                        ? 'border-slate-300 bg-slate-50'
                                        : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                            >
                                <span className="flex flex-wrap items-baseline gap-x-2">
                                    <span className="text-sm font-semibold text-slate-900">
                                        {r.label}
                                    </span>
                                    {r.question && (
                                        <span className="text-xs text-slate-500">{r.question}</span>
                                    )}
                                    <span
                                        className="ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                        style={{
                                            backgroundColor: `${aktiv.color}1a`,
                                            color: aktiv.color,
                                        }}
                                    >
                                        {merkeFor(aktiv.fast?.[r.id], legend)}
                                    </span>
                                </span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={`${aktiv.id}-${r.id}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="mt-1 block text-sm text-slate-700"
                                    >
                                        {tekstFor(aktiv, r.id) || 'Ingen opplysning her.'}
                                    </motion.span>
                                </AnimatePresence>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sammenligning: en ring om gangen, maks tre tradisjoner */}
            {synlige.length > 1 && (
                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {valgtRing.label} hos {synlige.length} tradisjoner
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {synlige.map((t) => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setAktivId(t.id)}
                                aria-pressed={t.id === aktiv.id}
                                className={`rounded-lg border bg-white p-3 text-left transition-shadow ${
                                    t.id === aktiv.id ? 'shadow-sm' : 'hover:shadow-sm'
                                }`}
                                style={{ borderTopWidth: '3px', borderTopColor: t.color }}
                            >
                                <span className="text-xs font-semibold" style={{ color: t.color }}>
                                    {t.name}
                                </span>
                                <span className="mt-1 block text-sm text-slate-700">
                                    {tekstFor(t, valgtRing.id) || 'Ingen opplysning her.'}
                                </span>
                            </button>
                        ))}
                    </div>
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
