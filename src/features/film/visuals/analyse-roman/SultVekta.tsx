import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate16x9, Kort } from './felles';

/**
 * Hvorfor han ikke er til å stole på, og hvor Hamsun hører hjemme: ordene mot handlingene,
 * vekta der skammen veier mer enn lysten, tidslinja fra realismen til nyromantikken, og
 * lupen over hodet til én mann.
 */

type Modus = 'ord' | 'vekt' | 'debatt' | 'lupe';

const SKRIFT = 'Outfit, Inter, sans-serif';

function Overskrift({
    x,
    y,
    tekst,
    farge,
}: {
    x: number;
    y: number;
    tekst: string;
    farge: string;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fontSize={50}
            fontWeight={900}
            fill={farge}
            fontFamily={SKRIFT}
        >
            {tekst}
        </text>
    );
}

function Ord({ beat }: { beat: number }) {
    return (
        <g>
            <Overskrift x={420} y={140} tekst="Det han sier" farge="#fbbf24" />
            <Kort
                key={beat >= 2 ? 'rod' : 'lys'}
                x={420}
                y={190}
                linjer={['«Jeg er meget,', 'meget fattig»']}
                fs={46}
                fyll={beat >= 2 ? '#fecaca' : '#ffffff'}
            />
            {/* Snakkeboblens hale */}
            <path d="M 470 340 L 520 395 L 540 340 Z" fill={beat >= 2 ? '#fecaca' : '#ffffff'} />
            <Kort vis={beat === 0} x={420} y={440} linjer={['Ærlig?']} fs={44} fyll="#99f6e4" />
            <Kort
                vis={beat === 1}
                x={420}
                y={440}
                linjer={['Hvorfor akkurat nå?']}
                fs={44}
                fyll="#fbbf24"
            />
            <Kort
                vis={beat === 1}
                x={420}
                y={560}
                linjer={['Han har løyet om hvor han', 'står i samfunnet, hele romanen']}
                fs={34}
                fyll="#e2e8f0"
                forsinkelse={0.6}
            />
            <Kort
                vis={beat >= 2}
                x={420}
                y={440}
                linjer={['Sannheten', 'brukt som et våpen']}
                fs={44}
                fyll="#dc2626"
                farge="#ffffff"
            />
            {beat < 3 && (
                <g opacity={0.5}>
                    <Overskrift x={1180} y={140} tekst="Det han gjør" farge="#5eead4" />
                    <rect
                        x={930}
                        y={190}
                        width={500}
                        height={330}
                        rx={18}
                        fill="none"
                        stroke="#5eead4"
                        strokeWidth={4}
                        strokeDasharray="16 12"
                    />
                </g>
            )}
            {beat >= 3 && (
                <>
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Overskrift x={1180} y={140} tekst="Det han gjør" farge="#5eead4" />
                        <line
                            x1={800}
                            y1={110}
                            x2={800}
                            y2={650}
                            stroke="#334155"
                            strokeWidth={4}
                        />
                    </motion.g>
                    <Kort
                        x={1180}
                        y={190}
                        linjer={['Han trekker seg unna', 'og støter henne bort']}
                        fs={42}
                        fyll="#99f6e4"
                        forsinkelse={0.4}
                    />
                    <Kort
                        x={1180}
                        y={440}
                        linjer={['Her ser vi ofte sannheten']}
                        fs={42}
                        fyll="#ffffff"
                        forsinkelse={1}
                    />
                    <Kort
                        x={800}
                        y={720}
                        linjer={['Upålitelig forteller']}
                        fs={52}
                        fyll="#fbbf24"
                        forsinkelse={1.6}
                    />
                </>
            )}
        </g>
    );
}

const SENTER = { x: 800, y: 330 };
const ARM = 470;

/** Vinkelen glir mot målet. Positiv vinkel = høyre side synker. */
function useVinkel(mal: number) {
    const [vinkel, setVinkel] = useState(mal);
    const naa = useRef(mal);
    useEffect(() => {
        const c = animate(naa.current, mal, {
            duration: 1.4,
            ease: [0.34, 1.3, 0.64, 1],
            onUpdate: (x) => {
                naa.current = x;
                setVinkel(x);
            },
        });
        return () => c.stop();
    }, [mal]);
    return vinkel;
}

