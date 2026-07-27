// Kildene på bordet i mellomspillene (blueprint §6).
//
// Alt her er ekte. Utdragene er oversatt fra engelske gjengivelser av kildene,
// og de er ikke pyntet på: dragene står i krøniken fordi de faktisk står der,
// og Alkuin sier «hedninger» fordi det er ordet han bruker. En kilde vi har
// skrevet om for å gjøre den lettere å svare på, er ikke en kilde lenger.
//
// `henvisning` er ikke pynt. En lærer skal kunne slå opp hvert utdrag, og en
// elev som spør «hvor står det?» skal få et svar som ikke er «i spillet».
//
// Bare kildene til Mellomspill I står her. De åtte i blueprintens §6-tabell er
// en designliste, ikke en lovnad - en kilde ingen mellomspill legger ut, er
// nøyaktig den feilen `iRekke` alt har gjort i denne kodebasen.

import type { KildeDef } from '../types';

export const KILDER: KildeDef[] = [
    {
        id: 'alkuin-aethelred',
        navn: 'Alkuins brev til kong Æthelred',
        art: 'brev',
        naerhet: 'samtidig',
        aar: '793',
        opphav: {
            hvem: 'Alkuin av York, kirkemann og den lærdeste engelskmannen i Europa',
            hvor: 'Ved Karl den stores hoff i Frankerriket, over tusen kilometer fra Lindisfarne',
            for: 'Æthelred, konge i Northumbria',
            hensikt: 'Å få kongen og folket hans til å endre livet sitt',
        },
        utdrag:
            'Se, kirken til den hellige Cuthbert er sprutet med blodet av Guds prester, ranet for all sin pryd. Det stedet som var det mest ærverdige i Britannia, er gitt som bytte til hedninger.\n\n' +
            'I nesten tre hundre og femti år har vi og fedrene våre bodd i dette vakre landet, og aldri før har en slik redsel vist seg i Britannia som den vi nå har lidd av et hedensk folk. Ingen trodde at et slikt angrep fra sjøen var mulig.',
        henvisning:
            'Alkuin av York til kong Æthelred, 793. Oversatt fra engelsk gjengivelse i English Historical Documents (brev nr. 193).',
    },
    {
        id: 'angelsaksiske-kroniken-793',
        navn: 'Den angelsaksiske krøniken, året 793',
        art: 'annal',
        naerhet: 'nesten',
        aar: '793, skrevet ned omkring 890',
        opphav: {
            hvem: 'Munker i England. Vi vet ikke navnet på én av dem',
            hvor: 'I et kloster i England, av eldre notater',
            for: 'Ettertiden. Dette er en årbok, ført år for år',
            hensikt: 'Å ta vare på det som hendte, ett år om gangen',
        },
        utdrag:
            'I dette året kom fæle varsler over Northumbria og skremte folket ille: det var voldsomme virvelvinder og lyn, og ildsprutende drager ble sett fly i luften. Rett etter disse tegnene fulgte stor hungersnød, og litt etter det, samme år, ødela hedningenes herjing Guds kirke på Lindisfarne med ran og manndrap.',
        henvisning:
            'Den angelsaksiske krøniken, innførselen for år 793. Oversatt fra engelsk gjengivelse.',
    },
];

export const KILDE_BY_ID: Record<string, KildeDef> = Object.fromEntries(
    KILDER.map((k) => [k.id, k])
);

/** Hva de fire nærhetene heter for en elev. Står på kortet, ikke i en forklaring. */
export const NAERHET_NAVN: Record<KildeDef['naerhet'], string> = {
    samtidig: 'Samtidig',
    nesten: 'Nesten samtidig',
    senere: 'Skrevet senere',
    'mye-senere': 'Skrevet mye senere',
};

/** Og hva de betyr, sagt i én linje. */
export const NAERHET_FORKLARING: Record<KildeDef['naerhet'], string> = {
    samtidig: 'Skrevet i samme tid som det den forteller om.',
    nesten: 'Notatene er gamle, men boka vi har er skrevet lenge etter.',
    senere: 'Skrevet flere tiår etter at det skjedde.',
    'mye-senere': 'Skrevet hundrevis av år etter at det skjedde.',
};

export const ART_NAVN: Record<KildeDef['art'], string> = {
    brev: 'Brev',
    annal: 'Årbok',
    reiseberetning: 'Reiseberetning',
    dikt: 'Dikt',
    innskrift: 'Innskrift',
    saga: 'Saga',
    arkeologi: 'Funn i jorda',
};
