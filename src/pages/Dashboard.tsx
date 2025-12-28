import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { subscribeToWallets, subscribeToTransactions, subscribeToCategories } from '../services/firestore';
import { formatCurrency, getMonthRange, getMonthName, calculateTotals, groupTransactionsByDate } from '../utils/helpers';
import { Wallet, Transaction, Category } from '../types';

const Dashboard = (): JSX.Element => {
    const { user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [loading, setLoading] = useState<boolean>(true);

    const { start, end } = getMonthRange(currentDate);

    useEffect(() => {
        if (!user) return;

        const unsubWallets = subscribeToWallets(user.uid, setWallets);
        const unsubCategories = subscribeToCategories(user.uid, setCategories);
        const unsubTransactions = subscribeToTransactions(user.uid, (txs) => {
            // Filter by current month
            const filtered = txs.filter(t => {
                const date = (t.date as unknown as Timestamp)?.toDate
                    ? (t.date as unknown as Timestamp).toDate()
                    : new Date(t.date);
                return date >= start && date <= end;
            });
            setTransactions(filtered);
            setLoading(false);
        });

        return () => {
            unsubWallets();
            unsubCategories();
            unsubTransactions();
        };
    }, [user, currentDate, start, end]);

    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const { income, expense } = calculateTotals(transactions);
    const groupedTransactions = groupTransactionsByDate(transactions);

    const getCategoryById = (id: string): Category | undefined => categories.find(c => c.id === id);

    const navigateMonth = (direction: number): void => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="page">
            {/* Header with Balance */}
            <div className="dashboard-header">
                <div className="dashboard-greeting">
                    Hello, {user?.displayName || 'there'} 👋
                </div>
                <div className="dashboard-balance">
                    {formatCurrency(totalBalance)}
                </div>
                <div className="dashboard-summary">
                    <div className="summary-item">
                        <div className="summary-label">Income</div>
                        <div className="summary-value income">+{formatCurrency(income)}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">Expense</div>
                        <div className="summary-value expense">-{formatCurrency(expense)}</div>
                    </div>
                </div>
            </div>

            {/* Month Navigator */}
            <div className="month-nav">
                <button onClick={() => navigateMonth(-1)}>◀</button>
                <span className="current-month">{getMonthName(currentDate)}</span>
                <button onClick={() => navigateMonth(1)}>▶</button>
            </div>

            {/* Recent Transactions */}
            <div className="section-header">
                <h2 className="section-title">Transactions</h2>
                <Link to="/transactions" className="btn btn-ghost">See All</Link>
            </div>

            {transactions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <div className="empty-title">No transactions yet</div>
                    <div className="empty-description">
                        Start tracking your finances by adding your first transaction
                    </div>
                    <Link to="/add" className="btn btn-primary">
                        Add Transaction
                    </Link>
                </div>
            ) : (
                <div className="transaction-list">
                    {groupedTransactions.slice(0, 5).map((group) => (
                        <div key={group.date.toISOString()}>
                            <div className="transaction-date-group">
                                {group.date.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </div>
                            {group.transactions.map((t) => {
                                const category = getCategoryById(t.categoryId);
                                return (
                                    <div key={t.id} className="transaction-item">
                                        <div className="transaction-icon">
                                            {category?.icon || '📦'}
                                        </div>
                                        <div className="transaction-details">
                                            <div className="transaction-category">
                                                {category?.name || 'Unknown'}
                                            </div>
                                            <div className="transaction-note">
                                                {t.note || '-'}
                                            </div>
                                        </div>
                                        <div className={`transaction-amount ${t.type}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
