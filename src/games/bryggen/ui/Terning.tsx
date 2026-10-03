import { motion } from 'framer-motion';
import { JUKSESIDER, type TerningHud } from '../graboks/terning';
import { useNaa } from './useNaa';

// Terningspillet i ølstua: Einars to terninger øverst, guttens nederst. Mens terningene ruller,
// skifter øynene og terningene vipper; når de stopper, spretter de på plass.

const OYNE: Record<number, [number, number][]> = {
    1: [[1, 1]],
    2: [[0, 0], [2, 2]],
    3: [[0, 0], [1, 1], [2, 2]],
    4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
    6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

function Terningen({ verdi, ruller, nr, juks, naa }: { verdi: number; ruller: boolean; nr: number; juks?: boolean; naa: number }) {
    // Mens den ruller: et nytt tall omtrent hver 70. ms, trukket fra tida så det ser tilfeldig ut.
    const steg = Math.floor(naa / 70);
    const vis = ruller ? (juks ? JUKSESIDER[(steg * 7 + nr) % 6] : 1 + ((steg * 5 + nr * 3) % 6)) : verdi;
    const vipp = ruller ? Math.sin(naa / 45 + nr) * 25 : 0;
    if (!vis) return <div className="h-14 w-14 rounded-xl border-2 border-dashed border-slate-300" />;
    return (
        <motion.div
            key={ruller ? 'r' : `s${verdi}`}
            initial={ruller ? false : { scale: 1.35, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
            style={{ rotate: vipp }}
            className={`grid h-14 w-14 grid-cols-3 grid-rows-3 gap-0.5 rounded-xl border-2 p-1.5 shadow-md ${juks ? 'border-amber-700 bg-amber-100' : 'border-stone-500 bg-stone-50'}`}
        >
            {Array.from({ length: 9 }, (_, i) => {
                const x = i % 3;
                const y = Math.floor(i / 3);
                const har = OYNE[vis].some(([a, b]) => a === x && b === y);
                return <span key={i} className={`m-auto h-2.5 w-2.5 rounded-full ${har ? 'bg-stone-900' : ''}`} />;
            })}
        </motion.div>
    );
}

export function Terning({ h }: { h: TerningHud }) {
    const naa = useNaa();
    const ruller = naa < h.rulleTil;
    const einarRuller = ruller && h.fase === 'einar';
    const dinRuller = ruller && h.fase === 'kaster';
    const sum = (t: number[]) => (t[0] && t[1] ? t[0] + t[1] : null);
    const visEinar = h.fase !== 'klar' && h.einar[0] > 0;
    const visDin = h.din[0] > 0 && (h.fase === 'kaster' || h.fase === 'runde' || h.fase === 'tatt' || h.fase === 'slutt');
    const tapt = h.fase === 'tatt';
    return (
        <div className="pointer-events-none absolute z-[1100] bottom-6 left-1/2 w-[min(560px,94vw)] -translate-x-1/2 rounded-2xl bg-white/95 px-5 pb-3 pt-3 shadow-xl">
            <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold uppercase tracking-wide text-indigo-700">Terninger i ølstua</span>
                <span className="text-[14px] text-slate-700">
                    {h.runde > 0 && <span className="mr-3">Runde {Math.min(h.runde, h.runder)} av {h.runder}</span>}
                    <motion.span key={h.witten} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className={`inline-block font-bold tabular-nums ${h.witten > h.start ? 'text-emerald-700' : h.witten < h.start ? 'text-rose-700' : 'text-slate-900'}`}>
                        {h.witten} witten
                    </motion.span>
                </span>
            </div>

            <div className="mt-3 grid grid-cols-[90px_1fr_60px] items-center gap-y-3 rounded-xl bg-amber-900/90 px-3 py-3 text-amber-50">
                <span className="text-[15px] font-semibold">Einar</span>
                <div className="flex gap-3">
                    <Terningen verdi={visEinar ? h.einar[0] : 0} ruller={einarRuller} nr={1} naa={naa} />
                    <Terningen verdi={visEinar ? h.einar[1] : 0} ruller={einarRuller} nr={4} naa={naa} />
                </div>
                <span className="text-right text-[22px] font-black tabular-nums">{visEinar && !einarRuller ? sum(h.einar) : ''}</span>
                <span className="text-[15px] font-semibold">Du</span>
                <div className="flex gap-3">
                    <Terningen verdi={visDin ? h.din[0] : 0} ruller={dinRuller} nr={2} naa={naa} />
                    <Terningen verdi={visDin ? h.din[1] : 0} ruller={dinRuller} nr={5} juks={h.juks} naa={naa} />
                </div>
                <span className="text-right text-[22px] font-black tabular-nums">{visDin && !dinRuller ? sum(h.din) : ''}</span>
            </div>

            {h.einarSier && <p className="mt-2 text-[15px] italic text-slate-600">{h.einarSier}</p>}
            {!ruller && (
                <p className={`mt-1 text-[16px] font-semibold leading-snug ${tapt ? 'text-rose-700' : 'text-slate-900'}`}>{h.tekst}</p>
            )}
            {h.fase === 'din' && (
                <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[14px] text-amber-900">
                    Under benken ligger en terning med to firere og to femmere, men ingen ener eller toer.
                    <div className="mt-1 font-semibold">Mellomrom eller 1: kast · 2: kast med jukseterningen · 3: reis deg</div>
                </div>
            )}
            <p className="mt-1 text-[13px] text-slate-500">
                {h.fase === 'klar' ? 'Mellomrom: begynn · Q: gå fra bordet' : h.fase === 'runde' ? 'Mellomrom: neste · 3: reis deg' : h.fase === 'slutt' || h.fase === 'tatt' ? 'Mellomrom: reis deg fra bordet' : ''}
            </p>
        </div>
    );
}
