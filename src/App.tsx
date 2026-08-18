import React, { Suspense } from 'react';
import { Layout } from './components/Layout';
import { PageSkeleton } from './components/Skeleton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { routeFactories } from './routes';
import { UpdatePrompt } from './components/UpdatePrompt';
import { AdminGuard } from './components/AdminGuard';
import { LayoutProvider } from './context/LayoutProvider';
import { GlossaryProvider } from './context/GlossaryProvider';
import './App.css';

// Lazy load pages using centralized factories
const LandingPage = React.lazy(routeFactories.LandingPage);
const SubjectPage = React.lazy(routeFactories.SubjectPage);
const TopicPage = React.lazy(routeFactories.TopicPage);
const LessonPage = React.lazy(routeFactories.LessonPage);
// const LessonPage = React.lazy(() => import('./pages/LessonPageDebug').then(module => ({ default: module.LessonPage })));
const SearchPage = React.lazy(routeFactories.SearchPage);
const TextLibraryPage = React.lazy(routeFactories.TextLibraryPage);
const TextReaderPage = React.lazy(routeFactories.TextReaderPage);
const NotFoundPage = React.lazy(routeFactories.NotFoundPage);
const FlashcardPage = React.lazy(routeFactories.FlashcardPage);
const PracticePage = React.lazy(routeFactories.PracticePage);
const MyLearningPage = React.lazy(routeFactories.MyLearningPage);
const DailyReviewPage = React.lazy(routeFactories.DailyReviewPage);
const SkyPage = React.lazy(routeFactories.SkyPage);
const QuizPage = React.lazy(routeFactories.QuizPage);
const QuizAdmin = React.lazy(routeFactories.QuizAdmin);
const QuizLobby = React.lazy(routeFactories.QuizLobby);
const QuizHost = React.lazy(routeFactories.QuizHost);
const QuizPlayer = React.lazy(routeFactories.QuizPlayer);
const ReligionPage = React.lazy(routeFactories.ReligionPage);
const ReligionHubPage = React.lazy(routeFactories.ReligionHubPage);
const ReligionComparisonPage = React.lazy(routeFactories.ReligionComparisonPage);
const PhilosophyComparisonPage = React.lazy(routeFactories.PhilosophyComparisonPage);
const TopicComparisonPage = React.lazy(routeFactories.TopicComparisonPage);
const GlobalTimelinePage = React.lazy(routeFactories.GlobalTimelinePage);
const AtlasPage = React.lazy(routeFactories.AtlasPage);
const ChronoGamePage = React.lazy(routeFactories.ChronoGamePage);
const KunnskapsloypaPage = React.lazy(routeFactories.KunnskapsloypaPage);
const KjedereaksjonenPage = React.lazy(routeFactories.KjedereaksjonenPage);
const RhetoricGamePage = React.lazy(routeFactories.RhetoricGamePage);
const HangmanPage = React.lazy(routeFactories.HangmanPage);
const ChronoGliderPage = React.lazy(routeFactories.ChronoGliderPage);
const StatsPage = React.lazy(routeFactories.StatsPage);
const AdminDashboard = React.lazy(routeFactories.AdminDashboard);
const ContentInventory = React.lazy(routeFactories.ContentInventory);
const LinkChecker = React.lazy(routeFactories.LinkChecker);
const ScannerPage = React.lazy(routeFactories.ScannerPage);
const WordSorterGame = React.lazy(routeFactories.WordSorterGame);
const ConceptSnakeGame = React.lazy(routeFactories.ConceptSnakeGame);
const PersonGallery = React.lazy(routeFactories.PersonGallery);
const PersonDetailPage = React.lazy(routeFactories.PersonDetailPage);
const PhilosophyOdyssey = React.lazy(routeFactories.PhilosophyOdyssey);
const DetectiveHubPage = React.lazy(routeFactories.DetectiveHubPage);
const DetectiveCasePage = React.lazy(routeFactories.DetectiveCasePage);
const ColonizationMap = React.lazy(routeFactories.ColonizationMap);
const EthicsExperimentPage = React.lazy(routeFactories.EthicsExperimentPage);
const TimeTravelPage = React.lazy(routeFactories.TimeTravelPage);
const TimeTravelGamePage = React.lazy(routeFactories.TimeTravelGamePage);

