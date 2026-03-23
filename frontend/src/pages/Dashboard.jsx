import React, { useCallback, useEffect, useState } from 'react';
import { reportService } from '../services/api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Coins, Smile, Meh, Frown, AlertTriangle, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { fetchAccounts } from "../store/slices/accountsSlice";
import { fetchTransactions } from "../store/slices/transactionsSlice";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [breakdownType, setBreakdownType] = useState('EXPENSE');

  const dispatch = useDispatch();
  const { items: accounts } = useSelector((state) => state.accounts);
  const { items: transactions } = useSelector((state) => state.transactions);

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const [sumRes, trendRes, breakdownRes, healthRes] = await Promise.all([
        reportService.getSummary('monthly', { year, month }),
        reportService.getTrend('monthly', { year, month }),
        reportService.getBreakdown('monthly', { year, month, type: breakdownType }),
        reportService.getFinancialHealth(year, month)
      ]);

      setSummary(sumRes.data);
      setTrend(trendRes.data);
      setBreakdown(breakdownRes.data);
      setHealth(healthRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [breakdownType]);

  useEffect(() => {
    fetchData();
    dispatch(fetchAccounts());
    dispatch(fetchTransactions());
  }, [fetchData, dispatch]);

  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const getHealthEmoji = (status) => {
    switch (status) {
      case 'Excellent': return <Smile color="#10b981" size={48} strokeWidth={1.5} />;
      case 'Good': return <Smile color="#3b82f6" size={48} strokeWidth={1.5} />;
      case 'Needs Attention': return <Meh color="#f59e0b" size={48} strokeWidth={1.5} />;
      case 'Critical': return <Frown color="#ef4444" size={48} strokeWidth={1.5} />;
      default: return <Meh color="#94a3b8" size={48} strokeWidth={1.5} />;
    }
  };

  const getHealthCardStyles = (status) => {
    const baseStyle = { 
      marginBottom: '1.5rem', 
      display: 'flex', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.5rem 2rem',
      transition: 'all 0.3s ease'
    };

    switch (status) {
      case 'Excellent':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.4))',
          borderLeft: '4px solid #10b981',
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)'
        };
      case 'Good':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 58, 138, 0.4))',
          borderLeft: '4px solid #3b82f6'
        };
      case 'Needs Attention':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(120, 53, 15, 0.4))',
          borderLeft: '4px solid #f59e0b',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)'
        };
      case 'Critical':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(127, 29, 29, 0.5))',
          borderLeft: '6px solid #ef4444',
          border: '1px solid rgba(239, 68, 68, 0.6)',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.4)'
        };
      default:
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(30,40,60,0.8), rgba(20,20,30,0.9))',
          borderLeft: '4px solid #8b5cf6'
        };
    }
  };

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Financial Overview</h1>
          <p className="text-muted">Monthly status for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </header>

      {/* Financial Health Top Card */}
      {health && accounts.length > 0 && transactions.length > 0 && (
        <div className="health-card glass card" style={getHealthCardStyles(health.status)}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {health.status === 'Critical' && <AlertCircle color="#ef4444" size={24} />}
              {health.status === 'Needs Attention' && <AlertTriangle color="#f59e0b" size={24} />}
              Financial Health
            </h2>
            <p className="text-muted" style={{ margin: '0.4rem 0 0 0', fontSize: '1rem' }}>
              Status: <strong style={{ color: '#fff' }}>{health.status}</strong>
            </p>
            {health.message && (
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.4', maxWidth: '85%' }}>
                {health.message}
              </p>
            )}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {getHealthEmoji(health.status)}
            <span style={{ color: '#fff' }}>{health.score}</span>
            <span style={{ fontSize: '1rem', color: '#94a3b8', alignSelf: 'flex-end', paddingBottom: '0.5rem' }}>/ 100</span>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="metric-grid">
        <div className="metric-card glass card">
          <div className="metric-icon income"><DollarSign size={20} /></div>
          <span className="metric-label">Total Income</span>
          <span className="metric-value text-success">₱{summary?.totalIncome?.toLocaleString()}</span>
        </div>
        <div className="metric-card glass card">
          <div className="metric-icon expense"><TrendingDown size={20} /></div>
          <span className="metric-label">Total Expenses</span>
          <span className="metric-value text-danger">-₱{summary?.totalExpense?.toLocaleString()}</span>
        </div>
        <div className="metric-card glass card">
          <div className="metric-icon investment"><Coins size={20} /></div>
          <span className="metric-label">Total Investment</span>
          <span className="metric-value text-investment">₱{summary?.totalInvestment?.toLocaleString()}</span>
        </div>
        <div className="metric-card glass card">
          <div className="metric-icon net"><TrendingUp size={20} /></div>
          <span className="metric-label">Net Savings</span>
          <span className="metric-value text-primary">₱{summary?.netSavings?.toLocaleString()}</span>
        </div>
        <div className="metric-card glass card">
          <div className="metric-icon rate"><Wallet size={20} /></div>
          <span className="metric-label">Savings Rate</span>
          <span className="metric-value">{summary?.savingsRate?.toFixed(1)}%</span>
        </div>
      </div>

      <div className="charts-grid">
        {/* Trend Chart */}
        <div className="chart-container glass card">
          <h3>Monthly Trend</h3>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInvestment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" name="Income" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" name="Expense" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" />
                <Area type="monotone" name="Investment" dataKey="investment" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorInvestment)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="chart-container glass card">
          <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{breakdownType === 'EXPENSE' ? 'Expense' : 'Investment'} Breakdown</h3>
            <div className="period-tabs" style={{ fontSize: '0.75rem' }}>
              <button 
                className={breakdownType === 'EXPENSE' ? 'active' : ''} 
                onClick={() => setBreakdownType('EXPENSE')}
                style={{ padding: '0.2rem 0.75rem' }}
              >Expense</button>
              <button 
                className={breakdownType === 'INVESTMENT' ? 'active' : ''} 
                onClick={() => setBreakdownType('INVESTMENT')}
                style={{ padding: '0.2rem 0.75rem' }}
              >Investment</button>
            </div>
          </div>
          <div style={{ height: '280px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="totalAmount"
                  nameKey="categoryName"
                >
                  {breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
