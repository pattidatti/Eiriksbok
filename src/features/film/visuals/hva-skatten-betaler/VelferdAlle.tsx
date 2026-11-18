import { useMemo, type ReactNode } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { useFilmVerden } from '../../kart/useFilmVerden';
import { rammePunkter } from '../../kart/grenser';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvem får, og hvem betaler? Fire moduser i SVG:
 * - universell: to barn går inn den samme døra. Så en sjekk der bare de med lite penger slipper gjennom.
 * - flytt: en felles pott. Barnet betaler ingen inntektsskatt og går på skolen; den som har jobbet
 *   i 40 år, betaler mye mer enn hun får tilbake.
 * - debatt: to sider med avsender, så Stortinget og statsbudsjettet.
 * - generasjoner: barn, voksen og eldre i en ring, og pengene går fra de voksne til de andre.
 */

type Modus = 'universell' | 'flytt' | 'debatt' | 'generasjoner';

const OVERSKRIFT: Record<Modus, string[]> = {
    universell: [
        'Universell: alle har like stor rett',
        'Samme skole, samme barnetrygd',
        'Behovsprøvd: bare de med lite penger',
        'Norge og USA',
    ],
    flytt: [
        'Du får hjelp når du trenger den',
        'Barnet',
        'En som har jobbet i 40 år',
        'Fra dem som tjener mye, til dem som trenger det',
    ],
    debatt: [
        'Rettferdig?',
        'Gjøre flere ordninger behovsprøvde?',
        'Gjøre flere ordninger behovsprøvde?',
        'Beholde universelle ordninger?',
        'Beholde universelle ordninger?',
        'Partiene er uenige',
    ],
    generasjoner: [
        'Du er med allerede nå',
        'Du betaler allerede',
        'En avtale mellom generasjonene',
        'En avtale mellom generasjonene',
        'Det virker bare hvis nok folk jobber',
    ],
};

const BREDDE_PER_TEGN = 0.56;

