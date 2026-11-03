import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoConicConformal, geoPath, type GeoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter, type LngLat } from '../../kart/grenser';
import type { VisualProps } from '../../types';

/**
 * Romerriket på kartet, med grensene tegnet for hånd (omtrentlig) og klippet etter kysten:
 *  - trajan:     riket på sitt største, Dacia og Mesopotamia, rikdom hjem til Roma
 *  - hadrian:    Mesopotamia gis opp, Eufrat blir grensen, forsvarsverk, reisene
 *  - borgerrett: Severus' råd, Caracalla, alle frie blir borgere
 *  - krise:      235-284: mange keisere, angrep, økonomi i ruiner, Diokletian
 */

type Modus = 'trajan' | 'hadrian' | 'borgerrett' | 'krise';

const B = 1600;
const H = 900;
const HAV = '#21506e';
const LAND = '#e6d8b3';
const RIKET = '#c2410c';
const GULL = '#ca8a04';
const ROD = '#b91c1c';

const ROMA: LngLat = [12.5, 41.9];

/** Kjernen av riket, uten Dacia og Mesopotamia. Grovt tegnet; kysten klipper resten. */
const KJERNE: LngLat[] = [
    [-10.5, 43.8],
    [-5, 48.6],
    [-1.5, 50.2],
    [2.6, 51.1],
    [4.4, 52.3],
    [6.4, 51.8],
    [7.4, 50.4],
    [8.6, 50.3],
    [9.6, 49.4],
    [11, 49],
    [13.4, 48.6],
    [16.4, 48.2],
    [18.8, 47.8],
    [19.1, 46],
    [19.5, 45],
    [21.5, 44.6],
    [23, 43.8],
    [25.2, 43.6],
    [27.2, 44.1],
    [28.8, 44.9],
    [30, 45.1],
    [41.6, 41.6],
    [40, 40.2],
    [38.7, 38.2],
    [38.2, 36.8],
    [38.5, 35.8],
    [40.2, 34.6],
    [38.2, 32.2],
    [37, 29.6],
    [35.4, 27.6],
    [33.9, 26.6],
    [33, 24],
    [31.5, 23.8],
    [30.4, 29.6],
    [25, 30.4],
    [20, 30.6],
    [15, 30.6],
    [11, 31.4],
    [8, 32.6],
    [5, 34.1],
    [0, 35],
    [-3.5, 34.5],
    [-6.3, 33.8],
    [-9.6, 33.6],
    [-10.5, 36],
    [-10.5, 43.8],
];

/** Britannia sør for muren. */
const BRITANNIA: LngLat[] = [
    [-5.9, 49.8],
    [2.2, 50.6],
    [2.2, 53.2],
    [-1.4, 55.1],
    [-3.3, 55.0],
    [-5.7, 54.4],
    [-5.9, 49.8],
];

const DACIA: LngLat[] = [
    [21.4, 44.6],
    [20.9, 46.2],
    [22.1, 47.5],
    [24, 47.7],
    [25.4, 47.1],
    [26, 45.6],
    [25.2, 43.6],
    [23, 43.8],
    [21.4, 44.6],
];

const MESOPOTAMIA: LngLat[] = [
    [38.7, 38.2],
    [42, 37.4],
    [44.6, 36.6],
    [46.2, 33],
    [48.2, 30.3],
    [46, 30],
    [44, 31.6],
    [41, 34],
    [40.2, 34.6],
    [38.5, 35.8],
    [38.2, 36.8],
    [38.7, 38.2],
];

