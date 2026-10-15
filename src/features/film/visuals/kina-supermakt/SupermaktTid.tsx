import { AnimatePresence, motion } from 'framer-motion';
import {
    Ban,
    Flame,
    Landmark,
    Lock,
    MessageSquareOff,
    Newspaper,
    Printer,
    ScrollText,
    Shield,
} from 'lucide-react';
import type { VisualProps } from '../../types';

/**
 * Tid og makt i filmen om Kina som supermakt. Tegnet i SVG, 1600x900.
 * - «xi»: Xi Jinping kommer til makta, og Kinas drøm for folk og for landet.
 * - «makt»: sensur, fengsel, og grensen på to perioder som forsvinner. Mao til sammenligning.
 * - «hongkong»: kolonien, løftet på 50 år, demonstrasjonene og sikkerhetsloven.
 * - «historie»: Midtens rike, hundre år med ydmykelse, og drømmen om å komme tilbake.
 */

type Modus = 'xi' | 'makt' | 'hongkong' | 'historie';

const B = 1600;
const H = 900;
const RØD = '#b91c1c';
const GULL = '#ca8a04';

export function SupermaktTid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'xi';
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f7f1e6]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'xi' && <Xi beat={beat} />}
                {modus === 'makt' && <Makt beat={beat} />}
                {modus === 'hongkong' && <HongKong beat={beat} />}
                {modus === 'historie' && <Historie beat={beat} />}
            </svg>
        </div>
    );
}

function Tittel({ tekst, y = 92 }: { tekst: string; y?: number }) {
    return (
        <AnimatePresence mode="wait">
            <motion.text
                key={tekst}
                x={B / 2}
                y={y}
                textAnchor="middle"
                fontSize={58}
                fontWeight={900}
                fill="#0f172a"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                {tekst}
            </motion.text>
        </AnimatePresence>
    );
}

function Tekst({
    x,
    y,
    children,
    str = 36,
    farge = '#0f172a',
    vekt = 800,
    anker = 'middle',
    synlig = true,
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    children: React.ReactNode;
    str?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
    synlig?: boolean;
    forsinkelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6, delay: synlig ? forsinkelse : 0 }}
        >
            {children}
        </motion.text>
    );
}

/* ---------------- Xi ---------------- */

function Xi({ beat }: { beat: number }) {
    const titler = ['Kinas nye leder', 'Kinas drøm: for folk flest', 'Kinas drøm: for landet'];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 2)]} />
            {/* Portrett-silhuett */}
            <g transform="translate(330 470)">
                <circle r={190} fill="#fee2e2" stroke={RØD} strokeWidth={8} />
                <circle cy={-50} r={70} fill="#334155" />
                <path d="M -120 130 Q -120 20 0 20 Q 120 20 120 130 Z" fill="#334155" />
                <path d="M -18 30 L 0 110 L 18 30 Z" fill={RØD} />
            </g>
            <Tekst x={330} y={720} str={50} vekt={900}>
                Xi Jinping
            </Tekst>

            {/* Beat 0: årstall */}
            <AnimatePresence>
                {beat === 0 && (
                    <motion.g key="aar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <line x1={700} y1={470} x2={1480} y2={470} stroke="#94a3b8" strokeWidth={8} />
                        {[
                            { x: 820, år: '2012', t: 'sjef for partiet', d: 0.4 },
                            { x: 1260, år: '2013', t: 'president', d: 1.8 },
                        ].map((m) => (
                            <motion.g
                                key={m.år}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: m.d }}
                            >
                                <circle cx={m.x} cy={470} r={22} fill={RØD} />
                                <text x={m.x} y={410} textAnchor="middle" fontSize={64} fontWeight={900} fill={RØD}>
                                    {m.år}
                                </text>
                                <text x={m.x} y={545} textAnchor="middle" fontSize={40} fontWeight={700} fill="#334155">
                                    {m.t}
                                </text>
                            </motion.g>
                        ))}
                    </motion.g>
                )}
                {beat === 1 && <Trapp key="trapp" />}
                {beat >= 2 && <Landet key="land" />}
            </AnimatePresence>
        </>
    );
}

