// Brettene i runden som data: hva som er nytt, og når. Ett brett = en periode i vinteren.

export interface Brett {
    fra: number;
    tittel: string;
    /** Kort lapp når brettet starter (bare der det kommer noe nytt). */
    nytt?: string;
}

export const BRETT: Brett[] = [
    { fra: 0, tittel: '10. november 1944', nytt: 'Hent ved. Hold inne i gamma for å fyre.' },
    { fra: 10, tittel: 'En båt i fjorden', nytt: 'Lyset ser røyken.' },
    { fra: 21, tittel: 'Desember', nytt: 'Kaldere. Båten kommer oftere.' },
    { fra: 44, tittel: 'Julenatt', nytt: 'Ingen båt i julenatta.' },
    { fra: 52, tittel: 'Januar' },
    { fra: 58, tittel: 'Snøstorm', nytt: 'Stormen skjuler røyken - men den er kald.' },
    { fra: 70, tittel: 'Januarkulda', nytt: 'Båtene kommer tett nå.' },
    { fra: 85, tittel: 'Februar' },
];

export const MÅNED = ['november', 'desember', 'januar', 'februar'];

/** Dag i runden -> «23. november 1944». */
export function dato(dag: number): string {
    const d = Math.floor(dag);
    // 10. nov = dag 0. November har 30 dager, desember 31, januar 31.
    const lengder = [21, 31, 31, 28];
    let rest = d;
    for (let m = 0; m < 4; m++) {
        if (rest < lengder[m]) {
            const nr = m === 0 ? 10 + rest : rest + 1;
            return `${nr}. ${MÅNED[m]} ${m < 2 ? 1944 : 1945}`;
        }
        rest -= lengder[m];
    }
    return '19. februar 1945';
}

export function brettFor(dag: number): number {
    let i = 0;
    for (let k = 0; k < BRETT.length; k++) if (dag >= BRETT[k].fra) i = k;
    return i;
}