const DONAU: LngLat[] = [
    [9, 48.1],
    [11.5, 48.8],
    [13.4, 48.6],
    [16.4, 48.2],
    [18.8, 47.8],
    [19.1, 46],
    [19.5, 45],
    [21.5, 44.6],
    [23, 43.8],
    [25.2, 43.6],
    [27.2, 44.1],
    [28.6, 45.3],
    [29.6, 45.2],
];
const EUFRAT: LngLat[] = [
    [38.9, 39.4],
    [38.7, 38.2],
    [38.2, 36.8],
    [38.5, 35.8],
    [40.2, 34.6],
    [41.6, 34.2],
    [43.4, 33.0],
    [45.6, 31.6],
    [47.4, 30.6],
];
const RHIN: LngLat[] = [
    [4.4, 52.0],
    [6.4, 51.8],
    [7.4, 50.4],
    [7.8, 49],
    [7.6, 47.6],
];

/** Hadrians mur: Tyne i øst til Solway Firth i vest. */
const MUREN: LngLat[] = [
    [-1.45, 55.0],
    [-2.3, 55.0],
    [-3.2, 54.95],
];

/** En reiserute rundt i riket. Bare en skisse, merket som det. */
const REISE: LngLat[] = [
    [12.5, 41.9],
    [4, 46.5],
    [-1.5, 52.5],
    [-4, 40],
    [-4, 35],
    [10, 36.4],
    [22.5, 38],
    [29, 39.5],
    [36.5, 34.5],
    [31, 30],
    [18, 37],
];

/** Pilene inn mot riket i krisen: nord ved Rhinen, ved Donau og fra øst. */
const ANGREP: [LngLat, LngLat][] = [
    [
        [9, 53.5],
        [7.4, 50.2],
    ],
    [
        [24, 49.8],
        [24.2, 45.4],
    ],
    [
        [33, 47.5],
        [28.6, 44],
    ],
    [
        [47, 35.5],
        [40, 35.4],
    ],
];

interface Kort {
    tittel: string;
    tekst: string;
    farge: string;
}

const KORT: Record<Modus, Kort[]> = {
    trajan: [
        { tittel: 'Trajan, keiser 98-117', tekst: 'Riket på sitt aller største', farge: RIKET },
        { tittel: 'Dacia', tekst: 'Nord for Donau, i dagens Romania', farge: GULL },
        { tittel: 'Mesopotamia', tekst: 'Erobringer langt øst i riket', farge: GULL },
        { tittel: 'Rikdom hjem til Roma', tekst: 'Penger til fantastiske byggverk', farge: GULL },
    ],
    hadrian: [
        { tittel: 'Hadrian, keiser 117-138', tekst: 'Gir opp Mesopotamia', farge: RIKET },
        { tittel: 'Eufrat', tekst: 'Elva blir grensen i øst', farge: '#1d4ed8' },
        {
            tittel: 'Forsvar, ikke erobring',
            tekst: 'Solide forsvarsverk langs grensene',
            farge: RIKET,
        },
        {
            tittel: 'Den reisende keiseren',
            tekst: 'Knytter provinsene tettere til Roma',
            farge: GULL,
        },
    ],
    borgerrett: [
        { tittel: 'Septimius Severus', tekst: 'Et råd han skal ha gitt sønnene', farge: ROD },
        { tittel: 'Ifølge Cassius Dio', tekst: 'Gjør soldatene rike', farge: ROD },
        { tittel: 'Caracalla, keiser 211-217', tekst: 'I 212 myrder han broren Geta', farge: ROD },
        {
            tittel: 'År 212: borgerrett',
            tekst: 'Alle frie i riket blir romerske borgere',
            farge: GULL,
        },
        { tittel: 'Hvorfor?', tekst: 'Cassius Dio: mer skatt. I dag: usikkert', farge: GULL },
    ],
    krise: [
        {
            tittel: 'Krisen i det tredje århundret',
            tekst: 'Riket nær ved å falle sammen',
            farge: ROD,
        },
        { tittel: '235-284', tekst: 'Nesten borgerkrig hele tiden', farge: ROD },
        { tittel: 'Over 20 keisere', tekst: 'Og mange tronranere i tillegg', farge: ROD },
        { tittel: 'Angrep fra alle kanter', tekst: 'Økonomien ligger i ruiner', farge: ROD },
        { tittel: 'Diokletian', tekst: 'Systemet må endres totalt', farge: GULL },
    ],
};

