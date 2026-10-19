import { memo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';

/**
 * Felles for de to kartene i Zulu-filmen (ZuluKart nær, ZuluRegion vidt): et fast grunnkart
 * som zoomes ved å skalere hele kartet, merkelapper, piler og overskrift.
 */

export type { LngLat, Ramme } from './kartVerktoy';

/** Landene. `farge` gir egen farge per land-id (ISO numerisk). */
export const Land = memo(function Land({
    geographies,
    sti,
    farge,
    standard = '#ece3cf',
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farge?: Record<string, string>;
    standard?: string;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={farge?.[String(g.id)] ?? standard}
                    stroke="#a8a08a"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                />
            ))}
        </>
    );
});

/** Alt land som klippesti, så flater kan tegnes grovt og likevel stoppe ved kysten. */
export const LandKlipp = memo(function LandKlipp({
    id,
    geographies,
    sti,
}: {
    id: string;
    geographies: GeoFeature[];
    sti: GeoPath;
}) {
    return (
        <clipPath id={id}>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} />
            ))}
        </clipPath>
    );
});

export function Etikett({
    tekst,
    x,
    y,
    farge = '#0f172a',
    anker = 'middle',
    str = 34,
}: {
    tekst: string;
    x: number;
    y: number;
    farge?: string;
    anker?: 'middle' | 'end' | 'start';
    str?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={800}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={7}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {tekst}
        </motion.text>
    );
}

/** Prikk med navn, i skjermkoordinater. */
export function Sted({
    pkt,
    navn,
    farge = '#0f172a',
    r = 12,
    dx = 22,
    dy = 10,
    anker = 'start',
}: {
    pkt: [number, number];
    navn?: string;
    farge?: string;
    r?: number;
    dx?: number;
    dy?: number;
    anker?: 'middle' | 'end' | 'start';
}) {
    return (
        <g>
            <motion.circle
                cx={pkt[0]}
                cy={pkt[1]}
                r={r}
                fill={farge}
                stroke="#fff"
                strokeWidth={4}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{ transformOrigin: `${pkt[0]}px ${pkt[1]}px` }}
            />
            {navn && <Etikett tekst={navn} x={pkt[0] + dx} y={pkt[1] + dy} anker={anker} farge={farge} />}
        </g>
    );
}

/** Buet pil i skjermkoordinater som tegnes opp. */
export function Pil({
    fra,
    til,
    farge,
    bue = 0.2,
    bredde = 9,
    stiplet = false,
    forsinkelse = 0,
    playing = true,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bue?: number;
    bredde?: number;
    stiplet?: boolean;
    forsinkelse?: number;
    playing?: boolean;
}) {
    const dx = til[0] - fra[0];
    const dy = til[1] - fra[1];
    const mx = (fra[0] + til[0]) / 2 - dy * bue;
    const my = (fra[1] + til[1]) / 2 + dx * bue;
    const vinkel = Math.atan2(til[1] - my, til[0] - mx);
    const spiss: [number, number] = [til[0] - Math.cos(vinkel) * 22, til[1] - Math.sin(vinkel) * 22];
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${spiss[0]} ${spiss[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeDasharray={stiplet ? '4 16' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: playing ? 1.6 : 0, delay: playing ? forsinkelse : 0 }}
            />
            <motion.polygon
                points={`0,-${bredde * 1.7} ${bredde * 3},0 0,${bredde * 1.7}`}
                fill={farge}
                transform={`translate(${spiss[0]} ${spiss[1]}) rotate(${(vinkel * 180) / Math.PI})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: playing ? forsinkelse + 1.4 : 0 }}
            />
        </g>
    );
}

/** Hvit boks med en til tre linjer, i skjermkoordinater. */
export function Fakta({
    x,
    y,
    linjer,
    bredde = 440,
    kant = '#0f172a',
}: {
    x: number;
    y: number;
    linjer: string[];
    bredde?: number;
    kant?: string;
}) {
    return (
        <motion.g initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <rect
                x={x}
                y={y}
                width={bredde}
                height={36 + linjer.length * 54}
                rx={20}
                fill="#ffffff"
                fillOpacity={0.95}
                stroke={kant}
                strokeWidth={3}
            />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x + bredde / 2}
                    y={y + 62 + i * 54}
                    textAnchor="middle"
                    fontSize={i === 0 ? 40 : 34}
                    fontWeight={i === 0 ? 900 : 700}
                    fill="#0f172a"
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

/** Overskrift øverst i midten, byttes per beat. */
export function Overskrift({ tekst, children }: { tekst: string | null; children?: ReactNode }) {
    return (
        <AnimatePresence mode="wait">
            {tekst && (
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                >
                    {tekst}
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/** Elv i kartkoordinater (strek som ikke skaleres med zoomen). */
export function Elv({ d, kk, uthevet = false }: { d: string; kk: number; uthevet?: boolean }) {
    return (
        <path
            d={d}
            fill="none"
            stroke={uthevet ? '#1d4ed8' : '#6b9cc7'}
            strokeWidth={(uthevet ? 7 : 4) / kk}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}
