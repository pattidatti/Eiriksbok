import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pickBestNorwegianVoice } from '../../hooks/useTextToSpeech';
import type { FilmManus } from './types';

/**
 * Fortelleren: leser replikkene i manuset én etter én med nettleserens innebygde
 * stemme, og sier hvilken scene og replikk som går nå.
 *
 * Uten norsk stemme (eller med lyden av) går filmen i tekstmodus: samme flyt, men
 * hver replikk står på skjermen så lenge det tar å lese den.
 */

export interface FlatReplikk {
    scene: number;
    beat: number;
    si: string;
    uttale: string;
    /** Anslått varighet i sekunder, brukt til tidslinja og tekstmodus. */
    anslag: number;
    /** Sekunder fra filmstart, etter anslaget. */
    start: number;
}

export type FilmStatus = 'klar' | 'spiller' | 'pause' | 'ferdig';

const ORD_PER_SEK_TALE = 2.5;
const ORD_PER_SEK_LES = 2.1;
const PAUSE_REPLIKK_MS = 350;
const PAUSE_SCENE_MS = 1100;

function ordtall(tekst: string) {
    return tekst.split(/\s+/).filter(Boolean).length;
}

function anslaa(tekst: string, rate: number, tekstmodus: boolean) {
    const ord = ordtall(tekst);
    return tekstmodus ? ord / ORD_PER_SEK_LES + 1.2 : ord / (ORD_PER_SEK_TALE * rate) + 0.4;
}

