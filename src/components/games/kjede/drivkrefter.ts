// Drivkreftene er RPG-laget i Kjedereaksjonen. Det er de samme drivkreftene
// historiefaget bruker til å forklare endring, og evnen speiler hva drivkraften
// faktisk gjør: makt kjøper deg tid, natur setter tempoet, økonomi kjøper deg
// ut av trøbbel, tro gir retning før du vet svaret.

import type { Drivkraft, DrivkraftId } from '../../../types/kjede';
import { FEILSPOR_DUR, FOG_SPEED, FOG_SURGE } from '../../../utils/kjedeFysikk';

export const DRIVKREFTER: Record<DrivkraftId, Drivkraft> = {
    makt: {
        id: 'makt',
        navn: 'Makt',
        // Fast påslag i sekunder ville betydd lite på et langt ledd og mye på et
        // kort. Tenketiden regnes nå ut fra hvor mye tekst som står på skjermen,
        // så evnen må være en faktor for å kjennes lik hele veien.
        effekt: 'Du får halvannen gang så lang tid på å velge.',
        begrunnelse: 'Makt gir deg tid andre ikke har.',
    },
    natur: {
        id: 'natur',
        navn: 'Natur',
        effekt: 'Glemselen kryper 20 prosent saktere.',
        begrunnelse: 'Naturen setter tempoet, ikke du.',
    },
    okonomi: {
        id: 'okonomi',
        navn: 'Økonomi',
        // Virket før på tiden i feilsporet. Nå står Glemselen stille mens
        // eleven leser, så tid der nede koster ingenting - drivkraften måtte
        // flyttes over på det som faktisk er straffen: bykset.
        effekt: 'Et feilsvar gir Glemselen halvt byks.',
        begrunnelse: 'Rikdom kjøper deg ut av trøbbel.',
    },
    religion: {
        id: 'religion',
        navn: 'Religion',
        effekt: 'Én gal påstand smuldrer bort før hvert valg.',
        begrunnelse: 'Tro gir retning før du vet svaret.',
    },
};

export const DRIVKRAFT_IDS = Object.keys(DRIVKREFTER) as DrivkraftId[];

/** Samlede effekter av drivkreftene eleven har plukket opp. */
export interface DrivkraftEffekter {
    /** Ganges med lesetiden verden regner ut for det aktuelle leddet. */
    tenketidFaktor: number;
    tåkefart: number;
    feilsporTid: number;
    /** Hvor langt Glemselen rykker fram når eleven tar feil. */
    overtrampByks: number;
    fjernEttGaltSvar: boolean;
}

export const beregnEffekter = (valgte: DrivkraftId[]): DrivkraftEffekter => ({
    tenketidFaktor: valgte.includes('makt') ? 1.5 : 1,
    tåkefart: FOG_SPEED * (valgte.includes('natur') ? 0.8 : 1),
    feilsporTid: FEILSPOR_DUR,
    overtrampByks: FOG_SURGE * (valgte.includes('okonomi') ? 0.5 : 1),
    fjernEttGaltSvar: valgte.includes('religion'),
});

/**
 * Tre drivkrefter å velge mellom, deterministisk ut fra rundens frø slik at en
 * runde kan spilles om igjen helt likt.
 */
export const tilbud = (rng: () => number, alleredeValgt: DrivkraftId[]): DrivkraftId[] => {
    const pool = DRIVKRAFT_IDS.filter((id) => !alleredeValgt.includes(id));
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
};
