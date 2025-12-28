import { useState, useEffect, FormEvent, ChangeEvent, MouseEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToWallets, addWallet, updateWallet, deleteWallet, WalletInput } from '../services/firestore';
import { formatCurrency } from '../utils/helpers';
import { Wallet } from '../types';

interface WalletType {
    value: 'cash' | 'bank' | 'e-wallet' | 'credit';
    label: string;
    icon: string;
}

const WALLET_TYPES: WalletType[] = [
    { value: 'cash', label: 'Cash', icon: '💵' },
    { value: 'bank', label: 'Bank', icon: '🏦' },
    { value: 'e-wallet', label: 'E-Wallet', icon: '📱' },
    { value: 'credit', label: 'Credit Card', icon: '💳' },
];

interface FormData {
    name: string;
    type: 'cash' | 'bank' | 'e-wallet' | 'credit';
    balance: string;
}

const Wallets = (): JSX.Element => {
    const { user } = useAuth();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        type: 'cash',
        balance: '0'
    });

    useEffect(() => {
        if (!user) return;

        const unsub = subscribeToWallets(user.uid, (w) => {
            setWallets(w);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

    const openModal = (wallet: Wallet | null = null): void => {
        if (wallet) {
            setEditingWallet(wallet);
            setFormData({
                name: wallet.name,
                type: wallet.type,
                balance: String(wallet.balance || 0)
            });
        } else {
            setEditingWallet(null);
            setFormData({ name: '', type: 'cash', balance: '0' });
        }
        setShowModal(true);
    };

    const closeModal = (): void => {
        setShowModal(false);
        setEditingWallet(null);
        setFormData({ name: '', type: 'cash', balance: '0' });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        if (!formData.name.trim() || !user) return;

        const walletType = WALLET_TYPES.find(t => t.value === formData.type);
        const data: WalletInput = {
            name: formData.name.trim(),
            type: formData.type,
            icon: walletType?.icon || '💳',
            balance: parseInt(formData.balance, 10) || 0
        };

        try {
            if (editingWallet) {
                await updateWallet(user.uid, editingWallet.id, data);
            } else {
                await addWallet(user.uid, data);
            }
            closeModal();
        } catch (error) {
            console.error('Error saving wallet:', error);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!editingWallet || !user) return;
        if (window.confirm('Delete this wallet? This will not delete associated transactions.')) {
            try {
                await deleteWallet(user.uid, editingWallet.id);
                closeModal();
            } catch (error) {
                console.error('Error deleting wallet:', error);
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
            {/* Header */}
            <div className="section-header">
                <h1 className="section-title">Wallets</h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    + Add
                </button>
            </div>

            {/* Total Balance Card */}
            <div className="container">
                <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <div className="form-label">Total Balance</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
            </div>

            {/* Wallet List */}
            <div className="wallet-list">
                {wallets.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">💳</div>
                        <div className="empty-title">No wallets yet</div>
                        <div className="empty-description">
                            Add a wallet to start tracking your money
                        </div>
                    </div>
                ) : (
                    wallets.map((wallet) => (
                        <div
                            key={wallet.id}
                            className="wallet-card"
                            onClick={() => openModal(wallet)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="wallet-icon">
                                {wallet.icon || '💳'}
                            </div>
                            <div className="wallet-info">
                                <div className="wallet-name">{wallet.name}</div>
                                <div className="wallet-type">{wallet.type}</div>
                            </div>
                            <div className="wallet-balance">
                                {formatCurrency(wallet.balance || 0)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e: MouseEvent) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {editingWallet ? 'Edit Wallet' : 'New Wallet'}
                            </h2>
                            <button className="btn btn-ghost" onClick={closeModal}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="form-group">
                                    <label className="form-label">Wallet Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., My Bank Account"
                                        value={formData.name}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <div className="select-grid">
                                        {WALLET_TYPES.map((type) => (
                                            <div
                                                key={type.value}
                                                className={`select-item ${formData.type === type.value ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, type: type.value })}
                                            >
                                                <span className="icon">{type.icon}</span>
                                                <span className="label">{type.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {!editingWallet && (
                                    <div className="form-group">
                                        <label className="form-label">Initial Balance</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            placeholder="0"
                                            value={formData.balance}
                                            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, balance: e.target.value })}
                                        />
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary btn-full">
                                    {editingWallet ? 'Update' : 'Create'} Wallet
                                </button>

                                {editingWallet && (
                                    <button
                                        type="button"
                                        className="btn btn-full"
                                        style={{ background: 'var(--color-expense)', color: 'white' }}
                                        onClick={handleDelete}
                                    >
                                        Delete Wallet
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallets;
