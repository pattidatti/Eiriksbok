// Felles typer for mikro-spill — lette, embeddable spill som kjører
// inline i en læringssti (ikke fullskjerm Three.js-motor).

export interface MicroGameResult {
    score: number;        // 0-1
    completed: boolean;
    artifact?: unknown;   // valgfri lagring av tilstand
}

export interface MicroGameProps {
    onComplete: (result: MicroGameResult) => void;
    onRetry?: () => void;
    // Spillspesifikke props sendes inn fra step-data
    [key: string]: unknown;
}

// Et registrert mikro-spill: lazy import + visningstekst
export interface MicroGameEntry {
    id: string;
    title: string;
    description: string;
    estimatedSeconds?: number;
    /** Sjanger i klartekst ('plattform', 'strategi', 'kjøring', 'puslespill' ...). Nattsporet bruker den til å variere. */
    sjanger?: string;
    /** 'lett' tåler humor; 'alvorlig' spilles uten vitser; 'grusom' (bare på eierens bestilling) har blod, død og humor. Se build_microgame.md. */
    tone?: 'lett' | 'alvorlig' | 'grusom';
    /** Én setning i du-form som selger spillet på startkortet («Du er kontrolløren. Radaren ser dem komme - rekker du det?»). */
    hook?: string;
    /** Skjermbilde fra spillet til startkortet (/images/microgames/<id>.webp). Lages av selvspillet med --cover. */
    cover?: string;
    /**
     * Kunstretningen looken er hentet fra - epokens egen bildekultur, ikke et stilbibliotek
     * («Bayeux-teppet: brodert lin, okergul, indigo og rust»). Påkrevd for nye spill; se
     * «Kunstbriefen» i build_microgame.md. Briefen ligger i docs/microgames/briefer/<id>.md.
     */
    kunst?: string;
    loader: () => Promise<{ default: React.ComponentType<MicroGameProps> }>;
}
