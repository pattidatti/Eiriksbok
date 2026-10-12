import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kart over Operasjon Ajax, i tre modus:
 * «iran»: Iran i Midtøsten, oljen som renner til Storbritannia, og fortjenesten som to hauger
 * med mynter: en stor hos britene og smuler hos iranerne.
 * «kald»: den kalde krigen. Sovjetunionen rett nord for Iran, oljen som den egentlige gevinsten,
 * og pila fra Washington: Operasjon Ajax.
 * «bakslag»: Iran går fra venn til fiende, og bumerangen fra 1953 som kommer tilbake i 1979.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'iran' | 'kald' | 'bakslag';

const IRAN = 364;
const STORBRITANNIA = 826;
const USA = 840;
const SOVJET = [643, 804, 112, 233, 428, 440, 498, 268, 51, 31, 398, 860, 795, 762, 417];

const STED = {
    iran: [53.5, 32.5] as LngLat,
    teheran: [51.4, 35.7] as LngLat,
    london: [-0.1, 51.5] as LngLat,
    washington: [-77, 38.9] as LngLat,
    usa: [-98, 39] as LngLat,
    sovjet: [52, 62] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    iran: '#16a34a',
    iranLys: '#86efac',
    britisk: '#1e3a8a',
    usa: '#2563eb',
    usaLys: '#93c5fd',
    sovjet: '#dc2626',
    fiende: '#b91c1c',
    olje: '#ca8a04',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat, p: GeoProjection) =>
        p.fitExtent(
            [
                [60, 60],
                [B - 60, H - 60],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    if (modus === 'iran') return utsnitt([-12, 22], [72, 60], geoMercator());
    return utsnitt([-125, 12], [95, 68], geoNaturalEarth1());
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    if (modus === 'iran') {
        if (id === IRAN) return FARGE.iran;
        if (beat >= 1 && id === STORBRITANNIA) return FARGE.britisk;
        return FARGE.land;
    }
    if (modus === 'kald') {
        if (id === IRAN) return FARGE.iran;
        if (id === USA) return FARGE.usa;
        if (beat >= 1 && SOVJET.includes(id)) return FARGE.sovjet;
        return FARGE.land;
    }
    if (id === USA) return FARGE.usa;
    if (id === IRAN) {
        if (beat === 1) return FARGE.usaLys;
        if (beat === 2) return FARGE.iran;
        return FARGE.fiende;
    }
    return FARGE.land;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    iran: [
        { tekst: 'Iran' },
        { tekst: 'Oljen: hentet opp av et britisk selskap' },
        { tekst: 'Hvem får fortjenesten?' },
        { tekst: 'Iranerne: smuler', rod: true },
    ],
    kald: [
        { tekst: 'USA sier ja. Hvorfor?' },
        { tekst: 'Den kalde krigen', rod: true },
        { tekst: 'Unnskyldningen: frykt for kommunisme' },
        { tekst: 'Den egentlige gevinsten: oljen' },
        { tekst: 'Eisenhower gir grønt lys' },
    ],
    bakslag: [
        { tekst: 'Fiender fortsatt i dag', rod: true },
        { tekst: 'Uten kuppet: et annet forhold?' },
        { tekst: 'Blowback = bakslag' },
        { tekst: 'Kort seier, langt tap' },
    ],
};

export function AjaxKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'iran';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
                <Land geographies={geographies} sti={sti} farge={(id) => fargeFor(modus, beat, id)} nokkel={`${modus}-${beat}`} />

                {modus === 'iran' && (
                    <>
                        <Etikett pos={p([54, 29])} tekst="Iran" farge="#14532d" stor />
                        {beat === 0 && <Etikett pos={p([45, 25])} tekst="Midtøsten" farge="#44403c" dy={60} />}
                        {beat >= 1 && <Etikett pos={p([-5, 47.5])} tekst="Storbritannia" farge={FARGE.britisk} />}
                        {beat === 1 && <Pil fra={p(STED.iran)} til={p(STED.london)} farge="#111827" bue={-0.2} />}
                        {beat === 1 && <Oljedråpe pos={p([50, 37])} />}
                        {beat >= 2 && <Mynthaug pos={p([7, 53])} antall={14} forsinkelse={0.3} />}
                        {beat >= 2 && <Mynthaug pos={p(STED.iran)} antall={1} forsinkelse={1.2} />}
                        {beat >= 3 && <Etikett pos={p([54, 26])} tekst="Det harde arbeidet" farge="#14532d" dy={70} />}
                    </>
                )}

                {modus === 'kald' && (
                    <>
                        <Etikett pos={p([53, 24])} tekst="Iran" farge="#14532d" dy={40} />
                        <Etikett pos={p([-100, 34])} tekst="USA" farge="#1e3a8a" stor />
                        {beat >= 1 && <Etikett pos={p(STED.sovjet)} tekst="Sovjetunionen" farge="#7f1d1d" stor />}
                        {beat === 2 && <Puls pos={p([55, 45])} farge={FARGE.sovjet} />}
                        {beat >= 3 && <Oljedråpe pos={p([62, 24])} stor />}
                        {beat >= 4 && <Pil fra={p(STED.washington)} til={p(STED.teheran)} farge="#1e3a8a" bue={-0.18} />}
                        {beat >= 4 && <Etikett pos={p([-20, 58])} tekst="Operasjon Ajax" farge="#1e3a8a" />}
                    </>
                )}

                {modus === 'bakslag' && (
                    <>
                        <Etikett pos={p([-100, 34])} tekst="USA" farge="#1e3a8a" stor />
                        <Etikett pos={p([53, 24])} tekst="Iran" farge={beat === 1 ? '#1e3a8a' : beat === 2 ? '#14532d' : '#7f1d1d'} dy={40} />
                        {beat === 0 && <Brudd fra={p(STED.washington)} til={p(STED.teheran)} />}
                        {beat === 1 && <Etikett pos={p([53, 40])} tekst="Hva om ...?" farge="#1e3a8a" dy={-60} />}
                        {beat === 2 && (
                            <>
                                <Pil fra={p(STED.washington)} til={p(STED.teheran)} farge="#1e3a8a" bue={-0.2} />
                                <Etikett pos={p([-15, 66])} tekst="1953" farge="#1e3a8a" stor />
                                <Pil fra={p(STED.teheran)} til={p(STED.washington)} farge={FARGE.fiende} bue={-0.2} forsinkelse={1.8} />
                                <Etikett pos={p([-15, 18])} tekst="1979" farge={FARGE.fiende} stor forsinkelse={2.6} />
                            </>
                        )}
                        {beat >= 3 && <Etikett pos={p([-98, 26])} tekst="Billig olje i noen tiår" farge="#1e3a8a" dy={40} />}
                        {beat >= 3 && <Etikett pos={p([28, 12])} tekst="Et folk som følte seg sveket" farge="#7f1d1d" dy={40} forsinkelse={1} />}
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[6%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-2xl md:text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    dy = 0,
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 56 : 40}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    fra,
    til,
    farge,
    forsinkelse = 0,
    bue = 0.15,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    forsinkelse?: number;
    bue?: number;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -22 -14 L 6 0 L -22 14 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.5 }}
            />
        </g>
    );
}

