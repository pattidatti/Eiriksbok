import type { CSSProperties, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate } from '../shared';

/**
 * Setningsbenken: setninger som ordbrikker på et lyst ark, der tegnene flyr inn. Fire moduser:
 * - klister: ord som klistrer seg sammen, så mellomrom, så tegn.
 * - oppramsing: komma-jobb 1 og 2 (oppramsing og tiltale).
 * - leddsetning: komma-jobb 3. Klossene bytter plass, og kommaet følger med.
 * - hovedsetninger: komma-jobb 4. Ulike eller samme subjekt.
 */

type Modus = 'klister' | 'oppramsing' | 'leddsetning' | 'hovedsetninger';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLEKK = '#0f172a';
const GRA = '#64748b';
const GULL = '#d97706';
const BLA = '#2563eb';
const ORANSJE = '#ea580c';
const GRONN = '#15803d';
const ROD = '#dc2626';

/** Et tegn som flyr inn og står i gull. */
function K({ t, farge = GULL, stor = 1 }: { t: string; farge?: string; stor?: number }) {
    return (
        <motion.span
            initial={{ opacity: 0, y: -40, scale: 2.4 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 15, delay: 0.3 }}
            style={{ color: farge, display: 'inline-block', fontSize: `${stor}em`, fontWeight: 900 }}
        >
            {t}
        </motion.span>
    );
}

/** En klosse rundt en del av setningen. */
function Kloss({ farge, children, etikett }: { farge: string; children: ReactNode; etikett?: string }) {
    return (
        <motion.span
            layout
            transition={{ type: 'spring', stiffness: 140, damping: 20 }}
            className="relative inline-flex items-end"
            style={{
                background: `${farge}1f`,
                border: `3px solid ${farge}`,
                borderRadius: 14,
                padding: '4px 14px',
                margin: '0 4px',
            }}
        >
            {children}
            {etikett && (
                <span
                    className="absolute left-0 right-0 text-center"
                    style={{ top: '100%', marginTop: 8, fontSize: 18, fontWeight: 800, color: farge, whiteSpace: 'nowrap' }}
                >
                    {etikett}
                </span>
            )}
        </motion.span>
    );
}

function Linje({ children, str = 46, style }: { children: ReactNode; str?: number; style?: CSSProperties }) {
    return (
        <div
            className="flex flex-wrap items-end justify-center"
            style={{ fontSize: str, fontWeight: 800, color: BLEKK, lineHeight: 1.25, ...style }}
        >
            {children}
        </div>
    );
}

function Merk({ tekst, farge, style }: { tekst: ReactNode; farge: string; style?: CSSProperties }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-xl"
            style={{
                display: 'inline-block',
                background: farge,
                color: '#fff',
                fontSize: 24,
                fontWeight: 800,
                padding: '6px 16px',
                ...style,
            }}
        >
            {tekst}
        </motion.div>
    );
}

/** Rødt kryss eller grønn hake ved siden av teksten. Teksten står urørt. */
function Dom({ ok }: { ok: boolean }) {
    return (
        <span
            className="inline-flex items-center justify-center rounded-full"
            style={{
                width: 46,
                height: 46,
                background: ok ? GRONN : ROD,
                color: '#fff',
                fontSize: 30,
                fontWeight: 900,
                marginRight: 18,
                flex: 'none',
            }}
        >
            {ok ? '✓' : '✗'}
        </span>
    );
}

/** De fire komma-jobbene øverst. Den som gjelder nå, lyser. */
const JOBBER = ['oppramsing', 'tiltale', 'leddsetning', 'to hele setninger'];
function Jobber({ aktiv }: { aktiv: number }) {
    return (
        <div className="absolute left-0 right-0 flex justify-center gap-3" style={{ top: 24 }}>
            {JOBBER.map((j, i) => (
                <motion.div
                    key={j}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: i === aktiv ? 1 : 0.45, y: 0, scale: i === aktiv ? 1.08 : 1 }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="rounded-full"
                    style={{
                        background: i === aktiv ? BLEKK : '#e2e8f0',
                        color: i === aktiv ? '#fff' : BLEKK,
                        fontSize: 20,
                        fontWeight: 800,
                        padding: '6px 16px',
                    }}
                >
                    {i + 1}. {j}
                </motion.div>
            ))}
        </div>
    );
}

function Sentrert({ children, top = 120 }: { children: ReactNode; top?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute left-0 right-0 flex flex-col items-center"
            style={{ top: top + 50, gap: 26 }}
        >
            {children}
        </motion.div>
    );
}

// ---------- Modusene ----------

