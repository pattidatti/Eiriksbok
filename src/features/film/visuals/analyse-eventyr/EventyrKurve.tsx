import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Tre 2D-bilder til analysen: spenningskurven i tretallsloven, aktantene (rollene i
 * fortellingen) og veien fra den minste til slottet (moralen).
 */

type Modus = 'spenning' | 'roller' | 'riket';

const FONT = 'Outfit, Inter, sans-serif';
const BLEKK = '#2b2118';

function Vis({
    nar,
    children,
    forsinkelse = 0,
}: {
    nar: boolean;
    children: ReactNode;
    forsinkelse?: number;
}) {
    if (!nar) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: forsinkelse }}
        >
            {children}
        </motion.g>
    );
}

function T({
    x,
    y,
    children,
    s = 40,
    w = 800,
    farge = BLEKK,
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: ReactNode;
    s?: number;
    w?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontFamily={FONT}
            fontWeight={w}
            fontSize={s}
            fill={farge}
        >
            {children}
        </text>
    );
}

/* ---------- Spenningskurven ---------- */

const P0 = { x: 220, y: 760 };
const PUNKT = [
    { x: 460, y: 640, navn: 'Per' },
    { x: 840, y: 500, navn: 'Pål' },
    { x: 1220, y: 240, navn: 'Askeladden' },
];

function Strek({
    fra,
    til,
    farge = '#b45309',
}: {
    fra: { x: number; y: number };
    til: { x: number; y: number };
    farge?: string;
}) {
    const mx = (fra.x + til.x) / 2;
    return (
        <motion.path
            d={`M ${fra.x} ${fra.y} C ${mx} ${fra.y} ${mx} ${til.y} ${til.x} ${til.y}`}
            fill="none"
            stroke={farge}
            strokeWidth={12}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
    );
}

