import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Fortellingene i daoismen, tegnet som tusj på papir (1600x900).
 * - «laozi»: arkivet, ritt vestover, vakta ved grensa, og tvilen om han fantes.
 * - «sommerfugl»: Zhuangzi og drømmen.
 * - «kniven»: kokken Ding som følger åpningene.
 */
type Modus = 'laozi' | 'sommerfugl' | 'kniven';

const OVERSKRIFT: Record<Modus, string[]> = {
    laozi: [
        'Laozi: «den gamle mesteren»',
        'Fortellingen: arkivet til kongehuset',
        'Fortellingen: han rir vestover',
        'Fortellingen: vakta ved grensa',
        'Fantes Laozi i det hele tatt?',
    ],
    sommerfugl: [
        'Zhuangzi, 369 til 286 før vår tidsregning',
        'Historier som snur ting på hodet',
        'Zhuangzi drømte at han var en sommerfugl',
        'Hvem drømmer hvem?',
        'Grensene vi tegner selv?',
    ],
    kniven: [
        'Kokken Ding deler opp en okse',
        'Han leter aldri etter beinet',
        'Han følger åpningene som er der',
        'Wu wei gjort håndfast',
    ],
};

const BLEKK = '#1c1917';

function Vismann({
    x,
    y,
    skala = 1,
    falmet = false,
}: {
    x: number;
    y: number;
    skala?: number;
    falmet?: boolean;
}) {
    return (
        <g
            transform={`translate(${x} ${y}) scale(${skala})`}
            opacity={falmet ? 0.3 : 1}
            style={{ transition: 'opacity 0.8s' }}
        >
            <path
                d="M -70 200 Q -60 40 0 30 Q 60 40 70 200 Z"
                fill="#a8977a"
                stroke={BLEKK}
                strokeWidth={4}
            />
            <circle cx={0} cy={0} r={34} fill="#f5e6c8" stroke={BLEKK} strokeWidth={4} />
            <path d="M -22 14 Q 0 90 22 14 Z" fill="#f8fafc" stroke={BLEKK} strokeWidth={3} />
            <circle cx={0} cy={-38} r={12} fill="#e5e7eb" stroke={BLEKK} strokeWidth={3} />
            <line
                x1={82}
                y1={-30}
                x2={82}
                y2={200}
                stroke="#78350f"
                strokeWidth={8}
                strokeLinecap="round"
            />
        </g>
    );
}

