import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * 2D-grafikken i grunnleggerfilmen, i tre modus:
 * - antall: én, to, ti eller ingen grunnleggere (ett merke per person).
 * - trapp: trappa fra ingen grunnlegger til Gud.
 * - arv: religionene på trappa, så hvem som tok over da grunnleggeren døde.
 */

type Modus = 'antall' | 'trapp' | 'arv';

const B = 1600;
const H = 900;

const OVERSKRIFT: Record<Modus, string[]> = {
    antall: [
        'Alt har en oppfinner?',
        'Hvor mange grunnleggere?',
        'Hvor mange grunnleggere?',
        'Hvor mange grunnleggere?',
        'Hvor mange grunnleggere?',
    ],
    trapp: [
        'Hvor høyt ble han plassert?',
        'Trappa',
        'Trappa',
        'Gud: du kan be til ham',
        'Lærer: bare gjør som han sa',
    ],
    arv: [
        'Spørsmål 1: Hvor høyt?',
        'Spørsmål 2: Hvem tok over?',
        'Spørsmål 2: Hvem tok over?',
        'Spørsmål 2: Hvem tok over?',
        'Hvem bestemmer i dag?',
    ],
};

function Overskrift({ tekst }: { tekst: string }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={B / 2}
                y={100}
                textAnchor="middle"
                fontSize={58}
                fontWeight={900}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay }}
        >
            {children}
        </motion.g>
    );
}

/* ---------- antall ---------- */

const KOLONNER = [
    { ord: 'Én', navn: 'Buddhisme', farge: '#f59e0b', antall: 1, under: 'Buddha', fra: 1 },
    { ord: 'To', navn: "Bahá'í", farge: '#14b8a6', antall: 2, under: "Báb og Bahá'u'lláh", fra: 2 },
    { ord: 'Ti', navn: 'Sikhisme', farge: '#f97316', antall: 10, under: 'ti guruer', fra: 3 },
    {
        ord: 'Ingen',
        navn: 'Hinduisme',
        farge: '#ec4899',
        antall: 0,
        under: 'ingen grunnlegger',
        fra: 4,
    },
];

function Merker({ antall, farge, cx }: { antall: number; farge: string; cx: number }) {
    if (antall === 0) {
        return (
            <circle
                cx={cx}
                cy={500}
                r={70}
                fill="none"
                stroke={farge}
                strokeWidth={8}
                strokeDasharray="18 14"
            />
        );
    }
    const per = antall > 2 ? 5 : antall;
    const r = antall > 2 ? 26 : 46;
    const mellom = antall > 2 ? 64 : 110;
    return (
        <>
            {Array.from({ length: antall }, (_, i) => {
                const rad = Math.floor(i / per);
                const kol = i % per;
                const x = cx + (kol - (per - 1) / 2) * mellom;
                const y = (antall > 2 ? 450 : 500) + rad * 100;
                return (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.12 }}
                        style={{ transformOrigin: `${x}px ${y}px` }}
                    >
                        <circle cx={x} cy={y - r * 0.55} r={r * 0.45} fill={farge} />
                        <rect
                            x={x - r * 0.6}
                            y={y - r * 0.05}
                            width={r * 1.2}
                            height={r * 1.1}
                            rx={r * 0.45}
                            fill={farge}
                        />
                    </motion.g>
                );
            })}
        </>
    );
}