/** En person som går opp trappa fra fattigdom til middelklassen. */
function Trapp() {
    const trinn = [0, 1, 2, 3];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {trinn.map((i) => (
                <rect
                    key={i}
                    x={700 + i * 190}
                    y={700 - (i + 1) * 90}
                    width={190}
                    height={(i + 1) * 90}
                    fill={i === 3 ? '#fde68a' : '#e2e8f0'}
                    stroke="#94a3b8"
                    strokeWidth={3}
                />
            ))}
            <text x={795} y={760} textAnchor="middle" fontSize={40} fontWeight={800} fill="#64748b">
                fattig
            </text>
            <text x={1365} y={760} textAnchor="middle" fontSize={40} fontWeight={800} fill="#a16207">
                middelklasse
            </text>
            <motion.g
                initial={{ x: 795, y: 610 }}
                animate={{ x: [795, 985, 1175, 1365], y: [610, 520, 430, 340] }}
                transition={{ duration: 3.2, delay: 0.6, times: [0, 0.33, 0.66, 1], ease: 'easeInOut' }}
            >
                <circle cy={-70} r={22} fill="#0f172a" />
                <path d="M -26 0 Q -26 -44 0 -44 Q 26 -44 26 0 Z" fill="#0f172a" />
            </motion.g>
        </motion.g>
    );
}

function Landet() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <line x1={720} y1={720} x2={1480} y2={720} stroke="#94a3b8" strokeWidth={5} />
            <motion.path
                d="M 740 690 C 950 680 1100 600 1200 500 S 1380 300 1460 280"
                fill="none"
                stroke={RØD}
                strokeWidth={14}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, delay: 0.3, ease: 'easeInOut' }}
            />
            <text x={760} y={650} fontSize={38} fontWeight={800} fill="#64748b">
                fattig land
            </text>
            <Tekst x={1440} y={240} str={46} vekt={900} farge={RØD} anker="end" forsinkelse={2.2}>
                stadig rikere supermakt
            </Tekst>
        </motion.g>
    );
}

/* ---------------- Makt ---------------- */

function Makt({ beat }: { beat: number }) {
    const titler = [
        'Sensur: staten bestemmer hva du leser',
        'Kritikk kan gi fengsel',
        'Regelen: høyst to perioder',
        '2018: grensen fjernes',
        'Den mektigste siden Mao',
    ];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            <AnimatePresence mode="wait">
                {beat === 0 && <Sensur key="sensur" />}
                {beat === 1 && <Fengsel key="fengsel" />}
                {(beat === 2 || beat === 3) && <Perioder key="perioder" fjernet={beat === 3} />}
                {beat >= 4 && <MaoXi key="mao" />}
            </AnimatePresence>
        </>
    );
}

function Sensur() {
    const linjer = [0, 1, 2, 3, 4, 5, 6];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[
                { x: 260, ikon: Newspaper, navn: 'Avisa' },
                { x: 900, ikon: MessageSquareOff, navn: 'Internett' },
            ].map((s, k) => (
                <g key={s.navn}>
                    <rect x={s.x} y={190} width={460} height={560} rx={24} fill="#fff" stroke="#cbd5e1" strokeWidth={4} />
                    <s.ikon x={s.x + 30} y={215} width={60} height={60} color="#334155" />
                    <text x={s.x + 110} y={262} fontSize={44} fontWeight={900} fill="#0f172a">
                        {s.navn}
                    </text>
                    {linjer.map((i) => (
                        <g key={i}>
                            <rect x={s.x + 40} y={320 + i * 58} width={380 - (i % 3) * 40} height={18} rx={9} fill="#cbd5e1" />
                            {(i + k) % 2 === 0 && (
                                <motion.rect
                                    x={s.x + 34}
                                    y={310 + i * 58}
                                    height={38}
                                    rx={4}
                                    fill="#0f172a"
                                    initial={{ width: 0 }}
                                    animate={{ width: 392 - (i % 3) * 40 }}
                                    transition={{ delay: 0.8 + i * 0.35 + k * 0.2, duration: 0.5 }}
                                />
                            )}
                        </g>
                    ))}
                </g>
            ))}
        </motion.g>
    );
}

