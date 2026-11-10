import { useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { geoMercator, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import type { VisualProps } from '../../types';

/**
 * 2D-tavle i fire moduser. «lekter»: varietet, geolekt og de andre -lektene som kort.
 * «forskere»: tidslinja fra Aasen til Storm, og mange små kart der ett stort atlas mangler.
 * «hopp»: to nabobygder med fjord, fjell eller prestegjeldsgrense mellom, der ett trekk skifter.
 * «fotografi»: dialektkartet som et gammelt bilde, eldre folk på landsbygda og linjer som blir uklare.
 */

type Modus = 'lekter' | 'forskere' | 'hopp' | 'fotografi';

const B = 1600;
const H = 900;

export function GeolektTavle({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'lekter';
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: modus === 'fotografi' ? '#2b2420' : '#f5efe2' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'lekter' && <Lekter beat={beat} />}
                {modus === 'forskere' && <Forskere beat={beat} />}
                {modus === 'hopp' && <Hopp beat={beat} playing={playing} />}
                {modus === 'fotografi' && <Fotografi beat={beat} />}
            </svg>
        </div>
    );
}

function Tittel({
    tekst,
    y = 110,
    farge = '#0f172a',
}: {
    tekst: string;
    y?: number;
    farge?: string;
}) {
    return (
        <motion.text
            key={tekst}
            x={B / 2}
            y={y}
            textAnchor="middle"
            fontSize={64}
            fontWeight={900}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {tekst}
        </motion.text>
    );
}

function Inn({
    children,
    forsinkelse = 0,
    k,
}: {
    children: ReactNode;
    forsinkelse?: number;
    k?: string;
}) {
    return (
        <motion.g
            key={k}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.6 }}
        >
            {children}
        </motion.g>
    );
}

/* ---------- lekter ---------- */

const LEKT_KORT = [
    { navn: 'geolekt', tekst: ['hører til', 'et sted'], farge: '#0f766e', ikon: 'sted', fra: 1 },
    {
        navn: 'sosiolekt',
        tekst: ['hører til en gruppe', 'i samfunnet'],
        farge: '#2563eb',
        ikon: 'gruppe',
        fra: 3,
    },
    {
        navn: 'etnolekt',
        tekst: ['der mange', 'språk møtes'],
        farge: '#c2410c',
        ikon: 'bobler',
        fra: 3,
    },
    {
        navn: 'idiolekt',
        tekst: ['din helt egen', 'språkstil'],
        farge: '#7c3aed',
        ikon: 'person',
        fra: 4,
    },
] as const;

