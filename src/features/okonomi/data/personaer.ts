// De fire ferdige startpakkene eleven velger mellom, og oversettelsen fra
// persona til en full `Profil`.
//
// Personaen er stillas som fjernes: i det eleven har valgt, er dette elevens
// egne tall, og alt kan endres i modulene.
//
// Tallene er norske 2026-tall, hentet fra:
// - Husleiebarometeret Q2 2026 (Menon/Hybel.no): ettromsleilighet 9 324 kr,
//   rom i kollektiv 6 521 kr i snitt per måned.
// - SIFO referansebudsjett 2026 for mat, klær og fritid for enslige unge.
// - Lærlinglønn 2026: prosentandel av fagarbeiderlønn på rundt 455 000 kr.
// - Tariffnivå i varehandel og for nyutdannede med treårig høyskole.
//
// Blueprint: docs/Design documents/pengeliv-blueprint.md (seksjon 5)

import type { Budsjett, Konto, Persona, Profil } from '../types';
import { tomProfilUtvidelse } from '../engine/starttilstand';

// Renter på kontoene ved start. Eleven kan bytte bank senere; dette er
// nivået norske banker ligger på i 2026.
const RENTE_BRUKSKONTO = 0.001;
const RENTE_SPAREKONTO = 0.031;
const RENTE_BSU = 0.036;

/**
 * Bygger et budsjett fra ni beløp. Rekkefølgen er fast og lik for alle
 * personaer: det tunge og uunngåelige først, det valgfrie sist.
 */
function budsjett(belop: {
    husleie: number;
    strom: number;
    mat: number;
    mobil: number;
    transport: number;
    forsikring: number;
    abonnementer: number;
    klar: number;
    moro: number;
}): Budsjett {
    return [
        { id: 'husleie', navn: 'Husleie', belop: belop.husleie, fast: true },
        { id: 'strom', navn: 'Strøm', belop: belop.strom, fast: true },
        { id: 'mat', navn: 'Mat og dagligvarer', belop: belop.mat, fast: false },
        { id: 'mobil', navn: 'Mobil og internett', belop: belop.mobil, fast: true },
        { id: 'transport', navn: 'Buss, bane og bil', belop: belop.transport, fast: false },
        { id: 'forsikring', navn: 'Forsikring', belop: belop.forsikring, fast: true },
        { id: 'abonnementer', navn: 'Abonnementer', belop: belop.abonnementer, fast: false },
        { id: 'klar', navn: 'Klær og sko', belop: belop.klar, fast: false },
        { id: 'moro', navn: 'Moro og fritid', belop: belop.moro, fast: false },
    ];
}

export const PERSONAER: Persona[] = [
    {
        id: 'laerling',
        navn: 'Jonas',
        beskrivelse:
            'Går andre året som lærling i tømrerfaget. Bor fortsatt hjemme og betaler litt til foreldrene, så det blir mye igjen av lønna.',
        alder: 18,
        yrke: 'Lærling, tømrerfaget',
        bruttoArslonn: 245000,
        startSaldo: { bruks: 8000, spare: 12000 },
        budsjett: budsjett({
            husleie: 3000,
            strom: 500,
            mat: 3800,
            mobil: 349,
            transport: 1500,
            forsikring: 700,
            abonnementer: 350,
            klar: 700,
            moro: 1800,
        }),
        manedligSparing: 3000,
    },
    {
        id: 'student',
        navn: 'Maja',
        beskrivelse:
            'Studerer og står i butikk ved siden av. Bor i kollektiv, og her teller hver hundrelapp.',
        alder: 20,
        yrke: 'Student med deltidsjobb',
        bruttoArslonn: 192000,
        startSaldo: { bruks: 4500, spare: 3000 },
        budsjett: budsjett({
            husleie: 5900,
            strom: 550,
            mat: 3600,
            mobil: 299,
            transport: 550,
            forsikring: 200,
            abonnementer: 250,
            klar: 500,
            moro: 1000,
        }),
        manedligSparing: 1000,
    },
    {
        id: 'butikkansatt',
        navn: 'Amina',
        beskrivelse:
            'Jobber full tid i dagligvarebutikk og har nettopp flyttet inn i sin egen ettromsleilighet.',
        alder: 22,
        yrke: 'Butikkmedarbeider',
        bruttoArslonn: 430000,
        startSaldo: { bruks: 11000, spare: 24000, bsu: 15000 },
        budsjett: budsjett({
            husleie: 9300,
            strom: 900,
            mat: 4300,
            mobil: 399,
            transport: 850,
            forsikring: 400,
            abonnementer: 400,
            klar: 800,
            moro: 2200,
        }),
        manedligSparing: 4000,
    },
    {
        id: 'nyutdannet',
        navn: 'Emil',
        beskrivelse:
            'Ferdig utdannet sykepleier og i sin første faste jobb. Tjener mest av de fire, men bor også dyrest.',
        alder: 24,
        yrke: 'Nyutdannet sykepleier',
        bruttoArslonn: 560000,
        startSaldo: { bruks: 18000, spare: 45000, bsu: 60000 },
        budsjett: budsjett({
            husleie: 11500,
            strom: 1100,
            mat: 4700,
            mobil: 449,
            transport: 900,
            forsikring: 600,
            abonnementer: 500,
            klar: 1000,
            moro: 2800,
        }),
        manedligSparing: 6000,
    },
];

