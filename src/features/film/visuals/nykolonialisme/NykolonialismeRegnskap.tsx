import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Pengene bak makten, tegnet som enkle regnskap.
 * «felle»: långiveren sender et lån, landet bygger et prosjekt, gjelden vokser, og til slutt
 *   går et tau fra långiveren til landet: «Gjør som vi sier».
 * «renter»: lånet pluss renter, så to søyler (rike land og det globale sør), så budsjettet der
 *   rentene presser helse og skole.
 * «vekt»: en vippe med et stort selskap og en liten regjering. Til slutt flytter jobbene.
 */

type Modus = 'felle' | 'renter' | 'vekt';

const B = 1600;
const H = 900;
const ROD = '#dc2626';
const BLA = '#1d4ed8';
const GRONN = '#15803d';
const GULL = '#ca8a04';

export function NykolonialismeRegnskap({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'felle';
    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f4f6f8]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {modus === 'felle' && <Felle beat={beat} />}
                {modus === 'renter' && <Renter beat={beat} />}
                {modus === 'vekt' && <Vekt beat={beat} />}
            </svg>
            <Brikke modus={modus} beat={beat} />
        </div>
    );
}

const BRIKKER: Record<Modus, { tekst: string; rod?: boolean }[]> = {
    felle: [
        { tekst: 'Verktøy 1: Gjeld' },
        { tekst: 'Et stort lån til et flott prosjekt' },
        { tekst: 'Landet klarer ikke å betale tilbake', rod: true },
        { tekst: 'Den som skylder, er ikke helt fri', rod: true },
    ],
    renter: [
        { tekst: 'Renter: prisen for å låne' },
        { tekst: 'Omtrent dobbelt så mye i renter', rod: true },
        { tekst: 'Helse og skole holder ikke tritt', rod: true },
    ],
    vekt: [
        { tekst: 'Selskap mot regjering' },
        { tekst: 'Ikke to like parter', rod: true },
        { tekst: '«Vi kan flytte jobbene»', rod: true },
    ],
};

