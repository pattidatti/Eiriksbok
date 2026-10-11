import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Pengene etter Bretton Woods, tegnet som enkle SVG-figurer.
 * «kjede»: gull, dollar, og de andre valutaene som henger i dollaren.
 * «banker»: IMF (legevakten med regler) og Verdensbanken (veier, kraftverk, havner).
 * «stemmer»: én stemme hver i FN mot stemmer etter penger i IMF. Ingen tall: figuren
 * viser prinsippet, ikke de faktiske kvotene.
 */

type Modus = 'kjede' | 'banker' | 'stemmer';

const inn = (forsinkelse = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: forsinkelse, type: 'spring' as const, stiffness: 200, damping: 22 },
});

export function VerdenDollar({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'kjede';
    return (
        <div className="absolute inset-0 bg-[#f6f1e4] overflow-hidden">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'kjede' && <Kjede beat={beat} />}
                {modus === 'banker' && <Banker beat={beat} />}
                {modus === 'stemmer' && <Stemmer beat={beat} />}
            </svg>
        </div>
    );
}

function Tekst({
    x,
    y,
    children,
    size = 40,
    farge = '#0f172a',
    vekt = 900,
}: {
    x: number;
    y: number;
    children: React.ReactNode;
    size?: number;
    farge?: string;
    vekt?: number;
}) {
    return (
        <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={vekt} fill={farge}>
            {children}
        </text>
    );
}

/* ---------------- Kjede: gull → dollar → andre valutaer ---------------- */

function Gullbarre({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -110 40 L -70 -40 L 70 -40 L 110 40 Z" fill="#facc15" stroke="#a16207" strokeWidth={6} />
            <path d="M -70 -40 L 70 -40 L 56 -20 L -56 -20 Z" fill="#fde68a" />
            <Tekst x={0} y={100} size={42}>
                Gull
            </Tekst>
        </g>
    );
}

function Dollar({ x, y, r = 110, glod = false }: { x: number; y: number; r?: number; glod?: boolean }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {glod && (
                <motion.circle
                    r={r + 30}
                    fill="#86efac"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.55, 0.2] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                />
            )}
            <circle r={r} fill="#16a34a" stroke="#14532d" strokeWidth={8} />
            <circle r={r - 18} fill="none" stroke="#bbf7d0" strokeWidth={4} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={r * 1.25} fontWeight={900} fill="#ffffff">
                $
            </text>
        </g>
    );
}

const VALUTAER = [
    { navn: 'Kronen', tegn: 'kr', y: 220 },
    { navn: 'Pundet', tegn: '£', y: 450 },
    { navn: 'Francen', tegn: '₣', y: 680 },
];

const VARER = [
    { navn: 'Olje', x: 1000 },
    { navn: 'Korn', x: 1220 },
    { navn: 'Maskiner', x: 1440 },
];

