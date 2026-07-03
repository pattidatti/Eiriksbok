import React, { lazy } from 'react';

// Static imports for core/lightweight components (optional, but keep them here for now)
import { GovernmentExplorer } from './GovernmentExplorer';
import { HistoryLongLines } from './HistoryLongLines';
import { Quiz } from './Quiz';
import { EICSimulation } from './EICSimulation';
import { FactBox } from './FactBox';
import { TimelineComponent } from './TimelineComponent';
import { PlotGraph } from './PlotGraph';
import { QuoteBlock } from './QuoteBlock';
import { Comparison } from './Comparison';
import { WritingFix } from './WritingFix';
import { LineChart } from './LineChart';
import { EmperorStats } from './EmperorStats';
import { LinkButton } from './tools/LinkButton';
import { WaveMap } from './content/interactive/WaveMap';
import { Gallery } from './Gallery';
import { MapCarousel } from './MapCarousel';

// Lazy-loaded components for better performance
// Interactive Content
const HelleristningTyder = lazy(() => import('./content/interactive/HelleristningTyder').then(m => ({ default: m.HelleristningTyder })));
const RidderMotLangbue = lazy(() => import('./content/interactive/RidderMotLangbue').then(m => ({ default: m.RidderMotLangbue })));
const EratosthenesJorda = lazy(() => import('./content/interactive/EratosthenesJorda').then(m => ({ default: m.EratosthenesJorda })));
const RoadToRevolution = lazy(() => import('./content/interactive/RoadToRevolution').then(m => ({ default: m.RoadToRevolution })));
const MaktfordelingSjekk = lazy(() => import('./content/interactive/MaktfordelingSjekk').then(m => ({ default: m.MaktfordelingSjekk })));
const KongensMaktBinding = lazy(() => import('./content/interactive/KongensMaktBinding').then(m => ({ default: m.KongensMaktBinding })));
const GullSaltVekten = lazy(() => import('./content/interactive/GullSaltVekten').then(m => ({ default: m.GullSaltVekten })));
const TondibiSlaget = lazy(() => import('./content/interactive/TondibiSlaget').then(m => ({ default: m.TondibiSlaget })));
const DenTauseHandelen = lazy(() => import('./content/interactive/DenTauseHandelen').then(m => ({ default: m.DenTauseHandelen })));
const FlatUtKurven = lazy(() => import('./content/interactive/FlatUtKurven').then(m => ({ default: m.FlatUtKurven })));
const BevisVurderer = lazy(() => import('./content/interactive/BevisVurderer').then(m => ({ default: m.BevisVurderer })));
const AllmennviljeVerksted = lazy(() => import('./content/interactive/AllmennviljeVerksted').then(m => ({ default: m.AllmennviljeVerksted })));
const ArvenFra1789 = lazy(() => import('./content/interactive/ArvenFra1789').then(m => ({ default: m.ArvenFra1789 })));
const MatGjesteBord = lazy(() => import('./content/interactive/MatGjesteBord').then(m => ({ default: m.MatGjesteBord })));
const MaktpyramidenJapan = lazy(() => import('./content/interactive/MaktpyramidenJapan').then(m => ({ default: m.MaktpyramidenJapan })));
const MeijiModellvalg = lazy(() => import('./content/interactive/MeijiModellvalg').then(m => ({ default: m.MeijiModellvalg })));
const Sjokkbolgen1905 = lazy(() => import('./content/interactive/Sjokkbolgen1905').then(m => ({ default: m.Sjokkbolgen1905 })));
const KaizenVerksted = lazy(() => import('./content/interactive/KaizenVerksted').then(m => ({ default: m.KaizenVerksted })));
const SymbolMatcher = lazy(() => import('./content/interactive/SymbolMatcher').then(m => ({ default: m.SymbolMatcher })));
const TragediensTrinn = lazy(() => import('./content/interactive/TragediensTrinn').then(m => ({ default: m.TragediensTrinn })));
const UtvandrerVekta = lazy(() => import('./content/interactive/UtvandrerVekta').then(m => ({ default: m.UtvandrerVekta })));
const SuverenitetsSkala = lazy(() => import('./content/interactive/SuverenitetsSkala').then(m => ({ default: m.SuverenitetsSkala })));
const FornorskingMaler = lazy(() => import('./content/interactive/FornorskingMaler').then(m => ({ default: m.FornorskingMaler })));
const KalmarMaktbalanse = lazy(() => import('./content/interactive/KalmarMaktbalanse').then(m => ({ default: m.KalmarMaktbalanse })));
const WienerkongressenForhandling = lazy(() => import('./content/interactive/WienerkongressenForhandling').then(m => ({ default: m.WienerkongressenForhandling })));
const OlympiskFred = lazy(() => import('./content/interactive/OlympiskFred').then(m => ({ default: m.OlympiskFred })));
const ByzantineSurvival = lazy(() => import('./content/interactive/ByzantineSurvival').then(m => ({ default: m.ByzantineSurvival })));
const ParallelleSivilisasjoner = lazy(() => import('./content/interactive/ParallelleSivilisasjoner').then(m => ({ default: m.ParallelleSivilisasjoner })));
const InflationCalculator = lazy(() => import('./content/interactive/InflationCalculator').then(m => ({ default: m.InflationCalculator })));
const TimePreferenceModel = lazy(() => import('./content/interactive/TimePreferenceModel').then(m => ({ default: m.TimePreferenceModel })));
const KriseSpaken = lazy(() => import('./content/interactive/KriseSpaken').then(m => ({ default: m.KriseSpaken })));
const BusinessCycleModel = lazy(() => import('./content/interactive/BusinessCycleModel').then(m => ({ default: m.BusinessCycleModel })));
const BusinessCycleGraph = lazy(() => import('./content/interactive/BusinessCycleGraph').then(m => ({ default: m.BusinessCycleGraph })));
const ProductionModel = lazy(() => import('./content/interactive/ProductionModel').then(m => ({ default: m.ProductionModel })));
const GrammarRuleCard = lazy(() => import('./content/interactive/GrammarRuleCard').then(m => ({ default: m.GrammarRuleCard })));
const AthenSparta = lazy(() => import('./content/interactive/AthenSparta').then(m => ({ default: m.AthenSparta })));
const TextHighlighter = lazy(() => import('./content/interactive/TextHighlighter').then(m => ({ default: m.TextHighlighter })));
const SentenceBuilder = lazy(() => import('./content/interactive/SentenceBuilder').then(m => ({ default: m.SentenceBuilder })));
const RomanPantheonExplorer = lazy(() => import('./content/interactive/RomanPantheonExplorer').then(m => ({ default: m.RomanPantheonExplorer })));
const AsherahUtgraving = lazy(() => import('./content/interactive/AsherahUtgraving').then(m => ({ default: m.AsherahUtgraving })));
const GreskGudeMatch = lazy(() => import('./content/interactive/GreskGudeMatch').then(m => ({ default: m.GreskGudeMatch })));
const TestPaastanden = lazy(() => import('./content/interactive/TestPaastanden').then(m => ({ default: m.TestPaastanden })));
const RomanExpansionMap = lazy(() => import('./content/interactive/RomanExpansionMap').then(m => ({ default: m.RomanExpansionMap })));
const TrolleyProblem = lazy(() => import('./content/interactive/TrolleyProblem').then(m => ({ default: m.TrolleyProblem })));
const GoldenMeanSlider = lazy(() => import('./content/interactive/GoldenMeanSlider').then(m => ({ default: m.GoldenMeanSlider })));
const CategoricalImperativeTester = lazy(() => import('./content/interactive/CategoricalImperativeTester').then(m => ({ default: m.CategoricalImperativeTester })));
const FilterBubbleSim = lazy(() => import('./content/interactive/FilterBubbleSim').then(m => ({ default: m.FilterBubbleSim })));
const StatistikkVri = lazy(() => import('./content/interactive/StatistikkVri').then(m => ({ default: m.StatistikkVri })));
const Valgmaskinen = lazy(() => import('./content/interactive/Valgmaskinen').then(m => ({ default: m.Valgmaskinen })));
const LevekaarSamspillet = lazy(() => import('./content/interactive/LevekaarSamspillet').then(m => ({ default: m.LevekaarSamspillet })));
const Konfliktlaboratoriet = lazy(() => import('./content/interactive/Konfliktlaboratoriet').then(m => ({ default: m.Konfliktlaboratoriet })));
const AlgoritmeSorteraren = lazy(() => import('./content/interactive/AlgoritmeSorteraren').then(m => ({ default: m.AlgoritmeSorteraren })));
const Teknologivekta = lazy(() => import('./content/interactive/Teknologivekta').then(m => ({ default: m.Teknologivekta })));
const HistoriensSpotlight = lazy(() => import('./content/interactive/HistoriensSpotlight').then(m => ({ default: m.HistoriensSpotlight })));
const Eskaleringstrappa = lazy(() => import('./content/interactive/Eskaleringstrappa').then(m => ({ default: m.Eskaleringstrappa })));
const Konsekvensvidda = lazy(() => import('./content/interactive/Konsekvensvidda').then(m => ({ default: m.Konsekvensvidda })));
const AutomationRisk = lazy(() => import('./content/interactive/AutomationRisk').then(m => ({ default: m.AutomationRisk })));
const ConformityExperiment = lazy(() => import('./content/interactive/ConformityExperiment').then(m => ({ default: m.ConformityExperiment })));
const OstracismGame = lazy(() => import('./content/interactive/OstracismGame').then(m => ({ default: m.OstracismGame })));
const VirtueBalance = lazy(() => import('./content/interactive/VirtueBalance').then(m => ({ default: m.VirtueBalance })));
const AuthorityShifter = lazy(() => import('./content/interactive/AuthorityShifter').then(m => ({ default: m.AuthorityShifter })));
const VerdiGrunnlaget = lazy(() => import('./content/interactive/VerdiGrunnlaget').then(m => ({ default: m.VerdiGrunnlaget })));
const Argumentlupen = lazy(() => import('./content/interactive/Argumentlupen').then(m => ({ default: m.Argumentlupen })));
const Medborgartesten = lazy(() => import('./content/interactive/Medborgartesten').then(m => ({ default: m.Medborgartesten })));
const SocialContractDecider = lazy(() => import('./content/interactive/SocialContractDecider').then(m => ({ default: m.SocialContractDecider })));
const TotalitarianSandbox = lazy(() => import('./content/interactive/TotalitarianSandbox').then(m => ({ default: m.TotalitarianSandbox })));
const BanalityRoutine = lazy(() => import('./content/interactive/BanalityRoutine').then(m => ({ default: m.BanalityRoutine })));
const SpontaneousOrderSim = lazy(() => import('./content/interactive/SpontaneousOrderSim').then(m => ({ default: m.SpontaneousOrderSim })));
const PrivateLawScenario = lazy(() => import('./content/interactive/PrivateLawScenario').then(m => ({ default: m.PrivateLawScenario })));
const TheocraticCouncil = lazy(() => import('./content/interactive/TheocraticCouncil').then(m => ({ default: m.TheocraticCouncil })));
const TechnocratProblemSolver = lazy(() => import('./content/interactive/TechnocratProblemSolver').then(m => ({ default: m.TechnocratProblemSolver })));
const EliteNetworkBuilder = lazy(() => import('./content/interactive/EliteNetworkBuilder').then(m => ({ default: m.EliteNetworkBuilder })));
const MonarchyEvolution = lazy(() => import('./content/interactive/MonarchyEvolution').then(m => ({ default: m.MonarchyEvolution })));
const ColonialGovernance = lazy(() => import('./content/interactive/ColonialGovernance').then(m => ({ default: m.ColonialGovernance })));
const ResourceTradeFlows = lazy(() => import('./content/interactive/ResourceTradeFlows').then(m => ({ default: m.ResourceTradeFlows })));
const InterdisciplinaryBridge = lazy(() => import('./content/interactive/InterdisciplinaryBridge').then(m => ({ default: m.InterdisciplinaryBridge })));
const FarmerYieldExplorer = lazy(() => import('./content/interactive/FarmerYieldExplorer').then(m => ({ default: m.FarmerYieldExplorer })));
const MillPowerExplorer = lazy(() => import('./content/interactive/MillPowerExplorer').then(m => ({ default: m.MillPowerExplorer })));
const ClockVsSunExplorer = lazy(() => import('./content/interactive/ClockVsSunExplorer').then(m => ({ default: m.ClockVsSunExplorer })));
const PrintingPressMultiplier = lazy(() => import('./content/interactive/PrintingPressMultiplier').then(m => ({ default: m.PrintingPressMultiplier })));
const BroadStreetInvestigator = lazy(() => import('./content/interactive/BroadStreetInvestigator').then(m => ({ default: m.BroadStreetInvestigator })));
const LightThroughTheAgesExplorer = lazy(() => import('./content/interactive/LightThroughTheAgesExplorer').then(m => ({ default: m.LightThroughTheAgesExplorer })));
const FoodPreservationExplorer = lazy(() => import('./content/interactive/FoodPreservationExplorer').then(m => ({ default: m.FoodPreservationExplorer })));
const HerdImmunityExplorer = lazy(() => import('./content/interactive/HerdImmunityExplorer').then(m => ({ default: m.HerdImmunityExplorer })));
const MessageSpeedExplorer = lazy(() => import('./content/interactive/MessageSpeedExplorer').then(m => ({ default: m.MessageSpeedExplorer })));
const StitchSpeedRace = lazy(() => import('./content/interactive/StitchSpeedRace').then(m => ({ default: m.StitchSpeedRace })));
// Det osmanske riket
const OttomanEraSlider = lazy(() => import('./content/interactive/OttomanEraSlider').then(m => ({ default: m.OttomanEraSlider })));
const OsmanDreamTree = lazy(() => import('./content/interactive/OsmanDreamTree').then(m => ({ default: m.OsmanDreamTree })));
const LawgiverOrConqueror = lazy(() => import('./content/interactive/LawgiverOrConqueror').then(m => ({ default: m.LawgiverOrConqueror })));
const DevsirmeJourney = lazy(() => import('./content/interactive/DevsirmeJourney').then(m => ({ default: m.DevsirmeJourney })));
const MilletExplorer = lazy(() => import('./content/interactive/MilletExplorer').then(m => ({ default: m.MilletExplorer })));
const TopkapiCourt = lazy(() => import('./content/interactive/TopkapiCourt').then(m => ({ default: m.TopkapiCourt })));
const OttomanCrossroads = lazy(() => import('./content/interactive/OttomanCrossroads').then(m => ({ default: m.OttomanCrossroads })));
const MapRedrawn = lazy(() => import('./content/interactive/MapRedrawn').then(m => ({ default: m.MapRedrawn })));
const StromkrigenDuel = lazy(() => import('./content/interactive/StromkrigenDuel').then(m => ({ default: m.StromkrigenDuel })));
const ResistensSim = lazy(() => import('./content/interactive/ResistensSim').then(m => ({ default: m.ResistensSim })));
const IdeologiSorter = lazy(() => import('./content/interactive/IdeologiSorter').then(m => ({ default: m.IdeologiSorter })));
const GlossaryTooltip = lazy(() => import('./content/interactive/GlossaryTooltip').then(m => ({ default: m.GlossaryTooltip })));
const ScenarioRoleplay = lazy(() => import('./content/interactive/ScenarioRoleplay').then(m => ({ default: m.ScenarioRoleplay })));
const DragDropTimeline = lazy(() => import('./content/interactive/DragDropTimeline').then(m => ({ default: m.DragDropTimeline })));
const PackTheBag = lazy(() => import('./content/interactive/PackTheBag').then(m => ({ default: m.PackTheBag })));
const DebateSimulator = lazy(() => import('./content/interactive/DebateSimulator').then(m => ({ default: m.DebateSimulator })));
const TetrarchyVisualizer = lazy(() => import('./content/interactive/TetrarchyVisualizer').then(m => ({ default: m.TetrarchyVisualizer })));
const PriceEdictExplorer = lazy(() => import('./content/interactive/PriceEdictExplorer').then(m => ({ default: m.PriceEdictExplorer })));
const RomanDefenseModel = lazy(() => import('./content/interactive/RomanDefenseModel').then(m => ({ default: m.RomanDefenseModel })));
const DetectiveEngine = lazy(() => import('./content/interactive/detective/DetectiveEngine').then(m => ({ default: m.DetectiveEngine })));
const PerspectivePrism = lazy(() => import('./content/interactive/PerspectivePrism').then(m => ({ default: m.PerspectivePrism })));
const PovertySimulation = lazy(() => import('./content/interactive/PovertySimulation').then(m => ({ default: m.PovertySimulation })));
const OkonomiVerdenLink = lazy(() => import('./content/interactive/okonomi/OkonomiVerdenLink').then(m => ({ default: m.OkonomiVerdenLink })));
const BiasLens = lazy(() => import('./learning-path/BiasLens').then(m => ({ default: m.BiasLens })));
const AllianceChain = lazy(() => import('./content/interactive/AllianceChain').then(m => ({ default: m.AllianceChain })));
const KontekstKompasset = lazy(() => import('./content/interactive/KontekstKompasset').then(m => ({ default: m.KontekstKompasset })));
const IdentitetsVeven = lazy(() => import('./content/interactive/IdentitetsVeven').then(m => ({ default: m.IdentitetsVeven })));
const EngasjementsMaskinen = lazy(() => import('./content/interactive/EngasjementsMaskinen').then(m => ({ default: m.EngasjementsMaskinen })));
const ArgumentBroen = lazy(() => import('./content/interactive/ArgumentBroen').then(m => ({ default: m.ArgumentBroen })));
const PowderKeg = lazy(() => import('./content/interactive/PowderKeg').then(m => ({ default: m.PowderKeg })));
const DreadnoughtDuel = lazy(() => import('./content/interactive/DreadnoughtDuel').then(m => ({ default: m.DreadnoughtDuel })));
const TrenchCrossSection = lazy(() => import('./content/interactive/TrenchCrossSection').then(m => ({ default: m.default })));
const AttritionWarfare = lazy(() => import('./content/interactive/AttritionWarfare').then(m => ({ default: m.default })));
const TankInterior = lazy(() => import('./content/interactive/TankInterior').then(m => ({ default: m.default })));
const GasAttackSim = lazy(() => import('./content/interactive/GasAttackSim').then(m => ({ default: m.default })));
const TsarsDilemma = lazy(() => import('./content/interactive/TsarsDilemma').then(m => ({ default: m.default })));
const HermeneuticCircle = lazy(() => import('./content/interactive/HermeneuticCircle').then(m => ({ default: m.HermeneuticCircle })));
const CyprusPeaceTalks = lazy(() => import('./content/interactive/CyprusPeaceTalks').then(m => ({ default: m.CyprusPeaceTalks })));
const DenStoreAkselerasjonen = lazy(() => import('./content/interactive/DenStoreAkselerasjonen').then(m => ({ default: m.DenStoreAkselerasjonen })));
const MaktfordelingMatch = lazy(() => import('./content/interactive/MaktfordelingMatch').then(m => ({ default: m.MaktfordelingMatch })));
const PersonalunionSorter = lazy(() => import('./content/interactive/PersonalunionSorter').then(m => ({ default: m.PersonalunionSorter })));
const Makttredelingen = lazy(() => import('./content/interactive/Makttredelingen').then(m => ({ default: m.Makttredelingen })));
const NapoleonsArv = lazy(() => import('./content/interactive/NapoleonsArv').then(m => ({ default: m.NapoleonsArv })));
const JernbaneReisesammenligning = lazy(() => import('./content/interactive/JernbaneReisesammenligning').then(m => ({ default: m.JernbaneReisesammenligning })));
const FiksjonensKraft = lazy(() => import('./content/interactive/FiksjonensKraft').then(m => ({ default: m.FiksjonensKraft })));
const BattleTacticsSim = lazy(() => import('./content/interactive/BattleTacticsSim').then(m => ({ default: m.BattleTacticsSim })));
const MottreformasjonsVerktoy = lazy(() => import('./content/interactive/MottreformasjonsVerktoy').then(m => ({ default: m.MottreformasjonsVerktoy })));
const LovensSmutthull = lazy(() => import('./content/interactive/LovensSmutthull').then(m => ({ default: m.LovensSmutthull })));
const SprakBaneVelger = lazy(() => import('./content/interactive/SprakBaneVelger').then(m => ({ default: m.SprakBaneVelger })));
const StormaktVagskal = lazy(() => import('./content/interactive/StormaktVagskal').then(m => ({ default: m.StormaktVagskal })));
const LeonardoNotatbok = lazy(() => import('./content/interactive/LeonardoNotatbok').then(m => ({ default: m.LeonardoNotatbok })));
const GalileoTelescope = lazy(() => import('./content/interactive/GalileoTelescope').then(m => ({ default: m.GalileoTelescope })));
const MichelangeloMarmor = lazy(() => import('./content/interactive/MichelangeloMarmor').then(m => ({ default: m.MichelangeloMarmor })));

