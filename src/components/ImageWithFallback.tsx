import React, { useState } from 'react';
import { PlaceholderImage } from './PlaceholderImage';
import { isPendingImage } from '../utils/imageAvailability';

interface ImageWithFallbackProps {
    src?: string;
    alt: string;
    seed: string;
    className?: string;
    /** Vis ingenting i stedet for det genererte mønsteret når bildet mangler. */
    hideWhenMissing?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
    src,
    alt,
    seed,
    className = '',
    hideWhenMissing = false,
}) => {
    const [error, setError] = useState(false);

    // Nullstill feilen når src endres. Justeres under render i stedet for i en
    // effect: da rekker ikke den gamle feiltilstanden å bli vist for det nye
    // bildet. React kjører renderen på nytt umiddelbart, uten å male noe skjerm.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
        setPrevSrc(src);
        setError(false);
    }

    // Placeholder-markøren kjennes igjen på stien, så vi ber aldri om en fil vi
    // vet ikke finnes. `error` fanger alt annet som ikke lot seg laste.
    if (isPendingImage(src) || error) {
        if (hideWhenMissing) return null;
        return <PlaceholderImage seed={seed} className={className} />;
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
};
