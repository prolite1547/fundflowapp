import React, { useCallback, useEffect, useState } from 'react';
import { reportService } from '../services/api';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Coins } from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakdownType, setBreakdownType] = useState('EXPENSE');

  const fetchData = useCallback(async () => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      const [sumRes, trendRes, breakdownRes] = await Promise.all([
        reportService.getSummary('monthly', { year, month }),
        reportService.getTrend('monthly', { year, month }),
        reportService.getBreakdown('monthly', { year, month, type: breakdownType })
      ]);

      setSummary(sumRes.data);
      setTrend(trendRes.data);
      setBreakdown(breakdownRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [breakdownType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="loading">Loading Dashboard...</div>;

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Financial Overview</h1>
          <p className="text-muted">Monthly status for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
      </header>

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
