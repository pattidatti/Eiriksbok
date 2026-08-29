// Skattemotoren, prøvd mot regnestykker som kan ettergås for hånd.
//
// Tallene under er regnet ut fra satsfila, ikke skrevet av fra et
// skatteoppgjør. Poenget er ikke å bevise at Skatteetaten er enig i siste
// krone - fila lister sju bevisste forenklinger - men at motoren gjør det den
// selv sier den gjør, og at ingen fremtidig endring stille flytter en sats.

import { describe, expect, it } from 'vitest';
import { beregnLonnsslipp, beregnMinstefradrag, beregnTrinnskatt } from './skatt';
import { annuitet, nedbetalingsplan, terminbelop } from './laan';
import { bsuFradrag, bsuRom, manedligRente } from './sparing';
import { SATSER, nyTilstand } from './testhjelp';
import type { Konto, Laan } from '../types';

describe('minstefradraget', () => {
    it('er en andel av lønna, opp til grensa', () => {
        const { sats, maks } = SATSER.skatt.minstefradrag;
        expect(beregnMinstefradrag(100000, SATSER)).toBeCloseTo(100000 * sats, 6);
        expect(beregnMinstefradrag(2000000, SATSER)).toBe(maks);
    });

    it('er aldri større enn lønna selv', () => {
        // Kappingen mot lønna er en øvre grense, ikke en nedre: på 5 000 kr er
        // fradraget prosentandelen, ikke hele lønna.
        expect(beregnMinstefradrag(5000, SATSER)).toBeLessThanOrEqual(5000);
        expect(beregnMinstefradrag(5000, SATSER)).toBeCloseTo(
            5000 * SATSER.skatt.minstefradrag.sats,
            6
        );
        expect(beregnMinstefradrag(0, SATSER)).toBe(0);
        expect(beregnMinstefradrag(-1000, SATSER)).toBe(0);
    });
});

describe('trinnskatten', () => {
    it('lager ingen linje for trinn eleven ikke når opp i', () => {
        const under = SATSER.skatt.trinnskatt[0].fra - 1;
        expect(beregnTrinnskatt(under, SATSER)).toHaveLength(0);
    });

    it('tar bare sin egen skive av lønna', () => {
        const trinn1 = SATSER.skatt.trinnskatt[0];
        // Akkurat én krone inn i trinn 2: trinn 1 skal være full skive.
        const lonn = SATSER.skatt.trinnskatt[1].fra;
        const linjer = beregnTrinnskatt(lonn, SATSER);
        const forste = linjer[0];

        expect(forste.belop).toBeCloseTo(
            -((trinn1.til as number) - trinn1.fra) * trinn1.sats,
            6
        );
    });

    it('er progressiv: høyere lønn gir aldri lavere samlet skatt', () => {
        let forrige = 0;
        for (const lonn of [200000, 400000, 800000, 1200000, 2000000]) {
            const sum = beregnTrinnskatt(lonn, SATSER).reduce((s, l) => s - l.belop, 0);
            expect(sum).toBeGreaterThanOrEqual(forrige);
            forrige = sum;
        }
    });
});

describe('lønnsslippen', () => {
    it('har en netto som er brutto minus all skatt', () => {
        const profil = nyTilstand('nyutdannet').profil;
        const slipp = beregnLonnsslipp(profil, SATSER);
        expect(slipp.nettoArlig).toBeCloseTo(slipp.bruttoArlig - slipp.sumSkatt, 6);
        expect(slipp.nettoManedlig).toBeCloseTo(slipp.nettoArlig / 12, 6);
    });

    it('regner skattelinja nøyaktig av det oppgitte grunnlaget', () => {
        // Kontrakten i types.ts: `alminneligInntekt` er tallet etter
        // personfradrag, slik at skattelinja alltid er sats x grunnlag. Det er
        // det som gjør slippen mulig å ettergå for en elev.
        const profil = nyTilstand('butikkansatt').profil;
        const slipp = beregnLonnsslipp(profil, SATSER);
        const linje = slipp.linjer.find((l) => l.navn === 'Skatt på alminnelig inntekt');

        expect(linje).toBeDefined();
        expect(-(linje as { belop: number }).belop).toBeCloseTo(
            slipp.alminneligInntekt * SATSER.skatt.alminneligInntekt,
            6
        );
    });

    it('gir lavere skatt når eleven skrur på et fradrag', () => {
        const profil = nyTilstand('butikkansatt').profil;
        const uten = beregnLonnsslipp(profil, SATSER);
        const med = beregnLonnsslipp(
            { ...profil, fradrag: { ...profil.fradrag, fagforening: 8000 } },
            SATSER
        );

        expect(med.sumSkatt).toBeLessThan(uten.sumSkatt);
        // Fradraget er verdt satsen på alminnelig inntekt, ikke hele beløpet.
        expect(uten.sumSkatt - med.sumSkatt).toBeCloseTo(
            8000 * SATSER.skatt.alminneligInntekt,
            6
        );
    });

    it('tåler null i lønn uten å gi negativ skatt', () => {
        const profil = nyTilstand().profil;
        const slipp = beregnLonnsslipp({ ...profil, bruttoArslonn: 0 }, SATSER);
        expect(slipp.sumSkatt).toBe(0);
        expect(slipp.nettoArlig).toBe(0);
        expect(slipp.effektivSats).toBe(0);
    });
});

