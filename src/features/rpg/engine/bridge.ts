// Broen mellom Phaser-scenen og React-grensesnittet. Selve spilltilstanden
// (liv, sekk, quester) leser begge sider rett fra useRpgStore - broen brukes
// bare til hendelser: «åpne denne dialogen», «eleven svarte riktig».

import type { KampSnapshot } from './kamp';

type Handler<T> = (payload: T) => void;

export interface SceneEvents {
    /** Vis samtale med en NPC. */
    dialog: { npcId: string };
    /** Vis teksten på et landemerke. */
    landmark: { landmarkId: string };
    /** Åpne kunnskapsutfordringen for en quest. */
    utfordring: { questId: string };
    /** Bossens kunnskapsdyst - ett spørsmål per skjold. */
    bossSporsmal: { runde: number };
    /** Liten hjelpetekst nederst («Trykk E for å snakke»). */
    hint: { tekst: string | null };
    /** Spilleren døde. */
    dod: Record<string, never>;
    /** Bossen er felt. */
    seier: Record<string, never>;
    /** Stedet eleven ankom. `stedId` lar React slå opp resten selv. */
    sone: { stedId: string; tittel: string; undertittel: string };
    /**
     * Scenen ber om å komme til et annet sted. React bygger questene for det
     * nye stedet og svarer med `WorldScene.utforReise`.
     */
    reise: { stedId: string };
    /** Sonens lys, så React kan legge himmeltone og vignett oppå lerretet. */
    atmosfare: { himmel: string };
    /** Retningen til nærmeste mål, til kompasset i HUD-en. */
    kompass: { vinkel: number; avstand: number; navn: string } | null;
    /**
     * Pust, gard og skjoldslitasje. Sendes et titalls ganger i sekundet, ikke 60:
     * pusten endrer seg hele tiden, og en store-skriving per bilde ville tegnet
     * HUD-en på nytt like ofte.
     */
    kamp: KampSnapshot;
}

export interface UiEvents {
    /** Lukk alt som er åpent og gi kontrollen tilbake. */
    lukk: Record<string, never>;
    /** Svaret på en utfordring. */
    svar: { questId: string; riktig: boolean };
    /** Svaret i bossdysten. */
    bossSvar: { riktig: boolean };
    /** Sett spillet på pause (meny åpen). */
    pause: { pa: boolean };
    /** Bruk en besvergelse fra HUD-en. */
    besvergelse: { spellId: string };
    /** Start på nytt etter død. */
    gjenoppliv: Record<string, never>;
    /** Styrestikke på skjerm. x og y er -1..1. */
    styring: { x: number; y: number };
    /**
     * Knapp på skjermkontrollen. `gard` er en veksling, ikke et hold - tommelen
     * kan ikke holde skjoldet og slå samtidig.
     */
    knapp: { navn: 'angrep' | 'rull' | 'bruk' | 'gard' };
}

class Emitter<Events> {
    private handlers = new Map<keyof Events, Set<Handler<never>>>();

    on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
        let set = this.handlers.get(event);
        if (!set) {
            set = new Set();
            this.handlers.set(event, set);
        }
        set.add(handler as Handler<never>);
        return () => {
            set!.delete(handler as Handler<never>);
        };
    }

    emit<K extends keyof Events>(event: K, payload: Events[K]): void {
        const set = this.handlers.get(event);
        if (!set) return;
        for (const handler of [...set]) (handler as Handler<Events[K]>)(payload);
    }

    clear(): void {
        this.handlers.clear();
    }
}

/** Scenen sier ifra til grensesnittet. */
export const fraSpill = new Emitter<SceneEvents>();
/** Grensesnittet sier ifra til scenen. */
export const tilSpill = new Emitter<UiEvents>();
