import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet til Egede-filmen: presten fra Harstad som skriver til kongen, nordboernes to bygder,
 * Thule-folket som kom fra nord, og Grønland fra Kielfreden til selvstyre. Kartet står til
 * venstre, forklaringene til høyre.
 */

type Modus = 'prest' | 'nordboerne' | 'thule' | 'kiel';
type LngLat = [number, number];
type P = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;
const PREST = '#7c2d12';
const NORR = '#9a3412';
const INUIT = '#1d4ed8';
const GULL = '#b45309';
const ROD = '#b91c1c';
const GRONN = '#15803d';
const LAND = '#f5efe0';
const KANT = '#b9ad92';

const ID = {
    norge: '578',
    danmark: '208',
    gronland: '304',
    island: '352',
    sverige: '752',
};

const STED = {
    harstad: [16.54, 68.8] as LngLat,
    vagan: [14.48, 68.21] as LngLat,
    kobenhavn: [12.57, 55.68] as LngLat,
    bergen: [5.32, 60.39] as LngLat,
    kiel: [10.13, 54.32] as LngLat,
    nuuk: [-51.7, 64.18] as LngLat,
    austerbygd: [-45.6, 61.0] as LngLat,
    vesterbygd: [-50.2, 64.4] as LngLat,
    island: [-22.6, 65.0] as LngLat,
    faroyene: [-6.9, 62.0] as LngLat,
    thule: [-68.8, 77.4] as LngLat,
};

interface Kort {
    tekst: string;
    farge?: string;
}

const KORT: Record<Modus, Kort[][]> = {
    prest: [
        [{ tekst: '1686' }, { tekst: 'Født i Harstad', farge: PREST }, { tekst: 'Teologi i København: læren om Gud', farge: INUIT }],
        [{ tekst: '1707' }, { tekst: 'Prest i Vågan i Lofoten', farge: PREST }, { tekst: 'Han hører om Grønland', farge: INUIT }],
        [{ tekst: 'Nordboerne' }, { tekst: 'Lever de fortsatt der ute?', farge: GULL }],
        [{ tekst: '1710' }, { tekst: 'Brev til biskopene', farge: PREST }, { tekst: 'Året etter: brev til kongen', farge: GULL }],
        [{ tekst: '1717' }, { tekst: 'Han sier opp som prest', farge: ROD }, { tekst: 'Saken på heltid', farge: PREST }],
        [{ tekst: '1720' }, { tekst: 'Handelskompani i Bergen', farge: GRONN }, { tekst: '300 riksdaler fra Egede selv', farge: GULL }],
    ],
    nordboerne: [
        [{ tekst: 'Vikingtiden' }, { tekst: 'Hvem bodde på Grønland?', farge: NORR }],
        [{ tekst: '982' }, { tekst: 'Eirik Raude kommer', farge: NORR }, { tekst: '985: en flåte på 25 skip', farge: NORR }],
        [{ tekst: 'To bygder' }, { tekst: 'Austerbygd', farge: NORR }, { tekst: 'Vesterbygd', farge: NORR }],
        [{ tekst: 'Over 290 gårder' }, { tekst: 'Kanskje 4000 mennesker', farge: GULL }],
        [{ tekst: '1261' }, { tekst: 'Del av Norgesveldet', farge: ROD }, { tekst: 'riket til den norske kongen', farge: ROD }],
    ],
    thule: [
        [{ tekst: 'Etter svartedauden' }, { tekst: 'Handelsreisene fra Norge slutter', farge: ROD }],
        [{ tekst: 'Rundt 1450' }, { tekst: 'De yngste sporene i Austerbygd', farge: NORR }, { tekst: 'Hvorfor forsvant de?', farge: GULL }],
        [{ tekst: '1200-tallet' }, { tekst: 'Thule-folket kommer', farge: INUIT }],
        [{ tekst: 'Fangstfolk' }, { tekst: 'Sel og hval', farge: INUIT }, { tekst: 'Kajakk og hundeslede', farge: INUIT }],
        [{ tekst: 'Inuittene' }, { tekst: 'Thule-folket er forfedrene deres', farge: INUIT }, { tekst: 'Det var dem Egede møtte', farge: PREST }],
    ],
    kiel: [
        [{ tekst: 'Etter Egede' }, { tekst: 'Grønland styres fra København', farge: ROD }],
        [{ tekst: '1814: Kielfreden' }, { tekst: 'Norge blir tatt fra Danmark', farge: GULL }, { tekst: 'Danmark beholder Island, Færøyene og Grønland', farge: ROD }],
        [{ tekst: 'I Norge' }, { tekst: 'Mange blir sinte', farge: GULL }],
        [{ tekst: '1953' }, { tekst: 'Ikke lenger koloni', farge: INUIT }, { tekst: 'En del av selve Danmark', farge: ROD }],
        [{ tekst: '1. mai 1979' }, { tekst: 'Hjemmestyre', farge: INUIT }, { tekst: 'Eget folkevalgt parlament', farge: INUIT }],
        [{ tekst: '2008' }, { tekst: '75,5 prosent ja til mer selvstyre', farge: INUIT }, { tekst: 'Danmark: utenrikspolitikk, forsvar og penger', farge: ROD }],
    ],
};

