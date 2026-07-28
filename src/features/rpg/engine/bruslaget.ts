// Rekka ved Stanford bru, 25. september 1066, rundt middag.
//
// Dette er skjoldborgen fra Stiklestad om igjen, med de samme reglene og den
// samme knappen, og det er meningen at eleven skal kjenne seg igjen. Alt hun
// lærte i 1030 gjelder fortsatt: stå, ikke gå fram, skjoldet ditt dekker halve
// mannen til venstre.
//
// Tre ting er annerledes, og de er hele kapittelet:
//
//   1. **Ingen har brynje.** Valget hun tok i leiren i morges avgjør om hun har
//      sin. Bar hun den, kom hun fram sliten etter fem timer med tjue tusen
//      ringer jern i sola. Lot hun den ligge, står hun her i skjorta. Ingen av
//      de to er riktig, og ingen av dem redder henne.
//   2. **Klokka teller ned til noe som ikke rekker fram.** Kongen har sendt bud
//      til skipene etter resten av hæren og etter jernet. Det er fem timers vei
//      dit. Kortet i skjermen viser hvor langt hjelpen er kommet, og hun dør
//      med to timer igjen på det.
//   3. **Mennene ved siden av henne faller uansett hva hun gjør.** På
//      Stiklestad var naboens død hennes feil hvis den skjedde. Her er den
//      ingens feil. Det er forskjellen på et slag man kan stå seg gjennom og et
//      slag som var avgjort før det begynte, og eleven skal kjenne den
//      forskjellen i hendene, ikke lese den.
//
// **Hun kan ikke vinne, og hun kan ikke prøve igjen.** Blueprintens §16.2 er
// tydelig: i kapittel 5 er skjermen ferdig skrevet. Det ene hun avgjør, er hvor
// lenge hun blir stående - og dermed hvor mye av det som hendte, hun rakk å få
// vite før hun gikk i bakken. Den som falt tidlig, døde uten å vite hvordan det
// gikk med kongen. Det er ikke en trøstepremie. Det er hva et vitne er.

import type Phaser from 'phaser';
import { ENEMY_BY_ID } from '../data/enemies';
import { K5, K5_FLAGG } from '../data/kapitler';
import { BRU_MUNN, RINGEN_X, RINGEN_Y } from './bruagen';
import { BRUA_VENTENDE } from '../data/brua';
import { maksVerdier, useRpgStore } from '../store/useRpgStore';
import { sfx, startEnTone, startMusikk } from './audio';
import { fraSpill } from './bridge';
import { TILE } from './spriteforge';
import type { Fiende, Sprite } from './systems/entiteter';

export type BruFase = 'ingen' | 'venter' | 'staar' | 'over';

/** Rakk hun å se merket gå ned, eller falt hun mens det fortsatt sto? */
export type BruUtfall = 'falt-for-kongen' | 'saa-merket-falle';

/** Når Landøyda går ned. Pila i strupen står hos Snorre, og bare hos ham. */
const KONGEN_FALLER = 78_000;

/**
 * Når det er over uansett.
 *
 * Står hun ennå, brister rekka rundt henne og hun går ned med den. Det finnes
 * ingen utgang der hun blir stående: dette er den ene kampen i kampanjen som
 * ikke har en seiersgrense, og et tall som ga henne en, ville løyet om dagen.
 */
const SLUTTEN = 110_000;

/** Hvor langt fram hun får gå før hullet åpner seg. Som i 1030. */
const FRAMME = 10;
/** Og hvor langt til hver side. Som i 1030. */
const PLASSEN = 22;
/** Nåden i det rekka stiller seg opp. */
const NAADE = 2000;

const HULL_VARSEL = 900;
const HULL_SAAR = 1500;
const SAAR_TAKT = 1300;

/** Under dette går hun i bakken. */
const UTE_AV_KAMP = 0.15;

/**
 * Hvor mye et treff er verdt mot en mann uten jern.
 *
 * Skjoldet til naboen dekker henne like godt som på Stiklestad. Det som mangler
 * er det som lå igjen i kista, og det er derfor det bare er dekningen som
 * skiller de to tallene her.
 */
