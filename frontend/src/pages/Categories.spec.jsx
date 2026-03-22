import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Categories from './Categories';

const mockGetCategories = vi.fn();
const mockCreateCategory = vi.fn();

vi.mock('../services/api', () => ({
  categoryService: {
    getCategories: (...args) => mockGetCategories(...args),
    createCategory: (...args) => mockCreateCategory(...args),
  },
}));

const mockCategories = [
  { id: '1', name: 'Groceries', type: 'EXPENSE', color: null },
  { id: '2', name: 'Salary', type: 'INCOME', color: '#10b981' },
  { id: '3', name: 'Stocks', type: 'INVESTMENT', color: null },
  { id: '4', name: 'Internal', type: 'TRANSFER', color: null },
];

const renderCategories = () =>
  render(
    <MemoryRouter>
      <Categories />
    </MemoryRouter>
  );

describe('Categories page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCategories.mockResolvedValue({ data: mockCategories });
  });

  it('shows loading state initially', () => {
    mockGetCategories.mockImplementation(() => new Promise(() => {}));
    renderCategories();
    expect(screen.getByText('Loading Categories...')).toBeInTheDocument();
  });

  it('renders Categories heading after load', async () => {
    renderCategories();
    await waitFor(() => expect(screen.getByText('Categories')).toBeInTheDocument());
  });

  it('renders all four category type group headings', async () => {
    renderCategories();
    await waitFor(() => {
      expect(screen.getByText('EXPENSE')).toBeInTheDocument();
      expect(screen.getByText('INCOME')).toBeInTheDocument();
      expect(screen.getByText('INVESTMENT')).toBeInTheDocument();
      expect(screen.getByText('TRANSFER')).toBeInTheDocument();
    });
  });

  it('renders category names from the API', async () => {
    renderCategories();
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
      expect(screen.getByText('Stocks')).toBeInTheDocument();
      expect(screen.getByText('Internal')).toBeInTheDocument();
    });
  });

  it('opens the New Category modal', async () => {
    renderCategories();
    await waitFor(() => screen.getByText('Categories'));
    await userEvent.click(screen.getByRole('button', { name: /new category/i }));
    expect(screen.getByRole('heading', { name: 'New Category' })).toBeInTheDocument();
  });

  it('closes the modal on Cancel', async () => {
    renderCategories();
    await waitFor(() => screen.getByText('Categories'));
    await userEvent.click(screen.getByRole('button', { name: /new category/i }));
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('heading', { name: 'New Category' })).not.toBeInTheDocument();
  });

  it('submits a new category and refreshes the list', async () => {
    mockCreateCategory.mockResolvedValue({});
    renderCategories();
    await waitFor(() => screen.getByText('Categories'));

    await userEvent.click(screen.getByRole('button', { name: /new category/i }));

    const nameInput = screen.getByPlaceholderText('e.g. Groceries');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Utilities');
    // Click the submit button inside the modal
    const createBtn = screen.getAllByRole('button', { name: /create category/i })[0];
    await userEvent.click(createBtn);

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Utilities' })
      );
      expect(mockGetCategories).toHaveBeenCalledTimes(2);
    });
  });
});
