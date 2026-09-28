import { createElement, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Check, Maximize2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { StationActivityV3 } from '../../../types';
import { getComponent } from '../../ComponentRegistry';
import { LazyComponentSlot } from '../LazyComponentSlot';
import { SortActivity } from './SortActivity';
import { OrderActivity } from './OrderActivity';

const MicroGameBlock = lazy(() =>
    import('../../microgames/MicroGameBlock').then((m) => ({ default: m.MicroGameBlock }))
);

interface StationActivityProps {
    stationId: string;
    activity: StationActivityV3;
    done: boolean;
    onDone: (score?: number) => void;
}

export function StationActivity({ stationId, activity, done, onDone }: StationActivityProps) {
    const navigate = useNavigate();
    const location = useLocation();

    switch (activity.type) {
        case 'microgame':
            return (
                <Suspense
                    fallback={<div className="h-40 rounded-2xl bg-slate-100 animate-pulse" />}
                >
                    <MicroGameBlock
                        gameId={activity.gameId}
                        {...(activity.props ?? {})}
                        onComplete={(r: { completed: boolean; score: number }) => {
                            if (r.completed) onDone(r.score);
                        }}
                    />
                </Suspense>
            );

        case 'fullgame': {
            // De store 3D-spillene bor på egen side. Vi sender med hvor eleven kom
            // fra, så spillsiden kan vise «Tilbake til stien» og stien åpner rett
            // stasjon igjen når eleven kommer tilbake.
            const start = () => {
                onDone();
                const fra = encodeURIComponent(location.pathname);
                navigate(`/oving/spill/${activity.gameId}?fra=${fra}&stasjon=${stationId}`);
            };
            return (
                <motion.button
                    type="button"
                    onClick={start}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="group relative block w-full overflow-hidden rounded-2xl text-left shadow-xl shadow-amber-900/10 ring-1 ring-amber-200"
                >
                    <div className="aspect-[16/7] w-full bg-amber-100">
                        {activity.image && (
                            <img
                                src={activity.image}
                                alt=""
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-white">
                        {activity.subtitle && (
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                                {activity.subtitle}
                            </p>
                        )}
                        <p className="font-display text-2xl sm:text-3xl font-black leading-tight">
                            {activity.title}
                        </p>
                        <p className="mt-1 max-w-xl text-sm text-white/85">{activity.pitch}</p>
                        <span className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 font-black text-amber-950 shadow-lg transition group-hover:bg-amber-300">
                            {done ? (
                                <Check className="w-4 h-4" />
                            ) : (
                                <Maximize2 className="w-4 h-4" />
                            )}
                            {done ? 'Spill igjen' : 'Start 3D-spillet'}
                        </span>
                    </div>
                </motion.button>
            );
        }

        case 'sort':
            return (
                <SortActivity
                    prompt={activity.prompt}
                    buckets={activity.buckets}
                    items={activity.items}
                    onComplete={onDone}
                />
            );

        case 'order':
            return (
                <OrderActivity
                    prompt={activity.prompt}
                    items={activity.items}
                    onComplete={onDone}
                />
            );

        case 'component': {
            const Component = getComponent(activity.name);
            if (!Component) return null;
            return (
                <div>
                    <LazyComponentSlot name={activity.name}>
                        {createElement(Component, activity.props)}
                    </LazyComponentSlot>
                    {!done && (
                        <button
                            type="button"
                            onClick={() => onDone()}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                        >
                            <Check className="w-4 h-4" />
                            Jeg er ferdig
                        </button>
                    )}
                </div>
            );
        }
    }
}
