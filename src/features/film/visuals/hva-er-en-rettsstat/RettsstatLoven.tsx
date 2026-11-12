import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Ikon, type IkonType } from './ikoner';

/**
 * «rettsstat»: loven som en ramme alle må holde seg innenfor, også politiet, regjeringen og
 * kommunen. «politistat»: rammen er revet i stykker, makthaverne står over alle og tar folk
 * tilfeldig, før Grunnloven fra 1814 kommer inn. «makt»: maktfordelingen, tre deler som
 * holder hverandre i sjakk.
 */

type Modus = 'rettsstat' | 'politistat' | 'makt';

const OVERSKRIFT: Record<Modus, string[]> = {
    rettsstat: ['Rettsstat: lovene styrer', 'Også for dem som styrer', 'Innenfor lovene', 'Rule of law'],
    politistat: ['Politistat', 'Vilkårlig betyr tilfeldig', 'Hva med Norge?', 'Norges viktigste lov'],
    makt: ['Makten deles i tre', 'En fransk filosof', 'Makt holder makt i sjakk', 'Slik er det i Norge', 'Hvis regjeringen bryter loven'],
};

const AKTORER: { type: IkonType; navn: string; x: number }[] = [
    { type: 'politi', navn: 'Politiet', x: 520 },
    { type: 'regjering', navn: 'Regjeringen', x: 800 },
    { type: 'kommune', navn: 'Kommunen', x: 1080 },
];

function Rettsstat({ beat }: { beat: number }) {
    const dytt = beat === 2;
    return (
        <>
            <motion.rect
                x={300}
                y={200}
                width={1000}
                height={600}
                rx={28}
                fill="#eff6ff"
                stroke="#1e3a8a"
                strokeWidth={14}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.6 }}
            />
            <rect x={300} y={200} width={1000} height={96} rx={28} fill="#1e3a8a" />
            <rect x={300} y={260} width={1000} height={36} fill="#1e3a8a" />
            <text x={800} y={264} textAnchor="middle" fontSize={54} fontWeight={800} fill="#fff" letterSpacing={6}>
                LOVENE
            </text>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <Bok x={800} y={520} />
                    <text x={800} y={690} textAnchor="middle" fontSize={40} fontWeight={700} fill="#1e3a8a">
                        skrevet ned, så alle kan lese dem
                    </text>
                </motion.g>
            )}
            {beat >= 1 &&
                AKTORER.map((a, i) => (
                    <motion.g
                        key={a.navn}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{
                            opacity: 1,
                            y: dytt ? [0, i === 1 ? -150 : 0, 0] : 0,
                            x: dytt ? [0, i === 0 ? -150 : i === 2 ? 150 : 0, 0] : 0,
                        }}
                        transition={
                            dytt
                                ? { duration: 1.4, delay: i * 0.5, repeat: Infinity, repeatDelay: 1.6 }
                                : { delay: i * 0.35, duration: 0.6 }
                        }
                    >
                        <g transform={`translate(${a.x} 500)`}>
                            <circle r={95} fill="#fff" stroke="#93c5fd" strokeWidth={4} />
                            <Ikon type={a.type} farge="#334155" skala={0.9} />
                        </g>
                        <text x={a.x} y={650} textAnchor="middle" fontSize={40} fontWeight={700} fill="#0f172a">
                            {a.navn}
                        </text>
                    </motion.g>
                ))}
            {beat === 2 && (
                <motion.text
                    x={800}
                    y={760}
                    textAnchor="middle"
                    fontSize={38}
                    fontWeight={700}
                    fill="#1e3a8a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    Alle må holde seg innenfor lovene
                </motion.text>
            )}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: '800px', originY: '743px' }}>
                    <rect x={430} y={705} width={740} height={76} rx={20} fill="#0f172a" />
                    <text x={800} y={755} textAnchor="middle" fontSize={36} fontWeight={700} fill="#fff">
                        Loven styrer, ikke enkeltpersoner
                    </text>
                </motion.g>
            )}
        </>
    );
}

