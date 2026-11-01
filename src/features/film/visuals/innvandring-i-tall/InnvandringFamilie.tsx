import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Slektstreet som SSB-regelen leser.
 * «regel»: personen, foreldrene og de fire besteforeldrene blir farget én generasjon om
 * gangen, mens kravene krysses av i lista til høyre.
 * «grupper»: tre små familier som gir tre ulike svar: norskfødt med innvandrerforeldre,
 * ingen av gruppene, ikke innvandrer. Til slutt et norsk pass som ikke endrer noe.
 */

type Modus = 'regel' | 'grupper';

const B = 1600;
const H = 900;
const UTE = '#ea580c';
const NORGE = '#2563eb';
const UKJENT = '#cbd5e1';

type Farge = 'ute' | 'norge' | 'ukjent';
const FARGE: Record<Farge, string> = { ute: UTE, norge: NORGE, ukjent: UKJENT };

function Node({ x, y, farge, r = 58, demp = false }: { x: number; y: number; farge: Farge; r?: number; demp?: boolean }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: demp ? 0.45 : 1 }} transition={{ duration: 0.5 }}>
            <motion.circle
                cx={x}
                cy={y}
                r={r}
                initial={false}
                animate={{ fill: FARGE[farge] }}
                transition={{ duration: 0.6 }}
                stroke="#fff"
                strokeWidth={6}
            />
            <circle cx={x} cy={y - r * 0.28} r={r * 0.24} fill="#fff" />
            <path
                d={`M${x - r * 0.42},${y + r * 0.55} Q${x - r * 0.42},${y + r * 0.02} ${x},${y + r * 0.02} Q${x + r * 0.42},${y + r * 0.02} ${x + r * 0.42},${y + r * 0.55} Z`}
                fill="#fff"
            />
        </motion.g>
    );
}

