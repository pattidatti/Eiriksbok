import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * De tre triksene i svindelfilmen, i 2D (SVG 1600x900). To moduser:
 * - tre: hastverk, lokkemat og «gi fra deg noe», ett kort per beat.
 * - jonas: meldingen fra starten av filmen, med triksene merket, og stoppskiltet.
 */

type Modus = 'tre' | 'jonas';

function Vis({ vis, children }: { vis: boolean; children: ReactNode }) {
    return (
        <AnimatePresence>
            {vis && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function T({
    x,
    y,
    children,
    str = 40,
    farge = '#0f172a',
    vekt = 800,
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text x={x} y={y} textAnchor={anker} fontSize={str} fontWeight={vekt} fill={farge}>
            {children}
        </text>
    );
}

/* ---------- symbolene ---------- */

function Klokke() {
    return (
        <g>
            <circle cx={0} cy={0} r={70} fill="#fff" stroke="#0f172a" strokeWidth={10} />
            <line
                x1={0}
                y1={0}
                x2={0}
                y2={-48}
                stroke="#0f172a"
                strokeWidth={9}
                strokeLinecap="round"
            />
            <line
                x1={0}
                y1={0}
                x2={36}
                y2={14}
                stroke="#dc2626"
                strokeWidth={9}
                strokeLinecap="round"
            />
            <rect x={-18} y={-96} width={36} height={18} rx={4} fill="#0f172a" />
        </g>
    );
}
function Agn() {
    return (
        <g>
            <path d="M 0 -95 L 0 -10" stroke="#0f172a" strokeWidth={5} />
            <path
                d="M 0 30 L 0 55 Q 0 85 -25 85 Q -48 85 -48 62 L -36 50"
                fill="none"
                stroke="#334155"
                strokeWidth={9}
                strokeLinecap="round"
            />
            <rect
                x={-55}
                y={-35}
                width={110}
                height={70}
                rx={10}
                fill="#16a34a"
                stroke="#052e16"
                strokeWidth={5}
            />
            <circle cx={0} cy={0} r={18} fill="#bbf7d0" />
        </g>
    );
}
function Hand() {
    return (
        <g>
            <path
                d="M -70 40 Q -70 -10 -40 -10 L 40 -10 Q 70 -10 70 20 L 70 40 Q 40 70 0 70 Q -50 70 -70 40 Z"
                fill="#fcd34d"
                stroke="#0f172a"
                strokeWidth={6}
            />
            <rect
                x={-40}
                y={-80}
                width={80}
                height={56}
                rx={8}
                fill="#2563eb"
                stroke="#0f172a"
                strokeWidth={6}
            />
            <circle cx={0} cy={-52} r={12} fill="#bfdbfe" />
        </g>
    );
}

const KORT = [
    {
        x: 330,
        navn: 'Hastverk',
        farge: '#fecaca',
        symbol: <Klokke />,
        linjer: ['«Innen 24 timer»', '«Bare i dag»', '«Kontoen blir sperret»'],
    },
    {
        x: 800,
        navn: 'Lokkemat',
        farge: '#bbf7d0',
        symbol: <Agn />,
        linjer: ['For godt til å', 'være sant', 'Lettjente penger'],
    },
    {
        x: 1270,
        navn: 'Gi fra deg noe',
        farge: '#bfdbfe',
        symbol: <Hand />,
        linjer: ['Penger', 'Koder', 'Kontoen din'],
    },
];

function Tre({ beat }: { beat: number }) {
    const b = Math.min(beat, 3);
    return (
        <>
            <T x={800} y={110} str={60} vekt={900} farge="#f8fafc">
                Tre triks som går igjen
            </T>
            {KORT.map((k, i) => {
                const vis = b >= i + 1;
                const fokus = b === i + 1;
                return (
                    <g key={k.navn}>
                        <rect
                            x={k.x - 210}
                            y={190}
                            width={420}
                            height={600}
                            rx={34}
                            fill="none"
                            stroke="#475569"
                            strokeWidth={5}
                            strokeDasharray="18 14"
                        />
                        {!vis && (
                            <T x={k.x} y={510} str={140} vekt={900} farge="#475569">
                                {String(i + 1)}
                            </T>
                        )}
                        {vis && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: fokus ? 1 : 0.75 }}
                                transition={{ duration: 0.6 }}
                            >
                                <rect
                                    x={k.x - 210}
                                    y={190}
                                    width={420}
                                    height={600}
                                    rx={34}
                                    fill={k.farge}
                                />
                                <g transform={`translate(${k.x} 350)`}>{k.symbol}</g>
                                <T x={k.x} y={530} str={52} vekt={900}>
                                    {k.navn}
                                </T>
                                {k.linjer.map((l, j) => (
                                    <T
                                        key={l}
                                        x={k.x}
                                        y={610 + j * 52}
                                        str={36}
                                        vekt={700}
                                        farge="#334155"
                                    >
                                        {l}
                                    </T>
                                ))}
                            </motion.g>
                        )}
                    </g>
                );
            })}
        </>
    );
}

/* ---------- jonas ---------- */

