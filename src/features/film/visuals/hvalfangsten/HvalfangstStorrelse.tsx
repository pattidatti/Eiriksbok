import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Blåhvalen og vågehvalen i samme målestokk. «bla»: fredningen og hvor stor blåhvalen
 * er. «begge»: moratoriet, Norges nei og vågehvalen ved siden av blåhvalen.
 */

const B = 1600;
const H = 900;
const PX_PER_M = 40;
const X0 = 200;

type Modus = 'bla' | 'begge';

/** Hval sett fra siden, hodet mot venstre. Tegnet 1000 bred, skaleres til lengden. */
function Hval({ lengde, farge, y }: { lengde: number; farge: string; y: number }) {
    const s = (lengde * PX_PER_M) / 1000;
    return (
        <g transform={`translate(${X0} ${y}) scale(${s})`}>
            <path
                d="M 0 60 C 30 20 160 0 380 8 C 600 18 760 44 860 58 L 930 22 C 950 12 975 10 990 14 C 975 40 955 58 935 66 C 955 76 978 96 990 118 C 974 120 950 112 930 100 L 860 76 C 700 100 460 116 300 108 C 140 100 30 92 0 60 Z"
                fill={farge}
            />
            <path d="M 640 30 L 700 0 L 690 36 Z" fill={farge} />
        </g>
    );
}

function Linjal({ meter, y }: { meter: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <line
                x1={X0}
                y1={y}
                x2={X0 + meter * PX_PER_M}
                y2={y}
                stroke="#0f172a"
                strokeWidth={5}
            />
            {Array.from({ length: Math.floor(meter / 5) + 1 }, (_, i) => (
                <g key={i}>
                    <line
                        x1={X0 + i * 5 * PX_PER_M}
                        y1={y - 12}
                        x2={X0 + i * 5 * PX_PER_M}
                        y2={y + 12}
                        stroke="#0f172a"
                        strokeWidth={4}
                    />
                    <text
                        x={X0 + i * 5 * PX_PER_M}
                        y={y + 44}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={700}
                        fill="#475569"
                    >
                        {i * 5} m
                    </text>
                </g>
            ))}
        </motion.g>
    );
}

function Stempel({ tekst, farge = '#dc2626' }: { tekst: string; farge?: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, scale: 1.8, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -8 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            className="absolute top-[38%] left-1/2 -translate-x-1/2 px-8 py-3 rounded-2xl border-[6px] bg-white/80 font-black text-5xl md:text-7xl tracking-widest whitespace-nowrap"
            style={{ borderColor: farge, color: farge }}
        >
            {tekst}
        </motion.div>
    );
}

function Merkelapp({ tekst }: { tekst: string }) {
    return (
        <motion.div
            key={tekst}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
        >
            {tekst}
        </motion.div>
    );
}

export function HvalfangstStorrelse({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'bla';
    const bla = modus === 'bla';

    // Plassering per beat: blåhvalen midt i bildet, vågehvalen under når begge vises.
    const sammenlign = !bla && beat >= 3;
    const blaY = sammenlign ? 230 : 330;
    const blaFarge = !bla && beat < 3 ? '#cbd5e1' : '#1e3a8a';
    const visBla = !(bla && beat === 3);

    const tekst = bla
        ? [
              'Fredet = forbudt å drepe',
              'Blåhvalen fredes',
              'Blåhvalen',
              'Fortsatt få blåhval i sør',
          ][beat]
        : [
              'IWC, 1982: full stans',
              'Norge sa nei',
              '1993: Norge fanger vågehval igjen',
              'Blåhval og vågehval',
              'Vågehvalen i dag',
          ][beat];

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-sky-200 to-sky-400 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <motion.g
                    animate={{ opacity: visBla ? 1 : 0, y: blaY - 330 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                >
                    <Hval lengde={30} farge={blaFarge} y={330} />
                </motion.g>
                {bla && beat === 2 && <Linjal meter={30} y={520} />}
                {bla && beat === 2 && (
                    <motion.text
                        x={B / 2}
                        y={640}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        rundt 30 meter · opptil 190 tonn
                    </motion.text>
                )}
                {bla && beat === 3 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.5 }}
                    >
                        <g transform="translate(560 0)">
                            <Hval lengde={12} farge="#1e3a8a" y={420} />
                        </g>
                    </motion.g>
                )}

                {!bla && beat >= 2 && (
                    <motion.g
                        initial={{ opacity: 0, x: 200 }}
                        animate={{ opacity: 1, x: 0, y: sammenlign ? 0 : -120 }}
                        transition={{ duration: 1.2 }}
                    >
                        <Hval lengde={9} farge="#0f766e" y={560} />
                    </motion.g>
                )}
                {sammenlign && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        <text
                            x={X0 + 30 * PX_PER_M}
                            y={205}
                            textAnchor="end"
                            fontSize={34}
                            fontWeight={900}
                            fill="#1e3a8a"
                        >
                            blåhval: ca. 30 m, 190 tonn
                        </text>
                        <text
                            x={X0 + 9 * PX_PER_M + 30}
                            y={610}
                            fontSize={34}
                            fontWeight={900}
                            fill="#0f766e"
                        >
                            vågehval: 8-9 m, 9 tonn
                        </text>
                    </motion.g>
                )}
                {sammenlign && <Linjal meter={30} y={760} />}
            </svg>

            <AnimatePresence mode="wait">{tekst && <Merkelapp tekst={tekst} />}</AnimatePresence>
            <AnimatePresence>
                {bla && beat === 0 && <Stempel tekst="FREDET" />}
                {!bla && beat === 0 && <Stempel tekst="MORATORIUM" />}
                {!bla && beat === 1 && <Stempel tekst="NORGE: NEI" farge="#b45309" />}
            </AnimatePresence>
            {bla && beat === 1 && (
                <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2 flex gap-6">
                    {[
                        ['Nord-Atlanteren', '1955'],
                        ['Sørishavet', '1966'],
                    ].map(([sted, aar], i) => (
                        <motion.div
                            key={sted}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 2.2 }}
                            className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-center"
                        >
                            <div className="text-4xl md:text-5xl font-black text-slate-900">
                                {aar}
                            </div>
                            <div className="text-xl md:text-2xl font-semibold text-slate-500">
                                {sted}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
            {!bla && beat === 4 && (
                <div className="absolute top-[44%] right-[5%] flex gap-4">
                    <Teller verdi={100000} etikett="vågehval der Norge fanger" prefiks="over " />
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.6 }}
                        className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-center min-w-[9rem]"
                    >
                        <div className="text-4xl md:text-5xl font-black tabular-nums text-teal-700">
                            500-600
                        </div>
                        <div className="text-sm md:text-base font-semibold text-slate-500 mt-0.5">
                            fanget i året
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
