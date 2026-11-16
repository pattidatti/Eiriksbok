import { motion } from 'framer-motion';
import type { VisualProps } from '../../types';
import { FARGE } from './farger';
import { Bilde, Dom, Hode, Lerret, Merke, Overskrift, Vis } from './felles';

/**
 * Lyd og tekst i klippeprogrammet: et bilde øverst og spor under.
 * - reallyd: lydsporet som den usynlige halvdelen, reallyd, dårlig lyd og ren lyd.
 * - dubbing: skuespilleren sier replikkene på nytt foran skjermen, og ny lyd erstatter den gamle.
 * - teksting: hvor teksten står, hvor mange linjer, skygge, og tekstsporet som legges til sist.
 */

type Modus = 'reallyd' | 'dubbing' | 'teksting';

/** Lydbølge som en sti. `stoy` 0-1 gjør den urolig. */
function bolge(x: number, y: number, b: number, hoyde: number, stoy: number, frø = 1) {
    const deler: string[] = [];
    const n = 90;
    for (let i = 0; i <= n; i++) {
        const px = x + (b * i) / n;
        const tale = Math.abs(Math.sin(i * 0.35 + frø)) * (i % 18 < 12 ? 1 : 0.15);
        const sus = (Math.sin(i * 12.9898 + frø * 78.233) * 43758.5453) % 1;
        const a = hoyde * (tale * 0.8 + stoy * Math.abs(sus) * 0.9);
        deler.push(
            `M ${px.toFixed(1)} ${(y - a).toFixed(1)} L ${px.toFixed(1)} ${(y + a).toFixed(1)}`
        );
    }
    return deler.join(' ');
}

function Spor({
    y,
    navn,
    farge,
    children,
}: {
    y: number;
    navn: string;
    farge: string;
    children?: React.ReactNode;
}) {
    return (
        <g>
            <text
                x={70}
                y={y + 12}
                fontSize={30}
                fontWeight={800}
                fill={farge}
                className="font-display"
            >
                {navn}
            </text>
            <rect x={300} y={y - 50} width={1230} height={100} rx={14} fill="#e2e8f0" />
            {children}
        </g>
    );
}

/** Et enkelt bilde av skolegangen. */
function Gangbilde({ x, y, b, h }: { x: number; y: number; b: number; h: number }) {
    const mx = x + b / 2;
    return (
        <Bilde x={x} y={y} b={b} h={h} bakgrunn="#cbd5e1">
            <path
                d={`M ${x} ${y + h} L ${mx - b * 0.12} ${y + h * 0.55} L ${mx + b * 0.12} ${y + h * 0.55} L ${x + b} ${y + h} Z`}
                fill="#94a3b8"
            />
            <path
                d={`M ${x} ${y} L ${mx - b * 0.12} ${y + h * 0.3} L ${mx - b * 0.12} ${y + h * 0.55} L ${x} ${y + h} Z`}
                fill="#2563eb"
                opacity={0.8}
            />
            <rect
                x={mx - b * 0.12}
                y={y + h * 0.3}
                width={b * 0.24}
                height={h * 0.25}
                fill="#e0f2fe"
            />
        </Bilde>
    );
}

