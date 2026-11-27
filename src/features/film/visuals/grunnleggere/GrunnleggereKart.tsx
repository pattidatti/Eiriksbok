import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartene i grunnleggerfilmen, i to modus:
 * - kirkemoter: Nikea (325) og Kalkedon (451), og kirkene i Egypt, Syria og Armenia som sa nei.
 * - indus: de indiske tradisjonene, og elva Indus som ga hinduismen navnet sitt.
 */

type Modus = 'kirkemoter' | 'indus';
type LL = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    kirkemoter: [
        [18, 24],
        [52, 45],
    ],
    indus: [
        [58, 5],
        [100, 38],
    ],
};

const EGYPT = 818;
const SYRIA = 760;
const ARMENIA = 51;
const TYRKIA = 792;
const INDIA = 356;
const PAKISTAN = 586;

const NIKEA: LL = [29.72, 40.43];
const KALKEDON: LL = [29.03, 40.99];

/** Elva Indus, grovt tegnet fra Tibet til havet. */
const INDUS: LL[] = [
    [81.3, 31.1],
    [79, 32.6],
    [77.6, 34.2],
    [75.5, 35.2],
    [74.4, 35.6],
    [73, 35],
    [72.3, 33.9],
    [71.5, 32.2],
    [71, 30.5],
    [70, 28.6],
    [68.6, 27.4],
    [68.3, 25.4],
    [67.6, 24.3],
];

const OVERSKRIFT: Record<Modus, string[]> = {
    kirkemoter: ['Kirkemøtet i Nikea', 'Kalkedon, år 451', 'Hvem er Jesus?', 'Tre kirker sa nei'],
    indus: [
        'Tre tradisjoner fra India',
        'Hinduismen: ingen begynnelse',
        'Hinduismen: ingen sjef',
        'Navnet kom utenfra',
        'Fra lærer til elev',
    ],
};

function projeksjonFor(modus: Modus): GeoProjection {
    const [sv, no] = UTSNITT[modus];
    return geoNaturalEarth1().fitExtent(
        [
            [30, 150],
            [B - 30, H - 20],
        ],
        { type: 'MultiPoint', coordinates: [sv, no] } as never
    );
}

function landFarge(modus: Modus, beat: number, id: number): string {
    if (modus === 'kirkemoter') {
        if (beat >= 3 && (id === EGYPT || id === SYRIA || id === ARMENIA)) return '#f87171';
        if (id === TYRKIA) return '#fde68a';
        return '#efe9dc';
    }
    if (id === INDIA) return '#f9a8d4';
    if (id === PAKISTAN && beat === 3) return '#e7e5e4';
    return '#efe9dc';
}

function Kort({ children, plass }: { children: ReactNode; plass: 'hn' | 'vn' }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
            style={
                plass === 'hn'
                    ? { right: '3%', bottom: '6%', width: '33%' }
                    : { left: '3%', bottom: '6%', width: '31%' }
            }
        >
            {children}
        </motion.div>
    );
}

function Kryss({ tekst }: { tekst: string }) {
    return (
        <div className="flex items-center gap-3 mt-2">
            <span
                className="flex items-center justify-center rounded-full bg-red-600 text-white font-black shrink-0"
                style={{ width: 40, height: 40, fontSize: 26 }}
            >
                ✕
            </span>
            <span className="text-2xl font-bold text-slate-800">{tekst}</span>
        </div>
    );
}

function KortInnhold({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'kirkemoter') {
        if (beat === 0)
            return (
                <Kort key="k0" plass="hn">
                    <div className="text-3xl font-black text-amber-800">Kirkemøte</div>
                    <div className="text-2xl font-bold text-slate-700 mt-1">
                        kirkens ledere bestemte hva kristne skulle tro
                    </div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort key="k1" plass="hn">
                    <div className="text-2xl font-bold text-slate-700">325: Nikea</div>
                    <div className="text-3xl font-black text-amber-800 mt-1">451: Kalkedon</div>
                </Kort>
            );
        if (beat === 2)
            return (
                <Kort key="k2" plass="hn">
                    <div className="text-2xl font-bold text-slate-700">Kalkedon bestemte:</div>
                    <div className="text-2xl font-black text-slate-900 mt-1">
                        hvordan det guddommelige og det menneskelige henger sammen i Jesus
                    </div>
                </Kort>
            );
        return (
            <Kort key="k3" plass="hn">
                <div className="text-2xl font-bold text-slate-700">Kirkene i</div>
                <div className="text-3xl font-black text-red-700">Egypt, Syria og Armenia</div>
                <div className="text-2xl font-bold text-slate-700">sa nei til møtet i Kalkedon</div>
            </Kort>
        );
    }
    if (beat === 0)
        return (
            <Kort key="i0" plass="vn">
                {['hinduismen', 'buddhismen', 'sikhismen'].map((t, i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, x: -14 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                        className="text-3xl font-black text-pink-900"
                    >
                        {t}
                    </motion.div>
                ))}
            </Kort>
        );
    if (beat === 1)
        return (
            <Kort key="i1" plass="vn">
                <div className="text-2xl font-black text-pink-900">Hinduismen har</div>
                <Kryss tekst="ingen grunnlegger" />
                <Kryss tekst="ingen startdato" />
                <Kryss tekst="ikke ett startsted" />
            </Kort>
        );
    if (beat === 2)
        return (
            <Kort key="i2" plass="vn">
                <div className="text-2xl font-black text-pink-900">Hinduismen har</div>
                <Kryss tekst="ingen liste over hva du må tro" />
                <Kryss tekst="ingen sjef på toppen" />
            </Kort>
        );
    if (beat === 3)
        return (
            <Kort key="i3" plass="vn">
                <div className="text-2xl font-bold text-slate-700">Gammelpersisk:</div>
                <div className="text-3xl font-black text-sky-800 mt-1">
                    hindu = folk ved elva Indus
                </div>
            </Kort>
        );
    return (
        <Kort key="i4" plass="vn">
            <div className="flex items-center flex-wrap gap-2 text-2xl font-black">
                {['lærer', 'elev', 'lærer', 'elev'].map((t, i) => (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.4 }}
                        className={t === 'lærer' ? 'text-pink-800' : 'text-slate-600'}
                    >
                        {i > 0 ? '→ ' : ''}
                        {t}
                    </motion.span>
                ))}
            </div>
            <div className="text-2xl font-bold text-slate-700 mt-3">
                Læreren kalles <span className="font-black text-pink-800">guru</span>
            </div>
        </Kort>
    );
}

