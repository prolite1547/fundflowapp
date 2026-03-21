import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
  clearSession
} from '../utils/session';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
let refreshPromise = null;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const refreshSession = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearSession();
    throw new Error('Missing refresh token');
  }

  refreshPromise = axios
    .post(`${API_URL}/auth/refresh?refreshToken=${refreshToken}`)
    .then((response) => {
      setSessionTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken ?? refreshToken
      });
      return response.data;
    })
    .catch((error) => {
      clearSession();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? '';
    const isAuthRequest = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/refresh');
    const statusCode = error.response?.status;
    const shouldAttemptRefresh = statusCode === 401 || statusCode === 403;

    if (!shouldAttemptRefresh || originalRequest?._retry || isAuthRequest || !getRefreshToken()) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshedSession = await refreshSession();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refresh: (refreshToken) => api.post(`/auth/refresh?refreshToken=${refreshToken}`),
};

export const sessionService = {
  refreshSession,
};

export const accountService = {
  getAccounts: () => api.get('/accounts'),
  createAccount: (accountData) => api.post('/accounts', accountData),
  getBalances: () => api.get('/reports/accounts/balances'),
};

export const transactionService = {
  getTransactions: () => api.get('/transactions'),
  createTransaction: (transactionData) => api.post('/transactions', transactionData),
};

export const categoryService = {
  getCategories: () => api.get('/categories'),
  createCategory: (categoryData) => api.post('/categories', categoryData),
};

export const budgetService = {
  getBudgets: (params) => api.get('/budgets', { params }),
  createBudget: (budgetData) => api.post('/budgets', budgetData),
};

export const reportService = {
  getSummary: (period, params) => api.get(`/reports/summary/${period}`, { params }),
  getBreakdown: (period, params) => api.get(`/reports/breakdown/${period}`, { params }),
  getTrend: (period, params) => api.get(`/reports/trend/${period}`, { params }),
};

export default api;
