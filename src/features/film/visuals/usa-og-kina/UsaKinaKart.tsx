import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Cpu, Factory, Shirt, Smartphone, ToyBrick } from 'lucide-react';
import { geoNaturalEarth1, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { Oversiktskart } from '../../kart/Oversiktskart';
import { useFilmVerden, type Utsnitt } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';
import { EU_GUL, KINA_RØD, TAIWAN_TEAL, USA_BLÅ } from './felles3d';
import { Overskrift } from './overskrift';

/**
 * Kart til filmen om USA og Kina.
 * - «handel»: Stillehavet. Skipene, varene hver vei i 2018 og handelsunderskuddet.
 * - «pause»: Genève i mai 2025, striden i oktober og pausen i Sør-Korea.
 * - «taiwan»: øya, TSMC, Kinas krav og våpnene fra USA.
 * - «europa»: Europa mellom de to, og ønsket om å handle med flere land.
 */

type Modus = 'handel' | 'pause' | 'taiwan' | 'europa';
type LngLat = [number, number];
type Proj = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;
const KINA = '156';
const USA = '840';
const TAIWAN = '158';
const SVEITS = '756';
const SØR_KOREA = '410';
const NORGE = '578';
const EU = [
    '040', '056', '100', '191', '196', '203', '208', '233', '246', '250', '276', '300', '348',
    '372', '380', '428', '440', '442', '470', '528', '616', '620', '642', '703', '705', '724', '752',
];

const SHANGHAI: LngLat = [121.5, 31.2];
const LOS_ANGELES: LngLat = [-118.3, 33.7];
const GENEVE: LngLat = [6.14, 46.2];
const SEOUL: LngLat = [127.5, 36.3];
const TAIPEI: LngLat = [121.0, 23.7];

/** Sjøruta over Stillehavet, med mellompunkter så den følger havet. */
const RUTE: LngLat[] = [SHANGHAI, [135, 30], [165, 34], [-160, 35], [-135, 34], LOS_ANGELES];

const OPPSETT: Record<Modus, { rot: number; utsnitt: [LngLat, LngLat] }> = {
    handel: { rot: -165, utsnitt: [[82, 2], [-62, 60]] },
    pause: { rot: -60, utsnitt: [[-14, 18], [140, 64]] },
    taiwan: { rot: -118, utsnitt: [[104, 16], [134, 38]] },
    europa: { rot: -10, utsnitt: [[-128, -8], [146, 66]] },
};

const OVERSKRIFT: Record<Modus, string[]> = {
    handel: [
        'Handel over Stillehavet',
        '2018: USA kjøper fra Kina',
        '2018: USA selger til Kina',
        'Et handelsunderskudd for USA',
        'Hva fikk de to landene?',
    ],
    pause: [
        'Mai 2025: Genève',
        'Tollen går kraftig ned',
        'Oktober: nytt krav fra Kina',
        'Trump truer med ny toll',
        '30. oktober: pause i Sør-Korea',
    ],
    taiwan: ['Taiwan', 'TSMC på Taiwan', 'Kina: Taiwan er en del av Kina', 'USA selger våpen til Taiwan', 'Hvis det blir krig om Taiwan'],
    europa: [
        'Europa midt imellom',
        'Ifølge et dansk leksikon: EU størst',
        'EU-kommisjonens leder, 2023',
        'EU: redusere risikoen',
    ],
};

export function UsaKinaKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'handel';
    const oppsett = OPPSETT[modus];
    const utsnitt: Utsnitt | undefined = modus === 'taiwan' ? [[100, 14], [138, 40]] : undefined;
    const { geographies } = useFilmVerden(utsnitt);
    const projeksjon = useMemo(() => {
        const [[v, s], [o, n]] = oppsett.utsnitt;
        return geoNaturalEarth1()
            .rotate([oppsett.rot, 0])
            .fitExtent(
                [
                    [40, 110],
                    [B - 40, H - 30],
                ],
                { type: 'MultiPoint', coordinates: [[v, s], [o, s], [o, n], [v, n]] } as never
            );
    }, [oppsett]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p: Proj = (ll) => projeksjon(ll) as [number, number];
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];

    const farger: Record<string, string> = {};
    if (modus === 'handel') {
        farger[KINA] = '#fca5a5';
        farger[USA] = '#93c5fd';
    } else if (modus === 'pause') {
        farger[KINA] = beat >= 2 ? '#fca5a5' : '#fecaca';
        if (beat <= 1) farger[SVEITS] = '#fde68a';
        if (beat >= 4) farger[SØR_KOREA] = '#fde68a';
    } else if (modus === 'taiwan') {
        farger[TAIWAN] = '#5eead4';
        if (beat >= 2) farger[KINA] = '#fca5a5';
    } else {
        farger[KINA] = '#fca5a5';
        farger[USA] = '#93c5fd';
        for (const id of EU) farger[id] = '#fde68a';
        farger[NORGE] = '#fcd34d';
    }

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    {[
                        ['rod', KINA_RØD],
                        ['bla', USA_BLÅ],
                        ['gul', '#a16207'],
                    ].map(([id, f]) => (
                        <marker
                            key={id}
                            id={`uk-pil-${id}`}
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="3"
                            markerHeight="3"
                            orient="auto-start-reverse"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 z" fill={f} />
                        </marker>
                    ))}
                </defs>
                <Land geographies={geographies} sti={sti} farger={farger} />
                {modus === 'handel' && <Handel beat={beat} p={p} sti={sti} />}
                {modus === 'pause' && <Pause beat={beat} p={p} />}
                {modus === 'taiwan' && <Taiwan beat={beat} p={p} />}
                {modus === 'europa' && <Europa beat={beat} p={p} />}
            </svg>

            <AnimatePresence mode="wait">
                <Overskrift key={tekst} tekst={tekst} />
            </AnimatePresence>

            {modus === 'taiwan' && (
                <Oversiktskart
                    utsnitt={[[104, 16], [134, 38]]}
                    omrade={[[60, -10], [180, 60]]}
                    plassering="nede-venstre"
                    etikett="Øst-Asia"
                />
            )}

            <AnimatePresence>
                {modus === 'handel' && beat === 3 && (
                    <Kort key="under" plass="nede-midt">
                        <Underskudd />
                    </Kort>
                )}
                {modus === 'handel' && beat >= 4 && (
                        <Kort key="usa-fikk" plass="nede-hoyre">
                            <Fikk
                                tittel="Amerikanerne fikk"
                                farge={USA_BLÅ}
                                ting={[
                                    [Shirt, 'billige klær'],
                                    [ToyBrick, 'leker'],
                                    [Smartphone, 'mobiler'],
                                ]}
                            />
                        </Kort>
                )}
                {modus === 'handel' && beat >= 4 && (
                        <Kort key="kina-fikk" plass="nede-venstre">
                            <Fikk
                                tittel="Kina fikk"
                                farge={KINA_RØD}
                                ting={[
                                    [Briefcase, 'jobber'],
                                    [Factory, 'penger til å bygge landet'],
                                ]}
                            />
                        </Kort>
                )}
                {modus === 'pause' && beat === 1 && (
                    <Kort key="ned" plass="nede-midt">
                        <div className="flex gap-4">
                            <TollNed land="USAs toll på Kina" fra={145} til={30} farge={USA_BLÅ} />
                            <TollNed land="Kinas toll på USA" fra={125} til={10} farge={KINA_RØD} />
                        </div>
                    </Kort>
                )}
                {modus === 'pause' && beat === 2 && (
                    <Kort key="krav" plass="nede-midt">
                        <Tekstkort
                            farge={KINA_RØD}
                            tittel="Kina krever søknad"
                            tekst="for å selge varer av sjeldne jordarter til utlandet"
                        />
                    </Kort>
                )}
                {modus === 'pause' && beat === 3 && (
                    <Kort key="trussel" plass="nede-midt">
                        <Tekstkort farge={USA_BLÅ} tittel="Trump truer med 100 % toll" tekst="som svar på kravet fra Kina" />
                    </Kort>
                )}
                {modus === 'pause' && beat >= 4 && (
                    <Kort key="pause" plass="nede-midt">
                        <div className="flex gap-3">
                            <Tekstkort farge={USA_BLÅ} tittel="USA" tekst="dropper den nye tollen" />
                            <Tekstkort farge={KINA_RØD} tittel="Kina" tekst="venter ett år med reglene" />
                        </div>
                    </Kort>
                )}
                {modus === 'taiwan' && beat === 1 && (
                    <Kort key="tsmc" plass="oppe-hoyre">
                        <Andel />
                    </Kort>
                )}
                {modus === 'taiwan' && beat >= 4 && (
                    <Kort key="mangel" plass="nede-hoyre">
                        <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/95 shadow-xl">
                            <Cpu className="w-14 h-14 text-slate-400" />
                            <div>
                                <div className="font-display font-black text-3xl text-slate-900">Mangel i hele verden?</div>
                                <div className="text-2xl font-semibold text-slate-600">på de beste brikkene</div>
                            </div>
                        </div>
                    </Kort>
                )}
                {modus === 'europa' && beat === 2 && (
                    <Kort key="vdl" plass="nede-midt">
                        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl max-w-[44rem]">
                            <div className="text-xl font-bold text-amber-700">Ursula von der Leyen sa:</div>
                            <div className="font-display font-black text-3xl text-slate-900 leading-tight">
                                Det er verken mulig eller lurt å kutte all handel med Kina
                            </div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </div>
    );
}

const Land = memo(function Land({
    geographies,
    sti,
    farger,
}: {
    geographies: GeoFeature[];
    sti: GeoPath;
    farger: Record<string, string>;
}) {
    return (
        <g>
            {geographies.map((g, i) => {
                const id = String(g.id).padStart(3, '0');
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farger[id] ?? '#f1ede4'}
                        stroke="#94a3b8"
                        strokeWidth={0.8}
                        style={{ transition: 'fill 0.8s' }}
                    />
                );
            })}
        </g>
    );
});

