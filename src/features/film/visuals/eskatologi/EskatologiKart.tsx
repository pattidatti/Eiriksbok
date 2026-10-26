import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoOrthographic, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartene. «persia»: Iran, der Zarathustra levde, og verden delt i lys og mørke. «dom»:
 * Midtøsten og Middelhavet, med dommens dag i islam og de fire rytterne i Johannes'
 * åpenbaring. «ozon»: jordkloden, ozonlaget og hullet over Antarktis.
 */

type Modus = 'persia' | 'dom' | 'ozon';
type LL = [number, number];

const B = 1600;
const H = 900;

const IRAN = 364;
const SAUDI = 682;
const ANTARKTIS = 10;

const OVERSKRIFT: Record<Modus, string[]> = {
    persia: ['Persia: dagens Iran', 'Profeten Zarathustra', 'En slagmark mellom godt og ondt'],
    dom: ['En rettferdig dommer', 'Islam: dommens dag', 'Frelse eller straff', "Johannes' åpenbaring", 'Sju segl, fire ryttere', 'Et håp under romermakten'],
    ozon: ['Vitenskapens tid', 'Ozonlaget i fare, fra ca. 1970', '1985: hull over Antarktis', '1987: Montreal-protokollen', 'Tilbake mellom 2025 og 2050?'],
};

function projeksjonFor(modus: Modus, beat: number): GeoProjection {
    if (modus === 'ozon') {
        const p = geoOrthographic().clipAngle(90);
        if (beat <= 1) p.rotate([-20, -25, 0]);
        else p.rotate([0, 90, 0]);
        return p.fitExtent(
            [
                [300, 110],
                [980, 860],
            ],
            { type: 'Sphere' } as never
        );
    }
    const [sv, no]: [LL, LL] =
        modus === 'persia'
            ? [
                  [22, 8],
                  [82, 46],
              ]
            : [
                  [-8, 10],
                  [62, 48],
              ];
    return geoNaturalEarth1().fitExtent(
        [
            [30, 60],
            [1080, H - 30],
        ],
        { type: 'MultiPoint', coordinates: [sv, no] } as never
    );
}

function farge(modus: Modus, beat: number, id: number): string {
    if (modus === 'persia') {
        if (id === IRAN) return '#d97706';
        return '#efe9dc';
    }
    if (modus === 'dom') {
        if (beat >= 1 && beat <= 2 && id === SAUDI) return '#16a34a';
        return '#efe9dc';
    }
    if (id === ANTARKTIS) return '#f8fafc';
    return '#d9e7c8';
}

function Kort({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
            style={{ right: '3%', top: '22%', width: '31%' }}
        >
            {children}
        </motion.div>
    );
}

const RYTTERE = [
    { navn: 'erobring', farge: '#e2e8f0', tekst: '#0f172a' },
    { navn: 'krig', farge: '#dc2626', tekst: '#ffffff' },
    { navn: 'sult', farge: '#0f172a', tekst: '#ffffff' },
    { navn: 'død', farge: '#a3b18a', tekst: '#0f172a' },
];

