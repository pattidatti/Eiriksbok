import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { Lapp } from './Lapp';

/**
 * Kart over Skandinavia.
 * «kobenhavn»: Georg Brandes holder foredrag i København i 1871, og tankene sprer seg.
 * «stavanger»: Alexander Kielland og handelshuset i Stavanger.
 */

type Modus = 'kobenhavn' | 'stavanger';
type LngLat = [number, number];

const B = 1600;
const H = 900;

const KOBENHAVN: LngLat = [12.57, 55.68];
const STAVANGER: LngLat = [5.73, 58.97];
const NORGE: LngLat = [8.6, 60.2];
const SVERIGE: LngLat = [15.0, 59.6];

const NORDEN = ['578', '752', '208'];

const RAMMER: Record<Modus, [LngLat, LngLat]> = {
    kobenhavn: [
        [3, 51],
        [21, 62],
    ],
    stavanger: [
        [0, 56.3],
        [15, 63],
    ],
};

export function RealismenKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'kobenhavn';
    const ramme = RAMMER[modus];
    const { geographies } = useFilmVerden([
        [ramme[0][0] - 2, ramme[0][1] - 2],
        [ramme[1][0] + 2, ramme[1][1] + 2],
    ]);
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 40],
                    [B - 40, H - 40],
                ],
                { type: 'MultiPoint', coordinates: ramme } as never
            ),
        [ramme]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];

    const visNorden = modus === 'kobenhavn' && beat >= 2;
    const land = useMemo(
        () =>
            geographies.map((g, i) => ({
                key: i,
                d: sti(g as never) ?? '',
                norden: NORDEN.includes(String(g.id)),
                norge: String(g.id) === '578',
            })),
        [geographies, sti]
    );

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#b9d3e6' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                {land.map((l) => (
                    <path
                        key={l.key}
                        d={l.d}
                        fill={
                            visNorden && l.norden
                                ? '#f6d9a8'
                                : modus === 'stavanger' && l.norge
                                  ? '#f3ead6'
                                  : '#e4ddcb'
                        }
                        stroke="#9c937c"
                        strokeWidth={1.5}
                        style={{ transition: 'fill 0.8s' }}
                    />
                ))}
                {modus === 'kobenhavn' ? (
                    <Kobenhavn beat={beat} p={p} />
                ) : (
                    <Stavanger beat={beat} p={p} />
                )}
            </svg>
        </div>
    );
}

function Nal({ x, y, farge = '#b91c1c' }: { x: number; y: number; farge?: string }) {
    return (
        <g>
            <motion.circle
                cx={x}
                cy={y}
                r={30}
                fill={farge}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <circle cx={x} cy={y} r={14} fill={farge} stroke="#ffffff" strokeWidth={4} />
        </g>
    );
}

function Kobenhavn({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const [kx, ky] = p(KOBENHAVN);
    const bue = (til: LngLat) => {
        const [tx, ty] = p(til);
        const mx = (kx + tx) / 2 - (ty - ky) * 0.25;
        const my = (ky + ty) / 2 + (tx - kx) * 0.25;
        return `M ${kx} ${ky} Q ${mx} ${my} ${tx} ${ty}`;
    };
    return (
        <>
            <Nal x={kx} y={ky} />
            <Lapp
                x={kx}
                y={ky + 70}
                tekst="København, 1871"
                fs={42}
                fyll="#7f1d1d"
                farge="#ffffff"
            />
            <Lapp
                x={kx + 40}
                y={ky + 160}
                tekst="Georg Brandes holder foredrag"
                fs={34}
                vis={beat === 0}
                forsinkelse={0.8}
            />
            {beat === 1 && (
                <>
                    <Lapp
                        x={kx + 40}
                        y={ky + 160}
                        tekst="Angrep på kirken"
                        fs={38}
                        fyll="#fee2e2"
                        farge="#7f1d1d"
                        forsinkelse={0.4}
                    />
                    <Lapp
                        x={kx + 40}
                        y={ky + 245}
                        tekst="og på makten"
                        fs={38}
                        fyll="#fee2e2"
                        farge="#7f1d1d"
                        forsinkelse={1.2}
                    />
                </>
            )}
            {beat === 2 && (
                <>
                    <Lapp x={800} y={110} tekst="Skandinavia" fs={56} fyll="#ffffff" />
                    <Lapp
                        x={kx + 40}
                        y={ky + 160}
                        tekst="Brandes: forfatterne er feige"
                        fs={36}
                        fyll="#fef3c7"
                        farge="#78350f"
                        forsinkelse={0.8}
                    />
                </>
            )}
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ transformOrigin: '800px 450px' }}
                >
                    <rect x={260} y={330} width={1080} height={240} rx={32} fill="#0f172a" />
                    <text
                        x={800}
                        y={432}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        «sette problemer
                    </text>
                    <text
                        x={800}
                        y={522}
                        textAnchor="middle"
                        fontSize={64}
                        fontWeight={900}
                        fill="#fbbf24"
                    >
                        under debatt»
                    </text>
                </motion.g>
            )}
            {beat >= 4 && (
                <>
                    {[NORGE, SVERIGE].map((til, i) => (
                        <motion.path
                            key={i}
                            d={bue(til)}
                            fill="none"
                            stroke="#b91c1c"
                            strokeWidth={9}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.6, delay: 0.4 + i * 0.5 }}
                        />
                    ))}
                    <Lapp
                        x={p(NORGE)[0]}
                        y={p(NORGE)[1] - 60}
                        tekst="Norge"
                        fs={40}
                        forsinkelse={1.6}
                    />
                    <Lapp
                        x={p(SVERIGE)[0] + 60}
                        y={p(SVERIGE)[1] - 60}
                        tekst="Sverige"
                        fs={40}
                        forsinkelse={2.0}
                    />
                    <Lapp
                        x={800}
                        y={830}
                        tekst="Det moderne gjennombrudd"
                        fs={56}
                        fyll="#7f1d1d"
                        farge="#ffffff"
                        forsinkelse={0.2}
                    />
                </>
            )}
        </>
    );
}

