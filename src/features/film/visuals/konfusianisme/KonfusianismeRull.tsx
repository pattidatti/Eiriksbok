import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Konfusianisme-filmens skriftrull (2D). Alt tegnes på en flate på 1600x900 som ser ut
 * som en utrullet rull med en stav i hver ende.
 * - «liv»: livet til Konfucius på en tidslinje, og hva han mente skulle til.
 * - «dyder»: det edle mennesket og de fem dydene rundt det.
 * - «regel»: den gylne regel, snudd.
 * - «eksamen»: bøkene du måtte kunne for å få jobb i staten.
 */
type Modus = 'liv' | 'dyder' | 'regel' | 'eksamen';

const B = 1600;
const H = 900;
const BLEKK = '#1c1917';
const ROD = '#9f1d1d';
const GULL = '#b45309';
const GRONN = '#0f766e';
const GRA = '#57534e';

const OVERSKRIFT: Record<Modus, string[]> = {
    liv: [
        'Konfucius: 551 til 479 før vår tid',
        'En gutt uten far',
        'Seremoniene: de faste formene',
        'Kina: mange små riker i krig',
        'Løsningen hans',
        'Samtalene',
    ],
    dyder: [
        'Hva slags menneske blir du?',
        'Junzi: det edle mennesket',
        'Dyder: gode egenskaper du øver opp',
        'Ren og li',
        'Yi og zhi',
        'Shu',
    ],
    regel: ['Den gylne regel', 'Snudd hos Konfucius', 'Hva du skal la være'],
    eksamen: [
        'Staten tar læren i bruk',
        'Ingen eksamen, ingen jobb i staten',
        'Arve plassen, eller lese seg til den?',
        'Bøkene du måtte kunne',
        'Ikke rettferdig slik vi mener i dag',
        'Nesten to tusen år',
    ],
};

/* ------------------------------------------------------------------ byggeklosser */

function Inn({ children, forsinkelse = 0.3 }: { children: ReactNode; forsinkelse?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: forsinkelse, duration: 0.6 }}
        >
            {children}
        </motion.g>
    );
}

interface Linje {
    t: string;
    fs?: number;
    fw?: number;
    farge?: string;
}

/** Kort med tekstlinjer. Bredden regnes ut fra den lengste linja, så teksten aldri stikker ut. */
function Kort({
    x,
    y,
    linjer,
    bakgrunn = '#fffdf7',
    kant = '#d6c7a8',
    midt = true,
    minBredde = 0,
}: {
    x: number;
    y: number;
    linjer: Linje[];
    bakgrunn?: string;
    kant?: string;
    midt?: boolean;
    minBredde?: number;
}) {
    const bredde = Math.max(minBredde, ...linjer.map((l) => l.t.length * 0.56 * (l.fs ?? 38) + 64));
    const hoyde = linjer.reduce((s, l) => s + (l.fs ?? 38) * 1.3, 0) + 40;
    const x0 = midt ? x - bredde / 2 : x;
    const yLinje = linjer.map((_, i) =>
        linjer.slice(0, i + 1).reduce((s, l) => s + (l.fs ?? 38) * 1.3, y + 20)
    );
    return (
        <g>
            <rect
                x={x0}
                y={y}
                width={bredde}
                height={hoyde}
                rx={20}
                fill={bakgrunn}
                stroke={kant}
                strokeWidth={3}
            />
            {linjer.map((l, i) => {
                const fs = l.fs ?? 38;
                const yy = yLinje[i];
                return (
                    <text
                        key={i}
                        x={midt ? x : x0 + 32}
                        y={yy - fs * 0.3}
                        textAnchor={midt ? 'middle' : 'start'}
                        fontSize={fs}
                        fontWeight={l.fw ?? 800}
                        fill={l.farge ?? BLEKK}
                    >
                        {l.t}
                    </text>
                );
            })}
        </g>
    );
}

