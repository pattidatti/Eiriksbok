import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate16x9, Kort } from './felles';

/**
 * Det som skjer inne i fortelleren, tegnet i 2D: fortelleren som et glass mellom verden og
 * leseren, tankestrømmen i hodet hans, humøret som svinger, og koblingen fra virkemiddel til
 * det det gjør med oss.
 */

type Modus = 'filter' | 'strom' | 'humor' | 'kobling';

const SKRIFT = 'Outfit, Inter, sans-serif';

/** En liten figur: hode og kropp. */
function Mini({ x, y, farge, skala = 1 }: { x: number; y: number; farge: string; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <circle cx={0} cy={-62} r={22} fill={farge} />
            <rect x={-26} y={-36} width={52} height={78} rx={18} fill={farge} />
        </g>
    );
}

function Filter({ beat }: { beat: number }) {
    const farget = beat >= 2;
    const glass = beat === 0 ? '#cbd5e1' : beat === 1 ? '#e0f2fe' : '#f59e0b';
    const glassOp = beat === 0 ? 0.45 : beat === 1 ? 0.3 : 0.85;
    const etter = farget ? '#fb923c' : '#e2e8f0';
    const straler = [380, 450, 520];
    const tekster = [
        'Fortelleren er filteret',
        'Pålitelig: et klart glass',
        'Upålitelig: farget av følelser og skam',
        'Les mellom linjene',
    ];
    return (
        <g>
            {/* Overskrifter over de tre delene */}
            {[
                { x: 270, t: 'Det som skjer' },
                { x: 800, t: 'Fortelleren' },
                { x: 1330, t: 'Deg som leser' },
            ].map((o) => (
                <text
                    key={o.t}
                    x={o.x}
                    y={200}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill="#f8fafc"
                    fontFamily={SKRIFT}
                >
                    {o.t}
                </text>
            ))}
            {/* Verden: han og hun */}
            <rect
                x={120}
                y={260}
                width={300}
                height={320}
                rx={24}
                fill="#1e293b"
                stroke="#64748b"
                strokeWidth={4}
            />
            <Mini x={215} y={500} farge="#93c5fd" />
            <Mini x={325} y={500} farge="#fda4af" />
            {/* Strålene gjennom glasset */}
            {straler.map((y, i) => (
                <g key={y}>
                    <line
                        x1={430}
                        y1={y}
                        x2={770}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                    <motion.line
                        x1={830}
                        y1={y}
                        x2={1180}
                        initial={false}
                        animate={{ y2: farget ? y + (i - 1) * 40 + 15 : y, stroke: etter }}
                        transition={{ duration: 0.8 }}
                        strokeWidth={6}
                        strokeLinecap="round"
                    />
                </g>
            ))}
            {/* Glasset */}
            <motion.rect
                x={770}
                y={250}
                width={60}
                height={400}
                rx={10}
                initial={false}
                animate={{ fill: glass, opacity: glassOp }}
                transition={{ duration: 0.8 }}
                stroke="#f8fafc"
                strokeWidth={4}
            />
            {farget && (
                <motion.path
                    d="M 778 300 L 812 360 L 790 420 L 822 500 L 796 590"
                    fill="none"
                    stroke="#7c2d12"
                    strokeWidth={4}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                />
            )}
            {/* Leseren: bildet som kommer fram */}
            <rect
                x={1180}
                y={260}
                width={300}
                height={320}
                rx={24}
                fill="#1e293b"
                stroke="#64748b"
                strokeWidth={4}
            />
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <Mini
                        x={1275}
                        y={500}
                        farge={farget ? '#f97316' : '#93c5fd'}
                        skala={farget ? 1.25 : 1}
                    />
                    <Mini
                        x={1395}
                        y={500}
                        farge={farget ? '#fdba74' : '#fda4af'}
                        skala={farget ? 0.75 : 1}
                    />
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {[
                        [1240, 330],
                        [1335, 310],
                        [1430, 340],
                    ].map(([x, y]) => (
                        <text
                            key={x}
                            x={x}
                            y={y + 20}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill="#fde047"
                            fontFamily={SKRIFT}
                        >
                            ?
                        </text>
                    ))}
                </motion.g>
            )}
            <Kort
                key={beat}
                x={800}
                y={700}
                linjer={[tekster[Math.min(beat, 3)]]}
                fs={46}
                fyll={farget ? '#fbbf24' : '#ffffff'}
            />
        </g>
    );
}

