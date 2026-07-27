// Raidet mot Lindisfarne, i to halvdeler.
//
// Dette er den mest omstridte avgjørelsen i blueprinten (§3), og den er tatt
// bevisst: eleven angriper selv. Begrunnelsen er at poenget kommer *etterpå*,
// i Mellomspill I - det finnes ingen norrøn beretning om Lindisfarne, ikke én,
// og alt vi vet vet vi fordi de vi angrep kunne skrive. Den innsikten er ikke
// mulig å gi til noen som bare så på.
//
//   **Første halvdel er kapittelets kampklimaks, og den skal være deilig.**
//   Øyas egne menn møter dere med det de har. De er flere enn dere, og de slåss
//   for alvor. HP-stolper, skadetall, avslutninger, loot, fanfare - alt skrudd
//   til topps.
//
//   **Andre halvdel: du har vunnet.** Det som er igjen er de som ikke kan
//   slåss. Ingenting endrer regler. Angrepet virker likt. Blodet ser likt ut.
//   Spillet slutter bare å juble: ingen fanfare, ingen skadetall, ingen loot.
//   Musikken faller bort og blir stående på én tone.
//
// Det er kontrasten som bærer, ikke en regelendring. Og fordi spillet ikke sier
// noe, blir det heller ikke en preken. Se `Fiende.stille` i `entiteter.ts` -
// hele forskjellen ligger i det ene flagget.

import { ENEMY_BY_ID } from '../data/enemies';
import { K1 } from '../data/kapitler';
import { useRpgStore } from '../store/useRpgStore';
import { startEnTone, startMusikk } from './audio';
import { fraSpill } from './bridge';
import { TILE } from './spriteforge';
import type { Fiende } from './systems/entiteter';

export type RaidFase = 'ingen' | 'motstand' | 'stillhet' | 'over';

/** Hvor de står når hun kommer opp fra stranda. Ruter, ikke piksler. */
const FORSVARERE: { def: string; rute: [number, number] }[] = [
    { def: 'oyas-mann', rute: [22, 21] },
    { def: 'oyas-mann', rute: [25, 17] },
    { def: 'oyas-okse', rute: [24, 23] },
    { def: 'oyas-mann', rute: [28, 19] },
    { def: 'oyas-okse', rute: [30, 22] },
    { def: 'oyas-okse', rute: [33, 20] },
];

/** De som er igjen. De står der klosteret er, og de løper når hun kommer. */
const IGJEN: [number, number][] = [
    [30, 14],
    [34, 15],
    [29, 22],
    [36, 18],
    [33, 24],
];

export interface RaidKroker {
    settUt: (defId: string, x: number, y: number, valg: Partial<Fiende>) => Fiende | null;
    /** Musikken hører til stedet, ikke til raidet. */
    musikkRot: number;
}

export class Raidet {
    private kroker: RaidKroker;
    private fase: RaidFase = 'ingen';
    private forsvarere: Fiende[] = [];
    /** Litt pust mellom siste mann faller og stillheten begynner. */
    private pause = 0;

    constructor(kroker: RaidKroker) {
        this.kroker = kroker;
    }

    get naa(): RaidFase {
        return this.fase;
    }

    /**
     * Kalles når eleven kommer i land.
     *
     * Har hun vært her før og alt er gjort, settes ingen ut igjen. Øya skal
     * ikke fylle seg opp med nye forsvarere hver gang hun seiler tilbake for å
     * hente det hun lot ligge.
     */
    start(): void {
        const gjort = useRpgStore.getState().steg;
        if (gjort.includes(K1.motstanden)) {
            this.fase = 'over';
            return;
        }
        this.fase = 'motstand';
        for (const { def, rute } of FORSVARERE) {
            const f = this.kroker.settUt(def, rute[0] * TILE + 8, rute[1] * TILE + 8, {
                tilstand: 'jager',
            });
            if (f) this.forsvarere.push(f);
        }
        // Han med hjelmen står foran de andre, og han er den eneste med navn.
        const leder = this.kroker.settUt(
            'oyboer',
            27 * TILE + 8,
            20 * TILE + 8,
            { tilstand: 'jager', navn: ENEMY_BY_ID.oyboer?.name, toppstolpe: true }
        );
        if (leder) this.forsvarere.push(leder);

        startMusikk(this.kroker.musikkRot, 1);
        fraSpill.emit('oppgave', {
            tittel: 'Lindisfarne',
            mal: 'Øyas menn møter dere. De er flere enn dere.',
        });
    }

    /** Ett bilde. Ser etter om siste mann har falt. */
    oppdater(delta: number): void {
        if (this.fase === 'motstand') {
            if (this.forsvarere.some((f) => !f.dodd)) return;
            this.fase = 'stillhet';
            this.pause = 2400;
            return;
        }
        if (this.fase !== 'stillhet' || this.pause <= 0) return;
        this.pause -= delta;
        if (this.pause > 0) return;
        this.begynnStillheten();
    }

    /**
     * Andre halvdel.
     *
     * Ingenting her endrer en regel. Det som skjer er at musikken faller bort,
     * og at de som står igjen har `stille` og `flykter` på seg. Angrepsknappen
     * virker nøyaktig som før.
     */
    private begynnStillheten(): void {
        this.pause = 0;
        startEnTone(147);
        fraSpill.emit('motstander', null);
        for (const rute of IGJEN) {
            this.kroker.settUt('klosterfolk', rute[0] * TILE + 8, rute[1] * TILE + 8, {
                tilstand: 'jager',
                stille: true,
                flykter: true,
                fredelig: true,
            });
        }
        const store = useRpgStore.getState();
        store.fullforSteg(K1.motstanden);
        // Oppgavekortet sier hva som er igjen å gjøre, ikke hva hun bør gjøre.
        // «Ta det du vil ha» og «eller la være» er begge hele setninger.
        fraSpill.emit('oppgave', {
            tittel: 'Lindisfarne',
            mal: 'Motstanden er nede. Ta det du vil ha. Eller la være.',
        });
    }

    /** Eleven forlater øya. Kortet skal ikke bli stående over fjorden hjemme. */
    avslutt(): void {
        this.fase = 'over';
        this.forsvarere = [];
        fraSpill.emit('oppgave', null);
        fraSpill.emit('motstander', null);
    }
}
