import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';

/**
 * Tegninger av livet i skyttergraven, i SVG:
 * sikksakk (ovenfra: rett grøft mot grøft med svinger), dag (snitt: dagen og vannet),
 * fot (skyttergravsfot) og avtale (snitt: lev og la leve mellom to grøfter).
 */

type Modus = 'sikksakk' | 'dag' | 'fot' | 'avtale';

const B = 1600;
const H = 900;
const JORD = '#6e5a42';
const GROFT = '#4a3a28';
const SEKK = '#b39d70';

export function SkyttergravSnitt({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'dag';
    const innhold = {
        sikksakk: <Sikksakk beat={beat} />,
        dag: <Dag beat={beat} />,
        fot: <Fot beat={beat} />,
        avtale: <Avtale beat={beat} />,
    }[modus];
    const lapper = LAPPER[modus];
    const lapp = lapper[Math.min(beat, lapper.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: modus === 'sikksakk' ? '#8a7558' : '#cbd5df' }}>
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {innhold}
            </svg>
            <AnimatePresence mode="wait">
                <motion.div
                    key={lapp}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-[6%] left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-2xl bg-white/95 text-slate-900 font-black text-2xl md:text-4xl shadow-xl whitespace-nowrap"
                >
                    {lapp}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

const LAPPER: Record<Modus, string[]> = {
    sikksakk: ['Frontlinjen ovenfra', 'En rett grøft', 'En grøft i sikksakk', 'Fienden bryter inn'],
    dag: ['Mest venting', 'Daggry: stand-to', 'Dagens arbeid', 'Vannet ligger høyt', 'Gjørmebad'],
    fot: ['Iskaldt vann i dagevis', 'Skyttergravsfot', 'Koldbrann', 'Hvalfett og nye sokker'],
    avtale: ['Lev og la leve', 'En avtale uten ord', 'Vannhenting i fred', 'Samme sted, samme tid', 'Tanken på begge sider', 'Felles elendighet'],
};

/** Tekst med hvit kant, så den leses på alle bakgrunner. */
function Tekst({
    x,
    y,
    children,
    storrelse = 34,
    farge = '#0f172a',
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: ReactNode;
    storrelse?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            stroke="#ffffff"
            strokeWidth={storrelse / 4.5}
            paintOrder="stroke"
        >
            {children}
        </text>
    );
}

const vis = (synlig: boolean, forsinkelse = 0) => ({
    initial: false as const,
    animate: { opacity: synlig ? 1 : 0 },
    transition: { duration: 0.6, delay: synlig ? forsinkelse : 0 },
});

/* ---------- Sikksakk: ovenfra ---------- */

const RETT_Y = 560;
const SAKK_X0 = 870;
const SAKK_BREDDE = 74;
const SAKK_PUNKTER = Array.from({ length: 9 }, (_, i) => i);

function sakkSti() {
    let d = `M ${SAKK_X0} 520`;
    SAKK_PUNKTER.forEach((i) => {
        const y = i % 2 ? 610 : 520;
        const x1 = SAKK_X0 + i * SAKK_BREDDE;
        d += ` L ${x1} ${y} L ${x1 + SAKK_BREDDE} ${y}`;
    });
    return d;
}

function Sikksakk({ beat }: { beat: number }) {
    const sakk = sakkSti();
    // Den truffede biten i sikksakken: skytestilling nr. 4.
    const bitX = SAKK_X0 + 4 * SAKK_BREDDE;
    return (
        <g>
            <motion.g initial={false} animate={{ opacity: beat >= 1 ? 1 : 0.35 }}>
                <Tekst x={430} y={400} storrelse={40}>
                    Rett grøft
                </Tekst>
                <rect x={140} y={RETT_Y - 34} width={580} height={68} fill={GROFT} stroke={SEKK} strokeWidth={14} />
            </motion.g>
            <Tekst x={1200} y={400} storrelse={40}>
                Sikksakk
            </Tekst>
            <path d={sakk} fill="none" stroke={SEKK} strokeWidth={82} strokeLinejoin="miter" />
            <path d={sakk} fill="none" stroke={GROFT} strokeWidth={56} strokeLinejoin="miter" />

            {/* Beat 1: granaten i den rette grøfta, skaden sprer seg langs hele */}
            <AnimatePresence>
                {beat === 1 || beat === 2 ? (
                    <motion.g key="rett" initial={{ opacity: 0 }} animate={{ opacity: beat === 1 ? 1 : 0.45 }} exit={{ opacity: 0 }}>
                        <motion.rect
                            y={RETT_Y - 30}
                            height={60}
                            fill="#dc2626"
                            opacity={0.75}
                            initial={{ x: 430, width: 0 }}
                            animate={{ x: 144, width: 572 }}
                            transition={{ duration: 1.4, delay: 1.2, ease: 'easeOut' }}
                        />
                        <Smell x={430} y={RETT_Y} forsinkelse={0.8} />
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }}>
                            <Pille x={430} y={700} farge="#b91c1c" tekst="Alle i rekka rammes" />
                        </motion.g>
                    </motion.g>
                ) : null}
            </AnimatePresence>

            {/* Beat 2: granaten i sikksakken, bare én bit rammes */}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.g key="sakk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.rect
                            x={bitX + 4}
                            y={520 - 26}
                            width={SAKK_BREDDE - 8}
                            height={52}
                            fill="#dc2626"
                            opacity={0.8}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.6, delay: 1.2 }}
                            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                        />
                        <Smell x={bitX + SAKK_BREDDE / 2} y={520} forsinkelse={0.8} />
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                            <Pille x={1200} y={720} farge="#15803d" tekst="Ikke hele rekka" />
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Beat 3: fienden bryter inn og skyter langs grøfta */}
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.g key="inn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.line
                            x1={160}
                            y1={RETT_Y}
                            x2={700}
                            y2={RETT_Y}
                            stroke="#facc15"
                            strokeWidth={8}
                            strokeDasharray="22 14"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.6, delay: 0.6 }}
                        />
                        <Fiende x={160} y={RETT_Y} />
                        <Pille x={430} y={700} farge="#a16207" tekst="Fritt skudd langs hele" />
                        <motion.line
                            x1={SAKK_X0 + 2 * SAKK_BREDDE + 12}
                            y1={520}
                            x2={SAKK_X0 + 3 * SAKK_BREDDE - 6}
                            y2={520}
                            stroke="#facc15"
                            strokeWidth={8}
                            strokeDasharray="22 14"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.6, delay: 2.4 }}
                        />
                        <Fiende x={SAKK_X0 + 2 * SAKK_BREDDE + 12} y={520} />
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
                            <rect x={SAKK_X0 + 3 * SAKK_BREDDE - 6} y={490} width={14} height={60} fill="#facc15" />
                            <Pille x={1200} y={720} farge="#15803d" tekst="Svingen er i veien" />
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

