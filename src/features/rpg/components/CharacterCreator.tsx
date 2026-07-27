import { useMemo, useState } from 'react';
import { CLASSES, FACES, HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../data/classes';
import { renderHeroPortrait } from '../engine/spriteforge';
import { NAVN_MAKS, vurderNavn } from '../net/navnevakt';
import type { CharacterDraft, ClassId } from '../types';

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
    const [classId, setClassId] = useState<ClassId>('skald');
    const [skin, setSkin] = useState(0);
    const [hair, setHair] = useState(0);
    const [hairColor, setHairColor] = useState(0);
    const [face, setFace] = useState(0);

    const klasse = CLASSES.find((c) => c.id === classId)!;

    // Navnet vises over hodet hennes for alle andre i hallen, så det prøves her
    // og ikke først når hun kommer inn. Se `net/navnevakt.ts` for hvorfor
    // tegnsettet er så smalt som det er.
    const dom = vurderNavn(navn);
    const kanStarte = dom.ok;

    const portrett = useMemo(
        () =>
            renderHeroPortrait({
                appearance: { skin, hair, hairColor, face },
                tunic: klasse.palette.tunic,
                trim: klasse.palette.trim,
                armorTier: 0,
            }),
        [skin, hair, hairColor, face, klasse]
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
                                {klasse.name}
                            </p>
                        </div>
                        <dl className="w-full space-y-1 text-xs text-slate-300">
                            <Rad navn="Liv" verdi={klasse.base.hp} />
                            <Rad navn="Styrke" verdi={klasse.base.styrke} />
                            <Rad navn="Vern" verdi={klasse.base.vern} />
                        </dl>
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

                        {/* Klasse */}
                        <section>
                            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Vei
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {CLASSES.map((c) => {
                                    const valgt = c.id === classId;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setClassId(c.id)}
                                            className={`rounded-xl border p-3 text-left transition ${
                                                valgt
                                                    ? 'border-amber-300/70 bg-amber-300/10 shadow-[0_0_0_1px_rgba(252,211,77,0.3)]'
                                                    : 'border-white/10 bg-white/5 hover:border-white/25'
                                            }`}
                                        >
                                            <p className="font-display font-semibold">{c.name}</p>
                                            <p className="text-[11px] uppercase tracking-wider text-amber-300/70">
                                                {c.tagline}
                                            </p>
                                            <p className="mt-1 text-xs leading-snug text-slate-300">
                                                {c.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Utseende */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Utseende
                            </h2>

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
                                    classId,
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

function Rad({ navn, verdi }: { navn: string; verdi: number }) {
    return (
        <div className="flex justify-between border-b border-white/5 pb-1">
            <dt>{navn}</dt>
            <dd className="font-semibold text-slate-100">{verdi}</dd>
        </div>
    );
}

function Fargevalg({
    label,
    farger,
    valgt,
    onVelg,
}: {
    label: string;
    farger: string[];
    valgt: number;
    onVelg: (i: number) => void;
}) {
    return (
        <div>
            <p className="mb-1.5 text-xs text-slate-400">{label}</p>
            <div className="flex flex-wrap gap-2">
                {farger.map((farge, i) => (
                    <button
                        key={farge}
                        type="button"
                        aria-label={`${label} ${i + 1}`}
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
