import { motion } from 'framer-motion';
import { BismerVisning } from '../graboks/BismerVisning';
import type { VeiingHud } from '../graboks/kontor-veiing';
import { BRIKKE, ETIKETT, GRONN, HJELP, PANEL, ROD, SVAK, TEKST, UTHEV } from './stil';

// Bårds fisk: bismeren stort mens en bunt veies, og regnebrettet nederst med det gutten har lest av.
// Til slutt tre svar i våger (tast 1-3), og Bårds eget tall fra Nordland til sammenligning.

const komma = (x: number) => x.toFixed(1).replace('.', ',');

export function KontorVeiing({ h }: { h: VeiingHud }) {
    const ferdig = h.fase === 'slutt';
    return (
        <>
            {h.bismer && <BismerVisning b={h.bismer} />}
            <div className={`pointer-events-none relative w-[min(600px,94vw)] px-5 pb-3 pt-3 ${PANEL}`}>
                <div className="flex items-baseline justify-between">
                    <span className={ETIKETT}>Bårds fisk på bismeren</span>
                    <span className={`${SVAK} font-bold tabular-nums`}>
                        {Math.min(h.nr + (h.fase === 'veie' ? 1 : 0), h.av)} / {h.av} bunter
                    </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                    {Array.from({ length: h.av }, (_, i) => {
                        const l = h.lest[i];
                        return (
                            <motion.div
                                key={i}
                                initial={false}
                                animate={l ? { scale: [1.2, 1] } : { scale: 1 }}
                                className={`flex h-12 flex-1 flex-col items-center justify-center rounded-md border ${l ? 'border-[#a5844f] bg-[#fbf3e2]' : 'border-dashed border-[#b99a68]'}`}
                            >
                                <span className="text-[16px] font-bold tabular-nums text-[#2b1d10]">{l ? komma(l.verdi) : '?'}</span>
                                {l && ferdig && <span className={`text-[13px] font-bold ${l.riktig ? GRONN : ROD}`}>{l.riktig ? 'rett' : 'skeiv'}</span>}
                            </motion.div>
                        );
                    })}
                    <span className={`${SVAK} w-14 shrink-0`}>pund</span>
                </div>
                {h.fase === 'klar' && <p className={`mt-2 ${TEKST}`}>Vei fem bunter. Legg sammen bismerpundene, og regn om til våger: 3 pund er én våg.</p>}
                {h.fase === 'veie' && <p className={`mt-2 ${TEKST}`}>{h.tekst || 'Flytt hanken til stanga ligger vannrett, og les av.'}</p>}
                {(h.fase === 'regn' || ferdig) && (
                    <div className="mt-2">
                        <p className={`${TEKST} font-semibold`}>{h.tekst}</p>
                        {h.fase === 'regn' && (
                            <div className="mt-1.5 flex flex-col gap-1.5">
                                {h.valg.map((v, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <span className={BRIKKE}>{i + 1}</span>
                                        <span className="text-[17px] font-bold text-[#2b1d10]">{v}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {ferdig && (
                            <div className={`mt-2 px-3 py-2 text-[15px] ${UTHEV}`}>
                                Du sa {h.svar !== null ? komma(h.svar) : '?'} våger. Riktig: {komma(h.riktigSvar)} våger. Bård veide {komma(h.bard)} våger hjemme i
                                Nordland: fisken tørker litt på veien sørover.
                            </div>
                        )}
                    </div>
                )}
                <p className={`mt-1.5 ${HJELP}`}>
                    {h.fase === 'klar'
                        ? 'Mellomrom: begynn · Q: gå'
                        : h.fase === 'veie'
                            ? 'A / D: flytt hanken · E eller mellomrom: les av'
                            : h.fase === 'regn'
                                ? '1, 2 eller 3: svar'
                                : 'Mellomrom: ferdig'}
                </p>
            </div>
        </>
    );
}