function Fengsel() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <g transform="translate(800 500)">
                <circle cy={-90} r={70} fill="#334155" />
                <path d="M -130 160 Q -130 0 0 0 Q 130 0 130 160 Z" fill="#334155" />
            </g>
            {/* Sprinklene faller ned */}
            {Array.from({ length: 8 }, (_, i) => (
                <motion.rect
                    key={i}
                    x={540 + i * 74}
                    width={18}
                    rx={9}
                    fill="#1e293b"
                    initial={{ y: 180, height: 0 }}
                    animate={{ y: 180, height: 580 }}
                    transition={{ delay: 1 + i * 0.08, duration: 0.6 }}
                />
            ))}
            <motion.rect
                x={520}
                y={170}
                width={560}
                height={26}
                rx={8}
                fill="#1e293b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            />
            <g transform="translate(800 500)">
                <g transform="translate(320 -210)">
                    <path d="M 0 0 h 210 a 20 20 0 0 1 20 20 v 90 a 20 20 0 0 1 -20 20 h -150 l -40 40 v -40 h -20 a 20 20 0 0 1 -20 -20 v -90 a 20 20 0 0 1 20 -20 z" fill="#fff" stroke="#94a3b8" strokeWidth={4} />
                    <text x={105} y={80} textAnchor="middle" fontSize={44} fontWeight={900} fill="#334155">
                        Kritikk!
                    </text>
                </g>
            </g>
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}>
                <Lock x={1130} y={490} width={90} height={90} color={RØD} />
            </motion.g>
        </motion.g>
    );
}

function Perioder({ fjernet }: { fjernet: boolean }) {
    const blokker = [1, 2, 3, 4];
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {blokker.map((n) => {
                const ekstra = n > 2;
                return (
                    <motion.g
                        key={n}
                        initial={{ opacity: ekstra ? 0 : 0, x: -30 }}
                        animate={{ opacity: ekstra ? (fjernet ? 1 : 0) : 1, x: 0 }}
                        transition={{ delay: ekstra ? 1.4 + (n - 3) * 0.6 : 0.3 + n * 0.5 }}
                    >
                        <rect
                            x={160 + (n - 1) * 300 + (n > 2 ? 120 : 0)}
                            y={380}
                            width={260}
                            height={170}
                            rx={20}
                            fill={ekstra ? '#fecaca' : '#fee2e2'}
                            stroke={RØD}
                            strokeWidth={5}
                            strokeDasharray={ekstra ? '16 10' : undefined}
                        />
                        <text
                            x={290 + (n - 1) * 300 + (n > 2 ? 120 : 0)}
                            y={485}
                            textAnchor="middle"
                            fontSize={46}
                            fontWeight={900}
                            fill={RØD}
                        >
                            {n === 4 ? '...?' : `periode ${n}`}
                        </text>
                    </motion.g>
                );
            })}
            {/* Muren, Dengs regel (tidligere leder) */}
            <motion.g
                animate={
                    fjernet
                        ? { opacity: 0, y: 260, rotate: 20 }
                        : { opacity: 1, y: 0, rotate: 0 }
                }
                transition={{ duration: 1.1, delay: fjernet ? 0.5 : 0 }}
                style={{ transformOrigin: '800px 650px' }}
            >
                <rect x={770} y={300} width={60} height={330} fill="#475569" />
                {[0, 1, 2, 3, 4].map((i) => (
                    <line key={i} x1={770} x2={830} y1={340 + i * 60} y2={340 + i * 60} stroke="#94a3b8" strokeWidth={4} />
                ))}
                <text x={800} y={690} textAnchor="middle" fontSize={34} fontWeight={800} fill="#475569">
                    Dengs regel (tidligere leder)
                </text>
                <Ban x={765} y={230} width={70} height={70} color={RØD} />
            </motion.g>
            <Tekst x={800} y={800} str={44} vekt={900} farge={RØD} synlig={fjernet} forsinkelse={1.8}>
                Xi kan sitte resten av livet
            </Tekst>
        </motion.g>
    );
}

