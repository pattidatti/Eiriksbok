import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Tegn på nett: en mobil med en chat, en lapp og en e-post. To moduser:
 * - punktum: det samme svaret med og uten punktum, på skjerm og på papir.
 * - formell: chatten mot e-posten til læreren. Begge deler er lov, på hvert sitt sted.
 */

type Modus = 'punktum' | 'formell';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLEKK = '#0f172a';
const GRA = '#64748b';
const GULL = '#d97706';
const ROD = '#dc2626';
const GRONN = '#15803d';

function Mobil({ x, children, glod }: { x: number; children: ReactNode; glod?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute"
            style={{
                borderRadius: 36,
                left: x,
                top: 40,
                width: 290,
                height: 480,
                background: '#0f172a',
                padding: 12,
                boxShadow: glod ? `0 0 60px ${glod}` : '0 20px 50px rgba(15,23,42,0.35)',
                transition: 'box-shadow 0.6s',
            }}
        >
            <div className="relative w-full h-full overflow-hidden" style={{ background: '#f1f5f9', borderRadius: 26 }}>
                <div style={{ height: 44, background: '#e2e8f0', fontSize: 18, fontWeight: 800, color: BLEKK, padding: '10px 18px' }}>
                    Chat
                </div>
                <div className="flex flex-col" style={{ gap: 10, padding: 14 }}>
                    {children}
                </div>
            </div>
        </motion.div>
    );
}

function Melding({ tekst, meg, uthev, forsinkelse = 0 }: { tekst: ReactNode; meg?: boolean; uthev?: string; forsinkelse?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: forsinkelse, type: 'spring', stiffness: 220, damping: 18 }}
            className="rounded-2xl"
            style={{
                alignSelf: meg ? 'flex-end' : 'flex-start',
                background: meg ? '#2563eb' : '#ffffff',
                color: meg ? '#fff' : BLEKK,
                fontSize: 24,
                fontWeight: 700,
                padding: '8px 16px',
                maxWidth: 220,
                outline: uthev ? `4px solid ${uthev}` : 'none',
                outlineOffset: 3,
            }}
        >
            {tekst}
        </motion.div>
    );
}

/** En tegnet smilefjes i stedet for emoji, så det ser likt ut på alle maskiner. */
function Smil() {
    return (
        <svg width="34" height="34" viewBox="0 0 34 34" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <circle cx="17" cy="17" r="15" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            <circle cx="11.5" cy="13" r="2.2" fill="#78350f" />
            <circle cx="22.5" cy="13" r="2.2" fill="#78350f" />
            <path d="M10 20 Q17 27 24 20" stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
    );
}

function Kort({ children, style }: { children: ReactNode; style: CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute rounded-2xl"
            style={{ background: '#ffffff', boxShadow: '0 12px 40px rgba(15,23,42,0.18)', padding: '16px 22px', ...style }}
        >
            {children}
        </motion.div>
    );
}

function Punktum({ beat }: { beat: number }) {
    const irritert = beat === 1 || beat === 2;
    return (
        <>
            <Mobil x={90} glod={irritert ? 'rgba(220,38,38,0.55)' : undefined}>
                <Melding tekst="Kino i kveld?" />
                {beat <= 3 && (
                    <Melding
                        meg
                        tekst={
                            <>
                                Ok<span style={{ color: irritert ? '#fecaca' : '#fff', fontSize: 30 }}>.</span>
                            </>
                        }
                        uthev={irritert ? ROD : undefined}
                        forsinkelse={0.3}
                    />
                )}
                {beat === 4 && (
                    <>
                        <Melding meg tekst="ok" forsinkelse={0.2} />
                        <Melding meg tekst="gleder meg" forsinkelse={0.7} />
                        <Melding meg tekst={<Smil />} forsinkelse={1.2} />
                    </>
                )}
            </Mobil>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort key="roller" style={{ left: 450, top: 150, width: 470 }}>
                        <div style={{ fontSize: 34, fontWeight: 900, color: BLEKK }}>Chat og sosiale medier</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: GRA, marginTop: 8 }}>
                            Her har tegnene fått nye roller.
                        </div>
                    </Kort>
                )}
                {beat === 1 && (
                    <Kort key="irritert" style={{ left: 450, top: 150, width: 470, borderLeft: `8px solid ${ROD}` }}>
                        <div style={{ fontSize: 32, fontWeight: 900, color: ROD }}>«Ok.» kan virke irritert</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: GRA, marginTop: 8 }}>
                            selv om punktum bare er riktig grammatikk
                        </div>
                    </Kort>
                )}
                {beat === 2 && (
                    <Kort key="studie" style={{ left: 450, top: 120, width: 470 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: GULL }}>EN AMERIKANSK STUDIE</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: BLEKK, marginTop: 6, lineHeight: 1.25 }}>
                            Svar i tekstmeldinger som sluttet med punktum, virket mindre oppriktige
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: GRA, marginTop: 8 }}>
                            oppriktig = ærlig, ment på ordentlig
                        </div>
                    </Kort>
                )}
                {beat === 3 && (
                    <motion.div
                        key="lapp"
                        initial={{ opacity: 0, rotate: -12, y: 30 }}
                        animate={{ opacity: 1, rotate: -4, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute"
                        style={{ left: 500, top: 110, width: 340, height: 250, background: '#fef08a', boxShadow: '0 12px 30px rgba(0,0,0,0.2)', padding: 28 }}
                    >
                        <div style={{ fontSize: 26, fontWeight: 700, color: GRA, fontStyle: 'italic' }}>Kino i kveld?</div>
                        <div style={{ fontSize: 56, fontWeight: 800, color: BLEKK, fontStyle: 'italic', marginTop: 12 }}>Ok.</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: GRONN, marginTop: 18, fontStyle: 'normal' }}>
                            Håndskrevet lapp: ikke det samme
                        </div>
                    </motion.div>
                )}
                {beat === 4 && (
                    <Kort key="nytt" style={{ left: 450, top: 150, width: 470, borderLeft: `8px solid ${GRONN}` }}>
                        <div style={{ fontSize: 30, fontWeight: 900, color: BLEKK }}>Linjeskift og emoji i stedet</div>
                        <div style={{ fontSize: 26, fontWeight: 700, color: GRONN, marginTop: 8 }}>
                            Ikke feil: et nytt språk for et nytt medium
                        </div>
                    </Kort>
                )}
            </AnimatePresence>
        </>
    );
}

