import { BONDE, EMBETSMANN } from './farger';

/** Flate SVG-figurer for 2D-scenene. Hver type får sin egen drakt og et kjennetegn. */

export type FigurType =
    | 'prest'
    | 'offiser'
    | 'dommer'
    | 'amtmann'
    | 'bonde'
    | 'borger'
    | 'kvinne'
    | 'husmann'
    | 'tjeneste'
    | 'arbeider'
    | 'adel'
    | 'kjopmann'
    | 'skygge';

const DRAKT: Record<FigurType, string> = {
    prest: '#111827',
    offiser: EMBETSMANN,
    dommer: '#374151',
    amtmann: '#1e40af',
    bonde: BONDE,
    borger: '#7c3aed',
    kvinne: '#be185d',
    husmann: '#92400e',
    tjeneste: '#0e7490',
    arbeider: '#57534e',
    adel: '#a21caf',
    kjopmann: '#b45309',
    skygge: '#cbd5e1',
};

/** En figur med føttene i (0, 0), omtrent 220 høy ved skala 1. */
export function Figur({ type, farge }: { type: FigurType; farge?: string }) {
    const drakt = farge ?? DRAKT[type];
    const hud = type === 'skygge' ? '#e2e8f0' : '#f1c9a5';
    const kjole = type === 'prest' || type === 'dommer' || type === 'kvinne';
    return (
        <g>
            {kjole ? (
                <path d="M -52 0 L -40 -120 Q 0 -140 40 -120 L 52 0 Z" fill={drakt} />
            ) : (
                <>
                    <rect x={-34} y={-70} width={28} height={70} rx={8} fill="#334155" />
                    <rect x={6} y={-70} width={28} height={70} rx={8} fill="#334155" />
                    <path d="M -46 -60 L -40 -124 Q 0 -140 40 -124 L 46 -60 Z" fill={drakt} />
                </>
            )}
            <circle cy={-160} r={32} fill={hud} />
            {type === 'prest' && <ellipse cy={-126} rx={40} ry={13} fill="#ffffff" />}
            {type === 'dommer' && (
                <>
                    <path d="M -34 -194 Q 0 -214 34 -194 L 38 -150 L 26 -158 L 22 -184 L -22 -184 L -26 -158 L -38 -150 Z" fill="#f8fafc" />
                    <rect x={-10} y={-120} width={20} height={34} fill="#f8fafc" />
                </>
            )}
            {type === 'offiser' && (
                <>
                    <path d="M -46 -186 Q 0 -230 46 -186 Z" fill="#0f172a" />
                    <path d="M -40 -120 L 40 -70" stroke="#dc2626" strokeWidth={10} />
                    <rect x={-50} y={-128} width={20} height={8} fill="#eab308" />
                    <rect x={30} y={-128} width={20} height={8} fill="#eab308" />
                </>
            )}
            {type === 'amtmann' && (
                <>
                    <rect x={-26} y={-236} width={52} height={50} rx={4} fill="#0f172a" />
                    <rect x={-40} y={-190} width={80} height={8} rx={4} fill="#0f172a" />
                    {[-108, -92, -76].map((y) => (
                        <circle key={y} cy={y} r={5} fill="#eab308" />
                    ))}
                </>
            )}
            {type === 'bonde' && <path d="M -36 -178 Q 0 -214 36 -178 Q 0 -186 -36 -178 Z" fill="#7f1d1d" />}
            {type === 'husmann' && <path d="M -34 -176 Q 0 -206 34 -176 Z" fill="#57534e" />}
            {type === 'arbeider' && <path d="M -36 -178 Q 0 -206 36 -178 L 46 -172 L -36 -172 Z" fill="#292524" />}
            {type === 'borger' && (
                <>
                    <rect x={-22} y={-228} width={44} height={40} rx={4} fill="#1f2937" />
                    <rect x={-34} y={-192} width={68} height={7} rx={3} fill="#1f2937" />
                </>
            )}
            {type === 'kjopmann' && (
                <>
                    <rect x={-22} y={-226} width={44} height={38} rx={4} fill="#1f2937" />
                    <rect x={-34} y={-192} width={68} height={7} rx={3} fill="#1f2937" />
                    <circle cx={56} cy={-62} r={22} fill="#eab308" />
                </>
            )}
            {type === 'adel' && (
                <path d="M -30 -186 L -30 -212 L -15 -198 L 0 -218 L 15 -198 L 30 -212 L 30 -186 Z" fill="#eab308" />
            )}
            {type === 'kvinne' && <path d="M -34 -168 Q 0 -212 34 -168 Q 30 -150 34 -134 L -34 -134 Q -30 -150 -34 -168 Z" fill="#7c2d12" opacity={0.85} />}
            {type === 'tjeneste' && <path d="M -32 -176 Q 0 -206 32 -176 Z" fill="#f8fafc" />}
        </g>
    );
}

/** Navnelapp under en figur. */
export function Lapp({ tekst, y = 50, storrelse = 32 }: { tekst: string; y?: number; storrelse?: number }) {
    const linjer = tekst.split('\n');
    return (
        <g>
            {linjer.map((l, i) => (
                <text
                    key={i}
                    y={y + i * (storrelse + 6)}
                    textAnchor="middle"
                    fontSize={storrelse}
                    fontWeight={800}
                    fill="#0f172a"
                >
                    {l}
                </text>
            ))}
        </g>
    );
}
