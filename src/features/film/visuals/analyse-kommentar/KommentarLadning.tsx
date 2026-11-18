import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { Flate16x9, Kort, Kryss, SKRIFT } from './felles';

/**
 * Ord som batterier: hvert verdiladet ord skytes ut fra batteriet og havner på plussiden
 * eller minussiden. Først ordparene fra artikkelen (hjem og bolig, frihet og lisens), så
 * ordene fra Botox-kommentaren, sortert etter om de handler om KI eller om å skrive selv.
 */

type Modus = 'par' | 'botox';

const PLUSS = '#16a34a';
const MINUS = '#dc2626';
const BAK = 'linear-gradient(180deg, #111827 0%, #1f2937 100%)';

function Batteri() {
    return (
        <g>
            <rect
                x={640}
                y={50}
                width={320}
                height={110}
                rx={20}
                fill="#334155"
                stroke="#94a3b8"
                strokeWidth={5}
            />
            <rect x={960} y={85} width={24} height={40} rx={5} fill="#94a3b8" />
            <rect x={650} y={60} width={150} height={90} rx={14} fill={PLUSS} />
            <rect x={800} y={60} width={150} height={90} rx={14} fill={MINUS} />
            <text
                x={725}
                y={128}
                textAnchor="middle"
                fontSize={70}
                fontWeight={900}
                fill="#ffffff"
                fontFamily={SKRIFT}
            >
                +
            </text>
            <text
                x={875}
                y={128}
                textAnchor="middle"
                fontSize={70}
                fontWeight={900}
                fill="#ffffff"
                fontFamily={SKRIFT}
            >
                −
            </text>
        </g>
    );
}

/** Et ord som skytes ut fra batteriet og lander på plassen sin. */
function Skudd({
    x,
    y,
    tekst,
    fs,
    fyll,
    farge = '#ffffff',
    forsinkelse = 0,
}: {
    x: number;
    y: number;
    tekst: string;
    fs: number;
    fyll: string;
    farge?: string;
    forsinkelse?: number;
}) {
    return (
        <motion.g
            initial={{ opacity: 0, x: 800 - x, y: 100 - y, scale: 0.4 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: forsinkelse, ease: [0.16, 1, 0.3, 1] }}
        >
            <Kort x={x} y={y} linjer={[tekst]} fs={fs} fyll={fyll} farge={farge} />
        </motion.g>
    );
}

function Kolonner({ venstre, hoyre }: { venstre: string; hoyre: string }) {
    return (
        <>
            <text
                x={400}
                y={235}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#4ade80"
                fontFamily={SKRIFT}
            >
                {venstre}
            </text>
            <text
                x={1200}
                y={235}
                textAnchor="middle"
                fontSize={44}
                fontWeight={900}
                fill="#f87171"
                fontFamily={SKRIFT}
            >
                {hoyre}
            </text>
        </>
    );
}

function Par({ beat }: { beat: number }) {
    const smaa = 32;
    if (beat === 0) {
        // Først batteriet alene, stort, med ett ord på hver pol.
        return (
            <>
                <g transform="translate(800 330) scale(1.9) translate(-800 -105)">
                    <Batteri />
                </g>
                <Kort
                    x={470}
                    y={520}
                    linjer={['+ pluss']}
                    fs={52}
                    fyll={PLUSS}
                    farge="#ffffff"
                    forsinkelse={0.4}
                />
                <Kort
                    x={1130}
                    y={520}
                    linjer={['− minus']}
                    fs={52}
                    fyll={MINUS}
                    farge="#ffffff"
                    forsinkelse={0.8}
                />
                <text
                    x={800}
                    y={740}
                    textAnchor="middle"
                    fontSize={46}
                    fontWeight={800}
                    fill="#e2e8f0"
                    fontFamily={SKRIFT}
                >
                    Ord har en ladning
                </text>
            </>
        );
    }
    return (
        <>
            <Batteri />
            <Kolonner venstre="+ plussord" hoyre="− minusord" />
            {beat >= 1 && (
                <>
                    <Skudd x={400} y={270} tekst="Hjem" fs={50} fyll={PLUSS} />
                    {[
                        { t: 'trygghet', x: 220 },
                        { t: 'varme', x: 400 },
                        { t: 'familie', x: 580 },
                    ].map((o, i) => (
                        <Kort
                            key={o.t}
                            x={o.x}
                            y={375}
                            linjer={[o.t]}
                            fs={smaa}
                            fyll="#dcfce7"
                            farge="#14532d"
                            forsinkelse={0.8 + i * 0.3}
                        />
                    ))}
                </>
            )}
            {beat >= 2 && (
                <>
                    <Skudd x={1200} y={270} tekst="Bolig" fs={50} fyll={MINUS} />
                    {[
                        { t: 'kaldt', x: 1030 },
                        { t: 'teknisk', x: 1200 },
                        { t: 'en vare', x: 1380 },
                    ].map((o, i) => (
                        <Kort
                            key={o.t}
                            x={o.x}
                            y={375}
                            linjer={[o.t]}
                            fs={smaa}
                            fyll="#fee2e2"
                            farge="#7f1d1d"
                            forsinkelse={0.8 + i * 0.3}
                        />
                    ))}
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <line
                            x1={560}
                            y1={305}
                            x2={1040}
                            y2={305}
                            stroke="#94a3b8"
                            strokeWidth={4}
                            strokeDasharray="12 10"
                        />
                        <rect x={680} y={278} width={240} height={50} rx={12} fill="#1f2937" />
                        <text
                            x={800}
                            y={314}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill="#e2e8f0"
                            fontFamily={SKRIFT}
                        >
                            samme hus
                        </text>
                    </motion.g>
                </>
            )}
            {beat >= 3 && (
                <>
                    <Skudd x={400} y={470} tekst="Frihet" fs={50} fyll={PLUSS} />
                    <Skudd x={1200} y={470} tekst="Lisens" fs={50} fyll={MINUS} forsinkelse={0.5} />
                    {[
                        { t: 'mulighet', x: 215 },
                        { t: 'rettighet', x: 400 },
                        { t: 'glede', x: 585 },
                    ].map((o, i) => (
                        <Kort
                            key={o.t}
                            x={o.x}
                            y={575}
                            linjer={[o.t]}
                            fs={smaa}
                            fyll="#dcfce7"
                            farge="#14532d"
                            forsinkelse={1 + i * 0.25}
                        />
                    ))}
                    {[
                        { t: 'begrensning', x: 1005 },
                        { t: 'plikt', x: 1200 },
                        { t: 'tvang', x: 1370 },
                    ].map((o, i) => (
                        <Kort
                            key={o.t}
                            x={o.x}
                            y={575}
                            linjer={[o.t]}
                            fs={smaa}
                            fyll="#fee2e2"
                            farge="#7f1d1d"
                            forsinkelse={1.6 + i * 0.25}
                        />
                    ))}
                </>
            )}
            {beat >= 4 && (
                <>
                    <Kort
                        x={400}
                        y={680}
                        linjer={['Saken føles god']}
                        fs={36}
                        fyll={PLUSS}
                        farge="#ffffff"
                    />
                    <Kort
                        x={1200}
                        y={680}
                        linjer={['Saken føles som et problem']}
                        fs={36}
                        fyll={MINUS}
                        farge="#ffffff"
                    />
                    <Kort
                        x={800}
                        y={790}
                        linjer={['Føles sant, men viser bare én side']}
                        fs={36}
                        fyll="#fbbf24"
                        forsinkelse={0.8}
                    />
                </>
            )}
        </>
    );
}

