import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Tegninger i snitt og skisse, i fire modus:
 * - jord: tre graver i snitt. Jødedom (enkel trekiste), kristendom (av jord er du kommet,
 *   oppstandelsen) og islam (kroppen settes sammen igjen, skal ikke brennes).
 * - vitner: de nyere bevegelsene. Små mot de store, hvor de kom fra, og Jehovas vitner.
 * - bahai: mormonene (bundet sammen for alltid) og bahá'í (strenge regler for begravelsen).
 * - regnskap: linja og ringen side om side. Hvem dømmer, grense eller dør, jord eller ild.
 */

type Modus = 'jord' | 'vitner' | 'bahai' | 'regnskap';

const B = 1600;
const H = 900;

const OVERSKRIFT: Record<Modus, string[]> = {
    jord: [
        'Ved graven',
        'Jødedom',
        'Jødedom: ingen fast lære om slutten',
        'Kristendom',
        'Kristendom: oppstandelsen',
        'Islam',
    ],
    vitner: [
        'Tre nyere bevegelser',
        'Hvor de kom fra',
        'Jehovas vitner',
        'Jehovas vitner',
        'Jehovas vitner: håpet',
    ],
    bahai: [
        'De fleste kristne',
        'Mormonene',
        "Bahá'í",
        "Bahá'í: begravelsen",
        "Bahá'í: ring på fingeren",
    ],
    regnskap: ['Hvem fører regnskapet?', 'Linja', 'Ringen', 'Grense eller dør', 'Jord eller ild'],
};

const SKRIFT = { fontFamily: 'Inter, system-ui, sans-serif' };

/** Tekst med hvit kant, så den leses over alt. */
function T({
    x,
    y,
    children,
    size = 38,
    farge = '#0f172a',
    vekt = 800,
    anker = 'middle',
    kant = '#ffffff',
}: {
    x: number;
    y: number;
    children: ReactNode;
    size?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    kant?: string;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={size}
            fontWeight={vekt}
            fill={farge}
            stroke={kant}
            strokeWidth={size / 5}
            paintOrder="stroke"
        >
            {children}
        </text>
    );
}

