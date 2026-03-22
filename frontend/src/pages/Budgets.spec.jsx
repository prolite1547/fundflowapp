import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Budgets from './Budgets';

const mockGetBudgets = vi.fn();
const mockGetCategories = vi.fn();
const mockCreateBudget = vi.fn();

vi.mock('../services/api', () => ({
  budgetService: {
    getBudgets: (...args) => mockGetBudgets(...args),
    createBudget: (...args) => mockCreateBudget(...args),
  },
  categoryService: {
    getCategories: (...args) => mockGetCategories(...args),
  },
}));

vi.mock('../store/slices/accountsSlice', () => ({
  fetchAccounts: () => ({ type: 'accounts/fetchAccounts' }),
}));

const mockAccounts = [
  { id: 'a1', name: 'Checkings', balance: 20000 }
];

const mockBudget = {
  id: 'b1',
  categoryName: 'Groceries',
  spentAmount: 3000,
  limitAmount: 5000,
  remainingAmount: 2000,
};

const overBudget = {
  id: 'b2',
  categoryName: 'Dining',
  spentAmount: 8000,
  limitAmount: 5000,
  remainingAmount: -3000,
};

const mockExpenseCategories = [
  { id: 'c1', name: 'Groceries', type: 'EXPENSE' },
];

const createStore = (accounts = mockAccounts, loading = false) =>
  configureStore({
    reducer: {
      accounts: () => ({ items: accounts, loading }),
    },
  });

const renderBudgets = (accounts = mockAccounts, accountsLoading = false) =>
  render(
    <Provider store={createStore(accounts, accountsLoading)}>
      <MemoryRouter>
        <Budgets />
      </MemoryRouter>
    </Provider>
  );

describe('Budgets page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetBudgets.mockResolvedValue({ data: [mockBudget] });
    mockGetCategories.mockResolvedValue({ data: mockExpenseCategories });
  });

  it('shows loading state initially', () => {
    mockGetBudgets.mockImplementation(() => new Promise(() => {}));
    mockGetCategories.mockImplementation(() => new Promise(() => {}));
    renderBudgets();
    expect(screen.getByText('Loading Budgets...')).toBeInTheDocument();
  });

  it('renders the Budgets heading after load', async () => {
    renderBudgets();
    await waitFor(() => expect(screen.getByText('Budgets')).toBeInTheDocument());
  });

  it('renders budget cards with data', async () => {
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });
  });

  it('shows On Track status for budgets within limit', async () => {
    renderBudgets();
    await waitFor(() => expect(screen.getByText('On Track')).toBeInTheDocument());
  });

  it('shows Over Budget status for exceeded budgets', async () => {
    mockGetBudgets.mockResolvedValue({ data: [overBudget] });
    renderBudgets();
    await waitFor(() => expect(screen.getByText('Over Budget')).toBeInTheDocument());
  });

  it('shows empty state when no budgets exist', async () => {
    mockGetBudgets.mockResolvedValue({ data: [] });
    renderBudgets();
    await waitFor(() => {
      expect(screen.getByText('No budgets found for this month.')).toBeInTheDocument();
    });
  });

  it('renders the Set Budget button', async () => {
    renderBudgets();
    await waitFor(() => screen.getByText('Budgets'));
    expect(screen.getByRole('button', { name: /set budget/i })).toBeInTheDocument();
  });

  it('opens the budget modal when Set Budget is clicked', async () => {
    renderBudgets();
    await waitFor(() => screen.getByText('Budgets'));
    await userEvent.click(screen.getByRole('button', { name: /set budget/i }));
    expect(screen.getByText('Set Category Budget')).toBeInTheDocument();
  });

  it('closes the modal on Cancel click', async () => {
    renderBudgets();
    await waitFor(() => screen.getByText('Budgets'));
    await userEvent.click(screen.getByRole('button', { name: /set budget/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText('Set Category Budget')).not.toBeInTheDocument();
  });

  it('calls budgetService.createBudget on form submit', async () => {
    mockCreateBudget.mockResolvedValue({});
    renderBudgets();
    await waitFor(() => screen.getByText('Budgets'));

    await userEvent.click(screen.getByRole('button', { name: /set budget/i }));

    // Select category (first combobox in the modal form)
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[0], 'c1');

    // Enter limit amount (valid amount that doesn't exceed 20,000 balance minus 5000 existing limit = 15000)
    const limitInput = screen.getAllByRole('spinbutton')[0];
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '10000');

    await userEvent.click(screen.getByRole('button', { name: /create budget/i }));

    await waitFor(() => {
      expect(mockCreateBudget).toHaveBeenCalledWith(
        expect.objectContaining({ limitAmount: 10000 })
      );
    });
  });

  it('shows error if new limit exceeds available total funds', async () => {
    renderBudgets();
    await waitFor(() => screen.getByText('Budgets'));

    await userEvent.click(screen.getByRole('button', { name: /set budget/i }));

    const limitInput = screen.getAllByRole('spinbutton')[0];
    await userEvent.clear(limitInput);
    
    // Existing limit is 5,000, Total accounts balance is 20,000 -> Available = 15,000.
    // Entering 15,001 should trigger validation.
    await userEvent.type(limitInput, '15001');

    await waitFor(() => {
      expect(screen.getByText(/Limit exceeds available funds/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create budget/i })).toBeDisabled();
    });
  });
});
