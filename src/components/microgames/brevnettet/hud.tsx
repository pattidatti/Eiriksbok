// HUD-en i Brevnettet er veven og stua, ikke et instrumentpanel:
// - oppe til venstre: årene fram til 1814 som vevde ruter (målet),
// - til høyre: nøstene som henger på en knagg, med tallet i trappeskrift,
// - nede til venstre: hvor mange stuer som lyser, og rekorden,
// - nede til høyre: de tre kljåsteinene som faller én etter én når en stue gir opp.
// Den leser spillet ti ganger i sekundet og endrer DOM-en direkte (ingen setState).

import { useEffect, useRef } from 'react';
import { BRETT } from './levels';
import { tente, visÅr, type Game } from './game';
import { FARGE } from './view';
import { TUNING } from './tuning';
import { tegnTrappBilde } from './trappeskrift';

const FØRST = BRETT[0].år;
const ÅR = 1814 - FØRST + 1;
const NØSTEFARGER = [FARGE.indigo, FARGE.rød, FARGE.gul, FARGE.ull];

const tekst: React.CSSProperties = {
    fontFamily: "'Alegreya Sans', Georgia, serif",
    fontWeight: 800,
    color: FARGE.ull,
    textShadow: `0 2px 0 ${FARGE.vegg}, 0 0 6px ${FARGE.vegg}`,
    letterSpacing: '0.04em',
};

const nøste = (farge: string): React.CSSProperties => ({
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: `repeating-linear-gradient(35deg, ${farge} 0 4px, rgba(0,0,0,0.28) 4px 6px), ${farge}`,
    boxShadow: `inset -4px -5px 0 rgba(0,0,0,0.3), 0 2px 0 ${FARGE.vegg}`,
    transition: 'transform .25s, opacity .25s',
});

const stein: React.CSSProperties = {
    width: 26,
    height: 34,
    borderRadius: '45% 45% 40% 40%',
    background: 'radial-gradient(circle at 40% 30%, #8d8478, #4f4840 70%)',
    boxShadow: `0 3px 0 ${FARGE.vegg}`,
    position: 'relative',
    transition: 'transform .5s cubic-bezier(.5,0,.9,.6), opacity .5s',
};

