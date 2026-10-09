import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart over Nord-Norge høsten 1944: den tyske hæren på retrett mot Lyngen, den sovjetiske
 * hæren fra øst, ordren om alt øst for Lyngen, hvor mye som ble ødelagt, og reisen sørover
 * med båt. Kartet står til venstre, forklaringene til høyre.
 */

type Modus = 'retrett' | 'sovjet' | 'ordre' | 'omfang' | 'sorover' | 'tromso';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const TYSK = '#475569';
const SOVJET = '#b91c1c';
const NORSK = '#1d4ed8';
const ILD = '#ea580c';
const LAND = '#f5efe0';
const KANT = '#b9ad92';

const NORGE_ID = '578';

const STED = {
    lyngen: [20.3, 69.55] as LngLat,
    tromso: [18.96, 69.65] as LngLat,
    kirkenes: [30.05, 69.73] as LngLat,
    tana: [28.2, 70.2] as LngLat,
    vardo: [31.1, 70.37] as LngLat,
    oslo: [10.75, 59.91] as LngLat,
};

/** Lyngenlinja: fra fjorden og inn mot grensa. */
const LYNGENLINJA: LngLat[] = [
    [20.2, 70.15],
    [20.3, 69.4],
    [20.85, 69.03],
];
/** Tanaelva, der den sovjetiske hæren stanset. */
const TANA: LngLat[] = [
    [28.65, 70.5],
    [28.2, 70.2],
    [27.6, 70.05],
    [27.0, 69.9],
    [26.0, 69.7],
    [25.4, 69.3],
];

/** Grove felt som klippes mot Norges omriss. */
const OST_FOR_LYNGEN: LngLat[] = [
    [20.2, 72.5],
    [20.2, 70.15],
    [20.3, 69.4],
    [20.85, 69.03],
    [33, 68.4],
    [33, 72.5],
];
const MELLOM: LngLat[] = [
    [20.2, 72.5],
    [20.2, 70.15],
    [20.3, 69.4],
    [20.85, 69.03],
    [25.4, 68.6],
    [25.4, 69.3],
    [26.0, 69.7],
    [27.0, 69.9],
    [27.6, 70.05],
    [28.2, 70.2],
    [28.65, 70.5],
    [28.65, 72.5],
];
const NORD_TROMS: LngLat[] = [
    [20.2, 72.5],
    [20.2, 70.15],
    [20.3, 69.4],
    [20.85, 69.03],
    [22.4, 68.9],
    [21.9, 69.7],
    [21.9, 72.5],
];
const FINNMARK_VEST: LngLat[] = [
    [21.9, 72.5],
    [21.9, 69.7],
    [22.4, 68.9],
    [25.4, 68.6],
    [25.4, 69.3],
    [26.0, 69.7],
    [27.0, 69.9],
    [27.6, 70.05],
    [28.2, 70.2],
    [28.6, 70.17],
    [28.6, 72.5],
];
const NORDLAND_TROMS: LngLat[] = [
    [9.5, 65.3],
    [12.5, 64.9],
    [14.5, 65.6],
    [16.5, 67.6],
    [18.5, 68.5],
    [20.85, 69.03],
    [20.3, 69.4],
    [20.2, 70.5],
    [15, 70.5],
    [9.5, 66],
];

/** Den tyske hæren på vei ut av Nord-Finland. */
const RETRETT: LngLat[][] = [
    [
        [25.7, 66.5],
        [23.5, 67.8],
        [21.6, 68.7],
        [20.6, 69.2],
    ],
    [
        [26.6, 68.3],
        [25.5, 69.3],
        [23.4, 69.9],
        [21.2, 69.75],
    ],
];
const SOVJET_INN: LngLat[] = [
    [31.6, 69.2],
    [30.6, 69.55],
    [30.05, 69.73],
];
const SOVJET_VEST: LngLat[] = [
    [30.05, 69.73],
    [29.3, 70.0],
    [28.4, 70.15],
];
const FRIVILLIG: LngLat[] = [
    [29.6, 70.1],
    [26.5, 71.0],
    [23.5, 70.9],
    [21.5, 70.4],
];
/** Båtene langs kysten fra Finnmark til Tromsø. */
const KYSTEN: LngLat[] = [
    [30.6, 70.6],
    [27.5, 71.2],
    [24.5, 71.05],
    [22.3, 70.6],
    [20.4, 70.3],
    [18.96, 69.65],
];
const SORLANDET: LngLat[] = [
    [18.96, 69.65],
    [15.8, 68.9],
    [13.4, 67.6],
    [12.0, 66.2],
    [10.6, 64.7],
    [8.0, 63.4],
    [5.0, 62.1],
    [4.6, 60.2],
    [5.4, 58.8],
    [7.8, 57.9],
    [10.6, 59.4],
];

