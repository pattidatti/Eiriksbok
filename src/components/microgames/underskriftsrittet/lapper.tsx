// Lagene over 3D-bildet: det malte lerretet (vignett og korn), tastelappen ved hesten på tunet,
// og den oransje kanten med «hvor og hvorfor du ble tatt» i det fryste bildet.

import type { Ref, RefObject } from 'react';
import { FARGE } from './palette';
import { TEKST_FONT } from './textures';

export function RopLapp({ ref }: { ref: Ref<HTMLDivElement> }) {
    return (
        <div
            ref={ref}
            aria-hidden
            style={{
                position: 'absolute',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
                opacity: 0,
                padding: '3px 10px',
                borderRadius: 6,
                border: `2px solid ${FARGE.blekk}`,
                fontFamily: TEKST_FONT,
                fontWeight: 700,
                fontSize: 15,
                whiteSpace: 'nowrap',
                transition: 'opacity .2s',
            }}
        />
    );
}

/** Malt lerret: vignett og korn over hele bildet, og toningen mellom brettene. */
export function Lerret({
    korn,
    toningRef,
}: {
    korn: string | null;
    toningRef: RefObject<HTMLDivElement | null>;
}) {
    return (
        <>
            {/* Malt lerret: vignett og korn over hele bildet */}
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(10,22,20,.55) 100%)${korn ? `, url(${korn})` : ''}`,
                    mixBlendMode: 'multiply',
                }}
            />
            <div
                ref={toningRef}
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: FARGE.panel,
                    opacity: 0,
                }}
            />
        </>
    );
}

/** Det fryste bildet når lyset tok deg: oransje kant og hvor og hvorfor. */
export function FangetKant({ tatt }: { tatt: string | null }) {
    return (
        <>
            <div
                aria-hidden
                style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    boxShadow: `inset 0 0 160px 60px rgba(240,120,24,.45)`,
                }}
            />
            {tatt && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        bottom: 64,
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none',
                        padding: '8px 18px',
                        borderRadius: 8,
                        background: FARGE.papir,
                        border: `3px solid ${FARGE.fare}`,
                        color: FARGE.blekk,
                        fontFamily: TEKST_FONT,
                        fontWeight: 700,
                        fontSize: 19,
                        whiteSpace: 'nowrap',
                        animation: 'arcBeat .35s ease-out',
                    }}
                >
                    {tatt}
                </div>
            )}
        </>
    );
}
