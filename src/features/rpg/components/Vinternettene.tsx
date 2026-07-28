// Vinternettene (blueprint §4, kapittel 3). Fristen er ute, og gården må svare.
//
// Dette er kapittelets siste handling, og den er ikke en kamp. Den er en
// husstand som står i hallen og venter på at én mann skal bestemme for dem
// alle - for det var slik kristningen faktisk gikk til. Kongen forhandlet ikke
// med enkeltmennesker; han forhandlet med gårder, og husbonden svarte på vegne
// av hver eneste sjel innenfor dørstokken.
//
// Tre ting er med vilje slik de er:
//
//   **Splittelsen er ikke tro mot vantro.** Det er de som ser hvor makten går,
//   mot de som ikke gjør det. Steinar er ikke overbevist om noe. Han har vært i
//   Jorvik og sett hvem som får handle med hvem.
//
//   **Ingen av valgene er feil.** Det finnes ingen fasit her, og ingen av dem
//   gir mer poeng enn de andre. Det som skiller dem, er hvem Torgils er etterpå.
//
//   **Kirken kommer uansett.** Alle tre utgangene ender med at den reises på
//   hovets grunn. Det er ikke en straff for å ha valgt galt - det er det som
//   skjedde, og eleven skal se at et enkeltmenneskes valg ikke stoppet det.
//   Under gulvet i Mære kirke i Trøndelag fant arkeologene gullgubber fra
//   hedensk kult. Kirken ble reist der hovet hadde stått.

import { useState } from 'react';

type Fase = 'hallen' | 'valget' | 'etterpa';

interface Stemme {
    hvem: string;
    rolle: string;
    replikk: string;
}

const STEMMENE: Stemme[] = [
    {
        hvem: 'Steinar',
        rolle: 'broren din',
        replikk:
            'Jeg lar meg døpe. Ikke fordi jeg tror noe annet enn i går, men fordi jeg har sett hvordan det går med dem som ikke gjør det. Velger du noe annet, står jeg fortsatt der.',
    },
    {
        hvem: 'Gudrid',
        rolle: 'mor din',
        replikk:
            'Jeg har matet gudene her i førti år. Jeg vet ikke hvordan en slutter med det. Men jeg gjør det du bestemmer, for det er gården din.',
    },
    {
        hvem: 'Ulv Gode',
        rolle: 'han som holder hovet',
        replikk: 'Jeg har hovet. Går hovet, går jeg. Det er ikke en trussel, det er bare sant.',
    },
    {
        hvem: 'Torfinn Kåresson',
        rolle: 'sønn av en frigitt mann',
        replikk:
            'Presten sier vi er like foran hans gud. Ingen har sagt noe slikt til meg før. Jeg vet ikke om det er sant, men jeg vil gjerne se.',
    },
    {
        hvem: 'Åsleiv Kremmer',
        rolle: 'primsignet',
        replikk:
            'Jeg blir det jeg må bli. Jeg har korset i Jorvik og hammeren her, og jeg har aldri hatt vondt av noen av delene.',
    },
];

export type VinterValg = 'dopt' | 'primsignet' | 'nektet';

interface ValgDef {
    id: VinterValg;
    tekst: string;
    undertekst: string;
    /** Det som skjer. Ingen dom, bare følgene. */
    folge: string[];
}

const VALGENE: ValgDef[] = [
    {
        id: 'dopt',
        tekst: 'Vi lar oss døpe',
        undertekst: 'Hele gården. Jeg svarer for alle her.',
        folge: [
            'Eadwulf døper dere i fjorden dagen etter, én etter én, mens kongens menn ser på fra land. Vannet er iskaldt. Ingen sier noe om det.',
            'Ragnvald gir deg en armring av sølv. Det er ikke en gave, det er en kvittering: kongen har fått en gård til, og gården har fått en konge.',
            'Ulv går samme kveld. Han tar ingenting med seg. Ingen vet hvor han dro, og ingen spør høyt.',
        ],
    },
    {
        id: 'primsignet',
        tekst: 'Primsign meg. Ikke mer',
        undertekst: 'Korsets tegn, uten dåp. Da kan jeg handle med dem.',
        folge: [
            'Eadwulf gjør korsets tegn over deg. Det tar et øyeblikk, og du er verken det ene eller det andre etterpå. Det er hele poenget med primsigningen: du får handle og spise med kristne uten å ha gitt fra deg noe.',
            'Ragnvald ser lenge på deg. «Det holder i år,» sier han. Han sier ikke hvor mange år det holder.',
            'Steinar lar seg døpe samme dag. Fra nå av er det ham kongens folk snakker med når de kommer hit, ikke deg.',
        ],
    },
    {
        id: 'nektet',
        tekst: 'Nei',
        undertekst: 'Vi har gjort dette her siden før noen kan huske.',
        folge: [
            'De river hovet mens dere står og ser på. Det tar en formiddag. Gudebildene brenner på horgen, og røyken lukter tjære.',
            'Ragnvald tar tre mark sølv «for kongens bry» og skriver ikke noe ned. Han lar deg leve, og han lar gården stå. Andre steder i fjorden gikk det verre.',
            'Steinar lar seg døpe samme dag. Fra nå av er det ham kongens folk snakker med når de kommer hit, ikke deg.',
        ],
    },
];

