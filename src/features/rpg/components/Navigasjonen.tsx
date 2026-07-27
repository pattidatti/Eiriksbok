// Navigasjonen (blueprint §10.2). Nordvik til Lindisfarne, uten kompass.
//
// Kompasset kom til Norden fire hundre år senere. Det de hadde, var himmelen,
// fuglene og vannet - og et system som er enklere enn folk tror: **hold
// breddegraden.** Seil nordover eller sørover til sola står like høyt ved
// middag som den gjør der du skal, legg deg der, og hold vestover.
//
// Puzzlet er derfor ikke «finn veien». Det er «hold høyden». Fire dager, ett
// tegn per dag, og ett valg: nord, hold, sør. Bommer hun på breddegraden,
// driver hun sørover og møter ingenting - akkurat som blueprinten sier.
//
// Ingen av tegnene er oppfunnet. Solhøyde ved middag, fugler som flyr mot land
// om kvelden, drivved med bark fra trær som ikke vokser hjemme, og skyer som
// står stille over noe. Det er dette de faktisk brukte.

import { useState } from 'react';

type Kurs = 'nord' | 'hold' | 'sor';

interface Dag {
    nr: number;
    /** Det hun ser. Aldri det hun skal gjøre. */
    tegn: string;
    /** Hva tegnet betyr, sagt etterpå - aldri før. */
    forklaring: string;
    riktig: Kurs;
    /** Hva som skjer hvis hun holder feil kurs denne dagen. */
    galt: string;
}

const DAGER: Dag[] = [
    {
        nr: 1,
        tegn: 'Ved middag holder du solskyggetavla opp. Skyggen er kortere enn den var da dere lå ved Nordvik. Sola står høyere.',
        forklaring:
            'Høyere sol ved middag betyr at du har kommet sørover. Lindisfarne ligger omtrent like høyt som Nordvik - du må opp igjen.',
        riktig: 'nord',
        galt: 'Skyggen blir kortere for hver dag. Dere driver sørover.',
    },
    {
        nr: 2,
        tegn: 'Skyggen er den samme som i går. Sjøen er tung og lang, uten noe å se i noen retning.',
        forklaring:
            'Riktig høyde. Da er hele jobben å bli liggende her og la vinden ta dere vestover.',
        riktig: 'hold',
        galt: 'Dere forlot høyden dere allerede hadde. Nå må dere finne den igjen.',
    },
    {
        nr: 3,
        tegn: 'Sent på kvelden går det fugler over dere. De flyr alle samme vei, og de flyr med vilje - ikke i sirkel.',
        forklaring:
            'Sjøfugl går til land om kvelden. Følger du dem, følger du noen som vet hvor land er. De gikk nordvest.',
        riktig: 'nord',
        galt: 'Dere lot fuglene gå. De visste noe dere ikke visste.',
    },
    {
        nr: 4,
        tegn: 'En stokk driver forbi. Barken er ikke furu. Og langt framme står én sky stille mens de andre driver.',
        forklaring:
            'En sky som står stille, står over noe. Drivved med fremmed bark kommer fra en kyst i nærheten. Land ligger rett fram.',
        riktig: 'hold',
        galt: 'Dere svingte bort fra skya. Den sto over land.',
    },
];

const KURS: { id: Kurs; navn: string; undertekst: string }[] = [
    { id: 'nord', navn: 'Legg nordover', undertekst: 'Opp til høyere breddegrad.' },
    { id: 'hold', navn: 'Hold kursen', undertekst: 'Rett vestover, samme høyde.' },
    { id: 'sor', navn: 'Legg sørover', undertekst: 'Ned til lavere breddegrad.' },
];

interface Props {
    onFerdig: () => void;
    onAvbryt: () => void;
}

