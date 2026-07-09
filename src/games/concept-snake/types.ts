export type Position = {
    x: number;
    y: number;
};

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type SnakeSegment = Position;

export type FoodType = 'CORRECT' | 'WRONG';

export type FoodItem = {
    id: string;
    position: Position;
    text: string;
    type: FoodType;
};

// Ord slangen har spist i løpet av en runde - vises i oppsummeringen
export type EatenWord = {
    text: string;
    type: FoodType;
};

// Kortvarig hendelse for feedback-chip over brettet
export type EatEvent = {
    id: number;
    text: string;
    type: FoodType;
    points: number;
};

export type ConceptLevel = {
    id: string;
    name: string;
    topic: string;
    icon: string;
    description: string;
    targetConcept: string; // Begrepet slangen jakter på, f.eks. «Metafor»
    wrongHint: string; // Forklaring som vises når eleven spiser feil ord
    correctExamples: string[];
    wrongExamples: string[];
};
