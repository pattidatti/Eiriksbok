import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Nordmenn om bord. Beat 0: Norge lyser opp, og 31 figurer, én per norskfødt passasjer,
 * står på et kort. Beat 1: pila for utvandringen til Amerika tegnes over havet, og kortet
 * sier med ord (ikke med tellbare figurer) at de aller fleste reiste på tredje klasse.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];

const NORGE = 578;
const NORGE_PKT: LngLat = [8.5, 61];
const NEW_YORK: LngLat = [-74.0, 40.7];
const ANTALL = 31;

export function TitanicNordmenn({ beat }: VisualProps) {
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [-82, 30],
                        [30, 68],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    const fra = p(NORGE_PKT);
    const til = p(NEW_YORK);
    const knekk = p([-32, 62]);
    const pil = `M ${fra.join(' ')} Q ${knekk.join(' ')} ${til.join(' ')}`;

    // Kortet med de 31 figurene ligger ute på havet, under pila.
    const kortX = 560;
    const kortY = 520;
    const kortB = 520;
    const kortH = 300;
    const perRad = 11;

    return (
        <div className="absolute inset-0 bg-[#cfe6f5] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <marker
                        id="nordmenn-pil"
                        viewBox="0 0 10 10"
                        refX={6}
                        refY={5}
                        markerWidth={5}
                        markerHeight={5}
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#b45309" />
                    </marker>
                </defs>
                <Land geographies={geographies} sti={sti} />

                {/* Pila for utvandringen tegnes på beat 1 */}
                {beat >= 1 && (
                    <motion.path
                        d={pil}
                        fill="none"
                        stroke="#b45309"
                        strokeWidth={14}
                        strokeLinecap="round"
                        markerEnd="url(#nordmenn-pil)"
                        initial={{ pathLength: 0, opacity: 0.9 }}
                        animate={{ pathLength: 1, opacity: 0.9 }}
                        transition={{ duration: 2.2, ease: 'easeInOut' }}
                    />
                )}

                <g transform={`translate(${fra[0]} ${fra[1]})`}>
                    <circle r={10} fill="#1d4ed8" stroke="#ffffff" strokeWidth={3} />
                    <MerkeTekst tekst="Norge" dx={0} dy={-22} farge="#1d4ed8" />
                </g>
                <g transform={`translate(${til[0]} ${til[1]})`}>
                    <circle r={9} fill="#0f172a" />
                    <MerkeTekst tekst="Amerika" dx={0} dy={44} />
                </g>

                {beat >= 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                    >
                        <text
                            x={knekk[0] + 40}
                            y={knekk[1] - 10}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={900}
                            fill="#92400e"
                            stroke="#ffffff"
                            strokeWidth={7}
                            paintOrder="stroke"
                        >
                            Utvandringen til Amerika
                        </text>
                        <text
                            x={knekk[0] + 40}
                            y={knekk[1] + 30}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#92400e"
                            stroke="#ffffff"
                            strokeWidth={6}
                            paintOrder="stroke"
                        >
                            hundretusenvis av nordmenn
                        </text>
                    </motion.g>
                )}

                {/* Kortet med de 31 norskfødte */}
                <rect
                    x={kortX}
                    y={kortY}
                    width={kortB}
                    height={kortH}
                    rx={22}
                    fill="#ffffff"
                    opacity={0.96}
                    stroke="#1d4ed8"
                    strokeWidth={4}
                />
                <text
                    x={kortX + kortB / 2}
                    y={kortY + 58}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    31 født i Norge
                </text>
                {Array.from({ length: ANTALL }, (_, i) => {
                    const rad = Math.floor(i / perRad);
                    const kol = i % perRad;
                    const x = kortX + 50 + kol * 42;
                    const y = kortY + 100 + rad * 52;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
                        >
                            <Person x={x} y={y} />
                        </motion.g>
                    );
                })}
                {beat >= 1 && (
                    <motion.text
                        x={kortX + kortB / 2}
                        y={kortY + kortH - 26}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={900}
                        fill="#92400e"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        De aller fleste: 3. klasse
                    </motion.text>
                )}
            </svg>
            <div className="absolute top-[5%] inset-x-0 flex justify-center pointer-events-none">
                <div className="px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl md:text-4xl font-black text-slate-900">
                    Nordmenn om bord
                </div>
            </div>
        </div>
    );
}

function Person({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`} fill="#1d4ed8">
            <circle cx={0} cy={-14} r={8} />
            <path d="M -11 16 L -11 0 Q -11 -5 -5 -5 L 5 -5 Q 11 -5 11 0 L 11 16 Z" />
        </g>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => {
                const norge = Number((g as { id?: string | number }).id) === NORGE;
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={norge ? '#93c5fd' : '#f5efe0'}
                        stroke={norge ? '#1d4ed8' : '#b9ad92'}
                        strokeWidth={norge ? 2.5 : 1}
                    />
                );
            })}
        </>
    );
});

function MerkeTekst({
    tekst,
    dx,
    dy,
    farge = '#0f172a',
}: {
    tekst: string;
    dx: number;
    dy: number;
    farge?: string;
}) {
    return (
        <text
            x={dx}
            y={dy}
            textAnchor="middle"
            fontSize={32}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={6}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}
