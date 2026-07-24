import { lazy } from 'react';
import type { MicroGameEntry } from './types';

// Registry over alle mikro-spill. Hvert spill lazy-lastes — ingen tunge
// avhengigheter belaster bundle før eleven faktisk åpner et spill.
// Three.js-avhengige spill (3D) blir kun lastet når eleven åpner dem.

const GladiusDuel = lazy(() => import('./GladiusDuel'));
const Laasesting3D = lazy(() => import('./Laasesting3D'));
const Colosseum3D = lazy(() => import('./Colosseum3D'));
const TheodosianWalls3D = lazy(() => import('./TheodosianWalls3D'));
const Hamskiftet3D = lazy(() => import('./Hamskiftet3D'));
const OsloSosiolekt3D = lazy(() => import('./OsloSosiolekt3D'));
const MultietnolektGata3D = lazy(() => import('./MultietnolektGata3D'));
const MeijiByen3D = lazy(() => import('./MeijiByen3D'));
const VikingShip3D = lazy(() => import('./VikingShip3D'));
const Vesterled3D = lazy(() => import('./Vesterled3D'));
const DelawareKrysning3D = lazy(() => import('./DelawareKrysning3D'));
const LeonardoFlygemaskin3D = lazy(() => import('./LeonardoFlygemaskin3D'));
const DeSjuHoydene3D = lazy(() => import('./DeSjuHoydene3D'));
const SymbolerPaaTaket3D = lazy(() => import('./SymbolerPaaTaket3D'));
const IngenmanslandMG = lazy(() => import('./IngenmanslandMG'));
const Stalmonsteret3D = lazy(() => import('./Stalmonsteret3D'));
const TidensFormer3D = lazy(() => import('./TidensFormer3D'));
const Spredning3D = lazy(() => import('./Spredning3D'));
const UtvandringenFraAfrika3D = lazy(() => import('./UtvandringenFraAfrika3D'));
const HimmelModellen3D = lazy(() => import('./HimmelModellen3D'));
const DampmaskinHjerte3D = lazy(() => import('./DampmaskinHjerte3D'));
const Falanksen3D = lazy(() => import('./Falanksen3D'));
const LangeMurene3D = lazy(() => import('./LangeMurene3D'));
const OlympiaDiskos3D = lazy(() => import('./OlympiaDiskos3D'));
const Vannmolla3D = lazy(() => import('./Vannmolla3D'));
const Kjoleskapet3D = lazy(() => import('./Kjoleskapet3D'));
const Radarvakten3D = lazy(() => import('./Radarvakten3D'));
const Konklusjonsbroen3D = lazy(() => import('./Konklusjonsbroen3D'));
const MonumentTorget3D = lazy(() => import('./MonumentTorget3D'));
const Teknologibolgen3D = lazy(() => import('./Teknologibolgen3D'));
const Nyheitsbobla3D = lazy(() => import('./Nyheitsbobla3D'));
const Konsekvensbolgen3D = lazy(() => import('./Konsekvensbolgen3D'));
const Levekaarsgapet3D = lazy(() => import('./Levekaarsgapet3D'));
const Streikefronten3D = lazy(() => import('./Streikefronten3D'));
const Perspektivkjernen3D = lazy(() => import('./Perspektivkjernen3D'));
const Datasporet3D = lazy(() => import('./Datasporet3D'));
const AnsikteneIMengden3D = lazy(() => import('./AnsikteneIMengden3D'));
const Grenselinja3D = lazy(() => import('./Grenselinja3D'));
const Maktbalansen3D = lazy(() => import('./Maktbalansen3D'));
const TaushetsspiralenTorg3D = lazy(() => import('./TaushetsspiralenTorg3D'));
const Spillereglene3D = lazy(() => import('./Spillereglene3D'));
const Spleiselaget3D = lazy(() => import('./Spleiselaget3D'));
const Maktskiftet3D = lazy(() => import('./Maktskiftet3D'));
const Argumentbroen3D = lazy(() => import('./Argumentbroen3D'));
const GobekliTepe3D = lazy(() => import('./GobekliTepe3D'));
const GudenesVerden3D = lazy(() => import('./GudenesVerden3D'));
const GreskTeater3D = lazy(() => import('./GreskTeater3D'));
const GutenbergPresse3D = lazy(() => import('./GutenbergPresse3D'));
const DemokratiLysene3D = lazy(() => import('./DemokratiLysene3D'));
const Testudo3D = lazy(() => import('./Testudo3D'));
const Chinampabyen3D = lazy(() => import('./Chinampabyen3D'));
const Kanalbyggeren3D = lazy(() => import('./Kanalbyggeren3D'));
const SamiskGjenreising3D = lazy(() => import('./SamiskGjenreising3D'));
const ForeneUnionen3D = lazy(() => import('./ForeneUnionen3D'));
const SmiDetTyskeRiket3D = lazy(() => import('./SmiDetTyskeRiket3D'));
const FolketSamles3D = lazy(() => import('./FolketSamles3D'));
const HagiaSofia3D = lazy(() => import('./HagiaSofia3D'));
const Pompeii3D = lazy(() => import('./Pompeii3D'));
const PakkAmerikakofferten3D = lazy(() => import('./PakkAmerikakofferten3D'));
const Pyramidebyggeren3D = lazy(() => import('./Pyramidebyggeren3D'));
const Bronseruta3D = lazy(() => import('./Bronseruta3D'));
const KalmarKronene3D = lazy(() => import('./KalmarKronene3D'));
const Pestrute3D = lazy(() => import('./Pestrute3D'));
const KristendomSpredning3D = lazy(() => import('./KristendomSpredning3D'));
const TikkunOlam3D = lazy(() => import('./TikkunOlam3D'));
const SamsaraSyklusen3D = lazy(() => import('./SamsaraSyklusen3D'));
const MokshaVeien3D = lazy(() => import('./MokshaVeien3D'));
const MarsjenMotRoma3D = lazy(() => import('./MarsjenMotRoma3D'));
const VektenIWien3D = lazy(() => import('./VektenIWien3D'));
const Vesterleden3D = lazy(() => import('./Vesterleden3D'));
const Gangen3D = lazy(() => import('./Gangen3D'));
const EuropaBroen3D = lazy(() => import('./EuropaBroen3D'));
const SkjulteSymboler3D = lazy(() => import('./SkjulteSymboler3D'));
const FestensLys3D = lazy(() => import('./FestensLys3D'));
const BroenTilFortiden3D = lazy(() => import('./BroenTilFortiden3D'));
const MatreglerBord3D = lazy(() => import('./MatreglerBord3D'));
const Rikssamlingen3D = lazy(() => import('./Rikssamlingen3D'));
const RismarkOgMakt3D = lazy(() => import('./RismarkOgMakt3D'));
const Berlinmuren3D = lazy(() => import('./Berlinmuren3D'));
const FluktenOverMuren3D = lazy(() => import('./FluktenOverMuren3D'));
const Falltaarnet3D = lazy(() => import('./Falltaarnet3D'));
const JapanMirakelBy3D = lazy(() => import('./JapanMirakelBy3D'));
const StormingenAvBastillen3D = lazy(() => import('./StormingenAvBastillen3D'));
const Teselskapet3D = lazy(() => import('./Teselskapet3D'));
const TempeletsRenselse3D = lazy(() => import('./TempeletsRenselse3D'));
const JapanskImperium3D = lazy(() => import('./JapanskImperium3D'));
const SaturnVMane3D = lazy(() => import('./SaturnVMane3D'));
const MoralskTomrom3D = lazy(() => import('./MoralskTomrom3D'));
const Allmennviljen3D = lazy(() => import('./Allmennviljen3D'));
const Sjoimperiet3D = lazy(() => import('./Sjoimperiet3D'));
const AttedeltVei3D = lazy(() => import('./AttedeltVei3D'));
const RentVannRorene3D = lazy(() => import('./RentVannRorene3D'));
const KaravanenOverSahara3D = lazy(() => import('./KaravanenOverSahara3D'));
const RiketLangsNiger3D = lazy(() => import('./RiketLangsNiger3D'));
const TvillingbyenKoumbiSaleh3D = lazy(() => import('./TvillingbyenKoumbiSaleh3D'));
const Karantenelinja3D = lazy(() => import('./Karantenelinja3D'));
const Produksjonsoppskriften3D = lazy(() => import('./Produksjonsoppskriften3D'));
const Rutebyen3D = lazy(() => import('./Rutebyen3D'));
const Trekanthandelen3D = lazy(() => import('./Trekanthandelen3D'));
const StorZimbabweMur3D = lazy(() => import('./StorZimbabweMur3D'));
const Stromveien3D = lazy(() => import('./Stromveien3D'));
const SmittenIByen3D = lazy(() => import('./SmittenIByen3D'));
const Standardklokka3D = lazy(() => import('./Standardklokka3D'));
const ArkimedesKronen3D = lazy(() => import('./ArkimedesKronen3D'));
const Fimbulvinteren3D = lazy(() => import('./Fimbulvinteren3D'));
const DorerSomApnet3D = lazy(() => import('./DorerSomApnet3D'));
const ForseglingenRunnymede3D = lazy(() => import('./ForseglingenRunnymede3D'));
const Bergkunsten3D = lazy(() => import('./Bergkunsten3D'));
const Hundreaarskrigen3D = lazy(() => import('./Hundreaarskrigen3D'));
const Stenderpyramiden3D = lazy(() => import('./Stenderpyramiden3D'));
const FingertFlukt3D = lazy(() => import('./FingertFlukt3D'));
const Personalunion3D = lazy(() => import('./Personalunion3D'));
const Leiegaarden3D = lazy(() => import('./Leiegaarden3D'));
const RepublikkensSoyler3D = lazy(() => import('./RepublikkensSoyler3D'));
const Lynkrigen3D = lazy(() => import('./Lynkrigen3D'));
const KongestatuenFaller3D = lazy(() => import('./KongestatuenFaller3D'));
const PersepolisGaver3D = lazy(() => import('./PersepolisGaver3D'));
const Marshallhjelpen3D = lazy(() => import('./Marshallhjelpen3D'));
const Gasskranen3D = lazy(() => import('./Gasskranen3D'));
const Gjeldshavna3D = lazy(() => import('./Gjeldshavna3D'));
const ImperiumSoyler = lazy(() => import('./ImperiumSoyler'));
const HimmelensMandat3D = lazy(() => import('./HimmelensMandat3D'));
const VendMotMekka3D = lazy(() => import('./VendMotMekka3D'));
const Trelastruta3D = lazy(() => import('./Trelastruta3D'));
const Paaskeoya3D = lazy(() => import('./Paaskeoya3D'));
const MayaKollaps3D = lazy(() => import('./MayaKollaps3D'));
const Reconquista3D = lazy(() => import('./Reconquista3D'));
const DenMoralskeSirkelen3D = lazy(() => import('./DenMoralskeSirkelen3D'));
const Skjevhetsspeilet3D = lazy(() => import('./Skjevhetsspeilet3D'));
const ByggKongsberg3D = lazy(() => import('./ByggKongsberg3D'));
const VeienTilVikingtid3D = lazy(() => import('./VeienTilVikingtid3D'));
const Hansakoggen3D = lazy(() => import('./Hansakoggen3D'));
const Fimreite3D = lazy(() => import('./Fimreite3D'));
const Barrikaden1848 = lazy(() => import('./Barrikaden1848'));
const BakSloret3D = lazy(() => import('./BakSloret3D'));
const GreskOpproret3D = lazy(() => import('./GreskOpproret3D'));
const KapplopetOmAfrika3D = lazy(() => import('./KapplopetOmAfrika3D'));
const Bevisvekten3D = lazy(() => import('./Bevisvekten3D'));
const Antikythera3D = lazy(() => import('./Antikythera3D'));
const DenLangeVinteren3D = lazy(() => import('./DenLangeVinteren3D'));
const TrojaUtgravning3D = lazy(() => import('./TrojaUtgravning3D'));
const MaalmerkeKartet3D = lazy(() => import('./MaalmerkeKartet3D'));
const EarhartStillehavet3D = lazy(() => import('./EarhartStillehavet3D'));
const RoanokeSporet3D = lazy(() => import('./RoanokeSporet3D'));

