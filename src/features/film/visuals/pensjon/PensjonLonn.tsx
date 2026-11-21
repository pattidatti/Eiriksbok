import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Pensjonen som regnestykke og tidslinje, tegnet flatt. Fire moduser:
 * - andel: inntekten som en stolpe, 18,1 prosent skjæres av og går i bøtta, og grensen på 7,1 G.
 * - livslinje: årene fra 13 til 75 der du tjener opp pensjon, og mynten som følger lønnsveksten.
 * - deling: levealdersjustering. Samme bøtte helles i flere glass når folk lever lenger.
 * - uttak: når du begynner å tappe (62, 67 eller 75), og hvor mye det blir hver måned.
 * Hver beat er en ferdig tegning, så eleven kan hoppe rett inn.
 */

type Modus = 'andel' | 'livslinje' | 'deling' | 'uttak';

const BLA = '#2563eb';
const LYSBLA = '#93c5fd';
const GRONN = '#059669';
const ROD = '#e11d48';
const ORANSJE = '#f59e0b';
const MORK = '#0f172a';
const GRA = '#94a3b8';

const OVERSKRIFT: Record<Modus, string[]> = {
    andel: [
        'Folketrygden: født i 1963 eller senere',
        '18,1 prosent til pensjonen',
        '100 000 kr i lønn: 18 100 kr i bøtta',
        'Inntekt over 7,1 G teller ikke',
    ],
    livslinje: [
        'Fra første krone',
        'Opptjening fra 13 til 75 år',
        'Førstegangstjenesten teller',
        'Beholdningen følger lønnsveksten',
        'Avispengene blir ikke verdiløse',
    ],
    deling: [
        'Levealdersjustering',
        'Bøtta deles på årene du ventes å leve',
        'Årskullet ditt lever lenger: mindre per år',
        'Født i 1944 eller senere',
        'To veier for de yngre',
    ],
    uttak: [
        'Du velger: fra 62 til 75 år',
        'Vanlig start: 67 år',
        'Start som 62-åring: lavere hver måned',
        'Vent til 75: mer hver måned',
        'I snitt omtrent like mye til sammen',
        'Jobb og pensjon samtidig',
    ],
};