function Skal({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
    return (
        <g>
            <line x1={x} y1={y} x2={x - 120} y2={y + 160} stroke="#cbd5e1" strokeWidth={4} />
            <line x1={x} y1={y} x2={x + 120} y2={y + 160} stroke="#cbd5e1" strokeWidth={4} />
            <path
                d={`M ${x - 140} ${y + 160} Q ${x} ${y + 225} ${x + 140} ${y + 160} Z`}
                fill="#94a3b8"
            />
            <g transform={`translate(${x} ${y + 160})`}>{children}</g>
        </g>
    );
}

function Hjerte({ farge }: { farge: string }) {
    return (
        <path
            d="M 0 -10 C -10 -40, -60 -40, -60 -80 C -60 -110, -20 -120, 0 -90 C 20 -120, 60 -110, 60 -80 C 60 -40, 10 -40, 0 -10 Z"
            fill={farge}
        />
    );
}

function Vekt({ beat }: { beat: number }) {
    const mal = beat === 0 ? -12 : beat === 1 ? 0 : 14;
    const vinkel = useVinkel(mal);
    const r = (vinkel * Math.PI) / 180;
    const venstre = { x: SENTER.x - ARM * Math.cos(r), y: SENTER.y - ARM * Math.sin(r) };
    const hoyre = { x: SENTER.x + ARM * Math.cos(r), y: SENTER.y + ARM * Math.sin(r) };
    const topp =
        beat === 0
            ? { t: 'Han sier: jeg vil ha henne', f: '#ffffff', c: '#0f172a' }
            : beat === 2
              ? { t: 'Skammen veier mest', f: '#dc2626', c: '#ffffff' }
              : beat === 3
                ? { t: 'Han beskytter verdigheten sin', f: '#fbbf24', c: '#0f172a' }
                : null;
    return (
        <g>
            {/* Foten og stolpen */}
            <path d="M 700 820 L 900 820 L 800 760 Z" fill="#64748b" />
            <rect x={790} y={SENTER.y} width={20} height={440} fill="#64748b" />
            <line
                x1={venstre.x}
                y1={venstre.y}
                x2={hoyre.x}
                y2={hoyre.y}
                stroke="#e2e8f0"
                strokeWidth={14}
                strokeLinecap="round"
            />
            <circle cx={SENTER.x} cy={SENTER.y} r={16} fill="#f8fafc" />
            <Skal x={venstre.x} y={venstre.y}>
                <motion.g animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
                    <Hjerte farge={beat >= 3 ? '#64748b' : '#f43f5e'} />
                </motion.g>
            </Skal>
            <Skal x={hoyre.x} y={hoyre.y}>
                {beat >= 1 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <rect
                            x={-85}
                            y={-130}
                            width={170}
                            height={120}
                            rx={14}
                            fill="#1e1b4b"
                            stroke="#a5b4fc"
                            strokeWidth={4}
                        />
                        <text
                            x={0}
                            y={-55}
                            textAnchor="middle"
                            fontSize={44}
                            fontWeight={900}
                            fill="#ffffff"
                            fontFamily={SKRIFT}
                        >
                            Skam
                        </text>
                    </motion.g>
                )}
            </Skal>
            <Kort
                x={venstre.x}
                y={venstre.y + 250}
                linjer={['Lysten på', 'kjærlighet']}
                fs={34}
                fyll="#fecdd3"
            />
            <Kort
                vis={beat >= 1}
                x={hoyre.x}
                y={hoyre.y + 250}
                linjer={['Frykten for å bli', 'sett ned på']}
                fs={34}
                fyll="#c7d2fe"
            />
            {topp && (
                <Kort
                    key={topp.t}
                    x={800}
                    y={50}
                    linjer={[topp.t]}
                    fs={46}
                    fyll={topp.f}
                    farge={topp.c}
                />
            )}
        </g>
    );
}

const AAR = (aar: number) => 150 + (aar - 1865) * (1300 / 35);

