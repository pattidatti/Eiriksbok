import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { SekOverskrift } from './felles';

/**
 * Lovene om å samles (SVG 1600x900).
 * «plakat»: Konventikkelplakaten fra 1741, stua uten prest, og Hauge dømt i 1814.
 * «aapning»: 1842, 1845, 1851 og 1853 på en tidslinje, og bruddet med 1537.
 */

type Modus = 'plakat' | 'aapning';

const BAKGRUNN = '#efe6d2';
const BLEKK = '#1c1917';
const DEMPET = '#78716c';
const ROD = '#b91c1c';

function Vis({ nar, children }: { nar: boolean; children: ReactNode }) {
    if (!nar) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            {children}
        </motion.g>
    );
}

function Kryss({ x, y, s = 24 }: { x: number; y: number; s?: number }) {
    return (
        <g stroke="#dc2626" strokeWidth={s / 2} strokeLinecap="round">
            <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
            <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} />
        </g>
    );
}

/** Stua i snitt: tak, vegger, bord med lys og naboer rundt. */
function StueTegning({ x, y, glod }: { x: number; y: number; glod: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -30 0 L 290 -150 L 610 0 Z" fill="#4d7c0f" stroke={BLEKK} strokeWidth={5} />
            <rect
                x={0}
                y={0}
                width={580}
                height={330}
                fill={glod ? '#3b2412' : '#57391f'}
                stroke={BLEKK}
                strokeWidth={5}
            />
            {glod && <circle cx={290} cy={190} r={180} fill="#f59e0b" opacity={0.18} />}
            <rect x={150} y={210} width={280} height={18} fill="#a16207" />
            <rect x={170} y={228} width={14} height={90} fill="#a16207" />
            <rect x={396} y={228} width={14} height={90} fill="#a16207" />
            <rect x={282} y={180} width={14} height={30} fill="#fef3c7" />
            <ellipse cx={289} cy={170} rx={8} ry={13} fill="#fde047" />
            <rect x={320} y={198} width={50} height={12} fill="#1e1b4b" />
            {[90, 200, 380, 490].map((px, i) => (
                <g key={px} transform={`translate(${px} ${i % 2 === 0 ? 190 : 150})`}>
                    <circle cx={0} cy={0} r={24} fill="#fcd9b6" />
                    <path
                        d="M -34 120 Q -34 30 0 30 Q 34 30 34 120 Z"
                        fill={['#78716c', '#92400e', '#57534e', '#713f12'][i]}
                    />
                </g>
            ))}
        </g>
    );
}

