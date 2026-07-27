import type { AuthoredQuest, BankQuestion, FarkostDef, LandmarkDef, NpcDef } from '../types';

// Nordvik - den ferdige sonen. Alt her er håndlaget: hvor folk står, hva de
// vet, og hvilke svar som ligger gjemt i verden.
//
// Regelen for sonen: hvert spørsmål eleven får, har et svar som finnes et sted
// på kartet. Enten sier en NPC det, eller så står det på en runestein. Eleven
// skal aldri måtte gjette - hun skal måtte lete.

export const NORDVIK_SIZE = { bredde: 64, hoyde: 48 };

// Der spilleren våkner.
export const NORDVIK_SPAWN: [number, number] = [14, 30];

/**
 * Færingen ved brygga. Den ligger fortøyd rett nord for bryggeenden, i vann på
 * alle kanter, så eleven må gå helt ut på plankene for å komme om bord.
 *
 * Nord for brygga, ikke sør: brygga er usjøbar, og sør for den stenger fjellet
 * fjorden etter tre-fire ruter. En båt fortøyd på sørsiden ligger i en lomme
 * den ikke kommer ut av. Nordover er leia åpen helt til fjellet i nord.
 *
 * Én båt og ett sete. Knarren som skal bære henne til Lindisfarne kommer med
 * kapittel 1; dette er verbet, ikke reisen.
 */
export const NORDVIK_FARKOSTER: FarkostDef[] = [
    {
        id: 'nordvik-faering',
        navn: 'færingen',
        art: 'baat',
        tile: [2, 40],
        seter: 1,
        fart: 74,
        // Nesten et helt sekund på å komme i gang og på å legge seg. Det er
        // mye tregere enn beina, og det er meningen: en båt skal kjennes som
        // noe som bærer deg, ikke som noe du styrer med fingrene.
        treghet: 620,
    },
];

