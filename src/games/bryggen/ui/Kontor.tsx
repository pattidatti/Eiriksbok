// Panelene til Kontoret-aktivitetene (graboks/kontoret.ts). Hektes på `Aktiviteter.tsx` med én linje.
import type { GjeldsbokHud } from '../graboks/kontor-gjeldsbok';
import type { KoggenHud } from '../graboks/kontor-koggen';
import type { VeiingHud } from '../graboks/kontor-veiing';
import type { MorgenspracheHud } from '../graboks/kontor-morgensprache';
import type { PruteHud } from '../graboks/kontor-prute';
import type { SorteringHud } from '../graboks/kontor-sortering';
import type { VinsjHud } from '../graboks/kontor-vinsj';
import { KontorGjeldsbok } from './KontorGjeldsbok';
import { KontorKoggen } from './KontorKoggen';
import { KontorVeiing } from './KontorVeiing';
import { KontorMorgensprache } from './KontorMorgensprache';
import { KontorPrute } from './KontorPrute';
import { KontorSortering } from './KontorSortering';
import { KontorVinsj } from './KontorVinsj';

export function Kontor({ system }: { system: Record<string, unknown> }) {
    const mote = system['kontor-morgensprache'] as MorgenspracheHud | null | undefined;
    const sort = system['kontor-sortering'] as SorteringHud | null | undefined;
    const prute = system['kontor-prute'] as PruteHud | null | undefined;
    const bok = system['kontor-gjeldsbok'] as GjeldsbokHud | null | undefined;
    const vinsj = system['kontor-vinsj'] as VinsjHud | null | undefined;
    const koggen = system['kontor-koggen'] as KoggenHud | null | undefined;
    const veiing = system['kontor-veiing'] as VeiingHud | null | undefined;
    return (
        <>
            {mote && <KontorMorgensprache h={mote} />}
            {sort && <KontorSortering h={sort} />}
            {prute && <KontorPrute h={prute} />}
            {bok && <KontorGjeldsbok h={bok} />}
            {vinsj && <KontorVinsj h={vinsj} />}
            {koggen && <KontorKoggen h={koggen} />}
            {veiing && <KontorVeiing h={veiing} />}
        </>
    );
}
