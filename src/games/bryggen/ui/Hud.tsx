// HUD-en mens det spilles: liv, oppdragslista, meldingene, samtalen og «Dette vet vi», E-tekstene,
// ytelsesboksen og systempanelene (systemPaneler.tsx). Lyst tema og stor skrift: den skal leses på
// en Chromebook (1366×768) og på projektor. Ingen tekst under 13 px.
//
// Alt står i fire kolonner (oppe til venstre, oppe i midten, oppe til høyre, nede i midten) som
// stabler det som vises. Ingen panel har egen plass på skjermen: da kan to ting aldri ende oppå
// hverandre, uansett hvor høyt livskortet blir eller hvor mange paneler som er oppe samtidig.
import { useEffect, useState } from 'react';
import type { HudState, WorldId } from '../graboks/game';
import { BismerVisning } from '../graboks/BismerVisning';
import { Aktiviteter, AktiviteterVenstre } from './Aktiviteter';
import { aktivitetNede } from './aktivitetNede';
import { meldingTid } from '../graboks/meldingko';
import { SYSTEM_PANELER, type PanelPlass } from './systemPaneler';
import { huskVet } from './vetlager';

const TING: Record<string, string> = { brev: 'Et brev', botte: 'En bøtte vann', sko: 'Et par sko' };

import {
    BRIKKE,
    ETIKETT,
    FYLL,
    GRONN,
    KNAPP,
    KNAPP_2,
    KORT,
    RILLE,
    ROD,
    SVAK,
    TEKST,
} from './stil';
import { Melding } from './Melding';
import { PungLinje } from './RpgHud';
import type { RpgHud } from '../graboks/rpg';

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

function Laas() {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            aria-label="Låst"
            className="mr-1.5 inline-block -translate-y-px align-baseline"
        >
            <rect x="2.5" y="7" width="11" height="8" rx="1.5" fill="currentColor" />
            <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
    );
}

