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
import { Kildeliste } from './Kildeliste';
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
const Oppgaver = lazy(() => import('./content/interactive/Oppgaver').then(m => ({ default: m.Oppgaver })));
const KrigsseilernesRegnskap = lazy(() => import('./content/interactive/KrigsseilernesRegnskap').then(m => ({ default: m.KrigsseilernesRegnskap })));
const SvalbardTraktatTest = lazy(() => import('./content/interactive/SvalbardTraktatTest').then(m => ({ default: m.SvalbardTraktatTest })));
const TerraNulliusDommen = lazy(() => import('./content/interactive/TerraNulliusDommen').then(m => ({ default: m.TerraNulliusDommen })));
const Gaatekart = lazy(() => import('./content/interactive/Gaatekart').then(m => ({ default: m.Gaatekart })));
const DhammaEllerSverd = lazy(() => import('./content/interactive/DhammaEllerSverd').then(m => ({ default: m.DhammaEllerSverd })));
const Kildekjeden = lazy(() => import('./content/interactive/Kildekjeden').then(m => ({ default: m.Kildekjeden })));
const MalstangaTest = lazy(() => import('./content/interactive/MalstangaTest').then(m => ({ default: m.MalstangaTest })));
const HaraldsRike = lazy(() => import('./content/interactive/HaraldsRike').then(m => ({ default: m.HaraldsRike })));
const LegendensVekst = lazy(() => import('./content/interactive/LegendensVekst').then(m => ({ default: m.LegendensVekst })));
const Skyldvekten = lazy(() => import('./content/interactive/Skyldvekten').then(m => ({ default: m.Skyldvekten })));
const Fallkurven = lazy(() => import('./content/interactive/Fallkurven').then(m => ({ default: m.Fallkurven })));
const Kornveien = lazy(() => import('./content/interactive/Kornveien').then(m => ({ default: m.Kornveien })));
const Diagnosebrettet = lazy(() => import('./content/interactive/Diagnosebrettet').then(m => ({ default: m.Diagnosebrettet })));
const AmerikaBevisSortering = lazy(() => import('./content/interactive/AmerikaBevisSortering').then(m => ({ default: m.AmerikaBevisSortering })));
const TrojaMyteEllerFunn = lazy(() => import('./content/interactive/TrojaMyteEllerFunn').then(m => ({ default: m.TrojaMyteEllerFunn })));
const SporTavlen = lazy(() => import('./content/interactive/SporTavlen').then(m => ({ default: m.SporTavlen })));
const GrenseTegner = lazy(() => import('./content/interactive/GrenseTegner').then(m => ({ default: m.GrenseTegner })));
const StilleKilder = lazy(() => import('./content/interactive/StilleKilder').then(m => ({ default: m.StilleKilder })));
const NasjonsbyggerLab = lazy(() => import('./content/interactive/NasjonsbyggerLab').then(m => ({ default: m.NasjonsbyggerLab })));
const ViFolelsen = lazy(() => import('./content/interactive/ViFolelsen').then(m => ({ default: m.ViFolelsen })));
const MytenesVerksted = lazy(() => import('./content/interactive/MytenesVerksted').then(m => ({ default: m.MytenesVerksted })));
const Revolusjonsbolgen1848 = lazy(() => import('./content/interactive/Revolusjonsbolgen1848').then(m => ({ default: m.Revolusjonsbolgen1848 })));
const TrelastVerdikjede = lazy(() => import('./content/interactive/TrelastVerdikjede').then(m => ({ default: m.TrelastVerdikjede })));
const SolvetsReise = lazy(() => import('./content/interactive/SolvetsReise').then(m => ({ default: m.SolvetsReise })));
const Nordnesnatten = lazy(() => import('./content/interactive/Nordnesnatten').then(m => ({ default: m.Nordnesnatten })));
const KunnskapsbroAndalus = lazy(() => import('./content/interactive/KunnskapsbroAndalus').then(m => ({ default: m.KunnskapsbroAndalus })));
const HelleristningTyder = lazy(() => import('./content/interactive/HelleristningTyder').then(m => ({ default: m.HelleristningTyder })));
const RidderMotLangbue = lazy(() => import('./content/interactive/RidderMotLangbue').then(m => ({ default: m.RidderMotLangbue })));
const EratosthenesJorda = lazy(() => import('./content/interactive/EratosthenesJorda').then(m => ({ default: m.EratosthenesJorda })));
const RoadToRevolution = lazy(() => import('./content/interactive/RoadToRevolution').then(m => ({ default: m.RoadToRevolution })));
const MaktensFristelse = lazy(() => import('./content/interactive/MaktensFristelse').then(m => ({ default: m.MaktensFristelse })));
const MaktfordelingSjekk = lazy(() => import('./content/interactive/MaktfordelingSjekk').then(m => ({ default: m.MaktfordelingSjekk })));
const Legitimitetsvekten = lazy(() => import('./content/interactive/Legitimitetsvekten').then(m => ({ default: m.Legitimitetsvekten })));
const MaktensKilde = lazy(() => import('./content/interactive/MaktensKilde').then(m => ({ default: m.MaktensKilde })));
const KollapsDiagnose = lazy(() => import('./content/interactive/KollapsDiagnose').then(m => ({ default: m.KollapsDiagnose })));
const HandelsnettKollaps = lazy(() => import('./content/interactive/HandelsnettKollaps').then(m => ({ default: m.HandelsnettKollaps })));
const RessurskollapsSimulator = lazy(() => import('./content/interactive/RessurskollapsSimulator').then(m => ({ default: m.RessurskollapsSimulator })));
const TorkensVippepunkt = lazy(() => import('./content/interactive/TorkensVippepunkt').then(m => ({ default: m.TorkensVippepunkt })));
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
const SymbolSporet = lazy(() => import('./content/interactive/SymbolSporet').then(m => ({ default: m.SymbolSporet })));
const TragediensTrinn = lazy(() => import('./content/interactive/TragediensTrinn').then(m => ({ default: m.TragediensTrinn })));
const UtvandrerVekta = lazy(() => import('./content/interactive/UtvandrerVekta').then(m => ({ default: m.UtvandrerVekta })));
const SuverenitetsSkala = lazy(() => import('./content/interactive/SuverenitetsSkala').then(m => ({ default: m.SuverenitetsSkala })));
const FornorskingMaler = lazy(() => import('./content/interactive/FornorskingMaler').then(m => ({ default: m.FornorskingMaler })));
const MinoritetsMatrisen = lazy(() => import('./content/interactive/MinoritetsMatrisen').then(m => ({ default: m.MinoritetsMatrisen })));
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
const MaalmerkeMatcher = lazy(() => import('./content/interactive/MaalmerkeMatcher').then(m => ({ default: m.MaalmerkeMatcher })));
const AthenSparta = lazy(() => import('./content/interactive/AthenSparta').then(m => ({ default: m.AthenSparta })));
const PeloponnesStrategi = lazy(() => import('./content/interactive/PeloponnesStrategi').then(m => ({ default: m.PeloponnesStrategi })));
const TextHighlighter = lazy(() => import('./content/interactive/TextHighlighter').then(m => ({ default: m.TextHighlighter })));
const SentenceBuilder = lazy(() => import('./content/interactive/SentenceBuilder').then(m => ({ default: m.SentenceBuilder })));
const RomanPantheonExplorer = lazy(() => import('./content/interactive/RomanPantheonExplorer').then(m => ({ default: m.RomanPantheonExplorer })));
const AsherahUtgraving = lazy(() => import('./content/interactive/AsherahUtgraving').then(m => ({ default: m.AsherahUtgraving })));
const GreskGudeMatch = lazy(() => import('./content/interactive/GreskGudeMatch').then(m => ({ default: m.GreskGudeMatch })));
const TestPaastanden = lazy(() => import('./content/interactive/TestPaastanden').then(m => ({ default: m.TestPaastanden })));
const RomanExpansionMap = lazy(() => import('./content/interactive/RomanExpansionMap').then(m => ({ default: m.RomanExpansionMap })));
const TrolleyProblem = lazy(() => import('./content/interactive/TrolleyProblem').then(m => ({ default: m.TrolleyProblem })));
const TraktatFellen = lazy(() => import('./content/interactive/TraktatFellen').then(m => ({ default: m.TraktatFellen })));
const TroensRotter = lazy(() => import('./content/interactive/TroensRotter').then(m => ({ default: m.TroensRotter })));
const VeilOfIgnorance = lazy(() => import('./content/interactive/VeilOfIgnorance').then(m => ({ default: m.VeilOfIgnorance })));
const DyreetikkBrillene = lazy(() => import('./content/interactive/DyreetikkBrillene').then(m => ({ default: m.DyreetikkBrillene })));
const KiAnsvarskjeden = lazy(() => import('./content/interactive/KiAnsvarskjeden').then(m => ({ default: m.KiAnsvarskjeden })));
const GoldenMeanSlider = lazy(() => import('./content/interactive/GoldenMeanSlider').then(m => ({ default: m.GoldenMeanSlider })));
const SikhNavneseremoni = lazy(() => import('./content/interactive/SikhNavneseremoni').then(m => ({ default: m.SikhNavneseremoni })));
const SkapelseVedOrd = lazy(() => import('./content/interactive/SkapelseVedOrd').then(m => ({ default: m.SkapelseVedOrd })));
const UniversetsAandedrag = lazy(() => import('./content/interactive/UniversetsAandedrag').then(m => ({ default: m.UniversetsAandedrag })));
const SporsmaalUtenSvar = lazy(() => import('./content/interactive/SporsmaalUtenSvar').then(m => ({ default: m.SporsmaalUtenSvar })));
const SkapelseUtenBegynnelse = lazy(() => import('./content/interactive/SkapelseUtenBegynnelse').then(m => ({ default: m.SkapelseUtenBegynnelse })));
const OrganisertAvMaterie = lazy(() => import('./content/interactive/OrganisertAvMaterie').then(m => ({ default: m.OrganisertAvMaterie })));
const DeSeksPeriodene = lazy(() => import('./content/interactive/DeSeksPeriodene').then(m => ({ default: m.DeSeksPeriodene })));
const FoerLysetFantes = lazy(() => import('./content/interactive/FoerLysetFantes').then(m => ({ default: m.FoerLysetFantes })));
const DenTommeRammen = lazy(() => import('./content/interactive/DenTommeRammen').then(m => ({ default: m.DenTommeRammen })));
const NavnetSomIkkeSies = lazy(() => import('./content/interactive/NavnetSomIkkeSies').then(m => ({ default: m.NavnetSomIkkeSies })));
const TreenighetensKnute = lazy(() => import('./content/interactive/TreenighetensKnute').then(m => ({ default: m.TreenighetensKnute })));
const TawhidEllerShirk = lazy(() => import('./content/interactive/TawhidEllerShirk').then(m => ({ default: m.TawhidEllerShirk })));
const SpeiletOgSolen = lazy(() => import('./content/interactive/SpeiletOgSolen').then(m => ({ default: m.SpeiletOgSolen })));
const GuddommenModellen = lazy(() => import('./content/interactive/GuddommenModellen').then(m => ({ default: m.GuddommenModellen })));
const HvemErStorst = lazy(() => import('./content/interactive/HvemErStorst').then(m => ({ default: m.HvemErStorst })));
const EnEllerMillioner = lazy(() => import('./content/interactive/EnEllerMillioner').then(m => ({ default: m.EnEllerMillioner })));
const GudeneSomIkkeFrelser = lazy(() => import('./content/interactive/GudeneSomIkkeFrelser').then(m => ({ default: m.GudeneSomIkkeFrelser })));
const MinjanRommet = lazy(() => import('./content/interactive/MinjanRommet').then(m => ({ default: m.MinjanRommet })));
const FadervaarLinjeForLinje = lazy(() => import('./content/interactive/FadervaarLinjeForLinje').then(m => ({ default: m.FadervaarLinjeForLinje })));
const SolaSomKlokke = lazy(() => import('./content/interactive/SolaSomKlokke').then(m => ({ default: m.SolaSomKlokke })));
const TreBonnerEttValg = lazy(() => import('./content/interactive/TreBonnerEttValg').then(m => ({ default: m.TreBonnerEttValg })));
const BonnSomSamtale = lazy(() => import('./content/interactive/BonnSomSamtale').then(m => ({ default: m.BonnSomSamtale })));
const AdressenPaaBonnen = lazy(() => import('./content/interactive/AdressenPaaBonnen').then(m => ({ default: m.AdressenPaaBonnen })));
const PujaBrettet = lazy(() => import('./content/interactive/PujaBrettet').then(m => ({ default: m.PujaBrettet })));
const HvemSnakkerDuTil = lazy(() => import('./content/interactive/HvemSnakkerDuTil').then(m => ({ default: m.HvemSnakkerDuTil })));
const PliktenSomFlytterSeg = lazy(() => import('./content/interactive/PliktenSomFlytterSeg').then(m => ({ default: m.PliktenSomFlytterSeg })));
const NaarSkalDuDoepes = lazy(() => import('./content/interactive/NaarSkalDuDoepes').then(m => ({ default: m.NaarSkalDuDoepes })));
const FoersteOgSisteOrd = lazy(() => import('./content/interactive/FoersteOgSisteOrd').then(m => ({ default: m.FoersteOgSisteOrd })));
const SamtykkePorten = lazy(() => import('./content/interactive/SamtykkePorten').then(m => ({ default: m.SamtykkePorten })));
const Slektskjeden = lazy(() => import('./content/interactive/Slektskjeden').then(m => ({ default: m.Slektskjeden })));
const ValgetDuTarSelv = lazy(() => import('./content/interactive/ValgetDuTarSelv').then(m => ({ default: m.ValgetDuTarSelv })));
const SamskaraStigen = lazy(() => import('./content/interactive/SamskaraStigen').then(m => ({ default: m.SamskaraStigen })));
const RitenSomIkkeFinnes = lazy(() => import('./content/interactive/RitenSomIkkeFinnes').then(m => ({ default: m.RitenSomIkkeFinnes })));
const DenneVerdenFoerst = lazy(() => import('./content/interactive/DenneVerdenFoerst').then(m => ({ default: m.DenneVerdenFoerst })));
const Signeringsbordet = lazy(() => import('./content/interactive/Signeringsbordet').then(m => ({ default: m.Signeringsbordet })));
const VektskaalenPaaDommensDag = lazy(() => import('./content/interactive/VektskaalenPaaDommensDag').then(m => ({ default: m.VektskaalenPaaDommensDag })));
const Fosterkammeret = lazy(() => import('./content/interactive/Fosterkammeret').then(m => ({ default: m.Fosterkammeret })));
const TreGraderAvHerlighet = lazy(() => import('./content/interactive/TreGraderAvHerlighet').then(m => ({ default: m.TreGraderAvHerlighet })));
const HundreOgFortiFireTusen = lazy(() => import('./content/interactive/HundreOgFortiFireTusen').then(m => ({ default: m.HundreOgFortiFireTusen })));
const SamsaraHjulet = lazy(() => import('./content/interactive/SamsaraHjulet').then(m => ({ default: m.SamsaraHjulet })));
const FlammenSomSlukner = lazy(() => import('./content/interactive/FlammenSomSlukner').then(m => ({ default: m.FlammenSomSlukner })));
const DraapenIHavet = lazy(() => import('./content/interactive/DraapenIHavet').then(m => ({ default: m.DraapenIHavet })));
const IngenStifterMenEnPakt = lazy(() => import('./content/interactive/IngenStifterMenEnPakt').then(m => ({ default: m.IngenStifterMenEnPakt })));
const HanStiftetIngenReligion = lazy(() => import('./content/interactive/HanStiftetIngenReligion').then(m => ({ default: m.HanStiftetIngenReligion })));
const ProfetIkkeGud = lazy(() => import('./content/interactive/ProfetIkkeGud').then(m => ({ default: m.ProfetIkkeGud })));
const ToSomHengerSammen = lazy(() => import('./content/interactive/ToSomHengerSammen').then(m => ({ default: m.ToSomHengerSammen })));
const VitnenesUnderskrifter = lazy(() => import('./content/interactive/VitnenesUnderskrifter').then(m => ({ default: m.VitnenesUnderskrifter })));
const GrunnleggerenSomIkkeVil = lazy(() => import('./content/interactive/GrunnleggerenSomIkkeVil').then(m => ({ default: m.GrunnleggerenSomIkkeVil })));
const LetingenEtterEnStifter = lazy(() => import('./content/interactive/LetingenEtterEnStifter').then(m => ({ default: m.LetingenEtterEnStifter })));
const MennesketSomVaaknet = lazy(() => import('./content/interactive/MennesketSomVaaknet').then(m => ({ default: m.MennesketSomVaaknet })));
const TiGuruerOgEnBok = lazy(() => import('./content/interactive/TiGuruerOgEnBok').then(m => ({ default: m.TiGuruerOgEnBok })));
const SidenSomVokser = lazy(() => import('./content/interactive/SidenSomVokser').then(m => ({ default: m.SidenSomVokser })));
const HvaKomMedIBoka = lazy(() => import('./content/interactive/HvaKomMedIBoka').then(m => ({ default: m.HvaKomMedIBoka })));
const OversettelsenSomIkkeErKoranen = lazy(() => import('./content/interactive/OversettelsenSomIkkeErKoranen').then(m => ({ default: m.OversettelsenSomIkkeErKoranen })));
const SkrevetAvHamSelv = lazy(() => import('./content/interactive/SkrevetAvHamSelv').then(m => ({ default: m.SkrevetAvHamSelv })));
const KanonenSomIkkeErLukket = lazy(() => import('./content/interactive/KanonenSomIkkeErLukket').then(m => ({ default: m.KanonenSomIkkeErLukket })));
const NavnetSattInnIgjen = lazy(() => import('./content/interactive/NavnetSattInnIgjen').then(m => ({ default: m.NavnetSattInnIgjen })));
const HoertEllerHusket = lazy(() => import('./content/interactive/HoertEllerHusket').then(m => ({ default: m.HoertEllerHusket })));
const TreKurverOgFlereKanoner = lazy(() => import('./content/interactive/TreKurverOgFlereKanoner').then(m => ({ default: m.TreKurverOgFlereKanoner })));
const BokaSomLeggerSeg = lazy(() => import('./content/interactive/BokaSomLeggerSeg').then(m => ({ default: m.BokaSomLeggerSeg })));
const DetAlleErEnigeOm = lazy(() => import('./content/interactive/DetAlleErEnigeOm').then(m => ({ default: m.DetAlleErEnigeOm })));
const FemHandlingerIkkeFemTanker = lazy(() => import('./content/interactive/FemHandlingerIkkeFemTanker').then(m => ({ default: m.FemHandlingerIkkeFemTanker })));
const TreEnheter = lazy(() => import('./content/interactive/TreEnheter').then(m => ({ default: m.TreEnheter })));
const GjenopprettelsensPaastand = lazy(() => import('./content/interactive/GjenopprettelsensPaastand').then(m => ({ default: m.GjenopprettelsensPaastand })));
const HvaSomSkillerDem = lazy(() => import('./content/interactive/HvaSomSkillerDem').then(m => ({ default: m.HvaSomSkillerDem })));
const TreReglerOgFemTing = lazy(() => import('./content/interactive/TreReglerOgFemTing').then(m => ({ default: m.TreReglerOgFemTing })));
const SeksDagersVerket = lazy(() => import('./content/interactive/SeksDagersVerket').then(m => ({ default: m.SeksDagersVerket })));
const HvaSkjerMedBrodet = lazy(() => import('./content/interactive/HvaSkjerMedBrodet').then(m => ({ default: m.HvaSkjerMedBrodet })));
const ToStoreBrudd = lazy(() => import('./content/interactive/ToStoreBrudd').then(m => ({ default: m.ToStoreBrudd })));
const AvgjorelsenSomAapnetDoren = lazy(() => import('./content/interactive/AvgjorelsenSomAapnetDoren').then(m => ({ default: m.AvgjorelsenSomAapnetDoren })));
const SkapelsesVeven = lazy(() => import('./content/interactive/SkapelsesVeven').then(m => ({ default: m.SkapelsesVeven })));
const BliOgDetBle = lazy(() => import('./content/interactive/BliOgDetBle').then(m => ({ default: m.BliOgDetBle })));
const BonneKompasset = lazy(() => import('./content/interactive/BonneKompasset').then(m => ({ default: m.BonneKompasset })));
const LivetsTrapp = lazy(() => import('./content/interactive/LivetsTrapp').then(m => ({ default: m.LivetsTrapp })));
const TerskelVerkstedet = lazy(() => import('./content/interactive/TerskelVerkstedet').then(m => ({ default: m.TerskelVerkstedet })));
const EtterlivsKartet = lazy(() => import('./content/interactive/EtterlivsKartet').then(m => ({ default: m.EtterlivsKartet })));
const FrelsensStige = lazy(() => import('./content/interactive/FrelsensStige').then(m => ({ default: m.FrelsensStige })));
const Plottmaskinen = lazy(() => import('./content/interactive/Plottmaskinen').then(m => ({ default: m.Plottmaskinen })));
const TekstensReise = lazy(() => import('./content/interactive/TekstensReise').then(m => ({ default: m.TekstensReise })));
const StemmeneFraFortiden = lazy(() => import('./content/interactive/StemmeneFraFortiden').then(m => ({ default: m.StemmeneFraFortiden })));
const GyllenRegelVeven = lazy(() => import('./content/interactive/GyllenRegelVeven').then(m => ({ default: m.GyllenRegelVeven })));
const HelligKalender = lazy(() => import('./content/interactive/HelligKalender').then(m => ({ default: m.HelligKalender })));
const MatbordetsRegler = lazy(() => import('./content/interactive/MatbordetsRegler').then(m => ({ default: m.MatbordetsRegler })));
const RommetsGrammatikk = lazy(() => import('./content/interactive/RommetsGrammatikk').then(m => ({ default: m.RommetsGrammatikk })));
const SymbolLeksikon = lazy(() => import('./content/interactive/SymbolLeksikon').then(m => ({ default: m.SymbolLeksikon })));
const TeodiseVerkstedet = lazy(() => import('./content/interactive/TeodiseVerkstedet').then(m => ({ default: m.TeodiseVerkstedet })));
const GudsbildeAksen = lazy(() => import('./content/interactive/GudsbildeAksen').then(m => ({ default: m.GudsbildeAksen })));
const DagenSomBonn = lazy(() => import('./content/interactive/DagenSomBonn').then(m => ({ default: m.DagenSomBonn })));
const MaatBalansen = lazy(() => import('./content/interactive/MaatBalansen').then(m => ({ default: m.MaatBalansen })));
const ToFlomfortellinger = lazy(() => import('./content/interactive/ToFlomfortellinger').then(m => ({ default: m.ToFlomfortellinger })));
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
const VetorettSimulator = lazy(() => import('./content/interactive/VetorettSimulator').then(m => ({ default: m.VetorettSimulator })));
const JoggeskoensReise = lazy(() => import('./content/interactive/JoggeskoensReise').then(m => ({ default: m.JoggeskoensReise })));
const EuropasDilemma = lazy(() => import('./content/interactive/EuropasDilemma').then(m => ({ default: m.EuropasDilemma })));
const MerkelappMaskinen = lazy(() => import('./content/interactive/MerkelappMaskinen').then(m => ({ default: m.MerkelappMaskinen })));
const MobilensVerdenskart = lazy(() => import('./content/interactive/MobilensVerdenskart').then(m => ({ default: m.MobilensVerdenskart })));
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
const Sidevalget1857 = lazy(() => import('./content/interactive/Sidevalget1857').then(m => ({ default: m.Sidevalget1857 })));
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
const Bevishullet = lazy(() => import('./content/interactive/Bevishullet').then(m => ({ default: m.Bevishullet })));
const Polarvalget = lazy(() => import('./content/interactive/Polarvalget').then(m => ({ default: m.Polarvalget })));
const Kjedereaksjonen = lazy(() => import('./content/interactive/Kjedereaksjonen').then(m => ({ default: m.Kjedereaksjonen })));
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
const RevolusjonsOppskriften = lazy(() => import('./content/interactive/RevolusjonsOppskriften').then(m => ({ default: m.RevolusjonsOppskriften })));
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
const DialektDetektiv = lazy(() => import('./content/interactive/DialektDetektiv').then(m => ({ default: m.DialektDetektiv })));
const SosiolektSkifteren = lazy(() => import('./content/interactive/SosiolektSkifteren').then(m => ({ default: m.SosiolektSkifteren })));
const EtnolektDekoder = lazy(() => import('./content/interactive/EtnolektDekoder').then(m => ({ default: m.EtnolektDekoder })));
const IdiolektFingeravtrykk = lazy(() => import('./content/interactive/IdiolektFingeravtrykk').then(m => ({ default: m.IdiolektFingeravtrykk })));
const BergensTokjonn = lazy(() => import('./content/interactive/BergensTokjonn').then(m => ({ default: m.BergensTokjonn })));
const BergensSosiolektPult = lazy(() => import('./content/interactive/BergensSosiolektPult').then(m => ({ default: m.BergensSosiolektPult })));
const SpredningsKart = lazy(() => import('./content/interactive/SpredningsKart').then(m => ({ default: m.SpredningsKart })));
const IsoglossKartet = lazy(() => import('./content/interactive/IsoglossKartet').then(m => ({ default: m.IsoglossKartet })));
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
const IslamsFemSoyler = lazy(() => import('./content/interactive/IslamsFemSoyler').then(m => ({ default: m.IslamsFemSoyler })));
const BritPilarer = lazy(() => import('./content/interactive/BritPilarer').then(m => ({ default: m.BritPilarer })));
const DharmahjuletUtforsker = lazy(() => import('./content/interactive/DharmahjuletUtforsker').then(m => ({ default: m.DharmahjuletUtforsker })));
const AttedeltVeiDilemma = lazy(() => import('./content/interactive/AttedeltVeiDilemma').then(m => ({ default: m.AttedeltVeiDilemma })));
const MokshaVeiene = lazy(() => import('./content/interactive/MokshaVeiene').then(m => ({ default: m.MokshaVeiene })));
const DemokratietFaller = lazy(() => import('./content/interactive/DemokratietFaller').then(m => ({ default: m.DemokratietFaller })));
const VeienTilFrihet = lazy(() => import('./content/interactive/VeienTilFrihet').then(m => ({ default: m.VeienTilFrihet })));
const MonokulturAkeren = lazy(() => import('./content/interactive/MonokulturAkeren').then(m => ({ default: m.MonokulturAkeren })));

