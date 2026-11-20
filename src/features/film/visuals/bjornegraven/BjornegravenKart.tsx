import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoMercator, geoPath, type GeoPath } from 'd3-geo';
import type { GeoFeature } from '../../../../components/atlas/useAtlasWorld';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { Oversiktskart } from '../../kart/Oversiktskart';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Kart over Nord-Norge. «steder»: de 30 gravstedene nord for Rana, nesten alle ved kysten.
 * Prikkene er med vilje ikke de ekte stedene, for de fleste holdes skjult. «sevgu»: holmen i
 * Narvik med åtte bjørner og en offerstein. «tid»: en tidslinje under kartet, fra Tjeldøya
 * rundt år 300 og fram til 1800-tallet. «misjon»: kirken kommer, gravene blir færre, men
 * forsvinner ikke.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'steder' | 'sevgu' | 'tid' | 'misjon';

const RANA: LngLat = [14.14, 66.31];
const TROMSO: LngLat = [18.96, 69.65];
const TJELDOYA: LngLat = [16.2, 68.43];
const KJENGSNES: LngLat = [16.05, 68.62];
const SEVGU: LngLat = [16.85, 68.4];
const NARVIK: LngLat = [17.43, 68.44];

const VID: [LngLat, LngLat] = [
    [11.6, 65.7],
    [24.4, 70.9],
];
const NAER: [LngLat, LngLat] = [
    [15.4, 67.95],
    [18.6, 68.85],
];

/** Kysten nord for Rana, grovt. Prikkene strøs langs den. */
const KYST: LngLat[] = [
    [13.0, 66.45],
    [13.6, 66.95],
    [14.3, 67.3],
    [14.9, 67.7],
    [15.6, 68.1],
    [16.3, 68.5],
    [16.7, 68.85],
    [17.3, 69.1],
    [17.9, 69.35],
    [18.6, 69.55],
    [19.3, 69.75],
    [20.0, 69.85],
    [20.7, 69.95],
    [21.4, 70.05],
    [22.3, 70.2],
    [23.2, 70.45],
];
const INNLAND: LngLat = [15.9, 66.75];

function frø(n: number) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
}

/** 29 prikker langs kysten og én i innlandet. De ekte stedene er skjult. */
const PRIKKER: LngLat[] = (() => {
    const ut: LngLat[] = [];
    for (let i = 0; i < 29; i++) {
        const t = (i / 28) * (KYST.length - 1);
        const k = Math.min(Math.floor(t), KYST.length - 2);
        const f = t - k;
        const a = KYST[k];
        const b = KYST[k + 1];
        ut.push([
            a[0] + (b[0] - a[0]) * f + (frø(i) - 0.5) * 0.5,
            a[1] + (b[1] - a[1]) * f + (frø(i + 40) - 0.5) * 0.22,
        ]);
    }
    ut.push(INNLAND);
    return ut;
})();

/** Prikkene som «blir borte» når misjonen kommer. Resten fortsetter. */
const BORTE = (i: number) => i % 5 === 1 || i % 5 === 3;

const OVERSKRIFTER: Record<Modus, string[]> = {
    steder: [
        '30 gravsteder nord for Rana',
        'Nesten alle ved kysten',
        'De ekte stedene holdes skjult',
        'Bein fra 44 bjørner i Tromsø',
    ],
    sevgu: [
        'Holmen Sevgu i Narvik',
        'Åtte bjørner',
        'Fem datert: 1100- til 1300-tallet',
        'Tolket som offerstein (sieidi)',
    ],
    tid: [
        'Tjeldøya: eldste sikre, rundt år 300',
        'De fleste: middelalderen',
        'Helt fram til 1800-tallet',
        'Den lengste vi kjenner i Nord-Europa',
    ],
    misjon: [
        '1600-tallet: mer misjon',
        'Færre graver, men ikke borte',
        'Kjengsnes: gammel skikk',
        'Skikken fortsatte',
    ],
};

const Land = memo(function Land({ geographies, sti }: { geographies: GeoFeature[]; sti: GeoPath }) {
    return (
        <>
            {geographies.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#e8e2cf"
                    stroke="#a8a08a"
                    strokeWidth={1.5}
                />
            ))}
        </>
    );
});