function Reallyd({ beat }: { beat: number }) {
    const overskrift = [
        'Lyden: den usynlige halvdelen',
        'Reallyd: lydene på stedet',
        'Dårlig lyd merkes med én gang',
        'Bedre lyd uten nytt utstyr',
    ][Math.min(beat, 3)];
    const stoy = beat === 2 ? 1 : 0;
    const farge = beat === 2 ? FARGE.rod : beat === 3 ? FARGE.gronn : FARGE.lilla;
    return (
        <>
            <Overskrift tekst={overskrift} />
            <Gangbilde x={500} y={150} b={600} h={340} />
            {/* Lydbølger rundt bildet når reallyden vises */}
            <Vis nar={beat >= 1}>
                {[0, 1, 2].map((i) => (
                    <g key={i}>
                        <path
                            d={`M ${460 - i * 34} ${250 - i * 20} Q ${430 - i * 40} ${320} ${460 - i * 34} ${390 + i * 20}`}
                            stroke={farge}
                            strokeWidth={8}
                            fill="none"
                            strokeLinecap="round"
                            opacity={1 - i * 0.25}
                        />
                        <path
                            d={`M ${1140 + i * 34} ${250 - i * 20} Q ${1170 + i * 40} ${320} ${1140 + i * 34} ${390 + i * 20}`}
                            stroke={farge}
                            strokeWidth={8}
                            fill="none"
                            strokeLinecap="round"
                            opacity={1 - i * 0.25}
                        />
                    </g>
                ))}
            </Vis>
            <Spor y={600} navn="Bilde" farge={FARGE.bla}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <rect
                        key={i}
                        x={310 + i * 203}
                        y={560}
                        width={195}
                        height={80}
                        rx={8}
                        fill={FARGE.bla}
                    />
                ))}
            </Spor>
            <Spor y={740} navn="Lyd" farge={farge}>
                {beat === 0 ? (
                    <rect
                        x={310}
                        y={700}
                        width={1210}
                        height={80}
                        rx={8}
                        fill="none"
                        stroke={FARGE.lilla}
                        strokeWidth={5}
                        strokeDasharray="20 14"
                    />
                ) : (
                    <motion.path
                        key={beat}
                        d={bolge(320, 740, 1190, 40, stoy, beat)}
                        stroke={farge}
                        strokeWidth={6}
                        strokeLinecap="round"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    />
                )}
            </Spor>
            <Vis nar={beat === 1}>
                <Merke x={800} y={850} tekst="forteller hvor vi er" farge={FARGE.lilla} str={32} />
            </Vis>
            <Vis nar={beat === 2}>
                <Dom x={1270} y={180} ok={false} r={44} />
                <Merke x={800} y={850} tekst="sus, vind og ekko" farge={FARGE.rod} str={32} />
            </Vis>
            <Vis nar={beat === 3}>
                <Dom x={1270} y={180} ok r={44} />
            </Vis>
        </>
    );
}

function Dubbing({ beat }: { beat: number }) {
    const overskrift = [
        'Dubbing (ADR)',
        'Først: film og klipp',
        'Så: si replikkene på nytt',
        'Ny lyd inn, gammel lyd ut',
    ][Math.min(beat, 3)];
    return (
        <>
            <Overskrift tekst={overskrift} />
            {beat === 0 && (
                <>
                    <text
                        x={800}
                        y={330}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={800}
                        fill={FARGE.blekk}
                        className="font-display"
                    >
                        Replikkene tas opp på nytt,
                    </text>
                    <text
                        x={800}
                        y={410}
                        textAnchor="middle"
                        fontSize={50}
                        fontWeight={800}
                        fill={FARGE.blekk}
                        className="font-display"
                    >
                        innendørs, etter filmingen
                    </text>
                    <Merke
                        x={800}
                        y={540}
                        tekst="ADR: Automatic Dialogue Replacement"
                        farge={FARGE.lilla}
                        str={34}
                    />
                </>
            )}
            {beat >= 1 && (
                <>
                    {/* Skjermen med scenen, og skuespilleren foran når det dubbes */}
                    <Bilde x={beat >= 2 ? 300 : 500} y={150} b={600} h={300} bakgrunn="#334155">
                        <Hode x={beat >= 2 ? 600 : 800} y={290} r={60} farge="#0f766e" ser={0.5} />
                    </Bilde>
                    <Vis nar={beat >= 2}>
                        <Hode x={1150} y={250} r={60} farge="#0f766e" ser={-0.5} />
                        {/* Mikrofon */}
                        <rect x={1035} y={300} width={30} height={60} rx={15} fill="#334155" />
                        <line
                            x1={1050}
                            y1={360}
                            x2={1050}
                            y2={440}
                            stroke="#334155"
                            strokeWidth={8}
                        />
                        <text
                            x={1150}
                            y={140}
                            textAnchor="middle"
                            fontSize={30}
                            fontWeight={700}
                            fill={FARGE.gra}
                        >
                            ser seg selv på skjermen
                        </text>
                    </Vis>
                    <Spor y={560} navn="Bilde" farge={FARGE.bla}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <rect
                                key={i}
                                x={310 + i * 243}
                                y={520}
                                width={235}
                                height={80}
                                rx={8}
                                fill={FARGE.bla}
                            />
                        ))}
                    </Spor>
                    <Spor y={690} navn="Opptakslyd" farge={beat === 3 ? FARGE.gra : FARGE.rod}>
                        <path
                            d={bolge(320, 690, 1190, 36, 1, 2)}
                            stroke={FARGE.rod}
                            strokeWidth={6}
                            opacity={beat === 3 ? 0.25 : 1}
                        />
                    </Spor>
                    <Vis nar={beat === 3}>
                        <Dom x={1570} y={690} ok={false} r={26} />
                    </Vis>
                    <Spor y={820} navn="Ny lyd" farge={FARGE.gronn}>
                        {beat >= 2 && (
                            <motion.path
                                d={bolge(320, 820, 1190, 36, 0, 2)}
                                stroke={FARGE.gronn}
                                strokeWidth={6}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 1.2 }}
                            />
                        )}
                    </Spor>
                    <Vis nar={beat === 3}>
                        <Dom x={1570} y={820} ok r={26} />
                        <Merke
                            x={1250}
                            y={470}
                            tekst="Selv Hollywood gjør det"
                            farge={FARGE.gul}
                            str={30}
                        />
                    </Vis>
                </>
            )}
        </>
    );
}

