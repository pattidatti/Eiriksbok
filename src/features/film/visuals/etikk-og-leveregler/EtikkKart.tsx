import { useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartene i etikkfilmen, i to modus:
 * - india: tradisjonene fra India, med karma, dharma og ahimsa på kort.
 * - sapmi: samisk religion. Området er en uskarp sky (ingen skarpe grenser), og naturen
 *   (fjell, stein, tre) dukker opp på kartet.
 */

type Modus = 'india' | 'sapmi';
type LL = [number, number];

const B = 1600;
const H = 900;

const UTSNITT: Record<Modus, Utsnitt> = {
    india: [
        [56, 4],
        [104, 37],
    ],
    sapmi: [
        [3, 60.5],
        [44, 72],
    ],
};

const INDIA = 356;
const NORDEN = [578, 752, 246, 643];

const OVERSKRIFT: Record<Modus, string[]> = {
    india: ['Tre tradisjoner fra India', 'Karma', 'Ingen trenger å gi ordre', 'Dharma', 'Ahimsa'],
    sapmi: ['Samisk religion', 'Naturen lever', 'Gi noe tilbake', 'Det lever videre'],
};

/** Grove punkter for skya over samiske områder. Omtrentlig, uten grenser. */
const SKY: LL[] = [
    [11.5, 63.6],
    [14, 65.5],
    [16.5, 67.3],
    [19.5, 68.8],
    [23.5, 69.6],
    [27.5, 69.8],
    [31, 69.2],
    [35, 68.3],
    [25, 67.6],
    [20.5, 66.6],
    [16.5, 64.6],
    [28.5, 68.2],
];

function projeksjonFor(modus: Modus): GeoProjection {
    const [sv, no] = UTSNITT[modus];
    return geoNaturalEarth1().fitExtent(
        [
            [30, 140],
            [B - 30, H - 20],
        ],
        { type: 'MultiPoint', coordinates: [sv, no, [sv[0], no[1]], [no[0], sv[1]]] } as never
    );
}

function landFarge(modus: Modus, id: number): string {
    if (modus === 'india') return id === INDIA ? '#f9a8d4' : '#efe9dc';
    return NORDEN.includes(id) ? '#eae4d6' : '#e2ddd2';
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
                    ? { right: '3%', bottom: '5%', width: '36%' }
                    : { left: '3%', bottom: '5%', width: '34%' }
            }
        >
            {children}
        </motion.div>
    );
}

function Brikke({ tekst, farge }: { tekst: string; farge: string }) {
    return (
        <span
            className="inline-block rounded-xl px-3 py-1 text-2xl font-black text-white mr-2 mt-2"
            style={{ background: farge }}
        >
            {tekst}
        </span>
    );
}

function Kryss() {
    return (
        <span
            className="flex items-center justify-center rounded-full bg-red-600 text-white font-black shrink-0"
            style={{ width: 40, height: 40, fontSize: 26 }}
        >
            ✕
        </span>
    );
}

/** Pilene i en ring: det du gjør, kommer tilbake til deg. */
function KarmaRing() {
    return (
        <svg viewBox="0 0 200 200" style={{ width: 150, height: 150 }} className="shrink-0">
            <defs>
                <marker id="etikk-pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" fill="#be185d" />
                </marker>
            </defs>
            <path d="M 100 28 A 72 72 0 0 1 166 128" fill="none" stroke="#be185d" strokeWidth={12} markerEnd="url(#etikk-pil)" />
            <path d="M 150 158 A 72 72 0 0 1 34 128" fill="none" stroke="#be185d" strokeWidth={12} markerEnd="url(#etikk-pil)" />
            <circle cx={100} cy={100} r={30} fill="#fce7f3" />
            <circle cx={100} cy={90} r={10} fill="#9d174d" />
            <rect x={86} y={102} width={28} height={20} rx={8} fill="#9d174d" />
        </svg>
    );
}

