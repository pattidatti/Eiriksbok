import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Papiret i kommentar-filmen: avissida med nyheten mot kommentaren, utdraget fra
 * «KI er Botox for hjernen», den svake mot den sterke analysesetningen, og analysen som
 * sys sammen blokk for blokk. Alt tegnes på en flate på 1000x562.
 */

type Modus = 'avis' | 'utdrag' | 'skriv' | 'modell';

const SERIF = 'Georgia, "Times New Roman", serif';
const FONT = 'Outfit, Inter, sans-serif';

function Inn({
    children,
    forsinkelse = 0,
    y = 12,
}: {
    children: ReactNode;
    forsinkelse?: number;
    y?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: forsinkelse }}
        >
            {children}
        </motion.div>
    );
}

/** Grå streker som står for brødtekst. */
function Linjer({ antall, farge = '#cbd5e1' }: { antall: number; farge?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
            {Array.from({ length: antall }, (_, i) => (
                <div
                    key={i}
                    style={{
                        height: 9,
                        borderRadius: 5,
                        background: farge,
                        width: i === antall - 1 ? '62%' : `${92 - ((i * 7) % 15)}%`,
                    }}
                />
            ))}
        </div>
    );
}

/** Merkelapp med farget kant. */
function Lapp({
    tekst,
    farge,
    bak = '#ffffff',
    stor = false,
}: {
    tekst: string;
    farge: string;
    bak?: string;
    stor?: boolean;
}) {
    return (
        <div
            style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: stor ? 24 : 20,
                color: '#0f172a',
                background: bak,
                border: `3px solid ${farge}`,
                borderRadius: 12,
                padding: '6px 14px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
            }}
        >
            {tekst}
        </div>
    );
}

/* ---------------- Avissida: nyhet mot kommentar ---------------- */

