import type { EKind, Kind } from './tuning';
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
