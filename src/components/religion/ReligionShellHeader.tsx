import React from 'react';
import { Link } from 'react-router-dom';
import { Columns3, LayoutGrid, Compass } from 'lucide-react';
import { LensRail } from './LensRail';
import { getDimension } from './dimensionMeta';
import { useLens, compareHref } from '../../features/religion-nav/links';

export type ReligionSurface = 'hub' | 'profil' | 'sammenlign' | 'tema';

interface ReligionShellHeaderProps {
    /** Liten etikett over tittelen, f.eks. «Verdensreligioner» */
    eyebrow?: string;
    title: string;
    subtitle?: string;
    /** Flaten eleven står på - markeres i flatevelgeren */
    surface: ReligionSurface;
    /** Profilen har hjulet og trenger ikke railen i tillegg */
    showLens?: boolean;
    /**
     * Veiene mellom religionsflatene. Filosofisammenligningen bruker samme
     * topp, men er et annet rom - der ville lenkene ført eleven ut av det hen
     * holder på med.
     */
    showSurfaceNav?: boolean;
    /** Farge på etiketten, f.eks. religionens egen */
    accent?: string;
    right?: React.ReactNode;
    /**
     * Bilde bak tittelen. Tittelen legges da oppå båndet i stedet for under
     * det - to blokker blir til én, og innholdet under holder seg over folden
     * på en 1366x768-skjerm.
     */
    backdrop?: string;
}

/**
 * Felles topp for de fire flatene i religionsrommet: hub, profil, tema og
 * sammenligning. Poenget er at eleven skal kjenne igjen rommet uansett hvilken
 * dør hen kom inn av - samme tittelform, samme linse, samme tre veier videre.
 *
 * Brødsmulene ligger allerede globalt i Layout, så de gjentas ikke her.
 */
export const ReligionShellHeader: React.FC<ReligionShellHeaderProps> = ({
    eyebrow,
    title,
    subtitle,
    surface,
    showLens = true,
    showSurfaceNav = true,
    accent = '#6366f1',
    right,
    backdrop,
}) => {
    const { dim } = useLens();
    const dimension = getDimension(dim);

    const surfaces: { key: ReligionSurface; label: string; to: string; icon: typeof Columns3 }[] = [
        { key: 'hub', label: 'Religionene', to: `/krle/religion?dim=${dim}`, icon: Compass },
        { key: 'sammenlign', label: 'Sammenlign', to: compareHref([], dim), icon: Columns3 },
        { key: 'tema', label: 'Temaer', to: `/krle/religion?dim=${dim}#temaer`, icon: LayoutGrid },
    ];

    return (
        <header className="mb-6">
            <div
                className={`flex flex-wrap items-center justify-between gap-3 mb-3 ${
                    backdrop
                        ? 'relative overflow-hidden rounded-3xl border border-white/60 px-5 py-4 min-h-[104px]'
                        : 'items-start'
                }`}
            >
                {backdrop && (
                    <>
                        {/* Rå <img>, ikke <Image>: den komponenten setter
                            `relative` på sin egen wrapper, og posisjonsklassene
                            slåss - bildet havner i flyten og blåser opp båndet.
                            Her er bildet ren dekor bak teksten. */}
                        <img
                            src={backdrop}
                            alt=""
                            aria-hidden
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(90deg, ${accent}f2, ${accent}b3 55%, ${accent}40)`,
                            }}
                        />
                    </>
                )}

                <div className={`min-w-0 ${backdrop ? 'relative' : ''}`}>
                    {eyebrow && (
                        <p
                            className="text-xs font-bold uppercase tracking-wider mb-1"
                            style={{ color: backdrop ? 'rgba(255,255,255,0.85)' : accent }}
                        >
                            {eyebrow}
                        </p>
                    )}
                    <h1
                        className={`text-3xl md:text-4xl font-bold leading-tight ${
                            backdrop ? 'text-white drop-shadow-sm' : 'text-slate-900'
                        }`}
                    >
                        {title}
                    </h1>
                    {subtitle && (
                        <p
                            className={`mt-1 max-w-2xl leading-relaxed ${
                                backdrop ? 'text-white/90 text-sm' : 'text-slate-500'
                            }`}
                        >
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className={`flex items-center gap-2 shrink-0 ${backdrop ? 'relative' : ''}`}>
                    {right}
                    {showSurfaceNav && (
                    <nav
                        aria-label="Flater i religionsrommet"
                        className="hidden sm:flex gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-white/60 shadow-sm"
                    >
                        {surfaces.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.key === surface;
                            return (
                                <Link
                                    key={item.key}
                                    to={item.to}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        isActive
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    )}
                </div>
            </div>

            {showLens && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <LensRail />
                    {dimension && (
                        <p className="text-sm text-slate-500 italic">«{dimension.question}»</p>
                    )}
                </div>
            )}
        </header>
    );
};