/** En liten pseudotilfeldig generator med fast frø, så kronene i krisen står likt hver gang. */
function lagFro(n: number) {
    let s = n;
    return () => {
        s = (s * 16807) % 2147483647;
        return s / 2147483647;
    };
}

export function KeisereKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'trajan';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoConicConformal()
                .parallels([33, 50])
                .rotate([-18, 0])
                .fitExtent(
                    [
                        [30, 30],
                        [B - 30, H - 30],
                    ],
                    rammePunkter([-10, 24], [47, 59]) as never
                ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const linje = (pts: LngLat[]) =>
        pts.map((ll, i) => `${i ? 'L' : 'M'}${p(ll).join(' ')}`).join('');
    const flate = (pts: LngLat[]) => `${linje(pts)}Z`;
    /** Lukket, myk rute: kurver gjennom midtpunktene, med hjørnene som kontrollpunkter. */
    const rute = (pts: LngLat[]) => {
        const q = pts.map(p);
        const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const start = mid(q[q.length - 1], q[0]);
        let d = `M${start[0]} ${start[1]}`;
        q.forEach((pt, i) => {
            const m = mid(pt, q[(i + 1) % q.length]);
            d += `Q${pt[0]} ${pt[1]} ${m[0]} ${m[1]}`;
        });
        return d;
    };

    const kortListe = KORT[modus];
    const kort = kortListe[Math.min(beat, kortListe.length - 1)];

    // Hva som er med i riket akkurat nå.
    const medMeso = modus === 'trajan';
    const borgere = modus === 'borgerrett' && beat >= 3;
    const krise = modus === 'krise';
    const rikeFarge = borgere ? GULL : krise && beat < 4 ? '#7f1d1d' : RIKET;

    const kroner = useMemo(() => {
        const r = lagFro(11);
        return Array.from({ length: 90 }, () => ({
            ll: [r() * 34 - 4, 35 + r() * 13] as LngLat,
            d: r() * 2.4,
            varighet: 0.8 + r() * 1.2,
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: HAV }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="keisere-land">
                        <LandSti geographies={geographies} sti={sti} />
                    </clipPath>
                </defs>
                <Land geographies={geographies} sti={sti} />

                <g clipPath="url(#keisere-land)">
                    <motion.path
                        d={flate(KJERNE)}
                        animate={{ fill: rikeFarge }}
                        initial={false}
                        transition={{ duration: 1.2 }}
                        opacity={0.62}
                    />
                    <motion.path
                        d={flate(BRITANNIA)}
                        animate={{ fill: rikeFarge }}
                        initial={false}
                        transition={{ duration: 1.2 }}
                        opacity={0.62}
                    />
                    <motion.path
                        d={flate(DACIA)}
                        initial={false}
                        animate={{
                            fill: modus === 'trajan' && beat === 1 ? GULL : rikeFarge,
                            opacity: modus === 'trajan' && beat === 1 ? 0.95 : 0.62,
                        }}
                        transition={{ duration: 0.8 }}
                    />
                    <motion.path
                        d={flate(MESOPOTAMIA)}
                        initial={false}
                        animate={{
                            fill: modus === 'trajan' && beat === 2 ? GULL : rikeFarge,
                            opacity: medMeso ? (modus === 'trajan' && beat === 2 ? 0.95 : 0.62) : 0,
                        }}
                        transition={{ duration: 1.2 }}
                    />
                </g>
                {/* Gammel grense i øst som stiplet spor når Mesopotamia er gitt opp */}
                {modus === 'hadrian' && (
                    <path
                        d={flate(MESOPOTAMIA)}
                        fill="none"
                        stroke="#7c2d12"
                        strokeWidth={3}
                        strokeDasharray="10 8"
                        opacity={0.6}
                    />
                )}

                {/* Elvene */}
                <path d={linje(DONAU)} fill="none" stroke="#3b82c4" strokeWidth={5} />
                <path d={linje(RHIN)} fill="none" stroke="#3b82c4" strokeWidth={5} />
                <motion.path
                    d={linje(EUFRAT)}
                    fill="none"
                    stroke="#3b82c4"
                    initial={false}
                    animate={{ strokeWidth: modus === 'hadrian' && beat === 1 ? 12 : 5 }}
                />

                {/* Trajan: rikdom fra Dacia hjem til Roma */}
                {modus === 'trajan' && beat === 3 && (
                    <>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Mynt
                                key={i}
                                fra={p([23.6, 45.8])}
                                til={p(ROMA)}
                                forsinkelse={i * 0.45}
                            />
                        ))}
                        {[0, 1, 2].map((i) => (
                            <Mynt
                                key={`m${i}`}
                                fra={p([43, 34])}
                                til={p(ROMA)}
                                forsinkelse={0.2 + i * 0.6}
                            />
                        ))}
                    </>
                )}

                {/* Hadrian: forsvarsverk langs grensene og reisene */}
                {modus === 'hadrian' && beat === 2 && (
                    <>
                        {[
                            ...DONAU.slice(1, 12),
                            ...RHIN.slice(0, 4),
                            [38.5, 36.5] as LngLat,
                            [38.4, 37.6] as LngLat,
                        ].map((ll, i) => (
                            <motion.rect
                                key={i}
                                x={p(ll)[0] - 9}
                                y={p(ll)[1] - 9}
                                width={18}
                                height={18}
                                fill="#1c1917"
                                stroke="#fef3c7"
                                strokeWidth={3}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.12 }}
                            />
                        ))}
                        <motion.path
                            d={linje(MUREN)}
                            fill="none"
                            stroke="#1c1917"
                            strokeWidth={10}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                    </>
                )}
                {modus === 'hadrian' && beat === 3 && (
                    <>
                        <motion.path
                            d={rute(REISE)}
                            fill="none"
                            stroke={GULL}
                            strokeWidth={6}
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 4, ease: 'easeInOut' }}
                        />
                    </>
                )}

                {/* Borgerrett: soldatene ved grensene, så hele riket i gull */}
                {modus === 'borgerrett' && beat <= 1 && (
                    <>
                        {[...DONAU.slice(2, 12), ...RHIN.slice(0, 3), [38.4, 37] as LngLat].map(
                            (ll, i) => (
                                <motion.g
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.08 }}
                                >
                                    <Skjold x={p(ll)[0]} y={p(ll)[1]} gull={beat === 1} />
                                </motion.g>
                            )
                        )}
                    </>
                )}
                {modus === 'borgerrett' && beat === 3 && (
                    <motion.text
                        x={p([16, 37.6])[0]}
                        y={p([16, 37.6])[1]}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        letterSpacing={6}
                        fill="#fef3c7"
                        stroke={HAV}
                        strokeWidth={10}
                        paintOrder="stroke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        ALLE FRIE BLE BORGERE
                    </motion.text>
                )}
                {modus === 'borgerrett' && beat === 4 && (
                    <>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <Mynt
                                key={i}
                                fra={p(
                                    [
                                        [-4, 40],
                                        [2, 47],
                                        [24, 39],
                                        [34, 38],
                                        [30, 30],
                                        [10, 34],
                                    ][i] as LngLat
                                )}
                                til={p(ROMA)}
                                forsinkelse={i * 0.35}
                            />
                        ))}
                    </>
                )}

                {/* Krise: kroner som dukker opp og forsvinner, angrep, så Diokletian */}
                {krise &&
                    beat === 2 &&
                    kroner.map((k, i) => (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{
                                duration: k.varighet,
                                delay: k.d,
                                repeat: Infinity,
                                repeatDelay: 0.6,
                            }}
                        >
                            <Krone x={p(k.ll)[0]} y={p(k.ll)[1]} />
                        </motion.g>
                    ))}
                {krise &&
                    beat === 3 &&
                    ANGREP.map(([fra, til], i) => (
                        <Pil key={i} fra={p(fra)} til={p(til)} forsinkelse={i * 0.3} />
                    ))}
                {krise && beat >= 1 && beat <= 3 && <Aarteller />}
                {krise && beat === 4 && (
                    <motion.path
                        d={flate(KJERNE)}
                        fill="none"
                        stroke={GULL}
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.4 }}
                        clipPath="url(#keisere-land)"
                    />
                )}

                {/* Navn */}
                {modus === 'trajan' && beat === 1 && (
                    <Etikett
                        x={p([23.6, 46.4])[0]}
                        y={p([23.6, 46.4])[1] - 50}
                        tekst="DACIA"
                        farge="#78350f"
                        fs={40}
                    />
                )}
                {modus === 'trajan' && beat === 2 && (
                    <Etikett
                        x={p([43.6, 33.2])[0]}
                        y={p([43.6, 33.2])[1]}
                        tekst="MESOPOTAMIA"
                        farge="#78350f"
                        fs={36}
                    />
                )}
                {((modus === 'trajan' && beat === 1) || (modus === 'hadrian' && beat === 0)) && (
                    <Etikett
                        x={p([17.5, 47.4])[0] - 70}
                        y={p([17.5, 47.4])[1] - 10}
                        tekst="Donau"
                        farge="#1d4ed8"
                        fs={28}
                    />
                )}
                {modus === 'hadrian' && beat === 1 && (
                    <Etikett
                        x={p([40.6, 35.6])[0] + 20}
                        y={p([40.6, 35.6])[1] - 40}
                        tekst="Eufrat"
                        farge="#1d4ed8"
                        fs={38}
                    />
                )}
                {modus === 'hadrian' && beat === 2 && (
                    <Etikett
                        x={p([-2.3, 55])[0]}
                        y={p([-2.3, 55])[1] - 30}
                        tekst="Muren"
                        farge="#1c1917"
                        fs={28}
                    />
                )}
                <Roma pos={p(ROMA)} />
                {!(modus === 'krise' && beat === 2) && (
                    <Etikett
                        x={B - 40}
                        y={H - 44}
                        tekst={
                            modus === 'hadrian' && beat === 3
                                ? 'Reisene: bare en skisse'
                                : 'Omtrentlige grenser'
                        }
                        farge="#334155"
                        fs={24}
                        anker="end"
                    />
                )}
            </svg>

            {/* Sitatet i borgerrett: rådet til sønnene */}
            <AnimatePresence>
                {modus === 'borgerrett' && beat === 1 && (
                    <motion.div
                        key="sitat"
                        className="absolute inset-x-0 flex justify-center"
                        style={{ top: '9%' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div
                            className="rounded-2xl bg-white/95 shadow-2xl px-8 py-5 text-center"
                            style={{ maxWidth: '72%' }}
                        >
                            <div
                                className="text-3xl font-black text-slate-900"
                                style={{ fontFamily: 'Georgia, serif' }}
                            >
                                «Hold sammen, gjør soldatene rike, og bry dere ikke om noen andre»
                            </div>
                            <div className="text-xl font-bold text-slate-500 mt-2">
                                Septimius Severus, ifølge Cassius Dio
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute left-[3%] bottom-[5%]" style={{ width: '46%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${modus}-${beat}`}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
                        className="rounded-xl bg-[#fffaf0] shadow-2xl px-6 py-4 border-l-[12px]"
                        style={{ borderColor: kort.farge }}
                    >
                        <div
                            className="text-2xl md:text-3xl font-black"
                            style={{ color: kort.farge }}
                        >
                            {kort.tittel}
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-slate-800 mt-1">
                            {kort.tekst}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
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
                    fill={LAND}
                    stroke="#b8a57a"
                    strokeWidth={1}
                />
            ))}
        </>
    );
});

