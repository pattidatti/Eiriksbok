import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { frø } from './felles3d';

/**
 * Kart over Sápmi og København. «misjon»: kongen og kirken sender misjonærer nordover, og
 * Thomas von Westen reiser langs kysten. «trommer»: runebommene brennes eller sendes til
 * København. «idag»: læstadianismen sprer seg, og nye trommer lages. «tilbake»: trommen
 * som ble tatt i 1691, og som i 2022 ble samisk eiendom igjen.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'misjon' | 'trommer' | 'idag' | 'tilbake';

const KOBENHAVN: LngLat = [12.57, 55.68];
const TRONDHEIM: LngLat = [10.4, 63.43];
const LAESTADIUS: LngLat = [22.48, 68.44];
const MIDT: LngLat = [20.5, 67.6];

/** Sápmi, grovt tegnet: fra fjellene i sør til Kolahalvøya i øst. */
const SAPMI: LngLat[] = [
    [11.8, 62.3],
    [11.2, 64.4],
    [12.8, 66.1],
    [14.6, 67.9],
    [16.4, 69.2],
    [19.2, 70.1],
    [23.2, 70.8],
    [27.8, 70.9],
    [31, 70.2],
    [35.5, 69.2],
    [40.5, 67.6],
    [38.2, 66.1],
    [34.5, 66.6],
    [30.5, 67.2],
    [28.5, 66.3],
    [26, 65.6],
    [23, 65.9],
    [20, 64.8],
    [17, 63.6],
    [14.5, 62.2],
];

/** Westens reiser, grovt: langs kysten fra Trondheim og helt øst i Finnmark. */
const WESTEN: LngLat[] = [
    TRONDHEIM,
    [11.2, 64.5],
    [12.5, 66],
    [14.3, 67.3],
    [16.2, 68.6],
    [18.9, 69.7],
    [22.5, 70.4],
    [25.8, 71.0],
    [28.5, 70.6],
    [31.1, 70.37],
];

/** Fra København og nordover: kongen og kirken. */
const NORDOVER: LngLat[] = [KOBENHAVN, [11.5, 58], [9.5, 61.5], TRONDHEIM];

/** Punkter spredt inne i Sápmi (trommer, kors, nye trommer). */
function inni(pt: LngLat) {
    let inne = false;
    for (let i = 0, j = SAPMI.length - 1; i < SAPMI.length; j = i++) {
        const [xi, yi] = SAPMI[i];
        const [xj, yj] = SAPMI[j];
        if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)
            inne = !inne;
    }
    return inne;
}
const PUNKTER: LngLat[] = (() => {
    const ut: LngLat[] = [];
    for (let i = 0; ut.length < 26 && i < 2000; i++) {
        const p: LngLat = [12 + frø(i) * 28, 62.5 + frø(i + 500) * 8.3];
        if (inni(p) && ut.every((q) => Math.hypot(q[0] - p[0], (q[1] - p[1]) * 2.2) > 2.4))
            ut.push(p);
    }
    return ut;
})();

/** Grovt: den dansk-norske delen av Sápmi (vest for svenskegrensa og Finnmark). */
function norsk([lng, lat]: LngLat) {
    return lng < 13.5 + (lat - 63) * 1.3 || (lat > 69.2 && lng < 31);
}

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#ece6d6"
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

function Tromme({
    x,
    y,
    s = 1,
    farge = '#e9cf9f',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <ellipse rx={16} ry={12} fill={farge} stroke="#7c4a1e" strokeWidth={3} />
            <path d="M -10 0 L 10 0 M 0 -8 L 0 8" stroke="#9a3412" strokeWidth={2} />
        </g>
    );
}

function Flamme({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path
                d="M 0 -34 C 14 -18 18 -6 12 6 C 6 14 -6 14 -12 6 C -18 -6 -8 -16 0 -34 Z"
                fill="#f97316"
            />
            <path
                d="M 0 -18 C 7 -10 8 -2 4 4 C 1 7 -3 7 -5 4 C -8 -2 -4 -8 0 -18 Z"
                fill="#fde047"
            />
        </g>
    );
}

