// Karakterskaperen (blueprint §16.3).
//
// Den valgte før tre klasser: skald, runemester og vokter, med hvert sitt liv
// og sitt startvåpen. Det er borte. Hvem eleven *er*, avgjøres av året hun står
// i - Torstein er sytten i 793, Åsa styrer gården i 872 - og et klassevalg oppå
// det ville sagt at hun også hadde valgt å være en runemester med 78 liv.
//
// Det hun velger her, er to ting, og begge følger henne gjennom hele kampanjen:
// navnet andre elever ser i hallen, og hvordan figuren ser ut. Utseendet arves
// mellom kapitlene - Åsa har Torsteins hårfarge, Halvard har det samme
// ansiktet - uten at spillet sier ett ord om slektskap.

import { useMemo, useState } from 'react';
import { FACES, HAIR_COLORS, HAIR_STYLES, KJORTLER, SKIN_TONES, kjortelFor } from '../data/eleven';
import { KAPITLER } from '../data/kapitler';
import { renderHeroPortrait } from '../engine/spriteforge';
import { NAVN_MAKS, vurderNavn } from '../net/navnevakt';
import type { CharacterDraft } from '../types';

interface Props {
    onFerdig: (draft: CharacterDraft) => void;
}

const HAIR_LABELS: Record<string, string> = {
    kort: 'Kort',
    flette: 'Flette',
    topplue: 'Topplue',
    langt: 'Langt',
    skallet: 'Snauklipt',
    hestehale: 'Hestehale',
};

const FACE_LABELS: Record<string, string> = {
    rolig: 'Rolig',
    bestemt: 'Bestemt',
    blid: 'Blid',
    skeptisk: 'Skeptisk',
};

