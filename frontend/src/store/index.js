import { configureStore } from '@reduxjs/toolkit';
import accountsReducer from './slices/accountsSlice';
import transactionsReducer from './slices/transactionsSlice';

export const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    transactions: transactionsReducer
  }
});
