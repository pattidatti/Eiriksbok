// HUD-en er rosemalingen og klagebrevet:
// - øverst i midten en malt kartusj som på et kistelokk (måned, ANNO 1786, bygda du er i),
//   med kalenderen som en ranke som males fram langs kanten, og frost som kryper inn fra kantene,
// - til høyre klagebrevet, der hvert navn skrives inn som en blekkstrek (gylne for dristige),
//   og tre rader for klagene (gebyrene, kornmonopolet, handelsretten) som fylles med segl,
// - nederst kommisjonsmåleren: et rødt bånd med 8 segl (Agder og Telemark) mot København.
// Egen tilstand på 10 Hz, så 3D-treet aldri tegnes på nytt for HUD-ens skyld.

import { useEffect, useRef, useState } from 'react';
import { brettAv, månedAndel, type Game } from './game';
import { KLAGER, KLAGE_NAVN, månedNavn, type Klage } from './levels';
import { dist } from './rules';
import { TUNING } from './tuning';
import { FARGE } from './palette';
import { klageBilde, TEKST_FONT, TITTEL_FONT } from './textures';

const T = TUNING;

interface Visning {
    måned: string;
    sted: string;
    telemarkSted: boolean;
    kalender: number | null;
    segl: number;
    telemark: number;
    gebyr: number;
    korn: number;
    handel: number;
}

function les(g: Game): Visning {
    const b = brettAv(g);
    const h = g.hest;
    const nær = g.tun.find((t) => dist(h.x, h.z, t.x, t.z) < T.tun.radius + 3);
    return {
        måned: månedNavn(g.brett, månedAndel(g)),
        sted: nær ? nær.navn : b.tittel,
        telemarkSted: nær ? nær.telemark : b.bygder.some((t) => t.telemark),
        kalender: b.visKalender ? Math.round(månedAndel(g) * 40) / 40 : null,
        segl: g.segl,
        telemark: g.seglTelemark,
        gebyr: g.klager.gebyr,
        korn: g.klager.korn,
        handel: g.klager.handel,
    };
}

const same = (a: Visning, b: Visning) =>
    (Object.keys(a) as (keyof Visning)[]).every((k) => a[k] === b[k]);

const STIL = `
@keyframes ur-stempel {
  0% { transform: scale(2.6) rotate(-20deg); opacity: 0; }
  55% { transform: scale(0.82) rotate(4deg); opacity: 1; }
  75% { transform: scale(1.12) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); }
}
@keyframes ur-dunk {
  0% { transform: translateY(0); }
  30% { transform: translateY(3px); }
  100% { transform: translateY(0); }
}
`;

/** En akantusranke som SVG, til kartusjen og båndet. */
function Ranke({ speil, farge }: { speil?: boolean; farge: string }) {
    return (
        <svg
            width="54"
            height="40"
            viewBox="0 0 54 40"
            style={{ transform: speil ? 'scaleX(-1)' : undefined, flex: 'none' }}
            aria-hidden
        >
            <path
                d="M52 20 C40 4, 26 36, 12 20 C6 13, 10 5, 17 8 C22 10, 20 17, 15 16"
                fill="none"
                stroke={farge}
                strokeWidth="4"
                strokeLinecap="round"
            />
            <path
                d="M38 15 C34 6, 26 6, 28 13"
                fill="none"
                stroke={FARGE.gull}
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M48 19 C40 9, 30 30, 16 19"
                fill="none"
                stroke={FARGE.kalk}
                strokeWidth="1.4"
                opacity="0.7"
            />
        </svg>
    );
}

