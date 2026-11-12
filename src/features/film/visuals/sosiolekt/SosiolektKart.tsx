import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Norge med byene der artikkelen nevner sosiolekter: Oslo, Stavanger (Eiganes),
 * Trondheim (Singsaker) og Tromsø (et nord-sør-skille). Til slutt «ikke» mot «ikkje» i
 * Stavanger. Bydelene er ikke tegnet, bare byene.
 */

type LngLat = [number, number];

const B = 1600;
const H = 900;
const HAV = '#bcd4e4';
const NORGE_ID = '578';
const UTSNITT: Utsnitt = [
    [-4, 57.4],
    [34, 71.4],
];
/** Norge tegnes i venstre del av bildet, kortene står i en kolonne til høyre. */
const NORGE: [LngLat, LngLat] = [
    [4.5, 57.8],
    [31, 71.2],
];
const KORT_X = 1010;

interface By {
    navn: string;
    ll: LngLat;
    /** Kortets øvre kant. */
    ky: number;
    linje1: string;
    linje2: string;
    beat: number;
}

const BYER: By[] = [
    {
        navn: 'Oslo',
        ll: [10.75, 59.91],
        ky: 560,
        linje1: 'Østkant og vestkant',
        linje2: 'skillet fulgte Akerselva',
        beat: 0,
    },
    {
        navn: 'Stavanger',
        ll: [5.73, 58.97],
        ky: 740,
        linje1: 'Eiganes',
        linje2: 'knyttet til et finere talemål',
        beat: 1,
    },
    {
        navn: 'Trondheim',
        ll: [10.4, 63.43],
        ky: 380,
        linje1: 'Singsaker',
        linje2: 'knyttet til et finere talemål',
        beat: 2,
    },
    {
        navn: 'Tromsø',
        ll: [18.96, 69.65],
        ky: 200,
        linje1: 'Nord og sør i byen',
        linje2: 'tradisjonelt et skille i byen',
        beat: 3,
    },
];

const KORT_B = 530;
const KORT_H = 104;

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === NORGE_ID ? '#f3e3c3' : '#e6e2d6'}
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

export function SosiolektKart({ beat }: VisualProps) {
    const { geographies } = useFilmVerden(UTSNITT);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 110],
                    [960, H - 20],
                ],
                { type: 'MultiPoint', coordinates: NORGE } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const tittel = beat >= 4 ? 'Små trekk avslører deg' : 'Minst to sosiolekter i de fleste byer';
    const stavanger = p(BYER[1].ll);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land geographies={geographies} sti={sti} />
                {BYER.map((b) => {
                    const [x, y] = p(b.ll);
                    const vist = beat >= b.beat;
                    return (
                        <g key={b.navn}>
                            <circle
                                cx={x}
                                cy={y}
                                r={13}
                                fill="#0f172a"
                                stroke="#fff"
                                strokeWidth={4}
                            />
                            {vist && beat < 4 && (
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <line
                                        x1={x}
                                        y1={y}
                                        x2={KORT_X}
                                        y2={b.ky + KORT_H / 2}
                                        stroke="#6d28d9"
                                        strokeWidth={4}
                                    />
                                    <rect
                                        x={KORT_X}
                                        y={b.ky}
                                        width={KORT_B}
                                        height={KORT_H}
                                        rx={20}
                                        fill="#ffffff"
                                        stroke="#6d28d9"
                                        strokeWidth={4}
                                    />
                                    <text
                                        x={KORT_X + 24}
                                        y={b.ky + 44}
                                        fontSize={34}
                                        fontWeight={900}
                                        fill="#0f172a"
                                    >
                                        {b.navn}: {b.linje1}
                                    </text>
                                    <text
                                        x={KORT_X + 24}
                                        y={b.ky + 82}
                                        fontSize={31}
                                        fontWeight={700}
                                        fill="#475569"
                                    >
                                        {b.linje2}
                                    </text>
                                </motion.g>
                            )}
                        </g>
                    );
                })}
                <AnimatePresence>
                    {beat >= 4 && (
                        <motion.g
                            key="ikke"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <line
                                x1={stavanger[0]}
                                y1={stavanger[1]}
                                x2={KORT_X}
                                y2={600}
                                stroke="#6d28d9"
                                strokeWidth={4}
                            />
                            <rect
                                x={KORT_X}
                                y={420}
                                width={KORT_B}
                                height={250}
                                rx={26}
                                fill="#ffffff"
                                stroke="#6d28d9"
                                strokeWidth={5}
                            />
                            <text
                                x={KORT_X + 30}
                                y={470}
                                fontSize={32}
                                fontWeight={800}
                                fill="#475569"
                            >
                                Stavanger
                            </text>
                            <text
                                x={KORT_X + 30}
                                y={545}
                                fontSize={60}
                                fontWeight={900}
                                fill="#1d4ed8"
                            >
                                ikke
                            </text>
                            <text
                                x={KORT_X + 210}
                                y={545}
                                fontSize={32}
                                fontWeight={800}
                                fill="#1d4ed8"
                            >
                                høyere status
                            </text>
                            <text
                                x={KORT_X + 30}
                                y={630}
                                fontSize={60}
                                fontWeight={900}
                                fill="#c2410c"
                            >
                                ikkje
                            </text>
                            <text
                                x={KORT_X + 210}
                                y={630}
                                fontSize={32}
                                fontWeight={800}
                                fill="#c2410c"
                            >
                                det lokale ordet
                            </text>
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none"
                >
                    <div className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-display font-black text-4xl shadow-xl whitespace-nowrap">
                        {tittel}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
