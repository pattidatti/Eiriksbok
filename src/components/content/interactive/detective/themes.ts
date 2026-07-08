import type { DetectiveThemeId } from './types';

export interface DetectiveTheme {
    /** Sidebakgrunn på case-skallet (lys). */
    bg: string;
    /** Kort-/panelbakgrunn (hvit glass). */
    surface: string;
    /** Litt hevet flate for sekundære paneler. */
    elevated: string;
    /** Hovedtekstfarge (mørk på lys bakgrunn). */
    text: string;
    /** Dempet tekst (metadata, hjelpetekst). */
    textMuted: string;
    /** Kantfarge for kort og skiller. */
    border: string;
    /** Aksentfarge for highlights, knapper, focus. Lesbar på hvit. */
    accent: string;
    /** Farge brukt på samlede bevis. */
    evidence: string;
    /** Farge brukt på advarsel / kildekritikk. */
    warning: string;
    /** Papir-look på "Originalfragment" (signaliserer alder). */
    paperBg: string;
    paperText: string;
    paperBorder: string;
    /** Klassen brukt på Original-tekst (font-family + style). */
    paperFontClass: string;
    /** Et lite navn vist diskret i header. */
    eraLabel: string;
}

/** Felles lyse nøytraler – aksent/warning/paper skiller epokene. */
const LIGHT_BASE = {
    surface: '#ffffff',
    elevated: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    evidence: '#059669',
};

export const DETECTIVE_THEMES: Record<DetectiveThemeId, DetectiveTheme> = {
    'medieval-cold': {
        ...LIGHT_BASE,
        bg: '#f1f5fa',
        accent: '#0369a1',
        warning: '#b45309',
        paperBg: '#ede4cf',
        paperText: '#3d2f1f',
        paperBorder: '#a08864',
        paperFontClass: 'font-serif italic',
        eraLabel: 'Middelalder',
    },
    'viking-sea': {
        ...LIGHT_BASE,
        bg: '#f8f5ef',
        accent: '#b45309',
        warning: '#e11d48',
        paperBg: '#e8dcc0',
        paperText: '#2d1f0f',
        paperBorder: '#8b6b3a',
        paperFontClass: 'font-serif',
        eraLabel: 'Vikingtid',
    },
    enlightenment: {
        ...LIGHT_BASE,
        bg: '#faf6ee',
        accent: '#a16207',
        warning: '#dc2626',
        paperBg: '#f5ecd6',
        paperText: '#2d1810',
        paperBorder: '#8b6b3a',
        paperFontClass: 'font-serif',
        eraLabel: 'Tidlig moderne',
    },
    'cold-war': {
        ...LIGHT_BASE,
        bg: '#eff4f6',
        accent: '#0e7490',
        warning: '#e11d48',
        paperBg: '#e2e8f0',
        paperText: '#1f2937',
        paperBorder: '#dc2626',
        paperFontClass: 'font-mono',
        eraLabel: 'Kalde krigen',
    },
    'modern-investigation': {
        ...LIGHT_BASE,
        bg: '#f6f5fb',
        accent: '#6d28d9',
        warning: '#d97706',
        paperBg: '#f3f4f6',
        paperText: '#111827',
        paperBorder: '#9ca3af',
        paperFontClass: 'font-mono',
        eraLabel: 'Moderne tid',
    },
    antiquity: {
        ...LIGHT_BASE,
        bg: '#faf5ec',
        accent: '#a16207',
        warning: '#dc2626',
        paperBg: '#ede0c5',
        paperText: '#3d2818',
        paperBorder: '#a08550',
        paperFontClass: 'font-serif',
        eraLabel: 'Oldtid',
    },
};

export const DEFAULT_THEME: DetectiveThemeId = 'modern-investigation';

export function getTheme(id?: DetectiveThemeId): DetectiveTheme {
    return DETECTIVE_THEMES[id ?? DEFAULT_THEME] ?? DETECTIVE_THEMES[DEFAULT_THEME];
}

/** Produserer inline CSS-variabler en root-div kan bruke. */
export function themeStyleVars(theme: DetectiveTheme): React.CSSProperties {
    return {
        ['--det-bg' as string]: theme.bg,
        ['--det-surface' as string]: theme.surface,
        ['--det-elevated' as string]: theme.elevated,
        ['--det-text' as string]: theme.text,
        ['--det-text-muted' as string]: theme.textMuted,
        ['--det-border' as string]: theme.border,
        ['--det-accent' as string]: theme.accent,
        ['--det-evidence' as string]: theme.evidence,
        ['--det-warning' as string]: theme.warning,
        ['--det-paper-bg' as string]: theme.paperBg,
        ['--det-paper-text' as string]: theme.paperText,
        ['--det-paper-border' as string]: theme.paperBorder,
    };
}
