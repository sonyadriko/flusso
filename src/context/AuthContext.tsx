import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange } from '../services/auth';
import { getCategories, initializeDefaultCategories, initializeDefaultWallet } from '../services/firestore';

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            if (firebaseUser) {
                // Check if user has categories (first time setup)
                try {
                    const categories = await getCategories(firebaseUser.uid);
                    if (categories.length === 0) {
                        // Initialize default data for new user
                        await initializeDefaultCategories(firebaseUser.uid);
                        await initializeDefaultWallet(firebaseUser.uid);
                    }
                } catch (error) {
                    console.error('Error initializing user data:', error);
                    // Don't block login if initialization fails
                }
            }
            setUser(firebaseUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
