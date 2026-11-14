import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hva grepene gjør med den som lytter, tegnet som bilder. Fire moduser:
 * - valg: veien deler seg i to, selv om det finnes mange flere stier.
 * - sporsmal: en taler spør, lytteren svarer inni seg. Så en reklameplakat.
 * - love: metaforen. Hjertet av stein, tiden er gull, og løven som låner bort motet sitt.
 * - sedler: et tall som glir forbi, mot en bunke sedler høyere enn Eiffeltårnet.
 */

type Modus = 'valg' | 'sporsmal' | 'love' | 'sedler';

const FONT = { fontFamily: 'Outfit, Inter, sans-serif' };
const BLEKK = '#0f172a';
const GRA = '#64748b';
const ROD = '#e11d48';
const GRONN = '#059669';
const GULL = '#f59e0b';
const BLA = '#0ea5e9';

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

function Tittel({ tekst, farge = BLEKK }: { tekst: string; farge?: string }) {
    return <T x={110} y={120} tekst={tekst} str={64} vekt={900} farge={farge} anker="start" />;
}

/** Et menneske sett forfra: hode og skuldre. */
function Person({ x, y, farge = '#475569', s = 1 }: { x: number; y: number; farge?: string; s?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <circle cx={0} cy={-150} r={58} fill={farge} />
            <path d="M-110,40 Q-110,-70 0,-75 Q110,-70 110,40 Z" fill={farge} />
        </g>
    );
}

/** Snakkeboble. Bredden følger den lengste linja. */
function Boble({
    x,
    y,
    linjer,
    str = 40,
    farge = '#ffffff',
    tekstfarge = BLEKK,
    tanke = false,
    halePx = 0,
}: {
    x: number;
    y: number;
    linjer: string[];
    str?: number;
    farge?: string;
    tekstfarge?: string;
    tanke?: boolean;
    halePx?: number;
}) {
    const lengst = Math.max(...linjer.map((l) => l.length));
    const b = lengst * str * 0.56 + str * 1.6;
    const h = linjer.length * str * 1.3 + str * 1.1;
    return (
        <g>
            <rect x={x - b / 2} y={y - h / 2} width={b} height={h} rx={tanke ? h / 2 : 30} fill={farge} stroke="#cbd5e1" strokeWidth={4} />
            {tanke ? (
                <>
                    <circle cx={x + halePx} cy={y + h / 2 + 34} r={18} fill={farge} stroke="#cbd5e1" strokeWidth={4} />
                    <circle cx={x + halePx + 18} cy={y + h / 2 + 74} r={11} fill={farge} stroke="#cbd5e1" strokeWidth={4} />
                </>
            ) : (
                <path d={`M${x + halePx - 30},${y + h / 2 - 2} L${x + halePx - 70},${y + h / 2 + 60} L${x + halePx + 20},${y + h / 2 - 2} Z`} fill={farge} />
            )}
            {linjer.map((l, i) => (
                <T key={l} x={x} y={y - h / 2 + str * 1.45 + i * str * 1.3} tekst={l} str={str} farge={tekstfarge} vekt={800} />
            ))}
        </g>
    );
}

// ---------- Valg ----------

const GRA_STIER = [620, 710, 800, 890, 980];

