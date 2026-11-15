import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Tegnkassa: store tegn som brikker på en mørk tavle. Tre moduser:
 * - tegn: kolon, semikolon og anførselstegn, ett per beat.
 * - dialog: to som snakker, og hvor tegnene står i en replikk.
 * - mellomrom: tegnet henger fast i ordet før, så kommer ett mellomrom.
 */

type Modus = 'tegn' | 'dialog' | 'mellomrom';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const KRITT = '#f8fafc';
const DEMPET = '#94a3b8';
const GULL = '#fbbf24';
const GRONN = '#4ade80';
const ROD = '#f87171';
const BLA = '#60a5fa';

function Brikke({ tegn, aktiv = true, str = 120, farge = GULL }: { tegn: string; aktiv?: boolean; str?: number; farge?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: aktiv ? 1 : 0.35, scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            className="flex items-center justify-center rounded-3xl"
            style={{
                width: str * 1.6,
                height: str * 1.6,
                background: '#1e293b',
                border: `4px solid ${aktiv ? farge : '#334155'}`,
                color: aktiv ? farge : DEMPET,
                fontSize: str,
                fontWeight: 900,
                lineHeight: 1,
                boxShadow: aktiv ? `0 0 40px ${farge}55` : 'none',
            }}
        >
            {tegn}
        </motion.div>
    );
}

function Tekst({ children, str = 30, farge = KRITT, style }: { children: ReactNode; str?: number; farge?: string; style?: CSSProperties }) {
    return <div style={{ fontSize: str, fontWeight: 800, color: farge, lineHeight: 1.25, ...style }}>{children}</div>;
}

function Dom({ ok }: { ok: boolean }) {
    return (
        <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
                width: 50,
                height: 50,
                background: ok ? '#16a34a' : '#dc2626',
                color: '#fff',
                fontSize: 32,
                fontWeight: 900,
                flex: 'none',
            }}
        >
            {ok ? '✓' : '✗'}
        </span>
    );
}

function Inn({ children, style }: { children: ReactNode; style?: CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute"
            style={style}
        >
            {children}
        </motion.div>
    );
}

// ---------- tegn ----------

const KJENTE = ['.', ',', '?', '!'];
const NYE = [
    { tegn: ':', navn: 'kolon', jobb: 'Her kommer det noe:', ex: 'en liste, en forklaring eller et sitat' },
    { tegn: ';', navn: 'semikolon', jobb: 'Binder to hele setninger som hører tett sammen', ex: 'brukes sjelden: punktum gjør stort sett samme jobb' },
    { tegn: '« »', navn: 'anførselstegn', jobb: 'Rundt direkte tale og sitater', ex: '«Hei», sa Mia.' },
];

function Tegn({ beat }: { beat: number }) {
    const ny = beat >= 1 ? NYE[Math.min(beat, 3) - 1] : null;
    return (
        <>
            <div className="absolute left-0 right-0 flex justify-center gap-4" style={{ top: 30 }}>
                {KJENTE.map((t) => (
                    <Brikke key={t} tegn={t} str={46} aktiv={beat === 0} farge={KRITT} />
                ))}
                {NYE.map((n, i) => (
                    <Brikke key={n.navn} tegn={n.tegn} str={46} aktiv={beat === i + 1} farge={GULL} />
                ))}
            </div>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Inn key="kasse" style={{ left: 0, right: 0, top: 230, textAlign: 'center' }}>
                        <Tekst str={44}>Verktøykassa har flere tegn</Tekst>
                        <Tekst str={26} farge={DEMPET} style={{ marginTop: 12 }}>
                            fire kjente til venstre · tre nye til høyre
                        </Tekst>
                    </Inn>
                )}
                {ny && (
                    <Inn key={ny.navn} style={{ left: 80, right: 80, top: 190 }}>
                        <div className="flex items-center" style={{ gap: 50 }}>
                            <Brikke tegn={ny.tegn} str={ny.tegn.length > 1 ? 90 : 130} />
                            <div style={{ flex: 1 }}>
                                <Tekst str={50} farge={GULL}>
                                    {ny.navn}
                                </Tekst>
                                <Tekst str={32} style={{ marginTop: 10 }}>
                                    {ny.jobb}
                                </Tekst>
                                <Tekst str={26} farge={DEMPET} style={{ marginTop: 14 }}>
                                    {ny.ex}
                                </Tekst>
                            </div>
                        </div>
                    </Inn>
                )}
            </AnimatePresence>
        </>
    );
}

