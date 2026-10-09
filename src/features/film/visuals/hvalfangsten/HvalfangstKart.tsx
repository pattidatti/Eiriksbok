import { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, animate, motion } from 'framer-motion';
import { geoEquirectangular, geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over hvalfangsten. «nord»: Finnmark, Foyns stasjon ved Vadsø, de mange stasjonene
 * på 1890-tallet og forbudet i 1904. «sor»: kartet zoomer ut fra Norge til hele
 * Atlanterhavet, og ruta går ned til Sør-Georgia og Antarktis.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'nord' | 'sor';

const TONSBERG: LngLat = [10.41, 59.27];
const SANDEFJORD: LngLat = [10.22, 59.13];
const VADSO: LngLat = [29.75, 70.07];
const GRYTVIKEN: LngLat = [-36.5, -54.28];
const SOR_SHETLAND: LngLat = [-59.0, -62.2];

/** Kysten i nord, fra Helgeland til Varanger. Stasjonene plasseres langs denne. */
const KYST: LngLat[] = [
    [13.2, 66.6],
    [14.4, 67.3],
    [15.2, 68.2],
    [16.6, 68.9],
    [18.0, 69.6],
    [19.8, 70.0],
    [21.6, 70.3],
    [23.6, 70.65],
    [25.6, 71.0],
    [27.4, 70.95],
    [28.9, 70.75],
    [30.6, 70.35],
    [29.75, 70.07],
];

function langsKysten(andel: number): LngLat {
    const i = Math.min(KYST.length - 2, Math.floor(andel * (KYST.length - 1)));
    const k = andel * (KYST.length - 1) - i;
    return [
        KYST[i][0] + (KYST[i + 1][0] - KYST[i][0]) * k,
        KYST[i][1] + (KYST[i + 1][1] - KYST[i][1]) * k,
    ];
}

/** Over 30 stasjoner: 32 prikker, litt spredt langs kysten. */
const STASJONER: LngLat[] = Array.from({ length: 32 }, (_, i) => {
    const [lng, lat] = langsKysten(i / 31);
    return [lng + Math.sin(i * 2.7) * 0.35, lat + Math.cos(i * 1.9) * 0.18];
});

export function HvalfangstKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'nord';
    const { geographies } = useAtlasWorld();

    const projeksjon: GeoProjection = useMemo(() => {
        if (modus === 'nord') {
            return geoMercator().fitExtent(
                [
                    [80, 120],
                    [B - 80, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [4, 58.5],
                        [33, 71.4],
                    ],
                } as never
            );
        }
        return geoEquirectangular().fitExtent(
            [
                [80, 150],
                [B - 80, H - 30],
            ],
            {
                type: 'MultiPoint',
                coordinates: [
                    [-85, -72],
                    [45, 72],
                ],
            } as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    // «sor»: zoomet inn på Sør-Norge på beat 0, så ut til hele havet.
    const [zoom, setZoom] = useState(modus === 'sor' ? 1 : 0);
    const [rute, setRute] = useState(0);
    useEffect(() => {
        if (modus !== 'sor') return;
        const målZoom = 0;
        const målRute = beat >= 1 ? 1 : 0;
        const a = animate(zoom, målZoom, {
            duration: playing ? 4 : 0.01,
            delay: playing && beat === 0 ? 1.2 : 0,
            ease: 'easeInOut',
            onUpdate: setZoom,
        });
        const b = animate(rute, målRute, {
            duration: playing ? 4 : 0.01,
            ease: 'easeInOut',
            onUpdate: setRute,
        });
        return () => {
            a.stop();
            b.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beat, playing, modus]);

    const fokus = p(TONSBERG);
    const ZOOM = 6;
    const kk = Math.pow(ZOOM, zoom);
    const cx = B / 2 + (fokus[0] - B / 2) * zoom;
    const cy = H / 2 + (fokus[1] - H / 2) * zoom;
    const kartTransform = `translate(${B / 2 - cx * kk} ${H / 2 - cy * kk}) scale(${kk})`;
    const skjerm = (pt: [number, number]) =>
        `translate(${B / 2 + (pt[0] - cx) * kk} ${H / 2 + (pt[1] - cy) * kk})`;

    const ruteSti = useMemo(() => {
        const a = p([8, 57]);
        const m1 = p([-20, 20]);
        const m2 = p([-30, -30]);
        const b = p(GRYTVIKEN);
        return `M ${a.join(' ')} C ${m1.join(' ')} ${m2.join(' ')} ${b.join(' ')}`;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projeksjon]);

    const overskrift =
        modus === 'nord'
            ? ([
                  'Vadsø, 1870: den første stasjonen',
                  'Hvalstasjon = fabrikk på land',
                  'Bare Foyn fikk fange her',
                  '1890-tallet: over 30 stasjoner',
                  '1904: forbudt i de tre nordligste fylkene',
                  'Rundt 3500 blåhval tatt',
              ][beat] ?? null)
            : (['Svaret lå i sør', 'Larsen: 1892-1894', 'Grytviken, 1904', 'Sandefjord'][beat] ??
              null);

    return (
        <div className="absolute inset-0 bg-[#cfe3f0] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} />
                    {modus === 'sor' && (
                        <path
                            d={ruteSti}
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth={5}
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                            pathLength={1}
                            strokeDasharray={`${rute} 2`}
                            opacity={rute > 0.01 ? 1 : 0}
                        />
                    )}
                </g>

                {modus === 'nord' && (
                    <>
                        {/* Finnmarkskysten, der bare Foyn fikk fange i ti år */}
                        {beat === 2 && (
                            <motion.path
                                d={`M ${KYST.slice(5)
                                    .map((ll) => p(ll).join(' '))
                                    .join(' L ')}`}
                                fill="none"
                                stroke="#d97706"
                                strokeWidth={30}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity={0.55}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 2 }}
                            />
                        )}
                        {beat >= 3 &&
                            STASJONER.map((ll, i) => {
                                const [x, y] = p(ll);
                                const forbudt = beat >= 4;
                                return (
                                    <motion.g
                                        key={i}
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: forbudt ? 0.45 : 1, scale: 1 }}
                                        transition={{ delay: beat === 3 ? i * 0.08 : 0 }}
                                        style={{ originX: `${x}px`, originY: `${y}px` }}
                                    >
                                        <rect
                                            x={x - 9}
                                            y={y - 9}
                                            width={18}
                                            height={18}
                                            fill={forbudt ? '#64748b' : '#b45309'}
                                            stroke="#fff"
                                            strokeWidth={3}
                                        />
                                    </motion.g>
                                );
                            })}
                        {beat >= 4 && (
                            <motion.g
                                initial={{ opacity: 0, scale: 1.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ originX: '1100px', originY: '330px' }}
                            >
                                <rect
                                    x={900}
                                    y={290}
                                    width={400}
                                    height={80}
                                    rx={12}
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth={8}
                                    transform="rotate(-6 1100 330)"
                                />
                                <text
                                    x={1100}
                                    y={348}
                                    textAnchor="middle"
                                    fontSize={52}
                                    fontWeight={900}
                                    fill="#dc2626"
                                    transform="rotate(-6 1100 330)"
                                >
                                    FORBUDT
                                </text>
                            </motion.g>
                        )}
                        <g transform={`translate(${p(VADSO).join(' ')})`}>
                            <rect
                                x={-16}
                                y={-16}
                                width={32}
                                height={32}
                                fill="#7c2d12"
                                stroke="#fff"
                                strokeWidth={4}
                            />
                            <Etikett tekst="Vadsø" dy={-30} />
                        </g>
                        <g transform={`translate(${p(TONSBERG).join(' ')})`}>
                            <circle r={10} fill="#0f172a" />
                            <Etikett tekst="Tønsberg" dy={-22} />
                        </g>
                        {beat >= 5 && (
                            <motion.g
                                initial={{ opacity: 0, y: -40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1.2 }}
                            >
                                <path
                                    d="M 250 560 L 250 760 M 210 720 L 250 770 L 290 720"
                                    stroke="#0f172a"
                                    strokeWidth={14}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <Etikett tekst="Nye hav?" x={250} dy={530} />
                            </motion.g>
                        )}
                    </>
                )}

                {modus === 'sor' && (
                    <>
                        <g transform={skjerm(p(TONSBERG))}>
                            <circle r={9} fill="#0f172a" />
                            {beat === 0 && <Etikett tekst="Norge" dy={-22} />}
                        </g>
                        {zoom < 0.4 && (
                            <g transform={skjerm(p([0, -78]))}>
                                <Etikett tekst="Antarktis" dy={-10} farge="#1e3a5f" />
                            </g>
                        )}
                        {beat >= 2 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <g transform={skjerm(p(GRYTVIKEN))}>
                                    <rect
                                        x={-13}
                                        y={-13}
                                        width={26}
                                        height={26}
                                        fill="#b45309"
                                        stroke="#fff"
                                        strokeWidth={4}
                                    />
                                    <Etikett tekst="Grytviken, Sør-Georgia" dy={-26} />
                                </g>
                            </motion.g>
                        )}
                        {beat >= 3 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <g transform={skjerm(p(SANDEFJORD))}>
                                    <circle r={13} fill="#0d9488" stroke="#fff" strokeWidth={4} />
                                    <Etikett tekst="Sandefjord" x={-26} dy={8} anker="end" />
                                </g>
                                <g transform={skjerm(p(SOR_SHETLAND))}>
                                    <circle r={9} fill="#475569" />
                                    <Etikett tekst="Sør-Shetland" x={-18} dy={10} anker="end" />
                                </g>
                            </motion.g>
                        )}
                        {(beat === 1 || beat === 2) && (
                            <g transform={skjerm(p([-34, 8]))}>
                                <Etikett tekst="Carl Anton Larsen" dy={0} farge="#334155" />
                            </g>
                        )}
                    </>
                )}
            </svg>
            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#f5efe0"
                    stroke="#b9ad92"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </>
    );
});

function Etikett({
    tekst,
    dy,
    x = 0,
    farge = '#0f172a',
    anker = 'middle',
}: {
    tekst: string;
    dy: number;
    x?: number;
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
}) {
    return (
        <text
            x={x}
            y={dy}
            textAnchor={anker}
            fontSize={32}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
