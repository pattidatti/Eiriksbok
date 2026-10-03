// Startskjermen: tittelen over første skudd av prologen, og om eleven vil spille med mus eller bare
// tastatur (Enter). Mens byen lastes, dekker pergamentet hele skjermen. Når den er klar, glir
// pergamentet bort mot venstre, og skuddet fra prologen (koggen på Vågen) står bak tittelen.
// Spillet står til eleven trykker Start (`GrayboxGame.begynn`), så åpningen ikke går tapt.
import { useEffect, useRef } from 'react';
import type { WorldId } from '../graboks/game';
import { Segl } from './Segl';
import { DISPLAY, ETIKETT, KNAPP, KNAPP_2, ROD, STREK, SVAK, TEKST, UTHEV } from './stil';

const INTRO: Record<WorldId, { tag: string; title: string; text: string }> = {
    graboks: {
        tag: 'Motorprøve · gråboks',
        title: 'Gråboksen',
        text: 'Ingen grafikk ennå, bare følelsen. Løp gjennom gårdsrommet, klatre opp på svalgangen fra kassestabelen, prøv kameraet i det trange smuget til høyre, ro færingen ved kaia og slåss med tyven inne i gårdsrommet.',
    },
    gard: {
        tag: 'Hansabyen Bergen · 1426',
        title: 'Bryggen',
        text: 'En gutt på tolv år kommer fra Lübeck for å bli junge, den yngste arbeideren i en gård på Bryggen. Byen er stor, våt og farlig, og alt er nytt.',
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
        <div className="bry absolute inset-0 z-30 overflow-hidden">
            {/* Pergamentet over hele skjermen mens byen lastes. */}
            <div
                className={`bry-pergament pointer-events-none absolute inset-0 transition-opacity duration-[1400ms] ease-out ${laster ? 'opacity-100' : 'opacity-0'}`}
            />
            {/* Kantene av skuddet tones ned, og pergamentet ligger igjen bak teksten til venstre. */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_70%_45%,transparent_55%,rgba(43,29,16,0.45)_100%)]" />
            <div className="bry-pergament pointer-events-none absolute inset-y-0 left-0 w-[min(700px,100%)] [mask-image:linear-gradient(to_right,black_0%,black_52%,transparent_100%)]" />

            <div className="relative flex h-full items-center px-[clamp(20px,6vw,96px)]">
                <div className="w-[min(540px,100%)]">
                    <div className="bry-start-inn flex items-center gap-3" style={{ animationDelay: '0.1s' }}>
                        <Segl storrelse={58} className="shrink-0 -rotate-[8deg] drop-shadow-[0_3px_4px_rgba(60,20,8,0.35)]" />
                        <p className={ETIKETT}>{i.tag}</p>
                    </div>
                    <h1
                        className={`bry-start-inn ${DISPLAY} mt-2 text-[clamp(64px,13vh,112px)] leading-[0.95] tracking-[0.01em]`}
                        style={{ animationDelay: '0.25s' }}
                    >
                        {i.title}
                    </h1>
                    <div className={`bry-start-strek ${STREK} mt-4`} />
                    <p className={`bry-start-inn ${TEKST} mt-4 text-[clamp(17px,2.4vh,20px)]`} style={{ animationDelay: '0.5s' }}>
                        {i.text}
                    </p>

                    {feil && <p className={`${UTHEV} mt-4 p-2 text-[14px] ${ROD}`}>{feil}</p>}

                    <div className="bry-start-inn mt-7 flex flex-wrap gap-3" style={{ animationDelay: '0.7s' }}>
                        <button disabled={laster} onClick={() => onStart(true)} className={`${KNAPP} px-7 py-3 text-[19px]`}>
                            {laster ? 'Bygger byen ...' : 'Start med mus'}
                        </button>
                        <button ref={tastatur} disabled={laster} onClick={() => onStart(false)} className={`${KNAPP_2} px-6 py-3 text-[19px]`}>
                            Bare tastatur (Enter)
                        </button>
                    </div>
                    {laster && (
                        <div className="mt-4 h-[3px] w-56 overflow-hidden rounded-full bg-[#b99a68]/35">
                            <div className="bry-start-laster h-full w-1/3 rounded-full bg-[#9a2a1c]" />
                        </div>
                    )}
                    <p className={`bry-start-inn ${SVAK} mt-5 text-[15px]`} style={{ animationDelay: '0.85s' }}>
                        Esc åpner menyen med kontroller, innstillinger og oppdragene dine. Fullskjerm slår du på i menyen.
                    </p>
                </div>
            </div>

            <style>{`
.bry-start-inn{animation:bry-start-inn .8s cubic-bezier(.2,.7,.2,1) both}
@keyframes bry-start-inn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.bry-start-strek{transform-origin:left;animation:bry-start-strek 1s .4s cubic-bezier(.6,0,.2,1) both}
@keyframes bry-start-strek{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bry-start-laster{animation:bry-start-laster 1.3s ease-in-out infinite}
@keyframes bry-start-laster{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
@media (prefers-reduced-motion:reduce){.bry-start-inn,.bry-start-strek,.bry-start-laster{animation:none}}
`}</style>
        </div>
    );
}
