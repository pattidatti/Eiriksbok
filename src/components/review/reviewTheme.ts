// Fagfarger for øvelseskortene i Dagens økt. Toppkant + kicker-chip får en
// diskret aksent per fag så eleven ser hvilket fag oppgaven kommer fra.

export interface SubjectAccent {
    border: string;
    chip: string;
    label: string;
}

const ACCENTS: Record<string, SubjectAccent> = {
    historie: {
        border: 'border-t-amber-400',
        chip: 'bg-amber-50 text-amber-700',
        label: 'Historie',
    },
    norsk: {
        border: 'border-t-rose-400',
        chip: 'bg-rose-50 text-rose-700',
        label: 'Norsk',
    },
    krle: {
        border: 'border-t-violet-400',
        chip: 'bg-violet-50 text-violet-700',
        label: 'KRLE',
    },
    samfunnskunnskap: {
        border: 'border-t-sky-400',
        chip: 'bg-sky-50 text-sky-700',
        label: 'Samfunnskunnskap',
    },
    musikk: {
        border: 'border-t-emerald-400',
        chip: 'bg-emerald-50 text-emerald-700',
        label: 'Musikk',
    },
};

const FALLBACK: SubjectAccent = {
    border: 'border-t-indigo-400',
    chip: 'bg-indigo-50 text-indigo-700',
    label: '',
};

export const subjectAccent = (subjectId?: string): SubjectAccent =>
    (subjectId && ACCENTS[subjectId]) || FALLBACK;
