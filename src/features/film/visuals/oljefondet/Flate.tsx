import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * En fast tegneflate på 1000x562 px som skaleres til hele bildet. Lerretet er minst 1000 px
 * bredt, men kan være bredere på store skjermer. Da vokser flaten med, i stedet for å bli
 * liggende i hjørnet.
 */
export function OljefondetFlate({ children, bakgrunn }: { children: ReactNode; bakgrunn: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [skala, setSkala] = useState(1);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const mal = () => setSkala(Math.min(el.clientWidth / 1000, el.clientHeight / 562) || 1);
        mal();
        const ro = new ResizeObserver(mal);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    return (
        <div ref={ref} className="absolute inset-0 overflow-hidden" style={{ background: bakgrunn }}>
            <div
                className="absolute origin-top-left"
                style={{ left: 0, top: 0, width: 1000, height: 562, transform: `scale(${skala})` }}
            >
                {children}
            </div>
        </div>
    );
}