export const MICRO_GAMES: Record<string, MicroGameEntry & { Component: React.LazyExoticComponent<React.ComponentType<unknown>> }> = {
    'roanoke-sporet-3d': {
        id: 'roanoke-sporet-3d',
        title: 'Sporet etter kolonien',
        description:
            'Du er John White, tilbake ved kolonien Roanoke i 1590 - og alle er borte. Let deg gjennom den tause, tåkelagte plassen: palisadestolpen med ordet CROATOAN, treet, de tomme husene og jorda uten graver. For hvert spor du finner, letter tåken litt. Når alt er undersøkt, må du velge hvilket spor som er sterkest å følge. Lyspæren: når en gåte ikke har fasit, følger vi det sterkeste sporet uten å late som vi vet mer enn vi gjør.',
        estimatedSeconds: 150,
        loader: () => import('./RoanokeSporet3D'),
        Component: RoanokeSporet3D as never,
    },
    'earhart-stillehavet-3d': {
        id: 'earhart-stillehavet-3d',
        title: 'Finn Howland',
        description:
            'Amelia Earhart skulle finne Howland - en øy bare 2,4 km lang - etter 4000 km over åpent hav. Juster kursen med spaken og se hvor mange kilometer du bommer for hver lille grad du er feil. Lyspæren: en feil på bare én grad bommer med rundt 70 km, og øya er en prikk i havet. Uten radiopeiling var oppgaven nesten umulig, og derfor er forsvinningen fortsatt en gåte.',
        estimatedSeconds: 90,
        loader: () => import('./EarhartStillehavet3D'),
        Component: EarhartStillehavet3D as never,
    },
    'malmerke-kartet-3d': {
        id: 'malmerke-kartet-3d',
        title: 'Målmerke-kartet',
        description:
            'Norge ligger som et kart foran deg, delt i fire landsdeler. For hvert målmerke skal du klikke landsdelen der trekket er mest kjent: tjukk l i øst, apokope i Trøndelag, palatalisering i nord og pronomenet «eg» i vest. Lyspæren: målmerkene tegner et kart. Når du kjenner de vanligste trekkene, kan du høre hvilken del av landet en dialekt kommer fra.',
        estimatedSeconds: 110,
        loader: () => import('./MaalmerkeKartet3D'),
        Component: MaalmerkeKartet3D as never,
    },
    'troja-utgravning-3d': {
        id: 'troja-utgravning-3d',
        title: 'Grav ut Troja',
        description:
            'Grav ut haugen Hisarlik lag for lag, akkurat slik arkeologene gjorde. Byen Troja er ikke ett sted, men mange byer stablet oppå hverandre. Fjern det ene jordlaget etter det andre og grav deg forsiktig ned til krigslaget Troja VIIa, der brannspor og pilspisser røper at byen ble ødelagt i kamp rundt 1180 fvt. Lyspæren: et sagn kan peke arkeologene mot et ekte sted, men bare tålmodig graving lag for lag skiller den unge byen fra den gamle, og Schliemann gravde i 1873 altfor fort rett forbi nettopp krigslaget.',
        estimatedSeconds: 140,
        loader: () => import('./TrojaUtgravning3D'),
        Component: TrojaUtgravning3D as never,
    },
    'den-lange-vinteren-3d': {
        id: 'den-lange-vinteren-3d',
        title: 'Den lange vinteren',
        description:
            'Dra i årstallet fra 985 til 1450 og se den norrøne gården på Grønland sakte tømmes: beitet blir hvitt, sauene blir færre, det siste skipet fra Norge blir borte, og til slutt ligger gården tom. Lyspæren: slutten for nordboerne kom ikke som ett brått slag, men som en lang vinter der kaldere klima, tapt handel og isolasjon virket sammen over hundre år.',
        estimatedSeconds: 90,
        loader: () => import('./DenLangeVinteren3D'),
        Component: DenLangeVinteren3D as never,
    },
    'antikythera-3d': {
        id: 'antikythera-3d',
        title: 'Antikythera-mekanismen',
        description:
            'Vri sveiva på den 2000 år gamle bronsemaskinen og spå en solformørkelse. Ett tak på sveiva setter alle tannhjulene i gang: solviseren (gull) kryper sakte rundt mens måneviseren (sølv) spinner 13 ganger så fort, fordi hjulene har ulik størrelse. Vri fram til begge viserne møtes i formørkelses-porten øverst - da har du spådd en solformørkelse. Lyspæren: fordi tannhjulene fikk sol og måne til å bevege seg i ulik fart, kunne den greske maskinen regne ut himmelen og spå formørkelser år fram i tid.',
        estimatedSeconds: 130,
        loader: () => import('./Antikythera3D'),
        Component: Antikythera3D as never,
    },
    bevisvekten: {
        id: 'bevisvekten',
        title: 'Bevisvekten',
        description:
            'Du får én påstand - «vikingene nådde Amerika ca. 500 år før Columbus» - og drar bevis-brikker ut på en skålvekt. Bevis som styrker påstanden legges til høyre, bevis som sår tvil til venstre. Vekta tipper etter samlet vekt, ikke antall: en utgravd vikinglandsby veier tungt, en saga skrevet 200 år senere veier lett. En sikkerhetsmåler viser at påstanden lander tungt på styrker-siden, men aldri på 100 %. Lyspæren: historikere veier bevis mot hverandre i stedet for å telle dem, og sikkerhet er gradert - «svært sannsynlig», ikke «helt sikkert».',
        estimatedSeconds: 120,
        loader: () => import('./Bevisvekten3D'),
        Component: Bevisvekten3D as never,
    },
    'kapplopet-om-afrika-3d': {
        id: 'kapplopet-om-afrika-3d',
        title: 'Kappløpet om Afrika',
        description:
            'Du er en europeisk diplomat under kappløpet om Afrika. Klikk område etter område på kartet og plant flagg for stormaktene, til hele kontinentet er et lappeteppe av europeiske farger. Når alt er tatt, faller de rette grensestrekene på plass - rett gjennom landsbyene. Lyspæren: Europa tok hele Afrika bit for bit og tegnet grensene uten å spørre dem som bodde der.',
        estimatedSeconds: 110,
        loader: () => import('./KapplopetOmAfrika3D'),
        Component: KapplopetOmAfrika3D as never,
    },
    'gresk-oppror-3d': {
        id: 'gresk-oppror-3d',
        title: 'Det greske opprøret sprer seg',
        description:
            'Tenn varselbålene på greske fjelltopper og se frigjøringskrigen bre seg fjell for fjell. Opprøret starter på Peloponnes i 1821 og kan bare spre seg til nabotopper som alt brenner — ut til øyene og opp på fastlandet, mens landsbyene lyser opp. Lyspæren: den greske frigjøringskrigen var ingen enkelt slagmark. Et helt folk reiste seg område for område helt til hele landet sto i brann og osmanene mistet kontrollen.',
        estimatedSeconds: 120,
        loader: () => import('./GreskOpproret3D'),
        Component: GreskOpproret3D as never,
    },
    'barrikaden-1848': {
        id: 'barrikaden-1848',
        title: 'Barrikaden i Paris',
        description:
            'Paris, februar 1848. En trang gate med hus på begge sider. Klikk de tre lysende punktene i rekkefølge: riv opp brosteinen så den løftes fra gata og stables til en mur, velt hestevogna og møblene så barrikaden vokser, og reis til slutt trikoloren på toppen mens folket samler seg bak. Lyspæren: revolusjonen i 1848 ble ikke ledet fra et slott, men bygd med hendene av vanlige byfolk som rev opp gata si og reiste flagget over en haug med brostein og møbler.',
        estimatedSeconds: 120,
        loader: () => import('./Barrikaden1848'),
        Component: Barrikaden1848 as never,
    },
    'bak-sloret-3d': {
        id: 'bak-sloret-3d',
        title: 'Bak uvitenhetens slør',
        description:
            'En liten landsby med tre livsstasjoner står bak et frostet slør. Klikk en steintavle for å velge samfunnsregelen - husene vokser og krymper etter hvor mye de ulike gruppene får. Så trekker du sløret til side, og et søkelys faller på en helt tilfeldig innbygger: dette ble deg. Lyspæren: bak sløret vet du ikke hvem du blir, så det tryggeste er å velge reglene der selv den nederste plassen er best mulig - akkurat slik John Rawls tenkte.',
        estimatedSeconds: 120,
        loader: () => import('./BakSloret3D'),
        Component: BakSloret3D as never,
    },
    'folket-samles-3d': {
        id: 'folket-samles-3d',
        title: 'Folket samles',
        description:
            'En plass full av mennesker som står spredt og vender hver sin vei. Reis tre felles symboler i rekkefølge — heis flagget, syng nasjonalsangen, fortell den felles historien — og se folket snu seg mot midten, gå tettere sammen og få samme farge. Lyspæren: en nasjon er ikke naturlig eller evig. Følelsen av å høre sammen blir bygd av felles språk, symboler og fortellinger. Det er dette vi kaller nasjonalisme.',
        estimatedSeconds: 130,
        loader: () => import('./FolketSamles3D'),
        Component: FolketSamles3D as never,
    },
    'fimreite-1184': {
        id: 'fimreite-1184',
        title: 'Slaget ved Fimreite',
        description:
            'Sognefjorden, 15. juni 1184. Kong Magnus Erlingsson har lenket skipene sine sammen på rekke for å stå stødig i kamp. Dra birkebeiner-skipet ditt ut til flåten, og klikk kongsskipet Mariasuden for å gå til angrep. Se hvordan lenken som skulle gjøre flåten sterk, drar naboskipene ned i dypet sammen med den. Lyspæren: det som skal gjøre deg trygg, kan bli fellen som senker deg.',
        estimatedSeconds: 90,
        loader: () => import('./Fimreite3D'),
        Component: Fimreite3D as never,
    },
    'hansakoggen-3d': {
        id: 'hansakoggen-3d',
        title: 'Hansakoggen i Bergen',
        description:
            'Bryggen i Bergen på 1400-tallet. Last tørrfisk (tørket torsk fra Nord-Norge) om bord i den brede hansakoggen ved kaia, klikk seilet og send skipet til Europa. Det kommer tilbake fullt av korn, mel og sølv - men når du skal dra sølvkista i land, godtar bare Kontoret (de tyske hansakjøpmennene) den. Prøver du kongen, får du beskjed om at all handel gikk gjennom Kontoret. Til slutt viser to sølvhauger at storparten ble kjøpmennenes, mens kongen bare fikk litt toll. Lyspæren: Hansaen kontrollerte handelen i Bergen, så varene og fortjenesten gikk gjennom kjøpmennene, ikke kongen.',
        estimatedSeconds: 150,
        loader: () => import('./Hansakoggen3D'),
        Component: Hansakoggen3D as never,
    },
    'veien-til-vikingtid-3d': {
        id: 'veien-til-vikingtid-3d',
        title: 'Veien til vikingtiden',
        description:
            'Forvandle den norske kysten fra sammenbrudd til vikingtid i 3D. Etter katastrofen i 536 ligger gårdene øde og bygdeborgen i ruiner. Velg tre grep i rekkefølge - la folk rydde gårdene på nytt, reis høvdinghallen og handelsplassen, og reis til slutt seilet - og se robåten bli et havgående skip som seiler ut i 793. Lyspæra: vikingtiden braket ikke ut fra ingenting. De stille århundrene bygde grunnlaget - folk, makt og handel kom tilbake, og seilet åpnet havet til slutt.',
        estimatedSeconds: 150,
        loader: () => import('./VeienTilVikingtid3D'),
        Component: VeienTilVikingtid3D as never,
    },
    'bygg-kongsberg-3d': {
        id: 'bygg-kongsberg-3d',
        title: 'Bygg gruvebyen Kongsberg',
        description:
            'Forvandle en tom skogsdal til gruvebyen Kongsberg i 3D. Dra den glødende sølvklumpen ut av fjellet så gruva åpner, og klikk deg gjennom byggingen mens gruvehytter, smeltehytte, myntverk og kirke reiser seg og innbyggertallet klatrer. Lyspæren: sølvet i fjellet skapte en hel by. Uten sølvåren hadde det bare vært skog. Christian IV grunnla Kongsberg i 1624.',
        estimatedSeconds: 140,
        loader: () => import('./ByggKongsberg3D'),
        Component: ByggKongsberg3D as never,
    },
    'moralske-sirkelen-3d': {
        id: 'moralske-sirkelen-3d',
        title: 'Den moralske sirkelen',
        description:
            'Mennesket står i midten, og rundt det ligger en hund, en gris, en fisk, et insekt, en plante og en stein. Dra spaken og blås opp en glødende sirkel over hvem som "teller" moralsk: for hvert vesen sirkelen når, lyser det opp, og klikker du det, ser du hva det kan føle. Dyr som kan lide kommer med, mens planten og steinen faller utenfor. Lyspæren kommer i hendene: grensa for hvem vi skylder noe har flyttet seg utover gjennom historien, og det avgjørende spørsmålet er ikke "kan de tenke?" men "kan de lide?".',
        estimatedSeconds: 150,
        loader: () => import('./DenMoralskeSirkelen3D'),
        Component: DenMoralskeSirkelen3D as never,
    },
    'skjevhetsspeilet-3d': {
        id: 'skjevhetsspeilet-3d',
        title: 'Skjevhets-speilet',
        description:
            'Tren en ansiktsgjenkjennings-KI ved å klikke ansiktstyper inn i treningsdataen, og kjør den så på alle fire typene. Typene du ga den, lyser grønt (gjenkjent); typene du utelot, lyser rødt (bommet). Lyspæren kommer i hendene: en KI kjenner bare igjen det den har sett før, så skjeve treningsdata gir en KI som behandler mennesker skjevt, uten at noen mente det.',
        estimatedSeconds: 150,
        loader: () => import('./Skjevhetsspeilet3D'),
        Component: Skjevhetsspeilet3D as never,
    },
    'reconquista-3d': {
        id: 'reconquista-3d',
        title: 'Reconquista: gjenerobringen av Spania',
        description:
            'Den iberiske halvøya bygd av små ruter. Dra års-spaken fra 711 til 1492 og se en glødende frontlinje krype sørover: land nord for linja blir kristent (gull), land sør for den er muslimsk Al-Andalus (grønt). De fire store byene faller etter tur - Toledo 1085, Córdoba 1236, Sevilla 1248 og til slutt Granada 1492, samme år som Columbus seilte mot Amerika. Lyspæren kommer i hendene: Reconquista tok nesten 800 år og skjedde steg for steg sørover, ikke på én gang.',
        estimatedSeconds: 150,
        loader: () => import('./Reconquista3D'),
        Component: Reconquista3D as never,
    },
    'delaware-1776-3d': {
        id: 'delaware-1776-3d',
        title: 'Kryss Delaware-elven',
        description:
            'Julenatt 1776. Etter måneder med nederlag tar George Washington en desperat sjanse: han ror hele hæren tvers over den frosne Delaware-elven for å overraske fienden i Trenton. Dra hver robåt, fullastet med soldater og med Washington stående i baugen, fra Pennsylvania-bredden gjennom drivisen og over til New Jersey-siden. Når hele hæren er over, stiger grålysningen og angrepet lykkes. Lyspæren kommer i hendene: Washington snudde en tapende krig ikke ved å være forsiktig, men ved å våge det ingen trodde var mulig. Nettopp fordi han kunne være så dristig med makt, ble det så oppsiktsvekkende at han senere valgte å gi den fra seg.',
        estimatedSeconds: 120,
        loader: () => import('./DelawareKrysning3D'),
        Component: DelawareKrysning3D as never,
    },
    'maya-3d': {
        id: 'maya-3d',
        title: 'Mayaenes kollaps: byen og tørken',
        description:
            'En blomstrende maya-by i jungelen: en trappepyramide, et vannmagasin, maisåkrer og hus fulle av folk. Mayabyene i lavlandet hadde ingen elver - de samlet regnvann i store magasin. Dra tørkeår-spaken fra 0 til 8 og se hva som skjer når regnet uteblir: vannmagasinet synker og blir gjørmete, maisåkrene brunes og faller sammen, folk forlater byen, og jungelen vokser fram over torget og kryper opp pyramiden. Til slutt står byen forlatt som en ruin slukt av skog. Lyspæren kommer i hendene: når regnet stanser i en by uten elver, renner det lagrede vannet ut, maten svikter, og hele byen må forlates. Men tørken velter sjelden et samfunn alene - den ble dødelig fordi mayabyene allerede var strukket til bristepunktet av for mange mennesker og evig krig mellom bystatene.',
        estimatedSeconds: 150,
        loader: () => import('./MayaKollaps3D'),
        Component: MayaKollaps3D as never,
    },
    'paskeoya-3d': {
        id: 'paskeoya-3d',
        title: 'Påskeøya: skogen og statuene',
        description:
            'En grønn øy full av palmer. Klikk et tre for å hogge det, og se en moai reise seg langs kysten - for hvert par trær du feller, står en ny statue ferdig. Men øya blir brunere for hvert tre som faller. Når siste palme er hogd, står alle de seks moaiene ferdige på en naken stein. Lyspæren kommer i hendene: det samme arbeidet øyboerne var stolte av, å reise moai, brukte opp skogen som holdt dem i live. Uten trær ble det ingen kanoer til fiske, ingen ved og ingen tømmer. De brukte ressursen raskere enn den kunne fornye seg, og forbi vippepunktet var det ingen vei tilbake.',
        estimatedSeconds: 140,
        loader: () => import('./Paaskeoya3D'),
        Component: Paaskeoya3D as never,
    },
    'himmelens-mandat-3d': {
        id: 'himmelens-mandat-3d',
        title: 'Himmelens mandat',
        description:
            'Spill ut den kinesiske dynastisyklusen. En gullstråle faller fra himmelen ned på keiserpalasset - det er Himmelens mandat, retten til å styre. For hver keiser klikker du kornlageret for å styre rettferdig, eller skattekista for å styre grådig. Rettferd løfter mandatet: rismarkene grønnes, folket jubler, palasset står stødig. Grådighet tapper det: markene visner, opprør bryter ut, palasset heller, og til slutt trekker himmelen mandatet tilbake og dynastiet faller. Grunnlegg da et nytt dynasti og løft det til gullalder. Lyspæren: keiserens rett til å styre var betinget - styrte han rettferdig, besto dynastiet; ble han grådig, mistet han Himmelens mandat, og et nytt dynasti tok over. Det er dynastisyklusen som gikk igjen i Kina i nesten to tusen år.',
        estimatedSeconds: 150,
        loader: () => import('./HimmelensMandat3D'),
        Component: HimmelensMandat3D as never,
    },
    'imperium-soyler': {
        id: 'imperium-soyler',
        title: 'Rikets fire søyler',
        description:
            'Riket er en kuppel som hviler på fire søyler: hæren, økonomien, legitimiteten (at folket godtar makten) og grensene. Klikk en pulserende ring for å slå ut en søyle. Mister riket én søyle, heller kuppelen, men den bærer. Mister det to, vakler hele bygget. Men når den tredje søylen ryker, er vippepunktet nådd og kuppelen raser sammen. Lyspæren: et imperium tåler å miste én bæresøyle, selv to, men det finnes en grense. Kollaps kommer ikke av én enkelt svikt, men når for mange av rikets grunnpilarer svikter på samme tid.',
        estimatedSeconds: 120,
        loader: () => import('./ImperiumSoyler'),
        Component: ImperiumSoyler as never,
    },
    'kongestatuen-faller-3d': {
        id: 'kongestatuen-faller-3d',
        title: 'Kongestatuen faller',
        description:
            'New York, 9. juli 1776. Erklæringen leses høyt på Bowling Green foran en forgylt rytterstatue av kong George III. Klikk skriftrullen og les de berømte ordene: alle mennesker er skapt like. Da låses handlingen opp. Trekk så i tauet, ved å klikke statuen eller knappen, tre ganger: for hvert napp heller kongen mer, til han velter og folkemengden jubler. Lyspæren: erklæringens ord ble til handling. Folket rev ned symbolet på kongemakten, og blyet i statuen ble smeltet om til over 42 000 kuler til revolusjonshæren. Makten skiftet fra kronen til folket.',
        estimatedSeconds: 130,
        loader: () => import('./KongestatuenFaller3D'),
        Component: KongestatuenFaller3D as never,
    },
    'lynkrigen-3d': {
        id: 'lynkrigen-3d',
        title: 'Lynkrigen: samle støtet',
        description:
            'Vestfronten 1940. Du har seks stridsvogner og en fiendtlig forsvarslinje med fem bunkere. Dra vognene fram mot fronten. Sprer du dem likt utover, blir ingen punkt sterkt nok, og angrepet stanser mot linja. Samle i stedet minst fire vogner på ETT punkt: da slår de hull i linja, kjører dypt inn bak fienden og vifter ut, så hele forsvaret faller som en bølge. Lyspæren: lynkrigen (Blitzkrieg) vant ikke ved å presse likt langs hele fronten, men ved å samle all panserkraft på ett punkt, slå hull og kjøre raskt gjennom. Slik falt Polen og Frankrike på få uker.',
        estimatedSeconds: 140,
        loader: () => import('./Lynkrigen3D'),
        Component: Lynkrigen3D as never,
    },
    'leiegaarden-3d': {
        id: 'leiegaarden-3d',
        title: 'Leiegården: byen som stod på hodet',
        description:
            'Et tverrsnitt av en romersk insula (leiegård) i fire etasjer, sett rett forfra som et dukkehus. Nede på gata venter fire familier, fra den rike kjøpmannen (rød) til den fattige enka (grå). Klikk en familie og sett den inn i riktig etasje: i Roma var alt snudd på hodet mot i dag, så de rikeste bodde NEDERST med innlagt vann og dør rett ut, mens de fattigste ble presset OPP under taket uten vann. Når alle bor, velt oljelampen: brannen sprer seg oppover, kjøpmannen på gateplan går rett ut, men familiene øverst sitter fast i røyken. Lyspæren: i en insula var høyden motsatt av i dag. Jo høyere du bodde, jo fattigere og farligere var livet, fordi det fantes verken heis, vann eller trygg rømningsvei på toppen.',
        estimatedSeconds: 150,
        loader: () => import('./Leiegaarden3D'),
        Component: Leiegaarden3D as never,
    },
    'fingerte-flukten-3d': {
        id: 'fingerte-flukten-3d',
        title: 'Den fingerte flukten',
        description:
            'En åpen steppe sett ovenfra. Du styrer den lette mongolske rytterstyrken mot en tyngre, tett fiendeblokk. Klikk «Egg fienden» så de lette bueskytterne skyter pilregn og lokker. Dra så spaken «Falsk flukt»: mongolene rir bakover, og den tunge blokka jager etter, men de ivrigste rir fra og de tyngste henger etter, så den tette blokka strekkes ut i en lang, sliten linje. Når fienden er full strukket ut, lukk fellen fra begge flanker, og bakholdet sveiper inn og omringer dem. Lyspæren: mongolene vant ikke fordi de var sterkest, men fordi de var raske og disiplinerte nok til å late som de flyktet. Fiendens egen iver ble fella som omringet dem.',
        estimatedSeconds: 150,
        loader: () => import('./FingertFlukt3D'),
        Component: FingertFlukt3D as never,
    },
    'stenderpyramiden-3d': {
        id: 'stenderpyramiden-3d',
        title: 'Stenderpyramiden faller',
        description:
            'Det franske samfunnet i 1788 sett som en bratt pyramide. Den bittesmå geistligheten og adelen står høyt på toppen, mens den enorme tredjestanden er presset sammen nederst og bøyer seg under vekten. Dra spaken fra 1788 mot 1789: de privilegerte synker ned til bakken, de tre stendene blir tre like brede plattformer ved siden av hverandre, alle reiser seg, og Erklæringen om menneskerettighetene lyser opp bak dem. Vedta til slutt erklæringen. Lyspæren: før 1789 bestemte fødselen din om du sto på toppen eller bunnen, og to bittesmå grupper styrte alt. Erklæringen flyttet alle ned på samme grunn: like for loven, uansett hvem du var født som.',
        estimatedSeconds: 140,
        loader: () => import('./Stenderpyramiden3D'),
        Component: Stenderpyramiden3D as never,
    },
    'hundreaarskrigen-3d': {
        id: 'hundreaarskrigen-3d',
        title: 'Hundreårskrigen: krigen som svingte',
        description:
            'Et kart over Frankrike sett ovenfra. Hundreårskrigen mellom England og Frankrike svingte fram og tilbake i over hundre år. Klikk de tre store engelske seirene i rekkefølge - Crécy 1346, Poitiers 1356 og Azincourt 1415 - og se landet farges rødt mens fronten presser sørover, til bare byen Orléans holder stand, beleiret. Send så Jeanne d\'Arc til Orléans i 1429: hun løfter beleiringen, det franske blå skyller tilbake over kartet, og Frankrike vinner krigen i 1453. Lyspæren: krigen var ikke ett slag, men en serie kriger som svingte fram og tilbake. England vant slag etter slag med langbuene sine, helt til en ung bondejente snudde alt ved Orléans og ga franskmennene troen tilbake.',
        estimatedSeconds: 150,
        loader: () => import('./Hundreaarskrigen3D'),
        Component: Hundreaarskrigen3D as never,
    },
    'stalmonsteret-3d': {
        id: 'stalmonsteret-3d',
        title: 'Stålmonsteret bryter fronten',
        description:
            'Vestfronten under første verdenskrig. Trykk på knappen og send infanteriet over ingenmannsland. De løper mot fiendens skyttergrav, men maskingeværet meier dem ned ved piggtråden og angrepet stivner. Dra så spaken og kjør stridsvognen fram: den ruller ut i ingenmannsland, knuser piggtråden, tar imot kulene med panseret og klatrer til slutt over skyttergraven. Klikk maskingeværet for å lese om ildkraften. Lyspæren: maskingevær og piggtråd gjorde det umulig for mennesker å krysse ingenmannsland, og det var nettopp derfor stridsvognen ble oppfunnet. En maskin som tålte kulene, knuste tråden og krysset grava kunne bryte stillstanden de ikke klarte.',
        estimatedSeconds: 150,
        loader: () => import('./Stalmonsteret3D'),
        Component: Stalmonsteret3D as never,
    },
    'bergkunsten-3d': {
        id: 'bergkunsten-3d',
        title: 'Finn helleristningene',
        description:
            'Et naket berg ute i landskapet. Dra spaken og senk sola mot horisonten. Når lyset står høyt er berget flatt og tomt, men når sola synker, kaster de grunne hugg-sporene skygge og figurene trer fram - en båt, et solhjul, en jeger, en elg og en fisk. Klikk hver figur for å registrere den. Lyspæren: du ser helleristninger best når sola står lavt, og det er nettopp derfor de er så vanskelige å finne. Arkeologer leter i skrått lys eller maler opp sporene, og nye ristninger blir oppdaget den dag i dag.',
        estimatedSeconds: 140,
        loader: () => import('./Bergkunsten3D'),
        Component: Bergkunsten3D as never,
    },
    'forseglingen-runnymede-3d': {
        id: 'forseglingen-runnymede-3d',
        title: 'Forseglingen på Runnymede',
        description:
            'Enga ved Themsen, juni 1215. Kong Johan har gått tom for penger og makt, og opprørske baroner tvinger ham til forhandlingsbordet. Dra voksseglet bort til pergamentet og slipp det. For hvert segl du setter, synker kongens høye trone et hakk, mens en steinstele merket LOVEN reiser seg like mye, og baronene løfter armene. Når alle fire segl er på plass, står tronen og loven på samme høyde. Lyspæren: Magna Carta gjorde ikke kongen maktesløs. Den senket ham ned til lovens nivå, slik at selv kongen for første gang måtte følge regler han ikke kunne endre alene. Det er denne ideen rettsstaten fortsatt bygger på.',
        estimatedSeconds: 150,
        loader: () => import('./ForseglingenRunnymede3D'),
        Component: ForseglingenRunnymede3D as never,
    },
    'radarvakten-3d': {
        id: 'radarvakten-3d',
        title: 'Radarvakten: se det usynlige',
        description:
            'England, 1940. Tyske bombefly nærmer seg kysten, skjult i skodde og halvmørke. Du dreier radarskåla og sveiper en stråle ut over havet. Når strålen treffer et fly, lyser det svakt opp og blir klikkbart. Klikk for å sende en puls: en ring av radiobølger farer ut, studser mot flyet og kommer tilbake som et ekko, og avstanden leses av med en gang. Finn alle fire bombeflyene før de når kysten. Lyspæren: radar lar deg se fly i mørke og tåke ved å sende ut usynlige radiobølger som studser tilbake, og ekkoet forteller hvor langt unna flyet er. Derfor kunne britene møte angrepet i tide.',
        estimatedSeconds: 150,
        loader: () => import('./Radarvakten3D'),
        Component: Radarvakten3D as never,
    },
    'arkimedes-kronen-3d': {
        id: 'arkimedes-kronen-3d',
        title: 'Arkimedes og kongens krone',
        description:
            'Kongen mistenker at gullsmeden har blandet billig sølv inn i gullkronen. Du har to glasskar med like mye vann. Senk det rene gullet i det ene karet og den mistenkte kronen i det andre med glidebryteren, og se hvor høyt vannet stiger i hvert kar. Kronen og gullet veier akkurat like mye, men kronen hever vannet mest. Lyspæren: en gjenstand presser bort vann etter hvor stor den er, ikke hvor tung. Siden sølv er lettere enn gull, må en falsk krone være større, og en større krone presser bort mer vann. Slik avslørte Arkimedes juks med vann og fornuft i stedet for gjetning.',
        estimatedSeconds: 120,
        loader: () => import('./ArkimedesKronen3D'),
        Component: ArkimedesKronen3D as never,
    },
    'standardklokka-3d': {
        id: 'standardklokka-3d',
        title: 'Still klokkene til togets tid',
        description:
            'Før jernbanen hadde hver by sin egen klokke etter sola, og klokka i Bristol gikk minutter bak klokka i London. Da togene begynte å gå etter ruteplan ble det kaos. Dra viseren på hvert klokketårn til samme tid (rett opp på tolv), så signal-lampene blir grønne og toget endelig kan kjøre ruta si fra London. Lyspæren: jernbanen tvang fram EN felles standardtid - klokka ble plutselig viktigere enn sola, og slik fikk vi tidssonene vi fortsatt lever etter.',
        estimatedSeconds: 150,
        loader: () => import('./Standardklokka3D'),
        Component: Standardklokka3D as never,
    },
    'stromveien-3d': {
        id: 'stromveien-3d',
        title: 'Strommen kommer inn i huset',
        description:
            'Det er kveld og den norske dalen er mørk. Slipp vannet løs i fossen med en spak, så fossen driver generatoren i kraftverket. Strekk så ledningen ved å klikke punktene etter tur fra kraftverket via to stolper helt fram til huset, og skru til slutt på lyset - så vinduer, lyspære og gatelys lyser opp dalen. Dra vannføringen ned igjen, og lyset svekkes. Lyspæren: ei pære alene gir ikke lys. Strømmen må ha en hel vei å gå, fra fossen som lager den, gjennom ledningene, helt inn i taket ditt. Det var dette Edison forstod da han bygde hele systemet, ikke bare pæra.',
        estimatedSeconds: 150,
        loader: () => import('./Stromveien3D'),
        Component: Stromveien3D as never,
    },
    'stor-zimbabwe-mur-3d': {
        id: 'stor-zimbabwe-mur-3d',
        title: 'Bygg Stor-Zimbabwe',
        description:
            'Reis Stor-Zimbabwes to kjennemerker i tørr stein. Dra granittblokker fra steinbruddet bort til byggepunktet og legg lag på lag: først den buede ringmuren, så det høye kjegletårnet inne i borgen. En live-teller viser "Mørtel brukt: 0" hele veien. Lyspæren: byggerne i shona-folket hugget granitten så jevn at de mektige murene holdt seg oppe helt uten mørtel, en by europeerne lenge nektet å tro at afrikanere hadde reist.',
        estimatedSeconds: 140,
        loader: () => import('./StorZimbabweMur3D'),
        Component: StorZimbabweMur3D as never,
    },
    'trekanthandelen-3d': {
        id: 'trekanthandelen-3d',
        title: 'Den dodelige trekanten',
        description:
            'Dra handelsskipet rundt de tre hjørnene i den atlantiske trekant-handelen, og se hvorfor systemet aldri lot skipet seile tomt. Etappe 1: ferdigvarer fra Europa til Vest-Afrika. Etappe 2, Midtpassasjen: skipet frakter mennesker, stuet sammen under dekk, ingen feiring, bare det mørke faktumet om hva systemet gjorde. Etappe 3: sukker og bomull tilbake til Europa. For hver etappe tegnes en linje, til trekanten er sluttet. Lyspæren: hver etappe ga profitt og betalte for den neste, og hele kretsløpet hvilte på Midtpassasjen, der mennesker ble behandlet som last.',
        estimatedSeconds: 170,
        loader: () => import('./Trekanthandelen3D'),
        Component: Trekanthandelen3D as never,
    },
    'rutebyen-mohenjo-daro': {
        id: 'rutebyen-mohenjo-daro',
        title: 'Rutebyen: Mohenjo-daro',
        description:
            'Bygg en av verdens første planlagte byer i tre steg. Dra de skjeve husene inn på rutenettet så rette gater vokser fram som et sjakkbrett, klikk deg gjennom gatene og legg lokk over det lukkede avløpet under hver gate, og reis til slutt Det store badet i sentrum. Lyspæren: Mohenjo-daro vokste ikke vilt og tilfeldig, den ble TEGNET først og bygd etterpå, med rette gater, like hus og verdens første bymessige kloakk for over 4000 år siden.',
        estimatedSeconds: 150,
        loader: () => import('./Rutebyen3D'),
        Component: Rutebyen3D as never,
    },
    'produksjonsoppskriften-3d': {
        id: 'produksjonsoppskriften-3d',
        title: 'Produksjonsoppskriften',
        description:
            'En vare lages aldri av én ting alene. Dra de tre flyttbare faktorene - mennesker, råvare og maskin - inn på produksjonsbordet ved kysten og se laksefileten bli til. Test så den fjerde faktoren: flytt fabrikken innland, og havet glir bort sammen med den billige laksen, så produksjonen stopper. Lyspæren: produksjon er en miks av mennesker, råvarer, maskiner og lokasjon, og fordi miksen er ulik fra sted til sted, er ulike steder billigst til ulike varer - selve grunnen til at land spesialiserer seg og bytter.',
        estimatedSeconds: 150,
        loader: () => import('./Produksjonsoppskriften3D'),
        Component: Produksjonsoppskriften3D as never,
    },
    'karantenelinja-3d': {
        id: 'karantenelinja-3d',
        title: 'Karantenelinja: Cuba-krisen 1962',
        description:
            'Cuba-krisen som et geografisk sjakkspill i tre steg. Klikk de skjulte rakettrampene som U-2 flyet fant på Cuba, dra så en spak og se rekkevidden vokse nordover til amerikanske byer lyser rødt, og dra til slutt tre krigsskip ut i karantenelinja så de sovjetiske fraktskipene må snu. Lyspæren: hele krisen handlet om geografi. Rakettene lå bare 15 mil fra USA, og Kennedy svarte med et romlig grep (en ring av skip rundt Cuba) i stedet for atomkrig.',
        estimatedSeconds: 150,
        loader: () => import('./Karantenelinja3D'),
        Component: Karantenelinja3D as never,
    },
    'karavanen-over-sahara-3d': {
        id: 'karavanen-over-sahara-3d',
        title: 'Karavanen over Sahara',
        description:
            'Mali lå midt på veien mellom saltgruvene i Sahara og gullfeltene i sør. Dra en saltlast sørover over ørkenen til gullfeltene, der salt var så sjeldent at det ble byttet mot like mye gull, og dra så gullet nordover for å selge det dyrt. Hver gang en last passerer Timbuktu i midten, fylles Malis skattkammer. Lyspæren: den som kontrollerte veien mellom salt og gull ble styrtrik, og slik vokste et av middelalderens rikeste riker fram i Vest-Afrika, lenge før europeerne kom.',
        estimatedSeconds: 150,
        loader: () => import('./KaravanenOverSahara3D'),
        Component: KaravanenOverSahara3D as never,
    },
    'riket-langs-niger-3d': {
        id: 'riket-langs-niger-3d',
        title: 'Bygg riket langs Niger',
        description:
            'Songhai var et elve-rike. Dra Songhais krigsbater opp elva Niger til de tre store handelsbyene Gao, Timbuktu og Djenne. For hver by som kommer under riket, reiser flagget seg, husene vokser og riket utvider seg langs elva. Lyspæren: kontroll over Niger og handelsbyene gjorde Songhai til det største riket Afrika har sett. Elva var rikets motorvei, som bandt byene sammen til ett mektig rike.',
        estimatedSeconds: 120,
        loader: () => import('./RiketLangsNiger3D'),
        Component: RiketLangsNiger3D as never,
    },
    'tvillingbyen-koumbi-saleh-3d': {
        id: 'tvillingbyen-koumbi-saleh-3d',
        title: 'Bygg tvillingbyen Koumbi Saleh',
        description:
            'Ghana-rikets hovedstad Koumbi Saleh var to byer i én. Dra de seks bygningene på plass: kongens palass, den hellige lunden og kongegravene i kongebyen, og moskeen, markedet og handelshusene i kjøpmannsbyen et stykke unna. Lyspæren: Ghanas hovedstad var to verdener side om side – en gammel afrikansk kongeby og en muslimsk handelsby – bundet sammen av handelen med gull og salt. Slik viser byen at to kulturer og to religioner kunne dele samme rike.',
        estimatedSeconds: 140,
        loader: () => import('./TvillingbyenKoumbiSaleh3D'),
        Component: TvillingbyenKoumbiSaleh3D as never,
    },
    'attedelt-vei-hjulet': {
        id: 'attedelt-vei-hjulet',
        title: 'Sett dharmahjulet i gang',
        description:
            'Et lysende dharmahjul svever i et lyst kosmos, men det står stille og eikene er grå. Tenn de åtte eikene én for én ved å klikke dem - gule for visdom, blå for etikk, lilla for fordypning - og se hjulet ta form. Når alle åtte lyser, vakler hjulet likevel: dra spaken til middelveien, verken for mye nytelse eller for mye selvpining, så hjulet steiler seg og ruller. Lyspæren: Den åttedelte veien er ikke åtte trinn du tar etter hverandre, men ett hjul som bare ruller når alle delene øves samtidig og holdes i balanse.',
        estimatedSeconds: 140,
        loader: () => import('./AttedeltVei3D'),
        Component: AttedeltVei3D as never,
    },
    'allmennviljen-3d': {
        id: 'allmennviljen-3d',
        title: 'Allmennviljen',
        description:
            'Skyv landsbyen fra privat vilje til allmennvilje. Fem innbyggere står spredt og vender ryggen til hverandre - hver drar i sin egen retning. Mens du skyver spaken samler de seg rundt torget, vender seg mot hverandre, og en felles lov reiser seg i midten og lyser opp. Vedta loven sammen. Lyspæren: allmennviljen er ikke summen av de private ønskene, men det fellesskapet vil som en helhet - og loven de gir seg selv binder dem sammen i stedet for å splitte dem.',
        estimatedSeconds: 130,
        loader: () => import('./Allmennviljen3D'),
        Component: Allmennviljen3D as never,
    },
    'moralsk-tomrom-3d': {
        id: 'moralsk-tomrom-3d',
        title: 'Det moralske tomrommet',
        description:
            'En glødende verdi-sol svever i et lyst kosmos, og rundt den orbiterer fire verdier - ærlighet, hjelpsomhet, rettferd og vennlighet - som lyser av seg selv. Slukk sola, og verdiene avsløres som kalde, grå steiner uten egen glød. Det er moralsk nihilisme: ingen moral ligger ferdig i verden. Klikk så en stein og tenn den med ditt eget, kjølige lys. Lyspæren: verdien forsvant ikke, den byttet kilde - fra verden til mennesket, slik Nietzsche og Sartre svarte nihilismen.',
        estimatedSeconds: 140,
        loader: () => import('./MoralskTomrom3D'),
        Component: MoralskTomrom3D as never,
    },
    'saturn-v-mane-3d': {
        id: 'saturn-v-mane-3d',
        title: 'Saturn V til månen',
        description:
            'Bygg månerakketen Saturn V på utskytningsrampen ved å dra de tre trinnene oppå hverandre, nedenfra og opp. Tenn motorene, og slipp så hvert tomme trinn ett for ett mens raketten klatrer - for hvert trinn som faller av synker massen og fartøyet skyter fart. Til slutt er bare den lille Apollo-kapselen igjen, lett nok til å gli helt til månen. Lyspæren: Apollo 11 nådde aldri månen i ett stykke. Raketten måtte kaste fra seg de tunge, tomme trinnene for å bli lett nok til å rive seg løs fra jordas tyngdekraft.',
        estimatedSeconds: 150,
        loader: () => import('./SaturnVMane3D'),
        Component: SaturnVMane3D as never,
    },
    'japansk-imperium-3d': {
        id: 'japansk-imperium-3d',
        title: 'Det japanske imperiet vokser',
        description:
            'Et stilisert kart over Øst-Asia der Japans øyer alt ligger røde i øst. Legg nabolandene under Japan i historisk rekkefølge: ta Taiwan fra Kina (1895), senk den russiske flåten i sjøslaget ved Tsushima (1905), og gjør Korea til koloni (1910). For hvert land som faller blir det rødt og en rød imperie-lenke fra Japan lyser opp. Lyspæren: Meiji-Japan brukte sin nye industri og hær til å bli et imperium, og i 1905 ble det første asiatiske landet i moderne tid som slo en europeisk stormakt.',
        estimatedSeconds: 140,
        loader: () => import('./JapanskImperium3D'),
        Component: JapanskImperium3D as never,
    },
    'tempelets-renselse-3d': {
        id: 'tempelets-renselse-3d',
        title: 'Tempelets renselse',
        description:
            'På en kanaaneisk offerhøyde står Yahweh-steinen sammen med flere andre guder: Asherah-pælen, Baal-figuren, en Astarte-figurin og et røkelsesalter. Klikk hvert objekt og se at folk dyrket dem sammen her, og gjenskap så kong Josjias reform (år 622 f.Kr.) ved å fjerne de fremmede gudene én for én, til bare Yahweh-steinen står igjen og lyser. Lyspæren: slik ble troen på mange guder til troen på én eneste Gud - det vi kaller monoteisme.',
        estimatedSeconds: 140,
        loader: () => import('./TempeletsRenselse3D'),
        Component: TempeletsRenselse3D as never,
    },
    'stormingen-av-bastillen-3d': {
        id: 'stormingen-av-bastillen-3d',
        title: 'Stormingen av Bastillen',
        description:
            'Festningen Bastillen ruver over gatene i Paris den 14. juli 1789, og en folkemengde presser på nedenfor. Kapp de to kjettingene så vindebrua dundrer ned og folket strømmer inn, rull så de fem kanonene fra avhopperne i stilling foran porten, og krev til slutt overgivelse så det hvite flagget går opp, de få fangene går fri og trikoloren heises. Lyspæren: det var vanlige parisere, ikke kongen, som tok en kongelig festning med makt, og de kom egentlig for kruttet, ikke for fangene.',
        estimatedSeconds: 150,
        loader: () => import('./StormingenAvBastillen3D'),
        Component: StormingenAvBastillen3D as never,
    },
    'teselskapet-3d': {
        id: 'teselskapet-3d',
        title: 'Teselskapet i Boston',
        description:
            'Boston havn, natt til 16. desember 1773. Tre skip ligger fulle av te som britene har lagt skatt på. Dra tekiste etter tekiste over rekka og se dem plaske ned i havet. Lyspæren: kolonistene nektet å betale en skatt de ikke fikk stemme om, og valgte heller å ødelegge teen enn å gi etter. Britene svarte med å stenge havna, og protesten førte et langt skritt nærmere åpen krig.',
        estimatedSeconds: 110,
        loader: () => import('./Teselskapet3D'),
        Component: Teselskapet3D as never,
    },
    'japan-mirakel-by-3d': {
        id: 'japan-mirakel-by-3d',
        title: 'Reis Japan fra ruinene',
        description:
            'En japansk by ligger i ruiner etter krigen i 1945. Velg tre tiltak i rekkefølge - bygg skoler og fabrikker (1950), lag kvalitetsvarer for eksport (1960) og bygg det moderne Japan (1980) - og se ruinene synke, fabrikkene reise seg, eksportskipet komme og skyskrapere og lyntog lyse opp en moderne storby. Lyspæren: Japan ble rikt av kloke valg - skoler, kvalitet og eksport, ikke våpen - gjentatt tiår etter tiår.',
        estimatedSeconds: 150,
        loader: () => import('./JapanMirakelBy3D'),
        Component: JapanMirakelBy3D as never,
    },
    'meiji-byen-3d': {
        id: 'meiji-byen-3d',
        title: 'Meiji-byen forvandles',
        description:
            'En japansk by med torii-port, rispaddier, tradisjonelle hus og Fuji i bakgrunnen. Velg tre reformer i rekkefølge - bygg jernbanen (1872), reis fabrikkene og innfør skole og telegraf - og se byen forvandle seg fra lukket føydalsamfunn til moderne industriby. Lyspæren: på bare noen tiår moderniserte Japan seg selv, frivillig og lynraskt, mens nabolandene ble kolonisert.',
        estimatedSeconds: 150,
        loader: () => import('./MeijiByen3D'),
        Component: MeijiByen3D as never,
    },
    'berlinmuren-3d': {
        id: 'berlinmuren-3d',
        title: 'Dødsstripen: muren som delte en by',
        description:
            'En skive av Berlin med hus på hver side av grensa. Steng de åpne overgangene natt til 13. august 1961, dra så en spak som bygger ut dødsstripen lag for lag - to murer, en tom sandsone, vakttårn og lyskastere - og riv til slutt muren i 1989 så de to familiene møter hverandre igjen. Lyspæren: Berlinmuren var aldri bare en vegg, men et dypt, dødelig system som skar gjennom en levende by i 28 år.',
        estimatedSeconds: 150,
        loader: () => import('./Berlinmuren3D'),
        Component: Berlinmuren3D as never,
    },
    'flukten-over-muren': {
        id: 'flukten-over-muren',
        title: 'Flukten over Muren',
        description:
            'Førstepersons natt-flukt over dødsstripa i Berlin: hold inne for å løpe mot lyset i Vest-Berlin, frys når lyskasterne sveiper mot deg, og hold deg unna patruljevakta. Signalgjerde, alarmnivå og daggry-nedtelling - eleven kjenner på kroppen hvorfor stripa var konstruert for at ingen skulle komme over.',
        estimatedSeconds: 150,
        loader: () => import('./FluktenOverMuren3D'),
        Component: FluktenOverMuren3D as never,
    },
    'rikssamlingen-3d': {
        id: 'rikssamlingen-3d',
        title: 'Rikssamlingen: da Norge ble ett',
        description:
            'Et stilisert kystkart der hvert rike har sin egen småkonge. Klikk rikene ett for ett og legg dem under Harald, og se kystleia Nordvegen lyse opp i gull. Et mørkt gap blir stående ved Hafrsfjord til du tar det avgjørende slaget rundt år 872. Lyspæren: Norge ble ett rike fordi Harald tok kontroll over kysten og vant i Hafrsfjord.',
        estimatedSeconds: 150,
        loader: () => import('./Rikssamlingen3D'),
        Component: Rikssamlingen3D as never,
    },
    'matreglerbordet-3d': {
        id: 'matreglerbordet-3d',
        title: 'Matreglerbordet',
        description:
            'Det samme bordet med svin, oksekjøtt, reker, fisk, vin og brød. Velg en religion og se hvilke matvarer som blir lov (grønne) og forbudt (røde). Lyspæren: samme mat kan være helt vanlig i én religion og forbudt i en annen.',
        estimatedSeconds: 150,
        loader: () => import('./MatreglerBord3D'),
        Component: MatreglerBord3D as never,
    },
    'festens-lys-3d': {
        id: 'festens-lys-3d',
        title: 'Festens lys',
        description:
            'Fire religioner, fire høytider - jul, hanukka, divali og id. Tenn lysene på hvert høytidsbord og se rommet lyse opp. Lyspæren: alle kulturer feirer med lys, mat og samling, selv om de tror på ulike ting.',
        estimatedSeconds: 140,
        loader: () => import('./FestensLys3D'),
        Component: FestensLys3D as never,
    },
    'symboler-paa-taket-3d': {
        id: 'symboler-paa-taket-3d',
        title: 'Symbolene på taket',
        description:
            'Tre gudshus står på rad: en kirke, en moské og en synagoge. Dra korset, halvmånen og davidsstjernen opp på riktig tak, så lyser huset opp. Lyspæren: symbolet på taket forteller deg hvilken tro huset hører til, lenge før du går inn.',
        estimatedSeconds: 120,
        loader: () => import('./SymbolerPaaTaket3D'),
        Component: SymbolerPaaTaket3D as never,
    },
    'skjulte-symboler-3d': {
        id: 'skjulte-symboler-3d',
        title: 'Skjulte symboler i populærkulturen',
        description:
            'Et helt vanlig ungdomsrom er fullt av religion. Klikk de fem tingene som gjemmer et religiøst symbol - superhelt-plakaten, filmen, Buddha-statuen, julelåten og spillet - og se rommet lyse opp. Lyspæren: religion lever videre i film, musikk og spill, ofte uten at vi tenker over det.',
        estimatedSeconds: 120,
        loader: () => import('./SkjulteSymboler3D'),
        Component: SkjulteSymboler3D as never,
    },
    'europa-broen-3d': {
        id: 'europa-broen-3d',
        title: 'Broen til Europa',
        description:
            'Dra spaken fra "Stå alene" til "Fullt EU-medlem" og se hva Norge får og gir fra seg: marked, innflytelse og selvstyre.',
        estimatedSeconds: 150,
        loader: () => import('./EuropaBroen3D'),
        Component: EuropaBroen3D as never,
    },
    'gladius-duell': {
        id: 'gladius-duell',
        title: 'Gladius-duell',
        description:
            'Turbasert sverdduell mot en romersk gladiator. Lær å lese motstanderens trekk.',
        estimatedSeconds: 180,
        loader: () => import('./GladiusDuel'),
        Component: GladiusDuel as never,
    },
    'colosseum-3d': {
        id: 'colosseum-3d',
        title: 'Roter Colosseum',
        description:
            'Bla rundt Colosseum i 3D og klikk de fire etasjene i riktig byggerekkefølge.',
        estimatedSeconds: 120,
        loader: () => import('./Colosseum3D'),
        Component: Colosseum3D as never,
    },
    'teodosianmuren': {
        id: 'teodosianmuren',
        title: 'Teodosianmuren',
        description:
            'Roter Konstantinopels trippelmur i 3D, finn de fire forsvarslagene, og se Mehmet 2.s kanon knuse muren i 1453.',
        estimatedSeconds: 120,
        loader: () => import('./TheodosianWalls3D'),
        Component: TheodosianWalls3D as never,
    },
    'hamskiftet-3d': {
        id: 'hamskiftet-3d',
        title: 'Det store hamskiftet',
        description:
            'Forvandle en norsk bygd i 3D: bygg jernbanen, kjøp slåmaskinen, og se husmennene dra til Amerika og byen.',
        estimatedSeconds: 150,
        loader: () => import('./Hamskiftet3D'),
        Component: Hamskiftet3D as never,
    },
    'oslo-sosiolekt-3d': {
        id: 'oslo-sosiolekt-3d',
        title: 'Oslo: én by, to talemål',
        description:
            'Utforsk hvordan sosial gruppe formet talemålet på hver side av elva i Oslo — østkantmål mot vestkantmål — og se dem nærme seg hverandre hos ungdom i dag.',
        estimatedSeconds: 150,
        loader: () => import('./OsloSosiolekt3D'),
        Component: OsloSosiolekt3D as never,
    },
    'multietnolekt-gata-3d': {
        id: 'multietnolekt-gata-3d',
        title: 'Multietnolekt-gata: én gate, mange språk',
        description:
            'Hent ordene fra tre språkhus — arabisk, urdu og punjabi, og engelsk — inn til det felles torget, og se hvordan lånord fra mange språk blir til ett felles ungdomsspråk.',
        estimatedSeconds: 140,
        loader: () => import('./MultietnolektGata3D'),
        Component: MultietnolektGata3D as never,
    },
    'vikingskip-3d': {
        id: 'vikingskip-3d',
        title: 'Bygg vikingskipet',
        description:
            'Bygg et vikingskip i 3D: dra kjølen på plass, klink bordgangene, reis masten, og form skroget til langskip eller knarr.',
        estimatedSeconds: 160,
        loader: () => import('./VikingShip3D'),
        Component: VikingShip3D as never,
    },
    'vesterled-3d': {
        id: 'vesterled-3d',
        title: 'Vesterled: sjøveien til Amerika',
        description:
            'Seil den norrøne ruten vestover i 3D. Hopp fra land til land - Norge, Island, Grønland, Vinland - og se hvordan nordboerne nådde Amerika uten å krysse hele Atlanteren i ett sprang.',
        estimatedSeconds: 110,
        loader: () => import('./Vesterled3D'),
        Component: Vesterled3D as never,
    },
    'leonardo-flygemaskin-3d': {
        id: 'leonardo-flygemaskin-3d',
        title: 'Leonardos flygemaskin',
        description:
            'Gjenskap Leonardos arbeidsmåte i 3D: studer fuglevingen, bygg flygemaskinen med de samme prinsippene, og tråkk pedalen for å slå med vingene.',
        estimatedSeconds: 150,
        loader: () => import('./LeonardoFlygemaskin3D'),
        Component: LeonardoFlygemaskin3D as never,
    },
    'ingenmannsland-mg': {
        id: 'ingenmannsland-mg',
        title: 'Maskingevær ved Somme',
        description:
            'Forsvar en britisk skyttergrav i 3D: skyt soldater som løper over ingenmannsland og kjenn på kroppen hvorfor Vestfronten stivnet.',
        estimatedSeconds: 130,
        loader: () => import('./IngenmanslandMG'),
        Component: IngenmanslandMG as never,
    },
    'dialekt-spredning': {
        id: 'dialekt-spredning',
        title: 'Slik reiser et dialekttrekk',
        description:
            'Slipp et nytt dialekttrekk løs fra Oslo og se hvordan det brer seg. Bølgemodellen sprer det som ringer i vann til nabo etter nabo, mens sprangmodellen lar det hoppe fra by til by og hoppe over bygdene imellom.',
        estimatedSeconds: 140,
        loader: () => import('./Spredning3D'),
        Component: Spredning3D as never,
    },
    'tidens-former-3d': {
        id: 'tidens-former-3d',
        title: 'Tidens to former',
        description:
            'Kjenn på eskatologiens kjerne i 3D: la en verden løpe gjennom skapelse, blomstring, forfall og undergang - og se hvordan tidshjulet (sirkulær tid) føder den på ny, mens tidspilen (lineær tid) ender i ett evig punktum.',
        estimatedSeconds: 150,
        loader: () => import('./TidensFormer3D'),
        Component: TidensFormer3D as never,
    },
    'ut-av-afrika-3d': {
        id: 'ut-av-afrika-3d',
        title: 'Ut av Afrika',
        description:
            'Dra en tids-spak framover fra 200 000 år siden og følg menneskene ut fra Afrika i 3D: en lysende front vandrer langs bueformede ruter til Asia, Europa, Amerika og til slutt Norge, mens innlandsisen i nord trekker seg tilbake. Klikk hver verdensdel etter hvert som den nås for å slå deg ned. Lyspæren: alle mennesker stammer fra Afrika, og Norge ble befolket aller sist, for rundt 11 000 år siden, etter at isen smeltet - Norges historie er svært ung mot menneskets 200 000 år.',
        estimatedSeconds: 140,
        loader: () => import('./UtvandringenFraAfrika3D'),
        Component: UtvandringenFraAfrika3D as never,
    },
    'himmelmodellen-3d': {
        id: 'himmelmodellen-3d',
        title: 'To modeller av himmelen',
        description:
            'Sola, jorda og den røde planeten Mars svever i et lyst kosmos. Bytt mellom de to gamle verdensbildene og la planetene gå: med jorda i sentrum må Mars lage kronglete sløyfer for å stemme med himmelen, men flytt sola til sentrum og alt går i rene, rolige sirkler. Lyspæren: begge modellene forklarer det vi ser, men vitenskapen valgte sola-i-sentrum fordi den gjør det samme på en mye enklere måte - den enkleste forklaringen som stemmer, vinner.',
        estimatedSeconds: 150,
        loader: () => import('./HimmelModellen3D'),
        Component: HimmelModellen3D as never,
    },
    'laasesting-3d': {
        id: 'laasesting-3d',
        title: 'Laasesting: maskinen med to traader',
        description:
            'Tre symaskinen og sy en søm i 3D: dra spolen med undertråden på plass, og vugg svinghjulet så nåla fører den blå overtråden ned og kroken låser den fast i den oransje undertråden. Oppdag hvorfor symaskinen bruker to tråder.',
        estimatedSeconds: 120,
        loader: () => import('./Laasesting3D'),
        Component: Laasesting3D as never,
    },
    'dampmaskin-hjerte-3d': {
        id: 'dampmaskin-hjerte-3d',
        title: 'Dampmaskinens hjerte',
        description:
            'Kjør en dampmaskin i 3D: pump gruva med spaken, sett inn Watts separate kondensator, og kjenn på kroppen hvorfor den holdt sylinderen varm og sparte tre fjerdedeler av kullet.',
        estimatedSeconds: 150,
        loader: () => import('./DampmaskinHjerte3D'),
        Component: DampmaskinHjerte3D as never,
    },
    'falanksen-3d': {
        id: 'falanksen-3d',
        title: 'Bygg falanksen',
        description:
            'Still opp en gresk hoplitt-falanks i 3D: plasser mennene, skyv skjoldene tett sammen, og stå imot fiendens angrep. Kjenn hvorfor skjoldmuren var så sterk.',
        estimatedSeconds: 140,
        loader: () => import('./Falanksen3D'),
        Component: Falanksen3D as never,
    },
    'lange-murene-3d': {
        id: 'lange-murene-3d',
        title: 'De lange murene',
        description:
            'Bygg de lange murene som bandt Athen til havna Piraeus i 3D. Reis korridoren seksjon for seksjon, og se kornskipet seile inn og fylle byen mens Spartas hær står maktesløs utenfor. Lyspæra: så lenge flåten styrte havet, kunne en landhær aldri sulte Athen ut. Murene gjorde byen til en øy på land, og derfor ble Peloponneskrigen en 27 år lang utmattelseskrig.',
        estimatedSeconds: 130,
        loader: () => import('./LangeMurene3D'),
        Component: LangeMurene3D as never,
    },
    'olympia-diskos-3d': {
        id: 'olympia-diskos-3d',
        title: 'Diskos på Olympia',
        description:
            'Kast diskos på Olympias hellige stadion i 3D: still inn vinkel og kraft, se kastebanen, og slå rekorden for å vinne olivenkransen. Oppdag at diskosen flyr lengst ved rundt 45 grader.',
        estimatedSeconds: 140,
        loader: () => import('./OlympiaDiskos3D'),
        Component: OlympiaDiskos3D as never,
    },
    'gresk-teater-3d': {
        id: 'gresk-teater-3d',
        title: 'Bygg det greske teateret',
        description:
            'Sett sammen et gresk teater i 3D: legg ned orkhestra (dansegulvet), reis tilskuerplassene i en halvsirkel og bygg skene (scenehuset). Se hvordan formen bærer lyden helt opp til øverste rad.',
        estimatedSeconds: 150,
        loader: () => import('./GreskTeater3D'),
        Component: GreskTeater3D as never,
    },
    'vannmolla-3d': {
        id: 'vannmolla-3d',
        title: 'Mølla som aldri ble trøtt',
        description:
            'La elva male kornet i 3D: hell korn i trakta, åpne slusen så vannhjulet og tannhjulene driver kvernsteinene, koble inn stamphammeren, og vri mølla mot vinden når elva tørker inn.',
        estimatedSeconds: 150,
        loader: () => import('./Vannmolla3D'),
        Component: Vannmolla3D as never,
    },
    'kjoleskapet-3d': {
        id: 'kjoleskapet-3d',
        title: 'Kjøleskapet: maskinen som flytter varme',
        description:
            'Følg kjølevæsken rundt det lukkede kretsløpet i et kjøleskap i 3D: klikk fordamperen, kompressoren, kondensatoren og strupeventilen i riktig rekkefølge, og skru så på kompressoren med spaken. Se maten bli kald mens varmen strømmer ut bak kjøleskapet. Lyspæren: et kjøleskap lager ikke kulde, det flytter varmen ut i rommet.',
        estimatedSeconds: 160,
        loader: () => import('./Kjoleskapet3D'),
        Component: Kjoleskapet3D as never,
    },
    'konklusjonsbroen-3d': {
        id: 'konklusjonsbroen-3d',
        title: 'Bygg konklusjonsbroen',
        description:
            'Bygg broen fra spørsmålet til en gyldig konklusjon i 3D: velg solid metode eller fristende snarvei for hvert av de fem stegene, og send konklusjonen over kløfta. Én råtten planke, og hele konklusjonen faller gjennom.',
        estimatedSeconds: 150,
        loader: () => import('./Konklusjonsbroen3D'),
        Component: Konklusjonsbroen3D as never,
    },
    'monument-torget-3d': {
        id: 'monument-torget-3d',
        title: 'Hvem får stå på sokkelen?',
        description:
            'Kuratér et by-torg i 3D: velg hvem byen hedrer med statue blant konger, helter, arbeidere, en samisk leder og en forsker. Reiser du bare makt - eller bare vanlige folk - blir torget ensidig, og de glemte dukker opp som skygger i kantene. Et torg som blander flere historier lar flere kjenne seg igjen.',
        estimatedSeconds: 150,
        loader: () => import('./MonumentTorget3D'),
        Component: MonumentTorget3D as never,
    },
    'teknologibolgen-3d': {
        id: 'teknologibolgen-3d',
        title: 'Teknologibølgja',
        description:
            'Skru opp teknologien i 3D og se en bygd forvandle seg på tre arenaer samtidig: folk får verktøy men noen mister jobben, byen vokser men naturen forurenses. Oppdag at gevinst og kostnad alltid stiger sammen - og at grønn teknologi kan rydde opp.',
        estimatedSeconds: 140,
        loader: () => import('./Teknologibolgen3D'),
        Component: Teknologibolgen3D as never,
    },
    'nyheitsbobla-3d': {
        id: 'nyheitsbobla-3d',
        title: 'Nyheitsbordet',
        description:
            'Vel tre nyhende du ville lest, og sjå korleis algoritmen gøymer dei andre under bordet. Klikk "Sjå alt!" for å oppdage blindsonene dine.',
        estimatedSeconds: 120,
        loader: () => import('./Nyheitsbobla3D'),
        Component: Nyheitsbobla3D as never,
    },
    'konsekvensbolgen-3d': {
        id: 'konsekvensbolgen-3d',
        title: 'Konsekvensbølgen',
        description:
            'Sikre forutsetningene som hindrer krig - meklingsorgan, økonomisk samhandel og demokratisk fred - før du tenner gnisten i sentrum. Sikrer du alle tre, dør gnisten ut. Sikrer du for få, ruller en sjokkbølge utover og rammer matpriser, energi, flyktninger og handel langt utenfor konfliktsonen.',
        estimatedSeconds: 130,
        loader: () => import('./Konsekvensbolgen3D'),
        Component: Konsekvensbolgen3D as never,
    },
    'levekaarsgapet-3d': {
        id: 'levekaarsgapet-3d',
        title: 'Levekårsgapet',
        description:
            'To land med et hav imellom: når levekårsgapet er stort, strømmer folk over. Bygg skole, klinikk og arbeid i hjemlandet, og se gapet krympe og migrasjonen stoppe. Det er ikke avstand, men levekår, som avgjør om folk blir.',
        estimatedSeconds: 130,
        loader: () => import('./Levekaarsgapet3D'),
        Component: Levekaarsgapet3D as never,
    },
    'streikefronten-3d': {
        id: 'streikefronten-3d',
        title: 'Streikefronten',
        description:
            'Rekrutter alle fem arbeidergruppene til streiken i en 1890-talls fabrikk i Kristiania. Klikk på gruppene og se dem marsjere til streikefronten. Når alle er med, stanser fabrikken. Lyspæren: alene kan du klage - men organisert kan du endre.',
        estimatedSeconds: 90,
        loader: () => import('./Streikefronten3D'),
        Component: Streikefronten3D as never,
    },
    'perspektivkjernen-3d': {
        id: 'perspektivkjernen-3d',
        title: 'Lys opp problemet',
        description:
            'En grå problemkjerne med fire mørke sider svever i et lyst rom. Klikk perspektiv-skårene rundt: hvert NYE perspektiv lyser opp én side, men samme vinkel viser ingen ny. Først når fire ulike perspektiver er på, lyser hele kjernen. Lyspæren: ulike vinkler ser flere sider - kognitiv mangfoldighet.',
        estimatedSeconds: 140,
        loader: () => import('./Perspektivkjernen3D'),
        Component: Perspektivkjernen3D as never,
    },
    'datasporet-3d': {
        id: 'datasporet-3d',
        title: 'Datasporet',
        description:
            'Du er algoritmen. Samle fem passive digitale spor som flyter rundt en person, og se profilkonfidansen stige. Lyspæren: hvert spor er ufarlig alene - kombinasjonen gir et komplett portrett.',
        estimatedSeconds: 120,
        loader: () => import('./Datasporet3D'),
        Component: Datasporet3D as never,
    },
    'ansiktene-i-mengden-3d': {
        id: 'ansiktene-i-mengden-3d',
        title: 'Ansiktene i mengden',
        description:
            'En gruppe er gjort om til grå, ansiktsløse skikkelser med et propaganda-symbol over seg - "dem". Klikk hver skikkelse og se enkeltmennesket bak: egen farge, ansikt og detalj. Etter hvert som ansiktene kommer fram, smuldrer propagandaen og muren mellom "oss" og "dem" synker. Lyspæren: det er vanskelig å hate dem du ser som mennesker.',
        estimatedSeconds: 110,
        loader: () => import('./AnsikteneIMengden3D'),
        Component: AnsikteneIMengden3D as never,
    },
    'grenselinja-3d': {
        id: 'grenselinja-3d',
        title: 'Hold grensa di',
        description:
            'Du står i sentrum på din egen grenselinje. Fem relasjoner lener seg inn med et press som krysser en grense - og jo nærmere de står, desto hardere presser de. Klikk hver og hold grensa. De som respekterer den, blir stående hos deg. Gjengen som bare ga deg et ultimatum, forsvinner når du står for noe. Lyspæren: det er vanskeligst å si nei til dem du står nærmest.',
        estimatedSeconds: 110,
        loader: () => import('./Grenselinja3D'),
        Component: Grenselinja3D as never,
    },
    'maktbalansen-3d': {
        id: 'maktbalansen-3d',
        title: 'Balanser makta',
        description:
            'En glødende avgjørelse svever over en arena med fire maktaktør-pilarer (Politikk, Næringsliv, Media, Sivilsamfunn). Klikk en aktør og se den trekke avgjørelsen mot seg - én aktør alene drar den helt skjevt. Først når alle fire motvektene trekker samtidig, balanserer de hverandre og avgjørelsen lander i den legitime midtringen. Lyspæren: spredt makt med flere motvekter gir en balansert, legitim avgjørelse.',
        estimatedSeconds: 120,
        loader: () => import('./Maktbalansen3D'),
        Component: Maktbalansen3D as never,
    },
    'taushetsspiralen-3d': {
        id: 'taushetsspiralen-3d',
        title: 'Bryt taushetsspiralen',
        description:
            'Et digitalt forum der to høyrøstede figurer dominerer mikrofonen mens fire nyanserte stemmer tier i periferien. Klikk «Oppmuntre» ved hver stille figur – de glir inn mot plattformen og debatten blir gradvis mer mangfoldig. Lyspæren: demokratiet er sterkere når alle tør å delta, ikke bare de fem prosentene som alltid ytrer seg.',
        estimatedSeconds: 120,
        loader: () => import('./TaushetsspiralenTorg3D'),
        Component: TaushetsspiralenTorg3D as never,
    },
    'argumentbroen-3d': {
        id: 'argumentbroen-3d',
        title: 'Bygg argumentbroen',
        description:
            'Et bredt gap skiller Belegg-tårnet fra Påstand-tårnet. Tre planker svever i lufta - klikk den som virkelig forklarer hvorfor belegget støtter påstanden. Riktig planke glir på plass og broen holder. Feil planke faller i kløften. Lyspæren: uten forklaringen henger påstand og belegg på hver sin side av tomrommet.',
        estimatedSeconds: 90,
        loader: () => import('./Argumentbroen3D'),
        Component: Argumentbroen3D as never,
    },
    'spillereglene-3d': {
        id: 'spillereglene-3d',
        title: 'Spillet trenger regler',
        description:
            'Et spill uten regler er rent kaos: spillerne løper hvor de vil og ballen spretter vilt. Legg på de tre regelnivåene ett om gangen - regler gir banen rammer, loven gir en dommer som håndhever rettferdig, og normene får laget til å samarbeide av seg selv. Aha-en: samfunnet trenger alle tre nivåene sammen for at spillet skal funke.',
        estimatedSeconds: 120,
        loader: () => import('./Spillereglene3D'),
        Component: Spillereglene3D as never,
    },
    'maktskiftet-3d': {
        id: 'maktskiftet-3d',
        title: 'Fredelig maktskifte',
        description:
            'Den skarpeste prøven på et demokrati: kan stemmen din bytte ut dem som styrer? Riv de tre barrierene autoritære system bruker - sensurmur, godkjenningsport og partidommer - og avgi stemmen. Står barrierene, blokkeres stemmen og du er innbygger, ikke medborger. Er de borte, når stemmen fram, den gamle lederen trer av og en folkevalgt reiser seg.',
        estimatedSeconds: 120,
        loader: () => import('./Maktskiftet3D'),
        Component: Maktskiftet3D as never,
    },
    'gudenes-verden-3d': {
        id: 'gudenes-verden-3d',
        title: 'Vekk gudene på Olympen',
        description:
            'Olympen reiser seg i en grå, uforklart verden. Klikk hver sovende gud og vekk den - Zevs himmelen, Poseidon havet, Hades de døde, Demeter åkeren, Afrodite kjærligheten og Athene visdommen. Når alle seks er våkne, lyser hele verden. Lyspæren: hver gud eide sin del av verden, og sammen forklarte de alt grekerne så.',
        estimatedSeconds: 130,
        loader: () => import('./GudenesVerden3D'),
        Component: GudenesVerden3D as never,
    },
    'spleiselaget-3d': {
        id: 'spleiselaget-3d',
        title: 'Spleiselaget',
        description:
            'Velferdsstaten som spleiselag i 3D: koble innbyggerne på felleskassa og se pengene flyte inn etter evne (den med høyest inntekt betaler mest) og ut etter behov (gratis skole, helsehjelp, pensjon). Lyspæren: velferd bærer bare når nesten alle er med - universelt, solidarisk og obligatorisk.',
        estimatedSeconds: 110,
        loader: () => import('./Spleiselaget3D'),
        Component: Spleiselaget3D as never,
    },
    'de-sju-hoydene-3d': {
        id: 'de-sju-hoydene-3d',
        title: 'Bygg Roma på de sju høydene',
        description:
            'Bygg Roma slik arkeologien forteller det, ikke slik myten gjør. Klikk de sju høydene ved elven Tiberen og la en landsby slå seg ned på hver: høydene ga forsvar, elven ga handel. Dra så spaken og tørrlegg sumpen i midten, slik at den blir til Forum, det felles torget. Da smelter de sju landsbyene sammen til én by med mur rundt. Lyspæren: Roma ble ikke reist på én dag av én mann, men vokste sakte fram fordi stedet var perfekt for både forsvar og handel.',
        estimatedSeconds: 150,
        loader: () => import('./DeSjuHoydene3D'),
        Component: DeSjuHoydene3D as never,
    },
    'gobekli-tepe-3d': {
        id: 'gobekli-tepe-3d',
        title: 'Reis tempelet på Magehøyden',
        description:
            'Reis de tunge T-pilarene på Göbekli Tepe i 3D: kall flokken til tauet med spaken og hal steinen opp. Jegerne hadde verken hjul, metall eller pakkdyr - bare mange hender. For hver tyngre pilar må du kalle på enda flere. Lyspæren: en så stor flokk måtte mettes igjen og igjen, og det behovet kan ha drevet fram jordbruket.',
        estimatedSeconds: 150,
        loader: () => import('./GobekliTepe3D'),
        Component: GobekliTepe3D as never,
    },
    'gutenberg-presse-3d': {
        id: 'gutenberg-presse-3d',
        title: 'Gutenbergs presse',
        description:
            'Kjenn boktrykkerkunstens kjerne i 3D: sett de loese metalbokstavene en gang, sverte dem, og dra pressen ned. Saa trykker du den samme siden om og om igjen mens munken i hjoernet fortsatt sliter med sin ene haandkopierte side.',
        estimatedSeconds: 150,
        loader: () => import('./GutenbergPresse3D'),
        Component: GutenbergPresse3D as never,
    },
    'demokrati-lysene-3d': {
        id: 'demokrati-lysene-3d',
        title: 'Demokratiets vaktmester',
        description:
            'Vern demokratiene du tror kan reddes med tre skjold, dra så året fra 1920 til 1939 og se 26 europeiske demokratier slukne. Skjoldene sprekker - der presset var størst, falt lyset uansett. I 1938 er bare 11 igjen.',
        estimatedSeconds: 120,
        loader: () => import('./DemokratiLysene3D'),
        Component: DemokratiLysene3D as never,
    },
    'testudo-3d': {
        id: 'testudo-3d',
        title: 'Bygg skilpadda (testudo)',
        description:
            'Bygg den romerske skilpadda i 3D: klikk legionærene så ytterringen reiser skjoldveggene og de fire i midten legger taket over hodet. Slipp så pilregnet løs og se pilene klatre av skallet. Lyspæren: en mann alene er sårbar, men hver manns skjold på rett plass gjør troppen til en bevegelig festning.',
        estimatedSeconds: 150,
        loader: () => import('./Testudo3D'),
        Component: Testudo3D as never,
    },
    'chinampabyen-3d': {
        id: 'chinampabyen-3d',
        title: 'Bygg byen på vannet',
        description:
            'Bygg aztekernes hovedstad Tenochtitlán i 3D: dra de flytende hagene (chinampas) ut på innsjøen og plant dem. For hver hage vokser matmengden, husene reiser seg på den hellige øya, og folketallet stiger mot 200 000. Lyspæren: aztekerne dyrket mat på vannet, og det smarte jordbruket gjorde det mulig å fø en av verdens største byer.',
        estimatedSeconds: 120,
        loader: () => import('./Chinampabyen3D'),
        Component: Chinampabyen3D as never,
    },
    'kanalbyggeren-3d': {
        id: 'kanalbyggeren-3d',
        title: 'Grav kanalene i Sumer',
        description:
            'Led vannet fra Eufrat og Tigris ut til de tørre åkrene i Mesopotamia: klikk over hver åker for å grave en kanal, og se jorda bli grønn og kornet spire. For hver vannet åker vokser byen i midten, lag for lag, til zigguraten står. Lyspæren: elvene flommet til feil tid, så bøndene måtte grave kanaler og samarbeide for å styre vannet. Samarbeidet og matoverskuddet er en av hovedgrunnene til at verdens første byer vokste fram her.',
        estimatedSeconds: 130,
        loader: () => import('./Kanalbyggeren3D'),
        Component: Kanalbyggeren3D as never,
    },
    'samisk-gjenreising-3d': {
        id: 'samisk-gjenreising-3d',
        title: 'Gjenreis den samiske kulturen',
        description:
            'Fornorskinga prøvde å viske ut samisk språk og kultur. Klikk de fem grå kulturuttrykkene - lávvu, rein, kofte, joik og språk - og vekk dem til live igjen. Når alt er gjenreist, synker internatskolen og det samiske flagget heises. Lyspæren: en kultur kan dempes, men den kan også reise seg igjen.',
        estimatedSeconds: 120,
        loader: () => import('./SamiskGjenreising3D'),
        Component: SamiskGjenreising3D as never,
    },
    'forene-unionen-3d': {
        id: 'forene-unionen-3d',
        title: 'Forene unionen',
        description:
            'Den amerikanske borgerkrigen i 3D: landet starter delt i to, et fritt industrielt Nord og et Sør bygd på slaveri, med en lysende sprekk imellom. Driv historien framover i tre steg - krigen bryter ut (1861), slaveriet avskaffes (1863) der lenkene faller og figurene reiser seg, og unionen samles igjen (1865) der de to halvdelene glir sammen og flagget reiser seg. Lyspæren: krig, frigjøring og samling gjorde et splittet slaveland om til én fri nasjon.',
        estimatedSeconds: 150,
        loader: () => import('./ForeneUnionen3D'),
        Component: ForeneUnionen3D as never,
    },
    'hagia-sofia-3d': {
        id: 'hagia-sofia-3d',
        title: 'Reis Hagia Sofias kuppel',
        description:
            'Bygg bysantinernes mesterverk i tre grep: spenn pendentivene som gjør firkanten om til en sirkel, reis ringen med 40 vinduer, og hev den store kuppelen på plass. Når lyset strømmer inn gjennom vindusringen, ser den tunge kuppelen ut til å sveve. Lyspæren: bysantinerne brukte ny ingeniørkunst - pendentiver og en krans av lys - til å skape en følelse av at himmelen åpnet seg over deg.',
        estimatedSeconds: 140,
        loader: () => import('./HagiaSofia3D'),
        Component: HagiaSofia3D as never,
    },
    'pompeii-3d': {
        id: 'pompeii-3d',
        title: 'Pompeii: byen som ble frosset',
        description:
            'Dra spaken og la Vesuv begrave Pompeii i aske til hele byen forsvinner. Så går 1700 år, asken synker til ruinnivå, og du graver fram tre ting asken har bevart akkurat slik de var i år 79: et fargesterkt veggmaleri, et brød som fortsatt står i ovnen, og en gipsavstøpning av et menneske i sitt siste øyeblikk. Lyspæren: det som ødela Pompeii reddet den også, for den samme asken som kvalte byen forseglet alt - derfor er Pompeii en tidskapsel.',
        estimatedSeconds: 150,
        loader: () => import('./Pompeii3D'),
        Component: Pompeii3D as never,
    },
    'pakk-amerikakofferten-3d': {
        id: 'pakk-amerikakofferten-3d',
        title: 'Pakk amerikakofferten',
        description:
            'Det er 1880-tallet, og familien din skal utvandre til Amerika. Rundt en åpen koffert i stua ligger åtte eiendeler - Bibelen, familiebildet, bestemors sølje, verktøykassa, ullteppet, matsekken, rokken og barnas treleke. Men kofferten har plass til bare fem. Klikk det du vil ta med, bytt om du ombestemmer deg, og lukk lokket. Lyspæren: du kunne bare ta med én koffert, og alt annet - og alle du var glad i - måtte bli igjen.',
        estimatedSeconds: 140,
        loader: () => import('./PakkAmerikakofferten3D'),
        Component: PakkAmerikakofferten3D as never,
    },
    'pyramidebyggeren-3d': {
        id: 'pyramidebyggeren-3d',
        title: 'Bygg Khufus pyramide',
        description:
            'Bygg den store pyramiden ved Giza i 3D, lag for lag. Dra spaken for å bygge en sandrampe høyere, og dra steinblokkene på slede bort til foten av rampen så de sklir opp og låser seg på plass. For hvert lag blir pyramiden høyere, så rampen må bygges enda lenger. Lyspæren: egypterne hadde verken kraner eller maskiner. En lang, slak rampe og tusenvis av hender løftet 2,3 millioner blokker opp.',
        estimatedSeconds: 150,
        loader: () => import('./Pyramidebyggeren3D'),
        Component: Pyramidebyggeren3D as never,
    },
    'bronseruta-3d': {
        id: 'bronseruta-3d',
        title: 'Smi bronse ved Middelhavet',
        description:
            'Smi et bronsesverd i en smie ved Middelhavet rundt 1300 fvt. Dra kobber-barren som ligger rett ved smia, og tinn-barren som må hentes helt fra båten ute på havet, inn i den glødende diglen. Klikk så for å støpe sverdet. Lyspæren: bronse er kobber pluss tinn. Kobber fantes mange steder, men tinn var sjeldent og måtte fraktes tusenvis av kilometer. Hele bronsealderen hvilte derfor på lange, sårbare handelsruter.',
        estimatedSeconds: 130,
        loader: () => import('./Bronseruta3D'),
        Component: Bronseruta3D as never,
    },
    'kalmar-kronene-3d': {
        id: 'kalmar-kronene-3d',
        title: 'Samle de tre kronene',
        description:
            'Dann Kalmarunionen i 3D: klikk kronene til Danmark, Norge og Sverige og se dem samle seg over én trone i 1397. Spol så fram til 1523, da Sverige bryter ut og Norge blir igjen som den svake parten under Danmark. Lyspæren: tre riker under én konge, men makten lå i Danmark, og ubalansen sprengte til slutt unionen.',
        estimatedSeconds: 130,
        loader: () => import('./KalmarKronene3D'),
        Component: KalmarKronene3D as never,
    },
    'pestrute-3d': {
        id: 'pestrute-3d',
        title: 'Pestens reise langs handelsrutene',
        description:
            'Følg Svartedauden fra Svartehavet til Bergen i 3D: klikk neste havn langs handelsruta og se pesten gli fra by til by, husene bli grå, folk falle og dødstallet stige. Lyspæra: de samme handelsrutene som bar rikdom, bar også døden helt til Norge i 1349.',
        estimatedSeconds: 130,
        loader: () => import('./Pestrute3D'),
        Component: Pestrute3D as never,
    },
    'kristendom-spredning': {
        id: 'kristendom-spredning',
        title: 'Kristendommens spredning',
        description:
            'Se kristendommen spre seg pa en roterende globus i 3D: fra 12 disipler i Jerusalem (ar 30) til Romerriket (ar 300), Europa (ar 1000), alle verdensdeler (ar 1500) og 2,4 milliarder i dag. Trykk "Neste epoke" og se byene lyse opp ett steg om gangen.',
        estimatedSeconds: 130,
        loader: () => import('./KristendomSpredning3D'),
        Component: KristendomSpredning3D as never,
    },
    'tikkun-olam-3d': {
        id: 'tikkun-olam-3d',
        title: 'Tikkun Olam - Reparer verden',
        description:
            'Kjenn jødedommens kjerneforpliktelse på kroppen: reparer fire skader i en Jerusalem-by - gi mat til den sultne, fiks veien, tenn Shabbat-lyset, plant et tre. Verdenen lyser opp for hvert grep du tar. Lyspæren: Tikkun Olam er ikke et ideal, det er en daglig plikt.',
        estimatedSeconds: 120,
        loader: () => import('./TikkunOlam3D'),
        Component: TikkunOlam3D as never,
    },
    'samsara-syklusen': {
        id: 'samsara-syklusen',
        title: 'Samsaras kretsløp',
        description:
            'Kjenn buddhismens kjerneinnsikt på kroppen: tre orbiterende gifter - Grådighet, Hat og Uvitenhet - holder sjelen fanget i Samsaras kretsløp. Klikk bort én gift om gangen og se sjelen lysne. Når alle tre er sluknet, oppnår sjelen Nirvana. Lyspæren: "Nirvana" betyr bokstavelig "utblåsing" - som å blåse ut en flamme.',
        estimatedSeconds: 90,
        loader: () => import('./SamsaraSyklusen3D'),
        Component: SamsaraSyklusen3D as never,
    },
    'marsj-mot-roma-3d': {
        id: 'marsj-mot-roma-3d',
        title: 'Marsjen mot Roma',
        description:
            'Oktober 1922: fascistkolonnene nærmer seg Roma. Klikk de tre elementene og avdekk det historiske paradokset - marsjen lyktes ikke fordi fascistene var sterke, men fordi kongen ga seg.',
        estimatedSeconds: 140,
        loader: () => import('./MarsjenMotRoma3D'),
        Component: MarsjenMotRoma3D as never,
    },
    'moksha-veien-3d': {
        id: 'moksha-veien-3d',
        title: 'Atman søker Brahman',
        description:
            'Kjenn hinduismens kjerneidé på kroppen: Atman (sjelen) kretser rundt Brahman (det universelle) fanget i Samsara. Aktiver de tre yoga-veiene - Karma Yoga, Jnana Yoga og Bhakti Yoga - og se sjelen spirale innover og smelte inn i Brahman. Lyspæren: Atman og Brahman er identiske - gjenforeningen ER Moksha.',
        estimatedSeconds: 90,
        loader: () => import('./MokshaVeien3D'),
        Component: MokshaVeien3D as never,
    },
    'vekten-i-wien-3d': {
        id: 'vekten-i-wien-3d',
        title: 'Vekten i Wien',
        description:
            'Etter Napoleon var Frankrike blitt en kjempe. Dra de fire stormaktene Storbritannia, Russland, Preussen og Østerrike opp på den tomme siden av vippevekten, og se at den først blir vannrett når alle fire er på plass. Lyspæren: det krevde flere stormakter sammen å balansere én sterk stat, og denne maktbalansen holdt Europa stabilt i nesten hundre år.',
        estimatedSeconds: 90,
        loader: () => import('./VektenIWien3D'),
        Component: VektenIWien3D as never,
    },
    'vesterleden-3d': {
        id: 'vesterleden-3d',
        title: 'Vesterleden: fra øy til øy mot Amerika',
        description:
            'Dra et langskip vestover over Nord-Atlanteren, hav for hav, fra Norge til Island, Grønland og Vinland. Hver kyst du bosetter blir basen for neste sprang. Lyspæren: vikingene nådde Amerika rundt 500 år før Columbus ved å hoppe fra øy til øy, og Vinland ble oppgitt fordi det lå for langt unna til å få forsterkninger.',
        estimatedSeconds: 140,
        loader: () => import('./Vesterleden3D'),
        Component: Vesterleden3D as never,
    },
    'rismark-og-makt-3d': {
        id: 'rismark-og-makt-3d',
        title: 'Ris er makt',
        description:
            'Dyrk rismarkene i en daimyos len. For hver mark du planter fylles lageret med koku, borgen vokser en etasje, og en ny samurai stiller seg ved porten. Lyspæren: makt i føydale Japan var bygd på ris. Jo mer en daimyo kunne høste, desto flere krigere kunne han fø, og desto mektigere ble han.',
        estimatedSeconds: 140,
        loader: () => import('./RismarkOgMakt3D'),
        Component: RismarkOgMakt3D as never,
    },
    'gangen-3d': {
        id: 'gangen-3d',
        title: 'Gangen: klokkas hemmelighet',
        description:
            'Bygg et mekanisk urverk steg for steg. Heng på loddet og se hjulet rase vilt av gårde, sett så inn gangen så det tikker jevnt, og still pendelen til klokka går rett. Lyspæren: gangen gjør den ujevne kraften fra loddet om til faste, tellbare tikk, og pendelen bestemmer takten.',
        estimatedSeconds: 150,
        loader: () => import('./Gangen3D'),
        Component: Gangen3D as never,
    },
    'falltaarnet-3d': {
        id: 'falltaarnet-3d',
        title: 'Falltårnet i Pisa',
        description:
            'Bær en tung jernkule og en lett trekule opp i toppen av det skjeve tårnet i Pisa, velg en verden og slipp dem. I Aristoteles verden faller den tunge raskest, slik alle trodde i 2000 år. I virkeligheten lander de helt likt, akkurat som Galileo målte. Lyspæren: tunge og lette ting faller like fort, og Galileos store grep var å sjekke selv i stedet for å tro på autoriteten.',
        estimatedSeconds: 140,
        loader: () => import('./Falltaarnet3D'),
        Component: Falltaarnet3D as never,
    },
    'rent-vann-rorene-3d': {
        id: 'rent-vann-rorene-3d',
        title: 'Den usynlige revolusjonen',
        description:
            'Et tverrsnitt av en syk by på 1800-tallet: under bakken siver avføring fra en utedo ned i grunnvannet og forgifter brønnen folk drikker fra. Klikk de gule punktene to og to for å legge ror: et kloakkror som leder det skitne vekk, og et rent vannror fra vanntårnet til husene. For hvert ror klarner grunnvannet og folk blir friskere, til byen er frisk. Lyspæren: byene ble reddet ikke av medisin, men ved å skille det rene vannet fra det skitne, en av de mest oversette revolusjonene i historien.',
        estimatedSeconds: 140,
        loader: () => import('./RentVannRorene3D'),
        Component: RentVannRorene3D as never,
    },
    'sjoimperiet-3d': {
        id: 'sjoimperiet-3d',
        title: 'Bygg sjøimperiet',
        description:
            'Portugal var et lite land, men styrte verdenshandelen. Klikk knutepunktene langs sjøveien til India - Ceuta, Elmina, Kapp det gode håp, Goa og Malakka - og reis kjeden av befestede handelsstasjoner. For hver festning lyser en ny etappe av ruten opp, og krydderskipet seiler videre mot kilden. Lyspæren: et sjøimperium (thalassokrati) ble bygd ved å kontrollere knutepunktene langs ruten, ikke ved å erobre store landområder.',
        estimatedSeconds: 150,
        loader: () => import('./Sjoimperiet3D'),
        Component: Sjoimperiet3D as never,
    },
    'smitten-i-byen-3d': {
        id: 'smitten-i-byen-3d',
        title: 'Stopp smitten i byen',
        description:
            'Spanskesyken sprer seg hus for hus gjennom en liten norsk by i 1918. Klikk de tre tiltakene - steng skolen, steng kirken og isoler de syke - og dra tidsspaken for å la ukene gå. Uten tiltak blir nesten hele byen syk; med tiltak holder de fleste husene seg friske. Lyspæren: byer som stengte samlingssteder tidlig mistet langt færre mennesker. Å kutte kontakt er det sterkeste våpenet mot en epidemi.',
        estimatedSeconds: 150,
        loader: () => import('./SmittenIByen3D'),
        Component: SmittenIByen3D as never,
    },
    'fimbulvinteren-3d': {
        id: 'fimbulvinteren-3d',
        title: '536 - Fimbulvinteren',
        description:
            'Året 536 ble verden rammet av en av historiens verste klimakatastrofer. Utløs vulkanutbruddet, dra støvskyen over himmelen og se hele verdenen reagere: solen dovner og krymper, himmelen gråner, avlingene visner og det snør om sommeren. Sollys og temperatur faller mens du drar. Til slutt: hva trodde folk i Norden de opplevde? Lyspæren: det var ikke solen som døde - et slør av vulkanstøv stengte sollyset ute i flere år, kulda drepte avlingene og kan ha tatt halve Norges befolkning. Minnet kan ha farget myten om Fimbulvinteren.',
        estimatedSeconds: 140,
        loader: () => import('./Fimbulvinteren3D'),
        Component: Fimbulvinteren3D as never,
    },
    'personalunion-3d': {
        id: 'personalunion-3d',
        title: 'Hva ble Norge i 1814?',
        description:
            'Dra en spak gjennom tre modeller for forholdet mellom Norge og Sverige, og se landene, kronene og flaggene forvandle seg: to selvstendige land med hver sin konge, personalunionen fra 1814 der de deler én konge men Norge beholder sitt eget flagg og sin egen stat, eller full innlemmelse der Norge slukes inn i Sverige. Finn hvilken modell Norge faktisk ble i 1814. Lyspæren: personalunionen ligger midt imellom - Norge delte bare kongen og utenrikspolitikken, alt annet var vårt eget.',
        estimatedSeconds: 130,
        loader: () => import('./Personalunion3D'),
        Component: Personalunion3D as never,
    },
    'dorer-som-apnet-3d': {
        id: 'dorer-som-apnet-3d',
        title: 'Dørene som åpnet seg',
        description:
            'Dra et år-spak framover fra 1875 til 1913 og se hvordan stengte dører åpner seg for kvinner, en etter en: utdanning (1884), egen lønn (1888), kommunal stemmerett (1901) og full stemmerett (1913). En kvinnefigur går gjennom hver dør som åpnes. Lyspæren: rettigheter vi tar for gitt i dag var stengte dører, og de ble åpnet gjennom flere tiår med organisert kamp.',
        estimatedSeconds: 120,
        loader: () => import('./DorerSomApnet3D'),
        Component: DorerSomApnet3D as never,
    },
    'republikkens-soyler-3d': {
        id: 'republikkens-soyler-3d',
        title: 'Republikkens tre søyler',
        description:
            'Etter at amerikanerne hadde beseiret en konge, delte grunnloven fra 1787 makten i tre. Fordel tre maktklosser på de tre statsmaktene - Kongressen som lager lovene, presidenten som styrer, og Høyesterett som dømmer. Legg én på hver, og taket over «Republikken» lyser opp og står stødig. Stabler du to på samme søyle, blir den for mektig: taket tipper, og en gullkrone senker seg ned over den. Lyspæren: makten må deles likt mellom de tre, ellers kan én av dem vokse seg til en ny konge.',
        estimatedSeconds: 130,
        loader: () => import('./RepublikkensSoyler3D'),
        Component: RepublikkensSoyler3D as never,
    },
    'persepolis-gaver-3d': {
        id: 'persepolis-gaver-3d',
        title: 'Persepolis: gavene til storkongen',
        description:
            'I Persepolis, det persiske rikets seremonielle hovedstad, møttes utsendinger fra hele riket for å gi gaver til kongen. Dra fem folkeslag fram til tronen, ett om gangen: lyderne med gullkar fra dagens Tyrkia, armenerne med en vinkrukke fra Kaukasus, inderne med gullstøv fra Indusdalen, babylonerne med fint vevd tøy fra Irak og nubierne med elfenbein helt fra Afrika. Legg merke til at hvert folk har sin egen drakt og sin egen gave, men alle bøyer seg for den samme kongen. Lyspæren: Perserriket var verdens første verdensrike fordi det holdt dusinvis av ulike folk samlet i ett rike, ved å la hvert folk beholde sitt eget, samtidig som alle anerkjente én konge.',
        estimatedSeconds: 150,
        loader: () => import('./PersepolisGaver3D'),
        Component: PersepolisGaver3D as never,
    },
    'marshallhjelpen-3d': {
        id: 'marshallhjelpen-3d',
        title: 'Marshallhjelpen: gaven som delte Europa',
        description:
            'Europa ligger i ruiner i 1948, og et amerikansk lasteskip har lagt til kai med hjelpekasser. Dra kassene til de utbombede byene i vest og se dem reise seg: nye hus, lys i vinduene og fabrikker i gang - mens telleren viser hvor mye av pengene som ble brukt på amerikanske varer. Prøver du å hjelpe byene i øst, sier Stalin nei, og et rødt jernteppe reiser seg langs grensen. Lyspæren: hjelpen bygde Vest-Europa opp - og gjorde delingen av Europa synlig. Gaven og jernteppet var to sider av samme år.',
        estimatedSeconds: 150,
        loader: () => import('./Marshallhjelpen3D'),
        Component: Marshallhjelpen3D as never,
    },
    'gasskranen-3d': {
        id: 'gasskranen-3d',
        title: 'Gasskranen: rørene som styrte Europa',
        description:
            'Først sitter du i Kreml med hånden på gasskranen: vri på hjulet og se lysene og fabrikkene i tre europeiske byer dempes og tennes i takt med gassen - og pengene som strømmer inn. Så bytter du side: det er 2022, kranen er strupt, og du må bygge Europa fritt med LNG-havn, vindmøller og rør fra Norge til byene lyser igjen uten russisk gass. Lyspæren: gass er bare et våpen så lenge ingen har alternativer. Da Europa bygde seg fri, mistet kranen makten.',
        estimatedSeconds: 150,
        loader: () => import('./Gasskranen3D'),
        Component: Gasskranen3D as never,
    },
    'gjeldshavna-3d': {
        id: 'gjeldshavna-3d',
        title: 'Gjeldshavna: lånet som tok havna',
        description:
            'Du styrer et lite kystland som drømmer om en storhavn, og et kinesisk lasteskip ligger klar med lånetilbud. Velg stort eller lite lån gjennom tre byggerunder og se havna vokse - mens gjelden vokser fortere enn inntektene. På nedbetalingsdagen kommer regningen: tok du for store lån, må du leie bort havna in 99 år, og flagget byttes ut. Bygget du forsiktig, beholder du kontrollen. Basert på Sri Lanka 2017. Lyspæren: makt flyttes uten soldater - den som eier gjelden, kan ende med å eie havna.',
        estimatedSeconds: 160,
        loader: () => import('./Gjeldshavna3D'),
        Component: Gjeldshavna3D as never,
    },
    'trelastruta-3d': {
        id: 'trelastruta-3d',
        title: 'Trelastruta: fra skog til Amsterdam',
        description:
            'En norsk elv renner fra skogen til havna. Dra en tømmerstokk ut i elva, så bærer strømmen den gratis ned til sagbruket ved fossen. Slipp vannet på saghjulet, og oppgangssaga skjærer stokken til jevne planker. Til slutt drar du plankestabelen om bord i det hollandske skipet, som seiler mot Amsterdam. Lyspæren kommer i hendene: på nesten hvert steg gjør naturen (elva og fossen) det tunge arbeidet gratis, og det var derfor skogen gjorde Norge rikt i dansketiden.',
        estimatedSeconds: 150,
        loader: () => import('./Trelastruta3D'),
        Component: Trelastruta3D as never,
    },
    'smi-det-tyske-riket-3d': {
        id: 'smi-det-tyske-riket-3d',
        title: 'Smi det tyske riket',
        description:
            'På midten av 1800-tallet var «Tyskland» dusinvis av spredte småstater. Dra hver tyske stat inn på kartbordet, en etter en, og se dem klikke sammen til én form. Når den siste staten låser seg på plass, reiser keiserflagget seg - Tyskland er samlet i 1871. Bismarck ser på fra kanten. Lyspæren ligger i selve grepet: mange selvstendige biter blir føyd sammen til én nasjon, akkurat slik nasjonssamlingen skjedde.',
        estimatedSeconds: 140,
        loader: () => import('./SmiDetTyskeRiket3D'),
        Component: SmiDetTyskeRiket3D as never,
    },
    'broen-til-fortiden-3d': {
        id: 'broen-til-fortiden-3d',
        title: 'Broen til fortiden',
        description:
            'Byen til høyre er nåtiden. Tre øyer fra landets fortid synker sakte i glemselens tåke, og bare én av dem er gullalderen landet holder festtaler om. Klikk riktig øy og se minnebroen av lys bygge seg over til den - velger du feil, knekker broen og tiden renner ut. Fire land skal ha hver sin bro: USA, Frankrike, Kina og Japan. Lyspæren: en nasjonal fortelling er en bro noen VELGER å bygge til en bestemt fortid, mens resten synker i glemsel.',
        estimatedSeconds: 180,
        loader: () => import('./BroenTilFortiden3D'),
        Component: BroenTilFortiden3D as never,
    },
    'vend-mot-mekka': {
        id: 'vend-mot-mekka',
        title: 'Vend mot Mekka',
        description:
            'Dra bønneteppet ditt rundt til pilen peker mot Kaba, det svarte huset i Mekka. To andre bedende står allerede vendt mot samme punkt fra hver sin kant, så du ser at alle retningene møtes i Mekka. Lyspæren: uansett hvor i verden en muslim er, vender hen seg mot det samme punktet når hen ber. Retningen kalles qibla, og den binder over en milliard mennesker sammen.',
        estimatedSeconds: 110,
        loader: () => import('./VendMotMekka3D'),
        Component: VendMotMekka3D as never,
    },
};

export function getMicroGame(id: string) {
    return MICRO_GAMES[id];
}