// Skapende Skriving (Creative Writing)
const StoryElementMixer = lazy(() => import('./content/interactive/StoryElementMixer').then(m => ({ default: m.StoryElementMixer })));
const ThemeDigger = lazy(() => import('./content/interactive/ThemeDigger').then(m => ({ default: m.ThemeDigger })));
const PlotDNA = lazy(() => import('./content/interactive/PlotDNA').then(m => ({ default: m.PlotDNA })));
const CharacterForge = lazy(() => import('./content/interactive/CharacterForge').then(m => ({ default: m.CharacterForge })));
const PerspectiveSwitcher = lazy(() => import('./content/interactive/PerspectiveSwitcher').then(m => ({ default: m.PerspectiveSwitcher })));
const PopkulturKoblingen = lazy(() => import('./content/interactive/PopkulturKoblingen').then(m => ({ default: m.PopkulturKoblingen })));
const HoytidsKalender = lazy(() => import('./content/interactive/HoytidsKalender').then(m => ({ default: m.HoytidsKalender })));
const SentenceTransformer = lazy(() => import('./content/interactive/SentenceTransformer').then(m => ({ default: m.SentenceTransformer })));
const TimelineDirector = lazy(() => import('./content/interactive/TimelineDirector').then(m => ({ default: m.TimelineDirector })));
const DialogDissector = lazy(() => import('./content/interactive/DialogDissector').then(m => ({ default: m.DialogDissector })));
const NovelleSlicer = lazy(() => import('./content/interactive/NovelleSlicer').then(m => ({ default: m.NovelleSlicer })));
const ShotTypeExplorer = lazy(() => import('./content/interactive/ShotTypeExplorer').then(m => ({ default: m.ShotTypeExplorer })));