interface Kort {
    tekst: string;
    farge?: string;
}
interface Tall {
    verdi: number;
    etikett: string;
    tone?: 'rod' | 'gronn';
    prefiks?: string;
}

const KORT: Record<Modus, Kort[][]> = {
    retrett: [
        [{ tekst: 'Høsten 1944' }, { tekst: 'Tyskland taper krigen', farge: TYSK }],
        [{ tekst: 'Nord-Finland' }, { tekst: 'Den tyske hæren må ut', farge: TYSK }],
        [{ tekst: 'Lyngen' }, { tekst: 'Ny forsvarslinje', farge: TYSK }],
    ],
    sovjet: [
        [{ tekst: '22. oktober 1944' }, { tekst: 'Sovjetiske soldater krysser grensen', farge: SOVJET }],
        [{ tekst: '25. oktober' }, { tekst: 'Kirkenes er befridd', farge: SOVJET }],
        [{ tekst: '6. november' }, { tekst: 'Stanser ved Tanaelva', farge: SOVJET }],
        [{ tekst: '10. november' }, { tekst: 'Norske soldater kommer', farge: NORSK }],
        [{ tekst: 'Mellom to hærer' }, { tekst: 'Resten av Finnmark og Nord-Troms', farge: '#d97706' }],
    ],
    ordre: [
        [{ tekst: 'Oktober 1944' }, { tekst: 'Noen flytter frivillig', farge: TYSK }],
        [{ tekst: 'De fleste blir' }, { tekst: 'Gården, båten og dyrene', farge: '#15803d' }],
        [{ tekst: '26. oktober' }, { tekst: 'Josef Terboven i Troms', farge: TYSK }, { tekst: 'Rikskommissær: Hitlers mann i Norge' }],
        [{ tekst: 'Terboven er redd' }, { tekst: 'for at den norske regjeringen i London skal få kontroll', farge: NORSK }],
        [{ tekst: '28. oktober 1944' }, { tekst: 'Alle øst for Lyngen: flyttes med tvang', farge: SOVJET }, { tekst: 'Alle hus: brennes', farge: ILD }],
    ],
    omfang: [
        [{ tekst: 'Mye lenger' }, { tekst: 'enn en hær trengte', farge: ILD }],
        [{ tekst: 'Finnmark' }, { tekst: 'Nesten alt vest for Varangerbotn og Tana', farge: '#7c2d12' }],
        [{ tekst: 'Nord-Troms' }, { tekst: 'Halvparten til ni av ti bygninger', farge: ILD }],
        [{ tekst: 'Vardø' }, { tekst: '85 prosent av byen ødelagt', farge: '#7c2d12' }],
    ],
    sorover: [
        [{ tekst: 'Tvangsevakuert' }],
        [{ tekst: 'Med båt sørover' }, { tekst: 'Små fiskebåter og store tyske skip', farge: NORSK }],
        [
            { tekst: 'Fiskebåtene: stort sett godt', farge: '#15803d' },
            { tekst: 'Tyske skip: ofte svært dårlig', farge: SOVJET },
        ],
        [{ tekst: 'Mellom 200 og 300 døde', farge: SOVJET }, { tekst: 'i forbindelse med evakueringen' }],
    ],
    tromso: [
        [{ tekst: 'Tromsø, november 1944' }],
        [{ tekst: 'Litt over 70 prosent' }, { tekst: 'havnet i Nordland og Troms', farge: '#0d9488' }],
        [{ tekst: 'Sør-Norge' }, { tekst: 'De fleste på Østlandet', farge: NORSK }],
        [{ tekst: 'Over et halvt år' }, { tekst: 'borte fra hjemmet', farge: TYSK }],
    ],
};

const TALL: Partial<Record<Modus, (Tall[] | undefined)[]>> = {
    retrett: [undefined, [{ verdi: 200000, etikett: 'tyske soldater', prefiks: 'over ' }]],
    sovjet: [undefined, [{ verdi: 28, etikett: 'av ca. 900 bygninger sto igjen', tone: 'rod' }]],
    ordre: [[{ verdi: 5000, etikett: 'reiste frivillig', prefiks: 'ca. ' }]],
    sorover: [
        [
            { verdi: 37000, etikett: 'fra Finnmark', prefiks: 'over ' },
            { verdi: 12000, etikett: 'fra Nord-Troms', prefiks: 'drøyt ' },
        ],
    ],
    tromso: [
        [{ verdi: 30000, etikett: 'gjennom Tromsø', prefiks: 'over ' }],
        undefined,
        [{ verdi: 18000, etikett: 'til Sør-Norge', prefiks: 'ca. ' }],
    ],
};