/** Et kort med tekst. Bredden regnes ut fra teksten, så teksten aldri flyter ut. */
function Kort({
    x,
    y,
    tekst,
    farge,
    str = 30,
    fyll = '#ffffff',
    tekstFarge = '#1e293b',
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    str?: number;
    fyll?: string;
    tekstFarge?: string;
}) {
    const b = tekst.length * str * BREDDE_PER_TEGN + 56;
    const h = str * 2.1;
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <rect
                x={x - b / 2}
                y={y}
                width={b}
                height={h}
                rx={16}
                fill={fyll}
                stroke={farge}
                strokeWidth={4}
            />
            <text
                x={x}
                y={y + h / 2 + str * 0.36}
                textAnchor="middle"
                fontSize={str}
                fontWeight={700}
                fill={tekstFarge}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Figur({
    x,
    y,
    farge,
    skala = 1,
    children,
}: {
    x: number;
    y: number;
    farge: string;
    skala?: number;
    children?: ReactNode;
}) {
    return (
        <motion.g
            initial={false}
            animate={{ x, y }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
            <g transform={`scale(${skala})`}>
                <circle cx={0} cy={-120} r={30} fill="#f5d0a9" />
                <path d="M -40 -80 Q 0 -100 40 -80 L 46 0 L -46 0 Z" fill={farge} />
                {children}
            </g>
        </motion.g>
    );
}

function Mynt({ x, y, r = 26, tekst }: { x: number; y: number; r?: number; tekst?: string }) {
    return (
        <motion.g
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        >
            <circle cx={x} cy={y} r={r} fill="#f59e0b" stroke="#b45309" strokeWidth={4} />
            {tekst && (
                <text
                    x={x}
                    y={y + r + 34}
                    textAnchor="middle"
                    fontSize={26}
                    fontWeight={700}
                    fill="#92400e"
                >
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

function Pil({
    d,
    farge,
    bredde = 8,
    delay = 0,
    spiss = false,
}: {
    d: string;
    farge: string;
    bredde?: number;
    delay?: number;
    spiss?: boolean;
}) {
    return (
        <motion.path
            d={d}
            markerEnd={spiss ? 'url(#velferd-spiss)' : undefined}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay }}
        />
    );
}

// ---------- universell ----------

function Skolebygg({ x, y }: { x: number; y: number }) {
    return (
        <g>
            <rect
                x={x - 170}
                y={y - 220}
                width={340}
                height={220}
                fill="#fed7aa"
                stroke="#9a3412"
                strokeWidth={5}
            />
            <path
                d={`M ${x - 200} ${y - 215} L ${x} ${y - 320} L ${x + 200} ${y - 215} Z`}
                fill="#9a3412"
            />
            <rect x={x - 40} y={y - 120} width={80} height={120} fill="#78350f" />
            {[-120, 80].map((dx) => (
                <rect key={dx} x={x + dx} y={y - 180} width={40} height={40} fill="#93c5fd" />
            ))}
            <text
                x={x}
                y={y - 240}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#ffffff"
            >
                Skole
            </text>
        </g>
    );
}

const NORGE = '578';
const USA = '840';

/** Kart over Norge og USA. Bare de to landene er farget; artikkelen sier ingenting om andre land. */
function NorgeUsaKart() {
    const { geographies } = useFilmVerden();
    const projeksjon = useMemo(
        () =>
            geoNaturalEarth1().fitExtent(
                [
                    [40, 130],
                    [1560, 880],
                ],
                rammePunkter([-128, 22], [34, 72]) as never
            ),
        []
    );
    const sti = useMemo(() => geoPath(projeksjon), [projeksjon]);
    const p = (ll: [number, number]) => projeksjon(ll) as [number, number];
    const [nx, ny] = p([12, 62]);
    const [ux, uy] = p([-99, 39]);
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
            <rect x={0} y={120} width={1600} height={780} fill="#dbeafe" />
            {geographies.map((g, i) => {
                const id = String((g as { id?: string }).id ?? '');
                const fyll = id === NORGE ? '#0d9488' : id === USA ? '#ea580c' : '#e2e8f0';
                return (
                    <path
                        key={i}
                        d={sti(g as never) ?? ''}
                        fill={fyll}
                        stroke="#94a3b8"
                        strokeWidth={1}
                    />
                );
            })}
            <Kort
                x={nx - 260}
                y={ny + 70}
                tekst="Norge: mange universelle ordninger"
                farge="#0d9488"
                str={30}
            />
            <Kort
                x={ux}
                y={uy + 40}
                tekst="USA: mange behovsprøvde og ganske små"
                farge="#ea580c"
                str={30}
            />
        </motion.g>
    );
}

function Universell({ beat }: { beat: number }) {
    if (beat >= 3) return <NorgeUsaKart />;
    const inne = beat >= 1;
    const behov = beat >= 2;
    // Universell: begge går mot skolen. Behovsprøvd: barnet med rike foreldre stopper ved sjekken.
    const sonX = behov ? 470 : inne ? 540 : 200;
    const datterX = behov ? 1150 : inne ? 1060 : 520;
    const sonNavn = behov ? 'Rike foreldre' : 'Direktørens sønn';
    const datterNavn = behov ? 'Lite penger' : 'Butikkansattes datter';
    return (
        <>
            {!behov && <Skolebygg x={800} y={720} />}
            {behov && (
                <g>
                    <rect x={785} y={400} width={30} height={320} fill="#475569" />
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <rect
                            x={560}
                            y={300}
                            width={480}
                            height={70}
                            rx={16}
                            fill="#fff7ed"
                            stroke="#ea580c"
                            strokeWidth={4}
                        />
                        <text
                            x={800}
                            y={347}
                            textAnchor="middle"
                            fontSize={32}
                            fontWeight={800}
                            fill="#9a3412"
                        >
                            Sjekk: har du lite penger?
                        </text>
                    </motion.g>
                    {/* Rødt kryss ved siden av barnet som stoppes */}
                    <g transform="translate(640 560)">
                        <circle r={40} fill="#fee2e2" stroke="#dc2626" strokeWidth={5} />
                        <path
                            d="M -16 -16 L 16 16 M 16 -16 L -16 16"
                            stroke="#dc2626"
                            strokeWidth={8}
                            strokeLinecap="round"
                        />
                    </g>
                    <g transform="translate(960 560)">
                        <circle r={40} fill="#ccfbf1" stroke="#0d9488" strokeWidth={5} />
                        <path
                            d="M -18 2 L -5 16 L 20 -14"
                            stroke="#0d9488"
                            strokeWidth={8}
                            fill="none"
                            strokeLinecap="round"
                        />
                    </g>
                </g>
            )}
            <Figur x={sonX} y={720} farge="#1d4ed8" skala={1.4} />
            <Figur x={datterX} y={720} farge="#db2777" skala={1.4} />
            <text
                x={sonX}
                y={775}
                textAnchor="middle"
                fontSize={32}
                fontWeight={700}
                fill="#1e293b"
            >
                {sonNavn}
            </text>
            <text
                x={datterX}
                y={775}
                textAnchor="middle"
                fontSize={32}
                fontWeight={700}
                fill="#1e293b"
            >
                {datterNavn}
            </text>
            {beat === 1 && (
                <>
                    <Mynt x={sonX} y={420} r={32} tekst="Barnetrygd" />
                    <Mynt x={datterX} y={420} r={32} tekst="Barnetrygd" />
                </>
            )}
            {beat === 2 && <Mynt x={datterX} y={420} r={32} tekst="Hjelp" />}
        </>
    );
}

// ---------- flytt ----------

const POTT = { x: 800, y: 470 };

function Pott({ tekst }: { tekst: string }) {
    return (
        <g>
            <path
                d={`M ${POTT.x - 150} ${POTT.y - 70} L ${POTT.x + 150} ${POTT.y - 70} L ${POTT.x + 115} ${POTT.y + 110} L ${POTT.x - 115} ${POTT.y + 110} Z`}
                fill="#f59e0b"
                stroke="#92400e"
                strokeWidth={6}
            />
            <ellipse
                cx={POTT.x}
                cy={POTT.y - 70}
                rx={150}
                ry={26}
                fill="#fbbf24"
                stroke="#92400e"
                strokeWidth={6}
            />
            <text
                x={POTT.x}
                y={POTT.y + 30}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill="#451a03"
            >
                {tekst}
            </text>
        </g>
    );
}

function Flytt({ beat }: { beat: number }) {
    return (
        <>
            <Pott tekst="Skatten til alle" />
            {beat === 0 && (
                <>
                    {[260, 460, 1140, 1340].map((x, i) => (
                        <Pil
                            key={x}
                            d={`M ${x} 300 Q ${(x + POTT.x) / 2} 260 ${POTT.x + (x < 800 ? -110 : 110)} ${POTT.y - 90}`}
                            farge="#64748b"
                            bredde={7}
                            delay={i * 0.1}
                        />
                    ))}
                    {[260, 460, 1140, 1340].map((x) => (
                        <Figur key={x} x={x} y={290} farge="#64748b" skala={0.7} />
                    ))}
                    {[
                        { x: 340, tekst: 'Syk' },
                        { x: 800, tekst: 'Skole' },
                        { x: 1260, tekst: 'Gammel' },
                    ].map((m, i) => (
                        <g key={m.tekst}>
                            <Pil
                                d={`M ${POTT.x} ${POTT.y + 115} Q ${(POTT.x + m.x) / 2} ${POTT.y + 190} ${m.x} 720`}
                                farge="#0d9488"
                                bredde={7}
                                delay={0.5 + i * 0.15}
                            />
                            <Kort x={m.x} y={735} tekst={m.tekst} farge="#0d9488" str={32} />
                        </g>
                    ))}
                </>
            )}
            {beat === 1 && (
                <>
                    <Figur x={330} y={700} farge="#2563eb" skala={0.8} />
                    <Kort x={330} y={740} tekst="Inntektsskatt: 0 kr" farge="#64748b" str={30} />
                    <Pil
                        d={`M ${POTT.x + 120} ${POTT.y + 60} Q 1100 650 1230 600`}
                        farge="#0d9488"
                        bredde={10}
                    />
                    <Kort x={1260} y={520} tekst="Går på skolen" farge="#0d9488" str={32} />
                </>
            )}
            {beat === 2 && (
                <>
                    <Figur x={330} y={700} farge="#7c3aed" skala={0.9} />
                    <Kort x={330} y={740} tekst="Aldri syk" farge="#64748b" str={30} />
                    <Pil
                        d={`M 400 580 Q 520 400 ${POTT.x - 120} ${POTT.y - 50}`}
                        farge="#7c3aed"
                        bredde={26}
                    />
                    <Kort x={480} y={260} tekst="Betalt inn: mye" farge="#7c3aed" str={30} />
                    <Pil
                        d={`M ${POTT.x + 120} ${POTT.y + 60} Q 1100 650 1230 640`}
                        farge="#7c3aed"
                        bredde={6}
                        delay={0.5}
                    />
                    <Kort
                        x={1260}
                        y={665}
                        tekst="Fått tilbake: mye mindre"
                        farge="#7c3aed"
                        str={30}
                    />
                </>
            )}
            {beat >= 3 && (
                <>
                    <Pil
                        d={`M 300 300 Q 500 260 ${POTT.x - 140} ${POTT.y - 80}`}
                        farge="#64748b"
                        bredde={18}
                    />
                    <Kort x={330} y={190} tekst="Tjener mye" farge="#64748b" str={32} />
                    <Pil
                        d={`M ${POTT.x + 115} ${POTT.y + 80} Q 1100 640 1290 600`}
                        farge="#0d9488"
                        bredde={18}
                        delay={0.4}
                    />
                    <Kort x={1300} y={500} tekst="Trenger det" farge="#0d9488" str={32} />
                    <Kort
                        x={800}
                        y={740}
                        tekst="Mindre forskjeller enn i mange andre land"
                        farge="#0f766e"
                        fyll="#ccfbf1"
                        str={32}
                    />
                </>
            )}
        </>
    );
}

// ---------- debatt ----------

const FAMILIER = [
    { x: 430, tekst: 'Familie med millioninntekt', farge: '#1d4ed8', farge2: '#1e40af' },
    { x: 1170, tekst: 'Familie som sliter med husleia', farge: '#a16207', farge2: '#854d0e' },
];

function Debatt({ beat }: { beat: number }) {
    if (beat === 5) {
        return (
            <>
                <g transform="translate(800 520)">
                    <rect
                        x={-260}
                        y={-60}
                        width={520}
                        height={200}
                        fill="#fde68a"
                        stroke="#b45309"
                        strokeWidth={5}
                    />
                    <path
                        d="M -180 -60 Q 0 -200 180 -60 Z"
                        fill="#fcd34d"
                        stroke="#b45309"
                        strokeWidth={5}
                    />
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <rect
                            key={i}
                            x={-215 + i * 75}
                            y={-20}
                            width={40}
                            height={100}
                            rx={20}
                            fill="#92400e"
                        />
                    ))}
                    <text
                        x={0}
                        y={180}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#0f172a"
                    >
                        Stortinget
                    </text>
                </g>
                <Kort
                    x={800}
                    y={180}
                    tekst="Kommer opp hver høst, i statsbudsjettet"
                    farge="#b45309"
                    str={32}
                />
            </>
        );
    }
    const behov = beat === 1 || beat === 2;
    const universell = beat >= 3;
    const avsender = behov
        ? 'De som vil behovsprøve flere ordninger, sier:'
        : universell
          ? 'De som vil beholde universelle ordninger, sier:'
          : '';
    const farge = behov ? '#ca8a04' : '#0d9488';
    // Mynten til familien med millioninntekt glir over til familien som sliter.
    const rikMyntX = behov ? FAMILIER[1].x + 60 : FAMILIER[0].x;
    const argumenter = behov
        ? [
              { tekst: 'Pengene kan gå til dem som trenger dem mest', fraBeat: 1 },
              { tekst: 'Mer til de fattige, uten å bruke flere penger', fraBeat: 2 },
          ]
        : universell
          ? [
                { tekst: 'Når alle får, er det ingen skam å få', fraBeat: 3 },
                {
                    tekst: 'Bruker de rike samme skole og sykehus, vil de betale for at det er godt',
                    fraBeat: 4,
                },
            ]
          : [];
    return (
        <>
            {avsender && (
                <text
                    x={800}
                    y={160}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill={farge}
                >
                    {avsender}
                </text>
            )}
            {FAMILIER.map((f) => (
                <g key={f.tekst}>
                    <Figur x={f.x - 50} y={560} farge={f.farge} />
                    <Figur x={f.x + 50} y={600} farge={f.farge2} skala={0.7} />
                    <Kort x={f.x} y={612} tekst={f.tekst} farge="#64748b" str={32} />
                </g>
            ))}
            {/* Familien som sliter, har alltid sin egen mynt */}
            <Mynt x={behov ? FAMILIER[1].x - 60 : FAMILIER[1].x} y={300} r={44} />
            <motion.g
                initial={false}
                animate={{ x: rikMyntX - FAMILIER[0].x }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
            >
                <Mynt x={FAMILIER[0].x} y={300} r={44} />
            </motion.g>
            {beat === 0 && (
                <>
                    <text
                        x={800}
                        y={320}
                        textAnchor="middle"
                        fontSize={90}
                        fontWeight={900}
                        fill="#dc2626"
                    >
                        =
                    </text>
                    <text
                        x={800}
                        y={240}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#92400e"
                    >
                        Like mye barnetrygd
                    </text>
                </>
            )}
            {universell && (
                <g>
                    <rect
                        x={640}
                        y={380}
                        width={320}
                        height={64}
                        rx={12}
                        fill="#ffffff"
                        stroke="#64748b"
                        strokeWidth={4}
                    />
                    <text
                        x={800}
                        y={422}
                        textAnchor="middle"
                        fontSize={26}
                        fontWeight={700}
                        fill="#334155"
                    >
                        Bevis at du er fattig
                    </text>
                    <g transform="translate(800 330)">
                        <circle r={30} fill="#fee2e2" stroke="#dc2626" strokeWidth={5} />
                        <path
                            d="M -12 -12 L 12 12 M 12 -12 L -12 12"
                            stroke="#dc2626"
                            strokeWidth={7}
                            strokeLinecap="round"
                        />
                    </g>
                </g>
            )}
            {argumenter
                .filter((a) => beat >= a.fraBeat)
                .map((a, i) => (
                    <Kort
                        key={a.tekst}
                        x={800}
                        y={706 + i * 64}
                        tekst={a.tekst}
                        farge={farge}
                        str={26}
                    />
                ))}
            {beat === 4 && (
                <Kort
                    x={800}
                    y={836}
                    tekst="Ulempen: det koster mer"
                    farge="#dc2626"
                    str={26}
                    fyll="#fef2f2"
                />
            )}
        </>
    );
}

// ---------- generasjoner ----------

const RING = {
    barn: { x: 420, y: 720, topp: 560 },
    voksen: { x: 800, y: 430, topp: 220 },
    eldre: { x: 1180, y: 720, topp: 520 },
};

function DuMerke({
    x,
    y,
    tekst = 'Du',
    stiplet = false,
}: {
    x: number;
    y: number;
    tekst?: string;
    stiplet?: boolean;
}) {
    const b = tekst.length * 32 * 0.6 + 50;
    return (
        <motion.g
            initial={false}
            animate={{ x, y }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
            <rect
                x={-b / 2}
                y={-34}
                width={b}
                height={52}
                rx={14}
                fill={stiplet ? '#ffffff' : '#2563eb'}
                stroke="#2563eb"
                strokeWidth={4}
                strokeDasharray={stiplet ? '10 8' : undefined}
            />
            <text
                x={0}
                y={2}
                textAnchor="middle"
                fontSize={30}
                fontWeight={800}
                fill={stiplet ? '#2563eb' : '#ffffff'}
            >
                {tekst}
            </text>
        </motion.g>
    );
}

function Generasjoner({ beat }: { beat: number }) {
    if (beat <= 1) {
        return (
            <>
                <Figur x={800} y={720} farge="#2563eb" />
                <text
                    x={800}
                    y={790}
                    textAnchor="middle"
                    fontSize={34}
                    fontWeight={800}
                    fill="#1e293b"
                >
                    Du
                </text>
                {beat === 0 && (
                    <Kort
                        x={800}
                        y={260}
                        tekst="Velferdsstaten handler ikke bare om voksne"
                        farge="#64748b"
                        str={32}
                    />
                )}
                {beat === 1 && (
                    <>
                        <Pil d="M 640 600 Q 520 520 470 430" farge="#ca8a04" bredde={8} spiss />
                        <Kort
                            x={420}
                            y={300}
                            tekst="Du kjøper noe: moms i prisen"
                            farge="#ca8a04"
                            str={32}
                        />
                        <Pil
                            d="M 960 600 Q 1080 520 1130 430"
                            farge="#ca8a04"
                            bredde={8}
                            delay={0.4}
                            spiss
                        />
                        <Kort
                            x={1180}
                            y={300}
                            tekst="Sommerjobb: skatt trukket av lønnen"
                            farge="#ca8a04"
                            str={32}
                        />
                    </>
                )}
            </>
        );
    }
    const du = beat >= 3 ? RING.voksen : RING.barn;
    return (
        <>
            <Figur x={RING.barn.x} y={RING.barn.y} farge="#2563eb" skala={0.7} />
            <Figur x={RING.voksen.x} y={RING.voksen.y} farge="#0d9488" />
            <Figur x={RING.eldre.x} y={RING.eldre.y} farge="#7c3aed" skala={0.9} />
            <text
                x={RING.barn.x}
                y={RING.barn.y + 50}
                textAnchor="middle"
                fontSize={30}
                fontWeight={700}
                fill="#1e293b"
            >
                Barn
            </text>
            <text
                x={RING.voksen.x}
                y={RING.voksen.y + 50}
                textAnchor="middle"
                fontSize={30}
                fontWeight={700}
                fill="#1e293b"
            >
                Voksne som jobber
            </text>
            <text
                x={RING.eldre.x}
                y={RING.eldre.y + 50}
                textAnchor="middle"
                fontSize={30}
                fontWeight={700}
                fill="#1e293b"
            >
                Eldre
            </text>
            <Pil
                d={`M ${RING.voksen.x - 90} ${RING.voksen.y - 60} Q 540 380 ${RING.barn.x} ${RING.barn.y - 200}`}
                farge="#f59e0b"
                bredde={12}
                spiss
            />
            <text x={540} y={360} textAnchor="middle" fontSize={32} fontWeight={800} fill="#92400e">
                betaler for
            </text>
            {beat >= 3 && (
                <>
                    <Pil
                        d={`M ${RING.voksen.x + 90} ${RING.voksen.y - 60} Q 1060 380 ${RING.eldre.x} ${RING.eldre.y - 240}`}
                        farge="#f59e0b"
                        bredde={12}
                        delay={0.3}
                        spiss
                    />
                    <text
                        x={1060}
                        y={360}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#92400e"
                    >
                        betaler for
                    </text>
                    <DuMerke
                        x={RING.eldre.x + 190}
                        y={RING.eldre.y - 60}
                        tekst="Du, senere"
                        stiplet
                    />
                </>
            )}
            <DuMerke x={du.x} y={du.topp} />
            {beat === 4 && (
                <Kort
                    x={800}
                    y={810}
                    tekst="Nok folk må jobbe og betale skatt"
                    farge="#dc2626"
                    str={30}
                    fyll="#fef2f2"
                />
            )}
        </>
    );
}

export function VelferdAlle({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'universell';
    const linjer = OVERSKRIFT[modus];
    const tittel = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <svg
            viewBox="0 0 1600 900"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 w-full h-full"
            style={{ background: '#f8fafc' }}
        >
            <defs>
                <marker
                    id="velferd-spiss"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="4"
                    markerHeight="4"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 0 L 10 5 L 0 10 Z" fill="#f59e0b" />
                </marker>
            </defs>
            <AnimatePresence mode="wait">
                <motion.text
                    key={tittel}
                    x={800}
                    y={90}
                    textAnchor="middle"
                    fontSize={52}
                    fontWeight={800}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {tittel}
                </motion.text>
            </AnimatePresence>
            {modus === 'universell' && <Universell beat={beat} />}
            {modus === 'flytt' && <Flytt beat={beat} />}
            {modus === 'debatt' && <Debatt beat={beat} />}
            {modus === 'generasjoner' && <Generasjoner beat={beat} />}
        </svg>
    );
}
