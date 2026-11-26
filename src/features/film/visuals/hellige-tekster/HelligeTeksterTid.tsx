import { motion } from 'framer-motion';
import { Lock, MessageCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import type { VisualProps } from '../../types';
import { HtBrikke } from './HtBrikke';

/**
 * Tidslinje fra år 0 til 700: hvor lenge Bibelen og Koranen var på vei fra muntlig
 * fortelling til lukket liste. Årstallene står i artikkelen (teksten og TekstensReise).
 *
 * «bibelen»: korsfestelsen ca. år 30, Det nye testamentet ca. 50 til tidlig 100-tall,
 *            godtatt litt etter litt, Athanasius' påskebrev 367.
 * «islam»: Bibelen dempet over, Koranen under: muntlig 610-632, ferdig før 656,
 *          lukket med en gang. Til slutt klammen over de omtrent 260 årene i Bibelen.
 */

type Modus = 'bibelen' | 'islam';

const B = 1600;
const H = 900;
const X0 = 160;
const X1 = 1480;
const AAR1 = 700;
const xAar = (a: number) => X0 + ((X1 - X0) * a) / AAR1;

const TEKST: Record<Modus, string[]> = {
    bibelen: [
        'Bibelen: først muntlig',
        'Det nye testamentet skrives ned',
        'Hvem bestemte hva som skulle med?',
        'År 367: hele lista i et påskebrev',
        'Fortsatt uenige om kantene',
    ],
    islam: [
        'Ifølge muslimene: muntlig fra Gud i drøyt tjue år',
        'Ferdig før år 656, sier kildene',
        'Lukket med en gang',
        'Omtrent 260 år mot ingen ventetid',
    ],
};

const KRIST_Y = 330;
const ISLAM_Y = 600;

function Inn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay, duration: 0.5 }}
        >
            {children}
        </motion.g>
    );
}

