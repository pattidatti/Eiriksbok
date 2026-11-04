import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoCentroid, geoMercator, geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kart over Afrika og verden.
 * «barn»: barn per kvinne i landene artikkelen nevner, som skilt rett på kartet. Til slutt
 * Sahara og landene sør for den.
 * «endring»: Øst-Afrika, der Kenya og Etiopia fikk ned antall barn per kvinne.
 * «verden»: Kina (tvang), Afrika (skole og egne valg), et gammelt Europa og Øst-Asia,
 * og Afrikas del av verden i 2100.
 */

type Modus = 'barn' | 'endring' | 'verden';

const B = 1600;
const H = 900;

const ID = {
    tunisia: 788,
    marokko: 504,
    sorAfrika: 710,
    niger: 562,
    tsjad: 148,
    somalia: 706,
    kenya: 404,
    etiopia: 231,
    kina: 156,
    japan: 392,
    sorKorea: 410,
    nordKorea: 408,
    taiwan: 158,
    mongolia: 496,
};

const AFRIKA = [
    12, 24, 72, 108, 120, 132, 140, 148, 174, 178, 180, 204, 226, 231, 232, 262, 266, 270, 288, 324,
    384, 404, 426, 430, 434, 450, 454, 466, 478, 480, 504, 508, 516, 562, 566, 624, 646, 686, 694,
    706, 710, 716, 728, 729, 732, 748, 768, 788, 800, 818, 834, 854, 894,
];
/** Nord-Afrika: landene som for det meste ligger i eller nord for Sahara. */
const NORD = [12, 434, 504, 788, 818, 732];
const OST_ASIA = [ID.kina, ID.japan, ID.sorKorea, ID.nordKorea, ID.taiwan, ID.mongolia];

const UTSNITT_OST: Utsnitt = [
    [24, -8],
    [52, 16],
];

interface Skilt {
    ll: [number, number];
    navn: string;
    verdi: string;
    farge: string;
    fraBeat: number;
    dx: number;
    dy: number;
}

interface Oppsett {
    hjorner: [[number, number], [number, number]];
    fin: boolean;
    verden: boolean;
    land: (beat: number) => Record<number, string>;
    skilt: (beat: number) => Skilt[];
    tittel: string[];
    notat?: (beat: number) => string | null;
}

const LYS = '#fde7c8';
const LAV = '#2563eb';
const MIDDELS = '#60a5fa';
const HOY = '#c2410c';

const OPPSETT: Record<Modus, Oppsett> = {
    barn: {
        hjorner: [
            [-20, -36],
            [54, 38],
        ],
        fin: false,
        verden: false,
        land: (beat) => {
            const f: Record<number, string> = {};
            for (const id of AFRIKA) f[id] = beat >= 4 && !NORD.includes(id) ? '#fdba74' : LYS;
            if (beat >= 1) f[ID.tunisia] = LAV;
            if (beat >= 2) {
                f[ID.marokko] = MIDDELS;
                f[ID.sorAfrika] = MIDDELS;
            }
            if (beat >= 3) {
                f[ID.niger] = HOY;
                f[ID.tsjad] = HOY;
                f[ID.somalia] = HOY;
            }
            return f;
        },
        skilt: () => [
            {
                ll: [9.5, 34],
                navn: 'Tunisia',
                verdi: '1,8',
                farge: LAV,
                fraBeat: 1,
                dx: 150,
                dy: 60,
            },
            {
                ll: [-6.5, 31.5],
                navn: 'Marokko',
                verdi: '2,2',
                farge: MIDDELS,
                fraBeat: 2,
                dx: -40,
                dy: 0,
            },
            {
                ll: [24, -30],
                navn: 'Sør-Afrika',
                verdi: '2,2',
                farge: MIDDELS,
                fraBeat: 2,
                dx: 60,
                dy: 10,
            },
            {
                ll: [9, 17],
                navn: 'Niger',
                verdi: 'ca. 6',
                farge: HOY,
                fraBeat: 3,
                dx: -150,
                dy: 40,
            },
            {
                ll: [18.5, 15],
                navn: 'Tsjad',
                verdi: 'ca. 6',
                farge: HOY,
                fraBeat: 3,
                dx: 40,
                dy: 130,
            },
            {
                ll: [46, 5],
                navn: 'Somalia',
                verdi: 'ca. 6',
                farge: HOY,
                fraBeat: 3,
                dx: 50,
                dy: 30,
            },
        ],
        tittel: [
            'Afrika: mange land',
            'Barn per kvinne, 2023',
            'Barn per kvinne, 2023',
            'Barn per kvinne, 2023',
            'Veksten skjer mest sør for Sahara',
        ],
        notat: (beat) => (beat >= 4 ? 'Grensen for Sahara er omtrentlig' : null),
    },
    endring: {
        hjorner: UTSNITT_OST,
        fin: true,
        verden: false,
        land: (beat) => {
            const f: Record<number, string> = {};
            for (const id of AFRIKA) f[id] = LYS;
            f[ID.kenya] = beat >= 4 ? '#16a34a' : beat >= 1 ? '#0d9488' : '#5eead4';
            if (beat >= 3) f[ID.etiopia] = beat >= 4 ? '#16a34a' : '#0d9488';
            return f;
        },
        skilt: (beat) => [
            beat === 2
                ? {
                      ll: [37.9, 0.2],
                      navn: 'Kenya: midtpersonen',
                      verdi: '14 → nesten 20 år',
                      farge: '#0d9488',
                      fraBeat: 2,
                      dx: 70,
                      dy: 70,
                  }
                : {
                      ll: [37.9, 0.2],
                      navn: 'Kenya: barn per kvinne',
                      verdi: 'over 6 → ca. 3',
                      farge: '#0d9488',
                      fraBeat: 1,
                      dx: 70,
                      dy: 70,
                  },
            {
                ll: [39.5, 8.6],
                navn: 'Etiopia: barn per kvinne',
                verdi: 'ca. 7 → 4',
                farge: '#0d9488',
                fraBeat: 3,
                dx: 80,
                dy: -70,
            },
        ],
        tittel: [
            'Øst-Afrika',
            'Kenya, 1990 og 2023',
            'Kenya, 1990 og 2023',
            'Etiopia, 1990 og 2023',
            'Fort gjennom overgangen',
        ],
        notat: (beat) => (beat === 0 ? 'Kenya' : null),
    },
    verden: {
        hjorner: [
            [-125, -40],
            [175, 68],
        ],
        fin: false,
        verden: true,
        land: (beat) => {
            const f: Record<number, string> = {};
            if (beat <= 1) f[ID.kina] = '#dc2626';
            if (beat >= 1) for (const id of AFRIKA) f[id] = '#ea580c';
            if (beat >= 2) for (const id of OST_ASIA) f[id] = '#64748b';
            return f;
        },
        skilt: () => [],
        tittel: [
            'Kina: tvang',
            'Skole for jenter: egne valg',
            'Ungt Afrika, eldre Europa og Øst-Asia',
            'År 2100, hvis prognosen slår til',
        ],
    },
};

