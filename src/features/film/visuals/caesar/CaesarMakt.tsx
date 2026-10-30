import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { frø } from './felles3d';

/**
 * Maktens byggesteiner, tegnet som 2D. Modus «ung»: mange familier slåss om noen få
 * toppjobber, og Cæsar klatrer mens gjelda vokser. «helt»: de tre tingene han hadde
 * etter Gallia (penger, folket og hæren) fylles én etter én. «etterpa»: republikken er
 * et tempel som står, rister og faller, og Augustus tar over.
 */

type Modus = 'ung' | 'helt' | 'etterpa';

const LILLA = '#7e22ce';
const GULL = '#ca8a04';
const ROD = '#b91c1c';
const MORK = '#1c1917';
const GRA = '#a8a29e';

export function CaesarMakt({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'ung';
    return (
        <div className="absolute inset-0 bg-[#f6f1e7] overflow-hidden">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'ung' && <Ung beat={beat} />}
                {modus === 'helt' && <Helt beat={beat} />}
                {modus === 'etterpa' && <Etterpa beat={beat} />}
            </svg>
        </div>
    );
}

function Tittel({ tekst, under }: { tekst: string; under?: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={tekst}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
            >
                <text
                    x={800}
                    y={100}
                    textAnchor="middle"
                    fontSize={62}
                    fontWeight={900}
                    fill={MORK}
                >
                    {tekst}
                </text>
                {under && (
                    <text
                        x={800}
                        y={155}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#57534e"
                    >
                        {under}
                    </text>
                )}
            </motion.g>
        </AnimatePresence>
    );
}

/** Merkelapp på et hvitt kort med farget kant til venstre. Bredden følger teksten. */
function Merke({
    x,
    y,
    linjer,
    farge,
    synlig,
    str = 32,
}: {
    x: number;
    y: number;
    linjer: string[];
    farge: string;
    synlig: boolean;
    str?: number;
}) {
    const lengst = Math.max(...linjer.map((l) => l.length));
    const b = lengst * str * 0.56 + 56;
    const h = linjer.length * str * 1.25 + 30;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.5 }}
        >
            <rect x={x} y={y} width={b} height={h} rx={12} fill="#ffffff" />
            <rect x={x} y={y} width={10} height={h} rx={4} fill={farge} />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x + 32}
                    y={y + 15 + str * 0.95 + i * str * 1.25}
                    fontSize={str}
                    fontWeight={i === 0 ? 800 : 600}
                    fill={i === 0 ? MORK : '#44403c'}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/* ---------- Modus «ung»: pyramiden og gjelda ---------- */

const RADER = [2, 8, 18, 34, 60];
const PYR_X = 470;
const PYR_TOPP = 270;
const RAD_H = 125;

function plass(rad: number, i: number) {
    const n = RADER[rad];
    const bredde = 90 + rad * 160;
    const x = PYR_X - bredde / 2 + (n === 1 ? bredde / 2 : (i / (n - 1)) * bredde);
    const ekstra = rad >= 3 ? ((i % 2) - 0.5) * 26 : 0;
    return { x, y: PYR_TOPP + rad * RAD_H + ekstra };
}

const PRIKKER = RADER.flatMap((n, rad) =>
    Array.from({ length: n }, (_, i) => ({ rad, i, ...plass(rad, i) }))
);

