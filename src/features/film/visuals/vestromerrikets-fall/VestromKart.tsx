import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Europa og Middelhavet i årene da Vestromerriket falt.
 * - huner: hunerne kommer fra steppene, germanske folk presses mot riket (rundt 370)
 * - alarik: visigoterne tar Roma i 410, sjokket når Hieronymus i Betlehem
 * - attila: Attila herjer i øst, stanses i 451, snur i Nord-Italia året etter
 * - vandaler: vandalene tar Nord-Afrika og kornet, så øyene, så Roma (455)
 * Riket er tegnet med dagens grenser og er omtrentlig.
 */

type Modus = 'huner' | 'alarik' | 'attila' | 'vandaler';
type LngLat = [number, number];
type Pkt = [number, number];

const B = 1600;
const H = 900;

const ROD = '#b91c1c';
const HUN = '#9a3412';
const GERMAN = '#1d4ed8';
const GOT = '#0f766e';
const VANDAL = '#7e22ce';
const GULL = '#ca8a04';

const ROMA: LngLat = [12.5, 41.9];
const BETLEHEM: LngLat = [35.2, 31.7];
const KARTAGO: LngLat = [10.3, 36.85];
const PANNONIA: LngLat = [19.5, 47.2];
const CHALONS: LngLat = [4.4, 48.95];

/** Landene som lå i Vestromerriket og Østromerriket, omtrentlig og med dagens grenser. */
const VEST = [
    '380',
    '250',
    '724',
    '620',
    '056',
    '756',
    '040',
    '705',
    '191',
    '442',
    '070',
    '504',
    '012',
    '788',
    '434',
];
const OST = [
    '300',
    '100',
    '688',
    '499',
    '008',
    '807',
    '792',
    '196',
    '760',
    '422',
    '376',
    '275',
    '400',
    '818',
    '499',
];
const AFRIKA = ['504', '012', '788', '434', '818'];
/** Vandalenes rike: kysten fra Marokko til det vestlige Libya. */
const VANDALRIKE = ['504', '012', '788', '434'];

/** Grensa langs elvene i nord, forenklet. */
const GRENSE: LngLat[] = [
    [4.5, 51.8],
    [6.9, 50.9],
    [8.3, 49.9],
    [8.6, 48.3],
    [12.1, 48.9],
    [16.4, 48.2],
    [19, 47.6],
    [19.2, 45],
    [22.5, 44.6],
    [28, 45.2],
    [29.6, 45.3],
];

function overskrift(modus: Modus, beat: number) {
    const t: Record<Modus, string[]> = {
        huner: [
            'Rundt år 370',
            'Hunerne kommer fra steppene',
            'En kjedereaksjon',
            'På flukt, eller på jakt etter land',
            'En årsak til folkevandringene',
        ],
        alarik: [
            'Visigoterne og kong Alarik',
            'År 410: Roma blir tatt',
            'Sjokket sprer seg',
            'Hieronymus i Betlehem',
            'Et brev han nesten ikke klarer',
            'Byen som tok verden',
        ],
        attila: [
            'Attila samler en enorm hær',
            'Guds svøpe',
            'Først øst, så vest',
            'År 451: hunerne stanses',
            'Gamle fiender sammen',
            'Året etter: Attila snur',
        ],
        vandaler: [
            'Vandalene',
            'Over Gibraltarstredet',
            'Nord-Afrika og Kartago',
            'Mye av skatten kom som korn',
            'Korn og penger borte',
            'År 455: øyene og Roma',
        ],
    };
    const liste = t[modus];
    return liste[Math.min(beat, liste.length - 1)];
}

/** Utsnitt per modus. Boksen er litt bredere enn 16:9, så ingenting viktig kuttes i høyden. */
const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    huner: [
        [-8, 33],
        [52, 56],
    ],
    alarik: [
        [-6, 30],
        [42, 50],
    ],
    attila: [
        [-8, 37],
        [38, 54],
    ],
    vandaler: [
        [-12, 30],
        [24, 46],
    ],
};

