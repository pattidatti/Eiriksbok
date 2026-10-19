import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Folk som blokker med små mennesker i, flyttet rundt av grenser. Tre modus:
 * «europa»: nordmenn, franskmenn og grekere skyves inn i én ramme og kalles ett land.
 * «kurdere»: ett folk deles i fire biter, én i hvert land.
 * «arv»: fire kort, ett per land, med det grensene førte til.
 */

type Modus = 'europa' | 'kurdere' | 'arv';

const B = 1600;
const H = 900;

const OVERSKRIFTER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    europa: [
        { tekst: 'Tenk deg det samme i Europa' },
        { tekst: 'Tre folk i én stat', rod: true },
        { tekst: 'Kall det hva dere vil', rod: true },
    ],
    kurdere: [
        { tekst: 'Kurderne' },
        { tekst: 'Et stort folk uten eget land' },
        { tekst: 'Delt mellom fire land', rod: true },
        { tekst: 'Kampen fortsetter i dag' },
    ],
    arv: [
        { tekst: 'Røtter i 1916 til 1923' },
        { tekst: 'Irak' },
        { tekst: 'Syria' },
        { tekst: 'Libanon' },
        { tekst: 'Palestina', rod: true },
    ],
};

/** En rad små mennesker: hode og kropp. */
function Folk({
    x,
    y,
    antall,
    farge,
    avstand = 46,
}: {
    x: number;
    y: number;
    antall: number;
    farge: string;
    avstand?: number;
}) {
    const start = x - ((antall - 1) * avstand) / 2;
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => (
                <g key={i} transform={`translate(${start + i * avstand} ${y})`}>
                    <circle cx={0} cy={-34} r={13} fill={farge} />
                    <path d="M -17 12 Q -17 -16 0 -16 Q 17 -16 17 12 Z" fill={farge} />
                </g>
            ))}
        </g>
    );
}

/** En blokk med et folk: farget boks, navn og små mennesker. */
function Blokk({
    x,
    y,
    b,
    h,
    navn,
    farge,
    lys,
    antall = 5,
    navnStr = 44,
}: {
    x: number;
    y: number;
    b: number;
    h: number;
    navn: string;
    farge: string;
    lys: string;
    antall?: number;
    navnStr?: number;
}) {
    return (
        <g>
            <rect x={x - b / 2} y={y - h / 2} width={b} height={h} rx={22} fill={lys} />
            <rect
                x={x - b / 2}
                y={y - h / 2}
                width={b}
                height={h}
                rx={22}
                fill="none"
                stroke={farge}
                strokeWidth={6}
            />
            <text
                x={x}
                y={y - h / 2 + navnStr + 16}
                textAnchor="middle"
                fontSize={navnStr}
                fontWeight={900}
                fill={farge}
            >
                {navn}
            </text>
            <Folk x={x} y={y + h / 2 - 30} antall={antall} farge={farge} />
        </g>
    );
}

const FJAER = { type: 'spring', stiffness: 90, damping: 18 } as const;

function Europa({ beat }: { beat: number }) {
    const samlet = beat >= 1;
    const folk = [
        { navn: 'Nordmenn', farge: '#b91c1c', lys: '#fee2e2', spredt: [300, 330] },
        { navn: 'Franskmenn', farge: '#1d4ed8', lys: '#dbeafe', spredt: [800, 600] },
        { navn: 'Grekere', farge: '#0e7490', lys: '#cffafe', spredt: [1300, 330] },
    ];
    return (
        <>
            {folk.map((f, i) => {
                const mål = samlet ? [380 + i * 420, 500] : f.spredt;
                return (
                    <motion.g
                        key={f.navn}
                        initial={{ x: f.spredt[0], y: f.spredt[1], opacity: 0 }}
                        animate={{ x: mål[0], y: mål[1], opacity: 1 }}
                        transition={{ ...FJAER, delay: samlet ? i * 0.2 : i * 0.3 }}
                    >
                        <Blokk
                            x={0}
                            y={0}
                            b={380}
                            h={250}
                            navn={f.navn}
                            farge={f.farge}
                            lys={f.lys}
                        />
                    </motion.g>
                );
            })}
            {samlet && (
                <motion.rect
                    x={140}
                    y={340}
                    width={1320}
                    height={320}
                    rx={34}
                    fill="none"
                    stroke="#111827"
                    strokeWidth={12}
                    initial={{ opacity: 0, scale: 1.15 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    style={{ transformOrigin: '800px 500px' }}
                />
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, scale: 1.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 220, damping: 14 }}
                    style={{ transformOrigin: '800px 760px' }}
                >
                    <g transform="rotate(-4 800 760)">
                        <rect
                            x={480}
                            y={710}
                            width={640}
                            height={100}
                            rx={10}
                            fill="#ffffffcc"
                            stroke="#b91c1c"
                            strokeWidth={7}
                        />
                        <text
                            x={800}
                            y={778}
                            textAnchor="middle"
                            fontSize={54}
                            fontWeight={900}
                            fill="#b91c1c"
                        >
                            NAVN: ???
                        </text>
                    </g>
                </motion.g>
            )}
        </>
    );
}

