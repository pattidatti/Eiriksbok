// Kampopplæringen. Fire økter på tunet, mot Ravn.
//
// Dette er ikke en tutorial-dukke. Det er en person som ler av deg, og det er
// hele grepet: eleven lærer skjoldet av noen som har en mening om hvordan hun
// holder det (blueprint §4, kapittel 1).
//
// To ting styrer hvordan øktene er satt sammen:
//
//   **Rekkefølgen er slag, blokk, parade, alvor.** Slaget først fordi hun må
//   kjenne avstanden før noe kommer imot. Blokken før paraden fordi paraden er
//   en blokk med timing - lærer hun paraden først, har hun ingenting å
//   sammenlikne den med, og belønningen leser som tilfeldig.
//
//   **Ravn går fra 700 ms til 450.** Eleven merker at hun blir bedre, men det
//   er Ravn som er blitt raskere. Det er en løgn vi tar med glede
//   (blueprint §5.8).
//
// Ingen kan dø her. Ravn er `udodelig`, og eleven står i øvingsmodus - livet
// hennes bunner ut på én. En opplæring som kan drepe eleven er en opplæring
// hun slutter å ta.

import { KAPITTEL_BY_NR, K1 } from '../data/kapitler';
import { ENEMY_BY_ID } from '../data/enemies';
import { useRpgStore } from '../store/useRpgStore';
import { sfx } from './audio';
import { fraSpill } from './bridge';
import type { Fiende } from './systems/entiteter';

/** Hva eleven skal få til i en økt. */
type Teller = 'treff' | 'blokk' | 'parade';

interface Okt {
    id: string;
    /** Det Ravn sier før økta. Én linje, i hans munn - ikke en instruksjon. */
    for: string;
    /** Selve oppgaven, slik den står i HUD-en. Dette er instruksjonen. */
    mal: string;
    teller: Teller;
    antall: number;
    /** Telegraferingen hans denne økta. Uten betydning når han er fredelig. */
    varsel: number;
    /** Står han og tar imot, eller slår han tilbake? */
    fredelig: boolean;
    /** Det han sier når hun har fått det til. */
    etter: string;
}

const OKTER: Okt[] = [
    {
        id: 'slaget',
        for: 'Du holder det som en bøtte. Slå meg. Mellomrom. Jeg står stille, jeg.',
        mal: 'Treff Ravn tre ganger. Mellomrom slår.',
        teller: 'treff',
        antall: 3,
        varsel: 700,
        fredelig: true,
        etter: 'Der. Du kan slå. Alle kan slå.',
    },
    {
        id: 'blokken',
        for: 'Nå kommer jeg. Hold Shift så står skjoldet. Bak skjoldet skjer det deg ingenting.',
        mal: 'Blokker tre slag. Hold Shift mens du står stille.',
        teller: 'blokk',
        antall: 3,
        varsel: 700,
        fredelig: false,
        etter: 'Og der står du. Og der står du fortsatt. Merker du at du blir andpusten?',
    },
    {
        id: 'paraden',
        for: 'Å gjemme seg er å bli sliten. Reis skjoldet i det slaget kommer, ikke før. Da tar jeg det selv.',
        mal: 'Parer tre slag. Reis skjoldet i det slaget kommer - ikke før.',
        teller: 'parade',
        antall: 3,
        varsel: 600,
        fredelig: false,
        etter: 'Nå slo du meg ut av balanse. Det er skjoldet som er våpenet, gutt.',
    },
    {
        id: 'alvor',
        for: 'Da tar vi det på ordentlig. Jeg holder ikke igjen nå.',
        mal: 'Treff Ravn fem ganger mens han slåss for alvor.',
        teller: 'treff',
        antall: 5,
        varsel: 450,
        fredelig: false,
        etter: 'Nok. Faren din trenger deg i naustet. Og jeg trenger å sette meg.',
    },
];

export interface OpplaeringKroker {
    /** Setter Ravn ut på tunet, og gir ham tilbake. */
    settUt: (defId: string, x: number, y: number, valg: Partial<Fiende>) => Fiende | null;
    /** Henter ham inn igjen. Ingen død, ingen loot. */
    hentInn: (fiende: Fiende) => void;
    spiller: () => { x: number; y: number };
    /** Skrur av at eleven kan dø. */
    ovingsmodus: (pa: boolean) => void;
    /** Skjuler NPC-Ravn mens kamp-Ravn står på tunet. */
    visNpc: (npcId: string, synlig: boolean) => void;
}

export class Opplaering {
    private kroker: OpplaeringKroker;
    private ravn: Fiende | null = null;
    private okt = -1;
    private teller = 0;
    /** Kort pause mellom øktene, så replikken hans får stå alene. */
    private pause = 0;

