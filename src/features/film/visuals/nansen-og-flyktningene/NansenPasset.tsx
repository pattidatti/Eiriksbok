import { AnimatePresence, motion } from 'framer-motion';
import { Teller } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Nansenpasset som tegning. «pass»: spørsmålet om hvem du er, konferansen med 31 land,
 * selve passet, hva det ga (og ikke ga), og landene som godtok det. «kontor»: Nansens
 * død, Nansenkontoret i Genève, sakene, frimerket og fredsprisen i 1938.
 */

type Modus = 'pass' | 'kontor';

const B = 1600;
const H = 900;

const OVERSKRIFTER: Record<Modus, string[]> = {
    pass: [
        'Hvem er du?',
        'Genève, juli 1922: 31 land',
        'Nansenpasset',
        'Hva passet ga',
        'Godtatt av mer enn 50 land',
    ],
    kontor: [
        'Polhøgda, 13. mai 1930',
        'Nansenkontoret, Genève 1931',
        'Rundt 800 000 saker',
        'Nansen-frimerker',
        'Nobels fredspris 1938',
    ],
};

export function NansenPasset({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'pass';
    const overskrift = OVERSKRIFTER[modus][Math.min(beat, OVERSKRIFTER[modus].length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#efe7d6]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'pass' ? <Pass beat={beat} /> : <Kontor beat={beat} />}
            </svg>
            {modus === 'kontor' && beat === 2 && (
                <div className="absolute bottom-[10%] right-[8%]">
                    <Teller verdi={800000} etikett="saker" tone="gronn" />
                </div>
            )}
            <AnimatePresence mode="wait">
                {overskrift && (
                    <motion.div
                        key={overskrift}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-[5%] left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/95 text-slate-900 font-display font-bold text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                    >
                        {overskrift}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Selve passet, tegnet rundt (cx, cy). */
function Dokument({ cx, cy, skala = 1 }: { cx: number; cy: number; skala?: number }) {
    return (
        <g transform={`translate(${cx} ${cy}) scale(${skala})`}>
            <rect x={-230} y={-290} width={460} height={580} rx={18} fill="#fffaf0" stroke="#7c5c3b" strokeWidth={6} />
            <rect x={-230} y={-290} width={460} height={90} rx={18} fill="#1e3a8a" />
            <rect x={-230} y={-220} width={460} height={20} fill="#1e3a8a" />
            <text y={-232} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" letterSpacing={4}>
                NANSENPASS
            </text>
            {/* Bildet */}
            <rect x={-190} y={-170} width={140} height={180} rx={6} fill="#cbd5e1" stroke="#64748b" strokeWidth={3} />
            <circle cx={-120} cy={-110} r={34} fill="#94a3b8" />
            <path d="M -175 10 Q -120 -60 -65 10 Z" fill="#94a3b8" />
            <text x={-20} y={-140} fontSize={26} fill="#64748b" fontWeight={700}>
                Navn
            </text>
            <text x={-20} y={-100} fontSize={40} fill="#0f172a" fontWeight={800}>
                Sergej
            </text>
            <text x={-20} y={-50} fontSize={26} fill="#64748b" fontWeight={700}>
                Født i
            </text>
            <text x={-20} y={-12} fontSize={34} fill="#0f172a" fontWeight={800}>
                Russland
            </text>
            {[60, 100, 140].map((y) => (
                <rect key={y} x={-190} y={y} width={380} height={10} rx={5} fill="#d6cbb5" />
            ))}
        </g>
    );
}

function Stempel({
    x,
    y,
    tekst,
    farge,
    vinkel,
    forsinkelse = 0,
    strek = false,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    vinkel: number;
    forsinkelse?: number;
    strek?: boolean;
}) {
    const bredde = tekst.length * 22 + 50;
    return (
        <motion.g
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 300, damping: 18 }}
            style={{ originX: `${x}px`, originY: `${y}px` }}
        >
            <g transform={`rotate(${vinkel} ${x} ${y})`}>
                <rect
                    x={x - bredde / 2}
                    y={y - 38}
                    width={bredde}
                    height={76}
                    rx={12}
                    fill="#ffffff"
                    fillOpacity={0.9}
                    stroke={farge}
                    strokeWidth={6}
                />
                <text x={x} y={y + 13} textAnchor="middle" fontSize={38} fontWeight={900} fill={farge}>
                    {tekst}
                </text>
                {strek && (
                    <line x1={x - bredde / 2 + 10} y1={y} x2={x + bredde / 2 - 10} y2={y} stroke={farge} strokeWidth={6} />
                )}
            </g>
        </motion.g>
    );
}

function Pass({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect
                        x={570}
                        y={170}
                        width={460}
                        height={580}
                        rx={18}
                        fill="none"
                        stroke="#7c5c3b"
                        strokeWidth={6}
                        strokeDasharray="22 16"
                    />
                    <motion.text
                        x={800}
                        y={560}
                        textAnchor="middle"
                        fontSize={300}
                        fontWeight={900}
                        fill="#b45309"
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.6, type: 'spring' }}
                        style={{ originX: '800px', originY: '460px' }}
                    >
                        ?
                    </motion.text>
                    <text x={800} y={810} textAnchor="middle" fontSize={40} fontWeight={800} fill="#334155">
                        Et bevis på hvem du er
                    </text>
                </motion.g>
            )}
            {beat === 1 && <Konferanse />}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, y: 60 }}
                    animate={{ opacity: 1, y: 0, x: beat >= 4 ? -380 : 0 }}
                    transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                    <Dokument cx={800} cy={490} skala={beat >= 4 ? 0.8 : 1} />
                    {beat === 3 && (
                        <>
                            <Stempel x={1260} y={300} tekst="Reise inn" farge="#15803d" vinkel={-6} />
                            <Stempel x={1290} y={440} tekst="Bo" farge="#15803d" vinkel={4} forsinkelse={0.5} />
                            <Stempel x={1260} y={580} tekst="Arbeide" farge="#15803d" vinkel={-3} forsinkelse={1} />
                            <Stempel
                                x={330}
                                y={720}
                                tekst="Statsborgerskap"
                                farge="#64748b"
                                vinkel={-8}
                                forsinkelse={1.6}
                                strek
                            />
                        </>
                    )}
                </motion.g>
            )}
            {beat >= 4 && <Landrute />}
        </>
    );
}

