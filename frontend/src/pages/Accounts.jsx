import React, { useState, useEffect } from 'react';
import { accountService } from '../services/api';
import { Plus, Wallet, Building2, CreditCard, Landmark, Loader2 } from 'lucide-react';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH',
    initialBalance: 0.00
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await accountService.getAccounts();
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await accountService.createAccount({
        ...formData,
        initialBalance: parseFloat(formData.initialBalance)
      });
      setShowModal(false);
      fetchAccounts();
      setFormData({ name: '', type: 'CASH', initialBalance: 0.00 });
    } catch (err) {
      alert('Error creating account');
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'BANK': return <Landmark size={24} />;
      case 'CREDIT_CARD': return <CreditCard size={24} />;
      case 'INVESTMENT': return <Building2 size={24} />;
      default: return <Wallet size={24} />;
    }
  };

  if (loading) return <div className="loading">Loading Accounts...</div>;

  return (
    <div className="accounts-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Accounts</h1>
          <p className="text-muted">Manage your financial sources.</p>
        </div>
        <button className="btn-primary glass" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>New Account</span>
        </button>
      </header>

      <div className="accounts-grid">
        {accounts.map((acc) => (
          <div key={acc.id} className="glass card account-card">
            <div className="acc-icon">{getIcon(acc.type)}</div>
            <div className="acc-info">
              <h3>{acc.name}</h3>
              <span className="badge glass">{acc.type}</span>
            </div>
            <div className="acc-balance">
              <span className="metric-label">Balance</span>
              <span className="metric-value">₱{(acc.balance || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Account Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <h2>New Account</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Account Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                    placeholder="e.g. My Savings"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK">Bank Account</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Initial Balance</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({...formData, initialBalance: e.target.value})}
                    required 
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