const PresentationPage = React.lazy(routeFactories.PresentationPage);
const LearningPathsHub = React.lazy(routeFactories.LearningPathsHub);
const CompositionTool = React.lazy(routeFactories.CompositionTool);
const RhythmTapperPage = React.lazy(routeFactories.RhythmTapperPage);
const EarTrainerPage = React.lazy(routeFactories.EarTrainerPage);
const GitarstudioPage = React.lazy(routeFactories.GitarstudioPage);
const InfrastrukturAtlas = React.lazy(routeFactories.InfrastrukturAtlas);
const OkonomiVerden = React.lazy(routeFactories.OkonomiVerden);
const VirkemiddelverkstedetPage = React.lazy(routeFactories.VirkemiddelverkstedetPage);
const MiniGamesPage = React.lazy(routeFactories.MiniGamesPage);
const GamePage = React.lazy(routeFactories.GamePage);
const RpgPage = React.lazy(routeFactories.RpgPage);
const CompetencyGoalsPage = React.lazy(routeFactories.CompetencyGoalsPage);
const MicroGamePreviewPage = React.lazy(routeFactories.MicroGamePreviewPage);



import { WorkstationLayout } from './components/workstation/WorkstationLayout';
import { usePresence } from './hooks/usePresence';
import { createBrowserRouter, RouterProvider, ScrollRestoration } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';

