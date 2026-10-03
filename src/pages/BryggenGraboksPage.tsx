import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { GrayboxGame, HudState, WorldId } from '../games/bryggen/graboks/game';
import { Hud } from '../games/bryggen/ui/Hud';
import { Pausemeny } from '../games/bryggen/ui/Pausemeny';
import { Startskjerm } from '../games/bryggen/ui/Startskjerm';
import type { Bok } from '../games/bryggen/ui/Dagbok';
import { brukInnstillinger, fraAdressen, lagreInnstillinger, lesInnstillinger, type Innstillinger } from '../games/bryggen/ui/innstillinger';
import { glemVet, lesVet } from '../games/bryggen/ui/vetlager';
import { byttFullskjerm, fullskjerm } from '../games/bryggen/ui/fullskjerm';

// Testruter for Bryggen-spillet. Ikke koblet inn i galleriet.
// /test/bryggen-graboks  grå prøvescene (følelsen)
// /test/bryggen-gard     den første gården bygget av modulsettet
// ?skygger=0 måler uten skygger, ?kvalitet=lav|full overstyrer grafikken, ?post=0 slår av etterbehandlingen.
// HUD-en, pausemenyen og innstillingene står i src/games/bryggen/ui/.

const EMPTY: HudState = {
    loading: true, fps: 0, frameMs: 0, simMs: 0, drawCalls: 0, triangles: 0, prompt: null, mode: 'foot',
    playerHp: 100, enemyHp: 0, enemyMax: 1, enemyActive: false, telegraph: false, finisherReady: false,
    playerDead: false, enemyDead: false, message: null, pointerLocked: false, mouseMode: false, boatSpeed: 0,
    cells: 0, quality: 'full', samtale: null, replikk: null, bunter: 0, bismer: null, telegraphSving: false,
    oppdrag: [], oppdragMelding: null, ting: [], system: {},
};

/** Den første gården bygget av modulsettet. */
export function BryggenGardPage() {
    return <BryggenGraboksPage world="gard" />;
}

