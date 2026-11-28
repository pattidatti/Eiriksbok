import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Cpu, Smartphone, Tablet } from 'lucide-react';
import type { VisualProps } from '../../types';
import { KINA_RØD, USA_BLÅ } from './felles3d';
import { Overskrift } from './overskrift';

/**
 * Tolltrappa mellom USA og Kina, i SVG (1600x900).
 * - «2018»: to spor, USA øverst og Kina nederst. Trekk og mottrekk fra 2018 og under Biden.
 * - «2025»: tollen klatrer som en trapp, til 145 og 125 prosent.
 * - «pause»: tollen faller i mai, ny trussel i oktober, og pausen etter Sør-Korea.
 *
 * Bare tallene som står i artikkelen, skrives. Trinnene uten tall er en skisse, og det står
 * i bildet.
 */

type Modus = '2018' | '2025' | 'pause';

const B = 1600;
const H = 900;

const TITLER: Record<Modus, string[]> = {
    '2018': [
        '2018: Trump setter opp tollen',
        'Målet: beskytte bedriftene',
        'Kina svarer',
        'Joe Biden blir president',
        'Biden går et skritt videre',
    ],
    '2025': [
        '2025: Trump er tilbake',
        'Februar, mars og 2. april',
        'Kina svarer, igjen og igjen',
        'Etter noen dager',
        'Nesten umulig å handle',
        'Noen varer slapp unna',
    ],
    pause: ['Pause etter Sør-Korea', 'En pause er ikke fred', 'Grunnene er der fortsatt', 'Nye trusler kommer og går'],
};

