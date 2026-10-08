import { memo, useEffect, useMemo, useState } from 'react';
import { animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over Nord-Atlanteren: ruta fra Southampton mot New York, stedet der Titanic
 * sank, og Carpathia som kjører mot ulykkesstedet. Kartet zoomer inn på stedet.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];

const SOUTHAMPTON: LngLat = [-1.4, 50.9];
const NEW_YORK: LngLat = [-74.0, 40.7];
const FORLIS: LngLat = [-49.95, 41.73];
const CARPATHIA_START: LngLat = [-49.1, 41.15];
const ZOOM = 4;

export function TitanicKart({ beat, playing }: VisualProps) {
    const { geographies } = useAtlasWorld();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 60],
                    [B - 60, H - 60],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-80, 32],
                        [6, 60],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const sted = p(FORLIS);
    const z = useMotionValue(0);
    const carp = useMotionValue(0);
    const plukket = useMotionValue(0);

    // Zoom inn kort tid etter at kartet er vist; Carpathia kjører fram i beat 0-1.
    useEffect(() => {
        if (!playing) return;
        const mål =
            beat === 0
                ? { z: 1, c: 0.45, pl: 0 }
                : beat === 1
                  ? { z: 1, c: 1, pl: 0.15 }
                  : { z: 1, c: 1, pl: 1 };
        const a = animate(z, mål.z, {
            duration: 2.8,
            delay: beat === 0 ? 2.2 : 0,
            ease: 'easeInOut',
        });
        const b = animate(carp, mål.c, {
            duration: beat === 0 ? 7 : 3.5,
            delay: beat === 0 ? 4 : 0,
            ease: 'easeInOut',
        });
        const c = animate(plukket, mål.pl, { duration: beat >= 2 ? 4 : 1.5, ease: 'easeInOut' });
        return () => {
            a.stop();
            b.stop();
            c.stop();
        };
    }, [beat, playing, z, carp, plukket]);

    // Verdiene leses inn i state hvert bilde, og alt tegnes som vanlige SVG-transformer.
    const [zv, setZv] = useState(0);
    const [cv, setCv] = useState(0);
    const [pv, setPv] = useState(0);
    useMotionValueEvent(z, 'change', setZv);
    useMotionValueEvent(carp, 'change', setCv);
    useMotionValueEvent(plukket, 'change', setPv);

    const kk = Math.pow(ZOOM, zv);
    const cx = B / 2 + (sted[0] - B / 2) * zv;
    const cy = H / 2 + (sted[1] - H / 2) * zv;
    const kartTransform = `translate(${B / 2 - cx * kk} ${H / 2 - cy * kk}) scale(${kk})`;
    const skjerm = (pt: [number, number]) =>
        `translate(${B / 2 + (pt[0] - cx) * kk} ${H / 2 + (pt[1] - cy) * kk})`;

    const route = `M ${p(SOUTHAMPTON).join(' ')} Q ${p([-25, 49]).join(' ')} ${sted.join(' ')}`;
    const planlagt = `M ${sted.join(' ')} Q ${p([-62, 40]).join(' ')} ${p(NEW_YORK).join(' ')}`;

    const livbater = useMemo(
        () =>
            Array.from({ length: 18 }, (_, i) => {
                const vinkel = i * 2.39;
                const r = 0.12 + (i % 5) * 0.06;
                return [
                    FORLIS[0] + Math.cos(vinkel) * r * 1.3,
                    FORLIS[1] + Math.sin(vinkel) * r,
                ] as LngLat;
            }),
        []
    );

    return (
        <div className="absolute inset-0 bg-[#cfe6f5] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <g transform={kartTransform}>
                    <Land geographies={geographies} sti={sti} />
                    <path
                        d={route}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={4}
                        vectorEffect="non-scaling-stroke"
                    />
                    <path
                        d={planlagt}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={3}
                        strokeDasharray="10 10"
                        opacity={0.5}
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
                <g transform={skjerm(p(SOUTHAMPTON))}>
                    <circle r={9} fill="#0f172a" />
                    <MerkeTekst tekst="Southampton" dy={-18} />
                </g>
                <g transform={skjerm(p(NEW_YORK))}>
                    <circle r={9} fill="#0f172a" />
                    <MerkeTekst tekst="New York" dy={-18} />
                </g>
                {/* Livbåtene rundt stedet, som Carpathia plukker opp */}
                {livbater.map((ll, i) => {
                    const fra = p(ll);
                    const pos: [number, number] = [
                        fra[0] + (sted[0] - fra[0]) * pv * 0.9,
                        fra[1] + (sted[1] - fra[1]) * pv * 0.9,
                    ];
                    const synlig =
                        Math.min(1, Math.max(0, (zv - 0.7) * 4)) *
                        (1 - Math.min(1, Math.max(0, pv - 0.85) * 6));
                    return (
                        <g key={i} transform={skjerm(pos)} opacity={synlig}>
                            <ellipse
                                rx={9}
                                ry={5}
                                fill="#ffffff"
                                stroke="#334155"
                                strokeWidth={2}
                            />
                            <circle cy={-6} r={2.5} fill="#f59e0b" />
                        </g>
                    );
                })}
                <g transform={skjerm(sted)}>
                    <g stroke="#dc2626" strokeWidth={7} strokeLinecap="round">
                        <line x1={-14} y1={-14} x2={14} y2={14} />
                        <line x1={14} y1={-14} x2={-14} y2={14} />
                    </g>
                    <MerkeTekst tekst="Titanic sank her" dy={-26} farge="#b91c1c" />
                </g>
                {(() => {
                    const fra = p(CARPATHIA_START);
                    const til = p([FORLIS[0] + 0.03, FORLIS[1] - 0.04]);
                    const pos: [number, number] = [
                        fra[0] + (til[0] - fra[0]) * cv,
                        fra[1] + (til[1] - fra[1]) * cv,
                    ];
                    const vinkel = (Math.atan2(til[1] - fra[1], til[0] - fra[0]) * 180) / Math.PI;
                    return (
                        <g
                            transform={skjerm(pos)}
                            opacity={Math.min(1, Math.max(0, (zv - 0.6) * 3))}
                        >
                            <g transform={`rotate(${vinkel})`}>
                                <path
                                    d="M -34 -9 L 22 -9 L 38 0 L 22 9 L -34 9 Z"
                                    fill="#0f766e"
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                />
                                <rect x={-8} y={-4} width={8} height={8} fill="#f8fafc" />
                            </g>
                            <text
                                y={36}
                                textAnchor="middle"
                                fontSize={28}
                                fontWeight={900}
                                fill="#0f766e"
                                stroke="#ffffff"
                                strokeWidth={6}
                                paintOrder="stroke"
                            >
                                Carpathia
                            </text>
                        </g>
                    );
                })()}
            </svg>
            {beat >= 3 && (
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-[8%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl md:text-4xl font-black text-slate-900 whitespace-nowrap"
                >
                    Plass i båt = livet
                </motion.div>
            )}
        </div>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
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

function MerkeTekst({
    tekst,
    dy,
    farge = '#0f172a',
}: {
    tekst: string;
    dy: number;
    farge?: string;
}) {
    return (
        <text
            y={dy}
            textAnchor="middle"
            fontSize={30}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={6}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