function Inn({ children, forsinkelse = 0.2 }: { children: ReactNode; forsinkelse?: number }) {
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

function Kryss({ x, y, r = 26 }: { x: number; y: number; r?: number }) {
    return (
        <g>
            <circle cx={x} cy={y} r={r + 8} fill="#fff" stroke="#dc2626" strokeWidth={5} />
            <line
                x1={x - r * 0.6}
                y1={y - r * 0.6}
                x2={x + r * 0.6}
                y2={y + r * 0.6}
                stroke="#dc2626"
                strokeWidth={8}
                strokeLinecap="round"
            />
            <line
                x1={x + r * 0.6}
                y1={y - r * 0.6}
                x2={x - r * 0.6}
                y2={y + r * 0.6}
                stroke="#dc2626"
                strokeWidth={8}
                strokeLinecap="round"
            />
        </g>
    );
}

function Flamme({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path
                d="M 0 -60 C 30 -25 42 0 30 22 C 22 38 -22 38 -30 22 C -42 0 -18 -18 0 -60 Z"
                fill="#f97316"
                stroke="#fff"
                strokeWidth={4}
            />
            <path
                d="M 0 -20 C 14 0 16 12 8 24 C 2 30 -8 30 -12 22 C -18 10 -8 0 0 -20 Z"
                fill="#fde047"
            />
        </g>
    );
}

function Person({
    x,
    y,
    farge = '#334155',
    stiplet,
}: {
    x: number;
    y: number;
    farge?: string;
    stiplet?: boolean;
}) {
    return (
        <g opacity={stiplet ? 0.55 : 1}>
            <circle
                cx={x}
                cy={y - 62}
                r={24}
                fill={stiplet ? 'none' : farge}
                stroke={farge}
                strokeWidth={5}
                strokeDasharray={stiplet ? '8 6' : undefined}
            />
            <path
                d={`M ${x - 36} ${y + 30} Q ${x - 34} ${y - 30} ${x} ${y - 32} Q ${x + 34} ${y - 30} ${x + 36} ${y + 30} Z`}
                fill={stiplet ? 'none' : farge}
                stroke={farge}
                strokeWidth={5}
                strokeDasharray={stiplet ? '8 6' : undefined}
            />
        </g>
    );
}

function Gravstein({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <path
                d={`M ${x - 40} ${y} L ${x - 40} ${y - 80} Q ${x} ${y - 125} ${x + 40} ${y - 80} L ${x + 40} ${y} Z`}
                fill="#a8a29e"
                stroke="#57534e"
                strokeWidth={4}
            />
            <rect x={x - 70} y={y} width={140} height={14} rx={6} fill="#57534e" />
        </g>
    );
}

/* ---------------- jord ---------------- */

const KOL = [300, 800, 1300];
const BAKKE = 470;

function Grop({ x, aktiv }: { x: number; aktiv: boolean }) {
    return (
        <g opacity={aktiv ? 1 : 0.55}>
            <rect x={x - 130} y={560} width={260} height={150} rx={10} fill="#2a1a10" />
            <path
                d={`M ${x + 140} ${BAKKE} Q ${x + 190} ${BAKKE - 60} ${x + 240} ${BAKKE}`}
                fill="#7c4a26"
            />
        </g>
    );
}

function Jord({ beat }: { beat: number }) {
    return (
        <g>
            <defs>
                <linearGradient id="doden-himmel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#334155" />
                    <stop offset="1" stopColor="#94a3b8" />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={B} height={BAKKE} fill="url(#doden-himmel)" />
            <rect x={0} y={BAKKE} width={B} height={H - BAKKE} fill="#6b4226" />
            <rect x={0} y={BAKKE} width={B} height={22} fill="#3f6212" />
            {KOL.map((x, i) => (
                <Grop
                    key={x}
                    x={x}
                    aktiv={
                        (i === 0 && beat >= 1 && beat <= 2) ||
                        (i === 1 && (beat === 3 || beat === 4)) ||
                        (i === 2 && beat === 5) ||
                        beat === 0
                    }
                />
            ))}
            {beat === 0 && (
                <Inn>
                    <T x={800} y={330} size={44} farge="#f8fafc" kant="#1e293b">
                        Hva folk gjør ved graven, sier mye om hva de tror
                    </T>
                </Inn>
            )}

            {/* Jødedom */}
            {beat >= 1 && (
                <g opacity={beat <= 2 ? 1 : 0.5}>
                    <motion.g
                        initial={{ y: -120, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1.2 }}
                    >
                        <rect
                            x={KOL[0] - 110}
                            y={600}
                            width={220}
                            height={70}
                            rx={6}
                            fill="#a16207"
                            stroke="#713f12"
                            strokeWidth={5}
                        />
                        <line
                            x1={KOL[0] - 100}
                            y1={618}
                            x2={KOL[0] + 100}
                            y2={618}
                            stroke="#713f12"
                            strokeWidth={4}
                        />
                    </motion.g>
                    <T x={KOL[0]} y={300} size={46} farge="#1e3a8a">
                        Jødedom
                    </T>
                    <T x={KOL[0]} y={350} size={34}>
                        enkel trekiste
                    </T>
                    <T x={KOL[0]} y={395} size={34}>
                        helst innen ett døgn
                    </T>
                    <T x={KOL[0]} y={440} size={30} farge="#fef3c7" kant="#1e293b">
                        døden: en overgang
                    </T>
                </g>
            )}
            {beat === 1 && (
                <Inn forsinkelse={1.2}>
                    <rect
                        x={KOL[0] + 215}
                        y={170}
                        width={14}
                        height={300}
                        fill="#fde68a"
                        opacity={0.7}
                        rx={7}
                    />
                    <T
                        x={KOL[0] + 245}
                        y={215}
                        size={32}
                        anker="start"
                        farge="#fef3c7"
                        kant="#1e293b"
                    >
                        sjelen lever videre
                    </T>
                </Inn>
            )}
            {beat === 2 && (
                <Inn forsinkelse={0.4}>
                    {[0, 1, 2].map((i) => (
                        <g key={i}>
                            <ellipse
                                cx={KOL[0] - 120 + i * 120}
                                cy={200}
                                rx={50}
                                ry={36}
                                fill="#fff"
                                stroke="#1e3a8a"
                                strokeWidth={4}
                            />
                            <T x={KOL[0] - 120 + i * 120} y={214} size={40} farge="#1e3a8a">
                                ?
                            </T>
                        </g>
                    ))}
                    <T
                        x={KOL[0] + 200}
                        y={214}
                        size={34}
                        anker="start"
                        farge="#f8fafc"
                        kant="#1e293b"
                    >
                        flere syn side om side
                    </T>
                </Inn>
            )}

            {/* Kristendom */}
            {beat >= 3 && (
                <g opacity={beat <= 4 ? 1 : 0.5}>
                    <T x={KOL[1]} y={300} size={46} farge="#3730a3">
                        Kristendom
                    </T>
                    <rect
                        x={KOL[1] - 12}
                        y={560 - 110}
                        width={24}
                        height={100}
                        fill="#e7e5e4"
                        stroke="#57534e"
                        strokeWidth={3}
                    />
                    <rect
                        x={KOL[1] - 42}
                        y={560 - 88}
                        width={84}
                        height={22}
                        fill="#e7e5e4"
                        stroke="#57534e"
                        strokeWidth={3}
                    />
                </g>
            )}
            {beat === 3 && (
                <>
                    <Inn forsinkelse={0.3}>
                        <rect
                            x={450}
                            y={740}
                            width={700}
                            height={100}
                            rx={18}
                            fill="#fff"
                            opacity={0.95}
                        />
                        <text
                            x={800}
                            y={780}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#1e1b4b"
                        >
                            Av jord er du kommet, til jord skal du bli,
                        </text>
                        <text
                            x={800}
                            y={820}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#1e1b4b"
                        >
                            av jord skal du igjen oppstå.
                        </text>
                    </Inn>
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            cx={KOL[1] - 40 + i * 40}
                            cy={0}
                            r={14}
                            fill="#7c4a26"
                            initial={{ y: 470, opacity: 0 }}
                            animate={{ y: 640, opacity: 1 }}
                            transition={{ duration: 0.9, delay: 1.5 + i * 0.9 }}
                        />
                    ))}
                </>
            )}
            {beat === 4 && (
                <Inn forsinkelse={0.3}>
                    <motion.path
                        d={`M ${KOL[1]} 650 L ${KOL[1]} 440`}
                        stroke="#facc15"
                        strokeWidth={22}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6, delay: 0.4 }}
                    />
                    <path
                        d={`M ${KOL[1] - 46} 440 L ${KOL[1]} 380 L ${KOL[1] + 46} 440 Z`}
                        fill="#facc15"
                    />
                    <T
                        x={KOL[1] + 70}
                        y={360}
                        size={34}
                        anker="start"
                        farge="#f8fafc"
                        kant="#1e293b"
                    >
                        de døde skal stå opp igjen
                    </T>
                    <T
                        x={KOL[1] + 70}
                        y={410}
                        size={30}
                        anker="start"
                        farge="#fde68a"
                        kant="#1e293b"
                    >
                        Jesus stod selv opp
                    </T>
                </Inn>
            )}

            {/* Islam */}
            {beat === 5 && (
                <Inn forsinkelse={0.2}>
                    <rect
                        x={KOL[2] - 100}
                        y={600}
                        width={200}
                        height={50}
                        rx={25}
                        fill="#f8fafc"
                        stroke="#cbd5e1"
                        strokeWidth={3}
                    />
                    <T x={KOL[2]} y={300} size={46} farge="#047857">
                        Islam
                    </T>
                    <T x={KOL[2]} y={350} size={32}>
                        Gud setter kroppene
                    </T>
                    <T x={KOL[2]} y={392} size={32}>
                        sammen igjen
                    </T>
                    <Flamme x={1180} y={800} s={0.75} />
                    <Kryss x={1250} y={790} r={22} />
                    <T x={1290} y={805} size={34} anker="start" farge="#fef3c7" kant="#3b2412">
                        ikke brenne
                    </T>
                </Inn>
            )}
        </g>
    );
}