const LandSti = memo(function LandSti({
    geographies,
    sti,
}: {
    geographies: unknown[];
    sti: GeoPath;
}) {
    return (
        <>
            {geographies.map((g, i) => (
                <path key={i} d={sti(g as never) ?? ''} />
            ))}
        </>
    );
});

function Roma({ pos: [x, y] }: { pos: [number, number] }) {
    return (
        <g>
            <circle cx={x} cy={y} r={13} fill="#1c1917" stroke="#fef3c7" strokeWidth={4} />
            <text
                x={x + 22}
                y={y + 10}
                fontSize={32}
                fontWeight={900}
                fill="#1c1917"
                stroke="#fef3c7"
                strokeWidth={7}
                paintOrder="stroke"
            >
                Roma
            </text>
        </g>
    );
}

function Etikett({
    x,
    y,
    tekst,
    farge,
    fs,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    fs: number;
    anker?: 'middle' | 'end' | 'start';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={fs}
            fontWeight={900}
            letterSpacing={2}
            fill={farge}
            stroke="#fef3c7"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            {tekst}
        </motion.text>
    );
}

function Mynt({
    fra,
    til,
    forsinkelse,
}: {
    fra: [number, number];
    til: [number, number];
    forsinkelse: number;
}) {
    return (
        <motion.circle
            r={12}
            fill="#facc15"
            stroke="#a16207"
            strokeWidth={3}
            cx={0}
            cy={0}
            initial={{ x: fra[0], y: fra[1], opacity: 0 }}
            animate={{ x: [fra[0], til[0]], y: [fra[1], til[1]], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.2, delay: forsinkelse, repeat: Infinity, repeatDelay: 0.8 }}
        />
    );
}

