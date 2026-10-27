import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Splittelsen i islam: sunni på den ene siden, sjia på den andre. En sprekk deler bildet.
 * Irak og Saudi-Arabia havner på sunni-siden, Iran på sjia-siden, og til slutt lyser
 * konfliktene i dag opp langs sprekken: Jemen, Syria og Libanon.
 */

const B = 1600;
const H = 900;

const BRIKKER = [
    'To retninger i islam',
    'Sunni hadde makten',
    'Det største sjia-landet',
    'Striden i dag',
];

const SUNNI = '#0f766e';
const SJIA = '#7c3aed';

function Land({
    x,
    y,
    navn,
    farge,
    vis,
    stor = false,
    forsinkelse = 0,
    fra,
}: {
    x: number;
    y: number;
    navn: string;
    farge: string;
    vis: boolean;
    stor?: boolean;
    forsinkelse?: number;
    fra: number;
}) {
    const b = stor ? 380 : 420;
    const h = stor ? 130 : 100;
    return (
        <motion.g
            initial={false}
            animate={{ opacity: vis ? 1 : 0, x: vis ? 0 : fra }}
            transition={{ duration: 0.9, delay: vis ? forsinkelse : 0, ease: [0.16, 1, 0.3, 1] }}
        >
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={22}
                fill="white"
                stroke={farge}
                strokeWidth={8}
            />
            <text
                x={x}
                y={y + (stor ? 20 : 16)}
                textAnchor="middle"
                fontSize={stor ? 60 : 48}
                fontWeight={900}
                fill={farge}
            >
                {navn}
            </text>
        </motion.g>
    );
}

function Brann({
    x,
    y,
    navn,
    vis,
    forsinkelse,
}: {
    x: number;
    y: number;
    navn: string;
    vis: boolean;
    forsinkelse: number;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ opacity: vis ? 1 : 0, scale: vis ? 1 : 0.6 }}
            transition={{ duration: 0.7, delay: vis ? forsinkelse : 0 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
            <rect x={x - 130} y={y - 42} width={260} height={84} rx={42} fill="#b91c1c" />
            <text x={x} y={y + 15} textAnchor="middle" fontSize={44} fontWeight={900} fill="white">
                {navn}
            </text>
        </motion.g>
    );
}

export function IranSplittelse({ beat }: VisualProps) {
    const brikke = BRIKKER[Math.min(beat, BRIKKER.length - 1)];
    const strid = beat >= 3;
    return (
        <div className="absolute inset-0 overflow-hidden bg-stone-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <rect x={0} y={0} width={800} height={H} fill="#ccfbf1" />
                <rect x={800} y={0} width={800} height={H} fill="#ede9fe" />
                {/* Sprekken som deler de to sidene */}
                <motion.path
                    d="M 800 140 L 780 250 L 820 360 L 775 480 L 825 600 L 785 720 L 800 900"
                    fill="none"
                    stroke="#292524"
                    strokeWidth={10}
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, delay: 0.3 }}
                />
                <text
                    x={400}
                    y={230}
                    textAnchor="middle"
                    fontSize={84}
                    fontWeight={900}
                    fill={SUNNI}
                >
                    Sunni
                </text>
                <text
                    x={1200}
                    y={230}
                    textAnchor="middle"
                    fontSize={84}
                    fontWeight={900}
                    fill={SJIA}
                >
                    Sjia
                </text>
                <Land x={400} y={400} navn="Irak" farge={SUNNI} vis={beat >= 1} fra={-200} />
                <Land
                    x={400}
                    y={560}
                    navn="Saudi-Arabia"
                    farge={SUNNI}
                    vis={beat >= 1}
                    fra={-200}
                    forsinkelse={0.3}
                />
                <Land x={1200} y={460} navn="Iran" farge={SJIA} vis={beat >= 2} stor fra={200} />
                <motion.text
                    x={1200}
                    y={590}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={700}
                    fill={SJIA}
                    initial={false}
                    animate={{ opacity: beat >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.6, delay: beat >= 2 ? 0.8 : 0 }}
                >
                    største sjia-land i verden
                </motion.text>
                <Brann x={800} y={690} navn="Jemen" vis={strid} forsinkelse={0.3} />
                <Brann x={500} y={790} navn="Syria" vis={strid} forsinkelse={0.7} />
                <Brann x={1100} y={790} navn="Libanon" vis={strid} forsinkelse={1.1} />
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