export function UsaKinaStige({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? '2018';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f1f5f9]">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    {[
                        ['rod', KINA_RØD],
                        ['bla', USA_BLÅ],
                    ].map(([id, f]) => (
                        <marker key={id} id={`us-pil-${id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill={f} />
                        </marker>
                    ))}
                </defs>
                {modus === '2018' && <Spor beat={beat} />}
                {modus === '2025' && <Trapp beat={beat} />}
                {modus === 'pause' && <Pause beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <Overskrift key={tittel} tekst={tittel} />
            </AnimatePresence>
        </div>
    );
}

function Inn({ children, delay = 0.3 }: { children: React.ReactNode; delay?: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay, duration: 0.6 }}>
            {children}
        </motion.g>
    );
}

/* ---------------- 2018: to spor ---------------- */

const USA_Y = 300;
const KINA_Y = 640;

function Kort({ x, y, b, farge, topp, tekst }: { x: number; y: number; b: number; farge: string; topp: string; tekst: string }) {
    return (
        <g>
            <rect x={x} y={y - 70} width={b} height={140} rx={24} fill="#fff" stroke={farge} strokeWidth={6} />
            <text x={x + 28} y={y - 18} fontSize={30} fontWeight={800} fill={farge}>
                {topp}
            </text>
            <text x={x + 28} y={y + 36} fontSize={40} fontWeight={900} fill="#0f172a">
                {tekst}
            </text>
        </g>
    );
}

function Spor({ beat }: { beat: number }) {
    return (
        <>
            {/* Sporene */}
            <rect x={40} y={USA_Y - 90} width={B - 80} height={180} rx={30} fill="#dbeafe" />
            <rect x={40} y={KINA_Y - 90} width={B - 80} height={180} rx={30} fill="#fee2e2" />
            <text x={80} y={USA_Y + 18} fontSize={52} fontWeight={900} fill={USA_BLÅ}>
                USA
            </text>
            <text x={80} y={KINA_Y + 18} fontSize={52} fontWeight={900} fill={KINA_RØD}>
                KINA
            </text>
            {/* Tida går mot høyre */}
            <path d={`M 260 ${H - 70} H ${B - 80}`} stroke="#94a3b8" strokeWidth={6} markerEnd="url(#us-pil-bla)" />
            <text x={260} y={H - 30} fontSize={34} fontWeight={800} fill="#475569">
                2018
            </text>

            <Inn>
                <Kort x={250} y={USA_Y} b={480} farge={USA_BLÅ} topp="2018: Trump" tekst="høyere toll på Kina" />
                <path d={`M 560 ${USA_Y + 75} L 560 ${KINA_Y - 100}`} stroke={USA_BLÅ} strokeWidth={10} markerEnd="url(#us-pil-bla)" />
            </Inn>
            {beat >= 1 && (
                <Inn>
                    <rect x={200} y={USA_Y + 110} width={340} height={110} rx={18} fill={USA_BLÅ} />
                    <text x={370} y={USA_Y + 155} textAnchor="middle" fontSize={28} fontWeight={800} fill="#fff">
                        Mål: beskytte bedrifter
                    </text>
                    <text x={370} y={USA_Y + 195} textAnchor="middle" fontSize={28} fontWeight={800} fill="#fff">
                        og skape jobber
                    </text>
                </Inn>
            )}
            {beat >= 2 && (
                <Inn>
                    <Kort x={620} y={KINA_Y} b={440} farge={KINA_RØD} topp="Kina svarer" tekst="høyere toll på USA" />
                    <path d={`M 900 ${KINA_Y - 75} L 900 ${USA_Y + 100}`} stroke={KINA_RØD} strokeWidth={10} markerEnd="url(#us-pil-rod)" />
                </Inn>
            )}
            {beat >= 3 && (
                <Inn>
                    <Kort x={960} y={USA_Y} b={290} farge={USA_BLÅ} topp="Biden" tekst="beholder" />
                </Inn>
            )}
            {beat >= 4 && (
                <Inn>
                    <Kort x={1280} y={USA_Y} b={260} farge={USA_BLÅ} topp="Biden" tekst="stopper" />
                    <path d={`M 1410 ${USA_Y + 75} L 1410 ${KINA_Y - 110}`} stroke={USA_BLÅ} strokeWidth={10} />
                    <circle cx={1410} cy={KINA_Y} r={80} fill="#fff" stroke={USA_BLÅ} strokeWidth={6} />
                    <Cpu x={1360} y={KINA_Y - 50} width={100} height={100} color="#334155" />
                    <Ban x={1340} y={KINA_Y - 70} width={140} height={140} color={KINA_RØD} />
                    <text x={1540} y={KINA_Y + 125} textAnchor="end" fontSize={32} fontWeight={900} fill="#0f172a">
                        de mest avanserte brikkene
                    </text>
                </Inn>
            )}
        </>
    );
}

/* ---------------- 2025: trappa ---------------- */

const NULL_Y = 780;
const PER = 3.8; // px per prosent
const y = (p: number) => NULL_Y - p * PER;

/** Trinnene uten tall er en skisse. Bare 34, 125 og 145 er tall fra artikkelen. */
const USA_TRINN = [
    [[230, 16], [400, 16]],
    [[400, 22], [580, 22], [580, 32], [760, 32], [760, 66], [930, 66]],
    [[930, 116], [1090, 116], [1090, 137], [1240, 137]],
    [[1240, 145], [1420, 145]],
] as const;
const KINA_TRINN = [
    [[230, 12], [880, 12]],
    [],
    [[880, 34], [1010, 34], [1010, 84], [1180, 84]],
    [[1180, 125], [1420, 125]],
] as const;

function sti(trinn: readonly (readonly [number, number])[], fra?: readonly [number, number]) {
    const punkter = fra ? [fra, ...trinn] : trinn;
    return punkter.map(([x, p], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y(p)}`).join(' ');
}

function Linje({ farge, trinn }: { farge: string; trinn: readonly (readonly (readonly [number, number])[])[] }) {
    return (
        <>
            {trinn.map((del, i) => {
                if (del.length === 0) return null;
                const forrige = trinn
                    .slice(0, i)
                    .reverse()
                    .find((d) => d.length > 0);
                const fra = forrige ? forrige[forrige.length - 1] : undefined;
                return (
                    <motion.path
                        key={i}
                        d={sti(del, fra)}
                        fill="none"
                        stroke={farge}
                        strokeWidth={12}
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.4, delay: 0.3 }}
                    />
                );
            })}
        </>
    );
}

function Akse() {
    return (
        <g>
            <path d={`M 230 ${y(0)} H 1450`} stroke="#94a3b8" strokeWidth={4} />
            <text x={1460} y={y(0) + 12} fontSize={30} fontWeight={700} fill="#64748b">
                0 %
            </text>
            <text x={60} y={y(150) - 10} fontSize={30} fontWeight={800} fill="#475569">
                toll
            </text>
        </g>
    );
}

