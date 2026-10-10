// HUD-en er ting på bordet: en blokkalender med åtte år (målet), en nummereringsmaskin i
// nikkel for sakene, og små lapper festet til tingene: prisen ved hver lomme, kassa, regningen
// med nedtelling til nyttår, og papirløs-hylla. Ingen tekstlinje under spillet.

import { FARGE } from './farger';
import type { HudData } from './hudData';
import { BRETT, FRIMERKE_PLASS, KASSE_PLASS, LOMME, PLASSER, REGNING_PLASS, SKUFF_PLASS } from './levels';
import { BORDLAPP, GRENSE, saksnummer } from './texts';
import { SKRIFT_DECO, SKRIFT_MASKIN } from './tegning';
import { TUNING } from './tuning';

type Anker = (x: number, z: number) => { x: number; y: number } | null;

const CSS = `
@keyframes stp-riv { 0% { transform: translateY(0) rotate(0); opacity: 1 }
  100% { transform: translateY(160px) rotate(-24deg); opacity: 0 } }
@keyframes stp-rull { 0% { transform: translateY(-60%); opacity: .2 } 100% { transform: none; opacity: 1 } }
@keyframes stp-sprett { 0% { transform: scale(1) } 35% { transform: scale(1.6) } 100% { transform: scale(1) } }
@keyframes stp-puls { 0%,100% { transform: translate(-50%,-50%) scale(1) } 50% { transform: translate(-50%,-50%) scale(1.12) } }
`;

/** En liten lapp festet til et punkt på bordet. */
function Merke({
    at,
    farge,
    bakgrunn,
    stor,
    puls,
    children,
}: {
    at: { x: number; y: number } | null;
    farge: string;
    bakgrunn: string;
    stor?: boolean;
    puls?: boolean;
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
                padding: stor ? '3px 9px' : '1px 7px',
                fontSize: stor ? 15 : 18,
                fontWeight: 700,
                fontFamily: SKRIFT_DECO,
                letterSpacing: stor ? 1 : 0,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                borderRadius: 2,
                boxShadow: '0 2px 0 rgba(0,0,0,.35)',
                animation: puls ? 'stp-puls 0.7s ease-in-out infinite' : undefined,
            }}
        >
            {children}
        </div>
    );
}

function Kalender({ d }: { d: HudData }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: 16,
                top: 14,
                width: 190,
                pointerEvents: 'none',
                fontFamily: SKRIFT_DECO,
                filter: 'drop-shadow(0 4px 0 rgba(0,0,0,.35))',
            }}
        >
            <div
                style={{
                    background: FARGE.rød,
                    color: FARGE.papir,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: 2,
                    textAlign: 'center',
                    padding: '4px 0',
                }}
            >
                NANSENKONTORET
            </div>
            <div style={{ position: 'relative', background: FARGE.papir, color: FARGE.tekst }}>
                {/* Forrige år rives av og faller */}
                {d.brett > 0 && (
                    <div
                        key={`riv-${d.år}`}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: FARGE.papir,
                            textAlign: 'center',
                            fontSize: 48,
                            fontWeight: 700,
                            lineHeight: '64px',
                            animation: 'stp-riv 0.9s ease-in forwards',
                            zIndex: 2,
                        }}
                    >
                        {d.år - 1}
                    </div>
                )}
                <div style={{ textAlign: 'center', fontSize: 48, fontWeight: 700, lineHeight: '64px' }}>
                    {d.år}
                </div>
                <div style={{ display: 'flex', gap: 2, padding: '0 6px 6px', justifyContent: 'center' }}>
                    {BRETT.map((b, i) => (
                        <div
                            key={b.år}
                            style={{
                                width: 20,
                                height: 20,
                                fontSize: 14,
                                lineHeight: '20px',
                                textAlign: 'center',
                                fontWeight: 700,
                                background: i < d.brett ? FARGE.grønn : i === d.brett ? FARGE.oransje : '#d8d2c2',
                                color: i <= d.brett ? '#fff' : '#6b6a63',
                            }}
                        >
                            {String(b.år).slice(2)}
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'center', paddingBottom: 7 }}>
                    Mål: åpent til nyttår 1938
                </div>
            </div>
        </div>
    );
}

