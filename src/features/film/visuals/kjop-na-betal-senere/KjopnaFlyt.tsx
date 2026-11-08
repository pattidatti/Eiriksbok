import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hva «betal senere» egentlig er, i 2D: butikken, Sara og betalingsselskapet. Varen går først,
 * fakturaen kommer etter. Det er et lån, og ofte er det betalingsselskapet som låner ut
 * pengene. Betalt i tide koster det vanligvis ingenting; delt opp kan det komme renter.
 */

const OVERSKRIFT = [
    'Varen kommer først',
    'Så kommer fakturaen',
    'Kreditt betyr lån',
    'Hvem låner deg pengene?',
    'Betalt i tide',
    'Delt opp: kan gi renter',
];

function Vis({ vis, children }: { vis: boolean; children: ReactNode }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.g>
    );
}

function Tekst({
    x,
    y,
    children,
    str = 40,
    farge = '#0f172a',
    vekt = 800,
}: {
    x: number;
    y: number;
    children: string;
    str?: number;
    farge?: string;
    vekt?: number;
}) {
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={str} fontWeight={vekt} fill={farge}>
            {children}
        </text>
    );
}

/** En aktør: sirkel med symbol og navn under. */
function Node({
    x,
    y,
    navn,
    farge,
    symbol,
}: {
    x: number;
    y: number;
    navn: string;
    farge: string;
    symbol: ReactNode;
}) {
    return (
        <g>
            <circle cx={x} cy={y} r={105} fill={farge} />
            <g transform={`translate(${x} ${y})`}>{symbol}</g>
            <Tekst x={x} y={y + 160} str={46} vekt={900}>
                {navn}
            </Tekst>
        </g>
    );
}

const BUTIKK = { x: 260, y: 560 };
const SARA = { x: 1340, y: 560 };
const SELSKAP = { x: 800, y: 300 };

function Butikksymbol() {
    return (
        <g fill="#fff">
            <rect x={-55} y={-10} width={110} height={60} rx={6} />
            <path d="M -65 -10 L -50 -50 L 50 -50 L 65 -10 Z" />
            <rect x={-15} y={10} width={30} height={40} fill="#0f766e" />
        </g>
    );
}
function Personsymbol() {
    return (
        <g fill="#fff">
            <circle cx={0} cy={-30} r={28} />
            <path d="M -50 55 Q -50 5 0 5 Q 50 5 50 55 Z" />
        </g>
    );
}
function Banksymbol() {
    return (
        <g fill="#fff">
            <path d="M -60 -20 L 0 -55 L 60 -20 Z" />
            {[-40, -13, 13, 40].map((x) => (
                <rect key={x} x={x - 7} y={-15} width={14} height={50} />
            ))}
            <rect x={-62} y={38} width={124} height={12} />
        </g>
    );
}

/** En faktura som papirark. */
function Faktura({ x, y, tekst }: { x: number; y: number; tekst: string }) {
    return (
        <g>
            <rect
                x={x - 70}
                y={y - 90}
                width={140}
                height={180}
                rx={10}
                fill="#fff"
                stroke="#334155"
                strokeWidth={5}
            />
            {[-45, -15, 15].map((d) => (
                <rect key={d} x={x - 45} y={y + d} width={90} height={9} rx={4} fill="#cbd5e1" />
            ))}
            <Tekst x={x} y={y - 55} str={30} vekt={900}>
                {tekst}
            </Tekst>
        </g>
    );
}

