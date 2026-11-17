import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Hake, Kryss, Overskrift, Vis } from './felles';

/**
 * Avtalen i 2D (1600x900).
 * «avtale»: et ark partene fyller ut selv, et eksempel, og hvem som skriver under.
 * «etter»: to uker til å angre, så to veier: avtalen blir fulgt, eller ikke.
 */

type Modus = 'avtale' | 'etter';

/** Arket. (x, y) er øvre venstre hjørne. */
function Ark({ x, y, b, h, children }: { x: number; y: number; b: number; h: number; children?: ReactNode }) {
    return (
        <g>
            <rect x={x + 10} y={y + 12} width={b} height={h} rx={14} fill="#cbd5e1" />
            <rect x={x} y={y} width={b} height={h} rx={14} fill="#ffffff" stroke="#94a3b8" strokeWidth={4} />
            <text x={x + b / 2} y={y + 70} textAnchor="middle" fontSize={50} fontWeight={900} fill={FARGE.tekst}>
                Avtale
            </text>
            <line x1={x + 40} y1={y + 95} x2={x + b - 40} y2={y + 95} stroke="#e2e8f0" strokeWidth={4} />
            {children}
        </g>
    );
}

/** En signaturlinje med navn under og en signatur som tegnes opp. */
function Signatur({ x, y, navn, farge, tegnet }: { x: number; y: number; navn: string; farge: string; tegnet: boolean }) {
    return (
        <g>
            <line x1={x} y1={y} x2={x + 300} y2={y} stroke="#334155" strokeWidth={3} />
            {tegnet && (
                <motion.path
                    d={`M ${x + 20} ${y - 10} q 30 -50 50 -10 t 50 -5 q 20 -40 40 0 t 60 -10`}
                    fill="none"
                    stroke={farge}
                    strokeWidth={5}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                />
            )}
            <text x={x} y={y + 36} fontSize={26} fontWeight={700} fill="#475569">
                {navn}
            </text>
        </g>
    );
}

function Avtalen({ beat }: { beat: number }) {
    const dempet = beat === 2;
    const valg = ['Betale for noe som ble ødelagt', 'Si unnskyld', 'Gjøre en jobb'];
    return (
        <g>
            <Overskrift tekst={['Partene bestemmer selv', 'Hva kan stå i avtalen?', 'Et eksempel', 'Hvem skriver under?'][Math.min(beat, 3)]} />
            <motion.g initial={false} animate={{ opacity: dempet ? 0 : 1, x: dempet ? -260 : 0 }} transition={{ duration: 0.8 }}>
                <Ark x={420} y={140} b={760} h={720}>
                    {beat === 0 && (
                        <g>
                            {[0, 1, 2].map((i) => (
                                <rect key={i} x={480} y={330 + i * 70} width={640} height={20} rx={10} fill="#f1f5f9" />
                            ))}
                            <text x={800} y={290} textAnchor="middle" fontSize={32} fontWeight={700} fill="#0d9488">
                                Partene skriver innholdet selv
                            </text>
                            <rect x={530} y={540} width={540} height={70} rx={35} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={3} />
                            <text x={800} y={586} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                                Ingen avtale er også lov
                            </text>
                        </g>
                    )}
                    {beat >= 1 &&
                        valg.map((v, i) => (
                            <Vis key={v} nar forsinkelse={beat === 1 ? i * 0.5 : 0}>
                                <rect x={480} y={150 + 100 + i * 90} width={44} height={44} rx={8} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                                <text x={545} y={150 + 135 + i * 90} fontSize={36} fontWeight={700} fill={FARGE.tekst}>
                                    {v}
                                </text>
                            </Vis>
                        ))}
                    {beat >= 3 && (
                        <g>
                            <Signatur x={470} y={640} navn="Den som gjorde det" farge={FARGE.mathias} tegnet />
                            <Signatur x={830} y={640} navn="Den som ble rammet" farge={FARGE.randi} tegnet />
                            <Signatur x={830} y={770} navn="Foreldre/verge, under 18" farge="#475569" tegnet />
                            <Signatur x={470} y={770} navn="Mekleren godkjenner" farge={FARGE.mekler} tegnet />
                        </g>
                    )}
                </Ark>
            </motion.g>
            {beat === 3 && (
                <g>
                    <rect x={1210} y={720} width={340} height={110} rx={20} fill="#fef3c7" stroke="#b45309" strokeWidth={4} />
                    <text x={1380} y={765} textAnchor="middle" fontSize={28} fontWeight={800} fill="#92400e">
                        Når du er
                    </text>
                    <text x={1380} y={805} textAnchor="middle" fontSize={28} fontWeight={800} fill="#92400e">
                        under 18 år
                    </text>
                    <line x1={1210} y1={775} x2={1140} y2={775} stroke="#b45309" strokeWidth={4} />
                </g>
            )}
            {beat === 2 && (
                <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4 }}>
                    <rect x={720} y={170} width={820} height={660} rx={28} fill="#ffffff" stroke="#0d9488" strokeWidth={5} />
                    <text x={1130} y={240} textAnchor="middle" fontSize={32} fontWeight={700} fill="#475569">
                        Eksempel fra ung.no
                    </text>
                    {/* Butikken */}
                    <g>
                        <rect x={790} y={320} width={200} height={140} fill="#e2e8f0" stroke="#475569" strokeWidth={4} />
                        <rect x={780} y={290} width={220} height={40} fill="#0d9488" />
                        <rect x={860} y={390} width={50} height={70} fill="#475569" />
                        <text x={890} y={510} textAnchor="middle" fontSize={30} fontWeight={800} fill={FARGE.tekst}>
                            Stjal fra butikken
                        </text>
                    </g>
                    <path d="M 1030 390 L 1150 390" stroke="#0f172a" strokeWidth={6} />
                    <path d="M 1150 370 L 1185 390 L 1150 410 Z" fill="#0f172a" />
                    {/* Moppen og klokka */}
                    <g>
                        <rect x={1265} y={290} width={12} height={160} fill="#a16207" />
                        <rect x={1230} y={445} width={82} height={26} rx={6} fill="#0ea5e9" />
                        <circle cx={1400} cy={360} r={56} fill="#ffffff" stroke="#334155" strokeWidth={6} />
                        <line x1={1400} y1={360} x2={1400} y2={322} stroke="#334155" strokeWidth={6} strokeLinecap="round" />
                        <line x1={1400} y1={360} x2={1432} y2={378} stroke="#334155" strokeWidth={6} strokeLinecap="round" />
                        <text x={1330} y={510} textAnchor="middle" fontSize={30} fontWeight={800} fill={FARGE.tekst}>
                            Vasker lageret
                        </text>
                    </g>
                    <text x={1130} y={640} textAnchor="middle" fontSize={44} fontWeight={900} fill="#0f766e">
                        tre timer en lørdag
                    </text>
                    <text x={1130} y={710} textAnchor="middle" fontSize={30} fontWeight={700} fill="#475569">
                        Begge parter ble enige om det
                    </text>
                </motion.g>
            )}
        </g>
    );
}

