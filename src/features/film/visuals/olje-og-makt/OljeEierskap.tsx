import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Landene tar oljen tilbake. Tre rader, én per land, med en stolpe for hvem som eier
 * oljeselskapet. Grå = utenlandske selskaper, grønn = landet selv.
 * Beat 0: alle grå, og forklaringen på å nasjonalisere. Beat 1: Libya. Beat 2: Irak (IPC).
 * Beat 3: Saudi-Arabia eier 60 prosent av Aramco i 1974, så hele fra 1980. Beat 4: alle grønne.
 */

const B = 1600;
const H = 900;
const GRA = '#94a3b8';
const GRONN = '#15803d';

const STOLPE_X = 520;
const STOLPE_B = 900;
const STOLPE_H = 92;

interface Rad {
    land: string;
    fraBeat: number;
    merke: string;
    selskap: string;
}

const RADER: Rad[] = [
    { land: 'Libya', fraBeat: 1, merke: 'Årene etter 1969', selskap: 'oljeindustrien' },
    { land: 'Irak', fraBeat: 2, merke: '1972', selskap: 'IPC' },
    { land: 'Saudi-Arabia', fraBeat: 3, merke: '', selskap: 'Aramco' },
];

function Drape({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <path
            d={`M ${x} ${y - 34} C ${x + 26} ${y - 2}, ${x + 26} ${y + 22}, ${x} ${y + 22} C ${x - 26} ${y + 22}, ${x - 26} ${y - 2}, ${x} ${y - 34} Z`}
            fill={farge}
        />
    );
}

function Raden({ rad, i, beat }: { rad: Rad; i: number; beat: number }) {
    const y = 300 + i * 175;
    const egen = beat >= rad.fraBeat;
    const nyNa = beat === rad.fraBeat;
    const saudi = rad.land === 'Saudi-Arabia';
    // Saudi-Arabia: 60 prosent i beat 3 (1974), hele fra beat 4 (1980).
    const andel = !egen ? 0 : saudi && beat === 3 ? 0.6 : 1;
    const merke = saudi ? (beat === 3 ? '1974: 60 %' : beat >= 4 ? '1980: hele' : '') : rad.merke;
    return (
        <g>
            <Drape x={110} y={y + STOLPE_H / 2 + 6} farge={egen ? GRONN : GRA} />
            <text x={160} y={y + 62} fontSize={46} fontWeight={800} fill="#0f172a">
                {rad.land}
            </text>
            <rect x={STOLPE_X} y={y} width={STOLPE_B} height={STOLPE_H} rx={16} fill={GRA} />
            <motion.rect
                x={STOLPE_X}
                y={y}
                height={STOLPE_H}
                rx={16}
                fill={GRONN}
                initial={{ width: 0 }}
                animate={{ width: STOLPE_B * andel }}
                transition={{
                    duration: nyNa ? 1.6 : 0.6,
                    delay: nyNa ? 0.5 : 0,
                    ease: 'easeInOut',
                }}
            />
            <text x={STOLPE_X + 30} y={y + 60} fontSize={36} fontWeight={800} fill="#ffffff">
                {egen ? `Landet eier ${rad.selskap}` : 'Utenlandske selskaper'}
            </text>
            <AnimatePresence>
                {egen && merke && (
                    <motion.text
                        key={merke}
                        x={STOLPE_X + STOLPE_B}
                        y={y - 16}
                        textAnchor="end"
                        fontSize={34}
                        fontWeight={800}
                        fill={GRONN}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: nyNa ? 1.4 : 0.3 }}
                    >
                        {merke}
                    </motion.text>
                )}
            </AnimatePresence>
        </g>
    );
}

export function OljeEierskap({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-stone-50">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <text
                    x={B / 2}
                    y={110}
                    textAnchor="middle"
                    fontSize={54}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Hvem eier oljen?
                </text>
                {RADER.map((rad, i) => (
                    <Raden key={rad.land} rad={rad} i={i} beat={beat} />
                ))}
                <AnimatePresence>
                    {beat === 0 && (
                        <motion.g
                            key="forklaring"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <rect x={300} y={790} width={1000} height={80} rx={22} fill="#0f172a" />
                            <text
                                x={800}
                                y={843}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="#ffffff"
                            >
                                Nasjonalisere = staten tar over selskapet
                            </text>
                        </motion.g>
                    )}
                    {beat >= 4 && (
                        <motion.g
                            key="melding"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{ transformOrigin: '800px 830px' }}
                        >
                            <rect x={260} y={790} width={1080} height={80} rx={22} fill={GRONN} />
                            <text
                                x={800}
                                y={843}
                                textAnchor="middle"
                                fontSize={38}
                                fontWeight={800}
                                fill="#ffffff"
                            >
                                Oljen tilhører landet den kommer fra
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
        </div>
    );
}