export function KjopnaFlyt({ beat }: VisualProps) {
    const b = Math.min(beat, 5);
    return (
        <div className="absolute inset-0 bg-amber-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="h-full w-full"
            >
                <motion.text
                    key={OVERSKRIFT[b]}
                    x={800}
                    y={100}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {OVERSKRIFT[b]}
                </motion.text>

                {/* Linjen mellom butikken og Sara. */}
                <line
                    x1={BUTIKK.x + 120}
                    y1={BUTIKK.y}
                    x2={SARA.x - 120}
                    y2={SARA.y}
                    stroke="#94a3b8"
                    strokeWidth={8}
                    strokeDasharray="4 18"
                    strokeLinecap="round"
                />

                <Node
                    x={BUTIKK.x}
                    y={BUTIKK.y}
                    navn="Butikken"
                    farge="#0d9488"
                    symbol={<Butikksymbol />}
                />
                <Node x={SARA.x} y={SARA.y} navn="Sara" farge="#db2777" symbol={<Personsymbol />} />

                {/* Pakken: fra butikken til Sara. */}
                <motion.g
                    initial={{ x: BUTIKK.x + 160, opacity: 0 }}
                    animate={{ x: SARA.x - 260, opacity: b >= 3 ? 0 : 1 }}
                    transition={{ duration: 2.4, ease: 'easeInOut' }}
                >
                    <g transform={`translate(0 ${SARA.y - 160})`}>
                        <rect x={-50} y={-40} width={100} height={80} rx={6} fill="#b45309" />
                        <rect x={-6} y={-40} width={12} height={80} fill="#fde68a" />
                    </g>
                </motion.g>
                <Vis vis={b === 0}>
                    <Tekst x={800} y={700} str={44} farge="#475569">
                        Varen nå, pengene senere
                    </Tekst>
                </Vis>

                {/* Fakturaen og fristen. */}
                <Vis vis={b >= 1 && b <= 4}>
                    <Faktura x={SARA.x + 170} y={300} tekst="Faktura" />
                </Vis>
                <Vis vis={b === 1}>
                    <rect x={560} y={640} width={480} height={100} rx={20} fill="#1e293b" />
                    <Tekst x={800} y={707} str={48} farge="#fff">
                        14 eller 30 dager
                    </Tekst>
                </Vis>

                {/* Kreditt = lån. */}
                <Vis vis={b === 2}>
                    <rect x={500} y={630} width={600} height={120} rx={24} fill="#dc2626" />
                    <Tekst x={800} y={712} str={60} farge="#fff" vekt={900}>
                        Kredittavtale = lån
                    </Tekst>
                </Vis>

                {/* Betalingsselskapet. */}
                <Vis vis={b >= 3}>
                    <Node
                        x={SELSKAP.x}
                        y={SELSKAP.y}
                        navn=""
                        farge="#4f46e5"
                        symbol={<Banksymbol />}
                    />
                    <rect
                        x={SELSKAP.x - 200}
                        y={SELSKAP.y + 120}
                        width={400}
                        height={64}
                        rx={14}
                        fill="#eef2ff"
                    />
                    <Tekst x={SELSKAP.x} y={SELSKAP.y + 166} str={38} vekt={900} farge="#3730a3">
                        Betalingsselskap
                    </Tekst>
                </Vis>
                <Vis vis={b === 3}>
                    <line
                        x1={SELSKAP.x - 110}
                        y1={SELSKAP.y + 60}
                        x2={BUTIKK.x + 110}
                        y2={BUTIKK.y - 70}
                        stroke="#4f46e5"
                        strokeWidth={10}
                        markerEnd="url(#pil-blaa)"
                    />
                    <line
                        x1={SARA.x - 110}
                        y1={SARA.y - 70}
                        x2={SELSKAP.x + 110}
                        y2={SELSKAP.y + 60}
                        stroke="#dc2626"
                        strokeWidth={10}
                        strokeDasharray="20 14"
                        markerEnd="url(#pil-rod)"
                    />
                    <Tekst x={410} y={390} str={36} farge="#3730a3">
                        betaler butikken
                    </Tekst>
                    <Tekst x={1290} y={360} str={36} farge="#b91c1c">
                        Sara skylder
                    </Tekst>
                </Vis>

                {/* Betalt i tide. */}
                <Vis vis={b === 4}>
                    <rect x={420} y={640} width={760} height={120} rx={24} fill="#0d9488" />
                    <Tekst x={800} y={720} str={52} farge="#fff" vekt={900}>
                        Vanligvis 0 kroner ekstra
                    </Tekst>
                </Vis>

                {/* Delt opp i flere beløp: renter. */}
                <Vis vis={b === 5}>
                    {[0, 1, 2].map((i) => (
                        <g key={i}>
                            <rect
                                x={1250 + i * 95}
                                y={200}
                                width={80}
                                height={110}
                                rx={8}
                                fill="#fff"
                                stroke="#334155"
                                strokeWidth={4}
                            />
                            <Tekst x={1290 + i * 95} y={270} str={30} farge="#dc2626" vekt={900}>
                                +
                            </Tekst>
                        </g>
                    ))}
                    <rect x={450} y={630} width={700} height={130} rx={24} fill="#dc2626" />
                    <Tekst x={800} y={690} str={46} farge="#fff" vekt={900}>
                        Eksempel: 21 prosent rente
                    </Tekst>
                    <Tekst x={800} y={738} str={32} farge="#fee2e2" vekt={700}>
                        like dyrt som mange kredittkort
                    </Tekst>
                </Vis>

                <defs>
                    <marker
                        id="pil-blaa"
                        viewBox="0 0 10 10"
                        refX={8}
                        refY={5}
                        markerWidth={5}
                        markerHeight={5}
                        orient="auto"
                    >
                        <path d="M0,0 L10,5 L0,10 z" fill="#4f46e5" />
                    </marker>
                    <marker
                        id="pil-rod"
                        viewBox="0 0 10 10"
                        refX={8}
                        refY={5}
                        markerWidth={5}
                        markerHeight={5}
                        orient="auto"
                    >
                        <path d="M0,0 L10,5 L0,10 z" fill="#dc2626" />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}