// Tekstanalyse (Text Analysis)
const QuoteWeaver = lazy(() => import('./content/interactive/QuoteWeaver').then(m => ({ default: m.QuoteWeaver })));
const ParagraphBuilder = lazy(() => import('./content/interactive/ParagraphBuilder').then(m => ({ default: m.ParagraphBuilder })));
const ArgumentScaffold = lazy(() => import('./content/interactive/ArgumentScaffold').then(m => ({ default: m.ArgumentScaffold })));
const OppgaveTolker = lazy(() => import('./content/interactive/OppgaveTolker').then(m => ({ default: m.OppgaveTolker })));

// Demography
const DTMSimulator = lazy(() => import('./content/interactive/demography/DTMSimulator').then(m => ({ default: m.DTMSimulator })));
const MalthusBoserupModel = lazy(() => import('./content/interactive/demography/MalthusBoserupModel').then(m => ({ default: m.MalthusBoserupModel })));
const MigrationJourney = lazy(() => import('./content/interactive/demography/MigrationJourney').then(m => ({ default: m.MigrationJourney })));
const LifeExpectancyModel = lazy(() => import('./content/interactive/demography/LifeExpectancyModel').then(m => ({ default: m.LifeExpectancyModel })));
const UrbanizationTimeline = lazy(() => import('./content/interactive/demography/UrbanizationTimeline').then(m => ({ default: m.UrbanizationTimeline })));
const PopulationPyramidBuilder = lazy(() => import('../components/tools/PopulationPyramidBuilder').then(m => ({ default: m.PopulationPyramidBuilder })));
const UrbanSprawlSim = lazy(() => import('./content/interactive/demography/UrbanSprawlSim').then(m => ({ default: m.UrbanSprawlSim })));