function Avis({ beat }: { beat: number }) {
    const nyhetAktiv = beat >= 1 && beat <= 2;
    const kommentarAktiv = beat >= 3;
    const kolonne = (aktiv: boolean, dempet: boolean) => ({
        position: 'absolute' as const,
        top: 92,
        width: 410,
        height: 400,
        background: '#fffdf7',
        borderRadius: 6,
        padding: '18px 22px',
        boxShadow: aktiv
            ? '0 0 0 4px #fbbf24, 0 12px 30px rgba(0,0,0,0.35)'
            : '0 8px 20px rgba(0,0,0,0.25)',
        opacity: dempet ? 0.45 : 1,
        transition: 'opacity 0.6s, box-shadow 0.6s',
    });
    return (
        <>
            {/* Avishodet */}
            <div
                style={{
                    position: 'absolute',
                    left: 70,
                    right: 70,
                    top: 26,
                    height: 52,
                    background: '#fffdf7',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: SERIF,
                    fontSize: 34,
                    fontWeight: 700,
                    letterSpacing: 6,
                    color: '#1e293b',
                    borderBottom: '4px double #1e293b',
                }}
            >
                DAGENS AVIS
            </div>

            {/* Nyheten (viker for skribentens mål på siste beat) */}
            {beat < 4 && (
                <div style={{ ...kolonne(nyhetAktiv, kommentarAktiv), left: 70 }}>
                    <div
                        style={{
                            fontFamily: FONT,
                            fontWeight: 900,
                            fontSize: 16,
                            color: '#2563eb',
                            letterSpacing: 3,
                        }}
                    >
                        NYHET
                    </div>
                    <div
                        style={{
                            fontFamily: SERIF,
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#0f172a',
                            marginTop: 4,
                        }}
                    >
                        Dette har skjedd
                    </div>
                    <Linjer antall={4} />
                    {/* Kilder som siteres */}
                    <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                        {[0, 1].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    opacity: beat >= 1 ? 1 : 0.25,
                                    scale: beat === 1 ? 1.06 : 1,
                                }}
                                transition={{ duration: 0.5, delay: i * 0.3 }}
                                style={{
                                    flex: 1,
                                    background: '#dbeafe',
                                    borderLeft: '6px solid #2563eb',
                                    borderRadius: 6,
                                    padding: '8px 10px',
                                    fontFamily: SERIF,
                                    fontStyle: 'italic',
                                    fontSize: 20,
                                    color: '#1e3a8a',
                                }}
                            >
                                «...», sier kilde {i + 1}
                            </motion.div>
                        ))}
                    </div>
                    <Linjer antall={3} />
                </div>
            )}

            {/* Kommentaren */}
            <div style={{ ...kolonne(kommentarAktiv, nyhetAktiv), left: 520 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 46,
                            height: 46,
                            borderRadius: 23,
                            background: '#f97316',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontFamily: FONT,
                            fontWeight: 900,
                            fontSize: 22,
                        }}
                    >
                        !
                    </div>
                    <div
                        style={{
                            fontFamily: FONT,
                            fontWeight: 900,
                            fontSize: 16,
                            color: '#ea580c',
                            letterSpacing: 3,
                        }}
                    >
                        KOMMENTAR
                    </div>
                </div>
                <div
                    style={{
                        fontFamily: SERIF,
                        fontSize: 30,
                        fontWeight: 700,
                        color: '#0f172a',
                        marginTop: 6,
                        lineHeight: 1.1,
                    }}
                >
                    Dette mener jeg!
                </div>
                <Linjer antall={4} farge={beat >= 3 ? '#fdba74' : '#cbd5e1'} />
                <Linjer antall={4} farge={beat >= 3 ? '#fdba74' : '#cbd5e1'} />
            </div>

            {/* Merknader under sidene */}
            <div
                style={{
                    position: 'absolute',
                    left: 70,
                    width: 410,
                    top: 506,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <AnimatePresence mode="wait">
                    {beat === 1 && (
                        <Inn key="kilder">
                            <Lapp tekst="Siterer kilder" farge="#2563eb" />
                        </Inn>
                    )}
                    {beat === 2 && (
                        <Inn key="mening">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Lapp tekst="Egen mening" farge="#64748b" />
                                <span
                                    style={{
                                        fontFamily: FONT,
                                        fontWeight: 900,
                                        fontSize: 34,
                                        color: '#dc2626',
                                    }}
                                >
                                    ✕
                                </span>
                                <span
                                    style={{
                                        fontFamily: FONT,
                                        fontWeight: 700,
                                        fontSize: 20,
                                        color: '#e2e8f0',
                                    }}
                                >
                                    holdes utenfor
                                </span>
                            </div>
                        </Inn>
                    )}
                </AnimatePresence>
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: 520,
                    width: 410,
                    top: 506,
                    display: 'flex',
                    justifyContent: 'center',
                }}
            >
                <AnimatePresence mode="wait">
                    {beat === 3 && (
                        <Inn key="stilling">
                            <Lapp tekst="Tar stilling" farge="#f97316" />
                        </Inn>
                    )}
                </AnimatePresence>
            </div>

            {/* Målene til skribenten */}
            <AnimatePresence>
                {beat >= 4 && (
                    <motion.div
                        key="maal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            left: 70,
                            top: 92,
                            width: 410,
                            height: 400,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: 18,
                            padding: '0 24px',
                        }}
                    >
                        <div
                            style={{
                                fontFamily: FONT,
                                fontWeight: 900,
                                fontSize: 24,
                                color: '#f8fafc',
                                textAlign: 'center',
                            }}
                        >
                            Skribenten vil ...
                        </div>
                        {['provosere deg', 'få deg til å le', 'få deg til å mene det samme'].map(
                            (t, i) => (
                                <Inn key={t} forsinkelse={0.3 + i * 0.5} y={0}>
                                    <Lapp
                                        tekst={t}
                                        farge={i === 2 ? '#fbbf24' : '#f97316'}
                                        bak={i === 2 ? '#fef3c7' : '#ffffff'}
                                        stor={i === 2}
                                    />
                                </Inn>
                            )
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/* ---------------- Utdraget fra Botox-kommentaren ---------------- */

function Merk({ children, aktiv, farge }: { children: ReactNode; aktiv: boolean; farge: string }) {
    return (
        <span
            style={{
                background: aktiv ? farge : 'transparent',
                borderRadius: 4,
                padding: '0 3px',
                transition: 'background 0.6s',
            }}
        >
            {children}
        </span>
    );
}

function Utdrag({ beat }: { beat: number }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: 150,
                top: 34,
                width: 700,
                height: 494,
                background: '#fffdf7',
                borderRadius: 8,
                padding: '24px 40px',
                boxShadow: '0 14px 40px rgba(0,0,0,0.4)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                    style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        fontSize: 16,
                        color: '#ea580c',
                        letterSpacing: 3,
                    }}
                >
                    KOMMENTAR
                </span>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: '#64748b' }}>
                    NRK Ytring
                </span>
            </div>
            <div
                style={{
                    fontFamily: SERIF,
                    fontSize: 42,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginTop: 6,
                    lineHeight: 1.1,
                }}
            >
                KI er Botox for hjernen
            </div>
            <AnimatePresence>
                {beat >= 1 && (
                    <Inn key="ingress">
                        <div
                            style={{
                                marginTop: 14,
                                fontFamily: FONT,
                                fontWeight: 700,
                                fontSize: 21,
                                color: '#334155',
                                background: '#f1f5f9',
                                borderRadius: 8,
                                padding: '8px 12px',
                            }}
                        >
                            Saken: Skribenten advarer mot å la KI skrive for deg uten å tenke over
                            det.
                        </div>
                    </Inn>
                )}
            </AnimatePresence>
            {beat < 2 && <Linjer antall={beat === 0 ? 11 : 8} />}
            <AnimatePresence>
                {beat >= 2 && (
                    <Inn key="sitat1">
                        <div
                            style={{
                                marginTop: 18,
                                fontFamily: SERIF,
                                fontSize: 29,
                                color: '#1e293b',
                                lineHeight: 1.4,
                            }}
                        >
                            «... ender du gjerne med en{' '}
                            <Merk aktiv={beat === 2} farge="#fecaca">
                                pen og glatt
                            </Merk>{' '}
                            tekst, like{' '}
                            <Merk aktiv={beat === 2} farge="#fecaca">
                                død som en Botox-panne
                            </Merk>
                            .»
                        </div>
                    </Inn>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {beat >= 3 && (
                    <Inn key="sitat2">
                        <div
                            style={{
                                marginTop: 16,
                                fontFamily: SERIF,
                                fontSize: 29,
                                color: '#1e293b',
                                lineHeight: 1.4,
                            }}
                        >
                            «... teksten blir kanskje{' '}
                            <Merk aktiv farge="#bbf7d0">
                                helt riktig
                            </Merk>
                            , men likevel{' '}
                            <Merk aktiv farge="#fecaca">
                                fullstendig feil
                            </Merk>
                            .»
                        </div>
                        <div
                            style={{
                                marginTop: 10,
                                fontFamily: SERIF,
                                fontSize: 24,
                                fontStyle: 'italic',
                                color: '#475569',
                            }}
                        >
                            Det er variasjonene og småfeilene som gjør den menneskelig.
                        </div>
                    </Inn>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- Svak og sterk analysesetning ---------------- */

function Setning({
    tittel,
    farge,
    merke,
    children,
}: {
    tittel: string;
    farge: string;
    merke: ReactNode;
    children: ReactNode;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
                style={{
                    width: 64,
                    flexShrink: 0,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 46,
                    color: farge,
                }}
            >
                {merke}
            </div>
            <div
                style={{
                    flex: 1,
                    background: '#ffffff',
                    borderLeft: `8px solid ${farge}`,
                    borderRadius: 10,
                    padding: '12px 18px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                }}
            >
                <div
                    style={{
                        fontFamily: FONT,
                        fontWeight: 900,
                        fontSize: 16,
                        letterSpacing: 2,
                        color: farge,
                    }}
                >
                    {tittel}
                </div>
                <div
                    style={{
                        fontFamily: SERIF,
                        fontSize: 28,
                        color: '#0f172a',
                        lineHeight: 1.35,
                        marginTop: 4,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

function Fagord({ children, aktiv }: { children: ReactNode; aktiv: boolean }) {
    return (
        <span
            style={{
                borderBottom: aktiv ? '4px solid #2563eb' : '4px solid transparent',
                background: aktiv ? '#dbeafe' : 'transparent',
                borderRadius: 3,
                padding: '0 2px',
                transition: 'all 0.6s',
            }}
        >
            {children}
        </span>
    );
}

function Skriv({ beat }: { beat: number }) {
    return (
        <div style={{ position: 'absolute', left: 80, right: 80, top: 30, bottom: 30 }}>
            <div
                style={{
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 34,
                    color: '#f8fafc',
                }}
            >
                Ikke bare finn det. <span style={{ color: '#fbbf24' }}>Forklar hva det gjør.</span>
            </div>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="trinn"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 170,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 22,
                        }}
                    >
                        <Lapp tekst="1. Finn virkemidlet" farge="#94a3b8" stor />
                        <span
                            style={{
                                fontFamily: FONT,
                                fontWeight: 900,
                                fontSize: 44,
                                color: '#fbbf24',
                            }}
                        >
                            →
                        </span>
                        <Inn forsinkelse={0.6} y={0}>
                            <Lapp
                                tekst="2. Forklar hva det gjør"
                                farge="#fbbf24"
                                bak="#fef3c7"
                                stor
                            />
                        </Inn>
                    </motion.div>
                )}
            </AnimatePresence>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 30 }}>
                <AnimatePresence>
                    {beat >= 1 && (
                        <Inn key="svak">
                            <div
                                style={{
                                    opacity: beat >= 2 ? 0.55 : 1,
                                    transition: 'opacity 0.6s',
                                }}
                            >
                                <Setning tittel="SVAK" farge="#dc2626" merke="✕">
                                    Forfatteren bruker ordet Botox, som er en metafor for KI.
                                </Setning>
                            </div>
                        </Inn>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {beat >= 2 && (
                        <Inn key="sterk">
                            <Setning tittel="STERK" farge="#16a34a" merke="✓">
                                <Fagord aktiv={beat >= 3}>Metaforen</Fagord> flytter tanker om noe
                                kunstig og uten sjel over på KI. Det er et{' '}
                                <Fagord aktiv={beat >= 3}>patos-grep</Fagord>.
                            </Setning>
                        </Inn>
                    )}
                </AnimatePresence>
            </div>
            <AnimatePresence>
                {beat >= 3 && (
                    <motion.div
                        key="regel"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}
                    >
                        <Lapp tekst="Fagord + hva det gjør med leseren" farge="#2563eb" stor />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ---------------- Analysen sys sammen ---------------- */

const BLOKKER = [
    { fraBeat: 1, tittel: 'Hovedsyn', tekst: 'KI gjør tekstene sjelløse', farge: '#fbbf24' },
    { fraBeat: 2, tittel: 'Metaforen', tekst: 'KI = Botox, bærer hele teksten', farge: '#f97316' },
    { fraBeat: 2, tittel: 'Pluss og minus', tekst: 'styrer følelsene', farge: '#ec4899' },
    { fraBeat: 3, tittel: 'Paradokset', tekst: 'får leseren til å tenke', farge: '#8b5cf6' },
    {
        fraBeat: 4,
        tittel: 'Konklusjon',
        tekst: 'Ikke logos, men bilder og følelser',
        farge: '#14b8a6',
    },
];

function Modell({ beat }: { beat: number }) {
    const synlige = BLOKKER.filter((b) => b.fraBeat <= beat);
    return (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            <div
                style={{
                    position: 'absolute',
                    top: 22,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 32,
                    color: '#f8fafc',
                }}
            >
                Analysen, sydd sammen
            </div>
            {/* Tråden som syr blokkene sammen */}
            <motion.div
                animate={{ height: Math.max(0, synlige.length - 1) * 88 }}
                transition={{ duration: 0.8 }}
                style={{
                    position: 'absolute',
                    left: 228,
                    top: 116,
                    width: 0,
                    borderLeft: '5px dashed #fbbf24',
                }}
            />
            <div
                style={{
                    position: 'absolute',
                    left: 200,
                    top: 82,
                    width: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 18,
                }}
            >
                {BLOKKER.map((b) => (
                    <div key={b.tittel} style={{ height: 70 }}>
                        <AnimatePresence>
                            {b.fraBeat <= beat && (
                                <motion.div
                                    initial={{ opacity: 0, x: 40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: b.tittel === 'Pluss og minus' ? 0.9 : 0.1,
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 18 }}
                                >
                                    <div
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 28,
                                            background: b.farge,
                                            border: '4px solid #0f172a',
                                            flexShrink: 0,
                                        }}
                                    />
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 70,
                                            background: '#ffffff',
                                            borderRadius: 12,
                                            borderLeft: `10px solid ${b.farge}`,
                                            padding: '6px 16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: FONT,
                                                fontWeight: 900,
                                                fontSize: 22,
                                                color: '#0f172a',
                                            }}
                                        >
                                            {b.tittel}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: FONT,
                                                fontWeight: 600,
                                                fontSize: 19,
                                                color: '#475569',
                                            }}
                                        >
                                            {b.tekst}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
            <AnimatePresence>
                {beat === 0 && (
                    <motion.div
                        key="tom"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            left: 290,
                            top: 210,
                            width: 420,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                            alignItems: 'center',
                        }}
                    >
                        <div style={{ display: 'flex', gap: 14 }}>
                            {BLOKKER.map((b) => (
                                <div
                                    key={b.tittel}
                                    style={{
                                        width: 54,
                                        height: 54,
                                        borderRadius: 27,
                                        background: b.farge,
                                    }}
                                />
                            ))}
                        </div>
                        <div
                            style={{
                                fontFamily: FONT,
                                fontWeight: 800,
                                fontSize: 24,
                                color: '#e2e8f0',
                                textAlign: 'center',
                            }}
                        >
                            Funnene ligger hver for seg.
                            <br />
                            Nå skal de sys sammen.
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function KommentarAvis({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'avis';
    return (
        <Flate bakgrunn="radial-gradient(ellipse at 50% 30%, #334155 0%, #0f172a 75%)">
            {modus === 'avis' && <Avis beat={beat} />}
            {modus === 'utdrag' && <Utdrag beat={beat} />}
            {modus === 'skriv' && <Skriv beat={beat} />}
            {modus === 'modell' && <Modell beat={beat} />}
        </Flate>
    );
}
