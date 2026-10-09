// HUD-en i gråboksen: frosten (kalenderen), kartusjen øverst (måned og bygd) og
// kommisjonsmåleren nederst (8 segl, minst 2 fra Telemark). Egen tilstand på 10 Hz, så
// 3D-treet aldri tegnes på nytt for HUD-ens skyld.

import { useEffect, useState } from 'react';
import { brettAv, månedAndel, utÅpen, type Game } from './game';
import { månedNavn } from './levels';
import { dist } from './rules';
import { TUNING } from './tuning';
import { FARGE } from './palette';

const T = TUNING;

interface Visning {
    måned: string;
    sted: string;
    kalender: number | null;
    segl: number;
    telemark: number;
    ut: boolean;
}

function les(g: Game): Visning {
    const b = brettAv(g);
    const h = g.hest;
    const nær = g.tun.find((t) => dist(h.x, h.z, t.x, t.z) < T.tun.radius + 3);
    return {
        måned: månedNavn(g.brett, månedAndel(g)),
        sted: nær ? `${nær.navn}${nær.telemark ? ' (Telemark)' : ''}` : b.tittel,
        kalender: b.visKalender ? månedAndel(g) : null,
        segl: g.segl,
        telemark: g.seglTelemark,
        ut: utÅpen(g),
    };
}

const same = (a: Visning, b: Visning) =>
    (Object.keys(a) as (keyof Visning)[]).every((k) => a[k] === b[k]);

export function Hud({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    const [v, setV] = useState<Visning | null>(null);
    useEffect(() => {
        const tick = () => {
            const n = les(gRef.current);
            setV((o) => (o && same(o, n) ? o : n));
        };
        const id = window.setInterval(tick, 100);
        return () => window.clearInterval(id);
    }, [gRef]);
    if (!v) return null;

    const agder = v.segl - v.telemark;
    // Segl fra Agder fylles fra venstre, segl fra Telemark fra høyre.
    const plasser = Array.from({ length: T.kommisjon.segl }, (_, i) => ({
        fylt: i < agder || i >= T.kommisjon.segl - v.telemark,
        farge: i >= T.kommisjon.segl - T.kommisjon.telemark ? FARGE.telemark : FARGE.blod,
    }));
    // Kalenderen er frost: den kryper inn fra kantene av bildet mens måneden går.
    const frost = v.kalender === null ? 0 : Math.round(v.kalender * 20) / 20;

    return (
        <>
            {frost > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        boxShadow: `inset 0 0 ${30 + 110 * frost}px ${8 + 50 * frost}px rgba(236, 246, 255, ${0.35 + 0.55 * frost})`,
                    }}
                />
            )}
            {/* Kartusjen: måned og bygd */}
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    marginLeft: -160,
                    width: 320,
                    padding: '6px 10px 8px',
                    background: FARGE.panel,
                    border: `2px solid ${FARGE.kalk}`,
                    borderRadius: 14,
                    color: FARGE.kalk,
                    textAlign: 'center',
                    fontFamily: 'Georgia, serif',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1 }}>
                    {v.måned} - ANNO 1786
                </div>
                <div style={{ fontSize: 16 }}>{v.sted}</div>
            </div>

            {/* Kommisjonsmåleren: 8 segl, de to siste fra Telemark */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: FARGE.kalk,
                    border: `2px solid ${FARGE.blekk}`,
                    color: FARGE.blekk,
                    fontFamily: 'Georgia, serif',
                    fontSize: 15,
                    pointerEvents: 'none',
                }}
            >
                <span style={{ fontWeight: 700, color: FARGE.blod }}>Agder</span>
                {plasser.map((p, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {i === T.kommisjon.segl - T.kommisjon.telemark && (
                            <span style={{ fontWeight: 700, color: FARGE.telemark }}>Telemark</span>
                        )}
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                border: `3px solid ${p.farge}`,
                                background: p.fylt ? p.farge : 'transparent',
                                display: 'inline-block',
                            }}
                        />
                    </span>
                ))}
                <span style={{ fontWeight: 700, marginLeft: 6 }}>→ København</span>
            </div>

            {v.ut && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 56,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: FARGE.kalk,
                        fontFamily: 'Georgia, serif',
                        fontSize: 16,
                        fontWeight: 700,
                        textShadow: `0 1px 3px ${FARGE.blekk}`,
                        pointerEvents: 'none',
                    }}
                >
                    Alle bygdene har segl - ri ut ved stolpen
                </div>
            )}
        </>
    );
}
