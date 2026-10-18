import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { B, DELFARGE, DELPOS, H, type Del } from './data';
import { Overskrift, Telefon } from './figurer';

/**
 * Makta som kuler som trekker landene til seg (polene i en «multipolar» verden).
 * «start»: beat 0 spørsmålet og alle landene, beat 1 USA alene i 2000, beat 2 landene følger
 * amerikanske regler, beat 3 makta i bevegelse (Kina og India vokser), beat 4 flere poler.
 * «funnet»: beat 0 ingen ene sjef, beat 1 USA sterkest med Kina tett bak, India og BRICS,
 * beat 2 mobilen dukker opp, beat 3 linjer fra landene delene kommer fra.
 */

type Modus = 'start' | 'funnet';
type PolId = 'usa' | 'kina' | 'india' | 'brics';

interface Pol {
    x: number;
    y: number;
    r: number;
    synlig: number;
}

const POLFARGE: Record<PolId, string> = {
    usa: '#2563eb',
    kina: '#dc2626',
    india: '#ea580c',
    brics: '#ca8a04',
};
const NAVN: Record<PolId, string> = { usa: 'USA', kina: 'Kina', india: 'India', brics: 'BRICS' };

const SKJULT: Pol = { x: 800, y: 480, r: 0, synlig: 0 };

function polerFor(modus: Modus, beat: number): Record<PolId, Pol> {
    if (modus === 'start') {
        if (beat === 0) return { usa: SKJULT, kina: SKJULT, india: SKJULT, brics: SKJULT };
        if (beat <= 2)
            return {
                usa: { x: 800, y: 400, r: 140, synlig: 1 },
                kina: { ...SKJULT, x: 1200 },
                india: { ...SKJULT, x: 1100, y: 680 },
                brics: SKJULT,
            };
        return {
            usa: { x: 470, y: 420, r: beat === 3 ? 125 : 115, synlig: 1 },
            kina: { x: 1150, y: 390, r: beat === 3 ? 80 : 105, synlig: 1 },
            india: { x: 1000, y: 690, r: beat === 3 ? 50 : 72, synlig: 1 },
            brics: SKJULT,
        };
    }
    if (beat === 0)
        return {
            usa: { x: 470, y: 420, r: 115, synlig: 1 },
            kina: { x: 1150, y: 390, r: 105, synlig: 1 },
            india: { x: 1000, y: 690, r: 72, synlig: 1 },
            brics: { x: 560, y: 720, r: 0, synlig: 0 },
        };
    if (beat === 1)
        return {
            usa: { x: 560, y: 400, r: 140, synlig: 1 },
            kina: { x: 900, y: 420, r: 122, synlig: 1 },
            india: { x: 1260, y: 470, r: 80, synlig: 1 },
            brics: { x: 1000, y: 720, r: 68, synlig: 1 },
        };
    // Mobilen i midten, polene trekker seg ut.
    return {
        usa: { x: 260, y: 300, r: 70, synlig: 0.25 },
        kina: { x: 1340, y: 300, r: 70, synlig: 0.25 },
        india: { x: 1340, y: 680, r: 46, synlig: 0.25 },
        brics: { x: 260, y: 700, r: 46, synlig: 0.25 },
    };
}

/** Landene i verden som små prikker, på faste plasser. */
const LAND: [number, number][] = (() => {
    const ut: [number, number][] = [];
    let s = 7;
    const rnd = () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
    };
    while (ut.length < 56) {
        const x = 120 + rnd() * 1360;
        const y = 180 + rnd() * 640;
        if (Math.hypot(x - 800, y - 400) < 170) continue;
        ut.push([x, y]);
    }
    return ut;
})();

function nærmeste(x: number, y: number, poler: Record<PolId, Pol>): PolId | null {
    let best: PolId | null = null;
    let d = Infinity;
    for (const id of Object.keys(poler) as PolId[]) {
        const p = poler[id];
        if (p.synlig < 0.5) continue;
        const dd = Math.hypot(x - p.x, y - p.y) / Math.max(p.r, 1);
        if (dd < d) {
            d = dd;
            best = id;
        }
    }
    return best;
}

