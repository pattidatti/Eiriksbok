import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart over Danmark-Norge: reisene fra Tune til Tromsø, bedriftene haugianerne startet,
 * sjøveien som ble stengt (saltet), og arven der Sverige og Norge gikk hver sin vei.
 * Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'reiser' | 'bedrifter' | 'salt' | 'arv';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const HAUGE = '#7c3aed';
const GULL = '#b45309';
const ROD = '#b91c1c';
const BLA = '#1d4ed8';
const LAND = '#f5efe0';
const KANT = '#b9ad92';

const NORGE_ID = '578';
const SVERIGE_ID = '752';
const DANMARK_ID = '208';

const STED = {
    tune: [11.05, 59.28] as LngLat,
    christiania: [10.75, 59.91] as LngLat,
    bredtvet: [10.86, 59.95] as LngLat,
    bergen: [5.32, 60.39] as LngLat,
    trondheim: [10.4, 63.43] as LngLat,
    tromso: [18.96, 69.65] as LngLat,
    kristiansand: [7.99, 58.15] as LngLat,
    eg: [8.03, 58.17] as LngLat,
    eiker: [9.92, 59.68] as LngLat,
    fennefoss: [7.8, 58.65] as LngLat,
    vingelen: [10.97, 62.48] as LngLat,
    gravdalen: [5.27, 60.37] as LngLat,
    sorlandet: [8.6, 58.35] as LngLat,
};

/** Reisene, grovt tegnet: ikke den nøyaktige ruta, men hvor langt de gikk. */
const REISE_SOR: LngLat[] = [
    STED.tune,
    STED.christiania,
    [9.6, 59.6],
    [8.4, 58.4],
    [6.2, 58.9],
    [5.7, 59.9],
    STED.bergen,
];
const REISE_NORD: LngLat[] = [
    STED.bergen,
    [6.2, 61.5],
    [7.2, 62.6],
    STED.trondheim,
    [12.2, 65.2],
    [14.4, 67.3],
    [16.5, 68.5],
    STED.tromso,
];
/** Turene til Danmark, tegnet over Skagerrak. */
const REISE_DANMARK: LngLat[] = [STED.christiania, [10.6, 58.6], [10.3, 57.4]];

/** Prikker for møter i stuer og på tun langs reisene. */
const MOTER: LngLat[] = [
    [10.2, 59.4], [9.3, 59.3], [8.6, 58.6], [7.1, 58.2], [5.9, 59.2], [6.6, 60.6],
    [5.8, 61.2], [6.8, 62.0], [8.4, 62.9], [10.8, 63.0], [11.4, 64.0], [12.9, 65.9],
    [13.9, 66.8], [15.4, 68.0], [17.6, 69.0], [10.3, 60.8], [11.6, 60.2], [9.0, 61.6],
];

/** Sjøveien inn til Norge, som krigen stengte. */
const SJOVEI: LngLat[] = [
    [2.5, 55.0],
    [6.0, 56.8],
    [8.0, 57.8],
];
const SALTVEI: LngLat[] = [STED.christiania, [9.9, 59.2], [9.2, 58.7], STED.sorlandet];

interface Kort {
    tekst: string;
    farge?: string;
}
interface Tall {
    verdi: number;
    etikett: string;
    prefiks?: string;
    tone?: 'rod' | 'gronn';
}

