// Karriere: jobben du har, jobben du kan søke, og utdanningen som er en
// investering.
//
// Modulen har én påstand den skal bevise, og den beviser den med tall eleven
// selv kan se: en utdanning koster noe nå og gir noe senere, akkurat som et
// fond. Kostnaden er tapt lønn i studieårene pluss studiegjelda. Avkastningen
// er en høyere lønn resten av arbeidslivet. Begge sidene regnes ut med den
// ekte motoren gjennom `framskriv`, ikke med et anslag skrevet inn her.
//
// Og noen ganger går regnestykket i minus. Da står det i minus. Appen sier
// ikke at utdanning alltid lønner seg, for det gjør den ikke.

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Lock, TrendingUp } from 'lucide-react';
import { usePengelivStore } from '../store/pengelivStore';
import { framskriv } from '../engine/projeksjon';
import { PENSJONSALDER } from '../engine/pensjon';
import {
    lonnVed,
    lonnsforlop,
    lonnsokningssvar,
    livsinntekt,
    muligeUtdanninger,
    samletStudielaan,
    studiestatus,
    utdanningsscenario,
    veiTilTopp,
} from '../engine/karriere';
import {
    DELTIDSVALG,
    NIVAER,
    NIVA_KORT,
    YRKER,
    nivaOppfylt,
    utdanningMedId,
    yrkeEtterUtdanning,
    yrkeMedId,
} from '../data/yrker';
import { stipendomgjoring } from '../data/laanprodukter';
import { FramskrivningsGraf } from '../components/FramskrivningsGraf';
import { Forklaring, Knapp, Kort, Kroner, formaterProsent } from '../components/primitives';
import type { Utdanningsniva, Yrke } from '../types';

/** Hva som mangler for å kunne søke en jobb, sagt i klartekst. */
const KRAVTEKST: Record<Utdanningsniva, string> = {
    ingen: '',
    fagbrev: 'Du må ha fagbrev for å søke denne jobben.',
    bachelor: 'Du må ha en bachelor for å søke denne jobben.',
    master: 'Du må ha en master for å søke denne jobben.',
};

