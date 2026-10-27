import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Teller } from '../shared';

/**
 * Et snitt gjennom Vestfronten fra siden: vår grøft til venstre, fiendens grøft og bunker
 * til høyre, Ingenmannsland med piggtråd og granathull mellom. Ingen mennesker tegnes.
 * Angrepet vises som en pil som går over toppen og stopper.
 * Modusene: landskap (livet i grøfta), angrep (mønsteret i et angrep) og somme (1. juli 1916).
 */

type Modus = 'landskap' | 'angrep' | 'somme';

const W = 1600;
const BAKKE = 470;
const VAR_X: [number, number] = [150, 300];
const FIENDE_X: [number, number] = [1260, 1400];
const GROFT_BUNN = 720;
const BUNKER = { x: 1290, y: 750, b: 230, h: 110 };
const STOPP_X = 520;

const KRATERE = [
    { x: 420, r: 46 },
    { x: 610, r: 60 },
    { x: 760, r: 38 },
    { x: 905, r: 70 },
    { x: 1080, r: 50 },
    { x: 1190, r: 34 },
];
const TRAD = [380, 700, 1010, 1160];
const NEDSLAG = [1180, 1320, 1450, 1090, 1240, 1380, 1520, 1130];

const TITLER: Record<Modus, string[]> = {
    landskap: ['Skyttergrava', 'Lus, rotter og sykdom', 'Fiendens grøfter', 'Ingenmannsland'],
    angrep: ['Først: kanonene', 'Mål: piggtråden og forsvarerne', 'Fløyta: over toppen', 'Bunkeren står', 'En vegg av kuler', 'Gevinsten'],
    somme: ['Somme, 1916', 'En hel uke med kanonild', '1. juli 1916', 'Den blodigste dagen', 'November 1916'],
};