// Economics
const TradeLoopComponent = lazy(() => import('./content/interactive/okonomi/TradeLoopComponent').then(m => ({ default: m.TradeLoopComponent })));
const SpecializationSlider = lazy(() => import('./content/interactive/okonomi/SpecializationSlider').then(m => ({ default: m.SpecializationSlider })));
const LoanableFundsMarket = lazy(() => import('./content/interactive/okonomi/LoanableFundsMarket').then(m => ({ default: m.LoanableFundsMarket })));
const HayekTriangle = lazy(() => import('./content/interactive/okonomi/HayekTriangle').then(m => ({ default: m.HayekTriangle })));
const FortrinnsKalkulator = lazy(() => import('./content/interactive/okonomi/FortrinnsKalkulator').then(m => ({ default: m.FortrinnsKalkulator })));
const EconomicSchoolsDiagnosis = lazy(() => import('./content/interactive/okonomi/EconomicSchoolsDiagnosis').then(m => ({ default: m.EconomicSchoolsDiagnosis })));

// Arbeidsliv
const WageNegotiationSim = lazy(() => import('./content/interactive/arbeidsliv/WageNegotiationSim').then(m => ({ default: m.WageNegotiationSim })));

// Viking/Historie
const ConflictMap = lazy(() => import('./viking/ConflictMap').then(m => ({ default: m.ConflictMap })));
const FeudalPyramid = lazy(() => import('./viking/FeudalPyramid').then(m => ({ default: m.FeudalPyramid })));
const PantheonExplorer = lazy(() => import('./viking/PantheonExplorer').then(m => ({ default: m.PantheonExplorer })));
const LanguageMixer = lazy(() => import('./viking/LanguageMixer').then(m => ({ default: m.LanguageMixer })));
const TradeRouteMap = lazy(() => import('./viking/TradeRouteMap').then(m => ({ default: m.TradeRouteMap })));
const TimelineSlider = lazy(() => import('./viking/TimelineSlider').then(m => ({ default: m.TimelineSlider })));

