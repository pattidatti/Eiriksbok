import React, { useState } from 'react';
import { PlaceholderImage } from './PlaceholderImage';

interface ImageWithFallbackProps {
    src?: string;
    alt: string;
    seed: string;
    className?: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, seed, className = '' }) => {
    const [error, setError] = useState(false);

    // Nullstill feilen når src endres. Justeres under render i stedet for i en
    // effect: da rekker ikke den gamle feiltilstanden å bli vist for det nye
    // bildet. React kjører renderen på nytt umiddelbart, uten å male noe skjerm.
    const [prevSrc, setPrevSrc] = useState(src);
    if (src !== prevSrc) {
        setPrevSrc(src);
        setError(false);
    }

    if (!src || error) {
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
