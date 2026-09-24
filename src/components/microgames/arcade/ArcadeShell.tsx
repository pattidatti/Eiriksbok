import React, { useEffect } from 'react';

// Arkadeskallet: rammen rundt et 2D-canvasspill i MÅKA-stil. Skallet eier det
// som er likt i alle arkadespill - canvas-løkka, skjermkort (tittel, pause,
// runde over), store trykk-knapper, banner og toast - slik at spillfila kan
// bruke all kraften sin på selve kjerneløkka.
//
// Stil: lys papirflate med tykk blekk-kontur og skygge rett nedover. Det er
// lyst (husregel), men har karakter - ikke glass og gradienter.

import { DEFAULT_THEME, type ArcadeTheme } from './tokens';

// All stil går gjennom CSS-variabler. Skallet eier STRUKTUREN (kort, knapper,
// banner, HUD-plass), men hvert spill gir sitt eget UTTRYKK via `theme` på
// ArcadeStage. To arkadespill skal aldri se like ut - se tokens.ts.
const CSS = `
.arc-stage{position:relative;width:100%;overflow:hidden;border-radius:var(--arc-radius);background:#cfe3ee;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;color:var(--arc-ink)}
.arc-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
.arc-display{font-family:var(--arc-font);font-weight:var(--arc-font-weight);letter-spacing:var(--arc-tracking);text-transform:var(--arc-case)}
.arc-body{font-family:var(--arc-body-font)}
.arc-outline{color:var(--arc-hud-text);text-shadow:0 2px 0 var(--arc-hud-stroke),2px 0 0 var(--arc-hud-stroke),-2px 0 0 var(--arc-hud-stroke),0 -2px 0 var(--arc-hud-stroke),2px 2px 0 var(--arc-hud-stroke),-2px 2px 0 var(--arc-hud-stroke)}
.arc-screen{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px;background:var(--arc-scrim);overflow-y:auto}
.arc-card{width:100%;max-width:420px;background:var(--arc-paper);border:var(--arc-line) solid var(--arc-ink);border-radius:calc(var(--arc-radius) + 4px);box-shadow:0 var(--arc-drop) 0 var(--arc-ink);padding:12px 16px 12px;text-align:center;color:var(--arc-ink);margin:auto;font-family:var(--arc-body-font)}
.arc-big{display:block;width:100%;margin:10px 0 8px;font-size:24px;padding:6px 0 8px;border:var(--arc-line) solid var(--arc-ink);border-radius:var(--arc-radius);color:var(--arc-cta-text);box-shadow:0 var(--arc-drop) 0 var(--arc-ink);transition:transform .08s,box-shadow .08s;cursor:pointer}
.arc-big:active{transform:translateY(4px);box-shadow:0 2px 0 var(--arc-ink)}
.arc-small{font-family:var(--arc-body-font);font-weight:800;font-size:14px;padding:7px 12px 8px;border:calc(var(--arc-line) - .5px) solid var(--arc-ink);border-radius:calc(var(--arc-radius) - 4px);background:var(--arc-chip);box-shadow:0 calc(var(--arc-drop) / 2) 0 var(--arc-ink);cursor:pointer;color:var(--arc-ink)}
.arc-small:active{transform:translateY(2px);box-shadow:0 1px 0 var(--arc-ink)}
.arc-big:focus-visible,.arc-small:focus-visible,.arc-round:focus-visible{outline:3px solid var(--arc-accent);outline-offset:3px}
.arc-round{position:absolute;border-radius:50%;border:var(--arc-line) solid var(--arc-ink);box-shadow:0 var(--arc-drop) 0 var(--arc-ink);display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:none;transition:transform .08s,opacity .25s}
.arc-round:active,.arc-round.press{transform:translateY(4px);box-shadow:0 1px 0 var(--arc-ink)}
.arc-round.dim{filter:grayscale(1);opacity:.55}
.arc-banner{position:absolute;left:50%;top:40%;width:min(92%,520px);text-align:center;pointer-events:none;transform:translate(-50%,-50%)}
.arc-banner.show{animation:arcIn .35s cubic-bezier(.2,1.4,.4,1) both,arcOut .4s ease-in var(--arc-out,3s) forwards}
@keyframes arcIn{from{opacity:0;transform:translate(-50%,-50%) scale(.3) rotate(calc(var(--arc-tilt) * -3))}to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(var(--arc-tilt))}}
@keyframes arcOut{from{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(var(--arc-tilt))}to{opacity:0;transform:translate(-50%,-62%) scale(.92) rotate(var(--arc-tilt))}}
.arc-banner h4{margin:0;display:inline-block;font-size:clamp(20px,4vw,32px);line-height:1.05;color:var(--arc-cta-text);padding:5px 14px 7px;border:var(--arc-line) solid var(--arc-ink);border-radius:calc(var(--arc-radius) - 4px);box-shadow:0 var(--arc-drop) 0 var(--arc-ink)}
.arc-banner p{margin:9px auto 0;display:inline-block;font-family:var(--arc-body-font);font-weight:700;font-size:14px;line-height:1.35;background:var(--arc-paper);padding:5px 11px;border:calc(var(--arc-line) - .5px) solid var(--arc-ink);border-radius:calc(var(--arc-radius) - 6px);transform:rotate(calc(var(--arc-tilt) * -.7));color:var(--arc-ink);max-width:94%}
.arc-toast{position:absolute;left:50%;top:58px;transform:translate(-50%,-24px);opacity:0;background:var(--arc-paper);border:calc(var(--arc-line) - .5px) solid var(--arc-ink);border-radius:calc(var(--arc-radius) - 4px);padding:6px 12px;font-family:var(--arc-body-font);font-weight:800;font-size:14px;line-height:1.35;box-shadow:0 calc(var(--arc-drop) * .66) 0 var(--arc-ink);pointer-events:none;color:var(--arc-ink);max-width:92%;text-align:center}
.arc-toast.on{animation:arcToast .35s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes arcToast{to{opacity:1;transform:translate(-50%,0)}}
.arc-bar{height:15px;border:calc(var(--arc-line) - .5px) solid var(--arc-hud-stroke);border-radius:9px;background:rgba(0,0,0,.28);overflow:hidden}
.arc-bar>div{height:100%;border-radius:6px 0 0 6px;transition:background .3s}
.arc-bar.low{animation:arcPulse .5s infinite alternate}
@keyframes arcPulse{to{transform:scale(1.05)}}
.arc-pill{display:inline-block;background:var(--arc-accent);color:var(--arc-ink);border:calc(var(--arc-line) - .5px) solid var(--arc-ink);border-radius:calc(var(--arc-radius) - 6px);padding:0 8px 1px;transform:rotate(calc(var(--arc-tilt) * 2))}
.arc-pill.bump{animation:arcBump .25s}
@keyframes arcBump{50%{transform:rotate(calc(var(--arc-tilt) * 2)) scale(1.35)}}
.arc-wig{animation:arcWig .6s infinite alternate}
@keyframes arcWig{from{transform:rotate(-4deg)}to{transform:rotate(4deg) scale(1.08)}}
@media (prefers-reduced-motion: reduce){.arc-banner.show{animation:none}.arc-toast.on{animation:none;opacity:1;transform:translate(-50%,0)}.arc-wig,.arc-bar.low{animation:none}}
`;

