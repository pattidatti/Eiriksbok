import { useEffect, useState } from 'react';
import { UNITS, ECONOMY, SCORE, COMBAT, PLAN_MAX, KORT, EVNER, type Kind, type KortId, type EvneId } from './tuning';
import { SLAG } from './levels';
import { channels, usedChannels, type G } from './game';
import { ROLE, EVNE_TEKST, wavePreview } from './hudData';
import { evner, cdOf, busy, squadOf } from './orders';

// HUD-en over kartet: kommandobåndet øverst, butikken og ordrene nederst.
// Den tar et øyeblikksbilde av spillet fem ganger i sekundet og tegner bare seg selv på nytt.

export interface HudActions {
    pick: (i: number) => void;
    reroll: () => void;
    wave: () => void;
    evne: (id: EvneId) => void;
    pause: () => void;
    paused: boolean;
    mute: () => void;
    muted: boolean;
}

interface Evne {
    id: EvneId;
    /** Andel igjen av nedkjølingen (0 = klar) og sekunder igjen. */
    left: number;
    secs: number;
    armed: boolean;
    busy: boolean;
}

interface View {
    slag: number;
    wave: number;
    phase: G['phase'];
    ch: number;
    used: number;
    linje: number;
    hqHp: number;
    forsyninger: number;
    shop: (Kind | null)[];
    holding: number;
    planT: number;
    preview: string;
    evner: Evne[];
    kort: KortId[];
}

function view(g: G): View {
    return {
        slag: g.slag,
        wave: g.wave,
        phase: g.phase,
        ch: channels(g),
        used: usedChannels(g),
        linje: g.linje,
        hqHp: g.hqHp,
        forsyninger: g.forsyninger,
        shop: [...g.shop],
        holding: g.holding,
        planT: g.planT,
        preview: g.phase === 'plan' ? wavePreview(g) : '',
        evner:
            g.phase === 'wave'
                ? evner(g).map((id) => ({
                      id,
                      left: Math.min(1, g.ord.cd[id] / cdOf(g, id)),
                      secs: Math.ceil(g.ord.cd[id]),
                      armed: g.ord.armed === id,
                      // Kompaniet er «opptatt» når det er slått ut og venter.
                      busy: id === 'kompani' ? !squadOf(g) : busy(g, id),
                  }))
                : [],
        kort: [...g.kort],
    };
}