// ---------- dialog ----------

function Person({ navn, farge, x }: { navn: string; farge: string; x: number }) {
    return (
        <div className="absolute flex flex-col items-center" style={{ left: x, top: 330, width: 140 }}>
            <div className="rounded-full" style={{ width: 70, height: 70, background: farge }} />
            <div className="rounded-t-full" style={{ width: 120, height: 70, background: farge, marginTop: 6, opacity: 0.85 }} />
            <Tekst str={24} style={{ marginTop: 6 }}>
                {navn}
            </Tekst>
        </div>
    );
}

function Boble({ tekst, x, y, farge }: { tekst: string; x: number; y: number; farge: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.3 }}
            className="absolute rounded-3xl"
            style={{ left: x, top: y, background: farge, color: '#0f172a', fontSize: 36, fontWeight: 900, padding: '12px 26px' }}
        >
            {tekst}
        </motion.div>
    );
}

/** Replikklinja. Spørsmålstegnet og «spurte» kan lyse opp. */
function Replikk({ visSporsmal, visSpurte }: { visSporsmal: boolean; visSpurte: boolean }) {
    return (
        <div className="flex items-end justify-center" style={{ fontSize: 58, fontWeight: 900, color: KRITT }}>
            <span style={{ color: GULL }}>«</span>
            <span>Hvor skal du</span>
            <span
                style={{
                    color: visSporsmal ? '#0f172a' : KRITT,
                    background: visSporsmal ? GULL : 'transparent',
                    borderRadius: 8,
                    boxShadow: visSporsmal ? `0 0 0 6px ${GULL}` : 'none',
                    transition: 'all 0.5s',
                }}
            >
                ?
            </span>
            <span style={{ color: GULL }}>»</span>
            <span style={{ marginLeft: 22 }}>
                <span
                    style={{
                        color: visSpurte ? '#0f172a' : KRITT,
                        background: visSpurte ? GRONN : 'transparent',
                        borderRadius: 6,
                        boxShadow: visSpurte ? `0 0 0 5px ${GRONN}` : 'none',
                        transition: 'all 0.5s',
                    }}
                >
                    s
                </span>
                purte Mia.
            </span>
        </div>
    );
}

function Dialog({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Inn key="to" style={{ inset: 0 }}>
                    <Person navn="Mia" farge={BLA} x={230} />
                    <Person navn="Tor" farge="#f472b6" x={630} />
                    <Boble tekst="Hvor skal du?" x={120} y={190} farge="#bfdbfe" />
                    <Boble tekst="Hjem." x={640} y={200} farge="#fbcfe8" />
                    <Tekst str={26} farge={DEMPET} style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center' }}>
                        I en tekst finnes ingen snakkebobler. Tegnene viser hvem som snakker.
                    </Tekst>
                </Inn>
            )}
            {beat === 1 && (
                <Inn key="valg" style={{ left: 0, right: 0, top: 120 }}>
                    <div className="flex justify-center items-center" style={{ gap: 30 }}>
                        <Dom ok />
                        <Brikke tegn="« »" str={90} farge={GRONN} />
                        <div style={{ width: 80 }} />
                        <Dom ok={false} />
                        <Brikke tegn={'“ ”'} str={90} farge={ROD} />
                    </div>
                    <div className="flex justify-center" style={{ gap: 150, marginTop: 24 }}>
                        <Tekst str={28} farge={GRONN}>
                            norsk: vinklede, som små piler
                        </Tekst>
                        <Tekst str={28} farge={ROD}>
                            amerikanske krøller
                        </Tekst>
                    </div>
                </Inn>
            )}
            {beat >= 2 && (
                <Inn key="replikk" style={{ left: 0, right: 0, top: 170 }}>
                    <Replikk visSporsmal={beat === 3} visSpurte={beat === 4} />
                    <div style={{ height: 50 }} />
                    <div className="flex justify-center">
                        {beat === 2 && (
                            <Tekst str={28} farge={DEMPET}>
                                replikken i anførselstegn, så hvem som sier den
                            </Tekst>
                        )}
                        {beat === 3 && (
                            <Tekst str={30} farge={GULL}>
                                spørsmålstegnet står inne i anførselstegnene
                            </Tekst>
                        )}
                        {beat === 4 && (
                            <Tekst str={30} farge={GRONN}>
                                liten bokstav: setningen fortsetter
                            </Tekst>
                        )}
                    </div>
                </Inn>
            )}
        </AnimatePresence>
    );
}