/** Utsnittet per modus: hjørnene i kartet som skal fylle venstre del av bildet. */
const UTSNITT: Record<Modus, Utsnitt> = {
    prest: [
        [-50, 52],
        [44, 72],
    ],
    nordboerne: [
        [-56, 59],
        [-8, 67.5],
    ],
    thule: [
        [-74, 59],
        [-14, 79],
    ],
    kiel: [
        [-62, 53],
        [30, 78],
    ],
};

/** Gårdene i de to bygdene: faste plasser, så bildet er likt hver gang. */
function gaarder(): { ll: LngLat; bygd: 0 | 1 }[] {
    const ut: { ll: LngLat; bygd: 0 | 1 }[] = [];
    let s = 7;
    const r = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
    for (let i = 0; i < 290; i++) {
        const ost = i < 200;
        const [cx, cy] = ost ? STED.austerbygd : STED.vesterbygd;
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r());
        ut.push({ ll: [cx + Math.cos(a) * d * (ost ? 2.2 : 1.4), cy + Math.sin(a) * d * (ost ? 0.75 : 0.55)], bygd: ost ? 0 : 1 });
    }
    return ut;
}
const GAARDER = gaarder();

export function EgedeKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'prest';
    const { geographies } = useFilmVerden(modus === 'nordboerne' ? UTSNITT.nordboerne : undefined);

    const projeksjon = useMemo(() => {
        const [a, b] = UTSNITT[modus];
        return geoMercator().fitExtent(
            [
                [40, 40],
                [1000, 860],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    }, [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p: P = (ll) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => 'M ' + pts.map((ll) => p(ll).join(' ')).join(' L ');
    const land = (id: string) => {
        const g = geographies.find((x) => String((x as { id?: unknown }).id) === id);
        return g ? (sti(g as never) ?? '') : '';
    };

    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];

    // Grønlands farge i Kiel-modusen: koloni (rød), del av Danmark, hjemmestyre, selvstyre (blå).
    const gronlandFarge = beat <= 2 ? ROD : beat === 3 ? '#9333ea' : INUIT;

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />

                {modus === 'prest' && (
                    <>
                        <Felt d={land(ID.norge)} farge={PREST} opasitet={0.18} />
                        <Felt d={land(ID.danmark)} farge={PREST} opasitet={0.18} />
                        <Navn ll={[-41, 72]} tekst="GRØNLAND" p={p} />
                        {beat !== 3 && beat !== 5 && <Navn ll={[10, 62.6]} tekst="DANMARK-NORGE" p={p} farge={PREST} />}
                        <Merke ll={STED.harstad} tekst="Harstad" p={p} farge={PREST} hoyre stor={beat === 0} />
                        {beat === 0 && <Pil d={linje([STED.harstad, [12.6, 64.2], [9.6, 59.0], STED.kobenhavn])} farge={INUIT} varighet={2} />}
                        <Merke ll={STED.kobenhavn} tekst="København" p={p} farge={INUIT} hoyre />
                        {beat >= 1 && <Merke ll={STED.vagan} tekst="Vågan" p={p} farge={PREST} venstre stor={beat === 1 || beat === 4} />}
                        {beat === 1 && <Boble ll={STED.vagan} p={p} tekst="Grønland?" farge={INUIT} dx={-330} dy={-110} />}
                        {beat === 2 && (
                            <>
                                <Pil d={linje([STED.vagan, [10, 70.6], [-10, 70.2], [-30, 67.4], [-44, 64.6]])} farge={GULL} varighet={2.6} stiplet />
                                <Sporsmal ll={[-38, 63.2]} p={p} />
                            </>
                        )}
                        {beat === 3 && (
                            <>
                                <Pil d={linje([STED.vagan, [11.5, 64.6], [9.4, 59.4], STED.kobenhavn])} farge={GULL} varighet={2} />
                                <Brev ll={[-3, 64.6]} p={p} forsinkelse={0.4} />
                                <Brev ll={[-1, 59.8]} p={p} forsinkelse={1.2} />
                                <Krone ll={[3, 55.6]} p={p} />
                            </>
                        )}
                        {beat === 4 && <Kryss ll={STED.vagan} p={p} />}
                        {beat >= 5 && (
                            <>
                                <Merke ll={STED.bergen} tekst="Bergen" p={p} farge={GRONN} venstre stor />
                                <Mynter ll={[-13, 58.4]} p={p} />
                                <Pil d={linje([STED.bergen, [2, 63.6], [-14, 64.0], [-32, 63.4], [-46, 63.4]])} farge={GRONN} varighet={2.6} stiplet />
                            </>
                        )}
                    </>
                )}

                {modus === 'nordboerne' && (
                    <>
                        <Navn ll={[-41.5, 66.4]} tekst="GRØNLAND" p={p} />
                        {beat === 0 && <Navn ll={[-19.6, 63.7]} tekst="ISLAND" p={p} />}
                        {beat === 0 && <Sporsmal ll={[-46.5, 63.3]} p={p} />}
                        {beat >= 1 && (
                            <>
                                <Pil d={linje([STED.island, [-30, 64.3], [-38, 62.2], [-43.6, 60.9]])} farge={NORR} varighet={2.4} />
                                <Merke ll={STED.island} tekst="Island" p={p} farge={NORR} under />
                            </>
                        )}
                        {beat === 1 && <Flate p={p} />}
                        {beat >= 2 && (
                            <>
                                <Omrade ll={STED.austerbygd} rx={170} ry={80} p={p} farge={NORR} />
                                <Omrade ll={STED.vesterbygd} rx={110} ry={62} p={p} farge={NORR} forsinkelse={0.8} />
                                <Merke ll={[-45.0, 62.3]} tekst="Austerbygd" p={p} farge={NORR} hoyre usynligPunkt />
                                <Merke ll={[-49.0, 65.5]} tekst="Vesterbygd" p={p} farge={NORR} hoyre usynligPunkt />
                            </>
                        )}
                        {beat >= 3 && <Gaarder p={p} />}
                        {beat >= 4 && (
                            <>
                                <Felt d={land(ID.gronland)} farge={ROD} opasitet={0.18} />
                                <Krone ll={[-36.5, 64.6]} p={p} />
                            </>
                        )}
                    </>
                )}

                {modus === 'thule' && (
                    <>
                        <Navn ll={[-40, 72]} tekst="GRØNLAND" p={p} />
                        {beat <= 1 && (
                            <>
                                <Pil d={linje([[-12, 61.4], [-26, 60.4], [-38, 60.2], [-44.2, 60.8]])} farge={ROD} varighet={1.8} stiplet />
                                <Kryss ll={[-24, 60.6]} p={p} />
                            </>
                        )}
                        <Merke
                            ll={STED.austerbygd}
                            tekst="Austerbygd"
                            p={p}
                            farge={beat >= 1 ? '#78716c' : NORR}
                            under
                            stor={beat === 1}
                        />
                        {beat === 1 && <Sporsmal ll={[-38, 63.4]} p={p} />}
                        {beat >= 2 && (
                            <>
                                <Pil d={linje([[-80, 75.4], [-73, 77.6], STED.thule])} farge={INUIT} varighet={1.6} />
                                <Pil d={linje([STED.thule, [-58, 74.2], [-54, 70.2], [-53, 66.6], [-51.2, 63.4], [-47.6, 60.8]])} farge={INUIT} varighet={3} forsinkelse={1.4} />
                                <Merke ll={STED.thule} tekst="Thule" p={p} farge={INUIT} hoyre />
                            </>
                        )}
                        {beat >= 3 && (
                            <>
                                <Kajakk ll={[-60.5, 69.6]} p={p} />
                                <Slede ll={[-64, 75.6]} p={p} />
                            </>
                        )}
                        {beat >= 4 && (
                            <>
                                <Felt d={land(ID.gronland)} farge={INUIT} opasitet={0.22} />
                                <Merke ll={STED.nuuk} tekst="Her landet Egede" p={p} farge={PREST} venstre />
                            </>
                        )}
                    </>
                )}

                {modus === 'kiel' && (
                    <>
                        <Felt d={land(ID.danmark)} farge={ROD} opasitet={0.45} />
                        <Felt d={land(ID.gronland)} farge={gronlandFarge} opasitet={beat >= 3 ? 0.35 : 0.3} />
                        <Felt d={land(ID.norge)} farge={beat >= 1 ? GULL : ROD} opasitet={0.3} />
                        {beat >= 1 && <Felt d={land(ID.island)} farge={ROD} opasitet={0.3} />}
                        <Navn ll={[-42, 73]} tekst="GRØNLAND" p={p} />
                        <Navn ll={[13, 64.4]} tekst="NORGE" p={p} />
                        <Merke ll={STED.kobenhavn} tekst="København" p={p} farge={ROD} hoyre />
                        {beat === 0 && <Pil d={linje([STED.kobenhavn, [-10, 64], [-38, 66], STED.nuuk])} farge={ROD} varighet={2.6} buet />}
                        {beat >= 1 && (
                            <>
                                <Merke ll={STED.kiel} tekst="Kiel" p={p} farge={GULL} venstre />
                                <Merke ll={STED.island} tekst="Island" p={p} farge={ROD} under />
                                <Merke ll={STED.faroyene} tekst="Færøyene" p={p} farge={ROD} under />
                            </>
                        )}
                        {beat === 2 && <Boble ll={[8, 62]} p={p} tekst="Sinte!" farge={GULL} dx={-170} dy={-30} />}
                        {beat >= 3 && <Merke ll={STED.nuuk} tekst="Nuuk" p={p} farge={gronlandFarge} hoyre stor={beat >= 4} />}
                        {beat >= 3 && (
                            <Navn
                                key={beat}
                                ll={[-40, 69.5]}
                                tekst={beat === 3 ? 'DEL AV DANMARK' : beat === 4 ? 'HJEMMESTYRE' : 'SELVSTYRE'}
                                p={p}
                                farge={gronlandFarge}
                            />
                        )}
                    </>
                )}
            </svg>

            <div className="absolute right-[3%] top-0 bottom-0 w-[36%] flex flex-col justify-center gap-4">
                <AnimatePresence mode="popLayout">
                    {kort.map((k, i) => (
                        <motion.div
                            key={`${modus}-${beat}-${k.tekst}`}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.5, type: 'spring', stiffness: 160, damping: 20 }}
                            className={
                                i === 0 && !k.farge
                                    ? 'px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-2xl md:text-4xl shadow-xl'
                                    : 'px-5 py-3 rounded-2xl bg-white/95 text-slate-900 font-bold text-xl md:text-2xl shadow-xl border-l-[10px]'
                            }
                            style={k.farge ? { borderColor: k.farge } : undefined}
                        >
                            {k.tekst}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: unknown[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} fill={LAND} stroke={KANT} strokeWidth={1.5} />
            ))}
        </>
    );
});

