import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Setningsverkstedet: en plakat der setninger bygges om med grep. Fire moduser:
 * - anafora: tre setninger som starter likt, og starten banker.
 * - treklang: en trekant som fylles med tre ord, ett eksempel per beat.
 * - telling: to, fire og tre klosser, og hvor tre dukker opp.
 * - kontrast: et lyst og et mørkt felt med motsetningene.
 */

type Modus = 'anafora' | 'treklang' | 'telling' | 'kontrast';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLEKK = '#0f172a';
const GRA = '#64748b';
const INDIGO = '#4f46e5';
const GRONN = '#059669';
const ROD = '#e11d48';
const GULL = '#f59e0b';

/** Vises fra den beaten den slås på. Skjult innhold rendres ikke, så det ikke ligger oppå tekst. */
function Vis({ synlig, children, forsinkelse = 0 }: { synlig: boolean; children: ReactNode; forsinkelse?: number }) {
    if (!synlig) return null;
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.7, delay: synlig ? forsinkelse : 0 }}
        >
            {children}
        </motion.g>
    );
}

function T({
    x,
    y,
    tekst,
    str = 44,
    farge = BLEKK,
    vekt = 700,
    anker = 'middle',
}: {
    x: number;
    y: number;
    tekst: string;
    str?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <text x={x} y={y} textAnchor={anker} fontSize={str} fontWeight={vekt} fill={farge} style={FONT}>
            {tekst}
        </text>
    );
}

function Tittel({ tekst, under, farge }: { tekst: string; under: string; farge: string }) {
    return (
        <g>
            <T x={110} y={130} tekst={tekst} str={84} vekt={900} farge={farge} anker="start" />
            <T x={112} y={190} tekst={under} str={38} vekt={600} farge={GRA} anker="start" />
        </g>
    );
}

/** Ord i en farget markeringsboks. Bredden regnes ut fra teksten. */
function Merket({
    x,
    y,
    tekst,
    str,
    farge,
    anker = 'start',
}: {
    x: number;
    y: number;
    tekst: string;
    str: number;
    farge: string;
    anker?: 'start' | 'middle';
}) {
    const b = tekst.length * str * 0.58 + str * 0.8;
    const venstre = anker === 'start' ? x : x - b / 2;
    return (
        <g>
            <rect x={venstre} y={y - str * 0.95} width={b} height={str * 1.35} rx={str * 0.25} fill={farge} />
            <T x={venstre + b / 2} y={y} tekst={tekst} str={str} farge="#ffffff" vekt={800} />
        </g>
    );
}

// ---------- Anafora ----------

const ANAFORA = ['handle.', 'endre.', 'gjøre det nå.'];

function Anafora({ beat, playing }: { beat: number; playing: boolean }) {
    const banker = beat >= 3 && playing;
    return (
        <g>
            <Tittel tekst="ANAFORA" under="flere setninger starter med det samme ordet eller de samme ordene" farge={INDIGO} />
            <Vis synlig={beat === 0}>
                <T x={800} y={420} tekst="Vanlig setning:" str={36} farge={GRA} vekt={600} />
                <T x={800} y={510} tekst="«Vi må gjøre noe med klimaet nå.»" str={58} farge={BLEKK} />
            </Vis>
            {ANAFORA.map((rest, i) => {
                const y = 400 + i * 140;
                const synlig = beat >= 1 && (i === 0 || beat >= 2);
                return (
                    <Vis key={rest} synlig={synlig} forsinkelse={beat === 2 && i > 0 ? (i - 1) * 1.1 : 0}>
                        <motion.g
                            animate={banker ? { opacity: [1, 0.55, 1] } : { opacity: 1 }}
                            transition={banker ? { duration: 1.2, repeat: Infinity, delay: i * 0.4 } : { duration: 0.3 }}
                        >
                            <Merket x={460} y={y} tekst="Vi må" str={66} farge={INDIGO} />
                        </motion.g>
                        <T x={720} y={y} tekst={rest} str={66} anker="start" />
                    </Vis>
                );
            })}
            {/* Søylen som viser at starten er lik */}
            <Vis synlig={beat >= 2}>
                <rect x={448} y={320} width={250} height={420} rx={20} fill="none" stroke={INDIGO} strokeWidth={5} opacity={0.45} />
            </Vis>
            <Vis synlig={beat >= 3}>
                {[0, 1, 2].map((i) => (
                    <motion.circle
                        key={i}
                        cx={260}
                        cy={540}
                        r={60}
                        fill="none"
                        stroke={INDIGO}
                        strokeWidth={6}
                        animate={playing ? { scale: [0.6, 2], opacity: [0.9, 0] } : { scale: 1, opacity: 0.5 }}
                        transition={playing ? { duration: 1.2, repeat: Infinity, delay: i * 0.4 } : { duration: 0.3 }}
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                    />
                ))}
                <circle cx={260} cy={540} r={42} fill={INDIGO} />
                <T x={260} y={835} tekst="Det banker: noe er viktig" str={44} farge={INDIGO} vekt={800} anker="start" />
            </Vis>
        </g>
    );
}

