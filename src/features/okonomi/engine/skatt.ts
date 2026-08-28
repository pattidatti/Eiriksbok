// Pengeliv - skattemotoren.
//
// Ren, sidefri regnemodul. Ingen React, ingen store, ingen fetch. Inn går en
// `Profil` og et sett `Satser`; ut kommer en ferdig `Lonnsslipp` der hver linje
// har en forklaring skrevet for en 14-åring. Forklaringene er ikke pynt: de er
// hoveddelen av læringen i modulen.
//
// ---------------------------------------------------------------------------
// REGNEMODELLEN - veien fra brutto til netto
// ---------------------------------------------------------------------------
//
//   personinntekt      = brutto årslønn
//   minstefradrag      = min(sats * personinntekt, maks)
//   alminnelig inntekt = personinntekt
//                        - minstefradrag
//                        - renter betalt
//                        - reisefradrag (pendling)
//                        - fagforeningskontingent
//                        - personfradrag          (gulv: 0)
//
//   skatt på alminnelig inntekt = 22 % av alminnelig inntekt
//   trygdeavgift                = 7,6 % av personinntekt
//   trinnskatt                  = per trinn: sats * den delen av
//                                 personinntekten som ligger inne i trinnet
//
//   sum skatt = skatt på alminnelig inntekt + trygdeavgift + all trinnskatt
//   netto     = personinntekt - sum skatt
//
// Merk om ordbruken: i norsk skatterett betyr «alminnelig inntekt» strengt tatt
// summen før personfradraget trekkes fra, og det som blir igjen etterpå heter
// «grunnlag for skatt på alminnelig inntekt». `Lonnsslipp.alminneligInntekt`
// følger definisjonen i types.ts - «grunnlaget alminnelig inntektsskatt regnes
// av» - og er derfor tallet etter personfradrag. Da gjelder alltid at
// skattelinja er nøyaktig sats * alminneligInntekt, som er lett å etterprøve.
//
// ---------------------------------------------------------------------------
// FORTEGN OG LINJEMODELL
// ---------------------------------------------------------------------------
//
// Regelen er én: positivt beløp er i elevens favør, negativt er penger ut.
// I praksis gir det to slags linjer:
//
//   Grunnlagslinjer (positivt belop) er lønna og alle fradragene. Et fradrag
//   flytter ikke penger i seg selv, det gjør bare beløpet som skattlegges
//   mindre - men det virker alltid i elevens favør, så det er positivt.
//   Rekkefølge: bruttolønn, minstefradrag, rentefradrag, reisefradrag,
//   fagforening, personfradrag.
//
//   Pengelinjer (negativt belop) er skatt som faktisk trekkes: skatt på
//   alminnelig inntekt, trygdeavgift og ett linje per trinnskattrinn som
//   treffes. Trinn eleven ikke tjener nok til å nå, blir ikke laget.
//
// Konsekvensen å være klar over: summen av alle `linjer` er IKKE nettolønna,
// fordi fradragslinjene teller beløp som aldri var penger på konto.
// `sumSkatt` er summen av pengelinjene med snudd fortegn, og
// `nettoArlig = bruttoArlig - sumSkatt`.
//
// ---------------------------------------------------------------------------
// FORENKLINGER MOT EKTE NORSK SKATTERETT
// ---------------------------------------------------------------------------
//
// 1. Trygdeavgift regnes flatt av hele personinntekten. Ekte regel har en nedre
//    grense (ingen avgift under et visst beløp) og en opptrappingsregel like
//    over den. Grensene finnes ikke i `Satser`, så de er utelatt. Det gir for
//    høy skatt for de aller laveste inntektene, typisk under ca. 100 000 kr.
// 2. Fagforeningskontingent og reisefradrag brukes akkurat som eleven har satt
//    dem. Ekte regler har et årlig tak på fagforeningsfradraget og en egenandel
//    på reisefradraget. Motoren håndhever ingen av delene.
// 3. Rentefradraget er hele det betalte rentebeløpet. Det stemmer for vanlige
//    lån, men ikke for de særreglene som gjelder enkelte lånetyper.
// 4. Bare lønn er med. Kapitalinntekt, utbytte, næringsinntekt, pensjon,
//    formuesskatt og barnetrygd hører hjemme i andre moduler.
// 5. BSU gir et fradrag i selve skatten, ikke i inntekten, og regnes derfor
//    ikke her. Sparemodulen eier den.
// 6. Ingen avrunding underveis. Skatteetaten runder av på flere trinn, så
//    resultatet kan avvike med noen få kroner fra et ekte skatteoppgjør.
// 7. Ett skatteår om gangen. Motoren vet ingenting om forskuddstrekk,
//    skattekort, restskatt eller tilbakebetaling.