export const NORDVIK_NPCS: NpcDef[] = [
    {
        id: 'gudrun',
        name: 'Gudrun Husfrue',
        role: 'Herre over langhuset',
        tile: [17, 28],
        palette: { tunic: '#7a3b5e', trim: '#e8c96a', hair: '#a5581f' },
        smalltalk: [
            'Nøklene i beltet mitt er ikke pynt. De sier hvem som styrer gården.',
            'Tåka kom i vår. Først glemte vi navn. Så glemte vi at vi hadde glemt.',
            'Spis noe. Du ser ut som en som har gått langt.',
        ],
        kunnskap: [
            {
                tekst: 'Nøklene jeg bærer i beltet er tegnet på makten og ansvaret mitt over gården. Husfrua styrer alt innenfor dørstokken.',
                stikkord: ['nøkl'],
            },
            {
                tekst: 'Vi har treller her. De er ufrie og har ingen rettigheter i det hele tatt. Slik er det - men jeg liker det ikke.',
                stikkord: ['trell', 'ufri'],
            },
        ],
    },
    {
        id: 'orm',
        name: 'Orm Båtbygger',
        role: 'Han som kjenner skipet',
        tile: [9, 36],
        palette: { tunic: '#3c5a6b', trim: '#cfd8c0', hair: '#5b3a1a' },
        smalltalk: [
            'Et skip er ikke planker. Det er en tanke som flyter.',
            'Kjenn på bordet her. Kjenner du hvordan de ligger over hverandre?',
            'Faren min bygde etter øyemål. Jeg bygger etter øyemål. Det holder.',
        ],
        kunnskap: [
            {
                tekst: 'Vi legger bordene over hverandre, som takstein på et tak. Det kalles klinkbygging. Det gjør skroget både lett og sterkt.',
                stikkord: ['klinkbygg', 'over hverandre'],
            },
            {
                tekst: 'Skipet stikker knapt ned i vannet. Grunt dypgående, kaller vi det. Derfor kan vi seile langt opp elvene og komme brått på folk.',
                stikkord: ['dypgående', 'elver'],
            },
            {
                tekst: 'Det siste og viktigste steget var seilet. Da båtene fikk seil, kunne vi krysse åpent hav. Før det holdt vi oss langs land.',
                stikkord: ['seil'],
            },
        ],
    },
    {
        id: 'torhild',
        name: 'Torhild Lovsigemann',
        role: 'Hun som husker lovene',
        tile: [38, 22],
        palette: { tunic: '#4a5f3c', trim: '#e0d8b0', hair: '#c9c9c9' },
        smalltalk: [
            'Loven bor ikke i en bok. Den bor i hodet mitt. Det er derfor tåka er farlig.',
            'På tinget er alle frie menn like store. Nesten.',
            'Si det høyt. Det du sier høyt, glemmer du seinere.',
        ],
        kunnskap: [
            {
                tekst: 'Tinget er en hellig plass. Der diskuterer vi, der dømmer vi, og der vedtar vi lovene våre.',
                stikkord: ['tinget'],
            },
            {
                tekst: 'På Island grunnla de et ting for hele øya i år 930. De kaller det Alltinget.',
                stikkord: ['alltinget', '930'],
            },
            {
                tekst: 'I 1024 kom Kristenretten. Nye lover bygget på kristne verdier - blant annet ble det forbudt å sette ut barn.',
                stikkord: ['kristenrett', '1024'],
            },
        ],
    },
    {
        id: 'leiv',
        name: 'Leiv Langfar',
        role: 'Han som har sett vestover',
        tile: [48, 34],
        palette: { tunic: '#6b4a2f', trim: '#9ec8e0', hair: '#f0d27a' },
        smalltalk: [
            'Jeg har sett land der ingen av dere tror det finnes land.',
            'Ja da. Lengre vest enn Island. Lengre vest enn Grønland.',
            'Tro meg eller la være. Havet bryr seg ikke om hva du tror.',
        ],
        kunnskap: [
            {
                tekst: 'Vi kalte det Vinland fordi det vokste ville druer der. Vin-land. Enkelt, egentlig.',
                stikkord: ['vinland', 'druer'],
            },
            {
                tekst: 'Harald Hårfagre vant ikke i Hafrsfjord alene. Han allierte seg med ladejarlene fra Trøndelag.',
                stikkord: ['ladejarl', 'hafrsfjord', 'hårfagre'],
            },
        ],
    },
    {
        id: 'aslak',
        name: 'Aslak Munk',
        role: 'Den nye troen',
        tile: [30, 12],
        palette: { tunic: '#2f2f3a', trim: '#e8e0c8', hair: '#2b2118' },
        smalltalk: [
            'Jeg skriver det ned. Det er hele forskjellen på oss og de før oss.',
            'Kongen døpte dem. Noen med vann. Noen med sverd.',
            'Om hundre år vet folk hva som skjedde her. Fordi jeg satt her og skrev.',
        ],
        kunnskap: [
            {
                tekst: 'Århundrene før vikingtiden kaller vi merovingertiden - eller «de stille århundrene». Nesten ingen skrev noe ned da.',
                stikkord: ['stille århundre', 'merovinger'],
            },
            {
                tekst: 'Derfor vet vi så lite om den tida: vi må grave i jorda og bruke arkeologi i stedet for tekster.',
                stikkord: ['arkeologi', 'skrev noe ned'],
            },
            {
                tekst: 'Det begynte med en katastrofe. I år 536 kom det en klimakatastrofe. Sola ble borte bak et slør, avlingene sviktet, og svært mange døde.',
                stikkord: ['536', 'klimakatastrofe'],
            },
        ],
    },
    {
        id: 'bera',
        name: 'Bera Kremmer',
        role: 'Hun som selger det andre har glemt',
        tile: [21, 31],
        palette: { tunic: '#8a5a2f', trim: '#e8c96a', hair: '#3a2a1a' },
        smalltalk: [
            'Sølv er sølv. Men det du kan, tar ingen fra deg.',
            'Jeg selger ikke svar. Bare ting som gjør det lettere å lete.',
            'Har du sølv, har jeg noe du trenger.',
        ],
        handler: {
            velkomst: 'Kom nærmere. Jeg har både det som verner og det som leger.',
            varer: [
                'vadmelskjortel',
                'lerbrynje',
                'ringbrynje',
                'tingspyd',
                'jaktbue',
                'runestav',
                'kvernstein',
            ],
        },
    },
];

