import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hoffet i Paris før 1572: en sal med tronen i midten. Katarina av Medici står til venstre,
 * Coligny til høyre, og linjene viser hvem som har kongens øre. Ingen vold vises, bare
 * hvem som påvirker hvem.
 */

const B = 1600;
const H = 900;
const PROTESTANT = '#0f766e';
const KATOLSK = '#7e22ce';
const ROD = '#b91c1c';
const GULL = '#d4a017';

const GULV = 640;
const KATARINA: [number, number] = [430, 560];
const KONGEN: [number, number] = [800, 520];
const COLIGNY: [number, number] = [1170, 560];

interface Kort {
    tekst: string;
    farge?: string;
}

/** Kortene øverst i salen, per beat. Første kort er overskriften. */
const KORT: Kort[][] = [
    [{ tekst: 'Fra 1562' }, { tekst: 'Religionskriger i Frankrike', farge: ROD }],
    [{ tekst: 'Katarina av Medici' }, { tekst: 'Moren til kongen og bruden', farge: KATOLSK }],
    [
        { tekst: 'Gaspard de Coligny' },
        { tekst: 'Katarina er redd: han får for mye makt over kongen', farge: PROTESTANT },
    ],
    [{ tekst: 'Første forsøk' }, { tekst: 'Coligny blir bare lettere såret', farge: ROD }],
    [
        { tekst: 'Katarina til kongen' },
        { tekst: 'Hugenottene planlegger et opprør', farge: KATOLSK },
        { tekst: 'Kongen gir ordre om å drepe dem', farge: ROD },
    ],
];

/** Kortbredde ut fra tekstlengden (ca. 0,55 x skriftstørrelse per tegn). */
const bredde = (tekst: string, fs: number) => Math.round(tekst.length * fs * 0.56 + 56);