function Laozi({ beat }: { beat: number }) {
    return (
        <>
            {/* Fjell i bakgrunnen */}
            <path
                d="M 0 700 L 220 430 L 380 600 L 560 380 L 760 640 L 980 420 L 1200 620 L 1380 470 L 1600 660 L 1600 900 L 0 900 Z"
                fill="#d6cfbf"
            />
            <line x1={0} y1={760} x2={1600} y2={760} stroke={BLEKK} strokeWidth={3} opacity={0.5} />

            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {[0, 1, 2].map((h) => (
                        <g key={h}>
                            <rect
                                x={980}
                                y={280 + h * 150}
                                width={460}
                                height={14}
                                fill="#78350f"
                            />
                            {Array.from({ length: 7 }, (_, i) => (
                                <motion.rect
                                    key={i}
                                    x={1000 + i * 62}
                                    y={200 + h * 150}
                                    width={38}
                                    height={80}
                                    rx={8}
                                    fill="#e7d3a6"
                                    stroke={BLEKK}
                                    strokeWidth={3}
                                    initial={{ rotate: 0 }}
                                    animate={{
                                        rotate: i % 3 === 1 ? 24 : 0,
                                        opacity: i % 4 === 2 ? 0.35 : 1,
                                    }}
                                    transition={{ delay: 1.5 + i * 0.15 }}
                                    style={{
                                        transformBox: 'fill-box',
                                        transformOrigin: 'bottom left',
                                    }}
                                />
                            ))}
                        </g>
                    ))}
                    <text
                        x={1210}
                        y={760}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={BLEKK}
                    >
                        alt forfalt
                    </text>
                </motion.g>
            )}

            {beat <= 1 && <Vismann x={beat === 0 ? 800 : 560} y={480} skala={1.2} />}

            {beat === 2 && (
                <>
                    <motion.g
                        initial={{ x: 1300 }}
                        animate={{ x: 500 }}
                        transition={{ duration: 4, ease: 'easeOut' }}
                    >
                        <Rytter />
                    </motion.g>
                    <g>
                        <line
                            x1={420}
                            y1={250}
                            x2={180}
                            y2={250}
                            stroke="#b45309"
                            strokeWidth={10}
                        />
                        <path d="M 150 250 L 200 220 L 200 280 Z" fill="#b45309" />
                        <text
                            x={300}
                            y={225}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#b45309"
                        >
                            vest
                        </text>
                    </g>
                </>
            )}

            {beat === 3 && (
                <>
                    {/* Grenseport */}
                    <rect x={300} y={360} width={60} height={400} fill="#7f1d1d" />
                    <rect x={620} y={360} width={60} height={400} fill="#7f1d1d" />
                    <path d="M 260 360 L 720 360 L 690 300 L 290 300 Z" fill="#991b1b" />
                    <text
                        x={490}
                        y={350}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#fef3c7"
                    >
                        grensa
                    </text>
                    <g transform="translate(480 600) scale(1.3)">
                        <circle
                            cx={0}
                            cy={-90}
                            r={24}
                            fill="#f5e6c8"
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        <path
                            d="M -40 120 Q -40 -60 0 -62 Q 40 -60 40 120 Z"
                            fill="#475569"
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        <line x1={55} y1={-120} x2={55} y2={120} stroke={BLEKK} strokeWidth={6} />
                    </g>
                    <text
                        x={480}
                        y={820}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={BLEKK}
                    >
                        vakta
                    </text>
                    <Vismann x={1000} y={480} skala={1.1} />
                    <motion.g
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                    >
                        <rect
                            x={1180}
                            y={460}
                            width={300}
                            height={200}
                            rx={14}
                            fill="#fef3c7"
                            stroke={BLEKK}
                            strokeWidth={5}
                        />
                        <line
                            x1={1330}
                            y1={460}
                            x2={1330}
                            y2={660}
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        {[0, 1, 2, 3].map((l) => (
                            <g key={l}>
                                <line
                                    x1={1205}
                                    y1={500 + l * 34}
                                    x2={1305}
                                    y2={500 + l * 34}
                                    stroke="#78716c"
                                    strokeWidth={4}
                                />
                                <line
                                    x1={1355}
                                    y1={500 + l * 34}
                                    x2={1455}
                                    y2={500 + l * 34}
                                    stroke="#78716c"
                                    strokeWidth={4}
                                />
                            </g>
                        ))}
                        <text
                            x={1330}
                            y={710}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            Daodejing
                        </text>
                    </motion.g>
                </>
            )}

            {beat >= 4 && (
                <>
                    <g opacity={0.35}>
                        <Vismann x={330} y={420} skala={1.1} />
                    </g>
                    <text
                        x={330}
                        y={380}
                        textAnchor="middle"
                        fontSize={150}
                        fontWeight={900}
                        fill="#b45309"
                    >
                        ?
                    </text>
                    <rect x={560} y={420} width={940} height={300} rx={28} fill="#ffffff" />
                    <circle cx={640} cy={560} r={22} fill="#a8977a" />
                    <text
                        x={640}
                        y={630}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={BLEKK}
                    >
                        Laozi skal
                    </text>
                    <text
                        x={640}
                        y={664}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={BLEKK}
                    >
                        ha levd
                    </text>
                    <motion.line
                        x1={670}
                        y1={560}
                        x2={1370}
                        y2={560}
                        stroke="#b45309"
                        strokeWidth={8}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    />
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                    >
                        <text
                            x={1020}
                            y={520}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#b45309"
                        >
                            trolig 200 til 300 år
                        </text>
                        <rect
                            x={1370}
                            y={530}
                            width={60}
                            height={60}
                            rx={6}
                            fill="#fef3c7"
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        <text
                            x={1400}
                            y={630}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill={BLEKK}
                        >
                            boka
                        </text>
                        <text
                            x={1400}
                            y={664}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill={BLEKK}
                        >
                            skrevet ned
                        </text>
                    </motion.g>
                    <text
                        x={1030}
                        y={470}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#475569"
                    >
                        trolig, ut fra det folk husket og fortalte
                    </text>
                </>
            )}
        </>
    );
}