function themeVars(t: ArcadeTheme): React.CSSProperties {
    return {
        ['--arc-ink' as string]: t.ink,
        ['--arc-paper' as string]: t.paper,
        ['--arc-accent' as string]: t.accent,
        ['--arc-cta' as string]: t.cta,
        ['--arc-cta-text' as string]: t.ctaText,
        ['--arc-chip' as string]: t.chip,
        ['--arc-scrim' as string]: t.scrim,
        ['--arc-font' as string]: t.font,
        ['--arc-font-weight' as string]: String(t.fontWeight),
        ['--arc-body-font' as string]: t.bodyFont,
        ['--arc-tracking' as string]: t.tracking,
        ['--arc-case' as string]: t.textCase,
        ['--arc-radius' as string]: `${t.radius}px`,
        ['--arc-line' as string]: `${t.line}px`,
        ['--arc-drop' as string]: `${t.drop}px`,
        ['--arc-tilt' as string]: `${t.tilt}deg`,
        ['--arc-hud-text' as string]: t.hudText,
        ['--arc-hud-stroke' as string]: t.hudStroke,
    };
}

let cssInjected = false;
function useArcadeCss() {
    useEffect(() => {
        if (cssInjected || typeof document === 'undefined') return;
        const el = document.createElement('style');
        el.dataset.arcade = '1';
        el.textContent = CSS;
        document.head.appendChild(el);
        cssInjected = true;
    }, []);
}