function Antall({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <Fade>
                {[
                    { a: 'En bedrift', b: 'en gründer', y: 360 },
                    { a: 'En app', b: 'en utvikler', y: 560 },
                ].map((r, i) => (
                    <motion.g
                        key={r.a}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.6 }}
                    >
                        <rect x={330} y={r.y - 70} width={940} height={130} rx={28} fill="#fff" />
                        <text x={400} y={r.y + 16} fontSize={56} fontWeight={800} fill="#334155">
                            {r.a}
                        </text>
                        <text x={800} y={r.y + 16} fontSize={56} fontWeight={800} fill="#94a3b8">
                            →
                        </text>
                        <text x={900} y={r.y + 16} fontSize={56} fontWeight={900} fill="#0f766e">
                            {r.b}
                        </text>
                    </motion.g>
                ))}
            </Fade>
        );
    }
    return (
        <g>
            {KOLONNER.map((k, i) => {
                const cx = 230 + i * 380;
                const vis = beat >= k.fra;
                return (
                    <g key={k.ord}>
                        <rect
                            x={cx - 170}
                            y={180}
                            width={340}
                            height={660}
                            rx={30}
                            fill="#fff"
                            opacity={vis ? 1 : 0.45}
                        />
                        <text
                            x={cx}
                            y={290}
                            textAnchor="middle"
                            fontSize={84}
                            fontWeight={900}
                            fill={vis ? k.farge : '#cbd5e1'}
                        >
                            {k.ord}
                        </text>
                        {vis && (
                            <>
                                <Merker antall={k.antall} farge={k.farge} cx={cx} />
                                <motion.text
                                    x={cx}
                                    y={720}
                                    textAnchor="middle"
                                    fontSize={44}
                                    fontWeight={900}
                                    fill="#0f172a"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {k.navn}
                                </motion.text>
                                <motion.text
                                    x={cx}
                                    y={785}
                                    textAnchor="middle"
                                    fontSize={k.under.length > 14 ? 30 : 36}
                                    fontWeight={700}
                                    fill="#64748b"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    {k.under}
                                </motion.text>
                            </>
                        )}
                    </g>
                );
            })}
        </g>
    );
}

/* ---------- trapp ---------- */

const TRINN = [
    { navn: 'ingen', farge: '#ec4899' },
    { navn: 'lærer', farge: '#f59e0b' },
    { navn: 'profet', farge: '#10b981' },
    { navn: 'utsending', farge: '#14b8a6' },
    { navn: 'Gud', farge: '#6366f1' },
];

const TRINN_B = 250;
const TRINN_X0 = 175;
const BUNN = 860;

function trinnTopp(i: number) {
    return BUNN - 110 - i * 105;
}

function Trapp({ beat, modus }: { beat: number; modus: 'trapp' | 'arv' }) {
    const etiketter = modus === 'arv' || beat >= 1;
    return (
        <g>
            {TRINN.map((t, i) => {
                const x = TRINN_X0 + i * TRINN_B;
                const y = trinnTopp(i);
                const visNavn = etiketter && (i > 0 || modus === 'arv' || beat >= 2);
                const fremhev =
                    modus === 'trapp' && ((beat === 3 && i === 4) || (beat === 4 && i === 1));
                return (
                    <g key={t.navn}>
                        <motion.rect
                            x={x}
                            y={y}
                            width={TRINN_B}
                            height={BUNN - y}
                            initial={false}
                            animate={{
                                fill: fremhev ? t.farge : visNavn ? '#f8fafc' : '#e2e8f0',
                            }}
                            transition={{ duration: 0.5 }}
                            stroke="#94a3b8"
                            strokeWidth={3}
                        />
                        <rect x={x} y={y} width={TRINN_B} height={14} fill={t.farge} />
                        {visNavn && (
                            <motion.text
                                x={x + TRINN_B / 2}
                                y={y + 66}
                                textAnchor="middle"
                                fontSize={t.navn.length > 10 ? 26 : 40}
                                fontWeight={900}
                                fill={fremhev ? '#fff' : '#1e293b'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: modus === 'trapp' ? 0.2 + (4 - i) * 0.4 : 0 }}
                            >
                                {t.navn}
                            </motion.text>
                        )}
                    </g>
                );
            })}
        </g>
    );
}

function TrappKort({ beat }: { beat: number }) {
    const kort =
        beat === 0
            ? { tekst: 'Ikke hvem han var, men hvor høyt', farge: '#b45309' }
            : beat === 3
              ? { tekst: 'Er han Gud: du kan be til ham', farge: '#6366f1' }
              : beat === 4
                ? { tekst: 'Er han lærer: du kan bare gjøre som han sa', farge: '#f59e0b' }
                : null;
    return (
        <AnimatePresence mode="wait">
            {kort && (
                <motion.g
                    key={beat}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                >
                    <rect
                        x={80}
                        y={170}
                        width={940}
                        height={110}
                        rx={24}
                        fill="#fff"
                        stroke={kort.farge}
                        strokeWidth={6}
                    />
                    <text
                        x={550}
                        y={240}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        {kort.tekst}
                    </text>
                </motion.g>
            )}
        </AnimatePresence>
    );
}

/* ---------- arv ---------- */