export function HugenotteneHoffet({ beat }: VisualProps) {
    const kort = KORT[Math.min(beat, KORT.length - 1)];
    const kongeRod = beat >= 4;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#2a1d14' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Sal />

                {/* Beat 0: to leirer med faner, og krigen mellom dem */}
                {beat === 0 && <Leirer />}

                {/* Coligny har kongens øre: et tykt bånd, som blir tynt når Katarina tar over */}
                {beat >= 2 && (
                    <motion.line
                        x1={KONGEN[0] + 80}
                        y1={KONGEN[1] - 30}
                        x2={COLIGNY[0] - 72}
                        y2={COLIGNY[1] - 30}
                        stroke={PROTESTANT}
                        strokeLinecap="round"
                        initial={{ pathLength: 0, strokeWidth: 18 }}
                        animate={{ pathLength: 1, strokeWidth: beat >= 4 ? 4 : 18 }}
                        transition={{ duration: 1 }}
                    />
                )}
                {beat >= 4 && (
                    <motion.path
                        d={`M ${KATARINA[0] + 60} ${KATARINA[1] - 110} Q ${(KATARINA[0] + KONGEN[0]) / 2} ${KONGEN[1] - 260} ${KONGEN[0] - 60} ${KONGEN[1] - 130}`}
                        fill="none"
                        stroke={ROD}
                        strokeWidth={14}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4 }}
                    />
                )}

                {beat >= 1 && <Figur pos={KATARINA} farge={KATOLSK} navn="Katarina" />}
                {beat >= 2 && <Trone />}
                {beat >= 2 && (
                    <Figur pos={KONGEN} farge={kongeRod ? ROD : KATOLSK} navn="Karl 9." krone />
                )}
                {beat >= 2 && (
                    <Figur pos={COLIGNY} farge={PROTESTANT} navn="Coligny" saaret={beat >= 3} />
                )}

                {/* Ordren går ut fra tronen: et rødt segl */}
                {beat >= 4 && (
                    <motion.g
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.4, type: 'spring', stiffness: 180, damping: 14 }}
                        style={{ transformOrigin: `${KONGEN[0]}px 790px` }}
                    >
                        <rect
                            x={KONGEN[0] - 90}
                            y={735}
                            width={180}
                            height={110}
                            rx={8}
                            fill="#f5ecd7"
                            stroke="#8a6d3b"
                            strokeWidth={4}
                        />
                        <line
                            x1={KONGEN[0] - 60}
                            y1={765}
                            x2={KONGEN[0] + 60}
                            y2={765}
                            stroke="#8a6d3b"
                            strokeWidth={5}
                        />
                        <line
                            x1={KONGEN[0] - 60}
                            y1={790}
                            x2={KONGEN[0] + 40}
                            y2={790}
                            stroke="#8a6d3b"
                            strokeWidth={5}
                        />
                        <circle cx={KONGEN[0] + 50} cy={815} r={22} fill={ROD} />
                    </motion.g>
                )}

                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => {
                        const fs = i === 0 ? 44 : 34;
                        const w = bredde(k.tekst, fs);
                        const y = 60 + (i === 0 ? 0 : 92 + (i - 1) * 78);
                        const h = i === 0 ? 76 : 64;
                        return (
                            <motion.g
                                key={`${beat}-${k.tekst}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ delay: i * 0.45, duration: 0.5 }}
                            >
                                <rect
                                    x={B / 2 - w / 2}
                                    y={y}
                                    width={w}
                                    height={h}
                                    rx={16}
                                    fill={i === 0 ? '#0f172a' : '#ffffff'}
                                    stroke={k.farge ?? 'none'}
                                    strokeWidth={k.farge ? 6 : 0}
                                />
                                <text
                                    x={B / 2}
                                    y={y + h / 2 + fs * 0.35}
                                    textAnchor="middle"
                                    fontSize={fs}
                                    fontWeight={900}
                                    fill={i === 0 ? '#ffffff' : '#0f172a'}
                                >
                                    {k.tekst}
                                </text>
                            </motion.g>
                        );
                    })}
                </AnimatePresence>
            </svg>
        </div>
    );
}

/** Salen: vegg med søyler og tepper, rutete gulv. */
function Sal() {
    const ruter = [];
    for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 3; j++) {
            if ((i + j) % 2 === 0)
                ruter.push(
                    <rect
                        key={`${i}-${j}`}
                        x={i * 100}
                        y={GULV + j * 87}
                        width={100}
                        height={87}
                        fill="#6b4e33"
                    />
                );
        }
    }
    return (
        <g>
            <rect x={0} y={0} width={B} height={GULV} fill="#5b3a29" />
            {[100, 500, 1100, 1500].map((x) => (
                <g key={x}>
                    <rect x={x - 34} y={0} width={68} height={GULV} fill="#7a5638" />
                    <rect x={x - 46} y={GULV - 30} width={92} height={30} fill="#8c6844" />
                </g>
            ))}
            {[300, 1300].map((x) => (
                <g key={x}>
                    <rect x={x - 110} y={300} width={220} height={260} fill="#3b2a6b" />
                    <path d={`M ${x - 110} 560 L ${x} 600 L ${x + 110} 560 Z`} fill="#3b2a6b" />
                    <text x={x} y={460} textAnchor="middle" fontSize={90} fill={GULL} opacity={0.7}>
                        ⚜
                    </text>
                </g>
            ))}
            <rect x={0} y={GULV} width={B} height={H - GULV} fill="#8c6a48" />
            {ruter}
        </g>
    );
}

function Trone() {
    const [x, y] = KONGEN;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={x - 110}
                y={y - 210}
                width={220}
                height={330}
                rx={20}
                fill="#7f1d1d"
                stroke={GULL}
                strokeWidth={8}
            />
            <rect x={x - 140} y={y + 100} width={280} height={30} rx={6} fill={GULL} />
            <rect x={x - 190} y={y + 128} width={380} height={24} rx={4} fill="#a07d3a" />
        </motion.g>
    );
}

function Figur({
    pos,
    farge,
    navn,
    krone = false,
    saaret = false,
}: {
    pos: [number, number];
    farge: string;
    navn: string;
    krone?: boolean;
    saaret?: boolean;
}) {
    const [x, y] = pos;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            {/* Kappe */}
            <motion.path
                d={`M ${x - 70} ${y + 80} Q ${x - 60} ${y - 70} ${x} ${y - 80} Q ${x + 60} ${y - 70} ${x + 70} ${y + 80} Z`}
                initial={false}
                animate={{ fill: farge }}
                transition={{ duration: 0.8 }}
            />
            <circle cx={x} cy={y - 120} r={44} fill="#f1d3b3" />
            {krone && (
                <path
                    d={`M ${x - 40} ${y - 152} L ${x - 40} ${y - 196} L ${x - 20} ${y - 174} L ${x} ${y - 204} L ${x + 20} ${y - 174} L ${x + 40} ${y - 196} L ${x + 40} ${y - 152} Z`}
                    fill={GULL}
                    stroke="#7a5a00"
                    strokeWidth={4}
                />
            )}
            {saaret && (
                <motion.circle
                    cx={x}
                    cy={y - 40}
                    r={140}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={9}
                    strokeDasharray="22 14"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
            <rect x={x - 100} y={y + 96} width={200} height={56} rx={14} fill="#ffffff" />
            <text
                x={x}
                y={y + 136}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#0f172a"
            >
                {navn}
            </text>
        </motion.g>
    );
}

/** To leirer med faner og kryssede sverd mellom: krigen fra 1562. */
function Leirer() {
    const leir = (x: number, farge: string, etikett: string) => (
        <motion.g
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
        >
            <line x1={x} y1={330} x2={x} y2={620} stroke="#d6c7a1" strokeWidth={10} />
            <path d={`M ${x} 340 L ${x + 170} 370 L ${x} 410 Z`} fill={farge} />
            {[-90, -30, 30, 90].map((dx) => (
                <g key={dx}>
                    <circle cx={x + dx} cy={540} r={28} fill="#f1d3b3" />
                    <path
                        d={`M ${x + dx - 34} 640 Q ${x + dx} 560 ${x + dx + 34} 640 Z`}
                        fill={farge}
                    />
                </g>
            ))}
            <rect x={x - 150} y={662} width={300} height={60} rx={14} fill="#ffffff" />
            <text x={x} y={704} textAnchor="middle" fontSize={34} fontWeight={900} fill={farge}>
                {etikett}
            </text>
        </motion.g>
    );
    return (
        <g>
            {leir(400, KATOLSK, 'Katolikker')}
            {leir(1200, PROTESTANT, 'Hugenotter')}
            <motion.g
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: 'spring', stiffness: 160, damping: 12 }}
                style={{ transformOrigin: '800px 520px' }}
            >
                <line
                    x1={720}
                    y1={440}
                    x2={880}
                    y2={600}
                    stroke="#e5e7eb"
                    strokeWidth={14}
                    strokeLinecap="round"
                />
                <line
                    x1={880}
                    y1={440}
                    x2={720}
                    y2={600}
                    stroke="#e5e7eb"
                    strokeWidth={14}
                    strokeLinecap="round"
                />
                <line x1={690} y1={590} x2={750} y2={530} stroke={GULL} strokeWidth={12} />
                <line x1={910} y1={590} x2={850} y2={530} stroke={GULL} strokeWidth={12} />
            </motion.g>
        </g>
    );
}