function Brikke({ modus, beat }: { modus: Modus; beat: number }) {
    const b = BRIKKER[modus][Math.min(beat, BRIKKER[modus].length - 1)];
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${modus}-${beat}`}
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                className={`absolute top-[5%] left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl shadow-xl font-display font-bold text-4xl whitespace-nowrap ${
                    b.rod ? 'bg-red-700 text-white' : 'bg-white text-slate-900'
                }`}
            >
                {b.tekst}
            </motion.div>
        </AnimatePresence>
    );
}

/* ---------------- Gjeldsfella ---------------- */

const LAND_X = 380;
const BANK_X = 1220;
const BAKKE = 760;

function Felle({ beat }: { beat: number }) {
    const gjeld = beat >= 3 ? 360 : beat >= 2 ? 280 : beat >= 1 ? 120 : 0;
    return (
        <g>
            <line x1={0} y1={BAKKE} x2={B} y2={BAKKE} stroke="#cbd5e1" strokeWidth={6} />
            {/* Landet: hus og flagg */}
            <Landet x={LAND_X} />
            <text
                x={LAND_X}
                y={BAKKE + 70}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={GRONN}
            >
                Et fattig land
            </text>
            {/* Långiveren: bank med søyler */}
            <Bank x={BANK_X} />
            <text
                x={BANK_X}
                y={BAKKE + 70}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill={BLA}
            >
                Långiveren
            </text>

            {/* Lånet reiser over */}
            {beat === 1 && (
                <motion.g
                    initial={{ x: BANK_X - 60, y: 420 }}
                    animate={{ x: LAND_X + 120, y: 420 }}
                    transition={{ delay: 0.3, duration: 1.6, ease: 'easeInOut' }}
                >
                    <Sekk />
                </motion.g>
            )}

            {/* Prosjektet: en bro som reiser seg */}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ delay: beat === 1 ? 1.8 : 0, duration: 0.9 }}
                    style={{ transformOrigin: `620px ${BAKKE}px` }}
                >
                    <rect x={540} y={BAKKE - 150} width={300} height={22} fill="#64748b" />
                    {[560, 690, 800].map((x) => (
                        <rect
                            key={x}
                            x={x}
                            y={BAKKE - 128}
                            width={22}
                            height={128}
                            fill="#94a3b8"
                        />
                    ))}
                    <text
                        x={690}
                        y={BAKKE - 170}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={800}
                        fill="#334155"
                    >
                        prosjektet
                    </text>
                </motion.g>
            )}

            {/* Gjelden vokser som en rød søyle */}
            {beat >= 1 && (
                <g>
                    <motion.rect
                        x={LAND_X - 300}
                        width={90}
                        fill={ROD}
                        rx={8}
                        initial={{ y: BAKKE, height: 0 }}
                        animate={{ y: BAKKE - gjeld, height: gjeld }}
                        transition={{ delay: beat === 1 ? 2 : 0.4, duration: 1.4 }}
                    />
                    <motion.text
                        x={LAND_X - 255}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill={ROD}
                        initial={{ y: BAKKE - 20 }}
                        animate={{ y: BAKKE - gjeld - 20 }}
                        transition={{ delay: beat === 1 ? 2 : 0.4, duration: 1.4 }}
                    >
                        gjeld
                    </motion.text>
                </g>
            )}

            {beat === 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <text
                        x={LAND_X + 40}
                        y={330}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={900}
                        fill={ROD}
                    >
                        Kan ikke betale
                    </text>
                </motion.g>
            )}

            {/* Tauet og ordren */}
            {beat >= 3 && (
                <g>
                    <motion.path
                        d={`M ${BANK_X - 90} 500 Q 800 330 ${LAND_X + 150} ${BAKKE - 270}`}
                        fill="none"
                        stroke="#78350f"
                        strokeWidth={12}
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.3, duration: 1.2 }}
                    />
                    <motion.g
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.4, type: 'spring', stiffness: 200, damping: 14 }}
                        style={{ transformOrigin: `${BANK_X}px 250px` }}
                    >
                        <rect
                            x={BANK_X - 230}
                            y={190}
                            width={460}
                            height={110}
                            rx={24}
                            fill={BLA}
                        />
                        <path
                            d={`M ${BANK_X - 20} 298 L ${BANK_X} 340 L ${BANK_X + 20} 298 Z`}
                            fill={BLA}
                        />
                        <text
                            x={BANK_X}
                            y={262}
                            textAnchor="middle"
                            fontSize={50}
                            fontWeight={900}
                            fill="#fff"
                        >
                            Gjør som vi sier
                        </text>
                    </motion.g>
                </g>
            )}
        </g>
    );
}

function Landet({ x }: { x: number }) {
    return (
        <g>
            {[-110, 0, 110].map((dx, i) => (
                <g
                    key={dx}
                    transform={`translate(${x + dx - 45} ${BAKKE - 110 - (i === 1 ? 30 : 0)})`}
                >
                    <rect
                        y={40}
                        width={90}
                        height={70 + (i === 1 ? 30 : 0)}
                        fill="#fde68a"
                        stroke="#92400e"
                        strokeWidth={4}
                    />
                    <path d="M -8 44 L 45 0 L 98 44 Z" fill="#b45309" />
                </g>
            ))}
            <rect x={x + 130} y={BAKKE - 280} width={8} height={280} fill="#57534e" />
            <rect x={x + 138} y={BAKKE - 278} width={90} height={22} fill="#16a34a" />
            <rect x={x + 138} y={BAKKE - 256} width={90} height={22} fill="#facc15" />
            <rect x={x + 138} y={BAKKE - 234} width={90} height={22} fill={ROD} />
        </g>
    );
}

function Bank({ x }: { x: number }) {
    return (
        <g>
            <path
                d={`M ${x - 200} ${BAKKE - 300} L ${x} ${BAKKE - 400} L ${x + 200} ${BAKKE - 300} Z`}
                fill="#1e3a8a"
            />
            <rect x={x - 200} y={BAKKE - 300} width={400} height={30} fill="#1e3a8a" />
            {[-150, -75, 0, 75, 150].map((dx) => (
                <rect
                    key={dx}
                    x={x + dx - 18}
                    y={BAKKE - 270}
                    width={36}
                    height={240}
                    fill="#dbeafe"
                    stroke="#1e3a8a"
                    strokeWidth={4}
                />
            ))}
            <rect x={x - 220} y={BAKKE - 30} width={440} height={30} fill="#1e3a8a" />
        </g>
    );
}

function Sekk() {
    return (
        <g>
            <path
                d="M 25 40 Q -10 100 10 140 Q 60 165 110 140 Q 130 100 95 40 Z"
                fill={GULL}
                stroke="#713f12"
                strokeWidth={5}
            />
            <rect x={35} y={18} width={50} height={26} rx={8} fill="#a16207" />
            <text x={60} y={118} textAnchor="middle" fontSize={44} fontWeight={900} fill="#fff">
                lån
            </text>
        </g>
    );
}

/* ---------------- Renter ---------------- */

function Renter({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <g>
                <g transform="translate(330 360)">
                    <Sekk />
                </g>
                <text
                    x={390}
                    y={600}
                    textAnchor="middle"
                    fontSize={44}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    Lånet
                </text>
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    x={620}
                    y={470}
                    textAnchor="middle"
                    fontSize={110}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    +
                </motion.text>
                <motion.g
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    {[0, 1, 2].map((i) => (
                        <ellipse
                            key={i}
                            cx={830}
                            cy={520 - i * 26}
                            rx={70}
                            ry={22}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={5}
                        />
                    ))}
                    <text
                        x={830}
                        y={600}
                        textAnchor="middle"
                        fontSize={44}
                        fontWeight={900}
                        fill={ROD}
                    >
                        Renter
                    </text>
                </motion.g>
                <motion.text
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.6 }}
                    x={1040}
                    y={470}
                    textAnchor="middle"
                    fontSize={110}
                    fontWeight={900}
                    fill="#0f172a"
                >
                    =
                </motion.text>
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                >
                    <text
                        x={1290}
                        y={440}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill={BLA}
                    >
                        Det du må
                    </text>
                    <text
                        x={1290}
                        y={500}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={900}
                        fill={BLA}
                    >
                        betale tilbake
                    </text>
                </motion.g>
            </g>
        );
    }
    // To søyler: renter for rike land og for det globale sør.
    const grunn = 760;
    const enhet = 180;
    return (
        <g>
            <line x1={160} y1={grunn} x2={1440} y2={grunn} stroke="#94a3b8" strokeWidth={6} />
            <Soyle
                x={360}
                grunn={grunn}
                hoyde={enhet}
                farge={ROD}
                etikett="Rike industriland"
                tekst="renter"
            />
            <Soyle
                x={760}
                grunn={grunn}
                hoyde={enhet * 2}
                farge={ROD}
                etikett="Det globale sør"
                tekst="renter"
                forsinkelse={0.6}
            />
            <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
                x={760}
                y={grunn - enhet * 2 - 30}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill={ROD}
            >
                omtrent dobbelt
            </motion.text>
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    {/* Budsjettet i sør: rentene tar plassen */}
                    <text
                        x={1230}
                        y={210}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        Budsjettet i sør
                    </text>
                    <rect
                        x={1080}
                        y={240}
                        width={300}
                        height={520}
                        rx={14}
                        fill="#fff"
                        stroke="#334155"
                        strokeWidth={5}
                    />
                    <motion.rect
                        x={1090}
                        width={280}
                        fill={ROD}
                        rx={8}
                        initial={{ y: 250, height: 160 }}
                        animate={{ y: 250, height: 300 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    />
                    <motion.text
                        x={1230}
                        textAnchor="middle"
                        fontSize={36}
                        fontWeight={900}
                        fill="#fff"
                        initial={{ y: 340 }}
                        animate={{ y: 410 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    >
                        renter
                    </motion.text>
                    <motion.rect
                        x={1090}
                        width={280}
                        fill={GRONN}
                        rx={8}
                        initial={{ y: 420, height: 160 }}
                        animate={{ y: 560, height: 90 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    />
                    <motion.text
                        x={1230}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#fff"
                        initial={{ y: 510 }}
                        animate={{ y: 616 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    >
                        helse
                    </motion.text>
                    <motion.rect
                        x={1090}
                        width={280}
                        fill={BLA}
                        rx={8}
                        initial={{ y: 590, height: 160 }}
                        animate={{ y: 660, height: 90 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    />
                    <motion.text
                        x={1230}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#fff"
                        initial={{ y: 680 }}
                        animate={{ y: 716 }}
                        transition={{ delay: 0.8, duration: 1.6 }}
                    >
                        skole
                    </motion.text>
                </motion.g>
            )}
        </g>
    );
}

function Soyle({
    x,
    grunn,
    hoyde,
    farge,
    etikett,
    tekst,
    forsinkelse = 0,
}: {
    x: number;
    grunn: number;
    hoyde: number;
    farge: string;
    etikett: string;
    tekst: string;
    forsinkelse?: number;
}) {
    return (
        <g>
            <motion.rect
                x={x - 110}
                width={220}
                rx={10}
                fill={farge}
                initial={{ y: grunn, height: 0 }}
                animate={{ y: grunn - hoyde, height: hoyde }}
                transition={{ delay: 0.3 + forsinkelse, duration: 1.2 }}
            />
            <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 + forsinkelse }}
                x={x}
                y={grunn - hoyde / 2 + 14}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#fff"
            >
                {tekst}
            </motion.text>
            <text
                x={x}
                y={grunn + 56}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#0f172a"
            >
                {etikett}
            </text>
        </g>
    );
}

/* ---------------- Vippa ---------------- */

function Vekt({ beat }: { beat: number }) {
    const vinkel = 12;
    const flytter = beat >= 2;
    return (
        <g>
            <line x1={0} y1={800} x2={B} y2={800} stroke="#cbd5e1" strokeWidth={6} />
            <path d="M 740 800 L 800 690 L 860 800 Z" fill="#475569" />
            <motion.g
                initial={{ rotate: 0 }}
                animate={{ rotate: vinkel }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 60, damping: 10 }}
                style={{ transformOrigin: '800px 690px' }}
            >
                <rect x={260} y={676} width={1080} height={28} rx={8} fill="#78350f" />
                {/* Regjeringen: et lite hus med kuppel */}
                <g transform="translate(330 0)">
                    <rect
                        x={0}
                        y={590}
                        width={150}
                        height={86}
                        fill="#fef3c7"
                        stroke="#92400e"
                        strokeWidth={5}
                    />
                    <path d="M 35 590 Q 75 530 115 590 Z" fill="#16a34a" />
                    <text
                        x={75}
                        y={515}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={900}
                        fill={GRONN}
                    >
                        Regjeringen
                    </text>
                </g>
                {/* Selskapet: et høyt tårn med logo */}
                <g transform="translate(1040 0)">
                    <rect x={0} y={250} width={240} height={426} fill="#1e3a8a" />
                    {[0, 1, 2, 3, 4, 5].map((r) =>
                        [0, 1, 2].map((c) => (
                            <rect
                                key={`${r}-${c}`}
                                x={30 + c * 70}
                                y={340 + r * 52}
                                width={40}
                                height={30}
                                fill="#93c5fd"
                            />
                        ))
                    )}
                    <rect x={40} y={270} width={160} height={50} rx={10} fill="#facc15" />
                    <text
                        x={120}
                        y={306}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#1e3a8a"
                    >
                        SELSKAP
                    </text>
                    {[0, 1, 2].map((i) => (
                        <ellipse
                            key={i}
                            cx={-50}
                            cy={650 - i * 22}
                            rx={44}
                            ry={14}
                            fill="#facc15"
                            stroke="#a16207"
                            strokeWidth={4}
                        />
                    ))}
                </g>
            </motion.g>

            {/* Jobbene som kan flytte */}
            <motion.g
                initial={false}
                animate={{ x: flytter ? -330 : 0, opacity: flytter ? 0.5 : 1 }}
                transition={{ delay: 1, duration: 1.8, ease: 'easeInOut' }}
            >
                {[0, 1, 2, 3, 4].map((i) => (
                    <g key={i} transform={`translate(${330 + i * 70} 720)`}>
                        <circle cx={0} cy={0} r={18} fill="#d6a77a" />
                        <rect x={-18} y={20} width={36} height={60} rx={8} fill="#ea580c" />
                    </g>
                ))}
                <text
                    x={470}
                    y={850}
                    textAnchor="middle"
                    fontSize={36}
                    fontWeight={900}
                    fill="#9a3412"
                >
                    jobbene
                </text>
            </motion.g>
            {flytter && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <path
                        d="M 400 640 L 110 640"
                        stroke={ROD}
                        strokeWidth={10}
                        strokeLinecap="round"
                    />
                    <path d="M 120 618 L 80 640 L 120 662 Z" fill={ROD} />
                    <text
                        x={255}
                        y={615}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill={ROD}
                    >
                        et annet sted
                    </text>
                </motion.g>
            )}
        </g>
    );
}
