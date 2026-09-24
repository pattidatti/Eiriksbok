// Tema for arkadeskallet. Skallet gir struktur, temaet gir uttrykk.
//
// REGEL: hvert arkadespill lager sitt EGET tema ut fra emnet - farger, font,
// hjørner, strektykkelse, skråstilling. DEFAULT_THEME finnes bare så skallet
// virker; et spill som leverer med standardtemaet uendret, er ikke ferdig.
// Eksempler på retninger: tykk blekk og papir (Havet kommer), tynn gullstrek og
// pergament (middelalder), kald stål og skarpe hjørner (industri), rene flater
// uten skråstilling (moderne).
//
// Fonter: Outfit og Inter er alltid lastet. Trenger spillet en egen display-font,
// importer en @fontsource-pakke INNI spillmodulen, så lastes den bare med spillet.

export interface ArcadeTheme {
    /** Strek, tekst på kort og skygge. */
    ink: string;
    /** Kortflater og bannerundertekst. */
    paper: string;
    /** Små fremhevinger: kombo-pille, fokusring, logo-aksent. */
    accent: string;
    /** Hovedknapp og bannerbakgrunn som standard. */
    cta: string;
    ctaText: string;
    /** Små knapper og statistikkbokser. */
    chip: string;
    /** Dimming bak skjermkort. */
    scrim: string;
    font: string;
    fontWeight: number;
    bodyFont: string;
    tracking: string;
    textCase: 'none' | 'uppercase';
    /** Hjørneradius i px. 0 = skarpe hjørner. */
    radius: number;
    /** Strektykkelse i px. */
    line: number;
    /** Hard skygge rett nedover, i px. 0 = flatt. */
    drop: number;
    /** Skråstilling av banner/logo i grader. 0 = rett og nøkternt. */
    tilt: number;
    hudText: string;
    hudStroke: string;
}

export const DEFAULT_THEME: ArcadeTheme = {
    ink: '#22201c',
    paper: '#f6efdf',
    accent: '#e8a93a',
    cta: '#b8322a',
    ctaText: '#ffffff',
    chip: '#ffffff',
    scrim: 'rgba(34,32,28,.18)',
    font: 'Outfit, Inter, system-ui, sans-serif',
    fontWeight: 900,
    bodyFont: 'Inter, system-ui, sans-serif',
    tracking: '0.01em',
    textCase: 'none',
    radius: 14,
    line: 3,
    drop: 6,
    tilt: -2,
    hudText: '#ffffff',
    hudStroke: '#22201c',
};