interface Props {
    onValgt: (valg: VinterValg) => void;
}

export function Vinternettene({ onValgt }: Props) {
    const [fase, setFase] = useState<Fase>('hallen');
    const [valgt, setValgt] = useState<ValgDef | null>(null);

    return (
        <div
            className="absolute inset-0 z-50 grid place-items-center bg-slate-950/88 px-3 backdrop-blur-sm"
            data-prove="vinternettene"
        >
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-amber-300/25 bg-[#12100c]/97 p-5 shadow-2xl sm:p-6">
                <header className="mb-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80">
                        Hallen på Nordvik · vinternettene 995
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold text-amber-50 sm:text-3xl">
                        {fase === 'etterpa' ? 'Det som skjedde' : 'Fristen er ute'}
                    </h2>
                </header>

                {fase === 'hallen' && (
                    <div>
                        <p className="text-[15px] leading-relaxed text-amber-100/85">
                            Skipet ligger fortsatt i vika. I morgen er vinternettene, og da skal
                            hovet stå tomt. Alle på gården er inne i hallen. De sier hva de mener,
                            og så tier de, for det er ikke de som skal bestemme.
                        </p>
                        {/*
                            Tett med vilje. Hele husstanden skal få plass på en
                            Chromebook-skjerm uten at eleven må rulle for å se
                            hvem som står hvor - det er nettopp oversikten som
                            er poenget her.
                        */}
                        <div className="mt-3 space-y-2">
                            {STEMMENE.map((s) => (
                                <div
                                    key={s.hvem}
                                    className="border-l-2 border-amber-300/30 pl-3"
                                    data-prove="stemme"
                                >
                                    <p className="text-sm font-semibold text-amber-200">
                                        {s.hvem}
                                        <span className="font-normal text-amber-100/45">
                                            {' '}
                                            · {s.rolle}
                                        </span>
                                    </p>
                                    <p className="text-[14px] leading-snug text-amber-50/85">
                                        «{s.replikk}»
                                    </p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 rounded-lg border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[14px] leading-snug text-amber-100/85">
                            Ingen av dem skal svare kongen. En gård har én husbonde, og han svarer
                            for hver eneste sjel innenfor dørstokken. Det er slik hele landet ble
                            kristnet: ikke ett menneske av gangen, men én gård av gangen.
                        </p>
                        {/*
                            Ingen `autoFocus` her. Nettleseren ruller det som
                            får fokus inn i bildet, og på en 768 piksler høy
                            skjerm betyr det at overskriften forsvinner opp før
                            eleven har lest første linje.
                        */}
                        <button
                            type="button"
                            onClick={() => setFase('valget')}
                            className="mt-4 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-[#2b2018] transition hover:bg-amber-300"
                        >
                            Svar dem
                        </button>
                    </div>
                )}

                {fase === 'valget' && (
                    <div className="space-y-2">
                        <p className="mb-3 text-[15px] leading-relaxed text-amber-100/85">
                            Ragnvald står i døra. Han spør ikke to ganger.
                        </p>
                        {VALGENE.map((v) => (
                            <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                    setValgt(v);
                                    setFase('etterpa');
                                }}
                                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-amber-300/60 hover:bg-amber-300/10"
                            >
                                <span className="block text-[15px] font-semibold text-amber-50">
                                    {v.tekst}
                                </span>
                                <span className="mt-0.5 block text-sm text-amber-100/50">
                                    {v.undertekst}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {fase === 'etterpa' && valgt && (
                    <div data-prove={`vinter-${valgt.id}`}>
                        <div className="space-y-3 text-[15px] leading-relaxed text-amber-100/85">
                            {valgt.folge.map((linje) => (
                                <p key={linje.slice(0, 24)}>{linje}</p>
                            ))}
                        </div>
                        {/*
                            Den siste linjen er den samme uansett hva eleven
                            valgte, og det er ikke en straff. Det er det som
                            skjedde: et enkeltmenneskes svar avgjorde hvem han
                            var etterpå, ikke hvor landet gikk.
                        */}
                        <div className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/5 px-4 py-3">
                            <p className="text-sm font-semibold uppercase tracking-widest text-amber-300/80">
                                Våren etter
                            </p>
                            <p className="mt-2 text-[15px] leading-relaxed text-amber-50/90">
                                De reiser en kirke oppe i lia. Ikke ved siden av hovet - på det.
                                Samme flate, samme utsikt over fjorden, og en av stolpene fra det
                                gamle huset står inne i den nye veggen, fordi den var god og fordi
                                det var tømmer der fra før.
                            </p>
                            <p className="mt-2 text-[15px] leading-relaxed text-amber-50/90">
                                Det skjedde flere steder. Under gulvet i Mære kirke i Trøndelag har
                                arkeologer funnet små gullplater fra hedensk kult. Kirken ble reist
                                der folk allerede kom.
                            </p>
                        </div>
                        <button
                            type="button"
                            autoFocus
                            onClick={() => onValgt(valgt.id)}
                            className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-[#2b2018] transition hover:bg-amber-300"
                        >
                            Gå ut
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
