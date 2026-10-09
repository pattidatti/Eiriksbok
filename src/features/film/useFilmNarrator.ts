import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { pickBestNorwegianVoice } from '../../hooks/useTextToSpeech';
import type { FilmManus } from './types';

/**
 * Fortelleren: leser replikkene i manuset én etter én, og sier hvilken scene og replikk
 * som går nå. Tre måter, i denne rekkefølgen:
 *
 * 1. Innspilt: ferdig lyd (Google Chirp 3 HD) som `scripts/film-lyd/lag_lyd.py` legger i
 *    Cloudflare R2, vist av Workeren i `cloudflare/lyd-worker/`. Én mp3 per film og en json
 *    med start og slutt for hver replikk. Lydens klokke styrer hvilken replikk som går.
 * 2. Nettleserens innebygde norske stemme, når filmen ikke har innspilt lyd ennå.
 * 3. Tekstmodus (ingen stemme, eller lyden av): hver replikk står på skjermen så lenge det
 *    tar å lese den.
 */

export interface FlatReplikk {
    scene: number;
    beat: number;
    si: string;
    uttale: string;
    /** Varighet i sekunder: målt fra lydfila når den finnes, ellers anslått. */
    anslag: number;
    /** Sekunder fra filmstart. */
    start: number;
}

export type FilmStatus = 'klar' | 'spiller' | 'pause' | 'ferdig';

/** Hvor den innspilte lyden ligger. Kan overstyres i utvikling med VITE_FILM_LYD_BASE. */
const LYD_BASE =
    (import.meta.env.VITE_FILM_LYD_BASE as string | undefined) ??
    'https://eiriksbok-lyd.eiriksbok.workers.dev';

const ORD_PER_SEK_TALE = 2.5;
const ORD_PER_SEK_LES = 2.1;
/** Nettleserstemmen er for rask for 14-åringer på 1x. «1x» i filmen betyr dette tempoet. */
const GRUNNTEMPO = 0.85;
const PAUSE_SETNING_MS = 250;
const PAUSE_REPLIKK_MS = 800;
const PAUSE_SCENE_MS = 1400;

interface Lydspor {
    url: string;
    tider: { start: number; slutt: number }[];
}

function ordtall(tekst: string) {
    return tekst.split(/\s+/).filter(Boolean).length;
}

function anslaa(tekst: string, rate: number, tekstmodus: boolean) {
    const ord = ordtall(tekst);
    if (tekstmodus) return ord / ORD_PER_SEK_LES + 1.2;
    const pauser = ((setninger(tekst).length - 1) * PAUSE_SETNING_MS) / 1000;
    return ord / (ORD_PER_SEK_TALE * GRUNNTEMPO * rate) + pauser + 0.4;
}

