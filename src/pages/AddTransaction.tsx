import { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { subscribeToCategories, subscribeToWallets, addTransaction } from '../services/firestore';
import { formatCurrency } from '../utils/helpers';
import { Category, Wallet } from '../types';

const AddTransaction = (): JSX.Element => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [type, setType] = useState<'income' | 'expense'>('expense');
    const [amount, setAmount] = useState<string>('0');
    const [categoryId, setCategoryId] = useState<string>('');
    const [walletId, setWalletId] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!user) return;

        const unsubCategories = subscribeToCategories(user.uid, setCategories);
        const unsubWallets = subscribeToWallets(user.uid, (w) => {
            setWallets(w);
            if (w.length > 0 && !walletId) {
                setWalletId(w[0].id);
            }
        });

        return () => {
            unsubCategories();
            unsubWallets();
        };
    }, [user, walletId]);

    const filteredCategories = categories.filter(c => c.type === type);

    useEffect(() => {
        // Reset category when type changes
        setCategoryId('');
    }, [type]);

    const handleNumberPress = (num: string): void => {
        if (amount === '0') {
            setAmount(num);
        } else if (amount.length < 12) {
            setAmount(amount + num);
        }
    };

    const handleBackspace = (): void => {
        if (amount.length > 1) {
            setAmount(amount.slice(0, -1));
        } else {
            setAmount('0');
        }
    };

    const handleClear = (): void => {
        setAmount('0');
    };

    const handleSubmit = async (): Promise<void> => {
        if (amount === '0' || !categoryId || !walletId || !user) {
            return;
        }

        setLoading(true);

        try {
            await addTransaction(user.uid, {
                type,
                amount: parseInt(amount, 10),
                categoryId,
                walletId,
                note,
                date: Timestamp.fromDate(new Date(date))
            });
            navigate('/');
        } catch (error) {
            console.error('Error adding transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-transaction-page">
            {/* Header */}
            <div className="add-header">
                <button className="btn btn-ghost" onClick={() => navigate(-1)}>
                    ✕
                </button>
                <h1>Add Transaction</h1>
                <button
                    className="btn btn-ghost"
                    onClick={handleSubmit}
                    disabled={loading || amount === '0' || !categoryId}
                >
                    ✓
                </button>
            </div>

            {/* Type Toggle */}
            <div className="type-toggle">
                <button
                    className={type === 'expense' ? 'active expense' : ''}
                    onClick={() => setType('expense')}
                >
                    Expense
                </button>
                <button
                    className={type === 'income' ? 'active income' : ''}
                    onClick={() => setType('income')}
                >
                    Income
                </button>
            </div>

            {/* Amount Display */}
            <div className="amount-input-container">
                <div className={`amount-display ${type}`}>
                    {formatCurrency(parseInt(amount || '0', 10))}
                </div>
            </div>

            {/* Form Fields */}
            <div className="add-form">
                {/* Category Selection */}
                <div className="form-group">
                    <label className="form-label">Category</label>
                    <div className="select-grid">
                        {filteredCategories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`select-item ${categoryId === cat.id ? 'selected' : ''}`}
                                onClick={() => setCategoryId(cat.id)}
                            >
                                <span className="icon">{cat.icon}</span>
                                <span className="label">{cat.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Wallet Selection */}
                <div className="form-group">
                    <label className="form-label">Wallet</label>
                    <div className="select-grid">
                        {wallets.map((wallet) => (
                            <div
                                key={wallet.id}
                                className={`select-item ${walletId === wallet.id ? 'selected' : ''}`}
                                onClick={() => setWalletId(wallet.id)}
                            >
                                <span className="icon">{wallet.icon || '💳'}</span>
                                <span className="label">{wallet.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                        type="date"
                        className="form-input"
                        value={date}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
                    />
                </div>

                {/* Note */}
                <div className="form-group">
                    <label className="form-label">Note (optional)</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Add a note..."
                        value={note}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNote(e.target.value)}
                    />
                </div>
            </div>

            {/* Number Pad */}
            <div className="number-pad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button key={num} onClick={() => handleNumberPress(num)}>
                        {num}
                    </button>
                ))}
                <button onClick={handleClear}>C</button>
                <button onClick={() => handleNumberPress('0')}>0</button>
                <button onClick={handleBackspace}>⌫</button>
            </div>
        </div>
    );
};

export default AddTransaction;
