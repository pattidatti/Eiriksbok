import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Vinnere og tapere når prisene stiger. To moduser:
 * - sparer: 100 000 kroner på konto, 5 % inflasjon. Tallet på kontoen står, men det du får
 *   kjøpt krymper til 95 000. Så realrenten: renten i banken minus prisstigningen.
 * - laaner: et boliglån på 3 millioner står stille mens lønna stiger (skisse uten tall), og
 *   lånet blir en mindre del av inntekten. Til slutt bedriften som ikke vet hva ting vil koste.
 */

type Modus = 'sparer' | 'laaner';

const OVERSKRIFT: Record<Modus, string[]> = {
    sparer: [
        'Inflasjon rammer ikke alle likt',
        'Sparekonto: 100 000 kroner',
        'Samme tall, mindre å kjøpe for',
        'Negativ realrente',
    ],
    laaner: [
        'Boliglån: 3 millioner kroner',
        'Lønna stiger med prisene, lånet gjør ikke det',
        'Inflasjonen spiser opp gjelden',
        'Bedriften: hva vil ting koste?',
    ],
};

function Kontokort({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x={0} y={0} width={520} height={300} rx={28} fill="#1e3a8a" />
            <rect x={40} y={60} width={80} height={60} rx={10} fill="#fbbf24" />
            <text x={40} y={190} fontSize={34} fontWeight={600} fill="#bfdbfe">
                Saldo
            </text>
            <text x={40} y={255} fontSize={68} fontWeight={800} fill="#ffffff">
                100 000 kr
            </text>
        </g>
    );
}

function Hus({ x, y, skala = 1 }: { x: number; y: number; skala?: number }) {
    return (
        <g transform={`translate(${x} ${y}) scale(${skala})`}>
            <rect
                x={-110}
                y={-150}
                width={220}
                height={150}
                fill="#fef3c7"
                stroke="#92400e"
                strokeWidth={5}
            />
            <polygon points="-135,-150 0,-250 135,-150" fill="#9a3412" />
            <rect x={-30} y={-80} width={60} height={80} fill="#92400e" />
        </g>
    );
}

function Sparer({ beat }: { beat: number }) {
    if (beat === 0) {
        return (
            <g>
                <motion.g initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                    <g transform="translate(250 330) scale(0.85)">
                        <Kontokort x={0} y={0} />
                    </g>
                    <text
                        x={471}
                        y={680}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={800}
                        fill="#b91c1c"
                    >
                        Noen taper
                    </text>
                </motion.g>
                <motion.g
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Hus x={1130} y={580} />
                    <text
                        x={1130}
                        y={680}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={800}
                        fill="#15803d"
                    >
                        Noen vinner
                    </text>
                </motion.g>
            </g>
        );
    }
    if (beat <= 2) {
        const bredde = beat === 2 ? 950 : 1000;
        return (
            <g>
                <Kontokort x={150} y={180} />
                <motion.g
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ transformOrigin: '1150px 330px' }}
                >
                    <rect x={900} y={250} width={500} height={150} rx={24} fill="#dc2626" />
                    <text
                        x={1150}
                        y={320}
                        textAnchor="middle"
                        fontSize={40}
                        fontWeight={700}
                        fill="#fecaca"
                    >
                        Inflasjon
                    </text>
                    <text
                        x={1150}
                        y={378}
                        textAnchor="middle"
                        fontSize={56}
                        fontWeight={800}
                        fill="#ffffff"
                    >
                        5 % på ett år
                    </text>
                </motion.g>
                <text x={150} y={590} fontSize={40} fontWeight={800} fill="#0f172a">
                    Det du får kjøpt for pengene:
                </text>
                <rect x={150} y={620} width={1000} height={110} rx={14} fill="#e2e8f0" />
                <motion.rect
                    x={150}
                    y={620}
                    height={110}
                    rx={14}
                    fill={beat === 2 ? '#f59e0b' : '#16a34a'}
                    initial={false}
                    animate={{ width: bredde }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                />
                <text
                    x={beat === 2 ? 1170 : 1170}
                    y={695}
                    fontSize={50}
                    fontWeight={800}
                    fill={beat === 2 ? '#b45309' : '#15803d'}
                >
                    {beat === 2 ? '95 000 kr' : '100 000 kr'}
                </text>
                {beat === 2 && (
                    <motion.text
                        x={150}
                        y={800}
                        fontSize={38}
                        fontWeight={700}
                        fill="#b91c1c"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                    >
                        Etter ett år: like mye på kontoen, mindre å kjøpe for
                    </motion.text>
                )}
            </g>
        );
    }
    // Beat 3: realrenten.
    return (
        <g>
            <text x={800} y={230} textAnchor="middle" fontSize={40} fontWeight={700} fill="#475569">
                Realrente = renten minus prisstigningen
            </text>
            <text x={170} y={360} fontSize={40} fontWeight={800} fill="#0f172a">
                Renten i banken
            </text>
            <motion.rect
                x={620}
                y={315}
                height={70}
                rx={10}
                fill="#16a34a"
                initial={{ width: 0 }}
                animate={{ width: 360 }}
                transition={{ duration: 1 }}
            />
            <text x={170} y={480} fontSize={40} fontWeight={800} fill="#0f172a">
                Prisstigningen
            </text>
            <motion.rect
                x={620}
                y={435}
                height={70}
                rx={10}
                fill="#dc2626"
                initial={{ width: 0 }}
                animate={{ width: 620 }}
                transition={{ duration: 1, delay: 0.6 }}
            />
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                <line x1={620} y1={290} x2={620} y2={660} stroke="#0f172a" strokeWidth={6} />
                <text
                    x={620}
                    y={280}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    0
                </text>
                <rect x={360} y={555} width={260} height={70} rx={10} fill="#dc2626" />
                <text x={660} y={605} fontSize={40} fontWeight={800} fill="#b91c1c">
                    Realrenten: under null
                </text>
                <text
                    x={800}
                    y={760}
                    textAnchor="middle"
                    fontSize={42}
                    fontWeight={800}
                    fill="#7f1d1d"
                >
                    Du betaler i praksis for å ha penger i banken
                </text>
                <text
                    x={800}
                    y={830}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={600}
                    fill="#64748b"
                >
                    Eksempel uten tall
                </text>
            </motion.g>
        </g>
    );
}

