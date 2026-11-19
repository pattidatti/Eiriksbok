import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Merke, Tekst } from './felles';

/**
 * Formen til novellen, tegnet i 2D.
 * «lys»: én liten ting (en hendelse, et møte, en tanke) kaster lys over et problem i samfunnet.
 * «saks»: romanen er en tykk bunke, novellen klippes ned til det viktigste. Poe, og mellom linjene.
 * «rammer»: få personer, kort tid og én handling.
 * «kurve»: handlingen bygger seg opp mot et vendepunkt, og slutter brått eller åpent.
 */

type Modus = 'lys' | 'saks' | 'rammer' | 'kurve';

const B = 1600;
const H = 900;

export function NovelleForm({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus: Modus = props.modus ?? 'lys';
    const mork = modus === 'lys';
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: mork ? '#0b1020' : '#f4efe4' }}
        >
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
                {modus === 'lys' && <Lys beat={beat} />}
                {modus === 'saks' && <Saks beat={beat} />}
                {modus === 'rammer' && <Rammer beat={beat} />}
                {modus === 'kurve' && <Kurve beat={beat} />}
            </svg>
        </div>
    );
}

/* ---------------------------------------------------------------- lys */

const GNIST = { x: 330, y: 560 };

function Lys({ beat }: { beat: number }) {
    const apen = beat >= 2;
    const hus = useMemo(
        () =>
            Array.from({ length: 9 }, (_, i) => {
                const b = 70 + ((i * 37) % 50);
                const h = 120 + ((i * 53) % 140);
                return { x: 820 + i * 82, b, h };
            }),
        []
    );
    return (
        <>
            <defs>
                <radialGradient id="nf-gnist">
                    <stop offset="0%" stopColor="#fff7d6" />
                    <stop offset="45%" stopColor="#fbbf24" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </radialGradient>
                <linearGradient id="nf-kjegle" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#fde68a" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#fde68a" stopOpacity={0.12} />
                </linearGradient>
            </defs>

            {/* Lyskjeglen fra den lille tingen mot samfunnet */}
            <motion.path
                d={`M ${GNIST.x} ${GNIST.y - 12} L 1580 ${GNIST.y - 420} L 1580 ${GNIST.y + 230} L ${GNIST.x} ${GNIST.y + 12} Z`}
                fill="url(#nf-kjegle)"
                initial={{ opacity: 0 }}
                animate={{ opacity: apen ? 1 : 0 }}
                transition={{ duration: 1.4 }}
            />

            {/* Samfunnet: husrekke i mørket som blir lyst opp */}
            {hus.map((h, i) => (
                <g key={i}>
                    <motion.rect
                        x={h.x}
                        y={GNIST.y + 190 - h.h}
                        width={h.b}
                        height={h.h}
                        initial={false}
                        animate={{ fill: apen ? '#e7d3a6' : '#151b2e' }}
                        transition={{ duration: 1.2, delay: apen ? 0.3 + i * 0.08 : 0 }}
                    />
                    <motion.rect
                        x={h.x + h.b / 2 - 12}
                        y={GNIST.y + 190 - h.h + 26}
                        width={24}
                        height={30}
                        initial={false}
                        animate={{ fill: apen ? '#7c5a2b' : '#0f1424' }}
                        transition={{ duration: 1.2 }}
                    />
                </g>
            ))}
            <rect
                x={780}
                y={GNIST.y + 190}
                width={800}
                height={12}
                fill={apen ? '#a68a5b' : '#1e2438'}
            />

            {/* Gnisten */}
            <motion.circle
                cx={GNIST.x}
                cy={GNIST.y}
                r={70}
                fill="url(#nf-gnist)"
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 2.2, repeat: Infinity }}
            />
            <circle cx={GNIST.x} cy={GNIST.y} r={14} fill="#fffbeb" />

            {beat === 0 && (
                <Merke
                    x={GNIST.x}
                    y={GNIST.y + 120}
                    tekst="Én liten ting"
                    fs={44}
                    fyll="#fef3c7"
                    farge="#78350f"
                />
            )}
            {beat === 1 && (
                <>
                    <Merke
                        x={GNIST.x}
                        y={GNIST.y - 260}
                        tekst="én hendelse"
                        fs={38}
                        fyll="#fef3c7"
                        farge="#78350f"
                    />
                    <Merke
                        x={GNIST.x}
                        y={GNIST.y - 160}
                        tekst="et tilfeldig møte"
                        fs={38}
                        fyll="#fef3c7"
                        farge="#78350f"
                        forsinkelse={0.9}
                    />
                    <Merke
                        x={GNIST.x}
                        y={GNIST.y + 130}
                        tekst="en tanke som farer forbi"
                        fs={38}
                        fyll="#fef3c7"
                        farge="#78350f"
                        forsinkelse={1.8}
                    />
                </>
            )}
            {beat >= 2 && (
                <Merke
                    x={GNIST.x}
                    y={GNIST.y + 120}
                    tekst="Én liten ting"
                    fs={36}
                    fyll="#fef3c7"
                    farge="#78350f"
                />
            )}
            {beat >= 2 && (
                <Merke
                    x={1170}
                    y={GNIST.y + 270}
                    tekst="Et problem i samfunnet"
                    fs={44}
                    fyll="#ffffff"
                    farge="#0f172a"
                    forsinkelse={0.8}
                />
            )}
            {beat === 3 && (
                <Merke
                    x={B / 2}
                    y={130}
                    tekst="Starter smått, viser noe stort"
                    fs={54}
                    fyll="#fbbf24"
                    farge="#1c1917"
                />
            )}
            {beat < 3 && (
                <Tekst x={B / 2} y={130} fs={48} farge="#fde68a">
                    Kiellands form
                </Tekst>
            )}
        </>
    );
}

