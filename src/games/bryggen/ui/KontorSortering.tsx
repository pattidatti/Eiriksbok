import { AnimatePresence, motion } from 'framer-motion';
import { MERKE_LANG, type Fisk, type SorteringHud } from '../graboks/kontor-sortering';
import { ETIKETT, PANEL } from './stil';

// Sorteringen i bua: én fisk om gangen på brettet med en målestav under, tida som en stripe, og de
// tre haugene. Fisken som er lagt, flyr til haugen; feil gir en kort forklaring.

const HAUGER = [
    { nr: 1, navn: 'Fin', om: 'lang og lys, hel', farge: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    { nr: 2, navn: 'Middels', om: 'kort eller mørk', farge: 'bg-amber-50 border-amber-300 text-amber-900' },
    { nr: 3, navn: 'Vrak', om: 'mugg, gnagd, brukket, fuktig', farge: 'bg-rose-50 border-rose-300 text-rose-900' },
];

const X0 = 30;
const SKALA = 300;
const lengdePx = (l: number) => 110 + l * SKALA;

function blend(a: number[], b: number[], t: number): string {
    const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** Tørrfisken sett fra siden: kuttet hode til venstre, halen til høyre. */
function FiskTegning({ f, kjent }: { f: Fisk; kjent: boolean }) {
    const L = lengdePx(f.lengde);
    const H = 26 + f.lengde * 16;
    const y = 52;
    const krum = (f.form - 0.5) * 8;
    const farge = blend([226, 210, 170], [118, 90, 58], f.mork);
    const kant = blend([170, 150, 110], [70, 52, 32], f.mork);
    const hale = X0 + L;
    const kropp = X0 + L * 0.84;
    const brukket = f.feil === 'brukket';
    const body = `M ${X0} ${y - H * 0.42} Q ${X0 + L * 0.35} ${y - H * 0.62 + krum} ${kropp} ${y - H * 0.16} L ${kropp} ${y + H * 0.16} Q ${X0 + L * 0.35} ${y + H * 0.6 + krum} ${X0} ${y + H * 0.42} Z`;
    const tail = `M ${kropp - 2} ${y - H * 0.14} L ${hale} ${y - H * 0.5} L ${hale - L * 0.05} ${y} L ${hale} ${y + H * 0.5} L ${kropp - 2} ${y + H * 0.14} Z`;
    return (
        <svg viewBox="0 0 440 104" className="h-[104px] w-full">
            {/* Målestaven: merket for lang fisk. */}
            <line x1={X0} y1={96} x2={X0 + lengdePx(1)} y2={96} stroke="#94a3b8" strokeWidth={2} />
            {Array.from({ length: 9 }, (_, i) => (
                <line key={i} x1={X0 + i * 50} y1={92} x2={X0 + i * 50} y2={100} stroke="#94a3b8" strokeWidth={1.5} />
            ))}
            <line x1={X0 + lengdePx(MERKE_LANG)} y1={10} x2={X0 + lengdePx(MERKE_LANG)} y2={100} stroke="#4f46e5" strokeWidth={2} strokeDasharray="5 4" />
            <text x={X0 + lengdePx(MERKE_LANG) + 4} y={20} fontSize={13} fill="#4338ca" fontWeight={700}>lang</text>
            <path d={body} fill={farge} stroke={kant} strokeWidth={2} />
            {/* Ryggfinnen og en mørk stripe langs siden, så den leses som fisk. */}
            <path d={`M ${X0 + L * 0.1} ${y - 2} Q ${X0 + L * 0.45} ${y + 3 + krum * 0.4} ${kropp} ${y}`} stroke={kant} strokeWidth={1.5} fill="none" opacity={0.6} />
            <g transform={brukket ? `rotate(28 ${kropp} ${y}) translate(10 6)` : undefined}>
                <path d={tail} fill={farge} stroke={kant} strokeWidth={2} />
            </g>
            {brukket && <path d={`M ${kropp} ${y - H * 0.2} l 5 6 l -6 5 l 6 6 l -5 6`} stroke="#7f1d1d" strokeWidth={2.5} fill="none" />}
            {f.feil === 'mugg' &&
                [0.22, 0.4, 0.55, 0.68, 0.33].map((t, i) => (
                    <ellipse key={i} cx={X0 + L * t} cy={y + (i % 2 ? 6 : -5)} rx={9 + (i % 3) * 3} ry={5 + (i % 2) * 2} fill={i % 2 ? '#d9e7d2' : '#8fae86'} opacity={0.9} />
                ))}
            {f.feil === 'gnagd' &&
                [0.3, 0.37, 0.6].map((t, i) => <circle key={i} cx={X0 + L * t} cy={y - H * 0.5 + (i === 2 ? H : 0)} r={8} fill="#f8fafc" />)}
            {kjent && f.fuktig && <path d={body} fill="#1e3a5f" opacity={0.22} />}
        </svg>
    );
}

export function KontorSortering({ h }: { h: SorteringHud }) {
    const andel = h.tid > 0 ? h.igjen / h.tid : 0;
    return (
        <div className={`pointer-events-none absolute bottom-6 left-1/2 z-[1100] w-[min(620px,94vw)] -translate-x-1/2 px-5 pb-3 pt-3 ${PANEL}`}>
            <div className="flex items-baseline justify-between">
                <span className={ETIKETT}>Sortere tørrfisk</span>
                <span className="text-[14px] text-slate-700">
                    <span className="mr-3 tabular-nums">Fisk {h.nr} av {h.av}</span>
                    <motion.span key={h.riktige} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="inline-block font-bold tabular-nums text-emerald-700">
                        {h.riktige} riktig
                    </motion.span>
                    {h.rekke >= 3 && <span className="ml-2 rounded-full bg-amber-100 px-2 text-[13px] font-bold text-amber-800">{h.rekke} på rad</span>}
                </span>
            </div>

            {h.fase === 'sorter' && h.fisk && (
                <>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full rounded-full ${andel < 0.3 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${andel * 100}%` }} />
                    </div>
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={h.nr}
                            initial={{ x: -120, opacity: 0, rotate: -4 }}
                            animate={{ x: 0, opacity: 1, rotate: 0 }}
                            exit={{ y: 60, opacity: 0, scale: 0.6, x: h.siste?.klasse ? (h.siste.klasse - 2) * 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="mt-1 rounded-xl bg-slate-50"
                        >
                            <FiskTegning f={h.fisk} kjent={h.kjent} />
                        </motion.div>
                    </AnimatePresence>
                    <div className="flex h-7 items-center justify-center">
                        {h.kjent ? (
                            <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`rounded-full px-3 py-0.5 text-[14px] font-bold ${h.fisk.fuktig ? 'bg-sky-100 text-sky-900' : 'bg-stone-100 text-stone-700'}`}>
                                {h.fisk.fuktig ? 'Myk og fuktig inni!' : 'Tørr og hard. Den holder.'}
                            </motion.span>
                        ) : (
                            <span className="text-[13px] text-slate-500">Mellomrom: kjenn på fisken (koster litt tid)</span>
                        )}
                    </div>
                </>
            )}

            {h.fase !== 'sorter' && <p className="mt-2 text-[16px] font-semibold leading-snug text-slate-900">{h.tekst}</p>}

            <div className="mt-2 grid grid-cols-3 gap-2">
                {HAUGER.map((g, i) => (
                    <motion.div
                        key={g.nr}
                        animate={h.siste?.klasse === g.nr ? { scale: [1.08, 1] } : { scale: 1 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-xl border-2 px-2 py-1.5 text-center ${g.farge}`}
                    >
                        <div className="text-[15px] font-bold">
                            {g.nr}: {g.navn} <span className="tabular-nums">({h.hauger[i]})</span>
                        </div>
                        <div className="text-[13px] opacity-80">{g.om}</div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {h.siste && !h.siste.riktig && h.fase === 'sorter' && (
                    <motion.p key={h.siste.n} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1 text-[14px] font-semibold text-rose-700">
                        Lambert: «{h.siste.hvorfor}»
                    </motion.p>
                )}
            </AnimatePresence>
            <p className="mt-1 text-[13px] text-slate-500">
                {h.fase === 'klar' ? 'Mellomrom: begynn · Q: gå' : h.fase === 'slutt' ? 'Mellomrom: ferdig' : '1, 2 eller 3 (eller J, K, L): legg i haugen'}
            </p>
        </div>
    );
}