function Lekter({ beat }: { beat: number }) {
    const titler = [
        'Varietet = en variant av et språk',
        'Geo + lekt',
        'Geolekt = det vi kaller dialekt',
        'Språket formes på flere måter',
        'Hvor kommer du fra?',
    ];
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            {beat === 0 && (
                <Inn>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <g key={i} transform={`translate(${360 + i * 220} 470)`}>
                            <rect
                                x={-90}
                                y={-70}
                                width={180}
                                height={140}
                                rx={40}
                                fill="#fff"
                                stroke="#94a3b8"
                                strokeWidth={5}
                            />
                            <path
                                d="M -30 70 L -50 115 L 5 70 Z"
                                fill="#fff"
                                stroke="#94a3b8"
                                strokeWidth={5}
                                strokeLinejoin="round"
                            />
                            <rect x={-34} y={64} width={36} height={10} fill="#fff" />
                            {[-30, 0, 30].map((dx, j) => (
                                <circle
                                    key={j}
                                    cx={dx}
                                    cy={0}
                                    r={12}
                                    fill={
                                        ['#0f766e', '#2563eb', '#c2410c', '#7c3aed', '#ca8a04'][i]
                                    }
                                    opacity={0.4 + j * 0.3}
                                />
                            ))}
                        </g>
                    ))}
                    <text
                        x={B / 2}
                        y={720}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#475569"
                    >
                        Mange måter å snakke norsk på
                    </text>
                </Inn>
            )}
            {beat === 1 && (
                <Inn>
                    <g transform="translate(520 470)">
                        <rect
                            x={-230}
                            y={-150}
                            width={460}
                            height={300}
                            rx={36}
                            fill="#fff"
                            stroke="#0f766e"
                            strokeWidth={6}
                        />
                        <text
                            y={-30}
                            textAnchor="middle"
                            fontSize={110}
                            fontWeight={900}
                            fill="#0f766e"
                        >
                            geo
                        </text>
                        <text
                            y={80}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            jord, sted
                        </text>
                    </g>
                    <text
                        x={B / 2}
                        y={500}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill="#94a3b8"
                    >
                        +
                    </text>
                    <g transform="translate(1080 470)">
                        <rect
                            x={-230}
                            y={-150}
                            width={460}
                            height={300}
                            rx={36}
                            fill="#fff"
                            stroke="#0f766e"
                            strokeWidth={6}
                        />
                        <text
                            y={-30}
                            textAnchor="middle"
                            fontSize={110}
                            fontWeight={900}
                            fill="#0f766e"
                        >
                            lekt
                        </text>
                        <text
                            y={80}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            talemåte
                        </text>
                    </g>
                    <text
                        x={B / 2}
                        y={760}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Språket som hører til der folk bor
                    </text>
                </Inn>
            )}
            {beat === 2 && (
                <Inn>
                    <g transform="translate(800 450)">
                        <rect
                            x={-380}
                            y={-170}
                            width={760}
                            height={340}
                            rx={40}
                            fill="#fff"
                            stroke="#0f766e"
                            strokeWidth={6}
                        />
                        <g transform="translate(-230 0)">
                            <Ikon type="sted" farge="#0f766e" skala={2.2} />
                        </g>
                        <text x={-60} y={-30} fontSize={56} fontWeight={900} fill="#0f172a">
                            «Hun snakker
                        </text>
                        <text x={-60} y={50} fontSize={56} fontWeight={900} fill="#0f766e">
                            sunnmørsk»
                        </text>
                    </g>
                </Inn>
            )}
            {beat >= 3 &&
                LEKT_KORT.map((k, i) => {
                    if (beat < k.fra) return null;
                    const antall = beat >= 4 ? 4 : 3;
                    const x = B / 2 + (i - (antall - 1) / 2) * 380;
                    const fram = beat === 4 && i === 0;
                    return (
                        <Inn key={k.navn} k={k.navn} forsinkelse={beat === k.fra ? i * 0.4 : 0}>
                            <g
                                transform={`translate(${x} 470)`}
                                opacity={beat === 4 && i > 0 ? 0.5 : 1}
                            >
                                <rect
                                    x={-170}
                                    y={-230}
                                    width={340}
                                    height={460}
                                    rx={34}
                                    fill="#fff"
                                    stroke={k.farge}
                                    strokeWidth={fram ? 12 : 5}
                                />
                                <g transform="translate(0 -110)">
                                    <Ikon type={k.ikon} farge={k.farge} skala={1.6} />
                                </g>
                                <text
                                    y={40}
                                    textAnchor="middle"
                                    fontSize={50}
                                    fontWeight={900}
                                    fill={k.farge}
                                >
                                    {k.navn}
                                </text>
                                {k.tekst.map((t, j) => (
                                    <text
                                        key={t}
                                        y={110 + j * 46}
                                        textAnchor="middle"
                                        fontSize={34}
                                        fontWeight={700}
                                        fill="#0f172a"
                                    >
                                        {t}
                                    </text>
                                ))}
                            </g>
                        </Inn>
                    );
                })}
        </g>
    );
}

