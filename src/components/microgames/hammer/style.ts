import type { Klasse, Kind } from './game';
import { PAL } from './models';

// HAMMER OG AMBOLT - HUD-en: mosaikkens ramme.
//
// Topplinja og butikken er innrammet av en «løpende hund» (bølgemeander) i gul oker på
// sot, som bordene rundt Aleksandermosaikken. Kortene er tessera-plater med enhetens
// silhuett og prisen i en gullmynt. Ingen blå farge.

const wave = (stroke: string, bg: string) =>
    `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='12' viewBox='0 0 24 12'><rect width='24' height='12' fill='${bg}'/><path d='M0 10.2 H3 C8.5 10.2 9.5 2 14.5 2 C18.5 2 19.5 6.2 16.6 7 C14.6 7.6 13.6 5.4 15.2 4.8 M14.5 10.2 H24' fill='none' stroke='${stroke}' stroke-width='1.7' stroke-linecap='round'/></svg>`
    )}")`;

export const MEANDER = wave(PAL.gul, PAL.sot);
const MEANDER_RED = wave(PAL.kalk, PAL.rod);

/** Farge per klasse (stripa nederst på kortet). */
export const KL_COLOR: Record<Klasse, string> = {
    tung: PAL.sot,
    lett: PAL.gul,
    kav: PAL.rod,
    skytter: PAL.blod,
    vogn: PAL.umbra,
    elefant: '#8b7f72',
};

export const KL_NAME: Record<Klasse, string> = {
    tung: 'Tungt fotfolk',
    lett: 'Lett infanteri',
    kav: 'Ryttere',
    skytter: 'Skyttere',
    vogn: 'Vogner',
    elefant: 'Elefanter',
};

/** Silhuetter (viewBox 0 0 48 48). f = fylt, ellers strek. */
export const ICONS: Record<Klasse | 'item', { d: string; f?: boolean; w?: number }[]> = {
    tung: [
        { d: 'M5 45 L45 5', w: 3 },
        { d: 'M20 17a11 11 0 1 0 .01 0Z', f: true },
        { d: 'M29 4a5 5 0 1 0 .01 0Z', f: true },
    ],
    lett: [
        { d: 'M8 42 L40 10', w: 3 },
        { d: 'M40 10 L45 4 L37 7Z', f: true },
        { d: 'M11 19 a14 14 0 0 0 18 18 a10 10 0 0 1 -18 -18Z', f: true },
    ],
    skytter: [
        { d: 'M15 4 Q39 24 15 44', w: 3.5 },
        { d: 'M15 4 L15 44', w: 1.2 },
        { d: 'M4 24 L40 24', w: 2.5 },
        { d: 'M39 19 L47 24 L39 29Z', f: true },
    ],
    kav: [
        { d: 'M7 31 Q9 22 19 22 L31 22 Q35 16 39 11 L44 13 L41 22 Q43 27 38 31 L37 43 L34 43 L33 33 L17 33 L14 43 L11 43 L12 33 Q7 33 7 31Z', f: true },
        { d: 'M21 22 L23 13 a4.5 4.5 0 1 1 5 0 L29 22Z', f: true },
        { d: 'M12 23 L46 5', w: 2.5 },
    ],
    vogn: [
        { d: 'M16 21a11 11 0 1 0 .01 0Z', w: 3 },
        { d: 'M16 21 L16 43 M5 32 L27 32 M8 24 L24 40 M24 24 L8 40', w: 1.6 },
        { d: 'M27 32 L47 27', w: 3 },
        { d: 'M19 12 L39 12 L39 24 L22 24Z', f: true },
    ],
    elefant: [
        { d: 'M6 27 Q6 12 22 12 Q34 12 38 18 Q45 20 44 29 L44 41 L40 41 L40 31 Q38 34 36 34 L36 42 L31 42 L31 34 L17 34 L17 42 L12 42 L12 34 Q6 32 6 27Z', f: true },
        { d: 'M37 26 L47 22', w: 2.5 },
        { d: 'M13 5 L29 5 L29 11 L13 11Z', f: true },
    ],
    item: [{ d: 'M24 4 L27.5 18 L42 24 L27.5 30 L24 44 L20.5 30 L6 24 L20.5 18Z', f: true }],
};

