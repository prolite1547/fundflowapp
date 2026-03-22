import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockRegister = vi.fn();
vi.mock('../services/api', () => ({
  authService: { register: (...args) => mockRegister(...args) },
}));

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    renderRegister();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('renders full name, email, and password inputs', () => {
    renderRegister();
    expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders a Create Account button', () => {
    renderRegister();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('renders a link to the login page', () => {
    renderRegister();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });

  it('lets the user fill in the form', async () => {
    renderRegister();
    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'John Doe');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'john@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'securepass');
    expect(screen.getByPlaceholderText('Full Name')).toHaveValue('John Doe');
    expect(screen.getByPlaceholderText('Email Address')).toHaveValue('john@example.com');
    expect(screen.getByPlaceholderText('Password')).toHaveValue('securepass');
  });

  it('calls authService.register with form data on submit', async () => {
    mockRegister.mockResolvedValue({});
    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Jane');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'jane@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        fullName: 'Jane',
        email: 'jane@example.com',
        password: 'pass123',
      });
    });
  });

  it('navigates to /login on successful registration', async () => {
    mockRegister.mockResolvedValue({});
    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Jane');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'jane@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows an error message when registration fails', async () => {
    mockRegister.mockRejectedValue({
      response: { data: { message: 'Email already registered' } },
    });
    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('shows a fallback error when the response has no message', async () => {
    mockRegister.mockRejectedValue({});
    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create account')).toBeInTheDocument();
    });
  });

  it('disables the button while loading', async () => {
    let resolveRegister;
    mockRegister.mockImplementation(() => new Promise((resolve) => { resolveRegister = resolve; }));
    renderRegister();

    await userEvent.type(screen.getByPlaceholderText('Full Name'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');

    const btn = screen.getByRole('button', { name: /create account/i });
    userEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
    resolveRegister({});
  });
});