/** Viser barna med en kort inntoning. Returnerer null når de er skjult. */
function Vis({ når, children, d = 0 }: { når: boolean; children: ReactNode; d?: number }) {
    return (
        <AnimatePresence>
            {når && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, delay: d }}
                >
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

function Tekst({
    x,
    y,
    children,
    str = 38,
    farge = MORK,
    anker = 'middle',
    vekt = 800,
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
}) {
    return (
        <text
            x={x}
            y={y}
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            textAnchor={anker}
            fontFamily="Outfit, Inter, sans-serif"
        >
            {children}
        </text>
    );
}

/** En liten bøtte med vann opp til en andel av høyden. */
function Botte({ x, y, b = 160, h = 170, fyll }: { x: number; y: number; b?: number; h?: number; fyll: number }) {
    const inn = b * 0.12;
    const vann = h * fyll;
    // Vannet er et trapes som følger veggene.
    const bunnV = x - b / 2 + inn;
    const bunnH = x + b / 2 - inn;
    const skra = (inn * vann) / h;
    return (
        <g>
            <motion.path
                initial={false}
                animate={{
                    d: `M ${bunnV} ${y} L ${bunnH} ${y} L ${bunnH + skra} ${y - vann} L ${bunnV - skra} ${y - vann} Z`,
                }}
                transition={{ duration: 0.9 }}
                fill={LYSBLA}
            />
            <path
                d={`M ${x - b / 2} ${y - h} L ${bunnV} ${y} L ${bunnH} ${y} L ${x + b / 2} ${y - h}`}
                fill="none"
                stroke="#475569"
                strokeWidth={8}
                strokeLinejoin="round"
            />
        </g>
    );
}

function Andel({ beat }: { beat: number }) {
    const X0 = 180;
    const B = 1240;
    const Y = 300;
    const H = 130;
    const grense = beat >= 3;
    // Uten grense teller hele stolpen. Med grense teller bare delen til venstre for streken.
    const teller = grense ? B * 0.72 : B;
    const skive = teller * 0.181;
    const skiveX = X0 + teller - skive;
    return (
        <g>
            <motion.rect
                x={X0}
                y={Y}
                height={H}
                rx={14}
                initial={false}
                animate={{ width: teller }}
                transition={{ duration: 0.8 }}
                fill="#e2e8f0"
                stroke="#64748b"
                strokeWidth={4}
            />
            <Vis når={grense}>
                <rect
                    x={X0 + teller}
                    y={Y}
                    width={B - teller}
                    height={H}
                    rx={14}
                    fill="#cbd5e1"
                    opacity={0.5}
                    stroke={GRA}
                    strokeWidth={4}
                    strokeDasharray="14 10"
                />
                <line x1={X0 + teller} x2={X0 + teller} y1={Y - 50} y2={Y + H + 30} stroke={ROD} strokeWidth={8} />
                <Tekst x={X0 + teller} y={Y - 64} farge={ROD}>
                    Grense: 7,1 G
                </Tekst>
                <Tekst x={X0 + teller + (B - teller) / 2} y={Y + H / 2 + 10} str={32} farge="#475569">
                    Teller ikke
                </Tekst>
            </Vis>
            <Tekst x={X0 + 30} y={Y + H / 2 + 14} anker="start" str={40}>
                {beat >= 2 && !grense ? 'Lønn: 100 000 kr' : grense ? 'Høy inntekt' : 'Inntekten din i ett år'}
            </Tekst>
            <Vis når={beat >= 1}>
                <motion.rect
                    initial={false}
                    animate={{ x: skiveX, width: skive }}
                    transition={{ duration: 0.8 }}
                    y={Y}
                    height={H}
                    rx={14}
                    fill={BLA}
                />
            </Vis>
            <motion.g initial={false} animate={{ x: skiveX + skive / 2 }} transition={{ duration: 0.8 }}>
                <Vis når={beat >= 1}>
                    <Tekst x={0} y={Y + H / 2 + 14} farge="#ffffff" str={40}>
                        {beat === 2 ? '18 100' : '18,1 %'}
                    </Tekst>
                    {/* Pila ned til bøtta */}
                    <path d={`M 0 ${Y + H + 20} L 0 ${Y + H + 150}`} stroke={BLA} strokeWidth={10} />
                    <path d={`M -26 ${Y + H + 135} L 0 ${Y + H + 175} L 26 ${Y + H + 135} Z`} fill={BLA} />
                </Vis>
                    <Botte x={0} y={Y + H + 380} fyll={[0, 0.25, 0.45, 0.6][Math.min(beat, 3)]} />
                    <Tekst x={-120} y={Y + H + 300} anker="end" str={36} farge={BLA}>
                        Pensjonsbeholdningen
                    </Tekst>
                    <Tekst x={-120} y={Y + H + 345} anker="end" str={30} farge="#475569" vekt={600}>
                        kontoen din hos Nav
                    </Tekst>
            </motion.g>
            <Vis når={beat === 0}>
                <Tekst x={180} y={560} anker="start" str={44} farge="#475569" vekt={700}>
                    Hvert år du har inntekt,
                </Tekst>
                <Tekst x={180} y={615} anker="start" str={44} farge="#475569" vekt={700}>
                    tjener du opp pensjon
                </Tekst>
            </Vis>
        </g>
    );
}

const ALDER_X = (alder: number) => 170 + ((alder - 13) / 62) * 1260;

function Livslinje({ beat }: { beat: number }) {
    const Y = 560;
    return (
        <g>
            <line x1={ALDER_X(13)} x2={ALDER_X(75)} y1={Y} y2={Y} stroke="#475569" strokeWidth={8} strokeLinecap="round" />
            {[13, 75].map((a) => (
                <g key={a}>
                    <line x1={ALDER_X(a)} x2={ALDER_X(a)} y1={Y - 20} y2={Y + 20} stroke="#475569" strokeWidth={6} />
                    <Tekst x={ALDER_X(a)} y={Y + 70} str={40}>
                        {`${a} år`}
                    </Tekst>
                </g>
            ))}
            <Vis når={beat >= 1}>
                <motion.rect
                    x={ALDER_X(13)}
                    y={Y - 22}
                    height={44}
                    rx={22}
                    fill={BLA}
                    opacity={0.85}
                    initial={{ width: 0 }}
                    animate={{ width: ALDER_X(75) - ALDER_X(13) }}
                    transition={{ duration: 1.4 }}
                />
                <Tekst x={(ALDER_X(13) + ALDER_X(75)) / 2} y={Y + 70} str={36} farge={BLA}>
                    Her kan du tjene opp pensjon
                </Tekst>
            </Vis>
            {/* Førstegangstjenesten: et kort tidlig på linja, uten alder */}
            <Vis når={beat === 2}>
                <rect x={ALDER_X(19.5) - 30} y={Y - 30} width={60} height={60} rx={10} fill={GRONN} />
                <line x1={ALDER_X(19.5)} x2={ALDER_X(19.5)} y1={Y - 30} y2={Y - 140} stroke={GRONN} strokeWidth={6} />
                <rect x={ALDER_X(13) - 20} y={Y - 330} width={760} height={190} rx={22} fill="#ecfdf5" stroke={GRONN} strokeWidth={5} />
                <Tekst x={ALDER_X(13) + 10} y={Y - 260} anker="start" str={42} farge={GRONN}>
                    Ett år i Forsvaret
                </Tekst>
                <Tekst x={ALDER_X(13) + 10} y={Y - 195} anker="start" str={38} vekt={700}>
                    teller som 2,5 G i inntekt
                </Tekst>
            </Vis>
            {/* Mynten fra avissommeren. Den vokser langs linja når den følger lønnsveksten. */}
            <Vis når={beat === 0 || beat === 1}>
                <circle cx={ALDER_X(13)} cy={Y - 110} r={42} fill="#fbbf24" stroke="#b45309" strokeWidth={6} />
                <Tekst x={ALDER_X(13)} y={Y - 97} str={36} farge="#78350f">
                    kr
                </Tekst>
                <Tekst x={ALDER_X(13) + 70} y={Y - 97} anker="start" str={40}>
                    Første krone du tjener
                </Tekst>
            </Vis>
            <Vis når={beat >= 3}>
                {[0, 1, 2, 3, 4].map((i) => {
                    const x = ALDER_X(13) + i * 260;
                    const r = 34 + i * 14;
                    return (
                        <motion.g
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.35, duration: 0.4 }}
                        >
                            <circle cx={x} cy={Y - 70 - r} r={r} fill="#fbbf24" stroke="#b45309" strokeWidth={6} />
                            <Tekst x={x} y={Y - 70 - r + 12} str={30 + i * 4} farge="#78350f">
                                kr
                            </Tekst>
                        </motion.g>
                    );
                })}
            </Vis>
            <Vis når={beat === 3}>
                <Tekst x={800} y={180} str={36} farge="#475569" vekt={700}>
                    Hvert år: justert etter lønnsveksten
                </Tekst>
            </Vis>
            <Vis når={beat >= 4}>
                <rect x={ALDER_X(13) - 50} y={Y - 300} width={420} height={70} rx={16} fill="#fffbeb" stroke="#b45309" strokeWidth={4} />
                <Tekst x={ALDER_X(13) + 160} y={Y - 252} str={36} farge="#78350f">
                    1 810 kr som 13-åring
                </Tekst>
                <rect x={ALDER_X(13) + 700} y={Y - 390} width={520} height={70} rx={16} fill="#fffbeb" stroke="#b45309" strokeWidth={4} />
                <Tekst x={ALDER_X(13) + 960} y={Y - 342} str={36} farge="#78350f">
                    Følger lønningene i landet
                </Tekst>
            </Vis>
            <Tekst x={1560} y={870} anker="end" str={32} farge="#64748b" vekt={600}>
                Skisse
            </Tekst>
        </g>
    );
}

