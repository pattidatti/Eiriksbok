import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { AteismeOverskrift, Hake, Kryss, Vis } from './felles';

/**
 * Tidslinjer som SVG (1600x900).
 * «antikken»: Anaxagoras, Sokrates, Epikur og middelalderen.
 * «darwin»: 1600-tallet, Darwins bok i 1859, livets tre og Huxley.
 * «norge»: sekularisering på tre nivåer, 2017 og undersøkelsen fra 2018.
 * «frihet»: Skandinavia i dag, land der det er forbudt, og Athen for lenge siden.
 */

type Modus = 'antikken' | 'darwin' | 'norge' | 'frihet';

const BAKGRUNN = '#f5f1e8';
const BLEKK = '#1c1917';
const DEMPET = '#78716c';
const ROD = '#b91c1c';
const TEAL = '#0d9488';
const GULL = '#b45309';
const BLA = '#1d4ed8';

const OVERSKRIFT: Record<Modus, string[]> = {
    antikken: [
        'En svært gammel tanke',
        'Anaxagoras avviste mytene',
        'Epikur: sjelen løses opp',
        'Middelalderen',
    ],
    darwin: [
        '1600-tallet: et nytt bilde av verdensrommet',
        '1859: Om artenes opprinnelse',
        'Livet forklart uten en skaper',
        'Et nytt ord: agnostiker',
        'Darwins bulldog',
    ],
    norge: [
        'Sekularisering',
        'Flere nivåer på én gang',
        '2017: kirke og stat skilles',
        'Spørreundersøkelse fra 2018',
    ],
    frihet: ['Å være ateist i Skandinavia i dag', 'Mange land utenfor Vesten', 'Ikke selvsagt'],
};

/** Merke på tidslinja: strek ned til aksen og et kort over. */
function Merke({
    x,
    akseY,
    kortY,
    linjer,
    farge,
    bredde,
    kortX,
}: {
    x: number;
    akseY: number;
    kortY: number;
    linjer: string[];
    farge: string;
    bredde: number;
    kortX?: number;
}) {
    const h = 30 + linjer.length * 46;
    const kx = kortX ?? Math.min(Math.max(x - bredde / 2, 40), 1560 - bredde);
    const lx = Math.min(Math.max(x, kx + 30), kx + bredde - 30);
    return (
        <g>
            <line x1={lx} y1={kortY + h} x2={x} y2={akseY} stroke={farge} strokeWidth={4} />
            <rect
                x={kx}
                y={kortY}
                width={bredde}
                height={h}
                rx={18}
                fill="#ffffff"
                stroke={farge}
                strokeWidth={5}
            />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={kx + bredde / 2}
                    y={kortY + 54 + i * 46}
                    textAnchor="middle"
                    fontSize={i === 0 ? 36 : 30}
                    fontWeight={i === 0 ? 900 : 700}
                    fill={i === 0 ? farge : BLEKK}
                >
                    {l}
                </text>
            ))}
        </g>
    );
}

/* ------------------------------------------------------------------ antikken */