export function VestromKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'huner';
    const { geographies } = useFilmVerden();

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [0, 0],
                    [B, H],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as Pkt;
    const land = (ids: string[]) =>
        geographies.filter((g) => ids.includes(String((g as { id?: unknown }).id)));

    // Afrika klippes til kysten, så riket ikke ser ut til å gå langt inn i Sahara.
    const kystY = p([0, 31])[1];
    const vestLibyaX = p([19, 0])[0];

    const vandalFarget = modus === 'vandaler' && beat >= 2;
    const vandalOyer = modus === 'vandaler' && beat >= 5;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cfe3ef' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="vestrom-kyst">
                        <rect x={0} y={0} width={B} height={kystY} />
                    </clipPath>
                    <clipPath id="vestrom-vandalrike">
                        <rect x={0} y={0} width={vestLibyaX} height={kystY} />
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} />
                <Rike geographies={land(VEST)} sti={sti} farge="#fbd7b0" afrikaKlipp />
                <Rike geographies={land(OST)} sti={sti} farge="#dcd3f0" afrikaKlipp />
                {vandalFarget && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                    >
                        <g clipPath="url(#vestrom-vandalrike)">
                            {land(VANDALRIKE).map((g, i) => (
                                <path
                                    key={i}
                                    d={sti(g as never) ?? ''}
                                    fill={VANDAL}
                                    fillOpacity={0.55}
                                    stroke="#ffffff"
                                    strokeWidth={1.5}
                                />
                            ))}
                        </g>
                    </motion.g>
                )}

                {modus === 'huner' && <Huner beat={beat} p={p} />}
                {modus === 'alarik' && <Alarik beat={beat} p={p} />}
                {modus === 'attila' && <Attila beat={beat} p={p} />}
                {modus === 'vandaler' && <Vandaler beat={beat} p={p} oyer={vandalOyer} />}

                <text
                    x={B - 24}
                    y={H - 22}
                    textAnchor="end"
                    fontSize={26}
                    fontWeight={700}
                    fill="#475569"
                >
                    Omtrentlig, med dagens grenser
                </text>
            </svg>

            {!(modus === 'alarik' && beat >= 5) && <Legende modus={modus} />}
            <Topp tekst={overskrift(modus, beat)} />
        </div>
    );
}

function Legende({ modus }: { modus: Modus }) {
    if (modus === 'vandaler') return null;
    return (
        <div
            className="absolute rounded-2xl bg-white/90 shadow-lg px-4 py-3 text-xl font-semibold text-slate-800 flex flex-col gap-1.5"
            style={{ left: '2%', bottom: '4%' }}
        >
            <div className="flex items-center gap-3">
                <span
                    className="inline-block rounded"
                    style={{ width: 28, height: 20, background: '#fbd7b0' }}
                />
                Vestromerriket
            </div>
            <div className="flex items-center gap-3">
                <span
                    className="inline-block rounded"
                    style={{ width: 28, height: 20, background: '#dcd3f0' }}
                />
                Østromerriket
            </div>
        </div>
    );
}

function Topp({ tekst }: { tekst: string }) {
    return (
        <div className="absolute top-[5%] inset-x-0 flex justify-center pointer-events-none z-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="px-6 py-2 rounded-2xl font-display font-bold text-4xl shadow-xl whitespace-nowrap bg-white/92 text-slate-900"
                >
                    {tekst}
                </motion.div>
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
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

const Rike = memo(function Rike({
    geographies,
    sti,
    farge,
    afrikaKlipp,
}: {
    geographies: unknown[];
    sti: GeoPath;
    farge: string;
    afrikaKlipp?: boolean;
}) {
    return (
        <>
            {geographies.map((g, i) => {
                const id = String((g as { id?: unknown }).id);
                const klipp = afrikaKlipp && AFRIKA.includes(id);
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge}
                        stroke="#b9ad92"
                        strokeWidth={1.5}
                        clipPath={klipp ? 'url(#vestrom-kyst)' : undefined}
                    />
                );
            })}
        </>
    );
});

type P = (ll: LngLat) => Pkt;