function Valg({ beat }: { beat: number }) {
    const fa = beat >= 2;
    return (
        <g>
            <Tittel tekst={beat >= 2 ? 'Bare to valg?' : 'To valg'} farge={ROD} />
            {GRA_STIER.map((x, i) => (
                <Vis key={x} synlig={beat >= 1} forsinkelse={i * 0.25}>
                    <g opacity={fa ? 0.12 : 1}>
                        <path d={`M800,720 Q${800 + (x - 800) * 0.3},520 ${x},340`} stroke="#94a3b8" strokeWidth={14} fill="none" strokeLinecap="round" />
                        <circle cx={x} cy={320} r={30} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={4} />
                        <T x={x} y={334} tekst="?" str={38} farge={GRA} vekt={900} />
                    </g>
                </Vis>
            ))}
            <motion.path
                d="M800,720 Q600,520 420,280"
                stroke={ROD}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, strokeWidth: 22 }}
                animate={{ pathLength: 1, strokeWidth: fa ? 34 : 22 }}
                transition={{ duration: 1.2 }}
            />
            <motion.path
                d="M800,720 Q1000,520 1180,280"
                stroke={GRONN}
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0, strokeWidth: 22 }}
                animate={{ pathLength: 1, strokeWidth: fa ? 34 : 22 }}
                transition={{ duration: 1.2, delay: 0.3 }}
            />
            <rect x={210} y={170} width={420} height={80} rx={20} fill={ROD} />
            <T x={420} y={224} tekst="vente og miste alt" str={38} farge="#ffffff" vekt={800} />
            <rect x={970} y={170} width={420} height={80} rx={20} fill={GRONN} />
            <T x={1180} y={224} tekst="handle og redde noe" str={36} farge="#ffffff" vekt={800} />
            <Person x={800} y={860} s={0.7} farge={BLEKK} />
            <Vis synlig={beat === 1}>
                <T x={1250} y={560} tekst="mange flere" str={40} farge={GRA} vekt={800} anker="start" />
                <T x={1250} y={610} tekst="muligheter" str={40} farge={GRA} vekt={800} anker="start" />
            </Vis>
            <Vis synlig={beat >= 2}>
                <T x={1250} y={560} tekst="Virkeligheten" str={40} farge={BLEKK} vekt={800} anker="start" />
                <T x={1250} y={610} tekst="blir to ting" str={40} farge={BLEKK} vekt={800} anker="start" />
            </Vis>
        </g>
    );
}

// ---------- Retorisk spørsmål ----------

function Sporsmal({ beat }: { beat: number }) {
    const reklame = beat >= 3;
    return (
        <g>
            <Tittel tekst={reklame ? 'Reklamen spør' : 'Retorisk spørsmål'} farge={GULL} />
            <T x={112} y={175} tekst="taleren verken venter eller ønsker svar" str={34} farge={GRA} vekt={600} anker="start" />
            {/* Taleren */}
            <Vis synlig={!reklame}>
                <Person x={300} y={830} farge="#1e3a8a" />
                <Vis synlig={beat === 0}>
                    <Boble x={560} y={400} linjer={['?']} str={110} halePx={-120} />
                </Vis>
                <Vis synlig={beat >= 1}>
                    <Boble x={640} y={390} linjer={['Er vi ikke alle mennesker?']} str={40} halePx={-200} />
                </Vis>
                <Vis synlig={beat >= 1} forsinkelse={beat === 1 ? 2.2 : 0}>
                    <Boble x={700} y={560} linjer={['Hvor lenge skal vi tåle dette?']} str={36} halePx={-260} />
                </Vis>
            </Vis>
            {/* Reklameplakaten */}
            <Vis synlig={reklame}>
                <rect x={330} y={300} width={24} height={560} fill="#475569" />
                <rect x={130} y={260} width={620} height={330} rx={16} fill={GULL} />
                <rect x={150} y={280} width={580} height={290} rx={10} fill="#fff7ed" />
                <T x={440} y={410} tekst="Lei av" str={76} farge={BLEKK} vekt={900} />
                <T x={440} y={500} tekst="tørt hår?" str={76} farge={BLEKK} vekt={900} />
            </Vis>
            {/* Lytteren */}
            <Person x={1290} y={830} farge="#475569" />
            <Vis synlig={beat === 2}>
                <Boble x={1260} y={430} linjer={['Jo, selvsagt.']} str={46} tanke halePx={20} />
                <T x={1260} y={250} tekst="Du svarer inni deg" str={40} farge={GULL} vekt={800} />
            </Vis>
            <Vis synlig={beat >= 4}>
                <Boble x={1150} y={400} linjer={['Ja, jeg er faktisk', 'lei av det.']} str={42} tanke halePx={120} />
                <rect x={980} y={210} width={420} height={70} rx={35} fill={GRONN} />
                <T x={1190} y={258} tekst="Reklamen har vunnet" str={36} farge="#ffffff" vekt={800} />
            </Vis>
        </g>
    );
}

// ---------- Metafor ----------

