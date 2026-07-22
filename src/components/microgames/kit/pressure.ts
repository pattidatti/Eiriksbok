import { useCallback, useEffect, useRef, useState } from 'react';

// Press-primitiver: tid, ressurs og uforutsigbarhet. Dette er laget som gjør et
// mikrospill til et SPILL - noe står på spill, eleven må dosere og prioritere.
// Destillert fra IngenmanslandMG (løpsvarme + artilleri) og generalisert.
//
// Alle tre hooks lever på DOM-siden (utenfor Canvas) og er trygge å koble til
// useFrame-logikk via de ref-baserte metodene (add/peek) - de skriver aldri
// React-state per frame.

// Nedtellingsklokke i sanntid. Driver tidspress: "nå soloppgangen", "før vannet
// stiger", "raid-et varer i 90 sekunder".
//   const clock = useGameClock({ seconds: 75, running: state === 'playing',
//       onExpire: () => setState('lost') });
//   <TimerPill seconds={clock.remaining} />  ... clock.restart()
export function useGameClock({
    seconds,
    running,
    onExpire,
}: {
    seconds: number;
    running: boolean;
    onExpire?: () => void;
}) {
    const [remaining, setRemaining] = useState(seconds);
    const remainingRef = useRef(seconds);
    const expiredRef = useRef(false);
    const onExpireRef = useRef(onExpire);
    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        if (!running) return;
        const t = setInterval(() => {
            remainingRef.current = Math.max(0, remainingRef.current - 0.1);
            setRemaining(remainingRef.current);
            if (remainingRef.current <= 0 && !expiredRef.current) {
                expiredRef.current = true;
                onExpireRef.current?.();
            }
        }, 100);
        return () => clearInterval(t);
    }, [running]);

    const restart = useCallback(
        (newSeconds?: number) => {
            remainingRef.current = newSeconds ?? seconds;
            expiredRef.current = false;
            setRemaining(remainingRef.current);
        },
        [seconds]
    );

    return {
        remaining,
        ratio: seconds > 0 ? remaining / seconds : 0,
        expired: remaining <= 0,
        restart,
    };
}

// Ressursmåler med automatisk drenering og overbelastning med hysterese.
// Generaliserer "løpsvarme" fra IngenmanslandMG: alarm, varme, utholdenhet,
// panikk, smittetrykk. Eleven MÅ dosere - det er valget under press som gjør
// mekanikken til spill.
//
//   const alarm = useMeter({ drainPerSecond: 0.22, overloadAt: 1, recoverTo: 0.4 });
//   // Fra useFrame (trygt - skriver kun ref): alarm.add(dt * 0.55)
//   // Fra diskrete hendelser: alarm.add(0.13)
//   useEffect(() => { if (alarm.overloaded) setState('caught'); }, [alarm.overloaded]);
//   <MeterBar value={alarm.value} label="Alarm" />
export function useMeter({
    initial = 0,
    drainPerSecond = 0.3,
    overloadAt = 1,
    recoverTo = 0.35,
    onOverload,
}: {
    initial?: number;
    // Hvor fort måleren synker av seg selv (per sekund).
    drainPerSecond?: number;
    // Verdien der overloaded slår inn (typisk 1).
    overloadAt?: number;
    // Overloaded slipper først når verdien har sunket hit (hysterese).
    recoverTo?: number;
    // Kalles ÉN gang hver gang måleren bikker over - koble fail-staten hit.
    onOverload?: () => void;
} = {}) {
    const [value, setValue] = useState(initial);
    const [overloaded, setOverloaded] = useState(false);
    const valueRef = useRef(initial);
    const overloadedRef = useRef(false);
    const onOverloadRef = useRef(onOverload);
    useEffect(() => {
        onOverloadRef.current = onOverload;
    }, [onOverload]);

    // add() er trygg fra useFrame OG fra klikk-handlers: skriver kun ref.
    // Speiling til state skjer i intervallet under (~12 Hz), ikke per frame.
    const add = useCallback((amount: number) => {
        valueRef.current = Math.min(1, Math.max(0, valueRef.current + amount));
    }, []);

    const peek = useCallback(() => valueRef.current, []);

    useEffect(() => {
        const t = setInterval(() => {
            // Sjekk overbelastning FØR drenering - add() klemmer til maks 1,
            // og terskelen (typisk 1) må kunne nås av en klemt verdi.
            if (valueRef.current >= overloadAt) {
                if (!overloadedRef.current) {
                    overloadedRef.current = true;
                    onOverloadRef.current?.();
                }
            } else if (valueRef.current <= recoverTo) {
                overloadedRef.current = false;
            }
            valueRef.current = Math.max(0, valueRef.current - drainPerSecond * 0.08);
            setValue(valueRef.current);
            setOverloaded(overloadedRef.current);
        }, 80);
        return () => clearInterval(t);
    }, [drainPerSecond, overloadAt, recoverTo]);

    const reset = useCallback(() => {
        valueRef.current = initial;
        overloadedRef.current = false;
        setValue(initial);
        setOverloaded(false);
    }, [initial]);

    return { value, overloaded, add, peek, reset };
}

// Tilfeldige hendelser med jevne mellomrom: artillerinedslag, lyskastere som
// skifter mønster, en vaktpatrulje, torden. Uforutsigbarhet gir uro - miljøet
// er "fiendtlig" uavhengig av hva eleven gjør.
//   useRandomPulse({ running: state === 'playing', minDelayMs: 2500,
//       maxDelayMs: 7000, onPulse: () => boom() });
export function useRandomPulse({
    running,
    minDelayMs,
    maxDelayMs,
    onPulse,
}: {
    running: boolean;
    minDelayMs: number;
    maxDelayMs: number;
    onPulse: () => void;
}) {
    const onPulseRef = useRef(onPulse);
    useEffect(() => {
        onPulseRef.current = onPulse;
    }, [onPulse]);

    useEffect(() => {
        if (!running) return;
        let tid: ReturnType<typeof setTimeout>;
        const fire = () => {
            onPulseRef.current();
            tid = setTimeout(fire, minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
        };
        tid = setTimeout(fire, minDelayMs * 0.6 + Math.random() * (maxDelayMs - minDelayMs) * 0.5);
        return () => clearTimeout(tid);
    }, [running, minDelayMs, maxDelayMs]);
}
