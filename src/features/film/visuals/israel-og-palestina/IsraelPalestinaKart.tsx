import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoContains, geoMercator, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useAtlasWorld } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';

/**
 * Kartet over Israel og Palestina, i seks modus:
 * «herzl»: Europa, Argentina, Uganda og til slutt det gamle landet ved Middelhavet.
 * «balfour»: brevet fra London i 1917.
 * «mandat»: britisk styre 1920-1948 og innvandringen fra Europa.
 * «deling»: FNs plan fra 1947. Grensene tegnes ikke, bare de to statene og Jerusalem.
 * «1948»: staten Israel, angrepet fra fem land, Gaza til Egypt og Vestbredden til Jordan.
 * «idag»: Vestbredden med bosetninger, Gaza under Hamas og blokaden.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'herzl' | 'balfour' | 'mandat' | 'deling' | '1948' | 'idag';

const ISRAEL = 376;
const PALESTINA = 275;
const EGYPT = 818;
const JORDAN = 400;
const SYRIA = 760;
const IRAK = 368;
const LIBANON = 422;
const STORBRITANNIA = 826;
const ARGENTINA = 32;
const UGANDA = 800;
const EUROPA = [
    250, 276, 826, 616, 380, 724, 40, 348, 203, 642, 100, 804, 112, 440, 428, 233, 56, 528, 756,
    300, 208, 752, 578, 246, 620, 703, 705, 191, 688, 70, 807, 8, 498, 372, 442, 499,
];
const MANDATET = [ISRAEL, PALESTINA];

const STED = {
    london: [-0.1, 51.5] as LngLat,
    wien: [16.4, 48.2] as LngLat,
    jerusalem: [35.22, 31.78] as LngLat,
    landet: [35.0, 31.6] as LngLat,
    argentina: [-64, -34] as LngLat,
    uganda: [32.4, 1.4] as LngLat,
};

/** Gazastripen, grovt tegnet. Den er for liten til å finnes i verdenskartet. */
const GAZA: LngLat[] = [
    [34.2, 31.32],
    [34.49, 31.6],
    [34.57, 31.54],
    [34.27, 31.22],
];

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    europa: '#cbd5e1',
    jodisk: '#2563eb',
    jodiskLys: '#93c5fd',
    palestinsk: '#0f766e',
    palestinskLys: '#5eead4',
    britisk: '#b91c1c',
    britiskLys: '#fca5a5',
    egypt: '#d97706',
    jordan: '#65a30d',
    angrep: '#7c2d12',
    mandat: '#a8a29e',
    bosetning: '#1d4ed8',
    merket: '#f59e0b',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const utsnitt = (a: LngLat, b: LngLat) =>
        geoMercator().fitExtent(
            [
                [80, 150],
                [B - 80, H - 60],
            ],
            { type: 'MultiPoint', coordinates: [a, b] } as never
        );
    switch (modus) {
        case 'herzl':
            return utsnitt([-72, -40], [52, 60]);
        case 'balfour':
            return utsnitt([-10, 22], [50, 56]);
        case 'mandat':
            return utsnitt([4, 27], [46, 52]);
        case 'deling':
            return utsnitt([32.2, 29.4], [37.8, 33.4]);
        case '1948':
            return utsnitt([28.5, 27.5], [45, 36.8]);
        case 'idag':
            return utsnitt([33.2, 30.9], [36.6, 33.0]);
    }
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    switch (modus) {
        case 'herzl':
            if (beat <= 2 && EUROPA.includes(id)) return '#a5b4fc';
            if (beat === 3 && (id === ARGENTINA || id === UGANDA)) return FARGE.merket;
            if (beat >= 4 && MANDATET.includes(id)) return FARGE.merket;
            return FARGE.land;
        case 'balfour':
            if (id === STORBRITANNIA) return FARGE.britisk;
            if (beat === 0 && [EGYPT, IRAK, ...MANDATET, JORDAN].includes(id))
                return FARGE.britiskLys;
            if (beat >= 2 && MANDATET.includes(id)) return FARGE.jodiskLys;
            return FARGE.land;
        case 'mandat':
            if (MANDATET.includes(id)) return FARGE.britisk;
            if (id === STORBRITANNIA) return FARGE.britiskLys;
            if (beat >= 1 && EUROPA.includes(id)) return FARGE.europa;
            return FARGE.land;
        case 'deling':
            if (MANDATET.includes(id)) return beat === 0 ? FARGE.mandat : '#d6d3d1';
            return FARGE.land;
        case '1948':
            if (id === ISRAEL) return beat >= 3 ? FARGE.jodisk : FARGE.jodiskLys;
            if (id === PALESTINA) return beat >= 4 ? FARGE.jordan : '#e7e5e4';
            if (beat >= 1 && beat <= 2 && [EGYPT, JORDAN, SYRIA, IRAK, LIBANON].includes(id))
                return '#fed7aa';
            return FARGE.land;
        case 'idag':
            if (id === ISRAEL) return FARGE.jodiskLys;
            if (id === PALESTINA) return FARGE.palestinskLys;
            return FARGE.land;
    }
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    herzl: [
        { tekst: 'Europa, slutten av 1800-tallet' },
        { tekst: 'Jøder: et forfulgt mindretall' },
        { tekst: 'Sionismen: en egen jødisk stat' },
        { tekst: 'Argentina? Uganda?' },
        { tekst: 'Israel, eller Palestina' },
        { tekst: 'Men folk bodde der allerede', rod: true },
    ],
    balfour: [
        { tekst: 'Britene styrer store deler av Midtøsten' },
        { tekst: '1917: Brev fra Balfour til Rothschild' },
        { tekst: 'Et nasjonalt hjem for jøder' },
        { tekst: 'Uten å skade dem som bor der' },
        { tekst: 'Palestinerne ble ikke spurt', rod: true },
    ],
    mandat: [
        { tekst: '1920-1948: Britisk mandat' },
        { tekst: 'Hundretusener av jøder kommer' },
        { tekst: 'Araberne blir urolige' },
        { tekst: 'Opprør og angrep fra begge sider', rod: true },
    ],
    deling: [
        { tekst: '1947: FN bestemmer' },
        { tekst: 'To stater og en internasjonal by' },
        { tekst: 'Jødene sier ja' },
        { tekst: 'Palestinerne sier nei', rod: true },
        { tekst: 'Halvparten av landet?' },
    ],
    '1948': [
        { tekst: '14. mai 1948: Staten Israel' },
        { tekst: 'Dagen etter: fem land angriper', rod: true },
        { tekst: 'Løftet: knuse den nye staten' },
        { tekst: 'Israel vinner krigen' },
        { tekst: 'Gaza til Egypt, Vestbredden til Jordan' },
    ],
    idag: [
        { tekst: 'I dag' },
        { tekst: 'Vestbredden: delt kontroll' },
        { tekst: 'Over 700 000 bosettere', rod: true },
        { tekst: 'Gaza: Hamas styrer siden 2007' },
        { tekst: 'Grensene rundt Gaza er stengt', rod: true },
    ],
};

