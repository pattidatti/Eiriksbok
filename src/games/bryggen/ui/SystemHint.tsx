// Hint fra systemene (tyven, opplæringen): ett kort nederst i midten, der blikket er.
import { KORT } from './stil';

export function SystemHint({ data }: { data: unknown }) {
    const tekst = (data as { tekst?: unknown } | null)?.tekst;
    if (typeof tekst !== 'string') return null;
    return (
        <div className={`max-w-xl border-b-[3px] border-b-[#b07d24] px-5 py-2 text-center text-[17px] font-semibold text-[#2b1d10] ${KORT}`}>
            {tekst}
        </div>
    );
}
