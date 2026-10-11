// All tekst i Brevnettet: tap, tips, seier, lærings-øyeblikk og «Dette skjedde».

import { tente, type Game, type Årsak } from './game';

export const TAP_TITTEL: Record<Årsak, string> = {
    mørkt: 'Alt lyset slukket',
    ringer: 'Tre stuer ga opp',
    fengsel: 'Fengselsårene tok alt',
};

export const TIPS: Record<Årsak, string> = {
    mørkt: 'Alle stuene hang bare på Hauge. Da han ble tatt, sto de alene. Bind stuene til hverandre - det var slik bevegelsen overlevde 1804-1814.',
    ringer: 'Hauge kunne ikke være overalt. Derfor pekte han ut lokale ledere, og vennene holdt kontakten med brev. Ikke bruk alt garnet på Hauge - en stue som er bundet til nabostua, trenger ham ikke.',
    fengsel:
        'I 1804 klipper lensmannen alle tråder som en stue henger på alene, og så én tråd om gangen. En stue med to tråder tåler ett klipp. Lag ringer, ikke rekker.',
};

export const SEIER =
    '1814. Hauge er dømt, men bevegelsen lever. Tre av mennene på Eidsvoll er haugianere.';

export const ØYEBLIKK = {
    regel: {
        tittel: 'Lensmannen kommer!',
        tekst: 'Han tar Hauge og river trådene hans. Stuer som bare henger på Hauge, slukner. Bind dem sammen!',
    },
    klipp: {
        tittel: 'Lensmannen klipper',
        tekst: 'Den røde tråden ryker når han tar Hauge. Gi stua en tråd til, eller dra den røde tråden på nytt.',
    },
    stor: {
        tittel: '1804: Hauge tas for godt',
        tekst: 'Nå klipper lensmannen alle tråder som en stue henger på alene. Stuer i ring, med to tråder, står igjen.',
    },
};

export const LAPP = {
    tenn: 'Dra fra Hauge til stua',
    ring: 'Folk venter her. Tenn stua i tide',
    nøster: 'Hver tråd koster ett nøste',
    saltverk: 'Hauge er ute i fem sekunder!',
    akkurat: 'Akkurat!',
};

export const LÆRDOM = {
    reddet: 'Stuene du bandt til hverandre, levde videre da lensmannen tok Hauge.',
    alene: 'Stuer som bare hang på Hauge, slukket da han ble tatt.',
    gaOpp: 'Hauge kunne ikke være overalt. Vennene trengte lokale ledere og brev.',
    fengsel: 'Hauge satt i fengsel fra 1804, men vennene holdt kontakten med brev.',
    eidsvoll: 'I 1814 var tre av mennene på Eidsvoll haugianere.',
};

/**
 * «Dette skjedde»: knyttet til det eleven faktisk gjorde i runden. Nøkkel, tekst og vekt
 * (tyngst vises først).
 */
export function lærdomFra(g: Game, vant: boolean): [string, string, number][] {
    const ut: [string, string, number][] = [];
    const { raknet, reddetMaks, knyttet } = g.stat;
    if (reddetMaks > 0)
        ut.push([
            'reddet',
            `Det meste du hadde: ${reddetMaks} stuer som levde videre etter at lensmannen tok Hauge. De var bundet til hverandre.`,
            3,
        ]);
    if (raknet > 0)
        ut.push([
            'alene',
            raknet === 1
                ? 'Én stue slukket fordi den bare hang på Hauge eller på én tråd som ble klippet.'
                : `${raknet} stuer slukket fordi de bare hang på Hauge eller på én tråd som ble klippet.`,
            2,
        ]);
    if (g.steiner > 0) ut.push(['gaOpp', LÆRDOM.gaOpp, 2]);
    if (knyttet > 0)
        ut.push([
            'knytt',
            `Du knyttet ${knyttet} tråder på nytt. Vennene holdt kontakten med brev.`,
            1,
        ]);
    if (vant) ut.push(['eidsvoll', `${tente(g).length} stuer lyste i 1814. ${LÆRDOM.eidsvoll}`, 4]);
    else ut.push(['fengsel', LÆRDOM.fengsel, 1]);
    return ut;
}