// Mikrospill: lett, embeddbart spill inline i artikkel. gameId-prop velger spillet
// fra mikrospill-registeret (src/components/microgames/registry.ts).
const MicroGame = lazy(() => import('./microgames/MicroGameBlock').then(m => ({ default: m.MicroGameBlock })));

// Registeret holder ~200 komponenter med HVER SIN props-type, og kallstedene
// sender inn props fra artikkel-JSON. Det finnes ingen felles props-type som
// både er sann og brukbar her: React sine egne typer bruker ComponentType<any>
// til nøyaktig dette (se signaturen til React.lazy). Dette er derfor det ene
// stedet i kodebasen der `any` er riktig svar og ikke utsatt opprydding.
// Props valideres av hver enkelt komponent.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentRegistry: Record<string, React.ComponentType<any>> = {
    // Core
    SvalbardTraktatTest,
    TerraNulliusDommen,
    Gaatekart,
    TrojaMyteEllerFunn,
    SporTavlen,
    VeienTilFrihet,
    NasjonsbyggerLab,
    ViFolelsen,
    MytenesVerksted,
    Revolusjonsbolgen1848,
    GovernmentExplorer,
    HistoryLongLines,
    HelleristningTyder,
    RidderMotLangbue,
    RoadToRevolution,
    MaktfordelingSjekk,
    Legitimitetsvekten,
    MaktensKilde,
    KollapsDiagnose,
    HandelsnettKollaps,
    RessurskollapsSimulator,
    TorkensVippepunkt,
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
    MinoritetsMatrisen,
    KalmarMaktbalanse,
    WienerkongressenForhandling,
    OlympiskFred,
    ParallelleSivilisasjoner,
    Quiz,
    Oppgaver,
    KrigsseilernesRegnskap,
    AmerikaBevisSortering,
    GrenseTegner,
    StilleKilder,
    TrelastVerdikjede,
    SolvetsReise,
    Nordnesnatten,
    KunnskapsbroAndalus,
    EICSimulation,
    FactBox,
    TimelineComponent,
    PlotGraph,
    QuoteBlock,
    Kildeliste,
    DhammaEllerSverd,
    Kildekjeden,
    HaraldsRike,
    LegendensVekst,
    Skyldvekten,
    Fallkurven,
    Kornveien,
    Diagnosebrettet,
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
    VetorettSimulator,
    JoggeskoensReise,
    EuropasDilemma,
    MerkelappMaskinen,
    MobilensVerdenskart,
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
    MaalmerkeMatcher,
    SymbolMatcher,
    SymbolSporet,
    AthenSparta,
    PeloponnesStrategi,
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
    TraktatFellen,
    TroensRotter,
    VeilOfIgnorance,
    DyreetikkBrillene,
    KiAnsvarskjeden,
    MaktensFristelse,
    GoldenMeanSlider,
    SikhNavneseremoni,
    SkapelseVedOrd,
    UniversetsAandedrag,
    SporsmaalUtenSvar,
    SkapelseUtenBegynnelse,
    OrganisertAvMaterie,
    DeSeksPeriodene,
    FoerLysetFantes,
    DenTommeRammen,
    NavnetSomIkkeSies,
    TreenighetensKnute,
    TawhidEllerShirk,
    SpeiletOgSolen,
    GuddommenModellen,
    HvemErStorst,
    EnEllerMillioner,
    GudeneSomIkkeFrelser,
    MinjanRommet,
    FadervaarLinjeForLinje,
    SolaSomKlokke,
    TreBonnerEttValg,
    BonnSomSamtale,
    AdressenPaaBonnen,
    PujaBrettet,
    HvemSnakkerDuTil,
    PliktenSomFlytterSeg,
    NaarSkalDuDoepes,
    FoersteOgSisteOrd,
    SamtykkePorten,
    Slektskjeden,
    ValgetDuTarSelv,
    SamskaraStigen,
    RitenSomIkkeFinnes,
    DenneVerdenFoerst,
    Signeringsbordet,
    VektskaalenPaaDommensDag,
    Fosterkammeret,
    TreGraderAvHerlighet,
    HundreOgFortiFireTusen,
    SamsaraHjulet,
    FlammenSomSlukner,
    DraapenIHavet,
    IngenStifterMenEnPakt,
    HanStiftetIngenReligion,
    ProfetIkkeGud,
    ToSomHengerSammen,
    VitnenesUnderskrifter,
    GrunnleggerenSomIkkeVil,
    LetingenEtterEnStifter,
    MennesketSomVaaknet,
    TiGuruerOgEnBok,
    SidenSomVokser,
    HvaKomMedIBoka,
    OversettelsenSomIkkeErKoranen,
    SkrevetAvHamSelv,
    KanonenSomIkkeErLukket,
    NavnetSattInnIgjen,
    HoertEllerHusket,
    TreKurverOgFlereKanoner,
    BokaSomLeggerSeg,
    DetAlleErEnigeOm,
    FemHandlingerIkkeFemTanker,
    TreEnheter,
    GjenopprettelsensPaastand,
    HvaSomSkillerDem,
    TreReglerOgFemTing,
    SeksDagersVerket,
    HvaSkjerMedBrodet,
    ToStoreBrudd,
    AvgjorelsenSomAapnetDoren,
    SkapelsesVeven,
    BliOgDetBle,
    BonneKompasset,
    LivetsTrapp,
    TerskelVerkstedet,
    EtterlivsKartet,
    FrelsensStige,
    Plottmaskinen,
    TekstensReise,
    StemmeneFraFortiden,
    GyllenRegelVeven,
    HelligKalender,
    MatbordetsRegler,
    RommetsGrammatikk,
    SymbolLeksikon,
    TeodiseVerkstedet,
    GudsbildeAksen,
    DagenSomBonn,
    MaatBalansen,
    ToFlomfortellinger,
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
    Sidevalget1857,
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
    Bevishullet,
    Polarvalget,
    Kjedereaksjonen,
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
    RevolusjonsOppskriften,
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
    DialektDetektiv,
    SosiolektSkifteren,
    EtnolektDekoder,
    IdiolektFingeravtrykk,
    BergensTokjonn,
    BergensSosiolektPult,
    SpredningsKart,
    IsoglossKartet,
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
    Informasjonsgapet: lazy(() => import('./content/interactive/Informasjonsgapet').then(m => ({ default: m.Informasjonsgapet }))),
    Seiersinnskriften: lazy(() => import('./content/interactive/Seiersinnskriften').then(m => ({ default: m.Seiersinnskriften }))),
    StormogulensValg: lazy(() => import('./content/interactive/StormogulensValg').then(m => ({ default: m.StormogulensValg }))),
    NullOppdagelsen: lazy(() => import('./content/interactive/NullOppdagelsen').then(m => ({ default: m.NullOppdagelsen }))),
    Oljepengevalget: lazy(() => import('./content/interactive/Oljepengevalget').then(m => ({ default: m.Oljepengevalget }))),
    KategoriMaskinen: lazy(() => import('./content/interactive/KategoriMaskinen').then(m => ({ default: m.KategoriMaskinen }))),

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
    Byggegaaten: lazy(() => import('./content/interactive/Byggegaaten').then(m => ({ default: m.Byggegaaten }))),
    AntikytheraDial: lazy(() => import('./content/interactive/AntikytheraDial').then(m => ({ default: m.AntikytheraDial }))),
    ForklaringsVekt: lazy(() => import('./content/interactive/ForklaringsVekt').then(m => ({ default: m.ForklaringsVekt }))),
    EarhartSpor: lazy(() => import('./content/interactive/EarhartSpor').then(m => ({ default: m.EarhartSpor }))),

    // Handel og infrastruktur
    GlobalProductionDots: lazy(() => import('./content/interactive/infrastruktur/GlobalProductionDots').then(m => ({ default: m.GlobalProductionDots }))),
    PipelineScenario: lazy(() => import('./content/interactive/infrastruktur/PipelineScenario').then(m => ({ default: m.PipelineScenario }))),
    CableBreakSim: lazy(() => import('./content/interactive/infrastruktur/CableBreakSim').then(m => ({ default: m.CableBreakSim }))),
    ShipmentTracker: lazy(() => import('./content/interactive/infrastruktur/ShipmentTracker').then(m => ({ default: m.ShipmentTracker }))),
    CascadeFailureSim: lazy(() => import('./content/interactive/infrastruktur/CascadeFailureSim').then(m => ({ default: m.CascadeFailureSim }))),
    RettighetsLas: lazy(() => import('./content/interactive/RettighetsLas').then(m => ({ default: m.RettighetsLas }))),
    KongensMaktBinding,
    MalstangaTest,
    MapCarousel,
    KontekstKompasset,
    IdentitetsVeven,
    EngasjementsMaskinen,
    ArgumentBroen,
    KristendomsGrenerUtforsker,
    IslamsFemSoyler,
    BritPilarer,
    DharmahjuletUtforsker,
    AttedeltVeiDilemma,
    MokshaVeiene,
    DemokratietFaller,
    MonokulturAkeren,
};

export const getComponent = (name: string) => {
    return componentRegistry[name] || null;
};