const PLASSERT: { navn: string; trinn: number; farge: string; rad: number }[] = [
    { navn: 'Hinduisme', trinn: 0, farge: '#ec4899', rad: 0 },
    { navn: 'Buddhisme', trinn: 1, farge: '#f59e0b', rad: 0 },
    { navn: 'Jødedom', trinn: 0, farge: '#3b82f6', rad: 1 },
    { navn: 'Sikhisme', trinn: 1, farge: '#f97316', rad: 1 },
    { navn: 'Islam', trinn: 2, farge: '#10b981', rad: 0 },
    { navn: 'Mormonisme', trinn: 2, farge: '#8b5cf6', rad: 1 },
    { navn: "Bahá'í", trinn: 3, farge: '#14b8a6', rad: 0 },
    { navn: 'Kristendom', trinn: 4, farge: '#6366f1', rad: 0 },
];

const ARV = [
    { navn: 'Mormonisme', farge: '#8b5cf6', arving: 'en stilling: presidenten', fra: 2 },
    { navn: 'Jødedom', farge: '#3b82f6', arving: 'rabbinerne bestemmer', fra: 3 },
    { navn: 'Kristendom', farge: '#6366f1', arving: 'kirkemøtene', fra: 3 },
    { navn: 'Sikhisme', farge: '#f97316', arving: 'en bok', fra: 3 },
    { navn: 'Buddhisme', farge: '#f59e0b', arving: 'selve læren', fra: 3 },
];

function Arv({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <Fade>
                <Trapp beat={beat} modus="arv" />
                {PLASSERT.map((p, i) => {
                    const x = TRINN_X0 + p.trinn * TRINN_B + TRINN_B / 2;
                    const y = trinnTopp(p.trinn) - 40 - p.rad * 62;
                    return (
                        <motion.g
                            key={p.navn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.2 }}
                        >
                            <rect
                                x={x - 118}
                                y={y - 28}
                                width={236}
                                height={56}
                                rx={14}
                                fill={p.farge}
                            />
                            <text
                                x={x}
                                y={y + 10}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={900}
                                fill="#fff"
                            >
                                {p.navn}
                            </text>
                        </motion.g>
                    );
                })}
            </Fade>
        );
    }
    return (
        <Fade>
            {ARV.map((r, i) => {
                const y = 220 + i * 118;
                const vis = beat >= r.fra;
                return (
                    <g key={r.navn}>
                        <rect x={180} y={y} width={420} height={88} rx={20} fill={r.farge} />
                        <text
                            x={390}
                            y={y + 58}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill="#fff"
                        >
                            {r.navn}
                        </text>
                        <text
                            x={700}
                            y={y + 60}
                            textAnchor="middle"
                            fontSize={56}
                            fontWeight={900}
                            fill="#94a3b8"
                        >
                            →
                        </text>
                        <rect
                            x={800}
                            y={y}
                            width={620}
                            height={88}
                            rx={20}
                            fill="#fff"
                            stroke={vis ? r.farge : '#cbd5e1'}
                            strokeWidth={5}
                        />
                        {vis ? (
                            <motion.text
                                x={1110}
                                y={y + 58}
                                textAnchor="middle"
                                fontSize={42}
                                fontWeight={900}
                                fill="#0f172a"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + (r.fra === 3 ? (i - 1) * 0.35 : 0) }}
                            >
                                {r.arving}
                            </motion.text>
                        ) : (
                            <text
                                x={1110}
                                y={y + 60}
                                textAnchor="middle"
                                fontSize={50}
                                fontWeight={900}
                                fill="#cbd5e1"
                            >
                                ?
                            </text>
                        )}
                    </g>
                );
            })}
            {beat >= 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <rect x={300} y={812} width={1000} height={72} rx={20} fill="#0f172a" />
                    <text
                        x={800}
                        y={860}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={800}
                        fill="#fff"
                    >
                        Inne i hver tradisjon er folk uenige om dette
                    </text>
                </motion.g>
            )}
        </Fade>
    );
}

export function GrunnleggereSkala({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'antall';
    const linjer = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0" style={{ background: '#f1ece2' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <Overskrift tekst={linjer[Math.min(beat, linjer.length - 1)]} />
                {modus === 'antall' && <Antall beat={beat} />}
                {modus === 'trapp' && (
                    <>
                        <Trapp beat={beat} modus="trapp" />
                        <TrappKort beat={beat} />
                    </>
                )}
                {modus === 'arv' && (
                    <AnimatePresence mode="wait">
                        <motion.g key={beat === 0 ? 'trapp' : 'arv'}>
                            <Arv beat={beat} />
                        </motion.g>
                    </AnimatePresence>
                )}
            </svg>
        </div>
    );
}
