import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Lock } from 'lucide-react';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import { useAtlasWorld, type GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart til Deng-filmen.
 * - «sone»: Shenzhen blir spesiell økonomisk sone. Pengene kommer utenfra, resten av Kina er rødt.
 * - «utvide»: det som virker i sonen, sprer seg utover landet.
 * - «flytting»: kysten vokser, innlandet henger etter, og folk flytter mot byene.
 * - «beijing»: partiet styrer politikken, og Den himmelske freds plass i 1989.
 * - «hongkong»: Deng trekker seg, dør, og Hongkong blir levert tilbake.
 */

type Modus = 'sone' | 'utvide' | 'flytting' | 'beijing' | 'hongkong';
type LngLat = [number, number];
type Proj = (ll: LngLat) => [number, number];

const B = 1600;
const H = 900;
const KINA = '156';

const SHENZHEN: LngLat = [114.06, 22.54];
const HONGKONG: LngLat = [114.17, 22.3];
const BEIJING: LngLat = [116.4, 39.9];

const UTSNITT: Record<Modus, [LngLat, LngLat]> = {
    sone: [
        [96, 15],
        [130, 46],
    ],
    utvide: [
        [96, 15],
        [130, 46],
    ],
    flytting: [
        [76, 18],
        [132, 50],
    ],
    beijing: [
        [106, 33],
        [126, 44],
    ],
    hongkong: [
        [107, 19],
        [122, 27],
    ],
};

const OVERSKRIFT: Record<Modus, string[]> = {
    sone: [
        '1979: Shenzhen blir valgt',
        'En spesiell økonomisk sone',
        'Utenlandske selskaper kan investere',
        'I Shenzhen gjelder andre regler',
    ],
    utvide: ['Først i små soner', 'Det som virker, blir utvidet', 'Kina åpnes gradvis'],
    flytting: [
        'Kysten vokser, innlandet henger etter',
        'Rundt 300 millioner flytter til byene',
        'Korrupsjon',
        '2024: jobben er ikke ferdig',
    ],
    beijing: [
        'Markedet blir friere, men ikke politikken',
        '1989: Den himmelske freds plass',
        'Juni 1989: slått ned av militæret',
    ],
    hongkong: [
        'Deng trekker seg tilbake',
        'Fra 1979: Deng jobber med Hongkong-saken',
        '19. februar 1997: Deng dør',
        '1. juli 1997: Hongkong tilbake til Kina',
    ],
};

export function DengKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'sone';
    const { geographies } = useAtlasWorld();
    const projeksjon = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [60, 60],
                    [B - 60, H - 60],
                ],
                { type: 'MultiPoint', coordinates: UTSNITT[modus] } as never
            ),
        [modus]
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p: Proj = (ll) => projeksjon(ll) as [number, number];
    const kina = geographies.filter((g) => String(g.id) === KINA);
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];

    return (
        <div className="absolute inset-0 bg-[#cfe3ef] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <clipPath id="deng-kina">
                        {kina.map((g, i) => (
                            <path key={i} d={sti(g as never) ?? ''} />
                        ))}
                    </clipPath>
                    <radialGradient id="deng-glod">
                        <stop offset="0%" stopColor="#facc15" stopOpacity={0.95} />
                        <stop offset="70%" stopColor="#facc15" stopOpacity={0.55} />
                        <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
                    </radialGradient>
                    <linearGradient id="deng-kyst" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.75} />
                        <stop offset="55%" stopColor="#cbd5e1" stopOpacity={0.3} />
                        <stop offset="80%" stopColor="#facc15" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.9} />
                    </linearGradient>
                    {['bla', 'rod', 'gull'].map((f) => (
                        <marker
                            key={f}
                            id={`deng-pil-${f}`}
                            viewBox="0 0 10 10"
                            refX="6"
                            refY="5"
                            markerWidth="4"
                            markerHeight="4"
                            orient="auto-start-reverse"
                        >
                            <path
                                d="M 0 0 L 10 5 L 0 10 z"
                                fill={f === 'bla' ? '#1d4ed8' : f === 'rod' ? '#b91c1c' : '#b45309'}
                            />
                        </marker>
                    ))}
                </defs>
                <Land geographies={geographies} sti={sti} />

                {modus === 'sone' && <Sone beat={beat} p={p} />}
                {modus === 'utvide' && <Utvide beat={beat} p={p} />}
                {modus === 'flytting' && <Flytting beat={beat} p={p} />}
                {modus === 'beijing' && <Beijing beat={beat} p={p} />}
                {modus === 'hongkong' && <Hongkong beat={beat} p={p} />}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-white/95 shadow-xl text-3xl font-black text-slate-900 whitespace-nowrap"
                >
                    {tekst}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {modus === 'flytting' && beat === 1 && (
                    <Kort key="flytt" side="venstre">
                        <Teller verdi={300} etikett="millioner flytter til byene" prefiks="ca. " />
                    </Kort>
                )}
                {modus === 'flytting' && beat === 2 && (
                    <Kort key="korrupsjon" side="venstre">
                        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl max-w-[26rem]">
                            <div className="flex items-center gap-3 font-display font-black text-4xl text-red-700">
                                <Coins className="w-10 h-10" /> Korrupsjon
                            </div>
                            <div className="mt-2 text-2xl font-semibold text-slate-600">
                                Folk med makt tar imot penger for å gi andre fordeler
                            </div>
                        </div>
                    </Kort>
                )}
                {modus === 'flytting' && beat >= 3 && (
                    <Kort key="fattig" side="venstre">
                        <FemtenProsent />
                    </Kort>
                )}
                {modus === 'beijing' && beat === 0 && (
                    <Kort key="partiet" side="venstre">
                        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl">
                            <div className="flex items-center gap-3 font-display font-black text-3xl text-red-700">
                                <Lock className="w-9 h-9" /> Partiet bestemmer
                            </div>
                            {['hvem som styrer', 'hva avisene skriver', 'hva folk kan si'].map(
                                (t, i) => (
                                    <motion.div
                                        key={t}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 + i * 0.6 }}
                                        className="mt-2 text-2xl font-semibold text-slate-700"
                                    >
                                        {t}
                                    </motion.div>
                                )
                            )}
                        </div>
                    </Kort>
                )}
                {modus === 'beijing' && beat >= 2 && (
                    <Kort key="deng" side="venstre">
                        <div className="px-6 py-4 rounded-2xl bg-slate-900/90 shadow-xl text-white">
                            <div className="text-2xl font-semibold text-slate-300">
                                Studentene ville ha
                            </div>
                            <div className="font-display font-black text-3xl">
                                demokrati og pressefrihet
                            </div>
                            <div className="mt-3 text-2xl font-semibold text-red-300">
                                Deng støttet at militæret slo dem ned
                            </div>
                        </div>
                    </Kort>
                )}
                {modus === 'hongkong' && beat === 0 && (
                    <Kort key="trekker" side="hoyre">
                        <div className="flex flex-col gap-3">
                            {[
                                ['1987', 'går ut av den daglige ledelsen'],
                                ['1989', 'gir fra seg siste jobb i partiet'],
                            ].map(([år, t], i) => (
                                <motion.div
                                    key={år}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 1.4 }}
                                    className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl"
                                >
                                    <span className="font-display font-black text-3xl text-red-700">
                                        {år}
                                    </span>
                                    <span className="ml-3 text-2xl font-semibold text-slate-700">
                                        {t}
                                    </span>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 3.6 }}
                                className="px-5 py-2 rounded-2xl bg-slate-900/85 text-white text-2xl font-bold"
                            >
                                men bestemmer mye i det skjulte
                            </motion.div>
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </div>
    );
}

