import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Flate, Kort, Tekst, Vis } from './felles';

/**
 * To svar på spørsmålet ved døra. Til venstre utilitaristen, som måler hva handlingen fører
 * til. Til høyre Kant, som ser på regelen bak. Til slutt de to spørsmålene side om side.
 */

const V = 420;
const H = 1180;

export function PliktetikkToSvar({ beat }: VisualProps) {
    const kant = beat >= 2;
    return (
        <Flate bakgrunn="#f1f5f9">
            {/* Panelene */}
            <rect x={60} y={60} width={720} height={780} rx={36} fill="#ecfdf5" stroke="#a7f3d0" strokeWidth={4} />
            <motion.rect
                x={820}
                y={60}
                width={720}
                height={780}
                rx={36}
                fill="#eef2ff"
                stroke="#c7d2fe"
                strokeWidth={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: kant ? 1 : 0.25 }}
                transition={{ duration: 0.6 }}
            />

            <Tekst x={V} y={140} str={48} farge="#065f46">
                Utilitaristen
            </Tekst>
            <Figur x={V - 200} y={420} farge="#047857" skala={1.2} />
            <Kort x={V + 90} y={290} tekst="Svar: Lyv" str={44} farge="#047857" tekstFarge="#ffffff" kant="#047857" />
            <Tekst x={V + 90} y={385} str={32} farge="#065f46" vekt={700}>
                Løgnen redder liv
            </Tekst>

            {/* Lykke-måleren: løgn mot sannhet */}
            <Vis vis={beat >= 1}>
                <Tekst x={V} y={500} str={34} farge="#065f46">
                    Riktig = det som gir mest lykke
                </Tekst>
                <line x1={V - 260} y1={760} x2={V + 260} y2={760} stroke="#94a3b8" strokeWidth={4} />
                <motion.rect
                    x={V - 200}
                    width={150}
                    fill="#10b981"
                    rx={10}
                    initial={{ y: 760, height: 0 }}
                    animate={{ y: beat >= 1 ? 560 : 760, height: beat >= 1 ? 200 : 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                />
                <motion.rect
                    x={V + 50}
                    width={150}
                    fill="#94a3b8"
                    rx={10}
                    initial={{ y: 760, height: 0 }}
                    animate={{ y: beat >= 1 ? 720 : 760, height: beat >= 1 ? 40 : 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                />
                <Tekst x={V - 125} y={805} str={30} farge="#065f46">
                    løgnen
                </Tekst>
                <Tekst x={V + 125} y={805} str={30} farge="#475569">
                    sannheten
                </Tekst>
            </Vis>

            {/* Kant */}
            <Vis vis={kant && beat < 4}>
                <Tekst x={H} y={140} str={48} farge="#3730a3">
                    Immanuel Kant
                </Tekst>
                <Kort x={H} y={250} tekst="1797" str={44} farge="#3730a3" tekstFarge="#ffffff" kant="#3730a3" />
                <Tekst x={H} y={380} str={44} farge="#1e1b4b">
                    Det er alltid galt å lyve,
                </Tekst>
                <Tekst x={H} y={440} str={36} farge="#4338ca" vekt={700}>
                    uansett hvem som spør
                </Tekst>
            </Vis>
            <motion.g
                initial={{ opacity: 0, scale: 1.6 }}
                animate={{ opacity: beat === 3 ? 1 : 0, scale: beat === 3 ? 1 : 1.6 }}
                transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                style={{ transformOrigin: `${H}px 600px`, transformBox: 'view-box' }}
            >
                <rect x={H - 190} y={545} width={380} height={110} rx={18} fill="none" stroke="#b91c1c" strokeWidth={8} />
                <text x={H} y={622} textAnchor="middle" fontSize={68} fontWeight={900} fill="#b91c1c" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    PLIKT
                </text>
            </motion.g>
            <Tekst x={H} y={730} str={40} farge="#3730a3" vis={beat === 3}>
                Pliktetikk
            </Tekst>

            {/* De to spørsmålene */}
            <Vis vis={beat >= 4}>
                <rect x={0} y={0} width={1600} height={900} fill="#0f172a" opacity={0.88} />
                <Kort x={V} y={450} tekst="Hva fører det til?" str={46} farge="#ecfdf5" kant="#10b981" tekstFarge="#065f46" />
                <Kort x={H} y={450} tekst="Hvilken regel følger jeg?" str={46} farge="#eef2ff" kant="#6366f1" tekstFarge="#312e81" />
                <Tekst x={800} y={640} str={40} farge="#ffffff">
                    Også regelen bak handlingen teller
                </Tekst>
            </Vis>
        </Flate>
    );
}