/** En rad glass, ett per år. Alle glassene til sammen rommer samme bøtte. */
function Glass({ x0, y, antall, hoyde, farge = BLA, ekstraFra = 99, bredde = 62, topp = 0 }: {
    /** Oransje del øverst i hvert glass (det ekstra fra å jobbe lenger). */
    topp?: number;
    x0: number;
    y: number;
    antall: number;
    hoyde: number;
    farge?: string;
    ekstraFra?: number;
    bredde?: number;
}) {
    return (
        <g>
            {Array.from({ length: antall }, (_, i) => {
                const x = x0 + i * (bredde + 14);
                return (
                    <g key={i}>
                        <rect x={x} y={y - 200} width={bredde} height={200} rx={8} fill="#f8fafc" stroke="#94a3b8" strokeWidth={4} />
                        <motion.rect
                            x={x + 4}
                            width={bredde - 8}
                            rx={5}
                            initial={{ height: 0, y: y - 4 }}
                            animate={{ height: hoyde, y: y - 4 - hoyde }}
                            transition={{ duration: 0.8, delay: 0.05 * i }}
                            fill={i >= ekstraFra ? ORANSJE : farge}
                        />
                        {topp > 0 && (
                            <motion.rect
                                x={x + 4}
                                width={bredde - 8}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                y={y - 4 - hoyde - topp}
                                height={topp}
                                fill={ORANSJE}
                            />
                        )}
                    </g>
                );
            })}
        </g>
    );
}