function MaoXi() {
    // Akse fra 1940 til 2040: 12 px per år.
    const x = (år: number) => 200 + (år - 1940) * 12;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <line x1={x(1940)} x2={x(2040)} y1={640} y2={640} stroke="#94a3b8" strokeWidth={5} />
            {[1949, 1976, 2012].map((år) => (
                <g key={år}>
                    <line x1={x(år)} x2={x(år)} y1={625} y2={655} stroke="#64748b" strokeWidth={4} />
                    <text x={x(år)} y={700} textAnchor="middle" fontSize={36} fontWeight={800} fill="#475569">
                        {år}
                    </text>
                </g>
            ))}
            <motion.rect
                x={x(1949)}
                y={420}
                height={110}
                rx={14}
                fill="#7f1d1d"
                initial={{ width: 0 }}
                animate={{ width: x(1976) - x(1949) }}
                transition={{ duration: 1.4, delay: 0.4 }}
            />
            <Tekst x={(x(1949) + x(1976)) / 2} y={490} str={48} vekt={900} farge="#fff" forsinkelse={1.2}>
                Mao
            </Tekst>
            <Tekst x={(x(1949) + x(1976)) / 2} y={390} str={34} vekt={700} farge="#475569" forsinkelse={1.2}>
                styrte til han døde
            </Tekst>
            <motion.rect
                x={x(2012)}
                y={420}
                height={110}
                rx={14}
                fill={RØD}
                initial={{ width: 0 }}
                animate={{ width: x(2034) - x(2012) }}
                transition={{ duration: 1.6, delay: 2 }}
            />
            <motion.path
                d={`M ${x(2034)} 420 l 70 55 l -70 55 z`}
                fill={RØD}
                opacity={0.5}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 3.4 }}
            />
            <Tekst x={(x(2012) + x(2034)) / 2} y={490} str={48} vekt={900} farge="#fff" forsinkelse={2.8}>
                Xi
            </Tekst>
            <Tekst x={x(2030)} y={390} str={34} vekt={700} farge="#475569" forsinkelse={3}>
                ingen grense
            </Tekst>
        </motion.g>
    );
}

/* ---------------- Hong Kong ---------------- */

