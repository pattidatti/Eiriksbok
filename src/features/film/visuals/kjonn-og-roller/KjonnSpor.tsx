import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * To spor: øverst prinsippet (hva læren sier), nederst praksis (hva som faktisk skjer).
 * «forklaring»: sporene tegnes, praksis bak og foran prinsippet, så et spor som deler seg.
 * «kirke»: Den norske kirke 1938-1993 i målestokk, med de tjuetre årene markert.
 * «islam»: Koranen, loven og praksis i rekkefølge (ikke målestokk).
 * «monster»: mønsteret på tvers av tradisjonene.
 */

type Modus = 'forklaring' | 'kirke' | 'islam' | 'monster';

const B = 1600;
const H = 900;
const P_Y = 300;
const V_Y = 690;
const X0 = 380;
const X1 = 1540;
const FS = 32;

const BLA = '#4f46e5';
const RAV = '#d97706';
const GRA = '#64748b';
const MORK = '#0f172a';

const OVERSKRIFT: Record<Modus, string[]> = {
    forklaring: [
        'To ord å kunne',
        'To ord å kunne',
        'Praksis bak prinsippet',
        'Praksis foran prinsippet',
        'Uenig med seg selv',
        'Uenigheten er regelen',
    ],
    kirke: [
        'Den norske kirke',
        'En annen kirke først',
        'Stortinget griper inn',
        'Tjuetre år etter regelen',
        'Første kvinnelige biskop',
    ],
    islam: [
        'Islam: samme bok, ulike lesninger',
        'Koranen: et vers om frelse',
        'Koranen: et annet vers',
        'Loven som ble bygd på tekstene',
        'Praksis: New York, 2005',
        'Praksis i dag: sunni-islam',
    ],
    monster: [
        'Mønsteret',
        'Gapet er tid',
        'Uenighet innad',
        'Ingen prester?',
        'Ingen er ferdige',
    ],
};

interface Hendelse {
    x: number;
    spor: 'p' | 'v';
    /** -1: kortet over sporet, 1: under. */
    side: -1 | 1;
    aar: string;
    linjer: string[];
    farge: string;
    fraBeat: number;
}

const aarX = (aar: number) => X0 + 20 + ((aar - 1930) / (2000 - 1930)) * (X1 - X0 - 60);

const HENDELSER: Partial<Record<Modus, Hendelse[]>> = {
    kirke: [
        { x: aarX(1938), spor: 'p', side: -1, aar: '1938', linjer: ['Kvinner får bli prester,', 'men menigheten kan si nei'], farge: BLA, fraBeat: 0 },
        { x: aarX(1954), spor: 'v', side: -1, aar: '1954', linjer: ['Metodistkirken:', 'Agnes Nilsen Howard'], farge: GRA, fraBeat: 1 },
        { x: aarX(1956), spor: 'p', side: 1, aar: '1956', linjer: ['Stortinget fjerner', 'retten til å si nei'], farge: BLA, fraBeat: 2 },
        { x: aarX(1961), spor: 'v', side: 1, aar: '1961', linjer: ['Ingrid Bjerkås', 'blir ordinert'], farge: RAV, fraBeat: 3 },
        { x: aarX(1993), spor: 'v', side: 1, aar: '1993', linjer: ['Rosemarie Köhn:', 'første kvinnelige biskop'], farge: RAV, fraBeat: 4 },
    ],
    islam: [
        { x: 540, spor: 'p', side: -1, aar: 'Koranen', linjer: ['Mann eller kvinne:', 'samme paradis'], farge: BLA, fraBeat: 1 },
        { x: 960, spor: 'p', side: -1, aar: 'Koranen', linjer: ['Menn har bestyrerrett', 'over kvinner'], farge: BLA, fraBeat: 2 },
        { x: 1300, spor: 'p', side: 1, aar: 'Loven', linjer: ['Arv: kvinner halvparten', 'Egen formue: styrer selv'], farge: BLA, fraBeat: 3 },
        { x: 1080, spor: 'v', side: -1, aar: '2005', linjer: ['Amina Wadud leder bønnen', 'for menn og kvinner'], farge: RAV, fraBeat: 4 },
        { x: 1340, spor: 'v', side: 1, aar: 'I dag', linjer: ['Kvinner leder bønnen', 'bare for kvinner'], farge: RAV, fraBeat: 5 },
    ],
};

