// «Pinnene i gjørma» (blueprint §7.2 «Runepinnen», fraksjon N): gamle Gunnvor på Stranden kan lese
// runer og ber gutten finne pinnene som kommer opp når folk graver. Og folkene på Stranden og i
// Vågsbunnen som er nye her: navnene, replikkene og samtalene deres (fyllikken og kona hans, presten
// i Jonskirken, barna). Lagt til i `OPPDRAG` (oppdrag-data.ts) med én linje.
//
// Målene teller hendelsen `rune` (graboks/strandliv.ts sender den når gutten plukker opp en pinne).
// Historien, navnene og replikkene er laget for spillet [S]. Fakta i «Dette vet vi» er merket her,
// med kildene i runepinner.ts og blueprint §11.
import type { OppdragDef } from './oppdrag-data';
import { BESTEMT, NAVN, REPLIKKER, SAMTALER, VEI } from './samtaler';
import { PERSONER, TITTEL } from './personer';

Object.assign(PERSONER, {
    gunnvor: { navn: 'Gunnvor', tittel: 'enke på Stranden' },
    tora: { navn: 'Tora', tittel: 'kona til Arnfinn' },
    arnfinn: { navn: 'Arnfinn', tittel: 'skomakersvenn' },
    jonspresten: { navn: 'Herr Sigurd', tittel: 'prest i Jonskirken' },
});
Object.assign(TITTEL, { gammelkone: 'Gammel kone', husmann: 'Husmann', husfrue: 'Kone', gutt: 'Gutt', jente: 'Jente', fyllik: 'Svenn' });
Object.assign(BESTEMT, { gammelkone: 'den gamle kona', husmann: 'husmannen', husfrue: 'kona', gutt: 'gutten', jente: 'jenta', fyllik: 'svennen' });
Object.assign(NAVN, { gammelkone: 'Den gamle kona', husmann: 'Husmannen', husfrue: 'Kona', gutt: 'Gutten', jente: 'Jenta', fyllik: 'Svennen' });
Object.assign(REPLIKKER, {
    husmann: ['Veden hogger seg ikke selv.', 'Kongen regner stranda som sin, sier de. Vi bor her likevel.', 'Tyskergutt? Gå heller tilbake over Vågen.'],
    husfrue: ['Barna skal i kirka i kveld, om de vil eller ikke.', 'Vannet herfra er bare til vasking.', 'Har du ikke en mor som venter på deg?'],
    gutt: ['Du er en tyskergutt! Kan du ro?', 'Vi leker sisten. Du får ikke være med.', 'Mor sier vi ikke skal snakke med tyskerne.'],
    jente: ['Har du sett grisen vår? Han stakk av igjen.', 'Jeg skal hente vann etterpå.', 'Du snakker rart.'],
    gammelkone: ['Beina mine er gamle, gutt. Sett deg heller ned.'],
    fyllik: ['La meg sitte...'],
});
Object.assign(VEI, {
    gutt: ['Flytt deg!', 'Du er den!'],
    jente: ['Pass deg!', 'Ikke ta meg!'],
    husfrue: ['Pass deg, gutt.', 'Flytt deg, jeg bærer vann.'],
    husmann: ['Til side.'],
});

// Presten i Jonskirken. [V] Bergen byleksikon «Jonsklosteret» (Hartvedt & Skreien 2009): kloster for
// augustinere, grunnlagt før 1180, kirka ved dagens Fortunen mellom Strandgaten og Tårnplass, store
// pengeproblemer på 1300-tallet, «trolig mer eller mindre øde omkring år 1400», kirka fikk fortsatt
// gaver i 1517. Herr Sigurd og hva han sier om brødrene er [S].
SAMTALER.jonspresten = {
    start: {
        tekst: 'Velkommen til Jonskirken, gutt. Også en tysker kan be her.',
        gest: 'kom',
        valg: [
            { tekst: 'Hvor er munkene?', til: 'munker' },
            { tekst: 'Hvorfor ser huset der så forfallent ut?', til: 'munker' },
        ],
    },
    munker: {
        tekst: 'Klosteret står nesten tomt. Pengene tok slutt, og det kom ingen nye brødre. Men kirka holder vi i bruk. Folk på Stranden kommer hit til kveldsbønn.',
        gest: 'skuldre',
        til: 'vet',
    },
    vet: {
        hvem: 'Dette vet vi',
        vet: true,
        tekst: 'Jonsklosteret var et kloster for augustinere på Strandsiden. Det ble grunnlagt før 1180. På 1300-tallet hadde det store pengeproblemer, og rundt år 1400 sto det trolig nesten tomt. Kirka ble brukt i over hundre år til. Hvordan kirka og klosteret så ut, og hvem som var prest der, vet vi ikke.',
    },
};

