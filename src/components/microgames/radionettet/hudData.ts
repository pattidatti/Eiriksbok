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
};

const ENAME: Record<EKind, [string, string]> = {
    einf: ['infanterigruppe', 'infanterigrupper'],
    evogn: ['stridsvogn', 'stridsvogner'],
    epak: ['panservernkanon', 'panservernkanoner'],
    estuka: ['stupbomber', 'stupbombere'],
    ejag: ['jagerfly', 'jagerfly'],
};

export function wavePreview(g: G) {
    const n = new Map<EKind, number>();
    for (const gr of waveDef(g).groups) n.set(gr.kind, (n.get(gr.kind) ?? 0) + gr.n);
    return [...n].map(([k, c]) => `${c} ${ENAME[k][c === 1 ? 0 : 1]}`).join(' · ');
}

export const HUD_CSS = `
.rn-band{position:absolute;left:0;right:0;top:0;display:flex;align-items:stretch;gap:10px;padding:8px 12px;background:#1d2b4f;color:#efe4c9;font-family:Oswald,'Arial Narrow',Inter,sans-serif;pointer-events:none;border-bottom:3px solid #1a1a1a}
.rn-band>div:first-child{flex-shrink:0;white-space:nowrap}
.rn-stat{white-space:nowrap}
.rn-place{font-size:26px;font-weight:700;letter-spacing:.06em;line-height:1}
.rn-sub{font-size:14px;letter-spacing:.08em;opacity:.9;margin-top:3px;font-family:Inter,sans-serif}
.rn-grow{flex:1}
.rn-stat{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;font-size:14px;font-family:Inter,sans-serif;font-weight:700;letter-spacing:.06em}
.rn-pips{display:flex;gap:3px;margin-top:3px}
.rn-pip{width:12px;height:14px;background:#efe4c9;border:1px solid #1a1a1a}
.rn-pip.off{background:#b3261e;opacity:.55}
.rn-lamp{width:16px;height:16px;border-radius:50%;border:2px solid #1a1a1a;background:#3a3f4f}
.rn-lamp.on{background:#d9a21b;box-shadow:0 0 6px #d9a21b}
.rn-btns{display:flex;gap:6px;align-items:center;pointer-events:auto}
.rn-foot{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:flex-end;gap:10px;padding:8px 12px;background:linear-gradient(transparent,rgba(29,43,79,.35));pointer-events:none;font-family:Inter,sans-serif}
.rn-card{pointer-events:auto;width:150px;min-height:78px;text-align:left;padding:6px 9px;background:#efe4c9;border:3px solid #1a1a1a;color:#1a1a1a;cursor:pointer;position:relative;box-shadow:0 4px 0 #1a1a1a}
.rn-card[data-on="1"]{background:#d9a21b;transform:translateY(-6px)}
.rn-card[disabled]{opacity:.45;cursor:not-allowed}
.rn-card .n{font-weight:800;font-size:16px}
.rn-card .r{font-size:13px;margin-top:2px}
.rn-card .p{position:absolute;right:7px;top:5px;font-weight:800;font-size:15px}
.rn-key{display:inline-block;min-width:20px;padding:0 5px;border:2px solid #1a1a1a;border-bottom-width:3px;border-radius:4px;background:#fff;font-weight:800;font-size:14px;text-align:center;color:#1a1a1a;margin-right:5px}
.rn-empty{width:150px;min-height:78px;border:3px dashed rgba(26,26,26,.35)}
.rn-side{pointer-events:auto;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.rn-btn{pointer-events:auto;padding:8px 12px;border:3px solid #1a1a1a;background:#efe4c9;font-weight:800;font-size:15px;color:#1a1a1a;cursor:pointer;box-shadow:0 3px 0 #1a1a1a;font-family:Inter,sans-serif}
.rn-btn.big{background:#b3261e;color:#efe4c9;font-size:20px;padding:10px 18px;letter-spacing:.06em}
.rn-btn[disabled]{opacity:.45;cursor:not-allowed}
.rn-info{pointer-events:none;background:#efe4c9;border:3px solid #1a1a1a;padding:6px 10px;font-size:14px;color:#1a1a1a;max-width:320px}
.rn-info b{font-weight:800}
.rn-money{font-weight:800;font-size:18px;color:#1a1a1a;background:#d9a21b;border:3px solid #1a1a1a;padding:4px 10px;pointer-events:none}
`;