function Kort({ children, side }: { children: React.ReactNode; side: 'venstre' | 'hoyre' }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'venstre' ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 20 }}
            className={`absolute bottom-[8%] ${side === 'venstre' ? 'left-[4%]' : 'right-[4%]'}`}
        >
            {children}
        </motion.div>
    );
}

/** 20 personer, 3 av dem røde: 15 prosent. */
function FemtenProsent() {
    return (
        <div className="px-6 py-4 rounded-2xl bg-white/95 shadow-xl">
            <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 20 }, (_, i) => (
                    <motion.svg
                        key={i}
                        viewBox="0 0 20 30"
                        className="w-7 h-10"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                    >
                        <circle cx={10} cy={7} r={6} fill={i < 3 ? '#dc2626' : '#94a3b8'} />
                        <path
                            d="M2 30 Q2 15 10 15 Q18 15 18 30 Z"
                            fill={i < 3 ? '#dc2626' : '#94a3b8'}
                        />
                    </motion.svg>
                ))}
            </div>
            <div className="mt-3 font-display font-black text-3xl text-red-700">ca. 15 prosent</div>
            <div className="text-2xl font-semibold text-slate-600">under 8,30 dollar om dagen</div>
        </div>
    );
}

function Sone({ beat, p }: { beat: number; p: Proj }) {
    const [sx, sy] = p(SHENZHEN);
    const inn = [
        [127, 18.5],
        [127.5, 25],
        [121, 18],
    ].map((ll) => {
        const [x, y] = p(ll as LngLat);
        return `M ${x} ${y} Q ${(x + sx) / 2} ${Math.min(y, sy) - 60} ${sx + 26} ${sy}`;
    });
    const [bx, by] = p(BEIJING);
    return (
        <>
            {/* Resten av Kina: kommunistisk */}
            <motion.g
                clipPath="url(#deng-kina)"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 1.2 }}
            >
                <rect x={0} y={0} width={B} height={H} fill="#dc2626" opacity={0.35} />
            </motion.g>
            <motion.text
                x={p([104, 33])[0]}
                y={p([104, 33])[1]}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#991b1b"
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 1, delay: 0.6 }}
            >
                Resten av Kina: kommunistisk
            </motion.text>

            {/* Beijing, som ikke trenger å spørres */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                <line
                    x1={sx}
                    y1={sy}
                    x2={bx}
                    y2={by}
                    stroke="#475569"
                    strokeWidth={5}
                    strokeDasharray="14 12"
                />
                <g transform={`translate(${(sx + bx) / 2} ${(sy + by) / 2})`}>
                    <circle r={34} fill="#fff" stroke="#b91c1c" strokeWidth={6} />
                    <path
                        d="M -16 -16 L 16 16 M 16 -16 L -16 16"
                        stroke="#b91c1c"
                        strokeWidth={8}
                    />
                </g>
                <Prikk x={bx} y={by} navn="Beijing" />
            </motion.g>

            {/* Sonen */}
            <motion.circle
                cx={sx}
                cy={sy}
                fill="url(#deng-glod)"
                initial={{ r: 0 }}
                animate={{ r: beat >= 1 ? 90 : 0 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            {inn.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={12}
                    strokeLinecap="round"
                    markerEnd="url(#deng-pil-bla)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: beat >= 2 ? 1 : 0,
                        opacity: beat >= 2 ? 1 : 0,
                    }}
                    transition={{ duration: 1.8, delay: i * 0.4, ease: 'easeInOut' }}
                />
            ))}
            <motion.text
                x={p([126, 17.5])[0]}
                y={p([126, 17.5])[1] - 10}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#1d4ed8"
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 1 }}
            >
                Utenlandske selskaper
            </motion.text>
            <Prikk x={sx} y={sy} navn="Shenzhen" venstre stor />
            <Prikk x={p(HONGKONG)[0]} y={p(HONGKONG)[1]} navn="Hongkong" under liten />
            <motion.text
                x={sx}
                y={sy + 150}
                textAnchor="middle"
                fontSize={36}
                fontWeight={900}
                fill="#92400e"
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 1 || beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
            >
                {beat >= 3 ? 'Shenzhen: andre regler' : 'Spesiell økonomisk sone'}
            </motion.text>
        </>
    );
}

