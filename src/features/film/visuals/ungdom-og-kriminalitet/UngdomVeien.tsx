import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Hakk, Kort, Kryss, Mappe, Overskrift, Person } from './felles';
import { FARGE, bredde } from './maal';

/**
 * Veien en sak tar, avhengig av alderen til den som gjorde det.
 * «alder»: en linjal fra 10 til 18 år med en vegg ved 15 (den kriminelle lavalderen).
 * «under15»: saken deler seg i tre veier: etterforskning, bekymringssamtale, barnevernet.
 * «over15»: fengsel er siste utvei, taket på 15 år, og hvor de fleste sakene havner.
 * «veiskille»: ungdomsstraff gjennom retten mot ungdomsoppfølging uten rettssak.
 */

type Modus = 'alder' | 'under15' | 'over15' | 'veiskille';

const OVERSKRIFT: Record<Modus, string[]> = {
    alder: [
        'Grensen går ved 15 år',
        'Den kriminelle lavalderen',
        'Grensen ble flyttet i 1987',
        'Under 15: uten skyldevne',
        'Hvem står hvor?',
    ],
    under15: [
        'Ingen straff, men ikke ingenting',
        'Dette kan skje: politiet etterforsker',
        'Og: en bekymringssamtale',
        'Og: barnevernet',
        'Det kan ikke politiet gjøre',
        'Det kan politiet gjøre',
    ],
    over15: [
        'Fra 15 år: kan straffes',
        'Fengsel: siste utvei',
        'Under 18 år: aldri over 15 års fengsel',
        'Hvor havner de fleste sakene?',
        'Hvem bestemmer?',
    ],
    veiskille: [
        'To ordninger for unge lovbrytere',
        'Ungdomsoppfølging: ingen rettssak',
        'To krav',
        'Sier den unge nei',
        'Samme mål',
    ],
};

/* ---------------- alder ---------------- */

const AAR0 = 10;
const PX = 150;
const X0 = 200;
const LINJE_Y = 640;
const ax = (alder: number) => X0 + (alder - AAR0) * PX;

