// All tekst i Underskriftsrittet utenom lappene i komponenten: mål, regler, tips og lærdom.

export const MÅL =
    'Høsten 1786. Du er Christian Lofthus. Ri fra bygd til bygd og samle navn på klagen til kongen.';

/** Bare tastene i menyen. Resten vises i spillet første gang det skjer. */
export const TASTER = 'Ri med piltastene eller WASD (eller hold fingeren der hesten skal).';

export const TAP_TITTEL = { lys: 'Klagen er stoppet', vinter: 'Vinteren kom' } as const;

export const TIPS = {
    lys: 'Å samle bønder til møter var oppvigleri, og hvert navn tente en ny lykt. Ri ut av bygda før lyktene kommer, og kom tilbake når de har gått videre.',
    vinter: 'Kronprinsen ville ha bevis for at du talte for mange. Med for få bygder bak seg var klagen bare én manns klage. Ingen kunne stemme eller skrive i avisen - navnene var den eneste makta bøndene hadde.',
} as const;

export const SEIER = [
    'Desember 1786. I København ble de redde. Kommisjonen er satt ned, og ordren om å arrestere deg er trukket tilbake.',
    'Mars 1787, Lillesand. Kommisjonen ga bøndene rett. Men Lofthus ble tatt med list og dømt til tvangsarbeid i lenker på livstid.',
];

export const KRAV = ['Gebyrene ned', 'Bedre tømmerpris', 'Kornmonopolet borte (1788)'];

export const LÆRDOM = {
    eneste: 'Under eneveldet var klage til kongen den eneste lovlige veien. Bøndene kunne ikke stemme.',
    oppvigleri:
        'Når mange samlet seg bak klagen, kalte embetsmennene det opprør - og sendte folk etter Lofthus.',
    kommisjon:
        'Navn fra mange bygder i Agder og Telemark fikk København til å sette ned en kommisjon.',
    straff: 'Kravene vant fram, men lederen ble straffet: Lofthus døde i fangenskap i 1797.',
    telemark:
        'Bevegelsen spredte seg fra Agder til Telemark. Jo flere bygder, jo vanskeligere å kalle det én manns klage.',
    klager:
        'Bøndene klaget over tre ting: høye gebyrer til embetsmennene, kornmonopolet, og at bare byborgerne fikk kjøpe tømmeret deres.',
    dristig:
        'Å samle bønder til møter var forbudt, uansett hva kronprinsen hadde sagt. Du tok sjansen likevel.',
} as const;

/** Klageboka: ett blad i hver bygd, ved gården med det malte merket. Alt står i artikkelen. */
export const KLAGEBOKA: Record<string, string> = {
    'Vestre Moland': 'Lofthus eide sin egen gård utenfor Lillesand da han var 23 år.',
    Birkeland:
        'Lofthus drev gård, sagbruk, handel og skipsfart - og var ikke redd for å si hva han mente.',
    Landvik: 'Bøndene fikk bare selge tømmeret til borgerne i byen. Da bestemte borgerne prisen.',
    Eide: 'Embetsmennene tok betalt for jobben de gjorde for folk, ofte mye.',
    Øyestad: 'Fra 1735 fikk Sør-Norge bare kjøpe korn fra Danmark. Det kalles kornmonopolet.',
    Froland: 'Sommeren 1786 reiste Lofthus to ganger til København og møtte kronprinsen.',
    Treungen: 'Kong Christian 7. var syk. Det var kronprins Frederik som hadde makta.',
    Drangedal: 'Kommisjonen fant at bøndene hadde rett i mye. To sorenskrivere mistet jobben.',
    Nissedal: 'Kjøpmennene i Arendal måtte betale erstatning til bøndene.',
    Fyresdal: 'I 1788 ble kornmonopolet opphevet. Lofthus-saken var med på å få det til.',
};
