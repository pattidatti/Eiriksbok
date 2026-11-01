import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './Overskrift';

/**
 * Romersk byplan og vannforsyning, i 2D.
 * - by: byen ovenfra. Rette gater, leiren (castrum), cardo og decumanus, rutenettet med
 *   forum i krysset, og til slutt dagens by som vokser rundt
 * - akvedukt: en vannledning på buer fra kilden i åsene ned til byen, drevet av tyngdekraften
 */

type Modus = 'by' | 'akvedukt';

const ROD = '#b91c1c';
const GULL = '#ca8a04';
const GATE = '#f5f5f4';
const KVARTAL = '#d6b48a';
const MUR = '#57534e';
const VANN = '#2563eb';

// Byen: et kvadrat midt i bildet. Rutenett 6 x 6 kvartaler.
const BY = { x: 500, y: 200, s: 600 };
const N = 6;
const CELLE = BY.s / N;

function Kvartaler({ beat }: { beat: number }) {
    const ruter = [];
    for (let r = 0; r < N; r++) {
        for (let k = 0; k < N; k++) {
            const forum = beat >= 3 && (r === 2 || r === 3) && (k === 2 || k === 3);
            ruter.push(
                <motion.rect
                    key={`${r}-${k}`}
                    x={BY.x + k * CELLE + 10}
                    y={BY.y + r * CELLE + 10}
                    width={CELLE - 20}
                    height={CELLE - 20}
                    rx={4}
                    initial={false}
                    animate={{ fill: forum ? '#fde68a' : KVARTAL }}
                    transition={{ duration: 0.6, delay: forum ? 0.6 : 0 }}
                    stroke="#92400e"
                    strokeWidth={2}
                />
            );
        }
    }
    return <>{ruter}</>;
}

/** Dagens by som vokser utenfor muren: kvartaler i skjeve vinkler. */
const NYE: { x: number; y: number; b: number; h: number; v: number }[] = [
    { x: 300, y: 230, b: 120, h: 90, v: -8 },
    { x: 280, y: 380, b: 140, h: 110, v: 6 },
    { x: 310, y: 560, b: 120, h: 120, v: -4 },
    { x: 360, y: 730, b: 110, h: 80, v: 10 },
    { x: 1180, y: 220, b: 130, h: 100, v: 7 },
    { x: 1200, y: 390, b: 120, h: 120, v: -6 },
    { x: 1170, y: 570, b: 150, h: 100, v: 4 },
    { x: 1140, y: 730, b: 120, h: 90, v: -10 },
    { x: 180, y: 300, b: 80, h: 160, v: 12 },
    { x: 1330, y: 300, b: 90, h: 170, v: -9 },
    { x: 170, y: 560, b: 90, h: 140, v: -6 },
    { x: 1330, y: 560, b: 100, h: 150, v: 8 },
];

