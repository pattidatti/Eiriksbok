import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Metafor og sammenligning. «metafor»: Du ER en stjerne, og egenskapene til stjernen flytter
 * over på personen. «som»: en bro med ordet som mellom personen og bildet, og løven som kan
 * bety tre ting til forfatteren sier hvilken. «par»: metaforer og sammenligninger side om side.
 */

type Modus = 'metafor' | 'som' | 'par';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const GULL = '#d97706';
const BLEKK = '#1e293b';

type Del = { t: string; uthevet?: boolean };

/** En setning der enkelte ord er uthevet. */
function Setning({
    deler,
    x,
    y,
    storrelse = 64,
}: {
    deler: Del[];
    x: number;
    y: number;
    storrelse?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={storrelse}
            fontWeight={800}
            fill={BLEKK}
            style={FONT}
        >
            {deler.map((d, i) => (
                <tspan key={i} fill={d.uthevet ? GULL : BLEKK} fontWeight={d.uthevet ? 900 : 800}>
                    {d.t}
                </tspan>
            ))}
        </text>
    );
}

function stjerneSti(cx: number, cy: number, r: number) {
    const p: string[] = [];
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 === 0 ? r : r * 0.45;
        p.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
    }
    return `M${p.join('L')}Z`;
}

function Person({ x, y, gloder }: { x: number; y: number; gloder: boolean }) {
    return (
        <g>
            <motion.circle
                cx={x}
                cy={y - 20}
                r={190}
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: gloder ? 0.55 : 0 }}
                transition={{ duration: 1 }}
            />
            <circle cx={x} cy={y - 120} r={58} fill="#334155" />
            <path
                d={`M${x - 110},${y + 130} Q${x - 110},${y - 40} ${x},${y - 40} Q${x + 110},${y - 40} ${x + 110},${y + 130} Z`}
                fill="#334155"
            />
        </g>
    );
}