function Paneler({ hud, plass }: { hud: HudState; plass: PanelPlass }) {
    return (
        <>
            {SYSTEM_PANELER.filter((p) => p.plass === plass && hud.system[p.navn] != null).map(
                ({ navn, Komponent }) => (
                    <Komponent key={navn} data={hud.system[navn]} />
                )
            )}
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
        const t = window.setTimeout(() => setMelding(null), meldingTid(hud.oppdragMelding));
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

    // Står det noe helt nede (samtale, replikk eller et aktivitetspanel)? Ellers løftes E-teksten.
    const nede = !!hud.samtale || !!hud.replikk || aktivitetNede(hud.system);
    const harOppdrag =
        world === 'gard' && visOppdrag && (hud.oppdrag.length > 0 || hud.ting.length > 0);

    return (
        <>
            {/* Oppe til venstre: livet, aktivitetene som må synes mens man ser midt i bildet, og rollespillkortene */}
            <div className="pointer-events-none absolute left-4 top-4 z-[1100] flex w-[300px] flex-col items-start gap-2">
                <div className={`w-64 px-4 py-2.5 ${KORT}`}>
                    <div className="flex items-baseline justify-between text-[16px] font-bold text-[#2b1d10]">
                        <span className="bry-display text-[21px] leading-none">
                            {(hud.system.rpg as RpgHud | undefined)?.rang ?? 'Junge'}
                        </span>
                        <span className="tabular-nums">{hud.playerHp}</span>
                    </div>
                    <div className={`mt-1 h-3 rounded-full ${RILLE}`}>
                        <div
                            className={`h-full rounded-full transition-[width] duration-200 ${FYLL.segl}`}
                            style={{ width: `${hpPct}%` }}
                        />
                    </div>
                    <PungLinje data={hud.system.rpg} />
                    {hud.bunter > 0 && (
                        <div className={`mt-1.5 ${SVAK}`}>
                            Bunter båret:{' '}
                            <span className="font-bold tabular-nums text-[#2b1d10]">
                                {hud.bunter}
                            </span>
                        </div>
                    )}
                </div>
                <AktiviteterVenstre system={hud.system} />
                <Paneler hud={hud} plass="venstre" />
            </div>

            {/* Øverst i midten: fienden og systempaneler */}
            <div className="pointer-events-none absolute inset-x-0 top-4 z-[1100] flex flex-col items-center gap-2 px-[21rem]">
                {hud.enemyActive && (
                    <div className={`w-72 px-4 py-2.5 ${KORT}`}>
                        <div className="bry-display text-center text-[21px] leading-none text-[#2b1d10]">
                            Tyven
                        </div>
                        <div className={`mt-1 h-3 rounded-full ${RILLE}`}>
                            <div
                                className={`h-full rounded-full transition-[width] duration-200 ${FYLL.tjaere}`}
                                style={{ width: `${enemyPct}%` }}
                            />
                        </div>
                    </div>
                )}
                <Paneler hud={hud} plass="midt" />
                {toast && (
                    <div className={`px-4 py-2 text-[16px] font-bold text-[#2b1d10] ${KORT}`}>
                        {toast}
                    </div>
                )}
                {melding && <Melding key={melding.n} m={melding} varighet={meldingTid(melding)} />}
                {hud.message && (
                    <div
                        className={`max-w-xl px-5 py-3 text-center text-[17px] font-semibold text-[#2b1d10] ${KORT}`}
                    >
                        {hud.message}
                    </div>
                )}
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
                        className={`${KNAPP_2} px-3 py-1.5 text-[15px]`}
                    >
                        ⛶ Fullskjerm
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onMeny();
                        }}
                        title="Meny (Esc)"
                        className={`${KNAPP} px-3 py-1.5 text-[15px]`}
                    >
                        Meny (Esc)
                    </button>
                </div>
                {harOppdrag && (
                    <div className={`pointer-events-none w-full px-4 py-3 ${KORT}`}>
                        <div className={ETIKETT}>Oppdrag (O)</div>
                        {hud.oppdrag.map((o) => (
                            <div key={o.id} className="mt-2">
                                <div
                                    className={`text-[17px] font-bold leading-snug ${o.klar ? GRONN : 'text-[#2b1d10]'}`}
                                >
                                    {o.klar && '✓ '}
                                    {o.tittel}
                                </div>
                                {o.linjer.map((l) => (
                                    <div
                                        key={l.tekst}
                                        className={`text-[15px] leading-snug ${l.ferdig ? 'text-[#7a6248] line-through decoration-[#9a2a1c]/70 decoration-1' : 'text-[#3d2a17]'}`}
                                    >
                                        {l.tekst}
                                        {l.antall && (
                                            <span className={`ml-1 font-bold tabular-nums ${ROD}`}>
                                                {l.antall}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {hud.ting.length > 0 && (
                            <div className={`mt-2 border-t border-[#b99a68]/60 pt-1.5 ${SVAK}`}>
                                Du bærer:{' '}
                                {hud.ting
                                    .map((t) => TING[t] ?? t)
                                    .join(', ')
                                    .toLowerCase()}
                            </div>
                        )}
                    </div>
                )}
                <div className="pointer-events-none flex w-full flex-col items-end gap-2">
                    <Paneler hud={hud} plass="hoyre" />
                </div>
            </div>

            {/* Nederst i midten, der blikket er: systempaneler, varsler i kampen, E-teksten, aktivitetene og
                samtalen, stablet nedover. Uten noe nederst står E-teksten litt opp fra kanten. */}
            <div
                className={`pointer-events-none absolute inset-x-0 bottom-6 z-[1100] flex flex-col items-center gap-2 px-4 ${nede ? '' : 'pb-[4.5rem]'}`}
            >
                <Paneler hud={hud} plass="bunn" />
                {hud.telegraph && (
                    <div
                        className={`bry rounded-lg border px-4 py-2 text-[18px] font-bold shadow-lg ${hud.telegraphSving ? 'border-[#6c190f] bg-[#9a2a1c] text-[#fff8ec]' : 'border-[#a06c18] bg-[#f2c45a] text-[#2b1d10]'}`}
                    >
                        {hud.telegraphSving
                            ? 'Stort svingslag! Rull unna (Q), det går gjennom garden'
                            : 'Han slår! Blokker (L / høyre) eller rull unna (Q)'}
                    </div>
                )}
                {hud.finisherReady && (
                    <div className={`px-4 py-2 text-[18px] font-bold ${ROD} ${KORT}`}>
                        F: Avslutt
                    </div>
                )}
                {hud.prompt && (
                    <div className={`px-5 py-2.5 text-[18px] font-bold text-[#2b1d10] ${KORT}`}>
                        {hud.prompt}
                    </div>
                )}
                <Aktiviteter system={hud.system} />

                {/* Samtalen: replikkene står i boblene over hodene. Nederst står hvem man snakker med og
                svarene, og «Dette vet vi» i sin helhet: det er ikke noen i spillet som sier det. */}
                {hud.samtale && (
                    <div className="w-[min(760px,92vw)]">
                        {hud.samtale.vet ? (
                            <div className={`border-l-[6px] border-l-[#b07d24] px-6 py-4 ${KORT}`}>
                                <div className={ETIKETT}>{hud.samtale.hvem}</div>
                                <p
                                    className={`mt-1 max-h-[38vh] overflow-hidden ${TEKST} text-[18px]`}
                                >
                                    {hud.samtale.tekst}
                                </p>
                                <div
                                    className={`mt-2 flex items-center justify-between font-semibold ${SVAK}`}
                                >
                                    <span>Lagret i dagboka (Esc)</span>
                                    <span>E: videre</span>
                                </div>
                            </div>
                        ) : hud.samtale.valg.length > 0 ? (
                            <div className={`px-5 py-3 ${KORT}`}>
                                <div className={ETIKETT}>Svar {hud.samtale.hvem}</div>
                                <ol className="mt-2 flex flex-col gap-2">
                                    {hud.samtale.valg.map((v, i) => {
                                        // Låst svar (rpg.ts): falmet, med hengelås og grunnen under.
                                        const laast = hud.samtale?.laast?.[i];
                                        return (
                                            <li
                                                key={v}
                                                className={`flex items-baseline gap-2.5 text-[18px] font-semibold leading-snug ${laast ? 'text-[#7a6650]' : 'text-[#2b1d10]'}`}
                                            >
                                                <span
                                                    className={
                                                        laast ? `${BRIKKE} opacity-50` : BRIKKE
                                                    }
                                                >
                                                    {i + 1}
                                                </span>
                                                <span>
                                                    {laast && <Laas />}
                                                    {v}
                                                    {laast && (
                                                        <span className="block text-[14px] font-semibold text-[#9a2a1c]">
                                                            {laast}
                                                        </span>
                                                    )}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ol>
                            </div>
                        ) : (
                            <div
                                className={`mx-auto w-max px-5 py-2 text-[17px] font-semibold text-[#3d2a17] ${KORT}`}
                            >
                                <span className={`font-bold ${ROD}`}>{hud.samtale.hvem}</span> · E:
                                videre
                            </div>
                        )}
                    </div>
                )}
                {!hud.samtale && hud.replikk && (
                    <div
                        className={`max-w-[min(680px,92vw)] px-5 py-2.5 text-center text-[18px] text-[#2b1d10] ${KORT}`}
                    >
                        <span className={`font-bold ${ROD}`}>{hud.replikk.hvem}: </span>
                        {hud.replikk.tekst}
                    </div>
                )}
            </div>

            {hud.bismer && <BismerVisning b={hud.bismer} />}

            {/* Ytelse: liten og diskret. Måleskriptene leser «X ms/bilde · sim Y ms» og linja under. */}
            {visYtelse && (
                <div className="bry pointer-events-none absolute bottom-3 right-3 rounded-md bg-[#f6edd9]/85 px-2.5 py-1.5 text-right text-[13px] leading-tight tabular-nums text-[#3d2a17] shadow">
                    <div className="font-bold text-[#2b1d10]">{hud.fps} FPS</div>
                    <div>
                        {hud.frameMs} ms/bilde · sim {hud.simMs} ms
                    </div>
                    <div>
                        {hud.drawCalls} tegnekall · {Math.round(hud.triangles / 1000)}k trekanter
                    </div>
                    {hud.cells > 0 && <div>{hud.cells} celler lastet</div>}
                </div>
            )}

            <Paneler hud={hud} plass="hel" />
        </>
    );
}
