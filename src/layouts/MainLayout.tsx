import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, HeartHandshake, FileText, Menu, X, LogOut, ArrowLeft, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReunion } from '../context/ReunionContext';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';

interface MainLayoutProps {
    children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const { profile, logout } = useAuth();
    const { reunion, userRole, userPoste } = useReunion();
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const navItems = [
        { path: '', label: 'Dashboard', icon: LayoutDashboard },
        { path: 'organisation', label: 'Organisation', icon: Users },
        { path: 'finance', label: 'Finances', icon: Wallet },
        { path: 'social', label: 'Secours', icon: HeartHandshake },
        { path: 'documents', label: 'Documents', icon: FileText },
    ];

    const canEdit = userRole === 'admin';

    return (
        <div className="min-h-screen flex flex-col">
            {/* Top Navigation Bar */}
            <header className="glass-panel border-b border-white/10 fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 md:px-8">
                {/* Left Side: Back button + Reunion info */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="text-slate-400 hover:text-white flex items-center gap-1 text-xs transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={14} /> <span className="hidden sm:inline">Retour</span>
                    </button>
                    <div className="h-6 w-[1px] bg-white/10 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="Logo" className="w-8 h-8 object-contain shrink-0" />
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-white text-sm md:text-base truncate max-w-[120px] sm:max-w-[200px]">
                                {reunion?.nom || 'KapTontine'}
                            </span>
                            <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider -mt-0.5">
                                {userPoste || 'Membre'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Center Side: Navigation links (Desktop) */}
                <nav className="hidden md:flex items-center gap-1 lg:gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === ''}
                            className={({ isActive }) => `
                                flex items-center gap-2 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200
                                ${isActive ? 'bg-purple-600/80 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] border border-purple-500/50' : 'hover:bg-white/5 text-slate-300'}
                            `}
                        >
                            <item.icon size={15} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Right Side: Theme + Admin tools + Profile + Logout */}
                <div className="flex items-center gap-2 md:gap-3">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 hover:text-white cursor-pointer transition-all"
                        title={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                    >
                        {theme === 'dark' ? <Sun size={15} className="text-yellow-400" /> : <Moon size={15} className="text-blue-400" />}
                    </button>

                    {/* Admin section shortcut */}
                    {canEdit && (
                        <NavLink
                            to="organisation"
                            className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-purple-300 hover:bg-white/5 rounded-lg transition-colors border border-purple-500/20 bg-purple-500/10"
                        >
                            <Settings size={13} />
                            Gérer
                        </NavLink>
                    )}

                    {/* Profile avatar */}
                    <button 
                        onClick={() => navigate('/profil')}
                        className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Mon Profil"
                    >
                        {profile?.avatar ? (
                            <img src={profile.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20 object-cover shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-xs font-bold border border-white/20 shadow-inner text-white shrink-0">
                                {profile?.nom?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors cursor-pointer hidden sm:block"
                        title="Déconnexion"
                    >
                        <LogOut size={16} />
                    </button>

                    {/* Mobile Menu button */}
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                        className="md:hidden p-2 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white cursor-pointer ml-1"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </header>

            {/* Mobile Navigation Drawer */}
            <aside className={`
                fixed inset-y-0 right-0 z-40 w-64 glass-panel text-white border-l border-white/10 transform transition-transform duration-300 ease-in-out font-medium pt-16
                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                md:hidden flex flex-col
            `}>
                <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
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
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                    
                    {/* Admin management in mobile drawer if not shown elsewhere */}
                    {canEdit && (
                        <NavLink
                            to="organisation"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-purple-300 hover:bg-white/5 border border-purple-500/20 bg-purple-500/10 transition-colors"
                        >
                            <Settings size={18} />
                            Gérer la réunion
                        </NavLink>
                    )}
                </nav>

                <div className="p-4 border-t border-white/10 bg-slate-900/30">
                    <button
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors cursor-pointer"
                    >
                        <LogOut size={18} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 p-4 md:p-8 mt-16 overflow-auto">
                <div className="container mx-auto max-w-5xl">
                    {children}
                </div>
            </main>

            {/* Overlay for mobile menu drawer */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
