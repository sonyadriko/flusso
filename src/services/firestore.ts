import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    writeBatch,
    CollectionReference,
    DocumentData,
    Unsubscribe,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, Wallet, Transaction } from '../types';

// Helper to get user's collection reference
const getUserCollection = (userId: string, collectionName: string): CollectionReference<DocumentData> => {
    return collection(db, 'users', userId, collectionName);
};

// ==================== WALLETS ====================

export interface WalletInput {
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'credit';
    icon: string;
    balance?: number;
}

export const addWallet = async (userId: string, wallet: WalletInput): Promise<string> => {
    const ref = getUserCollection(userId, 'wallets');
    const docRef = await addDoc(ref, {
        ...wallet,
        balance: wallet.balance || 0,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateWallet = async (userId: string, walletId: string, data: Partial<Wallet>): Promise<void> => {
    const ref = doc(db, 'users', userId, 'wallets', walletId);
    await updateDoc(ref, data);
};

export const deleteWallet = async (userId: string, walletId: string): Promise<void> => {
    const ref = doc(db, 'users', userId, 'wallets', walletId);
    await deleteDoc(ref);
};

export const getWallets = async (userId: string): Promise<Wallet[]> => {
    const ref = getUserCollection(userId, 'wallets');
    const q = query(ref, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
};

export const subscribeToWallets = (userId: string, callback: (wallets: Wallet[]) => void): Unsubscribe => {
    const ref = getUserCollection(userId, 'wallets');
    const q = query(ref, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const wallets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Wallet));
        callback(wallets);
    });
};

// ==================== CATEGORIES ====================

export interface CategoryInput {
    name: string;
    type: 'income' | 'expense';
    icon: string;
    color?: string;
}

export const addCategory = async (userId: string, category: CategoryInput): Promise<string> => {
    const ref = getUserCollection(userId, 'categories');
    const docRef = await addDoc(ref, {
        ...category,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateCategory = async (userId: string, categoryId: string, data: Partial<Category>): Promise<void> => {
    const ref = doc(db, 'users', userId, 'categories', categoryId);
    await updateDoc(ref, data);
};

export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
    const ref = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(ref);
};

export const getCategories = async (userId: string): Promise<Category[]> => {
    const ref = getUserCollection(userId, 'categories');
    const q = query(ref, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const subscribeToCategories = (userId: string, callback: (categories: Category[]) => void): Unsubscribe => {
    const ref = getUserCollection(userId, 'categories');
    const q = query(ref, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        callback(categories);
    });
};

// Initialize default categories for new user
export const initializeDefaultCategories = async (userId: string): Promise<void> => {
    const batch = writeBatch(db);
    const ref = getUserCollection(userId, 'categories');

    const defaultCategories: CategoryInput[] = [
        // Income categories
        { name: 'Salary', type: 'income', icon: '💰', color: '#4CAF50' },
        { name: 'Bonus', type: 'income', icon: '🎁', color: '#8BC34A' },
        { name: 'Investment', type: 'income', icon: '📈', color: '#CDDC39' },
        { name: 'Other Income', type: 'income', icon: '💵', color: '#FFC107' },
        // Expense categories
        { name: 'Food & Drinks', type: 'expense', icon: '🍔', color: '#F44336' },
        { name: 'Transportation', type: 'expense', icon: '🚗', color: '#E91E63' },
        { name: 'Shopping', type: 'expense', icon: '🛒', color: '#9C27B0' },
        { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#673AB7' },
        { name: 'Bills & Utilities', type: 'expense', icon: '💡', color: '#3F51B5' },
        { name: 'Healthcare', type: 'expense', icon: '🏥', color: '#2196F3' },
        { name: 'Education', type: 'expense', icon: '📚', color: '#00BCD4' },
        { name: 'Travel', type: 'expense', icon: '✈️', color: '#009688' },
        { name: 'Other', type: 'expense', icon: '📦', color: '#795548' },
    ];

    for (const category of defaultCategories) {
        const docRef = doc(ref);
        batch.set(docRef, { ...category, createdAt: serverTimestamp() });
    }

    await batch.commit();
};

// Initialize default wallet for new user
export const initializeDefaultWallet = async (userId: string): Promise<void> => {
    const ref = getUserCollection(userId, 'wallets');
    await addDoc(ref, {
        name: 'Cash',
        type: 'cash',
        icon: '💵',
        balance: 0,
        createdAt: serverTimestamp()
    });
};

// ==================== TRANSACTIONS ====================

export interface TransactionInput {
    type: 'income' | 'expense';
    amount: number;
    categoryId: string;
    walletId: string;
    date: Date | Timestamp;
    note?: string;
}

export interface TransactionFilters {
    startDate?: Date;
    endDate?: Date;
}

export const addTransaction = async (userId: string, transaction: TransactionInput): Promise<string> => {
    const ref = getUserCollection(userId, 'transactions');
    const docRef = await addDoc(ref, {
        ...transaction,
        createdAt: serverTimestamp()
    });

    // Update wallet balance
    const walletRef = doc(db, 'users', userId, 'wallets', transaction.walletId);
    const walletDoc = await getDoc(walletRef);
    if (walletDoc.exists()) {
        const currentBalance = walletDoc.data().balance || 0;
        const newBalance = transaction.type === 'income'
            ? currentBalance + transaction.amount
            : currentBalance - transaction.amount;
        await updateDoc(walletRef, { balance: newBalance });
    }

    return docRef.id;
};

export const updateTransaction = async (
    userId: string,
    transactionId: string,
    data: Partial<TransactionInput>,
    oldTransaction?: Transaction
): Promise<void> => {
    const ref = doc(db, 'users', userId, 'transactions', transactionId);
    await updateDoc(ref, data);

    // Recalculate wallet balance if amount or type changed
    if (oldTransaction && (data.amount !== undefined || data.type !== undefined || data.walletId !== undefined)) {
        // Revert old transaction
        const oldWalletRef = doc(db, 'users', userId, 'wallets', oldTransaction.walletId);
        const oldWalletDoc = await getDoc(oldWalletRef);
        if (oldWalletDoc.exists()) {
            const currentBalance = oldWalletDoc.data().balance || 0;
            const revertedBalance = oldTransaction.type === 'income'
                ? currentBalance - oldTransaction.amount
                : currentBalance + oldTransaction.amount;
            await updateDoc(oldWalletRef, { balance: revertedBalance });
        }

        // Apply new transaction
        const newWalletId = data.walletId || oldTransaction.walletId;
        const newWalletRef = doc(db, 'users', userId, 'wallets', newWalletId);
        const newWalletDoc = await getDoc(newWalletRef);
        if (newWalletDoc.exists()) {
            const currentBalance = newWalletDoc.data().balance || 0;
            const newType = data.type || oldTransaction.type;
            const newAmount = data.amount !== undefined ? data.amount : oldTransaction.amount;
            const newBalance = newType === 'income'
                ? currentBalance + newAmount
                : currentBalance - newAmount;
            await updateDoc(newWalletRef, { balance: newBalance });
        }
    }
};

export const deleteTransaction = async (
    userId: string,
    transactionId: string,
    transaction?: Transaction
): Promise<void> => {
    const ref = doc(db, 'users', userId, 'transactions', transactionId);
    await deleteDoc(ref);

    // Revert wallet balance
    if (transaction) {
        const walletRef = doc(db, 'users', userId, 'wallets', transaction.walletId);
        const walletDoc = await getDoc(walletRef);
        if (walletDoc.exists()) {
            const currentBalance = walletDoc.data().balance || 0;
            const newBalance = transaction.type === 'income'
                ? currentBalance - transaction.amount
                : currentBalance + transaction.amount;
            await updateDoc(walletRef, { balance: newBalance });
        }
    }
};

export const getTransactions = async (
    userId: string,
    _filters: TransactionFilters = {}
): Promise<Transaction[]> => {
    const ref = getUserCollection(userId, 'transactions');
    const q = query(ref, orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
};

export const subscribeToTransactions = (
    userId: string,
    callback: (transactions: Transaction[]) => void,
    filters: TransactionFilters = {}
): Unsubscribe => {
    const ref = getUserCollection(userId, 'transactions');
    const q = query(ref, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
        let transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

        // Apply client-side filters if needed
        if (filters.startDate || filters.endDate) {
            transactions = transactions.filter(t => {
                const date = (t.date as unknown as Timestamp)?.toDate
                    ? (t.date as unknown as Timestamp).toDate()
                    : new Date(t.date);
                if (filters.startDate && date < filters.startDate) return false;
                if (filters.endDate && date > filters.endDate) return false;
                return true;
            });
        }

        callback(transactions);
    });
};
