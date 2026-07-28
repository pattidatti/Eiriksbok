// Det kontrafaktiske (blueprint §4). Kampanjens siste skjermbilde.
//
// Eleven står på haugene i 1100 og har nettopp sett at ingen kan navnet hennes.
// Så kommer det ene spørsmålet hele emnet kan koke ned til: hva skulle egentlig
// til for at det ble sånn? Hun tar bort én ting, og kartet tegnes på nytt.
//
// **Dette er ikke «finn på en annen historie».** Et «hva om» er et verktøy for å
// prøve hva som faktisk hang sammen med hva: tar du bort noe og alt annet blir
// som før, betydde det lite. Rakner alt, betydde det mye. Derfor er de tre
// valgene med vilje ulike i styrke:
//
//   - **Seilet** river vekk alt. Uten det er det ingen vikingtid å fortelle om.
//   - **Murene** endrer ikke om det ble raid - de endrer hvem som skrev om dem,
//     og dermed alt eleven har brukt fem mellomspill på.
//   - **Kornet hennes** endrer nesten ingenting, og det er det viktigste av de
//     tre. Et enkeltmenneskes valg avgjorde ikke landet. Det avgjorde hvem hun
//     var, og det er en annen sak.
//
// Det tredje kortet leser flaggene fra 872 og spør om det motsatte av det hun
// gjorde. Å spørre «hva om du hadde gjort det du faktisk gjorde» er ikke et
// spørsmål.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { K2_FLAGG } from '../data/aaret';
import { useRpgStore } from '../store/useRpgStore';

/** Rutene på kartet. Tegnes eller tegnes ikke, alt etter hva som ble tatt bort. */
type RuteId = 'lindisfarne' | 'island' | 'york' | 'frankia' | 'kysten';

interface HvaOm {
    id: string;
    knapp: string;
    undertekst: string;
    /** Overskriften over kartet når det er tegnet på nytt. */
    tittel: string;
    /** Rutene som fortsatt finnes i denne verdenen. */
    ruter: RuteId[];
    /** Følgene, ledd for ledd. Hvert ledd er en påstand som kan etterprøves. */
    folger: string[];
    /** Hva øvelsen viser om årsaker. Står alltid til slutt, i egen ramme. */
    laerdom: string;
}

/** Rutene tegnet som kurver over Nordsjøen. Alle går ut fra Nordvik. */
const RUTER: Record<RuteId, { d: string; merke: string; ved: [number, number] }> = {
    lindisfarne: {
        d: 'M287 74 Q 232 94 186 128',
        merke: 'Lindisfarne 793',
        ved: [96, 126],
    },
    island: { d: 'M287 74 Q 186 18 90 36', merke: 'Island', ved: [96, 26] },
    york: { d: 'M287 74 Q 226 116 184 156', merke: 'York 1066', ved: [206, 158] },
    frankia: { d: 'M287 74 Q 276 168 244 244', merke: 'Frankerriket', ved: [250, 262] },
    kysten: { d: 'M287 74 Q 302 108 276 146', merke: 'Langs kysten', ved: [302, 138] },
};

/**
 * Landmassene rundt Nordsjøen, grovt tegnet.
 *
 * Et kart å kjenne igjen, ikke et kart å måle på. Formene er likevel ikke
 * vilkårlige: en fjortenåring skal se at det er Norge, England, Irland og
 * Island - og det er nettopp fordi hun kjenner dem igjen at det betyr noe når
 * strekene mellom dem forsvinner.
 */
const LAND: { d: string; navn?: string; ved?: [number, number] }[] = [
    {
        // Den skandinaviske halvøya. Vestkysten er den lange skrå linja, og
        // Nordvik ligger på den.
        d: 'M268 152 L 262 132 L 270 108 L 280 84 L 292 60 L 306 36 L 322 14 L 344 8 L 362 22 L 372 54 L 362 94 L 346 118 L 328 136 L 306 150 L 288 160 Z',
        navn: 'NORGE',
        ved: [318, 96],
    },
    { d: 'M254 168 L 264 164 L 270 178 L 266 196 L 256 194 L 249 180 Z' },
    {
        d: 'M158 112 L 172 106 L 184 118 L 180 134 L 190 148 L 196 168 L 208 186 L 212 206 L 200 222 L 182 228 L 168 214 L 160 190 L 150 166 L 152 140 L 146 124 Z',
        navn: 'ENGLAND',
        ved: [166, 196],
    },
    {
        d: 'M100 156 L 122 148 L 138 158 L 142 178 L 134 198 L 116 206 L 100 198 L 92 176 Z',
        navn: 'IRLAND',
        ved: [98, 180],
    },
    { d: 'M36 30 L 60 22 L 82 26 L 88 38 L 70 48 L 46 46 L 32 40 Z' },
    // Fastlandet står uten navn på kartet. Ruta dit heter «Frankerriket», og to
    // like ord oppå hverandre leser som en feil.
    { d: 'M190 252 L 230 240 L 268 244 L 310 238 L 360 240 L 396 246 L 398 300 L 186 300 Z' },
];