function Linje({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
    const my = (y1 + y2) / 2;
    return (
        <motion.path
            d={`M${x1},${y1} L${x1},${my} L${x2},${my} L${x2},${y2}`}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={6}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        />
    );
}

function Etikett({
    x,
    y,
    tekst,
    farge = '#334155',
    anker = 'middle',
    storrelse = 34,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    storrelse?: number;
}) {
    return (
        <motion.text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={800}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            {tekst}
        </motion.text>
    );
}

function Forklaring() {
    return (
        <div className="absolute flex gap-6 text-slate-700 font-bold" style={{ left: '3%', bottom: '4%', fontSize: 20 }}>
            <span className="flex items-center gap-2">
                <span className="inline-block rounded-full" style={{ width: 20, height: 20, background: UTE }} />
                født i utlandet
            </span>
            <span className="flex items-center gap-2">
                <span className="inline-block rounded-full" style={{ width: 20, height: 20, background: NORGE }} />
                født i Norge
            </span>
        </div>
    );
}

const KRAV = [
    { tekst: 'Har selv flyttet til Norge', fraBeat: 2 },
    { tekst: 'Er født i utlandet', fraBeat: 2 },
    { tekst: 'Begge foreldrene født i utlandet', fraBeat: 3 },
    { tekst: 'Alle fire besteforeldrene født i utlandet', fraBeat: 4 },
];

const REGEL_TITLER = [
    'I hverdagen',
    'SSB trenger en presis regel',
    'Krav 1 og 2: personen',
    'Krav 3: foreldrene',
    'Krav 4: besteforeldrene',
    'Samme regel for alle',
];

function Regel({ beat }: { beat: number }) {
    const PX = 570;
    const py = 700;
    const foreldre = [410, 730];
    const beste = [330, 490, 650, 810];
    const fp: Farge = beat >= 2 ? 'ute' : 'ukjent';
    const ff: Farge = beat >= 3 ? 'ute' : 'ukjent';
    const fb: Farge = beat >= 4 ? 'ute' : 'ukjent';
    return (
        <>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {beat >= 1 && (
                    <>
                        {beste.map((x, i) => (
                            <Linje key={i} x1={x} y1={260} x2={foreldre[Math.floor(i / 2)]} y2={470} />
                        ))}
                        {foreldre.map((x) => (
                            <Linje key={x} x1={x} y1={470} x2={PX} y2={py} />
                        ))}
                        {beste.map((x) => (
                            <Node key={x} x={x} y={260} farge={fb} r={50} />
                        ))}
                        {foreldre.map((x) => (
                            <Node key={x} x={x} y={470} farge={ff} r={54} />
                        ))}
                        <Etikett x={36} y={270} tekst="Besteforeldre" anker="start" storrelse={30} />
                        <Etikett x={36} y={480} tekst="Foreldre" anker="start" storrelse={30} />
                    </>
                )}
                <Node x={PX} y={py} farge={beat === 0 ? 'ute' : fp} r={62} />
                {(beat === 0 || beat === 2) && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <path d={`M120,${py} L${PX - 90},${py}`} stroke="#0f172a" strokeWidth={10} strokeLinecap="round" />
                        <path d={`M${PX - 110},${py - 22} L${PX - 82},${py} L${PX - 110},${py + 22}`} fill="none" stroke="#0f172a" strokeWidth={10} strokeLinecap="round" />
                        <Etikett x={130} y={py - 30} tekst="flytter til Norge" anker="start" />
                    </motion.g>
                )}
                {beat >= 4 && (
                    <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}>
                        <rect x={PX + 85} y={py - 34} width={300} height={68} rx={16} fill="#0f172a" />
                        <text x={PX + 235} y={py + 13} textAnchor="middle" fontSize={36} fontWeight={900} fill="#fde68a">
                            = innvandrer
                        </text>
                    </motion.g>
                )}
            </svg>

            {beat >= 1 && beat <= 4 && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5"
                    style={{ right: '3%', top: '20%', width: '34%' }}
                >
                    <div className="text-slate-500 font-bold mb-3" style={{ fontSize: 20 }}>
                        SSB: alle fire krav må være oppfylt
                    </div>
                    {KRAV.map((k) => {
                        const ok = beat >= k.fraBeat;
                        return (
                            <div key={k.tekst} className="flex items-center gap-3 mb-3" style={{ fontSize: 22 }}>
                                <span
                                    className="inline-flex items-center justify-center rounded-lg font-black shrink-0"
                                    style={{
                                        width: 34,
                                        height: 34,
                                        background: ok ? '#16a34a' : '#e2e8f0',
                                        color: '#fff',
                                        fontSize: 22,
                                    }}
                                >
                                    {ok ? '✓' : ''}
                                </span>
                                <span className={ok ? 'text-slate-900 font-bold' : 'text-slate-400 font-semibold'}>{k.tekst}</span>
                            </div>
                        );
                    })}
                </motion.div>
            )}
            {beat >= 5 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5 flex flex-col gap-3"
                    style={{ right: '3%', top: '24%', width: '34%' }}
                >
                    <div className="text-slate-500 font-bold" style={{ fontSize: 22 }}>
                        Samme fire krav for
                    </div>
                    {['Arbeider fra Sverige', 'Flyktning fra Ukraina', 'Student fra Kina'].map((t) => (
                        <span key={t} className="rounded-xl bg-orange-100 text-orange-900 font-black px-4 py-2 whitespace-nowrap" style={{ fontSize: 28 }}>
                            {t}
                        </span>
                    ))}
                </motion.div>
            )}
            {beat === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-6 py-5 text-slate-900 font-black"
                    style={{ right: '6%', top: '34%', width: '36%', fontSize: 30 }}
                >
                    En som flytter til et annet land for å bo der
                </motion.div>
            )}
            {beat >= 2 && <Forklaring />}
        </>
    );
}

interface Familie {
    mor: Farge;
    far: Farge;
    barn: Farge;
    barnTekst: string;
    dom: string;
    under?: string;
    domFarge: string;
    pass?: boolean;
}

