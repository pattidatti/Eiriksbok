import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownRight, Repeat, RotateCcw, Route } from 'lucide-react';

// Etterlivskartet: to former for det som kommer etter døden, side om side.
//
// Lyspære-øyeblikket: eleven ser at den ene veien er en linje som ender i et
// oppgjør, mens den andre er en ring som ikke ender i det hele tatt. Formen på
// etterlivet følger formen på tiden. Utgangen av ringen ligger utenfor ringen,
// og det er nettopp poenget.
//
// All religionsdata kommer fra props. Ingenting er hardkodet her.

const RING = 224;
const RADIUS = 70;
const SENTER = RING / 2;

interface EtterlivNode {
    id: string;
    label: string;
    text?: string;
    exit?: boolean;
}

interface EtterlivTradisjon {
    id: string;
    name: string;
    color: string;
    group?: string;
    notes?: Record<string, string | undefined>;
}

interface EtterlivPath {
    id: string;
    name: string;
    shape?: string;
    summary?: string;
    loopLabel?: string;
    nodes?: EtterlivNode[];
    traditions?: EtterlivTradisjon[];
}

interface EtterlivsKartetProps {
    title?: string;
    intro?: string;
    footnote?: string;
    paths?: EtterlivPath[];
}

interface KlarPath {
    id: string;
    name: string;
    syklisk: boolean;
    summary?: string;
    loopLabel?: string;
    nodes: EtterlivNode[];
    traditions: EtterlivTradisjon[];
}

function ringPosisjon(indeks: number, antall: number) {
    const vinkel = -Math.PI / 2 + (indeks * 2 * Math.PI) / Math.max(antall, 1);
    return {
        x: SENTER + RADIUS * Math.cos(vinkel),
        y: SENTER + RADIUS * Math.sin(vinkel),
    };
}