function kortMal(linjer: string[]) {
    const lengst = Math.max(...linjer.map((l) => l.length));
    const w = Math.round(lengst * FS * 0.56 + 48);
    const h = Math.round(linjer.length * FS * 1.25 + 28);
    return { w, h };
}

function Kort({
    x,
    y,
    linjer,
    farge,
    tittel,
}: {
    x: number;
    y: number;
    linjer: string[];
    farge: string;
    tittel?: string;
}) {
    const alle = tittel ? [tittel, ...linjer] : linjer;
    const { w, h } = kortMal(alle);
    const venstre = Math.min(Math.max(x - w / 2, 20), B - 20 - w);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect x={venstre} y={y} width={w} height={h} rx={18} fill="#ffffff" stroke={farge} strokeWidth={4} />
            {alle.map((l, i) => (
                <text
                    key={i}
                    x={venstre + w / 2}
                    y={y + 14 + FS + i * FS * 1.25}
                    textAnchor="middle"
                    fontSize={FS}
                    fontWeight={tittel && i === 0 ? 900 : 700}
                    fill={tittel && i === 0 ? farge : MORK}
                >
                    {l}
                </text>
            ))}
        </motion.g>
    );
}

function HendelseVis({ e }: { e: Hendelse }) {
    const sporY = e.spor === 'p' ? P_Y : V_Y;
    const { h } = kortMal([e.aar, ...e.linjer]);
    const kortY = e.side === -1 ? sporY - 34 - h : sporY + 34;
    return (
        <g>
            <motion.circle
                cx={e.x}
                cy={sporY}
                r={18}
                fill={e.farge}
                stroke="#fff"
                strokeWidth={5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                style={{ transformOrigin: `${e.x}px ${sporY}px` }}
            />
            <line
                x1={e.x}
                x2={e.x}
                y1={sporY + e.side * 20}
                y2={sporY + e.side * 34}
                stroke={e.farge}
                strokeWidth={4}
            />
            <Kort x={e.x} y={kortY} linjer={e.linjer} farge={e.farge} tittel={e.aar} />
        </g>
    );
}

function Spor({ y, farge, tittel, under, delt = 0 }: { y: number; farge: string; tittel: string; under: string; delt?: number }) {
    return (
        <g>
            <text x={60} y={y - 6} fontSize={40} fontWeight={900} fill={farge}>
                {tittel}
            </text>
            <text x={60} y={y + 34} fontSize={28} fontWeight={700} fill={GRA}>
                {under}
            </text>
            <motion.line
                x1={X0}
                x2={delt ? delt : X1}
                y1={y}
                y2={y}
                stroke={farge}
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2 }}
            />
        </g>
    );
}

/** Praksis-sporet som deler seg i to greiner fra `fra`. */
function Greiner({ fra, y, etiketter, stiplet }: { fra: number; y: number; etiketter: [string, string]; stiplet?: boolean }) {
    const opp = y - 90;
    const ned = y + 90;
    const slutt = stiplet ? X1 + 30 : X1;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {[opp, ned].map((yy) => (
                <motion.path
                    key={yy}
                    d={`M ${fra} ${y} C ${fra + 120} ${y}, ${fra + 120} ${yy}, ${fra + 240} ${yy} L ${slutt} ${yy}`}
                    fill="none"
                    stroke={RAV}
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2 }}
                />
            ))}
            <text x={X1} y={opp - 22} textAnchor="end" fontSize={30} fontWeight={800} fill={RAV}>
                {etiketter[0]}
            </text>
            <text x={X1} y={ned + 46} textAnchor="end" fontSize={30} fontWeight={800} fill={RAV}>
                {etiketter[1]}
            </text>
        </motion.g>
    );
}

