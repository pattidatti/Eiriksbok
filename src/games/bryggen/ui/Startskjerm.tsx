// Startskjermen: hva scenen er, og om eleven vil spille med mus eller bare tastatur (Enter).
import { useEffect, useRef } from 'react';
import type { WorldId } from '../graboks/game';
import { Segl } from './Segl';
import { DISPLAY, ETIKETT, KNAPP, KNAPP_2, PANEL, ROD, STREK, SVAK, TEKST, UTHEV } from './stil';

const INTRO: Record<WorldId, { tag: string; title: string; text: string }> = {
    graboks: {
        tag: 'Motorprøve · gråboks',
        title: 'Bryggen, 1420-årene',
        text: 'Ingen grafikk ennå, bare følelsen. Løp gjennom gårdsrommet, klatre opp på svalgangen fra kassestabelen, prøv kameraet i det trange smuget til høyre, ro færingen ved kaia og slåss med tyven inne i gårdsrommet.',
    },
    gard: {
        tag: 'Modulsett · første gård',
        title: 'En gård på Bryggen',
        text: 'Den første gården bygget av modulsettet: laftehus med torv- og bordtak, svalganger over gårdsrommet, vinsjer i gavlene og kai på bolverk. Nikolaikirkeallmenningen ligger til høyre, og nabogårdene langs bryggefronten er bygget av det samme settet.',
    },
};

export function Startskjerm({ world, laster, feil, onStart }: { world: WorldId; laster: boolean; feil: string | null; onStart: (mus: boolean) => void }) {
    const i = INTRO[world];
    // Fokus på «Bare tastatur» når spillet er lastet: Enter starter da med tastatur, og fokusringen viser det.
    const tastatur = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (!laster) tastatur.current?.focus();
    }, [laster]);
    return (
        <div className="bry absolute inset-0 z-30 flex items-center justify-center bg-[#e9dcc0]/70 backdrop-blur-[3px]">
            <div className={`relative w-[min(620px,92vw)] px-8 pb-7 pt-7 ${PANEL}`}>
                <Segl className="absolute -right-5 -top-6 rotate-[14deg] drop-shadow-[0_4px_6px_rgba(60,20,8,0.35)]" storrelse={92} />
                <p className={ETIKETT}>{i.tag}</p>
                <h1 className={`${DISPLAY} mt-1 text-[44px] leading-[1.05]`}>{i.title}</h1>
                <div className={`${STREK} mt-3`} />
                <p className={`${TEKST} mt-3 text-[17px]`}>{i.text}</p>
                <p className={`${SVAK} mt-3 text-[15px]`}>Esc åpner menyen med kontroller, innstillinger og oppdragene dine.</p>
                {feil && <p className={`${UTHEV} mt-3 p-2 text-[14px] ${ROD}`}>{feil}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                    <button disabled={laster} onClick={() => onStart(true)} className={`${KNAPP} px-6 py-3 text-[18px]`}>
                        {laster ? 'Laster ...' : 'Start med mus'}
                    </button>
                    <button ref={tastatur} disabled={laster} onClick={() => onStart(false)} className={`${KNAPP_2} px-6 py-3 text-[18px]`}>
                        Bare tastatur (Enter)
                    </button>
                </div>
            </div>
        </div>
    );
}