function Antikken({ beat }: { beat: number }) {
    // År -550 til 1550 på x 120-1480.
    const X = (ar: number) => 120 + ((ar + 550) / 2100) * 1360;
    const AKSE = 760;
    return (
        <>
            <line x1={100} y1={AKSE} x2={1500} y2={AKSE} stroke={BLEKK} strokeWidth={6} />
            <path d={`M 1500 ${AKSE - 16} L 1530 ${AKSE} L 1500 ${AKSE + 16} Z`} fill={BLEKK} />
            <text
                x={X(-450)}
                y={AKSE + 60}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={DEMPET}
            >
                før vår tidsregning
            </text>
            <line
                x1={X(0)}
                y1={AKSE - 16}
                x2={X(0)}
                y2={AKSE + 16}
                stroke={BLEKK}
                strokeWidth={4}
            />
            <text
                x={X(0)}
                y={AKSE + 60}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={DEMPET}
            >
                år 0
            </text>
            <text
                x={X(1000)}
                y={AKSE + 60}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={DEMPET}
            >
                etter
            </text>
            {beat === 0 && (
                <Vis nar>
                    <text
                        x={800}
                        y={400}
                        textAnchor="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        Kan verden forklares
                    </text>
                    <text
                        x={800}
                        y={470}
                        textAnchor="middle"
                        fontSize={54}
                        fontWeight={900}
                        fill={BLEKK}
                    >
                        uten guder?
                    </text>
                    <motion.rect
                        x={X(-550)}
                        y={AKSE - 10}
                        height={20}
                        fill={GULL}
                        initial={{ width: 0 }}
                        animate={{ width: X(-300) - X(-550) }}
                        transition={{ duration: 1.6 }}
                    />
                </Vis>
            )}
            <Vis nar={beat >= 1}>
                <rect x={X(-500)} y={AKSE - 14} width={X(-428) - X(-500)} height={28} fill={GULL} />
                <Merke
                    x={(X(-500) + X(-428)) / 2}
                    akseY={AKSE - 14}
                    kortY={230}
                    linjer={[
                        'Anaxagoras',
                        '500-428 før vår tidsregning',
                        'avviste de religiøse mytene',
                    ]}
                    farge={GULL}
                    bredde={460}
                />
                <circle cx={X(-399)} cy={AKSE} r={14} fill={ROD} />
                <text
                    x={X(-399) + 10}
                    y={AKSE + 110}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill={ROD}
                >
                    399 fvt.: Sokrates dømt
                </text>
            </Vis>
            <Vis nar={beat >= 2}>
                <rect x={X(-341)} y={AKSE - 14} width={X(-270) - X(-341)} height={28} fill={TEAL} />
                <Merke
                    x={(X(-341) + X(-270)) / 2}
                    akseY={AKSE - 14}
                    kortY={230}
                    kortX={560}
                    linjer={['Epikur', '341-270 fvt.', 'sjelen løses opp når vi dør']}
                    farge={TEAL}
                    bredde={460}
                />
            </Vis>
            <Vis nar={beat >= 3}>
                <motion.rect
                    x={X(500)}
                    y={AKSE - 22}
                    height={44}
                    rx={10}
                    fill={BLA}
                    opacity={0.85}
                    initial={{ width: 0 }}
                    animate={{ width: X(1500) - X(500) }}
                    transition={{ duration: 1.2 }}
                />
                <text
                    x={(X(500) + X(1500)) / 2}
                    y={AKSE + 10}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    middelalderen
                </text>
                <Merke
                    x={(X(500) + X(1500)) / 2}
                    akseY={AKSE - 22}
                    kortY={460}
                    linjer={[
                        'Ateisme i middelalderen',
                        'sett på som ufornuftig,',
                        'mer enn som kjetteri',
                    ]}
                    farge={BLA}
                    bredde={520}
                />
            </Vis>
        </>
    );
}

/* ------------------------------------------------------------------ darwin */

/** Livets tre: grener som deler seg. Tegnes opp med pathLength. */
function Livstre({ x, y }: { x: number; y: number }) {
    const grener = [
        'M 0 0 L 0 -120',
        'M 0 -120 L -110 -230',
        'M 0 -120 L 110 -230',
        'M -110 -230 L -170 -330',
        'M -110 -230 L -50 -330',
        'M 110 -230 L 60 -330',
        'M 110 -230 L 170 -330',
        'M 60 -330 L 30 -400',
        'M 60 -330 L 100 -400',
    ];
    return (
        <g transform={`translate(${x} ${y})`}>
            {grener.map((d, i) => (
                <motion.path
                    key={d}
                    d={d}
                    stroke={TEAL}
                    strokeWidth={14 - Math.min(i, 6)}
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.18 }}
                />
            ))}
            {[
                [-170, -330],
                [-50, -330],
                [170, -330],
                [30, -400],
                [100, -400],
            ].map(([px, py], i) => (
                <motion.circle
                    key={`${px}${py}`}
                    cx={px}
                    cy={py}
                    r={16}
                    fill={GULL}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 + i * 0.12 }}
                />
            ))}
        </g>
    );
}

