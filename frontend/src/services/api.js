import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refresh: (refreshToken) => api.post(`/auth/refresh?refreshToken=${refreshToken}`),
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