function Smell({ x, y, forsinkelse }: { x: number; y: number; forsinkelse: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.85] }} transition={{ delay: forsinkelse, duration: 0.8 }}>
            <motion.circle
                cx={x}
                cy={y}
                fill="#fbbf24"
                initial={{ r: 0 }}
                animate={{ r: 46 }}
                transition={{ delay: forsinkelse, duration: 0.4 }}
            />
            <circle cx={x} cy={y} r={22} fill="#fff7d6" />
        </motion.g>
    );
}

/** Merkelapp i hvit pille, lesbar på brun bakgrunn og på projektor. */
function Pille({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    const bredde = tekst.length * 21 + 56;
    return (
        <g>
            <rect x={x - bredde / 2} y={y - 44} width={bredde} height={62} rx={18} fill="#ffffff" />
            <text x={x} y={y} textAnchor="middle" fontSize={38} fontWeight={900} fill={farge}>
                {tekst}
            </text>
        </g>
    );
}

/** Fienden som bryter inn: en mørk trekant som peker langs grøfta. */
function Fiende({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={20} fill="#334155" stroke="#ffffff" strokeWidth={4} />
            <path d="M 6 -9 L 20 0 L 6 9 Z" fill="#ffffff" />
        </g>
    );
}

/* ---------- Dag: snitt av grøfta ---------- */

const BAKKE = 380;
const BUNN = 700;
const GV = BAKKE + 130; // grunnvannet: en halv meter ned (grøfta er tegnet ca. to meter dyp)
const JORD_STI = `M 0 ${BAKKE} L 560 ${BAKKE} L 600 ${BUNN} L 1000 ${BUNN} L 1040 ${BAKKE} L ${B} ${BAKKE} L ${B} ${H} L 0 ${H} Z`;

/** En soldat i silhuett. `staar` = står på skytetrinnet med geværet over kanten. */
function Soldat({ x, y, staar }: { x: number; y: number; staar: boolean }) {
    return (
        <motion.g initial={false} animate={{ y: staar ? 0 : 56 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
            <g transform={`translate(${x} ${y})`}>
                <rect x={-17} y={-108} width={34} height={92} rx={10} fill="#5f5a3a" />
                <circle cy={-124} r={17} fill="#e0b48f" />
                <ellipse cy={-138} rx={30} ry={8} fill="#4a4a30" />
                <rect x={-12} y={-18} width={10} height={40} fill="#4a4530" />
                <rect x={2} y={-18} width={10} height={40} fill="#4a4530" />
                {staar && <rect x={8} y={-96} width={96} height={8} rx={3} fill="#2f2a22" transform="rotate(-6)" />}
            </g>
        </motion.g>
    );
}

function Dag({ beat }: { beat: number }) {
    const daggry = beat === 1;
    const vann = beat >= 4 ? 610 : beat >= 2 ? 668 : BUNN;
    return (
        <g>
            <defs>
                <linearGradient id="sg-himmel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={daggry ? '#64748b' : '#94a3b8'} />
                    <stop offset="100%" stopColor={daggry ? '#fdba74' : '#cbd5e1'} />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={B} height={BAKKE} fill="url(#sg-himmel)" />
            {daggry && (
                <motion.circle cx={1300} r={46} fill="#fde68a" initial={{ cy: BAKKE + 40 }} animate={{ cy: BAKKE - 30 }} transition={{ duration: 3 }} />
            )}
            {/* Jorda med grøfta skåret ut */}
            <clipPath id="sg-jord">
                <path d={JORD_STI} />
            </clipPath>
            <path d={JORD_STI} fill={JORD} />
            {/* Grunnvannet, bare inne i jorda */}
            <motion.rect x={0} y={GV} width={B} height={H - GV} fill="#4f7fa3" fillOpacity={0.6} clipPath="url(#sg-jord)" {...vis(beat >= 3)} />
            <motion.g {...vis(beat >= 3, 0.6)}>
                <line x1={0} y1={GV} x2={B} y2={GV} stroke="#1d4ed8" strokeWidth={5} strokeDasharray="18 12" />
                <line x1={200} y1={BAKKE + 6} x2={200} y2={GV - 6} stroke="#0f172a" strokeWidth={8} />
                <path d={`M 190 ${GV - 18} L 200 ${GV - 4} L 210 ${GV - 18}`} fill="none" stroke="#0f172a" strokeWidth={8} />
            </motion.g>
            {/* Skytetrinn og brystvern av sandsekker */}
            <rect x={600} y={BUNN - 90} width={110} height={90} fill="#5b4732" />
            {[0, 1, 2].map((r) =>
                [0, 1, 2, 3].map((k) => (
                    <rect key={`v${r}${k}`} x={1000 + k * 40 - (r % 2) * 20} y={BAKKE - 30 - r * 30} width={40} height={30} rx={8} fill={SEKK} stroke="#8a7550" strokeWidth={3} />
                ))
            )}
            {[0, 1].map((r) =>
                [0, 1, 2].map((k) => (
                    <rect key={`h${r}${k}`} x={480 + k * 40 - (r % 2) * 20} y={BAKKE - 30 - r * 30} width={40} height={30} rx={8} fill={SEKK} stroke="#8a7550" strokeWidth={3} />
                ))
            )}
            {/* Vannet i bunnen */}
            <motion.rect x={600} width={400} fill="#6b5634" initial={false} animate={{ y: vann, height: BUNN - vann + 1 }} transition={{ duration: 2 }} opacity={0.92} />
            {/* Gangbord */}
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <rect key={i} x={720 + i * 40} y={BUNN - 14} width={30} height={10} fill="#8b6b45" />
            ))}
            <Soldat x={655} y={BUNN - 90} staar={beat === 1} />
            <Soldat x={790} y={BUNN - 14} staar={beat === 1} />
            <Soldat x={920} y={BUNN - 14} staar={beat === 1} />
            {/* Pumpa og slangen over kanten */}
            <motion.g {...vis(beat >= 2 && beat <= 3, 2.4)}>
                <rect x={950} y={BUNN - 120} width={26} height={106} fill="#475569" />
                <path d={`M 963 ${BUNN - 120} C 963 ${BAKKE - 60}, 1120 ${BAKKE - 80}, 1180 ${BAKKE - 10}`} fill="none" stroke="#334155" strokeWidth={10} />
            </motion.g>
            {/* Dagens arbeid */}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.g key="arbeid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {['Frokost', 'Våpenpuss', 'Sandsekker', 'Pumpe vann'].map((t, i) => (
                            <motion.g key={t} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 1 }}>
                                <rect x={70} y={455 + i * 92} width={330} height={70} rx={18} fill={i === 3 ? '#1d4ed8' : '#ffffff'} />
                                <text x={235} y={502 + i * 92} textAnchor="middle" fontSize={36} fontWeight={900} fill={i === 3 ? '#ffffff' : '#0f172a'}>
                                    {t}
                                </text>
                            </motion.g>
                        ))}
                    </motion.g>
                )}
            </AnimatePresence>
            <motion.g {...vis(beat === 3, 0.8)}>
                <Tekst x={60} y={BAKKE - 150} anker="start" farge="#1e3a8a" storrelse={48}>
                    En halv meter ned:
                </Tekst>
                <Tekst x={60} y={BAKKE - 92} anker="start" farge="#1e3a8a" storrelse={48}>
                    vann
                </Tekst>
            </motion.g>
            {/* Regn og sitatet */}
            <motion.g {...vis(beat >= 4, 1)}>
                <Tekst x={1300} y={GV + 120} storrelse={44} farge="#422006">
                    Gjørmevann
                </Tekst>
            </motion.g>
            <motion.g {...vis(beat >= 4)}>
                {Array.from({ length: 40 }, (_, i) => (
                    <line key={i} x1={(i * 97) % B} y1={(i * 53) % 300} x2={((i * 97) % B) - 12} y2={((i * 53) % 300) + 40} stroke="#64748b" strokeWidth={3} opacity={0.6} />
                ))}
            </motion.g>
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.g key="sitat" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }}>
                        <rect x={180} y={150} width={1240} height={150} rx={24} fill="#ffffff" opacity={0.96} />
                        <text x={800} y={222} textAnchor="middle" fontSize={40} fontStyle="italic" fontWeight={800} fill="#0f172a">
                            «Vi lever i gjørma, vi spiser gjørme, vi drømmer gjørme.»
                        </text>
                        <text x={800} y={274} textAnchor="middle" fontSize={28} fontWeight={700} fill="#64748b">
                            Britisk soldat, 1916
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

