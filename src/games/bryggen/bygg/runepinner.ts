// Runepinnene gutten kan finne i gjørma i Vågsbunnen og på Stranden, og hva som står på dem.
//
// Det vi vet:
//  - Utgravningene på Bryggen etter brannen i 1955 fant rundt 670 runeinnskrifter fra middelalderen,
//    mest på trepinner og bein [V Wikipedia «Bryggen inscriptions»]. Før 1955 var færre enn 500
//    runeinnskrifter fra middelalderen kjent fra hele Norge; Bryggen mer enn doblet tallet [V Historisk
//    museum, «Runer i middelalderbyene»]. Blueprint §7.2 sier 597 [V] uten kilde i §11; det tallet er
//    ikke funnet igjen, så spillet bruker «rundt 670» [V Wikipedia].
//  - De fleste er fra slutten av 1100-tallet til 1300-tallet; noen er fra 1400-tallet [V Historisk
//    museum: «enkelte gjenstander datert helt til 1450»; Wikipedia: «minst så sene som 1300-tallet»].
//  - Folk skrev hverdagsting: eierlapper («Øystein eier meg»), beskjeder, bønner og kjærlighet [V].
//  - Bakken under Bryggen er lag på lag av rester fra brannene [K: ikke sjekket mot en kilde i §11].
//    At gutten finner gamle pinner der folk graver, er laget for spillet [S].
//
// Innskriftene og oversettelsene er hentet fra kildene som står ved hver av dem. Runene på kortet er
// satt sammen fra den latinske gjengivelsen (translitterasjonen) med middelalderrunene [S]: ristningen
// på den ekte pinnen kan se annerledes ut. Der kilden ikke gir translitterasjonen, viser kortet bare
// oversettelsen.
import * as THREE from 'three';

export interface Runepinne {
    id: string;
    /** Translitterasjonen med latinske bokstaver (`:` er skilletegn), eller null når kilden ikke har den. */
    runer: string | null;
    /** På norsk, for en 14-åring. */
    norsk: string;
    /** Hva slags pinne: eierlapp, beskjed, bønn, kjærlighet. */
    slag: string;
    /** Hvor den er fra og hvor gammel, slik kilden sier det. */
    funn: string;
    /** Det eleven lærer av akkurat denne. */
    vet: string;
    /** Kilden, kort. */
    kilde: string;
}