function Huner({ beat, p }: { beat: number; p: P }) {
    const grense = GRENSE.map(p);
    const folk: LngLat[] = [
        [11, 52],
        [17, 51],
        [24, 48.6],
    ];
    return (
        <g>
            <motion.path
                d={linje(grense)}
                fill="none"
                initial={false}
                animate={{ stroke: beat >= 4 ? ROD : '#64748b' }}
                strokeWidth={beat >= 4 ? 9 : 6}
                strokeDasharray={beat >= 4 ? undefined : '14 10'}
                strokeLinecap="round"
            />
            <Etikett pos={p([7, 47.2])} tekst="Rikets grense" farge="#475569" storrelse={30} />
            <Etikett pos={p([45.5, 50.6])} tekst="Steppene" farge={HUN} storrelse={40} />
            {beat >= 1 && (
                <Pil
                    punkter={[p([50, 48]), p([43, 47.6]), p([36, 47.2]), p([30, 47.4])]}
                    farge={HUN}
                    bredde={16}
                />
            )}
            {beat >= 1 && (
                <Etikett
                    pos={p([39, 45.2])}
                    tekst="Hunerne"
                    farge={HUN}
                    storrelse={44}
                    forsinkelse={0.8}
                />
            )}
            {beat >= 2 &&
                folk.map((f, i) => (
                    <Dott key={i} pos={p(f)} farge={GERMAN} forsinkelse={i * 0.35} />
                ))}
            {beat >= 2 && (
                <Etikett
                    pos={p([14, 49.4])}
                    tekst="Germanske folk"
                    farge={GERMAN}
                    storrelse={40}
                    forsinkelse={0.6}
                />
            )}
            {beat >= 2 && <Bolge pos={p([30, 47.4])} farge={HUN} />}
            {beat >= 3 && (
                <>
                    <Pil
                        punkter={[p([11, 52]), p([6, 50]), p([2, 47.5]), p([-0.5, 45.5])]}
                        farge={GERMAN}
                    />
                    <Pil
                        punkter={[p([17, 51]), p([14, 48.5]), p([11.5, 46.2]), p([11, 44.2])]}
                        farge={GERMAN}
                        forsinkelse={0.4}
                    />
                    <Pil
                        punkter={[p([24, 48.6]), p([24.5, 45.5]), p([23, 42.8]), p([22, 40.6])]}
                        farge={GERMAN}
                        forsinkelse={0.8}
                    />
                    <Etikett
                        pos={p([-1, 43.6])}
                        tekst="vestover"
                        farge={GERMAN}
                        storrelse={34}
                        forsinkelse={1.2}
                    />
                    <Etikett
                        pos={p([21.6, 39])}
                        tekst="sørover"
                        farge={GERMAN}
                        storrelse={34}
                        forsinkelse={1.4}
                    />
                </>
            )}
        </g>
    );
}

function Alarik({ beat, p }: { beat: number; p: P }) {
    const roma = p(ROMA);
    const bet = p(BETLEHEM);
    return (
        <g>
            <Dott pos={p([22, 43.4])} farge={GOT} stor />
            <Etikett pos={p([24.5, 45.2])} tekst="Visigoterne" farge={GOT} storrelse={40} />
            {beat >= 1 && (
                <Pil
                    punkter={[
                        p([22, 43.4]),
                        p([18.5, 44.6]),
                        p([14.5, 45.8]),
                        p([11.4, 44.6]),
                        p([12.2, 42.6]),
                    ]}
                    farge={GOT}
                    bredde={12}
                />
            )}
            {beat >= 2 &&
                [0, 1, 2].map((i) => (
                    <Ring key={i} pos={roma} r={90 + i * 110} forsinkelse={i * 0.6} />
                ))}
            <Pin pos={roma} tekst="Roma" farge={beat >= 1 ? ROD : '#334155'} under />
            {beat >= 1 && beat <= 4 && (
                <Merkelapp pos={[roma[0] - 150, roma[1] + 100]} tekst="410" farge={ROD} />
            )}
            {beat >= 3 && (
                <motion.path
                    d={`M ${roma[0]} ${roma[1]} Q ${(roma[0] + bet[0]) / 2} ${Math.min(roma[1], bet[1]) - 160} ${bet[0]} ${bet[1]}`}
                    fill="none"
                    stroke={ROD}
                    strokeWidth={5}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6 }}
                />
            )}
            {beat >= 3 && beat <= 4 && <Pin pos={bet} tekst="Betlehem" farge="#334155" over />}
            {beat === 4 && <Brev pos={[bet[0] - 260, bet[1] - 250]} />}
            {beat >= 5 && <Sitat />}
        </g>
    );
}

