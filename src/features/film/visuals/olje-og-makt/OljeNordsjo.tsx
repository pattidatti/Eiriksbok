import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Ekofisk i Nordsjøen, sett fra siden: luft, hav, havbunn og oljen under.
 * Beat 0: et skip leter etter olje, og bilene skal bruke mindre bensin.
 * Beat 1: plattformen reiser seg (drivverdig lille julaften 1969).
 * Beat 2: oljen strømmer opp (produksjonen starter 1971).
 * Beat 3: prisen firedobles, og en del av pengene går til staten som skatt (loven fra 1975).
 */

const B = 1600;
const H = 900;
const HAV = 330;
const BUNN = 660;
const PX = 800;

function Kort({
    x,
    y,
    b,
    linjer,
    farge = '#ffffff',
    tekst = '#0f172a',
}: {
    x: number;
    y: number;
    b: number;
    linjer: string[];
    farge?: string;
    tekst?: string;
}) {
    return (
        <g>
            <rect
                x={x - b / 2}
                y={y}
                width={b}
                height={30 + linjer.length * 46}
                rx={20}
                fill={farge}
                stroke="#0f172a"
                strokeOpacity={0.15}
                strokeWidth={3}
            />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x}
                    y={y + 58 + i * 46}
                    textAnchor="middle"
                    fontSize={i === 0 ? 38 : 30}
                    fontWeight={i === 0 ? 900 : 700}
                    fill={tekst}
                >
                    {l}
                </text>
            ))}
        </g>
    );
}

function Leteskip() {
    return (
        <g>
            <motion.g
                animate={{ x: [-260, 260] }}
                transition={{
                    duration: 7,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                }}
            >
                <path
                    d={`M ${PX - 90} ${HAV - 30} L ${PX + 90} ${HAV - 30} L ${PX + 66} ${HAV + 6} L ${PX - 66} ${HAV + 6} Z`}
                    fill="#1e3a8a"
                />
                <rect
                    x={PX - 30}
                    y={HAV - 70}
                    width={60}
                    height={40}
                    fill="#f8fafc"
                    stroke="#1e3a8a"
                    strokeWidth={4}
                />
                {[0, 1, 2].map((i) => (
                    <motion.ellipse
                        key={i}
                        cx={PX}
                        cy={HAV + 10}
                        fill="none"
                        stroke="#1e3a8a"
                        strokeWidth={5}
                        initial={{ rx: 20, ry: 8, opacity: 0.9 }}
                        animate={{ rx: [20, 200], ry: [8, 300], opacity: [0.9, 0] }}
                        transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8 }}
                    />
                ))}
            </motion.g>
        </g>
    );
}

function Plattform({ reiser }: { reiser: boolean }) {
    const dekk = HAV - 120;
    return (
        <motion.g
            initial={{ y: reiser ? 520 : 0 }}
            animate={{ y: 0 }}
            transition={{ duration: 2.2, ease: 'easeOut', delay: reiser ? 0.3 : 0 }}
        >
            {[-110, -40, 40, 110].map((dx) => (
                <rect
                    key={dx}
                    x={PX + dx - 9}
                    y={dekk + 30}
                    width={18}
                    height={BUNN - dekk - 30}
                    fill="#475569"
                />
            ))}
            <path
                d={`M ${PX - 110} ${dekk + 60} L ${PX + 110} ${BUNN - 20} M ${PX + 110} ${dekk + 60} L ${PX - 110} ${BUNN - 20}`}
                stroke="#64748b"
                strokeWidth={8}
            />
            <rect
                x={PX - 170}
                y={dekk}
                width={340}
                height={40}
                fill="#f59e0b"
                stroke="#78350f"
                strokeWidth={4}
            />
            <rect
                x={PX - 140}
                y={dekk - 70}
                width={130}
                height={70}
                fill="#e2e8f0"
                stroke="#334155"
                strokeWidth={4}
            />
            <path
                d={`M ${PX + 50} ${dekk} L ${PX + 80} ${dekk - 170} L ${PX + 110} ${dekk} Z`}
                fill="none"
                stroke="#334155"
                strokeWidth={7}
            />
        </motion.g>
    );
}

