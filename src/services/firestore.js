import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Helper to get user's collection reference
const getUserCollection = (userId, collectionName) => {
    return collection(db, 'users', userId, collectionName);
};

// ==================== WALLETS ====================

export const addWallet = async (userId, wallet) => {
    const ref = getUserCollection(userId, 'wallets');
    const docRef = await addDoc(ref, {
        ...wallet,
        balance: wallet.balance || 0,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateWallet = async (userId, walletId, data) => {
    const ref = doc(db, 'users', userId, 'wallets', walletId);
    await updateDoc(ref, data);
};

export const deleteWallet = async (userId, walletId) => {
    const ref = doc(db, 'users', userId, 'wallets', walletId);
    await deleteDoc(ref);
};

export const getWallets = async (userId) => {
    const ref = getUserCollection(userId, 'wallets');
    const q = query(ref, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToWallets = (userId, callback) => {
    const ref = getUserCollection(userId, 'wallets');
    const q = query(ref, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const wallets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(wallets);
    });
};

// ==================== CATEGORIES ====================

export const addCategory = async (userId, category) => {
    const ref = getUserCollection(userId, 'categories');
    const docRef = await addDoc(ref, {
        ...category,
        createdAt: serverTimestamp()
    });
    return docRef.id;
};

export const updateCategory = async (userId, categoryId, data) => {
    const ref = doc(db, 'users', userId, 'categories', categoryId);
    await updateDoc(ref, data);
};

export const deleteCategory = async (userId, categoryId) => {
    const ref = doc(db, 'users', userId, 'categories', categoryId);
    await deleteDoc(ref);
};

export const getCategories = async (userId) => {
    const ref = getUserCollection(userId, 'categories');
    const q = query(ref, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToCategories = (userId, callback) => {
    const ref = getUserCollection(userId, 'categories');
    const q = query(ref, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(categories);
    });
};

// Initialize default categories for new user
export const initializeDefaultCategories = async (userId) => {
    const batch = writeBatch(db);
    const ref = getUserCollection(userId, 'categories');

    const defaultCategories = [
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
export const initializeDefaultWallet = async (userId) => {
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

export const addTransaction = async (userId, transaction) => {
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

export const updateTransaction = async (userId, transactionId, data, oldTransaction) => {
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

export const deleteTransaction = async (userId, transactionId, transaction) => {
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

export const getTransactions = async (userId, filters = {}) => {
    const ref = getUserCollection(userId, 'transactions');
    let q = query(ref, orderBy('date', 'desc'));

    if (filters.startDate) {
        q = query(q, where('date', '>=', filters.startDate));
    }
    if (filters.endDate) {
        q = query(q, where('date', '<=', filters.endDate));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToTransactions = (userId, callback, filters = {}) => {
    const ref = getUserCollection(userId, 'transactions');
    const q = query(ref, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
        let transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Apply client-side filters if needed
        if (filters.startDate || filters.endDate) {
            transactions = transactions.filter(t => {
                const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                if (filters.startDate && date < filters.startDate) return false;
                if (filters.endDate && date > filters.endDate) return false;
                return true;
            });
        }

        callback(transactions);
    });
};
