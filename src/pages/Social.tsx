import { useState, useEffect } from 'react';
import { Heart, Plus, Loader2, X, MessageSquare, Image as ImageIcon, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReunion } from '../context/ReunionContext';
import { supabase } from '../lib/supabase';

// Constants for Secours
const ASSIETTE = 1500; 
const HELP_TYPES = [
    { id: 'naissance', label: 'Naissance', percent: 0.5, icon: '👶' },
    { id: 'mariage', label: 'Mariage', percent: 1.0, icon: '💍' },
    { id: 'hospitalisation', label: 'Hospitalisation (>3j)', percent: 0.25, icon: '🏥' },
    { id: 'deces', label: 'Perte grave', percent: 1, icon: '⚰️' },
];

interface Action {
    id: string;
    titre: string;
    texte: string;
    categorie: string;
    image_url: string | null;
    id_reunion: string;
    id_auteur: string;
    date_creation: string;
    profiles?: {
        nom: string;
        avatar: string | null;
    };
}

export default function Social() {
    const { user, profile } = useAuth();
    const { reunion } = useReunion();
    
    const [activeTab, setActiveTab] = useState<'actions' | 'secours'>('actions');
    const [actions, setActions] = useState<Action[]>([]);
    const [isLoadingActions, setIsLoadingActions] = useState(true);
    const [showActionModal, setShowActionModal] = useState(false);
    
    // Action Form State
    const [actionTitle, setActionTitle] = useState('');
    const [actionText, setActionText] = useState('');
    const [actionCategory, setActionCategory] = useState('Cotisation Tontine');
    const [actionImage, setActionImage] = useState<File | null>(null);
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);

    useEffect(() => {
        if (!reunion?.id) return;

        fetchActions();

        const subscription = supabase
            .channel('actions-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'actions',
                    filter: `id_reunion=eq.${reunion.id}`
                },
                () => {
                    fetchActions();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [reunion?.id]);

    const fetchActions = async () => {
        setIsLoadingActions(true);
        try {
            const { data, error } = await supabase
                .from('actions')
                .select('*, profiles(nom, avatar)')
                .eq('id_reunion', reunion?.id)
                .order('date_creation', { ascending: false });

            if (error) throw error;
            setActions(data || []);
        } catch (err) {
            console.error("Error fetching actions:", err);
        } finally {
            setIsLoadingActions(false);
        }
    };

    const handleCreateAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !reunion) return;
        setIsSubmittingAction(true);

        try {
            let imageUrl = null;
            if (actionImage) {
                const fileExt = actionImage.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${reunion.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('action-images')
                    .upload(filePath, actionImage);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('action-images')
                    .getPublicUrl(filePath);
                
                imageUrl = publicUrl;
            }

            const { error } = await supabase
                .from('actions')
                .insert({
                    titre: actionTitle,
                    texte: actionText,
                    categorie: actionCategory,
                    image_url: imageUrl,
                    id_reunion: reunion.id,
                    id_auteur: user.id
                });

            if (error) throw error;

            setActionTitle('');
            setActionText('');
            setActionImage(null);
            setShowActionModal(false);
            fetchActions();
        } catch (err) {
            console.error("Error creating action:", err);
            alert("Erreur lors de la publication de l'action.");
        } finally {
            setIsSubmittingAction(false);
        }
    };

    return (
        <div className="pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-white drop-shadow-md">Vie Sociale</h1>
                
                {/* Tabs */}
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button 
                        onClick={() => setActiveTab('actions')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'actions' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Fil d'Action
                    </button>
                    <button 
                        onClick={() => setActiveTab('secours')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'secours' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Secours
                    </button>
                </div>
            </div>

            {activeTab === 'actions' ? (
                <div className="space-y-6">
                    {/* Create Action Trigger */}
                    <div className="glass-card flex items-center gap-4 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setShowActionModal(true)}>
                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shrink-0">
                            {profile?.nom?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 bg-white/5 rounded-full px-6 py-2 text-slate-400 text-sm border border-white/5">
                            Quoi de neuf dans la réunion ?
                        </div>
                        <button className="p-2 text-purple-400">
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* Actions Feed */}
                    {isLoadingActions ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-purple-500" size={40} />
                        </div>
                    ) : actions.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                            <MessageSquare className="mx-auto text-slate-500 mb-4" size={48} />
                            <p className="text-slate-400">Aucune action publiée pour le moment.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            {actions.map((action) => (
                                <div key={action.id} className="glass-card p-0 overflow-hidden border border-white/10 hover:border-purple-500/30 transition-all">
                                    {/* Action Header */}
                                    <div className="p-4 flex items-center gap-3 border-b border-white/5">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                            {action.profiles?.avatar ? (
                                                <img src={action.profiles.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-slate-400">{action.profiles?.nom?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-white">{action.profiles?.nom}</p>
                                            <p className="text-[10px] text-slate-500">{new Date(action.date_creation).toLocaleString('fr-FR')}</p>
                                        </div>
                                        <span className="px-2 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300 font-bold uppercase tracking-wider">
                                            {action.categorie}
                                        </span>
                                    </div>

                                    {/* Action Content */}
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold text-white mb-2">{action.titre}</h3>
                                        <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{action.texte}</p>
                                    </div>

                                    {/* Action Image */}
                                    {action.image_url && (
                                        <div className="w-full aspect-video bg-black overflow-hidden">
                                            <img src={action.image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {/* Action Footer */}
                                    <div className="px-4 py-3 bg-white/5 flex items-center gap-4 text-slate-400">
                                        <button className="flex items-center gap-2 text-xs hover:text-white transition-colors">
                                            <MessageSquare size={16} /> Commenter
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Secours Content (Existing functionality adapted for Supabase would go here) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         {HELP_TYPES.map((type) => (
                            <div key={type.id} className="glass-card">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl">{type.icon}</span>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white text-sm">{type.label}</h3>
                                        <p className="text-[10px] text-slate-400">{type.percent * 100}% de l'assiette</p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-white/10">
                                    <span className="text-xl font-bold text-cyan-300">{ASSIETTE * type.percent} €</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="glass-card">
                         <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Heart className="text-red-400" size={24} />
                            Historique des Soutiens Reçus
                        </h2>
                        <p className="text-slate-400 text-center py-10">Fonctionnalité en cours de migration vers Supabase...</p>
                    </div>
                </div>
            )}

            {/* Create Action Modal */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-xl border border-purple-500/30">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Publier une Action</h2>
                            <button onClick={() => setShowActionModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAction} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Titre de l'action</label>
                                <input
                                    type="text"
                                    value={actionTitle}
                                    onChange={(e) => setActionTitle(e.target.value)}
                                    className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                    placeholder="Ex: Cotisation du mois de Mars"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Catégorie</label>
                                <select
                                    value={actionCategory}
                                    onChange={(e) => setActionCategory(e.target.value)}
                                    className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                >
                                    <option>Cotisation Tontine</option>
                                    <option>Épargne</option>
                                    <option>Prêt</option>
                                    <option>Annonce</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <textarea
                                    value={actionText}
                                    onChange={(e) => setActionText(e.target.value)}
                                    className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white h-32 resize-none"
                                    placeholder="Détails de l'action..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Image (optionnelle)</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-white/5 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                        <ImageIcon size={20} className="text-slate-400" />
                                        <span className="text-sm text-slate-400">{actionImage ? actionImage.name : 'Choisir une image'}</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            className="hidden" 
                                            onChange={(e) => setActionImage(e.target.files ? e.target.files[0] : null)}
                                        />
                                    </label>
                                    {actionImage && (
                                        <button 
                                            type="button" 
                                            onClick={() => setActionImage(null)}
                                            className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-8">
                                <button 
                                    type="button" 
                                    onClick={() => setShowActionModal(false)}
                                    className="px-6 py-2 text-slate-300 hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit"
                                    className="btn btn-primary px-8 flex items-center gap-2"
                                    disabled={isSubmittingAction}
                                >
                                    {isSubmittingAction ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Publication...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Publier
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
