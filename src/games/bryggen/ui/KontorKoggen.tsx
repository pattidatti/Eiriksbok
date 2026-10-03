import { AnimatePresence, motion } from 'framer-motion';
import { KOLS, NAVN, RADER, STENGT, VEKT, type Art, type KoggenHud, type Stuet } from '../graboks/kontor-koggen';
import { ETIKETT, FARGE, FYLL, GRONN, HJELP, PANEL, RILLE, ROD, SVAK, TEKST } from './stil';

// Lasterommet i koggen sett ovenfra (akter til venstre, forut til høyre), tegnet med blekk på lin.
// Ved siden av: koggen sett akterfra, som krenger med lasten, og en måler for trimmen. Køen viser de
// neste tingene, så eleven kan tenke ett steg fram.

const R = 50;
const X0 = 26;
const Y0 = 22;
const BRED = KOLS * R;
const HOY = RADER * R;

function Ting({ s, spokelse, lovlig }: { s: Stuet; spokelse?: boolean; lovlig?: boolean }) {
    const x = X0 + s.x * R;
    const y = Y0 + s.y * R;
    const w = s.w * R;
    const h = s.h * R;
    const strek = spokelse ? (lovlig ? FARGE.gronn : FARGE.segl) : FARGE.tjaere;
    const fyll = s.art === 'tran' ? '#7a4c26' : s.art === 'bunt' ? '#d9c08a' : '#c9ab6e';
    return (
        <motion.g initial={spokelse ? false : { scale: 1.25, opacity: 0 }} animate={{ scale: 1, opacity: spokelse ? 0.75 : 1 }} style={{ transformOrigin: `${x + w / 2}px ${y + h / 2}px` }}>
            {s.art === 'tran' ? (
                <>
                    <circle cx={x + w / 2} cy={y + h / 2} r={R * 0.4} fill={fyll} stroke={strek} strokeWidth={spokelse ? 4 : 2} strokeDasharray={spokelse ? '6 4' : undefined} />
                    <circle cx={x + w / 2} cy={y + h / 2} r={R * 0.28} fill="none" stroke="#3b2414" strokeWidth={1.5} opacity={0.6} />
                </>
            ) : (
                <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx={6} fill={fyll} stroke={strek} strokeWidth={spokelse ? 4 : 2} strokeDasharray={spokelse ? '6 4' : undefined} />
            )}
            <text x={x + w / 2} y={y + h / 2 + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill={s.art === 'tran' ? '#fff3dc' : FARGE.blekk}>
                {VEKT[s.art]}
            </text>
        </motion.g>
    );
}

function Ikon({ art }: { art: Art }) {
    return (
        <svg viewBox="0 0 40 30" className="h-7 w-9">
            {art === 'tran' ? (
                <circle cx={20} cy={15} r={12} fill="#7a4c26" stroke={FARGE.tjaere} strokeWidth={2} />
            ) : (
                <rect x={art === 'pakke' ? 2 : 10} y={6} width={art === 'pakke' ? 36 : 20} height={18} rx={4} fill={art === 'bunt' ? '#d9c08a' : '#c9ab6e'} stroke={FARGE.tjaere} strokeWidth={2} />
            )}
        </svg>
    );
}

export function KontorKoggen({ h }: { h: KoggenHud }) {
    const skeivSide = Math.abs(h.side) > h.grenseSide;
    const skeivTrim = Math.abs(h.trim) > h.grenseTrim;
    const krenger = Math.max(-18, Math.min(18, h.side * 3.2));
    return (
        <div className={`pointer-events-none absolute bottom-6 left-1/2 z-[1100] w-[min(640px,94vw)] -translate-x-1/2 px-5 pb-3 pt-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between">
                <span className={ETIKETT}>Lasterommet i koggen</span>
                <span className={`text-[14px] font-bold tabular-nums ${h.igjen < 30 ? ROD : 'text-[#5c4630]'}`}>Floen om {Math.ceil(h.igjen)} s</span>
            </div>
            <div className={`mt-1 h-2 rounded-full ${RILLE}`}>
                <div className={`h-full rounded-full ${FYLL.tjaere}`} style={{ width: `${(h.igjen / h.tid) * 100}%` }} />
            </div>

            <div className="mt-2 flex items-start gap-3">
                <svg viewBox={`0 0 ${BRED + X0 * 2 + 10} ${HOY + Y0 * 2 + 4}`} className="w-[440px] shrink-0">
                    {/* Skroget ovenfra: rett akter, spiss baug forut. */}
                    <path
                        d={`M ${X0 - 6} ${Y0 - 6} L ${X0 + BRED - 30} ${Y0 - 6} Q ${X0 + BRED + 26} ${Y0 + HOY / 2} ${X0 + BRED - 30} ${Y0 + HOY + 6} L ${X0 - 6} ${Y0 + HOY + 6} Z`}
                        fill="#e9dcbc"
                        stroke={FARGE.tjaere}
                        strokeWidth={3}
                    />
                    {Array.from({ length: KOLS * RADER }, (_, i) => {
                        const x = i % KOLS;
                        const y = Math.floor(i / KOLS);
                        const stengt = STENGT.has(`${x}:${y}`);
                        return (
                            <rect key={i} x={X0 + x * R + 1} y={Y0 + y * R + 1} width={R - 2} height={R - 2} fill={stengt ? '#b9a27a' : 'none'} stroke="#b99a68" strokeWidth={1} opacity={stengt ? 0.55 : 0.8} />
                        );
                    })}
                    {/* Masta midt i skipet. */}
                    <circle cx={X0 + 4.5 * R} cy={Y0 + 2 * R} r={13} fill={FARGE.tjaere} />
                    {/* Retningene utenfor skroget, så de aldri ligger oppå lasten. */}
                    <text x={X0 + BRED / 2} y={Y0 - 10} textAnchor="middle" fontSize={14} fontWeight={700} fill={FARGE.svak}>babord</text>
                    <text x={X0 + BRED / 2} y={Y0 + HOY + 22} textAnchor="middle" fontSize={14} fontWeight={700} fill={FARGE.svak}>styrbord</text>
                    <text x={X0} y={Y0 + HOY + 22} fontSize={14} fontWeight={700} fill={FARGE.svak}>akter</text>
                    <text x={X0 + BRED} y={Y0 + HOY + 22} textAnchor="end" fontSize={14} fontWeight={700} fill={FARGE.svak}>forut</text>
                    {h.plassert.map((s, i) => (
                        <Ting key={`${i}:${s.x}:${s.y}`} s={s} />
                    ))}
                    {h.mark && <Ting s={h.mark} spokelse lovlig={h.lovlig} />}
                </svg>

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {/* Koggen sett akterfra: krenger med lasten. */}
                    <svg viewBox="-60 -50 120 80" className="w-full">
                        <line x1={-58} y1={8} x2={58} y2={8} stroke={FARGE.svak} strokeWidth={1.5} />
                        <motion.g animate={{ rotate: krenger }} transition={{ type: 'spring', stiffness: 60, damping: 9 }}>
                            <path d="M -34 -6 L 34 -6 Q 30 22 0 26 Q -30 22 -34 -6 Z" fill="#8a6a44" stroke={FARGE.tjaere} strokeWidth={2.5} />
                            <line x1={0} y1={-6} x2={0} y2={-46} stroke={FARGE.tjaere} strokeWidth={3} />
                        </motion.g>
                    </svg>
                    <div className={`text-center text-[14px] font-bold ${skeivSide ? ROD : GRONN}`}>
                        {Math.abs(h.side) < 0.3 ? 'Ligger rett' : `${skeivSide ? 'Krenger' : 'Litt'} mot ${h.side > 0 ? 'styrbord' : 'babord'}`}
                    </div>
                    <div>
                        <div className="flex justify-between text-[13px] text-[#5c4630]">
                            <span>akter</span>
                            <span className={skeivTrim ? ROD : ''}>trim</span>
                            <span>forut</span>
                        </div>
                        <div className={`relative h-3 rounded-full ${RILLE}`}>
                            <div className="absolute inset-y-0 rounded-full bg-[#3f6b2a]/25" style={{ left: `${50 - (h.grenseTrim / 16) * 50}%`, right: `${50 - (h.grenseTrim / 16) * 50}%` }} />
                            <motion.div className="absolute top-[-3px] h-[18px] w-[6px] rounded bg-[#2b1d10]" animate={{ left: `calc(${50 + Math.max(-16, Math.min(16, h.trim)) / 16 * 50}% - 3px)` }} />
                        </div>
                    </div>
                    <div>
                        <div className={SVAK}>Neste:</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                            <AnimatePresence initial={false}>
                                {h.ko.map((a, i) => (
                                    <motion.div key={`${h.n}:${i}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: i === 0 ? 1 : 0.6, x: 0 }} className="flex items-center">
                                        <Ikon art={a} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                        {h.ko[0] && (
                            <div className={`${TEKST} text-[14px]`}>
                                {NAVN[h.ko[0]]}, vekt {VEKT[h.ko[0]]}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <p className={`mt-1 min-h-[22px] ${TEKST} text-[15px] ${h.fase === 'slutt' ? (h.rett ? GRONN : ROD) : ''} font-semibold`}>
                {h.fase === 'klar' ? 'Tranfatene er tyngst. Sett dem midt i skipet, og like mye på hver side.' : h.tekst}
            </p>
            <p className={`mt-1 ${HJELP}`}>
                {h.fase === 'klar'
                    ? 'Mellomrom: begynn · Q: gå'
                    : h.fase === 'slutt'
                        ? 'Mellomrom: ferdig'
                        : 'WASD eller piltaster: flytt · R: snu pakken · Mellomrom: sett ned · Backspace: ta opp igjen · Q: gå'}
            </p>
        </div>
    );
}
