import { AnimatePresence, motion } from 'framer-motion';
import { Ban, Coins, Factory, Landmark, Percent, Shield, ShoppingCart, Store, Swords, TrendingDown } from 'lucide-react';
import type { VisualProps } from '../../types';
import { KINA_RØD, USA_BLÅ } from './felles3d';
import { Overskrift } from './overskrift';

/**
 * Tall og pengestrømmer i SVG (1600x900).
 * - «sykkel»: hva en handelskrig er, og tollen på en sykkel til 1000 dollar.
 * - «regning»: hvem som betaler tollen. Fra fabrikken i Kina til kunden i USA.
 * - «norge»: hva Norge kjøper fra Kina og USA, og bilene fra Kina.
 */

type Modus = 'sykkel' | 'regning' | 'norge';

const B = 1600;
const H = 900;

const TITLER: Record<Modus, string[]> = {
    sykkel: [
        'En handelskrig: ingen soldater',
        'Våpnene i en handelskrig',
        'Hva er toll?',
        'En kinesisk sykkel',
        'Tollen går til staten i USA',
    ],
    regning: [
        'En straff for Kina?',
        'Bedriften i USA betaler tollen',
        'Regningen sendes videre',
        'Tre økonomer undersøkte 2018',
        'Slutten av 2018',
        'Også i landene som svarte',
    ],
    norge: [
        'Norge: forsvar sammen med USA',
        'Norge kjøpte varer fra Kina, 2025',
        'Norge kjøpte varer fra USA, 2025',
        'Biler fra utlandet: hvor mange fra Kina?',
        'Biler fra utlandet: hvor mange fra Kina?',
    ],
};