function Stavanger({ beat, p }: { beat: number; p: (ll: LngLat) => [number, number] }) {
    const [sx, sy] = p(STAVANGER);
    // Kortene står øst for Stavanger, inne over landet.
    const kx = sx + 470;
    return (
        <>
            <Nal x={sx} y={sy} farge="#0f766e" />
            <Lapp x={sx} y={sy - 70} tekst="Stavanger" fs={44} fyll="#0f766e" farge="#ffffff" />
            <Lapp x={800} y={100} tekst="Alexander Kielland" fs={56} />
            {beat === 0 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                >
                    {/* Handelshuset: et stort bryggehus */}
                    <g transform={`translate(${kx - 110} ${sy - 190})`}>
                        <rect
                            x={0}
                            y={80}
                            width={220}
                            height={150}
                            fill="#f8fafc"
                            stroke="#334155"
                            strokeWidth={5}
                        />
                        <path d="M -20 84 L 110 0 L 240 84 Z" fill="#7f1d1d" />
                        {[0, 1, 2].map((i) => (
                            <rect
                                key={i}
                                x={24 + i * 66}
                                y={120}
                                width={40}
                                height={52}
                                fill="#93c5fd"
                                stroke="#334155"
                                strokeWidth={3}
                            />
                        ))}
                        <rect x={90} y={182} width={40} height={48} fill="#78350f" />
                    </g>
                    <Lapp x={kx} y={sy + 100} tekst="Familiens handelshus" fs={38} />
                    <Lapp x={kx} y={sy + 180} tekst="i flere generasjoner" fs={32} fyll="#e2e8f0" />
                </motion.g>
            )}
            {beat === 1 && (
                <>
                    <Lapp
                        x={kx}
                        y={sy + 20}
                        tekst="Kritiserte de rike"
                        fs={42}
                        fyll="#fef3c7"
                        farge="#78350f"
                        forsinkelse={0.3}
                    />
                    <Lapp
                        x={kx}
                        y={sy + 130}
                        tekst="Skarpt, morsomt, ironisk"
                        fs={40}
                        forsinkelse={1.0}
                    />
                </>
            )}
            {beat === 2 && (
                <>
                    <Lapp
                        x={kx}
                        y={sy + 0}
                        tekst="Angrep på skolen"
                        fs={42}
                        fyll="#fee2e2"
                        farge="#7f1d1d"
                        forsinkelse={0.3}
                    />
                    <Lapp
                        x={kx}
                        y={sy + 110}
                        tekst="Angrep på kirken"
                        fs={42}
                        fyll="#fee2e2"
                        farge="#7f1d1d"
                        forsinkelse={0.9}
                    />
                    <Lapp
                        x={kx}
                        y={sy + 230}
                        tekst="Preker godhet, er selv grådige"
                        fs={34}
                        forsinkelse={1.6}
                    />
                </>
            )}
            {beat >= 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {/* Boka Gift */}
                    <g transform={`translate(${kx - 90} ${sy - 80})`}>
                        <rect x={0} y={0} width={180} height={240} rx={10} fill="#166534" />
                        <rect x={14} y={0} width={10} height={240} fill="#14532d" />
                        <text
                            x={100}
                            y={130}
                            textAnchor="middle"
                            fontSize={54}
                            fontWeight={900}
                            fill="#ffffff"
                        >
                            Gift
                        </text>
                        <text
                            x={100}
                            y={190}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill="#bbf7d0"
                        >
                            1883
                        </text>
                    </g>
                    <Lapp
                        x={kx}
                        y={sy + 240}
                        tekst="Tolv år på latinskolen"
                        fs={38}
                        forsinkelse={0.9}
                    />
                </motion.g>
            )}
        </>
    );
}