const KORT: Record<Modus, Kort[][]> = {
    reiser: [
        [{ tekst: '1797 til 1804' }, { tekst: 'Hauge reiser rundt i Norge', farge: HAUGE }],
        [{ tekst: 'Helt nord' }, { tekst: 'til Tromsø', farge: HAUGE }],
        [{ tekst: 'Og sørover' }, { tekst: 'flere turer til Danmark', farge: BLA }],
        [{ tekst: 'Møter i stuer og på tun' }, { tekst: '«Lesere» eller haugianere', farge: HAUGE }],
        [
            { tekst: 'Haugianerne' },
            { tekst: 'Angre og vende om', farge: HAUGE },
            { tekst: 'Nei til dans, drikking og moro', farge: ROD },
        ],
    ],
    bedrifter: [
        [{ tekst: 'Våren 1801' }, { tekst: 'Hauge blir kjøpmann i Bergen', farge: GULL }],
        [
            { tekst: 'Lån til venner' },
            { tekst: 'Borgerbrev: lov fra myndighetene til å drive handel', farge: GULL },
        ],
        [{ tekst: '1799 til 1828' }],
        [
            { tekst: 'Papirfabrikker', farge: GULL },
            { tekst: 'Eiker og Fennefoss' },
            { tekst: 'Teglverk på Eg', farge: GULL },
        ],
        [
            { tekst: 'Boktrykkeri i Kristiansand', farge: GULL },
            { tekst: 'Kobbergruve i Vingelen', farge: GULL },
            { tekst: 'Møller i Gravdalen', farge: GULL },
        ],
        [{ tekst: 'Kritikerne' }, { tekst: '«Han vil bare tjene penger selv»', farge: ROD }],
    ],
    salt: [
        [{ tekst: 'Napoleonskrigene' }, { tekst: 'Sjøveien til Norge stengt', farge: ROD }],
        [{ tekst: 'Mangel på salt' }, { tekst: 'Salt holder maten lenge', farge: ROD }],
        [{ tekst: '1809' }, { tekst: 'Hauge sluppet ut en stund', farge: HAUGE }, { tekst: 'Saltverk på Sørlandet', farge: BLA }],
        [{ tekst: 'Fengslet for å preke' }, { tekst: 'men staten trengte ham', farge: HAUGE }],
    ],
    arv: [
        [{ tekst: '1817' }, { tekst: 'Gården Bredtvet ved Christiania', farge: HAUGE }],
        [{ tekst: '1821: testamentet' }, { tekst: '«Hold dere i statskirken»', farge: HAUGE }],
        [{ tekst: '29. mars 1824' }, { tekst: 'Hauge dør, 53 år gammel', farge: HAUGE }],
        [{ tekst: 'Sverige' }, { tekst: 'Bevegelsene bryter ut', farge: ROD }, { tekst: 'Egne frikirker' }],
        [{ tekst: 'Norge' }, { tekst: 'Lekfolket blir i statskirken', farge: BLA }],
    ],
};

const TALL: Partial<Record<Modus, (Tall[] | undefined)[]>> = {
    bedrifter: [undefined, undefined, [{ verdi: 150, etikett: 'bedrifter', prefiks: 'opptil ' }]],
};

/** Utsnittet per modus: hjørnene i kartet som skal fylle venstre del av bildet. */
const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    reiser: [
        [4.5, 56.6],
        [21, 70.2],
    ],
    bedrifter: [
        [4.2, 57.8],
        [13.5, 63.2],
    ],
    salt: [
        [1.5, 54.4],
        [15.5, 61.2],
    ],
    arv: [
        [4, 55.2],
        [24, 67.5],
    ],
};

