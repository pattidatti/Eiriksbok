// HUD-en i gråboksen: kartusjen øverst (måned og bygd), klagebrevet til høyre (navnene) og
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
    navn: number;
    dristige: number;
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
        sted: nær ? `${nær.navn} ${Math.floor(nær.samlet)}/${T.tun.seglVed}` : b.tittel,
        kalender: b.visKalender ? månedAndel(g) : null,
        navn: g.navn,
        dristige: g.dristige,
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
    }));

    return (
        <>
            {/* Kartusjen: måned og bygd */}
            <div
                style={{
                    position: 'absolute',
                    top: 8,
                    left: '50%',
                    marginLeft: -160,
                    width: 320,
                    padding: '6px 10px 8px',
                    background: FARGE.grunn,
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
                {v.kalender !== null && (
                    <div style={{ height: 6, marginTop: 4, background: '#0b1a19', borderRadius: 3 }}>
                        <div
                            style={{
                                height: 6,
                                width: `${Math.round(v.kalender * 100)}%`,
                                background: FARGE.kalk,
                                borderRadius: 3,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Klagebrevet: navnene */}
            <div
                style={{
                    position: 'absolute',
                    right: 10,
                    top: 90,
                    width: 92,
                    padding: '8px 6px',
                    background: FARGE.kalk,
                    color: FARGE.blekk,
                    border: `2px solid ${FARGE.blekk}`,
                    textAlign: 'center',
                    fontFamily: 'Georgia, serif',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ fontSize: 14, fontWeight: 700 }}>Klagen</div>
                <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1 }}>{v.navn}</div>
                <div style={{ fontSize: 14 }}>navn</div>
                {v.dristige > 0 && (
                    <div style={{ fontSize: 14, color: '#8a5a10', fontWeight: 700 }}>
                        {v.dristige} dristige
                    </div>
                )}
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
                    background: FARGE.blod,
                    border: `2px solid ${FARGE.blekk}`,
                    color: FARGE.kalk,
                    fontFamily: 'Georgia, serif',
                    fontSize: 15,
                    pointerEvents: 'none',
                }}
            >
                <span style={{ fontWeight: 700 }}>Agder</span>
                {plasser.map((p, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {i === T.kommisjon.segl - T.kommisjon.telemark && (
                            <span style={{ fontWeight: 700 }}>Telemark</span>
                        )}
                        <span
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                border: `2px solid ${FARGE.kalk}`,
                                background: p.fylt ? FARGE.kalk : 'transparent',
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
