import type { Era, PhilosophyProfile } from './types';

export interface QuestConfig {
    id: string;
    philosopherId: string;
    title: string;
    description: string;
    learningGoal: string;
    path: string;
    era: Era;
    isSecondary?: boolean;
    prerequisites: string[];
}

export const QUEST_REGISTRY: Record<string, QuestConfig> = {
    // --- ANTIKKEN ---
    'sokrates': {
        id: 'socratic-method',
        philosopherId: 'sokrates',
        title: 'Jakten på Rettferdighet',
        description: 'Utforsk hva rettferdighet egentlig betyr med Sokrates på agoraen.',
        learningGoal: 'Forstå dialogmetoden og hvorfor det er viktig å stille spørsmål.',
        path: '/content/krle/filosofi/quests/socratic_dialogue.json',
        era: 'antikken',
        prerequisites: []
    },
    'platon': {
        id: 'cave-allegory',
        philosopherId: 'platon',
        title: 'Skygger på Veggen',
        description: 'Hva er virkelighet, og hva er bare skygger? Platon viser deg hulen.',
        learningGoal: 'Forstå Platons hulelignelse og skillet mellom virkelighet og illusjon.',
        path: '/content/krle/filosofi/quests/platon.json',
        era: 'antikken',
        prerequisites: ['socratic-method']
    },
    'aristoteles': {
        id: 'golden-mean',
        philosopherId: 'aristoteles',
        title: 'Den Gylne Middelvei',
        description: 'Utforsk Aristoteles sin lære om balanse og lykke.',
        learningGoal: 'Forstå dydsetikken og den gylne middelvei.',
        path: '/content/krle/filosofi/quests/aristoteles.json',
        era: 'antikken',
        prerequisites: ['socratic-method']
    },

    // --- MIDDELALDER ---
    'augustin': {
        id: 'time-mystery',
        philosopherId: 'augustin',
        title: 'Tidens Mysterium',
        description: 'Augustin utfordrer deg til å tenke over hva tid egentlig er.',
        learningGoal: 'Forstå Augustins tanker om tid, fri vilje og samvittighet.',
        path: '/content/krle/filosofi/quests/augustin.json',
        era: 'middelalder',
        prerequisites: ['socratic-method']
    },
    'aquinas': {
        id: 'faith-reason',
        philosopherId: 'aquinas',
        title: 'Fornuftens Stige',
        description: 'Kan tro og fornuft samarbeide? Aquinas mener det.',
        learningGoal: 'Forstå naturlig lov og forholdet mellom tro og fornuft.',
        path: '/content/krle/filosofi/quests/aquinas.json',
        era: 'middelalder',
        prerequisites: ['socratic-method']
    },

    // --- OPPLYSNINGSTIDEN ---
    'descartes': {
        id: 'radical-doubt',
        philosopherId: 'descartes',
        title: 'Drøm eller Virkelighet?',
        description: 'Descartes tviler på alt. Kan du bevise at du eksisterer?',
        learningGoal: 'Forstå metodisk tvil og "cogito ergo sum".',
        path: '/content/krle/filosofi/quests/descartes.json',
        era: 'opplysning',
        prerequisites: ['socratic-method']
    },
    'locke': {
        id: 'property-rights',
        philosopherId: 'locke',
        title: 'Hvem Eier Deg?',
        description: 'Locke graver i spørsmålet om naturlige rettigheter og eiendom.',
        learningGoal: 'Forstå naturlige rettigheter og tabula rasa.',
        path: '/content/krle/filosofi/quests/locke.json',
        era: 'opplysning',
        prerequisites: ['socratic-method']
    },
    'hume': {
        id: 'cause-effect',
        philosopherId: 'hume',
        title: 'Solen Går Ned',
        description: 'Hume utfordrer alt du tror om årsak og virkning.',
        learningGoal: 'Forstå induksjonsproblemet og empirismen.',
        path: '/content/krle/filosofi/quests/hume.json',
        era: 'opplysning',
        prerequisites: ['socratic-method']
    },
    'kant': {
        id: 'categorical-imperative',
        philosopherId: 'kant',
        title: 'Pliktens Kall',
        description: 'Kants kategoriske imperativ: Kan du finne en universell morallov?',
        learningGoal: 'Forstå det kategoriske imperativ og pliktetikken.',
        path: '/content/krle/filosofi/quests/kant.json',
        era: 'opplysning',
        prerequisites: ['socratic-method']
    },

    // --- MODERNE ---
    'kierkegaard': {
        id: 'leap-faith',
        philosopherId: 'kierkegaard',
        title: 'Spranget',
        description: 'Kierkegaard stiller deg overfor eksistensens avgjørende valg.',
        learningGoal: 'Forstå troens sprang og eksistensiell angst.',
        path: '/content/krle/filosofi/quests/kierkegaard.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },
    'nietzsche': {
        id: 'uber-mensch',
        philosopherId: 'nietzsche',
        title: 'Gud er Død',
        description: 'Nietzsche ber deg skape nye verdier i en verden uten guder.',
        learningGoal: 'Forstå nihilisme, overmennesket og vilje til makt.',
        path: '/content/krle/filosofi/quests/nietzsche.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },
    'heidegger': {
        id: 'dasein',
        philosopherId: 'heidegger',
        title: 'Væren og Tiden',
        description: 'Heidegger inviterer deg til å utforske hva det vil si å være.',
        learningGoal: 'Forstå Dasein og hva det betyr å leve autentisk.',
        path: '/content/krle/filosofi/quests/heidegger.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },
    'arendt': {
        id: 'banality-evil',
        philosopherId: 'arendt',
        title: 'Ondskapens Banalitet',
        description: 'Arendt viser at ondskap kan være overraskende hverdagslig.',
        learningGoal: 'Forstå ondskapens banalitet og individuelt moralsk ansvar.',
        path: '/content/krle/filosofi/quests/arendt.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },
    'beauvoir': {
        id: 'second-sex',
        philosopherId: 'beauvoir',
        title: 'Det Annet Kjønn',
        description: 'Beauvoir utforsker frihet, identitet og hva det vil si å være menneske.',
        learningGoal: 'Forstå eksistensialistisk feminisme og sosial konstruksjon.',
        path: '/content/krle/filosofi/quests/beauvoir.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },
    'mises': {
        id: 'human-action',
        philosopherId: 'mises',
        title: 'Det Handlende Menneske',
        description: 'Mises forklarer hvordan menneskelig handling former samfunnet.',
        learningGoal: 'Forstå prakseologi og økonomisk frihet.',
        path: '/content/krle/filosofi/quests/mises.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },
    'rothbard': {
        id: 'anatomy-state',
        philosopherId: 'rothbard',
        title: 'Statens Anatomi',
        description: 'Rothbard stiller radikale spørsmål om statens rolle.',
        learningGoal: 'Forstå naturrettstenkning og kritikk av statsmakt.',
        path: '/content/krle/filosofi/quests/rothbard.json',
        era: 'moderne',
        prerequisites: ['socratic-method']
    },

    // --- SEKUNDÆRE DIALOGER ---
    'sokrates_gadfly': {
        id: 'socratic-gadfly',
        philosopherId: 'sokrates',
        title: 'Kleggen i Aten',
        description: 'Sokrates som byens kritiske stemme. Når er det rett å utfordre makten?',
        learningGoal: 'Reflektere over ytringsfrihet og sivil ulydighet.',
        path: '/content/krle/filosofi/quests/sokrates_gadfly.json',
        era: 'antikken',
        isSecondary: true,
        prerequisites: ['socratic-method']
    },
    'platon_ring': {
        id: 'ring-of-gyges',
        philosopherId: 'platon',
        title: 'Gyges Ring',
        description: 'Hvis du var usynlig, ville du fortsatt handle rettferdig?',
        learningGoal: 'Utforske om moral krever vitner, eller om den er indre.',
        path: '/content/krle/filosofi/quests/platon_ring.json',
        era: 'antikken',
        isSecondary: true,
        prerequisites: ['cave-allegory']
    },
    'nietzsche_abyss': {
        id: 'nietzsche-abyss',
        philosopherId: 'nietzsche',
        title: 'Avgrunnen',
        description: 'Nietzsche utfordrer deg til å stirre inn i avgrunnen uten å blunke.',
        learningGoal: 'Utforske nihilisme og verdiskaping på dypet.',
        path: '/content/krle/filosofi/quests/nietzsche_abyss.json',
        era: 'moderne',
        isSecondary: true,
        prerequisites: ['uber-mensch']
    },
    'aristoteles_friendship': {
        id: 'aristoteles-friendship',
        philosopherId: 'aristoteles',
        title: 'Ekte Vennskap',
        description: 'Aristoteles utforsker hva som skiller ekte vennskap fra nytte og nytelse.',
        learningGoal: 'Forstå de tre typene vennskap og hva som gjør et godt.',
        path: '/content/krle/filosofi/quests/aristoteles_friendship.json',
        era: 'antikken',
        isSecondary: true,
        prerequisites: ['golden-mean']
    },
    'descartes_dualism': {
        id: 'descartes-dualism',
        philosopherId: 'descartes',
        title: 'Spøkelset i Maskinen',
        description: 'Er kropp og sjel to ulike ting? Descartes dualisme utfordrer deg.',
        learningGoal: 'Forstå kropp-sjel-problemet og dualismen.',
        path: '/content/krle/filosofi/quests/descartes_dualism.json',
        era: 'opplysning',
        isSecondary: true,
        prerequisites: ['radical-doubt']
    },
    'kant_enlightenment': {
        id: 'kant-enlightenment',
        philosopherId: 'kant',
        title: 'Våg å Vite!',
        description: 'Kant om opplysning: tør du tenke selv?',
        learningGoal: 'Forstå opplysningsidealet og selvstendighet i tenkning.',
        path: '/content/krle/filosofi/quests/kant_enlightenment.json',
        era: 'opplysning',
        isSecondary: true,
        prerequisites: ['categorical-imperative']
    }
};

export const LEVEL_TITLES: Record<number, string> = {
    1: 'Nysgjerrig',
    2: 'Utforsker',
    3: 'Tenker',
    4: 'Filosof',
    5: 'Vismann',
    6: 'Akademiker',
    7: 'Mester',
};

export function getLevelTitle(level: number): string {
    return LEVEL_TITLES[Math.min(level, 7)] || 'Mester';
}

export function getQuestsForPhilosopher(philosopherId: string): QuestConfig[] {
    return Object.values(QUEST_REGISTRY).filter(q => q.philosopherId === philosopherId);
}

export function findQuestConfig(idOrPhilosopherId: string): QuestConfig | undefined {
    return Object.values(QUEST_REGISTRY).find(
        (q) => q.id === idOrPhilosopherId || q.philosopherId === idOrPhilosopherId
    ) ?? QUEST_REGISTRY[idOrPhilosopherId];
}

export function getNextQuest(profile: PhilosophyProfile): QuestConfig | null {
    const eraOrder: Era[] = ['antikken', 'middelalder', 'opplysning', 'moderne'];
    for (const era of eraOrder) {
        const quests = Object.values(QUEST_REGISTRY).filter(
            q => q.era === era && !q.isSecondary && !profile.completedQuests.includes(q.id)
        );
        const available = quests.filter(q =>
            q.prerequisites.every(p => profile.completedQuests.includes(p))
        );
        if (available.length > 0) return available[0];
    }
    const secondary = Object.values(QUEST_REGISTRY).filter(
        q => q.isSecondary && !profile.completedQuests.includes(q.id) &&
            q.prerequisites.every(p => profile.completedQuests.includes(p))
    );
    return secondary[0] || null;
}