function Darwin({ beat }: { beat: number }) {
    // År 1550 til 1950 på x 120-1480.
    const X = (ar: number) => 120 + ((ar - 1550) / 400) * 1360;
    const AKSE = 780;
    return (
        <>
            <line x1={100} y1={AKSE} x2={1500} y2={AKSE} stroke={BLEKK} strokeWidth={6} />
            <path d={`M 1500 ${AKSE - 16} L 1530 ${AKSE} L 1500 ${AKSE + 16} Z`} fill={BLEKK} />
            {[1600, 1700, 1800, 1900].map((ar) => (
                <g key={ar}>
                    <line
                        x1={X(ar)}
                        y1={AKSE - 14}
                        x2={X(ar)}
                        y2={AKSE + 14}
                        stroke={BLEKK}
                        strokeWidth={4}
                    />
                    <text
                        x={X(ar)}
                        y={AKSE + 56}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={800}
                        fill={DEMPET}
                    >
                        {ar}
                    </text>
                </g>
            ))}
            {/* 1600-tallet */}
            <rect
                x={X(1600)}
                y={AKSE - 18}
                width={X(1700) - X(1600)}
                height={36}
                fill={BLA}
                opacity={beat === 0 ? 0.9 : 0.35}
            />
            {beat === 0 && (
                <Vis nar>
                    <Merke
                        x={(X(1600) + X(1700)) / 2}
                        akseY={AKSE - 18}
                        kortY={300}
                        linjer={[
                            'Galileo Galilei og Isaac Newton',
                            'rokker ved kirkens bilde',
                            'av verdensrommet',
                        ]}
                        farge={BLA}
                        bredde={660}
                    />
                    {/* Jorda rundt sola */}
                    <circle cx={1150} cy={430} r={60} fill="#facc15" />
                    <circle
                        cx={1150}
                        cy={430}
                        r={170}
                        fill="none"
                        stroke={DEMPET}
                        strokeWidth={3}
                        strokeDasharray="10 10"
                    />
                    <g>
                        <circle cx={1320} cy={430} r={24} fill="#3b82f6" />
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 1150 430"
                            to="360 1150 430"
                            dur="8s"
                            repeatCount="indefinite"
                        />
                    </g>
                </Vis>
            )}
            <Vis nar={beat >= 1}>
                <circle cx={X(1859)} cy={AKSE} r={16} fill={TEAL} />
                <text
                    x={X(1859)}
                    y={AKSE + 56}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={TEAL}
                >
                    1859
                </text>
            </Vis>
            {beat === 1 && (
                <Vis nar>
                    {/* Boka */}
                    <g transform="translate(560 220) rotate(-3)">
                        <rect x={0} y={0} width={480} height={420} rx={14} fill="#14532d" />
                        <rect
                            x={20}
                            y={20}
                            width={440}
                            height={380}
                            rx={10}
                            fill="none"
                            stroke="#facc15"
                            strokeWidth={4}
                        />
                        <text
                            x={240}
                            y={150}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#fef3c7"
                        >
                            Om artenes
                        </text>
                        <text
                            x={240}
                            y={205}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#fef3c7"
                        >
                            opprinnelse
                        </text>
                        <text
                            x={240}
                            y={320}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={700}
                            fill="#fde68a"
                        >
                            Charles Darwin
                        </text>
                    </g>
                    <line
                        x1={X(1859)}
                        y1={AKSE - 16}
                        x2={X(1859)}
                        y2={650}
                        stroke={TEAL}
                        strokeWidth={4}
                    />
                </Vis>
            )}
            {beat === 2 && (
                <Vis nar>
                    <Livstre x={800} y={660} />
                    <text x={1000} y={360} fontSize={38} fontWeight={900} fill={BLEKK}>
                        Et vitenskapelig grunnlag
                    </text>
                    <text x={1000} y={410} fontSize={38} fontWeight={900} fill={BLEKK}>
                        for å forstå livet
                    </text>
                    <text x={1000} y={460} fontSize={38} fontWeight={900} fill={TEAL}>
                        uten en skaper
                    </text>
                </Vis>
            )}
            <Vis nar={beat >= 3}>
                <rect
                    x={X(1825)}
                    y={AKSE - 60}
                    width={X(1895) - X(1825)}
                    height={26}
                    rx={8}
                    fill={GULL}
                />
                <text
                    x={(X(1825) + X(1895)) / 2}
                    y={AKSE - 76}
                    textAnchor="middle"
                    fontSize={28}
                    fontWeight={800}
                    fill={GULL}
                >
                    Huxley 1825-1895
                </text>
                <Merke
                    x={(X(1825) + X(1895)) / 2}
                    akseY={AKSE - 110}
                    kortY={beat === 3 ? 260 : 200}
                    linjer={[
                        'Thomas Henry Huxley',
                        'britisk naturforsker',
                        'lager ordet «agnostiker»',
                    ]}
                    farge={GULL}
                    bredde={520}
                />
            </Vis>
            <Vis nar={beat >= 4}>
                <rect x={480} y={420} width={560} height={110} rx={22} fill={GULL} />
                <text
                    x={760}
                    y={492}
                    textAnchor="middle"
                    fontSize={50}
                    fontWeight={900}
                    fill="#ffffff"
                >
                    «Darwins bulldog»
                </text>
                <text
                    x={760}
                    y={590}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={800}
                    fill={BLEKK}
                >
                    kjempet hardt for utviklingslæren
                </text>
            </Vis>
        </>
    );
}

