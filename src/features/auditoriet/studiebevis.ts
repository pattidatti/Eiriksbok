// Studiebeviset: det eleven tar med seg fra universitetet.
//
//  - Oppmøte: hver forelesning eleven har hørt minst 40 % av (direkte, eller i
//    lesesalen til endes) får et stempel. Antall stempler gir en grad, fra fersk student til
//    professor. Første stempel per forelesning gir også XP i «Min læring».
//  - Notater: N tar vare på setningen foreleseren sier akkurat nå.
//  - Innstillinger: lyd og teksting huskes til neste besøk.
//
// Alt bor i nettleseren (localStorage via zustand persist), som resten av
// progresjonen i boka.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Stempel {
    tittel: string;
    salId: string;
    fag: string;
    kilde: string;
    dato: number;
}

export interface Notat {
    tekst: string;
    /** Overskriften på lysbildet da notatet ble tatt, til gruppering. */
    lysbilde?: string;
    dato: number;
}

export type Teksting = 'normal' | 'stor' | 'av';

interface Studiebevis {
    hort: Record<string, Stempel>;
    notater: Record<string, { tittel: string; liste: Notat[] }>;
    lyd: boolean;
    teksting: Teksting;
    /** Gir stempel. Returnerer true første gang forelesningen stemples. */
    stemple: (sti: string, s: Omit<Stempel, 'dato'>) => boolean;
    notere: (sti: string, tittel: string, n: Omit<Notat, 'dato'>) => void;
    slettNotat: (sti: string, dato: number) => void;
    settLyd: (pa: boolean) => void;
    nesteTeksting: () => void;
}

export const useStudiebevis = create<Studiebevis>()(
    persist(
        (set, get) => ({
            hort: {},
            notater: {},
            lyd: true,
            teksting: 'normal',
            stemple: (sti, s) => {
                if (get().hort[sti]) return false;
                set((st) => ({ hort: { ...st.hort, [sti]: { ...s, dato: Date.now() } } }));
                import('../progress/useProgressStore').then(({ useProgressStore }) => {
                    useProgressStore.getState().recordActivity({
                        kind: 'practice-game',
                        activityId: `${sti}#oppmote`,
                        subjectId: s.fag,
                        topicId: sti.split('/')[1],
                        title: `Forelesning: ${s.tittel}`,
                    });
                });
                return true;
            },
            notere: (sti, tittel, n) =>
                set((st) => {
                    const gammel = st.notater[sti]?.liste ?? [];
                    if (gammel.some((x) => x.tekst === n.tekst)) return st;
                    return { notater: { ...st.notater, [sti]: { tittel, liste: [...gammel, { ...n, dato: Date.now() }] } } };
                }),
            slettNotat: (sti, dato) =>
                set((st) => {
                    const n = st.notater[sti];
                    if (!n) return st;
                    const liste = n.liste.filter((x) => x.dato !== dato);
                    const notater = { ...st.notater };
                    if (liste.length) notater[sti] = { ...n, liste };
                    else delete notater[sti];
                    return { notater };
                }),
            settLyd: (lyd) => set({ lyd }),
            nesteTeksting: () =>
                set((st) => ({ teksting: st.teksting === 'normal' ? 'stor' : st.teksting === 'stor' ? 'av' : 'normal' })),
        }),
        { name: 'eiriksbok-studiebevis', version: 1 }
    )
);

export const GRADER = [
    { min: 0, tittel: 'Fersk student' },
    { min: 1, tittel: 'Student' },
    { min: 3, tittel: 'Flittig student' },
    { min: 8, tittel: 'Bachelor' },
    { min: 20, tittel: 'Master' },
    { min: 40, tittel: 'Doktor' },
    { min: 75, tittel: 'Professor' },
];

/** Graden for et antall stempler, og hvor mange som mangler til neste. */
export function grad(antall: number) {
    let i = 0;
    while (i + 1 < GRADER.length && antall >= GRADER[i + 1].min) i++;
    const neste = GRADER[i + 1];
    const fra = GRADER[i].min;
    return {
        tittel: GRADER[i].tittel,
        neste: neste?.tittel ?? null,
        igjen: neste ? neste.min - antall : 0,
        andel: neste ? (antall - fra) / (neste.min - fra) : 1,
    };
}

/** Notatene som ren tekst, til utklippstavla. */
export function notaterSomTekst(tittel: string, liste: Notat[]) {
    const linjer = [`Notater: ${tittel}`, ''];
    let sist: string | undefined;
    for (const n of liste) {
        if (n.lysbilde && n.lysbilde !== sist) {
            linjer.push('', n.lysbilde);
            sist = n.lysbilde;
        }
        linjer.push(`- ${n.tekst}`);
    }
    return linjer.join('\n').replace(/\n{3,}/g, '\n\n');
}
