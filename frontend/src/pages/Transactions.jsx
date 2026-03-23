import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { transactionService, categoryService } from "../services/api";
import { fetchAccounts } from "../store/slices/accountsSlice";
import { fetchTransactions, addTransactionAction } from "../store/slices/transactionsSlice";
import { fetchCategories } from "../store/slices/categoriesSlice";
import { fetchBudgets } from "../store/slices/budgetsSlice";
import { Plus, Search, Filter, X, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from 'react-hot-toast';

const TYPE_OPTIONS = ["ALL", "EXPENSE", "INCOME", "INVESTMENT", "TRANSFER"];

const Transactions = () => {
  const dispatch = useDispatch();
  const { items: accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { items: transactions, loading: txLoading } = useSelector((state) => state.transactions);
  const { items: categories, loading: catLoading } = useSelector((state) => state.categories);
  const { items: budgets, loading: budgetsLoading } = useSelector((state) => state.budgets);

  const [showModal, setShowModal] = useState(false);
  const [confirmBudgetModal, setConfirmBudgetModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    categoryId: "",
    accountId: "",
    destinationAccountId: "",
    type: "EXPENSE",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchTransactions());
    dispatch(fetchCategories());
    const now = new Date();
    dispatch(fetchBudgets({ month: now.getMonth() + 1, year: now.getFullYear() }));
  }, [dispatch]);

  const resetForm = () => {
    setFormData({
      amount: "",
      description: "",
      categoryId: "",
      accountId: "",
      destinationAccountId: "",
      type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const parsedAmount = parseFloat(formData.amount);
  const normalizedAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const requiresAvailableBalance = [
    "EXPENSE",
    "INVESTMENT",
    "TRANSFER",
  ].includes(formData.type);
  const selectedAccount = accounts.find(
    (account) => String(account.id) === String(formData.accountId),
  );
  const selectedAccountBalance = Number(selectedAccount?.balance ?? 0);
  const hasInsufficientBalance =
    requiresAvailableBalance &&
    formData.accountId &&
    normalizedAmount > 0 &&
    normalizedAmount > selectedAccountBalance;
  const balanceValidationMessage = hasInsufficientBalance
    ? `Insufficient balance. Available: ₱${selectedAccountBalance.toLocaleString()}`
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (hasInsufficientBalance) {
      return;
    }

    const transactionPayload = {
      ...formData,
      amount: normalizedAmount,
      date: new Date(formData.date).toISOString(),
    };

    if (formData.type === "EXPENSE" && formData.categoryId) {
      const budget = budgets.find((b) => b.categoryId === formData.categoryId);
      if (budget) {
        const projectedSpent = budget.spentAmount + normalizedAmount;
        if (projectedSpent > budget.limitAmount) {
          setPendingTransaction(transactionPayload);
          setShowModal(false);
          setConfirmBudgetModal(true);
          return;
        }
      }
    }

    executeTransaction(transactionPayload);
  };

  const executeTransaction = async (payload) => {
    try {
      await dispatch(addTransactionAction(payload)).unwrap();
      setShowModal(false);
      resetForm();
      // Re-fetch budgets to update remaining amounts
      const now = new Date();
      dispatch(fetchBudgets({ month: now.getMonth() + 1, year: now.getFullYear() }));
      toast.success('Transaction created successfully');
    } catch (err) {
      toast.error(err || "Error creating transaction");
    }
  };

  const filtered = transactions.filter((t) => {
    const matchesType = filterType === "ALL" || t.type === filterType;
    const matchesSearch =
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filtered.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Reset to page 1 on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery]);

  const isLoading = accountsLoading || txLoading || catLoading || budgetsLoading;

  if (isLoading) return <div className="loading">Loading Transactions...</div>;

  const totalAllocatedBudget = budgets.reduce((sum, b) => sum + b.limitAmount, 0);
  const totalSpentBudget = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalBudgetLeft = Math.max(0, totalAllocatedBudget - totalSpentBudget);
  const globalBudgetPercentage = totalAllocatedBudget > 0 ? (totalSpentBudget / totalAllocatedBudget) * 100 : 0;

  const activeBudget = formData.type === 'EXPENSE' && formData.categoryId 
    ? budgets.find(b => b.categoryId === formData.categoryId) 
    : null;

  const currentSpent = activeBudget ? activeBudget.spentAmount : 0;
  const projectedSpentInline = activeBudget ? currentSpent + normalizedAmount : 0;
  const inlinePercentage = activeBudget ? (projectedSpentInline / activeBudget.limitAmount) * 100 : 0;

  const isOverspending = inlinePercentage > 100;
  const isHardWarning = inlinePercentage >= 90 && inlinePercentage <= 100;
  const isSoftWarning = inlinePercentage >= 70 && inlinePercentage < 90;

  return (
    <div className="transactions-container animate-fade-in">
      <header className="page-header">
        <div>
          <h1 className="text-gradient">Transactions</h1>
          <p className="text-muted">Keep track of every penny.</p>
        </div>
        <button
          className="btn-primary glass"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} />
          <span>Add Transaction</span>
        </button>
      </header>

      {/* Monthly Budget Summary */}
      <div className="glass card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-color)' }}>Monthly Allocated Budget</h3>
            <p className="text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>Total limit set across all categories</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ margin: 0, color: 'var(--text-color)' }}>₱{totalBudgetLeft.toLocaleString()} <span style={{fontSize:'0.9rem', color:'var(--text-muted)', fontWeight:'normal'}}>left</span></h3>
            <p className="text-muted" style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>of ₱{totalAllocatedBudget.toLocaleString()}</p>
          </div>
        </div>
        <div className="progress-bg" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min(globalBudgetPercentage, 100)}%`, 
              height: '100%', 
              background: globalBudgetPercentage >= 90 ? '#ef4444' : globalBudgetPercentage >= 70 ? '#f59e0b' : '#10b981',
              transition: 'all 0.3s ease'
             }}
          ></div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass card trans-list">
        <div className="list-header">
          <div className="search-bar">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <div style={{ position: "relative" }} ref={filterRef}>
            <button
              className={`btn-icon${filterType !== "ALL" ? " active-filter" : ""}`}
              onClick={() => setShowFilter((v) => !v)}
              title="Filter by type"
            >
              <Filter size={18} />
            </button>
            {showFilter && (
              <div className="filter-dropdown glass animate-slide-up">
                <p className="filter-label">Filter by type</p>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    className={`filter-option${filterType === opt ? " selected" : ""}`}
                    onClick={() => {
                      setFilterType(opt);
                      setShowFilter(false);
                    }}
                  >
                    {opt === "ALL"
                      ? "All Types"
                      : opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {filterType !== "ALL" && (
          <div
            style={{
              padding: "0.5rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Showing:
            </span>
            <span className="badge glass" style={{ fontSize: "0.75rem" }}>
              {filterType}
            </span>
            <button
              onClick={() => setFilterType("ALL")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                display: "flex",
                padding: 0,
              }}
            >
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
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: "2rem",
                    }}
                  >
                    No transactions found.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => (
                  <tr key={t.id}>
                    <td>{new Date(t.date).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge ${t.type.toLowerCase()}`}
                        style={{
                          fontSize: "0.65rem",
                          padding: "0.15rem 0.5rem",
                        }}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td>
                      <span className="badge glass">{t.categoryName}</span>
                    </td>
                    <td>{t.description}</td>
                    <td>{t.accountName}</td>
                    <td
                      className={
                        t.type === "INCOME"
                          ? "text-success"
                          : t.type === "TRANSFER"
                            ? "text-muted"
                            : "text-danger-sm"
                      }
                    >
                      {t.type === "INCOME"
                        ? "+"
                        : t.type === "TRANSFER"
                          ? ""
                          : "-"}
                      ₱{t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination UI */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="btn-pagination"
            >
              Previous
            </button>
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`btn-page ${currentPage === i + 1 ? "active" : ""}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                        categoryId: "",
                        destinationAccountId:
                          e.target.value === "TRANSFER"
                            ? formData.destinationAccountId
                            : "",
                      })
                    }
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                    <option value="INVESTMENT">Investment</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter((c) => c.type === formData.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    {formData.type === "TRANSFER" ? "From Account" : "Account"}
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountId: e.target.value,
                        destinationAccountId:
                          e.target.value === formData.destinationAccountId
                            ? ""
                            : formData.destinationAccountId,
                      })
                    }
                    required
                  >
                    <option value="">Select Account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.type === "TRANSFER" && (
                  <div className="form-group">
                    <label>To Account</label>
                    <select
                      value={formData.destinationAccountId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          destinationAccountId: e.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Select Destination</option>
                      {accounts
                        .filter((a) => a.id !== formData.accountId)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                  {balanceValidationMessage && (
                    <small className="text-danger-sm">
                      {balanceValidationMessage}
                    </small>
                  )}
                </div>
                {activeBudget && formData.amount && Number(formData.amount) > 0 && (
                  <div className="form-group full-width">
                    <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '8px', border: isOverspending ? '1px solid #ef4444' : isHardWarning ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.6rem', color: isOverspending ? '#ef4444' : isHardWarning ? '#f59e0b' : 'var(--text-color)' }}>
                         <span style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                           {(isOverspending || isHardWarning) && <AlertTriangle size={16} />} 
                           Category Budget ({activeBudget.categoryName})
                         </span>
                         <span style={{ fontWeight: '500' }}>₱{projectedSpentInline.toLocaleString()} / ₱{activeBudget.limitAmount.toLocaleString()}</span>
                       </div>
                       <div className="progress-bg" style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                         <div 
                           className="progress-fill" 
                           style={{ 
                             width: `${Math.min(inlinePercentage, 100)}%`, 
                             height: '100%', 
                             background: isOverspending ? '#ef4444' : isHardWarning ? '#ef4444' : isSoftWarning ? '#f59e0b' : '#10b981',
                             transition: 'all 0.3s ease'
                            }}
                         ></div>
                       </div>
                       {isOverspending && <small style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem' }}>You are exceeding your budget!</small>}
                       {isHardWarning && <small style={{ color: '#f59e0b', display: 'block', marginTop: '0.5rem' }}>Warning: Nearing budget limit (90%+)</small>}
                       {isSoftWarning && <small style={{ color: '#f59e0b', display: 'block', marginTop: '0.5rem' }}>Warning: Budget usage at 70%+</small>}
                    </div>
                  </div>
                )}
                <div className="form-group full-width">
                  <label>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={hasInsufficientBalance}
                >
                  Save Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Overspending Interception Modal */}
      {confirmBudgetModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <AlertCircle size={48} color="#ef4444" />
            </div>
            <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Budget Exceeded</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
              This transaction will exceed your allocated monthly budget for this category. Are you sure you wish to proceed?
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => {
                  setConfirmBudgetModal(false);
                  setShowModal(true);
              }}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#ef4444', borderColor: '#ef4444' }}
                onClick={() => {
                  setConfirmBudgetModal(false);
                  executeTransaction(pendingTransaction);
                }}
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
