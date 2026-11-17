import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Den muntlige tradisjonen: eventyret går fra munn til munn i flere hundre år og ender i en
 * bok. Og knaggrekka: eventyrets lover som faste knagger fortelleren henger handlingen på.
 */

type Modus = 'kjede' | 'knagger';

const FONT = 'Outfit, Inter, sans-serif';
const PAPIR = '#f6eedb';
const BLEKK = '#2b2118';

function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

/** En forteller: hode og skuldre i profil, vendt mot høyre. */
function Forteller({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -62 120 Q -62 40 0 40 Q 62 40 62 120 Z" fill={farge} />
            <circle cx={0} cy={0} r={38} fill={farge} />
            <path d="M 34 -4 L 50 8 L 34 14 Z" fill={farge} />
        </g>
    );
}

const FORTELLERE = [180, 420, 660, 900, 1140];
const FARGER = ['#7c5a3a', '#8a6a4a', '#6f5440', '#94765a', '#5f4632'];

function Kjede({ beat }: { beat: number }) {
    return (
        <>
            {/* Beat 0: på slump? En terning som ruller. */}
            <Vis nar={beat === 0}>
                <motion.g
                    initial={{ rotate: -40, x: -200 }}
                    animate={{ rotate: 0, x: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ transformOrigin: '800px 430px' }}
                >
                    <rect
                        x={680}
                        y={310}
                        width={240}
                        height={240}
                        rx={36}
                        fill="#fff"
                        stroke={BLEKK}
                        strokeWidth={8}
                    />
                    {[
                        [740, 370],
                        [860, 370],
                        [800, 430],
                        [740, 490],
                        [860, 490],
                    ].map(([cx, cy]) => (
                        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={20} fill={BLEKK} />
                    ))}
                </motion.g>
                <text
                    x={800}
                    y={180}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={84}
                    fill={BLEKK}
                >
                    Fri fantasi, på slump?
                </text>
                <text
                    x={800}
                    y={700}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={46}
                    fill="#7c5a3a"
                >
                    Det tror mange om eventyr
                </text>
            </Vis>

            {/* Beat 1: ingen kjent forfatter. */}
            <Vis nar={beat === 1}>
                <rect x={560} y={150} width={480} height={600} rx={18} fill="#7f1d1d" />
                <rect
                    x={590}
                    y={180}
                    width={420}
                    height={540}
                    rx={10}
                    fill="none"
                    stroke="#fcd34d"
                    strokeWidth={4}
                />
                <text
                    x={800}
                    y={330}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={64}
                    fill="#fde68a"
                >
                    Folkeeventyr
                </text>
                <text
                    x={800}
                    y={470}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={40}
                    fill="#fde68a"
                >
                    Forfatter:
                </text>
                <motion.text
                    x={800}
                    y={600}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={130}
                    fill="#fcd34d"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    ?
                </motion.text>
                <text
                    x={800}
                    y={830}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={800}
                    fontSize={46}
                    fill={BLEKK}
                >
                    Ingen vet hvem som fant det på
                </text>
            </Vis>

            {/* Beat 2-3: fra munn til munn, og til slutt inn i boka. */}
            <Vis nar={beat >= 2}>
                <text
                    x={800}
                    y={130}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={72}
                    fill={BLEKK}
                >
                    Fra munn til munn
                </text>
                {FORTELLERE.map((x, i) => (
                    <motion.g
                        key={x}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.25, duration: 0.5 }}
                    >
                        <Forteller x={x} y={420} farge={FARGER[i]} />
                    </motion.g>
                ))}
                {/* Snakkebobla som går videre fra forteller til forteller. */}
                {FORTELLERE.slice(0, 4).map((x, i) => (
                    <motion.g
                        key={`b${x}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 1] }}
                        transition={{ delay: 0.6 + i * 0.35, duration: 0.6 }}
                    >
                        <path
                            d={`M ${x + 70} 330 q 50 -46 100 0`}
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={8}
                            strokeLinecap="round"
                        />
                        <path d={`M ${x + 160} 318 l 14 14 l -20 6 Z`} fill="#b45309" />
                    </motion.g>
                ))}
                {/* Tidspil under: i flere hundre år. */}
                <line x1={120} y1={640} x2={1200} y2={640} stroke="#7c5a3a" strokeWidth={6} />
                <path d="M 1200 624 L 1232 640 L 1200 656 Z" fill="#7c5a3a" />
                <text
                    x={660}
                    y={712}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={800}
                    fontSize={48}
                    fill="#7c5a3a"
                >
                    i flere hundre år
                </text>
            </Vis>

            <Vis nar={beat >= 3} forsinkelse={0.3}>
                <path
                    d="M 1215 330 q 60 -50 110 10"
                    fill="none"
                    stroke="#b45309"
                    strokeWidth={8}
                    strokeLinecap="round"
                />
                <rect x={1290} y={300} width={250} height={320} rx={14} fill="#1e3a5f" />
                <rect
                    x={1310}
                    y={320}
                    width={210}
                    height={280}
                    rx={8}
                    fill="none"
                    stroke="#fcd34d"
                    strokeWidth={3}
                />
                <text
                    x={1415}
                    y={420}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={38}
                    fill="#fde68a"
                >
                    Asbjørnsen
                </text>
                <text
                    x={1415}
                    y={466}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={32}
                    fill="#fde68a"
                >
                    og
                </text>
                <text
                    x={1415}
                    y={512}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={38}
                    fill="#fde68a"
                >
                    Moe
                </text>
                <text
                    x={1415}
                    y={712}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={48}
                    fill={BLEKK}
                >
                    1800-tallet
                </text>
                <text
                    x={1415}
                    y={770}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={36}
                    fill="#7c5a3a"
                >
                    skrevet ned
                </text>
            </Vis>
        </>
    );
}

interface Lov {
    navn: string;
    fraBeat: number;
    linje: string;
    tegn: (x: number, y: number) => ReactNode;
}

function Person({ x, y, s = 1, farge }: { x: number; y: number; s?: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-58} r={16} fill={farge} />
            <path d="M -20 0 L -16 -38 Q 0 -46 16 -38 L 20 0 Z" fill={farge} />
        </g>
    );
}

const LOVER: Lov[] = [
    {
        navn: 'Innledningsloven',
        fraBeat: 2,
        linje: 'rolig start',
        tegn: (x, y) => (
            <text
                x={x}
                y={y - 20}
                textAnchor="middle"
                fontFamily="Georgia, serif"
                fontStyle="italic"
                fontWeight={700}
                fontSize={34}
                fill={BLEKK}
            >
                Det var en gang ...
            </text>
        ),
    },
    {
        navn: 'Tretallsloven',
        fraBeat: 3,
        linje: 'alt skjer tre ganger',
        tegn: (x, y) => (
            <g>
                {[-80, 0, 80].map((dx, i) => (
                    <g key={dx}>
                        <circle
                            cx={x + dx}
                            cy={y - 30}
                            r={28}
                            fill={i < 2 ? '#fecaca' : '#fde68a'}
                            stroke={i < 2 ? '#b91c1c' : '#b45309'}
                            strokeWidth={4}
                        />
                        <text
                            x={x + dx}
                            y={y - 19}
                            textAnchor="middle"
                            fontFamily={FONT}
                            fontWeight={900}
                            fontSize={30}
                            fill={i < 2 ? '#b91c1c' : '#92400e'}
                        >
                            {i < 2 ? '✗' : '★'}
                        </text>
                    </g>
                ))}
            </g>
        ),
    },
    {
        navn: 'Tvillingloven',
        fraBeat: 4,
        linje: 'to blir som én',
        tegn: (x, y) => (
            <g>
                <rect x={x - 70} y={y - 92} width={140} height={98} rx={20} fill="#dbeafe" />
                <Person x={x - 30} y={y} farge="#1d4ed8" />
                <Person x={x + 30} y={y} farge="#1d4ed8" />
            </g>
        ),
    },
    {
        navn: 'Motsetningsloven',
        fraBeat: 5,
        linje: 'to som er helt ulike',
        tegn: (x, y) => (
            <g>
                <Person x={x - 85} y={y} s={1.25} farge="#3f3f46" />
                <text
                    x={x}
                    y={y - 30}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={30}
                    fill={BLEKK}
                >
                    mot
                </text>
                <Person x={x + 85} y={y} s={0.8} farge="#d97706" />
            </g>
        ),
    },
];

const KNAGG_X = [245, 615, 985, 1355];
const BRETT_Y = 250;

function Knagger({ beat }: { beat: number }) {
    return (
        <>
            <text
                x={800}
                y={110}
                textAnchor="middle"
                fontFamily={FONT}
                fontWeight={900}
                fontSize={66}
                fill={BLEKK}
            >
                {beat === 0 ? 'Faste knagger å henge handlingen på' : 'Eventyrets lover'}
            </text>
            <Vis nar={beat >= 1}>
                <text
                    x={800}
                    y={168}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={700}
                    fontSize={38}
                    fill="#7c5a3a"
                >
                    Axel Olrik fant mange av dem
                </text>
            </Vis>
            {/* Knaggbrettet */}
            <rect x={90} y={BRETT_Y - 30} width={1420} height={60} rx={12} fill="#8b5e34" />
            <rect x={90} y={BRETT_Y + 18} width={1420} height={12} rx={6} fill="#6b4423" />
            {KNAGG_X.map((x) => (
                <g key={x}>
                    <circle cx={x} cy={BRETT_Y} r={20} fill="#4a2e16" />
                    <rect x={x - 7} y={BRETT_Y} width={14} height={44} rx={7} fill="#4a2e16" />
                </g>
            ))}
            {LOVER.map((l, i) => {
                const x = KNAGG_X[i];
                const aktiv = beat === l.fraBeat;
                if (beat < l.fraBeat) return null;
                return (
                    <motion.g
                        key={l.navn}
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 140, damping: 14 }}
                    >
                        <line
                            x1={x}
                            y1={BRETT_Y + 40}
                            x2={x}
                            y2={BRETT_Y + 90}
                            stroke="#4a2e16"
                            strokeWidth={4}
                        />
                        <rect
                            x={x - 170}
                            y={BRETT_Y + 90}
                            width={340}
                            height={500}
                            rx={22}
                            fill={aktiv ? '#fff7d6' : '#ffffff'}
                            stroke={aktiv ? '#d97706' : '#c8b796'}
                            strokeWidth={aktiv ? 8 : 4}
                        />
                        <text
                            x={x}
                            y={BRETT_Y + 160}
                            textAnchor="middle"
                            fontFamily={FONT}
                            fontWeight={900}
                            fontSize={32}
                            fill={BLEKK}
                        >
                            {l.navn}
                        </text>
                        {l.tegn(x, BRETT_Y + 360)}
                        <text
                            x={x}
                            y={BRETT_Y + 520}
                            textAnchor="middle"
                            fontFamily={FONT}
                            fontWeight={800}
                            fontSize={30}
                            fill="#3b2a1c"
                        >
                            {l.linje}
                        </text>
                    </motion.g>
                );
            })}
            <Vis nar={beat === 1}>
                {KNAGG_X.map((x) => (
                    <g key={x}>
                        <rect
                            x={x - 165}
                            y={BRETT_Y + 90}
                            width={330}
                            height={420}
                            rx={22}
                            fill="none"
                            stroke="#c8b796"
                            strokeWidth={4}
                            strokeDasharray="16 12"
                        />
                        <text
                            x={x}
                            y={BRETT_Y + 330}
                            textAnchor="middle"
                            fontFamily={FONT}
                            fontWeight={900}
                            fontSize={96}
                            fill="#c8b796"
                        >
                            ?
                        </text>
                    </g>
                ))}
            </Vis>
            <Vis nar={beat === 0}>
                {/* En fortelling som henger på knaggene: en rull med linjer. */}
                <rect
                    x={300}
                    y={BRETT_Y + 80}
                    width={1000}
                    height={360}
                    rx={24}
                    fill="#fffaf0"
                    stroke="#c8b796"
                    strokeWidth={4}
                />
                {KNAGG_X.map((x) => (
                    <line
                        key={x}
                        x1={x}
                        y1={BRETT_Y + 40}
                        x2={x}
                        y2={BRETT_Y + 80}
                        stroke="#4a2e16"
                        strokeWidth={4}
                        opacity={x > 300 && x < 1300 ? 1 : 0}
                    />
                ))}
                {[0, 1, 2, 3, 4].map((i) => (
                    <rect
                        key={i}
                        x={360}
                        y={BRETT_Y + 140 + i * 56}
                        width={i === 4 ? 520 : 880}
                        height={18}
                        rx={9}
                        fill="#d6c7a6"
                    />
                ))}
                <text
                    x={800}
                    y={BRETT_Y + 540}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={800}
                    fontSize={44}
                    fill="#7c5a3a"
                >
                    så fortelleren husker historien
                </text>
            </Vis>
        </>
    );
}

export function EventyrMunn({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kjede';
    return (
        <div className="absolute inset-0" style={{ background: PAPIR }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'kjede' ? <Kjede beat={beat} /> : <Knagger beat={beat} />}
            </svg>
        </div>
    );
}
