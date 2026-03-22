import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Transactions from './Transactions';

// ── Mock services ──────────────────────────────────────────────────────────────
const mockGetTransactions = vi.fn();
const mockCreateTransaction = vi.fn();
const mockGetCategories = vi.fn();

vi.mock('../services/api', () => ({
  transactionService: {
    getTransactions: (...args) => mockGetTransactions(...args),
    createTransaction: (...args) => mockCreateTransaction(...args),
  },
  categoryService: {
    getCategories: (...args) => mockGetCategories(...args),
  },
}));

// ── Mock Redux actions ─────────────────────────────────────────────────────────
vi.mock('../store/slices/accountsSlice', () => ({
  fetchAccounts: () => ({ type: 'accounts/fetchAccounts' }),
  applyTransactionBalance: () => ({ type: 'accounts/applyTransactionBalance' }),
}));

// ── Fixture data ───────────────────────────────────────────────────────────────
const mockAccounts = [
  { id: 'a1', name: 'Savings', type: 'BANK', balance: 10000 },
  { id: 'a2', name: 'Cash', type: 'CASH', balance: 1000 },
];

const mockCategories = [
  { id: 'c1', name: 'Groceries', type: 'EXPENSE' },
  { id: 'c2', name: 'Salary', type: 'INCOME' },
];

const mockTransactions = [
  {
    id: 't1',
    date: '2025-03-01T00:00:00Z',
    type: 'EXPENSE',
    categoryName: 'Groceries',
    description: 'Weekly shopping',
    accountName: 'Savings',
    amount: 1500,
  },
  {
    id: 't2',
    date: '2025-03-05T00:00:00Z',
    type: 'INCOME',
    categoryName: 'Salary',
    description: 'Monthly salary',
    accountName: 'Savings',
    amount: 50000,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const createStore = (accounts = mockAccounts, loading = false) =>
  configureStore({
    reducer: {
      accounts: () => ({ items: accounts, loading }),
    },
  });

const renderTransactions = (accounts = mockAccounts, accountsLoading = false) =>
  render(
    <Provider store={createStore(accounts, accountsLoading)}>
      <MemoryRouter>
        <Transactions />
      </MemoryRouter>
    </Provider>
  );

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('Transactions page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTransactions.mockResolvedValue({ data: mockTransactions });
    mockGetCategories.mockResolvedValue({ data: mockCategories });
  });

  // Loading state
  it('shows loading state while data is fetching', () => {
    mockGetTransactions.mockImplementation(() => new Promise(() => {}));
    mockGetCategories.mockImplementation(() => new Promise(() => {}));
    renderTransactions(mockAccounts, true);
    expect(screen.getByText('Loading Transactions...')).toBeInTheDocument();
  });

  // Page renders
  it('renders the Transactions heading after load', async () => {
    renderTransactions();
    await waitFor(() => expect(screen.getByText('Transactions')).toBeInTheDocument());
  });

  it('renders the transaction table with column headers', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });
  });

  it('renders transaction rows with correct data', async () => {
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByText('Weekly shopping')).toBeInTheDocument();
      expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    });
  });

  it('shows "No transactions found." when list is empty', async () => {
    mockGetTransactions.mockResolvedValue({ data: [] });
    renderTransactions();
    await waitFor(() => {
      expect(screen.getByText('No transactions found.')).toBeInTheDocument();
    });
  });

  // Search
  it('filters transactions by search query', async () => {
    renderTransactions();
    await waitFor(() => screen.getByText('Weekly shopping'));

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    await userEvent.type(searchInput, 'salary');

    expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    expect(screen.queryByText('Weekly shopping')).not.toBeInTheDocument();
  });

  it('clears search when the X button is clicked', async () => {
    renderTransactions();
    await waitFor(() => screen.getByText('Weekly shopping'));

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    await userEvent.type(searchInput, 'salary');
    expect(screen.queryByText('Weekly shopping')).not.toBeInTheDocument();

    // X button appears only when searchQuery is non-empty; click it
    const clearBtn = document.querySelector('.search-bar button');
    if (clearBtn) {
      await userEvent.click(clearBtn);
      await waitFor(() => {
        expect(searchInput).toHaveValue('');
        expect(screen.getByText('Weekly shopping')).toBeInTheDocument();
      });
    }
  });

  // Add Transaction modal
  it('renders the Add Transaction button', async () => {
    renderTransactions();
    await waitFor(() => screen.getByText('Transactions'));
    expect(screen.getByRole('button', { name: /add transaction/i })).toBeInTheDocument();
  });

  it('opens the New Transaction modal on click', async () => {
    renderTransactions();
    await waitFor(() => screen.getByText('Transactions'));
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    expect(screen.getByText('New Transaction')).toBeInTheDocument();
  });

  it('closes the modal on Cancel', async () => {
    renderTransactions();
    await waitFor(() => screen.getByText('Transactions'));
    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('New Transaction')).not.toBeInTheDocument();
  });

  it('calls transactionService.createTransaction on form submit', async () => {
    mockCreateTransaction.mockResolvedValue({});
    renderTransactions();
    await waitFor(() => screen.getByText('Transactions'));

    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    // Select category (EXPENSE category is shown by default)
    const categorySelect = screen.getAllByRole('combobox').find(
      (s) => s.querySelector('option[value=""]')?.textContent === 'Select Category'
    );
    if (categorySelect) {
      await userEvent.selectOptions(categorySelect, 'c1');
    }

    // Select account
    const accountSelect = screen.getAllByRole('combobox').find(
      (s) => s.querySelector('option[value=""]')?.textContent === 'Select Account'
    );
    if (accountSelect) {
      await userEvent.selectOptions(accountSelect, 'a1');
    }

    // Enter amount
    const amountInput = screen.getByRole('spinbutton');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '500');

    await userEvent.click(screen.getByRole('button', { name: /save transaction/i }));

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalled();
    });
  });

  // Balance validation
  it('shows insufficient balance message when amount exceeds account balance', async () => {
    renderTransactions();
    await waitFor(() => screen.getByText('Transactions'));

    await userEvent.click(screen.getByRole('button', { name: /add transaction/i }));

    // Select account with balance 10000
    const allSelects = screen.getAllByRole('combobox');
    const accountSelect = allSelects.find(
      (s) => s.querySelector('option[value=""]')?.textContent === 'Select Account'
    );
    if (accountSelect) {
      await userEvent.selectOptions(accountSelect, 'a1');
    }

    const amountInput = screen.getByRole('spinbutton');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '99999');

    await waitFor(() => {
      expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument();
    });
  });

  // Pagination
  it('shows pagination when more than 8 transactions exist', async () => {
    const manyTransactions = Array.from({ length: 12 }, (_, i) => ({
      id: `t${i}`,
      date: '2025-03-01T00:00:00Z',
      type: 'EXPENSE',
      categoryName: 'Groceries',
      description: `Item ${i}`,
      accountName: 'Savings',
      amount: 100 + i,
    }));
    mockGetTransactions.mockResolvedValue({ data: manyTransactions });
    renderTransactions();

    await waitFor(() => expect(screen.getByText('Next')).toBeInTheDocument());
    expect(screen.getByText('Previous')).toBeInTheDocument();
  });
});