function Hjerte({ x, y, stein }: { x: number; y: number; stein: boolean }) {
    return (
        <motion.path
            d={`M${x},${y + 90} C${x - 160},${y - 20} ${x - 90},${y - 130} ${x},${y - 50} C${x + 90},${y - 130} ${x + 160},${y - 20} ${x},${y + 90} Z`}
            initial={{ fill: '#e11d48' }}
            animate={{ fill: stein ? '#78716c' : '#e11d48' }}
            transition={{ duration: 2, delay: 0.8 }}
        />
    );
}

function Love({ x, y }: { x: number; y: number }) {
    const spisser = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return `${x + Math.cos(a) * 150},${y + Math.sin(a) * 150}`;
    });
    return (
        <g>
            <polygon points={spisser.join(' ')} fill="#c2410c" />
            <circle cx={x} cy={y} r={128} fill="#ea580c" />
            <circle cx={x} cy={y + 10} r={88} fill="#fdba74" />
            <circle cx={x - 32} cy={y - 10} r={10} fill={BLEKK} />
            <circle cx={x + 32} cy={y - 10} r={10} fill={BLEKK} />
            <path d={`M${x - 18},${y + 34} L${x + 18},${y + 34} L${x},${y + 52} Z`} fill={BLEKK} />
        </g>
    );
}

function Metafor({ beat }: { beat: number }) {
    return (
        <g>
            <Tittel tekst="METAFOR" farge={BLA} />
            <T x={112} y={175} tekst="et ord brukt i overført betydning, som et bilde" str={34} farge={GRA} vekt={600} anker="start" />
            <Vis synlig={beat === 0}>
                <Hjerte x={800} y={500} stein={beat === 0} />
                <T x={800} y={720} tekst="«Hjertet hennes ble til stein»" str={50} farge={BLEKK} vekt={800} />
            </Vis>
            <Vis synlig={beat === 1}>
                <rect x={180} y={280} width={560} height={480} rx={28} fill="#ffffff" stroke={GULL} strokeWidth={5} />
                <circle cx={380} cy={480} r={90} fill="#ffffff" stroke={BLEKK} strokeWidth={8} />
                <path d="M380,480 L380,420 M380,480 L425,500" stroke={BLEKK} strokeWidth={8} strokeLinecap="round" />
                <circle cx={560} cy={500} r={70} fill={GULL} />
                <circle cx={560} cy={500} r={50} fill="none" stroke="#b45309" strokeWidth={6} />
                <T x={460} y={700} tekst="Tiden er gull" str={48} vekt={800} />
                <rect x={860} y={280} width={560} height={480} rx={28} fill="#ffffff" stroke={BLA} strokeWidth={5} />
                <path d="M940,640 C1040,640 1000,520 1120,520 C1240,520 1180,400 1340,390" stroke={BLA} strokeWidth={22} fill="none" strokeLinecap="round" />
                <circle cx={1340} cy={390} r={20} fill={GRONN} />
                <T x={1140} y={700} tekst="Livet er en reise" str={48} vekt={800} />
            </Vis>
            <Vis synlig={beat >= 2}>
                <Love x={420} y={500} />
                <T x={420} y={750} tekst="løven" str={44} farge={GRA} vekt={800} />
                <motion.circle
                    cx={1180}
                    cy={500}
                    r={220}
                    fill={GULL}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 3 ? 0.25 : 0 }}
                    transition={{ duration: 1.2, delay: 1.2 }}
                />
                <Person x={1180} y={680} farge="#334155" s={0.95} />
                <T x={1180} y={780} tekst="personen" str={44} farge={GRA} vekt={800} />
                <rect x={600} y={225} width={400} height={76} rx={38} fill={BLA} />
                <T x={800} y={277} tekst="«en løve i kamp»" str={40} farge="#ffffff" vekt={800} />
            </Vis>
            <Vis synlig={beat === 2}>
                <T x={800} y={520} tekst="Hva tenker du på?" str={44} farge={BLEKK} vekt={800} />
            </Vis>
            {[
                { ord: 'mot', x: 630, y: -95 },
                { ord: 'styrke', x: 870, y: -205 },
            ].map(({ ord, x, y }, i) => (
                <motion.g
                    key={ord}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={beat >= 3 ? { opacity: 1, x, y } : { opacity: 0, x: 0, y: 0 }}
                    transition={{ duration: 1.6, delay: beat >= 3 ? 0.3 + i * 0.6 : 0 }}
                >
                    <rect x={330} y={430 + i * 110} width={200} height={70} rx={35} fill={GULL} />
                    <T x={430} y={478 + i * 110} tekst={ord} str={40} farge={BLEKK} vekt={900} />
                </motion.g>
            ))}
        </g>
    );
}

