import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, ArrowRight, Shield, TrendingUp, Users, Sun, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';

const features = [
    {
        id: 1,
        title: "DASHBOARD ANALYTIQUE",
        desc: "Visualisez l'évolution de vos finances avec des outils de monitoring avancés.",
        icon: <TrendingUp className="text-[var(--valorant-cyan)]" size={32} />,
        image: "mockups/finance.png"
    },
    {
        id: 2,
        title: "FLUX SOCIAL RÉACTIF",
        desc: "Ne manquez aucune opportunité grâce au fil d'actions en temps réel.",
        icon: <Shield className="text-[var(--valorant-red)]" size={32} />,
        image: "mockups/social.png"
    }
];

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [currentFeature, setCurrentFeature] = useState(0);
    const { login } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw new Error(signUpError.message);
                
                // Create the profile record in the profiles table
                if (signUpData?.user) {
                    const defaultName = email.split('@')[0];
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert({
                            id: signUpData.user.id,
                            email: email,
                            nom: defaultName,
                        });
                    // Don't throw on profile error — user is still created
                    if (profileError) {
                        console.warn('Profile creation warning:', profileError);
                    }
                }
                
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
        <div className="min-h-screen flex bg-[#0F111A] overflow-hidden font-inter">
            {/* Left Side: Feature Carousel */}
            <div className="hidden lg:flex lg:w-3/5 relative bg-black items-center justify-center p-20 overflow-hidden border-r border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--valorant-red)]/5 to-[var(--valorant-cyan)]/5"></div>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentFeature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10 w-full max-w-4xl"
                    >
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--valorant-red)] to-[var(--valorant-cyan)] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                            
                            <div className="relative bg-[#0F111A] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                <img 
                                    src={`${import.meta.env.BASE_URL}${features[currentFeature].image}`} 
                                    alt={features[currentFeature].title}
                                    className="w-full h-auto aspect-video object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                                
                                <div className="absolute bottom-0 left-0 p-12 w-full">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                            {features[currentFeature].icon}
                                        </div>
                                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                                            {features[currentFeature].title}
                                        </h2>
                                    </div>
                                    <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                                        {features[currentFeature].desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Indicators */}
                <div className="absolute bottom-10 left-20 flex gap-4">
                    {features.map((_, idx) => (
                        <div 
                            key={idx}
                            className={`h-1 transition-all duration-500 rounded-full ${
                                idx === currentFeature ? 'w-12 bg-[var(--valorant-red)]' : 'w-4 bg-white/10'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-8 relative">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-slate-300 hover:text-white cursor-pointer z-20"
                    title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                >
                    {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-blue-400" />}
                </button>

                {/* Background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-[var(--valorant-red)] opacity-[0.05] blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-[var(--valorant-cyan)] opacity-[0.05] blur-[120px]"></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="glass-card p-10 border border-white/10 shadow-2xl relative">
                        {/* Decorative corners */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[var(--valorant-red)]"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[var(--valorant-cyan)]"></div>

                        <div className="text-center mb-10">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-[var(--valorant-red)] blur-2xl opacity-30 animate-pulse"></div>
                                <img src={logo} alt="KapTontine" className="w-24 h-24 mx-auto object-contain relative z-10" />
                            </div>
                            <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">KapTontine</h1>
                            <p className="text-xs text-slate-500 uppercase tracking-[0.4em] font-black">Secure • Private • Elite</p>
                        </div>

                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 overflow-hidden"
                            >
                                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-xs text-red-200">{error}</p>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} /> Identifiant Email
                                    </label>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl focus:border-[var(--valorant-red)] outline-none text-white transition-all placeholder-slate-800"
                                    placeholder="agent@kaptontine.io"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Shield size={12} /> Code d'accès
                                    </label>
                                </div>
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
                                className={`btn w-full flex items-center justify-center gap-3 py-5 transition-all duration-300 relative group overflow-hidden ${
                                    isSignUp ? 'btn-secondary' : 'btn-primary'
                                }`}
                                disabled={isLoading}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>
                                        <span className="font-black italic text-base relative z-10">
                                            {isSignUp ? 'INITIALISER LA SESSION' : 'AUTHÉNTIFIER LE PROFIL'}
                                        </span>
                                        <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                            
                            <div className="pt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-[10px] font-black text-slate-500 hover:text-[var(--valorant-cyan)] uppercase tracking-[0.3em] transition-all"
                                    disabled={isLoading}
                                >
                                    {isSignUp ? 'ACCÈS AU TERMINAL EXISTANT' : 'CRÉER UN NOUVEL AGENT'}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