/* ------------------------------------------------------------------ norge */

function Norge({ beat }: { beat: number }) {
    const X = (ar: number) => 140 + ((ar - 2012) / 8) * 820;
    const AKSE = 760;
    return (
        <>
            <rect
                x={300}
                y={160}
                width={1000}
                height={130}
                rx={22}
                fill="#ffffff"
                stroke={BLEKK}
                strokeWidth={4}
                opacity={beat >= 2 ? 0.6 : 1}
            />
            <text
                x={800}
                y={216}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill={BLEKK}
                opacity={beat >= 2 ? 0.6 : 1}
            >
                Sekularisering:
            </text>
            <text
                x={800}
                y={266}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill={BLEKK}
                opacity={beat >= 2 ? 0.6 : 1}
            >
                religion mister innflytelse
            </text>
            {beat === 0 && (
                <Vis nar>
                    {['enkeltmennesker', 'kultur', 'samfunn'].map((t, i) => (
                        <g key={t}>
                            <rect
                                x={260 + i * 380}
                                y={380}
                                width={320}
                                height={90}
                                rx={18}
                                fill="#f1f5f9"
                                stroke={DEMPET}
                                strokeWidth={3}
                            />
                            <text
                                x={420 + i * 380}
                                y={438}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                                fill={BLEKK}
                            >
                                {t}
                            </text>
                        </g>
                    ))}
                    <motion.path
                        d="M 800 300 L 800 370"
                        stroke={ROD}
                        strokeWidth={6}
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                    />
                </Vis>
            )}
            <Vis nar={beat >= 1}>
                {[
                    { t: 'i lovverket', f: BLA },
                    { t: 'i organisasjoner', f: GULL },
                    { t: 'hos den enkelte', f: TEAL },
                ].map((n, i) => (
                    <g key={n.t} opacity={beat >= 2 ? 0.55 : 1}>
                        <rect
                            x={210 + i * 410}
                            y={340}
                            width={360}
                            height={110}
                            rx={20}
                            fill="#ffffff"
                            stroke={n.f}
                            strokeWidth={6}
                        />
                        <text
                            x={390 + i * 410}
                            y={385}
                            textAnchor="middle"
                            fontSize={26}
                            fontWeight={800}
                            fill={DEMPET}
                        >
                            Nivå {i + 1}
                        </text>
                        <text
                            x={390 + i * 410}
                            y={428}
                            textAnchor="middle"
                            fontSize={36}
                            fontWeight={900}
                            fill={n.f}
                        >
                            {n.t}
                        </text>
                    </g>
                ))}
            </Vis>
            <Vis nar={beat >= 2}>
                <line x1={120} y1={AKSE} x2={980} y2={AKSE} stroke={BLEKK} strokeWidth={5} />
                <circle cx={X(2017)} cy={AKSE} r={16} fill={BLA} />
                <text
                    x={X(2017)}
                    y={AKSE + 54}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={BLA}
                >
                    2017
                </text>
                <rect
                    x={X(2017) - 260}
                    y={540}
                    width={520}
                    height={130}
                    rx={18}
                    fill="#eff6ff"
                    stroke={BLA}
                    strokeWidth={4}
                />
                <text
                    x={X(2017)}
                    y={592}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    Den norske kirke formelt
                </text>
                <text
                    x={X(2017)}
                    y={640}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={BLEKK}
                >
                    skilt fra staten
                </text>
                <line
                    x1={X(2017)}
                    y1={670}
                    x2={X(2017)}
                    y2={AKSE - 16}
                    stroke={BLA}
                    strokeWidth={4}
                />
            </Vis>
            <Vis nar={beat >= 3}>
                <circle cx={X(2018)} cy={AKSE} r={16} fill={GULL} />
                <text
                    x={X(2018) + 30}
                    y={AKSE + 54}
                    textAnchor="middle"
                    fontSize={32}
                    fontWeight={900}
                    fill={GULL}
                >
                    2018
                </text>
                <line
                    x1={X(2018)}
                    y1={AKSE}
                    x2={1100}
                    y2={AKSE}
                    stroke={GULL}
                    strokeWidth={4}
                    strokeDasharray="10 8"
                />
                {/* 100 ruter, 26 farget */}
                {Array.from({ length: 100 }, (_, i) => {
                    const k = i % 10;
                    const r = Math.floor(i / 10);
                    return (
                        <motion.rect
                            key={i}
                            x={1120 + k * 34}
                            y={500 + r * 34}
                            width={28}
                            height={28}
                            rx={5}
                            fill={i < 26 ? GULL : '#d6d3d1'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i < 26 ? 0.4 + i * 0.03 : 0 }}
                        />
                    );
                })}
                <text x={1560} y={880} textAnchor="end" fontSize={30} fontWeight={900} fill={GULL}>
                    2018: 26 av 100 spurte trodde ikke på Gud
                </text>
            </Vis>
        </>
    );
}