function Ikon({ type, farge, skala = 1 }: { type: string; farge: string; skala?: number }) {
    return (
        <g transform={`scale(${skala})`}>
            {type === 'sted' && (
                <>
                    <path
                        d="M 0 40 C -30 5 -32 -10 -32 -20 A 32 32 0 1 1 32 -20 C 32 -10 30 5 0 40 Z"
                        fill={farge}
                    />
                    <circle cx={0} cy={-20} r={12} fill="#fff" />
                </>
            )}
            {type === 'gruppe' &&
                [-30, 0, 30].map((dx, i) => (
                    <g key={i} transform={`translate(${dx} ${i === 1 ? -6 : 4})`}>
                        <circle cy={-18} r={12} fill={farge} />
                        <path d="M -16 22 Q -16 -2 0 -2 Q 16 -2 16 22 Z" fill={farge} />
                    </g>
                ))}
            {type === 'bobler' && (
                <>
                    <rect x={-40} y={-36} width={46} height={34} rx={12} fill={farge} />
                    <rect
                        x={-4}
                        y={-12}
                        width={46}
                        height={34}
                        rx={12}
                        fill={farge}
                        opacity={0.65}
                    />
                    <rect
                        x={-30}
                        y={14}
                        width={40}
                        height={28}
                        rx={10}
                        fill={farge}
                        opacity={0.4}
                    />
                </>
            )}
            {type === 'person' && (
                <>
                    <circle cy={-18} r={15} fill={farge} />
                    <path d="M -22 30 Q -22 0 0 0 Q 22 0 22 30 Z" fill={farge} />
                </>
            )}
        </g>
    );
}

/* ---------- forskere ---------- */

function useNorge() {
    const { geographies } = useFilmVerden();
    return useMemo(() => geographies.filter((g) => String(g.id) === '578'), [geographies]);
}

function NorgeKart({
    x,
    y,
    w,
    h,
    linje,
    farge,
}: {
    x: number;
    y: number;
    w: number;
    h: number;
    linje?: number;
    farge?: string;
}) {
    const norge = useNorge();
    const proj = useMemo(
        () =>
            geoMercator().fitExtent(
                [
                    [x, y],
                    [x + w, y + h],
                ],
                {
                    type: 'MultiPoint',
                    coordinates: [
                        [4.5, 57.9],
                        [31, 71.2],
                    ],
                } as never
            ),
        [x, y, w, h]
    );
    const sti = useMemo(() => geoPath(proj), [proj]);
    // En enkelt, tenkt linje over kartet: hvert lite kart viser ett trekk.
    const linjeSti = useMemo(() => {
        if (linje === undefined) return '';
        const pts: [number, number][] = [
            [5 + linje * 1.2, 58.5 + linje * 0.6],
            [7 + linje * 1.5, 61 + linje * 0.4],
            [9 + linje * 1.9, 63.5 + linje * 0.5],
            [13 + linje * 2, 66 + linje * 0.4],
        ];
        return `M ${pts.map((p) => (proj(p) as [number, number]).join(' ')).join(' L ')}`;
    }, [linje, proj]);
    const klipp = `geolekt-klipp-${x}-${y}`;
    return (
        <g clipPath={`url(#${klipp})`}>
            <defs>
                <clipPath id={klipp}>
                    <rect x={x} y={y} width={w} height={h} />
                </clipPath>
            </defs>
            {norge.map((g, i) => (
                <path
                    key={i}
                    d={sti(g as never) ?? ''}
                    fill="#e7dcc3"
                    stroke="#8a7a5a"
                    strokeWidth={1.5}
                />
            ))}
            {linjeSti && (
                <path
                    d={linjeSti}
                    fill="none"
                    stroke={farge}
                    strokeWidth={4}
                    strokeLinecap="round"
                />
            )}
        </g>
    );
}

const TID_X0 = 180;
const TID_X1 = 1420;
const aarX = (aar: number) => TID_X0 + ((aar - 1800) / 200) * (TID_X1 - TID_X0);