describe('BSU-takene', () => {
    const bsu = (innskuddIAr: number, innskuddTotalt: number): Konto => ({
        id: 'bsu',
        type: 'bsu',
        navn: 'BSU',
        saldo: innskuddTotalt,
        arligRente: 0.036,
        innskuddIAr,
        innskuddTotalt,
    });

    it('stopper på årstaket', () => {
        const rom = bsuRom(bsu(SATSER.bsu.arligTak, SATSER.bsu.arligTak), 20, SATSER);
        expect(rom.kanSpare).toBe(false);
        expect(rom.grunn).toContain('årets');
    });

    it('stopper på livstaket', () => {
        const rom = bsuRom(bsu(0, SATSER.bsu.samletTak), 25, SATSER);
        expect(rom.kanSpare).toBe(false);
        expect(rom.samletIgjen).toBe(0);
    });

    it('stopper på aldersgrensa', () => {
        const rom = bsuRom(bsu(0, 0), SATSER.bsu.maksAlder + 1, SATSER);
        expect(rom.kanSpare).toBe(false);
    });

    it('gir fradrag av årets innskudd, aldri av mer enn taket', () => {
        expect(bsuFradrag(10000, SATSER)).toBeCloseTo(10000 * SATSER.bsu.fradragssats, 6);
        expect(bsuFradrag(SATSER.bsu.arligTak * 2, SATSER)).toBeCloseTo(
            SATSER.bsu.arligTak * SATSER.bsu.fradragssats,
            6
        );
    });
});

describe('renter', () => {
    it('gir nøyaktig årsrenta etter tolv måneder på sparing', () => {
        // Sparing oppgir renta som det du faktisk sitter igjen med etter et år,
        // så tolv månedsrenter skal gi den tilbake. Deler man på 12 i stedet,
        // bommer en 40-årsframskrivning med tusenvis av kroner.
        const arlig = 0.036;
        expect(Math.pow(1 + manedligRente(arlig), 12) - 1).toBeCloseTo(arlig, 12);
    });

    it('betaler ned et annuitetslån på nøyaktig avtalt tid', () => {
        const laan: Laan = {
            id: 'a',
            type: 'boliglan',
            navn: 'Boliglån',
            restgjeld: 2000000,
            arligRente: 0.052,
            terminerIgjen: 300,
            nedbetaling: 'annuitet',
            gebyr: 0,
        };
        const plan = nedbetalingsplan(laan);
        expect(plan.antallTerminer).toBe(300);
        expect(plan.aldriFerdig).toBe(false);
        expect(plan.punkter[299].restgjeld).toBeLessThan(1);
    });

    it('lar annuitetsformelen og planen bli enige', () => {
        const ytelse = annuitet(500000, 0.06, 120);
        const laan: Laan = {
            id: 'b',
            type: 'forbrukslan',
            navn: 'Lån',
            restgjeld: 500000,
            arligRente: 0.06,
            terminerIgjen: 120,
            nedbetaling: 'annuitet',
            gebyr: 0,
        };
        expect(terminbelop(laan)).toBeCloseTo(ytelse, 6);
    });

    it('viser kredittkortfella: minstebeløpet tar nesten evig tid', () => {
        const kort: Laan = {
            id: 'c',
            type: 'kredittkort',
            navn: 'Kredittkort',
            restgjeld: 40000,
            arligRente: 0.199,
            terminerIgjen: 0,
            nedbetaling: 'minste',
            minsteinnbetalingSats: 0.03,
            gebyr: 0,
        };
        const plan = nedbetalingsplan(kort);
        // Over ti år på 40 000 kr, og renta blir større enn hovedstolen.
        expect(plan.antallTerminer).toBeGreaterThan(120);
        expect(plan.sumRenter).toBeGreaterThan(kort.restgjeld);
    });
});