    constructor(kroker: OpplaeringKroker) {
        this.kroker = kroker;
    }

    get gaar(): boolean {
        return this.ravn !== null;
    }

    /** Ravn står opp fra stubben. Timen begynner. */
    start(npcId: string, rute: { x: number; y: number }): void {
        if (this.ravn) return;
        const def = ENEMY_BY_ID.huskarl;
        if (!def) return;
        this.kroker.visNpc(npcId, false);
        // Han er huskarlen, men han slåss ikke som en huskarl her: han er
        // udødelig, han er saktere, og han har et navn over hodet. Navnet er
        // ikke pynt - det er §5.7 gjort synlig, og Ravn er så innenfor
        // ættesystemet som noen kan komme.
        const ravn = this.kroker.settUt(def.id, rute.x, rute.y, {
            udodelig: true,
            navn: 'Ravn',
            tilstand: 'jager',
        });
        if (!ravn) return;
        this.ravn = ravn;
        this.kroker.ovingsmodus(true);
        this.okt = -1;
        this.nesteOkt();
    }

    /** Eleven landet et slag på noen. */
    treff(fiende: Fiende): void {
        if (fiende !== this.ravn) return;
        this.tell('treff');
    }

    /** Garden tok imot noe. */
    forsvar(art: 'parade' | 'blokk' | 'gjennom', fiende: Fiende): void {
        if (fiende !== this.ravn || art === 'gjennom') return;
        this.tell(art);
    }

    private tell(art: Teller): void {
        const okt = OKTER[this.okt];
        if (!okt || this.pause > 0 || okt.teller !== art) return;
        this.teller += 1;
        this.meldOppgave();
        if (this.teller >= okt.antall) this.avsluttOkt(okt);
    }

    private avsluttOkt(okt: Okt): void {
        this.si(okt.etter);
        sfx.riktig();
        // Litt pusterom før neste økt, så replikken hans ikke blir overdøvd av
        // neste oppgave i samme bilde.
        this.pause = 2200;
    }

    private nesteOkt(): void {
        this.okt += 1;
        this.teller = 0;
        const okt = OKTER[this.okt];
        if (!okt) {
            this.avslutt();
            return;
        }
        const r = this.ravn;
        if (r) {
            r.varsel = okt.varsel;
            r.fredelig = okt.fredelig;
            r.hp = r.maksHp;
        }
        this.si(okt.for);
        this.meldOppgave();
    }

    /**
     * Ravn sier noe uten at verden stopper.
     *
     * Replikken går til HUD-en og ikke som flytende pikseltekst over hodet:
     * fonten er 5 piksler bred per tegn, så «Å gjemme seg er å bli sliten» blir
     * en strek tvers over hele kartet. Flytende tekst duger til «Parade!».
     */
    private si(tekst: string): void {
        fraSpill.emit('replikk', { hvem: 'Ravn', tekst });
    }

    private meldOppgave(): void {
        const okt = OKTER[this.okt];
        if (!okt) return;
        fraSpill.emit('oppgave', {
            tittel: `Ravn - økt ${this.okt + 1} av ${OKTER.length}`,
            mal: okt.mal,
            teller: `${this.teller} / ${okt.antall}`,
        });
    }

    /** Ett bilde. Bare pausen mellom øktene telles her. */
    oppdater(delta: number): void {
        if (!this.ravn || this.pause <= 0) return;
        this.pause -= delta;
        if (this.pause <= 0) this.nesteOkt();
    }

    /** Timen er over - enten fordi hun kom gjennom, eller fordi hun gikk. */
    avslutt(npcId = 'ravn'): void {
        const r = this.ravn;
        this.ravn = null;
        this.pause = 0;
        this.okt = -1;
        this.kroker.ovingsmodus(false);
        if (r) this.kroker.hentInn(r);
        this.kroker.visNpc(npcId, true);
        fraSpill.emit('oppgave', null);
        fraSpill.emit('replikk', null);

        const store = useRpgStore.getState();
        if (store.steg.includes(K1.ravn)) return;
        store.fullforSteg(K1.ravn);
        // Ferdigheten er arbeidet, ikke et begrep. Den konteres som et puzzle:
        // 15 XP i «Min læring», én gang, og aldri for et drap (§7.5).
        store.fullforPuzzle('kampopplaering', 'Ravn lærte deg skjoldet');
        const tittel = KAPITTEL_BY_NR[1]?.steg.find((s) => s.id === K1.ravn)?.tittel;
        store.varsle(tittel ? `${tittel} - ferdig.` : 'Du kan skjoldet nå.', 'niva');
    }
}