export function BryggenGraboksPage({ world = 'graboks' }: { world?: WorldId }) {
    const navigate = useNavigate();
    const mountRef = useRef<HTMLDivElement>(null);
    const floatRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<GrayboxGame | null>(null);
    const [hud, setHud] = useState<HudState>(EMPTY);
    const [started, setStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [valg, setValg] = useState<Innstillinger>(() => fraAdressen(lesInnstillinger(), new URLSearchParams(window.location.search)));
    const [visOppdrag, setVisOppdrag] = useState(true);
    const [pauset, setPauset] = useState(false);
    const [bok, setBok] = useState<Bok | null>(null);
    const [vet, setVet] = useState<string[]>([]);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const params = new URLSearchParams(window.location.search);
        const shadows = params.get('skygger') !== '0';
        const start = fraAdressen(lesInnstillinger(), params);
        import('../games/bryggen/graboks/game').then(({ GrayboxGame }) => {
            if (cancelled || !mountRef.current || !floatRef.current) return;
            const game = new GrayboxGame(mountRef.current, floatRef.current, setHud, { shadows, world, low: start.grafikk === 'lav' });
            gameRef.current = game;
            brukInnstillinger(game, start);
            (window as unknown as { __bryggen?: GrayboxGame }).__bryggen = game;
            game.start().catch((e: unknown) => setError(String(e)));
        });
        return () => {
            cancelled = true;
            gameRef.current?.dispose();
            gameRef.current = null;
        };
    }, [world]);

    // Innstillingene virker med en gang og huskes i nettleseren.
    useEffect(() => {
        if (gameRef.current) brukInnstillinger(gameRef.current, valg);
    }, [valg]);
    const endre = (v: Innstillinger) => {
        setValg(v);
        lagreInnstillinger(v);
    };

    useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 1600);
        return () => window.clearTimeout(t);
    }, [toast]);

    const apnePause = () => {
        const game = gameRef.current;
        if (!game || !started || pauset) return;
        game.pause(true);
        if (document.pointerLockElement) document.exitPointerLock();
        setBok(game.folk?.oppdrag.bok() ?? null);
        setVet(lesVet());
        setPauset(true);
    };

    const fortsett = () => {
        const game = gameRef.current;
        setPauset(false);
        if (!game) return;
        game.pause(false);
        if (game.input.mouseMode) game.requestPointerLock();
        else game.focus();
    };

    const onTast = useEffectEvent((e: KeyboardEvent) => {
        if (e.repeat) return;
        if (e.code === 'KeyG') {
            const grafikk = valg.grafikk === 'full' ? 'lav' : 'full';
            endre({ ...valg, grafikk });
            setToast(`Grafikk: ${grafikk}`);
        } else if (e.code === 'KeyM') {
            gameRef.current?.startLyd();
            endre({ ...valg, lyd: { ...valg.lyd, paa: !valg.lyd.paa } });
            setToast(valg.lyd.paa ? 'Lyd: av' : 'Lyd: på');
        } else if (e.code === 'KeyO' && !pauset) setVisOppdrag((v) => !v);
        else if (e.code === 'Escape' && started && !pauset) {
            e.preventDefault();
            apnePause();
        } else if (e.code === 'Enter' && !started && !hud.loading) {
            // Står fokus på en av knappene, er det knappen som velger (ellers startet spillet to ganger).
            if ((e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
            start(false);
        }
    });
    useEffect(() => {
        const f = (e: KeyboardEvent) => onTast(e);
        window.addEventListener('keydown', f);
        return () => window.removeEventListener('keydown', f);
    }, []);

    // Musa sluppet (Esc i musemodus, eller fokus borte): pausemenyen. Venter litt, fordi Chrome slipper
    // musa når fullskjermen slår inn, og spillet låser den igjen selv da.
    const musSluppet = useEffectEvent(() => {
        const game = gameRef.current;
        if (game?.input.mouseMode && !document.pointerLockElement) apnePause();
    });
    useEffect(() => {
        let t = 0;
        const f = () => {
            window.clearTimeout(t);
            if (!document.pointerLockElement) t = window.setTimeout(() => musSluppet(), 400);
        };
        document.addEventListener('pointerlockchange', f);
        return () => {
            document.removeEventListener('pointerlockchange', f);
            window.clearTimeout(t);
        };
    }, []);

    const start = (withMouse: boolean) => {
        setStarted(true);
        // Lyden får bare starte fra et klikk eller tastetrykk.
        gameRef.current?.startLyd();
        void fullskjerm(true);
        if (withMouse) gameRef.current?.requestPointerLock();
        else gameRef.current?.focus();
    };

    const avslutt = () => {
        void fullskjerm(false);
        navigate('/oving/spill');
    };

    const nullstill = () => {
        gameRef.current?.folk?.oppdrag.nullstill();
        glemVet();
        setVet([]);
        setBok(gameRef.current?.folk?.oppdrag.bok() ?? null);
    };

    // Portal til <body>: sidens layout har stablingskontekster som ellers legger toppmenyen over spillet.
    return createPortal(
        <div className="fixed inset-0 z-[1000] overflow-hidden bg-slate-400 select-none">
            <div
                ref={mountRef}
                className="absolute inset-0"
                onClick={() => {
                    gameRef.current?.startLyd();
                    if (started && !pauset && !hud.pointerLocked) gameRef.current?.requestPointerLock();
                }}
            />
            <div ref={floatRef} className="pointer-events-none absolute inset-0" />

            {started && !pauset && (
                <Hud hud={hud} world={world} visOppdrag={visOppdrag} visYtelse={valg.visYtelse} toast={toast} onMeny={apnePause} onFullskjerm={() => void byttFullskjerm()} />
            )}

            {/* Musa ble ikke låst igjen etter pausen (nettleseren nekter rett etter Esc): ett klikk. */}
            {started && !pauset && hud.mouseMode && !hud.pointerLocked && (
                <button
                    onClick={() => gameRef.current?.requestPointerLock()}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/25"
                >
                    <span className="rounded-2xl bg-white px-6 py-4 text-[18px] font-semibold text-slate-900 shadow-xl">Klikk for å spille videre</span>
                </button>
            )}

            {pauset && (
                <Pausemeny
                    valg={valg}
                    onEndre={endre}
                    harLyd={world === 'gard'}
                    bok={bok}
                    vet={vet}
                    onFortsett={fortsett}
                    onAvslutt={avslutt}
                    onNullstill={bok ? nullstill : null}
                    onFullskjerm={() => void byttFullskjerm()}
                />
            )}

            {!started && <Startskjerm world={world} laster={hud.loading} feil={error} onStart={start} />}
        </div>,
        document.body
    );
}
