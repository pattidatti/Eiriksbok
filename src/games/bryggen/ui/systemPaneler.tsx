// Krokpunktet for HUD-paneler til systemene (graboks/system.ts). Et system som vil vise noe,
// legger data i `HudState.system[navn]` (via `hud()`), og et panel her tegner det. Panelet vises
// bare når `hud.system[navn]` finnes (ikke null/undefined).
//
// Legg til en linje i `SYSTEM_PANELER` med navnet, plassen og komponenten (i en egen fil i ui/):
//
//   { navn: 'rottejakt', plass: 'hoyre', Komponent: RottejaktPanel },
//
// Plassene:
//   'hoyre'  under oppdragslista øverst til høyre (tellere, små lister)
//   'midt'   øverst i midten, under livet til fienden (en klokke, en poengsum)
//   'bunn'   nederst i midten, over E-teksten (et valg, en instruks)
//   'hel'    hele skjermen, over resten av HUD-en (filmscener, sorte striper, tekst på svart)
//
// Hold paneler lyse og lesbare (minst 13 px, helst 15-17 px), som resten av HUD-en. Bruk klassene i
// ui/stil.ts (KORT, PANEL, ETIKETT, TEKST, KNAPP ...), så får panelet pergament-looken av seg selv.
import type { ComponentType } from 'react';
import { FilmVisning } from '../graboks/FilmVisning';
import type { FilmHud } from '../graboks/sekvens';
import { SystemHint } from './SystemHint';
import { RpgKortPanel } from './RpgHud';

export type PanelPlass = 'hoyre' | 'midt' | 'bunn' | 'hel';

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
    { navn: 'rpg', plass: 'hel', Komponent: RpgKortPanel },
];
