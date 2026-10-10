import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Selve spørsmålet, i to modus:
 * - teodise: tre påstander som ikke kan stemme samtidig, ordet teodise og hvor gammelt
 *   problemet er.
 * - to-slags: fysisk ondt (ingen bestemte det) mot moralsk ondt (mennesker mot hverandre).
 */

type Modus = 'teodise' | 'to-slags';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };

function Inn({
    vis,
    children,
    forsinkelse = 0,
    fra = 20,
}: {
    vis: boolean;
    children: ReactNode;
    forsinkelse?: number;
    fra?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, y: fra }}
            animate={{ opacity: vis ? 1 : 0, y: vis ? 0 : fra }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

function Pastand({
    x,
    y,
    tittel,
    under,
    farge,
    dempet = false,
}: {
    x: number;
    y: number;
    tittel: string;
    under: string;
    farge: string;
    dempet?: boolean;
}) {
    return (
        <g opacity={dempet ? 0.45 : 1}>
            <rect
                x={x - 220}
                y={y - 70}
                width={440}
                height={140}
                rx={28}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={6}
            />
            <text
                x={x}
                y={y - 6}
                textAnchor="middle"
                fontSize={48}
                fontWeight={900}
                fill={farge}
                style={FONT}
            >
                {tittel}
            </text>
            <text
                x={x}
                y={y + 42}
                textAnchor="middle"
                fontSize={28}
                fontWeight={600}
                fill="#475569"
                style={FONT}
            >
                {under}
            </text>
        </g>
    );
}

function Teodise({ beat }: { beat: number }) {
    const A = { x: 800, y: 170 };
    const B = { x: 400, y: 600 };
    const C = { x: 1200, y: 600 };
    const dempet = false;
    const borte = beat >= 4 ? 0.12 : 1;
    return (
        <>
            <motion.g initial={false} animate={{ opacity: borte }} transition={{ duration: 0.6 }}>
                {/* Linjene i trekanten */}
                <motion.line
                    x1={A.x}
                    y1={A.y}
                    x2={B.x}
                    y2={B.y}
                    stroke="#0f766e"
                    strokeWidth={8}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: beat >= 1 ? 1 : 0, opacity: dempet ? 0.3 : 1 }}
                    transition={{ duration: 0.8 }}
                />
                {[A, B].map((p, i) => (
                    <motion.line
                        key={i}
                        x1={p.x}
                        y1={p.y}
                        x2={C.x}
                        y2={C.y}
                        stroke="#dc2626"
                        strokeWidth={8}
                        strokeDasharray="22 16"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat >= 2 ? 1 : 0, opacity: dempet ? 0.3 : 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    />
                ))}

                <Inn vis={beat >= 0}>
                    <Pastand
                        x={A.x}
                        y={A.y}
                        tittel="Gud er god"
                        under="vil fjerne lidelsen"
                        farge="#0f766e"
                        dempet={dempet}
                    />
                </Inn>
                <Inn vis={beat >= 1}>
                    <Pastand
                        x={B.x}
                        y={B.y}
                        tittel="Gud kan alt"
                        under="klarer å fjerne den"
                        farge="#0f766e"
                        dempet={dempet}
                    />
                </Inn>
                <Inn vis={beat >= 2}>
                    <Pastand
                        x={C.x}
                        y={C.y}
                        tittel="Lidelsen finnes"
                        under="men den gjør det"
                        farge="#dc2626"
                        dempet={dempet}
                    />
                </Inn>

                {/* Midten: går ikke opp, så forsvaret */}
                <Inn vis={beat === 2}>
                    <text
                        x={800}
                        y={470}
                        textAnchor="middle"
                        fontSize={130}
                        fontWeight={900}
                        fill="#dc2626"
                        style={FONT}
                    >
                        ?
                    </text>
                </Inn>
                <Inn vis={beat === 3}>
                    <path
                        d="M 800 300 L 900 336 L 900 430 Q 900 510 800 556 Q 700 510 700 430 L 700 336 Z"
                        fill="#1e293b"
                    />
                    <text
                        x={800}
                        y={450}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#fde68a"
                        style={FONT}
                    >
                        Gud
                    </text>
                    <rect x={560} y={770} width={480} height={96} rx={24} fill="#1e293b" />
                    <text
                        x={800}
                        y={834}
                        textAnchor="middle"
                        fontSize={52}
                        fontWeight={900}
                        fill="#fde68a"
                        style={FONT}
                    >
                        Teodise
                    </text>
                    <text
                        x={800}
                        y={740}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill="#334155"
                        style={FONT}
                    >
                        å forsvare Gud mot anklagen
                    </text>
                </Inn>
            </motion.g>

            {/* Tidslinja: Epikur til Leibniz */}
            <g transform="translate(0 -330)">
                <Inn vis={beat >= 4} fra={40}>
                    <rect x={80} y={700} width={1440} height={180} rx={30} fill="#ffffff" />
                    <line x1={200} y1={800} x2={1400} y2={800} stroke="#94a3b8" strokeWidth={8} />
                    <motion.line
                        x1={200}
                        y1={800}
                        x2={1400}
                        y2={800}
                        stroke="#b45309"
                        strokeWidth={8}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: beat >= 4 ? 1 : 0 }}
                        transition={{ duration: 2.2, delay: 0.8 }}
                    />
                    <circle cx={200} cy={800} r={20} fill="#b45309" />
                    <text
                        x={200}
                        y={760}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                        style={FONT}
                    >
                        Epikur
                    </text>
                    <text
                        x={200}
                        y={856}
                        textAnchor="middle"
                        fontSize={26}
                        fontWeight={600}
                        fill="#64748b"
                        style={FONT}
                    >
                        før vår tidsregning
                    </text>
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 4 ? 1 : 0 }}
                        transition={{ delay: beat >= 4 ? 2.6 : 0 }}
                    >
                        <circle cx={1400} cy={800} r={20} fill="#b45309" />
                        <text
                            x={1400}
                            y={760}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#0f172a"
                            style={FONT}
                        >
                            Leibniz
                        </text>
                        <text
                            x={1400}
                            y={856}
                            textAnchor="middle"
                            fontSize={26}
                            fontWeight={600}
                            fill="#64748b"
                            style={FONT}
                        >
                            1710: ordet teodise
                        </text>
                    </motion.g>
                    <text
                        x={800}
                        y={770}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#b45309"
                        style={FONT}
                    >
                        flere hundre år før vår tidsregning
                    </text>
                </Inn>
            </g>
        </>
    );
}