/** Et bord med 31 plasser rundt, én per land. */
function Konferanse() {
    const plasser = Array.from({ length: 31 }, (_, i) => {
        const a = (i / 31) * Math.PI * 2 - Math.PI / 2;
        return [800 + Math.cos(a) * 470, 500 + Math.sin(a) * 270] as const;
    });
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ellipse cx={800} cy={500} rx={380} ry={190} fill="#8b5e34" stroke="#5b3a1e" strokeWidth={8} />
            <text x={800} y={490} textAnchor="middle" fontSize={56} fontWeight={900} fill="#fef3c7">
                31 land
            </text>
            <text x={800} y={545} textAnchor="middle" fontSize={32} fontWeight={700} fill="#fde68a">
                Nansens forslag: et pass for flyktninger
            </text>
            {plasser.map(([x, y], i) => (
                <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={22}
                    fill="#1e3a8a"
                    stroke="#fff"
                    strokeWidth={4}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    style={{ originX: `${x}px`, originY: `${y}px` }}
                />
            ))}
        </motion.g>
    );
}

/** Femti ruter som fylles, én per land som godtok passet. */
function Landrute() {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {Array.from({ length: 50 }, (_, i) => {
                const x = 860 + (i % 10) * 64;
                const y = 230 + Math.floor(i / 10) * 74;
                return (
                    <motion.rect
                        key={i}
                        x={x}
                        y={y}
                        width={50}
                        height={58}
                        rx={6}
                        fill="#15803d"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                        style={{ originX: `${x + 25}px`, originY: `${y + 29}px` }}
                    />
                );
            })}
            <motion.text
                x={1180}
                y={680}
                textAnchor="middle"
                fontSize={64}
                fontWeight={900}
                fill="#14532d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.2 }}
            >
                mer enn 50 land
            </motion.text>
        </motion.g>
    );
}

