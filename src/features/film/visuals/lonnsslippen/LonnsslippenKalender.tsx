import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To år ved siden av hverandre: i år og neste år. Viser at pengene kommer senere. To moduser:
 * - oppgjor: 6 600 kroner trekkes i juli, og kommer tilbake etter skatteoppgjøret neste år.
 * - ferie: feriepenger tjenes opp i år og kommer i juni neste år, uten skattetrekk.
 */

type Modus = 'oppgjor' | 'ferie';

const MND = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const BY = 450;
const CELLE = 56;
const AAR = [
    { x: 92, navn: 'I år' },
    { x: 836, navn: 'Neste år' },
];
const BREDDE = CELLE * 12;
const mndX = (aar: number, m: number) => AAR[aar].x + m * CELLE + CELLE / 2;

const OVERSKRIFT: Record<Modus, string[]> = {
    oppgjor: [
        'Juli: 6 600 kr trukket',
        'Året etter: skatteoppgjøret',
        'Staten regner ut og sammenligner',
        'For mye trukket? Du får det igjen',
    ],
    ferie: [
        'Feriepenger: tjent opp i år',
        'Vanligvis utbetalt i juni neste år',
        'Ingen skattetrekk i juni',
        'Samme år? Da trekkes det skatt',
    ],
};

function T({
    x,
    y,
    children,
    str = 32,
    farge = '#0f172a',
    vekt = 700,
    vis = true,
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    vekt?: number;
    vis?: boolean;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            textAnchor="middle"
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.text>
    );
}

function Kort({
    x,
    y,
    b,
    h,
    kant,
    children,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    kant: string;
    children: ReactNode;
}) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect
                x={x - b / 2}
                y={y}
                width={b}
                height={h}
                rx={20}
                fill="#ffffff"
                stroke={kant}
                strokeWidth={4}
            />
            {children}
        </motion.g>
    );
}

/** Kalenderstripene, med farge per måned. */
function Striper({ farge }: { farge: (aar: number, m: number) => string }) {
    return (
        <g>
            {AAR.map((a, ai) => (
                <g key={a.navn}>
                    <T x={a.x + BREDDE / 2} y={BY - 30} str={38} vekt={900}>
                        {a.navn}
                    </T>
                    {MND.map((m, mi) => (
                        <g key={mi}>
                            <rect
                                x={a.x + mi * CELLE + 2}
                                y={BY}
                                width={CELLE - 4}
                                height={96}
                                rx={8}
                                fill={farge(ai, mi)}
                            />
                            <T x={mndX(ai, mi)} y={BY + 60} str={32} farge="#334155">
                                {m}
                            </T>
                        </g>
                    ))}
                </g>
            ))}
        </g>
    );
}