import type { Fradrag, Lonnsslipp, Profil, Satser, SkattLinje } from '../types';

/** Formaterer et beløp som «108 550 kr» med mellomrom mellom tusenene. */
function kr(belop: number): string {
    const avrundet = Math.round(belop);
    const tegn = avrundet < 0 ? '-' : '';
    const sifre = Math.abs(avrundet).toString();
    let ut = '';
    for (let i = 0; i < sifre.length; i += 1) {
        if (i > 0 && (sifre.length - i) % 3 === 0) {
            ut += ' ';
        }
        ut += sifre[i];
    }
    return `${tegn}${ut} kr`;
}

/** Gjør 0.076 om til «7,6» slik det skrives på norsk. */
function pst(sats: number): string {
    return (Math.round(sats * 1000) / 10).toString().replace('.', ',');
}

/**
 * Minstefradraget alle lønnsmottakere får automatisk: en fast prosent av
 * lønna, men aldri mer enn den øvre grensa. Aldri mer enn lønna heller.
 */
export function beregnMinstefradrag(personinntekt: number, satser: Satser): number {
    const inntekt = Math.max(0, personinntekt);
    const { sats, maks } = satser.skatt.minstefradrag;
    return Math.min(inntekt * sats, maks, inntekt);
}

/**
 * Trinnskatten, ett linje per trinn som faktisk treffes. Hvert trinn tar bare
 * sin egen skive av lønna, så en høy sats rammer aldri hele inntekten.
 * Beløpene er negative: dette er skatt som trekkes.
 */
export function beregnTrinnskatt(personinntekt: number, satser: Satser): SkattLinje[] {
    const inntekt = Math.max(0, personinntekt);
    const linjer: SkattLinje[] = [];

    satser.skatt.trinnskatt.forEach((trinn, indeks) => {
        const tak = trinn.til === null ? inntekt : Math.min(inntekt, trinn.til);
        const iDetteTrinnet = Math.max(0, tak - trinn.fra);
        if (iDetteTrinnet <= 0) {
            return;
        }

        const skiven =
            trinn.til === null
                ? `alt du tjener over ${kr(trinn.fra)}`
                : `lønna mellom ${kr(trinn.fra)} og ${kr(trinn.til)}`;

        linjer.push({
            navn: `Trinnskatt trinn ${indeks + 1}`,
            belop: -(iDetteTrinnet * trinn.sats),
            sats: trinn.sats,
            forklaring:
                `Trinnskatt er ekstraskatt for dem som tjener mest, og den øker trinn for ` +
                `trinn. Her betaler du ${pst(trinn.sats)} prosent av ${skiven}, altså av ` +
                `${kr(iDetteTrinnet)} av lønna di. Resten av lønna slipper unna nettopp ` +
                `denne satsen.`,
        });
    });

    return linjer;
}

/** Fradragene fra profilen, som linjer. Bare de eleven faktisk har. */
function fradragslinjer(fradrag: Fradrag): SkattLinje[] {
    const linjer: SkattLinje[] = [];

    if (fradrag.renterBetalt > 0) {
        linjer.push({
            navn: 'Rentefradrag',
            belop: fradrag.renterBetalt,
            forklaring:
                `Du har betalt ${kr(fradrag.renterBetalt)} i renter på lån i løpet av året. ` +
                `Renter du betaler får du trekke fra inntekten før skatten regnes ut, og da ` +
                `blir skatten lavere. Staten tar altså en del av renteregningen din.`,
        });
    }

    if (fradrag.pendling > 0) {
        linjer.push({
            navn: 'Reisefradrag',
            belop: fradrag.pendling,
            forklaring:
                `Du reiser langt til jobb, og ${kr(fradrag.pendling)} av det får du trekke ` +
                `fra. Fradraget heter reisefradrag. Det finnes fordi lang vei til jobb ` +
                `koster penger du ikke kan velge bort.`,
        });
    }

    if (fradrag.fagforening > 0) {
        linjer.push({
            navn: 'Fagforeningsfradrag',
            belop: fradrag.fagforening,
            forklaring:
                `Du har betalt ${kr(fradrag.fagforening)} i kontingent til fagforeningen din. ` +
                `Den summen får du trekke fra inntekten, så du slipper å betale skatt av ` +
                `penger du har brukt på medlemskapet.`,
        });
    }

    return linjer;
}

