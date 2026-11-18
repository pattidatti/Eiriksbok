import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { BLEKK, BONDE, KONGE, PAPIR, ROD } from './farger';
import { Figur } from './figurer';

/**
 * Bøndenes to seire på Stortinget i 1836 og 1837. Til venstre: skatten på jord og eiendom
 * løftes av gården og byhuset. Til høyre: folk i bygda går til valg og velger sitt eget
 * styre for kommunen (formannskapslovene). Til slutt: slik har vi kommunestyrer i dag.
 */

function Gard({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-150} y={20} width={300} height={40} rx={10} fill="#a3e635" opacity={0.5} />
            <rect x={-90} y={-70} width={130} height={90} fill="#b91c1c" />
            <path d="M -105 -70 L -25 -130 L 55 -70 Z" fill="#7f1d1d" />
            <rect x={-40} y={-30} width={30} height={50} fill="#fef3c7" />
            <rect x={60} y={-40} width={70} height={60} fill="#92400e" />
            <path d="M 52 -40 L 95 -75 L 138 -40 Z" fill="#78350f" />
        </g>
    );
}

function Byhus({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-60}
                y={-130}
                width={120}
                height={190}
                fill="#e7e5e4"
                stroke="#a8a29e"
                strokeWidth={4}
            />
            <path d="M -70 -130 L 0 -175 L 70 -130 Z" fill="#57534e" />
            {[-95, -45, 5].map((yy) =>
                [-35, 15].map((xx) => (
                    <rect key={`${xx}${yy}`} x={xx} y={yy} width={22} height={30} fill="#93c5fd" />
                ))
            )}
        </g>
    );
}

function Herad({ x, y, aktiv }: { x: number; y: number; aktiv: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect
                x={-110}
                y={-90}
                width={220}
                height={110}
                fill={aktiv ? '#fef3c7' : '#f1f5f9'}
                stroke={BLEKK}
                strokeWidth={4}
            />
            <path d="M -125 -90 L 0 -160 L 125 -90 Z" fill={aktiv ? BONDE : '#94a3b8'} />
            <rect x={-20} y={-40} width={40} height={60} fill="#78350f" />
        </g>
    );
}

function Mynt({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={62} fill={KONGE} stroke="#a16207" strokeWidth={8} />
            <text y={14} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                Skatt
            </text>
        </g>
    );
}

function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`} stroke={ROD} strokeWidth={14} strokeLinecap="round">
            <line x1={-26} y1={-26} x2={26} y2={26} />
            <line x1={26} y1={-26} x2={-26} y2={26} />
        </g>
    );
}

function Hake({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 26} ${y} L ${x - 6} ${y + 22} L ${x + 30} ${y - 24}`}
            stroke={BONDE}
            strokeWidth={14}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
        />
    );
}

const VELGERE: { type: 'bonde' | 'borger'; fra: number; til: number }[] = [
    { type: 'bonde', fra: 880, til: 1080 },
    { type: 'borger', fra: 960, til: 1150 },
    { type: 'bonde', fra: 1040, til: 1220 },
    { type: 'bonde', fra: 1460, til: 1290 },
    { type: 'borger', fra: 1520, til: 1360 },
];

