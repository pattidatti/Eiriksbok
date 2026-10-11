import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Brikke, GassRor, GassStil, RUSSLAND_ROD } from './felles';

/**
 * Putins to feilregninger, og opptrappingen som en trapp.
 * Beat 0: to tankebobler, «rask seier» og «Vesten ser bort». Beat 1: begge får et kryss, og
 * Ukrainas skjold kommer fram. Beat 2: trappa Georgia 2008, Krim 2014, Ukraina 2022, hvert
 * steg høyere enn det forrige. Beat 3: under trappa renner gassen vestover, helt til 2022.
 */

const MORK = '#1e293b';
const TRINN = [
    { ar: '2008', navn: 'Georgia', hoyde: 130 },
    { ar: '2014', navn: 'Krim', hoyde: 270 },
    { ar: '2022', navn: 'Ukraina', hoyde: 430 },
];

export function RusslandTrappa({ beat, playing }: VisualProps) {
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1f5f9' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <GassStil />
                {beat <= 1 ? <Feilregning beat={beat} /> : <Trapp beat={beat} playing={playing} />}
            </svg>
            <AnimatePresence>
                {beat === 0 && <Brikke key="b0" tekst="Putin regnet med to ting" />}
                {beat === 1 && <Brikke key="b1" tekst="Han tok feil på begge" farge="rod" />}
                {beat === 2 && <Brikke key="b2" tekst="Hvert steg større enn det forrige" />}
                {beat === 3 && <Brikke key="b3" tekst="Og gassen fortsatte å strømme" farge="mork" />}
            </AnimatePresence>
        </div>
    );
}

function Feilregning({ beat }: { beat: number }) {
    const bobler = [
        { x: 460, tekst: ['En rask', 'seier'] },
        { x: 1140, tekst: ['Vesten ser', 'en annen vei'] },
    ];
    return (
        <g>
            {bobler.map((b, i) => (
                <motion.g key={i} initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + i * 1.2, type: 'spring', damping: 14 }} style={{ transformOrigin: `${b.x}px 420px` }}>
                    <ellipse cx={b.x} cy={420} rx={290} ry={170} fill="#ffffff" stroke={MORK} strokeWidth={6} />
                    <circle cx={b.x - 140 + i * 280} cy={640} r={34} fill="#ffffff" stroke={MORK} strokeWidth={6} />
                    <circle cx={b.x - 180 + i * 360} cy={710} r={20} fill="#ffffff" stroke={MORK} strokeWidth={6} />
                    {b.tekst.map((t, j) => (
                        <text key={t} x={b.x} y={405 + j * 66} textAnchor="middle" fontSize={58} fontWeight={900} fill={MORK}>
                            {t}
                        </text>
                    ))}
                    {beat === 1 && (
                        <motion.g
                            initial={{ opacity: 0, scale: 1.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.6, type: 'spring', stiffness: 260, damping: 16 }}
                            style={{ transformOrigin: `${b.x}px 420px` }}
                            stroke={RUSSLAND_ROD}
                            strokeWidth={22}
                            strokeLinecap="round"
                        >
                            <line x1={b.x - 160} y1={300} x2={b.x + 160} y2={540} />
                            <line x1={b.x + 160} y1={300} x2={b.x - 160} y2={540} />
                        </motion.g>
                    )}
                </motion.g>
            ))}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2 }}>
                    <path d="M 800 650 L 880 680 Q 876 800 800 850 Q 724 800 720 680 Z" fill="#facc15" stroke={MORK} strokeWidth={6} />
                    <path d="M 720 680 L 800 650 L 880 680 Q 880 730 878 745 L 722 745 Q 720 730 720 680 Z" fill="#2563eb" />
                    <text x={1010} y={770} fontSize={44} fontWeight={900} fill={MORK}>
                        Ukrainerne kjempet imot
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Trapp({ beat, playing }: { beat: number; playing: boolean }) {
    const bunn = 700;
    return (
        <g>
            {TRINN.map((t, i) => {
                const x = 220 + i * 400;
                return (
                    <g key={t.ar}>
                        <motion.rect
                            x={x}
                            width={360}
                            fill={i === 2 ? RUSSLAND_ROD : i === 1 ? '#dc2626' : '#f87171'}
                            stroke={MORK}
                            strokeWidth={5}
                            initial={{ y: bunn, height: 0 }}
                            animate={{ y: bunn - t.hoyde, height: t.hoyde }}
                            transition={{ delay: 0.5 + i * 0.9, duration: 0.9, ease: 'easeOut' }}
                        />
                        <motion.text
                            x={x + 180}
                            y={bunn - t.hoyde - 70}
                            textAnchor="middle"
                            fontSize={60}
                            fontWeight={900}
                            fill={MORK}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 + i * 0.9 }}
                        >
                            {t.navn}
                        </motion.text>
                        <motion.text
                            x={x + 180}
                            y={bunn - t.hoyde - 20}
                            textAnchor="middle"
                            fontSize={42}
                            fontWeight={800}
                            fill="#475569"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 + i * 0.9 }}
                        >
                            {t.ar}
                        </motion.text>
                    </g>
                );
            })}
            {beat === 3 && (
                <>
                    <GassRor d="M 980 790 L 80 790" playing={playing} bredde={34} forsinkelse={0.3} />
                    <GassRor d="M 1560 790 L 1080 790" playing={playing} stoppet bredde={34} forsinkelse={0.3} />
                    <motion.text
                        x={800}
                        y={870}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#b45309"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                    >
                        Gass til Europa, år etter år, helt til 2022
                    </motion.text>
                </>
            )}
        </g>
    );
}
