import { useQuery } from '@tanstack/react-query';
import { hentManus } from './filmIndex';
import { LYD_BASE } from './useFilmNarrator';

/** Tittel, plakat og lengde for en film. Manuset lastes først når noen spør. */
export function useFilmInfo(sti: string) {
    const { data: lyd } = useQuery<Record<string, { varighet?: number }> | null>({
        queryKey: ['film-lyd-varighet'],
        queryFn: async () => {
            const svar = await fetch(`${LYD_BASE}/filmer.json`);
            return svar.ok ? ((await svar.json()).filmer ?? null) : null;
        },
        staleTime: 1000 * 60 * 5,
        retry: 1,
    });
    const { data: manus } = useQuery({
        queryKey: ['film-manus', sti],
        queryFn: () => hentManus(sti),
        staleTime: Infinity,
    });
    const sek = lyd?.[sti.replace(/^\//, '')]?.varighet;
    return {
        tittel: manus?.tittel,
        bilde: manus?.bilde,
        scener: manus?.scener.length,
        lengde: sek ? `${Math.max(1, Math.round(sek / 60))} min` : null,
    };
}