export function EmbetsmannsSeire({ beat }: VisualProps) {
    const venstreAktiv = beat === 1 || beat === 3;
    const hoyreAktiv = beat >= 2;
    const skattBorte = beat >= 1;
    const valgt = beat >= 2;

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-green-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <text
                    x={800}
                    y={86}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    Stortinget 1836 til 1837
                </text>

                {/* Venstre: skatten på jord og eiendom */}
                <motion.g
                    animate={{ opacity: beat === 0 || venstreAktiv ? 1 : 0.4 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={60}
                        y={140}
                        width={700}
                        height={600}
                        rx={30}
                        fill="#fff"
                        stroke={beat === 1 ? KONGE : '#e2e8f0'}
                        strokeWidth={beat === 1 ? 8 : 4}
                    />
                    <text
                        x={410}
                        y={210}
                        textAnchor="middle"
                        fontSize={42}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Seier 1
                    </text>
                    <Gard x={260} y={600} />
                    <Byhus x={580} y={600} />
                    <text
                        x={260}
                        y={705}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#475569"
                    >
                        på landet
                    </text>
                    <text
                        x={580}
                        y={705}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#475569"
                    >
                        i byen
                    </text>
                    {/* Myntene ligger på gården og byhuset, og løftes bort på beat 1 */}
                    <motion.g
                        initial={false}
                        animate={{ y: skattBorte ? -150 : 0, opacity: skattBorte ? 0 : 1 }}
                        transition={{
                            duration: 1.2,
                            ease: 'easeInOut',
                            delay: skattBorte ? 0.4 : 0,
                        }}
                    >
                        <Mynt x={230} y={400} />
                        <Mynt x={580} y={350} />
                    </motion.g>
                    {skattBorte && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            <rect
                                x={110}
                                y={250}
                                width={600}
                                height={90}
                                rx={45}
                                fill={PAPIR}
                                stroke="#d6cfbd"
                                strokeWidth={4}
                            />
                            <Kryss x={170} y={295} />
                            <text
                                x={430}
                                y={308}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill={BLEKK}
                            >
                                Skatt på jord og eiendom
                            </text>
                            <text
                                x={410}
                                y={400}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill={ROD}
                            >
                                fjernet, i by og på land
                            </text>
                        </motion.g>
                    )}
                </motion.g>

                {/* Høyre: folk i bygda velger sitt eget styre */}
                <motion.g
                    animate={{ opacity: beat === 0 || hoyreAktiv ? 1 : 0.4 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={840}
                        y={140}
                        width={700}
                        height={600}
                        rx={30}
                        fill="#fff"
                        stroke={beat === 2 ? BONDE : '#e2e8f0'}
                        strokeWidth={beat === 2 ? 8 : 4}
                    />
                    <text
                        x={1190}
                        y={210}
                        textAnchor="middle"
                        fontSize={42}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Seier 2
                    </text>
                    <Herad x={1190} y={460} aktiv={valgt} />
                    {VELGERE.map((v, i) => (
                        <motion.g
                            key={i}
                            initial={false}
                            animate={{ x: valgt ? v.til : v.fra, opacity: beat === 0 ? 0.35 : 1 }}
                            transition={{
                                duration: valgt ? 1.4 : 0,
                                delay: valgt ? 0.2 + i * 0.12 : 0,
                                ease: 'easeOut',
                            }}
                        >
                            <g transform="translate(0 650) scale(0.42)">
                                <Figur type={v.type} />
                            </g>
                        </motion.g>
                    ))}
                    {valgt && (
                        <motion.g
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.4 }}
                        >
                            <rect
                                x={890}
                                y={250}
                                width={600}
                                height={90}
                                rx={45}
                                fill={PAPIR}
                                stroke="#d6cfbd"
                                strokeWidth={4}
                            />
                            <Hake x={950} y={295} />
                            <text
                                x={1235}
                                y={307}
                                textAnchor="middle"
                                fontSize={32}
                                fontWeight={900}
                                fill={BLEKK}
                            >
                                Bygd og by velger eget styre
                            </text>
                            <text
                                x={1190}
                                y={705}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={800}
                                fill="#475569"
                            >
                                formannskapslovene, januar 1837
                            </text>
                        </motion.g>
                    )}
                </motion.g>

                {beat >= 3 && (
                    <motion.g
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 140, damping: 18 }}
                    >
                        <rect x={360} y={775} width={880} height={95} rx={47} fill={BONDE} />
                        <text
                            x={800}
                            y={837}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Derfor har vi kommunestyrer i dag
                        </text>
                    </motion.g>
                )}
            </svg>
        </div>
    );
}
