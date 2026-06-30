import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Banknote, Video, Loader2, TrendingUp } from 'lucide-react';
import { useReunion } from '../context/ReunionContext';
import { supabase } from '../lib/supabase';
import { getSavannaAnimal } from '../lib/savanna';

// Utilitaires Dates par défaut
function getFirstSunday(year: number, month: number) {
    const date = new Date(year, month, 1);
    while (date.getDay() !== 0) { 
        date.setDate(date.getDate() + 1);
    }
    return date;
}

function getNextMeetingDate() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const meetingThisMonth = getFirstSunday(currentYear, currentMonth);
    meetingThisMonth.setHours(14, 0, 0, 0);
    if (now < meetingThisMonth) {
        return meetingThisMonth;
    } else {
        const meetingNextMonth = getFirstSunday(currentYear, currentMonth + 1);
        meetingNextMonth.setHours(14, 0, 0, 0);
        return meetingNextMonth;
    }
}

export default function ReunionDashboard() {
    const { reunion, userRole, refreshReunion } = useReunion();
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalTontine, setTotalTontine] = useState(0);

    // Modal Edit states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editMeetLink, setEditMeetLink] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editTime, setEditTime] = useState('14:00');
    const [editMontant, setEditMontant] = useState(7000);
    const [isSaving, setIsSaving] = useState(false);

    const isAdmin = userRole === 'admin';

    // Date / Heure par défaut si non configurées
    const nextMeetingDefault = getNextMeetingDate();
    const nextMeetingDefaultStr = nextMeetingDefault.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

    const displayedMeetingDate = reunion?.date_prochaine_reunion || nextMeetingDefaultStr;
    const displayedMeetingTime = reunion?.heure_prochaine_reunion || '14:00';
    const displayedMeetLink = reunion?.meet_link || `https://meet.google.com/lookup/${(reunion?.nom || 'reunion').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    const displayedMontantCotisation = reunion?.montant_cotisation !== undefined ? reunion.montant_cotisation : 7000;

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
            
            await fetchFinancials();
        } catch (err) {
            console.error("Error fetching members for dashboard:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFinancials = async () => {
        try {
            const { data: savingsData, error: savingsError } = await supabase
                .from('savings')
                .select('amount, type')
                .eq('id_reunion', reunion?.id);
                
            if (savingsError) throw savingsError;
            
            let total = 0;
            if (savingsData) {
                total = savingsData.reduce((acc, curr) => {
                    return curr.type === 'depot' ? acc + Number(curr.amount) : acc - Number(curr.amount);
                }, 0);
            }
            setTotalTontine(total);
        } catch (err) {
            console.error("Error fetching financials:", err);
        }
    };

    const handleSaveParams = async () => {
        if (!reunion?.id) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('reunions')
                .update({
                    meet_link: editMeetLink || null,
                    date_prochaine_reunion: editDate || null,
                    heure_prochaine_reunion: editTime || null,
                    montant_cotisation: editMontant
                })
                .eq('id', reunion.id);

            if (error) throw error;
            
            await refreshReunion();
            setIsEditModalOpen(false);
        } catch (err: any) {
            console.error("Error updating reunion parameters:", err);
            alert("Erreur lors de la mise à jour des paramètres. Assurez-vous d'avoir exécuté le script SQL pour ajouter les colonnes meet_link, date_prochaine_reunion, heure_prochaine_reunion et montant_cotisation à la table reunions : " + (err.message || JSON.stringify(err)));
        } finally {
            setIsSaving(false);
        }
    };

    // Génération du planning dynamique basé sur les membres réels et la date
    const START_MONTH = 1; // Février
    const START_YEAR = 2026;
    
    const schedule = members.map((m, index) => {
        const offsetMonths = index * 3;
        const startDate = new Date(START_YEAR, START_MONTH + offsetMonths, 1);
        const endDate = new Date(START_YEAR, START_MONTH + offsetMonths + 2, 1);
        
        const currentAbsoluteMonth = nextMeetingDefault.getFullYear() * 12 + nextMeetingDefault.getMonth();
        const startAbsoluteMonth = startDate.getFullYear() * 12 + startDate.getMonth();
        const endAbsoluteMonth = endDate.getFullYear() * 12 + endDate.getMonth();

        let status = 'future';
        let amount = 0;

        if (currentAbsoluteMonth > endAbsoluteMonth) {
            status = 'past';
            amount = displayedMontantCotisation;
        } else if (currentAbsoluteMonth >= startAbsoluteMonth && currentAbsoluteMonth <= endAbsoluteMonth) {
            status = 'current';
            const monthIndexInBlock = currentAbsoluteMonth - startAbsoluteMonth;
            amount = Math.floor((displayedMontantCotisation / 3) * (monthIndexInBlock + 1));
            if (monthIndexInBlock === 2) amount = displayedMontantCotisation;
        }

        return {
            name: m.profiles?.nom,
            avatar: m.profiles?.avatar,
            email: m.profiles?.email || m.id_profile || '',
            label: `${startDate.toLocaleDateString('fr-FR', { month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`.toUpperCase(),
            status,
            amount: amount.toLocaleString('fr-FR')
        };
    });

    // Calcul du pourcentage dynamique de la tontine
    const targetAmount = displayedMontantCotisation * members.length;
    const collectionPercentage = targetAmount > 0 ? Math.min(100, Math.round((totalTontine / targetAmount) * 100)) : 0;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-purple-500" size={40} />
            </div>
        );
    }

    return (
        <div className="pb-10">
            <header className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Tableau de Bord</h1>
                    <p className="text-slate-400 mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Session Active : {reunion?.nom}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => {
                            setEditMeetLink(reunion?.meet_link || '');
                            setEditDate(reunion?.date_prochaine_reunion || '');
                            setEditTime(reunion?.heure_prochaine_reunion || '14:00');
                            setEditMontant(reunion?.montant_cotisation !== undefined ? reunion.montant_cotisation : 7000);
                            setIsEditModalOpen(true);
                        }}
                        className="btn btn-outline py-2 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
                    >
                        ⚙️ Paramètres Réunion
                    </button>
                )}
            </header>

            {/* Indicateurs Clés - Style Valorant */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card bg-gradient-to-br from-white/5 to-transparent border-l-4 border-l-[var(--valorant-cyan)]">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Prochaine Réunion</h2>
                    <p className="text-3xl font-black text-[var(--text-color)] uppercase italic">{displayedMeetingDate}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-accent-cyan flex items-center gap-1 font-bold"><Clock size={14} /> {displayedMeetingTime}</span>
                        <a 
                            href={displayedMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:text-[var(--valorant-cyan)] flex items-center gap-1 uppercase font-bold tracking-widest transition-colors"
                        >
                            <Video size={14} /> Lien Meet
                        </a>
                    </div>
                </div>

                <div className="glass-card border-l-4 border-l-[var(--valorant-red)]">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Montant Cotisation</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-[var(--text-color)] italic">{displayedMontantCotisation.toLocaleString('fr-FR')} €</span>
                        <span className="text-[10px] text-slate-500 font-bold">/ membre</span>
                    </div>
                    <div className="mt-4 flex flex-col gap-1">
                        <div className="progress-container">
                            <div className="progress-bar" style={{ width: `${collectionPercentage}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                            <span>Collecté : {totalTontine.toLocaleString('fr-FR')} €</span>
                            <span>Cible : {targetAmount.toLocaleString('fr-FR')} € ({collectionPercentage}%)</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card border-l-4 border-l-purple-500">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Membres Actifs</h2>
                    <p className="text-3xl font-black text-[var(--text-color)] italic">{members.length}</p>
                    <div className="mt-4 flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {members.slice(0, 5).map((m, i) => {
                                const avatar = m.profiles?.avatar;
                                const animal = getSavannaAnimal(m.profiles?.email || m.id_profile || '');
                                return (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--valorant-dark)] bg-slate-800 overflow-hidden flex items-center justify-center">
                                        {avatar ? (
                                            <img src={avatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-tr ${animal.color} flex items-center justify-center text-[10px]`} title={animal.label}>
                                                {animal.emoji}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                         </div>
                         <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">En ligne</span>
                    </div>
                </div>
            </div>

            {/* Planning de Passage */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                    <TrendingUp className="text-accent-red" size={24} />
                    Ordre de Passage
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {schedule.map((item, index) => (
                    <div 
                        key={index}
                        className={`
                            glass-card p-0 overflow-hidden group
                            ${item.status === 'current' ? 'ring-2 ring-[var(--valorant-red)] ring-offset-4 ring-offset-[var(--valorant-dark)]' : ''}
                        `}
                    >
                        {/* Card Header */}
                        <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest flex justify-between items-center ${item.status === 'current' ? 'bg-[var(--valorant-red)] text-white' : 'bg-white/5 text-slate-500'}`}>
                            <span>{item.label}</span>
                            {item.status === 'past' && <CheckCircle size={14} className="text-green-500" />}
                        </div>

                        <div className="p-5">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-full p-0.5 ${item.status === 'current' ? 'bg-[var(--valorant-red)]' : 'bg-white/10'}`}>
                                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center border border-white/5">
                                            {item.avatar ? (
                                                <img src={item.avatar} className="w-full h-full object-cover" />
                                            ) : (() => {
                                                const animal = getSavannaAnimal(item.email || '');
                                                return (
                                                    <div className={`w-full h-full bg-gradient-to-tr ${animal.color} flex items-center justify-center text-2xl`} title={animal.label}>
                                                        {animal.emoji}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    {item.status === 'current' && (
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--valorant-dark)]"></span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Bénéficiaire</p>
                                    <p className="text-lg font-black text-[var(--text-color)] uppercase italic group-hover:text-accent-red transition-colors">{item.name}</p>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg flex items-center justify-between border ${item.status === 'current' ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex items-center gap-2">
                                    <Banknote size={16} className={item.status === 'past' ? 'text-green-400' : 'text-slate-500'} />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tontine</span>
                                </div>
                                <span className={`text-sm font-black ${item.status === 'past' ? 'text-green-400' : 'text-white'}`}>
                                    {item.amount} €
                                </span>
                            </div>
                        </div>
                        
                        {/* Progress bar at bottom of card for current */}
                        {item.status === 'current' && (
                            <div className="h-1 w-full bg-white/5">
                                <div className="h-full bg-[var(--valorant-red)] shadow-[0_0_10px_var(--valorant-red)] animate-pulse" style={{width: '66%'}}></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal de Modification des Paramètres (Admins uniquement) */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-md border border-purple-500/30 p-8 text-left">
                        <h2 className="text-xl font-bold text-[var(--text-color)] mb-6 uppercase italic tracking-wider">Paramètres de la Réunion</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lien Google Meet</label>
                                <input
                                    type="url"
                                    value={editMeetLink}
                                    onChange={(e) => setEditMeetLink(e.target.value)}
                                    placeholder="https://meet.google.com/..."
                                    className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Date Prochaine Réunion</label>
                                    <input
                                        type="text"
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        placeholder="ex: Dim. 05 Juil."
                                        className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Heure</label>
                                    <input
                                        type="text"
                                        value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        placeholder="ex: 14:00"
                                        className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Montant de la Cotisation (€)</label>
                                <input
                                    type="number"
                                    value={editMontant}
                                    onChange={(e) => setEditMontant(Number(e.target.value))}
                                    placeholder="7000"
                                    className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-8">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="px-4 py-2 text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.05)] rounded-lg transition-colors cursor-pointer text-sm"
                                disabled={isSaving}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSaveParams}
                                className="btn btn-primary shadow-lg flex items-center gap-2 cursor-pointer text-sm font-bold text-white"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Enregistrement...
                                    </>
                                ) : (
                                    "Enregistrer"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
