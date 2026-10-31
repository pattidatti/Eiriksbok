import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Forenklet befolkningspyramide: ti aldersgrupper, de yngste nederst. Formen er en skisse
 * av det artikkelen sier (folk lever lenger, færre barn, etterkrigskullene blir gamle),
 * ikke tall fra SSB. Derfor står «forenklet skisse» i bildet.
 *
 * «lenger»: en klassisk pyramide som får bredere topp, og så forventet levealder.
 * «kull»: bunnen blir smal, etterkrigskullet lyser opp og flytter seg mot toppen.
 */

type Modus = 'lenger' | 'kull';

const B = 1600;
const H = 900;
const MIDT = 640;
const BUNN = 820;
const BAND = 60;
const GAP = 6;

const KLASSISK = [540, 500, 459, 412, 358, 297, 230, 155, 81, 27];
const LANGT_LIV = [513, 500, 479, 459, 432, 398, 358, 304, 216, 108];
const FAA_BARN = [338, 371, 446, 473, 459, 446, 432, 392, 243, 115];
const KULL_NAA = [338, 371, 446, 473, 459, 446, 432, 466, 243, 115];
const KULL_SENERE = [324, 358, 432, 466, 466, 446, 432, 405, 392, 162];

interface Steg {
    bredder: number[];
    lys?: number;
    tittel: string;
}

const STEG: Record<Modus, Steg[]> = {
    lenger: [
        { bredder: KLASSISK, tittel: 'En befolkningspyramide' },
        { bredder: LANGT_LIV, tittel: 'Folk lever lenger' },
        { bredder: LANGT_LIV, tittel: 'Ventet levealder' },
        { bredder: LANGT_LIV, tittel: 'Ventet levealder' },
    ],
    kull: [
        { bredder: FAA_BARN, tittel: 'Færre barn blir født' },
        { bredder: FAA_BARN, tittel: 'Små barnekull' },
        { bredder: KULL_NAA, lys: 7, tittel: 'Etterkrigskullene' },
        { bredder: KULL_SENERE, lys: 8, tittel: 'Etterkrigskullene blir gamle' },
        { bredder: KULL_SENERE, lys: 8, tittel: 'Bredere topp' },
    ],
};

const yFor = (alder: number) => BUNN - (alder / 10) * BAND;

function Merke({ tekst, alder, farge, fraBeat, beat, dy }: { tekst: string; alder: number; farge: string; fraBeat: number; beat: number; dy: number }) {
    if (beat < fraBeat) return null;
    const y = yFor(alder);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: fraBeat === beat ? 0.4 : 0 }}>
            <line x1={MIDT - 560} y1={y} x2={MIDT + 560} y2={y} stroke={farge} strokeWidth={6} />
            <circle cx={MIDT + 560} cy={y} r={11} fill={farge} />
            <text
                x={MIDT + 590}
                y={y + 16 + dy}
                fontSize={48}
                fontWeight={900}
                fill={farge}
                stroke="#f8fafc"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

export function EldrebolgenPyramide({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'lenger';
    const liste = STEG[modus];
    const steg = liste[Math.min(beat, liste.length - 1)];
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={steg.tittel}
                        x={800}
                        y={90}
                        textAnchor="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {steg.tittel}
                    </motion.text>
                </AnimatePresence>

                {/* Aldersakse */}
                {[0, 20, 40, 60, 80].map((a) => (
                    <text key={a} x={150} y={yFor(a) + 10} textAnchor="end" fontSize={30} fontWeight={800} fill="#64748b">
                        {a} år
                    </text>
                ))}
                <text x={40} y={BUNN + 60} fontSize={26} fontWeight={700} fill="#64748b">
                    Forenklet skisse
                </text>

                {steg.bredder.map((b, i) => {
                    const lys = steg.lys === i;
                    const topp = i >= 7 && modus === 'kull' && beat >= 4;
                    const farge = lys ? '#ea580c' : topp ? '#fb923c' : i >= 7 ? '#94a3b8' : i <= 1 && modus === 'kull' && beat <= 1 ? '#38bdf8' : '#0d9488';
                    return (
                        <motion.rect
                            key={i}
                            y={BUNN - (i + 1) * BAND + GAP / 2}
                            height={BAND - GAP}
                            rx={8}
                            initial={{ x: MIDT - KLASSISK[i] / 2, width: KLASSISK[i] }}
                            animate={{ x: MIDT - b / 2, width: b, fill: farge }}
                            transition={{ duration: 1.6, ease: 'easeInOut' }}
                        />
                    );
                })}

                {/* Etiketter til høyre for pyramiden */}
                {modus === 'kull' && beat <= 1 && (
                    <motion.text
                        x={MIDT + 260}
                        y={BUNN - BAND + 14}
                        fontSize={42}
                        fontWeight={900}
                        fill="#0369a1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        {beat === 0 ? '← færre barn' : '← små kull'}
                    </motion.text>
                )}
                {modus === 'kull' && beat === 1 && (
                    <motion.text
                        x={MIDT + 300}
                        y={yFor(85) + 14}
                        fontSize={42}
                        fontWeight={900}
                        fill="#475569"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        ← eldre blir en større del
                    </motion.text>
                )}
                {modus === 'kull' && beat >= 2 && steg.lys !== undefined && (
                    <motion.text
                        key={beat}
                        x={MIDT + 330}
                        y={BUNN - steg.lys * BAND - BAND / 2 + 14}
                        fontSize={42}
                        fontWeight={900}
                        fill="#c2410c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        {beat === 2 ? '← født etter krigen' : beat === 3 ? '← blir 80 år og eldre' : '← bredere topp'}
                    </motion.text>
                )}
                {modus === 'lenger' && beat === 1 && (
                    <motion.text
                        x={MIDT + 300}
                        y={yFor(85) + 14}
                        fontSize={42}
                        fontWeight={900}
                        fill="#0f766e"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        ← færre dør unge
                    </motion.text>
                )}
                {modus === 'lenger' && (
                    <>
                        <Merke tekst="83,6 år i 2026" alder={83.6} farge="#2563eb" fraBeat={2} beat={beat} dy={34} />
                        <Merke tekst="87,2 år i 2050" alder={87.2} farge="#c2410c" fraBeat={3} beat={beat} dy={-34} />
                    </>
                )}
            </svg>
        </div>
    );
}