function Navn({ ll, p, tekst, farge, dy = 0 }: { ll: LngLat; p: Proj; tekst: string; farge: string; dy?: number }) {
    const [x, y] = p(ll);
    return (
        <text
            x={x}
            y={y + dy}
            textAnchor="middle"
            fontSize={52}
            fontWeight={900}
            fill={farge}
            stroke="#fff"
            strokeWidth={8}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Pinne({ ll, p, farge }: { ll: LngLat; p: Proj; farge: string }) {
    const [x, y] = p(ll);
    return (
        <g>
            <circle cx={x} cy={y} r={30} fill={farge} opacity={0.25}>
                <animate attributeName="r" values="18;40;18" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx={x} cy={y} r={14} fill={farge} stroke="#fff" strokeWidth={4} />
        </g>
    );
}

/* ---------------- Handel ---------------- */

function Handel({ beat, p, sti }: { beat: number; p: Proj; sti: GeoPath }) {
    const rute = sti({ type: 'LineString', coordinates: RUTE } as never) ?? '';
    const tilbake = sti({ type: 'LineString', coordinates: [...RUTE].reverse() } as never) ?? '';
    const punkter = RUTE.map(p);
    // Skipene står fast langs ruta (de flytter seg ikke ut av bildet når skjermbildet tas).
    const skip = [0.2, 0.45, 0.7].map((f) => {
        const i = Math.min(punkter.length - 2, Math.floor(f * (punkter.length - 1)));
        const r = f * (punkter.length - 1) - i;
        const [x1, y1] = punkter[i];
        const [x2, y2] = punkter[i + 1];
        return [x1 + (x2 - x1) * r, y1 + (y2 - y1) * r];
    });
    return (
        <>
            {/* Ruta */}
            <path d={rute} fill="none" stroke="#64748b" strokeWidth={4} strokeDasharray="12 10" opacity={beat === 0 ? 0.9 : 0.3} />
            {beat === 0 &&
                skip.map(([x, y], i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.5, duration: 1.2 }}
                    >
                        <rect x={x - 34} y={y - 12} width={68} height={22} rx={6} fill="#1e3a8a" />
                        {[0, 1, 2, 3].map((k) => (
                            <rect key={k} x={x - 28 + k * 14} y={y - 26} width={12} height={14} fill={['#dc2626', '#ca8a04', '#16a34a', '#2563eb'][k]} />
                        ))}
                    </motion.g>
                ))}
            {/* Varer fra Kina til USA: tykk pil */}
            {beat >= 1 && beat <= 3 && (
                <motion.path
                    d={rute}
                    fill="none"
                    stroke={KINA_RØD}
                    strokeWidth={45}
                    strokeLinecap="butt"
                    opacity={0.85}
                    markerEnd="url(#uk-pil-rod)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                    transform="translate(0 -40)"
                />
            )}
            {/* Varer fra USA til Kina: tynn pil, 120,1 mot 539,6 */}
            {beat >= 2 && beat <= 3 && (
                <motion.path
                    d={tilbake}
                    fill="none"
                    stroke={USA_BLÅ}
                    strokeWidth={10}
                    markerEnd="url(#uk-pil-bla)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                    transform="translate(0 50)"
                />
            )}
            {beat >= 1 && beat <= 2 && (
                <Tall x={B / 2} y={290} farge={KINA_RØD} tall="539,6 mrd. dollar" under="varer fra Kina til USA" />
            )}
            {beat === 2 && (
                <Tall x={B / 2} y={640} farge={USA_BLÅ} tall="120,1 mrd. dollar" under="varer fra USA til Kina" />
            )}
            <Navn ll={[104, 36]} p={p} tekst="KINA" farge={KINA_RØD} />
            <Navn ll={[-100, 40]} p={p} tekst="USA" farge={USA_BLÅ} />
        </>
    );
}