// ---------- UI-primitiver ----------

export const ArcadeStage = React.forwardRef<
    HTMLDivElement,
    {
        /** Valgfritt fast sideforhold. Uten det følger høyden skjermen (70vh, klemt).*/
        aspect?: number;
        /** Spillets eget uttrykk. Utelatte felt faller tilbake til DEFAULT_THEME. */
        theme?: Partial<ArcadeTheme>;
        minHeight?: number;
        maxHeight?: number;
        background?: string;
        children: React.ReactNode;
        label: string;
    }
>(function ArcadeStage(
    { aspect, theme, minHeight = 420, maxHeight = 640, background, children, label },
    ref
) {
    useArcadeCss();
    return (
        <div
            ref={ref}
            className="arc-stage"
            style={{
                ...themeVars({ ...DEFAULT_THEME, ...theme }),
                // Som 3D-kitet: høyden følger skjermen, ikke spaltebredden.
                ...(aspect ? { aspectRatio: String(aspect), minHeight, maxHeight } : { height: `clamp(${minHeight}px, 70vh, ${maxHeight}px)` }),
                background,
            }}
            role="application"
            aria-label={label}
            onContextMenu={(e) => e.preventDefault()}
        >
            {children}
        </div>
    );
});

export function ArcadeScreen({ children }: { children: React.ReactNode }) {
    return (
        <div className="arc-screen">
            <div className="arc-card">{children}</div>
        </div>
    );
}

export function ArcadeLogo({ children, accent }: { children: React.ReactNode; accent?: string }) {
    return (
        <div
            className="arc-display"
            style={{
                fontSize: 'clamp(34px, 7vw, 56px)',
                lineHeight: 0.9,
                color: 'var(--arc-paper)',
                WebkitTextStroke: '3px var(--arc-ink)',
                paintOrder: 'stroke fill',
                textShadow: '0 6px 0 var(--arc-ink)',
                transform: 'rotate(calc(var(--arc-tilt) * 1.5))',
                margin: '2px 0 8px',
            }}
        >
            {children}
            {accent && <span style={{ color: 'var(--arc-accent)' }}>{accent}</span>}
        </div>
    );
}

export function ArcadeTag({ children, color = 'var(--arc-cta)' }: { children: React.ReactNode; color?: string }) {
    return (
        <div
            style={{
                display: 'inline-block',
                fontWeight: 800,
                fontSize: 14,
                background: color,
                color: 'var(--arc-cta-text)',
                padding: '3px 10px',
                borderRadius: 6,
                transform: 'rotate(calc(var(--arc-tilt) * -.7))',
                border: '2px solid var(--arc-ink)',
            }}
        >
            {children}
        </div>
    );
}

export function ArcadeBigButton({
    children,
    onClick,
    color = 'var(--arc-cta)',
}: {
    children: React.ReactNode;
    onClick: () => void;
    color?: string;
}) {
    return (
        <button type="button" className="arc-big arc-display" style={{ background: color }} onClick={onClick}>
            {children}
        </button>
    );
}

export function ArcadeSmallButton({
    children,
    onClick,
    ariaLabel,
}: {
    children: React.ReactNode;
    onClick: () => void;
    ariaLabel?: string;
}) {
    return (
        <button type="button" className="arc-small" onClick={onClick} aria-label={ariaLabel}>
            {children}
        </button>
    );
}

/** Rutenett med nøkkeltall på «runde over»-kortet. */
export function ArcadeStats({ items }: { items: { value: React.ReactNode; label: string }[] }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${items.length}, 1fr)`,
                gap: 6,
                margin: '4px 0 6px',
            }}
        >
            {items.map((it) => (
                <div
                    key={it.label}
                    style={{ background: 'var(--arc-chip)', border: '2px solid var(--arc-ink)', borderRadius: 10, padding: '3px 2px' }}
                >
                    <b className="arc-display" style={{ display: 'block', fontSize: 18, lineHeight: 1.2 }}>
                        {it.value}
                    </b>
                    <span style={{ fontSize: 10, fontWeight: 700 }}>{it.label}</span>
                </div>
            ))}
        </div>
    );
}

