// HUD-en for aktivitetene i sideoppdragene: hvert system (graboks/systemer.ts) legger dataene sine i
// `HudState.system[navn]`, og her velges komponenten som tegner dem. Siden hekter på med én linje:
// `<Aktiviteter system={hud.system} />`.
import type { MesseHud } from '../graboks/messe';
import type { RottejaktHud } from '../graboks/rottejakt';
import type { SyrytmeHud } from '../graboks/syrytme';
import type { TerningHud } from '../graboks/terning';
import { Messe } from './Messe';
import { Rottejakt } from './Rottejakt';
import { Syrytme } from './Syrytme';
import { Terning } from './Terning';

export function Aktiviteter({ system }: { system: Record<string, unknown> }) {
    const rotter = system.rottejakt as RottejaktHud | null | undefined;
    const sy = system.syrytme as SyrytmeHud | null | undefined;
    const messe = system.messe as MesseHud | null | undefined;
    const terning = system.terning as TerningHud | null | undefined;
    return (
        <>
            {rotter && <Rottejakt h={rotter} />}
            {sy && <Syrytme h={sy} />}
            {messe && <Messe h={messe} />}
            {terning && <Terning h={terning} />}
        </>
    );
}