const ORD: { t: string; x: number; y: number; farge: string }[] = [
    { t: 'God aften!', x: 660, y: 400, farge: '#e2e8f0' },
    { t: 'smile?', x: 930, y: 380, farge: '#93c5fd' },
    { t: 'hjertet slo høyt', x: 760, y: 480, farge: '#fda4af' },
    { t: 'forelsket!', x: 990, y: 520, farge: '#fb7185' },
    { t: 'fattig', x: 640, y: 570, farge: '#fbbf24' },
    { t: 'stolt', x: 900, y: 610, farge: '#fde047' },
];

function Strom({ beat }: { beat: number }) {
    const sti = 'M 660 390 L 930 370 L 760 470 L 990 510 L 640 560 L 900 600';
    return (
        <g>
            <Kort
                x={800}
                y={40}
                linjer={[
                    '«Hvert av hennes ord beruset meg,',
                    'traff meg i hjertet som vindråper.»',
                ]}
                fs={44}
                fyll="#fef3c7"
                vekt={700}
            />
            {/* Hodet */}
            <ellipse
                cx={800}
                cy={540}
                rx={300}
                ry={250}
                fill="#1e293b"
                stroke="#94a3b8"
                strokeWidth={6}
            />
            <rect x={730} y={780} width={140} height={120} fill="#1e293b" />
            <line x1={730} y1={782} x2={730} y2={900} stroke="#94a3b8" strokeWidth={6} />
            <line x1={870} y1={782} x2={870} y2={900} stroke="#94a3b8" strokeWidth={6} />
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    {[
                        [700, 420, 70],
                        [900, 470, 90],
                        [760, 620, 60],
                    ].map(([x, y, r]) => (
                        <circle key={x} cx={x} cy={y} r={r} fill="#a78bfa" opacity={0.35} />
                    ))}
                    <Kort
                        x={800}
                        y={500}
                        linjer={['hemmelige bevegelser', 'i sjelen']}
                        fs={36}
                        fyll="#ede9fe"
                    />
                </motion.g>
            )}
            {beat >= 2 && (
                <>
                    <motion.path
                        d={sti}
                        fill="none"
                        stroke="#64748b"
                        strokeWidth={4}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2 }}
                    />
                    {ORD.map((o, i) => (
                        <motion.text
                            key={o.t}
                            x={o.x}
                            y={o.y}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={800}
                            fill={o.farge}
                            fontFamily={SKRIFT}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 * i, duration: 0.4 }}
                        >
                            {o.t}
                        </motion.text>
                    ))}
                </>
            )}
            <Kort
                vis={beat >= 3}
                x={800}
                y={668}
                linjer={['Indre monolog: tankene slik de kommer']}
                fs={38}
                fyll="#fbbf24"
            />
        </g>
    );
}

const PUNKT = [
    { x: 250, y: 470 },
    { x: 600, y: 700 },
    { x: 900, y: 230 },
    { x: 1300, y: 760 },
];
const BITER = [
    'M 250 470 C 380 470, 470 700, 600 700',
    'M 600 700 C 720 700, 780 230, 900 230',
    'M 900 230 C 1040 230, 1180 760, 1300 760',
];