function Trapp({ beat }: { beat: number }) {
    const fase = Math.min(beat, 3);
    return (
        <>
            <Akse />
            <Linje farge={USA_BLÅ} trinn={USA_TRINN.slice(0, fase + 1)} />
            <Linje farge={KINA_RØD} trinn={KINA_TRINN.slice(0, fase + 1)} />
            <text x={60} y={y(16) - 20} fontSize={32} fontWeight={900} fill={USA_BLÅ}>
                USA
            </text>
            <text x={60} y={y(12) + 46} fontSize={32} fontWeight={900} fill={KINA_RØD}>
                Kina
            </text>
            {beat >= 1 &&
                [
                    [400, 'februar'],
                    [580, 'mars'],
                    [760, '2. april'],
                ].map(([x, t]) => (
                    <Inn key={t} delay={0.6}>
                        <text x={x as number} y={y(0) + 50} textAnchor="middle" fontSize={30} fontWeight={800} fill="#334155">
                            {t}
                        </text>
                    </Inn>
                ))}
            {beat >= 2 && (
                <Inn delay={1.2}>
                    <rect x={790} y={y(34) - 4} width={160} height={66} rx={14} fill={KINA_RØD} />
                    <text x={870} y={y(34) + 42} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                        34 %
                    </text>
                </Inn>
            )}
            {beat >= 3 && (
                <>
                    <Inn delay={1.4}>
                        <text x={1430} y={y(145) - 24} textAnchor="end" fontSize={60} fontWeight={900} fill={USA_BLÅ}>
                            145 %
                        </text>
                        <text x={1430} y={y(125) + 70} textAnchor="end" fontSize={60} fontWeight={900} fill={KINA_RØD}>
                            125 %
                        </text>
                    </Inn>
                    <Inn delay={0.6}>
                        <text x={1240} y={y(0) + 50} textAnchor="middle" fontSize={30} fontWeight={800} fill="#334155">
                            noen dager senere
                        </text>
                    </Inn>
                </>
            )}
            <text x={B - 40} y={H - 24} textAnchor="end" fontSize={32} fontWeight={700} fill="#475569">
                Skisse: bare tallene som er skrevet, er ekte
            </text>
            {beat === 4 && (
                <Inn delay={0.4}>
                    <g>
                        <rect x={230} y={180} width={670} height={250} rx={30} fill="#fff" stroke="#cbd5e1" strokeWidth={4} />
                    </g>
                    <text x={260} y={238} fontSize={30} fontWeight={800} fill="#334155">
                        En vare til 100 kroner, med 145 % toll:
                    </text>
                    <g>
                        <rect x={260} y={280} width={120} height={100} rx={14} fill="#94a3b8" />
                        <text x={320} y={345} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                            100
                        </text>
                    </g>
                    <g>
                        <motion.rect x={384} y={280} height={100} rx={14} fill={USA_BLÅ} initial={{ width: 0 }} animate={{ width: 174 }} transition={{ duration: 1, delay: 0.8 }} />
                        <text x={471} y={345} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                            + 145
                        </text>
                    </g>
                    <Inn delay={1.8}>
                        <text x={580} y={350} fontSize={64} fontWeight={900} fill="#0f172a">
                            = 245 kr
                        </text>
                    </Inn>
                </Inn>
            )}
            {beat >= 5 && (
                <Inn delay={0.4}>
                    <rect x={230} y={180} width={670} height={250} rx={30} fill="#fff" stroke={USA_BLÅ} strokeWidth={5} />
                    <Smartphone x={250} y={200} width={80} height={80} color="#334155" />
                    <Tablet x={320} y={200} width={80} height={80} color="#334155" />
                    <text x={420} y={255} fontSize={40} fontWeight={900} fill="#0f172a">
                        Mobiler og nettbrett
                    </text>
                    <text x={260} y={330} fontSize={28} fontWeight={700} fill="#475569">
                        laget i Kina for amerikanske selskaper
                    </text>
                    <text x={260} y={395} fontSize={38} fontWeight={900} fill={USA_BLÅ}>
                        slapp unna den høyeste tollen
                    </text>
                </Inn>
            )}
        </>
    );
}