function Deling({ beat }: { beat: number }) {
    const Y = 720;
    const fullt = 150; // høyde per glass med ti glass
    if (beat === 0) {
        return (
            <g>
                <Botte x={800} y={430} b={260} h={260} fyll={0.75} />
                <rect x={230} y={530} width={540} height={210} rx={24} fill="#eff6ff" stroke={BLA} strokeWidth={5} />
                <Tekst x={500} y={610} str={48} farge={BLA}>
                    levealder
                </Tekst>
                <Tekst x={500} y={680} str={34} vekt={600}>
                    hvor lenge folk lever
                </Tekst>
                <rect x={830} y={530} width={540} height={210} rx={24} fill="#fff7ed" stroke={ORANSJE} strokeWidth={5} />
                <Tekst x={1100} y={610} str={48} farge="#b45309">
                    justering
                </Tekst>
                <Tekst x={1100} y={680} str={34} vekt={600}>
                    en endring
                </Tekst>
                <Tekst x={800} y={642} str={60} farge="#475569">
                    +
                </Tekst>
            </g>
        );
    }
    if (beat === 4) {
        return (
            <g>
                <rect x={60} y={230} width={720} height={560} rx={26} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={4} />
                <Tekst x={420} y={300} str={42} farge={BLA}>
                    Litt mindre i året
                </Tekst>
                <Glass x0={95} y={Y} antall={14} hoyde={(fullt * 10) / 14} bredde={36} />
                <line x1={80} x2={760} y1={Y - 4 - fullt} y2={Y - 4 - fullt} stroke={MORK} strokeWidth={4} strokeDasharray="14 10" />
                <rect x={820} y={230} width={720} height={560} rx={26} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={4} />
                <Tekst x={1180} y={300} str={42} farge="#b45309">
                    eller jobbe litt lenger
                </Tekst>
                <Glass x0={855} y={Y} antall={14} hoyde={(fullt * 10) / 14} bredde={36} topp={fullt - (fullt * 10) / 14} />
                <line x1={840} x2={1520} y1={Y - 4 - fullt} y2={Y - 4 - fullt} stroke={MORK} strokeWidth={4} strokeDasharray="14 10" />
                <Tekst x={800} y={830} str={32} vekt={700}>
                    Stiplet: det besteforeldrene fikk i året
                </Tekst>
                <Tekst x={1180} y={780} str={30} farge="#b45309" vekt={700}>
                    Oransje: det ekstra du jobber inn
                </Tekst>
                <Tekst x={1560} y={870} anker="end" str={26} farge="#64748b" vekt={600}>
                    Skisse
                </Tekst>
            </g>
        );
    }
    const antall = beat >= 2 ? 14 : 10;
    const hoyde = (fullt * 10) / antall;
    return (
        <g>
            <Botte x={200} y={Y} b={220} h={260} fyll={beat >= 1 ? 0.15 : 0.75} />
            <Tekst x={200} y={Y + 60} str={34}>
                Bøtta di
            </Tekst>
            <path d={`M 330 ${Y - 130} L 400 ${Y - 130}`} stroke="#475569" strokeWidth={8} />
            <path d={`M 395 ${Y - 152} L 430 ${Y - 130} L 395 ${Y - 108} Z`} fill="#475569" />
            <Glass x0={460} y={Y} antall={antall} hoyde={hoyde} ekstraFra={beat >= 2 ? 10 : 99} farge={BLA} bredde={56} />
            <Vis når={beat === 2}>
                <line x1={440} x2={1540} y1={Y - 4 - fullt} y2={Y - 4 - fullt} stroke={MORK} strokeWidth={4} strokeDasharray="14 10" />
                <Tekst x={1540} y={Y - 228} anker="end" str={32} vekt={700}>
                    nivået før
                </Tekst>
            </Vis>
            <Tekst x={488} y={Y + 60} str={30} vekt={700}>
                ett år
            </Tekst>
            <Vis når={beat === 2}>
                <Tekst x={460 + 12 * 70} y={Y - 260} str={38} farge="#b45309">
                    flere år
                </Tekst>
                <Tekst x={800} y={260} str={40} farge={ROD}>
                    Hvert glass blir lavere
                </Tekst>
            </Vis>
            <Vis når={beat === 3}>
                <rect x={430} y={180} width={540} height={130} rx={22} fill="#ecfdf5" stroke={GRONN} strokeWidth={5} />
                <Tekst x={700} y={238} str={36} farge={GRONN}>
                    Tanken: pensjonistene
                </Tekst>
                <Tekst x={700} y={285} str={30} vekt={600}>
                    bærer kostnaden selv
                </Tekst>
                <rect x={1010} y={180} width={500} height={130} rx={22} fill="#fff1f2" stroke={ROD} strokeWidth={5} />
                <Tekst x={1240} y={238} str={36} farge={ROD}>
                    Skattebetalerne
                </Tekst>
                <Tekst x={1240} y={285} str={30} vekt={600}>
                    skal ikke bære kostnaden
                </Tekst>
                {/* Rødt kryss ved siden av, ikke over teksten */}
                <path d="M 1455 200 L 1495 240 M 1495 200 L 1455 240" stroke={ROD} strokeWidth={10} strokeLinecap="round" />
            </Vis>
            <Tekst x={1560} y={870} anker="end" str={32} farge="#64748b" vekt={600}>
                Skisse
            </Tekst>
        </g>
    );
}

