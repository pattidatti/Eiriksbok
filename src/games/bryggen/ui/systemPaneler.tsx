// Krokpunktet for HUD-paneler til systemene (graboks/system.ts). Et system som vil vise noe,
// legger data i `HudState.system[navn]` (via `hud()`), og et panel her tegner det. Panelet vises
// bare når `hud.system[navn]` finnes (ikke null/undefined).
//
// Legg til en linje i `SYSTEM_PANELER` med navnet, plassen og komponenten (i en egen fil i ui/):
//
//   { navn: 'rottejakt', plass: 'hoyre', Komponent: RottejaktPanel },
//
// Plassene:
//   'venstre' i kolonnen under livskortet øverst til venstre (kort som kommer og går)
//   'hoyre'  under oppdragslista øverst til høyre (tellere, små lister)
//   'midt'   øverst i midten, under livet til fienden (en klokke, en poengsum)
//   'bunn'   nederst i midten, over E-teksten (et valg, en instruks)
//   'hel'    hele skjermen, over resten av HUD-en (filmscener, sorte striper, tekst på svart)
//
// Panelene på 'venstre', 'hoyre', 'midt' og 'bunn' står i kolonner (Hud.tsx) og stables der: gi dem
// bredde, men aldri `absolute` eller faste avstander fra kanten, ellers legger de seg oppå hverandre.
//
// Hold paneler lyse og lesbare (minst 13 px, helst 15-17 px), som resten av HUD-en. Bruk klassene i
// ui/stil.ts (KORT, PANEL, ETIKETT, TEKST, KNAPP ...), så får panelet pergament-looken av seg selv.
import type { ComponentType } from 'react';
import { FilmVisning } from '../graboks/FilmVisning';
import type { FilmHud } from '../graboks/sekvens';
import { SystemHint } from './SystemHint';
import { RpgKortPanel } from './RpgHud';
import { Ettersokt, EttersoktSvart } from './Ettersokt';
import { Snik } from './Snik';
import { Brann } from './Brann';
import { RunekortPanel } from './Runekort'; // Runepinnene (verden2)

export type PanelPlass = 'venstre' | 'hoyre' | 'midt' | 'bunn' | 'hel';

export interface SystemPanel {
    /** Samme navn som `Spillsystem.navn`. */
    navn: string;
    plass: PanelPlass;
    Komponent: ComponentType<{ data: unknown }>;
}

export const SYSTEM_PANELER: SystemPanel[] = [
    { navn: 'film', plass: 'hel', Komponent: ({ data }) => <FilmVisning f={data as FilmHud} /> },
    { navn: 'tyv', plass: 'bunn', Komponent: SystemHint },
    { navn: 'opplaering', plass: 'bunn', Komponent: SystemHint },
    { navn: 'kap2', plass: 'bunn', Komponent: SystemHint }, // kapittel 2: sekkene og plyndreren
    { navn: 'kap3', plass: 'bunn', Komponent: SystemHint }, // kapittel 3: buntene, valget og tiden som går
    { navn: 'rpg', plass: 'venstre', Komponent: RpgKortPanel },
    // Kongens menn på Holmen (byen-oppdrag.ts).
    { navn: 'ettersokt', plass: 'hoyre', Komponent: Ettersokt },
    { navn: 'ettersokt', plass: 'hel', Komponent: EttersoktSvart },
    { navn: 'budet', plass: 'bunn', Komponent: Snik },
    { navn: 'brann', plass: 'bunn', Komponent: Brann },
    { navn: 'runer', plass: 'midt', Komponent: RunekortPanel }, // Runepinnene (graboks/strandliv.ts)
];
