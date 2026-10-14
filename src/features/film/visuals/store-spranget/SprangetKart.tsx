import { memo, useMemo, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoContains, geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';
import { frø } from './felles3d';

/**
 * Kart over Kina under kulturrevolusjonen. Skjematisk: byer og leirer er ikke navngitt.
 * «garde»: Beijing lyser, de første rødegardistene samles der og sprer seg over hele landet.
 * «leirer»: piler fra byene ut til leirer på landsbygda. Leirene gråner.
 * «deng»: landet grått etter Mao. Til slutt lyser kysten opp når landet åpner for handel.
 */

type Modus = 'garde' | 'leirer' | 'deng';
type LngLat = [number, number];

const B = 1600;
const H = 900;
const KINA = '156';
const BEIJING: LngLat = [116.4, 39.9];
const BYER: LngLat[] = [
    BEIJING,
    [121.5, 31.2],
    [113.3, 23.1],
    [114.3, 30.6],
    [104.1, 30.7],
    [108.9, 34.3],
];
const LEIRER: LngLat[] = [
    [87.5, 43.5],
    [101.5, 36.5],
    [95, 31],
    [125, 46.5],
    [106.5, 26.5],
    [111, 41.5],
];
const KYST: LngLat[] = [
    [121.5, 31.2],
    [113.3, 23.1],
    [119.3, 26.1],
    [120.4, 36.1],
    [117.2, 39.1],
    [110.3, 20.1],
];
const PRIKKER = 140;

export function SprangetKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'garde';
    const { geographies } = useAtlasWorld();
    const kina = geographies.find((g) => String(g.id) === KINA);

    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [40, 60],
                    [900, 860],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [74, 19],
                        [134, 53],
                    ],
                } as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];

    // Rødegardistene: punkter spredt inne i Kina, sortert etter avstand fra Beijing.
    const prikker = useMemo(() => {
        if (!kina) return [];
        const ut: LngLat[] = [];
        for (let i = 0; ut.length < PRIKKER && i < 3000; i++) {
            const ll: LngLat = [76 + frø(i) * 57, 20 + frø(i + 5000) * 32];
            if (geoContains(kina as never, ll)) ut.push(ll);
        }
        return ut
            .map((ll) => ({ ll, d: Math.hypot(ll[0] - BEIJING[0], ll[1] - BEIJING[1]) }))
            .sort((a, b) => a.d - b.d);
    }, [kina]);

    const [bx, by] = p(BEIJING);
    const kinaFarge =
        modus === 'deng' && beat < 3 ? '#d6d3d1' : modus === 'leirer' ? '#e7dcc4' : '#f6dfb8';

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <marker
                        id="sk-pil"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#7f1d1d" />
                    </marker>
                    <marker
                        id="sk-pil-bla"
                        viewBox="0 0 10 10"
                        refX="6"
                        refY="5"
                        markerWidth="4"
                        markerHeight="4"
                        orient="auto-start-reverse"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#0369a1" />
                    </marker>
                </defs>
                <Land geographies={geographies} sti={sti} />
                {kina && (
                    <motion.path
                        d={sti(kina as never) ?? ''}
                        initial={false}
                        animate={{ fill: kinaFarge }}
                        transition={{ duration: 1 }}
                        stroke="#78716c"
                        strokeWidth={2.5}
                    />
                )}
                <text
                    x={p([96, 35])[0]}
                    y={p([96, 35])[1]}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#78716c"
                    opacity={0.55}
                    stroke="#fff"
                    strokeWidth={3}
                    paintOrder="stroke"
                >
                    KINA
                </text>

                {modus === 'garde' && (
                    <g>
                        {prikker.map(({ ll }, i) => {
                            const [x, y] = p(ll);
                            const ute = beat >= 3;
                            const vis = beat >= 2 && (ute || i < 14);
                            const nær = i < 14;
                            return (
                                <motion.circle
                                    key={i}
                                    r={7}
                                    fill="#dc2626"
                                    stroke="#fff"
                                    strokeWidth={1.5}
                                    initial={{ cx: bx, cy: by, opacity: 0 }}
                                    animate={{
                                        cx: ute ? x : bx + (nær ? Math.cos(i) * 22 : 0),
                                        cy: ute ? y : by + (nær ? Math.sin(i) * 22 : 0),
                                        opacity: vis ? 1 : 0,
                                    }}
                                    transition={{
                                        duration: 1.6,
                                        delay: ute ? 0.3 + (i / PRIKKER) * 2.2 : 0.4 + i * 0.05,
                                    }}
                                />
                            );
                        })}
                        <motion.circle
                            cx={bx}
                            cy={by}
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth={5}
                            initial={{ r: 14, opacity: 0.9 }}
                            animate={{ r: [14, 60], opacity: [0.9, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                        />
                    </g>
                )}

                {modus === 'leirer' &&
                    BYER.map((by_, i) => {
                        const [x1, y1] = p(by_);
                        const [x2, y2] = p(LEIRER[i]);
                        return (
                            <g key={i}>
                                <motion.path
                                    d={`M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 90} ${x2} ${y2}`}
                                    fill="none"
                                    stroke="#7f1d1d"
                                    strokeWidth={6}
                                    strokeDasharray="4 12"
                                    strokeLinecap="round"
                                    markerEnd="url(#sk-pil)"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1, opacity: beat >= 2 ? 0.35 : 1 }}
                                    transition={{ duration: 1.4, delay: 0.3 + i * 0.25 }}
                                />
                                <motion.rect
                                    x={x2 - 18}
                                    y={y2 - 18}
                                    width={36}
                                    height={36}
                                    rx={4}
                                    initial={{ fill: '#57534e', opacity: 0 }}
                                    animate={{
                                        fill: beat >= 1 ? '#a8a29e' : '#57534e',
                                        opacity: 1,
                                    }}
                                    transition={{ delay: 1 + i * 0.25, duration: 0.8 }}
                                    stroke="#fff"
                                    strokeWidth={3}
                                />
                                <circle
                                    cx={x1}
                                    cy={y1}
                                    r={11}
                                    fill="#1e293b"
                                    stroke="#fff"
                                    strokeWidth={3}
                                />
                            </g>
                        );
                    })}

                {modus === 'deng' &&
                    beat >= 3 &&
                    KYST.map((k, i) => {
                        const [x, y] = p(k);
                        return (
                            <g key={i}>
                                <motion.circle
                                    cx={x}
                                    cy={y}
                                    fill="#fbbf24"
                                    stroke="#fff"
                                    strokeWidth={3}
                                    initial={{ r: 0 }}
                                    animate={{ r: 14 }}
                                    transition={{ delay: 0.3 + i * 0.2, type: 'spring' }}
                                />
                                <motion.path
                                    d={`M ${x + 16} ${y} L ${x + 120} ${y + 30 - i * 6}`}
                                    stroke="#0369a1"
                                    strokeWidth={6}
                                    strokeLinecap="round"
                                    markerEnd="url(#sk-pil-bla)"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.8 + i * 0.2, duration: 0.8 }}
                                />
                            </g>
                        );
                    })}

                {/* Beijing */}
                <circle cx={bx} cy={by} r={13} fill="#7f1d1d" stroke="#fff" strokeWidth={4} />
                <text x={bx + 22} y={by - 16} fontSize={38} fontWeight={800} fill="#1c1917">
                    Beijing
                </text>
                {modus === 'leirer' && (
                    <g>
                        <rect x={60} y={790} width={22} height={22} rx={3} fill="#57534e" />
                        <text x={94} y={810} fontSize={28} fontWeight={700} fill="#334155">
                            leir på landsbygda (skjematisk)
                        </text>
                    </g>
                )}
            </svg>
            <Kort modus={modus} beat={beat} />
        </div>
    );
}

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies
                .filter((g) => String(g.id) !== KINA)
                .map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill="#efe9dc"
                        stroke="#a8a08a"
                        strokeWidth={1.5}
                    />
                ))}
        </>
    );
});