function Kjede({ beat }: { beat: number }) {
    const dollarX = beat === 2 ? 800 : beat >= 3 ? 480 : 720;
    const svak = beat >= 3 ? 0 : beat >= 2 ? 0.35 : 1;
    return (
        <g>
            <motion.g animate={{ opacity: svak }}>
                <Gullbarre x={260} y={450} />
            </motion.g>
            <motion.g {...inn(0.3)}>
                <motion.path
                    d="M 400 450 L 580 450"
                    stroke="#a16207"
                    strokeWidth={10}
                    strokeDasharray="22 14"
                    animate={{ opacity: svak }}
                />
                <motion.text
                    x={490}
                    y={410}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#713f12"
                    animate={{ opacity: svak }}
                >
                    kan veksles
                </motion.text>
            </motion.g>
            <motion.g
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: beat === 2 ? 1.5 : beat >= 3 ? 1.2 : 1, opacity: 1, x: dollarX - 720 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                style={{ transformOrigin: '720px 450px' }}
            >
                <Dollar x={720} y={450} glod={beat >= 2} />
            </motion.g>
            {beat >= 2 && (
                <motion.g {...inn(0.4)}>
                    <Tekst x={beat >= 3 ? 480 : 800} y={160} size={64}>
                        Verdens penger
                    </Tekst>
                </motion.g>
            )}
            {beat === 1 &&
                VALUTAER.map((v, i) => (
                    <motion.g key={v.navn} {...inn(0.4 + i * 0.6)}>
                        <path
                            d={`M 840 450 Q 1000 ${(450 + v.y) / 2} 1140 ${v.y}`}
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth={8}
                        />
                        <circle cx={1220} cy={v.y} r={78} fill="#e2e8f0" stroke="#475569" strokeWidth={6} />
                        <text x={1220} y={v.y} textAnchor="middle" dominantBaseline="central" fontSize={64} fontWeight={900} fill="#334155">
                            {v.tegn}
                        </text>
                        <Tekst x={1400} y={v.y + 14} size={40}>
                            {v.navn}
                        </Tekst>
                    </motion.g>
                ))}
            {beat >= 3 &&
                VARER.map((v, i) => (
                    <motion.g key={v.navn} {...inn(0.3 + i * 0.6)}>
                        <rect x={v.x - 90} y={300} width={180} height={300} rx={22} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
                        <Vareikon navn={v.navn} x={v.x} y={410} />
                        <Tekst x={v.x} y={540} size={36}>
                            {v.navn}
                        </Tekst>
                        <circle cx={v.x + 80} cy={310} r={36} fill="#16a34a" />
                        <text x={v.x + 80} y={310} textAnchor="middle" dominantBaseline="central" fontSize={44} fontWeight={900} fill="#fff">
                            $
                        </text>
                    </motion.g>
                ))}
            {beat >= 3 && (
                <motion.g {...inn(2)}>
                    <Tekst x={1220} y={700} size={38} farge="#14532d">
                        Kjøpe fra utlandet? Trenger dollar.
                    </Tekst>
                </motion.g>
            )}
        </g>
    );
}

function Vareikon({ navn, x, y }: { navn: string; x: number; y: number }) {
    if (navn === 'Olje')
        return (
            <g transform={`translate(${x} ${y})`}>
                <rect x={-42} y={-60} width={84} height={120} rx={10} fill="#1f2937" />
                <rect x={-42} y={-24} width={84} height={8} fill="#64748b" />
                <rect x={-42} y={18} width={84} height={8} fill="#64748b" />
            </g>
        );
    if (navn === 'Korn')
        return (
            <g transform={`translate(${x} ${y})`} stroke="#a16207" strokeWidth={6} fill="#facc15">
                {[-30, 0, 30].map((dx) => (
                    <g key={dx}>
                        <line x1={dx} y1={60} x2={dx} y2={-20} />
                        {[0, 1, 2].map((k) => (
                            <ellipse key={k} cx={dx} cy={-30 - k * 18} rx={10} ry={14} />
                        ))}
                    </g>
                ))}
            </g>
        );
    return (
        <g transform={`translate(${x} ${y})`}>
            <circle r={48} fill="#64748b" />
            {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x={-10} y={-64} width={20} height={24} fill="#64748b" transform={`rotate(${i * 45})`} />
            ))}
            <circle r={18} fill="#ffffff" />
        </g>
    );
}

/* ---------------- Banker: IMF og Verdensbanken ---------------- */

function Bygning({ x, tittel, aktiv }: { x: number; tittel: string; aktiv: boolean }) {
    return (
        <motion.g animate={{ opacity: aktiv ? 1 : 0.4 }} transition={{ duration: 0.6 }}>
            <path d={`M ${x - 200} 300 L ${x} 200 L ${x + 200} 300 Z`} fill="#e2e8f0" stroke="#334155" strokeWidth={6} />
            <rect x={x - 190} y={300} width={380} height={24} fill="#cbd5e1" stroke="#334155" strokeWidth={5} />
            {[-140, -70, 0, 70, 140].map((dx) => (
                <rect key={dx} x={x + dx - 16} y={324} width={32} height={170} fill="#f8fafc" stroke="#334155" strokeWidth={4} />
            ))}
            <rect x={x - 210} y={494} width={420} height={30} fill="#cbd5e1" stroke="#334155" strokeWidth={5} />
            <Tekst x={x} y={180} size={50}>
                {tittel}
            </Tekst>
        </motion.g>
    );
}