// Fyllikken og kona hans i Vågsbunnen (§2: fyll vises ærlig og med alvor, aldri som komikk).
// Alt er [S]. At Vågsbunnen hadde ølstuer, står i sideoppdrag.ts (NIKU 2018).
SAMTALER.arnfinn = {
    start: { tekst: 'La meg sitte. Bare litt til. Så går jeg hjem.', gest: 'vift', til: 'to' },
    to: { tekst: 'Mesteren ga meg lønna i dag. Nå er den borte. Jeg vet ikke hvor den ble av.', gest: 'riste' },
};
SAMTALER.tora = {
    start: {
        tekst: 'Han har drukket opp lønna igjen. Ungene har ikke spist i dag.',
        gest: 'riste',
        valg: [
            { tekst: 'Hvorfor drikker han?', til: 'hvorfor' },
            { tekst: 'Kan jeg hjelpe?', til: 'hjelp' },
        ],
    },
    hvorfor: {
        tekst: 'Han var en god svenn. Så døde den minste vår i vinter, av feber. Siden har han sittet her hver kveld.',
        gest: 'snakk',
        valg: [
            { tekst: 'Kan jeg hjelpe?', til: 'hjelp' },
            { tekst: 'Det var leit å høre.', til: 'leit' },
        ],
    },
    leit: { tekst: 'Ja. Det er mange som har det slik her. Ingen synger viser om oss.', gest: 'skuldre' },
    hjelp: {
        tekst: 'Har du en witten til brød? Gi den til meg, ikke til ham.',
        valg: [
            { tekst: 'Gi henne en witten.', til: 'gi' },
            { tekst: 'Jeg har ingenting å gi.', til: 'ingen' },
        ],
    },
    gi: { tekst: 'Takk, gutt. Gud velsigne deg. Ungene får brød i morgen.', gest: 'nikk', gjor: 'witten:-1;rykte:N:+2' },
    ingen: { tekst: 'Nei. Du er bare en gutt selv.', gest: 'skuldre' },
};