export function CharacterCreator({ onFerdig }: Props) {
    const [navn, setNavn] = useState('');
    const [kjortel, setKjortel] = useState(0);
    const [skin, setSkin] = useState(0);
    const [hair, setHair] = useState(0);
    const [hairColor, setHairColor] = useState(0);
    const [face, setFace] = useState(0);

    const drakt = kjortelFor(kjortel);
    /** Den hun begynner som. Rollen er kapittelets, ikke hennes. */
    const forste = KAPITLER[0];

    // Navnet vises over hodet hennes for alle andre i hallen, så det prøves her
    // og ikke først når hun kommer inn. Se `net/navnevakt.ts` for hvorfor
    // tegnsettet er så smalt som det er.
    const dom = vurderNavn(navn);
    const kanStarte = dom.ok;

    const portrett = useMemo(
        () =>
            renderHeroPortrait({
                appearance: { skin, hair, hairColor, face },
                tunic: drakt.tunic,
                trim: drakt.trim,
                armorTier: 0,
            }),
        [skin, hair, hairColor, face, drakt]
    );

    return (
        <div className="absolute inset-0 z-30 overflow-y-auto bg-slate-950/95 px-4 py-8 text-slate-100">
            <div className="mx-auto max-w-5xl">
                <header className="mb-6 text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">
                        Minnevokteren
                    </p>
                    <h1 className="font-display text-3xl font-bold sm:text-4xl">Hvem er du?</h1>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
                        Tåka har begynt å spise det folk husker. Du er den som skal hente det
                        tilbake. Lag figuren din, så begynner vi i hallen - der veien gjennom årene
                        starter.
                    </p>
                </header>

                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    {/* Forhåndsvisning */}
                    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                        <img
                            src={portrett}
                            alt="Figuren din"
                            className="h-48 w-auto [image-rendering:pixelated]"
                        />
                        <div className="text-center">
                            <p className="font-display text-lg font-semibold">
                                {navn.trim() || 'Uten navn'}
                            </p>
                            <p className="text-xs uppercase tracking-widest text-amber-300/80">
                                {drakt.navn}
                            </p>
                        </div>
                        {/*
                            Ingen tabell med liv, styrke og vern. Alle har de
                            samme tallene nå, og en stolpe som er lik for alle,
                            lover et valg som ikke finnes.
                        */}
                        <p className="text-center text-xs leading-relaxed text-slate-400">
                            Første gang du går inn i vikingtiden, er du{' '}
                            <span className="text-slate-200">{forste.rolle.navn}</span>,{' '}
                            {forste.rolle.alder} vintrer, i året {forste.aar}. Hvem du er, avgjøres
                            av året du står i. Dette er ansiktet ditt gjennom alle sammen.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {/* Navn */}
                        <section>
                            <label
                                htmlFor="rpg-navn"
                                className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-400"
                            >
                                Navn
                            </label>
                            <input
                                id="rpg-navn"
                                value={navn}
                                onChange={(e) => setNavn(e.target.value.slice(0, NAVN_MAKS))}
                                placeholder="Skriv navnet ditt"
                                aria-invalid={navn.length > 0 && !dom.ok}
                                aria-describedby="rpg-navn-hjelp"
                                className={`w-full rounded-xl border bg-slate-900/70 px-4 py-3 text-base outline-none transition ${
                                    navn.length > 0 && !dom.ok
                                        ? 'border-rose-400/60'
                                        : 'border-white/15 focus:border-amber-300/60'
                                }`}
                            />
                            <p
                                id="rpg-navn-hjelp"
                                className={`mt-1.5 text-xs ${
                                    navn.length > 0 && dom.grunn
                                        ? 'text-rose-300'
                                        : 'text-slate-400'
                                }`}
                            >
                                {navn.length > 0 && dom.grunn
                                    ? dom.grunn
                                    : 'Andre elever ser navnet ditt i hallen. Bokstaver, mellomrom og bindestrek.'}
                            </p>
                        </section>

                        {/* Utseende */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Utseende
                            </h2>

                            {/*
                                Kjortelen står først. Den er det største fargefeltet
                                på figuren, og fargen har et navn som sier hva den er
                                farget med - krapp, vaid, reseda. Det er den eneste
                                fagopplysningen i hele skjermen, og den koster ingenting.
                            */}
                            <Fargevalg
                                label="Kjortel"
                                farger={KJORTLER.map((k) => k.tunic)}
                                navn={KJORTLER.map((k) => k.navn)}
                                valgt={kjortel}
                                onVelg={setKjortel}
                            />
                            <Fargevalg
                                label="Hudtone"
                                farger={SKIN_TONES}
                                valgt={skin}
                                onVelg={setSkin}
                            />
                            <Fargevalg
                                label="Hårfarge"
                                farger={HAIR_COLORS}
                                valgt={hairColor}
                                onVelg={setHairColor}
                            />
                            <Knappevalg
                                label="Frisyre"
                                valg={HAIR_STYLES.map((h) => HAIR_LABELS[h] ?? h)}
                                valgt={hair}
                                onVelg={setHair}
                            />
                            <Knappevalg
                                label="Uttrykk"
                                valg={FACES.map((f) => FACE_LABELS[f] ?? f)}
                                valgt={face}
                                onVelg={setFace}
                            />
                        </section>

                        <button
                            // Fast id: teksten på knappen bytter med
                            // navnevakten, og prøveskriptene må kunne peke på
                            // den uansett hva den heter akkurat nå.
                            id="rpg-start"
                            type="button"
                            disabled={!kanStarte}
                            onClick={() =>
                                onFerdig({
                                    // Det ryddede navnet, ikke det hun skrev:
                                    // doble mellomrom skal ikke følge henne inn
                                    // i hallen.
                                    name: dom.navn,
                                    kjortel,
                                    appearance: { skin, hair, hairColor, face },
                                })
                            }
                            className="w-full rounded-xl bg-amber-400 px-6 py-4 font-display text-lg font-bold text-slate-900 transition enabled:hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {kanStarte
                                ? 'Gå inn i hallen'
                                : navn.length > 0
                                ? 'Velg et annet navn'
                                : 'Skriv et navn først'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Fargevalg({
    label,
    farger,
    navn,
    valgt,
    onVelg,
}: {
    label: string;
    farger: string[];
    /** Navn på hver farge, der de har et. Blir også skjermleserens tekst. */
    navn?: string[];
    valgt: number;
    onVelg: (i: number) => void;
}) {
    return (
        <div>
            <p className="mb-1.5 text-xs text-slate-400">
                {label}
                {navn?.[valgt] ? (
                    <span className="ml-2 text-slate-500">{navn[valgt]}</span>
                ) : null}
            </p>
            <div className="flex flex-wrap gap-2">
                {farger.map((farge, i) => (
                    <button
                        key={farge}
                        type="button"
                        aria-label={navn?.[i] ?? `${label} ${i + 1}`}
                        title={navn?.[i]}
                        onClick={() => onVelg(i)}
                        style={{ background: farge }}
                        className={`h-9 w-9 rounded-lg border-2 transition ${
                            valgt === i
                                ? 'border-amber-300 scale-110'
                                : 'border-white/20 hover:border-white/50'
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

function Knappevalg({
    label,
    valg,
    valgt,
    onVelg,
}: {
    label: string;
    valg: readonly string[];
    valgt: number;
    onVelg: (i: number) => void;
}) {
    return (
        <div>
            <p className="mb-1.5 text-xs text-slate-400">{label}</p>
            <div className="flex flex-wrap gap-2">
                {valg.map((navn, i) => (
                    <button
                        key={navn}
                        type="button"
                        onClick={() => onVelg(i)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                            valgt === i
                                ? 'border-amber-300/70 bg-amber-300/15 text-amber-100'
                                : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/35'
                        }`}
                    >
                        {navn}
                    </button>
                ))}
            </div>
        </div>
    );
}
