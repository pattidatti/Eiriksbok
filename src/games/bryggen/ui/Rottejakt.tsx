import type { RottejaktHud } from '../graboks/rottejakt';

// Rottejakta på lagerloftet: hvor mye av fisken som er hel, hvor mange rotter som er tatt, og
// fellene. Står øverst til venstre, under livet, så midten av bildet er fritt til å se rottene.

export function Rottejakt({ h }: { h: RottejaktHud }) {
    const farge = h.fisk > 60 ? 'bg-emerald-500' : h.fisk > 30 ? 'bg-amber-500' : 'bg-rose-600';
    return (
        <div className="pointer-events-none absolute z-[1100] left-4 top-28 w-[300px] rounded-2xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
            <div className="text-[13px] font-bold uppercase tracking-wide text-indigo-700">Rottejakt på lagerloftet</div>
            <div className="mt-2 flex items-baseline justify-between text-[15px] text-slate-800">
                <span>Fisken</span>
                <span className="font-semibold tabular-nums">{h.fisk} % hel</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full ${farge} transition-all`} style={{ width: `${h.fisk}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5" aria-label={`${h.fanget} av ${h.maal} rotter tatt`}>
                {Array.from({ length: h.maal }, (_, i) => (
                    <span
                        key={i}
                        className={`h-5 w-5 rounded-full border-2 ${i < h.fanget ? 'border-slate-800 bg-slate-800' : 'border-slate-400 bg-white'}`}
                    />
                ))}
                <span className="ml-2 text-[15px] font-semibold tabular-nums text-slate-900">
                    {h.fanget}/{h.maal} rotter
                </span>
            </div>
            <div className="mt-1 text-[14px] text-slate-600">
                Feller igjen å sette ut: <span className="font-semibold text-slate-900">{h.igjen}</span>
                {h.slaatt > 0 && <span className="ml-2 font-semibold text-amber-700">{h.slaatt} har slått</span>}
            </div>
            <p className="mt-2 text-[15px] leading-snug text-slate-900">{h.hint}</p>
        </div>
    );
}