/** Et lite filmbilde med teksting. `lyst` gir lys himmel bak teksten. */
function Tekstbilde({
    x,
    y,
    linjer,
    plass,
    skygge,
    lyst,
}: {
    x: number;
    y: number;
    linjer: string[];
    plass: 'midt' | 'bunn';
    skygge: boolean;
    lyst: boolean;
}) {
    const b = 620;
    const h = 350;
    const start =
        plass === 'midt'
            ? y + h / 2 - ((linjer.length - 1) * 40) / 2
            : y + h - 30 - (linjer.length - 1) * 40;
    return (
        <Bilde x={x} y={y} b={b} h={h} bakgrunn={lyst ? '#f1f5f9' : '#475569'}>
            {lyst ? (
                <circle cx={x + b * 0.75} cy={y + 90} r={50} fill="#fef9c3" />
            ) : (
                <rect x={x} y={y + h * 0.6} width={b} height={h * 0.4} fill="#334155" />
            )}
            <Hode x={x + b * 0.32} y={y + 140} r={50} farge="#0f766e" />
            {linjer.map((l, i) => (
                <text
                    key={l}
                    x={x + b / 2}
                    y={start + i * 40}
                    textAnchor="middle"
                    fontSize={30}
                    fontWeight={800}
                    fill="#fff"
                    stroke={skygge ? '#000' : 'none'}
                    strokeWidth={skygge ? 6 : 0}
                    paintOrder="stroke"
                >
                    {l}
                </text>
            ))}
        </Bilde>
    );
}