function KortInnhold({ modus, beat }: { modus: Modus; beat: number }) {
    if (modus === 'india') {
        if (beat === 0)
            return (
                <Kort key="i0" plass="vn">
                    {['hinduisme', 'buddhisme', 'sikhisme'].map((t, i) => (
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
                    <div className="text-2xl font-bold text-slate-600 mt-2">En annen grunn til å være god</div>
                </Kort>
            );
        if (beat === 1)
            return (
                <Kort key="i1" plass="vn">
                    <div className="flex items-center gap-4">
                        <KarmaRing />
                        <div className="text-2xl font-bold text-slate-800">
                            Det du gjør mot andre, får følger for <span className="font-black text-pink-800">deg selv</span>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-slate-500 mt-1">i dette livet eller i et senere</div>
                </Kort>
            );
        if (beat === 2)
            return (
                <Kort key="i2" plass="vn">
                    <div className="flex items-center gap-3">
                        <Kryss />
                        <span className="text-2xl font-black text-slate-800">ingen trenger å befale deg</span>
                    </div>
                    <div className="text-3xl font-black text-pink-800 mt-3">Følgene kommer uansett.</div>
                </Kort>
            );
        if (beat === 3)
            return (
                <Kort key="i3" plass="vn">
                    <div className="text-2xl font-bold text-slate-700">
                        <span className="font-black text-pink-800">Dharma</span>: det som er riktig å gjøre, pliktene dine
                    </div>
                    <div className="text-xl font-bold text-slate-500 mt-2">Ikke likt for alle. Det kommer an på:</div>
                    {['alder', 'kjønn', 'jobb', 'hvor i livet du står'].map((t) => (
                        <Brikke key={t} tekst={t} farge="#9d174d" />
                    ))}
                </Kort>
            );
        return (
            <Kort key="i4" plass="vn">
                <div className="text-2xl font-bold text-slate-700">
                    <span className="font-black text-pink-800">Ahimsa</span>: ikke skade noe levende
                </div>
                <div className="text-3xl font-black text-emerald-700 mt-2">Mange hinduer er vegetarianere.</div>
            </Kort>
        );
    }
    if (beat === 0)
        return (
            <Kort key="s0" plass="hn">
                <div className="flex items-center gap-3">
                    <Kryss />
                    <span className="text-2xl font-black text-slate-800">ingen hellig bok</span>
                </div>
                <div className="text-2xl font-bold text-slate-700 mt-3">
                    Levereglene ble ført videre i <span className="font-black text-sky-800">fortellinger</span> og i det folk gjorde.
                </div>
            </Kort>
        );
    if (beat === 1)
        return (
            <Kort key="s1" plass="hn">
                <div className="text-3xl font-black text-emerald-800">Naturen lever</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                    Et sted er ikke et lager, men noen du står i et forhold til.
                </div>
            </Kort>
        );
    if (beat === 2)
        return (
            <Kort key="s2" plass="hn">
                <div className="text-2xl font-bold text-slate-600">Til vanlig ofret folk selv:</div>
                {['tran', 'fiskerester', 'kjøtt', 'blod', 'metall', 'mynter'].map((t) => (
                    <Brikke key={t} tekst={t} farge="#92400e" />
                ))}
                <div className="text-2xl font-black text-slate-900 mt-3">Gi noe tilbake til stedet.</div>
            </Kort>
        );
    return (
        <Kort key="s3" plass="hn">
            <div className="flex items-center gap-3">
                <Kryss />
                <span className="text-2xl font-bold text-slate-800">misjonærene brente runebommene</span>
            </div>
            <div className="text-2xl font-bold text-slate-600 mt-3">Lever videre i:</div>
            {['språk', 'joik', 'stedsnavn'].map((t) => (
                <Brikke key={t} tekst={t} farge="#0369a1" />
            ))}
        </Kort>
    );
}

function Etikett({ x, y, tekst, farge, fs = 46 }: { x: number; y: number; tekst: string; farge: string; fs?: number }) {
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

/** Fjell, stein og tre: naturen som har sin egen kraft. */
function Natur({ xy }: { xy: (ll: LL) => [number, number] }) {
    const [fx, fy] = xy([16.8, 68.2]);
    const [sx, sy] = xy([23.5, 68.9]);
    const [tx, ty] = xy([27.5, 67.2]);
    const ting = [
        {
            id: 'fjell',
            x: fx,
            y: fy,
            navn: 'fjell',
            form: <path d="M -60 30 L -10 -50 L 20 -10 L 35 -30 L 70 30 Z" fill="#78716c" stroke="#fff" strokeWidth={4} />,
        },
        {
            id: 'stein',
            x: sx,
            y: sy,
            navn: 'stein',
            form: <path d="M -38 26 Q -44 -14 -6 -26 Q 36 -30 40 6 Q 42 28 -38 26 Z" fill="#57534e" stroke="#fff" strokeWidth={4} />,
        },
        {
            id: 'tre',
            x: tx,
            y: ty,
            navn: 'tre',
            form: (
                <>
                    <rect x={-7} y={0} width={14} height={30} fill="#78350f" />
                    <path d="M -38 6 L 0 -60 L 38 6 Z" fill="#15803d" stroke="#fff" strokeWidth={4} />
                </>
            ),
        },
    ];
    return (
        <>
            {ting.map((t, i) => (
                <motion.g
                    key={t.id}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.5 }}
                    style={{ transformOrigin: `${t.x}px ${t.y}px`, transformBox: 'view-box' }}
                >
                    <g transform={`translate(${t.x} ${t.y})`}>{t.form}</g>
                    <text
                        x={t.x}
                        y={t.y + 76}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#1c1917"
                        stroke="#fff"
                        strokeWidth={8}
                        paintOrder="stroke"
                    >
                        {t.navn}
                    </text>
                </motion.g>
            ))}
        </>
    );
}

export function EtikkKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'india';
    const { geographies } = useFilmVerden(UTSNITT[modus]);
    const projeksjon = useMemo(() => projeksjonFor(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const xy = (ll: LL) => projeksjon(ll) as [number, number];
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];

    return (
        <div className="absolute inset-0" style={{ background: modus === 'india' ? '#cfe3f0' : '#c9dbe8' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <defs>
                    <clipPath id="etikk-land">
                        {geographies.map((g, i) => (
                            <path key={`c-${g.id ?? 'x'}-${i}`} d={sti(g as never) ?? undefined} />
                        ))}
                    </clipPath>
                    <filter id="etikk-uskarp" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation={28} />
                    </filter>
                </defs>
                {geographies.map((g, i) => (
                    <path
                        key={`${g.id ?? 'x'}-${i}`}
                        d={sti(g as never) ?? undefined}
                        fill={landFarge(modus, Number(g.id))}
                        stroke="#a8a29e"
                        strokeWidth={1.2}
                    />
                ))}

                {modus === 'india' && (
                    <>
                        {(() => {
                            const [x, y] = xy([79, 21]);
                            return <Etikett x={x} y={y} tekst="INDIA" farge="#831843" fs={60} />;
                        })()}
                    </>
                )}

                {modus === 'sapmi' && (
                    <>
                        <g clipPath="url(#etikk-land)">
                            <g filter="url(#etikk-uskarp)" opacity={0.75}>
                                {SKY.map((ll, i) => {
                                    const [x, y] = xy(ll);
                                    return <circle key={i} cx={x} cy={y} r={70} fill="#0ea5e9" />;
                                })}
                            </g>
                        </g>
                        {beat === 0 &&
                            (() => {
                                const [x, y] = xy([22, 66.3]);
                                return (
                                    <>
                                        <Etikett x={x} y={y} tekst="Samiske områder" farge="#075985" fs={50} />
                                        <Etikett x={x} y={y + 50} tekst="(omtrentlig)" farge="#075985" fs={42} />
                                    </>
                                );
                            })()}
                        {beat === 1 && <Natur xy={xy} />}
                        {beat >= 2 &&
                            (() => {
                                const [x, y] = xy([10.5, 61.6]);
                                return <Etikett x={x} y={y} tekst="NORGE" farge="#57534e" fs={40} />;
                            })()}
                    </>
                )}

                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={B / 2}
                        y={92}
                        textAnchor="middle"
                        fontSize={58}
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
