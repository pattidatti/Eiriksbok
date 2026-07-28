// Blotet (blueprint §10.4). Torgils holder blot ved horgen, og ingen retter ham.
//
// Puzzlet løses av periodekunnskap, ikke av å flytte klosser. De tre
// spørsmålene Ulv stiller, er de tre et blot faktisk besto av: hvem gaven går
// til, hva gaven er, og når det skjer. Alle tre har et svar som er riktig av
// grunner eleven kan finne i verden - Ulv sier dem selv, oppe ved hovet, før
// hun noen gang blir spurt.
//
// Tre ting er med vilje slik de er:
//
//   **Ingen sier at hun tok feil.** Blotet blir holdt uansett hva hun svarer.
//   Følgen er ikke at gudene straffer henne - det er at bygda går hjem tidlig,
//   og at ingen sier hvorfor. Fagstoffet ligger i forskjellen på de to kveldene.
//
//   **Måltidet er blotet.** Skjermen bruker mest plass på det som skjer etterpå:
//   blodet i bollen, kvisten, kjøttet som kokes, og begrene som bæres rundt
//   ilden. Et blot var ikke en bønn, det var et gjestebud der gudene var med.
//
//   **Hun kan blote igjen.** Det er ikke en «prøv på nytt»-knapp - folk blotet
//   når de trengte noe, og horgen står der hele året.
//
// Alt tegnes med SVG. Ingen bildefiler - samme regel som resten av spillet.

import { useState } from 'react';

type Fase = 'spor' | 'blotet' | 'etterpa';

interface Valg {
    id: string;
    tekst: string;
    /** Kort, muntlig. Det han tenker mens han velger, ikke en forklaring. */
    undertekst: string;
    passer: boolean;
}

interface Steg {
    id: 'hvem' | 'hva' | 'naar';
    sporsmal: string;
    /** Ulvs innledning. Han stiller spørsmålet, han svarer ikke på det. */
    ledetekst: string;
    valg: Valg[];
}

const STEG: Steg[] = [
    {
        id: 'hvem',
        sporsmal: 'Hvem gir vi til?',
        ledetekst:
            'Kornet er inne. Vi bloter for at året som kommer skal bli godt, og for at freden skal holde. Si hvem det er du gir til, så roper jeg navnet.',
        valg: [
            {
                id: 'odin',
                tekst: 'Odin',
                undertekst: 'Den høyeste. Den alle konger blotet til.',
                passer: false,
            },
            {
                id: 'tor',
                tekst: 'Tor',
                undertekst: 'Han som rår for været og verner gården.',
                passer: false,
            },
            {
                id: 'froy',
                tekst: 'Frøy',
                undertekst: 'Han som gir avling og fred.',
                passer: true,
            },
        ],
    },
    {
        id: 'hva',
        sporsmal: 'Hva gir vi?',
        ledetekst:
            'En gave er ikke en gave hvis den ikke koster noe. Og det vi gir, skal vi spise sammen etterpå. Velg.',
        valg: [
            {
                id: 'hesten',
                tekst: 'Hesten',
                undertekst: 'Det dyreste dyret på gården. Vi har bare den ene.',
                passer: true,
            },
            {
                id: 'hanen',
                tekst: 'En hane',
                undertekst: 'Den koster oss ingenting. Ingen kommer til å savne den.',
                passer: false,
            },
            {
                id: 'solvet',
                tekst: 'Sølv i myra',
                undertekst: 'Senk det i vannet, der ingen får det opp igjen.',
                passer: false,
            },
        ],
    },
    {
        id: 'naar',
        sporsmal: 'Når?',
        ledetekst:
            'Kongens menn ligger i vika til vinternettene. Etter det står ikke dette huset her lenger. Si når.',
        valg: [
            {
                id: 'vinternettene',
                tekst: 'Nå, i vinternettene',
                undertekst: 'Når året vender. Slik det alltid har vært gjort.',
                passer: true,
            },
            {
                id: 'jul',
                tekst: 'Vent til midtvinter, til jul',
                undertekst: 'Det er også et blot. Da er kanskje skipet borte.',
                passer: false,
            },
            {
                id: 'vaaren',
                tekst: 'Vent til våren',
                undertekst: 'Vi bloter jo før såinga også.',
                passer: false,
            },
        ],
    },
];

/** Merket på stangen ved horgen. Én for hver gud, tegnet og ikke skrevet. */
const GUDEMERKE: Record<string, string> = {
    odin: 'Odin',
    tor: 'Tor',
    froy: 'Frøy',
};