const DEKNING_I_BRYNJE = 0.62;
const DEKNING_UTEN = 0.95;

/**
 * Det fem timer i brynje koster.
 *
 * Hun kommer fram med under tre fjerdedeler igjen, og det er ikke en straff for
 * å ha valgt feil. Det er den andre halvdelen av regnestykket kongen gjorde i
 * morges: jern er tungt, og en hær som går fem timer i det, er ikke i stand til
 * å slåss når den kommer fram. Øystein Orres menn løper den samme veien i dag,
 * og noen av dem dør av det uten å bli truffet av noe.
 */
const SLITEN = 0.72;

/** Bølgene som kommer over brua. De blir hardere, ikke flere. */
const BOLGER: { ved: number; defer: string[] }[] = [
    { ved: 0, defer: ['engelsk-fyrdmann', 'engelsk-fyrdmann'] },
    { ved: 11_000, defer: ['engelsk-fyrdmann', 'bueskytter'] },
    { ved: 23_000, defer: ['engelsk-huskarl', 'engelsk-fyrdmann'] },
    { ved: 35_000, defer: ['engelsk-fyrdmann', 'bueskytter'] },
    { ved: 47_000, defer: ['engelsk-huskarl', 'engelsk-huskarl'] },
    { ved: 60_000, defer: ['engelsk-huskarl', 'bueskytter'] },
    { ved: 72_000, defer: ['engelsk-huskarl', 'engelsk-fyrdmann'] },
    { ved: 86_000, defer: ['engelsk-huskarl', 'engelsk-huskarl'] },
    { ved: 98_000, defer: ['engelsk-huskarl', 'bueskytter'] },
];

/**
 * Hvor langt hjelpen er kommet.
 *
 * Dette er kapittelets klokke, og den er ikke en nedtelling til seier. Den er
 * avstanden fra kista til rekka, målt i timer, og eleven ser den krympe i det
 * tempoet en mann løper. Hun rekker aldri ned til null.
 */
const HJELPEN: { ved: number; timer: string; mal: string }[] = [
    {
        ved: 0,
        timer: '5 t',
        mal: 'Stå. Kongen har sendt bud til skipene etter jernet. Det er fem timers vei.',
    },
    {
        ved: 22_000,
        timer: '4 t',
        mal: 'Stå. Budet rir sørover langs elva. Ingen av dem har vært utsatt for dette før.',
    },
    {
        ved: 48_000,
        timer: '3 t',
        mal: 'Stå. Øystein Orre bryter leiren ved skipene nå, om budet kom fram.',
    },
    {
        ved: 74_000,
        timer: '2 t',
        mal: 'Stå. De løper den veien du gikk i morges. I brynje, i sola.',
    },
];

/**
 * Mennene i rekka, og når de faller.
 *
 * Tidene står her og ikke i en tilfeldighet, og de er ikke knyttet til noe
 * eleven gjør. Det er poenget: rekka tynnes ut fordi den siden tapte, ikke
 * fordi hun sto feil. Torfinn står lengst, for han er den hun dekker - og han
 * er den eneste her hun kjenner hjemmefra.
 */
const REKKA: { x: number; navn: string; skilt: boolean; falerVed: number }[] = [
    { x: -6, navn: 'Kolbein Raude', skilt: false, falerVed: 30_000 },
    { x: -4, navn: 'Sigurd på Vik', skilt: false, falerVed: 66_000 },
    { x: -2, navn: 'Torfinn', skilt: true, falerVed: 92_000 },
    { x: 2, navn: 'Bjørn på Nes', skilt: true, falerVed: 52_000 },
    { x: 4, navn: 'Alv Steinsson', skilt: false, falerVed: 44_000 },
    { x: 6, navn: 'Kåre unge', skilt: false, falerVed: 82_000 },
];

/** Hvor mye våpenet er verdt i en rekke. Samme tabell som på Stiklestad. */
export const BRU_REKKE_FAKTOR: Record<string, number> = {
    god: 1.35,
    brukbar: 0.85,
    ubrukelig: 0.4,
};