export function HaugeKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'reiser';
    const { geographies } = useAtlasWorld();

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
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) => 'M ' + pts.map((ll) => p(ll).join(' ')).join(' L ');
    const land = (id: string) => geographies.find((g) => String((g as { id?: unknown }).id) === id);

    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];
    const tall = TALL[modus]?.[beat];

    const sverige = land(SVERIGE_ID);
    const norge = land(NORGE_ID);
    const danmark = land(DANMARK_ID);

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land geographies={geographies} sti={sti} />
                {/* Danmark-Norge: ett rike */}
                {(modus === 'reiser' || modus === 'salt') && norge && danmark && (
                    <g opacity={0.22}>
                        <path d={sti(norge as never) ?? ''} fill={HAUGE} />
                        <path d={sti(danmark as never) ?? ''} fill={HAUGE} />
                    </g>
                )}
                {modus === 'arv' && sverige && (
                    <Felt d={sti(sverige as never) ?? ''} farge={ROD} vis={beat >= 3} />
                )}
                {modus === 'arv' && norge && <Felt d={sti(norge as never) ?? ''} farge={BLA} vis={beat >= 4} />}

                {modus === 'reiser' && (
                    <>
                        <Navn ll={[10.9, 61.7]} tekst="NORGE" p={p} />
                        <Navn ll={[16.5, 62.0]} tekst="SVERIGE" p={p} farge="#a8a29e" />
                    </>
                )}
                {modus === 'salt' && (
                    <>
                        <Navn ll={[9.2, 60.6]} tekst="NORGE" p={p} />
                        <Navn ll={[9.2, 56.1]} tekst="DANMARK" p={p} />
                        <Navn ll={[4.0, 57.2]} tekst="NORDSJØEN" p={p} farge="#3b82a6" />
                    </>
                )}
                {modus === 'arv' && (
                    <>
                        <Navn ll={[8.6, 61.6]} tekst="NORGE" p={p} farge={beat >= 4 ? BLA : '#57534e'} />
                        <Navn ll={[16.4, 63.0]} tekst="SVERIGE" p={p} farge={beat >= 3 ? ROD : '#57534e'} />
                    </>
                )}

                {/* Reisene */}
                {modus === 'reiser' && (
                    <>
                        <Pil d={linje(REISE_SOR)} farge={HAUGE} varighet={2.2} />
                        {beat >= 1 && <Pil d={linje(REISE_NORD)} farge={HAUGE} varighet={3} />}
                        {beat >= 2 && <Pil d={linje(REISE_DANMARK)} farge={BLA} varighet={2} />}
                        {beat >= 3 &&
                            MOTER.map((ll, i) => (
                                <motion.circle
                                    key={i}
                                    cx={p(ll)[0]}
                                    cy={p(ll)[1]}
                                    r={9}
                                    fill="#f59e0b"
                                    stroke="#ffffff"
                                    strokeWidth={3}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + i * 0.12 }}
                                    style={{ transformOrigin: `${p(ll)[0]}px ${p(ll)[1]}px` }}
                                />
                            ))}
                        <Merke ll={STED.tune} tekst="Tune" p={p} farge={HAUGE} hoyre />
                        {beat >= 1 && <Merke ll={STED.tromso} tekst="Tromsø" p={p} farge={HAUGE} venstre />}
                        {beat >= 2 && <Merke ll={[10.3, 57.4]} tekst="Danmark" p={p} farge={BLA} venstre />}
                    </>
                )}

                {/* Bedriftene */}
                {modus === 'bedrifter' && (
                    <>
                        <Merke ll={STED.bergen} tekst="Bergen" p={p} farge={HAUGE} stor={beat <= 1} venstre />
                        {beat >= 2 &&
                            [STED.eiker, STED.fennefoss, STED.eg, STED.kristiansand, STED.vingelen, STED.gravdalen].map(
                                (ll, i) => <Fabrikk key={i} ll={ll} p={p} forsinkelse={i * 0.3} />
                            )}
                        {beat >= 3 && (
                            <>
                                <Merke ll={STED.eiker} tekst="Eiker" p={p} farge={GULL} />
                                <Merke ll={STED.fennefoss} tekst="Fennefoss" p={p} farge={GULL} venstre />
                                <Merke ll={STED.eg} tekst="Eg" p={p} farge={GULL} under />
                            </>
                        )}
                        {beat >= 4 && (
                            <>
                                <Merke ll={STED.vingelen} tekst="Vingelen" p={p} farge={GULL} />
                                <Merke ll={STED.kristiansand} tekst="Kristiansand" p={p} farge={GULL} hoyre />
                                <Merke ll={[5.27, 60.2]} tekst="Gravdalen" p={p} farge={GULL} under />
                            </>
                        )}
                    </>
                )}

                {/* Saltet */}
                {modus === 'salt' && (
                    <>
                        <Pil d={linje(SJOVEI)} farge="#64748b" varighet={1.6} />
                        <Kryss ll={[7.2, 57.4]} p={p} />
                        {beat >= 2 && <Pil d={linje(SALTVEI)} farge={HAUGE} varighet={2} />}
                        {beat >= 2 && <Merke ll={STED.christiania} tekst="Fengselet" p={p} farge={HAUGE} />}
                        {beat >= 2 && <Merke ll={STED.sorlandet} tekst="Saltverk" p={p} farge={BLA} under />}
                        {beat === 1 && <Saltsekk ll={[9.6, 60.5]} p={p} />}
                    </>
                )}

                {/* Arven */}
                {modus === 'arv' && (
                    <>
                        <Merke ll={STED.bredtvet} tekst="Bredtvet" p={p} farge={HAUGE} venstre />
                        {beat >= 1 && beat <= 2 && <Brevet ll={[20.5, 59.2]} p={p} />}
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
                    {tall && (
                        <motion.div
                            key={`tall-${modus}-${beat}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-wrap gap-3"
                        >
                            {tall.map((t, i) => (
                                <Teller
                                    key={t.etikett}
                                    verdi={t.verdi}
                                    etikett={t.etikett}
                                    prefiks={t.prefiks}
                                    tone={t.tone}
                                    forsinkelse={0.6 + i * 0.6}
                                />
                            ))}
                        </motion.div>
                    )}
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

function Felt({ d, farge, vis }: { d: string; farge: string; vis: boolean }) {
    return (
        <motion.path
            d={d}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 0.45 : 0 }}
            transition={{ duration: 1.2 }}
        />
    );
}

function Navn({
    ll,
    tekst,
    p,
    farge = '#57534e',
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
    farge?: string;
}) {
    const [x, y] = p(ll);
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={30} fontWeight={900} letterSpacing={5} fill={farge} opacity={0.75}>
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
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
    farge: string;
    under?: boolean;
    venstre?: boolean;
    hoyre?: boolean;
    stor?: boolean;
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
            <circle cx={x} cy={y} r={stor ? 20 : 13} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <text
                x={venstre ? x - 26 : hoyre ? x + 26 : x}
                y={side ? y + 11 : under ? y + 52 : y - 26}
                textAnchor={venstre ? 'end' : hoyre ? 'start' : 'middle'}
                fontSize={32}
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

/** En linje som tegnes fram, med en pilspiss som følger med til slutt. */
function Pil({ d, farge, varighet = 2.2 }: { d: string; farge: string; varighet?: number }) {
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#ffffff"
                strokeWidth={16}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: varighet, ease: 'easeInOut' }}
            />
            <motion.path
                d={d}
                fill="none"
                stroke={farge}
                strokeWidth={9}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: varighet, ease: 'easeInOut' }}
            />
            <Spiss d={d} farge={farge} forsinkelse={varighet} />
        </g>
    );
}

function Spiss({ d, farge, forsinkelse }: { d: string; farge: string; forsinkelse: number }) {
    const tall = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    if (tall.length < 4) return null;
    const [x1, y1, x2, y2] = tall.slice(-4);
    const vinkel = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: forsinkelse - 0.2 }}>
            <path
                d="M -4 -20 L 30 0 L -4 20 Z"
                transform={`translate(${x2} ${y2}) rotate(${vinkel})`}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={4}
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

/** En liten fabrikk med pipe: en bedrift haugianerne startet. */
function Fabrikk({ ll, p, forsinkelse }: { ll: LngLat; p: (ll: LngLat) => [number, number]; forsinkelse: number }) {
    const [x, y] = p(ll);
    return (
        <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 180, damping: 16 }}
        >
            <g transform={`translate(${x - 26} ${y - 52})`}>
                <path d="M 0 40 L 0 18 L 14 26 L 14 18 L 28 26 L 28 4 L 38 4 L 38 40 Z" fill={GULL} stroke="#ffffff" strokeWidth={3} />
            </g>
        </motion.g>
    );
}

function Kryss({ ll, p }: { ll: LngLat; p: (ll: LngLat) => [number, number] }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={44} fill="#ffffff" stroke={ROD} strokeWidth={8} />
            <path d={`M ${x - 22} ${y - 22} L ${x + 22} ${y + 22} M ${x + 22} ${y - 22} L ${x - 22} ${y + 22}`} stroke={ROD} strokeWidth={12} strokeLinecap="round" />
        </motion.g>
    );
}

/** En tom saltsekk: det som mangler. */
function Saltsekk({ ll, p }: { ll: LngLat; p: (ll: LngLat) => [number, number] }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <path
                d={`M ${x - 50} ${y + 60} Q ${x - 60} ${y - 20} ${x - 30} ${y - 50} L ${x + 30} ${y - 50} Q ${x + 60} ${y - 20} ${x + 50} ${y + 60} Z`}
                fill="#ffffff"
                stroke="#78716c"
                strokeWidth={5}
            />
            <text x={x} y={y + 20} textAnchor="middle" fontSize={34} fontWeight={900} fill="#44403c">
                SALT
            </text>
            <text x={x} y={y + 110} textAnchor="middle" fontSize={30} fontWeight={900} fill={ROD} stroke="#ffffff" strokeWidth={6} paintOrder="stroke">
                tomt
            </text>
        </motion.g>
    );
}

/** Testamentet: et brev til vennene. */
function Brevet({ ll, p }: { ll: LngLat; p: (ll: LngLat) => [number, number] }) {
    const [x, y] = p(ll);
    return (
        <motion.g initial={{ opacity: 0, rotate: -8 }} animate={{ opacity: 1, rotate: -4 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <rect x={x - 110} y={y - 140} width={220} height={280} rx={10} fill="#fffbeb" stroke="#a8a29e" strokeWidth={4} />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <line key={i} x1={x - 80} x2={x + (i === 6 ? 10 : 80)} y1={y - 90 + i * 30} y2={y - 90 + i * 30} stroke="#a8a29e" strokeWidth={5} strokeLinecap="round" />
            ))}
            <text x={x} y={y + 125} textAnchor="middle" fontSize={26} fontWeight={900} fill={HAUGE}>
                H. N. Hauge
            </text>
        </motion.g>
    );
}
