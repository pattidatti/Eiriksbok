// Filmscenen over spillet (sekvens.ts): svarte striper oppe og nede, teksten nederst, «hopp over»
// og svart overgang når filmen begynner og slutter. Over navneskiltene og boblene (z 1000).
import type { FilmHud } from './sekvens';

export function FilmVisning({ f }: { f: FilmHud }) {
    return (
        <div className="pointer-events-none absolute inset-0 z-[1100]">
            <div className="absolute inset-x-0 top-0 h-[9vh] bg-black" />
            <div className="absolute inset-x-0 bottom-0 flex h-[13vh] items-center justify-center bg-black px-6">
                {f.tekst && (
                    <p key={f.tekst} className="bryggen-filmtekst max-w-3xl text-center font-[Outfit,Inter,sans-serif] text-[20px] font-semibold leading-snug text-amber-50">
                        {f.tekst}
                    </p>
                )}
            </div>
            <div className="absolute bottom-[13vh] right-4 mb-2 rounded-lg bg-black/55 px-3 py-1 text-[13px] font-semibold text-white/85">
                {f.hopp}
            </div>
            <div
                className="absolute inset-0 bg-black transition-opacity duration-[400ms]"
                style={{ opacity: f.svart ? 1 : 0 }}
            />
            <style>{`.bryggen-filmtekst{animation:bryggen-filmtekst .6s ease-out both}
@keyframes bryggen-filmtekst{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
        </div>
    );
}
