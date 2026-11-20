import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Bjørnen og jegerne, tegnet i 2D. «ord»: bjørnen forstår vanlig prat, men ikke noaord.
 * «lov»: offeret til jaktguden, noaiden og unnskyldningen. «maltid»: seremoniene etter
 * jakten og beina som legges til side. «gjeld»: kretsløpet der et liv skaper en gjeld som
 * betales tilbake, til bjørnen kan komme igjen.
 */

type Modus = 'ord' | 'lov' | 'maltid' | 'gjeld';

const B = 1600;
const H = 900;
const BAKKE = 770;

const OVERSKRIFTER: Record<Modus, string[]> = {
    ord: [
        'Et hellig dyr',
        'Bjørnen forsto vanlig prat',
        'Men ikke omskrivninger',
        'Noaord: erstatningsord',
        'áddjá = bestefar',
    ],
    lov: [
        'Først en gave',
        'Offeret tar beskyttelsen bort',
        'Noaiden er med',
        'Unnskyld',
        'Noen man skyldte noe',
    ],
    maltid: ['Seremonier for huden og kjøttet', 'Et rituelt måltid', 'Beina legges til side'],
    gjeld: [
        'Å ta et liv skapte en gjeld',
        'Betalt med ord og unnskyldning',
        'Med et måltid som fulgte regler',
        'Og med beina tilbake i fjellet',
    ],
};

/** Bjørnen fra siden, med snuten mot venstre. Origo er mellom føttene. */
function Bjorn({
    x,
    y,
    s = 1,
    farge = '#7c4a1e',
    opacity = 1,
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
    opacity?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
            {[-95, -45, 75, 125].map((lx) => (
                <rect key={lx} x={lx} y={-95} width={42} height={95} rx={16} fill={farge} />
            ))}
            <ellipse cx={30} cy={-112} rx={145} ry={80} fill={farge} />
            <circle cx={-45} cy={-150} r={62} fill={farge} />
            <circle cx={-128} cy={-196} r={17} fill={farge} />
            <circle cx={-158} cy={-190} r={15} fill={farge} />
            <circle cx={-145} cy={-150} r={50} fill={farge} />
            <ellipse cx={-196} cy={-136} rx={36} ry={25} fill="#a16b3c" />
            <circle cx={-228} cy={-142} r={9} fill="#1c1917" />
            <circle cx={-160} cy={-162} r={6} fill="#1c1917" />
        </g>
    );
}

/** En jeger i kofte. Origo er mellom føttene. */
function Jeger({
    x,
    y,
    farge = '#1d4ed8',
    tromme = false,
}: {
    x: number;
    y: number;
    farge?: string;
    tromme?: boolean;
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-26} y={-70} width={20} height={70} rx={8} fill="#3f2a1a" />
            <rect x={6} y={-70} width={20} height={70} rx={8} fill="#3f2a1a" />
            <path d="M -48 -60 L -34 -190 L 34 -190 L 48 -60 Z" fill={farge} />
            <rect x={-48} y={-72} width={96} height={12} fill="#dc2626" />
            <rect x={-48} y={-84} width={96} height={8} fill="#facc15" />
            <circle cx={0} cy={-222} r={32} fill="#e7c3a0" />
            <path d="M -34 -232 Q 0 -280 34 -232 Z" fill="#dc2626" />
            {tromme && (
                <g transform="translate(52 -140)">
                    <ellipse rx={34} ry={44} fill="#e9cf9f" stroke="#7c4a1e" strokeWidth={5} />
                    <path d="M -20 0 L 20 0 M 0 -28 L 0 28" stroke="#9a3412" strokeWidth={4} />
                </g>
            )}
        </g>
    );
}