function Spenning({ beat }: { beat: number }) {
    return (
        <>
            <T x={800} y={100} s={64} w={900}>
                {beat === 0 ? 'Hvorfor akkurat tre?' : 'Tretallsloven: spenningen stiger'}
            </T>
            {/* Aksene */}
            <line x1={P0.x} y1={P0.y} x2={1420} y2={P0.y} stroke="#6b4f36" strokeWidth={5} />
            <line x1={P0.x} y1={P0.y} x2={P0.x} y2={170} stroke="#6b4f36" strokeWidth={5} />
            <text
                x={150}
                y={470}
                textAnchor="middle"
                fontFamily={FONT}
                fontWeight={800}
                fontSize={36}
                fill="#6b4f36"
                transform="rotate(-90 150 470)"
            >
                Spenning
            </text>
            {PUNKT.map((p, i) => (
                <g key={p.navn}>
                    <line
                        x1={p.x}
                        y1={P0.y - 12}
                        x2={p.x}
                        y2={P0.y + 12}
                        stroke="#6b4f36"
                        strokeWidth={5}
                    />
                    <T x={p.x} y={P0.y + 56} s={34} w={800} farge="#6b4f36">
                        {`${i + 1}. ${p.navn}`}
                    </T>
                </g>
            ))}
            <Vis nar={beat === 0}>
                <T x={820} y={420} s={52} w={800} farge="#7c5a3a">
                    Hvorfor ikke én, eller fire?
                </T>
            </Vis>

            {beat >= 1 && <Strek fra={P0} til={PUNKT[0]} />}
            {beat >= 2 && <Strek fra={PUNKT[0]} til={PUNKT[1]} />}
            {beat >= 3 && <Strek fra={PUNKT[1]} til={PUNKT[2]} />}

            {PUNKT.map((p, i) => {
                const fra = i + 1;
                if (beat < fra) return null;
                const feil = i < 2;
                const lykkes = !feil && beat >= 4;
                return (
                    <motion.g
                        key={`m${p.navn}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                    >
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r={36}
                            fill={feil ? '#fee2e2' : '#fef3c7'}
                            stroke={feil ? '#b91c1c' : '#b45309'}
                            strokeWidth={6}
                        />
                        <T x={p.x} y={p.y + 15} s={42} w={900} farge={feil ? '#b91c1c' : '#92400e'}>
                            {feil ? '✗' : lykkes ? '★' : '?'}
                        </T>
                    </motion.g>
                );
            })}
            <Vis nar={beat >= 1} forsinkelse={1}>
                <T x={PUNKT[0].x} y={PUNKT[0].y - 60} s={34} w={800} farge="#991b1b">
                    Trollet er farlig
                </T>
            </Vis>
            <Vis nar={beat >= 2} forsinkelse={1}>
                <T
                    x={PUNKT[1].x + 50}
                    y={PUNKT[1].y + 70}
                    s={34}
                    w={800}
                    farge="#991b1b"
                    anker="start"
                >
                    Umulig for et vanlig menneske
                </T>
            </Vis>
            <Vis nar={beat === 3} forsinkelse={1}>
                <T
                    x={PUNKT[2].x - 50}
                    y={PUNKT[2].y - 50}
                    s={38}
                    w={900}
                    farge="#92400e"
                    anker="end"
                >
                    Mest på spill
                </T>
            </Vis>
            <Vis nar={beat >= 4} forsinkelse={0.6}>
                <T
                    x={PUNKT[2].x - 50}
                    y={PUNKT[2].y - 50}
                    s={38}
                    w={900}
                    farge="#92400e"
                    anker="end"
                >
                    Den minste klarer det
                </T>
            </Vis>
            <Vis nar={beat >= 5}>
                {/* Uten Per og Pål: Askeladden alene, og kurven når ikke like høyt. */}
                <path
                    d={`M ${P0.x} ${P0.y} C 700 ${P0.y} 900 680 ${PUNKT[2].x} 640`}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth={8}
                    strokeDasharray="18 14"
                />
                <circle
                    cx={PUNKT[2].x}
                    cy={640}
                    r={22}
                    fill="#e2e8f0"
                    stroke="#64748b"
                    strokeWidth={5}
                />
                <T x={PUNKT[2].x + 40} y={650} s={32} w={800} farge="#475569" anker="start">
                    Uten Per og Pål
                </T>
                <T x={PUNKT[2].x + 40} y={696} s={32} w={800} farge="#334155" anker="start">
                    mindre spenning
                </T>
            </Vis>
            <T x={1580} y={884} s={30} w={700} farge="#5b4a38" anker="end">
                Skisse: spenning kan ikke måles
            </T>
        </>
    );
}

/* ---------- Aktantene ---------- */

interface Rolle {
    rolle: string;
    hva: string;
    navn: string[];
    symbol?: string;
    fraBeat: number;
    x: number;
    y: number;
    farge: string;
}

const ROLLER: Rolle[] = [
    {
        rolle: 'Subjekt',
        hva: 'vil oppnå noe',
        navn: ['Askeladden'],
        symbol: 'list',
        fraBeat: 1,
        x: 180,
        y: 210,
        farge: '#15803d',
    },
    {
        rolle: 'Objekt',
        hva: 'det hele handler om, ofte:',
        navn: ['Prinsessen og', 'halve riket'],
        fraBeat: 2,
        x: 920,
        y: 210,
        farge: '#b45309',
    },
    {
        rolle: 'Hjelper',
        hva: 'hjelper helten',
        navn: [],
        fraBeat: 3,
        x: 180,
        y: 560,
        farge: '#2563eb',
    },
    {
        rolle: 'Motstander',
        hva: 'står i veien',
        navn: ['Trollet'],
        symbol: 'rå kraft',
        fraBeat: 3,
        x: 920,
        y: 560,
        farge: '#991b1b',
    },
];
const BOKS = { b: 500, h: 220 };

function Roller({ beat }: { beat: number }) {
    return (
        <>
            <T x={800} y={110} s={58} w={900}>
                {beat >= 5
                    ? 'Typetegning: personene er symboler'
                    : 'Aktanter: rollene i fortellingen'}
            </T>
            {/* Pilene mellom rollene */}
            <Vis nar={beat >= 2}>
                <line x1={690} y1={320} x2={895} y2={320} stroke="#b45309" strokeWidth={8} />
                <path d="M 895 302 L 920 320 L 895 338 Z" fill="#b45309" />
            </Vis>
            <Vis nar={beat >= 3}>
                <line x1={430} y1={560} x2={430} y2={455} stroke="#2563eb" strokeWidth={8} />
                <path d="M 412 455 L 430 430 L 448 455 Z" fill="#2563eb" />
                <line x1={920} y1={600} x2={712} y2={448} stroke="#991b1b" strokeWidth={8} />
                <path d="M 704 470 L 690 432 L 730 438 Z" fill="#991b1b" />
            </Vis>
            {ROLLER.map((r) => {
                const fylt = beat >= r.fraBeat;
                const skifter = beat === 4 && r.navn.length > 0;
                const symbol = beat >= 5 && r.symbol;
                const cx = r.x + BOKS.b / 2;
                return (
                    <g key={r.rolle}>
                        <rect
                            x={r.x}
                            y={r.y}
                            width={BOKS.b}
                            height={BOKS.h}
                            rx={24}
                            fill={fylt ? '#ffffff' : '#f1ead9'}
                            stroke={beat === 4 ? '#d97706' : fylt ? r.farge : '#c8b796'}
                            strokeWidth={beat === 4 ? 10 : 6}
                        />
                        <T x={cx} y={r.y + 56} s={40} w={900} farge={fylt ? r.farge : '#a8957a'}>
                            {r.rolle}
                        </T>
                        <Vis nar={fylt}>
                            <T x={cx} y={r.y + 98} s={32} w={800} farge="#3b2a1c">
                                {r.hva}
                            </T>
                            {r.navn.length === 0 && (
                                <T x={cx} y={r.y + 170} s={34} w={700} farge="#64748b">
                                    ofte med
                                </T>
                            )}
                            {!symbol &&
                                r.navn.map((n, i) => (
                                    <text
                                        key={n}
                                        x={cx}
                                        y={r.y + (r.navn.length > 1 ? 145 + i * 44 : 176)}
                                        textAnchor="middle"
                                        fontFamily={FONT}
                                        fontWeight={900}
                                        fontSize={r.navn.length > 1 ? 40 : 50}
                                        fill={skifter ? '#78716c' : BLEKK}
                                        style={{ transition: 'fill 0.6s' }}
                                    >
                                        {n}
                                    </text>
                                ))}
                            {symbol && (
                                <motion.g
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <T x={cx} y={r.y + 176} s={54} w={900} farge={r.farge}>
                                        {`et bilde på ${r.symbol}`}
                                    </T>
                                </motion.g>
                            )}
                        </Vis>
                    </g>
                );
            })}
            <Vis nar={beat === 4}>
                <rect
                    x={470}
                    y={812}
                    width={660}
                    height={64}
                    rx={32}
                    fill="#fef3c7"
                    stroke="#d97706"
                    strokeWidth={4}
                />
                <T x={800} y={856} s={34} w={800} farge="#92400e">
                    Navnet kan skifte, rollen er den samme
                </T>
            </Vis>
        </>
    );
}

/* ---------- Veien til slottet ---------- */

const START = { x: 250, y: 790 };
const MAL = { x: 1210, y: 360 };

function Slott({ lys }: { lys: boolean }) {
    const mur = lys ? '#f5d58a' : '#b8a98c';
    return (
        <g style={{ transition: 'opacity 0.8s' }}>
            <rect x={1250} y={250} width={260} height={130} fill={mur} />
            {[1230, 1440].map((x) => (
                <g key={x}>
                    <rect x={x} y={180} width={90} height={200} fill={mur} />
                    <path
                        d={`M ${x - 10} 180 L ${x + 45} 110 L ${x + 100} 180 Z`}
                        fill={lys ? '#b91c1c' : '#7c6f5c'}
                    />
                </g>
            ))}
            <rect x={1355} y={310} width={50} height={70} rx={25} fill="#5b4030" />
            {[1270, 1470].map((x) => (
                <rect
                    key={x}
                    x={x}
                    y={230}
                    width={20}
                    height={30}
                    fill={lys ? '#fde047' : '#6b5d4a'}
                />
            ))}
        </g>
    );
}

function Riket({ beat }: { beat: number }) {
    const fram = beat >= 3;
    return (
        <>
            <defs>
                <linearGradient id="eventyr-himmel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fde7c0" />
                    <stop offset="1" stopColor="#f4d7a8" />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={1600} height={900} fill="url(#eventyr-himmel)" />
            {/* Bakken og haugen med slottet */}
            <path
                d="M 0 900 L 0 700 Q 500 640 900 560 Q 1200 420 1600 400 L 1600 900 Z"
                fill="#7a9a54"
            />
            <path
                d="M 0 900 L 0 800 Q 600 760 1000 700 Q 1300 650 1600 640 L 1600 900 Z"
                fill="#5f7f3f"
            />
            <path
                d={`M ${START.x} ${START.y + 30} Q 600 760 800 640 Q 1000 520 ${MAL.x} ${MAL.y + 30}`}
                fill="none"
                stroke="#c9a46a"
                strokeWidth={22}
                strokeLinecap="round"
            />
            <Slott lys={fram} />

            <Vis nar={beat === 0}>
                <T x={620} y={180} s={58} w={900}>
                    Hvorfor har historien
                </T>
                <T x={620} y={250} s={58} w={900}>
                    overlevd i generasjoner?
                </T>
            </Vis>
            <Vis nar={beat === 1}>
                <rect
                    x={110}
                    y={120}
                    width={620}
                    height={96}
                    rx={20}
                    fill="#fef3c7"
                    stroke="#b45309"
                    strokeWidth={5}
                />
                <T x={420} y={182} s={40} w={900} farge="#92400e">
                    De gode får sin lønn
                </T>
                <rect x={110} y={240} width={620} height={96} rx={20} fill="#1f2937" />
                <T x={420} y={302} s={40} w={900} farge="#ffffff">
                    De onde blir straffet
                </T>
            </Vis>

            {beat >= 2 && (
                <motion.g
                    initial={{ x: START.x, y: START.y, opacity: 0 }}
                    animate={{ x: fram ? MAL.x : START.x, y: fram ? MAL.y : START.y, opacity: 1 }}
                    transition={{ duration: fram ? 2.6 : 0.6, ease: 'easeInOut' }}
                >
                    <circle cx={0} cy={-62} r={16} fill="#f5c99a" />
                    <path d="M -10 -96 L 0 -118 L 10 -96 Z" fill="#7c4a1e" />
                    <path d="M -20 0 L -16 -40 Q 0 -48 16 -40 L 20 0 Z" fill="#15803d" />
                </motion.g>
            )}
            <Vis nar={beat === 2} forsinkelse={0.5}>
                {['minst', 'svakest', 'ofte sett ned på'].map((t, i) => (
                    <g key={t}>
                        <rect
                            x={320}
                            y={520 + i * 72}
                            width={t.length * 22 + 50}
                            height={58}
                            rx={16}
                            fill="#ffffff"
                            stroke="#6b4f36"
                            strokeWidth={3}
                        />
                        <T x={345} y={560 + i * 72} s={36} w={800} anker="start">
                            {t}
                        </T>
                    </g>
                ))}
            </Vis>
            <Vis nar={beat === 3} forsinkelse={1.6}>
                <T x={760} y={150} s={52} w={900} farge="#92400e">
                    Kongsdatteren og halve riket
                </T>
                <T x={760} y={204} s={36} w={700} farge="#6b4f36">
                    i mange eventyr
                </T>
            </Vis>
            <Vis nar={beat >= 4}>
                <rect
                    x={110}
                    y={110}
                    width={560}
                    height={86}
                    rx={20}
                    fill="#ffffff"
                    stroke="#15803d"
                    strokeWidth={5}
                />
                <T x={390} y={168} s={38} w={900} farge="#15803d">
                    Vær nysgjerrig
                </T>
                <rect
                    x={110}
                    y={216}
                    width={560}
                    height={86}
                    rx={20}
                    fill="#ffffff"
                    stroke="#15803d"
                    strokeWidth={5}
                />
                <T x={390} y={274} s={36} w={900} farge="#15803d">
                    Tenk annerledes enn flokken
                </T>
                <motion.text
                    x={800}
                    y={500}
                    textAnchor="middle"
                    fontFamily={FONT}
                    fontWeight={900}
                    fontSize={150}
                    fill="#b45309"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    HÅP
                </motion.text>
            </Vis>
        </>
    );
}

export function EventyrKurve({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'spenning';
    return (
        <div className="absolute inset-0" style={{ background: '#f6eedb' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'spenning' && <Spenning beat={beat} />}
                {modus === 'roller' && <Roller beat={beat} />}
                {modus === 'riket' && <Riket beat={beat} />}
            </svg>
        </div>
    );
}