/** Deler en replikk i setninger, så ingen enkeltytring blir lang nok til at Chrome kutter den. */
export function setninger(tekst: string): string[] {
    const biter = tekst.match(/[^.!?]+(?:[.!?]+[»"')]*|$)/g) ?? [tekst];
    return biter.map((b) => b.trim()).filter(Boolean);
}

/**
 * Henter tidsfila for filmens innspilte lyd. Lyden brukes bare når hver replikk i fila er
 * nøyaktig den samme som i manuset. Er manuset endret og lyden ikke laget på nytt ennå,
 * går filmen med nettleserstemmen i mellomtiden.
 */
async function hentLydspor(manus: FilmManus, signal: AbortSignal): Promise<Lydspor | null> {
    const sti = manus.kilde.replace(/^\/|\/$/g, '');
    try {
        const svar = await fetch(`${LYD_BASE}/film/${sti}.json`, { signal });
        if (!svar.ok) return null;
        const data = (await svar.json()) as {
            lyd: string;
            replikker: { tekst: string; start: number; slutt: number }[];
        };
        const tekster = manus.scener.flatMap((s) => s.replikker.map((r) => r.uttale ?? r.si));
        if (
            !Array.isArray(data.replikker) ||
            data.replikker.length !== tekster.length ||
            data.replikker.some((r, i) => r.tekst !== tekster[i])
        )
            return null;
        const mappe = sti.split('/').slice(0, -1).join('/');
        return {
            url: `${LYD_BASE}/film/${mappe}/${data.lyd}`,
            tider: data.replikker.map((r) => ({ start: r.start, slutt: r.slutt })),
        };
    } catch {
        return null;
    }
}

export function useFilmNarrator(manus: FilmManus | null) {
    const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [stemmeSjekket, setStemmeSjekket] = useState(false);
    const [lydspor, setLydspor] = useState<Lydspor | null>(null);
    const [lydsporSjekket, setLydsporSjekket] = useState(false);
    const [lydPaa, setLydPaa] = useState(true);
    const [rate, setRate] = useState(1);
    const [status, setStatus] = useState<FilmStatus>('klar');
    const [indeks, setIndeks] = useState(0);

    const innspilt = !!lydspor && lydPaa;
    const tekstmodus = !innspilt && (!voice || !lydPaa);

    const replikker = useMemo<FlatReplikk[]>(() => {
        if (!manus) return [];
        const ut: FlatReplikk[] = [];
        let t = 0;
        let i = 0;
        manus.scener.forEach((scene, si) => {
            scene.replikker.forEach((r, bi) => {
                const uttale = r.uttale ?? r.si;
                const tid = innspilt ? lydspor!.tider[i] : null;
                const start = tid ? tid.start / rate : t;
                const anslag = tid
                    ? (tid.slutt - tid.start) / rate
                    : anslaa(uttale, rate, tekstmodus);
                ut.push({ scene: si, beat: bi, si: r.si, uttale, anslag, start });
                t +=
                    anslag +
                    (bi === scene.replikker.length - 1 ? PAUSE_SCENE_MS : PAUSE_REPLIKK_MS) / 1000;
                i++;
            });
        });
        return ut;
    }, [manus, rate, tekstmodus, innspilt, lydspor]);

    const totalTid = replikker.length
        ? replikker[replikker.length - 1].start + replikker[replikker.length - 1].anslag
        : 0;

    // Stemmene lastes asynkront i Chrome. Vent litt før vi bestemmer oss for tekstmodus.
    useEffect(() => {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
        if (!synth) {
            setStemmeSjekket(true);
            return;
        }
        const sjekk = () => {
            const best = pickBestNorwegianVoice(synth.getVoices());
            if (best) {
                setVoice(best);
                setStemmeSjekket(true);
            }
        };
        sjekk();
        synth.addEventListener?.('voiceschanged', sjekk);
        const t = setTimeout(() => setStemmeSjekket(true), 1500);
        return () => {
            synth.removeEventListener?.('voiceschanged', sjekk);
            clearTimeout(t);
        };
    }, []);

    // Innspilt lyd, hvis filmen har det.
    useEffect(() => {
        if (!manus) return;
        const avbryt = new AbortController();
        setLydspor(null);
        setLydsporSjekket(false);
        hentLydspor(manus, avbryt.signal).then((spor) => {
            if (avbryt.signal.aborted) return;
            setLydspor(spor);
            setLydsporSjekket(true);
        });
        return () => avbryt.abort();
    }, [manus]);

    const lydRef = useRef<HTMLAudioElement | null>(null);
    useEffect(() => {
        if (!lydspor) return;
        const lyd = new Audio();
        lyd.preload = 'metadata';
        lyd.src = lydspor.url;
        lydRef.current = lyd;
        return () => {
            lyd.pause();
            lyd.removeAttribute('src');
            lyd.load();
            if (lydRef.current === lyd) lydRef.current = null;
        };
    }, [lydspor]);

    // Alt som skjer asynkront (onend, timere, lydløkka) sjekker mot denne tokenen. Hver ny
    // avspilling får en ny token, så gamle callbacks fra en avbrutt replikk ikke hopper
    // filmen videre.
    const tokenRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rafRef = useRef(0);
    // Når replikken startet, og hvor langt i replikken vi var, for fremdriftsvisning.
    const replikkStartRef = useRef(0);
    const indeksRef = useRef(0);

    const ryddTimere = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        cancelAnimationFrame(rafRef.current);
    }, []);

    const stoppTale = useCallback(() => {
        tokenRef.current++;
        ryddTimere();
        if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
        lydRef.current?.pause();
    }, [ryddTimere]);

    /** Følger lydens klokke og flytter replikken når lyden passerer neste starttid. */
    const folgLyden = useCallback(
        (token: number) => {
            const lyd = lydRef.current;
            if (!lyd || !lydspor || token !== tokenRef.current) return;
            const tider = lydspor.tider;
            const t = lyd.currentTime;
            let i = indeksRef.current;
            while (i + 1 < tider.length && tider[i + 1].start <= t + 0.02) i++;
            while (i > 0 && tider[i].start > t + 0.02) i--;
            if (i !== indeksRef.current) {
                indeksRef.current = i;
                setIndeks(i);
            }
            replikkStartRef.current =
                performance.now() - (Math.max(0, t - tider[i].start) / lyd.playbackRate) * 1000;
            if (lyd.ended) {
                setStatus('ferdig');
                return;
            }
            rafRef.current = requestAnimationFrame(() => folgLyden(token));
        },
        [lydspor]
    );

    const startLyd = useCallback(
        (fra: number | null) => {
            const lyd = lydRef.current;
            if (!lyd) return;
            const token = tokenRef.current;
            setStatus('spiller');
            if (fra !== null) lyd.currentTime = fra;
            lyd.playbackRate = rate;
            lyd.play().then(
                () => {
                    if (token === tokenRef.current) folgLyden(token);
                },
                () => {
                    // Nettleseren nektet avspilling (f.eks. uten klikk). Vent på eleven.
                    if (token === tokenRef.current) setStatus('pause');
                }
            );
        },
        [rate, folgLyden]
    );

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
            indeksRef.current = i;
            setIndeks(i);
            setStatus('spiller');
            replikkStartRef.current = performance.now();

            if (innspilt) {
                startLyd(lydspor!.tider[i].start);
                return;
            }

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
            // Replikken leses setning for setning. Chrome kutter ytringer etter ca.
            // 15 sekunder, og pause()/resume()-trikset mot det dreper stemmen midt i
            // ordet på noen maskiner. Tall som «1825» blir mange ord høyt, så en
            // replikk som ser kort ut på skjermen kan likevel bli for lang.
            const biter = setninger(r.uttale);
            const lesBit = (b: number) => {
                if (token !== tokenRef.current) return;
                if (b >= biter.length) {
                    neste();
                    return;
                }
                const u = new SpeechSynthesisUtterance(biter[b]);
                if (voice) u.voice = voice;
                u.lang = voice?.lang ?? 'nb-NO';
                u.rate = rate * GRUNNTEMPO;
                // En liten pust mellom setningene, så eleven rekker å henge med.
                const videre = () => {
                    if (token !== tokenRef.current) return;
                    if (b + 1 >= biter.length) lesBit(b + 1);
                    else setTimeout(() => lesBit(b + 1), PAUSE_SETNING_MS);
                };
                u.onend = videre;
                u.onerror = (e) => {
                    if (e.error === 'interrupted' || e.error === 'canceled') return;
                    videre();
                };
                synth.speak(u);
            };
            // Chrome glemmer av og til å sende onend. Da går vi videre selv, godt etter
            // at replikken burde vært ferdig.
            timerRef.current = setTimeout(neste, (r.anslag * 2.2 + 4) * 1000);
            // Liten forsinkelse: speak() rett etter cancel() blir stille på ChromeOS.
            setTimeout(() => lesBit(0), 60);
        },
        [replikker, tekstmodus, innspilt, lydspor, voice, rate, stoppTale, ryddTimere, startLyd]
    );

    useEffect(() => {
        spillRef.current = spill;
    }, [spill]);

    useEffect(() => () => stoppTale(), [stoppTale]);

    const play = useCallback(() => {
        if (status === 'ferdig') {
            spill(0);
            return;
        }
        // Innspilt lyd fortsetter der den ble stoppet, så lenge den står i samme replikk.
        const lyd = lydRef.current;
        if (innspilt && status === 'pause' && lyd && lydspor) {
            const t = lyd.currentTime;
            const fra = lydspor.tider[indeks].start;
            const til = lydspor.tider[indeks + 1]?.start ?? Infinity;
            if (t >= fra && t < til) {
                stoppTale();
                startLyd(null);
                return;
            }
        }
        spill(indeks);
    }, [status, indeks, innspilt, lydspor, spill, stoppTale, startLyd]);

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
                indeksRef.current = i;
                setIndeks(i);
                if (status === 'ferdig') setStatus('pause');
            }
        },
        [replikker, status, spill, stoppTale]
    );

    // Bytter lyd/tempo midt i en replikk: start replikken på nytt med nye innstillinger.
    // Innspilt lyd bytter bare tempo, uten å starte replikken på nytt.
    const innstillinger = `${lydPaa}|${rate}`;
    const forrigeInnstillinger = useRef(innstillinger);
    useEffect(() => {
        if (forrigeInnstillinger.current === innstillinger) return;
        const bareTempo = forrigeInnstillinger.current.split('|')[0] === String(lydPaa);
        forrigeInnstillinger.current = innstillinger;
        if (bareTempo && innspilt && lydRef.current) {
            lydRef.current.playbackRate = rate;
            return;
        }
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
        /** Innspilt lyd eller en norsk nettleserstemme finnes. */
        harStemme: !!lydspor || !!voice,
        /** Navnet som vises på startskjermen. */
        stemmeNavn: lydspor ? 'innspilt forteller' : (voice?.name ?? null),
        stemmerLastet: lydsporSjekket && (!!lydspor || stemmeSjekket),
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