/** Faste «tilfeldige» tall, så bosetningene ligger på samme sted hver gang. */
function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

export function IsraelPalestinaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'herzl';
    const { geographies: verden } = useAtlasWorld();
    // Fransk Guyana ligger i samme geometri som Frankrike. Ta den bort, så bare Europa farges.
    const geographies = useMemo(
        () =>
            verden.map((g) => {
                const geo = (g as { geometry?: { type: string; coordinates: number[][][][] } })
                    .geometry;
                if (Number(g.id) !== 250 || geo?.type !== 'MultiPolygon') return g;
                return {
                    ...g,
                    geometry: {
                        ...geo,
                        coordinates: geo.coordinates.filter((poly) => poly[0][0][0] > -20),
                    },
                } as typeof g;
            }),
        [verden]
    );
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikker = BRIKKER[modus];
    const brikke = brikker[Math.min(beat, brikker.length - 1)];

    const vestbredden = useMemo(
        () => geographies.find((g) => Number(g.id) === PALESTINA),
        [geographies]
    );
    const bosetninger = useMemo(() => {
        if (!vestbredden) return [] as LngLat[];
        const ut: LngLat[] = [];
        for (let i = 0; ut.length < 70 && i < 2000; i++) {
            const ll: LngLat = [34.9 + frø(i) * 0.7, 31.3 + frø(i + 999) * 1.3];
            if (geoContains(vestbredden as never, ll)) ut.push(ll);
        }
        return ut;
    }, [vestbredden]);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'herzl' && (
                    <>
                        <Etikett pos={p([14, 53])} tekst="Europa" farge="#1e293b" />
                        {beat === 1 && (
                            <Etikett
                                pos={p([16, 43.5])}
                                tekst="Jøder: et mindretall"
                                farge="#4338ca"
                                forsinkelse={0.3}
                            />
                        )}
                        {beat === 2 && (
                            <Etikett
                                pos={p([16, 43.5])}
                                tekst="En egen stat?"
                                farge="#4338ca"
                                stor
                                forsinkelse={0.3}
                            />
                        )}
                        {beat === 3 && (
                            <>
                                <Pil
                                    fra={p(STED.wien)}
                                    til={p(STED.argentina)}
                                    farge="#92400e"
                                    bue={0.12}
                                />
                                <Pil
                                    fra={p(STED.wien)}
                                    til={p(STED.uganda)}
                                    farge="#92400e"
                                    bue={0.15}
                                    forsinkelse={0.6}
                                />
                                <Etikett
                                    pos={p([-64, -45])}
                                    tekst="Argentina?"
                                    farge="#92400e"
                                    forsinkelse={1.2}
                                />
                                <Etikett
                                    pos={p([42, -4])}
                                    tekst="Uganda?"
                                    farge="#92400e"
                                    forsinkelse={1.6}
                                />
                            </>
                        )}
                        {beat >= 4 && (
                            <>
                                <Pil
                                    fra={p(STED.wien)}
                                    til={p(STED.landet)}
                                    farge="#92400e"
                                    bue={0.15}
                                />
                                <Puls pos={p(STED.landet)} farge={FARGE.merket} />
                                <Etikett
                                    pos={p([12, 26])}
                                    tekst={
                                        beat === 4
                                            ? 'Israel / Palestina'
                                            : '500 000 arabiske palestinere'
                                    }
                                    farge={beat === 4 ? '#92400e' : FARGE.palestinsk}
                                    stor={beat === 4}
                                    forsinkelse={0.6}
                                    linjeTil={p(STED.landet)}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'balfour' && (
                    <>
                        <Etikett pos={p([-1, 47.5])} tekst="London" farge={FARGE.britisk} />
                        {beat === 0 && (
                            <Etikett
                                pos={p([36, 26])}
                                tekst="Britisk makt"
                                farge={FARGE.britisk}
                                stor
                            />
                        )}
                        {beat === 1 && <Brev fra={p(STED.london)} til={p(STED.jerusalem)} />}
                        {beat >= 2 && (
                            <Etikett
                                pos={p([27, 29])}
                                tekst="Et hjem for jøder"
                                farge={FARGE.jodisk}
                                linjeTil={p(STED.landet)}
                                forsinkelse={0.3}
                            />
                        )}
                        {beat === 3 && (
                            <Etikett
                                pos={p([42, 24.5])}
                                tekst="Men ikke skade dem som bor der"
                                farge={FARGE.palestinsk}
                                forsinkelse={0.3}
                            />
                        )}
                        {beat >= 4 && (
                            <Etikett
                                pos={p([42, 24.5])}
                                tekst="Palestinerne: ikke spurt"
                                farge={FARGE.britisk}
                                stor
                                forsinkelse={0.3}
                            />
                        )}
                    </>
                )}

                {modus === 'mandat' && (
                    <>
                        <Etikett
                            pos={p([39, 30])}
                            tekst="Britisk mandat"
                            farge={FARGE.britisk}
                            linjeTil={p(STED.landet)}
                        />
                        {beat >= 1 &&
                            (
                                [
                                    [21, 52],
                                    [19, 47.5],
                                    [12, 51],
                                    [26, 45],
                                    [24, 54],
                                ] as LngLat[]
                            ).map((fra, i) => (
                                <Pil
                                    key={i}
                                    fra={p(fra)}
                                    til={p(STED.landet)}
                                    farge={FARGE.jodisk}
                                    bue={0.08 + i * 0.03}
                                    forsinkelse={i * 0.35}
                                />
                            ))}
                        {beat === 1 && (
                            <Etikett
                                pos={p([10, 41])}
                                tekst="Hundretusener kommer"
                                farge={FARGE.jodisk}
                                forsinkelse={1.6}
                            />
                        )}
                        {beat >= 2 && (
                            <Etikett
                                pos={p([10, 34])}
                                tekst="Araberne frykter å bli presset ut"
                                farge={FARGE.palestinsk}
                                forsinkelse={0.3}
                            />
                        )}
                        {beat >= 3 && <Puls pos={p(STED.landet)} farge={FARGE.britisk} />}
                    </>
                )}

                {modus === 'deling' && (
                    <>
                        <Etikett pos={p([33.3, 32.6])} tekst="Middelhavet" farge="#0369a1" />
                        {beat === 0 && (
                            <Etikett pos={p([35.1, 30.5])} tekst="Palestina" farge="#44403c" stor />
                        )}
                        {beat >= 1 && (
                            <>
                                <Puls pos={p(STED.jerusalem)} farge="#0ea5e9" />
                                <circle
                                    cx={p(STED.jerusalem)[0]}
                                    cy={p(STED.jerusalem)[1]}
                                    r={26}
                                    fill="#ffffff"
                                    stroke="#0369a1"
                                    strokeWidth={8}
                                />
                                <Etikett
                                    pos={p([33.4, 31.4])}
                                    tekst="Jerusalem: FN"
                                    farge="#0369a1"
                                    linjeTil={p(STED.jerusalem)}
                                />
                            </>
                        )}
                        {beat >= 4 && (
                            <Etikett
                                pos={p([35.0, 30.3])}
                                tekst="Halvparten?"
                                farge="#7c2d12"
                                stor
                            />
                        )}
                    </>
                )}

                {modus === '1948' && (
                    <>
                        <Etikett
                            pos={p([31.4, 33.2])}
                            tekst="Israel"
                            farge={FARGE.jodisk}
                            stor
                            linjeTil={p([34.9, 32.1])}
                        />
                        {beat >= 1 && beat <= 2 && (
                            <>
                                {(
                                    [
                                        [[31, 30], 'Egypt'],
                                        [[36.8, 30.4], 'Jordan'],
                                        [[37.6, 34.6], 'Syria'],
                                        [[42.5, 32.8], 'Irak'],
                                        [[36.2, 34.1], 'Libanon'],
                                    ] as [LngLat, string][]
                                ).map(([ll, navn], i) => (
                                    <g key={navn}>
                                        <Pil
                                            fra={p(ll)}
                                            til={p([35.05, 31.7])}
                                            farge={FARGE.angrep}
                                            bue={0.06}
                                            forsinkelse={i * 0.3}
                                        />
                                        <Etikett
                                            pos={p(ll)}
                                            tekst={navn}
                                            farge={FARGE.angrep}
                                            forsinkelse={i * 0.3}
                                        />
                                    </g>
                                ))}
                            </>
                        )}
                        {beat === 3 && (
                            <Etikett
                                pos={p([39.5, 30])}
                                tekst="Mer land enn FN-planen"
                                farge={FARGE.jodisk}
                                forsinkelse={0.3}
                            />
                        )}
                        {beat >= 4 && (
                            <>
                                <Omrade sti={sti} ring={GAZA} farge={FARGE.egypt} />
                                <Etikett
                                    pos={p([31.4, 30.4])}
                                    tekst="Gaza: Egypt"
                                    farge={FARGE.egypt}
                                    linjeTil={p([34.38, 31.42])}
                                />
                                <Etikett
                                    pos={p([39.2, 32.4])}
                                    tekst="Vestbredden: Jordan"
                                    farge={FARGE.jordan}
                                    forsinkelse={0.5}
                                    linjeTil={p([35.3, 32])}
                                />
                            </>
                        )}
                    </>
                )}

                {modus === 'idag' && (
                    <>
                        <Omrade sti={sti} ring={GAZA} farge={FARGE.palestinsk} />
                        <Etikett pos={p([33.75, 32.6])} tekst="Middelhavet" farge="#0369a1" />
                        <Etikett pos={p([34.5, 30.95])} tekst="Israel" farge={FARGE.jodisk} />
                        {beat !== 3 && beat !== 4 && (
                            <Etikett
                                pos={p([36.05, 32.75])}
                                tekst="Vestbredden"
                                farge={FARGE.palestinsk}
                                linjeTil={p([35.3, 32.1])}
                            />
                        )}
                        {(beat === 0 || beat >= 3) && (
                            <Etikett
                                pos={p([33.75, 31.15])}
                                tekst={beat >= 3 ? 'Gaza: Hamas' : 'Gaza'}
                                farge={FARGE.palestinsk}
                                linjeTil={p([34.38, 31.42])}
                            />
                        )}
                        {beat === 1 && vestbredden && (
                            <>
                                <defs>
                                    <pattern
                                        id="ip-striper"
                                        width={34}
                                        height={34}
                                        patternUnits="userSpaceOnUse"
                                        patternTransform="rotate(45)"
                                    >
                                        <rect width={17} height={34} fill={FARGE.jodiskLys} />
                                    </pattern>
                                </defs>
                                <motion.path
                                    d={sti(vestbredden as never) ?? ''}
                                    fill="url(#ip-striper)"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0.9 }}
                                    transition={{ duration: 1 }}
                                />
                                <Etikett
                                    pos={p([36.05, 31.5])}
                                    tekst="Palestinsk selvstyre"
                                    farge={FARGE.palestinsk}
                                    forsinkelse={0.4}
                                />
                                <Etikett
                                    pos={p([36.05, 31.2])}
                                    tekst="+ israelsk kontroll"
                                    farge={FARGE.jodisk}
                                    forsinkelse={1}
                                />
                            </>
                        )}
                        {beat >= 2 &&
                            bosetninger.map((ll, i) => {
                                const [x, y] = p(ll);
                                return (
                                    <motion.rect
                                        key={i}
                                        x={x - 7}
                                        y={y - 7}
                                        width={14}
                                        height={14}
                                        fill={FARGE.bosetning}
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: beat === 2 ? i * 0.05 : 0 }}
                                        style={{ transformOrigin: `${x}px ${y}px` }}
                                    />
                                );
                            })}
                        {beat === 2 && (
                            <Etikett
                                pos={p([36.1, 31.3])}
                                tekst="Bosetninger"
                                farge={FARGE.bosetning}
                                forsinkelse={1.5}
                            />
                        )}
                        {beat >= 4 && (
                            <motion.path
                                d={
                                    sti({
                                        type: 'Polygon',
                                        coordinates: [[...GAZA, GAZA[0]]],
                                    } as never) ?? ''
                                }
                                fill="none"
                                stroke="#111827"
                                strokeWidth={12}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.8 }}
                            />
                        )}
                        {beat >= 4 && (
                            <Etikett
                                pos={p([33.75, 31.55])}
                                tekst="Stengt"
                                farge="#111827"
                                stor
                                forsinkelse={1.6}
                            />
                        )}
                    </>
                )}
            </svg>

            <div className="absolute left-8 top-16 max-w-[56%]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${modus}-${brikke.tekst}`}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.4 }}
                        className={`px-6 py-3 rounded-2xl shadow-xl text-3xl font-black ${
                            brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                        }`}
                    >
                        {brikke.tekst}
                    </motion.div>
                </AnimatePresence>
            </div>

            {modus === 'deling' && beat >= 1 && (
                <div className="absolute right-8 top-16 flex flex-col gap-4 w-[25rem]">
                    <Statskort
                        tittel="Én jødisk stat"
                        farge={FARGE.jodisk}
                        svar={beat >= 2 ? 'JA' : undefined}
                    />
                    <Statskort
                        tittel="Én arabisk stat"
                        farge={FARGE.palestinsk}
                        svar={beat >= 3 ? 'NEI' : undefined}
                    />
                </div>
            )}
        </div>
    );
}

