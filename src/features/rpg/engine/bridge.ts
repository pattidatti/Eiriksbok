// Broen mellom Phaser-scenen og React-grensesnittet. Selve spilltilstanden
// (liv, sekk, quester) leser begge sider rett fra useRpgStore - broen brukes
// bare til hendelser: «åpne denne dialogen», «eleven svarte riktig».

import type { Gjest, Stilling } from '../types';
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
     * Ressurs, gard og vernslitasje. Sendes et titalls ganger i sekundet, ikke
     * 60: ressursen endrer seg hele tiden, og en store-skriving per bilde ville
     * tegnet HUD-en på nytt like ofte.
     */
    kamp: KampSnapshot;
    /**
     * Hvor eleven står, til de andre i hallen. Sendes bare på steder med
     * `flerspiller`, og bare ti ganger i sekundet.
     *
     * Scenen vet ikke at det finnes et nett. Den melder hvor hun står, og om
     * noen bryr seg om det er ikke dens sak - det er nettopp derfor ingen epoke
     * noen gang trenger nettverkskode.
     */
    minStilling: Stilling;
    /**
     * En cutscene begynner eller slutter. Bjelkene legges av React oppå
     * lerretet, ikke inne i scenen: et lag i Phaser ville blitt skalert av
     * kamerazoomen, og da er en bjelke på 24 piksler plutselig 96 høy.
     */
    klipp: { pa: boolean; kanHoppes: boolean };
    /** Replikken i en cutscene. `hvem: null` er elevens egen tanke. */
    klippTekst: { hvem: string | null; tekst: string } | null;
    /** Åpne et av kapittelets puzzle-overlegg. */
    puzzle: { id: 'skroget' | 'navigasjonen' | 'blotet' | 'vinternettene' };
    /**
     * Et nytt kapittel begynner. Skjermen skal stå stille et øyeblikk før
     * eleven får gå, og hun skal få vite hvem hun er nå.
     */
    opptakt: { nr: number };
    /**
     * Bua er låst opp: forrådet, regnestykket og årets valg.
     *
     * Scenen sender med hva som står åpent nå. Skjermen skal ikke kjenne
     * årstidene - den tegner det den får, og melder hva Åsa bestemte.
     */
    forrad: { apne: string[]; kanGaaVidere: boolean };
    /**
     * Ett skjermbilde som eier hele flaten.
     *
     * Brukes der noe er avgjort og skal få stå alene: båten som snudde, og
     * vinteren som gjorde opp. Ikke et varsel - et varsel forsvinner av seg
     * selv, og dette skal leses.
     */
    beskjed: { tittel: string; tekst: string; knapp: string };
    /** Tinget er satt, og hun står med en sak. */
    tingsak: { sakId: string };
    /**
     * Åpne mellomspillet - bordet med kildene.
     *
     * Eget hendelsesnavn og ikke en tredje `puzzle`-id, fordi de to er ulike
     * ting: et puzzle er noe hun gjør *inne i* året, med verden stående låst
     * bak seg. Mellomspillet er hun ute av året, og det skal kunne åpnes fra
     * pausemenyen like gjerne som fra Orm.
     */
    mellomspill: { id: string };
    /**
     * Det eleven holder på med akkurat nå, som et lite kort i HUD-en.
     *
     * Skilt fra oppdragsloggen med vilje: loggen er alt hun kunne gjort, dette
     * er det ene hun gjør. Står de to samme sted, blir det viktige et punkt i
     * en liste.
     */
    oppgave: { tittel: string; mal: string; teller?: string } | null;
    /**
     * Én replikk sagt midt i spillet, uten å stoppe det.
     *
     * Ikke det samme som `dialog`: den låser verden og åpner et vindu. Dette er
     * Ravn som roper til deg mens dere står og slåss, og barkene fra
     * blueprintens §9 - folk som snakker til hverandre når du går forbi.
     * Flytende pikseltekst over hodet duger til «Parade!», ikke til en setning.
     */
    replikk: { hvem: string; tekst: string } | null;
    /**
     * Den navngitte motstanderen, øverst på skjermen.
     *
     * `andel` er 0-1 av livet hans. Null betyr at han er borte - av bildet
     * eller av verden.
     */
    motstander: { navn: string; andel: number } | null;
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
    /** Start på nytt etter død. */
    gjenoppliv: Record<string, never>;
    /** Styrestikke på skjerm. x og y er -1..1. */
    styring: { x: number; y: number };
    /**
     * Knapp på skjermkontrollen. `gard` er en veksling, ikke et hold - tommelen
     * kan ikke holde skjoldet og slå samtidig.
     */
    knapp: { navn: 'angrep' | 'rull' | 'bruk' | 'gard' };
    /**
     * De andre i hallen, ferdig filtrert for dem eleven har skjult.
     *
     * Går ikke gjennom React-tilstand. Kommer ti ganger i sekundet per elev i
     * rommet, og en `setState` per melding ville tegnet hele grensesnittet på
     * nytt hundre og seksti ganger i sekundet.
     */
    gjester: { liste: Gjest[] };
    /** Eleven sendte en følelse selv. Vises over hennes eget hode også. */
    folelse: { emoji: string | null };
    /** Neste replikk i cutscenen. */
    klippVidere: Record<string, never>;
    /** Hopp over hele cutscenen. Bare tillatt når hun har sett den før. */
    klippHoppOver: Record<string, never>;
    /**
     * Et puzzle er avsluttet. `lost` er falsk når eleven ga opp.
     *
     * `forsteForsok` er ikke belønning - det er noe Orm husker. Å gjøre det
     * riktig på første forsøk skal merkes i verden, ikke i tallene.
     *
     * `utfall` finnes for blotet, som er det ene puzzlet der «ikke løst» og
     * «gikk fra det» ikke er samme sak: et blot som ble holdt, ble holdt -
     * også når gaven ikke passet. Scenen må kunne skille de to, ellers teller
     * et Esc-trykk som en kveld ved horgen.
     */
    puzzleSvar: { id: string; lost: boolean; forsteForsok?: boolean; utfall?: string };
    /**
     * Eleven la fra seg kildene. `gjennomgatt` er falsk når hun gikk før hun
     * kom til det tomme feltet - da har hun ikke sett det bordet skulle vise
     * henne, og mellomspillet er ikke fullført.
     */
    mellomspillFerdig: { id: string; gjennomgatt: boolean };
    /**
     * Eleven valgte en kapittelhandling i en samtale - «Vis meg», «Jeg legger
     * bordene». Scenen eier hva som faktisk skjer.
     */
    npcHandling: { npcId: string; handlingId: string };
    /** Opptakten er lest. Låsen tas av, og kapittelet begynner. */
    opptaktFerdig: { nr: number };
    /**
     * Eleven valgte noe ved et landemerke - «Lås opp bua». Samme form som
     * `npcHandling`, og av samme grunn: dataene sier hva knappen heter, scenen
     * eier hva som skjer.
     */
    landemerkeHandling: { landmarkId: string; handlingId: string };
    /** Åsa bestemte seg i bua. `alternativ` er tomt når hun bare lukket den. */
    forradValg: { beslutning: string; alternativ: string };
    /** Året skal gå videre til neste årstid. */
    forradVidere: Record<string, never>;
    /** Bua lukkes igjen. */
    forradLukk: Record<string, never>;
    /** Beskjeden er lest. */
    beskjedLest: Record<string, never>;
    /**
     * Ett skritt i en tingsak.
     *
     * Ett hendelsesnavn og ikke fem: de fire trinnene er *samme* sak som beveger
     * seg, og fire navn hadde invitert til fire steder som fører den hver for
     * seg. Scenen er den ene som skriver i saken.
     */
    tingsakSvar:
        | { art: 'lys' }
        | { art: 'vitner'; vitner: string[] }
        | { art: 'hjemmel'; id: string }
        | { art: 'dom' }
        | { art: 'lukk' };
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
