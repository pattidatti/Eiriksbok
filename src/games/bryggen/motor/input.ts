// Inndata for Bryggen-motoren. Tastatur, mus og styrepute samles til én tilstand som
// spillogikken leser én gang per simuleringssteg.
//
// Alt kan spilles med bare tastatur: piltastene styrer kameraet, og J/K/L/Q/F dekker
// kampen. Mus er et tillegg, aldri et krav.

export interface InputFrame {
    /** Bevegelse i kameraets rom: x = høyre, y = fram. Lengde ≤ 1. */
    move: { x: number; y: number };
    sprint: boolean;
    jumpPressed: boolean;
    interactPressed: boolean;
    lightPressed: boolean;
    heavyPressed: boolean;
    blockHeld: boolean;
    dodgePressed: boolean;
    finisherPressed: boolean;
    resetPressed: boolean;
    /** Et svar i en samtale: 1, 2 eller 3 (tallrekka eller talltastaturet). */
    valg: number | null;
}

export interface LookInput {
    /** Kamerarotasjon fra mus siden forrige lesing (radianer). */
    mouse: { yaw: number; pitch: number };
    /** Kamerarotasjon fra piltaster, -1..1 per akse. */
    keys: { x: number; y: number };
}

/** Hvor lenge venstre musknapp må holdes før slaget blir et tungt slag. */
const HEAVY_HOLD_S = 0.32;

export class Input {
    private keys = new Set<string>();
    private pressed = new Set<string>();
    private mouseYaw = 0;
    private mousePitch = 0;
    private lmbDownAt = -1;
    private lmbHeavyFired = false;
    private rmb = false;
    private lightQueued = false;
    private heavyQueued = false;
    private readonly el: HTMLElement;
    sensitivity = 0.0024;
    /** Musefølsomhet og piltastfart fra innstillingene (1 = standard). */
    folsomhet = 1;
    /** Snu opp og ned for kameraet (mus og piltaster). */
    inverterY = false;
    private _aktiv = true;

    constructor(el: HTMLElement) {
        this.el = el;
        window.addEventListener('keydown', this.onKeyDown);
        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('blur', this.onBlur);
        el.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mouseup', this.onMouseUp);
        window.addEventListener('mousemove', this.onMouseMove);
        el.addEventListener('contextmenu', this.onContextMenu);
    }

    dispose(): void {
        window.removeEventListener('keydown', this.onKeyDown);
        window.removeEventListener('keyup', this.onKeyUp);
        window.removeEventListener('blur', this.onBlur);
        this.el.removeEventListener('mousedown', this.onMouseDown);
        window.removeEventListener('mouseup', this.onMouseUp);
        window.removeEventListener('mousemove', this.onMouseMove);
        this.el.removeEventListener('contextmenu', this.onContextMenu);
    }

    get pointerLocked(): boolean {
        return document.pointerLockElement === this.el;
    }

    /** Av mens pausemenyen er oppe: tastene går til menyen, og ingenting blir liggende igjen etterpå. */
    get aktiv(): boolean {
        return this._aktiv;
    }

    set aktiv(a: boolean) {
        this._aktiv = a;
        this.onBlur();
        this.pressed.clear();
        this.lightQueued = this.heavyQueued = false;
        this.mouseYaw = this.mousePitch = 0;
    }

    /** Spilleren valgte mus: et klikk i spillet låser musa i stedet for å slå. */
    mouseMode = false;