/* ---------------- Pause ---------------- */

const APRIL = 330;
const MAI = 560;
const OKT = 1020;
const PAUSE = 1180;

function Pause({ beat }: { beat: number }) {
    const usa = `M 230 ${y(145)} H ${MAI} V ${y(30)} H ${PAUSE}`;
    const kina = `M 230 ${y(125)} H ${MAI} V ${y(10)} H ${PAUSE}`;
    return (
        <>
            <Akse />
            <path d={usa} fill="none" stroke={USA_BLÅ} strokeWidth={12} strokeLinejoin="round" />
            <path d={kina} fill="none" stroke={KINA_RØD} strokeWidth={12} strokeLinejoin="round" />
            <text x={250} y={y(145) - 20} fontSize={36} fontWeight={900} fill={USA_BLÅ}>
                USA 145 %
            </text>
            <text x={250} y={y(125) + 50} fontSize={36} fontWeight={900} fill={KINA_RØD}>
                Kina 125 %
            </text>
            <text x={MAI + 20} y={y(30) - 20} fontSize={36} fontWeight={900} fill={USA_BLÅ}>
                30 %
            </text>
            <text x={MAI + 20} y={y(10) - 18} fontSize={36} fontWeight={900} fill={KINA_RØD}>
                10 %
            </text>
            {[
                [APRIL, 'april'],
                [MAI, 'mai: Genève'],
                [OKT, 'oktober'],
                [PAUSE, '30. oktober'],
            ].map(([x, t]) => (
                <text key={t} x={x as number} y={y(0) + 50} textAnchor="middle" fontSize={30} fontWeight={800} fill="#334155">
                    {t}
                </text>
            ))}
            {/* Trusselen i oktober: stiplet, for tollen ble aldri innført */}
            {beat <= 1 && (
                <g>
                    <path d={`M ${OKT} ${y(30)} V ${y(100)}`} stroke={USA_BLÅ} strokeWidth={6} strokeDasharray="14 10" />
                    <text x={OKT} y={y(100) - 20} textAnchor="middle" fontSize={32} fontWeight={900} fill={USA_BLÅ}>
                        trussel: 100 %
                    </text>
                </g>
            )}
            {/* Pausen */}
            <rect x={PAUSE} y={y(150)} width={1450 - PAUSE} height={y(0) - y(150)} fill="#fde68a" opacity={0.55} />
            <text x={(PAUSE + 1450) / 2} y={y(140)} textAnchor="middle" fontSize={44} fontWeight={900} fill="#92400e">
                PAUSE
            </text>
            {beat >= 1 && (
                <Inn>
                    <text x={(PAUSE + 1450) / 2} y={y(70)} textAnchor="middle" fontSize={150} fontWeight={900} fill="#92400e" opacity={0.7}>
                        ?
                    </text>
                </Inn>
            )}
            {beat >= 2 &&
                ['Begge vil være størst', 'Begge vil ha den beste teknologien'].map((t, i) => (
                    <Inn key={t} delay={0.4 + i * 0.8}>
                        <rect x={590} y={300 + i * 90} width={540} height={74} rx={20} fill="#0f172a" />
                        <text x={860} y={347 + i * 90} textAnchor="middle" fontSize={28} fontWeight={900} fill="#fff">
                            {t}
                        </text>
                    </Inn>
                ))}
            {beat >= 3 && (
                <Inn delay={0.4}>
                    <rect x={590} y={480} width={540} height={100} rx={20} fill="#0f172a" />
                    <text x={860} y={522} textAnchor="middle" fontSize={28} fontWeight={900} fill="#fff">
                        Begge er redde for å bli for
                    </text>
                    <text x={860} y={560} textAnchor="middle" fontSize={28} fontWeight={900} fill="#fff">
                        avhengige av den andre
                    </text>
                </Inn>
            )}
            <text x={B - 40} y={H - 24} textAnchor="end" fontSize={26} fontWeight={700} fill="#64748b">
                Tollen fra april til oktober 2025
            </text>
        </>
    );
}
