import React, { useState, useEffect } from 'react';
import { PlaceholderImage } from './PlaceholderImage';
import { isPendingImage } from '../utils/imageAvailability';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt: string;
    seed?: string; // For placeholder generation if src fails or is missing
    className?: string;
    priority?: boolean;
    // CSS aspect-ratio på wrapperen (f.eks. "16 / 9"). Reserverer plass før
    // bildet er lastet så layouten ikke hopper (CLS). Bruk der wrapperen ikke
    // får fast høyde via className.
    aspectRatio?: string;
    // Hva skal skje når bildet ikke finnes? Standard er det genererte mønsteret,
    // som er riktig der en tom flate ville brutt layouten (kort, hero, karusell).
    // Sett `true` der ingenting er bedre enn noe - da forsvinner elementet helt.
    hideWhenMissing?: boolean;
}

export const Image: React.FC<ImageProps> = ({
    src,
    alt,
    seed,
    className = '',
    priority = false,
    aspectRatio,
    hideWhenMissing = false,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
    const imgRef = React.useRef<HTMLImageElement>(null);

    // Reset state when src changes. Justeres under render i stedet for i en
    // effect, slik at det nye bildet aldri vises et øyeblikk med forrige bildes
    // lastet-/feil-tilstand.
    const [prevSrc, setPrevSrc] = useState<string | undefined>(src);
    if (src !== prevSrc) {
        setPrevSrc(src);
        setIsLoaded(false);
        setError(false);
        setCurrentSrc(src);
    }

    useEffect(() => {
        // Check if image is already loaded (e.g. from cache).
        // Her leser vi faktisk DOM-en: et bilde som ligger i cache kan være
        // ferdig lastet før React rekker å koble på onLoad, og da kommer den
        // hendelsen aldri. Dette er ekte synkronisering mot et eksternt system,
        // ikke avledet state — derfor er setState i effect riktig her.
        if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsLoaded(true);
        }
    }, [currentSrc]);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setError(true);
        setIsLoaded(true); // Stop loading state even if error
    };

    // Smart logic for object-fit and sizing
    // 1. Extract intended object-fit from className
    const objectFitMatch = className.match(/object-(cover|contain|fill|none|scale-down)/);
    const explicitObjectFit = objectFitMatch ? objectFitMatch[0] : null;

    // 2. Default to object-cover if nothing specified
    const finalObjectFit = explicitObjectFit || 'object-cover';

    // 3. Determine sizing:
    // - If covering, we MUST force w-full h-full to fill the container (otherwise it just max-fits)
    // - If containing (or others), max-w/max-h is safer to preserve aspect ratio within bounds without forcing stretch
    const sizeClasses = finalObjectFit === 'object-cover' ? 'w-full h-full' : 'max-w-full max-h-full';

    const wrapperStyle = aspectRatio ? { aspectRatio } : undefined;

    // Bildet finnes ikke: enten en placeholder-markør (kjent på strengen alene,
    // så vi slipper 404-runden og blinket), eller en sti som feilet ved lasting.
    if (isPendingImage(currentSrc) || error) {
        if (hideWhenMissing) return null;
        return (
            <div className={`relative overflow-hidden bg-slate-100 ${className}`} style={wrapperStyle}>
                <PlaceholderImage seed={seed || alt} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div className={`relative flex items-center justify-center overflow-hidden ${className}`} style={wrapperStyle}>
            {/* Blur placeholder (could be a tiny version of image, or just a color/skeleton) */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-white/5 animate-pulse" />
            )}

            <img
                ref={imgRef}
                src={currentSrc}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                {...(priority ? { fetchpriority: 'high' } : {})}
                onLoad={handleLoad}
                onError={handleError}
                className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${sizeClasses} ${finalObjectFit} ${className.includes('object-') ? '' : ''}`}
                {...props}
            />
        </div>
    );
};
