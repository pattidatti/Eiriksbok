import React, { useEffect, useState } from 'react';
import { List } from 'lucide-react';
import type { ArticleHeading } from '../utils/articleHeadings';

interface TableOfContentsProps {
    headings: ArticleHeading[];
}

/**
 * Innholdsfortegnelse for rich-artikler.
 *
 * Lista er høydebegrenset og scroller internt. Det er ikke pynt: baseline-
 * skjermen er 1366x768, og en artikkel med tolv seksjoner ville ellers dyttet
 * tidslinja og «Relatert innhold» ut av sidebaren.
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings }) => {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (!headings.length) return;

        // Aktiv seksjon = den siste overskriften som har passert toppen av
        // skjermen. Vi leser posisjonen i stedet for å lytte på når en
        // overskrift krysser et bånd: et smalt bånd lar det være ingen aktiv
        // seksjon i det hele tatt mellom to overskrifter, og et hopp rett ned i
        // artikkelen (lenke, eller gjenopptatt scroll-posisjon) hopper rett
        // over båndet uten å utløse noe.
        let frame = 0;

        const update = () => {
            frame = 0;
            // Litt under den faste toppmenyen, så overskriften teller som
            // «nådd» omtrent når eleven ser den øverst på skjermen.
            const line = 120;
            let current = headings[0].id;
            for (const h of headings) {
                const el = document.getElementById(h.id);
                if (el && el.getBoundingClientRect().top <= line) current = h.id;
                else break;
            }
            setActiveId(current);
        };

        const onScroll = () => {
            if (!frame) frame = window.requestAnimationFrame(update);
        };

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [headings]);

    if (headings.length < 2) return null;

    return (
        <nav aria-label="Innhold i artikkelen" className="mb-8">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center uppercase tracking-wider text-sm">
                <List className="w-4 h-4 mr-2 text-indigo-600" />
                Innhold
            </h3>
            <ul className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {headings.map((h) => {
                    const isActive = h.id === activeId;
                    return (
                        <li key={h.id}>
                            <a
                                href={`#${h.id}`}
                                aria-current={isActive ? 'true' : undefined}
                                className={`block border-l-2 pl-3 py-1.5 text-sm transition-colors ${
                                    isActive
                                        ? 'border-indigo-500 text-indigo-700 font-semibold'
                                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                                }`}
                            >
                                {h.text}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};
