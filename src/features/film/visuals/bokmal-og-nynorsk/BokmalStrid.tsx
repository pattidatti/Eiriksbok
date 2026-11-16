import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Flate, TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Striden om skriftspråket, og hvordan den endte i loven.
 *
 *  - samnorsk: to veier side om side. Skoler, aviser og politikere velger side. Planen om å
 *              smelte dem sammen, og to broer: reformene i 1917 og 1938
 *  - aksjon:   foreldre streker over de nye formene, 400 000 underskrifter, regjeringen gir
 *              etter, og tilnærmingsparagrafen blir fjernet i 2002
 *  - vekt:     en vekt for makt og klasse. Bygda mot byen, forfatterne mot aviser og radio
 *  - lov:      samme vekt i balanse: Språklova fra 2022, med et ekstra vern for nynorsk
 */

type Modus = 'samnorsk' | 'aksjon' | 'vekt' | 'lov';

const BM = '#1d4ed8';
const NN = '#7c3aed';
const ROD = '#b91c1c';

function Kort({
    children,
    top = 22,
    farge = 'white',
}: {
    children: ReactNode;
    top?: number;
    farge?: string;
}) {
    return (
        <div className="absolute inset-x-0 flex justify-center" style={{ top }}>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl shadow-xl text-center"
                style={{ padding: '10px 26px', background: farge }}
            >
                {children}
            </motion.div>
        </div>
    );
}

function Tittel({ children, farge = '#1c1917' }: { children: ReactNode; farge?: string }) {
    return (
        <div
            className="font-display font-black"
            style={{ fontSize: 32, color: farge, lineHeight: 1.15 }}
        >
            {children}
        </div>
    );
}

function Under({ children }: { children: ReactNode }) {
    return (
        <div className="font-semibold" style={{ fontSize: 20, color: '#57534e' }}>
            {children}
        </div>
    );
}

/* ---------------- samnorsk ---------------- */

const VEI_Y = { bm: 200, nn: 400 };

function vei(y: number, mot: boolean) {
    // Rett vei, eller en vei som bøyer mot midten på høyre side.
    const slutt = mot ? 300 : y;
    return `M 60 ${y} C 450 ${y}, 650 ${y}, 760 ${(y + slutt) / 2} S 900 ${slutt}, 960 ${slutt}`;
}

function Lapp({ x, y, tekst, farge }: { x: number; y: number; tekst: string; farge: string }) {
    return (
        <div className="absolute" style={{ left: x, top: y }}>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl shadow-md bg-white font-bold"
                style={{
                    fontSize: 20,
                    padding: '4px 14px',
                    color: farge,
                    border: `3px solid ${farge}`,
                }}
            >
                {tekst}
            </motion.div>
        </div>
    );
}