function Teksting({ beat }: { beat: number }) {
    const overskrift = [
        'Teksting hjelper mange',
        'Nederst, og maks to linjer',
        'Hvit tekst med svart skygge',
        'Tekstingen kommer aller sist',
    ][Math.min(beat, 3)];
    const VENSTRE = 160;
    const HOYRE = 820;
    return (
        <>
            <Overskrift tekst={overskrift} />
            {beat === 0 && (
                <>
                    <Tekstbilde
                        x={490}
                        y={170}
                        linjer={['Han sendte ikke engang', 'melding til bursdagen min.']}
                        plass="bunn"
                        skygge
                        lyst={false}
                    />
                    <Merke x={560} y={640} tekst="nedsatt hørsel" farge={FARGE.bla} str={36} />
                    <Merke
                        x={1040}
                        y={640}
                        tekst="mye støy rundt deg"
                        farge={FARGE.lilla}
                        str={36}
                    />
                </>
            )}
            {beat === 1 && (
                <>
                    <Tekstbilde
                        x={VENSTRE}
                        y={200}
                        linjer={['Han sendte ikke', 'engang melding til', 'bursdagen min.']}
                        plass="midt"
                        skygge
                        lyst={false}
                    />
                    <Tekstbilde
                        x={HOYRE}
                        y={200}
                        linjer={['Han sendte ikke engang', 'melding til bursdagen min.']}
                        plass="bunn"
                        skygge
                        lyst={false}
                    />
                    <Dom x={VENSTRE + 310} y={620} ok={false} />
                    <Dom x={HOYRE + 310} y={620} ok />
                    <text
                        x={VENSTRE + 310}
                        y={710}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={FARGE.rod}
                    >
                        midt i, tre linjer
                    </text>
                    <text
                        x={HOYRE + 310}
                        y={710}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={FARGE.gronn}
                    >
                        nederst, to linjer
                    </text>
                </>
            )}
            {beat === 2 && (
                <>
                    <Tekstbilde
                        x={VENSTRE}
                        y={200}
                        linjer={['Han sendte ikke engang', 'melding til bursdagen min.']}
                        plass="bunn"
                        skygge={false}
                        lyst
                    />
                    <Tekstbilde
                        x={HOYRE}
                        y={200}
                        linjer={['Han sendte ikke engang', 'melding til bursdagen min.']}
                        plass="bunn"
                        skygge
                        lyst
                    />
                    <Dom x={VENSTRE + 310} y={620} ok={false} />
                    <Dom x={HOYRE + 310} y={620} ok />
                    <text
                        x={VENSTRE + 310}
                        y={710}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={FARGE.rod}
                    >
                        bare hvit: forsvinner
                    </text>
                    <text
                        x={HOYRE + 310}
                        y={710}
                        textAnchor="middle"
                        fontSize={32}
                        fontWeight={700}
                        fill={FARGE.gronn}
                    >
                        hvit med svart skygge
                    </text>
                </>
            )}
            {beat === 3 && (
                <>
                    <Spor y={260} navn="Bilde" farge={FARGE.bla}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <rect
                                key={i}
                                x={310 + i * 243}
                                y={220}
                                width={235}
                                height={80}
                                rx={8}
                                fill={FARGE.bla}
                            />
                        ))}
                    </Spor>
                    <Spor y={390} navn="Lyd" farge={FARGE.lilla}>
                        <path
                            d={bolge(320, 390, 1190, 34, 0, 3)}
                            stroke={FARGE.lilla}
                            strokeWidth={6}
                        />
                    </Spor>
                    <Merke
                        x={915}
                        y={500}
                        tekst="1  Klippingen er ferdig"
                        farge={FARGE.gronn}
                        str={32}
                    />
                    <Spor y={620} navn="Tekst" farge={FARGE.gul}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <motion.rect
                                key={i}
                                x={330 + i * 243}
                                y={590}
                                width={180}
                                height={60}
                                rx={8}
                                fill={FARGE.gul}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 + i * 0.3 }}
                            />
                        ))}
                    </Spor>
                    <Merke
                        x={915}
                        y={740}
                        tekst="2  Så kommer tekstingen"
                        farge={FARGE.gul}
                        str={32}
                    />
                </>
            )}
        </>
    );
}

export function KortfilmLyd({ beat, props }: VisualProps<{ modus?: Modus }>) {
    const modus: Modus = props?.modus ?? 'reallyd';
    return (
        <Lerret>
            {modus === 'reallyd' && <Reallyd beat={beat} />}
            {modus === 'dubbing' && <Dubbing beat={beat} />}
            {modus === 'teksting' && <Teksting beat={beat} />}
        </Lerret>
    );
}