function Attila({ beat, p }: { beat: number; p: P }) {
    const pan = p(PANNONIA);
    const ch = p(CHALONS);
    return (
        <g>
            <Dott pos={pan} farge={HUN} stor />
            <Etikett
                pos={[pan[0] + 10, pan[1] - 52]}
                tekst="Attilas hær"
                farge={HUN}
                storrelse={40}
            />
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <rect
                        x={pan[0] - 250}
                        y={pan[1] + 50}
                        width={500}
                        height={130}
                        rx={24}
                        fill="#ffffff"
                        stroke={HUN}
                        strokeWidth={5}
                    />
                    <text
                        x={pan[0]}
                        y={pan[1] + 105}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={900}
                        fill={HUN}
                    >
                        Guds svøpe
                    </text>
                    <text
                        x={pan[0]}
                        y={pan[1] + 155}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#334155"
                    >
                        svøpe = pisk
                    </text>
                </motion.g>
            )}
            {beat >= 2 && (
                <>
                    <Pil
                        punkter={[pan, p([22.5, 44.5]), p([25.5, 42.6]), p([27.5, 41.6])]}
                        farge={HUN}
                    />
                    <Etikett
                        pos={p([30.2, 43.6])}
                        tekst="Østromerriket"
                        farge="#5b21b6"
                        storrelse={36}
                        forsinkelse={0.6}
                    />
                </>
            )}
            {beat >= 2 && (
                <Pil
                    punkter={[p([18, 48]), p([13, 49.4]), p([8.5, 49.6]), p([5.4, 49.1])]}
                    farge={HUN}
                    forsinkelse={beat === 2 ? 1.6 : 0}
                    andel={beat === 2 ? 0.45 : 1}
                />
            )}
            {beat >= 3 && (
                <>
                    <Kryss pos={ch} />
                    <Merkelapp pos={[ch[0] - 200, ch[1] + 10]} tekst="451" farge={ROD} />
                    <Etikett
                        pos={[ch[0] - 40, ch[1] - 50]}
                        tekst="De katalauniske marker"
                        farge="#1e293b"
                        storrelse={32}
                    />
                </>
            )}
            {beat === 4 && (
                <>
                    <Pil punkter={[p([1.4, 43.6]), p([2.6, 46]), p([3.8, 48])]} farge={GOT} />
                    <Pil
                        punkter={[p([7.5, 45.2]), p([6.2, 46.9]), p([4.9, 48.2])]}
                        farge={ROD}
                        forsinkelse={0.3}
                    />
                    <Etikett pos={p([-0.8, 42.6])} tekst="vestgoterne" farge={GOT} storrelse={34} />
                    <Etikett pos={p([9.2, 44.4])} tekst="Aëtius" farge={ROD} storrelse={36} />
                </>
            )}
            {beat >= 5 && (
                <>
                    <Pin pos={p(ROMA)} tekst="Roma" farge="#334155" under />
                    <Pil
                        punkter={[
                            pan,
                            p([15.5, 46.4]),
                            p([11.5, 45.2]),
                            p([11.6, 43.4]),
                            p([13.2, 44.4]),
                            p([14.4, 47]),
                        ]}
                        farge={HUN}
                        bredde={12}
                    />
                    <Etikett
                        pos={p([9.4, 45.9])}
                        tekst="Nord-Italia"
                        farge={HUN}
                        storrelse={34}
                        forsinkelse={0.8}
                    />
                </>
            )}
        </g>
    );
}