export interface BruslagetKroker {
    settUt: (defId: string, x: number, y: number, valg: Partial<Fiende>) => Fiende | null;
    hentInn: (f: Fiende) => void;
    spiller: () => Sprite;
    settSpiller: (x: number, y: number) => void;
    /** Hun kan ikke dø av et treff her. Modulen avgjør når hun faller. */
    ovingsmodus: (pa: boolean) => void;
    settIRekke: (pa: boolean) => void;
    settDekning: (faktor: number) => void;
    saarEffekt: (x: number, y: number) => void;
    leggUtLinje: (fraX: number, tilX: number, y: number) => void;
    taOppLinje: () => void;
    /** Hæren snur: de som ventet går ut av bildet, mannen med øksa kommer inn. */
    settSynlig: (npcId: string, synlig: boolean) => void;
    musikkRot: number;
}

interface Mann {
    fiende: Fiende;
    navn: string;
    liv: number;
    falt: boolean;
    falerVed: number;
}

/** Naboen tåler tre stikk som skulle vært hennes. */
const NABO_LIV = 3;

export class Bruslaget {
    private kroker: BruslagetKroker;
    private fase: BruFase = 'ingen';
    private rekka: Mann[] = [];
    /** Mannen til venstre. Ham dekker skjoldet hennes. */
    private venstre: Mann | null = null;
    private fiender: Fiende[] = [];
    private gaatt = 0;
    private naade = 0;
    private framme = 0;
    private varslet = false;
    private saarTimer = 0;
    private nesteBolge = 0;
    private nesteHjelp = 0;
    private kongenFalt = false;
    private minX = 0;
    private tellerTimer = 0;
    private etterpa = 0;
    private utfall: BruUtfall = 'falt-for-kongen';

    constructor(kroker: BruslagetKroker) {
        this.kroker = kroker;
    }

    get naa(): BruFase {
        return this.fase;
    }

    /**
     * Setter dagen i den tilstanden lagringen sier.
     *
     * Samme regel som for båten i vika, huden på vollen og rekka på sletta:
     * scenen bygges på nytt hver gang eleven reiser, og et felt i minnet er
     * ikke sant. Gikk hun en tur innom hallen etter at hæren snudde, skal
     * kongen og skalden fortsatt være borte fra venteplassen når hun kommer
     * tilbake, og mannen med øksa skal fortsatt stå på plankene.
     */
    gjenopprett(): void {
        const store = useRpgStore.getState();
        // Mannen på plankene står ikke der før hæren snur. Han bygges med
        // stedet som alle andre, og han skjules her - et eget «synlig fra
        // start»-felt på NPC-typen ville vært en bryter bare dette ene
        // mennesket i hele kampanjen hadde bruk for.
        this.kroker.settSynlig('mannen-med-oksa', false);
        if (store.steg.includes(K5.rekka)) {
            this.fase = 'over';
            for (const id of BRUA_VENTENDE) this.kroker.settSynlig(id, false);
            return;
        }
        if (!store.steg.includes(K5.stovet)) return;
        this.retretten(false);
    }

    /**
     * Hæren snur.
     *
     * De tre som sto og ventet, går over brua med alle andre, og mannen med
     * øksa blir stående igjen på plankene. Han er ikke et oppdrag og ikke en
     * kamp - han er noe eleven går forbi.
     *
     * `medKort` er falsk når dette bare er lagringen som gjenskapes: da har hun
     * alt lest skjermbildet, og oppgavekortet settes av seg selv utenfra.
     */
    retretten(medKort = true): void {
        if (this.fase === 'staar' || this.fase === 'over') return;
        this.fase = 'venter';
        for (const id of BRUA_VENTENDE) this.kroker.settSynlig(id, false);
        this.kroker.settSynlig('mannen-med-oksa', true);
        if (!medKort) return;
        fraSpill.emit('oppgave', {
            tittel: 'Over brua',
            mal: 'Gå over plankene og still deg opp på høyden på den andre siden.',
        });
    }