export function Kontrafaktisk({ onFerdig }: { onFerdig: () => void }) {
    const flagg = useRpgStore((s) => s.flagg);
    const [valgt, setValgt] = useState<HvaOm | null>(null);
    const [prevd, setPrevd] = useState<string[]>([]);

    const valgene = lagValgene(flagg);

    const velg = (v: HvaOm) => {
        setValgt(v);
        setPrevd((f) => (f.includes(v.id) ? f : [...f, v.id]));
    };

    return (
        <div
            className="absolute inset-0 z-50 overflow-y-auto bg-[#0f1418]/96 px-3 py-5 backdrop-blur-sm"
            data-prove="kontrafaktisk"
        >
            <div className="mx-auto w-full max-w-5xl">
                <header className="mb-4">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-sky-300/70">
                        Epilog · Nordvik 1100
                    </p>
                    <h2 className="font-display text-2xl font-bold text-slate-50">Hva om?</h2>
                </header>

                {!valgt && (
                    <Ark>
                        <p className="text-[15px] leading-relaxed text-slate-200/90">
                            Alt du har vært gjennom, hendte fordi noe annet hendte først. Skipet
                            kunne gå over åpent hav. Klosteret hadde ingen mur. Kongen trengte
                            korn.
                        </p>
                        <p className="mt-3 text-[15px] leading-relaxed text-slate-200/90">
                            Ta bort én ting, og se hva som følger med den. Blir alt som før,
                            betydde den lite. Rakner det, betydde den mye.
                        </p>
                        <div className="mt-5 grid gap-2.5">
                            {valgene.map((v) => (
                                <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => velg(v)}
                                    className="rounded-xl border border-slate-100/15 bg-slate-100/5 px-4 py-3 text-left transition hover:border-sky-300/60 hover:bg-sky-300/10"
                                >
                                    <p className="font-display text-base font-bold text-slate-50">
                                        {v.knapp}
                                    </p>
                                    <p className="mt-0.5 text-[13px] leading-snug text-slate-300/70">
                                        {v.undertekst}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </Ark>
                )}

                {valgt && (
                    <Ark>
                        <h3 className="font-display text-xl font-bold text-slate-50">
                            {valgt.tittel}
                        </h3>
                        <Kartet ruter={valgt.ruter} noekkel={valgt.id} />

                        <ol className="mt-4 grid gap-2.5">
                            {valgt.folger.map((f, i) => (
                                <motion.li
                                    key={f}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.35 }}
                                    className="border-l-2 border-sky-400/40 pl-3 text-[15px] leading-relaxed text-slate-100/90"
                                >
                                    {f}
                                </motion.li>
                            ))}
                        </ol>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + valgt.folger.length * 0.35 }}
                            className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/5 p-3 text-[15px] leading-relaxed text-amber-100/90"
                        >
                            {valgt.laerdom}
                        </motion.p>

                        {/*
                            De to andre står framme etterpå. Blueprinten sier at
                            eleven velger én, og det gjør hun - men et «hva om»
                            som bare kan stilles én gang, lærer bort at det
                            finnes ett riktig svar. Hele poenget er at de tre
                            veier ulikt, og det ser hun bare ved å prøve dem.
                        */}
                        <div className="mt-5 flex flex-wrap gap-2">
                            {valgene
                                .filter((v) => v.id !== valgt.id)
                                .map((v) => (
                                    <button
                                        key={v.id}
                                        type="button"
                                        onClick={() => velg(v)}
                                        className="rounded-lg border border-slate-100/15 px-3 py-2 text-[13px] text-slate-200/80 transition hover:border-sky-300/50 hover:bg-sky-300/10"
                                    >
                                        {v.knapp}
                                    </button>
                                ))}
                        </div>

                        {/*
                            Ingen `autoFocus` her. Nettleseren ruller til det
                            fokuserte elementet, og da lander eleven nederst på
                            siden i det samme øyeblikket kartet begynner å tegne
                            seg om - altså akkurat da hun skulle sett på det.
                        */}
                        <button
                            type="button"
                            onClick={onFerdig}
                            className="mt-4 w-full rounded-xl bg-sky-400 px-5 py-3 font-display text-base font-bold text-[#0f1418] transition hover:bg-sky-300"
                        >
                            {prevd.length > 1 ? 'Legg fra deg kartet' : 'Det er nok. Legg fra deg kartet'}
                        </button>
                    </Ark>
                )}
            </div>
        </div>
    );
}

