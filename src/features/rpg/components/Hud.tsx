import { maksVerdier, nivaFremgang, useRpgStore } from '../store/useRpgStore';
import type { KampSnapshot } from '../engine/kamp';

interface Props {
    hint: string | null;
    /** Retningen til det aktive oppdragets kilde. */
    kompass: { vinkel: number; avstand: number; navn: string } | null;
    /** Ressurs, gard og vernslitasje. Null før scenen har sendt sitt første bilde. */
    kamp: KampSnapshot | null;
    /** Det ene eleven holder på med nå. Null mellom kapittelstegene. */
    oppgave: { tittel: string; mal: string; teller?: string } | null;
    /** Den navngitte motstanderen. Null når det ikke er noen. */
    motstander: { navn: string; andel: number } | null;
    onApneSekk: () => void;
    onApneLogg: () => void;
    onApneMinnetre: () => void;
    onPause: () => void;
}

export function Hud({
    hint,
    kompass,
    kamp,
    oppgave,
    motstander,
    onApneSekk,
    onApneLogg,
    onApneMinnetre,
    onPause,
}: Props) {
    const store = useRpgStore();
    const maks = maksVerdier(store);
    const fremgang = nivaFremgang(store.xp);
    const aktive = Object.values(store.quester).filter((s) => s === 'aktiv').length;

    return (
        <div className="pointer-events-none absolute inset-0 z-20 select-none">
            <Blodkant andel={store.hp / Math.max(1, maks.hp)} />

            {/* Øverst til venstre: liv, kraft, nivå */}
            <div className="absolute left-3 top-3 w-56 space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900/80 font-display text-sm font-bold text-amber-300 ring-1 ring-white/15">
                        {maks.niva}
                    </span>
                    <span className="truncate font-display text-sm font-semibold text-white drop-shadow">
                        {store.character?.name ?? 'Vandrer'}
                    </span>
                </div>
                <Stolpe
                    verdi={store.hp}
                    maks={maks.hp}
                    farge="#e0483f"
                    bak="#3a1512"
                    merkelapp="Liv"
                />
                {/*
                    Ressursen - pust i 793, nerve i 1916. Navnet og fargene
                    kommer fra epokens regelsett, ikke herfra: HUD-en skal ikke
                    vite hvilken epoke eleven står i.

                    Den rister rødt når den bunner ut - eleven må kjenne at hun
                    er tom, ikke lese det. Uten ressurs kan hun ikke blokkere,
                    og slagene blir trege.
                */}
                {kamp && (
                    <Stolpe
                        verdi={kamp.ressurs}
                        maks={kamp.maksRessurs}
                        farge={kamp.tom ? kamp.ressursDef.tomFarge : kamp.ressursDef.farge}
                        bak={kamp.ressursDef.bakgrunn}
                        merkelapp={kamp.ressursDef.navn}
                        rister={kamp.tom}
                    />
                )}
                {kamp && <Vernmerke kamp={kamp} />}
                <Stolpe
                    verdi={fremgang.inn}
                    maks={fremgang.spenn}
                    farge="#e8c96a"
                    bak="#332a12"
                    merkelapp="Erfaring"
                    tynn
                />
            </div>

            {/* Øverst til høyre: sølv og kunnskap */}
            <div className="absolute right-3 top-3 flex items-center gap-2">
                <Merke tekst={`${store.solv} sølv`} />
                <Merke tekst={`${store.riktigeSvar} riktige`} />
            </div>

            {/*
                Kompasset. Kartet er 64x48 ruter, men eleven ser bare ~28x16 av
                gangen. Uten en pil å følge er det å finne fem personer i en skog
                med 130 trær ren leting på måfå.
            */}
            {kompass && (
                <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/85 px-3 py-1.5 ring-1 ring-white/15">
                    <span
                        className="text-amber-300"
                        style={{ transform: `rotate(${kompass.vinkel + 90}deg)` }}
                        aria-hidden
                    >
                        ▲
                    </span>
                    <span className="text-xs font-semibold text-slate-100">{kompass.navn}</span>
                    <span className="text-[11px] text-slate-400">
                        {Math.round(kompass.avstand / 16)} ruter
                    </span>
                </div>
            )}

            {/* Knapperad */}
            <div className="pointer-events-auto absolute right-3 top-14 flex gap-2">
                <Knapp onClick={onApneSekk} tekst="Sekk" tast="I" />
                <Knapp onClick={onApneLogg} tekst="Oppdrag" tast="L" merke={aktive || undefined} />
                {/*
                    Minnetreet. Det som står der, er det eleven har gjort - og
                    det skal være like lett å slå opp som sekken. Uten en knapp
                    var begrepene et varsel som forsvant etter fire sekunder.
                */}
                <Knapp onClick={onApneMinnetre} tekst="Minne" tast="M" />
                <Knapp onClick={onPause} tekst="Meny" tast="Esc" />
            </div>

            {/*
                Navnestolpen øverst. Bare den ene som fører de andre får den, og
                den finnes for at eleven skal vite at hun slåss mot *noen* - ikke
                for at han skal virke sterkere. Skiltet over hodet drukner i et
                slagsmål med sju mann; denne gjør ikke det.

                Han heter «Mannen med hjelmen», og det er ikke fordi vi ikke
                fant på et navn. Ingen kilde ga ham et.
            */}
            {motstander && (
                <div
                    data-prove="motstander"
                    className="absolute left-1/2 top-14 w-80 -translate-x-1/2 text-center"
                >
                    <p className="mb-1 font-display text-lg font-bold text-slate-100 drop-shadow">
                        {motstander.navn}
                    </p>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/60 ring-1 ring-white/20">
                        <div
                            className="h-full bg-rose-500 transition-[width] duration-200"
                            style={{ width: `${Math.max(0, motstander.andel) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/*
                Oppgavekortet. Det ene eleven holder på med, ikke lista over alt
                hun kunne gjort - den ligger i oppdragsloggen. Til venstre og
                nede, der øyet ikke er i kamp: står det midt i bildet, leser hun
                det i stedet for å se på Ravn.

                Store bokstaver med vilje. Læreren viser dette på projektor.
            */}
            {oppgave && (
                <div
                    // Prøveskriptene leser kortet herfra. Som `aria-valuenow` på
                    // stolpene er dette en API-flate, ikke pynt.
                    data-prove="oppgave"
                    className="absolute bottom-20 left-3 w-64 rounded-xl border border-amber-300/30 bg-slate-950/85 px-3 py-2.5"
                >
                    <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300/90">
                            {oppgave.tittel}
                        </p>
                        {oppgave.teller && (
                            <span className="font-display text-sm font-bold text-amber-200">
                                {oppgave.teller}
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-[15px] leading-snug text-slate-100">{oppgave.mal}</p>
                </div>
            )}

            {/* Hint om hva E gjør */}
            {hint && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/85 px-4 py-1.5 text-sm font-medium text-amber-200 ring-1 ring-white/15">
                    {hint}
                </div>
            )}

            {/* Varsler */}
            <div className="absolute left-1/2 top-16 flex w-72 -translate-x-1/2 flex-col items-center gap-1.5">
                {store.varsler.map((v) => (
                    <div
                        key={v.id}
                        className={`animate-[fadeIn_150ms_ease-out] rounded-lg px-3 py-1.5 text-center text-sm font-medium shadow-lg ring-1 ${
                            v.art === 'bra'
                                ? 'bg-emerald-500/90 text-emerald-50 ring-emerald-300/40'
                                : v.art === 'darlig'
                                ? 'bg-rose-600/90 text-rose-50 ring-rose-300/40'
                                : v.art === 'niva'
                                ? 'bg-amber-400/95 text-slate-900 ring-amber-200/50'
                                : 'bg-slate-900/90 text-slate-100 ring-white/15'
                        }`}
                    >
                        {v.tekst}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Blod inn fra skjermkanten under 30 % liv, pulserende i takt med hjerteslaget
 * scenen spiller (~1 slag i sekundet). Eleven skal kjenne at det står dårlig til
 * før hun rekker å lese tallet.
 *
 * Ligger som et React-lag oppå lerretet, ikke inne i Phaser: et lag i scenen
 * ville blitt skalert av kamerazoomen og blitt en grøt av store piksler.
 */
function Blodkant({ andel }: { andel: number }) {
    if (andel >= 0.3 || andel <= 0) return null;
    // Fra tydelig til påtrengende etter hvor ille det er, ikke av/på. Gulvet må
    // være høyt nok til at den *ses* i det samme den slår inn - en effekt eleven
    // ikke legger merke til, er ikke en advarsel.
    const styrke = 0.34 + (1 - andel / 0.3) * 0.42;
    return (
        <div
            className="pointer-events-none absolute inset-0 animate-[hjerteslag_980ms_ease-in-out_infinite]"
            style={{
                background: `radial-gradient(ellipse at center, rgba(122,8,8,0) 34%, rgba(122,8,8,${styrke.toFixed(
                    2
                )}) 100%)`,
            }}
            aria-hidden
        />
    );
}

/**
 * Vernet: én rute per treff det tåler. Slitasjen skal være en teller eleven kan
 * se, ikke en terning - er den tilfeldig, føles bruddet urettferdig; er den
 * synlig, er den spenning.
 *
 * Ordene og fargene kommer fra epokens regelsett. «Skjold» og «Bart» er
 * vikingtidens ord; en skyttergrav i 1916 heter noe annet og er ikke gullbrun.
 */
function Vernmerke({ kamp }: { kamp: KampSnapshot }) {
    if (kamp.vernMaks <= 0) return null;
    const { navn, brutt, farge } = kamp.vernDef;
    const brukket = kamp.vernHelse <= 0;
    return (
        <div className="flex items-center gap-1.5 pt-0.5" title={kamp.vernNavn}>
            <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                    brukket ? 'text-rose-300' : kamp.gardOppe ? 'text-amber-200' : 'text-slate-400'
                }`}
            >
                {brukket ? brutt : navn}
            </span>
            <div className="flex gap-[3px]">
                {Array.from({ length: kamp.vernMaks }, (_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 w-1.5 rounded-[1px] ring-1 ring-black/50 ${
                            i < kamp.vernHelse ? '' : 'opacity-25'
                        }`}
                        style={{
                            background:
                                i < kamp.vernHelse
                                    ? kamp.gardOppe
                                        ? farge.oppe
                                        : farge.nede
                                    : farge.tomt,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

function Stolpe({
    verdi,
    maks,
    farge,
    bak,
    merkelapp,
    tynn,
    rister,
}: {
    verdi: number;
    maks: number;
    farge: string;
    bak: string;
    merkelapp: string;
    tynn?: boolean;
    rister?: boolean;
}) {
    const andel = Math.max(0, Math.min(1, verdi / Math.max(1, maks)));
    return (
        <div
            className={`relative w-full overflow-hidden rounded-full ring-1 ring-black/40 ${
                tynn ? 'h-2' : 'h-4'
            } ${rister ? 'animate-[hudRist_240ms_ease-in-out_infinite]' : ''}`}
            style={{ background: bak }}
            role="progressbar"
            aria-label={merkelapp}
            aria-valuenow={Math.round(verdi)}
            aria-valuemax={Math.round(maks)}
        >
            <div
                className="h-full rounded-full transition-[width] duration-200"
                style={{ width: `${andel * 100}%`, background: farge }}
            />
            {!tynn && (
                <span className="absolute inset-0 grid place-items-center text-[10px] font-bold text-white/90 drop-shadow">
                    {Math.ceil(verdi)} / {Math.round(maks)}
                </span>
            )}
        </div>
    );
}

function Merke({ tekst }: { tekst: string }) {
    return (
        <span className="rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-amber-200 ring-1 ring-white/15">
            {tekst}
        </span>
    );
}

function Knapp({
    onClick,
    tekst,
    tast,
    merke,
}: {
    onClick: () => void;
    tekst: string;
    tast: string;
    merke?: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative rounded-lg bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-slate-100 ring-1 ring-white/15 transition hover:bg-slate-800"
        >
            {tekst}
            <span className="ml-1.5 rounded bg-white/10 px-1 text-[10px] text-slate-300">
                {tast}
            </span>
            {merke ? (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
                    {merke}
                </span>
            ) : null}
        </button>
    );
}