function Ung({ beat }: { beat: number }) {
    const tittel = [
        { tekst: 'Den unge Cæsar', under: 'født 13. juli år 100 fvt.' },
        { tekst: 'Mange ville til toppen', under: 'men det fantes bare noen få toppjobber' },
        { tekst: 'Lån på lån', under: 'til fester, leker og bestikkelser' },
        { tekst: 'Konsul år 59 fvt.', under: 'men dypt i gjeld' },
    ][Math.min(beat, 3)];
    // Cæsar klatrer: nederst, nederst, midt på, helt øverst.
    const cRad = beat <= 1 ? 4 : beat === 2 ? 2 : 0;
    const cPos = cRad === 0 ? plass(0, 1) : { x: PYR_X, y: PYR_TOPP + cRad * RAD_H + 34 };
    const gjeld = beat <= 1 ? 0 : beat === 2 ? 0.55 : 1;
    const BAR_Y = 260;
    const BAR_H = 520;
    return (
        <g>
            <Tittel {...tittel} />
            {/* Trinnene i pyramiden */}
            {RADER.map((_, rad) => {
                const bredde = 90 + rad * 160 + 80;
                return (
                    <rect
                        key={rad}
                        x={PYR_X - bredde / 2}
                        y={PYR_TOPP + rad * RAD_H - 40}
                        width={bredde}
                        height={RAD_H - 10}
                        rx={10}
                        fill={rad === 0 ? '#fde68a' : '#e7e0d2'}
                        opacity={beat >= 1 ? 1 : 0.5}
                    />
                );
            })}
            {/* Familiene som slåss om plassene */}
            {PRIKKER.map((p, k) => (
                <motion.circle
                    key={k}
                    cx={p.x}
                    cy={p.y}
                    initial={{ r: 0 }}
                    animate={{
                        r: p.rad === 0 ? 20 : 12,
                        fill: p.rad === 0 ? GULL : beat >= 1 ? '#78716c' : GRA,
                        opacity: cRad === 0 && p.rad === 0 && p.i === 1 ? 0 : 1,
                    }}
                    transition={{ duration: 0.6, delay: beat === 1 ? frø(k) * 0.8 : 0 }}
                />
            ))}
            {/* Cæsar */}
            <motion.g
                initial={false}
                animate={{ x: cPos.x, y: cPos.y }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <circle r={30} fill={LILLA} stroke="#ffffff" strokeWidth={5} />
                <text y={12} textAnchor="middle" fontSize={34} fontWeight={900} fill="#ffffff">
                    C
                </text>
            </motion.g>

            {/* Høyre side: hvem han var (beat 0), hvor trangt det var (beat 1) */}
            <Merke
                x={960}
                y={300}
                linjer={['Gammel og fin familie', 'men ikke spesielt rik']}
                farge={LILLA}
                synlig={beat === 0}
            />
            <Merke
                x={960}
                y={460}
                linjer={['Faren døde', 'da Cæsar var 16 år']}
                farge={GRA}
                synlig={beat === 0}
            />
            <Merke
                x={960}
                y={250}
                linjer={['Noen få toppjobber']}
                farge={GULL}
                synlig={beat === 1}
            />
            <Merke
                x={960}
                y={720}
                linjer={['Hundrevis av familier']}
                farge="#78716c"
                synlig={beat === 1}
            />

            {/* Gjelda som vokser (beat 2-3) */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <text
                    x={1080}
                    y={BAR_Y - 22}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill={ROD}
                >
                    GJELD
                </text>
                <rect
                    x={1010}
                    y={BAR_Y}
                    width={140}
                    height={BAR_H}
                    rx={14}
                    fill="#ffffff"
                    stroke="#d6d3d1"
                    strokeWidth={4}
                />
                <motion.rect
                    x={1018}
                    width={124}
                    rx={10}
                    fill={ROD}
                    initial={{ y: BAR_Y + BAR_H - 8, height: 0 }}
                    animate={{
                        y: BAR_Y + BAR_H - 8 - gjeld * (BAR_H - 16),
                        height: gjeld * (BAR_H - 16),
                    }}
                    transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                />
                {/* Mynter som renner ut til fester og bestikkelser */}
                {beat === 2 &&
                    Array.from({ length: 10 }, (_, i) => (
                        <motion.circle
                            key={i}
                            r={14}
                            fill={GULL}
                            stroke="#a16207"
                            strokeWidth={3}
                            initial={{ cx: 1080, cy: 600, opacity: 0 }}
                            animate={{
                                cx: [1080, 1260],
                                cy: [600, i % 2 ? 420 : 610],
                                opacity: [0, 1, 0],
                            }}
                            transition={{
                                duration: 1.6,
                                delay: 0.6 + i * 0.35,
                                repeat: Infinity,
                                repeatDelay: 2,
                            }}
                        />
                    ))}
            </motion.g>
            <Merke
                x={1200}
                y={360}
                linjer={['Fester og leker', 'for folket']}
                farge={GULL}
                synlig={beat === 2}
                str={30}
            />
            <Merke
                x={1200}
                y={560}
                linjer={['Bestikkelser']}
                farge={ROD}
                synlig={beat === 2}
                str={30}
            />
            <Merke
                x={1190}
                y={380}
                linjer={['Fiendene håpet', 'han ville gå', 'konkurs']}
                farge={ROD}
                synlig={beat >= 3}
                str={30}
            />
            <Merke x={560} y={200} linjer={['Konsul']} farge={LILLA} synlig={beat >= 3} str={30} />
        </g>
    );
}

/* ---------- Modus «helt»: penger, folket og hæren ---------- */

const SOYLER = [
    { x: 330, navn: 'Penger', under: 'svært rik', farge: GULL },
    { x: 800, navn: 'Folket', under: 'en helt i Roma', farge: LILLA },
    { x: 1270, navn: 'Hæren', under: 'soldatene elsket ham', farge: ROD },
];

function Helt({ beat }: { beat: number }) {
    return (
        <g>
            <Tittel tekst="Cæsar etter Gallia" under="tre ting som gir makt" />
            {SOYLER.map((s, i) => {
                const aktiv = beat >= i;
                const na = beat === i;
                return (
                    <g key={s.navn}>
                        <rect
                            x={s.x - 190}
                            y={210}
                            width={380}
                            height={600}
                            rx={20}
                            fill="#ffffff"
                            stroke={na ? s.farge : '#e7e5e4'}
                            strokeWidth={na ? 8 : 4}
                        />
                        <text
                            x={s.x}
                            y={285}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill={aktiv ? s.farge : '#d6d3d1'}
                        >
                            {s.navn}
                        </text>
                        <motion.text
                            x={s.x}
                            y={775}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#44403c"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: aktiv ? 1 : 0 }}
                            transition={{ duration: 0.5, delay: 1 }}
                        >
                            {s.under}
                        </motion.text>
                        {i === 0 && <Mynter x={s.x} aktiv={aktiv} />}
                        {i === 1 && <Folk x={s.x} aktiv={aktiv} />}
                        {i === 2 && <Soldater x={s.x} aktiv={aktiv} />}
                    </g>
                );
            })}
        </g>
    );
}

/** En haug med gullmynter som stables opp. */
function Mynter({ x, aktiv }: { x: number; aktiv: boolean }) {
    const stabler = [-110, -40, 30, 100];
    const hoyder = [9, 13, 11, 7];
    return (
        <g>
            {stabler.flatMap((dx, s) =>
                Array.from({ length: hoyder[s] }, (_, k) => (
                    <motion.ellipse
                        key={`${s}-${k}`}
                        cx={x + dx}
                        rx={30}
                        ry={11}
                        fill={GULL}
                        stroke="#a16207"
                        strokeWidth={3}
                        initial={{ cy: 260, opacity: 0 }}
                        animate={aktiv ? { cy: 715 - k * 26, opacity: 1 } : { cy: 260, opacity: 0 }}
                        transition={{ duration: 0.5, delay: (k * 4 + s) * 0.04 }}
                    />
                ))
            )}
        </g>
    );
}

/** Folk som jubler: hoder og kropper som hopper. */
function Folk({ x, aktiv }: { x: number; aktiv: boolean }) {
    return (
        <g>
            {Array.from({ length: 20 }, (_, i) => {
                const kol = i % 5;
                const rad = Math.floor(i / 5);
                const fx = x - 140 + kol * 70;
                const fy = 380 + rad * 85;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0.25, y: 0 }}
                        animate={aktiv ? { opacity: 1, y: [0, -14, 0] } : { opacity: 0.25, y: 0 }}
                        transition={
                            aktiv
                                ? {
                                      opacity: { duration: 0.4, delay: i * 0.05 },
                                      y: {
                                          duration: 0.6,
                                          delay: 0.5 + frø(i) * 1.2,
                                          repeat: Infinity,
                                          repeatDelay: 1.2 + frø(i + 9),
                                      },
                                  }
                                : { duration: 0.3 }
                        }
                    >
                        <circle cx={fx} cy={fy} r={14} fill="#e8c39e" />
                        <rect
                            x={fx - 16}
                            y={fy + 16}
                            width={32}
                            height={44}
                            rx={12}
                            fill={aktiv ? LILLA : '#d6d3d1'}
                        />
                    </motion.g>
                );
            })}
        </g>
    );
}

