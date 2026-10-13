import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Gammel og ny kolonimakt side om side, med målet som står stille i midten.
 * «gammel»: ordet deles i «ny» og «kolonialisme», så den gamle måten (guvernør, soldater,
 *   flagg) og den nye (penger, lån, handel, selskaper).
 * «bytte»: målet i midten lyser, så byttes soldater mot lån og flagg mot merkevarer.
 */

type Modus = 'gammel' | 'bytte';

const B = 1600;
const H = 900;
const GAMMEL = '#9a3412';
const NY = '#1d4ed8';
const MAL = '#ca8a04';

export function NykolonialismeSkifte({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'gammel';
    const ordet = modus === 'gammel' && beat === 0;
    const visGammel = modus === 'bytte' || beat >= 1;
    const visNy = modus === 'bytte' || beat >= 2;
    const malet = modus === 'bytte';
    const bytteRad = modus === 'bytte' ? beat - 1 : -1;

    return (
        <div className="absolute inset-0 overflow-hidden bg-[#f6f1e7]">
            <svg
                viewBox={`0 0 ${B} ${H}`}
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                <AnimatePresence>
                    {ordet && (
                        <motion.g
                            key="ordet"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.text
                                x={480}
                                y={430}
                                textAnchor="end"
                                fontSize={120}
                                fontWeight={900}
                                fill={NY}
                                transition={{ delay: 0.8, duration: 0.8 }}
                            >
                                NY
                            </motion.text>
                            <motion.text
                                x={530}
                                y={430}
                                textAnchor="start"
                                fontSize={120}
                                fontWeight={900}
                                fill={GAMMEL}
                                transition={{ delay: 0.8, duration: 0.8 }}
                            >
                                kolonialisme
                            </motion.text>
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.8 }}
                            >
                                <text
                                    x={380}
                                    y={540}
                                    textAnchor="middle"
                                    fontSize={50}
                                    fontWeight={800}
                                    fill={NY}
                                >
                                    moderne utgave
                                </text>
                                <text
                                    x={930}
                                    y={540}
                                    textAnchor="middle"
                                    fontSize={50}
                                    fontWeight={800}
                                    fill={GAMMEL}
                                >
                                    av noe gammelt
                                </text>
                            </motion.g>
                        </motion.g>
                    )}
                </AnimatePresence>

                {!ordet && (
                    <>
                        {/* Tidslinja øverst: fra 1900 til i dag */}
                        <line
                            x1={200}
                            y1={90}
                            x2={1400}
                            y2={90}
                            stroke="#cbd5e1"
                            strokeWidth={10}
                            strokeLinecap="round"
                        />
                        <text
                            x={200}
                            y={60}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={GAMMEL}
                        >
                            1900
                        </text>
                        <text
                            x={1400}
                            y={60}
                            textAnchor="middle"
                            fontSize={40}
                            fontWeight={900}
                            fill={NY}
                        >
                            I dag
                        </text>
                        <motion.circle
                            cy={90}
                            r={24}
                            fill="#0f172a"
                            stroke="#fff"
                            strokeWidth={6}
                            initial={false}
                            animate={{
                                cx: malet ? [200, 1400, 200] : visNy ? 1400 : 200,
                            }}
                            transition={
                                malet
                                    ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
                                    : { duration: 1.4, ease: 'easeInOut' }
                            }
                        />
                    </>
                )}

                {visGammel && !ordet && (
                    <Panel
                        x={60}
                        farge={GAMMEL}
                        tittel="Gammel kolonimakt"
                        undertittel="Styrer direkte"
                    >
                        <Rad
                            y={250}
                            vis
                            tekst="Guvernør"
                            forsinkelse={0.3}
                            krysset={modus === 'gammel' && beat >= 3}
                        >
                            <Guvernor />
                        </Rad>
                        <Rad
                            y={400}
                            vis
                            tekst="Soldater"
                            forsinkelse={0.7}
                            krysset={(modus === 'gammel' && beat >= 3) || bytteRad >= 1}
                        >
                            <Soldater />
                        </Rad>
                        <Rad y={550} vis tekst="Flagg" forsinkelse={1.1} krysset={bytteRad >= 2}>
                            <Flagg />
                        </Rad>
                    </Panel>
                )}

                {visNy && (
                    <Panel x={1040} farge={NY} tittel="Ny kolonimakt" undertittel="Skjult kontroll">
                        <Rad y={250} vis tekst="Handel" forsinkelse={0.3}>
                            <Mynter />
                        </Rad>
                        <Rad y={400} vis tekst="Lån" forsinkelse={0.7} lys={bytteRad === 1}>
                            <Pengesekk />
                        </Rad>
                        <Rad y={550} vis tekst="Merkevarer" forsinkelse={1.1} lys={bytteRad === 2}>
                            <Merker />
                        </Rad>
                    </Panel>
                )}

                {/* Piler som bytter det gamle ut med det nye */}
                {bytteRad >= 1 && <Bytte y={440} />}
                {bytteRad >= 2 && <Bytte y={590} />}

                {/* Målet i midten står stille */}
                {malet && (
                    <motion.g
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring', stiffness: 160, damping: 14 }}
                        style={{ transformOrigin: '800px 260px' }}
                    >
                        <rect
                            x={620}
                            y={140}
                            width={360}
                            height={beat >= 1 ? 240 : 170}
                            rx={26}
                            fill={MAL}
                        />
                        <text
                            x={800}
                            y={205}
                            textAnchor="middle"
                            fontSize={48}
                            fontWeight={900}
                            fill="#fff"
                        >
                            MÅLET
                        </text>
                        <text
                            x={800}
                            y={262}
                            textAnchor="middle"
                            fontSize={34}
                            fontWeight={800}
                            fill="#fff"
                        >
                            står helt stille
                        </text>
                        {beat >= 1 && (
                            <motion.g
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <text
                                    x={800}
                                    y={320}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill="#422006"
                                >
                                    Kontroll over
                                </text>
                                <text
                                    x={800}
                                    y={360}
                                    textAnchor="middle"
                                    fontSize={34}
                                    fontWeight={900}
                                    fill="#422006"
                                >
                                    ressurser og rikdom
                                </text>
                            </motion.g>
                        )}
                    </motion.g>
                )}

                {modus === 'gammel' && beat >= 3 && (
                    <motion.g
                        initial={{ opacity: 0, scale: 1.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: 'spring', stiffness: 220, damping: 16 }}
                        style={{ transformOrigin: '800px 780px' }}
                    >
                        <g transform="rotate(-4 800 780)">
                            <rect
                                x={480}
                                y={735}
                                width={640}
                                height={90}
                                rx={14}
                                fill="#fff"
                                stroke={NY}
                                strokeWidth={8}
                            />
                            <text
                                x={800}
                                y={796}
                                textAnchor="middle"
                                fontSize={50}
                                fontWeight={900}
                                fill={NY}
                            >
                                Ingen åpen erobring
                            </text>
                        </g>
                    </motion.g>
                )}
                {modus === 'gammel' && beat === 1 && (
                    <motion.text
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        x={800}
                        y={800}
                        textAnchor="middle"
                        fontSize={46}
                        fontWeight={800}
                        fill={GAMMEL}
                    >
                        For eksempel Storbritannia og Frankrike
                    </motion.text>
                )}
            </svg>
        </div>
    );
}

