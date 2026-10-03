// HUD-en mens det spilles: liv, oppdragslista, meldingene, samtalen og «Dette vet vi», E-tekstene,
// ytelsesboksen og systempanelene (systemPaneler.tsx). Lyst tema og stor skrift: den skal leses på
// en Chromebook (1366×768) og på projektor. Ingen tekst under 13 px.
import { useEffect, useState } from 'react';
import type { HudState, WorldId } from '../graboks/game';
import { BismerVisning } from '../graboks/BismerVisning';
import { Aktiviteter } from './Aktiviteter';
import { SYSTEM_PANELER, type PanelPlass } from './systemPaneler';
import { huskVet } from './vetlager';

const TING: Record<string, string> = { brev: 'Et brev', botte: 'En bøtte vann' };

const KORT = 'rounded-2xl border border-white/70 bg-white/90 shadow-lg backdrop-blur';

interface Props {
    hud: HudState;
    world: WorldId;
    visOppdrag: boolean;
    visYtelse: boolean;
    /** En kort beskjed øverst (G og M bytter grafikk og lyd). */
    toast: string | null;
    onMeny: () => void;
    onFullskjerm: () => void;
}

function Paneler({ hud, plass }: { hud: HudState; plass: PanelPlass }) {
    return (
        <>
            {SYSTEM_PANELER.filter((p) => p.plass === plass && hud.system[p.navn] != null).map(({ navn, Komponent }) => (
                <Komponent key={navn} data={hud.system[navn]} />
            ))}
        </>
    );
}