function Alder({ beat }: { beat: number }) {
    const vegg = ax(15);
    return (
        <>
            {/* Sonene */}
            <rect x={ax(10)} y={180} width={vegg - ax(10)} height={LINJE_Y - 180} fill="#f1f5f9" />
            <rect x={vegg} y={180} width={ax(18) - vegg} height={LINJE_Y - 180} fill="#fef3c7" />
            <text
                x={(ax(10) + vegg) / 2}
                y={250}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill={FARGE.gra}
            >
                Kan ikke straffes
            </text>
            <text
                x={(vegg + ax(18)) / 2}
                y={250}
                textAnchor="middle"
                fontSize={40}
                fontWeight={800}
                fill="#92400e"
            >
                Kan straffes
            </text>
            {/* Linjalen */}
            <line
                x1={ax(10)}
                y1={LINJE_Y}
                x2={ax(18)}
                y2={LINJE_Y}
                stroke={FARGE.blekk}
                strokeWidth={6}
            />
            {Array.from({ length: 9 }, (_, i) => AAR0 + i).map((a) => (
                <g key={a}>
                    <line
                        x1={ax(a)}
                        y1={LINJE_Y - 14}
                        x2={ax(a)}
                        y2={LINJE_Y + 14}
                        stroke={FARGE.blekk}
                        strokeWidth={4}
                    />
                    <text
                        x={ax(a)}
                        y={LINJE_Y + 58}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill={FARGE.blekk}
                    >
                        {a}
                    </text>
                </g>
            ))}
            <text
                x={ax(14)}
                y={LINJE_Y + 108}
                textAnchor="middle"
                fontSize={30}
                fontWeight={700}
                fill={FARGE.gra}
            >
                alder i år
            </text>
            {/* Den gamle grensen ved 14 */}
            {beat === 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <line
                        x1={ax(14)}
                        y1={300}
                        x2={ax(14)}
                        y2={LINJE_Y}
                        stroke="#94a3b8"
                        strokeWidth={8}
                        strokeDasharray="18 12"
                    />
                    <Kort
                        x={ax(14) - 20}
                        y={300}
                        hoyre
                        tittel="Før: 14 år"
                        farge="#94a3b8"
                        fs={32}
                    />
                    <motion.path
                        d={`M ${ax(14) + 14} 470 L ${vegg - 24} 470`}
                        stroke={FARGE.rod}
                        strokeWidth={8}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    />
                    <path d={`M ${vegg - 10} 470 l -30 -18 l 0 36 Z`} fill={FARGE.rod} />
                    <Kort
                        x={vegg + 20}
                        y={300}
                        tittel="Fra 1987: 15 år"
                        farge={FARGE.rod}
                        fs={32}
                    />
                </motion.g>
            )}
            {/* Veggen ved 15 */}
            <line
                x1={vegg}
                y1={180}
                x2={vegg}
                y2={LINJE_Y + 20}
                stroke={FARGE.rod}
                strokeWidth={12}
            />
            {beat !== 2 && (
                <g>
                    <rect x={vegg - 70} y={138} width={140} height={56} rx={16} fill={FARGE.rod} />
                    <text
                        x={vegg}
                        y={178}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#ffffff"
                    >
                        15 år
                    </text>
                </g>
            )}
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {['Bot', 'Ungdomsstraff', 'Fengsel'].map((t, i) => {
                        const y = 320 + i * 96;
                        return (
                            <g key={t}>
                                <rect
                                    x={ax(10) + 60}
                                    y={y}
                                    width={bredde(t, 34) + 60}
                                    height={70}
                                    rx={16}
                                    fill="#ffffff"
                                    stroke="#94a3b8"
                                    strokeWidth={4}
                                />
                                <text
                                    x={ax(10) + 90}
                                    y={y + 47}
                                    fontSize={34}
                                    fontWeight={800}
                                    fill={FARGE.blekk}
                                >
                                    {t}
                                </text>
                                <Kryss x={ax(10) + bredde(t, 34) + 160} y={y + 35} r={20} />
                            </g>
                        );
                    })}
                </motion.g>
            )}
            {beat === 3 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Kort
                        x={ax(10) + 40}
                        y={340}
                        tittel="«Uten skyldevne»"
                        tekst="ikke skyldig slik en voksen er"
                        farge={FARGE.gra}
                        fs={40}
                    />
                </motion.g>
            )}
            {beat >= 4 && (
                <>
                    <motion.g
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Person x={ax(14)} y={LINJE_Y - 24} farge={FARGE.oransje} s={1.5} />
                        <text
                            x={ax(14)}
                            y={LINJE_Y - 270}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill={FARGE.oransje}
                        >
                            14 år
                        </text>
                    </motion.g>
                    <motion.g
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <Person x={ax(16) - 50} y={LINJE_Y - 24} farge={FARGE.lilla} s={1.5} />
                        <Person x={ax(16) + 70} y={LINJE_Y - 24} farge="#16a34a" s={1.5} />
                        <text
                            x={ax(16) + 10}
                            y={LINJE_Y - 270}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#92400e"
                        >
                            16 år
                        </text>
                    </motion.g>
                </>
            )}
        </>
    );
}

/* ---------------- under15 ---------------- */

const START = { x: 240, y: 520 };
const MAL = [
    {
        y: 250,
        tittel: 'Politiet etterforsker',
        tekst: 'finner ut hva som skjedde',
        farge: FARGE.bla,
    },
    {
        y: 480,
        tittel: 'Bekymringssamtale',
        tekst: 'barnet, foreldrene og politiet',
        farge: FARGE.gul,
    },
    { y: 710, tittel: 'Barnevernet', tekst: 'tiltak for barnet og familien', farge: FARGE.gronn },
];

function Vei({
    fra,
    til,
    aktiv,
}: {
    fra: { x: number; y: number };
    til: { x: number; y: number };
    aktiv: boolean;
}) {
    const mx = (fra.x + til.x) / 2;
    const d = `M ${fra.x} ${fra.y} C ${mx} ${fra.y}, ${mx} ${til.y}, ${til.x} ${til.y}`;
    return (
        <>
            <path d={d} stroke="#cbd5e1" strokeWidth={34} fill="none" strokeLinecap="round" />
            {aktiv && (
                <motion.path
                    d={d}
                    stroke="#64748b"
                    strokeWidth={34}
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9 }}
                />
            )}
        </>
    );
}

