// «Meg» i pausemenyen: rangen og stigen videre, pungen, ferdighetene med fremdrift og ryktet hos de
// fem fraksjonene med en forklaring av hvem de er. Leser rollespillet som går (graboks/rpg.ts) når
// menyen åpnes; spillet står stille så lenge.
//
// Tastatur: hver bit kan få fokus (pil opp og ned i panelet), så siden ruller dit.
import { aktivtRollespill, type Rollespill } from '../graboks/rpg';
import { FERDIGHETER, FERDIGHET_REKKE, FRAKSJONER, FRAKSJON_REKKE, RANGER, rykteOrd } from '../bygg/rpg-data';
import { Overskrift } from './menydeler';
import { FOKUS } from './fokus';
import { Mynt } from './RpgHud';

const BIT = `rounded-xl px-3 py-2 ${FOKUS}`;

function Stigen({ r }: { r: Rollespill }) {
    const neste = RANGER[r.rang + 1];
    const krav = neste ? r.kravListe(neste.krav) : [];
    return (
        <div tabIndex={0} className={`${BIT} bg-[#fbf1d6]`}>
            <div className="flex items-baseline justify-between gap-3">
                <div>
                    <div className="bry-display text-[26px] font-extrabold leading-tight text-[#2b1d10]">{RANGER[r.rang].navn}</div>
                    <p className="text-[15px] leading-snug text-[#5c4630]">{RANGER[r.rang].om}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#fbf5e6] px-3 py-1.5 shadow-sm">
                    <Mynt str={22} />
                    <span className="text-[22px] font-extrabold tabular-nums text-[#2b1d10]">{r.witten}</span>
                    <span className="text-[14px] text-[#5c4630]">witten</span>
                </div>
            </div>
            {/* Stigen: alle trinnene, det du står på er fylt. */}
            <ol className="mt-3 flex items-stretch gap-1" aria-label="Rangstigen">
                {RANGER.map((g, i) => (
                    <li
                        key={g.navn}
                        className={`flex-1 rounded-lg px-1.5 py-1.5 text-center text-[13px] font-bold leading-tight ${
                            i < r.rang ? 'bg-[#ead7b0] text-[#5a3519]' : i === r.rang ? 'bg-[#9a2a1c] text-[#fbf5e6] shadow' : 'bg-[#fbf5e6] text-[#7a6650]'
                        }`}
                    >
                        {g.navn}
                    </li>
                ))}
            </ol>
            <p className="mt-2 text-[14px] text-[#5c4630]">
                <span className="font-semibold">Du får nå:</span> {RANGER[r.rang].rett}
            </p>
            {neste && (
                <div className="mt-2 rounded-lg bg-[#fbf5e6] px-3 py-2">
                    <p className="text-[14px] font-bold text-[#2b1d10]">Neste rang: {neste.navn}</p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                        {krav.map((k) => (
                            <li key={k.tekst} className={`flex items-baseline gap-2 text-[14px] ${k.ok ? 'text-emerald-700' : 'text-[#5c4630]'}`}>
                                <span className="w-4 shrink-0 font-bold">{k.ok ? '✓' : '·'}</span>
                                <span>{k.tekst.replace(/^Krever /, '')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function Ferdigheter({ r }: { r: Rollespill }) {
    return (
        <div className="flex flex-col gap-1">
            {FERDIGHET_REKKE.map((f) => {
                const p = r.fremdrift(f);
                const andel = p.til === null ? 1 : (p.ovelse - p.fra) / (p.til - p.fra);
                const info = FERDIGHETER[f];
                return (
                    <div key={f} tabIndex={0} className={`${BIT} hover:bg-[#efe3c8]`}>
                        <div className="flex items-baseline justify-between">
                            <span className="text-[16px] font-bold text-[#2b1d10]">{info.navn}</span>
                            <span className="text-[14px] font-semibold tabular-nums text-[#9a2a1c]">
                                Nivå {p.nivaa}
                                {p.til !== null && <span className="text-[#7a6650]"> · {p.ovelse - p.fra}/{p.til - p.fra} til neste</span>}
                            </span>
                        </div>
                        <div className="mt-1 flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <div key={n} className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e2d2b0]">
                                    <div className="h-full rounded-full bg-[#9a2a1c]" style={{ width: `${n <= p.nivaa ? 100 : n === p.nivaa + 1 ? andel * 100 : 0}%` }} />
                                </div>
                            ))}
                        </div>
                        <p className="mt-1 text-[14px] leading-snug text-[#5c4630]">
                            {p.nivaa > 0 ? info.effekt(p.nivaa) : 'Ingen fordel ennå.'} <span className="text-[#7a6650]">{info.om}</span>
                        </p>
                    </div>
                );
            })}
        </div>
    );
}

function Rykte({ r }: { r: Rollespill }) {
    return (
        <div className="flex flex-col gap-1">
            {FRAKSJON_REKKE.map((f) => {
                const v = r.rykte[f];
                const info = FRAKSJONER[f];
                return (
                    <div key={f} tabIndex={0} className={`${BIT} hover:bg-[#efe3c8]`}>
                        <div className="flex items-baseline justify-between">
                            <span className="text-[16px] font-bold text-[#2b1d10]">{info.navn}</span>
                            <span className={`text-[14px] font-bold tabular-nums ${v > 0 ? 'text-emerald-700' : v < 0 ? 'text-rose-700' : 'text-[#5c4630]'}`}>
                                {rykteOrd(v)} · {v > 0 ? `+${v}` : v}
                            </span>
                        </div>
                        {/* Måleren går fra -100 til 100 med null i midten. */}
                        <div className="relative mt-1 h-3 overflow-hidden rounded-full bg-[#e2d2b0]">
                            <div className="absolute inset-y-0 left-1/2 w-px bg-[#cdb68a]" />
                            <div
                                className={`absolute inset-y-0 rounded-full ${v >= 0 ? info.farge : 'bg-rose-500'}`}
                                style={v >= 0 ? { left: '50%', width: `${v / 2}%` } : { right: '50%', width: `${-v / 2}%` }}
                            />
                        </div>
                        <p className="mt-1 text-[14px] leading-snug text-[#5c4630]">{info.om}</p>
                    </div>
                );
            })}
        </div>
    );
}

export function Meg() {
    const r = aktivtRollespill();
    if (!r) return <p className="px-3 text-[16px] text-[#5c4630]">Rollespillet finnes bare i Bryggen.</p>;
    return (
        <div className="flex flex-col gap-2">
            <Stigen r={r} />
            <Overskrift>Ferdigheter</Overskrift>
            <p className="px-3 text-[14px] text-[#5c4630]">Du blir god av å gjøre ting, ikke av poeng.</p>
            <Ferdigheter r={r} />
            <Overskrift>Rykte</Overskrift>
            <p className="px-3 text-[14px] text-[#5c4630]">Hva folk i byen synes om deg. Det du velger, kan gjøre én gruppe glad og en annen sint.</p>
            <Rykte r={r} />
        </div>
    );
}