export function Hud({ gRef, act }: { gRef: React.MutableRefObject<G>; act: HudActions }) {
    const [g, setView] = useState<View | null>(null);
    useEffect(() => {
        const tick = () => setView(view(gRef.current));
        tick();
        const id = window.setInterval(tick, 200);
        return () => window.clearInterval(id);
    }, [gRef]);
    if (!g) return null;
    const def = SLAG[g.slag];
    const ch = g.ch;
    const used = g.used;
    const plan = g.phase === 'plan';
    const left = Math.max(0, Math.ceil(PLAN_MAX - g.planT));
    return (
        <>
            <div className="rn-band">
                <div>
                    <div className="rn-place">{def.bånd}</div>
                    <div className="rn-sub">
                        {def.sted} · Bølge {Math.min(g.wave + 1, def.waves.length)} av {def.waves.length} · Slag {g.slag + 1} av {SLAG.length}
                    </div>
                </div>
                <div className="rn-grow" />
                {ch > 0 && (
                    <div className="rn-stat" data-mg-anchor="radio">
                        RADIO {used}/{ch}
                        <div className="rn-pips">
                            {Array.from({ length: ch }, (_, i) => (
                                <div key={i} className={`rn-lamp${i < used ? ' on' : ''}`} />
                            ))}
                        </div>
                    </div>
                )}
                <div className="rn-stat">
                    LINJA
                    <div className="rn-pips">
                        {Array.from({ length: SCORE.linje }, (_, i) => (
                            <div key={i} className={`rn-pip${i < g.linje ? '' : ' off'}`} />
                        ))}
                    </div>
                </div>
                <div className="rn-stat">
                    KOMMANDOVOGN
                    <div className="rn-hq">
                        <div className={g.hqHp < COMBAT.hqHp * 0.35 ? 'lav' : ''} style={{ width: `${Math.max(0, (g.hqHp / COMBAT.hqHp) * 100)}%` }} />
                    </div>
                </div>
                <div className="rn-btns">
                    <button className="rn-btn" onClick={act.mute} aria-label="Lyd av eller på">
                        {act.muted ? 'Lyd av' : 'Lyd'}
                    </button>
                    <button className="rn-btn" onClick={act.pause} aria-label="Pause">
                        <span className="rn-key">Esc</span>Pause
                    </button>
                </div>
            </div>

            <div className="rn-foot">
                {plan ? (
                    <>
                        <div className="rn-money">{g.forsyninger} forsyninger</div>
                        {g.shop.map((k, i) =>
                            k ? (
                                <button key={i} data-mg-anchor={`kort${i}`} className="rn-card" data-on={g.holding === i ? 1 : 0} disabled={UNITS[k].pris > g.forsyninger} onClick={() => act.pick(i)}>
                                    <div className="n">
                                        <span className="rn-key">{i + 1}</span>
                                        {UNITS[k].navn}
                                    </div>
                                    <div className="r">{ROLE[k]}</div>
                                    <div className="p">{UNITS[k].pris}</div>
                                </button>
                            ) : (
                                <div key={i} className="rn-empty" />
                            )
                        )}
                        <div className="rn-side">
                            <button className="rn-btn" disabled={g.forsyninger < ECONOMY.bytt} onClick={act.reroll}>
                                <span className="rn-key">R</span>Nye kort ({ECONOMY.bytt})
                            </button>
                        </div>
                        <div className="rn-grow" />
                        <div className="rn-side" style={{ alignItems: 'flex-end' }}>
                            <div className="rn-info">
                                <b>Neste bølge:</b> {g.preview}
                                {g.kort.length > 0 && (
                                    <div>
                                        <b>Ordrer:</b> {g.kort.map((k) => KORT[k].tittel).join(', ')}
                                    </div>
                                )}
                                {g.planT > PLAN_MAX - 15 && <div style={{ color: '#a3281a', fontWeight: 800 }}>Fienden kommer om {left} s</div>}
                            </div>
                            <button className="rn-btn big" data-mg-anchor="bolge" onClick={act.wave}>
                                <span className="rn-key">Mellomrom</span>BØLGE
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="rn-info rn-short">
                            {ch > 0 ? (
                                <>
                                    <b>Klikk en enhet</b> for å koble den til radioen.
                                </>
                            ) : (
                                <>Enhetene kjemper selv. Styr kompaniet.</>
                            )}
                        </div>
                        <div className="rn-grow" />
                        <div className="rn-evner">
                            {g.evner.map((e) => (
                                <EvneKnapp key={e.id} e={e} onClick={() => act.evne(e.id)} />
                            ))}
                        </div>
                        <button className="rn-pause" data-on={act.paused ? 1 : 0} onClick={act.pause} aria-label="Pause">
                            <span className="ic" aria-hidden>{act.paused ? '▶' : '❚❚'}</span>
                            <span className="rn-key">Mellomrom</span>
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

/** Én ordreknapp: lader seg opp nedenfra, spretter når den er klar, gløder mens den venter. */
function EvneKnapp({ e, onClick }: { e: Evne; onClick: () => void }) {
    const def = EVNER[e.id];
    const ready = e.left <= 0 && !e.busy;
    // Sprett-animasjonen starter av seg selv når data-state går fra «wait» til «ready» (hudData.ts).
    const state = e.armed ? 'armed' : ready ? 'ready' : 'wait';
    const sub = e.armed ? EVNER[e.id].hint : e.busy && e.left <= 0 ? EVNE_TEKST[e.id].busy : !ready ? `Klar om ${e.secs} s` : EVNE_TEKST[e.id].klar;
    return (
        <button className={`rn-evne ${e.id}`} data-state={state} data-mg-anchor={`evne-${e.id}`} onClick={onClick} aria-label={def.navn}>
            <span className="cd" style={{ height: `${e.left * 100}%` }} />
            <span className="top">
                <span className="rn-key">{def.tast}</span>
                <span className="nm">{def.navn}</span>
            </span>
            <span className="sb">{sub}</span>
        </button>
    );
}