function Bok({ x, y, tittel, aar }: { x: number; y: number; tittel?: string; aar?: string }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-150} y={-110} width={300} height={220} rx={10} fill="#f8fafc" stroke="#334155" strokeWidth={6} />
            <line x1={0} y1={-110} x2={0} y2={110} stroke="#334155" strokeWidth={6} />
            {tittel ? (
                <>
                    <text x={-75} y={-20} textAnchor="middle" fontSize={34} fontWeight={800} fill="#7f1d1d">
                        {tittel}
                    </text>
                    <text x={-75} y={40} textAnchor="middle" fontSize={40} fontWeight={800} fill="#7f1d1d">
                        {aar}
                    </text>
                </>
            ) : (
                [-70, -40, -10, 20, 50].map((yy) => (
                    <g key={yy}>
                        <line x1={-125} y1={yy} x2={-25} y2={yy} stroke="#94a3b8" strokeWidth={6} />
                        <line x1={25} y1={yy} x2={125} y2={yy} stroke="#94a3b8" strokeWidth={6} />
                    </g>
                ))
            )}
        </g>
    );
}

const FOLK = [260, 420, 580, 740, 900, 1060, 1220, 1380];

function Politistat({ beat }: { beat: number }) {
    if (beat >= 2) {
        return (
            <motion.g key="norge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                {/* Grunnloven som en stor bok med rødt omslag */}
                <g transform="translate(800 480)">
                    <rect x={-200} y={-250} width={400} height={500} rx={16} fill="#7f1d1d" />
                    <rect x={-182} y={-232} width={364} height={464} rx={10} fill="none" stroke="#fbbf24" strokeWidth={4} />
                    <text x={0} y={-60} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fde68a">
                        GRUNNLOVEN
                    </text>
                    <text x={0} y={30} textAnchor="middle" fontSize={72} fontWeight={900} fill="#fde68a">
                        1814
                    </text>
                    <g transform="translate(0 130)">
                        <rect x={-66} y={-36} width={132} height={72} fill="#ba0c2f" />
                        <rect x={-30} y={-36} width={24} height={72} fill="#fff" />
                        <rect x={-66} y={-12} width={132} height={24} fill="#fff" />
                        <rect x={-24} y={-36} width={12} height={72} fill="#00205b" />
                        <rect x={-66} y={-6} width={132} height={12} fill="#00205b" />
                    </g>
                </g>
                <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                    <rect x={70} y={380} width={400} height={170} rx={20} fill="#fff" stroke="#0d9488" strokeWidth={6} />
                    <text x={270} y={450} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f766e">
                        Rettsstat
                    </text>
                    <text x={270} y={505} textAnchor="middle" fontSize={32} fontWeight={600} fill="#334155">
                        siden 1814
                    </text>
                </motion.g>
                {beat >= 3 && (
                    <motion.g initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                        <rect x={1120} y={330} width={420} height={280} rx={20} fill="#fff" stroke="#7f1d1d" strokeWidth={6} />
                        <text x={1330} y={410} textAnchor="middle" fontSize={36} fontWeight={800} fill="#7f1d1d">
                            Bestemmer
                        </text>
                        <text x={1330} y={465} textAnchor="middle" fontSize={34} fontWeight={600} fill="#334155">
                            hvordan makten
                        </text>
                        <text x={1330} y={515} textAnchor="middle" fontSize={34} fontWeight={600} fill="#334155">
                            skal brukes
                        </text>
                    </motion.g>
                )}
            </motion.g>
        );
    }
    return (
        <g>
            {/* Lovene i biter */}
            {[
                [300, 210, 220, -8],
                [600, 230, 180, 6],
                [870, 205, 200, -4],
                [1150, 225, 160, 10],
            ].map(([x, y, w, r], i) => (
                <rect key={i} x={x} y={y} width={w} height={60} rx={8} fill="#f8fafc" stroke="#64748b" strokeWidth={4} transform={`rotate(${r} ${x + w / 2} ${y + 30})`} />
            ))}
            <text x={800} y={180} textAnchor="middle" fontSize={40} fontWeight={800} fill="#334155">
                lovene gjelder ikke
            </text>
            {/* Makthaverne, store og over alle */}
            <motion.g initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
                <g transform="translate(800 440) scale(1.9)">
                    <Ikon type="person" farge="#991b1b" />
                    <path d="M -22 -58 L -22 -76 L -11 -66 L 0 -80 L 11 -66 L 22 -76 L 22 -58 Z" fill="#facc15" />
                </g>
                <rect x={640} y={555} width={320} height={60} rx={14} fill="#991b1b" />
                <text x={800} y={597} textAnchor="middle" fontSize={34} fontWeight={800} fill="#fff">
                    Makthaverne
                </text>
            </motion.g>
            {beat >= 1 && (
                <motion.g initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} style={{ originX: '1250px', originY: '420px' }}>
                    <rect x={1150} y={330} width={190} height={190} rx={30} fill="#fff" stroke="#991b1b" strokeWidth={8} />
                    {[
                        [1200, 380],
                        [1290, 380],
                        [1245, 425],
                        [1200, 470],
                        [1290, 470],
                    ].map(([cx, cy]) => (
                        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={14} fill="#991b1b" />
                    ))}
                    <text x={1245} y={565} textAnchor="middle" fontSize={34} fontWeight={800} fill="#991b1b">
                        tilfeldig
                    </text>
                </motion.g>
            )}
            {/* Vanlige folk. I beat 1 blir én og én tatt, tilfeldig. */}
            {FOLK.map((x, i) => {
                const rekkefolge = [3, 6, 1, 7, 0, 4, 2, 5][i];
                return (
                    <g key={x} transform={`translate(${x} 780) scale(0.85)`}>
                        <Ikon type="person" farge="#64748b" />
                        {beat >= 1 && (
                            <motion.g
                                initial={{ opacity: rekkefolge === 0 ? 1 : 0 }}
                                animate={{ opacity: [0, 1, 1, 0] }}
                                transition={{ duration: 1.6, delay: rekkefolge * 1.6, repeat: Infinity, repeatDelay: 7 * 1.6 }}
                            >
                                <Ikon type="person" farge="#dc2626" />
                                <rect x={-22} y={-4} width={44} height={34} rx={6} fill="#0f172a" />
                                <path d="M -12 -4 L -12 -18 Q 0 -32 12 -18 L 12 -4" fill="none" stroke="#0f172a" strokeWidth={6} />
                            </motion.g>
                        )}
                    </g>
                );
            })}
        </g>
    );
}

