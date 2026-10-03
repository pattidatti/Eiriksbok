import { AnimatePresence, motion } from 'framer-motion';
import type { Dom, SyrytmeHud } from '../graboks/syrytme';
import { useNaa } from './useNaa';
import { ETIKETT, GRONN, HJELP, PANEL, ROD, TEKST } from './stil';

// Sålen hos mester Hans: læret glir fra høyre mot nåla. Hullene i øvre rad tas med A, de i nedre
// med D. Tråden legger seg mellom hullene som er sydd, og viser hvor pent det ble. Spillet regner
// tida selv (`performance.now()` mot `h.start`), så hullene glir jevnt selv om HUD-en kommer sjeldnere.

const NAAL_X = 150;
const FART = 230;
const OVER = 58;
const UNDER = 118;

const ORD: Record<Dom, { tekst: string; farge: string }> = {
    perfekt: { tekst: 'Perfekt!', farge: '#3f6b2a' },
    bra: { tekst: 'Bra', farge: '#4d6b2a' },
    skjev: { tekst: 'Skjevt', farge: '#8a5a12' },
    feil: { tekst: 'Feil nål!', farge: '#9a2a1c' },
    bom: { tekst: 'Bom!', farge: '#9a2a1c' },
};

export function Syrytme({ h }: { h: SyrytmeHud }) {
    const naa = useNaa();
    const t = h.fase === 'syr' ? (naa - h.start) / 1000 : -2.2;
    // Ferdig eller revet: hele sømmen vises på én gang, så gutten ser hvor pent den ble.
    const oversikt = h.fase === 'ferdig' || h.fase === 'revet';
    const sisteTid = h.sting[h.sting.length - 1]?.tid || 1;
    const x = (tid: number) => (oversikt ? 40 + (tid / sisteTid) * 640 : NAAL_X + (tid - t) * FART);
    const y = (side: 'v' | 'h') => (side === 'v' ? OVER : UNDER);
    // Hammeren slår på hvert sting: pulsen er sterkest i slaget og dør ut på 0,15 s.
    const naermest = h.sting.reduce((m, s) => Math.min(m, Math.abs(s.tid - t)), Infinity);
    const inntelling = h.fase === 'syr' && t < 0 && t > -5 ? Math.abs(t % 0.95) : 1;
    const puls = Math.max(0, 1 - Math.min(naermest, inntelling) / 0.15);
    const nesteSide = h.sting.find((s) => !s.dom)?.side;
    const sydd = h.sting.filter((s) => s.dom);

    return (
        <div className={`pointer-events-none relative w-[min(640px,94vw)] px-4 pb-3 pt-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between gap-3">
                <span className={ETIKETT}>Skomakerverkstedet: sy sålen</span>
                <span className="flex items-center gap-1 text-[14px] font-semibold text-[#3d2a17]" aria-label={`${h.bom} av ${h.maksBom + 1} bom`}>
                    Bom:
                    {Array.from({ length: h.maksBom + 1 }, (_, i) => (
                        <span key={i} className={`ml-0.5 h-3.5 w-3.5 rounded-full ${i < h.bom ? 'bg-[#9a2a1c]' : 'border-2 border-[#b99a68]'}`} />
                    ))}
                </span>
            </div>
            <svg viewBox="0 0 720 176" className="mt-1 w-full" role="img" aria-label="Sålen og nålene">
                <defs>
                    <linearGradient id="laer" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor="#a16a3e" />
                        <stop offset="1" stopColor="#7a4b28" />
                    </linearGradient>
                </defs>
                {/* Læret: en lang stripe med søm-rader. */}
                <rect x={0} y={34} width={720} height={108} rx={18} fill="url(#laer)" />
                <line x1={0} y1={OVER} x2={720} y2={OVER} stroke="#5b371c" strokeWidth={1.5} strokeDasharray="4 7" />
                <line x1={0} y1={UNDER} x2={720} y2={UNDER} stroke="#5b371c" strokeWidth={1.5} strokeDasharray="4 7" />
                {/* Tråden mellom sydde hull. */}
                {sydd.map((s, i) => {
                    const neste = sydd[i + 1];
                    if (!neste || s.dom === 'bom' || s.dom === 'feil' || neste.dom === 'bom' || neste.dom === 'feil') return null;
                    const skjev = s.dom === 'skjev' || neste.dom === 'skjev';
                    return (
                        <line
                            key={`t${s.tid}`}
                            x1={x(s.tid)}
                            y1={y(s.side) + (s.dom === 'skjev' ? 7 : 0)}
                            x2={x(neste.tid)}
                            y2={y(neste.side) + (neste.dom === 'skjev' ? -7 : 0)}
                            stroke={skjev ? '#f59e0b' : '#fef3c7'}
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                    );
                })}
                {/* Hullene. */}
                {h.sting.map((s) => {
                    const sx = x(s.tid);
                    if (sx < -30 || sx > 750) return null;
                    const sy = y(s.side);
                    if (s.dom === 'bom' || s.dom === 'feil') {
                        return (
                            <g key={s.tid} stroke="#e11d48" strokeWidth={4} strokeLinecap="round">
                                <line x1={sx - 8} y1={sy - 8} x2={sx + 8} y2={sy + 8} />
                                <line x1={sx - 8} y1={sy + 8} x2={sx + 8} y2={sy - 8} />
                            </g>
                        );
                    }
                    const naerNaal = h.fase === 'syr' && !s.dom && Math.abs(sx - NAAL_X) < 40;
                    return (
                        <g key={s.tid}>
                            {naerNaal && <circle cx={sx} cy={sy} r={16} fill="none" stroke="#fde68a" strokeWidth={3} opacity={1 - Math.abs(sx - NAAL_X) / 40} />}
                            <circle cx={sx} cy={sy} r={s.dom ? 5 : 8} fill={s.dom ? '#fef3c7' : '#2b1a0d'} stroke={s.dom ? '#78350f' : '#d6a77a'} strokeWidth={2} />
                            {!s.dom && (
                                <text x={sx} y={s.side === 'v' ? sy - 15 : sy + 26} textAnchor="middle" fontSize={17} fontWeight={800} fill="#fff7ed">
                                    {s.side === 'v' ? 'A' : 'D'}
                                </text>
                            )}
                        </g>
                    );
                })}
                {/* Nåla: linja der hullet skal stikkes, og de to nålene som stikker når gutten trykker. */}
                {!oversikt && <line x1={NAAL_X} y1={30} x2={NAAL_X} y2={146} stroke="#fde68a" strokeWidth={2 + puls * 3} opacity={0.5 + puls * 0.5} />}
                {!oversikt && (['v', 'h'] as const).map((side) => {
                    const stakk = h.siste?.side === side ? h.siste.n : 0;
                    const aktiv = nesteSide === side;
                    const ned = side === 'v';
                    return (
                        <motion.g
                            key={`${side}${stakk}`}
                            initial={{ y: stakk ? (ned ? 22 : -22) : 0 }}
                            animate={{ y: 0 }}
                            transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                        >
                            <polygon
                                points={ned ? `${NAAL_X - 4},4 ${NAAL_X + 4},4 ${NAAL_X},${OVER - 12}` : `${NAAL_X - 4},172 ${NAAL_X + 4},172 ${NAAL_X},${UNDER + 12}`}
                                fill={aktiv ? '#f8fafc' : '#94a3b8'}
                                stroke="#334155"
                                strokeWidth={1.5}
                            />
                            <text x={NAAL_X - 22} y={ned ? 22 : 166} textAnchor="middle" fontSize={17} fontWeight={800} fill={aktiv ? '#9a2a1c' : '#7a6248'}>
                                {ned ? 'A' : 'D'}
                            </text>
                        </motion.g>
                    );
                })}
                {/* Hammeren til mester Hans: den hopper i takt. */}
                <g transform={`translate(660 ${20 - puls * 8}) rotate(${-25 + puls * 25})`}>
                    <rect x={-4} y={0} width={8} height={30} rx={3} fill="#7c5a3a" />
                    <rect x={-14} y={-8} width={28} height={12} rx={3} fill="#475569" />
                </g>
                {h.fase === 'syr' && t < 0 && t > -5 && (
                    <text x={360} y={104} textAnchor="middle" fontSize={56} fontWeight={900} fill="#fff7ed" opacity={0.9}>
                        {Math.min(4, Math.ceil(-t / 0.95))}
                    </text>
                )}
            </svg>
            <div className="relative h-0">
                <AnimatePresence>
                    {h.siste && (
                        <motion.div
                            key={h.siste.n}
                            initial={{ opacity: 0, scale: 0.5, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.2 }}
                            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                            className="absolute -top-[92px] left-[27%] rounded-md border border-[#b99a68] bg-[#fbf5e6]/95 px-2 text-[22px] font-black shadow"
                            style={{ color: ORD[h.siste.dom].farge }}
                        >
                            {ORD[h.siste.dom].tekst}
                            {h.rekke >= 3 && <span className="ml-2 text-[16px] text-[#5a3519]">{h.rekke} på rad</span>}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <p className={`mt-1 ${TEKST} ${h.fase === 'revet' ? `font-semibold ${ROD}` : h.fase === 'ferdig' ? `font-semibold ${GRONN}` : ''}`}>
                {h.tekst}
            </p>
            <p className={`mt-0.5 ${HJELP}`}>
                {h.fase === 'syr' ? 'Q: gi opp' : h.fase === 'ferdig' ? 'Mellomrom: ferdig' : 'Mellomrom: begynn · Q: gå fra benken'}
            </p>
        </div>
    );
}