function Debatt({ beat }: { beat: number }) {
    const akse = 520;
    return (
        <g>
            <line x1={150} y1={akse} x2={1450} y2={akse} stroke="#94a3b8" strokeWidth={5} />
            {[1870, 1880, 1890].map((a) => (
                <g key={a}>
                    <line
                        x1={AAR(a)}
                        y1={akse - 12}
                        x2={AAR(a)}
                        y2={akse + 12}
                        stroke="#94a3b8"
                        strokeWidth={4}
                    />
                    <text
                        x={AAR(a)}
                        y={akse + 50}
                        textAnchor="middle"
                        fontSize={34}
                        fontWeight={700}
                        fill="#cbd5e1"
                        fontFamily={SKRIFT}
                    >
                        {a}
                    </text>
                </g>
            ))}
            {/* Realismen: 1870- og 1880-tallet */}
            <motion.rect
                x={AAR(1870)}
                y={380}
                height={120}
                rx={12}
                fill="#2563eb"
                initial={{ width: 0 }}
                animate={{ width: AAR(1890) - AAR(1870) }}
                transition={{ duration: 1.2 }}
            />
            <text
                x={(AAR(1870) + AAR(1890)) / 2}
                y={456}
                textAnchor="middle"
                fontSize={46}
                fontWeight={900}
                fill="#ffffff"
                fontFamily={SKRIFT}
            >
                Realismen
            </text>
            <Kort
                x={AAR(1880)}
                y={190}
                linjer={['Ibsen og Bjørnson']}
                fs={40}
                fyll="#bfdbfe"
                forsinkelse={0.6}
            />
            {beat >= 1 && (
                <>
                    <line
                        x1={AAR(1871)}
                        y1={akse}
                        x2={AAR(1871)}
                        y2={618}
                        stroke="#fbbf24"
                        strokeWidth={5}
                    />
                    <circle cx={AAR(1871)} cy={akse} r={12} fill="#fbbf24" />
                </>
            )}
            <Kort
                vis={beat >= 1}
                x={560}
                y={620}
                linjer={['Georg Brandes, 1871:', '«sette problemer under debatt»']}
                fs={36}
                fyll="#fde68a"
            />
            {beat >= 2 && (
                <>
                    <defs>
                        <linearGradient id="sult-nyrom" x1="0" x2="1" y1="0" y2="0">
                            <stop offset="0" stopColor="#9333ea" />
                            <stop offset="0.7" stopColor="#9333ea" />
                            <stop offset="1" stopColor="#9333ea" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <motion.rect
                        x={AAR(1890)}
                        y={380}
                        height={120}
                        rx={12}
                        fill="url(#sult-nyrom)"
                        initial={{ width: 0 }}
                        animate={{ width: AAR(1896) - AAR(1890) }}
                        transition={{ duration: 1 }}
                    />
                    <motion.path
                        d={`M ${AAR(1890) + 10} 340 L ${AAR(1890) - 110} 340 M ${AAR(1890) - 80} 318 L ${AAR(1890) - 112} 340 L ${AAR(1890) - 80} 362`}
                        stroke="#f87171"
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    />
                    <text
                        x={AAR(1890) - 50}
                        y={318}
                        textAnchor="middle"
                        fontSize={38}
                        fontWeight={900}
                        fill="#fca5a5"
                        fontFamily={SKRIFT}
                    >
                        motstand
                    </text>
                </>
            )}
            <Kort
                vis={beat >= 2}
                x={1190}
                y={190}
                linjer={['Nyromantikken']}
                fs={44}
                fyll="#e9d5ff"
            />
            {beat >= 3 && <circle cx={AAR(1890)} cy={akse} r={14} fill="#f8fafc" />}
            <Kort vis={beat >= 3} x={1180} y={620} linjer={['Sult, 1890']} fs={36} fyll="#ffffff" />
            <Kort
                vis={beat >= 3}
                x={520}
                y={790}
                linjer={['Problemer under debatt']}
                fs={34}
                fyll="#bfdbfe"
                forsinkelse={0.6}
            />
            <Kort
                vis={beat >= 3}
                x={1180}
                y={790}
                linjer={['Menneskesinnet under lupen']}
                fs={34}
                fyll="#e9d5ff"
                forsinkelse={1.2}
            />
        </g>
    );
}

