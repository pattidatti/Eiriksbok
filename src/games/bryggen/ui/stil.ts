// Felles stil for HUD, menyer og aktivitetspanelene. Bruk disse i stedet for egne klasser, så kan
// utseendet endres ett sted. Lyst og lesbart (blueprint §2), minst 13 px tekst.
//
// Utseendet er hansabyen Bergen 1429: pergament og lin, blekkfarget tekst, tjærebrunt og seglrødt.
// Overskrifter i Grenze Gotisch (en gotisk skrift som fortsatt er lett å lese), brødtekst i
// Alegreya Sans. Fontene er selvhostet (Fontsource) og lastes bare når spillet lastes.
// Papirmønsteret, kantene og seremonien for «Oppdrag fullført» står i stil.css.
//
// Et nytt panel: `<div className={`... ${PANEL}`}>` med `<div className={ETIKETT}>Tittel</div>`,
// tekst i `TEKST`/`SVAK`, knapper i `KNAPP`/`KNAPP_2` og en stolpe med `RILLE` + `FYLL.segl`.
import '@fontsource/grenze-gotisch/latin-600.css';
import '@fontsource/grenze-gotisch/latin-700.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-400-italic.css';
import '@fontsource/alegreya-sans/latin-500.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@fontsource/alegreya-sans/latin-800.css';
import './stil.css';

/** Et kort over spillet: liv, oppdragslista, E-teksten, samtalen. */
export const KORT = 'bry bry-pergament bry-kort rounded-lg';
/** Et større panel for en aktivitet (syrytme, terning, messe). */
export const PANEL = 'bry bry-pergament bry-panel rounded-xl';
/** Liten overskrift med versaler over et kort. */
export const ETIKETT = 'text-[13px] font-bold uppercase tracking-[0.16em] text-[#8a2618]';
/** Hovedknapp og vanlig knapp. */
export const KNAPP = 'bry-knapp bry-fokus rounded-lg px-4 py-2 text-[16px] font-bold disabled:opacity-50';
export const KNAPP_2 = 'bry-knapp2 bry-fokus rounded-lg px-4 py-2 text-[16px] font-bold disabled:opacity-50';

// ---- Tillegg (ui-stil, 2026-10-03). Bruk dem gjerne i nye paneler. ----

/** Fargene som hex, til SVG og inline-stil. Samme verdier som i stil.css. */
export const FARGE = {
    pergament: '#f6edd9',
    lin: '#ebdfc4',
    kant: '#b99a68',
    blekk: '#2b1d10',
    svak: '#5c4630',
    tjaere: '#5a3519',
    segl: '#9a2a1c',
    gull: '#b07d24',
    gronn: '#3f6b2a',
} as const;

/** Rotklassen: fonten og blekkfargen. Ligger allerede i KORT og PANEL. */
export const BRY = 'bry';
/** Overskrift i gotisk skrift. Legg på størrelse selv (minst 20 px for den gotiske). */
export const DISPLAY = 'bry-display text-[#2b1d10]';
/** Vanlig tekst og svakere tekst (begge over 7:1 mot pergamentet). */
export const TEKST = 'text-[16px] leading-snug text-[#2b1d10]';
export const SVAK = 'text-[14px] leading-snug text-[#5c4630]';
/** Tastaturhjelp nederst i et panel. */
export const HJELP = 'text-[13px] text-[#5c4630]';
/** Rød, grønn og varm farge for utfall og tall (lesbare på pergament). */
export const ROD = 'text-[#9a2a1c]';
export const GRONN = 'text-[#3f6b2a]';
export const VARM = 'text-[#8a5a12]';
/** Tastaturfokus i samme stil (seglrød ring). fokus.ts sin FOKUS er den samme. */
export const FOKUS_RING = 'bry-fokus';
/** Bakgrunn uten kant: lin (innfelt felt, sidestolpe) og pergament. */
export const LIN = 'bry-lin';
export const PERGAMENT = 'bry-pergament';
/** Stolpe: `<div className={`h-3 rounded-full ${RILLE}`}><div className={`h-full rounded-full ${FYLL.segl}`} /></div>` */
export const RILLE = 'bry-rille overflow-hidden';
export const FYLL = {
    segl: 'bg-gradient-to-b from-[#b8402d] to-[#8a2417]',
    tjaere: 'bg-gradient-to-b from-[#7a4c26] to-[#4e2d14]',
    gull: 'bg-gradient-to-b from-[#d29a36] to-[#a06c18]',
    gronn: 'bg-gradient-to-b from-[#5e8f3e] to-[#3f6b2a]',
} as const;
/** Tallbrikke for valg 1, 2, 3 (som et lite segl). */
export const BRIKKE = 'bry-brikke inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold';
/** Tast i kontroll-lister: `<kbd className={TAST}>E</kbd>`. */
export const TAST = 'inline-block rounded-md border border-[#a5844f] bg-[#fbf5e6] px-2 py-0.5 text-[15px] font-bold text-[#2b1d10] shadow-[0_2px_0_#b99a68]';
/** Tynn blekkstrek som skillelinje. */
export const STREK = 'bry-strek';
/** Innfelt boks for «Dette vet vi», hint og advarsler. */
export const UTHEV = 'rounded-md border border-[#c9a45c] bg-[#fbf1d6] text-[#2b1d10]';
