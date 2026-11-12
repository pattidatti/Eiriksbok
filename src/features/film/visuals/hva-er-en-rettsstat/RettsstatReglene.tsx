import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { Ikon } from './ikoner';

/**
 * Reglene i rettsstaten, én om gangen.
 * «likhet»: vekta med statsministeren og bussjåføren (§ 98).
 * «tid»: legalitetsprinsippet, sjekklista for en lov, og tidslinja der en ny lov ikke kan gå
 * bakover (§ 97).
 * «bevis»: hvem som må bevise (§ 96), og den upartiske dommeren (§ 95).
 * «tvil»: hvorfor reglene beskytter også de skyldige.
 */

type Modus = 'likhet' | 'tid' | 'bevis' | 'tvil';

const OVERSKRIFT: Record<Modus, string[]> = {
    likhet: ['Regel 1: Like for loven', 'Samme lov for alle', 'Ikke mildere, ikke strengere'],
    tid: ['Regel 2: Ingen straff uten lov', 'Loven må stå skrevet', 'Flere måter å forstå loven?', 'Ingen lov bakover i tid', 'Ingen lov bakover i tid'],
    bevis: ['Regel 3: Uskyldig til det motsatte er bevist', 'Hvem må bevise?', 'Regel 4: Uavhengige domstoler', 'Upartisk'],
    tvil: ['For snill?', 'Hvem er skyldig?', 'Mennesker tar feil', 'Gevinst og pris', 'Trygghet for alle'],
};

function Kort({ x, y, b, h, farge = '#0f172a', fyll = '#fff', children }: { x: number; y: number; b: number; h: number; farge?: string; fyll?: string; children: ReactNode }) {
    return (
        <g>
            <rect x={x} y={y} width={b} height={h} rx={20} fill={fyll} stroke={farge} strokeWidth={6} />
            {children}
        </g>
    );
}

function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={22} fill="#dc2626" />
            <path d="M -9 -9 L 9 9 M 9 -9 L -9 9" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
        </g>
    );
}

function Hake({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={22} fill="#0d9488" />
            <path d="M -10 0 L -2 9 L 11 -8" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
    );
}

const inn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 } };

function Likhet({ beat }: { beat: number }) {
    const VX = 520;
    const HX = 1080;
    return (
        <>
            <Kort x={560} y={130} b={480} h={110} farge="#1e3a8a">
                <text x={800} y={202} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                    Grunnloven § 98
                </text>
            </Kort>
            {/* Vekta */}
            <rect x={785} y={330} width={30} height={420} fill="#475569" />
            <rect x={680} y={740} width={240} height={30} rx={8} fill="#475569" />
            <motion.g
                animate={{ rotate: beat === 1 ? [0, -4, 3, -1.5, 0] : 0 }}
                transition={{ duration: 2.4 }}
                style={{ originX: '800px', originY: '330px' }}
            >
                <rect x={VX} y={320} width={HX - VX} height={18} rx={9} fill="#334155" />
                {[VX, HX].map((x) => (
                    <g key={x}>
                        <line x1={x} y1={330} x2={x - 110} y2={600} stroke="#64748b" strokeWidth={4} />
                        <line x1={x} y1={330} x2={x + 110} y2={600} stroke="#64748b" strokeWidth={4} />
                        <path d={`M ${x - 140} 600 L ${x + 140} 600 Q ${x} 660 ${x - 140} 600 Z`} fill="#94a3b8" />
                    </g>
                ))}
                {beat >= 1 && (
                    <>
                        <motion.g {...inn}>
                            <g transform={`translate(${VX} 535) scale(1.1)`}>
                                <Ikon type="statsminister" />
                            </g>
                        </motion.g>
                        <motion.g {...inn} transition={{ delay: 0.4, duration: 0.6 }}>
                            <g transform={`translate(${HX} 535) scale(1.1)`}>
                                <Ikon type="sjafor" />
                            </g>
                        </motion.g>
                    </>
                )}
            </motion.g>
            {beat === 0 && (
                <motion.text {...inn} x={800} y={850} textAnchor="middle" fontSize={44} fontWeight={800} fill="#0f172a">
                    Alle er like for loven
                </motion.text>
            )}
            {beat >= 1 && (
                <>
                    <text x={VX} y={710} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f172a">
                        Statsminister
                    </text>
                    <text x={HX} y={710} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f172a">
                        Bussjåfør
                    </text>
                </>
            )}
            {beat >= 2 &&
                ['rik', 'kjent', 'viktig jobb'].map((t, i) => {
                    const x = 300 + i * 360;
                    return (
                        <motion.g key={t} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.6 }}>
                            <rect x={x} y={790} width={280} height={70} rx={35} fill="#fef3c7" stroke="#b45309" strokeWidth={4} />
                            <text x={x + 120} y={837} textAnchor="middle" fontSize={34} fontWeight={700} fill="#78350f">
                                {t}
                            </text>
                            <Kryss x={x + 245} y={825} />
                        </motion.g>
                    );
                })}
        </>
    );
}