/**
 * Lærings-øyeblikket første gang en enhetstype står på slagmarken: hva den gjør, og
 * hva som slår den. Fagkjernen i én setning (maks 22 ord).
 */
export const BEAT: Partial<Record<Kind, [string, string, number]>> = {
    vogn: ['Ljåvogner', 'Ljåer på hjulene meier ned tette rekker. Lett infanteri åpner rekkene, og vogna treffer ingen.', 10],
    elefant: ['Krigselefanter', 'Hester blir redde for elefanter. Lett infanteri stikker dem, og en såret elefant tråkker ned sine egne.', 10],
    dareios: ['Storkongen', 'Dareios styrer fra vogna midt i hæren. Flykter han, gir hele hæren hans opp.', 9],
    falanks: ['Falanksen', 'Spyd på fem meter holder ryttere unna forfra. Men fra siden er falanksen hjelpeløs.', 9],
    skyter: ['Hesteskyttere', 'De skyter fra hesteryggen og rir unna. Lett infanteri og skyttere tar dem, ikke ryttere.', 8],
    dahe: ['Daher', 'Steppefolk som skyter og flykter. Tunge ryttere tar dem aldri igjen, så bruk skyttere.', 8],
    hetairoi: ['Hetairoi', 'Aleksanders rytterkile. Send dem rundt flanken mens fotfolket holder fienden fast forfra.', 8],
    hoplitt: ['Hoplitter', 'Tungt fotfolk med stort skjold. Skyttere slår dem på avstand før de rekker fram.', 7],
    bue: ['Persiske bueskyttere', 'Piler i sverm mot tregt fotfolk. Send ryttere mot dem, så er det over.', 7],
    kreter: ['Bueskyttere fra Kreta', 'De skyter tungt fotfolk ned på avstand. Sett dem i bakre rekke, bak en vegg.', 7],
    poros: ['Kong Poros', 'Poros venter bak elefantene. Når halve hæren hans er borte, kommer han selv.', 7],
    udodelig: ['De udødelige', 'Persias beste fotfolk skyter først og slåss etterpå. Ryttere fra siden knekker dem.', 6],
    slynge: ['Slyngekastere', 'Steiner fra høyden treffer før du kommer fram. Lett infanteri klatrer opp og tar dem.', 6],
    inder: ['Indiske langbuer', 'Lange buer som når langt. Ryttere rundt flanken når dem før pilene gjør skade.', 6],
    asp: ['Persiske ryttere', 'De knuser skyttere. Sett en falanks foran: spydene stopper hestene forfra.', 5],
    agrianer: ['Agrianere', 'Fjellfolk med kastespyd. De stikker elefanter og ljåvogner, men tåler lite mot tungt fotfolk.', 5],
    hypaspist: ['Hypaspister', 'Raske skjoldbærere. De åpner rekkene når ljåvogner kommer, og vogna treffer ingen.', 5],
    tessaler: ['Tessalske ryttere', 'Gode ryttere på flanken. De knuser skyttere, men dør hvis de rir rett på spyd.', 4],
    baktrer: ['Baktriske ryttere', 'Tunge ryttere fra øst. Piker forfra stopper dem, og skyttere bak blir ridd ned.', 4],
    kardak: ['Kardaker', 'Lett persisk fotfolk: billig og raskt, men ryttere og falanks knuser dem.', 3],
    indrytter: ['Indiske ryttere', 'Lette ryttere ved siden av elefantene. Piker forfra stopper dem.', 3],
};