/* ---------------- vitner ---------------- */

const STORE = [
    { navn: 'Kristendom', x: 380, y: 300 },
    { navn: 'Islam', x: 380, y: 660 },
];
const SMA = [
    { navn: 'Mormonisme', x: 1180, y: 230, fra: 0 },
    { navn: 'Jehovas vitner', x: 1180, y: 420, fra: 0 },
    { navn: "Bahá'í", x: 1180, y: 680, fra: 1 },
];

function Vitner({ beat }: { beat: number }) {
    if (beat <= 1)
        return (
            <g>
                <rect x={0} y={0} width={B} height={H} fill="#f1f5f9" />
                {beat === 1 &&
                    SMA.map((s) => {
                        const f = STORE[s.fra];
                        return (
                            <motion.path
                                key={s.navn}
                                d={`M ${f.x + 160} ${f.y} C ${f.x + 420} ${f.y}, ${s.x - 320} ${s.y}, ${s.x - 50} ${s.y}`}
                                fill="none"
                                stroke={s.fra === 0 ? '#6366f1' : '#10b981'}
                                strokeWidth={8}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1.4, delay: 0.4 }}
                            />
                        );
                    })}
                {STORE.map((s, i) => (
                    <g key={s.navn}>
                        <circle
                            cx={s.x}
                            cy={s.y}
                            r={150}
                            fill={i === 0 ? '#c7d2fe' : '#a7f3d0'}
                            stroke={i === 0 ? '#4338ca' : '#047857'}
                            strokeWidth={5}
                        />
                        <T x={s.x} y={s.y + 4} size={44} farge={i === 0 ? '#312e81' : '#064e3b'}>
                            {s.navn}
                        </T>
                        {beat === 0 && (
                            <T x={s.x} y={s.y + 54} size={32} farge="#334155">
                                milliarder
                            </T>
                        )}
                    </g>
                ))}
                {SMA.map((s) => (
                    <g key={s.navn}>
                        <circle
                            cx={s.x}
                            cy={s.y}
                            r={40}
                            fill={s.fra === 0 ? '#c7d2fe' : '#a7f3d0'}
                            stroke={s.fra === 0 ? '#4338ca' : '#047857'}
                            strokeWidth={5}
                        />
                        <T x={s.x + 60} y={s.y + 13} size={38} anker="start">
                            {s.navn}
                        </T>
                        {beat === 1 && (
                            <Inn forsinkelse={1.2}>
                                <T
                                    x={s.x + 60}
                                    y={s.y + 58}
                                    size={30}
                                    anker="start"
                                    farge={s.fra === 0 ? '#4338ca' : '#047857'}
                                >
                                    {s.fra === 0 ? 'fra kristendommen' : 'fra sjia-islam'}
                                </T>
                            </Inn>
                        )}
                    </g>
                ))}
                {beat === 0 && (
                    <Inn forsinkelse={0.8}>
                        <T x={1180} y={830} size={34} farge="#334155">
                            noen millioner
                        </T>
                        <T x={800} y={870} size={24} vekt={600} farge="#64748b">
                            Sirklene er ikke i målestokk
                        </T>
                    </Inn>
                )}
            </g>
        );
    if (beat === 2)
        return (
            <g>
                <rect x={0} y={0} width={B} height={H} fill="#1e293b" />
                <path
                    d="M 1290 170 A 80 80 0 1 0 1370 290 A 64 64 0 1 1 1290 170 Z"
                    fill="#fde68a"
                />
                <rect x={0} y={640} width={B} height={260} fill="#334155" />
                <Gravstein x={800} y={640} />
                {['z', 'z', 'Z'].map((z, i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.6 }}
                    >
                        <T
                            x={880 + i * 50}
                            y={500 - i * 60}
                            size={44 + i * 14}
                            farge="#e2e8f0"
                            kant="#1e293b"
                        >
                            {z}
                        </T>
                    </motion.g>
                ))}
                <Inn forsinkelse={1.6}>
                    <T x={800} y={760} size={40} farge="#f8fafc" kant="#1e293b">
                        De døde sover
                    </T>
                    <T x={800} y={815} size={34} farge="#cbd5e1" kant="#1e293b">
                        og merker ingenting
                    </T>
                </Inn>
            </g>
        );
    if (beat === 3)
        return (
            <g>
                <rect x={0} y={0} width={B} height={H} fill="#f1f5f9" />
                {/* Tom stol */}
                <g>
                    <rect x={380} y={360} width={30} height={260} fill="#78350f" />
                    <rect x={380} y={500} width={200} height={28} fill="#92400e" />
                    <rect x={550} y={528} width={24} height={110} fill="#78350f" />
                    <rect x={386} y={528} width={24} height={110} fill="#78350f" />
                    <Kryss x={660} y={420} />
                    <T x={480} y={720} size={36}>
                        ingen våker ved den døde
                    </T>
                </g>
                {/* Kalender */}
                <Inn forsinkelse={0.8}>
                    <rect
                        x={1000}
                        y={330}
                        width={240}
                        height={280}
                        rx={16}
                        fill="#fff"
                        stroke="#334155"
                        strokeWidth={5}
                    />
                    <rect x={1000} y={330} width={240} height={70} rx={16} fill="#dc2626" />
                    {Array.from({ length: 12 }, (_, i) => (
                        <rect
                            key={i}
                            x={1025 + (i % 4) * 52}
                            y={420 + Math.floor(i / 4) * 60}
                            width={36}
                            height={36}
                            rx={6}
                            fill="#e2e8f0"
                        />
                    ))}
                    <Kryss x={1320} y={420} />
                    <T x={1120} y={720} size={36}>
                        dødsdagen markeres ikke
                    </T>
                </Inn>
            </g>
        );
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill="#dbeafe" />
            <Inn forsinkelse={0.2}>
                <rect
                    x={300}
                    y={170}
                    width={1000}
                    height={110}
                    rx={55}
                    fill="#fef9c3"
                    stroke="#facc15"
                    strokeWidth={5}
                />
                <T x={800} y={222} size={36} farge="#713f12" kant="#fef9c3">
                    i himmelen: 144 000
                </T>
                <T x={800} y={264} size={28} vekt={700} farge="#713f12" kant="#fef9c3">
                    de 144 000 skal styre med Jesus
                </T>
            </Inn>
            <path d={`M 0 900 L 0 640 Q 800 470 1600 640 L 1600 900 Z`} fill="#4ade80" />
            {Array.from({ length: 140 }, (_, i) => {
                const x = 40 + ((i * 97) % 1520);
                const y = 640 + ((i * 53) % 220) - Math.max(0, 140 - Math.abs(x - 800) / 6);
                return <circle key={i} cx={x} cy={Math.max(600, y)} r={7} fill="#166534" />;
            })}
            <Inn forsinkelse={0.9}>
                <rect x={420} y={390} width={760} height={110} rx={20} fill="#fff" opacity={0.95} />
                <T x={800} y={438} size={34} kant="#fff">
                    livet tilbake for de døde
                </T>
                <T x={800} y={482} size={30} vekt={700} farge="#166534" kant="#fff">
                    nesten alle: på en jord gjort om til et paradis
                </T>
            </Inn>
        </g>
    );
}