function Banker({ beat }: { beat: number }) {
    return (
        <g>
            <motion.g {...inn(0)}>
                <Bygning x={460} tittel="IMF" aktiv={beat <= 2} />
            </motion.g>
            <motion.g {...inn(0.7)}>
                <Bygning x={1140} tittel="Verdensbanken" aktiv={beat === 0 || beat === 3} />
            </motion.g>
            {beat === 0 && (
                <motion.g {...inn(1.4)}>
                    <Tekst x={800} y={640} size={40} farge="#475569">
                        Bestemt i Bretton Woods, 1944
                    </Tekst>
                </motion.g>
            )}
            {beat >= 1 && beat <= 2 && (
                <motion.g {...inn(0.2)}>
                    {/* Legevakt-korset */}
                    <rect x={430} y={380} width={60} height={160} fill="#dc2626" transform="translate(0 -40)" />
                    <rect x={380} y={410} width={160} height={60} fill="#dc2626" />
                    <Tekst x={460} y={600} size={40} farge="#b91c1c">
                        Legevakt for land i krise
                    </Tekst>
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g {...inn(1)}>
                    {[0, 1, 2].map((i) => (
                        <motion.circle
                            key={i}
                            r={18}
                            fill="#16a34a"
                            initial={{ cx: 520, cy: 700 }}
                            animate={{ cx: [520, 780], cy: [700, 760] }}
                            transition={{ delay: 1.2 + i * 0.4, duration: 1.4, repeat: Infinity, repeatDelay: 0.8 }}
                        />
                    ))}
                    <rect x={780} y={700} width={230} height={110} rx={12} fill="#fde68a" stroke="#a16207" strokeWidth={5} />
                    <Tekst x={895} y={768} size={32}>
                        Land i krise
                    </Tekst>
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g {...inn(0.4)}>
                    <rect x={720} y={640} width={360} height={200} rx={14} fill="#ffffff" stroke="#334155" strokeWidth={5} />
                    <Tekst x={900} y={690} size={34}>
                        Legens ordre:
                    </Tekst>
                    {['Styr pengene slik', 'fondet sier'].map((l, i) => (
                        <Tekst key={l} x={900} y={745 + i * 46} size={32} vekt={700} farge="#475569">
                            {l}
                        </Tekst>
                    ))}
                </motion.g>
            )}
            {beat === 3 &&
                ['Veier', 'Kraftverk', 'Havner'].map((n, i) => (
                    <motion.g key={n} {...inn(0.4 + i * 0.6)}>
                        <rect x={900 + i * 170} y={600} width={150} height={190} rx={18} fill="#ffffff" stroke="#cbd5e1" strokeWidth={4} />
                        <Byggikon navn={n} x={975 + i * 170} y={680} />
                        <Tekst x={975 + i * 170} y={765} size={30}>
                            {n}
                        </Tekst>
                    </motion.g>
                ))}
            {beat === 3 && (
                <motion.g {...inn(0.2)}>
                    <Tekst x={460} y={690} size={38} farge="#475569">
                        Lån til gjenoppbygging
                    </Tekst>
                    <Tekst x={460} y={740} size={38} farge="#475569">
                        og til fattige land
                    </Tekst>
                </motion.g>
            )}
        </g>
    );
}

