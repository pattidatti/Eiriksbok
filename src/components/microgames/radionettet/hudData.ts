import type { EKind, EvneId, Kind } from './tuning';
import { waveDef, type G } from './game';

// Tekst og stil til HUD-en (egen fil, så hud.tsx bare eksporterer komponenter).

export const ROLE: Record<Kind, string> = {
    inf: 'Ser skjulte kanoner',
    vogn: 'Sterk, men ser lite',
    pv: 'Knuser stridsvogner',
    art: 'Skyter langt, ser lite',
    lv: 'Skyter ned fly',
    jag: 'Jakter fiendens fly',
    bomb: 'Bomber det nettet ser',
    fsk: 'Soldater som hopper ut',
};

/** Undertekst på ordreknappene: når den er klar, og mens den holder på. */
export const EVNE_TEKST: Record<EvneId, { klar: string; busy: string }> = {
    kompani: { klar: 'Klikk, så dit', busy: 'Nytt kompani kommer' },
    snik: { klar: 'Ett mål nettet ser', busy: 'Sikter ...' },
    sperre: { klar: 'Ild der nettet ser', busy: 'Granater i lufta!' },
    rakett: { klar: 'Raketter på en linje', busy: 'Flyet stuper inn!' },
};

const ENAME: Record<EKind, [string, string]> = {
    einf: ['infanterigruppe', 'infanterigrupper'],
    evogn: ['stridsvogn', 'stridsvogner'],
    epak: ['panservernkanon', 'panservernkanoner'],
    estuka: ['stupbomber', 'stupbombere'],
    ejag: ['jagerfly', 'jagerfly'],
    ebatt: ['skjult batteri', 'skjulte batterier'],
};

export function wavePreview(g: G) {
    const n = new Map<EKind, number>();
    for (const gr of waveDef(g).groups) n.set(gr.kind, (n.get(gr.kind) ?? 0) + gr.n);
    return [...n].map(([k, c]) => `${c} ${ENAME[k][c === 1 ? 0 : 1]}`).join(' · ');
}

