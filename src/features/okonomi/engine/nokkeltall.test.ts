// Testene som fanger de fem feilene gjennomgangen fant.
//
// Alle fem var uenigheter mellom to steder som regnet det samme tallet på hver
// sin måte. `tsc` og `eslint` går rent på begge variantene av en slik feil, så
// det er bare en test som kan holde dem ute. Hver test her er navngitt etter
// hva den faktisk beskytter mot, ikke etter hvilken funksjon den kaller.

import { describe, expect, it } from 'vitest';
import { nokkeltall, budsjettutgifter, manedsutgifter } from './nokkeltall';
import { tikk } from './klokke';
import { taOppLaan } from './laan';
import { kjopBolig } from './bolig';
import { settSamboer } from './husholdning';
import { BOLIGER } from '../data/boliger';
import { SATSER, kontanter, medSaldo, nyTilstand } from './testhjelp';
import type { Laan } from '../types';

const FORBRUKSLAAN: Laan = {
    id: 'test-forbrukslan',
    type: 'forbrukslan',
    navn: 'Forbrukslån',
    restgjeld: 150000,
    arligRente: 0.14,
    terminerIgjen: 60,
    nedbetaling: 'annuitet',
    gebyr: 65,
};

describe('nettoformuen', () => {
    it('endrer seg ikke av å ta opp lån', () => {
        // Feilen som var: Oversikt leste formuen ferskt fra kontoene og gjelda
        // fra siste målepunkt. Tok eleven opp lån mens klokka sto stille, kom
        // pengene inn uten at gjelda fulgte med, og appen lærte bort at det å
        // låne penger gjør deg rikere.
        const foer = nyTilstand();
        const etter = taOppLaan(foer, FORBRUKSLAAN);

        const a = nokkeltall(foer, SATSER);
        const b = nokkeltall(etter, SATSER);

        expect(b.netto).toBe(a.netto);
        expect(b.kontanter).toBe(a.kontanter + FORBRUKSLAAN.restgjeld);
        expect(b.gjeld).toBe(FORBRUKSLAAN.restgjeld);
    });

    it('overlever et boligkjøp', () => {
        // Feilen som var: boligens verdi lå ikke i formuen, mens boliglånet lå
        // fullt ut i gjelda. Et helt vanlig kjøp sendte netto fra +717 600 til
        // -946 901 kr.
        const foer = tikk(medSaldo(nyTilstand(), 'bruks', 700000), SATSER);
        const etter = kjopBolig(foer, BOLIGER[0].id, 600000, 'annuitet');

        expect(etter.bolig).not.toBeNull();

        const a = nokkeltall(foer, SATSER);
        const b = nokkeltall(etter, SATSER);

        // Netto skal bare falle med omkostningene - dokumentavgift og
        // tinglysing er ekte penger ut. Resten er byttet, ikke tapt.
        expect(b.netto).toBeLessThan(a.netto);
        expect(a.netto - b.netto).toBeLessThan(150000);
        expect(b.eiendeler).toBeGreaterThan(1000000);
    });
});

describe('utgiftene', () => {
    it('teller terminbeløp på lån', () => {
        // Feilen som var: `utgifter` talte bare budsjettpostene. Terminbeløpene
        // ble trukket fra brukskontoen av `stegLaan`, men «til overs i måneden»
        // lot som de ikke fantes, og bommet med 40 755 kr på ett år.
        const utenLaan = nyTilstand();
        const medLaan = taOppLaan(utenLaan, FORBRUKSLAAN);

        const a = manedsutgifter(utenLaan);
        const b = manedsutgifter(medLaan);

        expect(a.gjeld).toBe(0);
        expect(b.gjeld).toBeGreaterThan(3000);
        expect(b.sum).toBe(b.budsjett + b.gjeld);
    });

    it('deler det felles med samboeren, slik motoren gjør', () => {
        // Feilen som var: klokka delte husleie, strøm, mat, forsikring og
        // abonnementer på utgiftsandelen, men hver eneste skjerm summerte
        // budsjettpostene rått. 7 650 kr i måneden var usynlige for eleven.
        const alene = nyTilstand('butikkansatt');
        const sammen = settSamboer(alene, true);

        expect(budsjettutgifter(sammen.profil)).toBeLessThan(budsjettutgifter(alene.profil));

        // Og skjermens tall skal være nøyaktig motorens tall.
        const tikket = tikk(sammen, SATSER);
        expect(nokkeltall(tikket, SATSER).utgifter.sum).toBeCloseTo(
            tikket.historikk[tikket.historikk.length - 1].utgifter,
            6
        );
    });

    it('regner ikke sparing som en utgift', () => {
        // Fast sparing og IPS flytter penger mellom elevens egne kontoer. De
        // bruker dem ikke, og skal ikke gjøre «til overs»-tallet mindre.
        const uten = nyTilstand();
        const med = {
            ...uten,
            profil: { ...uten.profil, manedligSparing: 3000, sparingTilKontoId: 'bsu' },
        };

        expect(manedsutgifter(med).sum).toBe(manedsutgifter(uten).sum);
    });
});

