import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthChange } from '../services/auth';
import { getCategories, initializeDefaultCategories, initializeDefaultWallet } from '../services/firestore';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

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

    const value = {
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
