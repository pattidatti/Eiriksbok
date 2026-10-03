// Oppdragsmeldingen midt oppe på skjermen: «Nytt oppdrag», et mål som er nådd, og «Oppdrag fullført».
//
// «Oppdrag fullført» er en liten seremoni (stil.css): arket ruller seg ut, tittelen skrives med blekk
// som tørker, og et voksegl stemples ned så arket rister og voksdråper spruter. Lyden (papir, slag,
// klokker) kommer fra LydKobling.oppdrag('ferdig'), tidsatt etter animasjonen. Med redusert bevegelse
// tones arket bare inn, og seglet står der fra start.
import { useEffect, useState } from 'react';
import type { HudState } from '../graboks/game';
import { Segl } from './Segl';
import { DISPLAY, ETIKETT, KORT, PANEL, SVAK, TEKST } from './stil';

type M = NonNullable<HudState['oppdragMelding']>;

// Voksdråpene som spruter ut når seglet treffer: retning i px.
const DRAAPER: [number, number, number][] = [
    [-46, -20, 7],
    [-38, 26, 5],
    [40, -30, 6],
    [48, 18, 8],
    [6, 44, 5],
    [-10, -46, 4],
];

/** `varighet`: hvor lenge meldingen står (ms) før Hud.tsx fjerner den. Toner ut det siste halve sekundet. */
export function Melding({ m, varighet }: { m: M; varighet: number }) {
    const [ut, setUt] = useState(false);
    useEffect(() => {
        const t = window.setTimeout(() => setUt(true), varighet - 500);
        return () => window.clearTimeout(t);
    }, [m, varighet]);

    const plass = 'pointer-events-none absolute left-1/2 top-[22%] text-center';

    if (m.type === 'maal') {
        return (
            <div key={m.n} role="status" className={`${plass} w-[min(520px,90vw)] px-6 py-3 ${KORT} ${ut ? 'bry-ut' : 'bry-inn'}`}>
                <div className={ETIKETT}>{m.tittel}</div>
                <div className={`${DISPLAY} mt-0.5 text-[28px] leading-tight`}>{m.tekst}</div>
            </div>
        );
    }

    if (m.type === 'nytt') {
        return (
            <div key={m.n} role="status" className={`${plass} w-[min(580px,90vw)] px-7 py-4 ${PANEL} ${ut ? 'bry-ut' : 'bry-inn'}`}>
                <div className={ETIKETT}>Nytt oppdrag</div>
                <div className={`${DISPLAY} mt-1 text-[34px] leading-tight`}>{m.tittel}</div>
                <div className="bry-strek mx-auto my-2 w-2/3" />
                <div className={`${TEKST} mx-auto max-w-md`}>{m.tekst}</div>
            </div>
        );
    }

    return (
        <div key={m.n} role="status" className={`${plass} w-[min(600px,90vw)] px-8 pb-5 pt-4 ${PANEL} ${ut ? 'bry-ut' : 'bry-ark-dunk'}`}>
            <div className={ETIKETT}>Oppdrag fullført</div>
            <div className={`${DISPLAY} bry-blekk mt-1 pr-14 text-[38px] leading-tight`}>{m.tittel}</div>
            <div className="bry-under">
                <div className="bry-strek mx-auto my-2 w-2/3" />
                <div className={`${TEKST} mx-auto max-w-md pr-10`}>{m.tekst}</div>
                <div className={`${SVAK} mt-2 text-[13px]`}>Skrevet i dagboka (Esc)</div>
            </div>
            {/* Seglet: faller ned og stemples til høyre for tittelen. */}
            <div className="absolute -right-7 top-1/2 -mt-12 h-24 w-24">
                <span className="bry-segl-ring absolute inset-0 rounded-full border-4 border-[#9a2a1c]/50" />
                {DRAAPER.map(([dx, dy, r], i) => (
                    <span
                        key={i}
                        className="bry-drape absolute rounded-full bg-[#9a2a1c]"
                        style={{ left: 48 - r / 2, top: 48 - r / 2, width: r, height: r, ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px` }}
                    />
                ))}
                <div className="bry-segl drop-shadow-[0_3px_4px_rgba(60,20,8,0.45)]">
                    <Segl storrelse={96} />
                </div>
            </div>
        </div>
    );
}