function Rytter() {
    return (
        <g transform="translate(0 560)">
            <ellipse cx={0} cy={0} rx={120} ry={55} fill="#8b6b4a" stroke={BLEKK} strokeWidth={4} />
            {[-80, -40, 50, 90].map((x) => (
                <line key={x} x1={x} y1={30} x2={x} y2={190} stroke={BLEKK} strokeWidth={10} />
            ))}
            <path
                d="M -110 -20 L -170 -90 L -200 -70 L -150 10 Z"
                fill="#8b6b4a"
                stroke={BLEKK}
                strokeWidth={4}
            />
            <path d="M 110 -10 Q 160 20 150 70" fill="none" stroke={BLEKK} strokeWidth={8} />
            <g transform="translate(0 -60) scale(0.6)">
                <Vismann x={0} y={-140} />
            </g>
        </g>
    );
}

function Sommerfugl({ x, y, skala = 1 }: { x: number; y: number; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <motion.g
                animate={{ scaleX: [1, 0.45, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
                <ellipse
                    cx={-38}
                    cy={-22}
                    rx={40}
                    ry={32}
                    fill="#f59e0b"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
                <ellipse
                    cx={38}
                    cy={-22}
                    rx={40}
                    ry={32}
                    fill="#f59e0b"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
                <ellipse
                    cx={-28}
                    cy={24}
                    rx={26}
                    ry={22}
                    fill="#fb923c"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
                <ellipse
                    cx={28}
                    cy={24}
                    rx={26}
                    ry={22}
                    fill="#fb923c"
                    stroke={BLEKK}
                    strokeWidth={3}
                />
            </motion.g>
            <rect x={-6} y={-40} width={12} height={80} rx={6} fill={BLEKK} />
        </g>
    );
}

function Zhuangzi({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            <motion.g
                key={beat <= 1 ? 'a' : beat === 2 ? 'b' : 'c'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {beat <= 1 && (
                    <>
                        <Vismann x={480} y={440} skala={1.2} />
                        <rect
                            x={820}
                            y={260}
                            width={620}
                            height={440}
                            rx={20}
                            fill="#fef3c7"
                            stroke={BLEKK}
                            strokeWidth={5}
                        />
                        <line
                            x1={1130}
                            y1={260}
                            x2={1130}
                            y2={700}
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        <text
                            x={1130}
                            y={760}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            Zhuangzi (boka)
                        </text>
                        {beat === 1 &&
                            ['historier', 'vitser', 'snur ting på hodet'].map((t, i) => (
                                <motion.text
                                    key={t}
                                    x={i < 2 ? 975 : 1285}
                                    y={i < 2 ? 380 + i * 120 : 480}
                                    textAnchor="middle"
                                    fontSize={i === 2 ? 34 : 44}
                                    fontWeight={800}
                                    fill="#b45309"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 + i * 0.6 }}
                                >
                                    {t}
                                </motion.text>
                            ))}
                        {beat === 1 && (
                            <motion.path
                                d="M 1240 560 A 50 50 0 1 1 1330 560"
                                fill="none"
                                stroke="#b45309"
                                strokeWidth={6}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.8 }}
                            />
                        )}
                    </>
                )}
                {beat === 2 && (
                    <>
                        {/* Zhuangzi sover */}
                        <rect
                            x={260}
                            y={640}
                            width={560}
                            height={40}
                            rx={10}
                            fill="#a8977a"
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        <g transform="translate(540 600) rotate(-90)">
                            <path
                                d="M -40 230 Q -36 30 0 24 Q 36 30 40 230 Z"
                                fill="#a8977a"
                                stroke={BLEKK}
                                strokeWidth={4}
                            />
                            <circle
                                cx={0}
                                cy={-6}
                                r={30}
                                fill="#f5e6c8"
                                stroke={BLEKK}
                                strokeWidth={4}
                            />
                        </g>
                        <text x={650} y={560} fontSize={48} fontWeight={900} fill="#64748b">
                            z z z
                        </text>
                        <circle
                            cx={760}
                            cy={480}
                            r={16}
                            fill="#ffffff"
                            stroke={BLEKK}
                            strokeWidth={3}
                        />
                        <circle
                            cx={820}
                            cy={420}
                            r={26}
                            fill="#ffffff"
                            stroke={BLEKK}
                            strokeWidth={3}
                        />
                        <ellipse
                            cx={1120}
                            cy={330}
                            rx={300}
                            ry={200}
                            fill="#ffffff"
                            stroke={BLEKK}
                            strokeWidth={4}
                        />
                        <motion.g
                            animate={{ x: [0, 40, -30, 0], y: [0, -30, 10, 0] }}
                            transition={{ duration: 6, repeat: Infinity }}
                        >
                            <Sommerfugl x={1120} y={330} skala={1.6} />
                        </motion.g>
                    </>
                )}
                {beat >= 3 && (
                    <>
                        <Vismann x={420} y={400} skala={1.1} />
                        <Sommerfugl x={1180} y={480} skala={2.2} />
                        <motion.path
                            d="M 620 330 Q 800 200 980 330"
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={7}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 0.4 }}
                        />
                        <path d="M 985 335 L 950 300 L 940 345 Z" fill="#b45309" />
                        <motion.path
                            d="M 980 640 Q 800 770 620 640"
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={7}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.2 }}
                        />
                        <path d="M 615 635 L 650 670 L 660 625 Z" fill="#b45309" />
                        {beat === 3 ? (
                            <>
                                <text
                                    x={800}
                                    y={200}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill={BLEKK}
                                >
                                    En mann som drømte om en sommerfugl?
                                </text>
                                <text
                                    x={800}
                                    y={810}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill={BLEKK}
                                >
                                    En sommerfugl som drømmer at den er en mann?
                                </text>
                            </>
                        ) : (
                            <>
                                <motion.line
                                    x1={800}
                                    y1={260}
                                    x2={800}
                                    y2={700}
                                    stroke="#dc2626"
                                    strokeWidth={8}
                                    initial={{ opacity: 1 }}
                                    animate={{ opacity: 0.15 }}
                                    transition={{ delay: 1.2, duration: 1.5 }}
                                />
                                <rect
                                    x={560}
                                    y={770}
                                    width={480}
                                    height={66}
                                    rx={18}
                                    fill="#ffffff"
                                />
                                <text
                                    x={800}
                                    y={815}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                    fill="#dc2626"
                                >
                                    en grense vi selv har tegnet?
                                </text>
                            </>
                        )}
                    </>
                )}
            </motion.g>
        </AnimatePresence>
    );
}