function Tall({ x, y, farge, tall, under }: { x: number; y: number; farge: string; tall: string; under: string }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <rect x={x - 260} y={y - 70} width={520} height={120} rx={22} fill="#fff" stroke={farge} strokeWidth={5} />
            <text x={x} y={y} textAnchor="middle" fontSize={58} fontWeight={900} fill={farge}>
                {tall}
            </text>
            <text x={x} y={y + 38} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                {under}
            </text>
        </motion.g>
    );
}

/** Kjøpt og solgt som to stolper i riktig forhold, med gapet markert. */
function Underskudd() {
    const maks = 539.6;
    const bredde = 560;
    return (
        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl" style={{ width: 760 }}>
            {[
                ['USA kjøpte', 539.6, KINA_RØD],
                ['USA solgte', 120.1, USA_BLÅ],
            ].map(([t, verdi, f]) => (
                <div key={t as string} className="flex items-center gap-3 mb-2">
                    <div className="text-xl font-bold text-slate-700" style={{ width: 140 }}>
                        {t as string}
                    </div>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: ((verdi as number) / maks) * bredde }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="rounded-md"
                        style={{ height: 30, background: f as string }}
                    />
                </div>
            ))}
            <div className="flex items-baseline gap-3 mt-1">
                <div className="font-display font-black text-3xl text-slate-900">Underskudd med Kina, 2018: over 400 mrd. dollar</div>
            </div>
        </div>
    );
}