export function Hud({ gRef }: { gRef: React.MutableRefObject<Game> }) {
    const [v, setV] = useState<Visning | null>(null);
    useEffect(() => {
        const tick = () => {
            const n = les(gRef.current);
            setV((o) => (o && same(o, n) ? o : n));
        };
        tick();
        const id = window.setInterval(tick, 100);
        return () => window.clearInterval(id);
    }, [gRef]);
    if (!v) return null;

    const agder = v.segl - v.telemark;
    const plasser = Array.from({ length: T.kommisjon.segl }, (_, i) => {
        const tm = i >= T.kommisjon.segl - T.kommisjon.telemark;
        // Segl fra Agder fylles fra venstre, segl fra Telemark fra høyre (og over i Agder-plassene).
        const fylt = i < agder || i >= T.kommisjon.segl - v.telemark;
        const fraTelemark = i >= T.kommisjon.segl - v.telemark;
        return {
            tm,
            fylt,
            farge: fylt
                ? fraTelemark
                    ? FARGE.telemark
                    : FARGE.blod
                : tm
                  ? FARGE.telemark
                  : FARGE.blod,
        };
    });
    const frost = v.kalender ?? 0;

    return (
        <>
            <style>{STIL}</style>
            {frost > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        pointerEvents: 'none',
                        boxShadow: `inset 0 0 ${30 + 120 * frost}px ${6 + 46 * frost}px rgba(226, 238, 250, ${0.25 + 0.6 * frost})`,
                    }}
                />
            )}

            {/* Kartusjen: måned, år og bygd, med kalender-ranken langs underkanten */}
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    pointerEvents: 'none',
                }}
            >
                <Ranke farge={FARGE.skogLys} />
                <div
                    style={{
                        position: 'relative',
                        minWidth: 300,
                        padding: '6px 26px 12px',
                        background: FARGE.panel,
                        border: `3px solid ${FARGE.kalk}`,
                        outline: `2px solid ${v.telemarkSted ? FARGE.telemark : FARGE.blod}`,
                        outlineOffset: 3,
                        borderRadius: '40px / 26px',
                        color: FARGE.kalk,
                        textAlign: 'center',
                        boxShadow: '0 4px 14px rgba(0,0,0,.35)',
                    }}
                >
                    <div
                        style={{
                            fontFamily: TITTEL_FONT,
                            fontSize: 28,
                            lineHeight: 1.05,
                            letterSpacing: 1,
                        }}
                    >
                        {v.måned.charAt(0) + v.måned.slice(1).toLowerCase()} · Anno 1786
                    </div>
                    <div
                        style={{
                            fontFamily: TEKST_FONT,
                            fontSize: 18,
                            fontWeight: 700,
                            color: v.telemarkSted ? FARGE.telemarkLys : FARGE.gull,
                        }}
                    >
                        {v.sted}
                        {v.telemarkSted ? ' · Telemark' : ' · Agder'}
                    </div>
                    {v.kalender !== null && (
                        <div
                            style={{
                                position: 'absolute',
                                left: 22,
                                right: 22,
                                bottom: 4,
                                height: 5,
                                borderRadius: 3,
                                background: 'rgba(241,231,204,.18)',
                            }}
                        >
                            <div
                                style={{
                                    width: `${v.kalender * 100}%`,
                                    height: '100%',
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${FARGE.gull}, #dfeefa)`,
                                }}
                            />
                        </div>
                    )}
                </div>
                <Ranke speil farge={FARGE.skogLys} />
            </div>

            <Klagebrev gRef={gRef} klager={{ gebyr: v.gebyr, korn: v.korn, handel: v.handel }} />

            {/* Kommisjonsmåleren: et rødt bånd med 8 segl mot København */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    pointerEvents: 'none',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        fontFamily: TEKST_FONT,
                        fontSize: 16,
                        fontWeight: 700,
                        color: FARGE.kalk,
                        textShadow: `0 1px 3px ${FARGE.blekk}, 0 0 8px ${FARGE.blekk}`,
                        marginBottom: 3,
                    }}
                >
                    8 segl, minst 2 fra Telemark: da må København lytte
                </div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '6px 34px 6px 18px',
                        background: `linear-gradient(180deg, ${FARGE.blodLys}, ${FARGE.blod} 60%, #7a221c)`,
                        clipPath:
                            'polygon(0 0, 100% 0, calc(100% - 18px) 50%, 100% 100%, 0 100%, 14px 50%)',
                        color: FARGE.kalk,
                        fontFamily: TEKST_FONT,
                        fontSize: 16,
                        fontWeight: 700,
                    }}
                >
                    <span style={{ marginLeft: 6 }}>Agder</span>
                    {plasser.map((p, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            {i === T.kommisjon.segl - T.kommisjon.telemark && (
                                <span style={{ color: '#e7dcff' }}>Telemark</span>
                            )}
                            <span
                                key={p.fylt ? 'fylt' : 'tom'}
                                style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    display: 'inline-block',
                                    border: p.fylt
                                        ? `2px solid ${FARGE.blekk}`
                                        : `2px dashed ${p.tm ? '#d9c8ff' : FARGE.kalk}`,
                                    background: p.fylt
                                        ? `radial-gradient(circle at 38% 34%, ${p.farge === FARGE.blod ? FARGE.blodLys : FARGE.telemarkLys}, ${p.farge} 62%)`
                                        : 'rgba(0,0,0,.18)',
                                    boxShadow: p.fylt ? '0 2px 4px rgba(0,0,0,.45)' : 'none',
                                    animation: p.fylt
                                        ? 'ur-stempel .5s cubic-bezier(.2,.8,.3,1.2)'
                                        : undefined,
                                    textAlign: 'center',
                                    lineHeight: '26px',
                                    fontFamily: TITTEL_FONT,
                                    fontSize: 18,
                                    color: '#f6d3c8',
                                }}
                            >
                                {p.fylt ? 'L' : ''}
                            </span>
                        </span>
                    ))}
                    <span style={{ fontFamily: TITTEL_FONT, fontSize: 22, marginLeft: 6 }}>
                        København
                    </span>
                </div>
            </div>
        </>
    );
}

