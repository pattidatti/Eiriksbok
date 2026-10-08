// Stemmen til foreleseren, som en utskiftbar del.
//
// Fase 1 bruker nettleserens egen stemme (Web Speech). Eieren syntes den låt dårlig
// (stemmetesten 2026-10-08), så den skal byttes mot ferdig generert lyd senere. Alt
// resten av Auditoriet snakker derfor bare med `Stemme`-grensesnittet: si en tekst,
// meld fra om hvert ord, meld fra når du er ferdig. En lydfil-stemme kan oppfylle det
// samme med ordtider fra genereringen.

import { pickBestNorwegianVoice } from '../../hooks/useTextToSpeech';
import { TEMPO, ordIndekser, ordVarighet } from './tid';

export interface SiHendelser {
    onStart?: () => void;
    /** Et nytt ord begynner. `index`/`lengde` peker inn i teksten. */
    onOrd?: (index: number, lengde: number) => void;
    onSlutt?: () => void;
}

export interface Stemme {
    navn: string;
    /** Sant når stemmen selv melder ordgrenser. Ellers anslår avspilleren dem. */
    melderOrd: boolean;
    /** Si teksten. Returnerer en funksjon som avbryter uten å kalle onSlutt. */
    si: (tekst: string, h: SiHendelser) => () => void;
}

/**
 * Tekstmodus: ingen lyd, men ordene «sies» i lesetempo. Brukes når maskinen ikke har
 * en norsk stemme, eller når eleven skrur av lyden. Foreleseren beveger munnen likevel.
 */
export function lagTekstStemme(): Stemme {
    return {
        navn: 'Tekst',
        melderOrd: true,
        si(tekst, h) {
            const ord = ordIndekser(tekst);
            const timere: ReturnType<typeof setTimeout>[] = [];
            let t = 0;
            h.onStart?.();
            for (const o of ord) {
                timere.push(setTimeout(() => h.onOrd?.(o.index, o.lengde), t));
                t += ordVarighet(tekst.slice(o.index, o.index + o.lengde));
            }
            timere.push(setTimeout(() => h.onSlutt?.(), t));
            return () => timere.forEach(clearTimeout);
        },
    };
}

/** Nettleserens norske stemme, eller null om maskinen ikke har noen. */
export function lagNettleserStemme(): Stemme | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
    const synth = window.speechSynthesis;
    const stemme = pickBestNorwegianVoice(synth.getVoices());
    if (!stemme) return null;

    return {
        navn: stemme.name,
        // Mange stemmer sender ordgrenser, men ikke alle. Avspilleren anslår når
        // ingen kommer (se useForelesning), så her lover vi ingenting.
        melderOrd: false,
        si(tekst, h) {
            let avbrutt = false;
            const ytring = new SpeechSynthesisUtterance(tekst);
            ytring.voice = stemme;
            ytring.lang = stemme.lang;
            ytring.rate = TEMPO;
            ytring.onstart = () => !avbrutt && h.onStart?.();
            ytring.onboundary = (e) => {
                if (avbrutt || (e.name && e.name !== 'word')) return;
                const lengde = e.charLength || tekst.slice(e.charIndex).search(/\s|$/);
                h.onOrd?.(e.charIndex, lengde);
            };
            ytring.onend = () => !avbrutt && h.onSlutt?.();
            ytring.onerror = (e) => {
                if (avbrutt || e.error === 'interrupted' || e.error === 'canceled') return;
                h.onSlutt?.();
            };
            synth.speak(ytring);
            return () => {
                avbrutt = true;
                synth.cancel();
            };
        },
    };
}

/** Stemmene lastes asynkront i Chrome. Vent på dem, men aldri mer enn et sekund. */
export function ventPaStemmer(): Promise<void> {
    return new Promise((resolve) => {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
        if (!synth || synth.getVoices().length > 0) return resolve();
        const ferdig = () => {
            synth.removeEventListener('voiceschanged', ferdig);
            resolve();
        };
        synth.addEventListener('voiceschanged', ferdig);
        setTimeout(ferdig, 1000);
    });
}
