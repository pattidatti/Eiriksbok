// Framskrivningen: at grafen forteller sant om hva som er elevens egne penger
// og hva renta har lagt på.
//
// Feilen som var: `innskutt` vokste fortere enn formuen fordi utgiftene ikke
// talte terminbeløp, og `avkastning = nominelt - innskutt` ble negativ. Grafen
// påsto at renta tok penger fra eleven, med det grønne feltet - hele modulens
// poeng - pekende nedover.

import { describe, expect, it } from 'vitest';
import { framskriv } from './projeksjon';
import { tikk } from './klokke';
import { taOppLaan } from './laan';
import { nokkeltall } from './nokkeltall';
import { SATSER, medSaldo, nyTilstand } from './testhjelp';
import type { Laan } from '../types';

const BOLIGLAAN: Laan = {
    id: 'test-boliglan',
    type: 'boliglan',
    navn: 'Boliglån',
    restgjeld: 1800000,
    arligRente: 0.052,
    terminerIgjen: 300,
    nedbetaling: 'annuitet',
    gebyr: 65,
};

describe('framskrivningen', () => {
    it('gir ett punkt per år, og starter i dag', () => {
        const punkter = framskriv(nyTilstand(), SATSER, 25);
        expect(punkter).toHaveLength(26);
        expect(punkter[0].alder).toBe(18);
        expect(punkter[25].alder).toBe(43);
    });

    it('lar aldri renta se ut som et tap når eleven har gjeld', () => {
        const medGjeld = taOppLaan(nyTilstand(), BOLIGLAAN);
        for (const punkt of framskriv(medGjeld, SATSER, 25)) {
            expect(punkt.avkastning).toBeGreaterThanOrEqual(0);
        }
    });

    it('holder innskutt under det samlede beløpet', () => {
        // Ellers tegnes den lyse linja utenfor lerretet og fyllet peker feil
        // vei, fordi y-aksen settes fra `nominelt`.
        const medGjeld = taOppLaan(nyTilstand(), BOLIGLAAN);
        for (const punkt of framskriv(medGjeld, SATSER, 25)) {
            expect(punkt.innskutt).toBeLessThanOrEqual(punkt.nominelt + 1);
        }
    });

    it('regner innskutt + avkastning til nøyaktig det samlede beløpet', () => {
        for (const punkt of framskriv(nyTilstand('nyutdannet'), SATSER, 40)) {
            expect(punkt.innskutt + punkt.avkastning).toBeCloseTo(punkt.nominelt, 6);
        }
    });

    it('viser dagens kroner som mindre verdt enn de nominelle', () => {
        const punkter = framskriv(medSaldo(nyTilstand(), 'spare', 100000), SATSER, 30);
        const siste = punkter[30];
        expect(siste.dagensKroner).toBeLessThan(siste.nominelt);
        expect(siste.dagensKroner).toBeCloseTo(
            siste.nominelt / Math.pow(1 + SATSER.inflasjon, 30),
            6
        );
    });

    it('rører ikke elevens egen tilstand', () => {
        // Den regelen er grunnen til at hvert steg er en ren funksjon.
        // Framskrivningen kjøres på nytt for hvert museklikk på en skyveknapp.
        const tilstand = nyTilstand();
        const foer = JSON.stringify(tilstand);
        framskriv(tilstand, SATSER, 40);
        expect(JSON.stringify(tilstand)).toBe(foer);
    });

    it('gir samme svar hver gang den kjøres', () => {
        // Markedet er frøbasert, ikke tilfeldig. Uten det ville eleven målt
        // flaks i stedet for valg.
        const tilstand = nyTilstand('nyutdannet');
        const a = framskriv(tilstand, SATSER, 30);
        const b = framskriv(tilstand, SATSER, 30);
        expect(a).toEqual(b);
    });

    it('slutter ikke på et sammenbrudd fordi eleven kjøper bolig', () => {
        // Boligen er med i nettoformuen nå. Framskrivningen skal derfor vise en
        // kurve som fortsetter, ikke et stup ned i minus.
        const tilstand = tikk(medSaldo(nyTilstand('nyutdannet'), 'bruks', 900000), SATSER);
        const punkter = framskriv(tilstand, SATSER, 20);
        expect(punkter[20].nominelt).toBeGreaterThan(nokkeltall(tilstand, SATSER).netto);
    });
});
