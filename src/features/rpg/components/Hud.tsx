import { SPELL_BY_ID } from '../data/spells';
import { maksVerdier, nivaFremgang, useRpgStore } from '../store/useRpgStore';
import { numToHex } from '../engine/pixels';
import { tilSpill } from '../engine/bridge';
import type { KampSnapshot } from '../engine/kamp';

interface Props {
    hint: string | null;
    /** Retningen til det aktive oppdragets kilde. */
    kompass: { vinkel: number; avstand: number; navn: string } | null;
    /** Pust, gard og skjoldslitasje. Null før scenen har sendt sitt første bilde. */
    kamp: KampSnapshot | null;
    onApneSekk: () => void;
    onApneLogg: () => void;
    onPause: () => void;
}

export function Hud({ hint, kompass, kamp, onApneSekk, onApneLogg, onPause }: Props) {
    const store = useRpgStore();
    const maks = maksVerdier(store);
    const fremgang = nivaFremgang(store.xp);
    const aktive = Object.values(store.quester).filter((s) => s === 'aktiv').length;

    return (
        <div className="pointer-events-none absolute inset-0 z-20 select-none">
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
                <Stolpe verdi={store.hp} maks={maks.hp} farge="#e0483f" bak="#3a1512" merkelapp="Liv" />
                {/*
                    Pusten. Den rister rødt når den bunner ut - eleven må kjenne
                    at hun er tom, ikke lese det. Uten pust kan hun ikke blokkere,
                    og slagene blir trege.
                */}
                {kamp && (
                    <Stolpe
                        verdi={kamp.pust}
                        maks={kamp.maksPust}
                        farge={kamp.tom ? '#e0483f' : '#7ad0b0'}
                        bak="#122a24"
                        merkelapp="Pust"
                        rister={kamp.tom}
                    />
                )}
                <Stolpe verdi={store.mana} maks={maks.mana} farge="#4aa3e0" bak="#122a3a" merkelapp="Kraft" />
                {kamp && <Skjoldmerke kamp={kamp} />}
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
                    <span className="text-[11px] text-slate-400">{Math.round(kompass.avstand / 16)} ruter</span>
                </div>
            )}

            {/* Knapperad */}
            <div className="pointer-events-auto absolute right-3 top-14 flex gap-2">
                <Knapp onClick={onApneSekk} tekst="Sekk" tast="I" />
                <Knapp onClick={onApneLogg} tekst="Oppdrag" tast="L" merke={aktive || undefined} />
                <Knapp onClick={onPause} tekst="Meny" tast="Esc" />
            </div>

            {/* Besvergelser nederst */}
            <div className="pointer-events-auto absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                {store.spells.slice(0, 4).map((id, i) => {
                    const spell = SPELL_BY_ID[id];
                    if (!spell) return null;
                    const harRaad = store.mana >= spell.kostnad;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => tilSpill.emit('besvergelse', { spellId: id })}
                            title={`${spell.name} - ${spell.beskrivelse}`}
                            className={`relative h-14 w-14 rounded-xl border-2 bg-slate-900/85 transition ${
                                harRaad
                                    ? 'border-white/25 hover:border-white/60'
                                    : 'border-white/10 opacity-45'
                            }`}
                        >
                            <span
                                className="absolute inset-2 rounded-lg"
                                style={{ background: numToHex(spell.farge), opacity: 0.85 }}
                            />
                            <span className="absolute left-1 top-0.5 text-[10px] font-bold text-white/70">
                                {i + 1}
                            </span>
                            <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-white/80">
                                {spell.kostnad}
                            </span>
                        </button>
                    );
                })}
            </div>

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
 * Skjoldet: én rute per treff det tåler. Slitasjen skal være en teller eleven kan
 * se, ikke en terning - er den tilfeldig, føles bruddet urettferdig; er den
 * synlig, er den spenning.
 */
function Skjoldmerke({ kamp }: { kamp: KampSnapshot }) {
    if (kamp.skjoldMaks <= 0) return null;
    const brukket = kamp.skjoldHelse <= 0;
    return (
        <div className="flex items-center gap-1.5 pt-0.5" title={kamp.skjoldNavn}>
            <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                    brukket ? 'text-rose-300' : kamp.gardOppe ? 'text-amber-200' : 'text-slate-400'
                }`}
            >
                {brukket ? 'Bart' : 'Skjold'}
            </span>
            <div className="flex gap-[3px]">
                {Array.from({ length: kamp.skjoldMaks }, (_, i) => (
                    <span
                        key={i}
                        className={`h-2.5 w-1.5 rounded-[1px] ring-1 ring-black/50 ${
                            i < kamp.skjoldHelse ? '' : 'opacity-25'
                        }`}
                        style={{
                            background:
                                i < kamp.skjoldHelse
                                    ? kamp.gardOppe
                                        ? '#e8c96a'
                                        : '#c9a86a'
                                    : '#3a2a18',
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
            className={`relative w-full overflow-hidden rounded-full ring-1 ring-black/40 ${tynn ? 'h-2' : 'h-4'} ${
                rister ? 'animate-[hudRist_240ms_ease-in-out_infinite]' : ''
            }`}
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
            <span className="ml-1.5 rounded bg-white/10 px-1 text-[10px] text-slate-300">{tast}</span>
            {merke ? (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-slate-900">
                    {merke}
                </span>
            ) : null}
        </button>
    );
}
