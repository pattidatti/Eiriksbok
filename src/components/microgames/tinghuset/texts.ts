// All tekst i Tinghuset på ett sted: tap, lærdom, protokollbladene (funn), rangene og
// lappene. Tonen er alvorlig: ingen vitser, ingen poeng for strenge straffer. Dødsstraff
// nevnes saklig i én sjelden sak (dommen som trykkes) og i protokollbladene; en henrettelse
// vises aldri. Kvinnene med tyske kjærester er en sak uten lov - riktig grep er å avvise den.

import type { Cause, CardId } from './state';

export const RANKS: [number, string][] = [
    [0, 'Kontorbud'],
    [10, 'Skrivemaskinist'],
    [25, 'Arkivar'],
    [45, 'Politifullmektig'],
    [70, 'Statsadvokat'],
    [100, 'Riksadvokat'],
];

export const LOSS: Record<Cause, { msg: string; tip: string }> = {
    vent: {
        msg: 'Folk satt for lenge uten dom.',
        tip: 'Rundt 17 000 havnet i fengsel, og mange satt i månedsvis før saken kom opp. Gi forelegg til vanlige medlemssaker - da er rettssalen ledig for de alvorlige.',
    },
    mild: {
        msg: 'Alvorlige saker slapp for lett.',
        tip: 'Et forelegg er en straff påtalemyndigheten foreslår, og det passer for små saker. Angivere og statspoliti måtte for retten.',
    },
};

export const SAKLIG =
    'Når sinnet tar over, blir folk straffet uten dom. I 1945 skjedde det med tusenvis av kvinner som ikke hadde brutt noen lov.';

export const SEIER = {
    tittel: 'Oppgjøret ble ordnet med lov og dom.',
    ekte: 'De ekte tallene: 92 805 saker etterforsket, 46 085 straffet.',
    slutt: 'I 1950 ble 150 jurister spurt om oppgjøret var godt nok. De var delt nesten på midten.',
};

/** Lærings-øyeblikkene: fagkjernen, første gang den spiller inn. Maks tre per runde. */
export const BEATS = {
    alvorlig: {
        tittel: 'Angiver',
        tekst: 'Angivere og statspoliti må for retten. Et forelegg er for mildt for dem - da blir folk sinte.',
    },
    par: {
        tittel: 'Like saker',
        tekst: 'Samme saksnummer betyr samme handling. Avgjør begge før straffenivået faller, så får de samme dom.',
    },
    trinn: {
        tittel: 'Straffene blir mildere',
        tekst: 'Straffenivået falt. En rettssak nå gir mildere dom enn for et øyeblikk siden.',
    },
};

/** Korte lapper ved tingen (maks 7 ord). */
export const PINS = {
    dra: 'Dra mappa til stempelet',
    rett: 'Rettssalen: én sak av gangen',
    sinne: 'Mapper som venter, gjør folk sinte',
    linjal: 'Straffenivået faller trinn for trinn',
    tvilling: 'Tvillingen kommer - vent, eller døm nå?',
    kort: 'Velg ett kort',
    rute: 'Fast rute sender grå mapper selv',
    utenlov: 'Ingen lov forbød dette. Avvis saken.',
    grov: 'Drap og tortur. Dødsstraff var mulig.',
    profittor: 'Profittør: tjente på tyskerne. Treg sak.',
};

/** «Dette skjedde»: det eleven skal sitte igjen med, knyttet til det som skjedde i runden. */
export const LESSONS = {
    forelegg:
        'Et forelegg er en straff påtalemyndigheten foreslår uten rettssak. Det passet for vanlige NS-medlemmer, ikke for angivere og statspoliti.',
    rettssak:
        'Politiet etterforsket 92 805 saker. De alvorlige måtte for retten, og en rettssak tok tid.',
    nivaa: 'Straffene ble mildere fra 1945 til 1948. Sinnet var størst like etter krigen.',
    vent: 'Rundt 17 000 havnet i fengsel, og mange satt lenge før saken kom opp.',
    utenlov:
        'Det var ikke forbudt å ha en tysk kjæreste. Likevel ble flere tusen kvinner satt i leir uten lov og dom. Du avviste sakene - uten lov, ingen sak.',
    ulovlig:
        'Du straffet en kvinne som ikke hadde brutt noen lov. Det skjedde med tusenvis i 1945, og staten ba om unnskyldning i 2018.',
    grov: 'De grovste sakene kunne gi dødsdom. 30 nordmenn ble dømt til døden. Et par år senere ble lignende saker sjeldnere dømt så hardt.',
    profittor:
        'Bare 3 262 ble dømt for økonomisk landssvik. Sakene tok lang tid, og mange som tjente penger på tyskerne, slapp unna.',
};

