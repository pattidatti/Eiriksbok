import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Hvem styrte Northumbria på 900-tallet? En tidslinje fra hæren kom til kampen var over:
 * vikingstyre, Æthelstan i 927, vikingene tilbake i 939, og endelig slått i 954.
 * Etterpå: norrøne navn og skikker lever videre.
 */

const B = 1600;
const FRA = 860;
const TIL = 1000;
const VENSTRE = 120;
const BREDDE = 1360;
const x = (aar: number) => VENSTRE + ((aar - FRA) / (TIL - FRA)) * BREDDE;

const STOLPE_Y = 400;
const STOLPE_H = 100;
const AKSE_Y = 600;

const ROD = '#b91c1c';
const BLA = '#1d4ed8';

const BITER = [
    { fra: 867, til: 927, farge: ROD, fraBeat: 0 },
    { fra: 927, til: 939, farge: BLA, fraBeat: 1 },
    { fra: 939, til: 954, farge: ROD, fraBeat: 2 },
    { fra: 954, til: TIL, farge: BLA, fraBeat: 3 },
];

const AAR = [
    { aar: 865, fraBeat: 0 },
    { aar: 878, fraBeat: 0 },
    { aar: 927, fraBeat: 1 },
    { aar: 939, fraBeat: 2 },
    { aar: 954, fraBeat: 3 },
];

function Tekst({
    x: tx,
    y,
    tekst,
    farge = '#0f172a',
    storrelse = 34,
    anker = 'middle',
    synlig = true,
}: {
    x: number;
    y: number;
    tekst: string;
    farge?: string;
    storrelse?: number;
    anker?: 'start' | 'middle' | 'end';
    synlig?: boolean;
}) {
    return (
        <motion.text
            x={tx}
            y={y}
            textAnchor={anker}
            fontSize={storrelse}
            fontWeight={900}
            fill={farge}
            initial={{ opacity: 0 }}
            animate={{ opacity: synlig ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {tekst}
        </motion.text>
    );
}

export function DanelagenTidslinje({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0 bg-[#f6f1e4]">
            <svg
                viewBox={`0 0 ${B} 900`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <pattern
                        id="danelagen-skikker"
                        width="34"
                        height="34"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(45)"
                    >
                        <rect width="14" height="34" fill={ROD} opacity={0.55} />
                    </pattern>
                </defs>
                <Tekst x={B / 2} y={110} tekst="Hvem styrer Northumbria?" storrelse={56} />
                <Tekst
                    x={B / 2}
                    y={165}
                    tekst="engelske konger tar Danelagen tilbake på 900-tallet"
                    farge="#57534e"
                    storrelse={30}
                />

                {/* Forklaring */}
                <rect x={470} y={215} width={36} height={36} rx={6} fill={ROD} />
                <Tekst x={520} y={245} tekst="vikinger" anker="start" storrelse={30} />
                <rect x={850} y={215} width={36} height={36} rx={6} fill={BLA} />
                <Tekst x={900} y={245} tekst="engelske konger" anker="start" storrelse={30} />

                {/* Stolpen */}
                <rect
                    x={x(867)}
                    y={STOLPE_Y}
                    width={x(TIL) - x(867)}
                    height={STOLPE_H}
                    rx={10}
                    fill="#e7e5e4"
                />
                {BITER.map((b) => (
                    <motion.rect
                        key={b.fra}
                        x={x(b.fra)}
                        y={STOLPE_Y}
                        height={STOLPE_H}
                        fill={b.farge}
                        initial={{ width: 0 }}
                        animate={{ width: beat >= b.fraBeat ? x(b.til) - x(b.fra) : 0 }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                    />
                ))}
                <motion.rect
                    x={x(954)}
                    y={STOLPE_Y}
                    width={x(TIL) - x(954)}
                    height={STOLPE_H}
                    fill="url(#danelagen-skikker)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: beat >= 4 ? 1 : 0 }}
                    transition={{ duration: 0.8 }}
                />

                {/* Aksen */}
                <line
                    x1={VENSTRE - 20}
                    x2={VENSTRE + BREDDE + 20}
                    y1={AKSE_Y}
                    y2={AKSE_Y}
                    stroke="#44403c"
                    strokeWidth={5}
                />
                {AAR.map((a) => (
                    <g key={a.aar}>
                        <motion.line
                            x1={x(a.aar)}
                            x2={x(a.aar)}
                            y1={AKSE_Y - 14}
                            y2={AKSE_Y + 14}
                            stroke="#44403c"
                            strokeWidth={5}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: beat >= a.fraBeat ? 1 : 0 }}
                        />
                        <Tekst
                            x={x(a.aar)}
                            y={AKSE_Y + 56}
                            tekst={String(a.aar)}
                            storrelse={a.aar === 939 ? 30 : 32}
                            synlig={beat >= a.fraBeat}
                        />
                    </g>
                ))}
                <Tekst x={x(865)} y={AKSE_Y + 100} tekst="Hæren" farge="#57534e" storrelse={32} />
                <Tekst
                    x={x(878)}
                    y={AKSE_Y + 135}
                    tekst="Edington"
                    farge="#57534e"
                    storrelse={32}
                />

                {/* Hendelsene */}
                <Tekst
                    x={x(927) + 10}
                    y={STOLPE_Y - 24}
                    tekst="927: Æthelstan vinner"
                    farge={BLA}
                    anker="end"
                    synlig={beat >= 1}
                />
                <Tekst
                    x={x(939)}
                    y={STOLPE_Y + STOLPE_H + 50}
                    tekst="939: vikingene tilbake"
                    farge={ROD}
                    anker="start"
                    storrelse={30}
                    synlig={beat >= 2}
                />
                <Tekst
                    x={x(954) - 10}
                    y={STOLPE_Y - 24}
                    tekst="954: endelig slått"
                    farge={BLA}
                    anker="start"
                    synlig={beat >= 3}
                />
                <Tekst
                    x={x(TIL)}
                    y={AKSE_Y + 120}
                    tekst="men norrøne navn og skikker lever videre"
                    farge={ROD}
                    anker="end"
                    storrelse={34}
                    synlig={beat >= 4}
                />
            </svg>
        </div>
    );
}
