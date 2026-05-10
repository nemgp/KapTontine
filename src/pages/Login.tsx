import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw new Error(signUpError.message);
                
                await login(email, password);
            } else {
                await login(email, password);
            }
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'authentification.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#0F111A]">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--valorant-red)] opacity-[0.03] blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--valorant-cyan)] opacity-[0.03] blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Decorative border elements */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-[var(--valorant-red)]"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-[var(--valorant-cyan)]"></div>

                <div className="glass-card p-10 border border-white/5 shadow-2xl relative z-10">
                    <div className="text-center mb-10">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-[var(--valorant-red)] blur-2xl opacity-20 animate-pulse"></div>
                            <img src={logo} alt="KapTontine" className="w-20 h-20 mx-auto object-contain relative z-10" />
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">KapTontine</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Entraide • Partage • Évolution</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-xs text-red-200">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identifiant Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-[var(--valorant-red)] outline-none text-white transition-all placeholder-slate-800"
                                placeholder="nom@exemple.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-[var(--valorant-cyan)] outline-none text-white transition-all placeholder-slate-800"
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className={`btn w-full flex items-center justify-center gap-3 py-4 ${isSignUp ? 'btn-secondary' : 'btn-primary'}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <span className="font-black italic text-sm">{isSignUp ? 'REJOINDRE LA PLATEFORME' : 'ACCÉDER AU PORTAIL'}</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                        
                        <div className="pt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all"
                                disabled={isLoading}
                            >
                                {isSignUp ? 'Déjà membre ? Se connecter' : 'Nouveau ? Créer un compte'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