// ---------- mellomrom ----------

function Mellomrom({ beat }: { beat: number }) {
    return (
        <AnimatePresence mode="wait">
            {beat === 0 && (
                <Inn key="magnet" style={{ left: 0, right: 0, top: 160 }}>
                    <div className="flex justify-center items-end" style={{ fontSize: 110, fontWeight: 900, color: KRITT }}>
                        <span>hei</span>
                        <motion.span
                            initial={{ x: 160, opacity: 0.4 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.6 }}
                            style={{ color: GULL, display: 'inline-block' }}
                        >
                            ,
                        </motion.span>
                    </div>
                    <Tekst str={32} farge={GULL} style={{ textAlign: 'center', marginTop: 30 }}>
                        Tegnet henger fast i ordet før seg
                    </Tekst>
                </Inn>
            )}
            {beat === 1 && (
                <Inn key="riktig" style={{ left: 0, right: 0, top: 120 }}>
                    <div className="flex flex-col items-center" style={{ gap: 40 }}>
                        <div className="flex items-center" style={{ gap: 30 }}>
                            <Dom ok />
                            <Tekst str={80}>
                                hei<span style={{ color: GULL }}>,</span> Mia
                            </Tekst>
                        </div>
                        <div className="flex items-center" style={{ gap: 30 }}>
                            <Dom ok={false} />
                            <Tekst str={80} farge={ROD}>
                                hei&nbsp;&nbsp;<span style={{ color: GULL }}>,</span> Mia
                            </Tekst>
                            <Tekst str={24} farge={ROD} style={{ width: 230 }}>
                                mellomrom foran kommaet
                            </Tekst>
                        </div>
                    </div>
                </Inn>
            )}
            {beat === 2 && (
                <Inn key="ett" style={{ left: 0, right: 0, top: 150 }}>
                    <div className="flex justify-center items-end" style={{ fontSize: 100, fontWeight: 900, color: KRITT }}>
                        <span>hei</span>
                        <span style={{ color: GULL }}>,</span>
                        <motion.span
                            initial={{ width: 0 }}
                            animate={{ width: 50 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            style={{
                                display: 'inline-block',
                                height: 22,
                                borderLeft: `5px solid ${GRONN}`,
                                borderRight: `5px solid ${GRONN}`,
                                borderBottom: `5px solid ${GRONN}`,
                                marginBottom: 14,
                            }}
                        />
                        <span>Mia</span>
                    </div>
                    <Tekst str={32} farge={GRONN} style={{ textAlign: 'center', marginTop: 30 }}>
                        Etter tegnet: ett mellomrom
                    </Tekst>
                </Inn>
            )}
        </AnimatePresence>
    );
}

interface Props {
    modus: Modus;
}

export function TegnsettingTegn({ beat, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'tegn';
    return (
        <Flate bakgrunn="radial-gradient(ellipse at 50% 30%, #1e293b 0%, #0f172a 70%)">
            <div className="absolute inset-0" style={FONT}>
                {modus === 'tegn' && <Tegn beat={beat} />}
                {modus === 'dialog' && <Dialog beat={beat} />}
                {modus === 'mellomrom' && <Mellomrom beat={beat} />}
            </div>
        </Flate>
    );
}