/* ---------- Fot: skyttergravsfot ---------- */

const FOT = 'M 600 160 L 760 160 L 760 520 C 820 570 930 590 1010 630 C 1050 650 1050 712 1000 716 L 590 716 C 540 716 528 676 540 640 L 600 520 Z';

function Fot({ beat }: { beat: number }) {
    const farge = beat === 1 ? '#d98c8c' : beat === 2 ? '#c98383' : '#e8b796';
    const vann = beat <= 2;
    const losning = beat >= 3;
    return (
        <g>
            <rect x={0} y={0} width={B} height={H} fill="#dde5ec" />
            <motion.g initial={false} animate={{ x: losning ? -260 : 0 }} transition={{ duration: 1 }}>
                <motion.g
                    initial={false}
                    animate={{ scale: beat === 1 || beat === 2 ? 1.1 : 1 }}
                    transition={{ duration: 2.4 }}
                    style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
                >
                    <motion.path d={FOT} initial={false} animate={{ fill: farge }} transition={{ duration: 2 }} stroke="#7c4a35" strokeWidth={6} />
                    {[0, 1, 2, 3].map((i) => (
                        <motion.circle
                            key={i}
                            cx={1000 - i * 34}
                            cy={672 - i * 14}
                            r={22 - i * 2}
                            initial={false}
                            animate={{ fill: beat === 2 ? '#3f2a2a' : farge }}
                            transition={{ duration: 1.6, delay: beat === 2 ? 0.8 + i * 0.4 : 0 }}
                            stroke="#7c4a35"
                            strokeWidth={4}
                        />
                    ))}
                </motion.g>
                {/* Vannet rundt foten */}
                <motion.rect x={420} y={470} width={760} height={300} fill="#5f7c8f" initial={false} animate={{ opacity: vann ? 0.55 : 0 }} transition={{ duration: 1 }} />
                <motion.line x1={420} y1={470} x2={1180} y2={470} stroke="#334155" strokeWidth={5} initial={false} animate={{ opacity: vann ? 1 : 0 }} />
            </motion.g>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.g key="kald" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.8 }}>
                        <Snofnugg x={1320} y={420} />
                        <Tekst x={1320} y={570} storrelse={50}>
                            Iskaldt
                        </Tekst>
                        <Tekst x={1320} y={630} storrelse={40} farge="#475569">
                            i dagevis
                        </Tekst>
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g key="hoven" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.6 }}>
                        <Tekst x={1340} y={400} storrelse={50}>
                            Hovner opp
                        </Tekst>
                        <Tekst x={1340} y={470} storrelse={50}>
                            Følelsesløs
                        </Tekst>
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g key="koldbrann" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 1.8 }}>
                        <Tekst x={1340} y={400} storrelse={54} farge="#7f1d1d">
                            Koldbrann
                        </Tekst>
                        <Tekst x={1340} y={465} storrelse={40} farge="#475569">
                            kjøttet dør
                        </Tekst>
                    </motion.g>
                )}
                {losning && (
                    <motion.g key="losning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                            <rect x={880} y={330} width={170} height={200} rx={20} fill="#fef3c7" stroke="#a16207" strokeWidth={6} />
                            <rect x={870} y={300} width={190} height={44} rx={10} fill="#a16207" />
                            <Tekst x={965} y={600} storrelse={42}>
                                Hvalfett
                            </Tekst>
                        </motion.g>
                        <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}>
                            <Sokk x={1210} y={320} />
                            <Sokk x={1330} y={320} />
                            <Tekst x={1300} y={600} storrelse={42}>
                                To ganger om dagen
                            </Tekst>
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

function Snofnugg({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`} stroke="#2563eb" strokeWidth={10} strokeLinecap="round">
            {[0, 60, 120].map((v) => (
                <line key={v} x1={0} y1={-70} x2={0} y2={70} transform={`rotate(${v})`} />
            ))}
        </g>
    );
}

function Sokk({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x} ${y} L ${x + 70} ${y} L ${x + 70} ${y + 140} C ${x + 70} ${y + 170}, ${x + 110} ${y + 170}, ${x + 110} ${y + 200} C ${x + 110} ${y + 230}, ${x + 40} ${y + 230}, ${x + 10} ${y + 200} C ${x} ${y + 190}, ${x} ${y + 160}, ${x} ${y + 140} Z`}
            fill="#e2e8f0"
            stroke="#475569"
            strokeWidth={6}
        />
    );
}