    requestPointerLock(): void {
        // Pointer lock er valgfritt: uten den er spillet fortsatt spillbart med tastatur.
        // Rå musebevegelse (uten akselerasjon fra OS) der nettleseren støtter det.
        if (this.pointerLocked) return;
        this.mouseMode = true;
        const el = this.el as HTMLElement & {
            requestPointerLock(opts?: { unadjustedMovement?: boolean }): Promise<void> | void;
        };
        try {
            const p = el.requestPointerLock({ unadjustedMovement: true });
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    try {
                        (el.requestPointerLock() as Promise<void> | undefined)?.catch?.(() => undefined);
                    } catch {
                        /* låsen kan nektes (f.eks. rett etter Esc), neste klikk prøver igjen */
                    }
                });
            }
        } catch {
            /* som over */
        }
    }

    /** Leses én gang per simuleringssteg. Nullstiller «trykket»-hendelser. */
    read(now: number): InputFrame {
        const k = this.keys;
        let mx = 0;
        let my = 0;
        if (k.has('KeyW')) my += 1;
        if (k.has('KeyS')) my -= 1;
        if (k.has('KeyD')) mx += 1;
        if (k.has('KeyA')) mx -= 1;
        const len = Math.hypot(mx, my);
        if (len > 1) {
            mx /= len;
            my /= len;
        }

        // Holdt venstre knapp lenge nok: tungt slag fyrer mens knappen fortsatt er nede,
        // slik at det føles som å lade opp slaget.
        if (this.lmbDownAt >= 0 && !this.lmbHeavyFired && now - this.lmbDownAt > HEAVY_HOLD_S) {
            this.lmbHeavyFired = true;
            this.heavyQueued = true;
        }

        const p = this.pressed;
        const frame: InputFrame = {
            move: { x: mx, y: my },
            sprint: k.has('ShiftLeft') || k.has('ShiftRight'),
            jumpPressed: p.has('Space'),
            interactPressed: p.has('KeyE'),
            lightPressed: p.has('KeyJ') || this.lightQueued,
            heavyPressed: p.has('KeyK') || this.heavyQueued,
            blockHeld: k.has('KeyL') || this.rmb,
            dodgePressed: p.has('KeyQ') || p.has('ControlLeft') || p.has('KeyC'),
            finisherPressed: p.has('KeyF'),
            resetPressed: p.has('KeyR'),
            valg: [1, 2, 3].find((n) => p.has(`Digit${n}`) || p.has(`Numpad${n}`)) ?? null,
        };
        p.clear();
        this.lightQueued = false;
        this.heavyQueued = false;
        return frame;
    }

    /** Kamera leses per tegnet bilde, ikke per simuleringssteg, så det aldri hakker. */
    takeLook(): LookInput {
        const k = this.keys;
        const f = this.folsomhet;
        const look: LookInput = {
            mouse: { yaw: this.mouseYaw, pitch: this.mousePitch },
            keys: {
                x: ((k.has('ArrowRight') ? 1 : 0) - (k.has('ArrowLeft') ? 1 : 0)) * f,
                y: ((k.has('ArrowUp') ? 1 : 0) - (k.has('ArrowDown') ? 1 : 0)) * f * (this.inverterY ? -1 : 1),
            },
        };
        this.mouseYaw = 0;
        this.mousePitch = 0;
        return look;
    }

    private onKeyDown = (e: KeyboardEvent) => {
        if (!this._aktiv) return;
        if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
        if (!this.keys.has(e.code)) this.pressed.add(e.code);
        this.keys.add(e.code);
    };

    private onKeyUp = (e: KeyboardEvent) => {
        this.keys.delete(e.code);
    };

    private onBlur = () => {
        this.keys.clear();
        this.rmb = false;
        this.lmbDownAt = -1;
    };

    private onMouseDown = (e: MouseEvent) => {
        // Uten lås er klikket bare for å ta musa tilbake, ikke et slag.
        if (!this._aktiv) return;
        if (this.mouseMode && !this.pointerLocked) {
            this.requestPointerLock();
            return;
        }
        if (e.button === 0) {
            this.lmbDownAt = performance.now() / 1000;
            this.lmbHeavyFired = false;
        } else if (e.button === 2) {
            this.rmb = true;
        }
    };

    private onMouseUp = (e: MouseEvent) => {
        if (e.button === 0 && this.lmbDownAt >= 0) {
            if (!this.lmbHeavyFired) this.lightQueued = true;
            this.lmbDownAt = -1;
        } else if (e.button === 2) {
            this.rmb = false;
        }
    };

    private onMouseMove = (e: MouseEvent) => {
        if (!this.pointerLocked || !this._aktiv) return;
        this.mouseYaw -= e.movementX * this.sensitivity * this.folsomhet;
        this.mousePitch -= e.movementY * this.sensitivity * this.folsomhet * (this.inverterY ? -1 : 1);
    };

    private onContextMenu = (e: Event) => e.preventDefault();
}