describe('overskuddet', () => {
    it('er nøyaktig det brukskontoen faktisk endrer seg med', () => {
        // Den identiteten hele framskrivningen hviler på. Holder den ikke,
        // blir «lagt på av renta» i grafen feil - og det var den.
        const start = taOppLaan(nyTilstand(), FORBRUKSLAAN);

        let naa = start;
        let sumOverskudd = 0;
        for (let i = 0; i < 12; i++) {
            naa = tikk(naa, SATSER);
            sumOverskudd += naa.historikk[naa.historikk.length - 1].overskudd;
        }

        const faktisk = kontanter(naa) - kontanter(start);
        // Differansen er renta på kontoene, som ikke er en del av overskuddet.
        // Den skal være liten og positiv, ikke titusener slik den var.
        const renteledd = faktisk - sumOverskudd;
        expect(renteledd).toBeGreaterThanOrEqual(0);
        expect(renteledd).toBeLessThan(5000);
    });
});

describe('skatteoppgjøret', () => {
    it('betaler ut BSU-fradraget ved nyttår', () => {
        // Feilen som var: fradraget ble vist på skjermen, men kronene kom
        // aldri. Da var BSU bare 0,5 prosentpoeng bedre rente enn en vanlig
        // sparekonto - mot bindingstid og to tak - og en elev som prøvde seg
        // fram ville med rette konkludert med at BSU ikke er verdt bryet.
        let naa = {
            ...nyTilstand(),
            profil: {
                ...nyTilstand().profil,
                manedligSparing: 2000,
                sparingTilKontoId: 'bsu',
            },
        };

        // Elleve måneder: BSU fylles opp, men skatteoppgjøret har ikke kommet.
        for (let i = 0; i < 11; i++) naa = tikk(naa, SATSER);
        expect(naa.milepaeler.some((m) => m.type === 'skatteoppgjor')).toBe(false);

        const foerNyttaar = kontanter(naa);

        // Den tolvte er nyttår, og da skal pengene komme. `innskuddTotalt`
        // nullstilles ikke, så det er den trygge måten å vite hva eleven
        // faktisk satte inn i løpet av året - `innskuddIAr` er borte etterpå.
        naa = tikk(naa, SATSER);
        const aaretsInnskudd =
            naa.profil.kontoer.find((k) => k.type === 'bsu')?.innskuddTotalt ?? 0;
        const oppgjor = naa.milepaeler.find((m) => m.type === 'skatteoppgjor');

        expect(aaretsInnskudd).toBeGreaterThan(0);
        expect(oppgjor).toBeDefined();
        expect(oppgjor?.grunnlag).toBeCloseTo(aaretsInnskudd * SATSER.bsu.fradragssats, 6);
        expect(kontanter(naa)).toBeGreaterThan(foerNyttaar);
    });

    it('gir ingenting til den som ikke har spart i BSU eller IPS', () => {
        // Personaene sparer i BSU fra start, så sparingen må skrus av her.
        const start = nyTilstand();
        let naa = { ...start, profil: { ...start.profil, manedligSparing: 0 } };
        for (let i = 0; i < 12; i++) naa = tikk(naa, SATSER);
        expect(naa.milepaeler.some((m) => m.type === 'skatteoppgjor')).toBe(false);
    });
});
