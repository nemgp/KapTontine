import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

interface Reunion {
    id: string;
    nom: string;
    description: string;
    is_premium: boolean;
    meet_link?: string;
    date_prochaine_reunion?: string;
    heure_prochaine_reunion?: string;
    montant_cotisation?: number;
}

interface ReunionContextType {
    reunion: Reunion | null;
    userRole: string | null;
    userPoste: string | null;
    isLoading: boolean;
    refreshReunion: () => Promise<void>;
}

const ReunionContext = createContext<ReunionContextType | undefined>(undefined);

export function ReunionProvider({ children }: { children: ReactNode }) {
    const { reunionId } = useParams<{ reunionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [reunion, setReunion] = useState<Reunion | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userPoste, setUserPoste] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchReunionDetails = async () => {
        if (!user || !reunionId) return;
        try {
            const { data, error } = await supabase
                .from('membres_reunion')
                .select(`
                    reunions ( id, nom, description, is_premium, meet_link, date_prochaine_reunion, heure_prochaine_reunion, montant_cotisation ),
                    role,
                    poste
                `)
                .eq('id_reunion', reunionId)
                .eq('id_profile', user.id)
                .single();

            if (error || !data) {
                throw new Error("Reunion not found or unauthorized");
            }

            setReunion(data.reunions as unknown as Reunion);
            setUserRole(data.role);
            setUserPoste(data.poste);
        } catch (err) {
            console.error("Error fetching reunion:", err);
            navigate('/'); // Redirect to global dashboard if unauthorized
        }
    };

    useEffect(() => {
        if (!user || !reunionId) return;

        const initialFetch = async () => {
            setIsLoading(true);
            await fetchReunionDetails();
            setIsLoading(false);
        };

        initialFetch();
    }, [reunionId, user, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-500" size={40} />
            </div>
        );
    }

    return (
        <ReunionContext.Provider value={{ reunion, userRole, userPoste, isLoading, refreshReunion: fetchReunionDetails }}>
            {children}
        </ReunionContext.Provider>
    );
}

export function useReunion() {
    const context = useContext(ReunionContext);
    if (context === undefined) {
        throw new Error('useReunion must be used within a ReunionProvider');
    }
    return context;
}
