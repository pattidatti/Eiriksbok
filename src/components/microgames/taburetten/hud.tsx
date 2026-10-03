// HUD-en er forsiden av et vittighetsblad: masthode med kalender, flertallsstripa som en rubrikk
// med 114 små figurer, prisrubrikken (poeng og x-multiplikator), neste kandidat i en oval i
// høyre marg, hvem som sitter nede til venstre, og målet og tastene nederst.

import { memo, useMemo } from 'react';
import { ANTIKVA, FARGE, FRAKTUR } from './farger';
import type { HudData } from './hudData';
import type { Figur } from './levels';
import { teksturer } from './teksturer';

const SVERTE = '#221c18';

const bilder = new Map<Figur, string>();
function portrett(f: Figur): string {
    let u = bilder.get(f);
    if (!u) {
        u = teksturer().figurLerret[f].toDataURL();
        bilder.set(f, u);
    }
    return u;
}

const kort: React.CSSProperties = {
    background: 'rgba(244,236,216,0.94)',
    color: SVERTE,
    border: `3px solid ${SVERTE}`,
    boxShadow: `4px 4px 0 ${SVERTE}`,
    fontFamily: ANTIKVA,
};

/** Stripa: 114 små tresnitt-figurer, håndkolorert, med midtstreken ved 58. */
const Stripe = memo(function Stripe({ rødt }: { rødt: number }) {
    const figurer = useMemo(
        () =>
            Array.from({ length: 114 }, (_, i) => {
                const x = i * 10 + 5;
                const f = i < rødt ? FARGE.rød : FARGE.blå;
                return (
                    <g key={i}>
                        <rect x={x - 3.4} y={14} width={6.8} height={20} rx={2} fill={f} />
                        <circle cx={x} cy={9} r={4.2} fill={f} stroke={SVERTE} strokeWidth={1.4} />
                        <rect
                            x={x - 3.4}
                            y={14}
                            width={6.8}
                            height={20}
                            rx={2}
                            fill="none"
                            stroke={SVERTE}
                            strokeWidth={1.4}
                        />
                    </g>
                );
            }),
        [rødt]
    );
    return (
        <svg viewBox="0 0 1140 38" style={{ width: '100%', height: 30, display: 'block' }}>
            {figurer}
            <line x1={575} x2={575} y1={0} y2={38} stroke={SVERTE} strokeWidth={4} />
        </svg>
    );
});

const Tast = ({ children }: { children: React.ReactNode }) => (
    <kbd
        style={{
            display: 'inline-block',
            minWidth: 26,
            padding: '1px 8px',
            margin: '0 4px',
            border: `2px solid ${SVERTE}`,
            borderBottomWidth: 4,
            background: '#fffaf0',
            fontFamily: ANTIKVA,
            fontSize: 15,
            fontWeight: 700,
            lineHeight: '20px',
        }}
    >
        {children}
    </kbd>
);

const STATUS: Record<HudData['bæres'], string> = {
    flertall: 'Flertallet bærer deg',
    vern: 'Kongens vern bærer deg',
    mellom: 'Livgarden slipper - synker!',
    synk: 'Uten flertall - synker!',
};

