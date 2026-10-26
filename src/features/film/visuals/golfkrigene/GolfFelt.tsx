import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Snitt gjennom bakken ved grensen mellom Irak og Kuwait. Oljefeltet Rumaila ligger under
 * begge land. Beat 0: Iraks pengekiste er tom. Beat 1: lån strømmer inn fra Kuwait og
 * nabolandene, og blir til gjeld. Beat 2: bakken åpnes, begge land pumper fra samme felt, og
 * Saddam peker på Kuwaits pumpe. Beat 3: kravene, og Kuwaits nei.
 */

const B = 1600;
const H = 900;
const BAKKE = 430;
const GRENSE = 800;

export function GolfFelt({ beat }: VisualProps) {
    const apen = beat >= 2;
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#fbe9c8]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <linearGradient id="golf-himmel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#bfe0f5" />
                        <stop offset="1" stopColor="#fbe9c8" />
                    </linearGradient>
                </defs>
                <rect x={0} y={0} width={B} height={BAKKE} fill="url(#golf-himmel)" />
                {/* Bakken: sand øverst, berg under. */}
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#d9b77c" />
                <motion.rect
                    x={0}
                    y={BAKKE + 40}
                    width={B}
                    height={H - BAKKE - 40}
                    animate={{ fill: apen ? '#a47b4a' : '#c9a26a' }}
                    transition={{ duration: 0.8 }}
                />
                {[0, 1, 2].map((i) => (
                    <path
                        key={i}
                        d={`M 0 ${BAKKE + 90 + i * 110} Q 400 ${BAKKE + 60 + i * 110} 800 ${BAKKE + 95 + i * 110} T 1600 ${BAKKE + 85 + i * 110}`}
                        fill="none"
                        stroke="#8a6438"
                        strokeOpacity={0.35}
                        strokeWidth={4}
                    />
                ))}

                {/* Oljefeltet under grensen. */}
                <motion.g
                    initial={false}
                    animate={{ opacity: apen ? 1 : 0 }}
                    transition={{ duration: 1 }}
                >
                    <ellipse cx={GRENSE} cy={720} rx={430} ry={100} fill="#1c1917" />
                    <ellipse
                        cx={GRENSE - 80}
                        cy={700}
                        rx={260}
                        ry={34}
                        fill="#44403c"
                        opacity={0.6}
                    />
                    <text
                        x={GRENSE}
                        y={790}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        Rumaila-feltet
                    </text>
                </motion.g>

                {/* Grensen. */}
                <line
                    x1={GRENSE}
                    y1={150}
                    x2={GRENSE}
                    y2={apen ? 880 : BAKKE}
                    stroke="#ffffff"
                    strokeWidth={8}
                    strokeDasharray="24 14"
                    style={{ transition: 'all 0.8s' }}
                />
                <rect x={GRENSE - 6} y={BAKKE - 110} width={12} height={110} fill="#334155" />
                <Landnavn x={400} tekst="IRAK" farge="#7f1d1d" />
                <Landnavn x={1200} tekst="KUWAIT" farge="#115e59" />

                {/* Pumpene og rørene, synlige når bakken er åpen. */}
                <Pumpe x={560} farge="#7f1d1d" synlig={apen} />
                <Pumpe x={1040} farge="#115e59" synlig={apen} aktiv={apen} />
                {beat === 2 && (
                    <>
                        <motion.path
                            d="M 600 700 Q 800 640 1010 650"
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={10}
                            strokeDasharray="20 14"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.4, duration: 1.2 }}
                        />
                        <Boble x={420} y={250} tekst="Saddam: Dere tar vår olje!" forsinkelse={2} />
                    </>
                )}

                {/* Pengekista. */}
                {beat <= 1 && <Kiste beat={beat} />}

                {beat === 3 && (
                    <>
                        <Krav y={160} tekst="Slett gjelden!" forsinkelse={0.2} />
                        <Krav y={260} tekst="Høyere oljepris!" forsinkelse={0.9} />
                        <motion.g
                            initial={{ opacity: 0, scale: 2.2, rotate: -14 }}
                            animate={{ opacity: 1, scale: 1, rotate: -8 }}
                            transition={{ delay: 2.4, type: 'spring', stiffness: 260, damping: 16 }}
                            style={{ transformOrigin: '1200px 230px' }}
                        >
                            <rect
                                x={1060}
                                y={160}
                                width={280}
                                height={140}
                                rx={16}
                                fill="none"
                                stroke="#dc2626"
                                strokeWidth={14}
                            />
                            <text
                                x={1200}
                                y={268}
                                textAnchor="middle"
                                fontSize={110}
                                fontWeight={900}
                                fill="#dc2626"
                            >
                                NEI
                            </text>
                        </motion.g>
                    </>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap bg-white/95 text-slate-900"
                >
                    {
                        [
                            'Irak: nesten konkurs',
                            'Lån fra nabolandene',
                            'Ett felt, to land',
                            'Kravene',
                        ][Math.min(beat, 3)]
                    }
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function Landnavn({ x, tekst, farge }: { x: number; tekst: string; farge: string }) {
    return (
        <text
            x={x}
            y={BAKKE + 30}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={48}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
            letterSpacing={6}
        >
            {tekst}
        </text>
    );
}

/** Et pumpetårn med rør ned til feltet. Oljedråper stiger i røret når den pumper. */
function Pumpe({
    x,
    farge,
    synlig,
    aktiv,
}: {
    x: number;
    farge: string;
    synlig: boolean;
    aktiv?: boolean;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.8 }}
        >
            <path
                d={`M ${x - 50} ${BAKKE} L ${x} ${BAKKE - 170} L ${x + 50} ${BAKKE} Z`}
                fill="none"
                stroke={farge}
                strokeWidth={10}
            />
            <line
                x1={x - 30}
                y1={BAKKE - 70}
                x2={x + 30}
                y2={BAKKE - 70}
                stroke={farge}
                strokeWidth={8}
            />
            <rect x={x - 9} y={BAKKE} width={18} height={270} fill="#57534e" />
            {aktiv &&
                [0, 1, 2, 3].map((i) => (
                    <motion.circle
                        key={i}
                        cx={x}
                        r={9}
                        fill="#1c1917"
                        initial={{ cy: BAKKE + 270 }}
                        animate={{ cy: [BAKKE + 270, BAKKE - 10] }}
                        transition={{
                            duration: 2,
                            delay: 0.8 + i * 0.5,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
        </motion.g>
    );
}

/** Pengekista til Irak. Tom på beat 0, full av lån (og gjeld) på beat 1. */
function Kiste({ beat }: { beat: number }) {
    const x = 400;
    const y = 250;
    return (
        <g>
            <rect
                x={x - 120}
                y={y - 50}
                width={240}
                height={130}
                rx={12}
                fill="#92400e"
                stroke="#451a03"
                strokeWidth={6}
            />
            <rect
                x={x - 120}
                y={y - 80}
                width={240}
                height={40}
                rx={10}
                fill="#b45309"
                stroke="#451a03"
                strokeWidth={6}
            />
            <text
                x={x}
                y={y + 30}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#fde68a"
            >
                {beat === 0 ? 'Nesten tom' : 'Gjeld'}
            </text>
            {beat === 1 &&
                [
                    [1180, 230],
                    [1500, 120],
                    [1500, 330],
                ].map(([fx, fy], i) => (
                    <g key={i}>
                        <motion.path
                            d={`M ${fx} ${fy} Q ${(fx + x) / 2} ${Math.min(fy, y) - 120} ${x + 130} ${y - 30}`}
                            fill="none"
                            stroke="#ca8a04"
                            strokeWidth={8}
                            strokeDasharray="4 16"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.3 + i * 0.5, duration: 1.4 }}
                        />
                        <motion.circle
                            cx={fx}
                            cy={fy}
                            r={30}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={5}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.5 }}
                        />
                        <text
                            x={fx}
                            y={fy + 70}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#78350f"
                            stroke="#ffffff"
                            strokeWidth={7}
                            paintOrder="stroke"
                        >
                            {i === 0 ? 'Lån fra Kuwait' : 'Lån'}
                        </text>
                    </g>
                ))}
        </g>
    );
}

function Boble({
    x,
    y,
    tekst,
    forsinkelse,
}: {
    x: number;
    y: number;
    tekst: string;
    forsinkelse: number;
}) {
    const b = tekst.length * 20 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse }}
        >
            <rect
                x={x - b / 2}
                y={y - 40}
                width={b}
                height={80}
                rx={20}
                fill="#ffffff"
                stroke="#7f1d1d"
                strokeWidth={6}
            />
            <path
                d={`M ${x + 40} ${y + 38} L ${x + 120} ${y + 120} L ${x + 90} ${y + 38} Z`}
                fill="#ffffff"
                stroke="#7f1d1d"
                strokeWidth={6}
            />
            <rect x={x + 38} y={y + 30} width={56} height={12} fill="#ffffff" />
            <text
                x={x}
                y={y + 12}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill="#7f1d1d"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Krav({ y, tekst, forsinkelse }: { y: number; tekst: string; forsinkelse: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 200, damping: 20 }}
        >
            <rect x={160} y={y - 40} width={480} height={80} rx={18} fill="#7f1d1d" />
            <text
                x={400}
                y={y + 14}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#ffffff"
            >
                {tekst}
            </text>
        </motion.g>
    );
}
