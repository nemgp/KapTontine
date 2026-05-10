import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ChangePassword() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { changePassword, user } = useAuth();
    const navigate = useNavigate();

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if (!/\d/.test(password)) {
            return 'Le mot de passe doit contenir au moins 1 chiffre';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        const validationError = validatePassword(newPassword);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);

        try {
            await changePassword(oldPassword, newPassword);
            setSuccess(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du changement de mot de passe');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md border border-white/20">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <Lock className="text-purple-400" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Changer mon mot de passe</h1>
                    {user?.mustChangePassword && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
                            <p className="text-sm text-yellow-200">
                                ⚠️ Vous devez changer votre mot de passe par défaut pour continuer
                            </p>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                        <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm text-green-200 font-semibold">Mot de passe changé avec succès !</p>
                            <p className="text-xs text-green-300 mt-1">Redirection en cours...</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Ancien mot de passe
                        </label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-600"
                            placeholder="••••••••"
                            required
                            disabled={isLoading || success}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-600"
                            placeholder="••••••••"
                            required
                            disabled={isLoading || success}
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Minimum 8 caractères, au moins 1 chiffre
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Confirmer le nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white placeholder-slate-600"
                            placeholder="••••••••"
                            required
                            disabled={isLoading || success}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2"
                        disabled={isLoading || success}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Changement en cours...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 size={18} />
                                Mot de passe changé
                            </>
                        ) : (
                            'Changer le mot de passe'
                        )}
                    </button>

                    {!user?.mustChangePassword && (
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn bg-white/5 text-white hover:bg-white/10 w-full"
                            disabled={isLoading || success}
                        >
                            Annuler
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
