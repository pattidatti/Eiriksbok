// Resultatet av en runde og tapsskjermens konkrete tips (fagstoff ut fra hvordan runden endte).

import { fmt } from './draw';
import { tiendeler } from './rules';
import type { Game } from './state';
import { TUNING } from './tuning';

export interface Resultat {
    vant: boolean;
    m: number;
    tittel: string;
    tekst: string;
    nyRekord: boolean;
    fabrikker: number;
    krasj: number;
    brett: number;
    nyePlakater: string[];
    lærdom: string[];
    /** Ett konkret tips ut fra hvordan runden endte (bare ved tap). */
    tips: string;
}

/** Tapsskjermens konkrete tips: hva som skjedde i akkurat denne runden. */
export function tipsFor(g: Game): string {
    const topp = fmt(tiendeler(g.toppMillioner));
    const mål = fmt(g.brett.mål);
    switch (g.årsak) {
        case 'bølgen':
            return `Du hadde ${topp} millioner, og målet var ${mål}. Trykk AVSLUTT når BØLGEN-måleren står på NÆRMER SEG.`;
        case 'forLite':
            return `Du avsluttet med ${fmt(g.resultat[g.bi] ?? 0)}, men målet var ${mål}. Vent noen sekunder lenger etter GRENELLE - tallet ved hodet vokser.`;
        case 'frist':
            return `Du kom opp i ${topp} millioner, men trykket aldri GRENELLE. Den lyser fra ${fmt(TUNING.grenelleFra)} millioner.`;
        case 'splittet':
            return 'Sving i en stor bue rundt halen. Et krasj kutter alt bak, og under 0,5 millioner er streiken splittet.';
        case 'stille':
            return `Du kom opp i ${topp} av ${mål} millioner. Styr rett mot de svarte fabrikkene og sving rundt din egen hale.`;
        default:
            return '';
    }
}
