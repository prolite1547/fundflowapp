import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { updateBalance } from './accountsSlice';

const API_URL = 'http://localhost:8080/api/transactions';

export const fetchTransactions = createAsyncThunk('transactions/fetchTransactions', async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
});

export const addTransactionAction = createAsyncThunk(
  'transactions/addTransaction',
  async (transactionData, { dispatch }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(API_URL, transactionData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Update local account balance in Redux immediately after success
    dispatch(updateBalance({
      id: transactionData.accountId,
      amount: transactionData.amount,
      type: transactionData.type
    }));
    
    return response.data;
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addTransactionAction.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      });
  }
});

export default transactionsSlice.reducer;
