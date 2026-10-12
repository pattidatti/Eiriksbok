import { Link, useLocation } from 'react-router-dom';
import { Check, Play } from 'lucide-react';
import { filmLenke, setteFilmer } from './filmIndex';
import { useFilmInfo } from './useFilmInfo';

/**
 * Filmknappen ved siden av en artikkellenke i stien. Filmen sender eleven tilbake hit
 * (?fra=) når den er ferdig. `stor` matcher lenkeknappene i v1-stien.
 */
export function FilmKnapp({ sti, stor = false }: { sti: string; stor?: boolean }) {
    const { pathname } = useLocation();
    const { lengde } = useFilmInfo(sti);
    const sett = setteFilmer().has(sti.replace(/^\//, ''));
    const Ikon = sett ? Check : Play;
    const tekst = stor ? (sett ? 'Film sett - se igjen' : 'Se som film') : 'Film';
    return (
        <Link
            to={`${filmLenke(sti)}?fra=${encodeURIComponent(pathname)}`}
            title={sett ? 'Du har sett filmen. Se den igjen.' : 'Se artikkelen som film'}
            className={`inline-flex shrink-0 items-center gap-1.5 font-bold transition-colors ${
                stor ? 'rounded-lg px-4 py-2 text-xs' : 'rounded-full px-2.5 py-1 text-xs'
            } ${
                sett
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50'
            }`}
        >
            <Ikon className={`h-3.5 w-3.5 ${sett ? '' : 'fill-current'}`} />
            {tekst}
            {lengde && <span className="font-semibold opacity-70">· {lengde}</span>}
        </Link>
    );
}