const AppRoot = () => {
  usePresence();
  return (
    <LayoutProvider>
      <GlossaryProvider>
        {/* Ny navigasjon starter på toppen, tilbakeknappen leverer eleven
            tilbake til plassen hun forlot. Tidligere gjorde ingen av delene seg
            selv: en elev som blar langt ned i en emneliste, åpner en artikkel og
            trykker tilbake, havnet øverst og måtte lete seg fram på nytt. */}
        <ScrollRestoration />
        <UpdatePrompt />
        <Layout />
      </GlossaryProvider>
    </LayoutProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppRoot />,
    errorElement: <ErrorBoundary><NotFoundPage /></ErrorBoundary>,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "sok", element: <SearchPage /> },
      { path: "norsk/bibliotek", element: <TextLibraryPage /> },
      { path: "norsk/bibliotek/:textId", element: <TextReaderPage /> },
      { path: "tidslinje", element: <GlobalTimelinePage /> },
      { path: "himmel", element: <SkyPage /> },
      { path: "atlas", element: <AtlasPage /> },
      { path: "persongalleri", element: <PersonGallery /> },
      { path: "persongalleri/:slug", element: <PersonDetailPage /> },
      { path: "colonization", element: <ColonizationMap /> },
      { path: "infrastruktur-atlas", element: <InfrastrukturAtlas /> },
      { path: "samfunnskunnskap/okonomi/verden", element: <OkonomiVerden /> },
      { path: "laeringsstier", element: <LearningPathsHub /> },
      { path: "norsk/virkemidler/desk", element: <WorkstationLayout /> },
      { path: "musikk/komposisjon", element: <CompositionTool /> },
      { path: "musikk/oving/rytme", element: <RhythmTapperPage /> },
      { path: "musikk/oving/gehortrening", element: <EarTrainerPage /> },
      { path: "musikk/gitarstudio", element: <GitarstudioPage /> },
      { path: "min-laering", element: <MyLearningPage /> },
      { path: "oving", element: <PracticePage /> },
      { path: "oving/dagens-okt", element: <DailyReviewPage /> },
      { path: "quiz", element: <QuizPage /> },
      { path: "oving/flashcards", element: <FlashcardPage /> },
      { path: "oving/quiz", element: <QuizPage /> },
      { path: "oving/chrono", element: <ChronoGamePage /> },
      { path: "oving/loype", element: <KunnskapsloypaPage /> },
      { path: "oving/kjedereaksjonen", element: <KjedereaksjonenPage /> },
      { path: "oving/retorikk", element: <RhetoricGamePage /> },
      { path: "oving/hengemann", element: <HangmanPage /> },
      { path: "oving/chrono-glider", element: <ChronoGliderPage /> },
      { path: "oving/konsept-snake", element: <ConceptSnakeGame /> },
      { path: "oving/detektiv", element: <DetectiveHubPage /> },
      { path: "oving/detektiv/:caseId", element: <DetectiveCasePage /> },
      { path: "oving/etikk", element: <EthicsExperimentPage /> },
      { path: "oving/tidsreise", element: <TimeTravelPage /> },
      { path: "oving/tidsreise/:scenarioId", element: <TimeTravelGamePage /> },
      { path: "oving/virkemidler", element: <VirkemiddelverkstedetPage /> },
      { path: "oving/spill", element: <MiniGamesPage /> },
      { path: "oving/spill/:gameId", element: <GamePage /> },
      { path: "oving/rpg", element: <RpgPage /> },
      { path: "mikrospill", element: <MicroGamePreviewPage /> },
      { path: "mikrospill/:gameId", element: <MicroGamePreviewPage /> },
      { path: "oving/kompetansemal", element: <CompetencyGoalsPage /> },
      { path: "historie/vikingtiden/detektiv", element: <DetectiveCasePage /> },
      { path: "admin", element: <AdminGuard><AdminDashboard /></AdminGuard> },
      { path: "admin/stats", element: <AdminGuard><StatsPage /></AdminGuard> },
      { path: "admin/inventory", element: <AdminGuard><ContentInventory /></AdminGuard> },
      { path: "admin/links", element: <AdminGuard><LinkChecker /></AdminGuard> },
      { path: "admin/scanner", element: <AdminGuard><ScannerPage /></AdminGuard> },
      { path: "quiz-battle", element: <QuizLobby /> },
      { path: "quiz-battle/admin-999", element: <AdminGuard><QuizAdmin /></AdminGuard> },
      { path: "quiz-battle/host/:pin", element: <AdminGuard><QuizHost /></AdminGuard> },
      { path: "quiz-battle/play/:pin", element: <QuizPlayer /> },
      { path: "krle/sammenlign", element: <ReligionComparisonPage /> },
      { path: "krle/filosofi/odyssey", element: <PhilosophyOdyssey /> },
      { path: "krle/filosofi/sammenlign", element: <PhilosophyComparisonPage /> },
      { path: "krle/sammenlign/tema/:tag", element: <TopicComparisonPage /> },
      { path: "krle/religion", element: <ReligionHubPage /> },
      { path: "krle/religion/:religionId", element: <ReligionPage /> },
      { path: ":subjectId/:topicId/present/:lessonId", element: <PresentationPage /> },
      { path: ":subjectId/:topicId/present/:lessonId/projector", element: <PresentationPage /> },
      { path: ":subjectId/:topicId/:subTopicId/present/:lessonId", element: <PresentationPage /> },
      { path: ":subjectId/:topicId/:subTopicId/present/:lessonId/projector", element: <PresentationPage /> },
      { path: ":subjectId", element: <SubjectPage /> },
      { path: ":subjectId/:topicId/:subTopicId/:lessonId", element: <LessonPage /> },
      { path: ":subjectId/:topicId/:lessonId", element: <LessonPage /> },
      { path: ":subjectId/:topicId/:subTopicId", element: <TopicPage /> },
      { path: ":subjectId/:topicId", element: <TopicPage /> },
      { path: "/norsk/ordklasser/sortering", element: <WordSorterGame /> },
      { path: "flashcards", element: <FlashcardPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
  future: {
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
    v7_relativeSplatPath: true,
  }
});

function App() {
  return (
    <ErrorBoundary>
      {/* reducedMotion="user" gjør at ALLE framer-motion-animasjoner i appen
          respekterer systeminnstillingen «reduser bevegelse» - ett sted, i
          stedet for én useReducedMotion() per komponent. Bevegelse (x/y/scale/
          rotasjon) slås av; opacity-overganger beholdes, siden de ikke utløser
          ubehag og ellers ville gitt harde innholdsbytter. */}
      <MotionConfig reducedMotion="user">
        <Suspense fallback={<PageSkeleton />}>
          <RouterProvider
            router={router}
            future={{
              v7_startTransition: true,
            }}
          />
        </Suspense>
      </MotionConfig>
    </ErrorBoundary>
  );
}

export default App;
