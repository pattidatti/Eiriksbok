import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Overskrift, Person } from './felles';

/**
 * Rollene i en historie.
 * - funksjon: Elias som papirfigur får en jobb: hovedperson (protagonist), med en
 *   motstander (antagonist) mot seg, og en lyskjegle for det bare han ser.
 * - arketyper: helten i midten, med skyggen, hjelperen og mentoren rundt seg.
 */

type Modus = 'funksjon' | 'arketyper';

function Etikett({
    x,
    y,
    tittel,
    tekst,
    farge,
    synlig,
}: {
    x: number;
    y: number;
    tittel: string;
    tekst?: string;
    farge: string;
    synlig: boolean;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.5 }}
        >
            <text
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={52}
                fontWeight={800}
                fill={farge}
                className="font-display"
            >
                {tittel}
            </text>
            {tekst && (
                <text x={x} y={y + 46} textAnchor="middle" fontSize={36} fill="#334155">
                    {tekst}
                </text>
            )}
        </motion.g>
    );
}

function Funksjon({ beat }: { beat: number }) {
    const papir = beat < 1;
    const overskrift = [
        'Hvorfor er han med?',
        'Protagonisten',
        'Protagonist mot antagonist',
        'Elias ser det ingen andre ser',
    ][Math.min(beat, 3)];
    return (
        <>
            <Overskrift tekst={overskrift} />
            {/* Lyskjegla fra Elias sitt blikk */}
            <motion.path
                d="M 560 470 L 1040 330 L 1040 610 Z"
                fill="#fde68a"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 0.7 : 0 }}
                transition={{ duration: 0.8 }}
            />
            <motion.circle
                cx={1040}
                cy={470}
                r={36}
                fill="#f59e0b"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0, scale: beat >= 3 ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.4 }}
            />
            <motion.text
                x={1040}
                y={485}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#fff"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 3 ? 1 : 0 }}
                transition={{ delay: 0.6 }}
            >
                ?
            </motion.text>

            {/* Elias til venstre */}
            <Person x={480} y={700} r={95} farge="#2563eb" papir={papir} />
            <motion.text
                x={480}
                y={415}
                textAnchor="middle"
                fontSize={90}
                fontWeight={900}
                fill="#94a3b8"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 0 ? 1 : 0 }}
            >
                ?
            </motion.text>
            <Etikett
                x={480}
                y={770}
                tittel="Elias"
                tekst="protagonisten: hovedpersonen"
                farge="#1d4ed8"
                synlig={beat >= 1}
            />

            {/* Antagonisten til høyre */}
            <Person x={1180} y={700} r={95} farge="#475569" synlig={beat === 2} />
            <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: beat === 2 ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                <path d="M 640 520 L 760 520" stroke="#1d4ed8" strokeWidth={14} />
                <path d="M 760 490 L 810 520 L 760 550 Z" fill="#1d4ed8" />
                <path d="M 1020 520 L 900 520" stroke="#475569" strokeWidth={14} />
                <path d="M 900 490 L 850 520 L 900 550 Z" fill="#475569" />
            </motion.g>
            <Etikett
                x={1180}
                y={770}
                tittel="Antagonisten"
                tekst="kjemper imot"
                farge="#334155"
                synlig={beat === 2}
            />
        </>
    );
}

const ROLLER = [
    {
        navn: 'Skyggen',
        tekst: 'det helten frykter',
        eks: 'en bølle',
        x: 330,
        y: 470,
        farge: '#475569',
        fra: 2,
    },
    {
        navn: 'Hjelperen',
        tekst: 'dytter i riktig retning',
        eks: 'Sara',
        x: 1270,
        y: 470,
        farge: '#d97706',
        fra: 3,
    },
    {
        navn: 'Mentoren',
        tekst: 'gir kunnskap',
        eks: 'en bestefar',
        x: 800,
        y: 850,
        farge: '#0d9488',
        fra: 3,
    },
];

function Arketyper({ beat }: { beat: number }) {
    const overskrift = beat >= 4 ? 'Arketyper: roller som går igjen' : 'Roller som går igjen';
    return (
        <>
            <Overskrift tekst={overskrift} />
            {/* Linjer fra helten til hver rolle */}
            {ROLLER.map((r) => (
                <motion.line
                    key={r.navn}
                    x1={800}
                    y1={370}
                    x2={r.x}
                    y2={r.y - 60}
                    stroke="#cbd5e1"
                    strokeWidth={6}
                    strokeDasharray="14 10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= r.fra ? 1 : 0.35 }}
                />
            ))}
            {/* Helten i midten */}
            <motion.circle
                cx={800}
                cy={370}
                r={130}
                fill={beat >= 1 ? '#dbeafe' : '#f1f5f9'}
                stroke={beat >= 1 ? '#2563eb' : '#cbd5e1'}
                strokeWidth={6}
                animate={{ scale: beat === 1 ? 1.06 : 1 }}
                style={{ transformOrigin: '800px 370px' }}
            />
            <Person x={800} y={440} r={52} farge="#b91c1c" synlig={beat >= 1} />
            <Etikett
                x={800}
                y={560}
                tittel="Helten"
                tekst="må forandre seg: Elias"
                farge="#1d4ed8"
                synlig={beat >= 1}
            />
            {ROLLER.map((r) => {
                const på = beat >= r.fra;
                return (
                    <g key={r.navn}>
                        <circle
                            cx={r.x}
                            cy={r.y - 90}
                            r={95}
                            fill={på ? '#ffffff' : '#f1f5f9'}
                            stroke={på ? r.farge : '#cbd5e1'}
                            strokeWidth={6}
                        />
                        <Person x={r.x} y={r.y - 40} r={40} farge={r.farge} synlig={på} />
                        <Etikett
                            x={r.navn === 'Mentoren' ? r.x + 330 : r.x}
                            y={r.navn === 'Mentoren' ? r.y - 110 : r.y + 55}
                            tittel={r.navn}
                            tekst={`${r.tekst}: ${r.eks}`}
                            farge={r.farge}
                            synlig={på}
                        />
                    </g>
                );
            })}
            <motion.text
                x={800}
                y={170}
                textAnchor="middle"
                fontSize={32}
                fill="#475569"
                initial={{ opacity: 0 }}
                animate={{ opacity: beat >= 4 ? 1 : 0 }}
            >
                Carl Gustav Jung: felles for alle mennesker
            </motion.text>
        </>
    );
}

export function KarakterRoller({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'funksjon';
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-orange-100">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                {modus === 'funksjon' ? <Funksjon beat={beat} /> : <Arketyper beat={beat} />}
            </svg>
        </div>
    );
}