// ---------- Treklang ----------

const TRIOER = [
    { ord: ['Frihet', 'likhet', 'brorskap'], kilde: 'Den franske revolusjonen' },
    { ord: ['Veni', 'vidi', 'vici'], kilde: 'Julius Cæsar, slaget ved Zela' },
    { ord: ['Stop', 'look', 'listen'], kilde: 'Trafikkopplæring' },
];
const HJORNER = [
    { x: 1080, y: 300 },
    { x: 820, y: 680 },
    { x: 1340, y: 680 },
];

function Treklang({ beat }: { beat: number }) {
    const aktiv = beat >= 1 ? TRIOER[Math.min(beat, 3) - 1] : null;
    return (
        <g>
            <Tittel tekst="TREKLANG" under="tre ord eller setninger på rad" farge={GRONN} />
            <motion.polygon
                points={HJORNER.map((h) => `${h.x},${h.y}`).join(' ')}
                fill="#d1fae5"
                stroke={GRONN}
                strokeWidth={6}
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />
            {HJORNER.map((h, i) => (
                <g key={i}>
                    {aktiv ? (
                        <motion.g
                            key={`${beat}-${i}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 + i * 0.7 }}
                        >
                            <Merket x={h.x} y={h.y + 18} tekst={aktiv.ord[i]} str={52} farge={GRONN} anker="middle" />
                        </motion.g>
                    ) : (
                        <g>
                            <circle cx={h.x} cy={h.y} r={50} fill="#ffffff" stroke={GRONN} strokeWidth={5} />
                            <T x={h.x} y={h.y + 18} tekst="?" str={52} farge={GRONN} vekt={900} />
                        </g>
                    )}
                </g>
            ))}
            {aktiv && (
                <motion.g key={`kilde-${beat}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                    <T x={1080} y={810} tekst={aktiv.kilde} str={40} farge={GRA} vekt={700} />
                </motion.g>
            )}
            {/* Tidligere eksempler samles til venstre */}
            {TRIOER.map((trio, i) => (
                <Vis key={trio.kilde} synlig={beat >= i + 2}>
                    <rect x={110} y={330 + i * 130} width={470} height={96} rx={18} fill="#ffffff" stroke="#a7f3d0" strokeWidth={4} />
                    <T x={345} y={392 + i * 130} tekst={trio.ord.join(', ')} str={36} farge={GRONN} vekt={800} />
                </Vis>
            ))}
            <Vis synlig={beat === 0}>
                <T x={345} y={520} tekst="Tre ting i rad" str={48} farge={BLEKK} vekt={800} />
            </Vis>
        </g>
    );
}

// ---------- Telling ----------

function Kloss({ x, y, farge, rot = 0, s = 100 }: { x: number; y: number; farge: string; rot?: number; s?: number }) {
    return <rect x={x - s / 2} y={y - s / 2} width={s} height={s} rx={14} fill={farge} transform={`rotate(${rot} ${x} ${y})`} />;
}

const PANEL = [
    { x: 330, tittel: 'To', tekst: 'tilfeldig', farge: '#94a3b8' },
    { x: 800, tittel: 'Fire', tekst: 'for mye', farge: ROD },
    { x: 1270, tittel: 'Tre', tekst: 'fullstendig', farge: GRONN },
];

function Telling({ beat }: { beat: number }) {
    const paneler = beat <= 2;
    return (
        <g>
            <Tittel tekst="HVORFOR TRE?" under="to virker tilfeldig, fire virker for mye" farge={GRONN} />
            {PANEL.map((p, i) => {
                const synlig = paneler && beat >= i;
                const dempet = beat === 2 && i < 2;
                return (
                    <Vis key={p.tittel} synlig={synlig}>
                        <g opacity={dempet ? 0.4 : 1}>
                            <rect x={p.x - 225} y={300} width={450} height={470} rx={28} fill="#ffffff" stroke={p.farge} strokeWidth={5} />
                            {i === 0 && (
                                <>
                                    <Kloss x={p.x - 70} y={520} farge={p.farge} rot={-12} />
                                    <Kloss x={p.x + 80} y={555} farge={p.farge} rot={9} />
                                </>
                            )}
                            {i === 1 &&
                                [0, 1, 2, 3].map((k) => (
                                    <Kloss key={k} x={p.x - 150 + k * 100} y={530 + (k % 2) * 30} farge={p.farge} rot={k % 2 ? 8 : -6} s={92} />
                                ))}
                            {i === 2 && (
                                <>
                                    <Kloss x={p.x - 62} y={590} farge={p.farge} />
                                    <Kloss x={p.x + 62} y={590} farge={p.farge} />
                                    <Kloss x={p.x} y={476} farge={p.farge} />
                                </>
                            )}
                            <T x={p.x} y={390} tekst={p.tittel} str={58} farge={p.farge} vekt={900} />
                            <T x={p.x} y={730} tekst={p.tekst} str={44} farge={BLEKK} vekt={800} />
                        </g>
                    </Vis>
                );
            })}
            <Vis synlig={beat === 3}>
                {[
                    { x: 450, tittel: 'Eventyr', linjer: ['tre brødre', 'tre ønsker'] },
                    { x: 1150, tittel: 'Reklame', linjer: ['raskere,', 'bedre,', 'billigere'] },
                ].map((k, i) => (
                    <motion.g
                        key={k.tittel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 3 ? 1 : 0 }}
                        transition={{ delay: beat === 3 ? 0.3 + i * 1.6 : 0 }}
                    >
                        <rect x={k.x - 270} y={290} width={540} height={500} rx={28} fill="#ffffff" stroke={GRONN} strokeWidth={5} />
                        <T x={k.x} y={380} tekst={k.tittel} str={56} farge={GRONN} vekt={900} />
                        {k.linjer.map((l, j) => (
                            <T key={l} x={k.x} y={490 + j * 90} tekst={l} str={52} farge={BLEKK} vekt={800} />
                        ))}
                    </motion.g>
                ))}
            </Vis>
            <Vis synlig={beat >= 4}>
                <rect x={480} y={280} width={640} height={540} rx={24} fill="#fffbeb" stroke={GULL} strokeWidth={5} />
                <T x={800} y={370} tekst="Argumentene dine" str={50} farge={BLEKK} vekt={900} />
                {[0, 1, 2].map((i) => (
                    <motion.g
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat >= 4 ? 1 : 0 }}
                        transition={{ delay: beat >= 4 ? 0.5 + i * 0.8 : 0 }}
                    >
                        <circle cx={580} cy={470 + i * 110} r={26} fill={GRONN} />
                        <rect x={630} y={456 + i * 110} width={400 - i * 50} height={28} rx={14} fill="#cbd5e1" />
                    </motion.g>
                ))}
            </Vis>
        </g>
    );
}

// ---------- Kontrast ----------

function Kontrast({ beat }: { beat: number }) {
    const dickens = beat === 1 || beat === 2;
    const rike = beat >= 3;
    return (
        <g>
            <Tittel tekst="KONTRAST" under="to motsatte ting tett inntil hverandre (antitese)" farge={ROD} />
            <motion.rect
                y={260}
                width={640}
                height={480}
                rx={24}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth={4}
                initial={{ x: 60 }}
                animate={{ x: 160 }}
                transition={{ duration: 1.4 }}
            />
            <motion.rect
                y={260}
                width={640}
                height={480}
                rx={24}
                fill="#111827"
                initial={{ x: 900 }}
                animate={{ x: 800 }}
                transition={{ duration: 1.4 }}
            />
            <Vis synlig={beat === 0}>
                <circle cx={480} cy={500} r={90} fill={GULL} />
                <circle cx={1120} cy={500} r={90} fill="#e2e8f0" />
                <circle cx={1160} cy={470} r={80} fill="#111827" />
            </Vis>
            <Vis synlig={dickens}>
                <T x={480} y={420} tekst="Det var den" str={44} farge={GRA} />
                <motion.g animate={{ scale: beat === 2 ? 1.12 : 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                    <T x={480} y={540} tekst="beste" str={110} farge={GULL} vekt={900} />
                </motion.g>
                <T x={480} y={630} tekst="av tider," str={44} farge={GRA} />
                <T x={1120} y={420} tekst="det var den" str={44} farge="#94a3b8" />
                <motion.g animate={{ scale: beat === 2 ? 1.12 : 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                    <T x={1120} y={540} tekst="verste" str={110} farge="#93c5fd" vekt={900} />
                </motion.g>
                <T x={1120} y={630} tekst="av tider." str={44} farge="#94a3b8" />
                <T x={800} y={820} tekst="Charles Dickens, «To byer» (1859)" str={40} farge={GRA} vekt={700} />
            </Vis>
            <Vis synlig={beat === 2}>
                <circle cx={800} cy={500} r={62} fill={ROD} />
                <path d="M768,500 L832,500 M768,500 L788,482 M768,500 L788,518 M832,500 L812,482 M832,500 L812,518" stroke="#ffffff" strokeWidth={7} strokeLinecap="round" fill="none" />
                <Merket x={800} y={712} tekst="Hjernen sammenligner" str={36} farge={ROD} anker="middle" />
            </Vis>
            <Vis synlig={rike}>
                <T x={480} y={400} tekst="De rike blir" str={46} farge={GRA} />
                <T x={480} y={530} tekst="rikere" str={104} farge={GULL} vekt={900} />
                <path d="M480,680 L480,580 M450,612 L480,580 L510,612" stroke={GRONN} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <T x={1120} y={400} tekst="de fattige blir" str={46} farge="#94a3b8" />
                <T x={1120} y={530} tekst="fattigere" str={104} farge="#93c5fd" vekt={900} />
                <path d="M1120,580 L1120,680 M1090,648 L1120,680 L1150,648" stroke="#f87171" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <T x={800} y={820} tekst="Politikere bruker grepet" str={40} farge={GRA} vekt={700} />
            </Vis>
        </g>
    );
}

interface Props {
    modus: Modus;
}

export function RetoriskeGrepTavle({ beat, playing, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'anafora';
    return (
        <div className="absolute inset-0" style={{ background: '#f8f4ec' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'anafora' && <Anafora beat={beat} playing={playing} />}
                {modus === 'treklang' && <Treklang beat={beat} />}
                {modus === 'telling' && <Telling beat={beat} />}
                {modus === 'kontrast' && <Kontrast beat={beat} />}
            </svg>
        </div>
    );
}
