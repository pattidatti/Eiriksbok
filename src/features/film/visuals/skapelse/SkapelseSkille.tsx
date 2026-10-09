import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Mønsteret: linje mot ring. Til venstre tiden med en begynnelse, til høyre
 * tiden uten. Følgene kommer rad for rad, slik artikkelen lister dem.
 */

const B = 1600;
const H = 900;

const VENSTRE = ['Noen satte den i gang', 'Den har trolig en mening', 'Oppdrag fra noen'];
const HOYRE = ['Ingen satte den i gang', 'Meningen ligger et annet sted', 'Finn oppgaven selv'];

function Kort({
    x,
    y,
    tekst,
    farge,
    vist,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    vist: boolean;
}) {
    return (
        <motion.g initial={false} animate={{ opacity: vist ? 1 : 0, y: vist ? 0 : 20 }}>
            <rect
                x={x}
                y={y}
                width={620}
                height={100}
                rx={22}
                fill="white"
                stroke={farge}
                strokeWidth={6}
            />
            <text
                x={x + 310}
                y={y + 63}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill="#0f172a"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

export function SkapelseSkille({ beat }: VisualProps) {
    // Beat 1: venstre rad 1-2, beat 2: høyre rad 1-2, beat 3: rad 3 på begge sider.
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc, #e2e8f0)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={800}
                    y={80}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Har verden en begynnelse?
                </text>
                {/* Linja */}
                <g>
                    <text
                        x={430}
                        y={160}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#2563eb"
                    >
                        JA
                    </text>
                    <line
                        x1={200}
                        y1={230}
                        x2={640}
                        y2={230}
                        stroke="#2563eb"
                        strokeWidth={12}
                        strokeLinecap="round"
                    />
                    <path d="M 640 205 L 690 230 L 640 255 Z" fill="#2563eb" />
                    <circle cx={200} cy={230} r={22} fill="#1e3a8a" />
                    <text
                        x={200}
                        y={290}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill="#1e3a8a"
                    >
                        start
                    </text>
                </g>
                {/* Ringen */}
                <g>
                    <text
                        x={1170}
                        y={160}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#d97706"
                    >
                        NEI
                    </text>
                    <motion.circle
                        cx={1170}
                        cy={235}
                        r={50}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth={12}
                        strokeDasharray="250 64"
                        animate={{ rotate: 360 }}
                        style={{ originX: '1170px', originY: '235px' }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                    />
                </g>
                {VENSTRE.map((t, i) => (
                    <Kort
                        key={t}
                        x={120}
                        y={340 + i * 150}
                        tekst={t}
                        farge="#2563eb"
                        vist={i < 2 ? beat >= 1 : beat >= 3}
                    />
                ))}
                {HOYRE.map((t, i) => (
                    <Kort
                        key={t}
                        x={860}
                        y={340 + i * 150}
                        tekst={t}
                        farge="#d97706"
                        vist={i < 2 ? beat >= 2 : beat >= 3}
                    />
                ))}
                {beat === 0 && (
                    <motion.text
                        x={800}
                        y={560}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#475569"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Det største skillet: linje eller ring
                    </motion.text>
                )}
            </svg>
        </div>
    );
}