const LINJER = [
    'Vil du tjene 500 kroner på fem minutter?',
    'Du tar imot 5000 kroner på kontoen din',
    'og sender dem videre.',
    'Helt lovlig, alle gjør det.',
];

function Stopp() {
    const r = 170;
    const punkter = Array.from({ length: 8 }, (_, i) => {
        const a = Math.PI / 8 + (i * Math.PI) / 4;
        return `${Math.cos(a) * r},${Math.sin(a) * r}`;
    }).join(' ');
    return (
        <g>
            <polygon points={punkter} fill="#dc2626" stroke="#fff" strokeWidth={14} />
            <T x={0} y={26} str={68} vekt={900} farge="#fff">
                STOPP
            </T>
        </g>
    );
}

function Jonas({ beat }: { beat: number }) {
    const b = Math.min(beat, 4);
    const markert = (i: number) => (b === 1 && i === 0) || (b === 2 && (i === 1 || i === 2));
    return (
        <>
            <T x={800} y={100} str={56} vekt={900} farge="#f8fafc">
                {b <= 2
                    ? 'Finner du triksene?'
                    : b === 3
                      ? 'Dette gjør aldri ekte banker og arbeidsgivere'
                      : 'Haster det og vil de ha noe?'}
            </T>

            {/* Meldingen. */}
            <Vis vis={b <= 2}>
                <rect x={90} y={200} width={860} height={330} rx={36} fill="#f1f5f9" />
                <T x={130} y={250} str={28} vekt={900} farge="#64748b" anker="start">
                    Ukjent, på Snapchat
                </T>
                {LINJER.map((l, i) => (
                    <g key={l}>
                        <motion.rect
                            x={118}
                            y={278 + i * 58}
                            width={810}
                            height={52}
                            rx={10}
                            animate={{
                                fill: markert(i)
                                    ? i === 0
                                        ? '#fde68a'
                                        : '#bfdbfe'
                                    : 'rgba(255,255,255,0)',
                            }}
                        />
                        <T x={130} y={316 + i * 58} str={36} vekt={600} anker="start">
                            {l}
                        </T>
                    </g>
                ))}
            </Vis>

            <Vis vis={b === 1}>
                <path d="M 960 310 L 1040 310" stroke="#fbbf24" strokeWidth={8} />
                <rect x={1050} y={250} width={440} height={120} rx={24} fill="#fbbf24" />
                <T x={1270} y={330} str={56} vekt={900}>
                    Lokkemat
                </T>
            </Vis>
            <Vis vis={b === 2}>
                <path d="M 960 400 L 1040 430" stroke="#93c5fd" strokeWidth={8} />
                <rect x={1050} y={380} width={440} height={170} rx={24} fill="#93c5fd" />
                <T x={1270} y={450} str={50} vekt={900}>
                    Gi fra deg noe:
                </T>
                <T x={1270} y={515} str={44} vekt={800}>
                    kontoen din
                </T>
            </Vis>
            <Vis vis={b >= 1 && b <= 2}>
                <T x={520} y={640} str={36} vekt={700} farge="#cbd5e1">
                    {b === 1
                        ? 'Lettjente penger for nesten ingenting'
                        : 'Han skal låne bort kontoen sin'}
                </T>
            </Vis>

            <Vis vis={b === 3}>
                {[
                    {
                        y: 220,
                        l1: 'Ingen seriøs arbeidsgiver',
                        l2: 'betaler deg for å låne kontoen din',
                    },
                    {
                        y: 500,
                        l1: 'Ingen ekte bank',
                        l2: 'ber deg logge inn via en lenke i en SMS',
                    },
                ].map((k) => (
                    <g key={k.l1}>
                        <rect x={200} y={k.y} width={1200} height={220} rx={30} fill="#f8fafc" />
                        <g transform={`translate(320 ${k.y + 110})`}>
                            <circle r={70} fill="#dc2626" />
                            <path
                                d="M -32 -32 L 32 32 M 32 -32 L -32 32"
                                stroke="#fff"
                                strokeWidth={16}
                                strokeLinecap="round"
                            />
                        </g>
                        <T x={430} y={k.y + 95} str={52} vekt={900} anker="start">
                            {k.l1}
                        </T>
                        <T x={430} y={k.y + 160} str={38} vekt={700} farge="#334155" anker="start">
                            {k.l2}
                        </T>
                    </g>
                ))}
            </Vis>

            <Vis vis={b === 4}>
                <g transform="translate(470 480)">
                    <Stopp />
                </g>
                {['Penger?', 'Koder?', 'Kontoen din?'].map((t, i) => (
                    <T
                        key={t}
                        x={760}
                        y={390 + i * 90}
                        str={60}
                        vekt={900}
                        farge="#f8fafc"
                        anker="start"
                    >
                        {t}
                    </T>
                ))}
            </Vis>
        </>
    );
}

export function SvindelTriks({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'tre';
    return (
        <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(180deg, #1e1b4b, #0f172a)' }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="h-full w-full"
            >
                {modus === 'tre' ? <Tre beat={beat} /> : <Jonas beat={beat} />}
            </svg>
        </div>
    );
}
