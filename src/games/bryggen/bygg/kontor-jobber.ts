// To jobber for Kontoret ved siden av kjeden «Kontorets lov» (blueprint §7.1): «Last koggen» hos skipperen
// på kaia ved allmenningen, og «Bårds fisk på bismeren» ved jekta. Begge krever bare at gutten har båret
// fisk («Fisken bærer seg ikke selv»). Når de er levert, kan de tas igjen som arbeid for lønn én gang
// per døgn (graboks/kontor-koggen.ts og kontor-veiing.ts).
//
// [V] Koggene førte tørrfisk og tran fra Bergen sørover til hansabyene (blueprint §4.3). [V] Kogger var
// store: Bremerkoggen fra 1380 er 24 m lang og 8 m bred, og kunne trolig laste 90 til 130 tonn
// (Wikipedia «Bremen cog», hentet 03.10.2026). [V] Bylova av 1276 satte 1 bismerpund til ca. 5,1 kg, og
// fra 1604 er 1 våg 3 bismerpund; hvor stor en våg var i 1420-årene, er [U] (blueprint §4.3).
// Hermen, Bård sin jobb, lasten og tallene er [S].
import type { OppdragDef } from './oppdrag-data';
import { PERSONER, TITTEL } from './personer';
import { BESTEMT, NAVN, REPLIKKER } from './samtaler';

PERSONER.hermen = { navn: 'Hermen', tittel: 'skipper på koggen fra Lübeck' };
TITTEL.skipper = 'Skipper';
NAVN.skipper = 'Skipperen';
BESTEMT.skipper = 'skipperen';
REPLIKKER.skipper = ['Flo i kveld. Da skal vi ut.', 'Et skip som krenger i havn, krenger verre på sjøen.', 'Lübeck venter på fisken.'];

/** Hvor mange bismerpund som er én våg i spillet (fra 1604 er det 3, [U] for 1420-årene). */
export const PUND_PER_VAAG = 3;

export const VET_KOGGEN =
    'Koggene var de store lasteskipene til hansabyene. En kogge som ble funnet i Bremen, er fra 1380. Den er 24 meter lang og 8 meter bred, og kunne trolig laste mellom 90 og 130 tonn. Fra Bergen tok koggene med seg tørrfisk og tran sørover. Hvordan lasten ble stuet om bord, er laget for spillet: at tunge ting må stå lavt og midt i skipet, gjelder alle skip.';

export const VET_VAAG =
    'Fisk ble veid i bismerpund og våger. Bylova fra 1276 sier at et bismerpund var omtrent 5,1 kilo. Fra 1604 vet vi at en våg var 3 bismerpund, omtrent 18 kilo, men på Vestlandet kunne en våg være større. Hvor stor en våg var i 1420-årene, vet vi ikke sikkert. Spillet regner med 3 bismerpund i en våg.';