function By({ beat }: { beat: number }) {
    const midtX = BY.x + BY.s / 2;
    const midtY = BY.y + BY.s / 2;
    return (
        <>
            {/* Dagens by rundt, til slutt */}
            {beat >= 4 &&
                NYE.map((n, i) => (
                    <motion.rect
                        key={i}
                        x={n.x}
                        y={n.y}
                        width={n.b}
                        height={n.h}
                        rx={6}
                        fill="#cbd5e1"
                        stroke="#64748b"
                        strokeWidth={2}
                        transform={`rotate(${n.v} ${n.x + n.b / 2} ${n.y + n.h / 2})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.08, duration: 0.4 }}
                    />
                ))}

            <rect x={BY.x} y={BY.y} width={BY.s} height={BY.s} fill={GATE} />
            <Kvartaler beat={beat} />

            {/* Beat 0: piler langs de rette gatene */}
            {beat === 0 &&
                [1, 4].map((r) => (
                    <motion.line
                        key={r}
                        x1={BY.x + 20}
                        y1={BY.y + r * CELLE}
                        x2={BY.x + BY.s - 30}
                        y2={BY.y + r * CELLE}
                        stroke="#0f172a"
                        strokeWidth={8}
                        markerEnd="url(#by-pil)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, delay: r * 0.2 }}
                    />
                ))}

            {/* Leiren: mur rundt og porter */}
            {beat >= 1 && (
                <motion.rect
                    x={BY.x - 14}
                    y={BY.y - 14}
                    width={BY.s + 28}
                    height={BY.s + 28}
                    fill="none"
                    stroke={MUR}
                    strokeWidth={22}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8 }}
                />
            )}
            {beat >= 1 &&
                [
                    [midtX, BY.y - 14],
                    [midtX, BY.y + BY.s + 14],
                    [BY.x - 14, midtY],
                    [BY.x + BY.s + 14, midtY],
                ].map(([x, y], i) => (
                    <rect key={i} x={x - 30} y={y - 30} width={60} height={60} fill={GATE} stroke={MUR} strokeWidth={4} />
                ))}

            {/* Cardo og decumanus */}
            {beat >= 2 && (
                <>
                    <motion.line
                        x1={midtX}
                        y1={BY.y - 40}
                        x2={midtX}
                        y2={BY.y + BY.s + 40}
                        stroke={ROD}
                        strokeWidth={26}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2 }}
                    />
                    <motion.line
                        x1={BY.x - 40}
                        y1={midtY}
                        x2={BY.x + BY.s + 40}
                        y2={midtY}
                        stroke={ROD}
                        strokeWidth={26}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.8 }}
                    />
                </>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                    <circle cx={midtX} cy={midtY} r={34} fill={GULL} stroke="#fff" strokeWidth={6} />
                    <Lapp x={midtX} y={midtY + 100} tekst="forum" farge={GULL} />
                </motion.g>
            )}
            {beat >= 2 && beat <= 3 && (
                <>
                    <Lapp x={midtX + 130} y={BY.y + 60} tekst="cardo" farge={ROD} forsinkelse={0.4} />
                    <Lapp x={BY.x + 130} y={midtY - 50} tekst="decumanus" farge={ROD} forsinkelse={1.2} />
                </>
            )}
            {beat === 1 && <Lapp x={245} y={midtY} tekst="castrum = leir" farge={MUR} forsinkelse={1} />}
            {beat >= 4 && <Lapp x={midtX} y={862} tekst="den gamle romerske kjernen" farge={MUR} forsinkelse={1} />}
        </>
    );
}

function Lapp({
    x,
    y,
    tekst,
    farge,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    forsinkelse?: number;
}) {
    const b = tekst.length * 21 + 44;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse, duration: 0.5 }}>
            <rect x={x - b / 2} y={y - 36} width={b} height={58} rx={14} fill={farge} stroke="#fff" strokeWidth={3} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">
                {tekst}
            </text>
        </motion.g>
    );
}

// ---------- Akvedukt ----------

// Ledningen heller jevnt fra kilden (venstre, høyt) til byen (høyre, lavere).
const KILDE = { x: 150, y: 330 };
const BYEN = { x: 1450, y: 470 };
const hoyde = (x: number) => KILDE.y + ((x - KILDE.x) / (BYEN.x - KILDE.x)) * (BYEN.y - KILDE.y);
const DAL = { fra: 430, til: 1170 };
function Akvedukt({ beat }: { beat: number }) {
    const buer = [];
    const bredde = 74;
    for (let x = DAL.fra; x + bredde <= DAL.til; x += bredde) {
        const topp = hoyde(x + bredde / 2) + 22;
        const bunn = 780;
        buer.push(
            <path
                key={x}
                d={`M ${x} ${bunn} L ${x} ${topp} L ${x + bredde} ${topp} L ${x + bredde} ${bunn} L ${x + bredde - 12} ${bunn} L ${x + bredde - 12} ${topp + 90} A ${bredde / 2 - 12} ${bredde / 2 - 12} 0 0 0 ${x + 12} ${topp + 90} L ${x + 12} ${bunn} Z`}
                fill="#e7d3ad"
                stroke="#92400e"
                strokeWidth={2}
            />
        );
    }
    return (
        <>
            {/* Himmel og åser */}
            <path d={`M 0 900 L 0 ${KILDE.y + 30} Q 80 ${KILDE.y - 60} 200 ${KILDE.y + 40} L ${DAL.fra} 520 L ${DAL.fra + 60} 780 L ${DAL.til - 40} 780 L ${DAL.til} 600 L 1600 600 L 1600 900 Z`} fill="#a3b18a" />
            {/* Elva i dalen */}
            <rect x={DAL.fra + 60} y={780} width={DAL.til - DAL.fra - 100} height={30} fill="#93c5fd" />
            {/* Kanalen langs bakken på hver side */}
            <line x1={KILDE.x} y1={KILDE.y + 10} x2={DAL.fra} y2={hoyde(DAL.fra) + 10} stroke="#92400e" strokeWidth={22} />
            <line x1={DAL.til} y1={hoyde(DAL.til) + 10} x2={BYEN.x - 40} y2={hoyde(BYEN.x - 40) + 10} stroke="#92400e" strokeWidth={22} />
            {buer}
            {/* Vannet på toppen */}
            <line x1={KILDE.x} y1={KILDE.y} x2={BYEN.x - 40} y2={hoyde(BYEN.x - 40)} stroke={VANN} strokeWidth={10} strokeLinecap="round" />

            {/* Kilden og byen */}
            <circle cx={KILDE.x} cy={KILDE.y} r={22} fill={VANN} stroke="#fff" strokeWidth={4} />
            <g transform={`translate(${BYEN.x} ${BYEN.y + 40})`}>
                {[-60, -10, 40].map((dx, i) => (
                    <g key={dx}>
                        <rect x={dx} y={-60 - i * 20} width={44} height={110 + i * 20} fill="#fef3c7" stroke="#78350f" strokeWidth={3} />
                        <path d={`M ${dx - 6} ${-60 - i * 20} L ${dx + 22} ${-84 - i * 20} L ${dx + 50} ${-60 - i * 20} Z`} fill="#c2410c" />
                    </g>
                ))}
            </g>
            <Lapp x={KILDE.x + 60} y={KILDE.y - 70} tekst="kilden" farge={VANN} />
            <Lapp x={BYEN.x - 30} y={BYEN.y - 110} tekst="byen" farge="#78350f" />

            {beat === 0 && <Lapp x={800} y={852} tekst="vannledning på buer" farge="#92400e" forsinkelse={0.4} />}

            {beat >= 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <line x1={KILDE.x} y1={200} x2={BYEN.x} y2={200} stroke="#0f172a" strokeWidth={5} />
                    <line x1={KILDE.x} y1={180} x2={KILDE.x} y2={220} stroke="#0f172a" strokeWidth={5} />
                    <line x1={BYEN.x} y1={180} x2={BYEN.x} y2={220} stroke="#0f172a" strokeWidth={5} />
                    <rect x={620} y={168} width={360} height={64} rx={16} fill="#0f172a" />
                    <text x={800} y={212} textAnchor="middle" fontSize={38} fontWeight={900} fill="#fff">
                        30-50 kilometer
                    </text>
                </motion.g>
            )}

            {beat >= 2 && (
                <>
                    {Array.from({ length: 8 }, (_, i) => (
                        <motion.circle
                            key={i}
                            r={12}
                            fill="#60a5fa"
                            stroke="#fff"
                            strokeWidth={3}
                            initial={{ cx: KILDE.x, cy: KILDE.y - 14, opacity: 0 }}
                            animate={{
                                cx: [KILDE.x, BYEN.x - 40],
                                cy: [KILDE.y - 14, hoyde(BYEN.x - 40) - 14],
                                opacity: [0, 1, 1, 0],
                            }}
                            transition={{ duration: 4, delay: i * 0.5, repeat: Infinity, ease: 'linear' }}
                        />
                    ))}
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <path d="M 800 290 L 800 350" stroke={ROD} strokeWidth={10} markerEnd="url(#by-pil-rod)" />
                        <Lapp x={800} y={852} tekst="tyngdekraften drar vannet nedover" farge={ROD} />
                    </motion.g>
                </>
            )}
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    by: ['Rett som piler', 'Det startet som en leir', 'To hovedgater', 'Rutenett og forum', 'Byen vokser videre'],
    akvedukt: ['Akvedukten', 'Ferskvann langt unna', 'Bare tyngdekraften'],
};

export function ArvenByplan({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'by';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: modus === 'by' ? '#e9e4d4' : '#dbeafe' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <marker id="by-pil" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={3} markerHeight={3} orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill="#0f172a" />
                    </marker>
                    <marker id="by-pil-rod" viewBox="0 0 10 10" refX={5} refY={5} markerWidth={3} markerHeight={3} orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 Z" fill={ROD} />
                    </marker>
                </defs>
                {modus === 'by' ? <By beat={beat} /> : <Akvedukt beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
