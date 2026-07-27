// Skroget (blueprint §10.1). Eleven bygger skipet, og Orm prøveseiler det.
//
// Puzzlet løses av periodekunnskap, ikke av å flytte klosser: hvert valg er en
// ekte forskjell mellom hvordan nordiske og sørlige skip ble bygget, og hver
// feil har en synlig følge. Feil bordlegging synker - og hun ser det synke.
//
// Tre ting er med vilje slik de er:
//
//   **Skroget tegnes mens hun velger.** Valget «over hverandre» skal ikke være
//   en radioknapp; det skal være noe hun ser bli til. Bordene legger seg
//   overlappende med nagler i sømmen, eller kant i kant uten. Forskjellen er
//   hele fagstoffet, og den er lettere å se enn å lese.
//
//   **Ingen retter henne underveis.** Orm sier ingenting før prøveturen. Det
//   er først når skroget siger under vann at hun får vite hva som var galt -
//   og da vet hun det på en måte en tekstboks ikke kan gi henne.
//
//   **Hun kan prøve igjen, og det koster ingenting annet enn å ha tatt feil.**
//   Første forsøk gir et flagg Orm husker; resten gir det samme skipet.
//
// Alt tegnes med SVG. Ingen bildefiler - samme regel som resten av spillet.

import { useState } from 'react';

type Fase = 'bygger' | 'prover' | 'flyter' | 'synker';

interface Valg {
    id: string;
    tekst: string;
    /** Kort, muntlig - det hun tenker når hun velger. Ikke en forklaring. */
    undertekst: string;
    riktig: boolean;
    /** Det Orm sier når skroget siger under vann på grunn av dette valget. */
    naarDetSynker?: string;
}

interface Steg {
    id: 'forst' | 'bord' | 'feste' | 'mast';
    sporsmal: string;
    valg: Valg[];
}

const STEG: Steg[] = [
    {
        id: 'forst',
        sporsmal: 'Hva legger du først?',
        valg: [
            {
                id: 'kjol',
                tekst: 'Kjølen',
                undertekst: 'Ryggraden. Alt annet henger på den.',
                riktig: true,
            },
            {
                id: 'spant',
                tekst: 'Spantene, og så bordene utenpå',
                undertekst: 'Bygg rammeverket først, som et hus.',
                riktig: false,
                naarDetSynker:
                    'Du bygde et hus og la bord utenpå. Vi bygger skallet først og setter spantene inn i det etterpå. Det er derfor skroget vårt kan bøye seg.',
            },
            {
                id: 'mast',
                tekst: 'Masta',
                undertekst: 'Det er jo seilet som driver oss.',
                riktig: false,
                naarDetSynker:
                    'Ei mast uten skrog er en stokk. Kjølen først. Alltid kjølen først.',
            },
        ],
    },
    {
        id: 'bord',
        sporsmal: 'Hvordan legger du bordene?',
        valg: [
            {
                id: 'klink',
                tekst: 'Over hverandre, som takstein',
                undertekst: 'Hvert bord dekker kanten på det under.',
                riktig: true,
            },
            {
                id: 'kravell',
                tekst: 'Kant i kant, glatt utenpå',
                undertekst: 'Penere. Og tettere, kanskje?',
                riktig: false,
                naarDetSynker:
                    'Kant i kant må tettes, og et skrog som er tettet holder ikke i sjøen her nord. Legg dem over hverandre. Da bærer bordene hverandre.',
            },
        ],
    },
    {
        id: 'feste',
        sporsmal: 'Hvordan fester du dem?',
        valg: [
            {
                id: 'nagler',
                tekst: 'Jernnagler gjennom overlappet, klinket på baksiden',
                undertekst: 'Hamre enden flat så den ikke går ut igjen.',
                riktig: true,
            },
            {
                id: 'trepligg',
                tekst: 'Trepligger, som i et hus',
                undertekst: 'Tre mot tre. Det holder i låven.',
                riktig: false,
                naarDetSynker:
                    'Tre svulmer og krymper. Første storm river sømmen opp. Jern, gutt. Jern som klinkes.',
            },
            {
                id: 'tjaere',
                tekst: 'Bare tjære og tauverk',
                undertekst: 'Sy dem sammen og tett sømmen.',
                riktig: false,
                naarDetSynker:
                    'Det er slik de gjorde det i farfars tid, og de kom ikke over åpent hav. Vi klinker nå.',
            },
        ],
    },
    {
        id: 'mast',
        sporsmal: 'Når setter du masta?',
        valg: [
            {
                id: 'etter',
                tekst: 'Til slutt, ned i kjølsvinet',
                undertekst: 'Skroget står ferdig først, så bærer det masta.',
                riktig: true,
            },
            {
                id: 'for',
                tekst: 'Før bordgangene, så den står stødig',
                undertekst: 'Bygg skroget rundt den.',
                riktig: false,
                naarDetSynker:
                    'Da har du et hull tvers gjennom bunnen og ingen måte å tette det på. Masta settes ned i det ferdige skroget.',
            },
        ],
    },
];