function Merke({
    x,
    y,
    tekst,
    anker = 'middle',
    fs = 36,
    farge = '#0f172a',
}: {
    x: number;
    y: number;
    tekst: string;
    anker?: 'start' | 'middle' | 'end';
    fs?: number;
    farge?: string;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={fs}
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

/** Liten bjørn sett fra siden, til å telle de åtte på Sevgu. Origo mellom føttene. */
function Bjornikon({
    x,
    y,
    s = 1,
    farge = '#7c4a1e',
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-30} y={-26} width={13} height={26} rx={5} fill={farge} />
            <rect x={14} y={-26} width={13} height={26} rx={5} fill={farge} />
            <ellipse cx={0} cy={-34} rx={38} ry={22} fill={farge} />
            <circle cx={-34} cy={-46} r={15} fill={farge} />
            <circle cx={-33} cy={-60} r={5} fill={farge} />
            <ellipse cx={-48} cy={-42} rx={9} ry={7} fill={farge} />
        </g>
    );
}

function Kors({ x, y }: { x: number; y: number }) {
    return (
        <path
            transform={`translate(${x} ${y})`}
            d="M -4 -18 h 8 v 8 h 8 v 8 h -8 v 16 h -8 v -16 h -8 v -8 h 8 Z"
            fill="#1e3a8a"
            stroke="#fff"
            strokeWidth={2}
        />
    );
}

/** Tidslinja under kartet. */
const T0 = 200;
const T1 = 1900;
const TX0 = 140;
const TX1 = 1460;
const TY = 830;
const aarX = (aar: number) => TX0 + ((aar - T0) / (T1 - T0)) * (TX1 - TX0);

function Tidslinje({ modus, beat, playing }: { modus: Modus; beat: number; playing: boolean }) {
    const dur = (s: number) => (playing ? s : 0);
    const tid = modus === 'tid';
    // Hvor langt tradisjonen er tegnet: fra 300, og fram til 1800-tallet fra beat 2.
    const slutt = tid ? (beat >= 2 ? 1850 : beat === 1 ? 1550 : 320) : 1850;
    return (
        <g>
            <rect
                x={60}
                y={TY - 70}
                width={B - 120}
                height={130}
                rx={24}
                fill="#ffffff"
                opacity={0.94}
            />
            <line x1={TX0} y1={TY} x2={TX1} y2={TY} stroke="#94a3b8" strokeWidth={6} />
            {[300, 1000, 1500, 1800].map((a) => (
                <g key={a}>
                    <line
                        x1={aarX(a)}
                        y1={TY - 12}
                        x2={aarX(a)}
                        y2={TY + 12}
                        stroke="#64748b"
                        strokeWidth={4}
                    />
                    <text
                        x={aarX(a)}
                        y={TY + 48}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill="#475569"
                    >
                        {a === 300 ? 'år 300' : a === 1000 ? '1000' : a === 1500 ? '1500' : '1800'}
                    </text>
                </g>
            ))}
            {/* Middelalderen: en uskarp sky, ikke en stolpe med kanter */}
            {(tid ? beat >= 1 : true) && (
                <motion.ellipse
                    cx={aarX(1290)}
                    cy={TY}
                    rx={(aarX(1530) - aarX(1050)) / 2}
                    ry={30}
                    fill="#f59e0b"
                    filter="url(#bg-uskarp)"
                    initial={{ opacity: tid && beat === 1 ? 0 : 0.7 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: dur(1.2), delay: dur(0.4) }}
                />
            )}
            {tid && (beat === 1 || beat === 2) && (
                <Merke x={aarX(1290)} y={TY - 38} tekst="middelalderen" fs={30} farge="#92400e" />
            )}
            <motion.line
                x1={aarX(300)}
                y1={TY}
                y2={TY}
                stroke="#7c4a1e"
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ x2: aarX(tid && beat === 2 ? 1550 : slutt) }}
                animate={{ x2: aarX(slutt) }}
                transition={{ duration: dur(2), delay: dur(0.3) }}
            />
            <circle cx={aarX(300)} cy={TY} r={16} fill="#7c4a1e" stroke="#fff" strokeWidth={4} />
            {tid && beat >= 3 && (
                <g>
                    <path
                        d={`M ${aarX(300)} ${TY - 30} L ${aarX(300)} ${TY - 50} L ${aarX(1850)} ${TY - 50} L ${aarX(1850)} ${TY - 30}`}
                        fill="none"
                        stroke="#7c4a1e"
                        strokeWidth={5}
                    />
                </g>
            )}
            {modus === 'misjon' && (
                <>
                    <rect
                        x={aarX(1600)}
                        y={TY - 26}
                        width={aarX(1900) - aarX(1600)}
                        height={52}
                        fill="#1e3a8a"
                        opacity={0.18}
                    />
                    {beat === 0 && (
                        <Merke x={aarX(1600)} y={TY - 36} tekst="misjon" fs={30} farge="#1e3a8a" />
                    )}
                    {beat === 2 && (
                        <g>
                            <circle
                                cx={aarX(1550)}
                                cy={TY}
                                r={18}
                                fill="#dc2626"
                                stroke="#fff"
                                strokeWidth={4}
                            />
                            <Merke
                                x={aarX(1550)}
                                y={TY - 34}
                                tekst="ungbjørn"
                                fs={30}
                                farge="#b91c1c"
                            />
                        </g>
                    )}
                    {beat >= 3 && (
                        <g>
                            <line
                                x1={aarX(1790)}
                                y1={TY - 30}
                                x2={aarX(1790)}
                                y2={TY + 20}
                                stroke="#1e3a8a"
                                strokeWidth={6}
                            />
                            <Merke
                                x={aarX(1790)}
                                y={TY - 36}
                                tekst="kristendommen innført"
                                fs={30}
                                farge="#1e3a8a"
                                anker="end"
                            />
                        </g>
                    )}
                </>
            )}
        </g>
    );
}