function Kors({ x, y, farge = '#1e3a8a' }: { x: number; y: number; farge?: string }) {
    return (
        <path
            transform={`translate(${x} ${y})`}
            d="M -4 -18 h 8 v 8 h 8 v 8 h -8 v 16 h -8 v -16 h -8 v -8 h 8 Z"
            fill={farge}
        />
    );
}

function Merke({
    x,
    y,
    tekst,
    dy = -26,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    dy?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y + dy}
            textAnchor={anker}
            fontSize={34}
            fontWeight={900}
            fill="#0f172a"
            stroke="#fff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

const OVERSKRIFTER: Record<Modus, string[]> = {
    misjon: [
        'Kongen og kirken sender misjonærer',
        'Thomas von Westen, 1716-1723',
        'Målet: alle skal bli kristne',
        'Den gamle troen skal bort',
    ],
    trommer: [
        'Runebommer i hele Sápmi',
        'Brent, eller sendt til København',
        'Rundt hundre igjen',
        'Noaider dømt. Joik kalt synd.',
    ],
    idag: [
        'De fleste samer er kristne',
        'Lars Levi Læstadius, 1800-tallet',
        'Vekkelsen sprer seg i nord',
        'Ny interesse for den gamle troen',
        'Nye runebommer',
    ],
    tilbake: ['1691: trommen blir tatt', 'Eid av Danmark', '2022: eid av et samisk museum'],
};

export function SamiskKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'misjon';
    const { geographies } = useFilmVerden([
        [4, 53],
        [42, 72],
    ]);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 120],
                    [B - 40, H - 20],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [6, 54.6],
                        [41, 71.3],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const linje = (pts: LngLat[]) => `M ${pts.map((ll) => p(ll).join(' ')).join(' L ')}`;
    const sapmi = `${linje(SAPMI)} Z`;
    const kbh = p(KOBENHAVN);
    const dur = (s: number) => (playing ? s : 0);

    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    // Trommene: hvilke som brennes og hvilke som sendes til København.
    const brent = (i: number) => i % 3 !== 0;
    const igjen = (i: number) => i % 7 === 0;

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />
                <path
                    d={sapmi}
                    fill={modus === 'misjon' && beat >= 3 ? '#cbd5e1' : '#f59e0b'}
                    fillOpacity={0.28}
                    stroke="#b45309"
                    strokeWidth={4}
                    strokeDasharray="14 8"
                />
                <Merke x={p([30, 67.8])[0]} y={p([30, 67.8])[1]} tekst="Sápmi" dy={14} />

                {/* København */}
                <circle
                    cx={kbh[0]}
                    cy={kbh[1]}
                    r={11}
                    fill="#0f172a"
                    stroke="#fff"
                    strokeWidth={4}
                />
                <Merke x={kbh[0] + 22} y={kbh[1]} tekst="København" dy={12} anker="start" />

                {modus === 'misjon' && (
                    <>
                        <motion.path
                            d={linje(NORDOVER)}
                            fill="none"
                            stroke="#1e3a8a"
                            strokeWidth={7}
                            strokeLinecap="round"
                            strokeDasharray="2 14"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: dur(2.4), delay: dur(0.6) }}
                        />
                        {beat >= 1 &&
                            [0, 1, 2].map((n) => (
                                <motion.path
                                    key={n}
                                    d={linje(
                                        WESTEN.slice(0, WESTEN.length - (2 - n) * 2).map(
                                            ([x, y]) => [x - n * 0.9, y - n * 0.18] as LngLat
                                        )
                                    )}
                                    fill="none"
                                    stroke="#1e3a8a"
                                    strokeWidth={8}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: beat === 1 ? 0 : 1 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: dur(2.2), delay: dur(0.4 + n * 1.6) }}
                                />
                            ))}
                        {beat >= 1 && (
                            <Merke
                                x={p(TRONDHEIM)[0] - 60}
                                y={p(TRONDHEIM)[1]}
                                tekst="tre misjonsreiser"
                                dy={10}
                                anker="end"
                            />
                        )}
                        {beat >= 2 &&
                            PUNKTER.filter(norsk).map((pt, i) => {
                                const [x, y] = p(pt);
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.4 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: dur(0.3 + i * 0.07) }}
                                    >
                                        <Kors x={x} y={y} />
                                    </motion.g>
                                );
                            })}
                        {beat >= 3 &&
                            PUNKTER.slice(0, 12).map((pt, i) => {
                                const [x, y] = p([pt[0] + 0.9, pt[1] - 0.25]);
                                return (
                                    <motion.g
                                        key={`t${i}`}
                                        initial={{ opacity: 1 }}
                                        animate={{ opacity: 0.12 }}
                                        transition={{ duration: dur(2), delay: dur(i * 0.12) }}
                                    >
                                        <Tromme x={x} y={y} s={0.8} />
                                    </motion.g>
                                );
                            })}
                    </>
                )}

                {modus === 'trommer' &&
                    PUNKTER.map((pt, i) => {
                        const [x, y] = p(pt);
                        const vekk = beat >= 1;
                        const tilKbh = !brent(i);
                        const ferdig = beat >= 2;
                        const mål = vekk && tilKbh ? kbh : [x, y];
                        return (
                            <g key={i}>
                                {vekk && tilKbh && (
                                    <motion.path
                                        d={`M ${x} ${y} Q ${(x + kbh[0]) / 2 - 120} ${(y + kbh[1]) / 2} ${kbh[0]} ${kbh[1]}`}
                                        fill="none"
                                        stroke="#7c4a1e"
                                        strokeWidth={2.5}
                                        strokeOpacity={0.5}
                                        initial={{ pathLength: beat === 1 ? 0 : 1 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{
                                            duration: dur(2.4),
                                            delay: dur(0.5 + i * 0.05),
                                        }}
                                    />
                                )}
                                {vekk && !tilKbh && !ferdig && (
                                    <motion.g
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: dur(0.4 + i * 0.06) }}
                                    >
                                        <Flamme x={x} y={y} />
                                    </motion.g>
                                )}
                                <motion.g
                                    initial={false}
                                    animate={{
                                        x: mål[0] - x,
                                        y: mål[1] - y,
                                        opacity:
                                            vekk && !tilKbh ? 0 : ferdig && !igjen(i) ? 0.15 : 1,
                                    }}
                                    transition={{ duration: dur(2.4), delay: dur(0.5 + i * 0.05) }}
                                >
                                    <Tromme x={x} y={y} />
                                </motion.g>
                            </g>
                        );
                    })}

                {modus === 'idag' && (
                    <>
                        {PUNKTER.map((pt, i) => {
                            const [x, y] = p(pt);
                            if (beat < 3 && i % 4 === 3) return null;
                            return beat >= 3 && i % 3 === 0 ? (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.4 }}
                                    animate={{ opacity: 1, scale: 1.1 }}
                                    transition={{ delay: dur(0.4 + i * 0.06) }}
                                >
                                    <Tromme x={x} y={y} farge="#fde68a" />
                                </motion.g>
                            ) : (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: beat >= 3 ? 0.35 : 1 }}
                                    transition={{ delay: dur(0.2 + i * 0.05) }}
                                >
                                    <Kors x={x} y={y} farge="#475569" />
                                </motion.g>
                            );
                        })}
                        {beat >= 1 && (
                            <g>
                                {beat === 2 &&
                                    [0, 1, 2].map((i) => (
                                        <motion.circle
                                            key={i}
                                            cx={p(LAESTADIUS)[0]}
                                            cy={p(LAESTADIUS)[1]}
                                            r={40}
                                            fill="#7c3aed"
                                            fillOpacity={0.12}
                                            stroke="#7c3aed"
                                            strokeWidth={4}
                                            initial={{ scale: 0.3, opacity: 0 }}
                                            animate={{ scale: 1.6 + i * 1.3, opacity: 0.7 }}
                                            transition={{
                                                duration: dur(2.2),
                                                delay: dur(0.3 + i * 0.7),
                                            }}
                                        />
                                    ))}
                                <circle
                                    cx={p(LAESTADIUS)[0]}
                                    cy={p(LAESTADIUS)[1]}
                                    r={14}
                                    fill="#7c3aed"
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <Merke
                                    x={p(LAESTADIUS)[0] - 22}
                                    y={p(LAESTADIUS)[1]}
                                    tekst="Læstadius"
                                    dy={12}
                                    anker="end"
                                />
                            </g>
                        )}
                    </>
                )}

                {modus === 'tilbake' &&
                    (() => {
                        const hjem = p(MIDT);
                        const pos: [number, number] =
                            beat === 1 ? [kbh[0] - 30, kbh[1] - 90] : hjem;
                        return (
                            <>
                                {beat >= 1 && (
                                    <motion.path
                                        d={`M ${hjem[0]} ${hjem[1]} Q ${(hjem[0] + kbh[0]) / 2 - 160} ${(hjem[1] + kbh[1]) / 2} ${kbh[0]} ${kbh[1]}`}
                                        fill="none"
                                        stroke={beat >= 2 ? '#0d9488' : '#7c4a1e'}
                                        strokeWidth={6}
                                        strokeDasharray="4 12"
                                        strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: dur(2.4), delay: dur(0.4) }}
                                    />
                                )}
                                <motion.g
                                    initial={false}
                                    animate={{
                                        x: pos[0] - hjem[0],
                                        y: pos[1] - hjem[1],
                                        scale: beat >= 2 ? 1.25 : 1,
                                    }}
                                    transition={{ duration: dur(2.6), delay: dur(0.6) }}
                                >
                                    <circle
                                        cx={hjem[0]}
                                        cy={hjem[1]}
                                        r={70}
                                        fill={beat >= 2 ? '#99f6e4' : '#fde68a'}
                                        fillOpacity={0.6}
                                    />
                                    <Tromme x={hjem[0]} y={hjem[1]} s={3} />
                                </motion.g>
                            </>
                        );
                    })()}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={overskrift}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[3.5%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {overskrift}
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                {modus === 'trommer' && beat === 2 && (
                    <motion.div
                        key="hundre"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[8%] left-[4%]"
                    >
                        <Teller
                            verdi={100}
                            etikett="runebommer igjen i hele verden"
                            prefiks="ca. "
                            forsinkelse={dur(0.8)}
                        />
                    </motion.div>
                )}
                {modus === 'trommer' && beat === 3 && (
                    <motion.div
                        key="synd"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-[8%] left-[4%] flex flex-col gap-3"
                    >
                        {['Noaider jaktet på', 'Joiken kalt synd', 'Sieidiene veltet'].map(
                            (t, i) => (
                                <motion.div
                                    key={t}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: dur(0.5 + i * 1.1) }}
                                    className="px-5 py-2 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 font-black text-2xl shadow-lg whitespace-nowrap"
                                >
                                    {t}
                                </motion.div>
                            )
                        )}
                    </motion.div>
                )}
                {modus === 'idag' && beat === 3 && (
                    <motion.div
                        key="sjaman"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(1) }}
                        className="absolute bottom-[8%] left-[4%] px-5 py-3 rounded-2xl bg-amber-100 text-slate-900 font-black text-2xl shadow-xl"
                    >
                        1990-tallet: samisk sjamanisme
                    </motion.div>
                )}
                {modus === 'idag' && beat >= 4 && (
                    <motion.div
                        key="nye"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(1) }}
                        className="absolute bottom-[8%] left-[4%] px-5 py-3 rounded-2xl bg-amber-100 text-slate-900 font-black text-2xl shadow-xl"
                    >
                        Instrument og tegn på samisk identitet
                    </motion.div>
                )}
                {modus === 'tilbake' && beat === 0 && (
                    <motion.div
                        key="poulsen"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: dur(0.8) }}
                        className="absolute bottom-[8%] right-[4%] px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-black text-2xl shadow-xl"
                    >
                        Trommen til noaiden Anders Poulsen
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
