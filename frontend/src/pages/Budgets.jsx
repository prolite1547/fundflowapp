import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { budgetService, categoryService } from '../services/api';
import { toast } from 'react-hot-toast';
import { Plus, Target, AlertTriangle, CheckCircle, Edit2 } from 'lucide-react';

const Budgets = () => {
  const dispatch = useDispatch();
  const { items: accounts, loading: accountsLoading } = useSelector(state => state.accounts);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [filterMonthYear, setFilterMonthYear] = useState(new Date().toISOString().substring(0, 7));
  
  const [formData, setFormData] = useState({
    limitAmount: '',
    categoryId: '',
    monthYear: new Date().toISOString().substring(0, 7)
  });

  const handleOpenCreateModal = () => {
    setFormData({ limitAmount: '', categoryId: '', monthYear: filterMonthYear });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditBudget = (budget) => {
    const monthStr = budget.month.toString().padStart(2, '0');
    setFormData({
      limitAmount: budget.limitAmount,
      categoryId: budget.categoryId,
      monthYear: `${budget.year}-${monthStr}`
    });
    setIsEditing(true);
    setShowModal(true);
  };

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
    dispatch(fetchAccounts());
  }, [fetchData, dispatch]);

  const totalFunds = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0);
  
  // The true obligation is the unspent portion of the allocated budgets.
  const remainingBudgetObligations = budgets.reduce((sum, b) => {
    return sum + Math.max(0, Number(b.limitAmount || 0) - Number(b.spentAmount || 0));
  }, 0);
  
  const currentTotalBudgetLimits = budgets.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);
  
  const readyToAssign = Math.max(0, totalFunds - remainingBudgetObligations);
  const fundingGap = Math.max(0, remainingBudgetObligations - totalFunds);

  const parsedLimit = parseFloat(formData.limitAmount);
  const normalizedLimit = Number.isFinite(parsedLimit) ? parsedLimit : 0;
  
  // Funding Gap Warning instead of strict block
  const isExceedingFunds = formData.limitAmount && normalizedLimit > readyToAssign;

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const [yearStr, monthStr] = formData.monthYear.split('-');
      await budgetService.createBudget({
        categoryId: formData.categoryId,
        limitAmount: normalizedLimit,
        month: parseInt(monthStr, 10),
        year: parseInt(yearStr, 10)
      });
      setShowModal(false);
      fetchData();
      toast.success(isEditing ? 'Budget updated successfully' : 'Budget created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating budget');
    }
  };

  if (loading || accountsLoading) return <div className="loading">Loading Budgets...</div>;

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
          <button className="btn-primary glass" onClick={handleOpenCreateModal}>
            <Plus size={20} />
            <span>Set Budget</span>
          </button>
        </div>
      </header>

      {/* Funding Gap / Ready to Assign Dashboard */}
      <div className="glass card animate-slide-up" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: fundingGap > 0 ? '6px solid #ef4444' : '6px solid #10b981' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            {fundingGap > 0 ? (
               <>
                 <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
                   <AlertTriangle size={24} /> Funding Gap: ₱{fundingGap.toLocaleString()}
                 </h2>
                 <p className="text-muted" style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                   You have budgeted <strong>₱{fundingGap.toLocaleString()}</strong> more than you possess across all accounts. You are relying on expected income to fulfill these limits.
                 </p>
               </>
            ) : (
               <>
                 <h2 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>
                   <CheckCircle size={24} /> Ready to Assign: ₱{readyToAssign.toLocaleString()}
                 </h2>
                 <p className="text-muted" style={{ margin: 0, lineHeight: 1.5, fontSize: '0.95rem' }}>
                   You have <strong>₱{readyToAssign.toLocaleString()}</strong> in unallocated cash available to assign to budget categories.
                 </p>
               </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '12px' }}>
             <div>
               <p className="text-muted" style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Balances</p>
               <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>₱{totalFunds.toLocaleString()}</h3>
             </div>
             <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
             <div>
               <p className="text-muted" style={{ margin: '0 0 0.4rem 0', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unspent Budgets</p>
               <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>₱{remainingBudgetObligations.toLocaleString()}</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="budgets-grid">
        {budgets.length > 0 ? (
          budgets.map((b) => {
            const percentage = Math.min((b.spentAmount / b.limitAmount) * 100, 100);
            const isOver = b.spentAmount > b.limitAmount;
            
            return (
              <div key={b.id} className="glass card budget-card">
                <div className="budget-header">
                  <h3>{b.categoryName || 'Unknown Category'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`status-badge ${isOver ? 'danger' : 'success'}`}>
                      {isOver ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
                      {isOver ? 'Over Budget' : 'On Track'}
                    </span>
                    <button 
                      onClick={() => handleEditBudget(b)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                      title="Edit Budget"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
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
              onClick={handleOpenCreateModal}
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
            <h2>{isEditing ? 'Adjust Category Budget' : 'Set Category Budget'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                    disabled={isEditing}
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
                  {isExceedingFunds && (
                    <small style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#f59e0b', fontSize: '0.8rem' }}>
                      <AlertTriangle size={14} /> 
                      Warning: This allocation exceeds current cash and will increase your Funding Gap.
                    </small>
                  )}
                </div>
                <div className="form-group full-width">
                  <label>Target Month</label>
                  <input 
                    type="month" 
                    value={formData.monthYear}
                    onChange={(e) => setFormData({...formData, monthYear: e.target.value})}
                    required 
                    disabled={isEditing}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{isEditing ? 'Save Changes' : 'Create Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
