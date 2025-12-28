import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToTransactions, subscribeToCategories } from '../services/firestore';
import { formatCurrency, getMonthRange, getMonthName, calculateTotals, groupByCategory } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const Reports = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [viewType, setViewType] = useState('expense');

    const { start, end } = getMonthRange(currentDate);

    useEffect(() => {
        if (!user) return;

        const unsubCategories = subscribeToCategories(user.uid, setCategories);
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
            unsubTransactions();
        };
    }, [user, currentDate]);

    const { income, expense } = calculateTotals(transactions);
    const categoryData = groupByCategory(transactions, categories, viewType);

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
            return newDate;
        });
    };

    // Generate last 6 months data for bar chart
    const getMonthlyData = () => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() - i);
            const { start: mStart, end: mEnd } = getMonthRange(d);

            const monthTxs = transactions.filter(t => {
                const date = t.date?.toDate ? t.date.toDate() : new Date(t.date);
                return date >= mStart && date <= mEnd;
            });

            const totals = calculateTotals(monthTxs);
            data.push({
                month: d.toLocaleDateString('en-US', { month: 'short' }),
                income: totals.income,
                expense: totals.expense
            });
        }
        return data;
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

            {/* Summary Cards */}
            <div className="container" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div className="form-label">Income</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-income)' }}>
                            +{formatCurrency(income)}
                        </div>
                    </div>
                    <div className="card" style={{ textAlign: 'center' }}>
                        <div className="form-label">Expense</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-expense)' }}>
                            -{formatCurrency(expense)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Type Toggle */}
            <div className="type-toggle" style={{ margin: '0 16px 16px' }}>
                <button
                    className={viewType === 'expense' ? 'active expense' : ''}
                    onClick={() => setViewType('expense')}
                >
                    Expense
                </button>
                <button
                    className={viewType === 'income' ? 'active income' : ''}
                    onClick={() => setViewType('income')}
                >
                    Income
                </button>
            </div>

            {/* Pie Chart */}
            <div className="container">
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>
                        {viewType === 'expense' ? 'Expense' : 'Income'} by Category
                    </h3>

                    {categoryData.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px' }}>
                            <div className="empty-icon">📊</div>
                            <div className="empty-description">No data for this month</div>
                        </div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="total"
                                        nameKey="name"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Legend */}
                            <div style={{ marginTop: '16px' }}>
                                {categoryData.map((item) => (
                                    <div
                                        key={item.categoryId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '8px 0',
                                            borderBottom: '1px solid var(--color-surface-variant)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{item.icon}</span>
                                            <span>{item.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Monthly Trend (placeholder for multi-month data) */}
            <div className="container" style={{ marginTop: '16px' }}>
                <div className="card">
                    <h3 className="card-title" style={{ marginBottom: '16px' }}>Balance</h3>
                    <div style={{ textAlign: 'center', padding: '24px' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: income >= expense ? 'var(--color-income)' : 'var(--color-expense)'
                        }}>
                            {formatCurrency(income - expense)}
                        </div>
                        <div className="form-label" style={{ marginTop: '8px' }}>
                            {income >= expense ? 'Saved this month' : 'Overspent this month'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
