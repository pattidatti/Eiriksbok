import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Livet på Lofotfisket i 2D, én tegning per replikk: reisen etter jul, lofotkista, kona som
 * blir igjen hjemme, rorbua, nordlandsbåten og hvor mye av torsken som ble fisket fra slike
 * båter. Alt som står i bildet, står i artikkelen.
 */

const HAV = '#2f5f86';
const SNO = '#eef3f7';
const FJELL = '#3c4656';
const RODT = '#a3302a';
const TRE = '#7a4a26';
const MORK = '#2b1d14';

/* ---------------- Små tegninger ---------------- */

function Pille({ tekst, y = 92 }: { tekst: string; y?: number }) {
    const fs = 50;
    const b = tekst.length * fs * 0.56 + 70;
    return (
        <g>
            <rect
                x={800 - b / 2}
                y={y - 46}
                width={b}
                height={88}
                rx={30}
                fill="white"
                fillOpacity={0.94}
            />
            <text
                x={800}
                y={y + 16}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={800}
                fill="#0f172a"
                fontFamily="Outfit, Inter, sans-serif"
            >
                {tekst}
            </text>
        </g>
    );
}

function Merke({
    x,
    y,
    tekst,
    farge = '#0f172a',
    fs = 40,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    fs?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={fs}
            fontWeight={800}
            fill={farge}
            fontFamily="Inter, sans-serif"
            stroke="white"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

/** Dukker opp litt etter at tegningen er på plass. */
function Inn({ children, forsinkelse = 0 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

function Himmel({ topp = '#c9d8e6', bunn = '#eef3f8' }: { topp?: string; bunn?: string }) {
    return (
        <>
            <defs>
                <linearGradient id="lf-vinter-himmel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={topp} />
                    <stop offset="1" stopColor={bunn} />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={1600} height={900} fill="url(#lf-vinter-himmel)" />
        </>
    );
}

function Fjell({ x, y, b, h }: { x: number; y: number; b: number; h: number }) {
    return (
        <g>
            <path d={`M ${x - b / 2} ${y} L ${x} ${y - h} L ${x + b / 2} ${y} Z`} fill={FJELL} />
            <path
                d={`M ${x - b * 0.14} ${y - h * 0.72} L ${x} ${y - h} L ${x + b * 0.14} ${y - h * 0.72} L ${x + b * 0.05} ${y - h * 0.66} L ${x - b * 0.04} ${y - h * 0.74} Z`}
                fill={SNO}
            />
        </g>
    );
}

/** Nordlandsbåt sett fra siden, med høye stevner, ett råseil og årer. Midten av kjølen i (0, 0). */
function Nordlandsbat({ arer = false, seil = true }: { arer?: boolean; seil?: boolean }) {
    return (
        <g>
            {seil && (
                <>
                    <line x1={0} y1={-20} x2={0} y2={-190} stroke={MORK} strokeWidth={6} />
                    <line x1={-62} y1={-180} x2={62} y2={-180} stroke={MORK} strokeWidth={5} />
                    <path d="M -60 -178 L 60 -178 L 66 -48 L -66 -48 Z" fill="#e7e0d0" />
                </>
            )}
            {arer &&
                [-70, -25, 20, 65].map((x) => (
                    <line
                        key={x}
                        x1={x}
                        y1={-30}
                        x2={x - 40}
                        y2={34}
                        stroke={MORK}
                        strokeWidth={5}
                    />
                ))}
            <path
                d="M -150 -70 C -138 -40 -120 -12 -90 0 L 90 0 C 120 -12 138 -40 150 -70 L 128 -32 L -128 -32 Z"
                fill={TRE}
            />
            <path d="M -128 -32 L 128 -32" stroke={MORK} strokeWidth={4} />
            <path d="M -110 -16 L 110 -16" stroke={MORK} strokeWidth={2} opacity={0.5} />
        </g>
    );
}

function Hus({
    x,
    y,
    b = 170,
    h = 110,
    farge = RODT,
}: {
    x: number;
    y: number;
    b?: number;
    h?: number;
    farge?: string;
}) {
    return (
        <g>
            <rect x={x - b / 2} y={y - h} width={b} height={h} fill={farge} />
            <path
                d={`M ${x - b / 2 - 14} ${y - h} L ${x} ${y - h - b * 0.42} L ${x + b / 2 + 14} ${y - h} Z`}
                fill="#2a2a2e"
            />
            <rect
                x={x - b * 0.28}
                y={y - h * 0.68}
                width={b * 0.2}
                height={h * 0.3}
                fill="#f8f1d8"
            />
            <rect
                x={x + b * 0.1}
                y={y - h * 0.6}
                width={b * 0.18}
                height={h * 0.6}
                fill="#3b2a1e"
            />
        </g>
    );
}

function Person({
    x,
    y,
    s = 1,
    farge = '#334155',
    stokk = false,
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
    stokk?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-128} r={20} fill="#f1c9a5" />
            <path d="M -30 0 L -24 -100 Q 0 -112 24 -100 L 30 0 Z" fill={farge} />
            {stokk && <line x1={36} y1={-70} x2={46} y2={0} stroke={MORK} strokeWidth={6} />}
        </g>
    );
}

function Ku({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {[-48, -24, 30, 52].map((lx) => (
                <rect key={lx} x={lx} y={-40} width={12} height={40} fill="#4b3427" />
            ))}
            <ellipse cx={0} cy={-62} rx={80} ry={38} fill="#6b4a37" />
            <ellipse cx={-14} cy={-70} rx={22} ry={14} fill="#f5f0e6" />
            <ellipse cx={88} cy={-78} rx={26} ry={20} fill="#6b4a37" />
            <path d="M 80 -96 L 74 -112 M 98 -96 L 104 -112" stroke="#d6cbb5" strokeWidth={6} />
        </g>
    );
}

function Rorbu({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            {[-80, -30, 30, 80].map((px) => (
                <rect key={px} x={px - 6} y={-60} width={12} height={110} fill={MORK} />
            ))}
            <rect x={-110} y={-70} width={220} height={14} fill={TRE} />
            <Hus x={0} y={-70} b={200} h={120} />
        </g>
    );
}

/* ---------------- Tegningene, én per replikk ---------------- */

function Reisen() {
    const bater = [
        { y: 660, fra: 330, til: 980, s: 0.55, d: 0 },
        { y: 740, fra: 250, til: 860, s: 0.65, d: 0.6 },
        { y: 830, fra: 170, til: 760, s: 0.75, d: 1.2 },
    ];
    return (
        <g>
            <Himmel />
            <rect x={0} y={580} width={1600} height={320} fill={HAV} />
            {/* Hjemme: lavt land med en gård til venstre */}
            <path d="M 0 600 L 0 470 Q 160 440 330 520 L 420 600 Z" fill={SNO} />
            <Hus x={150} y={510} b={130} h={80} farge="#b9893f" />
            <Merke x={190} y={360} tekst="Hjemme" />
            {/* Lofoten: bratte fjell og rorbuer til høyre */}
            <Fjell x={1240} y={590} b={300} h={330} />
            <Fjell x={1430} y={590} b={320} h={400} />
            <Fjell x={1580} y={590} b={260} h={300} />
            <Rorbu x={1260} y={585} s={0.45} />
            <Rorbu x={1400} y={585} s={0.45} />
            <Merke x={1390} y={150} tekst="Lofoten" />
            {bater.map((b) => (
                <motion.g
                    key={b.y}
                    initial={{ x: b.fra }}
                    animate={{ x: b.til }}
                    transition={{ duration: 9, delay: b.d, ease: 'easeOut' }}
                >
                    <g transform={`translate(0 ${b.y}) scale(${b.s})`}>
                        <Nordlandsbat />
                    </g>
                </motion.g>
            ))}
            <Inn forsinkelse={0.8}>
                <path
                    d="M 460 470 L 1040 470"
                    stroke="#0f172a"
                    strokeWidth={8}
                    strokeDasharray="4 18"
                    strokeLinecap="round"
                />
                <path d="M 1040 446 L 1086 470 L 1040 494 Z" fill="#0f172a" />
                <Merke x={760} y={440} tekst="fra hele kysten" fs={38} />
            </Inn>
        </g>
    );
}

function Genser() {
    return (
        <path
            d="M -40 -50 L -70 -30 L -60 0 L -42 -8 L -42 50 L 42 50 L 42 -8 L 60 0 L 70 -30 L 40 -50 Q 0 -30 -40 -50 Z"
            fill="#4f6d8a"
        />
    );
}
function Vott() {
    return (
        <g>
            <path d="M -26 50 L -30 -20 Q -30 -50 0 -50 Q 30 -50 28 -20 L 26 50 Z" fill="#b03a2e" />
            <ellipse
                cx={-36}
                cy={-4}
                rx={12}
                ry={22}
                fill="#b03a2e"
                transform="rotate(-25 -36 -4)"
            />
            <rect x={-28} y={34} width={56} height={16} fill="#f5f0e6" />
        </g>
    );
}
function Sokk() {
    return (
        <g>
            <path
                d="M -22 -50 L 22 -50 L 22 20 Q 22 50 -10 50 L -48 50 Q -60 30 -40 18 L -22 10 Z"
                fill="#8a8172"
            />
            <rect x={-22} y={-50} width={44} height={16} fill="#f5f0e6" />
        </g>
    );
}
function Flatbrod() {
    return (
        <g>
            <ellipse cx={0} cy={10} rx={64} ry={34} fill="#d9b779" />
            <ellipse cx={0} cy={0} rx={64} ry={34} fill="#e8cc92" />
            {[-30, -6, 18, 40].map((x, i) => (
                <circle key={x} cx={x} cy={i % 2 ? -8 : 8} r={3} fill="#a07c43" />
            ))}
        </g>
    );
}
function Mat() {
    return (
        <g>
            <path d="M -40 50 Q -50 -10 -24 -36 L 24 -36 Q 50 -10 40 50 Z" fill="#c8b38a" />
            <path d="M -28 -36 Q 0 -60 28 -36" stroke="#8a7650" strokeWidth={6} fill="none" />
        </g>
    );
}

function Kista() {
    const ting = [
        { navn: 'ullklær', tegning: <Genser />, x: 320 },
        { navn: 'votter', tegning: <Vott />, x: 560 },
        { navn: 'sokker', tegning: <Sokk />, x: 800 },
        { navn: 'flatbrød', tegning: <Flatbrod />, x: 1040 },
        { navn: 'annen mat', tegning: <Mat />, x: 1280 },
    ];
    return (
        <g>
            <Himmel topp="#e9dcc7" bunn="#f6efe3" />
            <rect x={0} y={760} width={1600} height={140} fill="#b88a5c" />
            {/* Kista med åpent lokk */}
            <g transform="translate(800 790)">
                <path d="M -230 -230 L 230 -230 L 250 -300 L -210 -300 Z" fill="#5a3a20" />
                <rect x={-240} y={-230} width={480} height={200} rx={10} fill={TRE} />
                <rect x={-240} y={-230} width={480} height={26} fill="#5a3a20" />
                {[-150, 150].map((x) => (
                    <rect key={x} x={x - 9} y={-230} width={18} height={200} fill={MORK} />
                ))}
                <rect x={-20} y={-150} width={40} height={36} rx={6} fill="#c9a14a" />
            </g>
            <Merke x={800} y={850} tekst="Lofotkista: en stor trekiste" fs={44} />
            {ting.map((t, i) => (
                <Inn key={t.navn} forsinkelse={0.4 + i * 0.45}>
                    <g transform={`translate(${t.x} 290) scale(1.5)`}>{t.tegning}</g>
                    <Merke x={t.x} y={430} tekst={t.navn} fs={44} />
                </Inn>
            ))}
        </g>
    );
}

function Hjemme() {
    return (
        <g>
            <Himmel topp="#cfd9e3" bunn="#f1f5f9" />
            <Fjell x={300} y={560} b={520} h={230} />
            <Fjell x={1300} y={560} b={600} h={260} />
            <rect x={0} y={540} width={1600} height={360} fill={SNO} />
            <Hus x={330} y={640} b={230} h={140} farge="#b9893f" />
            <Hus x={1000} y={640} b={300} h={150} farge={RODT} />
            <Ku x={1000} y={790} />
            <Person x={600} y={790} s={1.1} farge="#7c3a5a" />
            <Person x={700} y={790} s={0.62} farge="#2f6f8f" />
            <Person x={760} y={790} s={0.55} farge="#a35a2a" />
            <Person x={1320} y={790} s={0.95} farge="#5b5b66" stokk />
            <Inn forsinkelse={0.3}>
                <Merke x={330} y={380} tekst="gården" />
            </Inn>
            <Inn forsinkelse={0.9}>
                <Merke x={1000} y={680} tekst="dyrene" />
            </Inn>
            <Inn forsinkelse={1.5}>
                <Merke x={730} y={590} tekst="barna" />
            </Inn>
            <Inn forsinkelse={2.1}>
                <Merke x={1330} y={590} tekst="de gamle" />
            </Inn>
            <Inn forsinkelse={3}>
                <rect
                    x={260}
                    y={820}
                    width={1080}
                    height={70}
                    rx={20}
                    fill="#1e293b"
                    opacity={0.88}
                />
                <text
                    x={800}
                    y={868}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={700}
                    fill="white"
                    fontFamily="Inter, sans-serif"
                >
                    Altfor mange menn kom aldri hjem igjen
                </text>
            </Inn>
        </g>
    );
}

function Rorbua() {
    return (
        <g>
            <Himmel />
            <Fjell x={350} y={560} b={520} h={360} />
            <Fjell x={760} y={560} b={480} h={300} />
            <Fjell x={1500} y={560} b={420} h={250} />
            <rect x={0} y={540} width={1600} height={50} fill={SNO} />
            <rect x={0} y={590} width={1600} height={310} fill={HAV} />
            <Rorbu x={560} y={620} s={1.6} />
            <g transform="translate(560 800) scale(0.7)">
                <Nordlandsbat />
            </g>
            <Inn forsinkelse={0.5}>
                <rect
                    x={1000}
                    y={250}
                    width={520}
                    height={250}
                    rx={24}
                    fill="white"
                    opacity={0.95}
                />
                <text fontFamily="Inter, sans-serif" fill="#0f172a">
                    <tspan x={1040} y={320} fontSize={46} fontWeight={800}>
                        Rorbu
                    </tspan>
                    <tspan x={1040} y={385} fontSize={34} fontWeight={600}>
                        Her bodde fiskerne
                    </tspan>
                    <tspan x={1040} y={435} fontSize={34} fontWeight={600}>
                        under fisket, langt
                    </tspan>
                    <tspan x={1040} y={475} fontSize={34} fontWeight={600}>
                        hjemmefra.
                    </tspan>
                </text>
            </Inn>
        </g>
    );
}

function Baten() {
    return (
        <g>
            <Himmel />
            <rect x={0} y={640} width={1600} height={260} fill={HAV} />
            <motion.g
                initial={{ y: 6 }}
                animate={{ y: [6, -6, 6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
                <g transform="translate(760 690) scale(2)">
                    <Nordlandsbat arer />
                </g>
            </motion.g>
            <Inn forsinkelse={0.5}>
                <path d="M 1000 330 L 900 400" stroke="#0f172a" strokeWidth={5} />
                <Merke x={1010} y={322} tekst="seil" anker="start" fs={44} />
            </Inn>
            <Inn forsinkelse={1.1}>
                <path d="M 470 790 L 560 740" stroke="#0f172a" strokeWidth={5} />
                <Merke x={300} y={810} tekst="årer" anker="start" fs={44} />
            </Inn>
            <Inn forsinkelse={1.7}>
                <rect
                    x={1080}
                    y={500}
                    width={440}
                    height={110}
                    rx={22}
                    fill="white"
                    opacity={0.95}
                />
                <text
                    x={1300}
                    y={548}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#0f172a"
                    fontFamily="Inter, sans-serif"
                >
                    Lett trebåt
                </text>
                <text
                    x={1300}
                    y={590}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={600}
                    fill="#334155"
                    fontFamily="Inter, sans-serif"
                >
                    rodde og seilte
                </text>
            </Inn>
        </g>
    );
}

function Andel() {
    const x0 = 200;
    const b = 1200;
    return (
        <g>
            <Himmel topp="#dbe6ef" bunn="#eef3f8" />
            <text
                x={800}
                y={250}
                textAnchor="middle"
                fontSize={40}
                fontWeight={700}
                fill="#334155"
                fontFamily="Inter, sans-serif"
            >
                Andel av all torsk i Norge, 1500-tallet til slutten av 1800-tallet
            </text>
            <rect x={x0} y={360} width={b} height={140} rx={18} fill="#cbd5e1" />
            <motion.rect
                x={x0}
                y={360}
                height={140}
                rx={18}
                fill="#7dd3c0"
                initial={{ width: 0 }}
                animate={{ width: b * 0.9 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <motion.rect
                x={x0}
                y={360}
                height={140}
                rx={18}
                fill="#0f766e"
                initial={{ width: 0 }}
                animate={{ width: b * 0.85 }}
                transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
            />
            <Inn forsinkelse={1.6}>
                <text
                    x={x0 + b * 0.875}
                    y={330}
                    textAnchor="middle"
                    fontSize={56}
                    fontWeight={900}
                    fill="#0f766e"
                    fontFamily="Inter, sans-serif"
                >
                    85-90 %
                </text>
                <g transform={`translate(${x0 + b * 0.42} 480) scale(0.6)`}>
                    <Nordlandsbat />
                </g>
                <text
                    x={x0 + b * 0.42}
                    y={580}
                    textAnchor="middle"
                    fontSize={42}
                    fontWeight={800}
                    fill="#0f172a"
                    fontFamily="Inter, sans-serif"
                >
                    fisket fra nordlandsbåter
                </text>
            </Inn>
        </g>
    );
}

const TEGNINGER = [Reisen, Kista, Hjemme, Rorbua, Baten, Andel];
const TITLER = [
    'Etter jul: mot Lofoten',
    'Lofotkista',
    'Kona ble igjen hjemme',
    'Rorbua',
    'Nordlandsbåten',
    '85-90 % av all torsk',
];

export function LofotfisketVinteren({ beat }: VisualProps<Record<string, never>>) {
    const i = Math.min(beat, TEGNINGER.length - 1);
    const Tegning = TEGNINGER[i];
    return (
        <div className="absolute inset-0" style={{ background: '#eef3f8' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Tegning />
                        <Pille tekst={TITLER[i]} />
                    </motion.g>
                </AnimatePresence>
            </svg>
        </div>
    );
}