/* ---------- Avtale: to grøfter og Ingenmannsland ---------- */

const A_BAKKE = 540;

function Avtale({ beat }: { beat: number }) {
    return (
        <g>
            <rect x={0} y={0} width={B} height={A_BAKKE} fill="#b6c2cf" />
            <path
                d={`M 0 ${A_BAKKE} L 220 ${A_BAKKE} L 240 700 L 380 700 L 400 ${A_BAKKE} L 1200 ${A_BAKKE} L 1220 700 L 1360 700 L 1380 ${A_BAKKE} L ${B} ${A_BAKKE} L ${B} ${H} L 0 ${H} Z`}
                fill={JORD}
            />
            {/* Ingenmannsland: hull og piggtråd */}
            {[520, 700, 880, 1040].map((x, i) => (
                <ellipse key={x} cx={x} cy={A_BAKKE + 4} rx={50 + (i % 2) * 20} ry={18} fill="#4f4030" />
            ))}
            {[470, 1130].map((x) =>
                [0, 1, 2, 3].map((k) => (
                    <g key={`${x}${k}`} transform={`translate(${x + k * 30} ${A_BAKKE - 24})`} stroke="#1f1d1a" strokeWidth={4}>
                        <line x1={-12} y1={-12} x2={12} y2={12} />
                        <line x1={12} y1={-12} x2={-12} y2={12} />
                    </g>
                ))
            )}
            <Tekst x={310} y={800} storrelse={38}>
                Britene
            </Tekst>
            <Tekst x={1290} y={800} storrelse={38}>
                Tyskerne
            </Tekst>
            <Tekst x={800} y={640} storrelse={30} farge="#475569">
                Ingenmannsland
            </Tekst>
            <Figur x={280} y={700} farge="#6b6440" britisk />
            <Figur x={340} y={700} farge="#6b6440" britisk />
            <motion.g initial={false} animate={{ x: beat === 3 ? 60 : 0 }} transition={{ duration: 1.5, delay: 1.5 }}>
                <Figur x={1260} y={700} farge="#5c6258" />
                <Figur x={1320} y={700} farge="#5c6258" />
            </motion.g>

            {/* Beat 1: avtalen uten ord */}
            <motion.g {...vis(beat >= 1 && beat <= 2, 0.4)}>
                <motion.path
                    d={`M 330 520 Q 800 260 1290 520`}
                    fill="none"
                    stroke="#0f766e"
                    strokeWidth={7}
                    strokeDasharray="16 14"
                />
            </motion.g>
            <AnimatePresence>
                {beat === 1 && (
                    <motion.g key="avtale" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 1.2 }}>
                        <rect x={460} y={250} width={680} height={84} rx={22} fill="#0f766e" />
                        <text x={800} y={306} textAnchor="middle" fontSize={38} fontWeight={900} fill="#ffffff">
                            Vi dreper ikke hvis vi ikke må
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Beat 2: briten henter vann, snikskytteren lar være */}
            <AnimatePresence>
                {beat === 2 && (
                    <motion.g key="vann" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ellipse cx={110} cy={A_BAKKE + 6} rx={70} ry={14} fill="#3b6b8c" />
                        <motion.g initial={{ x: 240 }} animate={{ x: 140 }} transition={{ duration: 4, delay: 0.6, ease: 'linear' }}>
                            <Figur x={0} y={A_BAKKE} farge="#6b6440" britisk />
                            <rect x={22} y={A_BAKKE - 66} width={26} height={30} fill="#64748b" />
                        </motion.g>
                        <g transform={`translate(1240 ${A_BAKKE - 40})`}>
                            <circle r={44} fill="none" stroke="#0f172a" strokeWidth={6} />
                            <line x1={-56} y1={0} x2={56} y2={0} stroke="#0f172a" strokeWidth={4} />
                            <line x1={0} y1={-56} x2={0} y2={56} stroke="#0f172a" strokeWidth={4} />
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} stroke="#dc2626" strokeWidth={12} strokeLinecap="round">
                                <line x1={-50} y1={-50} x2={50} y2={50} />
                                <line x1={50} y1={-50} x2={-50} y2={50} />
                            </motion.g>
                        </g>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                            <Tekst x={1240} y={400} storrelse={32}>
                                Snikskytteren lar være
                            </Tekst>
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Beat 3: kanonene treffer samme sted til samme tid */}
            <AnimatePresence>
                {beat === 3 && (
                    <motion.g key="kanon" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <g transform={`translate(80 ${A_BAKKE})`}>
                            <circle cy={-22} r={22} fill="#334155" />
                            <rect x={0} y={-50} width={90} height={18} fill="#334155" transform="rotate(-25)" />
                        </g>
                        <motion.path
                            d={`M 150 ${A_BAKKE - 80} Q 640 40 1130 ${A_BAKKE - 6}`}
                            fill="none"
                            stroke="#b45309"
                            strokeWidth={6}
                            strokeDasharray="14 12"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, delay: 0.6 }}
                        />
                        <motion.circle
                            cx={1130}
                            cy={A_BAKKE - 10}
                            fill="#fbbf24"
                            initial={{ r: 0, opacity: 0 }}
                            animate={{ r: [0, 44, 30], opacity: [0, 1, 0.7] }}
                            transition={{ delay: 2.6, duration: 0.8 }}
                        />
                        <Klokke x={1130} y={300} />
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>
                            <Tekst x={1130} y={410} storrelse={32}>
                                Hver dag
                            </Tekst>
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Beat 4: tanken på begge sider */}
            <AnimatePresence>
                {beat === 4 && (
                    <motion.g key="tanke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.g initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
                            <rect x={130} y={250} width={600} height={90} rx={24} fill="#ffffff" />
                            <text x={430} y={309} textAnchor="middle" fontSize={36} fontWeight={900} fill="#0f172a">
                                Dreper jeg en av dem ...
                            </text>
                        </motion.g>
                        <motion.g initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }}>
                            <rect x={870} y={360} width={600} height={90} rx={24} fill="#ffffff" />
                            <text x={1170} y={419} textAnchor="middle" fontSize={36} fontWeight={900} fill="#b91c1c">
                                ... dreper de en av oss.
                            </text>
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>

            {/* Beat 5: regn, rotter, lus og gjørme på begge sider. Offiserene langt bak. */}
            <AnimatePresence>
                {beat >= 5 && (
                    <motion.g key="elendighet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {Array.from({ length: 34 }, (_, i) => (
                            <line key={i} x1={(i * 131) % B} y1={(i * 71) % 420} x2={((i * 131) % B) - 12} y2={((i * 71) % 420) + 44} stroke="#475569" strokeWidth={3} opacity={0.55} />
                        ))}
                        <Rotte x={300} y={690} />
                        <Rotte x={1300} y={690} />
                        {['Regn', 'Rotter', 'Lus', 'Gjørme'].map((t, i) => (
                            <motion.g key={t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.6 }}>
                                <rect x={500 + i * 155} y={220} width={140} height={62} rx={16} fill="#ffffff" />
                                <text x={570 + i * 155} y={262} textAnchor="middle" fontSize={32} fontWeight={900} fill="#0f172a">
                                    {t}
                                </text>
                            </motion.g>
                        ))}
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}>
                            <Figur x={70} y={A_BAKKE} farge="#3f3a25" offiser />
                            <Tekst x={40} y={380} anker="start" storrelse={30} farge="#7f1d1d">
                                Offiserene bak linjene
                            </Tekst>
                        </motion.g>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}