// Oksen tegnet som en enkel form delt i stykker. Åpningene mellom stykkene er kniven sin vei.
const APNING =
    'M 600 330 C 610 420 590 520 605 640 M 800 300 C 790 420 815 540 800 670 M 1000 320 C 1010 420 990 540 1000 650 M 605 480 C 700 470 900 495 1000 480';
const KNIVVEI =
    'M 600 330 C 610 420 590 520 605 480 C 700 470 900 495 1000 480 C 1010 420 990 360 1000 320';

function Kniven({ beat }: { beat: number }) {
    const fra = beat >= 2 ? 1 : 0;
    const deler = [
        { x: -fra * 14, y: -fra * 10 },
        { x: fra * 14, y: -fra * 10 },
        { x: -fra * 14, y: fra * 10 },
        { x: fra * 14, y: fra * 10 },
    ];
    return (
        <>
            <g transform="translate(150 380)">
                <circle cx={0} cy={-60} r={40} fill="#f5e6c8" stroke={BLEKK} strokeWidth={4} />
                <rect
                    x={-34}
                    y={-130}
                    width={68}
                    height={40}
                    rx={10}
                    fill="#ffffff"
                    stroke={BLEKK}
                    strokeWidth={4}
                />
                <path
                    d="M -70 260 Q -60 -10 0 -16 Q 60 -10 70 260 Z"
                    fill="#e2e8f0"
                    stroke={BLEKK}
                    strokeWidth={4}
                />
                <text x={0} y={310} textAnchor="middle" fontSize={36} fontWeight={900} fill={BLEKK}>
                    Ding
                </text>
            </g>
            <ellipse
                cx={800}
                cy={480}
                rx={380}
                ry={210}
                fill="#d4a373"
                stroke={BLEKK}
                strokeWidth={5}
                opacity={0.35}
            />
            {[
                'M 430 480 Q 430 300 600 290 L 605 480 Z',
                'M 1000 320 Q 1170 330 1180 480 L 1000 480 Z',
                'M 430 480 Q 440 660 605 650 L 605 480 Z',
                'M 1000 480 L 1180 480 Q 1170 650 1000 650 Z',
            ].map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="#c08457"
                    stroke={BLEKK}
                    strokeWidth={4}
                    initial={false}
                    animate={deler[i]}
                    transition={{ delay: 1.5, duration: 1.2 }}
                />
            ))}
            <path
                d="M 605 290 L 1000 320 L 1000 650 L 605 650 Z"
                fill="#c08457"
                stroke={BLEKK}
                strokeWidth={4}
            />
            <path
                d={APNING}
                fill="none"
                stroke="#fef3c7"
                strokeWidth={beat >= 2 ? 10 : 5}
                style={{ transition: 'stroke-width 0.6s' }}
            />
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {[
                        [700, 390],
                        [900, 400],
                        [700, 570],
                        [900, 570],
                    ].map(([x, y], i) => (
                        <ellipse
                            key={i}
                            cx={x}
                            cy={y}
                            rx={50}
                            ry={20}
                            fill="#f8fafc"
                            stroke="#94a3b8"
                            strokeWidth={3}
                        />
                    ))}
                    <text
                        x={800}
                        y={250}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={BLEKK}
                    >
                        beinet
                    </text>
                    <g transform="translate(1290 330)">
                        <circle r={46} fill="#dc2626" />
                        <path
                            d="M -20 -20 L 20 20 M 20 -20 L -20 20"
                            stroke="#ffffff"
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                    </g>
                    <text
                        x={1290}
                        y={420}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#b91c1c"
                    >
                        ikke mot beinet
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <g>
                    <g>
                        <animateMotion dur="4s" fill="freeze" rotate="auto" path={KNIVVEI} />
                        <path
                            d="M -10 -8 L 70 -2 L 70 4 L -10 8 Z"
                            fill="#e2e8f0"
                            stroke={BLEKK}
                            strokeWidth={3}
                        />
                        <rect x={-50} y={-9} width={40} height={18} rx={4} fill="#78350f" />
                    </g>
                </g>
            )}
            {beat >= 2 && <rect x={1180} y={730} width={380} height={66} rx={18} fill="#ffffff" />}
            {beat >= 2 && (
                <text
                    x={1370}
                    y={775}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#0f766e"
                >
                    {beat === 2 ? 'aldri sløv' : 'slutter å hugge'}
                </text>
            )}
            <text x={800} y={780} textAnchor="middle" fontSize={30} fontWeight={700} fill="#57534e">
                oksen, tegnet forenklet
            </text>
        </>
    );
}

export function DaoismeFortelling({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'laozi';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f1e9d8' }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'laozi' && <Laozi beat={beat} />}
                {modus === 'sommerfugl' && <Zhuangzi beat={beat} />}
                {modus === 'kniven' && <Kniven beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
