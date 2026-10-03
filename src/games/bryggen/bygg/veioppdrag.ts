// «Skoene til Åsa» (fraksjon N): etter «Skomakerverkstedet» har mester Hans et nytt par sko som skal til
// Åsa på Stranden, og denne gangen skal gutten gå med dem selv, rundt bunnen av Vågen. Veien går forbi
// bommen over Skostredet, så Detmar må slippe ham forbi (rykte hos byfolket, bommen.ts). Målet er
// stedet `vaagkaia` midt på kaia langs bunnen av Vågen (strandgaten.ts), så båten ikke holder.
//
// Det vi vet: at Skostredet gikk rundt bunnen av Vågen mellom Bryggen og Stranden, står i
// VET_SKOSTREDET (sideoppdrag.ts). Hvem som kjøpte sko av de tyske skomakerne, er ikke sjekket [K].
// Åsa, jenta hennes og alt de sier er laget for spillet [S].
import type { OppdragDef } from './oppdrag-data';

export const SKO_AASA: OppdragDef = {
    id: 'sko-aasa',
    tittel: 'Skoene til Åsa',
    giver: 'hans',
    mottaker: 'aasa',
    krav: ['sko'],
    om: 'Mester Hans har sydd et par barnesko til Åsa, kona til husmannen på Stranden. Bær dem rundt bunnen av Vågen til fots. Detmar ved bommen slipper bare forbi dem byfolket kjenner.',
    hvor: 'Forbi bommen i vestenden av Skostredet, langs kaia i bunnen av Vågen og Strandgaten, til stua til Åsa på Stranden',
    ting: 'sko',
    maal: [{ hendelse: 'sted:vaagkaia', tekst: 'Gå langs kaia i bunnen av Vågen' }],
    tilbud: {
        start: {
            tekst: 'Der er du, junge. Sålen din holdt. Jeg har et nytt par her, små, til jenta til Åsa på Stranden.',
            gest: 'kom',
            valg: [
                { tekst: 'Skal jeg ro over med dem?', til: 'ro' },
                { tekst: 'Hvem er Åsa?', til: 'hvem' },
            ],
        },
        hvem: { tekst: 'Kona til husmannen bortenfor naustene. Hun vever. Hun betaler i vadmel, og vadmelet trenger jeg.', gest: 'snakk', til: 'ro' },
        ro: {
            tekst: 'Nei. Gå veien rundt bunnen av Vågen, slik skomakerne alltid har gått. Da ser folk at du går ærend for oss, og ikke for Kontoret.',
            gest: 'peke',
            valg: [
                { tekst: 'Jeg tar dem.', til: 'ja' },
                { tekst: 'Ikke nå.', til: 'nei' },
            ],
        },
        ja: { tekst: 'Bra. Og hils Detmar ved bommen fra meg. Han er sta, men han er ikke dum.', gest: 'nikk', gjor: 'ta:sko-aasa' },
        nei: { tekst: 'Skoene blir ikke mindre av å vente, men jenta vokser.', gest: 'skuldre' },
    },
    underveis: {
        start: { tekst: 'Forbi bommen, langs kaia i bunnen av Vågen og bort Strandgaten. Åsa bor i huset bortenfor naustene.', gest: 'peke' },
    },
    levering: {
        start: {
            tekst: 'Sko fra mester Hans? Og du har gått hele veien rundt Vågen med dem? Kom inn, kom inn.',
            gest: 'kom',
            til: 'to',
        },
        to: {
            tekst: 'Se, Ragna, nye sko. Nå kan du gå til kirka uten å fryse på beina. Takk, gutt. Si til mester Hans at vadmelet hans er ferdig om ei uke.',
            gest: 'nikk',
            gjor: 'lever:sko-aasa',
        },
    },
    lonn: 'Åsa ga deg en witten og en skål grøt. Folk på Stranden har sett deg gå ærend for skomakerne.',
    belonning: { witten: 1, rykte: { N: 4 } },
};