/** Snakkeboble. Bredden måles ut fra teksten, så den aldri flyter ut. */
function Boble({
    x,
    y,
    tekst,
    fs = 52,
    halX,
    farge = '#ffffff',
    tekstFarge = '#0f172a',
}: {
    x: number;
    y: number;
    tekst: string;
    fs?: number;
    halX?: number;
    farge?: string;
    tekstFarge?: string;
}) {
    const w = tekst.length * fs * 0.6 + 80;
    const h = fs + 50;
    const mal = halX ?? x;
    // Halen starter i bunnen av bobla, så nær den som snakker som mulig, og peker ned mot hen.
    const bx = Math.max(x - w / 2 + h / 2, Math.min(x + w / 2 - h / 2, mal));
    return (
        <g>
            <path
                d={`M ${bx - 20} ${y + h / 2 - 12} L ${mal} ${y + h / 2 + 56} L ${bx + 22} ${y + h / 2 - 12} Z`}
                fill={farge}
                stroke="#334155"
                strokeWidth={4}
                strokeLinejoin="round"
            />
            <rect
                x={x - w / 2}
                y={y - h / 2}
                width={w}
                height={h}
                rx={h / 2}
                fill={farge}
                stroke="#334155"
                strokeWidth={4}
            />
            <text
                x={x}
                y={y + fs * 0.35}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={900}
                fill={tekstFarge}
            >
                {tekst}
            </text>
        </g>
    );
}

/** En liten boble med tre prikker: et av mange erstatningsord. */
function TomBoble({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect
                x={x - 55}
                y={y - 30}
                width={110}
                height={60}
                rx={30}
                fill="#ffffff"
                stroke="#334155"
                strokeWidth={4}
            />
            {[-24, 0, 24].map((d) => (
                <circle key={d} cx={x + d} cy={y} r={7} fill="#334155" />
            ))}
        </g>
    );
}

function Merke({
    x,
    y,
    tekst,
    fs = 40,
    anker = 'middle',
    farge = '#0f172a',
}: {
    x: number;
    y: number;
    tekst: string;
    fs?: number;
    anker?: 'start' | 'middle' | 'end';
    farge?: string;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={fs}
            fontWeight={900}
            fill={farge}
            stroke="#fff"
            strokeWidth={9}
            paintOrder="stroke"
        >
            {tekst}
        </text>
    );
}

