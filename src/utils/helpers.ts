import { Timestamp } from 'firebase/firestore';
import { Category, Transaction } from '../types';

// Date type that can be Firestore Timestamp or Date
type DateLike = Date | Timestamp | { toDate: () => Date };

// Format number as currency (Indonesian Rupiah style)
export const formatCurrency = (amount: number, currency: string = 'IDR'): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Format date to readable string
export const formatDate = (date: DateLike, format: 'short' | 'full' | 'input' = 'short'): string => {
    const d = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date as Date);

    if (format === 'short') {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric'
        }).format(d);
    }

    if (format === 'full') {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(d);
    }

    if (format === 'input') {
        return d.toISOString().split('T')[0];
    }

    return d.toLocaleDateString();
};

// Get start and end of month
export const getMonthRange = (date: Date = new Date()): { start: Date; end: Date } => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
};

// Get month name
export const getMonthName = (date: Date = new Date()): string => {
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
};

// Totals interface
interface Totals {
    income: number;
    expense: number;
}

// Calculate total from transactions
export const calculateTotals = (transactions: Transaction[]): Totals => {
    return transactions.reduce((acc, t) => {
        if (t.type === 'income') {
            acc.income += t.amount;
        } else {
            acc.expense += t.amount;
        }
        return acc;
    }, { income: 0, expense: 0 });
};

// Date group interface
interface DateGroup {
    date: Date;
    transactions: Transaction[];
}

// Group transactions by date
export const groupTransactionsByDate = (transactions: Transaction[]): DateGroup[] => {
    const groups: Record<string, DateGroup> = {};

    transactions.forEach(t => {
        const date = (t.date as unknown as Timestamp)?.toDate
            ? (t.date as unknown as Timestamp).toDate()
            : new Date(t.date);
        const key = date.toISOString().split('T')[0];

        if (!groups[key]) {
            groups[key] = {
                date: date,
                transactions: []
            };
        }
        groups[key].transactions.push(t);
    });

    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Category group interface
interface CategoryGroup {
    categoryId: string;
    name: string;
    icon: string;
    color: string;
    total: number;
}

// Group transactions by category for chart
export const groupByCategory = (
    transactions: Transaction[],
    categories: Category[],
    type: 'income' | 'expense' = 'expense'
): CategoryGroup[] => {
    const filtered = transactions.filter(t => t.type === type);
    const grouped: Record<string, CategoryGroup> = {};

    filtered.forEach(t => {
        if (!grouped[t.categoryId]) {
            const category = categories.find(c => c.id === t.categoryId);
            grouped[t.categoryId] = {
                categoryId: t.categoryId,
                name: category?.name || 'Unknown',
                icon: category?.icon || '📦',
                color: category?.color || '#888',
                total: 0
            };
        }
        grouped[t.categoryId].total += t.amount;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
};