export function FinnmarkKart({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'retrett';
    const { geographies } = useAtlasWorld();
    const hele = modus === 'tromso';

    // Satt for hånd: utsnittet skal fylle venstre del av bildet, kortene står til høyre.
    const projeksjon = useMemo(
        () =>
            hele
                ? geoMercator().center([18, 65.7]).scale(1394).translate([500, 450])
                : geoMercator().center([24.25, 69.1]).scale(3150).translate([500, 450]),
        [hele]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const poly = (pts: LngLat[]) => pts.map((ll) => p(ll).join(',')).join(' ');
    const linje = (pts: LngLat[]) => 'M ' + pts.map((ll) => p(ll).join(' ')).join(' L ');

    const norge = useMemo(
        () => geographies.find((g) => String((g as { id?: unknown }).id) === NORGE_ID),
        [geographies]
    );
    const kort = KORT[modus][Math.min(beat, KORT[modus].length - 1)] ?? [];
    const tall = TALL[modus]?.[beat];

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="finnmark-norge">
                        {norge && <path d={sti(norge as never) ?? ''} />}
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} />

                <g clipPath="url(#finnmark-norge)">
                    {/* Mellom to hærer */}
                    <Felt pts={poly(MELLOM)} farge="#f59e0b" vis={modus === 'sovjet' && beat >= 4} />
                    <Felt
                        pts={poly(MELLOM)}
                        farge="#15803d"
                        vis={modus === 'ordre' && beat === 1}
                        styrke={0.35}
                    />
                    {/* Alt øst for Lyngen */}
                    <Felt pts={poly(OST_FOR_LYNGEN)} farge={SOVJET} vis={modus === 'ordre' && beat >= 4} />
                    <Felt
                        pts={poly(OST_FOR_LYNGEN)}
                        farge={ILD}
                        vis={modus === 'omfang' && beat === 0}
                        styrke={0.35}
                    />
                    {/* Hvor mye som ble ødelagt */}
                    <Felt
                        pts={poly(FINNMARK_VEST)}
                        farge="#7c2d12"
                        vis={modus === 'omfang' && beat >= 1}
                        styrke={0.75}
                    />
                    <Felt
                        pts={poly(NORD_TROMS)}
                        farge={ILD}
                        vis={modus === 'omfang' && beat >= 2}
                        styrke={0.5}
                    />
                    <Felt
                        pts={poly(NORDLAND_TROMS)}
                        farge="#0d9488"
                        vis={modus === 'tromso' && beat >= 1}
                    />
                </g>

                {!hele && (
                    <>
                        <Navn ll={[27.4, 67.0]} tekst="FINLAND" p={p} />
                        <Navn ll={[19.0, 67.0]} tekst="SVERIGE" p={p} />
                        <Navn ll={[29.6, 67.5]} tekst="SOVJETUNIONEN" p={p} />
                        <Navn ll={[18.2, 68.1]} tekst="NORGE" p={p} />
                        <Navn ll={[24.8, 70.0]} tekst="FINNMARK" p={p} farge="#7c2d12" />
                    </>
                )}
                {hele && (
                    <>
                        <Navn ll={[9.2, 61.6]} tekst="NORGE" p={p} />
                        <Navn ll={[15.6, 63.0]} tekst="SVERIGE" p={p} />
                    </>
                )}

                {/* Den tyske hæren på retrett */}
                {modus === 'retrett' &&
                    beat >= 1 &&
                    RETRETT.map((r, i) => (
                        <Pil key={i} d={linje(r)} farge={TYSK} forsinkelse={i * 0.5} />
                    ))}
                {(modus === 'retrett' ? beat >= 2 : modus !== 'tromso' && modus !== 'sorover') && (
                    <Grenselinje d={linje(LYNGENLINJA)} farge={TYSK} />
                )}
                {(modus === 'retrett' ? beat >= 2 : modus === 'ordre' ? beat >= 4 : !hele && modus !== 'sorover') && (
                    <Merke ll={STED.lyngen} tekst="Lyngen" p={p} farge={TYSK} venstre />
                )}

                {/* Den sovjetiske hæren */}
                {modus === 'sovjet' && <Pil d={linje(SOVJET_INN)} farge={SOVJET} />}
                {modus === 'sovjet' && beat >= 2 && <Pil d={linje(SOVJET_VEST)} farge={SOVJET} />}
                {modus === 'sovjet' && beat >= 2 && <Grenselinje d={linje(TANA)} farge={SOVJET} />}
                {modus === 'sovjet' && beat >= 1 && (
                    <Merke ll={STED.kirkenes} tekst="Kirkenes" p={p} farge={SOVJET} under />
                )}
                {modus === 'sovjet' && beat >= 2 && (
                    <Merke ll={STED.tana} tekst="Tana" p={p} farge={SOVJET} />
                )}
                {modus === 'sovjet' && beat === 3 && (
                    <Merke ll={[31.8, 69.9]} tekst="Norske soldater" p={p} farge={NORSK} />
                )}

                {/* Ordren */}
                {modus === 'ordre' && beat === 0 && <Pil d={linje(FRIVILLIG)} farge={TYSK} />}
                {modus === 'ordre' && (beat === 2 || beat === 3) && (
                    <Merke ll={STED.tromso} tekst="Troms" p={p} farge={TYSK} under />
                )}
                {modus === 'ordre' && beat >= 4 && (
                    <motion.text
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        x={p([25.5, 69.2])[0]}
                        y={p([25.5, 69.2])[1]}
                        textAnchor="middle"
                        fontSize={42}
                        fontWeight={900}
                        fill="#ffffff"
                        stroke="#1f2937"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        ØST FOR LYNGEN
                    </motion.text>
                )}

                {/* Omfang */}
                {modus === 'omfang' && beat >= 3 && (
                    <Merke ll={STED.vardo} tekst="Vardø" p={p} farge="#7c2d12" under stor />
                )}

                {/* Reisen sørover */}
                {modus === 'sorover' && beat >= 1 && <Baater d={linje(KYSTEN)} />}
                {modus === 'sorover' && (
                    <Merke ll={STED.tromso} tekst="Tromsø" p={p} farge={NORSK} under />
                )}
                {modus === 'tromso' && (
                    <Merke ll={STED.tromso} tekst="Tromsø" p={p} farge={NORSK} venstre />
                )}
                {modus === 'tromso' && beat >= 2 && <Pil d={linje(SORLANDET)} farge={NORSK} varighet={3} />}
                {modus === 'tromso' && beat >= 2 && (
                    <Merke ll={STED.oslo} tekst="Østlandet" p={p} farge={NORSK} under />
                )}
            </svg>

            {/* Forklaringer til høyre */}
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
                                    forsinkelse={0.8 + i * 0.6}
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

function Felt({
    pts,
    farge,
    vis,
    styrke = 0.6,
}: {
    pts: string;
    farge: string;
    vis: boolean;
    styrke?: number;
}) {
    return (
        <motion.polygon
            points={pts}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? styrke : 0 }}
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
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={30}
            fontWeight={900}
            letterSpacing={5}
            fill={farge}
            opacity={0.75}
        >
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
    stor,
}: {
    ll: LngLat;
    tekst: string;
    p: (ll: LngLat) => [number, number];
    farge: string;
    under?: boolean;
    venstre?: boolean;
    stor?: boolean;
}) {
    const [x, y] = p(ll);
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <circle cx={x} cy={y} r={stor ? 20 : 13} fill={farge} stroke="#ffffff" strokeWidth={4} />
            <text
                x={venstre ? x - 26 : x}
                y={venstre ? y + 11 : under ? y + 52 : y - 26}
                textAnchor={venstre ? 'end' : 'middle'}
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
function Pil({
    d,
    farge,
    forsinkelse = 0,
    varighet = 2.2,
}: {
    d: string;
    farge: string;
    forsinkelse?: number;
    varighet?: number;
}) {
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
                transition={{ duration: varighet, delay: forsinkelse, ease: 'easeInOut' }}
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
                transition={{ duration: varighet, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <Spiss d={d} farge={farge} forsinkelse={forsinkelse + varighet} />
        </g>
    );
}

/** Pilspissen settes på enden av stien, retning fra nest siste punkt. */
function Spiss({ d, farge, forsinkelse }: { d: string; farge: string; forsinkelse: number }) {
    const tall = d.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    if (tall.length < 4) return null;
    const [x1, y1, x2, y2] = tall.slice(-4);
    const vinkel = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse - 0.2 }}
        >
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

function Grenselinje({ d, farge }: { d: string; farge: string }) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={10}
            strokeDasharray="4 14"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
    );
}

/** Små båter som går langs kysten mot Tromsø, om og om igjen. */
function Baater({ d }: { d: string }) {
    return (
        <g>
            <path d={d} fill="none" stroke={NORSK} strokeWidth={4} strokeDasharray="10 12" opacity={0.6} />
            {Array.from({ length: 7 }, (_, i) => (
                <g key={i}>
                    <path d="M -16 -6 L 16 -6 L 10 8 L -10 8 Z" fill={i % 3 === 0 ? TYSK : NORSK} stroke="#ffffff" strokeWidth={3}>
                        <animateMotion
                            path={d}
                            dur="9s"
                            begin={`-${i * 1.3}s`}
                            repeatCount="indefinite"
                            rotate="auto"
                        />
                    </path>
                </g>
            ))}
        </g>
    );
}