function KortInnhold({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'persia') {
        if (beat === 1)
            return (
                <Kort key="p1">
                    <div className="text-4xl font-black text-slate-900">Zarathustra</div>
                    <div className="text-2xl font-bold text-slate-600 mt-2">profet i Persia</div>
                    <div className="text-2xl font-bold text-amber-700 mt-3">lenge før vår tidsregning, men ingen vet sikkert når</div>
                </Kort>
            );
        if (beat === 2)
            return (
                <Kort key="p2">
                    <div className="text-3xl font-black text-amber-600">godt og lys</div>
                    <div className="text-2xl font-bold text-slate-500 my-1">mot</div>
                    <div className="text-3xl font-black text-indigo-900">ondt og mørke</div>
                </Kort>
            );
        return null;
    }
    if (modus === 'dom') {
        if (beat === 0)
            return (
                <Kort key="d0">
                    <div className="text-2xl font-bold text-slate-700">jødedommen</div>
                    <div className="text-2xl font-bold text-slate-700">kristendommen</div>
                    <div className="text-2xl font-bold text-slate-700">islam</div>
                    <div className="text-3xl font-black text-slate-900 mt-3">historien ender hos en rettferdig dommer</div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort key="d1">
                    <div className="text-4xl font-black text-green-800">Dommens dag</div>
                    <div className="text-2xl font-bold text-slate-700 mt-2">en grunnleggende del av troen</div>
                    <div className="text-2xl font-bold text-slate-500 mt-2">helt fra Muhammad begynte å forkynne</div>
                </Kort>
            );
        if (beat === 2)
            return (
                <Kort key="d2">
                    <div className="text-2xl font-bold text-slate-800">alle står opp igjen</div>
                    <div className="text-3xl font-black text-slate-400">↓</div>
                    <div className="text-2xl font-bold text-slate-800">Guds domstol</div>
                    <div className="text-3xl font-black text-slate-400">↓</div>
                    <div className="text-2xl font-black text-green-800">frelse eller straff</div>
                </Kort>
            );
        if (beat === 3)
            return (
                <Kort key="d3">
                    <div className="text-4xl font-black text-slate-900">Johannes' åpenbaring</div>
                    <div className="text-2xl font-bold text-slate-600 mt-2">den mest kjente kristne teksten om slutten</div>
                </Kort>
            );
        if (beat === 4)
            return (
                <Kort key="d4">
                    <div className="flex gap-2 justify-center">
                        {Array.from({ length: 7 }, (_, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 1 }}
                                animate={{ scale: 1, opacity: i < 4 ? 0.35 : 1 }}
                                transition={{ delay: 0.5 + i * 0.35 }}
                                className="rounded-full"
                                style={{ width: 38, height: 38, background: '#b91c1c', border: '4px solid #7f1d1d' }}
                            />
                        ))}
                    </div>
                    <div className="text-xl font-bold text-slate-500 text-center mt-1">4 av 7 segl brytes</div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        {RYTTERE.map((r, i) => (
                            <motion.div
                                key={r.navn}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 2 + i * 0.5 }}
                                className="rounded-xl text-center text-2xl font-black py-2"
                                style={{ background: r.farge, color: r.tekst }}
                            >
                                {r.navn}
                            </motion.div>
                        ))}
                    </div>
                </Kort>
            );
        return (
            <Kort key="d5">
                <div className="text-3xl font-black text-slate-900">Ikke bare skrekk</div>
                <div className="text-2xl font-bold text-teal-700 mt-2">et håp: Gud skal til slutt gripe inn</div>
            </Kort>
        );
    }
    if (beat === 2)
        return (
            <Kort key="o2">
                <div className="text-2xl font-black text-slate-900">Gasser fra</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">spraybokser og kjøleindustri</div>
                <div className="text-2xl font-bold text-purple-700 mt-2">bryter ned ozonet</div>
            </Kort>
        );
    if (beat === 3)
        return (
            <Kort key="o3">
                <div className="text-3xl font-black text-teal-700">Verden handler sammen</div>
                <div className="text-2xl font-bold text-slate-700 mt-2">grenser for utslippene</div>
            </Kort>
        );
    if (beat === 4)
        return (
            <Kort key="o4">
                <div className="text-3xl font-black text-slate-900">1980-tallsnivå igjen?</div>
                <div className="text-2xl font-bold text-slate-500 mt-2">beregningene er usikre</div>
            </Kort>
        );
    return null;
}