export function KarriereModul() {
    const tilstand = usePengelivStore((s) => s.tilstand);
    const satser = usePengelivStore((s) => s.satser);
    const soekJobb = usePengelivStore((s) => s.soekJobb);
    const beOmLonnsokning = usePengelivStore((s) => s.beOmLonnsokning);
    const startUtdanning = usePengelivStore((s) => s.startUtdanning);
    const settLonn = usePengelivStore((s) => s.settLonn);

    const [valgtUtdanning, setValgtUtdanning] = useState<string | null>(null);
    const [deltid, setDeltid] = useState<number>(DELTIDSVALG[2].lonn);
    /** Lønna slik den var da eleven sist spurte om påslag, og måneden hun spurte. */
    const [spurte, setSpurte] = useState<{ maaned: number; lonn: number } | null>(null);
    /** Meldingen som kommer når eleven trykker på en jobb hun ikke kan få. */
    const [sperre, setSperre] = useState<string | null>(null);

    const studererId = tilstand?.profil.studererId ?? null;

    // To hele livsløp regnes ut her, ett med utdanningen og ett uten. Det er
    // dyrt nok til at det bare skal skje når eleven faktisk har valgt en
    // utdanning å se på, og billig nok til at det kan skje hver gang hun
    // bytter mellom dem.
    const sammenligning = useMemo(() => {
        if (!tilstand || !satser || !valgtUtdanning || studererId) return null;
        const utdanning = utdanningMedId(valgtUtdanning);
        if (!utdanning) return null;

        const aar = Math.max(1, PENSJONSALDER - tilstand.profil.alder);
        const medUtdanning = utdanningsscenario(tilstand, utdanning.id, deltid);
        if (medUtdanning === tilstand) return null;

        const forlopUten = lonnsforlop(tilstand);
        const forlopMed = lonnsforlop(medUtdanning);
        let taptLonn = 0;
        for (let i = 0; i < utdanning.aar && i < forlopUten.length; i++) {
            taptLonn += forlopUten[i] - forlopMed[i];
        }

        const punkterMed = framskriv(medUtdanning, satser, aar);
        const punkterUten = framskriv(tilstand, satser, aar);
        const formueMed = punkterMed[punkterMed.length - 1].nominelt;
        const formueUten = punkterUten[punkterUten.length - 1].nominelt;

        const laanTotalt = samletStudielaan(utdanning);
        const omgjort = stipendomgjoring(laanTotalt, true);

        return {
            utdanning,
            punkter: punkterMed,
            aar,
            taptLonn,
            laanTotalt,
            stipend: omgjort.stipend,
            studiegjeld: omgjort.gjeld,
            livsinntektMed: livsinntekt(medUtdanning),
            livsinntektUten: livsinntekt(tilstand),
            formueMed,
            formueUten,
            jobbEtter: yrkeEtterUtdanning(utdanning.id),
        };
    }, [tilstand, satser, valgtUtdanning, deltid, studererId]);

    // Mens studiet pågår viser vi den samme grafen for veien eleven faktisk
    // står i, slik at investeringen fortsatt er noe hun kan se på.
    const studiegraf = useMemo(() => {
        if (!tilstand || !satser || !studererId) return null;
        return framskriv(tilstand, satser, Math.max(1, PENSJONSALDER - tilstand.profil.alder));
    }, [tilstand, satser, studererId]);

    if (!tilstand || !satser) {
        return (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                Henter yrkene...
            </div>
        );
    }

    const profil = tilstand.profil;
    const studie = studiestatus(tilstand);
    const yrke = yrkeMedId(profil.yrkeId);
    const svar = lonnsokningssvar(tilstand);
    const utdanninger = muligeUtdanninger(tilstand);

    // Spurte eleven denne måneden, og hva ble svaret? Vi leser det av lønna i
    // stedet for å lagre svaret: gikk den opp, sa sjefen ja.
    const spurteNaa = spurte !== null && spurte.maaned === tilstand.maaned;
    const fikkJa = spurteNaa && profil.bruttoArslonn > spurte.lonn;

    function spor() {
        setSpurte({ maaned: tilstand!.maaned, lonn: tilstand!.profil.bruttoArslonn });
        beOmLonnsokning();
    }

    function velgJobb(kandidat: Yrke) {
        if (profil.studererId !== null) {
            setSperre('Du studerer nå. Fullfør graden først, så kan du søke jobb.');
            return;
        }
        if (!nivaOppfylt(profil.utdanningsniva, kandidat.krav)) {
            setSperre(`${kandidat.navn}: ${KRAVTEKST[kandidat.krav]}`);
            return;
        }
        setSperre(null);
        soekJobb(kandidat.id);
    }

    return (
        <div className="flex flex-col gap-2">
            <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-xl font-bold text-slate-900">Karriere</h1>
                <p className="text-sm text-slate-600">
                    Jobben din bestemmer alt annet i budsjettet. Og en utdanning er en investering:
                    den koster deg penger nå, og skal gi deg mer senere.
                </p>
            </header>

            {/* Status: jobben du har, eller studiet du står midt i. */}
            {studie ? (
                <Kort
                    tittel={studie.utdanning.navn}
                    undertittel={`Studieår ${studie.aarNaa} av ${studie.utdanning.aar}. ${studie.manederIgjen} måneder igjen.`}
                    ikon={<GraduationCap className="h-4 w-4" />}
                    handling={
                        <span className="text-right">
                            <span className="block text-[11px] leading-tight text-slate-500">
                                Du tjener i året
                            </span>
                            <Kroner
                                verdi={profil.bruttoArslonn}
                                className="text-lg font-bold text-indigo-700!"
                            />
                        </span>
                    }
                >
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                            <Nokkeltall
                                navn="Lånt så langt, rentefritt"
                                belop={studie.laanTattOpp}
                            />
                            <Nokkeltall
                                navn="Blir stipend om du fullfører"
                                belop={studie.blirStipend}
                                gronn
                            />
                            <Nokkeltall navn="Blir gjeld" belop={studie.blirGjeld} />
                        </div>
                        {studie.utdanning.laanPerAar > 0 && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">
                                    Jobb ved siden av:
                                </span>
                                <span className="flex gap-1.5">
                                    {DELTIDSVALG.map((valg) => (
                                        <Knapp
                                            key={valg.lonn}
                                            variant="sekundar"
                                            liten
                                            aktiv={profil.bruttoArslonn === valg.lonn}
                                            tittel={valg.tekst}
                                            onClick={() => settLonn(valg.lonn)}
                                        >
                                            {valg.navn}
                                        </Knapp>
                                    ))}
                                </span>
                            </div>
                        )}
                    </div>
                </Kort>
            ) : (
                <Kort
                    tittel={yrke ? yrke.navn : profil.yrke}
                    undertittel={
                        yrke
                            ? `${yrke.bransje}. ${profil.aarIYrke} år i jobben.`
                            : 'Velg jobben du har nå i lista under, så følger lønna kurven for det yrket.'
                    }
                    ikon={<Briefcase className="h-4 w-4" />}
                    handling={
                        <span className="text-right">
                            <span className="block text-[11px] leading-tight text-slate-500">
                                Lønn før skatt
                            </span>
                            <Kroner
                                verdi={profil.bruttoArslonn}
                                className="text-lg font-bold text-indigo-700!"
                            />
                        </span>
                    }
                >
                    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                        {yrke ? (
                            <div className="min-w-[16rem] flex-1">
                                <div className="flex items-baseline justify-between gap-3 text-[11px] text-slate-500">
                                    <span>
                                        Startlønn <Kroner verdi={yrke.startlonn} />
                                    </span>
                                    <span>
                                        Neste nyttår{' '}
                                        <Kroner verdi={lonnVed(yrke, profil.aarIYrke + 1)} />
                                    </span>
                                    <span>
                                        Topplønn <Kroner verdi={yrke.topplonn} />
                                    </span>
                                </div>
                                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <motion.div
                                        className="h-full rounded-full bg-indigo-500"
                                        initial={false}
                                        animate={{
                                            width: `${Math.round(veiTilTopp(yrke, profil.aarIYrke) * 100)}%`,
                                        }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="flex-1 text-xs leading-snug text-slate-500">
                                Uten et yrke fra lista står lønna din stille år etter år. Velg det
                                som ligner mest på jobben din, så begynner den å bevege seg.
                            </p>
                        )}

                        <div className="flex max-w-[22rem] items-center gap-2 text-right">
                            <Knapp liten disabled={!svar.kanSpore} onClick={spor}>
                                Be om lønnsøkning
                            </Knapp>
                            <p className="text-[11px] leading-snug text-slate-500">
                                {svar.hinder
                                    ? svar.hinder
                                    : spurteNaa
                                      ? fikkJa
                                          ? `Sjefen sa ja. Du fikk ${Math.round(profil.bruttoArslonn - spurte.lonn)} kr mer i året.`
                                          : 'Sjefen sa nei denne gangen. Prøv igjen om noen måneder.'
                                      : `Sjansen er ${formaterProsent(svar.sjanse, 0)} nå. Jo lengre du har vært i jobben, jo mer har du å forhandle med.`}
                            </p>
                        </div>
                    </div>
                </Kort>
            )}

            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)]">
                {/* --- Jobbene ------------------------------------------- */}
                <Kort
                    tittel="Søk en jobb"
                    undertittel={
                        sperre ??
                        `Du har ${NIVA_KORT[profil.utdanningsniva].toLowerCase()}. Alt uten hengelås er åpent.`
                    }
                >
                    <div className="max-h-[13.5rem] space-y-2 overflow-y-auto pr-1">
                        {NIVAER.map((niva) => {
                            const iGruppa = YRKER.filter((y) => y.krav === niva);
                            if (iGruppa.length === 0) return null;
                            const apen = nivaOppfylt(profil.utdanningsniva, niva);
                            return (
                                <div key={niva}>
                                    <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                        {!apen && <Lock className="h-3 w-3" />}
                                        {NIVA_KORT[niva]}
                                    </div>
                                    <div className="space-y-1">
                                        {iGruppa.map((kandidat) => (
                                            <button
                                                key={kandidat.id}
                                                type="button"
                                                onClick={() => velgJobb(kandidat)}
                                                title={kandidat.beskrivelse}
                                                className={`flex w-full items-baseline justify-between gap-2 rounded-lg border px-2 py-1 text-left transition-colors ${
                                                    kandidat.id === profil.yrkeId
                                                        ? 'border-indigo-300 bg-indigo-50'
                                                        : apen
                                                          ? 'border-slate-200 bg-white hover:bg-slate-50'
                                                          : 'border-slate-100 bg-slate-50/60 text-slate-400'
                                                }`}
                                            >
                                                <span className="min-w-0 truncate text-xs font-medium">
                                                    {kandidat.navn}
                                                </span>
                                                <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                                                    {Math.round(kandidat.startlonn / 1000)} -{' '}
                                                    {Math.round(kandidat.topplonn / 1000)} tusen
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                        Bytter du jobb, tar du med deg halvparten av årene du har jobbet.
                    </p>
                </Kort>

                {/* --- Utdanningene -------------------------------------- */}
                <Kort
                    tittel="Ta en utdanning"
                    undertittel={
                        studie
                            ? 'Du studerer allerede. Fullfør denne først.'
                            : 'Trykk på en for å se hva den koster og hva den gir.'
                    }
                >
                    <div className="max-h-[13.5rem] space-y-1 overflow-y-auto pr-1">
                        {utdanninger.map((utdanning) => {
                            const jobb = yrkeEtterUtdanning(utdanning.id);
                            const valgt = utdanning.id === valgtUtdanning;
                            return (
                                <button
                                    key={utdanning.id}
                                    type="button"
                                    disabled={studie !== null}
                                    onClick={() => setValgtUtdanning(utdanning.id)}
                                    className={`w-full rounded-lg border px-2 py-1.5 text-left transition-colors disabled:opacity-50 ${
                                        valgt
                                            ? 'border-indigo-300 bg-indigo-50'
                                            : 'border-slate-200 bg-white hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="flex items-baseline justify-between gap-2">
                                        <span className="min-w-0 truncate text-xs font-medium text-slate-800">
                                            {utdanning.navn}
                                        </span>
                                        <span className="shrink-0 text-[11px] tabular-nums text-slate-500">
                                            {utdanning.aar} år
                                        </span>
                                    </span>
                                    {jobb && (
                                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                                            Blir {jobb.navn.toLowerCase()}, starter på{' '}
                                            {Math.round(jobb.startlonn / 1000)} tusen i året.
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                        Et fagbrev
                        <Forklaring begrep="fagbrev">
                            Fagbrev er beviset på at du kan et yrkesfag. Du tar to år på
                            videregående og er så lærling i to år i en bedrift. Som lærling får du
                            lønn, så du slipper å ta opp studielån.
                        </Forklaring>
                        tar du som lærling, med lønn. En bachelor
                        <Forklaring begrep="bachelor">
                            En bachelor er en grad du tar på høgskole eller universitet, som regel
                            på tre år. Du lever av studielån og stipend fra Lånekassen, og av det du
                            eventuelt tjener på en deltidsjobb.
                        </Forklaring>
                        eller master lever du av studielån gjennom.
                    </p>
                </Kort>

                {/* --- Regnestykket -------------------------------------- */}
                <Kort
                    tittel="Er utdanningen verdt det?"
                    ikon={<TrendingUp className="h-4 w-4" />}
                    handling={
                        sammenligning ? (
                            <Knapp
                                liten
                                onClick={() => {
                                    startUtdanning(sammenligning.utdanning.id);
                                    if (sammenligning.utdanning.laanPerAar > 0) settLonn(deltid);
                                    setValgtUtdanning(null);
                                }}
                            >
                                {sammenligning.utdanning.laanPerAar > 0
                                    ? 'Start studiet'
                                    : 'Start læretida'}
                            </Knapp>
                        ) : undefined
                    }
                >
                    {studie ? (
                        <div className="flex flex-col gap-1.5">
                            <p className="text-xs leading-snug text-slate-600">
                                Du er midt i {studie.utdanning.navn.toLowerCase()}. Klokka går,
                                lånet vokser rentefritt, og deltidsjobben din avgjør hvor stramt
                                budsjettet blir. Når graden er i havn, stopper klokka av seg selv,
                                40 % av lånet blir stipend, og du går rett inn i jobben som{' '}
                                {yrkeEtterUtdanning(studie.utdanning.id)?.navn.toLowerCase() ??
                                    'utdanningen fører til'}
                                .
                            </p>
                            {studiegraf && (
                                <>
                                    <FramskrivningsGraf punkter={studiegraf} hoyde={110} kompakt />
                                    <p className="text-[11px] leading-snug text-slate-500">
                                        Slik ser formuen din ut fram til {PENSJONSALDER} hvis du
                                        fullfører og blir stående i den jobben.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : !sammenligning ? (
                        <p className="text-xs leading-relaxed text-slate-600">
                            Velg en utdanning i lista ved siden av. Da regner vi ut hele livet ditt
                            to ganger: én gang med utdanningen og én gang uten, og legger de to
                            svarene ved siden av hverandre.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {sammenligning.utdanning.laanPerAar > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-500">
                                        Jobb ved siden av:
                                    </span>
                                    {DELTIDSVALG.map((valg) => (
                                        <Knapp
                                            key={valg.lonn}
                                            variant="sekundar"
                                            liten
                                            aktiv={deltid === valg.lonn}
                                            tittel={valg.tekst}
                                            onClick={() => setDeltid(valg.lonn)}
                                        >
                                            {valg.navn}
                                        </Knapp>
                                    ))}
                                </div>
                            )}

                            <FramskrivningsGraf
                                punkter={sammenligning.punkter}
                                hoyde={78}
                                kompakt
                            />

                            <dl className="divide-y divide-slate-100 text-xs">
                                <Linje
                                    navn="Lønn du gir slipp på mens du studerer"
                                    belop={-sammenligning.taptLonn}
                                />
                                {sammenligning.laanTotalt > 0 && (
                                    <>
                                        <Linje
                                            navn="Basislån du tar opp"
                                            belop={-sammenligning.laanTotalt}
                                            forklaring={
                                                <Forklaring begrep="basislån">
                                                    Basislånet er pengene Lånekassen låner deg mens
                                                    du studerer: 15 488 kr i måneden i elleve
                                                    måneder, altså 170 368 kr for ett studieår.
                                                </Forklaring>
                                            }
                                        />
                                        <Linje
                                            navn="Blir stipend når du fullfører"
                                            belop={sammenligning.stipend}
                                            forklaring={
                                                <Forklaring begrep="stipendomgjøring">
                                                    Fullfører du hele graden og bor borte fra
                                                    foreldrene, gjør Lånekassen om 40 % av
                                                    basislånet til stipend. Da slipper du å betale
                                                    de pengene tilbake. Slutter du underveis, får du
                                                    bare 15 % omgjort.
                                                </Forklaring>
                                            }
                                        />
                                        <Linje
                                            navn="Studiegjeld du sitter igjen med"
                                            belop={-sammenligning.studiegjeld}
                                        />
                                    </>
                                )}
                                <Linje
                                    navn={`Mer lønn før skatt fram til du er ${PENSJONSALDER}`}
                                    belop={
                                        sammenligning.livsinntektMed - sammenligning.livsinntektUten
                                    }
                                />
                                <Linje
                                    navn="Forskjell i formue når du er 67"
                                    belop={sammenligning.formueMed - sammenligning.formueUten}
                                    fremhevet
                                />
                            </dl>

                            <p
                                className="text-[11px] leading-snug text-slate-500"
                                title="Hele livet ditt er kjørt måned for måned to ganger, med de samme utgiftene og den samme sparingen begge ganger."
                            >
                                Et minus er et like ekte svar som et pluss.
                            </p>
                        </div>
                    )}
                </Kort>
            </div>
        </div>
    );
}

/** Ett nøkkeltall i statusstripa: etikett, beløp og én forklarende setning. */
function Nokkeltall({
    navn,
    belop,
    gronn = false,
}: {
    navn: string;
    belop: number;
    gronn?: boolean;
}) {
    return (
        <div>
            <div className="text-[11px] leading-tight text-slate-500">{navn}</div>
            <Kroner
                verdi={belop}
                className={`text-base font-semibold ${gronn ? 'text-emerald-700!' : ''}`}
            />
        </div>
    );
}

/** Én linje i regnestykket. Minus er det utdanningen koster deg. */
function Linje({
    navn,
    belop,
    forklaring,
    fremhevet = false,
}: {
    navn: string;
    belop: number;
    forklaring?: ReactNode;
    fremhevet?: boolean;
}) {
    return (
        <div className="flex items-baseline justify-between gap-2 py-[3px]">
            <dt
                className={`flex min-w-0 items-center gap-1 leading-snug ${
                    fremhevet ? 'font-bold text-slate-900' : 'text-slate-600'
                }`}
            >
                <span className="min-w-0">{navn}</span>
                {forklaring}
            </dt>
            <dd className="shrink-0">
                <Kroner
                    verdi={belop}
                    visTegn
                    className={fremhevet ? 'text-sm font-bold' : 'text-xs font-semibold'}
                />
            </dd>
        </div>
    );
}
