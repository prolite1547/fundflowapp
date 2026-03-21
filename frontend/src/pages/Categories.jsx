import React, { useState, useEffect } from 'react';
import { categoryService } from '../services/api';
import { Plus, Tag } from 'lucide-react';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'EXPENSE' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await categoryService.createCategory(formData);
      setShowModal(false);
      fetchCategories();
      setFormData({ name: '', type: 'EXPENSE' });
    } catch (err) {
      alert('Error creating category');
    }
  };

  const TYPE_FALLBACK_COLORS = {
    INCOME: '#10b981',
    INVESTMENT: '#8b5cf6',
    TRANSFER: '#94a3b8',
    EXPENSE: '#ef4444',
  };

  const getCategoryDot = (cat) => {
    const color = cat.color || TYPE_FALLBACK_COLORS[cat.type] || '#6366f1';
    return (
      <span style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
    );
  };

  if (loading) return <div className="loading">Loading Categories...</div>;

  return (
    <div className="categories-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Categories</h1>
          <p className="text-muted">Organize your finances with custom labels.</p>
        </div>
        <button className="btn-primary glass" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>New Category</span>
        </button>
      </header>

      <div className="categories-grid">
        {['EXPENSE', 'INCOME', 'INVESTMENT', 'TRANSFER'].map(type => (
          <div key={type} className="category-section">
            <h3 className="section-title">{type}</h3>
            <div className="category-list">
              {categories.filter(c => c.type === type).map(cat => (
                <div key={cat.id} className="glass card category-item">
                  <div className="cat-icon-bg">{getCategoryDot(cat)}</div>
                  <span>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up">
            <h2>New Category</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required 
                    placeholder="e.g. Groceries"
                  />
                </div>
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
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