/* ---------------- bahai ---------------- */

function Bahai({ beat }: { beat: number }) {
    if (beat <= 1)
        return (
            <g>
                <rect x={0} y={0} width={B} height={H} fill="#f8fafc" />
                {beat === 1 && (
                    <Inn forsinkelse={0.2}>
                        <path
                            d="M 170 640 L 170 380 L 330 260 L 490 380 L 490 640 Z"
                            fill="#e0e7ff"
                            stroke="#4338ca"
                            strokeWidth={5}
                        />
                        <rect x={318} y={160} width={24} height={110} fill="#4338ca" />
                        <T x={330} y={700} size={32} farge="#4338ca">
                            seremoni i et tempel
                        </T>
                    </Inn>
                )}
                <Person x={560} y={620} farge="#334155" />
                <Person x={660} y={620} farge="#475569" />
                <motion.line
                    x1={720}
                    y1={600}
                    x2={beat === 1 ? 1540 : 1080}
                    y2={600}
                    stroke={beat === 1 ? '#4338ca' : '#64748b'}
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.4, delay: 0.3 }}
                />
                <Gravstein x={1150} y={640} />
                {beat === 0 && (
                    <Inn forsinkelse={1.4}>
                        <T x={900} y={540} size={34} farge="#334155">
                            gift
                        </T>
                        <T x={1150} y={720} size={34} farge="#334155">
                            til døden skiller dem
                        </T>
                    </Inn>
                )}
                {beat === 1 && (
                    <Inn forsinkelse={1.6}>
                        <T x={1380} y={560} size={60} farge="#4338ca">
                            ∞
                        </T>
                        <T x={1150} y={760} size={36} farge="#312e81">
                            bundet sammen for alltid
                        </T>
                    </Inn>
                )}
            </g>
        );
    if (beat === 2)
        return (
            <g>
                <rect x={0} y={0} width={B} height={H} fill="#f0fdfa" />
                {[
                    { x: 520, navn: 'paradis', farge: '#0d9488' },
                    { x: 1080, navn: 'helvete', farge: '#b91c1c' },
                ].map((s, i) => (
                    <motion.g
                        key={s.navn}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.5 }}
                    >
                        <path
                            d={`M ${s.x - 160} 300 L ${s.x + 130} 300 L ${s.x + 170} 350 L ${s.x + 130} 400 L ${s.x - 160} 400 Z`}
                            fill="#fff"
                            stroke={s.farge}
                            strokeWidth={6}
                        />
                        <T x={s.x - 10} y={365} size={44} farge={s.farge}>
                            {s.navn}
                        </T>
                        <Kryss x={s.x + 230} y={350} />
                        <rect x={s.x - 10} y={400} width={20} height={300} fill="#78350f" />
                    </motion.g>
                ))}
                <Inn forsinkelse={1.4}>
                    <T x={800} y={790} size={38} farge="#134e4a">
                        Ikke steder du kan reise til
                    </T>
                </Inn>
            </g>
        );
    if (beat === 3)
        return (
            <g>
                <rect x={0} y={0} width={B} height={H} fill="#ecfdf5" />
                <motion.circle
                    cx={700}
                    cy={530}
                    r={260}
                    fill="#99f6e4"
                    fillOpacity={0.4}
                    stroke="#0f766e"
                    strokeWidth={6}
                    strokeDasharray="18 12"
                    initial={{ scale: 0.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.4 }}
                    style={{ transformOrigin: '700px 530px' }}
                />
                <rect x={670} y={490} width={60} height={60} fill="#334155" />
                <path d="M 660 490 L 700 450 L 740 490 Z" fill="#334155" />
                <T x={700} y={610} size={34}>
                    byen
                </T>
                <T x={700} y={250} size={36} farge="#0f766e">
                    én times reise
                </T>
                <Inn forsinkelse={1.4}>
                    <Flamme x={1180} y={540} s={1.1} />
                    <Kryss x={1290} y={520} />
                    <T x={1230} y={660} size={36}>
                        ikke brennes
                    </T>
                </Inn>
            </g>
        );
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill="#fffbeb" />
            <motion.circle
                cx={800}
                cy={530}
                r={240}
                fill="none"
                stroke="#d97706"
                strokeWidth={60}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
            />
            <circle cx={800} cy={530} r={240} fill="none" stroke="#fde68a" strokeWidth={8} />
            <Inn forsinkelse={1}>
                <T x={800} y={505} size={28} farge="#78350f">
                    Innskriften begynner:
                </T>
                <T x={800} y={550} size={26} farge="#78350f">
                    Jeg kom fra Gud og vender
                </T>
                <T x={800} y={590} size={26} farge="#78350f">
                    tilbake til ham ...
                </T>
            </Inn>
            <T x={800} y={860} size={34} farge="#92400e">
                for dem som var 15 år eller eldre
            </T>
        </g>
    );
}

