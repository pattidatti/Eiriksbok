// Sluttskjermen: resultatet, klassene mot 1912, «Dette skjedde» og neste rangtrinn.
// To spalter, så den passer på 1366x768 uten rulling.

import { useEffect, useState } from 'react';
import {
    ArcadeScreen,
    ArcadeLogo,
    ArcadeTag,
    ArcadeBigButton,
    ArcadeSmallButton,
    ArcadeStats,
} from '../arcade/ArcadeShell';
import { ArcadeLessons } from '../arcade/ArcadeLayers';
import type { Game } from './state';
import { klokke } from './rules';
import { P } from './papir';
import { I1912, KLASSER_1912, LÆRDOM, SOLAS, TAP, TAPT_ÅRSAK } from './texts';

export interface Resultat {
    vant: boolean;
    /** Neste rangtrinn og hvor mange som manglet, eller null på toppen. */
    neste: { grense: number; navn: string; mangler: number } | null;
    reddet: number;
    tomme: number;
    klasser: [number, number, number];
    rang: string;
    nyRekord: boolean;
    nyeFulle: string[];
    lærdom: string[];
}

/** Sluttskjermen er bredere enn arkadekortet og har to spalter (en på smale skjermer). */
const SLUTT_CSS = `
.klokka-slutt .arc-card{max-width:880px}
.klokka-spalter{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start}
@media (max-width:700px){.klokka-spalter{grid-template-columns:1fr}}
.klokka-pop{display:inline-block;animation:klokkaPop .5s cubic-bezier(.2,1.5,.4,1) .9s both}
@keyframes klokkaPop{from{transform:scale(.2);opacity:0}to{transform:scale(1);opacity:1}}
.klokka-stolpe{transform-origin:left;animation:klokkaStolpe 1.1s ease-out .3s both}
@keyframes klokkaStolpe{from{transform:scaleX(0)}to{transform:scaleX(1)}}
`;

/** Et tall som teller opp fra 0 med små tikk - belønningen skal merkes. */
function TellOpp({ til, tikk }: { til: number; tikk: () => void }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let raf = 0;
        const t0 = performance.now();
        const varighet = 1300;
        const steg = () => {
            const k = Math.min(1, (performance.now() - t0) / varighet);
            const v = Math.round(til * (1 - (1 - k) ** 3));
            setN(v);
            if (k < 1) {
                tikk();
                raf = requestAnimationFrame(steg);
            }
        };
        raf = requestAnimationFrame(steg);
        return () => cancelAnimationFrame(raf);
    }, [til, tikk]);
    return <>{n}</>;
}

export function SluttSkjerm({
    res,
    g,
    protokoll,
    tikk,
    start,
    toMenu,
}: {
    res: Resultat;
    g: Game;
    protokoll: number;
    tikk: () => void;
    start: () => void;
    toMenu: () => void;
}) {
    const tapt = !res.vant ? TAP[g.årsak ?? 'tomme'] : null;
    return (
        <div className="klokka-slutt" style={{ display: 'contents' }}>
            <style>{SLUTT_CSS}</style>
            <ArcadeScreen>
                <div
                    style={{
                        fontSize: 13,
                        color: P.blyant,
                        letterSpacing: '0.08em',
                    }}
                >
                    KLOKKA {klokke(g.t)}
                </div>
                <ArcadeLogo>{tapt ? tapt.tittel : 'Flere reddet enn i 1912'}</ArcadeLogo>
                <div className="klokka-spalter">
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <span className="klokka-pop">
                                <ArcadeTag color={res.vant ? P.gul : P.blyant}>
                                    {res.rang}
                                </ArcadeTag>
                            </span>
                            {res.nyRekord && <ArcadeTag color={P.hvit}>Ny rekord</ArcadeTag>}
                        </div>
                        <ArcadeStats
                            items={[
                                {
                                    value: <TellOpp til={res.reddet} tikk={tikk} />,
                                    label: 'reddet',
                                },
                                { value: I1912.reddet, label: 'reddet i 1912' },
                                { value: res.tomme, label: 'tomme plasser' },
                                { value: I1912.tomme, label: 'tomme i 1912' },
                            ]}
                        />
                        {res.neste && (
                            <p
                                style={{
                                    fontSize: 13,
                                    margin: '6px 0 2px',
                                    color: P.gul,
                                }}
                            >
                                {LÆRDOM.neste(res.neste.grense, res.neste.navn, res.neste.mangler)}
                            </p>
                        )}
                        <div
                            style={{
                                margin: '8px 0 2px',
                                textAlign: 'left',
                                fontSize: 13,
                            }}
                        >
                            <div style={{ color: P.blyant, marginBottom: 4 }}>
                                Hvem kom i båtene dine (gul) - og i 1912 (hvit strek)
                            </div>
                            {KLASSER_1912.map((k, i) => {
                                const din = res.klasser[i];
                                return (
                                    <div
                                        key={k.navn}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            margin: '3px 0',
                                        }}
                                    >
                                        <span style={{ width: 64, flex: 'none' }}>{k.navn}</span>
                                        <div
                                            style={{
                                                position: 'relative',
                                                flex: 1,
                                                height: 12,
                                                border: `1px solid ${P.hvit}`,
                                            }}
                                        >
                                            <div
                                                className="klokka-stolpe"
                                                style={{
                                                    width: `${(100 * din) / k.av}%`,
                                                    height: '100%',
                                                    background: P.gul,
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: -3,
                                                    bottom: -3,
                                                    left: `${(100 * k.reddet) / k.av}%`,
                                                    width: 2,
                                                    background: P.hvit,
                                                }}
                                            />
                                        </div>
                                        <span
                                            style={{
                                                width: 84,
                                                flex: 'none',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {din} av {k.av}
                                        </span>
                                    </div>
                                );
                            })}
                            <div style={{ color: P.blyant, marginTop: 4 }}>
                                Køen gikk forfra. Ingen ble valgt bort - de som kom sist opp, ble
                                igjen.
                            </div>
                        </div>
                        <ArcadeBigButton onClick={start}>En natt til</ArcadeBigButton>
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                justifyContent: 'center',
                            }}
                        >
                            <ArcadeSmallButton onClick={toMenu}>Meny</ArcadeSmallButton>
                        </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                        {tapt && <p style={{ fontSize: 14, margin: '0 0 6px' }}>{tapt.tips}</p>}
                        {g.tapte.length > 0 && (
                            <p style={{ fontSize: 13, margin: '4px 0' }}>
                                Tapte båter:{' '}
                                {g.tapte
                                    .map(
                                        (x) => `${x.navn} ${klokke(x.kl)} (${TAPT_ÅRSAK[x.årsak]})`
                                    )
                                    .join(', ')}
                                .
                            </p>
                        )}
                        <ArcadeLessons items={res.lærdom} />
                        <p
                            style={{
                                fontSize: 13,
                                margin: '6px 0 4px',
                                color: P.blyant,
                            }}
                        >
                            {SOLAS}
                        </p>
                        <p style={{ fontSize: 13, margin: '4px 0' }}>
                            Båtprotokollen: {protokoll} av 20 båter firet helt fulle
                            {res.nyeFulle.length > 0 && ` - nye: ${res.nyeFulle.join(', ')}`}.
                        </p>
                    </div>
                </div>
            </ArcadeScreen>
        </div>
    );
}