const UTTAK_X: Record<number, number> = { 62: 220, 67: 440, 75: 790 };
const SLUTT = 1450;
const AREAL = (SLUTT - 220) * 120;

/** Pensjon hver måned fra start til slutten av linja. Samme areal uansett start. */
function Utbetaling({ start, Y, farge = BLA, etikett }: { start: number; Y: number; farge?: string; etikett?: string }) {
    const x = UTTAK_X[start];
    const h = AREAL / (SLUTT - x);
    return (
        <g>
            <motion.rect
                initial={{ height: 0, y: Y }}
                animate={{ height: h, y: Y - h }}
                transition={{ duration: 0.8 }}
                x={x}
                width={SLUTT - x}
                fill={farge}
                opacity={0.85}
                rx={6}
            />
            {/* Striper: én utbetaling hver måned */}
            {Array.from({ length: Math.floor((SLUTT - x) / 26) }, (_, i) => (
                <line key={i} x1={x + 13 + i * 26} x2={x + 13 + i * 26} y1={Y - 4} y2={Y - Math.min(h, 400) + 4} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={3} />
            ))}
            {etikett && (
                <Tekst x={x + (SLUTT - x) / 2} y={Y - h - 24} str={36} farge={farge}>
                    {etikett}
                </Tekst>
            )}
        </g>
    );
}

