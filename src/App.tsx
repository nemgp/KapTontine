import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReunionProvider } from './context/ReunionContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import GlobalDashboard from './pages/GlobalDashboard';
import ReunionDashboard from './pages/ReunionDashboard';
import Organization from './pages/Organization';
import Finance from './pages/Finance';
import Social from './pages/Social';
import Documents from './pages/Documents';
import Profile from './pages/Profile';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

import { ThemeProvider } from './context/ThemeContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return null;
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function ReunionLayout() {
    return (
        <ReunionProvider>
            <MainLayout>
                <Outlet />
            </MainLayout>
        </ReunionProvider>
    );
}

export default function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        
                        {/* Routes Protégées Globales */}
                        <Route path="/" element={<PrivateRoute><GlobalDashboard /></PrivateRoute>} />
                        <Route path="/profil" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
                        <Route path="/cancel" element={<PrivateRoute><PaymentCancel /></PrivateRoute>} />
                        
                        {/* Routes Protégées spécifiques à une Réunion */}
                        <Route path="/reunions/:reunionId" element={<PrivateRoute><ReunionLayout /></PrivateRoute>}>
                            <Route index element={<ReunionDashboard />} />
                            <Route path="organisation" element={<Organization />} />
                            <Route path="finance" element={<Finance />} />
                            <Route path="social" element={<Social />} />
                            <Route path="documents" element={<Documents />} />
                        </Route>
                        
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