function Etter({ beat }: { beat: number }) {
    return (
        <g>
            <Overskrift tekst={['I straffesaker: to uker til å angre', 'Avtalen blir fulgt', 'Avtalen blir ikke fulgt'][Math.min(beat, 2)]} />
            {/* Arket til venstre */}
            <rect x={110} y={330} width={220} height={290} rx={12} fill="#ffffff" stroke="#94a3b8" strokeWidth={4} />
            <text x={220} y={390} textAnchor="middle" fontSize={36} fontWeight={900} fill={FARGE.tekst}>
                Avtale
            </text>
            {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={140} y={420 + i * 40} width={160} height={14} rx={7} fill="#e2e8f0" />
            ))}
            {/* To uker: en kalender */}
            <line x1={330} y1={475} x2={440} y2={475} stroke="#334155" strokeWidth={6} />
            <g>
                <rect x={440} y={330} width={380} height={290} rx={18} fill="#ffffff" stroke="#b45309" strokeWidth={5} />
                <rect x={440} y={330} width={380} height={60} rx={18} fill="#b45309" />
                <text x={630} y={372} textAnchor="middle" fontSize={32} fontWeight={800} fill="#ffffff">
                    Straffesaker: to uker
                </text>
                {Array.from({ length: 14 }, (_, i) => (
                    <motion.rect
                        key={i}
                        x={465 + (i % 7) * 48}
                        y={415 + Math.floor(i / 7) * 60}
                        width={38}
                        height={44}
                        rx={6}
                        fill="#fde68a"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                    />
                ))}
                <text x={630} y={590} textAnchor="middle" fontSize={28} fontWeight={700} fill="#92400e">
                    partene kan angre
                </text>
            </g>
            {/* Veiene videre */}
            <Vis nar={beat >= 1}>
                <path d="M 820 430 C 900 430 900 260 980 260" stroke={FARGE.gronn} strokeWidth={8} fill="none" />
                <rect x={980} y={180} width={540} height={160} rx={22} fill="#ffffff" stroke={FARGE.gronn} strokeWidth={5} />
                <Hake x={1050} y={260} />
                <text x={1100} y={245} fontSize={34} fontWeight={800} fill={FARGE.tekst}>
                    Avtalen blir fulgt
                </text>
                <text x={1100} y={295} fontSize={34} fontWeight={800} fill="#15803d">
                    Saken er avgjort
                </text>
            </Vis>
            <Vis nar={beat >= 2}>
                <path d="M 820 520 C 900 520 900 690 980 690" stroke={FARGE.rod} strokeWidth={8} fill="none" />
                <rect x={980} y={590} width={540} height={210} rx={22} fill="#ffffff" stroke={FARGE.rod} strokeWidth={5} />
                <Kryss x={1050} y={650} />
                <text x={1100} y={662} fontSize={34} fontWeight={800} fill={FARGE.tekst}>
                    Ikke fulgt
                </text>
                <text x={1010} y={725} fontSize={30} fontWeight={700} fill="#334155">
                    Politiet kan ta opp saken igjen
                </text>
                <text x={1010} y={770} fontSize={30} fontWeight={700} fill="#334155">
                    og vurdere en annen straff
                </text>
            </Vis>
        </g>
    );
}

export function KonfliktradetAvtale({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'avtale';
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                {modus === 'avtale' ? <Avtalen beat={beat} /> : <Etter beat={beat} />}
            </svg>
        </div>
    );
}
