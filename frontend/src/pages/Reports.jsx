import React, { useCallback, useEffect, useState } from 'react';
import { reportService } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const Reports = () => {
  const [period, setPeriod] = useState('monthly'); // weekly, monthly, yearly
  const [date, setDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakdownType, setBreakdownType] = useState('EXPENSE');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = period === 'monthly' 
        ? { year: date.getFullYear(), month: date.getMonth() + 1 }
        : period === 'yearly' 
        ? { year: date.getFullYear() }
        : { date: date.toISOString().split('T')[0] };

      const [sumRes, trendRes, breakdownRes] = await Promise.all([
        reportService.getSummary(period, params),
        reportService.getTrend(period, params),
        reportService.getBreakdown(period, { ...params, type: breakdownType })
      ]);

      setData(sumRes.data);
      setTrend(trendRes.data);
      setBreakdown(breakdownRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [breakdownType, date, period]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const processedTrend = period === 'yearly'
    ? Object.values(
        (trend || []).reduce((acc, item) => {
          const mon = item.date.substring(0, 7);
          if (!acc[mon]) acc[mon] = { date: mon, income: 0, expense: 0, investment: 0, net: 0 };
          acc[mon].income  += item.income;
          acc[mon].expense += item.expense;
          acc[mon].investment += item.investment;
          acc[mon].net     += item.net;
          return acc;
        }, {})
      )
    : (trend || []);

  const formatXAxis = (val) => {
    if (!val) return '';
    if (period === 'monthly') return parseInt(val.split('-')[2], 10).toString();
    if (period === 'yearly')  return new Date(val + '-01T12:00:00').toLocaleDateString(undefined, { month: 'short' });
    return new Date(val + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' });
  };

  const changeDate = (offset) => {
    const newDate = new Date(date);
    if (period === 'monthly') newDate.setMonth(date.getMonth() + offset);
    else if (period === 'yearly') newDate.setFullYear(date.getFullYear() + offset);
    else newDate.setDate(date.getDate() + (offset * 7));
    setDate(newDate);
  };

  return (
    <div className="reports-container animate-fade-in">
      <header className="page-header">
        <h1 className="text-gradient">Financial Reports</h1>
        
        <div className="report-controls glass">
          <div className="period-tabs">
            {['weekly', 'monthly', 'yearly'].map(p => (
              <button 
                key={p} 
                className={period === p ? 'active' : ''} 
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="date-nav">
            <button onClick={() => changeDate(-1)}><ChevronLeft size={20} /></button>
            <span>
              {period === 'monthly' 
                ? date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                : period === 'yearly'
                ? date.getFullYear()
                : `Week of ${date.toLocaleDateString()}`
              }
            </span>
            <button onClick={() => changeDate(1)}><ChevronRight size={20} /></button>
          </div>
        </div>
      </header>

      {loading ? <div className="loading">Generating Report...</div> : (
        <div className="report-content">
          {(() => {
            const p = period === 'monthly' ? 'Monthly' : period === 'yearly' ? 'Annual' : "This Week's";
            return (
              <div className="summary-cards metric-grid">
                <div className="glass card metric-card">
                  <span className="metric-label">{p} Income</span>
                  <span className="metric-value text-success">₱{data?.totalIncome?.toLocaleString()}</span>
                </div>
                <div className="glass card metric-card">
                  <span className="metric-label">{p} Expenses</span>
                  <span className="metric-value text-danger">₱{data?.totalExpense?.toLocaleString()}</span>
                </div>
                <div className="glass card metric-card">
                  <span className="metric-label">{p} Investments</span>
                  <span className="metric-value text-investment">₱{data?.totalInvestment?.toLocaleString()}</span>
                </div>
                <div className="glass card metric-card">
                  <span className="metric-label">{p} Net Savings</span>
                  <span className="metric-value text-primary">₱{data?.netSavings?.toLocaleString()}</span>
                </div>
              </div>
            );
          })()}

          <div className="charts-grid">
            <div className="glass card chart-box">
              <h3>{period === 'monthly' ? 'Daily' : period === 'yearly' ? 'Monthly' : 'Daily'} Financial Trend</h3>
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={processedTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickFormatter={formatXAxis} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                      formatter={(value) => [`₱${Number(value).toLocaleString()}`, undefined]}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="investment" name="Investment" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass card chart-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>{breakdownType === 'EXPENSE' ? 'Expense' : 'Investment'} by Category</h3>
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
              <div style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%" cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="totalAmount"
                      nameKey="categoryName"
                      label={({categoryName, percentage}) => `${categoryName} (${percentage.toFixed(1)}%)`}
                    >
                      {breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