function Panel({
    x,
    farge,
    tittel,
    undertittel,
    children,
}: {
    x: number;
    farge: string;
    tittel: string;
    undertittel: string;
    children: ReactNode;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <rect
                x={x}
                y={140}
                width={500}
                height={560}
                rx={28}
                fill="#fff"
                stroke={farge}
                strokeWidth={6}
            />
            <rect x={x} y={140} width={500} height={80} rx={28} fill={farge} />
            <rect x={x} y={190} width={500} height={30} fill={farge} />
            <text
                x={x + 250}
                y={195}
                textAnchor="middle"
                fontSize={40}
                fontWeight={900}
                fill="#fff"
            >
                {tittel}
            </text>
            <text
                x={x + 250}
                y={688}
                textAnchor="middle"
                fontSize={34}
                fontWeight={800}
                fill={farge}
            >
                {undertittel}
            </text>
            <g transform={`translate(${x} 0)`}>{children}</g>
        </motion.g>
    );
}

function Rad({
    y,
    tekst,
    forsinkelse,
    krysset,
    lys,
    children,
}: {
    y: number;
    vis: boolean;
    tekst: string;
    forsinkelse: number;
    krysset?: boolean;
    lys?: boolean;
    children: ReactNode;
}) {
    return (
        <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: krysset ? 0.45 : 1 }}
            transition={{ delay: krysset ? 0.2 : forsinkelse }}
        >
            {lys && <rect x={20} y={y - 10} width={460} height={115} rx={20} fill="#fde68a" />}
            <g transform={`translate(70 ${y})`}>{children}</g>
            <text x={190} y={y + 70} fontSize={36} fontWeight={900} fill="#0f172a">
                {tekst}
            </text>
            {krysset && (
                <motion.line
                    x1={40}
                    y1={y + 56}
                    x2={460}
                    y2={y + 56}
                    stroke="#dc2626"
                    strokeWidth={10}
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                />
            )}
        </motion.g>
    );
}