// Music Features
const VirtualPiano = lazy(() => import('../features/music/components/VirtualPiano').then(m => ({ default: m.VirtualPiano })));
const FretboardExplorer = lazy(() => import('../features/music/components/FretboardExplorer').then(m => ({ default: m.FretboardExplorer })));
const BeatBuilder = lazy(() => import('../features/music/components/BeatBuilder').then(m => ({ default: m.BeatBuilder })));
const ChordLibrary = lazy(() => import('../features/music/components/ChordLibrary').then(m => ({ default: m.ChordLibrary })));
const SongStructureBuilder = lazy(() => import('../features/music/components/SongStructureBuilder').then(m => ({ default: m.SongStructureBuilder })));
const ArrangementPlanner = lazy(() => import('../features/music/components/ArrangementPlanner').then(m => ({ default: m.ArrangementPlanner })));
const SongwriterStudio = lazy(() => import('../features/music/components/SongwriterStudio').then(m => ({ default: m.SongwriterStudio })));
const CAGEDExplorer = lazy(() => import('./content/interactive/CAGEDExplorer').then(m => ({ default: m.CAGEDExplorer })));
const ProtestsangAnalyse = lazy(() => import('./content/interactive/ProtestsangAnalyse').then(m => ({ default: m.ProtestsangAnalyse })));
const BluesNoteVerksted = lazy(() => import('./content/interactive/BluesNoteVerksted').then(m => ({ default: m.BluesNoteVerksted })));
const HookOppdageren = lazy(() => import('./content/interactive/HookOppdageren').then(m => ({ default: m.HookOppdageren })));
const ProgresjonAnalysator = lazy(() => import('./content/interactive/ProgresjonAnalysator').then(m => ({ default: m.ProgresjonAnalysator })));
const SoloSammenligner = lazy(() => import('./content/interactive/SoloSammenligner').then(m => ({ default: m.SoloSammenligner })));
const AkkordskiftePraksis = lazy(() => import('./content/interactive/AkkordskiftePraksis').then(m => ({ default: m.AkkordskiftePraksis })));
const NilenFlomSyklus = lazy(() => import('./content/interactive/NilenFlomSyklus').then(m => ({ default: m.NilenFlomSyklus })));
const IndusMysteryBoard = lazy(() => import('./content/interactive/IndusMysteryBoard').then(m => ({ default: m.IndusMysteryBoard })));
const HimmelensMandat = lazy(() => import('./content/interactive/HimmelensMandat').then(m => ({ default: m.HimmelensMandat })));
const KejuEksamen = lazy(() => import('./content/interactive/KejuEksamen').then(m => ({ default: m.KejuEksamen })));
const SilkeveiStafett = lazy(() => import('./content/interactive/SilkeveiStafett').then(m => ({ default: m.SilkeveiStafett })));
const OpiumTrekanten = lazy(() => import('./content/interactive/OpiumTrekanten').then(m => ({ default: m.OpiumTrekanten })));
const FolketsTillit = lazy(() => import('./content/interactive/FolketsTillit').then(m => ({ default: m.FolketsTillit })));
const LognSpiral = lazy(() => import('./content/interactive/LognSpiral').then(m => ({ default: m.LognSpiral })));
const ShenzhenSonen = lazy(() => import('./content/interactive/ShenzhenSonen').then(m => ({ default: m.ShenzhenSonen })));
const SupermaktDuell = lazy(() => import('./content/interactive/SupermaktDuell').then(m => ({ default: m.SupermaktDuell })));
const ThoughtsWordsDeeds = lazy(() => import('./content/interactive/ThoughtsWordsDeeds').then(m => ({ default: m.ThoughtsWordsDeeds })));
const KyrosValget = lazy(() => import('./content/interactive/KyrosValget').then(m => ({ default: m.KyrosValget })));
const AleksandersValg = lazy(() => import('./content/interactive/AleksandersValg').then(m => ({ default: m.AleksandersValg })));
const FarmerVsForager = lazy(() => import('./content/interactive/FarmerVsForager').then(m => ({ default: m.FarmerVsForager })));
const VasaMaktSpaker = lazy(() => import('./content/interactive/VasaMaktSpaker').then(m => ({ default: m.VasaMaktSpaker })));
const Radikaliseringstrappa = lazy(() => import('./content/interactive/Radikaliseringstrappa').then(m => ({ default: m.Radikaliseringstrappa })));
const KausalitetsVri = lazy(() => import('./content/interactive/KausalitetsVri').then(m => ({ default: m.KausalitetsVri })));
const TradisjonFornyelseVever = lazy(() => import('./content/interactive/TradisjonFornyelseVever').then(m => ({ default: m.TradisjonFornyelseVever })));
const OkkupasjonensValg = lazy(() => import('./content/interactive/OkkupasjonensValg').then(m => ({ default: m.OkkupasjonensValg })));
const MerverdiSlider = lazy(() => import('./content/interactive/MerverdiSlider').then(m => ({ default: m.MerverdiSlider })));
const RenessansePerspektiv = lazy(() => import('./content/interactive/RenessansePerspektiv').then(m => ({ default: m.RenessansePerspektiv })));
const NorrontOrdmatch = lazy(() => import('./content/interactive/NorrontOrdmatch').then(m => ({ default: m.NorrontOrdmatch })));
const SkalaSammenligner = lazy(() => import('./content/interactive/SkalaSammenligner').then(m => ({ default: m.SkalaSammenligner })));
const KorstogMotiver = lazy(() => import('./content/interactive/KorstogMotiver').then(m => ({ default: m.KorstogMotiver })));
const KalvinParadokset = lazy(() => import('./content/interactive/KalvinParadokset').then(m => ({ default: m.KalvinParadokset })));
const KarlstadForhandling = lazy(() => import('./content/interactive/KarlstadForhandling').then(m => ({ default: m.KarlstadForhandling })));
const KommaRedder = lazy(() => import('./content/interactive/KommaRedder').then(m => ({ default: m.KommaRedder })));
const DynamicsPlayground = lazy(() => import('./content/interactive/DynamicsPlayground').then(m => ({ default: m.DynamicsPlayground })));
const SamplingLab = lazy(() => import('./content/interactive/SamplingLab').then(m => ({ default: m.SamplingLab })));
const BaptismComparator = lazy(() => import('./content/interactive/BaptismComparator').then(m => ({ default: m.BaptismComparator })));
const PinseNasjoner = lazy(() => import('./content/interactive/PinseNasjoner').then(m => ({ default: m.PinseNasjoner })));
const TradisjonEllerNytt = lazy(() => import('./content/interactive/TradisjonEllerNytt').then(m => ({ default: m.TradisjonEllerNytt })));
const TekstVerksted = lazy(() => import('./content/interactive/TekstVerksted').then(m => ({ default: m.TekstVerksted })));
const IranContraSpor = lazy(() => import('./content/interactive/IranContraSpor').then(m => ({ default: m.IranContraSpor })));
const KaldKrigBlowbackChain = lazy(() => import('./content/interactive/KaldKrigBlowbackChain').then(m => ({ default: m.KaldKrigBlowbackChain })));
const KunnskapsMigrasjonsKart = lazy(() => import('./content/interactive/KunnskapsMigrasjonsKart').then(m => ({ default: m.KunnskapsMigrasjonsKart })));
const MidtostenAkseAnalyse = lazy(() => import('./content/interactive/MidtostenAkseAnalyse').then(m => ({ default: m.MidtostenAkseAnalyse })));
const KalifatvalgetTre = lazy(() => import('./content/interactive/KalifatvalgetTre').then(m => ({ default: m.KalifatvalgetTre })));
const OljeVapenet = lazy(() => import('./content/interactive/OljeVapenet').then(m => ({ default: m.OljeVapenet })));
const RevolusjonsVeikryss = lazy(() => import('./content/interactive/RevolusjonsVeikryss').then(m => ({ default: m.RevolusjonsVeikryss })));
const TreLoefterKart = lazy(() => import('./content/interactive/TreLoefterKart').then(m => ({ default: m.TreLoefterKart })));
const MilitaerVsStrategisk = lazy(() => import('./content/interactive/MilitaerVsStrategisk').then(m => ({ default: m.MilitaerVsStrategisk })));
const ProxyKrigWebben = lazy(() => import('./content/interactive/ProxyKrigWebben').then(m => ({ default: m.ProxyKrigWebben })));
const HygieneTidsreise = lazy(() => import('./content/interactive/HygieneTidsreise').then(m => ({ default: m.HygieneTidsreise })));
const RetorikkMikseren = lazy(() => import('./content/interactive/RetorikkMikseren').then(m => ({ default: m.RetorikkMikseren })));
const RunebommeExplorer = lazy(() => import('./content/interactive/RunebommeExplorer').then(m => ({ default: m.RunebommeExplorer })));
const RubiconChoice = lazy(() => import('./content/interactive/RubiconChoice').then(m => ({ default: m.RubiconChoice })));
const HekseprosessLogikk = lazy(() => import('./content/interactive/HekseprosessLogikk').then(m => ({ default: m.HekseprosessLogikk })));
const NurembergDefense = lazy(() => import('./content/interactive/NurembergDefense').then(m => ({ default: m.NurembergDefense })));
const DebtTrapPlaybook = lazy(() => import('./content/interactive/DebtTrapPlaybook').then(m => ({ default: m.DebtTrapPlaybook })));
const AjaxRingvirkninger = lazy(() => import('./content/interactive/AjaxRingvirkninger').then(m => ({ default: m.AjaxRingvirkninger })));
const OkonomiSkriker = lazy(() => import('./content/interactive/OkonomiSkriker').then(m => ({ default: m.OkonomiSkriker })));
const BananaMaktnett = lazy(() => import('./content/interactive/BananaMaktnett').then(m => ({ default: m.BananaMaktnett })));
const StrukturtilpasningSim = lazy(() => import('./content/interactive/StrukturtilpasningSim').then(m => ({ default: m.StrukturtilpasningSim })));
const PetrodollarKretslop = lazy(() => import('./content/interactive/PetrodollarKretslop').then(m => ({ default: m.PetrodollarKretslop })));
const JakartaMetoden = lazy(() => import('./content/interactive/JakartaMetoden').then(m => ({ default: m.JakartaMetoden })));
const KolonimaktSkifte = lazy(() => import('./content/interactive/KolonimaktSkifte').then(m => ({ default: m.KolonimaktSkifte })));
const DigitalsporProfileren = lazy(() => import('./content/interactive/DigitalsporProfileren').then(m => ({ default: m.DigitalsporProfileren })));
const Selvfolelsensfundament = lazy(() => import('./content/interactive/Selvfolelsensfundament').then(m => ({ default: m.Selvfolelsensfundament })));
const NordMotSor = lazy(() => import('./content/interactive/NordMotSor').then(m => ({ default: m.NordMotSor })));
const KristendomsGrenerUtforsker = lazy(() => import('./content/interactive/KristendomsGrenerUtforsker').then(m => ({ default: m.KristendomsGrenerUtforsker })));
const BritPilarer = lazy(() => import('./content/interactive/BritPilarer').then(m => ({ default: m.BritPilarer })));
const DharmahjuletUtforsker = lazy(() => import('./content/interactive/DharmahjuletUtforsker').then(m => ({ default: m.DharmahjuletUtforsker })));
const AttedeltVeiDilemma = lazy(() => import('./content/interactive/AttedeltVeiDilemma').then(m => ({ default: m.AttedeltVeiDilemma })));
const MokshaVeiene = lazy(() => import('./content/interactive/MokshaVeiene').then(m => ({ default: m.MokshaVeiene })));
const DemokratietFaller = lazy(() => import('./content/interactive/DemokratietFaller').then(m => ({ default: m.DemokratietFaller })));