function Uttak({ beat }: { beat: number }) {
    const Y = 740;
    const akse = (
        <g>
            <line x1={UTTAK_X[62]} x2={SLUTT} y1={Y} y2={Y} stroke="#475569" strokeWidth={8} strokeLinecap="round" />
            {[62, 67, 75].map((a) => (
                <g key={a}>
                    <line x1={UTTAK_X[a]} x2={UTTAK_X[a]} y1={Y - 16} y2={Y + 16} stroke="#475569" strokeWidth={6} />
                    <Tekst x={UTTAK_X[a]} y={Y + 62} str={38}>
                        {`${a} år`}
                    </Tekst>
                </g>
            ))}
            <Tekst x={SLUTT} y={Y + 62} anker="end" str={30} farge="#64748b" vekt={600}>
                resten av livet
            </Tekst>
        </g>
    );
    if (beat === 4) {
        return (
            <g>
                {[62, 67, 75].map((a, i) => {
                    const x0 = 80 + i * 500;
                    const b = 440;
                    const fra = x0 + ((UTTAK_X[a] - 220) / (SLUTT - 220)) * b;
                    const h = (AREAL / (SLUTT - UTTAK_X[a])) * 0.85;
                    return (
                        <g key={a}>
                            <rect x={x0 - 20} y={220} width={b + 40} height={560} rx={24} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={4} />
                            <motion.rect
                                x={fra}
                                width={x0 + b - fra}
                                initial={{ height: 0, y: 700 }}
                                animate={{ height: h * (b / (SLUTT - 220)) * 3.6, y: 700 - h * (b / (SLUTT - 220)) * 3.6 }}
                                transition={{ duration: 0.8, delay: i * 0.2 }}
                                fill={BLA}
                                opacity={0.85}
                                rx={6}
                            />
                            <line x1={x0} x2={x0 + b} y1={700} y2={700} stroke="#475569" strokeWidth={6} />
                            <Tekst x={x0 + b / 2} y={290} str={40}>
                                {`Start ${a} år`}
                            </Tekst>
                            <Tekst x={x0 + b / 2} y={750} str={30} farge="#475569" vekt={600}>
                                Samme bøtte
                            </Tekst>
                        </g>
                    );
                })}
                <Tekst x={1560} y={870} anker="end" str={26} farge="#64748b" vekt={600}>
                    Skisse: flaten er det du får til sammen
                </Tekst>
            </g>
        );
    }
    const start = beat === 2 ? 62 : beat === 3 ? 75 : 67;
    return (
        <g>
            <Vis når={beat === 0}>
                <rect x={UTTAK_X[62]} y={Y - 300} width={UTTAK_X[75] - UTTAK_X[62]} height={300} rx={16} fill={LYSBLA} opacity={0.45} />
                <Tekst x={(UTTAK_X[62] + UTTAK_X[75]) / 2} y={Y - 330} str={40} farge={BLA}>
                    Her velger du start
                </Tekst>
            </Vis>
            {beat >= 1 && (
                <Utbetaling
                    key={start}
                    start={start}
                    Y={Y}
                    farge={beat === 2 ? '#64748b' : BLA}
                    etikett={
                        beat === 2
                            ? 'Lavere hver måned'
                            : beat === 3
                              ? 'Mer hver måned'
                              : 'Pensjon hver måned'
                    }
                />
            )}
            <Vis når={beat === 2}>
                <rect x={UTTAK_X[62] - 20} y={200} width={760} height={80} rx={18} fill="#fff7ed" stroke={ORANSJE} strokeWidth={4} />
                <Tekst x={UTTAK_X[62] + 360} y={254} str={34} farge="#b45309">
                    Start som 62-åring: du må ha tjent opp nok
                </Tekst>
            </Vis>
            <Vis når={beat === 5}>
                <rect x={UTTAK_X[67]} y={Y - 146 - 200} width={340} height={100} rx={14} fill={ORANSJE} />
                <Tekst x={UTTAK_X[67] + 170} y={Y - 146 - 137} str={38} farge="#ffffff">
                    Jobb
                </Tekst>
                <Tekst x={1000} y={300} str={36} farge={GRONN}>
                    Jobber du ved siden av, blir pensjonen ikke mindre
                </Tekst>
            </Vis>
            {akse}
            <Tekst x={1560} y={870} anker="end" str={32} farge="#64748b" vekt={600}>
                Skisse
            </Tekst>
        </g>
    );
}

export function PensjonLonn({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'andel';
    const liste = OVERSKRIFT[modus];
    const tittel = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.g
                        key={tittel}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        <Tekst x={800} y={100} str={58} vekt={900}>
                            {tittel}
                        </Tekst>
                    </motion.g>
                </AnimatePresence>
                {modus === 'andel' && <Andel beat={beat} />}
                {modus === 'livslinje' && <Livslinje beat={beat} />}
                {modus === 'deling' && <Deling beat={beat} />}
                {modus === 'uttak' && <Uttak beat={beat} />}
            </svg>
        </div>
    );
}
