import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Den mørke historien til geopolitikken som en tidslinje.
 *
 * Beat 0: «En mørk historie» stort i midten. Beat 1: aksen og Mackinder (1904). Beat 2: kappløpet om krigsskip
 * mellom Tyskland og Storbritannia før første verdenskrig. Beat 3: Haushofers tidsskrift
 * (1924-1944). Beat 4: Lebensraum. Beat 5: tanken påvirket Hitler og nazistene.
 */

const B = 1600;
const H = 900;
const AKSE_Y = 450;
const x = (aar: number) => 120 + (aar - 1885) * 22;

function Kort({
    x: kx,
    y,
    linjer,
    farge = '#1e293b',
    kant = '#475569',
    str = 32,
    forsinkelse = 0.2,
}: {
    x: number;
    y: number;
    linjer: string[];
    farge?: string;
    kant?: string;
    str?: number;
    forsinkelse?: number;
}) {
    const bredde = Math.max(...linjer.map((l) => l.length)) * str * 0.56 + 48;
    const hoyde = linjer.length * str * 1.3 + 28;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.6 }}
        >
            <rect
                x={kx}
                y={y}
                width={bredde}
                height={hoyde}
                rx={18}
                fill={farge}
                stroke={kant}
                strokeWidth={3}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={kx + 24}
                    y={y + 18 + str + i * str * 1.3 - 4}
                    fontSize={str}
                    fontWeight={i === 0 ? 800 : 600}
                    fill={i === 0 ? '#f8fafc' : '#cbd5e1'}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function Merke({
    aar,
    tekst,
    farge,
    over,
}: {
    aar: number;
    tekst: string;
    farge: string;
    over?: boolean;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <circle cx={x(aar)} cy={AKSE_Y} r={16} fill={farge} stroke="#0f172a" strokeWidth={4} />
            <text
                x={x(aar)}
                y={over ? AKSE_Y - 34 : AKSE_Y + 58}
                textAnchor="middle"
                fontSize={38}
                fontWeight={800}
                fill={farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** Et lite krigsskip i profil, med en pil opp som viser at flåten vokser. */
function Krigsskip({
    cx,
    cy,
    farge,
    navn,
}: {
    cx: number;
    cy: number;
    farge: string;
    navn: string;
}) {
    return (
        <g>
            <path
                d={`M ${cx - 90} ${cy} L ${cx + 90} ${cy} L ${cx + 70} ${cy + 30} L ${cx - 80} ${cy + 30} Z`}
                fill={farge}
            />
            <rect x={cx - 30} y={cy - 34} width={50} height={34} fill={farge} />
            <rect x={cx - 6} y={cy - 64} width={12} height={30} fill={farge} />
            <rect x={cx + 30} y={cy - 16} width={44} height={8} fill={farge} />
            <path
                d={`M ${cx + 120} ${cy + 30} L ${cx + 120} ${cy - 40} M ${cx + 104} ${cy - 22} L ${cx + 120} ${cy - 40} L ${cx + 136} ${cy - 22}`}
                stroke="#f87171"
                strokeWidth={8}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <text
                x={cx}
                y={cy + 72}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill="#e2e8f0"
            >
                {navn}
            </text>
        </g>
    );
}

export function GeopolitikkTidslinje({ beat }: VisualProps) {
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {beat === 0 ? (
                    <motion.text
                        key="stor"
                        x={B / 2}
                        y={H / 2}
                        textAnchor="middle"
                        fontSize={84}
                        fontWeight={900}
                        fill="#f8fafc"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                    >
                        En mørk historie
                    </motion.text>
                ) : (
                    <text
                        x={B / 2}
                        y={88}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#f8fafc"
                    >
                        Geopolitikkens mørke historie
                    </text>
                )}
                {beat >= 1 && (
                    <line
                        x1={x(1898)}
                        y1={AKSE_Y}
                        x2={x(1949)}
                        y2={AKSE_Y}
                        stroke="#64748b"
                        strokeWidth={8}
                        strokeLinecap="round"
                    />
                )}
                {beat >= 1 && <Merke aar={1904} tekst="1904" farge="#fbbf24" over />}
                {beat >= 1 && (
                    <Kort
                        x={x(1904) - 200}
                        y={150}
                        linjer={[
                            'Mackinder, britisk geograf:',
                            'den som kontrollerer Øst-Europa,',
                            'kan dominere hele verden',
                        ]}
                        kant="#fbbf24"
                        str={30}
                    />
                )}
                {beat >= 2 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 2 ? 1 : 0.55 }}>
                        <Krigsskip cx={x(1897)} cy={AKSE_Y + 140} farge="#94a3b8" navn="Tyskland" />
                        <Krigsskip
                            cx={x(1911)}
                            cy={AKSE_Y + 140}
                            farge="#cbd5e1"
                            navn="Storbritannia"
                        />
                        <text
                            x={(x(1897) + x(1911)) / 2}
                            y={AKSE_Y + 300}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#fca5a5"
                        >
                            Kappløp om å bygge krigsskip
                        </text>
                    </motion.g>
                )}
                {beat >= 2 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <rect
                            x={x(1914)}
                            y={AKSE_Y - 14}
                            width={x(1918) - x(1914)}
                            height={28}
                            rx={8}
                            fill="#dc2626"
                        />
                        <text
                            x={x(1916)}
                            y={AKSE_Y - 34}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill="#f87171"
                        >
                            Første verdenskrig
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect
                            x={x(1924)}
                            y={AKSE_Y - 16}
                            width={x(1944) - x(1924)}
                            height={32}
                            rx={10}
                            fill="#a78bfa"
                        />
                        <text
                            x={x(1924)}
                            y={AKSE_Y + 60}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#c4b5fd"
                        >
                            1924
                        </text>
                        <text
                            x={x(1944)}
                            y={AKSE_Y + 60}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#c4b5fd"
                        >
                            1944
                        </text>
                    </motion.g>
                )}
                {beat >= 3 && (
                    <Kort
                        x={x(1924) + 10}
                        y={150}
                        linjer={[
                            'Karl Haushofer, Tyskland:',
                            'egen skole for geopolitikk',
                            'og et tidsskrift om faget',
                        ]}
                        kant="#a78bfa"
                        str={30}
                    />
                )}
                {beat >= 4 && (
                    <Kort
                        x={x(1921)}
                        y={AKSE_Y + 110}
                        linjer={[
                            'Lebensraum = «livsrom»',
                            'Haushofer: Tyskland trengte et stort',
                            'område som ga landet alt det trengte',
                        ]}
                        kant="#f87171"
                        str={28}
                    />
                )}
                {beat >= 5 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <rect
                            x={x(1921)}
                            y={AKSE_Y + 270}
                            width={620}
                            height={74}
                            rx={18}
                            fill="#7f1d1d"
                        />
                        <text
                            x={x(1921) + 310}
                            y={AKSE_Y + 320}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#fecaca"
                        >
                            Påvirket Hitler og nazistene
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
