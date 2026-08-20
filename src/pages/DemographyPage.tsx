import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DemographySection } from '../components/demography/DemographySection';
import { MalthusSection } from '../components/demography/MalthusSection';
import { MoneySection } from '../components/demography/MoneySection';
import { RomeSection } from '../components/demography/RomeSection';
import { BankSection } from '../components/demography/BankSection';
import { InflationSection } from '../components/demography/InflationSection';
import { RoslingSection } from '../components/demography/RoslingSection';
import { ImmersiveCard } from '../components/ImmersiveCard';

export const DemographyPage: React.FC = () => {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pb-40 pt-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 text-center"
            >
                <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-4">
                    Demografi & Økonomi
                </h1>
                <p className="text-xl text-text-muted">Interaktiv lærebok om befolkning, ressurser og penger.</p>
            </motion.div>

            {/* Navigation Pills */}
            <div className="flex overflow-x-auto gap-3 pb-8 mb-8 no-scrollbar justify-center">
                {[
                    { id: 'section-demography', label: '1. Demografi' },
                    { id: 'section-malthus', label: '2. Malthus' },
                    { id: 'section-money', label: '3. Penger' },
                    { id: 'section-rome', label: '4. Romerriket' },
                    { id: 'section-bank', label: '5. Banken' },
                    { id: 'section-inflation', label: '6. Inflasjon' },
                    { id: 'section-rosling', label: '7. Rikdom' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className="px-4 py-2 rounded-full bg-glass-bg border border-glass-border text-text-muted hover:bg-glass-highlight hover:text-text-main transition-all whitespace-nowrap text-sm font-bold"
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div id="section-demography"><DemographySection /></div>
            <div id="section-malthus"><MalthusSection /></div>
            <div id="section-money"><MoneySection /></div>
            <div id="section-rome"><RomeSection /></div>
            <div id="section-bank"><BankSection /></div>
            <div id="section-inflation"><InflationSection /></div>
            <div id="section-rosling"><RoslingSection /></div>

            {/* Simulator Teaser */}
            <ImmersiveCard className="border-t-4 border-t-indigo-500">
                <div className="p-10 md:p-16 bg-gradient-to-br from-slate-900/50 to-indigo-950/50 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                    <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                    <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10 text-white font-display">Prøv deg som bankdirektør</h2>
                    <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto relative z-10">
                        Nå vet du hvordan penger, renter og inflasjon henger sammen. Klarer du å holde
                        en bank flytende når kundene vil ha pengene sine tilbake samtidig?
                    </p>

                    <Link to="/mikrospill/bankens-balansegang" className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-900 font-bold rounded-full text-xl hover:scale-105 transition-transform shadow-2xl relative z-10">
                        <span>🎮</span>
                        Start spillet
                        <span>→</span>
                    </Link>
                </div>
            </ImmersiveCard>
        </div>
    );
};