function Etikett({
    x,
    y,
    tekst,
    farge,
    fs = 46,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    fs?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={fs}
            fontWeight={900}
            fill={farge}
            stroke="#fff"
            strokeWidth={8}
            paintOrder="stroke"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
        >
            {tekst}
        </motion.text>
    );
}

export function GrunnleggereKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'kirkemoter';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const projeksjon = useMemo(() => projeksjonFor(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const xy = (ll: LL) => projeksjon(ll) as [number, number];
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const indusSti = useMemo(
        () => sti({ type: 'LineString', coordinates: INDUS } as never) ?? '',
        [sti]
    );

    const [nx, ny] = xy(NIKEA);
    const [kx, ky] = xy(KALKEDON);

    return (
        <div className="absolute inset-0" style={{ background: '#cfe3f0' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {geographies.map((g, i) => (
                    <motion.path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        initial={false}
                        animate={{ fill: landFarge(modus, beat, Number(g.id)) }}
                        transition={{ duration: 0.9 }}
                        stroke="#a8a29e"
                        strokeWidth={1.2}
                    />
                ))}

                {modus === 'kirkemoter' && (
                    <>
                        <circle
                            cx={nx}
                            cy={ny}
                            r={13}
                            fill="#b45309"
                            stroke="#fff"
                            strokeWidth={4}
                        />
                        <Etikett x={nx + 70} y={ny + 58} tekst="Nikea" farge="#78350f" />
                        {beat >= 1 && (
                            <>
                                <motion.circle
                                    cx={kx}
                                    cy={ky}
                                    r={13}
                                    fill="#7c2d12"
                                    stroke="#fff"
                                    strokeWidth={4}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                />
                                <Etikett x={kx - 60} y={ky - 34} tekst="Kalkedon" farge="#7c2d12" />
                            </>
                        )}
                        {beat >= 3 &&
                            (
                                [
                                    { ll: [30.5, 26.8] as LL, t: 'EGYPT' },
                                    { ll: [38.6, 35.2] as LL, t: 'SYRIA' },
                                    { ll: [44.8, 41.3] as LL, t: 'ARMENIA' },
                                ] as const
                            ).map((e) => {
                                const [x, y] = xy(e.ll);
                                return (
                                    <Etikett
                                        key={e.t}
                                        x={x}
                                        y={y}
                                        tekst={e.t}
                                        farge="#7f1d1d"
                                        fs={40}
                                    />
                                );
                            })}
                    </>
                )}

                {modus === 'indus' && (
                    <>
                        {(() => {
                            const [x, y] = xy([79, 22]);
                            return <Etikett x={x} y={y} tekst="INDIA" farge="#831843" fs={56} />;
                        })()}
                        {beat === 3 && (
                            <>
                                <motion.path
                                    d={indusSti}
                                    fill="none"
                                    stroke="#0369a1"
                                    strokeWidth={10}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: 'easeInOut' }}
                                />
                                {(() => {
                                    const [x, y] = xy([72.6, 29.2]);
                                    return (
                                        <Etikett
                                            x={x - 120}
                                            y={y}
                                            tekst="Indus"
                                            farge="#075985"
                                            fs={52}
                                        />
                                    );
                                })()}
                            </>
                        )}
                    </>
                )}

                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={B / 2}
                        y={92}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill="#0f172a"
                        stroke="#fff"
                        strokeWidth={10}
                        paintOrder="stroke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {tekst}
                    </motion.text>
                </AnimatePresence>
            </svg>
            <AnimatePresence mode="wait">
                <KortInnhold key={`${modus}-${beat}`} modus={modus} beat={beat} />
            </AnimatePresence>
        </div>
    );
}