const MAKT = [
    { id: 'lov', navn: 'Stortinget', oppgave: 'lager lovene', ikon: 'storting' as IkonType, x: 800, y: 300, farge: '#1d4ed8' },
    { id: 'styr', navn: 'Regjeringen', oppgave: 'styrer', ikon: 'regjering' as IkonType, x: 380, y: 680, farge: '#b45309' },
    { id: 'dom', navn: 'Domstolene', oppgave: 'dømmer', ikon: 'domstol' as IkonType, x: 1220, y: 680, farge: '#7c3aed' },
];

function Makt({ beat }: { beat: number }) {
    const navn = beat >= 3;
    const pil = (a: (typeof MAKT)[number], b: (typeof MAKT)[number]) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const l = Math.hypot(dx, dy);
        const ux = dx / l;
        const uy = dy / l;
        const k = 230;
        return { x1: a.x + ux * k, y1: a.y + uy * k * 0.6, x2: b.x - ux * k, y2: b.y - uy * k * 0.6 };
    };
    const par: [number, number][] = [
        [0, 1],
        [0, 2],
        [1, 2],
    ];
    return (
        <>
            <defs>
                <marker id="rettsstat-pil" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="#475569" />
                </marker>
                <marker id="rettsstat-pil-rod" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={4} markerHeight={4} orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="#dc2626" />
                </marker>
            </defs>
            {beat >= 2 &&
                par.map(([a, b]) => {
                    const p = pil(MAKT[a], MAKT[b]);
                    const dempet = beat >= 4 && !(a === 1 && b === 2);
                    return (
                        <motion.line
                            key={`${a}${b}`}
                            {...p}
                            stroke="#475569"
                            strokeWidth={10}
                            markerStart="url(#rettsstat-pil)"
                            markerEnd="url(#rettsstat-pil)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: dempet ? 0.25 : beat >= 4 ? 0 : 1 }}
                            transition={{ duration: 0.8 }}
                        />
                    );
                })}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <line x1={1000} y1={680} x2={620} y2={680} stroke="#dc2626" strokeWidth={14} markerEnd="url(#rettsstat-pil-rod)" />
                    <rect x={700} y={590} width={200} height={66} rx={16} fill="#dc2626" />
                    <text x={800} y={636} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                        NEI
                    </text>
                    <text x={800} y={740} textAnchor="middle" fontSize={30} fontWeight={700} fill="#991b1b">
                        når loven brytes
                    </text>
                </motion.g>
            )}
            {MAKT.map((m, i) => (
                <motion.g
                    key={m.id}
                    initial={{ x: 800 - m.x, y: 520 - m.y, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 1, delay: i * 0.25, ease: 'easeOut' }}
                >
                    <rect
                        x={m.x - 200}
                        y={m.y - 120}
                        width={400}
                        height={240}
                        rx={26}
                        fill="#fff"
                        stroke={m.farge}
                        strokeWidth={beat >= 4 && m.id === 'dom' ? 14 : 8}
                    />
                    <g transform={`translate(${m.x} ${m.y - (navn ? 30 : 10)}) scale(${navn ? 0.75 : 0.95})`}>
                        <Ikon type={m.ikon} farge={m.farge} />
                    </g>
                    {navn && (
                        <motion.text x={m.x} y={m.y + 58} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {m.navn}
                        </motion.text>
                    )}
                    <text x={m.x} y={m.y + (navn ? 100 : 90)} textAnchor="middle" fontSize={navn ? 30 : 38} fontWeight={700} fill={m.farge}>
                        {m.oppgave}
                    </text>
                </motion.g>
            ))}
            <AnimatePresence>
                {beat === 1 && (
                    <motion.g key="m" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ originX: '800px', originY: '590px' }}>
                        <rect x={560} y={450} width={480} height={300} rx={22} fill="#0f172a" />
                        <text x={800} y={535} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff">
                            Montesquieu, 1748
                        </text>
                        <text x={800} y={590} textAnchor="middle" fontSize={32} fontWeight={600} fill="#cbd5e1">
                            boka «Om lovenes ånd»
                        </text>
                        <text x={800} y={660} textAnchor="middle" fontSize={32} fontWeight={700} fill="#fca5a5">
                            Han mente:
                        </text>
                        <text x={800} y={705} textAnchor="middle" fontSize={32} fontWeight={700} fill="#fca5a5">
                            makt blir lett misbrukt
                        </text>
                    </motion.g>
                )}
                {(beat === 2 || beat === 3) && (
                    <motion.g key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <text x={800} y={560} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                            passer på
                        </text>
                        <text x={800} y={605} textAnchor="middle" fontSize={36} fontWeight={800} fill="#334155">
                            hverandre
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </>
    );
}

export function RettsstatLoven({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'rettsstat';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    const bakgrunn = modus === 'politistat' && beat < 2 ? '#e7e2dc' : '#f1f5f9';
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn, transition: 'background 0.8s' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'rettsstat' && <Rettsstat beat={beat} />}
                {modus === 'politistat' && <Politistat beat={beat} />}
                {modus === 'makt' && <Makt beat={beat} />}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={tekst}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[3%] inset-x-0 flex justify-center pointer-events-none"
                >
                    <div className="px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-3xl shadow-xl whitespace-nowrap">
                        {tekst}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