/* ---------------- regnskap ---------------- */

function Regnskap({ beat }: { beat: number }) {
    const ly = 560;
    const rx = 1200;
    const ry = 560;
    const rr = 190;
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill="#f8fafc" />
            <rect x={800} y={0} width={800} height={H} fill="#fff7ed" />
            <line x1={800} y1={150} x2={800} y2={880} stroke="#cbd5e1" strokeWidth={4} />
            <T x={400} y={220} size={46} farge="#92400e">
                Linja
            </T>
            <T x={rx} y={220} size={46} farge="#9a3412">
                Ringen
            </T>
            {/* Linja */}
            <line
                x1={90}
                y1={ly}
                x2={beat === 3 ? 600 : 640}
                y2={ly}
                stroke="#a16207"
                strokeWidth={12}
                strokeLinecap="round"
            />
            {[140, 260, 380, 500].map((x) => (
                <circle
                    key={x}
                    cx={x}
                    cy={ly}
                    r={14}
                    fill="#fef3c7"
                    stroke="#a16207"
                    strokeWidth={5}
                />
            ))}
            {/* Ringen */}
            <circle
                cx={rx}
                cy={ry}
                r={rr}
                fill="none"
                stroke="#ea580c"
                strokeWidth={12}
                strokeDasharray={beat === 3 ? '1020 174' : undefined}
            />

            {beat === 0 && (
                <Inn forsinkelse={0.6}>
                    <T x={400} y={430} size={80} farge="#92400e">
                        ?
                    </T>
                    <T x={rx} y={ry + 28} size={80} farge="#9a3412">
                        ?
                    </T>
                </Inn>
            )}
            {(beat === 1 || beat === 2) && (
                <g opacity={beat === 1 ? 1 : 0.35}>
                    <g transform={`translate(700 ${ly - 40})`}>
                        <rect x={-6} y={-120} width={12} height={150} fill="#a16207" />
                        <rect x={-80} y={-124} width={160} height={10} fill="#a16207" />
                        <path d="M -110 -60 Q -80 -30 -50 -60 Z" fill="#ca8a04" />
                        <path d="M 50 -60 Q 80 -30 110 -60 Z" fill="#ca8a04" />
                        <line
                            x1={-80}
                            y1={-114}
                            x2={-80}
                            y2={-60}
                            stroke="#a16207"
                            strokeWidth={3}
                        />
                        <line x1={80} y1={-114} x2={80} y2={-60} stroke="#a16207" strokeWidth={3} />
                    </g>
                    <T x={400} y={700} size={36}>
                        noen utenfor deg dømmer
                    </T>
                </g>
            )}
            {beat === 2 && (
                <Inn forsinkelse={0.3}>
                    {Array.from({ length: 8 }, (_, i) => {
                        const a = (i / 8) * Math.PI * 2;
                        const god = i % 3 !== 2;
                        return (
                            <motion.g
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.2 }}
                            >
                                <circle
                                    cx={rx + Math.cos(a) * rr}
                                    cy={ry + Math.sin(a) * rr}
                                    r={24}
                                    fill={god ? '#0d9488' : '#dc2626'}
                                    stroke="#fff"
                                    strokeWidth={4}
                                />
                                <T
                                    x={rx + Math.cos(a) * rr}
                                    y={ry + Math.sin(a) * rr + 11}
                                    size={30}
                                    farge="#fff"
                                    kant={god ? '#0d9488' : '#dc2626'}
                                >
                                    {god ? '+' : '−'}
                                </T>
                            </motion.g>
                        );
                    })}
                    <T x={rx} y={ry + 12} size={34} farge="#9a3412">
                        handlingene dine
                    </T>
                    <T x={rx} y={830} size={36}>
                        handlingene fører regnskapet
                    </T>
                </Inn>
            )}
            {beat === 3 && (
                <Inn forsinkelse={0.3}>
                    <rect x={620} y={ly - 130} width={34} height={260} fill="#57534e" />
                    <T x={400} y={720} size={38}>
                        døden: en grense
                    </T>
                    <rect
                        x={rx + rr - 60}
                        y={ry - 70}
                        width={70}
                        height={140}
                        rx={8}
                        fill="#fde68a"
                        stroke="#9a3412"
                        strokeWidth={5}
                        transform={`rotate(-30 ${rx + rr - 25} ${ry})`}
                    />
                    <T x={rx} y={830} size={38}>
                        døden: en dør
                    </T>
                </Inn>
            )}
            {beat === 4 && (
                <Inn forsinkelse={0.3}>
                    <rect x={330} y={640} width={140} height={60} rx={8} fill="#2a1a10" />
                    <path d="M 300 640 L 500 640" stroke="#3f6212" strokeWidth={10} />
                    <T x={400} y={760} size={32}>
                        kroppen skal stå opp igjen
                    </T>
                    <T x={400} y={810} size={36} farge="#92400e">
                        jorda
                    </T>
                    <Flamme x={rx} y={ry + 20} s={1.2} />
                    <T x={rx} y={830} size={32}>
                        et helt nytt liv: ild
                    </T>
                </Inn>
            )}
        </g>
    );
}

export function DodenSnitt({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'jord';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
                style={SKRIFT}
            >
                <AnimatePresence mode="wait">
                    <motion.g
                        key={modus === 'jord' ? 'jord' : `${modus}-${beat}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {modus === 'jord' && <Jord beat={beat} />}
                        {modus === 'vitner' && <Vitner beat={beat} />}
                        {modus === 'bahai' && <Bahai beat={beat} />}
                        {modus === 'regnskap' && <Regnskap beat={beat} />}
                    </motion.g>
                </AnimatePresence>
            </svg>
            <div
                className="absolute inset-x-0 flex justify-center pointer-events-none"
                style={{ top: '4%' }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tekst}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap"
                    >
                        {tekst}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