function Samnorsk({ beat }: { beat: number }) {
    const mot = beat >= 2;
    return (
        <Flate bakgrunn="#f4f1ea">
            <svg viewBox="0 0 1000 562" className="absolute inset-0" width={1000} height={562}>
                {/* Gnister mellom veiene: krangelen */}
                {beat <= 1 &&
                    [180, 330, 480, 630].map((x, i) => (
                        <motion.path
                            key={x}
                            d={`M ${x} 232 L ${x + 18} 270 L ${x - 6} 300 L ${x + 14} 336 L ${x - 4} 368`}
                            fill="none"
                            stroke={ROD}
                            strokeWidth={6}
                            strokeLinejoin="round"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0.2, 1] }}
                            transition={{
                                duration: 1.6,
                                delay: i * 0.3,
                                repeat: Infinity,
                                repeatType: 'mirror',
                            }}
                        />
                    ))}
                <motion.path
                    d={vei(VEI_Y.bm, false)}
                    animate={{ d: vei(VEI_Y.bm, mot) }}
                    transition={{ duration: 1.4 }}
                    fill="none"
                    stroke={BM}
                    strokeWidth={26}
                    strokeLinecap="round"
                />
                <motion.path
                    d={vei(VEI_Y.nn, false)}
                    animate={{ d: vei(VEI_Y.nn, mot) }}
                    transition={{ duration: 1.4 }}
                    fill="none"
                    stroke={NN}
                    strokeWidth={26}
                    strokeLinecap="round"
                />
                {/* Broene: reformene i 1917 og 1938 */}
                {beat >= 3 &&
                    [380, 600].map((x, i) => (
                        <motion.rect
                            key={x}
                            x={x - 16}
                            y={VEI_Y.bm + 12}
                            width={32}
                            height={VEI_Y.nn - VEI_Y.bm - 24}
                            rx={6}
                            fill="#a16207"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 + i * 0.9 }}
                        />
                    ))}
                {beat >= 2 && (
                    <motion.circle
                        cx={960}
                        cy={300}
                        r={30}
                        fill="#0f766e"
                        stroke="white"
                        strokeWidth={5}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                    />
                )}
            </svg>
            <div
                className="absolute font-display font-black"
                style={{ left: 70, top: 140, fontSize: 30, color: BM }}
            >
                bokmål
            </div>
            <div
                className="absolute font-display font-black"
                style={{ left: 70, top: 428, fontSize: 30, color: NN }}
            >
                nynorsk
            </div>
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <Kort key="krangel" top={22}>
                        <Tittel farge={ROD}>Krangel om skriftspråket</Tittel>
                        <Under>fra slutten av 1800-tallet og hele 1900-tallet</Under>
                    </Kort>
                )}
                {beat === 2 && (
                    <Kort key="plan" top={22}>
                        <Tittel farge="#0f766e">Planen: samnorsk</Tittel>
                        <Under>smelte sammen til ett språk i fremtiden</Under>
                    </Kort>
                )}
                {beat >= 3 && (
                    <Kort key="reform" top={22}>
                        <Tittel>Rettskrivingsreformer</Tittel>
                        <Under>nye regler for hvordan ordene skrives</Under>
                    </Kort>
                )}
            </AnimatePresence>
            {beat === 1 && (
                <>
                    <Lapp x={250} y={120} tekst="skoler" farge={BM} />
                    <Lapp x={440} y={120} tekst="aviser" farge={BM} />
                    <Lapp x={630} y={120} tekst="politikere" farge={BM} />
                    <Lapp x={250} y={436} tekst="skoler" farge={NN} />
                    <Lapp x={440} y={436} tekst="aviser" farge={NN} />
                    <Lapp x={630} y={436} tekst="politikere" farge={NN} />
                </>
            )}
            {beat >= 2 && (
                <div className="absolute" style={{ left: 800, top: 340 }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="font-display font-black"
                        style={{ fontSize: 28, color: '#0f766e' }}
                    >
                        samnorsk?
                    </motion.div>
                </div>
            )}
            {beat >= 3 &&
                [
                    { x: 380, t: '1917' },
                    { x: 600, t: '1938' },
                ].map((b, i) => (
                    <div
                        key={b.t}
                        className="absolute flex justify-center"
                        style={{ left: b.x - 60, top: 282, width: 120 }}
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 + i * 0.9 }}
                            className="rounded-lg bg-white shadow-lg font-display font-black"
                            style={{ fontSize: 26, padding: '0 12px', color: '#a16207' }}
                        >
                            {b.t}
                        </motion.div>
                    </div>
                ))}
        </Flate>
    );
}

/* ---------------- aksjon ---------------- */