// ─── Kartet ─────────────────────────────────────────────────────────────────

/**
 * Nordsjøen, tegnet på nytt.
 *
 * Rutene animeres inn med `pathLength`, og `noekkel` gjør at hele settet
 * tegnes om når eleven bytter spørsmål - ellers ville de rutene som er felles
 * mellom to svar bli stående urørt, og da ser det ut som at ingenting endret
 * seg da hun byttet.
 */
function Kartet({ ruter, noekkel }: { ruter: RuteId[]; noekkel: string }) {
    // Kartet er 4:3, og i full bredde inne i rammen blir det over sju hundre
    // piksler høyt på en Chromebook - da står følgene under skjermkanten, og
    // eleven ser aldri sammenhengen mellom kartet og teksten. Bredden er derfor
    // bundet, ikke høyden.
    return (
        <div className="mx-auto mt-4 max-w-[464px] overflow-x-auto rounded-xl border border-slate-100/10 bg-[#0b1016] p-2">
            <svg
                viewBox="0 0 400 300"
                className="mx-auto block h-auto w-full min-w-[320px] max-w-[440px]"
            >
                <rect x="0" y="0" width="400" height="300" fill="#0e1a24" />
                {LAND.map((l) => (
                    <path key={l.d} d={l.d} fill="#22331f" stroke="#3c5540" strokeWidth="1.5" />
                ))}
                {LAND.filter((l) => l.navn).map((l) => (
                    <text
                        key={l.navn}
                        x={l.ved?.[0]}
                        y={l.ved?.[1]}
                        fill="#7f9b7f"
                        fontSize="8"
                        letterSpacing="1.5"
                    >
                        {l.navn}
                    </text>
                ))}
                <text x="150" y="86" fill="#3f6579" fontSize="9" letterSpacing="2">
                    NORDSJØEN
                </text>

                <AnimatePresence mode="wait">
                    <motion.g key={noekkel}>
                        {ruter.map((id, i) => (
                            <g key={id}>
                                <motion.path
                                    d={RUTER[id].d}
                                    fill="none"
                                    stroke="#7dd3fc"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray="5 4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.9, delay: 0.25 + i * 0.25 }}
                                />
                                <motion.text
                                    x={RUTER[id].ved[0]}
                                    y={RUTER[id].ved[1]}
                                    fill="#bae6fd"
                                    fontSize="10"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 + i * 0.25 }}
                                >
                                    {RUTER[id].merke}
                                </motion.text>
                            </g>
                        ))}
                    </motion.g>
                </AnimatePresence>

                {/* Nordvik står alltid. Det er gården hun har vært på i fem liv. */}
                <circle cx="287" cy="74" r="4" fill="#fbbf24" />
                <text x="294" y="70" fill="#fde68a" fontSize="10">
                    Nordvik
                </text>
            </svg>
        </div>
    );
}

// ─── Valgene ────────────────────────────────────────────────────────────────

/**
 * De tre spørsmålene.
 *
 * Det tredje snus etter hva hun faktisk gjorde i 872. Ga hun kornet til Harald,
 * spør kortet hva som hadde skjedd om hun hadde gitt det til motstanderne - og
 * omvendt. Hadde hun sendt begge tomhendt av gårde, spør det hva som hadde
 * skjedd om hun hadde valgt en side.
 */
