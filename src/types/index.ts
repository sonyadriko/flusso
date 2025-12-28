// User types
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
}

// Category types
export interface Category {
    id: string;
    name: string;
    icon: string;
    type: 'income' | 'expense';
    color?: string;
}

// Wallet types
export interface Wallet {
    id: string;
    name: string;
    icon: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'credit';
    balance: number;
    color?: string;
}

// Transaction types
export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    category?: Category;
    walletId: string;
    wallet?: Wallet;
    date: Date;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Form data types
export interface TransactionFormData {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    walletId: string;
    date: Date;
    note?: string;
}

export interface WalletFormData {
    name: string;
    icon: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'credit';
    balance: number;
}

// Auth context type
export interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
}

// Report types
export interface CategoryReport {
    categoryId: string;
    categoryName: string;
    categoryIcon: string;
    total: number;
    percentage: number;
    color: string;
}

export interface MonthlyReport {
    income: number;
    expense: number;
    balance: number;
    categories: CategoryReport[];
}