/* ---------------------------------------------------------------- saks */

const LINJER = 14;

function Saks({ beat }: { beat: number }) {
    // Hvilke linjer i novellen som overlever klippingen.
    const beholdes = [1, 4, 8, 11];
    const klippet = beat >= 1;
    const novelleX = 940;
    const sideY = 200;
    const linjeY = (i: number) => sideY + 50 + i * 38;
    return (
        <>
            {/* Romanen: en tykk bunke sider */}
            <g opacity={beat >= 3 ? 0.35 : 1} style={{ transition: 'opacity 0.8s' }}>
                {Array.from({ length: 16 }, (_, i) => (
                    <rect
                        key={i}
                        x={150 + i * 4}
                        y={250 - i * 9}
                        width={360}
                        height={460}
                        rx={6}
                        fill={i === 15 ? '#ffffff' : '#ebe3d1'}
                        stroke="#b8ab8c"
                        strokeWidth={2}
                    />
                ))}
                {Array.from({ length: 10 }, (_, i) => (
                    <rect
                        key={i}
                        x={250}
                        y={170 + i * 40}
                        width={270}
                        height={10}
                        rx={5}
                        fill="#cbd5e1"
                    />
                ))}
                <Tekst x={360} y={790} fs={44}>
                    Roman
                </Tekst>
                <Tekst x={360} y={835} fs={30} farge="#57534e" vekt={600}>
                    hundrevis av sider
                </Tekst>
            </g>

            {/* Novellen: én side der det som ikke trengs, klippes bort */}
            <g>
                <rect
                    x={novelleX - 40}
                    y={sideY}
                    width={500}
                    height={600}
                    rx={10}
                    fill="#ffffff"
                    stroke="#b8ab8c"
                    strokeWidth={2}
                />
                {Array.from({ length: LINJER }, (_, i) => {
                    const blir = beholdes.includes(i);
                    const bredde = 300 + ((i * 71) % 120);
                    return (
                        <motion.rect
                            key={i}
                            x={novelleX}
                            y={linjeY(i)}
                            height={12}
                            rx={6}
                            initial={false}
                            animate={{
                                width: bredde,
                                opacity: klippet && !blir ? 0.08 : 1,
                                fill: blir && beat >= 2 ? '#0f766e' : '#94a3b8',
                            }}
                            transition={{ duration: 0.7, delay: klippet && !blir ? i * 0.08 : 0 }}
                        />
                    );
                })}
                {/* Mellom linjene: spørsmålstegn i hullene */}
                {beat >= 4 &&
                    [2.5, 6, 9.5].map((m, i) => (
                        <Tekst
                            key={i}
                            x={novelleX + 210}
                            y={linjeY(m) + 22}
                            fs={56}
                            farge="#b45309"
                            forsinkelse={0.3 + i * 0.4}
                        >
                            ?
                        </Tekst>
                    ))}
                {beat !== 3 && (
                    <Tekst x={novelleX + 210} y={850} fs={44}>
                        Novelle
                    </Tekst>
                )}
            </g>

            {/* Saksa */}
            {beat === 1 && (
                <motion.g
                    initial={{ x: 0, y: -40 }}
                    animate={{ x: 0, y: 470 }}
                    transition={{ duration: 2.4, ease: 'easeInOut' }}
                >
                    <Saksa x={novelleX - 110} y={sideY + 40} />
                </motion.g>
            )}

            {/* Overskrift per beat */}
            {beat === 0 && <Merke x={B / 2} y={90} tekst="Roman mot novelle" fs={50} />}
            {beat === 1 && (
                <Merke
                    x={B / 2}
                    y={90}
                    tekst="Konsentrert: alt som ikke trengs, tas bort"
                    fs={44}
                    fyll="#0f172a"
                    farge="#ffffff"
                />
            )}
            {beat === 2 && (
                <Merke
                    x={B / 2}
                    y={90}
                    tekst="Bare det viktigste blir igjen"
                    fs={48}
                    fyll="#0f766e"
                    farge="#ffffff"
                />
            )}
            {beat === 3 && (
                <>
                    <Merke
                        x={B / 2}
                        y={90}
                        tekst="Edgar Allan Poe: les den uten pause"
                        fs={46}
                        fyll="#0f172a"
                        farge="#ffffff"
                    />
                    <Lesepil x1={novelleX - 10} x2={novelleX + 430} y={linjeY(13) + 50} />
                </>
            )}
            {beat === 4 && (
                <Merke
                    x={B / 2}
                    y={90}
                    tekst="Meningen ligger mellom linjene"
                    fs={48}
                    fyll="#b45309"
                    farge="#ffffff"
                />
            )}
        </>
    );
}

