import { useState, useEffect } from 'react';
import { History, Users, Plus, Trash2, Edit2, Check, X, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReunion } from '../context/ReunionContext';
import { supabase } from '../lib/supabase';

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
    const { user } = useAuth();
    const { reunion, userRole } = useReunion();
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberPoste, setNewMemberPoste] = useState('Membre');
    
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
    const [editPoste, setEditPoste] = useState('');
    const [editRole, setEditRole] = useState('');

    const isAdmin = userRole === 'admin';

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

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reunion) return;
        setIsAddingMember(true);

        try {
            // Find profile by email
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', newMemberEmail)
                .single();

            if (profileError || !profileData) {
                alert("Utilisateur non trouvé. Demandez-lui de s'inscrire sur KapTontine d'abord.");
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
                <h1 className="text-3xl font-bold text-white drop-shadow-md">Organisation</h1>
                
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
                    {/* Invite Section (Admins Only) */}
                    {isAdmin && (
                        <div className="glass-card border-dashed border-2 border-white/5 hover:border-purple-500/30 transition-all">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <UserPlus size={20} className="text-purple-400" />
                                Inviter un membre
                            </h2>
                            <form onSubmit={handleAddMember} className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    placeholder="Email de l'utilisateur"
                                    className="flex-1 p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                    required
                                />
                                <input
                                    type="text"
                                    value={newMemberPoste}
                                    onChange={(e) => setNewMemberPoste(e.target.value)}
                                    placeholder="Poste (ex: Trésorier)"
                                    className="w-full md:w-48 p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                    required
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-primary px-8"
                                    disabled={isAddingMember}
                                >
                                    {isAddingMember ? <Loader2 className="animate-spin" size={20} /> : 'Ajouter'}
                                </button>
                            </form>
                            <p className="text-[10px] text-slate-500 mt-2">
                                L'utilisateur doit déjà avoir un compte KapTontine.
                            </p>
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
                                        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden shrink-0">
                                            {member.profiles?.avatar ? (
                                                <img src={member.profiles.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-xl text-slate-400">
                                                    {member.profiles?.nom?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-white truncate">{member.profiles?.nom}</h3>
                                            
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
                    <History className="mx-auto text-slate-500 mb-4" size={48} />
                    <p className="text-slate-400">L'historique des cycles précédents sera disponible bientôt.</p>
                </div>
            )}
        </div>
    );
}
