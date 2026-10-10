// HUD-en i gråboksen: kalender og saksnummer i hjørnene. Resten står på bordet: korte
// merkelapper ved myntstabelen, regningen og papirløs-hylla, og prisen ved hver lomme.

import { FARGE } from './farger';
import type { HudData } from './hudData';
import { FRIMERKE_PLASS, KASSE_PLASS, PLASSER, REGNING_PLASS, SKUFF_PLASS } from './levels';
import { BORDLAPP, TASTER, saksnummer } from './texts';
import { TUNING } from './tuning';

type Anker = (x: number, z: number) => { x: number; y: number } | null;

const boks: React.CSSProperties = {
    position: 'absolute',
    background: FARGE.papir,
    color: FARGE.tekst,
    border: `2px solid ${FARGE.tekst}`,
    padding: '6px 10px',
    fontFamily: 'Georgia, serif',
    pointerEvents: 'none',
};

/** En liten lapp festet til et punkt på bordet. */
function Merke({
    at,
    farge,
    bakgrunn,
    stor,
    children,
}: {
    at: { x: number; y: number } | null;
    farge: string;
    bakgrunn: string;
    stor?: boolean;
    children: React.ReactNode;
}) {
    if (!at) return null;
    return (
        <div
            style={{
                position: 'absolute',
                left: at.x,
                top: at.y,
                transform: 'translate(-50%, -50%)',
                color: farge,
                background: bakgrunn,
                padding: stor ? '2px 8px' : '0 5px',
                fontSize: stor ? 15 : 17,
                fontWeight: 800,
                fontFamily: 'Georgia, serif',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                borderRadius: 3,
            }}
        >
            {children}
        </div>
    );
}

export function Hud({ d, anker, knapper }: { d: HudData; anker: Anker; knapper: React.ReactNode }) {
    const lav = d.kasse < d.husleie;
    const fare = d.papirløse >= TUNING.tap.papirløse - 2;
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

            {/* Prisen ved hver lomme: +1 for mynt, -2 for tomt hull, -3 for grå sak */}
            {d.lommer.map((l) => {
                const p = PLASSER[l.plass];
                return (
                    <Merke
                        key={l.plass}
                        at={anker(p.x + 0.42, p.z - 0.55)}
                        farge={l.pris > 0 ? FARGE.tekst : FARGE.papir}
                        bakgrunn={l.pris > 0 ? FARGE.gull : FARGE.rød}
                    >
                        {l.pris > 0 ? `+${l.pris}` : l.pris}
                    </Merke>
                );
            })}
            {d.frimerke && (
                <Merke
                    at={anker(FRIMERKE_PLASS.x, FRIMERKE_PLASS.z)}
                    farge={FARGE.tekst}
                    bakgrunn={FARGE.gull}
                >
                    +{TUNING.kasse.frimerke}
                </Merke>
            )}

            {/* Merkelappene på bordet */}
            <Merke
                at={anker(KASSE_PLASS.x, KASSE_PLASS.z + 0.6)}
                farge={FARGE.tekst}
                bakgrunn={FARGE.papir}
                stor
            >
                {BORDLAPP.kasse(d.kasse)}
            </Merke>
            <Merke
                at={anker(REGNING_PLASS.x, REGNING_PLASS.z + 0.65)}
                farge={FARGE.papir}
                bakgrunn={lav ? FARGE.rød : FARGE.tekst}
                stor
            >
                {BORDLAPP.husleie(d.husleie)}
            </Merke>
            <Merke
                at={anker(SKUFF_PLASS.x, SKUFF_PLASS.z + 0.75)}
                farge={FARGE.papir}
                bakgrunn={fare ? FARGE.rød : FARGE.tekst}
                stor
            >
                {BORDLAPP.hylle(d.papirløse, TUNING.tap.papirløse)}
            </Merke>

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