export const CSS = `
.ha-root{position:absolute;inset:0;font-family:Inter,system-ui,sans-serif;color:${PAL.kalk};container:ha / size}
.ha-top{position:absolute;left:8px;right:8px;top:6px;display:flex;gap:6px;align-items:stretch;pointer-events:none;z-index:4}
.ha-box{position:relative;background:rgba(28,23,20,.9);border:2px solid ${PAL.sot};box-shadow:0 0 0 2px ${PAL.gul} inset;padding:4px 10px 13px;display:flex;flex-direction:column;justify-content:center}
.ha-box::after{content:'';position:absolute;left:2px;right:2px;bottom:2px;height:8px;background:${MEANDER};background-size:16px 8px;opacity:.9}
.ha-lab{font-size:13px;letter-spacing:.14em;font-weight:800;color:${PAL.gul};text-transform:uppercase}
.ha-val{font-family:Outfit,Inter,sans-serif;font-size:22px;font-weight:900;line-height:1.05;letter-spacing:.02em}
.ha-name{font-family:Outfit,Inter,sans-serif;font-size:23px;font-weight:900;line-height:1;text-transform:uppercase;letter-spacing:.05em}
.ha-rule{font-size:15.5px;font-weight:700;line-height:1.25;max-width:300px}
.ha-camp{display:flex;gap:3px;margin-top:4px}
.ha-camp i{width:13px;height:9px;background:#3a2f26;border:1px solid #000;display:block}
.ha-camp i.w{background:${PAL.gul}}
.ha-camp i.l{background:${PAL.blod}}
.ha-camp i.now{background:${PAL.kalk};animation:haBlink 1s infinite alternate}
@keyframes haBlink{from{opacity:1}to{opacity:.45}}
.ha-coin{display:inline-block;width:18px;height:18px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#f7dc8a,${PAL.gul} 55%,#8a6420);border:2px solid ${PAL.sot};vertical-align:-3px;margin-right:5px}
.ha-hearts{font-size:20px;letter-spacing:2px;color:${PAL.rod};text-shadow:0 1px 0 #000}
.ha-syn{position:absolute;left:8px;top:74px;display:flex;flex-direction:column;gap:3px;z-index:4;pointer-events:none;max-width:290px}
.ha-syn div{background:rgba(28,23,20,.78);border-left:5px solid #4a3c30;padding:2px 7px;font-size:15px;line-height:1.25}
.ha-syn div.on{border-left-color:${PAL.gul};background:rgba(28,23,20,.92)}
.ha-syn b{font-family:Outfit,Inter,sans-serif;letter-spacing:.02em}
.ha-bottom{position:absolute;left:8px;right:8px;bottom:8px;display:flex;gap:8px;align-items:flex-end;z-index:5}
.ha-shop{display:flex;gap:7px;flex:1;min-width:0;padding:8px 8px 8px;background:rgba(28,23,20,.82);border:2px solid ${PAL.sot};box-shadow:0 0 0 2px ${PAL.gul} inset;position:relative}
.ha-shop::before{content:'';position:absolute;left:2px;right:2px;top:-12px;height:10px;background:${MEANDER};background-size:20px 10px;border:1px solid ${PAL.sot}}
.ha-card{flex:1;min-width:0;max-width:200px;min-height:104px;color:${PAL.sot};border:2px solid ${PAL.sot};padding:6px 8px 9px 42px;text-align:left;cursor:grab;box-shadow:0 4px 0 ${PAL.sot};touch-action:none;user-select:none;position:relative;transition:transform .12s;
 background-color:${PAL.kalk};background-image:repeating-linear-gradient(0deg,rgba(107,74,44,.13) 0 1px,transparent 1px 8px),repeating-linear-gradient(90deg,rgba(107,74,44,.13) 0 1px,transparent 1px 8px)}
.ha-card:hover{transform:translateY(-4px) rotate(-.6deg)}
.ha-card.sold{visibility:hidden}
.ha-card.poor{opacity:.5;filter:saturate(.4)}
.ha-card.scout{box-shadow:0 4px 0 ${PAL.sot},0 0 0 3px ${PAL.gul},0 0 16px 2px rgba(217,164,65,.7)}
.ha-card .ic{position:absolute;left:5px;top:22px;width:36px;height:36px}
.ha-card .n{font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:15.5px;text-transform:uppercase;line-height:1.05;display:block;overflow-wrap:anywhere;hyphens:auto}
.ha-card .k{font-size:13.5px;font-weight:800;color:${PAL.umbra};display:block;margin:2px 0 3px}
.ha-card .h{font-size:14.5px;line-height:1.25;display:block;font-weight:600}
.ha-card .c{position:absolute;left:5px;top:4px;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:18px;color:${PAL.sot};background:radial-gradient(circle at 35% 30%,#f7dc8a,${PAL.gul} 55%,#8a6420);border:2px solid ${PAL.sot}}
.ha-card .ic{top:38px}
.ha-card .sw{position:absolute;left:0;right:0;bottom:0;height:6px}
.ha-card .sc{position:absolute;right:6px;top:-11px;font-size:13px;font-weight:900;color:${PAL.sot};background:${PAL.gul};padding:1px 6px;letter-spacing:.08em;border:1.5px solid ${PAL.sot}}
.ha-side{display:flex;flex-direction:column;gap:6px;width:140px}
.ha-btn{font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:18px;letter-spacing:.06em;text-transform:uppercase;background:rgba(28,23,20,.92);color:${PAL.kalk};border:2px solid ${PAL.sot};box-shadow:0 0 0 2px ${PAL.gul} inset,0 3px 0 ${PAL.sot};padding:9px 10px;cursor:pointer}
.ha-btn:hover:not(:disabled){background:${PAL.umbra}}
.ha-btn:disabled{opacity:.45;cursor:default}
.ha-btn.go{background:${PAL.rod};font-size:21px;padding:14px 10px;box-shadow:0 0 0 2px ${PAL.kalk} inset,0 4px 0 ${PAL.sot}}
.ha-btn.go:hover:not(:disabled){background:#b84a30}
.ha-btn.on{background:${PAL.gul};color:${PAL.sot}}
.ha-bench{position:absolute;left:8px;bottom:190px;display:flex;gap:5px;z-index:5;align-items:center}
.ha-bench .lbl{font-family:Outfit,Inter,sans-serif;font-size:14.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;margin-right:2px;background:${PAL.sot};color:${PAL.gul};padding:3px 6px;border:1.5px solid ${PAL.gul}}
.ha-bs{width:78px;height:44px;border:2px dashed rgba(239,227,200,.7);background:rgba(28,23,20,.5);display:flex;align-items:center;justify-content:center;font-size:14.5px;font-weight:800;text-align:center;line-height:1.1;touch-action:none;user-select:none;cursor:grab;padding:2px}
.ha-bs.full{border-style:solid;border-color:${PAL.sot};color:${PAL.sot};box-shadow:0 3px 0 ${PAL.sot}}
.ha-slot{position:absolute;width:88px;height:60px;margin-left:-44px;margin-top:-30px;border:2px dashed transparent;border-radius:3px;z-index:3;touch-action:none;user-select:none;display:flex;align-items:flex-end;justify-content:center}
.ha-slot.drop{border-color:rgba(239,227,200,.75);background:rgba(28,23,20,.12)}
.ha-slot.over{border-color:${PAL.gul};border-style:solid;background:rgba(217,164,65,.3)}
.ha-slot.has{cursor:grab}
.ha-hint{position:absolute;top:-26px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:15px;font-weight:900;padding:2px 7px;border:2px solid ${PAL.sot};pointer-events:none;box-shadow:0 2px 0 ${PAL.sot}}
.ha-hint.good{background:${PAL.gul};color:${PAL.sot}}
.ha-hint.bad{background:${PAL.rod};color:${PAL.kalk}}
.ha-hint.even{background:rgba(28,23,20,.85);color:${PAL.kalk}}
.ha-lbl{position:absolute;transform:translate(-50%,-100%);font-size:13.5px;font-weight:800;white-space:nowrap;padding:1px 6px;background:rgba(239,227,200,.92);color:${PAL.sot};border:1.5px solid ${PAL.sot};pointer-events:none;z-index:2;box-shadow:0 2px 0 rgba(28,23,20,.5)}
.ha-lbl.foe{background:rgba(28,23,20,.88);color:#f3d7a8;border-color:${PAL.umbra}}
.ha-ghost{position:absolute;pointer-events:none;z-index:20;transform:translate(-50%,-50%) rotate(-3deg);background:${PAL.kalk};color:${PAL.sot};border:2px solid ${PAL.sot};padding:5px 10px;font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:17px;text-transform:uppercase;box-shadow:0 6px 0 ${PAL.sot},0 10px 20px rgba(0,0,0,.4)}
.ha-fx{position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden}
.ha-burst{position:absolute;width:240px;height:240px;margin:-120px 0 0 -120px;border-radius:50%;background:radial-gradient(circle,rgba(255,252,236,1) 0,rgba(255,236,170,.95) 18%,rgba(217,164,65,.55) 40%,rgba(217,164,65,0) 68%);mix-blend-mode:screen;animation:haBurst .8s ease-out forwards}
.ha-burst::after{content:'';position:absolute;inset:30px;border-radius:50%;border:5px solid rgba(255,244,210,.95);animation:haRing .8s ease-out forwards}
@keyframes haBurst{0%{transform:scale(.15);opacity:1}35%{opacity:1}100%{transform:scale(1.5);opacity:0}}
@keyframes haRing{0%{transform:scale(.2);opacity:1}100%{transform:scale(1.9);opacity:0}}
.ha-sell{outline:3px dashed ${PAL.rod};outline-offset:2px}
.ha-battle{position:absolute;right:8px;bottom:8px;display:flex;gap:6px;z-index:5}
.ha-ability{position:absolute;left:8px;bottom:8px;z-index:5;display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.ha-ability .ha-btn{font-size:23px;padding:13px 26px;background:${PAL.rod};box-shadow:0 0 0 2px ${PAL.kalk} inset,0 4px 0 ${PAL.sot}}
.ha-ability .ha-btn small{display:block;font-size:13px;letter-spacing:.14em;opacity:.8}
.ha-ability .ha-btn.ready{animation:haPulse .55s infinite alternate}
@keyframes haPulse{from{box-shadow:0 0 0 2px ${PAL.kalk} inset,0 4px 0 ${PAL.sot},0 0 0 0 ${PAL.gul}}to{box-shadow:0 0 0 2px ${PAL.kalk} inset,0 4px 0 ${PAL.sot},0 0 22px 6px ${PAL.gul}}}
.ha-reward{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:40px;gap:10px;background:linear-gradient(180deg,rgba(28,23,20,0) 30%,rgba(28,23,20,.7));z-index:8}
.ha-reward h3{font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:25px;letter-spacing:.08em;text-transform:uppercase;margin:0;padding:6px 18px 14px;background:${PAL.rod};border:2px solid ${PAL.sot};position:relative;box-shadow:0 4px 0 ${PAL.sot}}
.ha-reward h3::after{content:'';position:absolute;left:3px;right:3px;bottom:3px;height:8px;background:${MEANDER_RED};background-size:16px 8px}
.ha-reward .row{display:flex;gap:12px}
.ha-reward .ha-card{width:190px;max-width:none;min-height:118px;cursor:pointer}
@container ha (max-width: 1060px) or (max-height: 600px) {
 .ha-card{min-height:58px;padding:5px 6px 8px 38px}
 .ha-card .h{display:none}
 .ha-card .k{font-size:11.5px;margin:1px 0 0}
 .ha-card .n{font-size:14.5px}
 .ha-card .c{width:26px;height:26px;font-size:17px}
 .ha-card .ic{width:28px;height:28px;top:30px;left:4px}
 .ha-shop{padding:5px;gap:5px}
 .ha-side{width:112px}
 .ha-btn{font-size:14.5px;padding:7px 8px}
 .ha-btn.go{font-size:18px;padding:10px 8px}
 .ha-bench{bottom:98px}
 .ha-bs{width:64px;height:36px;font-size:12px}
 .ha-syn{display:none}
 .ha-rule{font-size:13px;max-width:190px}
 .ha-box{padding:3px 7px 12px}
 .ha-val,.ha-name{font-size:19px}
 .ha-ability .ha-btn{font-size:19px;padding:9px 16px}
 .ha-lbl{font-size:11.5px;padding:0 4px}
}
@container ha (max-width: 700px) {
 .ha-card .k{display:none}
 .ha-rule{display:none}
 .ha-camp{display:none}
}
.ha-root .arc-beat{width:min(440px,90%)}
.ha-root .arc-beat-title{font-size:21px}
.ha-root .arc-beat p{font-size:16px;line-height:1.4}
.ha-root .arc-ring{display:none !important}
.ha-tip{font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:15px;letter-spacing:.04em;background:${PAL.gul};color:${PAL.sot};border:2px solid ${PAL.sot};padding:4px 10px;box-shadow:0 3px 0 ${PAL.sot}}
.ha-card .sc.ny{background:${PAL.rod};color:${PAL.kalk}}
.ha-syn div.ha-lesson{background:${PAL.kalk};color:${PAL.sot};border:2px solid ${PAL.sot};border-left:6px solid ${PAL.rod};padding:6px 10px 8px;font-size:15px;line-height:1.35;font-weight:600;box-shadow:0 3px 0 ${PAL.sot};margin-bottom:4px}
.ha-lesson .t{display:block;font-family:Outfit,Inter,sans-serif;font-weight:900;font-size:16px;text-transform:uppercase;letter-spacing:.05em;color:${PAL.rod};margin-bottom:2px}
`;
