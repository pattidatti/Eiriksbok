import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidspreferanse som en skålvekt. Venstre skål: penger i dag. Høyre skål: penger om et år.
 * Vekta tipper mot det vi setter mest pris på. Beat for beat:
 * 0 timeglass og spørsmålet, 1 begge skålene med 1000 kroner (ti mynter à 100), 2 vekta tipper mot «i dag»,
 * 3 høyre skål blir 1100 og vekta står likt, 4 de ekstra 100 kronene lyser = rente,
 * 5 to sider av rente: den som vil ha nå, og den som gir slipp.
 */

const SENTER_X = 800;
const AKSEL_Y = 300;
const ARM = 400;

function vinkelFor(beat: number) {
    if (beat === 2) return -11;
    return 0;
}

function Mynter({ antall, ekstra }: { antall: number; ekstra: number }) {
    return (
        <g>
            {Array.from({ length: antall + ekstra }, (_, i) => (
                <ellipse
                    key={i}
                    cx={0}
                    cy={-14 - i * 13}
                    rx={70}
                    ry={11}
                    fill={i >= antall ? '#dc2626' : '#d4a017'}
                    stroke={i >= antall ? '#7f1d1d' : '#92400e'}
                    strokeWidth={3}
                />
            ))}
        </g>
    );
}

function Skal({
    x,
    y,
    tittel,
    belop,
    ekstra,
    synlig,
}: {
    x: number;
    y: number;
    tittel: string;
    belop: string;
    ekstra: boolean;
    synlig: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {/* Snorene og skåla */}
            <line x1={0} y1={0} x2={-110} y2={150} stroke="#475569" strokeWidth={4} />
            <line x1={0} y1={0} x2={110} y2={150} stroke="#475569" strokeWidth={4} />
            <path
                d="M -140 150 Q 0 230 140 150 Z"
                fill="#94a3b8"
                stroke="#334155"
                strokeWidth={4}
            />
            {synlig && (
                <g transform="translate(0 165)">
                    <Mynter antall={10} ekstra={ekstra ? 1 : 0} />
                </g>
            )}
            {synlig && (
                <>
                    <text
                        x={0}
                        y={265}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill={ekstra ? '#b91c1c' : '#0f172a'}
                    >
                        {belop}
                    </text>
                    <text
                        x={0}
                        y={315}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={600}
                        fill="#475569"
                    >
                        {tittel}
                    </text>
                </>
            )}
        </g>
    );
}

export function InflasjonVekt({ beat }: VisualProps) {
    const vinkel = vinkelFor(beat);
    const rad = (vinkel * Math.PI) / 180;
    const vx = SENTER_X - ARM * Math.cos(rad);
    const vy = AKSEL_Y - ARM * Math.sin(rad);
    const hx = SENTER_X + ARM * Math.cos(rad);
    const hy = AKSEL_Y + ARM * Math.sin(rad);
    const synlig = beat >= 1;
    const ekstra = beat >= 3;
    const overskrift =
        beat === 0
            ? 'Tidspreferanse: hvor tålmodig er du?'
            : beat === 1
              ? 'Hva velger du?'
              : beat === 2
                ? 'De fleste velger i dag'
                : beat === 3
                  ? '1100 kroner om et år: verdt å vente?'
                  : beat === 4
                    ? 'De ekstra 100 kronene = rente'
                    : 'Böhm-Bawerk: to sider av rente';

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-slate-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={overskrift}
                        x={800}
                        y={95}
                        textAnchor="middle"
                        fontSize={60}
                        fontWeight={800}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {overskrift}
                    </motion.text>
                </AnimatePresence>

                {beat < 5 && (
                    <g>
                        {/* Foten */}
                        <path
                            d={`M ${SENTER_X - 120} 830 L ${SENTER_X + 120} 830 L ${SENTER_X + 30} 790 L ${SENTER_X - 30} 790 Z`}
                            fill="#334155"
                        />
                        <rect
                            x={SENTER_X - 14}
                            y={AKSEL_Y}
                            width={28}
                            height={490}
                            fill="#475569"
                        />
                        {/* Armen */}
                        <motion.line
                            initial={false}
                            animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                            transition={{ type: 'spring', stiffness: 50, damping: 12 }}
                            stroke="#1e293b"
                            strokeWidth={16}
                            strokeLinecap="round"
                        />
                        <circle
                            cx={SENTER_X}
                            cy={AKSEL_Y}
                            r={22}
                            fill="#f59e0b"
                            stroke="#1e293b"
                            strokeWidth={5}
                        />
                        <motion.g
                            initial={false}
                            animate={{ x: vx - 400, y: vy - AKSEL_Y }}
                            transition={{ type: 'spring', stiffness: 50, damping: 12 }}
                        >
                            <Skal
                                x={400}
                                y={AKSEL_Y}
                                tittel="i dag"
                                belop="1000 kr"
                                ekstra={false}
                                synlig={synlig}
                            />
                        </motion.g>
                        <motion.g
                            initial={false}
                            animate={{ x: hx - 1200, y: hy - AKSEL_Y }}
                            transition={{ type: 'spring', stiffness: 50, damping: 12 }}
                        >
                            <Skal
                                x={1200}
                                y={AKSEL_Y}
                                tittel="om et år"
                                belop={ekstra ? '1100 kr' : '1000 kr'}
                                ekstra={ekstra}
                                synlig={synlig}
                            />
                        </motion.g>
                        {/* Timeglass på beat 0 */}
                        {beat === 0 && <Timeglass />}
                        {beat === 4 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <rect
                                    x={1060}
                                    y={130}
                                    width={280}
                                    height={86}
                                    rx={20}
                                    fill="#b91c1c"
                                />
                                <text
                                    x={1200}
                                    y={188}
                                    textAnchor="middle"
                                    fontSize={44}
                                    fontWeight={800}
                                    fill="#fff"
                                >
                                    + 100 kr
                                </text>
                                <text
                                    x={1200}
                                    y={255}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={700}
                                    fill="#7f1d1d"
                                >
                                    prisen på å vente
                                </text>
                            </motion.g>
                        )}
                    </g>
                )}

                {beat >= 5 && <ToSider />}
            </svg>
        </div>
    );
}

