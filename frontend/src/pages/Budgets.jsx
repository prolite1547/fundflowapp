import React, { useCallback, useEffect, useState } from 'react';
import { budgetService, categoryService } from '../services/api';
import { Plus, Target, AlertTriangle, CheckCircle } from 'lucide-react';

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [filterMonthYear, setFilterMonthYear] = useState(new Date().toISOString().substring(0, 7));
  
  const [formData, setFormData] = useState({
    limitAmount: '',
    categoryId: '',
    monthYear: new Date().toISOString().substring(0, 7)
  });

  const fetchData = useCallback(async () => {
    try {
      const [year, month] = filterMonthYear.split('-');
      const [budRes, catRes] = await Promise.all([
        budgetService.getBudgets({ month: parseInt(month, 10), year: parseInt(year, 10) }),
        categoryService.getCategories()
      ]);
      setBudgets(budRes.data);
      setCategories(catRes.data.filter(c => c.type === 'EXPENSE'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterMonthYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const [yearStr, monthStr] = formData.monthYear.split('-');
      await budgetService.createBudget({
        categoryId: formData.categoryId,
        limitAmount: parseFloat(formData.limitAmount),
        month: parseInt(monthStr, 10),
        year: parseInt(yearStr, 10)
      });
      setShowModal(false);
      fetchData();
      setFormData({
        limitAmount: '',
        categoryId: '',
        monthYear: new Date().toISOString().substring(0, 7)
      });
    } catch {
      alert('Error creating budget');
    }
  };

  if (loading) return <div className="loading">Loading Budgets...</div>;

  return (
    <div className="budgets-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Budgets</h1>
          <p className="text-muted">Stay on track with your spending goals.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '0.25rem 0.75rem', borderRadius: '0.75rem', gap: '0.5rem' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>View:</span>
            <input 
              type="month" 
              value={filterMonthYear}
              onChange={(e) => setFilterMonthYear(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'white', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>
          <button className="btn-primary glass" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            <span>Set Budget</span>
          </button>
        </div>
      </header>

      <div className="budgets-grid">
        {budgets.length > 0 ? (
          budgets.map((b) => {
            const percentage = Math.min((b.spentAmount / b.limitAmount) * 100, 100);
            const isOver = b.spentAmount > b.limitAmount;
            
            return (
              <div key={b.id} className="glass card budget-card">
                <div className="budget-header">
                  <h3>{b.categoryName || 'Unknown Category'}</h3>
                  <span className={`status-badge ${isOver ? 'danger' : 'success'}`}>
                    {isOver ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                    {isOver ? 'Over Budget' : 'On Track'}
                  </span>
                </div>
                
                <div className="budget-progress">
                  <div className="progress-bar-bg">
                    <div 
                      className={`progress-bar-fill ${isOver ? 'danger' : ''}`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-labels">
                    <span>₱{b.spentAmount.toLocaleString()} spent</span>
                    <span>₱{b.limitAmount.toLocaleString()} limit</span>
                  </div>
                </div>

                <div className="budget-footer">
                  <span className="text-muted">Remaining: </span>
                  <span className={b.remainingAmount < 0 ? 'text-danger' : 'text-success'}>
                    ₱{b.remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No budgets found for this month.</p>
            <button 
              className="btn-primary" 
              style={{ margin: '1rem auto 0' }}
              onClick={() => setShowModal(true)}
            >
              Create Your First Budget
            </button>
          </div>
        )}
      </div>

      {/* Add Budget Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <h2>Set Category Budget</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Limit Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.limitAmount}
                    onChange={(e) => setFormData({...formData, limitAmount: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group full-width">
                  <label>Target Month</label>
                  <input 
                    type="month" 
                    value={formData.monthYear}
                    onChange={(e) => setFormData({...formData, monthYear: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