// Militær og nøktern: mørk oliven med sjablongskrift i båndet, kakifargede kort som
// ordreark nederst. Tallene står i Inter, så de er lette å lese på Chromebook.
export const HUD_CSS = `
.rn-short{max-width:180px}
.rn-evner{display:flex;gap:8px;align-items:flex-end;pointer-events:auto}
.rn-evne{position:relative;overflow:hidden;width:164px;height:66px;padding:6px 9px;text-align:left;border:2px solid #11130c;border-radius:4px;background:linear-gradient(#56643a,#3a4527);color:#f1ead2;cursor:pointer;box-shadow:0 4px 0 #11130c,0 6px 14px rgba(0,0,0,.4);font-family:Inter,sans-serif;transition:transform .12s}
.rn-evne .cd{position:absolute;left:0;right:0;top:0;background:rgba(14,16,10,.72);transition:height .2s linear;pointer-events:none}
.rn-evne .top{position:relative;display:flex;align-items:center;white-space:nowrap}
.rn-evne .rn-key{position:relative;margin-right:6px;flex-shrink:0}
.rn-evne .nm{position:relative;font-family:'Stardos Stencil',Inter,sans-serif;font-weight:700;font-size:16px;letter-spacing:.02em;line-height:1.2;text-transform:uppercase;white-space:nowrap}
.rn-evne .sb{position:relative;display:block;font-size:14px;font-weight:700;opacity:.92;margin-top:5px;white-space:nowrap}
.rn-evne[data-state="wait"]{color:#b9b39c;cursor:default}
.rn-evne[data-state="ready"]{animation:rn-pop .45s cubic-bezier(.3,1.8,.5,1),rn-glow 1.4s ease-in-out .45s infinite}
.rn-evne[data-state="ready"]:hover{transform:translateY(-4px) rotate(-1deg)}
.rn-evne[data-state="ready"]:active{transform:translateY(3px)}
.rn-evne[data-state="armed"]{background:linear-gradient(#ffd75a,#e0a924);color:#1f2318;transform:translateY(-8px);box-shadow:0 4px 0 #11130c,0 0 0 4px rgba(255,215,90,.45),0 0 26px rgba(255,200,60,.8)}
.rn-evne.sperre{width:176px;background:linear-gradient(#8a2a17,#5a1a0e)}
.rn-evne.sperre[data-state="ready"]{background:repeating-linear-gradient(-45deg,#a8321a 0 14px,#7c2312 14px 28px);background-size:40px 40px;animation:rn-pop .45s cubic-bezier(.3,1.8,.5,1),rn-glow-red 1s ease-in-out .45s infinite,rn-stripe 1.2s linear infinite}
.rn-evne.sperre[data-state="ready"] .nm{font-size:21px;text-shadow:0 2px 0 #3a0d06}
.rn-evne.sperre[data-state="armed"]{background:repeating-linear-gradient(-45deg,#ffd75a 0 14px,#f0b22c 14px 28px);background-size:40px 40px;animation:rn-stripe .6s linear infinite,rn-shake .25s linear infinite}
.rn-evne.rakett{background:linear-gradient(#3d4d63,#27323f)}
.rn-pause{pointer-events:auto;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 10px;border:2px solid #11130c;border-radius:4px;background:#d8cfae;color:#1f2318;cursor:pointer;box-shadow:0 4px 0 #11130c;font-family:Inter,sans-serif}
.rn-pause .ic{font-size:24px;font-weight:900;line-height:1}
.rn-pause[data-on="1"]{background:#ffd75a;animation:rn-glow 1s ease-in-out infinite}
@keyframes rn-pop{0%{transform:translateY(10px);filter:brightness(2.2)}55%{transform:translateY(-9px);filter:brightness(1.5)}100%{transform:translateY(0);filter:none}}
@keyframes rn-glow{0%,100%{box-shadow:0 4px 0 #11130c,0 0 0 0 rgba(255,214,90,0)}50%{box-shadow:0 4px 0 #11130c,0 0 0 4px rgba(255,214,90,.55),0 0 18px rgba(255,200,60,.55)}}
@keyframes rn-glow-red{0%,100%{box-shadow:0 4px 0 #11130c,0 0 0 0 rgba(255,80,40,0)}50%{box-shadow:0 4px 0 #11130c,0 0 0 4px rgba(255,90,40,.6),0 0 24px rgba(255,70,30,.75)}}
@keyframes rn-stripe{from{background-position:0 0}to{background-position:40px 0}}
@keyframes rn-shake{0%,100%{transform:translateY(-8px) translateX(0)}25%{transform:translateY(-8px) translateX(-2px)}75%{transform:translateY(-8px) translateX(2px)}}
.rn-pausekort{position:absolute;left:50%;top:84px;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:8px 14px;background:rgba(228,220,195,.97);border:2px solid #11130c;border-radius:4px;box-shadow:0 4px 0 #11130c,0 8px 20px rgba(0,0,0,.4);font-family:Inter,sans-serif;font-size:15px;color:#1f2318;pointer-events:auto;white-space:nowrap}
.rn-pausekort b{font-family:'Stardos Stencil',Inter,sans-serif;font-size:24px;letter-spacing:.08em}
.rn-pausekort button{padding:6px 12px;border:2px solid #11130c;border-radius:3px;background:#4a5a2a;color:#f1ead2;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 3px 0 #11130c}
.rn-pausekort button.lys{background:#d8cfae;color:#1f2318}
.rn-pausetone{position:absolute;inset:0;pointer-events:none;background:rgba(30,36,22,.28);box-shadow:inset 0 0 0 4px rgba(255,215,90,.7)}
.rn-scrim{position:absolute;inset:0;pointer-events:none;background:
radial-gradient(ellipse at 50% 45%,rgba(16,19,12,.15) 0%,rgba(16,19,12,.6) 75%),
linear-gradient(rgba(16,19,12,.25),rgba(16,19,12,.45))}
.rn-band{position:absolute;left:0;right:0;top:0;display:flex;align-items:stretch;gap:12px;padding:7px 12px;background:linear-gradient(#2f3522,#262b1b);color:#f1ead2;font-family:'Stardos Stencil','Arial Narrow',Inter,sans-serif;pointer-events:none;border-bottom:2px solid #11130c;box-shadow:0 2px 8px rgba(0,0,0,.35)}
.rn-band>div:first-child{flex-shrink:0;white-space:nowrap}
.rn-place{font-size:26px;font-weight:700;letter-spacing:.06em;line-height:1}
.rn-sub{font-size:14px;letter-spacing:.04em;opacity:.85;margin-top:3px;font-family:Inter,sans-serif}
.rn-grow{flex:1}
.rn-stat{white-space:nowrap;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;font-size:14px;font-family:Inter,sans-serif;font-weight:700;letter-spacing:.08em;color:#d8d0b4}
.rn-pips{display:flex;gap:3px;margin-top:4px}
.rn-pip{width:11px;height:14px;background:#d8cfae;border-radius:1px}
.rn-pip.off{background:#7a2418}
.rn-lamp{width:15px;height:15px;border-radius:50%;border:2px solid #11130c;background:#3d4230}
.rn-lamp.on{background:#ffc629;box-shadow:0 0 8px #ffc629}
.rn-hq{width:110px;height:12px;border:1px solid #11130c;background:#3d4230;margin-top:4px;border-radius:1px}
.rn-hq>div{height:100%;background:#d8cfae}
.rn-hq>div.lav{background:#c8321f}
.rn-btns{display:flex;gap:6px;align-items:center;pointer-events:auto}
.rn-foot{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;gap:10px;padding:8px 12px;background:linear-gradient(transparent,rgba(16,19,12,.55));pointer-events:none;font-family:Inter,sans-serif}
.rn-card{pointer-events:auto;width:150px;min-height:78px;text-align:left;padding:6px 9px;background:linear-gradient(#e8e0c7,#d9cfb1);border:2px solid #2a2f1e;border-radius:3px;color:#1f2318;cursor:pointer;position:relative;box-shadow:0 3px 0 #2a2f1e,0 4px 10px rgba(0,0,0,.35)}
.rn-card[data-on="1"]{background:linear-gradient(#f3cf5c,#d9a92c);transform:translateY(-6px)}
.rn-card[disabled]{opacity:.5;cursor:not-allowed}
.rn-card .n{font-weight:700;font-size:17px;font-family:'Stardos Stencil',Inter,sans-serif;letter-spacing:.03em}
.rn-card .r{font-size:13.5px;margin-top:2px;line-height:1.25}
.rn-card .p{position:absolute;right:7px;top:5px;font-weight:800;font-size:15px}
.rn-key{display:inline-block;min-width:20px;padding:0 5px;border:1px solid #2a2f1e;border-bottom-width:3px;border-radius:4px;background:#f6f1e1;font-weight:800;font-size:14px;text-align:center;color:#1f2318;margin-right:5px;font-family:Inter,sans-serif;letter-spacing:0}
.rn-empty{width:150px;min-height:78px;border:2px dashed rgba(241,234,210,.3);border-radius:3px}
.rn-side{pointer-events:auto;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.rn-btn{pointer-events:auto;padding:7px 12px;border:2px solid #11130c;border-radius:3px;background:#d8cfae;font-weight:800;font-size:15px;color:#1f2318;cursor:pointer;box-shadow:0 3px 0 #11130c;font-family:Inter,sans-serif}
.rn-btn.big{background:#4a5a2a;color:#f1ead2;font-size:21px;padding:9px 18px;letter-spacing:.06em;font-family:'Stardos Stencil',Inter,sans-serif;font-weight:700}
.rn-btn[disabled]{opacity:.5;cursor:not-allowed}
.rn-info{pointer-events:none;background:rgba(228,220,195,.95);border:2px solid #2a2f1e;border-radius:3px;padding:6px 10px;font-size:14px;color:#1f2318;max-width:320px}
.rn-info b{font-weight:800}
.rn-money{font-weight:800;font-size:18px;color:#f1ead2;background:#2f3522;border:2px solid #11130c;border-radius:3px;padding:4px 10px;pointer-events:none}
`;
