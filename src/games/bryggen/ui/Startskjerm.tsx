// Startskjermen: hva scenen er, og om eleven vil spille med mus eller bare tastatur (Enter).
import type { WorldId } from '../graboks/game';
import { FOKUS } from './fokus';

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
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
            <div className="w-[min(600px,92vw)] rounded-3xl bg-white p-7 shadow-xl">
                <p className="text-[13px] font-bold uppercase tracking-widest text-indigo-700">{i.tag}</p>
                <h1 className="mt-1 font-[Outfit,Inter,sans-serif] text-[30px] font-extrabold leading-tight text-slate-900">{i.title}</h1>
                <p className="mt-2 text-[16px] leading-snug text-slate-700">{i.text}</p>
                <p className="mt-3 text-[15px] text-slate-600">Esc åpner menyen med kontroller, innstillinger og oppdragene dine.</p>
                {feil && <p className="mt-3 rounded-lg bg-rose-50 p-2 text-[14px] text-rose-700">{feil}</p>}
                <div className="mt-5 flex flex-wrap gap-3">
                    <button disabled={laster} onClick={() => onStart(true)} className={`rounded-xl bg-indigo-600 px-5 py-3 text-[17px] font-semibold text-white shadow disabled:opacity-50 ${FOKUS}`}>
                        {laster ? 'Laster ...' : 'Start med mus'}
                    </button>
                    <button disabled={laster} onClick={() => onStart(false)} className={`rounded-xl bg-slate-200 px-5 py-3 text-[17px] font-semibold text-slate-900 disabled:opacity-50 ${FOKUS}`}>
                        Bare tastatur (Enter)
                    </button>
                </div>
            </div>
        </div>
    );
}
