import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Dengs siste år som en tidslinje fra 1978 til 1998.
 * - beat 0: 1987 og 1989, så et skyggebånd: han har fortsatt mye makt bak kulissene.
 * - beat 1: Hongkong-saken fra 1979. Hongkong er britisk.
 * - beat 2: et forstørret 1997 under linja: Deng dør 19. februar.
 * - beat 3: 1. juli går Hongkong tilbake til Kina, drøyt fire måneder etter.
 */

const B = 1600;
const H = 900;
const X0 = 150;
const X1 = 1450;
const ÅR0 = 1978;
const ÅR1 = 1998;
const AKSE = 300;

const x = (år: number) => X0 + ((år - ÅR0) / (ÅR1 - ÅR0)) * (X1 - X0);

/** Innfelt 1997: tolv måneder mellom M0 og M1. */
const M0 = 260;
const M1 = 1060;
const mnd = (m: number) => M0 + (m / 12) * (M1 - M0);
const INN_Y = 700;

const OVERSKRIFT = [
    'Deng trekker seg tilbake',
    'Fra 1979: Hongkong-saken',
    '19. februar 1997: Deng dør',
    '1. juli 1997: Hongkong tilbake til Kina',
];

function Fram({
    vis,
    forsinkelse = 0.3,
    children,
}: {
    vis: boolean;
    forsinkelse?: number;
    children: React.ReactNode;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6, delay: vis ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

const etikett = {
    fontSize: 30,
    fontWeight: 900,
    stroke: '#fff7ed',
    strokeWidth: 8,
    paintOrder: 'stroke' as const,
};

export function DengArv({ beat }: VisualProps) {
    const tekst = OVERSKRIFT[Math.min(beat, OVERSKRIFT.length - 1)];
    const kinesisk = beat >= 3;
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-amber-50 to-orange-100">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Tidsaksen */}
                <line x1={X0} y1={AKSE} x2={X1} y2={AKSE} stroke="#78716c" strokeWidth={6} />
                {[1980, 1985, 1990, 1995].map((år) => (
                    <g key={år}>
                        <line
                            x1={x(år)}
                            y1={AKSE - 12}
                            x2={x(år)}
                            y2={AKSE + 12}
                            stroke="#78716c"
                            strokeWidth={4}
                        />
                        <text
                            x={x(år)}
                            y={AKSE + 120}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill="#57534e"
                        >
                            {år}
                        </text>
                    </g>
                ))}

                {/* Beat 0: ut av ledelsen, men styrer i det skjulte */}
                <motion.rect
                    x={x(1989)}
                    y={AKSE - 16}
                    height={32}
                    rx={16}
                    fill="#334155"
                    initial={{ width: 0, opacity: 0.35 }}
                    animate={{ width: x(1997.13) - x(1989), opacity: 0.35 }}
                    transition={{ duration: 1.4, delay: 1 }}
                />
                <Fram vis forsinkelse={1.8}>
                    <text
                        x={(x(1989) + x(1997.13)) / 2}
                        y={AKSE + 70}
                        textAnchor="middle"
                        {...etikett}
                        fontSize={28}
                        fill="#334155"
                    >
                        mye makt bak kulissene
                    </text>
                </Fram>
                <Fram vis forsinkelse={0.2}>
                    <circle
                        cx={x(1987)}
                        cy={AKSE}
                        r={16}
                        fill="#b91c1c"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <text x={x(1987)} y={AKSE - 40} textAnchor="end" {...etikett} fill="#0f172a">
                        1987: ut av den daglige ledelsen
                    </text>
                </Fram>
                <Fram vis forsinkelse={0.7}>
                    <circle
                        cx={x(1989)}
                        cy={AKSE}
                        r={16}
                        fill="#b91c1c"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <text
                        x={x(1989) + 10}
                        y={AKSE - 40}
                        textAnchor="start"
                        {...etikett}
                        fill="#0f172a"
                    >
                        1989: siste jobb i partiet
                    </text>
                </Fram>

                {/* Beat 1: Hongkong-saken fra 1979 */}
                <Fram vis={beat >= 1}>
                    <motion.line
                        x1={x(1979)}
                        y1={AKSE - 110}
                        y2={AKSE - 110}
                        stroke="#1d4ed8"
                        strokeWidth={8}
                        strokeDasharray="2 18"
                        strokeLinecap="round"
                        initial={{ x2: x(1979) }}
                        animate={{ x2: beat >= 1 ? x(1997.5) : x(1979) }}
                        transition={{ duration: 1.6, delay: beat >= 1 ? 0.6 : 0 }}
                    />
                    <circle
                        cx={x(1979)}
                        cy={AKSE}
                        r={16}
                        fill="#1d4ed8"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <line
                        x1={x(1979)}
                        y1={AKSE}
                        x2={x(1979)}
                        y2={AKSE - 110}
                        stroke="#1d4ed8"
                        strokeWidth={4}
                    />
                    <text x={x(1979)} y={AKSE - 130} textAnchor="start" {...etikett} fill="#1d4ed8">
                        1979: Hongkong-saken
                    </text>
                </Fram>

                {/* Beat 2-3: 1997 forstørret */}
                <Fram vis={beat >= 2} forsinkelse={0.2}>
                    <circle
                        cx={x(1997.13)}
                        cy={AKSE}
                        r={14}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <path
                        d={`M ${x(1997)} ${AKSE + 20} L ${M0 - 60} ${INN_Y - 130} M ${x(1998)} ${AKSE + 20} L ${M1 + 60} ${INN_Y - 130}`}
                        stroke="#a8a29e"
                        strokeWidth={3}
                        strokeDasharray="8 10"
                    />
                    <rect
                        x={M0 - 60}
                        y={INN_Y - 130}
                        width={M1 - M0 + 120}
                        height={230}
                        rx={24}
                        fill="#fff"
                        stroke="#e7e5e4"
                        strokeWidth={4}
                    />
                    <text x={M0 - 30} y={INN_Y - 88} fontSize={30} fontWeight={900} fill="#78716c">
                        1997
                    </text>
                    <line x1={M0} y1={INN_Y} x2={M1} y2={INN_Y} stroke="#a8a29e" strokeWidth={4} />
                    {'JFMAMJJASOND'.split('').map((b, i) => (
                        <text
                            key={i}
                            x={mnd(i + 0.5)}
                            y={INN_Y + 40}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={800}
                            fill="#57534e"
                        >
                            {b}
                        </text>
                    ))}
                    <circle
                        cx={mnd(1.6)}
                        cy={INN_Y}
                        r={16}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <text
                        x={mnd(1.6)}
                        y={INN_Y - 34}
                        textAnchor="middle"
                        {...etikett}
                        stroke="#fff"
                        fill="#0f172a"
                    >
                        19. februar: Deng dør
                    </text>
                </Fram>
                <Fram vis={beat >= 3} forsinkelse={0.4}>
                    <motion.rect
                        x={mnd(1.6)}
                        y={INN_Y - 8}
                        height={16}
                        fill="#b91c1c"
                        initial={{ width: 0 }}
                        animate={{ width: beat >= 3 ? mnd(6) - mnd(1.6) : 0 }}
                        transition={{ duration: 1.2, delay: beat >= 3 ? 0.6 : 0 }}
                    />
                    <circle
                        cx={mnd(6)}
                        cy={INN_Y}
                        r={16}
                        fill="#b91c1c"
                        stroke="#fff"
                        strokeWidth={5}
                    />
                    <text
                        x={mnd(6) + 24}
                        y={INN_Y - 34}
                        textAnchor="start"
                        {...etikett}
                        stroke="#fff"
                        fill="#b91c1c"
                    >
                        1. juli: Hongkong til Kina
                    </text>
                    <text
                        x={(mnd(1.6) + mnd(6)) / 2}
                        y={INN_Y + 80}
                        textAnchor="middle"
                        {...etikett}
                        stroke="#fff"
                        fontSize={32}
                        fill="#b91c1c"
                    >
                        drøyt fire måneder
                    </text>
                </Fram>

                {/* Hongkong-merket: britisk, så kinesisk */}
                <Fram vis={beat >= 1} forsinkelse={0.4}>
                    <g transform={`translate(1340 ${INN_Y - 20})`}>
                        <motion.circle
                            r={96}
                            stroke="#fff"
                            strokeWidth={8}
                            initial={false}
                            animate={{ fill: kinesisk ? '#dc2626' : '#1d4ed8' }}
                            transition={{ duration: 1, delay: kinesisk ? 1.6 : 0 }}
                        />
                        <text y={10} textAnchor="middle" fontSize={28} fontWeight={900} fill="#fff">
                            Hongkong
                        </text>
                        <text
                            y={146}
                            textAnchor="middle"
                            {...etikett}
                            fill={kinesisk ? '#b91c1c' : '#1d4ed8'}
                        >
                            {kinesisk ? 'tilbake til Kina' : 'britisk'}
                        </text>
                    </g>
                </Fram>
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
        </div>
    );
}
