import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2, Save, User, Image as ImageIcon, ArrowLeft } from 'lucide-react';

export default function Profile() {
    const { user, profile, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [nom, setNom] = useState(profile?.nom || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            let newAvatarUrl = avatarUrl;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('action-images')
                    .upload(filePath, avatarFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('action-images')
                    .getPublicUrl(filePath);
                
                newAvatarUrl = publicUrl;
                setAvatarUrl(publicUrl);
            }

            const { error } = await supabase
                .from('profiles')
                .update({ nom, avatar: newAvatarUrl })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();

            setMessage({ type: 'success', text: 'Profil mis à jour avec succès !' });
            setAvatarFile(null);

        } catch (error: any) {
            console.error("Erreur de mise à jour:", error);
            setMessage({ type: 'error', text: "Erreur lors de la mise à jour : " + error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8" style={{background: 'var(--bg-color)'}}>
            <div className="container mx-auto max-w-5xl pb-10">
                <header className="mb-8">
                    <button 
                        onClick={() => navigate(-1)}
                        className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors mb-6"
                    >
                        <ArrowLeft size={16} /> Retour
                    </button>
                    <h1 className="text-3xl font-bold text-[var(--text-color)] drop-shadow-md flex items-center gap-3">
                        <User className="text-purple-500" size={32} />
                        Mon Profil
                    </h1>
                    <p className="text-[var(--text-muted)] mt-2">Gérez vos informations personnelles</p>
                </header>

            <div className="max-w-xl">
                <div className="glass-card">
                    {message.text && (
                        <div className={`p-4 rounded-xl mb-6 text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-purple-500/50 flex items-center justify-center overflow-hidden">
                                    {avatarFile ? (
                                        <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-slate-500">{nom.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-500 transition-colors border border-white/20">
                                    <ImageIcon size={14} className="text-white" />
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                                    />
                                </label>
                            </div>
                            <div>
                                <h3 className="text-[var(--text-color)] font-medium mb-1">Photo de profil</h3>
                                <p className="text-xs text-[var(--text-muted)]">JPG, PNG. Max 2MB.</p>
                            </div>
                        </div>

                        <hr className="border-white/10" />

                        {/* Name Input */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">Nom d'affichage</label>
                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-white"
                                placeholder="Votre nom"
                                required
                            />
                        </div>

                        {/* Email (Readonly) */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-color)] mb-2">Email de connexion</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full p-3 bg-black/30 border border-white/5 rounded-xl text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-2">L'email de connexion ne peut pas être modifié.</p>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button 
                                type="submit"
                                className="btn btn-primary flex items-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Enregistrer les modifications
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            </div>
        </div>
    );
}