function Under15({ beat }: { beat: number }) {
    const grenser = beat >= 4;
    const kortX = grenser ? 560 : 640;
    return (
        <>
            {!grenser &&
                MAL.map((m, i) => (
                    <Vei
                        key={m.tittel}
                        fra={{ x: START.x + 80, y: START.y }}
                        til={{ x: kortX, y: m.y + 50 }}
                        aktiv={beat >= i + 1}
                    />
                ))}
            <Person x={START.x - 90} y={START.y + 120} farge={FARGE.oransje} s={1.4} />
            <text
                x={START.x - 90}
                y={START.y + 170}
                textAnchor="middle"
                fontSize={32}
                fontWeight={800}
                fill={FARGE.oransje}
            >
                14 år
            </text>
            <Mappe x={START.x + 60} y={START.y} />
            {MAL.map((m, i) =>
                beat >= i + 1 && !grenser ? (
                    <Kort
                        key={m.tittel}
                        x={kortX}
                        y={m.y}
                        tittel={m.tittel}
                        tekst={m.tekst}
                        farge={m.farge}
                        fokus={beat === i + 1}
                    />
                ) : null
            )}
            {beat === 0 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort x={760} y={430} tittel="Ingen straff" farge={FARGE.gra} fs={40} />
                    <Kryss x={760 + bredde('Ingen straff', 40) + 110} y={467} />
                </motion.g>
            )}
            {beat === 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <Person x={1290} y={420} farge={FARGE.bla} s={1.1} />
                    <Kort
                        x={1150}
                        y={440}
                        tittel="Den som ble ranet"
                        tekst="har krav på det"
                        farge={FARGE.bla}
                        fs={30}
                    />
                </motion.g>
            )}
            {grenser && (
                <>
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Kort x={1560} y={160} hoyre tittel="Pågripe" farge={FARGE.rod} fs={32} />
                        <Kryss x={1560 - bredde('Pågripe', 32) - 100} y={193} r={18} />
                        <Kort
                            x={1560}
                            y={270}
                            hoyre
                            tittel="Varetekt"
                            tekst="holde innesperret"
                            farge={FARGE.rod}
                            fs={32}
                        />
                        <Kryss x={1560 - bredde('holde innesperret', 25) - 100} y={318} r={18} />
                    </motion.g>
                    {beat >= 5 && (
                        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Klokke x={1200} y={480} />
                            <Kort
                                x={1560}
                                y={600}
                                hoyre
                                tittel="Inntil fire timer"
                                tekst="mens de leter etter foreldrene"
                                farge={FARGE.gul}
                                fs={32}
                            />
                            <Kort
                                x={1560}
                                y={730}
                                hoyre
                                tittel="Ta med barnet"
                                tekst="for eksempel hvis det er svært beruset"
                                farge={FARGE.gul}
                                fs={32}
                            />
                        </motion.g>
                    )}
                </>
            )}
        </>
    );
}

/** En klokke der en sektor på fire timer fylles. */
function Klokke({ x, y }: { x: number; y: number }) {
    const r = 70;
    // Fire timer av tolv er en tredjedel av runden.
    const slutt = -Math.PI / 2 + (Math.PI * 2) / 3;
    const ex = x + r * Math.cos(slutt);
    const ey = y + r * Math.sin(slutt);
    return (
        <g>
            <circle cx={x} cy={y} r={r + 8} fill="#ffffff" stroke={FARGE.blekk} strokeWidth={6} />
            <motion.path
                d={`M ${x} ${y} L ${x} ${y - r} A ${r} ${r} 0 0 1 ${ex} ${ey} Z`}
                fill="#fcd34d"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
            />
            {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return (
                    <line
                        key={i}
                        x1={x + (r - 10) * Math.sin(a)}
                        y1={y - (r - 10) * Math.cos(a)}
                        x2={x + r * Math.sin(a)}
                        y2={y - r * Math.cos(a)}
                        stroke={FARGE.blekk}
                        strokeWidth={4}
                    />
                );
            })}
            <circle cx={x} cy={y} r={7} fill={FARGE.blekk} />
        </g>
    );
}

