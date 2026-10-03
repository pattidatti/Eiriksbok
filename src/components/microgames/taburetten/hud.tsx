// Gråboks-HUD: stripa (Stortinget), kalenderen, poeng, hvem som sitter og hvem som er neste.

import { FARGE } from './farger';
import type { HudData } from './hudData';

const boks: React.CSSProperties = {
    background: 'rgba(236,224,196,0.92)',
    color: '#221c18',
    border: '2px solid #221c18',
    padding: '4px 10px',
    fontSize: 18,
    fontWeight: 700,
};

export function Hud({ d, onBytt }: { d: HudData; onBytt: () => void }) {
    const andel = (d.rødt / 114) * 100;
    return (
        <>
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'min(560px, 70%)',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ ...boks, textAlign: 'center', marginBottom: 4 }}>{d.kalender}</div>
                <div
                    data-mg-anchor="stripa"
                    style={{
                        position: 'relative',
                        height: 26,
                        border: '2px solid #221c18',
                        display: 'flex',
                    }}
                >
                    <div style={{ width: `${andel}%`, background: FARGE.rød }} />
                    <div style={{ flex: 1, background: FARGE.blå }} />
                    <div
                        style={{
                            position: 'absolute',
                            left: `${(58 / 114) * 100}%`,
                            top: -4,
                            bottom: -4,
                            width: 2,
                            background: '#221c18',
                        }}
                    />
                    <span
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: 1,
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 18,
                        }}
                    >
                        {d.rødt} rødt
                    </span>
                    <span
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: 1,
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: 18,
                        }}
                    >
                        {d.blått} blått
                    </span>
                </div>
            </div>
            <div
                style={{
                    position: 'absolute',
                    top: 10,
                    right: 12,
                    ...boks,
                    textAlign: 'right',
                    pointerEvents: 'none',
                }}
            >
                <div>{d.poeng}</div>
                <div style={{ fontSize: 22 }}>x{d.mult}</div>
            </div>
            <div
                style={{
                    position: 'absolute',
                    bottom: 12,
                    left: 12,
                    ...boks,
                    pointerEvents: 'none',
                }}
            >
                I stolen:{' '}
                <span style={{ color: d.stolFarge ? FARGE[d.stolFarge] : '#221c18' }}>
                    {d.stol}
                </span>
                {d.kø && (
                    <>
                        <br />
                        Neste:{' '}
                        <span style={{ color: d.køFarge ? FARGE[d.køFarge] : '#8a7d6b' }}>
                            {d.kø}
                        </span>
                    </>
                )}
            </div>
            {d.kanBytte && (
                <button
                    type="button"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onBytt();
                    }}
                    style={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        ...boks,
                        fontSize: 22,
                        padding: '10px 22px',
                        background: FARGE.gull,
                        cursor: 'pointer',
                    }}
                >
                    Bytt (mellomrom)
                </button>
            )}
        </>
    );
}
