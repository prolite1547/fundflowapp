import React, { useState, useEffect, useRef } from 'react';
import { transactionService, categoryService, accountService } from '../services/api';
import { Plus, Search, Filter, X } from 'lucide-react';

const TYPE_OPTIONS = ['ALL', 'EXPENSE', 'INCOME', 'INVESTMENT', 'TRANSFER'];

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    categoryId: '',
    accountId: '',
    destinationAccountId: '',
    type: 'EXPENSE',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchData = async () => {
    try {
      const [transRes, catRes, accRes] = await Promise.all([
        transactionService.getTransactions(),
        categoryService.getCategories(),
        accountService.getAccounts()
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await transactionService.createTransaction({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date(formData.date).toISOString()
      });
      setShowModal(false);
      fetchData();
      setFormData({
        amount: '',
        description: '',
        categoryId: '',
        accountId: '',
        destinationAccountId: '',
        type: 'EXPENSE',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      alert('Error creating transaction');
    }
  };

  const filtered = transactions.filter(t => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  if (loading) return <div className="loading">Loading Transactions...</div>;

  return (
    <div className="transactions-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Transactions</h1>
          <p className="text-muted">Keep track of every penny.</p>
        </div>
        <button className="btn-primary glass" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </header>

      {/* Transaction List */}
      <div className="glass card trans-list">
        <div className="list-header">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              className={`btn-icon${filterType !== 'ALL' ? ' active-filter' : ''}`}
              onClick={() => setShowFilter(v => !v)}
              title="Filter by type"
            >
              <Filter size={18} />
            </button>
            {showFilter && (
              <div className="filter-dropdown glass animate-slide-up">
                <p className="filter-label">Filter by type</p>
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    className={`filter-option${filterType === opt ? ' selected' : ''}`}
                    onClick={() => { setFilterType(opt); setShowFilter(false); }}
                  >
                    {opt === 'ALL' ? 'All Types' : opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {filterType !== 'ALL' && (
          <div style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Showing:</span>
            <span className="badge glass" style={{ fontSize: '0.75rem' }}>{filterType}</span>
            <button onClick={() => setFilterType('ALL')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div className="table-responsive">
          <table className="trans-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Account</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No transactions found.</td></tr>
              ) : paginatedTransactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${t.type.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>{t.type}</span>
                  </td>
                  <td><span className="badge glass">{t.categoryName}</span></td>
                  <td>{t.description}</td>
                  <td>{t.accountName}</td>
                  <td className={t.type === 'INCOME' ? 'text-success' : t.type === 'TRANSFER' ? 'text-muted' : 'text-danger'}>
                    {t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '' : '-'}₱{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="btn-pagination"
            >
              Previous
            </button>
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`btn-page ${currentPage === i + 1 ? 'active' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="btn-pagination"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <h2>New Transaction</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type} 
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.filter(c => c.type === formData.type).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>{formData.type === 'TRANSFER' ? 'From Account' : 'Account'}</label>
                  <select 
                    value={formData.accountId}
                    onChange={(e) => setFormData({...formData, accountId: e.target.value})}
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                {formData.type === 'TRANSFER' && (
                  <div className="form-group">
                    <label>To Account</label>
                    <select 
                      value={formData.destinationAccountId}
                      onChange={(e) => setFormData({...formData, destinationAccountId: e.target.value})}
                      required
                    >
                      <option value="">Select Destination</option>
                      {accounts.filter(a => a.id !== formData.accountId).map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group full-width">
                  <label>Description</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
