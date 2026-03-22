import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

// Mock all recharts components to avoid canvas/SVG complexity in test environment
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const mockGetSummary = vi.fn();
const mockGetTrend = vi.fn();
const mockGetBreakdown = vi.fn();

vi.mock('../services/api', () => ({
  reportService: {
    getSummary: (...args) => mockGetSummary(...args),
    getTrend: (...args) => mockGetTrend(...args),
    getBreakdown: (...args) => mockGetBreakdown(...args),
  },
}));

const mockSummary = {
  totalIncome: 10000,
  totalExpense: 5000,
  totalInvestment: 2000,
  netSavings: 3000,
  savingsRate: 30.0,
};

const renderDashboard = () =>
  render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSummary.mockResolvedValue({ data: mockSummary });
    mockGetTrend.mockResolvedValue({ data: [] });
    mockGetBreakdown.mockResolvedValue({ data: [] });
  });

  it('shows a loading state initially', () => {
    mockGetSummary.mockImplementation(() => new Promise(() => {}));
    mockGetTrend.mockImplementation(() => new Promise(() => {}));
    mockGetBreakdown.mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
  });

  it('renders the Financial Overview heading after load', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Financial Overview')).toBeInTheDocument();
    });
  });

  it('renders metric cards with correct values', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Total Income')).toBeInTheDocument();
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
      expect(screen.getByText('Total Investment')).toBeInTheDocument();
      expect(screen.getByText('Net Savings')).toBeInTheDocument();
      expect(screen.getByText('Savings Rate')).toBeInTheDocument();
    });
  });

  it('renders the Monthly Trend chart section', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Monthly Trend')).toBeInTheDocument();
    });
  });

  it('renders Expense Breakdown by default', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Expense Breakdown')).toBeInTheDocument();
    });
  });

  it('switches to Investment Breakdown when Investment tab is clicked', async () => {
    renderDashboard();
    await waitFor(() => screen.getByText('Expense Breakdown'));

    await userEvent.click(screen.getByRole('button', { name: /investment/i }));

    await waitFor(() => {
      expect(screen.getByText('Investment Breakdown')).toBeInTheDocument();
    });
  });

  it('calls reportService with correct monthly params', async () => {
    renderDashboard();
    await waitFor(() => expect(mockGetSummary).toHaveBeenCalled());
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    expect(mockGetSummary).toHaveBeenCalledWith('monthly', { year, month });
    expect(mockGetTrend).toHaveBeenCalledWith('monthly', { year, month });
  });
});
