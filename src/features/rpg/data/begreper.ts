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