function Felt({ d, farge, opasitet = 0.4 }: { d: string; farge: string; opasitet?: number }) {
    return (
        <motion.path
            d={d}
            initial={{ opacity: 0 }}
            animate={{ opacity: opasitet, fill: farge }}
            transition={{ duration: 1.2 }}
        />
    );
}

function Navn({ ll, tekst, p, farge = '#57534e' }: { ll: LngLat; tekst: string; p: P; farge?: string }) {
    const [x, y] = p(ll);
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={30} fontWeight={900} letterSpacing={5} fill={farge} opacity={0.75} stroke="#ffffff" strokeWidth={5} paintOrder="stroke">
            {tekst}
        </text>
    );
}

function Merke({
    ll,
    tekst,
    p,
    farge,
    under,
    venstre,
    hoyre,
    stor,
    usynligPunkt,
}: {
    ll: LngLat;
    tekst: string;
    p: P;
    farge: string;
    under?: boolean;
    venstre?: boolean;
    hoyre?: boolean;
    stor?: boolean;
    usynligPunkt?: boolean;
}) {
    const [x, y] = p(ll);
    const side = venstre || hoyre;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            {!usynligPunkt && <circle cx={x} cy={y} r={stor ? 20 : 13} fill={farge} stroke="#ffffff" strokeWidth={4} />}
            <text
                x={venstre ? x - 28 : hoyre ? x + 28 : x}
                y={side ? y + 11 : under ? y + 54 : y - 28}
                textAnchor={venstre ? 'end' : hoyre ? 'start' : 'middle'}
                fontSize={34}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/** En linje som tegnes fram, med en pilspiss til slutt. */
function Pil({
    d,
    farge,
    varighet = 2.2,
    forsinkelse = 0,
    stiplet,
    buet,
}: {
    d: string;
    farge: string;
    varighet?: number;
    forsinkelse?: number;
    stiplet?: boolean;
    buet?: boolean;
}) {
    const tall = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    const dd = buet && tall.length === 8 ? `M ${tall[0]} ${tall[1]} C ${tall[2]} ${tall[3]} ${tall[4]} ${tall[5]} ${tall[6]} ${tall[7]}` : d;
    const t = { duration: varighet, delay: forsinkelse, ease: 'easeInOut' as const };
    return (
        <g>
            <motion.path d={dd} fill="none" stroke="#ffffff" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={t} />
            <motion.path
                d={dd}
                fill="none"
                stroke={farge}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={stiplet ? '2 18' : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={t}
            />
            <Spiss tall={tall} farge={farge} forsinkelse={forsinkelse + varighet} />
        </g>
    );
}

function Spiss({ tall, farge, forsinkelse }: { tall: number[]; farge: string; forsinkelse: number }) {
    if (tall.length < 4) return null;
    const [x1, y1, x2, y2] = tall.slice(-4);
    const vinkel = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse - 0.2 }}>
            <path d="M -4 -20 L 30 0 L -4 20 Z" transform={`translate(${x2} ${y2}) rotate(${vinkel})`} fill={farge} stroke="#ffffff" strokeWidth={4} strokeLinejoin="round" />
        </motion.g>
    );
}

