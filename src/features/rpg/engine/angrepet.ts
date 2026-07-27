// Angrepet på Nordvik, høsten 872.
//
// Bua er full, mennene er sør ved Hafrsfjord, og Gaute Gråkappe har lagt merke
// til begge deler. Dette er kapittelets eneste harde kamp - og den beste
// utgangen er at den ikke skjer.
//
// **Kampen som ikke skjer, skal være det eleven skryter av.** Blueprintens
// §16.1 er hard på ett punkt: æreveien må være synlig opptjent på forhånd.
// Derfor holder det ikke å ha høy ære - Sæbø-ætta må ha noe å takke for, og de
// har det bare hvis Åsa ga dem korn i sommer, da hun selv hadde lite. Da står
// Vigdis og Kolbein foran tunet når Gaute kommer opp fra fjæra, og han snur.
// Eleven skal vite at hun kjøpte den kampen bort.
//
// **Trellen.** Kåre kan få et spyd. Gjør hun det, tar han en av mennene, og hun
// står mot to i stedet for tre. Og etterpå er ingenting om ham det samme: en
// ufri mann som har slåss for gården, er ikke en gjenstand lenger, og eleven
// får velge hva det skal bety.
//
// **Det som blir igjen etterpå.** Faller Gaute, er han ikke et monster som
// forsvinner. Han har ætt, og ætta har en sak. Drapet må lyses innen ett døgn,
// ellers er det mord - og mord kan ingen bot kjøpe deg fri fra. Den tråden
// plukkes opp på tinget.

import { ENEMY_BY_ID } from '../data/enemies';
import { K2 } from '../data/kapitler';
import { stillerOpp } from './aere';
import { useRpgStore } from '../store/useRpgStore';
import { startEnTone, startMusikk, sfx } from './audio';
import { fraSpill } from './bridge';
import { TILE } from './spriteforge';
import type { Fiende } from './systems/entiteter';

export type AngrepFase = 'ingen' | 'varslet' | 'kamp' | 'avverget' | 'over';

/** Der de kommer opp fra fjæra, sør for tunet. Ruter. */
const ANGRIPERE: { def: string; rute: [number, number] }[] = [
    { def: 'hovdamann', rute: [16, 36] },
    { def: 'hovdamann', rute: [11, 28] },
];

/**
 * Gaute står midt mellom dem, og med god avstand til de to andre.
 *
 * Ikke tettere: navnskiltene over hodene er pikselfont og legger seg oppå
 * hverandre om tre menn står på samme rute, og da ser eleven én grøt i stedet
 * for tre motstandere hun skal lese hver for seg.
 */
const GAUTE_RUTE: [number, number] = [13, 32];

/** Flagg angrepet setter. */
export const ANGREP_FLAGG = {
    varslet: 'k2-angrep-varslet',
    /** Fikk Kåre spyd? */
    kaareVaepnet: 'k2-kaare-vaepnet',
    /** Slapp hun unna kampen fordi naboætta stilte opp? */
    avverget: 'k2-angrep-avverget',
    /** Falt Gaute for hånden hennes? */
    drepteGaute: 'k2-drepte-gaute',
} as const;

export interface AngrepKroker {
    settUt: (defId: string, x: number, y: number, valg: Partial<Fiende>) => Fiende | null;
    /** Viser og skjuler folk - naboætta kommer, og de går igjen. */
    settSynlig: (npcId: string, synlig: boolean) => void;
    musikkRot: number;
}

export class Angrepet {
    private kroker: AngrepKroker;
    private fase: AngrepFase = 'ingen';
    private menn: Fiende[] = [];
    private gaute: Fiende | null = null;
    /** Litt pust mellom siste mann faller og stillheten etterpå. */
    private pause = 0;

    constructor(kroker: AngrepKroker) {
        this.kroker = kroker;
    }

    get naa(): AngrepFase {
        return this.fase;
    }

    /**
     * Båten kommer inn vika.
     *
     * Kalles når høsten begynner. Hun får en frist - ikke i dager, men i det
     * hun rekker å gjøre før hun går ned til fjæra: snakke med Kåre, eller la
     * være. Det er hele valget, og hun tar det uten at spillet spør.
     */
    varsle(): void {
        const store = useRpgStore.getState();
        if (this.fase !== 'ingen' || store.steg.includes(K2.angrepet)) return;
        store.settFlagg(ANGREP_FLAGG.varslet);
        this.gjenopprett();
        fraSpill.emit('replikk', {
            hvem: 'Torgeir Gamle',
            tekst: 'Det er Gaute Gråkappe. Han vet at ingen her kan bære skjold.',
        });
    }

