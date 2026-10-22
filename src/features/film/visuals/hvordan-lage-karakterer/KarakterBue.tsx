import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift } from './felles';

/**
 * Hva skjer med karakteren gjennom historien? En tidslinje fra start til slutt.
 * - dynamisk: plottet som hendelser, så en dynamisk karakter (linja endrer seg) og en
 *   statisk (linja er flat).
 * - eventyr: eventyret med flate linjer (helt og skurk), mot romanen der linjene bøyer seg.
 */

type Modus = 'dynamisk' | 'eventyr';

const HENDELSER = [300, 560, 820, 1080, 1340];

function Akse({ x1, x2, y }: { x1: number; x2: number; y: number }) {
    return (
        <g>
            <line x1={x1} y1={y} x2={x2} y2={y} stroke="#94a3b8" strokeWidth={5} />
            <path d={`M ${x2} ${y - 16} L ${x2 + 26} ${y} L ${x2} ${y + 16} Z`} fill="#94a3b8" />
            <text x={x1} y={y + 50} fontSize={30} fill="#64748b">
                Start
            </text>
            <text x={x2} y={y + 50} fontSize={30} fill="#64748b" textAnchor="end">
                Slutt
            </text>
        </g>
    );
}

function Linje({
    d,
    farge,
    synlig,
    bredde = 12,
    forsinkelse = 0,
}: {
    d: string;
    farge: string;
    synlig: boolean;
    bredde?: number;
    forsinkelse?: number;
}) {
    return (
        <motion.path
            d={d}
            fill="none"
            stroke={farge}
            strokeWidth={bredde}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: synlig ? 1 : 0, opacity: synlig ? 1 : 0 }}
            transition={{ duration: 2, ease: 'easeInOut', delay: forsinkelse }}
        />
    );
}

function Merke({
    x,
    y,
    tekst,
    farge,
    synlig,
    anker = 'start',
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
    synlig: boolean;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            fontSize={40}
            fontWeight={800}
            fill={farge}
            textAnchor={anker}
            className="font-display"
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

function Dynamisk({ beat }: { beat: number }) {
    const overskrift = [
        'Plottet: hva som skjer',
        'Hvem det skjer med',
        'Dynamisk karakter',
        'Statisk karakter',
    ][Math.min(beat, 3)];
    return (
        <>
            <Overskrift tekst={overskrift} />
            <Akse x1={180} x2={1420} y={790} />
            {/* Hendelsene i plottet */}
            {HENDELSER.map((x, i) => (
                <motion.g
                    key={x}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: beat === 0 ? 1 : 0.45, y: 0 }}
                    transition={{ delay: i * 0.3 }}
                >
                    <rect x={x - 26} y={764} width={52} height={52} rx={10} fill="#64748b" />
                    <text
                        x={x}
                        y={803}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={900}
                        fill="#fff"
                    >
                        !
                    </text>
                </motion.g>
            ))}
            <Merke
                x={800}
                y={720}
                tekst="hendelser"
                farge="#475569"
                synlig={beat === 0}
                anker="middle"
            />
            {/* Personen som går gjennom historien */}
            <motion.circle
                cx={220}
                cy={560}
                r={34}
                fill="#2563eb"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: beat >= 1 ? 1 : 0, scale: beat >= 1 ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 220, damping: 14 }}
            />
            <Merke x={270} y={510} tekst="Hun" farge="#1d4ed8" synlig={beat === 1} />
            {/* Dynamisk: linja stiger og skifter farge */}
            <defs>
                <linearGradient id="karakter-bue-dyn" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
            </defs>
            <Linje
                d="M 220 560 C 520 600, 700 520, 860 430 S 1200 230, 1400 250"
                farge="url(#karakter-bue-dyn)"
                synlig={beat >= 2}
            />
            <motion.circle
                cx={1400}
                cy={250}
                r={44}
                fill="#ea580c"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: beat >= 2 ? 1 : 0, scale: beat >= 2 ? 1 : 0 }}
                transition={{ delay: 1.8, type: 'spring', stiffness: 220, damping: 14 }}
            />
            <Merke
                x={1340}
                y={200}
                tekst="forandrer seg"
                farge="#c2410c"
                synlig={beat >= 2}
                anker="end"
            />
            {/* Statisk: flat linje */}
            <Linje d="M 220 660 L 1400 660" farge="#94a3b8" synlig={beat >= 3} />
            <motion.circle
                cx={220}
                cy={660}
                r={34}
                fill="#94a3b8"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
            />
            <motion.circle
                cx={1400}
                cy={660}
                r={34}
                fill="#94a3b8"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ delay: 1.8 }}
            />
            <Merke
                x={800}
                y={630}
                tekst="den samme hele veien"
                farge="#475569"
                synlig={beat >= 3}
                anker="middle"
            />
        </>
    );
}

function Eventyr({ beat }: { beat: number }) {
    return (
        <>
            <Overskrift tekst="Eventyr og roman" />
            {/* Venstre: eventyret */}
            <rect x={90} y={160} width={680} height={660} rx={30} fill="#ffffff" opacity={0.85} />
            <Merke x={430} y={230} tekst="Eventyr" farge="#0f172a" synlig anker="middle" />
            <Akse x1={150} x2={680} y={740} />
            <Linje d="M 170 380 L 690 380" farge="#2563eb" synlig={beat >= 1} />
            <Merke x={170} y={350} tekst="Helten er helt" farge="#1d4ed8" synlig={beat >= 1} />
            <Linje d="M 170 590 L 690 590" farge="#475569" synlig={beat >= 1} forsinkelse={0.5} />
            <Merke x={170} y={560} tekst="Skurken er skurk" farge="#334155" synlig={beat >= 1} />
            <Merke
                x={430}
                y={680}
                tekst="ingen forandrer seg"
                farge="#64748b"
                synlig={beat >= 1}
                anker="middle"
            />

            {/* Høyre: romanen */}
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 2 ? 1 : 0.25 }}
                transition={{ duration: 0.6 }}
            >
                <rect
                    x={830}
                    y={160}
                    width={680}
                    height={660}
                    rx={30}
                    fill="#ffffff"
                    opacity={0.85}
                />
                <Merke x={1170} y={230} tekst="Roman" farge="#0f172a" synlig anker="middle" />
                <Akse x1={890} x2={1420} y={740} />
            </motion.g>
            <Linje
                d="M 910 560 C 1030 640, 1110 330, 1220 420 S 1360 300, 1430 330"
                farge="#ea580c"
                synlig={beat >= 2}
            />
            <Linje
                d="M 910 400 C 1040 360, 1120 560, 1240 520 S 1380 640, 1430 600"
                farge="#7c3aed"
                synlig={beat >= 2}
                forsinkelse={0.5}
            />
            <Merke x={910} y={350} tekst="Helten" farge="#7c3aed" synlig={beat >= 2} />
            <Merke
                x={1430}
                y={290}
                tekst="Skurken"
                farge="#c2410c"
                synlig={beat >= 2}
                anker="end"
            />
            <Merke
                x={1170}
                y={680}
                tekst="begge forandrer seg"
                farge="#c2410c"
                synlig={beat >= 2}
                anker="middle"
            />
        </>
    );
}

export function KarakterBue({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'dynamisk';
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-sky-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'dynamisk' ? <Dynamisk beat={beat} /> : <Eventyr beat={beat} />}
            </svg>
        </div>
    );
}