export function useFilmNarrator(manus: FilmManus | null) {
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [stemmerLastet, setStemmerLastet] = useState(false);
    const [lydPaa, setLydPaa] = useState(true);
    const [rate, setRate] = useState(1);
    const [status, setStatus] = useState<FilmStatus>('klar');
    const [indeks, setIndeks] = useState(0);

    const tekstmodus = !voice || !lydPaa;

    const replikker = useMemo<FlatReplikk[]>(() => {
        if (!manus) return [];
        const ut: FlatReplikk[] = [];
        let t = 0;
        manus.scener.forEach((scene, si) => {
            scene.replikker.forEach((r, bi) => {
                const anslag = anslaa(r.uttale ?? r.si, rate, tekstmodus);
                ut.push({
                    scene: si,
                    beat: bi,
                    si: r.si,
                    uttale: r.uttale ?? r.si,
                    anslag,
                    start: t,
                });
                t +=
                    anslag +
                    (bi === scene.replikker.length - 1 ? PAUSE_SCENE_MS : PAUSE_REPLIKK_MS) / 1000;
            });
        });
        return ut;
    }, [manus, rate, tekstmodus]);

    const totalTid = replikker.length
        ? replikker[replikker.length - 1].start + replikker[replikker.length - 1].anslag
        : 0;

    // Stemmene lastes asynkront i Chrome. Vent litt før vi bestemmer oss for tekstmodus.
    useEffect(() => {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
        if (!synth) {
            setStemmerLastet(true);
            return;
        }
        const sjekk = () => {
            const best = pickBestNorwegianVoice(synth.getVoices());
            if (best) {
                setVoice(best);
                setStemmerLastet(true);
            }
        };
        sjekk();
        synth.addEventListener?.('voiceschanged', sjekk);
        const t = setTimeout(() => setStemmerLastet(true), 1500);
        return () => {
            synth.removeEventListener?.('voiceschanged', sjekk);
            clearTimeout(t);
        };
    }, []);

    // Alt som skjer asynkront (onend, timere) sjekker mot denne tokenen. Hver ny
    // avspilling får en ny token, så gamle callbacks fra en avbrutt replikk ikke
    // hopper filmen videre.
    const tokenRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Når replikken startet, og hvor langt i replikken vi var, for fremdriftsvisning.
    const replikkStartRef = useRef(0);

    const ryddTimere = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        timerRef.current = null;
        keepAliveRef.current = null;
    }, []);

    const stoppTale = useCallback(() => {
        tokenRef.current++;
        ryddTimere();
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    }, [ryddTimere]);

    const spillRef = useRef<(i: number) => void>(() => {});

    const spill = useCallback(
        (i: number) => {
            stoppTale();
            if (i >= replikker.length) {
                setStatus('ferdig');
                return;
            }
            const token = tokenRef.current;
            const r = replikker[i];
            setIndeks(i);
            setStatus('spiller');
            replikkStartRef.current = performance.now();

            const neste = () => {
                if (token !== tokenRef.current) return;
                ryddTimere();
                const sisteIScenen = replikker[i + 1]?.scene !== r.scene;
                timerRef.current = setTimeout(
                    () => {
                        if (token === tokenRef.current) spillRef.current(i + 1);
                    },
                    sisteIScenen ? PAUSE_SCENE_MS : PAUSE_REPLIKK_MS
                );
            };

            if (tekstmodus) {
                timerRef.current = setTimeout(neste, r.anslag * 1000);
                return;
            }

            const synth = window.speechSynthesis;
            const u = new SpeechSynthesisUtterance(r.uttale);
            if (voice) u.voice = voice;
            u.lang = voice?.lang ?? 'nb-NO';
            u.rate = rate;
            u.onend = neste;
            u.onerror = (e) => {
                if (e.error === 'interrupted' || e.error === 'canceled') return;
                neste();
            };
            // Chrome glemmer av og til å sende onend. Da går vi videre selv, godt etter
            // at replikken burde vært ferdig.
            timerRef.current = setTimeout(neste, (r.anslag * 2.2 + 4) * 1000);
            // Chrome stopper lange ytringer etter ca. 15 sekunder uten dette.
            keepAliveRef.current = setInterval(() => {
                if (synth.speaking && !synth.paused) {
                    synth.pause();
                    synth.resume();
                }
            }, 12000);
            // Liten forsinkelse: speak() rett etter cancel() blir stille på ChromeOS.
            setTimeout(() => {
                if (token === tokenRef.current) synth.speak(u);
            }, 60);
        },
        [replikker, tekstmodus, voice, rate, stoppTale, ryddTimere]
    );

    useEffect(() => {
        spillRef.current = spill;
    }, [spill]);

    useEffect(() => () => stoppTale(), [stoppTale]);

    const play = useCallback(() => {
        if (status === 'ferdig') spill(0);
        else spill(indeks);
    }, [status, indeks, spill]);

    const pause = useCallback(() => {
        stoppTale();
        setStatus('pause');
    }, [stoppTale]);

    const toggle = useCallback(() => {
        if (status === 'spiller') pause();
        else play();
    }, [status, pause, play]);

    /** Hopp til første replikk i en scene. */
    const gaTilScene = useCallback(
        (scene: number) => {
            const i = replikker.findIndex((r) => r.scene === scene);
            if (i < 0) return;
            if (status === 'spiller') spill(i);
            else {
                stoppTale();
                setIndeks(i);
                if (status === 'ferdig') setStatus('pause');
            }
        },
        [replikker, status, spill, stoppTale]
    );

    // Bytter lyd/tempo midt i en replikk: start replikken på nytt med nye innstillinger.
    const innstillinger = `${lydPaa}|${rate}`;
    const forrigeInnstillinger = useRef(innstillinger);
    useEffect(() => {
        if (forrigeInnstillinger.current === innstillinger) return;
        forrigeInnstillinger.current = innstillinger;
        if (status === 'spiller') spill(indeks);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [innstillinger]);

    const naa = replikker[indeks];

    return {
        replikker,
        totalTid,
        status,
        indeks,
        scene: naa?.scene ?? 0,
        beat: naa?.beat ?? 0,
        replikk: naa,
        replikkStartRef,
        voice,
        stemmerLastet,
        tekstmodus,
        lydPaa,
        setLydPaa,
        rate,
        setRate,
        play,
        pause,
        toggle,
        gaTilScene,
    };
}