// ---------- Sedler ----------

const SEDLER = 26;

function Sedler({ beat }: { beat: number }) {
    return (
        <g>
            <Tittel tekst={beat === 2 ? 'Den ser du for deg' : 'Hjernen husker bilder'} farge={GRONN} />
            <Vis synlig={beat === 0}>
                <rect x={180} y={300} width={560} height={420} rx={28} fill="#f1f5f9" stroke="#cbd5e1" strokeWidth={4} />
                <T x={460} y={480} tekst="tall og ideer" str={52} farge="#94a3b8" vekt={800} />
                <T x={460} y={560} tekst="glemmes fort" str={38} farge="#94a3b8" vekt={600} />
                <rect x={860} y={300} width={560} height={420} rx={28} fill="#ecfdf5" stroke={GRONN} strokeWidth={5} />
                <T x={1140} y={480} tekst="bilder" str={64} farge={GRONN} vekt={900} />
                <T x={1140} y={560} tekst="huskes mye bedre" str={38} farge={GRONN} vekt={700} />
            </Vis>
            <motion.g
                initial={{ opacity: 0, x: 0 }}
                animate={beat === 1 ? { opacity: [0, 1, 1, 0.4], x: [0, 0, 0, 120] } : { opacity: 0, x: 0 }}
                transition={beat === 1 ? { duration: 4.5, times: [0, 0.15, 0.5, 1] } : { duration: 0.4 }}
            >
                <T x={800} y={500} tekst="to milliarder kroner" str={96} farge={BLEKK} vekt={900} />
            </motion.g>
            <Vis synlig={beat === 1} forsinkelse={2.5}>
                <T x={800} y={640} tekst="... glir rett forbi" str={44} farge={GRA} vekt={700} />
            </Vis>
            <Vis synlig={beat === 2}>
                {/* Eiffeltårnet som silhuett */}
                <path
                    d="M1100,820 L1180,560 L1210,480 L1225,420 L1235,420 L1250,480 L1280,560 L1360,820 L1300,820 Q1230,700 1160,820 Z"
                    fill="#475569"
                />
                <rect x={1170} y={555} width={120} height={14} fill="#475569" />
                <rect x={1200} y={475} width={60} height={12} fill="#475569" />
                <T x={1230} y={870} tekst="Eiffeltårnet" str={38} farge={GRA} vekt={800} />
                {/* Bunken som vokser forbi tårnet */}
                {Array.from({ length: SEDLER }, (_, i) => (
                    <motion.rect
                        key={i}
                        x={560 + (i % 3) * 6}
                        y={796 - i * 22}
                        width={260}
                        height={20}
                        rx={4}
                        fill={i % 2 ? '#16a34a' : '#22c55e'}
                        stroke="#14532d"
                        strokeWidth={2}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 2 ? 1 : 0 }}
                        transition={{ duration: 0.2, delay: beat === 2 ? 0.4 + i * 0.09 : 0 }}
                    />
                ))}
                <T x={690} y={870} tekst="en bunke sedler" str={38} farge={GRONN} vekt={800} />
                <line x1={880} y1={246} x2={1400} y2={246} stroke={GULL} strokeWidth={4} />
                <T x={900} y={232} tekst="høyere!" str={36} farge="#b45309" vekt={900} anker="start" />
            </Vis>
        </g>
    );
}

interface Props {
    modus: Modus;
}

export function RetoriskeGrepBilde({ beat, props }: VisualProps<Props>) {
    const modus = props.modus ?? 'valg';
    return (
        <div className="absolute inset-0" style={{ background: '#eef2f7' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'valg' && <Valg beat={beat} />}
                {modus === 'sporsmal' && <Sporsmal beat={beat} />}
                {modus === 'love' && <Metafor beat={beat} />}
                {modus === 'sedler' && <Sedler beat={beat} />}
            </svg>
        </div>
    );
}