function Plakat({ beat }: { beat: number }) {
    const X = (ar: number) => 200 + (ar - 1730) * 12;
    const AKSE = 800;
    return (
        <>
            {/* Plakaten */}
            <Vis nar={beat >= 1}>
                <g transform="rotate(-2 440 410)">
                    <rect
                        x={120}
                        y={170}
                        width={640}
                        height={470}
                        fill="#fdf6e3"
                        stroke="#a16207"
                        strokeWidth={6}
                    />
                    <text
                        x={440}
                        y={240}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Konventikkelplakaten
                    </text>
                    <text
                        x={440}
                        y={290}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill={DEMPET}
                    >
                        1741
                    </text>
                    <line x1={170} y1={315} x2={710} y2={315} stroke="#d6b98c" strokeWidth={4} />
                    <text x={170} y={385} fontSize={36} fontWeight={900} fill={ROD}>
                        Forbudt:
                    </text>
                    <text x={170} y={430} fontSize={32} fontWeight={700} fill={BLEKK}>
                        religiøse møter uten prest
                    </text>
                    <text x={170} y={510} fontSize={36} fontWeight={900} fill={ROD}>
                        Forbudt:
                    </text>
                    <text x={170} y={555} fontSize={32} fontWeight={700} fill={BLEKK}>
                        predikanter som reiser rundt
                    </text>
                </g>
            </Vis>
            {beat === 0 && (
                <g>
                    <rect
                        x={120}
                        y={200}
                        width={640}
                        height={400}
                        rx={30}
                        fill="#fdf6e3"
                        stroke="#d6b98c"
                        strokeWidth={4}
                    />
                    <text
                        x={440}
                        y={360}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Staten passer på
                    </text>
                    <text
                        x={440}
                        y={420}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill={DEMPET}
                    >
                        ingen skal samle folk
                    </text>
                    <text
                        x={440}
                        y={465}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill={DEMPET}
                    >
                        om troen på egen hånd
                    </text>
                </g>
            )}

            {/* Stua */}
            <g transform="translate(948 300) scale(0.8)">
                <StueTegning x={0} y={0} glod={beat >= 2} />
            </g>
            {beat <= 1 && (
                <g>
                    <text
                        x={1160}
                        y={640}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill={BLEKK}
                    >
                        Prest?
                    </text>
                    <Kryss x={1260} y={628} s={18} />
                </g>
            )}
            <Vis nar={beat === 2}>
                <rect
                    x={900}
                    y={610}
                    width={560}
                    height={110}
                    rx={22}
                    fill="#ffffff"
                    stroke="#b45309"
                    strokeWidth={5}
                />
                <text
                    x={1180}
                    y={656}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill="#92400e"
                >
                    Et konventikkel:
                </text>
                <text
                    x={1180}
                    y={698}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={700}
                    fill={BLEKK}
                >
                    naboer som samles i stua, uten prest
                </text>
            </Vis>
            <Vis nar={beat >= 3}>
                <g transform="rotate(-4 1180 665)">
                    <rect
                        x={940}
                        y={612}
                        width={480}
                        height={100}
                        rx={14}
                        fill="#fef2f2"
                        stroke={ROD}
                        strokeWidth={7}
                    />
                    <text
                        x={1180}
                        y={677}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill={ROD}
                    >
                        1814: Hauge dømt
                    </text>
                </g>
            </Vis>

            {/* Tidslinja */}
            <line x1={150} y1={AKSE} x2={1480} y2={AKSE} stroke="#44403c" strokeWidth={6} />
            <path d={`M 1480 ${AKSE - 16} L 1510 ${AKSE} L 1480 ${AKSE + 16} Z`} fill="#44403c" />
            {[
                { ar: 1741, fra: 1 },
                { ar: 1804, fra: 3 },
                { ar: 1814, fra: 3 },
            ].map((m) =>
                beat >= m.fra ? (
                    <motion.g key={m.ar} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <line
                            x1={X(m.ar)}
                            y1={AKSE - 18}
                            x2={X(m.ar)}
                            y2={AKSE + 18}
                            stroke={BLEKK}
                            strokeWidth={6}
                        />
                        <text
                            x={X(m.ar)}
                            y={AKSE + 62}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            {m.ar}
                        </text>
                    </motion.g>
                ) : null
            )}
            {beat >= 3 && (
                <motion.rect
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    x={X(1804)}
                    y={AKSE - 12}
                    width={X(1814) - X(1804)}
                    height={24}
                    fill={ROD}
                />
            )}
        </>
    );
}