function Saksa({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle cx={-34} cy={-18} r={20} fill="none" stroke="#dc2626" strokeWidth={9} />
            <circle cx={-34} cy={22} r={20} fill="none" stroke="#dc2626" strokeWidth={9} />
            <path d="M -16 -10 L 70 12 L -16 14 Z" fill="#475569" />
            <path d="M -16 10 L 70 -8 L -16 -14 Z" fill="#64748b" />
            <line x1={-20} y1={0} x2={560} y2={0} stroke="#dc2626" strokeWidth={3} opacity={0.35} />
        </g>
    );
}

function Lesepil({ x1, x2, y }: { x1: number; x2: number; y: number }) {
    return (
        <g>
            <motion.line
                x1={x1}
                x2={x2}
                y1={y}
                y2={y}
                stroke="#0f766e"
                strokeWidth={8}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: 'linear' }}
            />
            <motion.path
                d={`M ${x2 - 6} ${y - 18} L ${x2 + 22} ${y} L ${x2 - 6} ${y + 18} Z`}
                fill="#0f766e"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.1 }}
            />
            <Tekst x={(x1 + x2) / 2} y={y + 60} fs={40} farge="#0f766e" forsinkelse={0.4}>
                fra start til slutt, i én omgang
            </Tekst>
        </g>
    );
}

/* ---------------------------------------------------------------- rammer */

const PANEL_Y = 190;
const PANEL_H = 560;
const PANELER = [
    { x: 70, tittel: 'Personer' },
    { x: 570, tittel: 'Tid' },
    { x: 1070, tittel: 'Handling' },
];