function Boble({ ll, p, tekst, farge, dx, dy }: { ll: LngLat; p: P; tekst: string; farge: string; dx: number; dy: number }) {
    const [x, y] = p(ll);
    const b = 30 + tekst.length * 21;
    const h = 70;
    const cx = x + dx;
    const cy = y + dy;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 15 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
            <path d={`M ${x} ${y - 14} L ${cx - 14} ${cy + h / 2 - 2} L ${cx + 14} ${cy + h / 2 - 2} Z`} fill="#ffffff" />
            <rect x={cx - b / 2} y={cy - h / 2} width={b} height={h} rx={h / 2} fill="#ffffff" stroke={farge} strokeWidth={5} />
            <text x={cx} y={cy + 13} textAnchor="middle" fontSize={36} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

/** Et stort, blinkende spørsmålstegn. */
function Sporsmal({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={150}
            fontWeight={900}
            fill={GULL}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }}
        >
            ?
        </motion.text>
    );
}

/** Et brev på vei. */
function Brev({ ll, p, forsinkelse = 0 }: { ll: LngLat; p: P; forsinkelse?: number }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: forsinkelse, type: 'spring' }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <rect x={x - 44} y={y - 30} width={88} height={60} rx={6} fill="#fffbeb" stroke={GULL} strokeWidth={5} />
            <path d={`M ${x - 44} ${y - 30} L ${x} ${y + 6} L ${x + 44} ${y - 30}`} fill="none" stroke={GULL} strokeWidth={5} strokeLinejoin="round" />
        </motion.g>
    );
}