/** Soldater på rekke med skjold og hjelm. */
function Soldater({ x, aktiv }: { x: number; aktiv: boolean }) {
    return (
        <g>
            {Array.from({ length: 15 }, (_, i) => {
                const kol = i % 5;
                const rad = Math.floor(i / 5);
                const fx = x - 140 + kol * 70;
                const fy = 390 + rad * 110;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: aktiv ? 1 : 0.2 }}
                        transition={{ duration: 0.4, delay: aktiv ? 0.3 + i * 0.07 : 0 }}
                    >
                        <path
                            d={`M${fx - 15} ${fy - 6} a15 15 0 0 1 30 0 z`}
                            fill={aktiv ? '#a8a29e' : '#e7e5e4'}
                        />
                        <circle cx={fx} cy={fy} r={13} fill="#e8c39e" />
                        <rect
                            x={fx - 17}
                            y={fy + 16}
                            width={34}
                            height={50}
                            rx={8}
                            fill={aktiv ? ROD : '#e7e5e4'}
                        />
                    </motion.g>
                );
            })}
        </g>
    );
}

/* ---------- Modus «etterpa»: tempelet som faller ---------- */

const SOYLE_X = [560, 656, 752, 848, 944, 1040];
const GULV = 700;
const SOYLE_H = 300;
const SOYLE_B = 50;

