// Systemene som hektes på løkka (system.ts). Legg nye til her med én linje, i den rekkefølgen de
// skal spørres: den første som vil ha E eller kameraet, får det.
import type { SpillKontekst, Spillsystem } from './system';

export async function lagSystemer(k: SpillKontekst): Promise<Spillsystem[]> {
    const ut: Spillsystem[] = [];
    // Sideoppdragene (bygg/sideoppdrag.ts).
    ut.push((await import('./sidefolk')).lagSidefolk(k));
    ut.push((await import('./rottejakt')).lagRottejakt(k));
    ut.push((await import('./syrytme')).lagSyrytme(k));
    ut.push((await import('./messe')).lagMesse(k));
    ut.push((await import('./terning')).lagTerning(k));
    return ut;
}