/* ---------------- over15 ---------------- */

function Celle({ x, y, s = 1, lys = false }: { x: number; y: number; s?: number; lys?: boolean }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <rect
                x={-90}
                y={-110}
                width={180}
                height={220}
                rx={14}
                fill={lys ? '#94a3b8' : '#334155'}
            />
            {[-54, -18, 18, 54].map((sx) => (
                <rect key={sx} x={sx - 6} y={-110} width={12} height={220} fill="#cbd5e1" />
            ))}
            <rect x={-90} y={-14} width={180} height={12} fill="#cbd5e1" />
        </g>
    );
}

function Over15({ beat }: { beat: number }) {
    if (beat <= 2) {
        return (
            <>
                <Person x={190} y={600} farge={FARGE.lilla} s={1.4} />
                <Person x={300} y={600} farge="#16a34a" s={1.4} />
                <text
                    x={245}
                    y={650}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill="#92400e"
                >
                    16 år
                </text>
                {beat === 0 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Kort
                            x={460}
                            y={260}
                            tittel="Unge under 18"
                            tekst="egne regler i loven"
                            farge={FARGE.gul}
                            fs={40}
                        />
                        <text
                            x={1040}
                            y={340}
                            textAnchor="middle"
                            fontSize={80}
                            fontWeight={900}
                            fill={FARGE.gra}
                        >
                            ≠
                        </text>
                        <Kort x={1130} y={260} tittel="Voksne" farge={FARGE.gra} fs={40} />
                    </motion.g>
                )}
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <path
                            d="M 400 560 L 1260 560"
                            stroke="#cbd5e1"
                            strokeWidth={40}
                            strokeLinecap="round"
                        />
                        {[560, 760, 960].map((sx) => (
                            <circle
                                key={sx}
                                cx={sx}
                                cy={560}
                                r={22}
                                fill="#ffffff"
                                stroke={FARGE.gronn}
                                strokeWidth={6}
                            />
                        ))}
                        <Celle x={1380} y={540} />
                        <Kort
                            x={1560}
                            y={700}
                            hoyre
                            tittel="Fengsel: siste utvei"
                            tekst="bare når det er helt nødvendig"
                            farge={FARGE.rod}
                            fs={34}
                        />
                        <Kort
                            x={420}
                            y={200}
                            tittel="FNs barnekonvensjon"
                            tekst="Norge har skrevet under"
                            farge={FARGE.bla}
                            fs={36}
                        />
                        <text
                            x={760}
                            y={650}
                            textAnchor="middle"
                            fontSize={28}
                            fontWeight={700}
                            fill={FARGE.gra}
                        >
                            først andre løsninger
                        </text>
                    </motion.g>
                )}
                {beat === 2 && <Tak />}
            </>
        );
    }
    // Hvor sakene havner.
    const fra = { x: 380, y: 520 };
    const mal = [
        { y: 250, tittel: 'Konfliktrådet', farge: FARGE.gronn },
        { y: 470, tittel: 'Ikke tatt videre', farge: FARGE.gronn },
        { y: 720, tittel: 'Retten', farge: FARGE.gra },
    ];
    return (
        <>
            {mal.map((m) => (
                <Vei
                    key={m.tittel}
                    fra={fra}
                    til={{ x: 980, y: m.y + 40 }}
                    aktiv={m.tittel !== 'Retten'}
                />
            ))}
            <Mappe x={300} y={520} />
            <text
                x={300}
                y={610}
                textAnchor="middle"
                fontSize={28}
                fontWeight={700}
                fill={FARGE.gra}
            >
                15–17 år
            </text>
            {mal.map((m) => (
                <Kort key={m.tittel} x={980} y={m.y} tittel={m.tittel} farge={m.farge} fs={40} />
            ))}
            {/* Klamme rundt de to vanligste */}
            <path
                d="M 1380 250 L 1410 250 L 1410 554 L 1380 554"
                stroke={FARGE.gronn}
                strokeWidth={6}
                fill="none"
            />
            <text x={1430} y={390} fontSize={32} fontWeight={800} fill={FARGE.gronn}>
                Det
            </text>
            <text x={1430} y={430} fontSize={32} fontWeight={800} fill={FARGE.gronn}>
                vanligste
            </text>
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Person x={640} y={600} farge={FARGE.blekk} s={1.1} />
                    <Kort
                        x={420}
                        y={660}
                        tittel="Påtalemyndigheten"
                        tekst="bestemmer om saken skal for retten"
                        farge={FARGE.blekk}
                        fs={32}
                    />
                    <text x={448} y={815} fontSize={26} fontWeight={700} fill={FARGE.gra}>
                        en del av politiet og statsadvokatene
                    </text>
                </motion.g>
            )}
        </>
    );
}

