import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Figur, Hake, Kort, Overskrift } from './felles';

/**
 * Meddommerne, i 2D.
 * «hvem»: fire vanlige folk med yrke, hvem som velger dem, kravene og hvor ofte de sitter.
 * «stemme»: tre dommere med én stemme hver, to meddommere stemmer ned fagdommeren, og
 * juryen før 2018 mot i dag, da alle sitter sammen.
 */

type Modus = 'hvem' | 'stemme';

const OVERSKRIFT: Record<Modus, string[]> = {
    hvem: ['Hvem er meddommerne?', 'Vanlige folk', 'Valgt for fire år', 'Hvem kan bli meddommer?', 'Rundt to saker i året'],
    stemme: ['Én stemme hver', 'I tingretten: minst to av tre', 'Et eksempel: to mot én', 'Livserfaring', 'Før 2018: jury', 'I dag: sammen'],
};

const FOLK = [
    { yrke: 'Lærer', farge: '#2563eb', hud: '#e8b48c' },
    { yrke: 'Sykepleier', farge: '#0d9488', hud: '#a8724a' },
    { yrke: 'Snekker', farge: '#b45309', hud: '#e8b48c' },
    { yrke: 'Pensjonist', farge: '#7c3aed', hud: '#f1c9a5' },
];

function Hvem({ beat }: { beat: number }) {
    const xs = [170, 400, 630, 860];
    return (
        <>
            {FOLK.map((f, i) => (
                <motion.g key={f.yrke} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
                    <Figur x={xs[i]} y={560} farge={beat >= 1 ? f.farge : '#94a3b8'} hud={beat >= 1 ? f.hud : '#cbd5e1'} skala={1.5} />
                    {beat === 0 && (
                        <text x={xs[i]} y={300} textAnchor="middle" fontSize={64} fontWeight={900} fill="#94a3b8">
                            ?
                        </text>
                    )}
                    {beat >= 1 && <Kort x={xs[i]} y={590} tittel={f.yrke} farge={f.farge} forsinkelse={i * 0.25} />}
                </motion.g>
            ))}
            {beat >= 2 && <Kort x={1290} y={160} tittel="Kommunestyret velger" tekst="for fire år om gangen" farge="#0f766e" />}
            {beat >= 3 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <rect x={1040} y={310} width={510} height={250} rx={22} fill="#ffffff" stroke="#334155" strokeWidth={4} />
                    {['Over 21 og under 70 år', 'Godt nok norsk', 'Egnet til oppgaven'].map((t, i) => (
                        <g key={t}>
                            <text x={1130} y={370 + i * 75} fontSize={32} fontWeight={700} fill="#0f172a">
                                {t}
                            </text>
                        </g>
                    ))}
                    {[0, 1, 2].map((i) => (
                        <Hake key={i} x={1085} y={359 + i * 75} r={16} />
                    ))}
                </motion.g>
            )}
            {beat >= 4 && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                    <text x={800} y={730} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                        Ett år i lagmannsretten for én meddommer
                    </text>
                    {Array.from({ length: 12 }, (_, m) => {
                        const sak = m === 3 || m === 9;
                        return (
                            <motion.rect
                                key={m}
                                x={250 + m * 94}
                                y={760}
                                width={80}
                                height={80}
                                rx={10}
                                stroke="#334155"
                                strokeWidth={3}
                                initial={{ fill: '#f1f5f9' }}
                                animate={{ fill: sak ? '#f59e0b' : '#f1f5f9' }}
                                transition={{ delay: sak ? 1 + m * 0.1 : 0 }}
                            />
                        );
                    })}
                </motion.g>
            )}
        </>
    );
}

const DOMMERE = [
    { navn: 'Meddommer', farge: '#0d9488', hud: '#e8b48c' },
    { navn: 'Fagdommer', farge: '#1e293b', hud: '#a8724a' },
    { navn: 'Meddommer', farge: '#b45309', hud: '#f1c9a5' },
];

function Stemmeseddel({ x, y, tekst, ja }: { x: number; y: number; tekst: string; ja: boolean | null }) {
    const farge = ja === null ? '#64748b' : ja ? '#16a34a' : '#94a3b8';
    return (
        <motion.g key={tekst} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <rect x={x - 120} y={y} width={240} height={84} rx={14} fill={ja ? '#dcfce7' : '#ffffff'} stroke={farge} strokeWidth={5} />
            <text x={x} y={y + 54} textAnchor="middle" fontSize={32} fontWeight={800} fill={ja ? '#166534' : '#334155'}>
                {tekst}
            </text>
        </motion.g>
    );
}