function Vandaler({ beat, p, oyer }: { beat: number; p: P; oyer: boolean }) {
    const kar = p(KARTAGO);
    const roma = p(ROMA);
    const ruter: Pkt[][] = [
        [kar, p([11.5, 39.4]), p([12.2, 41.6])],
        [p([3, 36.8]), p([7.5, 39]), p([11.9, 41.6])],
    ];
    const OYER: { navn: string; ll: LngLat; dx: number; dy: number }[] = [
        { navn: 'Sicilia', ll: [14.1, 37.5], dx: 70, dy: 70 },
        { navn: 'Sardinia', ll: [9, 40.1], dx: -120, dy: 12 },
        { navn: 'Korsika', ll: [9.1, 42.1], dx: -110, dy: 10 },
        { navn: 'Balearene', ll: [2.9, 39.6], dx: 0, dy: -48 },
    ];
    return (
        <g>
            <Pin pos={roma} tekst="Roma" farge={beat >= 5 ? ROD : '#334155'} over />
            <Dott pos={p([-4.5, 38.2])} farge={VANDAL} stor />
            <Etikett pos={p([-4, 40])} tekst="Vandalene" farge={VANDAL} storrelse={42} />
            {beat >= 1 && (
                <>
                    <Pil
                        punkter={[p([-4.5, 38.2]), p([-5.6, 36.6]), p([-5.4, 35.1])]}
                        farge={VANDAL}
                        bredde={12}
                    />
                    <Merkelapp pos={p([0, 33.6])} tekst="428 eller 429" farge={VANDAL} />
                    <Etikett
                        pos={p([0, 31.9])}
                        tekst="ledet av Geiserik"
                        farge="#1e293b"
                        storrelse={32}
                        forsinkelse={0.6}
                    />
                </>
            )}
            {beat >= 2 && (
                <>
                    <Pil
                        punkter={[p([-4.5, 35.2]), p([1, 36.4]), p([6, 36.9]), p([9.6, 36.9])]}
                        farge={VANDAL}
                    />
                    <Pin pos={kar} tekst="Kartago" farge={VANDAL} under />
                </>
            )}
            {beat >= 3 &&
                ruter.map((r, i) => (
                    <g key={i}>
                        <Pil punkter={r} farge={GULL} bredde={8} forsinkelse={i * 0.4} />
                        {beat >= 4 && <Kryss pos={r[1]} />}
                    </g>
                ))}
            {beat === 3 && (
                <Etikett
                    pos={p([6.4, 38.1])}
                    tekst="skatt i korn"
                    farge="#854d0e"
                    storrelse={34}
                    forsinkelse={0.8}
                />
            )}
            {beat === 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    <rect
                        x={1040}
                        y={640}
                        width={520}
                        height={140}
                        rx={24}
                        fill="#ffffff"
                        stroke={ROD}
                        strokeWidth={5}
                    />
                    <text
                        x={1300}
                        y={698}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill={ROD}
                    >
                        Keiseren i vest mister
                    </text>
                    <text
                        x={1300}
                        y={750}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#1e293b"
                    >
                        både korn og penger
                    </text>
                </motion.g>
            )}
            {oyer &&
                OYER.map((o, i) => {
                    const q = p(o.ll);
                    return (
                        <motion.g
                            key={o.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.35, duration: 0.5 }}
                        >
                            <circle
                                cx={q[0]}
                                cy={q[1]}
                                r={34}
                                fill={VANDAL}
                                fillOpacity={0.35}
                                stroke={VANDAL}
                                strokeWidth={4}
                            />
                            <text
                                x={q[0] + o.dx}
                                y={q[1] + o.dy}
                                textAnchor="middle"
                                fontSize={30}
                                fontWeight={900}
                                fill={VANDAL}
                                stroke="#ffffff"
                                strokeWidth={7}
                                paintOrder="stroke"
                            >
                                {o.navn}
                            </text>
                        </motion.g>
                    );
                })}
            {beat >= 5 && (
                <>
                    <Pil
                        punkter={[kar, p([12.4, 38.6]), p([13.2, 40.6]), p([12.6, 41.6])]}
                        farge={VANDAL}
                        bredde={12}
                        forsinkelse={1.5}
                    />
                    <Merkelapp pos={[roma[0] + 60, roma[1] + 50]} tekst="455" farge={VANDAL} />
                </>
            )}
        </g>
    );
}

function linje(pkt: Pkt[]) {
    return pkt.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
}

function Pil({
    punkter,
    farge,
    bredde = 10,
    forsinkelse = 0,
    andel = 1,
}: {
    punkter: Pkt[];
    farge: string;
    bredde?: number;
    forsinkelse?: number;
    andel?: number;
}) {
    const n = punkter.length;
    const [a, b] = [punkter[n - 2], punkter[n - 1]];
    const vinkel = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const s = bredde * 2.4;
    const hode = [
        [b[0] + Math.cos(vinkel) * s * 0.6, b[1] + Math.sin(vinkel) * s * 0.6],
        [b[0] + Math.cos(vinkel + 2.4) * s, b[1] + Math.sin(vinkel + 2.4) * s],
        [b[0] + Math.cos(vinkel - 2.4) * s, b[1] + Math.sin(vinkel - 2.4) * s],
    ]
        .map((q) => q.join(','))
        .join(' ');
    return (
        <g>
            <motion.path
                d={linje(punkter)}
                fill="none"
                stroke={farge}
                strokeWidth={bredde}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0.9 }}
                animate={{ pathLength: andel, opacity: 0.9 }}
                transition={{ delay: forsinkelse, duration: 1.4, ease: 'easeInOut' }}
            />
            {andel >= 1 && (
                <motion.polygon
                    points={hode}
                    fill={farge}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: forsinkelse + 1.3, duration: 0.3 }}
                />
            )}
        </g>
    );
}