/** Kildene til mobilens deler i «funnet» beat 3. */
const KILDER: { del: Del; land: string; ting: string; x: number; y: number }[] = [
    { del: 'jordarter', land: 'Kina', ting: 'sjeldne jordarter', x: 1160, y: 230 },
    { del: 'kobolt', land: 'DR Kongo', ting: 'kobolt', x: 440, y: 560 },
    { del: 'brikke', land: 'Taiwan', ting: 'databrikker', x: 1160, y: 470 },
    { del: 'programvare', land: 'USA', ting: 'programvare', x: 440, y: 770 },
];

const OVERSKRIFT: Record<Modus, string[]> = {
    start: ['Hvem bestemmer?', 'År 2000: én sjef', 'Amerikanske regler', '2026: makta flytter seg', 'En multipolar verden'],
    funnet: ['2026: ingen ene sjef', 'Fire maktsentre', 'Mobilen i lomma', 'Verdenspolitikk i hånda'],
};

export function VerdensordenPoler({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'start';
    const poler = polerFor(modus, beat);
    const mobil = modus === 'funnet' && beat >= 2;
    const regler = modus === 'start' && beat === 2;
    const fleresentre = (modus === 'start' && beat >= 3) || (modus === 'funnet' && beat <= 1);
    const overskrift = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];

    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
            <svg viewBox={`0 0 ${B} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* Linjer fra USA til landene: alle følger de samme reglene */}
                {regler &&
                    LAND.map(([x, y], i) => (
                        <motion.line
                            key={`l${i}`}
                            x1={800}
                            y1={400}
                            x2={x}
                            y2={y}
                            stroke="#2563eb"
                            strokeOpacity={0.35}
                            strokeWidth={2}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 + (i % 14) * 0.05 }}
                        />
                    ))}
                {/* Landene. Med flere poler trekkes hvert land mot den nærmeste. */}
                {LAND.map(([x, y], i) => {
                    const pol = fleresentre ? nærmeste(x, y, poler) : null;
                    const p = pol ? poler[pol] : null;
                    const drag = p ? (modus === 'start' && beat === 3 ? 0.15 : 0.3) : 0;
                    const tx = p ? x + (p.x - x) * drag : x;
                    const ty = p ? y + (p.y - y) * drag : y;
                    const farge = pol ? POLFARGE[pol] : regler ? '#93c5fd' : '#94a3b8';
                    return (
                        <motion.circle
                            key={i}
                            r={13}
                            initial={{ cx: x, cy: y, fill: '#94a3b8' }}
                            animate={{ cx: tx, cy: ty, fill: farge, opacity: mobil ? 0.15 : 0.85 }}
                            transition={{ duration: 1.4, ease: 'easeInOut' }}
                        />
                    );
                })}
                {/* Polene */}
                {(Object.keys(poler) as PolId[]).map((id) => {
                    const p = poler[id];
                    return (
                        <motion.g key={id} initial={false} animate={{ opacity: p.synlig }} transition={{ duration: 0.8 }}>
                            <motion.circle
                                initial={{ cx: p.x, cy: p.y, r: 0 }}
                                animate={{ cx: p.x, cy: p.y, r: p.r }}
                                transition={{ duration: 1.3, ease: 'easeInOut' }}
                                fill={POLFARGE[id]}
                                fillOpacity={0.9}
                                stroke="#fff"
                                strokeWidth={6}
                            />
                            {p.r > 40 && p.synlig > 0.5 && (
                                <motion.text
                                    initial={{ x: p.x, y: p.y + 14 }}
                                    animate={{ x: p.x, y: p.y + 14 }}
                                    transition={{ duration: 1.3, ease: 'easeInOut' }}
                                    textAnchor="middle"
                                    fontSize={p.r > 90 ? 46 : 34}
                                    fontWeight={900}
                                    fill="#fff"
                                >
                                    {NAVN[id]}
                                </motion.text>
                            )}
                        </motion.g>
                    );
                })}
                {mobil && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                        <Telefon x={800} y={500} skala={0.62} lys={beat >= 3 ? ['jordarter', 'kobolt', 'brikke', 'programvare'] : []} />
                    </motion.g>
                )}
                {modus === 'funnet' &&
                    beat >= 3 &&
                    KILDER.map((k, i) => {
                        const [dx, dy] = DELPOS[k.del];
                        const mx = 800 + dx * 0.62;
                        const my = 500 + dy * 0.62;
                        const fraX = k.x < 800 ? k.x + 150 : k.x - 150;
                        return (
                            <motion.g key={k.del} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.6 }}>
                                <motion.line
                                    x1={fraX}
                                    y1={k.y}
                                    x2={mx}
                                    y2={my}
                                    stroke={DELFARGE[k.del]}
                                    strokeWidth={5}
                                    strokeDasharray="12 8"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.3 + i * 0.6, duration: 0.8 }}
                                />
                                <rect x={k.x - 150} y={k.y - 50} width={300} height={100} rx={18} fill="#fff" stroke={DELFARGE[k.del]} strokeWidth={5} />
                                <text x={k.x} y={k.y - 6} textAnchor="middle" fontSize={36} fontWeight={900} fill={DELFARGE[k.del]}>
                                    {k.land}
                                </text>
                                <text x={k.x} y={k.y + 32} textAnchor="middle" fontSize={26} fontWeight={600} fill="#475569">
                                    {k.ting}
                                </text>
                            </motion.g>
                        );
                    })}
            </svg>

            <Overskrift tekst={overskrift} />

            <AnimatePresence>
                {modus === 'start' && beat === 0 && (
                    <motion.div
                        key="sporsmal"
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="absolute left-1/2 top-[34%] -translate-x-1/2 px-8 py-5 rounded-3xl bg-slate-900/92 text-white text-center shadow-2xl"
                    >
                        <div className="text-xl font-bold text-amber-300 mb-1">Granskerens spørsmål</div>
                        <div className="text-5xl font-black whitespace-nowrap">Hvem bestemmer i verden?</div>
                    </motion.div>
                )}
                {regler && (
                    <motion.div
                        key="regler"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.9 }}
                        className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex gap-3"
                    >
                        {['handel', 'penger', 'politikk'].map((t) => (
                            <span key={t} className="px-5 py-2 rounded-xl bg-blue-700 text-white text-2xl font-bold shadow-lg">
                                {t}
                            </span>
                        ))}
                    </motion.div>
                )}
                {modus === 'start' && beat === 4 && (
                    <motion.div
                        key="multipolar"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1 }}
                        className="absolute bottom-[5%] left-[4%] px-5 py-3 rounded-2xl bg-white/95 shadow-xl max-w-[22rem]"
                    >
                        <div className="text-2xl font-black text-slate-900">Multipolar</div>
                        <div className="text-lg font-semibold text-slate-600 leading-snug">flere poler, altså flere sentre for makt</div>
                    </motion.div>
                )}
                {modus === 'funnet' && beat === 1 && (
                    <motion.div
                        key="merker"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 1.2 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <Merke x={35} y={64} tekst="sterkest" farge="bg-blue-700" />
                        <Merke x={56} y={29} tekst="tett bak" farge="bg-red-700" />
                        <Merke x={79} y={65} tekst="vokser raskt" farge="bg-orange-600" />
                        <Merke x={62.5} y={91} tekst="vil ha nye regler" farge="bg-yellow-700" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/** Liten merkelapp i prosent av bildet (x, y = midtpunktet). */
function Merke({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    return (
        <span
            className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-white text-xl font-bold shadow-lg whitespace-nowrap ${farge}`}
            style={{ left: `${x}%`, top: `${y}%` }}
        >
            {tekst}
        </span>
    );
}
