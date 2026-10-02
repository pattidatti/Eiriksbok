import type { BismerHud } from './bismer';

// Bismeren tegnet stort midt på skjermen mens en bunt veies: stanga vipper rundt hanken,
// bunten henger i kroken til venstre, kolla er den tunge enden til høyre. Merkene er bismerpund.

const L = 460;

export function BismerVisning({ b }: { b: BismerHud }) {
    const grader = (b.vinkel * 180) / Math.PI;
    const rett = Math.abs(b.vinkel) < 0.025;
    const venstre = -b.p * L;
    const hoyre = (1 - b.p) * L;
    // Kroken følger enden av stanga; bunten henger alltid rett ned.
    const kx = Math.cos(b.vinkel) * venstre;
    const ky = Math.sin(b.vinkel) * venstre;
    return (
        <div className="pointer-events-none absolute left-1/2 top-[30%] w-[min(640px,94vw)] -translate-x-1/2 rounded-2xl bg-white px-4 pb-3 pt-3 shadow-xl">
            <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-bold uppercase tracking-wide text-indigo-700">Bismeren</span>
                <span className={`text-[14px] font-semibold ${rett ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {rett ? 'Stanga ligger vannrett: les av med E' : 'A / D: flytt hanken'}
                </span>
            </div>
            <svg viewBox="-300 -80 600 270" className="mt-1 w-full">
                {/* Hånda og tauet i hanken */}
                <line x1={0} y1={-60} x2={0} y2={-8} stroke="#7c5a3a" strokeWidth={3} />
                <rect x={-14} y={-70} width={28} height={14} rx={6} fill="#d9a88a" />
                <g transform={`rotate(${grader})`}>
                    {/* Stanga, tykkere mot kolla */}
                    <path d={`M ${venstre} -5 L ${hoyre - 30} -9 L ${hoyre - 30} 9 L ${venstre} 5 Z`} fill="#8a6440" />
                    <ellipse cx={hoyre - 18} cy={0} rx={26} ry={20} fill="#6b4a2c" />
                    {b.merker.map((m) => {
                        const x = (m.p - b.p) * L;
                        if (x < venstre + 10 || x > hoyre - 46) return null;
                        return (
                            <g key={m.p}>
                                <line x1={x} y1={-5} x2={x} y2={m.hel ? 12 : 7} stroke="#2b1d12" strokeWidth={m.hel ? 2.5 : 1.5} />
                                {m.tekst && (
                                    <text x={x} y={28} textAnchor="middle" fontSize={16} fontWeight={700} fill="#1e293b">
                                        {m.tekst}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    {/* Hanken: en ring av tau rundt stanga */}
                    <rect x={-6} y={-12} width={12} height={24} rx={4} fill="none" stroke={rett ? '#047857' : '#7c5a3a'} strokeWidth={4} />
                </g>
                {/* Kroken og bunten */}
                <line x1={kx} y1={ky} x2={kx} y2={ky + 38} stroke="#475569" strokeWidth={3} />
                <rect x={kx - 34} y={ky + 38} width={68} height={60} rx={8} fill="#c8b48a" stroke="#8a7350" strokeWidth={2} />
                <line x1={kx - 34} y1={ky + 58} x2={kx + 34} y2={ky + 58} stroke="#7a5c37" strokeWidth={3} />
                <line x1={kx - 34} y1={ky + 80} x2={kx + 34} y2={ky + 80} stroke="#7a5c37" strokeWidth={3} />
            </svg>
            {b.juks && (
                <p className="mb-1 rounded-lg bg-amber-50 px-2 py-1 text-[14px] font-semibold text-amber-800">
                    E: si det merket viser · 2: si et halvt pund mindre, slik svennen vil
                </p>
            )}
            <p className="text-[13px] text-slate-600">
                Bunten henger i kroken, kolla er den tunge enden. Når stanga ligger vannrett, viser merket ved hanken vekta i bismerpund
                (ett bismerpund er ca. 5 kg).
            </p>
        </div>
    );
}