    /**
     * Rekka stiller seg opp.
     *
     * Det første som skjer, er at mannen på brua er borte. Han holdt plankene
     * mens hæren kom seg over, og så tok de ham nedenfra, mellom stokkene. Vi
     * viser ikke den kampen: den står i én engelsk håndskrift, skrevet over
     * hundre år etter, og i ingen norrøn kilde i det hele tatt. Mellomspill V
     * legger den på bordet. Her får eleven bare merke at han ikke står der
     * lenger.
     */
    still(): void {
        if (this.fase === 'staar' || this.fase === 'over') return;
        const store = useRpgStore.getState();
        this.fase = 'staar';
        this.gaatt = 0;
        this.naade = NAADE;
        this.framme = 0;
        this.varslet = false;
        this.saarTimer = 0;
        this.nesteBolge = 0;
        this.nesteHjelp = 0;
        this.kongenFalt = false;
        this.tellerTimer = 0;

        for (const id of BRUA_VENTENDE) this.kroker.settSynlig(id, false);
        this.kroker.settSynlig('mannen-med-oksa', false);

        const y = RINGEN_Y * TILE + 8;
        this.kroker.leggUtLinje(RINGEN_X.fra * TILE, RINGEN_X.til * TILE + 16, y);

        const min = Math.round((RINGEN_X.fra + RINGEN_X.til) / 2);
        this.minX = min * TILE + 8;
        this.kroker.settSpiller(this.minX, y);
        this.kroker.ovingsmodus(true);
        this.kroker.settIRekke(true);

        // Morgenens valg, gjort om til to tall. Bar hun brynja, tar hun mindre
        // og kommer sliten til rekka. Lot hun den ligge, er hun uthvilt og bar.
        const iBrynje = Boolean(store.flagg[K5_FLAGG.brynjaMed]);
        this.kroker.settDekning(iBrynje ? DEKNING_I_BRYNJE : DEKNING_UTEN);
        if (iBrynje) {
            store.settHp(Math.round(maksVerdier(store).hp * SLITEN));
            store.varsle('Fem timer i jern. Armene er tunge før det begynner.', 'darlig');
        }

        for (const m of REKKA) {
            const f = this.kroker.settUt('bonde-i-rekka', (min + m.x) * TILE + 8, y, {
                tilstand: 'sover',
                fredelig: true,
                udodelig: true,
                navn: m.skilt ? m.navn : undefined,
            });
            if (!f) continue;
            const mann: Mann = {
                fiende: f,
                navn: m.navn,
                liv: NABO_LIV,
                falt: false,
                falerVed: m.falerVed,
            };
            this.rekka.push(mann);
            if (m.x === -2) this.venstre = mann;
        }

        startMusikk(this.kroker.musikkRot, 1);
        fraSpill.emit('replikk', {
            hvem: 'Torfinn',
            tekst: 'Han i brua står ikke lenger. De kom under plankene med et spyd. Bli stående, Orm.',
        });
        this.oppdaterKort();
    }

    oppdater(delta: number): void {
        if (this.fase === 'over' && this.etterpa > 0) {
            this.etterpa -= delta;
            if (this.etterpa <= 0) this.gjorOpp();
            return;
        }
        if (this.fase !== 'staar') return;

        this.gaatt += delta;
        this.sendBolger();
        this.holdPlassen();
        this.holdDemUte();
        this.tynnRekka();
        this.sjekkKongen();
        this.sjekkHullet(delta);
        if (this.fase !== 'staar') return;
        this.sjekkHenne();
        if (this.fase !== 'staar') return;

        this.tellerTimer -= delta;
        if (this.tellerTimer <= 0) {
            this.tellerTimer = 1000;
            this.oppdaterKort();
        }
        if (this.gaatt >= SLUTTEN) this.avgjor('saa-merket-falle');
    }