function Bok({ strek }: { strek: boolean }) {
    const rader = [0, 1, 2, 3, 4, 5];
    return (
        <div
            className="relative rounded-lg shadow-2xl"
            style={{
                width: 340,
                height: 280,
                background: '#fbf5e6',
                padding: '26px 24px',
                border: '2px solid #e7dcc2',
            }}
        >
            {rader.map((r) => (
                <div key={r} className="flex items-center" style={{ gap: 9, marginBottom: 18 }}>
                    {[5, 4, 6, 3, 5].map((l, o) => {
                        const ny = (r + o) % 4 === 1;
                        return (
                            <div key={o} className="relative" style={{ width: l * 9, height: 16 }}>
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: 4,
                                        background: ny ? '#d97706' : '#44403c',
                                        opacity: 0.85,
                                    }}
                                />
                                {ny && strek && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: 1 }}
                                        transition={{ delay: 0.6 + r * 0.25, duration: 0.3 }}
                                        className="absolute origin-left"
                                        style={{
                                            left: -6,
                                            top: 4,
                                            width: l * 9 + 12,
                                            height: 8,
                                            borderRadius: 4,
                                            background: ROD,
                                        }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function Aksjon({ beat }: { beat: number }) {
    return (
        <Flate bakgrunn="#efe9dc">
            <AnimatePresence mode="wait">
                {beat === 0 && (
                    <motion.div
                        key="strek"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute" style={{ left: 110, top: 150 }}>
                            <Bok strek />
                        </div>
                        <div className="absolute" style={{ left: 520, top: 170, width: 400 }}>
                            <div
                                className="rounded-2xl shadow-xl bg-white"
                                style={{ padding: '16px 24px' }}
                            >
                                <Tittel>Foreldrene streker over</Tittel>
                                <Under>de nye formene i skolebøkene</Under>
                            </div>
                            <div className="flex items-center" style={{ gap: 12, marginTop: 22 }}>
                                <div
                                    style={{
                                        width: 40,
                                        height: 16,
                                        borderRadius: 4,
                                        background: '#d97706',
                                    }}
                                />
                                <div
                                    className="font-bold"
                                    style={{ fontSize: 20, color: '#92400e' }}
                                >
                                    nye former, for å føre språkene sammen
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {beat === 1 && (
                    <motion.div
                        key="underskrift"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Kort top={36}>
                            <Under>1953: Foreldreaksjonen mot samnorsk</Under>
                        </Kort>
                        <div
                            className="absolute inset-x-0 flex justify-center items-end"
                            style={{ top: 140, gap: 14 }}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: 60 + ((i * 37) % 70) }}
                                    transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }}
                                    style={{
                                        width: 46,
                                        background:
                                            'repeating-linear-gradient(#fffdf6 0 5px, #d6cfbd 5px 7px)',
                                        borderRadius: 3,
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    }}
                                />
                            ))}
                        </div>
                        <div
                            className="absolute inset-x-0 flex justify-center"
                            style={{ top: 320 }}
                        >
                            <div className="text-center">
                                <div
                                    className="font-display font-black tabular-nums"
                                    style={{ fontSize: 86, color: '#1c1917', lineHeight: 1 }}
                                >
                                    over{' '}
                                    <TelleTall verdi={400000} varighet={2.4} forsinkelse={0.4} />
                                </div>
                                <div
                                    className="font-display font-bold"
                                    style={{ fontSize: 30, color: ROD }}
                                >
                                    underskrifter
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                {beat === 2 && (
                    <motion.div
                        key="etter"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="absolute" style={{ left: 110, top: 150 }}>
                            <Bok strek={false} />
                        </div>
                        <div className="absolute" style={{ left: 520, top: 170, width: 400 }}>
                            <div
                                className="rounded-2xl shadow-xl bg-white"
                                style={{ padding: '16px 24px' }}
                            >
                                <Under>Året etter: regjeringen gir etter</Under>
                                <Tittel>Tradisjonelle bokmålsformer tillatt</Tittel>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.6 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.8 }}
                                className="flex items-center justify-center rounded-full font-black"
                                style={{
                                    width: 70,
                                    height: 70,
                                    marginTop: 20,
                                    background: '#15803d',
                                    color: 'white',
                                    fontSize: 42,
                                }}
                            >
                                ✓
                            </motion.div>
                        </div>
                    </motion.div>
                )}
                {beat >= 3 && (
                    <motion.div
                        key="paragraf"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Kort top={36}>
                            <Tittel>2002: Stortinget fjerner tilnærmingsparagrafen</Tittel>
                            <Under>regelen om at språkene skulle nærme seg hverandre</Under>
                        </Kort>
                        <div
                            className="absolute inset-x-0 flex justify-center items-center"
                            style={{ top: 210, gap: 40 }}
                        >
                            <div
                                className="rounded-3xl shadow-2xl flex items-center justify-center font-serif font-black"
                                style={{
                                    width: 220,
                                    height: 220,
                                    background: '#fbf5e6',
                                    fontSize: 150,
                                    color: '#44403c',
                                }}
                            >
                                §
                            </div>
                            <motion.div
                                initial={{ opacity: 0, scale: 1.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    delay: 0.8,
                                    type: 'spring',
                                    stiffness: 220,
                                    damping: 15,
                                }}
                                className="flex items-center justify-center rounded-full font-black"
                                style={{
                                    width: 120,
                                    height: 120,
                                    background: ROD,
                                    color: 'white',
                                    fontSize: 80,
                                }}
                            >
                                ✕
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Flate>
    );
}

/* ---------------- vekt og lov ---------------- */

const SENTER = { x: 500, y: 190 };
const ARM = 280;

function Vekt({ beat, modus }: { beat: number; modus: 'vekt' | 'lov' }) {
    // Helning i grader: positiv = bokmål-siden (høyre) går ned.
    const helning = modus === 'lov' ? 0 : [0, 10, 4, 12][Math.min(beat, 3)];
    const rad = (helning * Math.PI) / 180;
    const vx = SENTER.x - Math.cos(rad) * ARM;
    const vy = SENTER.y - Math.sin(rad) * ARM;
    const hx = SENTER.x + Math.cos(rad) * ARM;
    const hy = SENTER.y + Math.sin(rad) * ARM;
    const SNOR = 120;

    const venstre: string[] =
        modus === 'lov'
            ? []
            : beat >= 2
              ? ['bygda', 'Vesaas', 'Hauge']
              : beat >= 1
                ? ['bygda']
                : [];
    const hoyre: string[] =
        modus === 'lov'
            ? []
            : beat >= 3
              ? ['byene', 'aviser', 'radio', 'fjernsyn']
              : beat >= 1
                ? ['byene', 'de utdannede']
                : [];

    return (
        <Flate bakgrunn={modus === 'lov' ? '#eef4ee' : '#f3efe6'}>
            <svg viewBox="0 0 1000 562" className="absolute inset-0" width={1000} height={562}>
                {/* Foten */}
                <path
                    d={`M ${SENTER.x - 90} 540 L ${SENTER.x + 90} 540 L ${SENTER.x + 20} 500 L ${SENTER.x - 20} 500 Z`}
                    fill="#57534e"
                />
                <rect x={SENTER.x - 10} y={SENTER.y} width={20} height={310} fill="#78716c" />
                {/* Armen */}
                <motion.line
                    initial={false}
                    animate={{ x1: vx, y1: vy, x2: hx, y2: hy }}
                    transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                    stroke="#44403c"
                    strokeWidth={14}
                    strokeLinecap="round"
                />
                <circle cx={SENTER.x} cy={SENTER.y} r={18} fill="#a16207" />
                {/* Snorene */}
                {[
                    { x: vx, y: vy },
                    { x: hx, y: hy },
                ].map((p, i) => (
                    <motion.path
                        key={i}
                        initial={false}
                        animate={{
                            d: `M ${p.x} ${p.y} L ${p.x - 70} ${p.y + SNOR} M ${p.x} ${p.y} L ${p.x + 70} ${p.y + SNOR}`,
                        }}
                        transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                        stroke="#78716c"
                        strokeWidth={4}
                        fill="none"
                    />
                ))}
            </svg>
            {/* Skålene: DOM, så teksten kan måles */}
            {[
                { x: vx, y: vy, navn: 'nynorsk', farge: NN, ting: venstre },
                { x: hx, y: hy, navn: 'bokmål', farge: BM, ting: hoyre },
            ].map((s) => (
                <motion.div
                    key={s.navn}
                    className="absolute flex flex-col items-center"
                    initial={false}
                    animate={{ left: s.x - 95, top: s.y + SNOR - 10 }}
                    transition={{ type: 'spring', stiffness: 60, damping: 12 }}
                    style={{ width: 190 }}
                >
                    <div
                        className="flex flex-wrap justify-center"
                        style={{
                            gap: 4,
                            width: 190,
                            marginBottom: 4,
                            minHeight: 10,
                            transform: 'translateY(-100%)',
                            position: 'absolute',
                            top: 0,
                        }}
                    >
                        {s.ting.map((t) => (
                            <motion.div
                                key={t}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg font-bold"
                                style={{
                                    background: 'white',
                                    border: `2px solid ${s.farge}`,
                                    color: s.farge,
                                    fontSize: 20,
                                    padding: '1px 9px',
                                }}
                            >
                                {t}
                            </motion.div>
                        ))}
                    </div>
                    <div
                        className="rounded-b-full flex items-start justify-center font-display font-black"
                        style={{
                            width: 190,
                            height: 46,
                            background: s.farge,
                            color: 'white',
                            fontSize: 24,
                            paddingTop: 4,
                        }}
                    >
                        {s.navn}
                    </div>
                </motion.div>
            ))}
            {modus === 'lov' && beat === 2 && (
                <div
                    className="absolute inset-x-0 flex justify-center"
                    style={{ top: 330, gap: 16 }}
                >
                    {['bruke', 'utvikle', 'styrke'].map((t, i) => (
                        <motion.div
                            key={t}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + i * 0.5 }}
                            className="rounded-xl shadow-lg bg-white font-display font-black"
                            style={{
                                fontSize: 26,
                                padding: '6px 18px',
                                color: '#166534',
                                border: '3px solid #166534',
                            }}
                        >
                            {t}
                        </motion.div>
                    ))}
                </div>
            )}
            {modus === 'lov' && beat >= 3 && (
                <motion.div
                    className="absolute flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ left: vx - 150, top: vy + SNOR + 50, width: 300 }}
                >
                    <div
                        className="flex items-center rounded-2xl shadow-xl bg-white"
                        style={{ padding: '6px 14px', gap: 10 }}
                    >
                        <svg width={36} height={42} viewBox="0 0 36 42">
                            <path
                                d="M18 2 L34 8 V20 C34 31 26 38 18 41 C10 38 2 31 2 20 V8 Z"
                                fill={NN}
                            />
                        </svg>
                        <div className="font-bold" style={{ fontSize: 19, color: '#4c1d95' }}>
                            ekstra vern: minst brukt
                        </div>
                    </div>
                </motion.div>
            )}
            <AnimatePresence mode="wait">
                {modus === 'vekt' && beat === 0 && (
                    <Kort key="makt">
                        <Tittel>Ikke bare språk</Tittel>
                        <Under>også makt og klasse</Under>
                    </Kort>
                )}
                {modus === 'vekt' && beat === 1 && (
                    <Kort key="by">
                        <Tittel>Bygda mot byen</Tittel>
                        <Under>slik mange så det</Under>
                    </Kort>
                )}
                {modus === 'vekt' && beat === 2 && (
                    <Kort key="lit">
                        <Tittel farge={NN}>Stor litteratur på nynorsk</Tittel>
                        <Under>Tarjei Vesaas og Olav H. Hauge</Under>
                    </Kort>
                )}
                {modus === 'vekt' && beat >= 3 && (
                    <Kort key="medier">
                        <Tittel farge={BM}>Bokmål rådde</Tittel>
                        <Under>i de fleste aviser, i radio og senere fjernsyn</Under>
                    </Kort>
                )}
                {modus === 'lov' && beat === 0 && (
                    <Kort key="lova">
                        <Tittel farge="#166534">Språklova</Tittel>
                        <Under>gjelder fra 1. januar 2022</Under>
                    </Kort>
                )}
                {modus === 'lov' && beat === 1 && (
                    <Kort key="like">
                        <Tittel farge="#166534">Likeverdige</Tittel>
                        <Under>begge kan brukes på alle områder i samfunnet</Under>
                    </Kort>
                )}
                {modus === 'lov' && beat === 2 && (
                    <Kort key="plikt">
                        <Tittel farge="#166534">Staten og kommunene må</Tittel>
                        <Under>bruke, utvikle og styrke begge</Under>
                    </Kort>
                )}
                {modus === 'lov' && beat >= 3 && (
                    <Kort key="vern">
                        <Tittel farge={NN}>Ekstra vern for nynorsk</Tittel>
                        <Under>fordi det er det minst brukte</Under>
                    </Kort>
                )}
            </AnimatePresence>
        </Flate>
    );
}

export function BokmalStrid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'samnorsk';
    if (modus === 'aksjon') return <Aksjon beat={beat} />;
    if (modus === 'vekt' || modus === 'lov') return <Vekt beat={beat} modus={modus} />;
    return <Samnorsk beat={beat} />;
}
