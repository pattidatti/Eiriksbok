import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart, FileText, Link as LinkIcon, Shield, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    to: string;
    color: string;
    external?: boolean;
}> = ({ title, description, icon, to, color, external }) => {
    const Content = (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full hover:shadow-md transition-shadow"
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );

    if (external) {
        return <a href={to} className="block h-full">{Content}</a>;
    }

    return (
        <Link to={to} className="block h-full">
            {Content}
        </Link>
    );
};

export const AdminDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-900 text-white rounded-lg">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-display font-bold text-slate-900">Admin Dashboard</h1>
                    </div>
                    <p className="text-slate-500 text-lg">Verktøy for administrasjon og kvalitetssikring.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AdminCard
                        title="Lesestatistikk"
                        description="Se hva som blir lest. Topplister for artikler og emner i sanntid."
                        icon={<BarChart className="w-6 h-6 text-indigo-600" />}
                        to="/admin/stats"
                        color="bg-indigo-50"
                    />

                    <AdminCard
                        title="Innholdsinventar"
                        description="Oversikt over alle artikler. Sjekk manglende bilder, tags og ordtelling."
                        icon={<FileText className="w-6 h-6 text-emerald-600" />}
                        to="/admin/inventory"
                        color="bg-emerald-50"
                    />

                    <AdminCard
                        title="Link Checker"
                        description="Skann hele basen for døde lenker og ugyldige referanser."
                        icon={<LinkIcon className="w-6 h-6 text-blue-600" />}
                        to="/admin/links"
                        color="bg-blue-50"
                    />

                    <AdminCard
                        title="Quiz Admin"
                        description="Administrer rom og spørsmål for Quiz Battle systemet."
                        icon={<Gamepad2 className="w-6 h-6 text-purple-600" />}
                        to="/quiz-battle/admin-999"
                        color="bg-purple-50"
                    />

                    <AdminCard
                        title="Begreps-Scanner"
                        description="Scan innhold for nye fagbegreper som bør legges til i ordlisten."
                        icon={<FileText className="w-6 h-6 text-orange-600" />}
                        to="/admin/scanner"
                        color="bg-orange-50"
                    />

                </div>
            </div>
        </div>
    );
};