    /** De kommer over brua, to og to, og de tar ikke slutt. */
    private sendBolger(): void {
        while (this.nesteBolge < BOLGER.length && this.gaatt >= BOLGER[this.nesteBolge].ved) {
            const bolge = BOLGER[this.nesteBolge];
            this.nesteBolge += 1;
            bolge.defer.forEach((defId, i) => {
                const x = (BRU_MUNN[0] - 1 + i * 3) * TILE + 8;
                const y = (BRU_MUNN[1] - (i % 2)) * TILE;
                const f = this.kroker.settUt(defId, x, y, {
                    tilstand: 'jager',
                    navn: ENEMY_BY_ID[defId]?.name,
                });
                if (f) this.fiender.push(f);
            });
            if (this.nesteBolge > 1) sfx.horn();
        }
    }

    /** Hun har en plass, og hun blir i den. Som i 1030. */
    private holdPlassen(): void {
        const s = this.kroker.spiller();
        const y = RINGEN_Y * TILE + 8;
        const venstreKant = this.minX - PLASSEN;
        const hoyreKant = this.minX + PLASSEN;
        let flyttet = false;
        if (s.y > y) {
            s.setPosition(s.x, y);
            flyttet = true;
        }
        if (s.x < venstreKant || s.x > hoyreKant) {
            s.setPosition(Math.min(hoyreKant, Math.max(venstreKant, s.x)), s.y);
            flyttet = true;
        }
        if (!flyttet) return;
        const kropp = s.body as Phaser.Physics.Arcade.Body | null;
        if (kropp) kropp.setVelocity(0, Math.min(0, kropp.velocity.y));
    }

    /** Og de kommer ikke gjennom rekka. Uten dette er formasjonen en kulisse. */
    private holdDemUte(): void {
        const grense = RINGEN_Y * TILE + 8 - TILE;
        for (const f of this.fiender) {
            if (f.dodd || f.sprite.y <= grense) continue;
            f.sprite.setPosition(f.sprite.x, grense);
            const kropp = f.sprite.body as Phaser.Physics.Arcade.Body | null;
            if (kropp) kropp.setVelocity(kropp.velocity.x, Math.min(0, kropp.velocity.y));
        }
    }

    /**
     * Rekka tynnes ut.
     *
     * Dette er den ene regelen som ikke finnes på Stiklestad, og den er hele
     * forskjellen mellom de to slagene. Der falt naboen bare hvis eleven gikk
     * fram og lot ham stå bar. Her faller han fordi ingen av dem har jern på
     * seg og fordi det kommer flere over brua enn de er.
     *
     * Ingenting hun gjør, stanser det. Det er ikke urettferdig - det er det
     * kapittelet handler om, og hun har fått vite grunnen tre ganger før hun
     * stilte seg opp.
     */
    private tynnRekka(): void {
        for (const m of this.rekka) {
            if (m.falt || this.gaatt < m.falerVed) continue;
            this.fall(m);
        }
    }

    /** Merket går ned. Det skjer langt unna henne, og alle ser det. */
    private sjekkKongen(): void {
        if (this.kongenFalt || this.gaatt < KONGEN_FALLER) return;
        this.kongenFalt = true;
        useRpgStore.getState().settFlagg(K5_FLAGG.saaMerketFalle);
        sfx.horn();
        startEnTone(110);
        fraSpill.emit('replikk', {
            hvem: 'Torfinn',
            tekst: 'Landøyda er nede. Ser du det? Merket er nede.',
        });
        // Fra nå av holder ingen noe over noen. Rekka er ikke en rekke lenger,
        // og det siste stykket står hun i praksis alene.
        this.kroker.settDekning(1);
    }

    private sjekkHullet(delta: number): void {
        if (this.naade > 0) {
            this.naade -= delta;
            return;
        }
        const s = this.kroker.spiller();
        const framme = s.y < RINGEN_Y * TILE + 8 - FRAMME;

        if (!framme) {
            this.framme = 0;
            this.saarTimer = 0;
            return;
        }
        this.framme += delta;

        if (this.framme > HULL_VARSEL && !this.varslet) {
            this.varslet = true;
            sfx.galt();
            fraSpill.emit('replikk', { hvem: 'Torfinn', tekst: 'TILBAKE! Du står bar!' });
        }
        if (this.framme < HULL_SAAR) return;

        this.saarTimer -= delta;
        if (this.saarTimer > 0) return;
        this.saarTimer = SAAR_TAKT;
        this.saar(this.venstre);
    }