function Utvide({ beat, p }: { beat: number; p: Proj }) {
    const [sx, sy] = p(SHENZHEN);
    const r = [70, 360, 1100][Math.min(beat, 2)];
    const ut = [
        [124, 25],
        [126, 33],
        [119, 17],
    ].map((ll) => {
        const [x, y] = p(ll as LngLat);
        const [fx, fy] = p([ll[0] - 6, ll[1] + (ll[1] > 20 ? 1 : 4)] as LngLat);
        return `M ${fx} ${fy} L ${x} ${y}`;
    });
    return (
        <>
            <g clipPath="url(#deng-kina)">
                <motion.circle
                    cx={sx}
                    cy={sy}
                    fill="url(#deng-glod)"
                    initial={{ r: 70 }}
                    animate={{ r }}
                    transition={{ duration: 3, ease: 'easeInOut' }}
                />
            </g>
            {ut.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#b45309"
                    strokeWidth={12}
                    strokeLinecap="round"
                    markerEnd="url(#deng-pil-gull)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: beat >= 2 ? 1 : 0, opacity: beat >= 2 ? 1 : 0 }}
                    transition={{ duration: 1.6, delay: 0.8 + i * 0.3 }}
                />
            ))}
            <Prikk x={sx} y={sy} navn="Shenzhen" venstre stor />
            <motion.text
                x={p([104, 30])[0]}
                y={p([104, 30])[1]}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#92400e"
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 1, delay: 1.5 }}
            >
                Litt og litt, ikke alt på en gang
            </motion.text>
        </>
    );
}