/** En enkel figur i kappe, sett forfra. */
function Person({
    x,
    y,
    s = 1,
    farge = '#78716c',
    bukk = 0,
}: {
    x: number;
    y: number;
    s?: number;
    farge?: string;
    /** Vinkel i grader overkroppen bøyes mot siden (mot den andre figuren). */
    bukk?: number;
}) {
    return (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
            <path d="M -38 0 L -24 -110 L 24 -110 L 38 0 Z" fill={farge} />
            <g transform={bukk ? `rotate(${bukk} 0 -110)` : undefined}>
                <path d="M -24 -110 L -18 -150 L 18 -150 L 24 -110 Z" fill={farge} />
                <circle cx={0} cy={-172} r={22} fill="#e7c9a0" />
                <rect x={-14} y={-204} width={28} height={14} rx={4} fill={BLEKK} />
            </g>
        </g>
    );
}

function Kryss({ x, y, r = 22 }: { x: number; y: number; r?: number }) {
    return (
        <g stroke="#dc2626" strokeWidth={9} strokeLinecap="round">
            <line x1={x - r} y1={y - r} x2={x + r} y2={y + r} />
            <line x1={x + r} y1={y - r} x2={x - r} y2={y + r} />
        </g>
    );
}

/** En rød gnist mellom to riker: de slåss. */
function Gnist({ x, y }: { x: number; y: number }) {
    const pkt = Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = i % 2 === 0 ? 42 : 16;
        return `${x + Math.cos(a) * r},${y + Math.sin(a) * r}`;
    }).join(' ');
    return <polygon points={pkt} fill="#dc2626" />;
}