function lagValgene(flagg: Record<string, boolean>): HvaOm[] {
    const kornet = flagg[K2_FLAGG.matetHarald]
        ? {
              knapp: 'Hva om Åsa hadde matet den andre siden?',
              undertekst: 'Du ga kornet til Harald Hårfagres mann. Si at du ikke hadde gjort det.',
          }
        : flagg[K2_FLAGG.matetMotstanderne]
          ? {
                knapp: 'Hva om Åsa hadde matet Harald i stedet?',
                undertekst: 'Du ga kornet til dem som sto imot ham. Si at du ikke hadde gjort det.',
            }
          : {
                knapp: 'Hva om Åsa hadde valgt en side?',
                undertekst: 'Du ga ikke kornet til noen av dem. Si at du hadde gjort det.',
            };

    return [
        {
            id: 'seilet',
            knapp: 'Hva om seilet aldri var funnet opp?',
            undertekst: 'Skip fantes i tusen år før. Seil på dem i Norden er nytt i 700-årene.',
            tittel: 'Uten seil',
            ruter: ['kysten'],
            folger: [
                'Et roskip kan gå langs en kyst. Det kan ikke krysse åpent hav med last, for roere må ha mat og hvile, og de tar plassen lasten skulle hatt. Nordsjøen er tre til fire døgn uten land i sikte.',
                'Da kommer ingen til Lindisfarne i 793, og ingen til Island i 870-årene. Ingen Grønland, ingen Vinland, ingen Normandie. Ingen Harald Hardråde ved Stanford bru i 1066.',
                'Uten ferdene ut kommer heller ikke sølvet inn. Handelsbyer som Kaupang og Birka vokser opp rundt fjern handel, og de vokser ikke. Kongsmakten som bygges på det sølvet, kommer senere eller ikke i det hele tatt.',
                'Og du ville ikke visst noe om dem. Alt de skriftlige kildene forteller om Norden, er skrevet av folk som møtte nordboere hjemme hos seg selv.',
            ],
            laerdom:
                'Dette er en årsak som bærer alt annet. Tar du den bort, står ikke resten. Det gjør den til en av de få tingene det er verdt å kalle en hovedårsak - og det er nettopp derfor historikere er så forsiktige med det ordet.',
        },
        {
            id: 'murene',
            knapp: 'Hva om klostrene hadde vært befestet?',
            undertekst: 'Lindisfarne hadde ingen mur i 793. Ingen hadde tenkt tanken.',
            tittel: 'Med murer',
            ruter: ['york', 'frankia', 'island', 'kysten'],
            folger: [
                'Et kloster med mur og vakt er ikke umulig å ta. Det er bare ikke verdt det for tretti mann i tre skip. Da drar de et annet sted: til markeder, til småkonger, til kyster uten forsvar.',
                'Raidene slutter altså ikke. De flytter seg. Og det gjør noe med hva vi vet: klostrene var de eneste i Vest-Europa som skrev ned hva som hendte år for år.',
                'Uten et brent kloster i 793 skriver ingen Alkuin sitt brev. Uten brevet og krøniken har vi nesten ingenting om det første tiåret - og de norrøne kildene som kunne fylt hullet, finnes fortsatt ikke.',
                'Vikingtiden ville altså begynt et annet år i bøkene. Ikke fordi den begynte senere, men fordi ingen hadde vært der og skrevet det ned.',
            ],
            laerdom:
                'Dette er den vanskeligste av de tre: den endrer ikke stort på det som skjedde, men den endrer alt vi kan vite om det. Når du leser at noe «begynte i 793», leser du like mye om hvem som førte bok som om hva som hendte.',
        },
        {
            id: 'kornet',
            knapp: kornet.knapp,
            undertekst: kornet.undertekst,
            tittel: 'Med kornet et annet sted',
            ruter: ['lindisfarne', 'island', 'york', 'frankia'],
            folger: [
                'Kartet ser likt ut. Slaget i Hafrsfjord står, og den siden som vant, vinner.',
                'Førti sekker korn fra én gård i én fjord holder én hird gående i noen få uker. De avgjør ingen krig, og ingen konge fikk vite hvem de kom fra.',
                'Det som ville vært annerledes, er hvem naboene mente Nordvik var. Æren din, gjelden til Sæbø, hvem som stilte seg foran tunet ditt da noen kom for å ta det - alt det henger på hva du gjorde med kornet.',
                'Og i 995, 1030 og 1066 hadde gården fortsatt stått her. Den sto her uansett hva du valgte.',
            ],
            laerdom:
                'Her rakner ingenting, og det er hele lærdommen. Et enkeltmenneskes valg avgjorde sjelden hvordan det gikk med landet. Det avgjorde hvordan det gikk med henne, og med dem som bodde rundt henne - og det er ikke det samme som å være uten betydning.',
        },
    ];
}

// ─── Småting ────────────────────────────────────────────────────────────────

function Ark({ children }: { children: React.ReactNode }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-slate-100/10 bg-[#141c24] p-4 shadow-2xl sm:p-5"
        >
            {children}
        </motion.section>
    );
}
