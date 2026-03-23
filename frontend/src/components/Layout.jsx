import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchTransactions } from '../store/slices/transactionsSlice';
import { AlertCircle } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { items: transactions } = useSelector((state) => state.transactions || { items: [] });

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter transactions for the current month
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTx
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = currentMonthTx
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const isOverspending = totalExpense > totalIncome && totalExpense > 0;
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/';
  const shouldShowAlert = isOverspending && !isDashboard;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {shouldShowAlert && (
          <div className="alert-banner animate-slide-down" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(127, 29, 29, 0.3))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderLeft: '4px solid #ef4444',
            borderRadius: '8px',
            padding: '1rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.1)'
          }}>
            <AlertCircle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1rem', fontWeight: 600 }}>Overspending Alert</h4>
              <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-color)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                You are spending more than you earn this month. 
                <span className="text-muted" style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  (Income: ₱{totalIncome.toLocaleString()} | Expenses: ₱{totalExpense.toLocaleString()})
                </span>
              </p>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