function Klister({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <Sentrert top={170}>
                <motion.div
                    animate={{ x: [0, -4, 4, -3, 3, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }}
                    style={{ fontSize: 50, fontWeight: 900, color: '#94a3b8', letterSpacing: -1 }}
                >
                    hundensomhettassensovpåsofaen
                </motion.div>
                <Merk tekst="Uten tegn klistrer ordene seg sammen" farge={ROD} />
            </Sentrert>
        );
    if (beat === 1)
        return (
            <Sentrert top={120}>
                <div style={{ fontSize: 30, fontWeight: 800, color: GRA }}>interpunksjon</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: BLEKK }}>= bruken av skilletegn i en tekst</div>
                <Linje str={44} style={{ color: '#94a3b8', marginTop: 30 }}>
                    hunden som het tassen sov på sofaen
                </Linje>
                <div style={{ fontSize: 22, fontWeight: 700, color: GRA }}>et eget system i skriftspråket</div>
            </Sentrert>
        );
    if (beat === 2)
        return (
            <Sentrert top={120}>
                <Linje str={42}>
                    <span>Hunden</span>
                    <K t="," />
                    <span style={{ marginLeft: 16 }}>som het Tassen</span>
                    <K t="," />
                    <span style={{ marginLeft: 16 }}>sov på sofaen</span>
                    <K t="." />
                </Linje>
                <div className="flex gap-3" style={{ marginTop: 40 }}>
                    {['stoppe', 'puste', 'ny stemme', 'spørsmål'].map((o, i) => (
                        <motion.div
                            key={o}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 + i * 0.5 }}
                            className="rounded-2xl"
                            style={{ background: BLEKK, color: '#fff', fontSize: 26, fontWeight: 800, padding: '10px 22px' }}
                        >
                            {o}
                        </motion.div>
                    ))}
                </div>
            </Sentrert>
        );
    return (
        <Sentrert top={110}>
            <Linje str={44} style={{ color: '#94a3b8' }}>
                Hunden, som het Tassen, sov på sofaen.
            </Linje>
            <div className="flex gap-5" style={{ marginTop: 20 }}>
                {['rytme', 'retning', 'presisjon'].map((o, i) => (
                    <motion.div
                        key={o}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.5 }}
                        className="rounded-2xl"
                        style={{
                            background: i === 2 ? GULL : '#fff',
                            color: i === 2 ? '#fff' : BLEKK,
                            border: `3px solid ${i === 2 ? GULL : BLEKK}`,
                            fontSize: 34,
                            fontWeight: 900,
                            padding: '10px 28px',
                        }}
                    >
                        {o}
                    </motion.div>
                ))}
            </div>
            <Merk tekst="presisjon: leseren forstår akkurat det du mener" farge={BLEKK} />
        </Sentrert>
    );
}

function Oppramsing({ beat }: { beat: number }) {
    const aktiv = beat >= 4 ? 1 : 0;
    return (
        <>
            {beat >= 1 && <Jobber aktiv={aktiv} />}
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Sentrert key="krasj" top={170}>
                        <div className="flex items-center" style={{ gap: 0 }}>
                            {['pizza', 'brus', 'sjokolade'].map((o, i) => (
                                <motion.span
                                    key={o}
                                    initial={{ x: (i - 1) * 220 }}
                                    animate={{ x: (i - 1) * -10 }}
                                    transition={{ duration: 1.2, delay: 0.4, ease: 'easeIn' }}
                                    className="rounded-2xl"
                                    style={{
                                        background: [BLA, ORANSJE, GRONN][i],
                                        color: '#fff',
                                        fontSize: 40,
                                        fontWeight: 900,
                                        padding: '8px 20px',
                                    }}
                                >
                                    {o}
                                </motion.span>
                            ))}
                        </div>
                        <Merk tekst="Komma skiller ledd som ellers krasjer" farge={BLEKK} />
                    </Sentrert>
                )}
                {beat === 1 && (
                    <Sentrert key="uten" top={190}>
                        <Linje style={{ color: '#94a3b8' }}>Jeg hadde med pizza brus sjokolade</Linje>
                        <Merk tekst="Jobb 1: oppramsing" farge={BLEKK} />
                    </Sentrert>
                )}
                {beat === 2 && (
                    <Sentrert key="med" top={190}>
                        <Linje str={40}>
                            <span>Jeg hadde med pizza</span>
                            <K t="," />
                            <span style={{ marginLeft: 16 }}>brus</span>
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                style={{ marginLeft: 16, color: GRONN }}
                            >
                                og
                            </motion.span>
                            <span style={{ marginLeft: 16 }}>sjokolade</span>
                            <K t="." />
                        </Linje>
                        <Merk tekst={<>komma mellom tingene · «og» foran den siste</>} farge={GULL} />
                    </Sentrert>
                )}
                {beat === 3 && (
                    <Sentrert key="feil" top={150}>
                        <div className="flex items-center">
                            <Dom ok />
                            <Linje str={36}>Jeg hadde med pizza, brus og sjokolade.</Linje>
                        </div>
                        <div className="flex items-center">
                            <Dom ok={false} />
                            <Linje str={36} style={{ color: '#7f1d1d' }}>
                                <span>
                                    Jeg hadde med pizza, brus<span style={{ color: ROD }}>,</span> og sjokolade.
                                </span>
                            </Linje>
                        </div>
                        <Merk tekst="På norsk: ikke komma foran «og» i en oppramsing" farge={ROD} />
                    </Sentrert>
                )}
                {beat === 4 && (
                    <Sentrert key="mia" top={160}>
                        <Linje str={84}>
                            <span>Hei</span>
                            <K t="," />
                            <span style={{ marginLeft: 26, color: BLA }}>Mia</span>
                            <K t="." />
                        </Linje>
                        <Merk tekst="Jobb 2: tiltale · navnet på den du snakker til" farge={BLA} />
                    </Sentrert>
                )}
                {beat === 5 && (
                    <Sentrert key="bestemor" top={140}>
                        <div className="flex items-center">
                            <Dom ok={false} />
                            <Linje str={52} style={{ color: '#7f1d1d' }}>
                                «Spis bestemor!»
                            </Linje>
                            <span style={{ fontSize: 22, fontWeight: 700, color: ROD, marginLeft: 20, width: 260 }}>
                                bestemor blir en del av setningen
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Dom ok />
                            <Linje str={52}>
                                «Spis<span style={{ color: GULL }}>,</span>&nbsp;bestemor!»
                            </Linje>
                            <span style={{ fontSize: 22, fontWeight: 700, color: GRONN, marginLeft: 20, width: 260 }}>
                                bestemor er den du snakker til
                            </span>
                        </div>
                    </Sentrert>
                )}
            </AnimatePresence>
        </>
    );
}