function Tid({ beat }: { beat: number }) {
    if (beat <= 2) {
        return (
            <motion.g key="lov" {...inn}>
                {beat === 0 && (
                    <>
                        <Kort x={180} y={300} b={560} h={240} farge="#1e3a8a">
                            <text x={460} y={400} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                                Ingen dom
                            </text>
                            <text x={460} y={460} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                                uten lov
                            </text>
                        </Kort>
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                            <Kort x={860} y={300} b={560} h={240} farge="#1e3a8a">
                                <text x={1140} y={400} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                                    Ingen fengsel
                                </text>
                                <text x={1140} y={460} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                                    uten dom
                                </text>
                            </Kort>
                        </motion.g>
                        <text x={800} y={680} textAnchor="middle" fontSize={50} fontWeight={800} fill="#0f172a">
                            Legalitetsprinsippet
                        </text>
                    </>
                )}
                {beat >= 1 && (
                    <>
                        {/* Lovarket */}
                        <rect x={180} y={170} width={420} height={600} rx={14} fill="#fff" stroke="#334155" strokeWidth={6} />
                        <text x={390} y={250} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                            LOV
                        </text>
                        {[310, 370, 430, 490, 550, 610, 670].map((y, i) => (
                            <line key={y} x1={230} y1={y} x2={i % 3 === 2 ? 470 : 550} y2={y} stroke="#cbd5e1" strokeWidth={10} strokeLinecap="round" />
                        ))}
                    </>
                )}
                {beat === 1 &&
                    ['Står i en skrevet lov', 'Lett å finne', 'Lett å forstå'].map((t, i) => (
                        <motion.g key={t} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.8 }}>
                            <Hake x={720} y={330 + i * 150} />
                            <text x={770} y={343 + i * 150} fontSize={42} fontWeight={700} fill="#0f172a">
                                {t}
                            </text>
                        </motion.g>
                    ))}
                {beat === 2 && (
                    <>
                        <motion.path d="M 600 470 C 720 470 720 330 860 330" fill="none" stroke="#b45309" strokeWidth={8} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                        <motion.path d="M 600 470 C 720 470 720 610 860 610" fill="none" stroke="#7c3aed" strokeWidth={8} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                        <Kort x={870} y={280} b={300} h={100} farge="#b45309">
                            <text x={1020} y={344} textAnchor="middle" fontSize={36} fontWeight={700} fill="#78350f">
                                Én måte
                            </text>
                        </Kort>
                        <Kort x={870} y={560} b={300} h={100} farge="#7c3aed">
                            <text x={1020} y={624} textAnchor="middle" fontSize={36} fontWeight={700} fill="#4c1d95">
                                En annen måte
                            </text>
                        </Kort>
                        <motion.g initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.3 }} style={{ originX: '1360px', originY: '470px' }}>
                            <rect x={1220} y={390} width={300} height={160} rx={22} fill="#0d9488" />
                            <text x={1370} y={460} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fff">
                                Den anklagede
                            </text>
                            <text x={1370} y={510} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fff">
                                går fri
                            </text>
                        </motion.g>
                    </>
                )}
            </motion.g>
        );
    }
    // Tidslinja
    const FJOR = 430;
    const DAG = 1170;
    return (
        <motion.g key="tid" {...inn}>
            <Kort x={540} y={130} b={520} h={110} farge="#1e3a8a">
                <text x={800} y={202} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                    Grunnloven § 97
                </text>
            </Kort>
            <line x1={180} y1={620} x2={1420} y2={620} stroke="#334155" strokeWidth={10} />
            <path d="M 1420 600 L 1460 620 L 1420 640 Z" fill="#334155" />
            <text x={1440} y={690} textAnchor="end" fontSize={30} fontWeight={600} fill="#64748b">
                tid
            </text>
            <g>
                <circle cx={DAG} cy={620} r={26} fill="#1e3a8a" />
                <text x={DAG} y={700} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                    I dag
                </text>
                <rect x={DAG - 150} y={440} width={300} height={100} rx={18} fill="#1e3a8a" />
                <text x={DAG} y={504} textAnchor="middle" fontSize={38} fontWeight={800} fill="#fff">
                    Ny lov
                </text>
            </g>
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                    <circle cx={FJOR} cy={620} r={26} fill="#b45309" />
                    <text x={FJOR} y={700} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                        I fjor
                    </text>
                    <rect x={FJOR - 170} y={440} width={340} height={100} rx={18} fill="#fff" stroke="#b45309" strokeWidth={6} />
                    <text x={FJOR} y={504} textAnchor="middle" fontSize={36} fontWeight={700} fill="#78350f">
                        Du gjorde noe
                    </text>
                    <motion.path
                        d={`M ${DAG - 40} 420 C ${DAG - 200} 300 ${FJOR + 200} 300 ${FJOR + 40} 420`}
                        fill="none"
                        stroke="#dc2626"
                        strokeWidth={8}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.4 }}
                    />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                        <Kryss x={800} y={330} />
                        <text x={800} y={800} textAnchor="middle" fontSize={40} fontWeight={800} fill="#991b1b">
                            Du kan ikke straffes for det
                        </text>
                    </motion.g>
                </motion.g>
            )}
        </motion.g>
    );
}