interface Props {
    /** Har hun bygget et skrog som fløt før? Da vet Orm det. */
    onFerdig: (paaForsteForsok: boolean) => void;
    onAvbryt: () => void;
}

export function Skroget({ onFerdig, onAvbryt }: Props) {
    const [steg, setSteg] = useState(0);
    const [valgt, setValgt] = useState<Record<string, Valg>>({});
    const [fase, setFase] = useState<Fase>('bygger');
    const [forsok, setForsok] = useState(0);

    const naa = STEG[steg];
    const feilet = Object.values(valgt).find((v) => !v.riktig);

    const velg = (v: Valg) => {
        const nye = { ...valgt, [naa.id]: v };
        setValgt(nye);
        if (steg + 1 < STEG.length) {
            setSteg(steg + 1);
            return;
        }
        // Prøveturen. Pausen er ikke pynt: Orm skal rekke å skyve skipet ut før
        // det avgjøres, ellers leser dommen som at spillet visste svaret hele
        // tiden - som det gjorde, men det skal ikke vises.
        setFase('prover');
        const bomma = Object.values(nye).some((x) => !x.riktig);
        window.setTimeout(() => setFase(bomma ? 'synker' : 'flyter'), 2200);
    };

    const proevIgjen = () => {
        setForsok((f) => f + 1);
        setValgt({});
        setSteg(0);
        setFase('bygger');
    };

    return (
        <div
            className="absolute inset-0 z-50 grid place-items-center bg-slate-950/80 px-3 backdrop-blur-sm"
            data-prove="skroget"
        >
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-amber-300/25 bg-slate-950/97 p-5 shadow-2xl sm:p-6">
                <header className="mb-4 flex items-baseline justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80">
                            Naustet i Nordvik
                        </p>
                        <h2 className="font-display text-2xl font-bold text-slate-50">
                            Skroget
                        </h2>
                    </div>
                    <p className="text-sm text-slate-400">Orm ser på. Han sier ingenting.</p>
                </header>

                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Tegning valgt={valgt} fase={fase} />

                    <div>
                        {fase === 'bygger' && (
                            <>
                                <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">
                                    Steg {steg + 1} av {STEG.length}
                                </p>
                                <h3 className="mb-3 font-display text-xl font-bold text-slate-100">
                                    {naa.sporsmal}
                                </h3>
                                <div className="space-y-2">
                                    {naa.valg.map((v) => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => velg(v)}
                                            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-amber-300/60 hover:bg-amber-300/10"
                                        >
                                            <span className="block text-[15px] font-semibold text-slate-100">
                                                {v.tekst}
                                            </span>
                                            <span className="mt-0.5 block text-sm text-slate-400">
                                                {v.undertekst}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {fase === 'prover' && (
                            <p className="font-display text-xl leading-relaxed text-slate-200">
                                Orm skyver skroget ut i fjorden.
                            </p>
                        )}

                        {fase === 'synker' && (
                            <div>
                                <h3 className="font-display text-2xl font-bold text-rose-300">
                                    Det siger.
                                </h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                                    «{feilet?.naarDetSynker}»
                                </p>
                                <p className="mt-3 text-sm text-slate-400">- Orm</p>
                                <button
                                    type="button"
                                    onClick={proevIgjen}
                                    className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-slate-900 transition hover:bg-amber-300"
                                >
                                    Dra det opp igjen
                                </button>
                            </div>
                        )}

                        {fase === 'flyter' && (
                            <div>
                                <h3 className="font-display text-2xl font-bold text-emerald-300">
                                    Det flyter.
                                </h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                                    Bordene ligger over hverandre og naglene holder. Skroget bøyer
                                    seg med bølgen i stedet for å ta imot den. Det er derfor et
                                    skip som dette kan krysse åpent hav, og et som er bygget kant
                                    i kant ikke kan.
                                </p>
                                <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200">
                                    Du kan Klinkbygging nå. Ikke fordi noen sa det - fordi du
                                    bygget et skrog som fløt.
                                </p>
                                <button
                                    type="button"
                                    autoFocus
                                    onClick={() => onFerdig(forsok === 0)}
                                    className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-slate-900 transition hover:bg-amber-300"
                                >
                                    Videre
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {fase === 'bygger' && (
                    <button
                        type="button"
                        onClick={onAvbryt}
                        className="mt-5 w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                    >
                        Gå ut av naustet (Esc)
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Skroget slik det står nå.
 *
 * Tegnet med SVG og ikke med en bildefil - samme regel som resten av spillet.
 * Poenget er at forskjellen på klink og kravell skal *ses*: overlappende bord
 * med naglerad i sømmen, mot glatte bord kant i kant. Det er hele fagstoffet i
 * ett bilde.
 */
function Tegning({ valgt, fase }: { valgt: Record<string, Valg>; fase: Fase }) {
    const harKjol = Boolean(valgt.forst);
    const spantForst = valgt.forst?.id === 'spant';
    const mastForst = valgt.forst?.id === 'mast';
    const klink = valgt.bord?.id === 'klink';
    const harBord = Boolean(valgt.bord);
    const nagler = valgt.feste?.id === 'nagler';
    const harFeste = Boolean(valgt.feste);
    const harMast = Boolean(valgt.mast);

    // Bordgangene. Klink lar hvert bord dekke kanten på det under; kravell
    // legger dem kant i kant. Ti piksler mot fjorten er hele forskjellen.
    const ganger = [0, 1, 2, 3];
    const stegHoyde = klink ? 9 : 13;

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-slate-800 to-slate-900 p-3">
            <svg
                viewBox="0 0 320 180"
                className={`w-full ${fase === 'synker' ? 'animate-[skrogSynker_2200ms_ease-in_forwards]' : ''} ${
                    fase === 'flyter' ? 'animate-[skrogFlyter_2600ms_ease-in-out_infinite]' : ''
                }`}
                role="img"
                aria-label="Skroget slik det står nå"
            >
                {/* Vannlinja */}
                <rect x="0" y="126" width="320" height="54" fill="#1f3d57" />
                <path
                    d="M0 126 q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0"
                    stroke="#3b6f97"
                    strokeWidth="2"
                    fill="none"
                />

                {/* Kjølen. Uten den henger ingenting sammen - og med spantene
                    først står rammeverket alene, som et halvferdig hus. */}
                {harKjol && !mastForst && (
                    <path
                        d="M40 118 q120 22 240 0"
                        stroke="#6b4a2a"
                        strokeWidth="7"
                        strokeLinecap="round"
                        fill="none"
                    />
                )}
                {spantForst &&
                    [80, 120, 160, 200, 240].map((x) => (
                        <line
                            key={x}
                            x1={x}
                            y1="118"
                            x2={x}
                            y2="86"
                            stroke="#8a6a45"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                    ))}

                {/* Bordgangene */}
                {harBord &&
                    ganger.map((i) => {
                        const y = 112 - i * stegHoyde;
                        const inn = 6 - i * 2;
                        return (
                            <g key={i}>
                                <path
                                    d={`M${40 + inn} ${y} q${120 - inn} ${18 - i * 2} ${240 - inn * 2} 0`}
                                    stroke={i % 2 === 0 ? '#8a6640' : '#7a5836'}
                                    strokeWidth={klink ? 11 : 12}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                {/* Naglene sitter i sømmen, og bare der det finnes
                                    en søm å nagle: kant i kant har ingen overlapp. */}
                                {harFeste &&
                                    nagler &&
                                    klink &&
                                    [70, 110, 150, 190, 230].map((x) => (
                                        <circle
                                            key={x}
                                            cx={x}
                                            cy={y + 5 + Math.sin((x - 40) / 90) * 3}
                                            r="1.8"
                                            fill="#c9d2dc"
                                        />
                                    ))}
                            </g>
                        );
                    })}

                {/* Stavnene. De reiser seg i begge ender, og det er det som gjør
                    en silhuett til et vikingskip framfor en robåt. De kommer
                    med bordgangene: uten bord er det ingenting å reise dem fra. */}
                {harBord && (
                    <>
                        <path
                            d="M46 112 q-10 -18 4 -30"
                            stroke="#6b4a2a"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="none"
                        />
                        <path
                            d="M274 112 q10 -18 -4 -30"
                            stroke="#6b4a2a"
                            strokeWidth="6"
                            strokeLinecap="round"
                            fill="none"
                        />
                    </>
                )}

                {/* Masta og råseilet. Et firkantseil på en rå tvers over masta -
                    ikke et spisst seil. Formen er det folk kjenner igjen, og den
                    er også den riktige. */}
                {harMast && (
                    <>
                        <line
                            x1="160"
                            y1={valgt.mast?.id === 'etter' ? 84 : 132}
                            x2="160"
                            y2="16"
                            stroke="#6b4a2a"
                            strokeWidth="5"
                            strokeLinecap="round"
                        />
                        <line
                            x1="104"
                            y1="26"
                            x2="216"
                            y2="26"
                            stroke="#5c4529"
                            strokeWidth="4"
                            strokeLinecap="round"
                        />
                        <path d="M106 28 h108 v46 q-54 10 -108 0 z" fill="#d8d2bc" />
                        {[0, 1, 2].map((i) => (
                            <path
                                key={i}
                                d={`M${106 + 18 + i * 36} 28 v46 q-9 2 -18 1 v-47 z`}
                                fill="#a8443a"
                                opacity="0.85"
                            />
                        ))}
                    </>
                )}

                {/* Rått tømmer på plankegulvet, så naustet ikke er tomt før hun
                    har valgt noe i det hele tatt. */}
                {!harKjol && (
                    <>
                        <rect x="60" y="104" width="200" height="8" rx="4" fill="#5c4529" />
                        <rect x="80" y="90" width="160" height="8" rx="4" fill="#6b4a2a" />
                        <rect x="100" y="76" width="120" height="8" rx="4" fill="#5c4529" />
                    </>
                )}
            </svg>
        </div>
    );
}