function Botox({ beat }: { beat: number }) {
    return (
        <>
            <Batteri />
            <Kolonner venstre="+ Å skrive selv" hoyre="− KI" />
            <rect
                x={160}
                y={265}
                width={480}
                height={330}
                rx={24}
                fill="none"
                stroke="#4ade80"
                strokeWidth={4}
                strokeDasharray="16 12"
                opacity={0.6}
            />
            <rect
                x={960}
                y={265}
                width={480}
                height={330}
                rx={24}
                fill="none"
                stroke="#f87171"
                strokeWidth={4}
                strokeDasharray="16 12"
                opacity={0.6}
            />
            {beat >= 1 &&
                [
                    { t: 'død', x: 1085, y: 310 },
                    { t: 'glatt', x: 1315, y: 310 },
                    { t: 'juks', x: 1085, y: 440 },
                    { t: 'stiv', x: 1315, y: 440 },
                ].map((o, i) => (
                    <Skudd
                        key={o.t}
                        x={o.x}
                        y={o.y}
                        tekst={o.t}
                        fs={46}
                        fyll={MINUS}
                        forsinkelse={i * 0.35}
                    />
                ))}
            {beat >= 2 &&
                [
                    { t: 'tilfredsstillende', y: 290 },
                    { t: 'menneskelig', y: 390 },
                    { t: 'å nå fram', y: 490 },
                ].map((o, i) => (
                    <Skudd
                        key={o.t}
                        x={400}
                        y={o.y}
                        tekst={o.t}
                        fs={38}
                        fyll={PLUSS}
                        forsinkelse={i * 0.4}
                    />
                ))}
            {beat >= 3 && (
                <>
                    <Kort
                        x={400}
                        y={625}
                        linjer={['Du skal føle stolthet']}
                        fs={36}
                        fyll="#bbf7d0"
                        farge="#14532d"
                    />
                    <Kort
                        x={1200}
                        y={625}
                        linjer={['Du skal føle avsky']}
                        fs={36}
                        fyll="#fecaca"
                        farge="#7f1d1d"
                        forsinkelse={0.5}
                    />
                </>
            )}
            {beat >= 4 && (
                <>
                    <Kort x={760} y={745} linjer={['Kan KI være nyttig?']} fs={40} fyll="#fef3c7" />
                    <Kryss x={1045} y={785} r={22} />
                    <text
                        x={1088}
                        y={797}
                        textAnchor="start"
                        fontSize={34}
                        fontWeight={800}
                        fill="#fca5a5"
                        fontFamily={SKRIFT}
                    >
                        aldri diskutert
                    </text>
                </>
            )}
        </>
    );
}

export function KommentarLadning({ beat, props }: VisualProps<{ modus: Modus }>) {
    const modus = props.modus ?? 'par';
    return (
        <Flate16x9 bakgrunn={BAK}>
            {modus === 'par' && <Par beat={beat} />}
            {modus === 'botox' && <Botox beat={beat} />}
        </Flate16x9>
    );
}