function Skjold({ x, y, gull }: { x: number; y: number; gull: boolean }) {
    return (
        <g>
            <rect
                x={x - 11}
                y={y - 15}
                width={22}
                height={30}
                rx={5}
                fill={gull ? '#facc15' : ROD}
                stroke="#fef3c7"
                strokeWidth={3}
            />
            <line x1={x} y1={y - 12} x2={x} y2={y + 12} stroke="#fef3c7" strokeWidth={3} />
        </g>
    );
}

function Krone({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M${x - 24} ${y + 15} L${x - 24} ${y - 12} L${x - 12} ${y} L${x} ${y - 21} L${x + 12} ${y} L${x + 24} ${y - 12} L${x + 24} ${y + 15} Z`}
            fill="#facc15"
            stroke="#7c2d12"
            strokeWidth={3}
        />
    );
}

function Pil({
    fra,
    til,
    forsinkelse,
}: {
    fra: [number, number];
    til: [number, number];
    forsinkelse: number;
}) {
    const v = Math.atan2(til[1] - fra[1], til[0] - fra[0]);
    const a = 26;
    const s1 = [til[0] - a * Math.cos(v - 0.5), til[1] - a * Math.sin(v - 0.5)];
    const s2 = [til[0] - a * Math.cos(v + 0.5), til[1] - a * Math.sin(v + 0.5)];
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.5 }}
        >
            <line
                x1={fra[0]}
                y1={fra[1]}
                x2={til[0]}
                y2={til[1]}
                stroke={ROD}
                strokeWidth={12}
                strokeLinecap="round"
            />
            <path
                d={`M${til[0]} ${til[1]} L${s1[0]} ${s1[1]} L${s2[0]} ${s2[1]} Z`}
                fill={ROD}
                stroke={ROD}
                strokeWidth={6}
                strokeLinejoin="round"
            />
        </motion.g>
    );
}

/** Stort årstall øverst til høyre. */
function Aarteller() {
    return (
        <g>
            <rect
                x={B - 380}
                y={40}
                width={340}
                height={110}
                rx={18}
                fill="#fffaf0"
                opacity={0.95}
            />
            <text x={B - 210} y={118} textAnchor="middle" fontSize={64} fontWeight={900} fill={ROD}>
                235-284
            </text>
        </g>
    );
}
