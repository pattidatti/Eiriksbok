/** Fargene til de fire lagene, brukt likt i alle visualene i lånordfilmen. */
export const LAG = {
    kirke: { navn: 'Kirken', farge: '#7c3aed', jord: '#4e3d31' },
    hansa: { navn: 'Hansaen', farge: '#ea580c', jord: '#7a5030' },
    dansk: { navn: 'Tysk gjennom dansk', farge: '#dc2626', jord: '#a06d3f' },
    engelsk: { navn: 'Engelsk i dag', farge: '#2563eb', jord: '#cdb07e' },
} as const;

export type LagId = keyof typeof LAG;
export const LAG_REKKE: LagId[] = ['kirke', 'hansa', 'dansk', 'engelsk'];