/** Finner en persona på id. Returnerer null hvis id-en ikke finnes. */
export function personaMedId(id: string): Persona | null {
    return PERSONAER.find((p) => p.id === id) ?? null;
}

/**
 * Bygger en full `Profil` fra en persona.
 *
 * Brukskonto, sparekonto og BSU opprettes alltid, også med saldo 0. Eleven
 * skal se at kontoen finnes og kan brukes, ikke måtte lage den først. ASK og
 * IPS opprettes bare når personaen faktisk har penger der, siden de hører til
 * moduler som kommer senere.
 */
export function profilFraPersona(persona: Persona): Profil {
    const kontoer: Konto[] = [
        {
            id: 'bruks',
            type: 'bruks',
            navn: 'Brukskonto',
            saldo: persona.startSaldo.bruks ?? 0,
            arligRente: RENTE_BRUKSKONTO,
            innskuddIAr: 0,
            innskuddTotalt: 0,
        },
        {
            id: 'spare',
            type: 'spare',
            navn: 'Sparekonto',
            saldo: persona.startSaldo.spare ?? 0,
            arligRente: RENTE_SPAREKONTO,
            innskuddIAr: 0,
            innskuddTotalt: persona.startSaldo.spare ?? 0,
        },
        {
            id: 'bsu',
            type: 'bsu',
            navn: 'BSU',
            saldo: persona.startSaldo.bsu ?? 0,
            arligRente: RENTE_BSU,
            innskuddIAr: 0,
            innskuddTotalt: persona.startSaldo.bsu ?? 0,
        },
    ];

    if (persona.startSaldo.ask !== undefined) {
        kontoer.push({
            id: 'ask',
            type: 'ask',
            navn: 'Aksjesparekonto',
            saldo: persona.startSaldo.ask,
            arligRente: 0,
            innskuddIAr: 0,
            innskuddTotalt: persona.startSaldo.ask,
        });
    }

    if (persona.startSaldo.ips !== undefined) {
        kontoer.push({
            id: 'ips',
            type: 'ips',
            navn: 'Pensjonssparing (IPS)',
            saldo: persona.startSaldo.ips,
            arligRente: 0,
            innskuddIAr: 0,
            innskuddTotalt: persona.startSaldo.ips,
        });
    }

    return {
        ...tomProfilUtvidelse(),
        personaId: persona.id,
        navn: persona.navn,
        alder: persona.alder,
        yrke: persona.yrke,
        bruttoArslonn: persona.bruttoArslonn,
        // Alle fradrag står av ved start. Poenget er at eleven skrur dem på
        // selv og ser hva hvert enkelt gjør med skatten.
        fradrag: {
            renterBetalt: 0,
            pendling: 0,
            fagforening: 0,
        },
        kontoer,
        // Personaene starter alle med å bo alene. Samboer og barn er noe
        // eleven velger selv i Husholdning-modulen.
        budsjett: persona.budsjett.map((post) => ({ ...post })),
        husholdning: {
            harSamboer: false,
            utgiftsandel: 1,
            barn: [],
        },
        manedligSparing: persona.manedligSparing,
        // Sparingen peker mot BSU fra start, fordi BSU både gir fradrag nå og
        // peker mot den store milepælen: egen bolig.
        sparingTilKontoId: 'bsu',
    };
}
