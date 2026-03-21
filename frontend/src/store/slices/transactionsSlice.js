import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionService } from '../../services/api';
import { applyTransactionBalance } from './accountsSlice';

export const fetchTransactions = createAsyncThunk('transactions/fetchTransactions', async () => {
  const response = await transactionService.getTransactions();
  return response.data;
});

export const addTransactionAction = createAsyncThunk(
  'transactions/addTransaction',
  async (transactionData, { dispatch }) => {
    const response = await transactionService.createTransaction(transactionData);

    dispatch(applyTransactionBalance({
      accountId: transactionData.accountId,
      destinationAccountId: transactionData.destinationAccountId,
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
