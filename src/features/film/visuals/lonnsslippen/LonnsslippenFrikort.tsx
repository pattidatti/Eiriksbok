import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';

/**
 * Frikortet som en linjal for årsinntekten. Fire moduser:
 * - grense: alt opp til 100 000 kroner er skattefritt. I 2024 var grensen 70 000.
 * - felle: over grensen trekkes 50 prosent av det du tjener over.
 * - fordeling: frikortet er delt mellom jobbene. Kiosken har 0 kroner, så halve lønnen trekkes.
 * - flytt: Ida flytter noe av frikortet til kiosken, men aldri under det hun alt har tjent.
 */

type Modus = 'grense' | 'felle' | 'fordeling' | 'flytt';

/** 0 kroner og 100 000 kroner på linjalen. */
const X0 = 320;
const X100 = 1240;
const xFor = (kr: number) => X0 + ((X100 - X0) * kr) / 100000;
const XMAX = 1480;

const OVERSKRIFT: Record<Modus, string[]> = {
    grense: [
        'Hvor mye tjener du i løpet av året?',
        'Frikort: ingen skatt opp til 100 000 kr',
        'Frikortet kommer av seg selv',
        'Grensen kan flytte seg',
        'Feriepengene teller med',
    ],
    felle: [
        'Fella i frikortet',
        'Over grensen: 50 prosent av det over',
        'Tjener du mer? Bestill skattekort',
    ],
    fordeling: [
        'Frikortet kan deles mellom jobbene',
        'Mer lønn enn delen? 50 prosent trekk',
        'Selv om du tjener under 100 000 til sammen',
        'Kiosken: 0 kr av frikortet',
    ],
    flytt: [
        'Kiosken fulgte skattekortet',
        'Ida flytter noe av frikortet',
        'Du kan endre det flere ganger i året',
        'Men ikke under det du alt har tjent',
    ],
};

