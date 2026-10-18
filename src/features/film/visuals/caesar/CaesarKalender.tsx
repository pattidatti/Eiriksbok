import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { frø } from './felles3d';

/**
 * Den julianske kalenderen. Beat 0: rotete måneder faller på plass. Beat 1: tre år
 * med 365 dager og skuddåret med 366. Beat 2: tidslinja fram til 1582. Beat 3-4:
 * juli og august, månedene som fikk navn etter Cæsar og Augustus.
 */

const MANEDER = [
    'januar',
    'februar',
    'mars',
    'april',
    'mai',
    'juni',
    'juli',
    'august',
    'september',
    'oktober',
    'november',
    'desember',
];
const LILLA = '#7e22ce';
const GULL = '#ca8a04';

export function CaesarKalender({ beat }: VisualProps) {
    const visning = beat === 1 ? 'aar' : beat === 2 ? 'tid' : 'maneder';
    return (
        <div className="absolute inset-0 bg-[#f6f1e7] overflow-hidden">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.g
                        key={visning}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {visning === 'maneder' && <Maneder beat={beat} />}
                        {visning === 'aar' && <Aar />}
                        {visning === 'tid' && <Tid />}
                    </motion.g>
                </AnimatePresence>
            </svg>
        </div>
    );
}

function Tittel({ tekst, under }: { tekst: string; under?: string }) {
    return (
        <g>
            <text x={800} y={110} textAnchor="middle" fontSize={64} fontWeight={900} fill="#1c1917">
                {tekst}
            </text>
            {under && (
                <text
                    x={800}
                    y={170}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={700}
                    fill="#57534e"
                >
                    {under}
                </text>
            )}
        </g>
    );
}

function Maneder({ beat }: { beat: number }) {
    const tittel =
        beat === 0
            ? { tekst: 'Den julianske kalenderen', under: 'innført av Cæsar i år 46 fvt.' }
            : beat === 3
              ? { tekst: 'Måneden Cæsar ble født i', under: 'fikk navnet hans' }
              : { tekst: 'To måneder', under: 'bærer fortsatt navnene deres' };
    return (
        <g>
            <Tittel {...tittel} />
            {MANEDER.map((m, i) => {
                const kol = i % 6;
                const rad = Math.floor(i / 6);
                const x = 175 + kol * 210;
                const y = 260 + rad * 270;
                const juli = i === 6 && beat >= 3;
                const august = i === 7 && beat >= 4;
                const fremhev = juli || august;
                const dempet = beat >= 3 && !fremhev;
                return (
                    <motion.g
                        key={m}
                        initial={
                            beat === 0
                                ? {
                                      x: x + (frø(i) - 0.5) * 900,
                                      y: y + (frø(i + 20) - 0.5) * 500,
                                      rotate: (frø(i + 40) - 0.5) * 70,
                                      opacity: 0.6,
                                  }
                                : false
                        }
                        animate={{ x, y, rotate: 0, opacity: dempet ? 0.35 : 1 }}
                        transition={{
                            duration: 1.8,
                            delay: beat === 0 ? 0.8 + i * 0.08 : 0,
                            ease: [0.16, 1, 0.3, 1],
                        }}
                    >
                        <rect
                            width={180}
                            height={220}
                            rx={14}
                            fill="#ffffff"
                            stroke={fremhev ? (juli ? LILLA : GULL) : '#d6d3d1'}
                            strokeWidth={fremhev ? 8 : 3}
                        />
                        <rect
                            width={180}
                            height={50}
                            rx={14}
                            fill={juli ? LILLA : august ? GULL : '#b91c1c'}
                        />
                        <text
                            x={90}
                            y={34}
                            textAnchor="middle"
                            fontSize={26}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            {i + 1}
                        </text>
                        {i === 6 && beat >= 3 ? (
                            <Navnebytte />
                        ) : (
                            <text
                                x={90}
                                y={140}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill="#1c1917"
                            >
                                {m}
                            </text>
                        )}
                        {august && (
                            <text
                                x={90}
                                y={190}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={700}
                                fill={GULL}
                            >
                                Augustus
                            </text>
                        )}
                    </motion.g>
                );
            })}
        </g>
    );
}