function Etikett({
    pos,
    tekst,
    farge,
    storrelse = 36,
    forsinkelse = 0,
}: {
    pos: Pkt;
    tekst: string;
    farge: string;
    storrelse?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={pos[0]}
            y={pos[1]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
            textAnchor="middle"
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function Dott({
    pos,
    farge,
    stor,
    forsinkelse = 0,
}: {
    pos: Pkt;
    farge: string;
    stor?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            r={stor ? 26 : 20}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={5}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        />
    );
}

function Pin({
    pos,
    tekst,
    farge,
    over,
    under,
}: {
    pos: Pkt;
    tekst: string;
    farge: string;
    over?: boolean;
    under?: boolean;
}) {
    const dy = over ? -34 : under ? 58 : 0;
    return (
        <g>
            <circle cx={pos[0]} cy={pos[1]} r={15} fill={farge} stroke="#ffffff" strokeWidth={5} />
            <text
                x={pos[0]}
                y={pos[1] + dy}
                textAnchor="middle"
                fontSize={38}
                fontWeight={900}
                fill={farge}
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {tekst}
            </text>
        </g>
    );
}

function Merkelapp({ pos, tekst, farge }: { pos: Pkt; tekst: string; farge: string }) {
    const b = tekst.length * 26 + 44;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <rect x={pos[0] - b / 2} y={pos[1] - 36} width={b} height={62} rx={18} fill={farge} />
            <text
                x={pos[0]}
                y={pos[1] + 10}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#ffffff"
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Kryss({ pos }: { pos: Pkt }) {
    const s = 22;
    return (
        <motion.path
            d={`M ${pos[0] - s} ${pos[1] - s} L ${pos[0] + s} ${pos[1] + s} M ${pos[0] + s} ${pos[1] - s} L ${pos[0] - s} ${pos[1] + s}`}
            stroke={ROD}
            strokeWidth={10}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.4 }}
        />
    );
}

function Ring({ pos, r, forsinkelse }: { pos: Pkt; r: number; forsinkelse: number }) {
    return (
        <motion.circle
            cx={pos[0]}
            cy={pos[1]}
            r={r}
            fill="none"
            stroke={ROD}
            strokeWidth={5}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.8, 0.35] }}
            transition={{ delay: forsinkelse, duration: 1.6 }}
        />
    );
}

function Bolge({ pos, farge }: { pos: Pkt; farge: string }) {
    return (
        <>
            {[50, 90, 130].map((r, i) => (
                <motion.circle
                    key={r}
                    cx={pos[0]}
                    cy={pos[1]}
                    r={r}
                    fill="none"
                    stroke={farge}
                    strokeWidth={4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.7, 0.3] }}
                    transition={{ delay: i * 0.4, duration: 1.4 }}
                />
            ))}
        </>
    );
}

/** Et brevark med linjer som skrives, ved Betlehem. */
function Brev({ pos }: { pos: Pkt }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={pos[0]}
                y={pos[1]}
                width={200}
                height={170}
                rx={10}
                fill="#fdf6e3"
                stroke="#a8925f"
                strokeWidth={4}
            />
            {[0, 1, 2, 3, 4].map((i) => (
                <motion.line
                    key={i}
                    x1={pos[0] + 22}
                    x2={pos[0] + 178 - (i === 4 ? 70 : 0)}
                    y1={pos[1] + 32 + i * 28}
                    y2={pos[1] + 32 + i * 28}
                    stroke="#5b4a2a"
                    strokeWidth={5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5 + i * 0.9, duration: 0.8 }}
                />
            ))}
            {[0, 1].map((i) => (
                <motion.circle
                    key={i}
                    cx={pos[0] + 60 + i * 70}
                    cy={pos[1] + 120}
                    r={9}
                    fill="#60a5fa"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.9, 0] }}
                    transition={{
                        delay: 1 + i * 1.3,
                        duration: 2.2,
                        repeat: Infinity,
                        repeatDelay: 0.6,
                    }}
                />
            ))}
        </motion.g>
    );
}

function Sitat() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <rect
                x={230}
                y={560}
                width={1140}
                height={250}
                rx={30}
                fill="#fdf6e3"
                stroke="#a8925f"
                strokeWidth={5}
            />
            <text x={800} y={660} textAnchor="middle" fontSize={56} fontWeight={900} fill="#3f2e12">
                «Byen som hadde tatt hele verden,
            </text>
            <text x={800} y={735} textAnchor="middle" fontSize={56} fontWeight={900} fill="#3f2e12">
                ble selv tatt.»
            </text>
            <text x={1330} y={790} textAnchor="end" fontSize={30} fontWeight={700} fill="#78653f">
                Hieronymus, ca. 412
            </text>
        </motion.g>
    );
}