function Stjerne({ x, y, gass }: { x: number; y: number; gass: boolean }) {
    return (
        <g>
            <motion.circle
                cx={x}
                cy={y}
                r={150}
                fill="#ea580c"
                initial={{ opacity: 0 }}
                animate={{ opacity: gass ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <motion.circle
                cx={x}
                cy={y}
                r={110}
                fill="#facc15"
                initial={{ opacity: 0 }}
                animate={{ opacity: gass ? 0.9 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <motion.path
                d={stjerneSti(x, y, 160)}
                fill="#facc15"
                stroke={GULL}
                strokeWidth={6}
                initial={{ opacity: 1 }}
                animate={{ opacity: gass ? 0 : 1 }}
                transition={{ duration: 0.8 }}
            />
        </g>
    );
}

function Love({ x, y }: { x: number; y: number }) {
    const manke: string[] = [];
    for (let i = 0; i < 24; i++) {
        const a = (i * Math.PI) / 12;
        const r = i % 2 === 0 ? 170 : 128;
        manke.push(`${(x + Math.cos(a) * r).toFixed(1)},${(y + Math.sin(a) * r).toFixed(1)}`);
    }
    return (
        <g>
            <path d={`M${manke.join('L')}Z`} fill="#c2410c" />
            <circle cx={x} cy={y} r={110} fill="#f59e0b" />
            <circle cx={x - 40} cy={y - 25} r={12} fill={BLEKK} />
            <circle cx={x + 40} cy={y - 25} r={12} fill={BLEKK} />
            <path
                d={`M${x - 22},${y + 15} L${x + 22},${y + 15} L${x},${y + 42} Z`}
                fill="#7c2d12"
            />
            <path
                d={`M${x},${y + 42} Q${x - 25},${y + 70} ${x - 45},${y + 55} M${x},${y + 42} Q${x + 25},${y + 70} ${x + 45},${y + 55}`}
                stroke="#7c2d12"
                strokeWidth={6}
                fill="none"
            />
        </g>
    );
}

function Brikke({
    tekst,
    x,
    y,
    farge = '#ffffff',
    tekstfarge = BLEKK,
    storrelse = 40,
    synlig = true,
    dempet = false,
}: {
    tekst: string;
    x: number;
    y: number;
    farge?: string;
    tekstfarge?: string;
    storrelse?: number;
    synlig?: boolean;
    dempet?: boolean;
}) {
    const b = tekst.length * storrelse * 0.55 + 60;
    return (
        <motion.g
            initial={{ opacity: 0, x }}
            animate={{ opacity: synlig ? (dempet ? 0.25 : 1) : 0, x }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
            <rect
                x={-b / 2}
                y={y - storrelse * 0.95}
                width={b}
                height={storrelse * 1.6}
                rx={storrelse * 0.8}
                fill={farge}
                stroke={GULL}
                strokeWidth={3}
            />
            <text
                x={0}
                y={y + storrelse * 0.12}
                textAnchor="middle"
                fontSize={storrelse}
                fontWeight={800}
                fill={tekstfarge}
                style={FONT}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Metafor({ beat }: { beat: number }) {
    const gass = beat === 1;
    const egenskaperX = beat >= 3 ? 640 : 960;
    return (
        <g>
            <Setning
                deler={[{ t: 'Du ' }, { t: 'er', uthevet: true }, { t: ' en stjerne.' }]}
                x={800}
                y={130}
            />
            <Person x={330} y={520} gloder={beat >= 3} />
            <Stjerne x={1270} y={480} gass={gass} />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat <= 1 ? 1 : 0, fill: gass ? '#dc2626' : BLEKK }}
                transition={{ duration: 0.6 }}
            >
                <text
                    x={800}
                    y={505}
                    textAnchor="middle"
                    fontSize={130}
                    fontWeight={900}
                    style={FONT}
                >
                    {gass ? '≠' : '='}
                </text>
            </motion.g>
            <AnimatePresence>
                {gass && (
                    <motion.g
                        key="gass"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <text
                            x={1270}
                            y={725}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={700}
                            fill="#9a3412"
                            style={FONT}
                        >
                            en kule av brennende gass?
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {['lyser', 'varm', 'alle ser på den'].map((e, i) => (
                <Brikke
                    key={e}
                    tekst={e}
                    x={egenskaperX}
                    y={360 + i * 135}
                    synlig={beat >= 2}
                    farge="#fef3c7"
                />
            ))}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                <text
                    x={800}
                    y={830}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={800}
                    fill={GULL}
                    style={FONT}
                >
                    En løgn som forteller en sannhet. Uten «som».
                </text>
            </motion.g>
        </g>
    );
}

function Som({ beat }: { beat: number }) {
    const love = beat >= 2;
    const setning: Del[] = love
        ? beat >= 4
            ? [{ t: 'Han var ' }, { t: 'modig', uthevet: true }, { t: ' som en løve.' }]
            : [{ t: 'Han var ' }, { t: 'som', uthevet: true }, { t: ' en løve.' }]
        : [{ t: 'Du skinner ' }, { t: 'som', uthevet: true }, { t: ' en stjerne.' }];
    return (
        <g>
            <Setning deler={setning} x={800} y={130} />
            <Person x={330} y={520} gloder={false} />
            <AnimatePresence mode="wait">
                {love ? (
                    <motion.g
                        key="love"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Love x={1270} y={470} />
                    </motion.g>
                ) : (
                    <motion.g
                        key="stjerne"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Stjerne x={1270} y={480} gass={false} />
                    </motion.g>
                )}
            </AnimatePresence>
            {/* Broen: ordet som binder personen og bildet sammen */}
            <motion.path
                d="M470,560 Q800,300 1110,560"
                fill="none"
                stroke={GULL}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, opacity: beat >= 2 ? 0.25 : 1 }}
                transition={{ duration: 1.2 }}
            />
            {!love && (
                <>
                    <Brikke
                        tekst="som"
                        x={beat >= 1 ? 700 : 800}
                        y={420}
                        farge={GULL}
                        tekstfarge="#ffffff"
                        storrelse={48}
                    />
                    <Brikke
                        tekst="lik"
                        x={900}
                        y={420}
                        farge={GULL}
                        tekstfarge="#ffffff"
                        storrelse={48}
                        synlig={beat >= 1}
                    />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 1 ? 1 : 0 }}>
                        <text
                            x={800}
                            y={720}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={800}
                            fill={BLEKK}
                            style={FONT}
                        >
                            Du ligner. Du er ikke.
                        </text>
                    </motion.g>
                </>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <text
                        x={800}
                        y={520}
                        textAnchor="middle"
                        fontSize={200}
                        fontWeight={900}
                        fill={GULL}
                        style={FONT}
                    >
                        ?
                    </text>
                </motion.g>
            )}
            {['modig?', 'farlig?', 'stort hår?'].map((e, i) => (
                <Brikke
                    key={e}
                    tekst={beat >= 4 && i === 0 ? 'modig' : e}
                    x={800}
                    y={340 + i * 150}
                    synlig={beat >= 3}
                    dempet={beat >= 4 && i > 0}
                    farge={beat >= 4 && i === 0 ? '#bbf7d0' : '#ffffff'}
                    storrelse={46}
                />
            ))}
        </g>
    );
}

const PAR: [Del[], Del[]][] = [
    [
        [{ t: 'Du ' }, { t: 'er', uthevet: true }, { t: ' en rose.' }],
        [{ t: 'Du er ' }, { t: 'som', uthevet: true }, { t: ' en rose.' }],
    ],
    [
        [{ t: 'Livet ' }, { t: 'er', uthevet: true }, { t: ' en reise.' }],
        [{ t: 'Livet ' }, { t: 'ligner på', uthevet: true }, { t: ' en reise.' }],
    ],
    [
        [{ t: 'Han har et hjerte av stein.' }],
        [{ t: 'Hjertet hans er hardt ' }, { t: 'som', uthevet: true }, { t: ' stein.' }],
    ],
];

function Par({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={60} y={60} width={700} height={130} rx={30} fill="#1e293b" />
            <text
                x={410}
                y={145}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill="#ffffff"
                style={FONT}
            >
                Metafor
            </text>
            <rect x={840} y={60} width={700} height={130} rx={30} fill={GULL} />
            <text
                x={1190}
                y={145}
                textAnchor="middle"
                fontSize={56}
                fontWeight={900}
                fill="#ffffff"
                style={FONT}
            >
                Sammenligning
            </text>
            <line
                x1={800}
                y1={230}
                x2={800}
                y2={700}
                stroke="#cbd5e1"
                strokeWidth={4}
                strokeDasharray="12 12"
            />
            {PAR.map(([v, h], i) => (
                <motion.g
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: beat >= i + 1 ? (beat === i + 1 || beat >= 4 ? 1 : 0.55) : 0,
                    }}
                    transition={{ duration: 0.6 }}
                >
                    <Setning deler={v} x={410} y={310 + i * 150} storrelse={42} />
                    <Setning deler={h} x={1190} y={310 + i * 150} storrelse={42} />
                </motion.g>
            ))}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                <text
                    x={410}
                    y={800}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill={BLEKK}
                    style={FONT}
                >
                    Direkte. Sterkere.
                </text>
                <text
                    x={1190}
                    y={800}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={900}
                    fill={GULL}
                    style={FONT}
                >
                    Forklarer steg for steg.
                </text>
            </motion.g>
        </g>
    );
}

export function BildesprakStjerne({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'metafor';
    return (
        <div className="absolute inset-0" style={{ background: '#f5f1e8' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'metafor' && <Metafor beat={beat} />}
                {modus === 'som' && <Som beat={beat} />}
                {modus === 'par' && <Par beat={beat} />}
            </svg>
        </div>
    );
}