/** Quintilis blir Julius, som blir juli. */
function Navnebytte() {
    const navn = ['quintilis', 'Julius', 'juli'];
    return (
        <g>
            {navn.map((n, i) => (
                <motion.text
                    key={n}
                    x={90}
                    y={140}
                    textAnchor="middle"
                    fontSize={i === 1 ? 36 : 30}
                    fontWeight={900}
                    fill={i === 0 ? '#78716c' : LILLA}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i === 2 ? 1 : [0, 1, 1, 0] }}
                    transition={{
                        delay: 0.3 + i * 1.6,
                        duration: i === 2 ? 0.5 : 1.6,
                        times: i === 2 ? undefined : [0, 0.15, 0.8, 1],
                    }}
                >
                    {n}
                </motion.text>
            ))}
        </g>
    );
}

function Aar() {
    const aar = [365, 365, 365, 366];
    return (
        <g>
            <Tittel tekst="Av fire år" under="har tre 365 dager, og det fjerde 366" />
            {aar.map((d, i) => {
                const y = 270 + i * 140;
                const skudd = d === 366;
                return (
                    <g key={i}>
                        <text
                            x={250}
                            y={y + 60}
                            textAnchor="end"
                            fontSize={40}
                            fontWeight={800}
                            fill="#1c1917"
                        >
                            År {i + 1}
                        </text>
                        <motion.rect
                            x={280}
                            y={y}
                            height={90}
                            rx={12}
                            fill={skudd ? LILLA : '#b91c1c'}
                            initial={{ width: 0 }}
                            animate={{ width: 860 }}
                            transition={{ delay: 0.3 + i * 0.7, duration: 1, ease: 'easeOut' }}
                        />
                        {skudd && (
                            <motion.rect
                                x={1150}
                                y={y}
                                width={36}
                                height={90}
                                rx={8}
                                fill={GULL}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 3.3,
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 12,
                                }}
                                style={{ transformOrigin: '1168px ' + (y + 45) + 'px' }}
                            />
                        )}
                        <motion.text
                            x={skudd ? 1205 : 1160}
                            y={y + 60}
                            fontSize={44}
                            fontWeight={900}
                            fill={skudd ? LILLA : '#1c1917'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: skudd ? 3.5 : 1 + i * 0.7 }}
                        >
                            {d}
                            {skudd ? ' skuddår' : ''}
                        </motion.text>
                    </g>
                );
            })}
        </g>
    );
}

function Tid() {
    return (
        <g>
            <Tittel tekst="Nesten den samme kalenderen" under="drøyt 1600 år senere" />
            <motion.line
                x1={200}
                y1={520}
                x2={1400}
                y2={520}
                stroke="#78716c"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            {[
                { x: 200, aar: '46 fvt.', tekst: 'Juliansk', farge: LILLA, d: 0 },
                {
                    x: 1150,
                    aar: '1582',
                    tekst: 'Gregoriansk: litt justert',
                    farge: '#b91c1c',
                    d: 2,
                },
                { x: 1400, aar: 'I dag', tekst: 'Den vi bruker', farge: '#0f766e', d: 3 },
            ].map((m) => (
                <motion.g
                    key={m.aar}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: m.d, type: 'spring', stiffness: 200, damping: 14 }}
                    style={{ transformOrigin: `${m.x}px 520px` }}
                >
                    <circle
                        cx={m.x}
                        cy={520}
                        r={28}
                        fill={m.farge}
                        stroke="#ffffff"
                        strokeWidth={6}
                    />
                    <text
                        x={m.x}
                        y={460}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill={m.farge}
                    >
                        {m.aar}
                    </text>
                    <text
                        x={m.x}
                        y={m.x === 1400 ? 680 : 600}
                        textAnchor={m.x === 1400 ? 'end' : m.x === 200 ? 'start' : 'middle'}
                        fontSize={32}
                        fontWeight={800}
                        fill="#44403c"
                    >
                        {m.tekst}
                    </text>
                </motion.g>
            ))}
        </g>
    );
}