export const RUNEPINNER: Runepinne[] = [
    {
        // [V] Wikipedia «Bryggen inscriptions», B 1: «øystein:ami», «Eystein owns me».
        id: 'b1',
        runer: 'øystein:ami',
        norsk: 'Øystein eier meg.',
        slag: 'Eierlapp',
        funn: 'Bryggen, nummer B 1 i registeret over innskriftene.',
        vet: 'Slike lapper ble bundet fast på varer, sekker og tønner, så alle kunne se hvem som eide dem. Mange av pinnene fra Bryggen er eierlapper.',
        kilde: 'Wikipedia: «Bryggen inscriptions» (B 1)',
    },
    {
        // [V] Wikipedia «Bryggen inscriptions», B 149: «kya : sæhir : atþu : kakhæim», «Gyða tells you to go home».
        id: 'b149',
        runer: 'kya:sæhir:atþu:kakhæim',
        norsk: 'Gyda sier at du skal gå hjem.',
        slag: 'Beskjed',
        funn: 'Bryggen, nummer B 149. Det står mer på pinnen etter dette.',
        vet: 'En kort beskjed fra Gyda til en mann, kanskje mannen hennes. Hvorfor han skulle hjem, vet vi ikke. Pinnen viser at folk sendte hverandre beskjeder på trepinner, slik vi sender meldinger.',
        kilde: 'Wikipedia: «Bryggen inscriptions» (B 149)',
    },
    {
        // [V] Wikipedia «Bryggen inscriptions», B 3: «auema» (Ave Maria).
        id: 'b3',
        runer: 'auema',
        norsk: 'Ave Maria (Hill deg, Maria).',
        slag: 'Bønn',
        funn: 'Bryggen, nummer B 3.',
        vet: 'Ave Maria er begynnelsen på en bønn til jomfru Maria på latin. Mange pinner fra Bryggen har bønner. Folk skrev latin med runer.',
        kilde: 'Wikipedia: «Bryggen inscriptions» (B 3)',
    },
    {
        // [V] Wikipedia «Bryggen inscriptions», B 17: «ost min kis mik», «My love, kiss me».
        id: 'b17',
        runer: 'ost:min:kis:mik',
        norsk: 'Min kjære, kyss meg.',
        slag: 'Kjærlighet',
        funn: 'Bryggen, nummer B 17.',
        vet: 'Folk på Bryggen skrev om kjærlighet også. Det viser at mange flere enn prester og skrivere kunne lese og skrive runer.',
        kilde: 'Wikipedia: «Bryggen inscriptions» (B 17)',
    },
    {
        // [V] Hansen, G. (u.å.). «1979 Frekke runepinner fra Bryggen». Universitetsmuseet i Bergen,
        // Tohundre fortellinger. «Ingebjørg elska meg då eg var i Stavanger», datert 1185-1198.
        id: 'ingebjorg',
        runer: null,
        norsk: 'Ingebjørg elsket meg da jeg var i Stavanger.',
        slag: 'Kjærlighet',
        funn: 'Bryggen, datert til mellom 1185 og 1198.',
        vet: 'Pinnen er over 200 år gammel når gutten finner den. Noen savnet en han hadde vært glad i, og risset det inn i en pinne.',
        kilde: 'Universitetsmuseet i Bergen: «1979 Frekke runepinner fra Bryggen»',
    },
    {
        // [V] Wikipedia «Bryggen inscriptions», N B380: «May you be healthy, and in good spirits. May Þórr
        // receive you, may Óðinn own you.» Kilden gir ikke translitterasjonen.
        id: 'b380',
        runer: null,
        norsk: 'Vær frisk og ved godt mot. Tor ta imot deg, Odin eie deg.',
        slag: 'Hilsen',
        funn: 'Bryggen, nummer N B380.',
        vet: 'Norge hadde vært kristent i flere hundre år, men noen nevnte fortsatt de gamle gudene Tor og Odin. Kanskje var det bare gamle ord folk brukte, kanskje noe mer. Det vet vi ikke.',
        kilde: 'Wikipedia: «Bryggen inscriptions» (N B380)',
    },
];

/** Middelalderrunene for hver bokstav i translitterasjonen [S: valgt fra de vanlige formene]. */
export const RUNE: Record<string, string> = {
    a: 'ᛆ', b: 'ᛒ', c: 'ᛌ', d: 'ᛑ', e: 'ᛂ', f: 'ᚠ', g: 'ᚵ', h: 'ᚼ', i: 'ᛁ', k: 'ᚴ', l: 'ᛚ', m: 'ᛘ', n: 'ᚿ',
    o: 'ᚮ', p: 'ᛔ', r: 'ᚱ', s: 'ᛋ', t: 'ᛏ', u: 'ᚢ', v: 'ᚡ', y: 'ᛦ', þ: 'ᚦ', æ: 'ᛅ', ø: 'ᚯ', ':': '᛬',
};

/** En pinne som ligger i en celle (verdensrom), og pinnen den er. */
export interface PinneSted {
    id: string;
    pos: THREE.Vector3;
    /** Hvor pinnen ligger, i oppdragslista og dagboka. */
    hvor: string;
}

const steder = new Map<string, PinneSted[]>();
let versjon = 0;

/** En celle melder hvor pinnene ligger når den bygges. */
export function meldPinner(celle: string, p: PinneSted[]): void {
    steder.set(celle, p);
    versjon++;
}

export function glemPinner(celle: string): void {
    if (steder.delete(celle)) versjon++;
}

/** Pinnene i cellene som er lastet, og en teller som endres når lista gjør det. */
export function pinner(): { versjon: number; liste: PinneSted[] } {
    return { versjon, liste: [...steder.values()].flat() };
}
