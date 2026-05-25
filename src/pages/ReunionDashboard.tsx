import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Banknote, Video, Loader2, TrendingUp } from 'lucide-react';
import { useReunion } from '../context/ReunionContext';
import { supabase } from '../lib/supabase';

// Utilitaires Dates
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
    const { reunion } = useReunion();
    const [members, setMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const nextMeeting = getNextMeetingDate();
    const nextMeetingStr = nextMeeting.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

    useEffect(() => {
        if (reunion?.id) {
            fetchMembers();
        }
    }, [reunion?.id]);

    const [totalTontine, setTotalTontine] = useState(0);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('membres_reunion')
                .select('*, profiles(nom, avatar)')
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

    // Génération du planning dynamique basé sur les membres réels
    const START_MONTH = 1; // Février
    const START_YEAR = 2026;
    
    const schedule = members.map((m, index) => {
        const offsetMonths = index * 3;
        const startDate = new Date(START_YEAR, START_MONTH + offsetMonths, 1);
        const endDate = new Date(START_YEAR, START_MONTH + offsetMonths + 2, 1);
        
        const currentAbsoluteMonth = nextMeeting.getFullYear() * 12 + nextMeeting.getMonth();
        const startAbsoluteMonth = startDate.getFullYear() * 12 + startDate.getMonth();
        const endAbsoluteMonth = endDate.getFullYear() * 12 + endDate.getMonth();

        let status = 'future';
        let amount = 0;

        if (currentAbsoluteMonth > endAbsoluteMonth) {
            status = 'past';
            amount = 7000;
        } else if (currentAbsoluteMonth >= startAbsoluteMonth && currentAbsoluteMonth <= endAbsoluteMonth) {
            status = 'current';
            const monthIndexInBlock = currentAbsoluteMonth - startAbsoluteMonth;
            amount = Math.floor((7000 / 3) * (monthIndexInBlock + 1));
            if (monthIndexInBlock === 2) amount = 7000;
        }

        return {
            name: m.profiles?.nom,
            avatar: m.profiles?.avatar,
            label: `${startDate.toLocaleDateString('fr-FR', { month: 'short' })} - ${endDate.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}`.toUpperCase(),
            status,
            amount: amount.toLocaleString('fr-FR')
        };
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-purple-500" size={40} />
            </div>
        );
    }

    return (
        <div className="pb-10">
            <header className="mb-8">
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Tableau de Bord</h1>
                <p className="text-slate-400 mt-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Session Active : {reunion?.nom}
                </p>
            </header>

            {/* Indicateurs Clés - Style Valorant */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="glass-card bg-gradient-to-br from-white/5 to-transparent border-l-4 border-l-[var(--valorant-cyan)]">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Prochaine Réunion</h2>
                    <p className="text-3xl font-black text-white uppercase italic">{nextMeetingStr}</p>
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-accent-cyan flex items-center gap-1 font-bold"><Clock size={14} /> 14:00</span>
                        <a href="#" className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 uppercase font-bold tracking-widest transition-colors">
                            <Video size={14} /> Lien Meet
                        </a>
                    </div>
                </div>

                <div className="glass-card border-l-4 border-l-[var(--valorant-red)]">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Cagnotte Réunion</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white italic">{totalTontine} €</span>
                        <span className="text-[10px] text-slate-500 font-bold">Collectés</span>
                    </div>
                    <div className="mt-4">
                        <div className="progress-container">
                            <div className="progress-bar w-[100%]"></div>
                        </div>
                    </div>
                </div>

                <div className="glass-card border-l-4 border-l-purple-500">
                    <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Membres Actifs</h2>
                    <p className="text-3xl font-black text-white italic">{members.length}</p>
                    <div className="mt-4 flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {members.slice(0, 5).map((m, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-[var(--valorant-dark)] bg-slate-800 overflow-hidden">
                                    {m.profiles?.avatar ? <img src={m.profiles.avatar} /> : <div className="w-full h-full flex items-center justify-center text-[8px] font-bold">{m.profiles?.nom?.charAt(0)}</div>}
                                </div>
                            ))}
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
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Cycle 6 (2026-2028)</div>
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
                                        <div className="w-full h-full rounded-full overflow-hidden bg-slate-900 flex items-center justify-center">
                                            {item.avatar ? (
                                                <img src={item.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-slate-600">{item.name?.charAt(0)}</span>
                                            )}
                                        </div>
                                    </div>
                                    {item.status === 'current' && (
                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--valorant-dark)]"></span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Bénéficiaire</p>
                                    <p className="text-lg font-black text-white uppercase italic group-hover:text-accent-red transition-colors">{item.name}</p>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg flex items-center justify-between border ${item.status === 'current' ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex items-center gap-2">
                                    <Banknote size={16} className={item.status === 'past' ? 'text-green-400' : 'text-slate-500'} />
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Cagnotte</span>
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
        </div>
    );
}