export const NORDVIK_LANDMARKS: LandmarkDef[] = [
    {
        id: 'runestein-navnet',
        kind: 'runestein',
        tile: [22, 34],
        title: 'Runesteinen ved veien',
        text: 'Her går Nordvegen - veien mot nord. Det er derfor landet heter Noreg: «veien mot nord».',
        stikkord: ['norge', 'nordvegen'],
    },
    {
        id: 'runestein-hallen',
        kind: 'runestein',
        tile: [34, 30],
        title: 'Steinen foran hallen',
        text: 'Reist for høvdingen som samlet mange under ett tak. De store hallene, som den på Borg i Lofoten, forteller oss at makten var samlet hos færre og sterkere høvdinger enn før.',
        stikkord: ['hallene', 'borg i lofoten'],
    },
    {
        id: 'skilt-smia',
        kind: 'skilt',
        tile: [12, 24],
        title: 'Innskrift over smiedøra',
        text: 'Jern og seil. To ting gjorde ferden mulig: bedre jernredskaper og langskip med seil.',
        stikkord: ['jernredskaper', 'teknologisk'],
    },
    {
        id: 'runestein-stamford',
        kind: 'runestein',
        tile: [52, 18],
        title: 'Den siste steinen',
        text: 'For dem som ikke kom hjem fra England i 1066. Slaget ved Stamford Bridge regnes tradisjonelt som slutten på vikingtiden.',
        stikkord: ['stamford', '1066'],
    },
    {
        id: 'baal-tinget',
        kind: 'baal',
        tile: [38, 25],
        title: 'Tingbålet',
        text: 'Bålet brenner så lenge tinget er satt. Ingen våpen innenfor steinringen.',
    },
    {
        id: 'kiste-naustet',
        kind: 'kiste',
        tile: [7, 39],
        title: 'Kista i naustet',
        text: 'Noen har gjemt noe her.',
    },
];

/**
 * Håndskrevne spørsmål. De henger på nøkkelmomentene i sonen (bossen og de to
 * store questene), der vi vil ha full kontroll på formuleringen og på hvor
 * svaret ligger i verden.
 */
export const NORDVIK_AUTHORED: BankQuestion[] = [
    {
        id: 'nordvik-authored-0',
        question: 'Gudrun bærer nøkler i beltet. Hva betyr de?',
        options: [
            'At hun har makt og ansvar over gården',
            'At hun er gift med en konge',
            'At hun er trell på gården',
            'At hun vokter kirken',
        ],
        correct: 0,
        explanation:
            'Nøklene var husfruas tegn. Hun styrte forrådet, maten og alt innenfor dørstokken - og alle visste det.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'samfunn-og-rett',
        lessonTitle: 'Samfunn og Rett i vikingtiden',
        link: '/historie/vikingtiden/samfunn-og-rett',
    },
    {
        id: 'nordvik-authored-1',
        question:
            'Orm legger bordene i skroget over hverandre, som takstein. Hva kalles den metoden?',
        options: ['Klinkbygging', 'Kravellbygging', 'Bindingsverk', 'Lafting'],
        correct: 0,
        explanation:
            'Klinkbygging gjorde skroget både lett og sterkt - og det er derfor langskipene tålte åpent hav.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'skipsteknologi',
        lessonTitle: 'Skipet: Vikingtidens viktigste teknologi',
        link: '/historie/vikingtiden/skipsteknologi',
    },
    {
        id: 'nordvik-authored-2',
        question: 'Hvorfor vet vi så lite om århundrene rett før vikingtiden?',
        options: [
            'Nesten ingen skrev noe ned, så vi må bruke arkeologi',
            'Alle kildene brant opp i en bybrann',
            'Folk snakket et språk ingen kan tyde',
            'Kirken forbød folk å skrive',
        ],
        correct: 0,
        explanation:
            'Historikerne kaller det «de stille århundrene». Vi må grave i jorda i stedet for å lese.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'merovingertiden',
        lessonTitle: 'Merovingertiden: De stille århundrene',
        link: '/historie/norgeshistorie/merovingertiden',
    },
];

/**
 * De håndskrevne oppdragene, ferdig innpakket. Tittel, replikk, hint, giver og
 * belønning lå tidligere i `engine/quests.ts` som tre parallelle lister indeksert
 * mot spørsmålene over. Det er stedets innhold, ikke questmotorens, og det måtte
 * flytte hit for at motoren skal kunne bygge oppdrag for hvilket sted som helst.
 *
 * Giveren er alltid den som selv har mistet ordet - de tre lærer eleven hvordan
 * spillet fungerer, og derfor er kilden her giveren selv.
 */