function Rammer({ beat }: { beat: number }) {
    const folk = useMemo(
        () =>
            Array.from({ length: 140 }, (_, i) => {
                const a = Math.sin(i * 12.9898) * 43758.5453;
                const b = Math.sin(i * 78.233) * 12345.678;
                return {
                    x: 110 + (a - Math.floor(a)) * 380,
                    y: PANEL_Y + 120 + (b - Math.floor(b)) * 300,
                };
            }),
        []
    );
    return (
        <>
            {PANELER.map((p, i) => (
                <g key={p.tittel} opacity={beat >= [0, 2, 3][i] ? 1 : 0.35}>
                    <rect
                        x={p.x}
                        y={PANEL_Y}
                        width={460}
                        height={PANEL_H}
                        rx={28}
                        fill="#ffffff"
                        stroke="#d6cdb6"
                        strokeWidth={3}
                    />
                    <text
                        x={p.x + 230}
                        y={PANEL_Y + 70}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        {p.tittel}
                    </text>
                </g>
            ))}

            {/* Personer: en tett mengde (romanen) som blir til hovedpersonen og én eller to til */}
            {folk.map((f, i) => (
                <motion.circle
                    key={i}
                    cx={f.x}
                    cy={f.y}
                    r={9}
                    fill="#64748b"
                    initial={false}
                    animate={{ opacity: beat === 0 ? 0.8 : 0 }}
                    transition={{ duration: 0.8, delay: beat === 0 ? 0 : (i % 20) * 0.03 }}
                />
            ))}
            {beat === 0 && (
                <Merke x={300} y={PANEL_Y + 500} tekst="Roman: mange" fs={34} fyll="#e2e8f0" />
            )}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Figur x={300} y={PANEL_Y + 330} s={1.5} farge="#0f766e" />
                    <Figur x={170} y={PANEL_Y + 360} s={1} farge="#94a3b8" />
                    <Figur x={430} y={PANEL_Y + 360} s={1} farge="#94a3b8" />
                    <Merke
                        x={300}
                        y={PANEL_Y + 455}
                        tekst="Ofte: hovedpersonen"
                        fs={32}
                        fyll="#ccfbf1"
                        farge="#134e4a"
                    />
                    <Merke
                        x={300}
                        y={PANEL_Y + 515}
                        tekst="+ én eller to"
                        fs={32}
                        fyll="#ccfbf1"
                        farge="#134e4a"
                    />
                </motion.g>
            )}

            {/* Tid: en lang linje (et langt liv) krymper til timer og dager */}
            {beat >= 2 && (
                <g>
                    <Tekst
                        x={610}
                        y={PANEL_Y + 140}
                        fs={34}
                        farge="#57534e"
                        vekt={700}
                        anker="start"
                    >
                        Roman: et langt liv
                    </Tekst>
                    <rect
                        x={610}
                        y={PANEL_Y + 158}
                        width={380}
                        height={30}
                        rx={15}
                        fill="#94a3b8"
                    />
                    <Tekst
                        x={610}
                        y={PANEL_Y + 240}
                        fs={34}
                        farge="#134e4a"
                        vekt={800}
                        anker="start"
                        forsinkelse={0.6}
                    >
                        Novelle: kort tid
                    </Tekst>
                    <motion.rect
                        x={610}
                        y={PANEL_Y + 258}
                        height={30}
                        rx={15}
                        fill="#0f766e"
                        initial={{ width: 0 }}
                        animate={{ width: 70 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                    />
                    <Tekst x={800} y={PANEL_Y + 320} fs={32} forsinkelse={1.4}>
                        noen timer
                    </Tekst>
                    <Tekst x={800} y={PANEL_Y + 375} fs={32} forsinkelse={2.1}>
                        en dag
                    </Tekst>
                    <Tekst x={800} y={PANEL_Y + 430} fs={32} forsinkelse={2.4}>
                        noen få dager
                    </Tekst>
                </g>
            )}

            {/* Handling: mange tråder blir til én */}
            {beat >= 3 && (
                <g>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.path
                            key={i}
                            d={`M 1110 ${PANEL_Y + 160 + i * 60} C 1200 ${PANEL_Y + 100 + i * 90}, 1300 ${PANEL_Y + 420 - i * 70}, 1490 ${PANEL_Y + 200 + i * 55}`}
                            fill="none"
                            stroke="#94a3b8"
                            strokeWidth={6}
                            initial={{ opacity: 0.9 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                        />
                    ))}
                    <motion.path
                        d={`M 1110 ${PANEL_Y + 300} C 1220 ${PANEL_Y + 240}, 1360 ${PANEL_Y + 360}, 1490 ${PANEL_Y + 300}`}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth={14}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 1.6 }}
                    />
                    <Merke
                        x={1300}
                        y={PANEL_Y + 500}
                        tekst="Sjelden sidehistorier"
                        fs={30}
                        fyll="#ccfbf1"
                        farge="#134e4a"
                        forsinkelse={2.2}
                    />
                </g>
            )}

            <Tekst x={B / 2} y={110} fs={50}>
                En novelle holder seg gjerne innenfor rammene
            </Tekst>
        </>
    );
}

