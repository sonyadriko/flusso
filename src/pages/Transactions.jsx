import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToTransactions, subscribeToCategories, subscribeToWallets, deleteTransaction } from '../services/firestore';
import { formatCurrency, getMonthRange, getMonthName, groupTransactionsByDate } from '../utils/helpers';

const Transactions = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [wallets, setWallets] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const { start, end } = getMonthRange(currentDate);

    useEffect(() => {
        if (!user) return;

        const unsubCategories = subscribeToCategories(user.uid, setCategories);
        const unsubWallets = subscribeToWallets(user.uid, setWallets);
        const unsubTransactions = subscribeToTransactions(user.uid, (txs) => {
            const filtered = txs.filter(t => {
                const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                return date >= start && date <= end;
            });
            setTransactions(filtered);
            setLoading(false);
        });

        return () => {
            unsubCategories();
            unsubWallets();
            unsubTransactions();
        };
    }, [user, currentDate]);

    const getCategoryById = (id) => categories.find(c => c.id === id);
    const getWalletById = (id) => wallets.find(w => w.id === id);
    const groupedTransactions = groupTransactionsByDate(transactions);

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    const handleDelete = async (transaction) => {
        if (window.confirm('Delete this transaction?')) {
            try {
                await deleteTransaction(user.uid, transaction.id, transaction);
                setSelectedTransaction(null);
            } catch (error) {
                console.error('Error deleting transaction:', error);
            }
        }
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
            {/* Month Navigator */}
            <div className="month-nav">
                <button onClick={() => navigateMonth(-1)}>◀</button>
                <span className="current-month">{getMonthName(currentDate)}</span>
                <button onClick={() => navigateMonth(1)}>▶</button>
            </div>

            {/* Transaction List */}
            {transactions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <div className="empty-title">No transactions</div>
                    <div className="empty-description">
                        No transactions found for {getMonthName(currentDate)}
                    </div>
                </div>
            ) : (
                <div className="transaction-list">
                    {groupedTransactions.map((group) => (
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
                                const wallet = getWalletById(t.walletId);
                                return (
                                    <div
                                        key={t.id}
                                        className="transaction-item"
                                        onClick={() => setSelectedTransaction(t)}
                                    >
                                        <div className="transaction-icon">
                                            {category?.icon || '📦'}
                                        </div>
                                        <div className="transaction-details">
                                            <div className="transaction-category">
                                                {category?.name || 'Unknown'}
                                            </div>
                                            <div className="transaction-note">
                                                {wallet?.name || '-'} • {t.note || '-'}
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

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="modal-overlay" onClick={() => setSelectedTransaction(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Transaction Details</h2>
                            <button className="btn btn-ghost" onClick={() => setSelectedTransaction(null)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '8px' }}>
                                    {getCategoryById(selectedTransaction.categoryId)?.icon || '📦'}
                                </div>
                                <div className={`transaction-amount ${selectedTransaction.type}`} style={{ fontSize: '2rem' }}>
                                    {selectedTransaction.type === 'income' ? '+' : '-'}
                                    {formatCurrency(selectedTransaction.amount)}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <div className="form-label">Category</div>
                                    <div>{getCategoryById(selectedTransaction.categoryId)?.name || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div className="form-label">Wallet</div>
                                    <div>{getWalletById(selectedTransaction.walletId)?.name || 'Unknown'}</div>
                                </div>
                                <div>
                                    <div className="form-label">Date</div>
                                    <div>
                                        {(selectedTransaction.date?.toDate ? selectedTransaction.date.toDate() : new Date(selectedTransaction.date))
                                            .toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                    </div>
                                </div>
                                {selectedTransaction.note && (
                                    <div>
                                        <div className="form-label">Note</div>
                                        <div>{selectedTransaction.note}</div>
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-full"
                                style={{ marginTop: '24px', background: 'var(--color-expense)', color: 'white' }}
                                onClick={() => handleDelete(selectedTransaction)}
                            >
                                Delete Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;
