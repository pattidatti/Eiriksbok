import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HelpCircle, Network } from 'lucide-react';

// Maktens form: et organisasjonsdiagram som skifter FORM når eleven bytter tradisjon.
//
// Lyspære-øyeblikket: «hvem bestemmer» har ikke bare ulike svar - selve spørsmålet
// har ulik form. En pyramide og et nettverk uten topp er ikke to svar på det samme
// spørsmålet. I noen tradisjoner finnes det ingen som kan svare, og det er ikke et
// hull i systemet. Det er slik systemet er ment å virke.
//
// All religionsdata kommer fra props i artikkel-JSON. Ingenting er hardkodet her.

interface MaktNode {
    id: string;
    label?: string;
    /** 0-100 i diagramrommet */
    x: number;
    /** 0-100 i diagramrommet */
    y: number;
    emphasis?: boolean;
}

interface MaktEdge {
    from: string;
    to: string;
    dashed?: boolean;
    /** Overstyrer tradisjonens `arrows` for denne kanten */
    arrow?: boolean;
}

interface MaktTradisjon {
    id: string;
    name: string;
    color: string;
    formLabel?: string;
    answer: string;
    arrows?: boolean;
    nodes: MaktNode[];
    edges?: MaktEdge[];
}

interface MaktensFormProps {
    title?: string;
    intro?: string;
    note?: string;
    questionLabel?: string;
    traditions?: MaktTradisjon[];
    defaultTradition?: string;
}

// Diagrammet er bevisst lavt: hele figuren skal få plass i artikkelspalten på en
// Chromebook (1366x768), der spalten er rundt 712 px bred. Høyere viewBox gir
// høyere figur, siden svg-en skalerer med bredden.
const VB_W = 640;
const VB_H = 230;
const PAD_X = 44;
const PAD_Y = 28;

const R_STOR = 15;
const R_LITEN = 11;

const px = (x: number) => PAD_X + (x / 100) * (VB_W - 2 * PAD_X);
const py = (y: number) => PAD_Y + (y / 100) * (VB_H - 2 * PAD_Y);