// ── Pinnene i gjørma ──
// «Dette vet vi»: [V] rundt 670 innskrifter, mest trepinner (Wikipedia «Bryggen inscriptions»); [V] mest
// 1100-1300-tallet, noen fra 1400-tallet (Historisk museum); [V] eierlapper, beskjeder, bønner og
// kjærlighet (samme kilder). Hvor mange som kunne runer i 1420-årene, er ikke funnet [K].
export const RUNER: OppdragDef = {
    id: 'runer',
    tittel: 'Pinnene i gjørma',
    giver: 'gunnvor',
    mottaker: 'gunnvor',
    om: 'Gamle Gunnvor på Stranden kan lese runer. Når folk graver i gjørma, kommer det opp gamle pinner med runer på. Finn tre og ta dem med til henne.',
    hvor: 'I gjørma i Vågsbunnen og på Stranden. Gunnvor sitter på benken foran huset sitt på Stranden.',
    maal: [{ hendelse: 'rune', tekst: 'Finn runepinner i Vågsbunnen og på Stranden', antall: 3 }],
    tilbud: {
        start: {
            tekst: 'En tyskergutt på Stranden? Det ser man ikke ofte. Kom hit, beina mine er for gamle til å gå til deg.',
            gest: 'kom',
            til: 'start2',
        },
        start2: {
            tekst: 'Ser du denne? En pinne med runer. Far min risset slike. Han skrev navnet sitt på alt han eide.',
            gest: 'peke',
            valg: [
                { tekst: 'Kan du lese dem?', til: 'lese' },
                { tekst: 'Hva står det?', til: 'hva' },
            ],
        },
        hva: { tekst: '«Gunnvor eier meg.» Han laget den til meg da jeg var liten. Nå er det nesten ingen som kan runer lenger.', gest: 'snakk', til: 'oppdrag' },
        lese: { tekst: 'Jeg lærte det av far. De unge skriver med bokstavene fra kirka nå, de få som skriver i det hele tatt.', gest: 'snakk', til: 'oppdrag' },
        oppdrag: {
            tekst: 'Når folk graver i gjørma, kommer det opp gamle pinner. De fleste havner på bålet. Finner du noen, kan du ta dem med til meg? Så leser jeg dem for deg.',
            valg: [
                { tekst: 'Jeg skal lete.', til: 'ja' },
                { tekst: 'Jeg har ikke tid.', til: 'nei' },
            ],
        },
        ja: { tekst: 'Se etter der folk har gravd, og der gjørma er gammel. I Vågsbunnen, og her på Stranden. Tre pinner, gutt.', gest: 'nikk', gjor: 'ta:runer' },
        nei: { tekst: 'Nei, tyskerne har det alltid travelt. Pinnene ligger der i morgen også.', gest: 'skuldre' },
    },
    underveis: {
        start: { tekst: 'Tre pinner, gutt. Se i gjørma der folk har gravd. Ved naustene, på kirkegården, og i Vågsbunnen.', gest: 'peke' },
    },
    leveringStart: (flagg) => (flagg.has('rune:b149') ? 'gyda' : 'start'),
    levering: {
        start: {
            tekst: 'Du fant dem! La meg se. Folk skrev det de trengte å si: hvem som eide noe, en bønn, ord til noen de var glad i.',
            gest: 'nikk',
            til: 'slutt',
        },
        gyda: {
            tekst: 'Du fant dem! La meg se. Og denne her... «Gyda sier at du skal gå hjem.»',
            gest: 'snakk',
            til: 'gyda2',
        },
        gyda2: {
            tekst: 'Mannen min drakk. Mange kvelder sendte jeg ungene etter ham i ølstua. Han kom ikke alltid hjem.',
            gest: 'riste',
            valg: [
                { tekst: 'Hva skjedde med ham?', til: 'mann' },
                { tekst: 'Det er mange som drikker i Vågsbunnen.', til: 'mange' },
            ],
        },
        mann: { tekst: 'Han gikk utfor bryggekanten en vinternatt. Jeg skulle ønske jeg hadde skrevet en slik pinne til ham.', gest: 'riste', til: 'slutt' },
        mange: { tekst: 'Ja. Og konene og ungene deres går sultne. Arnfinn i Skostredet sitter der hver kveld nå.', gest: 'skuldre', til: 'slutt' },
        slutt: {
            tekst: 'Takk, gutt. Du er ikke som de andre tyskerne. Ta disse for bryet. Og kom innom igjen.',
            gest: 'nikk',
            gjor: 'lever:runer',
            til: 'vet',
        },
        vet: {
            hvem: 'Dette vet vi',
            vet: true,
            tekst: 'På Bryggen er det funnet rundt 670 innskrifter med runer, de fleste på trepinner. De fleste er fra 1100- til 1300-tallet, men noen er fra 1400-tallet. Folk skrev eierlapper, beskjeder, bønner og kjærlighetsord. Hvor mange som fortsatt kunne lese runer i 1420-årene, da denne historien foregår, vet vi ikke.',
        },
    },
    lonn: 'Gunnvor stoler på deg. Folk på Stranden får høre om tyskergutten som hjalp henne.',
    belonning: { witten: 2, rykte: { N: 6 }, ferdighet: { regning: 1 } },
};