/** En stor oljedråpe som spretter inn. */
function Oljedråpe({ pos, stor }: { pos: [number, number]; stor?: boolean }) {
    const s = stor ? 1.8 : 1;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 180, damping: 12 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <path
                d={`M ${pos[0]} ${pos[1] - 46 * s} C ${pos[0] + 30 * s} ${pos[1] - 6 * s}, ${pos[0] + 30 * s} ${pos[1] + 26 * s}, ${pos[0]} ${pos[1] + 26 * s} C ${pos[0] - 30 * s} ${pos[1] + 26 * s}, ${pos[0] - 30 * s} ${pos[1] - 6 * s}, ${pos[0]} ${pos[1] - 46 * s} Z`}
                fill="#111827"
                stroke={stor ? FARGE.olje : '#ffffff'}
                strokeWidth={6}
            />
            <ellipse cx={pos[0] - 9 * s} cy={pos[1] + 2 * s} rx={5 * s} ry={9 * s} fill="#6b7280" />
        </motion.g>
    );
}

/** En haug med gullmynter. Én mynt er smuler. */
function Mynthaug({ pos, antall, forsinkelse }: { pos: [number, number]; antall: number; forsinkelse: number }) {
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <motion.ellipse
                    key={i}
                    cx={pos[0] + (i % 2 === 0 ? 0 : 6)}
                    cy={pos[1] + 20 - i * 14}
                    rx={44}
                    ry={13}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={4}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: forsinkelse + i * 0.12, type: 'spring', stiffness: 260, damping: 18 }}
                />
            ))}
        </g>
    );
}

/** Pulserende ring rundt et område. */
function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 60, opacity: 0.9 }}
            animate={{ r: 260, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}

/** En brutt linje mellom to land: forholdet er ødelagt. */
function Brudd({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const mx = (fra[0] + til[0]) / 2;
    const my = Math.min(fra[1], til[1]) - 140;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke="#7f1d1d"
                strokeWidth={6}
                strokeDasharray="18 16"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, delay: 0.3 }}
            />
            <motion.g
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, type: 'spring' }}
                style={{ transformOrigin: `${mx}px ${(fra[1] + til[1]) / 2 - 70}px` }}
                stroke="#b91c1c"
                strokeWidth={14}
                strokeLinecap="round"
            >
                <line x1={mx - 36} y1={(fra[1] + til[1]) / 2 - 106} x2={mx + 36} y2={(fra[1] + til[1]) / 2 - 34} />
                <line x1={mx + 36} y1={(fra[1] + til[1]) / 2 - 106} x2={mx - 36} y2={(fra[1] + til[1]) / 2 - 34} />
            </motion.g>
        </g>
    );
}
