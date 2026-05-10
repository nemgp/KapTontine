import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, Wallet, TrendingUp, AlertCircle, PiggyBank, Plus, Edit2, Trash2, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReunion } from '../context/ReunionContext';
import { supabase } from '../lib/supabase';

interface Loan {
    id: string;
    member_name: string;
    amount: number;
    date: string;
    status: string;
    notes: string;
}

interface Saving {
    id: string;
    member_name: string;
    amount: number;
    date: string;
    type: string;
    notes: string;
}

export default function Finance() {
    const { user, userRole } = useAuth();
    const { reunion } = useReunion();
    const [activeTab, setActiveTab] = useState<'cotisations' | 'prets' | 'sanctions'>('cotisations');

    const [loans, setLoans] = useState<Loan[]>([]);
    const [savings, setSavings] = useState<Saving[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Form States
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [showSavingModal, setShowSavingModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [editingSaving, setEditingSaving] = useState<Saving | null>(null);

    // Calculators
    const [loanAmount, setLoanAmount] = useState(100);
    const [loanType, setLoanType] = useState('type1');
    const [lateMeetings, setLateMeetings] = useState(0);
    const [absences, setAbsences] = useState(0);
    const [projectDelays, setProjectDelays] = useState(0);

    const isAdmin = userRole === 'admin' || true; // For now

    useEffect(() => {
        if (reunion?.id) {
            fetchData();
        }
    }, [reunion?.id]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [loansRes, savingsRes, membersRes] = await Promise.all([
                supabase.from('loans').select('*').eq('id_reunion', reunion?.id),
                supabase.from('savings').select('*').eq('id_reunion', reunion?.id),
                supabase.from('membres_reunion').select('*, profiles(nom)').eq('id_reunion', reunion?.id)
            ]);

            if (loansRes.data) setLoans(loansRes.data);
            if (savingsRes.data) setSavings(savingsRes.data);
            if (membersRes.data) setMembers(membersRes.data);
        } catch (err) {
            console.error("Error fetching finance data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveLoan = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            member_name: formData.get('member_name') as string,
            amount: Number(formData.get('amount')),
            date: formData.get('date') as string,
            status: formData.get('status') as string,
            notes: formData.get('notes') as string,
            id_reunion: reunion?.id,
            id_auteur: user?.id
        };

        try {
            if (editingLoan) {
                await supabase.from('loans').update(data).eq('id', editingLoan.id);
            } else {
                await supabase.from('loans').insert(data);
            }
            setShowLoanModal(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleSaveSaving = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            member_name: formData.get('member_name') as string,
            amount: Number(formData.get('amount')),
            date: formData.get('date') as string,
            type: formData.get('type') as string,
            notes: formData.get('notes') as string,
            id_reunion: reunion?.id,
            id_auteur: user?.id
        };

        try {
            if (editingSaving) {
                await supabase.from('savings').update(data).eq('id', editingSaving.id);
            } else {
                await supabase.from('savings').insert(data);
            }
            setShowSavingModal(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const deleteLoan = async (id: string) => {
        if (!confirm("Supprimer ce prêt ?")) return;
        await supabase.from('loans').delete().eq('id', id);
        fetchData();
    };

    const deleteSaving = async (id: string) => {
        if (!confirm("Supprimer cette épargne ?")) return;
        await supabase.from('savings').delete().eq('id', id);
        fetchData();
    };

    const savingsEvolution = useMemo(() => {
        // Simple logic for chart data
        const sorted = [...savings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let cumulative = 0;
        return sorted.map(s => {
            cumulative += s.type === 'depot' ? Number(s.amount) : -Number(s.amount);
            return { name: new Date(s.date).toLocaleDateString('fr-FR', { month: 'short' }), montant: cumulative };
        });
    }, [savings]);

    const totalSanctions = (lateMeetings * 2) + (absences * 10) + (projectDelays * 15);

    return (
        <div className="pb-10">
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-8">Finances</h1>

            {/* Nav Tabs */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mb-8 w-fit">
                <button onClick={() => setActiveTab('cotisations')} className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'cotisations' ? 'bg-[var(--valorant-red)] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    Épargne
                </button>
                <button onClick={() => setActiveTab('prets')} className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'prets' ? 'bg-[var(--valorant-red)] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    Prêts
                </button>
                <button onClick={() => setActiveTab('sanctions')} className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'sanctions' ? 'bg-[var(--valorant-red)] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                    Sanctions
                </button>
            </div>

            {activeTab === 'cotisations' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white uppercase italic">Journal des Épargnes</h2>
                                <button onClick={() => { setEditingSaving(null); setShowSavingModal(true); }} className="btn-primary btn-sm rounded-lg p-2"><Plus size={20} /></button>
                            </div>
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {savings.map(s => (
                                    <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group hover:border-purple-500/30 transition-all">
                                        <div>
                                            <p className="text-sm font-bold text-white">{s.member_name}</p>
                                            <p className="text-[10px] text-slate-500">{new Date(s.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`font-black ${s.type === 'depot' ? 'text-green-400' : 'text-red-400'}`}>
                                                {s.type === 'depot' ? '+' : '-'}{s.amount} €
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setEditingSaving(s); setShowSavingModal(true); }} className="text-blue-400 p-1"><Edit2 size={14} /></button>
                                                <button onClick={() => deleteSaving(s.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card">
                            <h2 className="text-xl font-bold text-white uppercase italic mb-6">Évolution Épargne</h2>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={savingsEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                                        <YAxis stroke="#64748b" fontSize={10} />
                                        <Tooltip contentStyle={{backgroundColor: '#0F111A', border: '1px solid #ffffff10', borderRadius: '8px'}} />
                                        <Line type="monotone" dataKey="montant" stroke="var(--valorant-cyan)" strokeWidth={3} dot={{fill: 'var(--valorant-cyan)', r: 4}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'prets' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass-card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white uppercase italic">Prêts en Cours</h2>
                            <button onClick={() => { setEditingLoan(null); setShowLoanModal(true); }} className="btn-primary btn-sm rounded-lg p-2"><Plus size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            {loans.map(l => (
                                <div key={l.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
                                    <div>
                                        <p className="text-sm font-bold text-white">{l.member_name}</p>
                                        <p className="text-[10px] text-slate-500">Échéance : {new Date(l.date).toLocaleDateString()}</p>
                                        <span className={`text-[8px] font-bold px-1 rounded ${l.status === 'en_cours' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'}`}>
                                            {l.status === 'en_cours' ? 'EN COURS' : 'REMBOURSÉ'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-black text-xl text-white">{l.amount} €</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => { setEditingLoan(l); setShowLoanModal(true); }} className="text-blue-400 p-1"><Edit2 size={14} /></button>
                                            <button onClick={() => deleteLoan(l.id)} className="text-red-400 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card">
                        <h2 className="text-xl font-bold text-white uppercase italic mb-6">Simulateur</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Montant (€)</label>
                                <input type="number" value={loanAmount} onChange={e => setLoanAmount(Number(e.target.value))} className="w-full p-3 bg-slate-900/50 border border-white/10 rounded-xl text-white" />
                            </div>
                            <div className="p-6 bg-[var(--valorant-red)]/10 border border-[var(--valorant-red)]/30 rounded-2xl text-center">
                                <p className="text-xs text-[var(--valorant-red)] font-bold uppercase tracking-widest mb-2">Intérêts Estimés (3 mois)</p>
                                <p className="text-5xl font-black text-white italic">{(loanAmount * 0.02 * 3).toFixed(2)} €</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sanctions' && (
                 <div className="glass-card max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-white uppercase italic mb-8">Calculateur Sanctions</h2>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-bold">Retard Réunion (2€)</span>
                            <input type="number" value={lateMeetings} onChange={e => setLateMeetings(Number(e.target.value))} className="w-16 p-2 bg-slate-900 border border-white/10 rounded text-center text-white" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-bold">Absence (10€)</span>
                            <input type="number" value={absences} onChange={e => setAbsences(Number(e.target.value))} className="w-16 p-2 bg-slate-900 border border-white/10 rounded text-center text-white" />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-bold">Retard Projet (15€)</span>
                            <input type="number" value={projectDelays} onChange={e => setProjectDelays(Number(e.target.value))} className="w-16 p-2 bg-slate-900 border border-white/10 rounded text-center text-white" />
                        </div>
                        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-xl font-black text-white italic uppercase">Total</span>
                            <span className="text-4xl font-black text-[var(--valorant-red)] italic">{totalSanctions} €</span>
                        </div>
                    </div>
                 </div>
            )}

            {/* Modals simplified */}
            {showLoanModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveLoan} className="glass-card w-full max-w-md border-[var(--valorant-red)]/30">
                        <h3 className="text-xl font-black text-white uppercase italic mb-6">{editingLoan ? 'Modifier Prêt' : 'Nouveau Prêt'}</h3>
                        <div className="space-y-4">
                            <select name="member_name" defaultValue={editingLoan?.member_name} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white" required>
                                <option value="">Choisir un membre</option>
                                {members.map(m => <option key={m.id} value={m.profiles.nom}>{m.profiles.nom}</option>)}
                            </select>
                            <input name="amount" type="number" placeholder="Montant (€)" defaultValue={editingLoan?.amount} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white" required />
                            <input name="date" type="date" placeholder="Date d'échéance" defaultValue={editingLoan?.date} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white" required />
                            <select name="status" defaultValue={editingLoan?.status || 'en_cours'} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white">
                                <option value="en_cours">En cours</option>
                                <option value="rembourse">Remboursé</option>
                            </select>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setShowLoanModal(false)} className="flex-1 text-slate-400 font-bold uppercase text-xs">Annuler</button>
                            <button type="submit" className="btn-primary flex-1">Enregistrer</button>
                        </div>
                    </form>
                </div>
            )}

            {showSavingModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveSaving} className="glass-card w-full max-w-md border-[var(--valorant-cyan)]/30">
                        <h3 className="text-xl font-black text-white uppercase italic mb-6">{editingSaving ? 'Modifier Épargne' : 'Nouvelle Épargne'}</h3>
                        <div className="space-y-4">
                            <select name="member_name" defaultValue={editingSaving?.member_name} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white" required>
                                <option value="">Choisir un membre</option>
                                {members.map(m => <option key={m.id} value={m.profiles.nom}>{m.profiles.nom}</option>)}
                            </select>
                            <input name="amount" type="number" placeholder="Montant (€)" defaultValue={editingSaving?.amount} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white" required />
                            <input name="date" type="date" placeholder="Date" defaultValue={editingSaving?.date} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white" required />
                            <select name="type" defaultValue={editingSaving?.type || 'depot'} className="w-full p-3 bg-slate-900 rounded-xl border border-white/10 text-white">
                                <option value="depot">Dépôt</option>
                                <option value="retrait">Retrait</option>
                            </select>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <button type="button" onClick={() => setShowSavingModal(false)} className="flex-1 text-slate-400 font-bold uppercase text-xs">Annuler</button>
                            <button type="submit" className="btn-secondary flex-1">Enregistrer</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