function Humor({ beat }: { beat: number }) {
    const ubalanse = beat >= 4;
    return (
        <g>
            {/* Aksene */}
            <line x1={200} y1={170} x2={200} y2={830} stroke="#94a3b8" strokeWidth={4} />
            <line x1={200} y1={830} x2={1500} y2={830} stroke="#94a3b8" strokeWidth={4} />
            <line
                x1={200}
                y1={470}
                x2={1500}
                y2={470}
                stroke="#475569"
                strokeWidth={3}
                strokeDasharray="12 12"
            />
            <text x={220} y={200} fontSize={38} fontWeight={800} fill="#f1f5f9" fontFamily={SKRIFT}>
                Høyt
            </text>
            <text x={215} y={815} fontSize={38} fontWeight={800} fill="#f1f5f9" fontFamily={SKRIFT}>
                Lavt
            </text>
            <text
                x={1500}
                y={815}
                textAnchor="end"
                fontSize={38}
                fontWeight={800}
                fill="#f1f5f9"
                fontFamily={SKRIFT}
            >
                utover i utdraget →
            </text>
            <text x={200} y={885} fontSize={34} fontWeight={700} fill="#e2e8f0" fontFamily={SKRIFT}>
                Skisse: ingen tall, bare hvordan humøret svinger
            </text>
            {beat === 0 && (
                <Kort x={850} y={330} linjer={['Humøret hans']} fs={56} fyll="#ffffff" />
            )}
            {BITER.map((d, i) =>
                beat >= i + 1 ? (
                    <motion.path
                        key={d}
                        d={d}
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1, stroke: ubalanse ? '#ef4444' : '#fbbf24' }}
                        transition={{ duration: 1.2 }}
                        strokeWidth={ubalanse ? 12 : 9}
                        strokeLinecap="round"
                    />
                ) : null
            )}
            {PUNKT.map((p, i) =>
                beat >= i ? (
                    <motion.circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={16}
                        fill="#f8fafc"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i === 0 ? 0 : 1 }}
                    />
                ) : null
            )}
            <Kort
                vis={beat >= 1}
                x={600}
                y={725}
                linjer={['«Jeg glemmer å smile»']}
                fs={34}
                fyll="#bfdbfe"
                forsinkelse={0.8}
            />
            <Kort
                vis={beat >= 2}
                x={900}
                y={110}
                linjer={['«Mitt hjerte slo høyt»']}
                fs={34}
                fyll="#fecdd3"
                forsinkelse={0.8}
            />
            <Kort
                vis={beat >= 3}
                x={1420}
                y={600}
                linjer={['«jeg er meget,', 'meget fattig»']}
                fs={34}
                fyll="#fde68a"
                forsinkelse={0.8}
            />
            <Kort
                vis={ubalanse}
                x={1340}
                y={250}
                linjer={['Ubalanse:', 'lyster, ikke fornuft']}
                fs={36}
                fyll="#ef4444"
                farge="#ffffff"
            />
        </g>
    );
}

const RADER = [
    {
        v: ['Personal synsvinkel:', 'kaoset i hodet hans'],
        e: ['Vi vet ikke hva Ylajali', 'vil: usikkerhet'],
    },
    { v: ['Raske skifter', 'i humøret'], e: ['Et menneske', 'i ubalanse'] },
    { v: ['Han snakker plutselig', 'om fattigdommen'], e: ['Et forsvar,', 'ikke en tilståelse'] },
];

function Kobling({ beat }: { beat: number }) {
    return (
        <g>
            <text
                x={420}
                y={130}
                textAnchor="middle"
                fontSize={50}
                fontWeight={900}
                fill="#fbbf24"
                fontFamily={SKRIFT}
            >
                Virkemiddel
            </text>
            <text
                x={1180}
                y={130}
                textAnchor="middle"
                fontSize={50}
                fontWeight={900}
                fill="#5eead4"
                fontFamily={SKRIFT}
            >
                Hva det gjør med oss
            </text>
            {RADER.map((r, i) => {
                const y = 200 + i * 220;
                const vis = beat >= i + 1;
                return (
                    <g key={i}>
                        {!vis && (
                            <>
                                <rect
                                    x={170}
                                    y={y}
                                    width={500}
                                    height={117}
                                    rx={16}
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth={4}
                                    strokeDasharray="14 10"
                                />
                                <rect
                                    x={930}
                                    y={y}
                                    width={500}
                                    height={117}
                                    rx={16}
                                    fill="none"
                                    stroke="#334155"
                                    strokeWidth={4}
                                    strokeDasharray="14 10"
                                />
                            </>
                        )}
                        <Kort vis={vis} x={420} y={y} linjer={r.v} fs={36} fyll="#fde68a" />
                        {vis && (
                            <motion.path
                                d={`M 700 ${y + 58} L 880 ${y + 58} M 852 ${y + 34} L 884 ${y + 58} L 852 ${y + 82}`}
                                fill="none"
                                stroke="#f8fafc"
                                strokeWidth={8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.7, delay: 0.4 }}
                            />
                        )}
                        <Kort
                            vis={vis}
                            x={1180}
                            y={y}
                            linjer={r.e}
                            fs={36}
                            fyll="#99f6e4"
                            forsinkelse={1}
                        />
                    </g>
                );
            })}
            <Kort
                vis={beat === 0}
                x={800}
                y={780}
                linjer={['Koble virkemidlet til virkningen']}
                fs={40}
                fyll="#ffffff"
            />
        </g>
    );
}

export function SultTanker({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'filter';
    return (
        <Flate16x9 bakgrunn="#0f172a">
            {modus === 'filter' && <Filter beat={beat} />}
            {modus === 'strom' && <Strom beat={beat} />}
            {modus === 'humor' && <Humor beat={beat} />}
            {modus === 'kobling' && <Kobling beat={beat} />}
        </Flate16x9>
    );
}