function Leddsetning({ beat }: { beat: number }) {
    return (
        <>
            <Jobber aktiv={2} />
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Sentrert key="to" top={130}>
                        <div className="flex items-center">
                            <Dom ok />
                            <Linje str={44}>
                                <Kloss farge={BLA}>Vi går ut.</Kloss>
                            </Linje>
                            <span style={{ fontSize: 22, fontWeight: 800, color: BLA, marginLeft: 16, width: 290 }}>
                                hovedsetning: kan stå alene
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Dom ok={false} />
                            <Linje str={44}>
                                <Kloss farge={ORANSJE}>når klokka ringer</Kloss>
                            </Linje>
                            <span style={{ fontSize: 22, fontWeight: 800, color: ORANSJE, marginLeft: 16, width: 290 }}>
                                leddsetning: kan ikke stå alene
                            </span>
                        </div>
                    </Sentrert>
                )}
                {beat === 1 && (
                    <Sentrert key="bindeord" top={140}>
                        <div style={{ fontSize: 30, fontWeight: 800, color: GRA }}>Bindeordet hekter leddsetningen på</div>
                        <div className="flex gap-3">
                            {['fordi', 'som', 'da', 'hvis', 'når'].map((o, i) => (
                                <motion.div
                                    key={o}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.35 }}
                                    className="rounded-2xl"
                                    style={{
                                        border: `3px solid ${ORANSJE}`,
                                        background: '#fff7ed',
                                        color: ORANSJE,
                                        fontSize: 40,
                                        fontWeight: 900,
                                        padding: '8px 24px',
                                    }}
                                >
                                    {o}
                                </motion.div>
                            ))}
                        </div>
                    </Sentrert>
                )}
                {beat >= 2 && beat <= 4 && (
                    <Sentrert key="rekke" top={150}>
                        <Linje str={38}>
                            {beat === 2 && (
                                <>
                                    <Kloss farge={ORANSJE} etikett="leddsetning">
                                        Når klokka ringer
                                    </Kloss>
                                    <K t="," stor={1.3} />
                                    <Kloss farge={BLA} etikett="hovedsetning">
                                        går vi ut.
                                    </Kloss>
                                </>
                            )}
                            {beat === 3 && (
                                <>
                                    <Kloss farge={BLA} etikett="hovedsetning">
                                        Vi går ut
                                    </Kloss>
                                    <Kloss farge={ORANSJE} etikett="leddsetning">
                                        når klokka ringer.
                                    </Kloss>
                                </>
                            )}
                            {beat === 4 && (
                                <>
                                    <Kloss farge={BLA}>Hunden</Kloss>
                                    <K t="," stor={1.3} />
                                    <Kloss farge={ORANSJE} etikett="leddsetning">
                                        som het Tassen
                                    </Kloss>
                                    <K t="," stor={1.3} />
                                    <Kloss farge={BLA}>sov på sofaen.</Kloss>
                                </>
                            )}
                        </Linje>
                        <div style={{ marginTop: 50 }}>
                            {beat === 2 && <Merk tekst="Leddsetningen først: sett komma" farge={GULL} />}
                            {beat === 3 && <Merk tekst="Leddsetningen sist: ofte uten komma" farge={GRA} />}
                            {beat === 4 && <Merk tekst="Midt inni: komma på begge sider" farge={GULL} />}
                        </div>
                    </Sentrert>
                )}
            </AnimatePresence>
        </>
    );
}

