import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TelleTall } from '../shared';
import type { VisualProps } from '../../types';

/**
 * Pensjonens historie på en tidslinje fra 1930 til 2030.
 * Beat 0: alderstrygden i 1936. Beat 1: folketrygden i 1966. Beat 2: eldrebølgen fra 2000-tallet.
 * Beat 3: tallet på alderspensjonister i 2025. Beat 4: reformen vedtas i 2009. Beat 5: nye regler i 2011.
 */

const MORK = '#0f172a';
const BLA = '#2563eb';
const ROD = '#e11d48';
const GRONN = '#059669';

const AAR_X = (aar: number) => 140 + ((aar - 1930) / 100) * 1320;
const Y = 660;

function Tekst({
    x,
    y,
    children,
    str = 36,
    farge = MORK,
    anker = 'start',
    vekt = 800,
}: {
    x: number;
    y: number;
    children: ReactNode;
    str?: number;
    farge?: string;
    anker?: 'start' | 'middle' | 'end';
    vekt?: number;
}) {
    return (
        <text x={x} y={y} fontSize={str} fontWeight={vekt} fill={farge} textAnchor={anker} fontFamily="Outfit, Inter, sans-serif">
            {children}
        </text>
    );
}

function Vis({ når, children }: { når: boolean; children: ReactNode }) {
    return (
        <AnimatePresence>
            {når && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    {children}
                </motion.g>
            )}
        </AnimatePresence>
    );
}

/** Et kort med årstall og tekst, koblet til tidslinja med en strek. */
function Hendelse({
    aar,
    x,
    y,
    b,
    tittel,
    tekst,
    farge,
    aktiv,
}: {
    aar: number;
    x: number;
    y: number;
    b: number;
    tittel: string;
    tekst: string;
    farge: string;
    aktiv: boolean;
}) {
    return (
        <g opacity={aktiv ? 1 : 0.55}>
            <line x1={AAR_X(aar)} x2={AAR_X(aar)} y1={Y} y2={y + 120} stroke={farge} strokeWidth={5} />
            <circle cx={AAR_X(aar)} cy={Y} r={16} fill={farge} />
            <rect x={x} y={y} width={b} height={120} rx={20} fill="#ffffff" stroke={farge} strokeWidth={aktiv ? 6 : 3} />
            <Tekst x={x + 26} y={y + 52} str={40} farge={farge}>
                {tittel}
            </Tekst>
            <Tekst x={x + 26} y={y + 98} str={30} vekt={600}>
                {tekst}
            </Tekst>
        </g>
    );
}

export function PensjonHistorie({ beat }: VisualProps) {
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                <Tekst x={800} y={100} str={58} vekt={900} anker="middle">
                    Pensjon i Norge
                </Tekst>
                {/* Eldrebølgen: en bølge som vokser fra 2000-tallet, uten tall */}
                <Vis når={beat >= 2}>
                    <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: beat === 2 ? 0.9 : 0.4 }}
                        transition={{ duration: 1.2 }}
                        d={`M ${AAR_X(2000)} ${Y} C ${AAR_X(2012)} ${Y - 20}, ${AAR_X(2020)} ${Y - 90}, ${AAR_X(2030)} ${Y - 170} L ${AAR_X(2030)} ${Y} Z`}
                        fill="#cbd5e1"
                        stroke="#64748b"
                        strokeWidth={4}
                    />
                </Vis>
                <Vis når={beat >= 2}>
                    <Tekst x={AAR_X(2030)} y={Y + 110} anker="end" str={32} farge="#475569" vekt={700}>
                        Grått felt: flere eldre (skisse)
                    </Tekst>
                </Vis>
                <Vis når={beat === 2}>
                    <rect x={AAR_X(2000) - 320} y={240} width={620} height={130} rx={20} fill="#ffffff" stroke="#64748b" strokeWidth={5} />
                    <Tekst x={AAR_X(2000) - 294} y={292} str={40} farge="#475569">
                        2000-tallet: flere eldre
                    </Tekst>
                    <Tekst x={AAR_X(2000) - 294} y={340} str={30} vekt={600}>
                        Folk lever lenger, og det blir flere eldre.
                    </Tekst>
                </Vis>
                {/* Tidslinja */}
                <line x1={AAR_X(1930)} x2={AAR_X(2030)} y1={Y} y2={Y} stroke="#475569" strokeWidth={8} strokeLinecap="round" />
                {[1930, 1950, 1970, 1990, 2010, 2030].map((a) => (
                    <g key={a}>
                        <line x1={AAR_X(a)} x2={AAR_X(a)} y1={Y - 10} y2={Y + 10} stroke="#475569" strokeWidth={4} />
                        <Tekst x={AAR_X(a)} y={Y + 56} str={32} farge="#475569" vekt={700} anker="middle">
                            {String(a)}
                        </Tekst>
                    </g>
                ))}
                <Vis når={beat >= 0 && beat <= 3}>
                    <Hendelse aar={1936} x={90} y={200} b={470} tittel="1936: Alderstrygd" tekst="bare for de fattigste" farge="#b45309" aktiv={beat === 0} />
                </Vis>
                <Vis når={beat >= 1 && beat <= 3}>
                    <Hendelse aar={1966} x={420} y={400} b={560} tittel="1966: Folketrygden" tekst="pensjon etter hvor mye du jobbet" farge={BLA} aktiv={beat === 1} />
                </Vis>
                <Vis når={beat === 3}>
                    <line x1={AAR_X(2025)} x2={AAR_X(2025)} y1={Y} y2={380} stroke={ROD} strokeWidth={5} />
                    <circle cx={AAR_X(2025)} cy={Y} r={16} fill={ROD} />
                    <rect x={1000} y={170} width={540} height={210} rx={24} fill="#ffffff" stroke={ROD} strokeWidth={6} />
                    <text x={1270} y={265} fontSize={76} fontWeight={900} fill={ROD} textAnchor="middle" fontFamily="Outfit, Inter, sans-serif">
                        <TelleTall verdi={1084600} varighet={1.6} />
                    </text>
                    <Tekst x={1270} y={330} str={30} vekt={700} anker="middle">
                        fikk alderspensjon, utgangen av 2025
                    </Tekst>
                </Vis>
                <Vis når={beat >= 4}>
                    <Hendelse aar={2009} x={700} y={190} b={560} tittel="2009: Reformen vedtas" tekst="Stortinget endrer reglene" farge={ROD} aktiv={beat === 4} />
                </Vis>
                <Vis når={beat >= 5}>
                    <Hendelse aar={2011} x={520} y={370} b={960} tittel="2011: Nye regler gjelder" tekst="Mål: sterkere statsøkonomi, mest ved at folk jobber lenger" farge={GRONN} aktiv />
                </Vis>
            </svg>
        </div>
    );
}