/** Kongens krone. */
function Krone({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, type: 'spring' }}>
            <g transform={`translate(${x} ${y})`}>
                <path d="M -50 30 L -56 -26 L -26 0 L 0 -40 L 26 0 L 56 -26 L 50 30 Z" fill="#facc15" stroke={GULL} strokeWidth={6} strokeLinejoin="round" />
                <rect x={-52} y={30} width={104} height={16} rx={4} fill={GULL} />
            </g>
        </motion.g>
    );
}

/** Et rødt kryss: noe som slutter. */
function Kryss({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, scale: 1.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 14 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <path d={`M ${x - 40} ${y - 40} L ${x + 40} ${y + 40} M ${x + 40} ${y - 40} L ${x - 40} ${y + 40}`} stroke="#ffffff" strokeWidth={22} strokeLinecap="round" />
            <path d={`M ${x - 40} ${y - 40} L ${x + 40} ${y + 40} M ${x + 40} ${y - 40} L ${x - 40} ${y + 40}`} stroke={ROD} strokeWidth={12} strokeLinecap="round" />
        </motion.g>
    );
}

/** En stabel mynter: pengene til reisen. */
function Mynter({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <g>
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.ellipse
                    key={i}
                    cx={x}
                    cy={y - i * 14}
                    rx={38}
                    ry={12}
                    fill="#facc15"
                    stroke={GULL}
                    strokeWidth={4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.25 }}
                />
            ))}
        </g>
    );
}

