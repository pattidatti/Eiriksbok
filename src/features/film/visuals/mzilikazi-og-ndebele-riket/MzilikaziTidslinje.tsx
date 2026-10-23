import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Tidslinjer i SVG: en akse nederst som fylles ut per beat, og et stort kort i midten.
 * «krig»: voortrekkerne kommer i 1836, Vegkop, Mosega og slaget som varer i ni dager.
 *         Til venstre Ndebele med skjold, til høyre boerne med vogn og gevær. Ingen kamp vises.
 * «slutt»: fra Mzilikazis død i 1868 til riket er borte, og folket i Zimbabwe i 2006.
 */

type Modus = 'krig' | 'slutt';

const NDEBELE = '#9a3412';
const BOER = '#475569';
const GULL = '#ca8a04';
const ROD = '#b91c1c';

const AKSE_Y = 760;
const X0 = 150;
const X1 = 1450;

interface Merke {
    x: number;
    etikett: string;
    fraBeat: number;
    farge: string;
    ned?: boolean;
}

interface Band {
    fra: number;
    til: number;
    fraBeat: number;
    tilBeat?: number;
    farge: string;
    tekst: string;
    rad: number;
}

/** Skjold av kuhud, sett forfra. */
function Skjold({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse cx={0} cy={0} rx={46} ry={86} fill="#f5efe0" stroke="#3f2a1d" strokeWidth={6} />
            <ellipse cx={-14} cy={-30} rx={16} ry={20} fill="#3f2a1d" />
            <ellipse cx={16} cy={34} rx={18} ry={24} fill="#3f2a1d" />
            <rect x={-5} y={-104} width={10} height={208} rx={4} fill="#7c4a24" />
        </g>
    );
}

/** Oksevogn med seil, sett fra siden. */
function Vogn({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -80 -20 Q 0 -110 80 -20 Z" fill="#f8fafc" stroke="#334155" strokeWidth={5} />
            <rect x={-90} y={-22} width={180} height={34} rx={4} fill="#92400e" />
            <circle cx={-56} cy={26} r={26} fill="none" stroke="#334155" strokeWidth={7} />
            <circle cx={56} cy={26} r={26} fill="none" stroke="#334155" strokeWidth={7} />
        </g>
    );
}

