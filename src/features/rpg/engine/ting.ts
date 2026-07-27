// Sakens fire trinn (blueprint §7.2).
//
//   1. **Lys drapet innen ett døgn.** Ellers er det ikke drap, det er mord, og
//      mord kan ikke bøtes. Spillet varsler ikke om fristen - den står på
//      runesteinen ved tingvollen, Torgeir sier den hvis eleven spør ham ut, og
//      han sier den én gang til når Gaute ligger. Tre ganger er nok. Fire ville
//      vært en påminnelse, og da er det ikke lenger en frist.
//   2. **Skaff vitner.** Krever at hun har folk rundt seg som vil stå der.
//      Vitner kan ikke kjøpes.
//   3. **Anfør loven.** Feil hjemmel taper saken selv om hun har rett i sak.
//   4. **Lovsigemannen resiterer**, og de frie mennene dømmer.
//
// Ren modul: alt her er funksjoner av tilstanden. Det gjør at bordet kan vise
// eleven nøyaktig hva som teller *før* hun sier noe - og at dommen ikke kan bli
// et annet regnestykke enn det hun så.

import { VITNER, LOVHJEMMEL_BY_ID, type VitneDef } from '../data/ting';
import type { AettTilstand, Sak } from '../types';

/** Døgnet hun har på seg. Ett, og det er ikke forhandlingsbart. */
export const LYSINGSFRIST_DAGER = 1;

export function innenforFristen(sak: Sak, dag: number): boolean {
    return dag - sak.skjeddeDag <= LYSINGSFRIST_DAGER;
}

export interface VitneStatus extends VitneDef {
    /** Kan hun kalle dette vitnet? */
    kan: boolean;
    /** Hvorfor ikke, sagt til eleven. */
    grunn: string | null;
}

/**
 * Hvem som kan stå fram, og hvorfor de andre ikke kan.
 *
 * De som ikke kan, står i lista likevel. Det er hele poenget: en liste uten
 * Kåre ville skjult at han ikke får lov, og det er nettopp det eleven skal se.
 */
export function vitneliste(aetter: Record<string, AettTilstand>): VitneStatus[] {
    return VITNER.map((v) => {
        if (v.sperre) return { ...v, kan: false, grunn: v.sperre };
        if (v.npcId === 'vigdis') {
            const velvilje = aetter.saebo?.velvilje ?? 0;
            return velvilje >= 40
                ? { ...v, kan: true, grunn: null }
                : {
                      ...v,
                      kan: false,
                      grunn: 'Hun kom ikke. Sæbø-ætta skylder deg ingenting, og vitner kan ikke kjøpes.',
                  };
        }
        return { ...v, kan: true, grunn: null };
    });
}

export interface Dom {
    dom: Sak['dom'];
    /** Det lovsigemannen sier fram når det er avgjort. */
    kjennelse: string;
    /** Hva det koster henne. Tomt når hun går fri. */
    folge: string;
}

/**
 * Dommen.
 *
 * Tre ting teller, og bare tre: hjemmelen (to poeng - den er halve saken), et
 * vitne (ett), og at folk kjenner deg fra før (ett). Tre poeng frikjenner.
 * Regnestykket står framme for eleven mens hun velger, så dommen aldri kan
 * komme som en overraskelse hun ikke kunne regnet ut selv.
 */
export function dommen(sak: Sak, aere: number): Dom {
    if (!sak.lyst) {
        return {
            dom: 'fredlos',
            kjennelse:
                'Det ble ikke lyst. Da er det ikke drap, det er mord - og mord kan ingen bot kjøpe deg fri fra. Tinget dømmer deg fredløs.',
            folge: 'Fredløs. Ingen kan hjelpe deg uten selv å bli straffet for det.',
        };
    }
    const hjemmel = sak.anfort ? LOVHJEMMEL_BY_ID[sak.anfort] : null;
    const poeng = (hjemmel?.riktig ? 2 : 0) + (sak.vitner.length >= 1 ? 1 : 0) + (aere >= 55 ? 1 : 0);
    if (poeng >= FRIKJENT_FRA) {
        return {
            dom: 'frikjent',
            kjennelse:
                'Du lyste drapet. Du hadde vitner, og du anførte den hjemmelen saken din faktisk har. Tinget finner at du vernet ditt eget hus.',
            folge: '',
        };
    }
    return {
        dom: 'bot',
        kjennelse:
            'Du lyste drapet, og det er derfor du står her og ikke i skogen. Men saken din bar ikke. Tinget setter full mannebot for en hauld.',
        folge: 'Boten går fra bua. Vinteren blir smalere.',
    };
}

/** Poengene som frikjenner. Tre av fire mulige - saken tåler å mangle én ting. */
export const FRIKJENT_FRA = 3;
export const POENG_MAKS = 4;

/**
 * Hvor mange poeng saken står med nå. Vises mens hun velger.
 *
 * Taket er fire og ikke tre: hjemmelen alene er to, og med både vitne og et
 * navn folk kjenner blir det fire. Sto det «3 av 3» på en sak som egentlig sto
 * på fire, ville tallet vært en trøstepremie og ikke et regnestykke.
 */
export function poengNaa(sak: Sak, aere: number): { poeng: number; av: number; trengs: number } {
    const hjemmel = sak.anfort ? LOVHJEMMEL_BY_ID[sak.anfort] : null;
    return {
        poeng: (hjemmel?.riktig ? 2 : 0) + (sak.vitner.length >= 1 ? 1 : 0) + (aere >= 55 ? 1 : 0),
        av: POENG_MAKS,
        trengs: FRIKJENT_FRA,
    };
}