const BREV_W = 156;
const BREV_H = 84;

/** Én rad i klagebrevet: ikonet, navnet på klagen og ett lite segl per bygd som har klaget. */
function KlageRad({ k, n }: { k: Klage; n: number }) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                opacity: n > 0 ? 1 : 0.55,
                textAlign: 'left',
            }}
        >
            <img
                key={n > 0 ? 'fylt' : 'tom'}
                src={klageBilde(k)}
                alt=""
                width={30}
                height={30}
                style={{
                    flex: 'none',
                    filter: n > 0 ? 'none' : 'grayscale(1)',
                    animation: n > 0 ? 'ur-stempel .5s cubic-bezier(.2,.8,.3,1.2)' : undefined,
                }}
            />
            <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: TEKST_FONT, fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>
                    {KLAGE_NAVN[k]}
                </div>
                <div style={{ display: 'flex', gap: 3, marginTop: 2, height: 13 }}>
                    {n === 0 ? (
                        <span
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                border: `1.5px dashed ${FARGE.blekk}`,
                            }}
                        />
                    ) : (
                        Array.from({ length: n }, (_, i) => (
                            <span
                                key={i}
                                style={{
                                    width: 13,
                                    height: 13,
                                    borderRadius: 7,
                                    background: `radial-gradient(circle at 38% 34%, ${FARGE.blodLys}, ${FARGE.blod} 62%)`,
                                    border: `1px solid ${FARGE.blekk}`,
                                    animation: 'ur-stempel .5s cubic-bezier(.2,.8,.3,1.2)',
                                }}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/** Klagebrevet til høyre: hvert navn blir en blekkstrek (tegnes bit for bit, aldri på nytt),
 *  og hvert segl fyller raden for klagen bygda hadde. Poengene teller opp og spretter. */
function Klagebrev({
    gRef,
    klager,
}: {
    gRef: React.MutableRefObject<Game>;
    klager: Record<Klage, number>;
}) {
    const lerret = useRef<HTMLCanvasElement>(null);
    const tall = useRef<HTMLDivElement>(null);
    const poeng = useRef<HTMLDivElement>(null);
    const ark = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const c = lerret.current;
        if (!c) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        c.width = BREV_W * dpr;
        c.height = BREV_H * dpr;
        const ctx = c.getContext('2d')!;
        ctx.scale(dpr, dpr);
        let tegnet = 0;
        let dristigTegnet = 0;
        let vist = 0;
        let x = 12;
        let y = 18;
        let frø = 7;
        const rnd = () => {
            frø = (frø * 16807) % 2147483647;
            return frø / 2147483647;
        };
        const nyttArk = () => {
            ctx.clearRect(0, 0, BREV_W, BREV_H);
            ctx.strokeStyle = 'rgba(35,26,20,.12)';
            ctx.lineWidth = 1;
            for (let ly = 22; ly < BREV_H - 8; ly += 11) {
                ctx.beginPath();
                ctx.moveTo(8, ly);
                ctx.lineTo(BREV_W - 8, ly);
                ctx.stroke();
            }
            x = 12;
            y = 18;
        };
        nyttArk();
        const tick = () => {
            const g = gRef.current;
            if (g.navn < tegnet) {
                tegnet = 0;
                dristigTegnet = 0;
                nyttArk();
            }
            while (tegnet < g.navn) {
                const dristig =
                    dristigTegnet < g.dristige &&
                    rnd() < (g.dristige - dristigTegnet) / Math.max(1, g.navn - tegnet);
                if (dristig) dristigTegnet++;
                tegnet++;
                const l = 14 + rnd() * 18;
                if (x + l > BREV_W - 8) {
                    x = 12;
                    y += 11;
                    if (y > BREV_H - 10) nyttArk();
                }
                // En navnetrekk: en liten bølget strek, gylne og doble for dristige navn
                ctx.strokeStyle = dristig ? FARGE.gull : FARGE.blekk;
                ctx.lineWidth = dristig ? 2.2 : 1.6;
                ctx.lineCap = 'round';
                for (let d = 0; d < (dristig ? 2 : 1); d++) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + d * 3);
                    ctx.bezierCurveTo(
                        x + l * 0.3,
                        y - 4 + d * 3,
                        x + l * 0.6,
                        y + 3 + d * 3,
                        x + l,
                        y - 1 + d * 3
                    );
                    ctx.stroke();
                }
                x += l + 5;
            }
            if (tall.current) tall.current.textContent = `${g.navn}`;
            // Poengene teller opp mot det riktige tallet, og spretter når de øker.
            if (g.poeng < vist) vist = 0;
            if (g.poeng > vist) {
                vist += Math.max(1, Math.ceil((g.poeng - vist) * 0.4));
                vist = Math.min(vist, g.poeng);
                poeng.current?.animate(
                    [{ transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
                    { duration: 220, easing: 'ease-out' }
                );
            }
            if (poeng.current) poeng.current.textContent = `${vist} poeng`;
        };
        tick();
        const id = window.setInterval(tick, 100);
        return () => window.clearInterval(id);
    }, [gRef]);
    return (
        <div
            ref={ark}
            style={{
                position: 'absolute',
                right: 14,
                top: 64,
                width: BREV_W,
                padding: '8px 0 6px',
                background: `linear-gradient(175deg, ${FARGE.papir}, #e2d2aa)`,
                border: `2px solid ${FARGE.blekk}`,
                boxShadow: '3px 5px 0 rgba(0,0,0,.3)',
                transform: 'rotate(1.5deg)',
                pointerEvents: 'none',
                textAlign: 'center',
                color: FARGE.blekk,
            }}
        >
            <div style={{ fontFamily: TITTEL_FONT, fontSize: 20, lineHeight: 1 }}>
                Klagen til Kongen
            </div>
            <canvas
                ref={lerret}
                style={{
                    position: 'relative',
                    inset: 'auto',
                    width: BREV_W,
                    height: BREV_H,
                    display: 'block',
                }}
            />
            <div ref={tall} style={{ fontFamily: TITTEL_FONT, fontSize: 34, lineHeight: 1 }}>
                0
            </div>
            <div style={{ fontFamily: TEKST_FONT, fontSize: 15, fontWeight: 700 }}>navn</div>
            <div
                ref={poeng}
                style={{
                    fontFamily: TEKST_FONT,
                    fontSize: 17,
                    fontWeight: 700,
                    color: FARGE.blod,
                    marginTop: 2,
                }}
            >
                0 poeng
            </div>
            <div
                style={{
                    borderTop: `1.5px solid ${FARGE.blekk}`,
                    margin: '5px 8px 0',
                    paddingTop: 2,
                }}
            >
                {KLAGER.map((k) => (
                    <KlageRad key={k} k={k} n={klager[k]} />
                ))}
            </div>
        </div>
    );
}