/**
 * Hele veien fra brutto til netto, linje for linje, som et ekte skatteoppgjør.
 * Se kommentaren øverst i fila for regnemodell, fortegn og forenklinger.
 */
export function beregnLonnsslipp(profil: Profil, satser: Satser): Lonnsslipp {
    const personinntekt = Math.max(0, profil.bruttoArslonn);
    const linjer: SkattLinje[] = [];

    // --- Grunnlagslinjer: lønna og alt som trekkes fra før skatten regnes ---

    linjer.push({
        navn: 'Bruttolønn',
        belop: personinntekt,
        forklaring:
            `Dette er hele lønna di før skatt, ${kr(personinntekt)} i året. Den kalles ` +
            `brutto, og det er dette beløpet som står i arbeidsavtalen. Det er ikke ` +
            `pengene som kommer inn på konto.`,
    });

    const minstefradrag = beregnMinstefradrag(personinntekt, satser);
    const mf = satser.skatt.minstefradrag;
    linjer.push({
        navn: 'Minstefradrag',
        belop: minstefradrag,
        sats: mf.sats,
        forklaring:
            `Alle som har lønn får trekke fra en del av den før skatten regnes ut. Det ` +
            `kalles minstefradrag, og du får det automatisk uten å søke. Det er ` +
            `${pst(mf.sats)} prosent av lønna, men aldri mer enn ${kr(mf.maks)}. For deg ` +
            `blir det ${kr(minstefradrag)}.`,
    });

    const ovrigeFradrag = fradragslinjer(profil.fradrag);
    linjer.push(...ovrigeFradrag);

    const sumOvrigeFradrag = ovrigeFradrag.reduce((sum, linje) => sum + linje.belop, 0);
    const personfradrag = satser.skatt.personfradrag;

    if (personfradrag > 0) {
        linjer.push({
            navn: 'Personfradrag',
            belop: personfradrag,
            forklaring:
                `På toppen får alle trekke fra ${kr(personfradrag)}. Det kalles ` +
                `personfradrag, og alle voksne får det samme beløpet uansett hvor mye de ` +
                `tjener. Det er derfor de første kronene du tjener i året er skattefrie.`,
        });
    }

    const alminneligInntekt = Math.max(
        0,
        personinntekt - minstefradrag - sumOvrigeFradrag - personfradrag
    );

    // --- Pengelinjer: skatten som faktisk trekkes ---

    const satsAlminnelig = satser.skatt.alminneligInntekt;
    const skattAlminnelig = alminneligInntekt * satsAlminnelig;
    linjer.push({
        navn: 'Skatt på alminnelig inntekt',
        belop: -skattAlminnelig,
        sats: satsAlminnelig,
        forklaring:
            `Nå regnes den vanlige inntektsskatten ut. Etter alle fradragene er det ` +
            `${kr(alminneligInntekt)} igjen å skatte av, og av det tar staten ` +
            `${pst(satsAlminnelig)} prosent. Dette er den skatten de aller fleste betaler ` +
            `mest av.`,
    });

    const satsTrygd = satser.skatt.trygdeavgiftLonn;
    const trygdeavgift = personinntekt * satsTrygd;
    linjer.push({
        navn: 'Trygdeavgift',
        belop: -trygdeavgift,
        sats: satsTrygd,
        forklaring:
            `${pst(satsTrygd)} prosent av hele lønna går til folketrygden, som betaler ` +
            `sykepenger, uføretrygd og pensjon - også dine, den dagen du trenger dem. Her ` +
            `hjelper ingen fradrag: avgiften regnes av hele lønna, ikke av det som er igjen.`,
    });

    const trinnlinjer = beregnTrinnskatt(personinntekt, satser);
    linjer.push(...trinnlinjer);

    // --- Summering ---

    const sumSkatt = linjer
        .filter((linje) => linje.belop < 0)
        .reduce((sum, linje) => sum - linje.belop, 0);

    const nettoArlig = personinntekt - sumSkatt;

    return {
        bruttoArlig: personinntekt,
        nettoArlig,
        nettoManedlig: nettoArlig / 12,
        sumSkatt,
        effektivSats: personinntekt > 0 ? sumSkatt / personinntekt : 0,
        personinntekt,
        alminneligInntekt,
        linjer,
    };
}
