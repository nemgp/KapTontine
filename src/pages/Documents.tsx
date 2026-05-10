import { useState } from 'react';
import { FileText, BookOpen, ChevronDown, ChevronRight, Home, Shield, Lock, Smartphone, ArrowRight } from 'lucide-react';

export default function Documents() {
    const [expandedSections, setExpandedSections] = useState<string[]>(['navigation']);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const isExpanded = (section: string) => expandedSections.includes(section);

    return (
        <div className="pb-10">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-8">Documents & Archives</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Dossier Cycle en cours */}
                <a
                    href="https://drive.google.com/drive/folders/1JGj7cAzTn_OjNZibQ6qt1WV1zXrTBlEC"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card group flex flex-col items-center text-center p-8 border-l-4 border-l-purple-500 hover:border-purple-400"
                >
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all">
                        <FileText size={32} className="text-purple-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 uppercase italic tracking-wider">Cycle en cours</h2>
                    <p className="text-xs text-slate-400 mb-6">Règlement intérieur, PV, Statuts</p>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2 group-hover:text-white transition-colors">
                        Accéder au Drive <ArrowRight size={12} />
                    </span>
                </a>

                {/* Suivi Financier */}
                <a
                    href="https://genes-my.sharepoint.com/:x:/g/personal/dnkameni_ensae_fr/EWzouHh7cUpDpnb0pI9Gf4cBI5wxvbuitmtN0ZWPN1zV4g"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card group flex flex-col items-center text-center p-8 border-l-4 border-l-[var(--valorant-cyan)] hover:border-[var(--valorant-cyan)]"
                >
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,245,255,0.2)] group-hover:shadow-[0_0_30px_rgba(0,245,255,0.4)] transition-all">
                        <FileText size={32} className="text-cyan-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 uppercase italic tracking-wider">Suivi Financier</h2>
                    <p className="text-xs text-slate-400 mb-6">Suivi historique des cotisations</p>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2 group-hover:text-white transition-colors">
                            Ouvrir le fichier <ArrowRight size={12} />
                        </span>
                        <div className="text-[8px] py-1 px-2 rounded bg-black/40 border border-white/5 text-slate-400 font-bold uppercase tracking-widest">
                            MDP: <span className="text-white">KapTontine</span>
                        </div>
                    </div>
                </a>

                {/* Livret Epargne */}
                <a
                    href="https://drive.google.com/drive/folders/1g1zgK33KEPY7fmQg0c4Iy0C4Hdy7RSwj?usp=drive_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card group flex flex-col items-center text-center p-8 border-l-4 border-l-[var(--valorant-red)] hover:border-[var(--valorant-red)]"
                >
                    <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,70,85,0.2)] group-hover:shadow-[0_0_30px_rgba(255,70,85,0.4)] transition-all">
                        <FileText size={32} className="text-red-300" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2 uppercase italic tracking-wider">Livret Épargne</h2>
                    <p className="text-xs text-slate-400 mb-6">Documents suivi épargne populaire</p>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 flex items-center gap-2 group-hover:text-white transition-colors">
                        Accéder au Drive <ArrowRight size={12} />
                    </span>
                </a>
            </div>

            <div className="glass-card border border-white/5">
                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <BookOpen size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Guide d'Utilisation</h2>
                        <p className="text-slate-400 text-sm">Maîtrisez les outils de la plateforme KapTontine</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Sections */}
                    {[
                        { id: 'navigation', icon: Home, color: 'text-purple-400', label: 'Navigation dans le Portail', content: 'Le portail est divisé en sections claires : Dashboard pour les statistiques, Organisation pour les membres, Finances pour les prêts et épargnes, et Vie Sociale pour les actualités et le fonds de secours.' },
                        { id: 'admin', icon: Shield, color: 'text-red-400', label: 'Fonctionnalités Admin', content: 'Les administrateurs peuvent gérer les membres, valider les actions, et enregistrer les flux financiers. Ils ont accès à des boutons spécifiques marqués en couleur.' },
                        { id: 'security', icon: Lock, color: 'text-green-400', label: 'Sécurité du Compte', content: 'Votre compte est protégé par Supabase Auth. Nous vous recommandons de changer votre mot de passe régulièrement et de ne jamais le partager.' },
                        { id: 'mobile', icon: Smartphone, color: 'text-cyan-400', label: 'Utilisation Mobile', content: 'L\'interface est "mobile-first". Sur téléphone, utilisez le menu burger en haut à gauche pour naviguer. Les graphiques sont optimisés pour le tactile.' }
                    ].map((section) => (
                        <div key={section.id}>
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={`w-full flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border ${isExpanded(section.id) ? 'border-white/20 bg-white/10' : 'border-white/5'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <section.icon className={section.color} size={24} />
                                    <span className="font-bold text-white uppercase tracking-widest text-xs">{section.label}</span>
                                </div>
                                {isExpanded(section.id) ? <ChevronDown className="text-slate-500" size={20} /> : <ChevronRight className="text-slate-500" size={20} />}
                            </button>
                            {isExpanded(section.id) && (
                                <div className="mt-2 p-6 bg-black/20 rounded-2xl border border-white/5 text-slate-400 text-sm leading-relaxed">
                                    {section.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Guide */}
                <div className="mt-12 p-8 bg-gradient-to-r from-[var(--valorant-red)]/10 to-transparent border border-[var(--valorant-red)]/20 rounded-3xl text-center">
                    <p className="text-white font-black uppercase italic tracking-widest mb-2">Besoin d'aide ?</p>
                    <p className="text-slate-400 text-xs mb-6">Contactez les membres du bureau pour toute assistance technique ou administrative.</p>
                    <div className="flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white">Président</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white">Secrétaire</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-white">Trésorier</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
