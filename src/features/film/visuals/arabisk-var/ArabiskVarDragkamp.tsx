import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Stormaktene som blandet seg inn, vist som dragkamp.
 * Beat 0: Saudi-Arabia og Iran drar i hver sin ende, og i midten henger opprørere og regjeringer.
 * Beat 1: USA og Russland drar i hver sin ende av Syria.
 * Beat 2: vestlige land går inn i Libya og går ut igjen, og Libya blir stående alene.
 */

const B = 1600;
const H = 900;

/** Tre figurer som lener seg bakover og drar. Retning -1 drar mot venstre, 1 mot høyre. */
function Lag({ x, y, farge, retning }: { x: number; y: number; farge: string; retning: -1 | 1 }) {
    return (
        <g>
            {[0, 1, 2].map((i) => {
                const fx = x + retning * i * 70;
                return (
                    <g key={i} transform={`translate(${fx} ${y}) rotate(${retning * 14})`}>
                        <circle cx={0} cy={-78} r={20} fill={farge} />
                        <rect x={-18} y={-54} width={36} height={64} rx={14} fill={farge} />
                        <rect x={-16} y={8} width={12} height={46} rx={6} fill={farge} />
                        <rect x={4} y={8} width={12} height={46} rx={6} fill={farge} />
                    </g>
                );
            })}
        </g>
    );
}

interface Rad {
    y: number;
    venstre: { navn: string; farge: string; under?: string };
    hoyre: { navn: string; farge: string; under?: string };
    midt: string;
}

const RADER: Rad[] = [
    {
        y: 330,
        venstre: { navn: 'Saudi-Arabia', farge: '#16a34a' },
        hoyre: { navn: 'Iran', farge: '#9333ea' },
        midt: 'opprørere og regjeringer',
    },
    {
        y: 630,
        venstre: { navn: 'USA', farge: '#2563eb', under: 'mot Assad' },
        hoyre: { navn: 'Russland', farge: '#b91c1c', under: 'med Assad' },
        midt: 'Syria',
    },
];

function Dragkamp({ rad, aktiv }: { rad: Rad; aktiv: boolean }) {
    const { y } = rad;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: aktiv ? 1 : 0.35 }}
            transition={{ duration: 0.6 }}
        >
            <line
                x1={330}
                x2={1270}
                y1={y - 40}
                y2={y - 40}
                stroke="#a16207"
                strokeWidth={12}
                strokeLinecap="round"
            />
            <motion.g
                animate={aktiv ? { x: [-24, 24, -24] } : { x: 0 }}
                transition={
                    aktiv
                        ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.4 }
                }
            >
                <rect x={560} y={y - 82} width={480} height={84} rx={22} fill="#0f172a" />
                <text
                    x={800}
                    y={y - 28}
                    textAnchor="middle"
                    fontSize={rad.midt.length > 12 ? 30 : 40}
                    fontWeight={900}
                    fill="#fff"
                >
                    {rad.midt}
                </text>
            </motion.g>
            <Lag x={290} y={y} farge={rad.venstre.farge} retning={-1} />
            <Lag x={1310} y={y} farge={rad.hoyre.farge} retning={1} />
            <text
                x={220}
                y={y + 110}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill={rad.venstre.farge}
            >
                {rad.venstre.navn}
            </text>
            <text
                x={1380}
                y={y + 110}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill={rad.hoyre.farge}
            >
                {rad.hoyre.navn}
            </text>
            {rad.venstre.under && (
                <text
                    x={220}
                    y={y + 150}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#475569"
                >
                    {rad.venstre.under}
                </text>
            )}
            {rad.hoyre.under && (
                <text
                    x={1380}
                    y={y + 150}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#475569"
                >
                    {rad.hoyre.under}
                </text>
            )}
        </motion.g>
    );
}

/** Libya: vestlige land går inn, og så ut igjen. */
function Libya() {
    return (
        <g>
            <rect x={560} y={260} width={480} height={360} rx={36} fill="#fdba74" />
            <text x={800} y={350} textAnchor="middle" fontSize={64} fontWeight={900} fill="#7c2d12">
                Libya
            </text>
            <motion.g
                initial={{ x: -520 }}
                animate={{ x: [-520, 0, 0, -620] }}
                transition={{ duration: 4, times: [0, 0.3, 0.55, 1], ease: 'easeInOut' }}
            >
                <Lag x={760} y={540} farge="#2563eb" retning={1} />
                <text
                    x={830}
                    y={430}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#1e3a8a"
                >
                    Vestlige land
                </text>
            </motion.g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }}>
                <text
                    x={800}
                    y={460}
                    textAnchor="middle"
                    fontSize={120}
                    fontWeight={900}
                    fill="#9a3412"
                >
                    ?
                </text>
                <rect x={520} y={680} width={560} height={96} rx={26} fill="#b91c1c" />
                <text
                    x={800}
                    y={742}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill="#fff"
                >
                    Ingen plan for etterpå
                </text>
            </motion.g>
        </g>
    );
}

export function ArabiskVarDragkamp({ beat }: VisualProps) {
    const overskrift = [
        'Saudi-Arabia mot Iran',
        'USA og Russland i Syria',
        'Vesten forlater Libya',
    ][Math.min(beat, 2)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-stone-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <text
                    x={B / 2}
                    y={110}
                    textAnchor="middle"
                    fontSize={60}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    {overskrift}
                </text>
                {beat <= 1 ? (
                    RADER.map((r, i) =>
                        beat >= i ? <Dragkamp key={r.midt} rad={r} aktiv={beat === i} /> : null
                    )
                ) : (
                    <Libya />
                )}
            </svg>
        </div>
    );
}