const FAMILIER: Familie[] = [
    { mor: 'ute', far: 'ute', barn: 'norge', barnTekst: 'født i Norge', dom: 'Egen gruppe', under: 'begge foreldrene innvandret', domFarge: NORGE },
    { mor: 'ute', far: 'ute', barn: 'norge', barnTekst: 'født i Norge', dom: 'Norskfødt med innvandrer­foreldre', under: 'har aldri innvandret selv', domFarge: NORGE },
    { mor: 'ute', far: 'norge', barn: 'norge', barnTekst: 'født i Norge', dom: 'Ingen av gruppene', under: 'ca. 234 200 personer i 2023', domFarge: '#475569' },
    { mor: 'norge', far: 'norge', barn: 'ute', barnTekst: 'født i utlandet', dom: 'Ikke innvandrer', under: 'foreldrene er norske', domFarge: '#475569' },
    { mor: 'ute', far: 'ute', barn: 'ute', barnTekst: 'flyttet hit', dom: 'Fortsatt innvandrer', under: 'statsborgerskap spiller ingen rolle', domFarge: UTE, pass: true },
    { mor: 'ute', far: 'ute', barn: 'ute', barnTekst: 'flyttet hit', dom: 'Bare hvor folk og familien deres er født', under: 'ikke hvem som er «norsk nok»', domFarge: '#0f172a', pass: true },
];

const GRUPPE_TITLER = [
    'Barna til innvandrere',
    'Norskfødte med innvandrerforeldre',
    'Født i Norge, én forelder fra utlandet',
    'Født i utlandet av norske foreldre',
    'Norsk pass?',
    'Regelen beskriver',
];

function Grupper({ beat }: { beat: number }) {
    const f = FAMILIER[Math.min(beat, FAMILIER.length - 1)];
    const foreldre: [number, Farge][] = [
        [380, f.mor],
        [760, f.far],
    ];
    const BX = 570;
    const BY = 640;
    return (
        <>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {foreldre.map(([x]) => (
                    <Linje key={x} x1={x} y1={330} x2={BX} y2={BY} />
                ))}
                {foreldre.map(([x, farge]) => (
                    <Node key={x} x={x} y={330} farge={farge} r={66} demp={beat >= 5} />
                ))}
                <Node x={BX} y={BY} farge={f.barn} r={74} demp={beat >= 5} />
                <Etikett x={380} y={230} tekst="mor" />
                <Etikett x={760} y={230} tekst="far" />
                <AnimatePresence mode="wait">
                    <motion.text
                        key={f.barnTekst}
                        x={BX}
                        y={BY + 130}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill={FARGE[f.barn]}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {f.barnTekst}
                    </motion.text>
                </AnimatePresence>
                {f.pass && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: beat >= 5 ? 0.5 : 1 }} transition={{ delay: 0.5 }}>
                        <rect x={BX + 105} y={BY - 70} width={110} height={150} rx={12} fill="#7f1d1d" />
                        <circle cx={BX + 160} cy={BY - 10} r={26} fill="none" stroke="#fde68a" strokeWidth={5} />
                        <text x={BX + 160} y={BY + 55} textAnchor="middle" fontSize={22} fontWeight={900} fill="#fde68a">
                            PASS
                        </text>
                    </motion.g>
                )}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={f.dom}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute rounded-3xl bg-white/95 shadow-2xl px-7 py-6"
                    style={{ right: '4%', top: '30%', width: '38%', borderLeft: `12px solid ${f.domFarge}` }}
                >
                    <div className="font-display font-black leading-tight" style={{ fontSize: 40, color: f.domFarge }}>
                        {f.dom}
                    </div>
                    {f.under && (
                        <div className="text-slate-600 font-bold mt-2" style={{ fontSize: 24 }}>
                            {f.under}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
            <Forklaring />
        </>
    );
}

export function InnvandringFamilie({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'regel';
    const titler = modus === 'regel' ? REGEL_TITLER : GRUPPE_TITLER;
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            {modus === 'regel' ? <Regel beat={beat} /> : <Grupper beat={beat} />}
            <AnimatePresence mode="wait">
                <motion.div
                    key={tittel}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[4%] left-[3%] px-5 py-2 rounded-2xl bg-slate-900 text-white font-display font-bold shadow-xl whitespace-nowrap"
                    style={{ fontSize: 28 }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