/** Hjørnene i én søyle: stående, lutende eller liggende på bakken. */
function soylePunkter(i: number, tilstand: 0 | 1 | 2) {
    const x = SOYLE_X[i];
    if (tilstand === 0) {
        return `${x},${GULV} ${x + SOYLE_B},${GULV} ${x + SOYLE_B},${GULV - SOYLE_H} ${x},${GULV - SOYLE_H}`;
    }
    if (tilstand === 1) {
        const l = (i % 2 ? 1 : -1) * (18 + i * 4);
        return `${x},${GULV} ${x + SOYLE_B},${GULV} ${x + SOYLE_B + l},${GULV - SOYLE_H + 6} ${x + l},${GULV - SOYLE_H + 6}`;
    }
    // Liggende: søylene ligger hulter til bulter på bakken foran tempelet.
    const lx = 300 + i * 175;
    const ly = 780 + (i % 2) * 34;
    const lengde = 150 + (i % 3) * 25;
    return `${lx},${ly} ${lx + lengde},${ly - 6} ${lx + lengde},${ly - 6 - SOYLE_B * 0.7} ${lx},${ly - SOYLE_B * 0.7}`;
}

function Etterpa({ beat }: { beat: number }) {
    const tilstand: 0 | 1 | 2 = beat <= 1 ? 0 : beat === 2 ? 1 : 2;
    const tittel = [
        { tekst: 'Etter drapet', under: 'morderne trodde de hadde reddet republikken' },
        { tekst: 'Folket raser', under: 'mot senatorene som drepte Cæsar' },
        { tekst: 'En ny borgerkrig', under: 'enda verre enn den forrige' },
        { tekst: 'Republikken er borte', under: 'Roma får en keiser' },
    ][Math.min(beat, 3)];
    const tak =
        tilstand === 0
            ? `520,${GULV - SOYLE_H} 1130,${GULV - SOYLE_H} 825,${GULV - SOYLE_H - 130}`
            : `530,${GULV - SOYLE_H + 30} 1140,${GULV - SOYLE_H - 10} 840,${GULV - SOYLE_H - 135}`;
    return (
        <g>
            <Tittel {...tittel} />
            {/* Trappa under tempelet */}
            <rect x={490} y={GULV} width={670} height={26} fill="#d6cbb5" />
            <rect x={460} y={GULV + 26} width={730} height={26} fill="#c9bba0" />
            {/* Søylene */}
            {SOYLE_X.map((_, i) => (
                <motion.polygon
                    key={i}
                    fill="#f5f0e6"
                    stroke="#a8a29e"
                    strokeWidth={3}
                    initial={false}
                    animate={{ points: soylePunkter(i, tilstand) }}
                    transition={{ duration: tilstand === 2 ? 1.6 : 1, delay: i * 0.08 }}
                />
            ))}
            {/* Taket med navnet */}
            <motion.g
                initial={false}
                animate={{ opacity: tilstand === 2 ? 0 : 1 }}
                transition={{ duration: 0.8 }}
            >
                <motion.polygon
                    fill="#e7dcc6"
                    stroke="#a8a29e"
                    strokeWidth={3}
                    initial={false}
                    animate={{ points: tak }}
                    transition={{ duration: 1 }}
                />
                <text
                    x={828}
                    y={GULV - SOYLE_H - 34}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#57534e"
                    letterSpacing={4}
                >
                    REPUBLIKKEN
                </text>
            </motion.g>
            {/* Sprekker når borgerkrigen kommer */}
            {tilstand === 1 &&
                SOYLE_X.map((x, i) => (
                    <motion.path
                        key={i}
                        d={`M${x + 25} ${GULV - 260} l12 40 l-16 34 l14 46`}
                        stroke={ROD}
                        strokeWidth={5}
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.15 }}
                    />
                ))}
            {/* Folket som raser, i to grupper på hver side av tempelet */}
            {Array.from({ length: 36 }, (_, i) => {
                const side = i < 18 ? 0 : 1;
                const k = i % 18;
                const fx = (side ? 1210 : 110) + (k % 6) * 54 + (Math.floor(k / 6) % 2) * 20;
                const fy = 540 + Math.floor(k / 6) * 90;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 1 || beat === 2 ? 1 : 0 }}
                        transition={{ duration: 0.5, delay: beat === 1 ? frø(i + 3) * 0.8 : 0 }}
                    >
                        <circle cx={fx} cy={fy} r={13} fill="#e8c39e" />
                        <rect x={fx - 15} y={fy + 15} width={30} height={42} rx={11} fill={ROD} />
                    </motion.g>
                );
            })}
            {/* Augustus: laurbærkrans over ruinene */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 1, delay: beat >= 3 ? 1.2 : 0 }}
            >
                <Krans x={825} y={470} />
                <text
                    x={825}
                    y={620}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill={GULL}
                >
                    Augustus
                </text>
                <text
                    x={825}
                    y={668}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={700}
                    fill="#44403c"
                >
                    Romas første offisielle keiser
                </text>
            </motion.g>
            <Merke
                x={1200}
                y={300}
                linjer={['Morderne:', 'republikken', 'er reddet?']}
                farge={GRA}
                synlig={beat === 0}
                str={30}
            />
        </g>
    );
}

/** Laurbærkrans av blader rundt en sirkel. */
function Krans({ x, y }: { x: number; y: number }) {
    return (
        <g>
            {Array.from({ length: 18 }, (_, i) => {
                const side = i < 9 ? -1 : 1;
                const k = i % 9;
                const a = Math.PI / 2 + side * (0.35 + k * 0.3);
                const bx = x + Math.cos(a) * 85;
                const by = y + Math.sin(a) * 85;
                const rot = (a * 180) / Math.PI + 90 * side;
                return (
                    <ellipse
                        key={i}
                        cx={bx}
                        cy={by}
                        rx={13}
                        ry={28}
                        fill={i % 2 ? '#65a30d' : '#4d7c0f'}
                        transform={`rotate(${rot} ${bx} ${by})`}
                    />
                );
            })}
        </g>
    );
}