function Inn({
    children,
    forsinkelse = 0,
    playing,
    til = 1,
}: {
    children: React.ReactNode;
    forsinkelse?: number;
    playing: boolean;
    til?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: til }}
            transition={{ duration: playing ? 0.6 : 0, delay: playing ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

function Tegn({ x, y, tegn, farge }: { x: number; y: number; tegn: string; farge: string }) {
    return (
        <g>
            <circle cx={x} cy={y} r={46} fill={farge} stroke="#fff" strokeWidth={6} />
            <text x={x} y={y + 22} textAnchor="middle" fontSize={64} fontWeight={900} fill="#fff">
                {tegn}
            </text>
        </g>
    );
}

/** Landskapet bak: lia, bjørkeskog og fjell. */
function Lia({ kveld = false }: { kveld?: boolean }) {
    return (
        <>
            <rect width={B} height={H} fill={kveld ? '#3b3350' : '#cfe0ea'} />
            <path
                d="M 0 520 L 260 300 L 470 450 L 760 230 L 1040 430 L 1300 280 L 1600 470 L 1600 900 L 0 900 Z"
                fill={kveld ? '#4b4466' : '#9aa9b3'}
            />
            <path d="M 600 300 L 760 230 L 900 310 L 820 300 L 760 280 Z" fill="#f1f5f9" />
            <path
                d={`M 0 ${BAKKE - 60} Q 400 ${BAKKE - 110} 800 ${BAKKE - 70} T 1600 ${BAKKE - 80} L 1600 900 L 0 900 Z`}
                fill={kveld ? '#5b5a3c' : '#a38a4f'}
            />
            <rect y={BAKKE} width={B} height={H - BAKKE} fill={kveld ? '#4a4a30' : '#8a7a40'} />
            {[90, 180, 1480, 1540].map((bx, i) => (
                <g key={bx} transform={`translate(${bx} ${BAKKE - 70 + (i % 2) * 20})`}>
                    <rect x={-5} y={-150} width={10} height={150} fill="#e7e5e4" />
                    <ellipse
                        cx={0}
                        cy={-170}
                        rx={46}
                        ry={70}
                        fill={kveld ? '#7c5a1e' : '#d97706'}
                    />
                </g>
            ))}
        </>
    );
}

function Ord({ beat, playing }: { beat: number; playing: boolean }) {
    const forstar = beat === 1;
    const skjonner = beat >= 2;
    return (
        <>
            <Lia />
            {beat === 0 && (
                <Inn playing={playing} forsinkelse={0.4}>
                    <ellipse
                        cx={1150}
                        cy={BAKKE - 150}
                        rx={330}
                        ry={200}
                        fill="#fde68a"
                        opacity={0.7}
                    />
                </Inn>
            )}
            <Bjorn x={1180} y={BAKKE} s={1.3} />
            <Jeger x={250} y={BAKKE} />
            <Jeger x={400} y={BAKKE} farge="#047857" />
            {forstar && (
                <>
                    <Inn playing={playing} forsinkelse={0.3}>
                        <Boble x={560} y={330} tekst="guovža" halX={430} />
                        <Merke x={560} y={460} tekst="= bjørn" fs={40} />
                    </Inn>
                    <Inn playing={playing} forsinkelse={1.4}>
                        <Tegn x={1010} y={360} tegn="!" farge="#16a34a" />
                        <Merke x={1080} y={300} tekst="skjønner det" anker="start" />
                    </Inn>
                </>
            )}
            {beat === 2 && (
                <Inn playing={playing} forsinkelse={0.3}>
                    <Boble x={560} y={330} tekst="« ... »" halX={430} />
                    <Merke x={560} y={460} tekst="beskriver, sier ikke navnet" fs={36} />
                </Inn>
            )}
            {beat === 3 &&
                Array.from({ length: 16 }, (_, i) => {
                    const a = (i / 16) * Math.PI * 2;
                    return (
                        <Inn key={i} playing={playing} forsinkelse={0.2 + i * 0.12} til={0.9}>
                            <TomBoble
                                x={560 + Math.cos(a) * (190 + (i % 3) * 45)}
                                y={300 + Math.sin(a) * (95 + (i % 2) * 30)}
                            />
                        </Inn>
                    );
                })}
            {beat >= 4 && (
                <Inn playing={playing} forsinkelse={0.3}>
                    <Boble x={560} y={330} tekst="áddjá" halX={430} fs={64} />
                    <Merke x={560} y={480} tekst="= bestefar" fs={48} farge="#9a3412" />
                </Inn>
            )}
            {skjonner && (
                <Inn playing={playing} forsinkelse={beat === 2 ? 1.4 : 0}>
                    <Tegn x={1010} y={360} tegn="?" farge="#dc2626" />
                </Inn>
            )}
        </>
    );
}

function Lov({ beat, playing }: { beat: number; playing: boolean }) {
    const dur = (s: number) => (playing ? s : 0);
    return (
        <>
            <Lia />
            {/* Offerstedet: en stein med gavene */}
            <g transform={`translate(720 ${BAKKE})`}>
                <path d="M -90 0 Q -100 -110 -20 -130 Q 70 -140 90 -40 L 95 0 Z" fill="#78716c" />
                <Inn playing={playing} forsinkelse={0.5}>
                    <circle cx={-30} cy={-140} r={16} fill="#f59e0b" />
                    <rect x={0} y={-160} width={44} height={26} rx={6} fill="#b45309" />
                    <path d="M -70 -128 l 26 -14 l 6 14 Z" fill="#e9cf9f" />
                </Inn>
                <Merke x={0} y={60} tekst="gave til Leaibolmmái" fs={34} />
            </g>
            <Bjorn x={1260} y={BAKKE} s={1.15} />
            {/* Gudens beskyttelse rundt bjørnen. Offeret tar den bort. */}
            {beat === 1 && (
                <>
                    <motion.path
                        d={`M 960 ${BAKKE} A 300 290 0 0 1 1560 ${BAKKE}`}
                        fill="#fde68a"
                        fillOpacity={0.35}
                        stroke="#ca8a04"
                        strokeWidth={10}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: dur(0.8), delay: dur(0.3) }}
                    />
                    {/* Gaven går fra steinen til skjoldet og tar det bort */}
                    <motion.path
                        d={`M 760 ${BAKKE - 170} Q 860 ${BAKKE - 340} 990 ${BAKKE - 210}`}
                        fill="none"
                        stroke="#ca8a04"
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: playing ? 0 : 1 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: dur(1.2), delay: dur(2) }}
                    />
                    <Inn playing={playing} forsinkelse={3}>
                        <Tegn x={1000} y={BAKKE - 230} tegn="×" farge="#dc2626" />
                    </Inn>
                </>
            )}
            {beat === 1 && (
                <Merke
                    x={1260}
                    y={BAKKE - 330}
                    tekst="gudens beskyttelse"
                    fs={40}
                    farge="#854d0e"
                />
            )}
            <Jeger x={260} y={BAKKE} />
            <Jeger x={400} y={BAKKE} farge="#047857" />
            {beat >= 2 && (
                <Inn playing={playing} forsinkelse={0.4}>
                    <Jeger x={120} y={BAKKE} farge="#7c3aed" tromme />
                    <Merke x={130} y={BAKKE - 300} tekst="noaiden" fs={40} />
                </Inn>
            )}
            {beat === 3 && (
                <Inn playing={playing} forsinkelse={0.3}>
                    <Boble x={700} y={330} tekst="Unnskyld" halX={450} fs={56} />
                </Inn>
            )}
            {beat >= 4 && (
                <Inn playing={playing} forsinkelse={0.3}>
                    <path
                        d={`M 470 ${BAKKE - 260} Q 820 ${BAKKE - 520} 1130 ${BAKKE - 260}`}
                        fill="none"
                        stroke="#9a3412"
                        strokeWidth={8}
                        strokeDasharray="18 14"
                    />
                    <Merke
                        x={800}
                        y={BAKKE - 420}
                        tekst="møtte noen, skyldte noe"
                        fs={42}
                        farge="#9a3412"
                    />
                </Inn>
            )}
        </>
    );
}