/* ------------------------------------------------------------------ frihet */

function Frihet({ beat }: { beat: number }) {
    return (
        <>
            {/* Tidspil fra Athen til i dag */}
            <Vis nar={beat >= 2}>
                <line x1={250} y1={800} x2={1350} y2={800} stroke={BLEKK} strokeWidth={6} />
                <path d="M 1350 784 L 1380 800 L 1350 816 Z" fill={BLEKK} />
                <circle cx={250} cy={800} r={14} fill={ROD} />
                <text x={250} y={855} textAnchor="middle" fontSize={30} fontWeight={800} fill={ROD}>
                    399 fvt.
                </text>
                <text
                    x={1350}
                    y={855}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill={BLEKK}
                >
                    i dag
                </text>
                <rect
                    x={80}
                    y={200}
                    width={480}
                    height={300}
                    rx={24}
                    fill="#fef2f2"
                    stroke={ROD}
                    strokeWidth={6}
                />
                <text x={320} y={270} textAnchor="middle" fontSize={36} fontWeight={900} fill={ROD}>
                    Athen, 399 fvt.
                </text>
                <text
                    x={320}
                    y={350}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={BLEKK}
                >
                    Sokrates dømt.
                </text>
                <text
                    x={320}
                    y={410}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={BLEKK}
                >
                    Å ikke tro var
                </text>
                <text
                    x={320}
                    y={455}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={BLEKK}
                >
                    en forbrytelse
                </text>
                <line x1={250} y1={786} x2={250} y2={500} stroke={ROD} strokeWidth={4} />
            </Vis>
            <motion.g
                initial={false}
                animate={{ x: beat >= 2 ? 120 : 0 }}
                transition={{ duration: 0.6 }}
            >
                <rect
                    x={560}
                    y={180}
                    width={820}
                    height={220}
                    rx={24}
                    fill="#f0fdfa"
                    stroke={TEAL}
                    strokeWidth={6}
                />
                <Hake x={630} y={250} s={26} />
                <text x={690} y={262} fontSize={40} fontWeight={900} fill={TEAL}>
                    Skandinavia: fullt akseptert
                </text>
                <text x={690} y={322} fontSize={28} fontWeight={700} fill={BLEKK}>
                    så lenge det følges av humanistiske
                </text>
                <text x={690} y={362} fontSize={28} fontWeight={700} fill={BLEKK}>
                    og demokratiske verdier
                </text>
                <Vis nar={beat >= 1}>
                    <rect
                        x={560}
                        y={440}
                        width={820}
                        height={160}
                        rx={24}
                        fill="#fef2f2"
                        stroke={ROD}
                        strokeWidth={6}
                    />
                    <Kryss x={630} y={520} s={22} />
                    <text x={690} y={510} fontSize={38} fontWeight={900} fill={ROD}>
                        Mange land utenfor Vesten:
                    </text>
                    <text x={690} y={562} fontSize={34} fontWeight={800} fill={BLEKK}>
                        fortsatt strengt forbudt
                    </text>
                </Vis>
            </motion.g>
        </>
    );
}

export function AteismeTidslinje({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'antikken';
    const liste = OVERSKRIFT[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: BAKGRUNN }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'antikken' && <Antikken beat={beat} />}
                {modus === 'darwin' && <Darwin beat={beat} />}
                {modus === 'norge' && <Norge beat={beat} />}
                {modus === 'frihet' && <Frihet beat={beat} />}
            </svg>
            <AteismeOverskrift tekst={tekst} />
        </div>
    );
}
