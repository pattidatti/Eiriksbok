import { AnimatePresence, motion } from 'framer-motion';
import { Languages, Lock, LockOpen, MessageCircle, MessagesSquare, PenLine } from 'lucide-react';
import type { VisualProps } from '../../types';
import { HtBrikke } from './HtBrikke';

/**
 * Tekstens reise: fire stopp (muntlig, nedskrevet, lukket, oversatt), som i artikkelens
 * komponent TekstensReise. Statusene er hentet derfra.
 *
 * «intro»: én vei med fire stopp, ett spørsmål per beat, og til slutt to avstikkere.
 * «nyere»: bahá'í, mormonismen og Jehovas vitner. Mormonismens lukket-stopp står åpent,
 *          og de tre trinnene for en ny tekst vises under.
 * «alle»: alle ni side om side, med én kolonne eller ett spørsmål løftet fram per beat.
 */

type Modus = 'intro' | 'nyere' | 'alle';
type Status = 'gjort' | 'delvis' | 'ikke' | 'apen';

const B = 1600;
const H = 900;

const STOPP = [
    { id: 'muntlig', navn: 'Muntlig', Ikon: MessageCircle },
    { id: 'nedskrevet', navn: 'Nedskrevet', Ikon: PenLine },
    { id: 'lukket', navn: 'Lukket', Ikon: Lock },
    { id: 'oversatt', navn: 'Oversatt', Ikon: Languages },
] as const;

interface Tradisjon {
    id: string;
    navn: string;
    farge: string;
    status: [Status, Status, Status, Status];
    lukket: string;
    oversatt: string;
    hvem?: string;
}

const NI: Tradisjon[] = [
    {
        id: 'jodedom',
        navn: 'Jødedom',
        farge: '#2563eb',
        status: ['gjort', 'gjort', 'delvis', 'delvis'],
        lukket: 'halvveis',
        oversatt: 'lov, men les hebraisk',
    },
    {
        id: 'kristendom',
        navn: 'Kristendom',
        farge: '#7c3aed',
        status: ['gjort', 'gjort', 'gjort', 'gjort'],
        lukket: 'år 367',
        oversatt: 'over 750 språk',
    },
    {
        id: 'islam',
        navn: 'Islam',
        farge: '#059669',
        status: ['gjort', 'gjort', 'gjort', 'delvis'],
        lukket: 'med en gang',
        oversatt: 'ikke som Koranen',
        hvem: 'sunni: ingen hovedkontor',
    },
    {
        id: 'bahai',
        navn: "Bahá'í",
        farge: '#0d9488',
        status: ['ikke', 'gjort', 'gjort', 'gjort'],
        lukket: '1892',
        oversatt: 'ja, det vanlige',
    },
    {
        id: 'mormon',
        navn: 'Mormonisme',
        farge: '#9333ea',
        status: ['ikke', 'gjort', 'apen', 'gjort'],
        lukket: 'aldri',
        oversatt: 'ja',
    },
    {
        id: 'jv',
        navn: 'Jehovas vitner',
        farge: '#0284c7',
        status: ['ikke', 'delvis', 'gjort', 'gjort'],
        lukket: 'ferdig',
        oversatt: 'egen oversettelse',
        hvem: 'ett sted: Det styrende råd',
    },
    {
        id: 'hindu',
        navn: 'Hinduisme',
        farge: '#ea580c',
        status: ['gjort', 'gjort', 'delvis', 'delvis'],
        lukket: 'bare shruti',
        oversatt: 'ikke i ritualet',
        hvem: 'ingen sjef på toppen',
    },
    {
        id: 'buddhisme',
        navn: 'Buddhisme',
        farge: '#ca8a04',
        status: ['gjort', 'gjort', 'delvis', 'gjort'],
        lukket: 'ulikt svar',
        oversatt: 'helt vanlig',
    },
    {
        id: 'sikhisme',
        navn: 'Sikhisme',
        farge: '#be185d',
        status: ['gjort', 'gjort', 'gjort', 'delvis'],
        lukket: '1708',
        oversatt: 'bør lære gurmukhi',
    },
];

const TEKST: Record<Modus, string[]> = {
    intro: [
        'Tekstens reise: fire stopp',
        '1. Muntlig: fra munn til munn',
        '2. Nedskrevet',
        '3. Lukket: lista er ferdig',
        '4. Oversatt',
        'Ikke alle reiser hele ruta',
    ],
    nyere: [
        'Tre mindre bevegelser',
        "Bahá'u'lláh skrev selv",
        "Bahá'í: lovboka",
        'Mormonismen: lista er ikke ferdig',
        'Tre trinn for en ny tekst',
    ],
    alle: [
        'Ni reiser side om side',
        'Budskapet eller selve ordene?',
        'Er lista ferdig?',
        'Hvem bestemmer hva teksten betyr?',
        'Ingen er enige med seg selv',
    ],
};

