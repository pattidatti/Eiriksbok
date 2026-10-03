// Felles stil for HUD, menyer og aktivitetspanelene. Bruk disse i stedet for egne klasser, så kan
// utseendet endres ett sted. Lyst og lesbart (blueprint §2), minst 13 px tekst.
/** Et kort over spillet: liv, oppdragslista, E-teksten, samtalen. */
export const KORT = 'rounded-2xl border border-white/70 bg-white/90 shadow-lg backdrop-blur';
/** Et større panel for en aktivitet (syrytme, terning, messe). */
export const PANEL = 'rounded-2xl border border-white/70 bg-white/95 shadow-xl backdrop-blur';
/** Liten overskrift med versaler over et kort. */
export const ETIKETT = 'text-[13px] font-bold uppercase tracking-widest text-amber-700';
/** Hovedknapp og vanlig knapp. */
export const KNAPP = 'rounded-xl bg-indigo-600 px-4 py-2 text-[15px] font-semibold text-white shadow hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300';
export const KNAPP_2 = 'rounded-xl bg-slate-200 px-4 py-2 text-[15px] font-semibold text-slate-800 hover:bg-slate-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300';
