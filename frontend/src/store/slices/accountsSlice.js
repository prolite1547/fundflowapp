import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountService } from '../../services/api';

export const fetchAccounts = createAsyncThunk('accounts/fetchAccounts', async () => {
  const response = await accountService.getAccounts();
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
    applyTransactionBalance: (state, action) => {
      const {
        accountId,
        destinationAccountId,
        amount,
        type
      } = action.payload;
      const sourceAccount = state.items.find((acc) => String(acc.id) === String(accountId));
      const destinationAccount = state.items.find((acc) => String(acc.id) === String(destinationAccountId));

      if (type === 'TRANSFER') {
        if (sourceAccount) {
          sourceAccount.balance -= amount;
        }
        if (destinationAccount) {
          destinationAccount.balance += amount;
        }
        return;
      }

      if (!sourceAccount) {
        return;
      }

      if (type === 'INCOME') {
        sourceAccount.balance += amount;
      } else if (type === 'EXPENSE' || type === 'INVESTMENT') {
        sourceAccount.balance -= amount;
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

export const { applyTransactionBalance } = accountsSlice.actions;
export default accountsSlice.reducer;
