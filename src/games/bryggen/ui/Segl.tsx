// Et voksegl med en kogge preget inn: på startskjermen og når et oppdrag er fullført.
// Kogga var skipet hanseatene seilte med [V] (SNL, «kogge»). Lübecks bysegl fra 1200-tallet viser et
// skip [K] (kilde ikke sjekket her). Seglet i spillet er pynt, ikke en kopi av et bestemt segl [S].

// Kanten på voksen: en sirkel som buler litt ut og inn, alltid lik (ingen tilfeldighet).
function voksKant(r: number, n = 22): string {
    const pkt: string[] = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = r * (1 + 0.06 * Math.sin(i * 2.7) + 0.035 * Math.cos(i * 5.3));
        pkt.push(`${(50 + Math.cos(a) * rr).toFixed(1)},${(50 + Math.sin(a) * rr).toFixed(1)}`);
    }
    return `M${pkt.join(' L')} Z`;
}

const KANT = voksKant(44);

export function Segl({ className = '', storrelse = 96 }: { className?: string; storrelse?: number }) {
    return (
        <svg viewBox="0 0 100 100" width={storrelse} height={storrelse} className={className} aria-hidden="true">
            <defs>
                <radialGradient id="bry-voks" cx="38%" cy="32%" r="75%">
                    <stop offset="0" stopColor="#c8513a" />
                    <stop offset="0.55" stopColor="#9a2a1c" />
                    <stop offset="1" stopColor="#6a160c" />
                </radialGradient>
            </defs>
            <path d={KANT} fill="url(#bry-voks)" stroke="#5a1208" strokeWidth={1} strokeLinejoin="round" />
            {/* Ringen der stempelet traff */}
            <circle cx={50} cy={50} r={31} fill="none" stroke="#5e130a" strokeWidth={2.2} opacity={0.75} />
            <circle cx={50} cy={50} r={31} fill="none" stroke="#e98a70" strokeWidth={0.8} opacity={0.5} transform="translate(0.8 0.8)" />
            {/* Kogga: skrog, kasteller, mast og råseil, preget inn (mørkt med lys kant under) */}
            <g fill="#641509" stroke="#e98a70" strokeWidth={0.6} strokeOpacity={0.55}>
                <path d="M30 56 L70 56 L65 66 Q50 69 35 66 Z" />
                <path d="M30 56 L30 51 L36 51 L36 56 Z" />
                <path d="M64 56 L64 50 L70 50 L70 56 Z" />
                <rect x={49} y={30} width={2} height={26} />
                <path d="M39 34 Q50 31 61 34 L60 49 Q50 46 40 49 Z" />
            </g>
            {/* Lyset på voksen */}
            <ellipse cx={37} cy={30} rx={10} ry={5} fill="#fff" opacity={0.18} transform="rotate(-30 37 30)" />
        </svg>
    );
}