function Forskere({ beat }: { beat: number }) {
    const titler = [
        'Ivar Aasen reiser',
        'Dialektforskning blir vitenskap',
        'Byene og ordlistene',
        'Aldri ett samlet atlas',
    ];
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 3)]} />
            {beat <= 2 && (
                <g>
                    <line
                        x1={TID_X0}
                        y1={560}
                        x2={TID_X1}
                        y2={560}
                        stroke="#475569"
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                    {[1800, 1900, 2000].map((a) => (
                        <g key={a}>
                            <line
                                x1={aarX(a)}
                                y1={545}
                                x2={aarX(a)}
                                y2={575}
                                stroke="#475569"
                                strokeWidth={5}
                            />
                            <text
                                x={aarX(a)}
                                y={625}
                                textAnchor="middle"
                                fontSize={36}
                                fontWeight={800}
                                fill="#475569"
                            >
                                {a}
                            </text>
                        </g>
                    ))}
                    {/* Aasen: 1800-tallet */}
                    <rect
                        x={aarX(1800)}
                        y={520}
                        width={aarX(1900) - aarX(1800)}
                        height={80}
                        fill="#0f766e"
                        opacity={0.18}
                    />
                    <g transform={`translate(${aarX(1850)} 330)`}>
                        <rect
                            x={-310}
                            y={-90}
                            width={620}
                            height={180}
                            rx={28}
                            fill="#fff"
                            stroke="#0f766e"
                            strokeWidth={5}
                        />
                        <text
                            y={-20}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={900}
                            fill="#0f766e"
                        >
                            Ivar Aasen
                        </text>
                        <text
                            y={40}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill="#0f172a"
                        >
                            {beat === 0
                                ? 'reiser på 1800-tallet'
                                : 'gjør dialektforskning til vitenskap'}
                        </text>
                    </g>
                    {beat === 0 && (
                        <Inn forsinkelse={0.6}>
                            <path
                                d={`M ${aarX(1815)} 700 q 60 -60 120 0 t 120 0 t 120 0 t 120 0 t 120 0`}
                                fill="none"
                                stroke="#0f766e"
                                strokeWidth={6}
                                strokeDasharray="14 12"
                            />
                            <text
                                x={aarX(1850)}
                                y={790}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={700}
                                fill="#0f766e"
                            >
                                fra bygd til bygd
                            </text>
                        </Inn>
                    )}
                    {beat === 1 && (
                        <Inn forsinkelse={0.4}>
                            <g transform={`translate(${aarX(1850)} 740)`}>
                                <rect
                                    x={-210}
                                    y={-50}
                                    width={420}
                                    height={100}
                                    rx={24}
                                    fill="#0f766e"
                                />
                                <text
                                    y={14}
                                    textAnchor="middle"
                                    fontSize={40}
                                    fontWeight={900}
                                    fill="#fff"
                                >
                                    ny vitenskap
                                </text>
                            </g>
                        </Inn>
                    )}
                    {beat >= 2 && (
                        <Inn>
                            <rect
                                x={aarX(1900)}
                                y={520}
                                width={aarX(1930) - aarX(1900)}
                                height={80}
                                fill="#2563eb"
                                opacity={0.25}
                            />
                            <g transform={`translate(${aarX(1915) + 40} 760)`}>
                                <rect
                                    x={-270}
                                    y={-80}
                                    width={540}
                                    height={160}
                                    rx={26}
                                    fill="#fff"
                                    stroke="#2563eb"
                                    strokeWidth={5}
                                />
                                <text
                                    y={-14}
                                    textAnchor="middle"
                                    fontSize={42}
                                    fontWeight={900}
                                    fill="#2563eb"
                                >
                                    Amund B. Larsen
                                </text>
                                <text
                                    y={44}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={700}
                                    fill="#0f172a"
                                >
                                    tidlig 1900-tall: bymålene
                                </text>
                            </g>
                            <defs>
                                <linearGradient id="geolekt-storm" x1="0" x2="1" y1="0" y2="0">
                                    <stop offset="0" stopColor="#c2410c" stopOpacity={0} />
                                    <stop offset="0.45" stopColor="#c2410c" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <rect
                                x={aarX(1880)}
                                y={463}
                                width={aarX(1975) - aarX(1880)}
                                height={14}
                                rx={7}
                                fill="url(#geolekt-storm)"
                            />
                            <g transform={`translate(${aarX(1975) - 40} 330)`}>
                                <rect
                                    x={-290}
                                    y={-80}
                                    width={580}
                                    height={160}
                                    rx={26}
                                    fill="#fff"
                                    stroke="#c2410c"
                                    strokeWidth={5}
                                />
                                <text
                                    y={-14}
                                    textAnchor="middle"
                                    fontSize={42}
                                    fontWeight={900}
                                    fill="#c2410c"
                                >
                                    Johan Storms ordlister
                                </text>
                                <text
                                    y={44}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={700}
                                    fill="#0f172a"
                                >
                                    brukt fram til 1970-tallet
                                </text>
                            </g>
                        </Inn>
                    )}
                </g>
            )}
            {beat >= 3 && (
                <g>
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                        const kol = i % 3;
                        const rad = Math.floor(i / 3);
                        const x = 110 + kol * 250;
                        const y = 190 + rad * 330;
                        return (
                            <Inn key={i} forsinkelse={i * 0.25}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={220}
                                    height={300}
                                    rx={16}
                                    fill="#fff"
                                    stroke="#cbd5e1"
                                    strokeWidth={4}
                                />
                                <NorgeKart
                                    x={x + 15}
                                    y={y + 15}
                                    w={190}
                                    h={270}
                                    linje={i}
                                    farge={
                                        [
                                            '#dc2626',
                                            '#2563eb',
                                            '#16a34a',
                                            '#7c3aed',
                                            '#ea580c',
                                            '#0891b2',
                                        ][i]
                                    }
                                />
                            </Inn>
                        );
                    })}
                    <text
                        x={445}
                        y={870}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        mange kart med ett trekk hver
                    </text>
                    <Inn forsinkelse={1.6}>
                        <rect
                            x={960}
                            y={190}
                            width={540}
                            height={630}
                            rx={24}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth={6}
                            strokeDasharray="22 16"
                        />
                        <text
                            x={1230}
                            y={470}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#475569"
                        >
                            Ett stort kart
                        </text>
                        <text
                            x={1230}
                            y={530}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#475569"
                        >
                            over alt?
                        </text>
                        <text
                            x={1230}
                            y={630}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#b91c1c"
                        >
                            Finnes ikke
                        </text>
                    </Inn>
                </g>
            )}
        </g>
    );
}