function Subj({ t, farge, synlig }: { t: string; farge: string; synlig: boolean }) {
    return (
        <span
            style={{
                color: synlig ? farge : BLEKK,
                borderBottom: synlig ? `6px solid ${farge}` : '6px solid transparent',
                transition: 'all 0.6s',
            }}
        >
            {t}
        </span>
    );
}

function Hovedsetninger({ beat }: { beat: number }) {
    return (
        <>
            <Jobber aktiv={3} />
            <AnimatePresence mode="wait">
                {beat <= 1 && (
                    <Sentrert key="to" top={130}>
                        <Linje str={46}>
                            <Kloss farge={BLA}>
                                <Subj t="Jeg" farge={BLA} synlig={beat === 1} />
                                &nbsp;løp ut
                            </Kloss>
                            <span style={{ width: 40 }} />
                            <Kloss farge={ORANSJE}>
                                <Subj t="hunden" farge={ORANSJE} synlig={beat === 1} />
                                &nbsp;fulgte etter
                            </Kloss>
                        </Linje>
                        {beat === 0 && (
                            <div className="flex gap-3" style={{ marginTop: 20 }}>
                                {['og', 'men', 'for', 'eller', 'så'].map((o, i) => (
                                    <motion.div
                                        key={o}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + i * 0.3 }}
                                        className="rounded-2xl"
                                        style={{ background: BLEKK, color: '#fff', fontSize: 36, fontWeight: 900, padding: '6px 22px' }}
                                    >
                                        {o}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        {beat === 1 && <Merk tekst="Subjekt = den som gjør noe i setningen" farge={BLEKK} style={{ marginTop: 20 }} />}
                    </Sentrert>
                )}
                {beat === 2 && (
                    <Sentrert key="ulik" top={150}>
                        <Linje str={44}>
                            <Subj t="Jeg" farge={BLA} synlig />
                            <span>&nbsp;løp ut</span>
                            <K t="," stor={1.2} />
                            <span>&nbsp;og&nbsp;</span>
                            <Subj t="hunden" farge={ORANSJE} synlig />
                            <span>&nbsp;fulgte etter.</span>
                        </Linje>
                        <Merk tekst="To ulike subjekter: komma foran «og»" farge={GULL} style={{ marginTop: 30 }} />
                    </Sentrert>
                )}
                {beat === 3 && (
                    <Sentrert key="samme" top={150}>
                        <Linje str={52}>
                            <Subj t="Jeg" farge={BLA} synlig />
                            <span>&nbsp;løp ut og lukket døra.</span>
                        </Linje>
                        <div className="flex gap-4" style={{ marginTop: 10 }}>
                            {['løp ut', 'lukket døra'].map((h, i) => (
                                <motion.div
                                    key={h}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 + i * 0.5 }}
                                    style={{ fontSize: 24, fontWeight: 800, color: BLA }}
                                >
                                    jeg: {h}
                                </motion.div>
                            ))}
                        </div>
                        <Merk tekst="Samme subjekt: du kan droppe kommaet" farge={GRA} style={{ marginTop: 20 }} />
                    </Sentrert>
                )}
            </AnimatePresence>
        </>
    );
}

interface Props {
    modus: Modus;
}

export function TegnsettingSetning({ beat, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'klister';
    return (
        <Flate bakgrunn="linear-gradient(160deg, #fffbeb 0%, #ffffff 55%, #eff6ff 100%)">
            <div className="absolute inset-0" style={FONT}>
                {/* Linjene i skriveboka */}
                {[...Array(9)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute left-0 right-0"
                        style={{ top: 70 + i * 56, height: 1, background: '#dbeafe' }}
                    />
                ))}
                <div className="absolute" style={{ left: 70, top: 0, bottom: 0, width: 2, background: '#fecaca' }} />
                <AnimatePresence mode="wait">
                    <motion.div key={`${modus}-${modus === 'klister' ? beat : 0}`} className="absolute inset-0">
                        {modus === 'klister' && <Klister beat={beat} />}
                        {modus === 'oppramsing' && <Oppramsing beat={beat} />}
                        {modus === 'leddsetning' && <Leddsetning beat={beat} />}
                        {modus === 'hovedsetninger' && <Hovedsetninger beat={beat} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </Flate>
    );
}