function Flytting({ beat, p }: { beat: number; p: Proj }) {
    const piler = [
        [
            [95, 32],
            [112, 30],
        ],
        [
            [102, 26],
            [111, 24],
        ],
        [
            [104, 37],
            [114, 36],
        ],
    ].map(([a, b]) => {
        const [x1, y1] = p(a as LngLat);
        const [x2, y2] = p(b as LngLat);
        return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.min(y1, y2) - 50} ${x2} ${y2}`;
    });
    return (
        <>
            <g clipPath="url(#deng-kina)">
                <rect x={0} y={0} width={B} height={H} fill="url(#deng-kyst)" />
            </g>
            {piler.map((d, i) => (
                <motion.path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#b91c1c"
                    strokeWidth={14}
                    strokeLinecap="round"
                    markerEnd="url(#deng-pil-rod)"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: beat >= 1 ? 1 : 0, opacity: beat >= 1 ? 1 : 0 }}
                    transition={{ duration: 1.8, delay: 0.4 + i * 0.4, ease: 'easeInOut' }}
                />
            ))}
            <Etikett ll={[121, 27]} p={p} tekst="Kysten" farge="#92400e" />
            <Etikett ll={[121, 27]} p={p} tekst="rask vekst" farge="#92400e" dy={40} liten />
            <Etikett ll={[90, 35]} p={p} tekst="Inne i landet" farge="#334155" />
            <Etikett ll={[90, 35]} p={p} tekst="henger etter" farge="#334155" dy={40} liten />
        </>
    );
}

function Beijing({ beat, p }: { beat: number; p: Proj }) {
    const [x, y] = p(BEIJING);
    const farge = beat >= 2 ? '#7f1d1d' : '#0f172a';
    return (
        <>
            <motion.circle
                cx={x}
                cy={y}
                fill="none"
                stroke={farge}
                strokeWidth={6}
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: beat >= 1 ? 70 : 0, opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 1 }}
            />
            <circle cx={x} cy={y} r={18} fill={farge} stroke="#fff" strokeWidth={5} />
            <text
                x={x}
                y={y - 90}
                textAnchor="middle"
                fontSize={46}
                fontWeight={900}
                fill="#0f172a"
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Beijing
            </text>
            <motion.text
                x={x}
                y={y + 120}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                fill={farge}
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
            >
                Den himmelske freds plass
            </motion.text>
        </>
    );
}

function Hongkong({ beat, p }: { beat: number; p: Proj }) {
    const [x, y] = p(HONGKONG);
    const tilbake = beat >= 3;
    return (
        <>
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 0.45 : 0 }}
                transition={{ duration: 1 }}
            >
                <rect x={0} y={0} width={B} height={H} fill="#0f172a" />
            </motion.g>
            <motion.circle
                cx={x}
                cy={y}
                stroke="#fff"
                strokeWidth={6}
                initial={{ r: 0 }}
                animate={{ r: beat >= 1 ? 34 : 0, fill: tilbake ? '#dc2626' : '#1d4ed8' }}
                transition={{ duration: 1.2 }}
            />
            <motion.text
                x={x}
                y={y - 60}
                textAnchor="middle"
                fontSize={48}
                fontWeight={900}
                stroke="#fff"
                strokeWidth={8}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0, fill: tilbake ? '#991b1b' : '#1e3a8a' }}
                transition={{ duration: 1.2 }}
            >
                Hongkong
            </motion.text>
            <motion.text
                x={x}
                y={y + 90}
                textAnchor="middle"
                fontSize={36}
                fontWeight={800}
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: beat >= 1 ? 1 : 0,
                    fill: tilbake ? '#991b1b' : '#1e3a8a',
                }}
                transition={{ duration: 1 }}
            >
                {tilbake ? 'tilbake til Kina' : 'britisk'}
            </motion.text>
            <Etikett ll={[111, 25]} p={p} tekst="KINA" farge="#991b1b" />
        </>
    );
}

function Etikett({
    ll,
    p,
    tekst,
    farge,
    dy = 0,
    liten,
}: {
    ll: LngLat;
    p: Proj;
    tekst: string;
    farge: string;
    dy?: number;
    liten?: boolean;
}) {
    const [x, y] = p(ll);
    return (
        <text
            x={x}
            y={y + dy}
            textAnchor="middle"
            fontSize={liten ? 32 : 46}
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

function Prikk({
    x,
    y,
    navn,
    venstre,
    under,
    stor,
    liten,
}: {
    x: number;
    y: number;
    navn: string;
    venstre?: boolean;
    under?: boolean;
    stor?: boolean;
    liten?: boolean;
}) {
    const tx = venstre ? x - 26 : under ? x - 6 : x;
    const ty = venstre ? y + 12 : under ? y + 44 : y - 30;
    return (
        <g>
            <circle cx={x} cy={y} r={liten ? 9 : 14} fill="#0f172a" stroke="#fff" strokeWidth={4} />
            <text
                x={tx}
                y={ty}
                textAnchor={venstre || under ? 'end' : 'middle'}
                fontSize={stor ? 42 : 32}
                fontWeight={900}
                fill="#0f172a"
                stroke="#fff"
                strokeWidth={7}
                paintOrder="stroke"
            >
                {navn}
            </text>
        </g>
    );
}

/** Landene endrer seg aldri, så de tegnes bare én gang. */
const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill={String(g.id) === KINA ? '#f6dfb8' : '#efe9dc'}
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});