// ── Last koggen ──
const KOGGEN: OppdragDef = {
    id: 'kontor-koggen',
    tittel: 'Last koggen',
    giver: 'hermen',
    mottaker: 'hermen',
    krav: ['fisk'],
    om: 'Koggen fra Lübeck skal ut på flo. Stu lasten i lasterommet: tunge tranfat midt i skipet, og like mye på hver side, så den ikke krenger.',
    hvor: 'Skipperen Hermen på kaia ved allmenningen',
    maal: [{ hendelse: 'kontor:lastet', tekst: 'Stu lasten i koggen (E hos Hermen)' }],
    tilbud: {
        start: {
            tekst: 'Du er fra gården der borte? Fint. Fisken og tranen skal ned i lasterommet før floen. Mine folk bærer. Du sier hvor det skal stå.',
            gest: 'peke',
            valg: [
                { tekst: 'Hvorfor er det så viktig hvor det står?', til: 'hvorfor' },
                { tekst: 'Jeg gjør det.', til: 'ja' },
            ],
        },
        hvorfor: {
            tekst: 'Står det tungt på den ene siden, krenger skipet. Står det tungt i baugen, graver hun seg ned i sjøen. Kommer det storm, er det skeiv last som drukner folk.',
            gest: 'riste',
            til: 'ja',
        },
        ja: { tekst: 'Tranfatene er tyngst. Sett dem midt i skipet. Si fra når du er klar.', gest: 'nikk', gjor: 'ta:kontor-koggen' },
    },
    underveis: { start: { tekst: 'Lasten venter. Si fra når du er klar til å stue.', gest: 'peke' } },
    leveringStart: (f) => (f.has('koggen-rett') ? 'rett' : 'skeiv'),
    levering: {
        rett: {
            tekst: 'Hun ligger rett som en planke. Det har jeg ikke sett en junge gjøre før. Si til husbonden din at Hermen er fornøyd.',
            gest: 'nikk',
            gjor: 'lever:kontor-koggen;witten:+2',
            til: 'vet',
        },
        skeiv: {
            tekst: 'Hun krenger. Mine folk må flytte halve lasten. Du lærer det, men ikke i dag.',
            gest: 'riste',
            gjor: 'lever:kontor-koggen',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_KOGGEN },
    },
    lonn: 'Hermen vet hvem du er.',
    belonning: { witten: 2, rykte: { K: 3 } },
};

// ── Bårds fisk på bismeren ──
const VEIING: OppdragDef = {
    id: 'kontor-veiing',
    tittel: 'Bårds fisk på bismeren',
    giver: 'bard',
    mottaker: 'bard',
    krav: ['fisk'],
    om: 'Bård har veid fisken sin hjemme. Vei fem bunter på bismeren ved jekta, legg sammen og si hvor mange våger det blir. En våg er 3 bismerpund.',
    hvor: 'Bård ved jekta på kaia',
    maal: [{ hendelse: 'kontor:veid', tekst: 'Vei fem bunter og regn om til våger (E hos Bård)' }],
    tilbud: {
        start: {
            tekst: 'Du er han som kan lese bismeren? Jeg veide fisken hjemme i Nordland. Nå vil jeg se hva den veier her, før husbonden din skriver noe i boka.',
            gest: 'kom',
            valg: [
                { tekst: 'Hvorfor stoler du ikke på vekta i bua?', til: 'stole' },
                { tekst: 'Jeg veier for deg.', til: 'ja' },
            ],
        },
        stole: {
            tekst: 'Det er deres bismer og deres lodd. Fisken tørker også på veien sørover, så den veier mindre her. Det er ikke alltid juks. Men jeg vil se selv.',
            gest: 'skuldre',
            til: 'ja',
        },
        ja: { tekst: 'Fem bunter. Legg sammen pundene og si det i våger. Tre pund i en våg.', gest: 'nikk', gjor: 'ta:kontor-veiing' },
    },
    underveis: { start: { tekst: 'Bismeren henger i bukken her. Fem bunter, junge.', gest: 'peke' } },
    leveringStart: (f) => (f.has('veiing-rett') ? 'rett' : 'feil'),
    levering: {
        rett: {
            tekst: 'Det stemmer med det jeg veide, nesten på pundet. Litt har tørket bort. Takk, gutt. Det er ikke mange tyskere som gidder å regne for en fisker.',
            gest: 'nikk',
            gjor: 'lever:kontor-veiing;rykte:F:+4',
            til: 'vet',
        },
        feil: {
            tekst: 'Det stemmer ikke. Enten veide du feil, eller så regnet du feil. Jeg får be husbonden veie en gang til.',
            gest: 'riste',
            gjor: 'lever:kontor-veiing',
            til: 'vet',
        },
        vet: { hvem: 'Dette vet vi', vet: true, tekst: VET_VAAG },
    },
    lonn: 'Bård stoler mer på deg nå.',
    belonning: { witten: 1, rykte: { F: 2, K: 1 }, ferdighet: { regning: 1 } },
};

export const JOBB_OPPDRAG: OppdragDef[] = [KOGGEN, VEIING];
