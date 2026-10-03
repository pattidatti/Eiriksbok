import { motion } from 'framer-motion';
import type { MesseHud } from '../graboks/messe';

// Messen i Mariakirken: flammen mens gutten bærer lyset (øverst til venstre), og svarene i messen
// nederst, så presten og boblen over hodet hans synes midt i bildet.

function Flamme({ f }: { f: number }) {
    const pst = Math.round(f * 100);
    const farge = f > 0.6 ? 'bg-amber-400' : f > 0.3 ? 'bg-orange-500' : 'bg-rose-600';
    return (
        <div className="pointer-events-none absolute z-[1100] left-4 top-28 w-[300px] rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
            <div className="text-[13px] font-bold uppercase tracking-wide text-indigo-700">Lyset til høyalteret</div>
            <div className="mt-2 flex items-center gap-3">
                <motion.div
                    className="h-8 w-5 rounded-[50%_50%_45%_45%/60%_60%_40%_40%] bg-gradient-to-t from-orange-500 to-yellow-200 shadow-[0_0_18px_rgba(251,191,36,0.9)]"
                    animate={{ scaleY: [1, 0.85 + f * 0.1, 1], rotate: f < 0.5 ? [-8, 8, -8] : [-2, 2, -2] }}
                    transition={{ duration: f < 0.5 ? 0.25 : 0.6, repeat: Infinity }}
                    style={{ opacity: 0.4 + f * 0.6 }}
                />
                <div className="flex-1">
                    <div className="flex justify-between text-[15px] text-slate-800">
                        <span>Flammen</span>
                        <span className="font-semibold tabular-nums">{pst} %</span>
                    </div>
                    <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
                        <div className={`h-full ${farge}`} style={{ width: `${pst}%` }} />
                    </div>
                </div>
            </div>
            <p className="mt-2 text-[15px] leading-snug text-slate-900">
                {f < 0.4 ? 'Flammen blafrer! Stå stille litt.' : 'Gå rolig opp i koret. Ikke løp (Shift), og ikke hopp.'}
            </p>
        </div>
    );
}

export function Messe({ h }: { h: MesseHud }) {
    if (h.flamme !== null) return <Flamme f={h.flamme} />;
    const bjelle = h.fase === 'vent' || h.fase === 'loft';
    const vis = h.fase === 'svar' || h.fase === 'riktig' || h.fase === 'feil';
    return (
        <div className="pointer-events-none absolute z-[1100] bottom-6 left-1/2 w-[min(640px,94vw)] -translate-x-1/2 rounded-2xl bg-white/95 px-5 pb-3 pt-3 shadow-xl">
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold uppercase tracking-wide text-indigo-700">Messe i Mariakirken</span>
                <span className="flex items-center gap-1.5" aria-label={`Del ${h.nr + 1} av ${h.antall}`}>
                    {Array.from({ length: h.antall }, (_, i) => (
                        <span key={i} className={`h-3 w-3 rounded-full ${i < h.nr ? 'bg-indigo-600' : i === h.nr ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                    ))}
                    <span className="ml-2 text-[14px] font-semibold text-slate-700">Bom: {h.bom}</span>
                </span>
            </div>

            {h.prest && h.fase !== 'klar' && h.fase !== 'igjen' && h.fase !== 'ferdig' && (
                <motion.p key={h.prest} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 font-serif text-[22px] italic text-slate-900">
                    <span className="mr-2 font-sans text-[14px] not-italic font-semibold text-slate-500">Herr Johannes:</span>«{h.prest}»
                </motion.p>
            )}
            {h.hvisk && <p className="mt-1 text-[15px] italic text-slate-600">Bertolt hvisker: {h.hvisk}</p>}

            {vis && (
                <div className="mt-2 grid gap-1.5">
                    {h.valg.map((v, i) => {
                        const rett = h.fase !== 'svar' && i === h.riktig;
                        const galt = h.fase === 'feil' && i === h.valgt;
                        return (
                            <motion.div
                                key={v}
                                animate={galt ? { x: [0, -8, 8, -5, 5, 0] } : rett ? { scale: [1, 1.04, 1] } : {}}
                                transition={{ duration: 0.4 }}
                                className={`flex items-center gap-3 rounded-xl border-2 px-3 py-1.5 text-[17px] ${rett ? 'border-emerald-500 bg-emerald-50' : galt ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-white'}`}
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-[15px] font-bold text-white">{i + 1}</span>
                                <span className="font-serif italic text-slate-900">{v}</span>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {bjelle && (
                <div className="mt-2 flex items-center gap-4">
                    <motion.svg
                        viewBox="0 0 40 44"
                        className="h-14 w-14"
                        animate={h.fase === 'loft' ? { rotate: [-18, 18, -18] } : { rotate: 0 }}
                        transition={{ duration: 0.3, repeat: h.fase === 'loft' ? Infinity : 0 }}
                    >
                        <path d="M20 4 C10 4 8 16 8 26 L4 34 L36 34 L32 26 C32 16 30 4 20 4 Z" fill={h.fase === 'loft' ? '#f59e0b' : '#a8a29e'} stroke="#57534e" strokeWidth={2} />
                        <circle cx={20} cy={38} r={4} fill="#57534e" />
                    </motion.svg>
                    <p className={`text-[18px] font-bold ${h.fase === 'loft' ? 'text-amber-700' : 'text-slate-700'}`}>{h.tekst}</p>
                </div>
            )}

            {(h.fase === 'svar' || h.fase === 'loft') && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full ${h.tid < 0.3 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${h.tid * 100}%` }} />
                </div>
            )}

            {!bjelle && h.tekst && (
                <p className={`mt-2 text-[15px] leading-snug ${h.fase === 'feil' || h.fase === 'igjen' ? 'font-semibold text-rose-700' : h.fase === 'riktig' || h.fase === 'ferdig' ? 'font-semibold text-emerald-700' : 'text-slate-900'}`}>
                    {h.tekst}
                </p>
            )}
            <p className="mt-1 text-[13px] text-slate-500">
                {h.fase === 'svar' ? '1, 2 eller 3: svar · Q: gå fra alteret' : bjelle ? 'Mellomrom: ring med bjella · Q: gå fra alteret' : h.fase === 'ferdig' ? 'Mellomrom: ferdig' : h.fase === 'klar' || h.fase === 'igjen' ? 'Mellomrom: begynn · Q: gå fra alteret' : 'Q: gå fra alteret'}
            </p>
        </div>
    );
}