export function Hud({
    gRef,
    synlig,
    rekord,
}: {
    gRef: React.MutableRefObject<Game>;
    synlig: boolean;
    rekord: number;
}) {
    const år = useRef<(HTMLDivElement | null)[]>([]);
    const nøster = useRef<(HTMLDivElement | null)[]>([]);
    const steiner = useRef<(HTMLDivElement | null)[]>([]);
    const nøsteTall = useRef<HTMLImageElement>(null);
    const lysTall = useRef<HTMLImageElement>(null);
    useEffect(() => {
        const sist = { år: -1, nøster: -1, lys: -1, steiner: -1 };
        const oppdater = () => {
            const g = gRef.current;
            const a = visÅr(g);
            if (a !== sist.år) {
                sist.år = a;
                år.current.forEach((el, i) => {
                    if (!el) return;
                    const y = FØRST + i;
                    el.style.background =
                        y < a ? FARGE.gul : y === a ? FARGE.ull : 'rgba(122,100,80,0.55)';
                    el.style.transform = y === a ? 'scale(1.3)' : 'scale(1)';
                    el.style.boxShadow = y >= 1804 ? `inset 0 -3px 0 ${FARGE.rød}` : 'none';
                });
            }
            if (g.nøster !== sist.nøster) {
                sist.nøster = g.nøster;
                nøster.current.forEach((el, i) => {
                    if (!el) return;
                    const vis = i < g.nøster;
                    el.style.opacity = vis ? '1' : '0';
                    el.style.transform = vis ? 'translateY(0)' : 'translateY(-14px)';
                });
                if (nøsteTall.current)
                    tegnTrappBilde(
                        nøsteTall.current,
                        String(g.nøster),
                        5,
                        g.nøster ? FARGE.gul : '#ff6a55'
                    );
            }
            const n = tente(g).length;
            if (n !== sist.lys) {
                sist.lys = n;
                if (lysTall.current) tegnTrappBilde(lysTall.current, String(n), 6, FARGE.gul);
            }
            if (g.steiner !== sist.steiner) {
                sist.steiner = g.steiner;
                steiner.current.forEach((el, i) => {
                    if (!el) return;
                    const falt = i >= TUNING.ring.steiner - g.steiner;
                    el.style.transform = falt ? 'translateY(70px) rotate(25deg)' : 'none';
                    el.style.opacity = falt ? '0.15' : '1';
                });
            }
        };
        oppdater();
        const id = window.setInterval(oppdater, 100);
        return () => window.clearInterval(id);
    }, [gRef]);

    return (
        <div
            style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                opacity: synlig ? 1 : 0,
                transition: 'opacity .3s',
            }}
        >
            {/* Målet: årene fram til 1814 som vevde ruter. Røde trinn = fengselsårene. */}
            <div style={{ ...tekst, position: 'absolute', left: 16, top: 12 }}>
                <div style={{ fontSize: 15, marginBottom: 6 }}>Hold lyset tent til 1814</div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {Array.from({ length: ÅR }, (_, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                år.current[i] = el;
                            }}
                            style={{
                                position: 'relative',
                                width: 11,
                                height: 11,
                                transform: 'scale(1)',
                                transition: 'transform .3s, background .3s',
                                outline: `1px solid ${FARGE.vegg}`,
                            }}
                        >
                            {FØRST + i === 1804 && (
                                // Merket for den store arrestasjonen: der tar lensmannen Hauge for godt.
                                <span
                                    style={{
                                        position: 'absolute',
                                        left: -3,
                                        top: 14,
                                        fontSize: 14,
                                        whiteSpace: 'nowrap',
                                        color: '#ff8a70',
                                        borderLeft: `2px solid ${FARGE.rød}`,
                                        paddingLeft: 3,
                                    }}
                                >
                                    1804 Hauge tas
                                </span>
                            )}
                        </div>
                    ))}
                    <span style={{ fontSize: 15, marginLeft: 6, color: FARGE.gul }}>1814</span>
                </div>
            </div>

            {/* Knaggen med nøstene: ett nøste per tråd du kan dra. */}
            <div
                style={{
                    ...tekst,
                    position: 'absolute',
                    right: 18,
                    top: 58,
                    width: 74,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        width: 74,
                        height: 9,
                        borderRadius: 4,
                        background: '#6b4a2e',
                        boxShadow: `0 2px 0 ${FARGE.vegg}`,
                    }}
                />
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 26px)',
                        gap: 4,
                        marginTop: 4,
                        minHeight: Math.ceil(TUNING.nøsterTak / 2) * 30,
                    }}
                >
                    {Array.from({ length: TUNING.nøsterTak }, (_, i) => (
                        <div
                            key={i}
                            ref={(el) => {
                                nøster.current[i] = el;
                            }}
                            style={nøste(NØSTEFARGER[i % NØSTEFARGER.length])}
                        />
                    ))}
                </div>
                <img ref={nøsteTall} alt="" style={{ marginTop: 6 }} />
                <div style={{ fontSize: 15 }}>nøster</div>
            </div>

            {/* Lysmåleren: stuer som lyser nå, og rekorden. */}
            <div
                style={{
                    ...tekst,
                    position: 'absolute',
                    left: 16,
                    bottom: 12,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 10,
                }}
            >
                <img ref={lysTall} alt="" />
                <div>
                    <div style={{ fontSize: 17 }}>stuer lyser</div>
                    {rekord > 0 && (
                        <div style={{ fontSize: 14, color: FARGE.gul }}>rekord {rekord}</div>
                    )}
                </div>
            </div>

            {/* Kljåsteinene: tre stuer kan gi opp før veven faller. */}
            <div
                style={{
                    ...tekst,
                    position: 'absolute',
                    right: 18,
                    bottom: 12,
                    textAlign: 'center',
                }}
            >
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {Array.from({ length: TUNING.ring.steiner }, (_, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ width: 2, height: 14, background: FARGE.ull }} />
                            <div
                                ref={(el) => {
                                    steiner.current[i] = el;
                                }}
                                style={stein}
                            />
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                    mørke stuer som kan gi opp
                </div>
            </div>
        </div>
    );
}

/** Et tall som teller opp fra 0 og spretter når det er framme (sluttskjermen). */
export function Tell({ verdi, sek = 0.9 }: { verdi: number; sek?: number }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const t0 = performance.now();
        let id = 0;
        const steg = () => {
            const k = Math.min(1, (performance.now() - t0) / (sek * 1000));
            const e = 1 - (1 - k) ** 3;
            el.textContent = Math.round(verdi * e).toLocaleString('nb-NO');
            el.style.transform = k >= 1 ? 'scale(1.25)' : 'scale(1)';
            if (k < 1) id = requestAnimationFrame(steg);
            else window.setTimeout(() => el && (el.style.transform = 'scale(1)'), 160);
        };
        id = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(id);
    }, [verdi, sek]);
    return (
        <span
            ref={ref}
            style={{ display: 'inline-block', transition: 'transform .16s ease-out' }}
        >
            0
        </span>
    );
}

/** Tittelen i menyen, i trappeskrift. */
export function TrappLogo({ tekst: t, celle = 6 }: { tekst: string; celle?: number }) {
    const ref = useRef<HTMLImageElement>(null);
    useEffect(() => {
        if (ref.current) tegnTrappBilde(ref.current, t, celle, FARGE.gul);
    }, [t, celle]);
    return <img ref={ref} alt={t} style={{ display: 'block', margin: '6px auto' }} />;
}
