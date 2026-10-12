import type { LearningPathStep, PresentationData, Slide, StationV3 } from '../../types';
import { filmLenke } from './filmIndex';

// Filmene i læringsstiene. Stien vet ikke om filmene: den lenker til artikler, og en artikkel
// med manus har film. Derfor finner vi filmene ut fra lenkene, og ingen sti-JSON trenger å
// endres når nattrutinen lager en ny film.

const LENKE = /\]\((\/[^)\s#?]+)\)/g;

/** Artikkel-stiene med film som tekstene og lenkene peker på, i rekkefølge, uten duplikater. */
export function filmerI(tekster: (string | undefined)[], urls: string[] = []): string[] {
    const funnet: string[] = [];
    const alle = [
        ...tekster.flatMap((t) => [...(t || '').matchAll(LENKE)].map((m) => m[1])),
        ...urls,
    ];
    for (const url of alle) {
        const sti = url.replace(/\/$/, '');
        if (filmLenke(sti) && !funnet.includes(sti)) funnet.push(sti);
    }
    return funnet;
}

const oppgavetekst = (t: string | { text: string }) => (typeof t === 'string' ? t : t.text);

export function filmerISteg(step: LearningPathStep): string[] {
    return filmerI(
        [step.content, ...(step.tasks || []).map(oppgavetekst)],
        (step.links || []).filter((l) => !l.external).map((l) => l.url)
    );
}

export function filmerIStasjon(station: StationV3): string[] {
    return filmerI(
        [...station.story, ...(station.tasks || []).map(oppgavetekst)],
        (station.readMore || []).map((l) => l.url)
    );
}

/**
 * Setter inn ett film-lysbilde per film i steget den hører til: etter stegets egne lysbilder,
 * men før oppgavepausen, slik at læreren introduserer, viser filmen og så lar elevene jobbe.
 * Virker likt for kuraterte og autogenererte presentasjoner.
 */
export function leggInnFilmLysbilder(
    data: PresentationData,
    filmerPerSteg: Map<string, string[]>
): PresentationData {
    if (filmerPerSteg.size === 0) return data;
    const slides: Slide[] = [];
    const brukt = new Set<string>();
    data.slides.forEach((slide, i) => {
        const steg = slide.linksToStepId;
        const neste = data.slides[i + 1];
        const erPause = (s?: Slide) => !!s && (s.layout === 'task-pause' || !!s.pauseForTask);
        // Filmen kommer før stegets første oppgavepause, eller etter stegets siste lysbilde.
        const settInnFor = steg && erPause(slide) && !brukt.has(steg);
        const settInnEtter =
            steg && !brukt.has(steg) && !erPause(slide) && neste?.linksToStepId !== steg;
        if (settInnFor) slides.push(...filmLysbilder(steg, slide, filmerPerSteg, brukt));
        slides.push(slide);
        if (settInnEtter) slides.push(...filmLysbilder(steg, slide, filmerPerSteg, brukt));
    });
    return { ...data, slides };
}

function filmLysbilder(
    steg: string,
    naboen: Slide,
    filmerPerSteg: Map<string, string[]>,
    brukt: Set<string>
): Slide[] {
    brukt.add(steg);
    return (filmerPerSteg.get(steg) || []).map((film) => ({
        id: `film-${film}`,
        title: 'Film',
        layout: 'film' as const,
        film,
        linksToStepId: steg,
        phase: naboen.phase,
        teacherNotes:
            'Filmen spilles av på projektoren. Klikk på play der (eller trykk mellomrom). ' +
            'Trykk NESTE når filmen er ferdig.',
    }));
}