export function Hud({ hud, world, visOppdrag, visYtelse, toast, onMeny, onFullskjerm }: Props) {
    // Oppdragsmeldingen (nytt, mål, fullført) står i noen sekunder, så forsvinner den.
    const [melding, setMelding] = useState<HudState['oppdragMelding']>(null);
    const meldingN = hud.oppdragMelding?.n ?? 0;
    useEffect(() => {
        if (!hud.oppdragMelding) return;
        setMelding(hud.oppdragMelding);
        const t = window.setTimeout(() => setMelding(null), hud.oppdragMelding.type === 'maal' ? 2800 : 5200);
        return () => window.clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [meldingN]);

    // «Dette vet vi» samles i dagboka når eleven har sett teksten.
    const vet = hud.samtale?.vet ? hud.samtale.tekst : null;
    useEffect(() => {
        if (vet) huskVet(vet);
    }, [vet]);

    const hpPct = Math.max(0, hud.playerHp);
    const enemyPct = Math.max(0, (hud.enemyHp / hud.enemyMax) * 100);
    // En filmscene går (sekvens.ts): da vises bare filmen.
    if (hud.system.film != null) return <Paneler hud={hud} plass="hel" />;

    const harOppdrag = world === 'gard' && visOppdrag && (hud.oppdrag.length > 0 || hud.ting.length > 0);

    return (
        <>
            {/* Liv */}
            <div className={`pointer-events-none absolute left-4 top-4 w-64 px-4 py-2.5 ${KORT}`}>
                <div className="flex items-baseline justify-between text-[15px] font-bold text-slate-800">
                    <span>Junge</span>
                    <span className="tabular-nums">{hud.playerHp}</span>
                </div>
                <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-rose-600 transition-[width] duration-200" style={{ width: `${hpPct}%` }} />
                </div>
                {hud.bunter > 0 && (
                    <div className="mt-1.5 text-[14px] text-slate-700">
                        Bunter båret: <span className="font-bold tabular-nums text-slate-900">{hud.bunter}</span>
                    </div>
                )}
            </div>

            {/* Øverst i midten: fienden og systempaneler */}
            <div className="pointer-events-none absolute left-1/2 top-4 flex -translate-x-1/2 flex-col items-center gap-2">
                {hud.enemyActive && (
                    <div className={`w-72 px-4 py-2.5 ${KORT}`}>
                        <div className="text-center text-[15px] font-bold text-slate-800">Tyven</div>
                        <div className="mt-1 h-3 overflow-hidden rounded-full bg-slate-200">
                            <div className="h-full rounded-full bg-slate-700 transition-[width] duration-200" style={{ width: `${enemyPct}%` }} />
                        </div>
                    </div>
                )}
                <Paneler hud={hud} plass="midt" />
            </div>

            {/* Øverst til høyre: knappene, oppdragslista og systempaneler */}
            <div className="absolute right-4 top-4 flex w-[19rem] flex-col items-end gap-2">
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onFullskjerm();
                        }}
                        title="Fullskjerm"
                        className="rounded-xl bg-white/90 px-3 py-1.5 text-[14px] font-semibold text-slate-800 shadow-md hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500"
                    >
                        ⛶ Fullskjerm
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMeny();
                        }}
                        title="Meny (Esc)"
                        className="rounded-xl bg-indigo-600 px-3 py-1.5 text-[14px] font-semibold text-white shadow-md hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300"
                    >
                        Meny (Esc)
                    </button>
                </div>
                {harOppdrag && (
                    <div className={`pointer-events-none w-full px-4 py-3 ${KORT}`}>
                        <div className="text-[13px] font-bold uppercase tracking-widest text-amber-700">Oppdrag (O)</div>
                        {hud.oppdrag.map((o) => (
                            <div key={o.id} className="mt-2">
                                <div className={`text-[16px] font-bold leading-snug ${o.klar ? 'text-emerald-700' : 'text-slate-900'}`}>
                                    {o.klar && '✓ '}
                                    {o.tittel}
                                </div>
                                {o.linjer.map((l) => (
                                    <div key={l.tekst} className={`text-[14px] leading-snug ${l.ferdig ? 'text-slate-500 line-through decoration-1' : 'text-slate-700'}`}>
                                        {l.tekst}
                                        {l.antall && <span className="ml-1 font-bold tabular-nums text-amber-700">{l.antall}</span>}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {hud.ting.length > 0 && (
                            <div className="mt-2 border-t border-slate-200 pt-1.5 text-[14px] text-slate-700">
                                Du bærer: {hud.ting.map((t) => TING[t] ?? t).join(', ').toLowerCase()}
                            </div>
                        )}
                    </div>
                )}
                <div className="pointer-events-none flex w-full flex-col items-end gap-2">
                    <Paneler hud={hud} plass="hoyre" />
                </div>
            </div>

            {/* Nederst i midten, der blikket er: varsler i kampen, E-teksten og systempaneler */}
            <div className="pointer-events-none absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                <Paneler hud={hud} plass="bunn" />
                {hud.telegraph && (
                    <div className={`rounded-xl px-4 py-2 text-[17px] font-bold shadow-lg ${hud.telegraphSving ? 'bg-orange-600 text-white' : 'bg-amber-300 text-slate-900'}`}>
                        {hud.telegraphSving ? 'Stort svingslag! Rull unna (Q), det går gjennom garden' : 'Han slår! Blokker (L / høyre) eller rull unna (Q)'}
                    </div>
                )}
                {hud.finisherReady && <div className="rounded-xl bg-white px-4 py-2 text-[17px] font-bold text-rose-700 shadow-lg">F: Avslutt</div>}
                {hud.prompt && <div className={`px-5 py-2.5 text-[17px] font-semibold text-slate-900 ${KORT}`}>{hud.prompt}</div>}
            </div>

            {hud.bismer && <BismerVisning b={hud.bismer} />}
            <Aktiviteter system={hud.system} />

            {/* Samtalen: replikkene står i boblene over hodene. Nederst står hvem man snakker med og
                svarene, og «Dette vet vi» i sin helhet: det er ikke noen i spillet som sier det. */}
            {hud.samtale && (
                <div className="pointer-events-none absolute bottom-6 left-1/2 w-[min(760px,92vw)] -translate-x-1/2">
                    {hud.samtale.vet ? (
                        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 px-6 py-4 shadow-xl">
                            <div className="text-[14px] font-bold uppercase tracking-wide text-amber-800">{hud.samtale.hvem}</div>
                            <p className="mt-1 max-h-[38vh] overflow-hidden text-[17px] leading-snug text-slate-900">{hud.samtale.tekst}</p>
                            <div className="mt-2 flex items-center justify-between text-[14px] font-semibold text-slate-600">
                                <span>Lagret i dagboka (Esc)</span>
                                <span>E: videre</span>
                            </div>
                        </div>
                    ) : hud.samtale.valg.length > 0 ? (
                        <div className={`px-5 py-3 ${KORT} bg-white/95`}>
                            <div className="text-[14px] font-bold uppercase tracking-wide text-indigo-700">Svar {hud.samtale.hvem}</div>
                            <ol className="mt-2 flex flex-col gap-2">
                                {hud.samtale.valg.map((v, i) => (
                                    <li key={v} className="flex items-baseline gap-2.5 text-[17px] font-semibold leading-snug text-slate-900">
                                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-[15px] font-bold text-slate-900">{i + 1}</span>
                                        {v}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    ) : (
                        <div className={`mx-auto w-max px-5 py-2 text-[16px] font-semibold text-slate-800 ${KORT}`}>
                            <span className="text-indigo-700">{hud.samtale.hvem}</span> · E: videre
                        </div>
                    )}
                </div>
            )}
            {!hud.samtale && hud.replikk && (
                <div className={`pointer-events-none absolute bottom-8 left-1/2 max-w-[min(680px,92vw)] -translate-x-1/2 px-5 py-2.5 text-center text-[17px] text-slate-900 ${KORT}`}>
                    <span className="font-bold text-indigo-700">{hud.replikk.hvem}: </span>
                    {hud.replikk.tekst}
                </div>
            )}

            {melding && (
                <div key={melding.n} className="bryggen-melding pointer-events-none absolute left-1/2 top-[24%] w-[min(580px,90vw)] rounded-2xl border-2 border-amber-400 bg-white/95 px-6 py-4 text-center shadow-2xl">
                    <div className={`text-[14px] font-bold uppercase tracking-[0.2em] ${melding.type === 'ferdig' ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {melding.type === 'nytt' ? 'Nytt oppdrag' : melding.type === 'ferdig' ? 'Oppdrag fullført' : melding.tittel}
                    </div>
                    <div className="mt-1 font-[Outfit,Inter,sans-serif] text-[28px] font-extrabold leading-tight text-slate-900">
                        {melding.type === 'maal' ? melding.tekst : melding.tittel}
                    </div>
                    {melding.type !== 'maal' && <div className="mx-auto mt-2 max-w-md text-[16px] leading-snug text-slate-700">{melding.tekst}</div>}
                </div>
            )}
            <style>{`.bryggen-melding{animation:bryggen-melding .5s cubic-bezier(.2,1.3,.4,1) both}
@keyframes bryggen-melding{from{opacity:0;transform:translate(-50%,10px) scale(.9)}to{opacity:1;transform:translate(-50%,0) scale(1)}}`}</style>

            {hud.message && (
                <div className={`pointer-events-none absolute left-1/2 top-24 max-w-xl -translate-x-1/2 px-5 py-3 text-center text-[16px] font-medium text-slate-900 ${KORT}`}>
                    {hud.message}
                </div>
            )}
            {toast && (
                <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 translate-y-16 rounded-xl bg-slate-900/85 px-4 py-2 text-[15px] font-semibold text-white shadow-lg">
                    {toast}
                </div>
            )}

            {/* Ytelse: liten og diskret. Måleskriptene leser «X ms/bilde · sim Y ms» og linja under. */}
            {visYtelse && (
                <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-white/75 px-2.5 py-1.5 text-right text-[13px] leading-tight tabular-nums text-slate-700 shadow">
                    <div className="font-bold text-slate-900">{hud.fps} FPS</div>
                    <div>{hud.frameMs} ms/bilde · sim {hud.simMs} ms</div>
                    <div>{hud.drawCalls} tegnekall · {Math.round(hud.triangles / 1000)}k trekanter</div>
                    {hud.cells > 0 && <div>{hud.cells} celler lastet</div>}
                </div>
            )}

            <Paneler hud={hud} plass="hel" />
        </>
    );
}