export function KrigensLopIngenmannsland({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus;
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];

    const landskap = modus === 'landskap';
    const visFiende = !landskap || beat >= 2;
    const visIngenmann = !landskap || beat >= 3;
    const bombardement = (modus === 'angrep' && beat <= 1) || (modus === 'somme' && beat === 1);
    const pilFram = (modus === 'angrep' && beat >= 2) || (modus === 'somme' && beat >= 2);
    const pilStopp = (modus === 'angrep' && beat >= 4) || (modus === 'somme' && beat >= 2);
    const bunkerUthevet = (modus === 'angrep' && beat >= 3) || (modus === 'somme' && beat === 1);
    const kuler = (modus === 'angrep' && beat >= 4) || (modus === 'somme' && beat >= 2 && beat <= 3);
    const linjal = (modus === 'angrep' && beat >= 5) || (modus === 'somme' && beat >= 4);
    const pilSlutt = pilStopp ? STOPP_X : 1150;

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#cbd5e1' }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="kli-himmel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#94a3b8" />
                        <stop offset="1" stopColor="#d6d3d1" />
                    </linearGradient>
                    <linearGradient id="kli-jord" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#78583a" />
                        <stop offset="1" stopColor="#4a3524" />
                    </linearGradient>
                    <marker id="kli-pil" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#1d4ed8" />
                    </marker>
                </defs>
                <rect x={0} y={0} width={W} height={BAKKE} fill="url(#kli-himmel)" />

                {/* Bakken med grøfter og kratere skåret ut */}
                <path d={bakke()} fill="url(#kli-jord)" />
                <rect x={0} y={BAKKE - 4} width={W} height={8} fill="#5b4330" />

                {/* Vann og gjørme i bunnen av vår grøft */}
                <motion.rect
                    x={VAR_X[0]}
                    width={VAR_X[1] - VAR_X[0]}
                    fill="#57708a"
                    opacity={0.85}
                    initial={{ y: GROFT_BUNN - 20, height: 20 }}
                    animate={{ y: GROFT_BUNN - (landskap && beat === 0 ? 70 : 45), height: landskap && beat === 0 ? 70 : 45 }}
                    transition={{ duration: 2.4 }}
                />
                {/* Planker langs veggene */}
                {[0, 1].map((s) => (
                    <rect key={s} x={s ? VAR_X[1] - 10 : VAR_X[0]} y={BAKKE} width={10} height={GROFT_BUNN - BAKKE} fill="#a16207" opacity={0.75} />
                ))}
                {/* Sandsekker på kanten */}
                <Sekker x={VAR_X[0] - 70} />
                <Sekker x={VAR_X[1] + 6} />
                <AnimatePresence>
                    {landskap && beat === 1 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {[175, 235, 265].map((x, i) => (
                                <Rotte key={i} x={x} y={GROFT_BUNN - 52 - (i % 2) * 6} speil={i === 1} />
                            ))}
                            {Array.from({ length: 14 }, (_, i) => (
                                <motion.circle
                                    key={i}
                                    cx={VAR_X[0] + 18 + ((i * 37) % 120)}
                                    cy={BAKKE + 30 + ((i * 53) % 110)}
                                    r={4}
                                    fill="#1c1917"
                                    animate={{ x: [0, 6] }}
                                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', delay: i * 0.05 }}
                                />
                            ))}
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Fiendens side */}
                <motion.g initial={false} animate={{ opacity: visFiende ? 1 : 0.15 }} transition={{ duration: 1 }}>
                    {[0, 1].map((s) => (
                        <rect key={s} x={s ? FIENDE_X[1] - 10 : FIENDE_X[0]} y={BAKKE} width={10} height={GROFT_BUNN - BAKKE} fill="#78716c" />
                    ))}
                    <Sekker x={FIENDE_X[0] - 70} />
                    <Sekker x={FIENDE_X[1] + 6} />
                    <rect x={BUNKER.x} y={BUNKER.y} width={BUNKER.b} height={BUNKER.h} rx={8} fill="#57534e" stroke={bunkerUthevet ? '#16a34a' : '#292524'} strokeWidth={bunkerUthevet ? 8 : 4} />
                    <rect x={BUNKER.x + 40} y={GROFT_BUNN} width={24} height={BUNKER.y - GROFT_BUNN} fill="#3f3a36" />
                </motion.g>

                {/* Ingenmannsland: piggtråd */}
                <motion.g initial={false} animate={{ opacity: visIngenmann ? 1 : 0 }} transition={{ duration: 1.2 }}>
                    {TRAD.map((x, i) => (
                        <Piggtrad key={i} x={x} />
                    ))}
                </motion.g>

                {/* Kanonild: glimt og røyk på fiendens side */}
                <AnimatePresence>
                    {bombardement && (
                        <motion.g key="bomb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {NEDSLAG.map((x, i) => (
                                <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.35, 0] }} transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.37, repeatDelay: 0.5 }}>
                                    <circle cx={x} cy={BAKKE - 20} r={34} fill="#fbbf24" opacity={0.85} />
                                    <circle cx={x} cy={BAKKE - 70} r={56} fill="#57534e" opacity={0.6} />
                                </motion.g>
                            ))}
                        </motion.g>
                    )}
                </AnimatePresence>
                {modus === 'angrep' && beat === 1 && (
                    <>
                        <Sikte x={1010} y={BAKKE - 40} />
                        <Sikte x={1330} y={BAKKE + 90} />
                    </>
                )}

                {/* Angrepet: en pil over toppen, ingen mennesker */}
                <AnimatePresence>
                    {pilFram && (
                        <motion.path
                            key={`pil-${modus}`}
                            fill="none"
                            stroke="#1d4ed8"
                            strokeWidth={30}
                            strokeLinecap="round"
                            markerEnd="url(#kli-pil)"
                            initial={{ d: `M ${VAR_X[1] - 40} ${BAKKE - 30} L ${VAR_X[1] - 30} ${BAKKE - 30}` }}
                            animate={{ d: `M ${VAR_X[1] - 40} ${BAKKE - 30} L ${pilSlutt} ${BAKKE - 30}` }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: pilStopp ? 2.2 : 4, ease: 'easeOut' }}
                        />
                    )}
                </AnimatePresence>
                {modus === 'angrep' && beat === 2 && <Floyte x={VAR_X[0] + 60} y={BAKKE - 110} />}

                {/* Maskingevær fra bunkeren: korte streker mot venstre */}
                <AnimatePresence>
                    {kuler && (
                        <motion.g key="kuler" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {Array.from({ length: 9 }, (_, i) => (
                                <motion.line
                                    key={i}
                                    y1={BAKKE - 70 + i * 9}
                                    y2={BAKKE - 70 + i * 9}
                                    stroke="#dc2626"
                                    strokeWidth={5}
                                    strokeLinecap="round"
                                    initial={{ x1: 1240, x2: 1200 }}
                                    animate={{ x1: [1240, 640], x2: [1200, 600] }}
                                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.08, ease: 'linear' }}
                                />
                            ))}
                            <rect x={560} y={BAKKE - 110} width={22} height={110} rx={6} fill="#dc2626" opacity={0.85} />
                        </motion.g>
                    )}
                </AnimatePresence>

                {/* Linjalen: hvor langt kom de? */}
                <AnimatePresence>
                    {linjal && (
                        <motion.g key="linjal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                            <line x1={VAR_X[1]} y1={BAKKE - 160} x2={STOPP_X} y2={BAKKE - 160} stroke="#0f172a" strokeWidth={6} />
                            <line x1={VAR_X[1]} y1={BAKKE - 180} x2={VAR_X[1]} y2={BAKKE - 140} stroke="#0f172a" strokeWidth={6} />
                            <line x1={STOPP_X} y1={BAKKE - 180} x2={STOPP_X} y2={BAKKE - 140} stroke="#0f172a" strokeWidth={6} />
                        </motion.g>
                    )}
                </AnimatePresence>
            </svg>

            {/* Merkelapper som DOM */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${modus}-${tittel}`}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-3xl shadow-xl whitespace-nowrap"
                    style={{ top: '5%', left: '3%' }}
                >
                    {tittel}
                </motion.div>
            </AnimatePresence>
            <Etiketter modus={modus} beat={beat} />
        </div>
    );
}

/** Plassering i prosent av 1600x900-flaten. */
function Lapp({ x, y, children, farge = '#0f172a', delay = 0.4 }: { x: number; y: number; children: React.ReactNode; farge?: string; delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay, duration: 0.6 }}
            className="absolute -translate-x-1/2 rounded-xl bg-white/92 px-4 py-1.5 text-2xl font-black shadow-lg whitespace-nowrap"
            style={{ left: `${(x / 1600) * 100}%`, top: `${(y / 900) * 100}%`, color: farge }}
        >
            {children}
        </motion.div>
    );
}

function Etiketter({ modus, beat }: { modus: Modus; beat: number }) {
    const l: { id: string; x: number; y: number; t: React.ReactNode; farge?: string }[] = [];
    if (modus === 'landskap') {
        if (beat === 0) l.push({ id: 'vann', x: 225, y: 740, t: 'vann og gjørme', farge: '#1e3a5f' });
        if (beat === 1) l.push({ id: 'syk', x: 225, y: 740, t: 'skyttergravsfot', farge: '#7f1d1d' });
        if (beat >= 2) l.push({ id: 'var', x: 225, y: 740, t: 'vår grøft', farge: '#1e3a8a' });
        if (beat >= 2) l.push({ id: 'fiende', x: 1130, y: 600, t: 'fiendens grøft', farge: '#7f1d1d' });
        if (beat >= 3) l.push({ id: 'trad', x: 760, y: 330, t: 'piggtråd og granathull', farge: '#44403c' });
    }
    if (modus === 'angrep') {
        if (beat === 0) l.push({ id: 'dager', x: 1150, y: 250, t: 'i dagevis, noen ganger i ukevis', farge: '#7c2d12' });
        if (beat === 1) l.push({ id: 'mal', x: 1010, y: 300, t: 'piggtråd', farge: '#7f1d1d' });
        if (beat === 1) l.push({ id: 'mal2', x: 1110, y: 640, t: 'forsvarerne', farge: '#7f1d1d' });
        if (beat === 2) l.push({ id: 'over', x: 700, y: 310, t: 'over toppen', farge: '#1e3a8a' });
        if (beat >= 3) l.push({ id: 'bunker', x: 1110, y: 760, t: 'bunker: står', farge: '#166534' });
        if (beat === 4) l.push({ id: 'mg', x: 900, y: 300, t: 'maskingevær', farge: '#991b1b' });
        if (beat >= 5) l.push({ id: 'meter', x: 410, y: 210, t: 'noen få hundre meter', farge: '#0f172a' });
    }
    if (modus === 'somme') {
        if (beat === 0) l.push({ id: 'somme', x: 760, y: 250, t: 'britene mot tyskerne', farge: '#0f172a' });
        if (beat === 1) l.push({ id: 'bunker', x: 1080, y: 760, t: 'tyske stillinger: står', farge: '#166534' });
        if (beat >= 4) l.push({ id: 'knapt', x: 410, y: 210, t: 'fronten flyttet seg knapt', farge: '#0f172a' });
    }
    return (
        <>
            <AnimatePresence>
                {l.map((e) => (
                    <Lapp key={e.id} x={e.x} y={e.y} farge={e.farge}>
                        {e.t}
                    </Lapp>
                ))}
            </AnimatePresence>
            {modus === 'somme' && beat >= 2 && (
                <div className="absolute flex gap-4" style={{ bottom: '4%', left: '26%' }}>
                    <Teller key="dag" verdi={20000} prefiks="nesten " etikett="briter døde den første dagen" tone="rod" />
                    {beat >= 4 && <Teller key="mill" verdi={1000000} prefiks="over " etikett="drept eller såret, begge sider" tone="rod" />}
                </div>
            )}
        </>
    );
}

function bakke() {
    let d = `M 0 ${BAKKE}`;
    const groft = (x0: number, x1: number) => {
        d += ` L ${x0} ${BAKKE} L ${x0} ${GROFT_BUNN} L ${x1} ${GROFT_BUNN} L ${x1} ${BAKKE}`;
    };
    groft(VAR_X[0], VAR_X[1]);
    for (const k of KRATERE) {
        d += ` L ${k.x - k.r} ${BAKKE} A ${k.r} ${k.r * 0.55} 0 0 0 ${k.x + k.r} ${BAKKE}`;
    }
    groft(FIENDE_X[0], FIENDE_X[1]);
    d += ` L ${W} ${BAKKE} L ${W} 900 L 0 900 Z`;
    return d;
}

function Sekker({ x }: { x: number }) {
    return (
        <g>
            {[0, 1, 2].map((r) =>
                Array.from({ length: 3 - r }, (_, i) => (
                    <rect key={`${r}-${i}`} x={x + i * 22 + r * 11} y={BAKKE - 16 - r * 15} width={22} height={15} rx={6} fill="#a8a29e" stroke="#57534e" strokeWidth={2} />
                ))
            )}
        </g>
    );
}

function Piggtrad({ x }: { x: number }) {
    const top = BAKKE - 60;
    let d = `M ${x - 70} ${top + 30}`;
    for (let i = 0; i < 14; i++) d += ` L ${x - 70 + i * 10 + 5} ${top + (i % 2 ? 50 : 8)}`;
    return (
        <g>
            {[-60, 0, 60].map((dx) => (
                <line key={dx} x1={x + dx} y1={BAKKE} x2={x + dx} y2={top} stroke="#44403c" strokeWidth={6} />
            ))}
            <path d={d} fill="none" stroke="#292524" strokeWidth={3} />
            <path d={d.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, (_m, a, b) => `${a} ${Number(b) + 12}`)} fill="none" stroke="#292524" strokeWidth={3} />
        </g>
    );
}

function Rotte({ x, y, speil }: { x: number; y: number; speil?: boolean }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${speil ? -1.6 : 1.6} 1.6)`}>
            <ellipse cx={0} cy={0} rx={18} ry={9} fill="#44403c" />
            <circle cx={16} cy={-3} r={6} fill="#44403c" />
            <path d="M -18 2 Q -34 10 -40 0" fill="none" stroke="#44403c" strokeWidth={3} />
        </g>
    );
}

function Sikte({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            <circle cx={x} cy={y} r={52} fill="none" stroke="#dc2626" strokeWidth={6} />
            <line x1={x - 70} y1={y} x2={x + 70} y2={y} stroke="#dc2626" strokeWidth={4} />
            <line x1={x} y1={y - 70} x2={x} y2={y + 70} stroke="#dc2626" strokeWidth={4} />
        </motion.g>
    );
}

function Floyte({ x, y }: { x: number; y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <rect x={x - 40} y={y - 14} width={60} height={28} rx={14} fill="#e5e7eb" stroke="#334155" strokeWidth={4} />
            <circle cx={x + 30} cy={y} r={20} fill="#e5e7eb" stroke="#334155" strokeWidth={4} />
            {[0, 1, 2].map((i) => (
                <motion.path
                    key={i}
                    d={`M ${x + 62 + i * 18} ${y - 26} Q ${x + 74 + i * 18} ${y} ${x + 62 + i * 18} ${y + 26}`}
                    fill="none"
                    stroke="#334155"
                    strokeWidth={4}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                />
            ))}
        </motion.g>
    );
}
