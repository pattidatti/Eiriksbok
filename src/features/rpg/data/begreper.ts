// Minnetreet: begrepene eleven erverver ved å bruke dem, ikke ved å lese dem.
//
// Regelen fra blueprintens §7.4 er hele poenget: du kan `[Klinkbygging]` fordi
// du har bygget et skrog som fløt. Ingen node løftes til `forstatt` av et
// quizsvar - `forstasVed` sier hva som faktisk må gjøres, og det er den eneste
// veien opp.
//
// Tre tilstander: **ukjent** (hun har ikke møtt det), **hørt** (noen har sagt
// det), **forstått** (hun har gjort det). Bare det siste teller i «Min læring».

import type { BegrepDef } from '../types';

export const BEGREPER: BegrepDef[] = [
    {
        id: 'klinkbygging',
        navn: 'Klinkbygging',
        forklaring:
            'Bordene i skroget ligger over hverandre som takstein på et tak, og naglene binder dem sammen. Skroget blir lett og bøyer seg med bølgene i stedet for å brekke.',
        forstasVed: 'Bygg et skrog som flyter.',
        replikk:
            'Bordene ligger over hverandre. Det skipet er bygget for åpent hav - ikke for elva her.',
    },
    {
        id: 'breddegradseiling',
        navn: 'Breddegradseiling',
        forklaring:
            'Uten kompass holder du kursen på solhøyden ved middag. Kommer sola for høyt, har du drevet sør. Fugler, drivved og skyer over land forteller resten.',
        forstasVed: 'Naviger fra Nordvik til Lindisfarne uten å bomme på breddegraden.',
        replikk: 'Jeg trenger ikke vite hvor jeg er. Jeg trenger å vite at jeg ligger like høyt.',
    },
    {
        id: 'haerferd',
        navn: 'Hærferd',
        forklaring:
            'Å dra i viking var et sommeryrke, ikke et folkeslag. Bøndene sådde om våren, seilte om sommeren og var hjemme til slåtten. «Viking» var noe du gjorde.',
        forstasVed: 'Gjør ferden vestover og kom hjem igjen.',
        replikk: 'Vi er ikke vikinger. Vi drar i viking. Det er ikke det samme.',
    },
    {
        id: 'samtidig-kilde',
        navn: 'Samtidig kilde',
        forklaring:
            'En kilde skrevet i samme tid som det den forteller om. Den står nærmere enn en som kommer hundre år etter - men nær i tid er ikke det samme som å ha vært der, og en samtidig kilde kan ta side like hardt som en sen.',
        forstasVed: 'Vei Alkuins brev og den angelsaksiske krøniken mot hverandre.',
        replikk: 'Han skrev det samme året. Han satt bare tusen mil unna da han skrev det.',
    },
    {
        id: 'kildetaushet',
        navn: 'Kildetaushet',
        forklaring:
            'Når ingen skrev noe ned, står det ingenting igjen. Det betyr ikke at ingenting hendte - det betyr at vi ikke kan vite det, og at de som kunne skrive, sitter igjen med ordet.',
        forstasVed: 'Let etter en norrøn kilde om Lindisfarne, og finn ingen.',
        replikk: 'Det står ingenting om oss. Det er ikke fordi vi ikke var der.',
    },
    {
        id: 'uavhengige-kilder',
        navn: 'Uavhengige kilder',
        forklaring:
            'To kilder som forteller det samme, teller bare som to hvis de ikke har det fra hverandre. Har den ene skrevet av den andre, sitter du med én kilde sagt to ganger - og noe blir ikke sannere av å bli gjentatt.',
        forstasVed: 'Finn ut hvor Snorre har opplysningene sine om Hafrsfjord fra.',
        replikk: 'Alle sier det samme, ja. De har det fra samme mann.',
    },
    {
        id: 'datering',
        navn: 'Datering',
        forklaring:
            'Et årstall i en historiebok er ikke alltid noe en kilde sier. Ofte er det noe noen har regnet seg fram til ved å telle bakover fra noe de var sikre på. Regner en annen litt annerledes, flytter årstallet seg.',
        forstasVed: 'Let etter året 872 i kildene om Hafrsfjord, og finn at ingen av dem gir det.',
        replikk: 'Hvilket år? Vi teller vintrer her, ikke år.',
    },
    {
        id: 'aarshjulet',
        navn: 'Årshjulet',
        forklaring:
            'Et bondeår har en rekkefølge ingen kan bytte om på. Såing om våren, ferd og ting om sommeren, innhøsting og slakt om høsten, og så vinteren, som lever av alt det andre. Derfor var vikingferdene sommerferder: det er den ene årstiden gården klarer seg uten deg.',
        forstasVed: 'Så åkeren selv, i tide.',
        replikk: 'Vi drar ikke om høsten. Om høsten er kornet ute.',
    },
    {
        id: 'husfrue',
        navn: 'Husfrue',
        forklaring:
            'Kona på gården styrte alt innenfor dørstokken, og nøklene i beltet var tegnet på det. Var mannen borte - på ferd, i krig, død - styrte hun alt utenfor også. Det var ikke et unntak. Det var slik en gård overlevde at menn dro.',
        forstasVed: 'Styr Nordvik gjennom et helt år, og få gården gjennom vinteren.',
        replikk: 'Jeg spør ikke ham. Nøklene henger her.',
    },
    {
        id: 'gjengave',
        navn: 'Gjengave',
        forklaring:
            'En gave er aldri bare en gave. Den som tar imot, står i gjeld til han har gitt noe tilbake - og gjerne litt mer. Det er ikke høflighet, det er forsikring: i et samfunn uten stat er det bare de som skylder deg noe, som kommer når det brenner.',
        forstasVed: 'Gi korn til naboætta i sommer, og se hva som kommer tilbake om vinteren.',
        replikk: 'Jeg ga da de ikke hadde. Nå har de.',
    },
    {
        id: 'leidang',
        navn: 'Kongens krav',
        forklaring:
            'En konge som holder på å samle et land, må ha mat, skip og menn - og han henter det fra gårdene. Å gi er å velge side, og å nekte er også å velge side. Ordningen som senere ble hetende leidang, vokste ut av nettopp dette.',
        forstasVed: 'Svar kongens mann, eller la være, og bær følgen.',
        replikk: 'Han kom ikke hit for å be.',
    },
    {
        id: 'trell',
        navn: 'Trell',
        forklaring:
            'En trell var ufri. Han eide ingenting, kunne ikke føre sak på tinget, og skulle ikke bære våpen - et våpen i hendene på en ufri mann er et våpen som kan snu seg. Mange treller var tatt på ferd, som krigsbytte. En trell kunne bli frigitt, men frigitt var ikke det samme som fri født.',
        forstasVed: 'Gi Kåre et spyd, og se hva det gjør med alt annet om ham.',
        replikk: 'Jeg har aldri holdt et våpen. Det er ikke lov.',
    },
    {
        id: 'mannebot',
        navn: 'Mannebot',
        forklaring:
            'Et drap ble ikke straffet med fengsel - det fantes ikke. Det ble gjort opp i sølv, og prisen sto etter hvem den drepte var: en hauld kostet mer enn en fri karl, og en trell var eierens tap. Men boten forutsatte at drapet var lyst. Det som ikke ble lyst, var mord, og mord kunne ingen kjøpe seg fri fra.',
        forstasVed: 'Før en drapssak på tinget, fra lysing til dom.',
        replikk: 'Femti mark for en fri mann. Du krever for mye, Einar.',
    },
    {
        id: 'aetten',
        navn: 'Ætta',
        forklaring:
            'Det finnes ingen konge, ingen lensmann og ingen hær som kommer når noen står i tunet ditt med spyd. Det finnes ætta di og naboene dine - og de kommer hvis de skylder deg noe. Derfor er en gave ikke sløsing, og derfor er et rykte ikke forfengelighet.',
        forstasVed: 'Møt dem som kommer for å ta gården, og se hvem som står ved siden av deg.',
        replikk: 'Hvem skulle jeg sendt bud til? Det er ingen andre enn oss.',
    },
    {
        id: 'sed',
        navn: 'Den gamle sida',
        forklaring:
            'Den norrøne gudetroen var ikke en tro med en bok, en menighet og et sett læresetninger. Den var en sed: noe folk gjorde til rett tid, slik det alltid var gjort. Ingen spurte hva du mente om Tor. De spurte om du kom til blotet. Derfor het det ikke å bytte tro, men å ta den nye sida.',
        forstasVed: 'Gå inn i hovet, og se hva som ikke finnes der.',
        replikk: 'Ingen har spurt meg hva jeg tror. Jeg ville ikke visst hva jeg skulle svare.',
    },
    {
        id: 'blot',
        navn: 'Blot',
        forklaring:
            'Et blot var et gjestebud der gudene var med. Man ga noe som kostet: et dyr gården hadde bruk for, oftest en hest om høsten. Blodet ble samlet i en bolle og stenket på folk og vegger, kjøttet ble kokt, og begrene gikk rundt ilden - til Odin for makt, til Frøy for godt år og fred, og til slekta i haugene. Gaven måtte passe til guden: Frøy gir avling, Odin gjør ikke det.',
        forstasVed: 'Hold et blot der gaven passer til guden og til tiden.',
        replikk: 'Ingen ba deg tro på noe. De ba deg komme.',
    },
    {
        id: 'holmgang',
        navn: 'Holmgang',
        forklaring:
            'En tvekamp med lov og regler: en utstrakt hud på fem alen, tre skjold hver, og ingen som får blande seg. Går du utenfor huden, har du veket. Den som blør på huden, har tapt - men han dør ikke, han betaler tre mark sølv og saken er ute av verden. Ordningen ble misbrukt av folk som var gode med sverd og krevde andres jord, og den ble forbudt like etter år 1000.',
        forstasVed: 'Gå en holmgang, og la reglene avgjøre den.',
        replikk: 'Nekter du, er du niding. Og en niding kan ingen ta i hånden.',
    },
    {
        id: 'kristningen',
        navn: 'Kristningen',
        forklaring:
            'Norge ble ikke kristnet nedenfra, av folk som skiftet mening. Det ble kristnet ovenfra, av konger som hadde bruk for det - og det skjedde én gård av gangen. Husbonden svarte for hver eneste sjel innenfor dørstokken, og den som sa ja fikk gaver, handel og en konge i ryggen. Kirken ble ofte reist der hovet hadde stått, for folk kom dit fra før.',
        forstasVed: 'Svar kongens mann på vegne av hele gården, og se hva som reises i lia året etter.',
        replikk: 'Du tror dette handler om guder. Det handler om hvem som får handle med hvem.',
    },
    {
        id: 'primsigning',
        navn: 'Primsigning',
        forklaring:
            'Korsets tegn uten dåp. Den primsignede fikk handle og spise med kristne og være i huset deres, men var ikke bundet av dåpen og kunne fortsatt blote. Kjøpmenn brukte det flittig: en fot i hver leir, og ingen som spurte for nøye. Det er den beste påminnelsen om at kristningen tok flere hundre år og ikke ett møte.',
        forstasVed: 'Møt kongens krav med korsets tegn i stedet for dåpen.',
        replikk: 'Jeg har korset på meg i Jorvik og hammeren på meg her. Begge deler er ekte nok.',
    },
    {
        id: 'partiskhet',
        navn: 'Hvem gagner fortellingen?',
        forklaring:
            'Alle kilder er skrevet av noen, for noen, med en hensikt. Spørsmålet er ikke om kilden lyver, men hvem som tjener på at det fortelles akkurat slik. En runestein er betalt av den som reiste den. En kongesaga er skrevet for kongsætta. Linsen kan legges på hva som helst - også på en lærebok.',
        forstasVed: 'Vei to kristne kilder om kristningen mot hverandre, og finn ut hvem hver av dem tjener.',
        replikk: 'Noe kan være sant og gagne noen samtidig. Det er ikke det samme spørsmålet.',
    },
    {
        id: 'vinnerens-penn',
        navn: 'Vinnerens penn',
        forklaring:
            'Alt vi vet om den gamle norrøne sida, er skrevet av folk som mente den var feil. De som holdt fast, etterlot seg ikke én setning om hvorfor - de kunne ikke skrive, og de som kunne, var kristne. Da må man lese vinnernes tekster og hele tiden spørre hva de utelot. Det som står der selv om det skader den som skrev, er ofte det sikreste du har.',
        forstasVed: 'Let etter noe skrevet av dem som sa nei til dåpen, og finn ingenting.',
        replikk: 'Du holdt et blot. Ingenting av det står noe sted.',
    },
    {
        id: 'bondehaeren',
        navn: 'Bondehæren',
        forklaring:
            'Hæren som møtte Olav Haraldsson på Stiklestad kalles bondehæren, og bønder var med. Men den ble kalt ut, ledet og betalt av stormenn som hadde mistet makt til kongen - Kalv Arnesson og Tore Hund - og pengene kom fra Knut den mektige i Danmark og England. Nesten alle som sto der var døpt, på begge sider. Det var ikke en strid mellom to guder.',
        forstasVed: 'Ta imot budstikka, og finn ut hvem som holder i den andre enden.',
        replikk: 'De har sølv fra Knut den mektige. Vi har ljåer.',
    },
    {
        id: 'skjoldborg',
        navn: 'Skjoldborg',
        forklaring:
            'En rekke der skjoldene ligger kant i kant. Skjoldet ditt dekker deg og halve mannen til venstre for deg, og mannen til høyre dekker halve deg - ingen står bak sitt eget skjold alene. Går én fram, åpner han et hull, og naboen faller. Derfor vant den siden som greide å stå stille lengst, ikke den som slo hardest. Spydet er våpenet i rekka; en øks trenger albuerom, og albuerom finnes ikke der inne.',
        forstasVed: 'Stå i en skjoldborg til den holder, uten å gå fram.',
        replikk: 'Den som løper fram, dreper mannen ved siden av seg. Det er ikke et ordtak.',
    },
    {
        id: 'nordvegen',
        navn: 'Nordvegen',
        forklaring:
            'Landet har ikke noe navn ennå. Det folk kjenner, er seilingsleia langs kysten - veien mot nord. Det er den som til slutt blir hetende Noreg.',
        forstasVed: 'Les runesteinen ved veien.',
        replikk: 'Dere kaller det ikke et land. Dere kaller det en vei.',
    },
];

export const BEGREP_BY_ID: Record<string, BegrepDef> = Object.fromEntries(
    BEGREPER.map((b) => [b.id, b])
);