const OVERSKRIFT: Record<Modus, string[]> = {
    garde: [
        'April 1966: kulturrevolusjonen',
        'Mål: knuse motstanderne',
        'Mai 1966: de første rødegardistene',
        'Over hele Kina',
        'Armbind og den lille røde',
    ],
    leirer: [
        'Sendt til leirer på landsbygda',
        'Mange overlevde ikke',
        'Selv presidenten',
        'Frykt i familiene',
    ],
    deng: [
        'September 1976: Mao dør',
        'Banden av fire arrestert',
        'Deng kommer tilbake',
        'Kina åpner for handel',
    ],
};

function Kort({ modus, beat }: { modus: Modus; beat: number }) {
    const liste = OVERSKRIFT[modus];
    const tittel = liste[Math.min(beat, liste.length - 1)];
    let innhold: ReactNode = null;
    if (modus === 'garde' && beat === 3)
        innhold = (
            <Teller
                verdi={11}
                etikett="millioner unge, på det meste"
                forsinkelse={0.6}
                tone="rod"
            />
        );
    if (modus === 'garde' && beat >= 4)
        innhold = (
            <div className="flex items-end gap-6">
                <svg viewBox="0 0 120 120" className="w-28 h-28">
                    <rect x={10} y={40} width={100} height={40} rx={8} fill="#dc2626" />
                    <text
                        x={60}
                        y={68}
                        textAnchor="middle"
                        fontSize={20}
                        fontWeight={800}
                        fill="#fde047"
                    >
                        armbind
                    </text>
                </svg>
                <svg viewBox="0 0 120 120" className="w-28 h-28">
                    <rect x={25} y={12} width={70} height={96} rx={6} fill="#b91c1c" />
                    <rect x={33} y={12} width={6} height={96} fill="#7f1d1d" />
                    <circle cx={64} cy={50} r={13} fill="#fde047" />
                </svg>
            </div>
        );
    if (modus === 'garde' && beat === 1)
        innhold = (
            <p className="text-2xl font-semibold text-slate-700">
                Det egentlige målet var full kontroll.
            </p>
        );
    if (modus === 'garde' && beat === 0)
        innhold = <p className="text-2xl font-semibold text-slate-700">Gammel kultur skal bort.</p>;
    if (modus === 'garde' && beat === 2)
        innhold = (
            <p className="text-2xl font-semibold text-slate-700">Elever og studenter i Beijing</p>
        );
    if (modus === 'leirer' && beat === 0)
        innhold = (
            <p className="text-2xl font-semibold text-slate-700">
                Leger, forfattere og kunstnere skulle omskoleres: lære å tenke på nytt.
            </p>
        );
    if (modus === 'leirer' && beat === 1)
        innhold = (
            <p className="text-2xl font-semibold text-slate-700">
                Leirene ble det siste stedet for mange.
            </p>
        );
    if (modus === 'leirer' && beat === 2)
        innhold = (
            <div>
                <div className="font-display font-black text-3xl text-slate-900">Liu Shaoqi</div>
                <div className="text-xl font-semibold text-slate-600">Kinas president</div>
                <div className="mt-2 text-2xl font-bold text-red-700">Døde i fengsel, 1969</div>
            </div>
        );
    if (modus === 'leirer' && beat >= 3)
        innhold = (
            <svg viewBox="0 0 240 130" className="w-60">
                <circle cx={60} cy={30} r={16} fill="#475569" />
                <rect x={42} y={50} width={36} height={60} rx={14} fill="#475569" />
                <circle cx={180} cy={44} r={12} fill="#475569" />
                <rect x={166} y={60} width={28} height={50} rx={11} fill="#475569" />
                <path
                    d="M 120 10 L 108 45 L 128 70 L 112 120"
                    stroke="#dc2626"
                    strokeWidth={7}
                    fill="none"
                    strokeLinejoin="round"
                />
            </svg>
        );
    if (modus === 'deng' && beat === 0)
        innhold = (
            <p className="text-2xl font-semibold text-slate-700">To katastrofer på under 20 år</p>
        );
    if (modus === 'deng' && beat === 1)
        innhold = (
            <div>
                <div className="flex gap-2 mb-2">
                    {[0, 1, 2, 3].map((i) => (
                        <svg key={i} viewBox="0 0 40 60" className="w-10 h-14">
                            <circle cx={20} cy={14} r={10} fill={i === 0 ? '#b91c1c' : '#475569'} />
                            <rect
                                x={8}
                                y={28}
                                width={24}
                                height={30}
                                rx={9}
                                fill={i === 0 ? '#b91c1c' : '#475569'}
                            />
                        </svg>
                    ))}
                </div>
                <p className="text-xl font-semibold text-slate-700">
                    Ledet av Maos kone, Jiang Qing
                </p>
            </div>
        );
    if (modus === 'deng' && beat === 2)
        innhold = (
            <div className="flex items-center gap-3 text-xl font-bold">
                <div className="px-3 py-2 rounded-xl bg-stone-200 text-stone-700">
                    1967: tvangsarbeid
                </div>
                <span className="text-3xl">→</span>
                <div className="px-3 py-2 rounded-xl bg-amber-300 text-amber-950">
                    1978: mektigst
                </div>
            </div>
        );
    if (modus === 'deng' && beat >= 3)
        innhold = (
            <p className="text-2xl font-semibold text-slate-700">
                Men partiet bestemmer fortsatt over alt.
            </p>
        );
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${modus}-${beat}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 20 }}
                className="absolute right-[4%] top-[12%] w-[24rem] p-6 rounded-3xl bg-white/95 shadow-2xl flex flex-col gap-4"
            >
                <div
                    className={`font-display font-black text-3xl ${modus === 'leirer' || (modus === 'garde' && beat === 1) ? 'text-red-700' : 'text-slate-900'}`}
                >
                    {tittel}
                </div>
                {innhold}
            </motion.div>
        </AnimatePresence>
    );
}