function Hus({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -60 0 L -60 -80 L 0 -130 L 60 -80 L 60 0 Z"
                fill="#cbd5e1"
                stroke="#334155"
                strokeWidth={5}
            />
            <path
                d="M 4 -122 L -10 -90 L 12 -64 L -8 -30 L 6 0"
                fill="none"
                stroke="#0f172a"
                strokeWidth={6}
            />
            <rect x={-40} y={-66} width={22} height={22} fill="#334155" />
        </g>
    );
}

function Termometer({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-16}
                y={-130}
                width={32}
                height={110}
                rx={16}
                fill="#ffffff"
                stroke="#334155"
                strokeWidth={5}
            />
            <rect x={-7} y={-80} width={14} height={60} fill="#dc2626" />
            <circle cx={0} cy={-14} r={26} fill="#dc2626" stroke="#334155" strokeWidth={5} />
        </g>
    );
}

function Bolge({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M -80 0 Q -70 -110 10 -120 Q 70 -120 76 -70 Q 40 -96 20 -60 Q 0 -20 40 0 Z"
                fill="#0284c7"
                stroke="#0c4a6e"
                strokeWidth={5}
            />
        </g>
    );
}

function Person({
    x,
    y,
    farge,
    snudd = false,
}: {
    x: number;
    y: number;
    farge: string;
    snudd?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${snudd ? -1 : 1} 1)`}>
            <circle cx={0} cy={-150} r={30} fill="#e0b98a" />
            <path d="M -42 -112 Q 0 -126 42 -112 L 50 0 L -50 0 Z" fill={farge} />
            <path d="M 36 -100 L 76 -70" stroke={farge} strokeWidth={18} strokeLinecap="round" />
        </g>
    );
}

function ToSlags({ beat }: { beat: number }) {
    return (
        <>
            <text
                x={800}
                y={96}
                textAnchor="middle"
                fontSize={60}
                fontWeight={900}
                fill="#0f172a"
                style={FONT}
            >
                To slags vondt
            </text>

            {/* Fysisk ondt */}
            <motion.rect
                x={70}
                y={150}
                width={700}
                height={560}
                rx={34}
                initial={false}
                animate={{
                    fill: beat >= 1 ? '#ffffff' : '#ece5d8',
                    stroke: beat >= 1 ? '#0284c7' : '#d6cfc0',
                }}
                strokeWidth={6}
            />
            <Inn vis={beat < 1}>
                <text
                    x={420}
                    y={470}
                    textAnchor="middle"
                    fontSize={180}
                    fontWeight={900}
                    fill="#d6cfc0"
                    style={FONT}
                >
                    1
                </text>
            </Inn>
            <Inn vis={beat >= 1}>
                <text
                    x={420}
                    y={226}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#0284c7"
                    style={FONT}
                >
                    Fysisk ondt
                </text>
                <Termometer x={200} y={470} />
                <Hus x={420} y={470} />
                <Bolge x={640} y={470} />
                <text
                    x={200}
                    y={520}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#334155"
                    style={FONT}
                >
                    sykdom
                </text>
                <text
                    x={420}
                    y={520}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#334155"
                    style={FONT}
                >
                    ulykker
                </text>
                <text
                    x={640}
                    y={520}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill="#334155"
                    style={FONT}
                >
                    naturkatastrofer
                </text>
                <text
                    x={420}
                    y={640}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#0f172a"
                    style={FONT}
                >
                    Ingen mennesker bestemte det
                </text>
            </Inn>

            {/* Moralsk ondt */}
            <motion.rect
                x={830}
                y={150}
                width={700}
                height={560}
                rx={34}
                initial={false}
                animate={{
                    fill: beat >= 2 ? '#ffffff' : '#ece5d8',
                    stroke: beat >= 2 ? '#b91c1c' : '#d6cfc0',
                }}
                strokeWidth={6}
            />
            <Inn vis={beat < 2}>
                <text
                    x={1180}
                    y={470}
                    textAnchor="middle"
                    fontSize={180}
                    fontWeight={900}
                    fill="#d6cfc0"
                    style={FONT}
                >
                    2
                </text>
            </Inn>
            <Inn vis={beat >= 2}>
                <text
                    x={1180}
                    y={226}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#b91c1c"
                    style={FONT}
                >
                    Moralsk ondt
                </text>
                <Person x={1010} y={540} farge="#475569" />
                <Person x={1350} y={540} farge="#7c2d12" snudd />
                <path
                    d="M 1190 290 L 1150 380 L 1210 390 L 1160 500"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={12}
                    strokeLinejoin="round"
                />
                <text
                    x={1180}
                    y={640}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#0f172a"
                    style={FONT}
                >
                    Det mennesker gjør mot hverandre
                </text>
            </Inn>

            <Inn vis={beat >= 3} fra={30}>
                <rect x={300} y={750} width={1000} height={110} rx={28} fill="#1e293b" />
                <text
                    x={800}
                    y={822}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill="#fde68a"
                    style={FONT}
                >
                    Få tradisjoner svarer likt på begge
                </text>
            </Inn>
        </>
    );
}

export function LidelseSporsmal({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'teodise';
    return (
        <div className="absolute inset-0" style={{ background: '#f5efe4' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'teodise' ? <Teodise beat={beat} /> : <ToSlags beat={beat} />}
            </svg>
        </div>
    );
}