/* ---------- hopp ---------- */

const HINDER = [
    { navn: 'fjord', farge: '#3b82f6' },
    { navn: 'fjell', farge: '#78716c' },
    { navn: 'prestegjeld', farge: '#7c3aed' },
] as const;

function Hopp({ beat, playing }: { beat: number; playing: boolean }) {
    const titler = ['Brått skifte', 'Fjord, fjell, gammel grense', 'Ett trekk om gangen'];
    // I beat 1 bytter hinderet mellom bygdene seg hvert tredje sekund. På pause står fjorden.
    return (
        <g>
            <Tittel tekst={titler[Math.min(beat, 2)]} />
            {/* Bakken */}
            <rect x={0} y={560} width={B} height={340} fill="#a7c98f" />
            <Bygd2D x={380} />
            <Bygd2D x={1220} />
            <text x={380} y={780} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                én bygd
            </text>
            <text
                x={1220}
                y={780}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#0f172a"
            >
                nabobygda
            </text>
            {beat === 0 && <Fjord />}
            {beat === 1 && <HinderRad playing={playing} />}
            {beat === 2 && <Fjord />}
            {/* Trekk som bobler over bygdene */}
            {beat <= 1 && (
                <>
                    <TrekkBoble x={380} y={300} farge="#dc2626" tekst="trekk A" />
                    <motion.g initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
                        <TrekkBoble x={1220} y={300} farge="#94a3b8" tekst="ikke A" />
                    </motion.g>
                </>
            )}
            {beat === 2 && (
                <>
                    {['#dc2626', '#2563eb', '#16a34a'].map((f, i) => (
                        <g key={f}>
                            <TrekkBoble
                                x={380}
                                y={230 + i * 95}
                                farge={f}
                                tekst={`trekk ${'ABC'[i]}`}
                                liten
                            />
                            <TrekkBoble
                                x={1220}
                                y={230 + i * 95}
                                farge={i === 0 ? '#94a3b8' : f}
                                tekst={i === 0 ? 'ikke A' : `trekk ${'ABC'[i]}`}
                                liten
                            />
                        </g>
                    ))}
                    <Inn forsinkelse={0.6}>
                        <text
                            x={B / 2}
                            y={300}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#b91c1c"
                        >
                            bare A skifter
                        </text>
                    </Inn>
                </>
            )}
        </g>
    );
}

