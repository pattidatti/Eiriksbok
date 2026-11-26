import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE, brytLinjer, kortBredde } from './felles';

/**
 * Hva folk i Norge mente om NATO, som én stolpe fra 0 til 100 prosent.
 *
 * Artikkelen gir bare ord («godt over halvparten», «nær to tredjedeler») og ett eksakt tall
 * (tolv prosent). Ordene tegnes derfor som en blå flate med uskarp ende forbi et merke
 * (halvparten, to tredjedeler), aldri som et presist tall. Bare de tolv prosentene er skarpe.
 *
 * - `1949`: motstand i partiene, så sommeren 1949: mindre fare (blå) og større fare (rød).
 * - `stotte`: støtten i flere tiår, splittelsen i 1961, skepsis til USA, og ikke ett fasitsvar.
 */

type Modus = '1949' | 'stotte';

const B = 1600;
const H = 900;
const X0 = 160;
const BREDDE = 1280;
const Y = 300;
const HOYDE = 110;

const px = (prosent: number) => X0 + (BREDDE * prosent) / 100;

function Merke({ prosent, tekst }: { prosent: number; tekst: string }) {
    const x = px(prosent);
    return (
        <g>
            <line x1={x} y1={Y - 24} x2={x} y2={Y + HOYDE + 24} stroke={FARGE.mork} strokeWidth={4} strokeDasharray="10 8" />
            <text x={x} y={Y + HOYDE + 64} textAnchor="middle" fontSize={30} fontWeight={800} fill={FARGE.mork}>
                {tekst}
            </text>
        </g>
    );
}