interface Props {
    /** Blotet er holdt. `passet` er sant når gaven passet til gud og tid. */
    onFerdig: (passet: boolean) => void;
    onAvbryt: () => void;
}

export function Blotet({ onFerdig, onAvbryt }: Props) {
    const [steg, setSteg] = useState(0);
    const [valgt, setValgt] = useState<Record<string, Valg>>({});
    const [fase, setFase] = useState<Fase>('spor');

    const naa = STEG[steg];
    const gud = valgt.hvem?.id ?? 'froy';
    const gave = valgt.hva?.id ?? 'hesten';
    const passet = Object.values(valgt).every((v) => v.passer) && Object.keys(valgt).length === 3;

    const velg = (v: Valg) => {
        const nye = { ...valgt, [naa.id]: v };
        setValgt(nye);
        if (steg + 1 < STEG.length) {
            setSteg(steg + 1);
            return;
        }
        // Pausen er ikke pynt. Blotet skal rekke å skje før noen sier noe om
        // det - ellers leser kvelden som en fasit og ikke som en kveld.
        setFase('blotet');
        window.setTimeout(() => setFase('etterpa'), 3400);
    };

    return (
        <div
            className="absolute inset-0 z-50 grid place-items-center bg-slate-950/85 px-3 backdrop-blur-sm"
            data-prove="blotet"
        >
            <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-amber-300/25 bg-[#120f0b]/97 p-5 shadow-2xl sm:p-6">
                <header className="mb-4 flex items-baseline justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-amber-300/80">
                            Horgen ved hovet
                        </p>
                        <h2 className="font-display text-2xl font-bold text-amber-50">Blotet</h2>
                    </div>
                    <p className="text-sm text-amber-200/50">
                        Ulv spør. Han svarer ikke for deg.
                    </p>
                </header>

                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                    <Tegning gud={gud} gave={gave} fase={fase} passet={passet} />

                    <div>
                        {fase === 'spor' && (
                            <>
                                <p className="mb-1 text-xs uppercase tracking-widest text-amber-200/40">
                                    Spørsmål {steg + 1} av {STEG.length}
                                </p>
                                <p className="mb-3 text-[15px] leading-relaxed text-amber-100/80">
                                    «{naa.ledetekst}»
                                </p>
                                <h3 className="mb-3 font-display text-xl font-bold text-amber-50">
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
                                            <span className="block text-[15px] font-semibold text-amber-50">
                                                {v.tekst}
                                            </span>
                                            <span className="mt-0.5 block text-sm text-amber-100/50">
                                                {v.undertekst}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {fase === 'blotet' && <Riten gud={gud} gave={gave} />}

                        {fase === 'etterpa' && (
                            <Etterpa passet={passet} onFerdig={() => onFerdig(passet)} />
                        )}
                    </div>
                </div>

                {fase === 'spor' && (
                    <button
                        type="button"
                        onClick={onAvbryt}
                        className="mt-5 w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-amber-100/70 transition hover:bg-white/5"
                    >
                        Gå ned igjen (Esc)
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Selve riten, slik Snorre beskriver den i Håkon den godes saga: blodet
 * samles i en bolle, kvisten dyppes og alt stenkes, kjøttet kokes, og begrene
 * bæres rundt ilden. Teksten står uansett hva eleven valgte - det er ikke her
 * hun får vite noe.
 */
function Riten({ gud, gave }: { gud: string; gave: string }) {
    const gitt =
        gave === 'hesten'
            ? 'Hesten føres fram. Ulv gjør det fort.'
            : gave === 'hanen'
              ? 'Hanen føres fram. Det tar et øyeblikk.'
              : 'Sølvet bæres ned til myra og senkes.';
    return (
        <div className="space-y-3 text-[15px] leading-relaxed text-amber-100/85">
            <p>{gitt}</p>
            <p>
                Blodet samles i en bolle. Ulv dypper en kvist i det og stenker veggene, benkene
                og hver eneste som står der. Du får det i ansiktet. Ingen tørker det av.
            </p>
            <p>
                Kjøttet kokes i kjeler over ilden. Begrene bæres rundt, og Ulv signer dem i navnet
                til {GUDEMERKE[gud] ?? 'guden'}.
            </p>
        </div>
    );
}

/**
 * Kvelden etterpå.
 *
 * Her ligger hele forskjellen, og den sies ikke som en rettelse. Passet gaven,
 * blir folk til det lysner. Passet den ikke, går de hjem - og ingen sier
 * hvorfor. Det er slik en sed virker: den har ingen læresetninger å bryte, den
 * har bare folk som ser.
 */
function Etterpa({ passet, onFerdig }: { passet: boolean; onFerdig: () => void }) {
    return (
        <div data-prove={passet ? 'blot-passet' : 'blot-passet-ikke'}>
            <h3
                className={`font-display text-2xl font-bold ${passet ? 'text-emerald-300' : 'text-amber-200/70'}`}
            >
                {passet ? 'De ble til det lysnet.' : 'Folk gikk tidlig.'}
            </h3>
            {passet ? (
                <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-amber-100/85">
                    <p>
                        Første beger går til Odin, for kongens makt. Det andre til Njord og Frøy,
                        for godt år og fred. Så bæres minnebegrene: ett for hver av dem som ligger
                        i haugene nedenfor.
                    </p>
                    <p>
                        Hele bygda spiser hestekjøtt til langt på natt. Ingen har spurt deg hva du
                        tror. De spurte om du kom.
                    </p>
                    <p className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200">
                        Du kan Blot nå. Ikke fordi noen forklarte det - fordi du holdt et.
                    </p>
                </div>
            ) : (
                <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-amber-100/85">
                    <p>
                        Begrene går rundt, men de går fort. Folk spiser og reiser seg. Før ilden
                        har brent ned, står du igjen med Ulv og to gamle koner.
                    </p>
                    <p>
                        Ingen sier hva som var galt. Ingen kommer til å si det heller. Det finnes
                        ingen bok her å slå det opp i - det finnes bare folk som har vært med på
                        dette hvert eneste år, og som så at i kveld var det noe som ikke stemte.
                    </p>
                    <p className="text-amber-200/60">
                        Ulv står ved hovet i morgen også. Han pleier å svare hvis noen spør.
                    </p>
                </div>
            )}
            <p className="mt-4 text-sm text-amber-100/50">
                Nede i vika sto to av kongens menn og så på. De skrev ingenting ned. De husket.
            </p>
            <button
                type="button"
                autoFocus
                onClick={onFerdig}
                className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-[#2b2018] transition hover:bg-amber-300"
            >
                Gå hjem
            </button>
        </div>
    );
}

/**
 * Horgen slik den står nå: steinene, ilden, stangen med gudemerket, og det som
 * er ført fram. Tegnet med SVG, som skroget - forskjellen mellom de tre gudene
 * skal ses, ikke leses.
 */
function Tegning({
    gud,
    gave,
    fase,
    passet,
}: {
    gud: string;
    gave: string;
    fase: Fase;
    passet: boolean;
}) {
    const brenner = fase !== 'spor';
    // Halve bygda er borte når kvelden ikke bar. Det er ikke en straff i
    // tallene - det er det eneste svaret hun får.
    const gikk = fase === 'etterpa' && !passet;
    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0b0906]">
            <svg viewBox="0 0 200 170" className="h-full w-full" role="img" aria-label="Horgen">
                <defs>
                    <linearGradient id="blot-natt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#141a24" />
                        <stop offset="100%" stopColor="#0b0906" />
                    </linearGradient>
                </defs>
                <rect x="0" y="0" width="200" height="170" fill="url(#blot-natt)" />
                {/* Vinternettene. Stjernene er der fordi kvelden er kald og
                    klar, ikke fordi skjermen trengte pynt. */}
                {[
                    [22, 18],
                    [58, 12],
                    [96, 24],
                    [132, 14],
                    [176, 26],
                    [148, 34],
                    [40, 36],
                ].map(([x, y]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="1" fill="#cfd8e6" opacity="0.7" />
                ))}
                {/* Skogkant */}
                {Array.from({ length: 11 }).map((_, i) => (
                    <polygon
                        key={i}
                        points={`${8 + i * 18},108 ${16 + i * 18},74 ${24 + i * 18},108`}
                        fill="#131a13"
                    />
                ))}
                <rect x="0" y="106" width="200" height="64" fill="#221a12" />

                {/* Stangen med gudemerket */}
                <rect x="150" y="52" width="4" height="58" fill="#4a3a26" />
                <GudeMerke gud={gud} />

                {/* Horgen: en haug flate steiner */}
                <g>
                    <ellipse cx="100" cy="118" rx="34" ry="9" fill="#2c2620" />
                    <rect x="72" y="100" width="56" height="16" rx="2" fill="#4a4640" />
                    <rect x="78" y="92" width="44" height="10" rx="2" fill="#565149" />
                    <rect x="84" y="86" width="32" height="7" rx="2" fill="#605a51" />
                    {/* Gammelt blod på steinen. Det er ikke pynt - horgen var svart. */}
                    <rect x="86" y="86" width="28" height="3" fill="#4a1f1c" opacity="0.85" />
                    <path d="M92 89 l2 9 M104 89 l-1 11 M112 89 l1 7" stroke="#3d1a17" strokeWidth="1.6" />
                </g>

                {/* Bollen med blodet */}
                <ellipse cx="100" cy="85" rx="9" ry="3.4" fill="#2b2118" />
                <ellipse cx="100" cy="84.4" rx="7" ry="2.4" fill={brenner ? '#6d1f1a' : '#1a1410'} />

                {/* Ilden */}
                <g opacity={brenner ? 1 : 0.35}>
                    <ellipse cx="46" cy="126" rx="20" ry="6" fill="#2a1c10" />
                    <path d="M46 124 q-9 -12 0 -22 q4 8 8 3 q5 10 -8 19z" fill="#e07a1f" />
                    <path d="M46 124 q-5 -8 0 -14 q3 5 5 2 q3 6 -5 12z" fill="#ffd166" />
                </g>

                {/* Det som er ført fram */}
                <Gave gave={gave} skjult={fase !== 'spor'} />

                {/* Folk rundt. Silhuetter, ingen ansikter - det er ikke dem det
                    handler om, det er at de er der. */}
                {[14, 28, 170, 186].map((x, i) => (
                    <g key={x} opacity={gikk && i > 1 ? 0.12 : 0.9}>
                        <circle cx={x} cy={119} r="4" fill="#332a1e" />
                        <rect x={x - 4.5} y={123} width="9" height="18" rx="4" fill="#2a2218" />
                    </g>
                ))}
            </svg>
        </div>
    );
}

function GudeMerke({ gud }: { gud: string }) {
    if (gud === 'tor') {
        // Hammeren: kort skaft, tungt hode.
        return (
            <g fill="#c9b489">
                <rect x="146" y="38" width="12" height="6" />
                <rect x="150" y="42" width="4" height="12" />
            </g>
        );
    }
    if (gud === 'odin') {
        // Spydet og de to ravnene.
        return (
            <g fill="#c9b489">
                <rect x="151" y="30" width="2" height="24" />
                <polygon points="152,24 148,32 156,32" />
                <circle cx="142" cy="36" r="3" />
                <circle cx="162" cy="36" r="3" />
            </g>
        );
    }
    // Frøy: kornbandet. Fruktbarhetsguden bar året i seg, ikke et våpen.
    return (
        <g fill="#d8bf72">
            <path d="M152 30 l-7 20 h14z" />
            <rect x="145" y="48" width="14" height="4" rx="1" fill="#a8863c" />
        </g>
    );
}

function Gave({ gave, skjult }: { gave: string; skjult: boolean }) {
    if (skjult) return null;
    if (gave === 'hanen') {
        return (
            <g fill="#8a5a2f">
                <ellipse cx="60" cy="102" rx="6" ry="5" />
                <circle cx="65" cy="97" r="3" />
                <polygon points="65,93 63,90 67,91" fill="#b03a2e" />
                <rect x="59" y="106" width="1.6" height="5" fill="#6a4a20" />
            </g>
        );
    }
    if (gave === 'solvet') {
        return (
            <g fill="#c8ccd2">
                <circle cx="60" cy="104" r="3.2" />
                <circle cx="66" cy="106" r="2.6" />
                <circle cx="55" cy="107" r="2.2" />
            </g>
        );
    }
    // Hesten. Enkel silhuett - den skal leses som et stort dyr, ikke som en
    // illustrasjon i en fagbok.
    return (
        <g fill="#5a4632">
            <rect x="42" y="92" width="26" height="13" rx="5" />
            <rect x="64" y="83" width="7" height="12" rx="3" />
            <rect x="69" y="82" width="7" height="5" rx="2" />
            <rect x="45" y="104" width="3" height="10" />
            <rect x="52" y="104" width="3" height="10" />
            <rect x="60" y="104" width="3" height="10" />
            <rect x="65" y="104" width="3" height="10" />
            <path d="M42 92 l-6 12" stroke="#5a4632" strokeWidth="3" />
        </g>
    );
}