function Bevis({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <motion.g key="b" {...inn}>
                <Kort x={560} y={130} b={480} h={110} farge="#1e3a8a">
                    <text x={800} y={202} textAnchor="middle" fontSize={44} fontWeight={800} fill="#1e3a8a">
                        Grunnloven § 96
                    </text>
                </Kort>
                <motion.g animate={{ x: beat >= 1 ? -380 : 0 }} transition={{ duration: 1 }}>
                    <g transform="translate(800 560) scale(1.5)">
                        <Ikon type="person" farge="#475569" />
                    </g>
                    <rect x={650} y={330} width={300} height={70} rx={35} fill="#0d9488" />
                    <text x={800} y={378} textAnchor="middle" fontSize={36} fontWeight={800} fill="#fff">
                        uskyldig
                    </text>
                    <text x={800} y={720} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f172a">
                        {beat >= 1 ? 'Den anklagede' : 'til skyld er bevist'}
                    </text>
                    {beat >= 1 && (
                        <text x={800} y={770} textAnchor="middle" fontSize={32} fontWeight={600} fill="#475569">
                            trenger ikke bevise noe
                        </text>
                    )}
                </motion.g>
                {beat >= 1 && (
                    <motion.g initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
                        <g transform="translate(1180 520) scale(1.3)">
                            <Ikon type="regjering" farge="#1e3a8a" />
                        </g>
                        <rect x={1060} y={600} width={240} height={90} rx={10} fill="#fde68a" stroke="#b45309" strokeWidth={5} />
                        <text x={1180} y={658} textAnchor="middle" fontSize={36} fontWeight={800} fill="#78350f">
                            BEVIS
                        </text>
                        <text x={1180} y={740} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f172a">
                            Staten
                        </text>
                        <text x={1180} y={790} textAnchor="middle" fontSize={32} fontWeight={600} fill="#1e3a8a">
                            må bevise skyld
                        </text>
                    </motion.g>
                )}
            </motion.g>
        );
    }
    return (
        <motion.g key="d" {...inn}>
            <Kort x={430} y={120} b={740} h={110} farge="#7c3aed">
                <text x={800} y={192} textAnchor="middle" fontSize={40} fontWeight={800} fill="#4c1d95">
                    § 95: uavhengig og upartisk
                </text>
            </Kort>
            {/* Dommerbordet */}
            <rect x={620} y={470} width={360} height={150} rx={10} fill="#78350f" />
            <rect x={600} y={455} width={400} height={26} rx={8} fill="#92400e" />
            <g transform="translate(800 410) scale(1.2)">
                <Ikon type="dommer" />
            </g>
            <text x={800} y={680} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f172a">
                Dommeren
            </text>
            <g transform="translate(300 600) scale(1.1)">
                <Ikon type="regjering" farge="#1e3a8a" />
            </g>
            <text x={300} y={700} textAnchor="middle" fontSize={34} fontWeight={700} fill="#0f172a">
                Staten
            </text>
            <g transform="translate(1300 600) scale(1.1)">
                <Ikon type="person" farge="#475569" />
            </g>
            <text x={1300} y={700} textAnchor="middle" fontSize={34} fontWeight={700} fill="#0f172a">
                Den anklagede
            </text>
            {beat === 2 && (
                <motion.text {...inn} x={800} y={790} textAnchor="middle" fontSize={36} fontWeight={700} fill="#4c1d95">
                    Saken avgjøres innen rimelig tid
                </motion.text>
            )}
            {beat >= 3 && (
                <motion.g {...inn}>
                    <line x1={720} y1={540} x2={400} y2={600} stroke="#7c3aed" strokeWidth={6} strokeDasharray="14 10" />
                    <line x1={880} y1={540} x2={1200} y2={600} stroke="#7c3aed" strokeWidth={6} strokeDasharray="14 10" />
                    <rect x={430} y={740} width={740} height={90} rx={20} fill="#4c1d95" />
                    <text x={800} y={798} textAnchor="middle" fontSize={34} fontWeight={700} fill="#fff">
                        Holder ikke med noen på forhånd
                    </text>
                </motion.g>
            )}
        </motion.g>
    );
}