/** Blå flate fra 0 som blir uskarp mellom `fra` og `til` prosent. */
function UskarpFlate({ id, fra, til }: { id: string; fra: number; til: number }) {
    const slutt = px(til);
    const start = (px(fra) - X0) / (slutt - X0);
    return (
        <g>
            <defs>
                <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor={FARGE.nato} stopOpacity={1} />
                    <stop offset={start} stopColor={FARGE.nato} stopOpacity={1} />
                    <stop offset="1" stopColor={FARGE.nato} stopOpacity={0} />
                </linearGradient>
            </defs>
            <motion.rect
                x={X0}
                y={Y}
                height={HOYDE}
                fill={`url(#${id})`}
                initial={{ width: 0 }}
                animate={{ width: slutt - X0 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            />
        </g>
    );
}

function Kort({ x, y, tittel, tekst, farge = FARGE.mork }: { x: number; y: number; tittel: string; tekst?: string; farge?: string }) {
    const linjer = brytLinjer(tekst, 40);
    const bredde = Math.max(kortBredde(tittel, 42), ...linjer.map((l) => kortBredde(l, 32))) + 56;
    const hoyde = 84 + linjer.length * 44;
    return (
        <g>
            <rect x={x} y={y} width={bredde} height={hoyde} rx={22} fill="#ffffff" stroke="#cbd5e1" strokeWidth={2} />
            <text x={x + 28} y={y + 58} fontSize={42} fontWeight={900} fill={farge}>
                {tittel}
            </text>
            {linjer.map((l, i) => (
                <text key={i} x={x + 28} y={y + 108 + i * 44} fontSize={32} fontWeight={600} fill="#334155">
                    {l}
                </text>
            ))}
        </g>
    );
}

/** Et parti som deler seg i to. */
function Splitt({ x, y }: { x: number; y: number }) {
    return (
        <g transform={`translate(${x}, ${y})`}>
            <motion.path
                d="M 0 -60 A 60 60 0 0 0 0 60 Z"
                fill="#dc2626"
                initial={{ x: 0 }}
                animate={{ x: -22 }}
                transition={{ duration: 1.2, delay: 0.3 }}
            />
            <motion.path
                d="M 0 -60 A 60 60 0 0 1 0 60 Z"
                fill="#f87171"
                initial={{ x: 0 }}
                animate={{ x: 22 }}
                transition={{ duration: 1.2, delay: 0.3 }}
            />
        </g>
    );
}

function Stolpe({ children }: { children?: ReactNode }) {
    return (
        <g>
            <rect x={X0} y={Y} width={BREDDE} height={HOYDE} rx={10} fill="#e2e8f0" />
            {children}
            <rect x={X0} y={Y} width={BREDDE} height={HOYDE} rx={10} fill="none" stroke={FARGE.mork} strokeWidth={3} />
            <text x={X0} y={Y - 34} fontSize={28} fontWeight={700} fill="#475569">
                0 %
            </text>
            <text x={X0 + BREDDE} y={Y - 34} textAnchor="end" fontSize={28} fontWeight={700} fill="#475569">
                100 %
            </text>
        </g>
    );
}

export function NatoMening({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? '1949';
    const overskrift =
        modus === '1949'
            ? beat === 0
                ? 'NATO i 1949: en vanskelig beslutning'
                : 'Sommeren 1949: gjør NATO faren for krig mindre?'
            : 'Støtten til NATO i Norge etter 1949';
    return (
        <div className="absolute inset-0" style={{ background: '#f1f5f9' }}>
            <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                <AnimatePresence mode="wait">
                    <motion.text
                        key={overskrift}
                        x={B / 2}
                        y={130}
                        textAnchor="middle"
                        fontSize={52}
                        fontWeight={900}
                        fill={FARGE.mork}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {overskrift}
                    </motion.text>
                </AnimatePresence>
                {modus === '1949' ? <Mening1949 beat={beat} /> : <Stotte beat={beat} />}
            </svg>
        </div>
    );
}

function Mening1949({ beat }: { beat: number }) {
    if (beat === 0)
        return (
            <g>
                <Kort x={160} y={300} tittel="Motstand" tekst="i Arbeiderpartiet" farge={FARGE.rodMork} />
                <Kort x={860} y={300} tittel="Motstand" tekst="på høyresiden i politikken" farge={FARGE.rodMork} />
                <text x={B / 2} y={640} textAnchor="middle" fontSize={38} fontWeight={700} fill="#334155">
                    Beslutningen var ikke enkel
                </text>
            </g>
        );
    return (
        <g>
            <Stolpe>
                <UskarpFlate id="mening-1949" fra={53} til={64} />
                {beat >= 2 && (
                    <motion.rect
                        x={px(88)}
                        y={Y}
                        width={px(100) - px(88)}
                        height={HOYDE}
                        fill={FARGE.rod}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                )}
            </Stolpe>
            <Merke prosent={50} tekst="halvparten" />
            <g>
                <rect x={X0} y={560} width={34} height={34} fill={FARGE.nato} />
                <text x={X0 + 50} y={588} fontSize={34} fontWeight={800} fill={FARGE.mork}>
                    Godt over halvparten: faren for krig blir mindre
                </text>
            </g>
            {beat >= 2 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <rect x={X0} y={630} width={34} height={34} fill={FARGE.rod} />
                    <text x={X0 + 50} y={658} fontSize={34} fontWeight={800} fill={FARGE.mork}>
                        Bare 12 prosent: faren for krig blir større
                    </text>
                </motion.g>
            )}
            <text x={B - 40} y={H - 36} textAnchor="end" fontSize={30} fontWeight={600} fill="#475569">
                Blått: omtrentlig, ikke et eksakt tall
            </text>
        </g>
    );
}

function Stotte({ beat }: { beat: number }) {
    const demp = beat >= 1 ? 0.35 : 1;
    return (
        <g>
            <g opacity={demp} style={{ transition: 'opacity 0.6s' }}>
                <Stolpe>
                    <UskarpFlate id="mening-stotte" fra={58} til={66.7} />
                </Stolpe>
                <Merke prosent={66.7} tekst="to tredjedeler" />
            </g>
            {beat === 0 && (
                <g>
                    <rect x={X0} y={560} width={34} height={34} fill={FARGE.nato} />
                    <text x={X0 + 50} y={588} fontSize={34} fontWeight={800} fill={FARGE.mork}>
                        Støtte: nær to tredjedeler, i flere tiår
                    </text>
                </g>
            )}
            <AnimatePresence mode="wait">
                {beat === 1 && (
                    <motion.g key="splitt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Splitt x={300} y={640} />
                        <Kort x={440} y={540} tittel="1961: Arbeiderpartiet splittes" tekst="motstanden mot NATO på venstresiden" farge={FARGE.rodMork} />
                    </motion.g>
                )}
                {beat === 2 && (
                    <motion.g key="usa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Kort x={160} y={540} tittel="Noen var skeptiske:" tekst="fikk USA for mye å si i Norge?" farge={FARGE.rodMork} />
                    </motion.g>
                )}
                {beat >= 3 && (
                    <motion.g key="fasit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <text x={B / 2} y={600} textAnchor="middle" fontSize={60} fontWeight={900} fill={FARGE.mork}>
                            Ikke ett fasitsvar
                        </text>
                        <text x={B / 2} y={680} textAnchor="middle" fontSize={36} fontWeight={700} fill="#334155">
                            Hvordan holder Norge seg best trygt?
                        </text>
                    </motion.g>
                )}
            </AnimatePresence>
        </g>
    );
}
