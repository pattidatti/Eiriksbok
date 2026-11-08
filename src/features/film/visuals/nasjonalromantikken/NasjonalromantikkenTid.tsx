import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tidslinjer. «natt»: storhetstiden i middelalderen, firehundreårsnatten under Danmark og
 * grunnloven i 1814, med linja som skal binde dem sammen. «verk»: årene 1830 til 1870 med
 * diktene, de første eventyrheftene, maleriet, konserten og Synnøve Solbakken.
 */

const B = 1600;
const H = 900;
type Modus = 'natt' | 'verk';

const OVERSKRIFTER: Record<Modus, string[]> = {
    natt: [
        'Firehundreårsnatten',
        'Grunnloven: et skjelett',
        'Tilbake til middelalderen',
        'En linje uten brudd',
        'Et eget folk',
    ],
    verk: [
        'Dikt om fedrelandet',
        'Eventyrene kommer',
        'Synnøve Solbakken',
        'Ikke bare glansbilde',
        'Edvard Grieg',
    ],
};

function Tekst({
    x,
    y,
    children,
    storrelse = 34,
    farge = '#0f172a',
    anker = 'middle',
    vekt = 800,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    children: string;
    storrelse?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            fontSize={storrelse}
            fontWeight={vekt}
            fill={farge}
            textAnchor={anker}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: forsinkelse }}
        >
            {children}
        </motion.text>
    );
}

/** Natt-tidslinja: år til x. Middelalderen ligger til venstre for 1380 uten årstall. */
const nx = (aar: number) => 470 + (aar - 1380) * 1.6;

const SLOTTER = ['Historie', 'Språk', 'Kultur'];
const STJERNER = Array.from({ length: 26 }, (_, i) => ({
    x: nx(1380) + 20 + ((i * 97) % 640),
    y: 540 + ((i * 53) % 110),
    r: 2 + (i % 3),
}));

