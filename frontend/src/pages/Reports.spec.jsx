import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Reports from './Reports';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
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

const mockData = {
  totalIncome: 15000,
  totalExpense: 7000,
  totalInvestment: 2000,
  netSavings: 6000,
};

const renderReports = () =>
  render(
    <MemoryRouter>
      <Reports />
    </MemoryRouter>
  );

describe('Reports page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSummary.mockResolvedValue({ data: mockData });
    mockGetTrend.mockResolvedValue({ data: [] });
    mockGetBreakdown.mockResolvedValue({ data: [] });
  });

  it('renders the Financial Reports heading', async () => {
    renderReports();
    expect(screen.getByText('Financial Reports')).toBeInTheDocument();
  });

  it('shows period tabs (Weekly, Monthly, Yearly)', async () => {
    renderReports();
    expect(screen.getByRole('button', { name: /weekly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /monthly/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yearly/i })).toBeInTheDocument();
  });

  it('shows loading state while fetching', () => {
    mockGetSummary.mockImplementation(() => new Promise(() => {}));
    mockGetTrend.mockImplementation(() => new Promise(() => {}));
    mockGetBreakdown.mockImplementation(() => new Promise(() => {}));
    renderReports();
    expect(screen.getByText('Generating Report...')).toBeInTheDocument();
  });

  it('renders summary metric cards after load', async () => {
    renderReports();
    await waitFor(() => {
      expect(screen.getByText('Monthly Income')).toBeInTheDocument();
      expect(screen.getByText('Monthly Expenses')).toBeInTheDocument();
      expect(screen.getByText('Monthly Investments')).toBeInTheDocument();
      expect(screen.getByText('Monthly Net Savings')).toBeInTheDocument();
    });
  });

  it('switches to Yearly period when Yearly tab is clicked', async () => {
    renderReports();
    await waitFor(() => screen.getByText('Financial Reports'));

    await userEvent.click(screen.getByRole('button', { name: /yearly/i }));

    await waitFor(() => {
      expect(screen.getByText('Annual Income')).toBeInTheDocument();
    });
  });

  it('switches to Weekly period labels', async () => {
    renderReports();
    await waitFor(() => screen.getByText('Financial Reports'));

    await userEvent.click(screen.getByRole('button', { name: /weekly/i }));

    await waitFor(() => {
      expect(screen.getByText("This Week's Income")).toBeInTheDocument();
    });
  });

  it('renders the breakdown type toggle buttons', async () => {
    renderReports();
    await waitFor(() => screen.getByText('Monthly Income'));

    // There are two sections with Expense/Investment buttons
    const expenseButtons = screen.getAllByRole('button', { name: /expense/i });
    expect(expenseButtons.length).toBeGreaterThan(0);
  });

  it('calls reportService.getSummary on mount', async () => {
    renderReports();
    await waitFor(() => expect(mockGetSummary).toHaveBeenCalled());
    expect(mockGetSummary).toHaveBeenCalledWith('monthly', expect.objectContaining({ year: expect.any(Number), month: expect.any(Number) }));
  });

  it('navigates date backward with prev button', async () => {
    const { container } = renderReports();
    await waitFor(() => screen.getByText('Monthly Income'));

    const prevBtn = container.querySelector('.date-nav button:first-child');
    expect(prevBtn).not.toBeNull();
    await userEvent.click(prevBtn);
    await waitFor(() => expect(mockGetSummary).toHaveBeenCalledTimes(2));
  });
});
