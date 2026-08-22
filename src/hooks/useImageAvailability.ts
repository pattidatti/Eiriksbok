import { useState } from 'react';
import { isPendingImage } from '../utils/imageAvailability';

/**
 * Vet om et bilde faktisk kan vises.
 *
 * To lag:
 *  1. Placeholder-markøren (`/images/placeholder.webp`) kjennes igjen på strengen
 *     alene, så vi aldri ber om en fil vi vet ikke finnes.
 *  2. `onError` fanger alt annet - skrivefeil i stien, en fil som ble slettet,
 *     et bilde som ikke lot seg dekode - og skrur av visningen der også.
 *
 * Kalleren bestemmer hva "ikke vis" betyr: en artikkel fjerner hele figuren,
 * et kort bytter til det genererte mønsteret.
 */
export const useImageAvailability = (src?: string | null) => {
    const [failed, setFailed] = useState(false);

    // Nullstill feilen når src endres. Justeres under render framfor i en effect,
    // samme mønster som i Image.tsx: da rekker aldri forrige bildes feiltilstand
    // å bli vist for det nye bildet.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
        setPrevSrc(src);
        setFailed(false);
    }

    return {
        /** Sant bare når stien peker på et bilde som lastet uten feil. */
        isAvailable: !isPendingImage(src) && !failed,
        /** Koble på `<img onError={...}>`. */
        handleError: () => setFailed(true),
    };
};