function Bygd2D({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} 640)`}>
            {[-90, 0, 90].map((dx, i) => (
                <g key={i} transform={`translate(${dx} ${i === 1 ? -10 : 10})`}>
                    <rect
                        x={-40}
                        y={-40}
                        width={80}
                        height={60}
                        fill="#9a3f2a"
                        stroke="#fff"
                        strokeWidth={3}
                    />
                    <path
                        d="M -50 -40 L 0 -80 L 50 -40 Z"
                        fill="#3f3f46"
                        stroke="#fff"
                        strokeWidth={3}
                    />
                </g>
            ))}
        </g>
    );
}

function Fjord() {
    return (
        <Inn>
            <path d="M 660 560 Q 800 600 940 560 L 940 900 L 660 900 Z" fill="#3b82f6" />
            <text x={800} y={720} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                fjord
            </text>
        </Inn>
    );
}

function HinderRad({ playing }: { playing: boolean }) {
    return (
        <g>
            {HINDER.map((h, i) => (
                <motion.g
                    key={h.navn}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: playing ? i * 0.8 : 0 }}
                >
                    <g transform={`translate(${640 + i * 160} 560)`}>
                        {h.navn === 'fjord' && (
                            <path d="M -80 0 Q 0 40 80 0 L 80 160 L -80 160 Z" fill={h.farge} />
                        )}
                        {h.navn === 'fjell' && (
                            <>
                                <path d="M -90 0 L 0 -200 L 90 0 Z" fill={h.farge} />
                                <path d="M -28 -138 L 0 -200 L 28 -138 Z" fill="#fff" />
                            </>
                        )}
                        {h.navn === 'prestegjeld' && (
                            <>
                                <line
                                    x1={0}
                                    y1={-220}
                                    x2={0}
                                    y2={160}
                                    stroke={h.farge}
                                    strokeWidth={8}
                                    strokeDasharray="20 14"
                                />
                                <Kirke x={-50} />
                                <Kirke x={50} />
                            </>
                        )}
                        {h.navn !== 'prestegjeld' && (
                            <text
                                y={i === 1 ? -220 : 200}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill="#0f172a"
                                stroke="#fff"
                                strokeWidth={6}
                                paintOrder="stroke"
                            >
                                {h.navn}
                            </text>
                        )}
                    </g>
                </motion.g>
            ))}
            <text x={800} y={860} textAnchor="middle" fontSize={34} fontWeight={700} fill="#0f172a">
                prestegjeld: området til én prest
            </text>
        </g>
    );
}

function Kirke({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} -30) scale(1.7)`}>
            <rect
                x={-18}
                y={-30}
                width={36}
                height={30}
                fill="#f8fafc"
                stroke="#475569"
                strokeWidth={3}
            />
            <path d="M -8 -30 L 0 -60 L 8 -30 Z" fill="#475569" />
        </g>
    );
}