export function BjornegravenKart({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'steder';
    const naer = modus === 'sevgu';
    const { geographies } = useFilmVerden(naer ? NAER : VID);
    const medTid = modus === 'tid' || modus === 'misjon';
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                naer
                    ? [
                          [60, 120],
                          [B - 60, H - 40],
                      ]
                    : [
                          [40, medTid ? 100 : 110],
                          [B - 40, medTid ? 750 : H - 30],
                      ],
                { type: 'MultiPoint', coordinates: naer ? NAER : VID } as never
            ),
        [naer, medTid]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    const p = (ll: LngLat) => proj(ll) as [number, number];
    const dur = (s: number) => (playing ? s : 0);
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];

    const kystLinje = `M ${KYST.map((ll) => p(ll).join(' ')).join(' L ')}`;
    const [rx, ry] = p(RANA);
    const ranaV = p([11.6, RANA[1]]);
    const ranaO = p([17.2, RANA[1]]);

    return (
        <div className="absolute inset-0 bg-[#bcd4e4] overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    <filter id="bg-uskarp" x="-30%" y="-80%" width="160%" height="260%">
                        <feGaussianBlur stdDeviation={14} />
                    </filter>
                    <filter id="bg-prikk-uskarp">
                        <feGaussianBlur stdDeviation={6} />
                    </filter>
                </defs>
                <Land geographies={geographies} sti={sti} />

                {!naer && (
                    <>
                        {/* Rana-linja */}
                        <line
                            x1={ranaV[0]}
                            y1={ry}
                            x2={ranaO[0]}
                            y2={ry}
                            stroke="#475569"
                            strokeWidth={4}
                            strokeDasharray="14 10"
                        />
                        <circle
                            cx={rx}
                            cy={ry}
                            r={9}
                            fill="#0f172a"
                            stroke="#fff"
                            strokeWidth={3}
                        />
                        <Merke x={rx + 20} y={ry + 40} tekst="Rana" anker="start" fs={32} />
                        {modus === 'steder' && beat === 1 && (
                            <motion.path
                                d={kystLinje}
                                fill="none"
                                stroke="#f59e0b"
                                strokeOpacity={0.45}
                                strokeWidth={60}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: dur(2.4), delay: dur(0.3) }}
                            />
                        )}
                        {modus === 'misjon' &&
                            KYST.filter((_, i) => i % 2 === 0).map((ll, i) => {
                                const [x, y] = p([ll[0] + 0.35, ll[1] + 0.3]);
                                return (
                                    <motion.g
                                        key={`k${i}`}
                                        initial={{ opacity: beat === 0 ? 0 : 1 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: dur(0.4 + i * 0.25) }}
                                    >
                                        <Kors x={x} y={y} />
                                    </motion.g>
                                );
                            })}
                        <g
                            filter={
                                modus === 'steder' && beat === 2
                                    ? 'url(#bg-prikk-uskarp)'
                                    : undefined
                            }
                        >
                            {PRIKKER.map((ll, i) => {
                                const [x, y] = p(ll);
                                const inn = i === PRIKKER.length - 1;
                                const dempet =
                                    modus === 'misjon' && beat >= 1 && BORTE(i)
                                        ? 0.04
                                        : modus === 'tid' && beat === 0
                                          ? 0.35
                                          : 1;
                                return (
                                    <motion.circle
                                        key={i}
                                        cx={x}
                                        cy={y}
                                        r={inn && modus === 'steder' && beat === 1 ? 16 : 11}
                                        fill={
                                            inn && modus === 'steder' && beat === 1
                                                ? '#7c3aed'
                                                : '#9a3412'
                                        }
                                        stroke="#fff"
                                        strokeWidth={3}
                                        initial={{
                                            opacity: modus === 'steder' && beat === 0 ? 0 : dempet,
                                        }}
                                        animate={{ opacity: dempet }}
                                        transition={{
                                            duration: dur(0.6),
                                            delay: dur(
                                                modus === 'steder' && beat === 0
                                                    ? 0.4 + i * 0.09
                                                    : 0.5 + (i % 7) * 0.12
                                            ),
                                        }}
                                    />
                                );
                            })}
                        </g>
                        {modus === 'steder' && beat === 1 && (
                            <Merke
                                x={p(INNLAND)[0] + 26}
                                y={p(INNLAND)[1] + 10}
                                tekst="bare én i innlandet"
                                anker="start"
                                fs={32}
                                farge="#6d28d9"
                            />
                        )}
                        {modus === 'steder' && beat >= 3 && (
                            <g>
                                <rect
                                    x={p(TROMSO)[0] - 16}
                                    y={p(TROMSO)[1] - 16}
                                    width={32}
                                    height={32}
                                    rx={6}
                                    fill="#0f172a"
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <Merke
                                    x={p(TROMSO)[0]}
                                    y={p(TROMSO)[1] - 34}
                                    tekst="Tromsø: museet"
                                    fs={34}
                                />
                                {PRIKKER.slice(0, 12).map((ll, i) => {
                                    const [x, y] = p(ll);
                                    const [tx, ty] = p(TROMSO);
                                    return (
                                        <motion.path
                                            key={`l${i}`}
                                            d={`M ${x} ${y} Q ${(x + tx) / 2} ${Math.min(y, ty) - 80} ${tx} ${ty}`}
                                            fill="none"
                                            stroke="#0f172a"
                                            strokeOpacity={0.35}
                                            strokeWidth={3}
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{
                                                duration: dur(1.4),
                                                delay: dur(0.4 + i * 0.1),
                                            }}
                                        />
                                    );
                                })}
                            </g>
                        )}
                        {modus === 'tid' && (
                            <g>
                                <circle
                                    cx={p(TJELDOYA)[0]}
                                    cy={p(TJELDOYA)[1]}
                                    r={beat === 0 ? 30 : 18}
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth={6}
                                />
                                <Merke
                                    x={p(TJELDOYA)[0] - 40}
                                    y={p(TJELDOYA)[1] + 12}
                                    tekst="Tjeldøya"
                                    anker="end"
                                    fs={36}
                                    farge="#b91c1c"
                                />
                            </g>
                        )}
                        {modus === 'misjon' && beat === 2 && (
                            <g>
                                <circle
                                    cx={p(KJENGSNES)[0]}
                                    cy={p(KJENGSNES)[1]}
                                    r={28}
                                    fill="none"
                                    stroke="#dc2626"
                                    strokeWidth={6}
                                />
                                <Merke
                                    x={p(KJENGSNES)[0] - 40}
                                    y={p(KJENGSNES)[1] + 12}
                                    tekst="Kjengsnes, Gullesfjorden"
                                    anker="end"
                                    fs={36}
                                    farge="#b91c1c"
                                />
                            </g>
                        )}
                    </>
                )}

                {naer &&
                    (() => {
                        const [sx, sy] = p(SEVGU);
                        const [nx, ny] = p(NARVIK);
                        return (
                            <>
                                <circle
                                    cx={nx}
                                    cy={ny}
                                    r={10}
                                    fill="#0f172a"
                                    stroke="#fff"
                                    strokeWidth={3}
                                />
                                <Merke
                                    x={nx + 20}
                                    y={ny + 46}
                                    tekst="Narvik"
                                    anker="start"
                                    fs={34}
                                />
                                <motion.circle
                                    cx={sx}
                                    cy={sy}
                                    r={34}
                                    fill="#f59e0b"
                                    fillOpacity={0.3}
                                    stroke="#b45309"
                                    strokeWidth={6}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: dur(0.4) }}
                                />
                                <Merke x={sx} y={sy + 120} tekst="Sevgu (Seines)" fs={38} />
                                {beat >= 3 && (
                                    <g transform={`translate(${sx} ${sy - 8}) scale(2)`}>
                                        <circle
                                            r={40}
                                            fill="#fde68a"
                                            opacity={0.5}
                                            filter="url(#bg-prikk-uskarp)"
                                        />
                                        <path
                                            d="M -30 16 Q -36 -24 -6 -32 Q 28 -36 32 4 L 32 16 Z"
                                            fill="#57534e"
                                            stroke="#fff"
                                            strokeWidth={3}
                                        />
                                    </g>
                                )}
                                {beat >= 1 && (
                                    <g transform={`translate(${sx - 520} ${sy - 300})`}>
                                        <rect
                                            x={-20}
                                            y={-20}
                                            width={780}
                                            height={beat >= 2 ? 200 : 150}
                                            rx={24}
                                            fill="#ffffff"
                                            opacity={0.95}
                                        />
                                        {Array.from({ length: 8 }, (_, i) => {
                                            const unge = i === 7;
                                            const datert = i < 5;
                                            return (
                                                <motion.g
                                                    key={i}
                                                    initial={{ opacity: beat === 1 ? 0 : 1 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: dur(0.3 + i * 0.25) }}
                                                >
                                                    <Bjornikon
                                                        x={60 + i * 92}
                                                        y={unge ? 100 : 104}
                                                        s={unge ? 0.6 : 1}
                                                    />
                                                    {beat >= 2 && datert && (
                                                        <g
                                                            transform={`translate(${60 + i * 92} 140)`}
                                                        >
                                                            <circle r={18} fill="#0d9488" />
                                                            <path
                                                                d="M -8 0 L -2 7 L 9 -7"
                                                                stroke="#fff"
                                                                strokeWidth={4}
                                                                fill="none"
                                                            />
                                                        </g>
                                                    )}
                                                </motion.g>
                                            );
                                        })}
                                    </g>
                                )}
                            </>
                        );
                    })()}

                {medTid && <Tidslinje modus={modus} beat={beat} playing={playing} />}
            </svg>

            <div className="absolute inset-x-0 top-[3.5%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-4xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                </AnimatePresence>
            </div>

            {modus === 'steder' && beat === 0 && (
                <div className="absolute bottom-[7%] right-[4%]">
                    <Teller verdi={30} etikett="gravsteder nord for Rana" forsinkelse={dur(0.6)} />
                </div>
            )}
            {modus === 'steder' && beat === 2 && (
                <div className="absolute bottom-[7%] right-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-slate-900 font-black text-2xl">
                    Prikkene er ikke de ekte stedene
                </div>
            )}
            {modus === 'steder' && beat >= 3 && (
                <div className="absolute bottom-[7%] right-[4%]">
                    <Teller verdi={44} etikett="bjørner i museet i Tromsø" forsinkelse={dur(0.6)} />
                </div>
            )}
            {naer && (
                <Oversiktskart
                    utsnitt={NAER}
                    omrade={[
                        [4, 57.5],
                        [31, 71.5],
                    ]}
                    etikett="Nord-Norge"
                    plassering="nede-venstre"
                />
            )}
            {
                <div className="absolute top-[2%] left-[1.5%] px-2 py-0.5 rounded bg-white/80 text-base font-bold text-slate-700">
                    Omtrentlig kart
                </div>
            }
        </div>
    );
}
