// Pausemenyen (Esc): Fortsett, Meg, Innstillinger, Kontroller, Dagbok og Avslutt. Spillet står mens den
// er oppe (GrayboxGame.pause). Menyen til venstre, det valgte til høyre.
//
// Tastatur: pil opp/ned i menyen viser hvert valg til høyre, Enter eller pil høyre går inn i det,
// pil opp/ned flytter mellom valgene der, og Esc (eller pil venstre) går tilbake til menyen. Esc i
// menyen er Fortsett.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { InnstillingerPanel } from './InnstillingerPanel';
import { Dagbok, type Bok } from './Dagbok';
import { Knapp } from './menydeler';
import { FOKUS, flyttFokus, pilNav } from './fokus';
import type { Innstillinger } from './innstillinger';
import { Meg } from './Meg';
import { aktivtRollespill } from '../graboks/rpg';

type Valg = 'fortsett' | 'meg' | 'innstillinger' | 'kontroller' | 'dagbok' | 'avslutt';

const MENY: [Valg, string][] = [
    ['fortsett', 'Fortsett'],
    ['meg', 'Meg'],
    ['innstillinger', 'Innstillinger'],
    ['kontroller', 'Kontroller'],
    ['dagbok', 'Oppdrag og dagbok'],
    ['avslutt', 'Avslutt'],
];

const KONTROLLER: [string, string][] = [
    ['W A S D', 'gå og løp'],
    ['Shift', 'sprint'],
    ['Mellomrom', 'hopp, klatre opp på kanter'],
    ['Mus / piltaster', 'snu kameraet'],
    ['E', 'snakk, gjør noe, gå om bord og i land'],
    ['1, 2, 3, 4', 'svar i en samtale'],
    ['Venstre klikk / J', 'lett slag'],
    ['Hold venstre / K', 'tungt slag'],
    ['Høyre klikk / L (hold)', 'blokker'],
    ['Q / C', 'rull unna'],
    ['F', 'avslutt slagsmålet (når fienden vakler)'],
    ['R', 'start slagsmålet på nytt'],
    ['O', 'skjul eller vis oppdragene'],
    ['G', 'full eller lav grafikk'],
    ['M', 'lyd av eller på'],
    ['Esc', 'pause og meny'],
];

interface Props {
    valg: Innstillinger;
    onEndre: (v: Innstillinger) => void;
    harLyd: boolean;
    bok: Bok | null;
    vet: string[];
    onFortsett: () => void;
    onAvslutt: () => void;
    onNullstill: (() => void) | null;
    onFullskjerm: () => void;
}