/** Slutt-skjermen spør om oppgjøret var rettferdig, med elevens egne tall. */
export const RETTFERDIG = {
    sporsmal: 'Var ditt oppgjør rettferdig?',
    linjer: (r: {
        ulike: number;
        jevne: number;
        avvist: number;
        ulovlig: number;
        formildt: number;
    }) =>
        [
            `${r.jevne} like saker fikk lik dom, ${r.ulike} fikk ulik dom bare fordi de kom opp på ulik tid.`,
            r.ulovlig > 0
                ? `${r.ulovlig} uten lov ble straffet likevel. ${r.avvist} saker ble avvist.`
                : r.avvist > 0
                  ? `Alle ${r.avvist} saker uten lov ble avvist - ingen ble straffet uten lov.`
                  : '',
            r.formildt > 0 ? `${r.formildt} alvorlige saker slapp med forelegg.` : '',
        ].filter(Boolean),
};

/** Lærdommen fra det første ulike paret, med elevens egne tall. */
export function ulikLesson(sak: number, a: string, b: string): string {
    return `Sak ${sak}: ${a} og ${b}. Samme handling, ulik straff - bare fordi saken kom opp senere.`;
}

export const CARD_TEXT: Record<CardId, [string, string]> = {
    rettssal: ['Ny rettssal', 'Én rettssal til'],
    dommere: ['Flere dommere', 'Rettssalene 10 % raskere'],
    rute: ['Fast rute', 'Grå mapper fra én leir får forelegg av seg selv'],
    felles: ['Felles behandling', 'Et par i samme rettssal dømmes samtidig'],
    forelegg: ['Ny forelegg-skranke', 'Én forelegg-skranke til'],
};

export type FindId =
    | 'anordning'
    | 'medlem'
    | 'forelegg'
    | 'saker'
    | 'sorensen'
    | 'fengsel'
    | 'okonomisk'
    | 'rinnan'
    | 'tyskerjenter'
    | 'jurister';

/** Protokollbladene: ti funn som samles på tvers av runder. Én setning fagstoff hver. */
export const FINDS: { id: FindId; tittel: string; tekst: string }[] = [
    {
        id: 'anordning',
        tittel: '15. desember 1944',
        tekst: 'Regjeringen i London laget landssvikanordningen. Den ble grunnlaget for hele oppgjøret.',
    },
    {
        id: 'medlem',
        tittel: 'Tilbakevirkende kraft',
        tekst: 'NS-medlemskap ble straffbart etter krigen, selv om det var lovlig da folk meldte seg inn.',
    },
    {
        id: 'forelegg',
        tittel: 'Forelegg',
        tekst: 'Mange NS-medlemmer godtok et forelegg med bot og tap av rettigheter, uten rettssak.',
    },
    {
        id: 'saker',
        tittel: '92 805 saker',
        tekst: 'Politiet etterforsket 92 805 saker. 46 085 endte med straff, 16 083 av dem kvinner.',
    },
    {
        id: 'sorensen',
        tittel: 'Ulik straff',
        tekst: 'Historikeren Øystein Sørensen skriver at noen dødsdømt i 1945-46 neppe ville fått dødsdom i 1948.',
    },
    {
        id: 'fengsel',
        tittel: '17 000 i fengsel',
        tekst: 'Rundt 17 000 fikk fengsel, 80 av dem på livstid. De siste slapp ut i 1957.',
    },
    {
        id: 'okonomisk',
        tittel: 'Økonomisk landssvik',
        tekst: 'Bare 3 262 ble dømt for å ha tjent penger på tyskerne. Mange rike slapp unna.',
    },
    {
        id: 'rinnan',
        tittel: 'De alvorligste sakene',
        tekst: '30 ble dømt til døden og 25 skutt. 22 av dem hadde jobbet for Gestapo eller statspolitiet, ti i Rinnanbanden.',
    },
    {
        id: 'tyskerjenter',
        tittel: 'Uten lov og dom',
        tekst: 'Flere tusen kvinner med tyske kjærester ble satt i leir uten dom. Staten ba om unnskyldning i 2018.',
    },
    {
        id: 'jurister',
        tittel: '1950',
        tekst: '150 jurister ble spurt om oppgjøret var godt nok: 63 sa ja, 64 sa nei, 22 visste ikke.',
    },
];

export const PAUSE_MSG = 'Kalenderen står stille. Mappene venter.';
