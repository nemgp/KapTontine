import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0F111A] to-black">
            <div className="glass-card max-w-md w-full text-center p-8 border-t-4 border-t-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-500" size={40} />
                </div>
                
                <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Paiement Validé</h1>
                <p className="text-slate-400 mb-8">
                    Votre paiement a été traité avec succès ! La création de votre réunion KapTontine est en cours en arrière-plan. Elle apparaîtra sur votre tableau de bord d'ici quelques instants.
                </p>
                
                <button 
                    onClick={() => navigate('/')}
                    className="btn bg-white text-black hover:bg-slate-200 w-full flex items-center justify-center gap-2"
                >
                    Retourner au Dashboard
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
