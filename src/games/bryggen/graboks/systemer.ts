// Systemene som hektes på løkka (system.ts). Legg nye til her med én linje, i den rekkefølgen de
// skal spørres: den første som vil ha E eller kameraet, får det.
import type { SpillKontekst, Spillsystem } from './system';
import { fotoSystem } from './dev';
import { Sekvens } from './sekvens';
import { Opplaering } from './opplaering';
import { koblFilmer } from '../bygg/filmer';

export async function lagSystemer(k: SpillKontekst): Promise<Spillsystem[]> {
    // Filmscenene først: mens en film går, eier den kameraet og inputen.
    const film = new Sekvens(k);
    const opplaering = new Opplaering(k);
    k.tyv.koble(k);
    k.tyv.holdt = () => film.spiller;
    opplaering.holdt = () => film.spiller;
    koblFilmer(k, (f) => film.spill(f), (f) => film.vedStart(f));
    const ut: Spillsystem[] = [film, k.tyv, opplaering];
    // Sideoppdragene (bygg/sideoppdrag.ts).
    ut.push((await import('./sidefolk')).lagSidefolk(k));
    ut.push((await import('./rottejakt')).lagRottejakt(k));
    ut.push((await import('./syrytme')).lagSyrytme(k));
    ut.push((await import('./messe')).lagMesse(k));
    ut.push((await import('./terning')).lagTerning(k));
    // Rollespillet (blueprint §8.3-8.6): rykte, pung, ferdigheter og rang.
    ut.push((await import('./rpg')).lagRollespill(k));
    // Kongens menn på Holmen (bygg/byen-oppdrag.ts): ettersøkt først (boten tar E foran budet), så vaktene og brannen.
    ut.push((await import('./ettersokt')).lagEttersokt(k));
    ut.push((await import('./holmenvakt')).lagHolmenvakt(k));
    ut.push((await import('./brann')).lagBrann(k));
    ut.push((await import('./strandliv')).lagStrandliv(k)); // Stranden og Vågsbunnen: dagsplaner, dyr, runepinner
    // Kontoret: oppdragskjeden «Kontorets lov» og mer liv i gården (kontoret.ts).
    ut.push(...(await import('./kontoret')).lagKontoret(k));
    if (import.meta.env.DEV) ut.push(fotoSystem());
    return ut;
}
