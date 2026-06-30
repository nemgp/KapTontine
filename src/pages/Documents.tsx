import { useState, useEffect } from 'react';
import { FileText, BookOpen, ChevronDown, ChevronRight, Home, Shield, Lock, Smartphone, Upload, Download, Trash2, Loader2 } from 'lucide-react';
import { useReunion } from '../context/ReunionContext';
import { supabase } from '../lib/supabase';

export default function Documents() {
    const { reunion, userRole } = useReunion();
    const [expandedSections, setExpandedSections] = useState<string[]>(['navigation']);
    const [files, setFiles] = useState<{ [key: string]: { name: string; url: string } }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});

    const isAdmin = userRole === 'admin';

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const isExpanded = (section: string) => expandedSections.includes(section);

    useEffect(() => {
        if (reunion?.id) {
            fetchFiles();
        }
    }, [reunion?.id]);

    const fetchFiles = async () => {
        if (!reunion?.id) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase.storage
                .from('action-images')
                .list(reunion.id);

            if (error) throw error;

            const docs: { [key: string]: { name: string; url: string } } = {};
            if (data) {
                const docTypes = ['doc_cycle', 'doc_finance', 'doc_epargne'];
                for (const file of data) {
                    for (const type of docTypes) {
                        if (file.name.startsWith(type + '.')) {
                            const { data: { publicUrl } } = supabase.storage
                                .from('action-images')
                                .getPublicUrl(`${reunion.id}/${file.name}`);
                            
                            docs[type] = {
                                name: file.name,
                                url: publicUrl
                            };
                        }
                    }
                }
            }
            setFiles(docs);
        } catch (err) {
            console.error("Error listing documents:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = async (type: string, file: File) => {
        if (!reunion?.id) return;
        setUploading(prev => ({ ...prev, [type]: true }));

        try {
            // Delete existing file of this type first if any
            const existingFile = files[type];
            if (existingFile) {
                await supabase.storage
                    .from('action-images')
                    .remove([`${reunion.id}/${existingFile.name}`]);
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${type}.${fileExt}`;
            const filePath = `${reunion.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('action-images')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            await fetchFiles();
        } catch (err) {
            console.error("Error uploading file:", err);
            alert("Erreur lors du chargement du fichier.");
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleDelete = async (type: string) => {
        if (!reunion?.id || !window.confirm("Voulez-vous vraiment supprimer ce document ?")) return;
        
        try {
            const existingFile = files[type];
            if (existingFile) {
                const { error } = await supabase.storage
                    .from('action-images')
                    .remove([`${reunion.id}/${existingFile.name}`]);
                if (error) throw error;
            }
            await fetchFiles();
        } catch (err) {
            console.error("Error deleting file:", err);
            alert("Erreur lors de la suppression du fichier.");
        }
    };

    const documentCards = [
        {
            id: 'doc_cycle',
            label: 'Cycle en cours',
            description: 'Règlement intérieur, PV, Statuts',
            colorClass: 'border-l-purple-500 hover:border-purple-400',
            bgIconClass: 'bg-purple-500/20',
            iconColorClass: 'text-purple-300'
        },
        {
            id: 'doc_finance',
            label: 'Suivi Financier',
            description: 'Suivi historique des cotisations',
            colorClass: 'border-l-[var(--valorant-cyan)] hover:border-[var(--valorant-cyan)]',
            bgIconClass: 'bg-cyan-500/20',
            iconColorClass: 'text-cyan-300'
        },
        {
            id: 'doc_epargne',
            label: 'Livret Épargne',
            description: 'Documents suivi épargne populaire',
            colorClass: 'border-l-[var(--valorant-red)] hover:border-[var(--valorant-red)]',
            bgIconClass: 'bg-red-500/20',
            iconColorClass: 'text-red-300'
        }
    ];

    return (
        <div className="pb-10">
            <h1 className="text-4xl font-black text-[var(--text-color)] uppercase italic tracking-tighter mb-8 font-sans">Documents & Archives</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {documentCards.map((card) => {
                    const fileObj = files[card.id];
                    const isFileUploading = uploading[card.id];

                    return (
                        <div
                            key={card.id}
                            className={`glass-card flex flex-col items-center text-center p-8 border-l-4 ${card.colorClass}`}
                        >
                            <div className={`w-16 h-16 rounded-2xl ${card.bgIconClass} flex items-center justify-center mb-4 shadow-lg transition-all`}>
                                <FileText size={32} className={card.iconColorClass} />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--text-color)] mb-2 uppercase italic tracking-wider font-sans">{card.label}</h2>
                            <p className="text-xs text-[var(--text-muted)] mb-6">{card.description}</p>

                            {isLoading ? (
                                <div className="flex justify-center items-center py-2 h-10">
                                    <Loader2 className="animate-spin text-slate-500" size={20} />
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center gap-4 mt-auto">
                                    {fileObj ? (
                                        <div className="w-full flex flex-col items-center">
                                            <a
                                                href={fileObj.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary py-2 px-4 shadow-md flex items-center gap-2 text-xs cursor-pointer w-full justify-center"
                                            >
                                                <Download size={14} />
                                                Télécharger le fichier
                                            </a>
                                            <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px] mt-2 block" title={fileObj.name}>
                                                {fileObj.name.substring(card.id.length + 1)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-red-400 font-bold uppercase tracking-widest block py-2">
                                            Aucun document
                                        </span>
                                    )}

                                    {isAdmin && (
                                        <div className="flex gap-2 w-full mt-2 border-t border-white/10 pt-4 justify-center">
                                            {isFileUploading ? (
                                                <Loader2 className="animate-spin text-purple-500" size={20} />
                                            ) : (
                                                <>
                                                    <label className="btn btn-outline py-2 px-3 text-xs flex items-center gap-1.5 cursor-pointer flex-1 justify-center border-purple-500/30 text-[var(--text-color)] hover:bg-purple-500/10">
                                                        <Upload size={13} />
                                                        {fileObj ? 'Remplacer' : 'Charger'}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    handleUpload(card.id, e.target.files[0]);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    {fileObj && (
                                                        <button
                                                            onClick={() => handleDelete(card.id)}
                                                            className="p-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-[4px] cursor-pointer"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="glass-card border border-white/5">
                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/10">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                        <BookOpen size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[var(--text-color)] uppercase italic tracking-tighter font-sans">Guide d'Utilisation</h2>
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
                                    <span className="font-bold text-[var(--text-color)] uppercase tracking-widest text-xs">{section.label}</span>
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
                    <p className="text-white font-black uppercase italic tracking-widest mb-2 font-sans">Besoin d'aide ?</p>
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