function Natt({ beat }: { beat: number }) {
    const aksY = 700;
    const fylt = beat >= 4;
    return (
        <g>
            {/* Middelalderen */}
            <motion.rect
                x={140}
                y={520}
                width={nx(1380) - 140}
                height={150}
                rx={14}
                initial={false}
                animate={{ fill: beat >= 2 ? '#fcd34d' : '#e2e8f0' }}
                transition={{ duration: 0.8 }}
            />
            <Tekst
                x={(140 + nx(1380)) / 2}
                y={590}
                storrelse={34}
                farge={beat >= 2 ? '#78350f' : '#475569'}
            >
                Middelalderen
            </Tekst>
            <Tekst
                x={(140 + nx(1380)) / 2}
                y={640}
                storrelse={32}
                vekt={700}
                farge={beat >= 2 ? '#78350f' : '#64748b'}
            >
                storhetstiden
            </Tekst>
            {/* Natta under Danmark */}
            <motion.rect
                x={nx(1380)}
                y={520}
                width={nx(1814) - nx(1380)}
                height={150}
                fill="#1e293b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />
            {STJERNER.map((s, i) => (
                <motion.circle
                    key={i}
                    cx={s.x}
                    cy={s.y}
                    r={s.r}
                    fill="#fef9c3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 0.4 + i * 0.03 }}
                />
            ))}
            <Tekst
                x={(nx(1380) + nx(1814)) / 2}
                y={605}
                storrelse={40}
                farge="#f8fafc"
                forsinkelse={0.5}
            >
                Firehundreårsnatten
            </Tekst>
            {/* Tiden etter 1814 */}
            <rect x={nx(1814)} y={520} width={1480 - nx(1814)} height={150} fill="#bfdbfe" />
            {/* Aksen */}
            <line x1={140} y1={aksY} x2={1480} y2={aksY} stroke="#334155" strokeWidth={4} />
            {[1380, 1814].map((a) => (
                <g key={a}>
                    <line
                        x1={nx(a)}
                        y1={aksY - 12}
                        x2={nx(a)}
                        y2={aksY + 12}
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <text
                        x={nx(a)}
                        y={aksY + 52}
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                        textAnchor="middle"
                    >
                        {a}
                    </text>
                </g>
            ))}
            <text
                x={1370}
                y={aksY + 52}
                fontSize={30}
                fontWeight={700}
                fill="#1e3a8a"
                textAnchor="middle"
            >
                Norge etter 1814
            </text>
            {/* Grunnloven: et skjelett med tomme plasser */}
            {beat >= 1 && (
                <g>
                    {SLOTTER.map((s, i) => (
                        <motion.g
                            key={s}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.3 }}
                        >
                            <motion.rect
                                x={1250}
                                y={180 + i * 104}
                                width={260}
                                height={84}
                                rx={14}
                                strokeWidth={4}
                                strokeDasharray={fylt ? '0' : '12 8'}
                                initial={false}
                                animate={{
                                    fill: fylt ? '#1d4ed8' : '#ffffff',
                                    stroke: fylt ? '#1d4ed8' : '#64748b',
                                }}
                                transition={{ duration: 0.6, delay: fylt ? i * 0.3 : 0 }}
                            />
                            <text
                                x={1380}
                                y={234 + i * 104}
                                fontSize={34}
                                fontWeight={800}
                                textAnchor="middle"
                                fill={fylt ? '#ffffff' : '#64748b'}
                            >
                                {s}
                            </text>
                        </motion.g>
                    ))}
                    <line
                        x1={1380}
                        y1={472}
                        x2={1380}
                        y2={520}
                        stroke="#64748b"
                        strokeWidth={4}
                        strokeDasharray="8 6"
                    />
                </g>
            )}
            {/* Sagaer, skikker og sagn */}
            {beat >= 2 &&
                ['sagaer', 'skikker', 'sagn'].map((s, i) => (
                    <motion.g
                        key={s}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                    >
                        <rect
                            x={140 + i * 112}
                            y={430 - (i % 2) * 74}
                            width={150}
                            height={62}
                            rx={10}
                            fill="#fff7ed"
                            stroke="#b45309"
                            strokeWidth={3}
                        />
                        <text
                            x={215 + i * 112}
                            y={472 - (i % 2) * 74}
                            fontSize={32}
                            fontWeight={800}
                            fill="#78350f"
                            textAnchor="middle"
                        >
                            {s}
                        </text>
                    </motion.g>
                ))}
            {/* Linja uten brudd, over natta */}
            {beat >= 3 && (
                <motion.path
                    d={`M ${(140 + nx(1380)) / 2} 520 C 500 170, 1050 170, ${nx(1814) + 30} 515`}
                    fill="none"
                    stroke="#d97706"
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.8 }}
                />
            )}
            {beat === 3 && (
                <Tekst x={770} y={240} storrelse={34} farge="#92400e" forsinkelse={1}>
                    en linje uten brudd
                </Tekst>
            )}
            {fylt && (
                <g>
                    <Tekst x={800} y={400} storrelse={38} farge="#1e3a8a" forsinkelse={0.6}>
                        Et eget folk
                    </Tekst>
                    <Tekst
                        x={800}
                        y={448}
                        storrelse={30}
                        vekt={700}
                        farge="#475569"
                        forsinkelse={1.1}
                    >
                        ikke dansker, ikke svensker
                    </Tekst>
                </g>
            )}
        </g>
    );
}

/** Verk-tidslinja: 1830 til 1870. */
const vx = (aar: number) => 140 + (aar - 1830) * 28;

