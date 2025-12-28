import { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNav from './components/layout/BottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Wallets from './pages/Wallets';
import Reports from './pages/Reports';
import './App.css';

interface RouteWrapperProps {
    children: ReactNode;
}

// Protected Route wrapper
const ProtectedRoute = ({ children }: RouteWrapperProps): JSX.Element => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

// Public Route (redirect to home if already authenticated)
const PublicRoute = ({ children }: RouteWrapperProps): JSX.Element => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// Main App Layout with Bottom Navigation
const AppLayout = ({ children }: RouteWrapperProps): JSX.Element => {
    return (
        <>
            {children}
            <BottomNav />
        </>
    );
};

function App(): JSX.Element {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <Login />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <Register />
                            </PublicRoute>
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Dashboard />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/transactions"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Transactions />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/add"
                        element={
                            <ProtectedRoute>
                                <AddTransaction />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/wallets"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Wallets />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <ProtectedRoute>
                                <AppLayout>
                                    <Reports />
                                </AppLayout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