const REKKE = [360, 580, 800, 1020, 1240];

function Tvil({ beat }: { beat: number }) {
    if (beat === 3) {
        return (
            <motion.g key="pris" {...inn}>
                <Kort x={170} y={260} b={600} h={380} farge="#0d9488">
                    <text x={470} y={350} textAnchor="middle" fontSize={44} fontWeight={800} fill="#0f766e">
                        Gevinsten
                    </text>
                    <text x={470} y={450} textAnchor="middle" fontSize={34} fontWeight={600} fill="#0f172a">
                        Vanskeligere å
                    </text>
                    <text x={470} y={500} textAnchor="middle" fontSize={34} fontWeight={600} fill="#0f172a">
                        dømme feil person
                    </text>
                </Kort>
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                    <Kort x={830} y={260} b={600} h={380} farge="#b45309">
                        <text x={1130} y={350} textAnchor="middle" fontSize={44} fontWeight={800} fill="#92400e">
                            Prisen
                        </text>
                        <text x={1130} y={450} textAnchor="middle" fontSize={34} fontWeight={600} fill="#0f172a">
                            Av og til vanskeligere
                        </text>
                        <text x={1130} y={500} textAnchor="middle" fontSize={34} fontWeight={600} fill="#0f172a">
                            å dømme den riktige
                        </text>
                    </Kort>
                </motion.g>
            </motion.g>
        );
    }
    if (beat >= 4) {
        return (
            <motion.g key="trygg" {...inn}>
                <g transform="translate(800 400)">
                    <rect x={-240} y={-170} width={480} height={300} rx={12} fill="#fff" stroke="#334155" strokeWidth={6} />
                    <line x1={0} y1={-170} x2={0} y2={130} stroke="#334155" strokeWidth={6} />
                    {[-110, -60, -10, 40, 90].map((y) => (
                        <g key={y}>
                            <line x1={-200} y1={y} x2={-40} y2={y} stroke="#cbd5e1" strokeWidth={10} strokeLinecap="round" />
                            <line x1={40} y1={y} x2={200} y2={y} stroke="#cbd5e1" strokeWidth={10} strokeLinecap="round" />
                        </g>
                    ))}
                    <rect x={-120} y={-230} width={240} height={60} rx={14} fill="#1e3a8a" />
                    <text x={0} y={-188} textAnchor="middle" fontSize={32} fontWeight={800} fill="#fff">
                        LOVEN
                    </text>
                </g>
                {[
                    { x: 360, t: 'deg', f: '#0d9488' },
                    { x: 800, t: 'naboen din', f: '#b45309' },
                    { x: 1240, t: 'alle andre', f: '#7c3aed' },
                ].map((p, i) => (
                    <motion.g key={p.t} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.5 }}>
                        <g transform={`translate(${p.x} ${i === 1 ? 680 : 640})`}>
                            <Ikon type="person" farge={p.f} />
                        </g>
                        <text x={p.x} y={i === 1 ? 790 : 750} textAnchor="middle" fontSize={36} fontWeight={700} fill="#0f172a">
                            {p.t}
                        </text>
                    </motion.g>
                ))}
                <text x={800} y={860} textAnchor="middle" fontSize={34} fontWeight={700} fill="#1e3a8a">
                    Du vet på forhånd hvor grensene går
                </text>
            </motion.g>
        );
    }
    return (
        <motion.g key="rekke" {...inn}>
            {/* Vegg med høydestreker, som på et politibilde */}
            <rect x={200} y={230} width={1200} height={520} fill="#e2e8f0" />
            {[300, 380, 460, 540, 620, 700].map((y) => (
                <line key={y} x1={200} y1={y} x2={1400} y2={y} stroke="#94a3b8" strokeWidth={3} />
            ))}
            {REKKE.map((x, i) => {
                const mistenkt = beat === 2 && i === 3;
                return (
                    <g key={x}>
                        <g transform={`translate(${x} 640) scale(1.4)`}>
                            <Ikon type="person" farge={mistenkt ? '#ea580c' : '#475569'} />
                        </g>
                        <text x={x} y={520} textAnchor="middle" fontSize={56} fontWeight={900} fill={mistenkt ? '#ea580c' : '#334155'}>
                            ?
                        </text>
                    </g>
                );
            })}
            {beat === 0 && (
                <motion.g {...inn}>
                    {['advokat', 'rettssak'].map((t, i) => (
                        <g key={t}>
                            <rect x={440 + i * 420} y={790} width={300} height={70} rx={35} fill="#fff" stroke="#1e3a8a" strokeWidth={4} />
                            <text x={590 + i * 420} y={837} textAnchor="middle" fontSize={34} fontWeight={700} fill="#1e3a8a">
                                {t}
                            </text>
                        </g>
                    ))}
                </motion.g>
            )}
            {beat === 1 && (
                <>
                    <motion.g animate={{ x: [0, 880, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
                        <circle cx={360} cy={420} r={80} fill="#ffffff55" stroke="#0f172a" strokeWidth={12} />
                        <line x1={415} y1={477} x2={480} y2={545} stroke="#0f172a" strokeWidth={18} strokeLinecap="round" />
                    </motion.g>
                    <motion.text {...inn} x={800} y={830} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                        Det skal rettssaken finne ut
                    </motion.text>
                </>
            )}
            {beat === 2 && (
                <motion.g {...inn}>
                    <rect x={220} y={770} width={520} height={90} rx={22} fill="#fff" stroke="#ea580c" strokeWidth={5} />
                    <text x={480} y={828} textAnchor="middle" fontSize={34} fontWeight={700} fill="#9a3412">
                        Vitner husker galt
                    </text>
                    <rect x={790} y={770} width={590} height={90} rx={22} fill="#fff" stroke="#ea580c" strokeWidth={5} />
                    <text x={1085} y={828} textAnchor="middle" fontSize={34} fontWeight={700} fill="#9a3412">
                        Bevis kan se sikrere ut
                    </text>
                </motion.g>
            )}
        </motion.g>
    );
}

export function RettsstatReglene({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'likhet';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-slate-100">
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    {modus === 'likhet' && <Likhet key="l" beat={beat} />}
                    {modus === 'tid' && <Tid key={beat <= 2 ? 't1' : 't2'} beat={beat} />}
                    {modus === 'bevis' && <Bevis key={beat <= 1 ? 'b1' : 'b2'} beat={beat} />}
                    {modus === 'tvil' && <Tvil key={beat === 3 ? 'v2' : beat >= 4 ? 'v3' : 'v1'} beat={beat} />}
                </AnimatePresence>
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