function Stemme({ beat }: { beat: number }) {
    const xs = [400, 800, 1200];
    if (beat <= 3) {
        return (
            <>
                {DOMMERE.map((d, i) => (
                    <g key={i}>
                        <Figur x={xs[i]} y={470} farge={d.farge} hud={d.hud} skala={1.4} />
                        <text x={xs[i]} y={520} textAnchor="middle" fontSize={34} fontWeight={800} fill="#0f172a">
                            {d.navn}
                        </text>
                        {beat <= 1 && <Stemmeseddel x={xs[i]} y={560} tekst="1 stemme" ja={null} />}
                        {beat >= 2 && <Stemmeseddel x={xs[i]} y={560} tekst={i === 1 ? 'Ikke skyldig' : 'Skyldig'} ja={i !== 1} />}
                    </g>
                ))}
                {beat === 1 && (
                    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                        {[0, 1, 2].map((i) => (
                            <rect key={i} x={620 + i * 125} y={700} width={110} height={70} rx={12} fill={i < 2 ? '#86efac' : '#e2e8f0'} stroke="#334155" strokeWidth={3} />
                        ))}
                        <line x1={865} y1={685} x2={865} y2={785} stroke="#dc2626" strokeWidth={6} />
                        <text x={800} y={840} textAnchor="middle" fontSize={32} fontWeight={800} fill="#334155">
                            Minst 2 av 3 må si skyldig
                        </text>
                    </motion.g>
                )}
                {beat === 2 && <Kort x={800} y={700} tittel="Eksempel: to meddommere mot fagdommeren" farge="#16a34a" forsinkelse={1} />}
                {beat === 3 && (
                    <>
                        <Kort x={800} y={700} tittel="Livserfaring: hva er til å tro på?" farge="#0d9488" />
                        <Kort x={800} y={150} tittel="Dømt av folk som ligner ham selv" farge="#334155" forsinkelse={0.8} />
                    </>
                )}
            </>
        );
    }
    if (beat === 4) {
        // En tett, utellbar gruppe vanlige folk (juryen), og fagdommeren på andre siden.
        const hoder = Array.from({ length: 20 }, (_, i) => ({ x: 320 + (i % 7) * 40 + (Math.floor(i / 7) % 2) * 20, y: 420 + Math.floor(i / 7) * 55 + ((i * 7) % 3) * 6 }));
        return (
            <>
                <rect x={180} y={300} width={580} height={360} rx={30} fill="#ffffff" stroke="#0d9488" strokeWidth={5} />
                {hoder.map((h, i) => (
                    <g key={i}>
                        <circle cx={h.x + 10} cy={h.y} r={30} fill={['#e8b48c', '#a8724a', '#f1c9a5'][i % 3]} stroke="#ffffff" strokeWidth={3} />
                    </g>
                ))}
                <Kort x={470} y={690} tittel="Juryen" tekst="avgjorde alene om tiltalte var skyldig" farge="#0d9488" />
                <line x1={860} y1={260} x2={860} y2={820} stroke="#475569" strokeWidth={10} />
                <Figur x={1150} y={560} farge="#1e293b" hud="#a8724a" skala={1.4} />
                <Kort x={1180} y={690} tittel="Fagdommerne" tekst="var ikke med på det" farge="#1e293b" />
            </>
        );
    }
    const rundt = [0, 1, 2, 3, 4, 5, 6].map((i) => {
        const a = Math.PI + (i / 6) * Math.PI;
        return { x: 800 + Math.cos(a) * 380, y: 640 + Math.sin(a) * 260 };
    });
    const farger = ['#0d9488', '#b45309', '#1e293b', '#7c3aed', '#1e293b', '#be123c', '#2563eb'];
    return (
        <>
            {rundt.map((p, i) => (
                <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 }}>
                    <Figur x={p.x} y={p.y} farge={farger[i]} hud={i % 2 ? '#a8724a' : '#e8b48c'} skala={1.05} />
                </motion.g>
            ))}
            <ellipse cx={800} cy={680} rx={420} ry={90} fill="#a0703f" />
            <Kort x={800} y={760} tittel="Fagdommere og meddommere ved samme bord" farge="#334155" />
            <Kort x={800} y={150} tittel="Juryen ble tatt bort 1. januar 2018" farge="#475569" />
        </>
    );
}

export function DomstoleneFolk({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'hvem';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: 'linear-gradient(#fefce8, #e7e5e4)' }}>
            <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                {modus === 'hvem' && <Hvem beat={beat} />}
                {modus === 'stemme' && <Stemme beat={beat} />}
                <Overskrift tekst={tekst} />
            </svg>
        </div>
    );
}