/** Flåten: 25 små seil på vei fra Island. */
function Flate({ p }: { p: P }) {
    const skip = Array.from({ length: 25 }, (_, i) => {
        const t = i / 24;
        const lng = -27 - t * 15 + (i % 3) * 0.6;
        const lat = 64.6 - t * 3.2 + ((i % 5) - 2) * 0.32;
        return p([lng, lat]);
    });
    return (
        <g>
            {skip.map(([x, y], i) => (
                <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.08 }}>
                    <path d={`M ${x - 12} ${y} L ${x + 12} ${y} L ${x + 8} ${y + 7} L ${x - 8} ${y + 7} Z`} fill={NORR} />
                    <path d={`M ${x} ${y - 2} L ${x} ${y - 20} L ${x + 10} ${y - 6} Z`} fill="#ffffff" stroke={NORR} strokeWidth={2} />
                </motion.g>
            ))}
        </g>
    );
}

function Omrade({ ll, rx, ry, p, farge, forsinkelse = 0 }: { ll: LngLat; rx: number; ry: number; p: P; farge: string; forsinkelse?: number }) {
    const [x, y] = p(ll);
    return (
        <motion.ellipse
            cx={x}
            cy={y}
            rx={rx}
            ry={ry}
            fill={farge}
            fillOpacity={0.14}
            stroke={farge}
            strokeWidth={5}
            strokeDasharray="14 10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.8 }}
        />
    );
}

/** 290 gårder, ett lite hus per gård. */
function Gaarder({ p }: { p: P }) {
    return (
        <g>
            {GAARDER.map((g, i) => {
                const [x, y] = p(g.ll);
                return (
                    <motion.rect
                        key={i}
                        x={x - 4}
                        y={y - 4}
                        width={8}
                        height={8}
                        fill={NORR}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + (i / GAARDER.length) * 2.2 }}
                    />
                );
            })}
        </g>
    );
}

/** En kajakk med en padler. */
function Kajakk({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 1 }}>
            <g transform={`translate(${x} ${y})`}>
                <ellipse cx={0} cy={0} rx={70} ry={20} fill="#ffffff" />
                <path d="M -64 0 Q 0 16 64 0 Q 0 -6 -64 0 Z" fill="#78350f" />
                <circle cx={0} cy={-22} r={10} fill={INUIT} />
                <path d="M 0 -12 L 0 2" stroke={INUIT} strokeWidth={8} strokeLinecap="round" />
                <path d="M -40 -30 L 40 10" stroke="#57534e" strokeWidth={5} strokeLinecap="round" />
            </g>
        </motion.g>
    );
}

/** En hundeslede med tre hunder. */
function Slede({ ll, p }: { ll: LngLat; p: P }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9, duration: 1 }}>
            <g transform={`translate(${x} ${y})`}>
                <rect x={-80} y={-50} width={190} height={74} rx={18} fill="#ffffff" />
                <path d="M -70 10 L -10 10 Q 0 10 2 0" stroke="#78350f" strokeWidth={6} fill="none" strokeLinecap="round" />
                <rect x={-66} y={-8} width={54} height={12} fill="#78350f" />
                <path d="M -2 -2 L 30 -6" stroke="#57534e" strokeWidth={3} />
                {[38, 64, 90].map((dx) => (
                    <g key={dx} transform={`translate(${dx} -12)`}>
                        <ellipse cx={0} cy={0} rx={12} ry={6} fill="#57534e" />
                        <circle cx={11} cy={-6} r={5} fill="#57534e" />
                        <path d="M -8 4 L -10 14 M 8 4 L 10 14" stroke="#57534e" strokeWidth={3} />
                    </g>
                ))}
            </g>
        </motion.g>
    );
}