// Mikrospill: lett, embeddbart spill inline i artikkel. gameId-prop velger spillet
// fra mikrospill-registeret (src/components/microgames/registry.ts).
const MicroGame = lazy(() => import('./microgames/MicroGameBlock').then(m => ({ default: m.MicroGameBlock })));

export const componentRegistry: Record<string, React.ComponentType<any>> = {
    // Core
    GovernmentExplorer,
    HistoryLongLines,
    HelleristningTyder,
    RidderMotLangbue,
    RoadToRevolution,
    MaktfordelingSjekk,
    EratosthenesJorda,
    GullSaltVekten,
    TondibiSlaget,
    FlatUtKurven,
    DenTauseHandelen,
    BevisVurderer,
    MatGjesteBord,
    ArvenFra1789,
    TragediensTrinn,
    FornorskingMaler,
    KalmarMaktbalanse,
    WienerkongressenForhandling,
    OlympiskFred,
    ParallelleSivilisasjoner,
    Quiz,
    EICSimulation,
    FactBox,
    TimelineComponent,
    PlotGraph,
    QuoteBlock,
    Comparison,
    WritingFix,
    LineChart,
    EmperorStats,
    LinkButton,
    MicroGame,
    AllmennviljeVerksted,
    StatistikkVri,
    Valgmaskinen,
    Selvfolelsensfundament,
    LevekaarSamspillet,
    Konfliktlaboratoriet,
    Teknologivekta,
    HistoriensSpotlight,
    Eskaleringstrappa,
    Konsekvensvidda,
    WaveMap,
    DigitalsporProfileren,

    // Interactive Content
    InflationCalculator,
    TimePreferenceModel,
    KriseSpaken,
    BusinessCycleModel,
    BusinessCycleGraph,
    ProductionModel,
    GrammarRuleCard,
    SymbolMatcher,
    AthenSparta,
    TextHighlighter,
    SentenceBuilder,
    RomanPantheonExplorer,
    AsherahUtgraving,
    GreskGudeMatch,
    TestPaastanden,
    RomanExpansionMap,
    UtvandrerVekta,
    MaktpyramidenJapan,
    MeijiModellvalg,
    Sjokkbolgen1905,
    KaizenVerksted,
    SuverenitetsSkala,
    TrolleyProblem,
    GoldenMeanSlider,
    CategoricalImperativeTester,
    FilterBubbleSim,
    AlgoritmeSorteraren,
    AutomationRisk,
    ConformityExperiment,
    OstracismGame,
    VirtueBalance,
    AuthorityShifter,
    VerdiGrunnlaget,
    Argumentlupen,
    Medborgartesten,
    SocialContractDecider,
    TotalitarianSandbox,
    BanalityRoutine,
    SpontaneousOrderSim,
    PrivateLawScenario,
    TheocraticCouncil,
    TechnocratProblemSolver,
    EliteNetworkBuilder,
    MonarchyEvolution,
    ColonialGovernance,
    ResourceTradeFlows,
    InterdisciplinaryBridge,
    FarmerYieldExplorer,
    MillPowerExplorer,
    ClockVsSunExplorer,
    PrintingPressMultiplier,
    BroadStreetInvestigator,
    LightThroughTheAgesExplorer,
    FoodPreservationExplorer,
    HerdImmunityExplorer,
    MessageSpeedExplorer,
    StitchSpeedRace,
    OttomanEraSlider,
    OsmanDreamTree,
    LawgiverOrConqueror,
    DevsirmeJourney,
    MilletExplorer,
    TopkapiCourt,
    OttomanCrossroads,
    MapRedrawn,
    StromkrigenDuel,
    ResistensSim,
    IdeologiSorter,
    GlossaryTooltip,
    ScenarioRoleplay,
    DragDropTimeline,
    PackTheBag,
    DebateSimulator,
    TetrarchyVisualizer,
    PriceEdictExplorer,
    RomanDefenseModel,
    DetectiveEngine,
    PerspectivePrism,
    PovertySimulation,
    OkonomiVerdenLink,
    ByzantineSurvival,
    BiasLens,
    AllianceChain,
    PowderKeg,
    DreadnoughtDuel,
    TrenchCrossSection,
    AttritionWarfare,
    TankInterior,
    GasAttackSim,
    TsarsDilemma,
    HermeneuticCircle,
    CyprusPeaceTalks,
    DenStoreAkselerasjonen,
    MaktfordelingMatch,
    PersonalunionSorter,
    Makttredelingen,
    NapoleonsArv,
    JernbaneReisesammenligning,
    FiksjonensKraft,
    BattleTacticsSim,
    MottreformasjonsVerktoy,
    LovensSmutthull,
    SprakBaneVelger,
    StormaktVagskal,
    LeonardoNotatbok,
    GalileoTelescope,
    MichelangeloMarmor,
    StoryElementMixer,
    ThemeDigger,
    PlotDNA,
    CharacterForge,
    PerspectiveSwitcher,
    PopkulturKoblingen,
    HoytidsKalender,
    SentenceTransformer,
    TimelineDirector,
    DialogDissector,
    NovelleSlicer,
    ShotTypeExplorer,
    QuoteWeaver,
    ParagraphBuilder,
    ArgumentScaffold,
    OppgaveTolker,
    TriangularTradeMap: lazy(() => import('./content/interactive/TriangularTradeMap').then(m => ({ default: m.TriangularTradeMap }))),
    CensorTask: lazy(() => import('./historie/CensorTask').then(m => ({ default: m.CensorTask }))),
    PropagandaDecoder: lazy(() => import('./historie/PropagandaDecoder').then(m => ({ default: m.PropagandaDecoder }))),
    TrumansDilemma: lazy(() => import('./historie/TrumansDilemma').then(m => ({ default: m.TrumansDilemma }))),
    NuclearSimulator: lazy(() => import('./content/interactive/NuclearSimulator').then(m => ({ default: m.NuclearSimulator }))),

    // Demography
    DTMSimulator,
    MalthusBoserupModel,
    MigrationJourney,
    LifeExpectancyModel,
    UrbanizationTimeline,
    PopulationPyramidBuilder,
    UrbanSprawlSim,

    // Economics
    TradeLoopComponent,
    SpecializationSlider,
    LoanableFundsMarket,
    HayekTriangle,
    FortrinnsKalkulator,
    EconomicSchoolsDiagnosis,

    // Arbeidsliv
    WageNegotiationSim,

    // Viking/History
    ConflictMap,
    FeudalPyramid,
    PantheonExplorer,
    LanguageMixer,
    TradeRouteMap,
    TimelineSlider,

    // Music
    CAGEDExplorer,
    VirtualPiano,
    FretboardExplorer,
    BeatBuilder,
    ChordLibrary,
    SongStructureBuilder,
    ArrangementPlanner,
    SongwriterStudio,
    ProtestsangAnalyse,
    BluesNoteVerksted,
    HookOppdageren,
    ProgresjonAnalysator,
    SoloSammenligner,
    AkkordskiftePraksis,
    NilenFlomSyklus,
    IndusMysteryBoard,
    HimmelensMandat,
    KejuEksamen,
    SilkeveiStafett,
    OpiumTrekanten,
    FolketsTillit,
    LognSpiral,
    ShenzhenSonen,
    SupermaktDuell,
    ThoughtsWordsDeeds,
    KyrosValget,
    AleksandersValg,
    FarmerVsForager,
    VasaMaktSpaker,
    Radikaliseringstrappa,
    KausalitetsVri,
    TradisjonFornyelseVever,
    OkkupasjonensValg,
    MerverdiSlider,
    RenessansePerspektiv,
    NorrontOrdmatch,
    SkalaSammenligner,
    KorstogMotiver,
    KalvinParadokset,
    KarlstadForhandling,
    KommaRedder,
    DynamicsPlayground,
    SamplingLab,
    BaptismComparator,
    PinseNasjoner,
    TradisjonEllerNytt,
    TekstVerksted,
    IranContraSpor,
    KaldKrigBlowbackChain,
    KunnskapsMigrasjonsKart,
    MidtostenAkseAnalyse,
    KalifatvalgetTre,
    OljeVapenet,
    RevolusjonsVeikryss,
    TreLoefterKart,
    MilitaerVsStrategisk,
    ProxyKrigWebben,
    HygieneTidsreise,
    RetorikkMikseren,
    RunebommeExplorer,
    RubiconChoice,
    DebtTrapPlaybook,
    AjaxRingvirkninger,
    OkonomiSkriker,
    BananaMaktnett,
    StrukturtilpasningSim,
    PetrodollarKretslop,
    JakartaMetoden,
    KolonimaktSkifte,
    NordMotSor,
    Gallery,
    gallery: Gallery,
    comparison: Comparison,
    SimpleTable: lazy(() => import('./SimpleTable').then(m => ({ default: m.SimpleTable }))),
    Hierarchy: lazy(() => import('./Hierarchy').then(m => ({ default: m.Hierarchy }))),
    triangularTradeMap: lazy(() => import('./content/interactive/TriangularTradeMap').then(m => ({ default: m.TriangularTradeMap }))),
    HanseaticLedger: lazy(() => import('./content/interactive/hanseatene/HanseaticLedger').then(m => ({ default: m.HanseaticLedger }))),
    HanseaticTradeMap: lazy(() => import('./content/interactive/hanseatene/HanseaticTradeMap').then(m => ({ default: m.HanseaticTradeMap }))),
    SpiceRoutePrice: lazy(() => import('./content/interactive/SpiceRoutePrice').then(m => ({ default: m.SpiceRoutePrice }))),
    WergildCalculator: lazy(() => import('./content/interactive/WergildCalculator').then(m => ({ default: m.WergildCalculator }))),
    LandskapslovSammenligner: lazy(() => import('./content/interactive/LandskapslovSammenligner').then(m => ({ default: m.LandskapslovSammenligner }))),
    HekseprosessLogikk,
    NurembergDefense,
    MythVsEvidence: lazy(() => import('./content/interactive/MythVsEvidence').then(m => ({ default: m.MythVsEvidence }))),

    // Handel og infrastruktur
    GlobalProductionDots: lazy(() => import('./content/interactive/infrastruktur/GlobalProductionDots').then(m => ({ default: m.GlobalProductionDots }))),
    PipelineScenario: lazy(() => import('./content/interactive/infrastruktur/PipelineScenario').then(m => ({ default: m.PipelineScenario }))),
    CableBreakSim: lazy(() => import('./content/interactive/infrastruktur/CableBreakSim').then(m => ({ default: m.CableBreakSim }))),
    ShipmentTracker: lazy(() => import('./content/interactive/infrastruktur/ShipmentTracker').then(m => ({ default: m.ShipmentTracker }))),
    CascadeFailureSim: lazy(() => import('./content/interactive/infrastruktur/CascadeFailureSim').then(m => ({ default: m.CascadeFailureSim }))),
    RettighetsLas: lazy(() => import('./content/interactive/RettighetsLas').then(m => ({ default: m.RettighetsLas }))),
    KongensMaktBinding,
    MapCarousel,
    KontekstKompasset,
    IdentitetsVeven,
    EngasjementsMaskinen,
    ArgumentBroen,
    KristendomsGrenerUtforsker,
    BritPilarer,
    DharmahjuletUtforsker,
    AttedeltVeiDilemma,
    MokshaVeiene,
    DemokratietFaller,
};

export const getComponent = (name: string) => {
    return componentRegistry[name] || null;
};