function Kurdere({ beat }: { beat: number }) {
    const delt = beat >= 2;
    const land = [
        { navn: 'Tyrkia', x: 420, y: 330 },
        { navn: 'Iran', x: 1180, y: 330 },
        { navn: 'Syria', x: 420, y: 680 },
        { navn: 'Irak', x: 1180, y: 680 },
    ];
    return (
        <>
            {/* Landene rundt bitene */}
            {delt &&
                land.map((l, i) => (
                    <motion.g
                        key={l.navn}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.25 }}
                    >
                        <rect
                            x={l.x - 300}
                            y={l.y - 150}
                            width={600}
                            height={300}
                            rx={18}
                            fill="#e7e5e4"
                            stroke="#78716c"
                            strokeWidth={4}
                        />
                        <text
                            x={l.x + (l.x < 800 ? -280 : 280)}
                            y={l.y - 104}
                            textAnchor={l.x < 800 ? 'start' : 'end'}
                            fontSize={40}
                            fontWeight={900}
                            fill="#44403c"
                        >
                            {l.navn}
                        </text>
                    </motion.g>
                ))}

            {/* Kurderne: én blokk, så fire biter */}
            {land.map((l, i) => {
                const hel = { x: 660 + (i % 2) * 280, y: 430 + Math.floor(i / 2) * 200 };
                const mål = delt ? { x: l.x + (l.x < 800 ? 90 : -90), y: l.y + 30 } : hel;
                return (
                    <motion.g
                        key={l.navn}
                        initial={{ x: hel.x, y: hel.y, opacity: 0 }}
                        animate={{ x: mål.x, y: mål.y, opacity: 1 }}
                        transition={{ ...FJAER, delay: delt ? 0.3 + i * 0.15 : 0 }}
                    >
                        <rect x={-140} y={-100} width={280} height={200} rx={16} fill="#f3e8ff" />
                        <rect
                            x={-140}
                            y={-100}
                            width={280}
                            height={200}
                            rx={16}
                            fill="none"
                            stroke="#9333ea"
                            strokeWidth={5}
                        />
                        <Folk x={0} y={60} antall={4} farge="#9333ea" />
                    </motion.g>
                );
            })}

            {!delt && (
                <motion.text
                    x={800}
                    y={300}
                    textAnchor="middle"
                    fontSize={64}
                    fontWeight={900}
                    fill="#6b21a8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    Kurdere
                </motion.text>
            )}
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <rect x={500} y={800} width={600} height={80} rx={40} fill="#6b21a8" />
                    <text
                        x={800}
                        y={855}
                        textAnchor="middle"
                        fontSize={42}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        Eget land: ingen
                    </text>
                </motion.g>
            )}
            {beat >= 3 && (
                <motion.path
                    d="M 510 360 L 1090 360 L 1090 710 L 510 710 Z"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth={8}
                    strokeDasharray="6 18"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.4, duration: 1.6 }}
                />
            )}
        </>
    );
}

const ARV = [
    {
        land: 'Irak',
        linjer: ['Sjia, sunni og', 'kurdere tvunget', 'sammen'],
        farger: ['#16a34a', '#ca8a04', '#9333ea'],
    },
    {
        land: 'Syria',
        linjer: ['Grenser som', 'passet', 'franskmennene'],
        farger: ['#1d4ed8'],
    },
    {
        land: 'Libanon',
        linjer: ['Delt makt som', 'har ført til', 'borgerkrig'],
        farger: ['#0e7490', '#16a34a', '#ca8a04'],
    },
    {
        land: 'Palestina',
        linjer: ['To løfter om', 'det samme', 'landet'],
        farger: ['#15803d', '#7c3aed'],
    },
];

function Arv({ beat }: { beat: number }) {
    return (
        <>
            {ARV.map((a, i) => {
                const x = 230 + i * 380;
                const vist = beat >= i + 1;
                const aktiv = beat === i + 1;
                return (
                    <g key={a.land}>
                        <rect
                            x={x - 165}
                            y={220}
                            width={330}
                            height={560}
                            rx={24}
                            fill={vist ? '#ffffff' : '#ffffff22'}
                            stroke={aktiv ? '#f59e0b' : vist ? '#a8a29e' : '#ffffff44'}
                            strokeWidth={aktiv ? 10 : 4}
                            style={{ transition: 'fill 0.5s, stroke 0.5s' }}
                        />
                        {vist && (
                            <motion.g
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.6 }}
                            >
                                <text
                                    x={x}
                                    y={300}
                                    textAnchor="middle"
                                    fontSize={50}
                                    fontWeight={900}
                                    fill="#1f2937"
                                >
                                    {a.land}
                                </text>
                                {a.farger.map((f, j) => (
                                    <rect
                                        key={j}
                                        x={x - 120 + (j * 240) / a.farger.length}
                                        y={340}
                                        width={240 / a.farger.length - 6}
                                        height={150}
                                        rx={10}
                                        fill={f}
                                    />
                                ))}
                                {a.linjer.map((l, j) => (
                                    <text
                                        key={j}
                                        x={x}
                                        y={580 + j * 50}
                                        textAnchor="middle"
                                        fontSize={34}
                                        fontWeight={700}
                                        fill="#374151"
                                    >
                                        {l}
                                    </text>
                                ))}
                            </motion.g>
                        )}
                    </g>
                );
            })}
            {beat === 0 && (
                <motion.text
                    x={800}
                    y={540}
                    textAnchor="middle"
                    fontSize={130}
                    fontWeight={900}
                    fill="#fde68a"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    style={{ transformOrigin: '800px 500px' }}
                >
                    1916 til 1923
                </motion.text>
            )}
        </>
    );
}

const BAKGRUNN: Record<Modus, string> = {
    europa: '#e7dcc6',
    kurdere: '#f5f5f4',
    arv: '#292524',
};

export function SykesPicotFolk({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'europa';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: BAKGRUNN[modus] }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'europa' && <Europa beat={beat} />}
                {modus === 'kurdere' && <Kurdere beat={beat} />}
                {modus === 'arv' && <Arv beat={beat} />}
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${beat}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl shadow-xl font-display font-bold text-3xl whitespace-nowrap ${
                        overskrift.rod ? 'bg-red-700 text-white' : 'bg-white/95 text-slate-900'
                    }`}
                >
                    {overskrift.tekst}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
