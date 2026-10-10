import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To bryllup sett ovenfra. Til venstre vivaha: fire runder rundt bålet og sju skritt mot
 * nord. Til høyre Anand Karaj: fire runder rundt den hellige boka, én for hvert vers.
 */

const B = 1600;
const H = 900;
const RUNDE = 2; // sekunder per runde

function Par({
    cx,
    cy,
    r,
    farge,
    aktiv,
}: {
    cx: number;
    cy: number;
    r: number;
    farge: string;
    aktiv: boolean;
}) {
    return (
        <motion.g
            style={{ originX: `${cx}px`, originY: `${cy}px` }}
            initial={{ rotate: 0 }}
            animate={aktiv ? { rotate: 360 * 4 } : { rotate: 0 }}
            transition={aktiv ? { duration: RUNDE * 4, ease: 'linear' } : { duration: 0 }}
        >
            <circle cx={cx + r} cy={cy - 18} r={20} fill={farge} stroke="white" strokeWidth={4} />
            <circle cx={cx + r} cy={cy + 18} r={20} fill="#1e3a8a" stroke="white" strokeWidth={4} />
        </motion.g>
    );
}

function Teller({
    x,
    y,
    antall,
    etikett,
    farge,
    aktiv,
    ferdig,
}: {
    x: number;
    y: number;
    antall: number;
    etikett: (i: number) => string;
    farge: string;
    aktiv: boolean;
    ferdig: boolean;
}) {
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <motion.g
                    key={`${i}-${aktiv}`}
                    initial={{ opacity: ferdig ? 1 : 0.2 }}
                    animate={{ opacity: aktiv || ferdig ? 1 : 0.2 }}
                    transition={{ delay: ferdig ? 0 : (i + 1) * RUNDE - 0.2, duration: 0.3 }}
                >
                    <rect x={x + i * 150 - 65} y={y} width={130} height={56} rx={16} fill={farge} />
                    <text
                        x={x + i * 150}
                        y={y + 39}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="white"
                    >
                        {etikett(i)}
                    </text>
                </motion.g>
            ))}
        </g>
    );
}

export function OvergangsriterRunder({ beat }: VisualProps) {
    const hindu = { cx: 420, cy: 470, r: 150 };
    const sikh = { cx: 1180, cy: 470, r: 150 };
    const sikhVist = beat >= 2;

    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #fff7ed, #fde9d4)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Hinduisme: vivaha */}
                <motion.g initial={false} animate={{ opacity: beat <= 1 ? 1 : 0.5 }}>
                    <text
                        x={hindu.cx}
                        y={80}
                        textAnchor="middle"
                        fontSize={48}
                        fontWeight={900}
                        fill="#be185d"
                    >
                        Hinduisme: vivaha
                    </text>
                    <circle
                        cx={hindu.cx}
                        cy={hindu.cy}
                        r={hindu.r}
                        fill="none"
                        stroke="#f9a8d4"
                        strokeWidth={8}
                        strokeDasharray="18 14"
                    />
                    {/* Bålet */}
                    <circle cx={hindu.cx} cy={hindu.cy} r={56} fill="#7c2d12" />
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={hindu.cx}
                            cy={hindu.cy}
                            r={40 - i * 12}
                            fill={['#ea580c', '#f97316', '#fde047'][i]}
                            animate={{ opacity: [0.75, 1, 0.75] }}
                            transition={{ duration: 0.8 + i * 0.2, repeat: Infinity }}
                            style={{ originX: `${hindu.cx}px`, originY: `${hindu.cy}px` }}
                        />
                    ))}
                    <text
                        x={hindu.cx}
                        y={hindu.cy + 95}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="#7c2d12"
                    >
                        bålet
                    </text>
                    {beat <= 1 && <Par {...hindu} farge="#db2777" aktiv={beat === 0} />}
                    <Teller
                        x={hindu.cx - 225}
                        y={hindu.cy + 210}
                        antall={4}
                        etikett={(i) => `runde ${i + 1}`}
                        farge="#db2777"
                        aktiv={beat === 0}
                        ferdig={beat >= 1}
                    />
                    {/* Sju skritt mot nord */}
                    {beat >= 1 && (
                        <g>
                            {Array.from({ length: 7 }, (_, i) => (
                                <motion.ellipse
                                    key={i}
                                    cx={hindu.cx + hindu.r + 60 + (i % 2 ? 22 : -22)}
                                    cy={hindu.cy + 90 - i * 52}
                                    rx={14}
                                    ry={22}
                                    fill="#be185d"
                                    initial={{
                                        opacity: beat === 1 ? 0 : 1,
                                        scale: beat === 1 ? 0.4 : 1,
                                    }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: beat === 1 ? 0.4 + i * 0.45 : 0 }}
                                />
                            ))}
                            <text
                                x={hindu.cx + hindu.r + 60}
                                y={hindu.cy - 300}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                N ↑
                            </text>
                            <motion.g
                                initial={{ opacity: beat === 1 ? 0 : 1 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: beat === 1 ? 3.6 : 0 }}
                            >
                                <rect
                                    x={hindu.cx - 200}
                                    y={hindu.cy - 300}
                                    width={330}
                                    height={64}
                                    rx={18}
                                    fill="#be185d"
                                />
                                <text
                                    x={hindu.cx - 35}
                                    y={hindu.cy - 256}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill="white"
                                >
                                    7 skritt = gift
                                </text>
                            </motion.g>
                        </g>
                    )}
                </motion.g>

                {/* Sikhisme: Anand Karaj */}
                <motion.g
                    initial={false}
                    animate={{ opacity: sikhVist ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <text
                        x={sikh.cx}
                        y={80}
                        textAnchor="middle"
                        fontSize={48}
                        fontWeight={900}
                        fill="#c2410c"
                    >
                        Sikhisme: Anand Karaj
                    </text>
                    <circle
                        cx={sikh.cx}
                        cy={sikh.cy}
                        r={sikh.r}
                        fill="none"
                        stroke="#fdba74"
                        strokeWidth={8}
                        strokeDasharray="18 14"
                    />
                    {/* Den hellige boka */}
                    <rect
                        x={sikh.cx - 70}
                        y={sikh.cy - 50}
                        width={140}
                        height={100}
                        rx={10}
                        fill="#fef3c7"
                        stroke="#b45309"
                        strokeWidth={6}
                    />
                    <line
                        x1={sikh.cx}
                        y1={sikh.cy - 50}
                        x2={sikh.cx}
                        y2={sikh.cy + 50}
                        stroke="#b45309"
                        strokeWidth={5}
                    />
                    <text
                        x={sikh.cx}
                        y={sikh.cy + 95}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill="#7c2d12"
                    >
                        Guru Granth Sahib
                    </text>
                    {sikhVist && <Par key={beat} {...sikh} farge="#ea580c" aktiv />}
                    <Teller
                        x={sikh.cx - 225}
                        y={sikh.cy + 210}
                        antall={4}
                        etikett={(i) => `vers ${i + 1}`}
                        farge="#ea580c"
                        aktiv={beat === 3}
                        ferdig={false}
                    />
                    {beat === 3 && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: RUNDE * 4 - 1 }}
                        >
                            <rect
                                x={sikh.cx - 290}
                                y={sikh.cy - 300}
                                width={580}
                                height={64}
                                rx={18}
                                fill="#c2410c"
                            />
                            <text
                                x={sikh.cx}
                                y={sikh.cy - 256}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill="white"
                            >
                                En bok i midten, ikke en prest
                            </text>
                        </motion.g>
                    )}
                </motion.g>
            </svg>
        </div>
    );
}