function Pil({ x1, x2, y, tekst, farge, tekstY }: { x1: number; x2: number; y: number; tekst: string; farge: string; tekstY: number }) {
    const retning = x2 > x1 ? 1 : -1;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <line x1={x1 + retning * 26} x2={x2 - retning * 46} y1={y} y2={y} stroke={farge} strokeWidth={6} strokeDasharray="14 10" />
            <path
                d={`M ${x2 - retning * 26} ${y} L ${x2 - retning * 50} ${y - 16} L ${x2 - retning * 50} ${y + 16} Z`}
                fill={farge}
            />
            <text x={(x1 + x2) / 2} y={tekstY} textAnchor="middle" fontSize={32} fontWeight={800} fill={farge}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Prikk({ x, y, farge }: { x: number; y: number; farge: string }) {
    return (
        <motion.g initial={false} animate={{ x, y }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
            <circle cx={0} cy={0} r={20} fill={farge} stroke="#fff" strokeWidth={5} />
        </motion.g>
    );
}

function Bok({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <path d="M -120 -60 Q -60 -80 0 -60 L 0 60 Q -60 40 -120 60 Z" fill="#e0e7ff" stroke={BLA} strokeWidth={5} />
            <path d="M 120 -60 Q 60 -80 0 -60 L 0 60 Q 60 40 120 60 Z" fill="#e0e7ff" stroke={BLA} strokeWidth={5} />
            {[-30, -5, 20].map((ly) => (
                <g key={ly}>
                    <line x1={-100} x2={-20} y1={ly} y2={ly - 6} stroke="#a5b4fc" strokeWidth={4} />
                    <line x1={20} x2={100} y1={ly - 6} y2={ly} stroke="#a5b4fc" strokeWidth={4} />
                </g>
            ))}
        </g>
    );
}

/** Tre mennesker side om side: praksis er det folk gjør. */
function Folk({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            {[
                [-90, '#0f766e', false],
                [0, '#d97706', true],
                [90, '#475569', false],
            ].map(([dx, farge, kvinne]) => (
                <g key={dx as number} transform={`translate(${dx as number} 0)`}>
                    <circle cx={0} cy={-40} r={24} fill="#e0b98a" />
                    {kvinne ? (
                        <path d="M -14 -12 L 14 -12 L 34 70 L -34 70 Z" fill={farge as string} />
                    ) : (
                        <rect x={-26} y={-12} width={52} height={82} rx={20} fill={farge as string} />
                    )}
                </g>
            ))}
        </g>
    );
}

/** En prest med krage, og et rødt kryss ved siden av: «ingen prester». */
function IngenPrest({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={-34} y={-10} width={68} height={90} rx={26} fill="#334155" />
            <rect x={-12} y={-8} width={24} height={14} rx={4} fill="#fff" />
            <circle cx={0} cy={-38} r={26} fill="#e0b98a" />
            <g transform="translate(80 10)">
                <line x1={-26} y1={-26} x2={26} y2={26} stroke="#dc2626" strokeWidth={12} strokeLinecap="round" />
                <line x1={26} y1={-26} x2={-26} y2={26} stroke="#dc2626" strokeWidth={12} strokeLinecap="round" />
            </g>
        </g>
    );
}

export function KjonnSpor({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'forklaring';
    const overskrift = OVERSKRIFT[modus][Math.min(beat, OVERSKRIFT[modus].length - 1)];
    const hendelser = (HENDELSER[modus] ?? []).filter((e) => e.fraBeat <= beat);
    const visPraksis = modus !== 'forklaring' || beat >= 1;

    // Hvor sporet deler seg (forklaring og mønster).
    const delerSeg =
        (modus === 'forklaring' && beat >= 4) || (modus === 'monster' && beat >= 2);
    const deleX = modus === 'monster' ? 1150 : 820;

    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <motion.text
                    key={overskrift}
                    x={B / 2}
                    y={92}
                    textAnchor="middle"
                    fontSize={54}
                    fontWeight={900}
                    fill={MORK}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    {overskrift}
                </motion.text>

                <Spor y={P_Y} farge={BLA} tittel="Prinsippet" under="hva læren sier" />
                {visPraksis && (
                    <Spor
                        y={V_Y}
                        farge={RAV}
                        tittel="Praksis"
                        under="hva som skjer"
                        delt={delerSeg ? deleX : 0}
                    />
                )}

                {modus === 'forklaring' && (beat === 2 || beat === 3) && (
                    <>
                        <Prikk x={beat === 2 ? 560 : 1300} y={P_Y} farge={BLA} />
                        <Prikk x={beat === 2 ? 1300 : 560} y={V_Y} farge={RAV} />
                        {beat === 2 && (
                            <Pil x1={560} x2={1300} y={V_Y} tekst="praksis kommer lenge etter" farge={RAV} tekstY={V_Y + 70} />
                        )}
                        {beat === 3 && (
                            <Pil x1={560} x2={1300} y={P_Y} tekst="prinsippet kommer etter" farge={BLA} tekstY={P_Y + 70} />
                        )}
                    </>
                )}
                {modus === 'forklaring' && beat <= 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <Bok x={beat === 0 ? 960 : 640} y={480} />
                        <text x={beat === 0 ? 960 : 640} y={600} textAnchor="middle" fontSize={34} fontWeight={900} fill={BLA}>
                            Hva står i teksten?
                        </text>
                    </motion.g>
                )}
                {modus === 'forklaring' && beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}>
                        <Folk x={1200} y={470} />
                        <text x={1200} y={600} textAnchor="middle" fontSize={34} fontWeight={900} fill={RAV}>
                            Hva gjør folk?
                        </text>
                    </motion.g>
                )}
                {modus === 'forklaring' && beat >= 4 && (
                    <Greiner fra={deleX} y={V_Y} etiketter={['konservativ lesning', 'reformvennlig lesning']} />
                )}
                {modus === 'forklaring' && beat >= 5 && (
                    <Kort x={800} y={420} farge={MORK} linjer={['Samme tekst,', 'ulike lesninger']} />
                )}

                {modus === 'kirke' && beat >= 3 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
                        <line x1={aarX(1938)} x2={aarX(1938)} y1={P_Y + 24} y2={V_Y - 24} stroke={BLA} strokeWidth={4} strokeDasharray="10 10" />
                        <rect x={aarX(1938)} y={V_Y + 16} width={aarX(1961) - aarX(1938)} height={14} rx={7} fill="#dc2626" />
                        <text x={640} y={V_Y + 76} textAnchor="middle" fontSize={44} fontWeight={900} fill="#dc2626">
                            23 år
                        </text>
                    </motion.g>
                )}

                {modus === 'islam' && beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                        <Bok x={960} y={490} />
                        <text x={960} y={610} textAnchor="middle" fontSize={34} fontWeight={900} fill={BLA}>
                            Koranen
                        </text>
                    </motion.g>
                )}
                {modus === 'islam' && (
                    <text x={60} y={872} fontSize={24} fontWeight={600} fill={GRA}>
                        Rekkefølge, ikke målestokk
                    </text>
                )}
                {modus === 'kirke' && (
                    <text x={60} y={872} fontSize={24} fontWeight={600} fill={GRA}>
                        Årstall i målestokk, 1930-2000
                    </text>
                )}

                {modus === 'monster' && (
                    <>
                        <Prikk x={520} y={P_Y} farge={BLA} />
                        <Prikk x={beat >= 2 ? deleX : 1150} y={V_Y} farge={RAV} />
                        {beat >= 1 && (
                            <line x1={520} x2={520} y1={P_Y + 24} y2={V_Y - 24} stroke={BLA} strokeWidth={4} strokeDasharray="10 10" />
                        )}
                        {beat === 1 && (
                            <>
                                <Pil x1={520} x2={1150} y={V_Y} tekst="tid" farge={RAV} tekstY={V_Y + 70} />
                                <Kort x={835} y={420} farge={MORK} linjer={['Gapet er ikke løgn.', 'Det er tid.']} />
                            </>
                        )}
                        {beat >= 2 && (
                            <Greiner
                                fra={deleX}
                                y={V_Y}
                                etiketter={['én retning', 'en annen retning']}
                                stiplet={false}
                            />
                        )}
                        {beat === 3 && (
                            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <IngenPrest x={760} y={430} />
                                <Kort x={1180} y={380} farge="#dc2626" tittel="Sikhisme og bahá'í" linjer={['ingen prester: striden', 'handler om andre roller']} />
                            </motion.g>
                        )}
                        {beat >= 4 && (
                            <>
                                <Kort x={900} y={390} farge={RAV} tittel="Strid akkurat nå" linjer={['Kan nonner ordineres?', 'Islamsk lov i landets lov?']} />
                            </>
                        )}
                    </>
                )}

                {hendelser.map((e) => (
                    <HendelseVis key={`${e.aar}-${e.x}`} e={e} />
                ))}
            </svg>
        </div>
    );
}
