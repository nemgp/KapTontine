import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, HeartHandshake, FileText, Menu, X, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReunion } from '../context/ReunionContext';
import { useState } from 'react';
import logo from '../assets/logo.png';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { profile, logout } = useAuth();
    const { reunion, userRole, userPoste } = useReunion();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { path: '', label: 'Dashboard Réunion', icon: LayoutDashboard },
        { path: 'organisation', label: 'Organisation', icon: Users },
        { path: 'finance', label: 'Finances', icon: Wallet },
        { path: 'social', label: 'Secours & Actions', icon: HeartHandshake },
        { path: 'documents', label: 'Documents', icon: FileText },
    ];

    const canEdit = userRole === 'admin';

    return (
        <div className="min-h-screen flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden glass-panel p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-50 h-16">
                <div className="flex items-center gap-2">
                    <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-primary truncate max-w-[150px]">{reunion?.nom || 'KapTontine'}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </header>

            {/* Sidebar (Desktop) / Mobile Menu */}
            <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-panel text-white transform transition-transform duration-300 ease-in-out font-medium
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen flex flex-col
      `}>
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <button 
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
                    >
                        <ArrowLeft size={16} /> Retour aux réunions
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-3 border-b border-white/10 text-center">
                    <img src={logo} alt="Logo" className="w-16 h-16 bg-white/10 rounded-full p-2 border border-white/20 mb-2 shadow-[0_0_15px_rgba(147,51,234,0.3)]" />
                    <div>
                        <h1 className="text-xl font-bold text-white line-clamp-2">{reunion?.nom}</h1>
                        <p className="text-[10px] text-purple-300 uppercase tracking-widest mt-1">KapTontine</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 mt-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === ''}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                ${isActive ? 'bg-purple-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-purple-500/50' : 'hover:bg-white/5 text-slate-300'}
                            `}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 bg-slate-900/30">
                    <button 
                        onClick={() => navigate('/profil')}
                        className="flex items-center gap-3 mb-4 px-2 w-full text-left hover:bg-white/5 p-2 rounded-xl transition-colors"
                    >
                        {profile?.avatar ? (
                            <img src={profile.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-lg font-bold border border-white/20 shadow-inner shrink-0">
                                {profile?.nom?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium truncate text-white">{profile?.nom || profile?.email}</p>
                            <p className="text-[10px] text-purple-300 uppercase tracking-wider">{userPoste || 'Membre'}</p>
                        </div>
                    </button>

                    {/* Admin Section */}
                    {canEdit && (
                        <div className="mb-4">
                            <NavLink
                                to="organisation"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-2 px-4 py-2 text-xs text-purple-300 hover:bg-white/5 rounded-lg transition-colors border border-purple-500/20 bg-purple-500/10"
                            >
                                <Settings size={14} />
                                Gérer la réunion
                            </NavLink>
                        </div>
                    )}

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
                    >
                        <LogOut size={16} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 mt-16 md:mt-0 overflow-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0F111A] to-black">
                <div className="container mx-auto max-w-5xl">
                    {children}
                </div>
            </main>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
