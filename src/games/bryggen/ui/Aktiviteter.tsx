// HUD-en for aktivitetene i sideoppdragene: hvert system (graboks/systemer.ts) legger dataene sine i
// `HudState.system[navn]`, og her velges komponenten som tegner dem. HUD-en (ui/Hud.tsx) hekter på med én linje:
// `<Aktiviteter system={hud.system} />` i kolonnen nederst i midten, og `<AktiviteterVenstre>` i kolonnen
// oppe til venstre under livskortet (det som må synes mens man ser midt i bildet: fisken, flammen).
// Panelene har ingen egen plassering: kolonnene i Hud.tsx stabler dem, så de aldri legger seg oppå noe.
import type { MesseHud } from '../graboks/messe';
import type { RottejaktHud } from '../graboks/rottejakt';
import type { SyrytmeHud } from '../graboks/syrytme';
import type { TerningHud } from '../graboks/terning';
import { Flamme, Messe } from './Messe';
import { Rottejakt } from './Rottejakt';
import { Syrytme } from './Syrytme';
import { Terning } from './Terning';
import { Kontor } from './Kontor';

export function AktiviteterVenstre({ system }: { system: Record<string, unknown> }) {
    const rotter = system.rottejakt as RottejaktHud | null | undefined;
    const messe = system.messe as MesseHud | null | undefined;
    return (
        <>
            {rotter && <Rottejakt h={rotter} />}
            {messe && messe.flamme !== null && <Flamme f={messe.flamme} />}
        </>
    );
}

export function Aktiviteter({ system }: { system: Record<string, unknown> }) {
    const sy = system.syrytme as SyrytmeHud | null | undefined;
    const messe = system.messe as MesseHud | null | undefined;
    const terning = system.terning as TerningHud | null | undefined;
    return (
        <>
            {sy && <Syrytme h={sy} />}
            {messe && messe.flamme === null && <Messe h={messe} />}
            {terning && <Terning h={terning} />}
            <Kontor system={system} />
        </>
    );
}
