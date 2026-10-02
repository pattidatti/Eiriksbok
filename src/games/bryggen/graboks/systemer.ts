// Systemene som hektes på løkka (system.ts). Legg nye til her med én linje, i den rekkefølgen de
// skal spørres: den første som vil ha E eller kameraet, får det.
import type { SpillKontekst, Spillsystem } from './system';

export async function lagSystemer(k: SpillKontekst): Promise<Spillsystem[]> {
    void k;
    const ut: Spillsystem[] = [];
    return ut;
}