/** Europa i grove trekk: land med midtpunkt i dette vinduet (omtrentlig). */
function erEuropa(g: unknown) {
    const [lng, lat] = geoCentroid(g as never);
    return lng > -25 && lng < 45 && lat > 35 && lat < 72;
}

const KART_X1 = 1560;

function Skiltet({ s, x, y, ny }: { s: Skilt; x: number; y: number; ny: boolean }) {
    const tx = x + s.dx;
    const ty = y + s.dy;
    const bredde = Math.max(s.navn.length * 22, s.verdi.length * 28) + 40;
    const venstre = s.dx < 0 ? tx - bredde : s.dx === 0 ? tx - bredde / 2 : tx;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: ny ? 0.4 : 0 }}
        >
            <line x1={x} y1={y} x2={tx} y2={ty} stroke="#0f172a" strokeWidth={4} />
            <circle cx={x} cy={y} r={11} fill="#fff" stroke="#0f172a" strokeWidth={5} />
            <rect
                x={venstre}
                y={ty - 50}
                width={bredde}
                height={100}
                rx={18}
                fill="#fff"
                stroke={s.farge}
                strokeWidth={6}
            />
            <text x={venstre + 20} y={ty - 12} fontSize={34} fontWeight={800} fill="#334155">
                {s.navn}
            </text>
            <text x={venstre + 20} y={ty + 34} fontSize={44} fontWeight={900} fill={s.farge}>
                {s.verdi}
            </text>
        </motion.g>
    );
}

