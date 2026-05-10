import { useState, useEffect } from 'react';
import { Shield, RefreshCw, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/googleSheetsAPI';

interface User {
    username: string;
    role: string;
    email: string;
    mustChangePassword: boolean;
    lastPasswordChange: string;
}

export default function AdminPasswordReset() {
    const { user, canEdit } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [resettingUser, setResettingUser] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        if (!user) return;

        setIsLoading(true);
        setError('');
        try {
            const response = await api.getAllUsers(user.username);
            if (response.success && response.data) {
                setUsers(response.data);
            } else {
                setError(response.error || 'Erreur lors du chargement des utilisateurs');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (targetUsername: string) => {
        if (!user) return;

        if (!window.confirm(`Êtes-vous sûr de vouloir réinitialiser le mot de passe de ${targetUsername} ?\n\nLe nouveau mot de passe sera : CEPEA2026`)) {
            return;
        }

        setResettingUser(targetUsername);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.resetPassword(user.username, targetUsername);
            if (response.success) {
                setSuccessMessage(`Mot de passe réinitialisé pour ${targetUsername}. Nouveau mot de passe : CEPEA2026`);
                loadUsers(); // Reload to update mustChangePassword status
            } else {
                setError(response.error || 'Erreur lors de la réinitialisation');
            }
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la réinitialisation');
        } finally {
            setResettingUser(null);
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'president':
                return <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 font-semibold">👑 PRÉSIDENT</span>;
            case 'secretary':
                return <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30 font-semibold">📝 SECRÉTAIRE</span>;
            case 'treasurer':
                return <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30 font-semibold">💰 TRÉSORIER</span>;
            default:
                return <span className="text-xs px-2 py-1 bg-slate-500/20 text-slate-300 rounded border border-slate-500/30">Membre</span>;
        }
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return 'Jamais';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Jamais';
        }
    };

    // Check if user has admin rights
    if (!canEdit()) {
        return (
            <div className="glass-card text-center">
                <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
                <h2 className="text-xl font-bold text-white mb-2">Accès refusé</h2>
                <p className="text-slate-400">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                <p className="text-sm text-slate-500 mt-2">Seuls les membres du bureau peuvent réinitialiser les mots de passe.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Shield className="text-purple-400" size={28} />
                    Réinitialisation des Mots de Passe
                </h1>
                <p className="text-slate-400 mt-2">Gérez les mots de passe des membres de la tontine</p>
            </div>

            {/* Info Card */}
            <div className="glass-card mb-6 bg-blue-500/10 border-blue-500/30">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                    <div className="text-sm text-blue-200">
                        <p className="font-semibold mb-1">Informations importantes :</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-300/80">
                            <li>Le mot de passe par défaut est : <code className="px-2 py-0.5 bg-blue-900/30 rounded font-mono">CEPEA2026</code></li>
                            <li>L'utilisateur devra changer son mot de passe à la prochaine connexion</li>
                            <li>Cette action est irréversible</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="glass-card mb-6 bg-green-500/10 border-green-500/30">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-400" size={20} />
                        <p className="text-sm text-green-200">{successMessage}</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="glass-card mb-6 bg-red-500/10 border-red-500/30">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-red-400" size={20} />
                        <p className="text-sm text-red-200">{error}</p>
                    </div>
                </div>
            )}

            {/* Users List */}
            <div className="glass-card">
                <h2 className="text-lg font-bold text-white mb-4">Liste des Utilisateurs</h2>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="animate-spin text-purple-400" size={32} />
                    </div>
                ) : users.length === 0 ? (
                    <p className="text-slate-400 text-center py-12">Aucun utilisateur trouvé</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left text-xs font-medium text-slate-400 pb-3 px-3">Utilisateur</th>
                                    <th className="text-left text-xs font-medium text-slate-400 pb-3 px-3">Rôle</th>
                                    <th className="text-left text-xs font-medium text-slate-400 pb-3 px-3">Dernier changement</th>
                                    <th className="text-center text-xs font-medium text-slate-400 pb-3 px-3">Statut</th>
                                    <th className="text-center text-xs font-medium text-slate-400 pb-3 px-3">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.username} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-4 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                                                    {u.username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium text-white">{u.username}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-3">
                                            {getRoleBadge(u.role)}
                                        </td>
                                        <td className="py-4 px-3 text-sm text-slate-400">
                                            {formatDate(u.lastPasswordChange)}
                                        </td>
                                        <td className="py-4 px-3 text-center">
                                            {u.mustChangePassword ? (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded border border-orange-500/30">
                                                    <AlertCircle size={12} />
                                                    Doit changer
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded border border-green-500/30">
                                                    <CheckCircle size={12} />
                                                    OK
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-3 text-center">
                                            <button
                                                onClick={() => handleResetPassword(u.username)}
                                                disabled={resettingUser === u.username || u.username === user?.username}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={u.username === user?.username ? 'Vous ne pouvez pas réinitialiser votre propre mot de passe' : 'Réinitialiser le mot de passe'}
                                            >
                                                {resettingUser === u.username ? (
                                                    <>
                                                        <Loader2 className="animate-spin" size={14} />
                                                        Réinitialisation...
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw size={14} />
                                                        Réinitialiser
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
