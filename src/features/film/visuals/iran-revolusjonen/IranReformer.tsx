import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Den hvite revolusjonen som et landskap som forandrer seg. En liten by med moskeen i midten.
 * Så kommer stemmeurna, jorda deles i små åkre, fabrikken og universitetet reiser seg mens
 * moskeen blir mindre, og til slutt pumper oljetårnet penger inn mot byen.
 */

const B = 1600;
const H = 900;
const BAKKE = 700;

const BRIKKER = [
    'Den hvite revolusjonen',
    'Kvinner får stemmerett',
    'Jord til bøndene',
    'Et moderne land',
    'Oljepengene strømmer inn',
];

/** Vokser opp fra bakken når den skal vises. */
function Reis({ vis, children }: { vis: boolean; children: React.ReactNode }) {
    return (
        <motion.g
            initial={false}
            animate={{ scaleY: vis ? 1 : 0, opacity: vis ? 1 : 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        >
            {children}
        </motion.g>
    );
}

function Hus({ x, b, h }: { x: number; b: number; h: number }) {
    return (
        <g>
            <rect
                x={x}
                y={BAKKE - h}
                width={b}
                height={h}
                fill="#e7d3b1"
                stroke="#a8875b"
                strokeWidth={4}
            />
            <rect
                x={x + b * 0.35}
                y={BAKKE - h * 0.5}
                width={b * 0.3}
                height={h * 0.5}
                fill="#a8875b"
            />
        </g>
    );
}

function Moske({ liten }: { liten: boolean }) {
    return (
        <motion.g
            initial={false}
            animate={{ scale: liten ? 0.62 : 1, opacity: liten ? 0.55 : 1 }}
            transition={{ duration: 1.2 }}
            style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        >
            <rect
                x={720}
                y={520}
                width={160}
                height={180}
                fill="#5eead4"
                stroke="#0f766e"
                strokeWidth={5}
            />
            <path
                d="M 720 520 Q 800 400 880 520 Z"
                fill="#14b8a6"
                stroke="#0f766e"
                strokeWidth={5}
            />
            <rect
                x={900}
                y={400}
                width={30}
                height={300}
                fill="#5eead4"
                stroke="#0f766e"
                strokeWidth={5}
            />
            <path
                d="M 895 400 L 915 350 L 935 400 Z"
                fill="#14b8a6"
                stroke="#0f766e"
                strokeWidth={4}
            />
            <path d="M 770 700 L 770 630 Q 800 600 830 630 L 830 700 Z" fill="#0f766e" />
        </motion.g>
    );
}

function Stemmeurne({ vis }: { vis: boolean }) {
    return (
        <Reis vis={vis}>
            {/* Kvinne som legger en stemmeseddel i urna */}
            <circle cx={360} cy={500} r={26} fill="#1e293b" />
            <path d="M 325 700 L 335 540 Q 360 525 385 540 L 395 700 Z" fill="#7c3aed" />
            <path d="M 330 470 Q 360 440 390 470 L 392 520 Q 360 505 328 520 Z" fill="#1e293b" />
            <rect
                x={420}
                y={590}
                width={120}
                height={110}
                fill="#f8fafc"
                stroke="#334155"
                strokeWidth={5}
            />
            <rect x={455} y={588} width={50} height={8} fill="#334155" />
            <motion.rect
                x={465}
                width={30}
                height={40}
                fill="#fde68a"
                stroke="#b45309"
                strokeWidth={3}
                initial={false}
                animate={{ y: vis ? 548 : 520, opacity: vis ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
            />
        </Reis>
    );
}

function Aker({ vis }: { vis: boolean }) {
    const ruter = [0, 1, 2, 3];
    return (
        <g>
            {/* Ett stort jorde blir til fire små åkre, ett for hver bonde */}
            <rect x={1300} y={BAKKE - 6} width={280} height={12} fill="#a16207" />
            {ruter.map((i) => (
                <motion.rect
                    key={i}
                    x={1300 + i * 70 + 3}
                    width={64}
                    fill={i % 2 ? '#84cc16' : '#65a30d'}
                    initial={false}
                    animate={{ y: vis ? BAKKE - 70 : BAKKE - 6, height: vis ? 64 : 6 }}
                    transition={{ duration: 0.9, delay: vis ? i * 0.25 : 0 }}
                />
            ))}
            {ruter.map((i) => (
                <motion.g
                    key={`b${i}`}
                    initial={false}
                    animate={{ opacity: vis ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: vis ? 0.6 + i * 0.25 : 0 }}
                >
                    <circle cx={1335 + i * 70} cy={BAKKE - 120} r={13} fill="#1e293b" />
                    <rect x={1325 + i * 70} y={BAKKE - 106} width={20} height={36} fill="#78350f" />
                </motion.g>
            ))}
        </g>
    );
}

function Fabrikk({ vis }: { vis: boolean }) {
    return (
        <Reis vis={vis}>
            {/* Fabrikken */}
            <path
                d="M 960 700 L 960 560 L 1010 600 L 1010 560 L 1060 600 L 1060 560 L 1110 600 L 1110 700 Z"
                fill="#94a3b8"
                stroke="#475569"
                strokeWidth={5}
            />
            <rect x={975} y={440} width={30} height={130} fill="#64748b" />
            {/* Universitetet med søyler */}
            <path
                d="M 1120 560 L 1200 515 L 1280 560 Z"
                fill="#f1f5f9"
                stroke="#475569"
                strokeWidth={5}
            />
            <rect
                x={1125}
                y={560}
                width={150}
                height={140}
                fill="#f8fafc"
                stroke="#475569"
                strokeWidth={5}
            />
            {[1145, 1180, 1215, 1250].map((x) => (
                <rect key={x} x={x - 6} y={575} width={12} height={110} fill="#cbd5e1" />
            ))}
        </Reis>
    );
}

function Oljetarn({ vis }: { vis: boolean }) {
    return (
        <g>
            <Reis vis={vis}>
                <path
                    d="M 150 700 L 200 420 L 250 700"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth={10}
                />
                <path
                    d="M 165 620 L 235 620 M 175 540 L 225 540 M 185 470 L 215 470"
                    stroke="#1e293b"
                    strokeWidth={7}
                />
                <path
                    d="M 165 620 L 225 540 M 235 620 L 175 540"
                    stroke="#1e293b"
                    strokeWidth={5}
                />
                <rect x={130} y={690} width={140} height={14} fill="#1e293b" />
            </Reis>
            {/* Pengene går langs bakken inn mot byen */}
            {vis &&
                [0, 1, 2, 3, 4].map((i) => (
                    <motion.circle
                        key={i}
                        r={18}
                        cy={BAKKE + 50}
                        fill="#facc15"
                        stroke="#a16207"
                        strokeWidth={4}
                        initial={{ cx: 260, opacity: 0 }}
                        animate={{ cx: [260, 900], opacity: [0, 1, 1, 0] }}
                        transition={{
                            duration: 3,
                            delay: 0.8 + i * 0.6,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                ))}
        </g>
    );
}

export function IranReformer({ beat }: VisualProps) {
    const brikke = BRIKKER[Math.min(beat, BRIKKER.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-200 to-amber-50">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <circle cx={1420} cy={240} r={70} fill="#fde047" opacity={0.9} />
                <motion.text
                    x={800}
                    y={260}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={false}
                    animate={{ opacity: beat === 0 ? 0.85 : 0 }}
                    transition={{ duration: 0.6 }}
                >
                    1960-tallet
                </motion.text>
                <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#d6b98c" />
                <Hus x={590} b={100} h={90} />
                <Hus x={645} b={60} h={130} />
                <Moske liten={beat >= 3} />
                <Stemmeurne vis={beat >= 1} />
                <Aker vis={beat >= 2} />
                <Fabrikk vis={beat >= 3} />
                <Oljetarn vis={beat >= 4} />
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={beat}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute top-[4%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap bg-white/95 text-slate-900"
                >
                    {brikke}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