function Figur({ x, y, s, farge }: { x: number; y: number; s: number; farge: string }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-62} r={22} fill={farge} />
            <path d="M -32 30 Q -32 -34 0 -34 Q 32 -34 32 30 Z" fill={farge} />
        </g>
    );
}

/* ---------------------------------------------------------------- kurve */

const X0 = 180;
const XTOPP = 1000;
const GRUNN = 760;

function Kurve({ beat }: { beat: number }) {
    const stigning = `M ${X0} ${GRUNN} C ${X0 + 300} ${GRUNN - 40}, ${XTOPP - 300} ${GRUNN - 250}, ${XTOPP} 300`;
    const bratt = `M ${XTOPP} 300 L ${XTOPP + 90} ${GRUNN}`;
    const apen = `M ${XTOPP} 300 C ${XTOPP + 160} 280, ${XTOPP + 300} 330, ${XTOPP + 400} 360`;
    return (
        <>
            {/* Akser */}
            <line x1={X0 - 20} y1={GRUNN} x2={1500} y2={GRUNN} stroke="#a8a29e" strokeWidth={4} />
            <Tekst x={X0 - 20} y={GRUNN + 60} fs={30} farge="#57534e" vekt={700} anker="start">
                Start
            </Tekst>
            <Tekst x={1500} y={GRUNN + 60} fs={30} farge="#57534e" vekt={700} anker="end">
                tid i novellen
            </Tekst>

            <motion.path
                d={stigning}
                fill="none"
                stroke="#0f172a"
                strokeWidth={12}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            {beat === 0 && <Merke x={560} y={480} tekst="Spenningen bygger seg opp" fs={38} />}

            {beat >= 1 && (
                <g>
                    <motion.circle
                        cx={XTOPP}
                        cy={300}
                        r={26}
                        fill="#dc2626"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />
                    <Merke
                        x={XTOPP}
                        y={200}
                        tekst="Vendepunkt: noe avgjørende skjer"
                        fs={40}
                        fyll="#dc2626"
                        farge="#ffffff"
                    />
                </g>
            )}

            {beat >= 2 && (
                <g opacity={beat === 3 ? 0.35 : 1} style={{ transition: 'opacity 0.6s' }}>
                    <motion.path
                        d={bratt}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={12}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4 }}
                    />
                    <Merke
                        x={XTOPP + 130}
                        y={GRUNN - 140}
                        tekst="Brå slutt"
                        fs={36}
                        fyll="#0f172a"
                        farge="#ffffff"
                    />
                    <Merke
                        x={XTOPP + 130}
                        y={GRUNN - 70}
                        tekst="ofte en overraskende vri"
                        fs={34}
                        fyll="#e7e5e4"
                    />
                </g>
            )}

            {beat >= 3 && (
                <g>
                    <motion.path
                        d={apen}
                        fill="none"
                        stroke="#b45309"
                        strokeWidth={12}
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={XTOPP + 430 + i * 32}
                            cy={365}
                            r={7}
                            fill="#b45309"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 - i * 0.3 }}
                            transition={{ delay: 0.6 + i * 0.25 }}
                        />
                    ))}
                    <Tekst
                        x={XTOPP + 530}
                        y={395}
                        fs={88}
                        farge="#b45309"
                        vekt={900}
                        forsinkelse={1}
                    >
                        ?
                    </Tekst>
                    <Merke
                        x={XTOPP + 300}
                        y={470}
                        tekst="Åpen slutt"
                        fs={36}
                        fyll="#b45309"
                        farge="#ffffff"
                        forsinkelse={0.6}
                    />
                    <Merke
                        x={XTOPP + 300}
                        y={540}
                        tekst="du tenker videre"
                        fs={36}
                        fyll="#ffedd5"
                        farge="#7c2d12"
                        forsinkelse={0.9}
                    />
                </g>
            )}
        </>
    );
}