export function Navigasjonen({ onFerdig, onAvbryt }: Props) {
    const [dag, setDag] = useState(0);
    const [avvik, setAvvik] = useState(0);
    const [svar, setSvar] = useState<Kurs | null>(null);
    const [ferdig, setFerdig] = useState<'nei' | 'framme' | 'bortpaa'>('nei');

    const naa = DAGER[dag];

    const velg = (k: Kurs) => {
        setSvar(k);
        if (k !== naa.riktig) setAvvik((a) => a + 1);
    };

    const videre = () => {
        setSvar(null);
        if (dag + 1 < DAGER.length) {
            setDag(dag + 1);
            return;
        }
        // Ett bom lar seg rette opp underveis. To gjør det ikke - da ligger de
        // for langt sør, og under Lindisfarne er det bare mer sjø.
        setFerdig(avvik >= 2 ? 'bortpaa' : 'framme');
    };

    const proevIgjen = () => {
        setDag(0);
        setAvvik(0);
        setSvar(null);
        setFerdig('nei');
    };

    return (
        <div
            className="absolute inset-0 z-50 grid place-items-center bg-slate-950/85 px-3 backdrop-blur-sm"
            data-prove="navigasjonen"
        >
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-sky-300/25 bg-slate-950/97 p-5 shadow-2xl sm:p-6">
                <header className="mb-4 flex items-baseline justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.25em] text-sky-300/80">
                            Åpent hav
                        </p>
                        <h2 className="font-display text-2xl font-bold text-slate-50">
                            Vestover
                        </h2>
                    </div>
                    {ferdig === 'nei' && (
                        <p className="text-sm text-slate-400">
                            Dag {naa.nr} av {DAGER.length}
                        </p>
                    )}
                </header>

                <Himmel avvik={avvik} dag={dag} ferdig={ferdig} />

                {ferdig === 'nei' && (
                    <div className="mt-5">
                        <p className="text-[17px] leading-relaxed text-slate-100">{naa.tegn}</p>

                        {svar === null ? (
                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                {KURS.map((k) => (
                                    <button
                                        key={k.id}
                                        type="button"
                                        onClick={() => velg(k.id)}
                                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-sky-300/60 hover:bg-sky-300/10"
                                    >
                                        <span className="block font-display font-semibold text-slate-100">
                                            {k.navn}
                                        </span>
                                        <span className="mt-0.5 block text-sm text-slate-400">
                                            {k.undertekst}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4">
                                <p
                                    className={`font-display text-lg font-bold ${
                                        svar === naa.riktig ? 'text-emerald-300' : 'text-amber-300'
                                    }`}
                                >
                                    {svar === naa.riktig ? 'Dere ligger riktig.' : naa.galt}
                                </p>
                                <p className="mt-1 text-[15px] leading-relaxed text-slate-200">
                                    {naa.forklaring}
                                </p>
                                <button
                                    type="button"
                                    autoFocus
                                    onClick={videre}
                                    className="mt-4 w-full rounded-xl bg-sky-400 px-5 py-3 font-display text-base font-bold text-slate-900 transition hover:bg-sky-300"
                                >
                                    {dag + 1 < DAGER.length ? 'Neste dag' : 'Se etter land'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {ferdig === 'bortpaa' && (
                    <div className="mt-5">
                        <h3 className="font-display text-2xl font-bold text-rose-300">
                            Ingenting.
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                            Dere ligger for langt sør, og under det dere skulle til er det bare
                            mer sjø. Ingen kyst, ingen fugl, ingen sky som står stille. Dere
                            snur og legger nordover igjen, og det koster dere dager.
                        </p>
                        <button
                            type="button"
                            onClick={proevIgjen}
                            className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-slate-900 transition hover:bg-amber-300"
                        >
                            Finn høyden på nytt
                        </button>
                    </div>
                )}

                {ferdig === 'framme' && (
                    <div className="mt-5">
                        <h3 className="font-display text-2xl font-bold text-emerald-300">
                            Land.
                        </h3>
                        <p className="mt-2 text-[15px] leading-relaxed text-slate-200">
                            En lav, flat stripe under skya som sto stille. Du visste aldri hvor
                            du var - du visste bare at du lå like høyt som der du skulle. Det er
                            nok, og det er slik alle kom seg fram.
                        </p>
                        <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200">
                            Du kan Breddegradseiling nå.
                        </p>
                        <button
                            type="button"
                            autoFocus
                            onClick={onFerdig}
                            className="mt-5 w-full rounded-xl bg-amber-400 px-5 py-3 font-display text-base font-bold text-slate-900 transition hover:bg-amber-300"
                        >
                            Sett kursen inn
                        </button>
                    </div>
                )}

                {ferdig === 'nei' && (
                    <button
                        type="button"
                        onClick={onAvbryt}
                        className="mt-5 w-full rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5"
                    >
                        Snu og legg til land (Esc)
                    </button>
                )}
            </div>
        </div>
    );
}

/**
 * Himmelen og horisonten.
 *
 * Sola flytter seg opp og ned med avviket, og det er hele måleinstrumentet:
 * står den høyere enn den skal, ligger du for langt sør. Hun ser tallet uten at
 * det står noe tall.
 */
function Himmel({
    avvik,
    dag,
    ferdig,
}: {
    avvik: number;
    dag: number;
    ferdig: 'nei' | 'framme' | 'bortpaa';
}) {
    const solY = 54 + avvik * 16;
    const skygge = 46 - avvik * 12;
    const seSland = ferdig === 'framme' || dag >= 3;

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#8ea8bd] via-[#b8c6cd] to-[#33607e]">
            <svg viewBox="0 0 320 140" className="w-full" role="img" aria-label="Himmelen og sjøen">
                {/* Sola. Høyt = for langt sør. */}
                <circle cx="76" cy={solY} r="13" fill="#f6e3a8" />
                <circle cx="76" cy={solY} r="19" fill="#f6e3a8" opacity="0.28" />

                {/* Skyene driver. Den ene som står stille, står over land. */}
                <ellipse cx="180" cy="34" rx="30" ry="9" fill="#e6ecef" opacity="0.75" />
                <ellipse cx="238" cy="26" rx="22" ry="7" fill="#e6ecef" opacity="0.6" />
                {seSland && (
                    <ellipse cx="272" cy="46" rx="26" ry="11" fill="#f2f6f8" opacity="0.95" />
                )}

                {/* Land, når det er noe å se. En lav, flat stripe - ikke fjell. */}
                {seSland && (
                    <path
                        d="M232 96 q20 -7 40 -2 t46 3 v6 h-86 z"
                        fill="#5f7a4e"
                        opacity={ferdig === 'framme' ? 1 : 0.55}
                    />
                )}

                {/* Sjøen */}
                <rect x="0" y="100" width="320" height="40" fill="#33607e" />
                {[104, 114, 124, 134].map((y, i) => (
                    <path
                        key={y}
                        d={`M${-10 + i * 6} ${y} q22 -4 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0`}
                        stroke="#4b7c99"
                        strokeWidth="2"
                        fill="none"
                        opacity={0.7 - i * 0.12}
                    />
                ))}

                {/* Skyggen på solskyggetavla, i baugen. Kort skygge = høy sol. */}
                <rect x="26" y="98" width="34" height="4" rx="2" fill="#6b4a2a" />
                <line x1="43" y1="98" x2="43" y2="86" stroke="#5c4529" strokeWidth="3" />
                <line
                    x1="43"
                    y1="99"
                    x2={43 + Math.max(6, skygge)}
                    y2="99"
                    stroke="#2b2118"
                    strokeWidth="3"
                    opacity="0.8"
                />
            </svg>
        </div>
    );
}
