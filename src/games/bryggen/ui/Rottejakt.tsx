import type { RottejaktHud } from '../graboks/rottejakt';
import { ETIKETT, FYLL, PANEL, RILLE, SVAK, TEKST, VARM } from './stil';

// Rottejakta på lagerloftet: hvor mye av fisken som er hel, hvor mange rotter som er tatt, og
// fellene. Står øverst til venstre, under livet, så midten av bildet er fritt til å se rottene.

export function Rottejakt({ h }: { h: RottejaktHud }) {
    const farge = h.fisk > 60 ? FYLL.gronn : h.fisk > 30 ? FYLL.gull : FYLL.segl;
    return (
        <div className={`pointer-events-none absolute z-[1100] left-4 top-28 w-[300px] px-4 py-3 ${PANEL}`}>
            <div className={ETIKETT}>Rottejakt på lagerloftet</div>
            <div className="mt-2 flex items-baseline justify-between text-[16px] text-[#2b1d10]">
                <span>Fisken</span>
                <span className="font-semibold tabular-nums">{h.fisk} % hel</span>
            </div>
            <div className={`mt-1 h-3 rounded-full ${RILLE}`}>
                <div className={`h-full ${farge} transition-all`} style={{ width: `${h.fisk}%` }} />
            </div>
            <div className="mt-2 flex items-center gap-1.5" aria-label={`${h.fanget} av ${h.maal} rotter tatt`}>
                {Array.from({ length: h.maal }, (_, i) => (
                    <span
                        key={i}
                        className={`h-5 w-5 rounded-full border-2 ${i < h.fanget ? 'border-[#5a3519] bg-[#5a3519]' : 'border-[#a5844f] bg-[#fbf5e6]'}`}
                    />
                ))}
                <span className="ml-2 text-[16px] font-bold tabular-nums text-[#2b1d10]">
                    {h.fanget}/{h.maal} rotter
                </span>
            </div>
            <div className={`mt-1 ${SVAK}`}>
                Feller igjen å sette ut: <span className="font-bold text-[#2b1d10]">{h.igjen}</span>
                {h.slaatt > 0 && <span className={`ml-2 font-bold ${VARM}`}>{h.slaatt} har slått</span>}
            </div>
            <p className={`mt-2 ${TEKST}`}>{h.hint}</p>
        </div>
    );
}