export function UsaKinaTall({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'sykkel';
    const titler = TITLER[modus];
    const tittel = titler[Math.min(beat, titler.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f8fafc]">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    {[
                        ['rod', KINA_RØD],
                        ['bla', USA_BLÅ],
                        ['gra', '#475569'],
                    ].map(([id, f]) => (
                        <marker key={id} id={`ut-pil-${id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                            <path d="M 0 0 L 10 5 L 0 10 z" fill={f} />
                        </marker>
                    ))}
                </defs>
                {modus === 'sykkel' && <Sykkel beat={beat} />}
                {modus === 'regning' && <Regning beat={beat} />}
                {modus === 'norge' && <Norge beat={beat} />}
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

function Blokk({ x, y, b, h, farge, tekst, str = 64 }: { x: number; y: number; b: number; h: number; farge: string; tekst: string; str?: number }) {
    return (
        <g>
            <rect x={x} y={y} width={b} height={h} rx={28} fill={farge} />
            <text x={x + b / 2} y={y + h / 2 + str * 0.35} textAnchor="middle" fontSize={str} fontWeight={900} fill="#fff">
                {tekst}
            </text>
        </g>
    );
}

/* ---------------- Sykkel ---------------- */

/** En enkel sykkel tegnet med streker. */
function SykkelTegning({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
    const r = 70 * s;
    return (
        <g stroke="#0f172a" strokeWidth={10 * s} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <circle cx={x - 110 * s} cy={y} r={r} />
            <circle cx={x + 110 * s} cy={y} r={r} />
            <path d={`M ${x - 110 * s} ${y} L ${x - 30 * s} ${y - 110 * s} L ${x + 80 * s} ${y - 110 * s} L ${x + 110 * s} ${y} M ${x - 30 * s} ${y - 110 * s} L ${x} ${y} L ${x + 80 * s} ${y - 110 * s} M ${x - 110 * s} ${y} L ${x} ${y}`} stroke={KINA_RØD} />
            <path d={`M ${x - 45 * s} ${y - 140 * s} L ${x - 10 * s} ${y - 140 * s} M ${x + 75 * s} ${y - 150 * s} L ${x + 100 * s} ${y - 150 * s} M ${x + 80 * s} ${y - 110 * s} L ${x + 88 * s} ${y - 150 * s} M ${x - 30 * s} ${y - 110 * s} L ${x - 30 * s} ${y - 140 * s}`} />
        </g>
    );
}

function Sykkel({ beat }: { beat: number }) {
    if (beat <= 2) {
        return (
            <>
                <Blokk x={120} y={220} b={360} h={200} farge={USA_BLÅ} tekst="USA" />
                <Blokk x={1120} y={220} b={360} h={200} farge={KINA_RØD} tekst="KINA" />
                {beat === 0 && (
                    <Inn>
                        <Swords x={720} y={240} width={160} height={160} color="#94a3b8" />
                        <circle cx={940} cy={250} r={46} fill={KINA_RØD} />
                        <path d="M 915 225 L 965 275 M 965 225 L 915 275" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
                        <text x={B / 2} y={560} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                            Ingen soldater og våpen
                        </text>
                    </Inn>
                )}
                {beat === 1 &&
                    [
                        { I: Percent, t: 'toll' },
                        { I: Ban, t: 'boikott' },
                        { I: Coins, t: 'penger fra staten' },
                    ].map(({ I, t }, i) => (
                        <Inn key={t} delay={0.3 + i * 0.6}>
                            <rect x={170 + i * 440} y={500} width={380} height={250} rx={30} fill="#fff" stroke="#cbd5e1" strokeWidth={4} />
                            <I x={170 + i * 440 + 140} y={530} width={100} height={100} color={i === 0 ? KINA_RØD : '#334155'} />
                            <text x={170 + i * 440 + 190} y={700} textAnchor="middle" fontSize={36} fontWeight={900} fill="#0f172a">
                                {t}
                            </text>
                        </Inn>
                    ))}
                {beat === 2 && (
                    <>
                        {/* Grensa og varen som krysser den */}
                        <line x1={B / 2} y1={180} x2={B / 2} y2={460} stroke="#475569" strokeWidth={8} strokeDasharray="18 12" />
                        <motion.g initial={{ x: 300 }} animate={{ x: -200 }} transition={{ duration: 2.2, delay: 0.6, ease: 'easeInOut' }}>
                            <rect x={B / 2 - 70} y={250} width={140} height={110} rx={10} fill="#d97706" />
                            <path d={`M ${B / 2 - 70} 290 H ${B / 2 + 70}`} stroke="#92400e" strokeWidth={6} />
                        </motion.g>
                        <Inn delay={2.4}>
                            <rect x={B / 2 - 255} y={172} width={110} height={66} rx={14} fill={KINA_RØD} />
                            <text x={B / 2 - 200} y={218} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                                + %
                            </text>
                        </Inn>
                        <Inn delay={0.4}>
                            <rect x={200} y={560} width={1200} height={170} rx={30} fill="#fff" stroke="#cbd5e1" strokeWidth={4} />
                            <text x={B / 2} y={635} textAnchor="middle" fontSize={56} fontWeight={900} fill="#0f172a">
                                Toll: en ekstra avgift
                            </text>
                            <text x={B / 2} y={695} textAnchor="middle" fontSize={40} fontWeight={700} fill="#475569">
                                på varer som kommer fra utlandet
                            </text>
                        </Inn>
                    </>
                )}
            </>
        );
    }
    // Beat 3-4: sykkelen og prisen. 1000 dollar = 800 px, så 250 dollar = 200 px.
    const x0 = 520;
    return (
        <>
            <SykkelTegning x={250} y={420} s={0.9} />
            <text x={250} y={560} textAnchor="middle" fontSize={36} fontWeight={800} fill="#475569">
                laget i Kina
            </text>
            <motion.rect x={x0} y={300} height={120} rx={12} fill="#94a3b8" initial={{ width: 0 }} animate={{ width: 800 }} transition={{ duration: 1.2, delay: 0.3 }} />
            <text x={x0 + 400} y={378} textAnchor="middle" fontSize={52} fontWeight={900} fill="#fff">
                1000 dollar
            </text>
            {beat === 3 && (
                <Inn delay={1.2}>
                    <rect x={x0 + 560} y={160} width={300} height={100} rx={22} fill={KINA_RØD} />
                    <text x={x0 + 710} y={228} textAnchor="middle" fontSize={48} fontWeight={900} fill="#fff">
                        25 % toll
                    </text>
                </Inn>
            )}
            {beat >= 4 && (
                <>
                    <motion.rect x={x0 + 806} y={300} height={120} rx={12} fill={KINA_RØD} initial={{ width: 0 }} animate={{ width: 200 }} transition={{ duration: 0.9, delay: 0.4 }} />
                    <Inn delay={1}>
                        <text x={x0 + 906} y={270} textAnchor="middle" fontSize={44} fontWeight={900} fill={KINA_RØD}>
                            + 250
                        </text>
                        <path d={`M ${x0 + 906} 430 C ${x0 + 906} 560 ${x0 + 700} 560 ${x0 + 620} 600`} fill="none" stroke={KINA_RØD} strokeWidth={8} markerEnd="url(#ut-pil-rod)" />
                    </Inn>
                    <Inn delay={1.6}>
                        <rect x={x0 + 120} y={590} width={500} height={200} rx={28} fill="#fff" stroke={USA_BLÅ} strokeWidth={5} />
                        <Landmark x={x0 + 150} y={630} width={110} height={110} color={USA_BLÅ} />
                        <text x={x0 + 290} y={680} fontSize={44} fontWeight={900} fill="#0f172a">
                            staten i USA
                        </text>
                        <text x={x0 + 290} y={735} fontSize={32} fontWeight={700} fill="#475569">
                            får 250 dollar
                        </text>
                    </Inn>
                    <Inn delay={2.2}>
                        <text x={250} y={680} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                            Betales av den som
                        </text>
                        <text x={250} y={725} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                            henter sykkelen inn
                        </text>
                    </Inn>
                </>
            )}
        </>
    );
}

/* ---------------- Regning ---------------- */

const FABRIKK = 200;
const BEDRIFT = 800;
const KUNDE = 1380;
const RAD = 420;

function Regning({ beat }: { beat: number }) {
    const dempet = beat >= 3 ? 0.35 : 1;
    const containerX = beat === 0 ? FABRIKK + 180 : BEDRIFT - 200;
    return (
        <>
            <motion.g animate={{ opacity: dempet }} transition={{ duration: 0.6 }}>
                {/* Fabrikken i Kina */}
                <rect x={FABRIKK - 130} y={RAD - 120} width={260} height={240} rx={28} fill="#fee2e2" stroke={KINA_RØD} strokeWidth={5} />
                <Factory x={FABRIKK - 60} y={RAD - 100} width={120} height={120} color={KINA_RØD} />
                <text x={FABRIKK} y={RAD + 80} textAnchor="middle" fontSize={34} fontWeight={900} fill={KINA_RØD}>
                    fabrikk i Kina
                </text>
                {/* Bedriften i USA */}
                <rect x={BEDRIFT - 130} y={RAD - 120} width={260} height={240} rx={28} fill="#dbeafe" stroke={USA_BLÅ} strokeWidth={5} />
                <Store x={BEDRIFT - 60} y={RAD - 100} width={120} height={120} color={USA_BLÅ} />
                <text x={BEDRIFT} y={RAD + 80} textAnchor="middle" fontSize={34} fontWeight={900} fill={USA_BLÅ}>
                    bedrift i USA
                </text>
                {/* Kunden */}
                <rect x={KUNDE - 130} y={RAD - 120} width={260} height={240} rx={28} fill="#e2e8f0" stroke="#475569" strokeWidth={5} />
                <ShoppingCart x={KUNDE - 60} y={RAD - 100} width={120} height={120} color="#334155" />
                <text x={KUNDE} y={RAD + 80} textAnchor="middle" fontSize={34} fontWeight={900} fill="#334155">
                    kunde i USA
                </text>
                {/* Containeren med varen */}
                <motion.g initial={false} animate={{ x: containerX - (FABRIKK + 180) }} transition={{ duration: 1.6, ease: 'easeInOut' }}>
                    <rect x={FABRIKK + 180 - 60} y={RAD - 40} width={120} height={80} rx={8} fill="#d97706" />
                    <path d={`M ${FABRIKK + 140} ${RAD - 40} V ${RAD + 40} M ${FABRIKK + 180} ${RAD - 40} V ${RAD + 40} M ${FABRIKK + 220} ${RAD - 40} V ${RAD + 40}`} stroke="#92400e" strokeWidth={5} />
                </motion.g>
                {beat === 0 && (
                    <Inn delay={0.8}>
                        <text x={(FABRIKK + BEDRIFT) / 2 + 40} y={RAD - 170} textAnchor="middle" fontSize={150} fontWeight={900} fill={KINA_RØD}>
                            ?
                        </text>
                    </Inn>
                )}
                {/* Staten */}
                {beat >= 1 && (
                    <Inn delay={0.4}>
                        <rect x={BEDRIFT + 170} y={150} width={380} height={120} rx={24} fill="#fff" stroke={USA_BLÅ} strokeWidth={5} />
                        <Landmark x={BEDRIFT + 190} y={170} width={80} height={80} color={USA_BLÅ} />
                        <text x={BEDRIFT + 290} y={225} fontSize={38} fontWeight={900} fill="#0f172a">
                            staten i USA
                        </text>
                        <path d={`M ${BEDRIFT + 40} ${RAD - 125} C ${BEDRIFT + 40} 220 ${BEDRIFT + 90} 210 ${BEDRIFT + 160} 210`} fill="none" stroke={USA_BLÅ} strokeWidth={8} markerEnd="url(#ut-pil-bla)" />
                        <text x={BEDRIFT - 40} y={230} textAnchor="end" fontSize={34} fontWeight={900} fill={USA_BLÅ}>
                            betaler tollen
                        </text>
                    </Inn>
                )}
                {beat === 2 && (
                    <Inn delay={0.4}>
                        <path d={`M ${BEDRIFT + 135} ${RAD} H ${KUNDE - 150}`} stroke="#475569" strokeWidth={8} markerEnd="url(#ut-pil-gra)" />
                        <text x={(BEDRIFT + KUNDE) / 2} y={RAD - 30} textAnchor="middle" fontSize={30} fontWeight={800} fill="#334155">
                            regningen videre
                        </text>
                        <rect x={KUNDE - 110} y={RAD + 140} width={220} height={90} rx={18} fill={KINA_RØD} />
                        <text x={KUNDE} y={RAD + 200} textAnchor="middle" fontSize={40} fontWeight={900} fill="#fff">
                            pris opp
                        </text>
                    </Inn>
                )}
            </motion.g>
            {beat === 3 && (
                <Inn delay={0.4}>
                    <rect x={240} y={590} width={1120} height={250} rx={30} fill="#fff" stroke="#cbd5e1" strokeWidth={4} />
                    <text x={290} y={670} fontSize={36} fontWeight={800} fill="#334155">
                        tollen
                    </text>
                    <motion.rect x={560} y={630} height={56} rx={10} fill={KINA_RØD} initial={{ width: 0 }} animate={{ width: 700 }} transition={{ duration: 1, delay: 0.8 }} />
                    <text x={290} y={760} fontSize={36} fontWeight={800} fill="#334155">
                        prisene i USA
                    </text>
                    <motion.rect x={560} y={720} height={56} rx={10} fill={USA_BLÅ} initial={{ width: 0 }} animate={{ width: 700 }} transition={{ duration: 1, delay: 1.8 }} />
                    <text x={910} y={815} textAnchor="middle" fontSize={30} fontWeight={800} fill="#475569">
                        hele tollen havnet på prisene i USA
                    </text>
                </Inn>
            )}
            {beat === 4 && (
                <Inn delay={0.4}>
                    <rect x={350} y={590} width={900} height={240} rx={30} fill="#fff" stroke={KINA_RØD} strokeWidth={5} />
                    <TrendingDown x={400} y={640} width={130} height={130} color={KINA_RØD} />
                    <text x={570} y={700} fontSize={64} fontWeight={900} fill={KINA_RØD}>
                        ca. 1,4 mrd. dollar
                    </text>
                    <text x={570} y={770} fontSize={36} fontWeight={800} fill="#334155">
                        tapte amerikanerne i måneden
                    </text>
                </Inn>
            )}
            {beat >= 5 && (
                <Inn delay={0.4}>
                    {[
                        { x: 260, t: 'I USA', f: USA_BLÅ },
                        { x: 860, t: 'I landene som svarte', f: KINA_RØD },
                    ].map((k) => (
                        <g key={k.t}>
                            <rect x={k.x} y={600} width={500} height={220} rx={28} fill="#fff" stroke={k.f} strokeWidth={5} />
                            <text x={k.x + 250} y={680} textAnchor="middle" fontSize={40} fontWeight={900} fill={k.f}>
                                {k.t}
                            </text>
                            <TrendingDown x={k.x + 60} y={710} width={80} height={80} color={k.f} />
                            <text x={k.x + 290} y={768} textAnchor="middle" fontSize={40} fontWeight={800} fill="#0f172a">
                                folk fattigere
                            </text>
                        </g>
                    ))}
                </Inn>
            )}
        </>
    );
}

/* ---------------- Norge ---------------- */

/** En liten bil, sett fra siden. */
function Bil({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <g>
            <path d={`M ${x} ${y + 14} h 44 v -10 l -8 -2 l -8 -10 h -16 l -8 10 l -4 2 z`} fill={farge} />
            <circle cx={x + 10} cy={y + 15} r={5} fill="#0f172a" />
            <circle cx={x + 34} cy={y + 15} r={5} fill="#0f172a" />
        </g>
    );
}

function Bilfelt({ x, y, ar, antall, tekst }: { x: number; y: number; ar: string; antall: number; tekst: string }) {
    return (
        <g>
            <text x={x + 285} y={y - 20} textAnchor="middle" fontSize={52} fontWeight={900} fill="#0f172a">
                {ar}
            </text>
            {Array.from({ length: 100 }, (_, i) => {
                const kol = i % 10;
                const rad = Math.floor(i / 10);
                return <Bil key={i} x={x + kol * 57} y={y + rad * 44} farge={i < antall ? KINA_RØD : '#cbd5e1'} />;
            })}
            <text x={x + 285} y={y + 500} textAnchor="middle" fontSize={40} fontWeight={900} fill={KINA_RØD}>
                {tekst}
            </text>
        </g>
    );
}

function Norge({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <Inn>
                <Blokk x={220} y={330} b={400} h={220} farge="#b91c1c" tekst="NORGE" />
                <Blokk x={980} y={330} b={400} h={220} farge={USA_BLÅ} tekst="USA" />
                <path d="M 640 440 H 960" stroke="#334155" strokeWidth={10} />
                <circle cx={B / 2} cy={440} r={90} fill="#fff" stroke="#334155" strokeWidth={6} />
                <Shield x={B / 2 - 50} y={390} width={100} height={100} color="#334155" />
                <text x={B / 2} y={620} textAnchor="middle" fontSize={48} fontWeight={900} fill="#0f172a">
                    NATO: tett samarbeid om forsvar
                </text>
            </Inn>
        );
    }
    if (beat <= 2) {
        // 133 mrd. = 820 px, så 79 mrd. = 487 px.
        const rader = [
            { navn: 'Kina', verdi: 133, f: KINA_RØD, fra: 1 },
            { navn: 'USA', verdi: 79, f: USA_BLÅ, fra: 2 },
        ];
        return (
            <>
                {rader.map((r, i) =>
                    beat >= r.fra ? (
                        <g key={r.navn}>
                            <text x={300} y={350 + i * 220} textAnchor="end" fontSize={56} fontWeight={900} fill={r.f}>
                                {r.navn}
                            </text>
                            <motion.rect x={340} y={290 + i * 220} height={100} rx={14} fill={r.f} initial={{ width: 0 }} animate={{ width: (r.verdi / 133) * 820 }} transition={{ duration: 1.2, delay: 0.4 }} />
                            <Inn delay={1.4}>
                                <text x={340 + (r.verdi / 133) * 820 + 30} y={358 + i * 220} fontSize={48} fontWeight={900} fill="#0f172a">
                                    {r.verdi} mrd. kr
                                </text>
                            </Inn>
                        </g>
                    ) : null
                )}
                {beat === 1 && (
                    <Inn delay={1.8}>
                        <text x={B / 2} y={700} textAnchor="middle" fontSize={44} fontWeight={800} fill="#334155">
                            Kina er landet Norge kjøper mest varer fra
                        </text>
                    </Inn>
                )}
            </>
        );
    }
    return (
        <>
            <Bilfelt x={170} y={230} ar="2019" antall={1} tekst="om lag 1 %" />
            {beat >= 4 && (
                <Inn>
                    <Bilfelt x={860} y={230} ar="2025" antall={20} tekst="rundt 20 %" />
                </Inn>
            )}
            <text x={B / 2} y={860} textAnchor="middle" fontSize={34} fontWeight={700} fill="#475569">
                1 bil = 1 prosent av bilene vi kjøpte fra utlandet. Rød: fra Kina
            </text>
        </>
    );
}
