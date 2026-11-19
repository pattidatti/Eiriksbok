import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Wu wei og ziran (1600x900).
 * - «ballen»: fotballbanen sett ovenfra. Den ene jager ballen, den andre står der den havner.
 * - «hagen»: lederen folk knapt merker, og gartneren som river opp planten.
 */
type Modus = 'ballen' | 'hagen';

const OVERSKRIFT: Record<Modus, string[]> = {
    ballen: [
        'Wu wei: «ikke-handling»?',
        'Wu wei er IKKE å ligge på sofaen',
        'Slutt å tvinge. Gjør lite, enkelt og rolig.',
        'Hun løper ikke etter ballen hele kampen',
        'Hun står der ballen kommer til å havne',
    ],
    hagen: [
        'Daodejing om den som styrer et land',
        'Den beste lederen merker folk knapt',
        'Ziran: av seg selv, slik det er naturlig',
        'Gartneren som river opp planten',
    ],
};

function Spiller({
    x,
    y,
    farge,
    nummer,
}: {
    x: number;
    y: number;
    farge: string;
    nummer?: string;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={30} fill={farge} stroke="#ffffff" strokeWidth={5} />
            {nummer && (
                <text y={11} textAnchor="middle" fontSize={30} fontWeight={900} fill="#ffffff">
                    {nummer}
                </text>
            )}
        </g>
    );
}

const JAG = 'M 300 300 L 520 640 L 760 260 L 980 600 L 1150 330 L 1260 520';
const PASNING = 'M 380 330 Q 760 160 980 690';

function Ballen({ beat }: { beat: number }) {
    return (
        <>
            <rect x={100} y={150} width={1400} height={700} rx={20} fill="#3f9d4a" />
            <g fill="none" stroke="#ffffff" strokeWidth={5} opacity={0.85}>
                <rect x={130} y={180} width={1340} height={640} />
                <line x1={800} y1={180} x2={800} y2={820} />
                <circle cx={800} cy={500} r={90} />
                <rect x={130} y={360} width={150} height={280} />
                <rect x={1320} y={360} width={150} height={280} />
            </g>

            {beat <= 1 && (
                <circle r={20} fill="#ffffff" stroke="#111827" strokeWidth={4}>
                    <animateMotion
                        dur="5s"
                        repeatCount="indefinite"
                        path="M 800 500 C 1000 400 1100 650 900 700 S 600 500 800 500"
                    />
                </circle>
            )}

            <AnimatePresence>
                {beat === 1 && (
                    <motion.g
                        key="sofa"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect
                            x={300}
                            y={560}
                            width={440}
                            height={200}
                            rx={24}
                            fill="#ffffff"
                            opacity={0.95}
                        />
                        <rect x={340} y={640} width={300} height={70} rx={16} fill="#7c3aed" />
                        <rect x={340} y={600} width={300} height={50} rx={14} fill="#8b5cf6" />
                        <circle cx={380} cy={612} r={20} fill="#f5d0a9" />
                        <rect x={400} y={600} width={200} height={30} rx={14} fill="#64748b" />
                        <g transform="translate(690 610)">
                            <circle r={34} fill="#dc2626" />
                            <path
                                d="M -14 -14 L 14 14 M 14 -14 L -14 14"
                                stroke="#ffffff"
                                strokeWidth={8}
                                strokeLinecap="round"
                            />
                        </g>
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g
                        key="kort"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <rect
                            x={330}
                            y={600}
                            width={940}
                            height={170}
                            rx={24}
                            fill="#ffffff"
                            opacity={0.95}
                        />
                        <text
                            x={800}
                            y={665}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Du handler fortsatt.
                        </text>
                        <text
                            x={800}
                            y={725}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#0f766e"
                        >
                            Du slutter bare å tvinge.
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>

            {beat >= 3 && (
                <>
                    <motion.path
                        d={JAG}
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth={8}
                        strokeLinejoin="round"
                        opacity={beat === 4 ? 0.35 : 0.8}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: beat === 3 ? 3.5 : 0 }}
                    />
                    <g>
                        {beat === 3 && <animateMotion dur="3.5s" fill="freeze" path={JAG} />}
                        <g transform={beat === 4 ? 'translate(1260 520)' : undefined}>
                            <Spiller x={0} y={0} farge="#64748b" />
                        </g>
                    </g>
                    {beat === 3 && (
                        <circle r={20} fill="#ffffff" stroke="#111827" strokeWidth={4}>
                            <animateMotion
                                dur="3.5s"
                                fill="freeze"
                                path="M 330 260 L 560 680 L 800 220 L 1020 640 L 1190 300 L 1300 540"
                            />
                        </circle>
                    )}
                    <rect
                        x={170}
                        y={190}
                        width={460}
                        height={60}
                        rx={16}
                        fill="#ffffff"
                        opacity={0.95}
                    />
                    <text
                        x={400}
                        y={232}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#334155"
                    >
                        grå: jager ballen overalt
                    </text>
                </>
            )}
            {beat >= 4 && (
                <>
                    <Spiller x={980} y={690} farge="#0d9488" />
                    <circle cx={980} cy={690} r={60} fill="none" stroke="#fde047" strokeWidth={6} />
                    <path d={PASNING} fill="none" stroke="#fde047" strokeWidth={5} opacity={0.7} />
                    <circle r={20} fill="#ffffff" stroke="#111827" strokeWidth={4}>
                        <animateMotion dur="2.5s" fill="freeze" path={PASNING} />
                    </circle>
                    <rect
                        x={970}
                        y={190}
                        width={480}
                        height={60}
                        rx={16}
                        fill="#ffffff"
                        opacity={0.95}
                    />
                    <text
                        x={1210}
                        y={232}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#0f766e"
                    >
                        grønn: leser spillet
                    </text>
                </>
            )}
        </>
    );
}