    /**
     * Torfinn tar et stikk som skulle vært hennes.
     *
     * Han faller fortere enn tiden hans sier hvis hun blir stående framme, og
     * det er den ene tråden fra 1030 som fortsatt henger igjen: skjoldet
     * hennes dekker halve ham. Men hans fall avslutter ikke slaget her. Ingen
     * andres fall gjør det. Det er bare hennes eget som gjør det.
     */
    private saar(mann: Mann | null): void {
        if (!mann || mann.falt) return;
        mann.liv -= 1;
        const { x, y } = mann.fiende.sprite;
        this.kroker.saarEffekt(x, y);
        sfx.skade();
        if (mann.liv > 0) {
            fraSpill.emit('replikk', {
                hvem: mann.navn,
                tekst: mann.liv === 2 ? 'Orm! Skjoldet!' : 'Jeg greier ikke mer av dette.',
            });
            return;
        }
        this.fall(mann);
    }

    private fall(mann: Mann): void {
        mann.falt = true;
        const { x, y } = mann.fiende.sprite;
        this.kroker.saarEffekt(x, y);
        this.kroker.hentInn(mann.fiende);
        sfx.skade();
        fraSpill.emit('replikk', {
            hvem: mann.navn === 'Torfinn' ? 'Torfinn' : 'Rekka',
            tekst:
                mann.navn === 'Torfinn'
                    ? 'Torfinn faller mot deg og blir liggende. Han sier ingenting.'
                    : `${mann.navn} er nede. Rekka lukker seg der han sto.`,
        });
    }

    /** Går hun i bakken, er det over. Det finnes ingen andre utganger. */
    private sjekkHenne(): void {
        const store = useRpgStore.getState();
        if (store.hp / Math.max(1, maksVerdier(store).hp) > UTE_AV_KAMP) return;
        this.avgjor(this.kongenFalt ? 'saa-merket-falle' : 'falt-for-kongen');
    }

    private oppdaterKort(): void {
        while (
            this.nesteHjelp < HJELPEN.length - 1 &&
            this.gaatt >= HJELPEN[this.nesteHjelp + 1].ved
        ) {
            this.nesteHjelp += 1;
        }
        const trinn = HJELPEN[this.nesteHjelp];
        fraSpill.emit('oppgave', {
            tittel: 'Hold rekka',
            mal: trinn.mal,
            teller: trinn.timer,
        });
    }

    private avgjor(utfall: BruUtfall): void {
        if (this.fase !== 'staar') return;
        this.fase = 'over';
        this.utfall = utfall;
        this.etterpa = 1600;
        // Øvingsmodus blir stående til hun forlater brua, og det er ikke en
        // forglemmelse. Slår vi den av her, står hun med ett liv igjen i halvannet
        // sekund før skjermbildet kommer - og en pil som alt er i lufta når
        // henne i det vinduet. Da tar spillets vanlige dødsskjerm over: «Tåka
        // tok deg. Du våkner igjen i Nordvik.» Det er den ene setningen som
        // ikke får stå i dette kapittelet. Hvordan Orm dør, er skrevet på
        // forhånd, og det er denne modulen som skriver det.
        this.kroker.settIRekke(false);
        this.kroker.settDekning(1);
        for (const f of this.fiender) this.kroker.hentInn(f);
        this.fiender = [];
        for (const m of this.rekka) if (!m.falt) this.kroker.hentInn(m.fiende);
        this.rekka = [];
        this.venstre = null;
        this.kroker.taOppLinje();
        startEnTone(98);
        fraSpill.emit('motstander', null);
        fraSpill.emit('oppgave', null);
    }

