import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PaymentCancel() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0F111A] to-black">
            <div className="glass-card max-w-md w-full text-center p-8 border-t-4 border-t-red-500 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="text-red-500" size={40} />
                </div>
                
                <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Paiement Annulé</h1>
                <p className="text-slate-400 mb-8">
                    La création de votre réunion a été annulée. Vous n'avez pas été débité. Vous pouvez réessayer à tout moment.
                </p>
                
                <button 
                    onClick={() => navigate('/')}
                    className="btn border border-white/20 hover:bg-white/5 text-white w-full flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={18} />
                    Retourner au Dashboard
                </button>
            </div>
        </div>
    );
}