/** En stolpe fra år a til år b som vokser fram fra venstre. */
function Stolpe({
    a,
    b,
    y,
    h,
    farge,
}: {
    a: number;
    b: number;
    y: number;
    h: number;
    farge: string;
}) {
    return (
        <motion.rect
            x={xAar(a)}
            y={y}
            height={h}
            rx={8}
            fill={farge}
            initial={{ width: 0 }}
            animate={{ width: xAar(b) - xAar(a) }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
        />
    );
}

function Laas({ aar, y, farge }: { aar: number; y: number; farge: string }) {
    const x = xAar(aar);
    return (
        <g>
            <line x1={x} y1={y - 16} x2={x} y2={y + 76} stroke={farge} strokeWidth={6} />
            <circle cx={x} cy={y + 30} r={30} fill={farge} />
            <Lock x={x - 18} y={y + 12} width={36} height={36} color="#ffffff" strokeWidth={2.6} />
        </g>
    );
}

function Akse() {
    return (
        <g>
            <line x1={X0} y1={810} x2={X1} y2={810} stroke="#334155" strokeWidth={4} />
            {[0, 100, 200, 300, 400, 500, 600, 700].map((a) => (
                <g key={a}>
                    <line
                        x1={xAar(a)}
                        y1={800}
                        x2={xAar(a)}
                        y2={822}
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <text
                        x={xAar(a)}
                        y={862}
                        textAnchor="middle"
                        fontSize={30}
                        fontWeight={700}
                        fill="#334155"
                    >
                        {a === 0 ? 'år 0' : a}
                    </text>
                </g>
            ))}
        </g>
    );
}

/** Bibelens rad. `etiketter` skrur av tekstene når raden står dempet bak Koranen. */
function Kristendom({ beat, etiketter }: { beat: number; etiketter: boolean }) {
    return (
        <g>
            <text x={X0} y={KRIST_Y - 40} fontSize={40} fontWeight={900} fill="#7c3aed">
                Kristendom: Bibelen
            </text>
            {beat >= 0 && <Stolpe a={30} b={50} y={KRIST_Y} h={60} farge="#f59e0b" />}
            {beat >= 0 && etiketter && (
                <Inn delay={0.4}>
                    <MessageCircle
                        x={xAar(30) - 6}
                        y={KRIST_Y + 74}
                        width={40}
                        height={40}
                        color="#b45309"
                        strokeWidth={2.4}
                    />
                    <text
                        x={xAar(30) + 42}
                        y={KRIST_Y + 104}
                        fontSize={30}
                        fontWeight={800}
                        fill="#b45309"
                    >
                        ca. år 30: muntlig
                    </text>
                </Inn>
            )}
            {beat >= 1 && <Stolpe a={50} b={110} y={KRIST_Y} h={60} farge="#2563eb" />}
            {beat >= 1 && etiketter && (
                <Inn delay={0.4}>
                    <text
                        x={xAar(50)}
                        y={KRIST_Y + 150}
                        fontSize={30}
                        fontWeight={800}
                        fill="#1d4ed8"
                    >
                        ca. år 50 til tidlig 100-tall: skrevet på gresk
                    </text>
                </Inn>
            )}
            {beat >= 2 && (
                <g>
                    <motion.rect
                        x={xAar(110)}
                        y={KRIST_Y + 12}
                        height={36}
                        fill="url(#ht-godtatt)"
                        initial={{ width: 0 }}
                        animate={{ width: xAar(367) - xAar(110) }}
                        transition={{ duration: 1.6, ease: 'linear' }}
                    />
                    {etiketter && beat === 2 && (
                        <Inn delay={0.6}>
                            <text
                                x={xAar(110)}
                                y={KRIST_Y + 210}
                                fontSize={34}
                                fontWeight={900}
                                fill="#5b21b6"
                            >
                                godtatt litt etter litt
                            </text>
                            <text
                                x={xAar(110)}
                                y={KRIST_Y + 256}
                                fontSize={30}
                                fontWeight={700}
                                fill="#475569"
                            >
                                ingen enkeltperson, ikke noe kirkemøte
                            </text>
                        </Inn>
                    )}
                </g>
            )}
            {beat >= 3 && <Laas aar={367} y={KRIST_Y} farge="#7c3aed" />}
            {beat >= 3 && etiketter && (
                <Inn delay={0.3}>
                    <text
                        x={xAar(367) + 46}
                        y={KRIST_Y + 42}
                        fontSize={32}
                        fontWeight={900}
                        fill="#5b21b6"
                    >
                        år 367: Athanasius lister opp skriftene
                    </text>
                </Inn>
            )}
        </g>
    );
}

function Bibelen({ beat }: { beat: number }) {
    return (
        <g>
            <Kristendom beat={beat} etiketter />
            {beat >= 4 && (
                <Inn>
                    <rect
                        x={280}
                        y={540}
                        width={500}
                        height={170}
                        rx={20}
                        fill="#ede9fe"
                        stroke="#7c3aed"
                        strokeWidth={4}
                    />
                    <text
                        x={530}
                        y={612}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#4c1d95"
                    >
                        Katolske og ortodokse
                    </text>
                    <text
                        x={530}
                        y={664}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#4c1d95"
                    >
                        flere bøker
                    </text>
                    <rect
                        x={840}
                        y={540}
                        width={500}
                        height={170}
                        rx={20}
                        fill="#f1f5f9"
                        stroke="#64748b"
                        strokeWidth={4}
                    />
                    <text
                        x={1090}
                        y={612}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#334155"
                    >
                        De fleste protestantiske
                    </text>
                    <text
                        x={1090}
                        y={664}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={800}
                        fill="#334155"
                    >
                        færre bøker
                    </text>
                </Inn>
            )}
        </g>
    );
}

function Islam({ beat }: { beat: number }) {
    return (
        <g>
            <g opacity={beat === 3 ? 1 : 0.35}>
                <Kristendom beat={3} etiketter={false} />
            </g>
            {beat === 3 && (
                <Inn>
                    <path
                        d={`M ${xAar(110)} ${KRIST_Y + 80} v 24 H ${xAar(367)} v -24`}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth={5}
                    />
                    <text
                        x={(xAar(110) + xAar(367)) / 2}
                        y={KRIST_Y + 150}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#0f172a"
                    >
                        omtrent 260 år
                    </text>
                </Inn>
            )}
            <text x={X0} y={ISLAM_Y - 40} fontSize={40} fontWeight={900} fill="#059669">
                Islam: Koranen
            </text>
            <Stolpe a={610} b={632} y={ISLAM_Y} h={60} farge="#f59e0b" />
            <Inn delay={0.4}>
                <text
                    x={xAar(610) - 20}
                    y={ISLAM_Y + 42}
                    textAnchor="end"
                    fontSize={30}
                    fontWeight={800}
                    fill="#b45309"
                >
                    ifølge muslimene: muntlig
                </text>
            </Inn>
            {beat >= 1 && (
                <g>
                    <defs>
                        <linearGradient id="ht-skrevet" x1="0" x2="1">
                            <stop offset="0" stopColor="#2563eb" stopOpacity={0.55} />
                            <stop offset="0.3" stopColor="#2563eb" stopOpacity={1} />
                        </linearGradient>
                    </defs>
                    <rect
                        x={xAar(614)}
                        y={ISLAM_Y + 72}
                        width={xAar(656) - xAar(614)}
                        height={40}
                        rx={8}
                        fill="url(#ht-skrevet)"
                    />
                    <Inn delay={0.3}>
                        <text
                            x={xAar(610) - 20}
                            y={ISLAM_Y + 104}
                            textAnchor="end"
                            fontSize={30}
                            fontWeight={800}
                            fill="#1d4ed8"
                        >
                            skrevet ned, ferdig før år 656
                        </text>
                    </Inn>
                </g>
            )}
            {beat >= 2 && <Laas aar={656} y={ISLAM_Y} farge="#059669" />}
            {beat >= 2 && (
                <Inn delay={0.3}>
                    <text
                        x={xAar(656) + 10}
                        y={ISLAM_Y - 40}
                        textAnchor="end"
                        fontSize={32}
                        fontWeight={900}
                        fill="#047857"
                    >
                        lukket med en gang
                    </text>
                </Inn>
            )}
        </g>
    );
}

export function HelligeTeksterTid({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'bibelen';
    const liste = TEKST[modus];
    const tekst = liste[Math.min(beat, liste.length - 1)];
    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: '#f8fafc' }}>
            <svg
                viewBox={`0 0 ${B} ${H}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <pattern
                        id="ht-godtatt"
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width="24" height="24" fill="#ddd6fe" />
                        <rect width="10" height="24" fill="#a78bfa" />
                    </pattern>
                </defs>
                <Akse />
                {modus === 'bibelen' ? <Bibelen beat={beat} /> : <Islam beat={beat} />}
            </svg>
            <HtBrikke tekst={tekst} nokkel={`${modus}-${beat}`} />
        </div>
    );
}
