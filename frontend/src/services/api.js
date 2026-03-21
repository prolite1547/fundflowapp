import axios from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setSessionTokens,
  clearSession,
  isTokenExpired
} from '../utils/session';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';
const ACCESS_TOKEN_REFRESH_SKEW_MS = 5 * 1000;
let refreshPromise = null;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

const isAuthRequest = (requestUrl = '') =>
  requestUrl.includes('/auth/login')
  || requestUrl.includes('/auth/register')
  || requestUrl.includes('/auth/refresh');

// Refresh before protected requests when the access token is missing or about to expire.
api.interceptors.request.use(async (config) => {
  const requestUrl = config.url ?? '';
  const refreshToken = getRefreshToken();
  let accessToken = getAccessToken();

  if (!isAuthRequest(requestUrl) && refreshToken && (!accessToken || isTokenExpired(accessToken, ACCESS_TOKEN_REFRESH_SKEW_MS))) {
    const refreshedSession = await refreshSession();
    accessToken = refreshedSession.accessToken;
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url ?? '';
    const statusCode = error.response?.status;
    const shouldAttemptRefresh = statusCode === 401 || statusCode === 403;

    if (!shouldAttemptRefresh || originalRequest?._retry || isAuthRequest(requestUrl) || !getRefreshToken()) {
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
