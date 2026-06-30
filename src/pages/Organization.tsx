import { useState, useEffect } from 'react';
import { Trash2, Edit2, Check, X, Loader2, UserPlus, CreditCard, ShieldAlert, Edit } from 'lucide-react';
import { useReunion } from '../context/ReunionContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { getSavannaAnimal } from '../lib/savanna';

interface Member {
    id: string;
    id_profile: string;
    role: string;
    poste: string;
    profiles: {
        nom: string;
        email: string;
        avatar: string | null;
    };
}

export default function Organization() {
    const { reunion, userRole } = useReunion();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberPoste, setNewMemberPoste] = useState('Membre');
    
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');

    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editPoste, setEditPoste] = useState('');
    const [editRole, setEditRole] = useState('');
    
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    
    const [editReunionName, setEditReunionName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    const isAdmin = userRole === 'admin';

    useEffect(() => {
        if (reunion) {
            setEditReunionName(reunion.nom);
        }
    }, [reunion]);

    const handleRenameReunion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reunion || !editReunionName.trim()) return;
        setIsRenaming(true);
        try {
            const { error } = await supabase
                .from('reunions')
                .update({ nom: editReunionName.trim() })
                .eq('id', reunion.id);

            if (error) throw error;
            alert("Le nom de la réunion a été modifié avec succès !");
            window.location.reload();
        } catch (err) {
            console.error("Error renaming reunion:", err);
            alert("Erreur lors de la modification du nom.");
        } finally {
            setIsRenaming(false);
        }
    };

    useEffect(() => {
        if (reunion?.id) {
            fetchMembers();
        }
    }, [reunion?.id]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('membres_reunion')
                .select('*, profiles(nom, email, avatar)')
                .eq('id_reunion', reunion?.id);

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error("Error fetching members:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { 
                    reunionName: reunion?.nom, 
                    userId: user?.id,
                    reunionId: reunion?.id,
                    type: 'upgrade_reunion'
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error("Impossible d'obtenir l'URL de paiement.");
            }
        } catch (err) {
            console.error("Upgrade error:", err);
            alert("Erreur lors de la préparation de la mise à niveau.");
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reunion) return;

        // Check freemium limit (5 members maximum)
        if (!reunion.is_premium && members.length >= 5) {
            setShowUpgradeModal(true);
            return;
        }

        setIsAddingMember(true);

        try {
            // Find profile by email
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', newMemberEmail)
                .single();

            if (profileError || !profileData) {
                setInviteEmail(newMemberEmail);
                setShowInviteModal(true);
                setIsAddingMember(false);
                return;
            }

            // Check if already a member
            const { data: existingMember } = await supabase
                .from('membres_reunion')
                .select('id')
                .eq('id_reunion', reunion.id)
                .eq('id_profile', profileData.id)
                .single();

            if (existingMember) {
                alert("Cet utilisateur est déjà membre de cette réunion.");
                setIsAddingMember(false);
                return;
            }

            // Add to reunion
            const { error: insertError } = await supabase
                .from('membres_reunion')
                .insert({
                    id_reunion: reunion.id,
                    id_profile: profileData.id,
                    role: 'membre',
                    poste: newMemberPoste
                });

            if (insertError) throw insertError;

            setNewMemberEmail('');
            setNewMemberPoste('Membre');
            fetchMembers();
        } catch (err) {
            console.error("Error adding member:", err);
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleUpdateMember = async (memberId: string) => {
        try {
            const { error } = await supabase
                .from('membres_reunion')
                .update({
                    poste: editPoste,
                    role: editRole
                })
                .eq('id', memberId);

            if (error) throw error;
            setEditingMemberId(null);
            fetchMembers();
        } catch (err) {
            console.error("Error updating member:", err);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!window.confirm("Supprimer ce membre de la réunion ?")) return;
        try {
            const { error } = await supabase
                .from('membres_reunion')
                .delete()
                .eq('id', memberId);

            if (error) throw error;
            fetchMembers();
        } catch (err) {
            console.error("Error removing member:", err);
        }
    };

    return (
        <div className="pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-color)] drop-shadow-md">Organisation</h1>
                
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button 
                        onClick={() => setActiveTab('current')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'current' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Bureau Actuel
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Historique
                    </button>
                </div>
            </div>

            {activeTab === 'current' ? (
                <div className="space-y-8">
                    {/* Freemium Banner */}
                    {!reunion?.is_premium ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded uppercase font-black">Gratuit</span>
                                    Réunion limitée à 5 membres maximum ({members.length} / 5)
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Vous devez passer au plan Premium pour inviter plus de 5 membres.</p>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={isUpgrading}
                                    className="btn btn-primary py-2 px-4 shadow-[0_0_15px_rgba(255,70,85,0.2)] flex items-center gap-2 cursor-pointer"
                                >
                                    {isUpgrading ? <Loader2 className="animate-spin" size={14} /> : <CreditCard size={14} />}
                                    Passer en Premium (10€)
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                                <h3 className="font-bold text-[var(--text-color)] flex items-center gap-2">
                                    <span className="text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded uppercase font-black">Premium ✦</span>
                                    Réunion Premium — Nombre de membres illimité ({members.length} membres)
                                </h3>
                        </div>
                    )}

                    {/* Invite Section (Admins Only) */}
                    {isAdmin && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Rename Reunion Panel */}
                            <div className="glass-card">
                                <h2 className="text-lg font-bold text-[var(--text-color)] mb-4 flex items-center gap-2">
                                    <Edit size={20} className="text-purple-400" />
                                    Paramètres de la réunion
                                </h2>
                                <form onSubmit={handleRenameReunion} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                            Nom de la réunion
                                        </label>
                                        <input
                                            type="text"
                                            value={editReunionName}
                                            onChange={(e) => setEditReunionName(e.target.value)}
                                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white font-medium"
                                            required
                                            disabled={isRenaming}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary w-full shadow-md"
                                        disabled={isRenaming || editReunionName.trim() === reunion?.nom}
                                    >
                                        {isRenaming ? <Loader2 className="animate-spin" size={16} /> : 'Enregistrer le nouveau nom'}
                                    </button>
                                </form>
                            </div>

                            {/* Invite Section */}
                            <div className="glass-card border-dashed border-2 border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-[var(--text-color)] mb-4 flex items-center gap-2">
                                    <UserPlus size={20} className="text-purple-400" />
                                    Inviter un membre
                                </h2>
                                    <form onSubmit={handleAddMember} className="flex flex-col gap-4">
                                        <input
                                            type="email"
                                            value={newMemberEmail}
                                            onChange={(e) => setNewMemberEmail(e.target.value)}
                                            placeholder="Email de l'utilisateur"
                                            className="p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={newMemberPoste}
                                            onChange={(e) => setNewMemberPoste(e.target.value)}
                                            placeholder="Poste (ex: Trésorier)"
                                            className="p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                            required
                                        />
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary w-full"
                                            disabled={isAddingMember}
                                        >
                                            {isAddingMember ? <Loader2 className="animate-spin" size={20} /> : 'Ajouter'}
                                        </button>
                                    </form>
                                    <p className="text-[10px] text-slate-500 mt-2">
                                        L'utilisateur doit déjà avoir un compte KapTontine.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Members List */}
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-purple-500" size={40} />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {members.map((member) => (
                                <div key={member.id} className="glass-card group hover:border-purple-500/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full border-2 border-white/10 overflow-hidden shrink-0">
                                            {member.profiles?.avatar ? (
                                                <img src={member.profiles.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (() => {
                                                const animal = getSavannaAnimal(member.profiles?.email || '');
                                                return (
                                                    <div 
                                                        className={`w-full h-full bg-gradient-to-tr ${animal.color} flex items-center justify-center text-3xl shadow-inner`} 
                                                        title={animal.label}
                                                    >
                                                        {animal.emoji}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--text-color)] truncate">{member.profiles?.nom}</h3>
                                            
                                            {editingMemberId === member.id ? (
                                                <div className="mt-2 space-y-2">
                                                    <input 
                                                        value={editPoste} 
                                                        onChange={(e) => setEditPoste(e.target.value)}
                                                        className="w-full p-1 bg-slate-800 border border-purple-500/50 rounded text-xs text-white"
                                                    />
                                                    <select 
                                                        value={editRole} 
                                                        onChange={(e) => setEditRole(e.target.value)}
                                                        className="w-full p-1 bg-slate-800 border border-purple-500/50 rounded text-xs text-white"
                                                    >
                                                        <option value="membre">Membre</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleUpdateMember(member.id)} className="p-1 text-green-400"><Check size={14} /></button>
                                                        <button onClick={() => setEditingMemberId(null)} className="p-1 text-red-400"><X size={14} /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-xs text-cyan-300 uppercase tracking-widest font-bold mt-1">{member.poste}</p>
                                                    <p className="text-[10px] text-slate-500 italic mt-0.5">{member.role}</p>
                                                </>
                                            )}
                                        </div>
                                        
                                        {isAdmin && editingMemberId !== member.id && (
                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => {
                                                        setEditingMemberId(member.id);
                                                        setEditPoste(member.poste);
                                                        setEditRole(member.role);
                                                    }}
                                                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleRemoveMember(member.id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card text-center py-20">
                    <p className="text-slate-400">L'historique des cycles précédents sera disponible bientôt.</p>
                </div>
            )}

            {/* Modal Upgrade Premium */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-md border border-purple-500/30 text-center p-8">
                        <div className="w-16 h-16 bg-purple-900/30 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="text-purple-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-color)] mb-2">Limite de membres atteinte</h2>
                        <p className="text-sm text-[var(--text-muted)] mb-6">
                            Votre réunion gratuite est limitée à 5 membres. Pour ajouter de nouveaux membres et débloquer toutes les fonctionnalités illimitées, passez au plan Premium.
                        </p>
                        
                        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-6 flex justify-between items-center text-left">
                            <div>
                                <span className="block text-sm font-bold text-[var(--text-color)]">Formule Premium</span>
                                <span className="text-xs text-[var(--text-muted)]">Membres illimités (Paiement unique)</span>
                            </div>
                            <span className="text-xl font-bold text-[var(--text-color)]">10,00 €</span>
                        </div>

                        <div className="flex gap-3 justify-end mt-8">
                            <button 
                                onClick={() => setShowUpgradeModal(false)}
                                className="px-4 py-2 text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors cursor-pointer"
                                disabled={isUpgrading}
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleUpgrade}
                                className="btn btn-primary shadow-lg flex items-center gap-2 cursor-pointer"
                                disabled={isUpgrading}
                            >
                                {isUpgrading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Mise à niveau...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard size={16} />
                                        Payer 10€
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Inviter Utilisateur Externe */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-md border border-purple-500/30 text-center p-8">
                        <div className="w-16 h-16 bg-purple-900/30 border border-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserPlus className="text-purple-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-color)] mb-2">Utilisateur non trouvé</h2>
                        <p className="text-sm text-[var(--text-muted)] mb-6">
                            L'adresse <strong className="text-white">{inviteEmail}</strong> n'est pas encore enregistrée sur KapTontine. 
                            Souhaitez-vous lui envoyer une invitation pour s'inscrire et rejoindre votre réunion ?
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => {
                                    const subject = encodeURIComponent(`Invitation à rejoindre la réunion "${reunion?.nom}" sur KapTontine`);
                                    const body = encodeURIComponent(`Bonjour,\n\nJe t'invite à rejoindre notre réunion "${reunion?.nom}" sur KapTontine.\n\nInscris-toi sur KapTontine via ce lien pour pouvoir y participer :\n${window.location.origin}${import.meta.env.BASE_URL}login\n\nÀ bientôt !`);
                                    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`);
                                    setShowInviteModal(false);
                                }}
                                className="btn btn-primary shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full text-white font-bold"
                            >
                                ✉️ Envoyer un e-mail d'invitation
                            </button>
                            
                            <button 
                                onClick={() => {
                                    const text = encodeURIComponent(`Bonjour, je t'invite à rejoindre notre réunion "${reunion?.nom}" sur KapTontine. Inscris-toi via ce lien :\n${window.location.origin}${import.meta.env.BASE_URL}login`);
                                    window.open(`https://api.whatsapp.com/send?text=${text}`);
                                    setShowInviteModal(false);
                                }}
                                className="btn btn-secondary shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full text-slate-900 font-bold"
                            >
                                💬 Partager sur WhatsApp
                            </button>
                            
                            <button 
                                onClick={() => setShowInviteModal(false)}
                                className="mt-2 px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors cursor-pointer"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