function T({
    x,
    y,
    children,
    vis = true,
    str = 34,
    farge = '#0f172a',
    vekt = 700,
    anker = 'middle',
}: {
    x: number;
    y: number;
    children: ReactNode;
    vis?: boolean;
    str?: number;
    farge?: string;
    vekt?: number;
    anker?: 'start' | 'middle' | 'end';
}) {
    return (
        <motion.text
            x={x}
            y={y}
            fontSize={str}
            fontWeight={vekt}
            fill={farge}
            textAnchor={anker}
            initial={{ opacity: 0 }}
            animate={{ opacity: vis ? 1 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {children}
        </motion.text>
    );
}

/** Linjalen med 0 og 100 000 kroner (og 70 000 for 2024 i grense-modus). */
function Linjal({ y, vis70 = false }: { y: number; vis70?: boolean }) {
    return (
        <g>
            <line x1={X0} y1={y} x2={XMAX} y2={y} stroke="#334155" strokeWidth={6} />
            <line x1={X0} y1={y - 16} x2={X0} y2={y + 16} stroke="#334155" strokeWidth={6} />
            <T x={X0} y={y + 56} str={30}>
                0 kr
            </T>
            <line x1={X100} y1={y - 16} x2={X100} y2={y + 16} stroke="#334155" strokeWidth={6} />
            <T x={X100} y={y + 56} str={30} vekt={900}>
                100 000 kr
            </T>
            {vis70 && (
                <>
                    <line
                        x1={xFor(70000)}
                        y1={y - 16}
                        x2={xFor(70000)}
                        y2={y + 16}
                        stroke="#64748b"
                        strokeWidth={5}
                    />
                    <T x={xFor(70000)} y={y + 56} str={30} farge="#64748b">
                        70 000 kr
                    </T>
                </>
            )}
        </g>
    );
}

function Grense({ beat }: { beat: number }) {
    const LY = 560;
    const sone = beat >= 1 ? 100000 : 0;
    return (
        <g>
            <motion.rect
                x={X0}
                y={LY - 170}
                height={170}
                fill="#99f6e4"
                initial={{ width: 0 }}
                animate={{ width: xFor(sone) - X0 }}
                transition={{ duration: 1.2 }}
            />
            <T x={(X0 + X100) / 2} y={LY - 70} vis={beat >= 1} str={44} vekt={900} farge="#0f766e">
                Ingen skatt
            </T>
            <Linjal y={LY} vis70={beat === 3} />
            <T x={XMAX} y={LY + 56} str={28} farge="#475569" anker="end">
                i året
            </T>

            {beat === 0 && (
                <g>
                    <rect
                        x={420}
                        y={240}
                        width={760}
                        height={110}
                        rx={24}
                        fill="#ffffff"
                        stroke="#334155"
                        strokeWidth={4}
                    />
                    <T x={800} y={310} str={40} vekt={800}>
                        Må du betale skatt av lønnen?
                    </T>
                </g>
            )}
            {beat === 2 && (
                <g>
                    <rect
                        x={360}
                        y={660}
                        width={880}
                        height={150}
                        rx={24}
                        fill="#ffffff"
                        stroke="#0d9488"
                        strokeWidth={4}
                    />
                    <T x={800} y={724} str={36} vekt={800}>
                        13 år eller eldre: frikort av seg selv
                    </T>
                    <T x={800} y={778} str={30} vekt={600} farge="#475569">
                        Arbeidsgiveren henter det, ikke du
                    </T>
                </g>
            )}
            {beat === 3 && (
                <g>
                    <motion.rect
                        x={X0}
                        y={LY - 350}
                        height={70}
                        rx={10}
                        fill="#0d9488"
                        initial={{ width: 0 }}
                        animate={{ width: X100 - X0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    />
                    <T x={X0 + 24} y={LY - 303} str={32} farge="#ffffff" vekt={800} anker="start">
                        2025 og 2026: 100 000 kr
                    </T>
                    <motion.rect
                        x={X0}
                        y={LY - 260}
                        height={70}
                        rx={10}
                        fill="#94a3b8"
                        initial={{ width: 0 }}
                        animate={{ width: xFor(70000) - X0 }}
                        transition={{ duration: 0.8 }}
                    />
                    <T x={X0 + 24} y={LY - 213} str={32} farge="#ffffff" vekt={800} anker="start">
                        2024: 70 000 kr
                    </T>
                </g>
            )}
            {beat >= 4 && (
                <g>
                    <motion.rect
                        x={X0}
                        y={LY + 110}
                        height={80}
                        fill="#2563eb"
                        rx={8}
                        initial={{ width: 0 }}
                        animate={{ width: 560 }}
                        transition={{ duration: 1 }}
                    />
                    <motion.rect
                        x={X0 + 560}
                        y={LY + 110}
                        height={80}
                        fill="#f59e0b"
                        rx={8}
                        initial={{ width: 0 }}
                        animate={{ width: 220 }}
                        transition={{ duration: 0.8, delay: 1 }}
                    />
                    <T x={X0 + 280} y={LY + 162} str={34} farge="#ffffff">
                        Lønn
                    </T>
                    <T x={X0 + 670} y={LY + 162} str={30} farge="#0f172a">
                        Feriepenger
                    </T>
                    <T x={X0 + 1000} y={LY + 162} str={34} farge="#475569" anker="start">
                        teller også
                    </T>
                    <T x={800} y={LY + 250} str={30} farge="#64748b" vekt={600}>
                        Skisse: lengdene er bare et eksempel
                    </T>
                </g>
            )}
        </g>
    );
}

function Felle({ beat }: { beat: number }) {
    const LY = 520;
    return (
        <g>
            <rect x={X0} y={LY - 170} width={X100 - X0} height={170} fill="#99f6e4" />
            <motion.rect
                x={X100}
                y={LY - 170}
                height={170}
                fill="#fecaca"
                initial={{ width: 0 }}
                animate={{ width: XMAX - X100 }}
                transition={{ duration: 1 }}
            />
            <T x={(X0 + X100) / 2} y={LY - 70} str={44} vekt={900} farge="#0f766e">
                Ingen skatt
            </T>
            <T
                x={(X100 + XMAX) / 2}
                y={LY - 70}
                str={beat >= 1 ? 44 : 72}
                vekt={900}
                farge="#dc2626"
            >
                {beat >= 1 ? '50 %' : '?'}
            </T>
            <Linjal y={LY} />
            {beat >= 1 && (
                <g>
                    <motion.rect
                        x={X0}
                        y={LY + 100}
                        height={80}
                        rx={8}
                        fill="#2563eb"
                        initial={{ width: 0 }}
                        animate={{ width: X100 - X0 }}
                        transition={{ duration: 1 }}
                    />
                    <motion.rect
                        x={X100}
                        y={LY + 100}
                        height={80}
                        rx={8}
                        fill="#2563eb"
                        initial={{ width: 0 }}
                        animate={{ width: 180 }}
                        transition={{ duration: 0.6, delay: 1 }}
                    />
                    <motion.rect
                        x={X100}
                        y={LY + 100}
                        width={180}
                        height={40}
                        fill="#dc2626"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.6 }}
                    />
                    <T x={(X0 + X100) / 2} y={LY + 152} str={32} farge="#ffffff">
                        Lønn med frikort
                    </T>
                    <T x={X100 + 90} y={LY + 240} str={32} vekt={900} farge="#dc2626">
                        halvparten trekkes
                    </T>
                    <T x={X100 + 90} y={LY + 282} str={30} farge="#7f1d1d" vekt={700}>
                        av alt over grensen
                    </T>
                </g>
            )}
            {beat >= 2 && (
                <g>
                    <rect
                        x={300}
                        y={120}
                        width={720}
                        height={110}
                        rx={24}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={4}
                    />
                    <T x={660} y={190} str={36} vekt={800}>
                        Bestill heller et vanlig skattekort
                    </T>
                </g>
            )}
        </g>
    );
}

/** En jobb-rad: navnet, frikortdelen (ramme) og lønnen (stolpe). */
function Jobb({
    y,
    navn,
    del,
    lonn,
    trekk,
    delTekst,
    sperre,
}: {
    y: number;
    navn: string;
    /** Frikortdelen i px-bredde fra X0. */
    del: number;
    lonn?: number;
    trekk?: boolean;
    delTekst?: string;
    sperre?: number;
}) {
    return (
        <g>
            <T x={X0 - 20} y={y + 52} str={34} vekt={800} anker="end">
                {navn}
            </T>
            <motion.rect
                x={X0}
                y={y}
                height={80}
                rx={10}
                fill="#ccfbf1"
                stroke="#0d9488"
                strokeWidth={5}
                initial={false}
                animate={{ width: Math.max(del, 6) }}
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            />
            {delTekst && (
                <T
                    x={X0 + Math.max(del, 6) + 20}
                    y={y + 52}
                    str={30}
                    farge={del < 10 ? '#dc2626' : '#0f766e'}
                    vekt={800}
                    anker="start"
                >
                    {delTekst}
                </T>
            )}
            {sperre !== undefined && (
                <g>
                    <line
                        x1={X0 + sperre}
                        y1={y - 22}
                        x2={X0 + sperre}
                        y2={y + 102}
                        stroke="#7c3aed"
                        strokeWidth={6}
                    />
                    <T x={X0 + sperre} y={y - 34} str={32} farge="#6d28d9" vekt={800}>
                        tjent der så langt
                    </T>
                </g>
            )}
            {lonn !== undefined && (
                <g>
                    <motion.rect
                        x={X0}
                        y={y + 110}
                        height={64}
                        rx={8}
                        fill="#2563eb"
                        initial={{ width: 0 }}
                        animate={{ width: xFor(lonn) - X0 }}
                        transition={{ duration: 0.8 }}
                    />
                    <motion.rect
                        x={X0 + (xFor(lonn) - X0) / 2}
                        y={y + 110}
                        height={64}
                        fill="#dc2626"
                        initial={{ width: 0 }}
                        animate={{ width: trekk ? (xFor(lonn) - X0) / 2 : 0 }}
                        transition={{ duration: 0.8 }}
                    />
                    <T
                        x={xFor(lonn) + 24}
                        y={y + 154}
                        str={30}
                        anker="start"
                        farge={trekk ? '#dc2626' : '#1e3a8a'}
                        vekt={800}
                    >
                        {trekk ? 'Lønn 13 200 kr: halvparten trekkes' : 'Lønn i juli: 13 200 kr'}
                    </T>
                </g>
            )}
        </g>
    );
}

function Fordeling({ beat }: { beat: number }) {
    const hel = X100 - X0;
    return (
        <g>
            <rect x={X0} y={150} width={hel} height={64} rx={10} fill="#0d9488" />
            <T x={(X0 + X100) / 2} y={194} str={32} farge="#ffffff" vekt={900}>
                Frikortet: 100 000 kr
            </T>
            <Jobb y={300} navn="Klesbutikken" del={hel} delTekst="" />
            <T x={(X0 + X100) / 2} y={352} str={30} farge="#0f766e" vekt={800}>
                hele frikortet
            </T>
            <Jobb
                y={520}
                navn="Kiosken"
                del={0}
                delTekst="0 kr"
                lonn={beat >= 1 ? 13200 : undefined}
                trekk={beat >= 1}
            />
            {beat === 2 && (
                <g>
                    <rect
                        x={560}
                        y={790}
                        width={760}
                        height={80}
                        rx={20}
                        fill="#ffffff"
                        stroke="#dc2626"
                        strokeWidth={4}
                    />
                    <T x={940} y={843} str={32} vekt={800} farge="#dc2626">
                        Selv om du tjener under 100 000 kr til sammen
                    </T>
                </g>
            )}
            {beat >= 3 && (
                <g>
                    <rect
                        x={760}
                        y={790}
                        width={560}
                        height={80}
                        rx={20}
                        fill="#fee2e2"
                        stroke="#dc2626"
                        strokeWidth={4}
                    />
                    <T x={1040} y={845} str={38} vekt={900} farge="#dc2626">
                        Trukket: 6 600 kr
                    </T>
                </g>
            )}
        </g>
    );
}

function Flytt({ beat }: { beat: number }) {
    const hel = X100 - X0;
    // Hvor mye som flyttes er ikke gitt i artikkelen: bildet viser bare at noe flyttes.
    const flyttet = beat >= 1 ? hel * 0.35 : 0;
    const vipp = beat >= 2 ? hel * 0.08 : 0;
    const sperre = hel * 0.35;
    return (
        <g>
            <rect x={X0} y={150} width={hel} height={64} rx={10} fill="#0d9488" />
            <T x={(X0 + X100) / 2} y={194} str={32} farge="#ffffff" vekt={900}>
                Frikortet: 100 000 kr
            </T>
            <Jobb
                y={320}
                navn="Klesbutikken"
                del={hel - flyttet + vipp}
                sperre={beat >= 3 ? sperre : undefined}
            />
            <Jobb
                y={560}
                navn="Kiosken"
                del={flyttet - vipp}
                delTekst={beat >= 1 ? 'nå med frikort' : '0 kr'}
            />
            {beat === 0 && (
                <g>
                    <rect
                        x={480}
                        y={740}
                        width={640}
                        height={90}
                        rx={20}
                        fill="#ffffff"
                        stroke="#0d9488"
                        strokeWidth={4}
                    />
                    <T x={800} y={798} str={34} vekt={800} farge="#0f766e">
                        ✓ Kiosken gjorde ingenting galt
                    </T>
                </g>
            )}
            {beat === 2 && (
                <g>
                    <rect
                        x={430}
                        y={740}
                        width={740}
                        height={90}
                        rx={20}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={4}
                    />
                    <T x={800} y={798} str={32} vekt={800} farge="#1d4ed8">
                        For eksempel når du får en ny jobb
                    </T>
                </g>
            )}
            {beat >= 3 && (
                <g>
                    <rect
                        x={330}
                        y={740}
                        width={940}
                        height={90}
                        rx={20}
                        fill="#ffffff"
                        stroke="#7c3aed"
                        strokeWidth={4}
                    />
                    <T x={800} y={798} str={32} vekt={800} farge="#6d28d9">
                        Ikke mindre på en jobb enn du alt har tjent der
                    </T>
                </g>
            )}
        </g>
    );
}

export function LonnsslippenFrikort({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props.modus ?? 'grense';
    const linjer = OVERSKRIFT[modus];
    const tekst = linjer[Math.min(beat, linjer.length - 1)];
    return (
        <div className="absolute inset-0" style={{ background: '#f8fafc' }}>
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full"
            >
                <motion.text
                    key={tekst}
                    x={800}
                    y={84}
                    textAnchor="middle"
                    fontSize={52}
                    fontWeight={900}
                    fill="#0f172a"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    {tekst}
                </motion.text>
                {modus === 'grense' && <Grense beat={beat} />}
                {modus === 'felle' && <Felle beat={beat} />}
                {modus === 'fordeling' && <Fordeling beat={beat} />}
                {modus === 'flytt' && <Flytt beat={beat} />}
            </svg>
        </div>
    );
}
