import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/accounts';

export const fetchAccounts = createAsyncThunk('accounts/fetchAccounts', async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {
    updateBalance: (state, action) => {
      const { id, amount, type } = action.payload;
      const account = state.items.find(acc => acc.id === id);
      if (account) {
        if (type === 'INCOME') {
          account.balance += amount;
        } else if (type === 'EXPENSE' || type === 'INVESTMENT') {
          account.balance -= amount;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { updateBalance } = accountsSlice.actions;
export default accountsSlice.reducer;