export function Hud({
    d,
    onBytt,
    onAnklag,
    knapper,
}: {
    d: HudData;
    onBytt: () => void;
    onAnklag: () => void;
    knapper: React.ReactNode;
}) {
    const blått = 114 - d.rødt;
    const flertall = d.rødt >= 58 ? 'rød' : 'blå';
    return (
        <>
            {/* Skraveringen kryper inn fra kantene når stolen synker. */}
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    opacity: d.fare * 0.85,
                    transition: 'opacity 0.3s',
                    backgroundImage:
                        'repeating-linear-gradient(45deg, rgba(34,28,24,0.75) 0 2px, transparent 2px 7px), repeating-linear-gradient(-40deg, rgba(34,28,24,0.6) 0 2px, transparent 2px 9px)',
                    WebkitMaskImage:
                        'radial-gradient(ellipse 70% 62% at 50% 45%, transparent 55%, black 100%)',
                    maskImage:
                        'radial-gradient(ellipse 70% 62% at 50% 45%, transparent 55%, black 100%)',
                }}
            />
            {/* Masthodet */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(236,224,196,0.95)',
                    borderBottom: `4px double ${SVERTE}`,
                    padding: '4px 16px 6px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    fontFamily: ANTIKVA,
                    color: SVERTE,
                }}
            >
                <style>
                    {
                        '@keyframes tabPop{0%{transform:scale(1.7)}55%{transform:scale(0.9)}100%{transform:scale(1)}}'
                    }
                </style>
                <div style={{ pointerEvents: 'auto', display: 'flex', gap: 8 }}>{knapper}</div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: FRAKTUR, fontSize: 34, lineHeight: 1 }}>
                        Taburetten
                    </div>
                    <div
                        data-mg-anchor="kalender"
                        style={{
                            fontSize: 16,
                            fontWeight: 700,
                            letterSpacing: 1,
                            color: d.nedtelling ? FARGE.rød : SVERTE,
                        }}
                    >
                        {d.nedtelling ?? `No. ${d.fri ? 1884 + d.friNr * 3 : 1884} - ${d.kalender}`}
                    </div>
                </div>
                <div style={{ justifySelf: 'end', textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>POENG</div>
                    <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                        {d.poeng.toLocaleString('nb-NO')}
                        <span
                            key={d.mult}
                            style={{
                                display: 'inline-block',
                                animation: 'tabPop 0.35s ease-out',
                                marginLeft: 10,
                                padding: '0 8px',
                                background: d.mult > 1 ? FARGE.gull : 'transparent',
                                border: `2px solid ${SVERTE}`,
                            }}
                        >
                            x{d.mult}
                        </span>
                    </div>
                </div>
            </div>

            {/* Flertallsstripa: Stortinget */}
            <div
                data-mg-anchor="stripa"
                style={{
                    position: 'absolute',
                    top: 74,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(640px, 62%)',
                    ...kort,
                    padding: '4px 10px 6px',
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 16,
                        fontWeight: 800,
                    }}
                >
                    <span style={{ color: FARGE.rød }}>{d.rødt} Venstre (rødt)</span>
                    <span style={{ fontSize: 14 }}>
                        Stortinget - flertall: 58 · {flertall === 'rød' ? 'rødt' : 'blått'} har det
                    </span>
                    <span style={{ color: FARGE.blå }}>{blått} Høyre (blått)</span>
                </div>
                <Stripe rødt={d.rødt} />
            </div>

            {/* Neste kandidat i høyre marg: farge og flertall kan leses FØR eleven trykker. */}
            {d.neste && (
                <div
                    style={{
                        position: 'absolute',
                        right: 14,
                        top: 140,
                        width: 196,
                        ...kort,
                        border: `4px solid ${FARGE[d.neste.farge]}`,
                        padding: 8,
                        textAlign: 'center',
                        pointerEvents: 'none',
                        transform: d.perfektNå ? 'scale(1.1) rotate(-2deg)' : 'none',
                        transition: 'transform 0.12s',
                    }}
                >
                    <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 2 }}>
                        {d.kanBytte ? 'HOPPER OPP NÅ' : `KOMMER OM ${d.neste.om} s`}
                    </div>
                    <div
                        style={{
                            width: 120,
                            height: 136,
                            margin: '4px auto',
                            borderRadius: '50%',
                            border: `6px solid ${FARGE[d.neste.farge]}`,
                            overflow: 'hidden',
                            background: '#fffaf0',
                        }}
                    >
                        <img
                            src={portrett(d.neste.figur)}
                            alt=""
                            style={{ width: 138, marginLeft: -12, marginTop: -6 }}
                        />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: FARGE[d.neste.farge] }}>
                        {d.neste.navn} ({d.neste.farge === 'rød' ? 'Venstre' : 'Høyre'})
                    </div>
                    <div
                        style={{
                            marginTop: 4,
                            padding: '4px 6px',
                            fontSize: 18,
                            fontWeight: 800,
                            color: d.neste.har ? SVERTE : '#fffaf0',
                            background: d.neste.har ? FARGE.gull : SVERTE,
                            border: `2px solid ${SVERTE}`,
                        }}
                    >
                        {d.neste.har
                            ? `✓ FLERTALL: ${d.neste.seter} av 114`
                            : `✗ BARE ${d.neste.seter} av 114`}
                    </div>
                </div>
            )}

            {/* Hvem sitter */}
            <div
                style={{
                    position: 'absolute',
                    left: 14,
                    bottom: 14,
                    ...kort,
                    padding: '6px 12px 6px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        width: 52,
                        height: 60,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: `3px solid ${FARGE[d.stolFarge]}`,
                        background: '#fffaf0',
                    }}
                >
                    <img
                        src={portrett(d.stolFigur)}
                        alt=""
                        style={{ width: 62, marginLeft: -6, marginTop: -3 }}
                    />
                </div>
                <div>
                    <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>I STOLEN</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: FARGE[d.stolFarge] }}>
                        {d.stol}
                    </div>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: d.fare > 0 ? FARGE.rød : SVERTE,
                        }}
                    >
                        {STATUS[d.bæres]}
                    </div>
                </div>
            </div>

            {/* Målet og tastene */}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 14,
                    transform: 'translateX(-50%)',
                    ...kort,
                    padding: '5px 14px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    fontSize: 16,
                }}
            >
                <div style={{ fontWeight: 800 }}>{d.mål}</div>
                <div style={{ marginTop: 3 }}>
                    Len: <Tast>Hold mus</Tast>/<Tast>↓</Tast>
                    {d.anklag.synlig ? (
                        <>
                            {' '}
                            · Anklag: <Tast>A</Tast>
                        </>
                    ) : (
                        <>
                            {' '}
                            · Bytt: <Tast>Mellomrom</Tast>
                        </>
                    )}
                </div>
            </div>

            {d.anklag.synlig && (
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onAnklag();
                    }}
                    style={{
                        position: 'absolute',
                        right: 14,
                        bottom: 14,
                        ...kort,
                        fontSize: 24,
                        fontWeight: 800,
                        padding: '8px 18px',
                        cursor: 'pointer',
                        color: d.anklag.virker ? '#fffaf0' : SVERTE,
                        background: d.anklag.virker ? FARGE.rød : '#d8cdb2',
                        opacity: d.anklag.virker ? 1 : 0.8,
                        animation: d.anklag.virker ? 'tabPuls 0.8s ease-in-out infinite' : 'none',
                        lineHeight: 1.1,
                    }}
                >
                    Anklag! <Tast>A</Tast>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {d.anklag.virker
                            ? `+${d.anklag.bonus} - vent = mer, men gapene vokser`
                            : 'Venstre trenger over 60 %'}
                    </div>
                </button>
            )}
            {(d.kanBytte || d.neste) && (
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onBytt();
                    }}
                    style={{
                        position: 'absolute',
                        right: 14,
                        bottom: 14,
                        ...kort,
                        fontSize: d.perfektNå ? 30 : 24,
                        fontWeight: 800,
                        padding: '10px 22px',
                        cursor: 'pointer',
                        color: d.kanBytte && d.neste && !d.perfektNå ? '#fffaf0' : SVERTE,
                        background: d.perfektNå
                            ? FARGE.gull
                            : d.kanBytte && d.neste
                              ? FARGE[d.neste.farge]
                              : '#d8cdb2',
                        opacity: d.kanBytte ? 1 : 0.65,
                        transform: d.perfektNå ? 'scale(1.15)' : 'none',
                        transition: 'transform 0.1s',
                    }}
                >
                    {d.neste ? `Bytt til ${d.neste.navn}` : 'Bytt'} <Tast>Mellomrom</Tast>
                </button>
            )}
            <style>
                {'@keyframes tabPuls{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}'}
            </style>
        </>
    );
}
