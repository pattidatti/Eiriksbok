// HUD-en i gråboksen: kalender, saksnummer, kassa, de papirløse og lappen med reglene.
// Bare enkle bokser nå; kunsten (blokkalender, nummereringsmaskin) kommer i neste fase.

import { FARGE } from './farger';
import type { HudData } from './hudData';
import { REGLER, TASTER, saksnummer } from './texts';
import { TUNING } from './tuning';

const boks: React.CSSProperties = {
    position: 'absolute',
    background: FARGE.papir,
    color: FARGE.tekst,
    border: `2px solid ${FARGE.tekst}`,
    padding: '6px 10px',
    fontFamily: 'Georgia, serif',
    pointerEvents: 'none',
};

export function Hud({ d, knapper }: { d: HudData; knapper: React.ReactNode }) {
    const lav = d.kasse < d.husleie;
    return (
        <>
            {/* Kalenderen: årstallet og hvor langt det er til nyttår */}
            <div style={{ ...boks, left: 12, top: 12, width: 150, textAlign: 'center' }}>
                <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1 }}>{d.år}</div>
                <div style={{ fontSize: 14 }}>Mål: nyttår 1938</div>
                <div style={{ height: 8, background: '#ccc', marginTop: 4 }}>
                    <div
                        style={{
                            height: '100%',
                            width: `${Math.min(100, d.årAndel * 100)}%`,
                            background: FARGE.grønn,
                        }}
                    />
                </div>
            </div>
            {/* Nummereringsmaskinen */}
            <div style={{ ...boks, left: '50%', top: 12, transform: 'translateX(-50%)' }}>
                <div style={{ fontSize: 14 }}>Saker fornyet</div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'monospace' }}>
                    Sak nr. {saksnummer(d.saker)}
                </div>
                {d.rekke >= 2 && (
                    <div style={{ fontSize: 14 }}>Rene stempler på rad: {d.rekke}</div>
                )}
            </div>
            {/* Kassa */}
            <div
                style={{
                    ...boks,
                    right: 12,
                    bottom: 12,
                    width: 190,
                    borderColor: lav ? FARGE.rød : FARGE.tekst,
                }}
            >
                <div style={{ fontSize: 15, fontWeight: 700 }}>Kassa: {d.kasse} mynter</div>
                <div style={{ fontSize: 15, color: lav ? FARGE.rød : FARGE.tekst }}>
                    Husleie ved nyttår: {d.husleie}
                </div>
            </div>
            {/* Venteskuffen */}
            <div
                style={{
                    ...boks,
                    left: 12,
                    bottom: 12,
                    width: 190,
                    borderColor: d.papirløse >= 4 ? FARGE.rød : FARGE.tekst,
                }}
            >
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                    Uten papirer: {d.papirløse} av {TUNING.tap.papirløse}
                </div>
            </div>
            {/* Lappen med de tre reglene */}
            <div style={{ ...boks, right: 12, top: 12, width: 260, fontSize: 14 }}>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                    {REGLER.map((r) => (
                        <li key={r}>{r}</li>
                    ))}
                </ol>
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: 12,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                }}
            >
                <span
                    style={{
                        fontSize: 14,
                        color: FARGE.papir,
                        background: 'rgba(0,0,0,.45)',
                        padding: '4px 8px',
                    }}
                >
                    {TASTER}
                </span>
                {knapper}
            </div>
        </>
    );
}
