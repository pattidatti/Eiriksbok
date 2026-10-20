import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Landsbygda i Deng-filmen: en åker, statens lager til venstre og en salgsbod til høyre.
 * - beat 0: hele høsten bæres til staten.
 * - beat 1: en del av sekkene går til boden, der bonden selger selv.
 * - beat 2: åkeren gror tettere, det kommer flere sekker, og bonden får egne penger.
 */

const B = 1600;
const H = 900;

const OVERSKRIFT = [
    'Før: staten styrer det meste',
    'Nå: bonden selger en del selv',
    'Mer mat, egne penger',
];

/** Plassen til sekk nr. i i en haug med bunnen midt på (x, y). */
function iHaug(i: number, x: number, y: number) {
    // Rader med 4, 3, 2 og 1 sekk.
    let rad = 0;
    let rest = i;
    while (rest >= 4 - rad) {
        rest -= 4 - rad;
        rad++;
    }
    const antall = 4 - rad;
    return { x: x + (rest - (antall - 1) / 2) * 74, y: y - rad * 58 };
}

const LAGER = { x: 300, y: 770 };
const BOD = { x: 1300, y: 770 };
/** Høsten i sekker. Først står alle ved lageret, fra beat 1 går nr. 6-9 til boden. */
const SEKKER = 10;
const EKSTRA = 3;

function sekkMål(i: number, beat: number) {
    if (i >= SEKKER) return iHaug(i - SEKKER + 4, BOD.x, BOD.y);
    if (beat >= 1 && i >= 6) return iHaug(i - 6, BOD.x, BOD.y);
    return iHaug(i, LAGER.x, LAGER.y);
}

function Sekk() {
    return (
        <g>
            <path
                d="M -30 0 Q -36 -40 -14 -50 L -8 -60 L 8 -60 L 14 -50 Q 36 -40 30 0 Z"
                fill="#d6b27a"
                stroke="#92673a"
                strokeWidth={4}
            />
            <path d="M -10 -54 L 10 -54" stroke="#92673a" strokeWidth={5} />
            <path
                d="M 0 -12 L 0 -38 M 0 -22 L -9 -30 M 0 -22 L 9 -30 M 0 -32 L -7 -39 M 0 -32 L 7 -39"
                stroke="#92673a"
                strokeWidth={4}
                strokeLinecap="round"
            />
        </g>
    );
}

/** Åkeren: rader med strå som blir høyere og gyldnere i beat 2. */
function Aker({ rik }: { rik: boolean }) {
    const rader = 6;
    const per = 16;
    const strå = [];
    for (let r = 0; r < rader; r++) {
        for (let k = 0; k < per; k++) {
            const t = r / (rader - 1);
            const bredde = 520 + t * 260;
            const x = B / 2 - bredde / 2 + (k + 0.5) * (bredde / per);
            const y = 470 + r * 34;
            strå.push({ x, y, s: 0.7 + t * 0.5, nøkkel: `${r}-${k}` });
        }
    }
    return (
        <g>
            <path d="M 540 455 L 1060 455 L 1210 690 L 390 690 Z" fill="#8a6a3e" />
            {strå.map((p) => {
                const s = p.s * (rik ? 1.5 : 1);
                return (
                    <motion.path
                        key={p.nøkkel}
                        initial={false}
                        animate={{
                            d: `M ${p.x} ${p.y} L ${p.x - 7 * s} ${p.y - 26 * s} L ${p.x} ${p.y - 40 * s} L ${p.x + 7 * s} ${p.y - 26 * s} Z`,
                            fill: rik ? '#eab308' : '#a3a35a',
                        }}
                        transition={{ duration: 1.2, delay: rik ? 0.2 : 0 }}
                    />
                );
            })}
        </g>
    );
}

function Lager() {
    return (
        <g transform={`translate(${LAGER.x} 560)`}>
            <path d="M -170 -10 L 0 -110 L 170 -10 Z" fill="#7f1d1d" />
            <rect x={-150} y={-10} width={300} height={160} fill="#b91c1c" />
            <rect x={-40} y={60} width={80} height={90} fill="#7f1d1d" />
            <rect x={-95} y={-74} width={190} height={50} rx={10} fill="#fff" />
            <text x={0} y={-38} textAnchor="middle" fontSize={34} fontWeight={900} fill="#991b1b">
                Staten
            </text>
        </g>
    );
}