function Statskort({ tittel, farge, svar }: { tittel: string; farge: string; svar?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between rounded-2xl bg-white/95 shadow-xl px-6 py-4"
            style={{ borderLeft: `14px solid ${farge}` }}
        >
            <span className="text-3xl font-black text-slate-900">{tittel}</span>
            {svar && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className={`text-3xl font-black px-3 py-1 rounded-xl text-white ${
                        svar === 'JA' ? 'bg-teal-600' : 'bg-red-700'
                    }`}
                >
                    {svar}
                </motion.span>
            )}
        </motion.div>
    );
}

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
    forsinkelse = 0,
    linjeTil,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    forsinkelse?: number;
    /** Tegner en tynn strek fra etiketten til et punkt, for små områder. */
    linjeTil?: [number, number];
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
        >
            {linjeTil && (
                <>
                    <line
                        x1={pos[0]}
                        y1={pos[1]}
                        x2={linjeTil[0]}
                        y2={linjeTil[1]}
                        stroke="#1f2937"
                        strokeWidth={4}
                    />
                    <circle cx={linjeTil[0]} cy={linjeTil[1]} r={8} fill="#1f2937" />
                </>
            )}
            <text
                x={pos[0]}
                y={pos[1]}
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
            </text>
        </motion.g>
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
                transition={{ duration: 1.4, delay: forsinkelse, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -22 -14 L 6 0 L -22 14 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: forsinkelse + 1.3 }}
            />
        </g>
    );
}