function Nummermaskin({ d }: { d: HudData }) {
    const tall = saksnummer(d.saker).replace(' ', '');
    return (
        <div
            style={{
                position: 'absolute',
                right: 16,
                top: 62,
                pointerEvents: 'none',
                background: 'linear-gradient(#cfd2cf, #8f9490)',
                border: '2px solid #5d625f',
                borderRadius: 4,
                padding: '6px 10px 8px',
                color: FARGE.tekst,
                fontFamily: SKRIFT_DECO,
                boxShadow: '0 4px 0 rgba(0,0,0,.4)',
            }}
        >
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.5, textAlign: 'center' }}>
                SAKER FORNYET
            </div>
            <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                {tall.split('').map((c, i) => (
                    <div
                        key={i === tall.length - 1 ? `s${d.saker}` : i}
                        style={{
                            width: 22,
                            height: 30,
                            background: '#1b1e1d',
                            color: '#f2efe6',
                            fontFamily: SKRIFT_MASKIN,
                            fontSize: 22,
                            fontWeight: 700,
                            lineHeight: '30px',
                            textAlign: 'center',
                            overflow: 'hidden',
                            animation: i === tall.length - 1 ? 'stp-rull 0.18s ease-out' : undefined,
                        }}
                    >
                        {c}
                    </div>
                ))}
            </div>
            {d.rekke >= 2 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                    {Array.from({ length: Math.min(10, d.rekke) }, (_, i) => (
                        <span key={i} style={{ width: 8, height: 8, borderRadius: 4, background: FARGE.oransje }} />
                    ))}
                    <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 4 }}>{d.rekke} på rad</span>
                </div>
            )}
        </div>
    );
}

/**
 * Det passet ga: et skilt øverst ved bordkanten (der folk står og går) som teller hvor mange
 * som har reist videre med gyldig pass. Passene glir ut over kanten mot skiltet.
 */
function Grense({ d }: { d: HudData }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: '50%',
                top: 12,
                transform: 'translateX(-50%)',
                background: FARGE.papir,
                border: `2px solid ${FARGE.grønn}`,
                borderRadius: 3,
                padding: '4px 14px 5px',
                textAlign: 'center',
                color: FARGE.tekst,
                fontFamily: SKRIFT_DECO,
                boxShadow: '0 4px 0 rgba(0,0,0,.35)',
                pointerEvents: 'none',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1.2 }}>
                    {GRENSE.tittel.toUpperCase()}
                </span>
                <span
                    key={d.hjulpet}
                    style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: FARGE.grønn,
                        display: 'inline-block',
                        animation: d.hjulpet ? 'stp-sprett 0.45s ease-out' : undefined,
                    }}
                >
                    {d.hjulpet}
                </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#3c4440' }}>{GRENSE.under}</div>
        </div>
    );
}

export function Hud({ d, anker, knapper }: { d: HudData; anker: Anker; knapper: React.ReactNode }) {
    const lav = d.kasse < d.husleie;
    const fare = d.papirløse >= TUNING.tap.papirløse - 2;
    return (
        <>
            <style>{CSS}</style>
            <Kalender d={d} />
            <Nummermaskin d={d} />
            <div style={{ position: 'absolute', right: 16, top: 14, display: 'flex', gap: 8 }}>{knapper}</div>

            <Grense d={d} />

            {/* Prisen ved hver lomme: «Betaler +1», «Gratis -2» eller «Grå sak -3» */}
            {d.lommer.map((l) => {
                const p = PLASSER[l.plass];
                return (
                    <Merke
                        key={l.plass}
                        at={anker(p.x + LOMME.x, p.z + LOMME.z - 0.42)}
                        farge={l.pris > 0 ? FARGE.tekst : FARGE.papir}
                        bakgrunn={l.pris > 0 ? FARGE.gull : l.pris < -2 ? '#5b1512' : FARGE.rød}
                        stor
                    >
                        {BORDLAPP.lomme(l.pris)}
                    </Merke>
                );
            })}
            {d.frimerke && (
                <Merke at={anker(FRIMERKE_PLASS.x, FRIMERKE_PLASS.z - 0.62)} farge={FARGE.tekst} bakgrunn={FARGE.gull} puls>
                    +{TUNING.kasse.frimerke}
                </Merke>
            )}

            {/* Lappene på tingene. Kassa og regningen kommer i 1932, sammen med pengene. */}
            {d.penger && (
                <Merke at={anker(KASSE_PLASS.x, KASSE_PLASS.z + 0.62)} farge={FARGE.tekst} bakgrunn={lav ? '#f2c4bd' : FARGE.papir} stor>
                    {BORDLAPP.kasse(d.kasse)}
                </Merke>
            )}
            <Merke
                at={d.penger ? anker(REGNING_PLASS.x, REGNING_PLASS.z + 0.66) : null}
                farge={FARGE.papir}
                bakgrunn={lav ? FARGE.rød : FARGE.tekst}
                stor
                puls={lav && d.tilNyttår <= 6}
            >
                {BORDLAPP.husleie(d.husleie, d.tilNyttår)}
            </Merke>
            <Merke
                at={anker(SKUFF_PLASS.x, SKUFF_PLASS.z + 0.68)}
                farge={FARGE.papir}
                bakgrunn={fare ? FARGE.rød : FARGE.tekst}
                stor
            >
                {BORDLAPP.hylle(d.papirløse, TUNING.tap.papirløse)}
            </Merke>
        </>
    );
}