    /**
     * Setter angrepet i den tilstanden lagringen sier.
     *
     * Kalles hver gang eleven kommer til gården. Uten den ville båten forsvinne
     * i det hun tar en tur innom hallen: scenen bygges på nytt, klassen begynner
     * på `ingen`, og fem menn som var på vei inn vika har aldri vært der. Det
     * som står i lagringen er sant, ikke det som står i et felt i minnet.
     */
    gjenopprett(): void {
        const store = useRpgStore.getState();
        if (store.steg.includes(K2.angrepet)) {
            this.fase = 'over';
            return;
        }
        if (!store.flagg[ANGREP_FLAGG.varslet]) return;
        this.fase = 'varslet';
        fraSpill.emit('oppgave', {
            tittel: 'En båt i vika',
            mal: 'Fem menn ror inn. Du har til de er i land. Gå ned i fjæra når du er klar.',
        });
    }

    /**
     * Hun går ned i fjæra og møter dem.
     *
     * To utganger, og den ene er ingen kamp. Rekkefølgen er viktig: æren
     * avgjøres *før* noen settes ut, ellers ville eleven se motstanderne dukke
     * opp og forsvinne igjen, og det leser som at spillet ombestemte seg.
     */
    mot(): void {
        if (this.fase !== 'varslet') return;
        const store = useRpgStore.getState();

        if (stillerOpp(store.aere, store.aetter.saebo ?? { velvilje: 0, uoppgjort: 0 })) {
            this.avverg();
            return;
        }

        this.fase = 'kamp';
        startMusikk(this.kroker.musikkRot, 1);
        const vaepnet = Boolean(store.flagg[ANGREP_FLAGG.kaareVaepnet]);
        ANGRIPERE.forEach(({ def, rute }, i) => {
            // Har Kåre fått spyd, tar han den ene. Han slåss ikke *for* eleven i
            // spillets forstand - han binder en mann, og det er nok: hun står
            // mot to i stedet for tre, og hun ser hvorfor.
            const bundet = vaepnet && i === 0;
            const f = this.kroker.settUt(def, rute[0] * TILE + 8, rute[1] * TILE + 8, {
                tilstand: 'jager',
                navn: ENEMY_BY_ID[def]?.name,
                fredelig: bundet,
            });
            if (f) this.menn.push(f);
        });
        const gaute = this.kroker.settUt('gaute', GAUTE_RUTE[0] * TILE + 8, GAUTE_RUTE[1] * TILE + 8, {
            tilstand: 'jager',
            navn: ENEMY_BY_ID.gaute?.name,
            toppstolpe: true,
        });
        if (gaute) {
            this.gaute = gaute;
            this.menn.push(gaute);
        }

        fraSpill.emit('oppgave', {
            tittel: 'Angrepet',
            mal: vaepnet
                ? 'Kåre tar den ene. Du har to igjen, og Gaute.'
                : 'Tre menn, og du står alene mellom dem og bua.',
        });
        fraSpill.emit('replikk', {
            hvem: 'Gaute Gråkappe',
            tekst: 'Ingen her kan hindre meg. Gå til side, husfrue.',
        });
    }

    /**
     * Kampen som ikke skjer.
     *
     * Ingen kamp, ingen XP, ingen loot - og det er meningen. Det eleven får, er
     * en setning fra Vigdis som sier hvorfor, og et kapittel der hun kan peke
     * på juni og si at det var da hun vant høsten.
     */
    private avverg(): void {
        this.fase = 'avverget';
        const store = useRpgStore.getState();
        startEnTone(196);
        sfx.horn();
        // Naboætta står allerede på kartet. De kommer ikke *fra* et sted -
        // de er der, og det er poenget: de bor over vika.
        this.kroker.settSynlig('vigdis', true);
        store.settFlagg(ANGREP_FLAGG.avverget);
        store.fullforSteg(K2.angrepet);
        store.giAere(12, 'Naboætta stilte seg foran tunet ditt. Alle så det.');
        store.larBegrep('gjengave', 'forstatt');
        store.larBegrep('aetten', 'forstatt');
        store.endreAett('hovda', { velvilje: -20 });
        fraSpill.emit('oppgave', null);
        fraSpill.emit('replikk', {
            hvem: 'Vigdis på Sæbø',
            tekst: 'Vi er ni her nede i fjæra nå, Gaute. Du kom for å ta fra én kvinne.',
        });
        fraSpill.emit('beskjed', {
            tittel: 'De snudde',
            tekst:
                'Gaute Gråkappe sto i fjæra og talte. Vigdis og Kolbein og folkene deres sto mellom ham og tunet ditt, og de hadde spyd.\n\nHan sa ikke noe. Han skjøv båten ut igjen.\n\nDu vant den kampen i juni, den dagen du ga fra deg seks sekker korn du selv trengte. Det så ut som sløsing da.',
            knapp: 'Videre',
        });
    }

