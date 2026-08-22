import React from 'react';
import { motion, type Variants } from 'framer-motion';
import { useImageAvailability } from '../hooks/useImageAvailability';

interface ArticleImageProps {
    src?: string;
    alt?: string;
    caption?: string;
    /** Eksplisitt bredde fra JSON-en (`b.width`). Overstyrer w-full. */
    width?: string | number;
    /**
     * `plain` = bildet flyter i tekstspalten (LessonPage).
     * `framed` = bildet ligger i et kort med 16:9-ramme og bunntekst (TopicPage).
     */
    variant?: 'plain' | 'framed';
    /** Sendes videre til motion-wrapperen når blokken inngår i en stagger-liste. */
    motionVariants?: Variants;
}

/**
 * Bildeblokk i en artikkel som fjerner seg selv når bildet ikke finnes.
 *
 * Hele figuren forsvinner - også bildeteksten. En bildetekst som henger under
 * ingenting ser like ødelagt ut som den brutte bilderammen den skulle forklare.
 * Se `src/utils/imageAvailability.ts` for hvorfor placeholder-markøren blir
 * stående i JSON-en selv om den ikke vises.
 */
export const ArticleImage: React.FC<ArticleImageProps> = ({
    src,
    alt,
    caption,
    width,
    variant = 'plain',
    motionVariants,
}) => {
    const { isAvailable, handleError } = useImageAvailability(src);

    if (!isAvailable) return null;

    const figure =
        variant === 'framed' ? (
            <figure className="rounded-xl overflow-hidden shadow-lg bg-surface-card border border-slate-100">
                <div className="aspect-video w-full relative bg-slate-100">
                    <img
                        src={src}
                        alt={alt || caption || ''}
                        loading="lazy"
                        onError={handleError}
                        className="w-full h-full object-cover"
                    />
                </div>
                {caption && (
                    <figcaption className="p-4 text-sm text-slate-500 bg-slate-50 border-t border-slate-100 italic">
                        {caption}
                    </figcaption>
                )}
            </figure>
        ) : (
            <figure className={`my-8 ${width ? 'flex flex-col items-center' : ''}`}>
                <img
                    src={src}
                    alt={alt || ''}
                    loading="lazy"
                    onError={handleError}
                    className="w-full rounded-xl shadow-lg"
                    // 'auto 16 / 9' reserverer 16:9-plass FØR lasting (unngår
                    // layout-hopp); etter lasting gjelder bildets egne proporsjoner.
                    style={{ aspectRatio: 'auto 16 / 9', ...(width ? { width } : {}) }}
                />
                {caption && (
                    <figcaption className="mt-2 text-center text-sm text-gray-400 italic">
                        {caption}
                    </figcaption>
                )}
            </figure>
        );

    if (variant === 'framed') {
        return (
            <motion.div variants={motionVariants} className="my-8">
                {figure}
            </motion.div>
        );
    }

    return figure;
};