function Verk({ beat }: { beat: number }) {
    const aksY = 760;
    return (
        <g>
            <line
                x1={vx(1830)}
                y1={aksY}
                x2={vx(1870)}
                y2={aksY}
                stroke="#334155"
                strokeWidth={4}
            />
            {[1830, 1841, 1857, 1870].map((a) => (
                <g key={a}>
                    <line
                        x1={vx(a)}
                        y1={aksY - 12}
                        x2={vx(a)}
                        y2={aksY + 12}
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <text
                        x={vx(a)}
                        y={aksY + 50}
                        fontSize={30}
                        fontWeight={800}
                        textAnchor="middle"
                        fill={
                            a === 1830 || a === 1870
                                ? '#0f172a'
                                : beat >= (a === 1857 ? 2 : 1)
                                  ? '#0f172a'
                                  : 'transparent'
                        }
                    >
                        {a}
                    </text>
                </g>
            ))}
            {/* Diktene, tidlig i perioden */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat === 0 ? 1 : 0.55 }}>
                <rect
                    x={vx(1830)}
                    y={200}
                    width={440}
                    height={110}
                    rx={16}
                    fill="#ffffff"
                    stroke="#be123c"
                    strokeWidth={4}
                />
                <text x={vx(1830) + 24} y={246} fontSize={32} fontWeight={800} fill="#be123c">
                    Wergeland og Welhaven
                </text>
                <text x={vx(1830) + 24} y={290} fontSize={28} fontWeight={600} fill="#334155">
                    dikt om fedrelandet
                </text>
            </motion.g>
            {/* Eventyrheftene */}
            {beat >= 1 && (
                <g>
                    <motion.circle
                        cx={vx(1841)}
                        cy={425}
                        r={18}
                        fill="#047857"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    />
                    <Tekst
                        x={vx(1841) + 32}
                        y={437}
                        storrelse={34}
                        farge="#047857"
                        anker="start"
                        forsinkelse={0.4}
                    >
                        Første eventyrhefte, 1841
                    </Tekst>
                    {/* Det vi alt har sett: maleriet og konserten */}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 1.4 }}
                    >
                        <circle cx={vx(1847.5)} cy={560} r={14} fill="#a16207" />
                        <text
                            x={vx(1847.5) - 24}
                            y={570}
                            fontSize={32}
                            fontWeight={800}
                            fill="#713f12"
                            textAnchor="end"
                        >
                            Brudeferden
                        </text>
                        <circle cx={vx(1849)} cy={630} r={14} fill="#1e3a8a" />
                        <text
                            x={vx(1849) - 24}
                            y={640}
                            fontSize={32}
                            fontWeight={800}
                            fill="#1e3a8a"
                            textAnchor="end"
                        >
                            Konserten med Myllarguten
                        </text>
                        <line
                            x1={vx(1847.5)}
                            y1={574}
                            x2={vx(1847.5)}
                            y2={aksY}
                            stroke="#a16207"
                            strokeWidth={2}
                            strokeDasharray="6 6"
                        />
                        <line
                            x1={vx(1849)}
                            y1={644}
                            x2={vx(1849)}
                            y2={aksY}
                            stroke="#1e3a8a"
                            strokeWidth={2}
                            strokeDasharray="6 6"
                        />
                    </motion.g>
                </g>
            )}
            {/* Synnøve Solbakken */}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <line
                        x1={vx(1857)}
                        y1={310}
                        x2={vx(1857)}
                        y2={aksY}
                        stroke="#7c2d12"
                        strokeWidth={3}
                        strokeDasharray="8 6"
                    />
                    <rect
                        x={vx(1857) - 260}
                        y={200}
                        width={520}
                        height={110}
                        rx={16}
                        fill="#7c2d12"
                    />
                    <text
                        x={vx(1857)}
                        y={248}
                        fontSize={32}
                        fontWeight={800}
                        fill="#ffffff"
                        textAnchor="middle"
                    >
                        Synnøve Solbakken
                    </text>
                    <text
                        x={vx(1857)}
                        y={290}
                        fontSize={26}
                        fontWeight={600}
                        fill="#fed7aa"
                        textAnchor="middle"
                    >
                        Bjørnson: bygdefolk i litteraturen
                    </text>
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <rect
                        x={1080}
                        y={340}
                        width={420}
                        height={250}
                        rx={16}
                        fill="#ffffff"
                        stroke="#7c2d12"
                        strokeWidth={4}
                    />
                    <text x={1110} y={390} fontSize={30} fontWeight={800} fill="#7c2d12">
                        Også med:
                    </text>
                    {['drikking', 'hykleri', 'ulykkelige ekteskap'].map((t, i) => (
                        <motion.text
                            key={t}
                            x={1110}
                            y={442 + i * 48}
                            fontSize={30}
                            fontWeight={700}
                            fill="#334155"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.5 }}
                        >
                            {t}
                        </motion.text>
                    ))}
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <rect x={1080} y={340} width={440} height={200} rx={16} fill="#312e81" />
                    <text x={1120} y={410} fontSize={64} fill="#c7d2fe">
                        ♪
                    </text>
                    <text x={1180} y={400} fontSize={32} fontWeight={800} fill="#ffffff">
                        Felespill og
                    </text>
                    <text x={1180} y={442} fontSize={32} fontWeight={800} fill="#ffffff">
                        hallingdans
                    </text>
                    <text x={1120} y={500} fontSize={28} fontWeight={600} fill="#c7d2fe">
                        blir klassisk musikk
                    </text>
                </motion.g>
            )}
        </g>
    );
}

export function NasjonalromantikkenTid({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'natt';
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'natt' ? <Natt beat={beat} /> : <Verk beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] inset-x-0 flex justify-center pointer-events-none"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                        {overskrift}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
