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
    /** 'lett' tåler humor; 'alvorlig' spilles uten vitser. Se build_microgame.md. */
    tone?: 'lett' | 'alvorlig';
    loader: () => Promise<{ default: React.ComponentType<MicroGameProps> }>;
}
