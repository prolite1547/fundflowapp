import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';

// Mock clearSession and navigation – we don't want real side-effects
vi.mock('../utils/session', () => ({
  clearSession: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderSidebar = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Sidebar />
    </MemoryRouter>
  );

describe('Sidebar', () => {
  it('renders the FundFlow brand name', () => {
    renderSidebar();
    expect(screen.getByText('FundFlow')).toBeInTheDocument();
  });

  it('renders all navigation links', () => {
    renderSidebar();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Accounts')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Budgets')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders the Logout button', () => {
    renderSidebar();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('calls clearSession and navigates to /login on logout click', async () => {
    const { clearSession } = await import('../utils/session');
    renderSidebar();
    await userEvent.click(screen.getByText('Logout'));
    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows and hides the mobile toggle icon', async () => {
    const { container } = renderSidebar();
    // The mobile toggle button is the first button rendered
    const toggleBtn = container.querySelector('.mobile-toggle');
    expect(toggleBtn).not.toBeNull();
    // sidebar does not have 'open' class initially
    expect(container.querySelector('.sidebar')).not.toHaveClass('open');

    // Click to open
    await userEvent.click(toggleBtn);
    expect(container.querySelector('.sidebar')).toHaveClass('open');

    // Click again to close
    await userEvent.click(toggleBtn);
    expect(container.querySelector('.sidebar')).not.toHaveClass('open');
  });
});
