// «Noen eier hele skjermen nå.»
//
// Progresjonssystemet feirer der eleven er, og det er riktig nesten alltid.
// Men noen øyeblikk i appen er hele skjermen sin egen: en cutscene i
// rollespillet, kildebordet mellom to kapitler, åpningen av et nytt kapittel.
// Der kom en rakett med «Nivå 3!» midt oppi den setningen som skulle bære
// øyeblikket - og det er ikke en feil i feiringen, det er to ting som vil ha
// skjermen samtidig.
//
// Flagget setter feiringene og XP-toastene på vent. De forsvinner ikke: køene
// står, og alt kommer når eleven er ute av øyeblikket. En elev skal aldri miste
// en belønning fordi hun så en cutscene.
//
// Egen liten store, som toast-køen, slik at den kan settes uten React-kontekst
// og leses av begge lagene i Layout.

import { create } from 'zustand';

interface StilleSkjermState {
    stille: boolean;
    /** Skru på mens et fullskjerms øyeblikk står, og av igjen etterpå. */
    settStille: (pa: boolean) => void;
}

export const useStilleSkjerm = create<StilleSkjermState>()((set) => ({
    stille: false,
    settStille: (pa) => set({ stille: pa }),
}));