function Figur({ x, y, farge, britisk, offiser }: { x: number; y: number; farge: string; britisk?: boolean; offiser?: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-13} y={-74} width={26} height={60} rx={8} fill={farge} />
            <circle cy={-86} r={13} fill="#e0b48f" />
            {offiser ? (
                <rect x={-16} y={-104} width={32} height={10} rx={3} fill="#1f2937" />
            ) : britisk ? (
                <ellipse cy={-97} rx={22} ry={6} fill="#4a4a30" />
            ) : (
                <path d="M -15 -94 A 15 14 0 0 1 15 -94 Z" fill="#3f443c" />
            )}
            <rect x={-10} y={-16} width={8} height={16} fill="#3a3626" />
            <rect x={2} y={-16} width={8} height={16} fill="#3a3626" />
        </g>
    );
}

function Rotte({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <ellipse rx={26} ry={13} cy={-13} fill="#3f3f46" />
            <circle cx={24} cy={-18} r={9} fill="#3f3f46" />
            <path d="M -26 -10 Q -50 -4 -58 -18" fill="none" stroke="#3f3f46" strokeWidth={4} />
        </g>
    );
}

function Klokke({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={50} fill="#ffffff" stroke="#0f172a" strokeWidth={7} />
            <line x1={0} y1={0} x2={0} y2={-32} stroke="#0f172a" strokeWidth={7} strokeLinecap="round" />
            <line x1={0} y1={0} x2={24} y2={10} stroke="#0f172a" strokeWidth={7} strokeLinecap="round" />
        </g>
    );
}
