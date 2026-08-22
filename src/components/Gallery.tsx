import React from 'react';
import { isPendingImage } from '../utils/imageAvailability';
import { useImageAvailability } from '../hooks/useImageAvailability';

interface GalleryItem {
    image: string;
    caption?: string;
    alt?: string;
}

interface GalleryProps {
    title?: string;
    items: GalleryItem[];
}

/**
 * Ett galleribilde. Egen komponent fordi den trenger sin egen feiltilstand -
 * ett brutt bilde skal forsvinne uten å ta resten av galleriet med seg.
 */
const GalleryFigure: React.FC<{ item: GalleryItem }> = ({ item }) => {
    const { isAvailable, handleError } = useImageAvailability(item.image);

    if (!isAvailable) return null;

    return (
        <figure className="group relative overflow-hidden rounded-xl shadow-md border border-slate-100 bg-white">
            <div className="w-full overflow-hidden bg-slate-50">
                <img
                    src={item.image}
                    alt={item.alt || item.caption || 'Gallery image'}
                    onError={handleError}
                    className="w-full h-auto block transition-transform duration-700 group-hover:scale-105"
                />
            </div>
            {item.caption && (
                <figcaption className="p-4 bg-white border-t border-slate-50">
                    <p className="text-slate-600 text-sm leading-relaxed italic">{item.caption}</p>
                </figcaption>
            )}
        </figure>
    );
};

export const Gallery: React.FC<GalleryProps> = ({ title, items }) => {
    // Bilder som ikke er generert ennå filtreres bort før grid-oppsettet, slik at
    // to ekte bilder legger seg som to kolonner og ikke som to av fire hull.
    const visibleItems = (items || []).filter((item) => !isPendingImage(item.image));

    if (visibleItems.length === 0) return null;

    return (
        <div className="my-12">
            {title && (
                <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight relative inline-block">
                    {title}
                    <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-amber-400 rounded-full" />
                </h3>
            )}

            <div
                className={`grid grid-cols-1 ${visibleItems.length > 1 ? 'md:grid-cols-2' : ''} gap-6`}
            >
                {visibleItems.map((item, index) => (
                    <GalleryFigure key={index} item={item} />
                ))}
            </div>
        </div>
    );
};