export function EskatologiKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'persia';
    const { geographies } = useFilmVerden();
    const sydpol = modus === 'ozon' && beat >= 2;
    const projeksjon = useMemo(() => projeksjonFor(modus, sydpol ? 2 : 0), [modus, sydpol]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const xy = (ll: LL) => projeksjon(ll) as [number, number];
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const kule = modus === 'ozon' ? (sti({ type: 'Sphere' } as never) ?? undefined) : undefined;
    const pol = modus === 'ozon' ? xy([0, -90]) : [0, 0];
    const kuleR = 340;
    const hullR = beat === 2 ? 120 : beat === 3 ? 100 : beat >= 4 ? 70 : 0;

    return (
        <div className="absolute inset-0" style={{ background: modus === 'ozon' ? '#0b1530' : '#cfe8f7' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'ozon' && (
                    <>
                        <motion.circle
                            cx={640}
                            cy={485}
                            r={kuleR + 26}
                            fill="none"
                            stroke="#60a5fa"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= 1 ? 0.8 : 0, strokeWidth: beat >= 1 ? 22 : 0 }}
                            transition={{ duration: 1.2 }}
                        />
                        <path d={kule} fill="#3b82c4" />
                    </>
                )}
                <AnimatePresence>
                    <motion.g key={sydpol ? 'syd' : 'nord'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                        {geographies.map((g, i) => (
                            <motion.path
                                key={`${g.id ?? 'x'}-${i}`}
                                d={sti(g as never) ?? undefined}
                                initial={false}
                                animate={{ fill: farge(modus, beat, Number(g.id)) }}
                                transition={{ duration: 0.9 }}
                                stroke="#a8a29e"
                                strokeWidth={1}
                            />
                        ))}
                    </motion.g>
                </AnimatePresence>

                {modus === 'persia' && (() => {
                    const [x, y] = xy([53, 32.5]);
                    return (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                            <text x={x} y={y + 14} textAnchor="middle" fontSize={50} fontWeight={900} fill="#7c2d12" stroke="#fff" strokeWidth={9} paintOrder="stroke">
                                PERSIA
                            </text>
                            {beat >= 1 && (
                                <g>
                                    <circle cx={x - 20} cy={y + 80} r={18} fill="#fff" stroke="#7c2d12" strokeWidth={7} />
                                    <text x={x + 10} y={y + 92} fontSize={36} fontWeight={800} fill="#0f172a" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                                        Zarathustra
                                    </text>
                                </g>
                            )}
                        </motion.g>
                    );
                })()}
                {modus === 'persia' && beat === 2 && (
                    <g>
                        <motion.rect x={0} y={0} width={560} height={H} fill="#fde68a" initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ duration: 1.2 }} />
                        <motion.rect x={560} y={0} width={560} height={H} fill="#1e1b4b" initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} transition={{ duration: 1.2 }} />
                    </g>
                )}

                {modus === 'dom' && beat === 0 && (() => {
                    const [x, y] = xy([38, 31]);
                    return (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <text x={x} y={y} textAnchor="middle" fontSize={46} fontWeight={900} fill="#334155" stroke="#fff" strokeWidth={9} paintOrder="stroke">
                                MIDTØSTEN
                            </text>
                        </motion.g>
                    );
                })()}
                {modus === 'dom' && beat >= 1 && beat <= 2 && (() => {
                    const [x, y] = xy([44, 23]);
                    return (
                        <motion.text x={x} y={y} textAnchor="middle" fontSize={44} fontWeight={900} fill="#14532d" stroke="#fff" strokeWidth={9} paintOrder="stroke" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            Arabia
                        </motion.text>
                    );
                })()}
                {modus === 'dom' && beat >= 3 && (() => {
                    const [x, y] = xy([18, 37]);
                    const [rx, ry] = xy([12.5, 41.9]);
                    return (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                            <ellipse cx={x} cy={y} rx={420} ry={190} fill="#b91c1c" fillOpacity={0.14} stroke="#b91c1c" strokeWidth={5} strokeDasharray="16 12" />
                            <circle cx={rx} cy={ry} r={14} fill="#fff" stroke="#b91c1c" strokeWidth={6} />
                            <text x={rx + 22} y={ry - 18} fontSize={38} fontWeight={900} fill="#7f1d1d" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                                Roma
                            </text>
                            <text x={x} y={y + 150} textAnchor="middle" fontSize={40} fontWeight={900} fill="#7f1d1d" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                                romermakten
                            </text>
                        </motion.g>
                    );
                })()}

                {modus === 'ozon' && sydpol && (
                    <motion.circle
                        cx={pol[0]}
                        cy={pol[1]}
                        fill="#7e22ce"
                        initial={{ r: 0, opacity: 0.75 }}
                        animate={{ r: hullR, opacity: 0.75 }}
                        transition={{ duration: 2.4 }}
                    />
                )}
                {modus === 'ozon' && beat >= 4 && (
                    <circle cx={pol[0]} cy={pol[1]} r={130} fill="none" stroke="#e9d5ff" strokeWidth={4} strokeDasharray="12 10" />
                )}
                {modus === 'ozon' && beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                        {[0, 1, 2].map((i) => (
                            <line key={i} x1={1260} y1={260 + i * 50} x2={1090} y2={330 + i * 50} stroke="#fde047" strokeWidth={8} strokeLinecap="round" strokeDasharray="20 12" />
                        ))}
                        <text x={1250} y={230} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fde047">
                            skadelig stråling
                        </text>
                        <text x={150} y={210} textAnchor="middle" fontSize={34} fontWeight={800} fill="#93c5fd">
                            ozonlaget
                        </text>
                        <line x1={150} y1={230} x2={330} y2={300} stroke="#93c5fd" strokeWidth={4} />
                    </motion.g>
                )}
                {modus === 'ozon' && beat === 2 && (
                    <motion.text x={pol[0]} y={pol[1] + 180} textAnchor="middle" fontSize={38} fontWeight={900} fill="#f3e8ff" stroke="#3b0764" strokeWidth={8} paintOrder="stroke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
                        Antarktis
                    </motion.text>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <KortInnhold key={`${modus}-${beat}`} modus={modus} beat={beat} />
            </AnimatePresence>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '4%' }}
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