/** Tre år etter hverandre. Lønna vokser, lånet står. Skisse, ikke ekte tall. */
const AAR = [
    { navn: 'Nå', lonn: 70 },
    { navn: 'Senere', lonn: 100 },
    { navn: 'Enda senere', lonn: 130 },
];

function Laaner({ beat }: { beat: number }) {
    if (beat === 3) {
        return (
            <g>
                <rect
                    x={170}
                    y={330}
                    width={520}
                    height={340}
                    fill="#cbd5e1"
                    stroke="#334155"
                    strokeWidth={5}
                />
                <polygon
                    points="170,330 290,240 290,330 410,240 410,330 530,240 530,330 690,330"
                    fill="#94a3b8"
                    stroke="#334155"
                    strokeWidth={5}
                />
                <rect x={600} y={150} width={60} height={180} fill="#64748b" />
                <text
                    x={430}
                    y={730}
                    textAnchor="middle"
                    fontSize={40}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    Bedriften
                </text>
                {[
                    { t: 'Råvarer neste år: ? kr', y: 320 },
                    { t: 'Prisen vi bør ta: ? kr', y: 460 },
                    { t: 'Ansette nå, eller vente?', y: 600 },
                ].map((k, i) => (
                    <motion.g
                        key={k.t}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.6 }}
                    >
                        <rect
                            x={800}
                            y={k.y - 62}
                            width={640}
                            height={92}
                            rx={18}
                            fill="#ffffff"
                            stroke="#f59e0b"
                            strokeWidth={5}
                        />
                        <text
                            x={1120}
                            y={k.y}
                            textAnchor="middle"
                            fontSize={42}
                            fontWeight={800}
                            fill="#92400e"
                        >
                            {k.t}
                        </text>
                    </motion.g>
                ))}
            </g>
        );
    }
    const synligeAar = beat === 0 ? 1 : 3;
    return (
        <g>
            <Hus x={260} y={520} skala={0.9} />
            <text x={260} y={590} textAnchor="middle" fontSize={36} fontWeight={800} fill="#0f172a">
                Boliglånet
            </text>
            {AAR.slice(0, synligeAar).map((a, i) => {
                const x = 560 + i * 330;
                return (
                    <motion.g
                        key={a.navn}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.5 }}
                    >
                        {/* Lånet: samme høyde hvert år */}
                        <rect x={x} y={720 - 300} width={110} height={300} rx={8} fill="#7c3aed" />
                        {/* Lønna: vokser */}
                        <rect
                            x={x + 130}
                            y={720 - a.lonn}
                            width={110}
                            height={a.lonn}
                            rx={8}
                            fill="#16a34a"
                        />
                        <text
                            x={x + 120}
                            y={780}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#0f172a"
                        >
                            {a.navn}
                        </text>
                    </motion.g>
                );
            })}
            <line x1={530} y1={720} x2={1540} y2={720} stroke="#334155" strokeWidth={5} />
            <g>
                <rect x={560} y={210} width={40} height={40} rx={6} fill="#7c3aed" />
                <text x={615} y={243} fontSize={36} fontWeight={800} fill="#0f172a">
                    Lånet
                </text>
                <rect x={780} y={210} width={40} height={40} rx={6} fill="#16a34a" />
                <text x={835} y={243} fontSize={36} fontWeight={800} fill="#0f172a">
                    Lønna
                </text>
                {beat >= 1 && (
                    <text
                        x={1530}
                        y={243}
                        textAnchor="end"
                        fontSize={30}
                        fontWeight={600}
                        fill="#64748b"
                    >
                        Skisse uten tall
                    </text>
                )}
            </g>
            {beat === 0 && (
                <motion.text
                    x={615}
                    y={400}
                    textAnchor="middle"
                    fontSize={48}
                    fontWeight={800}
                    fill="#6d28d9"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    3 millioner kr
                </motion.text>
            )}
            {beat >= 2 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <rect x={560} y={845 - 50} width={980} height={70} rx={16} fill="#15803d" />
                    <text
                        x={1050}
                        y={845}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={800}
                        fill="#ffffff"
                    >
                        Lånet blir en mindre del av inntekten
                    </text>
                </motion.g>
            )}
        </g>
    );
}

export function InflasjonKonto({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'sparer';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-emerald-50">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <AnimatePresence mode="wait">
                    <motion.text
                        key={tekst}
                        x={800}
                        y={110}
                        textAnchor="middle"
                        fontSize={60}
                        fontWeight={800}
                        fill="#0f172a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {tekst}
                    </motion.text>
                </AnimatePresence>
                {modus === 'sparer' ? <Sparer beat={beat} /> : <Laaner beat={beat} />}
            </svg>
        </div>
    );
}
