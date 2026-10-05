// Tidslinja på slutt-skjermen og fargene den deler med HUD-en i KongensTallerkener.tsx.

export const GOLD = '#d4a640';
export const CREAM = '#f3e6c4';
export const KRONE = 'M2 12 L2 5 L6 8 L9 2 L12 8 L16 5 L16 12 Z';

/** Tidslinja på slutt-skjermen: 1629-1649, gullstripa er året du nådde. Merker for 1640, 1642 og 1649. */
export function YearBar({ aar, best }: { aar: number; best: number }) {
    const fra = 1629;
    const span = 1649 - fra;
    const pct = (n: number) => `${Math.max(0, Math.min(100, ((n - fra) / span) * 100))}%`;
    const merker: [number, string][] = [
        [1640, '1640'],
        [1642, '1642'],
        [1649, '1649'],
    ];
    return (
        <div style={{ width: 'min(440px, 82%)', margin: '18px auto 12px', position: 'relative' }}>
            <div style={{ height: 10, border: `1px solid ${GOLD}`, background: '#0a0f1c', position: 'relative' }}>
                <div style={{ width: pct(aar), height: '100%', background: 'linear-gradient(90deg,#8a6420,#f0d58a)' }} />
                {best > fra && (
                    <div style={{ position: 'absolute', left: pct(best), top: -3, width: 2, height: 14, background: CREAM }} title="Rekord" />
                )}
            </div>
            <div style={{ position: 'absolute', left: pct(1640), top: -16, transform: 'translateX(-50%)', textAlign: 'center' }}>
                <svg viewBox="0 0 18 14" width={18} height={14} aria-hidden>
                    <path d={KRONE} fill="#f0d58a" stroke="#6b4a14" strokeWidth={0.8} />
                </svg>
            </div>
            <div style={{ position: 'relative', height: 18, fontSize: 14, marginTop: 3, fontFamily: 'Outfit, sans-serif' }}>
                <span style={{ position: 'absolute', left: 0 }}>1629</span>
                {merker.map(([y, t]) => (
                    <span key={y} style={{ position: 'absolute', left: pct(y), transform: y === 1642 ? 'translateX(2px)' : 'translateX(calc(-100% - 2px))', whiteSpace: 'nowrap' }}>
                        {t}
                    </span>
                ))}
            </div>
        </div>
    );
}