function Hake({ x, y }: { x: number; y: number }) {
    return (
        <path
            d={`M ${x - 22} ${y} L ${x - 6} ${y + 18} L ${x + 24} ${y - 20}`}
            stroke={GRONN}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
}

/** Bakgrunnen: papiret og de to stavene. */
function Rull() {
    return (
        <>
            <rect x={0} y={0} width={B} height={H} fill="#e7dcc4" />
            <rect x={70} y={40} width={B - 140} height={H - 80} fill="#f6eedb" />
            {[50, B - 50].map((x) => (
                <g key={x}>
                    <rect x={x - 22} y={24} width={44} height={H - 48} rx={22} fill="#6b3f22" />
                    <rect x={x - 30} y={14} width={60} height={30} rx={10} fill="#3f2a1c" />
                    <rect x={x - 30} y={H - 44} width={60} height={30} rx={10} fill="#3f2a1c" />
                </g>
            ))}
        </>
    );
}

/* ------------------------------------------------------------------ liv */

const T0 = 300;
const T1 = 1300;
const TY = 250;
/** År før vår tid -> x på tidslinja. 551 er venstre ende, 479 høyre. */
const tx = (ar: number) => T0 + ((551 - ar) / (551 - 479)) * (T1 - T0);

function Liv({ beat }: { beat: number }) {
    return (
        <>
            <line x1={T0} y1={TY} x2={T1} y2={TY} stroke={BLEKK} strokeWidth={6} />
            {[
                [551, 'født'],
                [479, 'død'],
            ].map(([ar, ord]) => (
                <g key={ar}>
                    <circle cx={tx(Number(ar))} cy={TY} r={16} fill={ROD} />
                    <text
                        x={tx(Number(ar))}
                        y={TY + 62}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                    >
                        {ar} fvt
                    </text>
                    <text
                        x={tx(Number(ar))}
                        y={TY - 34}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={GRA}
                    >
                        {ord}
                    </text>
                </g>
            ))}
            {beat >= 1 && (
                <Inn>
                    <circle cx={tx(548)} cy={TY} r={11} fill={GULL} />
                    <text x={tx(548) + 20} y={TY - 34} fontSize={30} fontWeight={700} fill={GULL}>
                        tre år: faren dør
                    </text>
                </Inn>
            )}
            {beat >= 5 && (
                <Inn>
                    <text
                        x={tx(479) - 60}
                        y={TY - 34}
                        textAnchor="end"
                        fontSize={30}
                        fontWeight={700}
                        fill={GRONN}
                    >
                        de siste årene: underviser
                    </text>
                </Inn>
            )}

            {/* Det som skjer under tidslinja bytter med beaten. */}
            <motion.g
                key={beat}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
            >
                {beat === 0 && (
                    <>
                        <Person x={800} y={740} s={1.2} farge="#a8a29e" />
                        <Kort
                            x={800}
                            y={380}
                            linjer={[
                                { t: 'Født i riket Lu', fs: 44, fw: 900 },
                                { t: 'i dagens Kina', fs: 34, fw: 700, farge: GRA },
                            ]}
                        />
                    </>
                )}
                {beat === 1 && (
                    <>
                        <Person x={700} y={780} s={1.3} farge="#7f1d1d" />
                        <Person x={830} y={780} s={0.8} farge="#d6c7a8" />
                        <Kort
                            x={1180}
                            y={560}
                            linjer={[
                                { t: 'Moren oppdrar', fs: 40, fw: 900 },
                                { t: 'ham alene', fs: 40, fw: 900 },
                            ]}
                        />
                    </>
                )}
                {beat === 2 && (
                    <>
                        {[
                            { x: 400, tekst: 'når de møttes' },
                            { x: 800, tekst: 'når de giftet seg' },
                            { x: 1200, tekst: 'når de ofret til de døde' },
                        ].map((p, i) => (
                            <Inn key={p.x} forsinkelse={0.3 + i * 0.7}>
                                <Person
                                    x={p.x - 50}
                                    y={700}
                                    s={0.9}
                                    farge="#1e3a8a"
                                    bukk={i !== 1 ? 28 : 0}
                                />
                                <Person
                                    x={p.x + 50}
                                    y={700}
                                    s={0.9}
                                    farge={i === 1 ? '#be185d' : '#7c2d12'}
                                    bukk={i === 0 ? -28 : 0}
                                />
                                <text
                                    x={p.x}
                                    y={780}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={800}
                                >
                                    {p.tekst}
                                </text>
                            </Inn>
                        ))}
                    </>
                )}
                {beat === 3 && (
                    <>
                        {[300, 470, 640, 810, 980, 1150, 1320].map((x, i) => (
                            <Inn key={x} forsinkelse={0.2 + i * 0.2}>
                                <line
                                    x1={x}
                                    y1={720}
                                    x2={x}
                                    y2={560}
                                    stroke={BLEKK}
                                    strokeWidth={6}
                                />
                                <path
                                    d={`M ${x} 560 L ${x + 80} 585 L ${x} 610 Z`}
                                    fill={
                                        [
                                            '#b91c1c',
                                            '#1d4ed8',
                                            '#15803d',
                                            '#7c3aed',
                                            '#b45309',
                                            '#0f766e',
                                            '#be185d',
                                        ][i]
                                    }
                                />
                            </Inn>
                        ))}
                        {[385, 725, 1065].map((x, i) => (
                            <Inn key={x} forsinkelse={1.8 + i * 0.4}>
                                <Gnist x={x} y={650} />
                            </Inn>
                        ))}
                        <Inn forsinkelse={2.8}>
                            <Kort
                                x={800}
                                y={380}
                                linjer={[
                                    {
                                        t: 'Fyrstene hadde glemt de gamle skikkene',
                                        fs: 36,
                                        fw: 800,
                                    },
                                ]}
                            />
                        </Inn>
                    </>
                )}
                {beat === 4 && (
                    <>
                        {['flere soldater', 'strengere straffer'].map((t, i) => (
                            <Inn key={t} forsinkelse={0.3 + i * 0.6}>
                                <Kryss x={300} y={440 + i * 110} />
                                <text
                                    x={350}
                                    y={454 + i * 110}
                                    fontSize={44}
                                    fontWeight={800}
                                    fill={GRA}
                                >
                                    {t}
                                </text>
                            </Inn>
                        ))}
                        <Inn forsinkelse={1.8}>
                            <Hake x={830} y={500} />
                            <text x={880} y={480} fontSize={48} fontWeight={900} fill={GRONN}>
                                Hvert menneske
                            </text>
                            <text x={880} y={540} fontSize={48} fontWeight={900} fill={GRONN}>
                                gjør sin del
                            </text>
                            {[0, 1, 2, 3].map((i) => (
                                <Person
                                    key={i}
                                    x={930 + i * 110}
                                    y={790}
                                    s={0.7}
                                    farge={['#1e3a8a', '#7c2d12', '#365314', '#7c3aed'][i]}
                                />
                            ))}
                        </Inn>
                    </>
                )}
                {beat === 5 && (
                    <>
                        <Person x={560} y={780} s={1.1} farge="#e7e0cf" />
                        {[0, 1, 2].map((i) => (
                            <Person key={i} x={760 + i * 110} y={780} s={0.8} farge="#a8a29e" />
                        ))}
                        <g transform="translate(1180 430)">
                            <rect x={-30} y={0} width={300} height={300} rx={16} fill="#7c2d12" />
                            <rect x={-8} y={22} width={256} height={256} rx={10} fill="#fef3c7" />
                            <text
                                x={120}
                                y={140}
                                textAnchor="middle"
                                fontSize={40}
                                fontWeight={900}
                            >
                                Samtalene
                            </text>
                            <text
                                x={120}
                                y={190}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={700}
                                fill={GRA}
                            >
                                skrevet ned
                            </text>
                            <text
                                x={120}
                                y={224}
                                textAnchor="middle"
                                fontSize={26}
                                fontWeight={700}
                                fill={GRA}
                            >
                                av elevene
                            </text>
                        </g>
                    </>
                )}
            </motion.g>
        </>
    );
}

/* ------------------------------------------------------------------ dyder */

const DYDER = [
    { navn: 'ren', betyr: 'godhet', fra: 3, vinkel: -90, stor: true },
    { navn: 'li', betyr: 'faste former', fra: 3, vinkel: -18 },
    { navn: 'yi', betyr: 'gjøre det riktige', fra: 4, vinkel: 54 },
    { navn: 'zhi', betyr: 'visdom', fra: 4, vinkel: 126 },
    { navn: 'shu', betyr: 'medfølelse', fra: 5, vinkel: 198 },
];
const MX = 800;
const MY = 540;
const RING = 290;

function Dyder({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <Inn>
                    <g transform="translate(220 300)">
                        <rect
                            width={260}
                            height={330}
                            rx={12}
                            fill="#fffdf7"
                            stroke="#d6c7a8"
                            strokeWidth={3}
                        />
                        <text
                            x={130}
                            y={64}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={GRA}
                        >
                            Regler
                        </text>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <rect
                                key={i}
                                x={36}
                                y={100 + i * 44}
                                width={188}
                                height={14}
                                rx={7}
                                fill="#d6d3d1"
                            />
                        ))}
                    </g>
                    <text
                        x={350}
                        y={700}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill={GRA}
                    >
                        ikke det viktigste
                    </text>
                </Inn>
            )}
            {beat >= 2 &&
                DYDER.map((d, i) => {
                    const a = (d.vinkel * Math.PI) / 180;
                    const x = MX + Math.cos(a) * RING * 1.35;
                    const y = MY + Math.sin(a) * RING * 0.78;
                    const fylt = beat >= d.fra;
                    const r = d.stor ? 84 : 70;
                    return (
                        <Inn key={d.navn} forsinkelse={beat === 2 ? 0.3 + i * 0.3 : 0}>
                            <line
                                x1={MX}
                                y1={MY - 60}
                                x2={x}
                                y2={y}
                                stroke="#d6c7a8"
                                strokeWidth={4}
                            />
                            <circle
                                cx={x}
                                cy={y}
                                r={r}
                                fill={
                                    fylt ? (beat === 5 && d.navn === 'shu' ? ROD : GULL) : '#fffdf7'
                                }
                                stroke={fylt ? '#7c2d12' : '#a8a29e'}
                                strokeWidth={4}
                                strokeDasharray={fylt ? undefined : '10 10'}
                                style={{ transition: 'fill 0.6s' }}
                            />
                            {fylt && (
                                <>
                                    <text
                                        x={x}
                                        y={y + 16}
                                        textAnchor="middle"
                                        fontSize={d.stor ? 52 : 46}
                                        fontWeight={900}
                                        fill="#fff"
                                    >
                                        {d.navn}
                                    </text>
                                    <text
                                        x={d.stor ? x + r + 24 : x}
                                        y={d.stor ? y + 12 : y + r + 44}
                                        textAnchor={d.stor ? 'start' : 'middle'}
                                        fontSize={32}
                                        fontWeight={800}
                                        fill={BLEKK}
                                    >
                                        {d.betyr}
                                    </text>
                                </>
                            )}
                        </Inn>
                    );
                })}
            {beat === 3 && (
                <Inn forsinkelse={0.8}>
                    <text
                        x={MX + 108}
                        y={MY - RING * 0.78 + 56}
                        fontSize={30}
                        fontWeight={800}
                        fill={GULL}
                    >
                        den viktigste
                    </text>
                </Inn>
            )}
            <Person x={MX} y={MY + 130} s={1.25} farge={beat >= 1 ? '#7c2d12' : '#a8a29e'} />
            {beat === 1 && (
                <Inn forsinkelse={0.4}>
                    <Kort
                        x={1210}
                        y={330}
                        linjer={[
                            { t: 'junzi', fs: 52, fw: 900, farge: ROD },
                            { t: 'gjør det rette fordi', fs: 32, fw: 700 },
                            { t: 'han har øvd på det', fs: 32, fw: 700 },
                        ]}
                    />
                    <Kort
                        x={390}
                        y={500}
                        linjer={[
                            { t: 'ikke fordi', fs: 32, fw: 700, farge: GRA },
                            { t: 'noen passer på', fs: 32, fw: 700, farge: GRA },
                        ]}
                    />
                </Inn>
            )}
            {beat === 5 && (
                <Inn forsinkelse={0.6}>
                    <Kort
                        x={340}
                        y={190}
                        linjer={[
                            { t: 'Hvordan oppleves', fs: 34, fw: 800 },
                            { t: 'dette for den andre?', fs: 34, fw: 800 },
                        ]}
                    />
                </Inn>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ regel */

function Regel({ beat }: { beat: number }) {
    return (
        <>
            <Person x={520} y={700} s={1.3} farge="#1e3a8a" />
            <Person x={1080} y={700} s={1.3} farge="#7c2d12" />
            <path d="M 620 460 Q 800 380 980 460" stroke={GULL} strokeWidth={8} fill="none" />
            <path d="M 980 460 l -30 -4 l 14 24 z" fill={GULL} />
            <path d="M 980 520 Q 800 600 620 520" stroke={GULL} strokeWidth={8} fill="none" />
            <path d="M 620 520 l 30 4 l -14 -24 z" fill={GULL} />
            {beat === 0 && (
                <Inn forsinkelse={0.5}>
                    <Kort
                        x={800}
                        y={720}
                        linjer={[{ t: 'Finnes i mange religioner og livssyn', fs: 36, fw: 800 }]}
                    />
                </Inn>
            )}
            {beat === 1 && (
                <>
                    <Inn forsinkelse={0.3}>
                        <Kort
                            x={420}
                            y={240}
                            linjer={[
                                { t: 'Kristendommen:', fs: 30, fw: 700, farge: GRA },
                                { t: 'hva du skal gjøre', fs: 38, fw: 900, farge: GRONN },
                            ]}
                        />
                    </Inn>
                    <Inn forsinkelse={1.6}>
                        <Kort
                            x={1180}
                            y={240}
                            linjer={[
                                { t: 'Konfucius:', fs: 30, fw: 700, farge: GRA },
                                { t: 'hva du skal la være', fs: 38, fw: 900, farge: ROD },
                            ]}
                        />
                    </Inn>
                </>
            )}
            {beat === 2 && (
                <Inn forsinkelse={0.3}>
                    <Kort
                        x={800}
                        y={680}
                        bakgrunn="#7c2d12"
                        kant="#7c2d12"
                        linjer={[
                            {
                                t: 'Gjør ikke mot andre det du ikke vil',
                                fs: 40,
                                fw: 900,
                                farge: '#fff',
                            },
                            { t: 'at de skal gjøre mot deg.', fs: 40, fw: 900, farge: '#fff' },
                            { t: 'Konfucius, i Samtalene', fs: 28, fw: 700, farge: '#fde68a' },
                        ]}
                    />
                </Inn>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ eksamen */

const BOKER = [
    { t: 'sanger', farge: '#9f1d1d' },
    { t: 'historie', farge: '#1d4ed8' },
    { t: 'forandring', farge: '#0f766e' },
    { t: 'årbøker', farge: '#7c3aed' },
    { t: 'ritualer', farge: '#b45309' },
    { t: 'Samtalene', farge: '#1c1917' },
    { t: 'Mengzi', farge: '#365314' },
];

function Eksamen({ beat }: { beat: number }) {
    return (
        <>
            {beat === 0 && (
                <Inn>
                    <rect x={650} y={260} width={300} height={300} rx={24} fill={ROD} />
                    <rect
                        x={674}
                        y={284}
                        width={252}
                        height={252}
                        rx={14}
                        fill="none"
                        stroke="#fde68a"
                        strokeWidth={6}
                    />
                    <text
                        x={800}
                        y={445}
                        textAnchor="middle"
                        fontSize={110}
                        fontWeight={900}
                        fill="#fde68a"
                    >
                        Han
                    </text>
                    <Kort
                        x={800}
                        y={610}
                        linjer={[
                            { t: 'Han-dynastiet', fs: 44, fw: 900 },
                            { t: 'keisere fra samme slekt', fs: 32, fw: 700, farge: GRA },
                        ]}
                    />
                </Inn>
            )}
            {beat === 1 && (
                <>
                    <Inn>
                        <text
                            x={360}
                            y={300}
                            textAnchor="middle"
                            fontSize={64}
                            fontWeight={900}
                            fill={ROD}
                        >
                            125 fvt
                        </text>
                        <rect x={220} y={520} width={300} height={24} fill="#6b3f22" />
                        <rect x={240} y={544} width={20} height={150} fill="#6b3f22" />
                        <rect x={480} y={544} width={20} height={150} fill="#6b3f22" />
                        <rect
                            x={300}
                            y={490}
                            width={140}
                            height={34}
                            fill="#fef3c7"
                            stroke="#d6c7a8"
                            strokeWidth={2}
                        />
                        <Person x={370} y={700} s={0.9} farge="#1e3a8a" />
                        <text x={370} y={780} textAnchor="middle" fontSize={36} fontWeight={800}>
                            eksamen
                        </text>
                    </Inn>
                    <Inn forsinkelse={1}>
                        <path d="M 600 560 L 960 560" stroke={GULL} strokeWidth={10} />
                        <path d="M 960 540 L 1000 560 L 960 580 Z" fill={GULL} />
                    </Inn>
                    <Inn forsinkelse={1.6}>
                        <rect x={1080} y={340} width={300} height={360} fill="#7f1d1d" />
                        <rect x={1050} y={310} width={360} height={40} fill="#44403c" />
                        <rect x={1170} y={480} width={120} height={220} fill="#451a03" />
                        <text x={1230} y={780} textAnchor="middle" fontSize={36} fontWeight={800}>
                            jobb i staten
                        </text>
                    </Inn>
                </>
            )}
            {beat === 2 && (
                <>
                    <Inn>
                        <Person x={450} y={700} s={1.1} farge="#ca8a04" />
                        <Kort
                            x={450}
                            y={260}
                            linjer={[{ t: 'Arve plassen', fs: 42, fw: 900, farge: GRA }]}
                        />
                        <text
                            x={450}
                            y={790}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill={GRA}
                        >
                            mange andre samfunn
                        </text>
                    </Inn>
                    <Inn forsinkelse={1.6}>
                        <Person x={1150} y={700} s={1.1} farge="#1e3a8a" />
                        <rect
                            x={1215}
                            y={540}
                            width={70}
                            height={50}
                            rx={6}
                            fill="#fef3c7"
                            stroke="#7c2d12"
                            strokeWidth={4}
                        />
                        <Kort
                            x={1150}
                            y={260}
                            linjer={[{ t: 'Lese seg til den', fs: 42, fw: 900, farge: GRONN }]}
                        />
                        <text
                            x={1150}
                            y={790}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={700}
                            fill={GRONN}
                        >
                            Kina
                        </text>
                    </Inn>
                </>
            )}
            {beat >= 3 && (
                <g>
                    {BOKER.map((b, i) => {
                        const x = beat === 3 ? 250 + i * 160 : 200 + i * 62;
                        return (
                            <motion.g
                                key={b.t}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: beat === 3 ? 0.3 + i * 0.45 : 0 }}
                            >
                                <rect
                                    x={x}
                                    y={beat === 3 ? 330 : 420}
                                    width={beat === 3 ? 120 : 52}
                                    height={beat === 3 ? 360 : 300}
                                    rx={8}
                                    fill={b.farge}
                                />
                                {beat === 3 && (
                                    <text
                                        x={x + 60}
                                        y={510}
                                        textAnchor="middle"
                                        fontSize={30}
                                        fontWeight={800}
                                        fill="#fff"
                                        transform={`rotate(-90 ${x + 60} 510)`}
                                    >
                                        {b.t}
                                    </text>
                                )}
                            </motion.g>
                        );
                    })}
                    {beat === 3 && (
                        <>
                            <path d="M 250 730 L 930 730" stroke={GRA} strokeWidth={4} />
                            <text
                                x={590}
                                y={790}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                            >
                                fem gamle klassikere
                            </text>
                            <path d="M 1050 730 L 1370 730" stroke={GRA} strokeWidth={4} />
                            <text
                                x={1210}
                                y={790}
                                textAnchor="middle"
                                fontSize={34}
                                fontWeight={800}
                            >
                                + to til
                            </text>
                        </>
                    )}
                </g>
            )}
            {beat === 4 && (
                <>
                    <Inn forsinkelse={0.3}>
                        <Kort
                            x={980}
                            y={250}
                            minBredde={760}
                            linjer={[
                                { t: 'Årene med studier kostet:', fs: 36, fw: 700, farge: GRA },
                                { t: 'bare rike familier hadde råd', fs: 40, fw: 900, farge: ROD },
                            ]}
                        />
                    </Inn>
                    <Inn forsinkelse={2}>
                        <Kort
                            x={980}
                            y={520}
                            minBredde={760}
                            linjer={[
                                { t: 'Men makt hang sammen med', fs: 36, fw: 700, farge: GRA },
                                { t: 'kunnskap, ikke fødsel', fs: 40, fw: 900, farge: GRONN },
                            ]}
                        />
                    </Inn>
                </>
            )}
            {beat === 5 && (
                <>
                    <Inn forsinkelse={0.3}>
                        <line x1={720} y1={570} x2={1440} y2={570} stroke={BLEKK} strokeWidth={6} />
                        <circle cx={720} cy={570} r={14} fill={ROD} />
                        <text x={720} y={640} textAnchor="middle" fontSize={34} fontWeight={900}>
                            125 fvt
                        </text>
                    </Inn>
                    <motion.rect
                        x={720}
                        y={540}
                        height={60}
                        rx={12}
                        fill={GULL}
                        initial={{ width: 0 }}
                        animate={{ width: 680 }}
                        transition={{ delay: 0.8, duration: 2.4 }}
                    />
                    <Inn forsinkelse={2.6}>
                        <text
                            x={1080}
                            y={500}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill={GULL}
                        >
                            nesten to tusen år
                        </text>
                    </Inn>
                </>
            )}
        </>
    );
}

export function KonfusianismeRull({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'liv';
    const liste = OVERSKRIFT[modus];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#e7dcc4' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                fontFamily="Inter, sans-serif"
            >
                <Rull />
                {modus === 'liv' && <Liv beat={beat} />}
                {modus === 'dyder' && <Dyder beat={beat} />}
                {modus === 'regel' && <Regel beat={beat} />}
                {modus === 'eksamen' && <Eksamen beat={beat} />}
            </svg>
            <Overskrift tekst={liste[Math.min(beat, liste.length - 1)]} />
        </div>
    );
}