function Bod({ aktiv }: { aktiv: boolean }) {
    return (
        <motion.g
            initial={{ opacity: 0.3 }}
            animate={{ opacity: aktiv ? 1 : 0.3 }}
            transition={{ duration: 0.8 }}
        >
            <g transform={`translate(${BOD.x} 560)`}>
                <rect x={-140} y={40} width={280} height={110} fill="#0f766e" />
                <rect x={-150} y={20} width={300} height={24} fill="#115e59" />
                <path
                    d="M -160 -40 L 160 -40 L 150 20 L -150 20 Z"
                    fill="#14b8a6"
                    stroke="#0f766e"
                    strokeWidth={4}
                />
                {[-110, -50, 10, 70, 130].map((x) => (
                    <path
                        key={x}
                        d={`M ${x} -40 L ${x - 10} 20`}
                        stroke="#ccfbf1"
                        strokeWidth={14}
                    />
                ))}
                <rect x={-120} y={-104} width={240} height={50} rx={10} fill="#fff" />
                <text
                    x={0}
                    y={-68}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill="#0f766e"
                >
                    Selges selv
                </text>
            </g>
        </motion.g>
    );
}

function Bonde() {
    return (
        <g transform="translate(800 430)">
            <path
                d="M -46 -66 L 0 -96 L 46 -66 Z"
                fill="#ca8a04"
                stroke="#854d0e"
                strokeWidth={4}
            />
            <circle cx={0} cy={-52} r={16} fill="#f5d0a9" />
            <path d="M -24 -34 L 24 -34 L 30 20 L -30 20 Z" fill="#1e3a8a" />
            <path d="M -18 20 L -18 50 M 18 20 L 18 50" stroke="#1e3a8a" strokeWidth={12} />
        </g>
    );
}

export function DengAker({ beat }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const selger = beat >= 1;
    const rik = beat >= 2;
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-200 to-amber-50">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <path
                    d="M 0 420 Q 300 330 620 400 Q 900 330 1200 390 Q 1420 340 1600 400 L 1600 900 L 0 900 Z"
                    fill="#86a65c"
                />
                <path
                    d="M 0 520 Q 500 470 800 500 Q 1200 470 1600 520 L 1600 900 L 0 900 Z"
                    fill="#9cba6a"
                />
                <Aker rik={rik} />
                <Lager />
                <Bod aktiv={selger} />
                <Bonde />

                {/* Stiene høsten går */}
                <motion.path
                    d="M 520 720 Q 470 760 420 770"
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray="4 22"
                />
                <motion.path
                    d="M 1080 720 Q 1130 760 1180 770"
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray="4 22"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: selger ? 1 : 0 }}
                    transition={{ duration: 0.6 }}
                />

                {Array.from({ length: SEKKER + EKSTRA }, (_, i) => {
                    const ekstra = i >= SEKKER;
                    const mål = sekkMål(i, beat);
                    const vis = !ekstra || rik;
                    return (
                        <motion.g
                            key={i}
                            initial={{ x: mål.x, y: mål.y, opacity: vis ? 1 : 0 }}
                            animate={{ x: mål.x, y: mål.y, opacity: vis ? 1 : 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 60,
                                damping: 16,
                                delay: ekstra ? 0.9 + (i - SEKKER) * 0.25 : 0.3 + (i % 6) * 0.12,
                            }}
                        >
                            <Sekk />
                        </motion.g>
                    );
                })}

                {/* Egne penger: mynter over boden */}
                {[0, 1, 2, 3].map((i) => (
                    <motion.g
                        key={`mynt-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: rik ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: rik ? 1.6 + i * 0.2 : 0 }}
                    >
                        <circle
                            cx={BOD.x - 120 + i * 80}
                            cy={385}
                            r={28}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={5}
                        />
                        <circle
                            cx={BOD.x - 120 + i * 80}
                            cy={385}
                            r={14}
                            fill="none"
                            stroke="#a16207"
                            strokeWidth={3}
                        />
                    </motion.g>
                ))}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap z-10"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: rik ? 1 : 0 }}
                transition={{ duration: 0.6, delay: rik ? 1 : 0 }}
                className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-xl bg-white shadow-lg text-2xl font-black text-teal-700 whitespace-nowrap"
                style={{ top: '19%' }}
            >
                Matproduksjonen steg
            </motion.div>
        </div>
    );
}