/** En pil i en bue fra et punkt til et annet. */
function Bue({
    fra,
    til,
    farge,
    hoyde = 160,
    stiplet = false,
}: {
    fra: number;
    til: number;
    farge: string;
    hoyde?: number;
    stiplet?: boolean;
}) {
    const y = BY + 116;
    const d = `M ${fra} ${y} Q ${(fra + til) / 2} ${y + hoyde} ${til} ${y}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: stiplet ? 1 : 0, opacity: stiplet ? 0 : 1 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.2 }}
            />
            <motion.path
                d={`M ${til - 16} ${y + 22} L ${til} ${y} L ${til + 18} ${y + 20}`}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
            />
        </g>
    );
}

function Oppgjor({ beat }: { beat: number }) {
    const juli = mndX(0, 6);
    return (
        <g>
            <Striper
                farge={(a, m) =>
                    a === 0 && m === 6 ? '#fca5a5' : a === 1 && beat >= 1 ? '#fde68a' : '#e2e8f0'
                }
            />
            <Kort x={juli} y={220} b={300} h={110} kant="#dc2626">
                <T x={juli} y={268} str={30} farge="#7f1d1d">
                    Trukket i juli
                </T>
                <T x={juli} y={312} str={38} vekt={900} farge="#dc2626">
                    6 600 kr
                </T>
            </Kort>
            {beat >= 1 && (
                <>
                    <Bue fra={juli} til={AAR[1].x + 14} farge="#ca8a04" hoyde={170} />
                    <Kort x={AAR[1].x + BREDDE / 2} y={220} b={420} h={110} kant="#ca8a04">
                        <T x={AAR[1].x + BREDDE / 2} y={268} str={30} farge="#713f12">
                            året etter
                        </T>
                        <T x={AAR[1].x + BREDDE / 2} y={312} str={36} vekt={900} farge="#a16207">
                            Skatteoppgjøret
                        </T>
                    </Kort>
                </>
            )}
            {beat === 2 && (
                <g>
                    <Kort x={560} y={700} b={420} h={130} kant="#475569">
                        <T x={560} y={752} str={30} farge="#334155">
                            Det du skulle betalt
                        </T>
                        <T x={560} y={800} str={30} farge="#334155" vekt={500}>
                            regnes ut på nytt
                        </T>
                    </Kort>
                    <T x={800} y={782} str={60} vekt={900} farge="#475569">
                        ?
                    </T>
                    <Kort x={1040} y={700} b={420} h={130} kant="#dc2626">
                        <T x={1040} y={752} str={30} farge="#7f1d1d">
                            Det som er trukket
                        </T>
                        <T x={1040} y={800} str={34} vekt={900} farge="#dc2626">
                            6 600 kr
                        </T>
                    </Kort>
                </g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect
                        x={480}
                        y={720}
                        width={640}
                        height={96}
                        rx={20}
                        fill="#ccfbf1"
                        stroke="#0d9488"
                        strokeWidth={4}
                    />
                    <T x={800} y={782} str={38} vekt={900} farge="#0f766e">
                        6 600 kr tilbake til Ida
                    </T>
                </motion.g>
            )}
        </g>
    );
}

function Ferie({ beat }: { beat: number }) {
    const juniNeste = mndX(1, 5);
    return (
        <g>
            <Striper
                farge={(a, m) => {
                    if (a === 0 && m >= 6) return '#bfdbfe';
                    if (a === 1 && m === 5 && beat >= 1) return '#86efac';
                    return '#e2e8f0';
                }}
            />
            <Kort x={AAR[0].x + BREDDE * 0.75} y={220} b={440} h={110} kant="#2563eb">
                <T x={AAR[0].x + BREDDE * 0.75} y={268} str={30} farge="#1e3a8a">
                    Du jobber og tjener opp
                </T>
                <T x={AAR[0].x + BREDDE * 0.75} y={312} str={36} vekt={900} farge="#1d4ed8">
                    feriepenger
                </T>
            </Kort>
            {beat >= 1 && (
                <>
                    {beat <= 2 && (
                        <Bue fra={mndX(0, 9)} til={juniNeste} farge="#16a34a" hoyde={170} />
                    )}
                    <Kort x={juniNeste} y={220} b={440} h={110} kant="#16a34a">
                        <T x={juniNeste} y={268} str={30} farge="#14532d">
                            Juni: siste vanlige lønn
                        </T>
                        <T x={juniNeste} y={312} str={36} vekt={900} farge="#15803d">
                            før ferien
                        </T>
                    </Kort>
                </>
            )}
            {beat === 2 && (
                <Kort x={juniNeste} y={720} b={520} h={100} kant="#16a34a">
                    <T x={juniNeste} y={782} str={34} vekt={900} farge="#15803d">
                        Ingen skattetrekk da
                    </T>
                </Kort>
            )}
            {beat >= 3 && (
                <g>
                    <motion.path
                        d={`M ${mndX(0, 7)} ${BY + 116} Q ${mndX(0, 9)} ${BY + 240} ${mndX(0, 11)} ${BY + 116}`}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1 }}
                    />
                    <Kort x={AAR[0].x + BREDDE * 0.62} y={720} b={600} h={130} kant="#dc2626">
                        <T x={AAR[0].x + BREDDE * 0.62} y={772} str={30} farge="#7f1d1d">
                            Slutter du, får du dem samme år
                        </T>
                        <T x={AAR[0].x + BREDDE * 0.62} y={818} str={34} vekt={900} farge="#dc2626">
                            Da trekkes det skatt
                        </T>
                    </Kort>
                </g>
            )}
        </g>
    );
}

export function LonnsslippenKalender({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'oppgjor';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <motion.text
                    key={tekst}
                    x={800}
                    y={96}
                    textAnchor="middle"
                    fontSize={54}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {tekst}
                </motion.text>
                {modus === 'oppgjor' && <Oppgjor beat={beat} />}
                {modus === 'ferie' && <Ferie beat={beat} />}
            </svg>
        </div>
    );
}