/** Kort over en markør på tidslinja. */
function Kort({
    x,
    y,
    b,
    linjer,
    farge,
    aksY,
}: {
    x: number;
    y: number;
    b: number;
    linjer: string[];
    farge: string;
    aksY: number;
}) {
    const h = 30 + linjer.length * 44;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <line
                x1={x}
                y1={y + h}
                x2={x}
                y2={aksY - 20}
                stroke={farge}
                strokeWidth={4}
                strokeDasharray="8 8"
            />
            <rect
                x={x - b / 2}
                y={y}
                width={b}
                height={h}
                rx={20}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            {linjer.map((l, i) => (
                <text
                    key={i}
                    x={x}
                    y={y + 52 + i * 44}
                    textAnchor="middle"
                    fontSize={i === 0 ? 34 : 30}
                    fontWeight={i === 0 ? 900 : 700}
                    fill={i === 0 ? farge : BLEKK}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function Aapning({ beat }: { beat: number }) {
    const AKSE = 720;
    const X = (ar: number) => (ar < 1800 ? 190 : 470 + (ar - 1840) * 62);
    const merker = [
        { ar: 1842, fra: 0 },
        { ar: 1845, fra: 1 },
        { ar: 1851, fra: 2 },
        { ar: 1853, fra: 3 },
    ];
    return (
        <>
            {/* Aksen med brudd mellom 1537 og 1840 */}
            <line x1={130} y1={AKSE} x2={290} y2={AKSE} stroke="#44403c" strokeWidth={6} />
            <path
                d={`M 290 ${AKSE + 22} L 310 ${AKSE - 22} M 330 ${AKSE + 22} L 350 ${AKSE - 22}`}
                stroke="#44403c"
                strokeWidth={5}
            />
            <line x1={370} y1={AKSE} x2={1500} y2={AKSE} stroke="#44403c" strokeWidth={6} />
            <path d={`M 1500 ${AKSE - 16} L 1530 ${AKSE} L 1500 ${AKSE + 16} Z`} fill="#44403c" />
            <line
                x1={X(1537)}
                y1={AKSE - 18}
                x2={X(1537)}
                y2={AKSE + 18}
                stroke={BLEKK}
                strokeWidth={6}
            />
            <text
                x={X(1537)}
                y={AKSE + 62}
                textAnchor="middle"
                fontSize={38}
                fontWeight={900}
                fill={BLEKK}
            >
                1537
            </text>
            {merker.map((m) =>
                beat >= m.fra ? (
                    <motion.g key={m.ar} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <line
                            x1={X(m.ar)}
                            y1={AKSE - 18}
                            x2={X(m.ar)}
                            y2={AKSE + 18}
                            stroke={BLEKK}
                            strokeWidth={6}
                        />
                        <text
                            x={X(m.ar)}
                            y={AKSE + 62}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill={BLEKK}
                        >
                            {m.ar}
                        </text>
                    </motion.g>
                ) : null
            )}

            {/* Plakaten blir revet: kryss ved siden av */}
            <g>
                <rect
                    x={110}
                    y={190}
                    width={300}
                    height={170}
                    fill="#fdf6e3"
                    stroke="#a16207"
                    strokeWidth={5}
                />
                <text
                    x={260}
                    y={258}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    Konventikkel-
                </text>
                <text
                    x={260}
                    y={300}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    plakaten
                </text>
                <text
                    x={260}
                    y={340}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fill={DEMPET}
                >
                    1741
                </text>
                <Kryss x={430} y={200} s={22} />
            </g>
            <Kort
                x={X(1842)}
                y={430}
                b={300}
                linjer={['1842', 'Plakaten', 'opphevet']}
                farge="#0f766e"
                aksY={AKSE}
            />
            <Vis nar={beat >= 1}>
                <Kort
                    x={X(1845)}
                    y={170}
                    b={400}
                    linjer={['Dissenterloven', 'andre kristne kan lage', 'egne menigheter']}
                    farge="#0f766e"
                    aksY={AKSE}
                />
            </Vis>
            <Vis nar={beat >= 3}>
                <Kort
                    x={X(1853)}
                    y={170}
                    b={390}
                    linjer={['Høyesterett', 'mormonerne regnes', 'ikke som kristne']}
                    farge={ROD}
                    aksY={AKSE}
                />
            </Vis>
            <Vis nar={beat >= 2}>
                <Kort
                    x={X(1851)}
                    y={430}
                    b={370}
                    linjer={['Grunnloven endres', 'jøder får komme', 'inn i landet']}
                    farge="#1d4ed8"
                    aksY={AKSE}
                />
            </Vis>
            <Vis nar={beat >= 4}>
                <rect
                    x={X(1537)}
                    y={AKSE - 12}
                    width={X(1842) - X(1537)}
                    height={24}
                    fill="#a8a29e"
                />
                <rect x={X(1842)} y={AKSE - 12} width={1500 - X(1842)} height={24} fill="#0d9488" />
                <text x={X(1537) + 10} y={AKSE + 130} fontSize={32} fontWeight={800} fill={DEMPET}>
                    Bare statskirken var lov
                </text>
                <text x={X(1842) + 20} y={AKSE + 130} fontSize={32} fontWeight={800} fill="#0f766e">
                    I praksis: noe annet uten straff
                </text>
            </Vis>
        </>
    );
}

const OVERSKRIFT: Record<Modus, string[]> = {
    plakat: [
        'Ingen møter på egen hånd',
        'Loven fra 1741',
        'Hva er et konventikkel?',
        'Det Hauge gjorde',
    ],
    aapning: [
        'Forbudet faller',
        'Andre kristne får samles',
        'Men ikke full frihet',
        'Men ikke full frihet',
        'Et brudd',
    ],
};

export function SekulariseringTidslinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'plakat';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAKGRUNN }}>
            <svg
                viewBox="0 0 1600 900"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'plakat' ? <Plakat beat={beat} /> : <Aapning beat={beat} />}
            </svg>
            <SekOverskrift tekst={tekst} />
        </div>
    );
}
