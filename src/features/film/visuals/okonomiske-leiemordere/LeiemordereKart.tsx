import { memo, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { geoNaturalEarth1, geoPath, type GeoPath, type GeoProjection } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * Kartet over landene der oppskriften ble brukt. Hvert land blir en «sak» med et stempel.
 * «iran»: oljen går til Storbritannia, Mossadeq tar den tilbake, pila fra Washington, kuppet.
 * «chile»: Allende, kobberet, ordren fra Nixon og kuppet i 1973.
 * «verden»: saksmappene legges ut over hele kartet, ett land om gangen.
 */

const B = 1600;
const H = 900;
type LngLat = [number, number];
type Modus = 'iran' | 'chile' | 'verden';

const ID = {
    iran: 364,
    uk: 826,
    usa: 840,
    chile: 152,
    guatemala: 320,
    kongo: 180,
    indonesia: 360,
    ecuador: 218,
    panama: 591,
};

const STED = {
    teheran: [51.4, 35.7] as LngLat,
    iran: [54, 32.5] as LngLat,
    london: [-0.1, 51.5] as LngLat,
    washington: [-77, 38.9] as LngLat,
    santiago: [-70.7, -33.4] as LngLat,
    chile: [-71, -30] as LngLat,
    guatemala: [-90.4, 15.5] as LngLat,
    kongo: [23.6, -2.9] as LngLat,
    indonesia: [113, -1.5] as LngLat,
    ecuador: [-78.4, -1.4] as LngLat,
    panama: [-80, 8.6] as LngLat,
};

const FARGE = {
    land: '#efe7d6',
    kant: '#b9ad92',
    hav: '#cfe3f0',
    offer: '#16a34a',
    vest: '#1e3a8a',
    usa: '#2563eb',
    kupp: '#475569',
    perkins: '#7c3aed',
};

function lagProjeksjon(modus: Modus): GeoProjection {
    const [a, b]: [LngLat, LngLat] =
        modus === 'iran'
            ? [
                  [-92, 14],
                  [82, 62],
              ]
            : modus === 'chile'
              ? [
                    [-122, -52],
                    [-40, 48],
                ]
              : [
                    [-125, -40],
                    [140, 58],
                ];
    return geoNaturalEarth1().fitExtent(
        [
            [70, 150],
            [B - 70, H - 50],
        ],
        { type: 'MultiPoint', coordinates: [a, b] } as never
    );
}

function fargeFor(modus: Modus, beat: number, id: number): string {
    if (modus === 'iran') {
        if (id === ID.iran) return beat >= 3 ? FARGE.kupp : FARGE.offer;
        if (id === ID.uk) return FARGE.vest;
        if (beat >= 2 && id === ID.usa) return FARGE.usa;
        return FARGE.land;
    }
    if (modus === 'chile') {
        if (id === ID.chile) return beat >= 3 ? FARGE.kupp : FARGE.offer;
        if (beat >= 2 && id === ID.usa) return FARGE.usa;
        return FARGE.land;
    }
    if (id === ID.usa && beat >= 4) return FARGE.usa;
    if (id === ID.iran || id === ID.chile) return FARGE.kupp;
    if (id === ID.guatemala && beat >= 1) return FARGE.kupp;
    if (id === ID.kongo && beat >= 2) return FARGE.kupp;
    if (beat >= 3 && (id === ID.indonesia || id === ID.ecuador || id === ID.panama))
        return FARGE.perkins;
    return FARGE.land;
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    iran: [
        { tekst: 'Iran: oljen eies av et britisk selskap' },
        { tekst: '1951: «Oljen er vår»' },
        { tekst: '1953: CIA lager en plan' },
        { tekst: 'Mossadeq blir arrestert', rod: true },
        { tekst: 'Sjakalene i arbeid', rod: true },
    ],
    chile: [
        { tekst: 'Chile, 1970' },
        { tekst: 'Kobberet: til chilenerne' },
        { tekst: '«Få økonomien til å skrike»', rod: true },
        { tekst: '11. september 1973', rod: true },
    ],
    verden: [
        { tekst: 'Samme mønster, mange land' },
        { tekst: 'Guatemala, 1954' },
        { tekst: 'Kongo, 1961' },
        { tekst: 'Her jobbet Perkins selv' },
        { tekst: 'Kommunisme, eller ressurser?' },
    ],
};

export function LeiemordereKart({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'iran';
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(() => lagProjeksjon(modus), [modus]);
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: LngLat) => projeksjon(ll) as [number, number];
    const brikke = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: FARGE.hav }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <Land
                    geographies={geographies}
                    sti={sti}
                    farge={(id) => fargeFor(modus, beat, id)}
                    nokkel={`${modus}-${beat}`}
                />

                {modus === 'iran' && (
                    <>
                        <Etikett pos={p([54, 27])} tekst="Iran" farge="#14532d" stor />
                        <Etikett pos={p([-3, 56])} tekst="Storbritannia" farge={FARGE.vest} dy={-40} />
                        {beat === 0 && <Pil fra={p(STED.iran)} til={p(STED.london)} farge="#111827" />}
                        {beat <= 1 && <Dråpe pos={p([50, 37])} />}
                        {beat === 1 && <Stempel pos={p([40, 47])} tekst="NASJONALISERT" farge={FARGE.offer} />}
                        {beat >= 2 && <Etikett pos={p([-88, 40])} tekst="USA" farge={FARGE.vest} stor />}
                        {beat >= 2 && (
                            <Pil fra={p(STED.washington)} til={p(STED.teheran)} farge={FARGE.vest} bue={-0.18} />
                        )}
                        {beat >= 2 && <Etikett pos={p([-38, 44])} tekst="CIA" farge={FARGE.vest} stor forsinkelse={1.2} />}
                        {beat >= 3 && <Stempel pos={p([42, 47])} tekst="KUPP 1953" farge="#b91c1c" />}
                    </>
                )}

                {modus === 'chile' && (
                    <>
                        <Etikett pos={p([-62, -38])} tekst="Chile" farge="#14532d" stor />
                        {beat <= 2 && <Kobber pos={p([-58, -10])} />}
                        {beat === 1 && (
                            <Pil fra={p([-58, -5])} til={p([-58, 6])} farge="#14532d" bue={0} />
                        )}
                        {beat === 1 && <Etikett pos={p([-58, 11])} tekst="til folket" farge="#14532d" />}
                        {beat >= 2 && <Etikett pos={p([-100, 40])} tekst="USA" farge={FARGE.vest} stor />}
                        {beat >= 2 && (
                            <Pil fra={p(STED.washington)} til={p(STED.santiago)} farge={FARGE.vest} bue={0.12} />
                        )}
                        {beat >= 3 && <Stempel pos={p([-88, -20])} tekst="KUPP 1973" farge="#b91c1c" />}
                    </>
                )}

                {modus === 'verden' && (
                    <>
                        <Sak pos={p(STED.iran)} land="Iran" år="1953" />
                        <Sak pos={p(STED.chile)} land="Chile" år="1973" />
                        {beat >= 1 && <Sak pos={p(STED.guatemala)} land="Guatemala" år="1954" nytt />}
                        {beat >= 2 && <Sak pos={p(STED.kongo)} land="Kongo" år="1961" nytt />}
                        {beat >= 3 && (
                            <>
                                <Perkins pos={p(STED.indonesia)} land="Indonesia" forsinkelse={0.3} venstre />
                                <Perkins pos={p(STED.ecuador)} land="Ecuador" forsinkelse={0.8} venstre />
                                <Perkins pos={p(STED.panama)} land="Panama" forsinkelse={1.3} venstre />
                            </>
                        )}
                        {beat >= 4 && <Etikett pos={p([-108, 47])} tekst="USA" farge={FARGE.vest} stor />}
                    </>
                )}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${
                        brikke.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {brikke.tekst}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {modus === 'iran' && beat >= 1 && (
                    <Kort
                        key="mossadeq"
                        navn="Mohammad Mossadeq"
                        linje="Statsminister fra april 1951"
                        ekstra={beat >= 3 ? '15. august 1953: arrestert' : undefined}
                        side="midt"
                    />
                )}
                {modus === 'chile' && beat <= 1 && (
                    <Kort key="allende" navn="Salvador Allende" linje="Vant valget i 1970" side="hoyre" />
                )}
                {modus === 'chile' && beat === 2 && (
                    <Kort
                        key="nixon"
                        navn="Nixon ga CIA ordre"
                        linje="Notatene fra møtet: «Få økonomien til å skrike»"
                        side="hoyre"
                        rod
                    />
                )}
                {modus === 'chile' && beat >= 3 && (
                    <Kort
                        key="pinochet"
                        navn="Augusto Pinochet"
                        linje="Generalen som tok makten"
                        side="hoyre"
                    />
                )}
                {modus === 'verden' && beat >= 4 && (
                    <motion.div
                        key="grunner"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute right-[3%] bottom-[5%] flex flex-col items-end gap-3"
                    >
                        <div className="px-5 py-3 rounded-2xl bg-white/95 shadow-xl text-2xl font-bold text-slate-700">
                            USA sa: stanse kommunisme
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.6 }}
                            className="px-5 py-3 rounded-2xl bg-amber-500 shadow-xl text-2xl font-black text-white"
                        >
                            Også: olje, kobber, ressurser
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Landene tegnes på nytt bare når fargene endrer seg. CSS glir mellom fargene. */
const Land = memo(
    function Land({
        geographies,
        sti,
        farge,
    }: {
        geographies: { id?: string | number }[];
        sti: GeoPath;
        farge: (id: number) => string;
        nokkel: string;
    }) {
        return (
            <>
                {geographies.map((g, i) => (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={farge(Number(g.id))}
                        stroke={FARGE.kant}
                        strokeWidth={0.8}
                        vectorEffect="non-scaling-stroke"
                        style={{ transition: 'fill 1.1s ease' }}
                    />
                ))}
            </>
        );
    },
    (a, b) => a.nokkel === b.nokkel && a.geographies === b.geographies && a.sti === b.sti
);

function Etikett({
    pos,
    tekst,
    farge = '#0f172a',
    stor,
    dy = 0,
    forsinkelse = 0,
}: {
    pos: [number, number];
    tekst: string;
    farge?: string;
    stor?: boolean;
    dy?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: forsinkelse }}
            x={pos[0]}
            y={pos[1] + dy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={stor ? 54 : 40}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </motion.text>
    );
}

function Pil({
    fra,
    til,
    farge,
    bue = 0.15,
}: {
    fra: [number, number];
    til: [number, number];
    farge: string;
    bue?: number;
}) {
    const mx = (fra[0] + til[0]) / 2 - (til[1] - fra[1]) * bue;
    const my = (fra[1] + til[1]) / 2 + (til[0] - fra[0]) * bue;
    const vinkel = (Math.atan2(til[1] - my, til[0] - mx) * 180) / Math.PI;
    return (
        <g>
            <motion.path
                d={`M ${fra[0]} ${fra[1]} Q ${mx} ${my} ${til[0]} ${til[1]}`}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeDasharray="1 0"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6, delay: 0.3, ease: 'easeInOut' }}
            />
            <motion.path
                d="M -24 -15 L 6 0 L -24 15 Z"
                fill={farge}
                transform={`translate(${til[0]} ${til[1]}) rotate(${vinkel})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
            />
        </g>
    );
}

/** Oljedråpe over Iran. */
function Dråpe({ pos }: { pos: [number, number] }) {
    const [x, y] = pos;
    return (
        <motion.path
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 180, damping: 12 }}
            d={`M ${x} ${y - 50} C ${x + 32} ${y - 8}, ${x + 32} ${y + 28}, ${x} ${y + 28} C ${x - 32} ${y + 28}, ${x - 32} ${y - 8}, ${x} ${y - 50} Z`}
            fill="#111827"
            stroke="#ffffff"
            strokeWidth={6}
        />
    );
}

/** Kobberbarrer i Chile. */
function Kobber({ pos }: { pos: [number, number] }) {
    return (
        <g>
            {[0, 1, 2].map((i) => (
                <motion.rect
                    key={i}
                    x={pos[0] - 46 + (i === 2 ? 23 : i * 46)}
                    y={pos[1] - (i === 2 ? 40 : 0)}
                    width={44}
                    height={36}
                    rx={4}
                    fill="#ea7a2b"
                    stroke="#7c2d12"
                    strokeWidth={4}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.2 }}
                />
            ))}
            <text
                x={pos[0] + 2}
                y={pos[1] + 70}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#7c2d12"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                Kobber
            </text>
        </g>
    );
}

/** Et skjevt stempel over landet. */
function Stempel({ pos, tekst, farge }: { pos: [number, number]; tekst: string; farge: string }) {
    const bredde = tekst.length * 30 + 50;
    return (
        <motion.g
            key={tekst}
            initial={{ opacity: 0, scale: 2.2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 16 }}
            style={{ transformOrigin: `${pos[0]}px ${pos[1]}px` }}
        >
            <g transform={`rotate(-8 ${pos[0]} ${pos[1]})`}>
                <rect
                    x={pos[0] - bredde / 2}
                    y={pos[1] - 40}
                    width={bredde}
                    height={80}
                    rx={10}
                    fill="#ffffff"
                    fillOpacity={0.9}
                    stroke={farge}
                    strokeWidth={8}
                />
                <text
                    x={pos[0]}
                    y={pos[1] + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={48}
                    fontWeight={900}
                    fill={farge}
                    letterSpacing={2}
                >
                    {tekst}
                </text>
            </g>
        </motion.g>
    );
}

/** En saksmappe festet på kartet: land og år for kuppet eller drapet. */
function Sak({
    pos,
    land,
    år,
    nytt,
}: {
    pos: [number, number];
    land: string;
    år: string;
    nytt?: boolean;
}) {
    const bredde = Math.max(land.length, 4) * 24 + 40;
    return (
        <motion.g
            initial={nytt ? { opacity: 0, y: -40 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 16 }}
        >
            <circle cx={pos[0]} cy={pos[1]} r={12} fill="#b91c1c" stroke="#ffffff" strokeWidth={4} />
            <line x1={pos[0]} y1={pos[1] - 12} x2={pos[0]} y2={pos[1] - 40} stroke="#0f172a" strokeWidth={4} />
            <rect
                x={pos[0] - bredde / 2}
                y={pos[1] - 130}
                width={bredde}
                height={92}
                rx={12}
                fill="#fef3c7"
                stroke="#92400e"
                strokeWidth={4}
            />
            <text x={pos[0]} y={pos[1] - 94} textAnchor="middle" fontSize={34} fontWeight={900} fill="#0f172a">
                {land}
            </text>
            <text x={pos[0]} y={pos[1] - 56} textAnchor="middle" fontSize={32} fontWeight={800} fill="#b91c1c">
                {år}
            </text>
        </motion.g>
    );
}

/** Land der Perkins selv jobbet: lilla merke med koffert-symbol. */
function Perkins({
    pos,
    land,
    forsinkelse,
    venstre,
}: {
    pos: [number, number];
    land: string;
    forsinkelse: number;
    venstre?: boolean;
}) {
    const x = venstre ? pos[0] - 26 : pos[0] + 26;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse }}
        >
            <rect x={pos[0] - 16} y={pos[1] - 12} width={32} height={24} rx={4} fill={FARGE.perkins} stroke="#ffffff" strokeWidth={3} />
            <rect x={pos[0] - 7} y={pos[1] - 19} width={14} height={8} rx={2} fill="none" stroke={FARGE.perkins} strokeWidth={3} />
            <text
                x={x}
                y={pos[1] + 2}
                textAnchor={venstre ? 'end' : 'start'}
                dominantBaseline="middle"
                fontSize={40}
                fontWeight={900}
                fill="#5b21b6"
                stroke="#ffffff"
                strokeWidth={8}
                paintOrder="stroke"
            >
                {land}
            </text>
        </motion.g>
    );
}

function Kort({
    navn,
    linje,
    ekstra,
    side,
    rod,
}: {
    navn: string;
    linje: string;
    ekstra?: string;
    side: 'venstre' | 'hoyre' | 'midt';
    rod?: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side === 'venstre' ? -40 : 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 160, damping: 18 }}
            className={`absolute ${side === 'hoyre' ? 'right-[4%]' : side === 'midt' ? 'left-[36%]' : 'left-[4%]'} bottom-[8%] w-[22rem] p-5 rounded-3xl shadow-2xl ${
                rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
            }`}
        >
            <div className="font-display font-black text-3xl">{navn}</div>
            <div className={`mt-1 text-2xl font-semibold ${rod ? 'text-white' : 'text-slate-600'}`}>
                {linje}
            </div>
            {ekstra && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 px-3 py-2 rounded-xl bg-red-700 text-xl font-bold text-white"
                >
                    {ekstra}
                </motion.div>
            )}
        </motion.div>
    );
}