/** Taket: fengsel i år, der stolpen stopper ved 15 år for barn under 18. */
function Tak() {
    const x0 = 420;
    const per = 50;
    const y = 470;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <rect
                x={x0}
                y={y - 45}
                width={21 * per}
                height={90}
                rx={14}
                fill="#f1f5f9"
                stroke="#cbd5e1"
                strokeWidth={3}
            />
            <motion.rect
                x={x0}
                y={y - 45}
                height={90}
                rx={14}
                fill={FARGE.rod}
                initial={{ width: 0 }}
                animate={{ width: 15 * per }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
            />
            <line
                x1={x0 + 15 * per}
                y1={y - 90}
                x2={x0 + 15 * per}
                y2={y + 90}
                stroke={FARGE.blekk}
                strokeWidth={12}
            />
            <text
                x={x0 + 15 * per}
                y={y + 150}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={FARGE.rod}
            >
                15 år
            </text>
            <text x={x0} y={y + 100} fontSize={30} fontWeight={700} fill={FARGE.gra}>
                0 år
            </text>
            <Kort
                x={x0}
                y={230}
                tittel="Lengste straff: 15 år"
                tekst="for barn under 18, selv for de verste lovbruddene"
                farge={FARGE.rod}
                fs={34}
            />
        </motion.g>
    );
}

/* ---------------- veiskille ---------------- */

const SAK = { x: 230, y: 500 };
const RETTEN = { x: 720, y: 270 };
const PATALE = { x: 720, y: 720 };

/** Varighet som stolpe på en skala fra 0 til 24 måneder. */
function Varighet({
    x,
    y,
    fra,
    til,
    farge,
}: {
    x: number;
    y: number;
    fra: number;
    til: number;
    farge: string;
}) {
    const per = 18;
    return (
        <g>
            <rect x={x} y={y} width={24 * per} height={22} rx={8} fill="#e2e8f0" />
            <motion.rect
                x={x + fra * per}
                y={y}
                height={22}
                rx={8}
                fill={farge}
                initial={{ width: 0 }}
                animate={{ width: (til - fra) * per }}
                transition={{ duration: 1 }}
            />
        </g>
    );
}