function Kontor({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2 }}>
                    <rect x={480} y={220} width={640} height={440} rx={16} fill="#fffaf0" stroke="#1f2937" strokeWidth={10} />
                    <text x={800} y={360} textAnchor="middle" fontSize={64} fontWeight={900} fill="#0f172a">
                        Fridtjof Nansen
                    </text>
                    <text x={800} y={440} textAnchor="middle" fontSize={48} fontWeight={700} fill="#334155">
                        1861 - 1930
                    </text>
                    <motion.text
                        x={800}
                        y={570}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={700}
                        fill="#b91c1c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2.5 }}
                    >
                        Begravet 17. mai
                    </motion.text>
                </motion.g>
            )}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: beat >= 2 ? 0.95 : 1, y: 0, x: beat >= 2 ? -380 : 0 }}
                    transition={{ duration: 0.9 }}
                >
                    {/* Kontorbygningen */}
                    <rect x={560} y={300} width={480} height={420} fill="#e7dcc6" stroke="#7c5c3b" strokeWidth={6} />
                    <path d="M 530 300 L 800 170 L 1070 300 Z" fill="#9a3412" stroke="#7c2d12" strokeWidth={6} />
                    {[0, 1, 2].map((r) =>
                        [0, 1, 2, 3].map((c) => (
                            <rect
                                key={`${r}${c}`}
                                x={600 + c * 110}
                                y={330 + r * 110}
                                width={70}
                                height={80}
                                fill={beat >= 2 ? '#fde68a' : '#94a3b8'}
                                stroke="#7c5c3b"
                                strokeWidth={3}
                            />
                        ))
                    )}
                    <rect x={760} y={620} width={80} height={100} fill="#7c2d12" />
                    <rect x={620} y={250} width={360} height={46} rx={6} fill="#1e3a8a" />
                    <text x={800} y={284} textAnchor="middle" fontSize={30} fontWeight={900} fill="#fff">
                        NANSENKONTORET
                    </text>
                </motion.g>
            )}
            {beat === 2 && <Saker />}
            {beat === 3 && <Frimerke />}
            {beat === 3 && (
                <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <rect x={240} y={790} width={1120} height={86} rx={18} fill="#fff" stroke="#1e3a8a" strokeWidth={4} />
                    <text x={800} y={846} textAnchor="middle" fontSize={40} fontWeight={800} fill="#1e3a8a">
                        Visum = tillatelse til å reise inn i et land
                    </text>
                </motion.g>
            )}
            {beat >= 4 && <Medalje />}
        </>
    );
}

function Saker() {
    const oppgaver = ['Fornye passet', 'Skaffe visum', 'Bo og arbeide'];
    return (
        <>
            {Array.from({ length: 14 }, (_, i) => (
                <motion.rect
                    key={i}
                    x={870 + (i % 2) * 14}
                    y={640 - i * 22}
                    width={260}
                    height={20}
                    rx={3}
                    fill={i % 2 ? '#fffaf0' : '#f5ecd8'}
                    stroke="#a8977a"
                    strokeWidth={2}
                    initial={{ opacity: 0, y: -60 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12 }}
                />
            ))}
            {oppgaver.map((t, i) => (
                <motion.g
                    key={t}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6 + i * 0.5 }}
                >
                    <rect x={1180} y={210 + i * 100} width={340} height={74} rx={14} fill="#fff" stroke="#15803d" strokeWidth={4} />
                    <text x={1350} y={258 + i * 100} textAnchor="middle" fontSize={34} fontWeight={800} fill="#14532d">
                        {t}
                    </text>
                </motion.g>
            ))}
        </>
    );
}

function Frimerke() {
    const tagger = Array.from({ length: 14 }, (_, i) => i);
    return (
        <motion.g
            initial={{ opacity: 0, rotate: -20, scale: 0.6 }}
            animate={{ opacity: 1, rotate: -6, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
            style={{ originX: '1150px', originY: '440px' }}
        >
            <rect x={960} y={250} width={380} height={440} fill="#fff" />
            {tagger.map((i) => (
                <g key={i}>
                    <circle cx={960 + (i * 380) / 13} cy={250} r={10} fill="#efe7d6" />
                    <circle cx={960 + (i * 380) / 13} cy={690} r={10} fill="#efe7d6" />
                    <circle cx={960} cy={250 + (i * 440) / 13} r={10} fill="#efe7d6" />
                    <circle cx={1340} cy={250 + (i * 440) / 13} r={10} fill="#efe7d6" />
                </g>
            ))}
            <rect x={990} y={280} width={320} height={380} fill="#b91c1c" />
            <circle cx={1150} cy={430} r={90} fill="#fecaca" />
            <path d="M 1060 560 Q 1150 470 1240 560 Z" fill="#fecaca" />
            <text x={1150} y={630} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff" letterSpacing={3}>
                NANSEN
            </text>
            <text x={1150} y={325} textAnchor="middle" fontSize={26} fontWeight={800} fill="#fff">
                for flyktningene
            </text>
        </motion.g>
    );
}

function Medalje() {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 140, damping: 14 }}
            style={{ originX: '1180px', originY: '470px' }}
        >
            <path d="M 1120 200 L 1150 380 L 1210 380 L 1240 200 Z" fill="#1d4ed8" />
            <circle cx={1180} cy={480} r={150} fill="#eab308" stroke="#a16207" strokeWidth={10} />
            <circle cx={1180} cy={480} r={115} fill="none" stroke="#a16207" strokeWidth={4} />
            <text x={1180} y={470} textAnchor="middle" fontSize={40} fontWeight={900} fill="#713f12">
                FRED
            </text>
            <text x={1180} y={520} textAnchor="middle" fontSize={40} fontWeight={900} fill="#713f12">
                1938
            </text>
        </motion.g>
    );
}