function Flammer({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -60 0 C -70 -60 -20 -80 0 -150 C 20 -80 70 -60 60 0 Z" fill="#f97316" />
            <path d="M -30 0 C -34 -40 -8 -50 0 -90 C 8 -50 34 -40 30 0 Z" fill="#fde047" />
        </g>
    );
}

function Maltid({ beat, playing }: { beat: number; playing: boolean }) {
    const ILD = 800;
    return (
        <>
            <Lia kveld />
            <ellipse cx={ILD} cy={BAKKE + 10} rx={360} ry={60} fill="#f59e0b" opacity={0.18} />
            <Flammer x={ILD} y={BAKKE} />
            <path
                d={`M ${ILD - 90} ${BAKKE - 250} L ${ILD} ${BAKKE - 300} L ${ILD + 90} ${BAKKE - 250}`}
                stroke="#1c1917"
                strokeWidth={6}
                fill="none"
            />
            <path
                d={`M ${ILD - 70} ${BAKKE - 210} Q ${ILD} ${BAKKE - 120} ${ILD + 70} ${BAKKE - 210} Z`}
                fill="#292524"
            />
            <line
                x1={ILD}
                y1={BAKKE - 300}
                x2={ILD}
                y2={BAKKE - 210}
                stroke="#1c1917"
                strokeWidth={5}
            />
            {beat >= 1 && (
                <Inn playing={playing} forsinkelse={0.3}>
                    <Jeger x={ILD - 360} y={BAKKE} />
                    <Jeger x={ILD - 210} y={BAKKE + 30} farge="#047857" />
                    <Jeger x={ILD + 210} y={BAKKE + 30} farge="#7c3aed" />
                    <Jeger x={ILD + 360} y={BAKKE} farge="#b45309" />
                </Inn>
            )}
            {beat === 1 && (
                <Inn playing={playing} forsinkelse={1.2}>
                    <rect
                        x={ILD - 230}
                        y={205}
                        width={460}
                        height={90}
                        rx={22}
                        fill="#fff7ed"
                        stroke="#9a3412"
                        strokeWidth={5}
                    />
                    <text
                        x={ILD}
                        y={265}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill="#9a3412"
                    >
                        faste regler
                    </text>
                </Inn>
            )}
            {beat === 0 && (
                <>
                    <Inn playing={playing} forsinkelse={0.4}>
                        <g transform={`translate(330 330)`}>
                            <path
                                d="M -120 -90 Q -60 -60 0 -100 Q 60 -60 120 -90 Q 90 0 120 90 Q 60 60 0 100 Q -60 60 -120 90 Q -90 0 -120 -90 Z"
                                fill="#92400e"
                                stroke="#451a03"
                                strokeWidth={6}
                            />
                        </g>
                        <Merke x={330} y={500} tekst="huden" fs={48} />
                    </Inn>
                    <Inn playing={playing} forsinkelse={1.6}>
                        <g transform={`translate(1270 330)`}>
                            <path
                                d="M -110 -50 L 110 -50 Q 100 90 0 100 Q -100 90 -110 -50 Z"
                                fill="#44403c"
                            />
                            <rect x={-125} y={-66} width={250} height={22} rx={10} fill="#57534e" />
                        </g>
                        <Merke x={1270} y={500} tekst="kjøttet" fs={48} />
                    </Inn>
                </>
            )}
            {beat >= 2 && (
                <>
                    <Inn playing={playing} forsinkelse={0.4}>
                        <g transform={`translate(1330 ${BAKKE - 20})`}>
                            <rect x={-150} y={-14} width={300} height={22} rx={10} fill="#a16207" />
                            {[-110, -60, -10, 40, 90].map((bx, i) => (
                                <g
                                    key={bx}
                                    transform={`translate(${bx} ${-40 - (i % 2) * 18}) rotate(${-10 + i * 6})`}
                                >
                                    <rect
                                        x={-8}
                                        y={-50}
                                        width={16}
                                        height={100}
                                        rx={8}
                                        fill="#f5f5f4"
                                    />
                                    <circle cx={-8} cy={-50} r={12} fill="#f5f5f4" />
                                    <circle cx={8} cy={-50} r={12} fill="#f5f5f4" />
                                    <circle cx={-8} cy={50} r={12} fill="#f5f5f4" />
                                    <circle cx={8} cy={50} r={12} fill="#f5f5f4" />
                                </g>
                            ))}
                        </g>
                        <Merke x={1330} y={BAKKE - 200} tekst="beina" fs={48} />
                    </Inn>
                    <Inn playing={playing} forsinkelse={1.8}>
                        <path
                            d="M 1330 400 Q 1330 250 1480 230"
                            fill="none"
                            stroke="#fde68a"
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <path d="M 1470 205 L 1510 228 L 1475 258 Z" fill="#fde68a" />
                        <Merke x={1300} y={190} tekst="tilbake til ura" fs={44} anker="middle" />
                    </Inn>
                </>
            )}
        </>
    );
}

