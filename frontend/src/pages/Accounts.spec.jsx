import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import Accounts from './Accounts';

// Mock services
const mockCreateAccount = vi.fn();
vi.mock('../services/api', () => ({
  accountService: {
    createAccount: (...args) => mockCreateAccount(...args),
    getBalances: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

// Mock Redux actions
vi.mock('../store/slices/accountsSlice', () => ({
  fetchAccounts: () => ({ type: 'accounts/fetchAccounts' }),
}));

const createStore = (accounts = [], loading = false) =>
  configureStore({
    reducer: {
      accounts: () => ({ items: accounts, loading }),
    },
  });

const renderAccounts = (accounts = [], loading = false) =>
  render(
    <Provider store={createStore(accounts, loading)}>
      <MemoryRouter>
        <Accounts />
      </MemoryRouter>
    </Provider>
  );

describe('Accounts page', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state', () => {
    renderAccounts([], true);
    expect(screen.getByText('Loading Accounts...')).toBeInTheDocument();
  });

  it('renders the Accounts heading when loaded', () => {
    renderAccounts([]);
    expect(screen.getByText('Accounts')).toBeInTheDocument();
  });

  it('renders account items from the store', () => {
    const accounts = [
      { id: '1', name: 'Savings', type: 'BANK', balance: 5000 },
      { id: '2', name: 'Cash Wallet', type: 'CASH', balance: 200 },
    ];
    renderAccounts(accounts);
    expect(screen.getByText('Savings')).toBeInTheDocument();
    expect(screen.getByText('Cash Wallet')).toBeInTheDocument();
  });

  it('renders the New Account button', () => {
    renderAccounts([]);
    expect(screen.getByRole('button', { name: /new account/i })).toBeInTheDocument();
  });

  it('opens the modal when New Account is clicked', async () => {
    renderAccounts([]);
    await userEvent.click(screen.getByRole('button', { name: /new account/i }));
    expect(screen.getByRole('heading', { name: 'New Account' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. My Savings')).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    renderAccounts([]);
    await userEvent.click(screen.getByRole('button', { name: /new account/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('heading', { name: 'New Account' })).not.toBeInTheDocument();
  });

  it('calls accountService.createAccount on form submit', async () => {
    mockCreateAccount.mockResolvedValue({});
    renderAccounts([]);

    await userEvent.click(screen.getByRole('button', { name: /new account/i }));
    await userEvent.type(screen.getByPlaceholderText('e.g. My Savings'), 'My Bank');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalled();
    });
  });

  it('displays account type badges', () => {
    const accounts = [{ id: '1', name: 'Card', type: 'CREDIT_CARD', balance: 0 }];
    renderAccounts(accounts);
    expect(screen.getByText('CREDIT_CARD')).toBeInTheDocument();
  });
});