export const NORDVIK_AUTHORED_QUESTER: AuthoredQuest[] = [
    {
        title: 'Nøklene i beltet',
        intro: 'Nøklene mine klirrer, og jeg husker ikke lenger hvorfor de betyr noe. Kan du finne det ut for meg?',
        hint: 'Gudrun vet det selv - hun har bare mistet ordet. Snakk med henne igjen.',
        giverId: 'gudrun',
        question: NORDVIK_AUTHORED[0],
        belonning: { xp: 45, solv: 20, itemId: 'vadmelskjortel' },
    },
    {
        title: 'Bordene i skroget',
        intro: 'Tåka tok ordet for det jeg gjør. Jeg legger bordene slik - men hva heter det?',
        hint: 'Orm i naustet kan vise deg hvordan bordene ligger.',
        giverId: 'orm',
        question: NORDVIK_AUTHORED[1],
        belonning: { xp: 45, solv: 20, itemId: 'kvernstein' },
    },
    {
        title: 'De stille århundrene',
        intro: 'Jeg skriver ned alt. Men jeg har mistet navnet på tida før vår. Hjelp meg.',
        hint: 'Aslak Munk sitter ved kirken og husker mer enn han tror.',
        giverId: 'aslak',
        question: NORDVIK_AUTHORED[2],
        belonning: { xp: 45, solv: 20 },
    },
];

/** Bossens spørsmål. Hvert riktig svar river ned ett av skjoldene hans. */
export const NORDVIK_BOSS_QUESTIONS: BankQuestion[] = [
    {
        id: 'nordvik-boss-0',
        question: 'Hva betyr navnet Norge?',
        options: [
            'Veien mot nord (Nordvegen)',
            'Det kalde landet',
            'Vikingenes rike',
            'Landet ved havet',
        ],
        correct: 0,
        explanation: 'Navnet kommer av seilingsleia langs kysten: Nord-vegen. Veien mot nord.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'rikssamlingen',
        lessonTitle: 'Rikssamlingen',
        link: '/historie/vikingtiden/rikssamlingen',
    },
    {
        id: 'nordvik-boss-1',
        question: 'Hva var Tinget i det norrøne samfunnet?',
        options: [
            'En hellig plass for diskusjon, dommer og lover',
            'Et marked der folk byttet varer',
            'Kongens private rådsforsamling',
            'Et gravsted for høvdinger',
        ],
        correct: 0,
        explanation:
            'På tinget møttes frie menn. Der ble tvister avgjort og lover vedtatt - høyt, foran alle.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'samfunn-og-rett',
        lessonTitle: 'Samfunn og Rett i vikingtiden',
        link: '/historie/vikingtiden/samfunn-og-rett',
    },
    {
        id: 'nordvik-boss-2',
        question: 'Hvilket slag i 1066 regnes tradisjonelt som slutten på vikingtiden?',
        options: [
            'Slaget ved Stamford Bridge',
            'Slaget i Hafrsfjord',
            'Slaget på Stiklestad',
            'Slaget ved Svolder',
        ],
        correct: 0,
        explanation:
            'Harald Hardråde falt ved Stamford Bridge i 1066. Med ham falt også vikingtiden, sier vi.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'artikkel',
        lessonTitle: 'Vikingtiden: En brytningstid for Norden',
        link: '/historie/vikingtiden/artikkel',
    },
    {
        id: 'nordvik-boss-3',
        question: 'Hva var det avgjørende siste steget som gjorde vikingferdene mulig?',
        options: [
            'Båtene fikk seil og kunne krysse åpent hav',
            'De lærte å lage kart',
            'De fikk kompass fra Kina',
            'De begynte å bruke årer',
        ],
        correct: 0,
        explanation:
            'Uten seil ingen vikingtid. Seilet gjorde at skipene kunne krysse åpent hav i stedet for å følge kysten.',
        subjectId: 'historie',
        topicId: 'vikingtiden',
        lessonId: 'merovingertiden',
        lessonTitle: 'Merovingertiden: De stille århundrene',
        link: '/historie/norgeshistorie/merovingertiden',
    },
];