function Person({
    x,
    y,
    farge,
    skala = 1,
}: {
    x: number;
    y: number;
    farge: string;
    skala?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-46} r={20} fill={farge} />
            <path d="M -26 30 Q -26 -20 0 -22 Q 26 -20 26 30 Z" fill={farge} />
        </g>
    );
}

function Plante({ x, opp }: { x: number; opp: boolean }) {
    return (
        <motion.g
            initial={false}
            animate={{ y: opp ? -140 : 0, rotate: opp ? -12 : 0 }}
            transition={{ duration: 1.2, delay: 0.8 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
        >
            <g transform={`translate(${x} 700)`}>
                <path
                    d="M 0 0 C -5 -60 5 -120 0 -180"
                    stroke={opp ? '#a16207' : '#4d7c0f'}
                    strokeWidth={10}
                    fill="none"
                    style={{ transition: 'stroke 1s 1.6s' }}
                />
                {[-1, 1].map((s) => (
                    <ellipse
                        key={s}
                        cx={s * 40}
                        cy={-140}
                        rx={42}
                        ry={18}
                        fill={opp ? '#ca8a04' : '#65a30d'}
                        transform={`rotate(${s * -25} ${s * 40} -140)`}
                        style={{ transition: 'fill 1s 1.6s' }}
                    />
                ))}
                {opp && (
                    <g stroke="#78350f" strokeWidth={5} fill="none">
                        <path d="M 0 0 L -30 60" />
                        <path d="M 0 0 L 5 80" />
                        <path d="M 0 0 L 35 55" />
                    </g>
                )}
            </g>
        </motion.g>
    );
}

function Stilk({ hoyde }: { hoyde: number }) {
    return (
        <>
            <path d={`M 0 0 L 0 ${-hoyde}`} stroke="#4d7c0f" strokeWidth={10} />
            {[0.55, 0.85].map((f) =>
                [-1, 1].map((s) => (
                    <ellipse
                        key={`${f}${s}`}
                        cx={s * 40}
                        cy={-hoyde * f}
                        rx={42}
                        ry={18}
                        fill="#65a30d"
                    />
                ))
            )}
        </>
    );
}

function VoksPlante({ x, stor }: { x: number; stor: boolean }) {
    return (
        <g transform={`translate(${x} 700)`}>
            <motion.g
                initial={false}
                animate={{ opacity: stor ? 0 : 1 }}
                transition={{ duration: 1.2, delay: 1 }}
            >
                <Stilk hoyde={200} />
            </motion.g>
            <motion.g
                initial={false}
                animate={{ opacity: stor ? 1 : 0 }}
                transition={{ duration: 1.2, delay: 1 }}
            >
                <Stilk hoyde={360} />
            </motion.g>
        </g>
    );
}

function Hagen({ beat }: { beat: number }) {
    if (beat <= 1) {
        const byggere = [
            [600, 640],
            [760, 680],
            [930, 650],
            [1080, 690],
        ];
        return (
            <>
                <rect x={0} y={720} width={1600} height={180} fill="#cbbf9a" />
                {/* Huset folk bygger */}
                {Array.from({ length: 6 }, (_, i) => (
                    <motion.rect
                        key={i}
                        x={700 + (i % 3) * 110}
                        y={600 - Math.floor(i / 3) * 70}
                        width={100}
                        height={64}
                        fill="#d6a873"
                        stroke="#78350f"
                        strokeWidth={3}
                        initial={{ opacity: beat === 1 ? 0 : 1 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: beat === 1 ? 0.4 + i * 0.4 : 0 }}
                    />
                ))}
                {beat === 1 && (
                    <motion.path
                        d="M 680 460 L 855 360 L 1030 460 Z"
                        fill="#b45309"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.8 }}
                    />
                )}
                {byggere.map(([x, y], i) => (
                    <Person key={i} x={x - 150 + (beat === 1 ? 0 : -60)} y={y} farge="#0d9488" />
                ))}
                {/* Lederen: stor og i midten, så liten og stille i kanten */}
                <motion.g
                    initial={false}
                    animate={{
                        x: beat === 0 ? 0 : 900,
                        opacity: beat === 0 ? 1 : 0.45,
                        scale: beat === 0 ? 1.5 : 0.9,
                    }}
                    transition={{ duration: 1.4 }}
                >
                    <Person x={300} y={600} farge="#7c3aed" />
                    <path d="M 278 530 L 285 510 L 300 525 L 315 510 L 322 530 Z" fill="#facc15" />
                </motion.g>
                {beat === 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 3.2 }}
                    >
                        <rect x={260} y={300} width={400} height={90} rx={30} fill="#ffffff" />
                        <path d="M 400 390 L 440 390 L 430 440 Z" fill="#ffffff" />
                        <text
                            x={460}
                            y={358}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            Vi klarte det selv
                        </text>
                    </motion.g>
                )}
            </>
        );
    }
    return (
        <>
            <rect x={0} y={700} width={1600} height={200} fill="#7c5a3a" />
            <Plante x={480} opp={beat >= 3} />
            <VoksPlante x={1120} stor={beat >= 3} />
            {beat === 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <rect x={500} y={190} width={600} height={120} rx={24} fill="#ffffff" />
                    <text
                        x={800}
                        y={248}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f766e"
                    >
                        ziran
                    </text>
                    <text
                        x={800}
                        y={292}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#334155"
                    >
                        av seg selv, slik det er naturlig
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <>
                    <Person x={300} y={680} farge="#b45309" skala={1.6} />
                    <text
                        x={480}
                        y={800}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fef3c7"
                    >
                        river opp: mot ziran
                    </text>
                    <text
                        x={1120}
                        y={800}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fef3c7"
                    >
                        får vokse av seg selv
                    </text>
                </>
            )}
        </>
    );
}

export function DaoismeWuwei({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'ballen';
    const liste = OVERSKRIFT[modus];
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: modus === 'ballen' ? '#e7efe3' : '#e8f1f8' }}
        >
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'ballen' ? <Ballen beat={beat} /> : <Hagen beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