function Fikk({
    tittel,
    farge,
    ting,
}: {
    tittel: string;
    farge: string;
    ting: [typeof Shirt, string][];
}) {
    return (
        <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl">
            <div className="font-display font-black text-2xl" style={{ color: farge }}>
                {tittel}
            </div>
            <div className="mt-1 flex flex-col gap-1">
                {ting.map(([I, t], i) => (
                    <motion.div
                        key={t}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.4 }}
                        className="flex items-center gap-2 text-2xl font-bold text-slate-800"
                    >
                        <I className="w-7 h-7" style={{ color: farge }} />
                        <span>{t}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* ---------------- Pause ---------------- */

function Pause({ beat, p }: { beat: number; p: Proj }) {
    const [gx, gy] = p(GENEVE);
    const [sx, sy] = p(SEOUL);
    return (
        <>
            {beat !== 1 && <Navn ll={[100, 36]} p={p} tekst="KINA" farge={KINA_RØD} />}
            {beat <= 1 && <Pinne ll={GENEVE} p={p} farge="#a16207" />}
            {beat === 0 && (
                <>
                    <text x={gx} y={gy - 40} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                        Genève, Sveits
                    </text>
                </>
            )}
            {beat >= 4 && (
                <>
                    <Pinne ll={SEOUL} p={p} farge="#a16207" />
                    <text x={sx} y={sy - 40} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f172a" stroke="#fff" strokeWidth={8} paintOrder="stroke">
                        Sør-Korea
                    </text>
                    <text x={sx} y={sy + 60} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155" stroke="#fff" strokeWidth={6} paintOrder="stroke">
                        Trump og Xi Jinping
                    </text>
                </>
            )}
        </>
    );
}

function TollNed({ land, fra, til, farge }: { land: string; fra: number; til: number; farge: string }) {
    const skala = 1.2;
    return (
        <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl" style={{ width: 300 }}>
            <div className="text-xl font-bold text-slate-700">{land}</div>
            <div className="flex items-end gap-3 mt-2" style={{ height: 240 }}>
                <div className="flex flex-col items-center">
                    <div className="text-2xl font-black text-slate-600">{fra} %</div>
                    <div className="rounded-t-md" style={{ width: 70, height: fra * skala, background: '#cbd5e1' }} />
                </div>
                <div className="text-4xl font-black text-slate-500 pb-4">→</div>
                <div className="flex flex-col items-center">
                    <div className="text-3xl font-black" style={{ color: farge }}>
                        {til} %
                    </div>
                    <motion.div
                        initial={{ height: fra * skala }}
                        animate={{ height: til * skala }}
                        transition={{ duration: 1.4, delay: 0.6 }}
                        className="rounded-t-md"
                        style={{ width: 70, background: farge }}
                    />
                </div>
            </div>
            <div className="text-xl font-bold text-slate-700 mt-1">april → mai 2025</div>
        </div>
    );
}

/* ---------------- Taiwan ---------------- */

function Taiwan({ beat, p }: { beat: number; p: Proj }) {
    const [tx, ty] = p(TAIPEI);
    return (
        <>
            <Navn ll={[112, 31]} p={p} tekst="KINA" farge={KINA_RØD} />
            <text x={tx + 100} y={ty + 20} fontSize={52} fontWeight={900} fill={TAIWAN_TEAL} stroke="#fff" strokeWidth={8} paintOrder="stroke">
                TAIWAN
            </text>
            {beat === 1 && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, type: 'spring' }} style={{ transformOrigin: `${tx}px ${ty}px` }}>
                    <rect x={tx - 30} y={ty - 30} width={60} height={60} rx={8} fill="#111827" stroke="#5eead4" strokeWidth={4} />
                    <rect x={tx - 14} y={ty - 14} width={28} height={28} fill="#5eead4" />
                </motion.g>
            )}
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                    <ellipse cx={tx} cy={ty} rx={80} ry={130} fill="none" stroke={KINA_RØD} strokeWidth={6} strokeDasharray="16 12" />
                    {beat === 2 && (
                        <g>
                            <rect x={tx + 150} y={ty - 330} width={440} height={110} rx={20} fill={KINA_RØD} />
                            <text x={tx + 370} y={ty - 285} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                                Kina mener: Taiwan er
                            </text>
                            <text x={tx + 370} y={ty - 243} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                                en del av Kina
                            </text>
                        </g>
                    )}
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <motion.path
                        d={`M ${B - 60} ${ty - 120} Q ${tx + 360} ${ty - 160} ${tx + 110} ${ty - 40}`}
                        fill="none"
                        stroke={USA_BLÅ}
                        strokeWidth={12}
                        markerEnd="url(#uk-pil-bla)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, delay: 0.5 }}
                    />
                    <rect x={B - 420} y={ty - 270} width={360} height={90} rx={20} fill={USA_BLÅ} />
                    <text x={B - 240} y={ty - 212} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                        Våpen fra USA
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Andel() {
    return (
        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl" style={{ width: 520 }}>
            <div className="text-2xl font-bold text-slate-700">TSMC lager</div>
            <div className="font-display font-black text-5xl" style={{ color: TAIWAN_TEAL }}>
                over 90 %
            </div>
            <div className="text-xl font-semibold text-slate-600">av verdens mest avanserte databrikker</div>
            <div className="mt-3 rounded-full bg-slate-200 overflow-hidden" style={{ height: 26 }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '91%' }}
                    transition={{ duration: 1.4, delay: 0.6 }}
                    style={{ height: 26, background: TAIWAN_TEAL }}
                />
            </div>
        </div>
    );
}

/* ---------------- Europa ---------------- */

/** Punkter rundt i verden som står for «flere land å handle med». De har bevisst ikke navn. */
const ANDRE: LngLat[] = [
    [78, 22],
    [-50, -12],
    [25, -15],
    [135, -25],
    [-74, 6],
];

function Europa({ beat, p }: { beat: number; p: Proj }) {
    const kina = p([104, 34]);
    const usa = p([-98, 39]);
    const europa = p([12, 50]);
    const bue = (a: [number, number], b: [number, number], løft: number) =>
        `M ${a[0]} ${a[1]} Q ${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2 - løft} ${b[0]} ${b[1]}`;
    return (
        <>
            <Navn ll={[104, 34]} p={p} tekst="KINA" farge={KINA_RØD} dy={70} />
            <Navn ll={[-98, 39]} p={p} tekst="USA" farge={USA_BLÅ} dy={70} />
            {beat < 3 && <Navn ll={[14, 47]} p={p} tekst="EUROPA" farge="#a16207" dy={70} />}
            <text x={p([10, 63])[0]} y={p([10, 63])[1] - 20} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a" stroke="#fff" strokeWidth={6} paintOrder="stroke">
                Norge
            </text>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                    <path d={bue(europa, usa, 160)} fill="none" stroke="#a16207" strokeWidth={8} strokeDasharray="14 10" />
                    <path d={bue(europa, kina, 160)} fill="none" stroke="#a16207" strokeWidth={8} strokeDasharray="14 10" />
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    <motion.path d={bue(kina, europa, 140)} fill="none" stroke={KINA_RØD} strokeWidth={12} markerEnd="url(#uk-pil-rod)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4 }} />
                    <motion.path d={bue(kina, usa, -200)} fill="none" stroke={KINA_RØD} strokeWidth={12} opacity={0.45} markerEnd="url(#uk-pil-rod)" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, delay: 0.4 }} />
                    <rect x={europa[0] - 520} y={europa[1] - 60} width={340} height={80} rx={18} fill={EU_GUL} />
                    <text x={europa[0] - 350} y={europa[1] - 7} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fff">
                        EU: nr. 1 kunde
                    </text>
                </motion.g>
            )}
            {beat >= 3 &&
                ANDRE.map((ll, i) => {
                    const m = p(ll);
                    return (
                        <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.3 }}>
                            <path d={bue(europa, m, 80)} fill="none" stroke="#a16207" strokeWidth={6} markerEnd="url(#uk-pil-gul)" />
                            <circle cx={m[0]} cy={m[1]} r={16} fill="#fde68a" stroke="#a16207" strokeWidth={4} />
                        </motion.g>
                    );
                })}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    <rect x={B / 2 - 330} y={H - 130} width={660} height={90} rx={20} fill="#fff" />
                    <text x={B / 2} y={H - 72} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                        Handle med flere land
                    </text>
                </motion.g>
            )}
        </>
    );
}

/* ---------------- Felles kort ---------------- */

function Tekstkort({ farge, tittel, tekst }: { farge: string; tittel: string; tekst: string }) {
    return (
        <div className="px-6 py-3 rounded-2xl shadow-xl text-white max-w-[36rem]" style={{ background: farge }}>
            <div className="font-display font-black text-3xl">{tittel}</div>
            <div className="text-2xl font-semibold text-white/90">{tekst}</div>
        </div>
    );
}

function Kort({
    children,
    plass,
}: {
    children: React.ReactNode;
    plass: 'nede-venstre' | 'nede-hoyre' | 'nede-midt' | 'oppe-hoyre';
}) {
    const klasse =
        plass === 'nede-venstre'
            ? 'left-[3%] bottom-[6%]'
            : plass === 'nede-hoyre'
              ? 'right-[3%] bottom-[6%]'
              : plass === 'oppe-hoyre'
                ? 'right-[3%] top-[17%]'
              : 'inset-x-0 bottom-[6%] flex justify-center';
    return (
        <div className={`absolute ${klasse}`}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 20 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