function Timeglass() {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: '800px 560px' }}
        >
            <rect x={700} y={440} width={200} height={22} rx={8} fill="#92400e" />
            <rect x={700} y={680} width={200} height={22} rx={8} fill="#92400e" />
            <path
                d="M 720 462 L 880 462 L 806 572 L 880 680 L 720 680 L 794 572 Z"
                fill="#e0f2fe"
                stroke="#334155"
                strokeWidth={5}
            />
            <path d="M 740 470 L 860 470 L 808 548 L 792 548 Z" fill="#fbbf24" />
            <path d="M 760 680 L 840 680 L 800 630 Z" fill="#fbbf24" />
        </motion.g>
    );
}

function Person({ x, farge }: { x: number; farge: string }) {
    return (
        <g transform={`translate(${x} 0)`}>
            <circle cx={0} cy={330} r={46} fill="#f1c7a3" />
            <path d="M -70 520 Q -70 395 0 395 Q 70 395 70 520 Z" fill={farge} />
        </g>
    );
}

/** Beat 5: den som vil ha nå, betaler rente. Den som gir slipp, krever rente. */
function ToSider() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Person x={360} farge="#2563eb" />
            <Person x={1240} farge="#0d9488" />
            <text x={360} y={590} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                Vil ha noe nå
            </text>
            <text x={360} y={650} textAnchor="middle" fontSize={40} fontWeight={700} fill="#b91c1c">
                betaler rente
            </text>
            <text
                x={1240}
                y={590}
                textAnchor="middle"
                fontSize={44}
                fontWeight={800}
                fill="#134e4a"
            >
                Gir slipp på noe
            </text>
            <text
                x={1240}
                y={650}
                textAnchor="middle"
                fontSize={40}
                fontWeight={700}
                fill="#15803d"
            >
                krever rente
            </text>
            {/* Pengene går fra den som venter til den som vil ha nå, renta går tilbake */}
            <motion.path
                d="M 1150 380 C 950 300 650 300 450 380"
                fill="none"
                stroke="#d4a017"
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
            />
            <polygon points="450,380 490,350 495,395" fill="#d4a017" />
            <text x={800} y={255} textAnchor="middle" fontSize={36} fontWeight={700} fill="#92400e">
                pengene nå
            </text>
            <motion.path
                d="M 450 470 C 650 560 950 560 1150 470"
                fill="none"
                stroke="#dc2626"
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 1 }}
            />
            <motion.polygon
                points="1150,470 1110,500 1105,455"
                fill="#dc2626"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
            />
            <motion.text
                x={800}
                y={580}
                textAnchor="middle"
                fontSize={36}
                fontWeight={700}
                fill="#b91c1c"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
            >
                pengene + rente senere
            </motion.text>
        </motion.g>
    );
}