export function AfrikaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'barn';
    const o = OPPSETT[modus];
    const { geographies } = useFilmVerden(o.fin ? o.hjorner : undefined);
    const projeksjon = useMemo<GeoProjection>(() => {
        const p = o.verden ? geoNaturalEarth1() : geoMercator();
        const venstre = modus === 'barn' ? 360 : modus === 'endring' ? 120 : 40;
        const hoyre = modus === 'barn' ? 1240 : modus === 'endring' ? 1000 : KART_X1;
        return p.fitExtent(
            [
                [venstre, 130],
                [hoyre, H - 30],
            ],
            { type: 'MultiPoint', coordinates: o.hjorner } as never
        );
    }, [modus, o.hjorner, o.verden]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const farger = o.land(beat);
    const tittel = o.tittel[Math.min(beat, o.tittel.length - 1)];
    const notat = o.notat?.(beat) ?? null;
    const sahara = modus === 'barn' && beat >= 4;
    const saharaY = (projeksjon([0, 16]) as [number, number])[1];
    const saharaVest = (projeksjon([-17, 16]) as [number, number])[0];
    const saharaOst = (projeksjon([38, 16]) as [number, number])[0];

    return (
        <div className="absolute inset-0" style={{ background: '#cfe8f7' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => {
                    const id = Number(g.id);
                    let fyll = farger[id];
                    if (
                        !fyll &&
                        modus === 'verden' &&
                        beat >= 2 &&
                        erEuropa(g) &&
                        !AFRIKA.includes(id)
                    )
                        fyll = '#64748b';
                    return (
                        <motion.path
                            key={`${g.id ?? 'x'}-${i}`}
                            d={sti(g as never) ?? undefined}
                            initial={false}
                            animate={{ fill: fyll ?? '#efece6' }}
                            transition={{ duration: 0.9 }}
                            stroke="#a8a29e"
                            strokeWidth={1}
                        />
                    );
                })}
                {sahara && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <path
                            d={`M ${saharaVest} ${saharaY} L ${saharaOst} ${saharaY}`}
                            stroke="#7c2d12"
                            strokeWidth={6}
                            strokeDasharray="18 12"
                        />
                        <text
                            x={(saharaVest + saharaOst) / 2}
                            y={saharaY - 120}
                            textAnchor="middle"
                            fontSize={52}
                            fontWeight={900}
                            fill="#7c2d12"
                            stroke="#fff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            SAHARA
                        </text>
                        <text
                            x={(saharaVest + saharaOst) / 2}
                            y={saharaY + 90}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#0f172a"
                            stroke="#fff"
                            strokeWidth={8}
                            paintOrder="stroke"
                        >
                            sør for Sahara
                        </text>
                    </motion.g>
                )}
                {!sahara &&
                    o
                        .skilt(beat)
                        .filter((s) => s.fraBeat <= beat)
                        .map((s) => {
                            const [x, y] = projeksjon(s.ll) as [number, number];
                            return (
                                <Skiltet key={s.navn} s={s} x={x} y={y} ny={s.fraBeat === beat} />
                            );
                        })}
                {modus === 'endring' && beat === 0 && (
                    <text
                        x={(projeksjon([37.9, 0.2]) as [number, number])[0]}
                        y={(projeksjon([37.9, 0.2]) as [number, number])[1]}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        Kenya
                    </text>
                )}
            </svg>
            <div className="absolute inset-x-0 flex justify-center" style={{ top: '4%' }}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tittel}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tittel}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'barn' && beat >= 1 && beat <= 3 && (
                <div className="absolute left-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-xl font-bold text-slate-700">
                    tallet = barn en kvinne får i snitt
                </div>
            )}
            {notat && modus !== 'endring' && (
                <div className="absolute left-[3%] bottom-[6%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-xl font-bold text-slate-600">
                    {notat}
                </div>
            )}
            {modus === 'verden' && <VerdenMerker beat={beat} projeksjon={projeksjon} />}
        </div>
    );
}

/** Merkene på verdenskartet, som DOM-kort over SVG-en (posisjonert i prosent). */
function VerdenMerker({ beat, projeksjon }: { beat: number; projeksjon: GeoProjection }) {
    const pst = (ll: [number, number]) => {
        const [x, y] = projeksjon(ll) as [number, number];
        return { left: `${(x / B) * 100}%`, top: `${(y / H) * 100}%` };
    };
    const kort: {
        ll: [number, number];
        tekst: string;
        under?: string;
        farge: string;
        vis: boolean;
    }[] = [
        { ll: [128, 22], tekst: 'Kina', under: 'tvang', farge: '#dc2626', vis: beat <= 1 },
        {
            ll: [20, 2],
            tekst: 'Afrika',
            under: beat >= 2 ? 'ungt' : 'skole for jenter',
            farge: '#ea580c',
            vis: beat >= 1 && beat <= 2,
        },
        { ll: [14, 52], tekst: 'Europa', under: 'blir eldre', farge: '#475569', vis: beat >= 2 },
        { ll: [118, 38], tekst: 'Øst-Asia', under: 'blir eldre', farge: '#475569', vis: beat >= 2 },
    ];
    return (
        <>
            {kort
                .filter((k) => k.vis)
                .map((k) => (
                    <div key={k.tekst} className="absolute" style={pst(k.ll)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="px-4 py-2 rounded-2xl bg-white/95 shadow-xl text-center whitespace-nowrap"
                            style={{
                                marginLeft: -80,
                                marginTop: -40,
                                minWidth: 160,
                                borderLeft: `8px solid ${k.farge}`,
                            }}
                        >
                            <div className="text-2xl font-black text-slate-900">{k.tekst}</div>
                            {k.under && (
                                <div className="text-xl font-bold text-slate-600">{k.under}</div>
                            )}
                        </motion.div>
                    </div>
                ))}
            {beat >= 3 && (
                <div className="absolute inset-x-0 flex justify-center" style={{ bottom: '5%' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="px-6 py-3 rounded-2xl bg-slate-900 text-amber-200 text-3xl font-black shadow-xl whitespace-nowrap"
                    >
                        Mer enn hver tredje person i verden kan bo i Afrika
                    </motion.div>
                </div>
            )}
        </>
    );
}