function Veiskille({ beat }: { beat: number }) {
    const nei = beat === 3;
    const sakPos = nei
        ? { x: RETTEN.x - 150, y: RETTEN.y + 40 }
        : beat >= 1
          ? { x: PATALE.x - 150, y: PATALE.y - 30 }
          : SAK;
    return (
        <>
            <Vei fra={SAK} til={RETTEN} aktiv={nei} />
            <Vei fra={SAK} til={PATALE} aktiv={beat >= 1 && !nei} />
            {/* Rettssal og påtalemyndighet som knutepunkt */}
            <g>
                <rect
                    x={RETTEN.x - 20}
                    y={RETTEN.y - 60}
                    width={210}
                    height={120}
                    rx={18}
                    fill={nei ? FARGE.rod : '#ffffff'}
                    stroke={FARGE.rod}
                    strokeWidth={5}
                />
                <text
                    x={RETTEN.x + 85}
                    y={RETTEN.y + 14}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={900}
                    fill={nei ? '#ffffff' : FARGE.rod}
                >
                    Retten
                </text>
            </g>
            <g>
                <rect
                    x={PATALE.x - 20}
                    y={PATALE.y - 60}
                    width={380}
                    height={120}
                    rx={18}
                    fill={beat >= 1 && !nei ? FARGE.gronn : '#ffffff'}
                    stroke={FARGE.gronn}
                    strokeWidth={5}
                />
                <text
                    x={PATALE.x + 170}
                    y={PATALE.y + 14}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={900}
                    fill={beat >= 1 && !nei ? '#ffffff' : FARGE.gronn}
                >
                    Påtalemyndigheten
                </text>
            </g>
            {/* Straffene til høyre */}
            <Kort
                x={1010}
                y={190}
                tittel="Ungdomsstraff"
                tekst="120 dager til to år"
                farge={FARGE.rod}
                fs={38}
                fokus={nei}
            />
            <Varighet x={1040} y={340} fra={4} til={24} farge={FARGE.rod} />
            <Kort
                x={1110}
                y={640}
                tittel="Ungdomsoppfølging"
                tekst="fire måneder til ett år"
                farge={FARGE.gronn}
                fs={38}
                fokus={beat >= 1 && !nei}
            />
            <Varighet x={1110} y={790} fra={4} til={12} farge={FARGE.gronn} />
            <text
                x={1040 + 24 * 18}
                y={398}
                textAnchor="end"
                fontSize={24}
                fontWeight={700}
                fill={FARGE.gra}
            >
                to år
            </text>
            <text
                x={1110 + 12 * 18}
                y={848}
                textAnchor="middle"
                fontSize={24}
                fontWeight={700}
                fill={FARGE.gra}
            >
                ett år
            </text>
            {beat >= 1 && !nei && beat < 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kryss x={RETTEN.x - 70} y={RETTEN.y - 70} r={20} />
                    <text
                        x={RETTEN.x - 120}
                        y={RETTEN.y - 120}
                        textAnchor="middle"
                        fontSize={28}
                        fontWeight={800}
                        fill={FARGE.rod}
                    >
                        ingen rettssak
                    </text>
                </motion.g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort
                        x={140}
                        y={640}
                        tittel="Har tilstått"
                        tekst="innrømmet lovbruddet"
                        farge={FARGE.gronn}
                        fs={30}
                    />
                    <Hakk x={110} y={680} />
                    <Kort x={140} y={780} tittel="Sier selv ja" farge={FARGE.gronn} fs={30} />
                    <Hakk x={110} y={812} />
                </motion.g>
            )}
            {nei && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort x={140} y={700} tittel="Den unge sier nei" farge={FARGE.rod} fs={34} />
                    <Kryss x={110} y={734} r={18} />
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Kort
                        x={140}
                        y={150}
                        tittel="Mål: hindre nye lovbrudd"
                        farge={FARGE.blekk}
                        fs={34}
                        fokus
                    />
                    <Kort
                        x={140}
                        y={760}
                        tittel="Fullføre skolen"
                        tekst="ofte mer å vinne enn på å sitte innelåst"
                        farge={FARGE.bla}
                        fs={30}
                    />
                </motion.g>
            )}
            <motion.g
                initial={false}
                animate={{ x: sakPos.x, y: sakPos.y }}
                transition={{ type: 'spring', stiffness: 70, damping: 16 }}
            >
                <Mappe x={0} y={0} />
            </motion.g>
        </>
    );
}

export function UngdomVeien({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'alder';
    const linjer = OVERSKRIFT[modus];
    const overskrift = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#f8fafc 0%,#ffffff 85%)' }}
        >
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'alder' && <Alder beat={beat} />}
                {modus === 'under15' && <Under15 beat={beat} />}
                {modus === 'over15' && <Over15 beat={beat} />}
                {modus === 'veiskille' && <Veiskille beat={beat} />}
                <Overskrift tekst={overskrift} />
            </svg>
        </div>
    );
}
