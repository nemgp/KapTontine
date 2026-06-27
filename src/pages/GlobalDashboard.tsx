import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, CreditCard, Loader2, ArrowRight } from 'lucide-react';

export default function GlobalDashboard() {
    const { user, profile } = useAuth();
    const [reunions, setReunions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newReunionName, setNewReunionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetchReunions();
        }
    }, [user]);

    const fetchReunions = async () => {
        setIsLoading(true);
        try {
            // Get reunions the user is a member of
            const { data, error } = await supabase
                .from('membres_reunion')
                .select(`
                    reunions (
                        id,
                        nom,
                        description,
                        date_creation
                    ),
                    role
                `)
                .eq('id_profile', user?.id);

            if (error) throw error;
            if (data) {
                // Map the nested structure
                const formattedReunions = data.map((item: any) => ({
                    ...item.reunions,
                    userRole: item.role
                }));
                setReunions(formattedReunions);
            }
        } catch (err) {
            console.error("Erreur lors de la récupération des réunions:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateReunion = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { reunionName: newReunionName, userId: user?.id }
            });

            if (error) throw error;
            
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Impossible d'obtenir l'URL de paiement.");
            }
        } catch (err) {
            console.error("Erreur de création:", err);
            alert("Erreur lors de la création de la réunion.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="container mx-auto max-w-5xl">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-white drop-shadow-md">Mes Réunions</h1>
                        <button 
                            onClick={() => navigate('/profil')}
                            className="text-slate-400 mt-1 hover:text-purple-400 transition-colors flex items-center gap-2 text-sm"
                        >
                            Bonjour {profile?.nom || profile?.email}
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full border border-white/10">Mon Profil</span>
                        </button>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="btn btn-primary shadow-lg shadow-purple-900/50 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Créer une réunion</span>
                    </button>
                </header>

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-purple-500" size={40} />
                    </div>
                ) : reunions.length === 0 ? (
                    <div className="glass-card text-center py-16">
                        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <Plus className="text-slate-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Aucune réunion</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">
                            Vous ne participez à aucune réunion pour le moment. Vous pouvez créer votre propre groupe ou demander à être invité.
                        </p>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            Créer ma première réunion
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reunions.map((reunion) => (
                            <div 
                                key={reunion.id} 
                                onClick={() => navigate(`/reunions/${reunion.id}`)}
                                className="glass-card cursor-pointer hover:bg-white/10 transition-all border border-white/20 hover:border-purple-500/50 group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">{reunion.nom}</h3>
                                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-black/20 text-slate-300">
                                        {reunion.userRole}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 mb-6">{reunion.description}</p>
                                <div className="flex justify-between items-center text-sm border-t border-white/10 pt-4">
                                    <span className="text-slate-500">
                                        Créée le {new Date(reunion.date_creation).toLocaleDateString('fr-FR')}
                                    </span>
                                    <ArrowRight className="text-purple-400 transform group-hover:translate-x-1 transition-transform" size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal Création Réunion */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="glass-card w-full max-w-md border border-purple-500/30">
                            <h2 className="text-xl font-bold text-white mb-4">Créer une Réunion</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                La création d'une réunion coûte 10€ pour une durée de 2 ans. 
                                Vous en serez automatiquement l'Administrateur (Président).
                            </p>
                            
                            <form onSubmit={handleCreateReunion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Nom de la réunion</label>
                                    <input
                                        type="text"
                                        value={newReunionName}
                                        onChange={(e) => setNewReunionName(e.target.value)}
                                        className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-600"
                                        placeholder="Ex: Tontine Family"
                                        required
                                        disabled={isCreating}
                                    />
                                </div>
                                
                                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl mb-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-slate-300">Total à payer :</span>
                                        <span className="text-xl font-bold text-white">10,00 €</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <CreditCard size={14} />
                                        <span>Paiement sécurisé via Stripe</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end mt-8">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                        disabled={isCreating}
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit"
                                        className="btn btn-primary shadow-lg flex items-center gap-2"
                                        disabled={isCreating || !newReunionName}
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="animate-spin" size={16} />
                                                Paiement en cours...
                                            </>
                                        ) : (
                                            'Payer 10€ et Créer'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
