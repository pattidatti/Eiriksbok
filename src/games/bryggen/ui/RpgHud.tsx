// Rollespillet i HUD-en (graboks/rpg.ts): pungen og rangen i livskortet øverst til venstre, og
// kortene som spretter opp når rykte, witten, en ferdighet eller rangen endrer seg. Kortene står midt
// på skjermen, der blikket er, og glir bort etter noen sekunder.
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RpgHud, RpgKort } from '../graboks/rpg';
import { FRAKSJONER } from '../bygg/rpg-data';
import { KORT } from './stil';

/** En mynt tegnet i SVG (ingen bilder). */
export function Mynt({ str = 18 }: { str?: number }) {
    return (
        <svg width={str} height={str} viewBox="0 0 20 20" aria-hidden className="shrink-0">
            <circle cx="10" cy="10" r="9" fill="#d4a017" stroke="#8a6508" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="5.6" fill="none" stroke="#8a6508" strokeWidth="1" />
            <path d="M10 6.2v7.6M6.2 10h7.6" stroke="#8a6508" strokeWidth="1.2" />
        </svg>
    );
}

/** Teller opp eller ned til det nye tallet, og spretter når det endrer seg. */
function useTeller(maal: number): [number, number] {
    const [vis, setVis] = useState(maal);
    const [puls, setPuls] = useState(0);
    const fra = useRef(maal);
    useEffect(() => {
        if (maal === fra.current) return;
        const start = fra.current;
        const t0 = performance.now();
        let raf = 0;
        let forste = true;
        const steg = () => {
            if (forste) setPuls((p) => p + 1);
            forste = false;
            const a = Math.min(1, (performance.now() - t0) / 700);
            setVis(Math.round(start + (maal - start) * (1 - (1 - a) ** 3)));
            if (a < 1) raf = requestAnimationFrame(steg);
            else fra.current = maal;
        };
        raf = requestAnimationFrame(steg);
        return () => {
            cancelAnimationFrame(raf);
            fra.current = maal;
        };
    }, [maal]);
    return [vis, puls];
}

/** Pungen under livsmåleren. */
export function PungLinje({ data }: { data: unknown }) {
    const d = data as RpgHud | null | undefined;
    const [vis, puls] = useTeller(d?.witten ?? 0);
    if (!d) return null;
    return (
        <div className="mt-1.5 flex items-center gap-1.5 text-[14px] text-[#5c4630]">
            <motion.span key={puls} initial={{ scale: puls ? 1.5 : 1, rotate: puls ? -20 : 0 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 11 }} className="inline-flex">
                <Mynt />
            </motion.span>
            <span className="font-bold tabular-nums text-[#2b1d10]">{vis}</span> witten
        </div>
    );
}

function farge(k: RpgKort): { ramme: string; merke: string } {
    if (k.type === 'rang') return { ramme: 'border-[#b07d24] bg-[#fbf1d6]', merke: 'bg-[#9a2a1c] text-[#fbf5e6]' };
    if (k.type === 'nivaa') return { ramme: 'border-[#b8402d] bg-[#f6e3d8]', merke: 'bg-[#9a2a1c] text-white' };
    if (k.type === 'laast') return { ramme: 'border-rose-300 bg-rose-50', merke: 'bg-rose-600 text-white' };
    if (k.type === 'witten') return { ramme: 'border-[#c9a45c] bg-[#fbf5e6]', merke: k.opp ? 'bg-[#f3e2b8] text-[#5a3519]' : 'bg-[#e2d2b0] text-[#5c4630]' };
    if (k.type === 'rykte' && k.fraksjon) return { ramme: KORT, merke: FRAKSJONER[k.fraksjon].lys };
    return { ramme: KORT, merke: 'bg-[#efe3c8] text-[#2b1d10]' };
}

function Etikett({ k }: { k: RpgKort }) {
    if (k.type === 'rang') return <>Rang</>;
    if (k.type === 'nivaa') return <>Ferdighet</>;
    if (k.type === 'laast') return <>Låst</>;
    if (k.type === 'witten') return <Mynt str={16} />;
    if (k.type === 'rykte') return <>Rykte</>;
    if (k.type === 'ferdighet') return <>Øvelse</>;
    return <>Nytt</>;
}

function Kortet({ k, i }: { k: RpgKort; i: number }) {
    const f = farge(k);
    const stor = k.type === 'rang' || k.type === 'nivaa';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95, transition: { duration: 0.35 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 20, delay: Math.min(i, 4) * 0.08 }}
            className={`bry flex items-center gap-3 rounded-xl border-2 px-4 shadow-xl ${f.ramme} ${stor ? 'w-[min(460px,90vw)] py-3' : 'w-max max-w-[min(460px,90vw)] py-2'}`}
        >
            <span className={`inline-flex shrink-0 items-center justify-center rounded-lg px-2 py-0.5 text-[13px] font-bold uppercase tracking-wide ${f.merke}`}>
                <Etikett k={k} />
            </span>
            <div className="min-w-0">
                <div className={`flex items-baseline gap-2 font-bold leading-tight text-[#2b1d10] ${stor ? 'bry-display text-[22px]' : 'text-[16px]'}`}>
                    <span>{k.tittel}</span>
                    {k.verdi && (
                        <motion.span key={k.verdi} initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }} className={`tabular-nums ${k.opp ? 'text-[#3f6b2a]' : 'text-[#9a2a1c]'}`}>
                            {k.verdi}
                        </motion.span>
                    )}
                </div>
                {k.tekst && <div className={`leading-snug text-[#5c4630] ${stor ? 'text-[15px]' : 'text-[14px]'}`}>{k.tekst}</div>}
            </div>
        </motion.div>
    );
}

/** Kortene midt på skjermen (systempanel på plassen 'hel'). */
export function RpgKortPanel({ data }: { data: unknown }) {
    const d = data as RpgHud;
    // Rang og nye nivåer først, så resten i den rekkefølgen de kom.
    const kort = [...d.kort].sort((a, b) => Number(b.type === 'rang') - Number(a.type === 'rang'));
    return (
        <div className="pointer-events-none absolute left-1/2 top-[45%] z-[1050] flex -translate-x-1/2 flex-col items-center gap-1.5">
            <AnimatePresence>
                {kort.map((k, i) => (
                    <Kortet key={k.id} k={k} i={i} />
                ))}
            </AnimatePresence>
        </div>
    );
}