    /**
     * Regnskapet.
     *
     * Det finnes ingen «prøv igjen» her, og det er avgjort i blueprintens
     * §16.2. Begge utgangene ender med at Orm blir liggende ved Stanford bru.
     * Det som skiller dem, er hvor mye han fikk vite først - og det er nettopp
     * det Mellomspill V skal ta fatt i: alt vi vet om denne dagen, vet vi fra
     * folk som sto et annet sted enn ham.
     */
    private gjorOpp(): void {
        const store = useRpgStore.getState();
        store.fullforSteg(K5.rekka);
        // Nå har det hendt noe å være klok etterpå av. Begrepet ble gitt som
        // `hort` i leiren i morges, med vilje, og løftes først her.
        store.larBegrep('etterpaaklokskap', 'forstatt');
        store.fullforPuzzle('stanford-bru', 'Du sto i rekka ved Stanford bru');
        startMusikk(this.kroker.musikkRot, 0);

        const iBrynje = Boolean(store.flagg[K5_FLAGG.brynjaMed]);
        const jernet = iBrynje
            ? 'Du bar brynja de fem timene. Den ligger på deg nå, og den var ikke nok - det er ikke slik at den ene som hadde jern, står igjen når de andre er nede.'
            : 'Brynja di ligger i kista ved skipene, femten kilometer herfra, i sola. Ingen har rørt lokket. Om noen timer kommer Øystein Orre løpende forbi den med sin egen på.';

        if (this.utfall === 'falt-for-kongen') {
            store.settFlagg(K5_FLAGG.faltForKongen);
            fraSpill.emit('beskjed', {
                tittel: 'Ved brua',
                tekst: [
                    'Du merker ikke slaget som tar deg. Det er bare bakken som kommer opp, og så gresset helt inntil ansiktet, og lyden av folk som fortsatt står og slåss et sted over deg.',
                    'Det siste du ser oppe i bakken, er Landøyda. Det står ennå.',
                    'En halv time senere faller Harald Sigurdsson med en pil i strupen. Det får du aldri vite. Du får heller ikke vite at det er slutt, eller hvem som kom seg unna, eller at det er tjuefire skip som seiler hjem av tre hundre.',
                    jernet,
                    'Du er 22 år gammel. Du kommer ikke hjem til Nordvik.',
                ].join('\n\n'),
                knapp: 'Videre',
            });
            return;
        }

        fraSpill.emit('beskjed', {
            tittel: 'Ved brua',
            tekst: [
                'Merket er nede, og en hær som ikke ser merket sitt, står ikke lenge etterpå. Det er ingen som roper noe. Rekka bare slutter å være en rekke.',
                'Tostig tar merket opp og faller med det. Så kommer det folk løpende nedenfra veien, i brynje, med skjold, etter fem timer i sola - Øystein Orre og de som lå ved skipene. Noen av dem går i bakken uten at noen har rørt dem. De har løpt seg i hjel for å komme fram til dette.',
                jernet,
                'Du blir stående til noen kommer på siden av deg. Så blir du liggende, med ansiktet mot elva du gikk over i formiddag.',
                'Du er 22 år gammel. Du kommer ikke hjem til Nordvik.',
            ].join('\n\n'),
            knapp: 'Videre',
        });
    }

    /** Hvor mye våpenet hennes duger her. Samme regel som i rekka på sletta. */
    skadefaktor(rekkeVerdi: string | undefined): number {
        if (this.fase !== 'staar') return 1;
        return BRU_REKKE_FAKTOR[rekkeVerdi ?? 'brukbar'] ?? 1;
    }

    /**
     * Eleven forlot brua. Kortene skal ikke bli hengende.
     *
     * Her tas øvingsmodus av, og ikke i `avgjor`: den skal stå helt til hun er
     * ute av 1066. Se kommentaren der.
     */
    avslutt(): void {
        if (this.fase !== 'ingen') {
            this.kroker.ovingsmodus(false);
            this.kroker.settIRekke(false);
            this.kroker.settDekning(1);
            this.kroker.taOppLinje();
        }
        this.fiender = [];
        this.rekka = [];
        this.venstre = null;
        fraSpill.emit('motstander', null);
    }
}