function Byggikon({ navn, x, y }: { navn: string; x: number; y: number }) {
    if (navn === 'Veier')
        return (
            <g transform={`translate(${x} ${y})`}>
                <path d="M -20 -50 L 20 -50 L 50 40 L -50 40 Z" fill="#475569" />
                {[-35, -5, 22].map((yy) => (
                    <rect key={yy} x={-3} y={yy} width={6} height={14} fill="#fde047" />
                ))}
            </g>
        );
    if (navn === 'Kraftverk')
        return (
            <g transform={`translate(${x} ${y})`}>
                <path d="M 6 -55 L -26 4 L -2 4 L -10 50 L 26 -12 L 2 -12 Z" fill="#f59e0b" stroke="#92400e" strokeWidth={4} />
            </g>
        );
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -52 10 L 52 10 L 38 40 L -38 40 Z" fill="#1e40af" />
            <rect x={-30} y={-20} width={30} height={30} fill="#f97316" />
            <rect x={4} y={-20} width={30} height={30} fill="#16a34a" />
            <rect x={-12} y={-50} width={30} height={30} fill="#eab308" />
        </g>
    );
}

/* ---------------- Stemmer: FN mot IMF ---------------- */

/** Ulike store land. Høydene er bare for å vise prinsippet, ikke faktiske kvoter. */
const LAND = [1, 0.18, 0.5, 0.12, 0.42, 0.08, 0.3, 0.1];

function Stemmer({ beat }: { beat: number }) {
    const venstre = 120;
    const hoyre = 880;
    const bunn = 760;
    return (
        <g>
            <Tekst x={venstre + 300} y={130} size={46}>
                FN: én stemme hver
            </Tekst>
            {LAND.map((_, i) => (
                <motion.g key={i} {...inn(0.2 + i * 0.12)}>
                    <rect x={venstre + i * 76} y={bunn - 120} width={56} height={120} rx={8} fill="#38bdf8" />
                    <circle cx={venstre + 28 + i * 76} cy={bunn - 150} r={14} fill="#0369a1" />
                </motion.g>
            ))}
            <line x1={800} y1={170} x2={800} y2={820} stroke="#cbd5e1" strokeWidth={4} />
            {beat >= 1 && (
                <motion.g {...inn(0.2)}>
                    <Tekst x={hoyre + 300} y={130} size={46}>
                        IMF: stemmer etter kvote
                    </Tekst>
                </motion.g>
            )}
            {beat >= 1 &&
                LAND.map((andel, i) => {
                    const h = beat >= 2 ? 40 + andel * 440 : 120;
                    const usa = beat >= 3 && i === 0;
                    const stor = beat >= 3 && andel >= 0.4;
                    return (
                        <motion.rect
                            key={i}
                            x={hoyre + i * 76}
                            width={56}
                            rx={8}
                            initial={{ y: bunn - 120, height: 120, opacity: 0 }}
                            animate={{
                                y: bunn - h,
                                height: h,
                                opacity: 1,
                                fill: usa ? '#2563eb' : stor ? '#60a5fa' : '#94a3b8',
                            }}
                            transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 90, damping: 18 }}
                        />
                    );
                })}
            {beat === 2 && (
                <motion.g {...inn(1)}>
                    <Tekst x={hoyre + 330} y={190} size={32} vekt={700} farge="#475569">
                        større økonomi + mer handel = flere stemmer
                    </Tekst>
                </motion.g>
            )}
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.g key="usa" {...inn(0.5)}>
                        <Tekst x={hoyre + 28} y={bunn - 500} size={34} farge="#1d4ed8">
                            USA
                        </Tekst>
                        <Tekst x={hoyre + 300} y={850} size={32} vekt={700} farge="#1d4ed8">
                            Mest makt: USA og store industriland
                        </Tekst>
                        <Tekst x={hoyre + 300} y={150 + 50} size={32} vekt={700} farge="#475569">
                            Verdensbanken: alltid en amerikansk sjef
                        </Tekst>
                    </motion.g>
                )}
            </AnimatePresence>
            <line x1={venstre - 20} y1={bunn} x2={venstre + 620} y2={bunn} stroke="#334155" strokeWidth={4} />
            <line x1={hoyre - 20} y1={bunn} x2={hoyre + 620} y2={bunn} stroke="#334155" strokeWidth={4} />
        </g>
    );
}