export function EtterlivsKartet({
    title = 'Etterlivskartet',
    intro = 'To former for det som kommer etter. Velg et punkt på hver vei, og bytt tradisjon.',
    footnote,
    paths = [],
}: EtterlivsKartetProps) {
    const veier = useMemo<KlarPath[]>(
        () =>
            paths
                .filter((p) => Array.isArray(p.nodes) && p.nodes.length > 0)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    syklisk: p.shape === 'cyclic',
                    summary: p.summary,
                    loopLabel: p.loopLabel,
                    nodes: p.nodes ?? [],
                    traditions: p.traditions ?? [],
                })),
        [paths]
    );

    const startNode = useMemo(
        () => Object.fromEntries(veier.map((v) => [v.id, v.nodes[0].id])),
        [veier]
    );
    const startTradisjon = useMemo(
        () =>
            Object.fromEntries(
                veier.filter((v) => v.traditions.length > 0).map((v) => [v.id, v.traditions[0].id])
            ),
        [veier]
    );

    const [valgtNode, setValgtNode] = useState<Record<string, string>>(startNode);
    const [valgtTradisjon, setValgtTradisjon] = useState<Record<string, string>>(startTradisjon);

    if (veier.length === 0) return null;

    const nullstill = () => {
        setValgtNode(startNode);
        setValgtTradisjon(startTradisjon);
    };

    return (
        <div className="my-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
                <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700">
                    <Route className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                    <h3 className="font-display text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-600">{intro}</p>
                </div>
            </div>

            <div className="grid gap-px bg-slate-200 md:grid-cols-2">
                {veier.map((vei) => {
                    const nodeId = valgtNode[vei.id] ?? vei.nodes[0].id;
                    const node = vei.nodes.find((n) => n.id === nodeId) ?? vei.nodes[0];
                    const tradisjon = vei.traditions.find((t) => t.id === valgtTradisjon[vei.id]);
                    const farge = tradisjon?.color ?? '#475569';
                    const notat = tradisjon?.notes?.[node.id];
                    const ringNoder = vei.nodes.filter((n) => !n.exit);
                    const utgang = vei.nodes.find((n) => n.exit);
                    // -1 betyr at utgangen er valgt. Da ligger den aktive noden utenfor
                    // ringen, og markøren på ringen skal ikke vises i det hele tatt.
                    const aktivIndeks = ringNoder.findIndex((n) => n.id === node.id);
                    const aktivPos = ringPosisjon(Math.max(aktivIndeks, 0), ringNoder.length);

                    // Grupper velgeren, slik at ulike størrelser ikke stilles opp som likeverdige.
                    const grupper: { navn: string; medlemmer: EtterlivTradisjon[] }[] = [];
                    vei.traditions.forEach((t) => {
                        const navn = t.group ?? '';
                        const funnet = grupper.find((g) => g.navn === navn);
                        if (funnet) funnet.medlemmer.push(t);
                        else grupper.push({ navn, medlemmer: [t] });
                    });

                    return (
                        <div key={vei.id} className="bg-white p-5">
                            <div className="mb-3 flex items-center gap-2">
                                {vei.syklisk ? (
                                    <Repeat className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                ) : (
                                    <CornerDownRight
                                        className="h-4 w-4 text-slate-400"
                                        aria-hidden="true"
                                    />
                                )}
                                <h4 className="font-display text-base font-bold text-slate-900">
                                    {vei.name}
                                </h4>
                            </div>
                            {vei.summary ? (
                                <p className="mb-3 text-sm text-slate-600">{vei.summary}</p>
                            ) : null}

                            {/* Velger */}
                            <div className="mb-4 space-y-2">
                                {grupper.map((gruppe) => (
                                    <div key={gruppe.navn || vei.id}>
                                        {gruppe.navn ? (
                                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                                {gruppe.navn}
                                            </span>
                                        ) : null}
                                        <div className="flex flex-wrap gap-1.5">
                                            {gruppe.medlemmer.map((t) => {
                                                const paa = t.id === tradisjon?.id;
                                                return (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        aria-pressed={paa}
                                                        onClick={() =>
                                                            setValgtTradisjon((v) => ({
                                                                ...v,
                                                                [vei.id]: t.id,
                                                            }))
                                                        }
                                                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                                            paa
                                                                ? 'border-transparent text-white'
                                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                                        }`}
                                                        style={
                                                            paa
                                                                ? { backgroundColor: t.color }
                                                                : undefined
                                                        }
                                                    >
                                                        {t.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Formen */}
                            {vei.syklisk ? (
                                <div className="flex flex-col items-center">
                                    <div
                                        className="relative"
                                        style={{ width: RING, height: RING, maxWidth: '100%' }}
                                    >
                                        <svg
                                            viewBox={`0 0 ${RING} ${RING}`}
                                            className="h-full w-full"
                                            aria-hidden="true"
                                        >
                                            <circle
                                                cx={SENTER}
                                                cy={SENTER}
                                                r={RADIUS}
                                                fill="none"
                                                stroke="#e2e8f0"
                                                strokeWidth={10}
                                            />
                                            {aktivIndeks >= 0 ? (
                                                <motion.circle
                                                    cx={aktivPos.x}
                                                    cy={aktivPos.y}
                                                    r={13}
                                                    fill={farge}
                                                    opacity={0.22}
                                                    initial={false}
                                                    animate={{
                                                        cx: aktivPos.x,
                                                        cy: aktivPos.y,
                                                        r: 13,
                                                    }}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 180,
                                                        damping: 20,
                                                    }}
                                                />
                                            ) : null}
                                        </svg>
                                        <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <Repeat
                                                className="h-5 w-5 text-slate-300"
                                                aria-hidden="true"
                                            />
                                            {vei.loopLabel ? (
                                                <span className="mt-1 text-[11px] font-medium text-slate-400">
                                                    {vei.loopLabel}
                                                </span>
                                            ) : null}
                                        </span>
                                        {ringNoder.map((n, i) => {
                                            const pos = ringPosisjon(i, ringNoder.length);
                                            const paa = n.id === node.id;
                                            return (
                                                <button
                                                    key={n.id}
                                                    type="button"
                                                    aria-pressed={paa}
                                                    onClick={() =>
                                                        setValgtNode((v) => ({
                                                            ...v,
                                                            [vei.id]: n.id,
                                                        }))
                                                    }
                                                    className={`absolute max-w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[11px] font-semibold leading-tight transition-colors ${
                                                        paa
                                                            ? 'border-transparent text-white shadow'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                                    }`}
                                                    style={{
                                                        left: `${(pos.x / RING) * 100}%`,
                                                        top: `${(pos.y / RING) * 100}%`,
                                                        backgroundColor: paa ? farge : undefined,
                                                    }}
                                                >
                                                    {n.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {utgang ? (
                                        <>
                                            <span
                                                className="my-1 block h-6 border-l-2 border-dashed border-slate-300"
                                                aria-hidden="true"
                                            />
                                            <button
                                                type="button"
                                                aria-pressed={utgang.id === node.id}
                                                onClick={() =>
                                                    setValgtNode((v) => ({
                                                        ...v,
                                                        [vei.id]: utgang.id,
                                                    }))
                                                }
                                                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                    utgang.id === node.id
                                                        ? 'border-transparent text-white shadow'
                                                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                                                }`}
                                                style={{
                                                    backgroundColor:
                                                        utgang.id === node.id ? farge : undefined,
                                                }}
                                            >
                                                {utgang.label}
                                            </button>
                                        </>
                                    ) : null}
                                </div>
                            ) : (
                                <ol className="space-y-0">
                                    {vei.nodes.map((n, i) => {
                                        const paa = n.id === node.id;
                                        return (
                                            <li key={n.id}>
                                                <button
                                                    type="button"
                                                    aria-pressed={paa}
                                                    onClick={() =>
                                                        setValgtNode((v) => ({
                                                            ...v,
                                                            [vei.id]: n.id,
                                                        }))
                                                    }
                                                    className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                                                        paa
                                                            ? 'border-transparent text-white shadow'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                                                    }`}
                                                    style={{
                                                        backgroundColor: paa ? farge : undefined,
                                                    }}
                                                >
                                                    <span
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                                                            paa
                                                                ? 'bg-white/25 text-white'
                                                                : 'bg-slate-100 text-slate-500'
                                                        }`}
                                                    >
                                                        {i + 1}
                                                    </span>
                                                    {n.label}
                                                </button>
                                                {i < vei.nodes.length - 1 ? (
                                                    <span
                                                        className="ml-[22px] block h-4 border-l-2 border-slate-200"
                                                        aria-hidden="true"
                                                    />
                                                ) : null}
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}

                            {/* Teksten */}
                            <div className="mt-4 min-h-[150px] rounded-lg bg-slate-50 p-3">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${vei.id}-${node.id}-${tradisjon?.id ?? 'ingen'}`}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                    >
                                        <span
                                            className="mb-1 block text-xs font-semibold"
                                            style={{ color: farge }}
                                        >
                                            {node.label}
                                        </span>
                                        <p className="text-sm text-slate-700">{node.text}</p>
                                        {tradisjon ? (
                                            <div
                                                className="mt-2.5 border-l-4 pl-2.5"
                                                style={{ borderLeftColor: farge }}
                                            >
                                                <span className="block text-xs font-semibold text-slate-800">
                                                    {tradisjon.name}
                                                </span>
                                                <p className="text-sm text-slate-600">
                                                    {notat ??
                                                        'Denne tradisjonen sier ikke noe eget om akkurat dette punktet.'}
                                                </p>
                                            </div>
                                        ) : null}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
                <p className="text-xs text-slate-500">
                    {footnote ??
                        'Legg merke til hvor de to veiene slutter, og hvor den ene ikke slutter i det hele tatt.'}
                </p>
                <button
                    type="button"
                    onClick={nullstill}
                    className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Start på nytt
                </button>
            </div>
        </div>
    );
}