function Rettslokale({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} 0)`}>
            <path d="M -120 330 L 0 270 L 120 330 Z" fill="#94a3b8" />
            {[-90, -30, 30, 90].map((s) => (
                <rect key={s} x={s - 12} y={340} width={24} height={120} fill="#cbd5e1" />
            ))}
            <rect x={-130} y={460} width={260} height={24} fill="#94a3b8" />
        </g>
    );
}

function Hjem({ x }: { x: number }) {
    return (
        <g transform={`translate(${x} 0)`}>
            <path d="M -120 360 L 0 270 L 120 360 Z" fill="#b45309" />
            <rect x={-100} y={360} width={200} height={124} fill="#fde68a" />
            <rect x={-25} y={410} width={50} height={74} fill="#78350f" />
            <rect x={-80} y={385} width={40} height={36} fill="#60a5fa" />
            <rect x={40} y={385} width={40} height={36} fill="#60a5fa" />
        </g>
    );
}

function Kryss({ x, y }: { x: number; y: number }) {
    return (
        <motion.path
            d={`M ${x - 28} ${y - 28} L ${x + 28} ${y + 28} M ${x + 28} ${y - 28} L ${x - 28} ${y + 28}`}
            stroke="#ef4444"
            strokeWidth={12}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
        />
    );
}

const HODE = { x: 1150, y: 470 };

function Lupe({ beat }: { beat: number }) {
    return (
        <g>
            <Rettslokale x={260} />
            <Hjem x={600} />
            <text
                x={260}
                y={540}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#e2e8f0"
                fontFamily={SKRIFT}
            >
                Rettslokale
            </text>
            <text
                x={600}
                y={540}
                textAnchor="middle"
                fontSize={34}
                fontWeight={700}
                fill="#e2e8f0"
                fontFamily={SKRIFT}
            >
                Borgerlig hjem
            </text>
            <Kryss x={410} y={290} />
            <Kryss x={750} y={290} />
            {/* Hodet */}
            <ellipse
                cx={HODE.x}
                cy={HODE.y}
                rx={165}
                ry={175}
                fill="#334155"
                opacity={beat >= 1 ? 1 : 0.6}
            />
            {beat === 0 && (
                <text
                    x={HODE.x}
                    y={HODE.y + 40}
                    textAnchor="middle"
                    fontSize={120}
                    fontWeight={900}
                    fill="#94a3b8"
                    fontFamily={SKRIFT}
                >
                    ?
                </text>
            )}
            {beat >= 1 && (
                <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.9 }}
                >
                    {/* Mørke kroker inni hodet */}
                    {[
                        'M 1090 420 q 30 -40 60 0 t 60 0',
                        'M 1070 500 q 40 50 80 0 t 80 0',
                        'M 1110 560 q 20 -30 40 0 t 40 0',
                    ].map((d) => (
                        <path
                            key={d}
                            d={d}
                            fill="none"
                            stroke="#a78bfa"
                            strokeWidth={8}
                            strokeLinecap="round"
                        />
                    ))}
                    <circle
                        cx={HODE.x}
                        cy={HODE.y}
                        r={200}
                        fill="#a78bfa"
                        fillOpacity={0.12}
                        stroke="#e2e8f0"
                        strokeWidth={16}
                    />
                    <line
                        x1={1293}
                        y1={612}
                        x2={1420}
                        y2={740}
                        stroke="#e2e8f0"
                        strokeWidth={30}
                        strokeLinecap="round"
                    />
                </motion.g>
            )}
            <Kort
                vis={beat === 1}
                x={1100}
                y={760}
                linjer={['I hodet til én mann']}
                fs={40}
                fyll="#e9d5ff"
            />
            <Kort
                vis={beat === 2}
                x={470}
                y={640}
                linjer={['Nøden: ikke et samfunnsproblem,', 'men noe inne i et menneske']}
                fs={36}
                fyll="#fde68a"
            />
            {beat >= 3 && (
                <>
                    <Kort x={HODE.x} y={175} linjer={['rotløs']} fs={34} fyll="#ffffff" />
                    <Kort
                        x={870}
                        y={330}
                        linjer={['fremmed']}
                        fs={34}
                        fyll="#ffffff"
                        forsinkelse={0.4}
                    />
                    <Kort
                        x={1130}
                        y={690}
                        linjer={['hører ikke til']}
                        fs={34}
                        fyll="#ffffff"
                        forsinkelse={0.8}
                    />
                    <Kort
                        x={760}
                        y={790}
                        linjer={['Den moderne, psykologiske romanen']}
                        fs={40}
                        fyll="#fbbf24"
                        forsinkelse={1.4}
                    />
                </>
            )}
        </g>
    );
}

export function SultVekta({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus = props.modus ?? 'vekt';
    return (
        <Flate16x9 bakgrunn="#0f172a">
            {modus === 'ord' && <Ord beat={beat} />}
            {modus === 'vekt' && <Vekt beat={beat} />}
            {modus === 'debatt' && <Debatt beat={beat} />}
            {modus === 'lupe' && <Lupe beat={beat} />}
        </Flate16x9>
    );
}