function HongKong({ beat }: { beat: number }) {
    // Akse fra 1830 til 2060: 5,6 px per år.
    const x = (år: number) => 160 + (år - 1830) * 5.6;
    const titler = [
        'Hong Kong: britisk koloni',
        'Tilbake til Kina, med et løfte',
        'Ett land, to systemer',
        '2019: protester i gatene',
        '2020: sikkerhetsloven',
    ];
    const slutt = 1997 + 50;
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />
            <line x1={x(1830)} x2={x(2060)} y1={560} y2={560} stroke="#94a3b8" strokeWidth={5} />
            {/* Britisk tid */}
            <motion.rect
                x={x(1841)}
                y={480}
                height={70}
                rx={10}
                fill="#1d4ed8"
                initial={{ width: 0 }}
                animate={{ width: x(1997) - x(1841) }}
                transition={{ duration: 1.8, delay: 0.3 }}
            />
            <Tekst x={(x(1841) + x(1997)) / 2} y={528} str={38} vekt={900} farge="#fff" forsinkelse={1}>
                styrt av Storbritannia
            </Tekst>
            <Tekst x={x(1841)} y={610} str={36} farge="#1d4ed8">
                1841
            </Tekst>

            {/* Løftet på 50 år */}
            <motion.rect
                x={x(1997)}
                y={480}
                height={70}
                rx={10}
                initial={{ width: 0 }}
                animate={{
                    width: beat >= 1 ? x(slutt) - x(1997) : 0,
                    fill: beat >= 4 ? '#94a3b8' : '#0d9488',
                }}
                transition={{ duration: 1.4, delay: beat === 1 ? 0.6 : 0 }}
            />
            <Tekst x={(x(1997) + x(slutt)) / 2} y={450} str={34} vekt={800} farge="#0f766e" synlig={beat >= 1} forsinkelse={1.6}>
                løftet: 50 år med selvstyre
            </Tekst>
            <Tekst x={x(1997)} y={610} str={36} farge="#0f766e" synlig={beat >= 1}>
                1997
            </Tekst>

            {/* Ett land, to systemer */}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.g key="to" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <rect x={220} y={650} width={560} height={190} rx={22} fill="#fee2e2" stroke={RØD} strokeWidth={4} />
                        <Shield x={250} y={680} width={56} height={56} color={RØD} />
                        <text x={320} y={722} fontSize={40} fontWeight={900} fill={RØD}>Kina</text>
                        <text x={250} y={790} fontSize={32} fontWeight={700} fill="#334155">forsvar og utenrikspolitikk</text>
                        <rect x={820} y={650} width={560} height={190} rx={22} fill="#ccfbf1" stroke="#0f766e" strokeWidth={4} />
                        <Landmark x={850} y={680} width={56} height={56} color="#0f766e" />
                        <text x={920} y={722} fontSize={40} fontWeight={900} fill="#0f766e">Hong Kong</text>
                        <text x={850} y={790} fontSize={32} fontWeight={700} fill="#334155">egen økonomi, egne domstoler</text>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* 2019: folkemengde */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <line x1={x(2019)} x2={x(2019)} y1={475} y2={640} stroke="#f59e0b" strokeWidth={5} />
                <text x={x(2019) - 10} y={665} textAnchor="end" fontSize={36} fontWeight={900} fill="#b45309">
                    2019
                </text>
                {Array.from({ length: 30 }, (_, i) => {
                    const cx = 520 + (i % 10) * 60 + (Math.floor(i / 10) % 2) * 30;
                    const cy = 700 + Math.floor(i / 10) * 58;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: beat === 3 ? 1 : 0, y: 0 }}
                            transition={{ delay: beat === 3 ? 0.3 + i * 0.04 : 0 }}
                        >
                            <circle cx={cx} cy={cy - 18} r={13} fill="#334155" />
                            <path d={`M ${cx - 18} ${cy + 22} Q ${cx - 18} ${cy - 2} ${cx} ${cy - 2} Q ${cx + 18} ${cy - 2} ${cx + 18} ${cy + 22} Z`} fill="#334155" />
                        </motion.g>
                    );
                })}
                <text x={1130} y={770} opacity={beat === 3 ? 1 : 0} fontSize={34} fontWeight={800} fill="#b45309">
                    mot loven om utlevering
                </text>
            </motion.g>

            {/* 2020: sprekk i løftet */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 4 ? 1 : 0 }} transition={{ duration: 0.6 }}>
                <path
                    d={`M ${x(2020)} 470 l 14 22 l -18 16 l 16 20 l -12 24`}
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth={6}
                />
                <text x={x(2020) + 14} y={665} fontSize={36} fontWeight={900} fill="#0f172a">
                    2020
                </text>
                <rect x={500} y={650} width={600} height={120} rx={20} fill="#0f172a" />
                <text x={800} y={725} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff">
                    Smuldrer frihetene bort?
                </text>
            </motion.g>
        </>
    );
}

/* ---------------- Historie ---------------- */