export function Pausemeny({ valg, onEndre, harLyd, bok, vet, onFortsett, onAvslutt, onNullstill, onFullskjerm }: Props) {
    const [vis, setVis] = useState<Valg>('fortsett');
    const panelRef = useRef<HTMLDivElement>(null);
    const knapper = useRef(new Map<Valg, HTMLButtonElement>());

    useEffect(() => {
        knapper.current.get('fortsett')?.focus();
    }, []);

    const tilMenyen = () => knapper.current.get(vis)?.focus();
    const inn = () => {
        // Neste bilde: panelet kan nettopp ha byttet innhold.
        requestAnimationFrame(() => flyttFokus(panelRef.current, 1));
    };

    // Esc: fra panelet tilbake til menyen, fra menyen Fortsett.
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.code !== 'Escape') return;
            // Fanget før siden og spillet ser tasten (capture), så Esc ikke åpner menyen igjen.
            e.preventDefault();
            e.stopPropagation();
            if (panelRef.current?.contains(document.activeElement)) tilMenyen();
            else onFortsett();
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    });

    const velg = (v: Valg) => {
        if (v === 'fortsett') onFortsett();
        else inn();
    };

    const menyTast = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'ArrowRight' && vis !== 'fortsett') {
            e.preventDefault();
            inn();
        } else pilNav(e);
    };

    const panelTast = (e: KeyboardEvent<HTMLDivElement>) => {
        const range = (e.target as HTMLElement).getAttribute('type') === 'range';
        if (e.key === 'ArrowLeft' && !range) {
            e.preventDefault();
            tilMenyen();
        } else pilNav(e);
    };

    return (
        <div className="absolute inset-0 z-[1200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
            <div role="dialog" aria-modal="true" aria-label="Pause" className="flex h-[min(640px,92vh)] w-[min(940px,95vw)] overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div onKeyDown={menyTast} className="flex w-64 shrink-0 flex-col gap-1.5 bg-slate-100 p-4">
                    <div className="px-2 pb-2">
                        <p className="text-[13px] font-bold uppercase tracking-widest text-indigo-700">Pause</p>
                        <p className="font-[Outfit,Inter,sans-serif] text-[20px] font-extrabold leading-tight text-slate-900">Bryggen, 1420-årene</p>
                    </div>
                    {MENY.filter(([id]) => id !== 'meg' || aktivtRollespill()).map(([id, tekst]) => (
                        <button
                            key={id}
                            ref={(el) => {
                                if (el) knapper.current.set(id, el);
                            }}
                            onFocus={() => setVis(id)}
                            onMouseEnter={() => id !== 'fortsett' && setVis(id)}
                            onClick={() => {
                                setVis(id);
                                velg(id);
                            }}
                            aria-current={vis === id}
                            className={`rounded-xl px-4 py-3 text-left text-[18px] font-semibold ${FOKUS} ${
                                vis === id ? (id === 'fortsett' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700 shadow') : 'text-slate-800 hover:bg-white/70'
                            }`}
                        >
                            {tekst}
                        </button>
                    ))}
                    <p className="mt-auto px-2 text-[13px] leading-snug text-slate-600">Pil opp og ned, Enter for å velge, Esc for å gå tilbake. Fremgangen lagres hele tiden.</p>
                </div>

                <div ref={panelRef} onKeyDown={panelTast} className="min-w-0 flex-1 overflow-y-auto p-5">
                    <h2 className="mb-3 px-3 text-[22px] font-bold text-slate-900">{MENY.find(([id]) => id === vis)?.[1]}</h2>
                    {vis === 'fortsett' && (
                        <div className="px-3 text-[16px] leading-relaxed text-slate-700">
                            <p>Spillet står stille mens menyen er oppe. Klokka, været og folkene venter på deg.</p>
                            <p className="mt-2">Trykk Enter eller Esc for å spille videre.</p>
                            {bok && bok.some((o) => o.status !== 'levert') && (
                                <div className="mt-4 rounded-xl bg-amber-50 p-3">
                                    <p className="text-[13px] font-bold uppercase tracking-widest text-amber-800">Oppdragene dine</p>
                                    {bok
                                        .filter((o) => o.status !== 'levert')
                                        .map((o) => (
                                            <p key={o.id} className="text-[16px] font-semibold text-slate-900">
                                                {o.status === 'klar' ? '✓ ' : ''}
                                                {o.tittel}
                                            </p>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                    {vis === 'meg' && <Meg />}
                    {vis === 'innstillinger' && <InnstillingerPanel valg={valg} onEndre={onEndre} harLyd={harLyd} onFullskjerm={onFullskjerm} />}
                    {vis === 'kontroller' && (
                        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 px-3">
                            {KONTROLLER.map(([k, v]) => (
                                <div key={k} className="contents">
                                    <dt>
                                        <kbd className="inline-block rounded-lg border border-slate-300 bg-slate-50 px-2 py-0.5 text-[15px] font-bold text-slate-900 shadow-sm">{k}</kbd>
                                    </dt>
                                    <dd className="self-center text-[16px] text-slate-800">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    {vis === 'dagbok' && <Dagbok bok={bok} vet={vet} onNullstill={onNullstill} />}
                    {vis === 'avslutt' && (
                        <div className="px-3">
                            <p className="text-[17px] leading-snug text-slate-800">Vil du avslutte spillet? Fremgangen din er lagret, så du kan fortsette neste gang.</p>
                            <div className="mt-4 flex gap-2">
                                <Knapp farge="rod" onClick={onAvslutt}>
                                    Ja, avslutt
                                </Knapp>
                                <Knapp onClick={tilMenyen}>Nei, bli her</Knapp>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
