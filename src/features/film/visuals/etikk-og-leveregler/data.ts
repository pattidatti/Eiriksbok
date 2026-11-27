/** De ni trådene i veven: én setning fra hver tradisjon, samme rekkefølge som i artikkelen. */
export type Form = 'negativ' | 'positiv' | 'annen';

export interface Traad {
    id: string;
    navn: string;
    farge: string;
    gruppe: 0 | 1 | 2;
    form: Form;
}

export const TRAADER: Traad[] = [
    { id: 'jodedom', navn: 'jødedom', farge: '#3b82f6', gruppe: 0, form: 'negativ' },
    { id: 'kristendom', navn: 'kristendom', farge: '#6366f1', gruppe: 0, form: 'positiv' },
    { id: 'islam', navn: 'islam', farge: '#10b981', gruppe: 0, form: 'positiv' },
    { id: 'hinduisme', navn: 'hinduisme', farge: '#ec4899', gruppe: 1, form: 'negativ' },
    { id: 'buddhisme', navn: 'buddhisme', farge: '#f59e0b', gruppe: 1, form: 'negativ' },
    { id: 'sikhisme', navn: 'sikhisme', farge: '#ff9933', gruppe: 1, form: 'annen' },
    { id: 'bahai', navn: "bahá'í", farge: '#14b8a6', gruppe: 2, form: 'negativ' },
    { id: 'mormonisme', navn: 'mormonismen', farge: '#8b5cf6', gruppe: 2, form: 'positiv' },
    { id: 'jehovas-vitner', navn: 'Jehovas vitner', farge: '#0ea5e9', gruppe: 2, form: 'positiv' },
];

export const GRUPPE_X = [-6.5, 0, 6.5];
export const AVSTAND = 1.3;

/** Plassen i vanlig oppstilling: tre grupper med tre tråder. */
export function gruppeX(i: number) {
    const t = TRAADER[i];
    const nr = TRAADER.filter((u, j) => u.gruppe === t.gruppe && j < i).length;
    return GRUPPE_X[t.gruppe] + (nr - 1) * AVSTAND;
}

/** Plassen når trådene er sortert etter form: ikke gjør til venstre, del i midten, gjør til høyre. */
export function formX(i: number) {
    const t = TRAADER[i];
    if (t.form === 'annen') return 0;
    const like = TRAADER.map((u, j) => ({ u, j })).filter(({ u }) => u.form === t.form);
    const nr = like.findIndex(({ j }) => j === i);
    const start = t.form === 'negativ' ? -8.4 : 4.5;
    return start + nr * 1.3;
}
