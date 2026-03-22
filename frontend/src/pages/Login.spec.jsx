import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();
vi.mock('../services/api', () => ({
  authService: { login: (...args) => mockLogin(...args) },
}));

const mockSetSessionTokens = vi.fn();
vi.mock('../utils/session', () => ({
  setSessionTokens: (...args) => mockSetSessionTokens(...args),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page heading', () => {
    renderLogin();
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
  });

  it('renders email and password inputs', () => {
    renderLogin();
    expect(screen.getByPlaceholderText('Email Address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders the sign in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders a link to the register page', () => {
    renderLogin();
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/register');
  });

  it('allows user to type into fields', async () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText('Email Address');
    const passwordInput = screen.getByPlaceholderText('Password');

    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'secret123');

    expect(emailInput).toHaveValue('user@example.com');
    expect(passwordInput).toHaveValue('secret123');
  });

  it('calls authService.login with email and password on submit', async () => {
    mockLogin.mockResolvedValue({
      data: { accessToken: 'at', refreshToken: 'rt' },
    });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'user@example.com', password: 'pass' });
    });
  });

  it('saves tokens and navigates to "/" on successful login', async () => {
    mockLogin.mockResolvedValue({
      data: { accessToken: 'at', refreshToken: 'rt' },
    });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSetSessionTokens).toHaveBeenCalledWith({ accessToken: 'at', refreshToken: 'rt' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays an error message when login fails', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'bad@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('shows a fallback error message when the response has no message', async () => {
    mockLogin.mockRejectedValue({});
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'bad@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('disables the submit button while loading', async () => {
    let resolveLogin;
    mockLogin.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));
    renderLogin();

    await userEvent.type(screen.getByPlaceholderText('Email Address'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'pass');

    const btn = screen.getByRole('button', { name: /sign in/i });
    userEvent.click(btn);

    await waitFor(() => expect(btn).toBeDisabled());
    resolveLogin({ data: { accessToken: 'at', refreshToken: 'rt' } });
  });
});