/** Ett stopp på en rad: fylt (gjort), halvfylt (delvis), tomt (ikke) eller stiplet (åpen). */
function Merke({
    x,
    y,
    r,
    status,
    farge,
}: {
    x: number;
    y: number;
    r: number;
    status: Status;
    farge: string;
}) {
    if (status === 'gjort')
        return <circle cx={x} cy={y} r={r} fill={farge} stroke="#fff" strokeWidth={4} />;
    if (status === 'delvis')
        return (
            <g>
                <circle cx={x} cy={y} r={r} fill="#fff" stroke={farge} strokeWidth={5} />
                <path d={`M ${x} ${y - r} A ${r} ${r} 0 0 0 ${x} ${y + r} Z`} fill={farge} />
            </g>
        );
    if (status === 'apen')
        return (
            <g>
                <circle
                    cx={x}
                    cy={y}
                    r={r}
                    fill="#fff"
                    stroke={farge}
                    strokeWidth={5}
                    strokeDasharray="7 6"
                />
                <LockOpen
                    x={x - r * 0.6}
                    y={y - r * 0.6}
                    width={r * 1.2}
                    height={r * 1.2}
                    color={farge}
                    strokeWidth={2.6}
                />
            </g>
        );
    return <circle cx={x} cy={y} r={r * 0.55} fill="#fff" stroke="#94a3b8" strokeWidth={4} />;
}

/** En rad med fire stopp og linja mellom dem. Linja er stiplet før første stopp som er gjort. */
function Rad({
    t,
    y,
    xs,
    r,
    synlig = [true, true, true, true],
    dempet = 0.35,
    navnX,
    navnStr,
}: {
    t: Tradisjon;
    y: number;
    xs: readonly number[];
    r: number;
    synlig?: boolean[];
    dempet?: number;
    navnX: number;
    navnStr: number;
}) {
    const forste = t.status.findIndex((s) => s !== 'ikke');
    return (
        <g>
            <text
                x={navnX}
                y={y + navnStr * 0.35}
                textAnchor="end"
                fontSize={navnStr}
                fontWeight={900}
                fill={t.farge}
            >
                {t.navn}
            </text>
            {xs.slice(0, -1).map((x, i) => (
                <line
                    key={i}
                    x1={x}
                    y1={y}
                    x2={xs[i + 1]}
                    y2={y}
                    stroke={i < forste ? '#cbd5e1' : t.farge}
                    strokeWidth={i < forste ? 4 : 8}
                    strokeDasharray={i < forste ? '10 10' : undefined}
                    opacity={synlig[i] && synlig[i + 1] ? 1 : dempet}
                />
            ))}
            {xs.map((x, i) => (
                <g key={i} opacity={synlig[i] ? 1 : dempet}>
                    <Merke x={x} y={y} r={r} status={t.status[i]} farge={t.farge} />
                </g>
            ))}
        </g>
    );
}

function Kolonnehoder({
    xs,
    y,
    aktiv,
}: {
    xs: readonly number[];
    y: number;
    aktiv: number | null;
}) {
    return (
        <g>
            {STOPP.map((s, i) => {
                const lys = aktiv === null || aktiv === i;
                return (
                    <g key={s.id} opacity={lys ? 1 : 0.3}>
                        <s.Ikon
                            x={xs[i] - 22}
                            y={y - 78}
                            width={44}
                            height={44}
                            color="#0f172a"
                            strokeWidth={2.4}
                        />
                        <text
                            x={xs[i]}
                            y={y}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {s.navn}
                        </text>
                    </g>
                );
            })}
        </g>
    );
}