const STASJONER = [
    { tekst: 'Et liv blir tatt', vinkel: -90 },
    { tekst: 'Ord og unnskyldning', vinkel: 0 },
    { tekst: 'Måltid med regler', vinkel: 90 },
    { tekst: 'Beina tilbake', vinkel: 180 },
];

function Gjeld({ beat, playing }: { beat: number; playing: boolean }) {
    const cx = 800;
    const cy = 500;
    const r = 290;
    const pt = (v: number, rr = r) => [
        cx + Math.cos((v * Math.PI) / 180) * rr * 1.75,
        cy + Math.sin((v * Math.PI) / 180) * rr,
    ];
    const bue = (fra: number, til: number) => {
        const [x1, y1] = pt(fra + 22);
        const [x2, y2] = pt(til - 22);
        return `M ${x1} ${y1} A ${r * 1.75} ${r} 0 0 1 ${x2} ${y2}`;
    };
    return (
        <>
            <rect width={B} height={H} fill="#f5efe3" />
            {STASJONER.map((s, i) => {
                if (i > beat) return null;
                const neste = STASJONER[(i + 1) % STASJONER.length].vinkel;
                const til = i === 3 ? 270 : neste;
                const visBue = i < beat || (beat === 3 && i === 3);
                return (
                    <g key={`b${i}`}>
                        {visBue && (
                            <motion.path
                                d={bue(s.vinkel, til)}
                                fill="none"
                                stroke={i === 3 ? '#0d9488' : '#9a3412'}
                                strokeWidth={10}
                                strokeLinecap="round"
                                initial={{ pathLength: i === beat || i === beat - 1 ? 0 : 1 }}
                                animate={{ pathLength: 1 }}
                                transition={{
                                    duration: playing ? 1.4 : 0,
                                    delay: playing ? 0.2 + (i === 3 ? 1.6 : 0) : 0,
                                }}
                            />
                        )}
                    </g>
                );
            })}
            {STASJONER.map((s, i) => {
                if (i > beat) return null;
                const [x, y] = pt(s.vinkel);
                const w = s.tekst.length * 42 * 0.6 + 70;
                const aktiv = i === beat;
                return (
                    <Inn key={s.tekst} playing={playing} forsinkelse={i === beat ? 0.3 : 0}>
                        <rect
                            x={x - w / 2}
                            y={y - 50}
                            width={w}
                            height={100}
                            rx={24}
                            fill={aktiv ? '#9a3412' : '#ffffff'}
                            stroke="#9a3412"
                            strokeWidth={5}
                        />
                        <text
                            x={x}
                            y={y + 16}
                            textAnchor="middle"
                            fontSize={42}
                            fontWeight={900}
                            fill={aktiv ? '#ffffff' : '#9a3412'}
                        >
                            {s.tekst}
                        </text>
                    </Inn>
                );
            })}
            {/* I midten: bjørnen. Gjelden står over den til den er betalt. */}
            <Bjorn x={cx + 40} y={cy + 110} s={0.6} farge={beat >= 3 ? '#a16b3c' : '#7c4a1e'} />
            {beat < 3 && <Merke x={cx} y={cy - 70} tekst="= en gjeld" fs={52} farge="#9a3412" />}
            {beat >= 3 && (
                <Inn playing={playing} forsinkelse={2.6}>
                    <Merke x={cx} y={cy - 70} tekst="skulle komme igjen" fs={52} farge="#0d9488" />
                </Inn>
            )}
        </>
    );
}

export function BjornegravenOrd({ beat, playing, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'ord';
    const liste = OVERSKRIFTER[modus];
    const overskrift = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid slice"
            >
                {modus === 'ord' && <Ord beat={beat} playing={playing} />}
                {modus === 'lov' && <Lov beat={beat} playing={playing} />}
                {modus === 'maltid' && <Maltid beat={beat} playing={playing} />}
                {modus === 'gjeld' && <Gjeld beat={beat} playing={playing} />}
            </svg>
            <div className="absolute inset-x-0 top-[4%] flex justify-center pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-4xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                </AnimatePresence>
            </div>
            {modus === 'ord' && beat === 3 && (
                <div className="absolute bottom-[8%] right-[5%]">
                    <Teller
                        verdi={20}
                        etikett="navn som beskriver bjørnen"
                        prefiks="ca. "
                        forsinkelse={playing ? 0.8 : 0}
                    />
                </div>
            )}
        </div>
    );
}