/** En stiplet rute med en konvolutt som reiser langs den. */
function Brev({ fra, til }: { fra: [number, number]; til: [number, number] }) {
    const mx = (fra[0] + til[0]) / 2 + (til[1] - fra[1]) * 0.2;
    const my = (fra[1] + til[1]) / 2 - (til[0] - fra[0]) * 0.2;
    const d = `M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`;
    return (
        <g>
            <motion.path
                d={d}
                fill="none"
                stroke="#334155"
                strokeWidth={5}
                strokeDasharray="14 12"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            <g
                style={
                    {
                        offsetPath: `path('${d}')`,
                        animation: 'israel-palestina-brev 2.2s ease-in-out forwards',
                    } as never
                }
            >
                <rect
                    x={-34}
                    y={-22}
                    width={68}
                    height={44}
                    rx={4}
                    fill="#fffbeb"
                    stroke="#78350f"
                    strokeWidth={4}
                />
                <path d="M -34 -22 L 0 6 L 34 -22" fill="none" stroke="#78350f" strokeWidth={4} />
            </g>
            <style>{`@keyframes israel-palestina-brev { from { offset-distance: 0%; } to { offset-distance: 100%; } }`}</style>
        </g>
    );
}

function Omrade({ sti, ring, farge }: { sti: GeoPath; ring: LngLat[]; farge: string }) {
    const d = sti({ type: 'Polygon', coordinates: [[...ring, ring[0]]] } as never) ?? '';
    return (
        <motion.path
            d={d}
            fill={farge}
            stroke={farge}
            strokeWidth={3}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
        />
    );
}

function Puls({ pos, farge }: { pos: [number, number]; farge: string }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            fill="none"
            stroke={farge}
            strokeWidth={8}
            initial={{ r: 30, opacity: 0.9 }}
            animate={{ r: 180, opacity: 0 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
    );
}