function T({ t, uthev }: { t: string; uthev: boolean }) {
    return (
        <span
            style={{
                color: uthev ? '#fff' : BLEKK,
                background: uthev ? GULL : 'transparent',
                borderRadius: 6,
                padding: uthev ? '0 4px' : 0,
                transition: 'all 0.5s',
            }}
        >
            {t}
        </span>
    );
}

function Epost({ uthev }: { uthev: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute rounded-2xl overflow-hidden"
            style={{ left: 450, top: 60, width: 480, background: '#fff', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}
        >
            <div style={{ background: '#1e3a8a', color: '#fff', fontSize: 20, fontWeight: 800, padding: '10px 20px' }}>
                Ny e-post · Til: læreren
            </div>
            <div style={{ padding: '18px 24px', fontSize: 26, fontWeight: 600, color: BLEKK, lineHeight: 1.5 }}>
                <div>
                    Hei<T t="," uthev={uthev} /> Kari<T t="." uthev={uthev} />
                </div>
                <div>
                    Her er oppgaven min om tegnsetting<T t="." uthev={uthev} />
                </div>
                <div>
                    Kan du se på den før fredag<T t="?" uthev={uthev} />
                </div>
                <div style={{ marginTop: 10 }}>
                    Hilsen Mia
                </div>
            </div>
        </motion.div>
    );
}

function Formell({ beat }: { beat: number }) {
    return (
        <>
            <Mobil x={90}>
                <Melding tekst="ferdig m oppgaven?" />
                <Melding meg tekst="snart" forsinkelse={0.2} />
                <Melding meg tekst={<Smil />} forsinkelse={0.4} />
            </Mobil>
            <Epost uthev={beat === 1} />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort key="regler" style={{ left: 450, top: 380, width: 480 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BLEKK }}>oppgave · e-post · søknad</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: GRA, marginTop: 4 }}>her gjelder de vanlige reglene</div>
                    </Kort>
                )}
                {beat === 1 && (
                    <Kort key="bare" style={{ left: 450, top: 380, width: 480 }}>
                        <div style={{ fontSize: 26, fontWeight: 900, color: GULL }}>Punktum er bare punktum</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: GRA, marginTop: 4 }}>og kommaet redder fortsatt bestemor</div>
                    </Kort>
                )}
                {beat === 2 && (
                    <Kort key="begge" style={{ left: 450, top: 380, width: 480, textAlign: 'center', background: BLEKK }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>Kan du begge deler?</div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24' }}>Det er en superkraft</div>
                    </Kort>
                )}
            </AnimatePresence>
            {beat === 2 && (
                <>
                    <div className="absolute" style={{ left: 120, top: 8, fontSize: 20, fontWeight: 800, color: GRA }}>
                        chat: uformell
                    </div>
                    <div className="absolute" style={{ left: 450, top: 26, fontSize: 20, fontWeight: 800, color: GRA }}>
                        e-post: formell
                    </div>
                </>
            )}
        </>
    );
}

interface Props {
    modus: Modus;
}

export function TegnsettingChat({ beat, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'punktum';
    return (
        <Flate bakgrunn="linear-gradient(135deg, #e0e7ff 0%, #f8fafc 50%, #fce7f3 100%)">
            <div className="absolute inset-0" style={FONT}>
                {modus === 'punktum' && <Punktum beat={beat} />}
                {modus === 'formell' && <Formell beat={beat} />}
            </div>
        </Flate>
    );
}
