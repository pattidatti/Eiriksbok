// Hint fra systemene (tyven, opplæringen): ett kort nederst i midten, der blikket er.
export function SystemHint({ data }: { data: unknown }) {
    const tekst = (data as { tekst?: unknown } | null)?.tekst;
    if (typeof tekst !== 'string') return null;
    return (
        <div className="max-w-xl rounded-xl bg-amber-50/95 px-4 py-2 text-center text-[16px] font-semibold text-amber-900 shadow-lg ring-1 ring-amber-300">
            {tekst}
        </div>
    );
}