    /** Ett bilde. Ser etter om det er noen igjen. */
    oppdater(delta: number): void {
        if (this.fase !== 'kamp') return;
        if (this.menn.some((f) => !f.dodd)) return;
        if (this.pause <= 0) this.pause = 1800;
        this.pause -= delta;
        if (this.pause > 0) return;
        this.avsluttKampen();
    }

    /**
     * Tunet er hennes.
     *
     * Og så kommer regningen. Gaute hadde ætt, og et drap er ikke over når
     * mannen ligger: det må lyses innen ett døgn for å være drap og ikke mord.
     * Spillet varsler ikke om fristen - den står på runesteinen ved tingvollen,
     * og hun må ha lest den (§7.2).
     */
    private avsluttKampen(): void {
        this.fase = 'over';
        const store = useRpgStore.getState();
        store.fullforSteg(K2.angrepet);
        store.giAere(10, 'Du sto mellom dem og gården. Alle så det.');
        // Også for den som måtte slåss. Hun lærte det andre veien: det kom
        // ingen, fordi det ikke var noen som skyldte henne noe.
        store.larBegrep('aetten', 'forstatt');
        const falt = Boolean(this.gaute?.dodd);
        if (falt) {
            store.settFlagg(ANGREP_FLAGG.drepteGaute);
            // Steget er det som åpner tingvollen. Uten en sak står det ingen
            // knapp på bålet, og en tom knapp lærer eleven at knapper er pynt.
            store.fullforSteg('k2-sak-reist');
            store.endreAett('hovda', { velvilje: -40, uoppgjort: 1 });
            store.reisSak({
                id: 'sak-gaute',
                gjerning: 'drap',
                gjerningsmann: 'Åsa Torsteinsdotter',
                offer: 'Gaute Gråkappe',
                offersAett: 'hovda',
                offersStand: 'hauld',
                lyst: false,
                skjeddeDag: store.klokke.dag,
                vitner: [],
                anfort: null,
                dom: 'ubehandlet',
            });
        }
        startMusikk(this.kroker.musikkRot, 0);
        fraSpill.emit('motstander', null);
        // Kortet sier hva som haster, ikke hva hun bør gjøre. Fristen er det
        // eneste som står der - og den står der bare fordi hun nettopp drepte
        // en mann med ætt.
        fraSpill.emit(
            'oppgave',
            falt
                ? {
                      tittel: 'Ett døgn',
                      mal: 'Gå til tingvollen mens det er tid. Det som ikke blir lyst, er mord.',
                  }
                : null
        );
        fraSpill.emit('beskjed', {
            tittel: 'Tunet står',
            tekst: [
                falt
                    ? 'Gaute Gråkappe ligger i fjæra. Han hadde ætt, og ætta hans sitter på Hovda, en halv dags roing herfra.'
                    : 'De som kunne gå, gikk. Båten er borte.',
                store.flagg[ANGREP_FLAGG.kaareVaepnet]
                    ? 'Kåre står med spydet ditt i hånda og vet ikke hva han skal gjøre med det. Han har forsvart en gård han ikke eier noe på.'
                    : 'Kåre bar kornet inn i bua mens dere sto der ute. Ingen har sagt noe til ham.',
                falt
                    ? 'Torgeir sier det stille, som om han ikke vil at du skal høre det: «Nå har du ett døgn, Åsa.»'
                    : '',
            ]
                .filter(Boolean)
                .join('\n\n'),
            knapp: 'Videre',
        });
    }

    /** Eleven forlot gården midt i det. Kortene skal ikke bli hengende. */
    avslutt(): void {
        this.menn = [];
        this.gaute = null;
        fraSpill.emit('motstander', null);
    }
}