/** Gevær, liggende. */
function Gevaer({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s}) rotate(-12)`}>
            <rect x={-110} y={-6} width={170} height={12} rx={3} fill="#334155" />
            <path d="M 50 -10 L 110 -6 L 118 26 L 92 26 L 80 8 L 50 8 Z" fill="#92400e" />
        </g>
    );
}

function Brikke({ x, y, tekst, farge, fraBeat, beat }: { x: number; y: number; tekst: string; farge: string; fraBeat: number; beat: number }) {
    if (beat < fraBeat) return null;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <rect x={x - 90} y={y - 30} width={180} height={52} rx={26} fill={farge} />
            <text x={x} y={y + 6} textAnchor="middle" fontSize={30} fontWeight={800} fill="#fff">
                {tekst}
            </text>
        </motion.g>
    );
}

const AKSER: Record<Modus, { fra: number; til: number; ticks: { verdi: number; tekst: string }[] }> = {
    krig: {
        fra: 1836,
        til: 1838,
        ticks: [
            { verdi: 1836, tekst: '1836' },
            { verdi: 1837, tekst: '1837' },
            { verdi: 1838, tekst: '1838' },
        ],
    },
    slutt: {
        fra: 1860,
        til: 1900,
        ticks: [1860, 1870, 1880, 1890, 1900].map((v) => ({ verdi: v, tekst: String(v) })),
    },
};

/** Siste del av aksen i «slutt» er et brudd: 2006 står helt til høyre. */
const X_2006 = 1500;
const X_SLUTT = 1340;

function xFor(modus: Modus, ar: number) {
    const a = AKSER[modus];
    const bredde = modus === 'slutt' ? X_SLUTT - X0 : X1 - X0;
    if (modus === 'slutt' && ar > 1950) return X_2006;
    return X0 + ((ar - a.fra) / (a.til - a.fra)) * bredde;
}

/** Måned som desimalår: 10 = oktober. */
const md = (ar: number, maaned: number, dag = 1) => ar + (maaned - 1 + (dag - 1) / 30) / 12;

const MERKER: Record<Modus, Merke[]> = {
    krig: [
        { x: xFor('krig', md(1836, 6)), etikett: 'voortrekkerne kommer', fraBeat: 0, farge: BOER },
        { x: xFor('krig', md(1836, 10, 16)), etikett: '16. okt.: Vegkop', fraBeat: 2, farge: NDEBELE, ned: true },
        { x: xFor('krig', md(1837, 1, 17)), etikett: '17. jan.: Mosega', fraBeat: 3, farge: BOER },
        { x: xFor('krig', md(1837, 11, 10)), etikett: 'nov.: ni dager', fraBeat: 4, farge: ROD, ned: true },
    ],
    slutt: [
        { x: xFor('slutt', 1867), etikett: '1867: gull', fraBeat: 1, farge: GULL },
        { x: xFor('slutt', 1868.7), etikett: '1868', fraBeat: 1, farge: NDEBELE, ned: true },
        { x: xFor('slutt', 1890), etikett: '1890: Rhodes', fraBeat: 2, farge: BOER },
        { x: xFor('slutt', 1893), etikett: '1893', fraBeat: 3, farge: ROD, ned: true },
        { x: xFor('slutt', 2006), etikett: '2006', fraBeat: 5, farge: NDEBELE, ned: true },
    ],
};

const BAND: Record<Modus, Band[]> = {
    krig: [],
    slutt: [
        { fra: 1860, til: 1868.7, fraBeat: 0, farge: NDEBELE, tekst: '◀ Mzilikazi', rad: 0 },
        { fra: 1868.7, til: 1893, fraBeat: 1, farge: '#c2410c', tekst: 'Lobengula', rad: 0 },
        { fra: 1896, til: 1897.9, fraBeat: 4, farge: ROD, tekst: 'opprør', rad: 1 },
        { fra: 1893, til: 1900, fraBeat: 4, farge: BOER, tekst: 'hvite styrer', rad: 0 },
    ],
};

const KORT: Record<Modus, [string, string][]> = {
    krig: [
        ['Voortrekkerne', 'boere som snakker nederlandsk'],
        ['Nye allierte', 'griqua og rolong går med boerne'],
        ['16. oktober 1836', 'Ndebele angriper ved Vegkop'],
        ['17. januar 1837', 'boerne ødelegger Mosega'],
        ['November 1837', 'slaget varer i ni dager'],
        ['Skjold mot gevær', 'geværene avgjør krigen'],
    ],
    slutt: [
        ['Rådgiverne drept', 'Lobengula overlevde i skjul'],
        ['9. september 1868', 'Mzilikazi dør, Lobengula blir konge'],
        ['Kappløpet om Afrika', 'Rhodes, med støtte fra Storbritannia'],
        ['1893', 'Lobengula blir avsatt'],
        ['Opprør 1896 og 1897', 'Ndebele får fred, shona blir slått'],
        ['Nesten to millioner', 'ndebele i Zimbabwe i 2006'],
    ],
};

const OVERSKRIFTER: Record<Modus, string[]> = {
    krig: ['1836: en ny fiende', 'Fra Kappkolonien', 'Vegkop', 'Mosega', 'Det avgjørende slaget', 'Hvorfor Ndebele tapte'],
    slutt: ['Mzilikazi styrte hardt', 'Gull', '1890', 'Lobengula avsatt', 'Opprør', 'Riket er borte, folket blir'],
};

export function MzilikaziTidslinje({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'krig';
    const akse = AKSER[modus];
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)];
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    const varighet = playing ? 1.2 : 0;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f4ede0' }}>
            <svg viewBox="0 0 1600 900" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Sidene i krigen */}
                {modus === 'krig' && (
                    <>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Skjold x={300} y={360} s={beat === 5 ? 1.25 : 1} />
                            <text x={300} y={530} textAnchor="middle" fontSize={40} fontWeight={900} fill={NDEBELE}>
                                Ndebele
                            </text>
                            {beat === 5 && (
                                <text x={300} y={580} textAnchor="middle" fontSize={32} fontWeight={700} fill="#0f172a">
                                    mange krigere
                                </text>
                            )}
                        </motion.g>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Vogn x={1300} y={340} />
                            {beat === 5 && <Gevaer x={1330} y={440} s={1} />}
                            <text x={1300} y={530} textAnchor="middle" fontSize={40} fontWeight={900} fill={BOER}>
                                boerne
                            </text>
                            {beat === 5 && (
                                <text x={1300} y={580} textAnchor="middle" fontSize={32} fontWeight={700} fill="#0f172a">
                                    gevær
                                </text>
                            )}
                        </motion.g>
                        {beat >= 1 && beat <= 4 && (
                            <>
                                <Brikke x={1200} y={600} tekst="griqua" farge={BOER} fraBeat={1} beat={beat} />
                                <Brikke x={1400} y={600} tekst="rolong" farge={BOER} fraBeat={1} beat={beat} />
                            </>
                        )}
                    </>
                )}

                {/* Kortet i midten */}
                <AnimatePresence mode="wait">
                    <motion.g
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: playing ? 0.4 : 0 }}
                    >
                        <rect x={430} y={230} width={740} height={230} rx={28} fill="#ffffff" stroke="#0f172a" strokeWidth={3} />
                        <text x={800} y={325} textAnchor="middle" fontSize={kort[0].length > 16 ? 54 : 62} fontWeight={900} fill="#0f172a">
                            {kort[0]}
                        </text>
                        <text x={800} y={405} textAnchor="middle" fontSize={kort[1].length > 30 ? 32 : 38} fontWeight={700} fill="#475569">
                            {kort[1]}
                        </text>
                    </motion.g>
                </AnimatePresence>

                {/* Ni dager som ni ruter */}
                {modus === 'krig' && beat === 4 && (
                    <g>
                        {Array.from({ length: 9 }, (_, i) => (
                            <motion.rect
                                key={i}
                                x={800 - 9 * 30 + i * 60 + 6}
                                y={490}
                                width={48}
                                height={48}
                                rx={8}
                                fill={ROD}
                                initial={{ opacity: 0, scale: 0.4 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: playing ? 0.6 + i * 0.25 : 0 }}
                                style={{ transformOrigin: `${800 - 9 * 30 + i * 60 + 30}px 514px` }}
                            />
                        ))}
                        <text x={800} y={590} textAnchor="middle" fontSize={30} fontWeight={800} fill={ROD}>
                            9 dager
                        </text>
                    </g>
                )}

                {/* Band over aksen */}
                {BAND[modus]
                    .filter((b) => beat >= b.fraBeat)
                    .map((b) => {
                        const x0 = xFor(modus, b.fra);
                        const x1 = xFor(modus, b.til);
                        const rad = AKSE_Y - 70 - b.rad * 50;
                        return (
                            <g key={`${b.fra}-${b.tekst}`}>
                                <motion.rect
                                    x={x0}
                                    y={rad}
                                    height={40}
                                    rx={8}
                                    fill={b.farge}
                                    fillOpacity={0.88}
                                    initial={{ width: 0 }}
                                    animate={{ width: x1 - x0 }}
                                    transition={{ duration: varighet }}
                                />
                                {b.tekst && (
                                    <motion.text
                                        x={b.rad === 1 ? x1 + 12 : (x0 + x1) / 2}
                                        y={rad + 29}
                                        textAnchor={b.rad === 1 ? 'start' : 'middle'}
                                        fontSize={26}
                                        fontWeight={800}
                                        fill={b.rad === 1 ? ROD : '#fff'}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: varighet }}
                                    >
                                        {b.tekst}
                                    </motion.text>
                                )}
                            </g>
                        );
                    })}

                {/* «Under 30 år»-klammen */}
                {modus === 'slutt' && beat >= 5 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <path
                            d={`M ${xFor('slutt', 1868.7)} 600 L ${xFor('slutt', 1868.7)} 580 L ${xFor('slutt', 1897.9)} 580 L ${xFor('slutt', 1897.9)} 600`}
                            fill="none"
                            stroke={ROD}
                            strokeWidth={5}
                        />
                        <text x={(xFor('slutt', 1868.7) + xFor('slutt', 1897.9)) / 2} y={564} textAnchor="middle" fontSize={32} fontWeight={900} fill={ROD}>
                            under 30 år
                        </text>
                    </motion.g>
                )}

                {/* Aksen */}
                <line x1={X0} y1={AKSE_Y} x2={modus === 'slutt' ? X_SLUTT : X1} y2={AKSE_Y} stroke="#0f172a" strokeWidth={5} />
                {modus === 'slutt' && (
                    <>
                        <path d={`M ${X_SLUTT + 30} ${AKSE_Y + 16} l 16 -32 M ${X_SLUTT + 50} ${AKSE_Y + 16} l 16 -32`} stroke="#0f172a" strokeWidth={4} />
                        <line x1={X_SLUTT + 80} y1={AKSE_Y} x2={X_2006 + 30} y2={AKSE_Y} stroke="#0f172a" strokeWidth={5} />
                    </>
                )}
                {akse.ticks.map((t) => {
                    const x = xFor(modus, t.verdi);
                    return (
                        <g key={t.verdi}>
                            <line x1={x} y1={AKSE_Y - 10} x2={x} y2={AKSE_Y + 10} stroke="#0f172a" strokeWidth={4} />
                            <text x={x} y={AKSE_Y + 100} textAnchor="middle" fontSize={26} fontWeight={700} fill="#64748b">
                                {t.tekst}
                            </text>
                        </g>
                    );
                })}

                {MERKER[modus]
                    .filter((m) => beat >= m.fraBeat)
                    .map((m) => {
                        const ny = beat === m.fraBeat;
                        const ty = m.ned ? AKSE_Y + 58 : AKSE_Y - 92;
                        const anker = m.x < 300 ? 'start' : m.x > 1360 ? 'end' : 'middle';
                        return (
                            <motion.g key={m.etikett} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: playing ? 0.3 : 0 }}>
                                <circle cx={m.x} cy={AKSE_Y} r={ny ? 16 : 12} fill={m.farge} stroke="#fff" strokeWidth={4} />
                                <text
                                    x={m.x}
                                    y={ty}
                                    textAnchor={anker}
                                    fontSize={ny ? 32 : 28}
                                    fontWeight={800}
                                    fill={m.farge}
                                    stroke="#f4ede0"
                                    strokeWidth={6}
                                    paintOrder="stroke"
                                >
                                    {m.etikett}
                                </text>
                            </motion.g>
                        );
                    })}
            </svg>
            <Overskrift tekst={overskrift} />
        </div>
    );
}