function Olja({ beat }: { beat: number }) {
    const dekk = HAV - 120;
    return (
        <>
            <ellipse cx={PX} cy={790} rx={420} ry={60} fill={beat >= 2 ? '#1c1917' : '#44403c'} />
            {beat >= 2 && (
                <>
                    <rect
                        x={PX - 6}
                        y={dekk + 40}
                        width={12}
                        height={790 - dekk - 40}
                        fill="#1c1917"
                    />
                    {[0, 1, 2, 3].map((i) => (
                        <motion.circle
                            key={i}
                            cx={PX}
                            r={11}
                            fill="#78350f"
                            initial={{ cy: 780, opacity: 0 }}
                            animate={{ cy: [780, dekk + 40], opacity: [0, 1, 1, 0] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'linear',
                            }}
                        />
                    ))}
                    <motion.path
                        d={`M ${PX + 170} ${dekk + 10} q 40 -40 20 -90 q 40 30 30 90 Z`}
                        fill="#f97316"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        style={{ transformOrigin: `${PX + 190}px ${dekk + 10}px` }}
                    />
                </>
            )}
        </>
    );
}

function Skatt() {
    const fra: [number, number] = [PX + 180, HAV - 110];
    return (
        <g>
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.circle
                    key={i}
                    r={20}
                    fill="#eab308"
                    stroke="#a16207"
                    strokeWidth={4}
                    initial={{ cx: fra[0], cy: fra[1], opacity: 0 }}
                    animate={{ cx: [fra[0], 1330], cy: [fra[1], 170], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: 0.6 + i * 0.45 }}
                />
            ))}
            <g>
                <rect
                    x={1260}
                    y={90}
                    width={200}
                    height={120}
                    fill="#f8fafc"
                    stroke="#334155"
                    strokeWidth={5}
                />
                <path d="M 1240 92 L 1360 30 L 1480 92 Z" fill="#334155" />
                {[0, 1, 2, 3].map((i) => (
                    <rect key={i} x={1282 + i * 46} y={110} width={20} height={80} fill="#94a3b8" />
                ))}
                <text
                    x={1360}
                    y={252}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Staten
                </text>
            </g>
        </g>
    );
}

export function OljeNordsjo({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0" style={{ background: '#dbeafe' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <rect x={0} y={HAV} width={B} height={BUNN - HAV} fill="#3b82f6" />
                <rect x={0} y={BUNN} width={B} height={H - BUNN} fill="#a8a29e" />
                <rect x={0} y={BUNN} width={B} height={14} fill="#d6d3d1" />
                <text x={60} y={HAV + 60} fontSize={36} fontWeight={800} fill="#ffffff">
                    Nordsjøen
                </text>
                <text x={60} y={BUNN + 70} fontSize={30} fontWeight={700} fill="#292524">
                    havbunnen
                </text>
                <Olja beat={beat} />
                {beat >= 1 && (
                    <text
                        x={PX}
                        y={870}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#fafaf9"
                    >
                        olje under havbunnen
                    </text>
                )}
                {beat === 0 && <Leteskip />}
                {beat >= 1 && <Plattform reiser={beat === 1} />}
                {beat >= 1 && (
                    <text
                        x={PX - 220}
                        y={HAV - 140}
                        textAnchor="end"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Ekofisk
                    </text>
                )}
                {beat >= 3 && <Skatt />}
                <AnimatePresence mode="wait">
                    <motion.g
                        key={beat}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {beat === 0 && (
                            <>
                                <Kort
                                    x={330}
                                    y={40}
                                    b={500}
                                    linjer={['Leter etter olje hjemme', 'etter krisen i 1973']}
                                />
                                <Kort
                                    x={1270}
                                    y={40}
                                    b={500}
                                    linjer={['Nye biler', 'bruker mindre bensin']}
                                />
                            </>
                        )}
                        {beat === 1 && (
                            <Kort
                                x={1270}
                                y={60}
                                b={540}
                                linjer={[
                                    'Lille julaften 1969',
                                    'drivverdig: det lønner seg',
                                    'å hente oljen opp',
                                ]}
                                farge="#fef3c7"
                            />
                        )}
                        {beat === 2 && (
                            <Kort
                                x={1270}
                                y={60}
                                b={540}
                                linjer={['1971', 'produksjonen starter']}
                                farge="#fef3c7"
                            />
                        )}
                        {beat >= 3 && (
                            <Kort
                                x={300}
                                y={20}
                                b={500}
                                linjer={['1975: ny lov', 'mye høyere skatt på oljen']}
                                farge="#fde68a"
                            />
                        )}
                    </motion.g>
                </AnimatePresence>
            </svg>
        </div>
    );
}