function Intro({ beat }: { beat: number }) {
    const xs = [330, 640, 950, 1260];
    const y = 470;
    const aktiv = beat >= 1 && beat <= 4 ? beat - 1 : null;
    const reisende = beat === 0 ? 170 : beat <= 4 ? xs[beat - 1] : 1440;
    const sporsmal =
        [
            null,
            'Hvor lenge gikk teksten fra munn til munn?',
            'Når ble den skrevet ned?',
            'Når bestemte noen hvilke tekster som hører med?',
            'Kan den oversettes og fortsatt være seg selv?',
        ][beat] ?? null;
    return (
        <g>
            <line
                x1={150}
                y1={y}
                x2={1450}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={20}
                strokeLinecap="round"
            />
            <motion.line
                x1={150}
                y1={y}
                y2={y}
                initial={{ x2: 150 }}
                animate={{ x2: reisende }}
                transition={{ duration: 1.1, ease: 'easeInOut' }}
                stroke="#0f766e"
                strokeWidth={20}
                strokeLinecap="round"
            />
            {STOPP.map((s, i) => {
                const naadd = beat >= i + 1;
                const er = aktiv === i;
                const apen = beat === 5 && i === 2;
                return (
                    <g key={s.id}>
                        <circle
                            cx={xs[i]}
                            cy={y}
                            r={er ? 82 : 68}
                            fill={naadd ? '#0f766e' : '#ffffff'}
                            stroke={naadd ? '#ffffff' : '#94a3b8'}
                            strokeWidth={6}
                            strokeDasharray={apen ? '12 10' : undefined}
                        />
                        <s.Ikon
                            x={xs[i] - 34}
                            y={y - 34}
                            width={68}
                            height={68}
                            color={naadd ? '#ffffff' : '#64748b'}
                            strokeWidth={2.2}
                        />
                        <text
                            x={xs[i]}
                            y={y + 130}
                            textAnchor="middle"
                            fontSize={38}
                            fontWeight={900}
                            fill="#0f172a"
                        >
                            {s.navn}
                        </text>
                    </g>
                );
            })}
            {beat === 5 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <path
                        d={`M 150 ${y - 20} C 250 ${y - 230}, 560 ${y - 230}, ${xs[1] - 30} ${y - 80}`}
                        fill="none"
                        stroke="#b45309"
                        strokeWidth={7}
                        strokeDasharray="16 12"
                    />
                    <text
                        x={300}
                        y={y - 210}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#b45309"
                    >
                        Noen starter her
                    </text>
                    <rect
                        x={xs[2] - 230}
                        y={y + 170}
                        width={460}
                        height={70}
                        rx={18}
                        fill="#fef3c7"
                        stroke="#b45309"
                        strokeWidth={3}
                    />
                    <text
                        x={xs[2]}
                        y={y + 216}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#78350f"
                    >
                        Noen blir aldri ferdige
                    </text>
                </motion.g>
            )}
            <AnimatePresence mode="wait">
                {sporsmal && (
                    <motion.g
                        key={beat}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <rect x={260} y={690} width={1080} height={96} rx={24} fill="#0f172a" />
                        <text
                            x={800}
                            y={752}
                            textAnchor="middle"
                            fontSize={42}
                            fontWeight={800}
                            fill="#ffffff"
                        >
                            {sporsmal}
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
            {beat === 0 && (
                <text
                    x={800}
                    y={300}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#334155"
                >
                    Fra første ord til bok på mange språk
                </text>
            )}
        </g>
    );
}

const NYERE_X = [600, 860, 1120, 1380] as const;

function Nyere({ beat }: { beat: number }) {
    const rader = NI.filter((t) => ['bahai', 'mormon', 'jv'].includes(t.id));
    const ys = [360, 540, 720];
    const merk: Record<string, (string | null)[]> = {
        bahai: [
            beat >= 1 ? 'ingen' : null,
            beat >= 1 ? (beat >= 2 ? 'ca. 1873' : 'skrev selv') : null,
            beat >= 2 ? '1892' : null,
            beat >= 2 ? 'engelsk: 1992' : null,
        ],
        mormon: [null, null, beat >= 3 ? 'ikke ferdig' : null, null],
        jv: [null, null, null, null],
    };
    return (
        <g>
            <Kolonnehoder xs={NYERE_X} y={250} aktiv={null} />
            {rader.map((t, i) => {
                const aktiv =
                    beat === 0 ||
                    (t.id === 'bahai' && (beat === 1 || beat === 2)) ||
                    (t.id === 'mormon' && beat >= 3);
                if (beat === 4 && t.id === 'jv') return null;
                return (
                    <g key={t.id} opacity={aktiv ? 1 : 0.25}>
                        <Rad t={t} y={ys[i]} xs={NYERE_X} r={30} navnX={450} navnStr={40} />
                        {merk[t.id].map((m, j) =>
                            m ? (
                                <motion.text
                                    key={`${j}-${m}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    x={NYERE_X[j]}
                                    y={ys[i] + 80}
                                    textAnchor="middle"
                                    fontSize={32}
                                    fontWeight={900}
                                    fill="#334155"
                                >
                                    {m}
                                </motion.text>
                            ) : null
                        )}
                    </g>
                );
            })}
            {beat === 4 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {[
                        { n: 1, a: 'Presidenten får', b: 'beskjed fra Gud' },
                        { n: 2, a: 'Apostlene', b: 'sier seg enige' },
                        { n: 3, a: 'Medlemmene', b: 'stemmer' },
                    ].map((s, i) => {
                        const x = 330 + i * 400;
                        const y = 690 - i * 26;
                        return (
                            <motion.g
                                key={s.n}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.5 }}
                            >
                                <rect
                                    x={x}
                                    y={y}
                                    width={360}
                                    height={150 + i * 26}
                                    rx={20}
                                    fill="#9333ea"
                                />
                                <text
                                    x={x + 34}
                                    y={y + 58}
                                    fontSize={44}
                                    fontWeight={900}
                                    fill="#f3e8ff"
                                >
                                    {s.n}
                                </text>
                                <text
                                    x={x + 82}
                                    y={y + 58}
                                    fontSize={30}
                                    fontWeight={800}
                                    fill="#ffffff"
                                >
                                    {s.a}
                                </text>
                                <text
                                    x={x + 82}
                                    y={y + 100}
                                    fontSize={30}
                                    fontWeight={800}
                                    fill="#ffffff"
                                >
                                    {s.b}
                                </text>
                            </motion.g>
                        );
                    })}
                </motion.g>
            )}
        </g>
    );
}

const ALLE_X = [500, 690, 880, 1070] as const;

function Alle({ beat }: { beat: number }) {
    const kolonne = beat === 1 ? 3 : beat === 2 ? 2 : null;
    const y0 = 255;
    const dy = 72;
    return (
        <g>
            {kolonne !== null && (
                <rect
                    x={ALLE_X[kolonne] - 70}
                    y={170}
                    width={140}
                    height={dy * 9 + 50}
                    rx={20}
                    fill="#fef3c7"
                />
            )}
            <Kolonnehoder xs={ALLE_X} y={215} aktiv={kolonne} />
            {NI.map((t, i) => {
                const y = y0 + 40 + i * dy;
                const synlig = [0, 1, 2, 3].map((k) => kolonne === null || k === kolonne);
                const lapp =
                    beat === 1
                        ? t.oversatt
                        : beat === 2
                          ? t.lukket
                          : beat === 3
                            ? (t.hvem ?? null)
                            : null;
                const tonet = beat === 3 && !t.hvem;
                return (
                    <g key={t.id} opacity={tonet ? 0.4 : 1}>
                        <Rad
                            t={t}
                            y={y}
                            xs={ALLE_X}
                            r={22}
                            synlig={synlig}
                            dempet={beat === 2 ? 0.1 : 0.35}
                            navnX={380}
                            navnStr={34}
                        />
                        {lapp && (
                            <motion.text
                                key={`${beat}-${t.id}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.08 }}
                                x={beat === 2 ? ALLE_X[2] + 32 : ALLE_X[3] + 40}
                                y={y + 11}
                                fontSize={31}
                                fontWeight={900}
                                fill="#0f172a"
                            >
                                {lapp}
                            </motion.text>
                        )}
                        {beat === 4 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <MessagesSquare
                                    x={ALLE_X[3] + 44}
                                    y={y - 18}
                                    width={36}
                                    height={36}
                                    color={t.farge}
                                    strokeWidth={2.4}
                                />
                                <text
                                    x={ALLE_X[3] + 92}
                                    y={y + 11}
                                    fontSize={31}
                                    fontWeight={900}
                                    fill="#334155"
                                >
                                    ulike syn
                                </text>
                            </motion.g>
                        )}
                    </g>
                );
            })}
            {beat === 0 && (
                <g>
                    {(
                        [
                            ['gjort', 'ja'],
                            ['delvis', 'delvis'],
                            ['ikke', 'ingen'],
                            ['apen', 'åpen'],
                        ] as [Status, string][]
                    ).map(([s, n], i) => (
                        <g key={s}>
                            <Merke x={1240} y={330 + i * 80} r={20} status={s} farge="#475569" />
                            <text
                                x={1276}
                                y={341 + i * 80}
                                fontSize={32}
                                fontWeight={800}
                                fill="#334155"
                            >
                                {n}
                            </text>
                        </g>
                    ))}
                </g>
            )}
        </g>
    );
}

export function HelligeTeksterReise({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'intro';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8f5ee' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'intro' && <Intro beat={beat} />}
                {modus === 'nyere' && <Nyere beat={beat} />}
                {modus === 'alle' && <Alle beat={beat} />}
            </svg>
            <HtBrikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