export function MaktensForm({
    title = 'Maktens form',
    intro = 'Velg en tradisjon og se hvilken form spørsmålet «hvem bestemmer?» får.',
    note,
    questionLabel = 'Hvem avgjør til slutt?',
    traditions = [],
    defaultTradition,
}: MaktensFormProps) {
    const [aktivId, setAktivId] = useState<string>(
        defaultTradition ?? traditions[0]?.id ?? ''
    );

    const aktiv = useMemo(
        () => traditions.find((t) => t.id === aktivId) ?? traditions[0],
        [traditions, aktivId]
    );

    const kanter = useMemo(() => {
        if (!aktiv) return [];
        const kart = new Map(aktiv.nodes.map((n) => [n.id, n]));
        return (aktiv.edges ?? []).flatMap((edge, i) => {
            const fra = kart.get(edge.from);
            const til = kart.get(edge.to);
            if (!fra || !til) return [];

            const x1 = px(fra.x);
            const y1 = py(fra.y);
            const x2 = px(til.x);
            const y2 = py(til.y);
            const vinkel = Math.atan2(y2 - y1, x2 - x1);
            const rFra = (fra.emphasis ? R_STOR : R_LITEN) + 3;
            const rTil = (til.emphasis ? R_STOR : R_LITEN) + 4;

            const ax = x1 + rFra * Math.cos(vinkel);
            const ay = y1 + rFra * Math.sin(vinkel);
            const bx = x2 - rTil * Math.cos(vinkel);
            const by = y2 - rTil * Math.sin(vinkel);

            const visPil = edge.arrow ?? aktiv.arrows ?? false;
            const p1 = [bx - 9 * Math.cos(vinkel - 0.42), by - 9 * Math.sin(vinkel - 0.42)];
            const p2 = [bx - 9 * Math.cos(vinkel + 0.42), by - 9 * Math.sin(vinkel + 0.42)];

            return [
                {
                    key: `${edge.from}-${edge.to}-${i}`,
                    x1: ax,
                    y1: ay,
                    x2: bx,
                    y2: by,
                    dashed: Boolean(edge.dashed),
                    pil: visPil ? `${bx},${by} ${p1[0]},${p1[1]} ${p2[0]},${p2[1]}` : null,
                    delay: 0.1 + i * 0.05,
                },
            ];
        });
    }, [aktiv]);

    if (!traditions.length || !aktiv) return null;

    return (
        <figure className="my-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <figcaption className="mb-3">
                <h3 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
                    <Network className="h-5 w-5 text-amber-500" aria-hidden="true" />
                    {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{intro}</p>
            </figcaption>

            <div className="mb-3 flex flex-wrap gap-2">
                {traditions.map((t) => {
                    const valgt = t.id === aktiv.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setAktivId(t.id)}
                            aria-pressed={valgt}
                            className="rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors"
                            style={
                                valgt
                                    ? {
                                          backgroundColor: t.color,
                                          borderColor: t.color,
                                          color: '#fff',
                                      }
                                    : { borderColor: '#cbd5e1', color: '#334155' }
                            }
                        >
                            {t.name}
                        </button>
                    );
                })}
            </div>

            <div className="rounded-lg bg-slate-50 p-2">
                <svg
                    viewBox={`0 0 ${VB_W} ${VB_H}`}
                    className="h-auto w-full"
                    role="img"
                    aria-label={`Organisasjonsdiagram for ${aktiv.name}. ${aktiv.answer}`}
                >
                    <AnimatePresence mode="wait">
                        <motion.g
                            key={aktiv.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22 }}
                        >
                            {kanter.map((k) => (
                                <g key={k.key}>
                                    {/* opacity settes også som attributt, ellers tegnes linja i
                                        full styrke i ett bilde før framer motion overtar. */}
                                    <motion.line
                                        x1={k.x1}
                                        y1={k.y1}
                                        x2={k.x2}
                                        y2={k.y2}
                                        stroke={aktiv.color}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeDasharray={k.dashed ? '5 5' : undefined}
                                        opacity={0}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: k.dashed ? 0.45 : 0.7 }}
                                        transition={{ duration: 0.35, delay: k.delay }}
                                    />
                                    {k.pil && (
                                        <motion.polygon
                                            points={k.pil}
                                            fill={aktiv.color}
                                            opacity={0}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: k.dashed ? 0.5 : 0.8 }}
                                            transition={{ duration: 0.3, delay: k.delay + 0.12 }}
                                        />
                                    )}
                                </g>
                            ))}

                            {aktiv.nodes.map((node, i) => {
                                const cx = px(node.x);
                                const cy = py(node.y);
                                const r = node.emphasis ? R_STOR : R_LITEN;
                                return (
                                    <motion.g
                                        key={node.id}
                                        initial={{ opacity: 0, scale: 0.4 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 320,
                                            damping: 18,
                                            delay: 0.08 + i * 0.07,
                                        }}
                                        style={{ originX: `${cx}px`, originY: `${cy}px` }}
                                    >
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={r}
                                            fill={node.emphasis ? aktiv.color : '#ffffff'}
                                            stroke={aktiv.color}
                                            strokeWidth={node.emphasis ? 2 : 2.5}
                                        />
                                        {node.label && (
                                            <text
                                                x={cx}
                                                y={cy + r + 15}
                                                textAnchor="middle"
                                                fontSize="12"
                                                fontWeight="600"
                                                fill="#0f172a"
                                            >
                                                {node.label}
                                            </text>
                                        )}
                                    </motion.g>
                                );
                            })}
                        </motion.g>
                    </AnimatePresence>
                </svg>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={aktiv.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22 }}
                    className="mt-3 rounded-xl border border-slate-200 bg-white p-3"
                    style={{ borderLeftColor: aktiv.color, borderLeftWidth: 4 }}
                >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span className="text-sm font-bold text-slate-900">{questionLabel}</span>
                        {aktiv.formLabel && (
                            <span
                                className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                                style={{ backgroundColor: aktiv.color }}
                            >
                                {aktiv.formLabel}
                            </span>
                        )}
                    </div>
                    <p className="text-sm leading-snug text-slate-700">{aktiv.answer}</p>
                </motion.div>
            </AnimatePresence>

            {note && <p className="mt-3 text-xs italic text-slate-500">{note}</p>}
        </figure>
    );
}