function Historie({ beat }: { beat: number }) {
    const titler = [
        'I hundrevis av år: verdens mektigste rike',
        'Kina fant opp',
        'Zhongguo: Midtens rike',
        'Hundre år med ydmykelse',
        'Kinas drøm: tilbake til sentrum',
    ];
    // Hvor tegnet står per beat: midt, midt, midt, nede i dalen, midt igjen.
    const tegn = [
        { x: 800, y: 470, s: 1 },
        { x: 800, y: 470, s: 0.8 },
        { x: 800, y: 480, s: 1 },
        { x: 1010, y: 740, s: 0.45 },
        { x: 800, y: 480, s: 1.1 },
    ][Math.min(beat, 4)];
    return (
        <>
            <Tittel tekst={titler[Math.min(beat, 4)]} />

            {/* Ringene rundt sentrum */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 || beat >= 4 ? 1 : 0 }}
                transition={{ duration: 0.8 }}
            >
                {[330, 250, 175].map((r, i) => (
                    <circle
                        key={r}
                        cx={800}
                        cy={480}
                        r={r}
                        fill="none"
                        stroke={GULL}
                        strokeWidth={4}
                        strokeDasharray={i === 0 ? '12 12' : undefined}
                        opacity={0.6 + i * 0.15}
                    />
                ))}
                <text x={800} y={850} textAnchor="middle" fontSize={38} fontWeight={800} fill="#a16207">
                    midt i verden
                </text>
            </motion.g>

            {/* Kurven: fall og oppreisning */}
            <motion.path
                d="M 120 300 C 360 300 480 320 600 460 S 860 760 1000 740 S 1240 520 1320 360"
                fill="none"
                stroke={RØD}
                strokeWidth={12}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                    pathLength: beat === 3 ? 0.62 : 0,
                    opacity: beat === 3 ? 1 : 0,
                }}
                transition={{ duration: 2.2, ease: 'easeInOut' }}
            />
            {beat === 3 &&
                [
                    { x: 520, y: 380, t: 'Opiumskrigene', u: '1800-tallet' },
                    { x: 720, y: 600, t: 'Japan invaderer', u: '1930-tallet' },
                    { x: 880, y: 755, t: 'Borgerkrig', u: '', venstre: true },
                ].map((m, i) => (
                    <motion.g
                        key={m.t}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 1.1 }}
                    >
                        <circle cx={m.x} cy={m.y} r={14} fill="#0f172a" />
                        <text
                            x={'venstre' in m ? m.x - 26 : m.x + 26}
                            y={m.y - 12}
                            textAnchor={'venstre' in m ? 'end' : 'start'}
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            {m.t}
                        </text>
                        {m.u && (
                            <text x={m.x + 26} y={m.y + 30} fontSize={32} fontWeight={700} fill="#475569">
                                {m.u}
                            </text>
                        )}
                    </motion.g>
                ))}

            {/* Oppfinnelsene */}
            <AnimatePresence>
                {beat === 1 &&
                    [
                        { x: 330, ikon: ScrollText, t: 'papiret' },
                        { x: 1270, ikon: Printer, t: 'trykkekunsten' },
                        { x: 800, ikon: Flame, t: 'kruttet', y: 800 },
                    ].map((o, i) => (
                        <motion.g
                            key={o.t}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.4 + i * 0.9, type: 'spring' }}
                            style={{ transformOrigin: `${o.x}px ${o.y ?? 470}px` }}
                        >
                            <circle cx={o.x} cy={(o.y ?? 470) - 30} r={70} fill="#fff" stroke={GULL} strokeWidth={6} />
                            <o.ikon x={o.x - 38} y={(o.y ?? 470) - 68} width={76} height={76} color="#a16207" />
                            <text x={o.x} y={(o.y ?? 470) + 85} textAnchor="middle" fontSize={40} fontWeight={900} fill="#0f172a">
                                {o.t}
                            </text>
                        </motion.g>
                    ))}
            </AnimatePresence>

            {/* Tegnet 中 */}
            <motion.g
                initial={false}
                animate={{ x: tegn.x, y: tegn.y, scale: tegn.s }}
                transition={{ duration: 1.6, ease: 'easeInOut' }}
            >
                <circle r={120} fill={beat === 3 ? '#e2e8f0' : RØD} />
                <text y={52} textAnchor="middle" fontSize={150} fontWeight={900} fill={beat === 3 ? '#64748b' : '#fde68a'}>
                    中
                </text>
            </motion.g>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                    {Array.from({ length: 16 }, (_, i) => {
                        const a = (i / 16) * Math.PI * 2;
                        return (
                            <motion.line
                                key={i}
                                x1={800 + Math.cos(a) * 150}
                                y1={470 + Math.sin(a) * 150}
                                stroke={GULL}
                                strokeWidth={10}
                                strokeLinecap="round"
                                initial={{ x2: 800 + Math.cos(a) * 150, y2: 470 + Math.sin(a) * 150 }}
                                animate={{ x2: 800 + Math.cos(a) * 280, y2: 470 + Math.sin(a) * 280 }}
                                transition={{ delay: 0.6 + i * 0.05, duration: 0.8 }}
                            />
                        );
                    })}
                </motion.g>
            )}
        </>
    );
}