function TrekkBoble({
    x,
    y,
    farge,
    tekst,
    liten = false,
}: {
    x: number;
    y: number;
    farge: string;
    tekst: string;
    liten?: boolean;
}) {
    const w = liten ? 230 : 280;
    const h = liten ? 76 : 110;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
        >
            <rect
                x={x - w / 2}
                y={y - h / 2}
                width={w}
                height={h}
                rx={h / 2.5}
                fill="#fff"
                stroke={farge}
                strokeWidth={6}
            />
            <text
                x={x}
                y={y + (liten ? 13 : 17)}
                textAnchor="middle"
                fontSize={liten ? 38 : 50}
                fontWeight={900}
                fill={farge === '#94a3b8' ? '#64748b' : farge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

/* ---------- fotografi ---------- */

function Fotografi({ beat }: { beat: number }) {
    const titler = [
        'Et gammelt fotografi',
        'Eldre folk på landsbygda',
        'Ikke ungdom i dag',
        'Linjene blir utydelige',
    ];
    const uklar = beat >= 3;
    return (
        <g>
            <defs>
                <filter id="geolekt-uklar">
                    <feGaussianBlur stdDeviation={uklar ? 6 : 0} />
                </filter>
            </defs>
            <Tittel tekst={titler[Math.min(beat, 3)]} farge="#fef3c7" />
            {/* Bildet med hvit kant, litt skjevt */}
            <g transform="translate(560 510) rotate(-3)">
                <rect x={-330} y={-330} width={660} height={660} fill="#fdf8ec" />
                <rect x={-300} y={-300} width={600} height={560} fill="#d9c7a1" />
                <g transform="translate(-300 -300)">
                    <NorgeKart x={20} y={20} w={560} h={520} />
                    <g filter="url(#geolekt-uklar)">
                        <NorgeLinjer />
                    </g>
                </g>
                <text
                    x={0}
                    y={305}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={700}
                    fill="#57534e"
                    fontStyle="italic"
                >
                    da svarene ble samlet inn
                </text>
            </g>
            {beat >= 1 && (
                <Inn>
                    <g transform="translate(1180 420)">
                        {[-80, 0, 80].map((dx, i) => (
                            <Eldre key={i} x={dx} />
                        ))}
                        <text
                            y={170}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#fef3c7"
                        >
                            eldre folk
                        </text>
                        <text
                            y={220}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill="#fef3c7"
                        >
                            på landsbygda
                        </text>
                    </g>
                </Inn>
            )}
            {beat === 2 && (
                <Inn forsinkelse={0.3}>
                    <g transform="translate(1250 760)">
                        <rect x={-250} y={-55} width={500} height={110} rx={26} fill="#fff" />
                        <text
                            y={16}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#b91c1c"
                        >
                            ungdom i dag: ikke med
                        </text>
                    </g>
                </Inn>
            )}
            {beat >= 3 && (
                <Inn>
                    <g transform="translate(1235 790)">
                        {['flytter mer', 'reiser mer', 'møtes på nett'].map((t, i) => (
                            <g key={t} transform={`translate(${(i - 1) * 205} 0)`}>
                                <rect x={-98} y={-38} width={196} height={76} rx={20} fill="#fff" />
                                <text
                                    y={11}
                                    textAnchor="middle"
                                    fontSize={28}
                                    fontWeight={900}
                                    fill="#0f172a"
                                >
                                    {t}
                                </text>
                            </g>
                        ))}
                    </g>
                </Inn>
            )}
        </g>
    );
}

/** Noen tenkte isoglosser over kartet i fotografiet. */
function NorgeLinjer() {
    const linjer = [
        'M 120 470 C 160 400 150 330 200 280',
        'M 90 400 C 160 380 210 330 230 250',
        'M 170 520 C 210 440 240 380 300 330',
        'M 220 300 C 270 250 320 200 380 170',
        'M 140 360 C 200 330 260 330 320 280',
    ];
    const farger = ['#7f1d1d', '#1e3a8a', '#14532d', '#581c87', '#7c2d12'];
    return (
        <>
            {linjer.map((d, i) => (
                <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={farger[i]}
                    strokeWidth={6}
                    strokeLinecap="round"
                />
            ))}
        </>
    );
}

function Eldre({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} 0)`}>
            <circle cy={-60} r={30} fill="#e7d3b5" />
            <path
                d="M -30 -78 Q 0 -105 30 -78"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={10}
                strokeLinecap="round"
            />
            <path d="M -44 100 Q -44 -20 0 -20 Q 44 -20 44 100 Z" fill="#78716c" />
            <line
                x1={50}
                y1={0}
                x2={60}
                y2={100}
                stroke="#a8a29e"
                strokeWidth={8}
                strokeLinecap="round"
            />
        </g>
    );
}