function Bytte({ y }: { y: number }) {
    return (
        <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <motion.path
                d={`M 580 ${y} L 1010 ${y}`}
                stroke="#0f172a"
                strokeWidth={10}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 0.9 }}
            />
            <path d={`M 990 ${y - 22} L 1030 ${y} L 990 ${y + 22} Z`} fill="#0f172a" />
            <text
                x={795}
                y={y - 22}
                textAnchor="middle"
                fontSize={34}
                fontWeight={900}
                fill="#0f172a"
            >
                byttet ut med
            </text>
        </motion.g>
    );
}

/* ---------- Små ikoner, tegnet rundt (0,0) til (110,110) ---------- */

function Guvernor() {
    return (
        <g>
            <ellipse
                cx={55}
                cy={22}
                rx={44}
                ry={12}
                fill="#f5f5f4"
                stroke="#57534e"
                strokeWidth={4}
            />
            <path d="M 25 22 Q 55 -14 85 22 Z" fill="#f5f5f4" stroke="#57534e" strokeWidth={4} />
            <circle cx={55} cy={42} r={18} fill="#d6a77a" />
            <rect x={28} y={62} width={54} height={50} rx={10} fill={GAMMEL} />
        </g>
    );
}

function Soldater() {
    return (
        <g>
            {[0, 36, 72].map((x) => (
                <g key={x} transform={`translate(${x} 10)`}>
                    <rect x={6} y={0} width={24} height={14} rx={4} fill="#3f6212" />
                    <circle cx={18} cy={22} r={10} fill="#d6a77a" />
                    <rect x={6} y={34} width={24} height={60} rx={6} fill="#4d7c0f" />
                </g>
            ))}
        </g>
    );
}

function Flagg() {
    return (
        <g>
            <rect x={20} y={0} width={8} height={112} fill="#57534e" />
            <rect x={28} y={4} width={76} height={48} fill="#64748b" />
            <rect x={28} y={20} width={76} height={14} fill="#f8fafc" />
        </g>
    );
}

function Mynter() {
    return (
        <g>
            {[0, 1, 2, 3].map((i) => (
                <ellipse
                    key={i}
                    cx={55}
                    cy={96 - i * 18}
                    rx={42}
                    ry={14}
                    fill="#facc15"
                    stroke="#a16207"
                    strokeWidth={4}
                />
            ))}
        </g>
    );
}

function Pengesekk() {
    return (
        <g>
            <path d="M 35 30 Q 10 70 22 100 Q 55 118 88 100 Q 100 70 75 30 Z" fill="#a16207" />
            <rect x={38} y={14} width={34} height={18} rx={6} fill="#854d0e" />
            <text x={55} y={88} textAnchor="middle" fontSize={34} fontWeight={900} fill="#fff">
                lån
            </text>
        </g>
    );
}

function Merker() {
    return (
        <g>
            {[
                ['#dc2626', 0, 0],
                ['#2563eb', 52, 20],
                ['#16a34a', 14, 58],
            ].map(([f, x, y]) => (
                <g key={f as string} transform={`translate(${x} ${y})`}>
                    <rect width={54} height={46} rx={10} fill={f as string} />
                    <circle cx={27} cy={23} r={11} fill="#fff" />
                </g>
            ))}
        </g>
    );
}
