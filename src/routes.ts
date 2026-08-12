import type { ComponentType } from 'react';

// Define the type for the module that contains the component
// Sidene har ingen felles props - ruteren rendrer dem uten. `never` sier
// nettopp det, og er trygt der `any` bare slo av sjekkingen.
type PageModule = { default: ComponentType<Record<string, never>> };

// Factory function type
type PageFactory = () => Promise<PageModule>;

export const routeFactories: Record<string, PageFactory> = {
    LandingPage: () => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })),
    SubjectPage: () => import('./pages/SubjectPage').then(module => ({ default: module.SubjectPage })),
    TopicPage: () => import('./pages/TopicPage').then(module => ({ default: module.TopicPage })),
    LessonPage: () => import('./pages/LessonPage').then(module => ({ default: module.LessonPage })),
    SearchPage: () => import('./pages/SearchPage').then(module => ({ default: module.SearchPage })),
    TextLibraryPage: () => import('./pages/TextLibraryPage').then(module => ({ default: module.TextLibraryPage })),
    TextReaderPage: () => import('./pages/TextReaderPage').then(module => ({ default: module.TextReaderPage })),
    NotFoundPage: () => import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })),
    ColonizationMap: () => import('./components/ColonizationMap/ColonizationMap'),
    FlashcardPage: () => import('./pages/FlashcardPage').then(module => ({ default: module.FlashcardPage })),
    PracticePage: () => import('./pages/PracticePage').then(module => ({ default: module.PracticePage })),
    MyLearningPage: () => import('./pages/MyLearningPage').then(module => ({ default: module.MyLearningPage })),
    DailyReviewPage: () => import('./pages/DailyReviewPage').then(module => ({ default: module.DailyReviewPage })),
    QuizPage: () => import('./pages/QuizPage').then(module => ({ default: module.QuizPage })),
    ReligionPage: () => import('./pages/ReligionPage').then(module => ({ default: module.ReligionPage })),
    ReligionComparisonPage: () => import('./pages/ReligionComparisonPage').then(module => ({ default: module.ReligionComparisonPage })),
    PhilosophyComparisonPage: () => import('./pages/PhilosophyComparisonPage').then(module => ({ default: module.PhilosophyComparisonPage })),
    TopicComparisonPage: () => import('./pages/TopicComparisonPage').then(module => ({ default: module.TopicComparisonPage })),
    GlobalTimelinePage: () => import('./pages/GlobalTimelinePage'),
    AtlasPage: () => import('./pages/AtlasPage').then(module => ({ default: module.AtlasPage })),
    QuizAdmin: () => import('./pages/quiz/QuizAdmin').then(module => ({ default: module.QuizAdmin })),
    QuizLobby: () => import('./pages/quiz/QuizLobby').then(module => ({ default: module.QuizLobby })),
    QuizHost: () => import('./pages/quiz/QuizHost').then(module => ({ default: module.QuizHost })),
    QuizPlayer: () => import('./pages/quiz/QuizPlayer').then(module => ({ default: module.QuizPlayer })),
    ChronoGamePage: () => import('./pages/ChronoGamePage'),
    KunnskapsloypaPage: () => import('./pages/KunnskapsloypaPage'),
    KjedereaksjonenPage: () => import('./pages/KjedereaksjonenPage'),
    StatsPage: () => import('./pages/StatsPage').then(module => ({ default: module.StatsPage })),
    AdminDashboard: () => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })),
    ContentInventory: () => import('./pages/admin/ContentInventory').then(module => ({ default: module.ContentInventory })),
    LinkChecker: () => import('./pages/admin/LinkChecker').then(module => ({ default: module.LinkChecker })),
    ScannerPage: () => import('./pages/admin/ScannerPage').then(module => ({ default: module.ScannerPage })),
    RhetoricGamePage: () => import('./pages/RhetoricGamePage').then(module => ({ default: module.RhetoricGamePage })),
    HangmanPage: () => import('./pages/HangmanPage').then(module => ({ default: module.HangmanPage })),
    ChronoGliderPage: () => import('./games/chrono-glider/ChronoGliderPage'),
    WordSorterGame: () => import('./games/word-sorter/WordSorterGame'),
    ConceptSnakeGame: () => import('./games/concept-snake/ConceptSnakeGame'),
    PersonGallery: () => import('./pages/PersonGallery').then(module => ({ default: module.PersonGallery })),
    PersonDetailPage: () => import('./pages/PersonDetailPage').then(module => ({ default: module.PersonDetailPage })),
    PhilosophyOdyssey: () => import('./pages/PhilosophyOdysseyPage').then(module => ({ default: module.PhilosophyOdysseyPage })),
    DetectiveHubPage: () => import('./pages/DetectiveHubPage').then(module => ({ default: module.DetectiveHubPage })),
    DetectiveCasePage: () => import('./pages/DetectiveCasePage').then(module => ({ default: module.DetectiveCasePage })),
    EthicsExperimentPage: () => import('./pages/EthicsExperimentPage').then(module => ({ default: module.EthicsExperimentPage })),
    TimeTravelPage: () => import('./pages/TimeTravelPage').then(module => ({ default: module.TimeTravelPage })),
    TimeTravelGamePage: () => import('./pages/TimeTravelGamePage').then(module => ({ default: module.TimeTravelGamePage })),


    PresentationPage: () => import('./pages/PresentationPage').then(module => ({ default: module.PresentationPage })),
    LearningPathsHub: () => import('./pages/LearningPathsHub').then(module => ({ default: module.LearningPathsHub })),
    CompositionTool: () => import('./features/music/components/composition/CompositionTool').then(module => ({ default: module.CompositionTool })),
    RhythmTapperPage: () => import('./features/music/pages/RhythmTapperPage'),
    EarTrainerPage: () => import('./features/music/pages/EarTrainerPage'),
    GitarstudioPage: () => import('./features/music/pages/GitarstudioPage'),
    InfrastrukturAtlas: () => import('./features/infrastruktur/InfrastrukturAtlasPage').then(module => ({ default: module.InfrastrukturAtlasPage })),
    OkonomiVerden: () => import('./features/okonomi-verden/OkonomiVerdenPage').then(module => ({ default: module.OkonomiVerdenPage })),
    VirkemiddelverkstedetPage: () => import('./pages/VirkemiddelverkstedetPage').then(module => ({ default: module.VirkemiddelverkstedetPage })),
    MiniGamesPage: () => import('./pages/MiniGamesPage').then(module => ({ default: module.MiniGamesPage })),
    GamePage: () => import('./pages/GamePage').then(module => ({ default: module.GamePage })),
    RpgPage: () => import('./features/rpg/RpgPage'),
    CompetencyGoalsPage: () => import('./pages/CompetencyGoalsPage').then(module => ({ default: module.CompetencyGoalsPage })),
    SkyPage: () => import('./pages/SkyPage').then(module => ({ default: module.SkyPage })),
    MicroGamePreviewPage: () => import('./pages/MicroGamePreviewPage').then(module => ({ default: module.MicroGamePreviewPage })),
};

