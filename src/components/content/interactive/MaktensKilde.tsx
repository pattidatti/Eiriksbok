import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Users, ArrowUp, Sparkles, RotateCcw, ScrollText } from 'lucide-react';

interface MaktensKildeProps {
    title?: string;
}

type Phase = 'before' | 'after';

// Signaturkomponent for Uavhengighetserklaeringen.
// Lyspaere: foer 1776 kom makten ovenfra (Gud, konge, folk). Erklaeringen
// snudde pila: makten kommer nedenfra, fra folket, og et styre som svikter kan
// byttes ut. Eleven trykker en knapp og ser hele maktretningen snu.
export function MaktensKilde({ title = 'Hvor kommer makten fra?' }: MaktensKildeProps) {
    const [phase, setPhase] = useState<Phase>('before');
    const after = phase === 'after';

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                <Crown className="w-5 h-5 text-indigo-500" />
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-sm text-slate-500">
                        Trykk og les erklæringen fra 1776, og se hvem makten egentlig kommer fra.
                    </p>
                </div>
            </div>

            {/* Interaksjonsflate: kongen oppe, folket nede, en pil mellom dem */}
            <div className="p-6">
                <div className="mx-auto max-w-sm flex flex-col items-center gap-3">
                    {/* Kongen / regjeringen */}
                    <motion.div
                        animate={{
                            scale: after ? 0.82 : 1,
                            opacity: after ? 0.55 : 1,
                        }}
                        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                        className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 ${
                            after
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-amber-50 border-amber-300 shadow-sm'
                        }`}
                    >
                        <span
                            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                after ? 'bg-slate-200 text-slate-500' : 'bg-amber-400 text-white'
                            }`}
                        >
                            <Crown className="w-6 h-6" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-800 leading-tight">
                                {after ? 'Regjeringen' : 'Kongen'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {after ? 'tjener folket og kan byttes ut' : 'hersker av Guds nåde'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Pila som snur retning. Peker ned foer, opp etter. */}
                    <motion.div
                        animate={{ rotate: after ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 160, damping: 16 }}
                        className={`flex items-center justify-center w-11 h-11 rounded-full ${
                            after ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                        }`}
                    >
                        <ArrowUp className="w-6 h-6 rotate-180" />
                    </motion.div>

                    {/* Folket */}
                    <motion.div
                        animate={{
                            scale: after ? 1.04 : 0.92,
                        }}
                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                        className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 ${
                            after
                                ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                        <span
                            className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                after ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                            }`}
                        >
                            <Users className="w-6 h-6" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-800 leading-tight">Folket</p>
                            <p className="text-xs text-slate-500">
                                {after
                                    ? 'gir regjeringen makt og tar den tilbake'
                                    : 'lyder og betaler skatt'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Feedback-sone, alltid til stede */}
            <div className="mx-6 mb-4">
                {after ? (
                    <motion.div
                        key="after"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                            <p className="leading-snug">
                                Erklæringen snudde pila. Makten kommer nedenfra: folket gir
                                regjeringen lov til å styre. Bryter styret avtalen, har folket rett
                                til å bytte det ut. Det var en farlig, ny tanke i 1776.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                        Slik var det før: makten falt ovenfra, fra Gud til kongen og ned til folket.
                        Ingen valgte kongen. Trykk knappen og les hva erklæringen sa.
                    </div>
                )}
            </div>

            {/* Kontrollrad */}
            <div className="px-6 pb-5 flex items-center justify-between">
                <button
                    onClick={() => setPhase('after')}
                    disabled={after}
                    className={`inline-flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                        after
                            ? 'bg-emerald-100 text-emerald-700 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    <ScrollText className="w-4 h-4" />
                    {after ? 'Makten er snudd' : 'Les erklæringen (1776)'}
                </button>
                <button
                    onClick={() => setPhase('before')}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-sm transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Tilbakestill
                </button>
            </div>
        </div>
    );
}
